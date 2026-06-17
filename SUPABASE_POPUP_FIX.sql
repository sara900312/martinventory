-- ============================================
-- POPUP VIEWS FIX - Run in Supabase SQL Editor
-- ============================================

-- Step 1: Add cta_text column to popup_hero if missing
ALTER TABLE public.popup_hero 
ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Learn More';

-- Step 2: Create popup_hero_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.popup_hero_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID NOT NULL REFERENCES public.popup_hero(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  user_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_popup_hero_views_popup_id 
ON public.popup_hero_views(popup_id);

CREATE INDEX IF NOT EXISTS idx_popup_hero_views_session_id 
ON public.popup_hero_views(session_id);

CREATE INDEX IF NOT EXISTS idx_popup_hero_views_created_at 
ON public.popup_hero_views(created_at);

-- Step 4: Enable RLS on popup_hero_views if not already enabled
ALTER TABLE public.popup_hero_views ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Allow anonymous to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow authenticated to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow select views for analytics" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow admin to read all views" ON public.popup_hero_views;

-- Step 6: Create new RLS policies - ALLOW ANONYMOUS AND AUTHENTICATED USERS TO INSERT VIEWS
CREATE POLICY "popup_views_insert_policy"
ON public.popup_hero_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 7: Create policy to allow reading view data (for analytics/admin)
CREATE POLICY "popup_views_select_policy"
ON public.popup_hero_views
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 8: Verify the popup_hero table has all required columns
-- Add missing columns if needed
ALTER TABLE public.popup_hero 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Untitled Popup',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'rectangle',
ADD COLUMN IF NOT EXISTS position VARCHAR(50) DEFAULT 'center',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS title_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS description_color VARCHAR(7) DEFAULT '#f0f0f0',
ADD COLUMN IF NOT EXISTS button_color VARCHAR(7) DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS display_frequency VARCHAR(50) DEFAULT 'always',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 9: Verify data
SELECT 
  COUNT(*) as total_popups,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_popups
FROM public.popup_hero;

SELECT COUNT(*) as total_views FROM public.popup_hero_views;

-- Step 10: Test query - Calculate stats by popup
SELECT 
  p.id,
  p.title,
  COUNT(v.id) as views_count,
  COUNT(DISTINCT v.session_id) as unique_sessions
FROM public.popup_hero p
LEFT JOIN public.popup_hero_views v ON p.id = v.popup_id
GROUP BY p.id, p.title
ORDER BY views_count DESC;

-- ============================================
-- DONE! The tables are now properly configured
-- ============================================
-- 
-- Next steps:
-- 1. Refresh the browser (Ctrl+F5)
-- 2. Visit a page with the popup (HomePage)
-- 3. Check Admin Dashboard > Popups
-- 4. Views should now increment when popup is shown
--
-- Troubleshooting:
-- - If still showing 0 views, check browser console for errors
-- - Ensure popup is "is_active = true"
-- - Ensure popup start_date is in the past
-- - Check RLS policies are correct (Step 6 & 7 above)
