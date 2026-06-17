import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const PRODUCTS_BUCKET = 'products';

const SUPPORTED_FORMATS = {
  image: {
    types: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    label: 'PNG, JPG, GIF, WebP',
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGES = 4; // 1 main + 3 sub-images

const ProductMediaPreview = ({ image, label, onRemove, isMain = false }) => {
  return (
    <div className="relative group">
      <div className="relative">
        <img
          src={image.url}
          alt={label}
          className="w-full h-40 object-cover rounded-lg"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(image.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isMain && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
            الصورة الرئيسية
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        <p className="font-medium">{label}</p>
        {image.name && <p className="truncate">{image.name}</p>}
      </div>
    </div>
  );
};

export const ProductMediaManager = ({
  value = [],
  onChange,
  productId,
}) => {
  const [uploadedMedia, setUploadedMedia] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [bucketError, setBucketError] = useState(null);

  // Check bucket access on mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { error } = await supabase.storage
          .from(PRODUCTS_BUCKET)
          .list('', { limit: 1 });

        if (error) {
          setBucketError('مشكلة في الاتصال بخزن الملفات. يرجى المحاولة لاحقاً.');
        }
      } catch (error) {
        setBucketError('تعذر الاتصال بخزن الملفات.');
      }
    };

    checkBucket();
  }, []);

  const getStoragePath = useCallback((fileName) => {
    const folder = productId || `temp_${Date.now()}`;
    return `${folder}/${fileName}`;
  }, [productId]);

  const getMediaType = (file) => {
    if (SUPPORTED_FORMATS.image.types.includes(file.type)) return 'image';
    return null;
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `حجم الملف يتجاوز حد 50 ميجابايت (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    const mediaType = getMediaType(file);
    if (!mediaType) {
      return 'صيغة الملف غير مدعومة. يرجى استخدام PNG, JPG, GIF, أو WebP';
    }

    return null;
  };

  const uploadFile = async (file) => {
    // Check if we've reached max images
    if (uploadedMedia.length >= MAX_IMAGES) {
      setValidationError(`يمكنك رفع ${MAX_IMAGES} صور كحد أقصى (صورة رئيسية + 3 صور فرعية)`);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationError('');

    try {
      setUploadProgress(10);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = getStoragePath(fileName);

      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(PRODUCTS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      setUploadProgress(50);

      let mediaItem;

      if (uploadError) {
        console.warn('Storage upload failed:', uploadError);
        setValidationError('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(PRODUCTS_BUCKET)
        .getPublicUrl(path);

      mediaItem = {
        id: fileName,
        name: file.name,
        url: data.publicUrl,
        type: file.type,
        size: file.size,
      };

      setUploadProgress(100);

      const newMedia = [...uploadedMedia, mediaItem];
      setUploadedMedia(newMedia);
      onChange(newMedia);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setValidationError(`خطأ: ${err.message}`);
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => uploadFile(file));
  }, [uploadedMedia, productId]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadFile(file));
    e.target.value = '';
  };

  const handleRemoveMedia = (mediaId) => {
    const newMedia = uploadedMedia.filter(m => m.id !== mediaId);
    setUploadedMedia(newMedia);
    onChange(newMedia);
  };

  // Get labels for each image
  const getImageLabels = () => {
    const labels = ['الصورة الرئيسية'];
    labels.push('صورة فرعية 1');
    labels.push('صورة فرعية 2');
    labels.push('صورة فرعية 3');
    return labels;
  };

  const imageLabels = getImageLabels();

  return (
    <div className="space-y-6">
      {bucketError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ <strong>{bucketError}</strong>
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-base font-semibold">رفع الصور</Label>
        <p className="text-sm text-muted-foreground">
          رفع صورة رئيسية وحتى 3 صور فرعية (حتى 50 ميجابايت لكل صورة)
        </p>

        {/* Drag and Drop Area */}
        {uploadedMedia.length < MAX_IMAGES && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-input bg-muted/20 hover:bg-muted/40'
            )}
          >
            <input
              type="file"
              onChange={handleFileInput}
              accept={SUPPORTED_FORMATS.image.types.join(',')}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <p className="font-medium">
                  {isUploading ? 'جاري الرفع...' : 'اسحب الصورة هنا'}
                </p>
                <p className="text-sm text-muted-foreground">
                  أو انقر للاستعراض
                </p>
              </div>

              {isUploading && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  الصور المدعومة: {SUPPORTED_FORMATS.image.label}
                </p>
                <p>الحد الأقصى للحجم: 50 ميجابايت</p>
                <p>
                  الصور المتبقية: {MAX_IMAGES - uploadedMedia.length} من {MAX_IMAGES}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      {/* Selected Media Preview */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            الصور المرفوعة ({uploadedMedia.length}/{MAX_IMAGES})
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedMedia.map((media, index) => (
              <ProductMediaPreview
                key={media.id}
                image={media}
                label={imageLabels[index]}
                onRemove={handleRemoveMedia}
                isMain={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {uploadedMedia.length === 0 && (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            لم يتم رفع أي صور حتى الآن
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductMediaManager;
