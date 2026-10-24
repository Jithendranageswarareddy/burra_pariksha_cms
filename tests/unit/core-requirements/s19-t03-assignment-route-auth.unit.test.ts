import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routes = fs.readFileSync(
  path.join(process.cwd(), 'backend/server/routers/routes.ts'),
  'utf8'
);

const protectedAssignmentRoutes = [
  "get('/assignments'",
  "get('/assignments/unassigned'",
  "get('/assignments/entity/:entityType/:entityId'",
  "get('/assignments/:id'",
  "post('/assignments/:id/start'",
  "post('/assignments/:id/block'",
  "post('/assignments/:id/complete'",
];

for (const route of protectedAssignmentRoutes) {
  const declarationStart = routes.indexOf(`apiRouter.${route}`);
  assert.notEqual(declarationStart, -1, `Expected assignment route ${route}`);
  const declaration = routes.slice(declarationStart, routes.indexOf('=>', declarationStart));
  assert.match(declaration, /requireAuth/, `${route} must require authentication`);
}

console.log('PASS: S19-T03 assignment reads and assignee actions require authentication.');
