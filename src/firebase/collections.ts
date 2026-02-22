// Firestore Collection Names — centralized constants to avoid typos
// and ensure consistent naming across the entire application.

export const COLLECTIONS = {
    // Core domain collections
    DRIVERS: 'drivers',
    DROWSINESS_EVENTS: 'drowsinessEvents',

    // System & analytics collections  
    SYSTEM_STATUS: 'systemStatus',
    ALERTS: 'alerts',
    AUDIT_LOG: 'auditLog',
    USER_PREFERENCES: 'userPreferences',

    // Aggregation / pre-computed stats collections
    DAILY_STATS: 'dailyStats',
    DRIVER_STATS: 'driverStats',
} as const;

// Realtime Database paths for live monitoring
export const REALTIME_PATHS = {
    DRIVER_STATUS: 'driverStatus',
    SYSTEM_HEARTBEAT: 'systemHeartbeat',
    LIVE_ALERTS: 'liveAlerts',
    ACTIVE_SESSIONS: 'activeSessions',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
export type RealtimePath = (typeof REALTIME_PATHS)[keyof typeof REALTIME_PATHS];
