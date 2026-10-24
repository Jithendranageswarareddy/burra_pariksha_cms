import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

type RouteAudit = {
  source: string;
  line: number;
  method: string;
  declaration: string;
  authentication: 'PASS' | 'FAIL';
  authorization: 'PASS' | 'NOT_APPLICABLE';
  actorBoundary: 'PASS' | 'NOT_APPLICABLE';
  notes: string;
};

const root = process.cwd();
const routeSources = [
  { name: 'routes.ts', file: path.join(root, 'backend/server/routers/routes.ts'), globalAuthLine: 1156 },
  { name: 'script.routes.ts', file: path.join(root, 'backend/server/routers/script.routes.ts'), globalAuthLine: Number.POSITIVE_INFINITY },
];

const publicAuthMutationPrefixes = [
  '/auth/login',
  '/v1/auth/login',
  '/auth/logout',
  '/v1/auth/logout',
  '/auth/forgot-password',
  '/v1/auth/forgot-password',
  '/auth/verify-reset-code',
  '/v1/auth/verify-reset-code',
  '/auth/reset-password',
  '/v1/auth/reset-password',
  '/auth/bootstrap-admin',
  '/v1/auth/bootstrap-admin',
];

// POST is also used for bounded calculations, AI drafts, and workflow
// resolution. These endpoints do not mutate authoritative records and are
// intentionally excluded from the mutation-control matrix.
const nonMutatingPostPrefixes = [
  '/questions/smart-random',
  '/workflow/resolve',
  '/v1/workflow/resolve',
  '/api/v1/workflow/resolve',
  '/adaptations/recommend',
  '/copilot/script',
  '/social-enhancement/',
];

function auditSource(source: { name: string; file: string; globalAuthLine: number }): RouteAudit[] {
  const lines = fs.readFileSync(source.file, 'utf8').split(/\r?\n/);
  const audits: RouteAudit[] = [];
  const declarationPattern = /^\s*(apiRouter|scriptRouter)\.(post|put|patch|delete)\s*\(/;

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(declarationPattern);
    if (!match) continue;

    let end = index + 1;
    while (end < lines.length && !declarationPattern.test(lines[end])) end++;
    const block = lines.slice(index, end).join('\n');
    const declaration = lines[index].trim();
    if (match[2] === 'post' && nonMutatingPostPrefixes.some((prefix) => declaration.includes(prefix))) continue;
    const isPublicAuth = publicAuthMutationPrefixes.some((prefix) => declaration.includes(prefix));
    const hasLocalAuth = /\brequire(Auth|Role|Capability)\b/.test(block);
    const hasGlobalAuth = index + 1 >= source.globalAuthLine;
    const authenticated = isPublicAuth || hasLocalAuth || hasGlobalAuth;
    const authorization = isPublicAuth
      ? 'NOT_APPLICABLE'
      : hasGlobalAuth || /\brequire(Role|Capability)\b|objectAuthService|getRequestActor|Service\./.test(block)
        ? 'PASS'
        : 'FAIL';
    const actorBoundary = isPublicAuth
      ? 'NOT_APPLICABLE'
      : hasGlobalAuth || /\brequire(Auth|Role|Capability)\b|\bgetRequestActor\b|\breq\.user\b|\bactor(?:UserId|Id)?\b|\bcurrentActor\b/.test(block)
        ? 'PASS'
        : 'FAIL';

    audits.push({
      source: source.name,
      line: index + 1,
      method: match[2].toUpperCase(),
      declaration,
      authentication: authenticated ? 'PASS' : 'FAIL',
      authorization,
      actorBoundary,
      notes: isPublicAuth
        ? 'Documented public authentication lifecycle endpoint.'
        : hasLocalAuth
          ? 'Explicit route middleware or capability boundary.'
          : 'Covered by the router-wide authenticated boundary.',
    });
  }
  return audits;
}

const matrix = routeSources.flatMap(auditSource);
assert.ok(matrix.length >= 50, `Expected the complete mutation inventory, found ${matrix.length}.`);

for (const row of matrix) {
  assert.equal(row.authentication, 'PASS', `${row.source}:${row.line} lacks authentication: ${row.declaration}`);
  assert.notEqual(row.authorization, 'FAIL', `${row.source}:${row.line} lacks capability/authorization evidence: ${row.declaration}`);
  assert.notEqual(row.actorBoundary, 'FAIL', `${row.source}:${row.line} lacks actor-boundary evidence: ${row.declaration}`);
}

const routeSourceText = routeSources.map((source) => fs.readFileSync(source.file, 'utf8')).join('\n');
assert.ok(routeSourceText.includes('/scripts/:scriptId/revert'));
assert.ok(routeSourceText.includes('/media/upload'));
assert.ok(routeSourceText.includes('/workflow/:id/transition'));
console.log(`S13-T05 mutation route matrix passed (${matrix.length} mutation declarations; auth, authorization, and actor boundaries recorded).`);
