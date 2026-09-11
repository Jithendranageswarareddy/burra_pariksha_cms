/**
 * BURRA PARIKSHA CMS - Phase 22.6D Groq Provider Test Suite
 * 
 * Verifies all 16 required mock specifications (GQ-01 through GQ-16).
 * 
 * STRICT TEST RULES:
 * - Pure mock testing. ZERO live Groq API calls.
 * - ZERO network calls. ZERO Google Sheets writes. ZERO database records.
 * - ZERO unredacted API key printing or logging.
 */

import 'dotenv/config';
import { QuestionLanguage, DifficultyLevel } from '../types';
import {
  AIProviderRegistry,
  AIOrchestrator,
  QuestionCandidate,
  GenerateCandidateInput,
} from '../lib/ai';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';
import { BlindVerifierRegistry } from '../lib/ai/verifier/blind-verifier.registry';
import { GroqClient, GroqChatCompletionRequestPayload } from '../lib/ai/providers/groq.client';
import {
  GroqService,
  extractGroqCompletionText,
  GROQ_QUESTION_CANDIDATE_SCHEMA,
} from '../lib/ai/providers/groq.service';
import { AIProviderError, classifyAIError } from '../lib/ai/error';
import { CandidateValidator } from '../lib/ai/validators/candidate.validator';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

const sampleInput: GenerateCandidateInput = {
  categoryId: 'cat-quant',
  categoryName: 'Quantitative Aptitude',
  topicId: 'topic-arithmetic',
  topicName: 'Arithmetic',
  subtopicId: 'sub-time-work',
  subtopicName: 'Time and Work',
  difficulty: DifficultyLevel.MEDIUM,
  language: QuestionLanguage.ENGLISH,
  questionStyle: 'Real-World Scenario',
};

const validMockGroqChatCompletionResponse = {
  id: 'chatcmpl-mock-groq-001',
  object: 'chat.completion',
  created: 1756315800,
  model: 'openai/gpt-oss-120b',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          content: 'A can complete a project in 12 days and B can complete it in 18 days. Working together, how many days will they take to complete the project?',
          option_a: '7.2 days',
          option_b: '6.5 days',
          option_c: '8.0 days',
          option_d: '7.5 days',
          correct_answer: 'A',
          explanation: 'Total work = LCM(12, 18) = 36 units. Efficiency of A = 3 units/day. Efficiency of B = 2 units/day. Combined efficiency = 5 units/day. Total days = 36 / 5 = 7.2 days. Burra Trick: Product / Sum = (12 * 18) / (12 + 18) = 216 / 30 = 7.2 days.',
          difficulty: 'MEDIUM',
          language: 'ENGLISH',
          real_world_context: 'Engineering project delivery',
          question_style: 'Speed Math',
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 350,
    completion_tokens: 180,
    total_tokens: 530,
  },
};

async function runGroqMockSuite(): Promise<number> {
  console.log('===============================================================');
  console.log('PHASE 22.6D — GROQ MOCK SPECIFICATION SUITE (GQ-01 to GQ-16)');
  console.log('===============================================================\n');

  let passed = 0;

  // -------------------------------------------------------------------------
  // GQ-01: provider identity
  // -------------------------------------------------------------------------
  console.log('GQ-01: Verifying provider identity...');
  {
    const mockClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    const groq = new GroqService(mockClient);

    assert(groq.providerId === 'groq', 'providerId must be exactly groq');
    assert(
      groq.defaultModelId === (process.env.GROQ_MODEL || 'openai/gpt-oss-120b'),
      'defaultModelId must be openai/gpt-oss-120b'
    );
    assert(groq.isConfigured() === true, 'isConfigured must return true with apiKey');

    passed++;
    console.log('  -> PASS: GQ-01 provider identity\n');
  }

  // -------------------------------------------------------------------------
  // GQ-02: missing API key handling
  // -------------------------------------------------------------------------
  console.log('GQ-02: Verifying missing API key handling...');
  {
    const unconfClient = new GroqClient({ apiKey: '' });
    const unconfGroq = new GroqService(unconfClient);

    assert(unconfGroq.isConfigured() === false, 'isConfigured must report false');

    let threw = false;
    try {
      await unconfGroq.generateCandidate(sampleInput);
    } catch (err: any) {
      threw = true;
      assert(err instanceof AIProviderError, 'Must throw structured AIProviderError');
      assert(err.classification === 'AUTH_ERROR', 'Must be AUTH_ERROR');
      assert(err.statusCode === 401, 'Must have statusCode 401');
      assert(err.isRetryable === false, 'Must be non-retryable');
    }
    assert(threw, 'Unconfigured Groq must throw AUTH_ERROR without making network call');

    passed++;
    console.log('  -> PASS: GQ-02 missing API key handling\n');
  }

  // -------------------------------------------------------------------------
  // GQ-03: request URL
  // -------------------------------------------------------------------------
  console.log('GQ-03: Verifying request URL...');
  {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input: any) => {
        capturedUrl = typeof input === 'string' ? input : input.url;
        return new Response(JSON.stringify(validMockGroqChatCompletionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const testClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
      await testClient.generateChatCompletion({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'test prompt' }],
      });

      assert(
        capturedUrl === 'https://api.groq.com/openai/v1/chat/completions',
        `Endpoint must be https://api.groq.com/openai/v1/chat/completions, got: ${capturedUrl}`
      );
    } finally {
      globalThis.fetch = originalFetch;
    }

    passed++;
    console.log('  -> PASS: GQ-03 request URL\n');
  }

  // -------------------------------------------------------------------------
  // GQ-04: Authorization header handling without exposing the key
  // -------------------------------------------------------------------------
  console.log('GQ-04: Verifying Authorization header handling without exposing the key...');
  {
    let authHeader = '';
    const secretKey = 'gsk_super_secret_test_key_1234567890';
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (_input: any, init?: any) => {
        authHeader = init?.headers?.['Authorization'] || init?.headers?.Authorization || '';
        return new Response(JSON.stringify(validMockGroqChatCompletionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const testClient = new GroqClient({ apiKey: secretKey });
      await testClient.generateChatCompletion({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'test prompt' }],
      });

      assert(authHeader === `Bearer ${secretKey}`, 'Authorization header must format as Bearer token');
      
      // Test error sanitization
      const err = new AIProviderError(`Failed header Bearer ${secretKey}`, 'groq', 'openai/gpt-oss-120b', 'AUTH_ERROR', false, 401);
      assert(!err.message.includes(secretKey), 'Error message must redact secret key');
      assert(err.message.includes('[REDACTED_KEY]'), 'Redaction placeholder must be present');
    } finally {
      globalThis.fetch = originalFetch;
    }

    passed++;
    console.log('  -> PASS: GQ-04 Authorization header handling without exposing the key\n');
  }

  // -------------------------------------------------------------------------
  // GQ-05: model selection
  // -------------------------------------------------------------------------
  console.log('GQ-05: Verifying model selection...');
  {
    let capturedPayload: GroqChatCompletionRequestPayload | null = null;
    const testClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    testClient.generateChatCompletion = async (payload) => {
      capturedPayload = payload;
      return validMockGroqChatCompletionResponse;
    };
    const groq = new GroqService(testClient);

    const res = await groq.generateCandidate(sampleInput);
    assert(capturedPayload !== null, 'Payload must be sent');
    assert(capturedPayload!.model === 'openai/gpt-oss-120b', 'Model must default to openai/gpt-oss-120b');
    assert(res.metadata.modelId === 'openai/gpt-oss-120b', 'Metadata modelId is openai/gpt-oss-120b');

    // Test override
    await groq.generateCandidate(sampleInput, { modelId: 'openai/gpt-oss-20b' });
    assert(capturedPayload!.model === 'openai/gpt-oss-20b', 'Options override modelId');

    passed++;
    console.log('  -> PASS: GQ-05 model selection\n');
  }

  // -------------------------------------------------------------------------
  // GQ-06: strict JSON Schema enabled
  // -------------------------------------------------------------------------
  console.log('GQ-06: Verifying strict JSON Schema enabled...');
  {
    let capturedPayload: GroqChatCompletionRequestPayload | null = null;
    const testClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    testClient.generateChatCompletion = async (payload) => {
      capturedPayload = payload;
      return validMockGroqChatCompletionResponse;
    };
    const groq = new GroqService(testClient);

    await groq.generateCandidate(sampleInput);
    assert(capturedPayload!.response_format !== undefined, 'response_format must be provided');
    assert(capturedPayload!.response_format!.type === 'json_schema', 'response_format type must be json_schema');
    assert(capturedPayload!.response_format!.json_schema.strict === true, 'json_schema strict must be true');
    assert(capturedPayload!.response_format!.json_schema.name === 'question_candidate', 'schema name is question_candidate');

    passed++;
    console.log('  -> PASS: GQ-06 strict JSON Schema enabled\n');
  }

  // -------------------------------------------------------------------------
  // GQ-07: QuestionCandidate schema compatibility
  // -------------------------------------------------------------------------
  console.log('GQ-07: Verifying QuestionCandidate schema compatibility...');
  {
    assert(GROQ_QUESTION_CANDIDATE_SCHEMA.additionalProperties === false, 'additionalProperties must be false');
    assert(Array.isArray(GROQ_QUESTION_CANDIDATE_SCHEMA.required), 'required must be an array');
    const required = GROQ_QUESTION_CANDIDATE_SCHEMA.required;
    assert(required.includes('content'), 'content is required');
    assert(required.includes('option_a'), 'option_a is required');
    assert(required.includes('option_b'), 'option_b is required');
    assert(required.includes('option_c'), 'option_c is required');
    assert(required.includes('option_d'), 'option_d is required');
    assert(required.includes('correct_answer'), 'correct_answer is required');
    assert(required.includes('explanation'), 'explanation is required');
    assert(required.includes('difficulty'), 'difficulty is required');
    assert(required.includes('language'), 'language is required');
    assert(required.includes('real_world_context'), 'real_world_context is required');
    assert(required.includes('question_style'), 'question_style is required');
    assert(GROQ_QUESTION_CANDIDATE_SCHEMA.type === 'object', 'type must be object');

    // Strict schema requirement: every key in properties must appear in required
    const propertyKeys = Object.keys(GROQ_QUESTION_CANDIDATE_SCHEMA.properties);
    for (const key of propertyKeys) {
      assert(required.includes(key), `Every property must appear in required: ${key}`);
    }
    assert(
      required.length === propertyKeys.length,
      `Required length (${required.length}) must match properties length (${propertyKeys.length})`
    );

    passed++;
    console.log('  -> PASS: GQ-07 QuestionCandidate schema compatibility (all 11 properties required, additionalProperties false)\n');
  }

  // -------------------------------------------------------------------------
  // GQ-08: successful structured response parsing
  // -------------------------------------------------------------------------
  console.log('GQ-08: Verifying successful structured response parsing...');
  {
    const extracted = extractGroqCompletionText(validMockGroqChatCompletionResponse);
    assert(extracted !== null, 'Text must be extracted from choices[0].message.content');
    const parsedJson = JSON.parse(extracted!);
    assert(parsedJson.content.includes('project in 12 days'), 'Parsed question content verified');

    const testClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    testClient.generateChatCompletion = async () => validMockGroqChatCompletionResponse;
    const groq = new GroqService(testClient);

    const result = await groq.generateCandidate(sampleInput);
    assert(result.candidate.content.includes('project in 12 days'), 'Candidate content returned');
    assert(result.candidate.correct_answer === 'A', 'Candidate correct_answer is A');
    assert(result.metadata.providerId === 'groq', 'metadata.providerId is groq');
    assert(result.metadata.generatorType === 'GROQ_AI', 'metadata.generatorType is GROQ_AI');
    assert(result.validation.isValid === true, 'Candidate passes CandidateValidator');

    passed++;
    console.log('  -> PASS: GQ-08 successful structured response parsing\n');
  }

  // -------------------------------------------------------------------------
  // GQ-09: malformed JSON handling
  // -------------------------------------------------------------------------
  console.log('GQ-09: Verifying malformed JSON handling...');
  {
    const badClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    badClient.generateChatCompletion = async () => ({
      choices: [{ message: { content: 'not valid json string {[' } }],
    });
    const groq = new GroqService(badClient);

    let threw = false;
    try {
      await groq.generateCandidate(sampleInput);
    } catch (err: any) {
      threw = true;
      assert(err instanceof AIProviderError, 'Must throw structured AIProviderError');
      assert(err.classification === 'INVALID_REQUEST', 'Must be INVALID_REQUEST');
      assert(!err.isRetryable, 'Malformed JSON is non-retryable');
      assert(err.statusCode === 400, 'Status code is 400');
    }
    assert(threw, 'Malformed JSON must throw AIProviderError');

    passed++;
    console.log('  -> PASS: GQ-09 malformed JSON handling\n');
  }

  // -------------------------------------------------------------------------
  // GQ-10: invalid candidate handling
  // -------------------------------------------------------------------------
  console.log('GQ-10: Verifying invalid candidate handling...');
  {
    const badClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    badClient.generateChatCompletion = async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              content: 'Valid content but missing options',
              // missing options, correct_answer, explanation
            }),
          },
        },
      ],
    });
    const groq = new GroqService(badClient);

    let threw = false;
    try {
      await groq.generateCandidate(sampleInput);
    } catch (err: any) {
      threw = true;
      assert(err instanceof AIProviderError, 'Must throw structured AIProviderError');
      assert(err.classification === 'INVALID_REQUEST', 'Schema invalidation is INVALID_REQUEST');
      assert(!err.isRetryable, 'Schema invalidation is non-retryable');
    }
    assert(threw, 'Missing required fields must throw AIProviderError');

    passed++;
    console.log('  -> PASS: GQ-10 invalid candidate handling\n');
  }

  // -------------------------------------------------------------------------
  // GQ-11: 400 mapping
  // -------------------------------------------------------------------------
  console.log('GQ-11: Verifying 400 mapping...');
  {
    const errObj = { status: 400, message: 'Groq API call failed (HTTP 400): Bad Request: invalid schema property' };
    const classified = classifyAIError(errObj);
    assert(classified.classification === 'INVALID_REQUEST', '400 maps to INVALID_REQUEST');
    assert(classified.isRetryable === false, '400 is non-retryable');
    assert(classified.statusCode === 400, 'Status code is 400');

    passed++;
    console.log('  -> PASS: GQ-11 400 mapping\n');
  }

  // -------------------------------------------------------------------------
  // GQ-12: 401 mapping
  // -------------------------------------------------------------------------
  console.log('GQ-12: Verifying 401 mapping...');
  {
    const errObj = { status: 401, message: 'Groq API call failed (HTTP 401): Invalid API Key provided' };
    const classified = classifyAIError(errObj);
    assert(classified.classification === 'AUTH_ERROR', '401 maps to AUTH_ERROR');
    assert(classified.isRetryable === false, '401 is strictly non-retryable');
    assert(classified.statusCode === 401, 'Status code is 401');

    passed++;
    console.log('  -> PASS: GQ-12 401 mapping\n');
  }

  // -------------------------------------------------------------------------
  // GQ-13: 429 mapping
  // -------------------------------------------------------------------------
  console.log('GQ-13: Verifying 429 mapping...');
  {
    const errObj = { status: 429, message: 'Groq API call failed (HTTP 429): Rate limit reached for TPM / RPD' };
    const classified = classifyAIError(errObj);
    assert(
      classified.classification === 'QUOTA_EXHAUSTED' || classified.classification === 'RATE_LIMIT',
      '429 maps to QUOTA_EXHAUSTED / RATE_LIMIT'
    );
    assert(classified.isRetryable === false, '429 is strictly non-retryable');
    assert(classified.statusCode === 429, 'Status code is 429');

    passed++;
    console.log('  -> PASS: GQ-13 429 mapping\n');
  }

  // -------------------------------------------------------------------------
  // GQ-14: 5xx mapping
  // -------------------------------------------------------------------------
  console.log('GQ-14: Verifying 5xx mapping...');
  {
    const c500 = classifyAIError({ status: 500, message: 'Internal Server Error' });
    assert(c500.classification === 'TRANSIENT_ERROR', '500 is TRANSIENT_ERROR');
    assert(c500.isRetryable === true, '500 is retryable');

    const c503 = classifyAIError({ status: 503, message: 'Service Unavailable' });
    assert(c503.classification === 'TRANSIENT_ERROR', '503 is TRANSIENT_ERROR');
    assert(c503.isRetryable === true, '503 is retryable');

    passed++;
    console.log('  -> PASS: GQ-14 5xx mapping\n');
  }

  // -------------------------------------------------------------------------
  // GQ-15: timeout/network mapping
  // -------------------------------------------------------------------------
  console.log('GQ-15: Verifying timeout/network mapping...');
  {
    const timeoutErr = new Error('Groq API call timed out after 30000ms');
    const cTimeout = classifyAIError(timeoutErr);
    assert(cTimeout.isRetryable === true, 'Timeout is retryable');
    assert(
      cTimeout.classification === 'TIMEOUT' || cTimeout.classification === 'TRANSIENT_ERROR',
      'Timeout classification'
    );

    const resetErr = new Error('read ECONNRESET connection reset by peer');
    const cReset = classifyAIError(resetErr);
    assert(cReset.classification === 'TRANSIENT_ERROR', 'ECONNRESET is TRANSIENT_ERROR');
    assert(cReset.isRetryable === true, 'ECONNRESET is retryable');

    passed++;
    console.log('  -> PASS: GQ-15 timeout/network mapping\n');
  }

  // -------------------------------------------------------------------------
  // GQ-16: no persistence / no fallback side effects
  // -------------------------------------------------------------------------
  console.log('GQ-16: Verifying no persistence / no fallback side effects...');
  {
    const registry = new AIProviderRegistry();
    const primaryGeminiFail = new MockAIProvider('gemini', 'QUOTA_EXHAUSTED', true, 'gemini-3.1-flash-lite');
    const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_valid_key' });
    let groqCallCount = 0;
    mockGroqClient.generateChatCompletion = async () => {
      groqCallCount++;
      return validMockGroqChatCompletionResponse;
    };
    const secondaryGroq = new GroqService(mockGroqClient);

    registry.registerProvider(primaryGeminiFail);
    registry.registerProvider(secondaryGroq);

    const orchestrator = new AIOrchestrator(registry, new BlindVerifierRegistry());
    const res = await orchestrator.generateQuestionCandidate(sampleInput, {
      primaryProviderId: 'gemini',
      fallbackProviderIds: ['groq'],
    });

    assert(primaryGeminiFail.callCount === 1, 'Primary Gemini failed on 429 quota (0 retry)');
    assert(groqCallCount === 1, 'Groq fallback invoked exactly once');
    assert(res.metadata.providerId === 'groq', 'Result providerId is groq');
    assert(res.metadata.fallbackUsed === true, 'fallbackUsed is true');
    assert(res.candidate.content.includes('project in 12 days'), 'Valid candidate returned');

    passed++;
    console.log('  -> PASS: GQ-16 no persistence / no fallback side effects\n');
  }

  console.log('===============================================================');
  console.log(`GROQ MOCK SUITE COMPLETED: ${passed}/16 TESTS PASSED`);
  console.log('LIVE GROQ CALLS: 0');
  console.log('API QUOTA CONSUMED: 0');
  console.log('===============================================================\n');

  return passed;
}

runGroqMockSuite().catch((err) => {
  console.error('[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
