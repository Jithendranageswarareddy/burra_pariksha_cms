/**
 * BURRA PARIKSHA CMS — Stage 27 FC-004 Automated Test Suite
 * Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY
 *
 * Verifies all authoritative FC-004 acceptance criteria:
 * - TC-AUD-01: IAuditDispatcher behavior and 7-dimensional audit record construction
 * - TC-AUD-02: Sensitive-field redaction (credentials redacted, safe tracing identifiers preserved)
 * - TC-AUD-03: Structured logger Cloud Logging format and error diagnostic capture
 * - TC-AUD-04: Repository mutation to audit ledger integration via connectRepositoryToAudit
 * - TC-AUD-05: Liveness (/healthz) and readiness (/readyz) system probes
 * - TC-AUD-06: RBAC authorization on GET /api/v1/audit/events (401 unauthenticated, 403 unauthorized, 200 Admin)
 * - TC-AUD-07: Immutability enforcement (prohibits modification or deletion of audit records)
 * - TC-AUD-08: Validation rejection of malformed audit events
 */

import assert from 'assert';
import http from 'http';
import express, { Request, Response } from 'express';
import {
  AuditEvent,
  CreateAuditEventInput,
  redactSensitiveData,
} from '../src/types/audit';
import {
  IAuditDispatcher,
  InMemoryAuditDispatcher,
  FirestoreAuditDispatcher,
  auditDispatcher,
  connectRepositoryToAudit,
} from '../src/lib/audit';
import { logger, StructuredLogEntry } from '../src/lib/logger';
import { InMemoryRepository, BaseEntity } from '../src/lib/db';
import { ValidationError } from '../src/lib/errors';
import { authService } from '../src/lib/services/auth.service';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { UserRole } from '../src/types';
import { CanonicalRbacRole } from '../src/types/rbac-models';
import { apiRouter } from '../src/server/routes';
import { healthRouter } from '../src/server/health.routes';

interface TestAuditEntity extends BaseEntity {
  name: string;
  department: string;
}

async function runTests() {
  console.log('============================================================');
  console.log('STAGE 27 — FC-004 AUDIT LEDGER & OBSERVABILITY TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TC-AUD-01: IAuditDispatcher behavior & 7-dimensional audit record construction
  // --------------------------------------------------------------------------
  try {
    const dispatcher: IAuditDispatcher = new InMemoryAuditDispatcher();

    const input: CreateAuditEventInput = {
      actor: {
        actorId: 'usr_test_creator_01',
        actorRole: 'QUESTION_AUTHOR',
        actorName: 'Telugu Curriculum Creator',
      },
      action: 'QUESTION.CREATED',
      resource: {
        resourceType: 'QUESTION',
        resourceId: 'qst_20261004_0001',
        resourceVersion: 1,
      },
      context: {
        requestId: 'req_tc_aud_01',
        traceId: 'trc_tc_aud_01',
        ipAddress: '127.0.0.1',
        userAgent: 'BP-CMS-Studio/1.0',
        workflowStep: 1,
      },
      result: 'SUCCESS',
      stateChange: {
        changeType: 'CREATE',
        after: {
          title: 'What is the speed of light?',
          subject: 'TEST_SUBJECT',
        },
      },
    };

    const record = await dispatcher.dispatch(input);

    // 1. Verify canonical ID format
    assert(record.id.startsWith('aud_'), "Audit record ID must begin with 'aud_' prefix");
    assert(record.id.length >= 40, 'Audit record ID must include full UUID');

    // 2. Verify Monotonic UTC Timestamp
    assert(record.timestamp !== undefined, 'Timestamp must be recorded');
    assert(!isNaN(Date.parse(record.timestamp)), 'Timestamp must be valid ISO-8601');

    // 3. Verify 7 Foundation Dimensions
    assert.strictEqual(record.actor.actorId, 'usr_test_creator_01', 'WHO: actorId');
    assert.strictEqual(record.actor.actorRole, 'QUESTION_AUTHOR', 'WHO: actorRole');
    assert.strictEqual(record.action, 'QUESTION.CREATED', 'WHAT: action');
    assert.strictEqual(record.resource.resourceType, 'QUESTION', 'TO WHAT: resourceType');
    assert.strictEqual(record.resource.resourceId, 'qst_20261004_0001', 'TO WHAT: resourceId');
    assert.strictEqual(record.context.requestId, 'req_tc_aud_01', 'CONTEXT: requestId');
    assert.strictEqual(record.context.traceId, 'trc_tc_aud_01', 'CONTEXT: traceId');
    assert.strictEqual(record.context.workflowStep, 1, 'CONTEXT: workflowStep');
    assert.strictEqual(record.result, 'SUCCESS', 'RESULT');
    assert.strictEqual(record.stateChange?.changeType, 'CREATE', 'STATE: changeType');

    // 4. Verify Query Retrieval
    const queryRes = await dispatcher.query({ resourceId: 'qst_20261004_0001' });
    assert.strictEqual(queryRes.total, 1);
    assert.strictEqual(queryRes.events[0].id, record.id);

    console.log('✓ TC-AUD-01 PASSED: IAuditDispatcher behavior & 7-dimensional audit record construction verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-02: Sensitive-Field Redaction
  // --------------------------------------------------------------------------
  try {
    const sensitivePayload = {
      actorId: 'usr_admin_01',
      requestId: 'req_safe_trace_123',
      traceId: 'trc_safe_trace_456',
      password: 'SuperSecretPassword123!',
      userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
      authCode: 'oauth_code_789',
      apiKey: 'AIzaSyA8948294129',
      nestedConfig: {
        sessionSecret: 'top_secret_key',
        databasePassword: 'db_pass_word',
        safeMetadata: 'Public Category Name',
      },
      headersList: [
        { key: 'Authorization', value: 'Bearer token_xyz' },
        { key: 'Cookie', value: 'bp_session=secret_cookie_val' },
        { key: 'Accept', value: 'application/json' },
      ],
    };

    const redacted = redactSensitiveData(sensitivePayload);

    // Assert safe tracing and identity fields are preserved
    assert.strictEqual(redacted.actorId, 'usr_admin_01', 'actorId must be preserved');
    assert.strictEqual(redacted.requestId, 'req_safe_trace_123', 'requestId must be preserved');
    assert.strictEqual(redacted.traceId, 'trc_safe_trace_456', 'traceId must be preserved');
    assert.strictEqual(redacted.nestedConfig.safeMetadata, 'Public Category Name', 'Safe metadata must be preserved');
    assert.strictEqual(redacted.headersList[2].value, 'application/json', 'Safe headers must be preserved');

    // Assert sensitive credentials are redacted
    assert.strictEqual(redacted.password, '[REDACTED]', 'password must be redacted');
    assert.strictEqual(redacted.userToken, '[REDACTED]', 'userToken must be redacted');
    assert.strictEqual(redacted.authCode, '[REDACTED]', 'authCode must be redacted');
    assert.strictEqual(redacted.apiKey, '[REDACTED]', 'apiKey must be redacted');
    assert.strictEqual(redacted.nestedConfig.sessionSecret, '[REDACTED]', 'nested sessionSecret must be redacted');
    assert.strictEqual(redacted.nestedConfig.databasePassword, '[REDACTED]', 'nested databasePassword must be redacted');
    assert.strictEqual(redacted.headersList[0].value, '[REDACTED]', 'Authorization header value must be redacted');

    console.log('✓ TC-AUD-02 PASSED: Sensitive-field redaction engine correctly sanitizes credentials and preserves identifiers.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-03: Structured Logger Format
  // --------------------------------------------------------------------------
  try {
    logger.clearCapturedLogs();

    // 1. INFO log
    logger.info('Question approval milestone completed', {
      requestId: 'req_log_tc_01',
      traceId: 'trc_log_tc_01',
      actorId: 'usr_lead_01',
      operation: 'QUESTION.APPROVE',
      resource: 'QUESTION:qst_98124',
      durationMs: 42,
    });

    // 2. ERROR log with diagnostic error object
    const sampleError = new Error('Database transaction lock acquisition timeout');
    (sampleError as any).code = 'CONFLICT_OPTIMISTIC_LOCK';
    logger.error('Workflow transition failed due to concurrency conflict', sampleError, {
      requestId: 'req_log_tc_02',
      traceId: 'trc_log_tc_02',
      actorId: 'usr_editor_02',
      operation: 'WORKFLOW.TRANSITION',
    });

    const logs: StructuredLogEntry[] = logger.getCapturedLogs();
    assert.strictEqual(logs.length, 2, 'Must have recorded 2 structured logs');

    const infoLog = logs[0];
    assert.strictEqual(infoLog.severity, 'INFO');
    assert.strictEqual(infoLog.service, 'bp-cms-api');
    assert.strictEqual(infoLog.message, 'Question approval milestone completed');
    assert.strictEqual(infoLog.requestId, 'req_log_tc_01');
    assert.strictEqual(infoLog.traceId, 'trc_log_tc_01');
    assert.strictEqual(infoLog.durationMs, 42);

    const errorLog = logs[1];
    assert.strictEqual(errorLog.severity, 'ERROR');
    assert.strictEqual(errorLog.error?.name, 'Error');
    assert.strictEqual(errorLog.error?.message, 'Database transaction lock acquisition timeout');
    assert.strictEqual(errorLog.error?.code, 'CONFLICT_OPTIMISTIC_LOCK');
    assert(errorLog.error?.stack !== undefined);

    console.log('✓ TC-AUD-03 PASSED: Structured logger emits Google Cloud Logging compliant JSON with diagnostic telemetry.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-03 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-04: Repository Mutation to Audit Integration
  // --------------------------------------------------------------------------
  try {
    const testRepo = new InMemoryRepository<TestAuditEntity>('departments', 'med_');
    const dispatcher = new InMemoryAuditDispatcher();

    // Connect repository mutations to the audit dispatcher
    connectRepositoryToAudit(testRepo, dispatcher);

    // Perform repository create mutation
    const createdDept = await testRepo.create({
      name: 'Science & Technology',
      department: 'Curriculum',
    }, {
      actorId: 'usr_curriculum_lead',
      requestId: 'req_mutation_test_01',
    });

    // Perform repository update mutation
    await testRepo.update(createdDept.id, 1, {
      name: 'Science, Technology, Engineering & Math (STEM)',
    }, {
      actorId: 'usr_curriculum_lead',
      requestId: 'req_mutation_test_02',
    });

    // Perform repository soft-delete mutation
    await testRepo.delete(createdDept.id, 2, {
      actorId: 'usr_curriculum_lead',
      requestId: 'req_mutation_test_03',
    });

    // Query audit events produced automatically by repository mutations
    const deptAudit = await dispatcher.query({ resourceId: createdDept.id });
    assert.strictEqual(deptAudit.total, 3, 'Must have recorded 3 audit events (CREATE, UPDATE, SOFT_DELETE)');

    // Verify events in descending order (most recent first)
    assert.strictEqual(deptAudit.events[0].action, 'DEPARTMENTS.SOFT_DELETED');
    assert.strictEqual(deptAudit.events[1].action, 'DEPARTMENTS.UPDATED');
    assert.strictEqual(deptAudit.events[2].action, 'DEPARTMENTS.CREATED');

    assert.strictEqual(deptAudit.events[2].actor.actorId, 'usr_curriculum_lead');
    assert.strictEqual(deptAudit.events[2].context.requestId, 'req_mutation_test_01');

    console.log('✓ TC-AUD-04 PASSED: Repository mutations automatically stream into immutable audit trail.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-04 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Express Integration Test Setup
  // --------------------------------------------------------------------------
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // --------------------------------------------------------------------------
  // TC-AUD-05: Liveness & Readiness Probes (/healthz & /readyz)
  // --------------------------------------------------------------------------
  try {
    // 1. GET /healthz
    const healthzRes = await fetch(`${baseUrl}/healthz`);
    assert.strictEqual(healthzRes.status, 200, 'GET /healthz must return HTTP 200');
    const healthzData = await healthzRes.json();
    assert.strictEqual(healthzData.status, 'ok');
    assert(healthzData.uptime >= 0, 'uptime must be non-negative integer');
    assert(healthzData.timestamp !== undefined);

    // 2. GET /readyz
    const readyzRes = await fetch(`${baseUrl}/readyz`);
    assert.strictEqual(readyzRes.status, 200, 'GET /readyz must return HTTP 200');
    const readyzData = await readyzRes.json();
    assert.strictEqual(readyzData.status, 'ok');
    assert.strictEqual(readyzData.checks?.database, 'UP', 'Database check must be UP');
    assert(readyzData.checks?.drive !== undefined, 'Drive status must be reported');

    // 3. Alternate path GET /health/live and GET /health/ready
    const liveRes = await fetch(`${baseUrl}/health/live`);
    assert.strictEqual(liveRes.status, 200);

    const readyRes = await fetch(`${baseUrl}/health/ready`);
    assert.strictEqual(readyRes.status, 200);

    console.log('✓ TC-AUD-05 PASSED: Liveness (/healthz) and readiness (/readyz) system health probes verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-05 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-06: RBAC Authorization on GET /api/v1/audit/events
  // --------------------------------------------------------------------------
  try {
    // 1. Unauthenticated request -> HTTP 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/audit/events`, {
      headers: { 'x-request-id': 'req_tc_aud_unauth' },
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated access to audit logs must return HTTP 401');
    const unauthData = await unauthRes.json();
    assert.strictEqual(unauthData.success, false);
    assert.strictEqual(unauthData.error?.code, 'UNAUTHENTICATED');

    // 2. Creator request (lacks AUDIT_EVENT:VIEW) -> HTTP 403
    const creatorId = 'usr_aud_creator_01';
    usersRepository.setUserSessionState(creatorId, {
      isActive: true,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });
    const creatorToken = authService.generateSessionToken({
      userId: creatorId,
      name: 'Audit Creator Tester',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    const creatorRes = await fetch(`${baseUrl}/api/v1/audit/events`, {
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
        'x-request-id': 'req_tc_aud_forbidden',
      },
    });
    assert.strictEqual(creatorRes.status, 403, 'Users lacking AUDIT_EVENT:VIEW must receive HTTP 403');
    const creatorData = await creatorRes.json();
    assert.strictEqual(creatorData.success, false);
    assert.strictEqual(creatorData.error?.code, 'FORBIDDEN_LACKS_CAPABILITY');

    // 3. Admin request (has AUDIT_EVENT:VIEW) -> HTTP 200
    const adminId = 'usr_aud_admin_01';
    usersRepository.setUserSessionState(adminId, {
      isActive: true,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });
    const adminToken = authService.generateSessionToken({
      userId: adminId,
      name: 'Audit Admin Tester',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    // Seed an audit event to query
    await auditDispatcher.dispatch({
      actor: { actorId: creatorId, actorRole: 'QUESTION_AUTHOR' },
      action: 'QUESTION.APPROVED',
      resource: { resourceType: 'QUESTION', resourceId: 'qst_seeded_01' },
      context: { requestId: 'req_seed_01' },
    });

    const adminRes = await fetch(`${baseUrl}/api/v1/audit/events?resourceType=QUESTION`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-request-id': 'req_tc_aud_admin_ok',
      },
    });

    assert.strictEqual(adminRes.status, 200, 'Admin with AUDIT_EVENT:VIEW must receive HTTP 200');
    const adminData = await adminRes.json();
    assert.strictEqual(adminData.success, true);
    assert(Array.isArray(adminData.data.events), 'Response data must include events array');
    assert(adminData.meta?.pagination !== undefined, 'Response meta must include pagination');
    assert(adminData.meta.pagination.total >= 1);

    console.log('✓ TC-AUD-06 PASSED: Backend authorization and capability enforcement on audit endpoints verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-06 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-07: Immutability Enforcement (No mutations/deletions allowed)
  // --------------------------------------------------------------------------
  try {
    const adminId = 'usr_aud_admin_01';
    const adminToken = authService.generateSessionToken({
      userId: adminId,
      name: 'Audit Admin Tester',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    // Attempting POST on /api/v1/audit/events must be rejected
    const postRes = await fetch(`${baseUrl}/api/v1/audit/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-request-id': 'req_tc_aud_immut_post',
      },
      body: JSON.stringify({ action: 'FORGED.EVENT' }),
    });
    assert.strictEqual(postRes.status, 405, 'POST to audit records must return HTTP 405 Method Not Allowed');

    // Attempting DELETE on /api/v1/audit/events must be rejected
    const deleteRes = await fetch(`${baseUrl}/api/v1/audit/events`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-request-id': 'req_tc_aud_immut_del',
      },
    });
    assert.strictEqual(deleteRes.status, 405, 'DELETE to audit records must return HTTP 405 Method Not Allowed');

    console.log('✓ TC-AUD-07 PASSED: Audit records immutability strictly enforced against modification and deletion.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-07 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUD-08: Validation Rejection of Malformed Audit Events
  // --------------------------------------------------------------------------
  try {
    const dispatcher = new InMemoryAuditDispatcher();

    let validationFailed = false;
    try {
      // Missing mandatory 'actorId', 'action', and 'resourceId'
      await dispatcher.dispatch({
        actor: { actorId: '', actorRole: '' },
        action: '',
        resource: { resourceType: '', resourceId: '' },
        context: { requestId: '' },
      } as any);
    } catch (err: any) {
      validationFailed = true;
      assert(err instanceof ValidationError, 'Malformed audit event must throw ValidationError');
      assert.strictEqual(err.statusCode, 400);
    }

    assert.strictEqual(validationFailed, true, 'Validation must reject malformed audit event payload');

    console.log('✓ TC-AUD-08 PASSED: Malformed audit events strictly rejected with ValidationError.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUD-08 FAILED:', err.message);
    failed++;
  }

  // Teardown HTTP server
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log('\n============================================================');
  console.log(`FC-004 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
