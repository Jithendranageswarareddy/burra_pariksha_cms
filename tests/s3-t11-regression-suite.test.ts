/**
 * BURRA PARIKSHA CMS — S3-T11 Complete RBAC & Security Regression Suite
 *
 * Verifies the 5 Mandatory User Flows:
 * FLOW A: Admin creates question -> Admin sees all data -> Normal self-approval blocked (GAR-02) -> Audited override allowed -> Audit event generated
 * FLOW B: Creator creates question -> Reviewer approves -> Creator cannot approve own artifact
 * FLOW C: Editor sees assigned editing work -> Cannot modify question-review controls (403 Forbidden)
 * FLOW D: Publisher sees publishing work -> Cannot modify unrelated question verification controls (403 Forbidden)
 * FLOW E: Admin sees complete operational system across all 6 navigation hubs and 15 stages
 */

import assert from 'node:assert';
import {
  CanonicalRbacRole,
  AuthorizationResource,
  AuthorizationAction,
  DataScope,
  UiActionState,
  STAGE_WORKFLOW_REGISTRY,
} from '../src/types/rbac-models';
import {
  evaluateAuthorization,
  evaluateSegregationOfDuties,
  AuthorizationErrorCode,
} from '../src/lib/auth/rbac-evaluator';
import { centralAuthorizationService } from '../src/lib/services/central-authorization.service';

async function runSprint3RegressionSuite() {
  console.log('============================================================');
  console.log('S3-T11: COMPREHENSIVE RBAC & WORKFLOW REGRESSION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
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

  // ==========================================================================
  // FLOW A: Admin Full Visibility, GAR-02 Restriction, and Audited Override
  // ==========================================================================
  runTest('FLOW A: Admin creates question, normal self-approval blocked, audited override allowed & logged', () => {
    const admin = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    // 1. Admin sees all question data
    const scope = centralAuthorizationService.getDataScope(admin);
    assert.strictEqual(scope, DataScope.ALL, 'Admin must have DataScope.ALL');

    // 2. Admin cannot perform normal self-approval (GAR-02)
    const normalApproval = evaluateAuthorization({
      actor: admin,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-FLOW-A',
        authorUserId: 'USR-ADMIN-01',
        createdBy: 'USR-ADMIN-01',
        stageNumber: 2,
      },
    });
    assert.strictEqual(normalApproval.allowed, false, 'Normal approval must be blocked by GAR-02');
    assert.strictEqual(normalApproval.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);

    // 3. Admin can perform explicitly designed administrative override
    const overrideApproval = evaluateAuthorization({
      actor: admin,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-FLOW-A',
        authorUserId: 'USR-ADMIN-01',
        createdBy: 'USR-ADMIN-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Emergency broadcast schedule verification under lead administrator authority',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });
    assert.strictEqual(overrideApproval.allowed, true, 'Audited override must be permitted for Admin');
    assert.strictEqual(overrideApproval.isOverride, true);
    assert.strictEqual(overrideApproval.auditEvent?.verdict, 'ALLOWED_BY_ADMIN_OVERRIDE');
    assert.ok(overrideApproval.auditEvent?.overrideReason?.includes('Emergency broadcast schedule'));
  });

  // ==========================================================================
  // FLOW B: Creator Creates -> Reviewer Approves -> Creator Cannot Approve
  // ==========================================================================
  runTest('FLOW B: Creator creates question, independent reviewer approves, creator self-approval rejected', () => {
    const creator = {
      id: 'USR-CREATOR-01',
      role: CanonicalRbacRole.QUESTION_AUTHOR,
    };
    const reviewer = {
      id: 'USR-REVIEWER-02',
      role: CanonicalRbacRole.QA_REVIEWER,
    };

    // Reviewer approval of creator's question is ALLOWED
    const reviewerApproval = evaluateAuthorization({
      actor: reviewer,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-FLOW-B',
        authorUserId: 'USR-CREATOR-01',
        stageNumber: 2,
      },
    });
    assert.strictEqual(reviewerApproval.allowed, true, 'Independent reviewer approval must succeed');

    // Creator self-approval is BLOCKED
    const creatorApproval = evaluateAuthorization({
      actor: creator,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-FLOW-B',
        authorUserId: 'USR-CREATOR-01',
        stageNumber: 2,
      },
    });
    assert.strictEqual(creatorApproval.allowed, false, 'Creator self-approval must be forbidden');
  });

  // ==========================================================================
  // FLOW C: Editor Sees Assigned Editing Work, Cannot Modify Verification
  // ==========================================================================
  runTest('FLOW C: Editor sees assigned work only, cannot approve questions (403/Forbidden)', () => {
    const editor = {
      id: 'USR-EDITOR-01',
      role: CanonicalRbacRole.VIDEO_EDITOR,
    };

    // Editor data scope is ASSIGNED
    const editorScope = centralAuthorizationService.getDataScope(editor);
    assert.strictEqual(editorScope, DataScope.ASSIGNED, 'Editor must have DataScope.ASSIGNED');

    // Editor attempting to approve question verification is FORBIDDEN
    const editorApproval = evaluateAuthorization({
      actor: editor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-100',
        stageNumber: 2,
      },
    });
    assert.strictEqual(editorApproval.allowed, false, 'Editor cannot approve questions');
    assert.strictEqual(editorApproval.errorCode, AuthorizationErrorCode.UNAUTHORIZED);

    // Editor UI state for question approval is HIDDEN
    const uiDecision = centralAuthorizationService.getUiActionState(
      editor,
      AuthorizationResource.QUESTION,
      AuthorizationAction.APPROVE
    );
    assert.strictEqual(uiDecision.state, UiActionState.HIDDEN, 'Approval controls must be HIDDEN for editor');
  });

  // ==========================================================================
  // FLOW D: Publisher Sees Publishing Work, Cannot Modify Verification
  // ==========================================================================
  runTest('FLOW D: Publisher sees publishing work, cannot approve questions', () => {
    const publisher = {
      id: 'USR-PUB-01',
      role: CanonicalRbacRole.PUBLISHING_LEAD,
    };

    // Publisher can access publishing
    assert.strictEqual(centralAuthorizationService.canAccessPage(publisher, '/publishing'), true);
    assert.strictEqual(centralAuthorizationService.canAccessPage(publisher, '/platform-packages'), true);

    // Publisher cannot approve questions
    const pubQuestionApprove = evaluateAuthorization({
      actor: publisher,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: { resourceId: 'BP-DFT-100', stageNumber: 2 },
    });
    assert.strictEqual(pubQuestionApprove.allowed, false, 'Publisher cannot approve questions');
  });

  // ==========================================================================
  // FLOW E: Admin Complete Operational System Access
  // ==========================================================================
  runTest('FLOW E: Admin sees complete operational system across all routes and stages', () => {
    const admin = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const routes = [
      '/',
      '/dashboard',
      '/my-work',
      '/questions',
      '/studio',
      '/production',
      '/videos',
      '/social-review',
      '/platform-packages',
      '/publishing',
      '/analytics',
      '/users',
      '/audit-logs',
    ];

    routes.forEach((route) => {
      assert.strictEqual(
        centralAuthorizationService.canAccessPage(admin, route),
        true,
        `Admin must have access to route: ${route}`
      );
    });

    // Admin eligible for all 15 stages
    for (let stage = 1; stage <= 15; stage++) {
      const eligibility = centralAuthorizationService.isWorkflowStageEligible(admin, stage);
      assert.strictEqual(eligibility.eligible, true, `Admin must be eligible for stage ${stage}`);
      assert.strictEqual(eligibility.canAdminOverride, true, `Admin must have override capability on stage ${stage}`);
    }
  });

  console.log(`\n============================================================`);
  console.log(`RESULTS: ${passed}/${total} SPRINT 3 REGRESSION FLOW TESTS PASSED`);
  console.log(`============================================================\n`);
}

runSprint3RegressionSuite().catch(console.error);
