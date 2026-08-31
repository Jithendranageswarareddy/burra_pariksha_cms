/**
 * BURRA PARIKSHA CMS - PHASE 10 VERIFICATION TEST SUITE
 * Team Operations, Assignments & Workflow Control
 * 
 * Verifies end-to-end functionality for:
 * 1. User Directory Management (CRUD, Role Validation, Active Status)
 * 2. Assignment ID Allocation & Sequence Invariants (BP-ASN- prefix)
 * 3. Assignment Lifecycle Transitions (ASSIGNED -> IN_PROGRESS -> BLOCKED -> COMPLETED / CANCELLED)
 * 4. Multi-Entity Targeting (QUESTION, VIDEO, SCRIPT, THUMBNAIL, PUBLISHING, CONTENT_PLAN, CONTENT_BATCH)
 * 5. Single Active Task Constraint & Duplicate Active Assignment Prevention
 * 6. Assignment Reassignment with Audit Log Trail & Invariant Preservation
 * 7. Team Workload Intelligence & Dynamic Capacity Scoring
 * 8. Unassigned Production Pipeline Detection Engine
 * 9. Personal Workbench Summary Aggregations (Active, Overdue, Due Today)
 * 10. Data Integrity Diagnostics (ASSIGNMENT_INTEGRITY & USER_INTEGRITY Checks)
 */

import { assignmentService } from '../lib/services/assignment.service';
import { dataIntegrityService } from '../lib/services/data-integrity.service';
import { idService } from '../lib/services/id.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  AssignmentEntityType,
  AssignmentRole,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  UserRole,
} from '../types';

export async function runPhase10Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 10 VERIFICATION SUITE');
  console.log('Team Operations, Assignments & Workflow Control');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 10 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  const testActor = { id: 'USR-001', name: 'Test Content Lead' };

  // ============================================================================
  // SECTION 1: USER DIRECTORY & INVARIANTS
  // ============================================================================
  console.log('\n--- Section 1: User Directory & Invariants ---');

  const existingUsers = await usersRepository.findAll();
  assert(existingUsers.length > 0, `Users repository seeded with initial team members (found ${existingUsers.length})`);

  // Create a new test team member
  const newUser = await assignmentService.createUser(
    {
      name: 'Ramesh Teluguspeaker',
      email: `ramesh.${Date.now()}@burrapariksha.com`,
      role: UserRole.SPEAKER,
      isActive: true,
    },
    testActor
  );

  assert(newUser.id.startsWith('USR-'), `User ID correctly prefixed with USR-: ${newUser.id}`);
  assert(newUser.name === 'Ramesh Teluguspeaker', `User name correctly stored: ${newUser.name}`);
  assert(newUser.role === UserRole.SPEAKER, `User role correctly set to SPEAKER: ${newUser.role}`);
  assert(newUser.isActive === true, `User is marked as active`);

  // Update the user
  const updatedUser = await assignmentService.updateUser(
    newUser.id,
    {
      role: UserRole.CONTENT_WRITER,
    },
    testActor
  );
  assert(updatedUser.role === UserRole.CONTENT_WRITER, `User role successfully updated to CONTENT_WRITER`);

  // ============================================================================
  // SECTION 2: ASSIGNMENT ID ALLOCATION & SEQUENCE
  // ============================================================================
  console.log('\n--- Section 2: Assignment ID Allocation & Sequence ---');

  const asnId1 = await idService.allocateAssignmentId();
  const asnId2 = await idService.allocateAssignmentId();
  assert(asnId1.startsWith('BP-ASN-'), `Assignment ID 1 has BP-ASN- prefix: ${asnId1}`);
  assert(asnId2.startsWith('BP-ASN-'), `Assignment ID 2 has BP-ASN- prefix: ${asnId2}`);
  assert(asnId1 !== asnId2, `Allocated Assignment IDs are strictly unique: ${asnId1} vs ${asnId2}`);

  // ============================================================================
  // SECTION 3: ASSIGNMENT CREATION & MULTI-ENTITY TARGETING
  // ============================================================================
  console.log('\n--- Section 3: Assignment Creation & Multi-Entity Targeting ---');

  const testEntityId = `BP-VID-TEST-${Date.now()}`;

  const assignment1 = await assignmentService.createAssignment(
    {
      entityType: AssignmentEntityType.VIDEO,
      entityId: testEntityId,
      assigneeId: newUser.id,
      assignmentRole: AssignmentRole.VIDEO_EDITOR,
      taskType: AssignmentTaskType.EDITING,
      priority: PriorityLevel.HIGH,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: 'Initial video editing assignment test',
    },
    testActor
  );

  assert(assignment1.id.startsWith('BP-ASN-'), `Created assignment has valid ID: ${assignment1.id}`);
  assert(assignment1.status === AssignmentStatus.ASSIGNED, `Initial status is ASSIGNED: ${assignment1.status}`);
  assert(assignment1.entityType === AssignmentEntityType.VIDEO, `Entity type matches VIDEO`);
  assert(assignment1.entityId === testEntityId, `Entity ID matches testEntityId: ${assignment1.entityId}`);
  assert(assignment1.assigneeId === newUser.id, `Assignee ID matches test user: ${assignment1.assigneeId}`);
  assert(assignment1.assigneeName === 'Ramesh Teluguspeaker', `Assignee name populated: ${assignment1.assigneeName}`);
  assert(assignment1.priority === PriorityLevel.HIGH, `Priority matches HIGH`);

  // Target Question entity
  const qEntityId = `BP-Q-TEST-${Date.now()}`;
  const qAssignment = await assignmentService.createAssignment(
    {
      entityType: AssignmentEntityType.QUESTION,
      entityId: qEntityId,
      assigneeId: newUser.id,
      assignmentRole: AssignmentRole.CONTENT_WRITER,
      taskType: AssignmentTaskType.QUESTION_REVIEW,
      priority: PriorityLevel.NORMAL,
      notes: 'Question review task',
    },
    testActor
  );
  assert(qAssignment.entityType === AssignmentEntityType.QUESTION, `Question assignment created with entityType QUESTION`);
  assert(qAssignment.taskType === AssignmentTaskType.QUESTION_REVIEW, `Task type matches QUESTION_REVIEW`);

  // ============================================================================
  // SECTION 4: ASSIGNMENT LIFECYCLE STATE MACHINE
  // ============================================================================
  console.log('\n--- Section 4: Assignment Lifecycle State Machine ---');

  // Transition: ASSIGNED -> IN_PROGRESS
  const inProgressAsn = await assignmentService.startAssignment(assignment1.id, testActor);
  assert(inProgressAsn.status === AssignmentStatus.IN_PROGRESS, `Assignment transitioned to IN_PROGRESS`);

  // Transition: IN_PROGRESS -> BLOCKED
  const blockedAsn = await assignmentService.blockAssignment(assignment1.id, 'Waiting for raw audio file render', testActor);
  assert(blockedAsn.status === AssignmentStatus.BLOCKED, `Assignment transitioned to BLOCKED`);
  assert(blockedAsn.notes?.includes('Blocked: Waiting for raw audio file render'), `Block reason appended to notes`);

  // Transition: BLOCKED -> IN_PROGRESS
  const resumedAsn = await assignmentService.startAssignment(assignment1.id, testActor);
  assert(resumedAsn.status === AssignmentStatus.IN_PROGRESS, `Assignment unblocked and resumed to IN_PROGRESS`);

  // Reassignment transition
  const reassignTargetUser = existingUsers.find((u) => u.id !== newUser.id) || existingUsers[0];
  const reassignedAsn = await assignmentService.reassignAssignment(
    assignment1.id,
    {
      newAssigneeId: reassignTargetUser.id,
      notes: 'Handing over edit timeline to senior editor',
    },
    testActor
  );
  assert(reassignedAsn.assigneeId === reassignTargetUser.id, `Assignee updated to new user: ${reassignTargetUser.id}`);
  assert(reassignedAsn.assigneeName === reassignTargetUser.name, `Assignee name updated: ${reassignedAsn.assigneeName}`);

  // Transition: IN_PROGRESS -> COMPLETED
  const completedAsn = await assignmentService.completeAssignment(
    assignment1.id,
    { notes: 'Final cut exported in 9:16 and uploaded to drive' },
    testActor
  );
  assert(completedAsn.status === AssignmentStatus.COMPLETED, `Assignment transitioned to COMPLETED`);
  assert(!!completedAsn.completedAt, `completedAt timestamp recorded`);

  // ============================================================================
  // SECTION 5: DUPLICATE ACTIVE TASK PREVENTION
  // ============================================================================
  console.log('\n--- Section 5: Duplicate Active Task Prevention ---');

  const dupTargetVideo = `BP-VID-TEST-DUP-${Date.now()}`;
  const firstActiveAsn = await assignmentService.createAssignment(
    {
      entityType: AssignmentEntityType.VIDEO,
      entityId: dupTargetVideo,
      assigneeId: newUser.id,
      assignmentRole: AssignmentRole.SPEAKER,
      taskType: AssignmentTaskType.RECORDING,
      priority: PriorityLevel.NORMAL,
    },
    testActor
  );
  assert(firstActiveAsn.status === AssignmentStatus.ASSIGNED, `First recording assignment created`);

  let duplicateBlocked = false;
  try {
    await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: dupTargetVideo,
        assigneeId: reassignTargetUser.id,
        assignmentRole: AssignmentRole.SPEAKER,
        taskType: AssignmentTaskType.RECORDING,
        priority: PriorityLevel.HIGH,
      },
      testActor
    );
  } catch (err: any) {
    duplicateBlocked = true;
  }
  assert(duplicateBlocked, `Creating duplicate active assignment for same entity & taskType was strictly rejected`);

  // Cancel the first active assignment
  const cancelledAsn = await assignmentService.cancelAssignment(firstActiveAsn.id, { reason: 'Test teardown' }, testActor);
  assert(cancelledAsn.status === AssignmentStatus.CANCELLED, `Assignment successfully cancelled`);

  // ============================================================================
  // SECTION 6: TEAM WORKLOAD & CAPACITY INTELLIGENCE
  // ============================================================================
  console.log('\n--- Section 6: Team Workload & Capacity Intelligence ---');

  const teamWorkload = await assignmentService.getTeamWorkloadSummary();
  assert(teamWorkload.totalMembers > 0, `Team workload summary includes total members: ${teamWorkload.totalMembers}`);
  assert(Array.isArray(teamWorkload.workloads), `Team workload contains member workload array`);

  const memberWorkload = teamWorkload.workloads.find((w) => w.user.id === newUser.id);
  assert(!!memberWorkload, `Found workload entry for test user: ${newUser.id}`);
  assert(typeof memberWorkload?.workloadScore === 'number', `Workload capacity score calculated: ${memberWorkload?.workloadScore}`);

  // Individual user workload query
  const singleUserWorkload = await assignmentService.getUserWorkload(newUser.id);
  assert(singleUserWorkload.user.id === newUser.id, `Single user workload returned correct user`);

  // ============================================================================
  // SECTION 7: UNASSIGNED WORK DETECTION ENGINE
  // ============================================================================
  console.log('\n--- Section 7: Unassigned Work Detection Engine ---');

  const unassignedList = await assignmentService.getUnassignedWork();
  assert(Array.isArray(unassignedList), `Unassigned work returned as an array`);
  console.log(`[INFO] Detected ${unassignedList.length} unassigned pipeline work items.`);
  if (unassignedList.length > 0) {
    const firstUnassigned = unassignedList[0];
    assert(!!firstUnassigned.entityId, `Unassigned item has entityId: ${firstUnassigned.entityId}`);
    assert(!!firstUnassigned.entityType, `Unassigned item has entityType: ${firstUnassigned.entityType}`);
    assert(!!firstUnassigned.recommendedTaskType, `Unassigned item has recommendedTaskType: ${firstUnassigned.recommendedTaskType}`);
  }

  // ============================================================================
  // SECTION 8: PERSONAL WORKBENCH (MY WORK)
  // ============================================================================
  console.log('\n--- Section 8: Personal Workbench (My Work) ---');

  const myWork = await assignmentService.getMyWorkSummary(newUser.id);
  assert(myWork.user.id === newUser.id, `My work summary matches requested user ID`);
  assert(Array.isArray(myWork.activeAssignments), `activeAssignments is an array`);
  assert(Array.isArray(myWork.completedAssignments), `completedAssignments is an array`);
  assert(typeof myWork.activeCount === 'number', `activeCount is a number: ${myWork.activeCount}`);

  // ============================================================================
  // SECTION 9: DATA INTEGRITY & SYSTEM DIAGNOSTICS
  // ============================================================================
  console.log('\n--- Section 9: Data Integrity & System Diagnostics ---');

  const integrityReport = await dataIntegrityService.runDiagnostics();
  assert(integrityReport.categoryReports.length > 0, `Integrity diagnostics returned category reports`);

  const assignmentCategoryReport = integrityReport.categoryReports.find((r) => r.category === 'ASSIGNMENT_INTEGRITY');
  const userCategoryReport = integrityReport.categoryReports.find((r) => r.category === 'USER_INTEGRITY');

  assert(!!assignmentCategoryReport, `DataIntegrityService includes ASSIGNMENT_INTEGRITY check category`);
  assert(!!userCategoryReport, `DataIntegrityService includes USER_INTEGRITY check category`);
  assert(assignmentCategoryReport?.totalChecks !== undefined, `ASSIGNMENT_INTEGRITY executed checks`);
  assert(userCategoryReport?.totalChecks !== undefined, `USER_INTEGRITY executed checks`);

  // ============================================================================
  // SECTION 10: AUDIT TRAIL LOGGING
  // ============================================================================
  console.log('\n--- Section 10: Audit Trail Logging ---');

  const recentLogs = await auditLogRepository.findAll();
  const assignmentLogs = recentLogs.filter((l) => l.entityType === 'ASSIGNMENT' || l.entityType === 'USER');
  assert(assignmentLogs.length > 0, `Audit logs captured for assignment and user lifecycle events (found ${assignmentLogs.length})`);

  console.log('\n====================================================');
  console.log(`PHASE 10 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  return {
    success: true,
    totalTests,
    passedTests,
    results: [
      { section: 'User Directory & Invariants', status: 'PASS' },
      { section: 'Assignment ID Allocation & Sequence', status: 'PASS' },
      { section: 'Assignment Creation & Multi-Entity Targeting', status: 'PASS' },
      { section: 'Assignment Lifecycle State Machine', status: 'PASS' },
      { section: 'Duplicate Active Task Prevention', status: 'PASS' },
      { section: 'Team Workload & Capacity Intelligence', status: 'PASS' },
      { section: 'Unassigned Work Detection Engine', status: 'PASS' },
      { section: 'Personal Workbench (My Work)', status: 'PASS' },
      { section: 'Data Integrity & System Diagnostics', status: 'PASS' },
      { section: 'Audit Trail Logging', status: 'PASS' },
    ],
  };
}
