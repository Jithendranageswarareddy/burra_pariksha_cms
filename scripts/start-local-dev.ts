/**
 * BURRA PARIKSHA CMS — Safe Local-First Development Workflow Orchestrator
 *
 * Coordinates:
 * 1. Checks/starts the local Firestore Emulator on 127.0.0.1:8080 under synthetic project 'burra-pariksha-test'.
 * 2. Verifies the emulator is actually connected before enabling any writes.
 * 3. Idempotently seeds isolated baseline test data (Taxonomy, Question Configs, Local Users, Sample Draft).
 * 4. Starts the full-stack CMS development server with hot-reloading:
 *    - Backend hot reload via `tsx watch`
 *    - Frontend hot reload via Vite HMR
 * 5. Strictly protects live production Cloud Firestore from all development operations.
 */

import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { assertDatastoreSafe, probeEmulatorConnectivity, DEFAULT_EMULATOR_HOST } from '../src/config/datastore-guard';
import { seedEmulatorData } from './seed-emulator-data';

// Force local emulator environment
process.env.USE_FIRESTORE_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = DEFAULT_EMULATOR_HOST;
delete process.env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV;

let emulatorProcess: ChildProcess | null = null;
let serverProcess: ChildProcess | null = null;

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
    serverProcess = null;
  }
  if (emulatorProcess) {
    try {
      emulatorProcess.kill();
    } catch {}
    emulatorProcess = null;
  }
}

process.on('SIGINT', () => {
  console.log('\n[LocalDev] Shutting down development services...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

async function waitForEmulator(hostPort: string, maxWaitMs = 30000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const isAlive = await probeEmulatorConnectivity(hostPort, 1000);
    if (isAlive) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function startLocalDev(): Promise<void> {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — SAFE LOCAL-FIRST DEVELOPMENT RUNTIME');
  console.log('========================================================================\n');

  // 1. Verify Datastore Target Safety Guard
  const target = assertDatastoreSafe();
  if (target.mode !== 'LOCAL_FIRESTORE_EMULATOR' || target.isProductionTarget) {
    console.error('[CRITICAL SAFETY ABORT] Target datastore is not an isolated local emulator!');
    process.exit(1);
  }

  const emulatorHost = target.emulatorHost || DEFAULT_EMULATOR_HOST;
  console.log(`[Datastore Safety] Target verified: ${target.mode} (${target.projectId})`);
  console.log(`[Datastore Safety] Production Cloud Firestore is strictly ISOLATED.\n`);

  // 2. Check if Firestore Emulator is already running
  console.log(`[Connectivity] Checking Firestore Emulator at ${emulatorHost}...`);
  let isEmulatorRunning = await probeEmulatorConnectivity(emulatorHost, 1500);

  if (!isEmulatorRunning) {
    console.log('[Emulator] Emulator not detected. Launching local Firestore Emulator...');
    emulatorProcess = spawn(
      'npx',
      ['firebase-tools', 'emulators:start', '--only', 'firestore', '--project', 'burra-pariksha-test'],
      {
        stdio: 'inherit',
        shell: true,
      }
    );

    console.log('[Emulator] Waiting for emulator to be ready...');
    isEmulatorRunning = await waitForEmulator(emulatorHost, 30000);

    if (!isEmulatorRunning) {
      console.error(`[CRITICAL ERROR] Failed to connect to Firestore Emulator at ${emulatorHost} after 30s.`);
      cleanup();
      process.exit(1);
    }
  }

  console.log(`✓ Firestore Emulator is connected and ready at ${emulatorHost}.\n`);

  // 3. Seed isolated baseline data (idempotent)
  console.log('[Seed] Ensuring baseline test data is provisioned...');
  try {
    await seedEmulatorData();
  } catch (err: any) {
    console.warn('[Seed Warning] Baseline seeding completed with notice:', err?.message);
  }

  // 4. Start Hot-Reloading Development Server
  console.log('\n[Server] Starting Burra Pariksha CMS server with hot-reload...');
  console.log('- Backend hot reload: tsx watch');
  console.log('- Frontend hot reload: Vite HMR');
  console.log('- Endpoint: http://localhost:3000\n');

  serverProcess = spawn(
    'npx',
    [
      'tsx',
      'watch',
      '--clear-screen=false',
      'backend/server/server.ts',
    ],
    {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        USE_FIRESTORE_EMULATOR: 'true',
        FIRESTORE_EMULATOR_HOST: emulatorHost,
      },
    }
  );

  serverProcess.on('exit', (code) => {
    cleanup();
    process.exit(code || 0);
  });
}

startLocalDev().catch((err) => {
  console.error('Fatal local dev launcher error:', err);
  cleanup();
  process.exit(1);
});
