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

const MIGRATION_ORDER = [
  { file: "001_create_password_reset_tokens.sql",   name: "Password Reset Tokens" },
  { file: "002_admin_rbac_and_moderation.sql",       name: "Admin RBAC & Moderation" },
  { file: "002_add_candidate_profile_and_cover_letter.sql", name: "Candidate Profile & Cover Letter" },
  { file: "003_recruitment_phase_1.sql",            name: "Recruitment Phase 1" },
  { file: "004_onboarding_phase_2.sql",              name: "Onboarding Phase 2" },
  { file: "005_hr_phase_3.sql",                      name: "HR Phase 3" },
  { file: "006_cv_filesystem_storage.sql",            name: "CV Filesystem Storage" },
  { file: "007_job_posts_advanced_search.sql",        name: "Job Posts Advanced Search" },
  { file: "009_profile_media.sql",                    name: "Profile Media" },
  { file: "hr_manager_interviewer.sql",              name: "HR Managers & Interviewers" },
];

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
    console.log(`  Running: ${name} (${filePath})`);
    await client.query(fs.readFileSync(filePath, "utf8"));
    await markApplied(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    if (err.code === "42P07" || err.code === "42710" || err.code === "23505" ||
        err.message.includes("already exists") || err.message.includes("duplicate key")) {
      await markApplied(name);
      console.log(`  ⊘ ${name} (already applied)`);
    } else {
      throw err;
    }
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
  console.log(`📦 Database: ${dbUrl.replace(/\/\/.*:.*@/, "//***:***@")}`);

  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error(`\n❌ Cannot connect to database: ${err.message}`);
    console.error("   Make sure the database is running: npm run db:up");
    process.exit(1);
  }

  await ensureMigrationsTable();

  const sqlDir = path.resolve(__dirname, "../sql");
  let applied = 0;
  let skipped = 0;

  for (const { file, name } of MIGRATION_ORDER) {
    const filePath = path.join(sqlDir, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ ${name}: file not found (${file}), skipping`);
      skipped++;
      continue;
    }

    if (await isApplied(name)) {
      console.log(`  ⊘ ${name} (already recorded)`);
      skipped++;
      continue;
    }

    await runMigration(filePath, name);
    applied++;
  }

  console.log(`\n✅ Done. Applied: ${applied}, Skipped: ${skipped}`);
  await pool.end();
}

migrate().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  pool.end().then(() => process.exit(1));
});
