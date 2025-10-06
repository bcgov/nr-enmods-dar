ALTER TABLE enmods.submission_status_code
ALTER COLUMN submission_status_code TYPE varchar(250);

ALTER TABLE enmods.file_submission
ALTER COLUMN submission_status_code TYPE varchar(250);

ALTER TABLE enmods.importer_benchmark
ALTER COLUMN submission_status_code TYPE varchar(250);

INSERT INTO enmods.submission_status_code(
        submission_status_code,
        description,
        display_order,
        active_ind,
        create_user_id,
        create_utc_timestamp,
        update_user_id,
        update_utc_timestamp
    )
values (
        'ROLLBACK ERR',
        'Rollback Error',
        0,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    );