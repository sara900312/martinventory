import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2 } from 'lucide-react';

export const PopupButtonSize = ({ value, onChange }) => {
  const sizes = [
    { id: 'small', label: 'صغير', value: 'small', class: 'px-4 py-2 text-sm' },
    { id: 'medium', label: 'متوسط', value: 'medium', class: 'px-6 py-3 text-base' },
    { id: 'large', label: 'كبير', value: 'large', class: 'px-8 py-4 text-lg' },
    { id: 'xlarge', label: 'كبير جداً', value: 'xlarge', class: 'px-10 py-5 text-xl' },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Maximize2 className="h-5 w-5 text-primary" />
          حجم الزر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          اختر حجم الزر المناسب للإعلان
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {sizes.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => onChange(size.value)}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                value === size.value
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-input bg-white hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium mb-2">{size.label}</p>
              <div className="inline-flex">
                <div
                  className={`bg-primary text-white rounded font-semibold ${size.class} inline-flex items-center justify-center pointer-events-none`}
                >
                  مثال
                </div>
              </div>
            </button>
          ))}
        </div>

        {value && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">الحجم المختار:</p>
            <p className="font-medium text-primary">
              {sizes.find((s) => s.value === value)?.label || value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
