# Routine Type System Implementation - Complete Guide

## Overview

This document describes the implementation of the dual-routine system for products in NeomartStore. Products can now appear in:
- **صباحي (Morning)** - via `routine_type`
- **ليلي (Evening)** - via `routine_type_secondary`
- **خاص (Special)** - via `routine_type` or `routine_type_secondary`
- **كليهما (Both)** - via both `routine_type='morning'` and `routine_type_secondary='night'`

## Database Schema

### Columns
- `routine_type`: Primary routine type (morning, night, special, or empty)
- `routine_type_secondary`: Secondary routine type (morning, night, special, or null)

### Constraints
- CHECK constraint ensures only valid values: `'morning' | 'night' | 'special'`
- `routine_type_secondary` can be NULL or a valid routine value
- `routine_type` and `routine_type_secondary` must be different or secondary must be NULL

## User Selection Mapping

When a user selects a routine type in the admin/inventory form, the mapping is:

```javascript
const ROUTINE_SELECTION_MAP = {
  'صباحي': { routine_type: 'morning', routine_type_secondary: null },
  'ليلي': { routine_type: 'night', routine_type_secondary: null },
  'كليهما': { routine_type: 'morning', routine_type_secondary: 'night' },
  'خاص': { routine_type: 'special', routine_type_secondary: null },
};
```

## Implementation Changes

### 1. Constants File (`src/lib/routineTypeConstants.js`)

**Added Functions:**
- `shouldShowProductForRoutine(product, selectedRoutine)`: Determines if a product should be shown for a selected routine by checking both `routine_type` and `routine_type_secondary`
- `getProductRoutines(product)`: Returns array of all routines a product appears in (used for displaying routine badges)

**Usage:**
```javascript
import { shouldShowProductForRoutine, getProductRoutines } from '@/lib/routineTypeConstants';

// Check if product should be shown
if (shouldShowProductForRoutine(product, 'morning')) {
  // Show product
}

// Get all routines for badges
const routines = getProductRoutines(product);
// Returns ['morning', 'night'] if product has both routine types
```

### 2. Product Filtering Hooks

#### `src/hooks/useRecommendedProducts.js`
**Changes:**
- Now fetches both `routine_type` and `routine_type_secondary` columns
- Client-side filtering checks if `routine_type` OR `routine_type_secondary` matches selected routine
- Allows products with secondary routines to appear in recommendations

**Key Logic:**
```javascript
const filteredProducts = (data || []).filter(product => {
  const routines = [];
  if (product.routine_type) {
    routines.push(product.routine_type);
  }
  if (product.routine_type_secondary) {
    routines.push(product.routine_type_secondary);
  }
  return routines.includes(selectedRoutine);
});
```

#### `src/hooks/useRoutineTypes.js`
**Changes:**
- Fetches both `routine_type` and `routine_type_secondary` columns
- Returns unique routines from both columns
- Ensures products with secondary routines are available for selection

### 3. UI Components

#### Product Display Components
Updated to show both routine types using `getProductRoutines()`:
- `src/components/recommendations/RecommendedProductsGrid.jsx`
- `src/components/ProductRecommendationWidget.jsx`

**Display Logic:**
```javascript
{getProductRoutines(product).map((routine) => (
  <span key={routine} className={`badge-${routine}`}>
    {ROUTINE_TYPE_LABELS[routine]}
  </span>
))}
```

#### Product Form/Settings
- `src/components/ProductSkinRoutineSettings.jsx` - Already configured for routine type selection
- Accepts user selection from `ROUTINE_TYPE_OPTIONS`
- Stores selection as-is for processing on submit

### 4. Validation

#### Location: `src/pages/InventoryPage.jsx`
**Validation Flow:**
1. User selects routine from dropdown (Arabic value)
2. `getRoutineSelection()` converts user selection to `routine_type` and `routine_type_secondary`
3. `isValidRoutineSelection()` validates both values before database submission
4. Only valid combinations are saved to database

**Code:**
```javascript
let routineType = '';
let routineTypeSecondary = null;

if (formData.routine_type) {
  const userSelection = formData.routine_type.trim();
  try {
    const routineData = getRoutineSelection(userSelection);
    routineType = routineData.routine_type;
    routineTypeSecondary = routineData.routine_type_secondary;
  } catch (error) {
    throw new Error(`Invalid routine selection`);
  }
}

// Strict validation before database submission
if (!isValidRoutineSelection(routineType, routineTypeSecondary)) {
  throw new Error(`Invalid routine_type values`);
}
```

## Data Flow

### Adding/Editing a Product

```
User selects "كليهما" in form
    ↓
ProductSkinRoutineSettings stores as 'كليهما'
    ↓
InventoryPage.handleSubmitManual() is called
    ↓
getRoutineSelection('كليهما') returns:
  { routine_type: 'morning', routine_type_secondary: 'night' }
    ↓
isValidRoutineSelection('morning', 'night') validates ✓
    ↓
Supabase UPDATE:
  routine_type = 'morning'
  routine_type_secondary = 'night'
```

### Displaying Products in Recommendations

```
User selects "ليلي" (Night) routine
    ↓
RecommendationPage passes 'night' to useRecommendedProducts
    ↓
useRecommendedProducts() fetches products with:
  - routine_type = 'night' OR
  - routine_type_secondary = 'night'
    ↓
Products shown include:
  - Products with routine_type='night'
  - Products with routine_type='morning' AND routine_type_secondary='night'
  - Products with routine_type='special' AND routine_type_secondary='night'
```

## Files Modified

1. **src/lib/routineTypeConstants.js**
   - Added `shouldShowProductForRoutine()` utility
   - Added `getProductRoutines()` utility

2. **src/hooks/useRecommendedProducts.js**
   - Updated to fetch `routine_type_secondary`
   - Client-side filtering for both routine columns

3. **src/hooks/useRoutineTypes.js**
   - Updated to fetch `routine_type_secondary`
   - Aggregates unique routines from both columns

4. **src/components/recommendations/RecommendedProductsGrid.jsx**
   - Updated to display multiple routine badges using `getProductRoutines()`

5. **src/components/ProductRecommendationWidget.jsx**
   - Updated to display multiple routine badges using `getProductRoutines()`

## Testing Checklist

- [ ] Add a product with routine type = "صباحي" (morning only)
- [ ] Add a product with routine type = "مسائي" (evening only)
- [ ] Add a product with routine type = "كليهما" (both morning and night)
- [ ] Add a product with routine type = "خاص" (special)
- [ ] Filter by "Morning" - should see morning-only and both products
- [ ] Filter by "Evening" - should see evening-only and both products
- [ ] Filter by "Special" - should see special products
- [ ] Verify database has correct `routine_type` and `routine_type_secondary` values
- [ ] Verify product displays both routine badges when appropriate
- [ ] Verify recommendations show correct products for each routine

## Key Design Decisions

1. **Dual Column Storage**: Using both `routine_type` and `routine_type_secondary` columns ensures:
   - Database constraint compliance
   - Easy filtering
   - Clear data structure

2. **Client-Side Filtering**: Filtering is done in JavaScript rather than multiple database queries for:
   - Better performance
   - Simpler query logic
   - More flexible filtering

3. **User Selection Mapping**: Arabic user selections are mapped to English database values for:
   - International consistency
   - Database portability
   - Clear audit trails

4. **Helper Functions**: Utility functions centralize filtering logic to:
   - Prevent bugs from inconsistent filtering
   - Make code more maintainable
   - Allow easy changes to filtering logic

## Validation Rules

Valid combinations:
- `routine_type='morning', routine_type_secondary=null` ✓
- `routine_type='night', routine_type_secondary=null` ✓
- `routine_type='special', routine_type_secondary=null` ✓
- `routine_type='morning', routine_type_secondary='night'` ✓
- `routine_type='morning', routine_type_secondary='special'` ✓
- `routine_type='night', routine_type_secondary='special'` ✓

Invalid combinations:
- `routine_type='morning', routine_type_secondary='morning'` ✗
- `routine_type=null, routine_type_secondary='morning'` ✗
- `routine_type='invalid', routine_type_secondary=null` ✗

## Related Components

- **RecommendationPage** (`src/pages/RecommendationPage.jsx`) - Entry point for routine-based filtering
- **InventoryPage** (`src/pages/InventoryPage.jsx`) - Admin interface for product management
- **ProductSkinRoutineSettings** (`src/components/ProductSkinRoutineSettings.jsx`) - UI for routine selection
- **ProductSkinRoutineDisplay** (`src/components/ProductSkinRoutineDisplay.jsx`) - Display routine info on products

## Troubleshooting

### Products not showing in recommendations
1. Check product has `published=true`
2. Verify `routine_type` or `routine_type_secondary` matches selected routine
3. Check product has the selected skin problem

### Database constraint errors
1. Ensure `routine_type` is not empty if `routine_type_secondary` is set
2. Ensure values are only 'morning', 'night', 'special', or empty/null
3. Use `isValidRoutineSelection()` before submitting to database

### Display issues
1. Verify product has `routine_type_secondary` column value
2. Check `getProductRoutines()` is being used for display
3. Verify ROUTINE_TYPE_LABELS includes all routine values
