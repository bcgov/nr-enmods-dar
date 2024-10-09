CREATE TABLE IF NOT EXISTS enmods.aqi_imported_data (
  aqi_imported_data_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_name varchar(200) NULL,
  original_file_name varchar(200) NULL,
  imported_guids JSONB NULL,
  create_utc_timestamp timestamp NOT NULL
);