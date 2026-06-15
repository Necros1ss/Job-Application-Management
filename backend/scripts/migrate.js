import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function ensureMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  } finally {
    client.release();
  }
}

async function isApplied(name) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT 1 FROM _migrations WHERE name = $1", [name]);
    return res.rows.length > 0;
  } finally {
    client.release();
  }
}

async function markApplied(name) {
  const client = await pool.connect();
  try {
    await client.query("INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
  } finally {
    client.release();
  }
}

async function runMigration(filePath, name) {
  const client = await pool.connect();
  try {
    console.log(`  Running: ${name}`);
    const sql = fs.readFileSync(filePath, "utf8");
    await client.query(sql);
    await markApplied(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ❌ Error in ${name}:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set. Check backend/.env");
    process.exit(1);
  }

  console.log("🔄 Starting migrations...\n");

  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error(`\n❌ Cannot connect to database: ${err.message}`);
    process.exit(1);
  }

  await ensureMigrationsTable();

  const migrationsDir = path.resolve(__dirname, "../migrations");
  
  if (!fs.existsSync(migrationsDir)) {
    console.error("❌ Migrations directory not found");
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);

    if (await isApplied(file)) {
      console.log(`  ⊘ ${file} (already applied)`);
      skipped++;
      continue;
    }

    await runMigration(filePath, file);
    applied++;
  }

  console.log(`\n✅ Done. Applied: ${applied}, Skipped: ${skipped}`);
  await pool.end();
}

migrate().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  pool.end().then(() => process.exit(1));
});
