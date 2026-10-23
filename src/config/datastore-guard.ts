/**
 * BURRA PARIKSHA CMS — Authoritative Datastore Isolation Guard
 *
 * Enforces strict environment boundaries to protect live production Cloud Firestore
 * from inadvertent mutation or read access during local development and automated testing.
 *
 * Core Safety Rules:
 * 1. Live production datastore (project: burra-pariksha-cms, database: ai-studio-burraparikshacon-...)
 *    is strictly prohibited during automated test execution.
 * 2. In automated test runtime (NODE_ENV=test, PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY, ISOLATED_TEST),
 *    tests must run in memory or against a verified local Firestore Emulator using an approved
 *    synthetic project (burra-pariksha-test, burra-pariksha-emulator, demo-burra-pariksha) and database ((default)).
 * 3. In local development (NODE_ENV !== production), connecting to the production database is blocked by
 *    default. Developers must run the Firestore Emulator (USE_FIRESTORE_EMULATOR=true) or explicitly
 *    opt in via ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true.
 * 4. Production runtime (NODE_ENV=production) is authorized for canonical production infrastructure.
 * 5. Zero secrets logged: Never prints private keys, tokens, or credential payloads.
 */

import http from 'http';
import firebaseConfig from '../../firebase-applet-config.json';

export const KNOWN_PRODUCTION_PROJECTS = ['burra-pariksha-cms'] as const;

export const KNOWN_PRODUCTION_DATABASES = [
  'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
  'ai-studio-burraparishacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
] as const;

export const KNOWN_PRODUCTION_TARGETS = [
  {
    projectId: 'burra-pariksha-cms',
    databaseId: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    reason: 'Production AI Studio applet database (ENVIRONMENT-CONTRACT.md Section 2)',
  },
  {
    projectId: 'burra-pariksha-cms',
    databaseId: '(default)',
    reason: 'Default GCP database for production project burra-pariksha-cms',
  },
] as const;

export const APPROVED_SYNTHETIC_TEST_PROJECTS = [
  'burra-pariksha-test',
  'burra-pariksha-emulator',
  'demo-burra-pariksha',
] as const;

export interface ApprovedNonProductionTarget {
  readonly projectId: string;
  readonly databaseId: string;
  readonly documentedIn: string;
  readonly description: string;
}

export const INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS: readonly ApprovedNonProductionTarget[] = [];

export const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
export const DEFAULT_EMULATOR_PROJECT = 'burra-pariksha-test';
export const DEFAULT_EMULATOR_DATABASE = '(default)';

export type DatastoreMode =
  | 'PRODUCTION_CLOUD'
  | 'LOCAL_FIRESTORE_EMULATOR'
  | 'IN_MEMORY'
  | 'APPROVED_REMOTE_DEV';

export class DatastoreIsolationError extends Error {
  public readonly code = 'DATASTORE_ISOLATION_ERROR';
  public readonly reasons: readonly string[];

  constructor(message: string, reasons: readonly string[] = []) {
    super(message);
    this.name = 'DatastoreIsolationError';
    this.reasons = reasons;
    Object.setPrototypeOf(this, DatastoreIsolationError.prototype);
  }
}

export interface DatastoreResolution {
  readonly isApproved: boolean;
  readonly mode: DatastoreMode;
  readonly projectId: string;
  readonly databaseId: string;
  readonly emulatorHost: string | null;
  readonly isProductionTarget: boolean;
  readonly isTestRuntime: boolean;
  readonly isProductionRuntime: boolean;
  readonly reasons: readonly string[];
  readonly approvalEvidence: readonly string[];
}

export interface IsolationVerification {
  readonly isApproved: boolean;
  readonly isolationMode: 'LOCAL_FIRESTORE_EMULATOR' | 'APPROVED_REMOTE_NON_PRODUCTION' | 'NONE';
  readonly projectId: string;
  readonly databaseId: string;
  readonly emulatorHost: string | null;
  readonly rejectionReasons: string[];
  readonly approvalEvidence: string[];
}

/**
 * Returns true if execution is running in an automated test context.
 */
export function isTestRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'test') return true;
  if (env.PERSISTENCE_MODE === 'IN_MEMORY_TEST_ONLY') return true;
  if (env.PERSISTENCE_MODE === 'ISOLATED_TEST') return true;
  if (env.ISOLATED_TEST === 'true') return true;
  if (env.VITEST === 'true' || env.JEST_WORKER_ID !== undefined) return true;
  return false;
}

/**
 * Returns true if execution is running in production mode.
 */
export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Returns true if the Firestore Emulator is explicitly enabled or configured.
 */
export function isEmulatorConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.USE_FIRESTORE_EMULATOR?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  const rawHost = env.FIRESTORE_EMULATOR_HOST?.trim();
  return Boolean(rawHost && rawHost.length > 0);
}

/**
 * Normalizes typographical discrepancy in FIRESTORE_DATABASE_ID.
 */
export function normalizeDatabaseId(databaseId: string | undefined): string {
  if (!databaseId) return '(default)';
  let normalized = databaseId.trim();
  if (normalized.includes('burraparishacon')) {
    normalized = normalized.replace('burraparishacon', 'burraparikshacon');
  }
  return normalized;
}

/**
 * Authoritatively resolves the target datastore configuration and validates
 * whether the current execution runtime is safely authorized to access it.
 */
export function resolveDatastoreTarget(env: NodeJS.ProcessEnv = process.env): DatastoreResolution {
  const reasons: string[] = [];
  const approvalEvidence: string[] = [];
  const testMode = isTestRuntime(env);
  const prodMode = isProductionRuntime(env);

  // 1. In-memory mode (PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY)
  if (env.PERSISTENCE_MODE === 'IN_MEMORY_TEST_ONLY') {
    approvalEvidence.push('In-memory test persistence mode active (PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY). Zero remote datastore access.');
    return {
      isApproved: true,
      mode: 'IN_MEMORY',
      projectId: 'in-memory',
      databaseId: 'in-memory',
      emulatorHost: null,
      isProductionTarget: false,
      isTestRuntime: true,
      isProductionRuntime: false,
      reasons: [],
      approvalEvidence,
    };
  }

  // 2. Local Firestore Emulator configuration
  if (isEmulatorConfigured(env)) {
    const rawHost = env.FIRESTORE_EMULATOR_HOST?.trim();
    const emulatorHost = rawHost || DEFAULT_EMULATOR_HOST;
    const hostPortRegex = /^([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\]):[0-9]{1,5}$/;

    if (!hostPortRegex.test(emulatorHost)) {
      reasons.push(
        `Configured FIRESTORE_EMULATOR_HOST ("${emulatorHost}") is malformed. Expected valid host:port format (e.g. 127.0.0.1:8080).`
      );
    }

    // Resolve emulator synthetic project.
    // If the environment defines a synthetic project, ensure it is in APPROVED_SYNTHETIC_TEST_PROJECTS.
    // If environment contains the canonical production project burra-pariksha-cms, sanitize and default to burra-pariksha-test.
    const requestedProject = (
      env.FIRESTORE_TEST_PROJECT_ID ||
      env.APPROVED_NON_PRODUCTION_PROJECT_ID ||
      env.APPROVED_TEST_PROJECT_ID
    )?.trim();

    let targetProject: string = DEFAULT_EMULATOR_PROJECT;
    if (requestedProject) {
      if (APPROVED_SYNTHETIC_TEST_PROJECTS.includes(requestedProject as any)) {
        targetProject = requestedProject;
      } else {
        reasons.push(
          `Project "${requestedProject}" is not an approved synthetic test project for emulator execution. Allowed projects: ${APPROVED_SYNTHETIC_TEST_PROJECTS.join(', ')}.`
        );
      }
    }

    // Emulator database defaults to (default)
    const requestedDb = env.FIRESTORE_TEST_DATABASE_ID?.trim();
    let targetDatabase: string = DEFAULT_EMULATOR_DATABASE;
    if (requestedDb) {
      const normalizedDb = normalizeDatabaseId(requestedDb);
      if (KNOWN_PRODUCTION_DATABASES.includes(normalizedDb as any)) {
        reasons.push(
          `Database "${requestedDb}" matches canonical production database and is prohibited for emulator test execution.`
        );
      } else {
        targetDatabase = normalizedDb;
      }
    }

    const isApproved = reasons.length === 0;
    if (isApproved) {
      approvalEvidence.push(
        `Configured for local Firestore Emulator at ${emulatorHost} with approved synthetic project "${targetProject}" and database "${targetDatabase}".`
      );
    }

    return {
      isApproved,
      mode: 'LOCAL_FIRESTORE_EMULATOR',
      projectId: targetProject,
      databaseId: targetDatabase,
      emulatorHost,
      isProductionTarget: false,
      isTestRuntime: testMode,
      isProductionRuntime: prodMode,
      reasons,
      approvalEvidence,
    };
  }

  // 3. Cloud Datastore target resolution (No emulator active)
  const candidateProjectId =
    env.GCP_PROJECT ||
    env.GCP_PROJECT_ID ||
    env.GOOGLE_CLOUD_PROJECT ||
    env.GCLOUD_PROJECT ||
    firebaseConfig.projectId ||
    'burra-pariksha-cms';

  const candidateDatabaseId = normalizeDatabaseId(
    env.FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId || '(default)'
  );

  const isProdTarget =
    KNOWN_PRODUCTION_PROJECTS.includes(candidateProjectId as any) ||
    KNOWN_PRODUCTION_DATABASES.includes(candidateDatabaseId as any);

  // Rule 3A: Automated test runtime attempting to connect to unisolated datastore without emulator
  if (testMode) {
    reasons.push(
      `CRITICAL FAIL-CLOSED: Test execution attempted to connect to unisolated datastore (project="${candidateProjectId}", database="${candidateDatabaseId}") without emulator. Under BP-CMS policy, automated tests must run in memory (PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY) or against the Firestore Emulator (USE_FIRESTORE_EMULATOR=true). Live datastore access during tests is strictly prohibited.`
    );
    return {
      isApproved: false,
      mode: 'PRODUCTION_CLOUD',
      projectId: candidateProjectId,
      databaseId: candidateDatabaseId,
      emulatorHost: null,
      isProductionTarget: isProdTarget,
      isTestRuntime: true,
      isProductionRuntime: false,
      reasons,
      approvalEvidence: [],
    };
  }

  // Rule 3B: Production runtime (Cloud Run container) is authorized for production datastore
  if (prodMode) {
    approvalEvidence.push(
      `Production runtime authorized for Cloud Firestore (project="${candidateProjectId}", database="${candidateDatabaseId}").`
    );
    return {
      isApproved: true,
      mode: 'PRODUCTION_CLOUD',
      projectId: candidateProjectId,
      databaseId: candidateDatabaseId,
      emulatorHost: null,
      isProductionTarget: isProdTarget,
      isTestRuntime: false,
      isProductionRuntime: true,
      reasons: [],
      approvalEvidence,
    };
  }

  // Rule 3C: Local development (NODE_ENV !== production) targeting production datastore
  if (isProdTarget) {
    if (env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV === 'true') {
      approvalEvidence.push(
        `Explicit local development override active (ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true). Bound to production Cloud Firestore (project="${candidateProjectId}", database="${candidateDatabaseId}").`
      );
      return {
        isApproved: true,
        mode: 'PRODUCTION_CLOUD',
        projectId: candidateProjectId,
        databaseId: candidateDatabaseId,
        emulatorHost: null,
        isProductionTarget: true,
        isTestRuntime: false,
        isProductionRuntime: false,
        reasons: [],
        approvalEvidence,
      };
    }

    reasons.push(
      `CRITICAL FAIL-CLOSED: Local development is configured to target production Firestore (project="${candidateProjectId}", database="${candidateDatabaseId}"). ` +
      `Connecting to live production from local development is blocked by default to prevent accidental data corruption or loss. ` +
      `To run locally: ` +
      `1) Set USE_FIRESTORE_EMULATOR=true in .env.local (and ensure the emulator is running at 127.0.0.1:8080), or ` +
      `2) Set PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY. ` +
      `If you deliberately need to connect to production from local dev, set ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true.`
    );

    return {
      isApproved: false,
      mode: 'PRODUCTION_CLOUD',
      projectId: candidateProjectId,
      databaseId: candidateDatabaseId,
      emulatorHost: null,
      isProductionTarget: true,
      isTestRuntime: false,
      isProductionRuntime: false,
      reasons,
      approvalEvidence: [],
    };
  }

  // Rule 3D: Local development targeting non-production remote datastore
  approvalEvidence.push(
    `Local development targeting non-production remote datastore (project="${candidateProjectId}", database="${candidateDatabaseId}").`
  );
  return {
    isApproved: true,
    mode: 'APPROVED_REMOTE_DEV',
    projectId: candidateProjectId,
    databaseId: candidateDatabaseId,
    emulatorHost: null,
    isProductionTarget: false,
    isTestRuntime: false,
    isProductionRuntime: false,
    reasons: [],
    approvalEvidence,
  };
}

/**
 * Asserts that the datastore configuration is safe.
 * Throws DatastoreIsolationError if unapproved, failing closed.
 */
export function assertDatastoreSafe(env: NodeJS.ProcessEnv = process.env): DatastoreResolution {
  const resolution = resolveDatastoreTarget(env);
  if (!resolution.isApproved) {
    const errorMsg = resolution.reasons.join('\n');
    throw new DatastoreIsolationError(errorMsg, resolution.reasons);
  }
  return resolution;
}

/**
 * Returns a secret-free summary of datastore diagnostic status for startup logs.
 */
export function getDatastoreDiagnosticStatus(env: NodeJS.ProcessEnv = process.env) {
  const resolution = resolveDatastoreTarget(env);
  return {
    isApproved: resolution.isApproved,
    mode: resolution.mode,
    projectId: resolution.projectId,
    databaseId: resolution.databaseId,
    emulatorHost: resolution.emulatorHost || 'none (cloud)',
    isProductionTarget: resolution.isProductionTarget,
    reasons: resolution.reasons,
  };
}

/**
 * Backward-compatible evaluation function adhering to S8/S9 integration contract.
 */
export function evaluateDatastoreIsolation(
  activeProjectId: string,
  activeDatabaseId: string,
  env: NodeJS.ProcessEnv = process.env
): IsolationVerification {
  const rejectionReasons: string[] = [];
  const approvalEvidence: string[] = [];

  const normalizedDb = normalizeDatabaseId(activeDatabaseId);
  const emulatorHost = env.FIRESTORE_EMULATOR_HOST?.trim() || null;
  const envApprovedProject = (env.APPROVED_NON_PRODUCTION_PROJECT_ID || env.APPROVED_TEST_PROJECT_ID)?.trim() || null;
  const envApprovedDatabase = (env.APPROVED_NON_PRODUCTION_DATABASE_ID || env.APPROVED_TEST_DATABASE_ID)?.trim() || null;

  // Rule 1: Check known production target match (Immediate disqualification)
  const isProduction = KNOWN_PRODUCTION_TARGETS.some(
    (prod) =>
      prod.projectId === activeProjectId &&
      (prod.databaseId === normalizedDb || prod.databaseId === '(default)' || normalizedDb === '(default)')
  );
  if (
    isProduction ||
    activeProjectId === 'burra-pariksha-cms' ||
    KNOWN_PRODUCTION_DATABASES.includes(normalizedDb as any)
  ) {
    rejectionReasons.push(
      `Active datastore (project="${activeProjectId}", database="${activeDatabaseId}") matches canonical production infrastructure. Under AGENTS.md Rule 14, persistent mutation tests against production are strictly prohibited.`
    );
  }

  // Rule 2: Evaluate local Firestore Emulator
  if (emulatorHost && emulatorHost.length > 0) {
    const hostPortRegex = /^([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\]):[0-9]{1,5}$/;
    if (!hostPortRegex.test(emulatorHost)) {
      rejectionReasons.push(
        `Configured FIRESTORE_EMULATOR_HOST ("${emulatorHost}") is malformed. Expected valid host:port format (e.g. 127.0.0.1:8080).`
      );
    }

    const isApprovedSynthetic = APPROVED_SYNTHETIC_TEST_PROJECTS.includes(activeProjectId as any);
    if (!isApprovedSynthetic) {
      rejectionReasons.push(
        `Project "${activeProjectId}" is not an approved synthetic test project for emulator execution. Allowed projects: ${APPROVED_SYNTHETIC_TEST_PROJECTS.join(', ')}.`
      );
    }

    if (KNOWN_PRODUCTION_DATABASES.includes(normalizedDb as any)) {
      rejectionReasons.push(
        `Database "${activeDatabaseId}" matches canonical production database and is prohibited for emulator test execution.`
      );
    }

    if (rejectionReasons.length === 0) {
      approvalEvidence.push(
        `Configured for local Firestore Emulator at ${emulatorHost} with approved synthetic project "${activeProjectId}" and database "${activeDatabaseId}"`
      );
      return {
        isApproved: true,
        isolationMode: 'LOCAL_FIRESTORE_EMULATOR',
        projectId: activeProjectId,
        databaseId: activeDatabaseId,
        emulatorHost,
        rejectionReasons: [],
        approvalEvidence,
      };
    }

    return {
      isApproved: false,
      isolationMode: 'LOCAL_FIRESTORE_EMULATOR',
      projectId: activeProjectId,
      databaseId: activeDatabaseId,
      emulatorHost,
      rejectionReasons,
      approvalEvidence: [],
    };
  } else {
    rejectionReasons.push(
      'Missing emulator configuration: FIRESTORE_EMULATOR_HOST is required for local emulator execution.'
    );
  }

  // Rule 3: Reject missing database approval
  if (!envApprovedDatabase || envApprovedDatabase.length === 0) {
    rejectionReasons.push(
      'Missing database approval: APPROVED_NON_PRODUCTION_DATABASE_ID is required but not provided. Both project ID and database ID must be explicitly approved.'
    );
  }

  if (!envApprovedProject || envApprovedProject.length === 0) {
    rejectionReasons.push(
      'Missing project approval: APPROVED_NON_PRODUCTION_PROJECT_ID is required but not provided.'
    );
  }

  // Rule 4: Match independently documented approved targets
  const documentedMatch = INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS.find(
    (target) =>
      target.projectId === activeProjectId &&
      target.databaseId === activeDatabaseId &&
      target.projectId === envApprovedProject &&
      target.databaseId === envApprovedDatabase
  );

  if (!documentedMatch) {
    rejectionReasons.push(
      `Target (project="${activeProjectId}", database="${activeDatabaseId}") does not match any entry in INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS. Environment variables alone cannot grant approval without independent architectural documentation.`
    );
  }

  return {
    isApproved: rejectionReasons.length === 0,
    isolationMode: rejectionReasons.length === 0 ? 'APPROVED_REMOTE_NON_PRODUCTION' : 'NONE',
    projectId: activeProjectId,
    databaseId: activeDatabaseId,
    emulatorHost: null,
    rejectionReasons,
    approvalEvidence,
  };
}

/**
 * Probes the local Firestore Emulator via HTTP to verify that it is actually online and responsive.
 */
export async function probeEmulatorConnectivity(
  hostPort: string = DEFAULT_EMULATOR_HOST,
  timeoutMs: number = 2000
): Promise<boolean> {
  const parts = hostPort.split(':');
  const host = parts[0] || '127.0.0.1';
  const port = parseInt(parts[1] || '8080', 10);

  return new Promise<boolean>((resolve) => {
    const req = http.get(
      { host, port, path: '/', timeout: timeoutMs },
      (res) => {
        resolve(res.statusCode === 200 || (res.statusCode !== undefined && res.statusCode < 500));
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Asserts that the local Firestore Emulator is alive and accepting connections.
 * Fails closed with DatastoreIsolationError if unreachable, preventing unverified local writes.
 */
export async function assertEmulatorAlive(
  hostPort: string = DEFAULT_EMULATOR_HOST,
  timeoutMs: number = 2000
): Promise<void> {
  const isAlive = await probeEmulatorConnectivity(hostPort, timeoutMs);
  if (!isAlive) {
    throw new DatastoreIsolationError(
      `CRITICAL FAIL-CLOSED: Local Firestore Emulator is configured (USE_FIRESTORE_EMULATOR=true) ` +
      `but is NOT reachable at ${hostPort}.\n` +
      `To protect live production data and ensure safe local execution, writes are blocked.\n` +
      `Start the local emulator before running the application: npm run emulator`,
      [`Emulator host ${hostPort} unreachable`]
    );
  }
}

/**
 * Asserts that a destructive administrative script is permitted to execute.
 * STRICT SAFETY INTERLOCK:
 * Destructive scripts (zerodown, admin-reset, purge) are strictly restricted
 * to the verified local Firestore emulator. They are permanently prohibited
 * from running against production Cloud Firestore, regardless of ALLOW_PRODUCTION_FIRESTORE_IN_DEV.
 */
export function assertDestructiveScriptSafe(
  scriptName: string,
  env: NodeJS.ProcessEnv = process.env
): DatastoreResolution {
  const resolution = assertDatastoreSafe(env);

  if (
    resolution.mode !== 'LOCAL_FIRESTORE_EMULATOR' ||
    resolution.isProductionTarget ||
    !resolution.emulatorHost
  ) {
    throw new DatastoreIsolationError(
      `CRITICAL SAFETY INTERLOCK: "${scriptName}" is a destructive script and is strictly prohibited ` +
      `from executing against production Cloud Firestore or any remote database target.\n` +
      `Current resolved datastore target: mode=${resolution.mode}, project=${resolution.projectId}, ` +
      `database=${resolution.databaseId}, isProductionTarget=${resolution.isProductionTarget}.\n` +
      `Destructive scripts may ONLY execute against a verified local Firestore Emulator ` +
      `(USE_FIRESTORE_EMULATOR=true with approved synthetic test project).`,
      [
        `Destructive script "${scriptName}" requires LOCAL_FIRESTORE_EMULATOR target`,
        `Current target mode: ${resolution.mode}`,
        `Current target project: ${resolution.projectId}`,
      ]
    );
  }

  return resolution;
}
