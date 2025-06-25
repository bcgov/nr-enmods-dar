INSERT INTO enmods.aqi_units_xref(
        ems_code,
        edt_unit_xref,
        aqi_units_code,
        create_user_id,
        create_utc_timestamp,
        update_user_id,
        update_utc_timestamp
    )
values
(NULL, 'kg', 'kg', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))