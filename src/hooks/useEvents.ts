// ──────────────────────────────────────────────────────────────
// useEvents — React hook for drowsiness events with Firestore
// Provides real-time event data with filtering and pagination.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DrowsinessEventDoc, DrowsinessEvent, Severity } from '@/types/driver';
import {
    subscribeToEvents,
    getRecentEvents,
    getEventsByDriver,
    getEventsBySeverity,
    resolveEvent,
    createEvent,
    toFrontendEvent,
    toFrontendEvents,
} from '@/services/eventService';

interface UseEventsOptions {
    maxResults?: number;
    driverId?: string;
    severity?: Severity;
    autoSubscribe?: boolean;
}

interface UseEventsReturn {
    events: DrowsinessEvent[];
    rawEvents: DrowsinessEventDoc[];
    loading: boolean;
    error: Error | null;
    createNewEvent: (data: Parameters<typeof createEvent>[0]) => Promise<string>;
    resolve: (docId: string, userId: string, notes?: string) => Promise<void>;
    refreshEvents: () => Promise<void>;
    filteredEvents: (search: string, severityFilter: string) => DrowsinessEvent[];
}

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
    const { maxResults = 50, driverId, severity, autoSubscribe = true } = options;

    const [rawEvents, setRawEvents] = useState<DrowsinessEventDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Real-time subscription to events
    useEffect(() => {
        if (!autoSubscribe) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToEvents(
            (updatedEvents) => {
                setRawEvents(updatedEvents);
                setLoading(false);
            },
            maxResults,
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [maxResults, autoSubscribe]);

    // Convert to frontend format
    const events: DrowsinessEvent[] = useMemo(
        () => toFrontendEvents(rawEvents),
        [rawEvents]
    );

    // Filtered events function (used by EventsTable)
    const filteredEvents = useCallback(
        (search: string, severityFilter: string): DrowsinessEvent[] => {
            return events.filter((event) => {
                const matchesSearch =
                    search === '' ||
                    event.driverId.toLowerCase().includes(search.toLowerCase()) ||
                    event.eventId.toLowerCase().includes(search.toLowerCase());
                const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
                return matchesSearch && matchesSeverity;
            });
        },
        [events]
    );

    const createNewEvent = useCallback(async (data: Parameters<typeof createEvent>[0]) => {
        return createEvent(data);
    }, []);

    const resolve = useCallback(async (docId: string, userId: string, notes?: string) => {
        await resolveEvent(docId, userId, notes);
    }, []);

    const refreshEvents = useCallback(async () => {
        setLoading(true);
        try {
            let freshEvents: DrowsinessEventDoc[];
            if (driverId) {
                freshEvents = await getEventsByDriver(driverId, maxResults);
            } else if (severity) {
                freshEvents = await getEventsBySeverity(severity, maxResults);
            } else {
                freshEvents = await getRecentEvents(24);
            }
            setRawEvents(freshEvents);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [driverId, severity, maxResults]);

    return {
        events,
        rawEvents,
        loading,
        error,
        createNewEvent,
        resolve,
        refreshEvents,
        filteredEvents,
    };
}
