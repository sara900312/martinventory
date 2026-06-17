# 🎯 Conditional Routine Type Display Guide

## What Changed

The **Routine Type** and **Skin Problems** fields now only appear when editing products in specific categories:
- ✅ **Skincare** (العناية بالبشرة)
- ✅ **Hair Care** (العناية بالشعر)

## Hide for Other Categories

These fields will **automatically hide** for:
- ❌ Makeup (مكياج)
- ❌ Perfumes (عطور)
- ❌ Serums (سيرومات)
- ❌ Masks (ماسكات)
- ❌ Oils (زيوت)
- ❌ Bath Essentials (مستلزمات حمّام)
- ❌ Beauty Tools (أدوات تجميل)
- ❌ Nail Care (العناية بالأظافر)
- ❌ Body Care (العناية بالجسم)

---

## How It Works

### Step-by-Step Logic

1. **User selects a category** in the product form
2. **Component checks** if category is 'skincare' or 'hair_care'
3. **If YES:** Shows both "Skin Problems" and "Routine Type" sections
4. **If NO:** Hides both sections automatically

### Code Implementation

**In ProductSkinRoutineSettings.jsx:**

```javascript
// Define supported categories
const routineTypeSupportedCategories = ['skincare', 'hair_care'];

// Check function
const shouldShowRoutineType = () => {
  if (!category) return false;
  return routineTypeSupportedCategories.includes(category.toLowerCase());
};

// Conditional render
{shouldShowRoutineType() && (
  <div className="inventory-form-group mb-6">
    {/* Routine Type Field */}
  </div>
)}
```

---

## User Experience

### When Adding/Editing Skincare Product:
```
Inventory Form
├── Product Name
├── Category: "العناية بالبشرة" ✓
├── Price
├── Stock
├── ...other fields...
│
└── 🧴 Skin & Routine Settings
    ├── ✅ مشاكل البشرة (VISIBLE)
    ├── ✅ نوع الروتين (VISIBLE)  ← Shows dropdown
    ├── Short Descriptions
    └── Product Tags
```

### When Adding/Editing Makeup Product:
```
Inventory Form
├── Product Name
├── Category: "مكياج" ✗
├── Price
├── Stock
├── ...other fields...
│
└── 🧴 Skin & Routine Settings
    ├── ❌ مشاكل البشرة (HIDDEN)
    ├── ❌ نوع الروتين (HIDDEN)  ← Dropdown hidden
    ├── Short Descriptions
    └── Product Tags
```

---

## Categories Check

### Supported Categories (ID format):
- `skincare` - العناية بالبشرة
- `hair_care` - العناية بالشعر

### All Other Categories:
- Not supported for routine type management

---

## Files Modified

1. **src/components/ProductSkinRoutineSettings.jsx**
   - Added `category` prop
   - Added `routineTypeSupportedCategories` array
   - Added `shouldShowRoutineType()` function
   - Wrapped sections with conditional render

2. **src/pages/InventoryPage.jsx**
   - Pass `category={formData.category}` to ProductSkinRoutineSettings

---

## Testing Steps

### ✓ Test 1: Add Skincare Product
1. Go to Inventory
2. Fill in product details
3. Select Category: **"العناية بالبشرة"** (Skincare)
4. **VERIFY:** Both "Skin Problems" and "Routine Type" appear ✅

### ✓ Test 2: Add Hair Care Product
1. Go to Inventory
2. Fill in product details
3. Select Category: **"العناية بالشعر"** (Hair Care)
4. **VERIFY:** Both "Skin Problems" and "Routine Type" appear ✅

### ✓ Test 3: Add Makeup Product
1. Go to Inventory
2. Fill in product details
3. Select Category: **"مكياج"** (Makeup)
4. **VERIFY:** "Skin Problems" and "Routine Type" are **HIDDEN** ✅

### ✓ Test 4: Add Perfume Product
1. Go to Inventory
2. Fill in product details
3. Select Category: **"عطور"** (Perfumes)
4. **VERIFY:** "Skin Problems" and "Routine Type" are **HIDDEN** ✅

### ✓ Test 5: Switch Category
1. Edit existing product
2. Change category from "العناية بالبشرة" to "عطور"
3. **VERIFY:** Sections disappear in real-time ✅

---

## Benefits

✅ **Cleaner UI** - Only relevant fields shown
✅ **Better UX** - No confusion for non-skincare products
✅ **Data Integrity** - Prevents wrong data assignment
✅ **Logical Grouping** - Routine type only makes sense for skincare/haircare
✅ **Easier Management** - Admin focuses on relevant settings

---

## Default Behavior

- When **no category** is selected → Fields hidden
- When category changes → Fields visibility updates instantly
- When editing product → Previous values preserved
- When switching to unsupported category → Values stay (but field hidden)

---

## Future Enhancements

- [ ] Add category-specific field suggestions
- [ ] Different field sets per category
- [ ] Category-based templates for quicker entry
- [ ] Auto-populate based on category

---

## Questions?

Review the full documentation:
- `SKIN_ROUTINE_SETTINGS_GUIDE.md` - Complete reference
- `SKIN_ROUTINE_QUICK_START.md` - Quick how-to

---

**Status:** ✅ Implemented and tested
**Version:** 1.0
