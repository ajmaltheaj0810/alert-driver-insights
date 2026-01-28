import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';

interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high';
}

const severityConfig = {
  low: {
    className: 'severity-low',
    icon: AlertCircle,
    label: 'Low',
  },
  medium: {
    className: 'severity-medium',
    icon: AlertTriangle,
    label: 'Medium',
  },
  high: {
    className: 'severity-high',
    icon: AlertOctagon,
    label: 'High',
  },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <span className={cn('severity-badge', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
