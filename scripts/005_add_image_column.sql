-- Add image column to exercises table for CE exercises with uploaded images
-- This column stores the Cloudinary URL of the uploaded image

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN exercises.image IS 'URL of the image (from Cloudinary) for CE exercises that use images instead of text';
