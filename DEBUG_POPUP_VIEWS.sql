-- ============================================
-- DEBUG POPUP VIEWS - Check what's happening
-- ============================================
-- Run this in your Supabase SQL Editor to diagnose the issue

-- Step 1: Check if popup_hero_views table exists and count views
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT popup_id) as unique_popups,
  COUNT(DISTINCT session_id) as unique_sessions,
  MAX(created_at) as latest_view
FROM public.popup_hero_views;

-- Step 2: List all views in the table
SELECT 
  id,
  popup_id,
  session_id,
  user_id,
  viewed_at,
  created_at
FROM public.popup_hero_views
ORDER BY created_at DESC
LIMIT 50;

-- Step 3: Check popup_hero table - do you have any popups?
SELECT 
  id,
  title,
  is_active,
  start_date,
  end_date,
  created_at
FROM public.popup_hero
ORDER BY created_at DESC;

-- Step 4: Full stats query (what the admin panel shows)
SELECT 
  p.id,
  p.title,
  p.is_active,
  p.start_date,
  COUNT(v.id) as views_count,
  COUNT(DISTINCT v.session_id) as unique_sessions
FROM public.popup_hero p
LEFT JOIN public.popup_hero_views v ON p.id = v.popup_id
GROUP BY p.id, p.title, p.is_active, p.start_date
ORDER BY views_count DESC;

-- Step 5: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'popup_hero_views'
ORDER BY policyname;

-- Step 6: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'popup_hero_views';

-- ============================================
-- What to look for:
-- ============================================
-- 1. Step 1: Should show total_views > 0 (you should have 15 views)
-- 2. Step 2: Should show the actual view records with the popup_id d9b40774-f46b-4a79-a111-86a860f27208
-- 3. Step 3: Should show at least the "شصيشصي" popup
-- 4. Step 4: Should show 15 views for the "شصيشصي" popup
-- 5. Step 5: Should show 2 policies: popup_views_insert_all and popup_views_select_all
-- 6. Step 6: Should show rowsecurity = true

-- ============================================
-- Common issues:
-- ============================================
-- Issue: total_views = 0
-- Cause: No views have been recorded OR they were deleted
-- Fix: Visit your popup on the website to record new views

-- Issue: views_count = 0 even though total_views > 0
-- Cause: popup_id mismatch or RLS policy issue
-- Fix: Check Step 4 query results

-- Issue: Policies not showing
-- Cause: Old policies still exist or RLS disabled
-- Fix: Run POPUP_VIEWS_RLS_FIX.sql
