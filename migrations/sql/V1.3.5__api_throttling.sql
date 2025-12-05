CREATE TABLE
    enmods.api_key_usage (
        api_key uuid NOT NULL,
        window_start timestamp(6) NOT NULL,
        request_count int4 DEFAULT 0 NOT NULL,
        PRIMARY KEY (api_key, window_start),
        CONSTRAINT fk_api_key FOREIGN KEY (api_key) REFERENCES enmods.api_keys (api_key) ON DELETE CASCADE
    );