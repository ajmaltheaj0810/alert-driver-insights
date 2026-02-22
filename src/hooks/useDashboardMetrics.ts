// ──────────────────────────────────────────────────────────────
// useDashboardMetrics — React hook for dashboard KPIs
// Powers the MetricCards at the top of the dashboard
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import type { DrowsinessEvent, DriverWithStatus } from '@/types/driver';

interface DashboardMetrics {
    totalEvents: number;
    highSeverityEvents: number;
    avgDuration: number;
    activeDrivers: number;
    totalDrivers: number;
    trendPercentage: number;
    drowsyDriversCount: number;
}

interface UseDashboardMetricsReturn {
    metrics: DashboardMetrics;
    loading: boolean;
}

/**
 * Compute dashboard metrics from events and driver data.
 * Works with both mock data and live Firestore data.
 */
export function useDashboardMetrics(
    events: DrowsinessEvent[],
    driversWithStatus: DriverWithStatus[]
): UseDashboardMetricsReturn {
    const metrics = useMemo<DashboardMetrics>(() => {
        const totalEvents = events.length;
        const highSeverityEvents = events.filter((e) => e.severity === 'high').length;
        const totalDuration = events.reduce((acc, e) => acc + (e.duration || 0), 0);
        const avgDuration = totalEvents > 0 ? Math.round(totalDuration / totalEvents) : 0;
        const activeDrivers = driversWithStatus.filter(
            (d) => d.currentStatus !== 'offline'
        ).length;
        const drowsyDriversCount = driversWithStatus.filter(
            (d) => d.currentStatus === 'drowsy' || d.currentStatus === 'sleeping'
        ).length;

        return {
            totalEvents,
            highSeverityEvents,
            avgDuration,
            activeDrivers,
            totalDrivers: driversWithStatus.length,
            trendPercentage: -12, // Will be computed from stats service in production
            drowsyDriversCount,
        };
    }, [events, driversWithStatus]);

    return { metrics, loading: false };
}
