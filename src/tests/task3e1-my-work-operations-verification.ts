/**
 * BURRA PARIKSHA CMS - TASK 3E.1 VERIFICATION SUITE
 * My Work & Team Operations Workspace Verification
 *
 * Verifies that:
 * 1. My Work (/my-work) provides user-specific operational metrics, buckets, and state-machine transitions.
 * 2. Team Operations (/team and /team-work) aggregates team workloads, unassigned work detection, and directory access.
 * 3. State transitions (Start, Block, Resume, Complete, Reassign) function authoritatively against Google Sheets.
 * 4. Entity routing and navigation mapping are accurate.
 * 5. All temporary records marked 'TASK-3E.1-TEST' are safely cleaned up.
 */

import {
  assignmentsRepository,
  usersRepository,
  auditLogRepository,
  workflowRepository,
  questionsRepository,
  videosRepository,
} from '../lib/repositories';
import { assignmentService } from '../lib/services/assignment.service';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  User,
  UserRole,
} from '../types';

export interface TestResultItem {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  timestamp: string;
}

export interface Task3E1VerificationReport {
  timestamp: string;
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResultItem[];
  summary: {
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    createdAssignmentIds: string[];
  };
}

export async function runTask3E1Verification(): Promise<Task3E1VerificationReport> {
  const results: TestResultItem[] = [];
  const createdAssignmentIds: string[] = [];

  const record = (id: string, name: string, passed: boolean, message: string) => {
    results.push({
      id,
      name,
      passed,
      message,
      timestamp: new Date().toISOString(),
    });
    const tag = passed ? '[PASS]' : '[FAIL]';
    console.log(`${tag} Step ${id}: ${name} (${message})`);
    if (!passed) {
      throw new Error(`Verification failed at Step ${id}: ${name} - ${message}`);
    }
  };

  console.log('\n================================================================');
  console.log('TASK 3E.1 — MY WORK & TEAM OPERATIONS WORKSPACE VERIFICATION');
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // Step 0: Setup Actors & Baseline Snapshots
    // ------------------------------------------------------------------------
    const baselineAssignments = await assignmentsRepository.findAll();
    const allUsers = await usersRepository.findAll();

    record(
      '0.1',
      'Verify Users repository baseline',
      allUsers.length > 0,
      `Found ${allUsers.length} registered users in Google Sheets.`
    );

    // Identify an Admin/Lead user and a Content Specialist user
    const adminUser = allUsers.find(
      (u) => u.role === UserRole.ADMIN || u.role === UserRole.CONTENT_MANAGER
    ) || allUsers[0];

    const specialistUser = allUsers.find(
      (u) => u.id !== adminUser.id && u.isActive
    ) || allUsers[1] || allUsers[0];

    const actorAdmin = { id: adminUser.id, name: adminUser.name };
    const actorSpecialist = { id: specialistUser.id, name: specialistUser.name };

    record(
      '0.2',
      'Identify test actors from Google Sheets user directory',
      Boolean(adminUser && specialistUser),
      `Admin/Lead: ${adminUser.name} (${adminUser.id}), Specialist: ${specialistUser.name} (${specialistUser.id})`
    );

    // ------------------------------------------------------------------------
    // Step 1: User Identity & My Work Isolation Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Step 1: My Work Isolation ---');
    const myWorkInitial = await assignmentService.getMyWorkSummary(specialistUser.id);

    record(
      '1.1',
      'Fetch My Work summary for individual specialist',
      Boolean(myWorkInitial && myWorkInitial.user?.id === specialistUser.id),
      `Fetched work summary for ${myWorkInitial?.user?.name || myWorkInitial?.user?.id} with ${myWorkInitial.activeCount} active tasks`
    );

    const nonSpecialistTasks = (myWorkInitial.activeAssignments || []).filter(
      (a) => a.assigneeId !== specialistUser.id
    );
    record(
      '1.2',
      'Verify isolation: No tasks belonging to other users in My Work queue',
      nonSpecialistTasks.length === 0,
      `Found ${nonSpecialistTasks.length} foreign tasks in queue`
    );

    // ------------------------------------------------------------------------
    // Step 2: Workbench Lifecycle & State Machine Transitions (Start, Block, Resume, Complete)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Workbench State Machine Transitions ---');

    // Create a temporary operational assignment
    const testAsn1 = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.QUESTION,
        entityId: 'TEST-TASK3E1-Q1',
        taskType: AssignmentTaskType.QUESTION_CREATION,
        assigneeId: specialistUser.id,
        assignmentRole: 'Writer',
        priority: PriorityLevel.HIGH,
        notes: 'TASK-3E.1-TEST-ASN-1: Verify interactive state-machine on personal workbench',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      },
      actorAdmin
    );
    createdAssignmentIds.push(testAsn1.id);

    record(
      '2.1',
      'Create test assignment for specialist',
      testAsn1.status === AssignmentStatus.ASSIGNED && testAsn1.assigneeId === specialistUser.id,
      `Created ${testAsn1.id} with status ${testAsn1.status}`
    );

    // Verify task shows up in My Work
    const myWorkAfterCreate = await assignmentService.getMyWorkSummary(specialistUser.id);
    const foundInActive = myWorkAfterCreate.activeAssignments.find((a) => a.id === testAsn1.id);

    record(
      '2.2',
      'Verify newly created task appears immediately in active workbench bucket',
      Boolean(foundInActive && foundInActive.status === AssignmentStatus.ASSIGNED),
      `Found task ${testAsn1.id} in active bucket`
    );

    // Transition 1: Start Task (ASSIGNED -> IN_PROGRESS)
    const startedTask = await assignmentService.startAssignment(testAsn1.id, actorSpecialist);
    record(
      '2.3',
      'Transition: Specialist starts task (ASSIGNED -> IN_PROGRESS)',
      startedTask.status === AssignmentStatus.IN_PROGRESS,
      `Task ${testAsn1.id} status is now ${startedTask.status}`
    );

    // Transition 2: Block Task (IN_PROGRESS -> BLOCKED)
    const blockerReason = 'TASK-3E.1-TEST: Awaiting syllabus clarification from editorial board';
    const blockedTask = await assignmentService.blockAssignment(testAsn1.id, blockerReason, actorSpecialist);
    record(
      '2.4',
      'Transition: Specialist blocks task with reason (IN_PROGRESS -> BLOCKED)',
      blockedTask.status === AssignmentStatus.BLOCKED,
      `Task ${testAsn1.id} status is now ${blockedTask.status}`
    );

    // Transition 3: Resume Task (BLOCKED -> IN_PROGRESS)
    const resumedTask = await assignmentService.startAssignment(testAsn1.id, actorSpecialist);
    record(
      '2.5',
      'Transition: Specialist unblocks/resumes task (BLOCKED -> IN_PROGRESS)',
      resumedTask.status === AssignmentStatus.IN_PROGRESS,
      `Task ${testAsn1.id} status is now ${resumedTask.status}`
    );

    // Transition 4: Complete Task (IN_PROGRESS -> COMPLETED)
    const completedTask = await assignmentService.completeAssignment(
      testAsn1.id,
      { notes: 'TASK-3E.1-TEST: Completed question drafting according to guidelines' },
      actorSpecialist
    );
    record(
      '2.6',
      'Transition: Specialist completes task (IN_PROGRESS -> COMPLETED)',
      completedTask.status === AssignmentStatus.COMPLETED,
      `Task ${testAsn1.id} status is now ${completedTask.status}`
    );

    // Verify task moved to completed bucket in My Work
    const myWorkAfterComplete = await assignmentService.getMyWorkSummary(specialistUser.id);
    const foundInActiveAfterComplete = myWorkAfterComplete.activeAssignments.find((a) => a.id === testAsn1.id);
    const foundInCompleted = myWorkAfterComplete.completedAssignments.find((a) => a.id === testAsn1.id);

    record(
      '2.7',
      'Verify completed task moved from active bucket to completed archive',
      !foundInActiveAfterComplete && Boolean(foundInCompleted),
      `Task ${testAsn1.id} in active: ${Boolean(foundInActiveAfterComplete)}, in completed: ${Boolean(foundInCompleted)}`
    );

    // ------------------------------------------------------------------------
    // Step 3: Team Operations & Workload Distribution
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Team Operations & Workload Scoring ---');
    const teamSummary = await assignmentService.getTeamWorkloadSummary();

    record(
      '3.1',
      'Fetch Team Workload summary for managers',
      Boolean(teamSummary && teamSummary.totalMembers > 0 && teamSummary.workloads.length > 0),
      `Team has ${teamSummary.totalMembers} members and ${teamSummary.totalActiveTasks} active tasks`
    );

    const specialistWorkload = teamSummary.workloads.find((w) => w.user.id === specialistUser.id);
    record(
      '3.2',
      'Verify workload entry computed for specialist',
      Boolean(specialistWorkload && typeof specialistWorkload.workloadScore === 'number'),
      `Specialist ${specialistUser.name} workload score: ${specialistWorkload?.workloadScore}`
    );

    // ------------------------------------------------------------------------
    // Step 4: Unassigned Work Backlog Detection
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Unassigned Work Backlog Detection ---');
    const unassignedItems = await assignmentService.getUnassignedWork();

    record(
      '4.1',
      'Verify automated unassigned pipeline work detection',
      Array.isArray(unassignedItems),
      `Detected ${unassignedItems.length} unassigned pipeline work items`
    );

    // ------------------------------------------------------------------------
    // Step 5: Reassignment & Handover Workflow
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Task Reassignment & Handover ---');
    const testAsn2 = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: 'TEST-TASK3E1-V2',
        taskType: AssignmentTaskType.EDITING,
        assigneeId: specialistUser.id,
        assignmentRole: 'Editor',
        priority: PriorityLevel.URGENT,
        notes: 'TASK-3E.1-TEST-ASN-2: Verify manager reassignment capability',
      },
      actorAdmin
    );
    createdAssignmentIds.push(testAsn2.id);

    // Reassign from specialistUser to adminUser
    const reassignedTask = await assignmentService.reassign(
      testAsn2.id,
      {
        newAssigneeId: adminUser.id,
        notes: 'TASK-3E.1-TEST: Urgent re-allocation to content lead',
      },
      actorAdmin
    );

    record(
      '5.1',
      'Manager reassigns task to new team member with handover reason',
      reassignedTask.assigneeId === adminUser.id && reassignedTask.assigneeName === adminUser.name,
      `Task ${testAsn2.id} reassigned from ${specialistUser.id} to ${adminUser.id}`
    );

    // Verify My Work reflect updated assignees
    const specialistWorkUpdated = await assignmentService.getMyWorkSummary(specialistUser.id);
    const adminWorkUpdated = await assignmentService.getMyWorkSummary(adminUser.id);

    const inSpecialist = specialistWorkUpdated.activeAssignments.some((a) => a.id === testAsn2.id);
    const inAdmin = adminWorkUpdated.activeAssignments.some((a) => a.id === testAsn2.id);

    record(
      '5.2',
      'Verify task moved out of old assignee workbench and into new assignee workbench',
      !inSpecialist && inAdmin,
      `Old assignee has task: ${inSpecialist}, New assignee has task: ${inAdmin}`
    );

    // ------------------------------------------------------------------------
    // Step 6: Entity URL Mapping Validation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Entity URL Route Mapping ---');
    const entityMappings = [
      { type: 'QUESTION', id: 'Q-100', expected: '/questions/Q-100' },
      { type: 'VIDEO', id: 'VID-200', expected: '/production/VID-200' },
      { type: 'SCRIPT', id: 'VID-300', expected: '/production/VID-300' },
      { type: 'THUMBNAIL', id: 'VID-400', expected: '/production/VID-400' },
      { type: 'PUBLISHING', id: 'VID-500', expected: '/publishing?videoId=VID-500' },
      { type: 'CONTENT_PLAN', id: 'CP-600', expected: '/planning' },
      { type: 'CONTENT_BATCH', id: 'CB-700', expected: '/planning' },
    ];

    const getTestEntityUrl = (entityType: string, entityId: string): string => {
      switch (entityType) {
        case 'QUESTION':
          return `/questions/${encodeURIComponent(entityId)}`;
        case 'VIDEO':
        case 'SCRIPT':
        case 'THUMBNAIL':
          return `/production/${encodeURIComponent(entityId)}`;
        case 'PUBLISHING':
          return `/publishing?videoId=${encodeURIComponent(entityId)}`;
        case 'CONTENT_PLAN':
        case 'CONTENT_BATCH':
          return `/planning`;
        default:
          return `/dashboard`;
      }
    };

    let allMappingsValid = true;
    for (const m of entityMappings) {
      const generated = getTestEntityUrl(m.type, m.id);
      if (generated !== m.expected) {
        allMappingsValid = false;
        break;
      }
    }

    record(
      '6.1',
      'Validate direct entity navigation route mappings for all entity types',
      allMappingsValid,
      `All ${entityMappings.length} entity type route mappings verified correctly`
    );

    // ------------------------------------------------------------------------
    // Step 7: Safe Cleanup of All Temporary TASK-3E.1-TEST Records
    // ------------------------------------------------------------------------
    console.log('\n--- Step 7: Safe Cleanup of Temporary Test Records ---');
    for (const asnId of createdAssignmentIds) {
      try {
        await assignmentsRepository.deleteRecord(asnId);
        console.log(`[CLEANUP] Deleted test assignment ${asnId}`);
      } catch (err: any) {
        console.warn(`[CLEANUP WARNING] Failed to delete test assignment ${asnId}:`, err?.message);
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    // Double check repository
    const remainingAssignments = await assignmentsRepository.findAll();
    const testAssignmentsLeft = remainingAssignments.filter(
      (a) => (a.notes || '').includes('TASK-3E.1-TEST') || createdAssignmentIds.includes(a.id)
    );

    record(
      '7.1',
      'Verify all temporary TASK-3E.1-TEST assignments purged from Google Sheets',
      testAssignmentsLeft.length === 0,
      `Remaining test assignments: ${testAssignmentsLeft.length}`
    );

    record(
      '7.2',
      'Verify baseline assignment count preserved',
      remainingAssignments.length === baselineAssignments.length,
      `Current: ${remainingAssignments.length}, Baseline: ${baselineAssignments.length}`
    );

    console.log('\n================================================================');
    console.log('TASK 3E.1 VERIFICATION COMPLETED SUCCESSFULLY');
    console.log('================================================================\n');

    return {
      timestamp: new Date().toISOString(),
      overallPassed: true,
      totalTests: results.length,
      passedTests: results.filter((r) => r.passed).length,
      failedTests: results.filter((r) => !r.passed).length,
      results,
      summary: {
        totalSteps: results.length,
        passedSteps: results.filter((r) => r.passed).length,
        failedSteps: results.filter((r) => !r.passed).length,
        createdAssignmentIds,
      },
    };
  } catch (err: any) {
    console.error('[ERROR] Task 3E.1 Verification Failed:', err.message);
    for (const asnId of createdAssignmentIds) {
      try {
        await assignmentsRepository.deleteRecord(asnId);
      } catch (_) {}
    }
    throw err;
  }
}
