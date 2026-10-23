/**
 * BURRA PARIKSHA CMS — Secure Local Environment Configuration Loader
 *
 * Responsibilities:
 * - Loads '.env.local' (highest local priority) followed by '.env' in local development.
 * - Does not override existing process.env variables (preserves container/cloud injection).
 * - Safe for production: In Cloud Run / production deployments where .env.local is absent,
 *   this is a clean no-op that relies on platform-injected process.env.
 * - Zero secret logging: Never prints or exposes secret values.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export function loadLocalEnv(): void {
  // Only attempt file-based env loading if running in a Node.js process
  if (typeof process === 'undefined' || !process.cwd) {
    return;
  }

  const cwd = process.cwd();
  const envLocalPath = path.resolve(cwd, '.env.local');
  const envPath = path.resolve(cwd, '.env');

  // 1. Prioritize .env.local (developer-specific local secrets)
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: false, quiet: true } as any);
  }

  // 2. Fall back to .env for baseline local defaults if present
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false, quiet: true } as any);
  }

  // 3. Normalize known typographical discrepancy in FIRESTORE_DATABASE_ID
  if (process.env.FIRESTORE_DATABASE_ID && process.env.FIRESTORE_DATABASE_ID.includes('burraparishacon')) {
    process.env.FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID.replace(
      'burraparishacon',
      'burraparikshacon'
    );
  }

  // 4. Default emulator host if USE_FIRESTORE_EMULATOR is enabled
  const useEmulator = process.env.USE_FIRESTORE_EMULATOR?.trim().toLowerCase();
  if (useEmulator === 'true' || useEmulator === '1') {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    }
  }
}

// Auto-execute on module import in Node runtime
loadLocalEnv();
