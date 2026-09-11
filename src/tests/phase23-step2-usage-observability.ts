/**
 * BURRA PARIKSHA CMS - Phase 23 Step 2 Test Suite
 * AI Usage Observability Mock-First Implementation & Validation
 * 
 * STRICT ₹0 / ZERO NETWORK CALLS:
 * - 100% In-memory deterministic mock execution.
 * - Zero live AI API calls (Gemini: 0, Groq: 0, xAI: 0, Google Sheets: 0).
 * - Zero persistence side effects.
 * - Zero secret leakage.
 * 
 * VERIFIES ALL 20 SPECIFIED CRITERIA:
 * 1. Successful generation event recording
 * 2. Failed generation event recording
 * 3. Retry attempt counting (attemptNumber > 1)
 * 4. Fallback invocation counting (fallbackUsed === true)
 * 5. Generation + verification operation separation
 * 6. Token fields remain null when unavailable
 * 7. Known token usage aggregates correctly
 * 8. Multiple providers do not double-count logical requests
 * 9. Provider-level physical attempts are counted correctly
 * 10. Daily aggregation by IST date (Asia/Kolkata)
 * 11. Rolling 7-day retention
 * 12. Maximum 100 recent granular events (FIFO ring buffer)
 * 13. Quota NORMAL status (< 80%)
 * 14. Quota WARNING status (>= 80% and < 100%)
 * 15. Quota EXHAUSTED status (>= 100%)
 * 16. Null/unbounded quota (ceiling is null)
 * 17. Sanitized recent failures contain no secrets/prompts/responses
 * 18. Collector reset works (clear() resets events & rollups)
 * 19. Failed terminal generation can be represented
 * 20. Verifier failure can be represented independently
 */

import {
  AIUsageStore,
  AIUsageEvent,
  buildUsageEvent,
  recordUsageAttempt,
  recordLogicalRequest,
  sanitizeFailureEvent,
  evaluateProviderQuota,
  getKolkataDateString,
  getProviderDailyLimit,
} from '../lib/ai/observability';
import { AIErrorClassification } from '../lib/ai/error';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('PHASE 23 STEP 2 — AI USAGE OBSERVABILITY TEST SUITE');
  console.log('Zero network calls | Strict ₹0 | In-Memory Deterministic Validation');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  [PASS] Test ${total.toString().padStart(2, '0')}: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] Test ${total.toString().padStart(2, '0')}: ${name}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  const store = new AIUsageStore();

  // Test 1: Successful generation event recording
  test('Successful generation event recording', () => {
    store.clear();
    const event = recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        httpStatus: 200,
        latencyMs: 850,
        inputTokens: 320,
        outputTokens: 110,
        totalTokens: 430,
        requestId: 'req-gen-001',
      },
      store
    );

    assert(!!event.eventId, 'Event must have a generated eventId');
    assert(event.success === true, 'Event success must be true');
    assert(event.operation === 'GENERATION', 'Operation must be GENERATION');
    assert(event.providerId === 'gemini', 'ProviderId must be gemini');

    const recent = store.getRecentEvents();
    assert(recent.length === 1, 'Store must have exactly 1 event recorded');
    assert(recent[0].eventId === event.eventId, 'Recent event must match recorded event');
  });

  // Test 2: Failed generation event recording
  test('Failed generation event recording', () => {
    store.clear();
    const event = recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        httpStatus: 429,
        errorCategory: 'QUOTA_EXHAUSTED',
        latencyMs: 310,
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        requestId: 'req-gen-fail-001',
      },
      store
    );

    assert(event.success === false, 'Event success must be false');
    assert(event.errorCategory === 'QUOTA_EXHAUSTED', 'Error category must be QUOTA_EXHAUSTED');
    assert(event.httpStatus === 429, 'HTTP status must be 429');

    const today = store.getTodaySummary();
    const geminiAgg = today.providers['gemini']?.models['gemini-3.1-flash-lite'];
    assert(geminiAgg !== undefined, 'Gemini aggregate must exist');
    assert(geminiAgg.totalAttempts === 1, 'Total attempts must be 1');
    assert(geminiAgg.failedAttempts === 1, 'Failed attempts must be 1');
    assert(geminiAgg.successfulAttempts === 0, 'Successful attempts must be 0');
    assert(geminiAgg.errorCounts['QUOTA_EXHAUSTED'] === 1, 'Quota exhausted error count must be 1');
  });

  // Test 3: Retry attempt counting (attemptNumber > 1)
  test('Retry attempt counting (attemptNumber > 1)', () => {
    store.clear();
    // Attempt 1: Failed
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        httpStatus: 503,
        errorCategory: 'TRANSIENT_ERROR',
        latencyMs: 400,
      },
      store
    );

    // Attempt 2: Succeeded (Retry)
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 2,
        fallbackUsed: false,
        success: true,
        httpStatus: 200,
        latencyMs: 650,
      },
      store
    );

    const today = store.getTodaySummary();
    const groqAgg = today.providers['groq']?.models['openai/gpt-oss-120b'];
    assert(groqAgg.totalAttempts === 2, 'Total attempts must be 2');
    assert(groqAgg.failedAttempts === 1, 'Failed attempts must be 1');
    assert(groqAgg.successfulAttempts === 1, 'Successful attempts must be 1');
    assert(groqAgg.retryAttempts === 1, 'Retry attempts must be exactly 1 (attemptNumber > 1)');
  });

  // Test 4: Fallback invocation counting (fallbackUsed === true)
  test('Fallback invocation counting (fallbackUsed === true)', () => {
    store.clear();
    // Primary Gemini fails
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        errorCategory: 'QUOTA_EXHAUSTED',
        latencyMs: 200,
      },
      store
    );

    // Fallback Groq succeeds
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 1,
        fallbackUsed: true,
        success: true,
        latencyMs: 900,
      },
      store
    );

    const today = store.getTodaySummary();
    const geminiAgg = today.providers['gemini']?.models['gemini-3.1-flash-lite'];
    const groqAgg = today.providers['groq']?.models['openai/gpt-oss-120b'];

    assert(geminiAgg.fallbackInvocations === 0, 'Gemini primary must have 0 fallback invocations');
    assert(groqAgg.fallbackInvocations === 1, 'Groq fallback must have 1 fallback invocation');
    assert(today.providers['groq'].fallbackInvocations === 1, 'Provider rollup must record fallback invocation');
  });

  // Test 5: Generation + verification operation separation
  test('Generation + verification operation separation', () => {
    store.clear();
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 800,
      },
      store
    );

    recordUsageAttempt(
      {
        operation: 'VERIFICATION',
        providerId: 'gemini-blind-verifier',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 1100,
      },
      store
    );

    const recent = store.getRecentEvents();
    assert(recent.length === 2, 'Must record 2 events');
    assert(recent[0].operation === 'GENERATION', 'Event 1 must be GENERATION');
    assert(recent[1].operation === 'VERIFICATION', 'Event 2 must be VERIFICATION');
    assert(recent[1].providerId === 'gemini-blind-verifier', 'Verifier provider must be distinct');

    const today = store.getTodaySummary();
    assert(today.providers['gemini'] !== undefined, 'Generator provider must exist in summary');
    assert(today.providers['gemini-blind-verifier'] !== undefined, 'Verifier provider must exist in summary');
  });

  // Test 6: Token fields remain null when unavailable
  test('Token fields remain null when unavailable', () => {
    store.clear();
    const evt = buildUsageEvent({
      operation: 'GENERATION',
      providerId: 'mock-provider',
      modelId: 'mock-model',
      attemptNumber: 1,
      fallbackUsed: false,
      success: true,
      latencyMs: 100,
      // No token fields passed
    });

    assert(evt.inputTokens === null, 'inputTokens must be null when undefined');
    assert(evt.outputTokens === null, 'outputTokens must be null when undefined');
    assert(evt.totalTokens === null, 'totalTokens must be null when undefined');
  });

  // Test 7: Known token usage aggregates correctly
  test('Known token usage aggregates correctly without inventing counts', () => {
    store.clear();
    // Call 1 with known tokens
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 500,
        inputTokens: 500,
        outputTokens: 200,
        totalTokens: 700,
      },
      store
    );

    // Call 2 with null tokens
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 2,
        fallbackUsed: false,
        success: true,
        latencyMs: 520,
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      },
      store
    );

    // Call 3 with known tokens
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 480,
        inputTokens: 300,
        outputTokens: 150,
        totalTokens: 450,
      },
      store
    );

    const today = store.getTodaySummary();
    const agg = today.providers['gemini'].models['gemini-3.1-flash-lite'];
    assert(agg.totalAttempts === 3, 'Total attempts must be 3');
    assert(agg.totalInputTokens === 800, `Input tokens must sum to 800 (got ${agg.totalInputTokens})`);
    assert(agg.totalOutputTokens === 350, `Output tokens must sum to 350 (got ${agg.totalOutputTokens})`);
    assert(agg.totalTokens === 1150, `Total tokens must sum to 1150 (got ${agg.totalTokens})`);
  });

  // Test 8: Multiple providers do not double-count logical requests
  test('Multiple providers do not double-count logical requests', () => {
    store.clear();
    const reqId = 'req-failover-logical-001';

    // 1 physical call to Gemini (fails)
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        latencyMs: 300,
        requestId: reqId,
      },
      store
    );

    // 1 physical call to Groq (succeeds)
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 1,
        fallbackUsed: true,
        success: true,
        latencyMs: 700,
        requestId: reqId,
      },
      store
    );

    // Record the logical outcome for the overall request cycle
    recordLogicalRequest('GENERATION', true, reqId, undefined, store);

    const today = store.getTodaySummary();
    // Physical attempts: 1 Gemini + 1 Groq = 2
    assert(today.providers['gemini'].totalAttempts === 1, 'Gemini physical attempts must be 1');
    assert(today.providers['groq'].totalAttempts === 1, 'Groq physical attempts must be 1');

    // Logical request: Exactly 1 logical request, 1 success
    assert(today.operations.GENERATION.logicalRequests === 1, 'Logical requests must be exactly 1');
    assert(today.operations.GENERATION.logicalSuccesses === 1, 'Logical successes must be exactly 1');
    assert(today.operations.GENERATION.logicalFailures === 0, 'Logical failures must be 0');
  });

  // Test 9: Provider-level physical attempts are counted correctly
  test('Provider-level physical attempts are counted correctly', () => {
    store.clear();
    for (let i = 1; i <= 5; i++) {
      recordUsageAttempt(
        {
          operation: 'GENERATION',
          providerId: 'gemini',
          modelId: 'gemini-3.1-flash-lite',
          attemptNumber: 1,
          fallbackUsed: false,
          success: i % 2 !== 0, // 3 successes, 2 failures
          latencyMs: 100 * i,
        },
        store
      );
    }

    const today = store.getTodaySummary();
    const gemini = today.providers['gemini'];
    assert(gemini.totalAttempts === 5, 'Total physical attempts must be 5');
    assert(gemini.successfulAttempts === 3, 'Successful physical attempts must be 3');
    assert(gemini.failedAttempts === 2, 'Failed physical attempts must be 2');
    assert(gemini.averageLatencyMs === 300, `Average latency must be 300ms (got ${gemini.averageLatencyMs})`);
  });

  // Test 10: Daily aggregation by IST date (Asia/Kolkata)
  test('Daily aggregation by IST date (Asia/Kolkata)', () => {
    store.clear();
    // UTC 2026-09-10T19:00:00Z is 2026-09-11T00:30:00+05:30 in Asia/Kolkata
    const utcTimestampCrossMidnight = '2026-09-10T19:00:00.000Z';
    const istDate = getKolkataDateString(utcTimestampCrossMidnight);
    assert(istDate === '2026-09-11', `IST date must roll over to 2026-09-11 (got ${istDate})`);

    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 250,
        timestamp: utcTimestampCrossMidnight,
      },
      store
    );

    const summaryNextDay = store.getTodaySummary('2026-09-11');
    assert(summaryNextDay.providers['gemini'] !== undefined, 'Event must aggregate into 2026-09-11 in IST');
    assert(summaryNextDay.providers['gemini'].totalAttempts === 1, 'Must have 1 attempt on 2026-09-11');
  });

  // Test 11: Rolling 7-day retention
  test('Rolling 7-day retention prunes days exceeding 7', () => {
    store.clear();
    // Insert 10 different consecutive dates
    for (let day = 1; day <= 10; day++) {
      const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
      // Simulate timestamp noon IST (06:30 UTC)
      const ts = `${dateStr}T06:30:00.000Z`;
      recordUsageAttempt(
        {
          operation: 'GENERATION',
          providerId: 'gemini',
          modelId: 'gemini-3.1-flash-lite',
          attemptNumber: 1,
          fallbackUsed: false,
          success: true,
          latencyMs: 200,
          timestamp: ts,
        },
        store
      );
    }

    const allAggregates = store.getDailyAggregates();
    assert(allAggregates.length === 7, `Store must retain at most 7 days (retained ${allAggregates.length})`);
    assert(allAggregates[0].date === '2026-09-04', `Oldest retained date must be 2026-09-04 (got ${allAggregates[0].date})`);
    assert(allAggregates[6].date === '2026-09-10', `Newest retained date must be 2026-09-10 (got ${allAggregates[6].date})`);
  });

  // Test 12: Maximum 100 recent granular events (FIFO ring buffer)
  test('Maximum 100 recent granular events (FIFO ring buffer)', () => {
    store.clear();
    for (let i = 1; i <= 150; i++) {
      recordUsageAttempt(
        {
          operation: 'GENERATION',
          providerId: 'gemini',
          modelId: 'gemini-3.1-flash-lite',
          attemptNumber: 1,
          fallbackUsed: false,
          success: true,
          latencyMs: 100,
          requestId: `req-${i}`,
        },
        store
      );
    }

    const recent = store.getRecentEvents(200);
    assert(recent.length === 100, `Recent events buffer must cap at 100 (got ${recent.length})`);
    assert(recent[0].requestId === 'req-51', `First event in ring buffer must be req-51 (got ${recent[0].requestId})`);
    assert(recent[99].requestId === 'req-150', `Last event in ring buffer must be req-150 (got ${recent[99].requestId})`);
  });

  // Test 13: Quota NORMAL status (< 80%)
  test('Quota NORMAL status (< 80%)', () => {
    const evalResult = evaluateProviderQuota('gemini', 790, 1000);
    assert(evalResult.status === 'NORMAL', `Quota status must be NORMAL (got ${evalResult.status})`);
    assert(evalResult.usagePercentage === 79, `Usage percentage must be 79% (got ${evalResult.usagePercentage})`);
  });

  // Test 14: Quota WARNING status (>= 80% and < 100%)
  test('Quota WARNING status (>= 80% and < 100%)', () => {
    const evalResult = evaluateProviderQuota('gemini', 800, 1000);
    assert(evalResult.status === 'WARNING', `Quota status must be WARNING at 80% (got ${evalResult.status})`);
    assert(evalResult.usagePercentage === 80, `Usage percentage must be 80% (got ${evalResult.usagePercentage})`);

    const evalResult99 = evaluateProviderQuota('gemini', 999, 1000);
    assert(evalResult99.status === 'WARNING', `Quota status must be WARNING at 99.9% (got ${evalResult99.status})`);
  });

  // Test 15: Quota EXHAUSTED status (>= 100%)
  test('Quota EXHAUSTED status (>= 100%)', () => {
    const evalResult100 = evaluateProviderQuota('gemini', 1000, 1000);
    assert(evalResult100.status === 'EXHAUSTED', `Quota status must be EXHAUSTED at 100% (got ${evalResult100.status})`);

    const evalResult150 = evaluateProviderQuota('gemini', 1500, 1000);
    assert(evalResult150.status === 'EXHAUSTED', `Quota status must be EXHAUSTED above 100% (got ${evalResult150.status})`);
  });

  // Test 16: Null/unbounded quota
  test('Null/unbounded quota defaults correctly', () => {
    const evalResult = evaluateProviderQuota('unknown-provider', 500, null);
    assert(evalResult.status === 'UNBOUNDED', `Quota status must be UNBOUNDED when limit is null`);
    assert(evalResult.dailyLimit === null, 'dailyLimit must be null');
    assert(evalResult.usagePercentage === null, 'usagePercentage must be null');
  });

  // Test 17: Sanitized recent failures contain no secrets/prompts/responses
  test('Sanitized recent failures contain no secrets/prompts/responses', () => {
    store.clear();
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        httpStatus: 401,
        errorCategory: 'AUTH_ERROR',
        latencyMs: 150,
        requestId: 'req-auth-fail',
      },
      store
    );

    const failures = store.getRecentFailures();
    assert(failures.length === 1, 'Must have 1 failure recorded');
    const f = failures[0];

    assert(f.providerId === 'groq', 'Provider ID must match');
    assert(f.errorCategory === 'AUTH_ERROR', 'Error category must match');
    assert(f.success === false, 'Success must be false');

    // Confirm no leaking keys or payloads exist on the object
    const keys = Object.keys(f);
    assert(!keys.includes('apiKey'), 'Must not contain apiKey');
    assert(!keys.includes('prompt'), 'Must not contain prompt');
    assert(!keys.includes('response'), 'Must not contain response');
    assert(!keys.includes('authorization'), 'Must not contain authorization');
    assert(!keys.includes('headers'), 'Must not contain headers');
  });

  // Test 18: Collector reset works (clear() resets events & rollups)
  test('Collector reset works (clear() resets events & rollups)', () => {
    store.clear();
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 200,
      },
      store
    );

    assert(store.getRecentEvents().length === 1, 'Pre-condition: 1 event in store');
    store.clear();
    assert(store.getRecentEvents().length === 0, 'Recent events must be empty after clear()');
    assert(store.getDailyAggregates().length === 0, 'Daily aggregates must be empty after clear()');
  });

  // Test 19: Failed terminal generation can be represented
  test('Failed terminal generation can be represented', () => {
    store.clear();
    const reqId = 'req-terminal-fail-999';

    // Provider 1 fails
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        httpStatus: 429,
        errorCategory: 'QUOTA_EXHAUSTED',
        latencyMs: 250,
        requestId: reqId,
      },
      store
    );

    // Provider 2 fails
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'groq',
        modelId: 'openai/gpt-oss-120b',
        attemptNumber: 1,
        fallbackUsed: true,
        success: false,
        httpStatus: 503,
        errorCategory: 'TRANSIENT_ERROR',
        latencyMs: 400,
        requestId: reqId,
      },
      store
    );

    // Logical operation fails terminally
    recordLogicalRequest('GENERATION', false, reqId, undefined, store);

    const today = store.getTodaySummary();
    assert(today.operations.GENERATION.logicalRequests === 1, 'Logical requests must be 1');
    assert(today.operations.GENERATION.logicalSuccesses === 0, 'Logical successes must be 0');
    assert(today.operations.GENERATION.logicalFailures === 1, 'Logical failures must be 1');

    assert(today.providers['gemini'].failedAttempts === 1, 'Gemini failed attempts must be 1');
    assert(today.providers['groq'].failedAttempts === 1, 'Groq failed attempts must be 1');
  });

  // Test 20: Verifier failure can be represented independently
  test('Verifier failure can be represented independently', () => {
    store.clear();
    const reqId = 'req-verif-fail-555';

    // Generation succeeded
    recordUsageAttempt(
      {
        operation: 'GENERATION',
        providerId: 'gemini',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: true,
        latencyMs: 800,
        requestId: reqId,
      },
      store
    );
    recordLogicalRequest('GENERATION', true, reqId, undefined, store);

    // Verifier failed
    recordUsageAttempt(
      {
        operation: 'VERIFICATION',
        providerId: 'gemini-blind-verifier',
        modelId: 'gemini-3.1-flash-lite',
        attemptNumber: 1,
        fallbackUsed: false,
        success: false,
        httpStatus: 504,
        errorCategory: 'TIMEOUT',
        latencyMs: 30000,
        requestId: reqId,
      },
      store
    );
    recordLogicalRequest('VERIFICATION', false, reqId, undefined, store);

    const today = store.getTodaySummary();
    assert(today.operations.GENERATION.logicalSuccesses === 1, 'Generation logical success must be 1');
    assert(today.operations.VERIFICATION.logicalFailures === 1, 'Verification logical failure must be 1');

    const verifierAgg = today.providers['gemini-blind-verifier'].models['gemini-3.1-flash-lite'];
    assert(verifierAgg.failedAttempts === 1, 'Verifier failed attempt must be 1');
    assert(verifierAgg.errorCounts['TIMEOUT'] === 1, 'Verifier timeout error count must be 1');
  });

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
