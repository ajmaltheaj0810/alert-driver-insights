// Firebase Configuration
// All sensitive keys are loaded from environment variables for security.
// Create a .env file at the project root with your Firebase project credentials.

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration using Vite env variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore (persistent document database)
export const db: Firestore = getFirestore(app);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Realtime Database (for live monitoring / WebSocket-style updates)
export const realtimeDb: Database = getDatabase(app);

// Initialize Analytics (only in browser environments)
let analytics: Analytics | null = null;
isSupported().then((supported) => {
    if (supported) {
        analytics = getAnalytics(app);
    }
});
export { analytics };

export default app;
