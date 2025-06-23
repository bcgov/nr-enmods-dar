CREATE TABLE IF NOT EXISTS enmods.importer_benchmark (
  submission_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_name varchar(200) NOT NULL,
  original_file_name varchar(200) NOT NULL,
  submission_date timestamp NOT NULL,
  submission_status_code varchar(10) NOT NULL,
  sample_count int4 NULL,
  results_count int4 NULL,
  local_validation_time INTEGER NULL,
  obs_validation_time INTEGER NULL,
  local_import_time INTEGER NULL,
  obs_import_time INTEGER NULL,
  total_time INTEGER NULL
);