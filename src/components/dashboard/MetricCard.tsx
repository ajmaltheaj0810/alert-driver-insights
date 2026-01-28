import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'border-border',
  success: 'border-success/30',
  warning: 'border-warning/30',
  danger: 'border-danger/30',
};

const iconVariantStyles = {
  default: 'bg-secondary text-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  variant = 'default' 
}: MetricCardProps) {
  return (
    <div className={cn('metric-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconVariantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs">
          <span className={cn(
            'font-medium',
            trend.isPositive ? 'text-success' : 'text-danger'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
