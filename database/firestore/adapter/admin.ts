/**
 * BURRA PARIKSHA CMS — Authoritative Server-Side Firebase Admin SDK Provider
 * Single authoritative backend initialization module for Cloud Firestore access.
 *
 * Supports:
 * - Local Antigravity: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY via inline cert
 * - Production Cloud Run / GCP: Application Default Credentials (ADC) fallback
 * - Configured named database: FIRESTORE_DATABASE_ID (ai-studio-burraparikshacon-...)
 * - Zero secret logging
 */

import '../../../src/config/env';
import { initializeApp, getApps, App, cert, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

let adminAppInstance: App | null = null;
let adminFirestoreInstance: Firestore | null = null;

export function getAdminApp(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0];
    return adminAppInstance;
  }

  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    (process.env.FIRESTORE_EMULATOR_HOST ? 'burra-pariksha-test' : firebaseConfig.projectId) ||
    'burra-pariksha-cms';

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  let credential;
  if (email && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    credential = cert({
      projectId,
      clientEmail: email,
      privateKey,
    });
  } else {
    // Fall back to Application Default Credentials (Cloud Run / GCP environments)
    credential = applicationDefault();
  }

  adminAppInstance = initializeApp({
    credential,
    projectId,
  });

  return adminAppInstance;
}

export function getAdminFirestore(): Firestore {
  if (adminFirestoreInstance) {
    return adminFirestoreInstance;
  }

  const app = getAdminApp();
  let databaseId =
    process.env.FIRESTORE_DATABASE_ID ||
    (process.env.FIRESTORE_EMULATOR_HOST ? '(default)' : (firebaseConfig as any).firestoreDatabaseId) ||
    '(default)';

  if (databaseId.includes('burraparishacon')) {
    databaseId = databaseId.replace('burraparishacon', 'burraparikshacon');
  }

  adminFirestoreInstance = getFirestore(app, databaseId);
  return adminFirestoreInstance;
}

export async function resetAdminApp(): Promise<void> {
  if (adminFirestoreInstance) {
    try {
      await adminFirestoreInstance.terminate();
    } catch {
      // ignore termination failure
    }
    adminFirestoreInstance = null;
  }
  if (adminAppInstance) {
    try {
      await deleteApp(adminAppInstance);
    } catch {
      // ignore deletion failure
    }
    adminAppInstance = null;
  }
}
