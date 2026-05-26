import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

async function fixEnum() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check current enum values
    const before = await client.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumsortorder"
    );
    console.log("Before:", before.rows.map((r) => r.enumlabel).join(", "));

    // Add missing values
    const missingValues = ["hr_manager", "interviewer"];
    for (const val of missingValues) {
      const exists = await client.query(
        "SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = $1",
        [val]
      );
      if (exists.rows.length === 0) {
        await client.query(`ALTER TYPE user_role ADD VALUE '${val}'`);
        console.log(`Added: ${val}`);
      } else {
        console.log(`Already exists: ${val}`);
      }
    }

    // Verify
    const after = await client.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumsortorder"
    );
    console.log("After:", after.rows.map((r) => r.enumlabel).join(", "));

    await client.query("COMMIT");
    console.log("Done!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixEnum();
