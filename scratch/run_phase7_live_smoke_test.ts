/**
 * BURRA PARIKSHA CMS — Phase 7 Automated Live Smoke Test
 * 
 * Tests the Unified Question Studio creation workflow against LIVE Google Sheets.
 * Strict ₹0 constraint: Zero AI calls (manual mode only), reversible synthetic test,
 * guaranteed cleanup, monotonic sequences preserved.
 */

import 'dotenv/config';
import express from 'express';
import http from 'http';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { authService } from '../src/lib/services/auth.service';
import { apiRouter } from '../src/server/routes';
import { UserRole, QuestionLanguage, QuestionStatus, VideoProductionStatus } from '../src/types';

interface SheetSnapshot {
  QUESTIONS: number;
  CONTENT_MASTERS: number;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
  CATEGORIES: number;
  TOPICS: number;
  SUBTOPICS: number;
  questionSequenceValue: number;
  timestamp: string;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const countSheet = async (sheetName: string): Promise<number> => {
    const res = await googleSheetsClient.getRows(sheetName);
    return res.rows.length;
  };

  const q = await countSheet('QUESTIONS');
  const cm = await countSheet('CONTENT_MASTERS');
  const wf = await countSheet('WORKFLOW');
  const al = await countSheet('AUDIT_LOG');
  const seqRes = await googleSheetsClient.getRows('SEQUENCES');
  const cat = await countSheet('CATEGORIES');
  const top = await countSheet('TOPICS');
  const sub = await countSheet('SUBTOPICS');

  const questionSeqRow = seqRes.rows.find(r => r[0] === 'QUESTION');
  const questionSeqVal = questionSeqRow ? Number(questionSeqRow[1]) : 0;

  return {
    QUESTIONS: q,
    CONTENT_MASTERS: cm,
    WORKFLOW: wf,
    AUDIT_LOG: al,
    SEQUENCES: seqRes.rows.length,
    CATEGORIES: cat,
    TOPICS: top,
    SUBTOPICS: sub,
    questionSequenceValue: questionSeqVal,
    timestamp: new Date().toISOString(),
  };
}

export async function runPhase7LiveSmokeTest() {
  console.log('===============================================================');
  console.log('PHASE 7: CONTROLLED AUTOMATED LIVE QUESTION STUDIO SMOKE TEST');
  console.log('===============================================================\n');

  // Track created artifacts for guaranteed cleanup
  let createdQuestionId: string | null = null;
  let createdContentMasterId: string | null = null;
  const createdWorkflowIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  // Start Express test server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  const token = authService.generateSessionToken({
    userId: 'USR-ADMIN-P7-SMOKE',
    name: 'Phase 7 Smoke Test Admin',
    role: UserRole.ADMIN,
  });

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Pre-test Snapshot
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Capturing Pre-Test Live Database Snapshot ---');
    const preSnapshot = await getLiveSnapshot();
    console.log('Pre-test snapshot:', JSON.stringify(preSnapshot, null, 2));

    // -------------------------------------------------------------------------
    // STEP 2: Taxonomy Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Validating Target Taxonomy ---');
    const targetCategory = 'CAT-QA';
    const targetTopic = 'TOP-QA-01';
    const targetSubtopic = 'SUB-QA-01-01';

    const validatedTaxonomy = await taxonomyService.validateTaxonomy(
      targetCategory,
      targetTopic,
      targetSubtopic
    );
    console.log('Taxonomy validation passed:', {
      category: `${validatedTaxonomy.category.id} (${validatedTaxonomy.category.name})`,
      topic: `${validatedTaxonomy.topic.id} (${validatedTaxonomy.topic.name})`,
      subtopic: `${validatedTaxonomy.subtopic.id} (${validatedTaxonomy.subtopic.name})`,
    });

    // -------------------------------------------------------------------------
    // STEP 3: Candidate Validation (Non-Persistence Check)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Candidate Pre-Save Validation ---');
    const candidatePayload = {
      id: 'CANDIDATE-SYNTHETIC-P7',
      categoryId: targetCategory,
      categoryName: validatedTaxonomy.category.name,
      topicId: targetTopic,
      topicName: validatedTaxonomy.topic.name,
      subtopicId: targetSubtopic,
      subtopicName: validatedTaxonomy.subtopic.name,
      questionText: 'SYNTHETIC_TEST_P7_SMOKE: If a car travels 60 km in 1 hour and 90 km in the next 1.5 hours, what is its average speed in km/h?',
      options: {
        a: '55 km/h',
        b: '60 km/h',
        c: '65 km/h',
        d: '70 km/h',
      },
      correctAnswer: 'B',
      explanation: 'Total distance = 60 + 90 = 150 km. Total time = 1 + 1.5 = 2.5 hours. Average speed = 150 / 2.5 = 60 km/h.',
      difficulty: 'Intermediate',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: QuestionLanguage.ENGLISH,
      realLifeContext: 'Highway road trip travel speed',
      status: QuestionStatus.DRAFT,
      videoStatus: VideoProductionStatus.NOT_STARTED,
    };

    const valResp = await fetch(`${baseUrl}/questions/validate-candidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question: candidatePayload }),
    });
    const valResult = await valResp.json();
    console.log('Candidate validation HTTP status:', valResp.status);
    console.log('Candidate validation status:', valResult?.data?.status);
    console.log('Candidate validation score:', valResult?.data?.confidenceScore);

    // Verify zero persistence occurred from validation
    const midValSnapshot = await getLiveSnapshot();
    const valNoQuestions = midValSnapshot.QUESTIONS === preSnapshot.QUESTIONS;
    const valNoMasters = midValSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS;
    console.log('Candidate validation did NOT persist Question:', valNoQuestions);
    console.log('Candidate validation did NOT persist Content Master:', valNoMasters);

    if (!valNoQuestions || !valNoMasters) {
      throw new Error('FATAL: Candidate validation persisted records unexpectedly!');
    }

    // -------------------------------------------------------------------------
    // STEP 4: Canonical Question Creation (Manual Mode)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Canonical Question Creation via POST /api/questions/create ---');
    const testTimestamp = Date.now();
    const idempotencyKey = `p7-smoke-${testTimestamp}`;
    const createPayload = {
      creationMode: 'manual',
      categoryId: targetCategory,
      topicId: targetTopic,
      subtopicId: targetSubtopic,
      difficulty: 'Intermediate',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: QuestionLanguage.ENGLISH,
      realLifeContext: 'Highway road trip travel speed',
      questionText: `SYNTHETIC_TEST_P7_LIVE_SMOKE_${testTimestamp}: A car travels 60 km in 1 hour and 90 km in the next 1.5 hours. What is its average speed in km/h?`,
      options: {
        a: '55 km/h',
        b: '60 km/h',
        c: '65 km/h',
        d: '70 km/h',
      },
      correctAnswer: 'B',
      explanation: 'Total distance = 150 km. Total time = 2.5 hours. Average speed = 150 / 2.5 = 60 km/h.',
      tags: ['SYNTHETIC_TEST', 'PHASE7_LIVE_SMOKE'],
      idempotencyKey,
    };

    const createResp = await fetch(`${baseUrl}/questions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createPayload),
    });
    const createdQuestion = await createResp.json();
    console.log('Create question HTTP status:', createResp.status);
    console.log('Created question ID:', createdQuestion.id);
    console.log('Created question status:', createdQuestion.status);
    console.log('Associated Content Master ID:', createdQuestion.contentMasterId);

    createdQuestionId = createdQuestion.id;
    createdContentMasterId = createdQuestion.contentMasterId;

    if (!createdQuestionId || !createdContentMasterId) {
      throw new Error(`Question creation failed: ${JSON.stringify(createdQuestion)}`);
    }

    // -------------------------------------------------------------------------
    // STEP 5: Sequence Behavior Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Sequence Allocation Verification ---');
    console.log('Allocated Question ID:', createdQuestionId);
    console.log('Allocated Content Master ID:', createdContentMasterId);
    const validQuestionIdFormat = /^BP-Q-\d+$/.test(createdQuestionId);
    const validMasterIdFormat = /^BP-MST-\d+$/.test(createdContentMasterId);
    console.log('Question ID format valid (BP-Q-XXXXXX):', validQuestionIdFormat);
    console.log('Content Master ID format valid (BP-MST-XXXXXX):', validMasterIdFormat);

    // -------------------------------------------------------------------------
    // STEP 6: Content Master Relationship Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Content Master Factory & Relationship Verification ---');
    const contentMaster = await contentMastersRepository.findById(createdContentMasterId);
    console.log('Fetched Content Master:', {
      id: contentMaster?.id,
      title: contentMaster?.title,
      primaryQuestionId: contentMaster?.primaryQuestionId,
      categoryId: contentMaster?.categoryId,
      topicId: contentMaster?.topicId,
      subtopicId: contentMaster?.subtopicId,
    });
    const masterLinkedToQuestion = contentMaster?.primaryQuestionId === createdQuestionId;
    const masterTaxonomyMatches =
      contentMaster?.categoryId === targetCategory &&
      contentMaster?.topicId === targetTopic &&
      contentMaster?.subtopicId === targetSubtopic;
    console.log('Content Master primaryQuestionId links to created question:', masterLinkedToQuestion);
    console.log('Content Master taxonomy matches question taxonomy:', masterTaxonomyMatches);

    // -------------------------------------------------------------------------
    // STEP 7: Workflow State Transition Record Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Workflow Transition Record Verification ---');
    const workflows = await workflowRepository.findByEntity('QUESTION', createdQuestionId);
    console.log(`Found ${workflows.length} workflow record(s) for question ${createdQuestionId}:`);
    for (const wf of workflows) {
      console.log('  Workflow record:', {
        id: wf.id,
        entityId: wf.entityId,
        fromStatus: wf.fromStatus,
        toStatus: wf.toStatus,
        changedBy: wf.changedBy,
      });
      createdWorkflowIds.push(wf.id);
    }
    const workflowTransitionValid = workflows.some(
      wf => wf.fromStatus === 'DRAFT' && wf.toStatus === 'GENERATED'
    );
    console.log('Workflow record DRAFT -> GENERATED present:', workflowTransitionValid);

    // -------------------------------------------------------------------------
    // STEP 8: Audit Log Event Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Audit Log Record Verification ---');
    const allAuditLogs = await auditLogRepository.findAll();
    const questionAuditLogs = allAuditLogs.filter(
      log => log.entityId === createdQuestionId || log.entityId === createdContentMasterId
    );
    console.log(`Found ${questionAuditLogs.length} audit log(s) for test entities:`);
    for (const log of questionAuditLogs) {
      console.log('  Audit log:', {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorName: log.actorName,
      });
      createdAuditLogIds.push(log.id);
    }
    const auditCreatedQuestionPresent = questionAuditLogs.some(
      l => l.action === 'QUESTION_CREATED' && l.entityId === createdQuestionId
    );
    console.log('Audit log QUESTION_CREATED present:', auditCreatedQuestionPresent);

    // -------------------------------------------------------------------------
    // STEP 9: Read-Back Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Authoritative Read-Back Verification ---');
    const readBackQuestion = await questionsRepository.findById(createdQuestionId);
    const readBackMaster = await contentMastersRepository.findById(createdContentMasterId);
    console.log('Read-back Question:', {
      id: readBackQuestion?.id,
      status: readBackQuestion?.status,
      videoStatus: readBackQuestion?.videoStatus,
      difficulty: readBackQuestion?.difficulty,
      correctAnswer: readBackQuestion?.correctAnswer,
      questionText: readBackQuestion?.questionText?.slice(0, 70),
    });
    console.log('Read-back Content Master:', {
      id: readBackMaster?.id,
      primaryQuestionId: readBackMaster?.primaryQuestionId,
    });
    const readBackMatches =
      readBackQuestion !== null &&
      readBackQuestion.id === createdQuestionId &&
      readBackQuestion.status === QuestionStatus.GENERATED &&
      readBackQuestion.videoStatus === VideoProductionStatus.NOT_STARTED &&
      readBackQuestion.correctAnswer === 'B' &&
      readBackMaster !== null &&
      readBackMaster.id === createdContentMasterId &&
      readBackMaster.primaryQuestionId === createdQuestionId;
    console.log('Authoritative read-back matches created question & master:', readBackMatches);

    // -------------------------------------------------------------------------
    // STEP 10: Idempotency Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Idempotency Check with Same Request & Key ---');
    const repeatResp = await fetch(`${baseUrl}/questions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createPayload),
    });
    const repeatResult = await repeatResp.json();
    console.log('Repeat request HTTP status:', repeatResp.status);
    console.log('Repeat result question ID:', repeatResult.id);
    const idempotencyPreserved = repeatResult.id === createdQuestionId;
    console.log('Idempotency preserved (returned identical existing ID):', idempotencyPreserved);

    // Verify sheet counts right before cleanup (should be exactly +1 Question, +1 Content Master)
    const midSnapshot = await getLiveSnapshot();
    console.log('Mid-test active counts:', {
      QUESTIONS: `${preSnapshot.QUESTIONS} -> ${midSnapshot.QUESTIONS} (+${midSnapshot.QUESTIONS - preSnapshot.QUESTIONS})`,
      CONTENT_MASTERS: `${preSnapshot.CONTENT_MASTERS} -> ${midSnapshot.CONTENT_MASTERS} (+${midSnapshot.CONTENT_MASTERS - preSnapshot.CONTENT_MASTERS})`,
    });
    const exactlyOneQuestionCreated = midSnapshot.QUESTIONS === preSnapshot.QUESTIONS + 1;
    const exactlyOneMasterCreated = midSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS + 1;
    console.log('Exactly one question created in QUESTIONS:', exactlyOneQuestionCreated);
    console.log('Exactly one master created in CONTENT_MASTERS:', exactlyOneMasterCreated);

    // -------------------------------------------------------------------------
    // STEP 11: Cleanup Synthetic Test Artifacts
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Cleaning Up Synthetic Test Artifacts ---');

    // 11a. Delete synthetic Question
    if (createdQuestionId) {
      console.log(`Deleting Question ${createdQuestionId}...`);
      const qDeleted = await questionsRepository.deleteRecord(createdQuestionId);
      console.log(`Question ${createdQuestionId} deleted:`, qDeleted);
    }

    // 11b. Delete synthetic Content Master
    if (createdContentMasterId) {
      console.log(`Deleting Content Master ${createdContentMasterId}...`);
      const cmDeleted = await contentMastersRepository.deleteRecord(createdContentMasterId);
      console.log(`Content Master ${createdContentMasterId} deleted:`, cmDeleted);
    }

    // 11c. Delete synthetic Workflow records
    for (const wfId of createdWorkflowIds) {
      console.log(`Deleting Workflow record ${wfId}...`);
      const wfDeleted = await workflowRepository.deleteRecord(wfId);
      console.log(`Workflow ${wfId} deleted:`, wfDeleted);
    }

    // 11d. Delete synthetic Audit Log records
    for (const logId of createdAuditLogIds) {
      console.log(`Deleting Audit Log record ${logId}...`);
      const logDeleted = await auditLogRepository.deleteRecord(logId);
      console.log(`Audit Log ${logId} deleted:`, logDeleted);
    }

    // -------------------------------------------------------------------------
    // STEP 12: Post-Test Snapshot & Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Taking Post-Cleanup Live Database Snapshot ---');
    const postSnapshot = await getLiveSnapshot();
    console.log('Post-test snapshot:', JSON.stringify(postSnapshot, null, 2));

    const questionsRestored = postSnapshot.QUESTIONS === preSnapshot.QUESTIONS;
    const mastersRestored = postSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS;
    const workflowRestored = postSnapshot.WORKFLOW === preSnapshot.WORKFLOW;
    const auditRestored = postSnapshot.AUDIT_LOG === preSnapshot.AUDIT_LOG;
    const taxonomyUnchanged =
      postSnapshot.CATEGORIES === preSnapshot.CATEGORIES &&
      postSnapshot.TOPICS === preSnapshot.TOPICS &&
      postSnapshot.SUBTOPICS === preSnapshot.SUBTOPICS;
    const sequencesMonotonic =
      postSnapshot.SEQUENCES === preSnapshot.SEQUENCES &&
      postSnapshot.questionSequenceValue >= preSnapshot.questionSequenceValue;

    console.log('\n--- Verification Results ---');
    console.log('1. QUESTIONS restored to pre-test count:', questionsRestored);
    console.log('2. CONTENT_MASTERS restored to pre-test count:', mastersRestored);
    console.log('3. WORKFLOW restored to pre-test count:', workflowRestored);
    console.log('4. AUDIT_LOG restored to pre-test count:', auditRestored);
    console.log('5. Taxonomy counts unchanged:', taxonomyUnchanged);
    console.log('6. SEQUENCES monotonic (never decremented):', sequencesMonotonic);

    // Verify deleted entities can no longer be retrieved
    const postDeletedQuestion = await questionsRepository.findById(createdQuestionId);
    const postDeletedMaster = await contentMastersRepository.findById(createdContentMasterId);
    const entitiesGone = postDeletedQuestion === null && postDeletedMaster === null;
    console.log('7. Synthetic records completely absent from database:', entitiesGone);

    const allPassed =
      validQuestionIdFormat &&
      validMasterIdFormat &&
      masterLinkedToQuestion &&
      masterTaxonomyMatches &&
      workflowTransitionValid &&
      auditCreatedQuestionPresent &&
      readBackMatches &&
      idempotencyPreserved &&
      exactlyOneQuestionCreated &&
      exactlyOneMasterCreated &&
      questionsRestored &&
      mastersRestored &&
      workflowRestored &&
      auditRestored &&
      taxonomyUnchanged &&
      sequencesMonotonic &&
      entitiesGone;

    return {
      allPassed,
      preSnapshot,
      postSnapshot,
      createdQuestionId,
      createdContentMasterId,
      createdWorkflowIds,
      createdAuditLogIds,
      candidateValidationScore: valResult?.data?.confidenceScore,
      candidateValidationStatus: valResult?.data?.status,
    };
  } catch (err: any) {
    console.error('ERROR during live smoke test execution:', err);
    // Emergency cleanup in catch block
    if (createdQuestionId) {
      try { await questionsRepository.deleteRecord(createdQuestionId); } catch {}
    }
    if (createdContentMasterId) {
      try { await contentMastersRepository.deleteRecord(createdContentMasterId); } catch {}
    }
    for (const wfId of createdWorkflowIds) {
      try { await workflowRepository.deleteRecord(wfId); } catch {}
    }
    for (const logId of createdAuditLogIds) {
      try { await auditLogRepository.deleteRecord(logId); } catch {}
    }
    throw err;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

if (process.argv[1] && process.argv[1].includes('run_phase7_live_smoke_test')) {
  runPhase7LiveSmokeTest().then(res => {
    console.log('\n===============================================================');
    console.log(`FINAL SMOKE TEST RESULT: ${res.allPassed ? 'PASS' : 'FAIL'}`);
    console.log('===============================================================');
    process.exit(res.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Smoke test terminated with error:', err);
    process.exit(1);
  });
}
