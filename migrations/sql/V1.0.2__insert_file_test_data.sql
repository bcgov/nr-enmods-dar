DO $$
    DECLARE i integer := 0;
    v_fileName varchar(200);
BEGIN 
    WHILE i < 50 LOOP 
        BEGIN 
            v_fileName := CONCAT('file_', substring(md5(random()::text), 0, 10));
            IF NOT EXISTS (SELECT 1 FROM enmods.file_submissions WHERE file_name = v_fileName) THEN
                INSERT INTO enmods.file_submissions (
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
                VALUES (
                    v_fileName,
                    (now() at time zone 'utc'),
                    'VMANAWAT',
                    'SUBMITTED',
                    'MANAWAT CORP',
                    12,
                    50,
                    true,
                    'THIS IS TEST ERROR LOG',
                    gen_random_uuid(),
                    'VMANAWAT',
                    (now() at time zone 'utc'),
                    'VMANAWAT',
                    (now() at time zone 'utc')
                ); 
            i := i + 1;
            END IF;
        END;
    END LOOP;
END $$