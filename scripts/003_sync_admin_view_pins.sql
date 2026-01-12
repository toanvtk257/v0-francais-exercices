-- Synchronize admin_pin and view_pin for all admins
-- This ensures they use the same PIN for both access and viewing user info

UPDATE users 
SET view_pin = admin_pin 
WHERE role = 'admin' 
AND (view_pin IS NULL OR view_pin != admin_pin);

-- Verify the update
SELECT email, admin_pin, view_pin 
FROM users 
WHERE role = 'admin';
