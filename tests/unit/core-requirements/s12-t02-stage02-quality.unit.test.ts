import assert from 'node:assert/strict';
import { Question } from '../../../shared';
import { validateStage02Quality } from '../../../backend/ai/validators/stage02-quality.validator';

const baseQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'qst_stage02',
  topicId: 'topic',
  topicName: 'Topic',
  subtopicId: 'subtopic',
  subtopicName: 'Subtopic',
  difficulty: 'MEDIUM',
  language: 'TELUGU',
  questionText: 'ఈ ప్రశ్నను రోజువారీ నిర్ణయంలో ఎలా ఉపయోగించాలి?',
  options: { a: 'రోజువారీ ఉపయోగం', b: 'ఇతర ఎంపిక', c: 'మరొక ఎంపిక', d: 'చివరి ఎంపిక' },
  correctAnswer: 'A',
  explanation: 'రోజువారీ ఉపయోగం కోసం ఈ ఎంపిక సరైనది.',
  status: 'DRAFT' as any,
  videoStatus: 'NOT_STARTED' as any,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  ...overrides,
});

const valid = validateStage02Quality(baseQuestion());
assert.equal(valid.errors.length, 0);
assert.equal(valid.checks.find((check) => check.id === 'CHK_STAGE_02_USEFULNESS')?.status, 'PASS');

const placeholder = validateStage02Quality(baseQuestion({ questionText: 'ఈ ప్రశ్న [TODO] కోసం.' }));
assert(placeholder.errors.some((error) => /placeholder/i.test(error)));

const missingExplanation = validateStage02Quality(baseQuestion({ explanation: '' }));
assert(missingExplanation.errors.some((error) => /Explanation is required/i.test(error)));

const duplicate = validateStage02Quality(baseQuestion(), [baseQuestion({ id: 'qst_existing' })]);
assert(duplicate.errors.some((error) => /Exact duplicate/i.test(error)));

const nearDuplicate = validateStage02Quality(
  baseQuestion({ questionText: 'ఈ ప్రశ్నను రోజువారీ నిర్ణయంలో ఎలా ఉపయోగించాలి మరియు ఎప్పుడు?' }),
  [baseQuestion({ id: 'qst_existing', questionText: 'ఈ ప్రశ్నను రోజువారీ నిర్ణయంలో ఎలా ఉపయోగించాలి?' })]
);
assert.equal(nearDuplicate.checks.find((check) => check.id === 'CHK_STAGE_02_DUPLICATE')?.status, 'NEEDS_REVIEW');

const factRisk = validateStage02Quality(baseQuestion({ questionText: 'Which is always the largest value in 2024?' }));
assert.equal(factRisk.checks.find((check) => check.id === 'CHK_STAGE_02_FACT_RISK')?.status, 'NEEDS_REVIEW');

const TeluguReview = validateStage02Quality(baseQuestion({ language: 'TELUGU', questionText: 'Which option is useful?' }));
assert.equal(TeluguReview.checks.find((check) => check.id === 'CHK_STAGE_02_TELUGU_CLARITY')?.status, 'NEEDS_REVIEW');

console.log('S12-T02 Stage 02 quality validation tests passed (7 cases).');
