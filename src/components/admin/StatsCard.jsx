import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const StatsCard = ({ title, value, icon: Icon, trend, description, className }) => {
  return (
    <Card className={cn("shadow-card hover:shadow-elevated transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-display font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={cn(
            "mt-3 text-sm font-medium",
            trend >= 0 ? "text-success" : "text-destructive"
          )}>
            {trend >= 0 ? '+' : ''}{trend}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );
};
