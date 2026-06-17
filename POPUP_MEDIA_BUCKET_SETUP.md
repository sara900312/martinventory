# Popup Media Storage Bucket Setup Guide

## ⚠️ Important: Bucket Creation is Required

The Popup Media Management system requires a **pre-created Supabase Storage bucket**. This bucket must be created in your Supabase Dashboard **before** attempting to upload files.

**Why?** Supabase buckets can only be created server-side, not from the client (browser). This is a security feature.

---

## 📋 Step-by-Step Setup

### Step 1: Log in to Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in with your account
3. Select your project

### Step 2: Navigate to Storage
1. In the left sidebar, click **Storage**
2. You'll see your existing buckets (if any)

### Step 3: Create New Bucket
1. Click the **"Create a new bucket"** button
2. Enter the bucket name: `popup-media`
   - **Important:** Use exactly this name (case-sensitive)
   - Or change `POPUP_MEDIA_BUCKET` in `src/lib/mediaStorageSetup.js` if you use a different name

### Step 4: Configure Access Level
1. **Access level:** Select **Public**
   - This allows direct URL access to uploaded files
   - Without this, file uploads will be stored but URLs won't be accessible

### Step 5: (Optional) Set MIME Type Restrictions
1. You can optionally restrict file types
2. Allowed MIME types:
   - Images: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
   - Videos: `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`
3. If you don't set this, any file type can be uploaded (validation happens on client)

### Step 6: Create the Bucket
1. Click the **"Create bucket"** button
2. Wait for confirmation (usually instant)

### Step 7: Verify Setup
1. You should see `popup-media` in your buckets list
2. Click on it to verify it exists
3. You should see an empty folder

---

## ✅ Verification Checklist

After creating the bucket, verify:

- ✅ Bucket name is `popup-media` (or your custom name)
- ✅ Access level is **Public**
- ✅ Bucket appears in your Supabase Dashboard Storage section
- ✅ You can see the bucket folder when you click on it

---

## 🔧 If You Use a Different Bucket Name

If you already have a bucket or want to use a different name:

1. **Edit the configuration file:**
   ```javascript
   // src/lib/mediaStorageSetup.js
   export const POPUP_MEDIA_BUCKET = 'your-bucket-name'; // Change this
   ```

2. **Use an existing bucket:**
   - You can reuse the `products` bucket if it exists
   - Just change the configuration to: `export const POPUP_MEDIA_BUCKET = 'products';`

---

## 🚀 After Setup: Testing File Upload

Once the bucket is created:

1. Go to your app's Popup Admin page
2. Click "Create Popup"
3. Fill in the form details
4. **Save the popup first** (this generates the popup ID)
5. Edit the popup again
6. The Media Manager section should now allow file uploads
7. Try uploading a test image or adding a URL

---

## 🐛 Troubleshooting

### "Bucket not found" Error
- ✅ Verify bucket exists in Supabase Dashboard
- ✅ Check the bucket name matches `POPUP_MEDIA_BUCKET` in the code
- ✅ Ensure bucket access level is **Public**
- ✅ Refresh your browser

### "Unauthorized" Error
- ✅ Ensure bucket access level is set to **Public**
- ✅ Check Supabase authentication is working
- ✅ Verify you have permission to upload in the bucket

### File Upload Returns 404
- ✅ The bucket doesn't exist
- ✅ Go back to Step 3 and create the bucket
- ✅ Refresh the page after creating the bucket

### Can't See Uploaded Files in Library
- ✅ Save the popup first (generates popup_[id] folder)
- ✅ Check bucket permissions are Public
- ✅ Refresh the Media Library (click Show)
- ✅ Check browser console for errors

---

## 📊 Bucket Structure

Once set up, your bucket will have this structure:

```
popup-media/
├── popup_1/
│   ├── image1.jpg
│   ├── video1.mp4
│   └── image2.png
├── popup_2/
│   ├── banner.jpg
│   └── promo.mp4
└── popup_3/
    └── welcome.gif
```

Each popup gets its own folder (`popup_[id]`) where files are stored.

---

## 🔐 Security Notes

- **Bucket should be Public** for file access, but you can add more granular security:
  - Set RLS (Row Level Security) policies
  - Restrict file types via MIME types
  - Add rate limiting via Supabase functions
- **File validation** happens on the client (50MB limit, format check)
- **Always validate** on the server before processing uploads

---

## 🔄 Changing Bucket Names

If you created the bucket with a different name:

1. Update `src/lib/mediaStorageSetup.js`:
   ```javascript
   // Before
   export const POPUP_MEDIA_BUCKET = 'popup-media';
   
   // After (example)
   export const POPUP_MEDIA_BUCKET = 'my-custom-bucket';
   ```

2. Restart your development server
3. Test file upload again

---

## ✨ Summary

| Task | Status |
|------|--------|
| Create bucket in Supabase | ⚠️ **Required** |
| Name it `popup-media` | ✅ Recommended |
| Set access to **Public** | ✅ **Required** |
| Update code if using different name | ✅ Optional |
| Test file upload | ✅ Recommended |

---

## 📞 Need Help?

- Check the **Error Messages** - they're descriptive
- Review the **Troubleshooting** section above
- Check **browser console** (F12) for detailed errors
- Visit [Supabase Documentation](https://supabase.com/docs/guides/storage) for more info
