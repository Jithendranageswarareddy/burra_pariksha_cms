/**
 * BURRA PARIKSHA CMS - Task 3A Content Planning Workflow Verification Suite
 * 
 * Verifies:
 * 1. 4 Core Content Categories (Quantitative Aptitude, Logical Reasoning, Data Interpretation, Verbal Ability)
 * 2. Taxonomy-Based Planning (Category, Topic, Subtopic, Difficulty, Style, Language, Real-World Context, Priority)
 * 3. Administrative Plan Approval Workflow (DRAFT -> APPROVED)
 * 4. Content Batch Production Sprints (PLANNED -> ACTIVE) & Question Linking
 * 5. Lifecycle Progress Tracking (Target vs Actual, Completion %, Production Ready Check)
 * 6. Content Diversity & Jaccard Lexical Similarity Engine (Duplicate Prevention)
 * 7. Curriculum Gap Diagnostics (Zero Coverage, Low Coverage, Difficulty/Language Balance)
 * 8. Durable Google Sheets Persistence (CONTENT_PLANS, CONTENT_BATCHES, AUDIT_LOG, SEQUENCES)
 */

import { planningService } from '../lib/services/planning.service';
import { similarityService } from '../lib/services/similarity.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { idService } from '../lib/services/id.service';
import { contentPlansRepository } from '../lib/repositories/content-plans.repository';
import { contentBatchesRepository } from '../lib/repositories/content-batches.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  ContentBatchStatus,
  ContentPlanStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStyle,
} from '../types';

async function runTask3APlanningVerification() {
  console.log('======================================================================');
  console.log('TASK 3A — BURRA PARIKSHA CONTENT PLANNING WORKFLOW VERIFICATION');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Task 3A Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  const testActor = { id: 'USR-001', name: 'Admin / Content Lead' };

  // ============================================================================
  // STEP 1 — CORE CONTENT CATEGORIES & TAXONOMY INSPECTION
  // ============================================================================
  console.log('--- Step 1: Inspect Core Categories & Taxonomy Structures ---');
  const categories = await taxonomyService.getCategories();
  console.log(`Loaded ${categories.length} categories from Google Sheets.`);

  const requiredCategories = [
    { id: 'CAT-QA', name: 'Quantitative Aptitude' },
    { id: 'CAT-LR', name: 'Logical Reasoning' },
    { id: 'CAT-DI', name: 'Data Interpretation' },
    { id: 'CAT-VA', name: 'Verbal Ability' },
  ];

  for (const rc of requiredCategories) {
    const found = categories.find((c) => c.id === rc.id || c.name.toLowerCase() === rc.name.toLowerCase());
    assert(!!found, `Core Category exists: ${rc.name} (${rc.id})`);
    if (found) {
      const topics = await taxonomyService.getTopics(found.id);
      console.log(`   - Category ${found.name}: ${topics.length} topic(s) configured`);
    }
  }

  // ============================================================================
  // STEP 2 — TAXONOMY-BASED CONTENT PLAN AUTHORING & VALIDATION
  // ============================================================================
  console.log('\n--- Step 2: Taxonomy-Based Content Plan Creation & Invariant Validation ---');

  // Select QA -> Time Speed Distance -> Relative Velocity
  const qaCat = categories.find((c) => c.id === 'CAT-QA')!;
  const qaTopics = await taxonomyService.getTopics(qaCat.id);
  assert(qaTopics.length > 0, `Quantitative Aptitude has configured topics (count: ${qaTopics.length})`);
  const targetTopic = qaTopics[0];

  const qaSubtopics = await taxonomyService.getSubtopics(targetTopic.id);
  assert(qaSubtopics.length > 0, `Topic '${targetTopic.name}' has configured subtopics (count: ${qaSubtopics.length})`);
  const targetSubtopic = qaSubtopics[0];

  console.log(`Targeting Taxonomy: [${qaCat.name}] > [${targetTopic.name}] > [${targetSubtopic.name}]`);

  // 1. Create a well-structured Content Plan
  const planInput = {
    categoryId: qaCat.id,
    topicId: targetTopic.id,
    subtopicId: targetSubtopic.id,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    targetQuestionCount: 12,
    realWorldContext: 'Hyderabad Metro peak hour escalator speed & relative velocity',
    questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
    priority: PriorityLevel.HIGH,
    plannedDate: '2026-09-15',
    notes: 'Task 3A Verification Content Plan for YouTube Shorts Sprint',
  };

  const createdPlan = await planningService.createContentPlan(planInput, testActor);

  assert(!!createdPlan.id && createdPlan.id.startsWith('BP-PLN-'), `Plan created with canonical ID: ${createdPlan.id}`);
  assert(createdPlan.status === ContentPlanStatus.DRAFT, `Initial plan status is DRAFT (was: ${createdPlan.status})`);
  assert(createdPlan.targetQuestionCount === 12, `Target count set to 12 (was: ${createdPlan.targetQuestionCount})`);
  assert(createdPlan.categoryName === qaCat.name, `Enriched category name: ${createdPlan.categoryName}`);
  assert(createdPlan.topicName === targetTopic.name, `Enriched topic name: ${createdPlan.topicName}`);
  assert(createdPlan.subtopicName === targetSubtopic.name, `Enriched subtopic name: ${createdPlan.subtopicName}`);
  assert(createdPlan.questionStyle === QuestionStyle.REAL_WORLD_SCENARIO, `Question style preserved: ${createdPlan.questionStyle}`);

  // 2. Reject Mismatched Taxonomy (Invalid Category-Topic-Subtopic hierarchy)
  let rejectedMismatched = false;
  try {
    await planningService.createContentPlan(
      {
        categoryId: 'CAT-LR', // Mismatched category for QA topic
        topicId: targetTopic.id,
        subtopicId: targetSubtopic.id,
        difficulty: DifficultyLevel.HARD,
        language: QuestionLanguage.ENGLISH,
        priority: PriorityLevel.NORMAL,
        targetQuestionCount: 5,
        plannedDate: '2026-09-20',
      },
      testActor
    );
  } catch (err: any) {
    rejectedMismatched = true;
    console.log(`   - Properly caught invalid hierarchy diagnostic: "${err.message}"`);
  }
  assert(rejectedMismatched, 'PlanningService strictly rejects mismatched category/topic hierarchy');

  // ============================================================================
  // STEP 3 — PLAN UPDATES & HUMAN ADMINISTRATOR APPROVAL
  // ============================================================================
  console.log('\n--- Step 3: Plan Updates & Administrative Approval Flow ---');

  // Update target count
  const updatedPlan = await planningService.updateContentPlan(
    createdPlan.id,
    {
      targetQuestionCount: 15,
      notes: 'Updated target to 15 questions after syllabus review',
    },
    testActor
  );
  assert(updatedPlan.targetQuestionCount === 15, `Updated target count to 15 (was: ${updatedPlan.targetQuestionCount})`);

  // Admin approves the plan
  const approvedPlan = await planningService.approveContentPlan(createdPlan.id, testActor);
  assert(approvedPlan.status === ContentPlanStatus.APPROVED, `Plan transitioned to APPROVED by Admin`);

  // Verify persistence from Google Sheets repository
  const fetchedPlan = await contentPlansRepository.findById(createdPlan.id);
  assert(!!fetchedPlan, `Plan ${createdPlan.id} retrieved from CONTENT_PLANS repository`);
  assert(fetchedPlan?.status === ContentPlanStatus.APPROVED, `Persisted status in Google Sheets is APPROVED`);

  // ============================================================================
  // STEP 4 — PRODUCTION BATCH SPRINT & QUESTION LINKING
  // ============================================================================
  console.log('\n--- Step 4: Content Batch Sprint Creation & Question Association ---');

  const batchInput = {
    name: 'Time & Speed Peak Hour Sprint 01',
    description: 'First production sprint for Hyderabad Metro relative velocity problems',
    planId: approvedPlan.id,
    targetCount: 5,
    priority: PriorityLevel.URGENT,
    plannedDate: '2026-09-18',
    questionIds: [],
  };

  const createdBatch = await planningService.createContentBatch(batchInput, testActor);
  assert(!!createdBatch.id && createdBatch.id.startsWith('BP-BCH-'), `Batch created with canonical ID: ${createdBatch.id}`);
  assert(createdBatch.status === ContentBatchStatus.PLANNED, `Initial batch status is PLANNED`);
  assert(createdBatch.planId === approvedPlan.id, `Batch references plan ID: ${createdBatch.planId}`);

  // Verify plan automatically moved to IN_PROGRESS upon batch creation
  const planAfterBatch = await planningService.getContentPlanById(approvedPlan.id);
  assert(planAfterBatch?.status === ContentPlanStatus.IN_PROGRESS, `Plan automatically transitioned to IN_PROGRESS`);
  assert((planAfterBatch?.createdBatchesCount || 0) >= 1, `Plan reflects linked batch count >= 1`);

  // Link existing production question BP-Q-000003 to the batch
  const existingQuestions = await questionsRepository.findAll();
  const sampleQ = existingQuestions.find((q) => q.id === 'BP-Q-000003') || existingQuestions[0];
  assert(!!sampleQ, `Found question to link: ${sampleQ?.id}`);

  const linkedBatch = await planningService.linkBatchQuestions(
    createdBatch.id,
    [sampleQ.id],
    'ADD',
    testActor
  );
  assert(linkedBatch.questionIds.includes(sampleQ.id), `Question ${sampleQ.id} linked to batch ${createdBatch.id}`);
  assert(linkedBatch.status === ContentBatchStatus.ACTIVE, `Batch automatically moved to ACTIVE upon question linking`);

  // Verify Batch Progress Metrics
  const batchMetrics = await planningService.getBatchProgressMetrics(createdBatch.id);
  assert(batchMetrics.batchId === createdBatch.id, `Metrics computed for batch ${createdBatch.id}`);
  assert(batchMetrics.totalAssociated === 1, `Total associated questions = 1`);
  assert(batchMetrics.targetCount === 5, `Target question count = 5`);
  console.log(`   - Batch Status: ${batchMetrics.status}`);
  console.log(`   - Progress: ${batchMetrics.approved} approved / ${batchMetrics.targetCount} target (${batchMetrics.completionPercentage}%)`);
  console.log(`   - Production Ready: ${batchMetrics.isReadyForProduction}`);

  // ============================================================================
  // STEP 5 — CONTENT DIVERSITY & LEXICAL SIMILARITY ENGINE
  // ============================================================================
  console.log('\n--- Step 5: Content Diversity, Lexical Similarity & Duplicate Detection ---');

  const textA = 'A train 180 meters long passes an electric pole in 9 seconds. Find its speed in km/h.';
  const textB = 'a train 180 meters long passes an electric pole in 9 seconds. find its speed in km/h!';
  const textC = 'Find the compound interest on Rs 10000 for 2 years at 10% per annum compounded annually.';

  const normA = similarityService.normalizeText(textA);
  const normB = similarityService.normalizeText(textB);
  assert(normA === normB, `Text normalization ignores case and punctuation accurately`);

  const simIdentical = similarityService.calculateJaccardSimilarity(textA, textB);
  assert(simIdentical === 1.0, `Exact duplicate detection yields similarity 1.0 (got: ${simIdentical})`);

  const simDistinct = similarityService.calculateJaccardSimilarity(textA, textC);
  assert(simDistinct < 0.2, `Distinct mathematical concepts yield low similarity score: ${simDistinct.toFixed(2)}`);

  // Verify Duplicate Checker across Question Bank
  const matches = await similarityService.findSimilarQuestions(textA, undefined, 0.7);
  console.log(`   - Similarity matches found for test prompt: ${matches.length}`);

  // ============================================================================
  // STEP 6 — TAXONOMY COVERAGE MATRIX & CURRICULUM GAP DIAGNOSTICS
  // ============================================================================
  console.log('\n--- Step 6: Full Taxonomy Coverage Matrix & Gap Analysis ---');

  const coverage = await planningService.getCoverageOverview();
  assert(coverage.totalCategories >= 4, `Coverage matrix includes all core categories (found: ${coverage.totalCategories})`);
  assert(coverage.totalQuestions > 0, `Aggregates active questions across repository (count: ${coverage.totalQuestions})`);
  assert(typeof coverage.overallTaxonomyCoveragePercentage === 'number', `Computes overall taxonomy coverage %`);
  console.log(`   - Overall Taxonomy Coverage: ${coverage.overallTaxonomyCoveragePercentage}%`);
  console.log(`   - Covered Subtopics: ${coverage.coveredSubtopicsCount} / ${coverage.totalSubtopics}`);
  console.log(`   - Zero Coverage Subtopics: ${coverage.zeroCoverageSubtopicsCount}`);

  const gaps = await planningService.getGapAnalysis();
  assert(Array.isArray(gaps.zeroCoverageSubtopics), `Identifies zero-coverage subtopics`);
  assert(Array.isArray(gaps.lowCoverageSubtopics), `Identifies low-coverage subtopics`);
  assert(Array.isArray(gaps.difficultyGaps), `Detects difficulty balance gaps`);
  assert(Array.isArray(gaps.languageGaps), `Detects regional language translation gaps`);
  assert(Array.isArray(gaps.concentrationRisks), `Analyzes topic concentration risks`);
  console.log(`   - Identified ${gaps.zeroCoverageSubtopics.length} zero-coverage syllabus gaps for targeted planning sprints.`);

  // ============================================================================
  // STEP 7 — AUDIT LOG VERIFICATION
  // ============================================================================
  console.log('\n--- Step 7: Workflow Audit Log Trail ---');

  const recentLogs = await auditLogRepository.findAll();
  const planCreatedLog = recentLogs.find((l) => l.entityId === createdPlan.id && l.action === 'CONTENT_PLAN_CREATED');
  const planApprovedLog = recentLogs.find((l) => l.entityId === createdPlan.id && l.action === 'CONTENT_PLAN_APPROVED');
  const batchCreatedLog = recentLogs.find((l) => l.entityId === createdBatch.id && l.action === 'CONTENT_BATCH_CREATED');

  assert(!!planCreatedLog, `Audit log recorded CONTENT_PLAN_CREATED for ${createdPlan.id}`);
  assert(!!planApprovedLog, `Audit log recorded CONTENT_PLAN_APPROVED for ${createdPlan.id}`);
  assert(!!batchCreatedLog, `Audit log recorded CONTENT_BATCH_CREATED for ${createdBatch.id}`);

  // ============================================================================
  // STEP 8 — TEARDOWN & CLEANUP (KEEP TEST ENVIRONMENT CLEAN)
  // ============================================================================
  console.log('\n--- Step 8: Safe Cleanup of Test Planning Records ---');

  // Unlink question and delete batch
  await planningService.linkBatchQuestions(createdBatch.id, [sampleQ.id], 'REMOVE', testActor);
  const deletedBatch = await planningService.deleteContentBatch(createdBatch.id, testActor);
  console.log(`   - Cleaned up test batch ${createdBatch.id}: ${deletedBatch}`);

  // Delete test plan
  const deletedPlan = await planningService.deleteContentPlan(createdPlan.id, testActor);
  console.log(`   - Cleaned up test content plan ${createdPlan.id}: ${deletedPlan}`);

  console.log('\n======================================================================');
  console.log(`TASK 3A VERIFICATION COMPLETE — All ${passedTests}/${totalTests} Tests Passed!`);
  console.log('======================================================================\n');
}

runTask3APlanningVerification().catch((err) => {
  console.error('❌ Task 3A Verification failed:', err);
  process.exit(1);
});
