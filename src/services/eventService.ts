// ──────────────────────────────────────────────────────────────
// Drowsiness Events Service — Firestore CRUD + Queries
// ──────────────────────────────────────────────────────────────

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    onSnapshot,
    type Unsubscribe,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/firebase/collections';
import { drowsinessEventConverter } from '@/firebase/converters';
import type {
    DrowsinessEventDoc,
    DrowsinessEvent,
    DriverStatus,
    Severity,
} from '@/types/driver';

// Typed reference to the events collection
const eventsRef = () =>
    collection(db, COLLECTIONS.DROWSINESS_EVENTS).withConverter(drowsinessEventConverter);

// ── CREATE ───────────────────────────────────────────────────

/**
 * Record a new drowsiness event.
 */
export async function createEvent(data: {
    driverId: string;
    driverName: string;
    driverStatus: DriverStatus;
    severity: Severity;
    startTime?: Date;
    duration?: number | null;
    endTime?: Date | null;
    notes?: string;
    location?: { latitude: number; longitude: number };
}): Promise<string> {
    const now = Timestamp.now();
    const eventId = `EVT${Date.now().toString(36).toUpperCase()}`;

    const eventDoc: DrowsinessEventDoc = {
        eventId,
        driverId: data.driverId,
        driverName: data.driverName,
        startTime: data.startTime ? Timestamp.fromDate(data.startTime) : now,
        endTime: data.endTime ? Timestamp.fromDate(data.endTime) : null,
        duration: data.duration ?? null,
        driverStatus: data.driverStatus,
        severity: data.severity,
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        notes: data.notes ?? '',
        location: data.location,
        createdAt: now,
    };

    const docRef = await addDoc(eventsRef(), eventDoc);
    return docRef.id;
}

// ── READ ─────────────────────────────────────────────────────

/**
 * Get a single event by Firestore document ID.
 */
export async function getEventById(docId: string): Promise<DrowsinessEventDoc | null> {
    const docRef = doc(db, COLLECTIONS.DROWSINESS_EVENTS, docId).withConverter(
        drowsinessEventConverter
    );
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Get all events, ordered by most recent first.
 */
export async function getAllEvents(maxResults = 100): Promise<DrowsinessEventDoc[]> {
    const q = query(eventsRef(), orderBy('startTime', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get events with pagination support.
 */
export async function getEventsPaginated(
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot
): Promise<{ events: DrowsinessEventDoc[]; lastDoc: QueryDocumentSnapshot | null }> {
    let q = query(eventsRef(), orderBy('startTime', 'desc'), limit(pageSize));
    if (lastDoc) {
        q = query(eventsRef(), orderBy('startTime', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map((d) => d.data());
    const last = snapshot.docs[snapshot.docs.length - 1] ?? null;
    return { events, lastDoc: last };
}

/**
 * Get events for a specific driver.
 */
export async function getEventsByDriver(
    driverId: string,
    maxResults = 50
): Promise<DrowsinessEventDoc[]> {
    const q = query(
        eventsRef(),
        where('driverId', '==', driverId),
        orderBy('startTime', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get events filtered by severity.
 */
export async function getEventsBySeverity(
    severity: Severity,
    maxResults = 50
): Promise<DrowsinessEventDoc[]> {
    const q = query(
        eventsRef(),
        where('severity', '==', severity),
        orderBy('startTime', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get events within a time range.
 */
export async function getEventsByTimeRange(
    start: Date,
    end: Date,
    maxResults = 200
): Promise<DrowsinessEventDoc[]> {
    const q = query(
        eventsRef(),
        where('startTime', '>=', Timestamp.fromDate(start)),
        where('startTime', '<=', Timestamp.fromDate(end)),
        orderBy('startTime', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get events from the last N hours.
 */
export async function getRecentEvents(hours = 24): Promise<DrowsinessEventDoc[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return getEventsByTimeRange(since, new Date());
}

/**
 * Get only unresolved events.
 */
export async function getUnresolvedEvents(maxResults = 50): Promise<DrowsinessEventDoc[]> {
    const q = query(
        eventsRef(),
        where('resolved', '==', false),
        orderBy('startTime', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

/**
 * Get high-severity unresolved events (critical alerts).
 */
export async function getCriticalEvents(): Promise<DrowsinessEventDoc[]> {
    const q = query(
        eventsRef(),
        where('severity', '==', 'high'),
        where('resolved', '==', false),
        orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
}

// ── UPDATE ───────────────────────────────────────────────────

/**
 * Mark an event as resolved.
 */
export async function resolveEvent(
    docId: string,
    resolvedBy: string,
    notes?: string
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DROWSINESS_EVENTS, docId);
    await updateDoc(docRef, {
        resolved: true,
        resolvedAt: Timestamp.now(),
        resolvedBy,
        ...(notes !== undefined && { notes }),
    });
}

/**
 * Update the end time and duration of an ongoing event.
 */
export async function endEvent(
    docId: string,
    endTime: Date,
    duration: number
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DROWSINESS_EVENTS, docId);
    await updateDoc(docRef, {
        endTime: Timestamp.fromDate(endTime),
        duration,
    });
}

/**
 * Add/update notes on an event.
 */
export async function updateEventNotes(docId: string, notes: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DROWSINESS_EVENTS, docId);
    await updateDoc(docRef, { notes });
}

// ── REAL-TIME ────────────────────────────────────────────────

/**
 * Subscribe to real-time event updates (most recent first).
 */
export function subscribeToEvents(
    callback: (events: DrowsinessEventDoc[]) => void,
    maxResults = 50,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(eventsRef(), orderBy('startTime', 'desc'), limit(maxResults));
    return onSnapshot(
        q,
        (snapshot) => {
            const events = snapshot.docs.map((d) => d.data());
            callback(events);
        },
        (error) => {
            console.error('[EventService] Real-time subscription error:', error);
            onError?.(error);
        }
    );
}

/**
 * Subscribe to real-time critical (high severity, unresolved) event updates.
 */
export function subscribeToCriticalEvents(
    callback: (events: DrowsinessEventDoc[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(
        eventsRef(),
        where('severity', '==', 'high'),
        where('resolved', '==', false),
        orderBy('startTime', 'desc')
    );
    return onSnapshot(
        q,
        (snapshot) => {
            const events = snapshot.docs.map((d) => d.data());
            callback(events);
        },
        (error) => {
            console.error('[EventService] Critical events subscription error:', error);
            onError?.(error);
        }
    );
}

// ── CONVERTERS ───────────────────────────────────────────────

/**
 * Convert a Firestore DrowsinessEventDoc to the frontend-friendly DrowsinessEvent.
 */
export function toFrontendEvent(doc: DrowsinessEventDoc): DrowsinessEvent {
    return {
        eventId: doc.eventId,
        driverId: doc.driverId,
        startTime: doc.startTime.toDate(),
        endTime: doc.endTime?.toDate() ?? null,
        duration: doc.duration,
        driverStatus: doc.driverStatus,
        severity: doc.severity,
    };
}

/**
 * Convert an array of Firestore docs to frontend events.
 */
export function toFrontendEvents(docs: DrowsinessEventDoc[]): DrowsinessEvent[] {
    return docs.map(toFrontendEvent);
}
