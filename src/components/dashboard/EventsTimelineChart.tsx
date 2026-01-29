import { DrowsinessEvent } from '@/types/driver';
import { TrendingUp } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { format, subHours } from 'date-fns';

interface EventsTimelineChartProps {
    events: DrowsinessEvent[];
}

export function EventsTimelineChart({ events }: EventsTimelineChartProps) {
    // Group events by hour
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
        const hourDate = subHours(now, 23 - i);
        return {
            hour: format(hourDate, 'HH:00'),
            fullDate: hourDate,
            count: 0,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
        };
    });

    events.forEach(event => {
        const eventHour = format(event.startTime, 'HH:00');
        const hourData = hours.find(h => h.hour === eventHour);
        if (hourData) {
            hourData.count++;
            if (event.severity === 'high') hourData.highSeverity++;
            else if (event.severity === 'medium') hourData.mediumSeverity++;
            else hourData.lowSeverity++;
        }
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-xs">
                            <span className="text-muted-foreground">Total Events: </span>
                            <span className="font-semibold">{data.count}</span>
                        </p>
                        {data.highSeverity > 0 && (
                            <p className="text-xs">
                                <span className="text-danger">High: </span>
                                <span className="font-semibold">{data.highSeverity}</span>
                            </p>
                        )}
                        {data.mediumSeverity > 0 && (
                            <p className="text-xs">
                                <span className="text-warning">Medium: </span>
                                <span className="font-semibold">{data.mediumSeverity}</span>
                            </p>
                        )}
                        {data.lowSeverity > 0 && (
                            <p className="text-xs">
                                <span className="text-success">Low: </span>
                                <span className="font-semibold">{data.lowSeverity}</span>
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                    <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
                <div>
                    <h3 className="font-semibold">Events Timeline</h3>
                    <p className="text-xs text-muted-foreground">Hourly event distribution (last 24 hours)</p>
                </div>
            </div>

            <div className="p-6">
                <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hours} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                            <XAxis
                                dataKey="hour"
                                stroke="hsl(215, 20%, 55%)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="hsl(215, 20%, 55%)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="hsl(217, 91%, 60%)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
