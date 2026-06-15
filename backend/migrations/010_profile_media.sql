ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS avatar_file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_mime_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS avatar_file_size_bytes INT;

ALTER TABLE recruiters
  ADD COLUMN IF NOT EXISTS logo_file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS logo_file_size_bytes INT;
