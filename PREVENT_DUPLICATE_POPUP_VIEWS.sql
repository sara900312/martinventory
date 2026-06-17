-- ============================================
-- PREVENT DUPLICATE POPUP VIEWS
-- ============================================
-- This script adds constraints to prevent the same user/session
-- from being recorded multiple times for the same popup
--
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add a unique constraint to prevent duplicates
-- This ensures that a session can only view a popup once
ALTER TABLE public.popup_hero_views 
ADD CONSTRAINT unique_popup_view_per_session 
UNIQUE (popup_id, session_id);

-- If that fails (constraint already exists), skip it with this:
-- ALTER TABLE public.popup_hero_views 
-- DROP CONSTRAINT IF EXISTS unique_popup_view_per_session,
-- ADD CONSTRAINT unique_popup_view_per_session UNIQUE (popup_id, session_id);

-- Step 2: For authenticated users, also prevent duplicate per user
-- Uncomment if you want to track authenticated users separately:
-- ALTER TABLE public.popup_hero_views 
-- ADD CONSTRAINT unique_popup_view_per_user 
-- UNIQUE (popup_id, user_id) 
-- WHERE user_id IS NOT NULL;

-- Step 3: Verify the constraint was created
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'popup_hero_views'
ORDER BY constraint_name;

-- ============================================
-- WHAT THIS DOES:
-- ============================================
-- ✅ Prevents the same session_id from viewing the same popup_id twice
-- ✅ Each unique combination of (popup_id, session_id) can only exist once
-- ✅ If you try to insert a duplicate, database will reject it automatically
-- ✅ This is handled by the app (useRecordView hook) with duplicate check

-- ============================================
-- BEHAVIOR:
-- ============================================
-- Before: Same user could view popup 100 times = 100 records
-- After: Same user views popup = 1 record (first view recorded, duplicates ignored)

-- ============================================
-- IN THE APP:
-- ============================================
-- The useRecordView hook already handles this:
-- if (error && !error.message.includes('duplicate')) {
--   throw error;
-- }
-- 
-- So duplicates are silently ignored (no error shown to user)

-- ============================================
-- VERIFICATION:
-- ============================================
-- To test, try inserting the same view twice:
-- INSERT INTO popup_hero_views (popup_id, session_id) 
-- VALUES ('d9b40774-f46b-4a79-a111-86a860f27208', 'test-session-123');
--
-- First insert: ✅ Success
-- Second insert: ❌ Error (unique constraint violation)

-- ============================================
-- IF YOU NEED TO REMOVE THE CONSTRAINT:
-- ============================================
-- ALTER TABLE public.popup_hero_views 
-- DROP CONSTRAINT unique_popup_view_per_session;
