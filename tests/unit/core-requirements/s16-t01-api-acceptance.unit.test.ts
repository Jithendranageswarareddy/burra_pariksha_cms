import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  AuthenticatedRequest,
  getRequestActor,
  requireAuth,
  requireRole,
} from '../../../backend/server/middleware/auth.middleware';
import { UserRole } from '../../../shared';

type ResponseDouble = {
  statusCode: number;
  body?: Record<string, unknown>;
  status(code: number): ResponseDouble;
  json(body: Record<string, unknown>): ResponseDouble;
};

function responseDouble(): ResponseDouble {
  const response: ResponseDouble = {
    statusCode: 200,
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(body) {
      response.body = body;
      return response;
    },
  };
  return response;
}

function requestDouble(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    headers: {},
    ...overrides,
  } as AuthenticatedRequest;
}

function runS16T01ApiAcceptanceTests(): void {
  const unauthenticatedResponse = responseDouble();
  let unauthenticatedNextCalled = false;
  requireAuth(
    requestDouble(),
    unauthenticatedResponse as never,
    () => {
      unauthenticatedNextCalled = true;
    }
  );
  assert.equal(unauthenticatedResponse.statusCode, 401);
  assert.equal(unauthenticatedNextCalled, false);

  const roleResponse = responseDouble();
  let roleNextCalled = false;
  requireRole([UserRole.CONTENT_MANAGER])(
    requestDouble({ user: { id: 'usr_author', name: 'Author', role: UserRole.QUESTION_CREATOR } }),
    roleResponse as never,
    () => {
      roleNextCalled = true;
    }
  );
  assert.equal(roleResponse.statusCode, 403);
  assert.equal(roleNextCalled, false);

  const actorRequest = requestDouble();
  assert.throws(
    () => getRequestActor(actorRequest),
    (error: unknown) => error instanceof Error && error.name === 'UnauthenticatedActorError'
  );

  const routeSource = fs.readFileSync('backend/server/routers/routes.ts', 'utf8');
  const requiredRoutes = [
    "apiRouter.get('/planning/learning-units'",
    "apiRouter.get('/planning/learning-units/:id'",
    "apiRouter.post('/planning/learning-units'",
    "apiRouter.put('/planning/learning-units/:id'",
    "apiRouter.post('/planning/learning-units/:id/submit-for-verification'",
  ];
  for (const route of requiredRoutes) {
    assert.ok(routeSource.includes(route), `Expected protected planning route: ${route}`);
  }

  const planningBlockStart = routeSource.indexOf("apiRouter.get('/planning/learning-units'");
  const planningBlock = routeSource.slice(planningBlockStart, planningBlockStart + 5000);
  assert.match(planningBlock, /requireAuth/);
  assert.match(planningBlock, /requireRole\(LEARNING_UNIT_PLANNING_ROLES\)/);
  assert.match(planningBlock, /createSuccessResponse/);
  assert.match(planningBlock, /submitForVerification/);

  console.log(
    'PASS: S16-T01 API acceptance covers unauthenticated/unauthorized boundaries, fail-closed actor resolution, protected planning routes, and safe response wiring.'
  );
}

runS16T01ApiAcceptanceTests();
