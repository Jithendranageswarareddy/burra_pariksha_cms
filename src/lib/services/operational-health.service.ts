/**
 * BURRA PARIKSHA CMS - Authoritative Firestore Operational Health Service
 *
 * Provides safe, sanitized diagnostic information regarding Cloud Firestore connectivity,
 * Firebase Admin SDK health, API operational latency, and authentication state.
 *
 * GUARANTEE: Never exposes private keys, authorization headers, or secrets.
 */

import { getAdminFirestore } from '../firebase/admin';
import { sanitizeErrorMessage } from '../errors';

export type ConnectivityStatus = 'CONNECTED' | 'DEGRADED' | 'CONFIGURATION_ERROR' | 'UNAVAILABLE';
export type AuthStatus = 'VALID' | 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'PERMISSION_DENIED';
export type SpreadsheetAccessibility = 'ACCESSIBLE' | 'NOT_APPLICABLE';

export interface OperationalTelemetry {
  totalRequests: number;
  totalRetries: number;
  lastLatencyMs: number | null;
  lastSuccessfulOperation: string | null;
  lastFailedOperation: string | null;
  lastSuccessTimestamp: string | null;
  lastFailureTimestamp: string | null;
}

export interface OperationalHealthReport {
  generatedAt: string;
  isConfigured: boolean;
  isConnected: boolean;
  connectivityStatus: ConnectivityStatus;
  authStatus: AuthStatus;
  databaseProvider: 'FIRESTORE';
  spreadsheetAccessibility: SpreadsheetAccessibility;
  mode: 'CLOUD_FIRESTORE' | 'UNCONFIGURED';
  spreadsheetId: string;
  spreadsheetTitle: string | null;
  projectId: string;
  databaseId: string;
  telemetry: OperationalTelemetry;
  sanitizedDiagnosticMessage: string;
  isReadOnly: true;
  collections?: Array<{ name: string; status: 'ONLINE' | 'ERROR'; count?: number }>;
}

export class OperationalHealthService {
  private static instance: OperationalHealthService | null = null;
  private totalRequests = 0;
  private totalRetries = 0;
  private lastSuccessTimestamp: string | null = null;
  private lastFailureTimestamp: string | null = null;
  private lastSuccessfulOperation: string | null = null;
  private lastFailedOperation: string | null = null;
  private lastLatencyMs: number | null = null;

  private constructor() {}

  public static getInstance(): OperationalHealthService {
    if (!OperationalHealthService.instance) {
      OperationalHealthService.instance = new OperationalHealthService();
    }
    return OperationalHealthService.instance;
  }

  public recordOperation(op: string, success: boolean, latencyMs?: number, isRetry?: boolean): void {
    this.totalRequests++;
    if (isRetry) this.totalRetries++;
    if (latencyMs !== undefined) this.lastLatencyMs = latencyMs;
    if (success) {
      this.lastSuccessfulOperation = op;
      this.lastSuccessTimestamp = new Date().toISOString();
    } else {
      this.lastFailedOperation = op;
      this.lastFailureTimestamp = new Date().toISOString();
    }
  }

  public async getOperationalHealth(): Promise<OperationalHealthReport> {
    const projectId = process.env.GCP_PROJECT_ID || 'burra-pariksha-cms';
    const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e';

    const hasServiceAccount = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );

    const telemetry: OperationalTelemetry = {
      totalRequests: this.totalRequests,
      totalRetries: this.totalRetries,
      lastLatencyMs: this.lastLatencyMs,
      lastSuccessfulOperation: this.lastSuccessfulOperation,
      lastFailedOperation: this.lastFailedOperation,
      lastSuccessTimestamp: this.lastSuccessTimestamp,
      lastFailureTimestamp: this.lastFailureTimestamp,
    };

    try {
      const startTime = Date.now();
      const db = getAdminFirestore();
      // List collections as lightweight connectivity ping
      const collections = await db.listCollections();
      const latencyMs = Date.now() - startTime;
      this.recordOperation('PING_FIRESTORE', true, latencyMs);

      const message = `Successfully connected to Cloud Firestore database "${databaseId}" in project "${projectId}" (${collections.length} collections detected). Latency: ${latencyMs}ms.`;

      return {
        generatedAt: new Date().toISOString(),
        isConfigured: true,
        isConnected: true,
        connectivityStatus: 'CONNECTED',
        authStatus: 'VALID',
        databaseProvider: 'FIRESTORE',
        spreadsheetAccessibility: 'NOT_APPLICABLE',
        mode: 'CLOUD_FIRESTORE',
        spreadsheetId: '(Firestore Authoritative)',
        spreadsheetTitle: `Cloud Firestore [${projectId}]`,
        projectId,
        databaseId,
        telemetry: {
          ...telemetry,
          lastLatencyMs: latencyMs,
          lastSuccessfulOperation: 'PING_FIRESTORE',
        },
        sanitizedDiagnosticMessage: message,
        isReadOnly: true,
      };
    } catch (err: any) {
      const errorMsg = sanitizeErrorMessage(err?.message || 'Connection check failed');
      this.recordOperation('PING_FIRESTORE', false);

      let authStatus: AuthStatus = hasServiceAccount ? 'INVALID_CREDENTIALS' : 'MISSING_CREDENTIALS';
      if (errorMsg.includes('Permission Denied') || errorMsg.includes('PERMISSION_DENIED')) {
        authStatus = 'PERMISSION_DENIED';
      }

      return {
        generatedAt: new Date().toISOString(),
        isConfigured: hasServiceAccount,
        isConnected: false,
        connectivityStatus: hasServiceAccount ? 'UNAVAILABLE' : 'CONFIGURATION_ERROR',
        authStatus,
        databaseProvider: 'FIRESTORE',
        spreadsheetAccessibility: 'NOT_APPLICABLE',
        mode: hasServiceAccount ? 'CLOUD_FIRESTORE' : 'UNCONFIGURED',
        spreadsheetId: '(Firestore Authoritative)',
        spreadsheetTitle: null,
        projectId,
        databaseId,
        telemetry,
        sanitizedDiagnosticMessage: `Failed to connect to Cloud Firestore: ${errorMsg}`,
        isReadOnly: true,
      };
    }
  }
}

export const operationalHealthService = OperationalHealthService.getInstance();
