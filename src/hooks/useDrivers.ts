// ──────────────────────────────────────────────────────────────
// useDrivers — React hook for driver data with Firestore
// Provides real-time driver data with loading/error states.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { DriverDoc, Driver, DriverWithStatus } from '@/types/driver';
import {
    getAllDrivers,
    subscribeToDrivers,
    createDriverFromForm,
    updateDriver,
    deactivateDriver,
    toDriver,
} from '@/services/driverService';
import { getAllDriverStatuses } from '@/services/realtimeService';
import type { LiveDriverStatusEntry } from '@/types/driver';

interface UseDriversReturn {
    drivers: DriverDoc[];
    driversWithStatus: DriverWithStatus[];
    loading: boolean;
    error: Error | null;
    addDriver: (data: {
        driverName: string;
        age: number;
        experience: number;
        email?: string;
        phone?: string;
        licenseNumber?: string;
        vehicleId?: string;
    }) => Promise<string>;
    editDriver: (docId: string, updates: Partial<DriverDoc>) => Promise<void>;
    removeDriver: (docId: string) => Promise<void>;
    refreshDrivers: () => Promise<void>;
}

export function useDrivers(): UseDriversReturn {
    const [drivers, setDrivers] = useState<DriverDoc[]>([]);
    const [liveStatuses, setLiveStatuses] = useState<LiveDriverStatusEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to real-time driver updates from Firestore
    useEffect(() => {
        const unsubscribe = subscribeToDrivers(
            (updatedDrivers) => {
                setDrivers(updatedDrivers);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Fetch live statuses periodically from Realtime DB
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const statuses = await getAllDriverStatuses();
                setLiveStatuses(statuses);
            } catch (err) {
                console.error('[useDrivers] Error fetching live statuses:', err);
            }
        };

        fetchStatuses();
        const interval = setInterval(fetchStatuses, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // Merge Firestore driver data with Realtime DB live statuses
    const driversWithStatus: DriverWithStatus[] = drivers.map((driver) => {
        const liveStatus = liveStatuses.find((s) => s.driverId === driver.driverId);
        return {
            driverId: driver.driverId,
            driverName: driver.driverName,
            age: driver.age,
            experience: driver.experience,
            currentStatus: liveStatus?.status ?? 'offline',
            lastEventTime: liveStatus?.lastUpdated ? new Date(liveStatus.lastUpdated) : undefined,
            totalDrowsinessTime: 0, // Populated from stats
            eventCount: 0,          // Populated from stats
        };
    });

    const addDriver = useCallback(async (data: Parameters<typeof createDriverFromForm>[0]) => {
        return createDriverFromForm(data);
    }, []);

    const editDriver = useCallback(async (docId: string, updates: Partial<DriverDoc>) => {
        await updateDriver(docId, updates);
    }, []);

    const removeDriver = useCallback(async (docId: string) => {
        await deactivateDriver(docId);
    }, []);

    const refreshDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const freshDrivers = await getAllDrivers();
            setDrivers(freshDrivers);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        drivers,
        driversWithStatus,
        loading,
        error,
        addDriver,
        editDriver,
        removeDriver,
        refreshDrivers,
    };
}
