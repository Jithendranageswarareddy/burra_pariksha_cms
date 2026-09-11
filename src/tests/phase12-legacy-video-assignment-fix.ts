/**
 * BURRA PARIKSHA CMS — PHASE 12 PRE-LIVE FIX: LEGACY VIDEO ASSIGNMENT CANONICALIZATION TEST
 *
 * Verifies that the legacy route POST /api/videos/:id/assignments:
 * 1. Uses canonical assignment creation via assignmentService.createAssignment.
 * 2. Generates canonical BP-ASN-****** sequence IDs.
 * 3. Forces entityType = 'VIDEO'.
 * 4. Forces entityId = route :id.
 * 5. Enforces RBAC boundaries (401 unauth, 403 specialist, 201 Admin/CM).
 * 6. Prevents privilege escalation from forged actor/role data in body.
 * 7. Generates zero legacy ASG-* assignment IDs.
 * 8. Reuses canonical duplicate assignment protection.
 *
 * Constraint: ₹0 cost, 0 live AI calls, 0 Google Sheets writes (100% ephemeral in-memory).
 */

import express, { Express } from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { idService } from '../lib/services/id.service';
import {
  UserRole,
  VideoProductionStatus,
  Assignment,
  Video,
  User,
  AssignmentStatus,
  PriorityLevel,
} from '../types';

interface CheckItem {
  id: number;
  name: string;
  pass: boolean;
  details: string;
}

export async function runPhase12LegacyVideoAssignmentFixVerification(): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  checks: CheckItem[];
}> {
  console.log('\n===============================================================');
  console.log('PHASE 12 PRE-LIVE FIX: LEGACY VIDEO ASSIGNMENT CANONICALIZATION');
  console.log('===============================================================\n');

  const checks: CheckItem[] = [];
  let checkCounter = 0;

  function recordCheck(name: string, condition: boolean, details: string) {
    checkCounter++;
    const pass = Boolean(condition);
    checks.push({ id: checkCounter, name, pass, details });
    if (pass) {
      console.log(`[PASS] Check #${checkCounter}: ${name}`);
    } else {
      console.error(`[FAIL] Check #${checkCounter}: ${name} — ${details}`);
    }
  }

  // Ensure zero external side-effects
  process.env.GOOGLE_SPREADSHEET_ID = '';
  (videosRepository as any).client.isConfigured = () => false;
  (assignmentsRepository as any).client.isConfigured = () => false;
  (usersRepository as any).client.isConfigured = () => false;

  // In-memory repositories
  const mockVideos: Record<string, Video> = {};
  const mockAssignments: Record<string, Assignment> = {};
  const mockUsers: Record<string, User> = {};

  const origFindVideoById = videosRepository.findById;
  const origUpdateVideoRecord = videosRepository.updateRecord;
  const origFindAssignmentById = assignmentsRepository.findById;
  const origAppendAssignment = assignmentsRepository.appendRecord;
  const origFindActiveByEntity = assignmentsRepository.findActiveByEntity;
  const origFindAllAssignments = assignmentsRepository.findAll;
  const origFindUserById = usersRepository.findById;
  const origAllocateAssignmentId = idService.allocateAssignmentId;

  let sequenceCounter = 130;
  idService.allocateAssignmentId = async () => {
    sequenceCounter++;
    return `BP-ASN-${String(sequenceCounter).padStart(6, '0')}`;
  };

  videosRepository.findById = async (id: string) => mockVideos[id] || null;
  videosRepository.updateRecord = async (id: string, updates: Partial<Video>) => {
    if (!mockVideos[id]) return null;
    mockVideos[id] = { ...mockVideos[id], ...updates, updatedAt: new Date().toISOString() };
    return mockVideos[id];
  };

  assignmentsRepository.findById = async (id: string) => mockAssignments[id] || null;
  assignmentsRepository.appendRecord = async (record: Assignment) => {
    mockAssignments[record.id] = { ...record };
    return mockAssignments[record.id];
  };
  assignmentsRepository.findActiveByEntity = async (entityType: string, entityId: string) => {
    return Object.values(mockAssignments).filter(
      (a) =>
        a.entityType === entityType &&
        a.entityId === entityId &&
        a.status !== AssignmentStatus.COMPLETED &&
        a.status !== AssignmentStatus.CANCELLED
    );
  };
  assignmentsRepository.findAll = async () => Object.values(mockAssignments);

  usersRepository.findById = async (id: string) => mockUsers[id] || null;

  // Seed test users
  mockUsers['USR-ADMIN'] = {
    id: 'USR-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
    email: 'admin@burrapariksha.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers['USR-CNTMGR'] = {
    id: 'USR-CNTMGR',
    name: 'Content Manager',
    role: UserRole.CONTENT_MANAGER,
    email: 'cm@burrapariksha.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers['USR-EDITOR-1'] = {
    id: 'USR-EDITOR-1',
    name: 'Ravi Editor',
    role: UserRole.VIDEO_EDITOR,
    email: 'ravi@burrapariksha.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers['USR-EDITOR-INACTIVE'] = {
    id: 'USR-EDITOR-INACTIVE',
    name: 'Inactive Editor',
    role: UserRole.VIDEO_EDITOR,
    email: 'inactive@burrapariksha.com',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers['USR-REVIEWER'] = {
    id: 'USR-REVIEWER',
    name: 'Anil Reviewer',
    role: UserRole.REVIEWER,
    email: 'anil@burrapariksha.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed test videos
  mockVideos['BP-V-000101'] = {
    id: 'BP-V-000101',
    questionId: 'BP-Q-000001',
    contentMasterId: 'BP-MST-000001',
    title: 'Speed Maths Short #1',
    status: VideoProductionStatus.EDITING,
    priority: PriorityLevel.HIGH,
    targetDurationSeconds: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockVideos['BP-V-000102'] = {
    id: 'BP-V-000102',
    questionId: 'BP-Q-000002',
    contentMasterId: 'BP-MST-000002',
    title: 'Speed Maths Short #2',
    status: VideoProductionStatus.RECORDED,
    priority: PriorityLevel.NORMAL,
    targetDurationSeconds: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Tokens
  const adminToken = authService.generateSessionToken({
    userId: 'USR-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
    email: 'admin@burrapariksha.com',
  });
  const contentMgrToken = authService.generateSessionToken({
    userId: 'USR-CNTMGR',
    name: 'Content Manager',
    role: UserRole.CONTENT_MANAGER,
    email: 'cm@burrapariksha.com',
  });
  const editorToken = authService.generateSessionToken({
    userId: 'USR-EDITOR-1',
    name: 'Ravi Editor',
    role: UserRole.VIDEO_EDITOR,
    email: 'ravi@burrapariksha.com',
  });
  const reviewerToken = authService.generateSessionToken({
    userId: 'USR-REVIEWER',
    name: 'Anil Reviewer',
    role: UserRole.REVIEWER,
    email: 'anil@burrapariksha.com',
  });

  // Ephemeral test HTTP server
  const app: Express = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://localhost:${port}/api`;

  async function request(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    token?: string | null,
    body?: any
  ): Promise<{ status: number; body: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let resBody: any = null;
    try {
      resBody = await response.json();
    } catch {
      resBody = null;
    }

    return { status: response.status, body: resBody };
  }

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Role Validation & RBAC
    // --------------------------------------------------------------------------
    const unauthRes = await request('/videos/BP-V-000101/assignments', 'POST', null, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });
    recordCheck(
      'RBAC: Anonymous request rejected with 401 Unauthorized',
      unauthRes.status === 401,
      `Status: ${unauthRes.status}`
    );

    const reviewerRes = await request('/videos/BP-V-000101/assignments', 'POST', reviewerToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });
    recordCheck(
      'RBAC: Non-manager specialist (REVIEWER) rejected with 403 Forbidden',
      reviewerRes.status === 403,
      `Status: ${reviewerRes.status}`
    );

    const editorRes = await request('/videos/BP-V-000101/assignments', 'POST', editorToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });
    recordCheck(
      'RBAC: Specialist VIDEO_EDITOR cannot assign videos (403 Forbidden)',
      editorRes.status === 403,
      `Status: ${editorRes.status}`
    );

    // --------------------------------------------------------------------------
    // TEST 2: Forged Actor/Role Data in Body Cannot Elevate Privileges
    // --------------------------------------------------------------------------
    const forgedRes = await request('/videos/BP-V-000101/assignments', 'POST', editorToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
      role: 'ADMIN',
      actor: { id: 'USR-ADMIN', role: 'ADMIN' },
    });
    recordCheck(
      'Security: Body cannot spoof actor/role to bypass route RBAC (403 Forbidden)',
      forgedRes.status === 403,
      `Status: ${forgedRes.status}`
    );

    // --------------------------------------------------------------------------
    // TEST 3: Authorized Admin Call Generates Canonical BP-ASN-****** ID
    // --------------------------------------------------------------------------
    const adminCreateRes = await request('/videos/BP-V-000101/assignments', 'POST', adminToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
      notes: 'Please cut first rough edit by Friday',
    });

    recordCheck(
      'Canonical ID: Successful assignment returns 201 Created',
      adminCreateRes.status === 201,
      `Status: ${adminCreateRes.status}`
    );

    const assignment = adminCreateRes.body;
    recordCheck(
      'Canonical ID: Assignment ID matches sequence pattern BP-ASN-******',
      typeof assignment?.id === 'string' && /^BP-ASN-\d{6}$/.test(assignment.id),
      `Generated ID: ${assignment?.id}`
    );

    recordCheck(
      'Entity Integrity: Assignment entityType is VIDEO',
      assignment?.entityType === 'VIDEO',
      `entityType: ${assignment?.entityType}`
    );

    recordCheck(
      'Entity Integrity: Assignment entityId equals route video ID (BP-V-000101)',
      assignment?.entityId === 'BP-V-000101',
      `entityId: ${assignment?.entityId}`
    );

    recordCheck(
      'Lifecycle: Assignment starts in canonical Phase 10 status ASSIGNED',
      assignment?.status === AssignmentStatus.ASSIGNED,
      `Status: ${assignment?.status}`
    );

    recordCheck(
      'UI Helper: Video assignedEditor field is synchronized with assignee name',
      mockVideos['BP-V-000101']?.assignedEditor === 'Ravi Editor',
      `assignedEditor: ${mockVideos['BP-V-000101']?.assignedEditor}`
    );

    // --------------------------------------------------------------------------
    // TEST 4: Forced EntityId Overrides Body Spoofing
    // --------------------------------------------------------------------------
    const spoofEntityRes = await request('/videos/BP-V-000102/assignments', 'POST', contentMgrToken, {
      entityType: 'QUESTION', // Attempted override
      entityId: 'BP-Q-999999', // Attempted override
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });

    recordCheck(
      'Anti-Tampering: Route forces entityType = VIDEO and entityId = route param ID',
      spoofEntityRes.status === 201 &&
        spoofEntityRes.body?.entityType === 'VIDEO' &&
        spoofEntityRes.body?.entityId === 'BP-V-000102',
      `Result: entityType=${spoofEntityRes.body?.entityType}, entityId=${spoofEntityRes.body?.entityId}`
    );

    // --------------------------------------------------------------------------
    // TEST 5: Verify ZERO Legacy ASG-* IDs Exist in Repository
    // --------------------------------------------------------------------------
    const allAssignments = Object.values(mockAssignments);
    const hasLegacyIds = allAssignments.some((a) => a.id.startsWith('ASG-'));
    const allCanonicalIds = allAssignments.every((a) => a.id.startsWith('BP-ASN-'));

    recordCheck(
      'No Legacy IDs: Zero ASG-* assignments created in repository',
      !hasLegacyIds && allAssignments.length === 2,
      `Total assignments: ${allAssignments.length}, hasLegacyIds: ${hasLegacyIds}`
    );

    recordCheck(
      'Sequence Backed: All created assignments start with canonical BP-ASN-',
      allCanonicalIds,
      `IDs: ${allAssignments.map((a) => a.id).join(', ')}`
    );

    // --------------------------------------------------------------------------
    // TEST 6: Duplicate Active Assignment Protection Reused from Phase 10
    // --------------------------------------------------------------------------
    const duplicateRes = await request('/videos/BP-V-000101/assignments', 'POST', adminToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });

    recordCheck(
      'Duplicate Protection: Duplicate active assignment on same video/task is rejected (400 Bad Request)',
      duplicateRes.status === 400 && duplicateRes.body?.message?.includes('already exists'),
      `Status: ${duplicateRes.status}, Message: ${duplicateRes.body?.message}`
    );

    // --------------------------------------------------------------------------
    // TEST 7: Inactive Assignee User Rejection
    // --------------------------------------------------------------------------
    const inactiveUserRes = await request('/videos/BP-V-000102/assignments', 'POST', adminToken, {
      assigneeId: 'USR-EDITOR-INACTIVE',
      taskType: 'RECORDING',
    });

    recordCheck(
      'User Validation: Assigning to inactive user is rejected (400 Bad Request)',
      inactiveUserRes.status === 400 && inactiveUserRes.body?.message?.includes('inactive user'),
      `Status: ${inactiveUserRes.status}, Message: ${inactiveUserRes.body?.message}`
    );

    // --------------------------------------------------------------------------
    // TEST 8: Non-Existent Video ID Returns 404
    // --------------------------------------------------------------------------
    const nonExistentRes = await request('/videos/BP-V-NONEXISTENT/assignments', 'POST', adminToken, {
      assigneeId: 'USR-EDITOR-1',
      taskType: 'EDITING',
    });

    recordCheck(
      'Reference Integrity: Non-existent video returns 404 Not Found',
      nonExistentRes.status === 404,
      `Status: ${nonExistentRes.status}`
    );
  } finally {
    // Restore repository methods
    videosRepository.findById = origFindVideoById;
    videosRepository.updateRecord = origUpdateVideoRecord;
    assignmentsRepository.findById = origFindAssignmentById;
    assignmentsRepository.appendRecord = origAppendAssignment;
    assignmentsRepository.findActiveByEntity = origFindActiveByEntity;
    assignmentsRepository.findAll = origFindAllAssignments;
    usersRepository.findById = origFindUserById;
    idService.allocateAssignmentId = origAllocateAssignmentId;

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;
  const allPassed = failed === 0 && passed === checks.length;

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passed}/${checks.length} Checks PASSED (${failed} Failed)`);
  console.log(`STATUS: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('===============================================================\n');

  return {
    allPassed,
    total: checks.length,
    passed,
    failed,
    checks,
  };
}

if (process.argv[1]?.includes('phase12-legacy-video-assignment-fix')) {
  runPhase12LegacyVideoAssignmentFixVerification()
    .then((result) => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during test run:', err);
      process.exit(1);
    });
}
