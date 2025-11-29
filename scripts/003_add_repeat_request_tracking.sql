-- Add columns to track repeat registration requests
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS is_repeat_request BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS previous_request_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_status TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_registration_requests_email_status 
ON registration_requests(email, status);

-- Add a trigger to track deleted users
CREATE TABLE IF NOT EXISTS deleted_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  pin TEXT,
  deleted_at TIMESTAMP DEFAULT NOW(),
  deleted_by TEXT,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_email ON deleted_users(email);
