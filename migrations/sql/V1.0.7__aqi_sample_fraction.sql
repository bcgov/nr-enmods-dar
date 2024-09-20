CREATE TABLE IF NOT EXISTS enmods.aqi_sample_fractions(
  aqi_sample_fractions_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
INSERT INTO enmods.aqi_sample_fractions(
    custom_id, 
    description, 
    create_user_id, 
    create_utc_timestamp, 
    update_user_id, 
    update_utc_timestamp
)VALUES
(
    'TOTAL',
    'Total',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'DISSOLVED',
    'Dissolved',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    'BLANK',
    'Blank',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
);