-- Create device_sessions table to track user devices and prevent account sharing
CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    login_count INTEGER DEFAULT 1,
    is_trusted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_last_login ON device_sessions(last_login);

-- Comment
COMMENT ON TABLE device_sessions IS 'Tracks user devices to prevent account sharing';
COMMENT ON COLUMN device_sessions.device_fingerprint IS 'Unique identifier for the device based on browser characteristics';
COMMENT ON COLUMN device_sessions.is_trusted IS 'Device is marked as trusted after 3+ logins in a week';
COMMENT ON COLUMN device_sessions.login_count IS 'Total number of logins from this device';
