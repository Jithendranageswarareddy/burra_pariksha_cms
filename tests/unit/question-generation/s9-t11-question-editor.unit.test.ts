import assert from 'node:assert/strict';
import {
  reorderExplainedQuestions,
  validateExplainedQuestion,
} from '../../../shared/lib/question-editor';
import { ExplainedQuestionItem } from '../../../shared/types/question';

const question = (slotId: string, number: number): ExplainedQuestionItem => ({
  slotId,
  questionNumber: number,
  questionText: `Question ${number}`,
  options: { a: 'A', b: 'B', c: 'C', d: 'D' },
  optionA: 'A',
  optionB: 'B',
  optionC: 'C',
  optionD: 'D',
  correctAnswer: 'B',
  explanation: `Explanation ${number}`,
});

const questions = [question('slt-one', 1), question('slt-two', 2), question('slt-three', 3)];
const moved = reorderExplainedQuestions(questions, 0, 2);
assert.deepEqual(moved.map((item) => item.slotId), ['slt-two', 'slt-three', 'slt-one']);
assert.deepEqual(moved.map((item) => item.questionNumber), [1, 2, 3]);
assert.equal(moved[2].correctAnswer, 'B');
assert.equal(moved[2].options.b, 'B');

const invalid = validateExplainedQuestion({
  ...question('slt-invalid', 1),
  questionText: '',
  options: { a: 'same', b: 'same', c: 'C', d: '' },
  explanation: '',
});
assert.equal(invalid.questionText, 'Question text must contain at least 5 characters.');
assert.equal(invalid.optionD, 'Option D is required.');
assert.equal(invalid.explanation, 'Explanation is required.');
assert.equal(
  validateExplainedQuestion({
    ...question('slt-duplicate', 1),
    options: { a: 'same', b: 'same', c: 'C', d: 'D' },
  }).options,
  'Options must be distinct.'
);

console.log('S9-T11 QUESTION EDITOR TESTS PASSED CLEANLY');
