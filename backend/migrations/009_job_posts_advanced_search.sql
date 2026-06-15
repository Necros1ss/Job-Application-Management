CREATE INDEX IF NOT EXISTS idx_job_posts_search
ON job_posts
USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_job_posts_location
ON job_posts(location);

CREATE INDEX IF NOT EXISTS idx_job_posts_employment_type
ON job_posts(employment_type);

CREATE INDEX IF NOT EXISTS idx_job_posts_experience
ON job_posts(experience);
