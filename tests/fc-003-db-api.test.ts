/**
 * BURRA PARIKSHA CMS — Stage 27 FC-003 Automated Test Suite
 * Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Verifies all authoritative FC-003 acceptance requirements:
 * - TC-DB-01: Canonical ID Generation for all 8 domains (qst_, scr_, vid_, med_, pub_, usr_, rev_, aud_)
 * - TC-DB-02: In-Memory Repository CRUD operations and atomic isolation
 * - TC-DB-03: Optimistic Concurrency Control (OCC) version increments & stale version rejection (HTTP 409)
 * - TC-DB-04: Soft-deletion filtering (excluded by default, retrievable when requested)
 * - TC-API-01: Global AppError handler produces universal API envelope with correlation metadata
 * - TC-API-02: Zod request validation middleware returns structured HTTP 400 with field-level issues
 * - TC-CLIENT-01: Centralized API client integration with OCC conflict propagation
 */

import assert from 'assert';
import http from 'http';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  canonicalIdService,
  CANONICAL_PREFIXES,
  CanonicalPrefix,
} from '../src/lib/id.service';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConcurrencyConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../src/lib/errors';
import {
  BaseEntity,
  InMemoryRepository,
  FirestoreRepository,
} from '../src/lib/db';
import {
  ApiResponseEnvelope,
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCode,
} from '../src/types/api-contracts';
import { validateRequest } from '../src/server/middleware/validation.middleware';
import { requestIdMiddleware } from '../src/server/middleware/request-id.middleware';
import { globalErrorHandler } from '../src/server/middleware/error.middleware';
import { ApiClientError } from '../src/lib/api-client';

interface TestQuestionEntity extends BaseEntity {
  title: string;
  category: string;
  difficulty: number;
}

async function runTests() {
  console.log('============================================================');
  console.log('STAGE 27 — FC-003 DATABASE ABSTRACTION & API ENVELOPES TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TC-DB-01: Canonical ID Generation
  // --------------------------------------------------------------------------
  try {
    const requiredPrefixes: CanonicalPrefix[] = [
      'qst_',
      'scr_',
      'vid_',
      'med_',
      'pub_',
      'usr_',
      'rev_',
      'aud_',
    ];

    assert.strictEqual(
      CANONICAL_PREFIXES.length,
      8,
      'Must define all 8 canonical prefixes'
    );

    for (const prefix of requiredPrefixes) {
      const generatedId = canonicalIdService.generateCanonicalId(prefix);
      assert(
        generatedId.startsWith(prefix),
        `Generated ID '${generatedId}' must start with prefix '${prefix}'`
      );

      const isValid = canonicalIdService.validateCanonicalId(generatedId, prefix);
      assert.strictEqual(
        isValid,
        true,
        `Generated ID '${generatedId}' must validate as a canonical ID for prefix '${prefix}'`
      );

      const parsed = canonicalIdService.parseCanonicalId(generatedId);
      assert(parsed !== null, `Parsed canonical ID must not be null for '${generatedId}'`);
      assert.strictEqual(parsed.prefix, prefix, `Parsed prefix must match '${prefix}'`);
      assert(parsed.uuid.length >= 36, `Parsed UUID must be a valid 36-char string`);
    }

    // Domain generator helpers
    assert(canonicalIdService.generateQuestionId().startsWith('qst_'));
    assert(canonicalIdService.generateScriptId().startsWith('scr_'));
    assert(canonicalIdService.generateVideoId().startsWith('vid_'));
    assert(canonicalIdService.generateMediaId().startsWith('med_'));
    assert(canonicalIdService.generatePublishingId().startsWith('pub_'));
    assert(canonicalIdService.generateUserId().startsWith('usr_'));
    assert(canonicalIdService.generateReviewId().startsWith('rev_'));
    assert(canonicalIdService.generateAuditId().startsWith('aud_'));

    // Rejection of invalid IDs
    assert.strictEqual(
      canonicalIdService.validateCanonicalId('invalid_id_format'),
      false,
      'Invalid string must fail canonical validation'
    );
    assert.strictEqual(
      canonicalIdService.validateCanonicalId('qst_invalid-uuid-too-short'),
      false,
      'Invalid UUID suffix must fail canonical validation'
    );
    assert.strictEqual(
      canonicalIdService.validateCanonicalId(canonicalIdService.generateQuestionId(), 'vid_'),
      false,
      'Question ID must fail validation when expected prefix is vid_'
    );

    console.log('✓ TC-DB-01 PASSED: Canonical ID generation, validation, and parsing verified for all 8 domains.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-DB-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-DB-02: In-Memory Repository CRUD
  // --------------------------------------------------------------------------
  try {
    const repo = new InMemoryRepository<TestQuestionEntity>('questions', 'qst_');

    // 1. Create
    const created = await repo.create({
      title: 'What is the capital of Telangana?',
      category: 'Geography',
      difficulty: 1,
    });

    assert(created.id.startsWith('qst_'), 'Created entity must receive canonical ID');
    assert.strictEqual(created.version, 1, 'Initial version must be 1');
    assert.strictEqual(created.isDeleted, false, 'isDeleted must be false initially');
    assert(created.createdAt !== undefined, 'createdAt must be defined');
    assert.strictEqual(created.createdAt, created.updatedAt, 'createdAt and updatedAt must match initially');

    // 2. FindById
    const fetched = await repo.findById(created.id);
    assert(fetched !== null, 'Created entity must be retrievable by ID');
    assert.strictEqual(fetched.title, 'What is the capital of Telangana?');

    // 3. Update
    const updated = await repo.update(created.id, 1, {
      title: 'What is the administrative capital of Telangana?',
      difficulty: 2,
    });
    assert.strictEqual(updated.version, 2, 'Version must increment to 2 on successful update');
    assert.strictEqual(updated.title, 'What is the administrative capital of Telangana?');
    assert.strictEqual(updated.difficulty, 2);

    // 4. FindMany with filtering
    const second = await repo.create({
      title: 'Who wrote the Indian Constitution?',
      category: 'Civics',
      difficulty: 2,
    });

    const geographyQuestions = await repo.findMany({ where: { category: 'Geography' } });
    assert.strictEqual(geographyQuestions.length, 1);
    assert.strictEqual(geographyQuestions[0].id, created.id);

    const allQuestions = await repo.findMany();
    assert.strictEqual(allQuestions.length, 2);

    // 5. Delete
    const deleted = await repo.delete(second.id, 1);
    assert.strictEqual(deleted, true);

    const retrievedAfterDelete = await repo.findById(second.id);
    assert.strictEqual(retrievedAfterDelete, null, 'Soft-deleted entity must not be retrievable by default');

    console.log('✓ TC-DB-02 PASSED: In-memory repository atomic CRUD operations verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-DB-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-DB-03: Optimistic Concurrency Control (OCC)
  // --------------------------------------------------------------------------
  try {
    const repo = new InMemoryRepository<TestQuestionEntity>('questions', 'qst_');

    const entity = await repo.create({
      title: 'Original Title',
      category: 'History',
      difficulty: 3,
    });
    assert.strictEqual(entity.version, 1);

    // Client A updates with current version 1 -> succeeds
    const updatedByA = await repo.update(entity.id, 1, {
      title: 'Title modified by Client A',
    });
    assert.strictEqual(updatedByA.version, 2);

    // Client B (who also held version 1) attempts concurrent update with stale expectedVersion: 1
    let conflictCaught = false;
    try {
      await repo.update(entity.id, 1, {
        title: 'Title modified by Client B',
      });
    } catch (err: any) {
      conflictCaught = true;
      assert(err instanceof ConcurrencyConflictError, 'Must throw ConcurrencyConflictError');
      assert.strictEqual(err.statusCode, 409, 'OCC conflict error must have status code 409');
      assert.strictEqual(err.code, 'CONFLICT_OPTIMISTIC_LOCK');
      assert.strictEqual(err.expectedVersion, 1);
      assert.strictEqual(err.currentVersion, 2);
    }
    assert.strictEqual(conflictCaught, true, 'Concurrent write with stale version must be rejected');

    // Stale delete attempt must also fail with 409
    let deleteConflictCaught = false;
    try {
      await repo.delete(entity.id, 1);
    } catch (err: any) {
      deleteConflictCaught = true;
      assert(err instanceof ConcurrencyConflictError);
      assert.strictEqual(err.statusCode, 409);
    }
    assert.strictEqual(deleteConflictCaught, true, 'Delete with stale version must be rejected');

    // Matching update with version 2 succeeds
    const updatedByValid = await repo.update(entity.id, 2, {
      title: 'Title correctly updated with version 2',
    });
    assert.strictEqual(updatedByValid.version, 3);

    console.log('✓ TC-DB-03 PASSED: Optimistic Concurrency Control (OCC) version increments & stale version rejection verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-DB-03 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-DB-04: Soft-Delete Filtering
  // --------------------------------------------------------------------------
  try {
    const repo = new InMemoryRepository<TestQuestionEntity>('questions', 'qst_');

    const q1 = await repo.create({ title: 'Q1', category: 'Math', difficulty: 1 });
    const q2 = await repo.create({ title: 'Q2', category: 'Math', difficulty: 2 });
    const q3 = await repo.create({ title: 'Q3', category: 'Math', difficulty: 3 });

    // Soft delete q2
    await repo.delete(q2.id, 1);

    // Default queries must exclude soft-deleted records
    const activeList = await repo.findMany();
    assert.strictEqual(activeList.length, 2, 'Default findMany must return only 2 active records');
    assert.strictEqual(activeList.some((q) => q.id === q2.id), false, 'Soft-deleted record must not appear in active query');

    const activeCount = await repo.count();
    assert.strictEqual(activeCount, 2, 'Default count must not include deleted records');

    assert.strictEqual(await repo.findById(q2.id), null, 'Default findById must return null for soft-deleted record');

    // Queries requesting includeDeleted: true must include soft-deleted records
    const allList = await repo.findMany({ includeDeleted: true });
    assert.strictEqual(allList.length, 3, 'findMany({ includeDeleted: true }) must return all 3 records');

    const retrievedDeleted = await repo.findById(q2.id, { includeDeleted: true });
    assert(retrievedDeleted !== null, 'findById with includeDeleted: true must retrieve deleted record');
    assert.strictEqual(retrievedDeleted.isDeleted, true);
    assert.strictEqual(retrievedDeleted.version, 2, 'Soft-delete must increment entity version');

    console.log('✓ TC-DB-04 PASSED: Soft-delete filtering and explicit retrieval verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-DB-04 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Express Integration Setup for API Tests
  // --------------------------------------------------------------------------
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Test routes for AppError hierarchy
  app.get('/test/not-found', (_req: Request, _res: Response) => {
    throw new NotFoundError('Question with ID qst_test_123 not found.');
  });

  app.get('/test/concurrency', (_req: Request, _res: Response) => {
    throw new ConcurrencyConflictError('questions', 'qst_test_123', 1, 2);
  });

  app.get('/test/unauthorized', (_req: Request, _res: Response) => {
    throw new UnauthorizedError('Valid session token required.');
  });

  app.get('/test/forbidden', (_req: Request, _res: Response) => {
    throw new ForbiddenError('Lacks QUESTION:PUBLISH capability.');
  });

  // Test route for Zod validation
  const testQuestionSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long'),
    score: z.number().int().positive('Score must be a positive integer'),
  }).strict();

  app.post(
    '/test/validation',
    validateRequest({ body: testQuestionSchema }),
    (req: Request, res: Response) => {
      const requestId = (req.headers['x-request-id'] as string) || 'req_valid';
      res.status(200).json(createSuccessResponse(req.body, requestId));
    }
  );

  app.use(globalErrorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // --------------------------------------------------------------------------
  // TC-API-01: Global AppError Handler → Universal API Envelope
  // --------------------------------------------------------------------------
  try {
    // 1. NotFoundError (404)
    const notFoundRes = await fetch(`${baseUrl}/test/not-found`, {
      headers: { 'x-request-id': 'req_tc_api_404' },
    });
    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.headers.get('x-request-id'), 'req_tc_api_404');

    const notFoundData: ApiResponseEnvelope = await notFoundRes.json();
    assert.strictEqual(notFoundData.success, false);
    assert.strictEqual(notFoundData.error?.code, 'RESOURCE_NOT_FOUND');
    assert.strictEqual(notFoundData.error?.message, 'Question with ID qst_test_123 not found.');
    assert.strictEqual(notFoundData.meta?.requestId, 'req_tc_api_404');
    assert(notFoundData.meta?.timestamp !== undefined);

    // 2. ConcurrencyConflictError (409)
    const occRes = await fetch(`${baseUrl}/test/concurrency`, {
      headers: { 'x-request-id': 'req_tc_api_409' },
    });
    assert.strictEqual(occRes.status, 409);
    const occData: ApiResponseEnvelope = await occRes.json();
    assert.strictEqual(occData.success, false);
    assert.strictEqual(occData.error?.code, 'CONFLICT_OPTIMISTIC_LOCK');
    assert.strictEqual(occData.meta?.requestId, 'req_tc_api_409');
    assert.deepStrictEqual((occData.error?.details as any)?.expectedVersion, 1);
    assert.deepStrictEqual((occData.error?.details as any)?.currentVersion, 2);

    // 3. UnauthorizedError (401)
    const unauthRes = await fetch(`${baseUrl}/test/unauthorized`);
    assert.strictEqual(unauthRes.status, 401);
    const unauthData: ApiResponseEnvelope = await unauthRes.json();
    assert.strictEqual(unauthData.success, false);
    assert.strictEqual(unauthData.error?.code, 'UNAUTHENTICATED');

    // 4. ForbiddenError (403)
    const forbRes = await fetch(`${baseUrl}/test/forbidden`);
    assert.strictEqual(forbRes.status, 403);
    const forbData: ApiResponseEnvelope = await forbRes.json();
    assert.strictEqual(forbData.success, false);
    assert.strictEqual(forbData.error?.code, 'FORBIDDEN_LACKS_CAPABILITY');

    console.log('✓ TC-API-01 PASSED: Global AppError handler converts error hierarchy to universal API envelope.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-API-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-API-02: Zod Request Validation Middleware
  // --------------------------------------------------------------------------
  try {
    // 1. Invalid payload: title too short, score negative, unknown field injected
    const invalidRes = await fetch(`${baseUrl}/test/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': 'req_tc_api_zod_invalid',
      },
      body: JSON.stringify({
        title: 'Hey',
        score: -5,
        injectedField: 'malicious',
      }),
    });

    assert.strictEqual(invalidRes.status, 400, 'Zod validation error must return HTTP 400 BAD_REQUEST');
    const invalidData: ApiResponseEnvelope = await invalidRes.json();
    assert.strictEqual(invalidData.success, false);
    assert.strictEqual(invalidData.error?.code, 'VALIDATION_ERROR');
    assert.strictEqual(invalidData.meta?.requestId, 'req_tc_api_zod_invalid');

    const issues = invalidData.error?.details as Array<{ field: string; issue: string }>;
    assert(Array.isArray(issues), 'Validation details must be an array of field-level issues');
    assert(issues.length >= 2, 'Must report multiple validation issues');
    assert(issues.some((i) => i.field === 'title'), 'Must flag invalid title');
    assert(issues.some((i) => i.field === 'score'), 'Must flag negative score');

    // 2. Valid payload
    const validRes = await fetch(`${baseUrl}/test/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': 'req_tc_api_zod_valid',
      },
      body: JSON.stringify({
        title: 'Valid Question Title Here',
        score: 10,
      }),
    });

    assert.strictEqual(validRes.status, 200);
    const validData: ApiResponseEnvelope = await validRes.json();
    assert.strictEqual(validData.success, true);
    assert.strictEqual(validData.meta?.requestId, 'req_tc_api_zod_valid');
    assert.strictEqual((validData.data as any).title, 'Valid Question Title Here');

    console.log('✓ TC-API-02 PASSED: Zod request validation middleware returns structured HTTP 400 with field issues.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-API-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-CLIENT-01: ApiClient Integration & Concurrency Conflict Propagation
  // --------------------------------------------------------------------------
  try {
    const error = new ApiClientError('Concurrent modification detected', {
      statusCode: 409,
      code: 'CONFLICT_OPTIMISTIC_LOCK',
      details: { expectedVersion: 1, currentVersion: 2 },
      requestId: 'req_client_occ_1',
    });

    assert.strictEqual(error.statusCode, 409);
    assert.strictEqual(error.isConcurrencyConflict, true, 'ApiClientError must identify concurrency conflict');
    assert.strictEqual(error.serverVersion, 2, 'ApiClientError must extract current server version');
    assert.strictEqual(error.requestId, 'req_client_occ_1');

    console.log('✓ TC-CLIENT-01 PASSED: Central API client error mapping & OCC conflict handling verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-CLIENT-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Firestore Repository Contract Parity
  // --------------------------------------------------------------------------
  try {
    const firestoreRepo = new FirestoreRepository<TestQuestionEntity>('questions', 'qst_');
    assert.strictEqual(firestoreRepo.collectionName, 'questions');
    // Verify CRUD contract methods are present and conform to IRepository
    assert(typeof firestoreRepo.findById === 'function');
    assert(typeof firestoreRepo.create === 'function');
    assert(typeof firestoreRepo.update === 'function');
    assert(typeof firestoreRepo.delete === 'function');
    assert(typeof firestoreRepo.findMany === 'function');
    assert(typeof firestoreRepo.count === 'function');

    // Run test double execution on FirestoreRepository
    const item = await firestoreRepo.create({
      title: 'Firestore Test Question',
      category: 'Science',
      difficulty: 2,
    });
    assert(item.id.startsWith('qst_'));
    assert.strictEqual(item.version, 1);

    const fetchedItem = await firestoreRepo.findById(item.id);
    assert(fetchedItem !== null);
    assert.strictEqual(fetchedItem.title, 'Firestore Test Question');

    const updatedItem = await firestoreRepo.update(item.id, 1, {
      title: 'Updated Firestore Test Question',
    });
    assert.strictEqual(updatedItem.version, 2);

    let occFailed = false;
    try {
      await firestoreRepo.update(item.id, 1, { title: 'Stale update' });
    } catch (err: any) {
      occFailed = true;
      assert.strictEqual(err.statusCode, 409);
    }
    assert.strictEqual(occFailed, true);

    console.log('✓ TC-FIRESTORE PASSED: Firestore repository adheres to IRepository contract with OCC.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-FIRESTORE FAILED:', err.message);
    failed++;
  }

  // Teardown HTTP server
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log('\n============================================================');
  console.log(`FC-003 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
