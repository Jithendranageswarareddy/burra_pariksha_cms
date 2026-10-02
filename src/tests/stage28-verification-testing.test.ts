/**
 * BURRA PARIKSHA CMS — Stage 28 Verification & Human Testing Architecture Test Suite
 *
 * Verifies:
 * 1. Coverage of all 3 verification pillars in the Tri-Partite Verification Model.
 * 2. Complete and exact ordering of all 20 steps in the execution process.
 * 3. Human testing protocol (Observe -> Record -> Continue if safe) validation.
 * 4. Anti-patching rule enforcement (blocking continuous micro-patching during active testing).
 * 5. Blocker defect handling (correctly halting session when severity === BLOCKER).
 * 6. Tri-partite gate certification (verifying that all 3 pillars must pass for certification).
 * 7. Independent review authority invariant (Antigravity objective evaluation).
 * 8. Full Zod schema validation across defect records and test sessions.
 */

import {
  VerificationPillar,
  DefectSeverity,
  HumanTestingAction,
  ExecutionProcessStep,
  CANONICAL_20_EXECUTION_STEPS,
  DefectRecordSchema,
  DefectRecord,
  HumanTestSessionSchema,
  HumanTestSession,
  TriPartiteVerificationReportSchema,
  evaluateHumanTestingObservation,
  canTriggerImmediatePatch,
  validateTriPartiteGate,
} from '../types/verification-testing';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage28VerificationSuite() {
  console.log('================================================================================');
  console.log('STAGE 28: VERIFICATION & HUMAN TESTING ARCHITECTURE TEST SUITE');
  console.log('================================================================================\n');

  let passedTests = 0;

  // TEST 1: Coverage of all 3 verification pillars in the Tri-Partite Model
  console.log('Test 1: Verifying Tri-Partite Verification Model pillars...');
  const pillars = Object.values(VerificationPillar);
  assert(pillars.length === 3, `Expected 3 verification pillars, got ${pillars.length}`);
  assert(pillars.includes(VerificationPillar.AUTOMATED), 'Missing AUTOMATED pillar');
  assert(pillars.includes(VerificationPillar.INDEPENDENT_AUDIT), 'Missing INDEPENDENT_AUDIT pillar');
  assert(pillars.includes(VerificationPillar.HUMAN_TESTING), 'Missing HUMAN_TESTING pillar');
  console.log('  ✔ All 3 verification pillars defined and recognized');
  passedTests++;

  // TEST 2: Complete and exact ordering of all 20 execution process steps
  console.log('\nTest 2: Verifying 20-step canonical execution process ordering...');
  assert(CANONICAL_20_EXECUTION_STEPS.length === 20, `Expected 20 steps, got ${CANONICAL_20_EXECUTION_STEPS.length}`);
  
  const expectedSteps: ExecutionProcessStep[] = [
    ExecutionProcessStep.STEP_01_REQ_SUBMISSION,
    ExecutionProcessStep.STEP_02_FORENSIC_AUDIT,
    ExecutionProcessStep.STEP_03_PRINCIPLES_CHECK,
    ExecutionProcessStep.STEP_04_DOMAIN_MODELING,
    ExecutionProcessStep.STEP_05_SECURITY_BOUNDARIES,
    ExecutionProcessStep.STEP_06_DATA_CONTRACTS,
    ExecutionProcessStep.STEP_07_API_CONTRACTS,
    ExecutionProcessStep.STEP_08_UI_CONTRACTS,
    ExecutionProcessStep.STEP_09_TEST_STRATEGY,
    ExecutionProcessStep.STEP_10_COST_GUARD,
    ExecutionProcessStep.STEP_11_IMPLEMENTATION_SPEC,
    ExecutionProcessStep.STEP_12_AI_PROMPT_AUTHORING,
    ExecutionProcessStep.STEP_13_STUDIO_EXECUTION,
    ExecutionProcessStep.STEP_14_GITHUB_PUSH,
    ExecutionProcessStep.STEP_15_LOCAL_PULL_SYNC,
    ExecutionProcessStep.STEP_16_STATIC_COMPILE_CHECK,
    ExecutionProcessStep.STEP_17_STAGE_TEST_EXECUTION,
    ExecutionProcessStep.STEP_18_REGRESSION_EXECUTION,
    ExecutionProcessStep.STEP_19_HUMAN_SME_TESTING,
    ExecutionProcessStep.STEP_20_GATE_CERTIFICATION_STOP,
  ];

  for (let i = 0; i < 20; i++) {
    const stepDef = CANONICAL_20_EXECUTION_STEPS[i];
    assert(stepDef.step === expectedSteps[i], `Step ${i + 1} mismatch: expected ${expectedSteps[i]}, got ${stepDef.step}`);
    assert(stepDef.stepNumber === i + 1, `Step number mismatch at index ${i}`);
    assert(stepDef.primaryActor.length >= 2, `Step ${stepDef.name} must have valid primary actor`);
    assert(stepDef.description.length >= 10, `Step ${stepDef.name} must have valid description`);
  }
  console.log('  ✔ All 20 canonical steps registered in strict sequential order');
  passedTests++;

  // Base mock test session
  const activeSession: HumanTestSession = {
    sessionId: 'SESS-2026-10-02-001',
    testerName: 'Jithendra Reddy',
    testerRole: 'PRODUCT_OWNER_TELUGU_SME',
    sessionActive: true,
    defectsObserved: [],
    sessionStatus: 'IN_PROGRESS',
  };

  // TEST 3: Human testing protocol (Observe -> Record -> Continue if safe)
  console.log('\nTest 3: Enforcing "Observe -> Record -> Continue if safe" protocol...');
  const minorDefect: DefectRecord = {
    defectId: 'DEF-001',
    title: 'LaTeX fraction padding in Question Studio',
    severity: DefectSeverity.MINOR,
    observedBehavior: 'Fraction numerator is 2px too close to denominator line.',
    expectedBehavior: '4px standard typographic separation.',
    workspaceHub: 'Question Studio',
    stepNumber: 1,
    isSessionHalting: false,
    remediationAction: 'BATCH_POST_SESSION',
  };

  const evalResult = evaluateHumanTestingObservation(minorDefect, activeSession);
  assert(evalResult.action === HumanTestingAction.CONTINUE_SAFE, 'Minor defect must return CONTINUE_SAFE');
  assert(evalResult.canContinue === true, 'Tester must be permitted to continue');
  assert(evalResult.rationale.includes('Observe -> Record -> Continue if safe'), 'Rationale must cite observe-record-continue rule');
  console.log('  ✔ "Observe -> Record -> Continue if safe" protocol properly evaluated');
  passedTests++;

  // TEST 4: Anti-patching rule enforcement (blocking reactive micro-patching)
  console.log('\nTest 4: Enforcing anti-patching invariant during active sessions...');
  const patchAttempt1 = canTriggerImmediatePatch(true, DefectSeverity.MAJOR);
  assert(patchAttempt1.allowed === false, 'Major defect during active session must NOT trigger immediate patch');
  assert(patchAttempt1.reason.includes('Anti-patching rule active'), 'Reason must cite anti-patching rule');

  const patchAttempt2 = canTriggerImmediatePatch(true, DefectSeverity.COSMETIC);
  assert(patchAttempt2.allowed === false, 'Cosmetic defect during active session must NOT trigger immediate patch');

  const patchAttempt3 = canTriggerImmediatePatch(false, DefectSeverity.MAJOR);
  assert(patchAttempt3.allowed === true, 'Patching permitted after session concludes');
  console.log('  ✔ Anti-patching rule active: reactive code changes blocked mid-session');
  passedTests++;

  // TEST 5: Blocker defect handling (correctly halting session)
  console.log('\nTest 5: Verifying Blocker defect halts testing session immediately...');
  const blockerDefect: DefectRecord = {
    defectId: 'DEF-002',
    title: 'White screen on question submission',
    severity: DefectSeverity.BLOCKER,
    observedBehavior: 'Unhandled TypeError crashes React root on form submit.',
    expectedBehavior: 'Question payload submitted and status changes to PENDING_REVIEW.',
    workspaceHub: 'Question Studio',
    stepNumber: 1,
    isSessionHalting: true,
    remediationAction: 'IMMEDIATE_HALT',
  };

  const blockerEval = evaluateHumanTestingObservation(blockerDefect, activeSession);
  assert(blockerEval.action === HumanTestingAction.HALT_UNSAFE, 'Blocker defect must return HALT_UNSAFE');
  assert(blockerEval.canContinue === false, 'canContinue must be false for blocker');
  
  const blockerPatch = canTriggerImmediatePatch(true, DefectSeverity.BLOCKER);
  assert(blockerPatch.allowed === true, 'Immediate hotfix permitted for blocker defect');
  console.log('  ✔ Blocker defects halt session immediately and permit targeted remediation');
  passedTests++;

  // TEST 6: Tri-partite gate certification
  console.log('\nTest 6: Enforcing Tri-Partite Gate certification (all 3 pillars required)...');
  const fullyCertified = validateTriPartiteGate(true, true, true);
  assert(fullyCertified.certified === true, 'All 3 pillars true must certify');
  assert(fullyCertified.missingPillars.length === 0, 'No missing pillars when all 3 pass');

  const missingHuman = validateTriPartiteGate(true, true, false);
  assert(missingHuman.certified === false, 'Gate must fail if human testing is missing');
  assert(missingHuman.missingPillars.includes(VerificationPillar.HUMAN_TESTING), 'Must flag missing HUMAN_TESTING');

  const missingIndependent = validateTriPartiteGate(true, false, true);
  assert(missingIndependent.certified === false, 'Gate must fail if independent audit is missing');
  assert(missingIndependent.missingPillars.includes(VerificationPillar.INDEPENDENT_AUDIT), 'Must flag missing INDEPENDENT_AUDIT');

  const missingAutomated = validateTriPartiteGate(false, true, true);
  assert(missingAutomated.certified === false, 'Gate must fail if automated tests fail');
  assert(missingAutomated.missingPillars.includes(VerificationPillar.AUTOMATED), 'Must flag missing AUTOMATED');
  console.log('  ✔ Tri-partite gate strictly requires all 3 verification pillars');
  passedTests++;

  // TEST 7: Independent review authority invariant
  console.log('\nTest 7: Verifying independent review authority (Antigravity)...');
  const step02 = CANONICAL_20_EXECUTION_STEPS.find(s => s.step === ExecutionProcessStep.STEP_02_FORENSIC_AUDIT);
  const step20 = CANONICAL_20_EXECUTION_STEPS.find(s => s.step === ExecutionProcessStep.STEP_20_GATE_CERTIFICATION_STOP);
  assert(step02?.primaryActor === 'Antigravity', 'Step 02 must be owned by Antigravity');
  assert(step20?.primaryActor.includes('Antigravity') === true, 'Step 20 gate certification must involve Antigravity');
  console.log('  ✔ Antigravity independent forensic authority verified');
  passedTests++;

  // TEST 8: Full Zod schema validation
  console.log('\nTest 8: Validating Zod schemas on real verification entities...');
  const validReport = TriPartiteVerificationReportSchema.parse({
    stageOrFeatureId: 'STAGE-28',
    automatedTestsPassed: true,
    independentReviewCertified: true,
    humanTestingApproved: true,
    isFullyCertified: true,
  });
  assert(validReport.isFullyCertified === true, 'Report validation failed');

  const validSession = HumanTestSessionSchema.parse({
    ...activeSession,
    defectsObserved: [minorDefect, blockerDefect],
  });
  assert(validSession.defectsObserved.length === 2, 'Session validation failed');
  console.log('  ✔ Zod schemas validate defect records, sessions, and gate reports accurately');
  passedTests++;

  console.log('\n================================================================================');
  console.log(`STAGE 28 VERIFICATION COMPLETE: ${passedTests}/${passedTests} TEST SUITES PASSED`);
  console.log('================================================================================\n');
}

runStage28VerificationSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
