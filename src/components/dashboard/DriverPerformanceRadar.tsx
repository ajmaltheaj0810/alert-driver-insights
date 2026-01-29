import { DriverWithStatus } from '@/types/driver';
import { Target } from 'lucide-react';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface DriverPerformanceRadarProps {
    drivers: DriverWithStatus[];
}

export function DriverPerformanceRadar({ drivers }: DriverPerformanceRadarProps) {
    // Calculate performance metrics for each driver
    const getPerformanceScore = (driver: DriverWithStatus) => {
        const maxEvents = Math.max(...drivers.map(d => d.eventCount || 0), 1);
        const maxDuration = Math.max(...drivers.map(d => d.totalDrowsinessTime || 0), 1);

        // Invert scores so higher is better
        const eventScore = 100 - ((driver.eventCount || 0) / maxEvents) * 100;
        const durationScore = 100 - ((driver.totalDrowsinessTime || 0) / maxDuration) * 100;
        const experienceScore = Math.min((driver.experience / 20) * 100, 100);
        const alertScore = driver.currentStatus === 'alert' ? 100 : driver.currentStatus === 'drowsy' ? 50 : 0;
        const ageScore = driver.age >= 25 && driver.age <= 45 ? 100 : 70; // Optimal age range

        return {
            eventScore: Math.round(eventScore),
            durationScore: Math.round(durationScore),
            experienceScore: Math.round(experienceScore),
            alertScore,
            ageScore,
        };
    };

    // Get top 3 performing drivers
    const topDrivers = [...drivers]
        .sort((a, b) => {
            const scoreA = getPerformanceScore(a);
            const scoreB = getPerformanceScore(b);
            const avgA = (scoreA.eventScore + scoreA.durationScore + scoreA.experienceScore + scoreA.alertScore) / 4;
            const avgB = (scoreB.eventScore + scoreB.durationScore + scoreB.experienceScore + scoreB.alertScore) / 4;
            return avgB - avgA;
        })
        .slice(0, 3);

    const chartData = [
        { metric: 'Event Frequency', fullName: 'Low Event Count' },
        { metric: 'Alert Status', fullName: 'Current Alertness' },
        { metric: 'Duration', fullName: 'Low Drowsiness Time' },
        { metric: 'Experience', fullName: 'Driving Experience' },
        { metric: 'Age Factor', fullName: 'Optimal Age Range' },
    ];

    topDrivers.forEach((driver, index) => {
        const scores = getPerformanceScore(driver);
        chartData[0][`driver${index}`] = scores.eventScore;
        chartData[1][`driver${index}`] = scores.alertScore;
        chartData[2][`driver${index}`] = scores.durationScore;
        chartData[3][`driver${index}`] = scores.experienceScore;
        chartData[4][`driver${index}`] = scores.ageScore;
    });

    const colors = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm mb-2">{payload[0].payload.fullName}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-xs">
                                <span style={{ color: entry.color }}>{topDrivers[index]?.driverName}: </span>
                                <span className="font-semibold">{entry.value}/100</span>
                            </p>
                        ))}
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
                    <Target className="w-5 h-5 text-foreground" />
                </div>
                <div>
                    <h3 className="font-semibold">Driver Performance Comparison</h3>
                    <p className="text-xs text-muted-foreground">Top 3 drivers across key metrics</p>
                </div>
            </div>

            <div className="p-6">
                <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={chartData}>
                            <PolarGrid stroke="hsl(222, 30%, 18%)" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {topDrivers.map((driver, index) => (
                                <Radar
                                    key={driver.driverId}
                                    name={driver.driverName}
                                    dataKey={`driver${index}`}
                                    stroke={colors[index]}
                                    fill={colors[index]}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
                    {topDrivers.map((driver, index) => (
                        <div key={driver.driverId} className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index] }}
                            />
                            <span className="text-muted-foreground">{driver.driverName}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
