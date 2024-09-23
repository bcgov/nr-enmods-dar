CREATE TABLE IF NOT EXISTS enmods.file_error_logs (
  file_error_log_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_submission_id UUID NULL,
  file_name varchar(200) NULL,
  error_log JSONB NULL,
  CONSTRAINT file_submission_id_fk FOREIGN KEY(file_submission_id) REFERENCES enmods.file_submission(submission_id)
);