ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cv_file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cv_mime_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS cv_file_size_bytes INT;

ALTER TABLE application_files
  ADD COLUMN IF NOT EXISTS file_path VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'application_files'
      AND column_name = 'file_data'
  ) THEN
    ALTER TABLE application_files ALTER COLUMN file_data DROP NOT NULL;
  END IF;
END $$;

UPDATE applications a
SET cv_file_name = COALESCE(a.cv_file_name, af.file_name),
    cv_mime_type = COALESCE(a.cv_mime_type, af.mime_type),
    cv_file_size_bytes = COALESCE(a.cv_file_size_bytes, af.file_size_bytes)
FROM application_files af
WHERE af.application_id = a.id
  AND af.file_type = 'cv'
  AND a.cv_file_name IS NULL;
