-- Add image columns to skin_problems table
-- This migration adds support for morning and evening images for each skin problem

ALTER TABLE IF EXISTS public.skin_problems 
ADD COLUMN IF NOT EXISTS image_morning_ar TEXT,
ADD COLUMN IF NOT EXISTS image_morning_en TEXT,
ADD COLUMN IF NOT EXISTS image_evening_ar TEXT,
ADD COLUMN IF NOT EXISTS image_evening_en TEXT,
ADD COLUMN IF NOT EXISTS image_morning_url TEXT,
ADD COLUMN IF NOT EXISTS image_evening_url TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.skin_problems.image_morning_ar IS 'Image URL for morning routine (Arabic version)';
COMMENT ON COLUMN public.skin_problems.image_morning_en IS 'Image URL for morning routine (English version)';
COMMENT ON COLUMN public.skin_problems.image_evening_ar IS 'Image URL for evening routine (Arabic version)';
COMMENT ON COLUMN public.skin_problems.image_evening_en IS 'Image URL for evening routine (English version)';
COMMENT ON COLUMN public.skin_problems.image_morning_url IS 'Fallback image URL for morning routine';
COMMENT ON COLUMN public.skin_problems.image_evening_url IS 'Fallback image URL for evening routine';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skin_problems_images 
ON public.skin_problems (id) 
WHERE image_morning_url IS NOT NULL OR image_evening_url IS NOT NULL;

-- Add sample data with images for the existing skin problems
-- Update these URLs with your actual image URLs
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop'
WHERE name = 'حب الشباب' OR name_en = 'Acne';

UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
WHERE name = 'الجفاف' OR name_en = 'Dry Skin';

UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
WHERE name = 'البقع الداكنة' OR name_en = 'Dark Spots' OR name_en = 'Hyperpigmentation';

UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop'
WHERE name = 'البشرة الدهنية' OR name_en = 'Oily Skin';

UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop'
WHERE name = 'البشرة الحساسة' OR name_en = 'Sensitive Skin';
