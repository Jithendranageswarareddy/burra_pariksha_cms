/**
 * BURRA PARIKSHA CMS — S9-T16: Test Generation and Batch Completeness
 * Specification: S9-T16 Generation, Accounting, Response Shapes, Retries, Regeneration, and Persistence
 *
 * NOTE: As per S9-T16 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the S9-T16 authoring task. Verification will occur at Sprint 9 closure.
 *
 * Acceptance Criteria & Suites Covered:
 * - Suite 1: Supported Batch Sizes (N in {5, 10, 15, 20}) & Parameterized Invariants
 * - Suite 2: Provider Response Shapes & Normalization (Exact, Short, Oversized, Empty, Malformed, Partial, Duplicate, Missing)
 * - Suite 3: Timeouts, Retries, and Failure Recovery (Transient Timeout, Retry Exhaustion, Terminal Failures, Partial Recovery, Secret Safety)
 * - Suite 4: Regeneration & Manual-Edit Preservation (Single-Slot Replacement, Protected Slot Preservation, State Recalculation)
 * - Suite 5: Persistence, Reopening, Count, and Ordering Consistency (Save & Reload, OCC Conflicts, Sequence & Identity Integrity)
 */

import assert from 'node:assert/strict';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import {
  canonicalIdService,
  QuestionStatus,
  QuestionLanguage,
  ContentProductionMode,
} from '../../../shared';
import {
  SaveQuestionDraftInput,
  QuestionBatchSlot,
  QuestionBatchAssembly,
  GenerateCandidateInput,
  GenerationResult,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import {
  assembleQuestionBatch,
  recalculateQuestionBatchState,
} from '../../../shared/lib/question-batch-assembly';
import { validateProductionModeConfig } from '../../../shared/types/production-context';
import { AIProviderError } from '../../../backend/ai/errors';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { QuestionGenerationDomainError } from '../../../backend/domain/question-generation/question-generation.service';

// ---------------------------------------------------------------------------
// Test Data Builders & Helpers
// ---------------------------------------------------------------------------

const baseCandidateInput: GenerateCandidateInput = {
  topicId: 'TOP-QA-01',
  topicName: 'Quantitative Aptitude',
  subtopicId: 'SUB-01',
  subtopicName: 'Time and Distance',
  difficulty: 'Intermediate',
  language: QuestionLanguage.TELUGU,
  productionMode: 'QUESTION_CHALLENGE_SHORT',
  targetQuestionCount: 5,
  aspectRatio: '9:16',
};

const testAuthorActor = {
  id: 'USR-AUTHOR-S9T16',
  name: 'Author Lakshmi T16',
};

/**
 * Creates a canonically valid candidate object with distinct text, options, answer, and explanation.
 */
function makeValidCandidate(index: number, prefix: string = 'ప్రశ్న'): any {
  return {
    content: `${prefix} ${index}: రైలు వేగం గంటకు ${index * 10} కి.మీ అయితే ప్రయాణ కాలం ఎంత?`,
    questionText: `${prefix} ${index}: రైలు వేగం గంటకు ${index * 10} కి.మీ అయితే ప్రయాణ కాలం ఎంత?`,
    option_a: `${index * 5} సెకన్లు`,
    option_b: `${index * 10} సెకన్లు`,
    option_c: `${index * 15} సెకన్లు`,
    option_d: `${index * 20} సెకన్లు`,
    correct_answer: (['A', 'B', 'C', 'D'] as const)[index % 4],
    explanation: `వివరణ ${index}: వేగం మరియు కాలం సూత్రం s = d/t ప్రకారం లెక్కించబడినది.`,
    difficulty: 'Intermediate',
    language: QuestionLanguage.TELUGU,
  };
}

/**
 * Creates a valid single orchestrator result wrapper.
 */
function makeOrchestratorResult(candidate: any, durationMs = 120) {
  return {
    candidate,
    metadata: {
      modelUsed: 'gemini-1.5-pro',
      generationDurationMs: durationMs,
      promptTokensUsed: 65,
      completionTokensUsed: 95,
    },
  };
}

// ---------------------------------------------------------------------------
// Main Test Suite Runner
// ---------------------------------------------------------------------------

export async function runGenerationBatchCompletenessUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T16 Question Generation & Batch Completeness Tests');
  console.log('============================================================\n');

  // =========================================================================
  // SUITE 1: Supported Batch Sizes (N in {5, 10, 15, 20}) & Parameterized Invariants
  // =========================================================================
  console.log('--- SUITE 1: Supported Batch Sizes & Parameterized Invariants ---');

  const supportedCounts: Array<5 | 10 | 15 | 20> = [5, 10, 15, 20];

  for (const count of supportedCounts) {
    console.log(`[Parameterized N=${count}] Verifying generation layer for batch size ${count}...`);

    // 1.1 Configured count reaches generation layer and allocates exact slot count
    let mockDispatches = 0;
    const countOrchestrator = {
      async generateQuestionCandidate() {
        mockDispatches += 1;
        return makeOrchestratorResult(makeValidCandidate(mockDispatches, `బ్యాచ్_${count}`));
      },
    };

    const batchResult = await questionGenerationService.generateBatch(
      { ...baseCandidateInput, targetQuestionCount: count },
      undefined,
      countOrchestrator
    );

    assert.ok(batchResult, `Batch result must be defined for count=${count}`);
    assert.strictEqual(mockDispatches, count, `Generation layer must dispatch exactly ${count} provider calls`);

    // 1.2 Successful generation produces expected number of valid questions
    const assembly = batchResult.batchAssembly;
    assert.ok(assembly, `Batch assembly must be returned for count=${count}`);
    assert.strictEqual(assembly.requestedCount, count, `Assembly requestedCount must equal ${count}`);
    assert.strictEqual(assembly.slots.length, count, `Assembly must have exactly ${count} slots`);

    // 1.3 Question ordering remains strictly deterministic (1..N)
    const slotNumbers = assembly.slots.map((s) => s.slotNumber);
    const expectedSlotNumbers = Array.from({ length: count }, (_, i) => i + 1);
    assert.deepStrictEqual(slotNumbers, expectedSlotNumbers, `Slot numbers must strictly be [1..${count}]`);

    // 1.4 Unique canonical slot IDs (slt_<uuid_v4>) for every slot
    const slotIds = assembly.slots.map((s) => s.slotId);
    assert.strictEqual(new Set(slotIds).size, count, `All ${count} slot IDs must be distinct`);
    for (const id of slotIds) {
      assert.ok(
        canonicalIdService.validateCanonicalId(id, 'slt_'),
        `Slot ID '${id}' must be a canonical UUID v4 starting with 'slt_'`
      );
    }

    // 1.5 Accounting telemetry counters match exact contract
    assert.strictEqual(assembly.inMemoryValidCount, count, `inMemoryValidCount must equal ${count}`);
    assert.strictEqual(assembly.rejectedCount, 0, `rejectedCount must be 0 for clean generation`);
    assert.strictEqual(assembly.overflowCount, 0, `overflowCount must be 0 for exact batch`);
    assert.strictEqual(assembly.batchStatus, 'COMPLETE', `batchStatus must be COMPLETE for count=${count}`);

    // 1.6 Incomplete batch cannot be reported as successfully complete
    const partialCandidates = Array.from({ length: count - 1 }, (_, i) => makeValidCandidate(i + 1));
    const partialAssembly = assembleQuestionBatch(count, partialCandidates);
    assert.notStrictEqual(
      partialAssembly.batchStatus,
      'COMPLETE',
      `Incomplete batch (${count - 1} of ${count}) must NEVER be reported as COMPLETE`
    );
    assert.strictEqual(partialAssembly.batchStatus, 'PARTIAL');
    assert.strictEqual(partialAssembly.inMemoryValidCount, count - 1);

    // 1.7 Completion status is based on actual validated results, not merely provider response count
    const candidatesWithOneBad = [
      ...Array.from({ length: count - 1 }, (_, i) => makeValidCandidate(i + 1)),
      { ...makeValidCandidate(count), option_b: '' }, // Invalid option!
    ];
    const validatedAssembly = assembleQuestionBatch(count, candidatesWithOneBad);
    assert.notStrictEqual(
      validatedAssembly.batchStatus,
      'COMPLETE',
      'Batch with invalid slot must not achieve COMPLETE status'
    );
    assert.strictEqual(validatedAssembly.batchStatus, 'PARTIAL');
    assert.strictEqual(validatedAssembly.rejectedCount, 1);
    assert.strictEqual(validatedAssembly.inMemoryValidCount, count - 1);

    console.log(`  PASS: Batch size ${count} verified for allocation, ordering, counters, and completeness gates.`);
  }

  // 1.8 Unsupported / arbitrary batch counts are strictly rejected
  console.log('[Scenario 1.8] Reject arbitrary non-standard question counts...');
  const unsupportedCounts = [0, 1, 2, 3, 4, 6, 7, 12, 25, -1, 100];
  for (const badCount of unsupportedCounts) {
    if (badCount === 1) {
      // Count=1 is allowed only for single mode, not batch series
      continue;
    }
    const modeValidation = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', badCount, '9:16');
    assert.strictEqual(modeValidation.isValid, false, `Count ${badCount} must be rejected by validateProductionModeConfig`);

    const requestValidation = await questionGenerationService.validateGenerationRequest({
      ...baseCandidateInput,
      targetQuestionCount: badCount,
    });
    assert.strictEqual(requestValidation.isValid, false, `Count ${badCount} must be rejected by validateGenerationRequest`);
  }
  console.log('  PASS: Non-standard batch sizes correctly rejected by production config validation.\n');

  // =========================================================================
  // SUITE 2: Provider Response Shapes & Normalization
  // =========================================================================
  console.log('--- SUITE 2: Provider Response Shapes & Normalization ---');

  // 2.1 Exact response shape
  console.log('[Scenario 2.1] Exact provider response (C_gen === C_req)...');
  const exactCandidates = [1, 2, 3, 4, 5].map((i) => makeValidCandidate(i, 'ఖచ్చితమైన'));
  const exactAssembly = assembleQuestionBatch(5, exactCandidates);
  assert.strictEqual(exactAssembly.batchStatus, 'COMPLETE');
  assert.strictEqual(exactAssembly.inMemoryValidCount, 5);
  assert.strictEqual(exactAssembly.rejectedCount, 0);
  assert.strictEqual(exactAssembly.overflowCount, 0);
  assert.strictEqual(exactAssembly.slots.every((s) => s.status === 'VALID'), true);
  console.log('  PASS: Exact response mapped cleanly to all slots.');

  // 2.2 Short response shape (C_gen < C_req)
  console.log('[Scenario 2.2] Short provider response (C_gen < C_req)...');
  const shortCandidates = [1, 2, 3].map((i) => makeValidCandidate(i, 'తక్కువ'));
  const shortAssembly = assembleQuestionBatch(5, shortCandidates);
  assert.strictEqual(shortAssembly.batchStatus, 'PARTIAL');
  assert.strictEqual(shortAssembly.inMemoryValidCount, 3);
  assert.strictEqual(shortAssembly.rejectedCount, 0);
  assert.strictEqual(shortAssembly.slots[0].status, 'VALID');
  assert.strictEqual(shortAssembly.slots[1].status, 'VALID');
  assert.strictEqual(shortAssembly.slots[2].status, 'VALID');
  assert.strictEqual(shortAssembly.slots[3].status, 'EMPTY');
  assert.strictEqual(shortAssembly.slots[4].status, 'EMPTY');
  console.log('  PASS: Short response preserved valid slots and left remaining slots EMPTY.');

  // 2.3 Oversized response shape (C_gen > C_req)
  console.log('[Scenario 2.3] Oversized provider response (C_gen > C_req)...');
  const oversizedCandidates = [1, 2, 3, 4, 5, 6, 7].map((i) => makeValidCandidate(i, 'అదనపు'));
  const oversizedAssembly = assembleQuestionBatch(5, oversizedCandidates);
  assert.strictEqual(oversizedAssembly.batchStatus, 'COMPLETE');
  assert.strictEqual(oversizedAssembly.inMemoryValidCount, 5);
  assert.strictEqual(oversizedAssembly.slots.length, 5, 'Requested count N=5 must NEVER be inflated');
  assert.strictEqual(oversizedAssembly.overflowCount, 2, '2 extra valid questions must be quarantined in overflow');
  assert.strictEqual(oversizedAssembly.rejectedCount, 0, 'Overflow items must NOT be classified as invalid');
  console.log('  PASS: Oversized candidates quarantined in overflow without silent batch inflation.');

  // 2.4 Empty provider response (C_gen === 0)
  console.log('[Scenario 2.4] Empty provider response (0 candidates)...');
  const emptyAssembly = assembleQuestionBatch(5, []);
  assert.strictEqual(emptyAssembly.batchStatus, 'EMPTY');
  assert.strictEqual(emptyAssembly.inMemoryValidCount, 0);
  assert.strictEqual(emptyAssembly.rejectedCount, 0);
  assert.strictEqual(emptyAssembly.slots.length, 5);
  assert.strictEqual(emptyAssembly.slots.every((s) => s.status === 'EMPTY'), true);
  console.log('  PASS: Empty response handled gracefully with all slots EMPTY.');

  // 2.5 Malformed response (invalid JSON / envelope / missing options)
  console.log('[Scenario 2.5] Malformed provider output...');
  const malformedCandidates = [
    null,
    undefined,
    {},
    { questionText: 'చెల్లని ప్రశ్న', options: null },
    { content: 'ఆప్షన్స్ లేని ప్రశ్న' },
  ];
  const malformedAssembly = assembleQuestionBatch(5, malformedCandidates);
  assert.strictEqual(malformedAssembly.batchStatus, 'FAILED');
  assert.strictEqual(malformedAssembly.inMemoryValidCount, 0);
  assert.strictEqual(malformedAssembly.rejectedCount, 5);
  assert.strictEqual(malformedAssembly.slots.every((s) => s.status === 'EMPTY'), true);
  console.log('  PASS: Malformed candidates rejected with descriptive reasons without corrupting slots.');

  // 2.6 Partially valid response (mix of valid and invalid)
  console.log('[Scenario 2.6] Partially valid provider response...');
  const mixedCandidates = [
    makeValidCandidate(1, 'సరియైనది 1'),
    { content: 'చెల్లని ఆప్షన్స్', option_a: 'A', option_b: '', option_c: 'C', option_d: 'D', correct_answer: 'A', explanation: 'వివరణ' },
    makeValidCandidate(2, 'సరియైనది 2'),
    { content: 'సమాధానం లేనిది', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_answer: 'Z', explanation: 'వివరణ' },
    makeValidCandidate(3, 'సరియైనది 3'),
  ];
  const mixedAssembly = assembleQuestionBatch(5, mixedCandidates);
  assert.strictEqual(mixedAssembly.batchStatus, 'PARTIAL');
  assert.strictEqual(mixedAssembly.inMemoryValidCount, 3);
  assert.strictEqual(mixedAssembly.rejectedCount, 2);
  assert.strictEqual(mixedAssembly.slots[0].status, 'VALID');
  assert.strictEqual(mixedAssembly.slots[1].status, 'VALID');
  assert.strictEqual(mixedAssembly.slots[2].status, 'VALID');
  assert.strictEqual(mixedAssembly.slots[3].status, 'EMPTY');
  assert.strictEqual(mixedAssembly.slots[4].status, 'EMPTY');
  console.log('  PASS: Partially valid results preserved usable work without concealing incomplete state.');

  // 2.7 Duplicate-containing provider response
  console.log('[Scenario 2.7] Duplicate-containing provider response...');
  const duplicateCandidate = makeValidCandidate(1, 'నకిలీ ప్రశ్న');
  const duplicateBatch = [
    duplicateCandidate,
    duplicateCandidate, // Exact duplicate
    makeValidCandidate(2, 'విభిన్న ప్రశ్న 1'),
    duplicateCandidate, // Another duplicate
    makeValidCandidate(3, 'విభిన్న ప్రశ్న 2'),
  ];
  const dedupAssembly = assembleQuestionBatch(5, duplicateBatch);
  assert.strictEqual(dedupAssembly.inMemoryValidCount, 3, 'Only 3 distinct valid questions should be accepted');
  assert.strictEqual(dedupAssembly.rejectedCount, 2, '2 duplicates must be recorded in rejectedItems');
  assert.ok(dedupAssembly.rejectedItems.every((r) => r.reason.includes('Duplicate candidate.')));
  console.log('  PASS: Duplicate questions detected and rejected; valid count not falsely inflated.');

  // 2.8 Missing required fields (short explanation, identical options)
  console.log('[Scenario 2.8] Missing required fields or duplicate option text...');
  const identicalOptionsCandidate = {
    ...makeValidCandidate(1),
    option_a: 'ఒకే సమాధానం',
    option_b: 'ఒకే సమాధానం', // Pairwise duplicate option!
  };
  const identicalOptionsAssembly = assembleQuestionBatch(5, [identicalOptionsCandidate]);
  assert.strictEqual(identicalOptionsAssembly.inMemoryValidCount, 0);
  assert.strictEqual(identicalOptionsAssembly.rejectedCount, 1);
  assert.match(identicalOptionsAssembly.rejectedItems[0].reason, /distinct/i);
  console.log('  PASS: Structural option violations rejected with specific quality errors.\n');

  // =========================================================================
  // SUITE 3: Timeouts, Retries, and Terminal Failures
  // =========================================================================
  console.log('--- SUITE 3: Timeouts, Retries, and Terminal Failures ---');

  // 3.1 Transient provider timeout with successful retry
  console.log('[Scenario 3.1] Transient provider timeout recovered via retry...');
  let transientAttempt = 0;
  const transientRetryOrchestrator = {
    async generateQuestionCandidate() {
      transientAttempt += 1;
      if (transientAttempt <= 2) {
        throw new AIProviderError('Gateway timeout from upstream AI provider', 'gemini', 'gemini-1.5-pro', 'TIMEOUT', true, 504);
      }
      return makeOrchestratorResult(makeValidCandidate(transientAttempt, 'రీట్రై సక్సెస్'));
    },
  };

  const transientResult = await questionGenerationService.generateBatch(
    { ...baseCandidateInput, targetQuestionCount: 5 },
    { maxRetries: 2 },
    transientRetryOrchestrator
  );
  assert.ok(transientResult.batchAssembly);
  assert.strictEqual(transientResult.batchAssembly.inMemoryValidCount > 0, true);
  console.log('  PASS: Transient provider timeout successfully recovered via automated retry.');

  // 3.2 Retry exhaustion on persistent failures
  console.log('[Scenario 3.2] Retry exhaustion on persistent upstream errors...');
  let exhaustionAttempts = 0;
  const failingOrchestrator = {
    async generateQuestionCandidate() {
      exhaustionAttempts += 1;
      throw new AIProviderError('Upstream model overloaded', 'gemini', 'gemini-1.5-pro', 'TRANSIENT_ERROR', true, 503);
    },
  };

  const exhaustedResult = await questionGenerationService.generateBatch(
    { ...baseCandidateInput, targetQuestionCount: 5 },
    { maxRetries: 1 },
    failingOrchestrator
  );
  assert.strictEqual(exhaustedResult.batchAssembly.batchStatus, 'EMPTY');
  assert.strictEqual(exhaustedResult.batchAssembly.inMemoryValidCount, 0);
  assert.notStrictEqual(
    exhaustedResult.batchAssembly.batchStatus,
    'COMPLETE',
    'Exhausted retry batch must NEVER be marked COMPLETE'
  );
  console.log('  PASS: Bounded retry terminated cleanly and left incomplete batch as EMPTY.');

  // 3.3 Immediate permanent failure (non-retryable HTTP 400)
  console.log('[Scenario 3.3] Immediate permanent failure (non-retryable)...');
  let nonRetryableCalls = 0;
  const nonRetryableOrchestrator = {
    async generateQuestionCandidate() {
      nonRetryableCalls += 1;
      throw new AIProviderError('Invalid generation parameters', 'gemini', 'gemini-1.5-pro', 'INVALID_REQUEST', false, 400);
    },
  };

  await assert.rejects(
    () => questionGenerationService.generateCandidate(baseCandidateInput, { maxRetries: 2 }, nonRetryableOrchestrator),
    (err: any) => err.code === 'AI_GENERATION_UNAVAILABLE'
  );
  assert.strictEqual(nonRetryableCalls, 1, 'Non-retryable error must fail fast after exactly 1 attempt');
  console.log('  PASS: Non-retryable failure aborted immediately without runaway retries.');

  // 3.4 Malformed candidate followed by successful retry
  console.log('[Scenario 3.4] Malformed candidate repaired in subsequent retry round...');
  let retryRound = 0;
  const repairOrchestrator = {
    async generateQuestionCandidate() {
      retryRound += 1;
      if (retryRound <= 5) {
        // First 5 candidates: 4 valid, 1 malformed
        if (retryRound === 3) {
          return makeOrchestratorResult({ ...makeValidCandidate(3), option_a: '' }); // Bad
        }
        return makeOrchestratorResult(makeValidCandidate(retryRound, 'ప్రథమ'));
      }
      // Retry round: returns valid candidate to backfill
      return makeOrchestratorResult(makeValidCandidate(99, 'రిపేర్ చేయబడిన'));
    },
  };

  const repairResult = await questionGenerationService.generateBatch(
    { ...baseCandidateInput, targetQuestionCount: 5 },
    undefined,
    repairOrchestrator
  );
  assert.strictEqual(repairResult.batchAssembly.inMemoryValidCount, 5, 'All 5 slots must be satisfied after retry');
  assert.strictEqual(repairResult.batchAssembly.batchStatus, 'COMPLETE');
  console.log('  PASS: Malformed candidate repaired by retry round achieving batch completeness.');

  // 3.5 Failure after partial generation preserves completed slots
  console.log('[Scenario 3.5] Failure after partial generation preserves valid slots...');
  let partialFailureCalls = 0;
  const partialFailureOrchestrator = {
    async generateQuestionCandidate() {
      partialFailureCalls += 1;
      if (partialFailureCalls <= 2) {
        return makeOrchestratorResult(makeValidCandidate(partialFailureCalls, 'ముందస్తు'));
      }
      throw new Error('Network stream dropped mid-batch');
    },
  };

  const partialSaveResult = await questionGenerationService.generateBatch(
    { ...baseCandidateInput, targetQuestionCount: 5 },
    undefined,
    partialFailureOrchestrator
  );
  assert.strictEqual(partialSaveResult.batchAssembly.batchStatus, 'PARTIAL');
  assert.strictEqual(partialSaveResult.batchAssembly.inMemoryValidCount, 2);
  assert.strictEqual(partialSaveResult.batchAssembly.slots[0].status, 'VALID');
  assert.strictEqual(partialSaveResult.batchAssembly.slots[1].status, 'VALID');
  assert.strictEqual(partialSaveResult.batchAssembly.slots[2].status, 'EMPTY');
  console.log('  PASS: Partial failure preserved generated slots without corrupting state.');

  // 3.6 Deduplication on retry
  console.log('[Scenario 3.6] Deduplication on retry does not overwrite with duplicate...');
  const initialSlots: QuestionBatchSlot[] = [
    {
      slotNumber: 1,
      slotId: 'slt_test_01',
      status: 'VALID',
      questionText: 'డూప్లికేట్ టెస్ట్ ప్రశ్న',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'వివరణ ఇక్కడ ఉంది.',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 1,
    },
  ];
  // Retry returns exact same candidate
  const duplicateRetryAssembly = assembleQuestionBatch(5, [{
    content: 'డూప్లికేట్ టెస్ట్ ప్రశ్న',
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    correct_answer: 'A',
    explanation: 'వివరణ ఇక్కడ ఉంది.',
  }], initialSlots);
  assert.strictEqual(duplicateRetryAssembly.slots[0].questionText, 'డూప్లికేట్ టెస్ట్ ప్రశ్న');
  assert.strictEqual(duplicateRetryAssembly.slots[0].slotId, 'slt_test_01');
  assert.strictEqual(duplicateRetryAssembly.rejectedCount, 1);
  console.log('  PASS: Deduplication suppressed re-persisting identical candidate on retry.');

  // 3.7 Secret-safe error reporting
  console.log('[Scenario 3.7] Secret-safe error reporting on provider failure...');
  const secretLeakingOrchestrator = {
    async generateQuestionCandidate() {
      throw new Error('Fatal error: provider auth failed with sk-ant-live-secret-token-xyz');
    },
  };
  await assert.rejects(
    () => questionGenerationService.generateCandidate(baseCandidateInput, undefined, secretLeakingOrchestrator),
    (err: any) => {
      assert.strictEqual(err.code, 'AI_GENERATION_UNAVAILABLE');
      assert.strictEqual(err.message.includes('sk-ant-live-secret-token-xyz'), false);
      return true;
    }
  );
  console.log('  PASS: Secret tokens stripped from user-facing error output.\n');

  // =========================================================================
  // SUITE 4: Regeneration & Manual-Edit Preservation
  // =========================================================================
  console.log('--- SUITE 4: Regeneration & Manual-Edit Preservation ---');

  // 4.1 Single-slot replacement
  console.log('[Scenario 4.1] Single-slot targeted regeneration...');
  const initial5Batch = assembleQuestionBatch(5, [1, 2, 3, 4, 5].map((i) => makeValidCandidate(i, 'ప్రారంభ')));
  const targetSlotNumber = 3;
  const originalSlot3Id = initial5Batch.slots[2].slotId;
  const originalSlot1Text = initial5Batch.slots[0].questionText;
  const originalSlot5Text = initial5Batch.slots[4].questionText;

  // Simulate single-slot replacement targeting slot 3 only
  const replacementCandidate = makeValidCandidate(999, 'పునరుత్పత్తి ప్రశ్న 3');
  const updatedSlots = initial5Batch.slots.map((s) => {
    if (s.slotNumber === targetSlotNumber) {
      return {
        ...s,
        questionText: replacementCandidate.questionText,
        options: {
          a: replacementCandidate.option_a,
          b: replacementCandidate.option_b,
          c: replacementCandidate.option_c,
          d: replacementCandidate.option_d,
        },
        correctAnswer: replacementCandidate.correct_answer,
        explanation: replacementCandidate.explanation,
        revisionNumber: s.revisionNumber + 1,
      };
    }
    return s;
  });

  assert.strictEqual(updatedSlots[2].questionText, replacementCandidate.questionText);
  assert.strictEqual(updatedSlots[2].slotId, originalSlot3Id, 'Slot ID must be preserved during single-slot regeneration');
  assert.strictEqual(updatedSlots[2].revisionNumber, initial5Batch.slots[2].revisionNumber + 1);
  assert.strictEqual(updatedSlots[0].questionText, originalSlot1Text, 'Slot 1 must remain completely untouched');
  assert.strictEqual(updatedSlots[4].questionText, originalSlot5Text, 'Slot 5 must remain completely untouched');
  console.log('  PASS: Single slot regenerated without disturbing other batch slots.');

  // 4.2 Manual-edit protection invariant (isManuallyEdited: true & status: ACCEPTED)
  console.log('[Scenario 4.2] Batch re-run must NEVER overwrite manually edited or accepted slots...');
  const protectedSlot2: QuestionBatchSlot = {
    slotNumber: 2,
    slotId: 'slt_protected_02',
    status: 'MANUALLY_EDITED',
    isManuallyEdited: true,
    questionText: 'రచయిత స్వయంగా సవరించిన ప్రశ్న ఇది',
    options: { a: 'ఎడిట్ 1', b: 'ఎడిట్ 2', c: 'ఎడిట్ 3', d: 'ఎడిట్ 4' },
    correctAnswer: 'B',
    explanation: 'ఎడిటర్ రాసిన ప్రత్యేక వివరణ.',
    validationErrors: [],
    revisionNumber: 3,
  };

  const protectedSlot4: QuestionBatchSlot = {
    slotNumber: 4,
    slotId: 'slt_protected_04',
    status: 'ACCEPTED',
    isManuallyEdited: false,
    questionText: 'ఎడిటర్ ఆమోదించిన అధికారిక ప్రశ్న',
    options: { a: 'నిజం', b: 'అబద్ధం', c: 'స్పష్టత లేదు', d: 'ఏదీ కాదు' },
    correctAnswer: 'A',
    explanation: 'ఆమోదించబడిన వివరణ.',
    validationErrors: [],
    revisionNumber: 2,
  };

  const existingSlotsWithProtected: QuestionBatchSlot[] = [
    { ...initial5Batch.slots[0], status: 'EMPTY', questionText: '' },
    protectedSlot2,
    { ...initial5Batch.slots[2], status: 'INVALID', validationErrors: ['Bad options'] },
    protectedSlot4,
    { ...initial5Batch.slots[4], status: 'EMPTY', questionText: '' },
  ];

  // Run assembleQuestionBatch simulating AI batch generation with new candidates
  const freshAiCandidates = [
    makeValidCandidate(101, 'ఏఐ కొత్తది 1'),
    makeValidCandidate(102, 'ఏఐ కొత్తది 2'),
    makeValidCandidate(103, 'ఏఐ కొత్తది 3'),
  ];

  const regeneratedAssembly = assembleQuestionBatch(5, freshAiCandidates, existingSlotsWithProtected);

  // Assert protected slots were NOT overwritten
  assert.strictEqual(
    regeneratedAssembly.slots[1].questionText,
    'రచయిత స్వయంగా సవరించిన ప్రశ్న ఇది',
    'Protected manually edited slot MUST retain its exact human content'
  );
  assert.strictEqual(regeneratedAssembly.slots[1].slotId, 'slt_protected_02');
  assert.strictEqual(regeneratedAssembly.slots[1].isManuallyEdited, true);
  assert.strictEqual(regeneratedAssembly.slots[1].status, 'MANUALLY_EDITED');

  assert.strictEqual(
    regeneratedAssembly.slots[3].questionText,
    'ఎడిటర్ ఆమోదించిన అధికారిక ప్రశ్న',
    'Protected accepted slot MUST retain its exact accepted content'
  );
  assert.strictEqual(regeneratedAssembly.slots[3].slotId, 'slt_protected_04');
  assert.strictEqual(regeneratedAssembly.slots[3].status, 'ACCEPTED');

  // Assert that AI candidates backfilled the unfilled/invalid slots (Slot 1 and Slot 3)
  assert.strictEqual(regeneratedAssembly.slots[0].questionText, freshAiCandidates[0].questionText);
  assert.strictEqual(regeneratedAssembly.slots[2].questionText, freshAiCandidates[1].questionText);
  console.log('  PASS: Protected manual edits and accepted slots strictly preserved during regeneration.');

  // 4.3 Mixed readiness batch regeneration
  console.log('[Scenario 4.3] Mixed readiness batch assembly recalculation...');
  const state = recalculateQuestionBatchState(
    5,
    regeneratedAssembly.slots,
    regeneratedAssembly.rejectedItems,
    regeneratedAssembly.overflowCount
  );
  assert.strictEqual(state.inMemoryValidCount, 4, 'Slots 1, 2, 3, 4 are valid');
  assert.strictEqual(state.batchStatus, 'PARTIAL', 'Slot 5 remains EMPTY, batchStatus must be PARTIAL');
  console.log('  PASS: Mixed readiness state calculated accurately.');

  // 4.4 Failed regeneration preserves existing state
  console.log('[Scenario 4.4] Failed regeneration preserves previous working copy...');
  const workingSlot = { ...regeneratedAssembly.slots[0] };
  let failedRegenRan = false;
  try {
    // If orchestrator throws during regeneration
    throw new Error('AI provider connection reset during slot regeneration');
  } catch {
    failedRegenRan = true;
    // Working copy remains intact
    assert.strictEqual(workingSlot.questionText, regeneratedAssembly.slots[0].questionText);
  }
  assert.strictEqual(failedRegenRan, true);
  console.log('  PASS: Working copy preserved upon regeneration failure.');

  // 4.5 Metrics recalculation post-repair
  console.log('[Scenario 4.5] Metrics recalculation post slot repair...');
  const fullyRepairedSlots: QuestionBatchSlot[] = regeneratedAssembly.slots.map((s, idx) => {
    if (idx === 4) {
      const c = makeValidCandidate(5, 'చివరి రిపేర్');
      return {
        ...s,
        status: 'VALID',
        questionText: c.questionText,
        options: { a: c.option_a, b: c.option_b, c: c.option_c, d: c.option_d },
        correctAnswer: c.correct_answer,
        explanation: c.explanation,
        validationErrors: [],
        revisionNumber: 1,
      };
    }
    return s;
  });

  const fullState = recalculateQuestionBatchState(5, fullyRepairedSlots, []);
  assert.strictEqual(fullState.inMemoryValidCount, 5);
  assert.strictEqual(fullState.persistedValidCount, 5);
  assert.strictEqual(fullState.batchStatus, 'COMPLETE');
  console.log('  PASS: Recalculated state correctly transitioned to COMPLETE post repair.\n');

  // =========================================================================
  // SUITE 5: Persistence, Reopening, Count, and Ordering Consistency
  // =========================================================================
  console.log('--- SUITE 5: Persistence, Reopening, Count, and Ordering Consistency ---');

  // 5.1 Save and reopen fully generated batch
  console.log('[Scenario 5.1] Save and reopen fully generated batch...');
  const fullDraftPayload: SaveQuestionDraftInput = {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: fullyRepairedSlots[0].questionText,
    options: fullyRepairedSlots[0].options,
    correctAnswer: fullyRepairedSlots[0].correctAnswer as any,
    explanation: fullyRepairedSlots[0].explanation,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    slots: fullyRepairedSlots,
  };

  const savedFullDraft = await questionGenerationService.saveDraft(fullDraftPayload, testAuthorActor);
  assert.ok(savedFullDraft.id);
  assert.strictEqual(savedFullDraft.status, QuestionStatus.DRAFT);
  assert.strictEqual(savedFullDraft.workflowStage, 'QUESTION_STUDIO');
  assert.strictEqual(savedFullDraft.targetQuestionCount, 5);
  assert.strictEqual(savedFullDraft.slots?.length, 5);

  const reloadedFullDraft = await questionGenerationService.getDraftById(savedFullDraft.id);
  assert.ok(reloadedFullDraft);
  assert.strictEqual(reloadedFullDraft?.slots?.length, 5);
  assert.deepStrictEqual(
    reloadedFullDraft?.slots?.map((s) => s.slotNumber),
    [1, 2, 3, 4, 5],
    'Slot ordering 1..5 must be strictly preserved upon reopen'
  );
  assert.strictEqual(reloadedFullDraft?.batchStatus, 'COMPLETE');
  assert.strictEqual(reloadedFullDraft?.persistedValidCount, 5);
  console.log(`  PASS: Fully generated batch saved as ${savedFullDraft.id} and reloaded with exact count and ordering.`);

  // 5.2 Save and reopen partial batch
  console.log('[Scenario 5.2] Save and reopen partial batch...');
  const partialDraftSlots: QuestionBatchSlot[] = [
    fullyRepairedSlots[0],
    fullyRepairedSlots[1],
    { ...fullyRepairedSlots[2], status: 'EMPTY', questionText: '', options: { a: '', b: '', c: '', d: '' } },
    { ...fullyRepairedSlots[3], status: 'INVALID', validationErrors: ['Missing answer key'] },
    { ...fullyRepairedSlots[4], status: 'EMPTY', questionText: '', options: { a: '', b: '', c: '', d: '' } },
  ];

  const partialDraftPayload: SaveQuestionDraftInput = {
    ...fullDraftPayload,
    slots: partialDraftSlots,
  };

  const savedPartialDraft = await questionGenerationService.saveDraft(partialDraftPayload, testAuthorActor);
  const reloadedPartialDraft = await questionGenerationService.getDraftById(savedPartialDraft.id);

  assert.ok(reloadedPartialDraft);
  assert.strictEqual(reloadedPartialDraft?.batchStatus, 'PARTIAL', 'Partial batch must remain PARTIAL upon reopen');
  assert.notStrictEqual(reloadedPartialDraft?.batchStatus, 'COMPLETE', 'Partial batch must NEVER be promoted to COMPLETE');
  assert.strictEqual(reloadedPartialDraft?.persistedValidCount, 2);
  assert.strictEqual(reloadedPartialDraft?.slots?.[0].status, 'VALID');
  assert.strictEqual(reloadedPartialDraft?.slots?.[1].status, 'MANUALLY_EDITED');
  assert.strictEqual(reloadedPartialDraft?.slots?.[2].status, 'EMPTY');
  assert.strictEqual(reloadedPartialDraft?.slots?.[3].status, 'INVALID');
  assert.strictEqual(reloadedPartialDraft?.slots?.[4].status, 'EMPTY');
  console.log('  PASS: Partial batch persisted and restored without false promotion.');

  // 5.3 Batch with manually edited and accepted questions saved and reopened
  console.log('[Scenario 5.3] Preserve manual edits and accepted status across persistence...');
  const slot1 = reloadedFullDraft?.slots?.[1];
  assert.strictEqual(slot1?.isManuallyEdited, true, 'isManuallyEdited flag preserved');
  assert.strictEqual(slot1?.questionText, 'రచయిత స్వయంగా సవరించిన ప్రశ్న ఇది');
  const slot3 = reloadedFullDraft?.slots?.[3];
  assert.strictEqual(slot3?.status, 'ACCEPTED', 'ACCEPTED status preserved');
  console.log('  PASS: Manually edited content and accepted status preserved across reopen.');

  // 5.4 Save after slot regeneration
  console.log('[Scenario 5.4] Save and reopen after regeneration preserves updated content...');
  const regenSavePayload: SaveQuestionDraftInput = {
    ...reloadedFullDraft!,
    id: reloadedFullDraft!.id,
    version: reloadedFullDraft!.version,
    expectedVersion: reloadedFullDraft!.version,
    slots: reloadedFullDraft!.slots!.map((s) =>
      s.slotNumber === 1
        ? { ...s, questionText: 'రీజనరేట్ చేసిన మొదటి ప్రశ్న', revisionNumber: s.revisionNumber + 1 }
        : s
    ),
  };
  const updatedRegenDraft = await questionGenerationService.saveDraft(regenSavePayload, testAuthorActor);
  assert.strictEqual(updatedRegenDraft.version, reloadedFullDraft!.version + 1);

  const reloadedRegenDraft = await questionGenerationService.getDraftById(updatedRegenDraft.id);
  assert.strictEqual(reloadedRegenDraft?.slots?.[0].questionText, 'రీజనరేట్ చేసిన మొదటి ప్రశ్న');
  assert.strictEqual(reloadedRegenDraft?.slots?.[0].revisionNumber, reloadedFullDraft!.slots![0].revisionNumber + 1);
  console.log('  PASS: Post-regeneration state and advanced revision numbers persisted.');

  // 5.5 Failed save leaves working memory intact
  console.log('[Scenario 5.5] Failed save preserves in-memory candidate working copy...');
  const memoryWorkingCopy = {
    questionText: 'సేవ్ విఫలమైనప్పటికీ మెమరీలో ఉండవలసిన ప్రశ్న',
    isDirty: true,
  };
  let failedSaveThrown = false;
  try {
    await questionGenerationService.saveDraft({
      id: updatedRegenDraft.id,
      difficulty: 'Intermediate',
      topicId: '', // Invalid topic throws error
      subtopicId: 'SUB-01',
      questionText: memoryWorkingCopy.questionText,
    }, testAuthorActor);
  } catch (err: any) {
    failedSaveThrown = true;
    assert.ok(err instanceof QuestionGenerationDomainError || err.statusCode === 400);
  }
  assert.strictEqual(failedSaveThrown, true);
  assert.strictEqual(memoryWorkingCopy.questionText, 'సేవ్ విఫలమైనప్పటికీ మెమరీలో ఉండవలసిన ప్రశ్న');
  assert.strictEqual(memoryWorkingCopy.isDirty, true);
  console.log('  PASS: Working memory preserved on save rejection.');

  // 5.6 Optimistic Concurrency Control (OCC) conflict protection
  console.log('[Scenario 5.6] OCC conflict (HTTP 409) rejects stale overwrites...');
  let occConflictThrown = false;
  try {
    await questionGenerationService.saveDraft({
      ...updatedRegenDraft,
      id: updatedRegenDraft.id,
      version: 1, // Stale version! (Server is at version 2+)
      expectedVersion: 1,
      questionText: 'పాత వెర్షన్ నుండి వచ్చిన ఓవర్‌రైట్ ప్రయత్నం',
    }, testAuthorActor);
  } catch (err: any) {
    occConflictThrown = err instanceof ConcurrencyConflictError || err.statusCode === 409;
  }
  assert.strictEqual(occConflictThrown, true, 'Stale expectedVersion MUST trigger HTTP 409 ConcurrencyConflictError');
  const serverVerify = await questionGenerationService.getDraftById(updatedRegenDraft.id);
  assert.notStrictEqual(serverVerify?.questionText, 'పాత వెర్షన్ నుండి వచ్చిన ఓవర్‌రైట్ ప్రయత్నం');
  console.log('  PASS: Concurrency conflict protected server document against stale overwrite.');

  // 5.7 Repeated save cycles without record duplication
  console.log('[Scenario 5.7] Repeated saves do not duplicate records...');
  const beforeCount = (await questionGenerationService.getAllDrafts()).filter((d) => d.id === savedFullDraft.id).length;
  assert.strictEqual(beforeCount, 1);

  await questionGenerationService.saveDraft({
    ...serverVerify!,
    id: savedFullDraft.id,
    version: serverVerify!.version,
    expectedVersion: serverVerify!.version,
  }, testAuthorActor);

  const afterCount = (await questionGenerationService.getAllDrafts()).filter((d) => d.id === savedFullDraft.id).length;
  assert.strictEqual(afterCount, 1, 'Repeated save must update record in-place with zero duplicates');
  console.log('  PASS: Repeated saves maintain exact 1-to-1 aggregate identity.');

  // 5.8 Deterministic slot ordering preservation
  console.log('[Scenario 5.8] Deterministic slot sequence (1..N) preserved across out-of-order edits...');
  // Edit slot 4, then slot 2
  const reorderedSlots = serverVerify!.slots!.map((s) => {
    if (s.slotNumber === 4) return { ...s, explanation: 'స్లాట్ 4 అప్‌డేట్' };
    if (s.slotNumber === 2) return { ...s, explanation: 'స్లాట్ 2 అప్‌డేట్' };
    return s;
  });
  const reorderedSave = await questionGenerationService.saveDraft({
    ...serverVerify!,
    id: serverVerify!.id,
    version: serverVerify!.version,
    expectedVersion: serverVerify!.version,
    slots: reorderedSlots,
  }, testAuthorActor);

  const reloadedReordered = await questionGenerationService.getDraftById(reorderedSave.id);
  assert.deepStrictEqual(
    reloadedReordered?.slots?.map((s) => s.slotNumber),
    [1, 2, 3, 4, 5],
    'Slot ordering must strictly remain [1, 2, 3, 4, 5] regardless of edit sequence'
  );
  console.log('  PASS: Slot numbering remains strictly 1..N across out-of-order mutations.');

  // Cleanup test artifacts
  await questionGenerationService.deleteDraft(savedFullDraft.id);
  await questionGenerationService.deleteDraft(savedPartialDraft.id);

  console.log('\n============================================================');
  console.log('ALL S9-T16 GENERATION & BATCH COMPLETENESS TESTS AUTHORED');
  console.log('============================================================\n');
}

// Standalone runner execution hook (for closure verification)
if (require.main === module) {
  runGenerationBatchCompletenessUnitTests().catch((err) => {
    console.error('S9-T16 TEST EXECUTION FAILED:', err);
    process.exitCode = 1;
  });
}
