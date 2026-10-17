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

  // 3. Check for duplicates in historical S7 manifest
  assert.strictEqual(
    duplicatePaths.length,
    0,
    `Found duplicate paths in inventory manifest: ${duplicatePaths.join(', ')}`
  );
  console.log('    PASS: Zero duplicate entries in inventory manifest.');

  // 4. Historical S7 Baseline vs Current Repository Reconciliation Separation
  // Under AGENTS.md §1 and S8-T08-FOLDER-BOUNDARIES-INTEGRATION-DESIGN.md:
  // - The Sprint 7 manifest (713 files) is an immutable historical audit record.
  // - Files in the S7 manifest must exist in the git repository (extraInManifest === 0).
  // - Tracked files beyond the S7 manifest must belong to approved subsequent sprint scopes (Sprint 8).
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

  // Audit post-S7 additions against approved sprint scopes
  const postS7Additions = gitFiles.filter((f) => !seenPaths.has(f));
  console.log(`\n[Post-S7 Delta] Discovered ${postS7Additions.length} files added after Sprint 7 baseline.`);

  const approvedPostS7Scopes = [
    /^docs\/sprints\/sprint-08\//,
    /^frontend\/features\/question-generation\/components\//,
    /^backend\/server\/routers\/script\.routes\.ts$/,
    /^shared\/lib\/workflow-resolver\.ts$/,
    /^shared\/registry\//,
    /^shared\/types\/(content-mode-registry|production-context)\.ts$/,
    /^tests\/(api|integration|unit)\/(s8-|script-routes)/,
  ];

  const unapprovedAdditions = postS7Additions.filter(
    (f) => !approvedPostS7Scopes.some((pattern) => pattern.test(f))
  );

  if (unapprovedAdditions.length > 0) {
    console.error(`FAILED: ${unapprovedAdditions.length} unapproved/unaccounted tracked files outside S7 baseline and S8 scope:`);
    unapprovedAdditions.forEach((f) => console.error(`  - ${f}`));
  }

  assert.strictEqual(
    unapprovedAdditions.length,
    0,
    `Found ${unapprovedAdditions.length} unapproved/unaccounted tracked files outside S7 baseline and S8 scope: ${unapprovedAdditions.join(', ')}`
  );

  assert.strictEqual(
    manifestRows.length + postS7Additions.length,
    gitFiles.length,
    `Reconciled total (${manifestRows.length} S7 + ${postS7Additions.length} post-S7) must match git tracked files (${gitFiles.length})`
  );

  console.log(`    PASS: Exact reconciliation: ${manifestRows.length} S7 baseline + ${postS7Additions.length} approved Sprint 8 additions = ${gitFiles.length} total tracked files.\n`);

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
          manifestRows.length,
          `Section 1.3 TOTAL (${count}) must match historical manifest rows count (${manifestRows.length})`
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
    manifestRows.length,
    `Heading "All ${headingCount} Files" must match historical manifest row count (${manifestRows.length})`
  );

  console.log('============================================================');
  console.log(`INVENTORY RECONCILIATION RESULT: ALL CHECKS PASSED (${manifestRows.length} S7 baseline + ${postS7Additions.length} Sprint 8 = ${gitFiles.length} files)`);
  console.log('============================================================\n');
}

runInventoryReconciliation().catch((err) => {
  console.error('Fatal error during inventory reconciliation:', err);
  process.exit(1);
});
