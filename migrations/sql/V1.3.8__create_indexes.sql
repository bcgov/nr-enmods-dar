-- Create indexes for better query performance
-- This migration adds indexes on commonly queried columns and foreign keys
-- file_submission table indexes
CREATE INDEX IF NOT EXISTS idx_file_submission_submitter_user_id ON enmods.file_submission (submitter_user_id);

CREATE INDEX IF NOT EXISTS idx_file_submission_submission_status_code ON enmods.file_submission (submission_status_code);

CREATE INDEX IF NOT EXISTS idx_file_submission_file_operation_code ON enmods.file_submission (file_operation_code);

CREATE INDEX IF NOT EXISTS idx_file_submission_submission_date ON enmods.file_submission (submission_date);

CREATE INDEX IF NOT EXISTS idx_file_submission_organization_guid ON enmods.file_submission (organization_guid);

CREATE INDEX IF NOT EXISTS idx_file_submission_active_ind ON enmods.file_submission (active_ind);

-- Composite index for common queries filtering by status and date
CREATE INDEX IF NOT EXISTS idx_file_submission_status_date ON enmods.file_submission (submission_status_code, submission_date);

-- file_error_logs table indexes
CREATE INDEX IF NOT EXISTS idx_file_error_logs_file_submission_id ON enmods.file_error_logs (file_submission_id);

CREATE INDEX IF NOT EXISTS idx_file_error_logs_create_utc_timestamp ON enmods.file_error_logs (create_utc_timestamp);

-- notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_email ON enmods.notifications (email);

CREATE INDEX IF NOT EXISTS idx_notifications_enabled ON enmods.notifications (enabled);

-- api_keys table indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON enmods.api_keys (api_key);

CREATE INDEX IF NOT EXISTS idx_api_keys_username ON enmods.api_keys (username);

CREATE INDEX IF NOT EXISTS idx_api_keys_email_address ON enmods.api_keys (email_address);

CREATE INDEX IF NOT EXISTS idx_api_keys_enabled_ind ON enmods.api_keys (enabled_ind);

CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_date ON enmods.api_keys (revoked_date);

-- api_key_usage table indexes
CREATE INDEX IF NOT EXISTS idx_api_key_usage_window_start ON enmods.api_key_usage (window_start);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_window ON enmods.api_key_usage (api_key, window_start);

-- aqi_imported_data table indexes
CREATE INDEX IF NOT EXISTS idx_aqi_imported_data_file_name ON enmods.aqi_imported_data (file_name);

CREATE INDEX IF NOT EXISTS idx_aqi_imported_data_create_utc_timestamp ON enmods.aqi_imported_data (create_utc_timestamp);

-- aqi_obs_status table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_aqi_obs_status_guid ON enmods.aqi_obs_status (aqi_obs_status_guid);

-- common timestamp indexes for querying recent records
CREATE INDEX IF NOT EXISTS idx_file_submission_create_utc_timestamp ON enmods.file_submission (create_utc_timestamp);

CREATE INDEX IF NOT EXISTS idx_file_submission_update_utc_timestamp ON enmods.file_submission (update_utc_timestamp);

CREATE INDEX IF NOT EXISTS idx_api_keys_create_utc_timestamp ON enmods.api_keys (create_utc_timestamp);

CREATE INDEX IF NOT EXISTS idx_api_keys_last_used_date ON enmods.api_keys (last_used_date);

-- Composite index for API key lookups by username and enabled status
CREATE INDEX IF NOT EXISTS idx_api_keys_username_enabled ON enmods.api_keys (username, enabled_ind);