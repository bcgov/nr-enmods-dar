DO $$
    DECLARE i integer := 0;
    v_fileName varchar(200);
    v_fileExtension text;
    v_submissionDate date;
    v_submissionStatusCode text;
BEGIN 
    WHILE i < 50 LOOP 
        v_submissionDate := date '2022-01-01' + (floor(random() * (date '2024-12-31' - date '2022-01-01'))::int);
        v_submissionStatusCode := CASE floor(random() * 4)::int
            WHEN 0 THEN 'SUBMITTED'
            WHEN 1 THEN 'INPROGRESS'
            WHEN 2 THEN 'VALIDATED'
            WHEN 3 THEN 'REJECTED'
            ELSE 'SUBMITTED'
            END;

        v_fileExtension := CASE floor(random() * 3)::int
            WHEN 0 THEN '.xlsx'
            WHEN 1 THEN '.csv'
            WHEN 2 THEN '.txt'
            ELSE '.xlsx'
            END;  
            
        BEGIN 
            v_fileName := CONCAT('file_', substring(md5(random()::text), 0, 10), v_fileExtension);

            IF NOT EXISTS (SELECT 1 FROM enmods.file_submission WHERE file_name = v_fileName) THEN
                INSERT INTO enmods.file_submission (
                    file_name,
                    original_file_name,
                    submission_date,
                    submitter_user_id,
                    submission_status_code,
                    file_operation_code,
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
                    v_fileName,
                    v_submissionDate,
                    'VMANAWAT',
                    v_submissionStatusCode,
                    'VALIDATE',
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