DROP TABLE if exists ftp_users;
CREATE TABLE ftp_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    create_user_id VARCHAR(255),
    create_utc_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_user_id VARCHAR(255),
    update_utc_timestamp TIMESTAMP
);


insert into ftp_users (username, name, email, create_user_id, create_utc_timestamp, update_user_id, update_utc_timestamp) values ('testorg', 'Test Organization', 'testorg@email.com', 'system', NOW(), 'system', NOW());