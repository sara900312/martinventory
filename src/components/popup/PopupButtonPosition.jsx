import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlignStartVertical } from 'lucide-react';

export const PopupButtonPosition = ({ value, onChange }) => {
  const positions = [
    // Top row
    { id: 'top-left', label: 'أعلى اليسار', position: 'top-left' },
    { id: 'top-center', label: 'أعلى المركز', position: 'top-center' },
    { id: 'top-right', label: 'أعلى اليمين', position: 'top-right' },
    // Middle row
    { id: 'middle-left', label: 'وسط اليسار', position: 'middle-left' },
    { id: 'middle-center', label: 'وسط المركز', position: 'middle-center' },
    { id: 'middle-right', label: 'وسط اليمين', position: 'middle-right' },
    // Bottom row
    { id: 'bottom-left', label: 'أسفل اليسار', position: 'bottom-left' },
    { id: 'bottom-center', label: 'أسفل المركز', position: 'bottom-center' },
    { id: 'bottom-right', label: 'أسفل اليمين', position: 'bottom-right' },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlignStartVertical className="h-5 w-5 text-primary" />
          موضع الزر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          اختر المكان الذي تريد ظهور الزر فيه داخل الإعلان
        </p>
        
        {/* Visual grid of 9 positions */}
        <div className="p-6 rounded-lg border border-dashed border-input bg-muted/50">
          <div className="space-y-4">
            {/* Top row */}
            <div className="flex gap-2 justify-center">
              {positions.slice(0, 3).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange(pos.position)}
                  title={pos.label}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center ${
                    value === pos.position
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-input bg-white hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      value === pos.position ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Middle row */}
            <div className="flex gap-2 justify-center">
              {positions.slice(3, 6).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange(pos.position)}
                  title={pos.label}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center ${
                    value === pos.position
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-input bg-white hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      value === pos.position ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Bottom row */}
            <div className="flex gap-2 justify-center">
              {positions.slice(6, 9).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange(pos.position)}
                  title={pos.label}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center ${
                    value === pos.position
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-input bg-white hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      value === pos.position ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected position label */}
        {value && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">الموضع المختار:</p>
            <p className="font-medium text-primary">
              {positions.find((p) => p.position === value)?.label || value}
            </p>
          </div>
        )}

        {/* Position labels for reference */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          {positions.map((pos) => (
            <div key={pos.id} className="text-center">
              {pos.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
