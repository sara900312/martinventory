# ⚡ دليل البدء السريع - نظام Content Moderation

## ⏱️ 5 دقائق للبدء

### 1️⃣ فحص صورة محلية (أبسط طريقة)

```javascript
import { validateImageModeration } from '@/lib/contentModerationEngine';

const file = document.getElementById('fileInput').files[0];
const result = await validateImageModeration(file);

console.log(result.allowed);  // true or false
console.log(result.reason);   // الرسالة التفصيلية
```

### 2️⃣ استخدام Hook في React

```javascript
import { useContentModeration } from '@/hooks/useContentModeration';

function MyComponent() {
  const { validateFile, isValidating, lastResult } = useContentModeration();

  const handleUpload = async (file) => {
    const result = await validateFile(file);
    if (result.allowed) {
      // رفع الملف
    } else {
      alert(result.reason);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {isValidating && <p>جاري الفحص...</p>}
    </div>
  );
}
```

### 3️⃣ فحص من رابط

```javascript
import { validateMediaFromURL } from '@/lib/mediaValidationUtils';

const result = await validateMediaFromURL('https://example.com/image.jpg');
console.log(result.allowed);
```

### 4️⃣ فحص من Supabase Storage

```javascript
import { validateMediaFromSupabaseStorage } from '@/lib/mediaValidationUtils';

const result = await validateMediaFromSupabaseStorage(
  supabase,
  'popup-media',
  'popup_123/image.jpg'
);
```

### 5️⃣ فحص متعدد (Batch)

```javascript
import { validateMediaBatch } from '@/lib/mediaValidationUtils';

const files = [file1, file2, file3];
const result = await validateMediaBatch(files);

console.log(result.allValid);      // جميع الملفات صحيحة؟
console.log(result.validFiles);    // عدد الملفات الآمنة
console.log(result.failedFiles);   // الملفات المرفوضة
```

---

## 🎨 الخروج (Response)

### الحقل الأساسي
```javascript
result.allowed  // true/false - هل الملف آمن
result.reason   // رسالة عربية مفصلة
```

### التفاصيل
```javascript
result.details.nsfw.porn        // 0.0 - 1.0
result.details.nsfw.sexy        // 0.0 - 1.0
result.details.nsfw.combined    // مجموع الاثنين
result.details.faces.faceCount  // عدد الوجوه
result.details.faces.hasFaces   // هل توجد وجوه
```

---

## 🎯 أسباب الرفض الشائعة

| السبب | الحل |
|-----|-----|
| NSFW عالية | اختر صورة بدون محتوى غير آمن |
| بدون وجه | اختر صورة تحتوي على وجه بشري |
| فيديو فاسد | تأكد من صيغة الفيديو |

---

## 🔧 التخصيص

تغيير حد NSFW في `contentModerationEngine.js`:

```javascript
// اجعله أكثر صرامة
NSFW_COMBINED_THRESHOLD: 0.1  // 10% بدلاً من 20%

// أو أقل صرامة
NSFW_COMBINED_THRESHOLD: 0.3  // 30%
```

---

## 📱 في MediaManager

بالفعل مدمج! عند رفع ملف:
- يتم الفحص تلقائياً
- يعرض رسالة الخطأ إذا فشل
- يرفع الملف إذا نجح

---

## 🚀 الأداء

- **صورة:** 2-5 ثواني
- **فيديو 30s:** 30-60 ثانية
- **النموذج الأول:** 3-5 ثواني (مرة واحدة)

---

## ⚠️ ملاحظات

1. يحتاج الإنترنت **أول مرة فقط** لتحميل النماذج
2. الفحص محلي 100% - لا يرسل بيانات للخارج
3. يستخدم GPU/CPU المحلي
4. الدقة أقل من الخدمات السحابية (مقبول)

---

**جاهز للاستخدام مباشرة! 🚀**
