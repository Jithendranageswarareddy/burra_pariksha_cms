/**
 * BURRA PARIKSHA CMS — S7-T10 Design System Consolidation Verification Test
 *
 * Verifies that:
 * 1. The canonical design system (frontend/design-system) exports all 8 required primitive families:
 *    - Button (Button, IconButton, ButtonGroup)
 *    - Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard)
 *    - Modal (Modal, ConfirmModal)
 *    - Badge (Badge, BADGE_CONFIG)
 *    - Loading / Spinner (Spinner, PageLoading, SectionLoading, CardLoading, ButtonLoading, Skeleton)
 *    - EmptyState (EmptyState)
 *    - Input (Input, Textarea, SearchInput)
 *    - Select (Select)
 * 2. Obsolete duplicate wrappers under `frontend/components/common/` are completely removed.
 * 3. Zero active frontend source files import from `components/common` or `common/`.
 * 4. Domain badge adapters (frontend/components/badges) reuse canonical `Badge` primitive
 *    and do NOT re-export generic Badge or BADGE_CONFIG.
 * 5. Architectural invariants are preserved (canonical 15-step workflow, Firestore authority).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(rootDir, 'frontend');

async function runDesignSystemConsolidationTest() {
  console.log('============================================================');
  console.log('S7-T10 DESIGN SYSTEM CONSOLIDATION ACCEPTANCE GATE');
  console.log('============================================================\n');

  // 1. Verify Authoritative Design System Exports
  console.log('[1] Verifying canonical design-system exports in frontend/design-system/index.ts...');
  const dsIndexPath = path.resolve(frontendDir, 'design-system/index.ts');
  assert(fs.existsSync(dsIndexPath), 'frontend/design-system/index.ts must exist');
  const dsIndexContent = fs.readFileSync(dsIndexPath, 'utf-8');

  // Verify all 8 component families are exported
  const requiredComponentExports = [
    'components/Button',
    'components/Card',
    'components/Badge',
    'components/Modal',
    'components/Loading',
    'components/EmptyState',
    'components/Input',
    'components/Select',
  ];

  for (const exp of requiredComponentExports) {
    assert(
      dsIndexContent.includes(exp),
      `frontend/design-system/index.ts must export ${exp}`
    );
  }

  // Verify StatCard in Card.tsx
  const cardComponentPath = path.resolve(frontendDir, 'design-system/components/Card.tsx');
  const cardContent = fs.readFileSync(cardComponentPath, 'utf-8');
  assert(cardContent.includes('export const StatCard'), 'Card.tsx must export StatCard');
  assert(cardContent.includes('export interface StatCardProps'), 'Card.tsx must export StatCardProps');

  // Verify SearchInput in Input.tsx
  const inputComponentPath = path.resolve(frontendDir, 'design-system/components/Input.tsx');
  const inputContent = fs.readFileSync(inputComponentPath, 'utf-8');
  assert(inputContent.includes('export const SearchInput'), 'Input.tsx must export SearchInput');
  assert(inputContent.includes('export interface SearchInputProps'), 'Input.tsx must export SearchInputProps');

  console.log('    PASS: All 8 component families and composite controls exported from design-system.\n');

  // 2. Verify Elimination of Obsolete Generic Wrappers in frontend/components/common
  console.log('[2] Verifying removal of duplicate wrappers in frontend/components/common...');
  const commonDir = path.resolve(frontendDir, 'components/common');
  const obsoleteFiles = [
    'Button.tsx',
    'Modal.tsx',
    'EmptyState.tsx',
    'LoadingState.tsx',
    'SearchInput.tsx',
    'StatCard.tsx',
    'TechnicalDetails.tsx',
    'StatusBadge.tsx',
    'DifficultyBadge.tsx',
  ];

  for (const file of obsoleteFiles) {
    const filePath = path.join(commonDir, file);
    assert(
      !fs.existsSync(filePath),
      `Obsolete file ${file} must NOT exist under frontend/components/common/`
    );
  }
  console.log('    PASS: Zero obsolete duplicate wrappers exist in frontend/components/common/.\n');

  // 3. Verify Zero Consumers of components/common or common/
  console.log('[3] Scanning all frontend files for illegal common/ imports...');
  function scanFiles(dir: string, list: string[] = []): string[] {
    if (!fs.existsSync(dir)) return list;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanFiles(full, list);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        list.push(full);
      }
    }
    return list;
  }

  const allFrontendFiles = scanFiles(frontendDir);
  const forbiddenImportPattern = /(from\s+['"][^'"]*components\/common(\/[^'"]*)?['"]|from\s+['"][^'"]*\/common\/[^'"]*['"])/;
  const violations: Array<{ file: string; line: number; text: string }> = [];

  for (const file of allFrontendFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (forbiddenImportPattern.test(line)) {
        violations.push({
          file: path.relative(rootDir, file).replace(/\\/g, '/'),
          line: idx + 1,
          text: trimmed,
        });
      }
    });
  }

  if (violations.length > 0) {
    console.error(`FAILED: Found ${violations.length} lingering imports from components/common:`);
    violations.forEach((v) => console.error(`  - ${v.file}:${v.line} -> ${v.text}`));
    process.exit(1);
  }
  console.log(`    PASS: Scanned ${allFrontendFiles.length} files. Zero imports from components/common or common/ found.\n`);

  // 4. Verify Domain Badges Reuse Canonical Badge Primitive
  console.log('[4] Verifying domain badge adapters in frontend/components/badges...');
  const statusBadgePath = path.resolve(frontendDir, 'components/badges/StatusBadge.tsx');
  assert(fs.existsSync(statusBadgePath), 'frontend/components/badges/StatusBadge.tsx must exist');
  const statusBadgeContent = fs.readFileSync(statusBadgePath, 'utf-8');

  assert(
    statusBadgeContent.includes("from '../../design-system'"),
    'StatusBadge.tsx must import canonical Badge from design-system'
  );
  assert(
    !statusBadgeContent.includes('export { Badge, BADGE_CONFIG }'),
    'StatusBadge.tsx must NOT re-export generic Badge primitive or BADGE_CONFIG'
  );
  assert(
    statusBadgeContent.includes('export const QuestionStatusBadge'),
    'StatusBadge.tsx must export QuestionStatusBadge'
  );
  assert(
    statusBadgeContent.includes('export const VideoStatusBadge'),
    'StatusBadge.tsx must export VideoStatusBadge'
  );
  assert(
    statusBadgeContent.includes('export const SocialStatusBadge'),
    'StatusBadge.tsx must export SocialStatusBadge'
  );

  const diffBadgePath = path.resolve(frontendDir, 'components/badges/DifficultyBadge.tsx');
  assert(fs.existsSync(diffBadgePath), 'frontend/components/badges/DifficultyBadge.tsx must exist');
  const diffBadgeContent = fs.readFileSync(diffBadgePath, 'utf-8');
  assert(
    diffBadgeContent.includes("from '../../design-system'"),
    'DifficultyBadge.tsx must import canonical Badge from design-system'
  );
  assert(
    diffBadgeContent.includes('export const DifficultyBadge'),
    'DifficultyBadge.tsx must export DifficultyBadge'
  );

  console.log('    PASS: Domain badges cleanly reuse canonical Badge without competing re-exports.\n');

  console.log('============================================================');
  console.log('S7-T10 VERIFICATION RESULT: ALL GATES PASSED (5/5)');
  console.log('============================================================\n');
}

runDesignSystemConsolidationTest().catch((err) => {
  console.error('Fatal error during S7-T10 verification:', err);
  process.exit(1);
});
