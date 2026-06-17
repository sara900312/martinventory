# Inventory Popup Management Feature

## Overview
تمت إضافة ميزة إدارة الإعلانات المنبثقة (Popups) مباشرة من صفحة المخزن بجانب زر ماسح الحالة.

## What's New

### 1. New Tab in Inventory Page
- **Tab Name**: "الإعلانات المنبثقة" (Popups)
- **Icon**: ⚡ (Zap icon)
- **Location**: Next to "ماسح الحالة" (Status Scanner) tab

### 2. New Component: `InventoryPopupTab.jsx`
Location: `src/components/InventoryPopupTab.jsx`

**Features:**
- Create new popups with full form
- Edit existing popups
- Delete popups with confirmation dialog
- Toggle popup active/inactive status
- Preview popups before publishing
- Display statistics (total popups, active popups)
- Arabic UI with full RTL support

**Functionality:**
```javascript
- useAllPopups() - Fetch all popups
- useCreatePopup() - Create new popup
- useUpdatePopup() - Edit existing popup
- useDeletePopup() - Delete popup
```

### 3. Updated Files

#### `src/pages/InventoryPage.jsx`
**Changes:**
- Added `Zap` icon import from lucide-react
- Imported `InventoryPopupTab` component
- Added new TabsTrigger for popups with Zap icon
- Added new TabsContent for popup management

**Code snippet:**
```jsx
<TabsTrigger value="popups" className="flex items-center gap-2 justify-center">
  <Zap className="w-4 h-4" />
  الإعلانات المنبثقة
</TabsTrigger>

<TabsContent value="popups" className="mt-6">
  <div className="inventory-main-section">
    <InventoryPopupTab />
  </div>
</TabsContent>
```

## User Interface

### Popup Management Tab Shows:
1. **Header Section**
   - Title: "إدارة الإعلانات المنبثقة"
   - Stats: Total popups count and active popups count
   - "Add New Popup" button

2. **Popups Grid**
   - Cards showing each popup with:
     - Preview image/video
     - Title and status
     - Start/End dates
     - Edit, Delete, Preview, Toggle Active buttons
   
3. **Forms**
   - Full popup form for creating/editing with:
     - Title input
     - Description textarea
     - Image URL
     - Video URL
     - Link URL
     - Layout type selection
     - Position selection
     - Active toggle
     - Start and End dates

4. **Modals**
   - Delete confirmation dialog (Arabic)
   - Preview modal for testing popups
   - Form modal for creating/editing

## Usage

### Creating a Popup:
1. Click on the "الإعلانات المنبثقة" (Popups) tab
2. Click "إضافة إعلان جديد" (Add New Popup) button
3. Fill in the popup details:
   - Title (required)
   - Description
   - Image and video URLs
   - Link URL
   - Select layout type (rectangle, square, fullscreen)
   - Select position
   - Enable/disable active status
   - Set start and end dates
4. Click submit to create

### Editing a Popup:
1. Find the popup card in the grid
2. Click the edit icon on the card
3. Modify the details in the form
4. Click submit to save

### Deleting a Popup:
1. Click the delete icon on the popup card
2. Confirm the deletion in the dialog

### Previewing a Popup:
1. Click the preview/eye icon on the popup card
2. View how the popup will appear to users

### Toggling Active Status:
1. Click the play/pause button on the popup card
2. The popup will be immediately activated/deactivated

## Styling
- Uses existing inventory styles (`inventory-button-primary`, `inventory-main-section`)
- Responsive grid layout (1 column on mobile, 2-3 columns on desktop)
- Full Arabic RTL support
- Consistent with existing UI design

## Dependencies Used
- `@tanstack/react-query` - For data fetching and mutations
- `lucide-react` - For icons
- Custom components:
  - `PopupForm` - Form for creating/editing popups
  - `PopupCard` - Card display for each popup
  - `PopupPreview` - Preview modal component
  - `AlertDialog` - Confirmation dialogs

## Future Enhancements
- Add bulk operations for multiple popups
- Add scheduling templates
- Add analytics view for popup performance
- Add popup templates/presets
- Add copy popup functionality
