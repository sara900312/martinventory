# Popup Hero - Quick Start Guide

## 🚀 Getting Started

### Step 1: Access the Admin Dashboard
1. Log in with your admin/assistant account
2. Navigate to `/admin/popups`
3. You should see the Popup Hero Management System dashboard

### Step 2: Create Your First Popup

Click the **"Create Popup"** button and fill in the form:

#### Required Fields
- **Title** - Main heading of your popup (max 100 characters)
- **Start Date** - When the popup should begin showing

#### Optional Fields
- **Description** - Additional text (max 500 characters)
- **Background Image** - URL to image file
- **Background Video** - URL to YouTube, Vimeo, or direct video
- **Call-to-Action URL** - Link when user clicks "Learn More"
- **End Date** - When popup should stop showing

#### Configuration
- **Layout Type**
  - Rectangle: Banner-style (16:9 or 21:9)
  - Square: Modal-style (1:1)
  - Fullscreen: Full viewport
  
- **Position**
  - Center: Middle of screen
  - Top: Upper portion of screen
  - Bottom: Lower portion of screen

- **Active** - Toggle to enable/disable popup

### Step 3: Preview Your Popup
Click the preview icon on any popup card to see how it looks on:
- Desktop browser
- Mobile device (375px width)

### Step 4: Manage Popups

#### Edit a Popup
- Click the edit icon (pencil)
- Modify any fields
- Click "Update Popup"

#### Pause a Popup
- Click the "Pause" button on the card
- Popup won't show until re-activated

#### Activate a Popup
- Click the "Activate" button on the card
- Popup will show when date range matches

#### Delete a Popup
- Click the delete icon (trash)
- Confirm deletion (cannot be undone)

## 📊 Understanding the Dashboard

### Statistics Cards
- **Total Popups** - All popups created
- **Active Now** - Popups currently scheduled and active
- **Total Views** - Combined view count across all popups
- **Unique Sessions** - Number of unique visitors who saw popups

### Popup Status Badges
- 🟢 **Active** - Currently showing to visitors
- 🟡 **Scheduled** - Future start date
- 🔴 **Inactive** - Disabled or ended
- ⚪ **Expired** - Past end date

### Popup Layout Labels
- **Rectangle** - Banner format
- **Square** - Modal format
- **Fullscreen** - Full page overlay

## 🎬 Adding Media

### Image Backgrounds
```
Format: JPG, PNG, WebP, SVG
Example: https://example.com/banner.jpg
```

### Video Backgrounds
Supported sources:
```
YouTube:  https://www.youtube.com/watch?v=VIDEO_ID
          https://youtu.be/VIDEO_ID

Vimeo:    https://vimeo.com/VIDEO_ID

Direct:   https://example.com/video.mp4
          https://example.com/video.webm
```

## 📱 Testing on Different Devices

### Desktop
1. Click preview icon
2. Select "Desktop" button
3. View at 1920px width

### Mobile
1. Click preview icon
2. Select "Mobile" button
3. View at 375px width (iPhone size)

## ⏰ Scheduling Examples

### Immediate Launch
- Start Date: Today at current time
- End Date: Leave empty (runs indefinitely)
- Active: Enabled

### Limited Time Campaign
- Start Date: Jan 15, 2024 at 10:00 AM
- End Date: Jan 20, 2024 at 11:59 PM
- Active: Enabled

### Future Announcement
- Start Date: Feb 1, 2024 at 9:00 AM
- End Date: Feb 7, 2024 at 5:00 PM
- Active: Enabled (will activate on schedule)

### Paused Campaign
- Active: Disabled
- Popup won't show even if date range matches
- Re-enable when ready to resume

## 👥 How Visitors See Popups

1. **First Visit** - Popup displays once per session
2. **Same Session** - Popup won't show again if dismissed
3. **New Session** - New visitor or browser restart = can see popup again
4. **Close Actions**
   - Click X button
   - Press Escape key
   - Click outside (dims background)

## ✨ Best Practices

### Content
- Keep titles short and impactful (under 50 characters)
- Use clear, concise descriptions
- Make CTA text descriptive ("Learn More", "Shop Now", etc.)

### Media
- Optimize images for web (under 500KB)
- Use high-quality backgrounds for better appearance
- Test videos work on all devices

### Scheduling
- Always set a future start date for testing
- Set end dates for limited promotions
- Consider timezone when scheduling

### Activation
- Create popup first with `Active: OFF`
- Preview and test thoroughly
- Enable only when ready to go live
- Disable before end date (optional)

## 🔍 Troubleshooting

### Popup Not Showing
- Check if Active toggle is enabled
- Verify current date/time is within schedule
- Clear browser cache and sessionStorage
- Open in new browser tab or incognito window

### Media Not Loading
- Verify URL is public and accessible
- Check file format is supported
- Confirm image/video file is not too large
- Test URL in separate browser tab

### Can't Access Admin Dashboard
- Verify you're logged in
- Check user role is "admin" or "assistant"
- Try logging out and back in
- Check browser console for errors

### Styling Issues
- Try browser refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Test in different browser
- Check Tailwind CSS configuration

## 📈 Monitoring Performance

Check the dashboard statistics regularly to:
- Track popup views over time
- Understand visitor engagement
- Identify popular campaigns
- Optimize scheduling

## 🔒 Security Notes

- Only admins/assistants can manage popups
- Popups only show active URLs (no script execution)
- Session tracking is client-side only (no user data stored)
- Images/videos pulled from secure sources

## 📞 Support

For issues or questions:
1. Check POPUP_HERO_MIGRATION_SUMMARY.md for detailed documentation
2. Review component files in `src/components/admin/` and `src/components/popup/`
3. Check browser console for error messages
4. Verify Supabase connection and table permissions

## 🎯 Next Steps

1. ✅ Create first popup
2. ✅ Preview on desktop and mobile
3. ✅ Test with different layouts and positions
4. ✅ Schedule a test popup
5. ✅ Monitor statistics
6. ✅ Launch production campaigns

---

**Happy creating! 🎉**
