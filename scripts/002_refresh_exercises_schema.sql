-- Refresh the exercises table schema to ensure audio_url column is recognized
-- This script can be run to force Supabase to refresh its schema cache

-- First, verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'audio_url'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE exercises ADD COLUMN audio_url TEXT;
  END IF;
END $$;

-- Add a comment to trigger schema cache refresh
COMMENT ON COLUMN exercises.audio_url IS 'URL of the audio file for listening comprehension exercises';

-- Optionally, you can also refresh the entire schema
SELECT pg_notify('pgrst', 'reload schema');
