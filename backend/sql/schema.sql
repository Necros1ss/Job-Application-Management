CREATE TYPE user_role AS ENUM ('candidate', 'recruiter');
CREATE TYPE application_status AS ENUM ('applied', 'reviewed', 'accepted', 'rejected');

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
    cv_file_path VARCHAR(255),
    CONSTRAINT fk_candidate_user
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE recruiters (
    id BIGINT PRIMARY KEY,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
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
    CONSTRAINT fk_job_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    job_post_id BIGINT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status application_status NOT NULL DEFAULT 'applied',
    CONSTRAINT fk_app_candidate
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    CONSTRAINT uq_candidate_job UNIQUE (candidate_id, job_post_id)
);

CREATE INDEX idx_job_posts_recruiter_id ON job_posts(recruiter_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_post_id ON applications(job_post_id);