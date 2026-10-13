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
  const rootDir = path.resolve(__dirname, '..');
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

  // 3. Check for duplicates
  assert.strictEqual(
    duplicatePaths.length,
    0,
    `Found duplicate paths in inventory manifest: ${duplicatePaths.join(', ')}`
  );
  console.log('    PASS: Zero duplicate entries in inventory manifest.');

  // 4. Exact 1-to-1 reconciliation between git and manifest
  const missingFromManifest = gitFiles.filter((f) => !seenPaths.has(f));
  const extraInManifest = manifestPaths.filter((f) => !gitSet.has(f));

  if (missingFromManifest.length > 0) {
    console.error(`FAILED: ${missingFromManifest.length} tracked files missing from inventory manifest:`);
    missingFromManifest.forEach((f) => console.error(`  - ${f}`));
  }

  if (extraInManifest.length > 0) {
    console.error(`FAILED: ${extraInManifest.length} manifest entries not found in git tracked files:`);
    extraInManifest.forEach((f) => console.error(`  - ${f}`));
  }

  assert.strictEqual(
    missingFromManifest.length,
    0,
    `${missingFromManifest.length} files tracked in git are missing from inventory manifest`
  );
  assert.strictEqual(
    extraInManifest.length,
    0,
    `${extraInManifest.length} files in inventory manifest are not tracked in git`
  );
  assert.strictEqual(
    manifestRows.length,
    gitFiles.length,
    `Manifest row count (${manifestRows.length}) must match git tracked files (${gitFiles.length})`
  );

  console.log(`    PASS: Exact 1-to-1 parity between git ls-files and manifest table (${gitFiles.length} files).\n`);

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
          gitFiles.length,
          `Section 1.3 TOTAL (${count}) does not match git tracked files count (${gitFiles.length})`
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
    gitFiles.length,
    `Heading "All ${headingCount} Files" must match actual tracked file count (${gitFiles.length})`
  );

  console.log('============================================================');
  console.log(`INVENTORY RECONCILIATION RESULT: ALL CHECKS PASSED (${gitFiles.length} files)`);
  console.log('============================================================\n');
}

runInventoryReconciliation().catch((err) => {
  console.error('Fatal error during inventory reconciliation:', err);
  process.exit(1);
});
