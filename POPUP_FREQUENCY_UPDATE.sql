-- Add frequency_interval column to popup_hero table if it doesn't exist
-- This stores the interval value for the 'interval' display frequency mode

ALTER TABLE public.popup_hero 
ADD COLUMN IF NOT EXISTS frequency_interval INTEGER DEFAULT 5;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'popup_hero' AND column_name = 'frequency_interval';

-- Show all frequency-related columns in popup_hero
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'popup_hero' 
  AND (column_name LIKE '%frequency%' OR column_name = 'display_frequency')
ORDER BY ordinal_position;
