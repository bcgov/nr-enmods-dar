DROP TABLE enmods.ftp_users;

CREATE TABLE enmods.ftp_users (
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


insert into enmods.ftp_users (username, name, email, org_guid, create_user_id, create_utc_timestamp, update_user_id, update_utc_timestamp) 
values ('uploader1', 'test user', 'testuser@email.com', '56e90a60-b00f-4c78-9a88-4c32e6087829', 'system', NOW(), 'system', NOW());