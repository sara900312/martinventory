# 🛠️ نظام الصيانة - الدليل الشامل

## نظرة عامة

نظام صيانة متقدم وشامل للتحكم في أقسام المتجر المختلفة (المنتجات، الفئات، التوصيلات). يوفر النظام:

- ⏱️ **عداد زمني حي** - يتحدث تلقائياً كل ثانية
- 🔒 **تعطيل أزرار ذكي** - تعطيل تلقائي للأزرار المتعلقة
- 📢 **تنبيهات واضحة** - رسائل برتقالية جميلة
- 👨‍💼 **لوحة تحكم إدارية** - إدارة سهلة من قبل المسؤولين
- ⚡ **أداء عالي** - بدون تأثير على الأداء

## 📂 هيكل الملفات

```
نظام الصيانة
├── 🗂️ src/
│   ├── lib/
│   │   └── maintenanceService.js          # خدمة جلب البيانات
│   ├── hooks/
│   │   └── useMaintenanceStatus.js        # Hook إدارة الحالة
│   ├── contexts/
│   │   └── MaintenanceContext.jsx         # Context عام
│   ├── components/
│   │   ├── MaintenanceAlert.jsx           # مكون التنبيه
│   │   └── MaintenanceSectionButton.jsx   # زر مع صيانة
│   └── pages/
│       └── MaintenanceManagementPage.jsx  # صفحة الإدارة
├── 📄 MAINTENANCE_QUICK_START.md          # دليل سريع
├── 📄 MAINTENANCE_SYSTEM_SETUP.md         # دليل إعداد
├── 📄 MAINTENANCE_INTEGRATION_EXAMPLES.md # أمثلة عملية
├── 📄 MAINTENANCE_TESTING_GUIDE.md        # دليل الاختبار
├── 📄 MAINTENANCE_DATABASE_SETUP.sql      # أوامر قاعدة البيانات
└── 📄 MAINTENANCE_README.md               # هذا الملف
```

## 🚀 البدء السريع

### 1. إعداد قاعدة البيانات (5 دقائق)

قم بفتح Supabase SQL Editor وشغّل:

```sql
CREATE TABLE maintenance (
  id uuid primary key default gen_random_uuid(),
  section_name text not null,
  is_active boolean default true,
  start_time timestamp not null,
  end_time timestamp not null,
  reason text,
  created_at timestamp default now()
);

CREATE INDEX idx_maintenance_section_name ON maintenance(section_name);
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
```

### 2. التطبيق على الصفحات (10 دقائق)

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import MaintenanceAlert from '@/components/MaintenanceAlert';

function ProductsPage() {
  const maintenance = useMaintenanceStatus('products');

  return (
    <>
      <MaintenanceAlert
        isUnderMaintenance={maintenance.isUnderMaintenance}
        reason={maintenance.reason}
        formattedTime={maintenance.formattedTime}
        sectionName="المنتجات"
      />
      <button disabled={maintenance.isUnderMaintenance}>
        عرض المنتجات
      </button>
    </>
  );
}
```

### 3. الوصول لصفحة الإدارة

- اذهب إلى: `http://localhost:5173/inventory`
- انقر "إعدادات المخزن" → "إدارة الصيانة"
- أضف فترة صيانة جديدة

## 🎯 الأقسام المدعومة

| الاسم | الوصف | المسار |
|------|------|--------|
| `products` | المنتجات العامة | `/products` |
| `categories` | الفئات والأقسام | `/recommendations` |
| `deliveries` | خدمات التوصيل | `/checkout` |

## 📖 الاستخدام

### الطريقة 1: Hook بسيط (لقسم واحد)

```jsx
const maintenance = useMaintenanceStatus('products');

console.log(maintenance);
// {
//   isUnderMaintenance: boolean,
//   reason: string,
//   formattedTime: "2 س 30 د",
//   timeRemaining: 9000000,
//   isLoading: boolean,
//   error: null,
//   refetch: function
// }
```

### الطريقة 2: Context (لعدة أقسام)

```jsx
import { MaintenanceProvider } from '@/contexts/MaintenanceContext';

// في App.jsx
<MaintenanceProvider sections={['products', 'categories', 'deliveries']}>
  <YourApp />
</MaintenanceProvider>

// في الصفحات
import { useMaintenanceContext } from '@/contexts/MaintenanceContext';

const { isUnderMaintenance } = useMaintenanceContext();
const status = isUnderMaintenance('products'); // true/false
```

### الطريقة 3: مكونات جاهزة

```jsx
// التنبيه
<MaintenanceAlert
  isUnderMaintenance={maintenance.isUnderMaintenance}
  reason={maintenance.reason}
  formattedTime={maintenance.formattedTime}
  sectionName="المنتجات"
/>

// زر مع صيانة
<MaintenanceSectionButton
  label="المنتجات"
  onClick={handleClick}
  isUnderMaintenance={maintenance.isUnderMaintenance}
  reason={maintenance.reason}
  formattedTime={maintenance.formattedTime}
/>
```

## 📚 المستندات

| الملف | المحتوى |
|------|---------|
| **MAINTENANCE_QUICK_START.md** | دليل سريع للبدء |
| **MAINTENANCE_SYSTEM_SETUP.md** | دليل إعداد شامل |
| **MAINTENANCE_INTEGRATION_EXAMPLES.md** | أمثلة عملية متقدمة |
| **MAINTENANCE_TESTING_GUIDE.md** | خطوات الاختبار |
| **MAINTENANCE_DATABASE_SETUP.sql** | أوامر SQL |

## 🔍 استكشاف الأخطاء

### المشكلة: لا تظهر الصيانة

**التحقق:**
1. هل الجدول موجود في Supabase؟
2. هل اسم القسم صحيح (products, categories, deliveries)?
3. هل is_active = true?
4. هل الوقت الحالي بين start_time و end_time?

**الحل:**
```jsx
const maintenance = useMaintenanceStatus('products');
console.log(maintenance); // تحقق من البيانات
console.log(maintenance.error); // تحقق من الأخطاء
```

### المشكلة: الأزرار لا تتعطل

**التحقق:**
```jsx
<button disabled={maintenance.isUnderMaintenance}>
  ✅ استخدم disabled={...}
</button>
```

### المشكلة: العداد لا يتحدث

**التحقق:**
- تأكد من أن `maintenance.endTime` موجود
- تحقق من أن الصيانة نشطة (`is_active = true`)
- تحقق من console للأخطاء

## 🎨 التصميم

### الألوان

```
برتقالي (#FF9800) - الصيانة الجارية
رمادي (#9CA3AF) - الأزرار المعطلة
أبيض (#FFFFFF) - الخلفيات
أسود (#000000) - النصوص
```

### الرموز

- ⚠️ AlertCircle - تنبيه الصيانة
- 🕐 Clock - الوقت المتبقي
- 🔧 Wrench - إدارة الصيانة
- ✅ CheckCircle2 - اكتمال الصيانة

## ⚡ الأداء

- **تحديث كل ثانية** - عدم الإفراط في التحديثات
- **بدون تسريب ذاكرة** - تنظيف صحيح للـ timers
- **استعلامات بسيطة** - فهارس محسّنة

## 🔐 الأمان

- ✅ RLS مفعل
- ✅ سياسات وصول قوية
- ✅ فقط المسؤولون يعدلون
- ✅ الجميع يقرؤون

## 📱 التوافقية

| الجهاز | التوافقية |
|------|----------|
| أجهزة الكمبيوتر | ✅ 100% |
| الأجهزة اللوحية | ✅ 100% |
| الهواتف الذكية | ✅ 100% |
| المتصفحات الحديثة | ✅ Chrome, Firefox, Safari, Edge |

## 🧪 الاختبار

```bash
# الاختبار 1: البيانات
// التحقق من البيانات في Supabase

# الاختبار 2: العداد
// مراقبة العداد - ينقص كل ثانية

# الاختبار 3: الأزرار
// التحقق من تعطيل الأزرار

# الاختبار 4: الانتهاء
// انتظر انتهاء الصيانة - يجب أن تتفعل تلقائياً
```

## 📊 مثال البيانات

```javascript
// بيانات مضافة في Supabase
{
  id: "uuid...",
  section_name: "products",
  is_active: true,
  start_time: "2024-01-15T10:00:00Z",
  end_time: "2024-01-15T12:00:00Z",
  reason: "تحديث قاعدة البيانات",
  created_at: "2024-01-15T09:00:00Z"
}

// البيانات المعاد إرسالها للـ Frontend
{
  isUnderMaintenance: true,
  reason: "تحديث قاعدة البيانات",
  formattedTime: "1 س 45 د 30 ث",
  timeRemaining: 6330000,
  startTime: "2024-01-15T10:00:00Z",
  endTime: "2024-01-15T12:00:00Z",
  isLoading: false,
  error: null,
  refetch: [Function]
}
```

## 🛠️ الصيانة

### تنظيف البيانات

```sql
-- حذف الصيانة المنتهية
DELETE FROM maintenance 
WHERE end_time < NOW() AND is_active = false;
```

### تحديث الصيانة

```sql
-- تعطيل جميع الصيانات
UPDATE maintenance SET is_active = false;

-- تفعيل صيانة معينة
UPDATE maintenance 
SET is_active = true 
WHERE section_name = 'products';
```

## 🎓 الأمثلة

### مثال 1: صفحة المنتجات

```jsx
function ProductsPage() {
  const maintenance = useMaintenanceStatus('products');

  if (maintenance.isLoading) return <div>جاري التحقق...</div>;

  return (
    <>
      <MaintenanceAlert {...maintenance} sectionName="المنتجات" />
      {maintenance.isUnderMaintenance ? (
        <div>قسم المنتجات تحت الصيانة</div>
      ) : (
        <ProductsGrid />
      )}
    </>
  );
}
```

### مثال 2: دعم متعدد الأقسام

```jsx
function Dashboard() {
  const [sections] = useState(['products', 'categories', 'deliveries']);
  
  // أو استخدم Context
  const { isUnderMaintenance } = useMaintenanceContext();

  return (
    <div className="grid grid-cols-3 gap-4">
      {sections.map(section => (
        <Card key={section}>
          <button disabled={isUnderMaintenance(section)}>
            {section}
          </button>
        </Card>
      ))}
    </div>
  );
}
```

## 📞 الدعم والمساعدة

### موارد مفيدة

1. **مستندات Supabase**: https://supabase.com/docs
2. **React Documentation**: https://react.dev
3. **Framer Motion**: https://www.framer.com/motion/

### الأسئلة الشائعة

**س: كيف أضيف قسم جديد؟**
ج: عدّل `src/pages/MaintenanceManagementPage.jsx` وأضف القسم في الـ SECTIONS array.

**س: كيف أعطل قسم تلقائياً؟**
ج: استخدم `disabled={maintenance.isUnderMaintenance}` على الزر.

**س: هل يمكن إرسال إشعارات البريد الإلكتروني؟**
ج: نعم، أضف webhook في Supabase أو استخدم Edge Function.

## 📈 المستقبل

### الميزات المخطط لها

- 📧 إشعارات البريد الإلكتروني
- 📱 إشعارات الهاتف الذكي
- 📊 تقارير الصيانة
- 🔔 جرس الإشعارات
- 📅 جدولة الصيانة

## 📝 الترخيص

هذا الكود متاح للاستخدام الحر في المشروع.

## 🙏 شكراً

شكراً لاستخدام نظام الصيانة!

---

**آخر تحديث:** 2024
**الحالة:** جاهز للإنتاج ✅
**الإصدار:** 1.0.0
