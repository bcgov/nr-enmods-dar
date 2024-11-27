CREATE TABLE IF NOT EXISTS enmods.file_error_logs (
  file_error_log_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_submission_id UUID NULL,
  file_name varchar(200) NULL,
  original_file_name varchar(200) NULL,
  file_operation_code varchar(200) NULL,
  ministry_contact JSONB NULL,
  error_log JSONB NULL,
  create_utc_timestamp timestamp NOT NULL,
  CONSTRAINT file_submission_id_fk FOREIGN KEY(file_submission_id) REFERENCES enmods.file_submission(submission_id)
);