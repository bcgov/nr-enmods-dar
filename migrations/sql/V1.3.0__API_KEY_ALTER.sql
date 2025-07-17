ALTER TABLE enmods.api_keys
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN email_address SET NOT NULL,
  ALTER COLUMN organization_name SET NOT NULL,
  ALTER COLUMN usage_count SET NOT NULL,
  ALTER COLUMN enabled_ind SET NOT NULL;

CREATE OR REPLACE FUNCTION enmods_set_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.update_utc_timestamp := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_set_update_timestamp
BEFORE UPDATE ON enmods.api_keys
FOR EACH ROW
EXECUTE FUNCTION enmods_set_update_timestamp();