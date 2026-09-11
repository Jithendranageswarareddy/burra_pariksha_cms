/**
 * BURRA PARIKSHA CMS — Phase 9 Automated Live Backend Smoke Test
 *
 * Strictly tests Phase 9 Content Planning & Workflow against LIVE Google Sheets:
 * - Deterministic / non-AI execution (Zero Gemini, Groq, xAI calls)
 * - Strict ₹0 investment
 * - Live Google Sheets persistence and read-back for CONTENT_PLANS & CONTENT_BATCHES
 * - Foreign-key relationships (Plan <-> Batch, Question <-> Batch, Question <-> Content Master)
 * - Valid and invalid status transitions & validation guards
 * - Idempotency verification
 * - Live WORKFLOW and AUDIT_LOG persistence
 * - Guaranteed complete cleanup with monotonic sequence preservation
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { contentPlansRepository } from '../src/lib/repositories/content-plans.repository';
import { contentBatchesRepository } from '../src/lib/repositories/content-batches.repository';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { authService } from '../src/lib/services/auth.service';
import { planningService } from '../src/lib/services/planning.service';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { workflowService } from '../src/lib/services/workflow.service';
import { GeminiService } from '../src/lib/ai/gemini.service';
import { geminiClient } from '../src/lib/ai/gemini.client';
import { apiRouter } from '../src/server/routes';
import {
  ContentBatchStatus,
  ContentPlanStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStyle,
  UserRole,
} from '../src/types';

interface SheetSnapshot {
  CONTENT_PLANS: number;
  CONTENT_BATCHES: number;
  CONTENT_MASTERS: number;
  QUESTIONS: number;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
  CATEGORIES: number;
  TOPICS: number;
  SUBTOPICS: number;
  planSequenceValue: number;
  batchSequenceValue: number;
  cmSequenceValue: number;
  questionSequenceValue: number;
  timestamp: string;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const countSheet = async (sheetName: string): Promise<number> => {
    const res = await googleSheetsClient.getRows(sheetName);
    return res.rows.length;
  };

  const pln = await countSheet('CONTENT_PLANS');
  const bch = await countSheet('CONTENT_BATCHES');
  const cm = await countSheet('CONTENT_MASTERS');
  const q = await countSheet('QUESTIONS');
  const wf = await countSheet('WORKFLOW');
  const al = await countSheet('AUDIT_LOG');
  const seqRes = await googleSheetsClient.getRows('SEQUENCES');
  const cat = await countSheet('CATEGORIES');
  const top = await countSheet('TOPICS');
  const sub = await countSheet('SUBTOPICS');

  const planSeqRow = seqRes.rows.find((r) => r[0] === 'CONTENT_PLAN');
  const batchSeqRow = seqRes.rows.find((r) => r[0] === 'CONTENT_BATCH');
  const cmSeqRow = seqRes.rows.find((r) => r[0] === 'CONTENT_MASTER');
  const questionSeqRow = seqRes.rows.find((r) => r[0] === 'QUESTION');

  return {
    CONTENT_PLANS: pln,
    CONTENT_BATCHES: bch,
    CONTENT_MASTERS: cm,
    QUESTIONS: q,
    WORKFLOW: wf,
    AUDIT_LOG: al,
    SEQUENCES: seqRes.rows.length,
    CATEGORIES: cat,
    TOPICS: top,
    SUBTOPICS: sub,
    planSequenceValue: planSeqRow ? Number(planSeqRow[1]) : 0,
    batchSequenceValue: batchSeqRow ? Number(batchSeqRow[1]) : 0,
    cmSequenceValue: cmSeqRow ? Number(cmSeqRow[1]) : 0,
    questionSequenceValue: questionSeqRow ? Number(questionSeqRow[1]) : 0,
    timestamp: new Date().toISOString(),
  };
}

export async function runPhase9LiveSmokeTest() {
  console.log('===============================================================');
  console.log('PHASE 9: CONTROLLED AUTOMATED LIVE CONTENT PLANNING SMOKE TEST');
  console.log('===============================================================\n');

  // Track AI call attempts — MUST REMAIN 0
  let aiCallAttempts = 0;

  // STRICT ZERO AI ENFORCEMENT:
  // Disarm all live AI client calls in memory during this deterministic smoke test
  const originalIsConfigured = geminiClient.isConfigured.bind(geminiClient);
  geminiClient.isConfigured = () => false;

  const geminiInstance = GeminiService.getInstance();
  const originalCallGemini = (geminiInstance as any).callGeminiWithRetryAndFallback;
  (geminiInstance as any).callGeminiWithRetryAndFallback = async () => {
    aiCallAttempts++;
    throw new Error('STRICT CONSTRAINT VIOLATION: AI network call attempted during deterministic smoke test!');
  };

  // Track synthetic artifacts for guaranteed cleanup
  let createdPlanId: string | null = null;
  let createdBatchId: string | null = null;
  const createdWorkflowIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  // Start Express server for routes
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  const adminToken = authService.generateSessionToken({
    userId: 'USR-ADMIN-P9-SMOKE',
    name: 'Phase 9 Smoke Admin',
    role: UserRole.ADMIN,
  });

  const testActor = {
    id: 'USR-ADMIN-P9-SMOKE',
    name: 'Phase 9 Smoke Admin',
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Capture Pre-test Authoritative Snapshot
    // -------------------------------------------------------------------------
    console.log('--- Step 0: Capturing Pre-Test Live Database Snapshot ---');
    const preSnapshot = await getLiveSnapshot();
    console.log('Pre-test snapshot:', JSON.stringify(preSnapshot, null, 2));

    // Capture existing audit log IDs prior to test writes
    const preAuditLogs = await auditLogRepository.findAll();
    const preAuditLogIdSet = new Set(preAuditLogs.map((l) => l.id));

    // -------------------------------------------------------------------------
    // STEP 1: Taxonomy Validation Check
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Validating Known Taxonomy Triplet ---');
    const targetCategory = 'CAT-QA';
    const targetTopic = 'TOP-QA-01';
    const targetSubtopic = 'SUB-QA-01-01';

    const taxonomyResult = await taxonomyService.validateTaxonomy(
      targetCategory,
      targetTopic,
      targetSubtopic
    );

    const test1Passed =
      !!taxonomyResult.category &&
      taxonomyResult.category.id === targetCategory &&
      !!taxonomyResult.topic &&
      taxonomyResult.topic.id === targetTopic &&
      !!taxonomyResult.subtopic &&
      taxonomyResult.subtopic.id === targetSubtopic;

    console.log(`Test 1 — Valid taxonomy hierarchy verified: ${test1Passed ? 'PASSED' : 'FAILED'}`);
    if (!test1Passed) throw new Error('Taxonomy validation failed');

    // -------------------------------------------------------------------------
    // STEP 2: Create Synthetic Content Plan
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Creating Synthetic Content Plan via Planning Service ---');
    const planInput = {
      categoryId: targetCategory,
      topicId: targetTopic,
      subtopicId: targetSubtopic,
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.ENGLISH,
      targetQuestionCount: 15,
      realWorldContext: 'Phase 9 live verification sprint for Time & Distance',
      questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
      priority: PriorityLevel.HIGH,
      plannedDate: new Date().toISOString().split('T')[0],
      notes: 'SYNTHETIC_TEST_P9_LIVE_PLAN',
    };

    const createdPlan = await planningService.createContentPlan(planInput, testActor);
    createdPlanId = createdPlan.id;
    console.log(`Created Content Plan ID: ${createdPlanId}`);

    const test2Passed =
      createdPlan.id.startsWith('BP-PLN-') &&
      createdPlan.status === ContentPlanStatus.DRAFT &&
      createdPlan.categoryId === targetCategory &&
      createdPlan.topicId === targetTopic &&
      createdPlan.subtopicId === targetSubtopic &&
      createdPlan.targetQuestionCount === 15;

    console.log(`Test 2 — Content Plan created in DRAFT: ${test2Passed ? 'PASSED' : 'FAILED'}`);
    if (!test2Passed) throw new Error('Plan creation assertion failed');

    // -------------------------------------------------------------------------
    // STEP 3: Verify Persistence & Read-Back
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Verifying Plan Persistence & Read-Back ---');
    const fetchedPlan = await contentPlansRepository.findById(createdPlanId);
    const enrichedPlan = await planningService.getContentPlanById(createdPlanId);

    const test3Passed =
      fetchedPlan !== null &&
      fetchedPlan.id === createdPlanId &&
      fetchedPlan.status === ContentPlanStatus.DRAFT &&
      fetchedPlan.targetQuestionCount === 15 &&
      enrichedPlan !== null &&
      enrichedPlan.id === createdPlanId;

    console.log(`Test 3 — Content Plan persisted & read-back confirmed: ${test3Passed ? 'PASSED' : 'FAILED'}`);
    if (!test3Passed) throw new Error('Plan persistence verification failed');

    // -------------------------------------------------------------------------
    // STEP 4: Test Valid Content Plan Status Transition (DRAFT -> APPROVED)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Testing Content Plan Approval (DRAFT -> APPROVED) ---');
    const approvedPlan = await planningService.approveContentPlan(createdPlanId, testActor);
    const refetchedApprovedPlan = await contentPlansRepository.findById(createdPlanId);

    const test4Passed =
      approvedPlan.status === ContentPlanStatus.APPROVED &&
      refetchedApprovedPlan?.status === ContentPlanStatus.APPROVED;

    console.log(`Test 4 — Content Plan status transitioned to APPROVED: ${test4Passed ? 'PASSED' : 'FAILED'}`);
    if (!test4Passed) throw new Error('Plan approval transition failed');

    // -------------------------------------------------------------------------
    // STEP 5: Create Synthetic Content Batch Linked to Plan
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Creating Synthetic Content Batch Linked to Plan ---');
    const batchInput = {
      name: 'SYNTHETIC_P9_SMOKE_BATCH',
      description: 'Synthetic batch for Phase 9 live verification',
      planId: createdPlanId,
      targetCount: 5,
      priority: PriorityLevel.HIGH,
      plannedDate: new Date().toISOString().split('T')[0],
      questionIds: [],
    };

    const createdBatch = await planningService.createContentBatch(batchInput, testActor);
    createdBatchId = createdBatch.id;
    console.log(`Created Content Batch ID: ${createdBatchId}`);

    // Verify batch properties and automatic plan transition to IN_PROGRESS
    const refetchedPlanAfterBatch = await contentPlansRepository.findById(createdPlanId);
    const enrichedPlanAfterBatch = await planningService.getContentPlanById(createdPlanId);

    const test5Passed =
      createdBatch.id.startsWith('BP-BCH-') &&
      createdBatch.planId === createdPlanId &&
      createdBatch.status === ContentBatchStatus.PLANNED &&
      refetchedPlanAfterBatch?.status === ContentPlanStatus.IN_PROGRESS &&
      enrichedPlanAfterBatch?.createdBatchesCount === 1;

    console.log(`Test 5 — Batch created & Plan auto-transitioned to IN_PROGRESS: ${test5Passed ? 'PASSED' : 'FAILED'}`);
    if (!test5Passed) throw new Error('Batch creation and auto-progression failed');

    // -------------------------------------------------------------------------
    // STEP 6: Verify Plan <-> Batch Foreign Key Relationship
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Verifying Plan <-> Batch Foreign Key Relationship ---');
    const batchesForPlan = await contentBatchesRepository.findByPlanId(createdPlanId);

    const test6Passed =
      batchesForPlan.length === 1 &&
      batchesForPlan[0].id === createdBatchId &&
      batchesForPlan[0].planId === createdPlanId;

    console.log(`Test 6 — Foreign-key integrity (findByPlanId): ${test6Passed ? 'PASSED' : 'FAILED'}`);
    if (!test6Passed) throw new Error('Foreign-key query failed');

    // -------------------------------------------------------------------------
    // STEP 7: Link Existing Valid Question to Batch & Check Metrics
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Linking Existing Valid Question to Batch & Verifying Metrics ---');
    // We use known existing question 'BP-Q-1000041' which is APPROVED and has subtopic SUB-QA-01-01
    const testQuestionId = 'BP-Q-1000041';
    const existingQ = await questionsRepository.findById(testQuestionId);
    if (!existingQ) {
      throw new Error(`Target test question ${testQuestionId} not found in QUESTIONS sheet!`);
    }

    const updatedBatch = await planningService.linkBatchQuestions(
      createdBatchId,
      [testQuestionId],
      'ADD',
      testActor
    );

    // Fetch batch progress metrics
    const metrics = await planningService.getBatchProgressMetrics(createdBatchId);

    const test7Passed =
      updatedBatch.questionIds.includes(testQuestionId) &&
      updatedBatch.status === ContentBatchStatus.ACTIVE && // Auto-transitioned from PLANNED to ACTIVE
      metrics.totalAssociated === 1 &&
      metrics.approved === 1 &&
      metrics.remainingToApprove === 4 &&
      metrics.completionPercentage === 20;

    console.log(`Test 7 — Batch Question linked & metrics verified: ${test7Passed ? 'PASSED' : 'FAILED'}`);
    if (!test7Passed) throw new Error('Batch question linking and metrics assertion failed');

    // -------------------------------------------------------------------------
    // STEP 8: Verify Content Master Resolution via Linked Question
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Verifying Content Master Resolution via Linked Question ---');
    const resolvedMaster = await contentMastersRepository.findByPrimaryQuestionId(testQuestionId);

    const test8Passed =
      resolvedMaster !== null &&
      resolvedMaster.primaryQuestionId === testQuestionId &&
      resolvedMaster.status === 'ACTIVE' &&
      resolvedMaster.categoryId === targetCategory &&
      resolvedMaster.subtopicId === targetSubtopic;

    console.log(`Test 8 — Content Master (${resolvedMaster?.id}) resolved through Question: ${test8Passed ? 'PASSED' : 'FAILED'}`);
    if (!test8Passed) throw new Error('Content Master resolution failed');

    // -------------------------------------------------------------------------
    // STEP 9: Test Invalid Transitions / Guardrails
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Testing Invalid Transitions & Referential Guardrails ---');

    // 9A: Attempt invalid Plan status transition: IN_PROGRESS -> DRAFT (Must be rejected)
    let invalidTransitionBlocked = false;
    try {
      await planningService.transitionPlanStatus(createdPlanId, ContentPlanStatus.DRAFT, testActor);
    } catch (err: any) {
      if (err.message.includes('Invalid status transition')) {
        invalidTransitionBlocked = true;
      }
    }

    // 9B: Attempt to delete Plan while Batch is linked (Must be blocked)
    let deletePlanWithBatchBlocked = false;
    try {
      await planningService.deleteContentPlan(createdPlanId, testActor);
    } catch (err: any) {
      if (err.message.includes('Cannot delete Content Plan') && err.message.includes('production batch(es) are linked')) {
        deletePlanWithBatchBlocked = true;
      }
    }

    // 9C: Attempt to create Batch for non-existent Plan (Must be blocked)
    let createBatchNonExistentPlanBlocked = false;
    try {
      await planningService.createContentBatch(
        {
          name: 'INVALID_BATCH',
          planId: 'BP-PLN-NON-EXISTENT',
          targetCount: 5,
          priority: PriorityLevel.NORMAL,
          plannedDate: '2026-09-10',
        },
        testActor
      );
    } catch (err: any) {
      if (err.message.includes('does not exist')) {
        createBatchNonExistentPlanBlocked = true;
      }
    }

    const test9Passed =
      invalidTransitionBlocked &&
      deletePlanWithBatchBlocked &&
      createBatchNonExistentPlanBlocked;

    console.log(`Test 9 — Invalid transitions safely rejected (Invalid Transition: ${invalidTransitionBlocked}, Delete Protection: ${deletePlanWithBatchBlocked}, Non-Existent FK: ${createBatchNonExistentPlanBlocked}): ${test9Passed ? 'PASSED' : 'FAILED'}`);
    if (!test9Passed) throw new Error('Guardrail rejection assertions failed');

    // -------------------------------------------------------------------------
    // STEP 10: Idempotency Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Testing Mutation Idempotency ---');

    // 10A: Transitioning to the current status should be a no-op idempotent return
    const currentPlanStatus = refetchedPlanAfterBatch?.status || ContentPlanStatus.IN_PROGRESS;
    const idempotentPlanResult = await planningService.transitionPlanStatus(
      createdPlanId,
      currentPlanStatus,
      testActor
    );
    const planIdempotent = idempotentPlanResult.status === currentPlanStatus;

    // 10B: Linking the same question again should not produce duplicates
    const idempotentBatchResult = await planningService.linkBatchQuestions(
      createdBatchId,
      [testQuestionId],
      'ADD',
      testActor
    );
    const batchIdempotent =
      idempotentBatchResult.questionIds.filter((qid) => qid === testQuestionId).length === 1;

    const test10Passed = planIdempotent && batchIdempotent;
    console.log(`Test 10 — Idempotency confirmed (Plan status: ${planIdempotent}, Batch questions: ${batchIdempotent}): ${test10Passed ? 'PASSED' : 'FAILED'}`);
    if (!test10Passed) throw new Error('Idempotency assertions failed');

    // -------------------------------------------------------------------------
    // STEP 11: Workflow & Audit Log Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Testing WORKFLOW & AUDIT_LOG Persistence ---');

    // Record a synthetic workflow transition for the test plan
    const testWfRecord = await workflowService.recordTransition(
      'CONTENT_PLAN',
      createdPlanId,
      'DRAFT',
      'APPROVED',
      testActor.id,
      testActor.name,
      'Phase 9 Live Smoke Test Workflow Transition'
    );
    createdWorkflowIds.push(testWfRecord.id);

    // Verify WORKFLOW persistence
    const fetchedWf = await workflowRepository.findById(testWfRecord.id);
    const wfHistory = await workflowService.getHistory('CONTENT_PLAN', createdPlanId);

    const wfPersisted =
      fetchedWf !== null &&
      fetchedWf.entityId === createdPlanId &&
      fetchedWf.fromStatus === 'DRAFT' &&
      fetchedWf.toStatus === 'APPROVED' &&
      wfHistory.some((w) => w.id === testWfRecord.id);

    // Verify AUDIT_LOG persistence
    const postAuditLogs = await auditLogRepository.findAll();
    const newAuditLogs = postAuditLogs.filter((l) => !preAuditLogIdSet.has(l.id));

    for (const log of newAuditLogs) {
      createdAuditLogIds.push(log.id);
    }

    const hasPlanCreatedLog = newAuditLogs.some(
      (l) => l.action === 'CONTENT_PLAN_CREATED' && l.entityId === createdPlanId
    );
    const hasPlanApprovedLog = newAuditLogs.some(
      (l) => l.action === 'CONTENT_PLAN_APPROVED' && l.entityId === createdPlanId
    );
    const hasBatchCreatedLog = newAuditLogs.some(
      (l) => l.action === 'CONTENT_BATCH_CREATED' && l.entityId === createdBatchId
    );
    const hasBatchLinkedLog = newAuditLogs.some(
      (l) => l.action === 'CONTENT_BATCH_QUESTIONS_LINKED' && l.entityId === createdBatchId
    );

    const auditPersisted =
      hasPlanCreatedLog &&
      hasPlanApprovedLog &&
      hasBatchCreatedLog &&
      hasBatchLinkedLog;

    const test11Passed = wfPersisted && auditPersisted;
    console.log(`Test 11 — Workflow & Audit records persisted (Workflow: ${wfPersisted}, Audit: ${auditPersisted}): ${test11Passed ? 'PASSED' : 'FAILED'}`);
    if (!test11Passed) throw new Error('Workflow / Audit persistence failed');

    // -------------------------------------------------------------------------
    // STEP 12: Zero AI Invocation Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Verifying Zero AI Provider Calls ---');
    const test12Passed = aiCallAttempts === 0;
    console.log(`Test 12 — Zero AI calls verified (Attempts: ${aiCallAttempts}): ${test12Passed ? 'PASSED' : 'FAILED'}`);
    if (!test12Passed) throw new Error('AI call detected');

    // -------------------------------------------------------------------------
    // CLEANUP: Synthetic Artifacts Deletion
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Deleting ONLY Synthetic Smoke Test Artifacts ---');

    // 1. Delete synthetic Content Batch
    if (createdBatchId) {
      console.log(`Deleting synthetic Content Batch ${createdBatchId}...`);
      const res = await contentBatchesRepository.delete(createdBatchId);
      console.log(`Content Batch ${createdBatchId} deleted:`, res);
    }

    // 2. Delete synthetic Content Plan
    if (createdPlanId) {
      console.log(`Deleting synthetic Content Plan ${createdPlanId}...`);
      const res = await contentPlansRepository.delete(createdPlanId);
      console.log(`Content Plan ${createdPlanId} deleted:`, res);
    }

    // 3. Delete synthetic Workflow records
    for (const wfId of createdWorkflowIds) {
      console.log(`Deleting synthetic Workflow record ${wfId}...`);
      const res = await workflowRepository.deleteRecord(wfId);
      console.log(`Workflow ${wfId} deleted:`, res);
    }

    // 4. Delete synthetic Audit Log records
    for (const alId of createdAuditLogIds) {
      console.log(`Deleting synthetic Audit Log record ${alId}...`);
      const res = await auditLogRepository.deleteRecord(alId);
      console.log(`Audit Log ${alId} deleted:`, res);
    }

    // -------------------------------------------------------------------------
    // POST-CLEANUP VERIFICATION & SNAPSHOT
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Taking Post-Cleanup Live Database Snapshot ---');
    const postSnapshot = await getLiveSnapshot();
    console.log('Post-test snapshot:', JSON.stringify(postSnapshot, null, 2));

    const plansRestored = postSnapshot.CONTENT_PLANS === preSnapshot.CONTENT_PLANS;
    const batchesRestored = postSnapshot.CONTENT_BATCHES === preSnapshot.CONTENT_BATCHES;
    const mastersRestored = postSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS;
    const questionsRestored = postSnapshot.QUESTIONS === preSnapshot.QUESTIONS;
    const workflowRestored = postSnapshot.WORKFLOW === preSnapshot.WORKFLOW;
    const auditRestored = postSnapshot.AUDIT_LOG === preSnapshot.AUDIT_LOG;

    const taxonomyUnchanged =
      postSnapshot.CATEGORIES === preSnapshot.CATEGORIES &&
      postSnapshot.TOPICS === preSnapshot.TOPICS &&
      postSnapshot.SUBTOPICS === preSnapshot.SUBTOPICS;

    const sequencesMonotonic =
      postSnapshot.SEQUENCES === preSnapshot.SEQUENCES &&
      postSnapshot.planSequenceValue >= preSnapshot.planSequenceValue &&
      postSnapshot.batchSequenceValue >= preSnapshot.batchSequenceValue &&
      postSnapshot.cmSequenceValue >= preSnapshot.cmSequenceValue &&
      postSnapshot.questionSequenceValue >= preSnapshot.questionSequenceValue;

    // Verify deleted entities are gone from live database
    const postPlan = await contentPlansRepository.findById(createdPlanId!);
    const postBatch = await contentBatchesRepository.findById(createdBatchId!);
    const postWf = await workflowRepository.findById(testWfRecord.id);
    const entitiesGone = postPlan === null && postBatch === null && postWf === null;

    console.log('\n--- Final Verification Checklist ---');
    console.log('1. CONTENT_PLANS restored to baseline:', plansRestored);
    console.log('2. CONTENT_BATCHES restored to baseline:', batchesRestored);
    console.log('3. CONTENT_MASTERS unchanged:', mastersRestored);
    console.log('4. QUESTIONS unchanged:', questionsRestored);
    console.log('5. WORKFLOW restored to baseline:', workflowRestored);
    console.log('6. AUDIT_LOG restored to baseline:', auditRestored);
    console.log('7. Taxonomy sheets unchanged:', taxonomyUnchanged);
    console.log('8. SEQUENCES monotonic (advanced properly):', sequencesMonotonic);
    console.log('9. Synthetic records completely absent from live database:', entitiesGone);
    console.log('10. AI request invocations =', aiCallAttempts, '(MUST BE 0)');

    const allPassed =
      test1Passed &&
      test2Passed &&
      test3Passed &&
      test4Passed &&
      test5Passed &&
      test6Passed &&
      test7Passed &&
      test8Passed &&
      test9Passed &&
      test10Passed &&
      test11Passed &&
      test12Passed &&
      plansRestored &&
      batchesRestored &&
      mastersRestored &&
      questionsRestored &&
      workflowRestored &&
      auditRestored &&
      taxonomyUnchanged &&
      sequencesMonotonic &&
      entitiesGone &&
      aiCallAttempts === 0;

    return {
      allPassed,
      preSnapshot,
      postSnapshot,
      aiCallAttempts,
      createdPlanId,
      createdBatchId,
      createdWorkflowIds,
      createdAuditLogIds,
      test1Passed,
      test2Passed,
      test3Passed,
      test4Passed,
      test5Passed,
      test6Passed,
      test7Passed,
      test8Passed,
      test9Passed,
      test10Passed,
      test11Passed,
      test12Passed,
    };
  } catch (err: any) {
    console.error('ERROR during live smoke test:', err);
    // Emergency cleanup in catch block
    if (createdBatchId) {
      try { await contentBatchesRepository.delete(createdBatchId); } catch {}
    }
    if (createdPlanId) {
      try { await contentPlansRepository.delete(createdPlanId); } catch {}
    }
    for (const wfId of createdWorkflowIds) {
      try { await workflowRepository.deleteRecord(wfId); } catch {}
    }
    for (const alId of createdAuditLogIds) {
      try { await auditLogRepository.deleteRecord(alId); } catch {}
    }
    throw err;
  } finally {
    // Restore original AI stubs
    geminiClient.isConfigured = originalIsConfigured;
    (geminiInstance as any).callGeminiWithRetryAndFallback = originalCallGemini;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

if (process.argv[1] && process.argv[1].includes('run_phase9_live_smoke_test')) {
  runPhase9LiveSmokeTest().then((res) => {
    console.log('\n===============================================================');
    console.log(`FINAL SMOKE TEST RESULT: ${res.allPassed ? 'PASS' : 'FAIL'}`);
    console.log('===============================================================');
    process.exit(res.allPassed ? 0 : 1);
  }).catch((err) => {
    console.error('Smoke test terminated with error:', err);
    process.exit(1);
  });
}
