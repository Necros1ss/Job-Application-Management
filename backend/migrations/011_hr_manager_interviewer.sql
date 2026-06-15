-- Migration: Add hr_managers, interviewers, interview_evaluations tables
-- Also add interviewer_id to interviews table.
-- Fully idempotent: safe to run multiple times.

-- hr_managers table
CREATE TABLE IF NOT EXISTS hr_managers (
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

-- interviewers table
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

-- interview_recommendation type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'interview_recommendation'
  ) THEN
    CREATE TYPE interview_recommendation AS ENUM ('strong_hire', 'hire', 'no_hire', 'strong_no_hire');
  END IF;
END $$;

-- interview_evaluations table
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL,
    interviewer_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT,
    weaknesses TEXT,
    notes TEXT,
    recommendation interview_recommendation,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_evaluation_interview
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_interviewer
      FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

-- Unique constraint for upsert (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_interview_evaluations_interview_interviewer'
  ) THEN
    ALTER TABLE interview_evaluations
    ADD CONSTRAINT uq_interview_evaluations_interview_interviewer
    UNIQUE (interview_id, interviewer_id);
  END IF;
END $$;

-- Add interviewer_id column to interviews (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'interviewer_id'
  ) THEN
    ALTER TABLE interviews ADD COLUMN interviewer_id BIGINT;
  END IF;
END $$;

-- Add FK constraint for interviewer_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_interviews_interviewer'
  ) THEN
    ALTER TABLE interviews
    ADD CONSTRAINT fk_interviews_interviewer
      FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_managers_email ON hr_managers(email);
CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_interview_id ON interview_evaluations(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_interviewer_id ON interview_evaluations(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
