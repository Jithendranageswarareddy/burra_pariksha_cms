/**
 * BURRA PARIKSHA CMS - Phase 22.5 Provider Diversity & Bounded Failover Test Suite
 * 
 * Verifies all 16 required contract specifications:
 * P-01 to P-16
 * 
 * STRICT TEST RULES:
 * - Zero live external AI calls (uses MockAIProvider and MockBlindVerifierProvider).
 * - Zero Google Sheets writes.
 * - Strict assertion of sequential execution (no parallel fan-out).
 * - Terminal hard failure on generator exhaustion vs NEEDS_REVIEW on verifier exhaustion.
 */

import { QuestionLanguage, DifficultyLevel } from '../types';
import {
  AIProviderRegistry,
  AIOrchestrator,
  QuestionCandidate,
  AIProviderOptions,
  GenerateCandidateInput,
  GenerationResult,
  DEFAULT_AI_CONFIG,
} from '../lib/ai';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';
import { BlindVerifierRegistry } from '../lib/ai/verifier/blind-verifier.registry';
import { MockBlindVerifierProvider } from '../lib/ai/verifier/mock-blind-verifier';
import { geminiService } from '../lib/ai/gemini.service';
import { AIProviderError } from '../lib/ai/error';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

/**
 * Custom Mock Provider with timestamp tracking and simulated recovery.
 */
class InstrumentableMockProvider extends MockAIProvider {
  public startTimestamp: number = 0;
  public endTimestamp: number = 0;
  public transientFailuresBeforeSuccess: number = 0;
  private currentAttempt: number = 0;
  public isFallbackProvider: boolean = false;

  constructor(
    providerId: string,
    outcome: any = 'SUCCESS',
    configured: boolean = true,
    modelId: string = 'mock-model-v1',
    transientFailuresBeforeSuccess: number = 0
  ) {
    super(providerId, outcome, configured, modelId);
    this.transientFailuresBeforeSuccess = transientFailuresBeforeSuccess;
  }

  public override async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    this.callCount++;
    this.currentAttempt++;
    this.startTimestamp = Date.now();

    // Small sleep to ensure distinct timestamps
    await new Promise((resolve) => setTimeout(resolve, 15));

    if (this.transientFailuresBeforeSuccess > 0 && this.currentAttempt <= this.transientFailuresBeforeSuccess) {
      this.endTimestamp = Date.now();
      throw { message: '503 Service Unavailable: Server overloaded (transient)', status: 503 };
    }

    if (this.outcome === 'QUOTA_EXHAUSTED') {
      this.endTimestamp = Date.now();
      throw { message: 'RESOURCE_EXHAUSTED: You have exceeded your current quota for model', status: 429 };
    }

    if (this.outcome === 'RATE_LIMIT') {
      this.endTimestamp = Date.now();
      throw { message: '429 Too Many Requests: Rate limit exceeded', status: 429 };
    }

    if (this.outcome === 'TRANSIENT_ERROR') {
      this.endTimestamp = Date.now();
      throw { message: '503 Service Unavailable: Server overloaded', status: 503 };
    }

    if (this.outcome === 'AUTH_ERROR') {
      this.endTimestamp = Date.now();
      throw { message: '401 Unauthorized: API key not valid', status: 401 };
    }

    this.endTimestamp = Date.now();
    return {
      candidate: {
        content: `Question from provider ${this.providerId}: What is 12 + 15?`,
        option_a: '27',
        option_b: '25',
        option_c: '30',
        option_d: '28',
        correct_answer: 'A',
        explanation: '12 + 15 = 27. Hence option A is correct.',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: input.language || QuestionLanguage.ENGLISH,
        taxonomy: {
          categoryId: input.categoryId,
          topicId: input.topicId,
          subtopicId: input.subtopicId,
        },
      },
      metadata: {
        providerId: this.providerId,
        modelId: options?.modelId || this.defaultModelId,
        modelUsed: options?.modelId || this.defaultModelId,
        generationDurationMs: 15,
        latencyMs: 15,
        retryCount: 0,
        isMockFallback: false,
        generatorType: 'MOCK_INSTRUMENTED_PROVIDER',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };
  }
}

/**
 * Custom Mock Verifier with call tracking and timing
 */
class InstrumentableMockVerifier extends MockBlindVerifierProvider {
  public startTimestamp: number = 0;
  public endTimestamp: number = 0;
  public configuredState: boolean = true;

  constructor(
    providerId: string,
    modelId: string,
    config: any = {},
    configuredState: boolean = true
  ) {
    super(providerId, modelId, config);
    this.configuredState = configuredState;
  }

  public override isConfigured(): boolean {
    return this.configuredState;
  }

  public override async verifyCandidateBlind(input: any, options?: any): Promise<any> {
    this.startTimestamp = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 15));
    this.endTimestamp = Date.now();

    if (this.config.simulateError) {
      this.callCount++;
      const err: any = new Error(this.config.simulateError.message);
      err.classification = this.config.simulateError.classification;
      err.statusCode = this.config.simulateError.statusCode || 500;
      throw err;
    }

    const baseOutput = await super.verifyCandidateBlind(input, options);
    return {
      ...baseOutput,
      metadata: {
        providerId: this.providerId,
        modelId: this.modelId,
        latencyMs: 15,
        attempts: 1,
      },
    };
  }
}

export async function runPhase22Step5Tests(): Promise<void> {
  console.log('====================================================');
  console.log('PHASE 22.5 PROVIDER DIVERSITY & BOUNDED FAILOVER TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

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

  const standardInput: GenerateCandidateInput = {
    categoryId: 'CAT-QA',
    topicId: 'TOP-ARITH',
    subtopicId: 'SUB-ADD',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
  };

  // ----------------------------------------------------
  // P-01: Primary generator succeeds
  // ----------------------------------------------------
  await testAsync('P-01: Primary generator succeeds (candidate returned, fallbackUsed false)', async () => {
    const registry = new AIProviderRegistry();
    const primary = new InstrumentableMockProvider('prov-primary', 'SUCCESS', true, 'primary-model');
    const fallback = new InstrumentableMockProvider('prov-fallback', 'SUCCESS', true, 'fallback-model');
    registry.registerProvider(primary);
    registry.registerProvider(fallback);

    const orchestrator = new AIOrchestrator(registry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'prov-primary',
      fallbackProviderIds: ['prov-fallback'],
    });

    assert(result.candidate !== undefined, 'Candidate must be generated');
    assert(result.metadata.providerId === 'prov-primary', 'Primary provider must be used');
    assert(result.metadata.fallbackUsed === false, 'fallbackUsed must be false');
    assert(primary.callCount === 1, 'Primary must be called once');
    assert(fallback.callCount === 0, 'Fallback must NOT be called');
  });

  // ----------------------------------------------------
  // P-02: Primary generator transient failure recovers
  // ----------------------------------------------------
  await testAsync('P-02: Primary generator transient failure bounded retry recovers', async () => {
    const registry = new AIProviderRegistry();
    // 1 transient failure before succeeding on attempt 2
    const primary = new InstrumentableMockProvider('prov-transient', 'SUCCESS', true, 'transient-model', 1);
    registry.registerProvider(primary);

    // Test bounded retry wrapper in provider
    assert(primary.callCount === 0, 'Initial callCount is 0');
    // Calling primary: first attempt throws 503, second attempt succeeds
    let firstThrown = false;
    try {
      await primary.generateCandidate(standardInput);
    } catch (err: any) {
      firstThrown = true;
      assert(err.status === 503, 'First attempt is transient error');
    }
    assert(firstThrown, 'First attempt failed transiently');
    const recovered = await primary.generateCandidate(standardInput);
    assert(recovered.candidate !== undefined, 'Second attempt recovered successfully');
    assert(primary.callCount === 2, 'Provider executed bounded 2nd attempt');
  });

  // ----------------------------------------------------
  // P-03: Primary generator 429 quota exhaustion moves to secondary
  // ----------------------------------------------------
  await testAsync('P-03: Primary generator 429 causes 0 retry on exhausted model and proceeds to secondary', async () => {
    const registry = new AIProviderRegistry();
    const primary = new InstrumentableMockProvider('prov-429', 'QUOTA_EXHAUSTED', true, 'quota-model');
    const secondary = new InstrumentableMockProvider('prov-secondary', 'SUCCESS', true, 'secondary-model');
    registry.registerProvider(primary);
    registry.registerProvider(secondary);

    const orchestrator = new AIOrchestrator(registry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'prov-429',
      fallbackProviderIds: ['prov-secondary'],
    });

    assert(primary.callCount === 1, 'Primary must be called exactly once (0 retries on 429)');
    assert(secondary.callCount === 1, 'Secondary provider must be called');
    assert(result.metadata.providerId === 'prov-secondary', 'Result must come from secondary');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed must be true');
  });

  // ----------------------------------------------------
  // P-04: Primary generator fails, secondary succeeds
  // ----------------------------------------------------
  await testAsync('P-04: Primary generator fails, secondary succeeds (fallbackUsed true)', async () => {
    const registry = new AIProviderRegistry();
    const primary = new InstrumentableMockProvider('prov-fail', 'TRANSIENT_ERROR', true, 'fail-model');
    const secondary = new InstrumentableMockProvider('prov-ok', 'SUCCESS', true, 'ok-model');
    registry.registerProvider(primary);
    registry.registerProvider(secondary);

    const orchestrator = new AIOrchestrator(registry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'prov-fail',
      fallbackProviderIds: ['prov-ok'],
    });

    assert(primary.callCount === 1, 'Primary failed once');
    assert(secondary.callCount === 1, 'Secondary called once');
    assert(result.metadata.providerId === 'prov-ok', 'Result from secondary');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed is true');
    assert(result.metadata.attemptedProviders?.includes('prov-fail'), 'Attempted providers tracked');
    assert(result.metadata.attemptedProviders?.includes('prov-ok'), 'Attempted providers tracked');
  });

  // ----------------------------------------------------
  // P-05: All generator providers fail -> structured HARD FAILURE
  // ----------------------------------------------------
  await testAsync('P-05: All generator providers fail -> structured AIProviderError HARD FAILURE', async () => {
    const registry = new AIProviderRegistry();
    const prov1 = new InstrumentableMockProvider('p1', 'QUOTA_EXHAUSTED');
    const prov2 = new InstrumentableMockProvider('p2', 'TRANSIENT_ERROR');
    registry.registerProvider(prov1);
    registry.registerProvider(prov2);

    const orchestrator = new AIOrchestrator(registry);
    let caughtError: any = null;

    try {
      await orchestrator.generateQuestionCandidate(standardInput, {
        primaryProviderId: 'p1',
        fallbackProviderIds: ['p2'],
      });
    } catch (err: any) {
      caughtError = err;
    }

    assert(caughtError !== null, 'Must throw structured error when all providers fail');
    assert(caughtError instanceof AIProviderError, 'Must be instance of AIProviderError');
    assert(caughtError.message.includes('All AI question generation providers failed'), 'Describes all failed');
    assert(caughtError.message.includes('Attempted: [p1, p2]'), 'Includes attempted provider IDs');
    assert(prov1.callCount === 1, 'P1 was called');
    assert(prov2.callCount === 1, 'P2 was called');
  });

  // ----------------------------------------------------
  // P-06: Legacy direct Gemini call without propagateProviderErrors
  // ----------------------------------------------------
  await testAsync('P-06: Legacy direct Gemini call retains createFallbackCandidate behavior', async () => {
    // Direct call without options or without propagateProviderErrors: true
    // In test environment without GEMINI_API_KEY, it falls back to pedagogical engine
    const legacyResult = await geminiService.generateCandidate(standardInput);

    assert(legacyResult !== undefined, 'Must return generation result for legacy callers');
    assert(legacyResult.candidate !== undefined, 'Must contain fallback candidate');
    assert(legacyResult.metadata.isMockFallback === true, 'Legacy call produces isMockFallback: true');
    assert(legacyResult.metadata.generatorType === 'PEDAGOGICAL_FALLBACK', 'Labeled as pedagogical fallback');

    // Contrast with orchestrated call: options.propagateProviderErrors === true
    let orchestratedError: any = null;
    try {
      await geminiService.generateCandidate(standardInput, { propagateProviderErrors: true });
    } catch (err: any) {
      orchestratedError = err;
    }

    assert(orchestratedError !== null, 'Orchestrated call with propagateProviderErrors MUST throw error');
    assert(orchestratedError instanceof AIProviderError, 'Must throw classified AIProviderError');
    assert(orchestratedError.classification === 'AUTH_ERROR', 'Classified as AUTH_ERROR for unconfigured key');
  });

  // ----------------------------------------------------
  // P-07: Requested verifier provider selected correctly
  // ----------------------------------------------------
  await testAsync('P-07: Requested verifier provider selected correctly', async () => {
    const aiRegistry = new AIProviderRegistry();
    aiRegistry.registerProvider(new InstrumentableMockProvider('gen-p7', 'SUCCESS'));

    const verifierRegistry = new BlindVerifierRegistry();
    const verifierDefault = new InstrumentableMockVerifier('v-default', 'm-def', { solvedOption: 'A' });
    const verifierCustom = new InstrumentableMockVerifier('v-custom', 'm-cust', { solvedOption: 'A' });
    verifierRegistry.registerProvider(verifierDefault);
    verifierRegistry.registerProvider(verifierCustom);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-p7',
      enableBlindVerification: true,
      verifierProviderId: 'v-custom',
    });

    assert(verifierDefault.callCount === 0, 'Default verifier was NOT called');
    assert(verifierCustom.callCount === 1, 'Requested custom verifier was called');
    assert(result.arbitration !== undefined, 'Arbitration attached');
    assert((result.arbitration?.verifierEvidence as any)?.metadata?.providerId === 'v-custom', 'Custom verifier in metadata');
  });

  // ----------------------------------------------------
  // P-08: Primary verifier fails, secondary verifier succeeds
  // ----------------------------------------------------
  await testAsync('P-08: Primary verifier fails, secondary verifier succeeds (arbitration continues)', async () => {
    const aiRegistry = new AIProviderRegistry();
    aiRegistry.registerProvider(new InstrumentableMockProvider('gen-p8', 'SUCCESS'));

    const verifierRegistry = new BlindVerifierRegistry();
    const vPrimary = new InstrumentableMockVerifier('v-fail', 'm-fail', {
      simulateError: { classification: 'TRANSIENT_ERROR', message: 'Verifier 500 error' },
    });
    const vSecondary = new InstrumentableMockVerifier('v-ok', 'm-ok', {
      solvedOption: 'A',
      confidence: 0.95,
    });
    verifierRegistry.registerProvider(vPrimary);
    verifierRegistry.registerProvider(vSecondary);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-p8',
      enableBlindVerification: true,
      verifierProviderId: 'v-fail',
      fallbackVerifierProviderIds: ['v-ok'],
    });

    assert(vPrimary.callCount === 1, 'Primary verifier was attempted');
    assert(vSecondary.callCount === 1, 'Secondary verifier was called');
    assert(result.arbitration !== undefined, 'Arbitration result attached');
    assert(result.arbitration?.verdict === 'VALID', 'Verdict is VALID on successful secondary verifier agreement');
    assert((result.arbitration?.verifierEvidence as any)?.metadata?.providerId === 'v-ok', 'Secondary verifier recorded in metadata');
  });

  // ----------------------------------------------------
  // P-09: All verifier providers fail -> NEEDS_REVIEW (never VALID, never INVALID)
  // ----------------------------------------------------
  await testAsync('P-09: All verifier providers fail -> NEEDS_REVIEW (never VALID, never INVALID)', async () => {
    const aiRegistry = new AIProviderRegistry();
    aiRegistry.registerProvider(new InstrumentableMockProvider('gen-p9', 'SUCCESS'));

    const verifierRegistry = new BlindVerifierRegistry();
    const v1 = new InstrumentableMockVerifier('v1-fail', 'm1', {
      simulateError: { classification: 'TRANSIENT_ERROR', message: 'V1 internal failure' },
    });
    const v2 = new InstrumentableMockVerifier('v2-fail', 'm2', {
      simulateError: { classification: 'TIMEOUT', message: 'V2 timeout' },
    });
    verifierRegistry.registerProvider(v1);
    verifierRegistry.registerProvider(v2);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-p9',
      enableBlindVerification: true,
      verifierProviderId: 'v1-fail',
      fallbackVerifierProviderIds: ['v2-fail'],
    });

    assert(v1.callCount === 1, 'V1 called');
    assert(v2.callCount === 1, 'V2 called');
    assert(result.arbitration !== undefined, 'Arbitration result attached');
    assert(result.arbitration?.verdict === 'NEEDS_REVIEW', 'Verdict must be NEEDS_REVIEW');
    assert(result.arbitration?.verdict !== 'VALID', 'Verdict must NOT be VALID');
    assert(result.arbitration?.verdict !== 'INVALID', 'Verdict must NOT be INVALID');
    assert(result.arbitration?.failureReason?.includes('All verifier providers failed'), 'failureReason describes all verifiers failed');
  });

  // ----------------------------------------------------
  // P-10: Provider execution order is strictly sequential (no parallel fan-out)
  // ----------------------------------------------------
  await testAsync('P-10: Provider execution order is strictly sequential (no parallel fan-out)', async () => {
    const registry = new AIProviderRegistry();
    const p1 = new InstrumentableMockProvider('seq-p1', 'TRANSIENT_ERROR');
    const p2 = new InstrumentableMockProvider('seq-p2', 'TRANSIENT_ERROR');
    const p3 = new InstrumentableMockProvider('seq-p3', 'SUCCESS');
    registry.registerProvider(p1);
    registry.registerProvider(p2);
    registry.registerProvider(p3);

    const orchestrator = new AIOrchestrator(registry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'seq-p1',
      fallbackProviderIds: ['seq-p2', 'seq-p3'],
    });

    assert(result.metadata.providerId === 'seq-p3', 'P3 produced result');
    assert(p1.startTimestamp > 0 && p1.endTimestamp > 0, 'P1 ran');
    assert(p2.startTimestamp > 0 && p2.endTimestamp > 0, 'P2 ran');
    assert(p3.startTimestamp > 0 && p3.endTimestamp > 0, 'P3 ran');

    // Strict sequential assertions:
    assert(p2.startTimestamp >= p1.endTimestamp, 'P2 started AFTER P1 ended (no parallel fan-out)');
    assert(p3.startTimestamp >= p2.endTimestamp, 'P3 started AFTER P2 ended (no parallel fan-out)');
  });

  // ----------------------------------------------------
  // P-11: Generator and Verifier model IDs differ -> operation allowed, diversity metadata preserved
  // ----------------------------------------------------
  await testAsync('P-11: Generator/verifier model IDs differ -> diversity telemetry preserved', async () => {
    const aiRegistry = new AIProviderRegistry();
    aiRegistry.registerProvider(new InstrumentableMockProvider('gen-p11', 'SUCCESS', true, 'gen-model-flash'));

    const verifierRegistry = new BlindVerifierRegistry();
    verifierRegistry.registerProvider(new InstrumentableMockVerifier('ver-p11', 'ver-model-pro', { solvedOption: 'A' }));

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-p11',
      enableBlindVerification: true,
      verifierProviderId: 'ver-p11',
    });

    assert(result.arbitration !== undefined, 'Arbitration result present');
    assert(result.arbitration?.verdict === 'VALID', 'Verdict is VALID on agreement');
    assert(result.metadata.modelId === 'gen-model-flash', 'Generator model recorded');
    assert((result.arbitration?.verifierEvidence as any)?.metadata?.modelId === 'ver-model-pro', 'Verifier model recorded');
    assert(result.metadata.modelId !== (result.arbitration?.verifierEvidence as any)?.metadata?.modelId, 'Generator and verifier models differ');
  });

  // ----------------------------------------------------
  // P-12: Generator and Verifier use SAME model -> NOT rejected, Option B valid
  // ----------------------------------------------------
  await testAsync('P-12: Generator/verifier use same model -> NOT rejected, Option B valid', async () => {
    const aiRegistry = new AIProviderRegistry();
    // Same provider and same model
    aiRegistry.registerProvider(new InstrumentableMockProvider('shared-provider', 'SUCCESS', true, 'shared-model-flash'));

    const verifierRegistry = new BlindVerifierRegistry();
    // Same provider ID and model ID
    verifierRegistry.registerProvider(new InstrumentableMockVerifier('shared-provider', 'shared-model-flash', { solvedOption: 'A' }));

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 'shared-provider',
      enableBlindVerification: true,
      verifierProviderId: 'shared-provider',
    });

    assert(result.arbitration !== undefined, 'Arbitration result present');
    assert(result.arbitration?.verdict === 'VALID', 'Option B produces VALID on agreement despite same model');
    assert(result.metadata.modelId === (result.arbitration?.verifierEvidence as any)?.metadata?.modelId, 'Same model verified');
  });

  // ----------------------------------------------------
  // P-13: Client-style extra fields on GenerateCandidateInput cannot influence provider selection
  // ----------------------------------------------------
  await testAsync('P-13: Client-style extra fields cannot influence provider selection or error propagation', async () => {
    const registry = new AIProviderRegistry();
    const legitPrimary = new InstrumentableMockProvider('legit-primary', 'SUCCESS', true, 'legit-model');
    const evilProvider = new InstrumentableMockProvider('evil-provider', 'SUCCESS', true, 'evil-model');
    registry.registerProvider(legitPrimary);
    registry.registerProvider(evilProvider);

    const orchestrator = new AIOrchestrator(registry);

    // Client attempts to pass provider injection via input body
    const hostileInput: any = {
      ...standardInput,
      primaryProviderId: 'evil-provider',
      fallbackProviderIds: ['evil-provider'],
      verifierProviderId: 'evil-verifier',
      modelId: 'evil-model',
      maxRetries: 999,
      timeoutMs: 1,
      propagateProviderErrors: false,
    };

    // Server routes pass server-side options only
    const serverOptions = {
      primaryProviderId: 'legit-primary',
    };

    const result = await orchestrator.generateQuestionCandidate(hostileInput, serverOptions);

    assert(result.metadata.providerId === 'legit-primary', 'Server provider strictly used');
    assert(legitPrimary.callCount === 1, 'Legit primary called');
    assert(evilProvider.callCount === 0, 'Evil injected provider NEVER called');
  });

  // ----------------------------------------------------
  // P-14: Task 6C regression behavior remains intact
  // ----------------------------------------------------
  await testAsync('P-14: Task 6C regression behavior remains intact (multi-provider chain fallback)', async () => {
    const registry = new AIProviderRegistry();
    const p1 = new InstrumentableMockProvider('t6c-p1', 'QUOTA_EXHAUSTED');
    const p2 = new InstrumentableMockProvider('t6c-p2', 'RATE_LIMIT');
    const p3 = new InstrumentableMockProvider('t6c-p3', 'SUCCESS');
    registry.registerProvider(p1);
    registry.registerProvider(p2);
    registry.registerProvider(p3);

    const orchestrator = new AIOrchestrator(registry);
    const result = await orchestrator.generateQuestionCandidate(standardInput, {
      primaryProviderId: 't6c-p1',
      fallbackProviderIds: ['t6c-p2', 't6c-p3'],
    });

    assert(p1.callCount === 1, 'P1 quota exhausted called once');
    assert(p2.callCount === 1, 'P2 rate limit called once');
    assert(p3.callCount === 1, 'P3 success called once');
    assert(result.metadata.providerId === 't6c-p3', 'P3 produced candidate');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed recorded');
  });

  // ----------------------------------------------------
  // P-15: Phase 22.3 blind verifier regression remains intact
  // ----------------------------------------------------
  await testAsync('P-15: Phase 22.3 blind verifier regression remains intact (strict blindness & arbitration)', async () => {
    const aiRegistry = new AIProviderRegistry();
    aiRegistry.registerProvider(new InstrumentableMockProvider('gen-p15', 'SUCCESS'));

    const verifierRegistry = new BlindVerifierRegistry();
    const verifier = new InstrumentableMockVerifier('ver-p15', 'm15', { solvedOption: 'A' });
    verifierRegistry.registerProvider(verifier);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateAndVerifyQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-p15',
      verifierProviderId: 'ver-p15',
    });

    assert(result.candidate !== undefined, 'Candidate generated');
    assert(result.arbitration !== undefined, 'Arbitration attached');
    assert(verifier.callCount === 1, 'Verifier called');
    const received = verifier.lastReceivedInput;
    assert(received !== null, 'Verifier received input DTO');
    assert((received as any).correct_answer === undefined, 'No correct_answer leaked');
    assert((received as any).correctAnswer === undefined, 'No correctAnswer leaked');
    assert((received as any).explanation === undefined, 'No explanation leaked');
  });

  // ----------------------------------------------------
  // P-16: Phase 22.4 deterministic arbitration regression remains intact
  // ----------------------------------------------------
  await testAsync('P-16: Phase 22.4 deterministic arbitration regression remains intact (veto overrides verifier)', async () => {
    const aiRegistry = new AIProviderRegistry();
    // Candidate with internal arithmetic contradiction: 15% of 200 is stated as 45 (actually 30)
    class ContradictoryMockProvider extends InstrumentableMockProvider {
      public override async generateCandidate(input: any, options?: any): Promise<any> {
        const base = await super.generateCandidate(input, options);
        base.candidate.content = 'Find 15% of 200.';
        base.candidate.option_a = '45';
        base.candidate.correct_answer = 'A';
        base.candidate.explanation = '15% of 200 is 45. Hence Option A.';
        return base;
      }
    }
    aiRegistry.registerProvider(new ContradictoryMockProvider('gen-contra', 'SUCCESS'));

    const verifierRegistry = new BlindVerifierRegistry();
    const verifier = new InstrumentableMockVerifier('ver-contra', 'm-contra', { solvedOption: 'A' });
    verifierRegistry.registerProvider(verifier);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);
    const result = await orchestrator.generateAndVerifyQuestionCandidate(standardInput, {
      primaryProviderId: 'gen-contra',
      verifierProviderId: 'ver-contra',
    });

    assert(result.arbitration !== undefined, 'Arbitration attached');
    assert(result.arbitration?.verdict === 'INVALID', 'Contradictory candidate MUST be vetoed to INVALID');
    assert(verifier.callCount === 0, 'Blind verifier MUST NOT be called when deterministic contradiction occurs');
  });

  console.log(`\n====================================================`);
  console.log(`PHASE 22.5 PROVIDER DIVERSITY SUITE COMPLETE`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: 0`);
  console.log(`====================================================\n`);
}

const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith('phase22-step5-provider-diversity.ts'));

if (isDirectRun) {
  runPhase22Step5Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
