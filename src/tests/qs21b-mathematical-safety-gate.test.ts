/**
 * BURRA PARIKSHA CMS - Phase QS-21B Test Suite
 * Mathematical Verification Safety Gate Remediation & Preservation Tests
 */

import { CandidateValidator } from '../lib/ai/validators/candidate.validator';
import { MathematicalValidator } from '../lib/ai/validators/mathematical.validator';
import {
  MockBlindVerifierProvider,
  evaluateBlindDerivedResult,
  BlindVerificationRequest,
} from '../lib/ai/validators/blind-verifier';
import { QuestionLanguage, DifficultyLevel } from '../types';
import { QuestionCandidate } from '../lib/ai/types';
import { QuestionCreationValidator } from '../lib/validators/question-creation.validator';
import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { questionsRepository, sequencesRepository } from '../lib/repositories';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  results.push({
    name,
    passed: condition,
    details: condition ? undefined : details,
  });
  const status = condition ? '[PASS]' : '[FAIL]';
  console.log(`  ${status} ${name}${details && !condition ? ` -> ${details}` : ''}`);
}

// Simulated getSaveGateReason from QuestionStudioPage
function evaluateSaveGateReason(
  candidate: { questionText: string },
  clientReport: { isValid: boolean; mathematicalVerification?: any } | null,
  configError: string | null = null,
  isSaving: boolean = false,
  isGenerating: boolean = false,
  isRefining: boolean = false,
  isValidatingServer: boolean = false
): string | null {
  if (configError) return 'Configuration unavailable. Please resolve QUESTION_CONFIG errors.';
  if (!candidate.questionText.trim()) return 'Question problem statement is required.';
  if (clientReport?.mathematicalVerification?.status === 'FAILED') {
    return `Mathematical verification failed: ${clientReport.mathematicalVerification.reason || 'Calculated answer does not match declared options.'}`;
  }
  if (clientReport && !clientReport.isValid) return 'Fix blocking client validation errors before saving.';
  if (isSaving) return 'Save operation in progress...';
  if (isGenerating || isRefining) return 'AI operation in progress...';
  if (isValidatingServer) return 'Server validation in progress...';
  return null;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE QS-21B MATH SAFETY GATE TESTS');
  console.log('================================================================\n');

  // Safety Assertion: Database state must remain pristine
  const initialQuestions = await questionsRepository.findAll();
  const initialSequences = await sequencesRepository.findAll();
  const initialQCount = initialQuestions.length;
  const initialQSeq = initialSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // -------------------------------------------------------------------------
  // Suite 1: Mandatory QS-21 Forensic Regression Fixture (5km/15km Average Speed)
  // -------------------------------------------------------------------------
  console.log('--- Suite 1: Mandatory Forensic Regression Fixture ---');

  const forensicCandidate: QuestionCandidate = {
    content: 'A person travels 5 km at 10 km/h walking and 15 km at 45 km/h by metro. Find the average speed.',
    option_a: '25 km/h',
    option_b: '20 km/h', // Declared B, but correct is 24 km/h
    option_c: '22.5 km/h',
    option_d: '30 km/h',
    correct_answer: 'B',
    explanation: 'Total distance = 5 + 15 = 20 km. Total time = 5/10 + 15/45 = 1/2 + 1/3 = 5/6 hr. Average speed = 20 / (5/6) = 24 km/h.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Metro commuter route',
    question_style: 'STORY_BASED',
  };

  const forensicVerifier = new MockBlindVerifierProvider(async () => {
    return {
      solvable: true,
      isNumerical: true,
      expectedValue: 24,
      expectedUnit: 'km/h',
      confidence: 0.99,
      briefDerivation: 'Total dist = 20 km, Total time = 5/6 hr, Speed = 20 / (5/6) = 24 km/h',
    };
  });

  // A. Blind verifier returns FAILED for candidate with missing correct answer 24 km/h
  const asyncReport = await CandidateValidator.validateAsync(forensicCandidate, forensicVerifier);
  assert(
    asyncReport.mathematicalVerification?.status === 'FAILED',
    'A. Blind verifier correctly returns FAILED for invalid 5km/15km candidate',
    `Status: ${asyncReport.mathematicalVerification?.status}, Reason: ${asyncReport.mathematicalVerification?.reason}`
  );

  // B. Generation response validation preserves FAILED status
  assert(
    !asyncReport.isValid && asyncReport.errors.some((e) => e.includes('Mathematical Error') || e.includes('verification')),
    'B. Generation response validation report marks isValid=false and contains error',
    `Errors: ${asyncReport.errors.join('; ')}`
  );

  // C. QuestionStudio preserves FAILED after synchronous CandidateValidator execution
  const syncRevalidation = CandidateValidator.validate({
    ...forensicCandidate,
    mathematicalVerification: asyncReport.mathematicalVerification,
  } as any);

  assert(
    syncRevalidation.mathematicalVerification?.status === 'FAILED',
    'C. Synchronous CandidateValidator re-validation preserves FAILED math status',
    `Status: ${syncRevalidation.mathematicalVerification?.status}`
  );

  // D. FAILED causes clientReport.isValid=false
  assert(
    syncRevalidation.isValid === false,
    'D. FAILED mathematical verification causes sync clientReport.isValid=false',
    `isValid: ${syncRevalidation.isValid}`
  );

  // E & F. FAILED disables Save & getSaveGateReason explains the failure
  const gateReason = evaluateSaveGateReason(
    { questionText: forensicCandidate.content },
    syncRevalidation
  );

  assert(
    gateReason !== null && gateReason.includes('Mathematical verification failed'),
    'E & F. getSaveGateReason reports mathematical failure and disables Save button',
    `Gate reason: ${gateReason}`
  );

  // -------------------------------------------------------------------------
  // Suite 2: State Transitions & Preservation Rules
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 2: Mathematical State Transitions & Preservation Rules ---');

  // G. VERIFIED candidate remains VERIFIED
  const validCandidate: QuestionCandidate = {
    content: 'A train 120 meters long crosses a platform in 15 seconds and a pole in 9 seconds. Find the speed of the train in km/h.',
    option_a: '48 km/h',
    option_b: '72 km/h',
    option_c: '60 km/h',
    option_d: '90 km/h',
    correct_answer: 'B',
    explanation: 'Speed = 120 / (15 - 9) = 20 m/s = 20 * 18/5 = 72 km/h. Burra Trick: 120/6 = 20 m/s -> 72 km/h.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Railway transit',
    question_style: 'STORY_BASED',
  };

  const verifiedReport = CandidateValidator.validate(validCandidate);
  assert(
    verifiedReport.isValid && verifiedReport.mathematicalVerification?.status === 'VERIFIED',
    'G. Valid mathematical candidate is VERIFIED and isValid=true',
    `Status: ${verifiedReport.mathematicalVerification?.status}`
  );

  const verifiedGate = evaluateSaveGateReason({ questionText: validCandidate.content }, verifiedReport);
  assert(
    verifiedGate === null,
    'G2. VERIFIED candidate passes save gate cleanly',
    `Gate reason: ${verifiedGate}`
  );

  // H. UNVERIFIED candidate remains UNVERIFIED and is not converted to FAILED
  const unverifiedCandidate: QuestionCandidate = {
    content: 'A complex multi-stage cistern has 3 irregular inflows with fluctuating discharge rates.',
    option_a: '10 hrs',
    option_b: '12 hrs',
    option_c: '15 hrs',
    option_d: '18 hrs',
    correct_answer: 'B',
    explanation: 'Calculated based on average discharge.',
    difficulty: DifficultyLevel.HARD,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Water reservoir',
    question_style: 'STORY_BASED',
  };

  const unverifiedReport = CandidateValidator.validate(unverifiedCandidate);
  assert(
    unverifiedReport.mathematicalVerification?.status === 'UNVERIFIED',
    'H. Complex unmodeled problem remains UNVERIFIED (not falsely converted to FAILED)',
    `Status: ${unverifiedReport.mathematicalVerification?.status}`
  );

  assert(
    unverifiedReport.isValid === true,
    'H2. UNVERIFIED status does not block client validity if structure is clean (warning only for human review)',
    `isValid: ${unverifiedReport.isValid}, warnings: ${unverifiedReport.warnings.join('; ')}`
  );

  // -------------------------------------------------------------------------
  // Suite 3: Pre-Save & Server Validation Protection
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 3: Pre-Save & Server Validation Protection ---');

  // I. Backend QuestionCreationValidator rejects explicit FAILED mathematicalVerification
  let creationRejected = false;
  let rejectionMessage = '';
  try {
    QuestionCreationValidator.validateStructure({
      creationMode: 'ai',
      topicId: 'T01',
      subtopicId: 'ST01',
      difficulty: 'Intermediate',
      questionText: forensicCandidate.content,
      options: {
        a: forensicCandidate.option_a,
        b: forensicCandidate.option_b,
        c: forensicCandidate.option_c,
        d: forensicCandidate.option_d,
      },
      correctAnswer: forensicCandidate.correct_answer,
      explanation: forensicCandidate.explanation,
      mathematicalVerification: {
        status: 'FAILED',
        reason: 'Blind verification derived 24 km/h, absent from options.',
      },
    });
  } catch (err: any) {
    creationRejected = true;
    rejectionMessage = err.message;
  }

  assert(
    creationRejected && rejectionMessage.includes('Mathematical verification has FAILED'),
    'I. Backend QuestionCreationValidator hard-rejects creation payload with FAILED math verification',
    `Rejection message: ${rejectionMessage}`
  );

  // I2. Server QuestionValidationEngine marks candidate validation as INVALID when FAILED math is passed
  const serverEngineResult = await QuestionValidationEngine.validate(
    {
      id: 'TEMP_Q',
      topicId: 'T01',
      subtopicId: 'ST01',
      difficulty: 'Intermediate',
      language: 'ENGLISH',
      questionText: forensicCandidate.content,
      options: {
        a: forensicCandidate.option_a,
        b: forensicCandidate.option_b,
        c: forensicCandidate.option_c,
        d: forensicCandidate.option_d,
      },
      correctAnswer: forensicCandidate.correct_answer,
      explanation: forensicCandidate.explanation,
      mathematicalVerification: {
        status: 'FAILED',
        reason: 'Blind verification derived 24 km/h, absent from options.',
      },
    } as any,
    { skipTaxonomyLookup: true }
  );

  assert(
    serverEngineResult.status === 'INVALID' && serverEngineResult.errors.some((e) => e.includes('Mathematical Verification Failed')),
    'I2. QuestionValidationEngine yields INVALID status when authoritative FAILED math is passed',
    `Engine status: ${serverEngineResult.status}, Errors: ${serverEngineResult.errors.join('; ')}`
  );

  // -------------------------------------------------------------------------
  // Suite 4: Non-Mathematical and Structural Validation Invariance
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 4: Non-Mathematical & Structural Invariance ---');

  // J. Existing normal non-mathematical questions are unaffected (N/A)
  const nonMathCandidate: QuestionCandidate = {
    content: 'Which river is traditionally known as the Sorrow of Bengal due to frequent catastrophic floods?',
    option_a: 'Damodar River',
    option_b: 'Kosi River',
    option_c: 'Hooghly River',
    option_d: 'Mahanadi River',
    correct_answer: 'A',
    explanation: 'The Damodar River was formerly known as the Sorrow of Bengal because of frequent floods in the plains of West Bengal.',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Indian Geography & River Systems',
    question_style: 'EXAM_STANDARD',
  };

  const nonMathReport = CandidateValidator.validate(nonMathCandidate);
  assert(
    nonMathReport.isValid && nonMathReport.mathematicalVerification?.status === 'NOT_APPLICABLE',
    'J. Non-mathematical question produces NOT_APPLICABLE math status and isValid=true',
    `Status: ${nonMathReport.mathematicalVerification?.status}`
  );

  // K. Existing structural validation remains intact
  const brokenStructuralCandidate: QuestionCandidate = {
    content: 'Too short',
    option_a: 'A',
    option_b: '', // Missing option B
    option_c: '',
    option_d: '',
    correct_answer: 'B',
    explanation: 'Short',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
  };

  const brokenReport = CandidateValidator.validate(brokenStructuralCandidate);
  assert(
    !brokenReport.isValid && brokenReport.errors.length > 0,
    'K. Structural validation errors (missing options, short text) remain hard blocks',
    `Errors: ${brokenReport.errors.join('; ')}`
  );

  // -------------------------------------------------------------------------
  // Suite 5: Safety & Integrity Invariance Assertion
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 5: Production Invariance Safety Check ---');

  const finalQuestions = await questionsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();
  const finalQCount = finalQuestions.length;
  const finalQSeq = finalSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  assert(
    finalQCount === initialQCount,
    'L1. Question count unchanged in database (no test rows persisted)',
    `Before: ${initialQCount}, After: ${finalQCount}`
  );

  assert(
    finalQSeq === initialQSeq,
    'L2. Sequence counter unchanged in database (no sequence allocation during validation)',
    `Before: ${initialQSeq}, After: ${finalQSeq}`
  );

  // Summary
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
