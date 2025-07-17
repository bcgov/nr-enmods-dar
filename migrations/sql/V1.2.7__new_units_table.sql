DROP TABLE IF EXISTS enmods.aqi_units_xref;

CREATE TABLE IF NOT EXISTS enmods.aqi_units(
    aqi_units_id UUID PRIMARY KEY NOT NULL,
    custom_id varchar(255) NULL,
    name varchar(255) NOT NULL,
    edt_unit varchar(255) NULL,
    create_user_id varchar(200) NOT NULL,
    create_utc_timestamp timestamp NOT NULL,
    update_user_id varchar(200) NOT NULL,
    update_utc_timestamp timestamp NOT NULL
)