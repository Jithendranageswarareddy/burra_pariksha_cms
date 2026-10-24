/**
 * S16-T03 role-aware production workbench acceptance.
 *
 * This test stays at the component/API boundary: it proves that the existing
 * navigation hides unavailable workbench pages while the typed read models
 * remain reachable through the existing backend routes. It does not exercise
 * a browser, mutate Firestore, or call an external provider.
 */
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../frontend/contexts/AuthContext';
import { Sidebar } from '../../../frontend/components/layout/Sidebar';
import { AUTHORITATIVE_HUBS } from '../../../src/config/navigation';
import { CanonicalRole, hasNavigationCapability } from '../../../src/config/roles';
import { apiClient } from '../../../frontend/api/api-client';
import { learningUnitsApi } from '../../../frontend/api/learning-units.api';

const baseUser = {
  id: 'usr_s16_t03',
  name: 'Synthetic Workbench Reviewer',
  email: 's16-t03@example.test',
  role: CanonicalRole.ADMIN,
  isActive: true,
  createdAt: '2026-10-25T00:00:00.000Z',
  updatedAt: '2026-10-25T00:00:00.000Z',
};

function renderNavigation(role: CanonicalRole): string {
  return renderToString(
    React.createElement(
      AuthContext.Provider,
      {
        value: {
          user: { ...baseUser, role },
          isLoading: false,
          login: async () => ({ success: false }),
          logout: async () => {},
          refreshUser: async () => {},
          changePassword: async () => ({ success: false }),
        },
      },
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/production'] },
        React.createElement(Sidebar)
      )
    )
  );
}

const responseFor = (data: unknown): Response =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
const rawResponseFor = (data: unknown): Response =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const originalFetch = globalThis.fetch;
const requestedPaths: string[] = [];

try {
  const productionHub = AUTHORITATIVE_HUBS.find((hub) => hub.id === 'hub-production');
  assert.ok(productionHub, 'Production hub must remain in the frozen navigation registry.');
  assert.equal(
    productionHub.items.find((item) => item.id === 'production-pipeline')?.href,
    '/production'
  );
  assert.equal(
    productionHub.items.find((item) => item.id === 'production-queue')?.href,
    '/queue'
  );

  assert.equal(hasNavigationCapability(CanonicalRole.VIDEO_EDITOR, 'VIEW_PRODUCTION'), true);
  assert.equal(hasNavigationCapability(CanonicalRole.ANALYST, 'VIEW_PRODUCTION'), false);
  assert.equal(hasNavigationCapability(CanonicalRole.ADMIN, 'VIEW_PRODUCTION'), true);

  const editorNavigation = renderNavigation(CanonicalRole.VIDEO_EDITOR);
  assert.match(editorNavigation, /Production Pipeline/);
  assert.match(editorNavigation, /Recording Queue/);

  const analystNavigation = renderNavigation(CanonicalRole.ANALYST);
  assert.doesNotMatch(analystNavigation, /Production Pipeline/);
  assert.doesNotMatch(analystNavigation, /Recording Queue/);
  assert.match(analystNavigation, /Analytics Hub/);

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const path = new URL(String(input), 'http://localhost').pathname;
    requestedPaths.push(path);
    if (path === '/api/videos') return rawResponseFor([]);
    if (path === '/api/videos/stats') return rawResponseFor({ total: 0, byStatus: {} });
    if (path === '/api/planning/learning-units') return responseFor([]);
    throw new Error(`Unexpected S16-T03 read-model path: ${path}`);
  }) as typeof fetch;

  const videos = await apiClient.getVideos();
  const stats = await apiClient.getProductionStats();
  const learningUnits = await learningUnitsApi.list();
  assert.deepEqual(videos, []);
  assert.deepEqual(stats, { total: 0, byStatus: {} });
  assert.deepEqual(learningUnits, []);
  assert.deepEqual(requestedPaths, [
    '/api/videos',
    '/api/videos/stats',
    '/api/planning/learning-units',
  ]);

  console.log(
    'S16-T03 production workbench acceptance passed (role-aware navigation and typed read-model boundaries).'
  );
} finally {
  globalThis.fetch = originalFetch;
}
