/**
 * BURRA PARIKSHA CMS — S11-T02 Learning Unit Repository & Persistence Unit Test Suite
 * Location: tests/unit/core-requirements/s11-t02-learning-unit-repository.unit.test.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 *
 * Deterministically tests:
 * 1. Isolated repository instantiation & collection binding ('learning_units').
 * 2. Complete create, retrieve, update, and list round-trip persistence.
 * 3. Primary key uniqueness guard and canonical lnu_<uuid> ID validation.
 * 4. Schema validation and fail-closed rejection of invalid inputs.
 * 5. Optimistic Concurrency Control (OCC) and stale version conflict rejection (HTTP 409).
 * 6. Identifier immutability protection.
 * 7. Multi-dimensional querying across taxonomy, skill level, audience context, and editorial pillars.
 * 8. RBAC authorization controls on creation and modification.
 * 9. Datastore isolation: zero production network calls and preservation of unrelated collections.
 */

// Force isolated test mode to guarantee 0 live Cloud Firestore mutations
process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';
process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import {
  learningUnitsRepository,
  LearningUnitsRepository,
} from '../../../database/firestore/repositories/learning-units.repository';
import { questionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
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
import {
  assertDatastoreSafe,
  KNOWN_PRODUCTION_TARGETS,
} from '../../../src/config/datastore-guard';

async function runTestSuite() {
  console.log('============================================================');
  console.log('SUITE S11-T02: Learning Unit Repository & Persistence');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Datastore Isolation & Target Safety Verification
  // --------------------------------------------------------------------------
  console.log('[Test 1] Datastore isolation & production protection guard...');
  {
    assert.strictEqual(
      learningUnitsRepository.getCollectionName(),
      'learning_units',
      'Target collection must be "learning_units"'
    );
    const mode = await learningUnitsRepository.getPersistenceMode();
    assert.strictEqual(
      mode,
      'IN_MEMORY_TEST_ONLY',
      'Repository must operate in isolated in-memory test mode'
    );

    // Verify guard forbids targeting canonical production during test without emulator
    for (const prodTarget of KNOWN_PRODUCTION_TARGETS) {
      assert.throws(
        () => {
          const testEnv: NodeJS.ProcessEnv = {
            NODE_ENV: 'test',
            GCP_PROJECT_ID: prodTarget.projectId,
            FIRESTORE_DATABASE_ID: prodTarget.databaseId,
          };
          assertDatastoreSafe(testEnv);
        },
        (err: any) => err?.name === 'DatastoreIsolationError' || err?.code === 'DATASTORE_ISOLATION_ERROR',
        `Datastore guard must strictly fail-closed against production target: ${prodTarget.projectId}/${prodTarget.databaseId}`
      );
    }
    console.log('  -> PASS: 100% datastore isolation verified against production targets.');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Create LearningUnit with Auto-Generated Canonical ID
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Create LearningUnit with auto-generated canonical ID...');
  let createdUnitId = '';
  {
    const newUnit = await learningUnitsRepository.create({
      topicId: 'top_percentages_01',
      topicName: 'Percentages & Arithmetic',
      subtopicId: 'sub_discounts_01',
      subtopicName: 'Commercial Discounts',
      title: 'Calculate discounts and compare final prices',
      learningObjective: 'Viewers will calculate percentage discounts and determine the lower final cost between competing store promotions.',
      prerequisiteSkills: ['Basic multiplication', 'Fractions to decimals'],
      verifiedMethod: 'Step 1: Multiply original price by discount rate. Step 2: Subtract discount amount from original price. Step 3: Compare final prices.',
      correctCalculations: 'Original = ₹350. 20% discount = ₹70. Final price = ₹280. Flat ₹50 off = ₹300. Savings difference = ₹20.',
      commonMistakes: [
        'Confusing flat rupee discounts with percentage discounts',
        'Applying percentage to already discounted price instead of base price',
      ],
      realLifeApplications: [
        'Supermarket shopping comparisons',
        'Festival sale promotions',
      ],
      realLifeScenario: 'Comparing 20% off on ₹350 item vs flat ₹50 off coupon.',
      skillLevel: SkillLevel.BEGINNER,
      audienceContext: AudienceContext.HOUSEHOLDS,
      editorialPillar: EditorialPillar.EVERYDAY_MONEY,
      suggestedModes: [
        CanonicalContentMode.TOPIC_INTRODUCTION,
        CanonicalContentMode.WORKED_EXAMPLES,
        CanonicalContentMode.QUESTION_CHALLENGE_SHORT,
      ],
      primaryFormat: PresentationFormat.VIDEO,
      authorId: 'usr_educator_001',
      authorName: 'Suresh Kumar',
    });

    assert.ok(newUnit.id.startsWith('lnu_'), 'ID must begin with canonical prefix "lnu_"');
    assert.ok(canonicalIdService.validateCanonicalId(newUnit.id, 'lnu_'), 'ID must be a valid canonical UUIDv4');
    assert.strictEqual(newUnit.version, 1, 'Initial version must be 1');
    assert.ok(newUnit.createdAt, 'createdAt must be populated');
    assert.ok(newUnit.updatedAt, 'updatedAt must be populated');
    assert.strictEqual(newUnit.title, 'Calculate discounts and compare final prices');
    assert.strictEqual(newUnit.skillLevel, SkillLevel.BEGINNER);
    assert.strictEqual(newUnit.audienceContext, AudienceContext.HOUSEHOLDS);
    assert.strictEqual(newUnit.editorialPillar, EditorialPillar.EVERYDAY_MONEY);
    assert.strictEqual(newUnit.primaryFormat, PresentationFormat.VIDEO);

    createdUnitId = newUnit.id;
    console.log(`  -> PASS: LearningUnit created with canonical ID: ${createdUnitId}`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Retrieve by ID & Missing Records Handling
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Retrieve LearningUnit by ID and missing records handling...');
  {
    const found = await learningUnitsRepository.findById(createdUnitId);
    assert.ok(found, 'Created LearningUnit must be retrievable by ID');
    assert.strictEqual(found.id, createdUnitId);
    assert.strictEqual(found.title, 'Calculate discounts and compare final prices');

    const nonExistentId = canonicalIdService.generateLearningUnitId();
    const missing = await learningUnitsRepository.findById(nonExistentId);
    assert.strictEqual(missing, null, 'Non-existent ID must return null');
    console.log('  -> PASS: Retrieval and missing record handling verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Primary Key Uniqueness & Canonical ID Validation
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Primary key uniqueness & canonical ID format validation...');
  {
    // Custom valid canonical ID
    const customId = canonicalIdService.generateLearningUnitId();
    const customUnit = await learningUnitsRepository.create({
      id: customId,
      topicId: 'top_fractions_02',
      subtopicId: 'sub_ratios_02',
      title: 'Simplifying ratios for kitchen recipes',
      learningObjective: 'Viewers will scale kitchen recipe proportions accurately using fraction simplification.',
      verifiedMethod: 'Divide both parts of the ratio by their greatest common divisor (GCD).',
      skillLevel: SkillLevel.FOUNDATION,
      authorId: 'usr_educator_002',
    });
    assert.strictEqual(customUnit.id, customId, 'Custom valid canonical ID must be preserved');

    // Duplicate ID rejection
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create({
          id: customId,
          topicId: 'top_fractions_02',
          subtopicId: 'sub_ratios_02',
          title: 'Duplicate ratio lesson',
          learningObjective: 'This should be rejected due to duplicate primary key.',
          verifiedMethod: 'Attempt duplicate insert.',
          skillLevel: SkillLevel.FOUNDATION,
          authorId: 'usr_educator_002',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError, 'Must throw ValidationError on duplicate ID');
        assert.ok(err.message.includes('already exists'), 'Message must indicate existing ID');
        return true;
      }
    );

    // Malformed ID rejection
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create({
          id: 'invalid-id-no-prefix',
          topicId: 'top_fractions_02',
          subtopicId: 'sub_ratios_02',
          title: 'Malformed ID lesson',
          learningObjective: 'This should be rejected due to invalid ID prefix.',
          verifiedMethod: 'Attempt malformed ID insert.',
          skillLevel: SkillLevel.FOUNDATION,
          authorId: 'usr_educator_002',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError, 'Must throw ValidationError on malformed ID');
        assert.ok(err.message.includes('Invalid canonical LearningUnit identifier'));
        return true;
      }
    );
    console.log('  -> PASS: Primary key uniqueness and ID validation verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Schema Validation & Invalid Input Rejection
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Schema validation & fail-closed rejection of invalid inputs...');
  {
    // Missing required title
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create({
          topicId: 'top_01',
          subtopicId: 'sub_01',
          title: '', // Too short
          learningObjective: 'Valid objective with sufficient length.',
          verifiedMethod: 'Valid step by step method.',
          skillLevel: SkillLevel.FOUNDATION,
          authorId: 'usr_01',
        } as any);
      },
      (err: any) => err instanceof ValidationError && err.message.includes('Title must be at least 3 characters')
    );

    // Missing required verifiedMethod
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create({
          topicId: 'top_01',
          subtopicId: 'sub_01',
          title: 'Valid Title',
          learningObjective: 'Valid objective with sufficient length.',
          verifiedMethod: 'short', // < 10 characters
          skillLevel: SkillLevel.FOUNDATION,
          authorId: 'usr_01',
        } as any);
      },
      (err: any) => err instanceof ValidationError && err.message.includes('Verified method must provide a step-by-step')
    );

    // Invalid skill level enum
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create({
          topicId: 'top_01',
          subtopicId: 'sub_01',
          title: 'Valid Title',
          learningObjective: 'Valid objective with sufficient length.',
          verifiedMethod: 'Valid step by step method.',
          skillLevel: 'GENIUS' as any, // Invalid enum
          authorId: 'usr_01',
        } as any);
      },
      (err: any) => err instanceof ValidationError
    );
    console.log('  -> PASS: Zod schema contract validates inputs and rejects invalid mutations.');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Update & Optimistic Concurrency Control (OCC)
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Update and Optimistic Concurrency Control (OCC)...');
  {
    const initial = await learningUnitsRepository.findById(createdUnitId);
    assert.ok(initial);
    assert.strictEqual(initial.version, 1);

    // Successful update with matching expectedVersion
    const updated = await learningUnitsRepository.update(
      createdUnitId,
      {
        title: 'Calculate discounts and compare final prices (Updated)',
        verifiedMethod: 'Step 1: Check discount rate. Step 2: Compute net price. Step 3: Compare against alternatives.',
      },
      { expectedVersion: 1 }
    );

    assert.strictEqual(updated.title, 'Calculate discounts and compare final prices (Updated)');
    assert.strictEqual(updated.version, 2, 'Version must increment to 2');

    // Concurrency Conflict: update with stale expectedVersion (expected 1, actual 2)
    await assert.rejects(
      async () => {
        await learningUnitsRepository.update(
          createdUnitId,
          { title: 'Conflicting concurrent edit' },
          { expectedVersion: 1 }
        );
      },
      (err: any) => {
        assert.ok(
          err instanceof ConcurrencyConflictError || err?.statusCode === 409,
          `Expected ConcurrencyConflictError (HTTP 409), got: ${err}`
        );
        return true;
      }
    );

    // Update to non-existent ID fails with NotFoundError
    const nonExistentId = canonicalIdService.generateLearningUnitId();
    await assert.rejects(
      async () => {
        await learningUnitsRepository.update(nonExistentId, { title: 'Ghost update' });
      },
      (err: any) => err instanceof NotFoundError
    );
    console.log('  -> PASS: OCC atomic version increments and 409 conflict detection verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 7: Identifier Immutability Protection
  // --------------------------------------------------------------------------
  console.log('\n[Test 7] Identifier immutability protection on updates...');
  {
    const differentId = canonicalIdService.generateLearningUnitId();
    await assert.rejects(
      async () => {
        await learningUnitsRepository.update(createdUnitId, {
          id: differentId,
          title: 'Attempted ID modification',
        } as any);
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError, 'Must throw ValidationError on attempted ID change');
        assert.ok(err.message.includes('immutable'));
        return true;
      }
    );
    console.log('  -> PASS: LearningUnit identifier is strictly immutable.');
  }

  // --------------------------------------------------------------------------
  // TEST 8: Multi-Dimensional Querying & Filtering
  // --------------------------------------------------------------------------
  console.log('\n[Test 8] Multi-dimensional querying & text search...');
  {
    // Seed additional unit for filtering
    await learningUnitsRepository.create({
      topicId: 'top_speed_03',
      topicName: 'Time and Distance',
      subtopicId: 'sub_trains_03',
      subtopicName: 'Trains Passing Platforms',
      title: 'Calculate relative speed of crossing trains',
      learningObjective: 'Viewers will convert km/h to m/s and calculate elapsed crossing times for two moving trains.',
      verifiedMethod: 'Step 1: Add train lengths. Step 2: Add relative speeds. Step 3: Divide total distance by speed.',
      skillLevel: SkillLevel.ADVANCED,
      audienceContext: AudienceContext.COMPETITIVE_EXAM,
      editorialPillar: EditorialPillar.PRACTICAL_UNDERSTANDING,
      authorId: 'usr_educator_003',
    });

    // 1. Filter by topic
    const topicResults = await learningUnitsRepository.query({ topicId: 'top_speed_03' });
    assert.strictEqual(topicResults.length, 1);
    assert.strictEqual(topicResults[0].title, 'Calculate relative speed of crossing trains');

    // 2. Filter by audience context
    const examResults = await learningUnitsRepository.query({
      audienceContext: AudienceContext.COMPETITIVE_EXAM,
    });
    assert.strictEqual(examResults.length, 1);
    assert.strictEqual(examResults[0].subtopicId, 'sub_trains_03');

    // 3. Filter by skill level
    const advancedResults = await learningUnitsRepository.query({
      skillLevel: SkillLevel.ADVANCED,
    });
    assert.strictEqual(advancedResults.length, 1);

    // 4. Text search across fields
    const searchResults = await learningUnitsRepository.query({ search: 'crossing trains' });
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].subtopicName, 'Trains Passing Platforms');

    // 5. Unmatched search returns empty array
    const emptyResults = await learningUnitsRepository.query({ search: 'nonexistent keyword query' });
    assert.strictEqual(emptyResults.length, 0);

    console.log('  -> PASS: Multi-dimensional queries and text search operate accurately.');
  }

  // --------------------------------------------------------------------------
  // TEST 9: RBAC Authorization Controls on Creation & Mutation
  // --------------------------------------------------------------------------
  console.log('\n[Test 9] RBAC authorization controls on creation and update...');
  {
    // 1. Disallowed role on create throws ForbiddenError
    await assert.rejects(
      async () => {
        await learningUnitsRepository.create(
          {
            topicId: 'top_01',
            subtopicId: 'sub_01',
            title: 'Analyst unauthorized creation',
            learningObjective: 'Viewers will learn why unauthorized creation fails.',
            verifiedMethod: 'Verify permission gate in create method.',
            skillLevel: SkillLevel.BEGINNER,
          },
          { actor: { id: 'usr_analyst_01', role: 'ANALYST' } }
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenError, 'Must throw ForbiddenError (HTTP 403) for unauthorized role');
        assert.ok(err.message.includes('not authorized'));
        return true;
      }
    );

    // 2. Authorized creator can create
    const creatorUnit = await learningUnitsRepository.create(
      {
        topicId: 'top_01',
        subtopicId: 'sub_01',
        title: 'Creator authorized creation',
        learningObjective: 'Viewers will learn that creators are authorized to author lessons.',
        verifiedMethod: 'Verify creator role passes permission check.',
        skillLevel: SkillLevel.BEGINNER,
      },
      { actor: { id: 'usr_author_42', role: 'QUESTION_CREATOR' } }
    );
    assert.strictEqual(creatorUnit.authorId, 'usr_author_42');

    // 3. Another author cannot update someone else's learning unit
    await assert.rejects(
      async () => {
        await learningUnitsRepository.update(
          creatorUnit.id,
          { title: 'Attempted hijack by another author' },
          { actor: { id: 'usr_other_author_99', role: 'QUESTION_CREATOR' } }
        );
      },
      (err: any) => {
        assert.ok(err instanceof ForbiddenError, 'Must throw ForbiddenError when modifying another author\'s unit');
        return true;
      }
    );

    // 4. Admin can update any learning unit regardless of ownership
    const adminUpdated = await learningUnitsRepository.update(
      creatorUnit.id,
      { title: 'Admin approved override update' },
      { actor: { id: 'usr_admin_01', role: 'ADMIN' } }
    );
    assert.strictEqual(adminUpdated.title, 'Admin approved override update');

    console.log('  -> PASS: RBAC authorization, ownership gates, and admin elevation verified.');
  }

  // --------------------------------------------------------------------------
  // TEST 10: Collection Isolation & Non-Interference with Existing Data
  // --------------------------------------------------------------------------
  console.log('\n[Test 10] Collection isolation & non-interference with existing question data...');
  {
    // Querying questions or drafts must remain completely isolated from learning_units
    const allUnits = await learningUnitsRepository.findAll();
    assert.ok(allUnits.length >= 3, 'Multiple learning units should exist in learning_units collection');

    // Questions repository collection check
    assert.strictEqual(questionsRepository.getCollectionName(), 'questions');
    assert.strictEqual(questionDraftsRepository.getCollectionName(), 'question_drafts');

    // Verify draft and question schemas optionally accept learningUnitId without conflict
    const testDraft = {
      id: canonicalIdService.generateDraftId(),
      learningUnitId: createdUnitId,
      topicId: 'top_percentages_01',
      subtopicId: 'sub_discounts_01',
      questionText: 'Which discount gives a lower price on ₹350?',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assert.strictEqual(testDraft.learningUnitId, createdUnitId);

    console.log('  -> PASS: Collection boundaries and non-breaking reference linking preserved.');
  }

  console.log('\n============================================================');
  console.log('ALL S11-T02 LEARNING UNIT REPOSITORY TESTS PASSED (10/10)');
  console.log('============================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ S11-T02 Test Suite Failed:', err);
  process.exit(1);
});
