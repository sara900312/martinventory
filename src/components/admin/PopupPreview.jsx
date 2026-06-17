import { useState, useEffect } from 'react';
import { Monitor, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PopupHero } from '@/components/popup/PopupHero';
import { cn } from '@/lib/utils';

export const PopupPreview = ({ popup, onClose }) => {
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [key, setKey] = useState(0);

  // Force re-render when popup changes
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [popup?.id]);

  if (!popup) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground backdrop-blur-sm animate-popup-in">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg shadow-lg">
          <Button
            type="button"
            variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDeviceMode('desktop')}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            سطح المكتب
          </Button>
          <Button
            type="button"
            variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDeviceMode('mobile')}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            الهاتف
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          className="bg-card hover:bg-muted"
          title="إغلاق"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pt-16 pb-8 px-4">
        <div
          className={cn(
            'relative bg-background overflow-hidden shadow-2xl transition-all duration-300',
            deviceMode === 'desktop'
              ? 'w-full max-w-5xl h-full max-h-[700px] rounded-lg'
              : 'w-[375px] h-[667px] rounded-lg'
          )}
        >
          <div className={cn(
            'relative w-full h-full'
          )}>
            <div className="absolute inset-0 p-6 space-y-4 opacity-30">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-full max-w-md" />
              <div className="h-4 bg-muted rounded w-full max-w-sm" />
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>

            <PopupHero preview previewData={popup} />
          </div>
        </div>
      </div>
    </div>
  );
};
