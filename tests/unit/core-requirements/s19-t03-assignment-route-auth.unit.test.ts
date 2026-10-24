import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routes = fs.readFileSync(
  path.join(process.cwd(), 'backend/server/routers/routes.ts'),
  'utf8'
);

const protectedAssignmentRoutes = [
  "get('/assignments'",
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

const unassignedDeclarationStart = routes.indexOf("apiRouter.get(\n  '/assignments/unassigned'");
assert.notEqual(unassignedDeclarationStart, -1, 'Expected unassigned assignment route');
const unassignedDeclaration = routes.slice(
  unassignedDeclarationStart,
  routes.indexOf('=>', unassignedDeclarationStart)
);
assert.match(unassignedDeclaration, /requireRole/, 'Unassigned work must require a manager role');

const entityRouteStart = routes.indexOf("apiRouter.get('/assignments/entity/:entityType/:entityId'");
const entityRouteEnd = routes.indexOf("apiRouter.get('/assignments/:id'", entityRouteStart);
const entityRoute = routes.slice(entityRouteStart, entityRouteEnd);
assert.match(entityRoute, /getRequestActor/, 'Entity assignment reads must resolve the server actor');
assert.match(entityRoute, /isManagerOrAdmin/, 'Entity assignment reads must distinguish manager scope');
assert.match(entityRoute, /assigneeId === actor\.id/, 'Non-manager entity reads must be scoped to the caller');

const legacyWorkflowRouteStart = routes.indexOf("apiRouter.get('/workflow/:entityType/:entityId'");
assert.notEqual(legacyWorkflowRouteStart, -1, 'Expected legacy workflow history route');
const legacyWorkflowDeclaration = routes.slice(
  legacyWorkflowRouteStart,
  routes.indexOf('=>', legacyWorkflowRouteStart)
);
assert.match(
  legacyWorkflowDeclaration,
  /requireAuth/,
  'Workflow history must require authentication before exposing immutable transition records'
);

console.log('PASS: S19-T03 assignment reads and assignee actions require authentication.');
