/**
 * BURRA PARIKSHA CMS - Phase QS-22 Regression Test Suite
 * Mathematical Verification of Successive Percentage Change & Directional Polarity
 */

import { MathematicalLogicalEngine } from '../lib/validation/mathematical-logical.engine';
import { MathematicalValidator } from '../lib/ai/validators/mathematical.validator';
import { CandidateValidator } from '../lib/ai/validators/candidate.validator';
import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { questionsRepository, sequencesRepository } from '../lib/repositories';
import { QuestionLanguage } from '../types';

async function runTests() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — SUCCESSIVE PERCENTAGE MATH VERIFICATION TESTS');
  console.log('================================================================\n');

  let failures = 0;
  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failures++;
    }
  }

  // Pre-test DB snapshot check
  const initQuestions = await questionsRepository.findAll();
  const initSequences = await sequencesRepository.findAll();
  const initQCount = initQuestions.length;
  const initQSeq = initSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // -------------------------------------------------------------------------
  // Test 1: Telugu shirt problem: +20% then -20% on ₹1000 -> ₹40 decrease (Option B)
  // -------------------------------------------------------------------------
  const qTelugu = 'ఒక షర్ట్ అసలు ధర ₹1000. దాని ధరను 20% పెంచారు. ఆ తర్వాత పెంచిన ధరపై 20% తగ్గించారు. ఇప్పుడు అసలు ధరతో పోలిస్తే చివరికి ఎంత మారింది?';
  const optsTelugu = {
    a: '₹40 పెరిగింది',
    b: '₹40 తగ్గింది',
    c: 'ఎలాంటి మార్పు లేదు',
    d: '₹20 తగ్గింది',
  };

  const mathRes1 = MathematicalLogicalEngine.verify(qTelugu, optsTelugu, 'B');
  assert(
    mathRes1.status === 'PROVABLY_VALID' && mathRes1.calculatedValue === 40 && mathRes1.matchedOption === 'B',
    'Test 1a: MathematicalLogicalEngine verifies Telugu successive change with Option B (₹40 తగ్గింది)'
  );

  const candidateTelugu = {
    content: qTelugu,
    option_a: optsTelugu.a,
    option_b: optsTelugu.b,
    option_c: optsTelugu.c,
    option_d: optsTelugu.d,
    correct_answer: 'B' as const,
    explanation: 'అసలు ధర = ₹1000. 20% పెంచితే = 1200. 1200 పై 20% తగ్గింపు = 960. మార్పు = 1000 - 960 = ₹40 తగ్గింది. బుర్ర ట్రిక్: 20 - 20 - (20*20)/100 = -4%. సరియైన సమాధానం Option B.',
    language: QuestionLanguage.TELUGU,
    real_world_context: 'షాపింగ్ మాల్ షర్ట్ కొనుగోలు',
  };

  const mathRes1b = MathematicalValidator.verify(candidateTelugu);
  assert(
    mathRes1b.status === 'VERIFIED' && mathRes1b.expectedValue === 40 && mathRes1b.matchedOption === 'B',
    'Test 1b: MathematicalValidator verifies Telugu successive change with Option B'
  );

  const clientReport1 = CandidateValidator.validate(candidateTelugu);
  assert(
    clientReport1.isValid && clientReport1.errors.length === 0 && clientReport1.mathematicalVerification?.status === 'VERIFIED',
    'Test 1c: CandidateValidator marks candidate valid with VERIFIED math'
  );

  const fullVal1 = await QuestionValidationEngine.validate({
    id: 'TEST-QS-SHIRT-PRICE',
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'MEDIUM',
    language: 'TELUGU',
    questionText: qTelugu,
    options: optsTelugu,
    correctAnswer: 'B',
    explanation: candidateTelugu.explanation,
  } as any, { skipTaxonomyLookup: true });

  assert(
    fullVal1.status === 'VALID' && fullVal1.confidenceScore === 1 && fullVal1.errors.length === 0,
    'Test 1d: Full QuestionValidationEngine returns VALID with 100% confidence'
  );

  // -------------------------------------------------------------------------
  // Test 2: Directional Polarity Contradiction Detection
  // If candidate incorrectly declares Option A (₹40 పెరిగింది), must FAILED / CONTRADICTORY
  // -------------------------------------------------------------------------
  const mathRes2 = MathematicalLogicalEngine.verify(qTelugu, optsTelugu, 'A');
  assert(
    mathRes2.status === 'CONTRADICTORY',
    'Test 2a: MathematicalLogicalEngine rejects false Option A (₹40 పెరిగింది) with CONTRADICTORY'
  );

  const candidateTeluguWrongAnswer = {
    ...candidateTelugu,
    correct_answer: 'A' as const,
  };
  const mathRes2b = MathematicalValidator.verify(candidateTeluguWrongAnswer);
  assert(
    mathRes2b.status === 'FAILED',
    'Test 2b: MathematicalValidator rejects false Option A with FAILED'
  );

  const clientReport2 = CandidateValidator.validate(candidateTeluguWrongAnswer);
  assert(
    !clientReport2.isValid && clientReport2.mathematicalVerification?.status === 'FAILED',
    'Test 2c: CandidateValidator rejects false Option A with isValid=false'
  );

  // -------------------------------------------------------------------------
  // Test 3: English successive change (+25% then -20% on $800 -> $0 change / No change)
  // 800 * 1.25 = 1000; 1000 * 0.80 = 800 -> Net change = 0
  // -------------------------------------------------------------------------
  const qEng = 'The original price of an item is ₹800. It is increased by 25% and then decreased by 20%. How much did the price change?';
  const optsEng = {
    a: '₹50 increase',
    b: '₹0 (no change)',
    c: '₹20 decrease',
    d: '₹40 increase',
  };
  const mathRes3 = MathematicalLogicalEngine.verify(qEng, optsEng, 'B');
  assert(
    mathRes3.status === 'PROVABLY_VALID' && mathRes3.calculatedValue === 0 && mathRes3.matchedOption === 'B',
    'Test 3: English successive change with zero net change resolves to Option B'
  );

  // -------------------------------------------------------------------------
  // Test 4: Successive change asking for Final Selling Price
  // 1000 increased by 20% then decreased by 20% -> Final price is ₹960
  // -------------------------------------------------------------------------
  const qFinal = 'ఒక షర్ట్ అసలు ధర ₹1000. దాని ధరను 20% పెంచారు. ఆ తర్వాత పెంచిన ధరపై 20% తగ్గించారు. ఆ షర్ట్ యొక్క చివరి అమ్మకపు ధర ఎంత?';
  const optsFinal = {
    a: '₹960',
    b: '₹1000',
    c: '₹980',
    d: '₹940',
  };
  const mathRes4 = MathematicalLogicalEngine.verify(qFinal, optsFinal, 'A');
  assert(
    mathRes4.status === 'PROVABLY_VALID' && mathRes4.calculatedValue === 960 && mathRes4.matchedOption === 'A',
    'Test 4: Successive change asking for final price resolves to Option A (₹960)'
  );

  // -------------------------------------------------------------------------
  // Test 5: Production Invariance Safety Assertion
  // -------------------------------------------------------------------------
  const finalQuestions = await questionsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();
  const finalQCount = finalQuestions.length;
  const finalQSeq = finalSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  assert(
    initQCount === finalQCount && finalQCount === 0,
    'Test 5a: Zero production question rows created/persisted during validation tests'
  );
  assert(
    initQSeq === finalQSeq,
    'Test 5b: Zero sequence increments during validation tests'
  );

  console.log(`\n--- ALL TESTS COMPLETE: ${failures === 0 ? 'ALL PASSED' : `${failures} FAILED`} ---`);
  if (failures > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
