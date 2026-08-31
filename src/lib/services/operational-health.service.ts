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
        spreadsheetTitle: 'N/A (Local Mock Development)',
        telemetry,
        sanitizedDiagnosticMessage:
          'Google Service Account environment variables are not set. Application is running in explicit Mock Development Mode with local repositories.',
        isReadOnly: true,
      };
    }

    try {
      const startTime = Date.now();
      const metadata = await googleSheetsClient.getSpreadsheetMetadata();
      const latencyMs = Date.now() - startTime;

      let connectivityStatus: ConnectivityStatus = 'CONNECTED';
      let message = `Successfully connected to Google Spreadsheet "${metadata.title}" (${metadata.sheetNames.length} tabs found). Latency: ${latencyMs}ms.`;

      if (telemetry.lastFailedOperation && telemetry.totalRetries > 0) {
        connectivityStatus = 'DEGRADED';
        message += ` Note: ${telemetry.totalRetries} retries were recorded recently.`;
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
