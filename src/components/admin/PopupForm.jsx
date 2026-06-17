import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Link, Type, Layout, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaManager } from '@/components/popup/MediaManager';
import { PopupStyling } from '@/components/popup/PopupStyling';
import { PopupDisplayFrequency } from '@/components/popup/PopupDisplayFrequency';
import { PopupAnimation } from '@/components/popup/PopupAnimation';
import { PopupTargetSelector } from '@/components/popup/PopupTargetSelector';
import { PopupButtonStyle } from '@/components/popup/PopupButtonStyle';
import { PopupButtonCountdown } from '@/components/popup/PopupButtonCountdown';
import { PopupCloseSettings } from '@/components/popup/PopupCloseSettings';
import { PopupButtonPosition } from '@/components/popup/PopupButtonPosition';
import { PopupButtonSize } from '@/components/popup/PopupButtonSize';

export const PopupForm = ({ popup, onSubmit, onCancel, isLoading = false, onFormDataChange = null }) => {
  const [formData, setFormData] = useState({
    title: popup?.title || '',
    description: popup?.description || '',
    cta_text: popup?.cta_text || 'Learn More',
    link_url: popup?.link_url || '',
    target_type: popup?.target_type || null,
    target_id: popup?.target_id || null,
    layout_type: popup?.layout_type || 'rectangle',
    position: popup?.position || 'center',
    is_active: popup?.is_active ?? false,
    start_date: popup?.start_date
      ? new Date(popup.start_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    end_date: popup?.end_date
      ? new Date(popup.end_date).toISOString().slice(0, 16)
      : '',
    media_items: popup?.media_items || [],
    title_color: popup?.title_color || '#ffffff',
    description_color: popup?.description_color || '#f0f0f0',
    button_color: popup?.button_color || '#3b82f6',
    button_text_color: popup?.button_text_color || '#ffffff',
    button_style: popup?.button_style || 'solid',
    display_frequency: popup?.display_frequency || 'always',
    frequency_interval: popup?.frequency_interval || 5,
    animation_type: popup?.animation_type || 'fade',
    button_delay_seconds: popup?.button_delay_seconds || 0,
    show_button_countdown: popup?.show_button_countdown ?? true,
    close_method: popup?.close_method || 'both',
    button_position: popup?.button_position || 'bottom-center',
    button_size: popup?.button_size || 'medium',
  });

  const [errors, setErrors] = useState({});

  // Sync form data with preview on mount and when editing popup changes
  useEffect(() => {
    onFormDataChange?.(formData);
  }, []); // Only run once on mount

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      // Notify parent of form data changes for live preview
      onFormDataChange?.(updated);
      return updated;
    });
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation - only validate length if provided
    if (formData.title.length > 100) {
      newErrors.title = 'يجب أن يكون العنوان أقل من 100 حرف';
    }

    // Description validation - only validate length if provided
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'يجب أن يكون الوصف أقل من 500 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Extract first image and first video from media_items for the legacy fields
    const firstImage = formData.media_items.find(m => m.type && m.type.startsWith('image'));
    const firstVideo = formData.media_items.find(m => m.type && m.type.startsWith('video'));

    onSubmit({
      title: formData.title,
      description: formData.description || null,
      cta_text: formData.cta_text || 'Learn More',
      link_url: formData.link_url || null,
      target_type: formData.target_type || null,
      target_id: formData.target_id || null,
      layout_type: formData.layout_type,
      position: formData.position,
      is_active: formData.is_active,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      media_items: formData.media_items,
      image_url: firstImage?.url || null,
      video_url: firstVideo?.url || null,
      title_color: formData.title_color,
      description_color: formData.description_color,
      button_color: formData.button_color,
      button_text_color: formData.button_text_color,
      button_style: formData.button_style,
      display_frequency: formData.display_frequency,
      frequency_interval: formData.frequency_interval,
      animation_type: formData.animation_type,
      button_delay_seconds: formData.button_delay_seconds,
      show_button_countdown: formData.show_button_countdown,
      close_method: formData.close_method,
      button_position: formData.button_position,
      button_size: formData.button_size,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            المحتوى
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">العنوان</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="أدخل عنوان الإعلان (اختياري)"
              className="h-11"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="أدخل وصف الإعلان (اختياري)"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              (500 حرف كحد أقصى)
            </p>
          </div>
        </CardContent>
      </Card>

      <MediaManager
        value={formData.media_items}
        onChange={(media) => {
          const updated = { ...formData, media_items: media };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
        popupId={popup?.id}
      />

      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link className="h-5 w-5 text-primary" />
            نص الزر والهدف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta_text">نص الزر</Label>
            <Input
              id="cta_text"
              name="cta_text"
              value={formData.cta_text}
              onChange={handleChange}
              placeholder="اعرف المزيد"
              className="h-11"
              maxLength="50"
            />
            <p className="text-xs text-muted-foreground">
              النص المعروض على الزر (50 حرف كحد أقصى)
            </p>
          </div>
        </CardContent>
      </Card>

      <PopupTargetSelector
        value={{
          type: formData.target_type,
          target: formData.target_id,
        }}
        onChange={(target) => {
          const updated = {
            ...formData,
            target_type: target.type,
            target_id: target.target,
          };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupStyling
        value={{
          title_color: formData.title_color,
          description_color: formData.description_color,
          button_color: formData.button_color,
          button_text_color: formData.button_text_color,
        }}
        onChange={(colors) => {
          const updated = { ...formData, ...colors };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
        ctaText={formData.cta_text}
      />

      <PopupButtonStyle
        value={formData.button_style}
        onChange={(style) => {
          const updated = { ...formData, button_style: style };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupButtonCountdown
        value={{
          button_delay_seconds: formData.button_delay_seconds,
          show_button_countdown: formData.show_button_countdown,
        }}
        onChange={(countdownData) => {
          const updated = {
            ...formData,
            button_delay_seconds: countdownData.button_delay_seconds,
            show_button_countdown: countdownData.show_button_countdown,
          };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupButtonPosition
        value={formData.button_position}
        onChange={(position) => {
          const updated = { ...formData, button_position: position };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupButtonSize
        value={formData.button_size}
        onChange={(size) => {
          const updated = { ...formData, button_size: size };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupDisplayFrequency
        value={formData.display_frequency}
        frequencyInterval={formData.frequency_interval}
        onChange={(frequency) => {
          const updated = { ...formData, display_frequency: frequency };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
        onFrequencyChange={(frequencyData) => {
          const updated = {
            ...formData,
            display_frequency: frequencyData.type,
            frequency_interval: frequencyData.interval || 5,
          };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupAnimation
        value={formData.animation_type}
        onChange={(animation) => {
          const updated = { ...formData, animation_type: animation };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <PopupCloseSettings
        value={{
          close_method: formData.close_method,
        }}
        onChange={(closeSettings) => {
          const updated = {
            ...formData,
            close_method: closeSettings.close_method,
          };
          setFormData(updated);
          onFormDataChange?.(updated);
        }}
      />

      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layout className="h-5 w-5 text-primary" />
            التخطيط والموضع
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="layout_type">نوع التخطيط</Label>
            <select
              id="layout_type"
              name="layout_type"
              value={formData.layout_type}
              onChange={handleChange}
              className="w-full h-11 px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="rectangle">مستطيل (لافتة)</option>
              <option value="square">مربع (نافذة)</option>
              <option value="fullscreen">ملء الشاشة</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              الموضع
            </Label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full h-11 px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="center">في المركز</option>
              <option value="top">في الأعلى</option>
              <option value="bottom">في الأسفل</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            الجدولة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">تاريخ البدء *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleChange}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleChange}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="is_active" className="text-base font-medium">
                نشط
              </Label>
              <p className="text-sm text-muted-foreground">
                قم بتفعيل هذا الخيار لعرض الإعلان للزائرين
              </p>
            </div>
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="px-6">
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6 gradient-primary"
        >
          {isLoading ? 'جاري الحفظ...' : popup ? 'تحديث الإعلان' : 'إنشاء الإعلان'}
        </Button>
      </div>
    </form>
  );
};
