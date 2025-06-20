DELETE FROM enmods.aqi_units_xref
WHERE ems_code IN (11, 12, 34, 48, 058, 61, 62, 27, 263, 270, 310, 311, 49, 59, 213, 68);

UPDATE enmods.aqi_units_xref
SET edt_unit_xref = 'g'
WHERE edt_unit_code = 'g';


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
(NULL, 'mL', 'mL', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc')),
(NULL, 'uL/mL', 'µL/mL', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc')),
(NULL, 'mg/dscm', 'mg/dscm', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc')),
(NULL, 'tm3/d', 'tm³/d', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))

