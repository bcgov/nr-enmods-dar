CREATE TABLE IF NOT EXISTS enmods.aqi_data_classifications (
  aqi_data_classifications_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
INSERT INTO enmods.aqi_data_classifications(
    custom_id, 
    description, 
    create_user_id, 
    create_utc_timestamp, 
    update_user_id, 
    update_utc_timestamp
)
VALUES
(
    'LAB',
    'Lab',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'FIELD_RESULT',
    'Field Result',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'FIELD_SURVEY',
    'Field Survey',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'VERTICAL_PROFILE',
    'Vertical Profile',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'ACTIVITY_RESULT',
    'Activity Result',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'SURROGATE_RESULT',
    'Surrogate Result',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
);
