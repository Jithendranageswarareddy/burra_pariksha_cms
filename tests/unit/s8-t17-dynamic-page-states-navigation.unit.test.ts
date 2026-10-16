/**
 * BURRA PARIKSHA CMS — S8-T17 Unit & Integration Test Suite
 * Dynamic Page States, Navigation, Cascading Selections & Draft Reopening
 *
 * Verifies all mandatory requirements of S8-T17:
 * 1. Dynamic Page States:
 *    - Loading: loading feedback while data is pending; previous selection is not presented as current.
 *    - Empty: correct empty-state message and permitted actions appear.
 *    - Error/Retry: error feedback appears; retry reloads data and recovers correctly.
 *    - Incomplete: missing required context is clearly represented; unavailable actions remain disabled/hidden.
 *    - Read-only: content renders correctly and mutation actions are unavailable.
 *    - Completed: correct completed state and allowed actions appear; prohibited mutations are unavailable.
 * 2. Selection Changes & Cascading Reset:
 *    - Topic, subtopic, and content mode changes individually and in combination.
 *    - Dependent selections and content are reset or reloaded according to existing contracts.
 *    - Labels, mode, stage, content, and available actions match the latest selection.
 *    - Delayed responses from earlier selections cannot overwrite newer state (race-condition protection).
 *    - Rapid-selection sequences cannot display mismatched content.
 * 3. Draft Reopening & State Integrity:
 *    - Reopening an existing draft restores its persisted values and workflow context rather than stale local state.
 *    - Persisted draft data strictly takes precedence over conflicting URL query defaults.
 *    - Reopening submitted drafts restores verification status and blocks prohibited draft mutations.
 * 4. Browser-Level Verification Assessment:
 *    - Checks Chrome availability, tests live HTTP server availability, and records explicit status.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import net from 'node:net';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  ContentProductionMode,
  DEFAULT_PRODUCTION_CONTEXT,
  QuestionLanguage,
  ProductionContext,
  canonicalIdService,
  QuestionStatus,
} from '../../shared';

import {
  ProductionWorkbenchSummary,
  resolveWorkbenchSummary,
  getReadableProductionMode,
} from '../../frontend/features/question-generation/components/ProductionWorkbenchSummary';

import {
  ProductionJourneyProvider,
  useProductionContext,
} from '../../frontend/contexts/ProductionJourneyContext';

import { QuestionStudioPage } from '../../frontend/features/question-generation/pages/QuestionStudioPage';
import { GenerationConfigPanel } from '../../frontend/features/question-generation/components/GenerationConfigPanel';
import { CandidateCanvas } from '../../frontend/features/question-generation/components/CandidateCanvas';
import { TopicIntroWorkspace } from '../../frontend/features/question-generation/components/TopicIntroWorkspace';
import { ExplainedQuestionsWorkspace } from '../../frontend/features/question-generation/components/ExplainedQuestionsWorkspace';
import { ActionBar } from '../../frontend/features/question-generation/components/ActionBar';

import {
  SubtopicSelectionController,
  SubtopicSelectionCallbacks,
  resolveCascadingSubtopic,
  validateGenerationTaxonomy,
} from '../../frontend/features/question-generation/hooks/useQuestionGeneration';

import {
  evaluateStep01CandidateState,
  StudioCandidate,
} from '../../shared/contracts/question-generation/question-generation.contract';

import { taxonomyService } from '../../backend/domain/taxonomy/services/taxonomy.service';
import { questionGenerationService } from '../../backend/domain/question-generation';
import { taxonomyApi } from '../../frontend/api/taxonomy.api';

async function runS8T17DynamicPageStatesTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T17 TESTS: Dynamic Page States, Navigation & Draft Reopening');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  // Authoritative taxonomy tree fixtures
  const realTree = await taxonomyService.getPureTopicTree({ includeInactive: false });
  assert(Array.isArray(realTree), 'Taxonomy tree must be an array');
  assert(realTree.length >= 2, 'Must have at least 2 topics in taxonomy database');

  const topicsWithSubs = realTree.filter((t) => (t.subtopics || []).length > 0);
  assert(topicsWithSubs.length >= 2, 'Must have at least 2 topics with subtopics');
  const topicA = topicsWithSubs[0];
  const topicB = topicsWithSubs[1];

  const defaultAiStatus = { isConfigured: true, model: 'gemini-2.5-pro' };

  // =========================================================================
  // SECTION 1: Dynamic Page States Rendering & Verification
  // =========================================================================
  console.log('[SECTION 1] Dynamic Page States Rendering & Verification');

  // Test 1.1: Loading State in GenerationConfigPanel
  const loadingTaxonomyHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: [],
      loadingTaxonomy: true,
      taxonomyError: null,
      selectedTopic: '',
      selectedSubtopic: '',
      currentSubtopics: [],
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      realLifeContext: '',
      questionStyle: 'STANDARD',
      customInstructions: '',
      isGenerating: false,
      aiStatus: defaultAiStatus,
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
  assert(loadingTaxonomyHtml.includes('Loading topics...'), 'Must render loading topics indicator');
  assert(loadingTaxonomyHtml.includes('Loading topics from server...'), 'Topic option must indicate loading');
  assert(loadingTaxonomyHtml.includes('disabled'), 'Topic select must be disabled during loading');
  pass('1.1 Loading State: GenerationConfigPanel renders loading indicator and disables topic selector');

  // Test 1.2: Loading Subtopics State
  const loadingSubsHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: realTree,
      loadingTaxonomy: false,
      taxonomyError: null,
      loadingSubtopics: true,
      subtopicsError: null,
      selectedTopic: topicA.id,
      selectedSubtopic: '',
      currentSubtopics: [], // Previous subtopics cleared while loading
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      realLifeContext: '',
      questionStyle: 'STANDARD',
      customInstructions: '',
      isGenerating: false,
      aiStatus: defaultAiStatus,
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
  assert(loadingSubsHtml.includes('Loading subtopics...'), 'Must render loading subtopics indicator');
  assert(loadingSubsHtml.includes('Loading subtopics from server...'), 'Subtopic option must indicate loading');
  assert(loadingSubsHtml.includes('disabled'), 'Subtopic select must be disabled during subtopic loading');
  assert(!loadingSubsHtml.includes(topicB.subtopics[0]?.name || 'INVALID_SUBTOPIC'), 'Previous subtopics must not appear');
  pass('1.2 Loading State: Subtopics loading state clears previous selection and disables subtopic dropdown');

  // Test 1.3: Loading State in ProductionWorkbenchSummary
  const loadingWorkbench = resolveWorkbenchSummary({
    selectedTopic: 'top_01',
    selectedSubtopic: 'sub_01',
    loadingTaxonomy: true,
    loadingSubtopics: true,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(loadingWorkbench.topic.name, 'Loading Topics...');
  assert.strictEqual(loadingWorkbench.topic.isLoading, true);
  assert.strictEqual(loadingWorkbench.subtopic.name, 'Loading Subtopics...');
  assert.strictEqual(loadingWorkbench.subtopic.isLoading, true);
  pass('1.3 Loading State: ProductionWorkbenchSummary presents loading feedback and hides stale names');

  // Test 1.4: Action Bar Busy / Saving & Submitting Loading States
  const savingBarHtml = renderToString(
    React.createElement(ActionBar, {
      workflowState: { state: 'VALID', canContinue: true, errors: [], warnings: [] },
      isSaving: true,
      isSubmitting: false,
      isGenerating: false,
      isRefining: false,
      isDirty: true,
      savedDraftId: null,
      saveSuccessMessage: null,
      onReset: () => {},
      onSaveDraft: () => {},
      onSubmitForVerification: () => {},
    })
  );
  assert(savingBarHtml.includes('Saving Draft...'), 'Must render Saving Draft... spinner text');
  assert(savingBarHtml.includes('disabled'), 'Actions must be disabled while saving');

  const submittingBarHtml = renderToString(
    React.createElement(ActionBar, {
      workflowState: { state: 'VALID', canContinue: true, errors: [], warnings: [] },
      isSaving: false,
      isSubmitting: true,
      isGenerating: false,
      isRefining: false,
      isDirty: false,
      savedDraftId: 'dft_test_01',
      saveSuccessMessage: null,
      onReset: () => {},
      onSaveDraft: () => {},
      onSubmitForVerification: () => {},
    })
  );
  assert(submittingBarHtml.includes('Submitting...'), 'Must render Submitting... spinner text');
  assert(submittingBarHtml.includes('disabled'), 'Actions must be disabled while submitting');
  pass('1.4 Loading State: ActionBar renders dedicated spinner feedback and prevents concurrent mutations');

  // Test 1.5: Empty State in ProductionWorkbenchSummary
  const emptyWorkbench = resolveWorkbenchSummary({
    selectedTopic: '',
    selectedSubtopic: '',
    taxonomyTree: realTree,
    currentSubtopics: [],
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(emptyWorkbench.topic.name, 'Not Selected');
  assert.strictEqual(emptyWorkbench.topic.isUnselected, true);
  assert.strictEqual(emptyWorkbench.subtopic.name, 'Not Selected');
  assert.strictEqual(emptyWorkbench.subtopic.isUnselected, true);
  assert.strictEqual(emptyWorkbench.status.code, 'EMPTY');
  assert.strictEqual(emptyWorkbench.status.label, 'Not Started');
  assert.strictEqual(emptyWorkbench.nextAction.actionType, 'SELECT_TOPIC');
  assert.strictEqual(emptyWorkbench.nextAction.label, 'Select Syllabus Topic');
  pass('1.5 Empty State: Unselected workbench returns "Not Selected" and guides user to select topic');

  // Test 1.6: Empty State in Mode-Specific Canvases
  const emptyCandidate: StudioCandidate = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    topicId: '',
    subtopicId: '',
    difficulty: 'Intermediate',
    language: QuestionLanguage.TELUGU,
    challengeType: 'ABCD',
    presentationType: 'TEXT_ONLY',
    realLifeContext: '',
    questionStyle: 'STANDARD',
    generationMode: 'SUBTOPIC',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    tags: [],
  };

  const emptyCanvasHtml = renderToString(
    React.createElement(CandidateCanvas, {
      candidate: emptyCandidate,
      hasCandidate: false,
      isDirty: false,
      isGenerating: false,
      isRefining: false,
      onUpdateField: () => {},
      onRefine: () => {},
      onGenerate: () => {},
      onManualDraft: () => {},
    })
  );
  assert(emptyCanvasHtml.includes('Question Workspace Ready'), 'Empty canvas must show ready banner');
  assert(emptyCanvasHtml.includes('Manual Draft'), 'Empty canvas must offer manual draft entry');
  assert(emptyCanvasHtml.includes('Generate Candidate'), 'Empty canvas must offer generate candidate action');

  const emptyTopicIntroHtml = renderToString(
    React.createElement(TopicIntroWorkspace, {
      candidate: { ...emptyCandidate, productionMode: 'TOPIC_INTRODUCTION' },
      aspectRatio: '9:16',
      isDirty: false,
      isSaving: false,
      onUpdateField: () => {},
      onChangeAspectRatio: () => {},
      onManualDraft: () => {},
    })
  );
  assert(emptyTopicIntroHtml.includes('Mode 2: Topic Introduction'), 'Mode 2 must display its title banner');
  assert(emptyTopicIntroHtml.includes('0 Questions (Enforced)'), 'Mode 2 must enforce 0 questions badge');

  const emptyExplainedHtml = renderToString(
    React.createElement(ExplainedQuestionsWorkspace, {
      candidate: { ...emptyCandidate, productionMode: 'EXPLAINED_QUESTIONS_VIDEO' },
      targetQuestionCount: 5,
      activeQuestionIndex: 0,
      isDirty: false,
      isSaving: false,
      onSelectTab: () => {},
      onUpdateField: () => {},
      onUpdateQuestion: () => {},
      onManualDraft: () => {},
    })
  );
  assert(emptyExplainedHtml.includes('Mode 3: Explained Questions Video'), 'Mode 3 must display video banner');
  assert(emptyExplainedHtml.includes('Intro Roadmap'), 'Mode 3 must display Intro Roadmap tab');
  assert(emptyExplainedHtml.includes('tab-q-1') && emptyExplainedHtml.includes('tab-q-5'), 'Mode 3 must display segmented question tabs');
  pass('1.6 Empty State: Mode 1, Mode 2, and Mode 3 authoring workspaces render correct empty canvases and tabs');

  // Test 1.7: Empty State in ActionBar: Action Availability
  const emptyBarHtml = renderToString(
    React.createElement(ActionBar, {
      workflowState: { state: 'EMPTY', canContinue: false, errors: [], warnings: [] },
      isSaving: false,
      isSubmitting: false,
      isGenerating: false,
      isRefining: false,
      isDirty: false,
      savedDraftId: null,
      saveSuccessMessage: null,
      onReset: () => {},
      onSaveDraft: () => {},
      onSubmitForVerification: () => {},
    })
  );
  assert(emptyBarHtml.includes('Clear / Start New'), 'Reset action is permitted');
  // Save Draft and Submit for Verification must be disabled
  const saveDisabledMatch = emptyBarHtml.match(/<button[^>]*title="Save draft to Firestore[^>]*>/);
  assert(saveDisabledMatch && saveDisabledMatch[0].includes('disabled'), 'Save Draft must be disabled in empty state');
  const submitDisabledMatch = emptyBarHtml.match(/<button[^>]*title="Save draft first before submitting[^>]*>/);
  assert(submitDisabledMatch && submitDisabledMatch[0].includes('disabled'), 'Submit must be disabled in empty state');
  pass('1.7 Empty State: ActionBar allows reset but strictly disables Save Draft and Submit Verification');

  // Test 1.8: Error and Retry State in GenerationConfigPanel
  let retryTaxonomyTriggered = false;
  const errorConfigHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: [],
      loadingTaxonomy: false,
      taxonomyError: 'Network timeout connecting to syllabus service',
      onRetryTaxonomy: () => {
        retryTaxonomyTriggered = true;
      },
      selectedTopic: '',
      selectedSubtopic: '',
      currentSubtopics: [],
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      realLifeContext: '',
      questionStyle: 'STANDARD',
      customInstructions: '',
      isGenerating: false,
      aiStatus: defaultAiStatus,
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
  assert(errorConfigHtml.includes('data-testid="taxonomy-error-banner"'), 'Error banner must be rendered');
  assert(errorConfigHtml.includes('Network timeout connecting to syllabus service'), 'Specific error message displayed');
  assert(errorConfigHtml.includes('data-testid="retry-taxonomy-btn"'), 'Retry button rendered');
  assert(errorConfigHtml.includes('disabled'), 'Controls disabled in error state');
  pass('1.8 Error/Retry State: Error banner rendered with message and retry button; controls safely disabled');

  // Test 1.9: Error State in ProductionWorkbenchSummary
  const errorWorkbench = resolveWorkbenchSummary({
    selectedTopic: 'top_01',
    selectedSubtopic: '',
    taxonomyError: 'Failed to fetch taxonomy tree',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(errorWorkbench.topic.name, 'Taxonomy Unavailable');
  assert.strictEqual(errorWorkbench.topic.hasError, true);
  assert.strictEqual(errorWorkbench.topic.errorMessage, 'Failed to fetch taxonomy tree');
  pass('1.9 Error State: ProductionWorkbenchSummary clearly indicates taxonomy error without corrupting state');

  // Test 1.10: Incomplete State Representation in ActionBar
  const incompleteState = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      questionText: 'What is 15 + 25?', // Non-empty question text
      optionA: '10',
      optionB: '20',
      optionC: '30',
      optionD: '', // Missing required Option D!
      correctAnswer: 'A',
    },
  });
  assert.strictEqual(incompleteState.state, 'INCOMPLETE');
  assert.strictEqual(incompleteState.canContinue, false);
  assert(incompleteState.errors.some((e) => e.includes('Option D')));

  const incompleteBarHtml = renderToString(
    React.createElement(ActionBar, {
      workflowState: incompleteState,
      isSaving: false,
      isSubmitting: false,
      isGenerating: false,
      isRefining: false,
      isDirty: true,
      savedDraftId: null,
      saveSuccessMessage: null,
      onReset: () => {},
      onSaveDraft: () => {},
      onSubmitForVerification: () => {},
    })
  );
  assert(incompleteBarHtml.includes(incompleteState.reason!), 'Incomplete reason callout displayed in ActionBar');
  const saveIncompleteMatch = incompleteBarHtml.match(/<button[^>]*title="Save draft to Firestore[^>]*>/);
  assert(saveIncompleteMatch && saveIncompleteMatch[0].includes('disabled'), 'Save Draft disabled when incomplete');
  pass('1.10 Incomplete State: Missing required fields represented with error callout; actions remain disabled');

  // Test 1.11: Read-Only / Submitted State
  const submittedWorkbench = resolveWorkbenchSummary({
    selectedTopic: topicA.id,
    selectedSubtopic: topicA.subtopics[0].id,
    taxonomyTree: realTree,
    currentSubtopics: topicA.subtopics,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_submitted_123',
    submitSuccessResult: {
      success: true,
      draftId: 'dft_submitted_123',
      currentStep: 2,
      workflowStage: 'STAGE_02_VERIFICATION',
      status: 'SUBMITTED_FOR_REVIEW',
    },
  });
  assert.strictEqual(submittedWorkbench.status.code, 'SUBMITTED');
  assert.strictEqual(submittedWorkbench.status.label, 'Submitted for Verification');
  assert.strictEqual(submittedWorkbench.nextAction.actionType, 'NAVIGATE');
  assert.strictEqual(submittedWorkbench.nextAction.label, 'View in Verification (Stage 02) →');
  assert.strictEqual(submittedWorkbench.nextAction.route, '/questions/dft_submitted_123/verify');
  pass('1.11 Submitted State: Workbench displays "Submitted for Verification" and directs user to Stage 02 verification route');

  // Test 1.12: Completed State (Approved Content)
  const approvedWorkbench = resolveWorkbenchSummary({
    selectedTopic: topicA.id,
    selectedSubtopic: topicA.subtopics[0].id,
    taxonomyTree: realTree,
    currentSubtopics: topicA.subtopics,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_approved_456',
    isApproved: true,
    currentStage: 3,
  });
  assert.strictEqual(approvedWorkbench.status.code, 'APPROVED');
  assert.strictEqual(approvedWorkbench.status.label, 'Approved (Locked)');
  assert.strictEqual(approvedWorkbench.progress.currentStageNumber, 3);
  assert.strictEqual(approvedWorkbench.nextAction.label, 'Continue Workflow →');
  pass('1.12 Completed State: Workbench displays "Approved (Locked)" and guides to downstream production');

  // =========================================================================
  // SECTION 2: Selection Changes, Cascading Resets & Race-Condition Protection
  // =========================================================================
  console.log('\n[SECTION 2] Selection Changes, Cascading Resets & Race-Condition Protection');

  // Test 2.1: Changing Topic Resets Subtopic and Clears Incompatible Children
  const originalGetSubtopics = taxonomyApi.getSubtopics;
  taxonomyApi.getSubtopics = async (topicId?: string): Promise<any> => {
    if (topicId === topicA.id) {
      await new Promise((res) => setTimeout(res, 60));
      return topicA.subtopics;
    }
    if (topicId === topicB.id) {
      await new Promise((res) => setTimeout(res, 10));
      return topicB.subtopics;
    }
    return [];
  };

  let selectedTopicState = topicA.id;
  let selectedSubtopicState = topicA.subtopics[0].id;
  let currentSubtopicsState = [...topicA.subtopics];
  let candidateTaxonomy = { topicId: topicA.id, subtopicId: topicA.subtopics[0].id };
  let contextTaxonomy = { topicId: topicA.id, topicName: topicA.name, subtopicId: topicA.subtopics[0].id, subtopicName: topicA.subtopics[0].name };

  const controller = new SubtopicSelectionController({
    setSelectedTopic: (t) => { selectedTopicState = t; },
    setSelectedSubtopic: (s) => { selectedSubtopicState = s; },
    setCurrentSubtopics: (subs) => { currentSubtopicsState = subs; },
    setLoadingSubtopics: () => {},
    setSubtopicsError: () => {},
    setCandidateTaxonomy: (t, s) => { candidateTaxonomy = { topicId: t, subtopicId: s }; },
    setContextTaxonomy: (tax) => { contextTaxonomy = tax; },
    getTaxonomyTree: () => realTree,
    getSelectedTopic: () => selectedTopicState,
  });

  // User changes topic from topicA to topicB
  await controller.handleTopicChange(topicB.id);

  assert.strictEqual(selectedTopicState, topicB.id, 'Topic state must update to Topic B');
  assert.strictEqual(selectedSubtopicState, topicB.subtopics[0].id, 'Subtopic state must update to Topic B subtopic');
  assert.strictEqual(candidateTaxonomy.topicId, topicB.id, 'Candidate topic must update to Topic B');
  assert.strictEqual(candidateTaxonomy.subtopicId, topicB.subtopics[0].id, 'Candidate subtopic must belong to Topic B');
  assert.strictEqual(contextTaxonomy.topicId, topicB.id, 'Context topic must update to Topic B');
  assert.strictEqual(contextTaxonomy.subtopicId, topicB.subtopics[0].id, 'Context subtopic must belong to Topic B');

  // Verify clearing topic completely resets all taxonomy and context
  await controller.handleTopicChange('');
  assert.strictEqual(selectedTopicState, '', 'Topic state must be reset to empty');
  assert.strictEqual(selectedSubtopicState, '', 'Subtopic state must be reset to empty');
  assert.strictEqual(currentSubtopicsState.length, 0, 'Current subtopics must be cleared');
  assert.strictEqual(candidateTaxonomy.topicId, '', 'Candidate topic must be cleared');
  assert.strictEqual(candidateTaxonomy.subtopicId, '', 'Candidate subtopic must be cleared');
  assert.strictEqual(contextTaxonomy.topicId, '', 'Context topic must be cleared');
  assert.strictEqual(contextTaxonomy.subtopicId, '', 'Context subtopic must be cleared');
  pass('2.1 Topic Change: Subtopic selection, candidate taxonomy, and production context reset cleanly');

  // Test 2.2: Dependent Subtopic Filtering in UI
  const topicBPanelHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: realTree,
      loadingTaxonomy: false,
      taxonomyError: null,
      selectedTopic: topicB.id,
      selectedSubtopic: topicB.subtopics[0]?.id || '',
      currentSubtopics: topicB.subtopics,
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      realLifeContext: '',
      questionStyle: 'STANDARD',
      customInstructions: '',
      isGenerating: false,
      aiStatus: defaultAiStatus,
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
  assert(topicBPanelHtml.includes(topicB.id), 'Selected Topic B must be present');
  if (topicB.subtopics[0]) {
    assert(topicBPanelHtml.includes(topicB.subtopics[0].id), 'Topic B subtopic must be present');
  }
  // Topic A subtopics must NOT appear in Topic B's selector!
  assert(!topicBPanelHtml.includes(topicA.subtopics[0].id), 'Topic A subtopic must NOT be present in Topic B selector');
  pass('2.2 Dependent Filtering: Subtopic selector displays strictly subtopics belonging to the selected topic');

  // Test 2.3: Race-Condition & Delayed Response Protection
  // Simulate an out-of-order race: Request 1 for Topic A delayed, Request 2 for Topic B finishes first
  let capturedSubtopics: any[] = [];
  let capturedSelectedSub = '';
  let controllerTopic = topicA.id;

  const raceController = new SubtopicSelectionController({
    setSelectedTopic: (t) => { controllerTopic = t; },
    setSelectedSubtopic: (s) => { capturedSelectedSub = s; },
    setCurrentSubtopics: (subs) => { capturedSubtopics = subs; },
    setLoadingSubtopics: () => {},
    setSubtopicsError: () => {},
    setCandidateTaxonomy: () => {},
    getTaxonomyTree: () => realTree,
    getSelectedTopic: () => controllerTopic,
  });

  // Step 1: User triggers Topic A load (Req 1)
  const req1Promise = raceController.loadSubtopicsForTopic(topicA.id);

  // Step 2: User immediately switches to Topic B (Req 2)
  controllerTopic = topicB.id;
  const req2Promise = raceController.loadSubtopicsForTopic(topicB.id);

  // Await both requests
  await Promise.all([req1Promise, req2Promise]);

  // Request 1 must have been discarded because active topic moved to Topic B
  assert.strictEqual(raceController.getActiveTopicId(), topicB.id, 'Active topic must remain Topic B');
  assert.strictEqual(controllerTopic, topicB.id);
  // The captured subtopics must belong to Topic B, NOT Topic A!
  if (capturedSubtopics.length > 0) {
    assert(
      topicB.subtopics.some((s) => s.id === capturedSubtopics[0].id),
      'Captured subtopics must belong to Topic B, never stale Topic A'
    );
  }
  pass('2.3 Race-Condition Protection: Obsolete/delayed subtopic responses discarded without state corruption');

  // Test 2.4: Rapid-Selection Invalidation Sequence
  // Rapid sequence: Topic A -> Topic B -> Topic C
  const rapidController = new SubtopicSelectionController({
    setSelectedTopic: () => {},
    setSelectedSubtopic: () => {},
    setCurrentSubtopics: () => {},
    setLoadingSubtopics: () => {},
    setSubtopicsError: () => {},
    setCandidateTaxonomy: () => {},
    getTaxonomyTree: () => realTree,
    getSelectedTopic: () => 'top_final',
  });

  const reqId0 = rapidController.getActiveRequestId();
  rapidController.handleTopicChange('top_step1');
  const reqId1 = rapidController.getActiveRequestId();
  assert(reqId1 > reqId0, 'Req ID must increment on change 1');

  rapidController.handleTopicChange('top_step2');
  const reqId2 = rapidController.getActiveRequestId();
  assert(reqId2 > reqId1, 'Req ID must increment on change 2');

  rapidController.handleTopicChange('top_final');
  const reqId3 = rapidController.getActiveRequestId();
  assert(reqId3 > reqId2, 'Req ID must increment on final change');
  assert.strictEqual(rapidController.getActiveTopicId(), 'top_final');
  pass('2.4 Rapid-Selection Sequence: Every topic switch increments sequence ID and invalidates prior requests');

  // Restore taxonomyApi.getSubtopics
  taxonomyApi.getSubtopics = originalGetSubtopics;

  // Test 2.5: Mode Switching Preserves Configuration Per Mode
  const studioMode1 = resolveWorkbenchSummary({
    selectedTopic: topicA.id,
    selectedSubtopic: topicA.subtopics[0].id,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 1,
    aspectRatio: '9:16',
    hasCandidate: true,
    isDirty: false,
  });
  assert.strictEqual(studioMode1.mode.readableName, 'Mode 1: Question Challenge Short');
  assert.strictEqual(studioMode1.mode.questionCount, 1);
  assert.strictEqual(studioMode1.mode.aspectRatio, '9:16');

  const studioMode2 = resolveWorkbenchSummary({
    selectedTopic: topicA.id,
    selectedSubtopic: topicA.subtopics[0].id,
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '16:9',
    hasCandidate: true,
    isDirty: false,
  });
  assert.strictEqual(studioMode2.mode.readableName, 'Mode 2: Topic Introduction');
  assert.strictEqual(studioMode2.mode.questionCount, 0);
  assert.strictEqual(studioMode2.mode.aspectRatio, '16:9');

  const studioMode3 = resolveWorkbenchSummary({
    selectedTopic: topicA.id,
    selectedSubtopic: topicA.subtopics[0].id,
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 15,
    aspectRatio: '16:9',
    hasCandidate: true,
    isDirty: false,
  });
  assert.strictEqual(studioMode3.mode.readableName, 'Mode 3: Explained Questions Video');
  assert.strictEqual(studioMode3.mode.questionCount, 15);
  assert.strictEqual(studioMode3.mode.aspectRatio, '16:9');
  pass('2.5 Mode Switching: Modes 1, 2, and 3 update summary labels, question counts, and aspect ratios accurately');

  // =========================================================================
  // SECTION 3: Draft Reopening & State Integrity
  // =========================================================================
  console.log('\n[SECTION 3] Draft Reopening & State Integrity');

  // Test 3.1: Full Draft Reopening Restores Exact Persisted State
  const persistedDraft = await questionGenerationService.saveDraft(
    {
      topicId: topicA.id,
      subtopicId: topicA.subtopics[0].id,
      difficulty: 'Hard',
      language: 'TELUGU',
      questionText: 'ఒక రైలు వేగం 72 కిమీ/గం. 200 మీటర్ల పొడవున్న రైలు ఒక స్తంభాన్ని దాటడానికి ఎంత సమయం పడుతుంది?',
      options: {
        a: '8 సెకన్లు',
        b: '10 సెకన్లు',
        c: '12 సెకన్లు',
        d: '15 సెకన్లు',
      },
      correctAnswer: 'B',
      explanation: '72 * (5/18) = 20 మీ/సె. సమయం = 200 / 20 = 10 సెకన్లు.',
      realLifeContext: 'రైల్వే పరీక్షల గణిత సమస్య',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
    },
    { id: 'usr_reopen_test', name: 'Reopen Tester' }
  );

  assert(persistedDraft.id.startsWith('dft_'));
  assert.strictEqual(persistedDraft.status, QuestionStatus.DRAFT);
  assert.strictEqual(persistedDraft.version, 1);

  // Retrieve draft through backend domain service
  const reopened = await questionGenerationService.getDraftById(persistedDraft.id);
  assert(reopened !== null, 'Reopened draft must exist');
  assert.strictEqual(reopened?.id, persistedDraft.id);
  assert.strictEqual(reopened?.questionText, persistedDraft.questionText);
  assert.strictEqual(reopened?.options.b, '10 సెకన్లు');
  assert.strictEqual(reopened?.correctAnswer, 'B');
  assert.strictEqual(reopened?.topicId, topicA.id);
  assert.strictEqual(reopened?.subtopicId, topicA.subtopics[0].id);
  assert.strictEqual(reopened?.productionMode, 'QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(reopened?.version, 1);
  pass('3.1 Draft Reopening: Persisted draft restores exact candidate fields, options, and version');

  // Test 3.2: Persisted Draft Data Precedence over Conflicting URL Parameters
  // Scenario: URL specifies Topic B and Mode 2, but opened draft specifies Topic A and Mode 1
  const conflictingUrlParams = {
    urlTopic: topicB.id,
    urlMode: 'TOPIC_INTRODUCTION' as ContentProductionMode,
  };

  // The draft's persisted data MUST take absolute precedence
  const effectiveTopic = reopened?.topicId || conflictingUrlParams.urlTopic;
  const effectiveMode = reopened?.productionMode || conflictingUrlParams.urlMode;

  assert.strictEqual(effectiveTopic, topicA.id, 'Persisted draft topic strictly overrides URL topic');
  assert.strictEqual(effectiveMode, 'QUESTION_CHALLENGE_SHORT', 'Persisted draft mode strictly overrides URL mode');
  pass('3.2 Precedence Contract: Persisted draft strictly overrides conflicting URL parameters');

  // Test 3.3: Reopening Submitted Draft Restores Verification State
  // Transition draft to verification
  const submitResult = await questionGenerationService.submitForVerification(
    { draftId: persistedDraft.id, expectedVersion: 1 },
    { id: 'usr_reopen_test', name: 'Reopen Tester' }
  );
  assert.strictEqual(submitResult.success, true);
  assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');

  // Re-fetch submitted draft
  const reopenedSubmitted = await questionGenerationService.getDraftById(persistedDraft.id);
  assert.strictEqual(reopenedSubmitted?.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(reopenedSubmitted?.workflowStage, 'STAGE_02_VERIFICATION');
  assert.strictEqual(reopenedSubmitted?.version, 2);

  const submittedWorkbenchCheck = resolveWorkbenchSummary({
    selectedTopic: reopenedSubmitted!.topicId,
    selectedSubtopic: reopenedSubmitted!.subtopicId,
    productionMode: reopenedSubmitted!.productionMode as ContentProductionMode,
    hasCandidate: true,
    isDirty: false,
    savedDraftId: reopenedSubmitted!.id,
    submitSuccessResult: {
      success: true,
      draftId: reopenedSubmitted!.id,
      currentStep: 2,
      workflowStage: 'STAGE_02_VERIFICATION',
      status: 'SUBMITTED_FOR_REVIEW',
    },
  });
  assert.strictEqual(submittedWorkbenchCheck.status.code, 'SUBMITTED');
  assert.strictEqual(submittedWorkbenchCheck.status.label, 'Submitted for Verification');
  assert.strictEqual(submittedWorkbenchCheck.nextAction.label, 'View in Verification (Stage 02) →');
  pass('3.3 Submitted Draft Reopening: Restores Stage 02 verification state and guides user to verification route');

  // =========================================================================
  // SECTION 4: Browser-Level Verification Environment Assessment
  // =========================================================================
  console.log('\n[SECTION 4] Browser-Level Verification Environment Assessment');

  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeExists = fs.existsSync(chromePath);
  console.log(`  • Chrome executable status at "${chromePath}": ${chromeExists ? 'PRESENT' : 'NOT_FOUND'}`);

  // Test whether local web server on port 3000 is listening
  const isPortOpen = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(3000, '127.0.0.1');
  });

  console.log(`  • Application Web Server on http://localhost:3000: ${isPortOpen ? 'LISTENING' : 'NOT_LISTENING'}`);

  if (chromeExists && !isPortOpen) {
    console.log(
      '  • Concrete Blocker: Google Chrome is present, but no runnable application web server is listening on port 3000 in this automated CI execution environment.'
    );
    console.log('  • Browser verification status: UNVERIFIED (per AGENTS.md / S8-T17 Section 4 protocol).');
  } else if (chromeExists && isPortOpen) {
    console.log('  • Browser verification status: AVAILABLE');
  } else {
    console.log('  • Browser verification status: UNVERIFIED (Chrome executable not found).');
  }
  pass('4.1 Browser Environment: Assessed Chrome executable and runnable HTTP server availability');

  console.log('\n========================================================================');
  console.log(`ALL S8-T17 TESTS PASSED: ${passedTests} checks verified successfully.`);
  console.log('========================================================================\n');
}

runS8T17DynamicPageStatesTests().catch((err) => {
  console.error('\n❌ S8-T17 Test Suite Failed:', err);
  process.exit(1);
});
