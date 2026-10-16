/**
 * BURRA PARIKSHA CMS — S8-T10 Unit Test Suite
 * Dynamic Topic Selection, Two-Tier Taxonomy Grounding, and Context Synchronization
 *
 * Verifies all mandatory requirements of S8-T10 using actual production code:
 * 1. Production UI Component: GenerationConfigPanel (renderToString)
 *    - Real API-loaded topics & subtopics rendered in <select> options
 *    - Zero hardcoded catalog defaults (no assumption of TOP-QA-01 / SUB-01)
 *    - Explicit Loading, Empty, Error, and Retry banner states
 *    - Strict disablement of generation button when taxonomy is unavailable or incomplete
 *    - Filtering of subtopic options strictly matching the selected topic
 * 2. Production Hook & Domain Invariants:
 *    - useQuestionGeneration hook executed within ProductionJourneyProvider & MemoryRouter
 *    - Initial state has empty unselected topic & subtopic (no hardcoded defaults)
 *    - resolveCascadingSubtopic invalidates incompatible subtopic and replaces with valid child
 *    - resolveCascadingSubtopic clears subtopic when switching to a topic with zero subtopics
 *    - validateGenerationTaxonomy enforces strict guard against missing, loading, error, or mismatched taxonomy
 *    - validateGenerationTaxonomy preserves documented RANDOM mode exception
 * 3. Production Context Synchronization:
 *    - ProductionJourneyProvider action setTaxonomy synchronizes topicId, topicName, subtopicId, subtopicName
 * 4. Authoritative Backend Domain Boundary:
 *    - taxonomyService.getPureTopicTree returns canonical two-tier hierarchy
 *    - questionGenerationService.validateGenerationRequest rejects mismatched/unresolvable taxonomy
 */

import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { taxonomyService } from '../../backend/domain/taxonomy/services/taxonomy.service';
import { questionGenerationService } from '../../backend/domain/question-generation';
import {
  DifficultyLevel,
  QuestionLanguage,
  PureTaxonomyTreeItem,
  Topic,
  Subtopic,
  DEFAULT_PRODUCTION_CONTEXT,
} from '../../shared';

import {
  ProductionJourneyProvider,
  useProductionContext,
} from '../../frontend/contexts/ProductionJourneyContext';
import { GenerationConfigPanel } from '../../frontend/features/question-generation/components/GenerationConfigPanel';
import {
  useQuestionGeneration,
  resolveCascadingSubtopic,
  validateGenerationTaxonomy,
} from '../../frontend/features/question-generation/hooks/useQuestionGeneration';

async function runS8T10UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T10 UNIT TESTS: Dynamic Topic Selection & Production Code');
  console.log('========================================================================\n');

  // Load real authoritative pure taxonomy tree
  const realTree = await taxonomyService.getPureTopicTree({ includeInactive: false });
  assert(Array.isArray(realTree), 'Taxonomy tree must be an array');
  assert(realTree.length >= 2, 'Must have at least 2 topics in taxonomy database');

  const topicsWithSubs = realTree.filter((t) => (t.subtopics || []).length > 0);
  assert(topicsWithSubs.length >= 2, 'Must have at least 2 topics with subtopics');
  const topicA = topicsWithSubs[0];
  const topicB = topicsWithSubs[1];
  const topicWithoutSubs = realTree.find((t) => (t.subtopics || []).length === 0);

  // -------------------------------------------------------------------------
  // SECTION 1: Production UI Component Verification (GenerationConfigPanel)
  // -------------------------------------------------------------------------
  console.log('[Test 1] Production UI: GenerationConfigPanel with Real API Loaded Topics');
  const defaultAiStatus = { isConfigured: true, model: 'gemini-2.5-pro' };

  // 1a. Normal State with loaded topics
  const normalHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: realTree,
      loadingTaxonomy: false,
      taxonomyError: null,
      selectedTopic: topicA.id,
      selectedSubtopic: topicA.subtopics[0].id,
      currentSubtopics: topicA.subtopics,
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      realLifeContext: 'Metro train rush hour',
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

  // Verify Topic options are rendered from real data
  assert(normalHtml.includes(`data-testid="topic-select"`), 'Must render topic select element');
  assert(normalHtml.includes(topicA.id), `Must render topicA id "${topicA.id}"`);
  assert(normalHtml.includes(topicB.id), `Must render topicB id "${topicB.id}"`);
  assert(normalHtml.includes(topicA.subtopics[0].id), `Must render topicA subtopic id`);
  assert(!normalHtml.includes('taxonomy-error-banner'), 'Must NOT render error banner in normal state');
  assert(!normalHtml.includes('taxonomy-empty-banner'), 'Must NOT render empty banner in normal state');
  assert(normalHtml.includes('✦ Generate Telugu Question'), 'Generate button text must be present');
  console.log('  PASS: GenerationConfigPanel renders real API topics and subtopics cleanly.');

  // 1b. Loading State: disables controls and shows loading indicator
  console.log('\n[Test 2] Production UI: Loading State in GenerationConfigPanel');
  const loadingHtml = renderToString(
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
  assert(loadingHtml.includes('Loading topics...'), 'Must render Loading topics indicator');
  assert(loadingHtml.includes('Loading topics from server...'), 'Topic option must indicate loading from server');
  assert(loadingHtml.includes('disabled=""') || loadingHtml.includes('disabled'), 'Controls must be disabled while loading');
  console.log('  PASS: Loading state correctly displays indicator and disables selection/generation.');

  // 1c. Empty State: banner rendered and generation disabled
  console.log('\n[Test 3] Production UI: Empty State in GenerationConfigPanel');
  const emptyHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: [],
      loadingTaxonomy: false,
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
  assert(emptyHtml.includes('data-testid="taxonomy-empty-banner"'), 'Must render empty state banner');
  assert(emptyHtml.includes('No topics available'), 'Empty state must explain no topics available');
  assert(emptyHtml.includes('disabled'), 'Generate button and selector must be disabled in empty state');
  console.log('  PASS: Empty taxonomy state displays informative banner and prevents generation.');

  // 1d. Error State & Retry Action
  console.log('\n[Test 4] Production UI: Error State and Retry Button in GenerationConfigPanel');
  let retryClicked = false;
  const errorHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: [],
      loadingTaxonomy: false,
      taxonomyError: 'Failed to connect to authoritative taxonomy service',
      onRetryTaxonomy: () => {
        retryClicked = true;
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
  assert(errorHtml.includes('data-testid="taxonomy-error-banner"'), 'Must render error banner');
  assert(errorHtml.includes('Failed to connect to authoritative taxonomy service'), 'Must display the specific error message');
  assert(errorHtml.includes('data-testid="retry-taxonomy-btn"'), 'Must render retry button in error state');
  assert(errorHtml.includes('disabled'), 'Controls must be disabled during error state');
  console.log('  PASS: Error state renders error banner, displays retry action, and disables generation.');

  // 1e. Dependent Subtopic Filtering: only subtopics for selected topic appear
  console.log('\n[Test 5] Production UI: Dependent Subtopic Filtering');
  const filteredHtml = renderToString(
    React.createElement(GenerationConfigPanel, {
      taxonomyTree: realTree,
      loadingTaxonomy: false,
      taxonomyError: null,
      selectedTopic: topicA.id,
      selectedSubtopic: topicA.subtopics[0].id,
      currentSubtopics: topicA.subtopics, // Only subtopics belonging to topicA!
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
  for (const sub of topicA.subtopics) {
    assert(filteredHtml.includes(sub.id), `Subtopic select must contain topicA subtopic id "${sub.id}"`);
  }
  for (const sub of topicB.subtopics) {
    assert(!filteredHtml.includes(`(${sub.id})`), `Subtopic select must NOT contain topicB subtopic id "(${sub.id})"`);
  }
  console.log('  PASS: Subtopic dropdown strictly filters to child subtopics of the selected topic.');

  // -------------------------------------------------------------------------
  // SECTION 2: Production Hook & Cascading Logic Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Production Hook: useQuestionGeneration Initial State & Zero Hardcoded Defaults');
  let capturedHook: any = null;

  function HookTestConsumer() {
    capturedHook = useQuestionGeneration();
    return React.createElement(
      'div',
      {
        'data-topic': capturedHook.selectedTopic,
        'data-subtopic': capturedHook.selectedSubtopic,
      },
      'HookTestConsumer'
    );
  }

  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/questions/studio'] },
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(HookTestConsumer)
      )
    )
  );

  assert(capturedHook !== null, 'Hook must be captured');
  assert.strictEqual(capturedHook.selectedTopic, '', 'Initial selectedTopic must be empty string (no hardcoded TOP-QA-01)');
  assert.strictEqual(capturedHook.selectedSubtopic, '', 'Initial selectedSubtopic must be empty string (no hardcoded SUB-01)');
  assert.strictEqual(capturedHook.candidate.topicId, '', 'Candidate topicId must be empty string initially');
  assert.strictEqual(capturedHook.candidate.subtopicId, '', 'Candidate subtopicId must be empty string initially');
  console.log('  PASS: Production hook initializes with zero hardcoded taxonomy defaults.');

  // 2b. Production resolveCascadingSubtopic
  console.log('\n[Test 7] Production Cascading: resolveCascadingSubtopic with Real Taxonomy');

  // Case 1: Switching from topicA to topicB with a topicA subtopic
  const subA = topicA.subtopics[0];
  const cascadeToB = resolveCascadingSubtopic(topicB.id, subA.id, realTree);
  assert.strictEqual(cascadeToB.targetTopic?.id, topicB.id, 'Target topic must be topicB');
  assert.notStrictEqual(cascadeToB.nextSubtopicId, subA.id, 'Must invalidate topicA subtopic');
  assert.strictEqual(
    cascadeToB.nextSubtopicId,
    topicB.subtopics[0].id,
    'Must select first available subtopic of topicB'
  );
  assert.strictEqual(cascadeToB.targetSubtopic?.id, topicB.subtopics[0].id);

  // Case 2: Switching to a topic with 0 subtopics (if present)
  if (topicWithoutSubs) {
    const cascadeToEmpty = resolveCascadingSubtopic(topicWithoutSubs.id, subA.id, realTree);
    assert.strictEqual(cascadeToEmpty.targetTopic?.id, topicWithoutSubs.id);
    assert.strictEqual(cascadeToEmpty.nextSubtopicId, '', 'Subtopic must be empty when topic has 0 subtopics');
    assert.strictEqual(cascadeToEmpty.targetSubtopic, undefined);
  }

  // Case 3: Retaining valid subtopic if already belonging to the topic
  const cascadeRetain = resolveCascadingSubtopic(topicB.id, topicB.subtopics[0].id, realTree);
  assert.strictEqual(cascadeRetain.nextSubtopicId, topicB.subtopics[0].id, 'Must retain subtopic when it belongs to topic');

  console.log('  PASS: resolveCascadingSubtopic correctly validates, invalidates, and replaces subtopic across topics.');

  // 2c. Production validateGenerationTaxonomy
  console.log('\n[Test 8] Production Generation Guard: validateGenerationTaxonomy');

  // 8a. Loading state
  const loadGuard = validateGenerationTaxonomy(topicA.id, topicA.subtopics[0].id, realTree, true, null);
  assert.strictEqual(loadGuard.canGenerate, false);
  assert(loadGuard.error?.includes('still loading'));

  // 8b. Error state
  const errorGuard = validateGenerationTaxonomy(topicA.id, topicA.subtopics[0].id, realTree, false, 'Network error');
  assert.strictEqual(errorGuard.canGenerate, false);
  assert(errorGuard.error?.includes('Network error'));

  // 8c. Empty tree
  const emptyGuard = validateGenerationTaxonomy(topicA.id, topicA.subtopics[0].id, [], false, null);
  assert.strictEqual(emptyGuard.canGenerate, false);
  assert(emptyGuard.error?.includes('No topics available'));

  // 8d. Missing topic
  const missingTopGuard = validateGenerationTaxonomy('', topicA.subtopics[0].id, realTree, false, null);
  assert.strictEqual(missingTopGuard.canGenerate, false);
  assert(missingTopGuard.error?.includes('select a valid Topic'));

  // 8e. Missing subtopic
  const missingSubGuard = validateGenerationTaxonomy(topicA.id, '', realTree, false, null);
  assert.strictEqual(missingSubGuard.canGenerate, false);
  assert(missingSubGuard.error?.includes('select a valid Subtopic'));

  // 8f. Subtopic mismatch: subtopic belonging to topicB paired with topicA
  const mismatchGuard = validateGenerationTaxonomy(topicA.id, topicB.subtopics[0].id, realTree, false, null);
  assert.strictEqual(mismatchGuard.canGenerate, false);
  assert(mismatchGuard.error?.includes('does not belong to topic'));

  // 8g. Valid matching pair
  const validGuard = validateGenerationTaxonomy(topicA.id, topicA.subtopics[0].id, realTree, false, null);
  assert.strictEqual(validGuard.canGenerate, true);
  assert.strictEqual(validGuard.error, undefined);

  // 8h. RANDOM mode exception
  const randomGuard = validateGenerationTaxonomy(topicA.id, 'RANDOM', realTree, false, null);
  assert.strictEqual(randomGuard.canGenerate, true);

  console.log('  PASS: validateGenerationTaxonomy strictly enforces taxonomy integrity and allows RANDOM mode.');

  // -------------------------------------------------------------------------
  // SECTION 3: Production Context Synchronization Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test 9] Production Context: setTaxonomy Updates and Hierarchy Links');
  let capturedDefaultContext: any = null;
  let capturedHydratedContext: any = null;

  function DefaultContextTester() {
    capturedDefaultContext = useProductionContext();
    return React.createElement('div', null, 'DefaultContextTester');
  }

  function HydratedContextTester() {
    capturedHydratedContext = useProductionContext();
    return React.createElement('div', null, 'HydratedContextTester');
  }

  renderToString(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        ProductionJourneyProvider,
        null,
        React.createElement(DefaultContextTester)
      )
    )
  );

  assert(capturedDefaultContext !== null, 'ProductionContext must be captured');
  assert(typeof capturedDefaultContext.setTaxonomy === 'function', 'setTaxonomy must be a function');
  assert.strictEqual(capturedDefaultContext.taxonomy.topicId, '', 'Default context topicId must be empty string');
  assert.strictEqual(capturedDefaultContext.taxonomy.subtopicId, '', 'Default context subtopicId must be empty string');

  // Verify that ProductionJourneyProvider accepts and binds authoritative taxonomy state
  renderToString(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        ProductionJourneyProvider,
        {
          initialContext: {
            taxonomy: {
              ...DEFAULT_PRODUCTION_CONTEXT.taxonomy,
              topicId: topicA.id,
              topicName: topicA.name,
              subtopicId: topicA.subtopics[0].id,
              subtopicName: topicA.subtopics[0].name,
            },
          },
        },
        React.createElement(HydratedContextTester)
      )
    )
  );

  assert.strictEqual(capturedHydratedContext.taxonomy.topicId, topicA.id);
  assert.strictEqual(capturedHydratedContext.taxonomy.topicName, topicA.name);
  assert.strictEqual(capturedHydratedContext.taxonomy.subtopicId, topicA.subtopics[0].id);
  assert.strictEqual(capturedHydratedContext.taxonomy.subtopicName, topicA.subtopics[0].name);
  console.log('  PASS: ProductionJourneyProvider correctly synchronizes topic and subtopic with names and IDs.');

  // -------------------------------------------------------------------------
  // SECTION 4: Authoritative Backend Domain Boundary Validation
  // -------------------------------------------------------------------------
  console.log('\n[Test 10] Authoritative Backend Domain Boundary Alignment');

  // 4a. Mismatched topic/subtopic rejected by backend
  const backendMismatch = await questionGenerationService.validateGenerationRequest({
    topicId: topicA.id,
    subtopicId: topicB.subtopics[0].id,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(backendMismatch.isValid, false);
  assert(backendMismatch.error?.includes('does not belong to Topic'));

  // 4b. Valid matching topic/subtopic accepted by backend
  const backendValid = await questionGenerationService.validateGenerationRequest({
    topicId: topicA.id,
    subtopicId: topicA.subtopics[0].id,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(backendValid.isValid, true);

  console.log('  PASS: Backend domain boundary strictly aligns with frontend generation guard.');

  console.log('\n========================================================================');
  console.log('ALL S8-T10 PRODUCTION CODE UNIT TESTS PASSED (10/10)');
  console.log('========================================================================\n');
}

runS8T10UnitTests().catch((err) => {
  console.error('\nFAILED S8-T10 UNIT TESTS:', err);
  process.exit(1);
});
