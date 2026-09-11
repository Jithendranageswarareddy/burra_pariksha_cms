/**
 * BURRA PARIKSHA CMS - Phase 23 Step 3 Test Suite
 * Telemetry Integration Into Provider Execution & Observability
 * 
 * STRICT ₹0 / ZERO NETWORK CALLS:
 * - 100% In-memory deterministic mock/stub execution.
 * - Zero live AI API calls (Gemini: 0, Groq: 0, xAI: 0, Google Sheets: 0).
 * - Zero persistence side effects.
 * - Zero secret leakage.
 * 
 * VERIFIES ALL 13 SPECIFIED CRITERIA:
 * 1. One successful Gemini generation = one GENERATION event
 * 2. One successful Groq generation = one GENERATION event
 * 3. Gemini failure then Groq success = exactly two GENERATION attempt events
 * 4. Gemini retry produces separate physical attempt events
 * 5. Fallback event has fallbackUsed=true
 * 6. Terminal generator failure records failed attempts
 * 7. Successful blind verification produces one VERIFICATION event
 * 8. Verifier failure records one failed VERIFICATION event
 * 9. Generation and verification remain separately classified
 * 10. Missing token usage remains null
 * 11. Known token usage is propagated correctly
 * 12. Telemetry failure does not break provider business behavior
 * 13. No duplicate telemetry events are produced by provider + orchestrator wrapping
 */

import { geminiClient } from '../lib/ai/gemini.client';
import { GeminiService } from '../lib/ai/gemini.service';
import { GroqClient } from '../lib/ai/providers/groq.client';
import { GroqService } from '../lib/ai/providers/groq.service';
import { GeminiBlindVerifierProvider } from '../lib/ai/verifier/gemini-blind-verifier';
import { BlindVerifierRegistry } from '../lib/ai/verifier/blind-verifier.registry';
import { AIProviderRegistry } from '../lib/ai/registry';
import { AIOrchestrator } from '../lib/ai/orchestrator';
import { aiUsageStore, AIUsageStore } from '../lib/ai/observability';
import { AIProviderError } from '../lib/ai/error';
import { DifficultyLevel, QuestionLanguage } from '../types';
import { GenerateCandidateInput } from '../lib/ai/types';
import { BlindVerifierInputDTO } from '../lib/ai/verifier/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

const sampleCandidate = {
  content: 'If the price of petrol increases by 25%, by what percent must a driver reduce consumption to keep expenditure unchanged?',
  option_a: '20%',
  option_b: '25%',
  option_c: '15%',
  option_d: '30%',
  correct_answer: 'A',
  explanation: 'Required reduction = (25 / (100 + 25)) * 100 = (25 / 125) * 100 = 20%.',
  speed_trick: '25% increase corresponds to 20% reduction on the fractional scale (+1/4 -> -1/5).',
  taxonomy: {
    categoryId: 'cat-quant',
    categoryName: 'Quantitative Aptitude',
    topicId: 'topic-percentages',
    topicName: 'Percentages',
    subtopicId: 'sub-expenditure',
    subtopicName: 'Price and Consumption',
  },
  difficulty: DifficultyLevel.MEDIUM,
  language: QuestionLanguage.ENGLISH,
  question_style: 'Real-World Scenario',
  real_world_context: 'Fuel expenditure management',
};

const sampleInput: GenerateCandidateInput = {
  categoryId: 'cat-quant',
  categoryName: 'Quantitative Aptitude',
  topicId: 'topic-percentages',
  topicName: 'Percentages',
  subtopicId: 'sub-expenditure',
  subtopicName: 'Price and Consumption',
  difficulty: DifficultyLevel.MEDIUM,
  language: QuestionLanguage.ENGLISH,
};

const sampleVerifierInput: BlindVerifierInputDTO = {
  questionText: sampleCandidate.content,
  options: {
    a: sampleCandidate.option_a,
    b: sampleCandidate.option_b,
    c: sampleCandidate.option_c,
    d: sampleCandidate.option_d,
  },
  language: QuestionLanguage.ENGLISH,
  categoryName: 'Quantitative Aptitude',
  topicName: 'Percentages',
  subtopicName: 'Price and Consumption',
};

const validVerifierResponsePayload = {
  solvedOption: 'A',
  derivedValue: '20%',
  independentProof: 'Let initial price = 100 and consumption = 100. New price = 125. New consumption = 10000 / 125 = 80. Reduction = 20%.',
  confidence: 0.99,
  isSolvable: true,
  hasMultipleValidOptions: false,
};

async function runTestSuite() {
  console.log('================================================================');
  console.log('PHASE 23 STEP 3 — TELEMETRY INTEGRATION TEST SUITE');
  console.log('Zero network calls | Strict ₹0 | Mock Provider Execution');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    total++;
    return (async () => {
      try {
        await fn();
        console.log(`  [PASS] Test ${total.toString().padStart(2, '0')}: ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  [FAIL] Test ${total.toString().padStart(2, '0')}: ${name}`);
        console.error(`         Error: ${err.message}`);
      }
    })();
  }

  // Preserve initial client
  const originalGeminiClient = geminiClient.getClient();

  try {
    // Test 1: One successful Gemini generation = one GENERATION event
    await test('One successful Gemini generation = one GENERATION event', async () => {
      aiUsageStore.clear();

      const mockClient: any = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify(sampleCandidate),
            usageMetadata: {
              promptTokenCount: 140,
              candidatesTokenCount: 65,
              totalTokenCount: 205,
            },
          }),
        },
      };
      geminiClient.setClient(mockClient);

      const geminiService = GeminiService.getInstance();
      const result = await geminiService.generateCandidate(sampleInput);

      assert(!!result.candidate, 'Must return candidate');
      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, `Must record exactly 1 event (got ${events.length})`);
      assert(events[0].operation === 'GENERATION', 'Operation must be GENERATION');
      assert(events[0].providerId === 'gemini', 'Provider must be gemini');
      assert(events[0].success === true, 'Success must be true');
      assert(events[0].attemptNumber === 1, 'Attempt number must be 1');
      assert(events[0].inputTokens === 140, 'Input tokens must be 140');
      assert(events[0].outputTokens === 65, 'Output tokens must be 65');
      assert(events[0].totalTokens === 205, 'Total tokens must be 205');
    });

    // Test 2: One successful Groq generation = one GENERATION event
    await test('One successful Groq generation = one GENERATION event', async () => {
      aiUsageStore.clear();

      const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_step3_key' });
      mockGroqClient.generateChatCompletion = async () => ({
        id: 'chatcmpl-mock-groq-step3-01',
        choices: [
          {
            message: {
              content: JSON.stringify(sampleCandidate),
            },
          },
        ],
        usage: {
          prompt_tokens: 180,
          completion_tokens: 85,
          total_tokens: 265,
        },
      });

      const groqService = new GroqService(mockGroqClient);
      const result = await groqService.generateCandidate(sampleInput);

      assert(!!result.candidate, 'Must return candidate');
      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, `Must record exactly 1 event (got ${events.length})`);
      assert(events[0].operation === 'GENERATION', 'Operation must be GENERATION');
      assert(events[0].providerId === 'groq', 'Provider must be groq');
      assert(events[0].success === true, 'Success must be true');
      assert(events[0].attemptNumber === 1, 'Attempt number must be 1');
      assert(events[0].inputTokens === 180, 'Input tokens must be 180');
      assert(events[0].outputTokens === 85, 'Output tokens must be 85');
      assert(events[0].totalTokens === 265, 'Total tokens must be 265');
    });

    // Test 3: Gemini failure then Groq success = exactly two GENERATION attempt events
    await test('Gemini failure then Groq success = exactly two GENERATION attempt events', async () => {
      aiUsageStore.clear();

      // Gemini mock throws 429 QUOTA_EXHAUSTED
      const mockGemini: any = {
        models: {
          generateContent: async () => {
            const err: any = new Error('RESOURCE_EXHAUSTED: quota exceeded');
            err.status = 429;
            throw err;
          },
        },
      };
      geminiClient.setClient(mockGemini);
      const geminiService = GeminiService.getInstance();

      // Groq mock succeeds
      const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_step3_key' });
      mockGroqClient.generateChatCompletion = async () => ({
        id: 'chatcmpl-mock-groq-step3-02',
        choices: [
          {
            message: {
              content: JSON.stringify(sampleCandidate),
            },
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 90,
          total_tokens: 290,
        },
      });
      const groqService = new GroqService(mockGroqClient);

      const registry = new AIProviderRegistry();
      registry.registerProvider(geminiService);
      registry.registerProvider(groqService);

      const orchestrator = new AIOrchestrator(registry);
      const result = await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
        fallbackProviderIds: ['groq'],
        maxRetries: 0,
      });

      assert(result.metadata.providerId === 'groq', 'Must fail over to groq');
      assert(result.metadata.fallbackUsed === true, 'fallbackUsed must be true in result');

      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 2, `Must record exactly 2 physical attempt events (got ${events.length})`);

      // Event 1: Gemini failed
      assert(events[0].providerId === 'gemini', 'Event 1 provider must be gemini');
      assert(events[0].success === false, 'Event 1 success must be false');
      assert(events[0].errorCategory === 'QUOTA_EXHAUSTED', 'Event 1 error must be QUOTA_EXHAUSTED');
      assert(events[0].fallbackUsed === false, 'Event 1 fallbackUsed must be false');

      // Event 2: Groq succeeded
      assert(events[1].providerId === 'groq', 'Event 2 provider must be groq');
      assert(events[1].success === true, 'Event 2 success must be true');
      assert(events[1].fallbackUsed === true, 'Event 2 fallbackUsed must be true');

      // Logical request: Exactly 1 logical request, 1 success
      const today = aiUsageStore.getTodaySummary();
      assert(today.operations.GENERATION.logicalRequests === 1, 'Logical requests must be 1');
      assert(today.operations.GENERATION.logicalSuccesses === 1, 'Logical successes must be 1');
    });

    // Test 4: Gemini retry produces separate physical attempt events
    await test('Gemini retry produces separate physical attempt events', async () => {
      aiUsageStore.clear();

      let callCount = 0;
      const mockGemini: any = {
        models: {
          generateContent: async () => {
            callCount++;
            if (callCount === 1) {
              const err: any = new Error('503 Service Unavailable: transient network error');
              err.status = 503;
              throw err;
            }
            return {
              text: JSON.stringify(sampleCandidate),
              usageMetadata: {
                promptTokenCount: 150,
                candidatesTokenCount: 70,
                totalTokenCount: 220,
              },
            };
          },
        },
      };
      geminiClient.setClient(mockGemini);
      const geminiService = GeminiService.getInstance();

      const result = await geminiService.generateCandidate(sampleInput);
      assert(!!result.candidate, 'Candidate generated after retry');

      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 2, `Must record 2 physical attempt events for retry (got ${events.length})`);
      assert(events[0].attemptNumber === 1, 'Event 1 attemptNumber must be 1');
      assert(events[0].success === false, 'Event 1 success must be false');
      assert(events[0].errorCategory === 'TRANSIENT_ERROR', 'Event 1 errorCategory must be TRANSIENT_ERROR');

      assert(events[1].attemptNumber === 2, 'Event 2 attemptNumber must be 2');
      assert(events[1].success === true, 'Event 2 success must be true');

      const today = aiUsageStore.getTodaySummary();
      const geminiAgg = today.providers['gemini'].models[events[1].modelId];
      assert(geminiAgg.retryAttempts === 1, `Retry attempts must be 1 (got ${geminiAgg.retryAttempts})`);
    });

    // Test 5: Fallback event has fallbackUsed=true
    await test('Fallback event has fallbackUsed=true', async () => {
      aiUsageStore.clear();

      const mockGemini: any = {
        models: {
          generateContent: async () => {
            throw { message: 'RESOURCE_EXHAUSTED', status: 429 };
          },
        },
      };
      geminiClient.setClient(mockGemini);
      const geminiService = GeminiService.getInstance();

      const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_step3_key' });
      mockGroqClient.generateChatCompletion = async () => ({
        choices: [{ message: { content: JSON.stringify(sampleCandidate) } }],
      });
      const groqService = new GroqService(mockGroqClient);

      const registry = new AIProviderRegistry();
      registry.registerProvider(geminiService);
      registry.registerProvider(groqService);

      const orchestrator = new AIOrchestrator(registry);
      await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
        fallbackProviderIds: ['groq'],
      });

      const events = aiUsageStore.getRecentEvents();
      const groqEvent = events.find((e) => e.providerId === 'groq');
      assert(groqEvent !== undefined, 'Groq event must exist');
      assert(groqEvent.fallbackUsed === true, 'Groq fallbackUsed must be true');
    });

    // Test 6: Terminal generator failure records failed attempts
    await test('Terminal generator failure records failed attempts', async () => {
      aiUsageStore.clear();

      const mockGemini: any = {
        models: {
          generateContent: async () => {
            throw { message: 'RESOURCE_EXHAUSTED', status: 429 };
          },
        },
      };
      geminiClient.setClient(mockGemini);
      const geminiService = GeminiService.getInstance();

      const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_step3_key' });
      mockGroqClient.generateChatCompletion = async () => {
        throw { message: '429 Rate limit exceeded', status: 429 };
      };
      const groqService = new GroqService(mockGroqClient);

      const registry = new AIProviderRegistry();
      registry.registerProvider(geminiService);
      registry.registerProvider(groqService);

      const orchestrator = new AIOrchestrator(registry);
      let errorThrown = false;

      try {
        await orchestrator.generateQuestionCandidate(sampleInput, {
          primaryProviderId: 'gemini',
          fallbackProviderIds: ['groq'],
          maxRetries: 0,
        });
      } catch (err: any) {
        errorThrown = true;
        assert(err instanceof AIProviderError, 'Must throw AIProviderError');
      }

      assert(errorThrown, 'Terminal failure must throw error');
      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 2, `Must record 2 failed attempts (got ${events.length})`);
      assert(events[0].success === false, 'Event 1 must be failed');
      assert(events[1].success === false, 'Event 2 must be failed');

      const today = aiUsageStore.getTodaySummary();
      assert(today.operations.GENERATION.logicalFailures === 1, 'Logical failures must be 1');
      assert(today.operations.GENERATION.logicalSuccesses === 0, 'Logical successes must be 0');
    });

    // Test 7: Successful blind verification produces one VERIFICATION event
    await test('Successful blind verification produces one VERIFICATION event', async () => {
      aiUsageStore.clear();

      const mockVerifierClient: any = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify(validVerifierResponsePayload),
            usageMetadata: {
              promptTokenCount: 220,
              candidatesTokenCount: 95,
              totalTokenCount: 315,
            },
          }),
        },
      };
      geminiClient.setClient(mockVerifierClient);

      const verifier = new GeminiBlindVerifierProvider();
      const output = await verifier.verifyCandidateBlind(sampleVerifierInput);

      assert(output.solvedOption === 'A', 'Must solve Option A');
      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, `Must record 1 event (got ${events.length})`);
      assert(events[0].operation === 'VERIFICATION', 'Operation must be VERIFICATION');
      assert(events[0].providerId === 'gemini-blind-verifier', 'Provider must be gemini-blind-verifier');
      assert(events[0].success === true, 'Success must be true');
      assert(events[0].inputTokens === 220, 'Input tokens must be 220');
      assert(events[0].outputTokens === 95, 'Output tokens must be 95');
      assert(events[0].totalTokens === 315, 'Total tokens must be 315');
    });

    // Test 8: Verifier failure records one failed VERIFICATION event
    await test('Verifier failure records one failed VERIFICATION event', async () => {
      aiUsageStore.clear();

      const mockVerifierClient: any = {
        models: {
          generateContent: async () => {
            const err: any = new Error('504 Gateway Timeout');
            err.status = 504;
            throw err;
          },
        },
      };
      geminiClient.setClient(mockVerifierClient);

      const verifier = new GeminiBlindVerifierProvider();
      let errorCaught = false;

      try {
        await verifier.verifyCandidateBlind(sampleVerifierInput, { maxRetries: 0 });
      } catch (err: any) {
        errorCaught = true;
      }

      assert(errorCaught, 'Must catch verifier error');
      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, `Must record 1 failed event (got ${events.length})`);
      assert(events[0].operation === 'VERIFICATION', 'Operation must be VERIFICATION');
      assert(events[0].success === false, 'Success must be false');
      assert(events[0].errorCategory === 'TIMEOUT', 'Error category must be TIMEOUT');
    });

    // Test 9: Generation and verification remain separately classified
    await test('Generation and verification remain separately classified', async () => {
      aiUsageStore.clear();

      // Generation + Verifier mock
      const mockGeminiClient: any = {
        models: {
          generateContent: async (args: any) => {
            if (args.config?.temperature === 0.1) {
              return {
                text: JSON.stringify(validVerifierResponsePayload),
              };
            }
            return {
              text: JSON.stringify(sampleCandidate),
            };
          },
        },
      };
      geminiClient.setClient(mockGeminiClient);
      const geminiService = GeminiService.getInstance();

      // Verifier mock
      const verifier = new GeminiBlindVerifierProvider();

      const registry = new AIProviderRegistry();
      registry.registerProvider(geminiService);

      const verifierRegistry = new BlindVerifierRegistry();
      verifierRegistry.registerProvider(verifier);

      const orchestrator = new AIOrchestrator(registry, verifierRegistry);
      const result = await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
        enableBlindVerification: true,
      });

      assert(!!result.candidate, 'Candidate generated');
      assert(result.arbitration !== undefined, 'Arbitration attached');

      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 2, `Must record 2 separate events (got ${events.length})`);

      const genEvent = events.find((e) => e.operation === 'GENERATION');
      const verifEvent = events.find((e) => e.operation === 'VERIFICATION');

      assert(genEvent !== undefined, 'Generation event must exist');
      assert(verifEvent !== undefined, 'Verification event must exist');
      assert(genEvent.providerId === 'gemini', 'Generator provider must be gemini');
      assert(verifEvent.providerId === 'gemini-blind-verifier', 'Verifier provider must be gemini-blind-verifier');

      const today = aiUsageStore.getTodaySummary();
      assert(today.operations.GENERATION.logicalSuccesses === 1, 'Generation logical success = 1');
      assert(today.operations.VERIFICATION.logicalSuccesses === 1, 'Verification logical success = 1');
    });

    // Test 10: Missing token usage remains null
    await test('Missing token usage remains null', async () => {
      aiUsageStore.clear();

      const mockClient: any = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify(sampleCandidate),
            // usageMetadata omitted
          }),
        },
      };
      geminiClient.setClient(mockClient);

      const geminiService = GeminiService.getInstance();
      await geminiService.generateCandidate(sampleInput);

      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, '1 event recorded');
      assert(events[0].inputTokens === null, 'inputTokens must be null');
      assert(events[0].outputTokens === null, 'outputTokens must be null');
      assert(events[0].totalTokens === null, 'totalTokens must be null');
    });

    // Test 11: Known token usage is propagated correctly
    await test('Known token usage is propagated correctly', async () => {
      aiUsageStore.clear();

      const mockGroqClient = new GroqClient({ apiKey: 'gsk_mock_step3_key' });
      mockGroqClient.generateChatCompletion = async () => ({
        choices: [{ message: { content: JSON.stringify(sampleCandidate) } }],
        usage: {
          prompt_tokens: 312,
          completion_tokens: 144,
          total_tokens: 456,
        },
      });

      const groqService = new GroqService(mockGroqClient);
      await groqService.generateCandidate(sampleInput);

      const events = aiUsageStore.getRecentEvents();
      assert(events.length === 1, '1 event recorded');
      assert(events[0].inputTokens === 312, 'inputTokens must be 312');
      assert(events[0].outputTokens === 144, 'outputTokens must be 144');
      assert(events[0].totalTokens === 456, 'totalTokens must be 456');

      const today = aiUsageStore.getTodaySummary();
      assert(today.providers['groq'].totalTokens === 456, 'Summary must record 456 tokens');
    });

    // Test 12: Telemetry failure does not break provider business behavior
    await test('Telemetry failure does not break provider business behavior', async () => {
      // Mock recordEvent on aiUsageStore to intentionally throw
      const originalRecordEvent = aiUsageStore.recordEvent;
      (aiUsageStore as any).recordEvent = () => {
        throw new Error('Disk full / memory allocation error in telemetry');
      };

      try {
        const mockClient: any = {
          models: {
            generateContent: async () => ({
              text: JSON.stringify(sampleCandidate),
            }),
          },
        };
        geminiClient.setClient(mockClient);

        const geminiService = GeminiService.getInstance();
        // Even if telemetry throws, generateCandidate MUST complete normally
        const result = await geminiService.generateCandidate(sampleInput);
        assert(!!result.candidate, 'Business logic must succeed despite telemetry error');
      } finally {
        (aiUsageStore as any).recordEvent = originalRecordEvent;
      }
    });

    // Test 13: No duplicate telemetry events are produced by provider + orchestrator wrapping
    await test('No duplicate telemetry events are produced by provider + orchestrator wrapping', async () => {
      aiUsageStore.clear();

      const mockClient: any = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify(sampleCandidate),
            usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 },
          }),
        },
      };
      geminiClient.setClient(mockClient);

      const geminiService = GeminiService.getInstance();
      const registry = new AIProviderRegistry();
      registry.registerProvider(geminiService);

      const orchestrator = new AIOrchestrator(registry);
      // Execute 1 candidate generation with orchestrator wrapping
      await orchestrator.generateQuestionCandidate(sampleInput, {
        primaryProviderId: 'gemini',
      });

      const events = aiUsageStore.getRecentEvents();
      // Exactly 1 physical attempt event should be present, NOT 2!
      assert(events.length === 1, `Exactly 1 physical event must be recorded, no duplicate (got ${events.length})`);
      assert(events[0].providerId === 'gemini', 'Provider must be gemini');

      const today = aiUsageStore.getTodaySummary();
      assert(today.providers['gemini'].totalAttempts === 1, 'Provider physical attempts must be 1');
      assert(today.operations.GENERATION.logicalRequests === 1, 'Logical requests must be 1');
    });

  } finally {
    // Restore initial geminiClient
    geminiClient.setClient(originalGeminiClient);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('----------------------------------------------------------------\n');

  if (passed !== total) {
    throw new Error(`Test suite failed: ${passed}/${total} passed`);
  }
}

runTestSuite().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
