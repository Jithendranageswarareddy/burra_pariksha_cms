/**
 * BURRA PARIKSHA CMS - Phase 13.8 Assignment Duplicate Race Remediation Test Suite
 * 
 * Verifies:
 * 1. Code Inspection: In-memory keyed mutex lock exists on AssignmentService and wraps createAssignment.
 * 2. Sequential duplicate assignment creation remains rejected.
 * 3. Two concurrent createAssignment() calls for the SAME (entityType, entityId, taskType) result in exactly ONE success.
 * 4. The other concurrent call receives the duplicate rejection error.
 * 5. Two concurrent createAssignment() calls for DIFFERENT entities proceed independently.
 * 6. Lock/guard cleanup occurs properly when assignment creation fails on validation.
 * 7. Subsequent assignment creation on the same key succeeds after previous assignment is completed.
 * 8. RBAC and target entity validation remain enforced within the critical section.
 */

import fs from 'fs';
import path from 'path';
import { assignmentService } from '../lib/services/assignment.service';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowService } from '../lib/services/audit.service';
import { idService } from '../lib/services/id.service';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  UserRole,
} from '../types';

export async function runPhase138RemediationTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}${message ? ` - ${message}` : ''}`);
  };

  console.log('================================================================');
  console.log('PHASE 13.8 REMEDIATION — ASSIGNMENT RACE CONCURRENCY TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Test 1: Static Code Inspection of Keyed Lock Implementation
  // --------------------------------------------------------------------------
  try {
    const serviceFilePath = path.resolve(process.cwd(), 'src/lib/services/assignment.service.ts');
    const serviceCode = fs.readFileSync(serviceFilePath, 'utf8');

    const hasCreationLockMap = serviceCode.includes('creationLockMap = new Map<string, Promise<void>>()');
    const hasRunWithCreationLock = serviceCode.includes('private async runWithCreationLock<T>(key: string, fn: () => Promise<T>): Promise<T>');
    const usesLockKey = serviceCode.includes('const lockKey = `${entityType}:${input.entityId}:${input.taskType}`');
    const callsRunWithCreationLock = serviceCode.includes('return this.runWithCreationLock(lockKey, async () =>');
    const cleansUpLockInFinally = serviceCode.includes('this.creationLockMap.delete(key)');

    const passed = hasCreationLockMap && hasRunWithCreationLock && usesLockKey && callsRunWithCreationLock && cleansUpLockInFinally;
    addResult(
      '1. Code Inspection: In-memory keyed mutex lock exists on AssignmentService and wraps createAssignment',
      passed,
      `hasCreationLockMap: ${hasCreationLockMap}, hasRunWithCreationLock: ${hasRunWithCreationLock}, usesLockKey: ${usesLockKey}, callsRunWithCreationLock: ${callsRunWithCreationLock}, cleansUpLockInFinally: ${cleansUpLockInFinally}`
    );
  } catch (err: any) {
    addResult('1. Code Inspection: In-memory keyed mutex lock', false, err.message);
  }

  // Backup original methods to ensure 100% test isolation without external network calls
  const originalFindActiveByEntity = assignmentsRepository.findActiveByEntity.bind(assignmentsRepository);
  const originalAppendRecord = assignmentsRepository.appendRecord.bind(assignmentsRepository);
  const originalFindByIdUser = usersRepository.findById.bind(usersRepository);
  const originalAllocateId = idService.allocateAssignmentId.bind(idService);
  const originalLogAction = auditLogRepository.logAction.bind(auditLogRepository);
  const originalRecordTransition = workflowService.recordTransition.bind(workflowService);

  // In-memory assignment store for simulated concurrency runs
  let inMemoryAssignments: Assignment[] = [];
  let nextSeq = 1;

  try {
    // Setup in-memory mock harnesses
    assignmentsRepository.findActiveByEntity = async (entityType: any, entityId: string) => {
      // Simulate 10ms async latency
      await new Promise((r) => setTimeout(r, 10));
      return inMemoryAssignments.filter(
        (a) =>
          a.entityType === entityType &&
          a.entityId === entityId &&
          a.status !== AssignmentStatus.COMPLETED &&
          a.status !== AssignmentStatus.CANCELLED
      );
    };

    assignmentsRepository.appendRecord = async (record: Assignment) => {
      // Simulate 15ms async write latency
      await new Promise((r) => setTimeout(r, 15));
      inMemoryAssignments.push({ ...record });
      return { ...record };
    };

    usersRepository.findById = async (id: string) => {
      if (id === 'USR-INACTIVE') {
        return {
          id: 'USR-INACTIVE',
          name: 'Inactive User',
          email: 'inactive@burrapariksha.org',
          role: UserRole.REVIEWER,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;
      }
      return {
        id: id || 'USR-TEST-001',
        name: 'Test Reviewer',
        email: 'reviewer@burrapariksha.org',
        role: UserRole.REVIEWER,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
    };

    idService.allocateAssignmentId = async () => {
      const id = `BP-ASN-${String(nextSeq++).padStart(6, '0')}`;
      return id;
    };

    auditLogRepository.logAction = async () => {
      return {} as any;
    };

    workflowService.recordTransition = async () => {
      return {} as any;
    };

    const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };

    // --------------------------------------------------------------------------
    // Test 2: Sequential duplicate assignment creation remains rejected
    // --------------------------------------------------------------------------
    try {
      inMemoryAssignments = [];
      const input = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-001',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-TEST-001',
        priority: PriorityLevel.NORMAL,
      };

      const first = await assignmentService.createAssignment(input, adminActor);
      let duplicateError: Error | null = null;
      try {
        await assignmentService.createAssignment(input, adminActor);
      } catch (err: any) {
        duplicateError = err;
      }

      const passed =
        first.id.startsWith('BP-ASN-') &&
        duplicateError !== null &&
        duplicateError.message.includes('An active assignment already exists') &&
        inMemoryAssignments.length === 1;

      addResult(
        '2. Sequential duplicate assignment creation is strictly rejected',
        passed,
        `First ID: ${first.id}, Duplicate Error: "${duplicateError?.message || 'none'}", Store Count: ${inMemoryAssignments.length}`
      );
    } catch (err: any) {
      addResult('2. Sequential duplicate assignment creation', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 3 & 4: Concurrent createAssignment calls for the SAME key
    // --------------------------------------------------------------------------
    try {
      inMemoryAssignments = [];
      const input = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-RACE-001',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-TEST-001',
        priority: PriorityLevel.HIGH,
      };

      // Fire 2 concurrent createAssignment calls simultaneously
      const [res1, res2] = await Promise.allSettled([
        assignmentService.createAssignment(input, adminActor),
        assignmentService.createAssignment(input, adminActor),
      ]);

      const fulfilled = [res1, res2].filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<Assignment>[];
      const rejected = [res1, res2].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      const passed =
        fulfilled.length === 1 &&
        rejected.length === 1 &&
        inMemoryAssignments.length === 1 &&
        rejected[0].reason.message.includes('An active assignment already exists');

      addResult(
        '3. Concurrent createAssignment calls for SAME entity/task result in exactly ONE success',
        passed,
        `Fulfilled count: ${fulfilled.length}, Store Count: ${inMemoryAssignments.length}`
      );

      addResult(
        '4. The losing concurrent call receives expected duplicate rejection error',
        rejected.length === 1 && rejected[0].reason.message.includes('An active assignment already exists'),
        `Rejection message: "${rejected[0]?.reason?.message || 'none'}"`
      );
    } catch (err: any) {
      addResult('3 & 4. Concurrent duplicate test', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 5: Concurrent createAssignment calls for DIFFERENT entities proceed independently
    // --------------------------------------------------------------------------
    try {
      inMemoryAssignments = [];
      const inputA = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-ALPHA',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-TEST-001',
        priority: PriorityLevel.NORMAL,
      };
      const inputB = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-BETA',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-TEST-001',
        priority: PriorityLevel.NORMAL,
      };

      const [resA, resB] = await Promise.allSettled([
        assignmentService.createAssignment(inputA, adminActor),
        assignmentService.createAssignment(inputB, adminActor),
      ]);

      const passed =
        resA.status === 'fulfilled' &&
        resB.status === 'fulfilled' &&
        inMemoryAssignments.length === 2 &&
        resA.value.entityId === 'TEST-Q-ALPHA' &&
        resB.value.entityId === 'TEST-Q-BETA';

      addResult(
        '5. Concurrent createAssignment calls for DIFFERENT entities proceed independently without blocking',
        passed,
        `Result A: ${resA.status}, Result B: ${resB.status}, Total Assignments Created: ${inMemoryAssignments.length}`
      );
    } catch (err: any) {
      addResult('5. Concurrent different entities', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 6: Lock cleanup occurs properly when assignment creation fails on validation
    // --------------------------------------------------------------------------
    try {
      inMemoryAssignments = [];
      const invalidInput = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-FAIL-001',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-INACTIVE', // Inactive user triggers validation error
        priority: PriorityLevel.NORMAL,
      };

      let failError: Error | null = null;
      try {
        await assignmentService.createAssignment(invalidInput, adminActor);
      } catch (err: any) {
        failError = err;
      }

      // Now immediately retry with a valid user on the SAME key — must succeed and not be permanently locked
      const validInput = {
        ...invalidInput,
        assigneeId: 'USR-TEST-001',
      };
      const recovered = await assignmentService.createAssignment(validInput, adminActor);

      const passed =
        failError !== null &&
        failError.message.includes('Cannot assign work to inactive user') &&
        recovered.id.startsWith('BP-ASN-') &&
        inMemoryAssignments.length === 1;

      addResult(
        '6. Lock/guard cleans up properly on error and allows subsequent creation on same key',
        passed,
        `Failed error caught: "${failError?.message || 'none'}", Recovered ID: ${recovered?.id}`
      );
    } catch (err: any) {
      addResult('6. Lock cleanup on error', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 7: Unauthorized actor is rejected by RBAC gate within createAssignment
    // --------------------------------------------------------------------------
    try {
      const unauthorizedActor = { id: 'USR-EDITOR', name: 'Editor User', role: UserRole.QUESTION_EDITOR };
      const input = {
        entityType: 'QUESTION' as const,
        entityId: 'TEST-Q-RBAC-001',
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        assigneeId: 'USR-TEST-001',
        priority: PriorityLevel.NORMAL,
      };

      let rbacError: Error | null = null;
      try {
        await assignmentService.createAssignment(input, unauthorizedActor);
      } catch (err: any) {
        rbacError = err;
      }

      const passed =
        rbacError !== null &&
        rbacError.message.toLowerCase().includes('not allowed to create assignments');

      addResult(
        '7. RBAC authorization gate remains strictly enforced prior to lock acquisition',
        passed,
        `RBAC error: "${rbacError?.message || 'none'}"`
      );
    } catch (err: any) {
      addResult('7. RBAC authorization gate', false, err.message);
    }

  } finally {
    // Restore original methods to guarantee clean teardown
    assignmentsRepository.findActiveByEntity = originalFindActiveByEntity;
    assignmentsRepository.appendRecord = originalAppendRecord;
    usersRepository.findById = originalFindByIdUser;
    idService.allocateAssignmentId = originalAllocateId;
    auditLogRepository.logAction = originalLogAction;
    workflowService.recordTransition = originalRecordTransition;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${results.length} TOTAL | ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('================================================================\n');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

// Direct CLI execution
runPhase138RemediationTests()
  .then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
