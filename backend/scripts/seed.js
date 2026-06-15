import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
});

const DEFAULT_PASSWORD = "Password123";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Admin
    await client.query(`INSERT INTO users (login_name, password_hash, role) VALUES ('admin.seed@example.com', $1, 'admin') ON CONFLICT DO NOTHING`, [passwordHash]);
    
    // Recruiter
    const recRes = await client.query(`INSERT INTO users (login_name, password_hash, role) VALUES ('recruiter.seed@example.com', $1, 'recruiter') ON CONFLICT (login_name) DO UPDATE SET role='recruiter' RETURNING id`, [passwordHash]);
    const recruiterId = recRes.rows[0].id;
    await client.query(`INSERT INTO recruiters (id, company_name, email) VALUES ($1, 'Seed Corp', 'recruiter.seed@example.com') ON CONFLICT DO NOTHING`, [recruiterId]);
    
    // Candidate
    const canRes = await client.query(`INSERT INTO users (login_name, password_hash, role) VALUES ('candidate.seed@example.com', $1, 'candidate') ON CONFLICT (login_name) DO UPDATE SET role='candidate' RETURNING id`, [passwordHash]);
    const candidateId = canRes.rows[0].id;
    await client.query(`INSERT INTO candidates (id, name, email) VALUES ($1, 'Seed Candidate', 'candidate.seed@example.com') ON CONFLICT DO NOTHING`, [candidateId]);

    // 2. Jobs
    const jobRes = await client.query(`INSERT INTO job_posts (recruiter_id, title, description, requirements, location, salary, employment_type, is_active) VALUES ($1, 'Software Engineer', 'Develop cool things', 'React, Node.js', 'Remote', '$100k', 'full_time', true) RETURNING id`, [recruiterId]);
    const jobId = jobRes.rows[0].id;

    // 3. Applications
    await client.query(`INSERT INTO applications (candidate_id, job_post_id, status) VALUES ($1, $2, 'applied')`, [candidateId, jobId]);

    await client.query("COMMIT");
    console.log("✅ Seed completed successfully (Admin, Recruiter, Candidate, Jobs, Applications)");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();