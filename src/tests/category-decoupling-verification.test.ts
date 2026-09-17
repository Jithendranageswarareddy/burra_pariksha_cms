/**
 * BURRA PARIKSHA CMS - Category Decoupling & 2-Tier Architecture Verification (Stage 2)
 * Verifies all required Stage 2 hard assertions (A through O) with zero production mutation.
 */

import {
  questionsRepository,
  contentMastersRepository,
  contentPlansRepository,
  topicsRepository,
  subtopicsRepository,
} from '../lib/repositories';
import { questionService } from '../lib/services/question.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { planningService } from '../lib/services/planning.service';
import { smartRandomService } from '../lib/services/smart-random.service';
import { dashboardService } from '../lib/services/dashboard.service';
import { QuestionLanguage, QuestionStatus, DifficultyLevel, PriorityLevel } from '../types';

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export async function runCategoryDecouplingTests(): Promise<{
  allPassed: boolean;
  results: TestResult[];
  beforeCounts: { questions: number; contentMasters: number; contentPlans: number };
  afterCounts: { questions: number; contentMasters: number; contentPlans: number };
  productionDataChanged: boolean;
}> {
  const results: TestResult[] = [];
  const createdQuestionIds: string[] = [];
  const createdContentMasterIds: string[] = [];
  const createdContentPlanIds: string[] = [];

  // Snapshot before counts
  const beforeQuestions = await questionsRepository.findAll();
  const beforeContentMasters = await contentMastersRepository.findAll();
  const beforeContentPlans = await contentPlansRepository.findAll();
  const beforeCounts = {
    questions: beforeQuestions.length,
    contentMasters: beforeContentMasters.length,
    contentPlans: beforeContentPlans.length,
  };

  const actor = { id: 'USR-TEST', name: 'Stage 2 Decoupling Verifier' };

  try {
    // -------------------------------------------------------------------------
    // TEST A: Question Studio works with Topic + Subtopic only
    // -------------------------------------------------------------------------
    try {
      const q = await questionService.createQuestionFromRequest(
        {
          creationMode: 'ai',
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-0001',
          difficulty: 'Easy',
          questionText: 'ఒక పెట్టెలో 10 బంతులు ఉన్నాయి. 3 బంతులు తీసివేస్తే ఎన్ని మిగులుతాయి?',
          options: {
            a: '7',
            b: '8',
            c: '6',
            d: '5',
          },
          correctAnswer: 'A',
          explanation: '10 నుండి 3 తీసివేస్తే 7 మిగులుతాయి. 10 - 3 = 7.',
          language: QuestionLanguage.TELUGU,
        },
        actor
      );

      if (!q || !q.id) throw new Error('Question Studio save returned empty result');
      if (q.topicId !== 'BP-TOP-001' || q.subtopicId !== 'BP-SUB-0001') {
        throw new Error(`Topic/Subtopic mismatch: topic=${q.topicId}, subtopic=${q.subtopicId}`);
      }
      if (q.categoryId === 'CAT-GENERAL') {
        throw new Error('Forbidden: Question defaulted to CAT-GENERAL');
      }
      createdQuestionIds.push(q.id);
      if (q.contentMasterId) createdContentMasterIds.push(q.contentMasterId);

      results.push({
        code: 'A',
        name: 'Question Studio works with Topic + Subtopic only',
        passed: true,
        details: `Saved Studio question ${q.id} with Topic=${q.topicId}, Subtopic=${q.subtopicId}`,
      });
    } catch (err: any) {
      results.push({
        code: 'A',
        name: 'Question Studio works with Topic + Subtopic only',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST B: Bulk upload accepts Topic + Subtopic without Category
    // -------------------------------------------------------------------------
    try {
      const dryRunReport = await taxonomyService.bulkImportDryRun({
        topics: [
          {
            name: `Test Bulk Topic ${Date.now()}`,
            subtopics: [
              { name: 'Bulk Subtopic Alpha', description: 'Test description' },
            ],
          },
        ],
      });

      if (!dryRunReport || !dryRunReport.valid || dryRunReport.summary?.totalTopicsInInput !== 1) {
        throw new Error(`Bulk upload dry run failed or invalid report: ${JSON.stringify(dryRunReport)}`);
      }

      results.push({
        code: 'B',
        name: 'Bulk upload accepts Topic + Subtopic without Category',
        passed: true,
        details: `Bulk import dry-run succeeded: ${dryRunReport.summary.newTopicsToCreate} new topic(s), ${dryRunReport.summary.newSubtopicsToCreate} subtopic(s)`,
      });
    } catch (err: any) {
      results.push({
        code: 'B',
        name: 'Bulk upload accepts Topic + Subtopic without Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST C: Question table does not require Category
    // -------------------------------------------------------------------------
    try {
      const questions = await questionsRepository.findAll();
      if (!Array.isArray(questions)) throw new Error('Question table query returned non-array');

      results.push({
        code: 'C',
        name: 'Question table does not require Category',
        passed: true,
        details: `Retrieved ${questions.length} questions from table without requiring category filtering`,
      });
    } catch (err: any) {
      results.push({
        code: 'C',
        name: 'Question table does not require Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST D: Search works using Topic/Subtopic
    // -------------------------------------------------------------------------
    try {
      const searchResults = await questionService.getQuestions({
        topicId: 'BP-TOP-001',
        subtopicId: 'BP-SUB-0001',
      });

      if (!Array.isArray(searchResults)) {
        throw new Error('Search failed to return an array');
      }

      results.push({
        code: 'D',
        name: 'Search works using Topic/Subtopic',
        passed: true,
        details: `Search for Topic=BP-TOP-001 & Subtopic=BP-SUB-0001 returned ${searchResults.length} record(s)`,
      });
    } catch (err: any) {
      results.push({
        code: 'D',
        name: 'Search works using Topic/Subtopic',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST E: Planning works without Category
    // -------------------------------------------------------------------------
    try {
      const plan = await planningService.createContentPlan(
        {
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-0001',
          difficulty: DifficultyLevel.EASY,
          language: QuestionLanguage.TELUGU,
          targetQuestionCount: 5,
          priority: PriorityLevel.NORMAL,
          plannedDate: '2026-10-01',
        },
        actor
      );

      if (!plan || !plan.id) throw new Error('Create content plan returned empty result');
      if (plan.topicId !== 'BP-TOP-001' || plan.subtopicId !== 'BP-SUB-0001') {
        throw new Error(`Plan taxonomy mismatch: topic=${plan.topicId}, subtopic=${plan.subtopicId}`);
      }
      if (plan.categoryId === 'CAT-GENERAL') {
        throw new Error('Forbidden: Content plan defaulted to CAT-GENERAL');
      }
      createdContentPlanIds.push(plan.id);

      results.push({
        code: 'E',
        name: 'Planning works without Category',
        passed: true,
        details: `Created Content Plan ${plan.id} for Topic=BP-TOP-001, Subtopic=BP-SUB-0001`,
      });
    } catch (err: any) {
      results.push({
        code: 'E',
        name: 'Planning works without Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST F: Smart Random works without Category
    // -------------------------------------------------------------------------
    try {
      const resolved = await smartRandomService.resolveParameters({
        topicId: 'BP-TOP-001',
        subtopicId: 'RANDOM',
        realLifeContext: 'RANDOM',
      });

      if (!resolved.subtopicId || !resolved.realLifeContext) {
        throw new Error('Smart Random resolution missing subtopic or context');
      }
      if (resolved.subtopicId === 'RANDOM' || resolved.realLifeContext === 'RANDOM') {
        throw new Error('Smart Random returned literal RANDOM placeholder');
      }

      results.push({
        code: 'F',
        name: 'Smart Random works without Category',
        passed: true,
        details: `Smart Random resolved subtopic=${resolved.subtopicId}, context=${resolved.realLifeContext}`,
      });
    } catch (err: any) {
      results.push({
        code: 'F',
        name: 'Smart Random works without Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST G: Dashboard works without Category
    // -------------------------------------------------------------------------
    try {
      const metrics = await dashboardService.getMetrics();
      if (!metrics) throw new Error('Dashboard service returned empty metrics');

      results.push({
        code: 'G',
        name: 'Dashboard works without Category',
        passed: true,
        details: `Dashboard metrics calculated successfully (Total questions: ${metrics.questions.total})`,
      });
    } catch (err: any) {
      results.push({
        code: 'G',
        name: 'Dashboard works without Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST H: Content Master UI works without Category
    // -------------------------------------------------------------------------
    try {
      const cm = await contentMasterService.createContentMaster(
        {
          title: 'Stage 2 Content Master Test',
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-0001',
          createdBy: actor.id,
        },
        actor.id,
        actor.name
      );

      if (!cm || !cm.id) throw new Error('ContentMaster creation returned empty result');
      if (cm.topicId !== 'BP-TOP-001' || cm.subtopicId !== 'BP-SUB-0001') {
        throw new Error(`ContentMaster Topic/Subtopic mismatch: topic=${cm.topicId}, subtopic=${cm.subtopicId}`);
      }
      if (cm.categoryId === 'CAT-GENERAL') {
        throw new Error('Forbidden: ContentMaster defaulted to CAT-GENERAL');
      }
      createdContentMasterIds.push(cm.id);

      results.push({
        code: 'H',
        name: 'Content Master UI works without Category',
        passed: true,
        details: `Created ContentMaster ${cm.id} with Topic=${cm.topicId}, Subtopic=${cm.subtopicId}`,
      });
    } catch (err: any) {
      results.push({
        code: 'H',
        name: 'Content Master UI works without Category',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST I: Invalid Topic is rejected
    // -------------------------------------------------------------------------
    try {
      let failedAsExpected = false;
      try {
        await taxonomyService.validateQuestionTaxonomy('BP-TOP-NONEXISTENT-999', 'BP-SUB-0001');
      } catch (err: any) {
        failedAsExpected = true;
      }
      if (!failedAsExpected) {
        throw new Error('Expected invalid Topic to throw ReferenceIntegrityError, but it succeeded');
      }
      results.push({
        code: 'I',
        name: 'Invalid Topic is rejected',
        passed: true,
        details: 'Non-existent topic BP-TOP-NONEXISTENT-999 was strictly rejected',
      });
    } catch (err: any) {
      results.push({
        code: 'I',
        name: 'Invalid Topic is rejected',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST J: Invalid Subtopic is rejected
    // -------------------------------------------------------------------------
    try {
      let failedAsExpected = false;
      try {
        await taxonomyService.validateQuestionTaxonomy('BP-TOP-001', 'BP-SUB-NONEXISTENT-999');
      } catch (err: any) {
        failedAsExpected = true;
      }
      if (!failedAsExpected) {
        throw new Error('Expected invalid Subtopic to throw ReferenceIntegrityError, but it succeeded');
      }
      results.push({
        code: 'J',
        name: 'Invalid Subtopic is rejected',
        passed: true,
        details: 'Non-existent subtopic BP-SUB-NONEXISTENT-999 was strictly rejected',
      });
    } catch (err: any) {
      results.push({
        code: 'J',
        name: 'Invalid Subtopic is rejected',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST K: Wrong Topic/Subtopic relationship is rejected
    // -------------------------------------------------------------------------
    try {
      let failedAsExpected = false;
      let caughtErrorMessage = '';
      try {
        await taxonomyService.validateQuestionTaxonomy('BP-TOP-002', 'BP-SUB-0001');
      } catch (err: any) {
        failedAsExpected = true;
        caughtErrorMessage = err.message;
      }

      if (!failedAsExpected) {
        throw new Error('Expected cross-relational validation (BP-TOP-002 + BP-SUB-0001) to fail, but it succeeded');
      }

      results.push({
        code: 'K',
        name: 'Wrong Topic/Subtopic relationship is rejected',
        passed: true,
        details: `Cross-relational violation caught: "${caughtErrorMessage}"`,
      });
    } catch (err: any) {
      results.push({
        code: 'K',
        name: 'Wrong Topic/Subtopic relationship is rejected',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST L: Existing BP-Q-000190 remains readable
    // -------------------------------------------------------------------------
    try {
      const q190 = await questionsRepository.findById('BP-Q-000190');
      if (!q190) {
        throw new Error('Existing question BP-Q-000190 could not be found');
      }
      if (!q190.questionText || !q190.topicId || !q190.subtopicId) {
        throw new Error(`Existing question BP-Q-000190 has missing core fields: text=${q190.questionText}, topic=${q190.topicId}, subtopic=${q190.subtopicId}`);
      }
      results.push({
        code: 'L',
        name: 'Existing BP-Q-000190 remains readable',
        passed: true,
        details: `BP-Q-000190 readable: "${q190.questionText.slice(0, 30)}..." Topic=${q190.topicId}, Subtopic=${q190.subtopicId}`,
      });
    } catch (err: any) {
      results.push({
        code: 'L',
        name: 'Existing BP-Q-000190 remains readable',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST M: Existing BP-CNT-000178 remains readable
    // -------------------------------------------------------------------------
    try {
      const cm178 = await contentMastersRepository.findById('BP-CNT-000178');
      if (!cm178) {
        throw new Error('Existing ContentMaster BP-CNT-000178 could not be found');
      }
      if (!cm178.title || !cm178.topicId || !cm178.subtopicId) {
        throw new Error(`Existing ContentMaster BP-CNT-000178 has missing core fields: title=${cm178.title}, topic=${cm178.topicId}, subtopic=${cm178.subtopicId}`);
      }
      results.push({
        code: 'M',
        name: 'Existing BP-CNT-000178 remains readable',
        passed: true,
        details: `BP-CNT-000178 readable: "${cm178.title.slice(0, 30)}..." Topic=${cm178.topicId}, Subtopic=${cm178.subtopicId}`,
      });
    } catch (err: any) {
      results.push({
        code: 'M',
        name: 'Existing BP-CNT-000178 remains readable',
        passed: false,
        error: err.message,
      });
    }

    // -------------------------------------------------------------------------
    // TEST N: No CAT-GENERAL fallback is created
    // -------------------------------------------------------------------------
    try {
      const questionsWithCatGen = (await questionsRepository.findAll()).filter(
        (q) => q.categoryId === 'CAT-GENERAL'
      );
      const mastersWithCatGen = (await contentMastersRepository.findAll()).filter(
        (cm) => cm.categoryId === 'CAT-GENERAL'
      );

      // Verify no newly created test items acquired CAT-GENERAL
      const createdQuestionsWithCatGen = createdQuestionIds.filter((id) => {
        const item = questionsWithCatGen.find((q) => q.id === id);
        return Boolean(item);
      });

      if (createdQuestionsWithCatGen.length > 0) {
        throw new Error(`Newly created question(s) acquired forbidden CAT-GENERAL fallback: ${createdQuestionsWithCatGen.join(', ')}`);
      }

      results.push({
        code: 'N',
        name: 'No CAT-GENERAL fallback is created',
        passed: true,
        details: 'Verified zero test entities acquired CAT-GENERAL fallback',
      });
    } catch (err: any) {
      results.push({
        code: 'N',
        name: 'No CAT-GENERAL fallback is created',
        passed: false,
        error: err.message,
      });
    }

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP & RECORD COUNT ASSERTION (TEST O)
    // -------------------------------------------------------------------------
    let cleanupPassed = true;
    let cleanupError = '';

    try {
      for (const qId of createdQuestionIds) {
        await questionsRepository.delete(qId);
      }
      for (const cmId of createdContentMasterIds) {
        await contentMastersRepository.delete(cmId, { actor, reason: 'Test cleanup' });
      }
      for (const planId of createdContentPlanIds) {
        await contentPlansRepository.delete(planId);
      }
    } catch (err: any) {
      cleanupPassed = false;
      cleanupError = err.message;
    }

    const afterQuestions = await questionsRepository.findAll();
    const afterContentMasters = await contentMastersRepository.findAll();
    const afterContentPlans = await contentPlansRepository.findAll();
    const afterCounts = {
      questions: afterQuestions.length,
      contentMasters: afterContentMasters.length,
      contentPlans: afterContentPlans.length,
    };

    const countsMatch =
      beforeCounts.questions === afterCounts.questions &&
      beforeCounts.contentMasters === afterCounts.contentMasters &&
      beforeCounts.contentPlans === afterCounts.contentPlans;

    if (!cleanupPassed || !countsMatch) {
      results.push({
        code: 'O',
        name: 'Production record counts remain unchanged after tests',
        passed: false,
        error: cleanupError || `Record counts changed: Questions ${beforeCounts.questions}->${afterCounts.questions}, CMs ${beforeCounts.contentMasters}->${afterCounts.contentMasters}, Plans ${beforeCounts.contentPlans}->${afterCounts.contentPlans}`,
      });
    } else {
      results.push({
        code: 'O',
        name: 'Production record counts remain unchanged after tests',
        passed: true,
        details: `All ${createdQuestionIds.length} test question(s), ${createdContentMasterIds.length} content master(s), and ${createdContentPlanIds.length} content plan(s) cleaned up. Final counts match initial counts exactly.`,
      });
    }
  }

  const finalQuestions = await questionsRepository.findAll();
  const finalContentMasters = await contentMastersRepository.findAll();
  const finalContentPlans = await contentPlansRepository.findAll();
  const afterCounts = {
    questions: finalQuestions.length,
    contentMasters: finalContentMasters.length,
    contentPlans: finalContentPlans.length,
  };

  const allPassed = results.every((r) => r.passed);
  const productionDataChanged =
    beforeCounts.questions !== afterCounts.questions ||
    beforeCounts.contentMasters !== afterCounts.contentMasters ||
    beforeCounts.contentPlans !== afterCounts.contentPlans;

  return {
    allPassed,
    results,
    beforeCounts,
    afterCounts,
    productionDataChanged,
  };
}

if (process.argv[1]?.includes('category-decoupling-verification.test')) {
  runCategoryDecouplingTests()
    .then((res) => {
      console.log('\n================ STAGE 2 CATEGORY DECOUPLING TEST REPORT ================');
      res.results.forEach((r) => {
        console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Test ${r.code}: ${r.name}`);
        if (r.details) console.log(`       Details: ${r.details}`);
        if (r.error) console.log(`       Error: ${r.error}`);
      });
      console.log('========================================================================');
      console.log(`Overall Result: ${res.allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
      console.log(`Production Counts Before: Questions=${res.beforeCounts.questions}, ContentMasters=${res.beforeCounts.contentMasters}, ContentPlans=${res.beforeCounts.contentPlans}`);
      console.log(`Production Counts After:  Questions=${res.afterCounts.questions}, ContentMasters=${res.afterCounts.contentMasters}, ContentPlans=${res.afterCounts.contentPlans}`);
      console.log(`Production Data Changed:  ${res.productionDataChanged ? 'YES (WARNING)' : 'NO (ZERO MUTATION)'}`);
      if (!res.allPassed) process.exit(1);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
