# ⚡ Quick Fix - Popup Views Not Showing

## Problem
Popup views data exists in database but doesn't display in admin panel.

## Quick Fix (2 minutes)

### 1️⃣ Run SQL Script
```
Supabase Dashboard 
  → SQL Editor 
  → New Query 
  → Copy POPUP_VIEWS_RLS_FIX.sql
  → Run (Ctrl+Enter)
```

### 2️⃣ Refresh Admin
```
Admin Panel → Hard Refresh (Ctrl+Shift+R)
```

### ✅ Done!
Popup views should now display.

---

## Verify It Works
1. Press `F12` → Console
2. Should see: `✅ Fetched views: X`
3. No error messages = Success!

---

## If It Still Doesn't Work
1. Refresh browser again
2. Check console for errors
3. Make sure popup is `is_active = true`
4. Visit popup on website first (not admin preview)

---

**File References:**
- Fix Script: `POPUP_VIEWS_RLS_FIX.sql`
- Full Guide: `POPUP_VIEWS_DISPLAY_FIX_GUIDE.md`
