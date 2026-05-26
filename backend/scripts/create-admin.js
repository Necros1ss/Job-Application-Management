/**
 * CLI script to create an admin user.
 * 
 * Usage:
 *   node scripts/create-admin.js <email> <password>
 * 
 * Example:
 *   node scripts/create-admin.js admin@example.com MySecurePassword123
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  console.error("Please set it in your .env file.");
  process.exit(1);
}

function validateArgs() {
  if (process.argv.length < 4) {
    console.error("Usage: node scripts/create-admin.js <email> <password>");
    console.error("Example: node scripts/create-admin.js admin@example.com MySecurePassword123");
    process.exit(1);
  }

  const email = process.argv[2].trim().toLowerCase();
  const password = process.argv[3];

  if (!email || !email.includes("@")) {
    console.error("ERROR: Please provide a valid email address.");
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error("ERROR: Password must be at least 8 characters long.");
    process.exit(1);
  }

  return { email, password };
}

async function createAdmin(email, password) {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 1,
  });

  const client = await pool.connect();

  try {
    // Check if user already exists
    const existingUser = await client.query(
      "SELECT id, role FROM users WHERE login_name = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.role === "admin") {
        console.log(`Admin user '${email}' already exists.`);
        console.log(`User ID: ${user.id}`);
        return;
      } else {
        console.error(`ERROR: User '${email}' already exists with role '${user.role}'.`);
        console.error("Cannot convert existing users to admin. Please use a different email.");
        process.exit(1);
      }
    }

    await client.query("BEGIN");

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    const result = await client.query(
      `INSERT INTO users (login_name, password_hash, role)
       VALUES ($1, $2, 'admin')
       RETURNING id, role, created_at`,
      [email, passwordHash]
    );

    const adminUser = result.rows[0];

    await client.query("COMMIT");

    console.log("=".repeat(50));
    console.log("Admin user created successfully!");
    console.log("=".repeat(50));
    console.log(`Email:    ${email}`);
    console.log(`User ID:  ${adminUser.id}`);
    console.log(`Role:     ${adminUser.role}`);
    console.log(`Created:  ${adminUser.created_at}`);
    console.log("=".repeat(50));
    console.log("You can now login at the app with these credentials.");
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      console.error(`ERROR: User '${email}' already exists.`);
    } else {
      console.error("ERROR: Failed to create admin user:", error.message);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
const { email, password } = validateArgs();
createAdmin(email, password)
  .then(() => {
    console.log("Done.");
  })
  .catch((error) => {
    console.error("Unexpected error:", error.message);
    process.exit(1);
  });
