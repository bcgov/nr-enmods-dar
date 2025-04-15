CREATE TABLE IF NOT EXISTS enmods.aqi_obs_status (
  aqi_obs_status_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_submission_id UUID NULL,
  file_name varchar(200) NULL,
  file_operation varchar(200) NULL,
  status_url varchar(750) NULL,
  result_url varchar(750) NULL,
  active_ind boolean NOT NULL DEFAULT true,
  create_utc_timestamp timestamp NOT NULL,
  CONSTRAINT file_submission_id_fk FOREIGN KEY(file_submission_id) REFERENCES enmods.file_submission(submission_id)
);