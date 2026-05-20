DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'admin');
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'job_post_status'
  ) THEN
    CREATE TYPE job_post_status AS ENUM ('active', 'hidden', 'deleted');
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS status job_post_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS moderated_by BIGINT NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ NULL;

UPDATE job_posts
SET status = CASE
  WHEN status::text = 'hidden' THEN 'hidden'::job_post_status
  WHEN status::text = 'deleted' THEN 'deleted'::job_post_status
  ELSE 'active'::job_post_status
END;

ALTER TABLE job_posts
  ALTER COLUMN status SET DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_role_locked_deleted ON users(role, is_locked, is_deleted);
CREATE INDEX IF NOT EXISTS idx_job_posts_status_created_at ON job_posts(status, created_at DESC);
