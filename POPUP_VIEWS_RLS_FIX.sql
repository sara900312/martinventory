-- ============================================
-- POPUP VIEWS RLS POLICY FIX
-- ============================================
-- This script fixes the issue where popup views are inserted
-- but not showing in the admin panel due to RLS policy restrictions
--
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Check if popup_hero_views table exists
-- If not, create it
CREATE TABLE IF NOT EXISTS public.popup_hero_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID NOT NULL REFERENCES public.popup_hero(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  user_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS on the table
ALTER TABLE public.popup_hero_views ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "popup_views_insert_policy" ON public.popup_hero_views;
DROP POLICY IF EXISTS "popup_views_select_policy" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow anonymous to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow authenticated to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow select views for analytics" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow admin to read all views" ON public.popup_hero_views;

-- Step 4: Create new RLS policies - PERMISSIVE (Allow by default)
-- Allow ANYONE (anonymous or authenticated) to INSERT views
CREATE POLICY "popup_views_insert_all"
ON public.popup_hero_views
FOR INSERT
WITH CHECK (true);

-- Allow ANYONE (anonymous or authenticated) to SELECT views
-- This is critical for the admin panel to see the views!
CREATE POLICY "popup_views_select_all"
ON public.popup_hero_views
FOR SELECT
USING (true);

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_popup_hero_views_popup_id 
ON public.popup_hero_views(popup_id);

CREATE INDEX IF NOT EXISTS idx_popup_hero_views_session_id 
ON public.popup_hero_views(session_id);

CREATE INDEX IF NOT EXISTS idx_popup_hero_views_created_at 
ON public.popup_hero_views(created_at DESC);

-- Step 6: Verify the fix by checking existing views
-- This query should return the data you inserted
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT popup_id) as unique_popups,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.popup_hero_views;

-- Step 7: Detailed view of all recorded views
-- Run this to confirm your data is there
SELECT 
  id,
  popup_id,
  session_id,
  user_id,
  viewed_at,
  created_at
FROM public.popup_hero_views
ORDER BY created_at DESC
LIMIT 20;

-- Step 8: Test query - This is what the admin panel uses
-- If this returns data, the admin panel will work
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
-- DONE! Your popup views should now display
-- ============================================
-- 
-- Next steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Refresh your admin panel in the browser (Ctrl+Shift+R)
-- 3. You should now see the popup views count
--
-- If still not working:
-- - Check browser console (F12) for error messages
-- - Verify your popup is_active = true
-- - Verify your popup start_date is in the past
-- - Check that popup_hero and popup_hero_views tables exist
