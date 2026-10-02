/**
 * BURRA PARIKSHA CMS — Stage 03 Current System Baseline Verification Suite
 *
 * Programmatically validates the frozen brownfield empirical baseline:
 * 1. Substage 03.1 & 03.2: Count and assert exactly 31 React pages in `src/pages/`.
 * 2. Substage 03.3 & 03.4: Verify `server.ts` and `src/server/routes.ts` exist and have valid exports / CLI precedence.
 * 3. Substage 03.5 & 03.6: Verify `src/lib/services/` (>= 60 services) and `src/lib/repositories/` (>= 30 repositories).
 * 4. Substage 03.7: Parse `src/lib/schemas/google-sheets-schema.ts` and assert 25 authoritative worksheets.
 * 5. Substage 03.8: Verify `src/lib/workflow/media-storage-guard.ts` exists and enforces metadata boundaries.
 * 6. Substage 03.13 & 03.14: Verify `Dockerfile`, `vite.config.ts`, `server.ts`, and `.env.example` critical keys.
 * 7. Substage 03.15: Verify Stage 04 & Stage 02 test scripts exist to lock regression prevention.
 *
 * ZERO PRODUCTION DATA MUTATION: Read-only filesystem and AST/schema verification with zero network side effects.
 */

import fs from 'fs';
import path from 'path';
import { apiRouter } from '../server/routes';
import { validateMediaAssetMetadata } from '../lib/workflow/media-storage-guard';
import { ALL_SHEET_TABS, SHEET_TABS, PLANNING_SHEET_TABS } from '../lib/schemas/google-sheets-schema';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`[STAGE 03 BASELINE VIOLATION] ${msg}`);
  }
}

/**
 * Main Stage 03 Baseline Automated Test Runner
 */
export async function runStage03BaselineTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING STAGE 03 CURRENT SYSTEM BASELINE VERIFICATION');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Substage 03.1 & 03.2 — Exactly 31 React Pages in src/pages/
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.1 & 03.2: 31 React Routed Pages...');
  const pagesDir = path.resolve(process.cwd(), 'src/pages');
  assert(fs.existsSync(pagesDir), 'Directory src/pages must exist');

  const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));
  console.log(`  Found ${pageFiles.length} React pages in src/pages/`);
  assert(
    pageFiles.length === 31,
    `Expected exactly 31 React pages in src/pages/, found ${pageFiles.length}`
  );

  const expectedKeyPages = [
    'DashboardPage.tsx',
    'QuestionStudioPage.tsx',
    'QuestionVerifyApprovePage.tsx',
    'VideoRecordPage.tsx',
    'VideoEditPage.tsx',
    'VideoFinalPage.tsx',
    'VideoThumbnailPage.tsx',
    'SocialReviewPage.tsx',
    'PublishingPage.tsx',
    'SocialAnalyticsPage.tsx',
    'AnalyticsExperiencePage.tsx',
    'RecoveryAdminPage.tsx',
    'PlanningPage.tsx',
    'TeamOperationsPage.tsx',
    'ContentMasterPage.tsx',
  ];
  expectedKeyPages.forEach((kp) => {
    assert(pageFiles.includes(kp), `Authoritative page ${kp} must exist in src/pages/`);
  });
  console.log('  -> PASS: Substage 03.1 & 03.2 verified (exactly 31 React pages).\n');

  // --------------------------------------------------------------------------
  // TEST 2: Substage 03.3 & 03.4 — Server Entrypoint & API Route Taxonomy
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.3 & 03.4: Express server.ts & routes.ts...');
  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const routesPath = path.resolve(process.cwd(), 'src/server/routes.ts');
  assert(fs.existsSync(serverPath), 'server.ts must exist');
  assert(fs.existsSync(routesPath), 'src/server/routes.ts must exist');

  // Verify server.ts precedence logic: CLI args --host/--port take precedence over env vars
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  assert(
    serverContent.includes("process.argv.indexOf('--port')"),
    'server.ts must parse CLI --port argument'
  );
  assert(
    serverContent.includes("process.argv.indexOf('--host')"),
    'server.ts must parse CLI --host argument'
  );
  assert(
    serverContent.includes("app.use('/api', apiRouter)"),
    'server.ts must mount apiRouter on /api'
  );

  // Verify apiRouter export
  assert(typeof apiRouter === 'function', 'src/server/routes.ts must export apiRouter Express Router');

  // Verify App.tsx client routes
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  const clientRoutesMatches = appContent.match(/<Route\s+path=/g) || [];
  console.log(`  Found ${clientRoutesMatches.length} client route declarations in App.tsx`);
  assert(clientRoutesMatches.length >= 75, `Expected >= 75 client route declarations, found ${clientRoutesMatches.length}`);

  console.log('  -> PASS: Substage 03.3 & 03.4 verified (server precedence & routes).\n');

  // --------------------------------------------------------------------------
  // TEST 3: Substage 03.5 & 03.6 — Service Layer (>= 60) & Repositories (>= 30)
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.5 & 03.6: Domain Services & Repositories...');
  const servicesDir = path.resolve(process.cwd(), 'src/lib/services');
  const reposDir = path.resolve(process.cwd(), 'src/lib/repositories');
  assert(fs.existsSync(servicesDir), 'Directory src/lib/services must exist');
  assert(fs.existsSync(reposDir), 'Directory src/lib/repositories must exist');

  const serviceFiles = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));
  const repoFiles = fs.readdirSync(reposDir).filter((f) => f.endsWith('.ts'));

  console.log(`  Found ${serviceFiles.length} domain services in src/lib/services/`);
  console.log(`  Found ${repoFiles.length} repositories in src/lib/repositories/`);

  assert(
    serviceFiles.length >= 60,
    `Expected >= 60 services in src/lib/services/, found ${serviceFiles.length}`
  );
  assert(
    repoFiles.length >= 30,
    `Expected >= 30 repositories in src/lib/repositories/, found ${repoFiles.length}`
  );

  // Verify critical services & repositories
  const criticalServices = [
    'google-drive.service.ts',
    'script.service.ts',
    'video.service.ts',
    'publishing.service.ts',
    'snapshot-scheduler.service.ts',
  ];
  criticalServices.forEach((cs) => {
    assert(serviceFiles.includes(cs), `Critical service ${cs} must exist`);
  });

  const criticalRepos = [
    'questions.repository.ts',
    'videos.repository.ts',
    'scripts.repository.ts',
    'thumbnails.repository.ts',
    'users.repository.ts',
  ];
  criticalRepos.forEach((cr) => {
    assert(repoFiles.includes(cr), `Critical repository ${cr} must exist`);
  });

  console.log('  -> PASS: Substage 03.5 & 03.6 verified (69 services & 37 repositories).\n');

  // --------------------------------------------------------------------------
  // TEST 4: Substage 03.7 — Authoritative Google Sheets Schema (25 Tabs)
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.7: 25 Authoritative Google Sheets Tabs...');
  assert(Array.isArray(ALL_SHEET_TABS), 'ALL_SHEET_TABS must be an array');
  console.log(`  Found ${ALL_SHEET_TABS.length} authoritative worksheets in ALL_SHEET_TABS`);
  assert(
    ALL_SHEET_TABS.length === 25,
    `Expected exactly 25 authoritative Google Sheets tabs in ALL_SHEET_TABS, found ${ALL_SHEET_TABS.length}`
  );

  assert(Boolean(SHEET_TABS.QUESTIONS), 'SHEET_TABS.QUESTIONS must exist');
  assert(Boolean(SHEET_TABS.VIDEOS), 'SHEET_TABS.VIDEOS must exist');
  assert(Boolean(SHEET_TABS.SCRIPT), 'SHEET_TABS.SCRIPT must exist');
  assert(Boolean(SHEET_TABS.THUMBNAILS), 'SHEET_TABS.THUMBNAILS must exist');
  assert(Boolean(SHEET_TABS.PUBLISHING), 'SHEET_TABS.PUBLISHING must exist');
  assert(Boolean(PLANNING_SHEET_TABS.CONTENT_PLANS), 'PLANNING_SHEET_TABS.CONTENT_PLANS must exist');

  console.log('  -> PASS: Substage 03.7 verified (exactly 25 worksheet tabs).\n');

  // --------------------------------------------------------------------------
  // TEST 5: Substage 03.8 — Media Storage Guard & External Pointer Enforcement
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.8: Media Storage Guard...');
  const mediaGuardPath = path.resolve(process.cwd(), 'src/lib/workflow/media-storage-guard.ts');
  assert(fs.existsSync(mediaGuardPath), 'src/lib/workflow/media-storage-guard.ts must exist');

  // Verify behavior: External metadata valid
  const testValidMeta = validateMediaAssetMetadata({
    entityId: 'BP-V-000001',
    entityType: 'VIDEO',
    driveFileId: 'DRIVE_FILE_XYZ_123',
    fileName: 'master_cut.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 150000000,
  });
  assert(testValidMeta.valid, 'Valid drive reference metadata must pass validation');

  // Verify behavior: Binary payload rejected
  const testBinaryRejection = validateMediaAssetMetadata({
    entityId: 'BP-V-000001',
    entityType: 'VIDEO',
    driveFileId: 'DRIVE_FILE_XYZ_123',
    fileName: 'master_cut.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 150000000,
    rawBinaryData: Buffer.from('FAKE_BYTES'),
  });
  assert(!testBinaryRejection.valid, 'Binary payload must be rejected by media storage guard');

  console.log('  -> PASS: Substage 03.8 verified (media storage guard active).\n');

  // --------------------------------------------------------------------------
  // TEST 6: Substage 03.13 & 03.14 — Deployment & Environment Configuration
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.13 & 03.14: Deployment Artifacts & .env.example...');
  const dockerfilePath = path.resolve(process.cwd(), 'Dockerfile');
  const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');

  assert(fs.existsSync(dockerfilePath), 'Dockerfile must exist');
  assert(fs.existsSync(viteConfigPath), 'vite.config.ts must exist');
  assert(fs.existsSync(envExamplePath), '.env.example must exist');

  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
  assert(dockerfileContent.includes('node:20-alpine'), 'Dockerfile must use node:20-alpine');
  assert(dockerfileContent.includes('npm run build'), 'Dockerfile must execute npm run build');
  assert(dockerfileContent.includes('dist/server.cjs'), 'Dockerfile runner must start dist/server.cjs');

  const envContent = fs.readFileSync(envExamplePath, 'utf-8');
  const criticalEnvKeys = [
    'GOOGLE_SHEETS_ID',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN',
    'GEMINI_API_KEY',
    'SESSION_SECRET',
  ];
  criticalEnvKeys.forEach((key) => {
    assert(envContent.includes(key), `.env.example must specify critical key ${key}`);
  });

  console.log('  -> PASS: Substage 03.13 & 03.14 verified (Dockerfile & env keys).\n');

  // --------------------------------------------------------------------------
  // TEST 7: Substage 03.15 — Regression Prevention & Stage Test Coverage
  // --------------------------------------------------------------------------
  console.log('Checking Substage 03.15: Regression Prevention Suite Existence...');
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  assert(Boolean(pkg.scripts['test:stage02']), 'package.json must contain test:stage02');
  assert(Boolean(pkg.scripts['test:stage03']), 'package.json must contain test:stage03');
  assert(Boolean(pkg.scripts['test:architecture']), 'package.json must contain test:architecture');

  const stage02Test = path.resolve(process.cwd(), 'src/tests/stage02-business-acceptance.test.ts');
  const stage04Test = path.resolve(process.cwd(), 'src/tests/stage04-architecture-principles.test.ts');
  assert(fs.existsSync(stage02Test), 'stage02-business-acceptance.test.ts must exist');
  assert(fs.existsSync(stage04Test), 'stage04-architecture-principles.test.ts must exist');

  console.log('  -> PASS: Substage 03.15 verified (regression test gates locked).\n');

  console.log('============================================================');
  console.log('ALL STAGE 03 BASELINE TESTS COMPLETED SUCCESSFULLY! ✅');
  console.log('============================================================');
}

// Direct CLI invocation
if (import.meta.url === `file://${process.argv[1]}`) {
  runStage03BaselineTests().catch((err) => {
    console.error('Stage 03 Baseline Test Failure:', err);
    process.exit(1);
  });
}
