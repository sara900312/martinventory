# 📋 Recommendation Feature - Setup & Verification Guide

## الجزء الأول: التحقق من البنية

### 1. تحقق من جدول `skin_problems`

**في Supabase Console:**
```
Database → Tables → skin_problems
```

**الأعمدة المطلوبة:**
- ✅ `id` (UUID)
- ✅ `name` (TEXT) - الاسم بالعربية
- ✅ `name_en` (TEXT) - الاسم بالإنجليزية (اختياري)
- ✅ `emoji` (TEXT) - الرمز التعبيري (اختياري)
- ✅ `description` (TEXT) - وصف المشكلة (اختياري)

**مثال للبيانات:**
```json
{
  "id": "acne-uuid-1",
  "name": "حب الشباب",
  "name_en": "Acne",
  "emoji": "💊",
  "description": "مشاكل البشرة الدهنية"
}
```

---

### 2. تحقق من جدول `products`

**في Supabase Console:**
```
Database → Tables → products
```

**الأعمدة الضرورية:**
- ✅ `id` (UUID)
- ✅ `name` (TEXT) - اسم المنتج
- ✅ `price` (INTEGER) - السعر
- ✅ `published` (BOOLEAN) - هل منشور
- ✅ **`skin_problems`** ⭐ (TEXT or JSON ARRAY) - مشاكل البشرة
- ✅ **`routine_type`** ⭐ (VARCHAR) - نوع الروتين (morning/night/special)

**الأعمدة الاختيارية:**
- `discounted_price` (INTEGER)
- `is_discounted` (BOOLEAN)
- `main_image_url` (TEXT)
- `product_tags` (TEXT or JSON ARRAY)
- `short_description` (TEXT)
- `short_description_en` (TEXT)

---

### 3. نوع بيانات `skin_problems`

اختر أحد الخيارين:

#### ✅ الخيار أ: TEXT (نص)
```sql
ALTER TABLE products 
ADD COLUMN skin_problems TEXT;

-- أمثلة على البيانات:
'حب الشباب'
'حب الشباب,جفاف'
'جفاف,حساسية,تصبغات'
```

**الكود المستخدم:**
```javascript
.ilike('skin_problems', `%${problemObj.name}%`)
```

#### ✅ الخيار ب: JSON ARRAY
```sql
ALTER TABLE products 
ADD COLUMN skin_problems jsonb DEFAULT '[]';

-- أمثلة على البيانات:
["حب الشباب"]
["حب الشباب", "جفاف"]
["جفاف", "حساسية", "تصبغات"]
```

**الكود المستخدم:**
```javascript
.cs('skin_problems', `${problemObj.name}`)
// أو
.contains('skin_problems', `{"${problemObj.name}"}`)
```

---

## الجزء الثاني: إنشاء Indexes

### تحسين الأداء (اختياري لكن موصى به)

```sql
-- Index على skin_problems للبحث السريع
CREATE INDEX idx_products_skin_problems 
ON products USING GIN (skin_problems);

-- Index على routine_type
CREATE INDEX idx_products_routine_type 
ON products (routine_type);

-- Index مركب
CREATE INDEX idx_products_skin_routine 
ON products (routine_type, published);
```

---

## الجزء الثالث: نموذج بيانات كامل

### مثال عملي مع البيانات الفعلية

#### جدول `skin_problems`
| id | name | name_en | emoji |
|---|---|---|---|
| uuid-1 | حب الشباب | Acne | 💊 |
| uuid-2 | الجفاف | Dryness | 🏜️ |
| uuid-3 | البقع الداكنة | Dark Spots | 🌙 |
| uuid-4 | الحساسية | Sensitivity | 🔴 |
| uuid-5 | الشيخوخة | Wrinkles | 👵 |

#### جدول `products`
| id | name | price | routine_type | skin_problems | published |
|---|---|---|---|---|---|
| prod-1 | Kool Beauty Retinol Anti Aging | 40000 | morning | حب الشباب | true |
| prod-2 | Kool Beauty Hyal Eye Serum | 35000 | morning | جفاف,حساسية | true |
| prod-3 | Anua Niacinamide Serum | 11000 | night | حب الشباب,البقع الداكنة | true |
| prod-4 | Christian Breton Serum | 35000 | special | جفاف | true |

---

## الجزء الرابع: فحص الاستعلامات

### اختبر الاستعلامات يدوياً في SQL Editor

#### استعلام 1: جلب مشاكل البشرة
```sql
SELECT id, name, name_en, emoji 
FROM skin_problems 
ORDER BY name ASC
LIMIT 10;
```

**النتيجة المتوقعة:**
```
id          | name      | name_en  | emoji
─────────────────────────────────────────
uuid-1      | حب الشباب | Acne     | 💊
uuid-2      | الجفاف    | Dryness  | 🏜️
```

#### استعلام 2: جلب أنواع الروتين لمشكلة معينة
```sql
-- للبيانات النصية (TEXT)
SELECT DISTINCT routine_type 
FROM products 
WHERE skin_problems ILIKE '%حب الشباب%'
  AND published = true
  AND routine_type IS NOT NULL;
```

**النتيجة المتوقعة:**
```
routine_type
─────────────
morning
night
special
```

#### استعلام 3: جلب المنتجات المقترحة
```sql
-- للبيانات النصية (TEXT)
SELECT id, name, price, discounted_price, routine_type 
FROM products 
WHERE skin_problems ILIKE '%حب الشباب%'
  AND routine_type = 'morning'
  AND published = true
LIMIT 12;
```

**النتيجة المتوقعة:**
```
id     | name                          | price  | routine_type
────────────────────────────────────────────────────────────
prod-1 | Kool Beauty Retinol Anti Ag.. | 40000  | morning
prod-3 | Anua Niacinamide Serum        | 11000  | morning
prod-5 | Another Product               | 25000  | morning
```

---

## الجزء الخامس: اختبار الواجهة

### خطوات اختبار يدوية

1. **افتح الصفحة**
   ```
   http://localhost:5173/recommendations
   ```

2. **الخطوة 1: اختر مشكلة بشرة**
   - تحقق من أن جميع المشاكل تظهر
   - تحقق من الرموز التعبيرية والأوصاف

3. **الخطوة 2: اختر نوع روتين**
   - يجب أن تظهر فقط الأنواع المتوفرة
   - إذا لم يظهر أي خيار، تحقق من:
     - هل هناك منتجات بـ `published=true`؟
     - هل حقل `routine_type` مملوء؟

4. **الخطوة 3: عرض المنتجات**
   - يجب أن تظهر 12 منتج أو أقل
   - تحقق من:
     - الصور تظهر بشكل صحيح
     - الأسعار صحيحة
     - الوصف (إن وُجد) يظهر

---

## الجزء السادس: استكشاف الأخطاء

### الخطأ 1: لا تظهر مشاكل البشرة

**التحقق:**
```sql
SELECT COUNT(*) FROM skin_problems;
```

**الحل:**
- أدخل بيانات في جدول `skin_problems`
- تأكد من أن الجدول ليس فارغاً

---

### الخطأ 2: لا تظهر أنواع الروتين

**التحقق:**
```sql
SELECT DISTINCT routine_type, COUNT(*) 
FROM products 
WHERE skin_problems ILIKE '%حب الشباب%'
  AND published = true
GROUP BY routine_type;
```

**الحل:**
- تأكد من وجود منتجات بـ `published=true`
- تأكد من أن `routine_type` ليس NULL
- تأكد من أن `skin_problems` يحتوي على اسم المشكلة بالضبط

---

### الخطأ 3: لا تظهر المنتجات

**التحقق:**
```sql
SELECT COUNT(*) FROM products 
WHERE skin_problems ILIKE '%حب الشباب%'
  AND routine_type = 'morning'
  AND published = true;
```

**الحل:**
- تأكد من أن البيانات في `skin_problems` تطابق اسم المشكلة تماماً (حالة الأحرف مهمة)
- تأكد من أن `published=true`
- اختبر الاستعلام في SQL Editor

---

### الخطأ 4: PGRST204 - No schema cache

**السبب:** عمود جديد لم يتم تحديثه في Supabase

**الحل:**
1. في Supabase Console:
   ```
   Database → Refresh schema cache
   ```
2. أو انتظر 60 ثانية (الـ cache يتحدث تلقائياً)

---

## الجزء السابع: تحسين الأداء

### استعلام محسّن مع Full Text Search

```sql
-- إنشاء index للبحث النصي
CREATE INDEX idx_products_skin_tsvector 
ON products 
USING GIN (to_tsvector('arabic', skin_problems));

-- استعلام محسّن
SELECT id, name, price 
FROM products 
WHERE to_tsvector('arabic', skin_problems) @@ plainto_tsquery('arabic', 'حب الشباب')
  AND routine_type = 'morning'
  AND published = true
LIMIT 12;
```

---

## الجزء الثامن: الكود النهائي

### RecommendationPage.jsx - الاستعلامات الرئيسية

#### 1️⃣ جلب مشاكل البشرة
```javascript
const fetchSkinProblems = async () => {
  const { data } = await supabase
    .from('skin_problems')
    .select('*')
    .order('name', { ascending: true });
  
  setSkinProblems(data || []);
};
```

#### 2️⃣ جلب أنواع الروتين
```javascript
const fetchAvailableRoutines = async () => {
  const problemObj = skinProblems.find(p => p.id === selectedProblem);
  
  const { data } = await supabase
    .from('products')
    .select('routine_type')
    .ilike('skin_problems', `%${problemObj.name}%`)
    .eq('published', true)
    .not('routine_type', 'is', null);
  
  const uniqueRoutines = [...new Set(data.map(r => r.routine_type))];
  // Format and set...
};
```

#### 3️⃣ جلب المنتجات
```javascript
const fetchRecommendedProducts = async () => {
  const problemObj = skinProblems.find(p => p.id === selectedProblem);
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, discounted_price, main_image_url, product_tags, short_description, routine_type')
    .ilike('skin_problems', `%${problemObj.name}%`)
    .eq('routine_type', selectedRoutine)
    .eq('published', true)
    .limit(12);
  
  setRecommendedProducts(products || []);
};
```

---

## قائمة التحقق النهائية

- [ ] جدول `skin_problems` يحتوي على البيانات
- [ ] جدول `products` يحتوي على أعمدة `skin_problems` و `routine_type`
- [ ] عمود `skin_problems` معبأ بالكامل
- [ ] عمود `routine_type` معبأ بقيم صحيحة
- [ ] عمود `published` = true للمنتجات المراد عرضها
- [ ] اختبار الاستعلامات في SQL Editor
- [ ] اختبار الواجهة يدوياً
- [ ] لا توجد أخطاء في المتصفح Console
- [ ] المنتجات تظهر بشكل صحيح

---

**ملاحظة مهمة:** إذا واجهت مشاكل، ابدأ بتشغيل الاستعلامات في SQL Editor للتأكد من أن البيانات موجودة ✅

