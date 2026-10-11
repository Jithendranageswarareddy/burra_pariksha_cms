/**
 * BURRA PARIKSHA CMS - Operational Recovery Service
 * Phase 8B: Operational Reliability, Recovery & Production Hardening
 * Sprint 6: Zero Sequence Architecture
 * 
 * Provides safe, administrative diagnostic workflows and audited recovery operations.
 * Focuses on genuine infrastructure: Cloud Firestore connectivity, auth credentials,
 * data integrity, and system health.
 */

import { operationalHealthService, OperationalHealthReport } from './operational-health.service';
import { auditService } from './audit.service';

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

export class OperationalRecoveryService {
  private static instance: OperationalRecoveryService | null = null;

  private constructor() {}

  public static getInstance(): OperationalRecoveryService {
    if (!OperationalRecoveryService.instance) {
      OperationalRecoveryService.instance = new OperationalRecoveryService();
    }
    return OperationalRecoveryService.instance;
  }

  /**
   * Compiles comprehensive operational state and structured remediation action plans.
   */
  public async getRecoveryState(): Promise<OperationalRecoveryState> {
    const connectivity = await operationalHealthService.getOperationalHealth();
    const actionPlans: RecoveryActionPlan[] = [];

    // 1. Connectivity remediation action plans
    if (!connectivity.isConfigured) {
      actionPlans.push({
        actionId: 'ACT-CONFIG-ENV',
        title: 'Configure Google Service Account Credentials',
        category: 'CONNECTIVITY',
        severity: 'WARNING',
        isAutomatedSupported: false,
        requiresExplicitConfirmation: false,
        description: 'Firebase Admin SDK credentials are not configured in environment variables.',
        manualSteps: [
          'Set GOOGLE_SERVICE_ACCOUNT_EMAIL with your service account email.',
          'Set GOOGLE_PRIVATE_KEY with the RSA private key from your service account JSON.',
          'Ensure the service account has Cloud Datastore User / Firestore permissions.',
        ],
      });
    } else if (!connectivity.isConnected) {
      actionPlans.push({
        actionId: 'ACT-CONNECTIVITY-RETRY',
        title: 'Resolve Cloud Firestore Connectivity Outage',
        category: 'CONNECTIVITY',
        severity: 'CRITICAL',
        isAutomatedSupported: false,
        requiresExplicitConfirmation: false,
        description: connectivity.sanitizedDiagnosticMessage,
        manualSteps: [
          'Verify that Cloud Firestore database exists and is enabled in the Google Cloud project.',
          'Check that the service account has Cloud Datastore User permissions.',
          'Verify that the Firestore API is enabled in your Google Cloud Console.',
          'Check Google Cloud status for any ongoing service disruptions.',
        ],
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      connectivity,
      actionPlans,
      isReadOnly: true,
    };
  }
}

export const operationalRecoveryService = OperationalRecoveryService.getInstance();
