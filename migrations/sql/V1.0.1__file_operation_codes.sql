CREATE TABLE IF NOT EXISTS enmods.file_operation_codes (
    file_operation_code varchar(20) NOT NULL,
    description varchar(250) NOT NULL,
    display_order int4 NOT NULL,
    active_ind boolean DEFAULT true NOT NULL,
    create_user_id varchar(200) NOT NULL,
    create_utc_timestamp timestamp NOT NULL,
    update_user_id varchar(200) NOT NULL,
    update_utc_timestamp timestamp NOT NULL,
    CONSTRAINT file_operation_code_pk PRIMARY KEY (file_operation_code)
);
INSERT INTO enmods.file_operation_codes(
        file_operation_code,
        description,
        display_order,
        active_ind,
        create_user_id,
        create_utc_timestamp,
        update_user_id,
        update_utc_timestamp
    )
values (
        'VALIDATE',
        'Validate',
        0,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    ),
    (
        'IMPORT',
        'Import',
        5,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    );