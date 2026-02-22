// ──────────────────────────────────────────────────────────────
// useAuth — React hook for Firebase authentication state
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
    subscribeToAuthState,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    getCurrentUser,
    getUserPreferences,
    updateUserPreferences,
} from '@/services/authService';
import type { UserPreferencesDoc, Severity } from '@/types/driver';

interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    error: Error | null;
    preferences: UserPreferencesDoc | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    updatePreferences: (updates: Partial<Omit<UserPreferencesDoc, 'userId'>>) => Promise<void>;
    isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(getCurrentUser());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [preferences, setPreferences] = useState<UserPreferencesDoc | null>(null);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                // Load user preferences
                try {
                    const prefs = await getUserPreferences(firebaseUser.uid);
                    setPreferences(prefs);
                } catch (err) {
                    console.error('[useAuth] Error loading preferences:', err);
                }
            } else {
                setPreferences(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            await signIn(email, password);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, []);

    const register = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        try {
            await signUp(email, password, displayName);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await signOut();
    }, []);

    const sendPasswordReset = useCallback(async (email: string) => {
        setError(null);
        try {
            await resetPassword(email);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, []);

    const updatePrefs = useCallback(
        async (updates: Partial<Omit<UserPreferencesDoc, 'userId'>>) => {
            if (!user) return;
            await updateUserPreferences(user.uid, updates);
            const refreshed = await getUserPreferences(user.uid);
            setPreferences(refreshed);
        },
        [user]
    );

    return {
        user,
        loading,
        error,
        preferences,
        login,
        register,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        updatePreferences: updatePrefs,
        isAuthenticated: user !== null,
    };
}
