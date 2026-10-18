import { ExplainedQuestionItem } from '../types/question';

export function validateExplainedQuestion(
  question: Partial<ExplainedQuestionItem>
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!question.questionText?.trim() || question.questionText.trim().length < 5) {
    errors.questionText = 'Question text must contain at least 5 characters.';
  }
  for (const key of ['a', 'b', 'c', 'd'] as const) {
    const optionField = `option${key.toUpperCase()}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
    const value = question.options ? question.options[key] : question[optionField];
    if (!value?.trim()) errors[`option${key.toUpperCase()}`] = `Option ${key.toUpperCase()} is required.`;
  }
  const options = ['a', 'b', 'c', 'd'].map((key) => {
    const optionField = `option${key.toUpperCase()}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
    return (question.options?.[key as 'a' | 'b' | 'c' | 'd'] || question[optionField] || '').trim().toLowerCase();
  });
  if (options.every(Boolean) && new Set(options).size !== 4) {
    errors.options = 'Options must be distinct.';
  }
  if (!question.correctAnswer || !['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    errors.correctAnswer = 'Select a correct answer.';
  }
  if (!question.explanation?.trim()) errors.explanation = 'Explanation is required.';
  return errors;
}

export function validateStudioCandidate(candidate: {
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  explanation?: string;
}): Record<string, string> {
  return validateExplainedQuestion({
    questionText: candidate.questionText || '',
    optionA: candidate.optionA || '',
    optionB: candidate.optionB || '',
    optionC: candidate.optionC || '',
    optionD: candidate.optionD || '',
    correctAnswer: candidate.correctAnswer as ExplainedQuestionItem['correctAnswer'],
    explanation: candidate.explanation || '',
  });
}

export function reorderExplainedQuestions(
  questions: ExplainedQuestionItem[],
  fromIndex: number,
  toIndex: number
): ExplainedQuestionItem[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= questions.length || toIndex >= questions.length) {
    return questions;
  }
  const reordered = [...questions];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered.map((question, index) => ({ ...question, questionNumber: index + 1 }));
}

export function updateExplainedQuestionList(
  questions: ExplainedQuestionItem[],
  questionNumber: number,
  updatedFields: Partial<ExplainedQuestionItem>
): ExplainedQuestionItem[] {
  const existingIndex = questions.findIndex((question) => question.questionNumber === questionNumber);
  if (existingIndex < 0) return questions;
  return questions.map((question, index) =>
    index === existingIndex
      ? { ...question, ...updatedFields, questionNumber }
      : question
  );
}

export function getReorderedActiveQuestionIndex(
  questions: ExplainedQuestionItem[],
  activeQuestionNumber: number,
  fromIndex: number,
  toIndex: number
): number {
  const activeSlotId = questions[activeQuestionNumber - 1]?.slotId;
  const reordered = reorderExplainedQuestions(questions, fromIndex, toIndex);
  if (!activeSlotId) return activeQuestionNumber;
  const activeIndex = reordered.findIndex((question) => question.slotId === activeSlotId);
  return activeIndex >= 0 ? activeIndex + 1 : activeQuestionNumber;
}
