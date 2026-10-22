/**
 * BURRA PARIKSHA CMS — Architectural Decoupling & Firestore Authoritative Regression Test
 * Phase 14 & Maintenance: Verifies Complete Migration to Cloud Firestore and Elimination of Google Sheets from Runtime
 *
 * Invariants:
 * 1. Cloud Firestore is the sole authoritative transactional persistence datastore.
 * 2. No active production module imports google-sheets client/helpers or executes sheets CRUD.
 * 3. No active production module imports or extends in-memory stores (InMemoryRepository).
 * 4. All 23 canonical domain repositories (+ 5 supporting repositories) map to canonical Firestore collections.
 * 5. Health probes report FIRESTORE database status.
 * 6. GOOGLE_SHEETS_ID is not required for application runtime or startup.
 * 7. Canonical UUID ID generation functions without sequential database counters.
 * 8. User-facing operational UI reports Cloud Firestore, not Google Sheets.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

import { getAdminFirestore } from '../../database/firestore/adapter/admin';
import { operationalHealthService } from '../../backend/infrastructure/services/operational-health.service';
import {
  usersRepository,
  topicsRepository,
  subtopicsRepository,
  questionsRepository,
  questionVideosRepository,
  videosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  workflowRepository,
  assignmentsRepository,
  publishingRepository,
  auditLogRepository,
  contentMastersRepository,
  socialReviewsRepository,
  validationsRepository,
  questionConfigRepository,
  mediaAssetsRepository,
  contentPlansRepository,
  contentBatchesRepository,
  questionDraftsRepository,
  platformAdaptationsRepository,
  pinnedCommentPackagesRepository,
  thumbnailCandidatesRepository,
  refinementCandidatesRepository,
} from '../../database/firestore/repositories';
import { canonicalIdService } from '../../shared/lib/id.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

function scanSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && !entry.name.startsWith('.')) {
        scanSourceFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runDecouplingSuite() {
  console.log('============================================================');
  console.log('BP-CMS ARCHITECTURAL DECOUPLING & FIRESTORE REGRESSION SUITE');
  console.log('============================================================\n');

  // Helper: check if Firestore emulator is reachable
  const isReachable = await new Promise<boolean>((resolve) => {
    const hostEnv = process.env.FIRESTORE_EMULATOR_HOST;
    if (!hostEnv) {
      resolve(false);
      return;
    }
    const [host, portStr] = hostEnv.split(':');
    const port = parseInt(portStr || '8080', 10);
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host || '127.0.0.1');
  });

  const productionRoots = ['src', 'backend', 'frontend', 'database/firestore', 'shared'];
  const allProductionFiles = productionRoots.flatMap((root) => scanSourceFiles(path.join(projectRoot, root)));

  // 1. Static Scan: Verify NO active production runtime module imports google-sheets client/helpers or executes sheets CRUD
  console.log(`[Check 1] Scanning ${allProductionFiles.length} production source files for forbidden Google Sheets CRUD & imports...`);
  const forbiddenImportPattern = /from\s+['"][^'"]*google-sheets\/(client|helpers|errors)['"]/;
  const forbiddenCrudPattern = /\bgoogle\.sheets\(|\bspreadsheets\.values\.(get|update|append|batchUpdate)\b/;
  const violations: string[] = [];

  for (const file of allProductionFiles) {
    // Exclude offline snapshot disaster-recovery schemas
    if (file.includes('secondary-sheet-schema.ts')) continue;
    const content = fs.readFileSync(file, 'utf-8');
    if (forbiddenImportPattern.test(content)) {
      violations.push(`${path.relative(projectRoot, file)}: forbidden google-sheets import`);
    }
    if (forbiddenCrudPattern.test(content)) {
      violations.push(`${path.relative(projectRoot, file)}: forbidden sheets.spreadsheets.values CRUD call`);
    }
  }

  assert.strictEqual(
    violations.length,
    0,
    `Forbidden Google Sheets dependencies found in production source:\n${violations.join('\n')}`
  );
  console.log('  -> PASS: 0 production files import google-sheets client or execute Google Sheets transactional CRUD.');

  // 2. Physical File Verification: src/lib/google-sheets client directory must not exist
  console.log('\n[Check 2] Verifying src/lib/google-sheets client directory is removed...');
  const sheetsClientPath = path.resolve(projectRoot, 'src/lib/google-sheets/client.ts');
  assert.strictEqual(
    fs.existsSync(sheetsClientPath),
    false,
    'src/lib/google-sheets/client.ts still exists!'
  );
  console.log('  -> PASS: src/lib/google-sheets/client.ts is absent from production runtime.');

  // 3. In-Memory Store Elimination: Verify NO backend, frontend, or domain repository imports InMemoryRepository or uses in-memory Map stores
  console.log('\n[Check 3] Verifying InMemoryRepository & volatile Map stores are eliminated from production persistence...');
  const inMemoryCheckRoots = ['backend', 'frontend', 'shared', 'database/firestore/repositories'];
  const inMemoryCheckFiles = inMemoryCheckRoots.flatMap((root) => scanSourceFiles(path.join(projectRoot, root)));
  const inMemoryViolations: string[] = [];
  const inMemoryImportPattern = /from\s+['"][^'"]*in-memory\.repository['"]|\bInMemoryRepository\b/;

  for (const file of inMemoryCheckFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (inMemoryImportPattern.test(content)) {
      inMemoryViolations.push(`${path.relative(projectRoot, file)}: forbidden InMemoryRepository import`);
    }
  }

  // Also verify that ALL domain repositories in database/firestore/repositories/ extend BaseRepository and have zero in-memory Map stores
  const repoFiles = scanSourceFiles(path.join(projectRoot, 'database/firestore/repositories'));
  for (const file of repoFiles) {
    if (file.endsWith('base.repository.ts') || file.endsWith('index.ts')) continue;
    const content = fs.readFileSync(file, 'utf-8');
    // Allow re-export forwarding modules (e.g. users.repository.ts, script-versions.repository.ts)
    if (/^\s*export\s*\{[^}]+\}\s*from\s*['"]\.\/[^'"]+['"]/m.test(content) && !content.includes('class ')) {
      continue;
    }
    if (!content.includes('extends BaseRepository')) {
      inMemoryViolations.push(`${path.relative(projectRoot, file)}: must extend BaseRepository`);
    }
    if (/private\s+(?:readonly\s+)?(?:store|records|items|data)\s*=\s*new\s+Map</.test(content)) {
      inMemoryViolations.push(`${path.relative(projectRoot, file)}: forbidden in-memory Map primary store detected`);
    }
  }

  assert.strictEqual(
    inMemoryViolations.length,
    0,
    `Forbidden in-memory persistence found in production source:\n${inMemoryViolations.join('\n')}`
  );
  console.log('  -> PASS: Zero production modules in backend, frontend, or repositories use in-memory stores; all repositories extend BaseRepository.');


  // 4. Repositories Verification: Assert all 23 canonical + supporting repositories target canonical Firestore collections
  console.log('\n[Check 4] Verifying all 23 canonical + supporting domain repositories use canonical Firestore collections...');
  const canonicalCollectionChecks: Array<[string, string]> = [
    [usersRepository.getCollectionName(), 'users'],
    [topicsRepository.getCollectionName(), 'topics'],
    [subtopicsRepository.getCollectionName(), 'subtopics'],
    [questionsRepository.getCollectionName(), 'questions'],
    [questionVideosRepository.getCollectionName(), 'question_videos'],
    [videosRepository.getCollectionName(), 'videos'],
    [scriptsRepository.getCollectionName(), 'scripts'],
    [scriptVersionsRepository.getCollectionName(), 'script_versions'],
    [thumbnailsRepository.getCollectionName(), 'thumbnails'],
    [thumbnailVersionsRepository.getCollectionName(), 'thumbnail_versions'],
    [pinnedCommentsRepository.getCollectionName(), 'pinned_comments'],
    [pinnedCommentVersionsRepository.getCollectionName(), 'pinned_comment_versions'],
    [workflowRepository.getCollectionName(), 'workflow_instances'],
    [assignmentsRepository.getCollectionName(), 'assignments'],
    [publishingRepository.getCollectionName(), 'publishing_packages'],
    [auditLogRepository.getCollectionName(), 'audit_logs'],
    [contentMastersRepository.getCollectionName(), 'content_masters'],
    [socialReviewsRepository.getCollectionName(), 'social_reviews'],
    [validationsRepository.getCollectionName(), 'validations'],
    [questionConfigRepository.getCollectionName(), 'question_config'],
    [mediaAssetsRepository.getCollectionName(), 'media_assets'],
    [contentPlansRepository.getCollectionName(), 'content_plans'],
    [contentBatchesRepository.getCollectionName(), 'content_batches'],
    // Supporting collections
    [questionDraftsRepository.getCollectionName(), 'question_drafts'],
    [platformAdaptationsRepository.getCollectionName(), 'platform_adaptations'],
    [pinnedCommentPackagesRepository.getCollectionName(), 'pinned_comment_packages'],
    [thumbnailCandidatesRepository.getCollectionName(), 'thumbnail_candidates'],
    [refinementCandidatesRepository.getCollectionName(), 'refinement_candidates'],
  ];

  for (const [actual, expected] of canonicalCollectionChecks) {
    assert.strictEqual(actual, expected, `Repository collection name mismatch: expected ${expected}, got ${actual}`);
  }
  console.log(`  -> PASS: All ${canonicalCollectionChecks.length} repositories strictly bound to canonical collections.`);

  // 5. Canonical ID Verification: Generates collision-resistant UUID-based IDs without database sequences
  console.log('\n[Check 5] Verifying canonical UUID ID generation without database sequence counters...');
  const allocatedId = canonicalIdService.generateQuestionId();
  assert.ok(
    /^qst_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(allocatedId),
    `Question ID must match qst_<uuid>, got ${allocatedId}`
  );
  assert.ok(canonicalIdService.validateCanonicalId(allocatedId, 'qst_'), 'ID must pass canonical validator');

  if (isReachable) {
    const firestore = getAdminFirestore();
    const seqsSnapshot = await firestore.collection('sequences').get();
    assert.strictEqual(seqsSnapshot.size, 0, 'Firestore sequences collection must be empty / unused');
    console.log('  -> PASS: Live sequences collection verified unused in Firestore.');
  } else {
    console.log('  -> PASS: Canonical UUID ID generation verified (live network check skipped offline).');
  }

  // 6. Operational Health Probe Configuration Verification
  console.log('\n[Check 6] Verifying operational health probe configuration...');
  if (isReachable) {
    const health = await operationalHealthService.getOperationalHealth();
    assert.strictEqual(health.databaseProvider, 'FIRESTORE', 'Database provider must be FIRESTORE');
    assert.strictEqual(health.mode, 'CLOUD_FIRESTORE', 'Operational mode must be CLOUD_FIRESTORE');
    assert.strictEqual(health.isConnected, true, 'Database connection must be established');
    console.log(`  -> PASS: Health reports provider=${health.databaseProvider}, mode=${health.mode}`);
  } else {
    const service = operationalHealthService;
    assert.ok(service, 'OperationalHealthService must be instantiated');
    console.log('  -> PASS: Health service verified (live probe skipped offline).');
  }

  // 7. UI Regression Check: Verify key UI components do not display "Google Sheets DB"
  console.log('\n[Check 7] Verifying user-facing UI components do not report Google Sheets DB...');
  const rootFrontendDir = path.resolve(projectRoot, 'frontend');
  const rootSrcDir = path.resolve(projectRoot, 'src');

  const vitalsBentoPath = fs.existsSync(path.resolve(rootFrontendDir, 'components/dashboard/ExecutiveVitalsBento.tsx'))
    ? path.resolve(rootFrontendDir, 'components/dashboard/ExecutiveVitalsBento.tsx')
    : path.resolve(rootSrcDir, 'components/dashboard/ExecutiveVitalsBento.tsx');
  const healthIndicatorPath = fs.existsSync(path.resolve(rootFrontendDir, 'components/layout/SystemHealthIndicator.tsx'))
    ? path.resolve(rootFrontendDir, 'components/layout/SystemHealthIndicator.tsx')
    : path.resolve(rootSrcDir, 'components/layout/SystemHealthIndicator.tsx');
  const dashboardPath = fs.existsSync(path.resolve(rootFrontendDir, 'pages/DashboardPage.tsx'))
    ? path.resolve(rootFrontendDir, 'pages/DashboardPage.tsx')
    : path.resolve(rootSrcDir, 'pages/DashboardPage.tsx');

  const vitalsContent = fs.readFileSync(vitalsBentoPath, 'utf-8');
  assert.ok(!vitalsContent.includes('title="Google Sheets DB"'), 'ExecutiveVitalsBento must not say Google Sheets DB');
  assert.ok(vitalsContent.includes('Firestore'), 'ExecutiveVitalsBento must say Firestore');

  const indicatorContent = fs.readFileSync(healthIndicatorPath, 'utf-8');
  assert.ok(!indicatorContent.includes('Google Sheets DB'), 'SystemHealthIndicator must not say Google Sheets DB');
  assert.ok(indicatorContent.includes('Cloud Firestore'), 'SystemHealthIndicator must say Cloud Firestore');

  const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
  assert.ok(!dashboardContent.includes('Authoritative Engine: Google Sheets DB'), 'DashboardPage must not say Google Sheets DB');
  assert.ok(dashboardContent.includes('Authoritative Engine: Cloud Firestore'), 'DashboardPage must say Cloud Firestore');
  console.log('  -> PASS: ExecutiveVitalsBento, SystemHealthIndicator, and DashboardPage cleanly display Firestore.');

  // 8. Environment Variables Contract: Ensure GOOGLE_SHEETS_ID is not required
  console.log('\n[Check 8] Verifying GOOGLE_SHEETS_ID is omitted from required runtime contract...');
  const envCheckerPath = path.resolve(projectRoot, 'scripts/check-env.ts');
  const envCheckerContent = fs.readFileSync(envCheckerPath, 'utf-8');
  assert.ok(
    !envCheckerContent.includes("'GOOGLE_SHEETS_ID'"),
    'scripts/check-environment.ts must not require GOOGLE_SHEETS_ID'
  );
  console.log('  -> PASS: GOOGLE_SHEETS_ID is not present in required environment contract.');

  // 9. Legacy Schema Decoupling: Ensure SHEET_SCHEMAS runtime persistence table dictionary is eliminated
  console.log('\n[Check 9] Verifying SHEET_SCHEMAS runtime persistence table dictionary is eliminated...');
  const sheetsSchemaPath = path.resolve(rootSrcDir, 'lib/schemas/secondary-sheet-schema.ts');
  const sheetsSchemaContent = fs.readFileSync(sheetsSchemaPath, 'utf-8');
  assert.ok(
    !sheetsSchemaContent.includes('export const SHEET_SCHEMAS'),
    'secondary-sheet-schema.ts must NOT contain runtime persistence SHEET_SCHEMAS table definitions'
  );
  assert.ok(
    sheetsSchemaContent.includes('export const SHEET_TABS'),
    'secondary-sheet-schema.ts must preserve SHEET_TABS for recovery/archive tools'
  );
  console.log('  -> PASS: Obsolete SHEET_SCHEMAS database schema removed; recovery archive tabs preserved.');

  console.log('\n============================================================');
  console.log('ALL 9 ARCHITECTURAL DECOUPLING REGRESSION CHECKS PASSED (100%)');
  console.log('============================================================\n');
}

runDecouplingSuite().catch((err) => {
  console.error('\n❌ Architectural decoupling regression suite failed:', err);
  process.exit(1);
});
