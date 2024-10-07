CREATE TABLE IF NOT EXISTS enmods.aqi_preservatives(
  aqi_preservatives_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  custom_id varchar(200) NOT NULL,
  description varchar(2000) NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
INSERT INTO enmods.aqi_preservatives(
    custom_id, 
    description, 
    create_user_id, 
    create_utc_timestamp, 
    update_user_id, 
    update_utc_timestamp
)
VALUES(
    'SULFURIC_ACID',
    'SULFURIC ACID',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'NITRIC_ACID',
    'NITRIC ACID',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'HYDROCHLORIC_ACID',
    'HYDROCHLORIC ACID',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'SODIUM_HYDROXIDE',
    'SODIUM HYDROXIDE',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'ICE',
    'ICE',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'ISOPROPYL_ALCOHOL',
    'ISOPROPYL ALCOHOL',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'MERCURIC_CHLORIDE',
    'MERCURIC CHLORIDE',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'LIQUID_NITROGEN',
    'LIQUID NITROGEN',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'FORMALIN',
    'FORMALIN',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'SODIUM_AZIDE',
    'SODIUM AZIDE',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'FIELD_FREEZE',
    'FIELD FREEZE',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
),
(
    
    'KEEP_DARK',
    'KEEP DARK',
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
);




