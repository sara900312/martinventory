# Popup Media & Customization - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites ⚠️
Before using file uploads, ensure the storage bucket exists:

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name it: `popup-media`
4. Make it **Public**
5. Click Create

**Note:** Direct URL uploads work immediately without this bucket.

### Step 1: Navigate to Popup Admin
1. Go to your admin panel
2. Click on "Popup Hero" or navigate to `/admin/popups`

### Step 2: Create a New Popup
1. Click "Create Popup" button
2. Fill in the basic details:
   - **Title**: Your popup heading
   - **Description**: Supporting text (optional)

### Step 3: Add Media (Choose One Method)

#### Method A: Add URL Link
1. Scroll to "Or Add Media URL"
2. Paste your image/video URL
3. Click "Add"

#### Method B: Upload File (After Saving)
1. First save the popup
2. Edit it again
3. Drag & drop files or click to browse
4. Watch the progress bar

#### Method C: Use Media Library (After Saving)
1. Save the popup first
2. Click "Show" in Media Library section
3. Click on any previous file to add it

### Step 4: Customize Colors
1. Scroll to "Text & Button Colors"
2. Use color picker for each element:
   - Title color
   - Description color
   - Button color
   - Button text color
3. Check the preview at the bottom

### Step 5: Choose Display Frequency
1. Scroll to "Display Frequency"
2. Select one:
   - **Show Every Time** - Appears on every visit
   - **Show Once Per Customer** - Appears once per browser

### Step 6: Set Schedule & Save
1. Choose start date
2. (Optional) Set end date
3. Toggle "Active" to enable
4. Click "Create Popup"

## 📋 File Format Support

**Supported Image Formats:**
- PNG (.png) ✓
- JPEG (.jpg, .jpeg) ✓
- GIF (.gif) ✓
- WebP (.webp) ✓

**Supported Video Formats:**
- MP4 (.mp4) ✓
- WebM (.webm) ✓
- OGG (.ogv, .ogg) ✓
- QuickTime (.mov, .qt) ✓

**Maximum File Size:** 50MB

## 🎨 Color Customization Tips

### Using Color Picker
1. Click the colored box next to the field
2. Select your color visually
3. Hex code updates automatically

### Using Hex Codes
1. Click in the text field
2. Enter hex code (e.g., #FF5733)
3. Color preview updates instantly

### Pre-made Color Combinations
Try these professional combinations:

**Modern Blue**
- Title: #ffffff (white)
- Description: #e0e0e0 (light gray)
- Button: #2563eb (blue)
- Text: #ffffff (white)

**Vibrant Coral**
- Title: #ffffff (white)
- Description: #f5f5f5 (off-white)
- Button: #ff6b6b (coral)
- Text: #ffffff (white)

**Dark Professional**
- Title: #ffffff (white)
- Description: #d0d0d0 (light gray)
- Button: #1a1a1a (dark)
- Text: #ffffff (white)

## 📱 Display Frequency Explained

### Show Every Time
```
Visit 1: Popup shows ✓
Visit 2: Popup shows ✓
Visit 3: Popup shows ✓
```
Best for: Important announcements, continuous promotions

### Show Once Per Customer
```
Browser A: Popup shows ✓ (first time)
Browser A: Hidden (already seen)
Browser B: Popup shows ✓ (first time)
```
Best for: Welcome offers, exclusive deals

## ⚠️ Important Notes

1. **File uploads are available AFTER saving** - Save popup first, then edit to upload files
2. **URL links work immediately** - Add any image/video URL right away
3. **Once Per Customer is browser-based** - Different browsers = new view
4. **Clear browser data resets tracking** - Users can see it again after clearing data

## 🔧 Troubleshooting

### "File upload is disabled" (grayed out)
✅ **Solution:** Save the popup first, then edit to enable uploads

### Colors don't show in live popup
✅ **Solution:** Clear browser cache and refresh the page

### Media library is empty
✅ **Solution:** Make sure you saved the popup with a popup ID

### "Once Per Customer" shows every time
✅ **Solution:** Check if localStorage is enabled in browser

## 💡 Pro Tips

1. **Test in Preview Mode**: Create a test popup and check it looks good before publishing
2. **Use High-Contrast Colors**: Ensure text is readable against your background
3. **Keep Files Small**: 5-10MB files load faster than 50MB
4. **Name Files Descriptively**: "summer-sale-banner.jpg" instead of "photo_1"
5. **Schedule Off-Peak**: Set end dates to prevent showing outdated popups
6. **Monitor Analytics**: Check popup view stats in the admin panel

## 🎯 Common Use Cases

### Welcome Popup (Show Once Per Customer)
- Title: "Welcome! Get 20% Off"
- Description: "Your first purchase deserves a discount"
- Button: Link to products page
- Colors: Bright and welcoming
- Frequency: Once Per Customer

### Flash Sale (Show Every Time)
- Title: "⚡ 48-Hour Flash Sale!"
- Description: "Up to 70% off selected items"
- Button: Link to sale products
- Colors: Urgent red/orange theme
- Frequency: Show Every Time

### Product Launch (Once Per Customer)
- Title: "🚀 New Product Launch"
- Description: "Check out our latest innovation"
- Button: Link to new product
- Media: Product image/video
- Frequency: Once Per Customer

## 📚 Need Help?

- See [full documentation](./POPUP_MEDIA_FEATURES.md)
- Check your popup's live preview
- Review browser console for errors
- Visit admin analytics to see popup performance
