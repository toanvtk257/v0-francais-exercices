-- Add instructions field to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS consigne TEXT;

COMMENT ON COLUMN exercises.consigne IS 'Instructions displayed to students before questions';
