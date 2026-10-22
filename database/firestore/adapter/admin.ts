/**
 * BURRA PARIKSHA CMS — Authoritative Server-Side Firebase Admin SDK Provider
 * Single authoritative backend initialization module for Cloud Firestore access.
 *
 * Supports:
 * - Local Emulator: FIRESTORE_EMULATOR_HOST / USE_FIRESTORE_EMULATOR with synthetic project
 * - Local Antigravity: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY via inline cert
 * - Production Cloud Run / GCP: Application Default Credentials (ADC) fallback
 * - Configured named database: FIRESTORE_DATABASE_ID (ai-studio-burraparikshacon-...)
 * - Strict Datastore Isolation Guard: Fails closed if test or unapproved local runtime targets production
 * - Zero secret logging
 */

import '../../../src/config/env';
import { initializeApp, getApps, App, cert, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import {
  assertDatastoreSafe,
  DatastoreResolution,
} from '../../../src/config/datastore-guard';

let adminAppInstance: App | null = null;
let adminFirestoreInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;
let activeTargetConfig: DatastoreResolution | null = null;

export function getAdminApp(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0];
    return adminAppInstance;
  }

  // 1. Enforce Datastore Isolation Guard (fails closed if target is unsafe or unapproved)
  const target = assertDatastoreSafe();
  activeTargetConfig = target;

  let credential: any;
  if (target.mode === 'LOCAL_FIRESTORE_EMULATOR') {
    // Under emulator execution, ensure the emulator host environment variable is set for the SDK.
    // Zero secret exposure: Do not pass credentials to local emulator.
    if (target.emulatorHost) {
      process.env.FIRESTORE_EMULATOR_HOST = target.emulatorHost;
    }
    adminAppInstance = initializeApp({
      projectId: target.projectId,
    });
    return adminAppInstance;
  } else {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (email && privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      credential = cert({
        projectId: target.projectId,
        clientEmail: email,
        privateKey,
      });
    } else {
      // Fall back to Application Default Credentials (Cloud Run / GCP environments)
      credential = applicationDefault();
    }
  }

  adminAppInstance = initializeApp({
    credential,
    projectId: target.projectId,
  });

  return adminAppInstance;
}

export function getAdminFirestore(): Firestore {
  if (adminFirestoreInstance) {
    return adminFirestoreInstance;
  }

  // Enforce datastore safety guard before acquiring Firestore client
  const target = activeTargetConfig || assertDatastoreSafe();
  const app = getAdminApp();

  adminFirestoreInstance = getFirestore(app, target.databaseId);
  return adminFirestoreInstance;
}

export function getAdminAuth(): Auth {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }
  const app = getAdminApp();
  adminAuthInstance = getAuth(app);
  return adminAuthInstance;
}

export function setAdminAuth(mockAuth: Auth | any | null): void {
  adminAuthInstance = mockAuth;
}

export function getActiveDatastoreTarget(): DatastoreResolution | null {
  return activeTargetConfig;
}

export async function resetAdminApp(): Promise<void> {
  activeTargetConfig = null;
  adminAuthInstance = null;
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
