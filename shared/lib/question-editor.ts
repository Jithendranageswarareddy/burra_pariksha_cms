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
  const options = ['a', 'b', 'c', 'd'].map((key) => (question.options?.[key as 'a' | 'b' | 'c' | 'd'] || '').trim().toLowerCase());
  if (options.every(Boolean) && new Set(options).size !== 4) {
    errors.options = 'Options must be distinct.';
  }
  if (!question.correctAnswer || !['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    errors.correctAnswer = 'Select a correct answer.';
  }
  if (!question.explanation?.trim()) errors.explanation = 'Explanation is required.';
  return errors;
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
