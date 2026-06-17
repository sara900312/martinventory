-- Migration: Add popup target system (page/category/product selection)
-- This migration adds columns to support selecting pages, categories, and products
-- as popup targets instead of just external URLs

-- Step 1: Add new columns to popup_hero table
ALTER TABLE public.popup_hero
ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_id VARCHAR(255) DEFAULT NULL;

-- Step 2: Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'popup_hero' 
  AND column_name IN ('target_type', 'target_id')
ORDER BY ordinal_position;

-- Step 3: Show all columns in popup_hero table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'popup_hero'
ORDER BY ordinal_position;
