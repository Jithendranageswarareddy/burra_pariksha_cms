import { apiClient } from '../lib/api-client';

async function runHeaderRegression() {
  console.log('=== STARTING API CLIENT HEADER REGRESSION TESTS ===');
  let failures = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failures++;
    }
  }

  const originalFetch = globalThis.fetch;
  let lastFetchUrl = '';
  let lastFetchOptions: any = null;

  // Mock global fetch to capture request options
  globalThis.fetch = (async (url: string, options: any) => {
    lastFetchUrl = url;
    lastFetchOptions = options;
    return {
      ok: true,
      json: async () => ({ status: 'success', data: {} })
    } as any;
  }) as any;

  try {
    // 1. request without custom headers has Content-Type
    await (apiClient as any).request('/test-endpoint', {
      method: 'POST',
      body: JSON.stringify({ hello: 'world' })
    });

    assert(
      lastFetchOptions && lastFetchOptions.headers && lastFetchOptions.headers['Content-Type'] === 'application/json',
      'Test 1: Request without custom headers preserves Content-Type: application/json'
    );

    // 2 & 3. request with x-idempotency-key still has Content-Type, and x-idempotency-key is preserved
    await (apiClient as any).request('/test-endpoint', {
      method: 'POST',
      headers: {
        'x-idempotency-key': 'test-key-12345'
      },
      body: JSON.stringify({ hello: 'world' })
    });

    assert(
      lastFetchOptions && lastFetchOptions.headers && lastFetchOptions.headers['Content-Type'] === 'application/json',
      'Test 2: Request with custom headers STILL preserves Content-Type: application/json'
    );

    assert(
      lastFetchOptions && lastFetchOptions.headers && lastFetchOptions.headers['x-idempotency-key'] === 'test-key-12345',
      'Test 3: x-idempotency-key custom header is perfectly preserved'
    );

    // 4. JSON body remains intact
    assert(
      lastFetchOptions && lastFetchOptions.body === JSON.stringify({ hello: 'world' }),
      'Test 4: JSON body payload remains fully intact'
    );

  } catch (err: any) {
    console.error('Unexpected error during API Client Header regression:', err);
    failures++;
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log(`=== HEADER REGRESSION SUMMARY: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ===`);
  if (failures > 0) {
    process.exit(1);
  }
}

runHeaderRegression().catch((err) => {
  console.error('Fatal error in regression suite:', err);
  process.exit(1);
});
