CREATE TYPE user_role AS ENUM ('candidate', 'recruiter');
CREATE TYPE application_status AS ENUM ('applied', 'reviewed', 'scheduled_interview', 'accepted', 'rejected');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'application_status'
      AND e.enumlabel = 'scheduled_interview'
  ) THEN
    RETURN;
  END IF;

  ALTER TYPE application_status ADD VALUE 'scheduled_interview';
END $$;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    login_name VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    address TEXT,
    skills TEXT[] DEFAULT '{}',
    experience VARCHAR(100),
    job_type VARCHAR(50),
    CONSTRAINT fk_candidate_user
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE recruiters (
    id BIGINT PRIMARY KEY,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    website VARCHAR(500),
    address VARCHAR(500),
    industry VARCHAR(100),
    linkedin VARCHAR(500),
    company_size VARCHAR(50),
    tax_code VARCHAR(50),
    description TEXT,
    CONSTRAINT fk_recruiter_user
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE job_posts (
    id BIGSERIAL PRIMARY KEY,
    recruiter_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deadline DATE,
    experience VARCHAR(100),
    employment_type VARCHAR(100),
    responsibilities TEXT,
    requirements TEXT,
    status varchar(20),
    CONSTRAINT fk_job_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    job_post_id BIGINT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cv_file_path VARCHAR(255),
    cover_letter TEXT,
    status application_status NOT NULL DEFAULT 'applied',
    rejection_reason TEXT,
    rejection_email_body TEXT,
    CONSTRAINT fk_app_candidate
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    CONSTRAINT uq_candidate_job UNIQUE (candidate_id, job_post_id)
);

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    recruiter_id BIGINT NOT NULL,
    interviewer_name VARCHAR(255) NOT NULL,
    interview_datetime TIMESTAMPTZ NOT NULL,
    mode VARCHAR(30) NOT NULL DEFAULT 'online',
    meet_link VARCHAR(500),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_interviews_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id ON interviews(recruiter_id);

CREATE TABLE saved_jobs (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    job_post_id BIGINT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_savedjob_candidate
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_savedjob_job
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_recruiter_id BIGINT NOT NULL,
    receiver_candidate_id BIGINT NOT NULL,
    job_post_id BIGINT,
    application_id BIGINT,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_message_sender_recruiter
      FOREIGN KEY (sender_recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_receiver_candidate
      FOREIGN KEY (receiver_candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_job_post
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE SET NULL,
    CONSTRAINT fk_message_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS application_files (
    id BIGINT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    file_type VARCHAR(30) NOT NULL DEFAULT 'cv',
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
    file_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_application_files_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT uq_application_file_type
    UNIQUE (application_id, file_type)
);

CREATE INDEX IF NOT EXISTS idx_application_files_application_id
ON application_files(application_id);
CREATE INDEX idx_job_posts_recruiter_id ON job_posts(recruiter_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_post_id ON applications(job_post_id);
CREATE INDEX idx_messages_receiver_candidate_id ON messages(receiver_candidate_id);
CREATE INDEX idx_messages_sender_recruiter_id ON messages(sender_recruiter_id);
CREATE INDEX idx_messages_receiver_read_created ON messages(receiver_candidate_id, is_read, created_at DESC);
CREATE INDEX idx_messages_application_id ON messages(application_id);
