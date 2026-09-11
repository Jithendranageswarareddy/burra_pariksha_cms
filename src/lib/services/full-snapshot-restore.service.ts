/**
 * BURRA PARIKSHA CMS - Full Snapshot Restore Planner Service
 * Task 3F.4.8A: Read-only full snapshot restoration planning & dependency analysis.
 * 
 * Strict Constraints:
 * - Read-only operation (zero writes).
 * - Reuses RestoreValidatorService and repository state.
 * - Enforces exact dependency order and fail-closed validation.
 */

import crypto from 'node:crypto';
import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { RestoreValidatorService } from './restore-validator.service';
import { ALL_SHEET_TABS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { 
  categoriesRepository,
  contentMastersRepository,
  topicsRepository,
  subtopicsRepository,
  usersRepository,
  contentPlansRepository,
  contentBatchesRepository,
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
  sequencesRepository
} from '../repositories';

export const FULL_RESTORE_CONFIRMATION_PHRASE = 'RESTORE ALL DATA';

export const FULL_RESTORE_ENTITY_ORDER = [
  'CATEGORIES',
  'TOPICS',
  'SUBTOPICS',
  'USERS',
  'CONTENT_PLANS',
  'CONTENT_BATCHES',
  'CONTENT_MASTERS',
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

export type FullRestoreEntityType = typeof FULL_RESTORE_ENTITY_ORDER[number];

export interface EntityPlanDetail {
  entityType: string;
  recordsToCreate: any[];
  recordsToUpdate: any[];
  unchangedRecords: any[];
  conflicts: Array<{ entityId: string; reason: string }>;
  missingDependencies: Array<{ entityId: string; missingKey: string }>;
  sequenceWarnings: string[];
}

export interface FullSnapshotRestorePlan {
  valid: boolean;
  eligible: boolean;
  snapshotChecksum: string;
  confirmationPhraseRequired: string;
  dependencyOrder: readonly string[];
  entityPlans: Record<string, EntityPlanDetail>;
  globalConflicts: Array<{ entityType: string; entityId: string; reason: string }>;
  schemaErrors: string[];
  missingDependencies: Array<{ entityType: string; entityId: string; missingKey: string }>;
  sequenceWarnings: string[];
  validationWarnings: string[];
}

export class FullSnapshotRestoreService {
  private static instance: FullSnapshotRestoreService | null = null;
  private validatorService: RestoreValidatorService;

  private constructor() {
    this.validatorService = RestoreValidatorService.getInstance();
  }

  public static getInstance(): FullSnapshotRestoreService {
    if (!FullSnapshotRestoreService.instance) {
      FullSnapshotRestoreService.instance = new FullSnapshotRestoreService();
    }
    return FullSnapshotRestoreService.instance;
  }

  /**
   * Generates a read-only deterministic restoration plan for a full snapshot.
   */
  public async planFullRestore(snapshot: GoogleSheetsSnapshot): Promise<FullSnapshotRestorePlan> {
    const globalConflicts: Array<{ entityType: string; entityId: string; reason: string }> = [];
    const schemaErrors: string[] = [];
    const missingDependencies: Array<{ entityType: string; entityId: string; missingKey: string }> = [];
    const sequenceWarnings: string[] = [];
    const validationWarnings: string[] = [];
    const entityPlans: Record<string, EntityPlanDetail> = {};

    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      return {
        valid: false,
        eligible: false,
        snapshotChecksum: '',
        confirmationPhraseRequired: FULL_RESTORE_CONFIRMATION_PHRASE,
        dependencyOrder: FULL_RESTORE_ENTITY_ORDER,
        entityPlans: {},
        globalConflicts: [{ entityType: 'SNAPSHOT', entityId: 'GLOBAL', reason: 'Invalid snapshot structure or missing checksum.' }],
        schemaErrors: ['Invalid snapshot structure.'],
        missingDependencies: [],
        sequenceWarnings: [],
        validationWarnings: [],
      };
    }

    // 1. Checksum Integrity Validation
    const sequences = snapshot.sequences !== undefined ? snapshot.sequences : snapshot.worksheets?.['SEQUENCES'];
    const checksumPayloadWithSeq = JSON.stringify({
      worksheets: snapshot.worksheets,
      sequences,
    });
    const checksumPayloadWithoutSeq = JSON.stringify({
      worksheets: snapshot.worksheets,
      sequences: snapshot.sequences,
    });
    const recomputedChecksumWithSeq = crypto.createHash('sha256').update(checksumPayloadWithSeq).digest('hex');
    const recomputedChecksumWithoutSeq = crypto.createHash('sha256').update(checksumPayloadWithoutSeq).digest('hex');

    const isValidChecksum = snapshot.checksum === recomputedChecksumWithSeq || snapshot.checksum === recomputedChecksumWithoutSeq;

    if (!isValidChecksum) {
      return {
        valid: false,
        eligible: false,
        snapshotChecksum: snapshot.checksum,
        confirmationPhraseRequired: FULL_RESTORE_CONFIRMATION_PHRASE,
        dependencyOrder: FULL_RESTORE_ENTITY_ORDER,
        entityPlans: {},
        globalConflicts: [{ entityType: 'SNAPSHOT', entityId: 'GLOBAL', reason: 'Checksum verification failed. Snapshot data tampered or corrupted.' }],
        schemaErrors: ['Checksum mismatch.'],
        missingDependencies: [],
        sequenceWarnings: [],
        validationWarnings: [],
      };
    }

    // 2. Schema Validation (Worksheet Presence and Headers)
    for (const expectedTab of ALL_SHEET_TABS) {
      const ws = snapshot.worksheets[expectedTab] || 
                 (expectedTab === SHEET_TABS.SCRIPT ? (snapshot.worksheets['SCRIPTS'] || snapshot.worksheets['SCRIPT']) : undefined);
      if (!ws) {
        schemaErrors.push(`Missing expected worksheet: "${expectedTab}"`);
        continue;
      }
      if (!Array.isArray(ws.headers)) {
        schemaErrors.push(`Worksheet "${expectedTab}" is missing headers array.`);
      }
    }

    if (schemaErrors.length > 0) {
      return {
        valid: false,
        eligible: false,
        snapshotChecksum: snapshot.checksum,
        confirmationPhraseRequired: FULL_RESTORE_CONFIRMATION_PHRASE,
        dependencyOrder: FULL_RESTORE_ENTITY_ORDER,
        entityPlans: {},
        globalConflicts: [{ entityType: 'SCHEMA', entityId: 'GLOBAL', reason: 'Worksheet schema validation failed.' }],
        schemaErrors,
        missingDependencies: [],
        sequenceWarnings: [],
        validationWarnings: [],
      };
    }

    // Fetch current production entities for all restore entities
    const prodData: Record<string, Map<string, any>> = {};
    try {
      const [
        cats, tops, subs, usrs, plans, batches, cms, qs, vids, scrs, scvers, thumbs, thvers, pcs, pcvers, assigns, pubs, wfs, audits, seqs
      ] = await Promise.all([
        categoriesRepository.findAll().catch(() => []),
        topicsRepository.findAll().catch(() => []),
        subtopicsRepository.findAll().catch(() => []),
        usersRepository.findAll().catch(() => []),
        contentPlansRepository.findAll().catch(() => []),
        contentBatchesRepository.findAll().catch(() => []),
        contentMastersRepository.findAll().catch(() => []),
        questionsRepository.findAll().catch(() => []),
        videosRepository.findAll().catch(() => []),
        scriptsRepository.findAll().catch(() => []),
        scriptVersionsRepository.findAll().catch(() => []),
        thumbnailsRepository.findAll().catch(() => []),
        thumbnailVersionsRepository.findAll().catch(() => []),
        pinnedCommentsRepository.findAll().catch(() => []),
        pinnedCommentVersionsRepository.findAll().catch(() => []),
        assignmentsRepository.findAll().catch(() => []),
        publishingRepository.findAll().catch(() => []),
        workflowRepository.findAll().catch(() => []),
        auditLogRepository.findAll().catch(() => []),
        sequencesRepository.findAll().catch(() => []),
      ]);

      const createMap = (items: any[], versionType?: 'SCRIPT' | 'THUMBNAIL' | 'PINNED_COMMENT') => {
        const map = new Map<string, any>();
        for (const x of items) {
          if (x.id) map.set(x.id, x);
          if (x.categoryId) map.set(x.categoryId, x);
          if (x.topicId) map.set(x.topicId, x);
          if (x.subtopicId) map.set(x.subtopicId, x);
          if (x.userId) map.set(x.userId, x);
          if (x.planId) map.set(x.planId, x);
          if (x.batchId) map.set(x.batchId, x);
          if (x.questionId) map.set(x.questionId, x);
          if (x.videoId) map.set(x.videoId, x);
          if (x.scriptId && !versionType) map.set(x.scriptId, x);
          if (x.thumbnailId && !versionType) map.set(x.thumbnailId, x);
          if (x.pinnedCommentId && !versionType) map.set(x.pinnedCommentId, x);
          if (x.entityName) map.set(x.entityName, x);
          if (x.entityType) map.set(x.entityType, x);
          if (x.entity_type) map.set(x.entity_type, x);

          if (versionType === 'SCRIPT' && x.scriptId && x.versionNumber !== undefined) {
            map.set(`${x.scriptId}_${x.versionNumber}`, x);
          } else if (versionType === 'THUMBNAIL' && x.thumbnailId && x.versionNumber !== undefined) {
            map.set(`${x.thumbnailId}_${x.versionNumber}`, x);
          } else if (versionType === 'PINNED_COMMENT' && x.pinnedCommentId && x.versionNumber !== undefined) {
            map.set(`${x.pinnedCommentId}_${x.versionNumber}`, x);
          }
        }
        return map;
      };

      prodData['CATEGORIES'] = createMap(cats);
      prodData['TOPICS'] = createMap(tops);
      prodData['SUBTOPICS'] = createMap(subs);
      prodData['USERS'] = createMap(usrs);
      prodData['CONTENT_PLANS'] = createMap(plans);
      prodData['CONTENT_BATCHES'] = createMap(batches);
      prodData['CONTENT_MASTERS'] = createMap(cms);
      prodData['QUESTIONS'] = createMap(qs);
      prodData['VIDEOS'] = createMap(vids);
      prodData['SCRIPT'] = createMap(scrs);
      prodData['SCRIPT_VERSIONS'] = createMap(scvers, 'SCRIPT');
      prodData['THUMBNAILS'] = createMap(thumbs);
      prodData['THUMBNAIL_VERSIONS'] = createMap(thvers, 'THUMBNAIL');
      prodData['PINNED_COMMENTS'] = createMap(pcs);
      prodData['PINNED_COMMENT_VERSIONS'] = createMap(pcvers, 'PINNED_COMMENT');
      prodData['ASSIGNMENTS'] = createMap(assigns);
      prodData['PUBLISHING'] = createMap(pubs);
      prodData['WORKFLOW'] = createMap(wfs);
      prodData['AUDIT_LOG'] = createMap(audits);
      prodData['SEQUENCES'] = createMap(seqs);
    } catch {
      // Fallback empty prod data
    }

    // Process each entity tab in exact dependency order
    for (const entityType of FULL_RESTORE_ENTITY_ORDER) {
      let ws = snapshot.worksheets[entityType] || snapshot.worksheets[entityType === 'SCRIPT' ? 'SCRIPTS' : 'SCRIPT'];

      const recordsToCreate: any[] = [];
      const recordsToUpdate: any[] = [];
      const unchangedRecords: any[] = [];
      const conflicts: Array<{ entityId: string; reason: string }> = [];
      const tabMissingDeps: Array<{ entityId: string; missingKey: string }> = [];
      const tabSeqWarnings: string[] = [];

      if (!ws || !ws.rows) {
        entityPlans[entityType] = {
          entityType,
          recordsToCreate,
          recordsToUpdate,
          unchangedRecords,
          conflicts,
          missingDependencies: tabMissingDeps,
          sequenceWarnings: tabSeqWarnings,
        };
        continue;
      }

      const { headers, rows } = ws;
      const map = prodData[entityType] || prodData['SCRIPTS'] || new Map();
      const idHeader = headers.find(h => /id/i.test(h)) || headers[0] || 'id';
      const idIdx = headers.indexOf(idHeader);
      const isImmutable = ['SCRIPT_VERSIONS', 'THUMBNAIL_VERSIONS', 'PINNED_COMMENT_VERSIONS'].includes(entityType);

      for (const row of rows) {
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] !== undefined ? row[idx] : '';
        });

        const recordId = idIdx >= 0 ? String(row[idIdx] || '') : String(obj.id || obj.questionId || '');
        if (!recordId) continue;

        let existing: any = undefined;
        if (entityType === 'SCRIPT_VERSIONS') {
          existing = map.get(recordId) || (obj.scriptId && obj.versionNumber !== undefined ? map.get(`${obj.scriptId}_${obj.versionNumber}`) : undefined);
        } else if (entityType === 'THUMBNAIL_VERSIONS') {
          existing = map.get(recordId) || (obj.thumbnailId && obj.versionNumber !== undefined ? map.get(`${obj.thumbnailId}_${obj.versionNumber}`) : undefined);
        } else if (entityType === 'PINNED_COMMENT_VERSIONS') {
          existing = map.get(recordId) || (obj.pinnedCommentId && obj.versionNumber !== undefined ? map.get(`${obj.pinnedCommentId}_${obj.versionNumber}`) : undefined);
        } else {
          existing = map.get(recordId);
        }

        if (!existing) {
          recordsToCreate.push({ entityType, recordId, data: obj });
        } else {
          const snapUpdated = obj.updatedAt || obj.createdAt || '';
          const prodUpdated = existing.updatedAt || existing.createdAt || '';

          if (isImmutable) {
            // For immutable version entities (SCRIPT_VERSIONS, THUMBNAIL_VERSIONS, PINNED_COMMENT_VERSIONS):
            // If the record exists in DB with the exact same ID, it is preserved without modification.
            // A collision only occurs if a DIFFERENT ID collides with existing version number.
            if (existing.id === recordId) {
              unchangedRecords.push({ entityType, recordId });
            } else {
              conflicts.push({
                entityId: recordId,
                reason: `Immutable version record conflict detected for ${entityType}:${recordId}.`,
              });
              globalConflicts.push({
                entityType,
                entityId: recordId,
                reason: `Immutable version conflict`,
              });
            }
          } else if (snapUpdated && prodUpdated && snapUpdated < prodUpdated) {
            conflicts.push({
              entityId: recordId,
              reason: `Snapshot record is older than existing production record (Production is newer).`,
            });
            globalConflicts.push({
              entityType,
              entityId: recordId,
              reason: `Newer production record conflict`,
            });
          } else if (snapUpdated && prodUpdated && snapUpdated === prodUpdated) {
            unchangedRecords.push({ entityType, recordId });
          } else {
            recordsToUpdate.push({ entityType, recordId, data: obj });
          }
        }

        // Validate Content Master primaryQuestionId against snapshot Questions (warn only, do not block)
        if (entityType === 'CONTENT_MASTERS' && obj.primaryQuestionId) {
          const qWs = snapshot.worksheets?.['QUESTIONS'];
          let qFound = false;
          if (qWs && Array.isArray(qWs.rows) && Array.isArray(qWs.headers)) {
            const qIdIdx = qWs.headers.findIndex(h => String(h).toLowerCase() === 'id');
            if (qIdIdx >= 0) {
              qFound = qWs.rows.some(r => String(r[qIdIdx]) === String(obj.primaryQuestionId));
            }
          }
          if (!qFound) {
            validationWarnings.push(
              `Content Master ${recordId} references primaryQuestionId "${obj.primaryQuestionId}" which is not present in snapshot QUESTIONS.`
            );
          }
        }

        // Sequence rollback checks
        if (entityType === 'SEQUENCES') {
          const snapSeq = Number(obj.nextNumber || obj.next_number || obj.currentValue || obj.value || 0);
          const prodSeq = existing ? Number(existing.nextNumber || existing.next_number || existing.currentValue || existing.value || 0) : 0;
          if (snapSeq > 0 && prodSeq > 0 && snapSeq < prodSeq) {
            const warning = `Sequence rollback risk for ${obj.entityType || obj.entity_type || obj.entityName || recordId} (Snapshot: ${snapSeq}, Prod: ${prodSeq}).`;
            tabSeqWarnings.push(warning);
            sequenceWarnings.push(warning);
            globalConflicts.push({
              entityType,
              entityId: recordId,
              reason: `Sequence rollback prohibited`,
            });
          }
        }
      }

      entityPlans[entityType] = {
        entityType,
        recordsToCreate,
        recordsToUpdate,
        unchangedRecords,
        conflicts,
        missingDependencies: tabMissingDeps,
        sequenceWarnings: tabSeqWarnings,
      };
    }

    const eligible = schemaErrors.length === 0 && globalConflicts.length === 0;

    return {
      valid: schemaErrors.length === 0,
      eligible,
      snapshotChecksum: snapshot.checksum,
      confirmationPhraseRequired: FULL_RESTORE_CONFIRMATION_PHRASE,
      dependencyOrder: FULL_RESTORE_ENTITY_ORDER,
      entityPlans,
      globalConflicts,
      schemaErrors,
      missingDependencies,
      sequenceWarnings,
      validationWarnings,
    };
  }
}
