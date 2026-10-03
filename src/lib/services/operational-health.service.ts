/**
 * BURRA PARIKSHA CMS - Operational Connectivity & Telemetry Health Service
 * Phase 8B: Operational Reliability, Recovery & Production Hardening
 * 
 * Provides safe, sanitized diagnostic information regarding Google Sheets connectivity,
 * API operational latency, retry telemetry, and service account authentication state.
 * 
 * GUARANTEE: Never exposes private keys, authorization headers, or secrets.
 */

import { googleSheetsClient, OperationalTelemetry } from '../google-sheets/client';
import { sanitizeErrorMessage } from '../google-sheets/errors';

export type ConnectivityStatus = 'CONNECTED' | 'DEGRADED' | 'CONFIGURATION_ERROR' | 'UNAVAILABLE';
export type AuthStatus = 'VALID' | 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'PERMISSION_DENIED';
export type SpreadsheetAccessibility = 'ACCESSIBLE' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'UNREACHABLE' | 'NOT_CONFIGURED';

export interface OperationalHealthReport {
  generatedAt: string;
  isConfigured: boolean;
  isConnected: boolean;
  connectivityStatus: ConnectivityStatus;
  authStatus: AuthStatus;
  spreadsheetAccessibility: SpreadsheetAccessibility;
  mode: 'LIVE_GOOGLE_SHEETS' | 'MOCK_DEVELOPMENT';
  spreadsheetId: string;
  spreadsheetTitle: string | null;
  telemetry: OperationalTelemetry;
  sanitizedDiagnosticMessage: string;
  isReadOnly: true;
}

export class OperationalHealthService {
  private static instance: OperationalHealthService | null = null;

  private constructor() {}

  public static getInstance(): OperationalHealthService {
    if (!OperationalHealthService.instance) {
      OperationalHealthService.instance = new OperationalHealthService();
    }
    return OperationalHealthService.instance;
  }

  /**
   * Evaluates operational connectivity to Google Sheets without mutating any data.
   */
  public async getOperationalHealth(): Promise<OperationalHealthReport> {
    const isConfigured = googleSheetsClient.isConfigured();
    const spreadsheetId = googleSheetsClient.getSpreadsheetId();
    const telemetry = googleSheetsClient.getOperationalTelemetry();

    if (!isConfigured) {
      return {
        generatedAt: new Date().toISOString(),
        isConfigured: false,
        isConnected: false,
        connectivityStatus: 'CONFIGURATION_ERROR',
        authStatus: 'MISSING_CREDENTIALS',
        spreadsheetAccessibility: 'NOT_CONFIGURED',
        mode: 'MOCK_DEVELOPMENT',
        spreadsheetId: '(Not Configured)',
        spreadsheetTitle: 'N/A (Unconfigured)',
        telemetry,
        sanitizedDiagnosticMessage:
          'Google Service Account environment variables are not set. Configure Google Service Account credentials to connect Google Sheets.',
        isReadOnly: true,
      };
    }

    try {
      const startTime = Date.now();
      const metadata = await googleSheetsClient.getSpreadsheetMetadata();
      const latencyMs = Date.now() - startTime;

      let connectivityStatus: ConnectivityStatus = 'CONNECTED';
      let message = `Successfully connected to Google Spreadsheet "${metadata.title}" (${metadata.sheetNames.length} tabs found). Latency: ${latencyMs}ms.`;

      // 5-minute recency window for assessing active vs. historical operational failures
      const RECENT_FAILURE_WINDOW_MS = 5 * 60 * 1000;
      const now = Date.now();
      const parsedFailureTime = telemetry.lastFailureTimestamp ? new Date(telemetry.lastFailureTimestamp).getTime() : 0;
      const failureTime = Number.isFinite(parsedFailureTime) ? parsedFailureTime : 0;
      const parsedSuccessTime = telemetry.lastSuccessTimestamp ? new Date(telemetry.lastSuccessTimestamp).getTime() : 0;
      const successTime = Number.isFinite(parsedSuccessTime) ? parsedSuccessTime : 0;

      // A transient failure degrades connectivity only if:
      // 1. It occurred within the recent time threshold, AND
      // 2. The failure is newer than the most recent successful operation (unresolved/unrecovered)
      const isRecentFailure = failureTime > 0 && (now - failureTime) < RECENT_FAILURE_WINDOW_MS;
      const isUnresolvedFailure = failureTime > successTime;

      if (telemetry.lastFailedOperation && isRecentFailure && isUnresolvedFailure) {
        connectivityStatus = 'DEGRADED';
        message += ` Note: Active transient issue detected in ${telemetry.lastFailedOperation}. Cumulative retries: ${telemetry.totalRetries}.`;
      }

      return {
        generatedAt: new Date().toISOString(),
        isConfigured: true,
        isConnected: true,
        connectivityStatus,
        authStatus: 'VALID',
        spreadsheetAccessibility: 'ACCESSIBLE',
        mode: 'LIVE_GOOGLE_SHEETS',
        spreadsheetId: sanitizeErrorMessage(spreadsheetId),
        spreadsheetTitle: metadata.title,
        telemetry: {
          ...telemetry,
          lastLatencyMs: latencyMs,
        },
        sanitizedDiagnosticMessage: message,
        isReadOnly: true,
      };
    } catch (err: any) {
      const errorMsg = sanitizeErrorMessage(err?.message || 'Connection check failed');
      const errName = err?.name || '';

      let authStatus: AuthStatus = 'INVALID_CREDENTIALS';
      let accessibility: SpreadsheetAccessibility = 'UNREACHABLE';

      if (errName === 'SpreadsheetNotFoundError') {
        accessibility = 'NOT_FOUND';
        authStatus = 'VALID';
      } else if (errName === 'GoogleAuthError') {
        if (errorMsg.includes('Permission Denied')) {
          authStatus = 'PERMISSION_DENIED';
          accessibility = 'PERMISSION_DENIED';
        } else {
          authStatus = 'INVALID_CREDENTIALS';
        }
      }

      return {
        generatedAt: new Date().toISOString(),
        isConfigured: true,
        isConnected: false,
        connectivityStatus: 'UNAVAILABLE',
        authStatus,
        spreadsheetAccessibility: accessibility,
        mode: 'LIVE_GOOGLE_SHEETS',
        spreadsheetId: sanitizeErrorMessage(spreadsheetId),
        spreadsheetTitle: null,
        telemetry,
        sanitizedDiagnosticMessage: `Failed to access Google Sheets: ${errorMsg}`,
        isReadOnly: true,
      };
    }
  }
}

export const operationalHealthService = OperationalHealthService.getInstance();
