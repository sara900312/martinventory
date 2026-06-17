# Product Image Upload UI Layout Update

## Overview
Updated the image upload UI in `ImageUploadManager` component to implement a clean, organized gallery layout with proper visual hierarchy between main and sub-images.

## Changes Made

### 1. Component Updates (`ImageUploadManager.jsx`)

#### Visual Structure
- **Main Image**: Displayed at the top with full width, large size (350px height)
- **Sub Images**: Three equal-sized square thumbnails displayed horizontally below the main image
- **Clean Design**: Removed unnecessary labels and text from sub-image areas

#### Rendering Logic
Added conditional rendering based on image type:
- `isMainImage`: Shows label and success indicator
- `isSubImage`: Minimal UI, no text, image-only displays

#### Main Image Features
- Full width container
- Large preview area (350px height)
- Instructional text visible only when empty:
  - "اسحب الصورة هنا أو اضغط للاختيار" (Drag image here or click to select)
  - "PNG, JPG, WebP (أقل من 10 MB)" (supported formats and size)
- Label shows: "الصورة الرئيسية" (Main Image)
- Success indicator (✓) appears after upload
- Action buttons (Upload/Cancel) visible only on preview

#### Sub Image Features
- Three equal-sized square thumbnails (aspect-ratio: 1:1)
- **Empty state**: Minimal border with subtle plus/image icon only
- **No text labels** at any time
- Icon size: 1.5rem (smaller, subtle)
- Border color: #FF2F92/15 (very light pink)
- **When image uploaded**: Full preview, no UI clutter
- **Action buttons**: Minimal, positioned in corner (icons only)
- Remove button: Small rounded button (1.75rem) positioned in top-right corner

### 2. CSS Updates (`ImageUploadManager.css`)

#### Sub-Image Box Styling
```css
.image-upload-box.sub-image-box {
  padding: 0;
  border-radius: 0.5rem;
  border: 2px solid #FF2F92/20;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
```

#### Sub-Image Dropzone
```css
.sub-image-dropzone {
  border: 2px solid #FF2F92/15;  /* Very subtle border */
  padding: 0;
  aspect-ratio: 1;
  background: transparent;      /* No background color */
}
```

#### Icon Sizing
- **Main image icon**: 3rem (large, visible)
- **Sub-image icon**: 1.5rem (small, subtle)
- **Remove button**: 1.75rem (positioned absolutely in corner)

#### Visual Hierarchy
- Main image: Dominant, full width, 350px tall
- Sub images: Secondary, equal size, 3-column grid
- Spacing: 1.5rem gap between all elements
- Borders: Main image lighter (#FF2F92/20), sub-images minimal (#FF2F92/15)

### 3. Responsive Design

#### Tablet Screens (768px and down)
- Main image: 250px height
- Sub images: Remain 3 columns, square aspect-ratio
- Grid gap: 1rem (reduced)

#### Mobile Screens (480px and down)
- Main image: 180px height
- Sub images: Remain 3 columns, square aspect-ratio
- All elements properly sized for mobile

## User Experience

### Empty State
```
┌─────────────────────────┐
│   [+] Drag or Click     │ ← Main Image
│      Upload Text        │
└─────────────────────────┘
┌──────┐ ┌──────┐ ┌──────┐
│  +   │ │  +   │ │  +   │ ← Sub Images (minimal)
└──────┘ └──────┘ └──────┘
```

### Filled State
```
┌─────────────────────────┐
│                         │
│     [Main Image]        │ ← Full preview, no text
│                         │
└─────────────────────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Image1] │ │ [Image2] │ │ [Image3] │ ← Images, [X] button
└──────────┘ └──────────┘ └──────────┘
```

## Behavior

### Clicking
- Click any image box → Opens file picker
- All boxes (main and sub) are clickable

### Drag & Drop
- Drag files → Drop on any image box
- Supported on all image areas

### Upload Process
1. User selects image
2. Preview appears
3. Upload/Cancel buttons shown (main image shows text, sub-images show icons only)
4. Progress bar displays during upload
5. Image preview replaces dropzone
6. Remove button available to delete uploaded image

### Text Visibility
| State | Main Image | Sub Images |
|-------|-----------|-----------|
| Empty | Text visible | Icon only |
| Selected (not uploaded) | Upload/Cancel buttons | Icon buttons only |
| Uploading | Progress % shown | Progress bar only |
| Uploaded | Success text + Remove | Image + [X] button |

## CSS Classes Reference

### Main Container
- `.image-upload-manager` - Outer wrapper
- `.image-upload-container` - Flex column container
- `.image-upload-main` - Main image section
- `.image-upload-grid` - Sub-images grid (3 columns)

### Image Boxes
- `.image-upload-box` - Base box styling
- `.image-upload-box.main-image-box` - Main image specific
- `.image-upload-box.sub-image-box` - Sub-image specific (square, no padding)

### Dropzone
- `.image-dropzone` - Base dropzone
- `.main-image-dropzone` - Main image dropzone (large, with text)
- `.sub-image-dropzone` - Sub-image dropzone (minimal, just border + icon)

### Preview
- `.image-preview-container` - Image preview wrapper
- `.image-preview-container.sub-image-preview-container` - Sub-image preview (square aspect-ratio)

### Icons
- `.image-dropzone-icon` - Large icon (3rem, main image)
- `.image-dropzone-icon.sub-image-dropzone-icon` - Small icon (1.5rem, sub-images)

### Progress
- `.image-upload-progress` - Upload progress indicator
- `.image-upload-progress.sub-image-upload-progress` - Minimal progress for sub-images

## Browser Compatibility
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Flexbox support required
- CSS Grid support required
- CSS aspect-ratio support required

## Performance
- No performance impact
- Conditional rendering reduces DOM nodes for sub-images
- CSS classes managed efficiently

## Accessibility
- Click areas properly sized (at least 44x44px on mobile)
- Title attributes on buttons for tooltips
- Drag-drop support with keyboard fallback (file input)
- Screen reader friendly

## Future Enhancements
1. Reorder images via drag-and-drop between boxes
2. Crop/rotate image before upload
3. Bulk upload multiple images at once
4. Image compression settings
5. Advanced filters/effects

---

**Status**: ✅ Implementation Complete

**Files Modified**:
- `code/src/components/ImageUploadManager.jsx` - React component with conditional rendering
- `code/src/components/ImageUploadManager.css` - Updated styling for clean layout

**Date**: December 12, 2025

**Breaking Changes**: None - backward compatible with existing product data
