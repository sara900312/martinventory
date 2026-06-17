# 🛡️ نظام Content Moderation محلي 100%

نظام فحص المحتوى المتقدم بدون أي APIs خارجية أو خدمات سحابية

## ✨ المميزات

- ✅ **محلي 100%** - بدون APIs خارجية
- ✅ **سريع** - معالجة محلية في المتصفح
- ✅ **خصوصي** - لا يرسل أي بيانات خارج الجهاز
- ✅ **مجاني** - بدون رسوم أو تكاليف
- ✅ **ذكي** - يستخدم نماذج TensorFlow المتقدمة

## 🎯 قواعد الفحص

### 1️⃣ فحص NSFW (عري/محتوى جنسي)

```
Porn + Sexy > 20% ❌ رفض
Porn + Sexy ≤ 20% ✅ قبول
```

### 2️⃣ فحص الوجه

```
يجب وجود ≥ 1 وجه بشري
بدون وجه ❌ رفض
```

### 3️⃣ فيديو

```
✓ استخراج Frame كل 1 ثانية
✓ فحص كل Frame
✗ إذا أي Frame فشل → الفيديو بالكامل ❌ رفض
```

## 📦 المكتبات المستخدمة

```json
{
  "nsfwjs": "^4.2.1",           // تصنيف NSFW
  "@tensorflow/tfjs-core": "^4.22.0",
  "@tensorflow/tfjs-backend-webgl": "^4.22.0",
  "@vladmandic/face-api": "^1.7.15" // كشف الوجه
}
```

## 🚀 طريقة الاستخدام

### 1️⃣ التحقق من ملف محلي

```javascript
import { validateImageModeration } from '@/lib/contentModerationEngine';

const file = event.target.files[0];
const result = await validateImageModeration(file);

if (result.allowed) {
  console.log('✅ الملف آمن');
} else {
  console.log('❌', result.reason);
  console.log('التفاصيل:', result.details);
}
```

**المخرجات:**

```javascript
{
  allowed: true,
  reason: "✅ الملف آمن - وجه محتشم بدون محتوى غير آمن",
  details: {
    nsfw: {
      porn: 0.05,
      sexy: 0.08,
      combined: 0.13,
      isUnsafe: false
    },
    faces: {
      hasFaces: true,
      faceCount: 1,
      required: 1
    }
  }
}
```

### 2️⃣ استخدام Hook React

```javascript
import { useContentModeration } from '@/hooks/useContentModeration';

function MyComponent() {
  const { 
    validateFile, 
    isValidating, 
    lastResult, 
    error 
  } = useContentModeration();

  const handleFileSelect = async (file) => {
    const result = await validateFile(file);
    
    if (result.allowed) {
      // رفع الملف
      uploadFile(file);
    } else {
      // عرض رسالة خطأ
      alert(result.reason);
    }
  };

  return (
    <div>
      {isValidating && <p>جاري الفحص...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {lastResult && (
        <p>{lastResult.allowed ? '✅ آمن' : '❌ غير آمن'}</p>
      )}
    </div>
  );
}
```

### 3️⃣ التحقق من URL

```javascript
import { validateMediaFromURL } from '@/lib/mediaValidationUtils';

const result = await validateMediaFromURL('https://example.com/image.jpg');
console.log(result.allowed ? 'آمن' : 'غير آمن');
```

### 4️⃣ التحقق من Supabase Storage

```javascript
import { validateMediaFromSupabaseStorage } from '@/lib/mediaValidationUtils';

const result = await validateMediaFromSupabaseStorage(
  supabase,
  'popup-media',
  'popup_123/image.jpg'
);
```

### 5️⃣ التحقق من عدة ملفات

```javascript
import { validateMediaBatch } from '@/lib/mediaValidationUtils';

const files = [file1, file2, file3];
const result = await validateMediaBatch(files);

console.log(`✅ ${result.validFiles} صحيح`);
console.log(`❌ ${result.failedFiles.length} مرفوض`);

result.failedFiles.forEach(failed => {
  console.log(`${failed.fileName}: ${failed.reason}`);
});
```

## 🎬 مثال عملي كامل

### في MediaManager (نقل الملفات)

```javascript
import { validateImageWithDetails } from '@/lib/validateImageClientSide';
import { validateVideoWithDetails } from '@/lib/validateVideoClientSide';

async function uploadFile(file) {
  setIsUploading(true);
  
  try {
    // فحص المحتوى
    let validationResult;
    if (file.type.startsWith('image/')) {
      validationResult = await validateImageWithDetails(file);
    } else {
      validationResult = await validateVideoWithDetails(file);
    }

    // إذا فشل الفحص
    if (!validationResult.allowed) {
      setValidationError(validationResult.reason);
      setIsUploading(false);
      return;
    }

    // رفع الملف الآمن
    const { data } = await supabase.storage
      .from('popup-media')
      .upload('popup_123/file.jpg', file);

    // النجاح
    console.log('تم الرفع بنجاح');
  } catch (error) {
    setValidationError(error.message);
  } finally {
    setIsUploading(false);
  }
}
```

### في إدارة Popup (التحقق من الصور الموجودة)

```javascript
import { useContentModeration } from '@/hooks/useContentModeration';

function PopupMediaLibrary() {
  const { validateURL } = useContentModeration();
  const [mediaItems, setMediaItems] = useState([]);

  const handleAddMedia = async (publicUrl) => {
    // التحقق من الصورة قبل الإضافة
    const result = await validateURL(publicUrl);
    
    if (!result.allowed) {
      alert(`الصورة غير آمنة: ${result.reason}`);
      return;
    }

    // إضافة الصورة الآمنة
    setMediaItems([...mediaItems, { url: publicUrl }]);
  };

  return (
    <div>
      {mediaItems.map(media => (
        <img key={media.url} src={media.url} alt="آمن" />
      ))}
    </div>
  );
}
```

## 📊 رسائل الخطأ

| السبب | الرسالة |
|-----|--------|
| محتوى NSFW | `❌ محتوى غير آمن كتشف (Porn: XX%, Sexy: XX%)` |
| بدون وجه | `❌ يجب أن يحتوي الملف على وجه إنساني واحد على الأقل` |
| فشل الفيديو | `❌ الفيديو يحتوي على محتوى غير آمن - فشل N من M إطار` |
| خطأ الحمل | `خطأ في التحليل: ...` |

## ⚙️ الإعدادات

يمكن تخصيص قيم الفحص في `contentModerationEngine.js`:

```javascript
const CONFIG = {
  NSFW_COMBINED_THRESHOLD: 0.2,    // حد Porn+Sexy
  MIN_FACE_CONFIDENCE: 0.3,        // ثقة كشف الوجه
  REQUIRED_FACE_COUNT: 1,          // عدد الوجوه المطلوبة
  VIDEO_FRAME_INTERVAL: 1,         // استخراج frame كل N ثانية
  MAX_ANALYSIS_TIME: 30000,        // وقت التحليل الأقصى
};
```

## 🔧 التكامل مع Supabase (اختياري)

### إنشاء Edge Function (للمعالجة الخلفية)

```typescript
// supabase/functions/validate-media/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { mediaUrl } = await req.json()
  
  // يمكن إضافة معالجة إضافية هنا
  // مثل: حفظ نتائج الفحص في قاعدة البيانات
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### الاستدعاء من العميل

```javascript
const { data, error } = await supabase.functions.invoke('validate-media', {
  body: { mediaUrl: 'https://...' }
})
```

## 📈 الأداء

| العملية | الوقت المتوقع |
|--------|------------|
| فحص صورة | 2-5 ثواني |
| فحص فيديو (30 ثانية) | 30-60 ثانية |
| تحميل النماذج | 3-5 ثواني (مرة واحدة فقط) |

## ⚠️ الحدود المعروفة

1. **دقة أقل من APIs السحابية** - مقبول مقابل الخصوصية
2. **استهلاك موارد** - يستخدم GPU/CPU المحلي
3. **فيديو طويل** - قد يستغرق وقتاً أطول
4. **النماذج الأولية** - قد تحتاج تحديثات

## 🐛 استكشاف الأخطاء

### المشكلة: الفحص يستغرق وقتاً طويلاً

**الحل:**
- تقليل `MAX_ANALYSIS_TIME`
- استخدام صور أصغر
- تقليل عدد frames للفيديو

### المشكلة: النموذج لا يحمل

**الحل:**
```javascript
// تأكد من الاتصال بالإنترنت (للنموذج الأول)
// أعد تحميل الصفحة
// تحقق من وحدة التحكم (console)
```

### المشكلة: بطء الأداء

**الحل:**
- استخدم `@tensorflow/tfjs-backend-webgpu` بدلاً من webgl
- قلل دقة الصورة قبل الفحص
- استخدم Web Worker لعدم حجب واجهة المستخدم

## 📚 ملفات ذات صلة

- `src/lib/contentModerationEngine.js` - محرك الفحص الرئيسي
- `src/lib/validateImageClientSide.js` - فحص الصور
- `src/lib/validateVideoClientSide.js` - فحص الفيديو
- `src/lib/mediaValidationUtils.js` - أدوات مساعدة
- `src/hooks/useContentModeration.js` - React Hook
- `src/components/popup/MediaManager.jsx` - مثال عملي

## 🎓 المراجع

- [NSFWJS](https://github.com/infinitered/nsfwjs)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Face-API.js](https://github.com/vladmandic/face-api)

---

**آخر تحديث:** 2024
**الحالة:** نظام متكامل وجاهز للإنتاج
