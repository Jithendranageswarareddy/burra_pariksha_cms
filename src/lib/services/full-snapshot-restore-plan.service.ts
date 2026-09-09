/**
 * BURRA PARIKSHA CMS - Full Snapshot Restore Plan Generator Service
 * Task 3F.4.8C: Deterministic Full Restore Plan Generator.
 * 
 * Strict Constraints:
 * - 100% Read-only operation (zero writes to Google Sheets, database, sequences, workflow, audit logs).
 * - Exact 19-worksheet dependency order:
 *   1. CATEGORIES -> 2. TOPICS -> 3. SUBTOPICS -> 4. USERS -> 5. CONTENT_PLANS -> 6. CONTENT_BATCHES ->
 *   7. QUESTIONS -> 8. VIDEOS -> 9. SCRIPT -> 10. SCRIPT_VERSIONS -> 11. THUMBNAILS -> 12. THUMBNAIL_VERSIONS ->
 *   13. PINNED_COMMENTS -> 14. PINNED_COMMENT_VERSIONS -> 15. ASSIGNMENTS -> 16. PUBLISHING -> 17. WORKFLOW ->
 *   18. AUDIT_LOG -> 19. SEQUENCES
 * - Immutable version protection for SCRIPT_VERSIONS, THUMBNAIL_VERSIONS, PINNED_COMMENT_VERSIONS (never UPDATE or DELETE).
 * - Forward-only sequence safety (never rollback).
 * - Destructive operations prohibited (never silent delete missing records).
 * - Deterministic planId computed from snapshotChecksum.
 */

import crypto from 'node:crypto';
import { GoogleSheetsSnapshot } from './snapshot-exporter.service';
import { FullSnapshotPreflightService, FullSnapshotPreflightResult } from './full-snapshot-preflight.service';
import { 
  FullSnapshotRestoreService, 
  FullSnapshotRestorePlan, 
  FULL_RESTORE_ENTITY_ORDER 
} from './full-snapshot-restore.service';
import { RestoreValidatorService } from './restore-validator.service';

export type RestoreOperationType = 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'CONFLICT' | 'BLOCKED' | 'PRESERVE_EXISTING';

export interface RestorePlannedOperation {
  operationId: string;
  operationType: RestoreOperationType;
  entityType: string;
  recordId: string;
  parentDependencies?: Array<{ entityType: string; recordId: string }>;
  payload?: Record<string, any>;
  existingProductionRecord?: Record<string, any>;
  reason?: string;
  blockingIssues?: string[];
  isImmutableVersion?: boolean;
}

export interface WorksheetRestorePlan {
  worksheet: string;
  order: number;
  dependencies: string[];
  totalRecords: number;
  operations: RestorePlannedOperation[];
  createCount: number;
  updateCount: number;
  unchangedCount: number;
  conflictCount: number;
  blockedCount: number;
  preservedExistingCount: number;
  blockingIssues: string[];
}

export interface FullRestorePlan {
  planId: string;
  snapshotChecksum: string;
  createdAt: string;
  valid: boolean;
  executionAllowed: boolean;
  status: 'READY' | 'BLOCKED';
  dependencyOrder: readonly string[];
  worksheetPlans: Record<string, WorksheetRestorePlan>;
  totalOperations: number;
  createCount: number;
  updateCount: number;
  unchangedCount: number;
  conflictCount: number;
  dependencyErrorCount: number;
  sequenceWarningCount: number;
  destructiveOperationCount: number;
  immutableVersionOperationCount: number;
  summary: {
    validSnapshot: boolean;
    schemaValidationPassed: boolean;
    foreignKeyValidationPassed: boolean;
    conflictValidationPassed: boolean;
    immutableVersionValidationPassed: boolean;
    sequenceValidationPassed: boolean;
    executable: boolean;
  };
  safetyGuarantees: {
    zeroGoogleSheetsWrites: boolean;
    zeroProductionMutations: boolean;
    noDestructiveDeletions: boolean;
    forwardOnlySequences: boolean;
    immutableHistoryPreserved: boolean;
  };
}

export const EXACT_RESTORE_DEPENDENCY_ORDER = [
  'CATEGORIES',
  'TOPICS',
  'SUBTOPICS',
  'USERS',
  'CONTENT_PLANS',
  'CONTENT_BATCHES',
  'QUESTIONS',
  'VIDEOS',
  'SCRIPT',
  'SCRIPT_VERSIONS',
  'THUMBNAILS',
  'THUMBNAIL_VERSIONS',
  'PINNED_COMMENTS',
  'PINNED_COMMENT_VERSIONS',
  'ASSIGNMENTS',
  'PUBLISHING',
  'WORKFLOW',
  'AUDIT_LOG',
  'SEQUENCES',
] as const;

export const IMMUTABLE_VERSION_ENTITIES = [
  'SCRIPT_VERSIONS',
  'THUMBNAIL_VERSIONS',
  'PINNED_COMMENT_VERSIONS',
] as const;

export class FullSnapshotRestorePlanService {
  private static instance: FullSnapshotRestorePlanService | null = null;
  private preflightService: FullSnapshotPreflightService;
  private restorePlanner: FullSnapshotRestoreService;
  private validatorService: RestoreValidatorService;

  private constructor() {
    this.preflightService = FullSnapshotPreflightService.getInstance();
    this.restorePlanner = FullSnapshotRestoreService.getInstance();
    this.validatorService = RestoreValidatorService.getInstance();
  }

  public static getInstance(): FullSnapshotRestorePlanService {
    if (!FullSnapshotRestorePlanService.instance) {
      FullSnapshotRestorePlanService.instance = new FullSnapshotRestorePlanService();
    }
    return FullSnapshotRestorePlanService.instance;
  }

  /**
   * Generates a deterministic FullRestorePlan from a GoogleSheetsSnapshot.
   * 100% Read-only and side-effect free.
   */
  public async generatePlan(snapshot: GoogleSheetsSnapshot): Promise<FullRestorePlan> {
    const preflightResult: FullSnapshotPreflightResult = await this.preflightService.preflightSnapshot(snapshot);
    const restoreBasePlan: FullSnapshotRestorePlan = await this.restorePlanner.planFullRestore(snapshot);

    const snapshotChecksum = snapshot?.checksum || '';
    const planId = crypto
      .createHash('sha256')
      .update(`PLAN_V1_${snapshotChecksum}`)
      .digest('hex')
      .substring(0, 32);

    const createdAt = snapshot.metadata?.exportTimestamp || (snapshot as any).exportedAt || new Date().toISOString();

    const worksheetPlans: Record<string, WorksheetRestorePlan> = {};
    let totalOperations = 0;
    let globalCreateCount = 0;
    let globalUpdateCount = 0;
    let globalUnchangedCount = 0;
    let globalConflictCount = 0;
    let globalBlockedCount = 0;
    let globalPreservedCount = 0;
    let globalImmutableVersionOps = 0;
    let globalDependencyErrorCount = preflightResult.missingDependencies.length;
    let globalSequenceWarningCount = preflightResult.sequenceWarnings.length;

    // Track planned entity IDs across hierarchy to validate parent-child dependencies
    const availableEntityIds = new Map<string, Set<string>>();
    for (const entityType of EXACT_RESTORE_DEPENDENCY_ORDER) {
      availableEntityIds.set(entityType, new Set<string>());
    }

    // Build worksheet plans following the exact 19-worksheet dependency order
    for (let i = 0; i < EXACT_RESTORE_DEPENDENCY_ORDER.length; i++) {
      const entityType = EXACT_RESTORE_DEPENDENCY_ORDER[i];
      const order = i + 1;
      const wsDetails = restoreBasePlan.entityPlans[entityType] || {
        recordsToCreate: [],
        recordsToUpdate: [],
        unchangedRecords: [],
        conflicts: [],
        missingDependencies: [],
        sequenceWarnings: [],
      };

      const operations: RestorePlannedOperation[] = [];
      const blockingIssues: string[] = [];
      let createCount = 0;
      let updateCount = 0;
      let unchangedCount = 0;
      let conflictCount = 0;
      let blockedCount = 0;
      let preservedExistingCount = 0;

      const isImmutable = IMMUTABLE_VERSION_ENTITIES.includes(entityType as any);

      // Determine static parent dependencies by entity type
      const entityDependencies = this.getParentDependenciesForEntityType(entityType);

      // 1. Process NO_CHANGE records
      for (const rec of wsDetails.unchangedRecords) {
        const recordId = rec.recordId || rec.id;
        operations.push({
          operationId: `OP_${entityType}_${recordId}_NO_CHANGE`,
          operationType: 'NO_CHANGE',
          entityType,
          recordId,
          isImmutableVersion: isImmutable,
          reason: 'Production record matches snapshot exactly.',
        });
        unchangedCount++;
        availableEntityIds.get(entityType)?.add(recordId);
      }

      // 2. Process CREATE records
      for (const rec of wsDetails.recordsToCreate) {
        const recordId = rec.recordId || rec.id || rec.data?.id;
        const payload = rec.data || {};
        const parentDeps = this.extractParentDependencies(entityType, payload);

        // Check if all parent dependencies are available
        const missingDeps = parentDeps.filter(dep => !availableEntityIds.get(dep.entityType)?.has(dep.recordId));

        if (missingDeps.length > 0) {
          operations.push({
            operationId: `OP_${entityType}_${recordId}_BLOCKED`,
            operationType: 'BLOCKED',
            entityType,
            recordId,
            parentDependencies: parentDeps,
            payload,
            isImmutableVersion: isImmutable,
            reason: `Blocked by missing parent dependencies: ${missingDeps.map(d => `${d.entityType}:${d.recordId}`).join(', ')}`,
            blockingIssues: missingDeps.map(d => `Missing parent dependency ${d.entityType}:${d.recordId}`),
          });
          blockedCount++;
          globalDependencyErrorCount++;
        } else {
          operations.push({
            operationId: `OP_${entityType}_${recordId}_CREATE`,
            operationType: 'CREATE',
            entityType,
            recordId,
            parentDependencies: parentDeps,
            payload,
            isImmutableVersion: isImmutable,
            reason: isImmutable
              ? 'Append missing historical immutable version record.'
              : 'Insert new record in production.',
          });
          createCount++;
          availableEntityIds.get(entityType)?.add(recordId);
        }

        if (isImmutable) {
          globalImmutableVersionOps++;
        }
      }

      // 3. Process UPDATE records (STRICT GUARD: Immutable versions NEVER receive UPDATE)
      for (const rec of wsDetails.recordsToUpdate) {
        const recordId = rec.recordId || rec.id || rec.data?.id;
        const payload = rec.data || {};

        if (isImmutable) {
          // Rule: Immutable version ledgers must NEVER contain an UPDATE operation
          operations.push({
            operationId: `OP_${entityType}_${recordId}_BLOCKED_IMMUTABLE`,
            operationType: 'BLOCKED',
            entityType,
            recordId,
            payload,
            isImmutableVersion: true,
            reason: `Modification of immutable version ${entityType}:${recordId} is strictly prohibited.`,
            blockingIssues: [`Immutable version ${entityType}:${recordId} cannot be updated.`],
          });
          blockedCount++;
          blockingIssues.push(`Immutable version violation for ${entityType}:${recordId}`);
        } else {
          const parentDeps = this.extractParentDependencies(entityType, payload);
          operations.push({
            operationId: `OP_${entityType}_${recordId}_UPDATE`,
            operationType: 'UPDATE',
            entityType,
            recordId,
            parentDependencies: parentDeps,
            payload,
            isImmutableVersion: false,
            reason: 'Safely update existing production record per restore validation policy.',
          });
          updateCount++;
          availableEntityIds.get(entityType)?.add(recordId);
        }
      }

      // 4. Process CONFLICT records
      for (const conf of wsDetails.conflicts) {
        operations.push({
          operationId: `OP_${entityType}_${conf.entityId}_CONFLICT`,
          operationType: 'CONFLICT',
          entityType,
          recordId: conf.entityId,
          isImmutableVersion: isImmutable,
          reason: conf.reason,
          blockingIssues: [conf.reason],
        });
        conflictCount++;
        blockingIssues.push(conf.reason);
      }

      // 5. Sequence safety checks
      for (const seqWarn of wsDetails.sequenceWarnings) {
        blockingIssues.push(seqWarn);
      }

      const totalWsRecords = unchangedCount + createCount + updateCount + conflictCount + blockedCount;

      worksheetPlans[entityType] = {
        worksheet: entityType,
        order,
        dependencies: entityDependencies,
        totalRecords: totalWsRecords,
        operations,
        createCount,
        updateCount,
        unchangedCount,
        conflictCount,
        blockedCount,
        preservedExistingCount,
        blockingIssues,
      };

      totalOperations += operations.length;
      globalCreateCount += createCount;
      globalUpdateCount += updateCount;
      globalUnchangedCount += unchangedCount;
      globalConflictCount += conflictCount;
      globalBlockedCount += blockedCount;
      globalPreservedCount += preservedExistingCount;
    }

    const schemaValidationPassed = preflightResult.schemaErrors.length === 0;
    const foreignKeyValidationPassed = globalDependencyErrorCount === 0;
    const conflictValidationPassed = globalConflictCount === 0 && globalBlockedCount === 0;
    const immutableVersionValidationPassed = !Object.values(worksheetPlans).some(
      wp => IMMUTABLE_VERSION_ENTITIES.includes(wp.worksheet as any) && (wp.updateCount > 0 || wp.conflictCount > 0 || wp.blockedCount > 0)
    );
    const sequenceValidationPassed = globalSequenceWarningCount === 0;

    const valid =
      preflightResult.valid &&
      restoreBasePlan.valid &&
      schemaValidationPassed &&
      foreignKeyValidationPassed &&
      conflictValidationPassed &&
      immutableVersionValidationPassed &&
      sequenceValidationPassed;

    const executionAllowed = valid;
    const status = executionAllowed ? 'READY' : 'BLOCKED';

    return {
      planId,
      snapshotChecksum,
      createdAt,
      valid,
      executionAllowed,
      status,
      dependencyOrder: EXACT_RESTORE_DEPENDENCY_ORDER,
      worksheetPlans,
      totalOperations,
      createCount: globalCreateCount,
      updateCount: globalUpdateCount,
      unchangedCount: globalUnchangedCount,
      conflictCount: globalConflictCount,
      dependencyErrorCount: globalDependencyErrorCount,
      sequenceWarningCount: globalSequenceWarningCount,
      destructiveOperationCount: 0, // Destructive operations (like DELETE) are strictly 0
      immutableVersionOperationCount: globalImmutableVersionOps,
      summary: {
        validSnapshot: preflightResult.safetySummary.validSnapshot,
        schemaValidationPassed,
        foreignKeyValidationPassed,
        conflictValidationPassed,
        immutableVersionValidationPassed,
        sequenceValidationPassed,
        executable: executionAllowed,
      },
      safetyGuarantees: {
        zeroGoogleSheetsWrites: true,
        zeroProductionMutations: true,
        noDestructiveDeletions: true,
        forwardOnlySequences: true,
        immutableHistoryPreserved: true,
      },
    };
  }

  private getParentDependenciesForEntityType(entityType: string): string[] {
    switch (entityType) {
      case 'TOPICS':
        return ['CATEGORIES'];
      case 'SUBTOPICS':
        return ['TOPICS'];
      case 'CONTENT_BATCHES':
        return ['CONTENT_PLANS'];
      case 'QUESTIONS':
        return ['CATEGORIES', 'TOPICS', 'SUBTOPICS'];
      case 'VIDEOS':
        return ['QUESTIONS'];
      case 'SCRIPT':
        return ['VIDEOS'];
      case 'SCRIPT_VERSIONS':
        return ['SCRIPT'];
      case 'THUMBNAILS':
        return ['VIDEOS'];
      case 'THUMBNAIL_VERSIONS':
        return ['THUMBNAILS'];
      case 'PINNED_COMMENTS':
        return ['VIDEOS'];
      case 'PINNED_COMMENT_VERSIONS':
        return ['PINNED_COMMENTS'];
      case 'ASSIGNMENTS':
        return ['USERS'];
      case 'PUBLISHING':
        return ['VIDEOS'];
      default:
        return [];
    }
  }

  private extractParentDependencies(entityType: string, payload: Record<string, any>): Array<{ entityType: string; recordId: string }> {
    const deps: Array<{ entityType: string; recordId: string }> = [];

    if (entityType === 'TOPICS' && payload.categoryId) {
      deps.push({ entityType: 'CATEGORIES', recordId: String(payload.categoryId) });
    } else if (entityType === 'SUBTOPICS' && payload.topicId) {
      deps.push({ entityType: 'TOPICS', recordId: String(payload.topicId) });
    } else if (entityType === 'CONTENT_BATCHES' && payload.planId) {
      deps.push({ entityType: 'CONTENT_PLANS', recordId: String(payload.planId) });
    } else if (entityType === 'QUESTIONS') {
      if (payload.categoryId) deps.push({ entityType: 'CATEGORIES', recordId: String(payload.categoryId) });
      if (payload.topicId) deps.push({ entityType: 'TOPICS', recordId: String(payload.topicId) });
      if (payload.subtopicId) deps.push({ entityType: 'SUBTOPICS', recordId: String(payload.subtopicId) });
    } else if (entityType === 'VIDEOS' && payload.questionId) {
      deps.push({ entityType: 'QUESTIONS', recordId: String(payload.questionId) });
    } else if (entityType === 'SCRIPT' && payload.videoId) {
      deps.push({ entityType: 'VIDEOS', recordId: String(payload.videoId) });
    } else if (entityType === 'SCRIPT_VERSIONS' && (payload.scriptId || payload.videoId)) {
      deps.push({ entityType: 'SCRIPT', recordId: String(payload.scriptId || payload.videoId) });
    } else if (entityType === 'THUMBNAILS' && payload.videoId) {
      deps.push({ entityType: 'VIDEOS', recordId: String(payload.videoId) });
    } else if (entityType === 'THUMBNAIL_VERSIONS' && (payload.thumbnailId || payload.videoId)) {
      deps.push({ entityType: 'THUMBNAILS', recordId: String(payload.thumbnailId || payload.videoId) });
    } else if (entityType === 'PINNED_COMMENTS' && payload.videoId) {
      deps.push({ entityType: 'VIDEOS', recordId: String(payload.videoId) });
    } else if (entityType === 'PINNED_COMMENT_VERSIONS' && (payload.pinnedCommentId || payload.videoId)) {
      deps.push({ entityType: 'PINNED_COMMENTS', recordId: String(payload.pinnedCommentId || payload.videoId) });
    } else if (entityType === 'ASSIGNMENTS' && payload.assignedTo) {
      deps.push({ entityType: 'USERS', recordId: String(payload.assignedTo) });
    } else if (entityType === 'PUBLISHING' && (payload.videoId || payload.questionId)) {
      deps.push({ entityType: 'VIDEOS', recordId: String(payload.videoId || payload.questionId) });
    }

    return deps;
  }
}
