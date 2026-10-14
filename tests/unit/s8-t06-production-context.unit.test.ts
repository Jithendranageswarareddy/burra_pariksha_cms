/**
 * BURRA PARIKSHA CMS — Unit Test Suite: ProductionContext Provider & Hook (S8-T06)
 *
 * Verifies:
 * 1. Default production context values (Taxonomy, ModeConfig, EntityIds, Workflow, Assignment, Actor).
 * 2. Content production mode configuration validation across all 3 modes (ADR-010).
 * 3. Two-tier Topic -> Subtopic link validation (zero Category).
 * 4. Provider export integrity and backward compatibility with useProductionJourney.
 * 5. Full React rendering simulation with ProductionJourneyProvider, useProductionContext, and useProductionJourney.
 */

import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  DEFAULT_PRODUCTION_CONTEXT,
  validateProductionModeConfig,
  validateTaxonomyLink,
  QuestionLanguage,
  DifficultyLevel,
  CanonicalRbacRole,
} from '../../shared';

import {
  ProductionJourneyProvider,
  ProductionContextProvider,
  useProductionContext,
  useProductionJourney,
  STAGE_DEFINITIONS,
  getJourneyStageById,
  getNextStage,
} from '../../frontend/contexts/ProductionJourneyContext';

async function runProductionContextUnitTests() {
  console.log('============================================================');
  console.log('UNIT TEST: ProductionContext Provider & Hook (S8-T06)');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TEST 1: Context Defaults
  // --------------------------------------------------------------------------
  try {
    console.log('[Test 1] Verifying DEFAULT_PRODUCTION_CONTEXT structure and values...');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.taxonomy.topicId, '');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.taxonomy.subtopicId, '');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.questionCount, 1);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.modeConfig.aspectRatio, '9:16');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.workflow.currentStage, 1);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.workflow.stageStatus, 'DRAFT');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.workflow.isTerminal, false);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.assignment.ownerId, '');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.actor.userId, '');
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.actor.isAiAgent, false);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.isDirty, false);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.isLoading, false);
    assert.strictEqual(DEFAULT_PRODUCTION_CONTEXT.error, null);
    console.log('  PASS: DEFAULT_PRODUCTION_CONTEXT is valid and matches S8-T05 contract.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 1]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 2: Production Mode Configuration Validation
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Test 2] Verifying validateProductionModeConfig for Modes 1, 2, and 3...');

    // Mode 1: QUESTION_CHALLENGE_SHORT
    const m1ValidSingle = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '9:16');
    assert.strictEqual(m1ValidSingle.isValid, true);

    const m1ValidBatch = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 5, '9:16');
    assert.strictEqual(m1ValidBatch.isValid, true);

    const m1InvalidCount = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 3, '9:16');
    assert.strictEqual(m1InvalidCount.isValid, false);
    assert(m1InvalidCount.error?.includes('questionCount'));

    const m1InvalidAspect = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '16:9');
    assert.strictEqual(m1InvalidAspect.isValid, false);
    assert(m1InvalidAspect.error?.includes('aspect ratio'));

    // Mode 2: TOPIC_INTRODUCTION
    const m2ValidVertical = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '9:16');
    assert.strictEqual(m2ValidVertical.isValid, true);

    const m2ValidLandscape = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '16:9');
    assert.strictEqual(m2ValidLandscape.isValid, true);

    const m2InvalidCount = validateProductionModeConfig('TOPIC_INTRODUCTION', 1, '9:16');
    assert.strictEqual(m2InvalidCount.isValid, false);
    assert(m2InvalidCount.error?.includes('questionCount to be 0'));

    // Mode 3: EXPLAINED_QUESTIONS_VIDEO
    const m3Valid10 = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '16:9');
    assert.strictEqual(m3Valid10.isValid, true);

    const m3Valid20 = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 20, '16:9');
    assert.strictEqual(m3Valid20.isValid, true);

    const m3InvalidCount = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 1, '16:9');
    assert.strictEqual(m3InvalidCount.isValid, false);

    const m3InvalidAspect = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '9:16');
    assert.strictEqual(m3InvalidAspect.isValid, false);
    assert(m3InvalidAspect.error?.includes('16:9'));

    console.log('  PASS: validateProductionModeConfig enforces all rules from ADR-010.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 2]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 3: Taxonomy Two-Tier Validation (Topic -> Subtopic, Zero Category)
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Test 3] Verifying validateTaxonomyLink...');

    const validLink = validateTaxonomyLink('top_history_101', 'top_history_101');
    assert.strictEqual(validLink.isValid, true);

    const invalidLink = validateTaxonomyLink('top_history_101', 'top_geography_202');
    assert.strictEqual(invalidLink.isValid, false);
    assert(invalidLink.error?.includes('Taxonomy link violation'));

    const emptyTopic = validateTaxonomyLink('', 'top_history_101');
    assert.strictEqual(emptyTopic.isValid, false);

    const emptySubtopicLink = validateTaxonomyLink('top_history_101', '');
    assert.strictEqual(emptySubtopicLink.isValid, false);

    console.log('  PASS: validateTaxonomyLink enforces authoritative two-tier linkage.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 3]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 4: Provider & Hook Export Integrity & Aliasing
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Test 4] Verifying provider exports, aliases, and journey helpers...');
    assert.strictEqual(typeof ProductionJourneyProvider, 'function');
    assert.strictEqual(ProductionContextProvider, ProductionJourneyProvider);
    assert.strictEqual(typeof useProductionJourney, 'function');
    assert.strictEqual(typeof useProductionContext, 'function');

    assert.strictEqual(STAGE_DEFINITIONS.length, 15);
    const s1 = getJourneyStageById(1);
    assert.strictEqual(s1?.stageNumber, 1);
    assert.strictEqual(s1?.route, '/studio');

    const s15 = getJourneyStageById(15);
    assert.strictEqual(s15?.stageNumber, 15);

    const next1 = getNextStage(1);
    assert.strictEqual(next1?.stageNumber, 2);

    const next15 = getNextStage(15);
    assert.strictEqual(next15?.stageNumber, 1); // Loops back to 1

    console.log('  PASS: Provider, aliases, and journey stage helpers fully intact.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 4]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 5: React Component Tree Hydration & Dual-Hook Consumption
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Test 5] Simulating React tree rendering with ProductionJourneyProvider...');

    function TestConsumer() {
      const prodContext = useProductionContext();
      const journey = useProductionJourney();

      return React.createElement(
        'div',
        {
          id: 'test-node',
          'data-mode': prodContext.modeConfig.productionMode,
          'data-count': String(prodContext.modeConfig.questionCount),
          'data-aspect': prodContext.modeConfig.aspectRatio,
          'data-topic': prodContext.taxonomy.topicId,
          'data-stage': String(prodContext.workflow.currentStage),
          'data-journey-stage': String(journey.currentStage),
          'data-is-terminal': String(prodContext.workflow.isTerminal),
          'data-is-dirty': String(prodContext.isDirty),
          'data-actor-role': prodContext.actor.roles[0] || 'NONE',
        },
        'Rendered'
      );
    }

    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(
          ProductionJourneyProvider,
          {
            initialContext: {
              taxonomy: {
                topicId: 'top_speed_math_01',
                topicName: 'Speed Math',
                topicSlug: 'speed-math',
                subtopicId: 'sub_multiplication_02',
                subtopicName: 'Multiplication Tricks',
                subtopicSlug: 'multiplication-tricks',
              },
              modeConfig: {
                productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
                questionCount: 10,
                aspectRatio: '16:9',
                language: QuestionLanguage.TELUGU_ENGLISH,
                difficulty: DifficultyLevel.HARD,
              },
              workflow: {
                currentStage: 7,
                stageStatus: 'PENDING_REVIEW',
                isTerminal: false,
                lastTransitionAt: '2026-10-14T10:00:00Z',
                lastTransitionBy: 'usr_editor_1',
                allowedActions: ['approve', 'reject'],
              },
              actor: {
                userId: 'usr_qc_lead_9',
                name: 'QC Reviewer',
                roles: [CanonicalRbacRole.QA_REVIEWER],
                capabilities: ['VIDEO:APPROVE'],
                isAiAgent: false,
              },
              isDirty: true,
            },
          },
          React.createElement(TestConsumer)
        )
      )
    );

    assert(html.includes('data-mode="EXPLAINED_QUESTIONS_VIDEO"'), 'Should render configured productionMode');
    assert(html.includes('data-count="10"'), 'Should render configured questionCount');
    assert(html.includes('data-aspect="16:9"'), 'Should render configured aspectRatio');
    assert(html.includes('data-topic="top_speed_math_01"'), 'Should render configured topicId');
    assert(html.includes('data-stage="7"'), 'Should render configured workflow currentStage');
    assert(html.includes('data-journey-stage="7"'), 'Should synchronize currentStage with useProductionJourney');
    assert(html.includes('data-is-dirty="true"'), 'Should render isDirty flag');
    assert(html.includes('data-actor-role="QA_REVIEWER"'), 'Should render actor roles');

    console.log('  PASS: React render test succeeded with 100% dual-hook interoperability.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 5]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 6: Action Handlers & State Setter Invariants
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Test 6] Verifying action handlers and state setter bindings...');

    let capturedActions: any = null;
    let capturedContext: any = null;

    function ActionTester() {
      const prodContext = useProductionContext();
      capturedActions = {
        setTaxonomy: prodContext.setTaxonomy,
        setModeConfig: prodContext.setModeConfig,
        setEntityIds: prodContext.setEntityIds,
        setWorkflow: prodContext.setWorkflow,
        setAssignment: prodContext.setAssignment,
        setIsDirty: prodContext.setIsDirty,
        setError: prodContext.setError,
        resetContext: prodContext.resetContext,
      };
      capturedContext = prodContext;
      return React.createElement('div', null, 'ActionTester');
    }

    renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(
          ProductionJourneyProvider,
          null,
          React.createElement(ActionTester)
        )
      )
    );

    assert(typeof capturedActions.setTaxonomy === 'function', 'setTaxonomy must be a function');
    assert(typeof capturedActions.setModeConfig === 'function', 'setModeConfig must be a function');
    assert(typeof capturedActions.setEntityIds === 'function', 'setEntityIds must be a function');
    assert(typeof capturedActions.setWorkflow === 'function', 'setWorkflow must be a function');
    assert(typeof capturedActions.setAssignment === 'function', 'setAssignment must be a function');
    assert(typeof capturedActions.setIsDirty === 'function', 'setIsDirty must be a function');
    assert(typeof capturedActions.setError === 'function', 'setError must be a function');
    assert(typeof capturedActions.resetContext === 'function', 'resetContext must be a function');
    assert.strictEqual(capturedContext.isDirty, false);

    console.log('  PASS: Action handlers and state setters correctly bound.');
    passed++;
  } catch (err: any) {
    console.error('  FAIL [Test 6]:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`PRODUCTION CONTEXT UNIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionContextUnitTests().catch((err) => {
  console.error('Unhandled fatal error during test execution:', err);
  process.exit(1);
});
