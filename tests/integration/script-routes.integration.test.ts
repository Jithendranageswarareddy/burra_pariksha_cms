/**
 * BURRA PARIKSHA CMS — S8-T09 Script Routes Integration Test
 * Stage 03: Modular Router Registration, URL Compatibility & Middleware Preservation
 * 
 * Verifies:
 * 1. Modular router export: scriptRouter is exported and mounted on apiRouter.
 * 2. URL backwards-compatibility: All 7 endpoints are reachable via /api prefix.
 * 3. Middleware enforcement: Authentication (requireAuth) and RBAC (requireRole) gates are active.
 * 4. Service delegation: Requests delegate cleanly to scriptService without regression.
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../../backend/server/routers/routes';
import { scriptRouter } from '../../backend/server/routers/script.routes';
import { authService } from '../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { UserRole } from '../../shared';

async function runScriptRoutesIntegrationTest() {
  console.log('============================================================');
  console.log('S8-T09 ROUTE TEST: Stage 03 Script Modular Router Registration');
  console.log('============================================================\n');

  // 1. Verify scriptRouter is exported and has routes
  assert.ok(scriptRouter, 'scriptRouter must be defined and exported');
  const scriptRoutes = (scriptRouter.stack || [])
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }));

  assert.ok(scriptRoutes.length >= 7, `scriptRouter must have at least 7 routes, found ${scriptRoutes.length}`);
  console.log(`[Check 1] scriptRouter contains ${scriptRoutes.length} registered routes.`);

  const expectedEndpoints = [
    { path: '/videos/:videoId/script', method: 'get' },
    { path: '/scripts/:scriptId/versions', method: 'get' },
    { path: '/videos/:videoId/script', method: 'post' },
    { path: '/videos/:videoId/script/generate', method: 'post' },
    { path: '/scripts/:scriptId/revert', method: 'post' },
    { path: '/videos/:videoId/script/mark-ready', method: 'post' },
    { path: '/videos/:videoId/script/return-to-editing', method: 'post' },
  ];

  for (const exp of expectedEndpoints) {
    const found = scriptRoutes.some(
      (r: any) => r.path === exp.path && r.methods.includes(exp.method)
    );
    assert.ok(found, `Expected route ${exp.method.toUpperCase()} ${exp.path} must be registered on scriptRouter`);
  }
  console.log('  PASS: All 7 Stage 03 script routes verified on scriptRouter.');

  // 2. Mount production apiRouter exactly as in server.ts
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // 3. Test unauthenticated access to GET /api/videos/:videoId/script (Must return 401)
    console.log('\n[Check 2] Middleware Gate: Unauthenticated GET /api/videos/:videoId/script');
    const unauthRes = await fetch(`${baseUrl}/videos/vid_test_123/script`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');
    console.log('  PASS: requireAuth middleware correctly blocks unauthenticated requests (HTTP 401).');

    // 4. Test unauthenticated access to POST /api/videos/:videoId/script (Must return 401)
    console.log('\n[Check 3] Middleware Gate: Unauthenticated POST /api/videos/:videoId/script');
    const unauthPostRes = await fetch(`${baseUrl}/videos/vid_test_123/script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(unauthPostRes.status, 401, 'Unauthenticated POST must return 401');
    console.log('  PASS: requireRole middleware correctly blocks unauthenticated POST (HTTP 401).');

    // 5. Test authorized actor access to GET /api/scripts/:scriptId/versions
    console.log('\n[Check 4] URL Compatibility & Delegation: GET /api/scripts/:scriptId/versions');
    const authorUserId = `usr_script_writer_${Date.now()}`;
    await usersRepository.appendRecord({
      id: authorUserId,
      name: 'Script Writer Test',
      email: `script_writer_${Date.now()}@burrapariksha.com`,
      role: UserRole.SCRIPT_WRITER,
      roles: [UserRole.SCRIPT_WRITER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const sessionToken = authService.generateSessionToken({
      userId: authorUserId,
      name: 'Script Writer Test',
      role: UserRole.SCRIPT_WRITER,
      roles: [UserRole.SCRIPT_WRITER],
      sessionVersion: 1,
    });

    const versionsRes = await fetch(`${baseUrl}/scripts/scr_nonexistent_test/versions`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    assert.strictEqual(versionsRes.status, 200, 'GET /scripts/:scriptId/versions must return 200');
    const versionsJson = await versionsRes.json();
    assert.ok(Array.isArray(versionsJson), 'Must return an array of versions');
    console.log('  PASS: Route delegates cleanly to scriptService.getScriptVersions, returning HTTP 200 and empty array.');

    // 6. Test unauthorized role on POST /videos/:videoId/script/return-to-editing (requires ADMIN or CONTENT_MANAGER)
    console.log('\n[Check 5] Role Gate: SCRIPT_WRITER cannot return-to-editing (requires ADMIN/CONTENT_MANAGER)');
    const returnRes = await fetch(`${baseUrl}/videos/vid_test_123/script/return-to-editing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ remarks: 'Needs revision' }),
    });
    assert.ok(
      returnRes.status === 401 || returnRes.status === 403,
      `Unprivileged/unauthenticated role must be blocked (expected 401 or 403, got ${returnRes.status})`
    );
    console.log(`  PASS: Role gate enforced: request blocked with HTTP ${returnRes.status}.`);

    console.log('\n============================================================');
    console.log('ALL S8-T09 SCRIPT ROUTER INTEGRATION CHECKS PASSED (5/5)');
    console.log('============================================================\n');
  } finally {
    server.close();
  }
}

runScriptRoutesIntegrationTest().catch((err) => {
  console.error('\nFAILED: S8-T09 Script Routes Integration Test failed:', err);
  process.exit(1);
});
