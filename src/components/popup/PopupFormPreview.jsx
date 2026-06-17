import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PopupHero } from '@/components/popup/PopupHero';
import { cn } from '@/lib/utils';

export const PopupFormPreview = ({ formData }) => {
  // Convert formData to popup format for PopupHero
  const popupData = {
    id: 'preview',
    title: formData.title || 'عنوان الإعلان',
    description: formData.description || '',
    cta_text: formData.cta_text || 'Learn More',
    layout_type: formData.layout_type || 'rectangle',
    position: formData.position || 'center',
    image_url: formData.media_items?.find(m => m.type?.startsWith('image'))?.url || null,
    video_url: formData.media_items?.find(m => m.type?.startsWith('video'))?.url || null,
    title_color: formData.title_color || '#ffffff',
    description_color: formData.description_color || '#f0f0f0',
    button_color: formData.button_color || '#3b82f6',
    button_text_color: formData.button_text_color || '#ffffff',
    button_style: formData.button_style || 'solid',
    animation_type: formData.animation_type || 'fade',
    button_delay_seconds: formData.button_delay_seconds || 0,
    show_button_countdown: formData.show_button_countdown ?? true,
    close_method: formData.close_method || 'both',
    button_position: formData.button_position || 'bottom-center',
    button_size: formData.button_size || 'medium',
    target_type: formData.target_type || null,
    target_id: formData.target_id || null,
  };

  return (
    <div className="sticky top-0 w-full h-screen max-h-screen overflow-auto bg-gradient-to-b from-muted/50 to-background rounded-lg border border-input p-4 flex flex-col">
      <h3 className="font-display font-semibold text-lg mb-4 text-foreground">
        معاينة الإعلان
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-foreground/5 rounded-lg overflow-hidden">
        {/* Desktop preview */}
        <div className="w-full h-full max-w-sm aspect-video rounded-lg overflow-hidden bg-background shadow-lg">
          <PopupHero preview previewData={popupData} />
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>تُحدّث المعاينة تلقائياً عند تغيير الإعدادات</p>
      </div>
    </div>
  );
};
