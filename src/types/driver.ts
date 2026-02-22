// ──────────────────────────────────────────────────────────────
// Core Domain Types (aligned with Firestore document schemas)
// ──────────────────────────────────────────────────────────────

import { Timestamp } from 'firebase/firestore';

// ── Driver ───────────────────────────────────────────────────
export interface Driver {
  driverId: string;
  driverName: string;
  age: number;
  experience: number; // years of driving experience
}

/** Firestore document shape for a Driver (dates stored as Timestamps) */
export interface DriverDoc extends Driver {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  vehicleId?: string;
  profileImageUrl?: string;
}

// ── Drowsiness Events ────────────────────────────────────────
export type DriverStatus = 'alert' | 'drowsy' | 'sleeping';
export type Severity = 'low' | 'medium' | 'high';

export interface DrowsinessEvent {
  eventId: string;
  driverId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // seconds
  driverStatus: DriverStatus;
  severity: Severity;
}

/** Firestore document shape for a DrowsinessEvent */
export interface DrowsinessEventDoc {
  eventId: string;
  driverId: string;
  driverName: string; // denormalized for query efficiency
  startTime: Timestamp;
  endTime: Timestamp | null;
  duration: number | null;
  driverStatus: DriverStatus;
  severity: Severity;
  resolved: boolean;
  resolvedAt: Timestamp | null;
  resolvedBy: string | null; // userId of the operator
  notes: string;
  location?: GeoPoint;
  createdAt: Timestamp;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// ── Composite / View Types ───────────────────────────────────
export type LiveDriverStatus = 'alert' | 'drowsy' | 'sleeping' | 'offline';

export interface DriverWithStatus extends Driver {
  currentStatus: LiveDriverStatus;
  lastEventTime?: Date;
  totalDrowsinessTime: number; // seconds
  eventCount: number;
}

// ── Alerts ───────────────────────────────────────────────────
export type AlertType = 'drowsiness_detected' | 'high_severity' | 'system_warning' | 'driver_offline';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AlertDoc {
  alertId: string;
  type: AlertType;
  priority: AlertPriority;
  driverId: string;
  driverName: string;
  eventId?: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: Timestamp | null;
  acknowledgedBy: string | null;
  createdAt: Timestamp;
}

// ── Daily Stats (pre-computed aggregations) ──────────────────
export interface DailyStatsDoc {
  date: string; // YYYY-MM-DD
  totalEvents: number;
  highSeverityEvents: number;
  mediumSeverityEvents: number;
  lowSeverityEvents: number;
  totalDrowsinessDuration: number; // seconds
  averageDuration: number;
  activeDrivers: number;
  peakHour: number;
  eventsByHour: Record<number, number>; // hour -> count
  updatedAt: Timestamp;
}

// ── Driver Stats (per-driver aggregations) ───────────────────
export interface DriverStatsDoc {
  driverId: string;
  driverName: string;
  totalEvents: number;
  totalDrowsinessTime: number;
  averageEventDuration: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  lastEventTime: Timestamp | null;
  riskScore: number; // 0-100
  updatedAt: Timestamp;
}

// ── Audit Log ────────────────────────────────────────────────
export type AuditAction =
  | 'driver_created'
  | 'driver_updated'
  | 'driver_deleted'
  | 'event_created'
  | 'event_resolved'
  | 'alert_acknowledged'
  | 'settings_changed';

export interface AuditLogDoc {
  action: AuditAction;
  userId: string;
  targetCollection: string;
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: Timestamp;
  ipAddress?: string;
}

// ── User Preferences ─────────────────────────────────────────
export interface UserPreferencesDoc {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: string;
  notificationSettings: {
    emailAlerts: boolean;
    pushAlerts: boolean;
    severityThreshold: Severity;
  };
  updatedAt: Timestamp;
}

// ── System Status (Realtime DB) ──────────────────────────────
export interface SystemHeartbeat {
  isOnline: boolean;
  lastPing: number; // Unix ms
  connectedClients: number;
  version: string;
}

export interface LiveDriverStatusEntry {
  driverId: string;
  driverName: string;
  status: LiveDriverStatus;
  lastUpdated: number; // Unix ms
  sessionStart: number | null;
}

// ── Converter Helper Types ───────────────────────────────────
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
}
