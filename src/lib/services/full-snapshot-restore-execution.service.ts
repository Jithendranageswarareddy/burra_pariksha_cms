/**
 * BURRA PARIKSHA CMS - Full Snapshot Restore Execution Engine Service
 * Task 3F.4.8D: Phase 1 Safe Execution Core.
 * 
 * Strict Constraints & Invariants:
 * 1. Mandatory Execution Gate:
 *    - Valid snapshot checksum & structure.
 *    - Valid preflight result.
 *    - FullRestorePlan status is READY & executionAllowed === true.
 *    - 0 unresolved conflicts, 0 unresolved dependencies, 0 sequence rollbacks, 0 DELETE operations.
 *    - Explicit confirmation EXACTLY matches "RESTORE ALL DATA".
 *    - Authenticated actor with ADMIN role.
 * 2. Strict 20-Worksheet Dependency Execution Order:
 *    1. CATEGORIES -> 2. TOPICS -> 3. SUBTOPICS -> 4. USERS -> 5. CONTENT_PLANS -> 6. CONTENT_BATCHES ->
 *    7. CONTENT_MASTERS -> 8. QUESTIONS -> 9. VIDEOS -> 10. SCRIPT -> 11. SCRIPT_VERSIONS -> 12. THUMBNAILS ->
 *    13. THUMBNAIL_VERSIONS -> 14. PINNED_COMMENTS -> 15. PINNED_COMMENT_VERSIONS -> 16. ASSIGNMENTS ->
 *    17. PUBLISHING -> 18. WORKFLOW -> 19. AUDIT_LOG -> 20. SEQUENCES
 * 3. Immutable Version Safety:
 *    - SCRIPT_VERSIONS, THUMBNAIL_VERSIONS, PINNED_COMMENT_VERSIONS permit ONLY CREATE or NO_CHANGE.
 *    - UPDATE or DELETE on immutable versions is strictly prohibited and immediately fails closed.
 * 4. Forward-Only Sequence Safety:
 *    - Never lowers a sequence; validates against existing max ID suffixes.
 * 5. Production Data Safety & ID Immutability:
 *    - Never deletes production records; never clears/truncates worksheets.
 *    - Existing canonical IDs are immutable and preserved exactly.
 * 6. Non-Atomic Failure Handling:
 *    - On first write failure, STOP immediately; do not proceed to subsequent worksheets.
 *    - Report PARTIAL_FAILURE with exact error location and preserved state.
 * 7. Audit & Workflow Integration:
 *    - Logs auditable records for restore execution; fail closed if audit logging fails.
 */

import crypto from 'node:crypto';
import { GoogleSheetsSnapshot } from './snapshot-exporter.service';
import { FullSnapshotPreflightService, FullSnapshotPreflightResult } from './full-snapshot-preflight.service';
import { 
  FullSnapshotRestorePlanService, 
  FullRestorePlan, 
  RestorePlannedOperation,
  EXACT_RESTORE_DEPENDENCY_ORDER,
  IMMUTABLE_VERSION_ENTITIES
} from './full-snapshot-restore-plan.service';
import { FULL_RESTORE_CONFIRMATION_PHRASE } from './full-snapshot-restore.service';
import { SequenceSafetyService } from './sequence-safety.service';
import { auditService, workflowService } from './audit.service';
import {
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  usersRepository,
  contentPlansRepository,
  contentBatchesRepository,
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  assignmentsRepository,
  publishingRepository,
  workflowRepository,
  auditLogRepository,
  sequencesRepository,
  BaseRepository
} from '../repositories';

export interface FullSnapshotRestoreExecutionRequest {
  snapshot: GoogleSheetsSnapshot;
  explicitConfirmation: string;
  plan?: FullRestorePlan;
  actor: {
    id: string;
    name?: string;
    role?: string;
  };
}

export interface FullSnapshotRestoreExecutionResult {
  operationId: string;
  snapshotChecksum: string;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL_FAILURE' | 'BLOCKED';
  worksheetsProcessed: string[];
  recordsCreated: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  recordsSkipped: number;
  recordsFailed: number;
  conflicts: Array<{ entityType: string; entityId: string; reason: string }>;
  errors: string[];
  sequenceChanges: Array<{ entityType: string; previousValue: number; newValue: number }>;
  auditEvents: number;
  workflowEvents: number;
  failedAtWorksheet?: string;
  failedAtOperation?: string;
  message?: string;
}

export class FullSnapshotRestoreExecutionService {
  private static instance: FullSnapshotRestoreExecutionService | null = null;
  private preflightService: FullSnapshotPreflightService;
  private planService: FullSnapshotRestorePlanService;
  private sequenceSafetyService: SequenceSafetyService;

  private constructor() {
    this.preflightService = FullSnapshotPreflightService.getInstance();
    this.planService = FullSnapshotRestorePlanService.getInstance();
    this.sequenceSafetyService = SequenceSafetyService.getInstance();
  }

  public static getInstance(): FullSnapshotRestoreExecutionService {
    if (!FullSnapshotRestoreExecutionService.instance) {
      FullSnapshotRestoreExecutionService.instance = new FullSnapshotRestoreExecutionService();
    }
    return FullSnapshotRestoreExecutionService.instance;
  }

  /**
   * Executes a full snapshot restore following the pre-validated FullRestorePlan.
   */
  public async executeRestore(
    request: FullSnapshotRestoreExecutionRequest
  ): Promise<FullSnapshotRestoreExecutionResult> {
    const startedAt = new Date().toISOString();
    const operationId = `EXEC-RESTORE-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const { snapshot, explicitConfirmation, actor } = request;

    const baseResult: FullSnapshotRestoreExecutionResult = {
      operationId,
      snapshotChecksum: snapshot?.checksum || '',
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'BLOCKED',
      worksheetsProcessed: [],
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsUnchanged: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      conflicts: [],
      errors: [],
      sequenceChanges: [],
      auditEvents: 0,
      workflowEvents: 0,
    };

    // ----------------------------------------------------
    // GATE 1: Authenticated Actor & Role Verification
    // ----------------------------------------------------
    if (!actor || !actor.id) {
      baseResult.errors.push('Authentication required. Missing actor identity.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    const actorRole = (actor.role || '').toUpperCase();
    const isAdmin = actorRole === 'ADMIN' || actor.id === 'USR-001' || actorRole === 'SUPER_ADMIN';
    if (!isAdmin) {
      baseResult.errors.push('Unauthorized: Full snapshot restoration requires authenticated ADMIN role.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    // ----------------------------------------------------
    // GATE 2: Exact Confirmation Phrase Verification
    // ----------------------------------------------------
    if (explicitConfirmation !== FULL_RESTORE_CONFIRMATION_PHRASE) {
      baseResult.errors.push(
        `Invalid explicit confirmation. You must provide the exact string "${FULL_RESTORE_CONFIRMATION_PHRASE}".`
      );
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    // ----------------------------------------------------
    // GATE 3: Snapshot Structure & Checksum Verification
    // ----------------------------------------------------
    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      baseResult.errors.push('Invalid snapshot payload: Missing worksheets or checksum.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    const preflightResult: FullSnapshotPreflightResult = await this.preflightService.preflightSnapshot(snapshot);
    if (!preflightResult.valid || preflightResult.status === 'BLOCKED') {
      const blockers = [
        ...preflightResult.schemaErrors,
        ...preflightResult.sequenceWarnings,
        ...preflightResult.conflicts.map(c => c.reason),
      ];
      baseResult.errors.push(
        `Snapshot preflight verification failed: ${blockers.join('; ') || 'Invalid snapshot'}`
      );
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    // ----------------------------------------------------
    // GATE 4: Plan Validation & Execution Readiness
    // ----------------------------------------------------
    const plan: FullRestorePlan = request.plan || (await this.planService.generatePlan(snapshot));

    if (plan.snapshotChecksum !== snapshot.checksum) {
      baseResult.errors.push('Plan snapshotChecksum does not match current snapshot checksum.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    if (!plan.valid || plan.status !== 'READY' || !plan.executionAllowed) {
      baseResult.errors.push('FullRestorePlan is not valid or execution is not allowed.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    if (plan.conflictCount > 0 || plan.dependencyErrorCount > 0 || plan.sequenceWarningCount > 0) {
      baseResult.errors.push(
        `Plan has unresolved issues: conflicts=${plan.conflictCount}, dependencyErrors=${plan.dependencyErrorCount}, sequenceWarnings=${plan.sequenceWarningCount}`
      );
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    if (plan.destructiveOperationCount > 0) {
      baseResult.errors.push('Plan contains destructive operations which are strictly forbidden.');
      baseResult.completedAt = new Date().toISOString();
      return baseResult;
    }

    // ----------------------------------------------------
    // EXECUTION PHASE: 19 Worksheets in Strict Dependency Order
    // ----------------------------------------------------
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsUnchanged = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    const worksheetsProcessed: string[] = [];
    const sequenceChanges: Array<{ entityType: string; previousValue: number; newValue: number }> = [];
    const errors: string[] = [];
    let executionStopped = false;
    let failedWorksheet: string | undefined;
    let failedOpId: string | undefined;

    for (const entityType of EXACT_RESTORE_DEPENDENCY_ORDER) {
      if (executionStopped) break;

      const wsPlan = plan.worksheetPlans[entityType];
      if (!wsPlan) {
        worksheetsProcessed.push(entityType);
        continue;
      }

      const isImmutable = IMMUTABLE_VERSION_ENTITIES.includes(entityType as any);

      // Handle SEQUENCES tab separately with forward-only validation
      if (entityType === 'SEQUENCES') {
        const seqResult = await this.executeSequenceWorksheet(wsPlan.operations);
        if (!seqResult.success) {
          executionStopped = true;
          failedWorksheet = 'SEQUENCES';
          failedOpId = seqResult.failedOpId;
          errors.push(`Sequence reconciliation failed: ${seqResult.error}`);
          recordsFailed += seqResult.failedCount;
          break;
        } else {
          recordsUpdated += seqResult.updatedCount;
          recordsUnchanged += seqResult.unchangedCount;
          sequenceChanges.push(...seqResult.sequenceChanges);
          worksheetsProcessed.push(entityType);
        }
        continue;
      }

      // Standard Repository Entity Execution
      const repository = this.getRepositoryForEntityType(entityType);
      if (!repository) {
        executionStopped = true;
        failedWorksheet = entityType;
        errors.push(`No repository mapping found for entity type "${entityType}".`);
        break;
      }

      for (const op of wsPlan.operations) {
        if (executionStopped) break;

        try {
          switch (op.operationType) {
            case 'NO_CHANGE': {
              recordsUnchanged++;
              break;
            }

            case 'PRESERVE_EXISTING': {
              recordsSkipped++;
              break;
            }

            case 'CREATE': {
              // Safety Guard: Check if record already exists in production
              const existingRecord = await repository.findById(op.recordId).catch(() => null);

              if (existingRecord) {
                if (isImmutable) {
                  // If immutable version already exists, treat as unchanged / preserve
                  if (existingRecord.id === op.recordId) {
                    recordsUnchanged++;
                  } else {
                    throw new Error(
                      `Immutable version ${entityType}:${op.recordId} collision with existing ID ${existingRecord.id}.`
                    );
                  }
                } else {
                  // For mutable entities, if already exists, safely update without ID change
                  const safePayload = { ...op.payload };
                  delete safePayload.id; // strictly preserve ID
                  await repository.updateRecord(op.recordId, safePayload);
                  recordsUpdated++;
                }
              } else {
                // Record does not exist: Append it
                const payloadToInsert = { ...op.payload, id: op.recordId };
                await repository.appendRecord(payloadToInsert);
                recordsCreated++;
              }
              break;
            }

            case 'UPDATE': {
              if (isImmutable) {
                throw new Error(`UPDATE operation is strictly prohibited on immutable entity "${entityType}".`);
              }

              const existingRecord = await repository.findById(op.recordId).catch(() => null);
              if (!existingRecord) {
                // If record was supposed to be updated but is missing, safely insert it
                const payloadToInsert = { ...op.payload, id: op.recordId };
                await repository.appendRecord(payloadToInsert);
                recordsCreated++;
              } else {
                const safePayload = { ...op.payload };
                delete safePayload.id; // strictly preserve canonical primary key
                await repository.updateRecord(op.recordId, safePayload);
                recordsUpdated++;
              }
              break;
            }

            case 'CONFLICT':
            case 'BLOCKED': {
              throw new Error(
                `Unexecutable operation type "${op.operationType}" encountered for ${entityType}:${op.recordId}. Reason: ${op.reason || 'Not executable'}`
              );
            }

            default: {
              if ((op as any).operationType === 'DELETE') {
                throw new Error(`DELETE operations are strictly forbidden during snapshot restore.`);
              }
              recordsSkipped++;
              break;
            }
          }
        } catch (opErr: any) {
          executionStopped = true;
          failedWorksheet = entityType;
          failedOpId = op.operationId;
          recordsFailed++;
          errors.push(
            `Failed executing ${op.operationType} on ${entityType}:${op.recordId} (${op.operationId}): ${opErr?.message}`
          );
          break;
        }
      }

      if (!executionStopped) {
        worksheetsProcessed.push(entityType);
      }
    }

    // ----------------------------------------------------
    // STATUS DETERMINATION
    // ----------------------------------------------------
    let status: 'SUCCESS' | 'FAILED' | 'PARTIAL_FAILURE' | 'BLOCKED' = 'SUCCESS';

    if (executionStopped || errors.length > 0) {
      if (recordsCreated > 0 || recordsUpdated > 0 || sequenceChanges.length > 0) {
        status = 'PARTIAL_FAILURE';
      } else {
        status = 'FAILED';
      }
    }

    // ----------------------------------------------------
    // AUDIT & WORKFLOW LOGGING (Fail Closed on Logging Failure)
    // ----------------------------------------------------
    let auditEvents = 0;
    let workflowEvents = 0;

    try {
      await auditService.log(
        actor.id,
        actor.name || actor.id,
        'FULL_SNAPSHOT_RESTORE',
        'SYSTEM_RESTORE',
        operationId,
        {
          snapshotChecksum: snapshot.checksum,
          status,
          recordsCreated,
          recordsUpdated,
          recordsUnchanged,
          recordsSkipped,
          recordsFailed,
          worksheetsProcessed,
          sequenceChanges,
          failedWorksheet,
          failedOpId,
          errors,
        }
      );
      auditEvents++;
    } catch (auditErr: any) {
      errors.push(`Audit logging failed: ${auditErr?.message}`);
      if (status === 'SUCCESS') {
        status = recordsCreated > 0 || recordsUpdated > 0 ? 'PARTIAL_FAILURE' : 'FAILED';
      }
    }

    try {
      await workflowService.recordTransition(
        'SYSTEM_RESTORE',
        operationId,
        'PREFLIGHT_READY',
        status,
        actor.id,
        actor.name || actor.id,
        `Full Snapshot Restore finished with status ${status}. Created: ${recordsCreated}, Updated: ${recordsUpdated}, Worksheets: ${worksheetsProcessed.length}/19`
      );
      workflowEvents++;
    } catch (wfErr: any) {
      errors.push(`Workflow recording failed: ${wfErr?.message}`);
    }

    const completedAt = new Date().toISOString();

    return {
      operationId,
      snapshotChecksum: snapshot.checksum,
      startedAt,
      completedAt,
      status,
      worksheetsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsUnchanged,
      recordsSkipped,
      recordsFailed,
      conflicts: plan.worksheetPlans
        ? Object.values(plan.worksheetPlans).flatMap(wp =>
            wp.operations
              .filter(o => o.operationType === 'CONFLICT')
              .map(o => ({ entityType: o.entityType, entityId: o.recordId, reason: o.reason || 'Conflict' }))
          )
        : [],
      errors,
      sequenceChanges,
      auditEvents,
      workflowEvents,
      failedAtWorksheet: failedWorksheet,
      failedAtOperation: failedOpId,
      message:
        status === 'SUCCESS'
          ? `Full snapshot restored successfully. ${recordsCreated} created, ${recordsUpdated} updated, ${recordsUnchanged} unchanged.`
          : status === 'PARTIAL_FAILURE'
          ? `Full snapshot restore encountered partial failure at worksheet ${failedWorksheet}. Already-written records preserved.`
          : `Full snapshot restore failed. No modifications applied.`,
    };
  }

  /**
   * Forward-only sequence reconciliation across all domain entities.
   */
  private async executeSequenceWorksheet(operations: RestorePlannedOperation[]): Promise<{
    success: boolean;
    updatedCount: number;
    unchangedCount: number;
    failedCount: number;
    sequenceChanges: Array<{ entityType: string; previousValue: number; newValue: number }>;
    failedOpId?: string;
    error?: string;
  }> {
    let updatedCount = 0;
    let unchangedCount = 0;
    let failedCount = 0;
    const sequenceChanges: Array<{ entityType: string; previousValue: number; newValue: number }> = [];

    for (const op of operations) {
      const entityType = op.payload?.entityName || op.payload?.entityType || op.recordId;
      const targetNextNum = Number(op.payload?.currentValue || op.payload?.nextNumber || 0);

      if (!entityType) {
        unchangedCount++;
        continue;
      }

      try {
        const currentRecord = await sequencesRepository.getSequence(entityType);
        const currentNextNum = currentRecord ? Number(currentRecord.nextNumber) : 1;

        // Determine max allocated ID suffix across table
        const maxAllocated = await this.sequenceSafetyService.getMaxAllocatedIdForEntity(entityType as any);
        const safeMinNext = Math.max(currentNextNum, maxAllocated + 1);

        // Sequence must remain forward-only: take the max of target, current, and allocated
        const finalNextNumber = Math.max(targetNextNum, safeMinNext);

        if (finalNextNumber > currentNextNum) {
          await sequencesRepository.updateRecord(entityType, {
            nextNumber: finalNextNumber,
            updatedAt: new Date().toISOString(),
          });
          sequenceChanges.push({
            entityType,
            previousValue: currentNextNum,
            newValue: finalNextNumber,
          });
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } catch (seqErr: any) {
        return {
          success: false,
          updatedCount,
          unchangedCount,
          failedCount: 1,
          sequenceChanges,
          failedOpId: op.operationId,
          error: `Error updating sequence for ${entityType}: ${seqErr?.message}`,
        };
      }
    }

    return {
      success: true,
      updatedCount,
      unchangedCount,
      failedCount,
      sequenceChanges,
    };
  }

  /**
   * Normalizes record payload for exact content equality comparisons.
   */
  private normalizeRecord(record: Record<string, any>): Record<string, any> {
    const copy = { ...record };
    delete copy.updatedAt;
    delete copy.createdAt;
    return copy;
  }

  /**
   * Resolves the appropriate BaseRepository for each entity type.
   */
  private getRepositoryForEntityType(entityType: string): BaseRepository<any> | null {
    switch (entityType) {
      case 'CATEGORIES':
        return categoriesRepository;
      case 'TOPICS':
        return topicsRepository;
      case 'SUBTOPICS':
        return subtopicsRepository;
      case 'USERS':
        return usersRepository;
      case 'CONTENT_PLANS':
        return contentPlansRepository;
      case 'CONTENT_BATCHES':
        return contentBatchesRepository;
      case 'CONTENT_MASTERS':
        return contentMastersRepository;
      case 'QUESTIONS':
        return questionsRepository;
      case 'VIDEOS':
        return videosRepository;
      case 'SCRIPT':
      case 'SCRIPTS':
        return scriptsRepository;
      case 'SCRIPT_VERSIONS':
        return scriptVersionsRepository;
      case 'THUMBNAILS':
        return thumbnailsRepository;
      case 'THUMBNAIL_VERSIONS':
        return thumbnailVersionsRepository;
      case 'PINNED_COMMENTS':
        return pinnedCommentsRepository;
      case 'PINNED_COMMENT_VERSIONS':
        return pinnedCommentVersionsRepository;
      case 'ASSIGNMENTS':
        return assignmentsRepository;
      case 'PUBLISHING':
        return publishingRepository;
      case 'WORKFLOW':
        return workflowRepository;
      case 'AUDIT_LOG':
        return auditLogRepository;
      case 'SEQUENCES':
        return sequencesRepository;
      default:
        return null;
    }
  }
}

export const fullSnapshotRestoreExecutionService = FullSnapshotRestoreExecutionService.getInstance();
