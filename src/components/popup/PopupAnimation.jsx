import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export const PopupAnimation = ({ value = 'fade', onChange }) => {
  const animationOptions = [
    {
      id: 'fade',
      name: 'تلاشي',
      description: 'تلاشي سلس',
      icon: '✨',
      enterVariant: { opacity: 0 },
      exitVariant: { opacity: 0 },
      transition: { duration: 0.5 },
    },
    {
      id: 'slide',
      name: 'انزلاق',
      description: 'انزلاق للأعلى',
      icon: '⬆️',
      enterVariant: { opacity: 0, y: 50 },
      exitVariant: { opacity: 0, y: 50 },
      transition: { duration: 0.5, type: 'spring', stiffness: 100 },
    },
    {
      id: 'zoom',
      name: 'تكبير',
      description: 'تكبير وتصغير',
      icon: '🔍',
      enterVariant: { opacity: 0, scale: 0.8 },
      exitVariant: { opacity: 0, scale: 0.8 },
      transition: { duration: 0.5, type: 'spring', stiffness: 200 },
    },
    {
      id: 'bounce',
      name: 'ارتداد',
      description: 'ارتداد نابض',
      icon: '🎪',
      enterVariant: { opacity: 0, scale: 0.5, y: 100 },
      exitVariant: { opacity: 0, scale: 0.5 },
      transition: { duration: 0.6, type: 'spring', stiffness: 150, damping: 10 },
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          نمط الحركة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          اختر كيفية ظهور الإعلان
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {animationOptions.map((option) => {
            const isSelected = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-input bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{option.icon}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{option.name}</h3>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex gap-2">
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">معاينة الحركة:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>تلاشي:</strong> سلس وناعم</li>
              <li><strong>انزلاق:</strong> ينزلق من الأسفل</li>
              <li><strong>تكبير:</strong> ينمو من الصغر</li>
              <li><strong>ارتداد:</strong> يقفز بحركة نابضة</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
