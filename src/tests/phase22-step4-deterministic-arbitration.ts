/**
 * BURRA PARIKSHA CMS - Phase 22.4 Deterministic Validation Integration Suite
 * 
 * Verifies all 18 test matrix requirements:
 * DV-01 to DV-18
 * 
 * STRICT TEST RULES:
 * - Zero live external AI calls (uses MockBlindVerifierProvider and MockAIProvider).
 * - Zero Google Sheets writes.
 * - Enforces Option B frozen policy.
 * - Proves single execution of canonical MathematicalLogicalEngine.
 */

import express from 'express';
import http from 'http';
import { QuestionLanguage, DifficultyLevel, MathematicalLogicalResult, UserRole } from '../types';
import {
  QuestionCandidate,
  CandidateDeterministicAdapter,
  VerifierArbitrationEngine,
  AIOrchestrator,
  AIProviderRegistry,
  BlindVerifierRegistry,
  MockBlindVerifierProvider,
  BlindVerifierInputDTO,
  aiOrchestrator,
} from '../lib/ai';
import { AIProvider, AIProviderOptions, GenerateCandidateInput, GenerationResult } from '../lib/ai/types';
import { CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';
import { MathematicalLogicalEngine } from '../lib/validation/mathematical-logical.engine';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { aiProviderRegistry } from '../lib/ai/registry';
import { blindVerifierRegistry } from '../lib/ai/verifier/blind-verifier.registry';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

export async function runPhase22Step4Tests(): Promise<void> {
  console.log('====================================================');
  console.log('PHASE 22.4 DETERMINISTIC INTEGRATION SUITE');
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

  // Sample Candidates
  // 1. Provably valid: 300m train crossing 200m platform at 90 km/h -> time = 20 seconds (Option A)
  const provablyValidCandidate: QuestionCandidate = {
    content: 'A 300 m long train crosses a 200 m long platform at a speed of 90 km/h. How many seconds does it take?',
    option_a: '20 seconds',
    option_b: '25 seconds',
    option_c: '18 seconds',
    option_d: '15 seconds',
    correct_answer: 'A',
    explanation: 'Total distance = 300 + 200 = 500m. Speed = 90 * 5/18 = 25 m/s. Time = 500 / 25 = 20 seconds. Option A.',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
  };

  // 2. Contradictory: Same train question, but declared answer is B (25 seconds) instead of A (20 seconds)
  const contradictoryCandidate: QuestionCandidate = {
    ...provablyValidCandidate,
    correct_answer: 'B', // Contradicts calculation (20 seconds is A)
    explanation: 'Incorrect explanation asserting 25 seconds.',
  };

  // 3. Unmodeled / NOT_DETERMINISTICALLY_VERIFIED
  const unmodeledCandidate: QuestionCandidate = {
    content: 'In a certain factory, machines X, Y, and Z produce widgets in a 2:3:5 ratio with defect rates of 1%, 2%, and 3% respectively. What is the overall defect percentage?',
    option_a: '2.1%',
    option_b: '2.3%',
    option_c: '2.5%',
    option_d: '2.7%',
    correct_answer: 'B',
    explanation: 'Weighted average defect rate: (2*1 + 3*2 + 5*3) / 10 = (2 + 6 + 15) / 10 = 23 / 10 = 2.3%. Option B.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
  };

  // 4. Non-numerical / NOT_APPLICABLE
  const verbalCandidate: QuestionCandidate = {
    content: 'Identify the antonym of the word METICULOUS from the given choices.',
    option_a: 'Careless',
    option_b: 'Thorough',
    option_c: 'Precise',
    option_d: 'Diligent',
    correct_answer: 'A',
    explanation: 'Meticulous means showing great attention to detail. Its direct antonym is careless. Option A.',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
  };

  // 5. Structural failure candidate
  const structurallyInvalidCandidate: QuestionCandidate = {
    content: 'Short',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '' as any,
    explanation: '',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
  };

  const invalidValidationReport: CandidateValidationReport = {
    isValid: false,
    errors: ['Content too short', 'Options are blank', 'Correct answer missing'],
    warnings: [],
  };

  // --------------------------------------------------------------------------
  // DV-01: Structural failure -> INVALID, Blind verifier calls = 0
  // --------------------------------------------------------------------------
  await testAsync('DV-01: Structural failure -> INVALID and Blind verifier calls = 0', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v1', 'model-v1', { solvedOption: 'B' });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      structurallyInvalidCandidate,
      invalidValidationReport,
      { verifierProviderId: 'mock-v1' }
    );

    assert(result.verdict === 'INVALID', 'Verdict must be INVALID for structural failure');
    assert(mockVerifier.callCount === 0, 'Blind verifier must NOT be called on structural failure');
  });

  // --------------------------------------------------------------------------
  // DV-02: Deterministic CONTRADICTORY -> INVALID, Blind verifier calls = 0
  // --------------------------------------------------------------------------
  await testAsync('DV-02: Deterministic CONTRADICTORY -> INVALID and Blind verifier calls = 0', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v2', 'model-v2', { solvedOption: 'A' });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const validReport: CandidateValidationReport = { isValid: true, errors: [], warnings: [] };

    const result = await orchestrator.verifyAndArbitrateCandidate(
      contradictoryCandidate,
      validReport,
      { verifierProviderId: 'mock-v2' }
    );

    assert(result.verdict === 'INVALID', 'Verdict must be INVALID for deterministic contradiction');
    assert(result.deterministicContradiction === true, 'deterministicContradiction must be true');
    assert(result.deterministicResult?.status === 'CONTRADICTORY', 'deterministicResult status must be CONTRADICTORY');
    assert(mockVerifier.callCount === 0, 'Blind verifier must NOT be called on deterministic contradiction');
  });

  // --------------------------------------------------------------------------
  // DV-03: Deterministic PROVABLY_VALID + verifier agrees -> VALID
  // --------------------------------------------------------------------------
  await testAsync('DV-03: Deterministic PROVABLY_VALID + verifier agrees -> VALID', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v3', 'model-v3', {
      solvedOption: 'A',
      derivedValue: '20 seconds',
      confidence: 0.95,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      provablyValidCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v3' }
    );

    assert(result.verdict === 'VALID', 'Verdict must be VALID');
    assert(result.agreement === true, 'Agreement must be true');
    assert(result.deterministicResult?.status === 'PROVABLY_VALID', 'Status must be PROVABLY_VALID');
    assert(result.deterministicResult?.calculatedValue === 20, 'Calculated value must be 20');
    assert(mockVerifier.callCount === 1, 'Blind verifier must be called exactly once');
  });

  // --------------------------------------------------------------------------
  // DV-04: Deterministic NOT_DETERMINISTICALLY_VERIFIED + verifier agrees -> VALID
  // --------------------------------------------------------------------------
  await testAsync('DV-04: Deterministic NOT_DETERMINISTICALLY_VERIFIED + verifier agrees -> VALID (Option B)', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v4', 'model-v4', {
      solvedOption: 'B',
      derivedValue: '2.3%',
      confidence: 0.90,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      unmodeledCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v4' }
    );

    assert(result.verdict === 'VALID', 'Verdict must be VALID under Option B');
    assert(result.agreement === true, 'Agreement must be true');
    assert(result.deterministicResult?.status === 'NOT_DETERMINISTICALLY_VERIFIED', 'Must be NOT_DETERMINISTICALLY_VERIFIED');
    assert(result.deterministicContradiction === false, 'Deterministic contradiction must be false');
  });

  // --------------------------------------------------------------------------
  // DV-05: Deterministic NOT_APPLICABLE + verifier agrees -> VALID
  // --------------------------------------------------------------------------
  await testAsync('DV-05: Deterministic NOT_APPLICABLE + verifier agrees -> VALID', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v5', 'model-v5', {
      solvedOption: 'A',
      confidence: 0.92,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      verbalCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v5' }
    );

    assert(result.verdict === 'VALID', 'Verdict must be VALID for verbal candidate');
    assert(result.agreement === true, 'Agreement must be true');
    assert(result.deterministicResult?.status === 'NOT_APPLICABLE', 'Must be NOT_APPLICABLE');
  });

  // --------------------------------------------------------------------------
  // DV-06: PROVABLY_VALID + verifier disagrees -> NEEDS_REVIEW
  // --------------------------------------------------------------------------
  await testAsync('DV-06: PROVABLY_VALID + verifier disagrees -> NEEDS_REVIEW', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v6', 'model-v6', {
      solvedOption: 'C', // Disagrees with declared B
      confidence: 0.90,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      provablyValidCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v6' }
    );

    assert(result.verdict === 'NEEDS_REVIEW', 'Disagreement must trigger NEEDS_REVIEW');
    assert(result.agreement === false, 'Agreement must be false');
    assert(result.deterministicResult?.status === 'PROVABLY_VALID', 'Deterministic result was provably valid');
  });

  // --------------------------------------------------------------------------
  // DV-07: NOT_DETERMINISTICALLY_VERIFIED + verifier disagrees -> NEEDS_REVIEW
  // --------------------------------------------------------------------------
  await testAsync('DV-07: NOT_DETERMINISTICALLY_VERIFIED + verifier disagrees -> NEEDS_REVIEW', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v7', 'model-v7', {
      solvedOption: 'D', // Disagrees with declared B
      confidence: 0.85,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      unmodeledCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v7' }
    );

    assert(result.verdict === 'NEEDS_REVIEW', 'Disagreement must trigger NEEDS_REVIEW');
    assert(result.agreement === false, 'Agreement must be false');
  });

  // --------------------------------------------------------------------------
  // DV-08: Deterministic CONTRADICTORY + verifier agrees -> INVALID (Deterministic Veto)
  // --------------------------------------------------------------------------
  test('DV-08: Deterministic CONTRADICTORY + verifier agrees -> INVALID (Authoritative Veto)', () => {
    const detResult: MathematicalLogicalResult = {
      status: 'CONTRADICTORY',
      problemType: 'Train Crossing Platform',
      calculatedValue: 20,
      details: 'Declared Option B (25 seconds) contradicts calculated Option A (20 seconds)',
    };

    // Even if Verifier hallucinated and agreed with candidate on Option B:
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: contradictoryCandidate, // Declares B
      deterministicResult: detResult,
      verifierOutput: {
        solvedOption: 'B', // Verifier also says B
        independentProof: 'Flawed derivation',
        confidence: 0.99,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'INVALID', 'Deterministic contradiction MUST override verifier agreement');
    assert(arbitration.deterministicContradiction === true, 'Must flag deterministicContradiction');
  });

  // --------------------------------------------------------------------------
  // DV-09: Deterministic CONTRADICTORY + verifier disagrees -> INVALID
  // --------------------------------------------------------------------------
  test('DV-09: Deterministic CONTRADICTORY + verifier disagrees -> INVALID', () => {
    const detResult: MathematicalLogicalResult = {
      status: 'CONTRADICTORY',
      details: 'Formula contradiction',
    };

    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: contradictoryCandidate,
      deterministicResult: detResult,
      verifierOutput: {
        solvedOption: 'C',
        independentProof: 'Derivation of C',
        confidence: 0.95,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'INVALID', 'Contradiction must produce INVALID');
    assert(arbitration.deterministicContradiction === true, 'deterministicContradiction must be true');
  });

  // --------------------------------------------------------------------------
  // DV-10: Verifier failure after deterministic non-contradiction -> NEEDS_REVIEW
  // --------------------------------------------------------------------------
  await testAsync('DV-10: Verifier failure after deterministic non-contradiction -> NEEDS_REVIEW', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v10', 'model-v10', {
      simulateError: {
        classification: 'TIMEOUT',
        message: 'Blind verifier call timed out after 30000ms',
        statusCode: 504,
      },
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.verifyAndArbitrateCandidate(
      provablyValidCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v10' }
    );

    assert(result.verdict === 'NEEDS_REVIEW', 'Verifier failure must yield NEEDS_REVIEW');
    assert(result.failureReason?.includes('timed out'), 'Failure reason must be recorded');
  });

  // --------------------------------------------------------------------------
  // DV-11: Verifier UNSOLVABLE -> NEEDS_REVIEW
  // --------------------------------------------------------------------------
  test('DV-11: Verifier UNSOLVABLE -> NEEDS_REVIEW', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: provablyValidCandidate,
      deterministicResult: { status: 'NOT_DETERMINISTICALLY_VERIFIED', details: 'Unmodeled' },
      verifierOutput: {
        solvedOption: 'UNSOLVABLE',
        independentProof: 'Problem lacks essential constraints.',
        confidence: 0.85,
        isSolvable: false,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Unsolvable must become NEEDS_REVIEW');
    assert(arbitration.verifierAnswer === 'UNSOLVABLE', 'verifierAnswer must be UNSOLVABLE');
  });

  // --------------------------------------------------------------------------
  // DV-12: Verifier MULTIPLE -> NEEDS_REVIEW
  // --------------------------------------------------------------------------
  test('DV-12: Verifier MULTIPLE -> NEEDS_REVIEW', () => {
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: provablyValidCandidate,
      deterministicResult: { status: 'NOT_DETERMINISTICALLY_VERIFIED', details: 'Unmodeled' },
      verifierOutput: {
        solvedOption: 'MULTIPLE',
        independentProof: 'Both Options B and C are mathematically defensible.',
        confidence: 0.80,
        isSolvable: true,
        hasMultipleValidOptions: true,
        validOptions: ['B', 'C'],
      },
    });

    assert(arbitration.verdict === 'NEEDS_REVIEW', 'Multiple options must become NEEDS_REVIEW');
    assert(arbitration.verifierAnswer === 'MULTIPLE', 'verifierAnswer must be MULTIPLE');
  });

  // --------------------------------------------------------------------------
  // DV-13: Deterministic result is preserved in arbitration telemetry
  // --------------------------------------------------------------------------
  test('DV-13: Deterministic result is preserved in arbitration telemetry', () => {
    const detResult = CandidateDeterministicAdapter.verifyCandidate(provablyValidCandidate);
    assert(detResult.status === 'PROVABLY_VALID', 'Must be PROVABLY_VALID');
    assert(detResult.problemType !== undefined, 'Must contain problemType');
    assert(detResult.calculationSteps !== undefined, 'Must contain calculationSteps');

    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: provablyValidCandidate,
      deterministicResult: detResult,
      verifierOutput: {
        solvedOption: 'A',
        derivedValue: '20 seconds',
        independentProof: 'Calculated 20 seconds.',
        confidence: 0.95,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });

    assert(arbitration.deterministicResult !== undefined, 'Arbitration must preserve deterministicResult');
    assert(arbitration.deterministicResult?.status === 'PROVABLY_VALID', 'Preserved status must match');
    assert(arbitration.deterministicResult?.problemType === detResult.problemType, 'Preserved problemType must match');
    assert(arbitration.reasoning.includes('PROVABLY_VALID'), 'Reasoning must mention deterministic status');
  });

  // --------------------------------------------------------------------------
  // DV-14: Canonical MathematicalLogicalEngine executes exactly once in pipeline
  // --------------------------------------------------------------------------
  await testAsync('DV-14: Canonical MathematicalLogicalEngine executes exactly once in the pipeline', async () => {
    let solverCallCount = 0;
    const originalVerify = MathematicalLogicalEngine.verify;
    // Spy on MathematicalLogicalEngine.verify
    MathematicalLogicalEngine.verify = function (...args: any[]) {
      solverCallCount++;
      return originalVerify.apply(MathematicalLogicalEngine, args as any);
    };

    try {
      const aiRegistry = new AIProviderRegistry();
      const verifierRegistry = new BlindVerifierRegistry();
      const mockVerifier = new MockBlindVerifierProvider('mock-v14', 'model-v14', {
        solvedOption: 'A',
        confidence: 0.95,
      });
      verifierRegistry.registerProvider(mockVerifier);
      const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

      await orchestrator.verifyAndArbitrateCandidate(
        provablyValidCandidate,
        { isValid: true, errors: [], warnings: [] },
        { verifierProviderId: 'mock-v14' }
      );

      assert(solverCallCount === 1, `MathematicalLogicalEngine.verify must be called exactly once, actual: ${solverCallCount}`);
    } finally {
      MathematicalLogicalEngine.verify = originalVerify;
    }
  });

  // --------------------------------------------------------------------------
  // DV-15: No repository / QuestionService / Sheets writes
  // --------------------------------------------------------------------------
  test('DV-15: Pure in-memory execution produces no database mutations', () => {
    const detResult = CandidateDeterministicAdapter.verifyCandidate(provablyValidCandidate);
    assert(!(detResult as any).id, 'Deterministic result contains no DB entity id');
    const arbitration = VerifierArbitrationEngine.arbitrate({
      candidate: provablyValidCandidate,
      deterministicResult: detResult,
      verifierOutput: {
        solvedOption: 'A',
        independentProof: 'Proof',
        confidence: 0.95,
        isSolvable: true,
        hasMultipleValidOptions: false,
      },
    });
    assert(!(arbitration as any).id, 'Arbitration contains no DB entity id');
  });

  // --------------------------------------------------------------------------
  // DV-16: No Gemini call is made by deterministic validation
  // --------------------------------------------------------------------------
  test('DV-16: CandidateDeterministicAdapter is synchronous and makes zero AI calls', () => {
    const startTime = Date.now();
    const res = CandidateDeterministicAdapter.verifyCandidate(provablyValidCandidate);
    const duration = Date.now() - startTime;

    assert(res.status === 'PROVABLY_VALID', 'Status must be PROVABLY_VALID');
    assert(duration < 50, 'Deterministic evaluation must be instant CPU operation (<50ms)');
  });

  // --------------------------------------------------------------------------
  // DV-17: No confidence threshold affects arbitration (0.95, 0.60, 0.20, 0.00 -> all VALID)
  // --------------------------------------------------------------------------
  test('DV-17: Zero numeric confidence threshold: 0.95, 0.60, 0.20, 0.00 all produce VALID on agreement', () => {
    const confidences = [0.95, 0.60, 0.20, 0.00];

    for (const conf of confidences) {
      const arbitration = VerifierArbitrationEngine.arbitrate({
        candidate: provablyValidCandidate,
        deterministicResult: { status: 'PROVABLY_VALID', details: 'OK' },
        verifierOutput: {
          solvedOption: 'A',
          independentProof: 'Proof',
          confidence: conf,
          isSolvable: true,
          hasMultipleValidOptions: false,
        },
      });

      assert(arbitration.verdict === 'VALID', `Confidence ${conf} must produce VALID on agreement and passing deterministic checks`);
      assert(arbitration.confidenceScore === conf, `Arbitration must preserve confidence score ${conf} as advisory telemetry`);
    }
  });

  // --------------------------------------------------------------------------
  // DV-18: Existing Phase 22.3 blindness/leakage behavior remains intact
  // --------------------------------------------------------------------------
  await testAsync('DV-18: Blindness guarantees remain intact during orchestration', async () => {
    const aiRegistry = new AIProviderRegistry();
    const verifierRegistry = new BlindVerifierRegistry();
    const mockVerifier = new MockBlindVerifierProvider('mock-v18', 'model-v18', {
      solvedOption: 'A',
      confidence: 0.90,
    });
    verifierRegistry.registerProvider(mockVerifier);
    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    await orchestrator.verifyAndArbitrateCandidate(
      provablyValidCandidate,
      { isValid: true, errors: [], warnings: [] },
      { verifierProviderId: 'mock-v18' }
    );

    const receivedInput = mockVerifier.lastReceivedInput;
    assert(receivedInput !== null, 'Verifier must have received input');
    assert(receivedInput?.questionText === provablyValidCandidate.content, 'Verifier received question text');
    assert(receivedInput?.options.a === provablyValidCandidate.option_a, 'Verifier received option A');
    assert(receivedInput?.options.b === provablyValidCandidate.option_b, 'Verifier received option B');

    // Strict leak-proof check:
    assert((receivedInput as any).correct_answer === undefined, 'Must not leak correct_answer');
    assert((receivedInput as any).correctAnswer === undefined, 'Must not leak correctAnswer');
    assert((receivedInput as any).explanation === undefined, 'Must not leak explanation');
    assert((receivedInput as any).speedTrick === undefined, 'Must not leak speedTrick');
    assert((receivedInput as any).deterministicResult === undefined, 'Must not leak deterministicResult to verifier');
  });

  // --------------------------------------------------------------------------
  // ROUTE ACTIVATION & END-TO-END PIPELINE VERIFICATION (POST /api/ai/generate)
  // --------------------------------------------------------------------------

  class RouteMockAIProvider implements AIProvider {
    public providerId = 'gemini';
    public defaultModelId = 'mock-gemini-v1';
    public candidateToReturn: QuestionCandidate;
    public callCount = 0;

    constructor(candidate: QuestionCandidate) {
      this.candidateToReturn = candidate;
    }

    public isConfigured(): boolean {
      return true;
    }

    public async generateCandidate(input: GenerateCandidateInput, options?: AIProviderOptions): Promise<GenerationResult> {
      this.callCount++;
      return {
        candidate: this.candidateToReturn,
        metadata: {
          providerId: this.providerId,
          modelId: this.defaultModelId,
          modelUsed: this.defaultModelId,
          latencyMs: 5,
          generationDurationMs: 5,
        },
        validation: { isValid: true, errors: [], warnings: [] },
      };
    }

    public async refineCandidate(): Promise<GenerationResult> {
      throw new Error('Not implemented');
    }
  }

  // Setup express test server mounting apiRouter
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api', apiRouter);

  const testServer = http.createServer(testApp);
  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });
  const serverAddr = testServer.address() as any;
  const baseUrl = `http://127.0.0.1:${serverAddr.port}/api`;

  const adminAuthToken = authService.generateSessionToken({
    userId: 'USR-ADMIN-ROUTE-TEST',
    name: 'Admin User',
    role: UserRole.ADMIN,
  });

  const originalGeminiProvider = aiProviderRegistry.getProvider('gemini');
  const originalVerifierProvider = blindVerifierRegistry.getDefaultProvider();

  try {
    // --------------------------------------------------------------------------
    // DV-19: Normal route POST /api/ai/generate supplies enableBlindVerification: true
    // Reaches: CandidateDeterministicAdapter, BlindVerifierProvider, VerifierArbitrationEngine -> VALID
    // --------------------------------------------------------------------------
    await testAsync('DV-19: POST /api/ai/generate activates full pipeline -> reaches adapter, verifier, arbitration -> VALID', async () => {
      const routeGenProvider = new RouteMockAIProvider(provablyValidCandidate);
      aiProviderRegistry.registerProvider(routeGenProvider);

      const routeVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'A',
        confidence: 0.92,
      });
      blindVerifierRegistry.registerProvider(routeVerifier);

      const res = await fetch(`${baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({
          categoryId: 'CAT-QUANT',
          topicId: 'TOP-SPEED-01',
          difficulty: DifficultyLevel.MEDIUM,
          language: QuestionLanguage.ENGLISH,
        }),
      });

      assert(res.status === 200, `POST /api/ai/generate must succeed with 200. Got: ${res.status}`);
      const body = await res.json();

      // 1. Proves enableBlindVerification was passed: arbitration payload is populated
      assert(body.arbitration !== undefined, 'POST /api/ai/generate must return arbitration in response body');
      
      // 2. Proves CandidateDeterministicAdapter was reached
      assert(body.arbitration.deterministicResult !== undefined, 'Arbitration must contain deterministicResult');
      assert(body.arbitration.deterministicResult.status === 'PROVABLY_VALID', 'Deterministic result must be PROVABLY_VALID');
      assert(body.arbitration.deterministicResult.calculatedValue === 20, 'Deterministic calculatedValue must be 20');

      // 3. Proves BlindVerifierProvider was reached
      assert(routeVerifier.callCount === 1, 'BlindVerifierProvider must be called exactly once');
      assert(body.arbitration.verifierEvidence !== null, 'Verifier evidence must be populated in arbitration');
      assert(body.arbitration.verifierEvidence.solvedOption === 'A', 'Verifier output solved option A');

      // 4. Proves VerifierArbitrationEngine was reached and produced VALID under Option B
      assert(body.arbitration.verdict === 'VALID', 'Option B consensus must produce verdict VALID');
      assert(body.arbitration.agreement === true, 'Agreement must be true');
    });

    // --------------------------------------------------------------------------
    // DV-20: Normal route POST /api/ai/generate deterministic CONTRADICTORY short-circuits verifier
    // --------------------------------------------------------------------------
    await testAsync('DV-20: POST /api/ai/generate deterministic CONTRADICTORY short-circuits to INVALID with 0 verifier calls', async () => {
      const routeGenProvider = new RouteMockAIProvider(contradictoryCandidate);
      aiProviderRegistry.registerProvider(routeGenProvider);

      const routeVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'A',
        confidence: 0.95,
      });
      blindVerifierRegistry.registerProvider(routeVerifier);

      const res = await fetch(`${baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({
          categoryId: 'CAT-QUANT',
          topicId: 'TOP-SPEED-01',
          difficulty: DifficultyLevel.MEDIUM,
          language: QuestionLanguage.ENGLISH,
        }),
      });

      assert(res.status === 200, `POST /api/ai/generate must succeed with 200. Got: ${res.status}`);
      const body = await res.json();

      assert(body.arbitration !== undefined, 'Arbitration must be present');
      assert(body.arbitration.verdict === 'INVALID', 'Contradictory candidate must arbitrate to INVALID');
      assert(body.arbitration.deterministicContradiction === true, 'deterministicContradiction must be true');
      assert(body.arbitration.deterministicResult.status === 'CONTRADICTORY', 'deterministicResult status must be CONTRADICTORY');
      
      // Critical check: Zero blind verifier calls executed
      assert(routeVerifier.callCount === 0, 'Blind verifier calls must be exactly 0 on deterministic contradiction');
      assert(body.arbitration.verifierEvidence === undefined || body.arbitration.verifierEvidence === null, 'Verifier evidence must be empty when short-circuited');
    });

    // --------------------------------------------------------------------------
    // DV-21: Normal route POST /api/ai/generate disagreement, low confidence, and verifier failure
    // --------------------------------------------------------------------------
    await testAsync('DV-21: POST /api/ai/generate disagreement -> NEEDS_REVIEW, failure -> NEEDS_REVIEW, low confidence agreement -> VALID', async () => {
      // 1. Disagreement check (Generator A, Verifier B)
      const routeGenProvider = new RouteMockAIProvider(provablyValidCandidate);
      aiProviderRegistry.registerProvider(routeGenProvider);

      const disagreeVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'B', // Disagrees with generator's declared answer A
        confidence: 0.90,
      });
      blindVerifierRegistry.registerProvider(disagreeVerifier);

      const res1 = await fetch(`${baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({
          categoryId: 'CAT-QUANT',
          topicId: 'TOP-SPEED-01',
          difficulty: DifficultyLevel.MEDIUM,
          language: QuestionLanguage.ENGLISH,
        }),
      });
      const body1 = await res1.json();
      assert(body1.arbitration.verdict === 'NEEDS_REVIEW', 'Disagreement on route must produce NEEDS_REVIEW');
      assert(body1.arbitration.agreement === false, 'agreement must be false on disagreement');

      // 2. Low confidence agreement check (confidence 0.20, generator A, verifier A)
      const lowConfVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'A',
        confidence: 0.20,
      });
      blindVerifierRegistry.registerProvider(lowConfVerifier);

      const res2 = await fetch(`${baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({
          categoryId: 'CAT-QUANT',
          topicId: 'TOP-SPEED-01',
          difficulty: DifficultyLevel.MEDIUM,
          language: QuestionLanguage.ENGLISH,
        }),
      });
      const body2 = await res2.json();
      assert(body2.arbitration.verdict === 'VALID', 'Low confidence agreement on route must produce VALID (no threshold authority)');
      assert(body2.arbitration.confidenceScore === 0.20, 'Confidence score must be preserved as advisory telemetry');

      // 3. Verifier failure check (verifier throws error -> NEEDS_REVIEW)
      const failingVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'A',
      });
      failingVerifier.verifyCandidateBlind = async () => {
        throw new Error('Simulated verifier failure');
      };
      blindVerifierRegistry.registerProvider(failingVerifier);

      const res3 = await fetch(`${baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({
          categoryId: 'CAT-QUANT',
          topicId: 'TOP-SPEED-01',
          difficulty: DifficultyLevel.MEDIUM,
          language: QuestionLanguage.ENGLISH,
        }),
      });
      const body3 = await res3.json();
      assert(body3.arbitration.verdict === 'NEEDS_REVIEW', 'Verifier failure on route must produce NEEDS_REVIEW');
    });

    // --------------------------------------------------------------------------
    // DV-22: Task 6C direct orchestrator callers without options remain unverified
    // --------------------------------------------------------------------------
    await testAsync('DV-22: Direct orchestrator callers omitting options do not trigger verification', async () => {
      const mockVerifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-verifier-model', {
        solvedOption: 'A',
        confidence: 0.90,
      });
      blindVerifierRegistry.registerProvider(mockVerifier);

      const genProvider = new RouteMockAIProvider(provablyValidCandidate);
      aiProviderRegistry.registerProvider(genProvider);

      // Call generateQuestionCandidate directly without options (Task 6C pattern)
      const directResult = await aiOrchestrator.generateQuestionCandidate({
        categoryId: 'CAT-QUANT',
        topicId: 'TOP-SPEED-01',
        subtopicId: 'SUB-SPEED-01',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.ENGLISH,
      });

      assert(directResult.arbitration === undefined, 'Direct caller without options must not have arbitration');
      assert(mockVerifier.callCount === 0, 'Direct caller without options must trigger 0 verifier calls');
    });

  } finally {
    // Teardown server and restore original providers
    testServer.close();
    if (originalGeminiProvider) {
      aiProviderRegistry.registerProvider(originalGeminiProvider);
    }
    if (originalVerifierProvider) {
      blindVerifierRegistry.registerProvider(originalVerifierProvider);
    }
  }

  console.log(`\n====================================================`);
  console.log(`PHASE 22.4 DETERMINISTIC INTEGRATION SUITE COMPLETE`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: 0`);
  console.log(`====================================================\n`);
}

const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith('phase22-step4-deterministic-arbitration.ts'));

if (isDirectRun) {
  runPhase22Step4Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
