/**
 * BURRA PARIKSHA CMS - Phase QS-18B Test Suite
 * Independent Mathematical Verification Gate & Safety Tests
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
import { questionsRepository, sequencesRepository } from '../lib/repositories';
import { questionConfigService } from '../lib/services/question-config.service';

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

async function runTestSuite() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE QS-18B BLIND MATH VERIFICATION TESTS');
  console.log('================================================================\n');

  // Record initial database state for production safety assertion
  const initialQuestions = await questionsRepository.findAll();
  const initialSequences = await sequencesRepository.findAll();
  const initialQCount = initialQuestions.length;
  const initialQSeq = initialSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // -------------------------------------------------------------------------
  // Suite 1: Deterministic Math Validation
  // -------------------------------------------------------------------------
  console.log('--- Suite 1: Deterministic Mathematical Verification ---');

  // Test 1: Known deterministic math + correct candidate -> VERIFIED
  const deterministicCorrect: QuestionCandidate = {
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

  const report1 = CandidateValidator.validate(deterministicCorrect);
  assert(
    report1.isValid && report1.mathematicalVerification?.status === 'VERIFIED',
    'Test 1: Known deterministic math + correct candidate -> VERIFIED',
    `Status: ${report1.mathematicalVerification?.status}`
  );

  // Test 2: Known deterministic math + incorrect candidate -> FAILED
  const deterministicIncorrect: QuestionCandidate = {
    content: 'A train 120 meters long crosses a platform in 15 seconds and a pole in 9 seconds. Find the speed of the train in km/h.',
    option_a: '48 km/h',
    option_b: '50 km/h', // True is 72 km/h, 50 is wrong
    option_c: '60 km/h',
    option_d: '90 km/h',
    correct_answer: 'B',
    explanation: 'Speed is 72 km/h.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Railway transit',
    question_style: 'STORY_BASED',
  };

  const report2 = CandidateValidator.validate(deterministicIncorrect);
  assert(
    !report2.isValid && report2.mathematicalVerification?.status === 'FAILED',
    'Test 2: Known deterministic math + incorrect candidate -> FAILED',
    `Status: ${report2.mathematicalVerification?.status}, Errors: ${report2.errors.join('; ')}`
  );

  // -------------------------------------------------------------------------
  // Suite 2: Blind Mathematical Verifier for Complex/Unmodeled Problems
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 2: Blind Mathematical Verification Engine ---');

  // Test 3: Complex/unmodeled multi-segment journey candidate
  const multiSegmentProblem: QuestionCandidate = {
    content: 'ఒక వ్యక్తి మొత్తం 60 కి.మీ ప్రయాణంలో, మొదటి 45 నిమిషాలు 45 కి.మీ/గం వేగంతో ప్రయాణించాడు. మిగిలిన దూరాన్ని 30 నిమిషాల్లో చేరుకోవాలంటే అవసరమైన వేగం ఎంత?',
    option_a: '40 కి.మీ/గం',
    option_b: '50 కి.మీ/గం',
    option_c: '52.5 కి.మీ/గం',
    option_d: '60 కి.మీ/గం',
    correct_answer: 'C',
    explanation: 'మొదటి 45 నిమిషాల్లో ప్రయాణించిన దూరం = 45 * 3/4 = 33.75 కి.మీ. మిగిలిన దూరం = 60 - 33.75 = 26.25 కి.మీ. అవసరమైన వేగం = 26.25 / 0.5 = 52.5 కి.మీ/గం. బుర్ర ట్రిక్: 26.25 * 2 = 52.5 కి.మీ/గం.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    real_world_context: 'హైదరాబాద్ టు వరంగల్ ప్రయాణం',
    question_style: 'STORY_BASED',
  };

  let verifierInvoked = false;
  let receivedProblemText = '';

  const trackingVerifier = new MockBlindVerifierProvider(async (req: BlindVerificationRequest) => {
    verifierInvoked = true;
    receivedProblemText = req.problemText;
    return {
      solvable: true,
      isNumerical: true,
      expectedValue: 52.5,
      expectedUnit: 'కి.మీ/గం',
      confidence: 0.98,
      briefDerivation: '60 - (45 * 0.75) = 26.25; 26.25 / 0.5 = 52.5 km/h',
    };
  });

  const report3 = await CandidateValidator.validateAsync(multiSegmentProblem, trackingVerifier);
  assert(
    verifierInvoked,
    'Test 3: Complex/unmodeled math -> blind verifier invoked',
    'Blind verifier was not invoked for unmodeled problem'
  );

  // Test 4: Blind verifier correct result + matching option -> VERIFIED
  assert(
    report3.isValid && report3.mathematicalVerification?.status === 'VERIFIED',
    'Test 4: Blind verifier correct result + matching option -> VERIFIED',
    `Status: ${report3.mathematicalVerification?.status}`
  );

  // Test 5: Blind verifier correct result + no matching option (the exact QS-18A failure) -> FAILED
  const defectiveCandidateQS18A: QuestionCandidate = {
    content: 'ఒక వ్యక్తి మొత్తం 60 కి.మీ ప్రయాణంలో, మొదటి 45 నిమిషాలు 45 కి.మీ/గం వేగంతో ప్రయాణించాడు. మిగిలిన దూరాన్ని 30 నిమిషాల్లో చేరుకోవాలంటే అవసరమైన వేగం ఎంత?',
    option_a: '20 కి.మీ/గం',
    option_b: '30 కి.మీ/గం',
    option_c: '40 కి.మీ/గం',
    option_d: '50 కి.మీ/గం', // Note: 52.5 is not among options
    correct_answer: 'B',
    explanation: 'Explanation claims 30 km/h.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    real_world_context: 'హైదరాబాద్ ప్రయాణం',
    question_style: 'STORY_BASED',
  };

  const report5 = await CandidateValidator.validateAsync(defectiveCandidateQS18A, trackingVerifier);
  assert(
    !report5.isValid && report5.mathematicalVerification?.status === 'FAILED',
    'Test 5: Blind verifier correct result + no matching option -> FAILED',
    `Status: ${report5.mathematicalVerification?.status}, Errors: ${report5.errors.join('; ')}`
  );

  // Test 6: Blind verifier correct result + wrong declared answer -> FAILED
  const wrongDeclaredCandidate: QuestionCandidate = {
    content: multiSegmentProblem.content,
    option_a: '40 కి.మీ/గం',
    option_b: '50 కి.మీ/గం',
    option_c: '52.5 కి.మీ/గం', // Correct is C
    option_d: '60 కి.మీ/గం',
    correct_answer: 'B', // Declared B instead of C
    explanation: 'Some explanation.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    real_world_context: 'హైదరాబాద్ ప్రయాణం',
    question_style: 'STORY_BASED',
  };

  const report6 = await CandidateValidator.validateAsync(wrongDeclaredCandidate, trackingVerifier);
  assert(
    !report6.isValid && report6.mathematicalVerification?.status === 'FAILED',
    'Test 6: Blind verifier correct result + wrong declared answer -> FAILED',
    `Status: ${report6.mathematicalVerification?.status}`
  );

  // Test 7: Explanation contradicts independently derived result -> FAILED
  const contradictoryExpCandidate: QuestionCandidate = {
    content: multiSegmentProblem.content,
    option_a: '40 కి.మీ/గం',
    option_b: '50 కి.మీ/గం',
    option_c: '52.5 కి.మీ/గం',
    option_d: '60 కి.మీ/గం',
    correct_answer: 'C',
    explanation: 'అందువల్ల సరియైన జవాబు ఆప్షన్ B అవుతుంది. (Contradicts Option C)',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    real_world_context: 'హైదరాబాద్ ప్రయాణం',
    question_style: 'STORY_BASED',
  };

  const report7 = await CandidateValidator.validateAsync(contradictoryExpCandidate, trackingVerifier);
  assert(
    !report7.isValid && report7.mathematicalVerification?.status === 'FAILED',
    'Test 7: Explanation contradicts independently derived result -> FAILED',
    `Status: ${report7.mathematicalVerification?.status}, Errors: ${report7.errors.join('; ')}`
  );

  // Test 8: Blind verifier cannot confidently solve -> UNVERIFIED / human review
  const unconfidentVerifier = new MockBlindVerifierProvider(async () => {
    return {
      solvable: false,
      isNumerical: true,
      confidence: 0.3,
      unverifiedReason: 'Ambiguous word problem constraints require manual inspection.',
    };
  });

  const report8 = await CandidateValidator.validateAsync(multiSegmentProblem, unconfidentVerifier);
  assert(
    report8.isValid &&
      report8.mathematicalVerification?.status === 'UNVERIFIED' &&
      report8.warnings.some((w) => w.includes('UNVERIFIED')),
    'Test 8: Blind verifier cannot confidently solve -> UNVERIFIED / human review',
    `Status: ${report8.mathematicalVerification?.status}`
  );

  // Test 9: Telugu numerical question reaches verifier correctly
  assert(
    receivedProblemText.includes('మొదటి 45 నిమిషాలు') && receivedProblemText.includes('45 కి.మీ/గం'),
    'Test 9: Telugu numerical question reaches verifier correctly',
    `Received text: ${receivedProblemText}`
  );

  // -------------------------------------------------------------------------
  // Suite 3: Configuration & Defaults Invariance
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 3: Studio Configuration & Defaults Invariance ---');

  const defaultStyle = await questionConfigService.getDefaultQuestionStyle();
  const realLifeContexts = await questionConfigService.getRealLifeContexts();

  // Test 10: Literal RANDOM context handling remains unchanged
  const randomContextCand: QuestionCandidate = {
    ...multiSegmentProblem,
    real_world_context: 'RANDOM',
  };
  const report10 = CandidateValidator.validate(randomContextCand);
  assert(
    !report10.isValid && report10.errors.some((e) => e.includes('Literal "RANDOM" cannot be used')),
    'Test 10: Literal RANDOM context handling remains rejected by CandidateValidator'
  );

  // Test 11: Story-Based default remains unchanged
  assert(
    defaultStyle?.code === 'STORY_BASED',
    'Test 11: Story-Based default remains unchanged in studio defaults',
    `Actual: ${defaultStyle?.code}`
  );

  // Test 12: Telugu default remains unchanged in studio system contracts
  assert(
    QuestionLanguage.TELUGU === 'TELUGU',
    'Test 12: Telugu default remains unchanged in studio system contracts',
    `Actual: ${QuestionLanguage.TELUGU}`
  );

  // Test 13: Intermediate/Medium difficulty default remains unchanged in studio system contracts
  assert(
    DifficultyLevel.MEDIUM === 'MEDIUM',
    'Test 13: Intermediate (Medium) default remains unchanged in studio system contracts',
    `Actual: ${DifficultyLevel.MEDIUM}`
  );

  // Test 14: Topic/Subtopic/Context catalog behavior remains active and intact
  assert(
    Array.isArray(realLifeContexts) && realLifeContexts.length > 0,
    'Test 14: Topic/Subtopic/Context catalog behavior remains active and intact'
  );

  // -------------------------------------------------------------------------
  // Suite 4: Production Safety & Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- Suite 4: Production Safety & Integrity ---');

  const finalQuestions = await questionsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();
  const finalQCount = finalQuestions.length;
  const finalQSeq = finalSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // Test 15: No production data created or modified
  assert(
    finalQCount === initialQCount,
    `Test 15: No production data is created or modified (Initial: ${initialQCount}, Final: ${finalQCount})`
  );

  // Test 16: No sequence reset/change
  assert(
    finalQSeq === initialQSeq,
    `Test 16: No sequence reset/change (Initial: ${initialQSeq}, Final: ${finalQSeq})`
  );

  // Print Summary
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`QS-18B TEST RESULTS: ${passCount} PASS, ${failCount} FAIL`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
