/**
 * BURRA PARIKSHA CMS - Phase 16.6 Behavioral Verification Suite
 * Content Master Disaster Recovery & Snapshot Restore Parity
 * 
 * Strict behavioral execution verifying:
 * 1. Exact 20-entity dependency order matches.
 * 2. CONTENT_MASTERS immediately precedes QUESTIONS.
 * 3. CM create diff works.
 * 4. CM update diff works.
 * 5. CM unchanged diff works.
 * 6. CM parent dependencies validate (categoryId, topicId, subtopicId, createdBy).
 * 7. CM restore creates missing records in repository.
 * 8. CM restore updates modified records in repository.
 * 9. Immutable CM IDs are preserved exactly.
 * 10. Question restore succeeds after CM restore.
 * 11. Question.contentMasterId links to restored CM.
 * 12. CONTENT_MASTER sequence rollback is rejected.
 * 13. Granular CONTENT_MASTER preflight lookup works.
 * 14. CM without primaryQuestionId restores successfully.
 * 15. Populated primaryQuestionId is checked against snapshot Questions without blocking CM insertion.
 * 16. Linked CM + Question snapshot restores without orphaning either side.
 */

import crypto from 'node:crypto';
import {
  FULL_RESTORE_ENTITY_ORDER,
  FullSnapshotRestoreService,
} from '../lib/services/full-snapshot-restore.service';
import {
  EXACT_RESTORE_DEPENDENCY_ORDER,
  FullSnapshotRestorePlanService,
} from '../lib/services/full-snapshot-restore-plan.service';
import {
  FullSnapshotRestoreExecutionService,
} from '../lib/services/full-snapshot-restore-execution.service';
import {
  RestoreValidatorService,
} from '../lib/services/restore-validator.service';
import {
  FullSnapshotPreflightService,
} from '../lib/services/full-snapshot-preflight.service';
import {
  GranularContentMasterRestoreService,
} from '../lib/services/granular-content-master-restore.service';
import {
  ALL_SHEET_TABS,
  SHEET_SCHEMAS,
} from '../lib/schemas/google-sheets-schema';
import {
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  usersRepository,
  contentMastersRepository,
  questionsRepository,
  sequencesRepository,
  BaseRepository,
} from '../lib/repositories';
import { GoogleSheetsSnapshot, WorksheetSnapshot } from '../lib/services/snapshot-exporter.service';

export interface ParityTestResult {
  step: string;
  name: string;
  passed: boolean;
  details?: string;
}

export interface ParitySummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: ParityTestResult[];
}

function resetFallbackStore() {
  const store = (BaseRepository as any).fallbackStore;
  if (store instanceof Map) {
    for (const [, map] of store) {
      if (map instanceof Map) {
        map.clear();
      }
    }
  }
}

/**
 * Builds a valid in-memory GoogleSheetsSnapshot with all 22 operational worksheets.
 */
function buildMockSnapshot(overrides: {
  worksheets?: Record<string, any>;
  sequences?: any;
  checksum?: string;
} = {}): GoogleSheetsSnapshot {
  const futureTs = '2099-01-01T00:00:00.000Z';
  const worksheets: Record<string, WorksheetSnapshot> = {};

  for (const tab of ALL_SHEET_TABS) {
    if (tab === 'CATEGORIES') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'name', 'code', 'order', 'status', 'createdAt', 'updatedAt'],
        rows: [['BP-CAT-000001', 'General Studies', 'GS', 1, 'ACTIVE', futureTs, futureTs]],
        rowCount: 1,
      };
    } else if (tab === 'TOPICS') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'categoryId', 'name', 'code', 'order', 'status', 'createdAt', 'updatedAt'],
        rows: [['BP-TOP-000001', 'BP-CAT-000001', 'Indian Polity', 'POL', 1, 'ACTIVE', futureTs, futureTs]],
        rowCount: 1,
      };
    } else if (tab === 'SUBTOPICS') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'topicId', 'name', 'code', 'order', 'status', 'createdAt', 'updatedAt'],
        rows: [['BP-SUB-000001', 'BP-TOP-000001', 'Preamble', 'PRE', 1, 'ACTIVE', futureTs, futureTs]],
        rowCount: 1,
      };
    } else if (tab === 'USERS') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'email', 'name', 'role', 'status', 'createdAt', 'updatedAt'],
        rows: [['USR-001', 'admin@burra.com', 'Admin User', 'ADMIN', 'ACTIVE', futureTs, futureTs]],
        rowCount: 1,
      };
    } else if (tab === 'CONTENT_MASTERS') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
        rows: [],
        rowCount: 0,
      };
    } else if (tab === 'QUESTIONS') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'questionText', 'categoryId', 'topicId', 'subtopicId', 'contentMasterId', 'status', 'createdAt', 'updatedAt'],
        rows: [],
        rowCount: 0,
      };
    } else if (tab === 'SEQUENCES') {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['entityType', 'nextNumber', 'updatedAt'],
        rows: [
          ['CONTENT_MASTER', '10000', futureTs],
          ['QUESTION', '10000', futureTs],
        ],
        rowCount: 2,
      };
    } else {
      worksheets[tab] = {
        sheetName: tab,
        headers: ['id', 'name', 'createdAt', 'updatedAt'],
        rows: [],
        rowCount: 0,
      };
    }
  }

  if (overrides.worksheets) {
    for (const [key, ws] of Object.entries(overrides.worksheets)) {
      worksheets[key] = {
        sheetName: ws.sheetName || key,
        headers: ws.headers || [],
        rows: ws.rows || [],
        rowCount: ws.rowCount !== undefined ? ws.rowCount : (ws.rows ? ws.rows.length : 0),
      };
    }
  }

  const sequences = overrides.sequences || [
    { entityType: 'CONTENT_MASTER', entityName: 'CONTENT_MASTER', nextNumber: 10000, currentValue: 10000 },
    { entityType: 'QUESTION', entityName: 'QUESTION', nextNumber: 10000, currentValue: 10000 },
  ];

  const checksumPayload = JSON.stringify({
    worksheets,
    sequences,
  });
  const checksum = overrides.checksum !== undefined
    ? overrides.checksum
    : crypto.createHash('sha256').update(checksumPayload).digest('hex');

  return {
    checksum,
    metadata: {
      exportTimestamp: '2026-09-09T12:00:00.000Z',
      spreadsheetTitle: 'Burra Pariksha CMS Test Snapshot',
      spreadsheetIdMasked: 'MOCK_SHEET_ID',
      totalWorksheets: Object.keys(worksheets).length,
      totalRows: 10,
      generator: 'USR-001',
    },
    worksheets,
    sequences,
  };
}

export async function runPhase16Step6Verification(): Promise<ParitySummary> {
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = ''; // In-memory deterministic isolation

  const results: ParityTestResult[] = [];
  const add = (step: string, name: string, passed: boolean, details?: string) => {
    results.push({ step, name, passed, details });
  };

  const restoreService = FullSnapshotRestoreService.getInstance();
  const planService = FullSnapshotRestorePlanService.getInstance();
  const executionService = FullSnapshotRestoreExecutionService.getInstance();
  const validatorService = RestoreValidatorService.getInstance();
  const preflightService = FullSnapshotPreflightService.getInstance();

  try {
    // ------------------------------------------------------------------------
    // SETUP: Seed In-Memory Repositories
    // ------------------------------------------------------------------------
    resetFallbackStore();

    await categoriesRepository.appendRecord({
      id: 'BP-CAT-000001',
      name: 'General Studies',
      code: 'GS',
      order: 1,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as any);

    await topicsRepository.appendRecord({
      id: 'BP-TOP-000001',
      categoryId: 'BP-CAT-000001',
      name: 'Indian Polity',
      code: 'POL',
      order: 1,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as any);

    await subtopicsRepository.appendRecord({
      id: 'BP-SUB-000001',
      topicId: 'BP-TOP-000001',
      name: 'Preamble',
      code: 'PRE',
      order: 1,
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as any);

    await usersRepository.appendRecord({
      id: 'USR-001',
      email: 'admin@burra.com',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as any);

    await sequencesRepository.appendRecord({
      entityType: 'CONTENT_MASTER',
      entityName: 'CONTENT_MASTER',
      nextNumber: 10,
      updatedAt: '2026-08-01T00:00:00.000Z',
    } as any);

    const expected20Order = [
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
    ];

    // ------------------------------------------------------------------------
    // CHECK 1: Exact 20-entity dependency order matches authoritative list
    // ------------------------------------------------------------------------
    const fullOrderMatches =
      FULL_RESTORE_ENTITY_ORDER.length === 20 &&
      expected20Order.every((val, idx) => FULL_RESTORE_ENTITY_ORDER[idx] === val);

    const planOrderMatches =
      EXACT_RESTORE_DEPENDENCY_ORDER.length === 20 &&
      expected20Order.every((val, idx) => EXACT_RESTORE_DEPENDENCY_ORDER[idx] === val);

    add(
      'CHECK-1',
      'Exact 20-entity dependency order matches authoritative inventory across restore services',
      fullOrderMatches && planOrderMatches,
      `FullRestoreOrder: ${FULL_RESTORE_ENTITY_ORDER.length} items; PlanDependencyOrder: ${EXACT_RESTORE_DEPENDENCY_ORDER.length} items`
    );

    // ------------------------------------------------------------------------
    // CHECK 2: CONTENT_MASTERS immediately precedes QUESTIONS
    // ------------------------------------------------------------------------
    const fullCmIdx = FULL_RESTORE_ENTITY_ORDER.indexOf('CONTENT_MASTERS' as any);
    const fullQIdx = FULL_RESTORE_ENTITY_ORDER.indexOf('QUESTIONS' as any);
    const planCmIdx = EXACT_RESTORE_DEPENDENCY_ORDER.indexOf('CONTENT_MASTERS' as any);
    const planQIdx = EXACT_RESTORE_DEPENDENCY_ORDER.indexOf('QUESTIONS' as any);

    const cmPrecedesQ =
      fullCmIdx >= 0 &&
      fullCmIdx + 1 === fullQIdx &&
      planCmIdx >= 0 &&
      planCmIdx + 1 === planQIdx;

    add(
      'CHECK-2',
      'CONTENT_MASTERS immediately precedes QUESTIONS in both restore order definitions',
      cmPrecedesQ,
      `FullRestoreOrder index: CM=${fullCmIdx}, Q=${fullQIdx}; PlanOrder index: CM=${planCmIdx}, Q=${planQIdx}`
    );

    // ------------------------------------------------------------------------
    // CHECK 3: CM create diff works (snapshot has CM missing from production)
    // ------------------------------------------------------------------------
    const snapForCreate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000101', 'Modern Indian History Master', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const restorePlanCreate = await restoreService.planFullRestore(snapForCreate);
    const cmCreatePlan = restorePlanCreate.entityPlans['CONTENT_MASTERS'];
    const planGenCreate = await planService.generatePlan(snapForCreate);
    const cmOpCreate = planGenCreate.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000101');

    add(
      'CHECK-3',
      'Content Master create diff identifies missing production record and plans CREATE operation',
      cmCreatePlan?.recordsToCreate?.length === 1 && cmOpCreate?.operationType === 'CREATE',
      `recordsToCreate: ${cmCreatePlan?.recordsToCreate?.length}; plannedOp: ${cmOpCreate?.operationType}`
    );

    // ------------------------------------------------------------------------
    // CHECK 4: CM update diff works (snapshot has updated CM vs production)
    // ------------------------------------------------------------------------
    // Seed production record
    await contentMastersRepository.appendRecord({
      id: 'BP-MST-000102',
      title: 'Polity Basics (Old Title)',
      status: 'DRAFT',
      categoryId: 'BP-CAT-000001',
      topicId: 'BP-TOP-000001',
      subtopicId: 'BP-SUB-000001',
      createdBy: 'USR-001',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });

    const snapForUpdate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000102', 'Polity Basics (Updated Title)', 'ACTIVE', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-08-01T00:00:00.000Z', '2026-09-02T10:00:00.000Z'],
          ],
        },
      },
    });

    const restorePlanUpdate = await restoreService.planFullRestore(snapForUpdate);
    const cmUpdatePlan = restorePlanUpdate.entityPlans['CONTENT_MASTERS'];
    const planGenUpdate = await planService.generatePlan(snapForUpdate);
    const cmOpUpdate = planGenUpdate.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000102');

    add(
      'CHECK-4',
      'Content Master update diff detects newer snapshot record and plans UPDATE operation',
      cmUpdatePlan?.recordsToUpdate?.length === 1 && cmOpUpdate?.operationType === 'UPDATE',
      `recordsToUpdate: ${cmUpdatePlan?.recordsToUpdate?.length}; plannedOp: ${cmOpUpdate?.operationType}`
    );

    // ------------------------------------------------------------------------
    // CHECK 5: CM unchanged diff works (identical snapshot vs production)
    // ------------------------------------------------------------------------
    const snapForUnchanged = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000102', 'Polity Basics (Old Title)', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z'],
          ],
        },
      },
    });

    const restorePlanUnchanged = await restoreService.planFullRestore(snapForUnchanged);
    const cmUnchangedPlan = restorePlanUnchanged.entityPlans['CONTENT_MASTERS'];
    const planGenUnchanged = await planService.generatePlan(snapForUnchanged);
    const cmOpUnchanged = planGenUnchanged.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000102');

    add(
      'CHECK-5',
      'Content Master unchanged diff detects matching timestamps and plans NO_CHANGE operation',
      cmUnchangedPlan?.unchangedRecords?.length === 1 && cmOpUnchanged?.operationType === 'NO_CHANGE',
      `unchangedRecords: ${cmUnchangedPlan?.unchangedRecords?.length}; plannedOp: ${cmOpUnchanged?.operationType}`
    );

    // ------------------------------------------------------------------------
    // CHECK 6: CM parent dependencies validate (categoryId, topicId, subtopicId, createdBy)
    // ------------------------------------------------------------------------
    const snapMissingParent = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000199', 'Broken Master', 'DRAFT', 'NON_EXISTENT_CAT', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const planMissingParent = await planService.generatePlan(snapMissingParent);
    const cmOpBlocked = planMissingParent.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000199');

    add(
      'CHECK-6',
      'Content Master with non-existent parent dependency is blocked fail-closed',
      cmOpBlocked?.operationType === 'BLOCKED' &&
      cmOpBlocked?.reason?.includes('Missing parent dependency') === true,
      `OperationType: ${cmOpBlocked?.operationType}; Reason: ${cmOpBlocked?.reason}`
    );

    // ------------------------------------------------------------------------
    // CHECK 7: CM restore creates missing records in repository
    // ------------------------------------------------------------------------
    const snapExecCreate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000301', 'Economy Master 1', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const execResultCreate = await executionService.executeRestore({
      snapshot: snapExecCreate,
      explicitConfirmation: 'RESTORE ALL DATA',
      actor: { id: 'USR-001', role: 'ADMIN' },
    });

    const createdInRepo = await contentMastersRepository.findById('BP-MST-000301');

    add(
      'CHECK-7',
      'Full restore execution successfully inserts new Content Master into database',
      execResultCreate.status === 'SUCCESS' &&
      createdInRepo !== null &&
      createdInRepo.title === 'Economy Master 1',
      `Execution status: ${execResultCreate.status}; Created record title: ${createdInRepo?.title}`
    );

    // ------------------------------------------------------------------------
    // CHECK 8: CM restore updates modified records in repository
    // ------------------------------------------------------------------------
    const snapExecUpdate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000301', 'Economy Master 1 (Updated)', 'ACTIVE', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-09-01T10:00:00.000Z', '2099-01-01T12:00:00.000Z'],
          ],
        },
      },
    });

    const execResultUpdate = await executionService.executeRestore({
      snapshot: snapExecUpdate,
      explicitConfirmation: 'RESTORE ALL DATA',
      actor: { id: 'USR-001', role: 'ADMIN' },
    });

    const updatedInRepo = await contentMastersRepository.findById('BP-MST-000301');

    add(
      'CHECK-8',
      'Full restore execution successfully updates existing Content Master record in database',
      execResultUpdate.status === 'SUCCESS' &&
      updatedInRepo !== null &&
      updatedInRepo.title === 'Economy Master 1 (Updated)' &&
      updatedInRepo.status === 'ACTIVE',
      `Execution status: ${execResultUpdate.status}; Errors: ${execResultUpdate.errors.join('; ')}; Updated title: ${updatedInRepo?.title}, status: ${updatedInRepo?.status}`
    );

    // ------------------------------------------------------------------------
    // CHECK 9: Immutable CM IDs are preserved exactly
    // ------------------------------------------------------------------------
    add(
      'CHECK-9',
      'Immutable Content Master IDs are preserved exactly without ID reallocation or alteration',
      createdInRepo?.id === 'BP-MST-000301' && updatedInRepo?.id === 'BP-MST-000301',
      `Persisted ID: ${updatedInRepo?.id}`
    );

    // ------------------------------------------------------------------------
    // CHECK 10: Question restore succeeds after CM restore
    // ------------------------------------------------------------------------
    const snapLinked = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000401', 'Geography Master 1', 'ACTIVE', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', 'BP-Q-000401', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
        QUESTIONS: {
          sheetName: 'QUESTIONS',
          headers: ['id', 'questionText', 'categoryId', 'topicId', 'subtopicId', 'contentMasterId', 'status', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-Q-000401', 'What is the capital of India?', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', 'BP-MST-000401', 'ACTIVE', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const planLinked = await planService.generatePlan(snapLinked);
    const cmOrder = planLinked.worksheetPlans['CONTENT_MASTERS']?.order;
    const qOrder = planLinked.worksheetPlans['QUESTIONS']?.order;
    const qOp = planLinked.worksheetPlans['QUESTIONS']?.operations.find(o => o.recordId === 'BP-Q-000401');

    add(
      'CHECK-10',
      'Questions restore succeeds after Content Master in dependency order (CM order < Q order)',
      cmOrder !== undefined && qOrder !== undefined && cmOrder < qOrder && qOp?.operationType === 'CREATE',
      `CM order: ${cmOrder}; Q order: ${qOrder}; Question Operation: ${qOp?.operationType}`
    );

    // ------------------------------------------------------------------------
    // CHECK 11: Question.contentMasterId links to restored CM in execution
    // ------------------------------------------------------------------------
    const execLinked = await executionService.executeRestore({
      snapshot: snapLinked,
      explicitConfirmation: 'RESTORE ALL DATA',
      actor: { id: 'USR-001', role: 'ADMIN' },
    });

    const restoredQ = await questionsRepository.findById('BP-Q-000401');
    const restoredCM = await contentMastersRepository.findById('BP-MST-000401');

    add(
      'CHECK-11',
      'Restored Question successfully resolves and links to newly restored Content Master ID',
      execLinked.status === 'SUCCESS' &&
      restoredQ !== null &&
      restoredCM !== null &&
      restoredQ.contentMasterId === 'BP-MST-000401',
      `Execution status: ${execLinked.status}; Errors: ${execLinked.errors.join('; ')}; Restored Q contentMasterId: ${restoredQ?.contentMasterId}; Restored CM ID: ${restoredCM?.id}`
    );

    // ------------------------------------------------------------------------
    // CHECK 12: CONTENT_MASTER sequence rollback is rejected
    // ------------------------------------------------------------------------
    // Production sequence is at 10; snapshot tries to set 5
    const snapSeqRollback = buildMockSnapshot({
      worksheets: {
        SEQUENCES: {
          sheetName: 'SEQUENCES',
          headers: ['entityType', 'nextNumber', 'updatedAt'],
          rows: [
            ['CONTENT_MASTER', '5', '2026-08-01T00:00:00.000Z'],
          ],
        },
      },
      sequences: [
        { entityType: 'CONTENT_MASTER', entityName: 'CONTENT_MASTER', nextNumber: 5, currentValue: 5 },
      ],
    });

    const preflightSeqRollback = await preflightService.preflightSnapshot(snapSeqRollback);
    const hasRollbackWarning = preflightSeqRollback.sequenceWarnings.some(w =>
      w.toLowerCase().includes('sequence rollback') && w.includes('CONTENT_MASTER')
    );

    add(
      'CHECK-12',
      'CONTENT_MASTER sequence rollback is detected and blocks execution',
      preflightSeqRollback.status === 'BLOCKED' && hasRollbackWarning,
      `Preflight status: ${preflightSeqRollback.status}; Sequence warnings: ${preflightSeqRollback.sequenceWarnings.join('; ')}`
    );

    // ------------------------------------------------------------------------
    // CHECK 13: Granular CONTENT_MASTER preflight lookup works
    // ------------------------------------------------------------------------
    const snapGranular = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000501', 'Granular Test Master', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const granularVal = await validatorService.validateRestore({
      snapshot: snapGranular,
      scope: 'GRANULAR_RECORD',
      entityType: 'CONTENT_MASTERS',
      entityIds: ['BP-MST-000501'],
    });

    add(
      'CHECK-13',
      'Granular CONTENT_MASTER preflight validation successfully discovers and plans single record',
      granularVal.valid &&
      granularVal.recordsToCreate.length === 1 &&
      granularVal.recordsToCreate[0].recordId === 'BP-MST-000501',
      `Valid: ${granularVal.valid}; recordsToCreate: ${granularVal.recordsToCreate.length}`
    );

    // ------------------------------------------------------------------------
    // CHECK 14: CM without primaryQuestionId restores successfully
    // ------------------------------------------------------------------------
    const snapNoPrimaryQ = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000601', 'Master Without Primary Question', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const planNoPrimaryQ = await planService.generatePlan(snapNoPrimaryQ);
    const opNoPrimaryQ = planNoPrimaryQ.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000601');

    add(
      'CHECK-14',
      'Content Master without primaryQuestionId is planned cleanly as CREATE without blocking',
      opNoPrimaryQ?.operationType === 'CREATE' && planNoPrimaryQ.status === 'READY',
      `Operation: ${opNoPrimaryQ?.operationType}; Plan status: ${planNoPrimaryQ.status}; conflicts: ${planNoPrimaryQ.conflictCount}; depErrors: ${planNoPrimaryQ.dependencyErrorCount}; seqWarnings: ${planNoPrimaryQ.sequenceWarningCount}; wpIssues: ${JSON.stringify(Object.values(planNoPrimaryQ.worksheetPlans).flatMap(w => w.blockingIssues))}`
    );

    // ------------------------------------------------------------------------
    // CHECK 15: Populated primaryQuestionId is checked against snapshot Questions without blocking CM insertion
    // ------------------------------------------------------------------------
    const snapMissingQWarning = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000701', 'Master With Unbundled Question', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', 'BP-Q-NONEXISTENT', 'USR-001', '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const restoreMissingQ = await restoreService.planFullRestore(snapMissingQWarning);
    const planMissingQ = await planService.generatePlan(snapMissingQWarning);
    const opMissingQ = planMissingQ.worksheetPlans['CONTENT_MASTERS']?.operations.find(o => o.recordId === 'BP-MST-000701');

    const warningLogged =
      restoreMissingQ.validationWarnings.some(w => w.includes('primaryQuestionId') && w.includes('BP-Q-NONEXISTENT')) ||
      opMissingQ?.reason?.includes('BP-Q-NONEXISTENT') === true;

    add(
      'CHECK-15',
      'Populated primaryQuestionId missing from snapshot generates non-blocking warning and still plans CREATE',
      opMissingQ?.operationType === 'CREATE' && warningLogged,
      `Operation: ${opMissingQ?.operationType}; WarningLogged: ${warningLogged}; Reason: ${opMissingQ?.reason}`
    );

    // ------------------------------------------------------------------------
    // CHECK 16: Linked CM + Question snapshot restores without orphaning either side
    // ------------------------------------------------------------------------
    const snapCoRestored = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000801', 'Co-Restored Master', 'ACTIVE', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', 'BP-Q-000801', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
        QUESTIONS: {
          sheetName: 'QUESTIONS',
          headers: ['id', 'questionText', 'categoryId', 'topicId', 'subtopicId', 'contentMasterId', 'status', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-Q-000801', 'Co-Restored Question Text', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', 'BP-MST-000801', 'ACTIVE', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
      },
    });

    const execCoRestored = await executionService.executeRestore({
      snapshot: snapCoRestored,
      explicitConfirmation: 'RESTORE ALL DATA',
      actor: { id: 'USR-001', role: 'ADMIN' },
    });

    const cm801 = await contentMastersRepository.findById('BP-MST-000801');
    const q801 = await questionsRepository.findById('BP-Q-000801');

    const noOrphans =
      execCoRestored.status === 'SUCCESS' &&
      cm801 !== null &&
      q801 !== null &&
      cm801.primaryQuestionId === q801.id &&
      q801.contentMasterId === cm801.id;

    add(
      'CHECK-16',
      'Linked CM + Question snapshot restores bidirectionally without orphaning either side',
      noOrphans,
      `Execution status: ${execCoRestored.status}; Errors: ${execCoRestored.errors.join('; ')}; CM.primaryQuestionId: ${cm801?.primaryQuestionId}; Q.contentMasterId: ${q801?.contentMasterId}`
    );

    // ------------------------------------------------------------------------
    // GRANULAR EXECUTION VERIFICATION (Checks 17 - 23)
    // ------------------------------------------------------------------------
    const granularService = GranularContentMasterRestoreService.getInstance();

    const snapGranularExec = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000901', 'Granular Test Master', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
      },
    });

    // CHECK-17: ADMIN + correct confirmation can execute
    const resAdmin = await granularService.restoreContentMaster({
      snapshot: snapGranularExec,
      contentMasterId: 'BP-MST-000901',
      explicitConfirmation: 'RESTORE CONTENT MASTER',
      actor: { id: 'USR-001', name: 'Admin User', role: 'ADMIN' },
    });
    add(
      'CHECK-17',
      'ADMIN with correct confirmation phrase successfully executes granular restore',
      resAdmin.success === true && resAdmin.persisted === true,
      `Success: ${resAdmin.success}, Operation: ${resAdmin.operation}`
    );

    // CHECK-18: Non-ADMIN is rejected
    const resNonAdmin = await granularService.restoreContentMaster({
      snapshot: snapGranularExec,
      contentMasterId: 'BP-MST-000901',
      explicitConfirmation: 'RESTORE CONTENT MASTER',
      actor: { id: 'USR-002', name: 'Writer User', role: 'WRITER' },
    });
    add(
      'CHECK-18',
      'Non-ADMIN actor is rejected from executing granular restore',
      resNonAdmin.success === false && resNonAdmin.operation === 'REJECTED',
      `Success: ${resNonAdmin.success}, Error: ${resNonAdmin.error}`
    );

    // CHECK-19: Incorrect confirmation is rejected
    const resBadConf = await granularService.restoreContentMaster({
      snapshot: snapGranularExec,
      contentMasterId: 'BP-MST-000901',
      explicitConfirmation: 'RESTORE WRONG PHRASE',
      actor: { id: 'USR-001', name: 'Admin User', role: 'ADMIN' },
    });
    add(
      'CHECK-19',
      'Incorrect confirmation phrase is rejected fail-closed',
      resBadConf.success === false && resBadConf.operation === 'REJECTED',
      `Success: ${resBadConf.success}, Error: ${resBadConf.error}`
    );

    // CHECK-20: Valid missing CM performs CREATE
    const snapGranularCreate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000902', 'Granular Create Master', 'DRAFT', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-01T10:00:00.000Z'],
          ],
        },
      },
    });
    const resCreate = await granularService.restoreContentMaster({
      snapshot: snapGranularCreate,
      contentMasterId: 'BP-MST-000902',
      explicitConfirmation: 'RESTORE CONTENT MASTER',
      actor: { id: 'USR-001', name: 'Admin User', role: 'ADMIN' },
    });
    const cmCreated = await contentMastersRepository.findById('BP-MST-000902');
    add(
      'CHECK-20',
      'Valid missing Content Master performs CREATE operation and persists record',
      resCreate.success === true && resCreate.operation === 'CREATE' && cmCreated !== null,
      `Operation: ${resCreate.operation}, Persisted: ${cmCreated?.id}`
    );

    // CHECK-21: Valid existing CM performs UPDATE
    const snapGranularUpdate = buildMockSnapshot({
      worksheets: {
        CONTENT_MASTERS: {
          sheetName: 'CONTENT_MASTERS',
          headers: ['id', 'title', 'status', 'categoryId', 'topicId', 'subtopicId', 'primaryQuestionId', 'createdBy', 'createdAt', 'updatedAt'],
          rows: [
            ['BP-MST-000902', 'Granular Create Master (Updated Title)', 'ACTIVE', 'BP-CAT-000001', 'BP-TOP-000001', 'BP-SUB-000001', '', 'USR-001', '2099-01-01T10:00:00.000Z', '2099-01-02T10:00:00.000Z'],
          ],
        },
      },
    });
    const resUpdate = await granularService.restoreContentMaster({
      snapshot: snapGranularUpdate,
      contentMasterId: 'BP-MST-000902',
      explicitConfirmation: 'RESTORE CONTENT MASTER',
      actor: { id: 'USR-001', name: 'Admin User', role: 'ADMIN' },
    });
    const cmUpdated = await contentMastersRepository.findById('BP-MST-000902');
    add(
      'CHECK-21',
      'Valid existing Content Master performs UPDATE operation and mutates record',
      resUpdate.success === true && resUpdate.operation === 'UPDATE' && cmUpdated?.title === 'Granular Create Master (Updated Title)',
      `Operation: ${resUpdate.operation}, Updated Title: ${cmUpdated?.title}`
    );

    // CHECK-22: Immutable ID is preserved
    add(
      'CHECK-22',
      'Granular restore strictly preserves immutable Content Master ID',
      cmUpdated?.id === 'BP-MST-000902',
      `Expected: BP-MST-000902, Actual: ${cmUpdated?.id}`
    );

    // CHECK-23: Invalid snapshot/record is rejected without a write
    const resInvalidRecord = await granularService.restoreContentMaster({
      snapshot: snapGranularExec,
      contentMasterId: 'BP-MST-NONEXISTENT',
      explicitConfirmation: 'RESTORE CONTENT MASTER',
      actor: { id: 'USR-001', name: 'Admin User', role: 'ADMIN' },
    });
    const cmNonExistent = await contentMastersRepository.findById('BP-MST-NONEXISTENT');
    add(
      'CHECK-23',
      'Missing or invalid snapshot record is rejected without performing a database write',
      resInvalidRecord.success === false && resInvalidRecord.operation === 'REJECTED' && cmNonExistent === null,
      `Success: ${resInvalidRecord.success}, Operation: ${resInvalidRecord.operation}, RecordFound: ${cmNonExistent !== null}`
    );

  } finally {
    process.env.GOOGLE_SHEETS_ID = originalSheetId;
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const passed = failedCount === 0 && passedCount === 23;

  console.log('\n==================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 16.6 RECOVERY PARITY');
  console.log('==================================================');
  for (const r of results) {
    console.log(`[${r.passed ? '✓ PASS' : '✗ FAIL'}] ${r.step}: ${r.name}`);
    if (r.details) {
      console.log(`       Details: ${r.details}`);
    }
  }
  console.log('--------------------------------------------------');
  console.log(`SUMMARY: ${passed ? 'PASSED' : 'FAILED'} (${passedCount}/${results.length} checks passed)`);
  console.log('==================================================\n');

  return {
    passed,
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('phase16-step6-recovery-parity')) {
  runPhase16Step6Verification().then(res => {
    if (!res.passed) {
      process.exit(1);
    }
  }).catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
