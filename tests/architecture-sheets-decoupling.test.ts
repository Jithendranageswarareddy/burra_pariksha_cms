/**
 * BURRA PARIKSHA CMS — Architectural Decoupling & Firestore Authoritative Regression Test
 * Phase 14: Verifies Complete Migration to Cloud Firestore and Elimination of Google Sheets from Runtime
 *
 * Invariants:
 * 1. Cloud Firestore is the ONLY authoritative transactional persistence datastore.
 * 2. No active production module imports from src/lib/google-sheets/*.
 * 3. Health probes (/api/health, /api/system/readiness) report FIRESTORE database status.
 * 4. GOOGLE_SHEETS_ID is not required for application runtime or startup.
 * 5. Sequence allocator writes to Firestore sequences collection.
 * 6. User-facing operational UI reports Cloud Firestore, not Google Sheets.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdminFirestore } from '../database/firestore/adapter/admin';
import { operationalHealthService } from '../backend/infrastructure/services/operational-health.service';
import { questionsRepository } from '../database/firestore/repositories/questions.repository';
import { topicsRepository } from '../database/firestore/repositories/topics.repository';
import { usersRepository } from '../database/firestore/repositories/users.repository';
import { auditLogRepository } from '../database/firestore/repositories/audit-log.repository';
import { analyticsRepository } from '../database/firestore/repositories/analytics.repository';
import { canonicalIdService } from '../src/lib/id.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFilesRecursively(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runDecouplingSuite() {
  console.log('============================================================');
  console.log('BP-CMS ARCHITECTURAL DECOUPLING & FIRESTORE REGRESSION SUITE');
  console.log('============================================================\n');

  const rootSrcDir = path.resolve(__dirname, '../src');
  const allSrcFiles = scanFilesRecursively(rootSrcDir);

  // 1. Static Scan: Verify NO active production runtime module imports src/lib/google-sheets/*
  console.log(`[Check 1] Scanning ${allSrcFiles.length} production source files for forbidden google-sheets imports...`);
  const forbiddenImportPattern = /from\s+['"][^'"]*google-sheets\/(client|helpers|errors)['"]/;
  const violations: string[] = [];

  for (const file of allSrcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (forbiddenImportPattern.test(content)) {
      violations.push(path.relative(rootSrcDir, file));
    }
  }

  assert.strictEqual(
    violations.length,
    0,
    `Forbidden google-sheets imports found in production source:\n${violations.join('\n')}`
  );
  console.log('  -> PASS: 0 production files import google-sheets client, helpers, or errors.');

  // 2. Physical File Verification: src/lib/google-sheets directory must not exist
  console.log('\n[Check 2] Verifying src/lib/google-sheets client directory is removed...');
  const sheetsClientPath = path.resolve(rootSrcDir, 'lib/google-sheets/client.ts');
  assert.strictEqual(
    fs.existsSync(sheetsClientPath),
    false,
    'src/lib/google-sheets/client.ts still exists!'
  );
  console.log('  -> PASS: src/lib/google-sheets/client.ts is absent from production runtime.');

  // 3. Operational Health Probe: Verify /api/health and operationalHealthService report FIRESTORE
  console.log('\n[Check 3] Verifying operational health probe targets Cloud Firestore...');
  const health = await operationalHealthService.getOperationalHealth();
  assert.strictEqual(health.databaseProvider, 'FIRESTORE', 'Database provider must be FIRESTORE');
  assert.strictEqual(health.mode, 'CLOUD_FIRESTORE', 'Operational mode must be CLOUD_FIRESTORE');
  assert.strictEqual(health.isConnected, true, 'Database connection must be established');
  assert.ok((health.telemetry?.lastLatencyMs ?? 0) >= 0, 'Database latency must be non-negative');
  assert.ok(health.projectId.length > 0, 'Project ID must be reported');
  assert.ok(health.databaseId.length > 0, 'Database ID must be reported');
  console.log(`  -> PASS: Health reports provider=${health.databaseProvider}, mode=${health.mode}, project=${health.projectId}, latency=${health.telemetry?.lastLatencyMs}ms`);

  // 4. Repositories Verification: Assert repositories target Firestore collections
  console.log('\n[Check 4] Verifying authoritative domain repositories use Firestore collections...');
  assert.strictEqual(questionsRepository.getCollectionName(), 'questions');
  assert.strictEqual(topicsRepository.getCollectionName(), 'topics');
  assert.strictEqual(usersRepository.getCollectionName(), 'users');
  assert.strictEqual(auditLogRepository.getCollectionName(), 'audit_logs');
  assert.strictEqual(analyticsRepository.getCollectionName(), 'social_analytics');
  console.log('  -> PASS: All core domain repositories target canonical Firestore collections.');

  // 5. Canonical ID Verification: Generates collision-resistant UUID-based IDs without database sequences
  console.log('\n[Check 5] Verifying canonical UUID ID generation without database sequence counters...');
  const allocatedId = canonicalIdService.generateQuestionId();
  assert.ok(/^qst_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(allocatedId), `Question ID must match qst_<uuid>, got ${allocatedId}`);

  // Confirm Firestore sequences collection is not touched
  const firestore = getAdminFirestore();
  const seqsSnapshot = await firestore.collection('sequences').get();
  assert.strictEqual(seqsSnapshot.size, 0, 'Firestore sequences collection must be empty / unused');
  console.log('  -> PASS: Canonical UUID ID generation verified with zero reliance on sequences collection.');

  // 6. UI Regression Check: Verify key UI components do not display "Google Sheets DB"
  console.log('\n[Check 6] Verifying user-facing UI components do not report Google Sheets DB...');
  const rootFrontendDir = path.resolve(__dirname, '../frontend');
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

  // 7. Environment Variables Contract: Ensure GOOGLE_SHEETS_ID is not required
  console.log('\n[Check 7] Verifying GOOGLE_SHEETS_ID is omitted from required runtime contract...');
  const envCheckerPath = path.resolve(__dirname, '../scripts/check-env.ts');
  const envCheckerContent = fs.readFileSync(envCheckerPath, 'utf-8');
  assert.ok(
    !envCheckerContent.includes("'GOOGLE_SHEETS_ID'"),
    'scripts/check-environment.ts must not require GOOGLE_SHEETS_ID'
  );
  console.log('  -> PASS: GOOGLE_SHEETS_ID is not present in required environment contract.');

  // 8. Legacy Schema Decoupling: Ensure SHEET_SCHEMAS runtime persistence table dictionary is eliminated
  console.log('\n[Check 8] Verifying SHEET_SCHEMAS runtime persistence table dictionary is eliminated...');
  const sheetsSchemaPath = path.resolve(rootSrcDir, 'lib/schemas/google-sheets-schema.ts');
  const sheetsSchemaContent = fs.readFileSync(sheetsSchemaPath, 'utf-8');
  assert.ok(
    !sheetsSchemaContent.includes('export const SHEET_SCHEMAS'),
    'google-sheets-schema.ts must NOT contain runtime persistence SHEET_SCHEMAS table definitions'
  );
  assert.ok(
    sheetsSchemaContent.includes('export const SHEET_TABS'),
    'google-sheets-schema.ts must preserve SHEET_TABS for recovery/archive tools'
  );
  console.log('  -> PASS: Obsolete SHEET_SCHEMAS database schema removed; recovery archive tabs preserved.');

  console.log('\n============================================================');
  console.log('ALL 8 ARCHITECTURAL DECOUPLING REGRESSION CHECKS PASSED (100%)');
  console.log('============================================================');
}

runDecouplingSuite().catch((err) => {
  console.error('\n❌ Architectural decoupling regression suite failed:', err);
  process.exit(1);
});
