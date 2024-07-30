CREATE TABLE IF NOT EXISTS enmods.aqi_projects (
  id UUID PRIMARY KEY NOT NULL,
  customId varchar(200) NOT NULL,
  description varchar(200) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);