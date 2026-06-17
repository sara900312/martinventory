# Popup Views Statistics Fix Guide

## Problem
The views count and unique sessions are not displaying in the popup management dashboard.

## Root Causes & Solutions

### 1. ✅ **Code Improvements Applied**
The following improvements have been made to help diagnose and fix the issue:

#### A. Better Error Handling in PopupHero.jsx
- Added proper error catching for view recording
- Better console logging for debugging

#### B. Enhanced Stats Hook (usePopupHero.js)
- Added detailed console logging for debugging
- Auto-refetch every 5 seconds for real-time updates
- Better error messages for RLS policy issues

#### C. Error Logging in AdminPopupPage.jsx
- Added error state tracking
- Console logging of any fetch errors

### 2. 🔍 **Things to Check in Your Supabase Project**

#### A. Verify Table Exists
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this query to verify the table structure:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'popup_hero_views'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (UUID, Primary Key)
- `popup_id` (UUID, Foreign Key → popup_hero.id)
- `session_id` (UUID)
- `user_id` (UUID, Nullable)
- `viewed_at` (Timestamp with timezone, default now())

#### B. Create Table if Missing
If the table doesn't exist, run this SQL in Supabase SQL Editor:

```sql
-- Create popup_hero_views table
CREATE TABLE IF NOT EXISTS public.popup_hero_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID NOT NULL REFERENCES public.popup_hero(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  user_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_popup_hero_views_popup_id 
ON public.popup_hero_views(popup_id);

CREATE INDEX IF NOT EXISTS idx_popup_hero_views_session_id 
ON public.popup_hero_views(session_id);
```

#### C. Check RLS Policies
1. Go to Supabase Dashboard → Authentication → Policies
2. Find `popup_hero_views` table
3. Make sure these policies exist (or allow anonymous access):

**For Anonymous Users (Public Popups):**
```sql
-- Allow anonymous users to INSERT views
CREATE POLICY "Allow anonymous to insert views"
ON public.popup_hero_views
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anyone to SELECT views (for analytics)
CREATE POLICY "Allow select views for analytics"
ON public.popup_hero_views
FOR SELECT
TO authenticated, anon
USING (true);
```

**For Admin Users:**
```sql
-- Allow authenticated admin users to read all views
CREATE POLICY "Allow admin to read all views"
ON public.popup_hero_views
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.admin_users
) OR true);
```

### 3. 🧪 **Testing & Debugging**

#### A. Check Browser Console
1. Open Admin Popup Page
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for messages like:
   - `"Total popups: X Total views: Y"`
   - `"Popup 'Title': X views, Y unique sessions"`
   - Any error messages

#### B. Test View Recording
1. Preview a popup on your website (not the admin preview)
2. Check the browser console for: `"Popup view recorded successfully"`
3. If you see an error, note the error message

#### C. Direct Database Query
In Supabase SQL Editor, run:

```sql
-- Check if views are being recorded
SELECT COUNT(*) as total_views FROM public.popup_hero_views;

-- Check views per popup
SELECT 
  p.title,
  COUNT(v.id) as views_count,
  COUNT(DISTINCT v.session_id) as unique_sessions
FROM public.popup_hero AS p
LEFT JOIN public.popup_hero_views AS v ON p.id = v.popup_id
GROUP BY p.id, p.title
ORDER BY views_count DESC;
```

### 4. 🛠️ **Common Issues & Fixes**

| Issue | Cause | Solution |
|-------|-------|----------|
| "No data" in table | Table doesn't exist | Run the CREATE TABLE SQL above |
| Views = 0 for all | RLS policy blocking inserts | Check RLS policies, ensure `INSERT` is allowed |
| Views recorded but not showing | RLS policy blocking SELECT | Check RLS policies, ensure `SELECT` is allowed |
| Stale data | Caching issue | Clear browser cache, hard refresh (Ctrl+Shift+R) |
| Permission denied error | Admin/auth issue | Verify user role and RLS policies |

### 5. 📊 **After Fixing**

Once the table and RLS policies are set up:

1. **Visit your popup** (on the actual website, not admin preview)
2. The view will be recorded to `popup_hero_views` table
3. Return to Admin Dashboard
4. The views count and unique sessions should now display in the popup cards
5. Check the Console tab to see the calculated statistics

## Quick Checklist

- [ ] Verified `popup_hero_views` table exists in Supabase
- [ ] Checked table has correct columns (popup_id, session_id, etc.)
- [ ] Set up RLS policies for INSERT and SELECT
- [ ] Visited a popup on the website (not admin preview)
- [ ] Checked browser console for success/error messages
- [ ] Refreshed admin page and see views count
- [ ] Verified unique sessions count is calculated correctly

## Support

If you still have issues after following this guide:

1. Share the error message from the browser console
2. Share the SQL query result from the "Direct Database Query" section
3. Verify your RLS policies are correct
4. Make sure the `popup_hero_views` table can be accessed by your user role
