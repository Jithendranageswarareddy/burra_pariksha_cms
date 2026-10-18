import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CandidateCanvas } from '../../../frontend/features/question-generation/components/CandidateCanvas';
import {
  reorderExplainedQuestions,
  getReorderedActiveQuestionIndex,
  updateExplainedQuestionList,
  validateExplainedQuestion,
  validateStudioCandidate,
} from '../../../shared/lib/question-editor';
import { ExplainedQuestionItem } from '../../../shared/types/question';
import { StudioCandidate } from '../../../shared/contracts/question-generation';

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

let activeSlotId = 'slt-two';
const edited = moved.map((item) =>
  item.slotId === activeSlotId ? { ...item, questionText: 'Edited while away' } : item
);
assert.equal(edited.find((item) => item.slotId === activeSlotId)?.questionText, 'Edited while away');
const movedActive = reorderExplainedQuestions(edited, 0, 1);
assert.equal(movedActive[1].slotId, activeSlotId);
assert.equal(movedActive[1].questionText, 'Edited while away');
const updatedThroughProductionPath = updateExplainedQuestionList(
  questions,
  2,
  { questionText: 'Edited through the editor state update' }
);
assert.equal(updatedThroughProductionPath[1].questionText, 'Edited through the editor state update');
assert.equal(updatedThroughProductionPath[0].questionText, questions[0].questionText);
assert.equal(updatedThroughProductionPath[1].slotId, questions[1].slotId);
assert.equal(getReorderedActiveQuestionIndex(questions, 2, 1, 0), 1);
assert.equal(getReorderedActiveQuestionIndex(questions, 2, 1, 2), 3);

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
const candidateErrors = validateStudioCandidate({
  questionText: '',
  optionA: '',
  optionB: 'B',
  optionC: 'C',
  optionD: 'D',
  correctAnswer: '',
  explanation: '',
});
assert.equal(candidateErrors.questionText, 'Question text must contain at least 5 characters.');
assert.equal(candidateErrors.optionA, 'Option A is required.');
assert.equal(candidateErrors.correctAnswer, 'Select a correct answer.');
assert.equal(candidateErrors.explanation, 'Explanation is required.');

const candidate: StudioCandidate = {
  questionText: '',
  optionA: '',
  optionB: 'same',
  optionC: 'same',
  optionD: 'D',
  correctAnswer: 'A',
  explanation: '',
  topicId: 'top-test',
  subtopicId: 'sub-test',
  difficulty: 'EASY',
  challengeType: 'MCQ',
  presentationType: 'TEXT',
  language: 'TELUGU',
  realLifeContext: '',
  tags: [],
};
const renderedEditor = renderToStaticMarkup(
  React.createElement(CandidateCanvas, {
    candidate,
    hasCandidate: true,
    isDirty: true,
    isGenerating: false,
    isRefining: false,
    onUpdateField: () => undefined,
    onRefine: () => undefined,
    onGenerate: () => undefined,
    onManualDraft: () => undefined,
  })
);
assert.match(renderedEditor, /Question text must contain at least 5 characters/);
assert.match(renderedEditor, /Option A is required/);
assert.match(renderedEditor, /Explanation is required/);
assert.equal((renderedEditor.match(/role="alert"/g) || []).length, 3);
const renderedDuplicateOptions = renderToStaticMarkup(
  React.createElement(CandidateCanvas, {
    candidate: { ...candidate, optionA: 'same' },
    hasCandidate: true,
    isDirty: true,
    isGenerating: false,
    isRefining: false,
    onUpdateField: () => undefined,
    onRefine: () => undefined,
    onGenerate: () => undefined,
    onManualDraft: () => undefined,
  })
);
assert.match(renderedDuplicateOptions, /Options must be distinct/);

console.log('S9-T11 QUESTION EDITOR TESTS PASSED CLEANLY');
