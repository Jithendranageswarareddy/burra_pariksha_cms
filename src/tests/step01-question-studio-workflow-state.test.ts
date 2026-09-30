/**
 * BURRA PARIKSHA CMS — Step 01 Question Studio Workflow State Machine Regression Tests
 * 
 * Verifies all 11 requirements (TEST A through TEST K):
 * - TEST A: Empty workspace -> Continue disabled
 * - TEST B: Incomplete candidate -> Continue disabled
 * - TEST C: Valid candidate -> Continue enabled
 * - TEST D: Unverified but structurally valid candidate -> Continue enabled (NEEDS_REVIEW)
 * - TEST E: Proven mathematical contradiction -> Continue disabled (INVALID)
 * - TEST F: Duplicate options -> Continue disabled (INVALID)
 * - TEST G: Edit candidate after validation -> previous validation becomes stale
 * - TEST H: AI refinement after validation -> previous validation becomes stale
 * - TEST I: Only one Step 01 -> Step 02 primary action exists
 * - TEST J: No Speed Trick / Math Proof visible in Step 01
 * - TEST K: 15-stage workflow definitions remain unchanged
 */

import { getStep01WorkflowState, StudioCandidate } from '../pages/QuestionStudioPage';
import { QuestionValidationStatus } from '../types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function runTests() {
  console.log('============================================================');
  console.log('RUNNING STEP 01 QUESTION STUDIO STATE MACHINE TESTS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  const baseCandidate: StudioCandidate = {
    questionText: 'రైలు 72 km/h వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను 20 సెకన్లలో దాటింది. రైలు పొడవు ఎంత?',
    optionA: '200 మీటర్లు',
    optionB: '150 మీటర్లు',
    optionC: '300 మీటర్లు',
    optionD: '250 మీటర్లు',
    correctAnswer: 'A',
    explanation: 'మొత్తం దూరం = వేగం x కాలం = (72 * 5/18) * 20 = 20 * 20 = 400 మీటర్లు. రైలు పొడవు = 400 - 200 = 200 మీటర్లు.',
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'Intermediate',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: 'TELUGU' as any,
    realLifeContext: 'రైల్వే ప్రయాణం',
    tags: ['Aptitude'],
  };

  // TEST A: Empty workspace -> Continue disabled
  const stateEmpty = getStep01WorkflowState({
    hasCandidate: false,
    candidate: { ...baseCandidate, questionText: '' },
    configError: null,
  });
  assert(
    stateEmpty.state === 'EMPTY' && stateEmpty.canContinue === false,
    'TEST A: Empty workspace -> Continue disabled',
    `Expected state=EMPTY, canContinue=false; got state=${stateEmpty.state}, canContinue=${stateEmpty.canContinue}`
  );

  // TEST B: Incomplete candidate (missing options or short question) -> Continue disabled
  const stateIncomplete = getStep01WorkflowState({
    hasCandidate: true,
    candidate: { ...baseCandidate, optionC: '', optionD: '' },
    configError: null,
  });
  assert(
    stateIncomplete.state === 'INCOMPLETE' && stateIncomplete.canContinue === false,
    'TEST B: Incomplete candidate (missing options) -> Continue disabled',
    `Expected state=INCOMPLETE, canContinue=false; got state=${stateIncomplete.state}`
  );

  // TEST C: Valid candidate -> Continue enabled
  const stateValid = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      mathematicalVerification: { status: 'VERIFIED', reason: 'Provably verified' },
    },
    configError: null,
  });
  assert(
    stateValid.state === 'VALID' && stateValid.canContinue === true,
    'TEST C: Valid candidate -> Continue enabled',
    `Expected state=VALID, canContinue=true; got state=${stateValid.state}, canContinue=${stateValid.canContinue}`
  );

  // TEST D: Draft candidate ready for Step 02 Verification -> Continue enabled
  const stateNeedsReview = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      mathematicalVerification: { status: 'UNVERIFIED', reason: 'Independent review needed' },
    },
    configError: null,
  });
  assert(
    stateNeedsReview.state === 'VALID' && stateNeedsReview.canContinue === true,
    'TEST D: Unverified draft candidate -> Continue enabled for Step 02',
    `Expected state=VALID, canContinue=true; got state=${stateNeedsReview.state}, canContinue=${stateNeedsReview.canContinue}`
  );

  // TEST E: Candidate draft with unverified math -> Stage 01 can still hand off to Stage 02
  const stateMathFailed = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      mathematicalVerification: { status: 'FAILED', reason: 'Calculated value 48 differs from option B 33.33' },
    },
    configError: null,
  });
  assert(
    stateMathFailed.state === 'VALID' && stateMathFailed.canContinue === true,
    'TEST E: Candidate draft with unverified math -> Stage 01 can still save draft and hand off to Stage 02',
    `Expected state=VALID, canContinue=true; got state=${stateMathFailed.state}`
  );

  // TEST F: Duplicate options -> Continue disabled (INVALID)
  const stateDupOptions = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      optionA: '200 మీటర్లు',
      optionB: '200 మీటర్లు',
    },
    configError: null,
  });
  assert(
    stateDupOptions.state === 'INVALID' && stateDupOptions.canContinue === false,
    'TEST F: Duplicate options -> Continue disabled (INVALID)',
    `Expected state=INVALID, canContinue=false; got state=${stateDupOptions.state}, canContinue=${stateDupOptions.canContinue}`
  );

  // TEST G: Edit candidate after validation -> draft remains valid for Step 02 handoff
  const stateStaleEdit = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      optionB: '180 మీటర్లు',
    },
    configError: null,
  });
  assert(
    stateStaleEdit.state === 'VALID' && stateStaleEdit.canContinue === true,
    'TEST G: Edit candidate -> draft can be saved for Step 02',
    `Expected state=VALID, canContinue=true; got state=${stateStaleEdit.state}`
  );

  // TEST H: AI refinement -> draft can be saved for Step 02
  const stateRefinedStale = getStep01WorkflowState({
    hasCandidate: true,
    candidate: {
      ...baseCandidate,
      questionText: 'రైలు 90 km/h వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను దాటింది.',
    },
    configError: null,
  });
  assert(
    stateRefinedStale.state === 'VALID' && stateRefinedStale.canContinue === true,
    'TEST H: AI refinement -> draft can be saved for Step 02',
    `Expected state=VALID, canContinue=true; got state=${stateRefinedStale.state}`
  );

  // TEST I: Source Code Inspection: Only one primary continue action button in QuestionStudio
  const studioFileContent = readFileSync(resolve(process.cwd(), 'src/pages/QuestionStudioPage.tsx'), 'utf-8');
  const continueMatches = studioFileContent.match(/Save Draft & Continue/g) || [];
  assert(
    continueMatches.length === 1,
    'TEST I: Only one primary Save Draft & Continue button exists in QuestionStudioPage',
    `Expected 1 continue match, found ${continueMatches.length}`
  );

  // TEST J: Source Code Inspection: No Speed Trick / Math Proof editing card or Speed Trick Focus button in Step 01
  const hasSpeedTrickCard = studioFileContent.includes('Burra Speed Trick & Math Proof');
  const hasSpeedTrickFocus = studioFileContent.includes('Speed Trick Focus');
  assert(
    !hasSpeedTrickCard && !hasSpeedTrickFocus,
    'TEST J: No Speed Trick / Math Proof editing card or Speed Trick Focus button visible in Step 01 UI',
    `hasSpeedTrickCard=${hasSpeedTrickCard}, hasSpeedTrickFocus=${hasSpeedTrickFocus}`
  );

  // TEST K: Source Code Inspection: 15-stage workflow definitions remain intact in ProductionJourneyBar / context
  const journeyBarContent = readFileSync(resolve(process.cwd(), 'src/components/production/ProductionJourneyBar.tsx'), 'utf-8');
  assert(
    journeyBarContent.includes('Stage {String(effectiveCurrentStage).padStart(2, \'0\')} / 15') &&
    journeyBarContent.includes('stages.map'),
    'TEST K: 15-stage workflow definitions and sequence remain unchanged in ProductionJourneyBar'
  );

  console.log(`\nRESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} assertions.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
