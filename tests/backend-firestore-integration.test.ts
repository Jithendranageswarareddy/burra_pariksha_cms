/**
 * BURRA PARIKSHA CMS — Positive Backend Firestore Integration Test
 * Sprint 4: Option A (Backend-Only Authoritative Gateway Architecture)
 *
 * Proves that the BP-CMS backend persistence path can:
 * 1. CREATE a document in real Cloud Firestore
 * 2. READ it back
 * 3. UPDATE it with atomic OCC version increment
 * 4. ENFORCE OCC by rejecting stale updates
 * 5. SOFT-DELETE it and filter by default
 * 6. Access real Firestore collections without in-memory fallback
 */

import assert from 'node:assert';
import { FirestoreRepository } from '../src/lib/db/firestore.repository';
import { BaseEntity } from '../src/lib/db/repository.interface';
import { ConcurrencyConflictError } from '../src/lib/errors';
import { terminate } from 'firebase/firestore';
import { getBackendFirestore } from '../src/lib/firebase/server-auth';

interface TestQuestionRecord extends BaseEntity {
  contentMasterId: string;
  question: string;
  category: string;
  difficulty: number;
}

async function runBackendIntegrationTest() {
  console.log('============================================================');
  console.log('SPRINT 4 — POSITIVE BACKEND FIRESTORE INTEGRATION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const repo = new FirestoreRepository<TestQuestionRecord>('questions', 'BP-Q-' as any);
    assert.strictEqual(repo.mode, 'FIRESTORE', 'Repository must be in FIRESTORE mode');

    // 1. CREATE
    console.log('--- Step 1: Backend creating question in Firestore ---');
    const created = await repo.create({
      contentMasterId: 'BP-CNT-777777',
      question: 'What is the role of mitochondria in human cells?',
      category: 'Biology',
      difficulty: 1,
    });
    assert(created.id.startsWith('BP-Q-'), 'ID must match canonical prefix BP-Q-');
    assert.strictEqual(created.version, 1, 'Initial version must be 1');
    assert.strictEqual(created.isDeleted, false, 'isDeleted must default to false');
    console.log('✓ TC-BACKEND-01: Document created in Cloud Firestore:', created.id);
    passed++;

    // 2. READ
    console.log('--- Step 2: Backend reading question from Firestore ---');
    const read = await repo.findById(created.id);
    assert(read !== null, 'Document must be retrievable from Cloud Firestore');
    assert.strictEqual(read.question, 'What is the role of mitochondria in human cells?');
    console.log('✓ TC-BACKEND-02: Document read successfully from Cloud Firestore.');
    passed++;

    // 3. UPDATE with OCC increment
    console.log('--- Step 3: Backend updating document with atomic OCC ---');
    const updated = await repo.update(created.id, 1, {
      question: 'What is the role of mitochondria (cellular respiration)?',
    });
    assert.strictEqual(updated.version, 2, 'Version must atomically increment to 2');
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

    // Teardown test record
    await repo.delete(created.id, 3, undefined, true);
    console.log('✓ Cleaned up test record.');
  } catch (err: any) {
    console.error('✗ Backend integration test FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`BACKEND FIRESTORE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    const db = await getBackendFirestore();
    await terminate(db);
  } catch {}

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runBackendIntegrationTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
