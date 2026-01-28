import { DriverWithStatus } from '@/types/driver';
import { StatusIndicator } from './StatusIndicator';
import { Users, Clock } from 'lucide-react';

interface DriversTableProps {
  drivers: DriverWithStatus[];
}

function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function DriversTable({ drivers }: DriversTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary">
          <Users className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Registered Drivers</h3>
          <p className="text-xs text-muted-foreground">{drivers.length} drivers</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Total Drowsy Time</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.driverId}>
                <td className="font-mono text-primary">{driver.driverId}</td>
                <td className="font-medium">{driver.driverName}</td>
                <td>{driver.age} yrs</td>
                <td>{driver.experience} yrs</td>
                <td>
                  <StatusIndicator 
                    status={driver.currentStatus} 
                    showLabel 
                    size="sm" 
                    pulse={driver.currentStatus !== 'offline'} 
                  />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono">
                      {formatTotalTime(driver.totalDrowsinessTime)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-sm font-medium">
                    {driver.eventCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
