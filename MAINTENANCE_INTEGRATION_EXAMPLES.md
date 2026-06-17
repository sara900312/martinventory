# أمثلة دمج نظام الصيانة

## مثال 1: تحديث صفحة المنتجات

### الملف: `src/pages/ProductsPage.jsx`

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import MaintenanceAlert from '@/components/MaintenanceAlert';

function ProductsPage() {
  const maintenance = useMaintenanceStatus('products');

  return (
    <div>
      <Header />
      <main className="flex-1">
        {/* عرض تنبيه الصيانة */}
        <MaintenanceAlert
          isUnderMaintenance={maintenance.isUnderMaintenance}
          reason={maintenance.reason}
          formattedTime={maintenance.formattedTime}
          sectionName="المنتجات"
        />

        {/* إذا كان تحت الصيانة، عرض رسالة */}
        {maintenance.isUnderMaintenance && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              قسم المنتجات تحت الصيانة حالياً
            </h2>
            <p className="text-yellow-800 mb-2">السبب: {maintenance.reason}</p>
            <p className="text-yellow-700">
              سيعود النظام بعد: {maintenance.formattedTime}
            </p>
          </div>
        )}

        {/* عرض المنتجات فقط إذا لم تكن تحت الصيانة */}
        {!maintenance.isUnderMaintenance && (
          <div className="products-grid">
            {/* محتوى المنتجات هنا */}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default ProductsPage;
```

## مثال 2: تحديث صفحة الفئات (RecommendationPage)

### الملف: `src/pages/RecommendationPage.jsx`

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import MaintenanceAlert from '@/components/MaintenanceAlert';
import MaintenanceSectionButton from '@/components/MaintenanceSectionButton';

function RecommendationPage() {
  const categoriesMaintenance = useMaintenanceStatus('categories');

  return (
    <div>
      <Header />
      <main className="flex-1">
        <h1>اختر الفئة المفضلة لديك</h1>

        {/* عرض التنبيه إذا كانت الفئات تحت الصيانة */}
        <MaintenanceAlert
          isUnderMaintenance={categoriesMaintenance.isUnderMaintenance}
          reason={categoriesMaintenance.reason}
          formattedTime={categoriesMaintenance.formattedTime}
          sectionName="الفئات"
        />

        {/* مثال على استخدام MaintenanceSectionButton */}
        <div className="grid grid-cols-2 gap-4">
          <MaintenanceSectionButton
            label="العناية بالشعر"
            onClick={() => handleSelectCategory('hair')}
            isUnderMaintenance={categoriesMaintenance.isUnderMaintenance}
            reason={categoriesMaintenance.reason}
            formattedTime={categoriesMaintenance.formattedTime}
          />
          <MaintenanceSectionButton
            label="العناية بالبشرة"
            onClick={() => handleSelectCategory('skin')}
            isUnderMaintenance={categoriesMaintenance.isUnderMaintenance}
            reason={categoriesMaintenance.reason}
            formattedTime={categoriesMaintenance.formattedTime}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RecommendationPage;
```

## مثال 3: تحديث صفحة الفحص (مع تعطيل زر معين)

### الملف: `src/pages/CheckoutPage.jsx`

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';

function CheckoutPage() {
  const deliveriesMaintenance = useMaintenanceStatus('deliveries');

  const handleCheckout = () => {
    if (deliveriesMaintenance.isUnderMaintenance) {
      toast({
        title: 'خدمة التوصيل غير متاحة',
        description: 'خدمة التوصيل تحت الصيانة حالياً. حاول لاحقاً.',
        variant: 'destructive',
      });
      return;
    }
    // proceed with checkout
  };

  return (
    <div>
      <Header />
      <main className="flex-1">
        {/* المحتوى الأساسي */}
        <CheckoutForm />

        {/* اختيار طريقة التوصيل */}
        <div className="mt-6">
          <h2>طريقة التوصيل</h2>

          {/* عرض التنبيه إذا كانت التوصيلات تحت الصيانة */}
          {deliveriesMaintenance.isUnderMaintenance && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 font-semibold">
                خدمة التوصيل تحت الصيانة
              </p>
              <p className="text-red-700 text-sm">السبب: {deliveriesMaintenance.reason}</p>
              <p className="text-red-600 text-sm">
                الوقت المتبقي: {deliveriesMaintenance.formattedTime}
              </p>
            </div>
          )}

          {/* زر الدفع معطل إذا كانت التوصيلات تحت الصيانة */}
          <button
            onClick={handleCheckout}
            disabled={deliveriesMaintenance.isUnderMaintenance}
            className={`py-3 px-6 rounded-lg font-bold transition ${
              deliveriesMaintenance.isUnderMaintenance
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {deliveriesMaintenance.isUnderMaintenance
              ? 'التوصيل غير متاح حالياً'
              : 'متابعة الدفع'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CheckoutPage;
```

## مثال 4: عرض عدة أقسام مع الصيانة

### استخدام Context

```jsx
import { MaintenanceProvider, useMaintenanceContext } from '@/contexts/MaintenanceContext';

// غلف التطبيق بـ MaintenanceProvider
function App() {
  return (
    <MaintenanceProvider sections={['products', 'categories', 'deliveries']}>
      <YourAppRoutes />
    </MaintenanceProvider>
  );
}

// في الصفحة، استخدم useMaintenanceContext
function DashboardPage() {
  const { getMaintenanceStatus } = useMaintenanceContext();

  const productsMaintenance = getMaintenanceStatus('products');
  const categoriesMaintenance = getMaintenanceStatus('categories');
  const deliveriesMaintenance = getMaintenanceStatus('deliveries');

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* بطاقة المنتجات */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold">المنتجات</h3>
        {productsMaintenance && (
          <div className="mt-2 bg-orange-50 p-2 rounded">
            <p className="text-orange-800 text-sm">تحت الصيانة</p>
            <p className="text-orange-600 text-xs">
              {productsMaintenance.formattedTime}
            </p>
          </div>
        )}
        <button disabled={!!productsMaintenance}>
          إدارة المنتجات
        </button>
      </div>

      {/* بطاقة الفئات */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold">الفئات</h3>
        {categoriesMaintenance && (
          <div className="mt-2 bg-orange-50 p-2 rounded">
            <p className="text-orange-800 text-sm">تحت الصيانة</p>
            <p className="text-orange-600 text-xs">
              {categoriesMaintenance.formattedTime}
            </p>
          </div>
        )}
        <button disabled={!!categoriesMaintenance}>
          إدارة الفئات
        </button>
      </div>

      {/* بطاقة التوصيل */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold">التوصيل</h3>
        {deliveriesMaintenance && (
          <div className="mt-2 bg-orange-50 p-2 rounded">
            <p className="text-orange-800 text-sm">تحت الصيانة</p>
            <p className="text-orange-600 text-xs">
              {deliveriesMaintenance.formattedTime}
            </p>
          </div>
        )}
        <button disabled={!!deliveriesMaintenance}>
          إدارة التوصيل
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
```

## مثال 5: شريط العنوان (Header) مع مؤشر الصيانة

### الملف: `src/components/Header.jsx`

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import { AlertCircle } from 'lucide-react';

function Header() {
  const productsMaintenance = useMaintenanceStatus('products');
  const categoriesMaintenance = useMaintenanceStatus('categories');
  const deliveriesMaintenance = useMaintenanceStatus('deliveries');

  const hasActiveMaintenance =
    productsMaintenance.isUnderMaintenance ||
    categoriesMaintenance.isUnderMaintenance ||
    deliveriesMaintenance.isUnderMaintenance;

  return (
    <header className="bg-white shadow-lg">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">متجري</h1>
        </div>

        {/* مؤشر الصيانة الشامل */}
        {hasActiveMaintenance && (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">صيانة جارية</span>
          </div>
        )}

        {/* الروابط */}
        <nav className="flex gap-4">
          <Link
            to="/products"
            className={
              productsMaintenance.isUnderMaintenance
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }
            onClick={(e) => {
              if (productsMaintenance.isUnderMaintenance) e.preventDefault();
            }}
          >
            المنتجات
          </Link>
          {/* روابط أخرى */}
        </nav>
      </nav>
    </header>
  );
}

export default Header;
```

## مثال 6: معالجة الخطأ والتحديث اليدوي

```jsx
import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

function MaintenanceSensitivePage() {
  const maintenance = useMaintenanceStatus('products');

  const handleRefresh = () => {
    maintenance.refetch();
  };

  if (maintenance.isLoading) {
    return <div>جاري التحقق...</div>;
  }

  if (maintenance.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">حدث خطأ: {maintenance.error}</p>
        <Button onClick={handleRefresh} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          حاول مجددا
        </Button>
      </div>
    );
  }

  return (
    <div>
      {maintenance.isUnderMaintenance && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="text-yellow-800 font-semibold">
            الخدمة تحت الصيانة
          </p>
          <p className="text-yellow-700">{maintenance.reason}</p>
          <p className="text-yellow-600 font-bold">
            {maintenance.formattedTime}
          </p>
        </div>
      )}

      {/* محتوى الصفحة */}
      <div>
        {/* محتوى */}
      </div>

      {/* زر التحديث */}
      <Button onClick={handleRefresh} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        تحديث الحالة
      </Button>
    </div>
  );
}

export default MaintenanceSensitivePage;
```

## خطوات التكامل السريعة

### لإضافة الصيانة لصفحة موجودة:

1. **أضف الاستيراد:**
   ```jsx
   import useMaintenanceStatus from '@/hooks/useMaintenanceStatus';
   import MaintenanceAlert from '@/components/MaintenanceAlert';
   ```

2. **استخدم Hook:**
   ```jsx
   const maintenance = useMaintenanceStatus('section_name');
   ```

3. **أضف المكون:**
   ```jsx
   <MaintenanceAlert
     isUnderMaintenance={maintenance.isUnderMaintenance}
     reason={maintenance.reason}
     formattedTime={maintenance.formattedTime}
     sectionName="اسم القسم"
   />
   ```

4. **عطّل الأزرار:**
   ```jsx
   <button disabled={maintenance.isUnderMaintenance}>
     الإجراء
   </button>
   ```

## ملاحظات مهمة

- استخدم `section_name` الصحيح: `products`, `categories`, `deliveries`
- تأكد من تطابق الأسماء مع ما في قاعدة البيانات
- يتم تحديث العداد الزمني تلقائياً كل ثانية
- عند انتهاء الصيانة، يتم تحديث الزر تلقائياً
