import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { testUrlAccessibility, checkBucketConfiguration } from '@/lib/supabaseStorageUtils';
import { POPUP_MEDIA_BUCKET } from '@/lib/mediaStorageSetup';

export const BucketAccessDiagnostic = ({ testUrl = null }) => {
  const [bucketStatus, setBucketStatus] = useState(null);
  const [urlStatus, setUrlStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const runDiagnostics = async () => {
      setIsLoading(true);

      // Check bucket configuration
      const bucketConfig = await checkBucketConfiguration();
      setBucketStatus(bucketConfig);

      // Test URL accessibility if provided
      if (testUrl) {
        const isAccessible = await testUrlAccessibility(testUrl);
        setUrlStatus({
          url: testUrl,
          accessible: isAccessible,
          error: !isAccessible ? 'URL is not accessible - bucket may not be public' : null,
        });
      }

      setIsLoading(false);
    };

    runDiagnostics();
  }, [testUrl]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
        <Loader className="h-5 w-5 animate-spin text-blue-600" />
        <p className="text-sm text-blue-700">جاري التحقق من إعدادات التخزين...</p>
      </div>
    );
  }

  if (!bucketStatus) {
    return null;
  }

  const hasIssues = !bucketStatus.accessible || !bucketStatus.public || (urlStatus && !urlStatus.accessible);

  if (!hasIssues && !showDetails) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${hasIssues ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start gap-3">
        {hasIssues ? (
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1">
          {hasIssues ? (
            <>
              <h3 className="font-semibold text-amber-900 mb-2">⚠️ مشكلة في إعدادات التخزين</h3>
              <div className="space-y-2 text-sm text-amber-800">
                {!bucketStatus.accessible && (
                  <p>❌ دلو التخزين "{POPUP_MEDIA_BUCKET}" غير متاح</p>
                )}
                {!bucketStatus.public && (
                  <p>❌ دلو التخزين ليس عام (Public) - لا يمكن عرض الصور والفيديوهات</p>
                )}
                {urlStatus && !urlStatus.accessible && (
                  <p>❌ الرابط المباشر غير متاح: يجب جعل الدلو عام</p>
                )}

                <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                  <p className="font-semibold mb-2">الحل السريع:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>اذهب إلى Supabase Dashboard</li>
                    <li>انقر على Storage من القائمة الجانبية</li>
                    <li>ابحث عن دلو "{POPUP_MEDIA_BUCKET}"</li>
                    <li>اضغط على الثلاث نقاط (⋮) وحدد Edit</li>
                    <li>فعّل "Public bucket"</li>
                    <li>احفظ التغييرات</li>
                  </ol>
                </div>

                <p className="text-xs mt-3">
                  للمزيد من التفاصيل، اقرأ:{' '}
                  <a 
                    href="/POPUP_MEDIA_BUCKET_CONFIGURATION.md"
                    className="underline text-amber-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    دليل تكوين دلو التخزين
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-green-900 mb-1">✓ إعدادات التخزين صحيحة</h3>
              <p className="text-sm text-green-800">
                دلو "{POPUP_MEDIA_BUCKET}" متاح وعام - يجب أن تعمل الصور والفيديوهات بشكل صحيح
              </p>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="flex-shrink-0"
        >
          {showDetails ? 'إخفاء' : 'التفاصيل'}
        </Button>
      </div>

      {showDetails && bucketStatus && (
        <div className="mt-4 p-3 bg-white rounded border text-xs space-y-2">
          <p><strong>حالة الدلو:</strong></p>
          <pre className="bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify({
              bucket: POPUP_MEDIA_BUCKET,
              accessible: bucketStatus.accessible,
              public: bucketStatus.public,
              corsConfigured: bucketStatus.corsConfigured,
              error: bucketStatus.error,
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
