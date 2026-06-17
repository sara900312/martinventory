import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  SkipForward,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BulkUploadSummary = ({ results, mode }) => {
  const { successful, rejected, unmatched, skipped } = results;

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      mode,
      summary: {
        successful: successful.length,
        rejected: rejected.length,
        unmatched: unmatched.length,
        skipped: skipped.length,
      },
      details: {
        successful,
        rejected,
        unmatched,
        skipped,
      },
    };

    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-upload-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const modeLabel = {
    main: 'الصورة الرئيسية (main_image_url)',
    sub: 'الصور الفرعية (image_1, image_2, image_3)',
    additional: 'قائمة الصور الإضافية',
  }[mode] || mode;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 border-2 border-pink-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          اكتمل الرفع
        </h2>
        <p className="text-gray-700 mb-4">
          النمط: <span className="font-semibold">{modeLabel}</span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {successful.length}
            </div>
            <p className="text-xs text-gray-600">ناجح</p>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {rejected.length}
            </div>
            <p className="text-xs text-gray-600">مرفوض</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 mb-1">
              {unmatched.length}
            </div>
            <p className="text-xs text-gray-600">غير متطابق</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {skipped.length}
            </div>
            <p className="text-xs text-gray-600">تم تخطيه</p>
          </div>
        </div>
      </div>

      {/* Successfully Assigned Images */}
      {successful.length > 0 && (
        <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              تم التعيين بنجاح ({successful.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-green-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-green-900">
                    اسم الصورة
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-green-900">
                    اسم المنتج
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-green-900">
                    الحقل المستهدف
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {successful.map((item, idx) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="px-6 py-3 text-gray-900 font-mono text-xs">
                      {item.filename}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {item.productName}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {item.targetField}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejected Images */}
      {rejected.length > 0 && (
        <div className="bg-white border-2 border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              مرفوضة بسبب فشل التحقق ({rejected.length})
            </h3>
          </div>
          <div className="space-y-3 p-6">
            {rejected.map((item, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2 font-mono text-sm">
                  {item.filename}
                </p>
                <ul className="space-y-1">
                  {item.reasons.map((reason, rIdx) => (
                    <li key={rIdx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>
                        <strong className="capitalize">
                          {reason.type.replace(/_/g, ' ')}:
                        </strong>{' '}
                        {reason.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched Images */}
      {unmatched.length > 0 && (
        <div className="bg-white border-2 border-amber-200 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Unmatched Images ({unmatched.length})
            </h3>
            <p className="text-xs text-amber-800 mt-1">
              No product name matched these filenames. The system uses normalized name matching (lowercase, no special characters).
            </p>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {unmatched.map((item, idx) => (
                <li
                  key={idx}
                  className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 font-mono text-xs text-amber-900"
                >
                  {item.filename}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-700 mt-4 p-3 bg-amber-100 rounded-lg">
              💡 Tip: Rename unmatched images to match product names exactly (after normalization). For example, "Divage Lipstick Red.jpg" would match a product named "Divage Lipstick Red".
            </p>
          </div>
        </div>
      )}

      {/* Skipped Images */}
      {skipped.length > 0 && (
        <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <SkipForward className="w-6 h-6" />
              Skipped Sub-Images ({skipped.length})
            </h3>
            <p className="text-xs text-blue-800 mt-1">
              All sub-image slots (image_1, image_2, image_3) were full for these products.
            </p>
          </div>
          <div className="space-y-3 p-6">
            {skipped.map((item, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-1 font-mono text-sm">
                  {item.filename}
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  Product: <strong>{item.productName}</strong>
                </p>
                <p className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Report Button */}
      <div className="flex justify-end">
        <Button
          onClick={downloadReport}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report (JSON)
        </Button>
      </div>
    </div>
  );
};

export default BulkUploadSummary;
