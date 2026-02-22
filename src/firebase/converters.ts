// ──────────────────────────────────────────────────────────────
// Firestore Data Converters
// Type-safe serialization/deserialization for every collection.
// These converters integrate with Firestore's withConverter() API
// so that reads always return properly-typed objects and writes
// automatically convert Dates → Timestamps.
// ──────────────────────────────────────────────────────────────

import {
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp,
} from 'firebase/firestore';
import type {
    DriverDoc,
    DrowsinessEventDoc,
    AlertDoc,
    DailyStatsDoc,
    DriverStatsDoc,
    AuditLogDoc,
    UserPreferencesDoc,
} from '@/types/driver';

// ── Generic helper ───────────────────────────────────────────
function createConverter<T extends Record<string, unknown>>(): FirestoreDataConverter<T> {
    return {
        toFirestore(data: T) {
            return { ...data };
        },
        fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
            const data = snapshot.data(options);
            return { ...data } as T;
        },
    };
}

// ── Driver converter ─────────────────────────────────────────
export const driverConverter: FirestoreDataConverter<DriverDoc> = {
    toFirestore(driver: DriverDoc) {
        return {
            driverId: driver.driverId,
            driverName: driver.driverName,
            age: driver.age,
            experience: driver.experience,
            isActive: driver.isActive,
            email: driver.email ?? null,
            phone: driver.phone ?? null,
            licenseNumber: driver.licenseNumber ?? null,
            vehicleId: driver.vehicleId ?? null,
            profileImageUrl: driver.profileImageUrl ?? null,
            createdAt: driver.createdAt,
            updatedAt: Timestamp.now(),
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DriverDoc {
        const data = snapshot.data(options);
        return {
            driverId: data.driverId,
            driverName: data.driverName,
            age: data.age,
            experience: data.experience,
            isActive: data.isActive ?? true,
            email: data.email ?? undefined,
            phone: data.phone ?? undefined,
            licenseNumber: data.licenseNumber ?? undefined,
            vehicleId: data.vehicleId ?? undefined,
            profileImageUrl: data.profileImageUrl ?? undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    },
};

// ── DrowsinessEvent converter ────────────────────────────────
export const drowsinessEventConverter: FirestoreDataConverter<DrowsinessEventDoc> = {
    toFirestore(event: DrowsinessEventDoc) {
        return {
            eventId: event.eventId,
            driverId: event.driverId,
            driverName: event.driverName,
            startTime: event.startTime,
            endTime: event.endTime,
            duration: event.duration,
            driverStatus: event.driverStatus,
            severity: event.severity,
            resolved: event.resolved,
            resolvedAt: event.resolvedAt,
            resolvedBy: event.resolvedBy,
            notes: event.notes,
            location: event.location ?? null,
            createdAt: event.createdAt,
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): DrowsinessEventDoc {
        const data = snapshot.data(options);
        return {
            eventId: data.eventId,
            driverId: data.driverId,
            driverName: data.driverName ?? '',
            startTime: data.startTime,
            endTime: data.endTime ?? null,
            duration: data.duration ?? null,
            driverStatus: data.driverStatus,
            severity: data.severity,
            resolved: data.resolved ?? false,
            resolvedAt: data.resolvedAt ?? null,
            resolvedBy: data.resolvedBy ?? null,
            notes: data.notes ?? '',
            location: data.location ?? undefined,
            createdAt: data.createdAt,
        };
    },
};

// ── Alert converter ──────────────────────────────────────────
export const alertConverter: FirestoreDataConverter<AlertDoc> = createConverter<AlertDoc>();

// ── DailyStats converter ─────────────────────────────────────
export const dailyStatsConverter: FirestoreDataConverter<DailyStatsDoc> = createConverter<DailyStatsDoc>();

// ── DriverStats converter ────────────────────────────────────
export const driverStatsConverter: FirestoreDataConverter<DriverStatsDoc> = createConverter<DriverStatsDoc>();

// ── AuditLog converter ───────────────────────────────────────
export const auditLogConverter: FirestoreDataConverter<AuditLogDoc> = createConverter<AuditLogDoc>();

// ── UserPreferences converter ────────────────────────────────
export const userPreferencesConverter: FirestoreDataConverter<UserPreferencesDoc> = createConverter<UserPreferencesDoc>();
