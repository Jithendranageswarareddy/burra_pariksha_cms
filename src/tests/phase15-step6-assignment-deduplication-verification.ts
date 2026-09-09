/**
 * BURRA PARIKSHA CMS - Phase 15.6 Verification Suite
 * Targeted Assignment Read Deduplication in Object-Level Authorization & Search
 * 
 * Verifies:
 * 1. Static code inspection: ActorContext, getActiveAssignments, search pre-population, route memoization.
 * 2. Serial authorization lookups for the same actor query the repository only once.
 * 3. Concurrent lookups for the same actor share a single in-flight promise and query only once.
 * 4. Different actor contexts perform isolated lookups without cross-actor collision or caching.
 * 5. Underlying lookup failure clears in-flight state and does not poison subsequent requests/contexts.
 * 6. DashboardService.search with multiple matching items does not issue redundant assignment queries.
 * 7. Authorization correctness (role bypass, active vs inactive assignment match).
 * 8. Clean teardown with no polluted mocks or state.
 */

import fs from 'fs';
import path from 'path';
import { UserRole, Assignment, QuestionStatus, VideoProductionStatus } from '../types';
import { objectAuthService, ActorContext } from '../lib/services/object-auth.service';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { dashboardService } from '../lib/services/dashboard.service';
import { questionsRepository, videosRepository } from '../lib/repositories';

export async function runPhase15Step6Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // --------------------------------------------------------------------------
  // 1. Static Code Inspection: ObjectAuthorizationService & ActorContext
  // --------------------------------------------------------------------------
  try {
    const authServicePath = path.resolve(process.cwd(), 'src/lib/services/object-auth.service.ts');
    const authServiceCode = fs.readFileSync(authServicePath, 'utf8');

    const hasCachedProp = authServiceCode.includes('_cachedActiveAssignments?: Assignment[]');
    const hasInFlightProp = authServiceCode.includes('_inFlightActiveAssignments?: Promise<Assignment[]>');
    const hasGetActiveAssignments = authServiceCode.includes('public async getActiveAssignments(actor: ActorContext)');
    const sharesInFlight = authServiceCode.includes('actor._inFlightActiveAssignments');
    const cleansInFlightInFinally = authServiceCode.includes('actor._inFlightActiveAssignments = undefined');
    const hasActiveUsesHelper = authServiceCode.includes('this.getActiveAssignments(actor)');

    const passed = hasCachedProp && hasInFlightProp && hasGetActiveAssignments && sharesInFlight && cleansInFlightInFinally && hasActiveUsesHelper;
    addResult(
      '1. Code Inspection: ActorContext & ObjectAuthorizationService implement request-scoped deduplication',
      passed,
      `hasCachedProp: ${hasCachedProp}, hasInFlightProp: ${hasInFlightProp}, hasGetActiveAssignments: ${hasGetActiveAssignments}, sharesInFlight: ${sharesInFlight}, cleansInFlightInFinally: ${cleansInFlightInFinally}, hasActiveUsesHelper: ${hasActiveUsesHelper}`
    );
  } catch (err: any) {
    addResult('1. Code Inspection: ActorContext & ObjectAuthorizationService', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 2. Static Code Inspection: DashboardService & Routes Request Memoization
  // --------------------------------------------------------------------------
  try {
    const dashboardPath = path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts');
    const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
    const routesPath = path.resolve(process.cwd(), 'src/server/routes.ts');
    const routesCode = fs.readFileSync(routesPath, 'utf8');

    const dashboardImportsActorContext = dashboardCode.includes('ActorContext');
    const dashboardPrepopulates = dashboardCode.includes('actor._cachedActiveAssignments = assignments.filter');
    const routesMemoizesActor = routesCode.includes('_requestActor') && routesCode.includes('authReq._requestActor = actor');
    const routesPassesActorToSearch = routesCode.includes('dashboardService.search(query, authReq.user?.role, authReq.user?.id, actor)');

    const passed = dashboardImportsActorContext && dashboardPrepopulates && routesMemoizesActor && routesPassesActorToSearch;
    addResult(
      '2. Code Inspection: DashboardService pre-populates active assignments and routes memoizes request actor',
      passed,
      `dashboardImportsActorContext: ${dashboardImportsActorContext}, dashboardPrepopulates: ${dashboardPrepopulates}, routesMemoizesActor: ${routesMemoizesActor}, routesPassesActorToSearch: ${routesPassesActorToSearch}`
    );
  } catch (err: any) {
    addResult('2. Code Inspection: DashboardService & Routes', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 3. Functional Test: Serial Lookups within One Actor Context Query Repository Once
  // --------------------------------------------------------------------------
  const originalFindActiveByAssigneeId = assignmentsRepository.findActiveByAssigneeId.bind(assignmentsRepository);
  try {
    let callCount = 0;
    assignmentsRepository.findActiveByAssigneeId = async (assigneeId: string) => {
      callCount++;
      return [
        {
          id: 'ASN-001',
          entityType: 'QUESTION',
          entityId: 'Q-100',
          assigneeId,
          stage: 'SCRIPT',
          status: 'ACTIVE',
          assignedAt: new Date().toISOString(),
          assignedBy: 'USR-ADMIN',
          notes: '',
        } as unknown as Assignment,
      ];
    };

    const actor: ActorContext = { id: 'USR-WRITER-1', role: UserRole.SCRIPT_WRITER, name: 'Writer 1' };

    // Execute multiple sequential authorization checks on the same actor
    const check1 = await objectAuthService.hasActiveAssignment(actor, 'QUESTION', 'Q-100');
    const check2 = await objectAuthService.hasActiveAssignment(actor, 'QUESTION', 'Q-100');
    const check3 = await objectAuthService.hasActiveAssignment(actor, 'QUESTION', 'Q-999');
    const check4 = await objectAuthService.getActiveAssignments(actor);

    const passed = check1 === true && check2 === true && check3 === false && check4.length === 1 && callCount === 1;
    addResult(
      '3. Functional Test: Multiple sequential authorization checks on same actor execute repository read only once',
      passed,
      `callCount: ${callCount} (expected 1), check1: ${check1}, check2: ${check2}, check3: ${check3}, check4 count: ${check4.length}`
    );
  } catch (err: any) {
    addResult('3. Functional Test: Serial Lookups', false, err.message);
  } finally {
    assignmentsRepository.findActiveByAssigneeId = originalFindActiveByAssigneeId;
  }

  // --------------------------------------------------------------------------
  // 4. Functional Test: Concurrent Lookups Share a Single In-Flight Promise
  // --------------------------------------------------------------------------
  try {
    let concurrentCallCount = 0;
    assignmentsRepository.findActiveByAssigneeId = async (assigneeId: string) => {
      concurrentCallCount++;
      // Artificial asynchronous delay to simulate I/O
      await new Promise((resolve) => setTimeout(resolve, 30));
      return [
        {
          id: 'ASN-002',
          entityType: 'VIDEO',
          entityId: 'VID-200',
          assigneeId,
          stage: 'EDITING',
          status: 'ACTIVE',
          assignedAt: new Date().toISOString(),
          assignedBy: 'USR-ADMIN',
          notes: '',
        } as unknown as Assignment,
      ];
    };

    const actor: ActorContext = { id: 'USR-EDITOR-1', role: UserRole.VIDEO_EDITOR, name: 'Editor 1' };

    // Trigger 8 concurrent authorization checks at the exact same tick
    const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-200'),
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-200'),
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-999'),
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-200'),
      objectAuthService.getActiveAssignments(actor),
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-200'),
      objectAuthService.hasActiveAssignment(actor, 'VIDEO', 'VID-999'),
      objectAuthService.getActiveAssignments(actor),
    ]);

    const passed =
      concurrentCallCount === 1 &&
      r1 === true &&
      r2 === true &&
      r3 === false &&
      r4 === true &&
      Array.isArray(r5) &&
      r5.length === 1 &&
      r6 === true &&
      r7 === false &&
      Array.isArray(r8) &&
      r8.length === 1;

    addResult(
      '4. Functional Test: Concurrent lookups share a single in-flight promise with exactly 1 repository call',
      passed,
      `concurrentCallCount: ${concurrentCallCount} (expected 1), results matched expectations: ${passed}`
    );
  } catch (err: any) {
    addResult('4. Functional Test: Concurrent Lookups', false, err.message);
  } finally {
    assignmentsRepository.findActiveByAssigneeId = originalFindActiveByAssigneeId;
  }

  // --------------------------------------------------------------------------
  // 5. Functional Test: Actor Context Isolation (No Cross-Actor Leaks)
  // --------------------------------------------------------------------------
  try {
    const actorLookups: string[] = [];
    assignmentsRepository.findActiveByAssigneeId = async (assigneeId: string) => {
      actorLookups.push(assigneeId);
      if (assigneeId === 'USR-A') {
        return [
          {
            id: 'ASN-A',
            entityType: 'QUESTION',
            entityId: 'Q-A',
            assigneeId: 'USR-A',
            stage: 'SCRIPT',
            status: 'ACTIVE',
            assignedAt: new Date().toISOString(),
            assignedBy: 'USR-ADMIN',
            notes: '',
          } as unknown as Assignment,
        ];
      }
      if (assigneeId === 'USR-B') {
        return [
          {
            id: 'ASN-B',
            entityType: 'QUESTION',
            entityId: 'Q-B',
            assigneeId: 'USR-B',
            stage: 'SCRIPT',
            status: 'ACTIVE',
            assignedAt: new Date().toISOString(),
            assignedBy: 'USR-ADMIN',
            notes: '',
          } as unknown as Assignment,
        ];
      }
      return [];
    };

    const actorA: ActorContext = { id: 'USR-A', role: UserRole.SCRIPT_WRITER, name: 'Writer A' };
    const actorB: ActorContext = { id: 'USR-B', role: UserRole.SCRIPT_WRITER, name: 'Writer B' };

    const aHasA = await objectAuthService.hasActiveAssignment(actorA, 'QUESTION', 'Q-A');
    const aHasB = await objectAuthService.hasActiveAssignment(actorA, 'QUESTION', 'Q-B');
    const bHasA = await objectAuthService.hasActiveAssignment(actorB, 'QUESTION', 'Q-A');
    const bHasB = await objectAuthService.hasActiveAssignment(actorB, 'QUESTION', 'Q-B');

    const passed =
      aHasA === true &&
      aHasB === false &&
      bHasA === false &&
      bHasB === true &&
      actorLookups.length === 2 &&
      actorLookups.includes('USR-A') &&
      actorLookups.includes('USR-B');

    addResult(
      '5. Functional Test: Separate actor contexts perform isolated lookups without cross-actor collision',
      passed,
      `actorLookups: ${JSON.stringify(actorLookups)}, aHasA: ${aHasA}, aHasB: ${aHasB}, bHasA: ${bHasA}, bHasB: ${bHasB}`
    );
  } catch (err: any) {
    addResult('5. Functional Test: Actor Context Isolation', false, err.message);
  } finally {
    assignmentsRepository.findActiveByAssigneeId = originalFindActiveByAssigneeId;
  }

  // --------------------------------------------------------------------------
  // 6. Functional Test: Failed Lookup Does Not Poison Subsequent Contexts
  // --------------------------------------------------------------------------
  try {
    let callAttempt = 0;
    assignmentsRepository.findActiveByAssigneeId = async (assigneeId: string) => {
      callAttempt++;
      if (callAttempt === 1) {
        throw new Error('Simulated transient sheets quota error');
      }
      return [
        {
          id: 'ASN-RECOVER',
          entityType: 'QUESTION',
          entityId: 'Q-RECOVER',
          assigneeId,
          stage: 'SCRIPT',
          status: 'ACTIVE',
          assignedAt: new Date().toISOString(),
          assignedBy: 'USR-ADMIN',
          notes: '',
        } as unknown as Assignment,
      ];
    };

    const failingActor: ActorContext = { id: 'USR-FAIL', role: UserRole.SCRIPT_WRITER, name: 'Failing Actor' };
    let threw = false;
    try {
      await objectAuthService.getActiveAssignments(failingActor);
    } catch {
      threw = true;
    }

    // In-flight promise must be cleaned up even on failure
    const inFlightCleaned = failingActor._inFlightActiveAssignments === undefined;

    // A fresh request / actor context performs lookup normally without error inheritance
    const freshActor: ActorContext = { id: 'USR-FRESH', role: UserRole.SCRIPT_WRITER, name: 'Fresh Actor' };
    const freshActive = await objectAuthService.getActiveAssignments(freshActor);

    const passed = threw && inFlightCleaned && freshActive.length === 1 && freshActive[0].id === 'ASN-RECOVER';
    addResult(
      '6. Functional Test: Failed lookup clears in-flight state and does not poison subsequent contexts',
      passed,
      `threw: ${threw}, inFlightCleaned: ${inFlightCleaned}, freshActive count: ${freshActive.length}`
    );
  } catch (err: any) {
    addResult('6. Functional Test: Failed Lookup Recovery', false, err.message);
  } finally {
    assignmentsRepository.findActiveByAssigneeId = originalFindActiveByAssigneeId;
  }

  // --------------------------------------------------------------------------
  // 7. Functional Test: Search with Multiple Matches Avoids Redundant Lookups
  // --------------------------------------------------------------------------
  const origFindAllAssignments = assignmentsRepository.findAll.bind(assignmentsRepository);
  const origFindAllQuestions = questionsRepository.findAll.bind(questionsRepository);
  const origFindAllVideos = videosRepository.findAll.bind(videosRepository);

  try {
    let findActiveCallCount = 0;
    assignmentsRepository.findActiveByAssigneeId = async (assigneeId: string) => {
      findActiveCallCount++;
      return [
        {
          id: 'ASN-SEARCH-1',
          entityType: 'QUESTION',
          entityId: 'Q-SEARCH-1',
          assigneeId,
          stage: 'SCRIPT',
          status: 'ACTIVE',
          assignedAt: new Date().toISOString(),
          assignedBy: 'USR-ADMIN',
          notes: '',
        } as unknown as Assignment,
      ];
    };

    // Mock search items
    questionsRepository.findAll = async () => [
      { id: 'Q-SEARCH-1', questionText: 'Physics gravity question', categoryId: 'CAT-1', topicId: 'TOP-1', status: QuestionStatus.APPROVED, createdAt: '', updatedAt: '' } as any,
      { id: 'Q-SEARCH-2', questionText: 'Physics friction question', categoryId: 'CAT-1', topicId: 'TOP-1', status: QuestionStatus.APPROVED, createdAt: '', updatedAt: '' } as any,
    ];

    videosRepository.findAll = async () => [
      { id: 'VID-SEARCH-1', questionId: 'Q-SEARCH-1', title: 'Physics Gravity Video', status: VideoProductionStatus.RECORDING, createdAt: '', updatedAt: '' } as any,
      { id: 'VID-SEARCH-2', questionId: 'Q-SEARCH-2', title: 'Physics Friction Video', status: VideoProductionStatus.RECORDING, createdAt: '', updatedAt: '' } as any,
    ];

    assignmentsRepository.findAll = async () => [
      {
        id: 'ASN-SEARCH-1',
        entityType: 'QUESTION',
        entityId: 'Q-SEARCH-1',
        assigneeId: 'USR-TEST-WRITER',
        stage: 'SCRIPT',
        status: 'ACTIVE',
        assignedAt: new Date().toISOString(),
        assignedBy: 'USR-ADMIN',
        notes: '',
      } as unknown as Assignment,
    ];

    const actor: ActorContext = { id: 'USR-TEST-WRITER', role: UserRole.SCRIPT_WRITER, name: 'Search Test Writer' };

    // Execute search across multiple matched items
    const resultsData = await dashboardService.search('physics', UserRole.SCRIPT_WRITER, 'USR-TEST-WRITER', actor);

    // Because actor._cachedActiveAssignments was pre-populated from the single assignmentsRepository.findAll() call,
    // findActiveByAssigneeId should be called 0 times!
    const passed = findActiveCallCount === 0 && resultsData.length > 0 && Array.isArray(actor._cachedActiveAssignments);
    addResult(
      '7. Functional Test: DashboardService.search does not execute redundant findActiveByAssigneeId calls',
      passed,
      `findActiveCallCount: ${findActiveCallCount} (expected 0 due to batch pre-population), search results count: ${resultsData.length}`
    );
  } catch (err: any) {
    addResult('7. Functional Test: Search Multiple Matches', false, err.message);
  } finally {
    assignmentsRepository.findActiveByAssigneeId = originalFindActiveByAssigneeId;
    assignmentsRepository.findAll = origFindAllAssignments;
    questionsRepository.findAll = origFindAllQuestions;
    videosRepository.findAll = origFindAllVideos;
  }

  // --------------------------------------------------------------------------
  // 8. Functional Test: Authorization Correctness & Admin Bypass
  // --------------------------------------------------------------------------
  try {
    const adminActor: ActorContext = { id: 'USR-ADMIN', role: UserRole.ADMIN, name: 'Admin' };
    const managerActor: ActorContext = { id: 'USR-MGR', role: UserRole.CONTENT_MANAGER, name: 'Manager' };
    const writerActor: ActorContext = {
      id: 'USR-WRITER',
      role: UserRole.SCRIPT_WRITER,
      name: 'Writer',
      _cachedActiveAssignments: [
        {
          id: 'ASN-1',
          entityType: 'QUESTION',
          entityId: 'Q-1',
          assigneeId: 'USR-WRITER',
          stage: 'SCRIPT',
          status: 'ACTIVE',
          assignedAt: new Date().toISOString(),
          assignedBy: 'USR-ADMIN',
          notes: '',
        } as unknown as Assignment,
      ],
    };

    // Admin & Content Manager bypass assignment checks
    const adminAccess = await objectAuthService.canAccessQuestion(adminActor, { id: 'Q-UNASSIGNED' } as any);
    const mgrAccess = await objectAuthService.canAccessQuestion(managerActor, { id: 'Q-UNASSIGNED' } as any);

    // Writer has active assignment for Q-1, but not Q-999
    const writerAccessAssigned = await objectAuthService.canAccessQuestion(writerActor, { id: 'Q-1' } as any);
    const writerAccessUnassigned = await objectAuthService.canAccessQuestion(writerActor, { id: 'Q-999' } as any);

    const passed = adminAccess === true && mgrAccess === true && writerAccessAssigned === true && writerAccessUnassigned === false;
    addResult(
      '8. Functional Test: Authorization logic correctness preserved (Admin/Manager bypass, assigned vs unassigned)',
      passed,
      `adminAccess: ${adminAccess}, mgrAccess: ${mgrAccess}, writerAccessAssigned: ${writerAccessAssigned}, writerAccessUnassigned: ${writerAccessUnassigned}`
    );
  } catch (err: any) {
    addResult('8. Functional Test: Authorization Correctness', false, err.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return {
    success,
    totalTests,
    passedTests,
    results,
  };
}
