CREATE TABLE IF NOT EXISTS enmods.file_submission (
  submission_id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  file_name varchar(200) NOT NULL,
  submission_date timestamp NOT NULL,
  submitter_user_id varchar(200) NOT NULL,
  submission_status_code varchar(10) NOT NULL,
  submitter_agency_name varchar(200) NOT NULL,
  sample_count int4 NULL,
  results_count int4 NULL,
  active_ind boolean NOT NULL DEFAULT true,
  error_log text NULL,
  organization_guid UUID NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL,
  CONSTRAINT submission_status_code_fk FOREIGN KEY(submission_status_code) REFERENCES enmods.submission_status_code(submission_status_code)
);
insert
	into
	enmods.file_submission (
                    file_name,
	submission_date,
	submitter_user_id,
	submission_status_code,
	submitter_agency_name,
	sample_count,
	results_count,
	active_ind,
	error_log,
	organization_guid,
	create_user_id,
	create_utc_timestamp,
	update_user_id,
	update_utc_timestamp
                )
values (
    'TEST_MASTER_FILE-478d88d6-53af-4c77-bd73-c484dd6e3bba.xlsx',
    (now() at time zone 'utc'),
    'VMANAWAT',
    'QUEUED',
    'SALUSSYSTEMS',
    0,
    0,
    true,
    'THIS IS TEST ERROR LOG',
    gen_random_uuid(),
    'VMANAWAT',
    (now() at time zone 'utc'),
    'VMANAWAT',
    (now() at time zone 'utc')
); 