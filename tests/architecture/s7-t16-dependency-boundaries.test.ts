import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanBoundarySources,
  scanProductionBoundaries,
  type BoundaryRuleId,
} from './dependency-boundary-scanner';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fixture(fileName: string, content: string) {
  return scanBoundarySources([{ fileName, content }], projectRoot);
}

function assertRule(rule: BoundaryRuleId, fileName: string, content: string, declaration: string) {
  const violations = fixture(fileName, content);
  assert.equal(
    violations.length,
    1,
    `${rule} fixture should produce exactly one violation:\n${violations.map((violation) =>
      `${violation.rule} ${violation.importer}:${violation.line} -> ${violation.forbiddenDependency} `
      + `${violation.importDeclaration} (expected: ${violation.expected})`).join('\n')}`,
  );
  assert.equal(violations[0].rule, rule);
  assert.equal(violations[0].importer, fileName);
  assert.match(violations[0].importDeclaration, new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('============================================================');
console.log('S7-T16 DEPENDENCY-BOUNDARY ARCHITECTURAL TEST');
console.log('============================================================');

const productionViolations = scanProductionBoundaries(projectRoot);
assert.equal(
  productionViolations.length,
  0,
  `Existing production boundary violations:\n${productionViolations.map((v) =>
    `${v.rule} ${v.importer}:${v.line} -> ${v.forbiddenDependency}`).join('\n')}`,
);
console.log('PASS: production source has zero DB-001 through DB-008 violations.');

assertRule('DB-001', 'frontend/fixture.ts', "import service from '@/backend/features/example';", '@/backend');
assertRule('DB-002', 'frontend/fixture.ts', "import repo from '../../database/firestore/repositories/example';", '../../database');
assertRule('DB-003', 'frontend/fixture.ts', "import { getFirestore } from 'firebase-admin/firestore';", 'firebase-admin/firestore');
assertRule('DB-004', 'frontend/fixture.ts', "import provider from '@/backend/ai/providers/gemini.client';", '@/backend/ai/providers');
assertRule('DB-004', 'frontend/fixture.ts', "const provider = await import('@google/genai');", '@google/genai');
assertRule('DB-005', 'backend/fixture.ts', "export { Button } from '@/frontend/components/Button';", '@/frontend');
assertRule('DB-006', 'database/firestore/fixture.ts', "const page = require('../../frontend/pages/HomePage');", '../../frontend');
assertRule('DB-007', 'shared/fixture.ts', "import service from '@/backend/domain/example';", '@/backend');
assertRule('DB-008', 'shared/fixture.ts', "import page from '@/frontend/pages/HomePage';", '@/frontend');

assert.equal(fixture('frontend/fixture.ts', "import { type User } from '@/shared/contracts/user';").length, 0);
assert.equal(fixture('frontend/fixture.ts', "import client from '@/frontend/api/api-client';").length, 0);
assert.equal(fixture('frontend/fixture.ts', "const value = await import('@/shared/types/content');").length, 0);
console.log('PASS: permitted shared/API imports and supported import forms remain allowed.');

console.log('PASS: DB-001 through DB-008 mutation fixtures detected the expected rule, importer, and declaration.');
