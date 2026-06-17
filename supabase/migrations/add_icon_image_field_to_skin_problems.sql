-- Add icon_image_url field to replace emoji
-- This migration adds an image URL field for displaying custom icons instead of emoji

ALTER TABLE IF EXISTS public.skin_problems 
ADD COLUMN IF NOT EXISTS icon_image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.skin_problems.icon_image_url IS 'Custom icon/image URL to display instead of emoji (replaces emoji field)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_skin_problems_icon_image 
ON public.skin_problems (id) 
WHERE icon_image_url IS NOT NULL;

-- Update existing skin problems with icon image URLs
-- These are small icon/logo images (recommended 64x64 to 128x128)

UPDATE public.skin_problems
SET icon_image_url = 'https://images.unsplash.com/photo-1583203518149-87b3ba5b2b73?w=128&h=128&fit=crop'
WHERE name = 'حب الشباب' OR name_en = 'Acne';

UPDATE public.skin_problems
SET icon_image_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=128&h=128&fit=crop'
WHERE name = 'جفاف البشرة' OR name_en = 'Dry Skin';

UPDATE public.skin_problems
SET icon_image_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=128&h=128&fit=crop'
WHERE name = 'فرط التصبغ' OR name_en = 'Hyperpigmentation';

UPDATE public.skin_problems
SET icon_image_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=128&h=128&fit=crop'
WHERE name = 'البشرة الدهنية' OR name_en = 'Oily Skin';

UPDATE public.skin_problems
SET icon_image_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=128&h=128&fit=crop'
WHERE name = 'البشرة الحساسة' OR name_en = 'Sensitive Skin';
