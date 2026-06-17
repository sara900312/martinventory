import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUTTON_STYLES = [
  {
    id: 'solid',
    name: 'صلب (Solid)',
    description: 'زر بلون خلفية كامل',
    preview: {
      className: 'px-6 py-3 rounded-lg font-bold text-white',
      style: {
        backgroundColor: '#3b82f6',
      }
    }
  },
  {
    id: 'outline',
    name: 'الحد الخارجي (Outline)',
    description: 'زر بحدود فقط',
    preview: {
      className: 'px-6 py-3 rounded-lg font-bold border-2',
      style: {
        borderColor: '#3b82f6',
        color: '#3b82f6',
      }
    }
  },
  {
    id: 'ghost',
    name: 'شفاف (Ghost)',
    description: 'زر شفاف بدون خلفية',
    preview: {
      className: 'px-6 py-3 rounded-lg font-bold',
      style: {
        color: '#3b82f6',
      }
    }
  },
  {
    id: 'gradient',
    name: 'متدرج (Gradient)',
    description: 'زر بتدرج لوني',
    preview: {
      className: 'px-6 py-3 rounded-lg font-bold text-white',
      style: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      }
    }
  },
  {
    id: 'pill',
    name: 'حبة (Pill)',
    description: 'زر مستدير جداً',
    preview: {
      className: 'px-8 py-3 rounded-full font-bold text-white',
      style: {
        backgroundColor: '#3b82f6',
      }
    }
  },
  {
    id: 'square',
    name: 'مربع (Square)',
    description: 'زر بدون تقوس',
    preview: {
      className: 'px-6 py-3 font-bold text-white',
      style: {
        backgroundColor: '#3b82f6',
      }
    }
  },
  {
    id: 'shadow',
    name: 'بظل (Shadow)',
    description: 'زر مع ظل عميق',
    preview: {
      className: 'px-6 py-3 rounded-lg font-bold text-white shadow-lg',
      style: {
        backgroundColor: '#3b82f6',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
      }
    }
  },
  {
    id: 'minimal',
    name: 'بسيط (Minimal)',
    description: 'زر بسيط جداً',
    preview: {
      className: 'px-4 py-2 rounded-md font-semibold',
      style: {
        backgroundColor: '#3b82f6',
        color: 'white',
      }
    }
  }
];

export const PopupButtonStyle = ({ value, onChange }) => {
  const selectedStyle = BUTTON_STYLES.find(s => s.id === value);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-primary" />
          تصميم الزر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left space-y-2',
                value === style.id
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{style.name}</h3>
                {value === style.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{style.description}</p>
              <div className="pt-2 flex justify-center">
                <div
                  className={cn(style.preview.className)}
                  style={style.preview.style}
                >
                  معاينة
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedStyle && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">الأسلوب المختار:</p>
            <p className="font-medium text-primary">{selectedStyle.name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
