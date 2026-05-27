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
  connectionTimeoutMillis: 30000,
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

export const ensureUserRoleEnum = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_type
           WHERE typname = 'user_role'
         ) THEN
           CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'admin', 'hr_manager', 'interviewer');
         ELSE
           IF NOT EXISTS (
             SELECT 1
             FROM pg_enum e
             JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'user_role'
               AND e.enumlabel = 'admin'
           ) THEN
             ALTER TYPE user_role ADD VALUE 'admin';
           END IF;

           IF NOT EXISTS (
             SELECT 1
             FROM pg_enum e
             JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'user_role'
               AND e.enumlabel = 'hr_manager'
           ) THEN
             ALTER TYPE user_role ADD VALUE 'hr_manager';
           END IF;

           IF NOT EXISTS (
             SELECT 1
             FROM pg_enum e
             JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'user_role'
               AND e.enumlabel = 'interviewer'
           ) THEN
             ALTER TYPE user_role ADD VALUE 'interviewer';
           END IF;
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
      `ALTER TABLE users
         ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
         ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;`
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
       END $$;`
    );

    await client.query(
      `ALTER TABLE job_posts
         ADD COLUMN IF NOT EXISTS status job_post_status NOT NULL DEFAULT 'active',
         ADD COLUMN IF NOT EXISTS moderated_by BIGINT NULL,
         ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ NULL;`
    );

    await client.query(
      `UPDATE job_posts
       SET status = CASE
         WHEN status::text = 'hidden' THEN 'hidden'::job_post_status
         WHEN status::text = 'deleted' THEN 'deleted'::job_post_status
         ELSE 'active'::job_post_status
       END;`
    );

    await client.query(`ALTER TABLE job_posts ALTER COLUMN status SET DEFAULT 'active';`);
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

export const ensurePhaseSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `DO $$
       BEGIN
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS deadline DATE;
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS experience VARCHAR(100);
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100);
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS responsibilities TEXT;
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS requirements TEXT;
         ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS status VARCHAR(20);

         ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_file_path VARCHAR(255);
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_file_name VARCHAR(255);
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_mime_type VARCHAR(120);
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_file_size_bytes INT;
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS rating INTEGER;
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
         ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_email_body TEXT;

         ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience VARCHAR(100);
         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_type VARCHAR(50);
         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_file_name VARCHAR(255);
         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(120);
         ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_file_size_bytes INT;

         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS website VARCHAR(500);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS address VARCHAR(500);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS linkedin VARCHAR(500);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS tax_code VARCHAR(50);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS description TEXT;
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS logo_file_name VARCHAR(255);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(120);
         ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS logo_file_size_bytes INT;
       END $$;`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS application_notes (
         id BIGSERIAL PRIMARY KEY,
         application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
         recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
         note TEXT NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS application_events (
         id BIGSERIAL PRIMARY KEY,
         application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
         actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
         event_type VARCHAR(50) NOT NULL,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS application_files (
         id BIGSERIAL PRIMARY KEY,
         application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
         file_type VARCHAR(30) NOT NULL DEFAULT 'cv',
         file_name VARCHAR(255) NOT NULL,
         file_path VARCHAR(255),
         mime_type VARCHAR(120) NOT NULL,
         file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT uq_application_file_type UNIQUE (application_id, file_type)
       )`
    );

    await client.query(
      `DO $$
       BEGIN
         ALTER TABLE application_files ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);

         IF EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'application_files'
             AND column_name = 'file_data'
         ) THEN
           ALTER TABLE application_files ALTER COLUMN file_data DROP NOT NULL;
         END IF;
       END $$;`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS interviews (
         id BIGSERIAL PRIMARY KEY,
         application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
         recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
         interviewer_id BIGINT,
         interviewer_name VARCHAR(255) NOT NULL,
         interview_datetime TIMESTAMPTZ NOT NULL,
         mode VARCHAR(30) NOT NULL DEFAULT 'online',
         meet_link TEXT,
         location TEXT,
         notes TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT chk_interviews_mode CHECK (mode IN ('online', 'offline'))
       )`
    );

    await client.query(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'application_files'
             AND column_name = 'id'
             AND column_default IS NULL
         ) THEN
           CREATE SEQUENCE IF NOT EXISTS application_files_id_seq OWNED BY application_files.id;
           ALTER TABLE application_files ALTER COLUMN id SET DEFAULT nextval('application_files_id_seq');
           PERFORM setval(
             'application_files_id_seq',
             GREATEST(COALESCE((SELECT MAX(id) FROM application_files), 0), 1),
             true
           );
         END IF;
       END $$;`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS messages (
         id BIGSERIAL PRIMARY KEY,
         sender_recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
         receiver_candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
         job_post_id BIGINT REFERENCES job_posts(id) ON DELETE SET NULL,
         application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
         subject VARCHAR(255) NOT NULL,
         content TEXT NOT NULL,
         is_read BOOLEAN NOT NULL DEFAULT false,
         read_at TIMESTAMPTZ,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS onboarding_tasks (
         id BIGSERIAL PRIMARY KEY,
         application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
         recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         due_date DATE,
         status VARCHAR(30) NOT NULL DEFAULT 'pending',
         completed_at TIMESTAMPTZ,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT chk_onboarding_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed'))
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS employees (
         id BIGSERIAL PRIMARY KEY,
         candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
         recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
         application_id BIGINT UNIQUE REFERENCES applications(id) ON DELETE SET NULL,
         employee_code VARCHAR(50) UNIQUE,
         full_name VARCHAR(255) NOT NULL,
         email VARCHAR(255) NOT NULL,
         phone VARCHAR(20),
         job_title VARCHAR(255),
         department VARCHAR(120),
         employment_type VARCHAR(100),
         start_date DATE,
         status VARCHAR(30) NOT NULL DEFAULT 'active',
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT chk_employees_status CHECK (status IN ('active', 'inactive'))
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS attendance_records (
         id BIGSERIAL PRIMARY KEY,
         employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
         work_date DATE NOT NULL,
         check_in TIME,
         check_out TIME,
         status VARCHAR(30) NOT NULL DEFAULT 'present',
         notes TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date),
         CONSTRAINT chk_attendance_status CHECK (status IN ('present', 'remote', 'late', 'absent'))
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS leave_requests (
         id BIGSERIAL PRIMARY KEY,
         employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
         leave_type VARCHAR(50) NOT NULL DEFAULT 'annual',
         start_date DATE NOT NULL,
         end_date DATE NOT NULL,
         reason TEXT,
         status VARCHAR(30) NOT NULL DEFAULT 'pending',
         reviewed_by BIGINT REFERENCES recruiters(id) ON DELETE SET NULL,
         reviewed_at TIMESTAMPTZ,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT chk_leave_request_status CHECK (status IN ('pending', 'approved', 'rejected')),
         CONSTRAINT chk_leave_request_dates CHECK (end_date >= start_date)
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
         id BIGSERIAL PRIMARY KEY,
         user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         token VARCHAR(255) UNIQUE NOT NULL,
         expires_at TIMESTAMPTZ NOT NULL,
         used BOOLEAN NOT NULL DEFAULT false,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    await client.query(
      `CREATE TABLE IF NOT EXISTS saved_jobs (
         id BIGSERIAL PRIMARY KEY,
         candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
         job_post_id BIGINT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
         saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    await client.query(
      `DELETE FROM saved_jobs a USING saved_jobs b WHERE a.id < b.id AND a.candidate_id = b.candidate_id AND a.job_post_id = b.job_post_id;`
    ).catch(() => {});

    await client.query(
      `ALTER TABLE saved_jobs ADD CONSTRAINT uq_candidate_job_saved UNIQUE (candidate_id, job_post_id);`
    ).catch(() => {});

    await client.query(
      "DO \u0024\u0024\n" +
      "       BEGIN\n" +
      "         IF NOT EXISTS (\n" +
      "           SELECT 1 FROM information_schema.tables\n" +
      "           WHERE table_schema = 'public' AND table_name = 'interviews'\n" +
      "         ) THEN\n" +
      "           CREATE TABLE interviews (\n" +
      "             id BIGSERIAL PRIMARY KEY,\n" +
      "             application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,\n" +
      "             recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,\n" +
      "             interviewer_id BIGINT,\n" +
      "             interviewer_name VARCHAR(255) NOT NULL,\n" +
      "             interview_datetime TIMESTAMPTZ NOT NULL,\n" +
      "             mode VARCHAR(30) NOT NULL DEFAULT 'online',\n" +
      "             meet_link VARCHAR(500),\n" +
      "             location VARCHAR(255),\n" +
      "             notes TEXT,\n" +
      "             created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n" +
      "           );\n" +
      "         END IF;\n" +
      "       END \u0024\u0024;"
    );

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_application_files_application_id ON application_files(application_id);
       CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id);
       CREATE INDEX IF NOT EXISTS idx_application_events_application_created ON application_events(application_id, created_at DESC);
       CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
       CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id ON interviews(recruiter_id);
       CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate_id ON saved_jobs(candidate_id);
       CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_post_id ON saved_jobs(job_post_id);
       CREATE INDEX IF NOT EXISTS idx_messages_receiver_candidate_id ON messages(receiver_candidate_id);
       CREATE INDEX IF NOT EXISTS idx_messages_sender_recruiter_id ON messages(sender_recruiter_id);
       CREATE INDEX IF NOT EXISTS idx_messages_receiver_read_created ON messages(receiver_candidate_id, is_read, created_at DESC);
       CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
       CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_application_id ON onboarding_tasks(application_id);
       CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_recruiter_status ON onboarding_tasks(recruiter_id, status);
       CREATE INDEX IF NOT EXISTS idx_employees_recruiter_status ON employees(recruiter_id, status);
       CREATE INDEX IF NOT EXISTS idx_employees_candidate_id ON employees(candidate_id);
       CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, work_date DESC);
       CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status ON leave_requests(employee_id, status);`
    );

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_job_posts_search
       ON job_posts
       USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));`
    );
  } finally {
    client.release();
  }
};

export const ensureHrManagerInterviewerSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS hr_managers (
         id BIGINT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         email VARCHAR(255) UNIQUE NOT NULL,
         department VARCHAR(255),
         phone VARCHAR(20),
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT fk_hr_manager_user
           FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
       );

       CREATE TABLE IF NOT EXISTS interviewers (
         id BIGINT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         email VARCHAR(255) UNIQUE NOT NULL,
         specialization VARCHAR(255),
         phone VARCHAR(20),
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT fk_interviewer_user
           FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
       );

       CREATE TABLE IF NOT EXISTS interview_evaluations (
         id BIGSERIAL PRIMARY KEY,
         interview_id BIGINT NOT NULL,
         interviewer_id BIGINT NOT NULL,
         rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
         strengths TEXT,
         weaknesses TEXT,
         notes TEXT,
         recommendation VARCHAR(20),
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT fk_evaluation_interview
           FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
         CONSTRAINT fk_evaluation_interviewer
           FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
       );

       DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_recommendation') THEN
           CREATE TYPE interview_recommendation AS ENUM ('strong_hire', 'hire', 'no_hire', 'strong_no_hire');
         END IF;

         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_interview_evaluations_interview_interviewer') THEN
           ALTER TABLE interview_evaluations
           ADD CONSTRAINT uq_interview_evaluations_interview_interviewer
           UNIQUE (interview_id, interviewer_id);
         END IF;

         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'interviews' AND column_name = 'interviewer_id'
         ) THEN
           ALTER TABLE interviews ADD COLUMN interviewer_id BIGINT;
         END IF;

         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'interviews' AND column_name = 'updated_at'
         ) THEN
           ALTER TABLE interviews ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
         END IF;

         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_interviews_interviewer') THEN
           ALTER TABLE interviews
           ADD CONSTRAINT fk_interviews_interviewer
             FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL;
         END IF;
       END $$;

       ALTER TABLE interview_evaluations
       ALTER COLUMN recommendation TYPE interview_recommendation
       USING recommendation::interview_recommendation;

       CREATE INDEX IF NOT EXISTS idx_hr_managers_email ON hr_managers(email);
       CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email);
       CREATE INDEX IF NOT EXISTS idx_interview_evaluations_interview_id ON interview_evaluations(interview_id);
       CREATE INDEX IF NOT EXISTS idx_interview_evaluations_interviewer_id ON interview_evaluations(interviewer_id);
       CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);`
    );
  } finally {
    client.release();
  }
};
