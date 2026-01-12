-- Make the explanation field optional in registration_requests table
-- This allows us to remove it from the UI without breaking existing functionality
ALTER TABLE registration_requests 
ALTER COLUMN explanation DROP NOT NULL;

-- Set default empty string for any existing NULL values
UPDATE registration_requests 
SET explanation = '' 
WHERE explanation IS NULL;
