/**
 * BURRA PARIKSHA CMS — System & Health Contracts
 * Diagnostic telemetry, operational health, and recovery plans
 */

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

export interface RecoveryActionPlan {
  actionId: string;
  title: string;
  category: 'CONNECTIVITY' | 'SCHEMA' | 'TAXONOMY' | 'RELATIONSHIP';
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  isAutomatedSupported: boolean;
  requiresExplicitConfirmation: boolean;
  previousValue?: string | number | null;
  proposedNewValue?: string | number | null;
  manualSteps: string[];
  description: string;
}

export interface OperationalRecoveryState {
  generatedAt: string;
  connectivity: OperationalHealthReport;
  actionPlans: RecoveryActionPlan[];
  isReadOnly: boolean;
}

export interface TabVerificationResult {
  tabName: string;
  exists: boolean;
  hasHeaders: boolean;
  actualHeaders: string[];
  missingHeaders: string[];
  duplicateHeaders: string[];
  status: 'VALID' | 'MISSING_TAB' | 'MISSING_HEADERS' | 'DUPLICATE_HEADERS';
  manualFixGuidance?: string;
}

export interface SpreadsheetHealthReport {
  isConfigured: boolean;
  isConnected: boolean;
  mode: 'LIVE_GOOGLE_SHEETS' | 'UNCONFIGURED';
  spreadsheetId: string;
  spreadsheetTitle: string;
  totalTabsExpected: number;
  totalTabsFound: number;
  tabs: TabVerificationResult[];
  taxonomyIntegrity: {
    isValid: boolean;
    issues: string[];
  };
  overallStatus: 'READY' | 'WARNING' | 'ERROR';
  summaryMessage: string;
  diagnosticActionItems: string[];
}

export interface SystemHealthReport {
  generatedAt?: string;
  overallStatus?: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' | string;
  summary?: string;
  worksheetHealth?: any[];
  integrityChecks?: any[];
  issueCounts?: {
    critical: number;
    error: number;
    warning: number;
    info: number;
    total: number;
    passedChecks?: number;
  };
  issues?: any[];
  isReadOnly?: boolean;
  mode?: 'CLOUD_FIRESTORE' | 'LIVE_GOOGLE_SHEETS' | 'UNCONFIGURED' | string;
  status?: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | string;
  timestamp?: string;
  version?: string;
  uptimeSeconds?: number;
  components?: Record<string, { status: string; message?: string }>;
}

