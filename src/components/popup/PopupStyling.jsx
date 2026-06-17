import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';

const DEFAULT_COLORS = {
  title_color: '#ffffff',
  description_color: '#f0f0f0',
  button_color: '#3b82f6',
  button_text_color: '#ffffff',
};

export const PopupStyling = ({ value = {}, onChange, ctaText = 'Learn More' }) => {
  const colors = { ...DEFAULT_COLORS, ...value };

  const handleColorChange = (colorKey, colorValue) => {
    onChange({
      ...colors,
      [colorKey]: colorValue,
    });
  };

  const ColorInputField = ({ label, colorKey, description }) => (
    <div className="space-y-2">
      <Label htmlFor={colorKey}>{label}</Label>
      <div className="flex gap-3 items-center">
        <div className="relative h-12 w-20 rounded-lg border border-input overflow-hidden">
          <input
            id={colorKey}
            type="color"
            value={colors[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="absolute inset-0 cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={colors[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            placeholder="#ffffff"
            className="w-full px-3 py-2 border border-input rounded-md text-sm font-mono"
          />
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  const isDarkBg = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-primary" />
          ألوان النص والزر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ColorInputField
          label="لون نص العنوان"
          colorKey="title_color"
          description="لون عنوان الإعلان"
        />

        <ColorInputField
          label="لون نص الوصف"
          colorKey="description_color"
          description="لون نص وصف الإعلان"
        />

        <ColorInputField
          label="لون خلفية الزر"
          colorKey="button_color"
          description="لون خلفية زر الحث على الإجراء"
        />

        <ColorInputField
          label="لون نص الزر"
          colorKey="button_text_color"
          description="لون نص زر الحث على الإجراء"
        />

        {/* Preview */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-semibold">معاينة</Label>
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: isDarkBg(colors.button_color) ? '#ffffff' : '#1a1a1a',
            }}
          >
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: colors.title_color }}
            >
              عنوان نموذجي
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: colors.description_color }}
            >
              هذا نص وصف نموذجي لإظهار كيف ستبدو الألوان في الإعلان المنبثق.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: colors.button_color,
                color: colors.button_text_color,
              }}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
