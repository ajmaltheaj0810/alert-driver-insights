// ──────────────────────────────────────────────────────────────
// Authentication Service — Firebase Auth integration
// Supports email/password, Google sign-in, and auth state mgmt
// ──────────────────────────────────────────────────────────────

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    type User,
    type Unsubscribe,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { COLLECTIONS } from '@/firebase/collections';
import type { UserPreferencesDoc, Severity } from '@/types/driver';

const googleProvider = new GoogleAuthProvider();

// ── SIGN UP ──────────────────────────────────────────────────

/**
 * Create a new account with email and password.
 */
export async function signUp(
    email: string,
    password: string,
    displayName: string
): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Set display name
    await updateProfile(user, { displayName });

    // Create default user preferences in Firestore
    await createDefaultPreferences(user.uid);

    return user;
}

// ── SIGN IN ──────────────────────────────────────────────────

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

/**
 * Sign in with Google.
 */
export async function signInWithGoogle(): Promise<User> {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    // Check if preferences exist, create if not
    const prefsDoc = await getDoc(
        doc(db, COLLECTIONS.USER_PREFERENCES, user.uid)
    );
    if (!prefsDoc.exists()) {
        await createDefaultPreferences(user.uid);
    }

    return user;
}

// ── SIGN OUT ─────────────────────────────────────────────────

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

// ── PASSWORD RESET ───────────────────────────────────────────

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

// ── AUTH STATE ────────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthState(
    callback: (user: User | null) => void
): Unsubscribe {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user (or null).
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Check if a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
    return auth.currentUser !== null;
}

// ── USER PREFERENCES ─────────────────────────────────────────

/**
 * Create default user preferences.
 */
async function createDefaultPreferences(userId: string): Promise<void> {
    const defaults: UserPreferencesDoc = {
        userId,
        theme: 'dark',
        dashboardLayout: 'default',
        notificationSettings: {
            emailAlerts: true,
            pushAlerts: true,
            severityThreshold: 'medium',
        },
        updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.USER_PREFERENCES, userId), defaults);
}

/**
 * Get user preferences.
 */
export async function getUserPreferences(
    userId: string
): Promise<UserPreferencesDoc | null> {
    const docRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as UserPreferencesDoc) : null;
}

/**
 * Update user preferences.
 */
export async function updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferencesDoc, 'userId'>>
): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USER_PREFERENCES, userId);
    await setDoc(
        docRef,
        { ...updates, updatedAt: Timestamp.now() },
        { merge: true }
    );
}

/**
 * Update notification settings.
 */
export async function updateNotificationSettings(
    userId: string,
    settings: {
        emailAlerts?: boolean;
        pushAlerts?: boolean;
        severityThreshold?: Severity;
    }
): Promise<void> {
    const current = await getUserPreferences(userId);
    if (!current) return;

    await updateUserPreferences(userId, {
        notificationSettings: {
            ...current.notificationSettings,
            ...settings,
        },
    });
}
