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
        'ERROR',
        'Error',
        0,
        true,
        'VMANAWAT',
        (now() at time zone 'utc'),
        'VMANAWAT',
        (now() at time zone 'utc')
    );