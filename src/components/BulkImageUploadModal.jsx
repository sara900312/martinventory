import React, { useState } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BulkImageUploadModal = ({ isOpen, onClose, onProceed }) => {
  const [selectedMode, setSelectedMode] = useState(null);

  const modes = [
    {
      id: 'main',
      title: 'الصورة الرئيسية فقط',
      description: 'التعيين إلى: main_image_url',
      details: 'إذا كان المنتج يحتوي بالفعل على صورة رئيسية، فسيتم استبدالها. تجاهل image_1 و image_2 و image_3.',
      icon: '📷',
    },
    {
      id: 'sub',
      title: 'الصور الفرعية (image_1, image_2, image_3)',
      description: 'الملء بالترتيب: image_1 → image_2 → image_3',
      details: 'إذا كانت الفتحات ممتلئة، قم بالتخطي والإبلاغ في الملخص.',
      icon: '🖼️',
    },
    {
      id: 'additional',
      title: 'قائمة الصور الإضافية',
      description: 'الدفع إلى المصفوفة: additional_images_list[]',
      details: '(جاهزة للمستقبل) تخزين عدة صور لكل منتج.',
      icon: '📚',
    },
  ];

  const handleProceed = () => {
    if (!selectedMode) {
      alert('Please select an assignment mode');
      return;
    }
    onProceed(selectedMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-500" />
            رفع صور المنتجات
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-900 text-sm">
              اختر المكان الذي تريد تعيين الصور فيه. بعد التحديد، سيقوم النظام بالتحقق من الصور باستخدام كشف الوجوه وتصفية NSFW قبل الرفع.
            </p>
          </div>

          <p className="text-gray-700 font-semibold mb-4">
            أين تريد تعيين هذه الصور؟
          </p>

          <div className="space-y-3">
            {modes.map((mode) => (
              <label
                key={mode.id}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedMode === mode.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="upload-mode"
                    value={mode.id}
                    checked={selectedMode === mode.id}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-5 h-5 mt-1 text-pink-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{mode.icon}</span>
                      <h3 className="font-bold text-gray-900">{mode.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{mode.description}</p>
                    <p className="text-xs text-gray-500">{mode.details}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">عملية التحقق:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ كشف الوجوه (رفض إذا تم كشف وجه)</li>
              <li>✓ تصفية NSFW (رفض إذا &gt; 40%)</li>
              <li>✓ تطبيع أسماء الملفات والمطابقة</li>
              <li>✓ معالجة الدفعات (لا تتوقف عند الأخطاء)</li>
              <li>✓ تقرير ملخص شامل</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleProceed}
            className="px-6 bg-pink-500 hover:bg-pink-600 text-white"
            disabled={!selectedMode}
          >
            متابعة مع {selectedMode ? modes.find(m => m.id === selectedMode)?.title : 'النمط المختار'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkImageUploadModal;
