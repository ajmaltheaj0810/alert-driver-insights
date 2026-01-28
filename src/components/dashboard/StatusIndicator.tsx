import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'alert' | 'drowsy' | 'sleeping' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
}

const statusConfig = {
  alert: {
    color: 'bg-success',
    glow: 'glow-success',
    label: 'Alert',
    ringColor: 'bg-success/50',
  },
  drowsy: {
    color: 'bg-warning',
    glow: 'glow-warning',
    label: 'Drowsy',
    ringColor: 'bg-warning/50',
  },
  sleeping: {
    color: 'bg-danger',
    glow: 'glow-danger',
    label: 'Sleeping',
    ringColor: 'bg-danger/50',
  },
  offline: {
    color: 'bg-muted-foreground/50',
    glow: '',
    label: 'Offline',
    ringColor: 'bg-muted-foreground/30',
  },
};

const sizeConfig = {
  sm: { dot: 'w-2 h-2', text: 'text-xs' },
  md: { dot: 'w-3 h-3', text: 'text-sm' },
  lg: { dot: 'w-4 h-4', text: 'text-base' },
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  pulse = true 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {pulse && status !== 'offline' && (
          <span 
            className={cn(
              'absolute inset-0 rounded-full animate-pulse-ring',
              config.ringColor,
              sizeClasses.dot
            )} 
          />
        )}
        <span 
          className={cn(
            'relative block rounded-full',
            config.color,
            config.glow,
            sizeClasses.dot
          )} 
        />
      </div>
      {showLabel && (
        <span className={cn('font-medium', sizeClasses.text)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
