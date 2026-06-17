# الأعمدة الصحيحة في جدول skin_problems
# Correct Columns in skin_problems Table

---

## ✅ الأعمدة الموجودة الفعلية / Actual Existing Columns

```sql
id                    UUID
name                  VARCHAR
name_en               VARCHAR
description           TEXT
card_image_url        TEXT  ← صورة الأيقونة في البطاقة
morning_image_url     TEXT  ← صورة الصباح (Morning)
evening_image_url     TEXT  ← صورة المساء (Evening)
special_care_image_url TEXT ← صورة العناية الخاصة (Special Care)
```

---

## ❌ الأعمدة التي تم حذفها / Deleted Columns

**لا تستخدم الأعمدة التالية - غير موجودة:**

```
emoji                  ← تم حذفه
icon_image_url         ← تم حذفه
image_morning_ar       ← تم حذفه
image_morning_en       ← تم حذفه
image_evening_ar       ← تم حذفه
image_evening_en       ← تم حذفه
image_morning_url      ← تم حذفه
image_evening_url      ← تم حذفه
created_at             ← تم حذفه
updated_at             ← تم حذفه
```

---

## 🔧 الـ SQL الصحيح / Correct SQL Query

### الاستعلام الصحيح

```sql
SELECT 
  id,
  name,
  name_en,
  description,
  card_image_url,
  morning_image_url,
  evening_image_url,
  special_care_image_url
FROM public.skin_problems
ORDER BY name ASC
```

### في Supabase REST API

```http
GET https://ykyzviqwscrjjkucorlp.supabase.co/rest/v1/skin_problems?
select=id,name,name_en,description,card_image_url,morning_image_url,evening_image_url,special_care_image_url
&order=name.asc
```

---

## 🎯 الاستخدام في المكونات / Usage in Components

### في Hook (useSkinProblems.js)

```jsx
const { data, error } = await supabase
  .from("skin_problems")
  .select(
    `id,
     name,
     name_en,
     description,
     card_image_url,
     morning_image_url,
     evening_image_url,
     special_care_image_url`
  )
  .order("name", { ascending: true });
```

### في المكون (SkinProblemSelector.jsx)

```jsx
// صورة الخلفية
const hasImage = problem.morning_image_url || problem.evening_image_url;
<img src={problem.morning_image_url || problem.evening_image_url} />

// أيقونة البطاقة
{problem.card_image_url && <img src={problem.card_image_url} />}

// مؤشرات الوقت
{problem.morning_image_url && <Sun />}
{problem.evening_image_url && <Moon />}
```

### في الـ Carousel (SkinProblemImageCarousel.jsx)

```jsx
const morningImage = problem.morning_image_url;
const eveningImage = problem.evening_image_url;
```

---

## 📊 ملخص التعديلات / Summary of Changes

| الملف | التغيير |
|------|--------|
| `src/hooks/useSkinProblems.js` | ✅ استخدام الأعمدة الصحيحة فقط |
| `src/components/recommendations/SkinProblemSelector.jsx` | ✅ استبدال جميع المراجع |
| `src/components/recommendations/SkinProblemImageCarousel.jsx` | ✅ استبدال جميع المراجع |

---

## 🚀 النتيجة

**قبل**: ❌ Error 42703 (أعمدة غير موجودة)
**بعد**: ✅ جميع الاستعلامات تعمل بشكل صحيح

---

## ⚠️ تحذير مهم / Important Warning

**لا تحاول إضافة أعمدة قديمة مرة أخرى!**

الأعمدة الصحيحة الوحيدة هي:
- card_image_url
- morning_image_url
- evening_image_url
- special_care_image_url

---

آخر تحديث: يناير 2024
