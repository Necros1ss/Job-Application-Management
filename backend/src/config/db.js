import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err.message);
});

export const testDbConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

export const ensureApplicationStatusEnum = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_type t
           JOIN pg_enum e ON e.enumtypid = t.oid
           WHERE t.typname = 'application_status'
             AND e.enumlabel = 'scheduled_interview'
         ) THEN
           ALTER TYPE application_status ADD VALUE 'scheduled_interview' AFTER 'reviewed';
         END IF;
       END $$;`
    );
  } finally {
    client.release();
  }
};

export const ensureApplicationRejectionColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'applications'
             AND column_name = 'rejection_reason'
         ) THEN
           ALTER TABLE applications ADD COLUMN rejection_reason TEXT;
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'applications'
             AND column_name = 'rejection_email_body'
         ) THEN
           ALTER TABLE applications ADD COLUMN rejection_email_body TEXT;
         END IF;
       END $$;`
    );
  } finally {
    client.release();
  }
};

export const ensureAdminUserColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'is_locked'
         ) THEN
           ALTER TABLE users ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false;
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'is_deleted'
         ) THEN
           ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'deleted_at'
         ) THEN
           ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ NULL;
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM pg_type t
           JOIN pg_enum e ON e.enumtypid = t.oid
           WHERE t.typname = 'user_role'
             AND e.enumlabel = 'admin'
         ) THEN
           ALTER TYPE user_role ADD VALUE 'admin';
         END IF;
       END $$;`
    );
  } finally {
    client.release();
  }
};

export const ensureJobModerationColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_type
           WHERE typname = 'job_post_status'
         ) THEN
           CREATE TYPE job_post_status AS ENUM ('active', 'hidden', 'deleted');
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'job_posts'
             AND column_name = 'status'
         ) THEN
           ALTER TABLE job_posts ADD COLUMN status job_post_status NOT NULL DEFAULT 'active';
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'job_posts'
             AND column_name = 'moderated_by'
         ) THEN
           ALTER TABLE job_posts ADD COLUMN moderated_by BIGINT NULL;
         END IF;

         IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'job_posts'
             AND column_name = 'moderated_at'
         ) THEN
           ALTER TABLE job_posts ADD COLUMN moderated_at TIMESTAMPTZ NULL;
         END IF;
       END $$;`
    );
  } finally {
    client.release();
  }
};
