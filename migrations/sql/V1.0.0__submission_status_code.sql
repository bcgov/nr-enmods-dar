CREATE SCHEMA IF NOT EXISTS enmods;
CREATE TABLE IF NOT EXISTS enmods.submission_status_code (
    submission_status_code varchar(20) NOT NULL,
    description varchar(250) NOT NULL,
    display_order int4 NOT NULL,
    active_ind boolean DEFAULT true NOT NULL,
    create_user_id varchar(200) NOT NULL,
    create_utc_timestamp timestamp NOT NULL,
    update_user_id varchar(200) NOT NULL,
    update_utc_timestamp timestamp NOT NULL,
    CONSTRAINT submission_status_code_pk PRIMARY KEY (submission_status_code)
);
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
        'SUBMITTED',
        'Submitted',
        0,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    ), 
    (
        'INPROGRESS',
        'In Progress',
        5,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    ),
    (
        'VALIDATED',
        'Validated',
        10,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    ),
    (
        'REJECTED',
        'Rejected',
        15,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    );
    