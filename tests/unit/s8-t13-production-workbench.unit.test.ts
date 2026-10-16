/**
 * BURRA PARIKSHA CMS — S8-T13 Unit Test Suite
 * Shared Production Workbench Summary & Entry Point
 *
 * Verifies all mandatory requirements of S8-T13:
 * 1. Topic & Subtopic Name Resolution, Loading, Empty, and Error States
 * 2. Production Mode Readable Names & Badge Formatting
 * 3. Content Status Distinction (EMPTY, UNSAVED, DRAFT_SAVED, SUBMITTED, APPROVED)
 * 4. Authoritative 15-Step Progress Tracking
 * 5. Context-Aware Next Action Hierarchy (Save Draft vs Submit Verification preserved)
 * 6. UI Rendering & Integration via ProductionWorkbenchSummary & QuestionStudioPage
 */

import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  ContentProductionMode,
  DEFAULT_PRODUCTION_CONTEXT,
  QuestionLanguage,
  ProductionContext,
} from '../../shared';

import {
  ProductionWorkbenchSummary,
  resolveWorkbenchSummary,
  getReadableProductionMode,
} from '../../frontend/features/question-generation/components/ProductionWorkbenchSummary';

import {
  ProductionJourneyProvider,
} from '../../frontend/contexts/ProductionJourneyContext';

import { QuestionStudioPage } from '../../frontend/features/question-generation/pages/QuestionStudioPage';

async function runS8T13UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T13 TESTS: Shared Production Workbench');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  const sampleTopics = [
    { id: 'top_qa_01', name: 'Quantitative Aptitude', subtopics: [{ id: 'sub_td_01', name: 'Time & Distance' }] },
    { id: 'top_lr_02', name: 'Logical Reasoning', subtopics: [{ id: 'sub_se_02', name: 'Series Completion' }] },
  ];

  const sampleSubtopics = [
    { id: 'sub_td_01', name: 'Time & Distance' },
    { id: 'sub_tw_02', name: 'Time & Work' },
  ];

  // =========================================================================
  // SECTION 1: Topic and Subtopic Display & States
  // =========================================================================
  console.log('[SECTION 1] Topic and Subtopic Display & States');

  // Test 1.1: Empty / Unselected states
  const emptyTaxonomy = resolveWorkbenchSummary({
    selectedTopic: '',
    selectedSubtopic: '',
    taxonomyTree: sampleTopics,
    currentSubtopics: sampleSubtopics,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(emptyTaxonomy.topic.name, 'Not Selected');
  assert.strictEqual(emptyTaxonomy.topic.isUnselected, true);
  assert.strictEqual(emptyTaxonomy.subtopic.name, 'Not Selected');
  assert.strictEqual(emptyTaxonomy.subtopic.isUnselected, true);
  pass('1.1 Unselected topic and subtopic return "Not Selected" with isUnselected: true');

  // Test 1.2: Loading states
  const loadingTaxonomy = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    loadingTaxonomy: true,
    loadingSubtopics: true,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(loadingTaxonomy.topic.name, 'Loading Topics...');
  assert.strictEqual(loadingTaxonomy.topic.isLoading, true);
  assert.strictEqual(loadingTaxonomy.subtopic.name, 'Loading Subtopics...');
  assert.strictEqual(loadingTaxonomy.subtopic.isLoading, true);
  pass('1.2 Loading states return clear descriptive loading indicators');

  // Test 1.3: Error / Unavailable states
  const errorTaxonomy = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    taxonomyError: 'Failed to fetch taxonomy tree',
    subtopicsError: 'Network timeout loading subtopics',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(errorTaxonomy.topic.name, 'Taxonomy Unavailable');
  assert.strictEqual(errorTaxonomy.topic.hasError, true);
  assert.strictEqual(errorTaxonomy.subtopic.name, 'Subtopics Unavailable');
  assert.strictEqual(errorTaxonomy.subtopic.hasError, true);
  pass('1.3 Error states report unavailable taxonomy without fabricating values');

  // Test 1.4: Resolved topic and subtopic names
  const resolvedTaxonomy = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    taxonomyTree: sampleTopics,
    currentSubtopics: sampleSubtopics,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(resolvedTaxonomy.topic.name, 'Quantitative Aptitude');
  assert.strictEqual(resolvedTaxonomy.subtopic.name, 'Time & Distance');
  assert.strictEqual(resolvedTaxonomy.topic.isUnselected, false);
  assert.strictEqual(resolvedTaxonomy.subtopic.isUnselected, false);
  pass('1.4 Resolved topic and subtopic match authoritative persisted names');

  // Test 1.5: Random subtopic mapping
  const randomSubtopic = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'RANDOM',
    taxonomyTree: sampleTopics,
    currentSubtopics: sampleSubtopics,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(randomSubtopic.subtopic.name, 'Random Subtopic');
  pass('1.5 RANDOM subtopic selection resolves to "Random Subtopic"');

  // =========================================================================
  // SECTION 2: Production Mode Display & Badges
  // =========================================================================
  console.log('\n[SECTION 2] Production Mode Readable Names & Formatting');

  // Test 2.1: Readable Mode Names
  assert.strictEqual(getReadableProductionMode('QUESTION_CHALLENGE_SHORT'), 'Mode 1: Question Challenge Short');
  assert.strictEqual(getReadableProductionMode('TOPIC_INTRODUCTION'), 'Mode 2: Topic Introduction');
  assert.strictEqual(getReadableProductionMode('EXPLAINED_QUESTIONS_VIDEO'), 'Mode 3: Explained Questions Video');
  assert.strictEqual(getReadableProductionMode(null), 'Not Configured');
  pass('2.1 getReadableProductionMode returns exact canonical names for all 3 modes');

  // Test 2.2: Mode 1 summary configuration
  const m1Summary = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(m1Summary.mode.readableName, 'Mode 1: Question Challenge Short');
  assert.strictEqual(m1Summary.mode.questionCount, 5);
  assert.strictEqual(m1Summary.mode.aspectRatio, '9:16');
  assert.strictEqual(m1Summary.mode.isConfigured, true);
  pass('2.2 Mode 1 configures series batch count and 9:16 aspect ratio');

  // Test 2.3: Mode 2 summary configuration (0 questions, 16:9 or 9:16)
  const m2Summary = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '16:9',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(m2Summary.mode.readableName, 'Mode 2: Topic Introduction');
  assert.strictEqual(m2Summary.mode.questionCount, 0);
  assert.strictEqual(m2Summary.mode.aspectRatio, '16:9');
  pass('2.3 Mode 2 configures 0 questions and horizontal 16:9 aspect ratio');

  // Test 2.4: Mode 3 summary configuration (10 questions masterclass)
  const m3Summary = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 10,
    aspectRatio: '16:9',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(m3Summary.mode.readableName, 'Mode 3: Explained Questions Video');
  assert.strictEqual(m3Summary.mode.questionCount, 10);
  assert.strictEqual(m3Summary.mode.aspectRatio, '16:9');
  pass('2.4 Mode 3 configures 10 questions and fixed 16:9 aspect ratio');

  // =========================================================================
  // SECTION 3: Content Status Distinction
  // =========================================================================
  console.log('\n[SECTION 3] Content Status Distinction');

  // Test 3.1: EMPTY status (workspace fresh, no candidate)
  const emptyStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(emptyStatus.status.code, 'EMPTY');
  assert.strictEqual(emptyStatus.status.label, 'Not Started');
  pass('3.1 Fresh workspace maps to EMPTY status');

  // Test 3.2: UNSAVED status (candidate present, isDirty: true)
  const unsavedStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: true,
    savedDraftId: null,
  });
  assert.strictEqual(unsavedStatus.status.code, 'UNSAVED');
  assert.strictEqual(unsavedStatus.status.label, 'Unsaved Candidate');
  pass('3.2 Unsaved candidate maps to UNSAVED status');

  // Test 3.3: DRAFT_SAVED status (persisted draft, isDirty: false)
  const savedStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_test_123',
  });
  assert.strictEqual(savedStatus.status.code, 'DRAFT_SAVED');
  assert.strictEqual(savedStatus.status.label, 'Draft Saved');
  assert.strictEqual(savedStatus.status.savedDraftId, 'dft_test_123');
  pass('3.3 Saved clean draft maps to DRAFT_SAVED status with draftId');

  // Test 3.4: Stale draft with unsaved edits (savedDraftId present, but isDirty: true)
  const staleDraftStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: true,
    savedDraftId: 'dft_test_123',
  });
  assert.strictEqual(staleDraftStatus.status.code, 'UNSAVED');
  assert.strictEqual(staleDraftStatus.status.label, 'Unsaved Changes');
  pass('3.4 Stale saved draft with modifications accurately reverts to UNSAVED');

  // Test 3.5: SUBMITTED status (submitted for verification)
  const submittedStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_test_123',
    submitSuccessResult: { success: true, draftId: 'dft_test_123' },
  });
  assert.strictEqual(submittedStatus.status.code, 'SUBMITTED');
  assert.strictEqual(submittedStatus.status.label, 'Submitted for Verification');
  pass('3.5 Explicit submission transitions status to SUBMITTED');

  // Test 3.6: APPROVED status
  const approvedStatus = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_test_123',
    isApproved: true,
  });
  assert.strictEqual(approvedStatus.status.code, 'APPROVED');
  assert.strictEqual(approvedStatus.status.label, 'Approved (Locked)');
  pass('3.6 Approved question maps to APPROVED locked status');

  // =========================================================================
  // SECTION 4: 15-Step Workflow Progress
  // =========================================================================
  console.log('\n[SECTION 4] Authoritative 15-Step Workflow Progress');

  // Test 4.1: Stage 1 active (0 completed)
  const stage1Progress = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
    currentStage: 1,
    stages: [
      { stageNumber: 1, id: 'q', label: '01 Question Generation', shortLabel: 'Question', description: '', isCompleted: false, isCurrent: true, isBlocked: false, route: '/studio' },
      { stageNumber: 2, id: 'v', label: '02 Question Verification', shortLabel: 'Verification', description: '', isCompleted: false, isCurrent: false, isBlocked: true, route: '/questions/verify' },
    ],
  });
  assert.strictEqual(stage1Progress.progress.currentStageNumber, 1);
  assert.strictEqual(stage1Progress.progress.currentStageLabel, '01 Question Generation');
  assert.strictEqual(stage1Progress.progress.completedStagesCount, 0);
  assert.strictEqual(stage1Progress.progress.totalStagesCount, 15);
  pass('4.1 Stage 1 reports 0 of 15 completed stages');

  // Test 4.2: Stage 3 active (2 completed)
  const stage3Progress = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    currentStage: 3,
    stages: [
      { stageNumber: 1, id: 'q', label: '01 Question Generation', shortLabel: 'Question', description: '', isCompleted: true, isCurrent: false, isBlocked: false, route: '/studio' },
      { stageNumber: 2, id: 'v', label: '02 Question Verification', shortLabel: 'Verification', description: '', isCompleted: true, isCurrent: false, isBlocked: false, route: '/questions/verify' },
      { stageNumber: 3, id: 's', label: '03 Audience Script', shortLabel: 'Script', description: '', isCompleted: false, isCurrent: true, isBlocked: false, route: '/videos/vid_1?tab=script' },
    ],
  });
  assert.strictEqual(stage3Progress.progress.currentStageNumber, 3);
  assert.strictEqual(stage3Progress.progress.currentStageLabel, '03 Audience Script');
  assert.strictEqual(stage3Progress.progress.completedStagesCount, 2);
  pass('4.2 Stage 3 reports authoritative 2 of 15 completed stages');

  // =========================================================================
  // SECTION 5: Context-Aware Next Action Hierarchy
  // =========================================================================
  console.log('\n[SECTION 5] Context-Aware Next Action Recommendations');

  // Test 5.1: Action when mode is missing
  const noModeAction = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: null,
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(noModeAction.nextAction.actionType, 'SELECT_MODE');
  assert.strictEqual(noModeAction.nextAction.label, 'Select Production Mode');
  pass('5.1 Missing mode prompts "Select Production Mode"');

  // Test 5.2: Action when topic is missing
  const noTopicAction = resolveWorkbenchSummary({
    selectedTopic: '',
    selectedSubtopic: '',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(noTopicAction.nextAction.actionType, 'SELECT_TOPIC');
  assert.strictEqual(noTopicAction.nextAction.label, 'Select Syllabus Topic');
  pass('5.2 Missing topic prompts "Select Syllabus Topic"');

  // Test 5.3: Action when subtopic is missing
  const noSubtopicAction = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: '',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(noSubtopicAction.nextAction.actionType, 'SELECT_SUBTOPIC');
  assert.strictEqual(noSubtopicAction.nextAction.label, 'Select Subtopic');
  pass('5.3 Missing subtopic prompts "Select Subtopic"');

  // Test 5.4: Action when candidate is empty (Mode 1 vs Mode 2)
  const emptyM1Action = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(emptyM1Action.nextAction.actionType, 'GENERATE');
  assert.strictEqual(emptyM1Action.nextAction.label, 'Generate Question');

  const emptyM2Action = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'TOPIC_INTRODUCTION',
    hasCandidate: false,
    isDirty: false,
  });
  assert.strictEqual(emptyM2Action.nextAction.actionType, 'GENERATE');
  assert.strictEqual(emptyM2Action.nextAction.label, 'Draft Concept');
  pass('5.4 Empty candidate suggests "Generate Question" (Mode 1) or "Draft Concept" (Mode 2)');

  // Test 5.5: Action when changes are unsaved -> SAVE DRAFT
  const unsavedAction = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: true,
    savedDraftId: 'dft_test_123',
  });
  assert.strictEqual(unsavedAction.nextAction.actionType, 'SAVE_DRAFT');
  assert.strictEqual(unsavedAction.nextAction.label, 'Save Draft');
  pass('5.5 Unsaved modifications strictly prioritize "Save Draft" over submit');

  // Test 5.6: Action when draft is saved and clean -> SUBMIT FOR VERIFICATION
  const savedAction = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_test_123',
  });
  assert.strictEqual(savedAction.nextAction.actionType, 'SUBMIT_VERIFICATION');
  assert.strictEqual(savedAction.nextAction.label, 'Submit for Verification →');
  pass('5.6 Clean saved draft triggers "Submit for Verification →"');

  // Test 5.7: Action when draft is submitted -> NAVIGATE to Stage 02
  const submittedAction = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    savedDraftId: 'dft_test_123',
    submitSuccessResult: { success: true, draftId: 'dft_test_123' },
  });
  assert.strictEqual(submittedAction.nextAction.actionType, 'NAVIGATE');
  assert(submittedAction.nextAction.label.includes('View in Verification'));
  assert.strictEqual(submittedAction.nextAction.route, '/questions/dft_test_123/verify');
  pass('5.7 Submitted candidate navigates to Stage 02 verification route');

  // =========================================================================
  // SECTION 6: React UI Component Rendering (ProductionWorkbenchSummary)
  // =========================================================================
  console.log('\n[SECTION 6] React UI Component Rendering');

  // Test 6.1: Full rendered workbench summary with mock handlers
  let modeModalOpened = false;
  let saveDraftCalled = false;
  let submitVerificationCalled = false;

  const summaryHtml = renderToString(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(ProductionWorkbenchSummary, {
          selectedTopic: 'top_qa_01',
          selectedSubtopic: 'sub_td_01',
          taxonomyTree: sampleTopics,
          currentSubtopics: sampleSubtopics,
          loadingTaxonomy: false,
          loadingSubtopics: false,
          productionMode: 'QUESTION_CHALLENGE_SHORT',
          targetQuestionCount: 5,
          aspectRatio: '9:16',
          onOpenModeModal: () => { modeModalOpened = true; },
          hasCandidate: true,
          isDirty: false,
          savedDraftId: 'dft_rendered_01',
          onSaveDraft: async () => { saveDraftCalled = true; },
          onSubmitForVerification: async () => { submitVerificationCalled = true; },
        })
      )
    )
  );

  assert(summaryHtml.includes('data-testid="workbench-summary"'), 'Must render workbench-summary container');
  assert(summaryHtml.includes('data-testid="workbench-topic-name"'), 'Must render topic name element');
  assert(summaryHtml.includes('Quantitative Aptitude'), 'Must display Quantitative Aptitude topic');
  assert(summaryHtml.includes('data-testid="workbench-subtopic-name"'), 'Must render subtopic name element');
  assert(summaryHtml.includes('Time &amp; Distance') || summaryHtml.includes('Time & Distance'), 'Must display Time & Distance subtopic');
  assert(summaryHtml.includes('data-testid="workbench-mode-name"'), 'Must render mode name element');
  assert(summaryHtml.includes('Mode 1: Question Challenge Short'), 'Must display Mode 1 title');
  assert(summaryHtml.includes('5 Questions'), 'Must render 5 Questions badge');
  assert(summaryHtml.includes('9:16'), 'Must render 9:16 aspect badge');
  assert(summaryHtml.includes('data-testid="workbench-content-status"'), 'Must render content status badge');
  assert(summaryHtml.includes('Draft Saved'), 'Must display Draft Saved status');
  assert(summaryHtml.includes('dft_rendered_01'), 'Must display saved draft ID');
  assert(summaryHtml.includes('data-testid="workbench-current-step"'), 'Must render current step element');
  assert(summaryHtml.includes('data-testid="workbench-next-action-btn"'), 'Must render next action button');
  assert(summaryHtml.includes('Submit for Verification'), 'Next action button should prompt submit for clean draft');
  pass('6.1 ProductionWorkbenchSummary renders all 5 dimensions cleanly in HTML');

  // Test 6.2: QuestionStudioPage integration renders workbench summary
  const studioHtml = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/studio?mode=TOPIC_INTRODUCTION&aspect=16:9'] },
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(QuestionStudioPage)
      )
    )
  );

  assert(studioHtml.includes('data-testid="workbench-summary"'), 'QuestionStudioPage must render ProductionWorkbenchSummary');
  assert(studioHtml.includes('Mode 2: Topic Introduction'), 'QuestionStudioPage workbench must display Mode 2 from deep link');
  assert(studioHtml.includes('16:9'), 'QuestionStudioPage workbench must display 16:9 aspect ratio');
  pass('6.2 QuestionStudioPage integrates ProductionWorkbenchSummary as its entry workbench');

  console.log('\n========================================================================');
  console.log(`ALL ${passedTests} S8-T13 UNIT & INTEGRATION TESTS PASSED CLEANLY!`);
  console.log('========================================================================\n');
}

runS8T13UnitTests().catch((err) => {
  console.error('\n❌ S8-T13 Test Suite Failed:', err);
  process.exit(1);
});
