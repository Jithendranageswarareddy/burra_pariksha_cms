/**
 * S7-T07 Runtime Smoke Test
 * Tests backend startup, HTTP routing, Firestore access, and clean shutdown.
 */
import '../../src/config/env';
import express from 'express';
import http from 'http';
import { apiRouter } from '../../backend/server/routers/routes';
import { healthRouter } from '../../backend/server/health.routes';
import { topicsRepository } from '../../database/firestore/repositories/topics.repository';
import assert from 'node:assert';

async function runRuntimeSmokeTest() {
  console.log('--- Starting S7-T07 Runtime Smoke Test ---');

  const app = express();
  app.set('trust proxy', 1);
  app.use(healthRouter);
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  const PORT = 4889;

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  console.log(`Server listening on port ${PORT}`);

  try {
    // 1. Health check
    console.log('Testing /healthz...');
    const healthzRes = await fetch(`http://127.0.0.1:${PORT}/healthz`);
    assert.strictEqual(healthzRes.status, 200, '/healthz should return 200');
    console.log('✓ /healthz returned 200');

    // 2. Readiness check
    console.log('Testing /readyz...');
    const readyzRes = await fetch(`http://127.0.0.1:${PORT}/readyz`);
    assert.strictEqual(readyzRes.status, 200, '/readyz should return 200');
    console.log('✓ /readyz returned 200');

    // 3. API Health check
    console.log('Testing /api/health...');
    const apiHealthRes = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    assert.strictEqual(apiHealthRes.status, 200, '/api/health should return 200');
    console.log('✓ /api/health returned 200');

    // 4. Auth Endpoint check (invalid credentials test)
    console.log('Testing /api/v1/auth/login invalid credentials rejection...');
    const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'wrongpassword' }),
    });
    assert.strictEqual(loginRes.status, 401, 'Invalid login should return 401');
    console.log('✓ /api/v1/auth/login rejected invalid credentials with 401');

    // 5. Firestore Read via Topics Repository
    console.log('Testing Firestore read through TopicsRepository...');
    const topics = await topicsRepository.findAll();
    assert(Array.isArray(topics), 'topicsRepository.findAll() must return an array');
    console.log(`✓ Firestore TopicsRepository read succeeded: ${topics.length} topics retrieved`);

    console.log('--- All Runtime Smoke Checks Succeeded! ---');
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    console.log('Server shut down cleanly.');
  }
}

runRuntimeSmokeTest()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Smoke test failed:', err);
    process.exit(1);
  });
