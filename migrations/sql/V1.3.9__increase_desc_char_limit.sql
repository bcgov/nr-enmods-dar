ALTER TABLE enmods.aqi_projects
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_mediums
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_collection_methods
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_analysis_methods
ALTER COLUMN method_name TYPE varchar(5000);

ALTER TABLE enmods.aqi_analysis_methods
ALTER COLUMN method_context TYPE varchar(5000);

ALTER TABLE enmods.aqi_extended_attributes
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_locations
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_context_tags
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_laboratories
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_observed_properties
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_detection_conditions
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_result_status
ALTER COLUMN description TYPE varchar(5000);

ALTER TABLE enmods.aqi_result_grade
ALTER COLUMN description TYPE varchar(5000);

