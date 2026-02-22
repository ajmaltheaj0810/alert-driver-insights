// ──────────────────────────────────────────────────────────────
// useAlerts — React hook for real-time alert notifications
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { AlertDoc } from '@/types/driver';
import {
    subscribeToAlerts,
    acknowledgeAlert,
    getUnacknowledgedAlerts,
    getCriticalAlerts,
    createAlertFromEvent,
} from '@/services/alertService';

interface UseAlertsReturn {
    alerts: AlertDoc[];
    criticalCount: number;
    loading: boolean;
    error: Error | null;
    acknowledge: (docId: string, userId: string) => Promise<void>;
    createFromEvent: typeof createAlertFromEvent;
    refreshAlerts: () => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
    const [alerts, setAlerts] = useState<AlertDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAlerts(
            (updatedAlerts) => {
                setAlerts(updatedAlerts);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const criticalCount = alerts.filter((a) => a.priority === 'critical').length;

    const acknowledge = useCallback(async (docId: string, userId: string) => {
        await acknowledgeAlert(docId, userId);
    }, []);

    const refreshAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const fresh = await getUnacknowledgedAlerts(50);
            setAlerts(fresh);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        alerts,
        criticalCount,
        loading,
        error,
        acknowledge,
        createFromEvent: createAlertFromEvent,
        refreshAlerts,
    };
}
