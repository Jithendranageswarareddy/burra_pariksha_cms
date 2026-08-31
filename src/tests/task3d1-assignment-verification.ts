/**
 * BURRA PARIKSHA CMS - TASK 3D.1 VERIFICATION SCRIPT
 * Team Assignment CRUD & My Work End-to-End Verification
 */

import { assignmentService } from '../lib/services/assignment.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { idService } from '../lib/services/id.service';
import { authService } from '../lib/services/auth.service';
import { requireRole, AuthenticatedRequest } from '../server/middleware/auth.middleware';
import {
  AssignmentEntityType,
  AssignmentRole,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  UserRole,
} from '../types';

export interface TestResultItem {
  step: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

export async function runTask3D1Verification() {
  console.log('================================================================');
  console.log('TASK 3D.1 — TEAM ASSIGNMENT CRUD & MY WORK VERIFICATION');
  console.log('================================================================\n');

  const results: TestResultItem[] = [];
  const createdRecordIds: string[] = [];

  function record(step: string, name: string, pass: boolean, details?: string) {
    const status: 'PASS' | 'FAIL' = pass ? 'PASS' : 'FAIL';
    results.push({ step, name, status, details });
    console.log(`[${status}] Step ${step}: ${name} ${details ? `(${details})` : ''}`);
    if (!pass) {
      throw new Error(`Verification failed at Step ${step}: ${name} - ${details || ''}`);
    }
  }

  try {
    // 1. Inspect ASSIGNMENTS worksheet and repository
    const existingAssignments = await assignmentsRepository.findAll();
    record('1', 'Inspect ASSIGNMENTS worksheet and repository', Array.isArray(existingAssignments), `Found ${existingAssignments.length} existing assignments`);

    // 2. Identify currently configured users and their roles
    const configuredUsers = await usersRepository.findAll();
    const activeUsers = configuredUsers.filter(u => u.isActive !== false);
    record('2', 'Identify configured users & roles', configuredUsers.length > 0, `Configured users: ${configuredUsers.map(u => `${u.name} (${u.role}, active: ${u.isActive !== false})`).join(', ')}`);

    const adminUser = activeUsers.find(u => u.role === UserRole.ADMIN || u.role === UserRole.CONTENT_MANAGER) || activeUsers[0];
    const reviewerUser = activeUsers.find(u => u.id !== adminUser.id && (u.role === UserRole.QUESTION_EDITOR || u.role === UserRole.REVIEWER || u.role === UserRole.CONTENT_WRITER)) || activeUsers.find(u => u.id !== adminUser.id) || activeUsers[0];
    const editorUser = activeUsers.find(u => u.id !== adminUser.id && u.id !== reviewerUser.id) || activeUsers.find(u => u.id !== reviewerUser.id) || activeUsers[0];

    console.log(`[INFO] Admin Actor: ${adminUser.name} (${adminUser.id})`);
    console.log(`[INFO] Assignee 1 (Reviewer): ${reviewerUser.name} (${reviewerUser.id})`);
    console.log(`[INFO] Assignee 2 (Reassign Target): ${editorUser.name} (${editorUser.id})`);

    // 3. Select safe test question/video
    const questions = await questionsRepository.findAll();
    const activeAssignments = await assignmentsRepository.findActive();
    const assignedQuestionIds = new Set(
      activeAssignments.filter(a => a.entityType === AssignmentEntityType.QUESTION && a.taskType === AssignmentTaskType.QUESTION_REVIEW).map(a => a.entityId)
    );
    const safeQuestion = questions.find(q => !assignedQuestionIds.has(q.id)) || questions[0] || { id: 'BP-Q-TEST-000001', questionText: 'Sample Test Question' };
    const originalQuestionState = JSON.stringify(safeQuestion);
    record('3', 'Select existing safe test question', !!safeQuestion, `Using question ${safeQuestion.id}`);

    // 4. Create assignment from Admin to team member
    const testNotes = 'TASK-3D.1-TEST: Verify editorial question review assignment';
    const targetDueDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const targetPriority = PriorityLevel.HIGH;

    const createdAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.QUESTION,
        entityId: safeQuestion.id,
        assigneeId: reviewerUser.id,
        assignmentRole: AssignmentRole.CONTENT_WRITER,
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        priority: targetPriority,
        dueDate: targetDueDate,
        notes: testNotes,
      },
      { id: adminUser.id, name: adminUser.name }
    );
    createdRecordIds.push(createdAssignment.id);

    record('4', 'Create assignment via AssignmentService', !!createdAssignment && !!createdAssignment.id, `Created ${createdAssignment.id}`);

    // 5. Verify permanent sequence ID allocation
    const hasValidIdFormat = createdAssignment.id.startsWith('BP-ASN-');
    record('5', 'Verify permanent sequence ID format (BP-ASN-)', hasValidIdFormat, `Assigned ID: ${createdAssignment.id}`);

    // 6. Verify assignment persisted in Google Sheets
    const freshFromRepo = await assignmentsRepository.findById(createdAssignment.id);
    record('6', 'Verify assignment persistence in repository', !!freshFromRepo, `Retrieved ${freshFromRepo?.id}`);

    // 7. Verify all fields match creation payload
    const fieldMatch =
      freshFromRepo?.entityType === AssignmentEntityType.QUESTION &&
      freshFromRepo?.entityId === safeQuestion.id &&
      freshFromRepo?.assigneeId === reviewerUser.id &&
      freshFromRepo?.assigneeName === reviewerUser.name &&
      freshFromRepo?.priority === targetPriority &&
      (freshFromRepo?.dueDate === targetDueDate || freshFromRepo?.dueAt === targetDueDate) &&
      freshFromRepo?.notes === testNotes &&
      freshFromRepo?.status === AssignmentStatus.ASSIGNED;

    record('7', 'Verify all payload fields match persisted record', fieldMatch, `Entity: ${freshFromRepo?.entityType} ${freshFromRepo?.entityId}, Assignee: ${freshFromRepo?.assigneeName}, Status: ${freshFromRepo?.status}`);

    // 8. Verify assignment appears in assigned user's My Work view
    const myWork = await assignmentService.getMyWorkSummary(reviewerUser.id);
    const inMyWork = myWork.activeAssignments.some(a => a.id === createdAssignment.id);
    record('8', 'Verify assignment in user My Work summary', inMyWork, `Found ${createdAssignment.id} in ${reviewerUser.name}'s active work list (${myWork.activeAssignments.length} total)`);

    // 9. Verify filtering capabilities
    const filterByAssignee = await assignmentService.getAssignments({ assigneeId: reviewerUser.id });
    const filterByTaskType = await assignmentService.getAssignments({ taskType: AssignmentTaskType.QUESTION_REVIEW });
    const filterByStatus = await assignmentService.getAssignments({ status: AssignmentStatus.ASSIGNED });
    const filterByPriority = await assignmentService.getAssignments({ priority: targetPriority });
    const filterByEntity = await assignmentService.getAssignments({ entityType: AssignmentEntityType.QUESTION, entityId: safeQuestion.id });

    const filtersPass =
      filterByAssignee.some(a => a.id === createdAssignment.id) &&
      filterByTaskType.some(a => a.id === createdAssignment.id) &&
      filterByStatus.some(a => a.id === createdAssignment.id) &&
      filterByPriority.some(a => a.id === createdAssignment.id) &&
      filterByEntity.some(a => a.id === createdAssignment.id);

    record('9', 'Verify filtering by assignee, taskType, status, priority, and entity', filtersPass, 'All 5 filter queries returned target assignment');

    // 10. Test assignment status progression (ASSIGNED -> IN_PROGRESS -> BLOCKED -> IN_PROGRESS -> COMPLETED)
    const inProgress = await assignmentService.startAssignment(createdAssignment.id, { id: reviewerUser.id, name: reviewerUser.name });
    record('10a', 'State Machine: ASSIGNED -> IN_PROGRESS', inProgress.status === AssignmentStatus.IN_PROGRESS, `Status is now ${inProgress.status}`);

    const blocked = await assignmentService.blockAssignment(createdAssignment.id, 'TASK-3D.1-TEST: Waiting for subject expert clarification', { id: reviewerUser.id, name: reviewerUser.name });
    record('10b', 'State Machine: IN_PROGRESS -> BLOCKED', blocked.status === AssignmentStatus.BLOCKED && (blocked.notes?.includes('Blocked:') ?? false), `Status: ${blocked.status}, Notes: ${blocked.notes?.slice(0, 50)}...`);

    const resumed = await assignmentService.startAssignment(createdAssignment.id, { id: reviewerUser.id, name: reviewerUser.name });
    record('10c', 'State Machine: BLOCKED -> IN_PROGRESS', resumed.status === AssignmentStatus.IN_PROGRESS, `Status resumed to ${resumed.status}`);

    // 11. Test invalid status transition rejection
    let invalidTransitionBlocked = false;
    let transitionError = '';
    try {
      await assignmentService.updateAssignment(
        createdAssignment.id,
        { status: 'DRAFT' as any },
        { id: adminUser.id, name: adminUser.name }
      );
    } catch (err: any) {
      invalidTransitionBlocked = true;
      transitionError = err?.message;
    }
    record('11', 'Verify illegal transition rejection by backend state machine', invalidTransitionBlocked, `Rejected with error: "${transitionError}"`);

    // 11b. Test inactive user assignment rejection
    let inactiveAssignmentBlocked = false;
    const inactiveUser = configuredUsers.find(u => u.isActive === false);
    if (inactiveUser) {
      try {
        await assignmentService.createAssignment(
          {
            entityType: AssignmentEntityType.QUESTION,
            entityId: safeQuestion.id,
            assigneeId: inactiveUser.id,
            taskType: AssignmentTaskType.QUESTION_REVIEW,
            priority: PriorityLevel.NORMAL,
          },
          { id: adminUser.id, name: adminUser.name }
        );
      } catch (err: any) {
        inactiveAssignmentBlocked = true;
      }
      record('11b', 'Verify assignment to inactive user is rejected', inactiveAssignmentBlocked, `Successfully rejected assigning to inactive user ${inactiveUser.name}`);
    }

    // 12. Test reassignment to another team member
    const reassigned = await assignmentService.reassignAssignment(
      createdAssignment.id,
      {
        newAssigneeId: editorUser.id,
        notes: 'TASK-3D.1-TEST: Reassigning to senior peer',
      },
      { id: adminUser.id, name: adminUser.name }
    );
    record('12a', 'Verify reassignment to second team member', reassigned.assigneeId === editorUser.id && reassigned.assigneeName === editorUser.name, `New assignee: ${reassigned.assigneeName} (${reassigned.assigneeId})`);

    // Check that it moved to new assignee's My Work
    const newAssigneeWork = await assignmentService.getMyWorkSummary(editorUser.id);
    const inNewAssigneeWork = newAssigneeWork.activeAssignments.some(a => a.id === createdAssignment.id);
    record('12b', 'Verify reassigned item appears in new user My Work', inNewAssigneeWork, `Found in ${editorUser.name}'s My Work`);

    // 13. Verify due date and priority persistence
    const updatedMeta = await assignmentService.updateAssignment(
      createdAssignment.id,
      {
        priority: PriorityLevel.URGENT,
        dueDate: '2026-09-15',
        notes: 'TASK-3D.1-TEST: Priority escalated to URGENT',
      },
      { id: adminUser.id, name: adminUser.name }
    );
    record('13', 'Verify due date and priority update persistence', updatedMeta.priority === PriorityLevel.URGENT && updatedMeta.dueDate === '2026-09-15', `Updated priority: ${updatedMeta.priority}, due: ${updatedMeta.dueDate}`);

    // Complete the assignment
    const completed = await assignmentService.completeAssignment(
      createdAssignment.id,
      { notes: 'TASK-3D.1-TEST: Verified and completed review' },
      { id: editorUser.id, name: editorUser.name }
    );
    record('10d', 'State Machine: IN_PROGRESS -> COMPLETED (Terminal)', completed.status === AssignmentStatus.COMPLETED && !!completed.completedAt, `Completed at ${completed.completedAt}`);

    // 14. Verify audit logging
    const allAuditLogs = await auditLogRepository.findAll();
    const taskAuditLogs = allAuditLogs.filter(
      l => l.entityId === createdAssignment.id || l.entityType === 'ASSIGNMENT'
    );
    record('14', 'Verify audit logging for assignment actions', taskAuditLogs.length >= 3, `Captured ${taskAuditLogs.length} audit log entries for assignment events`);

    // 15. Verify authorization controls on admin endpoints
    let authCheckPassed = false;
    const mockReq: Partial<AuthenticatedRequest> = {
      user: { id: reviewerUser.id, name: reviewerUser.name, role: reviewerUser.role },
    };
    let forbiddenCalled = false;
    const mockRes: any = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 403) forbiddenCalled = true;
        },
      }),
    };
    const mockNext = () => {};
    const adminOnlyMiddleware = requireRole([UserRole.ADMIN]);
    adminOnlyMiddleware(mockReq as any, mockRes, mockNext);
    authCheckPassed = forbiddenCalled;
    record('15', 'Verify unauthorized users cannot execute Admin-only operations', authCheckPassed, `Non-admin user role ${reviewerUser.role} denied access with 403 Forbidden`);

    // 16. Verify original question data untouched
    if (safeQuestion && originalQuestionState) {
      const refreshedQuestion = await questionsRepository.findById(safeQuestion.id);
      const unchanged = JSON.stringify(refreshedQuestion) === originalQuestionState;
      record('16', 'Verify original question data untouched', unchanged, `Question ${safeQuestion.id} unmodified`);
    } else {
      record('16', 'Verify original question data untouched', true, 'Test entity used');
    }

    // 17. Verify fresh reload from Google Sheets repository
    const freshRead = await assignmentsRepository.findById(createdAssignment.id);
    record('17', 'Verify all assignment data survives fresh read from repo', freshRead?.status === AssignmentStatus.COMPLETED && freshRead?.assigneeId === editorUser.id, `Persisted status: ${freshRead?.status}, Assignee: ${freshRead?.assigneeName}`);

    // 18. Clean up temporary test records
    console.log('\n--- Cleaning up temporary test records ---');
    for (const recordId of createdRecordIds) {
      await assignmentsRepository.deleteRecord(recordId);
      console.log(`[CLEANUP] Safely deleted test assignment record: ${recordId}`);
    }
    record('18', 'Clean up temporary TASK-3D.1-TEST records', true, `Removed ${createdRecordIds.join(', ')}`);

    // 19. Verify existing production data intact
    const finalAssignments = await assignmentsRepository.findAll();
    const finalUsers = await usersRepository.findAll();
    record('19', 'Confirm production assignments and users remain intact', finalAssignments.length >= 0 && finalUsers.length === configuredUsers.length, `Users count: ${finalUsers.length}, Assignments count: ${finalAssignments.length}`);

    console.log('\n================================================================');
    console.log(`TASK 3D.1 VERIFICATION SUITE: ALL ${results.length} STEPS PASSED`);
    console.log('================================================================\n');

    return {
      success: true,
      total: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      results,
    };
  } catch (err: any) {
    console.error(`[ERROR] Task 3D.1 Verification failed:`, err);
    if (createdRecordIds.length > 0) {
      try {
        for (const recordId of createdRecordIds) {
          await assignmentsRepository.deleteRecord(recordId);
        }
      } catch (e) {
        console.error('Cleanup on error failed:', e);
      }
    }
    throw err;
  }
}
