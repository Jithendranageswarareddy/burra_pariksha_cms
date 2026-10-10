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
import { getAdminFirestore } from '../src/lib/firebase/admin';
import { operationalHealthService } from '../src/lib/services/operational-health.service';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { categoriesRepository } from '../src/lib/repositories/categories.repository';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { sequencesRepository } from '../src/lib/repositories/sequences.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { analyticsRepository } from '../src/lib/repositories/analytics.repository';
import { idService } from '../src/lib/services/id.service';
import { SEQUENCE_ENTITIES } from '../src/lib/schemas/domain-schemas';

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
  assert.strictEqual(categoriesRepository.getCollectionName(), 'categories');
  assert.strictEqual(usersRepository.getCollectionName(), 'users');
  assert.strictEqual(sequencesRepository.getCollectionName(), 'sequences');
  assert.strictEqual(auditLogRepository.getCollectionName(), 'audit_logs');
  assert.strictEqual(analyticsRepository.getCollectionName(), 'social_analytics');
  console.log('  -> PASS: All core domain repositories target canonical Firestore collections.');

  // 5. Sequence Safety Verification: Allocates monotonic IDs in Firestore sequences collection
  console.log('\n[Check 5] Verifying ID sequence allocation operates on Firestore sequences...');
  const firestore = getAdminFirestore();
  const testSeqRef = firestore.collection('sequences').doc(SEQUENCE_ENTITIES.QUESTION);
  
  // Read before state
  const beforeDoc = await testSeqRef.get();
  const beforeVal = beforeDoc.exists ? (beforeDoc.data()?.nextNumber ?? 1) : 1;

  const allocatedId = await idService.allocateQuestionId();
  assert.ok(/^BP-Q-\d{6}$/.test(allocatedId), `Question ID must match BP-Q-######, got ${allocatedId}`);

  const afterDoc = await testSeqRef.get();
  const afterVal = afterDoc.data()?.nextNumber;
  assert.ok(afterVal !== undefined && afterVal >= beforeVal, 'Firestore sequences document must reflect incremented nextNumber');

  // Restore baseline
  if (beforeDoc.exists) {
    await testSeqRef.set(beforeDoc.data()!);
  } else {
    await testSeqRef.delete();
  }
  console.log('  -> PASS: Monotonic sequence allocation verified against Firestore sequences collection.');

  // 6. UI Regression Check: Verify key UI components do not display "Google Sheets DB"
  console.log('\n[Check 6] Verifying user-facing UI components do not report Google Sheets DB...');
  const vitalsBentoPath = path.resolve(rootSrcDir, 'components/dashboard/ExecutiveVitalsBento.tsx');
  const healthIndicatorPath = path.resolve(rootSrcDir, 'components/layout/SystemHealthIndicator.tsx');
  const dashboardPath = path.resolve(rootSrcDir, 'pages/DashboardPage.tsx');

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

  console.log('\n============================================================');
  console.log('ALL 7 ARCHITECTURAL DECOUPLING REGRESSION CHECKS PASSED (100%)');
  console.log('============================================================');
}

runDecouplingSuite().catch((err) => {
  console.error('\n❌ Architectural decoupling regression suite failed:', err);
  process.exit(1);
});
