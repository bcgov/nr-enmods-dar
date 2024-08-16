CREATE TABLE IF NOT EXISTS enmods.ftp_users (
  id SERIAL PRIMARY KEY,
  username varchar(200) NOT NULL UNIQUE,
  email varchar(200) NOT NULL,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
INSERT INTO enmods.ftp_users (
    username,
    email,
    create_user_id,
    create_utc_timestamp,
    update_user_id,
    update_utc_timestamp
  )
VALUES (
    'mtennant',
    'mtennant@salussystems.com',
    'system',
    (now() at time zone 'utc'),
    'system',
    (now() at time zone 'utc')
  );