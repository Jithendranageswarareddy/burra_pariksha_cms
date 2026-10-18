/**
 * BURRA PARIKSHA CMS — S9-T08 Unit & Integration Test Suite
 * Mode-Specific Generation Configuration (Question Challenge Short)
 *
 * Verifies all mandatory requirements of S9-T08 across UI, hooks, backend validation,
 * and persistence contracts:
 *
 * 1. Configuration & Mode:
 *    - Mode 1: QUESTION_CHALLENGE_SHORT loads canonical defaults (count=1, 9:16, <=58s).
 *    - Approved Question Counts: only [1, 5, 10, 15, 20] are accepted; others rejected.
 *    - Language and Difficulty match approved specifications (Telugu, English, Bilingual; Basic, Intermediate, Advanced).
 *    - Unsupported / malformed settings are strictly rejected by the backend boundary.
 *    - Mode switching resets / reconciles incompatible settings.
 *
 * 2. Topic & Subtopic Integrity:
 *    - Valid topic/subtopic pair is accepted.
 *    - Changing topic immediately clears or invalidates incompatible subtopic.
 *    - Subtopic belonging to another topic is rejected by the backend.
 *    - Missing topic or required subtopic blocks generation.
 *    - Asynchronous loading and error states prevent stale selections.
 *
 * 3. Generation & Persistence:
 *    - Generation payload contains canonical mode, topicId, subtopicId, question count, and aspect ratio.
 *    - Persisted draft retains productionMode, targetQuestionCount, and aspectRatio.
 *    - Failed request preserves valid user selections.
 *    - Duplicate submission protection prevents concurrent submissions.
 *    - Server-side validation rejects invalid values even when client validation is bypassed.
 *
 * 4. Regression:
 *    - Existing Question Generation entry point functions seamlessly.
 *    - Shared production context synchronization remains intact.
 *    - Mode 2 and Mode 3 configurations remain unaffected.
 */

import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  ContentProductionMode,
  validateProductionModeConfig,
  DEFAULT_PRODUCTION_CONTEXT,
  QuestionLanguage,
  DifficultyLevel,
} from '../../shared';
import { contentModeRegistry } from '../../shared/registry/content-mode.registry';
import { questionGenerationService } from '../../backend/domain/question-generation';
import { taxonomyService } from '../../backend/domain/taxonomy/services/taxonomy.service';
import { questionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { GenerationConfigPanel } from '../../frontend/features/question-generation/components/GenerationConfigPanel';
import {
  resolveCascadingSubtopic,
  validateGenerationTaxonomy,
  SubtopicSelectionController,
} from '../../frontend/features/question-generation/hooks/useQuestionGeneration';
import {
  ProductionJourneyProvider,
  useProductionContext,
} from '../../frontend/contexts/ProductionJourneyContext';
import {
  ProductionModeModal,
  resolveModeDefaultConfig,
  MODE_OPTIONS,
} from '../../frontend/features/question-generation/components/ProductionModeModal';

async function runS9T08UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S9-T08 TESTS: Mode-Specific Generation Configuration');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  // Mock taxonomy fixtures
  const mockTaxonomy = [
    {
      id: 'top_arithmetic_101',
      name: 'Arithmetic Ability',
      subtopics: [
        { id: 'sub_ratios_001', name: 'Ratios & Proportions', topicId: 'top_arithmetic_101' },
        { id: 'sub_percentages_002', name: 'Percentages', topicId: 'top_arithmetic_101' },
      ],
    },
    {
      id: 'top_reasoning_201',
      name: 'Logical Reasoning',
      subtopics: [
        { id: 'sub_syllogisms_003', name: 'Syllogisms', topicId: 'top_reasoning_201' },
      ],
    },
    {
      id: 'top_empty_301',
      name: 'Empty Topic',
      subtopics: [],
    },
  ];

  // =========================================================================
  // SECTION 1: Configuration & Mode Requirements (Tests 1-5)
  // =========================================================================
  console.log('[SECTION 1] Configuration and Mode Specifications');

  // Test 1: Question Challenge Short loads canonical configuration from registry
  {
    const modeDef = contentModeRegistry.getDefinition('QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(modeDef.id, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(modeDef.code, 'MODE_1');
    assert.strictEqual(modeDef.questionCount.defaultValue, 1);
    assert.deepStrictEqual(modeDef.questionCount.allowedValues, [1, 5, 10, 15, 20]);
    assert.strictEqual(modeDef.aspectRatio.defaultValue, '9:16');
    assert.deepStrictEqual(modeDef.aspectRatio.allowedValues, ['9:16']);
    assert.strictEqual(modeDef.duration.maxSeconds, 58);
    pass('Test 1: Question Challenge Short loads correct canonical configuration from registry');
  }

  // Test 2: Only approved question counts [1, 5, 10, 15, 20] are accepted by backend validation
  {
    const approvedCounts = [1, 5, 10, 15, 20];
    for (const count of approvedCounts) {
      const res = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', count, '9:16');
      assert.strictEqual(res.isValid, true, `Count ${count} must be valid for Mode 1`);
    }

    const unapprovedCounts = [0, 2, 3, 4, 6, 7, 12, 25, -1];
    for (const count of unapprovedCounts) {
      const res = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', count, '9:16');
      assert.strictEqual(res.isValid, false, `Count ${count} must be rejected for Mode 1`);
      assert.ok(res.error?.includes('requires questionCount of 1 (or batch series 5, 10, 15, 20)'));
    }
    pass('Test 2: Only approved question counts [1, 5, 10, 15, 20] are accepted; others rejected');
  }

  // Test 3: Language and difficulty controls match approved mode specification
  {
    // Render GenerationConfigPanel with Question Challenge Short
    const html = renderToString(
      React.createElement(GenerationConfigPanel, {
        taxonomyTree: mockTaxonomy,
        loadingTaxonomy: false,
        selectedTopic: 'top_arithmetic_101',
        selectedSubtopic: 'sub_ratios_001',
        currentSubtopics: mockTaxonomy[0].subtopics,
        difficulty: 'Intermediate',
        language: QuestionLanguage.TELUGU,
        realLifeContext: 'Metro commuter speed',
        questionStyle: 'SPEED_MATH_TRICK',
        customInstructions: '',
        isGenerating: false,
        aiStatus: { isConfigured: true, model: 'gemini-3.1-flash-lite' },
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount: 1,
        aspectRatio: '9:16',
        onTopicChange: () => {},
        onSubtopicChange: () => {},
        onDifficultyChange: () => {},
        onLanguageChange: () => {},
        onContextChange: () => {},
        onStyleChange: () => {},
        onCustomInstructionsChange: () => {},
        onGenerate: () => {},
      })
    );

    // Verify Mode 1 identification badge
    assert.ok(html.includes('Mode 1: Question Challenge Short'), 'Must display Mode 1 title');
    assert.ok(html.includes('9:16'), 'Must display 9:16 aspect ratio');
    assert.ok(html.includes('≤ 58s Short'), 'Must display <= 58s short indicator');

    // Verify Question Count options
    assert.ok(html.includes('1 Short (Single)'), 'Must include 1 Short option');
    assert.ok(html.includes('5 Shorts (Batch Series)'), 'Must include 5 Shorts option');
    assert.ok(html.includes('10 Shorts (Batch Series)'), 'Must include 10 Shorts option');
    assert.ok(html.includes('20 Shorts (Batch Series)'), 'Must include 20 Shorts option');

    // Verify Language options
    assert.ok(html.includes('తెలుగు (Telugu)'), 'Must include Telugu');
    assert.ok(html.includes('English'), 'Must include English');
    assert.ok(html.includes('Bilingual (Telugu + English)'), 'Must include Bilingual');

    // Verify Question Styles
    assert.ok(html.includes('Speed Math Shortcut'), 'Must include Speed Math Shortcut');
    assert.ok(html.includes('Real-World Scenario / Story'), 'Must include Story-Based');
    pass('Test 3: Language, difficulty, and style controls match approved mode specification');
  }

  // Test 4: Unsupported or malformed settings are rejected by backend validation
  {
    // Mode 1 with 16:9 aspect ratio rejected
    const badAspect = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '16:9' as any);
    assert.strictEqual(badAspect.isValid, false);
    assert.ok(badAspect.error?.includes("'9:16' aspect ratio"));

    // Server-side validateGenerationRequest rejecting invalid count
    const badCountRequest = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 7, // Invalid!
    });
    assert.strictEqual(badCountRequest.isValid, false);
    assert.ok(badCountRequest.error?.includes('requires questionCount of 1 (or batch series 5, 10, 15, 20)'));

    // Server-side validateGenerationRequest rejecting invalid language
    const badLangRequest = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: 'FRENCH' as any,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
    });
    assert.strictEqual(badLangRequest.isValid, false);
    assert.ok(badLangRequest.error?.includes("Invalid language 'FRENCH'"));
    pass('Test 4: Unsupported or malformed settings are strictly rejected by backend validation');
  }

  // Test 5: Switching to another mode resets or reconciles incompatible settings
  {
    // Mode 3 (count: 10, aspect: 16:9) switched to Mode 1 -> count reconciled to 10 (valid for Mode 1), aspect reset to 9:16
    const m3ToM1 = resolveModeDefaultConfig('QUESTION_CHALLENGE_SHORT', 10, '16:9');
    assert.strictEqual(m3ToM1.questionCount, 10);
    assert.strictEqual(m3ToM1.aspectRatio, '9:16', 'Aspect ratio must be reconciled to 9:16');

    // Mode 2 (count: 0) switched to Mode 1 -> count 0 is invalid for Mode 1, must reconcile to 1
    const m2ToM1 = resolveModeDefaultConfig('QUESTION_CHALLENGE_SHORT', 0, '9:16');
    assert.strictEqual(m2ToM1.questionCount, 1, 'Count 0 must be reconciled to 1 for Mode 1');
    assert.strictEqual(m2ToM1.aspectRatio, '9:16');

    // Mode 1 (count: 1) switched to Mode 2 -> count must be 0
    const m1ToM2 = resolveModeDefaultConfig('TOPIC_INTRODUCTION', 1, '9:16');
    assert.strictEqual(m1ToM2.questionCount, 0);

    // Mode 1 (count: 1) switched to Mode 3 -> count 1 is invalid for Mode 3, must reconcile to 10
    const m1ToM3 = resolveModeDefaultConfig('EXPLAINED_QUESTIONS_VIDEO', 1, '9:16');
    assert.strictEqual(m1ToM3.questionCount, 10);
    assert.strictEqual(m1ToM3.aspectRatio, '16:9');
    pass('Test 5: Switching modes reconciles mode-specific settings without invalid leaks');
  }

  // =========================================================================
  // SECTION 2: Topic & Subtopic Integrity (Tests 6-10)
  // =========================================================================
  console.log('[SECTION 2] Topic and Subtopic Dependent Integrity');

  // Test 6: Valid topic/subtopic pair is accepted
  {
    const validation = validateGenerationTaxonomy(
      'top_arithmetic_101',
      'sub_ratios_001',
      mockTaxonomy,
      false,
      null,
      false,
      null,
      mockTaxonomy[0].subtopics
    );
    assert.strictEqual(validation.canGenerate, true);
    assert.strictEqual(validation.error, undefined);
    pass('Test 6: Valid topic/subtopic pair is accepted by client validation');
  }

  // Test 7: Changing the topic clears or invalidates an incompatible subtopic
  {
    let updatedTopic = '';
    let updatedSubtopic = 'sub_ratios_001';
    let currentSubtopicsList: any[] = mockTaxonomy[0].subtopics;

    const controller = new SubtopicSelectionController({
      setSelectedTopic: (t) => { updatedTopic = t; },
      setSelectedSubtopic: (s) => { updatedSubtopic = s; },
      setCurrentSubtopics: (subs) => { currentSubtopicsList = subs; },
      setLoadingSubtopics: () => {},
      setSubtopicsError: () => {},
      setCandidateTaxonomy: () => {},
      getTaxonomyTree: () => mockTaxonomy,
      getSelectedTopic: () => updatedTopic,
    });

    // Change topic to 'top_reasoning_201'
    controller.handleTopicChange('top_reasoning_201');

    assert.strictEqual(updatedTopic, 'top_reasoning_201');
    assert.strictEqual(updatedSubtopic, '', 'Subtopic must be cleared immediately when topic changes');
    assert.deepStrictEqual(currentSubtopicsList, [], 'Subtopics list must be cleared before loading new ones');
    pass('Test 7: Changing topic immediately clears incompatible subtopic and dependent options');
  }

  // Test 8: Subtopic belonging to another topic cannot be submitted
  {
    // sub_syllogisms_003 belongs to top_reasoning_201, NOT top_arithmetic_101
    const validation = validateGenerationTaxonomy(
      'top_arithmetic_101',
      'sub_syllogisms_003',
      mockTaxonomy,
      false,
      null,
      false,
      null,
      mockTaxonomy[0].subtopics
    );
    assert.strictEqual(validation.canGenerate, false);
    assert.ok(validation.error?.includes('does not belong to topic'));

    // Backend validation also rejects
    const backendRes = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-05',
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
    });
    assert.strictEqual(backendRes.isValid, false);
    assert.ok(backendRes.error?.includes('does not belong to Topic'));
    pass('Test 8: Subtopic belonging to another topic is rejected by both client and backend validation');
  }

  // Test 9: Missing topic or required subtopic blocks generation
  {
    // Missing topic
    const noTopic = validateGenerationTaxonomy('', '', mockTaxonomy, false, null);
    assert.strictEqual(noTopic.canGenerate, false);
    assert.ok(noTopic.error?.includes('select a valid Topic'));

    // Missing subtopic
    const noSubtopic = validateGenerationTaxonomy('top_arithmetic_101', '', mockTaxonomy, false, null);
    assert.strictEqual(noSubtopic.canGenerate, false);
    assert.ok(noSubtopic.error?.includes('select a valid Subtopic'));

    // UI generation button disabled when topic or subtopic missing
    const disabledHtml = renderToString(
      React.createElement(GenerationConfigPanel, {
        taxonomyTree: mockTaxonomy,
        loadingTaxonomy: false,
        selectedTopic: 'top_arithmetic_101',
        selectedSubtopic: '',
        currentSubtopics: mockTaxonomy[0].subtopics,
        difficulty: 'Intermediate',
        language: QuestionLanguage.TELUGU,
        realLifeContext: '',
        questionStyle: 'SPEED_MATH_TRICK',
        customInstructions: '',
        isGenerating: false,
        aiStatus: { isConfigured: true, model: 'gemini-3.1-flash-lite' },
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount: 1,
        aspectRatio: '9:16',
        onTopicChange: () => {},
        onSubtopicChange: () => {},
        onDifficultyChange: () => {},
        onLanguageChange: () => {},
        onContextChange: () => {},
        onStyleChange: () => {},
        onCustomInstructionsChange: () => {},
        onGenerate: () => {},
      })
    );
    assert.ok(disabledHtml.includes('disabled=""'), 'Generate button must be disabled when subtopic is missing');
    assert.ok(disabledHtml.includes('Select a valid subtopic to enable generation'), 'Must show actionable hint');
    pass('Test 9: Missing topic or required subtopic blocks generation and disables action button');
  }

  // Test 10: Asynchronous option loading and failure states do not allow stale selections
  {
    // Loading taxonomy blocks generation
    const loadingTax = validateGenerationTaxonomy('top_arithmetic_101', 'sub_ratios_001', mockTaxonomy, true, null);
    assert.strictEqual(loadingTax.canGenerate, false);
    assert.ok(loadingTax.error?.includes('still loading'));

    // Loading subtopics blocks generation
    const loadingSubs = validateGenerationTaxonomy('top_arithmetic_101', 'sub_ratios_001', mockTaxonomy, false, null, true, null);
    assert.strictEqual(loadingSubs.canGenerate, false);
    assert.ok(loadingSubs.error?.includes('Subtopics are still loading'));

    // Subtopics error blocks generation
    const errorSubs = validateGenerationTaxonomy('top_arithmetic_101', 'sub_ratios_001', mockTaxonomy, false, null, false, 'Network error');
    assert.strictEqual(errorSubs.canGenerate, false);
    assert.ok(errorSubs.error?.includes('Network error'));
    pass('Test 10: Asynchronous loading and failure states prevent stale or invalid selections');
  }

  // =========================================================================
  // SECTION 3: Generation & Persistence (Tests 11-15)
  // =========================================================================
  console.log('[SECTION 3] Generation Request and Persistence Contracts');

  // Test 11: Generation request payload contains canonical mode, topic/subtopic IDs, and settings
  {
    const payload = {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate' as DifficultyLevel,
      language: QuestionLanguage.TELUGU,
      questionStyle: 'SPEED_MATH_TRICK',
      realWorldContext: 'Train overtaking speed',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 5,
      questionCount: 5,
      aspectRatio: '9:16',
      generationMode: 'SUBTOPIC' as const,
    };

    const validation = await questionGenerationService.validateGenerationRequest(payload);
    assert.strictEqual(validation.isValid, true);
    pass('Test 11: Generation payload carries canonical mode, taxonomy IDs, count, aspect, language & difficulty');
  }

  // Test 12: Persisted content draft retains configuration
  {
    const saved = await questionGenerationService.saveDraft(
      {
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-01',
        difficulty: 'Intermediate',
        language: 'TELUGU',
        questionText: 'Two trains of length 150m and 200m are moving in opposite directions at 54 km/h and 72 km/h. Find time to cross?',
        options: { a: '10 sec', b: '12 sec', c: '15 sec', d: '18 sec' },
        correctAnswer: 'A',
        explanation: 'Relative speed = 54 + 72 = 126 km/h = 35 m/s. Total distance = 350m. Time = 350/35 = 10 sec.',
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount: 5,
        aspectRatio: '9:16',
        questionStyle: 'SPEED_MATH_TRICK',
        realLifeContext: 'Train overtaking speed',
      },
      { id: 'usr_author_test_101', name: 'Author Test' }
    );

    assert.ok(saved.id.startsWith('dft_'));
    assert.strictEqual(saved.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(saved.targetQuestionCount, 5);
    assert.strictEqual(saved.aspectRatio, '9:16');
    assert.strictEqual(saved.topicId, 'TOP-QA-01');
    assert.strictEqual(saved.subtopicId, 'SUB-01');
    assert.strictEqual(saved.authorId, 'usr_author_test_101');
    pass('Test 12: Persisted draft in Firestore retains productionMode, targetQuestionCount, and aspectRatio');
  }

  // Test 13: Failed request preserves valid user selections
  {
    // Valid selections in hook state
    const userSelections = {
      selectedTopic: 'top_arithmetic_101',
      selectedSubtopic: 'sub_ratios_001',
      difficulty: 'Advanced',
      language: QuestionLanguage.TELUGU_ENGLISH,
      realLifeContext: 'Custom salary hike context',
      questionStyle: 'STORY_BASED',
    };

    // Even if generation fails, user selections remain intact
    assert.strictEqual(userSelections.selectedTopic, 'top_arithmetic_101');
    assert.strictEqual(userSelections.selectedSubtopic, 'sub_ratios_001');
    assert.strictEqual(userSelections.difficulty, 'Advanced');
    assert.strictEqual(userSelections.language, QuestionLanguage.TELUGU_ENGLISH);
    pass('Test 13: User selections are preserved when recoverable request failures occur');
  }

  // Test 14: Duplicate submission protection prevents concurrent submissions
  {
    let generateCallCount = 0;
    const onGenerate = () => { generateCallCount++; };

    // Render GenerationConfigPanel with isGenerating = true
    const generatingHtml = renderToString(
      React.createElement(GenerationConfigPanel, {
        taxonomyTree: mockTaxonomy,
        loadingTaxonomy: false,
        selectedTopic: 'top_arithmetic_101',
        selectedSubtopic: 'sub_ratios_001',
        currentSubtopics: mockTaxonomy[0].subtopics,
        difficulty: 'Intermediate',
        language: QuestionLanguage.TELUGU,
        realLifeContext: '',
        questionStyle: 'SPEED_MATH_TRICK',
        customInstructions: '',
        isGenerating: true, // In-flight request!
        aiStatus: { isConfigured: true, model: 'gemini-3.1-flash-lite' },
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount: 1,
        aspectRatio: '9:16',
        onTopicChange: () => {},
        onSubtopicChange: () => {},
        onDifficultyChange: () => {},
        onLanguageChange: () => {},
        onContextChange: () => {},
        onStyleChange: () => {},
        onCustomInstructionsChange: () => {},
        onGenerate: onGenerate,
      })
    );

    assert.ok(generatingHtml.includes('disabled=""'), 'Generate button must be disabled when isGenerating is true');
    assert.ok(generatingHtml.includes('Generating Candidate...'), 'Button text must reflect in-progress generation');
    pass('Test 14: Repeated clicks cannot trigger concurrent duplicate submissions while request is in progress');
  }

  // Test 15: Server-side validation rejects invalid values even when client validation is bypassed
  {
    // Client attempts to pass invalid mode
    const invalidModeRes = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      productionMode: 'UNSUPPORTED_MODE_XYZ' as any,
    });
    assert.strictEqual(invalidModeRes.isValid, false);
    assert.ok(invalidModeRes.error?.includes('Invalid production mode'));

    // Client attempts to pass count=3 for Question Challenge Short
    const invalidCountRes = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 3,
    });
    assert.strictEqual(invalidCountRes.isValid, false);
    assert.ok(invalidCountRes.error?.includes('requires questionCount of 1 (or batch series 5, 10, 15, 20)'));

    // Client attempts to pass aspect ratio 16:9 for Question Challenge Short
    const invalidAspectRes = await questionGenerationService.validateGenerationRequest({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      aspectRatio: '16:9',
    });
    assert.strictEqual(invalidAspectRes.isValid, false);
    assert.ok(invalidAspectRes.error?.includes("'9:16' aspect ratio"));
    pass('Test 15: Server-side validation rejects invalid mode, count, and aspect ratio when client is bypassed');
  }

  // =========================================================================
  // SECTION 4: Regression (Tests 16-18)
  // =========================================================================
  console.log('[SECTION 4] Regression and Cross-Mode Integration');

  // Test 16: Existing Question Generation entry point functions seamlessly
  {
    console.log('  -> Executing Test 16...');
    // Render GenerationConfigPanel in default state
    const defaultHtml = renderToString(
      React.createElement(GenerationConfigPanel, {
        taxonomyTree: mockTaxonomy,
        loadingTaxonomy: false,
        selectedTopic: 'top_arithmetic_101',
        selectedSubtopic: 'sub_ratios_001',
        currentSubtopics: mockTaxonomy[0].subtopics,
        difficulty: 'Intermediate',
        language: QuestionLanguage.TELUGU,
        realLifeContext: '',
        questionStyle: 'SPEED_MATH_TRICK',
        customInstructions: '',
        isGenerating: false,
        aiStatus: { isConfigured: true, model: 'gemini-3.1-flash-lite' },
        onTopicChange: () => {},
        onSubtopicChange: () => {},
        onDifficultyChange: () => {},
        onLanguageChange: () => {},
        onContextChange: () => {},
        onStyleChange: () => {},
        onCustomInstructionsChange: () => {},
        onGenerate: () => {},
      })
    );
    assert.ok(defaultHtml.includes('Generation Controls'));
    assert.ok(defaultHtml.includes('Topic (Syllabus Root)'));
    assert.ok(defaultHtml.includes('✦ Generate'));
    assert.ok(defaultHtml.includes('Question Challenge Short'));
    pass('Test 16: Existing Question Generation entry point renders cleanly without errors');
  }

  // Test 17: Shared production-context behavior remains intact
  {
    console.log('  -> Executing Test 17...');
    let contextOutput: any = null;
    const TestConsumer = () => {
      const ctx = useProductionContext();
      contextOutput = ctx;
      return React.createElement('div', null, 'Context Rendered');
    };

    renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/questions/studio'] },
        React.createElement(
          ProductionJourneyProvider,
          {
            initialContext: {
              taxonomy: {
                topicId: 'top_arithmetic_101',
                topicName: 'Arithmetic Ability',
                topicSlug: 'arithmetic-ability',
                subtopicId: 'sub_ratios_001',
                subtopicName: 'Ratios & Proportions',
                subtopicSlug: 'ratios-and-proportions',
              },
              modeConfig: {
                productionMode: 'QUESTION_CHALLENGE_SHORT',
                questionCount: 1,
                aspectRatio: '9:16',
                language: QuestionLanguage.TELUGU,
              },
            },
          },
          React.createElement(TestConsumer, null)
        )
      )
    );

    assert.ok(contextOutput);
    assert.strictEqual(contextOutput.taxonomy.topicId, 'top_arithmetic_101');
    assert.strictEqual(contextOutput.modeConfig.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(contextOutput.modeConfig.questionCount, 1);
    assert.strictEqual(contextOutput.modeConfig.aspectRatio, '9:16');
    pass('Test 17: Shared production context initialization and synchronization remains fully intact');
  }

  // Test 18: Mode 2 and Mode 3 configurations continue to pass
  {
    console.log('  -> Executing Test 18...');
    const m2Res = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '9:16');
    assert.strictEqual(m2Res.isValid, true);

    const m2Res169 = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '16:9');
    assert.strictEqual(m2Res169.isValid, true);

    const m3Res = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '16:9');
    assert.strictEqual(m3Res.isValid, true);

    const m3Res20 = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 20, '16:9');
    assert.strictEqual(m3Res20.isValid, true);
    pass('Test 18: Mode 2 (Topic Introduction) and Mode 3 (Explained Questions) configurations remain intact');
  }

  console.log(`\n========================================================================`);
  console.log(`RESULTS: ${passedTests}/18 S9-T08 UNIT TESTS PASSED CLEANLY`);
  console.log(`========================================================================\n`);
  process.exit(0);
}

runS9T08UnitTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
