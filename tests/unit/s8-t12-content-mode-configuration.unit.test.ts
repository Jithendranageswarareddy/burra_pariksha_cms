/**
 * BURRA PARIKSHA CMS — S8-T12 Unit Test Suite
 * Content-Mode Selection and Configuration
 *
 * Verifies all mandatory requirements of S8-T12 using actual production code:
 * 1. Canonical Three Modes & Defaults:
 *    - Mode 1: QUESTION_CHALLENGE_SHORT (default 1 question, vertical 9:16)
 *    - Mode 2: TOPIC_INTRODUCTION (exactly 0 questions, default 9:16)
 *    - Mode 3: EXPLAINED_QUESTIONS_VIDEO (default 10 questions, fixed 16:9)
 * 2. Approved Question Counts & Invalid Counts:
 *    - Mode 1: [1, 5, 10, 15, 20] approved; non-approved rejected
 *    - Mode 2: strictly 0 approved; >0 rejected
 *    - Mode 3: [5, 10, 15, 20] approved; 1 and non-approved rejected
 * 3. Mode-Specific Aspect-Ratio Constraints:
 *    - Mode 1: strictly 9:16
 *    - Mode 2: selectable 9:16 or 16:9
 *    - Mode 3: strictly 16:9
 * 4. Mode-Specific Control Visibility (UI renderToString):
 *    - Mode 1: renders question count select [1, 5, 10, 15, 20] and fixed 9:16 badge
 *    - Mode 2: strictly omits question count input; renders 9:16 vs 16:9 aspect ratio selector
 *    - Mode 3: renders question count select [5, 10, 15, 20] and fixed 16:9 badge
 * 5. Configuration Preservation Across Mode Switches:
 *    - Switching modes preserves custom settings and restores them on return without stale leaks
 * 6. Initialization & Restoration from Context, Draft Values, and Props:
 *    - ModeSelectionManager & ProductionModeModal restore initialMode, initialCount, and initialAspect
 *    - ProductionJourneyContext persists and provides modeConfig across consumers
 * 7. Enforce Submission Validation:
 *    - Validates configuration before accepting mode selection
 *    - Rejects invalid modes, missing required settings, unsupported counts, and incompatible aspect ratios
 *    - TOPIC_INTRODUCTION treated as non-question mode with no question-field requirement
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
  ProductionContext,
} from '../../shared';

import {
  ProductionModeModal,
  ModeSelectionManager,
  resolveModeDefaultConfig,
  MODE_OPTIONS,
} from '../../frontend/features/question-generation/components/ProductionModeModal';

import {
  ProductionJourneyProvider,
  useProductionContext,
} from '../../frontend/contexts/ProductionJourneyContext';

import { evaluateStep01CandidateState } from '../../shared/contracts/question-generation/question-generation.contract';
import { useQuestionGeneration } from '../../frontend/features/question-generation/hooks/useQuestionGeneration';

async function runS8T12UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T12 TESTS: Content-Mode Selection and Configuration');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  // =========================================================================
  // SECTION 1: All Three Modes and Their Canonical Defaults
  // =========================================================================
  console.log('[SECTION 1] Canonical Modes and Default Configurations');

  // Test 1.1: MODE_OPTIONS metadata aligns with Sprint 8 specifications
  assert.strictEqual(MODE_OPTIONS.length, 3, 'Must have exactly 3 production mode options');
  const [opt1, opt2, opt3] = MODE_OPTIONS;
  assert.strictEqual(opt1.id, 'QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(opt1.defaultCount, 1);
  assert.strictEqual(opt1.defaultAspect, '9:16');
  assert.deepStrictEqual(opt1.allowedCounts, [1, 5, 10, 15, 20]);
  assert.deepStrictEqual(opt1.allowedAspects, ['9:16']);

  assert.strictEqual(opt2.id, 'TOPIC_INTRODUCTION');
  assert.strictEqual(opt2.defaultCount, 0);
  assert.strictEqual(opt2.defaultAspect, '9:16');
  assert.deepStrictEqual(opt2.allowedCounts, [0]);
  assert.deepStrictEqual(opt2.allowedAspects, ['9:16', '16:9']);

  assert.strictEqual(opt3.id, 'EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(opt3.defaultCount, 10);
  assert.strictEqual(opt3.defaultAspect, '16:9');
  assert.deepStrictEqual(opt3.allowedCounts, [5, 10, 15, 20]);
  assert.deepStrictEqual(opt3.allowedAspects, ['16:9']);
  pass('1.1 MODE_OPTIONS metadata reflects canonical Sprint 8 mode rules');

  // Test 1.2: resolveModeDefaultConfig produces canonical defaults
  const def1 = resolveModeDefaultConfig('QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(def1.questionCount, 1, 'Mode 1 default count must be 1');
  assert.strictEqual(def1.aspectRatio, '9:16', 'Mode 1 default aspect ratio must be 9:16');

  const def2 = resolveModeDefaultConfig('TOPIC_INTRODUCTION');
  assert.strictEqual(def2.questionCount, 0, 'Mode 2 count must be 0');
  assert.strictEqual(def2.aspectRatio, '9:16', 'Mode 2 default aspect ratio must be 9:16');

  const def3 = resolveModeDefaultConfig('EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(def3.questionCount, 10, 'Mode 3 default count must be 10');
  assert.strictEqual(def3.aspectRatio, '16:9', 'Mode 3 default aspect ratio must be 16:9');
  pass('1.2 resolveModeDefaultConfig returns canonical defaults for all 3 modes');

  // Test 1.3: ModeSelectionManager initializes with canonical defaults
  const managerDefault = new ModeSelectionManager();
  assert.strictEqual(managerDefault.getSelectedMode(), 'QUESTION_CHALLENGE_SHORT');
  assert.deepStrictEqual(managerDefault.getCurrentConfig(), { questionCount: 1, aspectRatio: '9:16' });
  const valDefault = managerDefault.validate();
  assert.strictEqual(valDefault.isValid, true);
  pass('1.3 ModeSelectionManager defaults to Mode 1 with valid config');

  // =========================================================================
  // SECTION 2: Approved Question Counts & Invalid Counts Validation
  // =========================================================================
  console.log('\n[SECTION 2] Approved and Invalid Question Counts');

  // Test 2.1: Mode 1 approved counts (1 standalone, 5/10/15/20 series batches)
  for (const count of [1, 5, 10, 15, 20]) {
    const res = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', count, '9:16');
    assert.strictEqual(res.isValid, true, `Mode 1 should approve question count ${count}`);
  }
  pass('2.1 Mode 1 approves question counts 1, 5, 10, 15, and 20');

  // Test 2.2: Mode 1 invalid counts
  for (const count of [0, 2, 3, 4, 7, 12, 25, -1]) {
    const res = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', count, '9:16');
    assert.strictEqual(res.isValid, false, `Mode 1 must reject invalid question count ${count}`);
    assert(res.error?.includes('requires questionCount of 1 (or batch series 5, 10, 15, 20)'));
  }
  pass('2.2 Mode 1 strictly rejects invalid question counts (0, 2, 3, 4, 7, 25, etc.)');

  // Test 2.3: Mode 2 strictly requires 0 questions
  const resMode2Zero = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '9:16');
  assert.strictEqual(resMode2Zero.isValid, true, 'Mode 2 approves count 0');

  for (const count of [1, 2, 5, 10, -1]) {
    const res = validateProductionModeConfig('TOPIC_INTRODUCTION', count, '9:16');
    assert.strictEqual(res.isValid, false, `Mode 2 must reject count ${count}`);
    assert(res.error?.includes('requires questionCount to be 0'));
  }
  pass('2.3 Mode 2 strictly enforces questionCount === 0');

  // Test 2.4: Mode 3 approved counts [5, 10, 15, 20]
  for (const count of [5, 10, 15, 20]) {
    const res = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', count, '16:9');
    assert.strictEqual(res.isValid, true, `Mode 3 should approve question count ${count}`);
  }
  pass('2.4 Mode 3 approves question counts 5, 10, 15, and 20');

  // Test 2.5: Mode 3 rejects count 1 (standalone short not permitted) and non-approved counts
  for (const count of [0, 1, 2, 3, 4, 7, 12, 30]) {
    const res = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', count, '16:9');
    assert.strictEqual(res.isValid, false, `Mode 3 must reject question count ${count}`);
    assert(res.error?.includes('requires questionCount to be 5, 10, 15, or 20'));
  }
  pass('2.5 Mode 3 rejects count 1 and arbitrary counts');

  // =========================================================================
  // SECTION 3: Mode-Specific Aspect-Ratio Constraints
  // =========================================================================
  console.log('\n[SECTION 3] Aspect-Ratio Constraints');

  // Test 3.1: Mode 1 vertical short strictly requires 9:16
  const m1ValidAspect = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '9:16');
  assert.strictEqual(m1ValidAspect.isValid, true);
  const m1InvalidAspect = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '16:9');
  assert.strictEqual(m1InvalidAspect.isValid, false);
  assert(m1InvalidAspect.error?.includes("requires '9:16' aspect ratio"));
  pass('3.1 Mode 1 enforces vertical 9:16 and rejects 16:9');

  // Test 3.2: Mode 2 allows both 9:16 and 16:9
  const m2Vert = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '9:16');
  assert.strictEqual(m2Vert.isValid, true);
  const m2Horiz = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '16:9');
  assert.strictEqual(m2Horiz.isValid, true);
  const m2Invalid = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '4:3' as any);
  assert.strictEqual(m2Invalid.isValid, false);
  pass('3.2 Mode 2 permits selectable 9:16 or 16:9 aspect ratios');

  // Test 3.3: Mode 3 landscape masterclass strictly requires 16:9
  const m3ValidAspect = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '16:9');
  assert.strictEqual(m3ValidAspect.isValid, true);
  const m3InvalidAspect = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '9:16');
  assert.strictEqual(m3InvalidAspect.isValid, false);
  assert(m3InvalidAspect.error?.includes("requires '16:9' aspect ratio"));
  pass('3.3 Mode 3 enforces landscape 16:9 and rejects 9:16');

  // =========================================================================
  // SECTION 4: Mode-Specific Control Visibility (UI Render Tests)
  // =========================================================================
  console.log('\n[SECTION 4] Production UI Control Visibility');

  // Test 4.1: Mode 1 UI renders question-count selector and fixed 9:16 badge
  const m1Html = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: true,
      initialMode: 'QUESTION_CHALLENGE_SHORT',
      onSelectMode: () => {},
    })
  );
  assert(m1Html.includes('data-testid="mode-question-count-select"'), 'Mode 1 must render question count selector');
  assert(m1Html.includes('data-testid="mode-aspect-ratio-fixed"'), 'Mode 1 must render fixed aspect ratio badge');
  assert(m1Html.includes('9:16 (Vertical Short)'), 'Mode 1 badge must say 9:16 (Vertical Short)');
  assert(!m1Html.includes('data-testid="mode-aspect-ratio-select"'), 'Mode 1 must NOT render aspect ratio select');
  assert(m1Html.includes('1 Question (Standalone Short)'), 'Mode 1 must list 1 Question option');
  assert(m1Html.includes('5 Questions (Series Batch)'), 'Mode 1 must list 5 Questions batch option');
  pass('4.1 Mode 1 UI displays question count dropdown and fixed 9:16 badge');

  // Test 4.2: Mode 2 UI strictly omits question-count input and renders aspect-ratio select
  const m2Html = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: true,
      initialMode: 'TOPIC_INTRODUCTION',
      onSelectMode: () => {},
    })
  );
  assert(!m2Html.includes('data-testid="mode-question-count-select"'), 'Mode 2 must NOT render question count select');
  assert(m2Html.includes('data-testid="mode-aspect-ratio-select"'), 'Mode 2 must render aspect ratio select');
  assert(m2Html.includes('9:16 (Vertical Short)'), 'Mode 2 select must have 9:16 option');
  assert(m2Html.includes('16:9 (Horizontal Video)'), 'Mode 2 select must have 16:9 option');
  assert(!m2Html.includes('data-testid="mode-aspect-ratio-fixed"'), 'Mode 2 must NOT render fixed badge');
  pass('4.2 Mode 2 UI strictly omits question-count input and provides selectable 9:16 / 16:9 dropdown');

  // Test 4.3: Mode 3 UI renders count selector (5, 10, 15, 20) and fixed 16:9 badge
  const m3Html = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: true,
      initialMode: 'EXPLAINED_QUESTIONS_VIDEO',
      onSelectMode: () => {},
    })
  );
  assert(m3Html.includes('data-testid="mode-question-count-select"'), 'Mode 3 must render question count selector');
  assert(m3Html.includes('10 Questions (Standard)'), 'Mode 3 must have 10 Questions option');
  assert(m3Html.includes('20 Questions'), 'Mode 3 must have 20 Questions option');
  assert(!m3Html.includes('1 Question (Standalone Short)'), 'Mode 3 must NOT have 1 Question option');
  assert(m3Html.includes('data-testid="mode-aspect-ratio-fixed"'), 'Mode 3 must render fixed aspect ratio badge');
  assert(m3Html.includes('16:9 (Landscape Masterclass)'), 'Mode 3 badge must say 16:9');
  assert(!m3Html.includes('data-testid="mode-aspect-ratio-select"'), 'Mode 3 must NOT render aspect ratio select');
  pass('4.3 Mode 3 UI displays explained questions count dropdown and fixed 16:9 badge');

  // Test 4.4: Closed modal renders nothing
  const closedHtml = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: false,
      onSelectMode: () => {},
    })
  );
  assert.strictEqual(closedHtml, '', 'Closed modal should return empty string');
  pass('4.4 Closed modal returns null / empty render');

  // =========================================================================
  // SECTION 5: Configuration Preservation Across Mode Switches
  // =========================================================================
  console.log('\n[SECTION 5] Configuration Preservation Across Mode Switches');

  const manager = new ModeSelectionManager('QUESTION_CHALLENGE_SHORT');

  // 1. Configure Mode 1 with series batch count 15
  manager.setQuestionCount(15);
  assert.deepStrictEqual(manager.getCurrentConfig(), { questionCount: 15, aspectRatio: '9:16' });

  // 2. Switch to Mode 2 and configure aspect ratio 16:9
  manager.selectMode('TOPIC_INTRODUCTION');
  assert.strictEqual(manager.getSelectedMode(), 'TOPIC_INTRODUCTION');
  manager.setAspectRatio('16:9');
  assert.deepStrictEqual(manager.getCurrentConfig(), { questionCount: 0, aspectRatio: '16:9' });

  // 3. Switch to Mode 3 and configure question count 20
  manager.selectMode('EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(manager.getSelectedMode(), 'EXPLAINED_QUESTIONS_VIDEO');
  manager.setQuestionCount(20);
  assert.deepStrictEqual(manager.getCurrentConfig(), { questionCount: 20, aspectRatio: '16:9' });

  // 4. Return to Mode 1 -> count 15 is restored!
  manager.selectMode('QUESTION_CHALLENGE_SHORT');
  assert.deepStrictEqual(
    manager.getCurrentConfig(),
    { questionCount: 15, aspectRatio: '9:16' },
    'Returning to Mode 1 must restore preserved count 15'
  );
  assert.strictEqual(manager.validate().isValid, true);

  // 5. Return to Mode 2 -> aspect 16:9 is restored, questionCount remains 0!
  manager.selectMode('TOPIC_INTRODUCTION');
  assert.deepStrictEqual(
    manager.getCurrentConfig(),
    { questionCount: 0, aspectRatio: '16:9' },
    'Returning to Mode 2 must restore preserved aspect ratio 16:9 and count 0'
  );
  assert.strictEqual(manager.validate().isValid, true);

  // 6. Return to Mode 3 -> count 20 is restored!
  manager.selectMode('EXPLAINED_QUESTIONS_VIDEO');
  assert.deepStrictEqual(
    manager.getCurrentConfig(),
    { questionCount: 20, aspectRatio: '16:9' },
    'Returning to Mode 3 must restore preserved count 20'
  );
  assert.strictEqual(manager.validate().isValid, true);

  // 7. Verify all configurations are preserved in map without stale cross-talk
  const allConfigs = manager.getAllConfigs();
  assert.strictEqual(allConfigs.QUESTION_CHALLENGE_SHORT.questionCount, 15);
  assert.strictEqual(allConfigs.QUESTION_CHALLENGE_SHORT.aspectRatio, '9:16');
  assert.strictEqual(allConfigs.TOPIC_INTRODUCTION.questionCount, 0);
  assert.strictEqual(allConfigs.TOPIC_INTRODUCTION.aspectRatio, '16:9');
  assert.strictEqual(allConfigs.EXPLAINED_QUESTIONS_VIDEO.questionCount, 20);
  assert.strictEqual(allConfigs.EXPLAINED_QUESTIONS_VIDEO.aspectRatio, '16:9');
  pass('5.1 Mode switches preserve customized settings per mode and restore them on return');

  // =========================================================================
  // SECTION 6: Initialization and Restoration from Existing Context / Draft
  // =========================================================================
  console.log('\n[SECTION 6] Initialization and Restoration from Context & Props');

  // Test 6.1: Manager initializes with custom initialCount and initialAspect
  const customM1Manager = new ModeSelectionManager('QUESTION_CHALLENGE_SHORT', 20, '9:16');
  assert.deepStrictEqual(customM1Manager.getCurrentConfig(), { questionCount: 20, aspectRatio: '9:16' });

  const customM2Manager = new ModeSelectionManager('TOPIC_INTRODUCTION', undefined, '16:9');
  assert.deepStrictEqual(customM2Manager.getCurrentConfig(), { questionCount: 0, aspectRatio: '16:9' });

  const customM3Manager = new ModeSelectionManager('EXPLAINED_QUESTIONS_VIDEO', 5, '16:9');
  assert.deepStrictEqual(customM3Manager.getCurrentConfig(), { questionCount: 5, aspectRatio: '16:9' });
  pass('6.1 ModeSelectionManager initializes correctly from custom initialMode/Count/Aspect');

  // Test 6.2: ProductionModeModal renders with initial props restored
  const renderedPropM2 = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: true,
      initialMode: 'TOPIC_INTRODUCTION',
      initialAspect: '16:9',
      onSelectMode: () => {},
    })
  );
  assert(renderedPropM2.includes('value="16:9" selected'), '16:9 should be selected when initialized with initialAspect 16:9');

  const renderedPropM3 = renderToString(
    React.createElement(ProductionModeModal, {
      isOpen: true,
      initialMode: 'EXPLAINED_QUESTIONS_VIDEO',
      initialCount: 20,
      onSelectMode: () => {},
    })
  );
  assert(renderedPropM3.includes('value="20" selected'), 'Count 20 should be selected when initialized with initialCount 20');
  pass('6.2 ProductionModeModal UI preselects values supplied by initialCount/initialAspect props');

  // Test 6.3: ProductionJourneyContext persistence & hydration
  let capturedContextValue: any = null;
  const ContextInspector: React.FC = () => {
    const ctx = useProductionContext();
    capturedContextValue = ctx;
    return React.createElement('div', { id: 'ctx-inspector' }, ctx.modeConfig.productionMode);
  };

  const initialTestContext: Partial<ProductionContext> = {
    ...DEFAULT_PRODUCTION_CONTEXT,
    modeConfig: {
      productionMode: 'TOPIC_INTRODUCTION',
      questionCount: 0,
      aspectRatio: '16:9',
      language: QuestionLanguage.TELUGU,
    },
  };

  const ctxHtml = renderToString(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        ProductionJourneyProvider,
        { initialContext: initialTestContext as ProductionContext },
        React.createElement(ContextInspector)
      )
    )
  );

  assert(ctxHtml.includes('TOPIC_INTRODUCTION'), 'Provider should hydrate initialContext mode');
  assert.strictEqual(capturedContextValue.modeConfig.productionMode, 'TOPIC_INTRODUCTION');
  assert.strictEqual(capturedContextValue.modeConfig.questionCount, 0);
  assert.strictEqual(capturedContextValue.modeConfig.aspectRatio, '16:9');
  pass('6.3 ProductionJourneyContext hydrations preserves and provides modeConfig across components');

  // =========================================================================
  // SECTION 7: Enforce Submission Validation & Invariant Guarding
  // =========================================================================
  console.log('\n[SECTION 7] Submission Validation and Invariant Boundaries');

  // Test 7.1: Missing mode is rejected
  const missingModeRes = validateProductionModeConfig(undefined as any, 1, '9:16');
  assert.strictEqual(missingModeRes.isValid, false);
  assert.strictEqual(missingModeRes.error, 'Production mode is required.');
  pass('7.1 validateProductionModeConfig rejects undefined/empty production mode');

  // Test 7.2: Invalid mode name is rejected
  const invalidModeRes = validateProductionModeConfig('INVALID_MODE' as any, 1, '9:16');
  assert.strictEqual(invalidModeRes.isValid, false);
  assert(invalidModeRes.error?.includes('Invalid production mode'));
  pass('7.2 validateProductionModeConfig rejects unknown/unsupported mode strings');

  // Test 7.3: evaluateStep01CandidateState treats TOPIC_INTRODUCTION as non-question mode
  // Notice: no optionA, optionB, optionC, optionD, or correctAnswer required!
  const validTopicIntroCandidate = {
    productionMode: 'TOPIC_INTRODUCTION' as ContentProductionMode,
    introductoryConcept: 'Comprehensive fundamental syllabus principles covering Indian economy.',
    targetQuestionCount: 0,
    aspectRatio: '9:16' as const,
  };

  const m2Eval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: validTopicIntroCandidate,
  });
  assert.strictEqual(m2Eval.canContinue, true, 'Topic Introduction candidate with concept statement must be valid');
  assert.strictEqual(m2Eval.state, 'VALID');
  pass('7.3 evaluateStep01CandidateState validates TOPIC_INTRODUCTION without requiring question-specific fields');

  // Test 7.4: evaluateStep01CandidateState rejects short/empty concept for TOPIC_INTRODUCTION
  const shortConceptEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'TOPIC_INTRODUCTION',
      introductoryConcept: 'Too short',
      targetQuestionCount: 0,
      aspectRatio: '9:16',
    },
  });
  assert.strictEqual(shortConceptEval.canContinue, false);
  assert(shortConceptEval.errors.some((e) => e.includes('at least 15 characters')));
  pass('7.4 evaluateStep01CandidateState rejects sub-15 character concept statements for Mode 2');

  // Test 7.5: evaluateStep01CandidateState rejects Mode 3 when required question count is incomplete
  const incompleteM3Eval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      introductoryConcept: 'Masterclass introductory overview explaining permutations.',
      targetQuestionCount: 5,
      aspectRatio: '16:9',
      questions: [
        {
          questionNumber: 1,
          questionText: 'Question 1 solve',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          optionA: 'A',
          optionB: 'B',
          optionC: 'C',
          optionD: 'D',
          correctAnswer: 'A',
          explanation: 'Expl 1',
        },
      ],
    },
  });
  assert.strictEqual(incompleteM3Eval.canContinue, false);
  assert(incompleteM3Eval.errors.some((e) => e.includes('Requires 5 explained questions (currently has 1)')));
  pass('7.5 evaluateStep01CandidateState enforces target question count for EXPLAINED_QUESTIONS_VIDEO');

  // Test 7.6: Incompatible aspect ratio in candidate state is rejected
  const m3BadAspectEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      introductoryConcept: 'Masterclass introductory overview explaining permutations.',
      targetQuestionCount: 5,
      aspectRatio: '9:16' as any,
    },
  });
  assert.strictEqual(m3BadAspectEval.canContinue, false);
  assert(m3BadAspectEval.errors.some((e) => e.includes('16:9 aspect ratio')));
  pass('7.6 evaluateStep01CandidateState rejects incompatible aspect ratios in candidate state');

  // =========================================================================
  // SECTION 8: Production Hook (useQuestionGeneration) Mode Configuration
  // =========================================================================
  console.log('\n[SECTION 8] Production Hook (useQuestionGeneration) Mode Lifecycle');

  // Test 8.1: Hook initializes from URL query parameters (Mode 2)
  let capturedHookM2: any = null;
  const HookHarnessM2: React.FC = () => {
    capturedHookM2 = useQuestionGeneration();
    return React.createElement('div', null, 'HarnessM2');
  };

  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/questions/studio?mode=TOPIC_INTRODUCTION&aspect=16:9'] },
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(HookHarnessM2)
      )
    )
  );

  assert.strictEqual(capturedHookM2.productionMode, 'TOPIC_INTRODUCTION');
  assert.strictEqual(capturedHookM2.targetQuestionCount, 0);
  assert.strictEqual(capturedHookM2.aspectRatio, '16:9');
  assert.strictEqual(capturedHookM2.isModeModalOpen, false, 'Modal should not open when valid mode is in URL');
  pass('8.1 Hook initializes correctly from URL parameters for Mode 2 (TOPIC_INTRODUCTION)');

  // Test 8.2: Hook initializes from URL query parameters (Mode 3)
  let capturedHookM3: any = null;
  const HookHarnessM3: React.FC = () => {
    capturedHookM3 = useQuestionGeneration();
    return React.createElement('div', null, 'HarnessM3');
  };

  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/questions/studio?mode=EXPLAINED_QUESTIONS_VIDEO&count=15'] },
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(HookHarnessM3)
      )
    )
  );

  assert.strictEqual(capturedHookM3.productionMode, 'EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(capturedHookM3.targetQuestionCount, 15);
  assert.strictEqual(capturedHookM3.aspectRatio, '16:9');
  assert.strictEqual(capturedHookM3.isModeModalOpen, false);
  pass('8.2 Hook initializes correctly from URL parameters for Mode 3 (EXPLAINED_QUESTIONS_VIDEO)');

  // Test 8.3: Hook opens mode selection modal when no mode and no draft specified
  let capturedHookEmpty: any = null;
  const HookHarnessEmpty: React.FC = () => {
    capturedHookEmpty = useQuestionGeneration();
    return React.createElement('div', null, 'HarnessEmpty');
  };

  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/questions/studio'] },
      React.createElement(
        ProductionJourneyProvider,
        {
          initialContext: {
            ...DEFAULT_PRODUCTION_CONTEXT,
            modeConfig: {
              ...DEFAULT_PRODUCTION_CONTEXT.modeConfig,
              productionMode: '' as any,
            },
          },
        },
        React.createElement(HookHarnessEmpty)
      )
    )
  );

  assert.strictEqual(capturedHookEmpty.productionMode, null);
  assert.strictEqual(capturedHookEmpty.isModeModalOpen, true, 'Modal must open when no mode or draft specified');
  pass('8.3 Hook opens mode selection modal when no mode configuration is present');

  // Test 8.4: Hook restores mode configuration from ProductionJourneyContext
  let capturedHookContext: any = null;
  const HookHarnessContext: React.FC = () => {
    capturedHookContext = useQuestionGeneration();
    return React.createElement('div', null, 'HarnessContext');
  };

  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/questions/studio'] },
      React.createElement(
        ProductionJourneyProvider,
        {
          initialContext: {
            ...DEFAULT_PRODUCTION_CONTEXT,
            modeConfig: {
              productionMode: 'QUESTION_CHALLENGE_SHORT',
              questionCount: 5,
              aspectRatio: '9:16',
              language: QuestionLanguage.TELUGU,
            },
          },
        },
        React.createElement(HookHarnessContext)
      )
    )
  );

  assert.strictEqual(capturedHookContext.productionMode, 'QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(capturedHookContext.targetQuestionCount, 5);
  assert.strictEqual(capturedHookContext.aspectRatio, '9:16');
  assert.strictEqual(capturedHookContext.isModeModalOpen, false);
  pass('8.4 Hook restores mode configuration from ProductionJourneyContext across navigation');

  console.log('\n========================================================================');
  console.log(`ALL ${passedTests} S8-T12 UNIT & INTEGRATION TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runS8T12UnitTests().catch((err) => {
  console.error('\n❌ S8-T12 Test Suite Failed:', err);
  process.exit(1);
});
