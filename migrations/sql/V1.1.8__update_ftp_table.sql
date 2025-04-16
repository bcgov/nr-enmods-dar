DROP TABLE enmods.ftp_users;

CREATE TABLE enmods.sftp_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    org_guid UUID NOT NULL,
    create_user_id VARCHAR(255),
    create_utc_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_user_id VARCHAR(255),
    update_utc_timestamp TIMESTAMP
);
