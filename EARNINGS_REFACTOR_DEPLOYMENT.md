# حسابات الأرباح - دليل النشر (Earnings Refactor Deployment Guide)

## 📋 التغييرات المنجزة (Changes Made)

### 1️⃣ تم حذف الحسابات المحلية (Removed Local Calculations)
- ✅ تم حذف ملف `src/lib/earningsCalculator.js`
- ✅ تم إزالة جميع استيرادات `earningsCalculator`
- ✅ تم إزالة دوال مثل `calculateStoreEarnings`, `filterEarningsByDateRange`, `calculateProfitMargin`

### 2️⃣ تم إنشاء Edge Function جديدة (Created Backend Edge Function)
**المسار**: `code/supabase/functions/calculate-store-earnings/index.ts`

**الميزات**:
- ✅ جلب جميع الطلبات المكتملة فقط (`order_status = 'completed'`)
- ✅ تصفية حسب اسم المتجر
- ✅ دعم نطاقات التاريخ المخصصة
- ✅ حساب الأرباح بناءً على النسبة المئوية أو المبلغ الثابت
- ✅ استخدام `discounted_price ?? price` (تم تكييفه حسب البيانات)
- ✅ إرجاع البيانات المحسوبة بالكامل جاهزة للعرض

### 3️⃣ تم تحديث صفحة الواجهة (Updated Frontend Page)
**المسار**: `src/pages/EarningsAccountsPage.jsx`

**التغييرات**:
- ✅ حذف جميع استدعاءات الحساب المحلي
- ✅ إضافة استدعاء `supabase.functions.invoke('calculate-store-earnings', {...})`
- ✅ التعامل مع الرد من Edge Function فقط
- ✅ عرض البيانات المرجعة من السيرفر مباشرة
- ✅ لا توجد عمليات حسابية مالية في الواجهة

---

## 🚀 خطوات النشر (Deployment Steps)

### المرحلة 1: نشر Edge Function

```bash
# 1. تأكد من تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل الدخول إلى Supabase
supabase login

# 3. نشر الدالة إلى المشروع
cd code/supabase
supabase functions deploy calculate-store-earnings

# أو استخدام الأمر الكامل:
supabase functions deploy calculate-store-earnings --project-id ykyzviqwscrjjkucorlp
```

### المرحلة 2: التحقق من النشر
```bash
# اختبر الدالة:
supabase functions list

# يجب أن ترى:
# calculate-store-earnings
# gemini-ai
# gemini-simple
# order-notification
```

### المرحلة 3: اختبار الدالة (اختياري)
```bash
# من داخل المشروع:
curl -X POST http://localhost:54321/functions/v1/calculate-store-earnings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "متجر الاختبار",
    "profit_mode": "percentage",
    "profit_value": 20,
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-12-31T23:59:59Z"
  }'
```

---

## 📊 API Edge Function - التفاصيل

### الطلب (Request)
```javascript
POST /functions/v1/calculate-store-earnings

Body: {
  "store_name": string,           // اسم المتجر (مثلاً: "متجرنا")
  "profit_mode": string,          // "percentage" أو "fixed"
  "profit_value": number,         // 20 أو 1000
  "date_from": string|null,       // ISO 8601 (مثلاً: "2024-01-01T00:00:00Z")
  "date_to": string|null          // ISO 8601 (مثلاً: "2024-12-31T23:59:59Z")
}
```

### الرد (Response - Success)
```javascript
{
  "success": true,
  "total_profit": 15000,              // إجمالي الأرباح
  "total_sales": 75000,               // إجمالي المبيعات
  "profit_margin": 20.00,             // نسبة الهامش (%)
  "total_items": 150,                 // عدد المنتجات
  "order_count": 10,                  // عدد الطلبات الفريدة
  "items": [
    {
      "order_id": "uuid",
      "order_code": "ORDER-123456",
      "product_name": "اسم المنتج",
      "product_price": 5000,
      "quantity": 3,
      "item_sales": 15000,
      "item_profit": 3000,
      "order_date": "2024-12-18T10:30:00Z",
      "customer_name": "اسم العميل",
      "shipping_type": "fast" | "unified"
    },
    ...
  ]
}
```

### الرد (Response - Error)
```javascript
{
  "error": "رسالة الخطأ"
}
```

---

## 🔒 الأمان (Security)

### ✅ ميزات الأمان المطبقة:

1. **تفويض Supabase**: الدالة تستخدم `SERVICE_ROLE_KEY`
2. **CORS Headers**: تم تكييف رؤوس CORS المناسبة
3. **التحقق من الصلاحيات على الواجهة**:
   - الصفحة متاحة فقط لـ Admin و Assistant
   - الدالة على السيرفر تتحقق من البيانات

4. **عدم الحساب في الواجهة**: 
   - ❌ لا توجد حسابات مالية في JavaScript
   - ✅ جميع الحسابات تتم في السيرفر

---

## 🧪 اختبار الميزة

### خطوات الاختبار:
1. اذهب إلى صفحة **لوحة تحكم المخزن** (Inventory Dashboard)
2. انقر على **حسابات الأرباح** (Earnings Accounts)
3. اختر متجر
4. اختر طريقة الربح (نسبة مئوية أو مبلغ ثابت)
5. أدخل قيمة الربح
6. اختر نطاق التاريخ
7. انقر على **حساب الأرباح**
8. تحقق من النتائج

---

## 🔧 معلومات التطوير

### البيانات المتوقعة من قاعدة البيانات:

#### جدول `orders`
```
id (uuid)
order_code (text)
customer_name (text)
customer_phone (text)
order_status (text) - يجب أن يكون 'completed'
shipping_type (text)
created_at (timestamp)
```

#### جدول `order_items`
```
id (uuid)
order_id (uuid) - FK to orders
product_name (text)
product_price (numeric)
quantity (integer)
store_name (text)
```

### ملاحظة مهمة:
- الدالة تستعلم عن `product_price` من جدول `order_items`
- تم فلترة الطلبات بحالة 'completed' فقط
- تم استبعاد جميع الطلبات الأخرى (pending, cancelled, returned, etc.)

---

## ❌ ما تم حذفه

- ❌ `src/lib/earningsCalculator.js` - محذوف
- ❌ `calculateStoreEarnings` function - محذوفة
- ❌ `filterEarningsByDateRange` function - محذوفة
- ❌ `calculateProfitMargin` function - محذوفة
- ❌ `calculatePercentageProfit` function - محذوفة
- ❌ `calculateFixedProfit` function - محذوفة
- ❌ جميع الحسابات المحلية في EarningsAccountsPage - محذوفة

---

## ✅ ما تم إضافته

- ✅ `code/supabase/functions/calculate-store-earnings/index.ts` - دالة جديدة
- ✅ `supabase.functions.invoke('calculate-store-earnings', {...})` في الواجهة
- ✅ معالجة آمنة للأخطاء من السيرفر
- ✅ عرض البيانات المرجعة من السيرفر مباشرة

---

## 📝 ملاحظات مهمة

1. **الأرقام الآمنة**: جميع الأرقام المالية تأتي من السيرفر فقط
2. **بدون تلاعب**: المستخدم لا يستطيع تعديل الحسابات على الواجهة
3. **سرعة أفضل**: الحسابات تتم على السيرفر بكفاءة أعلى
4. **سهولة الصيانة**: أي تعديل على الحسابات يتم في مكان واحد (Edge Function)

---

## 🚨 استكشاف الأخطاء

### الخطأ: "Function not found"
- **السبب**: Edge Function لم يتم نشره بعد
- **الحل**: قم بتشغيل `supabase functions deploy calculate-store-earnings`

### الخطأ: "Missing required fields"
- **السبب**: لم يتم إرسال جميع المعاملات المطلوبة
- **الحل**: تأكد من إرسال: `store_name`, `profit_mode`, `profit_value`

### الخطأ: "No completed orders found"
- **السبب**: لا توجد طلبات مكتملة للمتجر المحدد
- **الحل**: تحقق من وجود طلبات مكتملة مع الحالة `order_status = 'completed'`

---

## 📞 الدعم

للمزيد من المعلومات، راجع:
- [توثيق Supabase Functions](https://supabase.com/docs/guides/functions)
- [دليل الأمان](https://supabase.com/docs/guides/security)
