import React from 'react';
import { Loader } from 'lucide-react';

const BulkUploadProgress = ({ progress }) => {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader className="w-12 h-12 text-pink-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            معالجة الصور
          </h2>
          <p className="text-gray-600">
            التحقق من الصور والرفع جارٍ... يرجى الانتظار
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-pink-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {progress.current} / {progress.total}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(percentage)}% مكتمل
            </p>
          </div>

          {progress.currentFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">الملف الحالي:</p>
              <p className="text-sm font-mono text-blue-900 truncate">
                {progress.currentFile}
              </p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-900">
            قد يستغرق هذا بضع دقائق حسب حجم الصورة واتصالك بالإنترنت.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProgress;
