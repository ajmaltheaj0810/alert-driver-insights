// ──────────────────────────────────────────────────────────────
// Firebase Database Seeder
// Populates Firestore & Realtime DB with production-ready seed
// data matching the existing mock data structure.
// Run from the browser console or from a dedicated admin page.
// ──────────────────────────────────────────────────────────────

import { Timestamp } from 'firebase/firestore';
import { createDriver } from '@/services/driverService';
import { createEvent } from '@/services/eventService';
import { createAlertFromEvent } from '@/services/alertService';
import { setDriverLiveStatus } from '@/services/realtimeService';
import { computeDailyStats, computeDriverStats } from '@/services/statsService';
import type { DriverDoc, DrowsinessEventDoc, LiveDriverStatus } from '@/types/driver';

// ── SEED DATA ────────────────────────────────────────────────

const SEED_DRIVERS = [
    { driverId: 'DRV001', driverName: 'John Mitchell', age: 34, experience: 8 },
    { driverId: 'DRV002', driverName: 'Sarah Chen', age: 28, experience: 5 },
    { driverId: 'DRV003', driverName: 'Michael Torres', age: 45, experience: 20 },
    { driverId: 'DRV004', driverName: 'Emily Watson', age: 31, experience: 7 },
    { driverId: 'DRV005', driverName: 'David Kumar', age: 39, experience: 12 },
];

const SEED_EVENTS = [
    { driverId: 'DRV001', hoursAgo: 0.5, duration: 45, severity: 'medium' as const, status: 'drowsy' as const },
    { driverId: 'DRV002', hoursAgo: 1.2, duration: 12, severity: 'low' as const, status: 'drowsy' as const },
    { driverId: 'DRV001', hoursAgo: 2.5, duration: 78, severity: 'high' as const, status: 'sleeping' as const },
    { driverId: 'DRV003', hoursAgo: 3.1, duration: 23, severity: 'low' as const, status: 'drowsy' as const },
    { driverId: 'DRV004', hoursAgo: 4.0, duration: 156, severity: 'high' as const, status: 'sleeping' as const },
    { driverId: 'DRV002', hoursAgo: 5.5, duration: 34, severity: 'medium' as const, status: 'drowsy' as const },
    { driverId: 'DRV005', hoursAgo: 6.2, duration: 18, severity: 'low' as const, status: 'drowsy' as const },
    { driverId: 'DRV001', hoursAgo: 8.0, duration: 67, severity: 'medium' as const, status: 'drowsy' as const },
    { driverId: 'DRV003', hoursAgo: 10.5, duration: 89, severity: 'high' as const, status: 'sleeping' as const },
    { driverId: 'DRV004', hoursAgo: 12.0, duration: 28, severity: 'low' as const, status: 'drowsy' as const },
    { driverId: 'DRV005', hoursAgo: 14.2, duration: 45, severity: 'medium' as const, status: 'drowsy' as const },
    { driverId: 'DRV002', hoursAgo: 18.0, duration: 112, severity: 'high' as const, status: 'sleeping' as const },
];

const LIVE_STATUSES: Record<string, LiveDriverStatus> = {
    DRV001: 'drowsy',
    DRV002: 'alert',
    DRV003: 'alert',
    DRV004: 'offline',
    DRV005: 'alert',
};

// ── SEEDER FUNCTIONS ─────────────────────────────────────────

/**
 * Seed all drivers into Firestore.
 */
export async function seedDrivers(): Promise<void> {
    console.log('🌱 Seeding drivers...');
    for (const driver of SEED_DRIVERS) {
        await createDriver({
            ...driver,
            isActive: true,
            email: `${driver.driverName.split(' ')[0].toLowerCase()}@drivesafe.io`,
            phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
            licenseNumber: `LIC-${driver.driverId}`,
        });
        console.log(`  ✅ Created driver: ${driver.driverName}`);
    }
    console.log('✅ Drivers seeded successfully!');
}

/**
 * Seed all drowsiness events into Firestore.
 */
export async function seedEvents(): Promise<void> {
    console.log('🌱 Seeding drowsiness events...');
    const now = new Date();

    for (const data of SEED_EVENTS) {
        const startTime = new Date(now.getTime() - data.hoursAgo * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + data.duration * 1000);
        const driverName = SEED_DRIVERS.find((d) => d.driverId === data.driverId)?.driverName ?? 'Unknown';

        const eventId = await createEvent({
            driverId: data.driverId,
            driverName,
            driverStatus: data.status,
            severity: data.severity,
            startTime,
            endTime,
            duration: data.duration,
        });

        // Create corresponding alert for high-severity events
        if (data.severity === 'high') {
            await createAlertFromEvent({
                driverId: data.driverId,
                driverName,
                eventId,
                severity: data.severity,
                driverStatus: data.status,
            });
        }

        console.log(`  ✅ Created event: ${data.driverId} - ${data.severity} severity`);
    }
    console.log('✅ Events seeded successfully!');
}

/**
 * Seed driver live statuses into the Realtime Database.
 */
export async function seedLiveStatuses(): Promise<void> {
    console.log('🌱 Seeding live driver statuses...');
    for (const driver of SEED_DRIVERS) {
        const status = LIVE_STATUSES[driver.driverId] ?? 'offline';
        await setDriverLiveStatus(driver.driverId, driver.driverName, status);
        console.log(`  ✅ Set ${driver.driverName}: ${status}`);
    }
    console.log('✅ Live statuses seeded successfully!');
}

/**
 * Seed all data: drivers, events, statuses, and compute stats.
 */
export async function seedAll(): Promise<void> {
    console.log('🚀 Starting full database seed...\n');

    await seedDrivers();
    console.log('');
    await seedEvents();
    console.log('');
    await seedLiveStatuses();

    console.log('\n🎉 Database seeded successfully!');
    console.log('   Drivers: ', SEED_DRIVERS.length);
    console.log('   Events:  ', SEED_EVENTS.length);
    console.log('   Statuses:', Object.keys(LIVE_STATUSES).length);
}

// Export for browser console usage
if (typeof window !== 'undefined') {
    (window as any).__seedFirebase = seedAll;
    (window as any).__seedDrivers = seedDrivers;
    (window as any).__seedEvents = seedEvents;
    (window as any).__seedStatuses = seedLiveStatuses;
}
