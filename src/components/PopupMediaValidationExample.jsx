/**
 * Example Component: Popup Media with Validation
 * Shows how to use Content Moderation with Supabase Storage
 * 
 * This example demonstrates:
 * 1. Loading media from database/storage
 * 2. Validating each media item before displaying
 * 3. Showing validation status
 * 4. Handling failed validations
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useContentModeration } from '@/hooks/useContentModeration';

export const PopupMediaValidationExample = ({ supabase, bucketName, popupId }) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [validationStatus, setValidationStatus] = useState({});
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  
  const { validateURL, isValidating } = useContentModeration();

  // Load media from storage
  useEffect(() => {
    const loadMedia = async () => {
      setIsLoadingMedia(true);
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list(`popup_${popupId}`);

        if (error) {
          console.error('Error loading media:', error);
          return;
        }

        const mediaList = data
          .filter(file => !file.name.startsWith('.'))
          .map(file => {
            const { data: publicUrl } = supabase.storage
              .from(bucketName)
              .getPublicUrl(`popup_${popupId}/${file.name}`);

            return {
              id: file.id,
              name: file.name,
              url: publicUrl.publicUrl,
              type: file.metadata?.mimetype || 'unknown',
              size: file.metadata?.size || 0,
            };
          });

        setMediaItems(mediaList);

        // Validate each media item
        for (const media of mediaList) {
          const result = await validateURL(media.url);
          setValidationStatus(prev => ({
            ...prev,
            [media.id]: result,
          }));
        }
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    if (popupId && bucketName && supabase) {
      loadMedia();
    }
  }, [popupId, bucketName, supabase, validateURL]);

  if (isLoadingMedia) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin mr-2" />
        <p>جاري تحميل الملفات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">الملفات المرفوعة</h3>

      {mediaItems.length === 0 ? (
        <p className="text-muted-foreground">لم يتم رفع أي ملفات</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map(media => {
            const validation = validationStatus[media.id];
            const isImage = media.type.startsWith('image/');
            const isVideo = media.type.startsWith('video/');

            return (
              <div
                key={media.id}
                className="border rounded-lg overflow-hidden bg-card"
              >
                {/* Media Preview */}
                <div className="relative bg-muted h-40 flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : isVideo ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">غير مدعوم</p>
                  )}

                  {/* Validation Badge */}
                  <div className="absolute top-2 right-2">
                    {!validation ? (
                      <div className="bg-gray-500 text-white p-2 rounded-full">
                        <Loader className="w-4 h-4 animate-spin" />
                      </div>
                    ) : validation.allowed ? (
                      <div className="bg-green-500 text-white p-2 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white p-2 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Info */}
                <div className="p-3 space-y-2">
                  <p className="font-medium text-sm truncate">{media.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(media.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Validation Status */}
                  {validation && (
                    <div
                      className={`text-xs p-2 rounded ${
                        validation.allowed
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {validation.reason}

                      {/* Detailed Error Info */}
                      {!validation.allowed && validation.details?.nsfw && (
                        <div className="mt-1 text-xs space-y-1">
                          <p>
                            الثقة: Porn{' '}
                            {(
                              validation.details.nsfw.porn * 100
                            ).toFixed(0)}
                            % + Sexy{' '}
                            {(
                              validation.details.nsfw.sexy * 100
                            ).toFixed(0)}
                            %
                          </p>
                          {validation.details.faces && (
                            <p>
                              الوجوه: {validation.details.faces.faceCount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics */}
      {mediaItems.length > 0 && Object.keys(validationStatus).length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {mediaItems.length}
            </p>
            <p className="text-sm text-muted-foreground">إجمالي</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {
                Object.values(validationStatus).filter(
                  v => v?.allowed
                ).length
              }
            </p>
            <p className="text-sm text-muted-foreground">آمن</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {
                Object.values(validationStatus).filter(
                  v => !v?.allowed
                ).length
              }
            </p>
            <p className="text-sm text-muted-foreground">مرفوض</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupMediaValidationExample;

/**
 * Usage in a Popup Form:
 * 
 * import { PopupMediaValidationExample } from '@/components/PopupMediaValidationExample';
 * 
 * <PopupMediaValidationExample 
 *   supabase={supabase}
 *   bucketName="popup-media"
 *   popupId="popup_123"
 * />
 */
