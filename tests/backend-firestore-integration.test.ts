/**
 * BURRA PARIKSHA CMS — Positive Backend Firestore Integration Test
 * Sprint 4: Option A (Backend-Only Authoritative Gateway Architecture)
 *
 * Verifies that the BP-CMS backend persistence path can:
 * 1. CREATE a synthetic test document in real Cloud Firestore
 * 2. READ it back
 * 3. UPDATE it with atomic OCC version increment
 * 4. ENFORCE OCC by rejecting stale updates
 * 5. SOFT-DELETE it and filter by default
 * 6. Hard-delete and clean up immediately so no test data remains
 *
 * TEST ISOLATION GUARDS:
 * - Uses neutral synthetic fixtures ("TEST QUESTION — Firestore persistence verification")
 * - Sets testOnly: true and environment: 'TEST'
 * - Uses synthetic distinguishable IDs: BP-TEST-Q-*
 */

import assert from 'node:assert';
import { FirestoreRepository } from '../src/lib/db/firestore.repository';
import { BaseEntity } from '../src/lib/db/repository.interface';
import { ConcurrencyConflictError } from '../src/lib/errors';
import { getAdminFirestore } from '../src/lib/firebase/admin';
import { SYNTHETIC_TEST_MARKERS } from './fixtures/synthetic-test-fixtures';

interface TestQuestionRecord extends BaseEntity {
  contentMasterId: string;
  question: string;
  category: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  testOnly: boolean;
  environment: string;
}

async function runBackendIntegrationTest() {
  console.log('============================================================');
  console.log('SPRINT 4 — POSITIVE BACKEND FIRESTORE INTEGRATION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const repo = new FirestoreRepository<TestQuestionRecord>('questions', 'BP-TEST-Q-' as any);
    assert.strictEqual(repo.mode, 'FIRESTORE', 'Repository must be in FIRESTORE mode');

    const testId = `BP-TEST-Q-${Date.now()}`;
    const initialText = 'TEST QUESTION — Firestore persistence verification';
    const updatedText = 'TEST QUESTION — Firestore persistence verification (OCC updated)';

    // 1. CREATE
    console.log('--- Step 1: Backend creating synthetic test question in Firestore ---');
    const created = await repo.create({
      id: testId,
      contentMasterId: 'BP-TEST-CNT-000001',
      question: initialText,
      category: SYNTHETIC_TEST_MARKERS.category,
      topic: SYNTHETIC_TEST_MARKERS.topic,
      subtopic: SYNTHETIC_TEST_MARKERS.subtopic,
      difficulty: 1,
      testOnly: true,
      environment: 'TEST',
    });

    assert(created.id.startsWith('BP-TEST-Q-'), 'ID must match synthetic prefix BP-TEST-Q-');
    assert.strictEqual(created.version, 1, 'Initial version must be 1');
    assert.strictEqual(created.isDeleted, false, 'isDeleted must default to false');
    assert.strictEqual(created.testOnly, true, 'testOnly must be true');
    assert.strictEqual(created.environment, 'TEST', 'environment must be TEST');
    console.log('✓ TC-BACKEND-01: Synthetic test document created in Cloud Firestore:', created.id);
    passed++;

    // 2. READ
    console.log('--- Step 2: Backend reading test question from Firestore ---');
    const read = await repo.findById(created.id);
    assert(read !== null, 'Document must be retrievable from Cloud Firestore');
    assert.strictEqual(read.question, initialText);
    assert.strictEqual(read.testOnly, true);
    console.log('✓ TC-BACKEND-02: Document read successfully from Cloud Firestore.');
    passed++;

    // 3. UPDATE with OCC increment
    console.log('--- Step 3: Backend updating document with atomic OCC ---');
    const updated = await repo.update(created.id, 1, {
      question: updatedText,
    });
    assert.strictEqual(updated.version, 2, 'Version must atomically increment to 2');
    assert.strictEqual(updated.question, updatedText);
    console.log('✓ TC-BACKEND-03: Document updated with OCC increment to version 2.');
    passed++;

    // 4. OCC Conflict Rejection
    console.log('--- Step 4: Stale OCC update rejection ---');
    let occRejected = false;
    try {
      await repo.update(created.id, 1, { question: 'Stale update attempt' });
    } catch (err: any) {
      occRejected = err instanceof ConcurrencyConflictError || err.statusCode === 409;
    }
    assert.strictEqual(occRejected, true, 'Stale expectedVersion=1 update MUST be rejected with HTTP 409');
    console.log('✓ TC-BACKEND-04: Concurrency conflict successfully rejected.');
    passed++;

    // 5. SOFT-DELETE & FILTERING
    console.log('--- Step 5: Soft-delete and query filtering ---');
    const deleted = await repo.delete(created.id, 2, undefined, false);
    assert.strictEqual(deleted, true);

    const findDeleted = await repo.findById(created.id);
    assert.strictEqual(findDeleted, null, 'Soft-deleted document must be excluded by default');

    const findWithDeleted = await repo.findById(created.id, { includeDeleted: true });
    assert(findWithDeleted !== null && findWithDeleted.isDeleted === true);
    assert.strictEqual(findWithDeleted.version, 3);
    console.log('✓ TC-BACKEND-05: Soft-deletion and filtering verified in Cloud Firestore.');
    passed++;

    // 6. IMMEDIATE CLEANUP: Hard delete test record from Firestore
    console.log('--- Step 6: Hard-deleting test record to guarantee zero residual test data ---');
    await repo.delete(created.id, 3, undefined, true);
    const postCleanup = await repo.findById(created.id, { includeDeleted: true });
    assert.strictEqual(postCleanup, null, 'Test document must be permanently removed');
    console.log('✓ TC-BACKEND-06: Verified test document cleanly and permanently removed from Firestore.');
    passed++;
  } catch (err: any) {
    console.error('✗ Backend integration test FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`BACKEND FIRESTORE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    const db = getAdminFirestore();
    await db.terminate();
  } catch {}

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runBackendIntegrationTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
