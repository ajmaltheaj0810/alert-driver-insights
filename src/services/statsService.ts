// ──────────────────────────────────────────────────────────────
// Analytics & Stats Service — Pre-computed aggregations
// Powers MetricCards, charts, and dashboard KPIs
// ──────────────────────────────────────────────────────────────

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/firebase/collections';
import type {
    DailyStatsDoc,
    DriverStatsDoc,
    DrowsinessEventDoc,
} from '@/types/driver';

// ── DAILY STATS ──────────────────────────────────────────────

const dailyStatsRef = () => collection(db, COLLECTIONS.DAILY_STATS);
const driverStatsRef = () => collection(db, COLLECTIONS.DRIVER_STATS);

/**
 * Get stats for a specific date.
 */
export async function getDailyStats(date: string): Promise<DailyStatsDoc | null> {
    const docRef = doc(db, COLLECTIONS.DAILY_STATS, date);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as DailyStatsDoc) : null;
}

/**
 * Get stats for the last N days.
 */
export async function getRecentDailyStats(days = 7): Promise<DailyStatsDoc[]> {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const promises = dates.map((date) => getDailyStats(date));
    const results = await Promise.all(promises);
    return results.filter((r): r is DailyStatsDoc => r !== null);
}

/**
 * Compute and store daily stats from events.
 * Call this from a Cloud Function or admin script.
 */
export async function computeDailyStats(
    date: string,
    events: DrowsinessEventDoc[]
): Promise<void> {
    const eventsByHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) eventsByHour[h] = 0;

    let totalDuration = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    const driverSet = new Set<string>();

    for (const event of events) {
        const hour = event.startTime.toDate().getHours();
        eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
        totalDuration += event.duration ?? 0;
        driverSet.add(event.driverId);

        if (event.severity === 'high') highCount++;
        else if (event.severity === 'medium') mediumCount++;
        else lowCount++;
    }

    const peakHour = Object.entries(eventsByHour).reduce(
        (max, [h, c]) => (c > max.count ? { hour: Number(h), count: c } : max),
        { hour: 0, count: 0 }
    ).hour;

    const stats: DailyStatsDoc = {
        date,
        totalEvents: events.length,
        highSeverityEvents: highCount,
        mediumSeverityEvents: mediumCount,
        lowSeverityEvents: lowCount,
        totalDrowsinessDuration: totalDuration,
        averageDuration: events.length > 0 ? Math.round(totalDuration / events.length) : 0,
        activeDrivers: driverSet.size,
        peakHour,
        eventsByHour,
        updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.DAILY_STATS, date), stats);
}

// ── DRIVER STATS ─────────────────────────────────────────────

/**
 * Get stats for a specific driver.
 */
export async function getDriverStats(driverId: string): Promise<DriverStatsDoc | null> {
    const docRef = doc(db, COLLECTIONS.DRIVER_STATS, driverId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as DriverStatsDoc) : null;
}

/**
 * Get all driver stats, ordered by risk score (highest risk first).
 */
export async function getAllDriverStats(): Promise<DriverStatsDoc[]> {
    const q = query(driverStatsRef(), orderBy('riskScore', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as DriverStatsDoc);
}

/**
 * Get top N risky drivers.
 */
export async function getTopRiskyDrivers(n = 5): Promise<DriverStatsDoc[]> {
    const q = query(driverStatsRef(), orderBy('riskScore', 'desc'), limit(n));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as DriverStatsDoc);
}

/**
 * Compute and store per-driver aggregated stats.
 */
export async function computeDriverStats(
    driverId: string,
    driverName: string,
    events: DrowsinessEventDoc[]
): Promise<void> {
    const driverEvents = events.filter((e) => e.driverId === driverId);
    const totalDuration = driverEvents.reduce((sum, e) => sum + (e.duration ?? 0), 0);
    const highCount = driverEvents.filter((e) => e.severity === 'high').length;
    const mediumCount = driverEvents.filter((e) => e.severity === 'medium').length;
    const lowCount = driverEvents.filter((e) => e.severity === 'low').length;

    // Risk score calculation (0-100)
    // Higher events, higher severity, longer duration → higher risk
    const eventScore = Math.min(driverEvents.length * 5, 40);
    const severityScore = Math.min(highCount * 15 + mediumCount * 5, 40);
    const durationScore = Math.min(Math.round(totalDuration / 60), 20); // cap at 20 for 20+ minutes
    const riskScore = Math.min(eventScore + severityScore + durationScore, 100);

    const lastEvent = driverEvents.sort(
        (a, b) => b.startTime.toDate().getTime() - a.startTime.toDate().getTime()
    )[0];

    const stats: DriverStatsDoc = {
        driverId,
        driverName,
        totalEvents: driverEvents.length,
        totalDrowsinessTime: totalDuration,
        averageEventDuration:
            driverEvents.length > 0 ? Math.round(totalDuration / driverEvents.length) : 0,
        highSeverityCount: highCount,
        mediumSeverityCount: mediumCount,
        lowSeverityCount: lowCount,
        lastEventTime: lastEvent?.startTime ?? null,
        riskScore,
        updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.DRIVER_STATS, driverId), stats);
}

// ── DASHBOARD METRICS (computed from live data) ──────────────

export interface DashboardMetrics {
    totalEvents: number;
    highSeverityEvents: number;
    avgDuration: number;
    activeDrivers: number;
    totalDrivers: number;
    unresolvedEvents: number;
    trendPercentage: number;
}

/**
 * Compute dashboard metrics from today's stats + drivers.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await getDailyStats(today);

    // Get yesterday for trend comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStats = await getDailyStats(yesterday.toISOString().split('T')[0]);

    const totalEvents = todayStats?.totalEvents ?? 0;
    const yesterdayEvents = yesterdayStats?.totalEvents ?? 0;
    const trendPercentage =
        yesterdayEvents > 0
            ? Math.round(((totalEvents - yesterdayEvents) / yesterdayEvents) * 100)
            : 0;

    return {
        totalEvents,
        highSeverityEvents: todayStats?.highSeverityEvents ?? 0,
        avgDuration: todayStats?.averageDuration ?? 0,
        activeDrivers: todayStats?.activeDrivers ?? 0,
        totalDrivers: 0, // populated by caller
        unresolvedEvents: 0, // updated by caller
        trendPercentage,
    };
}

// ── REAL-TIME ────────────────────────────────────────────────

/**
 * Subscribe to real-time daily stats updates.
 */
export function subscribeToDailyStats(
    date: string,
    callback: (stats: DailyStatsDoc | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.DAILY_STATS, date);
    return onSnapshot(
        docRef,
        (snapshot) => {
            callback(snapshot.exists() ? (snapshot.data() as DailyStatsDoc) : null);
        },
        (error) => {
            console.error('[StatsService] Subscription error:', error);
            onError?.(error);
        }
    );
}
