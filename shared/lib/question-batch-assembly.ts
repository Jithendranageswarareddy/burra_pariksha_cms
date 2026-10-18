import { canonicalIdService } from './id.service';
import {
  QuestionBatchAssembly,
  QuestionBatchRejectedItem,
  QuestionBatchSlot,
} from '../contracts/question-generation/question-generation.contract';

function readCandidate(candidate: any) {
  return {
    questionText: String(candidate?.questionText || candidate?.content || candidate?.question || '').trim(),
    options: {
      a: String(candidate?.options?.a || candidate?.option_a || candidate?.optionA || '').trim(),
      b: String(candidate?.options?.b || candidate?.option_b || candidate?.optionB || '').trim(),
      c: String(candidate?.options?.c || candidate?.option_c || candidate?.optionC || '').trim(),
      d: String(candidate?.options?.d || candidate?.option_d || candidate?.optionD || '').trim(),
    },
    correctAnswer: ['A', 'B', 'C', 'D'].includes(candidate?.correctAnswer || candidate?.correct_answer)
      ? (candidate.correctAnswer || candidate.correct_answer)
      : '',
    explanation: String(candidate?.explanation || '').trim(),
  };
}

function validateCandidate(candidate: any): string[] {
  const value = readCandidate(candidate);
  const errors: string[] = [];
  const options = Object.values(value.options);
  if (value.questionText.length < 5) errors.push('Question text must contain at least 5 characters.');
  if (options.some((option) => option.length === 0)) errors.push('Exactly four non-empty options are required.');
  if (new Set(options.map((option) => option.toLowerCase())).size !== 4) errors.push('Options must be distinct.');
  if (!value.correctAnswer) errors.push('Correct answer must be A, B, C, or D.');
  if (value.explanation.length < 5) errors.push('Explanation must contain at least 5 characters.');
  if (/(TODO|N\/A|\{\{|\}\})/i.test(`${value.questionText} ${options.join(' ')} ${value.explanation}`)) {
    errors.push('Placeholder content is not allowed.');
  }
  return errors;
}

export function assembleQuestionBatch(
  requestedCount: 5 | 10 | 15 | 20,
  candidates: any[],
  existingSlots: QuestionBatchSlot[] = []
): QuestionBatchAssembly {
  const slots: QuestionBatchSlot[] = Array.from({ length: requestedCount }, (_, index) => {
    const previous = existingSlots.find((slot) => slot.slotNumber === index + 1);
    return previous || {
      slotNumber: index + 1,
      slotId: canonicalIdService.generateCanonicalId('slt_'),
      status: 'EMPTY' as const,
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: '' as const,
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    };
  });
  const rejectedItems: QuestionBatchRejectedItem[] = [];
  const seen = new Set(
    slots
      .filter((slot) => slot.status !== 'EMPTY')
      .map((slot) => `${slot.questionText.toLowerCase()}|${Object.values(slot.options).join('|').toLowerCase()}`)
  );
  let overflowCount = 0;

  candidates.forEach((candidate, candidateIndex) => {
    const value = readCandidate(candidate);
    const errors = validateCandidate(candidate);
    const signature = `${value.questionText.toLowerCase()}|${Object.values(value.options).join('|').toLowerCase()}`;
    const target = slots.find((slot) =>
      !slot.isManuallyEdited && slot.status !== 'ACCEPTED' && slot.status === 'EMPTY'
    );
    if (!target || seen.has(signature)) {
      if (!target && errors.length === 0 && !seen.has(signature)) overflowCount += 1;
      else rejectedItems.push({ candidateIndex, reason: 'Duplicate candidate.' });
      return;
    }
    if (errors.length > 0) {
      rejectedItems.push({ candidateIndex, reason: errors.join(' ') });
      return;
    }
    seen.add(signature);
    target.status = 'VALID';
    target.questionText = value.questionText;
    target.options = value.options;
    target.correctAnswer = value.correctAnswer as 'A' | 'B' | 'C' | 'D';
    target.explanation = value.explanation;
    target.validationErrors = [];
    target.revisionNumber += 1;
  });

  const persistedValidCount = slots.filter((slot) =>
    slot.status === 'VALID' || slot.status === 'MANUALLY_EDITED' || slot.status === 'ACCEPTED'
  ).length;
  const batchStatus = persistedValidCount === requestedCount
    ? 'COMPLETE'
    : persistedValidCount > 0
      ? 'PARTIAL'
      : candidates.length > 0
        ? 'FAILED'
        : 'EMPTY';
  return {
    requestedCount,
    persistedValidCount,
    rejectedCount: rejectedItems.length,
    overflowCount,
    batchStatus,
    slots,
    rejectedItems,
  };
}
