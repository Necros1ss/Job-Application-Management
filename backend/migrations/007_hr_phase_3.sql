CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    recruiter_id BIGINT NOT NULL,
    application_id BIGINT UNIQUE,
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
    CONSTRAINT fk_employees_candidate
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    CONSTRAINT chk_employees_status
      CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(30) NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_attendance_records_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date),
    CONSTRAINT chk_attendance_status
      CHECK (status IN ('present', 'remote', 'late', 'absent'))
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'annual',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    reviewed_by BIGINT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_leave_requests_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_reviewer
      FOREIGN KEY (reviewed_by) REFERENCES recruiters(id) ON DELETE SET NULL,
    CONSTRAINT chk_leave_request_status
      CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_leave_request_dates
      CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_employees_recruiter_status
ON employees(recruiter_id, status);

CREATE INDEX IF NOT EXISTS idx_employees_candidate_id
ON employees(candidate_id);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
ON attendance_records(employee_id, work_date DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
ON leave_requests(employee_id, status);
