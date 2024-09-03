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