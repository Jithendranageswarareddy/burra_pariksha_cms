/**
 * BURRA PARIKSHA CMS — System Admin Workflow Permissions & Strict GAR-02 Regression Test Suite
 *
 * Validates:
 * 1. System Admin has operational capabilities across all 15 workflow stages.
 * 2. System Admin can view, edit, transition, and reassign tasks across all stages.
 * 3. Strict GAR-02 Invariant: Admin cannot approve or verify items they authored (zero override bypass).
 * 4. Non-Author Admin can approve/verify another user's authored item as an independent reviewer.
 * 5. Independent peer reviewer (QA Reviewer, Content Lead) can approve Admin-authored items.
 * 6. Missing legacy authorId fails closed (throws 403 / denied, preventing silent self-approval).
 * 7. objectAuthService.isManagerOrAdmin correctly identifies Admin across role string, roles array, and CanonicalRbacRole.
 * 8. WorkflowEngine.evaluateTransition enforces strict GAR-02 and fails closed when authorId is missing.
 */

import assert from 'node:assert';
import {
  CanonicalRbacRole,
  AuthorizationResource,
  AuthorizationAction,
  ROLE_CAPABILITIES_MAP,
  ADMINISTRATIVE_CAPABILITIES,
  roleHasCapability,
} from '../../src/types/rbac-models';
import {
  evaluateAuthorization,
  evaluateSegregationOfDuties,
  AuthorizationErrorCode,
} from '../../backend/infrastructure/security/rbac-evaluator';
import { centralAuthorizationService } from '../../backend/infrastructure/auth/services/central-authorization.service';
import { objectAuthService } from '../../backend/infrastructure/auth/services/object-auth.service';
import { workflowEngine } from '../../backend/domain/workflow/workflow-engine';
import { UserRole, WorkflowInstanceDocument } from '../../shared';

async function runSystemAdminWorkflowPermissionsTests() {
  console.log('========================================================================');
  console.log('TEST SUITE: SYSTEM ADMIN WORKFLOW PERMISSIONS & STRICT GAR-02 AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // 1. System Admin Capabilities Across All 15 Stages
  // --------------------------------------------------------------------------
  test('1. System Admin possesses required operational capabilities across all 15 workflow stages', () => {
    const adminRole = CanonicalRbacRole.ADMIN;

    // Stage 01: Question Generation & Draft Authoring
    assert.ok(roleHasCapability(adminRole, 'QUESTION:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION:SUBMIT'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION_VERSION:CREATE'));

    // Stage 02: Verification & Fact-Checking
    assert.ok(roleHasCapability(adminRole, 'QUESTION_REVIEW:VERIFY'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION:APPROVE'));
    assert.ok(roleHasCapability(adminRole, 'QUESTION:REJECT'));

    // Stage 03: Teleprompter & Audience Scripting
    assert.ok(roleHasCapability(adminRole, 'SCRIPT:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'SCRIPT:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'SCRIPT:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'SCRIPT:SUBMIT'));
    assert.ok(roleHasCapability(adminRole, 'SCRIPT_VERSION:CREATE'));

    // Stage 04 & 05: Studio Recording & Media Ingestion
    assert.ok(roleHasCapability(adminRole, 'VIDEO:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_TAKE:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_TAKE:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'MEDIA_REFERENCE:UPLOAD'));

    // Stage 06 & 07: Video Editing & QC
    assert.ok(roleHasCapability(adminRole, 'VIDEO_EDIT:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_EDIT:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_EDIT:SUBMIT'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_EDIT:APPROVE'));
    assert.ok(roleHasCapability(adminRole, 'VIDEO_EDIT:REJECT'));

    // Stage 08: Thumbnail Creation & Packaging
    assert.ok(roleHasCapability(adminRole, 'THUMBNAIL:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'THUMBNAIL:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'THUMBNAIL:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'THUMBNAIL:SUBMIT'));

    // Stage 09: Social Review & Quality Sign-Off
    assert.ok(roleHasCapability(adminRole, 'SOCIAL_REVIEW:REVIEW'));
    assert.ok(roleHasCapability(adminRole, 'SOCIAL_REVIEW:APPROVE'));
    assert.ok(roleHasCapability(adminRole, 'SOCIAL_REVIEW:REJECT'));

    // Stage 10: Multi-Channel Publishing
    assert.ok(roleHasCapability(adminRole, 'PUBLISHING_PACKAGE:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'PUBLISHING_PACKAGE:CREATE'));
    assert.ok(roleHasCapability(adminRole, 'PUBLISHING_PACKAGE:EDIT'));
    assert.ok(roleHasCapability(adminRole, 'PUBLISHING_PACKAGE:APPROVE'));

    // Stage 11 & 12: Platform Syndication & Sync
    assert.ok(roleHasCapability(adminRole, 'PUBLICATION:SCHEDULE'));
    assert.ok(roleHasCapability(adminRole, 'PUBLICATION:PUBLISH'));
    assert.ok(roleHasCapability(adminRole, 'PUBLICATION:SYNC'));
    assert.ok(roleHasCapability(adminRole, 'PLATFORM:VIEW'));

    // Stage 13, 14, 15: Analytics, Performance Review, Curriculum Insights
    assert.ok(roleHasCapability(adminRole, 'ANALYTICS_SNAPSHOT:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'ANALYTICS_SNAPSHOT:EXPORT'));
    assert.ok(roleHasCapability(adminRole, 'PERFORMANCE_RECORD:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'PERFORMANCE_RECORD:REVIEW'));
    assert.ok(roleHasCapability(adminRole, 'INTELLIGENCE_INSIGHT:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'INTELLIGENCE_INSIGHT:APPROVE'));

    // Lifecycle, user management, and reassignment
    assert.ok(roleHasCapability(adminRole, 'USER:VIEW'));
    assert.ok(roleHasCapability(adminRole, 'USER:ADMINISTER'));
    assert.ok(roleHasCapability(adminRole, 'WORKFLOW_INSTANCE:ASSIGN'));
    assert.ok(roleHasCapability(adminRole, 'WORKFLOW_INSTANCE:TRANSITION'));
    assert.ok(roleHasCapability(adminRole, 'WORKFLOW_INSTANCE:CANCEL'));
    assert.ok(roleHasCapability(adminRole, 'WORKFLOW_INSTANCE:RETRY'));
  });

  // --------------------------------------------------------------------------
  // 2. Strict GAR-02 Invariant: Admin CANNOT Self-Approve (Zero-Bypass)
  // --------------------------------------------------------------------------
  test('2. System Admin who authored an item CANNOT approve or verify it under any circumstances', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const sodResult = evaluateSegregationOfDuties(
      adminActor,
      {
        resourceId: 'dft_123',
        authorUserId: 'USR-ADMIN-01',
      },
      AuthorizationAction.APPROVE
    );

    assert.strictEqual(sodResult.allowed, false);
    assert.strictEqual(sodResult.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(sodResult.errorMessage?.includes('GAR-02'));

    // Also via full evaluateAuthorization
    const fullAuth = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'dft_123',
        authorUserId: 'USR-ADMIN-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Emergency self approval attempt',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });

    assert.strictEqual(fullAuth.allowed, false);
    assert.strictEqual(fullAuth.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(fullAuth.errorMessage?.includes('GAR-02'));
  });

  // --------------------------------------------------------------------------
  // 3. Non-Author Admin Can Approve Another User's Item
  // --------------------------------------------------------------------------
  test('3. System Admin CAN approve another user\'s authored item as an independent reviewer', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const sodResult = evaluateSegregationOfDuties(
      adminActor,
      {
        resourceId: 'dft_456',
        authorUserId: 'USR-AUTHOR-99',
      },
      AuthorizationAction.APPROVE
    );

    assert.strictEqual(sodResult.allowed, true);

    const fullAuth = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'dft_456',
        authorUserId: 'USR-AUTHOR-99',
        stageNumber: 2,
      },
    });

    assert.strictEqual(fullAuth.allowed, true);
    assert.strictEqual(fullAuth.auditEvent?.verdict, 'ALLOWED');
  });

  // --------------------------------------------------------------------------
  // 4. Peer Reviewer Can Approve Admin-Authored Item
  // --------------------------------------------------------------------------
  test('4. Independent peer reviewer (QA Reviewer) CAN approve Admin-authored item', () => {
    const qaReviewerActor = {
      id: 'USR-QA-01',
      role: CanonicalRbacRole.QA_REVIEWER,
      roles: [CanonicalRbacRole.QA_REVIEWER],
    };

    const sodResult = evaluateSegregationOfDuties(
      qaReviewerActor,
      {
        resourceId: 'dft_admin_789',
        authorUserId: 'USR-ADMIN-01',
      },
      AuthorizationAction.APPROVE
    );

    assert.strictEqual(sodResult.allowed, true);

    const fullAuth = evaluateAuthorization({
      actor: qaReviewerActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'dft_admin_789',
        authorUserId: 'USR-ADMIN-01',
        stageNumber: 2,
      },
    });

    assert.strictEqual(fullAuth.allowed, true);
    assert.strictEqual(fullAuth.auditEvent?.verdict, 'ALLOWED');
  });

  // --------------------------------------------------------------------------
  // 5. Missing Author ID Fails Closed (No Silent Self-Approval)
  // --------------------------------------------------------------------------
  test('5. Missing or empty authorId strictly fails closed with 403 / denied decision', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    // Missing targetContext completely
    const noContext = evaluateSegregationOfDuties(adminActor, undefined, AuthorizationAction.APPROVE);
    assert.strictEqual(noContext.allowed, false);
    assert.strictEqual(noContext.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);

    // Empty authorId in targetContext
    const emptyAuthor = evaluateSegregationOfDuties(
      adminActor,
      { resourceId: 'dft_empty', authorUserId: '   ' },
      AuthorizationAction.APPROVE
    );
    assert.strictEqual(emptyAuthor.allowed, false);
    assert.strictEqual(emptyAuthor.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(emptyAuthor.errorMessage?.includes('missing authorId'));

    // Undefined authorId in targetContext
    const undefinedAuthor = evaluateSegregationOfDuties(
      adminActor,
      { resourceId: 'dft_undefined' },
      AuthorizationAction.VERIFY
    );
    assert.strictEqual(undefinedAuthor.allowed, false);
    assert.strictEqual(undefinedAuthor.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(undefinedAuthor.errorMessage?.includes('missing authorId'));
  });

  // --------------------------------------------------------------------------
  // 6. WorkflowEngine evaluateTransition GAR-02 & Fail-Closed Enforcement
  // --------------------------------------------------------------------------
  test('6. WorkflowEngine evaluateTransition enforces strict GAR-02 and fails closed on missing author', () => {
    const mockItem: WorkflowInstanceDocument = {
      id: 'wf_item_01',
      entityType: 'QUESTION',
      entityId: 'qst_001',
      currentStep: 2,
      contentStatus: 'DRAFT',
      mediaStatus: 'NOT_RECORDED',
      publicationStatus: 'DRAFT',
      jobStatus: 'PENDING',
      authorId: 'USR-ADMIN-01',
      lastTransitionAt: new Date().toISOString(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    const adminActorContext = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      name: 'Admin User',
    };

    // Self-approval transition attempt (Admin is author)
    assert.throws(
      () => {
        workflowEngine.evaluateTransition(
          mockItem,
          3,
          'QUESTION_VERIFY',
          adminActorContext
        );
      },
      (err: any) => {
        return err.name === 'ForbiddenError' && err.message.includes('GAR-02');
      }
    );

    // Missing authorId transition attempt
    const itemMissingAuthor: WorkflowInstanceDocument = {
      ...mockItem,
      authorId: '',
    };

    assert.throws(
      () => {
        workflowEngine.evaluateTransition(
          itemMissingAuthor,
          3,
          'QUESTION_VERIFY',
          { id: 'USR-OTHER-99', role: CanonicalRbacRole.ADMIN, name: 'Independent Admin' }
        );
      },
      (err: any) => {
        return err.name === 'ForbiddenError' && err.message.includes('missing authorId');
      }
    );

    // Valid independent approval transition
    const itemWithOtherAuthor: WorkflowInstanceDocument = {
      ...mockItem,
      authorId: 'USR-AUTHOR-55',
    };

    const result = workflowEngine.evaluateTransition(
      itemWithOtherAuthor,
      3,
      'QUESTION_VERIFY',
      adminActorContext
    );

    assert.strictEqual(result.resultingDimensions.workflowStep, 3);
  });

  // --------------------------------------------------------------------------
  // 7. objectAuthService.isManagerOrAdmin Robust Identification
  // --------------------------------------------------------------------------
  test('7. objectAuthService.isManagerOrAdmin identifies Admin across role string, roles array, and CanonicalRbacRole', () => {
    // Canonical enum in role
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({ id: 'usr_1', role: CanonicalRbacRole.ADMIN }),
      true
    );

    // UserRole enum in role
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({ id: 'usr_2', role: UserRole.ADMIN }),
      true
    );

    // Lowercase string in role
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({ id: 'usr_3', role: 'admin' as any }),
      true
    );

    // Role is non-admin, but roles array includes ADMIN
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({
        id: 'usr_4',
        role: 'QA_REVIEWER',
        roles: ['QA_REVIEWER', 'ADMIN'],
      }),
      true
    );

    // CanonicalRbacRole.CONTENT_LEAD
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({ id: 'usr_5', role: CanonicalRbacRole.CONTENT_LEAD }),
      true
    );

    // Regular non-admin author
    assert.strictEqual(
      objectAuthService.isManagerOrAdmin({ id: 'usr_6', role: CanonicalRbacRole.QUESTION_AUTHOR }),
      false
    );
  });

  console.log(`\n========================================================================`);
  console.log(`RESULTS: ${passed}/${total} SYSTEM ADMIN WORKFLOW PERMISSION TESTS PASSED`);
  console.log(`========================================================================\n`);
}

runSystemAdminWorkflowPermissionsTests().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
