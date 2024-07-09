CREATE SEQUENCE enmods.notifications_id_seq;

CREATE TABLE IF NOT EXISTS enmods.notifications (
  id INTEGER NOT NULL DEFAULT nextval('enmods.notifications_id_seq'),
  email varchar(200) NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT TRUE,
  create_user_id varchar(200) NOT NULL,
  create_utc_timestamp timestamp NOT NULL,
  update_user_id varchar(200) NOT NULL,
  update_utc_timestamp timestamp NOT NULL
);
INSERT INTO enmods.notifications (
    email,
    enabled,
    create_user_id,
    create_utc_timestamp,
    update_user_id,
    update_utc_timestamp
  )
VALUES (
    'mtennant@salussystems.com',
    true,
    'MTENNANT',
    (now() at time zone 'utc'),
    'MTENNANT',
    (now() at time zone 'utc')
  );