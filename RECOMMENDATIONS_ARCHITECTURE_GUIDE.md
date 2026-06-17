# 🎯 Recommendations Feature - Architecture Guide

## ⚠️ IMPORTANT: Single Source of Truth

The **ONLY** table responsible for mapping skin problems, routines, and subcategories is:

### `subcategory_skin_rules` Table

**Structure:**
```sql
CREATE TABLE subcategory_skin_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid NOT NULL REFERENCES subcategories(id),
  skin_problem_id uuid NOT NULL REFERENCES skin_problems(id),
  routine_type varchar(50) NOT NULL, -- values: 'morning', 'night', 'special'
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

---

## ❌ WHAT NOT TO USE

These fields **DO NOT EXIST** on the products table and should **NEVER** be used in filtering:

```javascript
// ❌ WRONG - Do not use these:
product.skin_problems
product.routine_type
product.skin_types
product.skin_problem_id

// ✅ Only use:
product.subcategory_id
product.published
```

---

## ✅ Correct Data Flow

### Flow Chart:

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣  User Interaction                                        │
│ • Select skin problem (acne, dryness, etc.)                 │
│ • Select routine type (morning, night, special)             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣  Query subcategory_skin_rules                            │
│ SELECT subcategory_id, routine_type                          │
│ FROM subcategory_skin_rules                                  │
│ WHERE skin_problem_id = :selectedProblem                     │
│   AND routine_type = :selectedRoutine                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣  Collect matching subcategory IDs                        │
│ Result: [subcategory_id_1, subcategory_id_2, ...]          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣  Query Products                                          │
│ SELECT *                                                     │
│ FROM products                                                │
│ WHERE subcategory_id IN ([matching_ids])                     │
│   AND published = true                                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣  Display Products to User                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Example (Frontend Code)

```javascript
// Step 1: Fetch available routine types for selected problem
const fetchAvailableRoutines = async (selectedProblemId) => {
  const { data, error } = await supabase
    .from('subcategory_skin_rules')
    .select('routine_type')
    .eq('skin_problem_id', selectedProblemId)
    .not('routine_type', 'is', null);
    
  // Get unique routine types
  const uniqueRoutines = [...new Set(data.map(r => r.routine_type))];
  return uniqueRoutines; // ['morning', 'night', 'special']
};

// Step 2: When user selects routine, get matching products
const fetchRecommendedProducts = async (problemId, routineType) => {
  // 2a: Get matching subcategories
  const { data: rules } = await supabase
    .from('subcategory_skin_rules')
    .select('subcategory_id')
    .eq('skin_problem_id', problemId)
    .eq('routine_type', routineType);
    
  const subcategoryIds = rules.map(r => r.subcategory_id);
  
  // 2b: Get products in those subcategories
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('subcategory_id', subcategoryIds)
    .eq('published', true)
    .limit(12);
    
  return products;
};
```

---

## 🔄 Complete User Journey

### 1️⃣ **User Opens Recommendations Tool**

```
┌─────────────────────────────────┐
│ 🌟 Recommendations Tool         │
│                                 │
│ Choose your skin problem:       │
│ ☐ 🔴 Acne                       │
│ ☐ 🏜️ Dry Skin                   │
│ ☐ 🌙 Dark Spots                 │
│ ☐ ✨ Oily Skin                  │
│                                 │
└─────────────────────────────────┘
```

### 2️⃣ **User Selects Problem (e.g., Acne)**

**Query executed:**
```sql
SELECT DISTINCT routine_type 
FROM subcategory_skin_rules
WHERE skin_problem_id = 'acne-uuid'
```

```
┌─────────────────────────────────┐
│ 🔴 Acne                         │
│                                 │
│ Choose your routine:            │
│ ☐ 🌅 Morning                    │
│ ☐ 🌙 Night                      │
│ ☐ ✨ Special                    │
│                                 │
└─────────────────────────────────┘
```

### 3️⃣ **User Selects Routine (e.g., Morning)**

**Query executed:**
```sql
SELECT subcategory_id 
FROM subcategory_skin_rules
WHERE skin_problem_id = 'acne-uuid'
  AND routine_type = 'morning'
```

Result: `[subcategory_id_1, subcategory_id_2, subcategory_id_3]`

**Then:**
```sql
SELECT * FROM products
WHERE subcategory_id IN (subcategory_id_1, subcategory_id_2, subcategory_id_3)
  AND published = true
LIMIT 12
```

### 4️⃣ **Products Display**

```
┌──────────────────────────────────┐
│ 🌅 Morning for 🔴 Acne           │
│                                  │
│ ┌──────────────────────────┐     │
│ │ [Product Image]          │     │
│ │ Acne Treatment Serum     │     │
│ │ 45,000 IQD          عرض  │     │
│ └──────────────────────────┘     │
│                                  │
│ ┌──────────────────────────┐     │
│ │ [Product Image]          │     │
│ │ Acne Wash Gel            │     │
│ │ 25,000 IQD          عرض  │     │
│ └──────────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```

---

## 🗄️ Database Structure Example

### skin_problems table
```
id                     | name           | name_en       | emoji
─────────────────────────────────────────────────────────
acne-uuid              | حب الشباب      | Acne          | 🔴
dry-uuid               | الجفاف         | Dry Skin      | 🏜️
spots-uuid             | البقع الداكنة  | Dark Spots    | 🌙
```

### subcategories table
```
id            | name      | parent_category
─────────────────────────────────────────
subcat-1      | سيروم     | skincare
subcat-2      | ماسكات    | skincare
subcat-3      | منتجات    | skincare
```

### subcategory_skin_rules table
```
id      | subcategory_id | skin_problem_id | routine_type
─────────────────────────────────────────────────────────
rule-1  | subcat-1       | acne-uuid       | morning
rule-2  | subcat-1       | acne-uuid       | night
rule-3  | subcat-2       | acne-uuid       | special
rule-4  | subcat-3       | dry-uuid        | morning
```

### products table
```
id       | name              | subcategory_id | published
──────────────────────────────────────────────────────
prod-1   | Acne Serum        | subcat-1       | true
prod-2   | Acne Wash         | subcat-1       | true
prod-3   | Acne Mask         | subcat-2       | true
prod-4   | Moisture Cream    | subcat-3       | true
```

---

## 🧪 Testing Checklist

### ✅ Database Setup
- [ ] `subcategory_skin_rules` table exists with columns: `subcategory_id`, `skin_problem_id`, `routine_type`
- [ ] Sample data populated in `subcategory_skin_rules`
- [ ] `skin_problems` table populated with problems
- [ ] `subcategories` table populated

### ✅ Frontend Implementation
- [ ] `ProductRecommendationWidget.jsx` uses `subcategory_skin_rules` (not product fields)
- [ ] No filtering based on `product.skin_problems`
- [ ] No filtering based on `product.routine_type`
- [ ] Three-stage UI: Problem → Routine → Products

### ✅ Functional Testing
- [ ] Click recommendations icon (✨)
- [ ] Select a skin problem
- [ ] Available routines appear for that problem
- [ ] Select a routine
- [ ] Products appear that match the criteria
- [ ] No products appear if no rules exist for that combination
- [ ] Only published products show

---

## 🚀 Adding New Combinations

To add new problem/routine/subcategory combinations:

1. Make sure problem exists in `skin_problems` table
2. Make sure subcategory exists in `subcategories` table
3. **Add a row** to `subcategory_skin_rules`:
   ```sql
   INSERT INTO subcategory_skin_rules (subcategory_id, skin_problem_id, routine_type)
   VALUES ('subcat-id', 'problem-id', 'morning');
   ```

**No product changes needed!** Products automatically appear if their `subcategory_id` matches.

---

## 📊 Architecture Benefits

✅ **Single Source of Truth**: All logic in one table  
✅ **Flexible**: Add new combinations without touching products  
✅ **Scalable**: Easy to manage complex relationships  
✅ **Clean**: Frontend code doesn't depend on product attributes  
✅ **Maintainable**: Clear data model  

---

## 🐛 Troubleshooting

### No products appear when selecting problem/routine

**Check:**
1. Do rules exist in `subcategory_skin_rules` for that combination?
2. Do those subcategories have products?
3. Are those products `published = true`?

**Debug:**
```javascript
// In browser console while testing
console.log('Selected problem:', selectedProblem);
console.log('Selected routine:', selectedRoutine);
console.log('Matching rules:', ruleData);
console.log('Product count:', products.length);
```

### No routine options appear for a problem

**Check:**
1. Do rules exist in `subcategory_skin_rules` for this problem?
2. Check the `routine_type` values - should be 'morning', 'night', or 'special'

---

## 📞 Summary

**Remember:**
- ✅ Use: `subcategory_skin_rules` table
- ✅ Filter by: `subcategory_id`, `published`
- ❌ Don't use: `product.skin_problems`, `product.routine_type`
- ✅ One flow: Problem → Routine → Subcategories → Products
