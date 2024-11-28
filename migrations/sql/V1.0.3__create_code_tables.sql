CREATE TABLE IF NOT EXISTS enmods.aqi_projects (
  aqi_projects_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_mediums (
  aqi_mediums_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_units (
  aqi_units_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_collection_methods (
  aqi_collection_methods_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_analysis_methods (
  aqi_analysis_methods_id UUID PRIMARY KEY NOT NULL,
  method_id varchar(200) NOT NULL,
  method_name varchar(2000) NULL,
  method_context varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_extended_attributes (
  aqi_extended_attributes_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_locations (
  aqi_locations_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NULL,
  create_utc_timestamp timestamp NULL,
  update_user_id varchar(200) NULL,
  update_utc_timestamp timestamp NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_context_tags (
  aqi_context_tags_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_laboratories (
  aqi_laboratories_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_observed_properties(
  aqi_observed_properties_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_detection_conditions(
  aqi_detection_conditions_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_result_status(
  aqi_result_status_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_result_grade (
  aqi_result_grade_id UUID PRIMARY KEY NOT NULL,
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_field_visits(
  aqi_field_visits_id UUID PRIMARY KEY NOT NULL,
  aqi_field_visit_start_time timestamptz NOT NULL,
  aqi_location_custom_id varchar(200) NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_field_activities(
  aqi_field_activities_id UUID PRIMARY KEY NOT NULL,
  aqi_field_activities_start_time timestamptz NOT NULL,
  aqi_field_activities_custom_id varchar(200) NOT NULL,
  aqi_location_custom_id varchar(200) NOT NULL,
  aqi_field_visit_start_time timestamptz NOT NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
CREATE TABLE IF NOT EXISTS enmods.aqi_specimens(
  aqi_specimens_id UUID PRIMARY KEY NOT NULL,
  aqi_specimens_custom_id varchar(200) NOT NULL,
  aqi_field_activities_start_time timestamptz NOT NULL,
  aqi_field_activities_custom_id varchar(200) NOT NULL,
  aqi_location_custom_id varchar(200) NOT NULL
);