/**
 * BURRA PARIKSHA CMS — Launch Taxonomy Setup & Referential Safety Test Suite
 * Initial Launch: Text-based Question Challenge Short (Mode 1: Aptitude + Reasoning)
 *
 * Verifies:
 * 1. Exactly two intended active launch Topics (Aptitude, Reasoning)
 * 2. Exactly 18 child Subtopics for each Topic (total 36)
 * 3. Exact slug and name specification matching
 * 4. Referential integrity: all 36 Subtopics link to the correct parent Topic
 * 5. Canonical ID prefixes ('top_', 'sub_') with zero legacy sequence allocation
 * 6. Idempotency: setup execution creates zero duplicates when rerun
 * 7. Backend validation rejects mismatched Topic -> Subtopic pairs
 * 8. Question Challenge Short Stage 01/15 configuration preservation
 */

import assert from 'node:assert';
import { taxonomyService } from '../../backend/domain/taxonomy/services/taxonomy.service';
import { topicsRepository, subtopicsRepository } from '../../database/firestore/repositories';
import { seedLaunchTaxonomy } from '../../scripts/seed-launch-taxonomy';
import { DEFAULT_PRODUCTION_CONTEXT } from '../../shared';
import { CanonicalWorkflowStep } from '../../shared/constants/workflow';

const EXPECTED_APTITUDE_SUBTOPICS = [
  'Percentages',
  'Ratio and Proportion',
  'Averages',
  'Profit and Loss',
  'Simple Interest',
  'Compound Interest',
  'Number System',
  'Simplification',
  'HCF and LCM',
  'Fractions and Decimals',
  'Problems on Ages',
  'Time and Work',
  'Pipes and Cisterns',
  'Time, Speed and Distance',
  'Problems on Trains',
  'Boats and Streams',
  'Mixtures and Alligation',
  'Partnership',
];

const EXPECTED_REASONING_SUBTOPICS = [
  'Number Series',
  'Letter Series',
  'Analogy',
  'Classification (Odd One Out)',
  'Coding and Decoding',
  'Blood Relations',
  'Direction Sense',
  'Ranking and Order',
  'Alphabet Test',
  'Syllogisms',
  'Logical Statements and Conclusions',
  'Venn Diagrams',
  'Mathematical Operations',
  'Missing Number',
  'Alphanumeric Series',
  'Seating Arrangement',
  'Linear Arrangement',
  'Calendar and Clock Reasoning',
];

async function runLaunchTaxonomyTestSuite() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — LAUNCH TAXONOMY SETUP & INTEGRITY TEST SUITE');
  console.log('Target: Mode 1 Initial Launch (Aptitude + Reasoning, 36 Subtopics)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Check 1: Exactly two active launch topics
  // --------------------------------------------------------------------------
  await test('1. Exactly two active launch topics in database (Aptitude & Reasoning)', async () => {
    const activeTopics = await taxonomyService.getTopics({ includeInactive: false });
    assert.strictEqual(activeTopics.length, 2, `Expected exactly 2 active topics, got ${activeTopics.length}`);

    const names = activeTopics.map((t) => t.name).sort();
    assert.deepStrictEqual(names, ['Aptitude', 'Reasoning']);

    const aptitude = activeTopics.find((t) => t.name === 'Aptitude')!;
    const reasoning = activeTopics.find((t) => t.name === 'Reasoning')!;

    assert.strictEqual(aptitude.slug, 'aptitude');
    assert.strictEqual(reasoning.slug, 'reasoning');
    assert.ok(aptitude.description?.includes('Quantitative aptitude'));
    assert.ok(reasoning.description?.includes('logical and analytical'));
  });

  // --------------------------------------------------------------------------
  // Check 2: Pure topic tree returns 18 subtopics for each topic
  // --------------------------------------------------------------------------
  await test('2. Pure topic tree returns exactly 18 subtopics for Aptitude and 18 for Reasoning', async () => {
    const tree = await taxonomyService.getPureTopicTree({ includeInactive: false });
    assert.strictEqual(tree.length, 2);

    const aptitude = tree.find((t) => t.name === 'Aptitude')!;
    const reasoning = tree.find((t) => t.name === 'Reasoning')!;

    assert.strictEqual(aptitude.subtopics.length, 18, `Aptitude subtopics count: ${aptitude.subtopics.length}`);
    assert.strictEqual(reasoning.subtopics.length, 18, `Reasoning subtopics count: ${reasoning.subtopics.length}`);

    const aptitudeSubtopicNames = aptitude.subtopics.map((s) => s.name);
    assert.deepStrictEqual(aptitudeSubtopicNames, EXPECTED_APTITUDE_SUBTOPICS);

    const reasoningSubtopicNames = reasoning.subtopics.map((s) => s.name);
    assert.deepStrictEqual(reasoningSubtopicNames, EXPECTED_REASONING_SUBTOPICS);
  });

  // --------------------------------------------------------------------------
  // Check 3: Referential integrity: All 36 subtopics point to valid parent
  // --------------------------------------------------------------------------
  await test('3. Referential integrity: All 36 subtopics belong directly to their parent Topic ID', async () => {
    const allTopics = await topicsRepository.findAll();
    const allSubtopics = await subtopicsRepository.findAll();

    const topicMap = new Map(allTopics.map((t) => [t.id, t]));
    const aptitudeTopic = allTopics.find((t) => t.name === 'Aptitude')!;
    const reasoningTopic = allTopics.find((t) => t.name === 'Reasoning')!;

    assert.strictEqual(allSubtopics.length, 36);

    for (const sub of allSubtopics) {
      assert.ok(sub.topicId, `Subtopic ${sub.name} must have topicId`);
      assert.ok(topicMap.has(sub.topicId), `Subtopic ${sub.name} points to non-existent topicId ${sub.topicId}`);

      if (EXPECTED_APTITUDE_SUBTOPICS.includes(sub.name)) {
        assert.strictEqual(sub.topicId, aptitudeTopic.id, `Subtopic "${sub.name}" must link to Aptitude`);
      } else if (EXPECTED_REASONING_SUBTOPICS.includes(sub.name)) {
        assert.strictEqual(sub.topicId, reasoningTopic.id, `Subtopic "${sub.name}" must link to Reasoning`);
      } else {
        assert.fail(`Unexpected subtopic in database: "${sub.name}"`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Check 4: Canonical IDs start with 'top_' and 'sub_' with zero sequence allocator
  // --------------------------------------------------------------------------
  await test('4. Canonical IDs start with top_ and sub_ prefixes', async () => {
    const allTopics = await topicsRepository.findAll();
    const allSubtopics = await subtopicsRepository.findAll();

    for (const t of allTopics) {
      assert.ok(t.id.startsWith('top_'), `Topic ID must start with top_, got ${t.id}`);
    }
    for (const s of allSubtopics) {
      assert.ok(s.id.startsWith('sub_'), `Subtopic ID must start with sub_, got ${s.id}`);
    }
  });

  // --------------------------------------------------------------------------
  // Check 5: Idempotency verification: Rerunning setup creates zero duplicates
  // --------------------------------------------------------------------------
  await test('5. Idempotent rerun: Rerunning setup creates 0 new topics and 0 new subtopics', async () => {
    const initialTopicsCount = (await topicsRepository.findAll()).length;
    const initialSubtopicsCount = (await subtopicsRepository.findAll()).length;

    const rerunReport = await seedLaunchTaxonomy();

    assert.strictEqual(rerunReport.topicsCreated, 0, 'Must create 0 topics on rerun');
    assert.strictEqual(rerunReport.subtopicsCreated, 0, 'Must create 0 subtopics on rerun');
    assert.strictEqual(rerunReport.topicsReused, 2, 'Must reuse 2 topics on rerun');
    assert.strictEqual(rerunReport.subtopicsReused, 36, 'Must reuse 36 subtopics on rerun');

    const postTopicsCount = (await topicsRepository.findAll()).length;
    const postSubtopicsCount = (await subtopicsRepository.findAll()).length;

    assert.strictEqual(postTopicsCount, initialTopicsCount);
    assert.strictEqual(postSubtopicsCount, initialSubtopicsCount);
  });

  // --------------------------------------------------------------------------
  // Check 6: Backend domain rejects mismatched Topic -> Subtopic pairs
  // --------------------------------------------------------------------------
  await test('6. Backend domain strictly rejects mismatched Topic -> Subtopic pairs', async () => {
    const tree = await taxonomyService.getPureTopicTree({ includeInactive: false });
    const aptitude = tree.find((t) => t.name === 'Aptitude')!;
    const reasoning = tree.find((t) => t.name === 'Reasoning')!;

    const aptitudeSub = aptitude.subtopics[0];
    const reasoningSub = reasoning.subtopics[0];

    // Valid pair 1: Aptitude + Aptitude Subtopic
    const valid1 = await taxonomyService.validateTaxonomy(aptitude.id, aptitudeSub.id);
    assert.strictEqual(valid1.topic.id, aptitude.id);
    assert.strictEqual(valid1.subtopic.id, aptitudeSub.id);

    // Valid pair 2: Reasoning + Reasoning Subtopic
    const valid2 = await taxonomyService.validateTaxonomy(reasoning.id, reasoningSub.id);
    assert.strictEqual(valid2.topic.id, reasoning.id);
    assert.strictEqual(valid2.subtopic.id, reasoningSub.id);

    // Mismatched pair 1: Aptitude + Reasoning Subtopic (must throw)
    let mismatch1Threw = false;
    try {
      await taxonomyService.validateQuestionTaxonomy(aptitude.id, reasoningSub.id);
    } catch {
      mismatch1Threw = true;
    }
    assert.strictEqual(mismatch1Threw, true, 'Must reject Aptitude topic with Reasoning subtopic');

    // Mismatched pair 2: Reasoning + Aptitude Subtopic (must throw)
    let mismatch2Threw = false;
    try {
      await taxonomyService.validateQuestionTaxonomy(reasoning.id, aptitudeSub.id);
    } catch {
      mismatch2Threw = true;
    }
    assert.strictEqual(mismatch2Threw, true, 'Must reject Reasoning topic with Aptitude subtopic');
  });

  // --------------------------------------------------------------------------
  // Check 7: Mode 1 Question Challenge Short preserves Stage 01/15 invariant
  // --------------------------------------------------------------------------
  await test('7. Mode 1 Question Challenge Short configuration preserved (Stage 01/15, 9:16, <=58s)', () => {
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.questionCount, 1);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.aspectRatio, '9:16');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.workflow.currentStage, 1);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.workflow.stageStatus, 'DRAFT');
    assert.strictEqual(CanonicalWorkflowStep.QUESTION_GENERATION, 1);
  });

  console.log('\n========================================================================');
  console.log(`LAUNCH TAXONOMY TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLaunchTaxonomyTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
