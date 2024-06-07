CREATE TABLE IF NOT EXISTS enmods.file_submissions (
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
    CONSTRAINT submission_status_code_fk
      FOREIGN KEY(submission_status_code) 
        REFERENCES enmods.submission_status_code(submission_status_code)
);