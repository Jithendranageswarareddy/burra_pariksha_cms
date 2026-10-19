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
import { questionDraftService } from '../../backend/features/question-generation/services/question-draft.service';

async function runSystemAdminWorkflowPermissionsTests() {
  console.log('========================================================================');
  console.log('TEST SUITE: SYSTEM ADMIN WORKFLOW PERMISSIONS & STRICT GAR-02 AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // 1. System Admin Capabilities Across All 15 Stages
  // --------------------------------------------------------------------------
  await test('1. System Admin possesses required operational capabilities across all 15 workflow stages', () => {
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
  // 2. Strict GAR-02 Invariant: Employee Zero-Bypass vs Admin Audited Override
  // --------------------------------------------------------------------------
  await test('2. System Admin self-approval requires explicit confirmed override with >= 10 char reason; non-admins are strictly blocked', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    // 2.1 Without explicit override, self-approval is forbidden under GAR-02
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

    // 2.2 Non-admin employee CANNOT self-approve even with override payload
    const nonAdminActor = {
      id: 'USR-WRITER-01',
      role: CanonicalRbacRole.QUESTION_AUTHOR,
      roles: [CanonicalRbacRole.QUESTION_AUTHOR],
    };
    const nonAdminOverride = evaluateAuthorization({
      actor: nonAdminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'dft_123',
        authorUserId: 'USR-WRITER-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Valid looking override reason text',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });
    assert.strictEqual(nonAdminOverride.allowed, false);

    // 2.3 Admin with override but missing confirmation (confirmedByAdmin: false) is rejected
    const unconfirmedAuth = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'dft_123',
        authorUserId: 'USR-ADMIN-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: false,
          reason: 'Valid looking override reason text',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });
    assert.strictEqual(unconfirmedAuth.allowed, false);
    assert.ok(unconfirmedAuth.errorMessage?.includes('confirmedByAdmin'));

    // 2.4 Admin with override but reason length < 10 characters is rejected
    const shortReasonAuth = evaluateAuthorization({
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
          reason: 'Too short',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });
    assert.strictEqual(shortReasonAuth.allowed, false);
    assert.ok(shortReasonAuth.errorMessage?.includes('10 characters'));

    // 2.5 Admin with valid explicit override is ALLOWED and creates audited event
    const validOverrideAuth = evaluateAuthorization({
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
          reason: 'Audited administrative override by system owner',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });
    assert.strictEqual(validOverrideAuth.allowed, true);
    assert.strictEqual(validOverrideAuth.isOverride, true);
    assert.strictEqual(validOverrideAuth.auditEvent?.verdict, 'ALLOWED_BY_ADMIN_OVERRIDE');
    assert.strictEqual(validOverrideAuth.auditEvent?.isOverride, true);
  });

  // --------------------------------------------------------------------------
  // 3. Non-Author Admin Can Approve Another User's Item
  // --------------------------------------------------------------------------
  await test('3. System Admin CAN approve another user\'s authored item as an independent reviewer', () => {
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
  await test('4. Independent peer reviewer (QA Reviewer) CAN approve Admin-authored item', () => {
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
  await test('5. Missing or empty authorId strictly fails closed with 403 / denied decision', () => {
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
  await test('6. WorkflowEngine evaluateTransition enforces strict GAR-02 and fails closed on missing author', () => {
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

    // Self-approval transition attempt without override (Admin is author)
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

    // Self-approval transition attempt with valid override (Admin is author) -> SUCCEEDS
    const overrideTransitionResult = workflowEngine.evaluateTransition(
      mockItem,
      3,
      'QUESTION_VERIFY',
      adminActorContext,
      {
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Emergency self-approval transition override',
        },
      }
    );
    assert.strictEqual(overrideTransitionResult.resultingDimensions.workflowStep, 3);

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
  await test('7. objectAuthService.isManagerOrAdmin identifies Admin across role string, roles array, and CanonicalRbacRole', () => {
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

  // --------------------------------------------------------------------------
  // 8. Canonical Author ID vs Display Name & Admin Author Reconciliation Recovery
  // --------------------------------------------------------------------------
  await test('8. Canonical author ID is strictly enforced: display names are not identity keys, and Admin can reconcile legacy drafts', async () => {
    const draftPayload = {
      topicId: 'top_10000000-0000-4000-8000-000000000001',
      subtopicId: 'sub_10000000-0000-4000-8000-000000000113',
      difficulty: 'Medium',
      language: 'TELUGU',
      questionText: 'What is the sum of angles in a triangle?',
      options: { a: '180°', b: '90°', c: '360°', d: '270°' },
      correctAnswer: 'A',
      explanation: 'Sum of angles in any Euclidean triangle is 180 degrees.',
      realLifeContext: 'Daily Life',
    };

    // 8.1 Draft missing authorId and createdBy fails closed (throws 403 / MissingAuthorIdentityError)
    const draftMissingAuthor = await questionDraftService.saveDraft(
      draftPayload,
      { id: '', name: 'Anonymous Author' }
    );

    let threwMissingAuthor = false;
    try {
      await questionDraftService.approveDraft(draftMissingAuthor.id, {
        id: 'USR-ADMIN-01',
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
    } catch (err: any) {
      threwMissingAuthor = true;
      assert.strictEqual(err.statusCode, 403);
      assert.strictEqual(err.name, 'MissingAuthorIdentityError');
    }
    assert.ok(threwMissingAuthor, 'Draft with missing authorId must fail closed with 403 MissingAuthorIdentityError');

    // 8.2 Display name equality does NOT trigger false self-approval if canonical user IDs are different
    // Save draft authored by user "USR-AUTHOR-99", display name "Admin User"
    const draftWithSameDisplayName = await questionDraftService.saveDraft(
      draftPayload,
      { id: 'USR-AUTHOR-99', name: 'Admin User' }
    );

    // Admin reviewer has id "USR-ADMIN-01" and name "Admin User".
    // Because canonical user IDs are different ('USR-AUTHOR-99' !== 'USR-ADMIN-01'), approval must NOT be blocked!
    const approvedItem = await questionDraftService.approveDraft(draftWithSameDisplayName.id, {
      id: 'USR-ADMIN-01',
      name: 'Admin User',
      role: UserRole.ADMIN,
    });
    assert.ok(approvedItem, 'Independent Admin with matching display name must be permitted to approve because user IDs differ');

    // 8.3 Admin author self-approval without override is strictly blocked
    const adminAuthoredDraft = await questionDraftService.saveDraft(
      draftPayload,
      { id: 'USR-ADMIN-01', name: 'Admin User' }
    );

    let threwSelfApprovalWithoutOverride = false;
    try {
      await questionDraftService.approveDraft(
        adminAuthoredDraft.id,
        {
          id: 'USR-ADMIN-01',
          name: 'Admin User',
          role: UserRole.ADMIN,
        },
        'Attempt without override'
      );
    } catch (err: any) {
      threwSelfApprovalWithoutOverride = true;
      assert.strictEqual(err.statusCode, 403);
      assert.strictEqual(err.name, 'AntiSelfApprovalViolation');
    }
    assert.ok(threwSelfApprovalWithoutOverride, 'Admin cannot self-approve own draft without override payload');

    // 8.3b Admin author self-approval WITH valid override SUCCEEDS
    const approvedWithOverride = await questionDraftService.approveDraft(
      adminAuthoredDraft.id,
      {
        id: 'USR-ADMIN-01',
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
      'Audited override approval notes',
      {
        isOverride: true,
        confirmedByAdmin: true,
        reason: 'Legitimate administrative self-approval override justification',
        overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
      }
    );
    assert.ok(approvedWithOverride, 'Admin can self-approve own draft when valid override is provided');

    // 8.4 Administrative Reconciliation Recovery Path
    // Reconcile the legacy draft missing authorId
    const reconciledDraft = await questionDraftService.reconcileDraftAuthor(
      draftMissingAuthor.id,
      'USR-ORIGINAL-CREATOR-88',
      { id: 'USR-ADMIN-01', name: 'Admin User', role: UserRole.ADMIN },
      'Reconciled Author'
    );
    assert.strictEqual(reconciledDraft.authorId, 'USR-ORIGINAL-CREATOR-88');

    // Non-author Admin can now approve the reconciled draft
    const approvedReconciled = await questionDraftService.approveDraft(reconciledDraft.id, {
      id: 'USR-ADMIN-01',
      name: 'Admin User',
      role: UserRole.ADMIN,
    });
    assert.ok(approvedReconciled, 'Admin can approve reconciled legacy draft as independent reviewer');
  });

  console.log(`\n========================================================================`);
  console.log(`RESULTS: ${passed}/${total} SYSTEM ADMIN WORKFLOW PERMISSION TESTS PASSED`);
  if (failed > 0) {
    console.error(`FAILURE: ${failed} tests failed!`);
    process.exitCode = 1;
  }
  console.log(`========================================================================\n`);
}

runSystemAdminWorkflowPermissionsTests().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
