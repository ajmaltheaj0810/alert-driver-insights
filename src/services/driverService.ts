// ──────────────────────────────────────────────────────────────
// Driver Service — Firestore CRUD + query operations
// ──────────────────────────────────────────────────────────────

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/firebase/collections';
import { driverConverter } from '@/firebase/converters';
import type { DriverDoc, Driver } from '@/types/driver';

// Reference to the drivers collection (with converter for type safety)
const driversRef = () =>
    collection(db, COLLECTIONS.DRIVERS).withConverter(driverConverter);

// ── CREATE ───────────────────────────────────────────────────

/**
 * Register a new driver in Firestore.
 * Auto-generates driverId if not provided.
 */
export async function createDriver(
    driverData: Omit<DriverDoc, 'createdAt' | 'updatedAt'>
): Promise<string> {
    const now = Timestamp.now();
    const docData: DriverDoc = {
        ...driverData,
        isActive: driverData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await addDoc(driversRef(), docData);
    return docRef.id;
}

/**
 * Register a new driver using the simple Driver interface (frontend form data).
 */
export async function createDriverFromForm(data: {
    driverName: string;
    age: number;
    experience: number;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    vehicleId?: string;
}): Promise<string> {
    const driverId = `DRV${Date.now().toString(36).toUpperCase()}`;
    return createDriver({
        driverId,
        driverName: data.driverName,
        age: data.age,
        experience: data.experience,
        isActive: true,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        vehicleId: data.vehicleId,
    });
}

// ── READ ─────────────────────────────────────────────────────

/**
 * Get a single driver by Firestore document ID.
 */
export async function getDriverById(docId: string): Promise<DriverDoc | null> {
    const docRef = doc(db, COLLECTIONS.DRIVERS, docId).withConverter(driverConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Get a driver by their custom driverId field (e.g., "DRV001").
 */
export async function getDriverByDriverId(driverId: string): Promise<DriverDoc | null> {
    const q = query(driversRef(), where('driverId', '==', driverId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
}

/**
 * Get all registered drivers.
 */
export async function getAllDrivers(): Promise<DriverDoc[]> {
    const q = query(driversRef(), orderBy('driverName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}

/**
 * Get only active drivers.
 */
export async function getActiveDrivers(): Promise<DriverDoc[]> {
    const q = query(
        driversRef(),
        where('isActive', '==', true),
        orderBy('driverName', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
}

/**
 * Search drivers by name (client-side filter for prefix matching).
 */
export async function searchDriversByName(searchTerm: string): Promise<DriverDoc[]> {
    const allDrivers = await getAllDrivers();
    const lowerTerm = searchTerm.toLowerCase();
    return allDrivers.filter((d) =>
        d.driverName.toLowerCase().includes(lowerTerm) ||
        d.driverId.toLowerCase().includes(lowerTerm)
    );
}

// ── UPDATE ───────────────────────────────────────────────────

/**
 * Update a driver's information by Firestore document ID.
 */
export async function updateDriver(
    docId: string,
    updates: Partial<Omit<DriverDoc, 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DRIVERS, docId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Deactivate a driver (soft delete).
 */
export async function deactivateDriver(docId: string): Promise<void> {
    await updateDriver(docId, { isActive: false });
}

/**
 * Reactivate a previously deactivated driver.
 */
export async function reactivateDriver(docId: string): Promise<void> {
    await updateDriver(docId, { isActive: true });
}

// ── DELETE ───────────────────────────────────────────────────

/**
 * Permanently delete a driver by Firestore document ID.
 * Use with caution — prefer deactivateDriver for most use-cases.
 */
export async function deleteDriver(docId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DRIVERS, docId);
    await deleteDoc(docRef);
}

// ── BATCH ────────────────────────────────────────────────────

/**
 * Batch-create multiple drivers (up to 500 per batch — Firestore limit).
 */
export async function batchCreateDrivers(
    drivers: Omit<DriverDoc, 'createdAt' | 'updatedAt'>[]
): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    for (const driverData of drivers) {
        const docRef = doc(collection(db, COLLECTIONS.DRIVERS));
        batch.set(docRef, {
            ...driverData,
            isActive: driverData.isActive ?? true,
            createdAt: now,
            updatedAt: now,
        });
    }

    await batch.commit();
}

// ── REAL-TIME ────────────────────────────────────────────────

/**
 * Subscribe to real-time updates on the drivers collection.
 * Returns an unsubscribe function.
 */
export function subscribeToDrivers(
    callback: (drivers: DriverDoc[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const q = query(driversRef(), orderBy('driverName', 'asc'));
    return onSnapshot(
        q,
        (snapshot) => {
            const drivers = snapshot.docs.map((doc) => doc.data());
            callback(drivers);
        },
        (error) => {
            console.error('[DriverService] Real-time subscription error:', error);
            onError?.(error);
        }
    );
}

/**
 * Subscribe to a single driver's updates.
 */
export function subscribeToDriver(
    docId: string,
    callback: (driver: DriverDoc | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.DRIVERS, docId).withConverter(driverConverter);
    return onSnapshot(
        docRef,
        (snapshot) => {
            callback(snapshot.exists() ? snapshot.data() : null);
        },
        (error) => {
            console.error('[DriverService] Real-time subscription error:', error);
            onError?.(error);
        }
    );
}

// ── HELPERS ──────────────────────────────────────────────────

/**
 * Convert a Firestore DriverDoc to the simpler frontend Driver interface.
 */
export function toDriver(doc: DriverDoc): Driver {
    return {
        driverId: doc.driverId,
        driverName: doc.driverName,
        age: doc.age,
        experience: doc.experience,
    };
}

/**
 * Get a driver name by driverId. Falls back to "Unknown Driver".
 */
export async function getDriverName(driverId: string): Promise<string> {
    const driver = await getDriverByDriverId(driverId);
    return driver?.driverName ?? 'Unknown Driver';
}
