# نظام الصيانة - دليل الإعداد والاستخدام

## 1. إعداد قاعدة البيانات

### إنشاء جدول الصيانة

قم بتشغيل الأمر التالي في Supabase SQL Editor:

```sql
-- Create maintenance table
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

-- Add indexes for better performance
CREATE INDEX idx_maintenance_section_name ON maintenance(section_name);
CREATE INDEX idx_maintenance_is_active ON maintenance(is_active);
CREATE INDEX idx_maintenance_time_window ON maintenance(start_time, end_time);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (public read)
CREATE POLICY "Allow public read" ON maintenance
  FOR SELECT USING (true);

-- Create policy for admin write (if you have an admin role)
CREATE POLICY "Allow admin write" ON maintenance
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## 2. الأقسام المدعومة

الأقسام الحالية المدعومة في النظام:

- `deliveries` - التوصيلات
- `products` - المنتجات العامة
- `categories` - الفئات

يمكنك إضافة أقسام جديدة عن طريق تعديل الملف: `src/pages/MaintenanceManagementPage.jsx`

## 3. المكونات والخدمات

### المسارات الرئيسية للملفات:

```
src/
├── lib/
│   └── maintenanceService.js          # خدمة API للتواصل مع جدول الصيانة
├── hooks/
│   └── useMaintenanceStatus.js        # Hook مخصص لإدارة حالة الصيانة
├── contexts/
│   └── MaintenanceContext.jsx         # Context عام لإدارة الصيانة
├── components/
│   ├── MaintenanceAlert.jsx           # مكون لعرض تنبيهات الصيانة
│   └── MaintenanceSectionButton.jsx   # زر مع دعم حالة الصيانة
└── pages/
    └── MaintenanceManagementPage.jsx  # صفحة الإدارة (للمسؤولين فقط)
```

## 4. طرق الاستخدام

### الطريقة 1: استخدام Hook (لقسم واحد)

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';

function MyComponent() {
  const maintenance = useMaintenanceStatus('products');

  return (
    <div>
      {maintenance.isUnderMaintenance && (
        <div>
          قسم تحت الصيانة
          <p>السبب: {maintenance.reason}</p>
          <p>الوقت المتبقي: {maintenance.formattedTime}</p>
        </div>
      )}
    </div>
  );
}
```

### الطريقة 2: استخدام Context (لعدة أقسام)

```jsx
import { MaintenanceProvider, useMaintenanceContext } from '@/contexts/MaintenanceContext';

function App() {
  return (
    <MaintenanceProvider sections={['products', 'categories', 'deliveries']}>
      <YourComponent />
    </MaintenanceProvider>
  );
}

function YourComponent() {
  const { isUnderMaintenance, getMaintenanceStatus } = useMaintenanceContext();

  const productsStatus = getMaintenanceStatus('products');

  return (
    <button disabled={isUnderMaintenance('products')}>
      المنتجات
    </button>
  );
}
```

### الطريقة 3: استخدام MaintenanceAlert

```jsx
import MaintenanceAlert from '@/components/MaintenanceAlert';
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';

function MySection() {
  const maintenance = useMaintenanceStatus('deliveries');

  return (
    <>
      <MaintenanceAlert
        isUnderMaintenance={maintenance.isUnderMaintenance}
        reason={maintenance.reason}
        formattedTime={maintenance.formattedTime}
        sectionName="التوصيلات"
      />
      <button disabled={maintenance.isUnderMaintenance}>
        عرض التوصيلات
      </button>
    </>
  );
}
```

### الطريقة 4: استخدام MaintenanceSectionButton

```jsx
import MaintenanceSectionButton from '@/components/MaintenanceSectionButton';
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import { Package } from 'lucide-react';

function SectionButtons() {
  const maintenance = useMaintenanceStatus('products');

  return (
    <MaintenanceSectionButton
      icon={Package}
      label="المنتجات"
      onClick={() => navigate('/products')}
      isUnderMaintenance={maintenance.isUnderMaintenance}
      reason={maintenance.reason}
      formattedTime={maintenance.formattedTime}
    />
  );
}
```

## 5. صفحة الإدارة

الوصول إلى صفحة إدارة الصيانة:
- المسار: `/maintenance-management`
- المتطلبات: دور المسؤول فقط
- الوظائف:
  - إضافة فترة صيانة جديدة
  - تعديل فترات الصيانة الموجودة
  - حذف فترات الصيانة
  - عرض حالة الصيانة الحالية

## 6. السلوك التلقائي

### العداد الزمني (Countdown Timer)

- يتم تحديث الوقت المتبقي كل ثانية تلقائياً
- عند انتهاء الصيانة (وصول الوقت إلى end_time)، يتم تعطيل الزر تلقائياً

### التحديث التلقائي

- يتم التحقق من حالة الصيانة عند تحميل الصفحة
- يمكن استدعاء `refetch()` لتحديث البيانات يدويًا

## 7. مثال عملي كامل

```jsx
// في صفحة المنتجات
import React from 'react';
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import MaintenanceAlert from '@/components/MaintenanceAlert';

function ProductsPage() {
  const maintenance = useMaintenanceStatus('products');

  if (maintenance.isLoading) {
    return <div>جاري التحقق من حالة النظام...</div>;
  }

  return (
    <div>
      <MaintenanceAlert
        isUnderMaintenance={maintenance.isUnderMaintenance}
        reason={maintenance.reason}
        formattedTime={maintenance.formattedTime}
        sectionName="المنتجات"
      />

      <button disabled={maintenance.isUnderMaintenance}>
        عرض المنتجات
      </button>

      {maintenance.isUnderMaintenance && (
        <div>
          <p>السبب: {maintenance.reason}</p>
          <p>سيعود الخدمة بعد: {maintenance.formattedTime}</p>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
```

## 8. تنسيق البيانات المرجعة

### من `getMaintenanceStatus`:

```javascript
{
  isUnderMaintenance: boolean,
  reason: string | null,
  startTime: string (ISO format) | null,
  endTime: string (ISO format) | null,
  timeRemaining: number (milliseconds) | null,
  formattedTime: string (e.g., "2 س 30 د") | '',
  isLoading: boolean,
  error: string | null,
  refetch: function
}
```

## 9. تنسيق الوقت

يتم تنسيق الوقت المتبقي بالعربية:
- `س` = ساعات
- `د` = دقائق
- `ث` = ثواني

مثال: "2 س 30 د 15 ث"

## 10. ملاحظات أمان

- تأكد من تعطيل الوصول المباشر للجدول للمستخدمين العاديين
- استخدم Row Level Security (RLS) في Supabase
- اسمح فقط للمسؤولين بالكتابة والتحديث
- السماح للجميع بالقراءة (اختياري حسب متطلباتك)

## 11. استكشاف الأخطاء

### المشكلة: لا تظهر تنبيهات الصيانة

**الحل:**
1. تحقق من أن الجدول موجود في قاعدة البيانات
2. تأكد من صحة `section_name`
3. تحقق من أن `is_active = true`
4. تحقق من أن الوقت الحالي بين `start_time` و `end_time`

### المشكلة: الأزرار لا تتعطل

**الحل:**
1. تأكد من استخدام `maintenance.isUnderMaintenance` في الخاصية `disabled`
2. تحقق من وجود الخطأ في console

## 12. موارد إضافية

- صفحة الإدارة: `/maintenance-management`
- مسار المخزن: `/inventory` (يحتوي على زر الوصول لإدارة الصيانة)
