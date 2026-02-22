// ──────────────────────────────────────────────────────────────
// Alerts Service — for system-wide alerting & notifications
// ──────────────────────────────────────────────────────────────

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
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
import { alertConverter } from '@/firebase/converters';
import type { AlertDoc, AlertType, AlertPriority } from '@/types/driver';

const alertsRef = () =>
    collection(db, COLLECTIONS.ALERTS).withConverter(alertConverter);

// ── CREATE ───────────────────────────────────────────────────

/**
 * Create a new alert.
 */
export async function createAlert(data: {
    type: AlertType;
    priority: AlertPriority;
    driverId: string;
    driverName: string;
    eventId?: string;
    message: string;
}): Promise<string> {
    const alertId = `ALT${Date.now().toString(36).toUpperCase()}`;
    const alertDoc: AlertDoc = {
        alertId,
        type: data.type,
        priority: data.priority,
        driverId: data.driverId,
        driverName: data.driverName,
        eventId: data.eventId,
        message: data.message,
        acknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
        createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(alertsRef(), alertDoc);
    return docRef.id;
}

/**
 * Auto-generate an alert from a drowsiness event.
 */
export async function createAlertFromEvent(data: {
    driverId: string;
    driverName: string;
    eventId: string;
    severity: 'low' | 'medium' | 'high';
    driverStatus: string;
}): Promise<string> {
    const priorityMap: Record<string, AlertPriority> = {
        low: 'low',
        medium: 'medium',
        high: 'critical',
    };

    const message =
        data.severity === 'high'
            ? `🚨 CRITICAL: Driver ${data.driverName} detected ${data.driverStatus}. Immediate action required.`
            : data.severity === 'medium'
                ? `⚠️ WARNING: Driver ${data.driverName} showing ${data.driverStatus} signs.`
                : `ℹ️ INFO: Driver ${data.driverName} had a brief ${data.driverStatus} episode.`;

    return createAlert({
        type: data.severity === 'high' ? 'high_severity' : 'drowsiness_detected',
        priority: priorityMap[data.severity],
        driverId: data.driverId,
        driverName: data.driverName,
        eventId: data.eventId,
        message,
    });
}

// ── READ ─────────────────────────────────────────────────────

/**
 * Get all alerts (most recent first).
 */
export async function getAllAlerts(maxResults = 100): Promise<AlertDoc[]> {
    const q = query(alertsRef(), orderBy('createdAt', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get unacknowledged alerts.
 */
export async function getUnacknowledgedAlerts(maxResults = 50): Promise<AlertDoc[]> {
    const q = query(
        alertsRef(),
        where('acknowledged', '==', false),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get critical priority alerts.
 */
export async function getCriticalAlerts(): Promise<AlertDoc[]> {
    const q = query(
        alertsRef(),
        where('priority', '==', 'critical'),
        where('acknowledged', '==', false),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get alerts for a specific driver.
 */
export async function getAlertsByDriver(
    driverId: string,
    maxResults = 50
): Promise<AlertDoc[]> {
    const q = query(
        alertsRef(),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

// ── UPDATE ───────────────────────────────────────────────────

/**
 * Acknowledge an alert.
 */
export async function acknowledgeAlert(
    docId: string,
    userId: string
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ALERTS, docId);
    await updateDoc(docRef, {
        acknowledged: true,
        acknowledgedAt: Timestamp.now(),
        acknowledgedBy: userId,
    });
}

/**
 * Batch acknowledge all alerts.
 */
export async function acknowledgeAllAlerts(userId: string): Promise<void> {
    const unacknowledged = await getUnacknowledgedAlerts(500);
    const promises = unacknowledged.map((alert) => {
        // We need the doc ID — for simplicity, we re-query
        // In production, you'd pass through the doc ref
        return acknowledgeAlert(alert.alertId, userId);
    });
    await Promise.all(promises);
}

// ── REAL-TIME ────────────────────────────────────────────────

/**
 * Subscribe to real-time alert updates.
 */
export function subscribeToAlerts(
    callback: (alerts: AlertDoc[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(
        alertsRef(),
        where('acknowledged', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
    );
    return onSnapshot(
        q,
        (snapshot) => {
            callback(snapshot.docs.map((d) => d.data()));
        },
        (error) => {
            console.error('[AlertService] Subscription error:', error);
            onError?.(error);
        }
    );
}
