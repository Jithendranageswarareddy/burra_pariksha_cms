/**
 * BURRA PARIKSHA CMS - Task 2 Verification Suite
 * Canonical Content Master & Data Model Automated Test Verification
 */

import {
  ALL_SHEET_TABS,
  ID_PREFIX_MAP,
  SEQUENCE_ENTITIES,
  SHEET_SCHEMAS,
  SHEET_TABS,
} from '../lib/schemas/google-sheets-schema';
import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
} from '../lib/repositories';
import { IdService } from '../lib/services/id.service';
import { sequenceSafetyService } from '../lib/services/sequence-safety.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { questionService } from '../lib/services/question.service';
import { videoService } from '../lib/services/video.service';
import { dashboardService } from '../lib/services/dashboard.service';
import { FULL_RESTORE_ENTITY_ORDER } from '../lib/services/full-snapshot-restore.service';
import { productionSheetInitializer } from '../lib/services/production-sheet-initializer.service';
import { ContentMasterStatus, DifficultyLevel, QuestionStatus, PriorityLevel } from '../types';

export interface Task2VerificationResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Array<{
    check: string;
    status: 'PASS' | 'FAIL';
    details: string;
  }>;
  summary: {
    sheetTabsVerified: boolean;
    sequenceVerified: boolean;
    repositoryVerified: boolean;
    migrationEngineVerified: boolean;
    hierarchy360Verified: boolean;
  };
}

export async function runTask2Verification(): Promise<Task2VerificationResult> {
  // Force memory fallback mode for deterministic unit verification
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = '';

  const checks: Task2VerificationResult['results'] = [];
  const idService = IdService.getInstance();

  function record(check: string, condition: boolean, details: string) {
    checks.push({
      check,
      status: condition ? 'PASS' : 'FAIL',
      details,
    });
  }

  // 1. SHEET_TABS & ALL_SHEET_TABS includes CONTENT_MASTERS
  const hasSheetTab = (SHEET_TABS as any).CONTENT_MASTERS === 'CONTENT_MASTERS';
  const inAllSheetTabs = (ALL_SHEET_TABS as string[]).includes('CONTENT_MASTERS');
  record(
    '1. Sheet Tabs Registration',
    hasSheetTab && inAllSheetTabs,
    `SHEET_TABS.CONTENT_MASTERS: ${hasSheetTab}, ALL_SHEET_TABS contains CONTENT_MASTERS: ${inAllSheetTabs}`
  );

  // 2. SEQUENCE_ENTITIES & ID_PREFIX_MAP includes CONTENT_MASTER
  const hasSeqEntity = (SEQUENCE_ENTITIES as any).CONTENT_MASTER === 'CONTENT_MASTER';
  const prefixConfig = ID_PREFIX_MAP[SEQUENCE_ENTITIES.CONTENT_MASTER];
  const validPrefix = prefixConfig && prefixConfig.prefix === 'BP-MST-' && prefixConfig.padLength === 6;
  record(
    '2. Sequence Entity Registration',
    Boolean(hasSeqEntity && validPrefix),
    `SEQUENCE_ENTITIES.CONTENT_MASTER: ${hasSeqEntity}, Prefix: ${prefixConfig?.prefix}, PadLength: ${prefixConfig?.padLength}`
  );

  // 3. SHEET_SCHEMAS[CONTENT_MASTERS] definition
  const masterSchema = SHEET_SCHEMAS[SHEET_TABS.CONTENT_MASTERS];
  const validSchema = Boolean(
    masterSchema &&
    masterSchema.primaryKey === 'id' &&
    masterSchema.columns.some((c) => c.name === 'id') &&
    masterSchema.columns.some((c) => c.name === 'title') &&
    masterSchema.columns.some((c) => c.name === 'primary_question_id')
  );
  record(
    '3. SHEET_SCHEMAS Contract',
    validSchema,
    `Schema columns count: ${masterSchema?.columns?.length || 0}, Primary key: ${masterSchema?.primaryKey}`
  );

  // 4. IdService.allocateContentMasterId()
  let testMasterId = '';
  try {
    testMasterId = await idService.allocateContentMasterId();
    const validFormat = /^BP-MST-\d{6}$/.test(testMasterId);
    record(
      '4. ID Generation (BP-MST-******)',
      validFormat,
      `Generated ID: ${testMasterId}, Match: ${validFormat}`
    );
  } catch (err: any) {
    record('4. ID Generation (BP-MST-******)', false, `Error: ${err?.message || err}`);
  }

  // 5. SequenceSafetyService scans CONTENT_MASTER
  try {
    const maxId = await sequenceSafetyService.getMaxAllocatedIdForEntity(SEQUENCE_ENTITIES.CONTENT_MASTER);
    record(
      '5. Sequence Safety Diagnostic',
      typeof maxId === 'number',
      `Discovered max numeric ID for CONTENT_MASTER: ${maxId}`
    );
  } catch (err: any) {
    record('5. Sequence Safety Diagnostic', false, `Error: ${err?.message || err}`);
  }

  // 6. ContentMastersRepository CRUD
  let createdMaster: any = null;
  try {
    const sampleId = await idService.allocateContentMasterId();
    createdMaster = await contentMastersRepository.create({
      id: sampleId,
      title: 'Verification Sample Master',
      status: ContentMasterStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const found = await contentMastersRepository.findById(sampleId);
    const success = Boolean(found && found.id === sampleId && found.title === 'Verification Sample Master');
    record(
      '6. ContentMastersRepository Persistence',
      success,
      `Created and retrieved Content Master ${sampleId}`
    );
  } catch (err: any) {
    record('6. ContentMastersRepository Persistence', false, `Error: ${err?.message || err}`);
  }

  // 7. ContentMasterService.createContentMaster()
  let serviceCreatedMaster: any = null;
  try {
    serviceCreatedMaster = await contentMasterService.createContentMaster(
      {
        title: 'Task 2 Test Master Entity',
        status: ContentMasterStatus.ACTIVE,
      },
      'USR-TEST',
      'Test Suite'
    );
    const valid = Boolean(serviceCreatedMaster && serviceCreatedMaster.id.startsWith('BP-MST-'));
    record(
      '7. ContentMasterService.createContentMaster()',
      valid,
      `Created Master ID: ${serviceCreatedMaster?.id}`
    );
  } catch (err: any) {
    record('7. ContentMasterService.createContentMaster()', false, `Error: ${err?.message || err}`);
  }

  // 8. QuestionService auto-assigns contentMasterId
  let createdQuestion: any = null;
  try {
    const cats = await categoriesRepository.findAll();
    const tops = await topicsRepository.findAll();
    const subs = await subtopicsRepository.findAll();

    const cat = cats[0] || { id: 'CAT-001', name: 'General' };
    const top = tops[0] || { id: 'TOP-001', name: 'General' };
    const sub = subs[0] || { id: 'SUB-001', name: 'General' };

    createdQuestion = await questionService.createQuestion(
      {
        categoryId: cat.id,
        topicId: top.id,
        subtopicId: sub.id,
        difficulty: DifficultyLevel.MEDIUM,
        questionText: 'What is the sum of angles in a triangle?',
        options: { a: '90°', b: '180°', c: '270°', d: '360°' },
        correctAnswer: 'B',
        explanation: 'Sum of interior angles in a triangle is always 180 degrees.',
      },
      { id: 'USR-TEST', name: 'Test Runner' }
    );

    const hasMasterId = Boolean(createdQuestion.contentMasterId && createdQuestion.contentMasterId.startsWith('BP-MST-'));
    record(
      '8. QuestionService Auto ContentMaster Association',
      hasMasterId,
      `Question ${createdQuestion.id} assigned contentMasterId: ${createdQuestion.contentMasterId}`
    );
  } catch (err: any) {
    record('8. QuestionService Auto ContentMaster Association', false, `Error: ${err?.message || err}`);
  }

  // 9. VideoService inherits contentMasterId on queueing
  try {
    if (createdQuestion) {
      // Approve question first
      createdQuestion.status = QuestionStatus.APPROVED;
      await questionsRepository.update(createdQuestion);

      const queuedVideo = await videoService.queueApprovedQuestion(
        {
          questionId: createdQuestion.id,
          priority: PriorityLevel.NORMAL,
        },
        { id: 'USR-TEST', name: 'Test Runner' }
      );

      const inherited = Boolean(queuedVideo.contentMasterId && queuedVideo.contentMasterId === createdQuestion.contentMasterId);
      record(
        '9. VideoService ContentMaster Inheritance',
        inherited,
        `Video ${queuedVideo.id} inherited contentMasterId: ${queuedVideo.contentMasterId}`
      );
    } else {
      record('9. VideoService ContentMaster Inheritance', false, 'Skipped because question creation failed');
    }
  } catch (err: any) {
    record('9. VideoService ContentMaster Inheritance', false, `Error: ${err?.message || err}`);
  }

  // 10. Migration Engine Dry Run
  try {
    const dryRun = await contentMasterService.migrationDryRun();
    const valid = typeof dryRun.totalQuestionsExamined === 'number' && Array.isArray(dryRun.proposedMasterMappings);
    record(
      '10. Migration Engine Dry-Run',
      valid,
      `Questions examined: ${dryRun.totalQuestionsExamined}, Proposed mappings: ${dryRun.proposedMasterMappings.length}`
    );
  } catch (err: any) {
    record('10. Migration Engine Dry-Run', false, `Error: ${err?.message || err}`);
  }

  // 11. Migration Execution (Idempotent)
  try {
    const execResult = await contentMasterService.executeMigration('USR-TEST', 'Test Suite Migration');
    record(
      '11. Migration Engine Execution',
      execResult.success,
      `Masters created: ${execResult.mastersCreatedCount}, Questions updated: ${execResult.questionsUpdatedCount}, Videos updated: ${execResult.videosUpdatedCount}`
    );
  } catch (err: any) {
    record('11. Migration Engine Execution', false, `Error: ${err?.message || err}`);
  }

  // 12. 360-Degree Hierarchy Resolution
  try {
    if (createdQuestion?.contentMasterId) {
      const details = await contentMasterService.getDetailsByContentMasterId(createdQuestion.contentMasterId);
      const valid = Boolean(
        details &&
        details.contentMaster.id === createdQuestion.contentMasterId &&
        details.questions.some((q) => q.id === createdQuestion.id) &&
        details.videos.length > 0
      );
      record(
        '12. 360-Degree Content Hierarchy Retrieval',
        valid,
        `Details retrieved for Master ${createdQuestion.contentMasterId}: ${details?.questions?.length} Questions, ${details?.videos?.length} Videos`
      );
    } else {
      record('12. 360-Degree Content Hierarchy Retrieval', false, 'Skipped because no master ID was created');
    }
  } catch (err: any) {
    record('12. 360-Degree Content Hierarchy Retrieval', false, `Error: ${err?.message || err}`);
  }

  // 13. FULL_RESTORE_ENTITY_ORDER includes CONTENT_MASTERS
  const inRestoreOrder = (FULL_RESTORE_ENTITY_ORDER as readonly string[]).includes('CONTENT_MASTERS');
  record(
    '13. FULL_RESTORE_ENTITY_ORDER Registration',
    inRestoreOrder,
    `FULL_RESTORE_ENTITY_ORDER includes CONTENT_MASTERS: ${inRestoreOrder}`
  );

  // 14. Dashboard Search Indexing
  try {
    if (createdQuestion?.contentMasterId) {
      const searchResults = await dashboardService.search(createdQuestion.contentMasterId);
      const foundMasterResult = searchResults.some((r) => r.id === createdQuestion.contentMasterId);
      record(
        '14. Dashboard Global Search Indexing',
        foundMasterResult,
        `Global search for ${createdQuestion.contentMasterId} returned ${searchResults.length} results (Master found: ${foundMasterResult})`
      );
    } else {
      record('14. Dashboard Global Search Indexing', false, 'Skipped because no master ID was created');
    }
  } catch (err: any) {
    record('14. Dashboard Global Search Indexing', false, `Error: ${err?.message || err}`);
  }

  // 15. Content Master API Security & RBAC Middleware Verification
  try {
    const { requireAuth, requireRole } = await import('../server/middleware/auth.middleware');
    const { UserRole } = await import('../types');

    let authStatusCode = 0;
    let authErrorMsg = '';
    const mockResUnauth: any = {
      status: (code: number) => {
        authStatusCode = code;
        return {
          json: (body: any) => {
            authErrorMsg = body?.error || '';
          },
        };
      },
    };

    // Test 15a: Unauthenticated request rejected by requireAuth
    const mockReqUnauth: any = { headers: {} };
    let nextCalled = false;
    requireAuth(mockReqUnauth, mockResUnauth, () => {
      nextCalled = true;
    });

    const unauthRejected = authStatusCode === 401 && !nextCalled;

    // Test 15b: Non-admin request rejected for admin-only migration execute route
    let roleStatusCode = 0;
    const mockResForbidden: any = {
      status: (code: number) => {
        roleStatusCode = code;
        return { json: () => {} };
      },
    };
    const mockReqEditor: any = {
      headers: {},
      user: { id: 'USR-002', name: 'Editor User', role: UserRole.QUESTION_EDITOR },
    };
    let roleNextCalled = false;
    const adminMiddleware = requireRole([UserRole.ADMIN]);
    adminMiddleware(mockReqEditor, mockResForbidden, () => {
      roleNextCalled = true;
    });

    const roleRejected = roleStatusCode === 403 && !roleNextCalled;

    // Test 15c: Admin request authorized for admin migration execute route
    let adminNextCalled = false;
    const mockReqAdmin: any = {
      headers: {},
      user: { id: 'USR-001', name: 'Admin User', role: UserRole.ADMIN },
    };
    adminMiddleware(mockReqAdmin, mockResForbidden, () => {
      adminNextCalled = true;
    });

    const adminAllowed = adminNextCalled;

    record(
      '15. Content Master API Security & RBAC Verification',
      Boolean(unauthRejected && roleRejected && adminAllowed),
      `Unauth rejected (401): ${unauthRejected}, Non-Admin execute rejected (403): ${roleRejected}, Admin execute allowed: ${adminAllowed}`
    );
  } catch (err: any) {
    record('15. Content Master API Security & RBAC Verification', false, `Error: ${err?.message || err}`);
  }

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;

  process.env.GOOGLE_SHEETS_ID = originalSheetId;

  return {
    passed: failedChecks === 0,
    totalChecks,
    passedChecks,
    failedChecks,
    results: checks,
    summary: {
      sheetTabsVerified: checks[0].status === 'PASS',
      sequenceVerified: checks[1].status === 'PASS',
      repositoryVerified: checks[5].status === 'PASS',
      migrationEngineVerified: checks[9].status === 'PASS' && checks[10].status === 'PASS',
      hierarchy360Verified: checks[11].status === 'PASS',
    },
  };
}
