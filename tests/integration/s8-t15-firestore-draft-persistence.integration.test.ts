/**
 * BURRA PARIKSHA CMS — S8-T15 Cloud Firestore Draft Persistence Integration Test
 * Sprint 8: Production Data Layer Persistence & Draft Resumption
 *
 * Verifies that the persistent Cloud Firestore adapter path for QuestionDraftsRepository:
 * 1. Operates in live 'FIRESTORE' persistence mode (not in-memory fallback).
 * 2. Creates a synthetic draft record in the 'question_drafts' collection.
 * 3. Retrieves the draft in a separate, freshly initialized repository instance (proving persistence across sessions).
 * 4. Atomically increments version via OCC and updates the draft.
 * 5. Rejects stale OCC concurrency updates with ConcurrencyConflictError (HTTP 409).
 * 6. Hard-deletes the synthetic test document to guarantee zero database pollution.
 *
 * TRUTHFUL PERSISTENCE ENFORCEMENT:
 * - If Firestore or Firestore emulator is unreachable, this test FAILS EXPLICITLY.
 * - It never falsely reports a PASS or conceals offline database status.
 */

import assert from 'node:assert';
import { QuestionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { canonicalIdService, QuestionStatus } from '../../shared';
import { ConcurrencyConflictError } from '../../src/lib/errors';
import { getAdminFirestore } from '../../database/firestore/adapter/admin';

async function runFirestoreDraftPersistenceTest() {
  console.log('========================================================================');
  console.log('S8-T15: CLOUD FIRESTORE DRAFT PERSISTENCE INTEGRATION TEST');
  console.log('========================================================================\n');

  // Verify repository mode without in-memory override
  const initialRepo = new QuestionDraftsRepository();
  const persistenceMode = await initialRepo.getPersistenceMode();
  console.log(`[Adapter Check] Repository persistence mode: "${persistenceMode}"`);
  console.log(`[Adapter Check] Collection name: "${initialRepo.getCollectionName()}"`);

  assert.strictEqual(initialRepo.getCollectionName(), 'question_drafts', 'Target collection must be "question_drafts"');
  assert.strictEqual(persistenceMode, 'FIRESTORE', 'Persistence mode must be "FIRESTORE"');

  const testDraftId = canonicalIdService.generateDraftId();
  const testTopicId = canonicalIdService.generateTopicId();
  const testSubtopicId = canonicalIdService.generateSubtopicId();

  // Test live connectivity against Cloud Firestore
  console.log('[Firestore Probe] Verifying connection to Cloud Firestore / Emulator...');
  let isFirestoreAvailable = false;
  try {
    const db = getAdminFirestore();
    await db.collection('question_drafts').limit(1).get();
    isFirestoreAvailable = true;
    console.log('[Firestore Probe] Connection verified successfully.\n');
  } catch (err: any) {
    console.error(`\n❌ [Firestore Probe Failed] Live Cloud Firestore / Emulator not reachable: ${err?.message}`);
  }

  // TRUTHFULNESS GATE: Never report pass when Firestore is unavailable
  if (!isFirestoreAvailable) {
    console.error('========================================================================');
    console.error('S8-T15 CLOUD FIRESTORE INTEGRATION TEST FAILED: FIRESTORE UNAVAILABLE');
    console.error('Real persistence round-trip cannot execute without active Firestore/Emulator.');
    console.error('========================================================================\n');
    process.exit(1);
  }

  try {
    // 1. CREATE: Persist synthetic draft
    console.log('--- Step 1: Creating synthetic draft in Cloud Firestore ---');
    const created = await initialRepo.create({
      id: testDraftId,
      topicId: testTopicId,
      subtopicId: testSubtopicId,
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: '[SYNTHETIC TEST RECORD - S8-T15 INTEGRATION TEST - DO NOT USE]',
      question: '[SYNTHETIC TEST RECORD - S8-T15 INTEGRATION TEST - DO NOT USE]',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
      status: QuestionStatus.DRAFT,
      workflowStage: 'QUESTION_STUDIO',
      authorId: 'usr_test_synthetic_author',
      authorName: 'Synthetic Test Author',
    } as any);

    assert.strictEqual(created.id, testDraftId);
    assert.strictEqual(created.version, 1);
    console.log('✓ Step 1 Passed: Synthetic draft created in Cloud Firestore with ID:', created.id);

    // 2. READ: Reopen in a fresh repository instance (simulating brand new session)
    console.log('--- Step 2: Reopening draft from fresh QuestionDraftsRepository instance ---');
    const freshSessionRepo = new QuestionDraftsRepository();
    const retrieved = await freshSessionRepo.findById(testDraftId);

    assert(retrieved !== null, 'Draft must be retrievable in fresh repository instance');
    assert.strictEqual(retrieved.id, testDraftId);
    assert.strictEqual(retrieved.questionText, '[SYNTHETIC TEST RECORD - S8-T15 INTEGRATION TEST - DO NOT USE]');
    assert.strictEqual(retrieved.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(retrieved.workflowStage, 'QUESTION_STUDIO');
    console.log('✓ Step 2 Passed: Draft successfully re-hydrated from Cloud Firestore across session boundary.');

    // 3. UPDATE: Atomic OCC version increment
    console.log('--- Step 3: Updating draft with atomic OCC ---');
    const updated = await freshSessionRepo.update(
      testDraftId,
      {
        ...retrieved,
        questionText: '[SYNTHETIC TEST RECORD - S8-T15 INTEGRATION TEST - UPDATED]',
      },
      { expectedVersion: 1 }
    );
    assert.strictEqual(updated.version, 2, 'Version must atomically increment to 2');
    console.log('✓ Step 3 Passed: Draft updated in Cloud Firestore with version incremented to 2.');

    // 4. OCC CONFLICT: Stale update rejection
    console.log('--- Step 4: Stale OCC update rejection ---');
    let occCaught = false;
    try {
      await freshSessionRepo.update(
        testDraftId,
        { ...retrieved, questionText: 'Stale attempt' },
        { expectedVersion: 1 } // Stale version! Current is 2
      );
    } catch (err: any) {
      occCaught = err instanceof ConcurrencyConflictError || err.statusCode === 409;
    }
    assert.strictEqual(occCaught, true, 'Stale expectedVersion=1 update MUST throw ConcurrencyConflictError');
    console.log('✓ Step 4 Passed: Stale OCC update rejected with HTTP 409.');

    // 5. TEARDOWN: Hard-delete test record to guarantee zero database pollution
    console.log('--- Step 5: Cleaning up synthetic test record from Cloud Firestore ---');
    await freshSessionRepo.delete(testDraftId);
    const postCleanup = await freshSessionRepo.findById(testDraftId);
    assert.strictEqual(postCleanup, null, 'Test draft must be cleanly deleted');
    console.log('✓ Step 5 Passed: Synthetic test record cleaned up.');

    console.log('\n========================================================================');
    console.log('[FIRESTORE ROUND-TRIP EXECUTED: SUCCESS]');
    console.log('ALL S8-T15 CLOUD FIRESTORE INTEGRATION TESTS PASSED CLEANLY');
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error('✗ S8-T15 Cloud Firestore Integration Test Failed:', err);
    throw err;
  } finally {
    try {
      const db = getAdminFirestore();
      await db.terminate();
    } catch {}
  }
}

runFirestoreDraftPersistenceTest().catch((err) => {
  console.error('Fatal error in integration test:', err);
  process.exit(1);
});
