CREATE TABLE
  enmods.api_keys (
    api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    api_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid (),
    username VARCHAR(200),
    email_address VARCHAR(200),
    organization_name VARCHAR(512),
    last_used_date TIMESTAMP(6),
    usage_count INT DEFAULT 0,
    revoked_date TIMESTAMP(6),
    revoked_by VARCHAR(512),
    enabled_ind BOOLEAN DEFAULT TRUE,
    create_user_id VARCHAR(200) NOT NULL,
    create_utc_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    update_user_id VARCHAR(200) NOT NULL,
    update_utc_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
  );