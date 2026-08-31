/**
 * BURRA PARIKSHA CMS - PHASE 9 VERIFICATION TEST SUITE
 * Content Planning, Batch Management & Question Intelligence
 * 
 * Verifies end-to-end functionality for:
 * 1. Content Planning CRUD, ID Allocation, and Taxonomy Integrity
 * 2. Administrative Plan Approval Workflow
 * 3. Content Batch Production Sprints and Progress Metrics
 * 4. Question Linking and Multi-Stage Batch Progress Tracking
 * 5. Full Taxonomy Coverage Intelligence & Aggregations
 * 6. Curriculum Gap Analysis (Zero-Coverage, Low-Coverage, Difficulty/Language Gaps)
 * 7. Duplicate Detection & Jaccard Lexical Similarity Engine
 * 8. Question Bank Diversity Radar Diagnostics
 * 9. Gemini AI Content Planning Assistant & Advisory Proposals
 * 10. Operational Audit Logging for all Planning & Batch Actions
 */

import { planningService } from '../lib/services/planning.service';
import { similarityService } from '../lib/services/similarity.service';
import { geminiService } from '../lib/ai/gemini.service';
import { idService } from '../lib/services/id.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { questionService } from '../lib/services/question.service';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { contentPlansRepository } from '../lib/repositories/content-plans.repository';
import { contentBatchesRepository } from '../lib/repositories/content-batches.repository';
import {
  ContentBatchStatus,
  ContentPlanStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
} from '../types';

export async function runPhase9Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 9 VERIFICATION SUITE');
  console.log('Content Planning, Batch Management & Question Intelligence');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 9 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  const testActor = { id: 'USR-001', name: 'Test Administrator / Content Lead' };

  // ============================================================================
  // SECTION 1: ID GENERATION & SEQUENCE INVARIANTS
  // ============================================================================
  console.log('\n--- Section 1: ID Allocation & Sequence Invariants ---');

  const planId1 = await idService.allocateContentPlanId();
  const planId2 = await idService.allocateContentPlanId();
  assert(planId1.startsWith('BP-PLN-'), `Content Plan ID has BP-PLN- prefix: ${planId1}`);
  assert(planId2.startsWith('BP-PLN-'), `Second Content Plan ID has BP-PLN- prefix: ${planId2}`);
  assert(planId1 !== planId2, `Allocated Plan IDs are strictly unique: ${planId1} vs ${planId2}`);

  const batchId1 = await idService.allocateContentBatchId();
  const batchId2 = await idService.allocateContentBatchId();
  assert(batchId1.startsWith('BP-BCH-'), `Content Batch ID has BP-BCH- prefix: ${batchId1}`);
  assert(batchId2.startsWith('BP-BCH-'), `Second Content Batch ID has BP-BCH- prefix: ${batchId2}`);
  assert(batchId1 !== batchId2, `Allocated Batch IDs are strictly unique: ${batchId1} vs ${batchId2}`);

  // ============================================================================
  // SECTION 2: CONTENT PLAN CREATION & TAXONOMY INTEGRITY
  // ============================================================================
  console.log('\n--- Section 2: Content Plan Creation & Taxonomy Integrity ---');

  const categories = await taxonomyService.getCategories();
  assert(categories.length > 0, `Taxonomy categories loaded (count: ${categories.length})`);
  const targetCategory = categories[0];

  const topics = await taxonomyService.getTopics(targetCategory.id);
  assert(topics.length > 0, `Topics found for category ${targetCategory.name}`);
  const targetTopic = topics[0];

  const subtopics = await taxonomyService.getSubtopics(targetTopic.id);
  assert(subtopics.length > 0, `Subtopics found for topic ${targetTopic.name}`);
  const targetSubtopic = subtopics[0];

  // 1. Create Valid Content Plan
  const createdPlan = await planningService.createContentPlan(
    {
      categoryId: targetCategory.id,
      topicId: targetTopic.id,
      subtopicId: targetSubtopic.id,
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.ENGLISH,
      targetQuestionCount: 15,
      realWorldContext: 'Supermarket billing & retail discounts',
      questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
      priority: PriorityLevel.HIGH,
      plannedDate: '2026-09-01',
      notes: 'Strategic sprint for Q3 exam cycle',
    },
    testActor
  );

  assert(!!createdPlan.id && createdPlan.id.startsWith('BP-PLN-'), `Created plan has valid ID: ${createdPlan.id}`);
  assert(createdPlan.status === ContentPlanStatus.DRAFT, `Initial plan status is DRAFT (was: ${createdPlan.status})`);
  assert(createdPlan.targetQuestionCount === 15, `Target question count is 15 (was: ${createdPlan.targetQuestionCount})`);
  assert(createdPlan.categoryName === targetCategory.name, `Plan has enriched category name: ${createdPlan.categoryName}`);
  assert(createdPlan.topicName === targetTopic.name, `Plan has enriched topic name: ${createdPlan.topicName}`);

  // 2. Reject Mismatched Taxonomy Hierarchy
  let taxonomyErrorThrown = false;
  try {
    const anotherCat = categories.length > 1 ? categories[1] : { id: 'CAT-OTHER', name: 'Other Category' };
    await planningService.createContentPlan(
      {
        categoryId: anotherCat.id,
        topicId: targetTopic.id, // Mismatched topic belonging to targetCategory, not anotherCat
        subtopicId: targetSubtopic.id,
        difficulty: DifficultyLevel.HARD,
        language: QuestionLanguage.ENGLISH,
        priority: PriorityLevel.HIGH,
        targetQuestionCount: 10,
        plannedDate: '2026-09-02',
      },
      testActor
    );
  } catch (err: any) {
    taxonomyErrorThrown = true;
    assert(
      err.message.includes('Taxonomy') || err.message.includes('belongs to') || err.message.includes('does not exist'),
      `Rejects invalid Category-Topic hierarchy with clear diagnostic: ${err.message}`
    );
  }
  assert(taxonomyErrorThrown, 'Mismatched taxonomy properly rejected during plan creation');

  // ============================================================================
  // SECTION 3: PLAN UPDATES & ADMINISTRATIVE APPROVAL
  // ============================================================================
  console.log('\n--- Section 3: Plan Updates & Administrative Approval ---');

  const updatedPlan = await planningService.updateContentPlan(
    createdPlan.id,
    {
      targetQuestionCount: 20,
      notes: 'Updated target from 15 to 20 per syllabus review',
    },
    testActor
  );
  assert(updatedPlan.targetQuestionCount === 20, `Target updated to 20 (was: ${updatedPlan.targetQuestionCount})`);

  // Administrator explicitly approves the plan
  const approvedPlan = await planningService.approveContentPlan(createdPlan.id, testActor);
  assert(approvedPlan.status === ContentPlanStatus.APPROVED, `Plan status transitioned to APPROVED by Admin`);

  // ============================================================================
  // SECTION 4: PRODUCTION BATCHES & LIFECYCLE MANAGEMENT
  // ============================================================================
  console.log('\n--- Section 4: Production Batches & Lifecycle Management ---');

  const createdBatch = await planningService.createContentBatch(
    {
      name: `${targetTopic.name} Sprint 1 - High Priority`,
      description: 'First production batch for approved plan',
      planId: approvedPlan.id,
      targetCount: 10,
      priority: PriorityLevel.URGENT,
      plannedDate: '2026-09-05',
      questionIds: [],
    },
    testActor
  );

  assert(!!createdBatch.id && createdBatch.id.startsWith('BP-BCH-'), `Batch has valid ID: ${createdBatch.id}`);
  assert(createdBatch.status === ContentBatchStatus.PLANNED, `Initial batch status is PLANNED`);
  assert(createdBatch.planId === approvedPlan.id, `Batch correctly references plan: ${createdBatch.planId}`);

  // Check that creating a batch against an APPROVED plan transitioned the plan to IN_PROGRESS
  const refreshedPlan = await planningService.getContentPlanById(approvedPlan.id);
  assert(refreshedPlan?.status === ContentPlanStatus.IN_PROGRESS, `Plan automatically transitioned to IN_PROGRESS upon batch creation`);
  assert((refreshedPlan?.createdBatchesCount || 0) >= 1, `Plan reflects created batch count: ${refreshedPlan?.createdBatchesCount}`);

  // ============================================================================
  // SECTION 5: QUESTION ASSOCIATION & BATCH PROGRESS METRICS
  // ============================================================================
  console.log('\n--- Section 5: Question Association & Batch Progress Metrics ---');

  // Create two real test questions to associate with the batch
  const testQ1 = await questionService.createQuestion({
    categoryId: targetCategory.id,
    topicId: targetTopic.id,
    subtopicId: targetSubtopic.id,
    difficulty: DifficultyLevel.MEDIUM,
    questionText: `Phase 9 Batch Test Question Alpha: A dealer marks his goods 25% above cost price and allows 10% discount. What is his profit percentage?`,
    options: {
      a: '12.5%',
      b: '15%',
      c: '10%',
      d: '18%',
    },
    correctAnswer: 'A',
    explanation: 'Let CP = 100. MP = 125. SP = 125 * 0.9 = 112.5. Profit = 12.5%.',
  });

  const testQ2 = await questionService.createQuestion({
    categoryId: targetCategory.id,
    topicId: targetTopic.id,
    subtopicId: targetSubtopic.id,
    difficulty: DifficultyLevel.MEDIUM,
    questionText: `Phase 9 Batch Test Question Beta: A shopkeeper sells two articles for Rs 990 each, making 10% profit on one and 10% loss on another. What is the net outcome?`,
    options: {
      a: '1% loss',
      b: '1% gain',
      c: 'No profit no loss',
      d: '2% loss',
    },
    correctAnswer: 'A',
    explanation: 'Common loss percentage = (x / 10)^2 = (10 / 10)^2 = 1% loss.',
  });

  // Link questions to batch
  const linkedBatch = await planningService.linkBatchQuestions(
    createdBatch.id,
    [testQ1.id, testQ2.id],
    'ADD',
    testActor
  );
  assert(linkedBatch.questionIds.length === 2, `Batch has 2 linked questions (was: ${linkedBatch.questionIds.length})`);
  assert(linkedBatch.status === ContentBatchStatus.ACTIVE, `Batch transitioned to ACTIVE upon linking questions`);

  // Compute progress metrics
  const batchMetrics = await planningService.getBatchProgressMetrics(createdBatch.id);
  assert(batchMetrics.totalAssociated === 2, `Metrics reflect 2 associated questions`);
  assert(batchMetrics.targetCount === 10, `Target count is 10`);
  assert(batchMetrics.remainingToApprove === 10, `Remaining to approve is 10 (test questions in DRAFT)`);
  assert(batchMetrics.completionPercentage === 0, `0% approved questions initially`);
  assert(!batchMetrics.isReadyForProduction, `Batch is not yet ready for production (needs 10 approved)`);

  // Approve one test question and re-check metrics
  await questionService.updateQuestion(testQ1.id, { status: QuestionStatus.APPROVED }, testActor);
  const updatedMetrics = await planningService.getBatchProgressMetrics(createdBatch.id);
  assert(updatedMetrics.approved === 1, `Approved count updated to 1`);
  assert(updatedMetrics.remainingToApprove === 9, `Remaining to approve is now 9 (10 - 1)`);
  assert(updatedMetrics.completionPercentage === 10, `Completion percentage is 10% (1/10)`);

  // ============================================================================
  // SECTION 6: TAXONOMY COVERAGE INTELLIGENCE
  // ============================================================================
  console.log('\n--- Section 6: Taxonomy Coverage Intelligence ---');

  const coverage = await planningService.getCoverageOverview();
  assert(coverage.totalCategories > 0, `Coverage overview includes categories (count: ${coverage.totalCategories})`);
  assert(coverage.totalTopics > 0, `Coverage overview includes topics (count: ${coverage.totalTopics})`);
  assert(coverage.totalSubtopics > 0, `Coverage overview includes subtopics (count: ${coverage.totalSubtopics})`);
  assert(coverage.totalQuestions >= 2, `Coverage aggregates all questions in library (total: ${coverage.totalQuestions})`);
  assert(coverage.overallTaxonomyCoveragePercentage >= 0 && coverage.overallTaxonomyCoveragePercentage <= 100, `Overall coverage % is bounded [0, 100]: ${coverage.overallTaxonomyCoveragePercentage}%`);
  assert(typeof coverage.byDifficulty.easy === 'number', `Difficulty breakdown includes Easy count`);
  assert(typeof coverage.byDifficulty.medium === 'number', `Difficulty breakdown includes Medium count`);
  assert(typeof coverage.byDifficulty.hard === 'number', `Difficulty breakdown includes Hard count`);
  assert(typeof coverage.byLanguage.english === 'number', `Language breakdown includes English count`);

  // ============================================================================
  // SECTION 7: CURRICULUM GAP ANALYSIS
  // ============================================================================
  console.log('\n--- Section 7: Curriculum Gap Analysis ---');

  const gaps = await planningService.getGapAnalysis();
  assert(Array.isArray(gaps.zeroCoverageSubtopics), `Gap analysis lists zero-coverage subtopics`);
  assert(Array.isArray(gaps.lowCoverageSubtopics), `Gap analysis lists low-coverage subtopics`);
  assert(Array.isArray(gaps.difficultyGaps), `Gap analysis lists difficulty balance gaps`);
  assert(Array.isArray(gaps.languageGaps), `Gap analysis lists regional language gaps`);
  assert(Array.isArray(gaps.concentrationRisks), `Gap analysis detects topic concentration risks`);

  // ============================================================================
  // SECTION 8: SIMILARITY, DUPLICATE DETECTION & RADAR
  // ============================================================================
  console.log('\n--- Section 8: Similarity & Diversity Intelligence ---');

  const normA = similarityService.normalizeText('A train 150m long travels at 60 km/h!');
  const normB = similarityService.normalizeText('a train 150m long travels at 60 km/h.');
  assert(normA === normB, `Text normalization ignores case and punctuation: '${normA}' === '${normB}'`);

  const simIdentical = similarityService.calculateJaccardSimilarity(
    'A train 150 meters long crosses a bridge in 15 seconds',
    'A train 150 meters long crosses a bridge in 15 seconds'
  );
  assert(simIdentical === 1.0, `Jaccard similarity for identical strings is 1.0 (was: ${simIdentical})`);

  const simDifferent = similarityService.calculateJaccardSimilarity(
    'A train crosses a bridge',
    'Profit and loss discount calculation on supermarket goods'
  );
  assert(simDifferent < 0.2, `Jaccard similarity for completely distinct topics is low (< 0.2, was: ${simDifferent})`);

  // Test duplicate detection against live library
  const dupCheck = await similarityService.findSimilarQuestions(
    `Phase 9 Batch Test Question Alpha: A dealer marks his goods 25% above cost price and allows 10% discount. What is his profit percentage?`
  );
  assert(dupCheck.length > 0, `Similarity engine detected exact match with test question`);
  assert(dupCheck[0].type === 'EXACT_DUPLICATE', `Match type is EXACT_DUPLICATE`);
  assert(dupCheck[0].similarityScore === 1.0, `Match score is 1.0`);

  // Diversity Radar scan across entire bank
  const radarReport = await similarityService.generateDiversityRadarReport();
  assert(radarReport.scannedQuestionsCount >= 2, `Radar scanned full question bank (count: ${radarReport.scannedQuestionsCount})`);
  assert(typeof radarReport.healthScore === 'number' && radarReport.healthScore >= 0 && radarReport.healthScore <= 100, `Health score is valid: ${radarReport.healthScore}`);
  assert(Array.isArray(radarReport.diversityWarnings), `Radar produces structured diversity warnings`);

  // ============================================================================
  // SECTION 9: AI CONTENT PLANNING ASSISTANT (GEMINI)
  // ============================================================================
  console.log('\n--- Section 9: AI Content Planning Assistant (Gemini) ---');

  const aiRecommendation = await geminiService.generateContentPlanRecommendation({
    categoryId: targetCategory.id,
    topicId: targetTopic.id,
    targetTotalCount: 20,
    language: QuestionLanguage.ENGLISH,
  });

  assert(aiRecommendation.isAiGenerated === true, `Recommendation marked as AI generated`);
  assert(aiRecommendation.categoryId === targetCategory.id, `Recommendation matches requested category`);
  assert(aiRecommendation.targetTotalCount === 20, `Recommendation matches target count of 20`);
  assert(aiRecommendation.recommendedDistribution.length > 0, `Recommendation contains subtopic distribution breakdown`);
  assert(aiRecommendation.suggestedBatchGrouping.length > 0, `Recommendation suggests logical sprint batch groupings`);
  assert(!!aiRecommendation.pedagogicalRationale, `Recommendation includes pedagogical rationale: ${aiRecommendation.pedagogicalRationale.slice(0, 50)}...`);

  // Verify that AI recommendation did NOT automatically create records in the database
  const plansAfterAi = await contentPlansRepository.findAll();
  const autoCreatedPlan = plansAfterAi.find((p) => p.notes === aiRecommendation.pedagogicalRationale);
  assert(!autoCreatedPlan, `Human Authority Safeguard: AI recommendation did NOT auto-create plans in database`);

  // ============================================================================
  // SECTION 10: AUDIT TRAIL VERIFICATION
  // ============================================================================
  console.log('\n--- Section 10: Operational Audit Trail Verification ---');

  const auditLogs = await auditLogRepository.findAll();
  const planCreatedLog = auditLogs.find((l) => l.action === 'CONTENT_PLAN_CREATED' && l.entityId === createdPlan.id);
  assert(!!planCreatedLog, `Audit log recorded CONTENT_PLAN_CREATED for ${createdPlan.id}`);

  const planApprovedLog = auditLogs.find((l) => l.action === 'CONTENT_PLAN_APPROVED' && l.entityId === createdPlan.id);
  assert(!!planApprovedLog, `Audit log recorded CONTENT_PLAN_APPROVED for ${createdPlan.id}`);

  const batchCreatedLog = auditLogs.find((l) => l.action === 'CONTENT_BATCH_CREATED' && l.entityId === createdBatch.id);
  assert(!!batchCreatedLog, `Audit log recorded CONTENT_BATCH_CREATED for ${createdBatch.id}`);

  const batchLinkedLog = auditLogs.find((l) => l.action === 'CONTENT_BATCH_QUESTIONS_LINKED' && l.entityId === createdBatch.id);
  assert(!!batchLinkedLog, `Audit log recorded CONTENT_BATCH_QUESTIONS_LINKED for ${createdBatch.id}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n====================================================');
  console.log(`PHASE 9 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  return {
    passed: passedTests,
    total: totalTests,
    status: 'ALL_TESTS_PASSED',
  };
}
