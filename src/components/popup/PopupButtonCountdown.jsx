import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

export const PopupButtonCountdown = ({ value, onChange }) => {
  const buttonDelay = value?.button_delay_seconds || 0;
  const showCountdown = value?.show_button_countdown ?? true;

  const handleDelayChange = (e) => {
    const delay = Math.max(0, parseInt(e.target.value) || 0);
    onChange({
      button_delay_seconds: delay,
      show_button_countdown: showCountdown,
    });
  };

  const handleShowCountdownChange = (e) => {
    onChange({
      button_delay_seconds: buttonDelay,
      show_button_countdown: e.target.checked,
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          تأخير ظهور الزر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="button_delay_seconds">تأخير الزر بـ (ثانية)</Label>
          <Input
            id="button_delay_seconds"
            type="number"
            min="0"
            max="300"
            value={buttonDelay}
            onChange={handleDelayChange}
            placeholder="0"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            اترك القيمة 0 لإظهار الزر مباشرة، أو أدخل عدد الثواني (حد أقصى 300 ثانية)
          </p>
        </div>

        {buttonDelay > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <input
              id="show_button_countdown"
              type="checkbox"
              checked={showCountdown}
              onChange={handleShowCountdownChange}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
            />
            <div className="flex-1">
              <Label
                htmlFor="show_button_countdown"
                className="text-sm font-medium cursor-pointer"
              >
                عرض العداد أمام الزائر
              </Label>
              <p className="text-xs text-muted-foreground">
                سيظهر عداد يعد الثواني المتبقية قبل ظهور الزر
              </p>
            </div>
          </div>
        )}

        {buttonDelay === 0 && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              ✓ سيظهر الزر مباشرة عند ظهور الإعلان
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
