# نظام الصور لمشاكل البشرة
# Skin Problems Images System Guide

## الملخص / Overview

هذا الدليل يشرح كيفية إضافة صور الصباح والمساء لكل مشكلة بشرة في نظام التوصيات. كل مشكلة بشرة لها صورتان (صباح ومساء) وتُعرض في شبكة مربعة جميلة.

This guide explains how to add morning and evening images for each skin problem in the recommendations system. Each skin problem has two images (morning and evening) displayed in a beautiful square grid.

---

## 1️⃣ قاعدة البيانات / Database Schema

### إضافة الأعمدة الجديدة / Add New Columns

```sql
-- إذا كانت الجداول لم تُنشأ بعد / If tables don't exist yet:

-- جدول مشاكل البشرة / Skin Problems Table
CREATE TABLE IF NOT EXISTS public.skin_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  emoji VARCHAR(50),
  description TEXT,
  
  -- أعمدة الصور الجديدة / New Image Columns
  image_morning_ar TEXT,        -- صورة الصباح (النسخة العربية)
  image_morning_en TEXT,        -- صورة الصباح (النسخة الإنجليزية)
  image_evening_ar TEXT,        -- صورة المساء (النسخة العربية)
  image_evening_en TEXT,        -- صورة المساء (النسخة الإنجليزية)
  image_morning_url TEXT,       -- رابط صورة الصباح (البديل)
  image_evening_url TEXT,       -- رابط صورة المساء (البديل)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إذا كانت الجداول موجودة بالفعل / If tables already exist:
ALTER TABLE public.skin_problems 
ADD COLUMN IF NOT EXISTS image_morning_ar TEXT,
ADD COLUMN IF NOT EXISTS image_morning_en TEXT,
ADD COLUMN IF NOT EXISTS image_evening_ar TEXT,
ADD COLUMN IF NOT EXISTS image_evening_en TEXT,
ADD COLUMN IF NOT EXISTS image_morning_url TEXT,
ADD COLUMN IF NOT EXISTS image_evening_url TEXT;
```

---

## 2️⃣ إدراج البيانات / Inserting Data

### الطريقة الأولى: إدراج البيانات الجديدة مع الصور
### Method 1: Insert New Data with Images

```sql
-- حب الشباب / Acne
INSERT INTO public.skin_problems (
  name, name_en, emoji, description,
  image_morning_ar, image_morning_en,
  image_evening_ar, image_evening_en,
  image_morning_url, image_evening_url
)
VALUES (
  'حب الشباب',
  'Acne',
  '💊',
  'علاج فعال لحب الشباب والبثور',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop'
);

-- جفاف البشرة / Dry Skin
INSERT INTO public.skin_problems (
  name, name_en, emoji, description,
  image_morning_ar, image_morning_en,
  image_evening_ar, image_evening_en,
  image_morning_url, image_evening_url
)
VALUES (
  'جفاف البشرة',
  'Dry Skin',
  '💊',
  'ترطيب عميق للبشرة الجافة',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
);

-- فرط التصبغ / Hyperpigmentation
INSERT INTO public.skin_problems (
  name, name_en, emoji, description,
  image_morning_ar, image_morning_en,
  image_evening_ar, image_evening_en,
  image_morning_url, image_evening_url
)
VALUES (
  'فرط التصبغ',
  'Hyperpigmentation',
  '💊',
  'تفتيح البقع والتصبغات',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
);

-- البشرة الدهنية / Oily Skin
INSERT INTO public.skin_problems (
  name, name_en, emoji, description,
  image_morning_ar, image_morning_en,
  image_evening_ar, image_evening_en,
  image_morning_url, image_evening_url
)
VALUES (
  'البشرة الدهنية',
  'Oily Skin',
  '💊',
  'تنظيم الدهون والتحكم بالاستعاب',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop'
);

-- البشرة الحساسة / Sensitive Skin
INSERT INTO public.skin_problems (
  name, name_en, emoji, description,
  image_morning_ar, image_morning_en,
  image_evening_ar, image_evening_en,
  image_morning_url, image_evening_url
)
VALUES (
  'البشرة الحساسة',
  'Sensitive Skin',
  '💊',
  'مهدئ ومريح للبشرة الحساسة',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop'
);
```

### الطريقة الثانية: تحديث البيانات الموجودة
### Method 2: Update Existing Data

```sql
-- تحديث حب الشباب / Update Acne
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop'
WHERE name = 'حب الشباب' OR name_en = 'Acne';

-- تحديث جفاف البشرة / Update Dry Skin
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
WHERE name = 'جفاف البشرة' OR name_en = 'Dry Skin';

-- تحديث فرط التصبغ / Update Hyperpigmentation
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
WHERE name = 'فرط التصبغ' OR name_en = 'Hyperpigmentation';

-- تحديث البشرة الدهنية / Update Oily Skin
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop'
WHERE name = 'البشرة الدهنية' OR name_en = 'Oily Skin';

-- تحديث البشرة الحساسة / Update Sensitive Skin
UPDATE public.skin_problems
SET 
  image_morning_ar = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_morning_en = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_ar = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_en = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_morning_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
  image_evening_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop'
WHERE name = 'البشرة الحساسة' OR name_en = 'Sensitive Skin';
```

---

## 3️⃣ التحقق من البيانات / Verify Data

```sql
-- عرض جميع مشاكل البشرة مع صورها / Show all skin problems with images
SELECT 
  id,
  name,
  name_en,
  emoji,
  image_morning_url,
  image_evening_url,
  created_at
FROM public.skin_problems
ORDER BY name;

-- عد عدد مشاكل البشرة التي لها صور / Count problems with images
SELECT COUNT(*) as total_with_images
FROM public.skin_problems
WHERE image_morning_url IS NOT NULL OR image_evening_url IS NOT NULL;

-- عرض المشاكل التي تحتاج على صور / Show problems that need images
SELECT id, name, name_en
FROM public.skin_problems
WHERE image_morning_url IS NULL OR image_evening_url IS NULL;
```

---

## 4️⃣ الفهارس / Indexes (اختياري)

```sql
-- إنشاء فهارس لتحسين الأداء / Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skin_problems_images 
ON public.skin_problems (id) 
WHERE image_morning_url IS NOT NULL OR image_evening_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_skin_problems_names 
ON public.skin_problems (name, name_en);
```

---

## 5️⃣ الرسومات البيانية المستخدمة / UI Components

### SkinProblemSelector.jsx
- عرض شبكة من مشاكل البشرة مع الصور
- يعرض صور الصباح والمساء عند التمرير
- تصميم مربع جميل مع حركات

### SkinProblemImageCarousel.jsx
- عرض مفصل للصور
- اختيار بين صورة الصباح والمساء
- يعرض معلومات المشكلة

---

## 6️⃣ روابط الصور المقترحة / Suggested Image URLs

يمكنك استخدام الروابط التالية أو استبدالها برابط صورك الخاصة:

### Acne / حب الشباب
- Morning: `https://images.unsplash.com/photo-1617634269906-3bad197e0e0c`
- Evening: `https://images.unsplash.com/photo-1617634269906-3bad197e0e0c`

### Dry Skin / جفاف البشرة
- Morning: `https://images.unsplash.com/photo-1608571423902-eed4a5ad8108`
- Evening: `https://images.unsplash.com/photo-1608571423902-eed4a5ad8108`

### Hyperpigmentation / فرط التصبغ
- Morning: `https://images.unsplash.com/photo-1556228578-8c89e6adf883`
- Evening: `https://images.unsplash.com/photo-1556228578-8c89e6adf883`

### Oily Skin / البشرة الدهنية
- Morning: `https://images.unsplash.com/photo-1600332443944-62b43e4963f3`
- Evening: `https://images.unsplash.com/photo-1600332443944-62b43e4963f3`

### Sensitive Skin / البشرة الحساسة
- Morning: `https://images.unsplash.com/photo-1598027013120-80fa20133840`
- Evening: `https://images.unsplash.com/photo-1598027013120-80fa20133840`

---

## ملاحظات هامة / Important Notes

✅ **أنواع الصور**: يمكنك تحميل أي صور من:
- Unsplash
- Pexels
- صورك الخاصة المرفوعة على CDN

✅ **حجم الصور**: يفضل أن تكون الصور:
- مربعة (Square) - 1:1 aspect ratio
- بحجم 400x400 بكسل على الأقل
- محسنة للويب (compressed)

✅ **الخيارات**:
- يمكنك تعيين نفس الصورة لـ morning و evening
- أو تحميل صور مختلفة لكل وقت
- الحقول `_ar` و `_en` للنسخ المختلفة

---

## خطوات التنفيذ السريعة / Quick Implementation Steps

1. **تشغيل الهجرة / Run Migration**:
   ```bash
   # Execute the migration file
   supabase/migrations/add_images_to_skin_problems.sql
   ```

2. **تحديث الصور / Update Images**:
   ```sql
   -- Run the UPDATE queries above with your image URLs
   ```

3. **التحقق / Verify**:
   ```sql
   -- Run the SELECT queries to confirm data
   ```

4. **الاختبار / Test**:
   - انتقل إلى صفحة التوصيات
   - حدد مشكلة بشرة واحدة
   - تحقق من ظهور الصور
   - جرب اختيار الصباح والمساء

---

## استكشاف الأخطاء / Troubleshooting

### ❌ المشكلة: الصور لا تظهر
**الحل**:
```sql
-- تحقق من وجود الصور
SELECT id, name, image_morning_url, image_evening_url
FROM public.skin_problems
WHERE image_morning_url IS NULL;
```

### ❌ المشكلة: الأعمدة غير موجودة
**الحل**:
```sql
-- أضف الأعمدة يدويًا
ALTER TABLE public.skin_problems 
ADD COLUMN IF NOT EXISTS image_morning_url TEXT,
ADD COLUMN IF NOT EXISTS image_evening_url TEXT;
```

### ❌ المشكلة: الصور مكسورة
**الحل**:
- تحقق من صحة رابط الصورة
- تأكد من أن الصورة متاحة على الإنترنت
- استخدم URL كاملة (مع https://)

---

هل تحتاج إلى مساعدة إضافية؟ / Need more help?
