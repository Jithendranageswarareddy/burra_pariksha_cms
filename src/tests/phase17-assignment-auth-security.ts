/**
 * PHASE 17 — ASSIGNMENT MUTATION AUTHENTICATION & AUTHORIZATION HARDENING
 *
 * Verification suite testing:
 * 1. Unauthenticated START -> 401, assignment remains ASSIGNED, no audit mutation.
 * 2. Unauthenticated BLOCK -> 401, assignment remains IN_PROGRESS, no audit mutation.
 * 3. Unauthenticated COMPLETE -> 401, assignment remains IN_PROGRESS, no audit mutation.
 * 4. Authenticated authorized assignee START -> 200, status IN_PROGRESS, audit attribution USR-EDITOR.
 * 5. Authenticated unauthorized user START -> 403, assignment unchanged.
 * 6. Authenticated ADMIN START -> 200, status IN_PROGRESS, audit attribution USR-ADMIN.
 * 7. Authenticated authorized assignee BLOCK -> 200, status BLOCKED, reason note preserved.
 * 8. Authenticated authorized assignee COMPLETE -> 200, status COMPLETED.
 * 9. Fallback-admin protection: Unauthenticated calls never produce mutation/audit attribution using USR-001 or Admin / Content Lead.
 */

import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { assignmentsRepository, auditLogRepository, usersRepository } from '../lib/repositories';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  User,
  UserRole,
} from '../types';

export interface TestResult {
  testId: number;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase17AssignmentAuthSecurityVerification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: TestResult[];
}> {
  console.log('\n===============================================================');
  console.log('PHASE 17: ASSIGNMENT MUTATION AUTHENTICATION & AUTHORIZATION');
  console.log('===============================================================\n');

  const results: TestResult[] = [];

  // 1. In-memory data structures
  const assignmentsMap = new Map<string, Assignment>();
  const usersMap = new Map<string, User>();
  const recordedAuditLogs: any[] = [];

  // Preserve original repository methods
  const origAssignmentFindById = assignmentsRepository.findById;
  const origAssignmentUpdateRecord = assignmentsRepository.updateRecord;
  const origAuditLogAction = auditLogRepository.logAction;
  const origAuditCreate = auditLogRepository.create;
  const origUserFindById = usersRepository.findById;
  const origUserFindAll = usersRepository.findAll;

  // 2. Mock repositories in-memory
  assignmentsRepository.findById = async (id: string) => assignmentsMap.get(id) || null;
  assignmentsRepository.updateRecord = async (id: string, updates: Partial<Assignment>) => {
    const existing = assignmentsMap.get(id);
    if (!existing) return null;
    const updated: Assignment = { ...existing, ...updates };
    assignmentsMap.set(id, updated);
    return updated;
  };

  auditLogRepository.logAction = async (
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, unknown>
  ) => {
    const log = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      changes,
    };
    recordedAuditLogs.push(log);
    return log as any;
  };

  auditLogRepository.create = async (log: any) => {
    recordedAuditLogs.push(log);
    return log;
  };

  usersRepository.findById = async (id: string) => usersMap.get(id) || null;
  usersRepository.findAll = async () => Array.from(usersMap.values());

  // 3. Seed users
  const userEditor: User = {
    id: 'USR-EDITOR',
    name: 'Video Editor User',
    email: 'editor@burrapariksha.com',
    role: UserRole.VIDEO_EDITOR,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const userWriter: User = {
    id: 'USR-WRITER',
    name: 'Script Writer User',
    email: 'writer@burrapariksha.com',
    role: UserRole.SCRIPT_WRITER,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const userOther: User = {
    id: 'USR-OTHER',
    name: 'Other Non-Manager User',
    email: 'speaker@burrapariksha.com',
    role: UserRole.SPEAKER,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const userAdmin: User = {
    id: 'USR-ADMIN',
    name: 'Admin User',
    email: 'admin@burrapariksha.com',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  usersMap.set(userEditor.id, userEditor);
  usersMap.set(userWriter.id, userWriter);
  usersMap.set(userOther.id, userOther);
  usersMap.set(userAdmin.id, userAdmin);

  // 4. Helper to seed assignments
  const seedAssignment = (overrides: Partial<Assignment> & { id: string }): Assignment => {
    const assignment: Assignment = {
      id: overrides.id,
      entityType: AssignmentEntityType.VIDEO,
      entityId: 'BP-V-000001',
      taskType: AssignmentTaskType.EDITING,
      assigneeId: overrides.assigneeId || 'USR-EDITOR',
      assigneeName: overrides.assigneeName || 'Assigned User',
      status: overrides.status || AssignmentStatus.ASSIGNED,
      priority: PriorityLevel.NORMAL,
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
    assignmentsMap.set(assignment.id, assignment);
    return assignment;
  };

  // 5. Seed test assignments
  seedAssignment({ id: 'BP-ASN-101', status: AssignmentStatus.ASSIGNED, assigneeId: 'USR-EDITOR' });
  seedAssignment({ id: 'BP-ASN-102', status: AssignmentStatus.IN_PROGRESS, assigneeId: 'USR-EDITOR' });
  seedAssignment({ id: 'BP-ASN-103', status: AssignmentStatus.IN_PROGRESS, assigneeId: 'USR-EDITOR' });
  seedAssignment({ id: 'BP-ASN-104', status: AssignmentStatus.ASSIGNED, assigneeId: 'USR-EDITOR' });
  seedAssignment({ id: 'BP-ASN-105', status: AssignmentStatus.ASSIGNED, assigneeId: 'USR-WRITER' });
  seedAssignment({ id: 'BP-ASN-106', status: AssignmentStatus.ASSIGNED, assigneeId: 'USR-WRITER' });
  seedAssignment({ id: 'BP-ASN-107', status: AssignmentStatus.IN_PROGRESS, assigneeId: 'USR-EDITOR' });
  seedAssignment({ id: 'BP-ASN-108', status: AssignmentStatus.IN_PROGRESS, assigneeId: 'USR-EDITOR' });

  // 6. Generate authenticated session tokens
  const editorToken = authService.generateSessionToken({
    userId: userEditor.id,
    name: userEditor.name,
    role: userEditor.role,
  });
  const otherToken = authService.generateSessionToken({
    userId: userOther.id,
    name: userOther.name,
    role: userOther.role,
  });
  const adminToken = authService.generateSessionToken({
    userId: userAdmin.id,
    name: userAdmin.name,
    role: userAdmin.role,
  });

  // 7. Setup Express App on ephemeral port
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  let server: http.Server;
  let baseUrl: string;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  try {
    // =========================================================================
    // TEST 1: Unauthenticated START -> 401, assignment remains ASSIGNED, no audit
    // =========================================================================
    const initialAuditCountT1 = recordedAuditLogs.length;
    const res1 = await fetch(`${baseUrl}/assignments/BP-ASN-101/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data1 = await res1.json();
    const a1 = assignmentsMap.get('BP-ASN-101');
    const passed1 =
      res1.status === 401 &&
      a1?.status === AssignmentStatus.ASSIGNED &&
      recordedAuditLogs.length === initialAuditCountT1;

    results.push({
      testId: 1,
      name: 'Unauthenticated START rejected with 401, status unchanged, zero audit logs',
      status: passed1 ? 'PASS' : 'FAIL',
      details: passed1
        ? `HTTP ${res1.status} returned, assignment remained ${a1?.status}, zero audit mutations written.`
        : `Failed: HTTP ${res1.status}, status=${a1?.status}, auditCountDelta=${recordedAuditLogs.length - initialAuditCountT1}, body=${JSON.stringify(data1)}`,
    });

    // =========================================================================
    // TEST 2: Unauthenticated BLOCK -> 401, assignment remains IN_PROGRESS, no audit
    // =========================================================================
    const initialAuditCountT2 = recordedAuditLogs.length;
    const res2 = await fetch(`${baseUrl}/assignments/BP-ASN-102/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Waiting on footage' }),
    });
    const data2 = await res2.json();
    const a2 = assignmentsMap.get('BP-ASN-102');
    const passed2 =
      res2.status === 401 &&
      a2?.status === AssignmentStatus.IN_PROGRESS &&
      recordedAuditLogs.length === initialAuditCountT2;

    results.push({
      testId: 2,
      name: 'Unauthenticated BLOCK rejected with 401, status unchanged, zero audit logs',
      status: passed2 ? 'PASS' : 'FAIL',
      details: passed2
        ? `HTTP ${res2.status} returned, assignment remained ${a2?.status}, zero audit mutations written.`
        : `Failed: HTTP ${res2.status}, status=${a2?.status}, auditCountDelta=${recordedAuditLogs.length - initialAuditCountT2}, body=${JSON.stringify(data2)}`,
    });

    // =========================================================================
    // TEST 3: Unauthenticated COMPLETE -> 401, assignment remains IN_PROGRESS, no audit
    // =========================================================================
    const initialAuditCountT3 = recordedAuditLogs.length;
    const res3 = await fetch(`${baseUrl}/assignments/BP-ASN-103/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Completed task' }),
    });
    const data3 = await res3.json();
    const a3 = assignmentsMap.get('BP-ASN-103');
    const passed3 =
      res3.status === 401 &&
      a3?.status === AssignmentStatus.IN_PROGRESS &&
      recordedAuditLogs.length === initialAuditCountT3;

    results.push({
      testId: 3,
      name: 'Unauthenticated COMPLETE rejected with 401, status unchanged, zero audit logs',
      status: passed3 ? 'PASS' : 'FAIL',
      details: passed3
        ? `HTTP ${res3.status} returned, assignment remained ${a3?.status}, zero audit mutations written.`
        : `Failed: HTTP ${res3.status}, status=${a3?.status}, auditCountDelta=${recordedAuditLogs.length - initialAuditCountT3}, body=${JSON.stringify(data3)}`,
    });

    // =========================================================================
    // TEST 4: Authenticated authorized assignee START -> 200, IN_PROGRESS, audit attribution USR-EDITOR
    // =========================================================================
    const res4 = await fetch(`${baseUrl}/assignments/BP-ASN-104/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${editorToken}`,
      },
    });
    const data4 = await res4.json();
    const a4 = assignmentsMap.get('BP-ASN-104');
    const latestAudit4 = recordedAuditLogs[recordedAuditLogs.length - 1];
    const passed4 =
      res4.status === 200 &&
      a4?.status === AssignmentStatus.IN_PROGRESS &&
      latestAudit4?.actorId === 'USR-EDITOR' &&
      latestAudit4?.action === 'ASSIGNMENT_STARTED';

    results.push({
      testId: 4,
      name: 'Authenticated authorized assignee START succeeds with 200, status IN_PROGRESS, attribution USR-EDITOR',
      status: passed4 ? 'PASS' : 'FAIL',
      details: passed4
        ? `HTTP 200, assignment updated to ${a4?.status}, audit log attributed to ${latestAudit4?.actorId}.`
        : `Failed: HTTP ${res4.status}, status=${a4?.status}, auditActor=${latestAudit4?.actorId}, body=${JSON.stringify(data4)}`,
    });

    // =========================================================================
    // TEST 5: Authenticated unauthorized user START -> 403, assignment unchanged
    // =========================================================================
    const initialAuditCountT5 = recordedAuditLogs.length;
    const res5 = await fetch(`${baseUrl}/assignments/BP-ASN-105/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otherToken}`,
      },
    });
    const data5 = await res5.json();
    const a5 = assignmentsMap.get('BP-ASN-105');
    const passed5 =
      res5.status === 403 &&
      a5?.status === AssignmentStatus.ASSIGNED &&
      recordedAuditLogs.length === initialAuditCountT5;

    results.push({
      testId: 5,
      name: 'Authenticated unauthorized user START rejected with 403, assignment unchanged',
      status: passed5 ? 'PASS' : 'FAIL',
      details: passed5
        ? `HTTP 403 returned, error="${data5.error}", assignment status remained ${a5?.status}.`
        : `Failed: HTTP ${res5.status}, status=${a5?.status}, body=${JSON.stringify(data5)}`,
    });

    // =========================================================================
    // TEST 6: Authenticated ADMIN START -> 200, IN_PROGRESS, audit attribution USR-ADMIN
    // =========================================================================
    const res6 = await fetch(`${baseUrl}/assignments/BP-ASN-106/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const data6 = await res6.json();
    const a6 = assignmentsMap.get('BP-ASN-106');
    const latestAudit6 = recordedAuditLogs[recordedAuditLogs.length - 1];
    const passed6 =
      res6.status === 200 &&
      a6?.status === AssignmentStatus.IN_PROGRESS &&
      latestAudit6?.actorId === 'USR-ADMIN' &&
      latestAudit6?.action === 'ASSIGNMENT_STARTED';

    results.push({
      testId: 6,
      name: 'Authenticated ADMIN START succeeds on third-party task with 200, status IN_PROGRESS, attribution USR-ADMIN',
      status: passed6 ? 'PASS' : 'FAIL',
      details: passed6
        ? `HTTP 200, assignment updated to ${a6?.status}, audit log attributed to ${latestAudit6?.actorId}.`
        : `Failed: HTTP ${res6.status}, status=${a6?.status}, auditActor=${latestAudit6?.actorId}, body=${JSON.stringify(data6)}`,
    });

    // =========================================================================
    // TEST 7: Authenticated authorized assignee BLOCK -> 200, BLOCKED, note behavior intact
    // =========================================================================
    const blockReason = 'Waiting on asset delivery from design team';
    const res7 = await fetch(`${baseUrl}/assignments/BP-ASN-107/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${editorToken}`,
      },
      body: JSON.stringify({ reason: blockReason }),
    });
    const data7 = await res7.json();
    const a7 = assignmentsMap.get('BP-ASN-107');
    const latestAudit7 = recordedAuditLogs[recordedAuditLogs.length - 1];
    const hasNote = Boolean(a7?.notes && a7.notes.includes(blockReason));
    const passed7 =
      res7.status === 200 &&
      a7?.status === AssignmentStatus.BLOCKED &&
      hasNote &&
      latestAudit7?.actorId === 'USR-EDITOR' &&
      latestAudit7?.action === 'ASSIGNMENT_BLOCKED';

    results.push({
      testId: 7,
      name: 'Authenticated authorized assignee BLOCK succeeds with 200, status BLOCKED, reason note preserved',
      status: passed7 ? 'PASS' : 'FAIL',
      details: passed7
        ? `HTTP 200, assignment transitioned to BLOCKED, note contains reason, audit attributed to USR-EDITOR.`
        : `Failed: HTTP ${res7.status}, status=${a7?.status}, hasNote=${hasNote}, body=${JSON.stringify(data7)}`,
    });

    // =========================================================================
    // TEST 8: Authenticated authorized assignee COMPLETE -> 200, COMPLETED
    // =========================================================================
    const res8 = await fetch(`${baseUrl}/assignments/BP-ASN-108/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${editorToken}`,
      },
      body: JSON.stringify({ notes: 'Video editing complete and reviewed' }),
    });
    const data8 = await res8.json();
    const a8 = assignmentsMap.get('BP-ASN-108');
    const latestAudit8 = recordedAuditLogs[recordedAuditLogs.length - 1];
    const passed8 =
      res8.status === 200 &&
      a8?.status === AssignmentStatus.COMPLETED &&
      latestAudit8?.actorId === 'USR-EDITOR' &&
      latestAudit8?.action === 'ASSIGNMENT_COMPLETED';

    results.push({
      testId: 8,
      name: 'Authenticated authorized assignee COMPLETE succeeds with 200, status COMPLETED',
      status: passed8 ? 'PASS' : 'FAIL',
      details: passed8
        ? `HTTP 200, assignment transitioned to COMPLETED, audit log attributed to USR-EDITOR.`
        : `Failed: HTTP ${res8.status}, status=${a8?.status}, body=${JSON.stringify(data8)}`,
    });

    // =========================================================================
    // TEST 9: Fallback-admin protection: Unauthenticated calls never produce USR-001 attribution
    // =========================================================================
    // Send unauthenticated requests to start, block, complete on arbitrary non-existent or existing assignments
    await fetch(`${baseUrl}/assignments/BP-ASN-101/start`, { method: 'POST' });
    await fetch(`${baseUrl}/assignments/BP-ASN-102/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Malicious block attempt' }),
    });
    await fetch(`${baseUrl}/assignments/BP-ASN-103/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Malicious complete attempt' }),
    });

    // Verify zero audit logs or mutations were ever recorded under USR-001 or 'Admin / Content Lead'
    const fallbackAuditRecords = recordedAuditLogs.filter(
      (log) => log.actorId === 'USR-001' || log.actorName === 'Admin / Content Lead'
    );
    const passed9 = fallbackAuditRecords.length === 0;

    results.push({
      testId: 9,
      name: 'Fallback-admin protection: Unauthenticated calls rejected before service mutation or USR-001 attribution',
      status: passed9 ? 'PASS' : 'FAIL',
      details: passed9
        ? `Verified zero audit records created under USR-001 / Admin fallback identity across all unauthenticated attempts.`
        : `Security breach: Found ${fallbackAuditRecords.length} audit records attributed to USR-001! Records: ${JSON.stringify(fallbackAuditRecords)}`,
    });
  } finally {
    // Restore repositories
    assignmentsRepository.findById = origAssignmentFindById;
    assignmentsRepository.updateRecord = origAssignmentUpdateRecord;
    auditLogRepository.logAction = origAuditLogAction;
    auditLogRepository.create = origAuditCreate;
    usersRepository.findById = origUserFindById;
    usersRepository.findAll = origUserFindAll;

    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Print Summary
  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const passed = failedChecks === 0;

  console.log('Test Results:');
  console.log('---------------------------------------------------------------');
  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${String(r.testId).padStart(2, ' ')}] ${icon} - ${r.name}`);
    console.log(`     Details: ${r.details}\n`);
  });

  console.log('===============================================================');
  console.log(`TOTAL: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log(`RESULT: ${passed ? 'ALL PHASE 17 SECURITY CHECKS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

const isDirectRun = process.argv[1] && (
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith('phase17-assignment-auth-security.ts')
);

if (isDirectRun) {
  runPhase17AssignmentAuthSecurityVerification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
