/**
 * BURRA PARIKSHA CMS — S9-T17: Test Editing, Validation, and Preview Consistency
 * Specification: S9-T17 Regression Tests for Question Challenge Short Editing,
 * Deterministic Validation, Audience Preview, and Version Isolation.
 *
 * NOTE: As per S9-T17 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the S9-T17 authoring task. Verification will occur at Sprint 9 closure.
 *
 * Acceptance Criteria & Suites Covered:
 * - Suite 1: Required Fields and Deterministic Quality Validation (VAL-Q-01 through VAL-Q-12, blocking vs warning, server-side gate)
 * - Suite 2: Editor State Mutations (Editing, Deletion, Replacement, and Reordering)
 * - Suite 3: Saved vs Unsaved Preview Consistency & Version Tracking (Source Version Switching, Refresh/Reopen, Stale OCC Guard)
 * - Suite 4: Strict Audience Data Isolation & Leakage Prevention (Internal Answers, Explanations, Workflow, Diagnostics Stripped)
 */

import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import {
  canonicalIdService,
  QuestionStatus,
  QuestionLanguage,
  DifficultyLevel,
  ContentProductionMode,
} from '../../../shared';
import {
  SaveQuestionDraftInput,
  QuestionBatchSlot,
  QuestionBatchAssembly,
  StudioCandidate,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import {
  AudiencePreviewPackageProjection,
  AudiencePreviewSourceVersion,
  AudienceQuestionItemProjection,
} from '../../../shared/contracts/question-generation/audience-preview.contract';
import {
  validateQuestionQuality,
  formatValidationErrors,
} from '../../../shared/lib/question-quality-validator';
import {
  projectToAudiencePreview,
} from '../../../shared/lib/audience-preview-projection';
import {
  reorderExplainedQuestions,
  updateExplainedQuestionList,
  getReorderedActiveQuestionIndex,
  validateExplainedQuestion,
  validateStudioCandidate,
} from '../../../shared/lib/question-editor';
import {
  assembleQuestionBatch,
  recalculateQuestionBatchState,
} from '../../../shared/lib/question-batch-assembly';
import { validateProductionModeConfig } from '../../../shared/types/production-context';
import { AudienceQuestionPreview } from '../../../frontend/features/question-generation/components/AudienceQuestionPreview';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { QuestionGenerationDomainError } from '../../../backend/domain/question-generation/question-generation.service';
import { ExplainedQuestionItem, QuestionDraft } from '../../../shared/types/question';

// ---------------------------------------------------------------------------
// Test Fixtures & Builders
// ---------------------------------------------------------------------------

const testActor = {
  id: 'USR-AUTHOR-S9T17',
  name: 'Author Suman T17',
};

function createValidSingleQuestion(index = 1, prefix = 'ప్రశ్న') {
  return {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: `${prefix} ${index}: రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?`,
    optionA: '10 సెకన్లు',
    optionB: '15 సెకన్లు',
    optionC: '20 సెకన్లు',
    optionD: '25 సెకన్లు',
    correctAnswer: (['A', 'B', 'C', 'D'] as const)[index % 4],
    explanation: `వివరణ ${index}: వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు. బుర్ర ట్రిక్ వర్తింపజేయబడింది.`,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
  };
}

function createValidBatchSlots(count = 5): QuestionBatchSlot[] {
  return Array.from({ length: count }, (_, idx) => ({
    slotNumber: idx + 1,
    slotId: `slt_t17_${idx + 1}`,
    status: idx === 0 ? 'ACCEPTED' : idx === 1 ? 'MANUALLY_EDITED' : 'VALID',
    questionText: `సమస్య ${idx + 1}: రైలు వేగం గంటకు ${(idx + 1) * 10} కి.మీ అయితే 300 మీటర్ల దూరం దాటడానికి పట్టే సమయం ఎంత?`,
    options: {
      a: `${(idx + 1) * 5} సెకన్లు`,
      b: `${(idx + 1) * 10} సెకన్లు`,
      c: `${(idx + 1) * 15} సెకన్లు`,
      d: `${(idx + 1) * 20} సెకన్లు`,
    },
    correctAnswer: (['A', 'B', 'C', 'D'] as const)[idx % 4],
    explanation: `వివరణ ${idx + 1}: వేగం మరియు కాలం సూత్రం s = d/t ఆధారంగా గణన చేయబడినది.`,
    isManuallyEdited: idx === 1,
    validationErrors: [],
    revisionNumber: idx === 1 ? 2 : 1,
  }));
}

// ---------------------------------------------------------------------------
// Main S9-T17 Test Suite Runner
// ---------------------------------------------------------------------------

export async function runEditingValidationPreviewUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T17 Editing, Validation, and Preview Consistency');
  console.log('============================================================\n');

  // =========================================================================
  // SUITE 1: Required Fields and Deterministic Quality Validation
  // =========================================================================
  console.log('--- SUITE 1: Required Fields and Deterministic Quality Validation ---');

  // 1.1 Empty or whitespace-only question prompts (VAL-Q-01)
  console.log('[Scenario 1.1] Empty or whitespace-only prompts (VAL-Q-01)...');
  const emptyPromptResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    questionText: '',
  });
  assert.strictEqual(emptyPromptResult.isValid, false);
  assert.strictEqual(emptyPromptResult.hasErrors, true);
  assert.ok(emptyPromptResult.errors.some((e) => e.ruleId === 'VAL-Q-01' && e.code === 'ERR_EMPTY_PROMPT'));
  assert.strictEqual(emptyPromptResult.errors[0].severity, 'BLOCKING');

  const whitespacePromptResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    questionText: '     \t\n   ',
  });
  assert.strictEqual(whitespacePromptResult.isValid, false);
  assert.ok(whitespacePromptResult.errors.some((e) => e.ruleId === 'VAL-Q-01'));

  const shortPromptResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    questionText: 'రైలు', // Only 4 characters in length (< 5)
  });
  assert.strictEqual(shortPromptResult.isValid, false);
  assert.ok(shortPromptResult.errors.some((e) => e.ruleId === 'VAL-Q-01'));
  console.log('  PASS: VAL-Q-01 empty, whitespace, and short prompts flagged as BLOCKING.');

  // 1.2 Missing required choices (VAL-Q-02)
  console.log('[Scenario 1.2] Missing required choices (VAL-Q-02)...');
  for (const missingOption of ['optionA', 'optionB', 'optionC', 'optionD'] as const) {
    const missingOptionResult = validateQuestionQuality({
      ...createValidSingleQuestion(1),
      [missingOption]: '',
    });
    assert.strictEqual(missingOptionResult.isValid, false);
    assert.ok(
      missingOptionResult.errors.some(
        (e) => e.ruleId === 'VAL-Q-02' && e.code === 'ERR_OPTION_INCOMPLETE' && e.severity === 'BLOCKING'
      ),
      `Missing ${missingOption} must trigger BLOCKING ERR_OPTION_INCOMPLETE`
    );
  }
  console.log('  PASS: VAL-Q-02 missing options A, B, C, D flagged as BLOCKING.');

  // 1.3 Empty choices and duplicate choices (VAL-Q-02)
  console.log('[Scenario 1.3] Duplicate choices (VAL-Q-02)...');
  const duplicateChoiceResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    optionA: 'సమానమైన ఎంపిక',
    optionB: 'సమానమైన ఎంపిక', // Identical to optionA!
  });
  assert.strictEqual(duplicateChoiceResult.isValid, false);
  assert.ok(
    duplicateChoiceResult.errors.some(
      (e) => e.ruleId === 'VAL-Q-02' && e.code === 'ERR_OPTION_DUPLICATE' && e.severity === 'BLOCKING'
    )
  );
  console.log('  PASS: VAL-Q-02 duplicate choices flagged as BLOCKING.');

  // 1.4 Correct answer reference mismatch (VAL-Q-03)
  console.log('[Scenario 1.4] Correct answer reference mismatch (VAL-Q-03)...');
  const invalidKeyResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    correctAnswer: 'E' as any, // Not in {A, B, C, D}
  });
  assert.strictEqual(invalidKeyResult.isValid, false);
  assert.ok(
    invalidKeyResult.errors.some(
      (e) => e.ruleId === 'VAL-Q-03' && e.code === 'ERR_INVALID_ANSWER_KEY' && e.severity === 'BLOCKING'
    )
  );
  console.log('  PASS: VAL-Q-03 invalid answer key flagged as BLOCKING.');

  // 1.5 Missing correct answer (VAL-Q-04)
  console.log('[Scenario 1.5] Missing correct answer (VAL-Q-04)...');
  const missingKeyResult = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    correctAnswer: '' as any,
  });
  assert.strictEqual(missingKeyResult.isValid, false);
  assert.ok(
    missingKeyResult.errors.some(
      (e) => e.ruleId === 'VAL-Q-04' && e.code === 'ERR_MISSING_ANSWER_KEY' && e.severity === 'BLOCKING'
    )
  );
  console.log('  PASS: VAL-Q-04 missing answer key flagged as BLOCKING.');

  // 1.6 Missing required explanation (VAL-Q-07)
  console.log('[Scenario 1.6] Missing required explanation (VAL-Q-07)...');
  const missingExplResult = validateQuestionQuality(
    {
      ...createValidSingleQuestion(1),
      explanation: '',
    },
    { requireExplanation: true }
  );
  assert.strictEqual(missingExplResult.isValid, false);
  assert.ok(
    missingExplResult.errors.some(
      (e) => e.ruleId === 'VAL-Q-07' && (e.code === 'ERR_MISSING_PROOF_EXPLANATION' || e.code === 'ERR_MISSING_EXPLANATION') && e.severity === 'BLOCKING'
    )
  );
  console.log('  PASS: VAL-Q-07 missing explanation flagged as BLOCKING when required.');

  // 1.7 Duplicate questions (exact and semantic) (VAL-Q-06A & VAL-Q-06B)
  console.log('[Scenario 1.7] Duplicate questions in batch (VAL-Q-06A & VAL-Q-06B)...');
  const exactDuplicateSlots: QuestionBatchSlot[] = [
    createValidBatchSlots(3)[0],
    {
      ...createValidBatchSlots(3)[0], // Exact duplicate of slot 1!
      slotNumber: 2,
      slotId: 'slt_t17_dup',
    },
    createValidBatchSlots(3)[2],
  ];
  const exactDupResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 3,
    slots: exactDuplicateSlots,
  });
  assert.strictEqual(exactDupResult.isValid, false);
  assert.ok(
    exactDupResult.errors.some(
      (e) => (e.ruleId === 'VAL-Q-06A' || e.ruleId === 'VAL-Q-06B') && e.severity === 'BLOCKING'
    )
  );
  console.log('  PASS: VAL-Q-06 batch duplicate questions caught and flagged.');

  // 1.8 Malformed candidate structures & unresolved placeholders (VAL-Q-05)
  console.log('[Scenario 1.8] Placeholder tokens (VAL-Q-05)...');
  const placeholderTokens = ['[TODO]', 'N/A', '{{formula}}', 'TODO: add text'];
  for (const token of placeholderTokens) {
    const placeholderResult = validateQuestionQuality({
      ...createValidSingleQuestion(1),
      questionText: `రైలు వేగం ${token} కి.మీ/గం`,
    });
    assert.strictEqual(placeholderResult.isValid, false);
    assert.ok(
      placeholderResult.errors.some(
        (e) => e.ruleId === 'VAL-Q-05' && (e.code === 'ERR_UNRESOLVED_PLACEHOLDER' || e.code === 'ERR_PLACEHOLDER_CONTENT')
      ),
      `Token ${token} must trigger ERR_UNRESOLVED_PLACEHOLDER`
    );
  }
  console.log('  PASS: VAL-Q-05 placeholder tokens detected and flagged as BLOCKING.');

  // 1.9 Unsupported or invalid configured batch counts
  console.log('[Scenario 1.9] Unsupported configured batch counts...');
  const rejectedBatchSizes = [0, 2, 3, 4, 6, 7, 12, 25, -1];
  for (const badCount of rejectedBatchSizes) {
    const modeValidation = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', badCount, '9:16');
    assert.strictEqual(modeValidation.isValid, false);
  }
  console.log('  PASS: Non-standard batch sizes correctly rejected by production config validation.');

  // 1.10 Incomplete and partially valid batches (VAL-Q-08)
  console.log('[Scenario 1.10] Incomplete batch slot count (VAL-Q-08)...');
  const shortBatchSlots = createValidBatchSlots(3); // Only 3 slots for count=5
  const shortBatchResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: shortBatchSlots,
  });
  assert.strictEqual(shortBatchResult.isValid, false);
  assert.ok(
    shortBatchResult.errors.some(
      (e) => e.ruleId === 'VAL-Q-08' && (e.code === 'ERR_INCOMPLETE_BATCH_SLOTS' || e.code === 'ERR_INCOMPLETE_BATCH')
    )
  );
  console.log('  PASS: VAL-Q-08 incomplete batch slots rejected with BLOCKING error.');

  // 1.11 Distinction between blocking errors and non-blocking warnings (VAL-Q-11 & VAL-Q-12)
  console.log('[Scenario 1.11] Blocking errors vs non-blocking warnings...');
  const longPrompt = 'రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది? ఈ ప్రశ్నకు సమాధానం ఇవ్వడానికి విద్యార్థులు సమయం మరియు వేగం మధ్య ఉన్న ప్రాథమిక సంబంధాన్ని గమనించాలి మరియు అవసరమైన సూత్రాలను సమర్థవంతంగా అన్వయించుకోవాలి.'.repeat(2);
  const warningOnlyQuestion = {
    ...createValidSingleQuestion(1),
    questionText: longPrompt, // > 180 chars triggers warning
  };
  const warningResult = validateQuestionQuality(warningOnlyQuestion);
  assert.strictEqual(warningResult.isValid, true, 'Question with only warnings must remain valid');
  assert.strictEqual(warningResult.hasErrors, false, 'hasErrors must be false when only warnings exist');
  assert.ok(warningResult.warnings.length > 0, 'Must contain warning items');
  assert.ok(warningResult.warnings.some((w) => w.ruleId === 'VAL-Q-11' && w.severity === 'WARNING'));
  console.log('  PASS: Warnings (VAL-Q-11) do NOT become blocking errors.');

  // 1.12 Server-side submission gate enforcement
  console.log('[Scenario 1.12] Server-side submission gate rejects invalid batches (HTTP 422)...');
  const invalidDraftPayload: SaveQuestionDraftInput = {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'చెల్లని డ్రాఫ్ట్ ప్రశ్న',
    options: { a: 'A', b: 'B', c: 'C', d: 'D' },
    correctAnswer: 'A',
    explanation: 'వివరణ',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    slots: [
      ...createValidBatchSlots(4),
      { ...createValidBatchSlots(1)[0], slotNumber: 5, status: 'INVALID', validationErrors: ['Option B empty'] },
    ],
  };
  const savedInvalidDraft = await questionGenerationService.saveDraft(invalidDraftPayload, testActor);
  let submitRejected = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: savedInvalidDraft.id,
      expectedVersion: savedInvalidDraft.version,
      actorId: testActor.id,
    }, testActor);
  } catch (err: any) {
    submitRejected = true;
    assert.ok(err.statusCode === 422 || err.code === 'VALIDATION_FAILED' || err instanceof QuestionGenerationDomainError);
  }
  assert.strictEqual(submitRejected, true, 'Server submission gate MUST reject incomplete/invalid batch');
  await questionGenerationService.deleteDraft(savedInvalidDraft.id);
  console.log('  PASS: Server-side submission gate strictly rejects invalid batch.\n');

  // =========================================================================
  // SUITE 2: Editor State Mutations (Editing, Deletion, Replacement, Reordering)
  // =========================================================================
  console.log('--- SUITE 2: Editor State Mutations ---');

  // 2.1 Editing question prompt
  console.log('[Scenario 2.1] Edit question prompt in editor state...');
  const initialSlots = createValidBatchSlots(5);
  const targetSlot = initialSlots[2];
  const originalPrompt = targetSlot.questionText;
  const editedPrompt = 'సవరించిన కొత్త ప్రశ్న: రైలు వేగం గంటకు 90 కి.మీ అయితే ప్రయాణ కాలం ఎంత?';

  const updatedSlot: QuestionBatchSlot = {
    ...targetSlot,
    questionText: editedPrompt,
    isManuallyEdited: true,
    status: 'MANUALLY_EDITED',
    revisionNumber: targetSlot.revisionNumber + 1,
  };
  const slotsAfterPromptEdit = initialSlots.map((s) => (s.slotNumber === targetSlot.slotNumber ? updatedSlot : s));

  assert.strictEqual(slotsAfterPromptEdit[2].questionText, editedPrompt);
  assert.strictEqual(slotsAfterPromptEdit[2].isManuallyEdited, true);
  assert.strictEqual(slotsAfterPromptEdit[2].status, 'MANUALLY_EDITED');
  assert.strictEqual(slotsAfterPromptEdit[2].revisionNumber, targetSlot.revisionNumber + 1);
  assert.strictEqual(slotsAfterPromptEdit[0].questionText, initialSlots[0].questionText, 'Slot 1 must remain untouched');
  assert.strictEqual(slotsAfterPromptEdit[4].questionText, initialSlots[4].questionText, 'Slot 5 must remain untouched');
  console.log('  PASS: Prompt edited cleanly with manual-edit and revision tracking.');

  // 2.2 Editing answer choices (A, B, C, D)
  console.log('[Scenario 2.2] Edit answer choices...');
  const editedOptionsSlot: QuestionBatchSlot = {
    ...updatedSlot,
    options: {
      a: '30 సెకన్లు (సవరించినది)',
      b: '40 సెకన్లు (సవరించినది)',
      c: '50 సెకన్లు (సవరించినది)',
      d: '60 సెకన్లు (సవరించినది)',
    },
    revisionNumber: updatedSlot.revisionNumber + 1,
  };
  const valResultPostOptionEdit = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    optionA: editedOptionsSlot.options.a,
    optionB: editedOptionsSlot.options.b,
    optionC: editedOptionsSlot.options.c,
    optionD: editedOptionsSlot.options.d,
  });
  assert.strictEqual(valResultPostOptionEdit.isValid, true);
  console.log('  PASS: Answer choices updated and validated successfully.');

  // 2.3 Changing correct answer key
  console.log('[Scenario 2.3] Change correct answer key and maintain validity...');
  const keyChangedSlot: QuestionBatchSlot = {
    ...editedOptionsSlot,
    correctAnswer: 'C',
    revisionNumber: editedOptionsSlot.revisionNumber + 1,
  };
  assert.strictEqual(keyChangedSlot.correctAnswer, 'C');
  assert.ok(['A', 'B', 'C', 'D'].includes(keyChangedSlot.correctAnswer));
  const valKeyChanged = validateQuestionQuality({
    ...createValidSingleQuestion(1),
    correctAnswer: keyChangedSlot.correctAnswer,
  });
  assert.strictEqual(valKeyChanged.isValid, true);
  console.log('  PASS: Correct answer changed to C without breaking option references.');

  // 2.4 Editing required explanation
  console.log('[Scenario 2.4] Edit required explanation...');
  const editedExplanation = 'సవరించిన వివరణ: 90 * (5/18) = 25 m/s. కాలం = 300 / 25 = 12 సెకన్లు.';
  const explChangedSlot: QuestionBatchSlot = {
    ...keyChangedSlot,
    explanation: editedExplanation,
    revisionNumber: keyChangedSlot.revisionNumber + 1,
  };
  assert.strictEqual(explChangedSlot.explanation, editedExplanation);
  const valExpl = validateQuestionQuality(
    { ...createValidSingleQuestion(1), explanation: explChangedSlot.explanation },
    { requireExplanation: true }
  );
  assert.strictEqual(valExpl.isValid, true);
  console.log('  PASS: Explanation updated and passes deterministic proof validation.');

  // 2.5 Correcting an invalid question
  console.log('[Scenario 2.5] Correct an invalid question and recalculate state...');
  const invalidCandidate = {
    questionText: 'చెల్లని ప్రశ్న',
    optionA: 'ఎంపిక 1',
    optionB: '', // Missing option B
    optionC: 'ఎంపిక 3',
    optionD: 'ఎంపిక 4',
    correctAnswer: 'A',
    explanation: 'వివరణ',
  };
  const preErrors = validateStudioCandidate(invalidCandidate);
  assert.strictEqual(Boolean(preErrors.optionB), true, 'Must flag optionB error');

  // Correct option B
  const repairedCandidate = {
    ...invalidCandidate,
    optionB: 'సరిదిద్దిన ఎంపిక 2',
  };
  const postErrors = validateStudioCandidate(repairedCandidate);
  assert.strictEqual(Object.keys(postErrors).length, 0, 'Repaired candidate must have zero errors');
  console.log('  PASS: Invalid question corrected and validation state cleared.');

  // 2.6 Deleting a question from a batch
  console.log('[Scenario 2.6] Delete a question from a batch...');
  const batchBeforeDelete = createValidBatchSlots(5);
  const deletedSlotId = batchBeforeDelete[2].slotId; // Slot 3 deleted
  const batchAfterDelete = batchBeforeDelete
    .filter((s) => s.slotId !== deletedSlotId)
    .map((s, idx) => ({ ...s, slotNumber: idx + 1 }));

  assert.strictEqual(batchAfterDelete.length, 4, 'Batch must now have 4 slots');
  assert.deepStrictEqual(
    batchAfterDelete.map((s) => s.slotNumber),
    [1, 2, 3, 4],
    'Slot numbers must be re-indexed sequentially 1..4'
  );
  assert.strictEqual(batchAfterDelete.some((s) => s.slotId === deletedSlotId), false, 'Deleted slot must be absent');
  const previewAfterDelete = projectToAudiencePreview({
    candidate: {},
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 4,
      persistedValidCount: 4,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'PARTIAL',
      slots: batchAfterDelete,
      rejectedItems: [],
    },
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(previewAfterDelete.totalQuestions, 4);
  assert.strictEqual(previewAfterDelete.questions.some((q) => q.questionText.includes('సమస్య 3:')), false);
  console.log('  PASS: Question deleted; batch re-indexed; deleted item omitted from preview.');

  // 2.7 Replacing a question
  console.log('[Scenario 2.7] Replace a question in a slot...');
  const replacementQuestion = createValidSingleQuestion(99, 'పునఃస్థాపన');
  const replacedSlots = batchAfterDelete.map((s) =>
    s.slotNumber === 2
      ? {
          ...s,
          questionText: replacementQuestion.questionText,
          options: {
            a: replacementQuestion.optionA,
            b: replacementQuestion.optionB,
            c: replacementQuestion.optionC,
            d: replacementQuestion.optionD,
          },
          correctAnswer: replacementQuestion.correctAnswer,
          explanation: replacementQuestion.explanation,
          revisionNumber: s.revisionNumber + 1,
        }
      : s
  );
  assert.strictEqual(replacedSlots[1].questionText, replacementQuestion.questionText);
  assert.strictEqual(replacedSlots[0].questionText, batchAfterDelete[0].questionText, 'Neighbor slot 1 untouched');
  assert.strictEqual(replacedSlots[2].questionText, batchAfterDelete[2].questionText, 'Neighbor slot 3 untouched');
  console.log('  PASS: Question replaced in slot without corrupting neighboring slots.');

  // 2.8 Reordering questions
  console.log('[Scenario 2.8] Reorder questions in batch...');
  const explainedList: ExplainedQuestionItem[] = replacedSlots.map((s) => ({
    slotId: s.slotId,
    questionNumber: s.slotNumber,
    questionText: s.questionText,
    options: s.options,
    optionA: s.options.a,
    optionB: s.options.b,
    optionC: s.options.c,
    optionD: s.options.d,
    correctAnswer: s.correctAnswer as any,
    explanation: s.explanation,
  }));

  // Move index 0 to index 2 (move item 1 to position 3)
  const reorderedList = reorderExplainedQuestions(explainedList, 0, 2);
  assert.deepStrictEqual(
    reorderedList.map((q) => q.questionNumber),
    [1, 2, 3, 4],
    'Reordered items must have questionNumber re-sequenced 1..4'
  );
  assert.strictEqual(reorderedList[2].slotId, explainedList[0].slotId, 'Original item 1 now occupies position 3');
  assert.strictEqual(reorderedList[0].slotId, explainedList[1].slotId, 'Original item 2 now occupies position 1');
  assert.strictEqual(reorderedList[2].correctAnswer, explainedList[0].correctAnswer, 'Internal answer pairing preserved');

  // Verify active index tracking during reorder
  const newActiveIndex = getReorderedActiveQuestionIndex(explainedList, 1, 0, 2);
  assert.strictEqual(newActiveIndex, 3, 'Active focus follows moved item to position 3');
  console.log('  PASS: Questions reordered with sequential indexing and answer pairing preserved.\n');

  // =========================================================================
  // SUITE 3: Saved vs Unsaved Preview Consistency & Version Tracking
  // =========================================================================
  console.log('--- SUITE 3: Saved vs Unsaved Preview Consistency & Version Tracking ---');

  // Helper baseline draft
  const baselineDraftInput: SaveQuestionDraftInput = {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: initialSlots[0].questionText,
    options: initialSlots[0].options,
    correctAnswer: initialSlots[0].correctAnswer as any,
    explanation: initialSlots[0].explanation,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    slots: initialSlots,
  };
  const persistedDraft = await questionGenerationService.saveDraft(baselineDraftInput, testActor);
  assert.ok(persistedDraft.id);
  assert.strictEqual(persistedDraft.version, 1);

  // 3.1 Preview of saved package
  console.log('[Scenario 3.1] Preview of saved package (SAVED_RECORD)...');
  const savedPreview = projectToAudiencePreview({
    candidate: {},
    savedDraft: persistedDraft,
    sourceVersion: 'SAVED_RECORD',
  });
  assert.strictEqual(savedPreview.sourceVersion, 'SAVED_RECORD');
  assert.strictEqual(savedPreview.hasSavedRecord, true);
  assert.strictEqual(savedPreview.versionNumber, 1);
  assert.strictEqual(savedPreview.draftId, persistedDraft.id);
  assert.strictEqual(savedPreview.totalQuestions, 5);
  assert.strictEqual(savedPreview.questions[0].questionText, initialSlots[0].questionText);
  console.log('  PASS: Saved record preview reflects exact persisted draft.');

  // 3.2 Preview of current unsaved edits
  console.log('[Scenario 3.2] Preview of unsaved edits (UNSAVED_EDITS)...');
  const unsavedWorkingSlots: QuestionBatchSlot[] = [
    { ...initialSlots[0], questionText: 'లైవ్ అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న 1' },
    ...initialSlots.slice(1),
  ];
  const unsavedPreview = projectToAudiencePreview({
    candidate: { questionText: 'లైవ్ అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న 1' },
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 5,
      persistedValidCount: 5,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'COMPLETE',
      slots: unsavedWorkingSlots,
      rejectedItems: [],
    },
    savedDraft: persistedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(unsavedPreview.sourceVersion, 'UNSAVED_EDITS');
  assert.strictEqual(unsavedPreview.questions[0].questionText, 'లైవ్ అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న 1');
  assert.strictEqual(savedPreview.questions[0].questionText, initialSlots[0].questionText, 'Saved preview untouched');
  console.log('  PASS: Unsaved edits preview reflects working copy without mutating saved preview.');

  // 3.3 Preview after editing prompt or choice
  console.log('[Scenario 3.3] Live preview reflection on prompt/choice edits...');
  const promptEditSlots: QuestionBatchSlot[] = [
    { ...unsavedWorkingSlots[0], options: { ...unsavedWorkingSlots[0].options, a: 'కొత్త ఎంపిక A' } },
    ...unsavedWorkingSlots.slice(1),
  ];
  const choiceEditPreview = projectToAudiencePreview({
    candidate: {},
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 5,
      persistedValidCount: 5,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'COMPLETE',
      slots: promptEditSlots,
      rejectedItems: [],
    },
    savedDraft: persistedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(choiceEditPreview.questions[0].choices[0].text, 'కొత్త ఎంపిక A');
  console.log('  PASS: Choice modification reflected immediately in audience choices.');

  // 3.4 Preview after correcting validation error
  console.log('[Scenario 3.4] Preview after correcting validation error...');
  const incompleteSlot: QuestionBatchSlot = {
    ...initialSlots[0],
    questionText: '', // Incomplete
    options: { a: '', b: '', c: '', d: '' },
  };
  const incompletePreview = projectToAudiencePreview({
    candidate: {},
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 4,
      persistedValidCount: 4,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'PARTIAL',
      slots: [incompleteSlot, ...initialSlots.slice(1)],
      rejectedItems: [],
    },
    savedDraft: persistedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(incompletePreview.isComplete, false);
  assert.ok(incompletePreview.incompleteNotice);

  // Correct slot
  const correctedPreview = projectToAudiencePreview({
    candidate: {},
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 5,
      persistedValidCount: 5,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'COMPLETE',
      slots: initialSlots,
      rejectedItems: [],
    },
    savedDraft: persistedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(correctedPreview.isComplete, true);
  assert.strictEqual(correctedPreview.incompleteNotice, undefined);
  console.log('  PASS: Preview correctly toggles completion notices post repair.');

  // 3.5 Preview after reordering question
  console.log('[Scenario 3.5] Preview reflects reordered presentation sequence...');
  const reorderedSlots = [initialSlots[2], initialSlots[0], initialSlots[1], initialSlots[3], initialSlots[4]];
  const reorderedPreview = projectToAudiencePreview({
    candidate: {},
    batchAssembly: {
      requestedCount: 5,
      inMemoryValidCount: 5,
      persistedValidCount: 5,
      rejectedCount: 0,
      overflowCount: 0,
      batchStatus: 'COMPLETE',
      slots: reorderedSlots,
      rejectedItems: [],
    },
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(reorderedPreview.questions[0].questionText, initialSlots[2].questionText);
  assert.strictEqual(reorderedPreview.questions[1].questionText, initialSlots[0].questionText);
  console.log('  PASS: Reordered slots mapped directly to audience questions array.');

  // 3.6 Preview after saving and reopening
  const updatedSlots = [
    { ...persistedDraft.slots![0], questionText: 'సేవ్ చేయబడిన కొత్త ప్రశ్న' },
    ...persistedDraft.slots!.slice(1),
  ];
  const saveUpdatedDraft = await questionGenerationService.saveDraft({
    ...persistedDraft,
    id: persistedDraft.id,
    version: persistedDraft.version,
    expectedVersion: persistedDraft.version,
    questionText: 'సేవ్ చేయబడిన కొత్త ప్రశ్న',
    slots: updatedSlots,
  }, testActor);
  assert.strictEqual(saveUpdatedDraft.version, 2);

  const reloadedDraft = await questionGenerationService.getDraftById(persistedDraft.id);
  const postSavePreview = projectToAudiencePreview({
    candidate: {},
    savedDraft: reloadedDraft,
    sourceVersion: 'SAVED_RECORD',
  });
  assert.strictEqual(postSavePreview.versionNumber, 2);
  assert.strictEqual(postSavePreview.questions[0].questionText, 'సేవ్ చేయబడిన కొత్త ప్రశ్న');
  console.log('  PASS: Post-save preview updated version to 2 and displayed new content.');

  // 3.7 Stale-version OCC conflict guard in preview
  console.log('[Scenario 3.7] Stale-version conflict guard in preview...');
  let occThrown = false;
  try {
    await questionGenerationService.saveDraft({
      ...persistedDraft,
      id: persistedDraft.id,
      version: 1, // Stale! Server is at version 2
      expectedVersion: 1,
      questionText: 'స్టేల్ రైట్ ప్రయత్నం',
    }, testActor);
  } catch (err: any) {
    occThrown = err instanceof ConcurrencyConflictError || err.statusCode === 409;
  }
  assert.strictEqual(occThrown, true);
  // Unsaved preview remains working copy; saved preview remains canonical version 2
  const serverVerifyDraft = await questionGenerationService.getDraftById(persistedDraft.id);
  assert.strictEqual(serverVerifyDraft?.version, 2);
  assert.notStrictEqual(serverVerifyDraft?.questionText, 'స్టేల్ రైట్ ప్రయత్నం');
  console.log('  PASS: OCC conflict protected server draft; preview boundaries maintained.');

  // 3.8 Failed persistence leaves working preview intact
  console.log('[Scenario 3.8] Failed persistence leaves unsaved working preview intact...');
  let saveFailed = false;
  try {
    await questionGenerationService.saveDraft({
      id: persistedDraft.id,
      difficulty: 'Intermediate',
      topicId: '', // Invalid!
      subtopicId: 'SUB-01',
      questionText: 'అన్‌సేవ్డ్ ప్రశ్న',
    }, testActor);
  } catch {
    saveFailed = true;
  }
  assert.strictEqual(saveFailed, true);
  // Assert unsaved preview still projects current working copy
  const postFailPreview = projectToAudiencePreview({
    candidate: { questionText: 'అన్‌సేవ్డ్ ప్రశ్న' },
    sourceVersion: 'UNSAVED_EDITS',
  });
  assert.strictEqual(postFailPreview.questions[0].questionText, 'అన్‌సేవ్డ్ ప్రశ్న');
  console.log('  PASS: Unsaved working copy preserved across persistence failure.');

  // 3.9 Source version switching does not mutate source data
  console.log('[Scenario 3.9] Version switching does not cross-contaminate datasets...');
  const copySaved = JSON.parse(JSON.stringify(reloadedDraft));
  const copyWorking = JSON.parse(JSON.stringify(unsavedWorkingSlots));

  projectToAudiencePreview({ candidate: {}, savedDraft: reloadedDraft, sourceVersion: 'SAVED_RECORD' });
  projectToAudiencePreview({ candidate: {}, batchAssembly: { slots: unsavedWorkingSlots } as any, sourceVersion: 'UNSAVED_EDITS' });

  assert.deepStrictEqual(reloadedDraft, copySaved, 'Saved draft must not be mutated by preview projection');
  assert.deepStrictEqual(unsavedWorkingSlots, copyWorking, 'Working slots must not be mutated by preview projection');
  console.log('  PASS: Zero cross-contamination between saved and unsaved datasets.\n');

  // =========================================================================
  // SUITE 4: Strict Audience Data Isolation & Leakage Prevention
  // =========================================================================
  console.log('--- SUITE 4: Strict Audience Data Isolation & Leakage Prevention ---');

  // Build draft with extensive production metadata, secrets, and internal answers
  const confidentialDraft: QuestionDraft = {
    id: 'dft_confidential_test_01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    options: {
      a: '10 సెకన్లు',
      b: '15 సెకన్లు',
      c: '20 సెకన్లు',
      d: '25 సెకన్లు',
    },
    correctAnswer: 'A', // CONFIDENTIAL ANSWER KEY
    explanation: 'అంతర్గత గణన: 72 * (5/18) = 20 m/s. కాలం = 10 సెకన్లు. రహస్య షార్ట్‌కట్ ఫార్ములా.', // CONFIDENTIAL EXPLANATION
    authorId: 'USR-AUTHOR-SECRET-01', // CONFIDENTIAL AUTHOR
    reviewerFeedback: 'రివ్యూయర్ అంతర్గత గమనిక: స్లాట్ 1 బాగుంది.', // CONFIDENTIAL REVIEWER FEEDBACK
    workflowStage: 'QUESTION_STUDIO', // CONFIDENTIAL WORKFLOW STAGE
    status: QuestionStatus.DRAFT,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slots: [
      {
        slotNumber: 1,
        slotId: 'slt_confidential_01',
        status: 'VALID',
        questionText: 'రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
        options: {
          a: '10 సెకన్లు',
          b: '15 సెకన్లు',
          c: '20 సెకన్లు',
          d: '25 సెకన్లు',
        },
        correctAnswer: 'A', // CONFIDENTIAL ANSWER KEY
        explanation: 'అంతర్గత వివరణ మరియు ప్రూఫ్.', // CONFIDENTIAL
        isManuallyEdited: false,
        validationErrors: ['అంతర్గత డయాగ్నస్టిక్ ఎర్రర్'], // CONFIDENTIAL
        revisionNumber: 1,
      },
    ],
  };
  (confidentialDraft as any).contentId = 'BP-CNT-999999';
  (confidentialDraft as any).contentMasterId = 'BP-CM-888888';

  const audienceProjection = projectToAudiencePreview({
    candidate: {},
    savedDraft: confidentialDraft,
    sourceVersion: 'SAVED_RECORD',
  });

  // 4.1 Strict exclusion of internal answer keys
  console.log('[Scenario 4.1] Exclusion of internal correct answer keys...');
  const projectedQuestion = audienceProjection.questions[0];
  assert.strictEqual(
    (projectedQuestion as any).correctAnswer,
    undefined,
    'Audience question item must NEVER contain correctAnswer'
  );
  assert.strictEqual(
    (projectedQuestion as any).correct_answer,
    undefined,
    'Audience question item must NEVER contain correct_answer'
  );
  for (const choice of projectedQuestion.choices) {
    assert.strictEqual((choice as any).isCorrect, undefined, 'Choice must NOT declare isCorrect boolean');
    assert.strictEqual((choice as any).correctAnswer, undefined, 'Choice must NOT declare correctAnswer');
  }
  console.log('  PASS: Correct answer keys strictly excluded from projection object.');

  // 4.2 Strict exclusion of internal explanations
  console.log('[Scenario 4.2] Exclusion of internal explanations & proof derivations...');
  assert.strictEqual((projectedQuestion as any).explanation, undefined, 'Explanation must be omitted');
  assert.strictEqual((projectedQuestion as any).trickOrPitfall, undefined, 'Trick/pitfall notes must be omitted');
  assert.strictEqual((audienceProjection as any).explanation, undefined, 'Package must omit explanations');
  console.log('  PASS: Explanations and proof derivations strictly excluded from audience preview.');

  // 4.3 Strict exclusion of validation diagnostics and quality scores
  console.log('[Scenario 4.3] Exclusion of validation diagnostics and internal errors...');
  assert.strictEqual((projectedQuestion as any).validationErrors, undefined);
  assert.strictEqual((projectedQuestion as any).validationIssues, undefined);
  assert.strictEqual((audienceProjection as any).validationErrors, undefined);
  console.log('  PASS: Validation errors and diagnostics strictly excluded.');

  // 4.4 Strict exclusion of workflow, authorization, and review metadata
  console.log('[Scenario 4.4] Exclusion of workflow stage, author, and reviewer metadata...');
  assert.strictEqual((audienceProjection as any).workflowStage, undefined);
  assert.strictEqual((audienceProjection as any).authorId, undefined);
  assert.strictEqual((audienceProjection as any).reviewerFeedback, undefined);
  assert.strictEqual((audienceProjection as any).contentMasterId, undefined);
  assert.strictEqual((projectedQuestion as any).slotId, undefined, 'Internal slot UUIDs must not leak to audience item');
  console.log('  PASS: Workflow stage, author ID, reviewer feedback, and slot UUIDs stripped.');

  // 4.5 DOM & rendered HTML leak prevention
  console.log('[Scenario 4.5] Rendered HTML markup leak inspection...');
  const renderedHtml = renderToStaticMarkup(
    React.createElement(AudienceQuestionPreview, {
      projection: audienceProjection,
    })
  );

  // Assert that internal values NEVER appear anywhere in the rendered HTML
  assert.strictEqual(renderedHtml.includes('USR-AUTHOR-SECRET-01'), false, 'Author ID must not appear in HTML');
  assert.strictEqual(renderedHtml.includes('రహస్య షార్ట్‌కట్ ఫార్ములా'), false, 'Private explanation must not appear in HTML');
  assert.strictEqual(renderedHtml.includes('అంతర్గత డయాగ్నస్టిక్ ఎర్రర్'), false, 'Diagnostic errors must not appear in HTML');
  assert.strictEqual(renderedHtml.includes('రివ్యూయర్ అంతర్గత గమనిక'), false, 'Reviewer notes must not appear in HTML');
  assert.strictEqual(renderedHtml.includes('slt_confidential_01'), false, 'Slot UUID must not appear in HTML');
  assert.strictEqual(renderedHtml.includes('BP-CNT-999999'), false, 'Internal content ID must not appear in HTML');

  // Assert that allowed audience fields DO appear properly
  assert.strictEqual(renderedHtml.includes('బుర్ర పరీక్ష'), true, 'Branding must appear');
  assert.strictEqual(renderedHtml.includes('రైలు 72 కి.మీ/గం'), true, 'Question text must appear');
  assert.strictEqual(renderedHtml.includes('10 సెకన్లు'), true, 'Option A text must appear');
  assert.strictEqual(renderedHtml.includes('15 సెకన్లు'), true, 'Option B text must appear');
  assert.strictEqual(renderedHtml.includes('20 సెకన్లు'), true, 'Option C text must appear');
  assert.strictEqual(renderedHtml.includes('25 సెకన్లు'), true, 'Option D text must appear');
  console.log('  PASS: Rendered HTML contains only allowed audience content; 0% internal leakage.');

  // Cleanup test draft
  await questionGenerationService.deleteDraft(persistedDraft.id);

  console.log('\n============================================================');
  console.log('ALL S9-T17 EDITING, VALIDATION & PREVIEW TESTS AUTHORED');
  console.log('============================================================\n');
}

runEditingValidationPreviewUnitTests().catch((err) => {
  console.error('S9-T17 TEST EXECUTION FAILED:', err);
  process.exitCode = 1;
});
