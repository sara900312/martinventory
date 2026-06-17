import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLOSE_METHODS = [
  { value: 'x-only', label: 'X فقط', description: 'إغلاق بالنقر على X فقط' },
  { value: 'countdown-only', label: 'عداد فقط', description: 'إغلاق تلقائي بعد 15 ثانية' },
  { value: 'both', label: 'كلاهما', description: 'X والعداد التلقائي' },
];


export const PopupCloseSettings = ({
  value = { close_method: 'both' },
  onChange
}) => {
  const handleCloseMethodChange = (method) => {
    onChange({
      ...value,
      close_method: method,
    });
  };


  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <X className="h-5 w-5 text-primary" />
          إعدادات الإغلاق
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Close Method Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">طريقة الإغلاق</Label>
          <p className="text-sm text-muted-foreground">
            اختر كيفية إغلاق الإعلان
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CLOSE_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => handleCloseMethodChange(method.value)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  value.close_method === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-sm">{method.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {method.description}
                </div>
              </button>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
