/**
 * BURRA PARIKSHA CMS — Sprint 3 RBAC & Capability Model Tests
 *
 * Tests:
 * 1. 8-Tier Authorization Model (User -> Roles -> Capabilities -> Page -> Action -> Data Scope -> Workflow Eligibility -> Admin Override)
 * 2. Normal Creator Anti-Self-Approval (GAR-02) Prohibition
 * 3. System Administrator Normal Self-Approval Prohibition (GAR-02)
 * 4. System Administrator Audited Override Approval (Allowed with mandatory justification)
 * 5. Non-Admin Override Attempt (Strictly Rejected)
 * 6. Admin Override without Mandatory Reason (< 10 chars) (Strictly Rejected)
 * 7. Immutable Audit Event Verification with override metadata
 * 8. Data Scope Resolution (ALL, ASSIGNED, TEAM, STAGE, RESTRICTED, OWN)
 * 9. Dynamic UI Action State Resolution (VISIBLE, HIDDEN, READ_ONLY, ENABLED, DISABLED)
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

async function runSprint3AuthorizationTests() {
  console.log('============================================================');
  console.log('SPRINT 3: CANONICAL RBAC & AUDITED OVERRIDE TESTS');
  console.log('============================================================\n');

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

  // --- Test 1: Creator Normal Self-Approval is Blocked (GAR-02) ---
  test('1. Normal Reviewer who authored question cannot self-approve own artifact (GAR-02)', () => {
    const reviewerAuthorActor = {
      id: 'USR-REVIEWER-01',
      role: CanonicalRbacRole.QA_REVIEWER,
      roles: [CanonicalRbacRole.QA_REVIEWER],
    };

    const decision = evaluateAuthorization({
      actor: reviewerAuthorActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-100',
        authorUserId: 'USR-REVIEWER-01',
        createdBy: 'USR-REVIEWER-01',
        stageNumber: 2,
      },
    });

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(decision.errorMessage?.includes('GAR-02'));
  });

  // --- Test 2: Admin Normal Self-Approval is Blocked (GAR-02) ---
  test('2. Admin cannot self-approve own artifact under NORMAL flow (GAR-02 preserved)', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const decision = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-200',
        authorUserId: 'USR-ADMIN-01',
        createdBy: 'USR-ADMIN-01',
        stageNumber: 2,
      },
    });

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(decision.errorMessage?.includes('GAR-02'));
  });

  // --- Test 3: Admin Audited Override is ALLOWED with Valid Reason ---
  test('3. Admin CAN approve own artifact via Audited Administrative Override', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const decision = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-200',
        authorUserId: 'USR-ADMIN-01',
        createdBy: 'USR-ADMIN-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Emergency broadcast schedule requires direct administrator verification',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.isOverride, true);
    assert.strictEqual(decision.auditEvent?.verdict, 'ALLOWED_BY_ADMIN_OVERRIDE');
    assert.strictEqual(decision.auditEvent?.overrideReason, 'Emergency broadcast schedule requires direct administrator verification');
  });

  // --- Test 4: Admin Override without Reason is REJECTED ---
  test('4. Admin Override without mandatory reason (< 10 chars) is strictly rejected', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    const decision = evaluateAuthorization({
      actor: adminActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-200',
        authorUserId: 'USR-ADMIN-01',
        createdBy: 'USR-ADMIN-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'too short', // < 10 characters
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(decision.errorMessage?.includes('minimum 10 characters'));
  });

  // --- Test 5: Non-Admin Attempting Override is REJECTED ---
  test('5. Non-Admin attempting override is strictly rejected', () => {
    const reviewerActor = {
      id: 'USR-REV-01',
      role: CanonicalRbacRole.QA_REVIEWER,
      roles: [CanonicalRbacRole.QA_REVIEWER],
    };

    const decision = evaluateAuthorization({
      actor: reviewerActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: {
        resourceId: 'BP-DFT-300',
        authorUserId: 'USR-REV-01',
        createdBy: 'USR-REV-01',
        stageNumber: 2,
        override: {
          isOverride: true,
          confirmedByAdmin: true,
          reason: 'Attempting override without admin credentials',
          overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
        },
      },
    });

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES);
    assert.ok(decision.errorMessage?.includes('strictly restricted to System Administrators'));
  });

  // --- Test 6: Data Scope Resolution ---
  test('6. Data Scope correctly maps role authority', () => {
    const adminScope = centralAuthorizationService.getDataScope({
      id: 'USR-ADMIN',
      role: CanonicalRbacRole.ADMIN,
    });
    assert.strictEqual(adminScope, DataScope.ALL);

    const authorScope = centralAuthorizationService.getDataScope({
      id: 'USR-AUTHOR',
      role: CanonicalRbacRole.QUESTION_AUTHOR,
    });
    assert.strictEqual(authorScope, DataScope.OWN);

    const editorScope = centralAuthorizationService.getDataScope({
      id: 'USR-EDITOR',
      role: CanonicalRbacRole.VIDEO_EDITOR,
    });
    assert.strictEqual(editorScope, DataScope.ASSIGNED);

    const reviewerScope = centralAuthorizationService.getDataScope({
      id: 'USR-REV',
      role: CanonicalRbacRole.QA_REVIEWER,
    });
    assert.strictEqual(reviewerScope, DataScope.STAGE);
  });

  // --- Test 7: Record-Level Data Scope Filtering ---
  test('7. Record-Level Data Scope restricts non-admin from seeing unassigned records', () => {
    const editorActor = {
      id: 'USR-EDITOR-01',
      role: CanonicalRbacRole.VIDEO_EDITOR,
    };

    const records = [
      { id: 'REC-1', assigneeId: 'USR-EDITOR-01', authorId: 'USR-OTHER' },
      { id: 'REC-2', assigneeId: 'USR-ANOTHER', authorId: 'USR-OTHER' },
      { id: 'REC-3', assigneeId: undefined, authorId: 'USR-EDITOR-01' },
    ];

    const accessible = centralAuthorizationService.filterRecordsByScope(
      editorActor,
      records,
      (r) => ({ assigneeId: r.assigneeId, authorId: r.authorId })
    );

    assert.strictEqual(accessible.length, 2);
    assert.strictEqual(accessible[0].id, 'REC-1'); // assigned
    assert.strictEqual(accessible[1].id, 'REC-3'); // authored
  });

  // --- Test 8: Dynamic UI Action Resolution ---
  test('8. Dynamic UI Action Resolution provides correct UI state and override cues', () => {
    const adminActor = {
      id: 'USR-ADMIN-01',
      role: CanonicalRbacRole.ADMIN,
      roles: [CanonicalRbacRole.ADMIN],
    };

    // Admin looking at approval button for their own question
    const adminUiDecision = centralAuthorizationService.getUiActionState(
      adminActor,
      AuthorizationResource.QUESTION,
      AuthorizationAction.APPROVE,
      {
        resourceId: 'BP-DFT-100',
        authorUserId: 'USR-ADMIN-01',
      }
    );

    assert.strictEqual(adminUiDecision.state, UiActionState.DISABLED);
    assert.strictEqual(adminUiDecision.isOverrideEligible, true);
    assert.ok(adminUiDecision.reason?.includes('Administrator override available'));

    // Normal author looking at approval button for their own question
    const authorActor = {
      id: 'USR-AUTHOR-01',
      role: CanonicalRbacRole.QUESTION_AUTHOR,
    };
    const authorUiDecision = centralAuthorizationService.getUiActionState(
      authorActor,
      AuthorizationResource.QUESTION,
      AuthorizationAction.APPROVE,
      {
        resourceId: 'BP-DFT-100',
        authorUserId: 'USR-AUTHOR-01',
      }
    );

    assert.strictEqual(authorUiDecision.state, UiActionState.HIDDEN); // Author lacks QUESTION:APPROVE capability completely
  });

  // --- Test 9: Workflow Stage Eligibility ---
  test('9. Stage Workflow Eligibility checks match canonical 15-step governance', () => {
    const authorActor = { id: 'USR-AUTH', role: CanonicalRbacRole.QUESTION_AUTHOR };
    const reviewerActor = { id: 'USR-REV', role: CanonicalRbacRole.QA_REVIEWER };
    const adminActor = { id: 'USR-ADMIN', role: CanonicalRbacRole.ADMIN };

    // Stage 1: Question Generation
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(authorActor, 1).eligible, true);
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(adminActor, 1).eligible, true);

    // Stage 2: Question Verification
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(authorActor, 2).eligible, false);
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(reviewerActor, 2).eligible, true);
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(adminActor, 2).eligible, true);

    // Stage 6: Editing Bay
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(reviewerActor, 6).eligible, false);
    assert.strictEqual(centralAuthorizationService.isWorkflowStageEligible(adminActor, 6).eligible, true);
  });

  console.log(`\n============================================================`);
  console.log(`RESULTS: ${passed}/${total} SPRINT 3 AUTHORIZATION TESTS PASSED`);
  console.log(`============================================================\n`);
}

runSprint3AuthorizationTests().catch(console.error);
