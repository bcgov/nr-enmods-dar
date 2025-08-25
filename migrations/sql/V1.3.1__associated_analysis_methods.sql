CREATE TABLE IF NOT EXISTS enmods.aqi_associated_analysis_methods (
  aqi_associated_analysis_method_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  observed_property_id UUID NULL UNIQUE,
  observed_property_name TEXT NULL,
  analysis_methods TEXT[] NULL,
  create_utc_timestamp timestamp NOT NULL
);