/**
 * BURRA PARIKSHA CMS — Stage 27 Implementation Verification
 * Feature Contract: FC-002 Roles & Capability Authorization Matrix
 *
 * Test Suite: TC-RBAC-01 through TC-RBAC-12
 */

import assert from 'node:assert';
import http from 'node:http';
import express, { Request } from 'express';
import { authService } from '../src/lib/services/auth.service';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { questionDraftService } from '../src/lib/services/question-draft.service';
import { apiRouter, getRequestActor, UnauthenticatedActorError } from '../src/server/routes';
import { UserRole } from '../src/types';
import { CanonicalRbacRole, AuthorizationResource, AuthorizationAction } from '../src/types/rbac-models';
import { questionConfigService } from '../src/lib/services/question-config.service';
import { DEFAULT_QUESTION_CONFIG } from '../src/lib/repositories/question-config.repository';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { sequencesRepository } from '../src/lib/repositories/sequences.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import {
  evaluateAuthorization,
  evaluateSegregationOfDuties,
  evaluateAiGating,
  AuthorizationErrorCode,
} from '../src/lib/auth/rbac-evaluator';

async function runTests() {
  console.log('============================================================');
  console.log('STAGE 27 — FC-002 ROLES & CAPABILITY AUTHORIZATION MATRIX');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // Initialize offline test configuration for question creation/approval pipelines
  const mockConfigRepo = {
    findAll: async () => DEFAULT_QUESTION_CONFIG,
  } as any;
  questionConfigService.setRepository(mockConfigRepo);

  // Seed taxonomy cache for test environment
  (taxonomyService as any).topicsCache = [
    { id: 'T01', name: 'Geometry', slug: 'geometry', isActive: true, sortOrder: 1 },
  ];
  (taxonomyService as any).subtopicsCache = [
    { id: 'ST01', topicId: 'T01', name: 'Triangles', slug: 'triangles', isActive: true, sortOrder: 1 },
  ];
  (taxonomyService as any).categoriesCache = [];
  (taxonomyService as any).cacheTimestamp = Date.now();

  // In-memory questions, masters, sequence, and workflow mocks for offline test environment
  const inMemQuestions = new Map<string, any>();
  questionsRepository.appendRecord = async (rec: any) => {
    inMemQuestions.set(rec.id, rec);
    return rec;
  };
  questionsRepository.findById = async (id: string) => {
    return inMemQuestions.get(id) || null;
  };
  questionsRepository.updateRecord = async (id: string, updates: any) => {
    const existing = inMemQuestions.get(id) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    inMemQuestions.set(id, updated);
    return updated;
  };

  const inMemMasters = new Map<string, any>();
  contentMastersRepository.appendRecord = async (rec: any) => {
    inMemMasters.set(rec.id, rec);
    return rec;
  };
  contentMastersRepository.findById = async (id: string) => {
    return inMemMasters.get(id) || null;
  };
  contentMastersRepository.updateRecord = async (id: string, updates: any) => {
    const existing = inMemMasters.get(id) || {};
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    inMemMasters.set(id, updated);
    return updated;
  };

  sequencesRepository.allocateNextNumber = async (entityType: string) => ({
    allocatedNumber: 1,
    prefix: entityType === 'CONTENT_MASTER' ? 'BP-CNT-' : 'BP-Q-',
    padLength: 6,
  });
  workflowRepository.appendRecord = async (rec: any) => rec;

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // --------------------------------------------------------------------------
    // TC-RBAC-01: Unauthenticated request → 401
    // --------------------------------------------------------------------------
    try {
      // 1. Direct getRequestActor() security verification on unauthenticated request
      const mockReq = { headers: {}, body: { actor: { id: 'USR-001', role: 'ADMIN' } } } as Request;
      let caughtUnauthError = false;
      try {
        getRequestActor(mockReq);
      } catch (err: any) {
        if (err instanceof UnauthenticatedActorError && err.statusCode === 401) {
          caughtUnauthError = true;
        }
      }
      assert.strictEqual(
        caughtUnauthError,
        true,
        'getRequestActor() must throw UnauthenticatedActorError (401) and NEVER fall back to USR-001 / ADMIN'
      );

      // 2. HTTP Endpoint without auth header
      const res = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-request-id': 'req_tc_rbac_01' },
        body: JSON.stringify({ questionText: 'Unauthenticated test question' }),
      });

      assert.strictEqual(res.status, 401, 'Unauthenticated request must return HTTP 401');
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Success must be false');
      assert.strictEqual(data.error?.code, 'UNAUTHENTICATED', 'Error code must be UNAUTHENTICATED');

      console.log('✓ TC-RBAC-01 PASSED: Unauthenticated request strictly returns HTTP 401 and getRequestActor fallback eliminated.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-01 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-02: Authenticated user with required capability → allowed
    // --------------------------------------------------------------------------
    let createdDraftId = '';
    const creatorUserId = `usr_creator_${Date.now()}`;
    await usersRepository.appendRecord({
      id: creatorUserId,
      name: 'Content Creator',
      email: `creator_${Date.now()}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR, // Canonical: QUESTION_AUTHOR with QUESTION:CREATE
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const creatorToken = authService.generateSessionToken({
      userId: creatorUserId,
      name: 'Content Creator',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    try {
      const res = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`,
          'x-request-id': 'req_tc_rbac_02',
        },
        body: JSON.stringify({
          topicId: 'T01',
          subtopicId: 'ST01',
          questionText: 'What is the sum of angles in a triangle?',
          options: { a: '180 degrees', b: '90 degrees', c: '360 degrees', d: '270 degrees' },
          correctAnswer: 'A',
          explanation: 'The sum of angles in a planar triangle is always 180 degrees.',
          difficulty: 'Easy',
          language: 'TELUGU',
        }),
      });

      assert.strictEqual(res.status, 201, 'Authorized user with QUESTION:CREATE must receive HTTP 201');
      const draft = await res.json();
      assert(draft.id.startsWith('BP-DFT-'), 'Draft ID must be generated');
      assert.strictEqual(draft.authorId, creatorUserId, 'Author must be the authenticated creator');
      createdDraftId = draft.id;

      console.log('✓ TC-RBAC-02 PASSED: Authenticated user with required capability successfully executed action.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-02 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-03: Authenticated user without capability → 403
    // --------------------------------------------------------------------------
    const analystUserId = `usr_analyst_${Date.now()}`;
    await usersRepository.appendRecord({
      id: analystUserId,
      name: 'Performance Analyst',
      email: `analyst_${Date.now()}@burrapariksha.com`,
      role: UserRole.ANALYTICS_VIEWER, // Canonical: ANALYST (lacks QUESTION:CREATE)
      roles: [UserRole.ANALYTICS_VIEWER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const analystToken = authService.generateSessionToken({
      userId: analystUserId,
      name: 'Performance Analyst',
      role: UserRole.ANALYTICS_VIEWER,
      roles: [UserRole.ANALYTICS_VIEWER],
      sessionVersion: 1,
    });

    try {
      const res = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${analystToken}`,
          'x-request-id': 'req_tc_rbac_03',
        },
        body: JSON.stringify({
          topicId: 'T01',
          subtopicId: 'ST01',
          questionText: 'Analyst attempting to create question',
          options: { a: '1', b: '2' },
          correctAnswer: 'A',
        }),
      });

      assert.strictEqual(res.status, 403, 'User lacking QUESTION:CREATE must receive HTTP 403');
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Response success must be false');
      assert.strictEqual(data.error?.code, 'FORBIDDEN_LACKS_CAPABILITY', 'Error code must be FORBIDDEN_LACKS_CAPABILITY');

      console.log('✓ TC-RBAC-03 PASSED: Authenticated user lacking capability is rejected with HTTP 403 FORBIDDEN_LACKS_CAPABILITY.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-03 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-04: Wrong role/capability → denied
    // --------------------------------------------------------------------------
    try {
      // Creator attempting USER:ADMINISTER endpoint
      const res = await fetch(`${baseUrl}/v1/users/some_target_user/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`,
          'x-request-id': 'req_tc_rbac_04',
        },
        body: JSON.stringify({ role: UserRole.ADMIN }),
      });

      assert.strictEqual(res.status, 403, 'Creator attempting USER:ADMINISTER must receive HTTP 403');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_LACKS_CAPABILITY');

      console.log('✓ TC-RBAC-04 PASSED: Wrong role/capability access attempt denied with HTTP 403.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-04 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-05: Client-supplied role cannot escalate privileges
    // --------------------------------------------------------------------------
    try {
      // Client with creator token includes 'role: ADMIN' in request body to fool server
      const res = await fetch(`${baseUrl}/v1/users/target_user_id/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`,
          'x-request-id': 'req_tc_rbac_05',
        },
        body: JSON.stringify({
          role: 'ADMIN',
          _role: 'ADMIN',
          roles: ['ADMIN'],
        }),
      });

      assert.strictEqual(res.status, 403, 'Client-supplied role in body must NOT escalate privilege');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_LACKS_CAPABILITY');

      console.log('✓ TC-RBAC-05 PASSED: Client-supplied role in request body cannot escalate privileges.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-05 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-06: Client-supplied actor/user ID cannot change identity
    // --------------------------------------------------------------------------
    try {
      // Creator attempts to spoof actor ID in request body
      const res = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatorToken}`,
          'x-request-id': 'req_tc_rbac_06',
        },
        body: JSON.stringify({
          topicId: 'T01',
          subtopicId: 'ST01',
          questionText: 'Identity spoofing prevention check',
          options: { a: 'A', b: 'B' },
          correctAnswer: 'A',
          actor: { id: 'USR-001', name: 'Spoofed Admin' },
          _actor: 'USR-001',
          userId: 'USR-001',
          authorId: 'USR-001',
        }),
      });

      assert.strictEqual(res.status, 201, 'Valid creation succeeds');
      const draft = await res.json();
      assert.strictEqual(
        draft.authorId,
        creatorUserId,
        'Author ID must match verified session user ID, completely ignoring spoofed body identity'
      );

      console.log('✓ TC-RBAC-06 PASSED: Client-supplied actor/user ID cannot alter authoritative actor identity.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-06 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-07: Resource ownership violation → denied
    // --------------------------------------------------------------------------
    try {
      // 1. Creator attempts to view capabilities of a different user (requires USER:VIEW or self)
      const res = await fetch(`${baseUrl}/v1/users/${analystUserId}/capabilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${creatorToken}`,
          'x-request-id': 'req_tc_rbac_07',
        },
      });

      assert.strictEqual(res.status, 403, 'Creator cannot view another user capabilities without USER:VIEW');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_LACKS_CAPABILITY');

      // 2. Direct RBAC Evaluator Resource Precondition Test: locked/approved artifact mutation forbidden (NEG-06)
      const immutabilityEvaluation = evaluateAuthorization({
        actor: {
          id: creatorUserId,
          role: CanonicalRbacRole.QUESTION_AUTHOR,
        },
        resource: AuthorizationResource.QUESTION,
        action: AuthorizationAction.EDIT,
        targetContext: {
          resourceType: AuthorizationResource.QUESTION,
          resourceId: 'q_locked',
          status: 'APPROVED', // Locked/Approved state
        },
      });

      assert.strictEqual(immutabilityEvaluation.allowed, false);
      assert.strictEqual(immutabilityEvaluation.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_BUSINESS_RULE);

      console.log('✓ TC-RBAC-07 PASSED: Resource ownership and immutability violations strictly denied.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-07 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-08: GAR-02 self-approval → denied
    // --------------------------------------------------------------------------
    const reviewerAuthorId = `usr_reviewer_author_${Date.now()}`;
    await usersRepository.appendRecord({
      id: reviewerAuthorId,
      name: 'Reviewer Author',
      email: `reviewer_${Date.now()}@burrapariksha.com`,
      role: UserRole.REVIEWER, // Canonical: QA_REVIEWER with QUESTION:APPROVE
      roles: [UserRole.REVIEWER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const reviewerAuthorToken = authService.generateSessionToken({
      userId: reviewerAuthorId,
      name: 'Reviewer Author',
      role: UserRole.REVIEWER,
      roles: [UserRole.REVIEWER],
      sessionVersion: 1,
    });

    const selfDraft = await questionDraftService.saveDraft({
      topicId: 'T01',
      subtopicId: 'ST01',
      questionText: 'Draft for self-approval test',
      options: { a: 'A', b: 'B' },
      correctAnswer: 'A',
      difficulty: 'Intermediate',
    }, { id: reviewerAuthorId, name: 'Reviewer Author' });

    try {
      const res = await fetch(`${baseUrl}/v1/questions/draft/${selfDraft.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${reviewerAuthorToken}`,
          'x-request-id': 'req_tc_rbac_08',
        },
        body: JSON.stringify({ notes: 'Attempting self-approval' }),
      });

      assert.strictEqual(res.status, 403, 'GAR-02: Author cannot approve their own question draft');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES');

      console.log('✓ TC-RBAC-08 PASSED: GAR-02 anti-self-approval rejected author approval attempt with HTTP 403.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-08 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-09: ADMIN cannot bypass GAR-02
    // --------------------------------------------------------------------------
    const adminAuthorId = `usr_admin_author_${Date.now()}`;
    await usersRepository.appendRecord({
      id: adminAuthorId,
      name: 'Admin Author',
      email: `admin_author_${Date.now()}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminAuthorToken = authService.generateSessionToken({
      userId: adminAuthorId,
      name: 'Admin Author',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    const adminDraft = await questionDraftService.saveDraft({
      topicId: 'T01',
      subtopicId: 'ST01',
      questionText: 'Admin draft for GAR-02 test',
      options: { a: 'A', b: 'B' },
      correctAnswer: 'A',
      difficulty: 'Intermediate',
    }, { id: adminAuthorId, name: 'Admin Author' });

    try {
      const res = await fetch(`${baseUrl}/v1/questions/draft/${adminDraft.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAuthorToken}`,
          'x-request-id': 'req_tc_rbac_09',
        },
        body: JSON.stringify({ notes: 'Admin attempting self-approval' }),
      });

      assert.strictEqual(res.status, 403, 'GAR-02: ADMIN cannot bypass anti-self-approval rule');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES');

      console.log('✓ TC-RBAC-09 PASSED: ADMIN cannot bypass GAR-02 anti-self-approval rule.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-09 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-10: AI actor cannot bypass human approval gates
    // --------------------------------------------------------------------------
    const aiAgentId = `AI-AGENT-01`;
    await usersRepository.appendRecord({
      id: aiAgentId,
      name: 'Gemini AI Generator',
      email: `ai_${Date.now()}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      // 1. Direct evaluateAuthorization test for AI gating
      const aiEval = evaluateAuthorization({
        actor: {
          id: aiAgentId,
          role: CanonicalRbacRole.ADMIN,
          isAiAgent: true,
        },
        resource: AuthorizationResource.QUESTION,
        action: AuthorizationAction.APPROVE,
        targetContext: {
          resourceType: AuthorizationResource.QUESTION,
          resourceId: createdDraftId,
          authorUserId: creatorUserId,
          createdBy: creatorUserId,
        },
      });

      assert.strictEqual(aiEval.allowed, false, 'AI agent must not be authorized for QUESTION:APPROVE');
      assert.strictEqual(aiEval.errorCode, AuthorizationErrorCode.FORBIDDEN_BY_AI_GATING);

      // 2. HTTP Endpoint test for AI gating with isAiAgent token
      const aiSpecialToken = authService.generateSessionToken({
        userId: 'AI-GENERATOR-BOT',
        name: 'AI Generator',
        role: UserRole.ADMIN,
        sessionVersion: 1,
      });
      usersRepository.setUserSessionState('AI-GENERATOR-BOT', {
        isActive: true,
        role: UserRole.ADMIN,
        sessionVersion: 1,
      });

      const res = await fetch(`${baseUrl}/v1/questions/draft/${createdDraftId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSpecialToken}`,
          'x-request-id': 'req_tc_rbac_10',
        },
        body: JSON.stringify({ notes: 'AI bot approval' }),
      });

      assert.strictEqual(res.status, 403, 'AI actor must be blocked from human approval gates');
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'FORBIDDEN_BY_AI_GATING');

      console.log('✓ TC-RBAC-10 PASSED: AI actor strictly blocked by AP-009 human approval gate.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-10 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-11: Valid authenticated capability request → succeeds
    // --------------------------------------------------------------------------
    const independentReviewerId = `usr_reviewer_indep_${Date.now()}`;
    await usersRepository.appendRecord({
      id: independentReviewerId,
      name: 'Independent QA Reviewer',
      email: `reviewer_indep_${Date.now()}@burrapariksha.com`,
      role: UserRole.REVIEWER, // QA_REVIEWER with QUESTION:APPROVE
      roles: [UserRole.REVIEWER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const independentReviewerToken = authService.generateSessionToken({
      userId: independentReviewerId,
      name: 'Independent QA Reviewer',
      role: UserRole.REVIEWER,
      roles: [UserRole.REVIEWER],
      sessionVersion: 1,
    });

    try {
      // Independent reviewer approves draft created by creatorUserId
      const res = await fetch(`${baseUrl}/v1/questions/draft/${createdDraftId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${independentReviewerToken}`,
          'x-request-id': 'req_tc_rbac_11',
        },
        body: JSON.stringify({ notes: 'Verified and approved by QA' }),
      });

      assert.strictEqual(res.status, 201, 'Independent reviewer with capability must succeed with HTTP 201');
      const approvedQuestion = await res.json();
      assert(approvedQuestion.id !== undefined, 'Approved question must have ID');
      assert.strictEqual(approvedQuestion.status, 'APPROVED', 'Question status must be APPROVED');

      console.log('✓ TC-RBAC-11 PASSED: Valid authenticated capability request by independent reviewer succeeded.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-11 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-RBAC-12: Dedicated FC-002 User Capability & Role Management Endpoints
    // --------------------------------------------------------------------------
    const adminUserId = `usr_admin_mgr_${Date.now()}`;
    await usersRepository.appendRecord({
      id: adminUserId,
      name: 'System Admin',
      email: `admin_mgr_${Date.now()}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminToken = authService.generateSessionToken({
      userId: adminUserId,
      name: 'System Admin',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    try {
      // 1. GET /v1/users/:id/capabilities as Admin
      const capRes = await fetch(`${baseUrl}/v1/users/${creatorUserId}/capabilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'x-request-id': 'req_tc_rbac_12_caps',
        },
      });

      assert.strictEqual(capRes.status, 200, 'Admin can view user capabilities');
      const capData = await capRes.json();
      assert.strictEqual(capData.success, true);
      assert.strictEqual(capData.data.userId, creatorUserId);
      assert(Array.isArray(capData.data.capabilities), 'Capabilities must be an array');
      assert(capData.data.capabilities.includes('QUESTION:CREATE'), 'Must include QUESTION:CREATE');

      // 2. PATCH /v1/users/:id/role to promote user
      const roleRes = await fetch(`${baseUrl}/v1/users/${creatorUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-request-id': 'req_tc_rbac_12_role',
        },
        body: JSON.stringify({ role: UserRole.CONTENT_MANAGER }),
      });

      assert.strictEqual(roleRes.status, 200, 'Admin can update user role');
      const roleData = await roleRes.json();
      assert.strictEqual(roleData.success, true);
      assert.strictEqual(roleData.data.role, CanonicalRbacRole.CONTENT_LEAD);

      console.log('✓ TC-RBAC-12 PASSED: FC-002 dedicated capability retrieval and role update endpoints verified.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-RBAC-12 FAILED:', err.message);
      failed++;
    }

  } finally {
    server.close();
  }

  console.log('\n============================================================');
  console.log(`FC-002 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
