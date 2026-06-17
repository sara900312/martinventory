# أداة التوصيات الذكية - دليل الإعداد
# Smart Recommendations Tool - Setup Guide

## 📋 الخطوات المطلوبة / Required Steps

### 1️⃣ تطبيق الهجرة على قاعدة البيانات
### 1️⃣ Apply Database Migration

The new feature requires three new columns in the `skin_problems` table:

```sql
tool_title VARCHAR          -- e.g., 'العناية بالبشرة', 'العناية بالشعر'
tool_description TEXT       -- Description of the tool category
tool_media_url TEXT         -- Image/media URL for the category
```

#### How to apply the migration:

**Option A: Using Supabase Dashboard (Easy)**

1. Go to your Supabase Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL:

```sql
-- Add tool category fields to skin_problems table
ALTER TABLE IF EXISTS public.skin_problems
ADD COLUMN IF NOT EXISTS tool_title VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tool_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tool_media_url TEXT DEFAULT NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_skin_problems_tool_title ON public.skin_problems(tool_title);

-- Add comments
COMMENT ON COLUMN public.skin_problems.tool_title IS 'Tool category title (e.g., العناية بالبشرة, العناية بالشعر)';
COMMENT ON COLUMN public.skin_problems.tool_description IS 'Tool category description';
COMMENT ON COLUMN public.skin_problems.tool_media_url IS 'Tool category media/image URL';
```

4. Click **Run**
5. You should see a success message ✅

**Option B: Using Migrations (Advanced)**

The migration file is already created at:
```
supabase/migrations/add_tool_category_fields.sql
```

If you're using Supabase CLI, run:
```bash
supabase migration up
```

---

### 2️⃣ إضافة البيانات / Adding Sample Data

After the migration is applied, you need to populate the new fields for existing problems. Here's an example:

```sql
-- Update existing problems with tool category data
UPDATE public.skin_problems
SET 
  tool_title = 'العناية بالبشرة',
  tool_description = 'اختاري مشكلة بشرتك وسنقترح لك أفضل المنتجات المناسبة لروتينك اليومي.',
  tool_media_url = 'https://your-image-url.jpg' -- Optional: Add image URL
WHERE name_ar IN (
  'حب الشباب',
  'التجاعيد',
  'البقع الداكنة',
  'البشرة الدهنية',
  'البشرة الحساسة'
  -- Add all skin care related problems here
);

-- For hair care problems (if any)
UPDATE public.skin_problems
SET 
  tool_title = 'العناية بالشعر',
  tool_description = 'حددي مشكلة شعرك لتحصلي على توصيات دقيقة للعناية والتغذية.',
  tool_media_url = 'https://your-image-url.jpg' -- Optional: Add image URL
WHERE name_ar IN (
  -- Add hair care related problems here
  'تساقط الشعر',
  'جفاف الشعر',
  'الشعر الدهني'
);
```

---

### 3️⃣ التحقق من الإعداد / Verification

To verify the migration was applied successfully:

```sql
-- Check if columns exist
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'skin_problems' 
  AND column_name IN ('tool_title', 'tool_description', 'tool_media_url')
ORDER BY ordinal_position;
```

Expected output:
```
column_name         | data_type
--------------------|----------
tool_title         | character varying
tool_description   | text
tool_media_url     | text
```

---

## 🎯 المميزات الجديدة / New Features

### Before (قبل):
- Users see all skin problems directly on the recommendations page
- No category selection
- Confusing for users looking for hair care products

### After (بعد):
- **Step 1**: Users select a category (Skin Care OR Hair Care)
- **Step 2**: Shows only problems for that category
- **Step 3**: Select routine type (Morning/Night/Special)
- **Step 4**: View recommended products

---

## 📊 Data Structure / هيكل البيانات

### Skin Care (العناية بالبشرة)
```
tool_title: "العناية بالبشرة"
tool_description: "اختاري مشكلة بشرتك وسنقترح لك أفضل المنتجات المناسبة لروتينك اليومي."
tool_media_url: "[image showing skincare]"

Problems:
├── حب الشباب
├── التجاعيد
├── البقع الداكنة
├── البشرة الدهنية
└── البشرة الحساسة
```

### Hair Care (العناية بالشعر)
```
tool_title: "العناية بالشعر"
tool_description: "حددي مشكلة شعرك لتحصلي على توصيات دقيقة للعناية والتغذية."
tool_media_url: "[image showing haircare]"

Problems:
├── تساقط الشعر
├── جفاف الشعر
└── الشعر الدهني
```

---

## 🔄 State Flow / تسلسل الحالات

```
TOOL_CATEGORY (Step 1)
    ↓
Select "العناية بالبشرة" or "العناية بالشعر"
    ↓
SKIN_PROBLEMS (Step 2)
    ↓
Shows only problems for selected category
    ↓
ROUTINE_TYPE (Step 3)
    ↓
Select Morning/Night/Special routine
    ↓
PRODUCTS (Step 4)
    ↓
Shows recommended products
```

---

## ✅ Checklist

- [ ] Applied SQL migration to add tool_title, tool_description, tool_media_url columns
- [ ] Updated existing problems with tool_title values ('العناية بالبشرة' or 'العناية بالشعر')
- [ ] (Optional) Added tool_media_url images for categories
- [ ] Verified columns exist using the verification query
- [ ] Tested the flow: Category → Problem → Routine → Products
- [ ] No errors in browser console

---

## 🆘 Troubleshooting

### Error: "Column tool_title does not exist"
**Solution**: Run the migration SQL from Option A above

### No categories appear on the page
**Solution**: 
1. Verify columns exist (run the verification query)
2. Check that problems have tool_title values
3. Refresh the page (hard refresh: Ctrl+F5)
4. Check browser console for errors

### Supabase shows "Relation does not exist"
**Solution**: Make sure you ran the migration on the correct Supabase project

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console (F12 → Console tab)
2. Check Supabase database logs
3. Verify the SQL migration was applied successfully
4. Make sure problems have valid tool_title values

---

آخر تحديث: يناير 2024
Last Updated: January 2024
