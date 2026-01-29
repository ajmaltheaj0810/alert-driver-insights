import { DrowsinessEvent } from '@/types/driver';
import { Activity } from 'lucide-react';
import { getDriverName } from '@/data/mockData';

interface HourlyActivityHeatmapProps {
    events: DrowsinessEvent[];
}

export function HourlyActivityHeatmap({ events }: HourlyActivityHeatmapProps) {
    // Create a 24-hour heatmap
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Count events per hour
    const hourCounts = hours.map(hour => {
        const count = events.filter(event => {
            const eventHour = event.startTime.getHours();
            return eventHour === hour;
        }).length;
        return { hour, count };
    });

    const maxCount = Math.max(...hourCounts.map(h => h.count), 1);

    const getIntensityColor = (count: number) => {
        const intensity = count / maxCount;
        if (intensity === 0) return 'bg-secondary/30';
        if (intensity < 0.25) return 'bg-success/40';
        if (intensity < 0.5) return 'bg-warning/40';
        if (intensity < 0.75) return 'bg-warning/70';
        return 'bg-danger/70';
    };

    const getIntensityLabel = (count: number) => {
        const intensity = count / maxCount;
        if (intensity === 0) return 'None';
        if (intensity < 0.25) return 'Low';
        if (intensity < 0.5) return 'Moderate';
        if (intensity < 0.75) return 'High';
        return 'Very High';
    };

    // Get most active hours
    const topHours = [...hourCounts]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .filter(h => h.count > 0);

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                    <Activity className="w-5 h-5 text-foreground" />
                </div>
                <div>
                    <h3 className="font-semibold">Hourly Activity Heatmap</h3>
                    <p className="text-xs text-muted-foreground">Drowsiness events by hour of day</p>
                </div>
            </div>

            <div className="p-6">
                {/* Heatmap Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 mb-6">
                    {hourCounts.map(({ hour, count }) => (
                        <div
                            key={hour}
                            className="group relative"
                        >
                            <div
                                className={`
                  aspect-square rounded-lg border border-border
                  ${getIntensityColor(count)}
                  transition-all duration-200 hover:scale-110 hover:shadow-lg
                  cursor-pointer flex items-center justify-center
                `}
                            >
                                <span className="text-xs font-medium text-foreground opacity-70 group-hover:opacity-100">
                                    {hour.toString().padStart(2, '0')}
                                </span>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                                <div className="bg-card border border-border rounded-lg p-2 shadow-lg whitespace-nowrap">
                                    <p className="text-xs font-semibold">{hour}:00 - {hour}:59</p>
                                    <p className="text-xs text-muted-foreground">
                                        {count} {count === 1 ? 'event' : 'events'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getIntensityLabel(count)} activity
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Activity Level:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Low</span>
                            <div className="flex gap-1">
                                <div className="w-4 h-4 rounded bg-secondary/30 border border-border" />
                                <div className="w-4 h-4 rounded bg-success/40 border border-border" />
                                <div className="w-4 h-4 rounded bg-warning/40 border border-border" />
                                <div className="w-4 h-4 rounded bg-warning/70 border border-border" />
                                <div className="w-4 h-4 rounded bg-danger/70 border border-border" />
                            </div>
                            <span className="text-muted-foreground">High</span>
                        </div>
                    </div>

                    {/* Peak Hours */}
                    {topHours.length > 0 && (
                        <div className="pt-3 border-t border-border">
                            <p className="text-xs font-semibold mb-2">Peak Activity Hours:</p>
                            <div className="flex flex-wrap gap-2">
                                {topHours.map(({ hour, count }) => (
                                    <div
                                        key={hour}
                                        className="px-3 py-1 rounded-full bg-secondary border border-border text-xs"
                                    >
                                        <span className="font-semibold">{hour.toString().padStart(2, '0')}:00</span>
                                        <span className="text-muted-foreground ml-1">({count} events)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
