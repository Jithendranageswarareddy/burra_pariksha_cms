/**
 * BURRA PARIKSHA CMS - SAFE TEST ARTIFACT PURGE SCRIPT
 * 
 * Safely discovers and removes automated test artifacts (e.g. TEST-P09-*) from live
 * Google Sheets worksheets using the Deletion Safety Pipeline (backup creation, token
 * consumption, row deletion, post-deletion read-back verification, and audit logging).
 * 
 * After purging, executes DataIntegrityService to verify that all 18 worksheets
 * are in a pristine production state with zero integrity errors or warnings.
 */

import {
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  socialReviewsRepository,
} from '../lib/repositories';
import { DataIntegrityService } from '../lib/services/data-integrity.service';
import { googleSheetsClient } from '../lib/google-sheets/client';

interface RepoTarget {
  name: string;
  repo: {
    findAll: () => Promise<any[]>;
    delete: (id: string, options?: { actor?: { id: string; name: string }; reason?: string }) => Promise<boolean>;
  };
}

export async function runPurgeTestArtifacts() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS - PURGE AUTOMATED TEST ARTIFACTS');
  console.log('Safe Deletion Pipeline & Diagnostic Integrity Restoration');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  const deletionActor = { id: 'USR-001', name: 'System Administrator' };
  const deletionReason = 'Purge automated test artifacts to restore pristine production state';

  // Invalidate any stale row caches before starting discovery
  googleSheetsClient.invalidateRowCache();

  // -------------------------------------------------------------
  // STEP 1: Dynamic Test Artifact Discovery & Safe Deletion
  // -------------------------------------------------------------
  console.log('--- Step 1: Dynamic Discovery & Safe Deletion Execution ---');

  // Deletion order: Leaf/child entities first, then parent videos, then root questions
  const targets: RepoTarget[] = [
    { name: 'SOCIAL_REVIEWS', repo: socialReviewsRepository },
    { name: 'PUBLISHING', repo: publishingRepository },
    { name: 'PINNED_COMMENTS', repo: pinnedCommentsRepository },
    { name: 'THUMBNAILS', repo: thumbnailsRepository },
    { name: 'SCRIPT', repo: scriptsRepository },
    { name: 'VIDEOS', repo: videosRepository },
    { name: 'QUESTIONS', repo: questionsRepository },
  ];

  const isTestArtifact = (r: any): boolean => {
    if (!r || !r.id) return false;
    const id = String(r.id);
    return id.startsWith('TEST-') || id.includes('TEST-') || id.includes('TEST');
  };

  const purgedArtifacts: { sheet: string; id: string }[] = [];

  for (const { name, repo } of targets) {
    const records = await repo.findAll();
    const testItems = records.filter(isTestArtifact);

    if (testItems.length === 0) {
      console.log(`  [CLEAN] ${name}: 0 test artifacts found.`);
      continue;
    }

    console.log(`  [FOUND] ${name}: Found ${testItems.length} test artifact(s): ${testItems.map((i) => i.id).join(', ')}`);

    for (const item of testItems) {
      console.log(`    Deleting '${item.id}' from ${name} via DeletionSafetyService pipeline...`);
      const success = await repo.delete(item.id, {
        actor: deletionActor,
        reason: deletionReason,
      });

      if (success) {
        purgedArtifacts.push({ sheet: name, id: item.id });
        console.log(`    [PURGED] '${item.id}' safely deleted, verified, and audited.`);
      } else {
        console.error(`    [ERROR] Failed to purge '${item.id}' from ${name}.`);
      }
    }
  }

  console.log(`\nPurge phase complete. Total artifacts purged: ${purgedArtifacts.length}\n`);

  // Invalidate cache to ensure subsequent integrity scan reads fresh state
  googleSheetsClient.invalidateRowCache();

  // -------------------------------------------------------------
  // STEP 2: Post-Purge Data Integrity & Referentials Audit
  // -------------------------------------------------------------
  console.log('--- Step 2: Comprehensive Data Integrity & Diagnostics Audit ---');

  const dataIntegrityService = DataIntegrityService.getInstance();
  const integrityReport = await dataIntegrityService.runFullIntegrityCheck();

  // Query remaining canonical production entities
  const finalQuestions = await questionsRepository.findAll();
  const validProductionQuestions = finalQuestions.filter((q) => !isTestArtifact(q));

  const finalVideos = await videosRepository.findAll();
  const validProductionVideos = finalVideos.filter((v) => !isTestArtifact(v));

  const passedChecksCount =
    integrityReport.issueCounts?.passedChecks ??
    integrityReport.integrityChecks.filter((c) => c.status === 'PASS').length;

  console.log('\n--- Final Production Inventory & Audit Metrics ---');
  console.log(`  - Total Issues: ${integrityReport.issues.length}`);
  console.log(`  - Critical Issues: ${integrityReport.issueCounts?.critical ?? 0}`);
  console.log(`  - Error Issues: ${integrityReport.issueCounts?.error ?? 0}`);
  console.log(`  - Warning Issues: ${integrityReport.issueCounts?.warning ?? 0}`);
  console.log(`  - Info Notices: ${integrityReport.issueCounts?.info ?? 0}`);
  console.log(`  - Passed Diagnostic Check Suites: ${passedChecksCount}/12`);
  console.log(`  - Overall Status: ${integrityReport.overallStatus}`);
  console.log(`  - Valid Questions (${validProductionQuestions.length}): ${validProductionQuestions.map((q) => q.id).join(', ')}`);
  console.log(`  - Valid Videos (${validProductionVideos.length}): ${validProductionVideos.map((v) => v.id).join(', ')}`);

  // -------------------------------------------------------------
  // STEP 3: Assertions & Integrity Invariants
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Verification Invariants ---');

  assert(
    integrityReport.issues.length === 0,
    `Total Issues: 0 (found ${integrityReport.issues.length})`,
    integrityReport.issues.map((i) => `[${i.severity}] ${i.worksheet} (${i.category}): ${i.message}`).join('\n')
  );

  assert(
    passedChecksCount === 12,
    `Passed Diagnostic Check Suites: ${passedChecksCount}/12`
  );

  assert(
    integrityReport.overallStatus === 'PASS',
    `Overall Spreadsheet Integrity Status is 'PASS' (actual: ${integrityReport.overallStatus})`
  );

  assert(
    validProductionQuestions.length >= 1 && validProductionQuestions.every((q) => q.id.startsWith('BP-Q-')),
    `Valid Questions: ${validProductionQuestions.length} canonical production question(s) [${validProductionQuestions.map((q) => q.id).join(', ')}]`
  );

  assert(
    validProductionVideos.length >= 1 && validProductionVideos.every((v) => v.id.startsWith('BP-V-')),
    `Valid Videos: ${validProductionVideos.length} canonical production video(s) [${validProductionVideos.map((v) => v.id).join(', ')}]`
  );

  assert(
    finalQuestions.every((q) => !isTestArtifact(q)),
    'Zero test artifacts remain in QUESTIONS worksheet'
  );

  assert(
    finalVideos.every((v) => !isTestArtifact(v)),
    'Zero test artifacts remain in VIDEOS worksheet'
  );

  console.log('\n================================================================');
  console.log(`PURGE & INTEGRITY AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    throw new Error(`Integrity verification failed: ${totalTests - passedTests} test(s) failed`);
  }

  return {
    purgedCount: purgedArtifacts.length,
    purgedArtifacts,
    integrityReport,
    validProductionQuestions,
    validProductionVideos,
  };
}

// Auto-execute if run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runPurgeTestArtifacts().catch((err) => {
    console.error('\n[FATAL] Purge test artifacts script execution failed:', err);
    process.exit(1);
  });
}
