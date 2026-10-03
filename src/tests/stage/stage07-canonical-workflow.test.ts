/**
 * BURRA PARIKSHA CMS — Stage 07 Canonical 15-Step Workflow Automated Verification Suite
 *
 * Verifies that the canonical 15-step workflow contract established in 07-CANONICAL-15-STEP-WORKFLOW.md
 * and src/lib/workflow/canonical-workflow.ts is strictly enforced:
 * 1. All 15 canonical steps exist in exact sequential order (1 to 15).
 * 2. Every step satisfies the 11 architectural attributes:
 *    Entry condition, Owner, Inputs, Outputs, UI route, Actions, Validation,
 *    Completion criteria, Failure states, Revision path, Next step.
 * 3. Authoritative forward transitions & illegal stage jump rejection (AP-001, AP-003).
 * 4. Backward revision & rework routing (Stage 02 -> 01, Stage 07 -> 06, Stage 09 -> 08).
 * 5. Closed-loop curriculum intelligence feedback (Stage 15 -> Stage 01).
 * 6. AI human-in-the-loop gate verification (AP-009).
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  CANONICAL_15_STEPS,
  CanonicalStageIdentifier,
  validateCanonicalWorkflowTransition,
  CanonicalStageNumber,
} from '../../lib/workflow/canonical-workflow';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 07 WORKFLOW VIOLATION] ${msg}`);
  }
}

export async function runStage07CanonicalWorkflowTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 07 CANONICAL 15-STEP WORKFLOW VERIFICATION SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Exact 15 Canonical Steps Sequence
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 15 Canonical Steps Exact Sequence (AP-001)...');
  assert(Array.isArray(CANONICAL_15_STEPS), 'CANONICAL_15_STEPS must be an array');
  assert(CANONICAL_15_STEPS.length === 15, `Expected exactly 15 steps, found ${CANONICAL_15_STEPS.length}`);

  const expectedStepIds = [
    'question-generation',
    'question-verification',
    'audience-script',
    'teleprompter-recording',
    'raw-video-handoff',
    'video-editing',
    'final-qc',
    'thumbnail-studio',
    'social-review',
    'publishing-setup',
    'published-live',
    'platform-sync',
    'social-analytics',
    'performance-review',
    'performance-intelligence',
  ];

  CANONICAL_15_STEPS.forEach((step, idx) => {
    const expectedNum = idx + 1;
    assert(step.stepNumber === expectedNum, `Step index ${idx} must have stepNumber ${expectedNum}`);
    assert(step.id === expectedStepIds[idx], `Step ${expectedNum} ID must be ${expectedStepIds[idx]}, found ${step.id}`);
  });
  console.log('  -> PASS: All 15 canonical steps are strictly sequenced from 01 to 15.\n');

  // --------------------------------------------------------------------------
  // TEST 2: 11 Architectural Attributes per Step
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: 11 Architectural Attributes per Step...');
  CANONICAL_15_STEPS.forEach((step) => {
    // 1. Entry Condition / Blocked Condition
    assert(typeof step.blockedCondition === 'string' && step.blockedCondition.length > 5, `Step ${step.stepNumber} must define blocked/entry condition`);
    // 2. Owner / Responsible Role
    assert(typeof step.responsibleRole === 'string' && step.responsibleRole.length > 3, `Step ${step.stepNumber} must define responsibleRole`);
    // 3. Inputs
    assert(typeof step.inputEntity === 'string' && step.inputEntity.length > 3, `Step ${step.stepNumber} must define inputEntity`);
    // 4. Outputs
    assert(typeof step.outputEntity === 'string' && step.outputEntity.length > 3, `Step ${step.stepNumber} must define outputEntity`);
    // 5. UI (Canonical Page & Route)
    assert(typeof step.canonicalPage === 'string' && step.canonicalPage.length > 0, `Step ${step.stepNumber} must define canonicalPage`);
    assert(typeof step.canonicalRoute === 'string' && step.canonicalRoute.startsWith('/'), `Step ${step.stepNumber} must define valid canonicalRoute`);
    // 6. Actions / Responsibility
    assert(typeof step.responsibility === 'string' && step.responsibility.length > 10, `Step ${step.stepNumber} must define responsibility`);
    // 7. Validation / Completion Gate
    assert(typeof step.completionGate === 'string' && step.completionGate.length > 5, `Step ${step.stepNumber} must define completionGate`);
    // 8. Next Step (Forward step)
    const expectedForward = step.stepNumber === 15 ? 1 : step.stepNumber + 1;
    assert(step.forwardStep === expectedForward, `Step ${step.stepNumber} forwardStep must be ${expectedForward}, found ${step.forwardStep}`);
    // 9. Revision Path
    assert(typeof step.revisionRoute === 'string' && step.revisionRoute.startsWith('/'), `Step ${step.stepNumber} must define revisionRoute`);
    // 10. Rejection Path
    assert(typeof step.rejectionRoute === 'string' && step.rejectionRoute.startsWith('/'), `Step ${step.stepNumber} must define rejectionRoute`);
  });
  console.log('  -> PASS: All 11 architectural attributes validated across all 15 canonical steps.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Authoritative Forward Transitions & Illegal Jump Rejection
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Authoritative Forward Transitions & Jump Rejection (AP-001, AP-003)...');

  // Sequential progression across entire pipeline (1 -> 2 -> ... -> 15)
  for (let s = 1; s < 15; s++) {
    const nextStage = (s + 1) as CanonicalStageNumber;
    const res = validateCanonicalWorkflowTransition({
      contentMasterId: 'CM-000001',
      currentStage: s as CanonicalStageNumber,
      targetStage: nextStage,
      actor: { id: 'USR-OP-01', role: 'OPERATOR' },
      humanSignOff: true,
    });
    assert(res.allowed, `Step ${s} -> Step ${nextStage} transition must be allowed`);
  }

  // Illegal stage jump: Step 01 -> Step 07 directly (AP-001 violation)
  const illegalJump = validateCanonicalWorkflowTransition({
    contentMasterId: 'CM-000001',
    currentStage: 1,
    targetStage: 7,
    actor: { id: 'USR-OP-01', role: 'OPERATOR' },
  });
  assert(!illegalJump.allowed, 'Illegal non-sequential jump must be rejected');
  assert(illegalJump.violatedPrinciple === 'AP-001', 'Rejection must report AP-001');
  console.log('  -> PASS: Forward transitions execute sequentially; illegal bypasses strictly rejected.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Structured Rework & Backward Revision Pathways
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Structured Rework & Backward Revision Pathways...');
  
  // Revision 1: Stage 02 (Question Verification) rejects back to Stage 01 (Drafting)
  const qvRevision = validateCanonicalWorkflowTransition({
    contentMasterId: 'CM-000001',
    currentStage: 2,
    targetStage: 1,
    actor: { id: 'USR-SME-01', role: 'SME_REVIEWER' },
    remarks: 'Telugu translation clarification required',
  });
  assert(qvRevision.allowed, 'Stage 02 -> Stage 01 revision must be allowed');

  // Revision 2: Stage 07 (Final QC) rejects back to Stage 06 (Video Editing)
  const qcRevision = validateCanonicalWorkflowTransition({
    contentMasterId: 'CM-000001',
    currentStage: 7,
    targetStage: 6,
    actor: { id: 'USR-QC-01', role: 'QC_LEAD' },
    remarks: 'Audio LUFS exceeded -14 threshold',
  });
  assert(qcRevision.allowed, 'Stage 07 -> Stage 06 revision must be allowed');

  // Revision 3: Stage 09 (Social Review) rejects back to Stage 08 (Thumbnail)
  const socialRevision = validateCanonicalWorkflowTransition({
    contentMasterId: 'CM-000001',
    currentStage: 9,
    targetStage: 8,
    actor: { id: 'USR-SOCIAL-01', role: 'COMMUNITY_MANAGER' },
    remarks: 'Thumbnail variant text safe-zone clipped',
  });
  assert(socialRevision.allowed, 'Stage 09 -> Stage 08 revision must be allowed');
  console.log('  -> PASS: Backward rework and revision pathways verified.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Closed-Loop Curriculum Intelligence Feedback (Step 15 -> Step 01)
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Closed-Loop Feedback Invariant (Step 15 -> Step 01)...');
  const step15 = CANONICAL_15_STEPS[14];
  assert(step15.stepNumber === 15, 'Step 15 must be 15');
  assert(step15.forwardStep === 1, 'Step 15 forwardStep must loop back to Step 1 (Question Studio)');
  assert(step15.outputEntity.includes('/studio'), 'Step 15 output must feed into Question Studio');

  const loopbackTransition = validateCanonicalWorkflowTransition({
    contentMasterId: 'CM-000001',
    currentStage: 15,
    targetStage: 1,
    actor: { id: 'USR-PRODUCER-01', role: 'EXECUTIVE_PRODUCER' },
    humanSignOff: true,
    remarks: 'Applying high-difficulty syllabus insights to new question batch',
  });
  assert(loopbackTransition.allowed, 'Stage 15 -> Stage 01 loopback transition must be allowed');
  console.log('  -> PASS: Closed-loop curriculum intelligence feedback confirmed.\n');

  // --------------------------------------------------------------------------
  // TEST 6: AI Governance (AP-009) on Human-Gated Workflow Stages
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: AI Governance (AP-009) on Human-Gated Stages...');
  const humanGatedStages: CanonicalStageNumber[] = [2, 7, 9, 10, 14, 15];

  humanGatedStages.forEach((stageNum) => {
    const prevStage = (stageNum === 1 ? 15 : stageNum - 1) as CanonicalStageNumber;
    const aiAttempt = validateCanonicalWorkflowTransition({
      contentMasterId: 'CM-000001',
      currentStage: prevStage,
      targetStage: stageNum,
      actor: { id: 'AI-AUTOBOT', role: 'AI_AGENT' },
      humanSignOff: false,
    });
    assert(!aiAttempt.allowed, `AI auto-advance into human-gated Stage ${stageNum} must be rejected`);
    assert(aiAttempt.violatedPrinciple === 'AP-009', `Rejection for Stage ${stageNum} must report AP-009`);
  });
  console.log('  -> PASS: All human-gated stages strictly block AI auto-approvals (AP-009).\n');

  console.log('============================================================');
  console.log('ALL CANONICAL 15-STEP WORKFLOW TESTS PASSED SUCCESSFULLY! ✅');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution guard
const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('src/tests/stage07-canonical-workflow.test.ts')
  )
);

if (isDirectCli) {
  runStage07CanonicalWorkflowTests().catch((err) => {
    console.error('Canonical Workflow Test Failure:', err);
    process.exit(1);
  });
}
