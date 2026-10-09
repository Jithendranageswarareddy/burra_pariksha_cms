/**
 * BURRA PARIKSHA CMS — Firebase SDK Configuration & Central Initialization
 * Sprint 4: Production Data Layer Migration
 *
 * Configures the official Firebase Client SDK using firebase-applet-config.json.
 * Exports db (Firestore) and auth instances with fallback handling.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Load config safely from JSON file
import firebaseConfig from '../../../firebase-applet-config.json';

let appInstance: FirebaseApp;
let firestoreInstance: Firestore;
let authInstance: Auth;

try {
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // Initialize Firestore specifying the provisioned database ID
  firestoreInstance = getFirestore(appInstance, (firebaseConfig as any).firestoreDatabaseId);
  authInstance = getAuth(appInstance);
} catch (err) {
  console.warn('[FirebaseConfig] Warning: Failed to initialize Firebase SDK from config:', err);
}

export const app = appInstance!;
export const db = firestoreInstance!;
export const auth = authInstance!;
export { firebaseConfig };
