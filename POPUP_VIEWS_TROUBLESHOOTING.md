# Popup Views Showing "0" and "0 unique" - Complete Fix Guide

## 🔧 Step 1: Set Up Database Tables and RLS Policies

### A. Run the SQL Fix Script
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste ALL content from: `SUPABASE_POPUP_FIX.sql`
5. Click **"Run"** button
6. Wait for completion (should see green checkmarks)

### B. What the SQL Script Does
- ✅ Creates `popup_hero_views` table if missing
- ✅ Adds missing columns to `popup_hero` table
- ✅ Creates database indexes for fast queries
- ✅ Sets up RLS (Row Level Security) policies for INSERT and SELECT
- ✅ Verifies the structure with test queries

### C. Verify the Setup
After running the script, scroll down to the bottom and check the test queries:
```
📊 Results should show:
- Total popups: X
- Active popups: X
- Total views: X (will be 0 initially)
- Stats by popup (views_count and unique_sessions for each)
```

---

## 🧪 Step 2: Verify the Code Changes

All the following improvements have been made to your code:

### A. Better Error Logging
- ✅ `src/components/popup/PopupHero.jsx` - Improved error messages in console
- ✅ `src/hooks/usePopupHero.js` - Debug logging for stats calculation
- ✅ `src/lib/popupHeroSessionId.js` - Better session ID generation

### B. What to Expect in Browser Console
When everything works correctly, you should see messages like:
```
Generated new session ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Active popup found: "Your Popup Title"
✅ Popup view recorded successfully
   Popup ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Session ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Total popups: 2 Total views: 5
Popup "Your Popup Title": 5 views, 3 unique sessions
```

---

## 🔍 Step 3: Test the System

### A. Create a Test Popup
1. Go to **Admin Dashboard** → **Popup Hero**
2. Click **"Create Popup"**
3. Fill in the form:
   - **Title**: "Test Popup"
   - **Description**: "Test Description"
   - **Button Text**: "Learn More"
   - **Layout Type**: Square
   - **Active**: ✅ Check this
   - **Start Date**: Set to **TODAY** (or earlier)
   - **End Date**: Leave empty (or set to future date)
4. Click **"Create Popup"**

### B. View the Popup on Website
1. Open your website homepage in a **NEW BROWSER TAB** or **PRIVATE/INCOGNITO WINDOW**
2. Look for the popup to appear
3. Open **Developer Tools** (F12)
4. Go to **Console** tab
5. Look for the success messages above

### C. Test View Recording
1. If popup appears, it should record a view
2. Check browser console for: `"✅ Popup view recorded successfully"`
3. Close the popup and refresh the page
4. The popup should NOT appear again (display frequency)

### D. Check Admin Dashboard
1. Go back to **Admin Dashboard** → **Popup Hero**
2. Look at the popup card
3. Should see:
   - Eye icon with **1** (views count)
   - Users icon with **1 unique** (unique sessions)

---

## ❌ Troubleshooting: Still Showing 0 Views?

### Issue 1: Popup Not Appearing on Website

**Symptoms**: Popup doesn't show on homepage

**Check Points**:
1. Open browser console (F12)
2. Look for any error messages starting with ❌
3. Check if you see: `"No active popup found. Check:"`

**Solutions**:
```
☑️ Popup is_active = true
☑️ Start date is in the past
☑️ End date is in the future or empty
☑️ Browser isn't blocking the popup
```

**Fix**:
1. Go to Admin Dashboard
2. Edit your popup
3. Make sure ALL above checkmarks are correct
4. Save
5. Hard refresh homepage (Ctrl+Shift+R)

---

### Issue 2: Popup Shows But No Views Recorded

**Symptoms**: Popup appears but console shows error

**Check Points**:
1. Browser console should show error like:
   - `"Error recording popup view: ..."`
   - `"RLS Policy Issue: Cannot insert view"`

**Solutions**:

#### A. Check RLS Policies in Supabase
1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Policies**
3. Find **"popup_hero_views"** table
4. Should have 2 policies:
   - `popup_views_insert_policy` (for INSERT)
   - `popup_views_select_policy` (for SELECT)

**If missing, run this SQL**:
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow anonymous to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow authenticated to insert views" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow select views for analytics" ON public.popup_hero_views;
DROP POLICY IF EXISTS "Allow admin to read all views" ON public.popup_hero_views;

-- Create new policies
CREATE POLICY "popup_views_insert_policy"
ON public.popup_hero_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "popup_views_select_policy"
ON public.popup_hero_views
FOR SELECT
TO anon, authenticated
USING (true);
```

#### B. Check Table Structure
Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'popup_hero_views'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (UUID)
- `popup_id` (UUID)
- `session_id` (UUID)
- `user_id` (UUID)
- `viewed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

---

### Issue 3: Stats Show in Admin But Website Popup Doesn't Display

**Symptoms**: Admin shows views but popup not visible to users

**Possible Causes**:
- z-index issue (popup hidden behind other elements)
- CSS issue (popup width/height = 0)
- Display frequency blocking it

**Solutions**:
1. Check browser console for any CSS errors
2. Check if popup is hidden with CSS: `display: none` or `visibility: hidden`
3. Try editing popup and changing layout from "Square" to "Rectangle"
4. Check if display_frequency is preventing it:
   ```
   - "always" = always show
   - "once_per_session" = show once per page load
   - "once_per_customer" = show once until browser storage cleared
   ```

---

### Issue 4: Getting "Permission Denied" Error

**Error Message**: 
```
"User does not have permission to insert on table 'popup_hero_views'"
```

**Solution**:
1. Make sure RLS policies exist (see Issue 2 above)
2. Policies must allow BOTH:
   - `anon` (anonymous/public users)
   - `authenticated` (logged-in users)
3. Run the SQL from Issue 2 section B

---

## 📊 Advanced Debugging

### A. Test Database Inserts Directly
Run this in Supabase SQL Editor:
```sql
-- Insert a test view
INSERT INTO public.popup_hero_views (popup_id, session_id)
SELECT id, '11111111-1111-1111-1111-111111111111'::uuid
FROM public.popup_hero
LIMIT 1;

-- Check if it was inserted
SELECT * FROM public.popup_hero_views 
WHERE session_id = '11111111-1111-1111-1111-111111111111';

-- Clean up
DELETE FROM public.popup_hero_views 
WHERE session_id = '11111111-1111-1111-1111-111111111111';
```

### B. Monitor Live Database Changes
1. In Supabase Dashboard
2. Go to **SQL Editor** → **New Query**
3. Run: `SELECT * FROM public.popup_hero_views ORDER BY created_at DESC LIMIT 10;`
4. Open your website in another tab
5. Trigger the popup view
6. Re-run the query
7. Should see new row appear

### C. Check Session ID Generation
In browser console, run:
```javascript
// Check current session ID
sessionStorage.getItem('popup_hero_session_id')

// Check viewed popups
sessionStorage.getItem('popup_hero_viewed')

// Check once-per-customer tracking
localStorage.getItem('popup_YOUR_POPUP_ID_viewed')
```

---

## ✅ Final Checklist

- [ ] Ran `SUPABASE_POPUP_FIX.sql` in Supabase SQL Editor
- [ ] Verified tables exist and RLS policies are created
- [ ] Created a test popup with is_active = true
- [ ] Visited homepage in new browser/incognito window
- [ ] Popup appeared on homepage
- [ ] Browser console shows success messages
- [ ] Views count increments in admin dashboard
- [ ] Unique sessions count is correct
- [ ] Views stop incrementing on refresh (expected behavior)

---

## 🎯 What Should Happen

1. **First Visit** (New Session):
   - Popup appears
   - View recorded
   - Admin shows: 1 view, 1 unique

2. **Refresh Page** (Same Session):
   - Popup still shows ✅
   - View NOT recorded (marked as viewed)
   - Admin still shows: 1 view, 1 unique

3. **New Browser Tab/Incognito** (New Session):
   - Popup appears
   - View recorded
   - Admin shows: 2 views, 2 unique

4. **Refresh Multiple Times**:
   - Views stay at 2 (not incrementing)
   - This is correct behavior (prevents spam)

---

## 🆘 Still Not Working?

If you've completed all steps and still have issues:

1. **Clear All Browser Data**:
   - Press F12 → Application tab
   - Clear sessionStorage
   - Clear localStorage
   - Hard refresh (Ctrl+Shift+R)

2. **Check Console for Specific Errors**:
   - Take a screenshot of the error message
   - This tells you exactly what's wrong

3. **Verify Supabase Connection**:
   - Go to Admin Dashboard (any page)
   - If it loads, Supabase is connected
   - If it doesn't, check Supabase credentials

4. **Test with Simple Query**:
   - In browser console: `console.log(document.querySelector('[data-loc]'))`
   - If it returns something, the app is loaded
   - Otherwise, there's a page load issue

---

## 📝 Notes

- Views are tracked per **session** (not per user account)
- Session ID is stored in `sessionStorage` (cleared when tab closes)
- "Once per customer" tracking uses `localStorage` (persists longer)
- Display frequency prevents re-recording same view multiple times
- RLS policies allow **anyone** (anon or authenticated) to record views
- Admin can see all views regardless of who recorded them

---

**Last Updated**: 2024
**Status**: All fixes implemented ✅
