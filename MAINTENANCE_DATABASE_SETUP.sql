-- =====================================
-- نظام الصيانة - إعداد قاعدة البيانات
-- Maintenance System - Database Setup
-- =====================================

-- 1. إنشاء جدول الصيانة
-- Create maintenance table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name text NOT NULL,
  is_active boolean DEFAULT true,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT maintenance_section_name_check CHECK (section_name IN ('products', 'categories', 'deliveries')),
  CONSTRAINT maintenance_time_check CHECK (start_time < end_time)
);

-- 2. إنشاء الفهارس (Indexes) لتحسين الأداء
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_section_name 
ON public.maintenance(section_name);

CREATE INDEX IF NOT EXISTS idx_maintenance_is_active 
ON public.maintenance(is_active);

CREATE INDEX IF NOT EXISTS idx_maintenance_time_window 
ON public.maintenance(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_maintenance_active_sections 
ON public.maintenance(section_name, is_active, start_time, end_time);

-- 3. تفعيل Row Level Security (RLS)
-- Enable Row Level Security
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- 4. حذف السياسات القديمة إذا كانت موجودة
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read on maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Allow admin full access on maintenance" ON public.maintenance;

-- 5. سياسات الوصول (Access Policies)
-- Policy 1: السماح بالقراءة للجميع
-- Allow public read
CREATE POLICY "Allow public read on maintenance"
ON public.maintenance
FOR SELECT
USING (true);

-- Policy 2: السماح للمسؤولين بالكتابة والتعديل والحذف
-- Allow admin write/update/delete
-- Note: Adjust auth.jwt() condition based on your Supabase setup
CREATE POLICY "Allow admin full access on maintenance"
ON public.maintenance
FOR ALL
USING (
  -- Check if the user is an admin
  -- This assumes you have an admin role or similar
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- 6. تفعيل تحديث تلقائي للـ updated_at
-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_maintenance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS maintenance_update_timestamp ON public.maintenance;

-- Create trigger
CREATE TRIGGER maintenance_update_timestamp
BEFORE UPDATE ON public.maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_maintenance_timestamp();

-- =====================================
-- بيانات اختبار (Test Data) - اختياري
-- =====================================

-- إزالة البيانات القديمة
-- DELETE FROM public.maintenance WHERE section_name IN ('products', 'categories', 'deliveries');

-- إضافة بيانات اختبار
-- Uncomment to add test data
/*
INSERT INTO public.maintenance (section_name, is_active, start_time, end_time, reason)
VALUES
  (
    'products',
    true,
    NOW(),
    NOW() + INTERVAL '1 hour',
    'تحديث قاعدة البيانات - Database Update'
  ),
  (
    'categories',
    true,
    NOW(),
    NOW() + INTERVAL '30 minutes',
    'صيانة الخادم - Server Maintenance'
  ),
  (
    'deliveries',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours',
    'صيانة اختبار - Test Maintenance'
  );
*/

-- =====================================
-- الاستعلامات المفيدة (Useful Queries)
-- =====================================

-- 1. عرض جميع فترات الصيانة النشطة حالياً
-- Get all active maintenance records
/*
SELECT 
  id,
  section_name,
  reason,
  start_time,
  end_time,
  (end_time - NOW()) as time_remaining,
  is_active
FROM public.maintenance
WHERE is_active = true
  AND NOW() BETWEEN start_time AND end_time
ORDER BY end_time ASC;
*/

-- 2. عرض جميع فترات الصيانة المستقبلية
-- Get all future maintenance records
/*
SELECT 
  id,
  section_name,
  reason,
  start_time,
  end_time,
  is_active
FROM public.maintenance
WHERE start_time > NOW()
ORDER BY start_time ASC;
*/

-- 3. عرض فترات الصيانة حسب القسم
-- Get maintenance records by section
/*
SELECT 
  id,
  section_name,
  reason,
  start_time,
  end_time,
  is_active
FROM public.maintenance
WHERE section_name = 'products'
ORDER BY created_at DESC;
*/

-- 4. عرض إحصائيات الصيانة
-- Get maintenance statistics
/*
SELECT 
  section_name,
  COUNT(*) as total_maintenance,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN NOW() BETWEEN start_time AND end_time THEN 1 END) as currently_active
FROM public.maintenance
GROUP BY section_name
ORDER BY section_name;
*/

-- =====================================
-- عمليات الصيانة (Maintenance Operations)
-- =====================================

-- تعطيل جميع فترات الصيانة
-- Disable all maintenance records
/*
UPDATE public.maintenance 
SET is_active = false
WHERE is_active = true;
*/

-- حذف فترات الصيانة المنتهية
-- Delete expired maintenance records
/*
DELETE FROM public.maintenance
WHERE end_time < NOW() AND is_active = false;
*/

-- تحديث فترة صيانة موجودة
-- Update an existing maintenance record
/*
UPDATE public.maintenance
SET 
  reason = 'سبب جديد - New Reason',
  end_time = NOW() + INTERVAL '2 hours'
WHERE section_name = 'products' AND is_active = true;
*/

-- =====================================
-- تحقق من الإعدادات
-- =====================================

-- عرض معلومات الجدول
-- Show table info
-- \d public.maintenance;

-- عرض السياسات المفعلة
-- Show active policies
-- SELECT * FROM pg_policies WHERE tablename = 'maintenance';

-- عرض الفهارس
-- Show indexes
-- \di public.idx_maintenance*;

-- =====================================
-- ملاحظات مهمة
-- Important Notes
-- =====================================

/*
1. تعديل سياسة الوصول:
   - استبدل auth.uid() IN (SELECT...) برقم معرّف المستخدم أو الدور الفعلي
   - قد تحتاج إلى التحقق من app_metadata أو raw_user_meta_data في Supabase

2. الأقسام المدعومة:
   - 'products' - المنتجات العامة
   - 'categories' - الفئات والأقسام
   - 'deliveries' - خدمات التوصيل

3. الأداء:
   - الفهارس مفعلة للأداء العالي
   - استعلامات بسيطة وسريعة

4. الأمان:
   - RLS مفعل
   - سياسات وصول قوية
   - تحقق من البيانات على الـ Backend

5. الصيانة:
   - يتم تحديث updated_at تلقائياً
   - حذف البيانات المنتهية بانتظام
*/

-- End of file
