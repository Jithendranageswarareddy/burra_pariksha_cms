/**
 * BURRA PARIKSHA CMS — Phase 11 Controlled Live Backend Verification
 *
 * Strictly verifies Original Roadmap Phase 11 (Role Dashboards) against LIVE Google Sheets:
 * - Deterministic / non-AI execution (Zero Gemini, Groq, xAI calls)
 * - Strict ₹0 investment constraint
 * - Pre-flight and post-cleanup baseline row counts across all 12 sheets
 * - HTTP Security & RBAC boundaries:
 *   * GET /api/dashboard/overview (401 unauthenticated, 403 all 6 specialists, 200 CM & Admin)
 *   * GET /api/team/workload (401 unauthenticated, 403 specialist, 200 CM & Admin)
 *   * GET /api/my-work (401 unauthenticated, 200 specialists with strict assigneeId scoping)
 *   * Forged ?userId parameter tampering resistance for non-managers
 *   * Manager cross-user personal work inspection
 * - Live assignment-to-dashboard integration using ONE temporary synthetic assignment
 * - Status transition reflection in specialist and manager dashboards
 * - Guaranteed complete cleanup with zero drift and monotonic sequence preservation
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
import { dashboardService } from '../src/lib/services/dashboard.service';
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

export async function runPhase11LiveVerification() {
  console.log('===============================================================');
  console.log('PHASE 11: CONTROLLED LIVE ROLE DASHBOARDS VERIFICATION');
  console.log('===============================================================\n');

  // STRICT ZERO AI ENFORCEMENT
  let aiCallAttempts = 0;
  geminiClient.isConfigured = () => false;
  const geminiInstance = GeminiService.getInstance();
  (geminiInstance as any).callGeminiWithRetryAndFallback = async () => {
    aiCallAttempts++;
    throw new Error('STRICT CONSTRAINT VIOLATION: AI network call attempted during deterministic smoke test!');
  };

  // In-process Express server for HTTP boundary testing
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
    // 1. PRE-FLIGHT BASELINE SNAPSHOT
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Pre-Flight Baseline Snapshot ---');
    preSnapshot = await getLiveSnapshot();
    console.log('Baseline snapshot:', JSON.stringify(preSnapshot, null, 2));

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATION & ROLE ACTORS SETUP
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Role Actors Setup ---');
    const liveUsers = await usersRepository.findAll();
    const activeUsers = liveUsers.filter((u) => u.isActive);

    const adminUser = activeUsers.find((u) => u.id === 'USR-001' || u.role === UserRole.ADMIN)!;
    const cmUser = activeUsers.find((u) => u.id === 'USR-002' || u.role === UserRole.CONTENT_MANAGER)!;
    const qeUser = activeUsers.find((u) => u.id === 'USR-7926')!;
    const veUser = activeUsers.find((u) => u.id === 'USR-5372' || u.role === UserRole.VIDEO_EDITOR)!;
    const swUser = activeUsers.find((u) => u.id === 'USR-8699') || qeUser;
    const designerUser = activeUsers.find((u) => u.id === 'USR-2960') || qeUser;
    const pmUser = activeUsers.find((u) => u.id === 'USR-2818') || qeUser;
    const reviewerUser = activeUsers.find((u) => u.id === 'USR-4968') || qeUser;

    // Tokens
    const adminToken = authService.generateSessionToken({ userId: adminUser.id, name: adminUser.name, role: UserRole.ADMIN });
    const cmToken = authService.generateSessionToken({ userId: cmUser.id, name: cmUser.name, role: UserRole.CONTENT_MANAGER });
    const qeToken = authService.generateSessionToken({ userId: qeUser.id, name: qeUser.name, role: UserRole.QUESTION_EDITOR });
    const swToken = authService.generateSessionToken({ userId: swUser.id, name: swUser.name, role: UserRole.SCRIPT_WRITER });
    const veToken = authService.generateSessionToken({ userId: veUser.id, name: veUser.name, role: UserRole.VIDEO_EDITOR });
    const designerToken = authService.generateSessionToken({ userId: designerUser.id, name: designerUser.name, role: UserRole.DESIGNER });
    const pmToken = authService.generateSessionToken({ userId: pmUser.id, name: pmUser.name, role: UserRole.PUBLISHING_MANAGER });
    const reviewerToken = authService.generateSessionToken({ userId: reviewerUser.id, name: reviewerUser.name, role: UserRole.REVIEWER });

    console.log(`Configured tokens for all 8 roles:`);
    console.log(`  - ADMIN: ${adminUser.id} (${adminUser.name})`);
    console.log(`  - CONTENT_MANAGER: ${cmUser.id} (${cmUser.name})`);
    console.log(`  - QUESTION_EDITOR: ${qeUser.id} (${qeUser.name})`);
    console.log(`  - SCRIPT_WRITER: ${swUser.id} (${swUser.name})`);
    console.log(`  - VIDEO_EDITOR: ${veUser.id} (${veUser.name})`);
    console.log(`  - DESIGNER: ${designerUser.id} (${designerUser.name})`);
    console.log(`  - PUBLISHING_MANAGER: ${pmUser.id} (${pmUser.name})`);
    console.log(`  - REVIEWER: ${reviewerUser.id} (${reviewerUser.name})`);

    // -------------------------------------------------------------------------
    // 3. DASHBOARD OVERVIEW HTTP SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: GET /api/dashboard/overview Security & Access Verification ---');

    // 3.A Unauthenticated -> 401
    const resUnauthOverview = await fetch(`${baseUrl}/dashboard/overview`);
    console.log(`3.A Unauthenticated: HTTP ${resUnauthOverview.status} (Expected: 401) -> ${resUnauthOverview.status === 401 ? 'PASS' : 'FAIL'}`);

    // 3.B - 3.G Specialists -> 403
    const specialists = [
      { name: 'QUESTION_EDITOR', token: qeToken },
      { name: 'SCRIPT_WRITER', token: swToken },
      { name: 'VIDEO_EDITOR', token: veToken },
      { name: 'DESIGNER', token: designerToken },
      { name: 'PUBLISHING_MANAGER', token: pmToken },
      { name: 'REVIEWER', token: reviewerToken },
    ];

    for (const spec of specialists) {
      const res = await fetch(`${baseUrl}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${spec.token}` },
      });
      const passed = res.status === 403;
      console.log(`3.Specialist (${spec.name}): HTTP ${res.status} (Expected: 403) -> ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) throw new Error(`Specialist ${spec.name} was not rejected with 403! Got ${res.status}`);
    }

    // 3.H CONTENT_MANAGER -> 200 with complete contract
    const resCmOverview = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const cmBody = await resCmOverview.json();
    const cmContractValid =
      resCmOverview.status === 200 &&
      Boolean(cmBody.metrics) &&
      Array.isArray(cmBody.todaysWork) &&
      Boolean(cmBody.teamOperations) &&
      Array.isArray(cmBody.bottlenecks) &&
      Array.isArray(cmBody.staleContent) &&
      Array.isArray(cmBody.publishingReadiness);
    console.log(`3.H CONTENT_MANAGER: HTTP ${resCmOverview.status} (Expected: 200), contract valid: ${cmContractValid} -> ${cmContractValid ? 'PASS' : 'FAIL'}`);
    if (!cmContractValid) throw new Error(`CONTENT_MANAGER dashboard overview response failed contract check!`);

    // 3.I ADMIN -> 200 with complete contract
    const resAdminOverview = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminBody = await resAdminOverview.json();
    const adminContractValid =
      resAdminOverview.status === 200 &&
      Boolean(adminBody.metrics) &&
      Array.isArray(adminBody.todaysWork) &&
      Boolean(adminBody.teamOperations);
    console.log(`3.I ADMIN: HTTP ${resAdminOverview.status} (Expected: 200), contract valid: ${adminContractValid} -> ${adminContractValid ? 'PASS' : 'FAIL'}`);
    if (!adminContractValid) throw new Error(`ADMIN dashboard overview response failed contract check!`);

    // -------------------------------------------------------------------------
    // 4. TEAM WORKLOAD SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: GET /api/team/workload Security Verification ---');

    // 4.A Unauthenticated -> 401
    const resUnauthWorkload = await fetch(`${baseUrl}/team/workload`);
    console.log(`4.A Unauthenticated: HTTP ${resUnauthWorkload.status} (Expected: 401) -> ${resUnauthWorkload.status === 401 ? 'PASS' : 'FAIL'}`);

    // 4.B Specialist -> 403
    const resSpecWorkload = await fetch(`${baseUrl}/team/workload`, {
      headers: { Authorization: `Bearer ${qeToken}` },
    });
    console.log(`4.B Specialist (QUESTION_EDITOR): HTTP ${resSpecWorkload.status} (Expected: 403) -> ${resSpecWorkload.status === 403 ? 'PASS' : 'FAIL'}`);
    if (resSpecWorkload.status !== 403) throw new Error(`Specialist was not rejected from /team/workload!`);

    // 4.C CONTENT_MANAGER -> 200
    const resCmWorkload = await fetch(`${baseUrl}/team/workload`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const cmWorkloadBody = await resCmWorkload.json();
    const cmWorkloadValid = resCmWorkload.status === 200 && Array.isArray(cmWorkloadBody.workloads);
    console.log(`4.C CONTENT_MANAGER: HTTP ${resCmWorkload.status}, workloads count: ${cmWorkloadBody.workloads?.length} -> ${cmWorkloadValid ? 'PASS' : 'FAIL'}`);

    // 4.D ADMIN -> 200
    const resAdminWorkload = await fetch(`${baseUrl}/team/workload`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminWorkloadBody = await resAdminWorkload.json();
    const adminWorkloadValid = resAdminWorkload.status === 200 && Array.isArray(adminWorkloadBody.workloads);
    console.log(`4.D ADMIN: HTTP ${resAdminWorkload.status}, workloads count: ${adminWorkloadBody.workloads?.length} -> ${adminWorkloadValid ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------------------
    // 5. PERSONAL WORK QUEUE (GET /api/my-work)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: GET /api/my-work Isolation & Forgery Protection ---');

    // 5.A Unauthenticated -> 401
    const resUnauthMyWork = await fetch(`${baseUrl}/my-work`);
    console.log(`5.A Unauthenticated: HTTP ${resUnauthMyWork.status} (Expected: 401) -> ${resUnauthMyWork.status === 401 ? 'PASS' : 'FAIL'}`);

    // 5.B Each Specialist GET /api/my-work -> 200 and scoped to authenticated user only
    for (const spec of specialists) {
      const res = await fetch(`${baseUrl}/my-work`, {
        headers: { Authorization: `Bearer ${spec.token}` },
      });
      const data = await res.json();
      const allReturnedTasks = [
        ...(data.activeAssignments || []),
        ...(data.completedAssignments || []),
        ...(data.overdue || []),
        ...(data.dueToday || []),
        ...(data.inProgress || []),
        ...(data.blocked || []),
        ...(data.upcoming || []),
      ];
      // Check that every task returned belongs to this user
      // Token payload contains userId
      const tokenPayload: any = authService.verifySessionToken(spec.token);
      const isScoped = allReturnedTasks.every((t) => t.assigneeId === tokenPayload.userId);
      console.log(`5.B Specialist (${spec.name}, User ${tokenPayload.userId}): HTTP ${res.status}, scoped exclusively to user: ${isScoped}`);
      if (res.status !== 200 || !isScoped) {
        throw new Error(`Specialist ${spec.name} personal work queue is not correctly scoped!`);
      }
    }

    // 5.C Forged userId parameter attempt by Specialist -> Server must ignore and return own work
    const resForged = await fetch(`${baseUrl}/my-work?userId=${adminUser.id}`, {
      headers: { Authorization: `Bearer ${qeToken}` }, // QE token requesting Admin's work
    });
    const forgedData = await resForged.json();
    const forgedTasks = [
      ...(forgedData.activeAssignments || []),
      ...(forgedData.completedAssignments || []),
    ];
    const forgedScopingPassed =
      resForged.status === 200 &&
      forgedData.user?.id === qeUser.id && // Must return QE user, NOT admin user
      forgedTasks.every((t) => t.assigneeId === qeUser.id);
    console.log(`5.C Forged ?userId=${adminUser.id} by Specialist (${qeUser.id}): Returned user: ${forgedData.user?.id} (Expected: ${qeUser.id}) -> ${forgedScopingPassed ? 'PASS' : 'FAIL'}`);
    if (!forgedScopingPassed) throw new Error(`Server failed to ignore forged userId parameter!`);

    // 5.D Manager can inspect specialist work queue cleanly
    const resManagerInspect = await fetch(`${baseUrl}/my-work?userId=${qeUser.id}`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const managerInspectData = await resManagerInspect.json();
    const managerInspectPassed =
      resManagerInspect.status === 200 &&
      managerInspectData.user?.id === qeUser.id;
    console.log(`5.D Manager inspects Specialist (${qeUser.id}) queue: HTTP ${resManagerInspect.status}, returned user: ${managerInspectData.user?.id} -> ${managerInspectPassed ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------------------
    // 6. LIVE ASSIGNMENT-TO-DASHBOARD INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Live Assignment-To-Dashboard Integration ---');

    // Select safe existing question
    const existingQuestions = await questionsRepository.findAll();
    const targetQuestion = existingQuestions.find((q) => q.id === 'BP-Q-000002') || existingQuestions[0];
    console.log(`Target Question entity: ${targetQuestion.id}`);

    // Create ONE temporary assignment for QE
    const futureDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const resCreateAsn = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmToken}`,
      },
      body: JSON.stringify({
        entityType: 'QUESTION',
        entityId: targetQuestion.id,
        assigneeId: qeUser.id,
        assignmentRole: 'QUESTION_EDITOR',
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.HIGH,
        dueDate: futureDueDate,
        notes: 'PHASE-11-LIVE-TEST: Dashboard integration verification assignment',
      }),
    });

    const createAsnBody = await resCreateAsn.json();
    createdAssignmentId = createAsnBody.id;
    console.log(`Created temporary assignment: ${createdAssignmentId}, HTTP ${resCreateAsn.status}`);
    if (!createdAssignmentId || !createdAssignmentId.startsWith('BP-ASN-')) {
      throw new Error(`Failed to create temporary assignment: ${JSON.stringify(createAsnBody)}`);
    }

    // Collect created workflow and audit records
    const wfList = await workflowRepository.findAll();
    wfList.filter((w) => w.entityId === createdAssignmentId).forEach((w) => createdWorkflowIds.push(w.id));
    const auditList = await auditLogRepository.findAll();
    auditList.filter((a) => a.entityId === createdAssignmentId).forEach((a) => createdAuditLogIds.push(a.id));

    // 6.A Verify read-back in Specialist GET /api/my-work
    const resQeMyWork1 = await fetch(`${baseUrl}/my-work`, {
      headers: { Authorization: `Bearer ${qeToken}` },
    });
    const qeWorkData1 = await resQeMyWork1.json();
    const foundInSpecialist1 = (qeWorkData1.activeAssignments || []).find((a: any) => a.id === createdAssignmentId);
    console.log(`6.A Temporary assignment visible in Specialist /my-work: ${Boolean(foundInSpecialist1)} (Status: ${foundInSpecialist1?.status}) -> ${foundInSpecialist1 ? 'PASS' : 'FAIL'}`);
    if (!foundInSpecialist1 || foundInSpecialist1.status !== AssignmentStatus.ASSIGNED) {
      throw new Error(`Assignment not found in specialist work queue or status incorrect!`);
    }

    // 6.B Verify assignment accounted in Manager team workload / overview
    dashboardService.clearOverviewCache(); // Clear short-lived cache to test live reflection
    const resCmWorkloadCheck = await fetch(`${baseUrl}/team/workload`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const cmWorkloadData = await resCmWorkloadCheck.json();
    const qeWorkload = (cmWorkloadData.workloads || []).find((w: any) => w.user.id === qeUser.id);
    const foundInTeamWorkload = qeWorkload?.activeAssignments?.some((a: any) => a.id === createdAssignmentId);
    console.log(`6.B Temporary assignment visible in Manager team workload for ${qeUser.name}: ${Boolean(foundInTeamWorkload)} -> ${foundInTeamWorkload ? 'PASS' : 'FAIL'}`);

    // 6.C Minimum lifecycle transition: Specialist starts task -> IN_PROGRESS
    console.log('\nExecuting minimum lifecycle transition: Specialist starts assignment...');
    const resStart = await fetch(`${baseUrl}/assignments/${createdAssignmentId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${qeToken}` },
    });
    console.log(`Start response: HTTP ${resStart.status}`);
    if (resStart.status !== 200) throw new Error('Failed to start assignment');

    // Collect new workflow and audit records
    const wfList2 = await workflowRepository.findAll();
    wfList2.filter((w) => w.entityId === createdAssignmentId && !createdWorkflowIds.includes(w.id)).forEach((w) => createdWorkflowIds.push(w.id));
    const auditList2 = await auditLogRepository.findAll();
    auditList2.filter((a) => a.entityId === createdAssignmentId && !createdAuditLogIds.includes(a.id)).forEach((a) => createdAuditLogIds.push(a.id));

    // Verify updated status in Specialist /my-work
    const resQeMyWork2 = await fetch(`${baseUrl}/my-work`, {
      headers: { Authorization: `Bearer ${qeToken}` },
    });
    const qeWorkData2 = await resQeMyWork2.json();
    const foundInSpecialist2 = (qeWorkData2.inProgress || []).find((a: any) => a.id === createdAssignmentId);
    console.log(`6.C Updated status reflected in Specialist inProgress bucket: ${Boolean(foundInSpecialist2)} (Status: ${foundInSpecialist2?.status}) -> ${foundInSpecialist2 ? 'PASS' : 'FAIL'}`);
    if (!foundInSpecialist2 || foundInSpecialist2.status !== AssignmentStatus.IN_PROGRESS) {
      throw new Error(`Assignment status update not reflected in specialist dashboard!`);
    }

    // -------------------------------------------------------------------------
    // 7. ROLE ISOLATION CHECK ACROSS SPECIALISTS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Role Isolation Check Across Specialists ---');
    // Verify VE does NOT see QE's created task in their /my-work
    const resVeMyWork = await fetch(`${baseUrl}/my-work`, {
      headers: { Authorization: `Bearer ${veToken}` },
    });
    const veWorkData = await resVeMyWork.json();
    const qeTaskInVeQueue = [
      ...(veWorkData.activeAssignments || []),
      ...(veWorkData.completedAssignments || []),
    ].some((a: any) => a.id === createdAssignmentId);
    console.log(`Video Editor cannot see Question Editor's task: ${!qeTaskInVeQueue} -> ${!qeTaskInVeQueue ? 'PASS' : 'FAIL'}`);
    if (qeTaskInVeQueue) throw new Error('Cross-specialist data leakage detected!');

    // -------------------------------------------------------------------------
    // 8. MANDATORY CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Mandatory Self-Cleaning ---');
    if (createdAssignmentId) {
      console.log(`Deleting temporary assignment ${createdAssignmentId}...`);
      const delAsn = await assignmentsRepository.deleteRecord(createdAssignmentId);
      console.log(`Assignment deleted:`, delAsn);
    }

    for (const wfId of createdWorkflowIds) {
      console.log(`Deleting temporary workflow record ${wfId}...`);
      const delWf = await workflowRepository.deleteRecord(wfId);
      console.log(`Workflow record ${wfId} deleted:`, delWf);
    }

    for (const alId of createdAuditLogIds) {
      console.log(`Deleting temporary audit log record ${alId}...`);
      const delAl = await auditLogRepository.deleteRecord(alId);
      console.log(`Audit log record ${alId} deleted:`, delAl);
    }

    // Clear service caches after cleanup
    dashboardService.clearOverviewCache();

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

    const checkAsn = await assignmentsRepository.findById(createdAssignmentId!);
    console.log(`  - Temporary Assignment ${createdAssignmentId} absent: ${checkAsn === null}`);

    const allWfAfter = await workflowRepository.findAll();
    const synthWfRemaining = allWfAfter.filter((w) => w.entityId === createdAssignmentId);
    console.log(`  - Temporary Workflow records remaining: ${synthWfRemaining.length} (Expected: 0)`);

    const allAuditAfter = await auditLogRepository.findAll();
    const synthAuditRemaining = allAuditAfter.filter((a) => a.entityId === createdAssignmentId);
    console.log(`  - Temporary Audit Log records remaining: ${synthAuditRemaining.length} (Expected: 0)`);

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

    console.log(`\nPHASE 11 CONTROLLED LIVE VERIFICATION: ${allPassed ? 'ALL CHECKS PASSED' : 'VERIFICATION FAILED'}`);

  } catch (error: any) {
    console.error('ERROR during Phase 11 live verification:', error);
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

runPhase11LiveVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
