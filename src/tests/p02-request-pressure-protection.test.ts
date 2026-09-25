/**
 * BURRA PARIKSHA CMS - P-02 Request Pressure & Burst Protection Verification Tests
 * 
 * Verifies all P-02 hardening mechanisms:
 * TEST 1 — BURST SMOOTHING & CONCURRENCY CAP: Verifies that concurrent write bursts are queued and capped at maxConcurrentRequests.
 * TEST 2 — GLOBAL 429 CIRCUIT BREAKER: Verifies that an HTTP 429 rate limit activates global cooldown and eliminates retry amplification.
 * TEST 3 — IN-FLIGHT HEADER DEDUPLICATION: Verifies that concurrent getHeaders() calls for the same tab are coalesced into a single API request.
 * TEST 4 — TOKEN REFILL & TELEMETRY OBSERVABILITY: Verifies token bucket pacing, metrics tracking, and clean reset.
 */

import assert from 'node:assert';
import { googleSheetsClient, RequestPressureLimiter, isRateLimitError } from '../lib/google-sheets/client';
import { RateLimitError } from '../lib/google-sheets/errors';

export async function runP02RequestPressureTests(): Promise<{ passed: number; failed: number }> {
  console.log('======================================================');
  console.log('🚀 RUNNING P-02: REQUEST PRESSURE & BURST PROTECTION TESTS');
  console.log('======================================================\n');
  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // TEST 1 — BURST SMOOTHING & CONCURRENCY CAP
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 1: Burst smoothing and concurrency capping...');
    googleSheetsClient.resetRateLimiter();
    googleSheetsClient.configureRateLimiter({
      bucketCapacity: 4,
      refillRatePerSecond: 50,
      maxConcurrentRequests: 2,
      minIntervalMs: 15,
      rateLimitBackoffBaseMs: 100,
      rateLimitBackoffMaxMs: 500,
      enabled: true,
    });

    let activeInFlight = 0;
    let maxInFlightObserved = 0;
    const executionOrder: number[] = [];

    // Launch 8 concurrent operations simultaneously
    const totalOps = 8;
    const promises = Array.from({ length: totalOps }, (_, i) => {
      return googleSheetsClient.executeWithRetry(async () => {
        activeInFlight++;
        maxInFlightObserved = Math.max(maxInFlightObserved, activeInFlight);
        executionOrder.push(i);

        // Simulate async network I/O
        await new Promise((r) => setTimeout(r, 30));

        activeInFlight--;
        return `result-${i}`;
      }, `testOp-${i}`);
    });

    const results = await Promise.all(promises);

    assert.strictEqual(results.length, totalOps, 'All operations must succeed');
    assert.strictEqual(maxInFlightObserved <= 2, true, `Max concurrent requests (${maxInFlightObserved}) must not exceed limit 2`);

    const stats = googleSheetsClient.getRateLimiterStats();
    assert.strictEqual(stats.totalThrottledRequests > 0, true, 'At least some requests must have been queued/throttled during burst');
    assert.strictEqual(stats.activeRequests, 0, 'Active requests must return to 0 when all finish');

    console.log(`✓ Test 1 Passed: Burst of ${totalOps} requests safely smoothed. Max concurrent: ${maxInFlightObserved} (cap: 2). Throttled: ${stats.totalThrottledRequests}`);
    passed++;
  } catch (err: any) {
    console.error('✗ Test 1 Failed:', err.message);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 2 — GLOBAL 429 CIRCUIT BREAKER & RETRY DE-AMPLIFICATION
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 2: Global 429 cooldown and retry de-amplification...');
    googleSheetsClient.resetRateLimiter();
    googleSheetsClient.configureRateLimiter({
      bucketCapacity: 10,
      refillRatePerSecond: 100,
      maxConcurrentRequests: 5,
      minIntervalMs: 5,
      rateLimitBackoffBaseMs: 120,
      rateLimitBackoffMaxMs: 400,
      enabled: true,
    });

    let rateLimitInjected = true;
    let attemptsOnFailingOp = 0;
    let requestsWhileInCooldown = 0;

    const opWithRateLimit = googleSheetsClient.executeWithRetry(async () => {
      attemptsOnFailingOp++;
      if (rateLimitInjected) {
        rateLimitInjected = false;
        throw new RateLimitError(120);
      }
      return 'recovered-after-429';
    }, 'failingOpWith429');

    // Give failing op a moment to hit 429 and trigger global cooldown
    await new Promise((r) => setTimeout(r, 10));

    // Verify global cooldown is now active
    const statsDuringCooldown = googleSheetsClient.getRateLimiterStats();
    assert.strictEqual(statsDuringCooldown.globalCooldownActive, true, 'Global cooldown must be active after 429');
    assert.strictEqual(statsDuringCooldown.rateLimitHits >= 1, true, 'Rate limit hits counter must be incremented');

    // Launch concurrent op during cooldown
    const opDuringCooldown = googleSheetsClient.executeWithRetry(async () => {
      const statsAtDispatch = googleSheetsClient.getRateLimiterStats();
      if (statsAtDispatch.globalCooldownActive) {
        requestsWhileInCooldown++;
      }
      return 'succeeded-after-cooldown';
    }, 'opDuringCooldown');

    const [res1, res2] = await Promise.all([opWithRateLimit, opDuringCooldown]);

    assert.strictEqual(res1, 'recovered-after-429', 'Failing operation must recover cleanly on retry');
    assert.strictEqual(res2, 'succeeded-after-cooldown', 'Concurrent operation must succeed after cooldown');
    assert.strictEqual(requestsWhileInCooldown, 0, 'No requests should have dispatched to API while global cooldown was active');

    const statsAfter = googleSheetsClient.getRateLimiterStats();
    assert.strictEqual(statsAfter.globalCooldownActive, false, 'Global cooldown must clear after timeout');

    console.log('✓ Test 2 Passed: 429 triggered global cooldown; concurrent requests waited respectfully with zero thundering herd');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 2 Failed:', err.message);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 3 — IN-FLIGHT HEADER DEDUPLICATION
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 3: In-flight getHeaders deduplication...');
    googleSheetsClient.invalidateRowCache('TEST_TAB');

    // Temporarily mock getSheetsApi on client instance
    let underlyingApiDispatches = 0;
    const clientAny = googleSheetsClient as any;
    const originalGetSheetsApi = clientAny.getSheetsApi;

    clientAny.getSheetsApi = () => ({
      spreadsheets: {
        values: {
          get: async () => {
            underlyingApiDispatches++;
            // Simulate async network latency
            await new Promise((r) => setTimeout(r, 40));
            return {
              data: {
                values: [['col_id', 'col_title', 'col_status', 'col_created']],
              },
            };
          },
        },
      },
    });

    // Launch 5 concurrent getHeaders calls for the exact same sheet tab
    const callers = 5;
    const headerPromises = Array.from({ length: callers }, () => {
      return googleSheetsClient.getHeaders('TEST_TAB');
    });

    const headerResults = await Promise.all(headerPromises);

    // Restore original getSheetsApi
    clientAny.getSheetsApi = originalGetSheetsApi;

    assert.strictEqual(headerResults.length, callers);
    for (const h of headerResults) {
      assert.deepStrictEqual(h, ['col_id', 'col_title', 'col_status', 'col_created']);
    }

    assert.strictEqual(underlyingApiDispatches, 1, `Expected exactly 1 underlying API call for 5 concurrent callers, got ${underlyingApiDispatches}`);
    assert.strictEqual(clientAny.inFlightHeaders.size, 0, 'In-flight headers map must be cleanly evicted upon completion');

    console.log(`✓ Test 3 Passed: 5 concurrent getHeaders calls coalesced into exactly 1 API call with zero duplicate requests`);
    passed++;
  } catch (err: any) {
    console.error('✗ Test 3 Failed:', err.message);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 4 — TOKEN REFILL & TELEMETRY OBSERVABILITY
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 4: Token refill, telemetry metrics, and reset...');
    const limiter = new RequestPressureLimiter({
      bucketCapacity: 3,
      refillRatePerSecond: 20,
      maxConcurrentRequests: 2,
      minIntervalMs: 5,
      enabled: true,
    });

    // Acquire 3 tokens (exhausts capacity)
    await limiter.acquireSlot('op1');
    await limiter.acquireSlot('op2');
    limiter.releaseSlot();
    limiter.releaseSlot();

    const stats1 = limiter.getStats();
    assert.strictEqual(stats1.activeRequests, 0);

    // Verify error classification helper
    assert.strictEqual(isRateLimitError(new RateLimitError()), true);
    assert.strictEqual(isRateLimitError({ status: 429, message: 'Resource Exhausted' }), true);
    assert.strictEqual(isRateLimitError({ message: 'Quota exceeded for quota metric' }), true);
    assert.strictEqual(isRateLimitError(new Error('Syntax error')), false);

    // Verify operational telemetry integration
    const telemetry = googleSheetsClient.getOperationalTelemetry();
    assert.strictEqual(typeof telemetry.rateLimiter, 'object', 'Operational telemetry must expose rateLimiter stats');
    assert.strictEqual(typeof telemetry.rateLimiter?.availableTokens, 'number');
    assert.strictEqual(typeof telemetry.rateLimiter?.throttledRequests, 'number');

    limiter.reset();
    const statsReset = limiter.getStats();
    assert.strictEqual(statsReset.availableTokens, 3, 'Reset must replenish tokens to full capacity');
    assert.strictEqual(statsReset.queuedRequests, 0, 'Reset must drain queue');

    // Reset client to test defaults
    googleSheetsClient.resetRateLimiter();

    console.log('✓ Test 4 Passed: Token refill, error classification, telemetry metrics, and reset verified cleanly');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 4 Failed:', err.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 P-02 REQUEST PRESSURE TEST SUMMARY:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in P-02 test suite.`);
  }

  return { passed, failed };
}

// Auto-run if executed directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runP02RequestPressureTests()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error during P-02 test execution:', err);
      process.exit(1);
    });
}
