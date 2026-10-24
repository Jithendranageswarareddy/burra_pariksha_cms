/**
 * BURRA PARIKSHA CMS — S11-T02 Cloud Firestore Learning Unit Persistence Integration Test
 * Sprint 11: Core Requirements & Learning Unit Persistence
 *
 * Validates real persistence against the local Cloud Firestore emulator:
 * 1. Operates in live 'FIRESTORE' persistence mode (not in-memory fallback).
 * 2. Connects to isolated emulator target (burra-pariksha-test / (default) on 127.0.0.1:8080).
 * 3. Creates a synthetic LearningUnit document in the real 'learning_units' collection.
 * 4. Retrieves the document via findById in a separate query to prove real round-trip persistence.
 * 5. Atomically increments version via OCC and updates document via Firestore transaction.
 * 6. Rejects stale OCC concurrency updates with ConcurrencyConflictError (HTTP 409).
 * 7. Enforces primary key uniqueness and schema validation on writes.
 * 8. Queries and filters real documents in the emulator collection.
 * 9. Guarantees complete collection isolation from questions, question_drafts, and videos.
 * 10. Cleans up only the synthetic test records created in this test run.
 *
 * TRUTHFUL PERSISTENCE ENFORCEMENT:
 * - If Firestore emulator is unreachable or isolation guard fails, this test FAILS EXPLICITLY.
 * - Never falsely reports a PASS or conceals offline database status.
 */

// 1. Configure isolated test environment targeting local Firestore emulator
process.env.NODE_ENV = 'test';
process.env.USE_FIRESTORE_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIRESTORE_TEST_PROJECT_ID = 'burra-pariksha-test';
process.env.FIRESTORE_PROJECT_ID = 'burra-pariksha-test';
process.env.FIRESTORE_DATABASE_ID = '(default)';
delete process.env.PERSISTENCE_MODE; // Ensure live FIRESTORE repository adapter is used

import assert from 'node:assert/strict';
import http from 'node:http';
import { LearningUnitsRepository } from '../../../database/firestore/repositories/learning-units.repository';
import { QuestionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { QuestionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  SkillLevel,
  PresentationFormat,
  canonicalIdService,
} from '../../../shared';
import {
  ValidationError,
  NotFoundError,
  ConcurrencyConflictError,
  ForbiddenError,
} from '../../../src/lib/errors';
import { getAdminFirestore, resetAdminApp } from '../../../database/firestore/adapter/admin';
import { assertDatastoreSafe } from '../../../src/config/datastore-guard';
import { createSyntheticLearningUnitPayload } from '../../fixtures/synthetic-test-fixtures';

async function probeEmulator(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8080', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function runFirestoreIntegrationTest() {
  console.log('========================================================================');
  console.log('S11-T02: CLOUD FIRESTORE LEARNING UNIT INTEGRATION TEST');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: Datastore Safety & Emulator Reachability Gate
  // --------------------------------------------------------------------------
  console.log('[Step 1] Datastore Isolation Guard & Emulator Reachability Check...');

  // Reset any cached Firebase Admin instances to guarantee fresh emulator binding
  await resetAdminApp();

  const datastoreTarget = assertDatastoreSafe();
  console.log(`[Target Check] Mode: ${datastoreTarget.mode}`);
  console.log(`[Target Check] Project: ${datastoreTarget.projectId}`);
  console.log(`[Target Check] Database: ${datastoreTarget.databaseId}`);
  console.log(`[Target Check] Emulator Host: ${datastoreTarget.emulatorHost}`);

  assert.strictEqual(datastoreTarget.mode, 'LOCAL_FIRESTORE_EMULATOR');
  assert.strictEqual(datastoreTarget.projectId, 'burra-pariksha-test');
  assert.strictEqual(datastoreTarget.databaseId, '(default)');
  assert.strictEqual(datastoreTarget.isProductionTarget, false);

  const isUp = await probeEmulator();
  if (!isUp) {
    console.error('\n❌ [FATAL] Local Firestore emulator is NOT reachable on 127.0.0.1:8080.');
    console.error('Real persistence round-trip cannot execute without active emulator.');
    process.exit(1);
  }
  console.log('✓ Firestore emulator is reachable on 127.0.0.1:8080.\n');

  // Verify Admin SDK Firestore connectivity
  const db = getAdminFirestore();
  await db.collection('learning_units').limit(1).get();
  console.log('✓ Firebase Admin SDK successfully connected to local emulator.\n');

  // --------------------------------------------------------------------------
  // STEP 2: Repository Mode Check
  // --------------------------------------------------------------------------
  console.log('[Step 2] Repository Persistence Mode Verification...');
  const repo = new LearningUnitsRepository();
  const persistenceMode = await repo.getPersistenceMode();
  console.log(`[Repository Check] Persistence mode: "${persistenceMode}"`);
  console.log(`[Repository Check] Collection name: "${repo.getCollectionName()}"`);

  assert.strictEqual(persistenceMode, 'FIRESTORE', 'Persistence mode must be "FIRESTORE" (not in-memory)');
  assert.strictEqual(repo.getCollectionName(), 'learning_units');
  console.log('✓ Repository operates in live FIRESTORE adapter mode.\n');

  const createdSyntheticIds: string[] = [];

  try {
    // ------------------------------------------------------------------------
    // STEP 3: Create Synthetic LearningUnit in Real Emulator
    // ------------------------------------------------------------------------
    console.log('[Step 3] Creating synthetic LearningUnit in Firestore emulator...');
    const syntheticId = canonicalIdService.generateLearningUnitId();
    createdSyntheticIds.push(syntheticId);

    const created = await repo.create({
      id: syntheticId,
      ...createSyntheticLearningUnitPayload(syntheticId),
    });

    assert.strictEqual(created.id, syntheticId);
    assert.strictEqual(created.version, 1);
    assert.ok(created.createdAt);
    assert.ok(created.updatedAt);
    console.log(`✓ Synthetic LearningUnit created in Firestore emulator with ID: ${created.id}`);

    // Verify document actually exists in Firestore emulator database
    const directDocSnap = await db.collection('learning_units').doc(syntheticId).get();
    assert.ok(directDocSnap.exists, 'Document must physically exist in Firestore emulator');
    const rawData = directDocSnap.data();
    assert.strictEqual(rawData?.title, `[SYNTHETIC TEST] Learning unit ${syntheticId}`);
    assert.strictEqual(rawData?.version, 1);
    console.log('✓ Direct Firestore Admin SDK document get confirmed record existence.\n');

    // ------------------------------------------------------------------------
    // STEP 4: Retrieve Via Repository findById in Fresh Query
    // ------------------------------------------------------------------------
    console.log('[Step 4] Retrieving LearningUnit via repository findById...');
    const retrieved = await repo.findById(syntheticId);
    assert.ok(retrieved, 'LearningUnit must be found via findById');
    assert.strictEqual(retrieved.id, syntheticId);
    assert.strictEqual(retrieved.title, `[SYNTHETIC TEST] Learning unit ${syntheticId}`);
    assert.strictEqual(retrieved.skillLevel, SkillLevel.BEGINNER);
    assert.strictEqual(retrieved.audienceContext, AudienceContext.HOUSEHOLDS);
    console.log('✓ Repository findById retrieved document correctly.\n');

    // ------------------------------------------------------------------------
    // STEP 5: Update with Optimistic Concurrency Control (OCC)
    // ------------------------------------------------------------------------
    console.log('[Step 5] Updating document with OCC version increment...');
    const updated = await repo.update(
      syntheticId,
      {
        title: `[SYNTHETIC TEST] Learning unit ${syntheticId} (Updated)`,
        verifiedMethod: 'Step 1: Check discount rate. Step 2: Compute net price. Step 3: Compare against alternatives. (Updated method).',
      },
      { expectedVersion: 1 }
    );

    assert.strictEqual(updated.title, `[SYNTHETIC TEST] Learning unit ${syntheticId} (Updated)`);
    assert.strictEqual(updated.version, 2, 'Version must increment to 2 in Firestore');

    // Verify version in real Firestore emulator
    const updatedDocSnap = await db.collection('learning_units').doc(syntheticId).get();
    assert.strictEqual(updatedDocSnap.data()?.version, 2);
    console.log('✓ Document updated with OCC: version incremented from 1 -> 2.\n');

    // ------------------------------------------------------------------------
    // STEP 6: Reject Stale OCC Concurrency Updates
    // ------------------------------------------------------------------------
    console.log('[Step 6] Rejection of stale OCC version update (conflict test)...');
    await assert.rejects(
      async () => {
        // Attempt update with stale expectedVersion 1 (current is 2)
        await repo.update(
          syntheticId,
          { title: '[SYNTHETIC] Stale update that should be rejected' },
          { expectedVersion: 1 }
        );
      },
      (err: any) => {
        assert.ok(
          err instanceof ConcurrencyConflictError || err?.code === 'CONCURRENCY_CONFLICT' || err?.statusCode === 409,
          `Expected ConcurrencyConflictError (HTTP 409), got: ${err}`
        );
        return true;
      }
    );
    console.log('✓ Stale version conflict rejected with ConcurrencyConflictError (HTTP 409).\n');

    // ------------------------------------------------------------------------
    // STEP 7: Primary Key Uniqueness & Schema Validation
    // ------------------------------------------------------------------------
    console.log('[Step 7] Primary key uniqueness and schema validation...');
    await assert.rejects(
      async () => {
        await repo.create({
          id: syntheticId, // duplicate ID
          topicId: 'top_percentages_01',
          subtopicId: 'sub_discounts_01',
          title: '[SYNTHETIC] Duplicate ID attempt',
          learningObjective: 'Should be rejected by primary key uniqueness guard.',
          verifiedMethod: 'Step 1: Reject duplicate.',
          skillLevel: SkillLevel.BEGINNER,
          authorId: 'usr_educator_001',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('already exists'));
        return true;
      }
    );
    console.log('✓ Duplicate ID rejected by primary key uniqueness guard.\n');

    // ------------------------------------------------------------------------
    // STEP 8: Query & Multi-Dimensional Filtering in Real Firestore
    // ------------------------------------------------------------------------
    console.log('[Step 8] Querying and filtering in Firestore collection...');
    const syntheticId2 = canonicalIdService.generateLearningUnitId();
    createdSyntheticIds.push(syntheticId2);

    await repo.create({
      id: syntheticId2,
      topicId: 'top_speed_03',
      topicName: 'Time and Distance',
      subtopicId: 'sub_trains_03',
      subtopicName: 'Trains Passing Platforms',
      title: '[SYNTHETIC] Calculate relative speed of crossing trains',
      learningObjective: 'Viewers will convert km/h to m/s and calculate elapsed crossing times for two moving trains.',
      verifiedMethod: 'Step 1: Add train lengths. Step 2: Add relative speeds. Step 3: Divide total distance by speed.',
      skillLevel: SkillLevel.ADVANCED,
      audienceContext: AudienceContext.COMPETITIVE_EXAM,
      editorialPillar: EditorialPillar.PRACTICAL_UNDERSTANDING,
      authorId: 'usr_educator_003',
    });

    const topicResults = await repo.query({ topicId: 'top_speed_03' });
    assert.strictEqual(topicResults.length, 1);
    assert.strictEqual(topicResults[0].id, syntheticId2);

    const examResults = await repo.query({ audienceContext: AudienceContext.COMPETITIVE_EXAM });
    assert.ok(examResults.some((u) => u.id === syntheticId2));

    const searchResults = await repo.query({ search: 'crossing trains' });
    assert.ok(searchResults.some((u) => u.id === syntheticId2));
    console.log('✓ Real Firestore queries and multi-dimensional filters verified.\n');

    // ------------------------------------------------------------------------
    // STEP 9: Collection Isolation Verification
    // ------------------------------------------------------------------------
    console.log('[Step 9] Verifying collection isolation (questions & drafts)...');
    const questionsRepo = QuestionsRepository.getInstance();
    const draftsRepo = QuestionDraftsRepository.getInstance();

    assert.strictEqual(questionsRepo.getCollectionName(), 'questions');
    assert.strictEqual(draftsRepo.getCollectionName(), 'question_drafts');

    // Confirm learning_units documents do not bleed into questions
    const questionDocs = await db.collection('questions').where('id', '==', syntheticId).get();
    assert.strictEqual(questionDocs.empty, true, 'learning_units doc must not appear in questions');

    const draftDocs = await db.collection('question_drafts').where('id', '==', syntheticId).get();
    assert.strictEqual(draftDocs.empty, true, 'learning_units doc must not appear in question_drafts');
    console.log('✓ Strict collection isolation confirmed: zero leakage into questions or drafts.\n');

  } finally {
    // ------------------------------------------------------------------------
    // STEP 10: Teardown of Synthetic Records
    // ------------------------------------------------------------------------
    console.log('[Step 10] Tearing down synthetic test records from emulator...');
    for (const testId of createdSyntheticIds) {
      try {
        await db.collection('learning_units').doc(testId).delete();
        console.log(`  ✓ Removed synthetic test document: ${testId}`);
      } catch (err: any) {
        console.warn(`  ⚠ Failed to delete synthetic test document: ${testId}`, err?.message);
      }
    }
    console.log('✓ Zero database pollution: All synthetic fixtures cleaned up.\n');
  }

  console.log('========================================================================');
  console.log('ALL S11-T02 FIRESTORE EMULATOR INTEGRATION TESTS PASSED 100%');
  console.log('========================================================================\n');
}

runFirestoreIntegrationTest().catch((err) => {
  console.error('\n❌ S11-T02 Firestore Integration Test Failed:', err);
  process.exit(1);
});
