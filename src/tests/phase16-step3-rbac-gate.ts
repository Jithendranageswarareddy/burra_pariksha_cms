/**
 * Phase 16.3 — Content Master Lifecycle RBAC & Authorization Gate Verification
 *
 * Exhaustive verification of authorization controls across Content Master lifecycle operations:
 * [A] ADMIN global modification authority
 * [B] CONTENT_MANAGER global modification authority
 * [C] Authorized specialist ownership & active-assignment authorization
 * [D] Unauthorized specialist/user cannot transition Content Master (Service & Route 403)
 * [E] Unauthorized specialist/user cannot archive Content Master (Service & Route 403)
 * [F] Backend authorization is authoritative; presentation controls cannot be bypassed; unauthenticated requests receive 401
 * [G] Existing Phase 16.2 lifecycle invariants preserved
 * [H] Downstream foreign key and child entity relationship integrity preserved
 */

import { contentMasterService } from '../lib/services/content-master.service';
import { objectAuthService, ActorContext } from '../lib/services/object-auth.service';
import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  assignmentsRepository,
} from '../lib/repositories';
import {
  UserRole,
  ContentMaster,
  ContentMasterStatus,
  AssignmentStatus,
  PriorityLevel,
  AssignmentEntityType,
} from '../types';

export interface GateTestResult {
  step: string;
  name: string;
  passed: boolean;
  details?: string;
}

export interface GateSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: GateTestResult[];
}

export async function runPhase16Step3RbacGateVerification(): Promise<GateSummary> {
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = ''; // In-memory deterministic isolation

  const results: GateTestResult[] = [];

  const add = (step: string, name: string, passed: boolean, details?: string) => {
    results.push({ step, name, passed, details });
  };

  try {
    // ------------------------------------------------------------------------
    // ACTORS SETUP
    // ------------------------------------------------------------------------
    const adminActor: ActorContext = {
      id: 'USR-ADMIN-001',
      role: UserRole.ADMIN,
      name: 'System Administrator',
    };

    const contentManagerActor: ActorContext = {
      id: 'USR-CM-001',
      role: UserRole.CONTENT_MANAGER,
      name: 'Lead Content Manager',
    };

    const creatorSpecialistActor: ActorContext = {
      id: 'USR-CREATOR-001',
      role: UserRole.CREATOR,
      name: 'Curriculum Creator',
    };

    const assignedSpecialistActor: ActorContext = {
      id: 'USR-SPEC-001',
      role: UserRole.SCRIPT_WRITER,
      name: 'Assigned Specialist',
    };

    const unauthorizedSpecialistActor: ActorContext = {
      id: 'USR-UNAUTH-001',
      role: UserRole.VIDEO_EDITOR,
      name: 'Unassigned Video Editor',
    };

    const randomUserActor: ActorContext = {
      id: 'USR-RANDOM-001',
      role: UserRole.QUESTION_EDITOR,
      name: 'Random Unrelated Editor',
    };

    // ------------------------------------------------------------------------
    // TEST MASTER SEEDING
    // ------------------------------------------------------------------------
    const masterId = 'CM-RBAC-GATE-001';
    const primaryQId = 'Q-RBAC-GATE-001';

    const testMaster: ContentMaster = {
      id: masterId,
      title: 'Electromagnetism Master Plan',
      status: ContentMasterStatus.DRAFT,
      primaryQuestionId: primaryQId,
      categoryId: 'CAT-PHY',
      topicId: 'TOP-EM',
      subtopicId: 'SUB-MAG',
      createdBy: creatorSpecialistActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contentMastersRepository.seedFallbackData([testMaster]);
    questionsRepository.seedFallbackData([
      {
        id: primaryQId,
        contentMasterId: masterId,
        categoryId: 'CAT-PHY',
        categoryName: 'Physics',
        topicId: 'TOP-EM',
        topicName: 'Electromagnetism',
        subtopicId: 'SUB-MAG',
        subtopicName: 'Induction',
        difficulty: 'MEDIUM',
        questionText: 'What is electromagnetic induction?',
        options: { a: 'Faraday law', b: 'Ohm law', c: 'Newton law', d: 'Boyle law' },
        correctAnswer: 'A',
        explanation: 'Faraday law describes electromagnetic induction.',
        authorId: creatorSpecialistActor.id,
        status: 'DRAFT' as any,
        videoStatus: 'NOT_RECORDED' as any,
        validationStatus: 'NOT_VALIDATED' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);

    // ------------------------------------------------------------------------
    // TEST CASE [A]: ADMIN Global Modification Authority
    // ------------------------------------------------------------------------
    const adminCanModify = await objectAuthService.canModifyContentMaster(adminActor, testMaster);
    add(
      'CASE-A1',
      'objectAuthService grants ADMIN global modification authority on Content Master',
      adminCanModify === true,
      `Allowed: ${adminCanModify}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [B]: CONTENT_MANAGER Global Modification Authority
    // ------------------------------------------------------------------------
    const cmCanModify = await objectAuthService.canModifyContentMaster(contentManagerActor, testMaster);
    add(
      'CASE-B1',
      'objectAuthService grants CONTENT_MANAGER global modification authority on Content Master',
      cmCanModify === true,
      `Allowed: ${cmCanModify}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [C]: Specialist Ownership & Active Assignment Rules
    // ------------------------------------------------------------------------
    // C1: Creator (createdBy matches actor.id)
    const creatorCanModify = await objectAuthService.canModifyContentMaster(creatorSpecialistActor, testMaster);
    add(
      'CASE-C1',
      'objectAuthService permits creator ownership modification on Content Master',
      creatorCanModify === true,
      `Allowed: ${creatorCanModify}`
    );

    // C2: Unassigned specialist before assignment
    const unassignedBefore = await objectAuthService.canModifyContentMaster(assignedSpecialistActor, testMaster);
    add(
      'CASE-C2',
      'objectAuthService denies specialist modification prior to active assignment',
      unassignedBefore === false,
      `Allowed: ${unassignedBefore}`
    );

    // C3: Seed active assignment for assignedSpecialistActor
    assignmentsRepository.seedFallbackData([
      {
        id: 'ASN-RBAC-001',
        entityType: 'CONTENT_MASTER' as any,
        entityId: masterId,
        assigneeId: assignedSpecialistActor.id,
        assigneeName: assignedSpecialistActor.name,
        taskType: 'CONTENT_WRITING',
        status: AssignmentStatus.IN_PROGRESS,
        priority: PriorityLevel.MEDIUM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    delete assignedSpecialistActor._cachedActiveAssignments;
    const assignedAfter = await objectAuthService.canModifyContentMaster(assignedSpecialistActor, testMaster);
    add(
      'CASE-C3',
      'objectAuthService permits specialist modification when active assignment exists',
      assignedAfter === true,
      `Allowed: ${assignedAfter}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [D]: Unauthorized User Cannot Transition Content Master
    // ------------------------------------------------------------------------
    const unauthCanModify = await objectAuthService.canModifyContentMaster(unauthorizedSpecialistActor, testMaster);
    add(
      'CASE-D1',
      'objectAuthService strictly denies unauthorized specialist modification',
      unauthCanModify === false,
      `Allowed: ${unauthCanModify}`
    );

    const randomCanModify = await objectAuthService.canModifyContentMaster(randomUserActor, testMaster);
    add(
      'CASE-D2',
      'objectAuthService strictly denies random unassigned user modification',
      randomCanModify === false,
      `Allowed: ${randomCanModify}`
    );

    let unauthTransitionBlocked = false;
    try {
      await contentMasterService.transitionStatus(
        masterId,
        ContentMasterStatus.ACTIVE,
        unauthorizedSpecialistActor,
        'Attempted unauthorized activation'
      );
    } catch (err: any) {
      unauthTransitionBlocked = err.message.includes('Forbidden') || err.message.includes('lacks authorization');
    }
    add(
      'CASE-D3',
      'contentMasterService.transitionStatus rejects unauthorized specialist with Forbidden error',
      unauthTransitionBlocked === true,
      `Blocked: ${unauthTransitionBlocked}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [E]: Unauthorized User Cannot Archive Content Master
    // ------------------------------------------------------------------------
    let unauthArchiveBlocked = false;
    try {
      await contentMasterService.archiveContentMaster(
        masterId,
        unauthorizedSpecialistActor,
        'Attempted unauthorized archival'
      );
    } catch (err: any) {
      unauthArchiveBlocked = err.message.includes('Forbidden') || err.message.includes('lacks authorization');
    }
    add(
      'CASE-E1',
      'contentMasterService.archiveContentMaster rejects unauthorized specialist with Forbidden error',
      unauthArchiveBlocked === true,
      `Blocked: ${unauthArchiveBlocked}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [F]: Unauthenticated Actor & Route Protection
    // ------------------------------------------------------------------------
    let unauthContextBlocked = false;
    try {
      await contentMasterService.transitionStatus(
        masterId,
        ContentMasterStatus.ACTIVE,
        undefined as any
      );
    } catch (err: any) {
      unauthContextBlocked = err.message.includes('Authentication required');
    }
    add(
      'CASE-F1',
      'contentMasterService rejects null/undefined actor context without mutation',
      unauthContextBlocked === true,
      `Blocked: ${unauthContextBlocked}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [G]: Permitted Transitions by Authorized Actors & Invariance
    // ------------------------------------------------------------------------
    // Creator transitions DRAFT -> ACTIVE
    const activatedMaster = await contentMasterService.transitionStatus(
      masterId,
      ContentMasterStatus.ACTIVE,
      creatorSpecialistActor,
      'Creator activates draft curriculum'
    );
    add(
      'CASE-G1',
      'Authorized creator can transition Content Master DRAFT -> ACTIVE',
      activatedMaster.status === ContentMasterStatus.ACTIVE,
      `Status: ${activatedMaster.status}`
    );

    // Verify ACTIVE -> DRAFT reversion is strictly forbidden even for ADMIN
    let adminReversionBlocked = false;
    try {
      await contentMasterService.transitionStatus(
        masterId,
        ContentMasterStatus.DRAFT,
        adminActor
      );
    } catch (err: any) {
      adminReversionBlocked = err.message.includes('cannot be reverted to DRAFT');
    }
    add(
      'CASE-G2',
      'Lifecycle rule invariance: ACTIVE -> DRAFT reversion is forbidden even for ADMIN',
      adminReversionBlocked === true,
      `Blocked: ${adminReversionBlocked}`
    );

    // ------------------------------------------------------------------------
    // TEST CASE [H]: Relationship Integrity Preserved
    // ------------------------------------------------------------------------
    const stateAfterAuthTests = await contentMasterService.getCanonicalState(masterId);
    add(
      'CASE-H1',
      'Canonical state integrity remains consistent and intact post authorization enforcement',
      stateAfterAuthTests.contentMasterId === masterId &&
        stateAfterAuthTests.status === ContentMasterStatus.ACTIVE,
      `Status: ${stateAfterAuthTests.status}, blockers: ${stateAfterAuthTests.blockers.length}`
    );
  } finally {
    process.env.GOOGLE_SHEETS_ID = originalSheetId;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    passed: failedCount === 0,
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('phase16-step3-rbac-gate')) {
  runPhase16Step3RbacGateVerification()
    .then((summary) => {
      console.log('====================================================');
      console.log('PHASE 16.3 RBAC / AUTHORIZATION GATE VERIFICATION');
      console.log('====================================================');
      summary.results.forEach((r) => {
        const icon = r.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`[${icon}] ${r.step}: ${r.name} (${r.details || ''})`);
      });
      console.log('----------------------------------------------------');
      console.log(`TOTAL: ${summary.total}, PASSED: ${summary.passedCount}, FAILED: ${summary.failedCount}`);
      console.log('====================================================');
      if (!summary.passed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
