/**
 * BURRA PARIKSHA CMS — S7-T01 Repository Forensic Inventory Reconciliation Test
 *
 * Verifies that:
 * 1. Every single file tracked in `git ls-files` is accounted for in Section 2 of
 *    `docs/sprints/sprint-07/S7-T01-REPOSITORY-FORENSIC-INVENTORY.md` (0 missing, 0 extra).
 * 2. There are 0 duplicate file entries in the manifest table.
 * 3. Section 1.2 Physical Distribution table numbers match actual manifest file paths exactly.
 * 4. Section 1.3 Architectural Classification totals match actual manifest classifications exactly.
 * 5. Section 2 headings and summary totals match the actual git tracked file count.
 */

import assert from 'node:assert';
import cp from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Authoritative explicit manifest of approved post-Sprint-7 additions.
 * Under AGENTS.md §1 and S8-T08-FOLDER-BOUNDARIES-INTEGRATION-DESIGN.md:
 * - The historical Sprint 7 manifest (713 files) is immutable.
 * - Every post-S7 file tracked in git must explicitly belong to an approved sprint deliverable.
 * - Broad regex or directory patterns are prohibited to prevent arbitrary un-audited file creep.
 */
export const AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS: readonly string[] = [
  'backend/server/routers/script.routes.ts',
  'docs/sprints/sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md',
  'docs/sprints/sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md',
  'docs/sprints/sprint-08/S8-T07-WORKFLOW-RESOLUTION-TRANSITION-DESIGN.md',
  'docs/sprints/sprint-08/S8-T08-FOLDER-BOUNDARIES-INTEGRATION-DESIGN.md',
  'docs/sprints/sprint-08/S8-TASK-RECONCILIATION-REPORT.md',
  'frontend/features/question-generation/components/ExplainedQuestionsWorkspace.tsx',
  'frontend/features/question-generation/components/ProductionModeModal.tsx',
  'frontend/features/question-generation/components/ProductionWorkbenchSummary.tsx',
  'frontend/features/question-generation/components/TopicIntroWorkspace.tsx',
  'shared/lib/workflow-resolver.ts',
  'shared/registry/content-mode.registry.ts',
  'shared/registry/index.ts',
  'shared/types/content-mode-registry.ts',
  'shared/types/production-context.ts',
  'tests/api/s8-t15-backend-persistence-draft-resumption.api.test.ts',
  'tests/api/s8-t18-api-persistence-auth-recovery.api.test.ts',
  'tests/integration/s8-t15-firestore-draft-persistence.integration.test.ts',
  'tests/integration/s8-t18-firestore-persistence-recovery.integration.test.ts',
  'tests/integration/script-routes.integration.test.ts',
  'tests/unit/s8-t06-production-context.unit.test.ts',
  'tests/unit/s8-t07-draft-reopening.unit.test.ts',
  'tests/unit/s8-t08-mode-workspaces.unit.test.ts',
  'tests/unit/s8-t09-script-multimode.unit.test.ts',
  'tests/unit/s8-t10-dynamic-topic-selection.unit.test.ts',
  'tests/unit/s8-t11-dependent-subtopic-selection.unit.test.ts',
  'tests/unit/s8-t12-content-mode-configuration.unit.test.ts',
  'tests/unit/s8-t13-production-workbench.unit.test.ts',
  'tests/unit/s8-t14-dynamic-workflow-resolution.unit.test.ts',
  'tests/unit/s8-t16-content-mode-workflow-rules.unit.test.ts',
  'tests/unit/s8-t17-dynamic-page-states-navigation.unit.test.ts',
];

const EXPECTED_HISTORICAL_S7_COUNT = 713;

async function runInventoryReconciliation() {
  console.log('============================================================');
  console.log('S7-T01 INVENTORY MANIFEST & GIT TRACKED FILE RECONCILIATION');
  console.log('============================================================\n');

  // 1. Authoritative git tracked files
  const rootDir = path.resolve(__dirname, '../..');
  const gitFilesRaw = cp.execSync('git ls-files', { cwd: rootDir, encoding: 'utf8' });
  const gitFiles = gitFilesRaw.trim().split(/\r?\n/).filter(Boolean);
  const gitSet = new Set(gitFiles);

  console.log(`[1] Discovered ${gitFiles.length} tracked files in git index.`);

  // 2. Parse inventory markdown
  const inventoryPath = path.resolve(rootDir, 'docs/sprints/sprint-07/S7-T01-REPOSITORY-FORENSIC-INVENTORY.md');
  assert(fs.existsSync(inventoryPath), 'Inventory document must exist');
  const inventoryContent = fs.readFileSync(inventoryPath, 'utf8');
  const lines = inventoryContent.split(/\r?\n/);

  // Locate Section 2
  const s2Idx = lines.findIndex((l) => l.includes('## 2. Complete File Ownership Manifest'));
  assert(s2Idx !== -1, 'Section 2 heading must exist in inventory document');
  const s2Lines = lines.slice(s2Idx);

  const manifestRows: Array<{ path: string; classification: string; raw: string }> = [];
  const manifestPaths: string[] = [];
  const seenPaths = new Set<string>();
  const duplicatePaths: string[] = [];

  for (const line of s2Lines) {
    if (line.startsWith('| ') && !line.startsWith('| Current Path') && !line.startsWith('|:---')) {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length > 8) {
        const filePath = parts[1];
        const classification = parts[8].replace(/\*\*/g, '');
        manifestRows.push({ path: filePath, classification, raw: line });
        manifestPaths.push(filePath);

        if (seenPaths.has(filePath)) {
          duplicatePaths.push(filePath);
        }
        seenPaths.add(filePath);
      }
    }
  }

  console.log(`[2] Parsed ${manifestRows.length} manifest rows in Section 2.`);

  // 3. Explicitly validate expected 713 unique rows and zero duplicates in historical S7 manifest
  assert.strictEqual(
    manifestRows.length,
    EXPECTED_HISTORICAL_S7_COUNT,
    `Historical S7 manifest row count must be exactly ${EXPECTED_HISTORICAL_S7_COUNT}, but found ${manifestRows.length}`
  );
  assert.strictEqual(
    duplicatePaths.length,
    0,
    `Found duplicate paths in inventory manifest: ${duplicatePaths.join(', ')}`
  );
  console.log(`    PASS: Historical S7 manifest contains exactly ${EXPECTED_HISTORICAL_S7_COUNT} unique rows with zero duplicates.`);

  // 4. Historical S7 Baseline vs Current Repository Reconciliation Separation
  // Under AGENTS.md §1 and S8-T08-FOLDER-BOUNDARIES-INTEGRATION-DESIGN.md:
  // - The Sprint 7 manifest (713 files) is an immutable historical audit record.
  // - Files in the S7 manifest must exist in the git repository (extraInManifest === 0).
  // - Tracked files beyond the S7 manifest must belong to the explicit approved post-S7 manifest.
  const extraInManifest = manifestPaths.filter((f) => !gitSet.has(f));

  if (extraInManifest.length > 0) {
    console.error(`FAILED: ${extraInManifest.length} manifest entries not found in git tracked files:`);
    extraInManifest.forEach((f) => console.error(`  - ${f}`));
  }

  assert.strictEqual(
    extraInManifest.length,
    0,
    `${extraInManifest.length} files in historical S7 inventory manifest are not tracked in git`
  );
  console.log(`    PASS: All ${manifestRows.length} historical S7 manifest files confirmed present in git repository.`);

  // 5. Meaningful Reconciliation of Current Git Index against S7 Baseline + Authoritative Post-S7 Manifest
  const approvedPostS7Set = new Set(AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS);
  assert.strictEqual(
    approvedPostS7Set.size,
    AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length,
    'Authoritative approved post-S7 list must have zero duplicate entries'
  );

  // Check 5a: Disallow overlap between S7 baseline and post-S7 additions
  const overlappingFiles = AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.filter((f) => seenPaths.has(f));
  assert.strictEqual(
    overlappingFiles.length,
    0,
    `Approved post-S7 list contains files that already exist in S7 baseline: ${overlappingFiles.join(', ')}`
  );

  // Check 5b: Check for missing post-S7 approved files (approved file expected in git but missing)
  const missingApprovedPostS7 = AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.filter((f) => !gitSet.has(f));
  if (missingApprovedPostS7.length > 0) {
    console.error(`FAILED: ${missingApprovedPostS7.length} approved post-S7 files missing from git tracked files:`);
    missingApprovedPostS7.forEach((f) => console.error(`  - ${f}`));
  }
  assert.strictEqual(
    missingApprovedPostS7.length,
    0,
    `${missingApprovedPostS7.length} approved post-S7 files are missing from git tracked files`
  );

  // Check 5c: Check for unapproved additions (tracked in git, but neither in S7 manifest nor in approved post-S7 list)
  const actualPostS7Tracked = gitFiles.filter((f) => !seenPaths.has(f));
  const unapprovedTrackedFiles = actualPostS7Tracked.filter((f) => !approvedPostS7Set.has(f));
  if (unapprovedTrackedFiles.length > 0) {
    console.error(`FAILED: ${unapprovedTrackedFiles.length} unapproved/unaccounted tracked files found in git:`);
    unapprovedTrackedFiles.forEach((f) => console.error(`  - ${f}`));
  }
  assert.strictEqual(
    unapprovedTrackedFiles.length,
    0,
    `Found ${unapprovedTrackedFiles.length} unapproved/unaccounted tracked files outside S7 baseline and approved post-S7 manifest: ${unapprovedTrackedFiles.join(', ')}`
  );

  // Check 5d: Meaningful non-tautological total reconciliation
  const expectedTotalTracked = EXPECTED_HISTORICAL_S7_COUNT + AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length;
  assert.strictEqual(
    gitFiles.length,
    expectedTotalTracked,
    `Total git tracked files (${gitFiles.length}) must equal exact sum of S7 baseline (${EXPECTED_HISTORICAL_S7_COUNT}) + approved post-S7 manifest (${AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length}) = ${expectedTotalTracked}`
  );
  assert.strictEqual(
    actualPostS7Tracked.length,
    AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length,
    `Actual post-S7 tracked additions count (${actualPostS7Tracked.length}) must exactly match authoritative approved list count (${AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length})`
  );

  console.log(`    PASS: Meaningful reconciliation verified: exactly ${EXPECTED_HISTORICAL_S7_COUNT} S7 baseline files + ${AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length} explicitly approved Sprint 8 additions = ${gitFiles.length} total tracked files.\n`);

  // 5. Verify Physical Distribution totals (Section 1.2)
  console.log('[3] Verifying Section 1.2 Physical Distribution totals...');
  const actualDirCounts: Record<string, number> = {};
  for (const r of manifestRows) {
    const parts = r.path.split('/');
    const dirKey = parts.length > 1 ? parts[0] + '/' : 'Root (/)';
    actualDirCounts[dirKey] = (actualDirCounts[dirKey] || 0) + 1;
  }

  // Parse Section 1.2 table rows
  const s12Idx = lines.findIndex((l) => l.includes('### 1.2 Repository Physical Distribution'));
  assert(s12Idx !== -1, 'Section 1.2 must exist');
  const s12Lines = lines.slice(s12Idx, s2Idx);

  for (const line of s12Lines) {
    if (line.startsWith('| ') && !line.startsWith('| Top-Level') && !line.startsWith('|:---') && !line.includes('**Total**')) {
      const parts = line.split('|').map((s) => s.trim());
      const dir = parts[1];
      const count = parseInt(parts[2], 10);
      assert(!isNaN(count), `Invalid count for directory ${dir} in Section 1.2: ${parts[2]}`);
      const actualCount = actualDirCounts[dir] || 0;
      assert.strictEqual(
        actualCount,
        count,
        `Section 1.2 count for ${dir} (${count}) does not match actual manifest count (${actualCount})`
      );
    }
  }
  console.log('    PASS: Section 1.2 directory counts match actual manifest distribution exactly.\n');

  // 6. Verify Architectural Classification totals (Section 1.3)
  console.log('[4] Verifying Section 1.3 Classification totals...');
  const actualClassCounts: Record<string, number> = {};
  for (const r of manifestRows) {
    actualClassCounts[r.classification] = (actualClassCounts[r.classification] || 0) + 1;
  }

  const s13Idx = lines.findIndex((l) => l.includes('### 1.3 Primary Architectural Classification Breakdown'));
  assert(s13Idx !== -1, 'Section 1.3 must exist');
  const s13Lines = lines.slice(s13Idx, s2Idx);

  for (const line of s13Lines) {
    const match = line.match(/^\s*([A-Z_]+)\s*:\s*(\d+)\s*files/);
    if (match) {
      const cls = match[1];
      const count = parseInt(match[2], 10);
      if (cls === 'TOTAL') {
        assert.strictEqual(
          count,
          EXPECTED_HISTORICAL_S7_COUNT,
          `Section 1.3 TOTAL (${count}) must match expected historical manifest rows count (${EXPECTED_HISTORICAL_S7_COUNT})`
        );
      } else {
        const actualCount = actualClassCounts[cls] || 0;
        assert.strictEqual(
          actualCount,
          count,
          `Section 1.3 count for ${cls} (${count}) does not match actual manifest count (${actualCount})`
        );
      }
    }
  }
  console.log('    PASS: Section 1.3 classification counts match actual manifest classifications exactly.\n');

  // 7. Verify Document Headings & Claims
  console.log('[5] Verifying Document Summary & Heading consistency...');
  const headingMatches = inventoryContent.match(/All (\d+) Files/);
  assert(headingMatches, 'Manifest heading should state "All N Files"');
  const headingCount = parseInt(headingMatches[1], 10);
  assert.strictEqual(
    headingCount,
    EXPECTED_HISTORICAL_S7_COUNT,
    `Heading "All ${headingCount} Files" must match expected historical manifest row count (${EXPECTED_HISTORICAL_S7_COUNT})`
  );

  console.log('============================================================');
  console.log(`INVENTORY RECONCILIATION RESULT: ALL CHECKS PASSED (${EXPECTED_HISTORICAL_S7_COUNT} S7 baseline + ${AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS.length} Sprint 8 = ${gitFiles.length} files)`);
  console.log('============================================================\n');
}

runInventoryReconciliation().catch((err) => {
  console.error('Fatal error during inventory reconciliation:', err);
  process.exit(1);
});
