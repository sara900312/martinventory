# مرجع سريع - أوامر SQL لصور مشاكل البشرة
# Quick Reference - Skin Problems Images SQL Commands

## ⚡ الأوامر الأساسية / Essential Commands

### 1. إضافة الأعمدة الجديدة / Add New Columns
```sql
ALTER TABLE public.skin_problems 
ADD COLUMN IF NOT EXISTS image_morning_ar TEXT,
ADD COLUMN IF NOT EXISTS image_morning_en TEXT,
ADD COLUMN IF NOT EXISTS image_evening_ar TEXT,
ADD COLUMN IF NOT EXISTS image_evening_en TEXT,
ADD COLUMN IF NOT EXISTS image_morning_url TEXT,
ADD COLUMN IF NOT EXISTS image_evening_url TEXT;
```

---

## 📸 تحديث الصور بسرعة / Update Images Quickly

### حب الشباب / Acne
```sql
UPDATE public.skin_problems
SET image_morning_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop',
    image_evening_url = 'https://images.unsplash.com/photo-1617634269906-3bad197e0e0c?w=400&h=400&fit=crop'
WHERE name = 'حب الشباب' OR name_en = 'Acne';
```

### جفاف البشرة / Dry Skin
```sql
UPDATE public.skin_problems
SET image_morning_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    image_evening_url = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'
WHERE name = 'جفاف البشرة' OR name_en = 'Dry Skin';
```

### فرط التصبغ / Hyperpigmentation
```sql
UPDATE public.skin_problems
SET image_morning_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
    image_evening_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop'
WHERE name = 'فرط التصبغ' OR name_en = 'Hyperpigmentation';
```

### البشرة الدهنية / Oily Skin
```sql
UPDATE public.skin_problems
SET image_morning_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop',
    image_evening_url = 'https://images.unsplash.com/photo-1600332443944-62b43e4963f3?w=400&h=400&fit=crop'
WHERE name = 'البشرة الدهنية' OR name_en = 'Oily Skin';
```

### البشرة الحساسة / Sensitive Skin
```sql
UPDATE public.skin_problems
SET image_morning_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop',
    image_evening_url = 'https://images.unsplash.com/photo-1598027013120-80fa20133840?w=400&h=400&fit=crop'
WHERE name = 'البشرة الحساسة' OR name_en = 'Sensitive Skin';
```

---

## ✅ التحقق والفحص / Verification & Checking

### عرض جميع الصور المضافة
```sql
SELECT id, name, name_en, emoji, 
       image_morning_url, image_evening_url
FROM public.skin_problems
ORDER BY name;
```

### عد المشاكل التي لها صور
```sql
SELECT COUNT(*) as total_with_images
FROM public.skin_problems
WHERE image_morning_url IS NOT NULL 
  AND image_evening_url IS NOT NULL;
```

### عرض المشاكل بدون صور
```sql
SELECT id, name, name_en
FROM public.skin_problems
WHERE image_morning_url IS NULL 
   OR image_evening_url IS NULL;
```

### التحقق من حقول محددة
```sql
SELECT id, name, 
       image_morning_url IS NOT NULL as has_morning,
       image_evening_url IS NOT NULL as has_evening
FROM public.skin_problems;
```

---

## 🔧 تعديلات متقدمة / Advanced Modifications

### تحديث صورة واحدة
```sql
UPDATE public.skin_problems
SET image_morning_url = 'YOUR_NEW_URL'
WHERE id = 'YOUR_PROBLEM_ID';
```

### حذف جميع الصور (لبدء من جديد)
```sql
UPDATE public.skin_problems
SET image_morning_url = NULL,
    image_evening_url = NULL;
```

### نسخ صورة الصباح إلى المساء
```sql
UPDATE public.skin_problems
SET image_evening_url = image_morning_url
WHERE image_evening_url IS NULL;
```

### تحديث على أساس اللغة
```sql
UPDATE public.skin_problems
SET image_morning_url = 'YOUR_URL'
WHERE name_en LIKE 'Acne';
```

---

## 🎨 روابط صور مقترحة / Suggested Image URLs

استخدم هذه الروابط كبدائل:

```
Acne/حب الشباب:
https://images.unsplash.com/photo-1617634269906-3bad197e0e0c
https://images.unsplash.com/photo-1585110396000-c9ffd2ceae45

Dry Skin/جفاف البشرة:
https://images.unsplash.com/photo-1608571423902-eed4a5ad8108
https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae

Hyperpigmentation/فرط التصبغ:
https://images.unsplash.com/photo-1556228578-8c89e6adf883
https://images.unsplash.com/photo-1516975080664-ed2fc6a32937

Oily Skin/البشرة الدهنية:
https://images.unsplash.com/photo-1600332443944-62b43e4963f3
https://images.unsplash.com/photo-1556228578-8c89e6adf883

Sensitive Skin/البشرة الحساسة:
https://images.unsplash.com/photo-1598027013120-80fa20133840
https://images.unsplash.com/photo-1544636331-e26879cd4d9b
```

---

## 📋 جدول سريع / Quick Table

| المشكلة | الاسم الإنجليزي | صورة الصباح | صورة المساء |
|--------|-----------------|------------|------------|
| حب الشباب | Acne | ✓ | ✓ |
| جفاف البشرة | Dry Skin | ✓ | ✓ |
| فرط التصبغ | Hyperpigmentation | ✓ | ✓ |
| البشرة الدهنية | Oily Skin | ✓ | ✓ |
| البشرة الحساسة | Sensitive Skin | ✓ | ✓ |

---

## 💡 نصائح مهمة / Important Tips

✅ استخدم `?w=400&h=400&fit=crop` في نهاية URL لتحسين الأداء
✅ تأكد من أن الصور **مربعة** (1:1 aspect ratio)
✅ استخدم **HTTPS** دائمًا في الروابط
✅ اختبر الرابط في المتصفح قبل الحفظ
✅ احتفظ بنسخة احتياطية من الروابط القديمة

---

## 🚀 الخطوات السريعة / Quick Steps

1. **انسخ كل أمر** من هنا
2. **الصقها** في Supabase SQL Editor
3. **اضغط** Execute
4. **تحقق** من النتائج
5. **اختبر** الواجهة

---

آخر تحديث: يناير 2024
