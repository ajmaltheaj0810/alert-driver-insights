// ──────────────────────────────────────────────────────────────
// Firebase Module Barrel Export
// Single import point for all Firebase-related functionality.
// ──────────────────────────────────────────────────────────────

// Configuration & initialization
export { db, auth, realtimeDb, analytics } from './config';
export { COLLECTIONS, REALTIME_PATHS } from './collections';

// Converters
export {
    driverConverter,
    drowsinessEventConverter,
    alertConverter,
    dailyStatsConverter,
    driverStatsConverter,
    auditLogConverter,
    userPreferencesConverter,
} from './converters';

// Seeder (for development)
export { seedAll, seedDrivers, seedEvents, seedLiveStatuses } from './seeder';
