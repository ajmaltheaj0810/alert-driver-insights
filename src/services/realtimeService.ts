// ──────────────────────────────────────────────────────────────
// Realtime Database Service — Live Driver Monitoring
// Uses Firebase Realtime DB for sub-second latency updates
// (WebSocket-based, ideal for the LiveMonitor component)
// ──────────────────────────────────────────────────────────────

import {
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    off,
    serverTimestamp,
    type Unsubscribe,
} from 'firebase/database';
import { realtimeDb } from '@/firebase/config';
import { REALTIME_PATHS } from '@/firebase/collections';
import type { LiveDriverStatus, LiveDriverStatusEntry, SystemHeartbeat } from '@/types/driver';

// ── DRIVER STATUS ────────────────────────────────────────────

/**
 * Set or update a driver's live status in the Realtime Database.
 */
export async function setDriverLiveStatus(
    driverId: string,
    driverName: string,
    status: LiveDriverStatus
): Promise<void> {
    const statusRef = ref(realtimeDb, `${REALTIME_PATHS.DRIVER_STATUS}/${driverId}`);
    const entry: LiveDriverStatusEntry = {
        driverId,
        driverName,
        status,
        lastUpdated: Date.now(),
        sessionStart: status !== 'offline' ? Date.now() : null,
    };
    await set(statusRef, entry);
}

/**
 * Update only the status field for a driver.
 */
export async function updateDriverStatus(
    driverId: string,
    status: LiveDriverStatus
): Promise<void> {
    const statusRef = ref(realtimeDb, `${REALTIME_PATHS.DRIVER_STATUS}/${driverId}`);
    await update(statusRef, {
        status,
        lastUpdated: Date.now(),
    });
}

/**
 * Remove a driver from live monitoring (go offline).
 */
export async function removeDriverFromLive(driverId: string): Promise<void> {
    const statusRef = ref(realtimeDb, `${REALTIME_PATHS.DRIVER_STATUS}/${driverId}`);
    await update(statusRef, {
        status: 'offline',
        lastUpdated: Date.now(),
        sessionStart: null,
    });
}

/**
 * Get all current driver statuses.
 */
export async function getAllDriverStatuses(): Promise<LiveDriverStatusEntry[]> {
    const statusRef = ref(realtimeDb, REALTIME_PATHS.DRIVER_STATUS);
    const snapshot = await get(statusRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.values(data) as LiveDriverStatusEntry[];
}

/**
 * Get a single driver's live status.
 */
export async function getDriverLiveStatus(
    driverId: string
): Promise<LiveDriverStatusEntry | null> {
    const statusRef = ref(realtimeDb, `${REALTIME_PATHS.DRIVER_STATUS}/${driverId}`);
    const snapshot = await get(statusRef);
    return snapshot.exists() ? (snapshot.val() as LiveDriverStatusEntry) : null;
}

// ── REAL-TIME SUBSCRIPTIONS ──────────────────────────────────

/**
 * Subscribe to ALL driver status changes.
 * This powers the LiveMonitor component.
 */
export function subscribeToAllDriverStatuses(
    callback: (statuses: LiveDriverStatusEntry[]) => void
): Unsubscribe {
    const statusRef = ref(realtimeDb, REALTIME_PATHS.DRIVER_STATUS);
    const unsubscribe = onValue(statusRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        const data = snapshot.val();
        const statuses = Object.values(data) as LiveDriverStatusEntry[];
        callback(statuses);
    });

    return () => off(statusRef, 'value', unsubscribe as any);
}

/**
 * Subscribe to a single driver's status changes.
 */
export function subscribeToDriverStatus(
    driverId: string,
    callback: (status: LiveDriverStatusEntry | null) => void
): Unsubscribe {
    const statusRef = ref(realtimeDb, `${REALTIME_PATHS.DRIVER_STATUS}/${driverId}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
        callback(snapshot.exists() ? (snapshot.val() as LiveDriverStatusEntry) : null);
    });

    return () => off(statusRef, 'value', unsubscribe as any);
}

/**
 * Subscribe to new driver coming online.
 */
export function onDriverOnline(
    callback: (entry: LiveDriverStatusEntry) => void
): Unsubscribe {
    const statusRef = ref(realtimeDb, REALTIME_PATHS.DRIVER_STATUS);
    const unsubscribe = onChildAdded(statusRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as LiveDriverStatusEntry);
        }
    });

    return () => off(statusRef, 'child_added', unsubscribe as any);
}

/**
 * Subscribe to driver status changes.
 */
export function onDriverStatusChanged(
    callback: (entry: LiveDriverStatusEntry) => void
): Unsubscribe {
    const statusRef = ref(realtimeDb, REALTIME_PATHS.DRIVER_STATUS);
    const unsubscribe = onChildChanged(statusRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as LiveDriverStatusEntry);
        }
    });

    return () => off(statusRef, 'child_changed', unsubscribe as any);
}

// ── SYSTEM HEARTBEAT ─────────────────────────────────────────

/**
 * Update the system heartbeat (shows System Active in Header).
 */
export async function updateSystemHeartbeat(data?: Partial<SystemHeartbeat>): Promise<void> {
    const heartbeatRef = ref(realtimeDb, REALTIME_PATHS.SYSTEM_HEARTBEAT);
    await set(heartbeatRef, {
        isOnline: true,
        lastPing: Date.now(),
        connectedClients: data?.connectedClients ?? 1,
        version: data?.version ?? '1.0.0',
    });
}

/**
 * Subscribe to system heartbeat updates.
 */
export function subscribeToSystemHeartbeat(
    callback: (heartbeat: SystemHeartbeat | null) => void
): Unsubscribe {
    const heartbeatRef = ref(realtimeDb, REALTIME_PATHS.SYSTEM_HEARTBEAT);
    const unsubscribe = onValue(heartbeatRef, (snapshot) => {
        callback(snapshot.exists() ? (snapshot.val() as SystemHeartbeat) : null);
    });

    return () => off(heartbeatRef, 'value', unsubscribe as any);
}

// ── LIVE ALERTS (Realtime DB for instant push) ───────────────

/**
 * Push a live alert for immediate UI notification.
 */
export async function pushLiveAlert(alert: {
    driverId: string;
    driverName: string;
    message: string;
    severity: string;
}): Promise<void> {
    const alertRef = ref(realtimeDb, `${REALTIME_PATHS.LIVE_ALERTS}/${Date.now()}`);
    await set(alertRef, {
        ...alert,
        timestamp: Date.now(),
        dismissed: false,
    });
}

/**
 * Subscribe to live alerts.
 */
export function subscribeToLiveAlerts(
    callback: (alert: any) => void
): Unsubscribe {
    const alertsRef = ref(realtimeDb, REALTIME_PATHS.LIVE_ALERTS);
    const unsubscribe = onChildAdded(alertsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });

    return () => off(alertsRef, 'child_added', unsubscribe as any);
}

/**
 * Clear all live alerts.
 */
export async function clearLiveAlerts(): Promise<void> {
    const alertsRef = ref(realtimeDb, REALTIME_PATHS.LIVE_ALERTS);
    await remove(alertsRef);
}
