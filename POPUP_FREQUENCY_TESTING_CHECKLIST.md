# ✅ قائمة اختبار نظام تكرار الإعلانات
## Popup Frequency System Testing Checklist

---

## 🔧 قبل البدء (Prerequisites)

- [ ] تم تشغيل `POPUP_FREQUENCY_UPDATE.sql` في Supabase
- [ ] تم التحقق من وجود عمود `frequency_interval` في جدول `popup_hero`
- [ ] المتصفح يدعم localStorage
- [ ] وضع التطوير (DevTools) متاح (F12)

---

## 📋 اختبار الإعداد (Setup Testing)

### ✅ 1. التحقق من قاعدة البيانات

```sql
-- في Supabase SQL Editor، شغّل:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'popup_hero' 
  AND column_name IN ('display_frequency', 'frequency_interval');
```

**النتيجة المتوقعة:**
- ✅ `display_frequency` موجود (VARCHAR)
- ✅ `frequency_interval` موجود (INTEGER)

### ✅ 2. التحقق من الملفات

- [ ] `src/lib/popupFrequencyManager.js` موجود
- [ ] `src/components/popup/PopupDisplayFrequency.jsx` محدّث
- [ ] `src/components/popup/PopupHero.jsx` محدّث
- [ ] `src/components/admin/PopupForm.jsx` محدّث

### ✅ 3. اختبار التجميع (Build)

```bash
# تحقق من عدم وجود أخطاء:
npm run build
```

**النتيجة المتوقعة:** ✅ بناء ناجح بدون أخطاء

---

## 🧪 اختبار الميزات (Feature Testing)

### اختبار 1: عرض في كل مرة (Always)

#### الإعداد:
1. [ ] أنشئ إعلان جديد
2. [ ] اختر "عرض في كل مرة"
3. [ ] أكمل البيانات الأخرى
4. [ ] فعّل الإعلان (`is_active = true`)
5. [ ] تأكد أن `start_date` في الماضي

#### الاختبار:
```
☐ الخطوة 1: افتح الموقع
  ✓ يجب أن يظهر الإعلان
  
☐ الخطوة 2: أغلق الإعلان (اضغط X)
  
☐ الخطوة 3: أعد تحميل الصفحة (Ctrl+R)
  ✓ يجب أن يظهر الإعلان مرة أخرى
  
☐ الخطوة 4: أغلق الإعلان
  
☐ الخطوة 5: أعد تحميل الصفحة مرة أخرى
  ✓ يجب أن يظهر الإعلان مرة أخرى
```

#### التحقق من Console:
```javascript
// في Browser Console (F12):
localStorage  // يجب أن ترى مفاتيح تبدأ بـ popup_frequency_
```

**النتيجة المتوقعة:** ✅ الإعلان يظهر في كل زيارة

---

### اختبار 2: عرض مرة واحدة فقط (Once)

#### الإعداد:
1. [ ] أنشئ إعلان جديد
2. [ ] اختر "عرض مرة واحدة فقط"
3. [ ] أكمل البيانات الأخرى
4. [ ] فعّل الإعلان
5. [ ] افتح نافذة خاصة/متصفح نظيف (اختياري: لتجنب التداخل مع الإعلانات الأخرى)

#### الاختبار:
```
☐ الخطوة 1: افتح الموقع
  ✓ يجب أن يظهر الإعلان
  📝 لاحظ: console يجب أن يقول "shouldShow: true"
  
☐ الخطوة 2: أغلق الإعلان
  
☐ الخطوة 3: أعد تحميل الصفحة (Ctrl+R)
  ✓ الإعلان يجب ألا يظهر
  📝 لاحظ: console يجب أن يقول "shouldShow: false"
  
☐ الخطوة 4: امسح localStorage
  console: localStorage.clear()
  
☐ الخطوة 5: أعد تحميل الصفحة
  ✓ الإعلان يجب أن يظهر مرة أخرى
  📝 لاحظ: console يجب أن يقول "shouldShow: true"
```

#### التحقق من البيانات:
```javascript
// في Browser Console:
const key = Object.keys(localStorage).find(k => k.startsWith('popup_frequency_'));
JSON.parse(localStorage.getItem(key))

// يجب أن ترى:
{
  type: "once",
  firstShownAt: "2024-01-15T10:30:00.000Z",  // قيمة بعد العرض الأول
  ...
}
```

**النتيجة المتوقعة:** ✅ الإعلان يظهر مرة واحدة فقط، ثم يختفي

---

### اختبار 3: عرض كل X مرات (Every X Visits)

#### الإعداد:
1. [ ] أنشئ إعلان جديد
2. [ ] اختر "عرض كل X مرات"
3. [ ] أدخل العدد: **3** (لتسريع الاختبار)
4. [ ] أكمل البيانات الأخرى
5. [ ] فعّل الإعلان
6. [ ] امسح localStorage قبل البدء: `localStorage.clear()`

#### الاختبار:
```
☐ الزيارة 1: افتح الموقع
  ✓ يجب أن يظهر الإعلان
  ✓ console يجب أن يقول: "shouldShow: true"
  
☐ أغلق الإعلان
  
☐ الزيارة 2: أعد تحميل الصفحة (Ctrl+R)
  ✓ الإعلان يجب ألا يظهر
  ✓ console يجب أن يقول: "shouldShow: false"
  
☐ الزيارة 3: أعد تحميل الصفحة
  ✓ الإعلان يجب ألا يظهر
  
☐ الزيارة 4: أعد تحميل الصفحة
  ✓ الإعلان يجب أن يظهر (مرت 3 زيارات)
  ✓ console يجب أن يقول: "shouldShow: true"
  
☐ أغلق الإعلان
  
☐ الزيارة 5: أعد تحميل الصفحة
  ✓ الإعلان يجب ألا يظهر
  
☐ الزيارة 6: أعد تحميل الصفحة
  ✓ الإعلان يجب ألا يظهر
  
☐ الزيارة 7: أعد تحميل الصفحة
  ✓ الإعلان يجب أن يظهر (مرت 3 زيارات أخرى)
```

#### التحقق من البيانات:
```javascript
// في Browser Console - بعد الزيارة الأولى:
const key = Object.keys(localStorage).find(k => k.startsWith('popup_frequency_'));
const data = JSON.parse(localStorage.getItem(key));

console.log("visitCount:", data.visitCount);  // يجب = 1
console.log("interval:", data.interval);      // يجب = 3
console.log("lastShownAtVisitCount:", data.lastShownAtVisitCount); // يجب = 1
```

**النتيجة المتوقعة:** ✅ الإعلان يظهر كل 3 زيارات

---

## 🎛️ اختبار الإعدادات (Configuration Testing)

### اختبار 4: تغيير الإعدادات

#### السيناريو: تغيير من "مرة واحدة" إلى "في كل مرة"

```
☐ 1. أنشئ إعلان مع "عرض مرة واحدة فقط"
☐ 2. افتح الموقع - يظهر الإعلان
☐ 3. أغلق الإعلان
☐ 4. أعد تحميل - الإعلان لا يظهر (صحيح) ✅
☐ 5. عدّل الإعلان وغيّر إلى "عرض في كل مرة"
☐ 6. انقر "تحديث"
☐ 7. امسح localStorage: localStorage.clear()
☐ 8. أعد تحميل الصفحة
   ✓ الإعلان يجب أن يظهر الآن
   ✓ console: "shouldShow: true"
```

**النتيجة المتوقعة:** ✅ التغييرات تُطبّق على العملاء الجدد

---

## 🔍 اختبار استكشاف الأخطاء (Troubleshooting Testing)

### اختبار 5: عدم ظهور الإعلان

#### السيناريو: الإعلان لا يظهر على الإطلاق

```
☐ 1. تحقق في قاعدة البيانات:
   SELECT * FROM popup_hero 
   WHERE id = '<popup-id>'
   
   ✓ تأكد: is_active = true
   ✓ تأكد: start_date <= NOW()
   ✓ تأكد: end_date >= NOW() أو end_date IS NULL
   
☐ 2. افتح Browser Console (F12)
   
☐ 3. ابحث عن الأخطاء - هل ترى رسائل خطأ؟
   
☐ 4. شغّل في Console:
   localStorage.getItem('popup_frequency_<popup-id>')
   
   ✓ إذا رجع null: الإعلان لم يظهر حتى مرة واحدة
   ✓ إذا رجع JSON: شاهد البيانات للتصحيح
   
☐ 5. جرّب وضع المعاينة (Preview Mode) في لوحة الإدارة
```

### اختبار 6: الإعلان يظهر أكثر من المتوقع

#### السيناريو: اخترت "مرة واحدة" لكنه يظهر عدة مرات

```
☐ 1. افتح Browser Console (F12)
   
☐ 2. اطبع البيانات:
   const key = Object.keys(localStorage).find(k => k.startsWith('popup_frequency_'));
   JSON.parse(localStorage.getItem(key))
   
☐ 3. إذا كانت البيانات صحيحة:
   - type = "once"
   - firstShownAt = <timestamp>
   
   ثم المشكلة قد تكون:
   a. متصفح مختلف (له localStorage منفصل)
   b. النافذة الخاصة (Incognito) - لها localStorage منفصل
   c. Cache مُخزّن - امسح الـ cache
   
☐ 4. الحل: امسح جميع البيانات:
   localStorage.clear()
   ثم أعد التحميل
```

---

## 📱 اختبار التوافق (Compatibility Testing)

### اختبار 7: أجهزة مختلفة

```
☐ الهاتف المحمول:
  ☐ iOS Safari
  ☐ Android Chrome
  ☐ Android Firefox
  
☐ الكمبيوتر:
  ☐ Chrome
  ☐ Firefox
  ☐ Safari
  ☐ Edge

✓ يجب أن تعمل بنفس الطريقة على جميع الأجهزة
```

### اختبار 8: متعدد النوافذ

```
☐ 1. افتح 3 نوافذ منفصلة
☐ 2. في كل نافذة، يجب أن:
   - تشارك نفس localStorage (إذا كانت نفس النطاق)
   - تتحديث بنفس البيانات
   
✓ النتيجة: جميع النوافذ لها نفس سجل الإعلانات
```

---

## 🐛 اختبارات Edge Cases

### اختبار 9: localStorage معطّل

```
☐ 1. اختبر إذا كان localStorage معطّل:
   - Private/Incognito Mode قد يعطّل localStorage
   
☐ 2. اختبر في Incognito:
   ✓ الإعلان يجب أن يظهر بشكل طبيعي
   ✓ قد لا يتم حفظ البيانات
   
☐ 3. النتيجة المتوقعة:
   - الإعلان يظهر في كل زيارة في Incognito
   - لا توجد مشاكل في الأداء
```

### اختبار 10: Interval = 1

```
☐ أنشئ إعلان بـ "عرض كل X مرات" و interval = 1
☐ يجب أن يظهر في كل زيارة (مثل "في كل مرة")
✓ النتيجة: سلوك متطابق مع "في كل مرة"
```

### اختبار 11: Interval = 0 (خطأ)

```
☐ أنشئ إعلان بـ interval = 0 (لا تفعل هذا عادة)
✓ النظام يجب أن يعاملها كـ interval = 1 (القيمة الافتراضية)
```

---

## 📊 اختبار الأداء (Performance Testing)

### اختبار 12: عدة إعلانات

```
☐ أنشئ 5 إعلانات بإعدادات مختلفة
☐ فعّل جميعها
☐ افتح الموقع
✓ جميع الإعلانات يجب أن تعمل بشكل صحيح
✓ لا يجب أن يكون هناك تأخير في الأداء
```

---

## ✅ الخلاصة

### ملخص الاختبارات:
- [ ] اختبار 1: عرض في كل مرة ✅
- [ ] اختبار 2: عرض مرة واحدة ✅
- [ ] اختبار 3: عرض كل X مرات ✅
- [ ] اختبار 4: تغيير الإعدادات ✅
- [ ] اختبار 5: عدم ظهور الإعلان ✅
- [ ] اختبار 6: الإعلان يظهر أكثر ✅
- [ ] اختبار 7: التوافق ✅
- [ ] اختبار 8: متعدد النوافذ ✅
- [ ] اختبار 9: localStorage معطّل ✅
- [ ] اختبار 10: Interval = 1 ✅
- [ ] اختبار 11: Interval = 0 ✅
- [ ] اختبار 12: عدة إعلانات ✅

### الحالة:
- [ ] جميع الاختبارات نجحت ✅
- [ ] المشروع جاهز للإنتاج

---

## 📞 في حالة المشاكل

1. **اطبع البيانات في Console:**
   ```javascript
   Object.keys(localStorage)
     .filter(k => k.startsWith('popup_frequency_'))
     .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))))
   ```

2. **امسح وأعد المحاولة:**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

3. **تحقق من قاعدة البيانات:**
   ```sql
   SELECT id, title, display_frequency, frequency_interval, is_active, start_date, end_date
   FROM popup_hero
   WHERE is_active = true
   ORDER BY created_at DESC;
   ```

---

**تمّ! جميع الاختبارات مكتملة ✅**
