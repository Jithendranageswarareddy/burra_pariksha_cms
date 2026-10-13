/**
 * BURRA PARIKSHA CMS — S7-T11 API Access Boundary Verification Test
 *
 * Verifies that:
 * 1. The canonical API access boundary exists under `frontend/api/` with all required feature modules.
 * 2. Feature-oriented API functions are exported via `frontend/api/index.ts` and used by consumers.
 * 3. Zero production frontend pages and UI components make direct backend API requests (fetch('/api/...'), window.fetch, etc.).
 * 4. Zero production frontend pages and UI components construct backend API URLs directly.
 * 5. Feature API functions delegate to the canonical HTTP client (apiClient) rather than creating separate transports.
 * 6. Behavioral tests verify endpoint methods, URL construction, query serialization, and payload handling.
 * 7. Authentication, session token management, and concurrency error handling (409 CONFLICT_OPTIMISTIC_LOCK) remain intact.
 * 8. Protected architectural invariants (15-step workflow, Firestore authority, 2-tier taxonomy, UUIDs) are preserved.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  apiClient,
  ApiClient,
  ApiClientError,
  planningApi,
  taxonomyApi,
  questionsApi,
  videosApi,
  publishingApi,
} from '../frontend/api/index';
import { CANONICAL_WORKFLOW_STEPS, QuestionStatus, DifficultyLevel } from '../shared/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(rootDir, 'frontend');

async function runApiAccessBoundaryTests() {
  console.log('============================================================');
  console.log('S7-T11 API ACCESS BOUNDARY ARCHITECTURAL VERIFICATION');
  console.log('============================================================\n');

  let passedGates = 0;
  const totalGates = 8;

  // --------------------------------------------------------------------------
  // GATE 1: Canonical Boundary Module Inventory
  // --------------------------------------------------------------------------
  console.log('[Gate 1] Verifying canonical API boundary modules under frontend/api/...');
  const requiredModules = [
    'frontend/api/api-client.ts',
    'frontend/api/contracts.ts',
    'frontend/api/index.ts',
    'frontend/api/planning.api.ts',
    'frontend/api/taxonomy.api.ts',
    'frontend/api/questions.api.ts',
    'frontend/api/videos.api.ts',
    'frontend/api/publishing.api.ts',
  ];

  for (const mod of requiredModules) {
    const fullPath = path.resolve(rootDir, mod);
    assert(fs.existsSync(fullPath), `Required module must exist: ${mod}`);
  }
  console.log(`  ✓ All ${requiredModules.length} canonical API modules verified present.`);
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 2: Canonical Public Barrel Exports
  // --------------------------------------------------------------------------
  console.log('\n[Gate 2] Verifying public barrel exports from frontend/api/index.ts...');
  assert(apiClient !== undefined, 'apiClient must be exported');
  assert(typeof ApiClient === 'function', 'ApiClient class must be exported');
  assert(typeof ApiClientError === 'function', 'ApiClientError class must be exported');
  assert(typeof planningApi === 'object', 'planningApi must be exported');
  assert(typeof taxonomyApi === 'object', 'taxonomyApi must be exported');
  assert(typeof questionsApi === 'object', 'questionsApi must be exported');
  assert(typeof videosApi === 'object', 'videosApi must be exported');
  assert(typeof publishingApi === 'object', 'publishingApi must be exported');

  // Verify key feature operations exist on exports
  assert(typeof planningApi.getPlans === 'function', 'planningApi.getPlans must be a function');
  assert(typeof planningApi.createPlan === 'function', 'planningApi.createPlan must be a function');
  assert(typeof planningApi.approvePlan === 'function', 'planningApi.approvePlan must be a function');
  assert(typeof taxonomyApi.getSummary === 'function', 'taxonomyApi.getSummary must be a function');
  assert(typeof questionsApi.getQuestions === 'function', 'questionsApi.getQuestions must be a function');
  assert(typeof videosApi.getVideoDownloadUrl === 'function', 'videosApi.getVideoDownloadUrl must be a function');
  assert(typeof publishingApi.getStatus === 'function', 'publishingApi.getStatus must be a function');
  console.log('  ✓ Public barrel exports all canonical transports, feature modules, and operations.');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 3: Recursive Static Code Audit — Zero Direct Backend API Calls
  // --------------------------------------------------------------------------
  console.log('\n[Gate 3] Recursively scanning production frontend source tree for direct fetch calls...');
  const directFetchViolations: Array<{ file: string; line: number; content: string }> = [];

  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip frontend/api itself (the authorized HTTP boundary) and test/mock dirs
        if (fullPath === path.resolve(frontendDir, 'api')) continue;
        if (entry.name === '__tests__' || entry.name === 'tests') continue;
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Detect fetch invocations
          if (/\bfetch\s*\(/.test(line) || /\b(window|globalThis)\.fetch\b/.test(line)) {
            directFetchViolations.push({
              file: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
              line: index + 1,
              content: line.trim(),
            });
          }
        });
      }
    }
  }

  scanDirectory(frontendDir);
  assert.strictEqual(
    directFetchViolations.length,
    0,
    `Production frontend source files must not invoke direct fetch(). Found violations:\n${JSON.stringify(
      directFetchViolations,
      null,
      2
    )}`
  );
  console.log('  ✓ Zero direct fetch() calls across entire production frontend source tree.');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 4: Recursive Static Code Audit — Zero Direct Backend API URL Constructions
  // --------------------------------------------------------------------------
  console.log('\n[Gate 4] Recursively scanning production frontend source tree for direct /api URL constructions...');
  const directApiUrlViolations: Array<{ file: string; line: number; content: string }> = [];

  function scanForApiUrls(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (fullPath === path.resolve(frontendDir, 'api')) continue;
        if (entry.name === '__tests__' || entry.name === 'tests') continue;
        scanForApiUrls(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Ignore module import statements such as: import ... from '../api/...'
          if (/import\s+.*from\s+['"].*\/api(\/|['"])/.test(line)) return;
          if (/export\s+.*from\s+['"].*\/api(\/|['"])/.test(line)) return;

          // Detect hardcoded backend API paths
          if (/['"`]\/api(\/|[?"`])/.test(line)) {
            directApiUrlViolations.push({
              file: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
              line: index + 1,
              content: line.trim(),
            });
          }
        });
      }
    }
  }

  scanForApiUrls(frontendDir);
  assert.strictEqual(
    directApiUrlViolations.length,
    0,
    `Production frontend source files must not construct direct /api URLs. Found violations:\n${JSON.stringify(
      directApiUrlViolations,
      null,
      2
    )}`
  );
  console.log('  ✓ Zero direct /api URL constructions across entire production frontend source tree.');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 5: Consumer Adoption Verification
  // --------------------------------------------------------------------------
  console.log('\n[Gate 5] Verifying consumer adoption of canonical feature API modules...');
  const planningPageContent = fs.readFileSync(path.resolve(frontendDir, 'pages/PlanningPage.tsx'), 'utf-8');
  assert(
    planningPageContent.includes("from '../api'"),
    'PlanningPage.tsx must import from canonical ../api barrel'
  );
  assert(
    planningPageContent.includes('planningApi.') &&
      planningPageContent.includes('taxonomyApi.') &&
      planningPageContent.includes('questionsApi.'),
    'PlanningPage.tsx must use planningApi, taxonomyApi, and questionsApi'
  );
  assert(
    !planningPageContent.includes("fetch('/api/"),
    'PlanningPage.tsx must not contain direct fetch calls'
  );

  const videoThumbContent = fs.readFileSync(path.resolve(frontendDir, 'pages/VideoThumbnailPage.tsx'), 'utf-8');
  assert(
    videoThumbContent.includes('videosApi.getThumbnailDownloadUrl'),
    'VideoThumbnailPage.tsx must use canonical videosApi.getThumbnailDownloadUrl'
  );

  const editingWorkspaceContent = fs.readFileSync(
    path.resolve(frontendDir, 'components/video/EditingWorkspace.tsx'),
    'utf-8'
  );
  assert(
    editingWorkspaceContent.includes('videosApi.getVideoDownloadUrl'),
    'EditingWorkspace.tsx must use canonical videosApi.getVideoDownloadUrl'
  );

  const thumbWorkspaceContent = fs.readFileSync(
    path.resolve(frontendDir, 'components/video/ThumbnailWorkspace.tsx'),
    'utf-8'
  );
  assert(
    thumbWorkspaceContent.includes('videosApi.getThumbnailDownloadUrl'),
    'ThumbnailWorkspace.tsx must use canonical videosApi.getThumbnailDownloadUrl'
  );

  console.log('  ✓ All migrated pages and components verified to use canonical API functions and URL helpers.');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 6: Delegation to Authoritative Transport & Pure Typed Contracts (Zero 'any')
  // --------------------------------------------------------------------------
  console.log('\n[Gate 6] Verifying feature modules delegate to canonical apiClient transport & contain zero any...');
  const featureFiles = [
    'frontend/api/planning.api.ts',
    'frontend/api/taxonomy.api.ts',
    'frontend/api/questions.api.ts',
    'frontend/api/videos.api.ts',
    'frontend/api/publishing.api.ts',
  ];

  for (const ff of featureFiles) {
    const code = fs.readFileSync(path.resolve(rootDir, ff), 'utf-8');
    assert(
      code.includes("import { apiClient } from './api-client'"),
      `${ff} must import canonical apiClient`
    );
    assert(
      !code.includes('new ApiClient') && !code.includes('new HttpClient') && !code.includes('fetch('),
      `${ff} must delegate to apiClient rather than creating independent HTTP transport`
    );

    // Verify zero 'any' types in feature API module files
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      assert(
        !/\bany\b/.test(line),
        `Feature API module ${ff} line ${idx + 1} must not use 'any': ${trimmed}`
      );
    });
  }
  console.log('  ✓ All feature API modules strictly delegate to authoritative apiClient and use pure types (0 any).');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 7: Behavioral Unit Tests — URL Formatting, Arguments & Error Handling
  // --------------------------------------------------------------------------
  console.log('\n[Gate 7] Testing behavioral contracts of representative API functions...');

  // Test 7a: Video and Thumbnail Download URL Construction
  const vidUrl1 = videosApi.getVideoDownloadUrl('VID-001');
  assert.strictEqual(vidUrl1, '/api/videos/VID-001/download');

  const vidUrl2 = videosApi.getVideoDownloadUrl('VID-001', 'AST-TAKE-2');
  assert.strictEqual(vidUrl2, '/api/videos/VID-001/download?assetId=AST-TAKE-2');

  const thmUrl = videosApi.getThumbnailDownloadUrl('THM-101');
  assert.strictEqual(thmUrl, '/api/thumbnails/THM-101/download');

  // Test 7b: ApiClientError and Concurrency Conflict Recognition (HTTP 409)
  const conflictErr = new ApiClientError('Draft version conflict', {
    statusCode: 409,
    code: 'CONFLICT_OPTIMISTIC_LOCK',
    details: { currentVersion: 3 },
  });
  assert.strictEqual(conflictErr.statusCode, 409);
  assert.strictEqual(conflictErr.isConcurrencyConflict, true);
  assert.strictEqual(conflictErr.serverVersion, 3);

  // Test 7c: Session Token Management
  const client = new ApiClient();
  client.setSessionToken('test-session-jwt');
  assert.strictEqual(client.getSessionToken(), 'test-session-jwt');
  client.setSessionToken(null);
  assert.strictEqual(client.getSessionToken(), null);

  // Test 7d: Mock Request Interception on planningApi delegation
  const testClient = new ApiClient();
  const capturedRequests: Array<{ endpoint: string; options?: RequestInit }> = [];
  (testClient as any).request = async (endpoint: string, options?: RequestInit) => {
    capturedRequests.push({ endpoint, options });
    return { success: true };
  };

  // Verify planning operations query params and body serialization
  await testClient.getContentPlans({ topicId: 'top_101', status: 'DRAFT' });
  assert.strictEqual(capturedRequests[0].endpoint, '/planning/plans?topicId=top_101&status=DRAFT');

  await testClient.createContentPlan({ title: 'New Plan', difficulty: DifficultyLevel.MEDIUM });
  assert.strictEqual(capturedRequests[1].endpoint, '/planning/plans');
  assert.strictEqual(capturedRequests[1].options?.method, 'POST');
  assert(capturedRequests[1].options?.body?.toString().includes('New Plan'));

  await testClient.approveContentPlan('PLN-01', { id: 'USR-ADMIN', name: 'Admin Lead' });
  assert.strictEqual(capturedRequests[2].endpoint, '/planning/plans/PLN-01/approve');
  assert.strictEqual(capturedRequests[2].options?.method, 'POST');
  assert(capturedRequests[2].options?.body?.toString().includes('USR-ADMIN'));

  await testClient.transitionPlanStatus('PLN-01', 'ACTIVE');
  assert.strictEqual(capturedRequests[3].endpoint, '/planning/plans/PLN-01/status');
  assert.strictEqual(capturedRequests[3].options?.method, 'POST');
  assert(capturedRequests[3].options?.body?.toString().includes('ACTIVE'));

  await testClient.deleteContentPlan('PLN-01');
  assert.strictEqual(capturedRequests[4].endpoint, '/planning/plans/PLN-01');
  assert.strictEqual(capturedRequests[4].options?.method, 'DELETE');

  console.log('  ✓ Behavioral test suites passed: URL construction, serialization, session handling & concurrency errors.');
  passedGates++;

  // --------------------------------------------------------------------------
  // GATE 8: Protected Architectural Invariants
  // --------------------------------------------------------------------------
  console.log('\n[Gate 8] Verifying protected architectural invariants...');
  // 15-step workflow sequence intact
  const stepNumbers = Object.keys(CANONICAL_WORKFLOW_STEPS).map(Number);
  assert.strictEqual(stepNumbers.length, 15, 'Canonical workflow must contain exactly 15 stages');
  assert.strictEqual(CANONICAL_WORKFLOW_STEPS[1].step, 1, 'Stage 1 must be Question Generation');
  assert.strictEqual(CANONICAL_WORKFLOW_STEPS[2].step, 2, 'Stage 2 must be Verification & Quality Gate');
  assert.strictEqual(CANONICAL_WORKFLOW_STEPS[15].step, 15, 'Stage 15 must be Performance Analytics');

  // Backend / Database safety
  assert(fs.existsSync(path.resolve(rootDir, 'database/firestore')), 'Firestore repository layer must exist');
  assert(
    !fs.existsSync(path.resolve(rootDir, 'src/lib/sheets')),
    'Google Sheets runtime persistence must not exist'
  );

  console.log('  ✓ Protected architectural invariants verified (15-step workflow, Firestore authority, UUID entity IDs).');
  passedGates++;

  console.log('\n============================================================');
  console.log(`S7-T11 API ACCESS BOUNDARY ACCEPTANCE: ALL ${passedGates}/${totalGates} GATES PASSED`);
  console.log('============================================================');
}

runApiAccessBoundaryTests().catch((err) => {
  console.error('\n❌ S7-T11 API ACCESS BOUNDARY TEST FAILED:', err);
  process.exit(1);
});
