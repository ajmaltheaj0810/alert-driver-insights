import { useState, useEffect } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { DriverWithStatus } from '@/types/driver';
import { Eye, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveMonitorProps {
  drivers: DriverWithStatus[];
}

export function LiveMonitor({ drivers }: LiveMonitorProps) {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDrivers = drivers.filter(d => d.currentStatus !== 'offline');
  const drowsyDrivers = drivers.filter(d => d.currentStatus === 'drowsy' || d.currentStatus === 'sleeping');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Live Monitoring</h3>
            <p className="text-xs text-muted-foreground">Real-time driver status</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <Clock className="w-4 h-4" />
          {time.toLocaleTimeString()}
        </div>
      </div>

      {drowsyDrivers.length > 0 && (
        <div className="px-6 py-3 bg-warning/10 border-b border-warning/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning animate-pulse" />
          <span className="text-sm font-medium text-warning">
            {drowsyDrivers.length} driver{drowsyDrivers.length > 1 ? 's' : ''} showing fatigue signs
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="grid gap-3">
          {activeDrivers.map((driver) => (
            <div
              key={driver.driverId}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all',
                driver.currentStatus === 'drowsy' && 'border-warning/50 bg-warning/5',
                driver.currentStatus === 'sleeping' && 'border-danger/50 bg-danger/5',
                driver.currentStatus === 'alert' && 'border-border bg-secondary/30',
              )}
            >
              <div className="flex items-center gap-4">
                <StatusIndicator status={driver.currentStatus} size="lg" />
                <div>
                  <p className="font-medium">{driver.driverName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{driver.driverId}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusIndicator status={driver.currentStatus} showLabel size="sm" pulse={false} />
                <p className="text-xs text-muted-foreground mt-1">
                  {driver.eventCount} events today
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
