# نظام الصيانة - دليل البدء السريع

## 📋 الملفات المضافة

```
✅ src/lib/maintenanceService.js              # خدمة API
✅ src/hooks/useMaintenanceStatus.js          # Hook مخصص
✅ src/contexts/MaintenanceContext.jsx        # Context عام
✅ src/components/MaintenanceAlert.jsx        # مكون التنبيه
✅ src/components/MaintenanceSectionButton.jsx # زر مع صيانة
✅ src/pages/MaintenanceManagementPage.jsx    # صفحة الإدارة
✅ تحديث src/pages/InventoryPage.jsx         # إضافة الزر
✅ تحديث src/App.jsx                         # إضافة الراوت
```

## 🚀 الخطوات الأولى

### الخطوة 1: إعداد قاعدة البيانات

شغّل هذا SQL في Supabase:

```sql
CREATE TABLE maintenance (
  id uuid primary key default gen_random_uuid(),
  section_name text not null,
  is_active boolean default true,
  start_time timestamp not null,
  end_time timestamp not null,
  reason text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

CREATE INDEX idx_maintenance_section_name ON maintenance(section_name);
CREATE INDEX idx_maintenance_is_active ON maintenance(is_active);
CREATE INDEX idx_maintenance_time_window ON maintenance(start_time, end_time);

ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON maintenance
  FOR SELECT USING (true);
```

### الخطوة 2: الوصول لصفحة الإدارة

- اذهب إلى: `/inventory`
- انقر على "إعدادات المخزن"
- اختر "إدارة الصيانة"

### الخطوة 3: أضف فترة صيانة

1. اختر القسم (products, categories, deliveries)
2. أدخل السبب (اختياري)
3. حدد وقت البدء والانتهاء
4. انقر "إضافة"

## 📝 أمثلة الاستخدام

### استخدام بسيط (Hook واحد)

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

### استخدام متقدم (عدة أقسام)

```jsx
import { MaintenanceProvider } from '@/contexts/MaintenanceContext';

// في App.jsx
<MaintenanceProvider sections={['products', 'categories', 'deliveries']}>
  <YourApp />
</MaintenanceProvider>

// في الصفحات
import { useMaintenanceContext } from '@/contexts/MaintenanceContext';

function Dashboard() {
  const { isUnderMaintenance } = useMaintenanceContext();
  
  return (
    <button disabled={isUnderMaintenance('products')}>
      المنتجات
    </button>
  );
}
```

## 🎯 الأقسام المدعومة

| الاسم الإنجليزي | الوصف |
|---|---|
| `products` | المنتجات العامة |
| `categories` | الفئات والأقسام |
| `deliveries` | خدمات التوصيل |

## ⏱️ أمثلة الأوقات

### صيغة ISO الكاملة:
```
2024-01-15T10:30:00
2024-01-15T12:00:00
```

### أو استخدم datetime-local في الفورم:
```html
<input type="datetime-local" />
```

## 🔄 العداد التلقائي

- يتم التحديث كل ثانية
- يظهر الوقت المتبقي بصيغة: "2 س 30 د 15 ث"
- عند الانتهاء، يتم إزالة التنبيه تلقائياً

## 🛡️ الأمان

✅ RLS مفعل في Supabase
✅ فقط المسؤولون يمكنهم التعديل
✅ الجميع يمكنهم القراءة

## 🔍 استكشاف الأخطاء

### لا تظهر الصيانة؟
1. تحقق من اسم القسم (يجب أن يكون: products, categories, deliveries)
2. تأكد من أن is_active = true
3. تحقق من الوقت الحالي (يجب أن يكون بين start_time و end_time)

### الأزرار لا تتعطل؟
1. استخدم `disabled={maintenance.isUnderMaintenance}`
2. تحقق من console للأخطاء

## 📱 على الهاتف الذكي

التصميم متجاوب تلقائياً:
- الأزرار تصغر على الشاشات الصغيرة
- التنبيهات تظهر بوضوح
- العداد واضح وسهل القراءة

## 🚨 رسالة الصيانة

```
⚠️ قسم [الاسم] تحت الصيانة

السبب: [السبب]
الوقت المتبقي: [العداد]
```

## 🎨 التصميم

- الألوان: برتقالي للصيانة الجارية
- رموز: تنبيه وساعة
- تأثيرات: حركات سلسة

## 📊 المعلومات المعروضة

```javascript
{
  isUnderMaintenance: true/false,  // هل تحت الصيانة؟
  reason: "string",               // السبب
  formattedTime: "2 س 30 د",      // الوقت المتبقي
  timeRemaining: 9000000,         // بالميلي ثانية
  startTime: "2024-01-15T...",    // وقت البدء
  endTime: "2024-01-15T...",      // وقت الانتهاء
  isLoading: false,               // جاري التحميل؟
  error: null,                    // خطأ (إن وجد)
  refetch: function               // دالة التحديث
}
```

## ✨ الميزات

✅ عداد زمني حي
✅ تحديث تلقائي
✅ تصميم متجاوب
✅ رسائل واضحة
✅ سهل الاستخدام
✅ آمن وموثوق

## 📚 المستندات الكاملة

- **MAINTENANCE_SYSTEM_SETUP.md** - دليل الإعداد الكامل
- **MAINTENANCE_INTEGRATION_EXAMPLES.md** - أمثلة التكامل
- **MAINTENANCE_QUICK_START.md** - هذا الملف

## 🎬 الخطوات التالية

1. ✅ نشر قاعدة البيانات
2. ✅ اختبار صفحة الإدارة
3. ✅ تطبيق الصيانة على الصفحات المطلوبة
4. ✅ اختبار العداد والأزرار المعطلة

---

**تم الإنشاء:** نظام صيانة شامل لإدارة فترات صيانة الأقسام المختلفة
