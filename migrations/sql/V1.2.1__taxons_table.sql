CREATE TABLE IF NOT EXISTS enmods.taxonomy_elements (
  edt_taxonomy_element_guid UUID PRIMARY KEY NOT NULL,
  aqi_taxonomy_name varchar(255) NOT NULL,
  aqi_common_name varchar(255) NOT NULL,
  aqi_taxon_level varchar(255) NOT NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);

INSERT INTO enmods.taxonomy_elements(
        edt_taxonomy_element_guid,
        aqi_taxonomy_name,
        aqi_common_name,
        aqi_taxon_level,
        create_user_id,
        create_utc_timestamp,
        update_user_id,
        update_utc_timestamp
    )
values 
('07a7797c-1d17-4fc8-a7f7-0a64738dbedc', 'Cottus',	'Fresh Water Sculpin', 'Genus',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,('786b137d-e953-4a87-88df-8becb48e59a5', 'Oncorhynchus kisutch',	'Coho Salmon', 'Species',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,('f72e13a9-5f08-46bf-a345-fe0c3a775c59', 'Oncorhynchus nerka',	'Sockeye Salmon', 'Species',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,('f4819131-7f68-45a6-a15b-3862326c9e84', 'Oncorhynchus clarkii',	'Cutthroat Trout', 'Species',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,('9feeaa2d-db01-46fc-861e-2a141d774d41', 'Salvelinus malma',	'Dolly Varden', 'Species',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
