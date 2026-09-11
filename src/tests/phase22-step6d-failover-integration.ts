/**
 * BURRA PARIKSHA CMS - Phase 22.6D Step 4A
 * Mocked Gemini -> Groq Failover Integration & Configuration Test Suite
 * 
 * STRICT ₹0 / ZERO NETWORK CALLS:
 * - Uses mock client for Groq and instrumented mock for Gemini.
 * - Zero external API calls (Groq: 0, Gemini: 0, xAI: 0, Google Sheets: 0).
 * - Zero persistence operations.
 * - Zero production environment mutations.
 */

import {
  AIProviderRegistry,
  AIOrchestrator,
  DEFAULT_AI_CONFIG,
  parseProviderList,
  AIProviderOptions,
  GenerateCandidateInput,
  GenerationResult,
} from '../lib/ai';
import { AIProviderError } from '../lib/ai/error';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';
import { GroqClient } from '../lib/ai/providers/groq.client';
import { GroqService } from '../lib/ai/providers/groq.service';
import { BlindVerifierRegistry } from '../lib/ai/verifier/blind-verifier.registry';
import { MockBlindVerifierProvider } from '../lib/ai/verifier/mock-blind-verifier';
import { DifficultyLevel, QuestionLanguage } from '../types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

const sampleInput: GenerateCandidateInput = {
  categoryId: 'cat-quant',
  categoryName: 'Quantitative Aptitude',
  topicId: 'topic-percentages',
  topicName: 'Percentages',
  subtopicId: 'sub-basic-percentages',
  subtopicName: 'Basic Percentage Calculation',
  difficulty: DifficultyLevel.EASY,
  language: QuestionLanguage.ENGLISH,
  questionStyle: 'Real-World Scenario',
  realWorldContext: 'Retail shopping discount',
};

const validMockGroqCompletionResponse = {
  id: 'chatcmpl-mock-groq-step4a',
  object: 'chat.completion',
  created: 1756316000,
  model: 'openai/gpt-oss-120b',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          content: 'A jacket marked at Rs 2,000 is offered at a 20% discount. What is the final selling price?',
          option_a: 'Rs 1,600',
          option_b: 'Rs 1,500',
          option_c: 'Rs 1,700',
          option_d: 'Rs 1,800',
          correct_answer: 'A',
          explanation: 'Discount = 20% of 2000 = 400. Final price = 2000 - 400 = Rs 1,600. Burra Trick: 80% of 2000 = 0.8 * 2000 = 1600.',
          difficulty: 'EASY',
          language: 'ENGLISH',
          real_world_context: 'Retail shopping discount',
          question_style: 'Real-World Scenario',
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 300,
    completion_tokens: 150,
    total_tokens: 450,
  },
};

export async function runStep4aFailoverSuite(): Promise<{ total: number; passed: number }> {
  console.log('===============================================================');
  console.log('PHASE 22.6D — STEP 4A: GEMINI -> GROQ FAILOVER INTEGRATION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  // =========================================================================
  // SECTION A: CONFIGURATION & CHAIN RESOLUTION TESTS (CONF-01 to CONF-04)
  // =========================================================================

  // CONF-01: parseProviderList parses 'groq' correctly
  total++;
  console.log('CONF-01: Verifying parseProviderList("groq") resolution...');
  {
    const parsed = parseProviderList('groq');
    assert(Array.isArray(parsed), 'Parsed result must be an array');
    assert(parsed.length === 1 && parsed[0] === 'groq', 'parseProviderList("groq") must yield ["groq"]');

    const multiParsed = parseProviderList('  gemini , GROQ , gemini,  xai ');
    assert(
      JSON.stringify(multiParsed) === JSON.stringify(['gemini', 'groq', 'xai']),
      'parseProviderList must trim, normalize lowercase, and deduplicate'
    );

    passed++;
    console.log('  -> PASS: CONF-01 parseProviderList resolution\n');
  }

  // CONF-02: resolveProviderChain with AI_FALLBACK_PROVIDERS=groq yields ['gemini', 'groq']
  total++;
  console.log('CONF-02: Verifying resolveProviderChain with primary "gemini" and fallback "groq"...');
  {
    const registry = new AIProviderRegistry();
    const mockGemini = new MockAIProvider('gemini', 'SUCCESS');
    const mockGroq = new MockAIProvider('groq', 'SUCCESS');
    registry.registerProvider(mockGemini);
    registry.registerProvider(mockGroq);

    const resolution = registry.resolveProviderChain('gemini', ['groq']);
    assert(resolution.primaryId === 'gemini', 'primaryId is gemini');
    assert(
      JSON.stringify(resolution.resolvedChain) === JSON.stringify(['gemini', 'groq']),
      'resolvedChain must be exactly ["gemini", "groq"]'
    );
    assert(resolution.availableProviders.length === 2, 'Both providers available');
    assert(resolution.unconfiguredProviders.length === 0, 'Zero unconfigured providers');
    assert(resolution.missingProviders.length === 0, 'Zero missing providers');

    passed++;
    console.log('  -> PASS: CONF-02 ["gemini", "groq"] chain resolution\n');
  }

  // CONF-03: Default configuration remains ['gemini']
  total++;
  console.log('CONF-03: Verifying default configuration remains ["gemini"]...');
  {
    const registry = new AIProviderRegistry();
    const mockGemini = new MockAIProvider('gemini', 'SUCCESS');
    const mockGroq = new MockAIProvider('groq', 'SUCCESS');
    registry.registerProvider(mockGemini);
    registry.registerProvider(mockGroq);

    // Using default parameters (no explicit primary or fallbacks passed)
    const defaultResolution = registry.resolveProviderChain();
    assert(
      defaultResolution.primaryId === DEFAULT_AI_CONFIG.defaultProvider,
      `primaryId must default to ${DEFAULT_AI_CONFIG.defaultProvider}`
    );
    assert(
      defaultResolution.resolvedChain[0] === 'gemini',
      'First element of default chain must be gemini'
    );
    assert(
      !defaultResolution.resolvedChain.includes('groq'),
      'Default resolved chain must NOT include groq unless configured in fallbackProviders'
    );

    passed++;
    console.log('  -> PASS: CONF-03 Default ["gemini"] preserved\n');
  }

  // CONF-04: Deterministic ordering without random selection
  total++;
  console.log('CONF-04: Verifying deterministic provider ordering...');
  {
    const registry = new AIProviderRegistry();
    const order1 = registry.resolveProviderChain('gemini', ['groq']).resolvedChain;
    const order2 = registry.resolveProviderChain('gemini', ['groq']).resolvedChain;
    const order3 = registry.resolveProviderChain('gemini', ['groq']).resolvedChain;

    assert(
      JSON.stringify(order1) === JSON.stringify(['gemini', 'groq']) &&
      JSON.stringify(order2) === JSON.stringify(['gemini', 'groq']) &&
      JSON.stringify(order3) === JSON.stringify(['gemini', 'groq']),
      'Ordering must remain strictly deterministic across multiple resolutions'
    );

    passed++;
    console.log('  -> PASS: CONF-04 Deterministic ordering\n');
  }

  // =========================================================================
  // SECTION B: MOCKED GEMINI -> GROQ FAILOVER INTEGRATION (FAIL-01 to FAIL-05)
  // =========================================================================

  // FAIL-01: Primary Gemini 429 quota exhaustion triggers Groq fallback
  total++;
  console.log('FAIL-01: Verifying Gemini 429 quota exhaustion fails over to Groq...');
  {
    const registry = new AIProviderRegistry();

    // Instrumented Gemini that fails with 429 QUOTA_EXHAUSTED
    let geminiCallTimestamp = 0;
    const geminiMock = new MockAIProvider('gemini', 'QUOTA_EXHAUSTED', true, 'gemini-3.1-flash-lite');
    const origGeminiGenerate = geminiMock.generateCandidate.bind(geminiMock);
    geminiMock.generateCandidate = async (input, options) => {
      geminiCallTimestamp = Date.now();
      return origGeminiGenerate(input, options);
    };

    // Real GroqService backed by mock GroqClient
    let groqCallTimestamp = 0;
    let groqCallCount = 0;
    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_test_key' });
    mockGroqClient.generateChatCompletion = async () => {
      groqCallTimestamp = Date.now();
      groqCallCount++;
      return validMockGroqCompletionResponse;
    };
    const groqService = new GroqService(mockGroqClient);

    // Third provider to verify no third provider is called
    const thirdProvider = new MockAIProvider('third-provider', 'SUCCESS');

    registry.registerProvider(geminiMock);
    registry.registerProvider(groqService);
    registry.registerProvider(thirdProvider);

    const orchestrator = new AIOrchestrator(registry);

    const result = await orchestrator.generateQuestionCandidate(sampleInput, {
      primaryProviderId: 'gemini',
      fallbackProviderIds: ['groq', 'third-provider'],
    });

    // 1. Candidate generated
    assert(result.candidate !== undefined, 'Candidate must be generated');
    assert(result.candidate.content.includes('jacket marked at Rs 2,000'), 'Candidate content matches Groq output');
    assert(result.candidate.correct_answer === 'A', 'Correct answer is A');

    // 2. Provider metadata & telemetry
    assert(result.metadata.providerId === 'groq', 'Result providerId must be groq');
    assert(result.metadata.generatorType === 'GROQ_AI', 'Generator type must be GROQ_AI');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed must be true');
    assert(result.metadata.isMockFallback === false, 'isMockFallback must be false');
    assert(
      JSON.stringify(result.metadata.attemptedProviders) === JSON.stringify(['gemini', 'groq']),
      'Attempted providers must be ["gemini", "groq"]'
    );

    // 3. Execution sequence & call counts
    assert(geminiMock.callCount === 1, 'Gemini must be called exactly once');
    assert(groqCallCount === 1, 'Groq must be called exactly once');
    assert(thirdProvider.callCount === 0, 'Third provider must NOT be called');
    assert(groqCallTimestamp >= geminiCallTimestamp, 'Gemini must be called before Groq');

    // 4. CandidateValidator passed
    assert(result.validation.isValid === true, 'CandidateValidator must pass');

    passed++;
    console.log('  -> PASS: FAIL-01 Gemini 429 quota exhaustion fails over to Groq\n');
  }

  // FAIL-02: Gemini transient error (retry exhausted) fails over to Groq
  total++;
  console.log('FAIL-02: Verifying Gemini transient failure fails over to Groq...');
  {
    const registry = new AIProviderRegistry();

    const geminiMock = new MockAIProvider('gemini', 'TRANSIENT_ERROR', true, 'gemini-3.1-flash-lite');

    let groqCallCount = 0;
    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_test_key' });
    mockGroqClient.generateChatCompletion = async () => {
      groqCallCount++;
      return validMockGroqCompletionResponse;
    };
    const groqService = new GroqService(mockGroqClient);

    registry.registerProvider(geminiMock);
    registry.registerProvider(groqService);

    const orchestrator = new AIOrchestrator(registry);

    const result = await orchestrator.generateQuestionCandidate(sampleInput, {
      primaryProviderId: 'gemini',
      fallbackProviderIds: ['groq'],
    });

    assert(geminiMock.callCount === 1, 'Gemini was attempted');
    assert(groqCallCount === 1, 'Groq succeeded on failover');
    assert(result.metadata.providerId === 'groq', 'Provider is groq');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed is true');

    passed++;
    console.log('  -> PASS: FAIL-02 Gemini transient failure fails over to Groq\n');
  }

  // FAIL-03: End-to-end failover with Blind Verification & Server-Side Arbitration
  total++;
  console.log('FAIL-03: Verifying failover with Blind Verification and server arbitration...');
  {
    const aiRegistry = new AIProviderRegistry();
    const geminiMock = new MockAIProvider('gemini', 'QUOTA_EXHAUSTED');

    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_test_key' });
    mockGroqClient.generateChatCompletion = async () => validMockGroqCompletionResponse;
    const groqService = new GroqService(mockGroqClient);

    aiRegistry.registerProvider(geminiMock);
    aiRegistry.registerProvider(groqService);

    // Mock Blind Verifier agreeing with Option A
    const verifierRegistry = new BlindVerifierRegistry();
    const verifier = new MockBlindVerifierProvider('gemini-blind-verifier', 'mock-v-model', {
      solvedOption: 'A',
      confidence: 0.98,
      independentProof: 'Discount calculation confirms Rs 1600 is Option A',
    });
    verifierRegistry.registerProvider(verifier);

    const orchestrator = new AIOrchestrator(aiRegistry, verifierRegistry);

    const result = await orchestrator.generateQuestionCandidate(sampleInput, {
      primaryProviderId: 'gemini',
      fallbackProviderIds: ['groq'],
      enableBlindVerification: true,
      verifierProviderId: 'gemini-blind-verifier',
    });

    assert(result.metadata.providerId === 'groq', 'Candidate generated by Groq fallback');
    assert(result.metadata.fallbackUsed === true, 'fallbackUsed recorded');
    assert(result.validation.isValid === true, 'Candidate validated');
    assert(result.arbitration !== undefined, 'Arbitration result attached');
    assert(result.arbitration?.verdict === 'VALID', 'Verdict must be VALID upon verifier agreement');
    assert(verifier.callCount === 1, 'Blind verifier called exactly once');

    passed++;
    console.log('  -> PASS: FAIL-03 Failover with blind verification & arbitration\n');
  }

  // FAIL-04: Both Gemini and Groq fail -> Terminal AIProviderError (No synthetic fallback)
  total++;
  console.log('FAIL-04: Verifying both Gemini and Groq failing results in terminal AIProviderError...');
  {
    const registry = new AIProviderRegistry();

    const geminiMock = new MockAIProvider('gemini', 'QUOTA_EXHAUSTED');

    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_test_key' });
    mockGroqClient.generateChatCompletion = async () => {
      throw new AIProviderError(
        'Groq service overloaded (HTTP 503)',
        'groq',
        'openai/gpt-oss-120b',
        'TRANSIENT_ERROR',
        false,
        503
      );
    };
    const groqService = new GroqService(mockGroqClient);

    registry.registerProvider(geminiMock);
    registry.registerProvider(groqService);

    const orchestrator = new AIOrchestrator(registry);

    let caughtError: any = null;
    try {
      await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
        fallbackProviderIds: ['groq'],
      });
    } catch (err: any) {
      caughtError = err;
    }

    assert(caughtError !== null, 'Orchestrator must throw when all providers fail');
    assert(caughtError instanceof AIProviderError, 'Must throw structured AIProviderError');
    assert(
      caughtError.message.includes('All AI question generation providers failed'),
      'Error message describes total failure'
    );
    assert(
      caughtError.message.includes('Attempted: [gemini, groq]'),
      'Error message includes all attempted providers'
    );
    assert(geminiMock.callCount === 1, 'Gemini was attempted');

    passed++;
    console.log('  -> PASS: FAIL-04 Both providers failing results in terminal AIProviderError\n');
  }

  // FAIL-05: Groq malformed output fails over cleanly or surfaces validation failure
  total++;
  console.log('FAIL-05: Verifying Groq malformed output handling in orchestrator...');
  {
    const registry = new AIProviderRegistry();
    const geminiMock = new MockAIProvider('gemini', 'QUOTA_EXHAUSTED');

    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_test_key' });
    mockGroqClient.generateChatCompletion = async () => ({
      choices: [{ message: { content: '{"invalid_json": true' } }],
    });
    const groqService = new GroqService(mockGroqClient);

    registry.registerProvider(geminiMock);
    registry.registerProvider(groqService);

    const orchestrator = new AIOrchestrator(registry);

    let caughtError: any = null;
    try {
      await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
        fallbackProviderIds: ['groq'],
      });
    } catch (err: any) {
      caughtError = err;
    }

    assert(caughtError !== null, 'Malformed Groq response must trigger error');
    assert(caughtError instanceof AIProviderError, 'Must be structured AIProviderError');
    assert(caughtError.message.includes('Attempted: [gemini, groq]'), 'Both providers recorded in failure');

    passed++;
    console.log('  -> PASS: FAIL-05 Groq malformed output handling\n');
  }

  console.log('===============================================================');
  console.log(`STEP 4A SUITE COMPLETED: ${passed}/${total} TESTS PASSED`);
  console.log('LIVE GROQ CALLS: 0');
  console.log('LIVE GEMINI CALLS: 0');
  console.log('PERSISTENCE OPERATIONS: 0');
  console.log('===============================================================\n');

  return { total, passed };
}

// Self-executing runner
const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith('phase22-step6d-failover-integration.ts'));

if (isDirectRun) {
  runStep4aFailoverSuite()
    .then((res) => {
      if (res.passed === res.total) process.exit(0);
      else process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
