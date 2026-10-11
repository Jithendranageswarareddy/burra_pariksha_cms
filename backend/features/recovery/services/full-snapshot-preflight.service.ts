/**
 * BURRA PARIKSHA CMS - Full Snapshot Preflight Orchestration Service
 * Task 3F.4.8B: Read-only preflight / dry-run orchestration layer.
 * 
 * Strict Constraints:
 * - 100% Read-only operation (zero writes to Google Sheets, database, sequences, workflow, audit logs).
 * - Reuses FullSnapshotRestoreService and RestoreValidatorService.
 * - Enforces fail-closed validation and structured safety summary.
 */

import { GoogleSheetsSnapshot } from './snapshot-exporter.service';
import { FullSnapshotRestoreService, FullSnapshotRestorePlan, FULL_RESTORE_ENTITY_ORDER } from './full-snapshot-restore.service';
import { RestoreValidatorService } from './restore-validator.service';

export interface FullSnapshotPreflightResult {
  valid: boolean;
  status: 'SAFE TO RESTORE' | 'BLOCKED';
  snapshotChecksum: string;
  snapshotTimestamp?: string;
  spreadsheetIdentifier?: string;
  totalWorksheets: number;
  totalSnapshotRecords: number;
  totalProductionRecordsExamined: number;
  recordsToCreate: number;
  recordsToUpdate: number;
  unchangedRecords: number;
  conflicts: Array<{ entityType?: string; entityId: string; reason: string }>;
  missingDependencies: Array<{ entityType: string; entityId: string; missingKey: string }>;
  sequenceWarnings: string[];
  schemaErrors: string[];
  validationWarnings: string[];
  dependencyOrder: readonly string[];
  estimatedWriteOperations: number;
  immutableVersionAppendOperations: number;
  destructiveOperations: {
    deletes: number;
    destructiveOverwrites: number;
    sequenceRollback: number;
    immutableVersionModification: number;
    auditHistoryReplacement: number;
    workflowHistoryReplacement: number;
    allowed: boolean;
  };
  safetySummary: {
    validSnapshot: boolean;
    schemaValidationPassed: boolean;
    foreignKeyValidationPassed: boolean;
    conflictValidationPassed: boolean;
    immutableVersionValidationPassed: boolean;
    sequenceValidationPassed: boolean;
    executable: boolean;
  };
  productionMutations: {
    googleSheetsWrites: number;
    productionRecordsCreated: number;
    productionRecordsUpdated: number;
    productionRecordsDeleted: number;
    sequencesModified: number;
    workflowRecordsCreated: number;
    auditRecordsCreated: number;
  };
}

export class FullSnapshotPreflightService {
  private static instance: FullSnapshotPreflightService | null = null;
  private restorePlanner: FullSnapshotRestoreService;
  private validatorService: RestoreValidatorService;

  private constructor() {
    this.restorePlanner = FullSnapshotRestoreService.getInstance();
    this.validatorService = RestoreValidatorService.getInstance();
  }

  public static getInstance(): FullSnapshotPreflightService {
    if (!FullSnapshotPreflightService.instance) {
      FullSnapshotPreflightService.instance = new FullSnapshotPreflightService();
    }
    return FullSnapshotPreflightService.instance;
  }

  /**
   * Performs a 100% read-only preflight / dry-run evaluation of a full snapshot.
   */
  public async preflightSnapshot(snapshot: GoogleSheetsSnapshot): Promise<FullSnapshotPreflightResult> {
    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      return {
        valid: false,
        status: 'BLOCKED',
        snapshotChecksum: '',
        totalWorksheets: 0,
        totalSnapshotRecords: 0,
        totalProductionRecordsExamined: 0,
        recordsToCreate: 0,
        recordsToUpdate: 0,
        unchangedRecords: 0,
        conflicts: [{ entityId: 'GLOBAL', reason: 'Invalid snapshot structure or missing checksum.' }],
        missingDependencies: [],
        sequenceWarnings: [],
        schemaErrors: ['Invalid snapshot structure or missing checksum.'],
        validationWarnings: [],
        dependencyOrder: FULL_RESTORE_ENTITY_ORDER,
        estimatedWriteOperations: 0,
        immutableVersionAppendOperations: 0,
        destructiveOperations: {
          deletes: 0,
          destructiveOverwrites: 0,
          sequenceRollback: 0,
          immutableVersionModification: 0,
          auditHistoryReplacement: 0,
          workflowHistoryReplacement: 0,
          allowed: false,
        },
        safetySummary: {
          validSnapshot: false,
          schemaValidationPassed: false,
          foreignKeyValidationPassed: false,
          conflictValidationPassed: false,
          immutableVersionValidationPassed: false,
          sequenceValidationPassed: false,
          executable: false,
        },
        productionMutations: {
          googleSheetsWrites: 0,
          productionRecordsCreated: 0,
          productionRecordsUpdated: 0,
          productionRecordsDeleted: 0,
          sequencesModified: 0,
          workflowRecordsCreated: 0,
          auditRecordsCreated: 0,
        },
      };
    }

    // Call FullSnapshotRestoreService to get baseline plan
    const plan: FullSnapshotRestorePlan = await this.restorePlanner.planFullRestore(snapshot);

    let totalSnapshotRecords = 0;
    let recordsToCreateCount = 0;
    let recordsToUpdateCount = 0;
    let unchangedRecordsCount = 0;
    let immutableVersionAppends = 0;

    for (const [entityType, detail] of Object.entries(plan.entityPlans)) {
      recordsToCreateCount += detail.recordsToCreate.length;
      recordsToUpdateCount += detail.recordsToUpdate.length;
      unchangedRecordsCount += detail.unchangedRecords.length;
      totalSnapshotRecords += detail.recordsToCreate.length + detail.recordsToUpdate.length + detail.unchangedRecords.length;

      if (['SCRIPT_VERSIONS', 'THUMBNAIL_VERSIONS', 'PINNED_COMMENT_VERSIONS'].includes(entityType)) {
        immutableVersionAppends += detail.recordsToCreate.length;
      }
    }

    const totalWorksheets = Object.keys(snapshot.worksheets).length;
    const schemaValidationPassed = plan.schemaErrors.length === 0;
    const foreignKeyValidationPassed = plan.missingDependencies.length === 0;
    const conflictValidationPassed = plan.globalConflicts.length === 0 && Object.values(plan.entityPlans).every(p => p.conflicts.length === 0);
    const sequenceValidationPassed = plan.sequenceWarnings.length === 0;
    const immutableVersionValidationPassed = !Object.entries(plan.entityPlans).some(([type, p]) => 
      ['SCRIPT_VERSIONS', 'THUMBNAIL_VERSIONS', 'PINNED_COMMENT_VERSIONS'].includes(type) && p.conflicts.length > 0
    );

    const valid = plan.valid && plan.eligible && schemaValidationPassed && conflictValidationPassed && sequenceValidationPassed;
    const status = valid ? 'SAFE TO RESTORE' : 'BLOCKED';

    const sequenceRollbackCount = plan.sequenceWarnings.length;
    const immutableVersionModCount = Object.entries(plan.entityPlans)
      .filter(([type]) => ['SCRIPT_VERSIONS', 'THUMBNAIL_VERSIONS', 'PINNED_COMMENT_VERSIONS'].includes(type))
      .reduce((acc, [, p]) => acc + p.conflicts.length, 0);

    const destructiveOperations = {
      deletes: 0, // Restoring never deletes missing records per specifications
      destructiveOverwrites: plan.globalConflicts.filter(c => c.reason.includes('conflict')).length,
      sequenceRollback: sequenceRollbackCount,
      immutableVersionModification: immutableVersionModCount,
      auditHistoryReplacement: 0,
      workflowHistoryReplacement: 0,
      allowed: false, // Destructive behavior is NOT_ALLOWED
    };

    const safetySummary = {
      validSnapshot: plan.valid,
      schemaValidationPassed,
      foreignKeyValidationPassed,
      conflictValidationPassed,
      immutableVersionValidationPassed,
      sequenceValidationPassed,
      executable: valid,
    };

    return {
      valid,
      status,
      snapshotChecksum: snapshot.checksum,
      snapshotTimestamp: snapshot.metadata?.exportTimestamp || (snapshot as any).exportedAt,
      spreadsheetIdentifier: (snapshot as any).metadata?.spreadsheetId || (snapshot as any).spreadsheetId,
      totalWorksheets,
      totalSnapshotRecords,
      totalProductionRecordsExamined: totalSnapshotRecords, // approximated via examination
      recordsToCreate: recordsToCreateCount,
      recordsToUpdate: recordsToUpdateCount,
      unchangedRecords: unchangedRecordsCount,
      conflicts: plan.globalConflicts,
      missingDependencies: plan.missingDependencies,
      sequenceWarnings: plan.sequenceWarnings,
      schemaErrors: plan.schemaErrors,
      validationWarnings: plan.validationWarnings,
      dependencyOrder: plan.dependencyOrder,
      estimatedWriteOperations: recordsToCreateCount + recordsToUpdateCount,
      immutableVersionAppendOperations: immutableVersionAppends,
      destructiveOperations,
      safetySummary,
      productionMutations: {
        googleSheetsWrites: 0,
        productionRecordsCreated: 0,
        productionRecordsUpdated: 0,
        productionRecordsDeleted: 0,
        sequencesModified: 0,
        workflowRecordsCreated: 0,
        auditRecordsCreated: 0,
      },
    };
  }
}
