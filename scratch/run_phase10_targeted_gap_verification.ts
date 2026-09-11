/**
 * BURRA PARIKSHA CMS — Phase 10 Targeted Final Gap Verification
 *
 * Strictly verifies Invalid Assignment Lifecycle Transitions against LIVE Google Sheets:
 * - Deterministic / non-AI execution (Zero Gemini, Groq, xAI calls)
 * - Strict ₹0 investment constraint
 * - Safe synthetic assignment creation
 * - Verification of initial ASSIGNED status
 * - Explicit test of multiple invalid transitions:
 *   1. ASSIGNED -> COMPLETED directly via POST /assignments/:id/complete (Illegal jump)
 *   2. ASSIGNED -> COMPLETED directly via PATCH /assignments/:id (Illegal PATCH jump)
 *   3. IN_PROGRESS -> ASSIGNED via PATCH /assignments/:id (Illegal backward reset)
 *   4. COMPLETED -> IN_PROGRESS via POST /assignments/:id/start (Illegal terminal reactivation)
 * - Confirmation of rejection HTTP status (400), unchanged status, and zero side-effects in WORKFLOW / AUDIT_LOG
 * - Complete self-cleaning of synthetic assignment, workflow, and audit log records
 * - Zero-drift baseline reconciliation
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { assignmentsRepository } from '../src/lib/repositories/assignments.repository';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { authService } from '../src/lib/services/auth.service';
import { GeminiService } from '../src/lib/ai/gemini.service';
import { geminiClient } from '../src/lib/ai/gemini.client';
import { apiRouter } from '../src/server/routes';
import {
  AssignmentStatus,
  PriorityLevel,
  UserRole,
} from '../src/types';

interface SheetSnapshot {
  ASSIGNMENTS: number;
  USERS: number;
  QUESTIONS: number;
  VIDEOS: number;
  SCRIPT: number;
  THUMBNAILS: number;
  CONTENT_MASTERS: number;
  CONTENT_PLANS: number;
  CONTENT_BATCHES: number;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
  CATEGORIES: number;
  TOPICS: number;
  SUBTOPICS: number;
  assignmentSequenceValue: number;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const countSheet = async (sheetName: string): Promise<number> => {
    const res = await googleSheetsClient.getRows(sheetName);
    return res.rows.length;
  };

  const asn = await countSheet('ASSIGNMENTS');
  const usr = await countSheet('USERS');
  const q = await countSheet('QUESTIONS');
  const vid = await countSheet('VIDEOS');
  const scr = await countSheet('SCRIPT');
  const thm = await countSheet('THUMBNAILS');
  const cm = await countSheet('CONTENT_MASTERS');
  const pln = await countSheet('CONTENT_PLANS');
  const bch = await countSheet('CONTENT_BATCHES');
  const wf = await countSheet('WORKFLOW');
  const al = await countSheet('AUDIT_LOG');
  const seqRes = await googleSheetsClient.getRows('SEQUENCES');
  const cat = await countSheet('CATEGORIES');
  const top = await countSheet('TOPICS');
  const sub = await countSheet('SUBTOPICS');

  const asnSeqRow = seqRes.rows.find((r) => r[0] === 'ASSIGNMENT');

  return {
    ASSIGNMENTS: asn,
    USERS: usr,
    QUESTIONS: q,
    VIDEOS: vid,
    SCRIPT: scr,
    THUMBNAILS: thm,
    CONTENT_MASTERS: cm,
    CONTENT_PLANS: pln,
    CONTENT_BATCHES: bch,
    WORKFLOW: wf,
    AUDIT_LOG: al,
    SEQUENCES: seqRes.rows.length,
    CATEGORIES: cat,
    TOPICS: top,
    SUBTOPICS: sub,
    assignmentSequenceValue: asnSeqRow ? Number(asnSeqRow[1]) : 0,
  };
}

export async function runTargetedGapVerification() {
  console.log('===============================================================');
  console.log('PHASE 10: TARGETED FINAL GAP VERIFICATION — INVALID TRANSITIONS');
  console.log('===============================================================\n');

  let aiCallAttempts = 0;
  geminiClient.isConfigured = () => false;

  const geminiInstance = GeminiService.getInstance();
  (geminiInstance as any).callGeminiWithRetryAndFallback = async () => {
    aiCallAttempts++;
    throw new Error('STRICT CONSTRAINT VIOLATION: AI network call attempted during deterministic smoke test!');
  };

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[HTTP Server] Mounted /api on ${baseUrl}\n`);

  let createdAssignmentId: string | null = null;
  const createdWorkflowIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  let preSnapshot: SheetSnapshot;

  try {
    // -------------------------------------------------------------------------
    // 1. PRE-FLIGHT SNAPSHOT
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Pre-Flight Baseline Snapshot ---');
    preSnapshot = await getLiveSnapshot();
    console.log('Baseline snapshot:', JSON.stringify(preSnapshot, null, 2));

    const liveUsers = await usersRepository.findAll();
    const activeUsers = liveUsers.filter((u) => u.isActive);
    const contentManagerUser = activeUsers.find((u) => u.id === 'USR-002' || u.role === UserRole.CONTENT_MANAGER)!;
    const specialistAssignee = activeUsers.find((u) => u.id === 'USR-7926' || u.role === UserRole.CONTENT_WRITER)!;

    const cmToken = authService.generateSessionToken({
      userId: contentManagerUser.id,
      name: contentManagerUser.name,
      role: String(contentManagerUser.role),
    });
    const specialistToken = authService.generateSessionToken({
      userId: specialistAssignee.id,
      name: specialistAssignee.name,
      role: String(specialistAssignee.role),
    });

    // Use Question BP-Q-000002 as target entity
    const existingQuestions = await questionsRepository.findAll();
    const targetQuestion = existingQuestions.find((q) => q.id === 'BP-Q-000002') || existingQuestions[0];
    console.log(`Using target Question entity: ${targetQuestion.id}`);

    // Verify zero active assignments exist for this entity & taskType
    const activeAsns = await assignmentsRepository.findActiveByEntity('QUESTION', targetQuestion.id);
    const existingActiveReview = activeAsns.find((a) => a.taskType === 'QUESTION_REVIEW');
    if (existingActiveReview) {
      throw new Error(`Target entity ${targetQuestion.id} already has active assignment ${existingActiveReview.id}`);
    }

    // -------------------------------------------------------------------------
    // 2. CREATE TEMPORARY SYNTHETIC ASSIGNMENT
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Create Synthetic Assignment (Starts in ASSIGNED) ---');
    const futureDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const resCreate = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({
        entityType: 'QUESTION',
        entityId: targetQuestion.id,
        assigneeId: specialistAssignee.id,
        assignmentRole: 'CONTENT_WRITER',
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.NORMAL,
        dueDate: futureDueDate,
        notes: 'TARGETED-GAP-TEST: Invalid transition verification assignment',
      }),
    });

    const createBody = await resCreate.json();
    createdAssignmentId = createBody.id;
    console.log(`Created assignment ID: ${createdAssignmentId}, HTTP ${resCreate.status}`);

    if (!createdAssignmentId || !createdAssignmentId.startsWith('BP-ASN-')) {
      throw new Error(`Failed to create assignment or invalid ID format: ${JSON.stringify(createBody)}`);
    }

    // 2.A Verify assignment starts in ASSIGNED
    const readBack1 = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`Initial status read-back: ${readBack1?.status} (Expected: ASSIGNED)`);
    if (readBack1?.status !== AssignmentStatus.ASSIGNED) {
      throw new Error(`Expected initial status to be ASSIGNED, got: ${readBack1?.status}`);
    }

    // Record initial workflow & audit records
    const wfAfterCreate = await workflowRepository.findAll();
    const initialWf = wfAfterCreate.filter((w) => w.entityId === createdAssignmentId);
    initialWf.forEach((w) => createdWorkflowIds.push(w.id));

    const auditAfterCreate = await auditLogRepository.findAll();
    const initialAudit = auditAfterCreate.filter((a) => a.entityId === createdAssignmentId);
    initialAudit.forEach((a) => createdAuditLogIds.push(a.id));

    console.log(`Initial WORKFLOW records: ${initialWf.length} ([${initialWf.map(w => w.id).join(', ')}])`);
    console.log(`Initial AUDIT_LOG records: ${initialAudit.length} ([${initialAudit.map(a => a.id).join(', ')}])`);

    // -------------------------------------------------------------------------
    // 3. INVALID TRANSITIONS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Attempt Invalid Lifecycle Transitions ---');

    // TEST 1: ASSIGNED -> COMPLETED directly via POST /assignments/:id/complete
    console.log('\n[Invalid Transition 1] ASSIGNED -> COMPLETED directly via POST /assignments/:id/complete');
    const resInv1 = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({ notes: 'Attempting invalid direct completion from ASSIGNED' }),
    });
    const inv1Body = await resInv1.json();
    console.log(`HTTP Status: ${resInv1.status} (Expected: 400)`);
    console.log(`Response error message: "${inv1Body.message || inv1Body.error}"`);

    // Verify status remains ASSIGNED
    const readBackInv1 = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`Persisted status in Google Sheets: ${readBackInv1?.status} (Expected: ASSIGNED)`);

    // Verify no new workflow or audit log records were created
    const wfAfterInv1 = await workflowRepository.findAll();
    const wfCountInv1 = wfAfterInv1.filter((w) => w.entityId === createdAssignmentId).length;
    const auditAfterInv1 = await auditLogRepository.findAll();
    const auditCountInv1 = auditAfterInv1.filter((a) => a.entityId === createdAssignmentId).length;
    console.log(`Workflow records count: ${wfCountInv1} (Expected: ${initialWf.length}, no change)`);
    console.log(`Audit log records count: ${auditCountInv1} (Expected: ${initialAudit.length}, no change)`);

    const inv1Passed =
      resInv1.status === 400 &&
      readBackInv1?.status === AssignmentStatus.ASSIGNED &&
      wfCountInv1 === initialWf.length &&
      auditCountInv1 === initialAudit.length &&
      inv1Body.message?.includes('Invalid assignment state transition: Cannot change status from "ASSIGNED" to "COMPLETED"');

    console.log(`Invalid Transition 1 Result: ${inv1Passed ? 'PASS' : 'FAIL'}`);
    if (!inv1Passed) {
      throw new Error(`Invalid Transition 1 failed verification!`);
    }

    // TEST 2: ASSIGNED -> COMPLETED directly via PATCH /assignments/:id
    console.log('\n[Invalid Transition 2] ASSIGNED -> COMPLETED directly via PATCH /assignments/:id');
    const resInv2 = await fetch(`${baseUrl}/assignments/${createdAssignmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({ status: AssignmentStatus.COMPLETED }),
    });
    const inv2Body = await resInv2.json();
    console.log(`HTTP Status: ${resInv2.status} (Expected: 400)`);
    console.log(`Response error message: "${inv2Body.message || inv2Body.error}"`);

    // Verify status remains ASSIGNED
    const readBackInv2 = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`Persisted status in Google Sheets: ${readBackInv2?.status} (Expected: ASSIGNED)`);

    const wfAfterInv2 = await workflowRepository.findAll();
    const wfCountInv2 = wfAfterInv2.filter((w) => w.entityId === createdAssignmentId).length;
    const auditAfterInv2 = await auditLogRepository.findAll();
    const auditCountInv2 = auditAfterInv2.filter((a) => a.entityId === createdAssignmentId).length;
    console.log(`Workflow records count: ${wfCountInv2} (Expected: ${initialWf.length}, no change)`);
    console.log(`Audit log records count: ${auditCountInv2} (Expected: ${initialAudit.length}, no change)`);

    const inv2Passed =
      resInv2.status === 400 &&
      readBackInv2?.status === AssignmentStatus.ASSIGNED &&
      wfCountInv2 === initialWf.length &&
      auditCountInv2 === initialAudit.length &&
      inv2Body.message?.includes('Invalid assignment state transition: Cannot change status from "ASSIGNED" to "COMPLETED"');

    console.log(`Invalid Transition 2 Result: ${inv2Passed ? 'PASS' : 'FAIL'}`);
    if (!inv2Passed) {
      throw new Error(`Invalid Transition 2 failed verification!`);
    }

    // TEST 3: Advance to IN_PROGRESS, then attempt illegal backward transition IN_PROGRESS -> ASSIGNED
    console.log('\n[Valid Transition] ASSIGNED -> IN_PROGRESS via POST /assignments/:id/start');
    const resStart = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${specialistToken}` },
    });
    const startBody = await resStart.json();
    const readBackStarted = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`HTTP Status: ${resStart.status}, Sheet Status: ${readBackStarted?.status} (Expected: IN_PROGRESS)`);

    const wfAfterStart = await workflowRepository.findAll();
    const currentWf = wfAfterStart.filter((w) => w.entityId === createdAssignmentId);
    currentWf.forEach((w) => {
      if (!createdWorkflowIds.includes(w.id)) createdWorkflowIds.push(w.id);
    });
    const auditAfterStart = await auditLogRepository.findAll();
    const currentAudit = auditAfterStart.filter((a) => a.entityId === createdAssignmentId);
    currentAudit.forEach((a) => {
      if (!createdAuditLogIds.includes(a.id)) createdAuditLogIds.push(a.id);
    });

    console.log('\n[Invalid Transition 3] IN_PROGRESS -> ASSIGNED via PATCH /assignments/:id (Backward reset)');
    const resInv3 = await fetch(`${baseUrl}/assignments/${createdAssignmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({ status: AssignmentStatus.ASSIGNED }),
    });
    const inv3Body = await resInv3.json();
    console.log(`HTTP Status: ${resInv3.status} (Expected: 400)`);
    console.log(`Response error message: "${inv3Body.message || inv3Body.error}"`);

    const readBackInv3 = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`Persisted status in Google Sheets: ${readBackInv3?.status} (Expected: IN_PROGRESS)`);

    const wfAfterInv3 = await workflowRepository.findAll();
    const wfCountInv3 = wfAfterInv3.filter((w) => w.entityId === createdAssignmentId).length;
    const auditAfterInv3 = await auditLogRepository.findAll();
    const auditCountInv3 = auditAfterInv3.filter((a) => a.entityId === createdAssignmentId).length;
    console.log(`Workflow records count: ${wfCountInv3} (Expected: ${currentWf.length}, no change)`);
    console.log(`Audit log records count: ${auditCountInv3} (Expected: ${currentAudit.length}, no change)`);

    const inv3Passed =
      resInv3.status === 400 &&
      readBackInv3?.status === AssignmentStatus.IN_PROGRESS &&
      wfCountInv3 === currentWf.length &&
      auditCountInv3 === currentAudit.length &&
      inv3Body.message?.includes('Invalid assignment state transition: Cannot change status from "IN_PROGRESS" to "ASSIGNED"');

    console.log(`Invalid Transition 3 Result: ${inv3Passed ? 'PASS' : 'FAIL'}`);
    if (!inv3Passed) {
      throw new Error(`Invalid Transition 3 failed verification!`);
    }

    // TEST 4: Advance to COMPLETED, then attempt illegal transition from terminal state COMPLETED -> IN_PROGRESS
    console.log('\n[Valid Transition] IN_PROGRESS -> COMPLETED via POST /assignments/:id/complete');
    const resComplete = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({ notes: 'Valid completion note' }),
    });
    const completeBody = await resComplete.json();
    const readBackCompleted = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`HTTP Status: ${resComplete.status}, Sheet Status: ${readBackCompleted?.status} (Expected: COMPLETED)`);

    const wfAfterComplete = await workflowRepository.findAll();
    const termWf = wfAfterComplete.filter((w) => w.entityId === createdAssignmentId);
    termWf.forEach((w) => {
      if (!createdWorkflowIds.includes(w.id)) createdWorkflowIds.push(w.id);
    });
    const auditAfterComplete = await auditLogRepository.findAll();
    const termAudit = auditAfterComplete.filter((a) => a.entityId === createdAssignmentId);
    termAudit.forEach((a) => {
      if (!createdAuditLogIds.includes(a.id)) createdAuditLogIds.push(a.id);
    });

    console.log('\n[Invalid Transition 4] COMPLETED -> IN_PROGRESS via POST /assignments/:id/start (Terminal state reactivation)');
    const resInv4 = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${specialistToken}` },
    });
    const inv4Body = await resInv4.json();
    console.log(`HTTP Status: ${resInv4.status} (Expected: 400)`);
    console.log(`Response error message: "${inv4Body.message || inv4Body.error}"`);

    const readBackInv4 = await assignmentsRepository.findById(createdAssignmentId);
    console.log(`Persisted status in Google Sheets: ${readBackInv4?.status} (Expected: COMPLETED)`);

    const wfAfterInv4 = await workflowRepository.findAll();
    const wfCountInv4 = wfAfterInv4.filter((w) => w.entityId === createdAssignmentId).length;
    const auditAfterInv4 = await auditLogRepository.findAll();
    const auditCountInv4 = auditAfterInv4.filter((a) => a.entityId === createdAssignmentId).length;
    console.log(`Workflow records count: ${wfCountInv4} (Expected: ${termWf.length}, no change)`);
    console.log(`Audit log records count: ${auditCountInv4} (Expected: ${termAudit.length}, no change)`);

    const inv4Passed =
      resInv4.status === 400 &&
      readBackInv4?.status === AssignmentStatus.COMPLETED &&
      wfCountInv4 === termWf.length &&
      auditCountInv4 === termAudit.length &&
      inv4Body.message?.includes('Invalid assignment state transition: Cannot change status from "COMPLETED" to "IN_PROGRESS"');

    console.log(`Invalid Transition 4 Result: ${inv4Passed ? 'PASS' : 'FAIL'}`);
    if (!inv4Passed) {
      throw new Error(`Invalid Transition 4 failed verification!`);
    }

    // -------------------------------------------------------------------------
    // 4. MANDATORY CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Mandatory Self-Cleaning ---');
    if (createdAssignmentId) {
      console.log(`Deleting synthetic Assignment ${createdAssignmentId}...`);
      const delAsn = await assignmentsRepository.deleteRecord(createdAssignmentId);
      console.log(`Assignment deleted:`, delAsn);
    }

    for (const wfId of createdWorkflowIds) {
      console.log(`Deleting synthetic Workflow record ${wfId}...`);
      const delWf = await workflowRepository.deleteRecord(wfId);
      console.log(`Workflow record ${wfId} deleted:`, delWf);
    }

    for (const alId of createdAuditLogIds) {
      console.log(`Deleting synthetic Audit Log record ${alId}...`);
      const delAl = await auditLogRepository.deleteRecord(alId);
      console.log(`Audit Log record ${alId} deleted:`, delAl);
    }

    // -------------------------------------------------------------------------
    // 5. POST-CLEANUP RECONCILIATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Post-Cleanup Reconciliation Snapshot ---');
    const postSnapshot = await getLiveSnapshot();
    console.log('Post-test snapshot:', JSON.stringify(postSnapshot, null, 2));

    const assignmentsRestored = postSnapshot.ASSIGNMENTS === preSnapshot.ASSIGNMENTS;
    const usersUnchanged = postSnapshot.USERS === preSnapshot.USERS;
    const questionsUnchanged = postSnapshot.QUESTIONS === preSnapshot.QUESTIONS;
    const videosUnchanged = postSnapshot.VIDEOS === preSnapshot.VIDEOS;
    const scriptsUnchanged = postSnapshot.SCRIPT === preSnapshot.SCRIPT;
    const thumbnailsUnchanged = postSnapshot.THUMBNAILS === preSnapshot.THUMBNAILS;
    const mastersUnchanged = postSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS;
    const plansUnchanged = postSnapshot.CONTENT_PLANS === preSnapshot.CONTENT_PLANS;
    const batchesUnchanged = postSnapshot.CONTENT_BATCHES === preSnapshot.CONTENT_BATCHES;
    const workflowRestored = postSnapshot.WORKFLOW === preSnapshot.WORKFLOW;
    const auditRestored = postSnapshot.AUDIT_LOG === preSnapshot.AUDIT_LOG;
    const sequencesMonotonic =
      postSnapshot.SEQUENCES === preSnapshot.SEQUENCES &&
      postSnapshot.assignmentSequenceValue >= preSnapshot.assignmentSequenceValue;

    console.log('\nReconciliation Checks:');
    console.log(`  - ASSIGNMENTS restored (${postSnapshot.ASSIGNMENTS}/${preSnapshot.ASSIGNMENTS}): ${assignmentsRestored}`);
    console.log(`  - USERS unchanged (${postSnapshot.USERS}/${preSnapshot.USERS}): ${usersUnchanged}`);
    console.log(`  - QUESTIONS unchanged (${postSnapshot.QUESTIONS}/${preSnapshot.QUESTIONS}): ${questionsUnchanged}`);
    console.log(`  - VIDEOS unchanged (${postSnapshot.VIDEOS}/${preSnapshot.VIDEOS}): ${videosUnchanged}`);
    console.log(`  - SCRIPT unchanged (${postSnapshot.SCRIPT}/${preSnapshot.SCRIPT}): ${scriptsUnchanged}`);
    console.log(`  - THUMBNAILS unchanged (${postSnapshot.THUMBNAILS}/${preSnapshot.THUMBNAILS}): ${thumbnailsUnchanged}`);
    console.log(`  - CONTENT_MASTERS unchanged (${postSnapshot.CONTENT_MASTERS}/${preSnapshot.CONTENT_MASTERS}): ${mastersUnchanged}`);
    console.log(`  - CONTENT_PLANS unchanged (${postSnapshot.CONTENT_PLANS}/${preSnapshot.CONTENT_PLANS}): ${plansUnchanged}`);
    console.log(`  - CONTENT_BATCHES unchanged (${postSnapshot.CONTENT_BATCHES}/${preSnapshot.CONTENT_BATCHES}): ${batchesUnchanged}`);
    console.log(`  - WORKFLOW restored (${postSnapshot.WORKFLOW}/${preSnapshot.WORKFLOW}): ${workflowRestored}`);
    console.log(`  - AUDIT_LOG restored (${postSnapshot.AUDIT_LOG}/${preSnapshot.AUDIT_LOG}): ${auditRestored}`);
    console.log(`  - SEQUENCES monotonically preserved (${preSnapshot.assignmentSequenceValue} -> ${postSnapshot.assignmentSequenceValue}): ${sequencesMonotonic}`);

    // Confirm synthetic records are absent
    const checkAsn = await assignmentsRepository.findById(createdAssignmentId!);
    console.log(`  - Synthetic Assignment ${createdAssignmentId} absent: ${checkAsn === null}`);

    const allWfAfter = await workflowRepository.findAll();
    const synthWfRemaining = allWfAfter.filter((w) => w.entityId === createdAssignmentId);
    console.log(`  - Synthetic Workflow records remaining: ${synthWfRemaining.length} (Expected: 0)`);

    const allAuditAfter = await auditLogRepository.findAll();
    const synthAuditRemaining = allAuditAfter.filter((a) => a.entityId === createdAssignmentId);
    console.log(`  - Synthetic Audit Log records remaining: ${synthAuditRemaining.length} (Expected: 0)`);

    const allPassed =
      assignmentsRestored &&
      usersUnchanged &&
      questionsUnchanged &&
      videosUnchanged &&
      scriptsUnchanged &&
      thumbnailsUnchanged &&
      mastersUnchanged &&
      plansUnchanged &&
      batchesUnchanged &&
      workflowRestored &&
      auditRestored &&
      sequencesMonotonic &&
      checkAsn === null &&
      synthWfRemaining.length === 0 &&
      synthAuditRemaining.length === 0 &&
      aiCallAttempts === 0;

    console.log(`\nTARGETED GAP VERIFICATION: ${allPassed ? 'ALL CHECKS PASSED' : 'VERIFICATION FAILED'}`);

  } catch (error: any) {
    console.error('ERROR during targeted gap verification:', error);
    // Cleanup if partially executed
    if (createdAssignmentId) {
      try {
        await assignmentsRepository.deleteRecord(createdAssignmentId);
      } catch (_) {}
    }
    for (const wfId of createdWorkflowIds) {
      try {
        await workflowRepository.deleteRecord(wfId);
      } catch (_) {}
    }
    for (const alId of createdAuditLogIds) {
      try {
        await auditLogRepository.deleteRecord(alId);
      } catch (_) {}
    }
    throw error;
  } finally {
    server.close();
  }
}

runTargetedGapVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
