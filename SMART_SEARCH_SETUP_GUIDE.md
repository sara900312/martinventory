# Smart Search System - Complete Setup Guide

## Overview

This guide walks you through setting up the Smart Search system for your beauty eCommerce store. The system is fully rule-based, offline, and requires no external AI or APIs.

---

## Part 1: Database Schema Updates

### Step 1: Add New Columns to Products Table

You need to add 5 new columns to your `products` table in Supabase. These columns will store the attributes used for intelligent search.

#### Column 1: `product_type`
- **Type**: Text Array (in Supabase, use `text[]`)
- **Default**: Empty array `[]`
- **Description**: Product type IDs (e.g., `["shampoo", "conditioner"]`)
- **Nullable**: Yes
- **Example values**:
  - `["shampoo"]`
  - `["conditioner"]`
  - `["serum", "mask"]`

#### Column 2: `issues_solved`
- **Type**: Text Array (`text[]`)
- **Default**: Empty array `[]`
- **Description**: Issue IDs that this product addresses
- **Nullable**: Yes
- **Example values**:
  - `["dryness", "frizziness"]`
  - `["dandruff"]`
  - `["hairLoss"]`

#### Column 3: `benefits`
- **Type**: Text Array (`text[]`)
- **Default**: Empty array `[]`
- **Description**: Benefit IDs this product provides
- **Nullable**: Yes
- **Example values**:
  - `["hydration", "shine"]`
  - `["repair", "strength"]`
  - `["smoothness"]`

#### Column 4: `suitable_hair_types`
- **Type**: Text Array (`text[]`)
- **Default**: Empty array `[]`
- **Description**: Hair type IDs this product is suitable for
- **Nullable**: Yes
- **Example values**:
  - `["dry"]`
  - `["oily", "combination"]`
  - `["curly", "dry"]`

#### Column 5: `suitable_skin_types`
- **Type**: Text Array (`text[]`)
- **Default**: Empty array `[]`
- **Description**: Skin type IDs this product is suitable for (for skincare products)
- **Nullable**: Yes
- **Example values**:
  - `["sensitive", "dry"]`
  - `["oily"]`

### Step 2: Using Supabase Dashboard to Add Columns

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Table Editor** → Click on `products` table
3. Click the **+** button to add a new column
4. For each column, enter:
   - **Name**: Use the column names from above
   - **Type**: Select `text` then add `[]` to make it an array, OR select `text[]` if available
   - **Default value**: `[]`
   - **Nullable**: Check this box (allow NULL)
5. Repeat for all 5 columns

### Step 3: Using SQL Editor (Alternative Method)

If you prefer SQL, run these queries in the Supabase SQL Editor:

```sql
-- Add product_type column
ALTER TABLE products
ADD COLUMN product_type text[] DEFAULT '{}';

-- Add issues_solved column
ALTER TABLE products
ADD COLUMN issues_solved text[] DEFAULT '{}';

-- Add benefits column
ALTER TABLE products
ADD COLUMN benefits text[] DEFAULT '{}';

-- Add suitable_hair_types column
ALTER TABLE products
ADD COLUMN suitable_hair_types text[] DEFAULT '{}';

-- Add suitable_skin_types column
ALTER TABLE products
ADD COLUMN suitable_skin_types text[] DEFAULT '{}';

-- Optional: Add index for better query performance
CREATE INDEX idx_products_product_type ON products USING GIN (product_type);
CREATE INDEX idx_products_issues_solved ON products USING GIN (issues_solved);
CREATE INDEX idx_products_benefits ON products USING GIN (benefits);
CREATE INDEX idx_products_suitable_hair_types ON products USING GIN (suitable_hair_types);
CREATE INDEX idx_products_suitable_skin_types ON products USING GIN (suitable_skin_types);
```

---

## Part 2: Integrating AdminAttributesEditor into Product Edit Form

The system includes a `AdminAttributesEditor` component that allows admins to manage product attributes.

### Where to Find the Component

- **File**: `code/src/components/AdminAttributesEditor.jsx`
- **Usage**: Import and add to your product edit form

### Integration Example

Here's how to integrate it into a product edit/create form:

```jsx
import AdminAttributesEditor from '@/components/AdminAttributesEditor';

// In your product form component:
const [productAttributes, setProductAttributes] = useState({
  product_type: [],
  issues_solved: [],
  benefits: [],
  suitable_hair_types: [],
  suitable_skin_types: [],
});

// ... in your form JSX:
<AdminAttributesEditor
  categoryId={product.category || 'hair_care'}  // Pass the product category
  currentAttributes={productAttributes}
  onAttributesChange={setProductAttributes}
/>

// When saving product:
await supabase
  .from('products')
  .update({
    ...productData,
    product_type: productAttributes.product_type,
    issues_solved: productAttributes.issues_solved,
    benefits: productAttributes.benefits,
    suitable_hair_types: productAttributes.suitable_hair_types,
    suitable_skin_types: productAttributes.suitable_skin_types,
  })
  .eq('id', productId);
```

---

## Part 3: Available Attributes Reference

The system comes with pre-defined attributes for two categories:

### Hair Care Category (`hair_care`)

#### Product Types
- `shampoo` - شامبو
- `conditioner` - بلسم
- `serum` - سيروم
- `mask` - ماسك
- `oil` - زيت
- `cream` - كريم

#### Issues Solved
- `dryness` - جفاف
- `dandruff` - قشرة
- `hairLoss` - تساقط الشعر
- `frizziness` - تجعد
- `damage` - تلف
- `greasiness` - دهنية
- `weakness` - ضعف

#### Benefits
- `hydration` - ترطيب
- `shine` - لمعان
- `strength` - تقوية
- `repair` - إصلاح
- `smoothness` - نعومة
- `volumeBoost` - زيادة الحجم
- `protectionHeat` - حماية من الحرارة

#### Hair Types
- `oily` - دهني
- `dry` - جاف
- `normal` - عادي
- `combination` - مختلط
- `curly` - مجعد
- `straight` - مفرود
- `colored` - مصبوغ

### Skincare Category (`skincare`)

#### Product Types
- `cleanser` - منظف
- `toner` - تونر
- `serum` - سيروم
- `moisturizer` - مرطب
- `mask` - ماسك
- `sunscreen` - واقي شمس
- `exfoliant` - مقشر

#### Issues Solved
- `acne` - حب الشباب
- `dryness` - جفاف
- `oiliness` - دهنية
- `sensitivity` - حساسية
- `aging` - شيخوخة
- `darkSpots` - بقع داكنة

#### Benefits
- `hydration` - ترطيب
- `brightening` - تفتيح
- `antiAging` - مضاد للشيخوخة
- `clarifying` - تنقية
- `soothing` - تهدئة

#### Skin Types
- `oily` - دهنية
- `dry` - جافة
- `normal` - عادية
- `combination` - مختلطة
- `sensitive` - حساسة

---

## Part 4: Smart Search Features

### How It Works

1. **User Types Query**: User enters search query (e.g., "شامبو لترطيب الشعر الجاف")
2. **Text Suggestions**: System shows only text suggestions while typing (no product cards)
3. **Intent Parsing**: When user clicks search button, system extracts:
   - Product type (شامبو)
   - Benefit needed (ترطيب)
   - Hair type (جاف)
4. **Rule-Based Filtering**: Products are filtered using strict AND logic:
   - Product MUST have matching `product_type`
   - Product MUST have matching `benefits`
   - Product MUST be suitable for matching `suitable_hair_types`
5. **Results Display**:
   - If ≥3 matching products: Show them
   - If <3 products: Show "No results" message
   - If query doesn't match attributes: Show "No results" message

### Accessing Smart Search

- **Desktop**: Click "بحث ذكي" (Smart Search) in the header navigation
- **Mobile**: Available through the menu
- Opens a beautiful modal with search interface

---

## Part 5: Populating Product Attributes

### Bulk Update Approach (Recommended)

For existing products, you can bulk update attributes. Here are several options:

#### Option A: Via Supabase UI
1. Go to Table Editor → products
2. For each product, click the column and enter the array values
3. Format: `["id1", "id2"]` (without spaces after commas for best compatibility)

#### Option B: Via Supabase SQL Editor
```sql
-- Example: Update Olive Shampoo product
UPDATE products
SET
  product_type = ARRAY['shampoo'],
  issues_solved = ARRAY['dryness'],
  benefits = ARRAY['hydration', 'shine'],
  suitable_hair_types = ARRAY['dry', 'normal']
WHERE id = 'YOUR_PRODUCT_ID';

-- Bulk update for category
UPDATE products
SET
  benefits = ARRAY['hydration']
WHERE category = 'hair_care' AND product_type IS NULL;
```

#### Option C: Via CSV Import
1. Export your products CSV
2. Add columns: product_type, issues_solved, benefits, suitable_hair_types, suitable_skin_types
3. Fill in the values using IDs (comma-separated for arrays)
4. Import back into Supabase

#### Option D: Step-by-Step Admin UI (After Integration)
After integrating `AdminAttributesEditor` into your product edit form:
1. Go to admin panel → Edit Product
2. Scroll to "خصائص البحث الذكي" section
3. Check the attributes that apply
4. Save product

**Recommended**: Start with a few products using Admin UI, then bulk update remaining products via SQL.

---

## Part 6: Testing the System

### Test Case 1: Basic Hair Care Search
1. Populate at least 3-5 hair care products with attributes
2. Open Smart Search modal
3. Type: "شامبو لترطيب"
4. Click "ابحث الآن"
5. **Expected**: Should show only shampoos with "hydration" benefit

### Test Case 2: Multi-Criteria Search
1. Type: "بلسم للشعر الجاف"
2. Click search
3. **Expected**: Should show conditioners suitable for dry hair with hydration benefit

### Test Case 3: No Results
1. Type: something that doesn't match any product attributes
2. Click search
3. **Expected**: Should show "نعتذر، لم نجد منتجات مطابقة"

### Test Case 4: Suggestions
1. Type just "شامبو"
2. **Expected**: Suggestions dropdown appears with product types and benefits
3. Don't click search yet (suggestions are text only)

### Test Case 5: Minimum Results Threshold
1. Set up 2 products matching the same criteria
2. Search for those criteria
3. **Expected**: Should show "No results" message (less than 3 products)

---

## Part 7: Available Utilities for Development

The system includes several utilities you can use:

### intentParser.js
```jsx
import { 
  parseIntent, 
  generateSuggestions, 
  formatIntentForDisplay 
} from '@/lib/intentParser';

// Parse user query
const intent = parseIntent("شامبو لترطيب الشعر الجاف");
// Returns: { productTypes: [...], benefits: [...], hairTypes: [...], ... }

// Generate suggestions
const suggestions = generateSuggestions("شامبو");
// Returns: Array of suggestion objects

// Format for display
const display = formatIntentForDisplay(intent, 'ar');
// Returns: "شامبو لـترطيب للشعر جاف"
```

### ruleBasedFilter.js
```jsx
import { 
  filterProductsByIntent, 
  shouldDisplayResults,
  getNoResultsMessage 
} from '@/lib/ruleBasedFilter';

// Filter products
const { results, matchInfo } = filterProductsByIntent(products, intent);

// Check if should display
if (shouldDisplayResults(matchInfo.matchingProducts)) {
  // Show results
}

// Get helpful message
const message = getNoResultsMessage(matchInfo.criteria);
```

### smartSearchAttributes.js
```jsx
import { 
  getAttributesForCategory,
  getProductTypesForCategory,
  findAttributeByKeyword 
} from '@/lib/smartSearchAttributes';

// Get all attributes for category
const attrs = getAttributesForCategory('hair_care');

// Find by keyword
const attr = findAttributeByKeyword('ترطيب');
```

---

## Part 8: Extending to Skincare Products

The system is designed to be extensible. To add skincare products:

1. **Attributes already exist**: `SKINCARE_ATTRIBUTES` in `smartSearchAttributes.js`
2. **Add category support**:
   ```jsx
   // In your product form
   <AdminAttributesEditor
     categoryId={category === 'skincare' ? 'skincare' : 'hair_care'}
     currentAttributes={productAttributes}
     onAttributesChange={setProductAttributes}
   />
   ```
3. **Update SmartSearchModal** to support category context:
   ```jsx
   const intent = parseIntent(searchQuery, categoryId);
   ```

No refactoring needed - the intent parser and filter are fully modular.

---

## Part 9: Troubleshooting

### Issue: Search returns no results
- **Check**: Are products populated with attributes?
- **Solution**: Use AdminAttributesEditor or SQL to add attributes

### Issue: Suggestions not appearing
- **Check**: Is your query at least 2 characters?
- **Solution**: Type more characters

### Issue: Modal not opening
- **Check**: Is SmartSearchModal imported in Header?
- **Check**: Are products fetched from Supabase?
- **Solution**: Check browser console for errors

### Issue: Attributes not saving
- **Check**: Are columns created in database?
- **Solution**: Run the SQL migrations from Part 1

---

## Part 10: Performance Optimization

### Database Indexing
The system includes GIN indexes for array columns (added in SQL migrations):
```sql
CREATE INDEX idx_products_product_type ON products USING GIN (product_type);
```

These indexes make array queries much faster.

### Caching Recommendations
For large product sets (1000+ products), consider caching:
```jsx
// Example: Cache products in context
const [cachedProducts, setCachedProducts] = useState([]);
useEffect(() => {
  // Fetch once and cache
  fetchAndCacheProducts();
}, []);
```

---

## Summary

✅ Add 5 columns to products table  
✅ Integrate AdminAttributesEditor into product edit form  
✅ Populate products with attributes  
✅ SmartSearch modal automatically available in Header  
✅ Test with multiple products  
✅ Extend to skincare as needed  

**Total Setup Time**: ~30 minutes for database + ~1 hour for adding attributes to existing products

**Questions?** Check the code comments in:
- `code/src/lib/smartSearchAttributes.js`
- `code/src/lib/intentParser.js`
- `code/src/lib/ruleBasedFilter.js`
