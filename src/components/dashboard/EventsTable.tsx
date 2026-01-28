import { useState } from 'react';
import { DrowsinessEvent } from '@/types/driver';
import { getDriverName } from '@/data/mockData';
import { SeverityBadge } from './SeverityBadge';
import { StatusIndicator } from './StatusIndicator';
import { format } from 'date-fns';
import { Clock, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventsTableProps {
  events: DrowsinessEvent[];
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Ongoing';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function EventsTable({ events }: EventsTableProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredEvents = events.filter(event => {
    const driverName = getDriverName(event.driverId).toLowerCase();
    const matchesSearch = driverName.includes(search.toLowerCase()) || 
                          event.eventId.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Clock className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Drowsiness Events</h3>
              <p className="text-xs text-muted-foreground">{filteredEvents.length} records</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48 bg-secondary border-border"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32 bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Driver</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.eventId}>
                <td className="font-mono text-primary">{event.eventId}</td>
                <td>
                  <div>
                    <p className="font-medium">{getDriverName(event.driverId)}</p>
                    <p className="text-xs text-muted-foreground">{event.driverId}</p>
                  </div>
                </td>
                <td className="font-mono text-sm">
                  {format(event.startTime, 'MMM dd, HH:mm:ss')}
                </td>
                <td className="font-mono text-sm">
                  {event.endTime ? format(event.endTime, 'MMM dd, HH:mm:ss') : '—'}
                </td>
                <td>
                  <span className="font-mono font-medium">
                    {formatDuration(event.duration)}
                  </span>
                </td>
                <td>
                  <StatusIndicator status={event.driverStatus} showLabel size="sm" pulse={false} />
                </td>
                <td>
                  <SeverityBadge severity={event.severity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
