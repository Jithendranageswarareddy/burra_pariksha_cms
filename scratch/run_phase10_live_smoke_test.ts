/**
 * BURRA PARIKSHA CMS — Phase 10 Automated Live Backend Smoke Test
 *
 * Strictly tests Phase 10 RBAC & Assignments against LIVE Google Sheets:
 * - Deterministic / non-AI execution (Zero Gemini, Groq, xAI calls)
 * - Strict ₹0 investment constraint
 * - Live Google Sheets persistence and read-back for ASSIGNMENTS
 * - Canonical Assignment ID format: BP-ASN-######
 * - Full lifecycle: ASSIGNED -> IN_PROGRESS -> BLOCKED -> IN_PROGRESS -> COMPLETED
 * - Invalid transition guards & terminal state protection
 * - Live RBAC & Authorization at HTTP boundary:
 *   * Unauthenticated GET /api/assignments -> 401
 *   * Unauthenticated mutation -> 401
 *   * Specialist assignment creation attempt -> 403
 *   * Cross-user mutation attempt -> 403
 *   * Forged actor in body privilege escalation prevention -> 403
 *   * Specialist scoping of GET /api/assignments
 *   * Legitimate assignee self-action -> 200
 *   * Manager / Admin authority -> 200
 * - Audit Log & Workflow transition tracking
 * - Guaranteed complete cleanup with monotonic sequence preservation
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
import { assignmentService } from '../src/lib/services/assignment.service';
import { GeminiService } from '../src/lib/ai/gemini.service';
import { geminiClient } from '../src/lib/ai/gemini.client';
import { apiRouter } from '../src/server/routes';
import {
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
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
  timestamp: string;
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
    timestamp: new Date().toISOString(),
  };
}

export async function runPhase10LiveSmokeTest() {
  console.log('===============================================================');
  console.log('PHASE 10: CONTROLLED AUTOMATED LIVE RBAC & ASSIGNMENTS SMOKE TEST');
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

  // Start in-process Express HTTP server for testing live HTTP authorization boundary
  const app = express();
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
    // 1. PRE-FLIGHT
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Pre-Flight Live Database Snapshot ---');
    preSnapshot = await getLiveSnapshot();
    console.log('Baseline snapshot:', JSON.stringify(preSnapshot, null, 2));

    // Discover active users for role-based authorization testing
    const liveUsers = await usersRepository.findAll();
    const activeUsers = liveUsers.filter((u) => u.isActive);
    console.log(`Discovered ${activeUsers.length} active users in Google Sheets USERS tab:`);
    activeUsers.slice(0, 7).forEach((u) => console.log(`  - [${u.id}] ${u.name} (Role: ${u.role})`));

    const adminUser = activeUsers.find((u) => u.id === 'USR-001' || u.role === UserRole.ADMIN);
    const contentManagerUser = activeUsers.find((u) => u.id === 'USR-002' || u.role === UserRole.CONTENT_MANAGER);
    const specialistAssignee = activeUsers.find((u) => u.id === 'USR-7926' || u.role === UserRole.CONTENT_WRITER);
    const crossUserSpecialist = activeUsers.find((u) => u.id === 'USR-5372' || u.role === UserRole.VIDEO_EDITOR);

    if (!adminUser || !contentManagerUser || !specialistAssignee || !crossUserSpecialist) {
      throw new Error('Missing required active users for Phase 10 verification.');
    }

    // Generate signed session tokens (zero user credential mutation)
    const adminToken = authService.generateSessionToken({
      userId: adminUser.id,
      name: adminUser.name,
      role: String(adminUser.role),
    });
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
    const crossUserToken = authService.generateSessionToken({
      userId: crossUserSpecialist.id,
      name: crossUserSpecialist.name,
      role: String(crossUserSpecialist.role),
    });

    console.log('\nGenerated verified session tokens:');
    console.log(`  - Admin: ${adminUser.id} (${adminUser.name}, Role: ${adminUser.role})`);
    console.log(`  - Content Manager: ${contentManagerUser.id} (${contentManagerUser.name}, Role: ${contentManagerUser.role})`);
    console.log(`  - Specialist (Assignee): ${specialistAssignee.id} (${specialistAssignee.name}, Role: ${specialistAssignee.role})`);
    console.log(`  - Cross-User (Specialist): ${crossUserSpecialist.id} (${crossUserSpecialist.name}, Role: ${crossUserSpecialist.role})\n`);

    // Verify existing safe production Question entity
    const existingQuestions = await questionsRepository.findAll();
    const targetQuestion = existingQuestions.find((q) => q.id === 'BP-Q-1001') || existingQuestions[0];
    console.log(`Target Question entity for assignment: ${targetQuestion.id} (Status: ${targetQuestion.status})\n`);

    // -------------------------------------------------------------------------
    // 2. SPECIFIC GET /assignments SECURITY CHECK
    // -------------------------------------------------------------------------
    console.log('--- Step 2: Specific GET /api/assignments Security Check ---');

    // 2.A Unauthenticated GET /api/assignments -> 401
    const resUnauthGet = await fetch(`${baseUrl}/assignments`);
    const test2aPassed = resUnauthGet.status === 401;
    console.log(`2.A Unauthenticated GET /api/assignments: HTTP ${resUnauthGet.status} (Expected: 401) -> ${test2aPassed ? 'PASS' : 'FAIL'}`);

    // 2.B Authenticated Specialist GET /api/assignments -> Scoped to user's assigned tasks
    const resQeGet = await fetch(`${baseUrl}/assignments`, {
      headers: { Authorization: `Bearer ${specialistToken}` },
    });
    const qeAssignments: any[] = await resQeGet.json();
    const test2bPassed =
      resQeGet.status === 200 &&
      Array.isArray(qeAssignments) &&
      qeAssignments.every((a) => a.assigneeId === specialistAssignee.id);
    console.log(`2.B Authenticated Specialist (${specialistAssignee.id}) GET /api/assignments: HTTP ${resQeGet.status}, returned ${qeAssignments.length} records all scoped to ${specialistAssignee.id} -> ${test2bPassed ? 'PASS' : 'FAIL'}`);

    // 2.C Manager GET /api/assignments -> Full manager visibility
    const resManagerGet = await fetch(`${baseUrl}/assignments`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const managerAssignments: any[] = await resManagerGet.json();
    const test2cPassed =
      resManagerGet.status === 200 &&
      Array.isArray(managerAssignments) &&
      managerAssignments.length >= qeAssignments.length;
    console.log(`2.C Content Manager (${contentManagerUser.id}) GET /api/assignments: HTTP ${resManagerGet.status}, returned ${managerAssignments.length} total records -> ${test2cPassed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 3. SYNTHETIC ASSIGNMENT CREATION & PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('--- Step 3: Synthetic Assignment Creation via Live API ---');

    // 3.A Specialist cannot create assignment -> 403
    const resSpecialistCreate = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({
        entityType: 'QUESTION',
        entityId: targetQuestion.id,
        assigneeId: specialistAssignee.id,
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.NORMAL,
      }),
    });
    const test3aPassed = resSpecialistCreate.status === 403;
    console.log(`3.A Specialist (${specialistAssignee.id}) POST /api/assignments: HTTP ${resSpecialistCreate.status} (Expected: 403) -> ${test3aPassed ? 'PASS' : 'FAIL'}`);

    // 3.B Forged actor privilege escalation attempt -> 403
    const resForgedCreate = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`, // Legitimate token is specialist
      },
      body: JSON.stringify({
        actor: { id: adminUser.id, role: 'ADMIN' }, // Forged body payload
        role: 'ADMIN',
        entityType: 'QUESTION',
        entityId: targetQuestion.id,
        assigneeId: specialistAssignee.id,
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.NORMAL,
      }),
    });
    const test3bPassed = resForgedCreate.status === 403;
    console.log(`3.B Forged Admin in body with Specialist token: HTTP ${resForgedCreate.status} (Expected: 403) -> ${test3bPassed ? 'PASS' : 'FAIL'}`);

    // 3.C Authorized Manager Creates Assignment -> 201
    const futureDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const resManagerCreate = await fetch(`${baseUrl}/assignments`, {
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
        notes: 'PHASE-10-SMOKE-TEST: Controlled live verification assignment',
      }),
    });

    const createdRecord = await resManagerCreate.json();
    createdAssignmentId = createdRecord.id;
    const test3cPassed =
      resManagerCreate.status === 201 &&
      Boolean(createdAssignmentId && createdAssignmentId.startsWith('BP-ASN-')) &&
      createdRecord.status === AssignmentStatus.ASSIGNED &&
      createdRecord.assigneeId === specialistAssignee.id &&
      createdRecord.entityId === targetQuestion.id;

    console.log(`3.C Manager POST /api/assignments: HTTP ${resManagerCreate.status}, Assigned ID: ${createdAssignmentId} -> ${test3cPassed ? 'PASS' : 'FAIL'}`);

    // 3.D Direct Read-Back from Live Google Sheets ASSIGNMENTS repository
    const readBack = await assignmentsRepository.findById(createdAssignmentId!);
    const test3dPassed =
      readBack !== null &&
      readBack.id === createdAssignmentId &&
      readBack.status === AssignmentStatus.ASSIGNED &&
      readBack.assigneeId === specialistAssignee.id &&
      readBack.assigneeName === specialistAssignee.name &&
      readBack.entityType === 'QUESTION' &&
      readBack.entityId === targetQuestion.id &&
      readBack.dueDate === futureDueDate;

    console.log(`3.D Live Sheets read-back verification: ID ${readBack?.id}, Assignee ${readBack?.assigneeName}, Status ${readBack?.status} -> ${test3dPassed ? 'PASS' : 'FAIL'}`);

    // 3.E Duplicate Active Assignment Prevention
    const resDuplicateCreate = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({
        entityType: 'QUESTION',
        entityId: targetQuestion.id,
        assigneeId: specialistAssignee.id,
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.HIGH,
      }),
    });
    const dupBody = await resDuplicateCreate.json();
    const test3ePassed =
      resDuplicateCreate.status === 400 &&
      dupBody.message?.includes('An active assignment already exists');

    console.log(`3.E Duplicate active assignment attempt: HTTP ${resDuplicateCreate.status}, Rejected with "${dupBody.message?.slice(0, 60)}..." -> ${test3ePassed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 4. RBAC & CROSS-USER MUTATION SECURITY
    // -------------------------------------------------------------------------
    console.log('--- Step 4: RBAC & Cross-User Mutation Security ---');

    // 4.A Unauthenticated mutation attempt -> 401
    const resUnauthStart = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
    });
    const test4aPassed = resUnauthStart.status === 401;
    console.log(`4.A Unauthenticated POST /assignments/:id/start: HTTP ${resUnauthStart.status} (Expected: 401) -> ${test4aPassed ? 'PASS' : 'FAIL'}`);

    // 4.B Cross-User mutation attempt (Video Editor mutating Content Writer's task) -> 403
    const resCrossUserStart = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${crossUserToken}` },
    });
    const crossBody = await resCrossUserStart.json();
    const test4bPassed =
      resCrossUserStart.status === 403 &&
      crossBody.error?.includes('You can only update your own assigned tasks');
    console.log(`4.B Cross-User (${crossUserSpecialist.id}) mutation attempt: HTTP ${resCrossUserStart.status} (Expected: 403 Forbidden) -> ${test4bPassed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 5. ASSIGNMENT LIFECYCLE: ASSIGNED -> IN_PROGRESS -> BLOCKED -> IN_PROGRESS -> COMPLETED
    // -------------------------------------------------------------------------
    console.log('--- Step 5: Live Assignment Lifecycle Transitions ---');

    // 5.A Assignee Starts Work -> IN_PROGRESS
    const resStart = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${specialistToken}` },
    });
    const started = await resStart.json();
    const readBackStart = await assignmentsRepository.findById(createdAssignmentId!);
    const test5aPassed =
      resStart.status === 200 &&
      started.status === AssignmentStatus.IN_PROGRESS &&
      readBackStart?.status === AssignmentStatus.IN_PROGRESS;
    console.log(`5.A Assignee Starts Task: HTTP ${resStart.status}, Live Sheet Status: ${readBackStart?.status} -> ${test5aPassed ? 'PASS' : 'FAIL'}`);

    // 5.B Assignee Blocks Task -> BLOCKED (with required reason)
    const blockReason = 'Waiting on clarity for Telugu translation terminology';
    const resBlock = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({ reason: blockReason }),
    });
    const blocked = await resBlock.json();
    const readBackBlock = await assignmentsRepository.findById(createdAssignmentId!);
    const test5bPassed =
      resBlock.status === 200 &&
      blocked.status === AssignmentStatus.BLOCKED &&
      readBackBlock?.status === AssignmentStatus.BLOCKED &&
      readBackBlock?.notes?.includes(blockReason);
    console.log(`5.B Assignee Blocks Task: HTTP ${resBlock.status}, Live Sheet Status: ${readBackBlock?.status}, Note verified -> ${test5bPassed ? 'PASS' : 'FAIL'}`);

    // 5.C Assignee Resumes Work -> IN_PROGRESS
    const resResume = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${specialistToken}` },
    });
    const resumed = await resResume.json();
    const readBackResume = await assignmentsRepository.findById(createdAssignmentId!);
    const test5cPassed =
      resResume.status === 200 &&
      resumed.status === AssignmentStatus.IN_PROGRESS &&
      readBackResume?.status === AssignmentStatus.IN_PROGRESS;
    console.log(`5.C Assignee Resumes Task: HTTP ${resResume.status}, Live Sheet Status: ${readBackResume?.status} -> ${test5cPassed ? 'PASS' : 'FAIL'}`);

    // 5.D Assignee Completes Task -> COMPLETED
    const completionNote = 'All 4 options verified, grammar approved';
    const resComplete = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({ notes: completionNote }),
    });
    const completed = await resComplete.json();
    const readBackComplete = await assignmentsRepository.findById(createdAssignmentId!);
    const test5dPassed =
      resComplete.status === 200 &&
      completed.status === AssignmentStatus.COMPLETED &&
      readBackComplete?.status === AssignmentStatus.COMPLETED &&
      Boolean(readBackComplete?.completedAt) &&
      readBackComplete?.notes?.includes(completionNote);
    console.log(`5.D Assignee Completes Task: HTTP ${resComplete.status}, Live Sheet Status: ${readBackComplete?.status}, CompletedAt: ${readBackComplete?.completedAt} -> ${test5dPassed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 6. INVALID TRANSITION & TERMINAL STATE PROTECTION
    // -------------------------------------------------------------------------
    console.log('--- Step 6: Invalid Transitions & Terminal State Protection ---');

    // 6.A Mutation after COMPLETED -> Reassignment rejected on terminal assignment
    const resReassignTerminal = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/reassign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({
        newAssigneeId: crossUserSpecialist.id,
        notes: 'Attempting invalid reassignment on completed assignment',
      }),
    });
    const termBody = await resReassignTerminal.json();
    const test6aPassed =
      resReassignTerminal.status === 400 &&
      termBody.message?.includes('Cannot reassign a terminal assignment');
    console.log(`6.A Reassign on COMPLETED: HTTP ${resReassignTerminal.status}, Rejected with "${termBody.message}" -> ${test6aPassed ? 'PASS' : 'FAIL'}`);

    // 6.B Idempotent Duplicate Completion
    const resDupComplete = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${specialistToken}`,
      },
      body: JSON.stringify({ notes: 'Idempotent completion call' }),
    });
    const dupCompBody = await resDupComplete.json();
    const test6bPassed =
      resDupComplete.status === 200 &&
      dupCompBody.status === AssignmentStatus.COMPLETED &&
      dupCompBody.id === createdAssignmentId;
    console.log(`6.B Idempotent Completion Call: HTTP ${resDupComplete.status}, Returns existing record cleanly -> ${test6bPassed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 7. AUDIT LOG & WORKFLOW ENTRIES
    // -------------------------------------------------------------------------
    console.log('--- Step 7: Live Audit Log & Workflow Transition Evidence ---');

    const allWf = await workflowRepository.findAll();
    const liveWfRecords = allWf.filter((w) => w.entityId === createdAssignmentId);
    liveWfRecords.forEach((w) => createdWorkflowIds.push(w.id));

    const allAudit = await auditLogRepository.findAll();
    const liveAuditRecords = allAudit.filter((a) => a.entityId === createdAssignmentId);
    liveAuditRecords.forEach((a) => createdAuditLogIds.push(a.id));

    console.log(`Tracked ${liveWfRecords.length} live WORKFLOW entries for assignment ${createdAssignmentId}:`);
    liveWfRecords.forEach((w) => console.log(`  - [${w.id}] ${w.fromStatus} -> ${w.toStatus} (TriggeredBy: ${w.triggeredBy})`));

    console.log(`Tracked ${liveAuditRecords.length} live AUDIT_LOG entries for assignment ${createdAssignmentId}:`);
    liveAuditRecords.forEach((a) => console.log(`  - [${a.id}] Action: ${a.action} (Actor: ${a.actorId})`));

    const test7Passed = liveWfRecords.length >= 4 && liveAuditRecords.length >= 4;
    console.log(`Audit & Workflow trail completeness -> ${test7Passed ? 'PASS' : 'FAIL'}\n`);

    // -------------------------------------------------------------------------
    // 8. MANDATORY CLEANUP
    // -------------------------------------------------------------------------
    console.log('--- Step 8: Mandatory Self-Cleaning ---');

    // 8.1 Delete synthetic assignment
    if (createdAssignmentId) {
      console.log(`Deleting synthetic Assignment ${createdAssignmentId} from Google Sheets ASSIGNMENTS tab...`);
      const delAsn = await assignmentsRepository.deleteRecord(createdAssignmentId);
      console.log(`Assignment ${createdAssignmentId} deleted:`, delAsn);
    }

    // 8.2 Delete synthetic workflow records
    for (const wfId of createdWorkflowIds) {
      console.log(`Deleting synthetic Workflow record ${wfId}...`);
      const delWf = await workflowRepository.deleteRecord(wfId);
      console.log(`Workflow ${wfId} deleted:`, delWf);
    }

    // 8.3 Delete synthetic audit log records
    for (const alId of createdAuditLogIds) {
      console.log(`Deleting synthetic Audit Log record ${alId}...`);
      const delAl = await auditLogRepository.deleteRecord(alId);
      console.log(`Audit Log ${alId} deleted:`, delAl);
    }

    // -------------------------------------------------------------------------
    // 9. POST-CLEANUP RECONCILIATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Post-Cleanup Reconciliation Snapshot ---');
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

    const taxonomyUnchanged =
      postSnapshot.CATEGORIES === preSnapshot.CATEGORIES &&
      postSnapshot.TOPICS === preSnapshot.TOPICS &&
      postSnapshot.SUBTOPICS === preSnapshot.SUBTOPICS;

    const sequencesMonotonic =
      postSnapshot.SEQUENCES === preSnapshot.SEQUENCES &&
      postSnapshot.assignmentSequenceValue >= preSnapshot.assignmentSequenceValue;

    // Verify deleted entities are absent
    const postAsn = await assignmentsRepository.findById(createdAssignmentId!);
    const assignmentGone = postAsn === null;

    console.log('\n--- Final Verification Checklist ---');
    console.log('1. ASSIGNMENTS restored to baseline:', assignmentsRestored);
    console.log('2. USERS unchanged:', usersUnchanged);
    console.log('3. QUESTIONS unchanged:', questionsUnchanged);
    console.log('4. VIDEOS unchanged:', videosUnchanged);
    console.log('5. SCRIPT unchanged:', scriptsUnchanged);
    console.log('6. THUMBNAILS unchanged:', thumbnailsUnchanged);
    console.log('7. CONTENT_MASTERS unchanged:', mastersUnchanged);
    console.log('8. CONTENT_PLANS unchanged:', plansUnchanged);
    console.log('9. CONTENT_BATCHES unchanged:', batchesUnchanged);
    console.log('10. WORKFLOW restored to baseline:', workflowRestored);
    console.log('11. AUDIT_LOG restored to baseline:', auditRestored);
    console.log('12. Taxonomy sheets unchanged:', taxonomyUnchanged);
    console.log('13. SEQUENCES monotonic (advanced from', preSnapshot.assignmentSequenceValue, 'to', postSnapshot.assignmentSequenceValue, '):', sequencesMonotonic);
    console.log('14. Synthetic assignment absent from Google Sheets:', assignmentGone);
    console.log('15. AI request invocations =', aiCallAttempts, '(MUST BE 0)');

    const allPassed =
      test2aPassed &&
      test2bPassed &&
      test2cPassed &&
      test3aPassed &&
      test3bPassed &&
      test3cPassed &&
      test3dPassed &&
      test3ePassed &&
      test4aPassed &&
      test4bPassed &&
      test5aPassed &&
      test5bPassed &&
      test5cPassed &&
      test5dPassed &&
      test6aPassed &&
      test6bPassed &&
      test7Passed &&
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
      taxonomyUnchanged &&
      sequencesMonotonic &&
      assignmentGone &&
      aiCallAttempts === 0;

    return {
      allPassed,
      preSnapshot,
      postSnapshot,
      aiCallAttempts,
      createdAssignmentId,
      createdWorkflowIds,
      createdAuditLogIds,
      targetQuestionId: targetQuestion.id,
      assigneeId: specialistAssignee.id,
      test2aPassed,
      test2bPassed,
      test2cPassed,
      test3aPassed,
      test3bPassed,
      test3cPassed,
      test3dPassed,
      test3ePassed,
      test4aPassed,
      test4bPassed,
      test5aPassed,
      test5bPassed,
      test5cPassed,
      test5dPassed,
      test6aPassed,
      test6bPassed,
      test7Passed,
      assignmentsRestored,
      workflowRestored,
      auditRestored,
      sequencesMonotonic,
      assignmentGone,
    };
  } catch (err: any) {
    console.error('ERROR during live smoke test:', err);
    // Emergency cleanup in catch block
    if (createdAssignmentId) {
      try { await assignmentsRepository.deleteRecord(createdAssignmentId); } catch {}
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

if (process.argv[1] && process.argv[1].includes('run_phase10_live_smoke_test')) {
  runPhase10LiveSmokeTest().then((res) => {
    console.log('\n===============================================================');
    console.log(`FINAL SMOKE TEST RESULT: ${res.allPassed ? 'PASS' : 'FAIL'}`);
    console.log('===============================================================');
    process.exit(res.allPassed ? 0 : 1);
  }).catch((err) => {
    console.error('Smoke test terminated with error:', err);
    process.exit(1);
  });
}
