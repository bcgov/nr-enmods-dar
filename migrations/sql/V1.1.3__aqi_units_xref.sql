CREATE TABLE IF NOT EXISTS enmods.aqi_units_xref (
  edt_unit_guid UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  ems_code INTEGER NULL,
  edt_unit_xref varchar(255) NOT NULL,
  aqi_units_code varchar(255) NOT NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);

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
(445, 'm3/min',	'm³/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(64, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(0, 'None',	'None',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(1, 'mg/L',	'mg/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(2, 'mg/kg',	'mg/kg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(3, 'mg',	'mg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(4, 'us/cm',	'µS/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(5, 'pH units',	'pH units',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(6, 'Col. Unit',	'Col. Unit',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(7, 'NTU',	'NTU',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(8, 'TAC',	'TAC',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(9, 'SWU',	'SWU',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(10, 'mL/L',	'mL/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(11, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(12, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(13, 'g/m2',	'g/m²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(14, 'ug/m3',	'µg/m³',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(15, 'mg/dm2/d',	'mg/dm²/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(16, 'Bq/L',	'Bq/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(17, '#/mL',	'#/mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(18, 'uEq/L',	'µEq/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(19, 'L',	'L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(21, 'ppt',	'ppt',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(22, 'CFU/100mL',	'CFU/100mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(23, 'MPN/100mL',	'MPN/100mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(24, 'm',	'm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(25, 'ug/cm2/d',	'µg/cm²/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(26, 'm3/s',	'm³/s',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(27, 'm3/min',	'm³/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(28, 'kPa',	'kPa',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(29, 't',	't',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(30, 't/d',	't/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(31, 'm/s',	'm/s',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(32, 'degC',	'degC',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(33, 'mV',	'mV',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(34, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(35, 'm3/d',	'm³/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(36, 'mm',	'mm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(39, 'pg/L',	'pg/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(40, 'mg/m3',	'mg/m³',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(42, 'ug/L',	'µg/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(43, 'ug/cm2',	'µg/cm²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(44, 'ug/g',	'µg/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(45, 'pg/g',	'pg/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(200, 'g/L',	'g/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(202, 'ng/L',	'ng/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(205, 'ppm',	'ppm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(207, 'kg/m3',	'kg/m³',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(213, 'ppm',	'ppm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(216, 'ppb',	'ppb',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(220, 'm3',	'm³',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(227, 'mho/cm',	'mho/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(228, 'umho/cm',	'µmho/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(237, 'ft',	'ft',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(240, 'IG/d',	'IG/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(244, 'MIG/d',	'MIG/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(249, 'L/d',	'L/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(250, 'ML/d',	'ML/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(261, 'USG/min',	'USG/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(263, 'm3/min',	'm³/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(264, 'm3/hr',	'm³/hr',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(270, 'm3/s',	'm³/s',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(272, 'ft3/min',	'ft³/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(281, 'mm Hg',	'mm Hg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(286, 'ug/dm2/d',	'µg/dm²/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(289, 'ug/dm2/month',	'µg/dm²/month',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(290, 'mg/dm2/month',	'mg/dm²/month',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(301, 'ug',	'µg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(305, 'mg/g',	'mg/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(309, 'kg/adut',	'kg/adut',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(310, 'mg/kg',	'mg/kg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(311, 'mg/kg',	'mg/kg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(315, 'mg/m²',	'mg/m²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(320, 'Ton/d',	'Ton/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(323, 'kg/d',	'kg/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(335, 'degF',	'degF',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(338, 'm3/month',	'm³/month',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(339, 'm3/week',	'm³/week',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(340, 'm3/yr',	'm³/yr',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(350, 'JTU',	'JTU',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(355, 'MPN/100g',	'MPN/100g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(356, 'L/min',	'L/min',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(358, 'kg/adt',	'kg/adt',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(369, 'adt/d',	'adt/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(374, 'hr',	'hr',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(47, 'MPN/g',	'MPN/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(999, 'Unknown',	'Unknown',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(384, 'ug/mL',	'µg/mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(48, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(455, 't/ha',	't/ha',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(241, 'USG/d',	'USG/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(251, 'tft3/d',	'tft³/d',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(265, 'L/s',	'L/s',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(307, 'kg/t',	'kg/t',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(49, 'ng/L',	'ng/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(46, 'No. Org.',	'No. Org.',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(385, 'Vehicles',	'Vehicles',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(54, 'cells/cm2',	'cells/cm²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(53, 'cells/mL',	'cells/mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(386, 'ug/kg',	'µg/kg',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(55, 'umol/g',	'µmol/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(387, 'No/m2',	'No/m²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(058, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(59, 'pg/g',	'pg/g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(389, '#',	'#',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(60, 'CFU/mL',	'CFU/mL',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(61, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(62, '%',	'%',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(63, 'AU/cm',	'AU/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(66, 'to/s',	'to/s',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(180, 'mEq/L',	'mEq/L',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(65, '%T/cm',	'%T/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(68, 'ppm',	'ppm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(399, 'RFU',	'RFU',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(426, 'ms/cm',	'ms/cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(500, 'day',	'day',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(NULL, 'cm',	'cm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(NULL, 'um',	'µm',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(NULL, 'g/L',	'g',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(NULL, 'm2',	'm²',  'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
,(NULL, 'cm2',	'cm²', 'VMANAWAT', (now() at time zone 'utc'), 'VMANAWAT', (now() at time zone 'utc'))
