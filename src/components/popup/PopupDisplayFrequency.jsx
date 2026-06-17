import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, RotateCw, Eye, Clock, Zap } from 'lucide-react';

export const PopupDisplayFrequency = ({
  value = 'always',
  frequencyInterval = 5,
  onChange,
  onFrequencyChange
}) => {
  const [displayFrequency, setDisplayFrequency] = useState(value || 'always');
  const [visitInterval, setVisitInterval] = useState(frequencyInterval || 5);

  const handleFrequencyChange = (type) => {
    setDisplayFrequency(type);
    onChange(type);

    if (onFrequencyChange) {
      onFrequencyChange({
        type,
        interval: visitInterval,
      });
    }
  };

  const handleIntervalChange = (e) => {
    const interval = Math.max(1, parseInt(e.target.value) || 1);
    setVisitInterval(interval);

    if (onFrequencyChange) {
      onFrequencyChange({
        type: displayFrequency,
        interval,
      });
    }
  };

  const options = [
    {
      id: 'always',
      title: 'عرض في كل مرة',
      description: 'عرض الإعلان في كل زيارة - بدون قيود',
      icon: Eye,
      details: 'سيظهر الإعلان في كل مرة يزور فيها العميل عندما تكون الجدولة مفعلة.',
    },
    {
      id: 'once',
      title: 'عرض مرة واحدة فقط',
      description: 'عرض الإعلان مرة واحدة فقط في المتصفح',
      icon: Clock,
      details: 'سيظهر الإعلان مرة واحدة فقط في المتصفح. عند إغلاق الإعلان، لن يظهر مرة أخرى حتى يتم مسح بيانات المتصفح.',
    },
    {
      id: 'interval',
      title: 'عرض كل X مرات',
      description: 'عرض الإعلان كل عدد معين من الزيارات',
      icon: Zap,
      details: 'عرض الإعلان كل مرة بعد X زيارة. مثلاً: عرضه كل 5 زيارات للزائرين المتكررين.',
      hasInterval: true,
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-primary" />
          تكرار العرض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          اختر عدد مرات عرض الإعلان للعملاء
        </p>

        <div className="grid gap-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = displayFrequency === option.id;

            return (
              <div key={option.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(option.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-input bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{option.title}</h3>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        {option.details}
                      </p>
                    </div>
                  </div>
                </button>

                {isSelected && option.hasInterval && (
                  <div className="pl-14 space-y-2 animate-in fade-in">
                    <Label htmlFor={`interval-${option.id}`} className="text-sm">
                      عدد الزيارات بين كل عرض
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`interval-${option.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={visitInterval}
                        onChange={handleIntervalChange}
                        placeholder="أدخل عدد الزيارات"
                        className="h-10 w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        زيارة
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      سيظهر الإعلان كل {visitInterval} زيارة للعميل
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">💡 كيفية العمل:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>عرض في كل مرة</strong> - بدون قيود، يظهر في كل زيارة</li>
              <li><strong>عرض مرة واحدة فقط</strong> - يظهر مرة واحدة فقط في المتصفح</li>
              <li><strong>عرض كل X مرات</strong> - يظهر كل عدد معين من الزيارات (مثلاً كل 5 زيارات)</li>
            </ul>
            <p className="mt-2 pt-2 border-t border-blue-200 text-blue-700">
              📌 البيانات تُحفظ في متصفح العميل (localStorage)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
