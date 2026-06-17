import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, XCircle, Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import BulkImageUploadModal from './BulkImageUploadModal';
import BulkUploadProgress from './BulkUploadProgress';
import BulkUploadSummary from './BulkUploadSummary';
import {
  validateImage,
  normalizeFilename,
  normalizeProductName,
  matchFilenameToProduct,
} from '@/lib/imageValidationService';
import { resizeAndOptimizeImage, uploadImageToSupabase } from '@/lib/imageUploadService';

const BulkImageUploadTab = ({ onProductsUpdated }) => {
  const { supabase } = useSupabase();
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({
    current: 0,
    total: 0,
    currentFile: '',
  });

  const [results, setResults] = useState({
    successful: [],
    rejected: [],
    unmatched: [],
    skipped: [],
  });

  const [showSummary, setShowSummary] = useState(false);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    if (files.length > 0) {
      toast({
        title: `${files.length} files selected`,
        description: `Ready to upload and match ${files.length} image(s)`,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: 'No images',
        description: 'Please drop image files only',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(imageFiles);
    toast({
      title: `${imageFiles.length} images added`,
      description: 'Ready to upload and validate',
    });
  };

  const handleProceedWithMode = async (mode) => {
    setUploadMode(mode);
    setShowModal(false);

    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select images first',
        variant: 'destructive',
      });
      return;
    }

    await processImages(mode);
  };

  const processImages = async (mode) => {
    setIsProcessing(true);
    setResults({ successful: [], rejected: [], unmatched: [], skipped: [] });

    try {
      // Fetch all products for matching
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, name_en, main_image_url, image_1, image_2, image_3');

      if (fetchError) throw fetchError;

      const successful = [];
      const rejected = [];
      const unmatched = [];
      const skipped = [];

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProcessProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentFile: file.name,
        });

        try {
          // Validate image
          const validation = await validateImage(file);

          if (validation.rejected) {
            rejected.push({
              filename: file.name,
              reasons: validation.reasons,
            });
            continue;
          }

          // Match to product
          const matchedProduct = matchFilenameToProduct(file.name, products);

          if (!matchedProduct) {
            unmatched.push({
              filename: file.name,
            });
            continue;
          }

          // Upload based on mode
          let uploadResult = null;
          try {
            if (mode === 'main') {
              const optimizedBlob = await resizeAndOptimizeImage(file);
              const publicUrl = await uploadImageToSupabase(
                supabase,
                optimizedBlob,
                matchedProduct.id,
                'main'
              );

              // Update product
              await supabase
                .from('products')
                .update({ main_image_url: publicUrl })
                .eq('id', matchedProduct.id);

              successful.push({
                filename: file.name,
                productId: matchedProduct.id,
                productName: matchedProduct.name || matchedProduct.name_en,
                targetField: 'main_image_url',
                url: publicUrl,
              });
            } else if (mode === 'sub') {
              // Find first available slot
              let targetSlot = null;
              if (!matchedProduct.image_1) targetSlot = 'image_1';
              else if (!matchedProduct.image_2) targetSlot = 'image_2';
              else if (!matchedProduct.image_3) targetSlot = 'image_3';

              if (!targetSlot) {
                skipped.push({
                  filename: file.name,
                  productName: matchedProduct.name || matchedProduct.name_en,
                  reason: 'All sub-image slots (image_1, image_2, image_3) are full',
                });
                continue;
              }

              const imageTypeMap = {
                image_1: 'image1',
                image_2: 'image2',
                image_3: 'image3',
              };

              const optimizedBlob = await resizeAndOptimizeImage(file);
              const publicUrl = await uploadImageToSupabase(
                supabase,
                optimizedBlob,
                matchedProduct.id,
                imageTypeMap[targetSlot]
              );

              // Update product
              const updateData = {};
              updateData[targetSlot] = publicUrl;
              await supabase
                .from('products')
                .update(updateData)
                .eq('id', matchedProduct.id);

              successful.push({
                filename: file.name,
                productId: matchedProduct.id,
                productName: matchedProduct.name || matchedProduct.name_en,
                targetField: targetSlot,
                url: publicUrl,
              });
            } else if (mode === 'additional') {
              // Future: Store in additional_images_list array
              // For now, just track it as successful
              successful.push({
                filename: file.name,
                productId: matchedProduct.id,
                productName: matchedProduct.name || matchedProduct.name_en,
                targetField: 'additional_images_list',
                url: null,
                note: 'Additional images feature coming soon',
              });
            }
          } catch (uploadError) {
            rejected.push({
              filename: file.name,
              reasons: [
                {
                  type: 'upload_error',
                  message: `Upload failed: ${uploadError.message}`,
                },
              ],
            });
          }
        } catch (error) {
          rejected.push({
            filename: file.name,
            reasons: [
              {
                type: 'processing_error',
                message: `Processing failed: ${error.message}`,
              },
            ],
          });
        }
      }

      setResults({
        successful,
        rejected,
        unmatched,
        skipped,
      });

      setShowSummary(true);

      if (onProductsUpdated) {
        onProductsUpdated();
      }

      toast({
        title: 'Upload Complete',
        description: `Processed ${successful.length + rejected.length + unmatched.length} images`,
      });
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setUploadMode(null);
    setResults({ successful: [], rejected: [], unmatched: [], skipped: [] });
    setShowSummary(false);
  };

  if (showSummary) {
    return (
      <div className="space-y-6">
        <BulkUploadSummary results={results} mode={uploadMode} />
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="px-6"
          >
            Upload More Images
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return <BulkUploadProgress progress={processProgress} />;
  }

  return (
    <div className="space-y-6">
      <BulkImageUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProceed={handleProceedWithMode}
      />

      <div className="bg-gradient-to-r from-pink-50 to-blue-50 border-2 border-pink-200 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <Upload className="w-8 h-8 text-pink-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">رفع صور المنتجات بالكميات</h2>
            <p className="text-gray-700 mb-4">
              رفع عدة صور منتجات في الوقت ذاته. يقوم النظام بالتحقق التلقائي من الصور، مطابقة أسماء الملفات مع المنتجات، والرفع إلى الحقل المختار.
            </p>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center bg-white hover:bg-pink-50 transition cursor-pointer mb-4"
            >
              <Upload className="w-12 h-12 text-pink-500 mx-auto mb-3 opacity-60" />
              <p className="text-lg font-semibold text-gray-900 mb-1">
                اسحب وأفلت الصور هنا أو انقر لتحديد
              </p>
              <p className="text-sm text-gray-600 mb-4">
                الصيغ المدعومة: JPG, PNG, WebP. أقصى حجم 10 ميجابايت لكل صورة
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-pink-500 hover:bg-pink-600 text-white px-6"
              >
                اختر الصور
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  الصور المختارة ({selectedFiles.length}):
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center text-xs text-pink-600">
                          ✓
                        </span>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowModal(true)}
                disabled={selectedFiles.length === 0}
                className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 h-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                ابدأ الرفع {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </Button>
              {selectedFiles.length > 0 && (
                <Button
                  onClick={() => setSelectedFiles([])}
                  variant="outline"
                  className="px-6"
                >
                  مسح التحديد
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            التحقق
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ كشف الوجوه (رفض إذا وجد)</li>
            <li>✓ تصفية NSFW (&gt; 40%)</li>
            <li>✓ تطبيع اسم الملف</li>
            <li>✓ مطابقة أسماء المنتجات</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            الأنماط
          </h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• الصورة الرئيسية (main_image_url)</li>
            <li>• الصور الفرعية (image_1-3)</li>
            <li>• قائمة الصور الإضافية</li>
            <li>• معالجة الدفعة (بدون توقف)</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            النتائج
          </h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>✓ الرفع الناجح</li>
            <li>✗ مرفوضة (وجه/NSFW)</li>
            <li>✗ أسماء غير متطابقة</li>
            <li>! تم تخطيها (فتحات ممتلئة)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkImageUploadTab;
