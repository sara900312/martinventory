import { formatDistanceToNow, format } from 'date-fns';
import { Eye, Edit, Trash2, Play, Pause, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const PopupCard = ({ popup, onEdit, onDelete, onToggleActive, onPreview }) => {
  const isScheduled = new Date(popup.start_date) > new Date();
  const isExpired = popup.end_date && new Date(popup.end_date) < new Date();

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="secondary" className="bg-muted">منتهي الصلاحية</Badge>;
    }
    if (isScheduled) {
      return <Badge className="bg-warning text-warning-foreground">مجدول</Badge>;
    }
    if (popup.is_active) {
      return <Badge className="bg-success text-success-foreground">نشط</Badge>;
    }
    return <Badge variant="secondary">غير نشط</Badge>;
  };

  const layoutLabels = {
    rectangle: 'مستطيل',
    square: 'مربع',
    fullscreen: 'ملء الشاشة',
  };

  const hasVideo = popup.video_url && popup.video_url.trim() !== '';
  const hasImage = popup.image_url && popup.image_url.trim() !== '';

  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-elevated transition-all duration-200">
      <div className="relative h-40 bg-muted overflow-hidden">
        {hasVideo ? (
          <video
            src={popup.video_url}
            alt={popup.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            playsInline
            muted
            loop
            autoPlay
          />
        ) : hasImage ? (
          <img
            src={popup.image_url}
            alt={popup.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full gradient-hero opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge()}
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {layoutLabels[popup.layout_type]}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg line-clamp-1">{popup.title}</h3>
          {popup.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {popup.description}
            </p>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              {format(new Date(popup.start_date), 'MMM d, yyyy')}
              {popup.end_date && ` - ${format(new Date(popup.end_date), 'MMM d, yyyy')}`}
            </span>
          </div>
          {popup.link_url && (
            <div className="text-xs text-primary">
              🔗 يحتوي على رابط
            </div>
          )}
          {popup.video_url && (
            <div className="text-xs text-primary">
              🎥 يحتوي على فيديو
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1",
              popup.is_active ? "text-warning hover:text-warning" : "text-success hover:text-success"
            )}
            onClick={() => onToggleActive(popup)}
          >
            {popup.is_active ? (
              <>
                <Pause className="h-4 w-4 mr-1.5" />
                إيقاف
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                تفعيل
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPreview(popup)}
            title="معاينة"
            className="text-blue-500 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(popup)}
            title="تحرير"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(popup.id)}
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
