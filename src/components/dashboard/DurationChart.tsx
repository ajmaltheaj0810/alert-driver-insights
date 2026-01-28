import { DrowsinessEvent } from '@/types/driver';
import { getDriverName } from '@/data/mockData';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DurationChartProps {
  events: DrowsinessEvent[];
}

export function DurationChart({ events }: DurationChartProps) {
  // Aggregate duration by driver
  const driverDurations = events.reduce((acc, event) => {
    const driverName = getDriverName(event.driverId);
    acc[driverName] = (acc[driverName] || 0) + (event.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(driverDurations)
    .map(([name, duration]) => ({
      name: name.split(' ')[0], // First name only for cleaner labels
      fullName: name,
      duration: Math.round(duration / 60), // Convert to minutes
      seconds: duration,
    }))
    .sort((a, b) => b.duration - a.duration);

  const getBarColor = (duration: number) => {
    if (duration > 4) return 'hsl(0, 72%, 51%)'; // danger
    if (duration > 2) return 'hsl(38, 92%, 50%)'; // warning
    return 'hsl(160, 84%, 39%)'; // success
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary">
          <BarChart3 className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Cumulative Drowsiness Duration</h3>
          <p className="text-xs text-muted-foreground">Total fatigue time per driver (minutes)</p>
        </div>
      </div>

      <div className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 10%)',
                  border: '1px solid hsl(222, 30%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 98%)',
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value} minutes`,
                  props.payload.fullName
                ]}
                labelFormatter={() => 'Total Drowsiness'}
              />
              <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.duration)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-success" />
            <span className="text-muted-foreground">{'< 2min'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">2-4min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-danger" />
            <span className="text-muted-foreground">{'>4min'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
