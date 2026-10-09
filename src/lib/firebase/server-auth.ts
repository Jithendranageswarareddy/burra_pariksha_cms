/**
 * BURRA PARIKSHA CMS — Server-Side Authenticated Firebase Identity Provider
 * Sprint 4: Option A (Backend-Only Authoritative Gateway Architecture)
 *
 * Mint cryptographically signed Custom Tokens using existing server-side
 * Google Service Account credentials and exchange for Firebase ID tokens.
 * Authenticates the backend as `uid: backend-service` with `role: BACKEND_SERVICE`.
 */

import crypto from 'node:crypto';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

let backendAppInstance: FirebaseApp;
let backendFirestoreInstance: Firestore;
let backendAuthInstance: Auth;
let isInitialized = false;
let initPromise: Promise<Firestore> | null = null;

function createBackendCustomToken(uid: string, claims: Record<string, any>): string {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error('[ServerAuth] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY in environment');
  }

  key = key.replace(/\\n/g, '\n');
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    sub: email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${encHeader}.${encPayload}`);
  const sig = sign.sign(key, 'base64url');
  return `${encHeader}.${encPayload}.${sig}`;
}

export async function getBackendFirestore(): Promise<Firestore> {
  if (isInitialized && backendFirestoreInstance) {
    return backendFirestoreInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const appName = 'bp-cms-backend-gateway';
      const existing = getApps().find((a) => a.name === appName);
      if (existing) {
        backendAppInstance = existing;
      } else {
        backendAppInstance = initializeApp(firebaseConfig, appName);
      }

      backendAuthInstance = getAuth(backendAppInstance);
      const customToken = createBackendCustomToken('backend-service', {
        role: 'BACKEND_SERVICE',
        isBackend: true,
      });

      await signInWithCustomToken(backendAuthInstance, customToken);

      const dbId = (firebaseConfig as any).firestoreDatabaseId;
      backendFirestoreInstance = getFirestore(backendAppInstance, dbId);
      isInitialized = true;
      return backendFirestoreInstance;
    } catch (err: any) {
      console.error('[ServerAuth] Failed to initialize backend authenticated Firestore:', err.message);
      throw err;
    }
  })();

  return initPromise;
}
