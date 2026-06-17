import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Trash2, Filter, Eye, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { POPUP_MEDIA_BUCKET } from '@/lib/mediaStorageSetup';
import { validateImageWithDetails } from '@/lib/validateImageClientSide';
import { validateVideoWithDetails } from '@/lib/validateVideoClientSide';

const SUPPORTED_FORMATS = {
  image: {
    types: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    label: 'PNG, JPG, GIF, WebP',
  },
  video: {
    types: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    extensions: ['mp4', 'webm', 'ogv', 'ogg', 'mov', 'qt'],
    label: 'MP4, WebM, OGG, QuickTime',
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper function to move session files to final folder when popup/product is saved
// Type can be 'popup' or 'product'
export const moveSessionFilesToPopup = async (sessionId, idValue, mediaItems, type = 'popup') => {
  if (!sessionId || !idValue) return mediaItems;

  const updatedMedia = [];
  const finalFolder = type === 'product' ? `product_${idValue}` : `popup_${idValue}`;

  for (const media of mediaItems) {
    // If media is from session folder, move it to final folder
    if (media.id && !media.url.includes(finalFolder)) {
      try {
        const fileExt = media.name.split('.').pop();
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const sourcePath = `${sessionId}/${media.id}`;
        const destPath = `${finalFolder}/${newFileName}`;

        // Copy file from session to popup folder
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(POPUP_MEDIA_BUCKET)
          .download(sourcePath);

        if (!downloadError && fileData) {
          const { error: uploadError } = await supabase.storage
            .from(POPUP_MEDIA_BUCKET)
            .upload(destPath, fileData, {
              contentType: media.type || 'application/octet-stream',
            });

          if (!uploadError) {
            const { data } = supabase.storage
              .from(POPUP_MEDIA_BUCKET)
              .getPublicUrl(destPath);

            updatedMedia.push({
              ...media,
              id: newFileName,
              url: data.publicUrl,
            });

            // Delete from session folder
            await supabase.storage
              .from(POPUP_MEDIA_BUCKET)
              .remove([sourcePath]);
          } else {
            updatedMedia.push(media);
          }
        } else {
          updatedMedia.push(media);
        }
      } catch (error) {
        console.error('Error moving file to popup folder:', error);
        updatedMedia.push(media);
      }
    } else {
      updatedMedia.push(media);
    }
  }

  return updatedMedia;
};

const MediaPreview = ({ media, onRemove }) => {
  const isVideo = media.type.startsWith('video');

  return (
    <div className="relative group">
      {isVideo ? (
        <video
          src={media.url}
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <img
          src={media.url}
          alt={media.name}
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(media.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-xs truncate text-muted-foreground">
        {media.name}
      </div>
    </div>
  );
};

export const MediaManager = ({
  value = [],
  onChange,
  popupId,
}) => {
  const [uploadedMedia, setUploadedMedia] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [validationError, setValidationError] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [bucketError, setBucketError] = useState(null);

  // Check bucket access on mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { error } = await supabase.storage
          .from(POPUP_MEDIA_BUCKET)
          .list('', { limit: 1 });

        if (error) {
          setBucketError('مشكلة في الاتصال بخزن الملفات. يمكنك استخدام روابط URL مباشرة للآن.');
        }
      } catch (error) {
        setBucketError('تعذر الاتصال بخزن الملفات.');
      }
    };

    checkBucket();
  }, []);

  // Use session folder for new items, specific folder for existing items
  // popupId can be: popup_<popupId>, product_<productId>, or session_<timestamp>
  const getStoragePath = useCallback((fileName) => {
    let folder;
    if (popupId) {
      // If popupId already includes folder prefix (product_ or popup_), use as-is
      if (popupId.startsWith('product_') || popupId.startsWith('popup_') || popupId.startsWith('session_')) {
        folder = popupId;
      } else {
        // Legacy format: add popup_ prefix
        folder = `popup_${popupId}`;
      }
    } else {
      folder = sessionId;
    }
    return `${folder}/${fileName}`;
  }, [popupId, sessionId]);

  const fetchMediaLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    try {
      // Get media from both session and specific folders
      const paths = [];

      if (popupId) {
        // If popupId already includes folder prefix (product_ or popup_), use as-is
        if (popupId.startsWith('product_') || popupId.startsWith('popup_') || popupId.startsWith('session_')) {
          paths.push(popupId);
        } else {
          // Legacy format: add popup_ prefix
          paths.push(`popup_${popupId}`);
        }
      }

      // Also fetch from session folder
      paths.push(sessionId);

      // Fetch from all popup folders for browsing
      const { data: allFolders, error: folderError } = await supabase.storage
        .from(POPUP_MEDIA_BUCKET)
        .list('', { limit: 1000 });

      const allMedia = [];

      if (!folderError && allFolders) {
        for (const folder of allFolders) {
          if (folder.name.startsWith('popup_') || folder.name.startsWith('product_') || folder.name.startsWith('session_') || folder.name === sessionId) {
            const { data: listData, error: listError } = await supabase.storage
              .from(POPUP_MEDIA_BUCKET)
              .list(folder.name);

            if (!listError && listData) {
              listData
                .filter(file => file.name !== '.emptyFolderPlaceholder')
                .forEach(file => {
                  const { data } = supabase.storage
                    .from(POPUP_MEDIA_BUCKET)
                    .getPublicUrl(`${folder.name}/${file.name}`);

                  allMedia.push({
                    id: `${folder.name}_${file.name}`,
                    name: file.name,
                    url: data.publicUrl,
                    type: file.metadata?.mimetype || 'unknown',
                    size: file.metadata?.size || 0,
                    folder: folder.name,
                  });
                });
            }
          }
        }
      }

      setMediaLibrary(allMedia);
    } catch (error) {
      console.error('Error loading media library:', error);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [popupId, sessionId]);

  useEffect(() => {
    if (showLibrary) {
      fetchMediaLibrary();
    }
  }, [showLibrary, fetchMediaLibrary]);

  const getMediaType = (file) => {
    const mimeType = file.type;
    if (SUPPORTED_FORMATS.image.types.includes(mimeType)) return 'image';
    if (SUPPORTED_FORMATS.video.types.includes(mimeType)) return 'video';
    return null;
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `حجم الملف يتجاوز حد 50 ميجابايت (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    const mediaType = getMediaType(file);
    if (!mediaType) {
      return 'صيغة الملف غير مدعومة';
    }

    return null;
  };

  const uploadFile = async (file) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationError('');

    try {
      const mediaType = getMediaType(file);
      setUploadProgress(10);

      // Validate content with detailed analysis using 'popup' mode
      // Popup mode: Only NSFW check, no face requirement
      let validationResult = null;
      if (mediaType === 'image') {
        validationResult = await validateImageWithDetails(file, 'popup');
      } else if (mediaType === 'video') {
        validationResult = await validateVideoWithDetails(file, 'popup');
      }

      setUploadProgress(30);

      if (validationResult && !validationResult.allowed) {
        setValidationError(validationResult.reason || 'الملف لا يلبي معايير السلامة');
        setIsUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = getStoragePath(fileName);

      // Try to upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(POPUP_MEDIA_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      let mediaItem;

      if (uploadError) {
        // If upload fails and bucket not accessible, create a local preview
        // The user will need to upload after saving or use direct URLs
        console.warn('Storage upload failed, using local preview:', uploadError);

        // Create a data URL for local preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const mediaItem = {
            id: fileName,
            name: file.name,
            url: e.target.result,
            type: file.type,
            size: file.size,
            isLocalPreview: true,
            localFile: file,
          };

          const newMedia = [...uploadedMedia, mediaItem];
          setUploadedMedia(newMedia);
          onChange(newMedia);
          setUploadProgress(100);

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 500);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Successful upload
      const { data } = supabase.storage
        .from(POPUP_MEDIA_BUCKET)
        .getPublicUrl(path);

      mediaItem = {
        id: fileName,
        name: file.name,
        url: data.publicUrl,
        type: file.type,
        size: file.size,
      };

      const newMedia = [...uploadedMedia, mediaItem];
      setUploadedMedia(newMedia);
      onChange(newMedia);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      await fetchMediaLibrary();
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
  }, []);

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

  const handleAddFromLibrary = (media) => {
    const isAlreadyAdded = uploadedMedia.some(m => m.id === media.id);
    if (!isAlreadyAdded) {
      const newMedia = [...uploadedMedia, media];
      setUploadedMedia(newMedia);
      onChange(newMedia);
    }
  };

  const filteredLibrary = mediaLibrary.filter(media => {
    if (filterType === 'all') return true;
    return media.type.startsWith(filterType);
  });

  return (
    <div className="space-y-6">
      {bucketError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ <strong>{bucketError}</strong>
          </p>
          <p className="text-xs text-amber-700 mt-1">
            يمكنك استخدام روابط URL المباشرة أو رفع الملفات بعد حفظ الإعلان.
          </p>
        </div>
      )}


      <div className="space-y-3">
        <Label className="text-base font-semibold">رفع الصور والفيديوهات</Label>
        <p className="text-sm text-muted-foreground">
          رفع الصور والفيديوهات مباشرة فقط (حتى 50 ميجابايت لكل ملف - بدون روابط)
        </p>

        {/* Drag and Drop Area */}
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
            multiple
            onChange={handleFileInput}
            accept={Object.values(SUPPORTED_FORMATS)
              .flatMap(f => f.types)
              .join(',')}
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
                {isUploading ? 'جاري الرفع...' : 'اسحب الملفات هنا'}
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
                الصور: {SUPPORTED_FORMATS.image.label}
              </p>
              <p>
                الفيديوهات: {SUPPORTED_FORMATS.video.label}
              </p>
              <p>الحد الأقصى للحجم: 50 ميجابايت</p>
            </div>
          </div>
        </div>
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
            الوسائط المختارة ({uploadedMedia.length})
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedMedia.map(media => (
              <MediaPreview
                key={media.id}
                media={media}
                onRemove={handleRemoveMedia}
              />
            ))}
          </div>
        </div>
      )}

      {/* Media Library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            الملفات المرفوعة سابقاً
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            {showLibrary ? 'إخفاء' : 'عرض'}
          </Button>
        </div>

          {showLibrary && (
            <div className="space-y-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm border border-input rounded px-2 py-1"
                >
                  <option value="all">جميع الملفات</option>
                  <option value="image">الصور فقط</option>
                  <option value="video">الفيديوهات فقط</option>
                </select>
              </div>

              {/* Library Content */}
              {isLoadingLibrary ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    {mediaLibrary.length === 0
                      ? 'لم يتم رفع أي وسائط حتى الآن'
                      : 'لا توجد وسائط تطابق المرشح المختار'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {filteredLibrary.map(media => {
                    const isAlreadyAdded = uploadedMedia.some(m => m.id === media.id);
                    return (
                      <div
                        key={media.id}
                        className={cn(
                          'relative group',
                          isAlreadyAdded && 'opacity-50'
                        )}
                      >
                        {media.type.startsWith('video') ? (
                          <video
                            src={media.url}
                            className="w-full h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isAlreadyAdded}
                            onClick={() => !isAlreadyAdded && handleAddFromLibrary(media)}
                          >
                            {isAlreadyAdded ? 'مضافة' : 'إضافة'}
                          </Button>
                        </div>
                        <div className="mt-1 text-xs truncate text-muted-foreground">
                          {media.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};
