CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    recruiter_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_onboarding_tasks_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_onboarding_tasks_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    CONSTRAINT chk_onboarding_tasks_status
      CHECK (status IN ('pending', 'in_progress', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_application_id
ON onboarding_tasks(application_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_recruiter_status
ON onboarding_tasks(recruiter_id, status);
