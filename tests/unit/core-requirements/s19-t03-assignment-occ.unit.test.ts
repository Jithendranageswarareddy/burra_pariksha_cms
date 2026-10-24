import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const service = fs.readFileSync(
  path.join(process.cwd(), 'backend/infrastructure/auth/services/assignment.service.ts'),
  'utf8'
);

const lifecycleMethods = [
  'updateAssignment',
  'reassignAssignment',
  'startAssignment',
  'blockAssignment',
  'completeAssignment',
  'cancelAssignment',
];

for (const method of lifecycleMethods) {
  const start = service.indexOf(`public async ${method}(`);
  assert.notEqual(start, -1, `Expected assignment lifecycle method ${method}`);
  const nextMethod = service.indexOf('\n  public async ', start + 1);
  const body = service.slice(start, nextMethod === -1 ? service.length : nextMethod);
  assert.match(
    body,
    /updateRecord\(id, updated, \{\s*expectedVersion: existing\.version,\s*\}\)/s,
    `${method} must persist using the version read before authorization and transition`
  );
}

console.log('PASS: Assignment lifecycle mutations preserve OCC expectedVersion boundaries.');
