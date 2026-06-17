# 🧪 دليل الاختبار واستكشاف الأخطاء

## ✅ اختبار النظام

### 1️⃣ اختبار بسيط في Console

```javascript
// افتح console (F12)

import { validateImageModeration } from '@/lib/contentModerationEngine';

// اختبر بصورة محلية
const file = document.getElementById('fileInput').files[0];
const result = await validateImageModeration(file);

console.log(result);
```

### 2️⃣ اختبار مباشر مع عنوان URL

```javascript
import { validateMediaFromURL } from '@/lib/mediaValidationUtils';

// صورة آمنة (تحتوي على وجه)
const result1 = await validateMediaFromURL(
  'https://example.com/portrait.jpg'
);
console.log('صورة الوجه:', result1.allowed); // يجب أن يكون true

// صورة بدون وجه
const result2 = await validateMediaFromURL(
  'https://example.com/landscape.jpg'
);
console.log('منظر طبيعي:', result2.allowed); // قد يكون false
```

---

## 🎯 حالات الاختبار

### حالة 1️⃣: صورة آمنة (وجه محتشم)
**الملف:** صورة شخص بملابس محتشمة
**النتيجة المتوقعة:**
```javascript
{
  allowed: true,
  reason: "✅ الملف آمن - وجه محتشم بدون محتوى غير آمن"
}
```

### حالة 2️⃣: صورة بدون وجه
**الملف:** منظر طبيعي أو منتج
**النتيجة المتوقعة:**
```javascript
{
  allowed: false,
  reason: "❌ يجب أن يحتوي الملف على وجه إنساني واحد على الأقل (تم اكتشاف 0 وجه)"
}
```

### حالة 3️⃣: صورة بمحتوى غير آمن
**الملف:** صورة بمحتوى NSFW
**النتيجة المتوقعة:**
```javascript
{
  allowed: false,
  reason: "❌ محتوى غير آمن كتشف (Porn: XX%, Sexy: XX%)"
}
```

### حالة 4️⃣: فيديو آمن
**الملف:** فيديو قصير بوجه محتشم
**النتيجة المتوقعة:**
```javascript
{
  allowed: true,
  reason: "✅ الفيديو آمن - تم فحص N إطار بنجاح"
}
```

### حالة 5️⃣: فيديو بـ frame غير آمن
**الملف:** فيديو يحتوي على frame واحد غير آمن
**النتيجة المتوقعة:**
```javascript
{
  allowed: false,
  reason: "❌ الفيديو يحتوي على محتوى غير آمن - فشل 1 من N إطار"
}
```

---

## 🐛 استكشاف الأخطاء الشائعة

### ❌ المشكلة: "Error: Cannot read property 'tfjs-backend-webgl'"

**السبب:** النموذج لم يحمل صحيحاً

**الحل:**
```javascript
// 1. تأكد من الإنترنت
// 2. امسح cache المتصفح
// 3. أعد تحميل الصفحة
// 4. جرب متصفح آخر
```

### ❌ المشكلة: الفحص يستغرق وقتاً طويلاً جداً

**السبب:** كمبيوتر ضعيف أو صورة كبيرة جداً

**الحل:**
```javascript
// قلل حجم الصورة قبل الفحص
const resizeImage = (file, maxWidth = 800) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, maxWidth);
      canvas.height = (img.height / img.width) * maxWidth;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        // استخدم الـ blob بدلاً من الملف الأصلي
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
```

### ❌ المشكلة: رفع صور آمنة بشكل خاطئ

**السبب:** حد NSFW منخفض جداً

**الحل:**
```javascript
// في contentModerationEngine.js
// غير من:
NSFW_COMBINED_THRESHOLD: 0.1  // صارم جداً

// إلى:
NSFW_COMBINED_THRESHOLD: 0.2  // معقول
```

### ❌ المشكلة: الفيديو ينجح في الفحص لكن frames فردية تفشل

**السبب:** فشل عشوائي في استخراج frames

**الحل:**
```javascript
// في contentModerationEngine.js
// زد MAX_ANALYSIS_TIME
MAX_ANALYSIS_TIME: 60000  // بدلاً من 30000
```

### ❌ المشكلة: "Out of Memory" في الفيديو الطويل

**السبب:** فيديو طويل جداً مع frames كثيرة

**الحل:**
```javascript
// زد الفاصل الزمني بين الـ frames
VIDEO_FRAME_INTERVAL: 2  // بدلاً من 1 (frame كل ثانيتين)
```

### ❌ المشكلة: وجه مخفي يُعتبر "وجه"

**السبب:** حساسية كشف الوجه عالية جداً

**الحل:**
```javascript
// في contentModerationEngine.js
// زد حد الثقة
MIN_FACE_CONFIDENCE: 0.5  // بدلاً من 0.3
```

### ❌ المشكلة: Cors Error مع URLs

**السبب:** الموقع لا يسمح بالوصول المشترك

**الحل:**
```javascript
// استخدم Supabase Storage بدلاً من URLs خارجية
import { validateMediaFromSupabaseStorage } from '@/lib/mediaValidationUtils';

const result = await validateMediaFromSupabaseStorage(
  supabase,
  'popup-media',
  'popup_123/image.jpg'
);
```

---

## 📊 كيفية قراءة النتائج

### تفكيك نتيجة الفحص

```javascript
const result = await validateImageModeration(file);

// الحقول الأساسية
result.allowed          // ✅ أم ❌
result.reason           // الرسالة العربية

// التفاصيل
result.details.nsfw.porn        // 0-1 (0 = آمن, 1 = خطر)
result.details.nsfw.sexy        // 0-1
result.details.nsfw.hentai      // 0-1
result.details.nsfw.neutral     // 0-1
result.details.nsfw.safe        // 0-1 (آمن)
result.details.nsfw.combined    // porn + sexy

result.details.faces.faceCount  // عدد الوجوه
result.details.faces.hasFaces   // true/false
result.details.faces.required   // العدد المطلوب
```

### أمثلة التفسير

```javascript
// نتيجة آمنة جداً
{
  nsfw: { porn: 0.02, sexy: 0.01, combined: 0.03 },
  faces: { faceCount: 1 }
}
// التفسير: محتوى آمن جداً مع وجه واحد ✅

// حد الخطر
{
  nsfw: { porn: 0.12, sexy: 0.08, combined: 0.20 },
  faces: { faceCount: 1 }
}
// التفسير: في الحد الفاصل (20% = الحد) ⚠️

// فوق الحد
{
  nsfw: { porn: 0.35, sexy: 0.15, combined: 0.50 },
  faces: { faceCount: 0 }
}
// التفسير: محتوى غير آمن (50% > 20%) ❌

// بدون وجه
{
  nsfw: { porn: 0.05, sexy: 0.02, combined: 0.07 },
  faces: { faceCount: 0 }
}
// التفسير: آمن لكن بدون وجه = رفض ❌
```

---

## 🔬 اختبار متقدم

### اختبار الأداء

```javascript
// قس سرعة الفحص
const start = performance.now();
const result = await validateImageModeration(file);
const end = performance.now();

console.log(`وقت الفحص: ${(end - start) / 1000}s`);
```

### اختبار الذاكرة

```javascript
// فحص استخدام الذاكرة
if (performance.memory) {
  console.log('الذاكرة المستخدمة:', 
    (performance.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
}
```

### اختبار متعدد

```javascript
// اختبر دفعة من الملفات
const files = [file1, file2, file3];
const result = await validateMediaBatch(files);

console.table(result.details);
```

---

## 📋 نموذج التقرير عند الإبلاغ عن خطأ

عند إبلاغ عن مشكلة، أرسل:

```javascript
{
  المشكلة: "الفحص يفشل دائماً",
  الخطأ: "Error: ...",
  الملف: {
    الحجم: "2.5 MB",
    النوع: "image/jpeg",
    الأبعاد: "1920x1080"
  },
  النظام: {
    المتصفح: "Chrome 120",
    الموقع: "http://localhost:5173",
    الإنترنت: "متصل"
  },
  الخطوات: [
    "فتحت الصفحة",
    "رفعت صورة",
    "حدث الخطأ"
  ]
}
```

---

## ✨ نصائح التصحيح

1. **استخدم DevTools**
   - F12 → Console لرؤية الأخطاء
   - Network لفحص تحميل النماذج

2. **اطبع النتائج**
   ```javascript
   console.log('النتيجة كاملة:', result);
   console.table(result.details);
   ```

3. **اختبر الحالات الحدية**
   - صور صغيرة جداً (أقل من 50x50)
   - صور كبيرة جداً (أكثر من 8000x8000)
   - فيديوهات بدون audio
   - ملفات تالفة

4. **تحقق من Browser Support**
   - WebGL يحتاج GPU
   - بعض المتصفحات القديمة قد لا تدعم

---

## 🎓 موارد مفيدة

```javascript
// لرؤية سجل كامل من العمليات
window.MODERATION_DEBUG = true;

// في contentModerationEngine.js:
if (window.MODERATION_DEBUG) {
  console.log('NSFW Result:', nsfwResult);
  console.log('Face Result:', faceResult);
}
```

---

**النظام مستقر وجاهز للإنتاج!** 🚀
