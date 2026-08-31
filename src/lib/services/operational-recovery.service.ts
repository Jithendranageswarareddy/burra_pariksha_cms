/**
 * BURRA PARIKSHA CMS - Operational Recovery Service
 * Phase 8B: Operational Reliability, Recovery & Production Hardening
 * 
 * Provides safe, administrative diagnostic workflows and audited recovery operations.
 * 
 * SAFETY RULES:
 * 1. Read-only diagnostics are prioritized by default.
 * 2. Any mutating administrative recovery requires explicit confirmation (`confirmed === true`).
 * 3. Shows previous and proposed new values.
 * 4. Logs audited operational event with sanitized payloads.
 * 5. Never deletes or clears worksheets, never rewrites schemas.
 */

import { operationalHealthService, OperationalHealthReport } from './operational-health.service';
import { sequenceSafetyService, SequenceSafetyReport } from './sequence-safety.service';
import { dataIntegrityService } from './data-integrity.service';
import { sequencesRepository } from '../repositories/sequences.repository';
import { auditService } from './audit.service';
import { RecoveryOperationError, ValidationError } from '../google-sheets/errors';
import { SEQUENCE_ENTITIES, SequenceEntityType } from '../schemas/google-sheets-schema';

export interface RecoveryActionPlan {
  actionId: string;
  title: string;
  category: 'CONNECTIVITY' | 'SCHEMA' | 'SEQUENCE' | 'TAXONOMY' | 'RELATIONSHIP';
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
  sequenceSafety: SequenceSafetyReport;
  actionPlans: RecoveryActionPlan[];
  isReadOnly: true;
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
    const sequenceSafety = await sequenceSafetyService.auditSequences();
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
        description: 'Google Sheets credentials are not configured in environment variables.',
        manualSteps: [
          'Set GOOGLE_SHEETS_ID with your Google Spreadsheet ID.',
          'Set GOOGLE_SERVICE_ACCOUNT_EMAIL with your service account email.',
          'Set GOOGLE_PRIVATE_KEY with the RSA private key from your service account JSON.',
          'Ensure the spreadsheet is shared with the service account email as Editor.',
        ],
      });
    } else if (!connectivity.isConnected) {
      actionPlans.push({
        actionId: 'ACT-CONNECTIVITY-RETRY',
        title: 'Resolve Google Sheets Accessibility Outage',
        category: 'CONNECTIVITY',
        severity: 'CRITICAL',
        isAutomatedSupported: false,
        requiresExplicitConfirmation: false,
        description: connectivity.sanitizedDiagnosticMessage,
        manualSteps: [
          'Verify that the Google Spreadsheet exists and is not in trash.',
          'Check that the service account has Editor permissions on the spreadsheet.',
          'Verify that the Google Sheets API is enabled in your Google Cloud Console.',
          'Check Google Workspace status for any ongoing Google API service disruptions.',
        ],
      });
    }

    // 2. Sequence safety remediation action plans
    for (const anomaly of sequenceSafety.anomalies) {
      const isSequenceDrift = anomaly.anomalyType === 'SEQUENCE_BEHIND_MAX_ID';
      const proposed = anomaly.detectedMaxAllocatedId !== null ? anomaly.detectedMaxAllocatedId + 1 : null;

      actionPlans.push({
        actionId: `ACT-SEQ-${anomaly.entityType}-${anomaly.anomalyType}`,
        title: `Remediate Sequence ${anomaly.entityType} (${anomaly.anomalyType})`,
        category: 'SEQUENCE',
        severity: anomaly.severity,
        isAutomatedSupported: isSequenceDrift && proposed !== null,
        requiresExplicitConfirmation: true,
        previousValue: anomaly.currentNextNumber,
        proposedNewValue: proposed,
        description: anomaly.message,
        manualSteps: [
          `Open Google Sheets and switch to the SEQUENCES worksheet tab.`,
          `Find the row for entity_type "${anomaly.entityType}".`,
          `Set column next_number to ${proposed ?? 'the appropriate number'}.`,
          `Verify prefix is "${anomaly.expectedPrefix}" and pad_length is ${anomaly.expectedPadLength}.`,
        ],
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      connectivity,
      sequenceSafety,
      actionPlans,
      isReadOnly: true,
    };
  }

  /**
   * Safely synchronizes a drifted sequence's next_number to a verified safe value
   * with explicit confirmation and mandatory audit logging.
   */
  public async synchronizeSequence(
    entityType: SequenceEntityType,
    proposedNextNumber: number,
    actor: { id: string; name: string },
    confirmed: boolean
  ): Promise<{
    success: boolean;
    entityType: string;
    previousNextNumber: number;
    updatedNextNumber: number;
    auditLogId: string;
  }> {
    if (!confirmed) {
      throw new ValidationError(
        'Administrative sequence synchronization requires explicit confirmation (confirmed: true).'
      );
    }

    if (!Object.values(SEQUENCE_ENTITIES).includes(entityType)) {
      throw new ValidationError(`Unknown sequence entity type: "${entityType}".`);
    }

    if (!proposedNextNumber || proposedNextNumber <= 0 || !Number.isInteger(proposedNextNumber)) {
      throw new ValidationError(`Proposed next_number (${proposedNextNumber}) must be a positive integer.`);
    }

    // Read current value
    const existingSeq = await sequencesRepository.getSequence(entityType);
    const prevNextNum = existingSeq ? Number(existingSeq.nextNumber) : 1;

    // Verify proposed is >= highest allocated ID
    const maxAllocated = await sequenceSafetyService.getMaxAllocatedIdForEntity(entityType);
    if (proposedNextNumber <= maxAllocated) {
      throw new RecoveryOperationError(
        `Cannot set next_number for "${entityType}" to ${proposedNextNumber}: it is <= max allocated ID (${maxAllocated}) in database.`
      );
    }

    try {
      if (existingSeq) {
        await sequencesRepository.updateRecord(entityType, {
          nextNumber: proposedNextNumber,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await sequencesRepository.appendRecord({
          entityType,
          nextNumber: proposedNextNumber,
          prefix: 'BP-',
          padLength: 6,
          updatedAt: new Date().toISOString(),
        });
      }

      // Log operational audit trail
      const auditLog = await auditService.logOperationalEvent(
        'ADMIN_SYNCHRONIZE_SEQUENCE',
        'RECOVERY',
        {
          entityType,
          previousNextNumber: prevNextNum,
          updatedNextNumber: proposedNextNumber,
          detectedMaxAllocatedId: maxAllocated,
          reason: 'Manual administrative recovery for sequence synchronization',
        },
        actor
      );

      return {
        success: true,
        entityType,
        previousNextNumber: prevNextNum,
        updatedNextNumber: proposedNextNumber,
        auditLogId: auditLog.id,
      };
    } catch (err: any) {
      throw new RecoveryOperationError(`Failed to synchronize sequence "${entityType}": ${err?.message || 'Error'}`);
    }
  }
}

export const operationalRecoveryService = OperationalRecoveryService.getInstance();
