# 🔥 Firebase Backend Architecture — Alert Driver Insights

## Overview

This document describes the complete Firebase backend infrastructure powering the **Driver Safety Monitor** dashboard. The backend is **production-ready**, **scalable**, **secure**, and **modular**.

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Hooks   │ │ Hooks   │ │ Hooks    │ │ Hooks        │ │
│  │useDrivers│ │useEvents│ │useAlerts │ │useAuth       │ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └──────┬───────┘ │
│       │           │           │               │         │
│  ┌────┴───────────┴───────────┴───────────────┴───────┐ │
│  │              Service Layer                          │ │
│  │ driverService │ eventService │ alertService         │ │
│  │ statsService  │ realtimeService │ auditService      │ │
│  │                   authService                       │ │
│  └────────────────────┬────────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴────────────────────────────────┐ │
│  │          Firebase SDK (Converters + Config)          │ │
│  └────────────────────┬────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Firestore   │ │  Realtime DB │ │  Firebase    │
│  (Documents) │ │  (Live Data) │ │  Auth        │
│              │ │              │ │              │
│  • drivers   │ │ • driverStatus│ │ • Email/Pass │
│  • events    │ │ • heartbeat  │ │ • Google SSO │
│  • alerts    │ │ • liveAlerts │ │ • JWT Tokens │
│  • dailyStats│ │ • sessions   │ │              │
│  • driverStats│ │              │ │              │
│  • auditLog  │ │              │ │              │
│  • userPrefs │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📁 File Structure

```
src/
├── firebase/
│   ├── config.ts          # Firebase app initialization (Firestore, Auth, RTDB)
│   ├── collections.ts     # Collection & path name constants
│   ├── converters.ts      # Type-safe Firestore data converters
│   ├── seeder.ts          # Database seed script (dev/staging)
│   └── index.ts           # Barrel export
│
├── services/
│   ├── driverService.ts   # CRUD + real-time for drivers
│   ├── eventService.ts    # CRUD + queries for drowsiness events
│   ├── alertService.ts    # Alert creation + acknowledgement
│   ├── statsService.ts    # Daily & driver-level analytics
│   ├── realtimeService.ts # Realtime DB for live monitoring
│   ├── auditService.ts    # Immutable change tracking
│   ├── authService.ts     # Authentication + user preferences
│   └── index.ts           # Barrel export
│
├── hooks/
│   ├── useDrivers.ts      # React hook for driver data
│   ├── useEvents.ts       # React hook for events
│   ├── useAlerts.ts       # React hook for alerts
│   ├── useAuth.ts         # React hook for auth state
│   └── useDashboardMetrics.ts  # Computed dashboard KPIs
│
├── types/
│   └── driver.ts          # All TypeScript interfaces & types
│
Root files:
├── .env.example           # Environment variable template
├── .gitignore             # Updated with Firebase entries
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Composite index definitions
└── database.rules.json    # Realtime Database security rules
```

---

## 🗄️ Firestore Collections

| Collection | Document ID | Purpose |
|---|---|---|
| `drivers` | Auto-generated | Registered driver profiles |
| `drowsinessEvents` | Auto-generated | Drowsiness detection events |
| `alerts` | Auto-generated | System alerts & notifications |
| `dailyStats` | `YYYY-MM-DD` | Pre-computed daily aggregations |
| `driverStats` | `driverId` | Per-driver aggregated metrics |
| `auditLog` | Auto-generated | Immutable change tracking |
| `userPreferences` | `userId` | Per-user settings & preferences |

### Realtime Database Paths

| Path | Purpose |
|---|---|
| `driverStatus/{driverId}` | Live driver monitoring status |
| `systemHeartbeat` | System online/offline indicator |
| `liveAlerts/{timestamp}` | Instant push alerts |
| `activeSessions/{sessionId}` | Active monitoring sessions |

---

## 🔐 Security Rules

### Firestore
- **Authentication required** for all reads and writes
- **Role-based access**: Admin-only deletion, owner-only preferences
- **Field validation**: Required fields enforced on creation
- **Immutable audit logs**: No updates or deletes allowed
- **Deny-by-default**: Catch-all rule denies unmatched paths

### Realtime Database
- **Authentication gated**: All paths require `auth != null`
- **Schema validation**: Required fields validated on write
- **Deny-by-default**: Unknown paths are blocked

---

## 🚀 Getting Started

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore**, **Realtime Database**, and **Authentication**
4. Under Authentication > Sign-in method, enable **Email/Password** and **Google**

### 2. Configure Environment Variables
```bash
# Copy the template
cp .env.example .env

# Fill in your Firebase credentials from Firebase Console > Project Settings
```

### 3. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only database
firebase deploy --only firestore:indexes
```

### 4. Seed the Database (Development)
Open the browser console and run:
```javascript
// Seed all data (drivers, events, statuses)
window.__seedFirebase()
```

Or import in your code:
```typescript
import { seedAll } from '@/firebase/seeder';
await seedAll();
```

### 5. Switch from Mock Data to Firebase
Replace `mockData.ts` imports with the Firebase hooks:

```typescript
// Before (mock data)
import { mockEvents, getDriversWithStatus } from '@/data/mockData';

// After (live Firebase data)
import { useDrivers } from '@/hooks/useDrivers';
import { useEvents } from '@/hooks/useEvents';

const { driversWithStatus, loading } = useDrivers();
const { events } = useEvents();
```

---

## 🔗 Service → Frontend Component Mapping

| Component | Data Source | Firebase Service |
|---|---|---|
| `MetricCard` | Dashboard KPIs | `statsService` + `useDashboardMetrics` |
| `LiveMonitor` | Real-time driver status | `realtimeService` + `useDrivers` |
| `EventsTable` | Drowsiness events (search/filter) | `eventService` + `useEvents` |
| `DriversTable` | Registered drivers | `driverService` + `useDrivers` |
| `DurationChart` | Cumulative duration per driver | `eventService` + `useEvents` |
| `SeverityDistributionChart` | Event severity breakdown | `eventService` + `useEvents` |
| `EventsTimelineChart` | Hourly event distribution | `eventService` + `useEvents` |
| `DriverPerformanceRadar` | Multi-metric driver comparison | `driverService` + `statsService` |
| `HourlyActivityHeatmap` | 24-hour activity heatmap | `eventService` + `useEvents` |
| `Header` (System Active) | System heartbeat | `realtimeService` |
| `ThemeToggle` | User preference | `authService` |

---

## 📊 Data Flow

### Creating a Drowsiness Event
```
IoT Sensor → createEvent() → Firestore (drowsinessEvents)
                            → createAlertFromEvent() → Firestore (alerts)
                            → pushLiveAlert() → Realtime DB (liveAlerts)
                            → updateDriverStatus() → Realtime DB (driverStatus)
                            → logAuditEvent() → Firestore (auditLog)
```

### Dashboard Real-time Updates
```
Firestore (drowsinessEvents) ──onSnapshot──→ useEvents hook → Charts/Tables
Realtime DB (driverStatus) ──onValue──→ useDrivers hook → LiveMonitor
Firestore (alerts) ──onSnapshot──→ useAlerts hook → Alert notifications
```

---

## 🏷️ TypeScript Interfaces

All types are defined in `src/types/driver.ts`:

- `Driver`, `DriverDoc` — Driver profile data
- `DrowsinessEvent`, `DrowsinessEventDoc` — Event records
- `DriverWithStatus` — Merged driver + live status
- `AlertDoc` — System alerts
- `DailyStatsDoc` — Daily aggregations
- `DriverStatsDoc` — Per-driver analytics
- `AuditLogDoc` — Change tracking
- `UserPreferencesDoc` — User settings
- `LiveDriverStatusEntry` — Realtime DB status
- `SystemHeartbeat` — System health

---

## ⚡ Performance Optimizations

1. **Firestore Converters**: Type-safe reads, no runtime casting errors
2. **Composite Indexes**: Pre-built for all multi-field queries
3. **Pagination**: `getEventsPaginated()` with cursor-based pagination
4. **Denormalization**: `driverName` stored on events for O(1) lookups
5. **Pre-computed Stats**: `dailyStats` and `driverStats` avoid expensive aggregations
6. **Realtime DB for Live Data**: Sub-second latency via WebSocket transport
7. **Selective Subscriptions**: Components only subscribe to the data they need

---

**Status**: ✅ Complete and production-ready
