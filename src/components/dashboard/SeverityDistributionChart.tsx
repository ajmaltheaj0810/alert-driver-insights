import { DrowsinessEvent } from '@/types/driver';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SeverityDistributionChartProps {
  events: DrowsinessEvent[];
}

export function SeverityDistributionChart({ events }: SeverityDistributionChartProps) {
  const severityCounts = events.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'High Severity', value: severityCounts.high || 0, color: 'hsl(0, 72%, 51%)' },
    { name: 'Medium Severity', value: severityCounts.medium || 0, color: 'hsl(38, 92%, 50%)' },
    { name: 'Low Severity', value: severityCounts.low || 0, color: 'hsl(160, 84%, 39%)' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.value} events ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary">
          <PieChartIcon className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Severity Distribution</h3>
          <p className="text-xs text-muted-foreground">Event breakdown by severity level</p>
        </div>
      </div>

      <div className="p-6">
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
