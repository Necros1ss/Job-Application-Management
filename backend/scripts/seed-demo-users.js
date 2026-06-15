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

const DEMO_USERS = [
  {
    email: "candidate.demo@example.com",
    role: "candidate",
    name: "Demo Candidate",
    phone: "0901234567",
    skills: ["JavaScript", "React", "Node.js"],
    experience: "2 years",
  },
  {
    email: "recruiter.demo@example.com",
    role: "recruiter",
    companyName: "Demo Corp",
    companyDescription: "Leading tech company",
    industry: "Technology",
    companySize: "50-100",
    taxCode: "0123456789",
    location: "Ho Chi Minh City",
    phone: "0901234568",
  },
  {
    email: "admin.demo@example.com",
    role: "admin",
    name: "Demo Admin",
  },
  {
    email: "hr.demo@example.com",
    role: "hr_manager",
    name: "Demo HR Manager",
    department: "Human Resources",
    phone: "0901234569",
  },
  {
    email: "interviewer.demo@example.com",
    role: "interviewer",
    name: "Demo Interviewer",
    specialization: "Technical Interview",
    phone: "0901234570",
  },
];

const DEFAULT_PASSWORD = "Password123";

async function createUser(client, user) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const userResult = await client.query(
    `INSERT INTO users (login_name, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (login_name) DO UPDATE
       SET role = EXCLUDED.role
     RETURNING id`,
    [user.email, passwordHash, user.role]
  );

  return userResult.rows[0].id;
}

async function createCandidateProfile(client, userId, user) {
  await client.query(
    `INSERT INTO candidates (id, name, email, phone, skills, experience)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = COALESCE(EXCLUDED.phone, candidates.phone),
           skills = COALESCE(EXCLUDED.skills, candidates.skills),
           experience = COALESCE(EXCLUDED.experience, candidates.experience)`,
    [userId, user.name, user.email, user.phone || null, user.skills || [], user.experience || null]
  );
}

async function createRecruiterProfile(client, userId, user) {
  await client.query(
    `INSERT INTO recruiters (id, company_name, email, description, industry, company_size, tax_code, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE
       SET company_name = COALESCE(EXCLUDED.company_name, recruiters.company_name),
           description = COALESCE(EXCLUDED.description, recruiters.description),
           industry = COALESCE(EXCLUDED.industry, recruiters.industry),
           company_size = COALESCE(EXCLUDED.company_size, recruiters.company_size),
           tax_code = COALESCE(EXCLUDED.tax_code, recruiters.tax_code),
           phone = COALESCE(EXCLUDED.phone, recruiters.phone)`,
    [
      userId,
      user.companyName,
      user.email,
      user.companyDescription || null,
      user.industry || null,
      user.companySize || null,
      user.taxCode || null,
      user.phone || null,
    ]
  );
}

async function createHrManagerProfile(client, userId, user) {
  await client.query(
    `INSERT INTO hr_managers (id, name, email, department, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, hr_managers.name),
           department = COALESCE(EXCLUDED.department, hr_managers.department),
           phone = COALESCE(EXCLUDED.phone, hr_managers.phone)`,
    [userId, user.name, user.email, user.department || null, user.phone || null]
  );
}

async function createInterviewerProfile(client, userId, user) {
  await client.query(
    `INSERT INTO interviewers (id, name, email, specialization, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, interviewers.name),
           specialization = COALESCE(EXCLUDED.specialization, interviewers.specialization),
           phone = COALESCE(EXCLUDED.phone, interviewers.phone)`,
    [userId, user.name, user.email, user.specialization || null, user.phone || null]
  );
}

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set. Check backend/.env");
    process.exit(1);
  }

  console.log("🔄 Starting demo user seed...\n");
  console.log(`📦 Database: ${dbUrl.replace(/\/\/.*:.*@/, "//***:***@")}`);

  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error(`\n❌ Cannot connect to database: ${err.message}`);
    console.error("   Make sure the database is running: npm run db:up");
    process.exit(1);
  }

  console.log(`\n📝 Creating demo accounts with password: ${DEFAULT_PASSWORD}\n`);

  let created = 0;
  let skipped = 0;

  for (const user of DEMO_USERS) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userId = await createUser(client, user);

      switch (user.role) {
        case "candidate":
          await createCandidateProfile(client, userId, user);
          break;
        case "recruiter":
          await createRecruiterProfile(client, userId, user);
          break;
        case "hr_manager":
          await createHrManagerProfile(client, userId, user);
          break;
        case "interviewer":
          await createInterviewerProfile(client, userId, user);
          break;
        case "admin":
          // Admin only needs users table entry, no profile table
          break;
      }

      await client.query("COMMIT");
      console.log(`  ✓ ${user.role}: ${user.email}`);
      created++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ✗ ${user.role}: ${user.email} - ${err.message}`);
      skipped++;
    } finally {
      client.release();
    }
  }

  console.log(`\n✅ Done. Created: ${created}, Failed: ${skipped}`);
  console.log("\nDemo accounts ready:");
  console.log("  - candidate.demo@example.com (Candidate)");
  console.log("  - recruiter.demo@example.com (Recruiter)");
  console.log("  - admin.demo@example.com (Admin)");
  console.log("  - hr.demo@example.com (HR Manager)");
  console.log("  - interviewer.demo@example.com (Interviewer)");
  console.log(`  Password for all: ${DEFAULT_PASSWORD}`);

  await pool.end();
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  pool.end().then(() => process.exit(1));
});
