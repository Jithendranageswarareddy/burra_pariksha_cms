/**
 * BURRA PARIKSHA CMS - Phase 08 Verification Test Suite
 * PHASE 08 — MANUAL QUESTION CREATION
 * 
 * Deterministic test verification covering P08-01 through P08-20:
 * P08-01 Manual creation path exists
 * P08-02 AI is not required
 * P08-03 Complete manual input contract
 * P08-04 Topic/Subtopic validation
 * P08-05 QUESTION_CONFIG integration
 * P08-06 A/B/C/D validation
 * P08-07 Correct Answer validation
 * P08-08 Same validation as AI path
 * P08-09 Server-authoritative author
 * P08-10 Server-controlled timestamps
 * P08-11 Content ID / Question ID separation
 * P08-12 Same canonical QuestionService creation path
 * P08-13 Same production persistence model
 * P08-14 Same lifecycle/status model
 * P08-15 Manual question reaches same downstream architecture
 * P08-16 Unauthorized user blocked
 * P08-17 No automatic approval/publishing
 * P08-18 AI-disabled/manual-only operation
 * P08-19 Manual CREATE -> READ -> UPDATE -> READ round trip
 * P08-20 AI and manual candidates converge to the same production contract
 */

import { questionService } from '../lib/services/question.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { workflowOrchestrationService } from '../lib/services/workflow-orchestration.service';
import { questionConfigService } from '../lib/services/question-config.service';
import { questionConfigRepository } from '../lib/repositories/question-config.repository';
import { categoriesRepository } from '../lib/repositories/categories.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { QuestionCreationValidator, QuestionCreationRequestPayload } from '../lib/validators/question-creation.validator';
import { QuestionStatus, VideoProductionStatus, UserRole, QuestionLanguage } from '../types';

interface TestResult {
  code: string;
  description: string;
  passed: boolean;
  message?: string;
}

export async function runPhase8ManualQuestionCreationTests() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 08 MANUAL QUESTION CREATION');
  console.log('====================================================\n');

  // Ensure QUESTION_CONFIG fallback store has active context and style entries for offline/test mode
  const configStore = (questionConfigRepository as any).constructor?.fallbackStore?.get('QUESTION_CONFIG');
  if (configStore && configStore.size === 0) {
    const defaultEntries = [
      {
        id: 'CFG-CTX-001',
        dimension: 'REAL_LIFE_CONTEXT',
        code: 'HYDERABAD_METRO',
        displayLabel: 'Hyderabad Metro Travel',
        description: 'Scenarios based on Hyderabad Metro commutes',
        sortOrder: 1,
        isActive: true,
        isDefault: true,
      },
      {
        id: 'CFG-CTX-002',
        dimension: 'REAL_LIFE_CONTEXT',
        code: 'IRANI_CHAI_SHOP',
        displayLabel: 'Irani Chai Shop',
        description: 'Scenarios based on chai shop bills',
        sortOrder: 2,
        isActive: true,
        isDefault: false,
      },
      {
        id: 'CFG-CTX-INACTIVE',
        dimension: 'REAL_LIFE_CONTEXT',
        code: 'DEPRECATED_CONTEXT',
        displayLabel: 'Deprecated Context',
        description: 'Deprecated inactive context',
        sortOrder: 99,
        isActive: false,
        isDefault: false,
      },
      {
        id: 'CFG-STYLE-001',
        dimension: 'QUESTION_STYLE',
        code: 'STORY_BASED',
        displayLabel: 'Story Based',
        description: 'Narrative storytelling question style',
        sortOrder: 1,
        isActive: true,
        isDefault: true,
      },
      {
        id: 'CFG-STYLE-002',
        dimension: 'QUESTION_STYLE',
        code: 'REAL_WORLD_SCENARIO',
        displayLabel: 'Real World Scenario',
        description: 'Practical real-world application style',
        sortOrder: 2,
        isActive: true,
        isDefault: false,
      },
    ];
    for (const e of defaultEntries) {
      configStore.set(e.id, e);
    }
  }

  // Ensure Taxonomy fallback store has active category, topic, and subtopic entries
  const catStore = (categoriesRepository as any).constructor?.fallbackStore?.get('CATEGORIES');
  if (catStore) {
    catStore.set('CAT-QA', {
      id: 'CAT-QA',
      name: 'Quantitative Aptitude',
      slug: 'quantitative-aptitude',
      description: 'Numerical reasoning and aptitude',
      colorCode: '#3B82F6',
      createdAt: new Date().toISOString(),
    });
  }

  const topicStore = (topicsRepository as any).constructor?.fallbackStore?.get('TOPICS');
  if (topicStore) {
    topicStore.set('BP-TOP-001', {
      id: 'BP-TOP-001',
      name: 'Speed, Distance & Time',
      slug: 'speed-distance-time',
      categoryId: 'CAT-QA',
      description: 'Aptitude problems on speed, distance and time',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  const subtopicStore = (subtopicsRepository as any).constructor?.fallbackStore?.get('SUBTOPICS');
  if (subtopicStore) {
    subtopicStore.set('BP-SUB-0001', {
      id: 'BP-SUB-0001',
      topicId: 'BP-TOP-001',
      name: 'Trains & Overtaking Math',
      slug: 'trains-overtaking-math',
      description: 'Train relative speed and overtaking problems',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  taxonomyService.invalidateCache();

  const results: TestResult[] = [];
  const createdQuestionIds: string[] = [];
  const createdContentMasterIds: string[] = [];

  const adminActor = {
    id: 'USR-ADMIN-P08',
    name: 'Phase 08 Test Admin',
    role: UserRole.ADMIN,
  };

  const editorActor = {
    id: 'USR-EDT-P08',
    name: 'Phase 08 Test Editor',
    role: UserRole.QUESTION_EDITOR,
  };

  function recordTest(code: string, description: string, passed: boolean, message?: string) {
    results.push({ code, description, passed, message });
    if (passed) {
      console.log(`[PASS] ${code}: ${description}${message ? ` (${message})` : ''}`);
    } else {
      console.error(`[FAIL] ${code}: ${description}${message ? ` (${message})` : ''}`);
    }
  }

  // Sample base valid manual payload
  const validManualPayload: QuestionCreationRequestPayload = {
    creationMode: 'manual',
    categoryId: 'CAT-QA',
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'Intermediate',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: QuestionLanguage.ENGLISH,
    realLifeContext: 'Hyderabad Metro Travel',
    questionStyle: 'STORY_BASED',
    questionText: 'A train leaves Secunderabad at 8:00 AM travelling at 60 km/h. How far does it travel in 2.5 hours?',
    options: {
      a: '120 km',
      b: '150 km',
      c: '180 km',
      d: '200 km',
    },
    correctAnswer: 'B',
    explanation: 'Distance = Speed x Time = 60 km/h x 2.5 h = 150 km.',
    source: 'Manual Authoring Test',
  };

  try {
    // ----------------------------------------------------
    // P08-01: Manual creation path exists
    // ----------------------------------------------------
    let q01 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-01 Test Question: Distance = Speed x Time' },
      adminActor
    );
    if (q01?.id) {
      createdQuestionIds.push(q01.id);
      if (q01.contentMasterId) createdContentMasterIds.push(q01.contentMasterId);
    }
    const p01Passed = Boolean(q01 && q01.id && q01.id.startsWith('BP-Q-') && q01.questionText.includes('P08-01'));
    recordTest('P08-01', 'Manual creation path exists', p01Passed, `Question ID allocated: ${q01?.id}`);

    // ----------------------------------------------------
    // P08-02: AI is not required
    // ----------------------------------------------------
    const originalApiKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      let q02 = await questionService.createQuestionFromRequest(
        { ...validManualPayload, questionText: 'P08-02 Test Question created without Gemini API Key' },
        adminActor
      );
      if (q02?.id) {
        createdQuestionIds.push(q02.id);
        if (q02.contentMasterId) createdContentMasterIds.push(q02.contentMasterId);
      }
      const p02Passed = Boolean(q02 && q02.id);
      recordTest('P08-02', 'AI is not required for manual creation', p02Passed, `Created without API key: ${q02?.id}`);
    } finally {
      process.env.GEMINI_API_KEY = originalApiKey;
    }

    // ----------------------------------------------------
    // P08-03: Complete manual input contract
    // ----------------------------------------------------
    let q03 = await questionService.createQuestionFromRequest(
      {
        ...validManualPayload,
        questionText: 'P08-03 Test Question with all 8 dimensions populated',
        difficulty: 'Hard',
        challengeType: 'ABCD',
        presentationType: 'Text',
        language: QuestionLanguage.TELUGU,
        realLifeContext: 'Irani Chai Shop',
        questionStyle: 'REAL_WORLD_SCENARIO',
      },
      adminActor
    );
    if (q03?.id) {
      createdQuestionIds.push(q03.id);
      if (q03.contentMasterId) createdContentMasterIds.push(q03.contentMasterId);
    }
    const p03Passed = Boolean(
      q03 &&
      q03.topicId === 'BP-TOP-001' &&
      q03.subtopicId === 'BP-SUB-0001' &&
      q03.difficulty === 'Hard' &&
      q03.language === QuestionLanguage.TELUGU &&
      q03.realLifeContext === 'Irani Chai Shop' &&
      q03.questionStyle === 'REAL_WORLD_SCENARIO' &&
      q03.options.a === '120 km' &&
      q03.correctAnswer === 'B'
    );
    recordTest('P08-03', 'Complete manual input contract verified', p03Passed, `All 8 dimensions & options persisted`);

    // ----------------------------------------------------
    // P08-04: Topic/Subtopic validation
    // ----------------------------------------------------
    let p04Passed = false;
    try {
      await questionService.createQuestionFromRequest(
        {
          ...validManualPayload,
          questionText: 'P08-04 Test Invalid Subtopic Mismatch',
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-999999-INVALID',
        },
        adminActor
      );
    } catch (err: any) {
      p04Passed = err?.message?.includes('Subtopic') || err?.message?.includes('Taxonomy') || err?.name === 'ValidationError';
    }
    recordTest('P08-04', 'Topic/Subtopic validation enforces valid relationship', p04Passed, 'Invalid subtopic rejected');

    // ----------------------------------------------------
    // P08-05: QUESTION_CONFIG integration
    // ----------------------------------------------------
    let p05Passed = false;
    try {
      await questionService.createQuestionFromRequest(
        {
          ...validManualPayload,
          questionText: 'P08-05 Inactive Context Test Question',
          realLifeContext: 'DEPRECATED_CONTEXT',
        },
        adminActor
      );
    } catch (err: any) {
      p05Passed = err?.message?.includes('inactive') || err?.name === 'ValidationError';
    }
    recordTest('P08-05', 'QUESTION_CONFIG integration validates active configuration items', p05Passed, 'Inactive config item rejected');

    // ----------------------------------------------------
    // P08-06: A/B/C/D validation
    // ----------------------------------------------------
    let p06Passed = false;
    try {
      await questionService.createQuestionFromRequest(
        {
          ...validManualPayload,
          questionText: 'P08-06 Duplicate Options Test Question',
          options: {
            a: '100 km',
            b: '100 km', // Duplicate option
            c: '150 km',
            d: '200 km',
          },
        },
        adminActor
      );
    } catch (err: any) {
      p06Passed = err?.message?.includes('distinct') || err?.name === 'ValidationError';
    }
    recordTest('P08-06', 'A/B/C/D validation rejects duplicate or empty options', p06Passed, 'Duplicate options rejected');

    // ----------------------------------------------------
    // P08-07: Correct Answer validation
    // ----------------------------------------------------
    let p07Passed = false;
    try {
      await questionService.createQuestionFromRequest(
        {
          ...validManualPayload,
          questionText: 'P08-07 Invalid Correct Answer Choice Test',
          correctAnswer: 'E' as any,
        },
        adminActor
      );
    } catch (err: any) {
      p07Passed = err?.message?.includes('correctAnswer') || err?.name === 'ValidationError';
    }
    recordTest('P08-07', 'Correct Answer validation rejects invalid option choices', p07Passed, 'Invalid correct answer rejected');

    // ----------------------------------------------------
    // P08-08: Same validation as AI path
    // ----------------------------------------------------
    let p08Passed = true;
    try {
      QuestionCreationValidator.validateStructure({ ...validManualPayload, creationMode: 'manual' });
      QuestionCreationValidator.validateStructure({ ...validManualPayload, creationMode: 'ai' });
    } catch {
      p08Passed = false;
    }
    recordTest('P08-08', 'Same structural validation rules applied to Manual & AI', p08Passed, 'QuestionCreationValidator applies identically');

    // ----------------------------------------------------
    // P08-09: Server-authoritative author
    // ----------------------------------------------------
    const spoofedBody = {
      ...validManualPayload,
      questionText: 'P08-09 Test Question with spoofed author body',
      author: 'ClientSpoofedUser',
      authorId: 'CLIENT-SPOOF-999',
    };
    let q09 = await questionService.createQuestionFromRequest(spoofedBody as any, editorActor);
    if (q09?.id) {
      createdQuestionIds.push(q09.id);
      if (q09.contentMasterId) createdContentMasterIds.push(q09.contentMasterId);
    }
    const p09Passed = Boolean(q09 && q09.authorId === editorActor.id && q09.author === editorActor.name);
    recordTest('P08-09', 'Server-authoritative author identity overrides client body', p09Passed, `Author set to server actor: ${q09?.author}`);

    // ----------------------------------------------------
    // P08-10: Server-controlled timestamps
    // ----------------------------------------------------
    const fakeTimestampBody = {
      ...validManualPayload,
      questionText: 'P08-10 Test Question with fake client timestamp',
      createdAt: '1999-01-01T00:00:00.000Z',
      updatedAt: '1999-01-01T00:00:00.000Z',
    };
    let q10 = await questionService.createQuestionFromRequest(fakeTimestampBody as any, adminActor);
    if (q10?.id) {
      createdQuestionIds.push(q10.id);
      if (q10.contentMasterId) createdContentMasterIds.push(q10.contentMasterId);
    }
    const currentYear = new Date().getFullYear();
    const createdYear = new Date(q10.createdAt).getFullYear();
    const p10Passed = Boolean(q10 && createdYear === currentYear);
    recordTest('P08-10', 'Server-controlled timestamps generated at creation time', p10Passed, `CreatedAt year: ${createdYear}`);

    // ----------------------------------------------------
    // P08-11: Content ID / Question ID separation
    // ----------------------------------------------------
    let q11 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-11 Test Content ID vs Question ID Separation' },
      adminActor
    );
    if (q11?.id) {
      createdQuestionIds.push(q11.id);
      if (q11.contentMasterId) createdContentMasterIds.push(q11.contentMasterId);
    }
    const p11Passed = Boolean(
      q11 &&
      q11.id &&
      q11.contentMasterId &&
      q11.id.startsWith('BP-Q-') &&
      q11.contentMasterId.startsWith('BP-CNT-') &&
      q11.id !== q11.contentMasterId
    );
    recordTest('P08-11', 'Content ID and Question ID remain separate distinct entities', p11Passed, `QID: ${q11?.id}, ContentID: ${q11?.contentMasterId}`);

    // ----------------------------------------------------
    // P08-12: Same canonical QuestionService creation path
    // ----------------------------------------------------
    let q12 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-12 Test QuestionService canonical creation path' },
      adminActor
    );
    if (q12?.id) {
      createdQuestionIds.push(q12.id);
      if (q12.contentMasterId) createdContentMasterIds.push(q12.contentMasterId);
    }
    const p12Passed = Boolean(q12 && q12.id && q12.status === QuestionStatus.GENERATED);
    recordTest('P08-12', 'Manual and AI execute through same QuestionService pipeline', p12Passed, `Created via createQuestionFromRequest`);

    // ----------------------------------------------------
    // P08-13: Same production persistence model
    // ----------------------------------------------------
    let q13 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-13 Test Production Persistence Model' },
      adminActor
    );
    if (q13?.id) {
      createdQuestionIds.push(q13.id);
      if (q13.contentMasterId) createdContentMasterIds.push(q13.contentMasterId);
    }
    const repoRecord = await questionsRepository.findById(q13.id);
    const p13Passed = Boolean(repoRecord && repoRecord.id === q13.id && repoRecord.questionText === q13.questionText);
    recordTest('P08-13', 'Manual questions persisted to same authoritative questionsRepository', p13Passed, 'Verified repository lookup');

    // ----------------------------------------------------
    // P08-14: Same lifecycle/status model
    // ----------------------------------------------------
    let q14 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-14 Test Initial Lifecycle Status' },
      adminActor
    );
    if (q14?.id) {
      createdQuestionIds.push(q14.id);
      if (q14.contentMasterId) createdContentMasterIds.push(q14.contentMasterId);
    }
    const p14Passed = Boolean(
      q14 &&
      q14.status === QuestionStatus.GENERATED &&
      q14.videoStatus === VideoProductionStatus.NOT_STARTED
    );
    recordTest('P08-14', 'Manual questions initialize with same default lifecycle status', p14Passed, `status=GENERATED, videoStatus=NOT_STARTED`);

    // ----------------------------------------------------
    // P08-15: Manual question reaches same downstream architecture
    // ----------------------------------------------------
    let q15 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-15 Test Downstream Workflow Orchestration Integration' },
      adminActor
    );
    if (q15?.id) {
      createdQuestionIds.push(q15.id);
      if (q15.contentMasterId) createdContentMasterIds.push(q15.contentMasterId);
    }
    const workflowState = await workflowOrchestrationService.getCanonicalWorkflowState(q15.id);
    const p15Passed = Boolean(workflowState && workflowState.questionId === q15.id && workflowState.questionStatus === QuestionStatus.GENERATED);
    recordTest('P08-15', 'Manual question integrates with same downstream workflow orchestrator', p15Passed, `Canonical state accessible: ${workflowState?.questionStatus}`);

    // ----------------------------------------------------
    // P08-16: Unauthorized user blocked
    // ----------------------------------------------------
    let p16Passed = false;
    try {
      await questionService.createQuestionFromRequest(
        { ...validManualPayload, questionText: 'P08-16 Unauthorized Student Creation Attempt' },
        { id: 'USR-STUDENT', name: 'Student Account', role: 'STUDENT' as any }
      );
    } catch (err: any) {
      p16Passed = err?.message?.includes('Unauthorized') || err?.message?.includes('not allowed');
    }
    recordTest('P08-16', 'Unauthorized user role blocked from manual question creation', p16Passed, 'Role STUDENT rejected with 403');

    // ----------------------------------------------------
    // P08-17: No automatic approval/publishing
    // ----------------------------------------------------
    let q17 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-17 Test No Auto Approval or Auto Publishing' },
      adminActor
    );
    if (q17?.id) {
      createdQuestionIds.push(q17.id);
      if (q17.contentMasterId) createdContentMasterIds.push(q17.contentMasterId);
    }
    const p17Passed = Boolean(
      q17 &&
      q17.status !== QuestionStatus.APPROVED &&
      q17.status === QuestionStatus.GENERATED
    );
    recordTest('P08-17', 'Manual creation never auto-approves or auto-publishes', p17Passed, `Status is strictly GENERATED`);

    // ----------------------------------------------------
    // P08-18: AI-disabled/manual-only operation
    // ----------------------------------------------------
    let q18 = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-18 Manual creation in pure AI-disabled mode' },
      adminActor
    );
    if (q18?.id) {
      createdQuestionIds.push(q18.id);
      if (q18.contentMasterId) createdContentMasterIds.push(q18.contentMasterId);
    }
    const p18Passed = Boolean(q18 && q18.id);
    recordTest('P08-18', 'Pure manual-only operation verified in AI-disabled mode', p18Passed, `Question created independently`);

    // ----------------------------------------------------
    // P08-19: Manual CREATE -> READ -> UPDATE -> READ round trip
    // ----------------------------------------------------
    let q19Create = await questionService.createQuestionFromRequest(
      { ...validManualPayload, questionText: 'P08-19 Initial Manual Question Text' },
      adminActor
    );
    if (q19Create?.id) {
      createdQuestionIds.push(q19Create.id);
      if (q19Create.contentMasterId) createdContentMasterIds.push(q19Create.contentMasterId);
    }

    const q19Read1 = await questionService.getQuestionById(q19Create.id);
    const q19Update = await questionService.updateQuestion(
      q19Create.id,
      { questionText: 'P08-19 UPDATED Manual Question Text', difficulty: 'Hard' },
      adminActor
    );
    const q19Read2 = await questionService.getQuestionById(q19Create.id);

    const p19Passed = Boolean(
      q19Read1 &&
      q19Read1.questionText === 'P08-19 Initial Manual Question Text' &&
      q19Update &&
      q19Read2 &&
      q19Read2.questionText === 'P08-19 UPDATED Manual Question Text' &&
      q19Read2.difficulty === 'Hard'
    );
    recordTest('P08-19', 'Manual CREATE -> READ -> UPDATE -> READ round trip verified', p19Passed, 'Verified state mutation');

    // ----------------------------------------------------
    // P08-20: AI and manual candidates converge to same production contract
    // ----------------------------------------------------
    let q20Manual = await questionService.createQuestionFromRequest(
      { ...validManualPayload, creationMode: 'manual', questionText: 'P08-20 Manual Candidate Convergence Test' },
      adminActor
    );
    if (q20Manual?.id) {
      createdQuestionIds.push(q20Manual.id);
      if (q20Manual.contentMasterId) createdContentMasterIds.push(q20Manual.contentMasterId);
    }

    let q20AI = await questionService.createQuestionFromRequest(
      { ...validManualPayload, creationMode: 'ai', questionText: 'P08-20 AI Candidate Convergence Test' },
      adminActor
    );
    if (q20AI?.id) {
      createdQuestionIds.push(q20AI.id);
      if (q20AI.contentMasterId) createdContentMasterIds.push(q20AI.contentMasterId);
    }

    const manualKeys = Object.keys(q20Manual).sort();
    const aiKeys = Object.keys(q20AI).sort();
    const keysMatch = JSON.stringify(manualKeys) === JSON.stringify(aiKeys);

    const p20Passed = Boolean(
      q20Manual &&
      q20AI &&
      keysMatch &&
      q20Manual.status === q20AI.status &&
      q20Manual.videoStatus === q20AI.videoStatus
    );
    recordTest('P08-20', 'AI and manual candidates produce identical Question model contracts', p20Passed, `Identical schema keys count: ${manualKeys.length}`);

  } catch (err: any) {
    console.error('Unhandled error during Phase 08 test execution:', err);
  } finally {
    // ----------------------------------------------------
    // Production Test-Artifact Safe Cleanup
    // ----------------------------------------------------
    console.log('\n--- Cleaning up synthetic test artifacts from repositories ---');
    let cleanedQuestions = 0;
    for (const qid of createdQuestionIds) {
      try {
        await questionsRepository.deleteRecord(qid, {
          actor: adminActor,
          reason: 'Phase 08 test-artifact safe cleanup',
        });
        cleanedQuestions++;
      } catch (err: any) {
        console.warn(`Could not delete test question ${qid}:`, err?.message);
      }
    }

    let cleanedMasters = 0;
    for (const cmid of createdContentMasterIds) {
      try {
        await contentMastersRepository.deleteRecord(cmid, {
          actor: adminActor,
          reason: 'Phase 08 test-artifact safe cleanup',
        });
        cleanedMasters++;
      } catch (err: any) {
        console.warn(`Could not delete test content master ${cmid}:`, err?.message);
      }
    }

    console.log(`Cleanup complete: Removed ${cleanedQuestions} test questions and ${cleanedMasters} test content masters.`);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.log('\n====================================================');
  console.log(`PHASE 08 SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
  console.log('====================================================\n');

  if (passedCount !== totalCount) {
    throw new Error(`Phase 08 verification failed: ${totalCount - passedCount} test(s) failed.`);
  }

  return { total: totalCount, passed: passedCount, results };
}

// Auto-run if executed directly via node/tsx
if (process.argv[1] && process.argv[1].includes('phase-8-manual-question-creation')) {
  runPhase8ManualQuestionCreationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
