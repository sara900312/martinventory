# Popup Media Bucket Configuration Guide

## Problem
Images and videos are not appearing in popup advertisements (PopupHero component).

## Root Causes

1. **Bucket is not public** - The storage bucket needs to allow public access
2. **CORS headers not configured** - Supabase needs CORS headers for cross-origin requests
3. **Bucket doesn't exist** - The `popup-media` bucket may not be created in Supabase

## Solution: Configure Supabase Storage Bucket

### Step 1: Create/Access the Bucket

1. Go to **[Supabase Dashboard](https://app.supabase.com)**
2. Select your project
3. Go to **Storage** (left sidebar)
4. Look for a bucket named **`popup-media`**

   - If it doesn't exist:
     - Click **"New Bucket"**
     - Name it: `popup-media`
     - Click **Create Bucket**

### Step 2: Make the Bucket Public

1. Click the **`popup-media`** bucket
2. Click the **three dots** (⋮) menu
3. Select **Edit**
4. Toggle **"Public bucket"** to **ON**
5. Click **Save**

**Important**: The bucket must be **Public** for image/video URLs to work!

### Step 3: Configure CORS (if needed)

If you still have issues loading images/videos after making the bucket public:

1. Go to **Supabase Dashboard** → **Project Settings** (bottom left)
2. Go to **API** tab
3. Scroll down to **CORS_ALLOWED_HEADERS**
4. Make sure it includes:
   ```
   Content-Type, Authorization, X-Client-Info, apikey, Accept, Accept-Language
   ```

### Step 4: Verify RLS Policies

1. Click the **`popup-media`** bucket
2. Go to **Policies** tab
3. You should see policies that allow **public access** (anonymous select)

   If not, add a policy:
   - Click **New Policy**
   - Select **For SELECT (reading)**
   - Select **Anonymous access**
   - Leave conditions empty (allow all)
   - Click **Create Policy**

## Testing

### In Browser Console
```javascript
// Test if bucket is accessible
fetch('https://your-project.supabase.co/storage/v1/object/public/popup-media/')
  .then(r => r.ok ? console.log('✓ Bucket is public') : console.log('✗ Bucket access denied'))
```

### Upload a Test Image
1. Go to your **Supabase Storage**
2. Upload a test image to `popup-media` bucket
3. Get the public URL (click the image, copy public URL)
4. Test the URL in a new browser tab
   - Should display the image directly
   - If you get a 403 error, the bucket is not public

### In Admin Panel
1. Go to Admin Panel → Popups
2. Create a new popup or edit existing
3. Upload an image/video in the Media Manager
4. If upload succeeds but image doesn't show, it's a CORS/public access issue

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **403 Forbidden** when accessing URLs | Make bucket public (Step 2) |
| **CORS Error** in browser console | Configure CORS headers (Step 3) |
| **Upload fails** | Check bucket exists and you have permissions |
| **Upload succeeds but image doesn't show** | Verify bucket is public (Step 2) |
| **Local data URLs work but remote don't** | Bucket needs CORS and public access |

## Quick Checklist

- [ ] `popup-media` bucket exists in Supabase Storage
- [ ] Bucket is set to **Public** ✓
- [ ] CORS policies allow public access
- [ ] Can upload files without errors
- [ ] Can access public URL directly in browser
- [ ] Images/videos display in popup

## Environment Setup for Development

If using local Supabase development:

```bash
# Supabase local development
supabase start

# The bucket will be created automatically with public access
# You can upload files via the local dashboard at localhost:54323
```

## Notes

- Public buckets in Supabase allow anyone with the URL to view the content
- Use authentication/RLS if you need private content
- Images are stored with cache control headers for performance
- Maximum file size: 50MB per file (configured in MediaManager.jsx)

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [CORS Configuration](https://supabase.com/docs/guides/storage/buckets/best-practices#cors)
- [Managing Access Levels](https://supabase.com/docs/guides/storage/security/access-control)

---

If you're still having issues after following these steps, check:
1. Browser console for specific error messages
2. Supabase logs for any upload/access errors
3. Network tab to see actual request/response headers
