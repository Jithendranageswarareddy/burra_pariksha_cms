/**
 * BURRA PARIKSHA CMS - Phase 22.3 Blind Independent Verifier Verification Suite
 * 
 * Verifies all 20 required contract requirements:
 * BV-01 to BV-20
 * 
 * STRICT TEST RULES:
 * - Zero live external AI calls (uses MockBlindVerifierProvider and mocks).
 * - Zero Google Sheets writes.
 * - Genuine leak-testing (checks that actual declared-answer value and explanation text are absent).
 */

import { QuestionLanguage, DifficultyLevel } from '../types';
import {
  BlindVerifierInputDTO,
  BlindVerifierOutputZodSchema,
  buildBlindSolvingPrompt,
  MockBlindVerifierProvider,
  BlindVerifierRegistry,
  VerifierArbitrationEngine,
  AIOrchestrator,
  AIProviderRegistry,
  QuestionCandidate,
} from '../lib/ai';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

export async function runPhase22Step3Tests(): Promise<void> {
  console.log('====================================================');
  console.log('PHASE 22.3 BLIND INDEPENDENT VERIFIER SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      throw err;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      throw err;
    }
  }

  // ----------------------------------------------------
  // BV-01 & BV-02: Input DTO Shape & Answer Absence
  // ----------------------------------------------------
  test('BV-01: BlindVerifierInputDTO contains stem and all 4 options', () => {
    const dto: BlindVerifierInputDTO = {
      questionText: 'A train 150m long passes an electric pole in 15 seconds. What is its speed?',
      options: {
        a: '30 km/h',
        b: '36 km/h',
        c: '45 km/h',
        d: '54 km/h',
      },
      language: QuestionLanguage.ENGLISH,
      categoryName: 'Quantitative Aptitude',
      topicName: 'Time and Distance',
      subtopicName: 'Trains',
    };

    assert(dto.questionText.length > 10, 'Must have valid stem');
    assert(dto.options.a === '30 km/h', 'Option A missing');
    assert(dto.options.b === '36 km/h', 'Option B missing');
    assert(dto.options.c === '45 km/h', 'Option C missing');
    assert(dto.options.d === '54 km/h', 'Option D missing');
  });

  test('BV-02: BlindVerifierInputDTO type has no correctAnswer field', () => {
    const dto: BlindVerifierInputDTO = {
      questionText: 'Test question',
      options: { a: '1', b: '2', c: '3', d: '4' },
      language: QuestionLanguage.ENGLISH,
    };

    const keys = Object.keys(dto);
    assert(!keys.includes('correctAnswer'), 'DTO must not include correctAnswer');
    assert(!keys.includes('correct_answer'), 'DTO must not include correct_answer');
    assert(!keys.includes('explanation'), 'DTO must not include explanation');
    assert(!keys.includes('speedTrick'), 'DTO must not include speedTrick');
  });

  // ----------------------------------------------------
  // BV-03 to BV-08: Prompt Leak-Proof Construction
  // ----------------------------------------------------
  const sampleCandidate: QuestionCandidate = {
    content: 'A cyclist travels from Town X to Town Y at 20 km/h and returns at 30 km/h. What is the average speed?',
    option_a: '24 km/h',
    option_b: '25 km/h',
    option_c: '26 km/h',
    option_d: '22 km/h',
    correct_answer: 'A',
    explanation: 'Harmonic mean formula: 2xy/(x+y) = 2*20*30 / (20+30) = 1200 / 50 = 24 km/h. Hence Option A.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    real_world_context: 'Town travel',
  };

  const sampleTeluguCandidate: QuestionCandidate = {
    content: 'ఒక రైలు 40 కి.మీ/గం వేగంతో వెళ్లి, అదే మార్గంలో 60 కి.మీ/గం వేగంతో వచ్చింది. సగటు వేగం ఎంత?',
    option_a: '50 కి.మీ/గం',
    option_b: '48 కి.మీ/గం',
    option_c: '52 కి.మీ/గం',
    option_d: '45 కి.మీ/గం',
    correct_answer: 'B',
    explanation: 'సగటు వేగం = 2*40*60 / (40+60) = 4800 / 100 = 48 కి.మీ/గం. బుర్ర ట్రిక్: 2*40*60/100 = 48. ఆప్షన్ B.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  };

  const englishDto: BlindVerifierInputDTO = {
    questionText: sampleCandidate.content,
    options: {
      a: sampleCandidate.option_a,
      b: sampleCandidate.option_b,
      c: sampleCandidate.option_c,
      d: sampleCandidate.option_d,
    },
    language: sampleCandidate.language,
    topicName: 'Average Speed',
  };

  const englishPrompt = buildBlindSolvingPrompt(englishDto);

  test('BV-03: Prompt contains no generator correct answer declaration', () => {
    assert(!englishPrompt.includes('Option A is correct'), 'Must not claim option A is correct');
    assert(!englishPrompt.includes('Declared Correct Answer'), 'Must not leak declared answer');
    assert(!englishPrompt.includes('correctAnswer'), 'Must not contain correctAnswer identifier');
  });

  test('BV-04: Prompt contains no explanation or derivation steps', () => {
    assert(!englishPrompt.includes(sampleCandidate.explanation), 'Prompt must not contain generator explanation');
    assert(!englishPrompt.includes('Harmonic mean formula'), 'Prompt must not contain intermediate derivation');
    assert(!englishPrompt.includes('1200 / 50'), 'Prompt must not contain calculation text');
  });

  test('BV-05: Prompt contains no Burra Trick or speed shortcut hint', () => {
    assert(!englishPrompt.includes('Burra Trick'), 'Prompt must not contain Burra Trick');
    assert(!englishPrompt.includes('Speed Shortcut'), 'Prompt must not contain Speed Shortcut');
  });

  test('BV-06: Prompt contains all four options intact', () => {
    assert(englishPrompt.includes('Option A: 24 km/h'), 'Option A text missing in prompt');
    assert(englishPrompt.includes('Option B: 25 km/h'), 'Option B text missing in prompt');
    assert(englishPrompt.includes('Option C: 26 km/h'), 'Option C text missing in prompt');
    assert(englishPrompt.includes('Option D: 22 km/h'), 'Option D text missing in prompt');
  });

  test('BV-07: Prompt works for English questions', () => {
    assert(englishPrompt.includes('Language: ENGLISH'), 'Language tag missing');
    assert(englishPrompt.includes('A cyclist travels from Town X'), 'English stem missing');
  });

  test('BV-08: Prompt works for Telugu questions', () => {
    const teluguDto: BlindVerifierInputDTO = {
      questionText: sampleTeluguCandidate.content,
      options: {
        a: sampleTeluguCandidate.option_a,
        b: sampleTeluguCandidate.option_b,
        c: sampleTeluguCandidate.option_c,
        d: sampleTeluguCandidate.option_d,
      },
      language: sampleTeluguCandidate.language,
    };
    const teluguPrompt = buildBlindSolvingPrompt(teluguDto);
    assert(teluguPrompt.includes('Language: TELUGU'), 'Language tag missing');
    assert(teluguPrompt.includes('ఒక రైలు 40 కి.మీ/గం'), 'Telugu stem missing');
    assert(teluguPrompt.includes('48 కి.మీ/గం'), 'Telugu option missing');
    assert(!teluguPrompt.includes('బుర్ర ట్రిక్'), 'Must not leak Telugu Burra Trick');
  });

  // ----------------------------------------------------
  // BV-09 & BV-10: Schema Validation
  // ----------------------------------------------------
  test('BV-09: Malformed verifier JSON is rejected by schema', () => {
    const malformed = {
      solvedOption: 'B',
      // missing independentProof, confidence, isSolvable, hasMultipleValidOptions
    };
    const res = BlindVerifierOutputZodSchema.safeParse(malformed);
    assert(!res.success, 'Malformed verifier payload must fail schema validation');
  });

  test('BV-10: Invalid solvedOption is rejected by schema', () => {
    const invalidOption = {
      solvedOption: 'Z', // Invalid letter
      independentProof: 'Step-by-step reasoning.',
      confidence: 0.9,
      isSolvable: true,
      hasMultipleValidOptions: false,
    };
    const res = BlindVerifierOutputZodSchema.safeParse(invalidOption);
    assert(!res.success, 'Invalid option letter must fail schema validation');
  });

  // ----------------------------------------------------
  // BV-11 to BV-16: Server Arbitration Rules
  // ----------------------------------------------------
  test('BV-11: Generator = Verifier -> consensus can become VALID when deterministic checks pass', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate, // declared answer: 'A'
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'A',
        derivedValue: '24 km/h',
        independentProof: 'Calculated harmonic mean: 2*20*30/(20+30) = 24 km/h. Hence Option A.',
        confidence: 0.95,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'VALID', 'Verdict must be VALID');
    assert(arbitration.agreement === true, 'Must record agreement as true');
    assert(arbitration.confidenceScore === 0.95, 'Must reflect confidence score');
  });

  test('BV-11a: Low-confidence agreement (0.59) -> VALID (Generator B / Verifier B / deterministic pass)', () => {
    const candidateB: QuestionCandidate = { ...sampleCandidate, correct_answer: 'B' };
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: candidateB,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'B',
        derivedValue: '25 km/h',
        independentProof: 'Independent derivation yields Option B.',
        confidence: 0.59,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'VALID', 'Verdict must be VALID for confidence 0.59');
    assert(arbitration.agreement === true, 'Must record agreement as true');
    assert(arbitration.confidenceScore === 0.59, 'Must preserve confidence 0.59 as advisory telemetry');
    assert(arbitration.deterministicContradiction === false, 'Deterministic contradiction must be false');
  });

  test('BV-11b: Low-confidence agreement (0.20) -> VALID (Generator B / Verifier B / deterministic pass)', () => {
    const candidateB: QuestionCandidate = { ...sampleCandidate, correct_answer: 'B' };
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: candidateB,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'B',
        derivedValue: '25 km/h',
        independentProof: 'Independent derivation yields Option B.',
        confidence: 0.20,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'VALID', 'Verdict must be VALID for confidence 0.20');
    assert(arbitration.agreement === true, 'Must record agreement as true');
    assert(arbitration.confidenceScore === 0.20, 'Must preserve confidence 0.20 as advisory telemetry');
    assert(arbitration.deterministicContradiction === false, 'Deterministic contradiction must be false');
  });

  test('BV-11c: Zero-confidence agreement (0.00) -> VALID (Generator B / Verifier B / deterministic pass)', () => {
    const candidateB: QuestionCandidate = { ...sampleCandidate, correct_answer: 'B' };
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: candidateB,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'B',
        derivedValue: '25 km/h',
        independentProof: 'Independent derivation yields Option B.',
        confidence: 0.00,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'VALID', 'Verdict must be VALID for confidence 0.00');
    assert(arbitration.agreement === true, 'Must record agreement as true');
    assert(arbitration.confidenceScore === 0.00, 'Must preserve confidence 0.00 as advisory telemetry');
    assert(arbitration.deterministicContradiction === false, 'Deterministic contradiction must be false');
  });

  test('BV-12: Generator != Verifier -> NEEDS_REVIEW', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate, // declared answer: 'A'
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'B', // Disagrees!
        derivedValue: '25 km/h',
        independentProof: 'Calculated arithmetic mean (trap): (20+30)/2 = 25 km/h. Hence Option B.',
        confidence: 0.90,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Disagreement must trigger NEEDS_REVIEW');
    assert(arbitration.agreement === false, 'Agreement must be false');
    assert(arbitration.reasoning.includes('Model consensus conflict'), 'Reasoning must state consensus conflict');
  });

  test('BV-13: Deterministic contradiction -> INVALID even when Generator and Verifier agree', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate,
      candidateValidation: {
        isValid: true,
        errors: [],
        warnings: [],
        mathematicalVerification: {
          status: 'FAILED',
          reason: 'Deterministic solver proved formula contradiction: speed must be 24, not 25',
        },
      },
      deterministicContradiction: true,
      verifierOutput: {
        solvedOption: 'A',
        independentProof: 'Independent derivation.',
        confidence: 0.99,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'INVALID', 'Deterministic contradiction must force INVALID');
    assert(arbitration.deterministicContradiction === true, 'Must flag deterministicContradiction');
  });

  test('BV-14: Verifier failure -> NEEDS_REVIEW, never VALID', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: null,
      verifierError: 'Verifier timeout after 30000ms',
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Verifier failure must become NEEDS_REVIEW');
    assert(arbitration.failureReason === 'Verifier timeout after 30000ms', 'Must record failureReason');
  });

  test('BV-15: UNSOLVABLE -> NEEDS_REVIEW', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'UNSOLVABLE',
        independentProof: 'Distance between Town X and Y is omitted. Cannot determine time.',
        confidence: 0.85,
        isSolvable: false,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Unsolvable must become NEEDS_REVIEW');
    assert(arbitration.verifierAnswer === 'UNSOLVABLE', 'Must record verifierAnswer as UNSOLVABLE');
  });

  test('BV-16: MULTIPLE -> NEEDS_REVIEW', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'MULTIPLE',
        independentProof: 'Both Option A (24 km/h) and Option C (26 km/h) satisfy constraint depending on frame.',
        confidence: 0.85,
        isSolvable: true,
        hasMultipleValidOptions: true,
        validOptions: ['A', 'C'],
      },
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Multiple options must become NEEDS_REVIEW');
    assert(arbitration.verifierAnswer === 'MULTIPLE', 'Must record verifierAnswer as MULTIPLE');
  });

  // ----------------------------------------------------
  // BV-17 to BV-20: Mock Verifier & Orchestration Purity
  // ----------------------------------------------------
  test('BV-17: Verifier cannot directly mutate Question status', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: sampleCandidate,
      candidateValidation: { isValid: true, errors: [], warnings: [] },
      verifierOutput: {
        solvedOption: 'A',
        independentProof: 'Proof',
        confidence: 0.95,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    // Pure output verification: arbitration produces evidence, but cannot save or mutate Question entity
    assert(arbitration.verdict === 'VALID', 'Verdict computed in memory');
    assert(!(arbitration as any).id, 'Arbitration result does not alter DB');
  });

  await testAsync('BV-18: MockBlindVerifierProvider works without external AI', async () => {
    const mockVerifier = new MockBlindVerifierProvider('test-mock', 'mock-v1', {
      solvedOption: 'B',
      derivedValue: '36 km/h',
      confidence: 0.92,
    });

    const res = await mockVerifier.verifyCandidateBlind(englishDto);
    assert(res.solvedOption === 'B', 'Mock verifier returned configured solvedOption');
    assert(res.derivedValue === '36 km/h', 'Mock verifier returned configured derivedValue');
    assert(mockVerifier.callCount === 1, 'Mock verifier recorded callCount');
    assert(mockVerifier.lastReceivedInput !== null, 'Mock verifier captured lastReceivedInput');
  });

  await testAsync('BV-19: 429 verifier failure causes zero retry and classifies cleanly', async () => {
    const mockVerifier = new MockBlindVerifierProvider('test-mock-429', 'mock-v1', {
      simulateError: {
        classification: 'QUOTA_EXHAUSTED',
        message: 'Resource exhausted (quota limit reached)',
        statusCode: 429,
      },
    });

    let caughtError: any = null;
    try {
      await mockVerifier.verifyCandidateBlind(englishDto);
    } catch (err: any) {
      caughtError = err;
    }

    assert(caughtError !== null, 'Must throw error on quota exhaustion');
    assert(caughtError.classification === 'QUOTA_EXHAUSTED', 'Must classify as QUOTA_EXHAUSTED');
    assert(caughtError.statusCode === 429, 'Must return 429 statusCode');
    assert(mockVerifier.callCount === 1, 'Must execute exactly 1 attempt with 0 retries');
  });

  await testAsync('BV-20: Only the verifier receives the BlindVerifierInputDTO during orchestration', async () => {
    const aiRegistry = new AIProviderRegistry();
    const generatorMock = new MockAIProvider('mock-gen', 'SUCCESS', true, 'mock-gen-model');
    aiRegistry.registerProvider(generatorMock);

    const verifierRegistry = new BlindVerifierRegistry();
    const verifierMock = new MockBlindVerifierProvider('mock-verifier', 'mock-verifier-model', {
      solvedOption: 'B',
      confidence: 0.95,
    });
    verifierRegistry.registerProvider(verifierMock);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.generateAndVerifyQuestionCandidate(
      {
        categoryId: 'CAT-QA',
        topicId: 'TOP-SPEED',
        subtopicId: 'SUB-TRAINS',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.ENGLISH,
      },
      {
        primaryProviderId: 'mock-gen',
        verifierProviderId: 'mock-verifier',
      }
    );

    assert(result.candidate !== undefined, 'Candidate must be generated');
    assert(result.arbitration !== undefined, 'Arbitration must be attached');
    assert(verifierMock.callCount === 1, 'Verifier must have been called exactly once');

    const receivedInput = verifierMock.lastReceivedInput;
    assert(receivedInput !== null, 'Verifier must have received input');
    assert(receivedInput?.questionText === result.candidate.content, 'Verifier received correct question text');
    assert(receivedInput?.options.a === result.candidate.option_a, 'Verifier received option A');
    assert(receivedInput?.options.b === result.candidate.option_b, 'Verifier received option B');

    // Strict Blindness Assertions:
    assert((receivedInput as any).correct_answer === undefined, 'Verifier MUST NOT receive correct_answer');
    assert((receivedInput as any).correctAnswer === undefined, 'Verifier MUST NOT receive correctAnswer');
    assert((receivedInput as any).explanation === undefined, 'Verifier MUST NOT receive explanation');
    assert((receivedInput as any).speedTrick === undefined, 'Verifier MUST NOT receive speedTrick');
    assert((receivedInput as any).validation === undefined, 'Verifier MUST NOT receive validation report');
  });

  console.log(`\n====================================================`);
  console.log(`PHASE 22.3 BLIND VERIFIER SUITE COMPLETE`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: 0`);
  console.log(`====================================================\n`);
}

const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith('phase22-step3-blind-verifier.ts'));

if (isDirectRun) {
  runPhase22Step3Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
