# Popup Media Management & Customization Features

This document describes the new media management, display frequency, and text color customization features added to the Popup Hero system.

## Overview

The Popup Hero system now includes comprehensive media management capabilities, display frequency controls, and text color customization options that allow you to create more engaging and flexible popups.

## Features Implemented

### 1. Media Management System

#### File Upload
- **Drag & Drop Support**: Simply drag and drop files directly into the upload area
- **File Browser**: Click to browse and select files from your device
- **Maximum File Size**: 50MB per file
- **Progress Indicator**: Visual feedback during upload with progress bar

#### Supported Formats

**Images:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)

**Videos:**
- MP4 (.mp4)
- WebM (.webm)
- OGG (.ogv, .ogg)
- QuickTime (.mov, .qt)

#### Media Library
- **View Previous Uploads**: Access all previously uploaded files for the current popup
- **Filter by Type**: Filter between images and videos
- **Reuse Media**: Quickly add media from the library without re-uploading
- **Delete Media**: Remove uploaded media files from storage

#### URL Input Method
- **Direct URLs**: Add media by entering direct URLs to images or videos
- **External Sources**: Link to media hosted on CDNs or other servers
- **No File Size Limit**: URL-based media has no size restrictions

### 2. Display Frequency Control

Choose how often the popup should be displayed to customers:

#### **Show Every Time**
- The popup displays on every visit
- No restrictions, appears each time the conditions are met
- Useful for important announcements or continuous promotions

#### **Show Once Per Customer**
- The popup displays only once per customer (per browser/device)
- Uses local storage to track if a customer has already seen the popup
- Useful for welcome offers or one-time promotions
- Reset: Customers can see it again if they clear browser data or use a different device

### 3. Text Color Customization

Customize the appearance of text elements in your popup:

#### Colors You Can Customize
- **Title Text Color**: The main heading of the popup
- **Description Text Color**: The body text of the popup
- **Button Background Color**: The CTA button background
- **Button Text Color**: The CTA button text color

#### How to Use
- Use the color picker for visual selection
- Enter hex color codes directly (e.g., #ffffff)
- Real-time preview of how colors appear together
- Smart background detection for better contrast

## Implementation Details

### Database Fields

The following fields have been added to the `popup_hero` table:

```sql
media_items JSONB[] -- Array of media objects with structure:
  {
    id: string,
    name: string,
    url: string,
    type: string (mime type),
    size: number (in bytes)
  }

title_color VARCHAR(7) -- Hex color code (default: #ffffff)
description_color VARCHAR(7) -- Hex color code (default: #f0f0f0)
button_color VARCHAR(7) -- Hex color code (default: #3b82f6)
button_text_color VARCHAR(7) -- Hex color code (default: #ffffff)
display_frequency VARCHAR(50) -- 'always' or 'once_per_customer' (default: 'always')
```

### Storage Setup

⚠️ **Important:** The Supabase Storage bucket must be created manually in your Supabase Dashboard BEFORE using file uploads.

**To Create the Bucket:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Go to **Storage** section
4. Click **Create a new bucket**
5. Name it: `popup-media`
6. Make it **Public** (so files are accessible)
7. Optional: Set allowed MIME types to image/* and video/*

**Bucket Structure:**
```
popup-media/
  popup_[popup_id]/
    [uploaded files]
```

**Configuration:**
- Bucket Name: `popup-media` (configurable in `src/lib/mediaStorageSetup.js`)
- Access Level: Public (for direct URL access)
- File Size Limit: 50MB per file
- Supported Types: Image/* and Video/* MIME types

### Client-Side Tracking

The "Show Once Per Customer" feature uses browser localStorage:
- Key: `popup_[popup_id]_viewed`
- Value: `'true'` when the popup has been viewed
- Scope: Per browser/device
- Cleared when user clears browser data

## Usage Guide

### Creating a Popup with Media

1. **Navigate to Admin Popup Page**: Go to the popup admin panel
2. **Click "Create Popup"**: Start creating a new popup
3. **Fill Basic Information**: Add title and description
4. **Add Media** (3 methods):
   - **Drag & Drop**: Drag files into the upload area
   - **Click to Browse**: Click the upload area to select files
   - **Add URL**: Enter a direct link to an image or video
5. **Configure Colors**:
   - Use color picker for visual selection
   - Or enter hex codes manually
   - Check the preview
6. **Choose Display Frequency**:
   - Select "Show Every Time" or "Show Once Per Customer"
7. **Set Schedule**: Define when the popup should be active
8. **Save**: Click "Create Popup"

### Editing Media

**After the popup is saved:**
1. Edit the popup
2. The Media Library will be available showing all previously uploaded files
3. Use "Show/Hide" to toggle library visibility
4. Filter by type (Images, Videos, or All)
5. Click on any media to add it to the current popup
6. Remove media by clicking the trash icon

### Color Preview

The color customization section includes a live preview showing:
- How your title looks in the chosen color
- How your description looks in the chosen color
- How the button appears with your background and text colors

## Technical Architecture

### Components

**MediaManager** (`src/components/popup/MediaManager.jsx`)
- Handles file uploads and URL inputs
- Manages media library display
- Provides filtering and preview functionality
- File size validation and format checking

**PopupStyling** (`src/components/popup/PopupStyling.jsx`)
- Color picker interface
- Color input validation
- Live preview rendering
- Smart background detection

**PopupDisplayFrequency** (`src/components/popup/PopupDisplayFrequency.jsx`)
- Frequency selection UI
- Detailed descriptions of each option
- Information about how tracking works

### Utilities

**mediaStorageSetup** (`src/lib/mediaStorageSetup.js`)
- Bucket initialization
- Access verification
- Error handling

**PopupHero** (updated)
- Respects display_frequency setting
- Applies custom colors to all text elements
- Uses media_items for future media rendering

## Limitations & Considerations

### Current Limitations

1. **File Upload on New Popups**: File uploads are only available after the popup is created (saved to database). URL inputs work immediately.

2. **Media Display**: Currently, media is stored but not displayed in the popup preview (UI enhancement for future releases). You can set media for future use or in the PopupHero component.

3. **Browser Storage**: "Show Once Per Customer" is limited to browser/device level, not user-level tracking.

4. **File Management**: Deleted popups don't automatically clean up uploaded files (manual cleanup may be needed).

### Best Practices

1. **Color Contrast**: Ensure good contrast between text colors and background for accessibility
2. **File Sizes**: While 50MB is allowed, smaller files (< 10MB) load faster
3. **File Naming**: Use descriptive names for easy identification in the media library
4. **Testing**: Test popups in preview mode before publishing
5. **Display Frequency**: Use "Once Per Customer" for promotions, "Always" for important notices

## Future Enhancements

Potential improvements for future releases:

1. Media rendering in popup display
2. Image cropping and editing
3. Video thumbnail selection
4. Batch file uploads
5. User-level tracking instead of browser-level
6. Media analytics (which images/videos are clicked)
7. Responsive color presets
8. A/B testing for different color combinations

## Troubleshooting

### Upload Fails
- ✅ **First:** Check that the `popup-media` bucket exists in Supabase Dashboard
- Check file size (must be under 50MB)
- Verify file format is supported
- Ensure bucket is set to "Public" access
- Check browser console for detailed error messages

### "Bucket not found" Error
- ✅ **Solution:** Go to Supabase Dashboard → Storage → Create new bucket named `popup-media`
- Make sure it's set to **Public** access
- Wait a moment for the bucket to initialize
- Refresh the page and try again

### Media Library Not Showing
- Save the popup first (popupId is required)
- Click "Show" button to expand the library
- Check browser console for errors

### Colors Not Applying
- Clear browser cache
- Verify hex color format (#RRGGBB)
- Check that title_color, description_color, etc. are saved to database

### "Show Once Per Customer" Not Working
- Check browser localStorage is enabled
- Clear browser data to reset tracking
- Different browser/device will show popup again

## Storage Bucket Setup (Required First)

Before using file uploads, you MUST create the storage bucket in Supabase Dashboard:

1. **Go to Supabase Dashboard** → Your Project → Storage
2. **Create New Bucket:**
   - Name: `popup-media`
   - Access: Public
   - Optional: Set MIME type restrictions
3. **Click Create**

This bucket cannot be created from the client - it must be set up manually.

## Database Migration (if needed)

If the popup_hero table doesn't have the new columns, add them:

```sql
ALTER TABLE popup_hero ADD COLUMN media_items JSONB[];
ALTER TABLE popup_hero ADD COLUMN title_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE popup_hero ADD COLUMN description_color VARCHAR(7) DEFAULT '#f0f0f0';
ALTER TABLE popup_hero ADD COLUMN button_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE popup_hero ADD COLUMN button_text_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE popup_hero ADD COLUMN display_frequency VARCHAR(50) DEFAULT 'always';
```

## API Integration

### Upload File Example

```javascript
const { data, error } = await supabase.storage
  .from('popup-media')
  .upload(`popup_${popupId}/${fileName}`, file);
```

### Get Public URL

```javascript
const { data } = supabase.storage
  .from('popup-media')
  .getPublicUrl(`popup_${popupId}/${fileName}`);
```

### List Files

```javascript
const { data, error } = await supabase.storage
  .from('popup-media')
  .list(`popup_${popupId}`);
```

### Delete File

```javascript
const { error } = await supabase.storage
  .from('popup-media')
  .remove([`popup_${popupId}/${fileName}`]);
```
