// ──────────────────────────────────────────────────────────────
// Audit Log Service — Immutable change tracking
// Records who did what and when for compliance and debugging.
// ──────────────────────────────────────────────────────────────

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/firebase/collections';
import type { AuditAction, AuditLogDoc } from '@/types/driver';

const auditRef = () => collection(db, COLLECTIONS.AUDIT_LOG);

/**
 * Log an audit event.
 */
export async function logAuditEvent(data: {
    action: AuditAction;
    userId: string;
    targetCollection: string;
    targetId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
}): Promise<void> {
    const logEntry: AuditLogDoc = {
        action: data.action,
        userId: data.userId,
        targetCollection: data.targetCollection,
        targetId: data.targetId,
        before: data.before ?? null,
        after: data.after ?? null,
        timestamp: Timestamp.now(),
    };

    await addDoc(auditRef(), logEntry);
}

/**
 * Get recent audit log entries.
 */
export async function getRecentAuditLogs(maxResults = 50): Promise<AuditLogDoc[]> {
    const q = query(auditRef(), orderBy('timestamp', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as AuditLogDoc);
}

/**
 * Get audit logs filtered by action type.
 */
export async function getAuditLogsByAction(
    action: AuditAction,
    maxResults = 50
): Promise<AuditLogDoc[]> {
    const q = query(
        auditRef(),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as AuditLogDoc);
}

/**
 * Get audit logs for a specific resource.
 */
export async function getAuditLogsForResource(
    targetCollection: string,
    targetId: string,
    maxResults = 50
): Promise<AuditLogDoc[]> {
    const q = query(
        auditRef(),
        where('targetCollection', '==', targetCollection),
        where('targetId', '==', targetId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as AuditLogDoc);
}

/**
 * Get audit logs by user.
 */
export async function getAuditLogsByUser(
    userId: string,
    maxResults = 50
): Promise<AuditLogDoc[]> {
    const q = query(
        auditRef(),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as AuditLogDoc);
}
