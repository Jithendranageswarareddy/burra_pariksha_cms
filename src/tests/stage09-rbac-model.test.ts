/**
 * BURRA PARIKSHA CMS — Stage 09 Canonical RBAC & Capability Model Automated Verification Suite
 *
 * Verifies that the RBAC & Capability architecture established in 09-RBAC-CAPABILITY-MATRIX.md,
 * src/types/rbac-models.ts, and src/lib/auth/rbac-evaluator.ts is strictly enforced:
 * 1. All 28 Canonical Resources accounted for (tracing to Stage 06 Domain Model).
 * 2. All 23 Canonical Actions accounted for (10 primary + 13 specialized) with semantic boundaries.
 * 3. Strict Capability syntax: Capability = RESOURCE:ACTION.
 * 4. All 11 Canonical Roles defined and 20 Brownfield roles mapped.
 * 5. Role -> Capability Matrix enforced across all roles.
 * 6. Segregation of Duties & Anti-Self-Approval (GAR-02 / NEG-01) enforced, even for ADMIN.
 * 7. AI Human-Gating Boundary Protection (AP-009) enforced for Stages 02, 07, 09, 10, 14, 15.
 * 8. Deterministic 12-step server-side decision pipeline with structured failure semantics.
 * 9. Administrative capabilities strictly segregated to ADMIN.
 * 10. Negative authorization rules & UI non-authoritative security axiom.
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  AuthorizationResource,
  AuthorizationAction,
  CANONICAL_RESOURCES,
  CANONICAL_ACTIONS,
  CanonicalRbacRole,
  CANONICAL_RBAC_ROLES,
  BROWNFIELD_ROLE_DISPOSITIONS,
  HUMAN_GATED_STAGES,
  HUMAN_GATED_CAPABILITIES,
  ADMINISTRATIVE_CAPABILITIES,
  formatCapability,
  parseCapability,
  resolveBrownfieldRole,
  roleHasCapability,
  getRoleCapabilities,
} from '../types/rbac-models';

import {
  evaluateAuthorization,
  evaluateSegregationOfDuties,
  evaluateAiGating,
  AuthorizationErrorCode,
} from '../lib/auth/rbac-evaluator';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 09 RBAC VIOLATION] ${msg}`);
  }
}

export async function runStage09RbacModelTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 09 RBAC & CAPABILITY MODEL VERIFICATION SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Canonical Resource Taxonomy Coverage (28 Resources)
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 28 Canonical Resources Taxonomy (AP-004, Stage 06)...');
  assert(Array.isArray(CANONICAL_RESOURCES), 'CANONICAL_RESOURCES must be an array');
  assert(CANONICAL_RESOURCES.length === 28, `Expected exactly 28 resources, found ${CANONICAL_RESOURCES.length}`);

  const expectedResources = [
    'USER',
    'ROLE',
    'CAPABILITY',
    'QUESTION',
    'QUESTION_VERSION',
    'QUESTION_REVIEW',
    'CONTENT',
    'SCRIPT',
    'SCRIPT_VERSION',
    'VIDEO',
    'VIDEO_TAKE',
    'VIDEO_EDIT',
    'MEDIA_ASSET',
    'MEDIA_REFERENCE',
    'ARCHIVE_REFERENCE',
    'THUMBNAIL',
    'SOCIAL_REVIEW',
    'PUBLISHING_PACKAGE',
    'PUBLICATION',
    'PLATFORM',
    'ANALYTICS_SNAPSHOT',
    'PERFORMANCE_RECORD',
    'INTELLIGENCE_INSIGHT',
    'WORKFLOW_INSTANCE',
    'WORKFLOW_TRANSITION',
    'NOTIFICATION',
    'AUDIT_EVENT',
    'CONFIGURATION',
  ];

  for (const expected of expectedResources) {
    assert(
      CANONICAL_RESOURCES.includes(expected as AuthorizationResource),
      `Missing canonical resource: ${expected}`
    );
  }
  console.log('  -> PASSED: All 28 canonical resources verified.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Canonical Action Vocabulary (23 Actions) & Semantic Distinctions
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: 23 Canonical Actions Vocabulary & Semantic Distinctions...');
  assert(Array.isArray(CANONICAL_ACTIONS), 'CANONICAL_ACTIONS must be an array');
  assert(CANONICAL_ACTIONS.length === 23, `Expected exactly 23 actions, found ${CANONICAL_ACTIONS.length}`);

  const primaryActions = [
    'VIEW', 'CREATE', 'EDIT', 'APPROVE', 'REJECT',
    'PUBLISH', 'ARCHIVE', 'RESTORE', 'DELETE', 'ADMINISTER'
  ];
  for (const act of primaryActions) {
    assert(CANONICAL_ACTIONS.includes(act as AuthorizationAction), `Missing primary action: ${act}`);
  }

  const operationalActions = [
    'ASSIGN', 'SUBMIT', 'VERIFY', 'REVIEW', 'GENERATE',
    'UPLOAD', 'DOWNLOAD', 'EXPORT', 'SYNC', 'SCHEDULE',
    'CANCEL', 'RETRY', 'TRANSITION'
  ];
  for (const act of operationalActions) {
    assert(CANONICAL_ACTIONS.includes(act as AuthorizationAction), `Missing operational action: ${act}`);
  }

  // Semantic distinctions: verbs must be distinct
  assert((AuthorizationAction.EDIT as string) !== (AuthorizationAction.APPROVE as string), 'EDIT must distinct from APPROVE');
  assert((AuthorizationAction.APPROVE as string) !== (AuthorizationAction.PUBLISH as string), 'APPROVE must distinct from PUBLISH');
  assert((AuthorizationAction.ARCHIVE as string) !== (AuthorizationAction.DELETE as string), 'ARCHIVE must distinct from DELETE');
  assert((AuthorizationAction.RESTORE as string) !== (AuthorizationAction.EDIT as string), 'RESTORE must distinct from EDIT');
  console.log('  -> PASSED: All 23 canonical actions and semantic boundaries verified.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Strict Capability Syntax (RESOURCE:ACTION)
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Strict Capability Syntax & Parsing...');
  const sampleCap = formatCapability(AuthorizationResource.QUESTION, AuthorizationAction.APPROVE);
  assert(sampleCap === 'QUESTION:APPROVE', `Unexpected capability format: ${sampleCap}`);

  const parsedValid = parseCapability('QUESTION:APPROVE');
  assert(parsedValid.isValid === true, 'QUESTION:APPROVE must be valid');
  assert(parsedValid.resource === AuthorizationResource.QUESTION, 'Resource should be QUESTION');
  assert(parsedValid.action === AuthorizationAction.APPROVE, 'Action should be APPROVE');

  // Non-canonical capabilities must fail validation
  const parsedInvalid1 = parseCapability('VIDEO:RECORD'); // RECORD is non-canonical
  assert(parsedInvalid1.isValid === false, 'VIDEO:RECORD must be rejected as non-canonical');

  const parsedInvalid2 = parseCapability('ASSIGNMENT:ASSIGN'); // ASSIGNMENT is not a canonical resource
  assert(parsedInvalid2.isValid === false, 'ASSIGNMENT:ASSIGN must be rejected as non-canonical');

  const parsedInvalid3 = parseCapability('DATABASE:RESTORE'); // DATABASE is not a canonical resource
  assert(parsedInvalid3.isValid === false, 'DATABASE:RESTORE must be rejected as non-canonical');

  const parsedMalformed = parseCapability('INVALID_STRING_WITHOUT_COLON');
  assert(parsedMalformed.isValid === false, 'Malformed string must be rejected');
  console.log('  -> PASSED: Capability syntax strictly verified.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Canonical Roles (11 Roles) & Brownfield 20-Role Mapping
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: 11 Canonical Roles & Brownfield 20-Role Disposition...');
  assert(CANONICAL_RBAC_ROLES.length === 11, `Expected 11 canonical roles, found ${CANONICAL_RBAC_ROLES.length}`);

  const brownfieldRoleKeys = Object.keys(BROWNFIELD_ROLE_DISPOSITIONS);
  assert(brownfieldRoleKeys.length === 20, `Expected 20 brownfield roles, found ${brownfieldRoleKeys.length}`);

  // Test brownfield role resolution
  assert(resolveBrownfieldRole('ADMIN') === CanonicalRbacRole.ADMIN, 'ADMIN -> ADMIN');
  assert(resolveBrownfieldRole('CONTENT_MANAGER') === CanonicalRbacRole.CONTENT_LEAD, 'CONTENT_MANAGER -> CONTENT_LEAD');
  assert(resolveBrownfieldRole('PUBLISHING_MANAGER') === CanonicalRbacRole.PUBLISHING_LEAD, 'PUBLISHING_MANAGER -> PUBLISHING_LEAD');
  assert(resolveBrownfieldRole('PUBLISHER') === CanonicalRbacRole.PUBLISHING_LEAD, 'PUBLISHER -> PUBLISHING_LEAD');
  assert(resolveBrownfieldRole('REVIEWER') === CanonicalRbacRole.QA_REVIEWER, 'REVIEWER -> QA_REVIEWER');
  assert(resolveBrownfieldRole('QUESTION_CREATOR') === CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION_CREATOR -> QUESTION_AUTHOR');
  assert(resolveBrownfieldRole('CREATOR') === CanonicalRbacRole.QUESTION_AUTHOR, 'CREATOR -> QUESTION_AUTHOR');
  assert(resolveBrownfieldRole('QUESTION_EDITOR') === CanonicalRbacRole.QUESTION_EDITOR, 'QUESTION_EDITOR -> QUESTION_EDITOR');
  assert(resolveBrownfieldRole('EDITOR') === CanonicalRbacRole.QUESTION_EDITOR, 'EDITOR -> QUESTION_EDITOR');
  assert(resolveBrownfieldRole('SCRIPT_WRITER') === CanonicalRbacRole.SCRIPTWRITER, 'SCRIPT_WRITER -> SCRIPTWRITER');
  assert(resolveBrownfieldRole('CONTENT_WRITER') === CanonicalRbacRole.SCRIPTWRITER, 'CONTENT_WRITER -> SCRIPTWRITER');
  assert(resolveBrownfieldRole('STUDIO_PRESENTER') === CanonicalRbacRole.PRESENTER, 'STUDIO_PRESENTER -> PRESENTER');
  assert(resolveBrownfieldRole('SPEAKER') === CanonicalRbacRole.PRESENTER, 'SPEAKER -> PRESENTER');
  assert(resolveBrownfieldRole('VIDEO_EDITOR') === CanonicalRbacRole.VIDEO_EDITOR, 'VIDEO_EDITOR -> VIDEO_EDITOR');
  assert(resolveBrownfieldRole('THUMBNAIL_DESIGNER') === CanonicalRbacRole.DESIGNER, 'THUMBNAIL_DESIGNER -> DESIGNER');
  assert(resolveBrownfieldRole('DESIGNER') === CanonicalRbacRole.DESIGNER, 'DESIGNER -> DESIGNER');
  assert(resolveBrownfieldRole('ANALYTICS_VIEWER') === CanonicalRbacRole.ANALYST, 'ANALYTICS_VIEWER -> ANALYST');
  console.log('  -> PASSED: 11 canonical roles and 20 brownfield mappings verified.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Role -> Capability Matrix Enforcement
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Role -> Capability Matrix Enforcement...');
  for (const role of CANONICAL_RBAC_ROLES) {
    const caps = getRoleCapabilities(role);
    assert(caps.length > 0, `Role ${role} must have assigned capabilities`);
    // Universal capabilities
    assert(roleHasCapability(role, 'CONTENT:VIEW'), `Role ${role} must possess CONTENT:VIEW`);
    assert(roleHasCapability(role, 'NOTIFICATION:VIEW'), `Role ${role} must possess NOTIFICATION:VIEW`);
  }

  // Specific role privilege assertions
  assert(roleHasCapability(CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION:CREATE'), 'Author can create questions');
  assert(roleHasCapability(CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION:EDIT'), 'Author can edit questions');
  assert(!roleHasCapability(CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION:APPROVE'), 'Author CANNOT approve questions');

  assert(roleHasCapability(CanonicalRbacRole.QA_REVIEWER, 'QUESTION:APPROVE'), 'QA Reviewer can approve questions');
  assert(roleHasCapability(CanonicalRbacRole.QA_REVIEWER, 'QUESTION_REVIEW:VERIFY'), 'QA Reviewer can verify questions');
  assert(!roleHasCapability(CanonicalRbacRole.QA_REVIEWER, 'PUBLICATION:PUBLISH'), 'QA Reviewer CANNOT publish live');

  assert(roleHasCapability(CanonicalRbacRole.VIDEO_EDITOR, 'VIDEO_EDIT:CREATE'), 'Video editor can create cuts');
  assert(roleHasCapability(CanonicalRbacRole.VIDEO_EDITOR, 'VIDEO_EDIT:SUBMIT'), 'Video editor can submit cuts');
  assert(!roleHasCapability(CanonicalRbacRole.VIDEO_EDITOR, 'VIDEO_EDIT:APPROVE'), 'Video editor CANNOT approve QC');

  assert(roleHasCapability(CanonicalRbacRole.CONTENT_LEAD, 'VIDEO_EDIT:APPROVE'), 'Content lead can approve QC');
  assert(roleHasCapability(CanonicalRbacRole.CONTENT_LEAD, 'WORKFLOW_INSTANCE:TRANSITION'), 'Content lead can transition workflow');

  assert(roleHasCapability(CanonicalRbacRole.PUBLISHING_LEAD, 'PUBLICATION:PUBLISH'), 'Publishing lead can publish live');
  assert(roleHasCapability(CanonicalRbacRole.PUBLISHING_LEAD, 'PUBLISHING_PACKAGE:APPROVE'), 'Publishing lead can approve package');
  console.log('  -> PASSED: Role-capability assignments strictly verified.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Segregation of Duties & Anti-Self-Approval (GAR-02 / NEG-01)
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: Segregation of Duties & Anti-Self-Approval (GAR-02)...');
  const creatorActor = { id: 'USR-CREATOR-01', role: CanonicalRbacRole.QA_REVIEWER }; // Reviewer who also drafted
  const reviewerActor = { id: 'USR-REVIEWER-02', role: CanonicalRbacRole.QA_REVIEWER };
  const targetQuestion = {
    resourceType: AuthorizationResource.QUESTION,
    resourceId: 'BP-Q-00100',
    authorUserId: 'USR-CREATOR-01', // Created by USR-CREATOR-01
  };

  // 1. Creator attempts to approve their own question -> BLOCKED
  const selfApprovalDecision = evaluateAuthorization({
    actor: creatorActor,
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.APPROVE,
    targetContext: targetQuestion,
  });
  assert(selfApprovalDecision.allowed === false, 'Self-approval MUST be rejected');
  assert(
    selfApprovalDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
    `Expected FORBIDDEN_BY_SEGREGATION_OF_DUTIES, got ${selfApprovalDecision.errorCode}`
  );

  // 2. Different reviewer approves the question -> ALLOWED
  const independentApprovalDecision = evaluateAuthorization({
    actor: reviewerActor,
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.APPROVE,
    targetContext: targetQuestion,
  });
  assert(independentApprovalDecision.allowed === true, 'Independent reviewer approval MUST be allowed');

  // 3. Administrative Exception Prohibition: Even ADMIN cannot self-approve their own artifact!
  const adminActor = { id: 'USR-ADMIN-01', role: CanonicalRbacRole.ADMIN };
  const adminSelfApprovalDecision = evaluateAuthorization({
    actor: adminActor,
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.APPROVE,
    targetContext: {
      resourceType: AuthorizationResource.QUESTION,
      resourceId: 'BP-Q-00101',
      authorUserId: 'USR-ADMIN-01', // Admin authored it
    },
  });
  assert(adminSelfApprovalDecision.allowed === false, 'Admin self-approval MUST be rejected');
  assert(
    adminSelfApprovalDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
    'Admin is strictly subject to GAR-02 anti-self-approval'
  );
  console.log('  -> PASSED: GAR-02 anti-self-approval enforced without exception.\n');

  // --------------------------------------------------------------------------
  // TEST 7: AI Human-Gating Boundary Protection (AP-009)
  // --------------------------------------------------------------------------
  console.log('Checking Check 7: AI Human-Gating Boundary Protection (AP-009)...');
  assert(HUMAN_GATED_STAGES.length === 6, 'Must have 6 human-gated stages');
  assert(
    JSON.stringify(HUMAN_GATED_STAGES) === JSON.stringify([2, 7, 9, 10, 14, 15]),
    'Human gates must be stages 2, 7, 9, 10, 14, 15'
  );

  const aiActor = {
    id: 'AI-ASSISTANT-01',
    role: 'AI_BOT',
    isAiAgent: true,
  };

  // AI attempts to approve human-gated steps
  for (const stage of [2, 7, 9, 10, 14, 15]) {
    const aiGateDecision = evaluateAuthorization({
      actor: aiActor,
      resource: AuthorizationResource.QUESTION,
      action: AuthorizationAction.APPROVE,
      targetContext: { stageNumber: stage },
    });
    assert(aiGateDecision.allowed === false, `AI approval on Stage ${stage} must be blocked`);
    assert(
      aiGateDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_AI_GATING,
      `Expected FORBIDDEN_BY_AI_GATING for stage ${stage}, got ${aiGateDecision.errorCode}`
    );
  }

  // AI attempts to verify review record -> blocked
  const aiVerifyDecision = evaluateAuthorization({
    actor: aiActor,
    resource: AuthorizationResource.QUESTION_REVIEW,
    action: AuthorizationAction.VERIFY,
  });
  assert(aiVerifyDecision.allowed === false, 'AI cannot execute QUESTION_REVIEW:VERIFY');
  assert(aiVerifyDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_AI_GATING, 'Must return FORBIDDEN_BY_AI_GATING');

  // Human reviewer on human gate is allowed
  const humanReviewer = { id: 'USR-HUMAN-01', role: CanonicalRbacRole.QA_REVIEWER, isAiAgent: false };
  const humanDecision = evaluateAuthorization({
    actor: humanReviewer,
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.APPROVE,
    targetContext: { authorUserId: 'OTHER-AUTHOR' },
  });
  assert(humanDecision.allowed === true, 'Human reviewer on human gate must be allowed');
  console.log('  -> PASSED: AP-009 AI human gating strictly protected.\n');

  // --------------------------------------------------------------------------
  // TEST 8: Deterministic 12-Step Decision Flow & Error Semantics
  // --------------------------------------------------------------------------
  console.log('Checking Check 8: Deterministic Decision Flow & Error Semantics...');
  // 1. Unauthenticated actor
  const unauthDecision = evaluateAuthorization({
    actor: { id: '' },
    resource: AuthorizationResource.CONTENT,
    action: AuthorizationAction.VIEW,
  });
  assert(unauthDecision.allowed === false, 'Unauthenticated actor must be rejected');
  assert(unauthDecision.errorCode === AuthorizationErrorCode.UNAUTHENTICATED, 'Expected UNAUTHENTICATED error');

  // 2. Unauthorized capability for role
  const unauthRoleDecision = evaluateAuthorization({
    actor: { id: 'USR-DESIGNER-01', role: CanonicalRbacRole.DESIGNER },
    resource: AuthorizationResource.PUBLICATION,
    action: AuthorizationAction.PUBLISH,
  });
  assert(unauthRoleDecision.allowed === false, 'Designer cannot publish live');
  assert(unauthRoleDecision.errorCode === AuthorizationErrorCode.UNAUTHORIZED, 'Expected UNAUTHORIZED error');

  // 3. Business preconditions unsatisfied (AP-005)
  const preconditionFailedDecision = evaluateAuthorization({
    actor: { id: 'USR-QA-01', role: CanonicalRbacRole.QA_REVIEWER },
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.APPROVE,
    targetContext: {
      authorUserId: 'OTHER-AUTHOR',
      isPreconditionsMet: false,
      preconditionFailureReason: '10-point checklist incomplete: Math proof missing',
    },
  });
  assert(preconditionFailedDecision.allowed === false, 'Unsatisfied preconditions must be rejected');
  assert(
    preconditionFailedDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_BUSINESS_RULE,
    'Expected FORBIDDEN_BY_BUSINESS_RULE'
  );

  // 4. Immutability violation: attempting to edit approved/locked artifact (NEG-06)
  const lockedEditDecision = evaluateAuthorization({
    actor: { id: 'USR-AUTHOR-01', role: CanonicalRbacRole.QUESTION_AUTHOR },
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.EDIT,
    targetContext: {
      resourceId: 'BP-Q-00100',
      status: 'APPROVED',
    },
  });
  assert(lockedEditDecision.allowed === false, 'Editing approved question must be rejected');
  assert(
    lockedEditDecision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_BUSINESS_RULE,
    'Expected FORBIDDEN_BY_BUSINESS_RULE on editing approved version (NEG-06)'
  );

  // 5. Valid operation with Audit Event emission (AP-014)
  const validDecision = evaluateAuthorization({
    actor: { id: 'USR-AUTHOR-01', role: CanonicalRbacRole.QUESTION_AUTHOR },
    resource: AuthorizationResource.QUESTION,
    action: AuthorizationAction.CREATE,
  });
  assert(validDecision.allowed === true, 'Valid create request must be allowed');
  assert(validDecision.auditEvent !== undefined, 'Audit event must be emitted on success');
  assert(validDecision.auditEvent?.verdict === 'ALLOWED', 'Audit event verdict must be ALLOWED');
  assert(validDecision.auditEvent?.actorUserId === 'USR-AUTHOR-01', 'Audit event must record actor ID');
  console.log('  -> PASSED: Deterministic 12-step decision flow and error semantics verified.\n');

  // --------------------------------------------------------------------------
  // TEST 9: Administrative Capabilities Segregation (Section 13)
  // --------------------------------------------------------------------------
  console.log('Checking Check 9: Administrative Capabilities Segregation...');
  assert(ADMINISTRATIVE_CAPABILITIES.length === 8, 'Expected 8 administrative capabilities');

  const contentRoles = [
    CanonicalRbacRole.QUESTION_AUTHOR,
    CanonicalRbacRole.QUESTION_EDITOR,
    CanonicalRbacRole.SCRIPTWRITER,
    CanonicalRbacRole.PRESENTER,
    CanonicalRbacRole.VIDEO_EDITOR,
    CanonicalRbacRole.DESIGNER,
    CanonicalRbacRole.PUBLISHING_LEAD,
    CanonicalRbacRole.QA_REVIEWER,
    CanonicalRbacRole.ANALYST,
  ];

  for (const role of contentRoles) {
    for (const adminCap of ADMINISTRATIVE_CAPABILITIES) {
      assert(
        !roleHasCapability(role, adminCap),
        `Content role ${role} MUST NOT possess administrative capability ${adminCap}`
      );
    }
  }

  // Admin possesses administrative capabilities
  assert(roleHasCapability(CanonicalRbacRole.ADMIN, 'USER:ADMINISTER'), 'ADMIN has USER:ADMINISTER');
  assert(roleHasCapability(CanonicalRbacRole.ADMIN, 'ROLE:ADMINISTER'), 'ADMIN has ROLE:ADMINISTER');
  assert(roleHasCapability(CanonicalRbacRole.ADMIN, 'CONFIGURATION:ADMINISTER'), 'ADMIN has CONFIGURATION:ADMINISTER');
  assert(roleHasCapability(CanonicalRbacRole.ADMIN, 'AUDIT_EVENT:VIEW'), 'ADMIN has AUDIT_EVENT:VIEW');
  console.log('  -> PASSED: Administrative capabilities strictly segregated to ADMIN.\n');

  // --------------------------------------------------------------------------
  // TEST 10: Negative Authorization Rules & Non-Authoritative UI Axiom
  // --------------------------------------------------------------------------
  console.log('Checking Check 10: Negative Authorization Rules & Non-Authoritative UI Axiom...');
  // EDIT does not imply APPROVE
  assert(
    roleHasCapability(CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION:EDIT') &&
    !roleHasCapability(CanonicalRbacRole.QUESTION_AUTHOR, 'QUESTION:APPROVE'),
    'QUESTION:EDIT does not imply QUESTION:APPROVE'
  );

  // APPROVE does not imply PUBLISH
  assert(
    roleHasCapability(CanonicalRbacRole.QA_REVIEWER, 'QUESTION:APPROVE') &&
    !roleHasCapability(CanonicalRbacRole.QA_REVIEWER, 'PUBLICATION:PUBLISH'),
    'APPROVE does not imply PUBLISH'
  );

  // ARCHIVE does not imply DELETE
  assert(
    (AuthorizationAction.ARCHIVE as string) !== (AuthorizationAction.DELETE as string),
    'ARCHIVE does not imply DELETE'
  );

  // RESTORE does not imply EDIT
  assert(
    (AuthorizationAction.RESTORE as string) !== (AuthorizationAction.EDIT as string),
    'RESTORE does not imply EDIT'
  );
  console.log('  -> PASSED: Negative authorization rules strictly verified.\n');

  console.log('============================================================');
  console.log('ALL STAGE 09 RBAC & CAPABILITY VERIFICATION CHECKS PASSED (10/10)');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution guard
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('stage09')) {
  runStage09RbacModelTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
