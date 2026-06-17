# Skin & Routine Settings Management System - Implementation Guide

## Overview
A complete product management interface for handling skin problems, routine types, product tags, and descriptions for cosmetics products.

---

## 📋 Table of Contents
1. [Database Schema](#database-schema)
2. [Components Created](#components-created)
3. [Features](#features)
4. [Usage Instructions](#usage-instructions)
5. [Data Validation](#data-validation)
6. [Troubleshooting](#troubleshooting)

---

## Database Schema

### Required Tables and Columns

#### 1. **products** Table
New columns to add (if not already present):

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_problems uuid[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS routine_type varchar(50) DEFAULT 'morning';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_tags text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description varchar(200) DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description_en varchar(200) DEFAULT '';
```

**Column Definitions:**
- `skin_problems`: Array of UUID references to skin_problems table (or array of strings with problem IDs)
- `routine_type`: Enum-like string - values: 'morning', 'night', 'special'
- `product_tags`: Array of strings (tags/labels)
- `short_description`: Arabic short description (max 200 chars)
- `short_description_en`: English short description (max 200 chars)

#### 2. **skin_problems** Table (Required)
```sql
CREATE TABLE IF NOT EXISTS skin_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  name_en varchar(100),
  emoji varchar(50),
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Sample Data to Insert:**
```sql
INSERT INTO skin_problems (name, name_en, emoji, description) VALUES
('حب الشباب', 'Acne', '🔴', 'علاج فعال لحب الشباب والبثور'),
('الجفاف', 'Dry Skin', '🏜️', 'ترطيب عميق للبشرة الجافة'),
('البقع الداكنة', 'Dark Spots', '🌙', 'تفتيح البقع والتصبغات'),
('البشرة الدهنية', 'Oily Skin', '✨', 'تنظيم الدهون والتحكم بالاستعاب'),
('البشرة الحساسة', 'Sensitive Skin', '🌸', 'مهدئ ومريح للبشرة الحساسة'),
('التجاعيد والخطوط', 'Wrinkles & Lines', '👵', 'مقاوم للتجاعيد وعلامات العمر'),
('تساقط الشعر', 'Hair Fall', '💇', 'يقلل من تساقط الشعر'),
('القشرة', 'Dandruff', '🪴', 'علاج القشرة والحكة'),
('الشعر الجاف والمتطاير', 'Frizz & Dull Hair', '💨', 'ترويض وتلميع الشعر'),
('الشعر الملون', 'Colored Hair', '🎨', 'حماية الشعر الملون من البهتان');
```

---

## Components Created

### 1. **ProductSkinRoutineSettings.jsx**
**Location:** `src/components/ProductSkinRoutineSettings.jsx`

**Purpose:** Main form component for editing skin/routine settings

**Props:**
- `formData` (object): Current form data
- `onFormDataChange` (function): Callback to update form data
- `isLoading` (boolean): Loading state

**Features:**
- Multi-checkbox selector for skin problems (fetches from database)
- Dropdown for routine type (morning, night, special)
- Short description fields (Arabic & English) with character counter
- Tag management with predefined suggestions
- Custom tag input with Enter key support
- Real-time validation

**Predefined Tags Available:**
- vegan
- fragrance-free
- hypoallergenic
- cruelty-free
- organic
- dermatologist-tested
- paraben-free
- sulfate-free
- natural
- anti-aging
- moisturizing
- lightening
- hydrating

---

### 2. **ProductSkinRoutineDisplay.jsx**
**Location:** `src/components/ProductSkinRoutineDisplay.jsx`

**Purpose:** Display skin/routine settings in product list views

**Props:**
- `product` (object): Product data to display

**Features:**
- Shows routine type with emoji
- Displays selected skin problems
- Shows applied tags
- Displays short descriptions (AR & EN)
- Color-coded badges for easy identification

---

## Features

### 1. ✅ Skin Problems Management
- Multi-select checkboxes
- Fetched dynamically from `skin_problems` table
- Visual emoji indicators
- Supports multiple selections per product

### 2. 🕐 Routine Type Selection
- Dropdown with three options:
  - **Morning (صباحي)**: For morning skincare routines
  - **Night (ليلي)**: For night skincare routines
  - **Special (خاص)**: For special treatments/masks
- Default value: 'morning'
- Validation on save

### 3. 🏷️ Product Tags Management
- Pre-defined tag suggestions with one-click addition
- Custom tag input with Enter key support
- Tag removal with X button
- Visual feedback with color-coded badges
- Case-insensitive, auto-formatted (lowercase, hyphenated)

### 4. 📝 Short Descriptions
- Arabic description field (max 200 characters)
- English description field (max 200 characters)
- Character counter for both fields
- For quick product identification in product cards/lists

---

## Usage Instructions

### For Admin Users

#### Adding a Product with Skin & Routine Settings:

1. **Navigate to Inventory Page**
   - Click on "إدارة المخزن" in the admin panel
   - Or use the link from the header

2. **Fill Basic Product Information**
   - Product name
   - Category
   - Price and stock
   - Images (optional)

3. **Scroll to "Skin & Routine Settings" Section**

4. **Select Skin Problems**
   - Check boxes for applicable problems
   - Multiple selections allowed
   - Example: For acne serum, select "حب الشباب"

5. **Choose Routine Type**
   - Select from dropdown: Morning, Night, or Special
   - Example: "صباحي" for a morning moisturizer

6. **Add Short Descriptions**
   - Arabic: Brief description in Arabic
   - English: Same description in English
   - Used in product cards and recommendations

7. **Add Product Tags**
   - Click predefined tags to add them
   - Or type custom tags and press Enter
   - Examples: "vegan", "fragrance-free"
   - Remove tags with X button

8. **Save Product**
   - Click "حفظ التعديلات" or "إضافة المنتج"
   - All fields are automatically validated and saved

#### Editing Existing Product:

1. Find the product in the list
2. Click the Edit (✏️) button
3. All skin/routine settings will be pre-loaded
4. Make changes as needed
5. Click "حفظ التعديلات"

---

## Data Validation

### Validation Rules

1. **Routine Type Validation**
   - Must be one of: 'morning', 'night', 'special'
   - Default fallback: 'morning'
   - Applied during form submission

2. **Skin Problems Validation**
   - Array of valid problem IDs from database
   - Can be empty array
   - No size limit

3. **Product Tags Validation**
   - Array of lowercase hyphenated strings
   - Max 200 characters per tag
   - Auto-formatted on input
   - No duplicates allowed

4. **Short Descriptions Validation**
   - Maximum 200 characters each
   - Trimmed on save
   - Can be empty

---

## API Integration

### Save Operation

When a product is saved, the following data is sent to Supabase:

```javascript
{
  skin_problems: ["acne", "pigmentation"],
  routine_type: "morning",
  product_tags: ["vegan", "fragrance-free"],
  short_description: "وصف قصير للمنتج",
  short_description_en: "Short product description"
}
```

**Endpoint:** `supabase.from('products').update(...).eq('id', productId)`

**Method:** PATCH/UPDATE

---

## File Structure

```
src/
├── components/
│   ├── ProductSkinRoutineSettings.jsx    (Form component)
│   ├── ProductSkinRoutineDisplay.jsx     (Display component)
│   └── ui/                               (UI components)
└── pages/
    └── InventoryPage.jsx                 (Integration point)
```

---

## Integration Points

### InventoryPage.jsx
- Imports both skin routine components
- Includes form fields in `getInitialFormData()`
- Handles loading/saving of settings
- Displays settings in product list

### Updates Made:
1. Added new fields to `formData` state
2. Added `handleFormDataChange()` handler
3. Integrated `ProductSkinRoutineSettings` component in form
4. Integrated `ProductSkinRoutineDisplay` component in product list
5. Updated `handleSubmitManual()` to save new fields
6. Updated `handleEdit()` to load new fields

---

## Troubleshooting

### Issue: Skin problems not showing in dropdown

**Solution:**
1. Ensure `skin_problems` table exists in Supabase
2. Check that sample data has been inserted
3. Verify Supabase connection is working
4. Check browser console for errors

### Issue: Tags not being saved

**Solution:**
1. Ensure product_tags column exists in products table
2. Check that tags are in lowercase and hyphenated
3. Verify no duplicate tags are being added
4. Check database permissions

### Issue: Routine type reverting to 'morning'

**Solution:**
1. Ensure valid routine type value is selected ('morning', 'night', 'special')
2. Check for validation errors in console
3. Verify form submission is successful

### Issue: Short descriptions not displaying in list

**Solution:**
1. ProductSkinRoutineDisplay component may be collapsed
2. Check that short_description fields are not empty
3. Verify component import in InventoryPage

---

## Performance Considerations

1. **Skin Problems Fetching:** Done on component mount (lazy load)
2. **Database Queries:** Single query to fetch all skin problems
3. **Rendering:** Optimized with React memoization
4. **Character Counters:** Real-time without debouncing (lightweight)

---

## Security Notes

1. All data is validated before sending to database
2. Text fields are sanitized using `sanitizeText()` utility
3. Only authorized users (admin/assistant) can edit products
4. Tags are auto-formatted to prevent injection

---

## Future Enhancements

- [ ] Add drag-and-drop reordering for tags
- [ ] Add bulk tagging feature
- [ ] Add tag usage statistics
- [ ] Add conditional fields based on category
- [ ] Add routine type icons in product cards
- [ ] Add skin problem filtering in product search

---

## Support & Documentation

For issues or questions:
1. Check the Troubleshooting section above
2. Review the component JSDoc comments
3. Check browser console for error messages
4. Verify database schema matches requirements

---

**Last Updated:** 2024
**Version:** 1.0
