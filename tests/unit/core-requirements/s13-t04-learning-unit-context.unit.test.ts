import assert from 'node:assert/strict';
import {
  toAudienceLearningUnitContext,
  toLinkedLearningUnitContext,
  propagateLearningUnitId,
} from '../../../shared';
import { buildTeluguScriptPrompt } from '../../../backend/ai/prompts/script-generation.prompt';

const unit = {
  id: 'lnu_synthetic',
  title: 'Compare discount offers',
  learningObjective: 'Compare final prices after different discounts.',
  verifiedMethod: 'Compute each final price from the same marked price.',
  correctCalculations: '20% of 1000 is 200; final price is 800.',
  commonMistakes: ['Comparing discount percentages without comparing amounts.'],
  realLifeApplications: ['Festival shopping decisions.'],
  realLifeScenario: 'Choose between a percentage discount and a flat cashback.',
  topicId: 'percentages',
  subtopicId: 'discounts',
  topicName: 'Percentages',
  subtopicName: 'Discounts',
  skillLevel: 'BEGINNER',
  version: 2,
  authorId: 'usr_internal',
  authorName: 'Internal Author',
  planningStatus: 'SUBMITTED_FOR_VERIFICATION',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
} as any;

const linked = toLinkedLearningUnitContext(unit);
const audience = toAudienceLearningUnitContext(linked);
assert.equal(linked.learningUnitId, 'lnu_synthetic');
assert.equal('learningUnitId' in audience, false);
assert.equal('authorId' in audience, false);
assert.equal('version' in audience, false);
assert.deepEqual(propagateLearningUnitId(linked, { contentId: 'video-1', learningUnitId: undefined }), {
  contentId: 'video-1',
  learningUnitId: 'lnu_synthetic',
});

const prompt = buildTeluguScriptPrompt({
  questionText: 'Which offer gives the lower final price?',
  options: { a: '₹800', b: '₹850', c: '₹900', d: '₹950' },
  correctAnswer: 'A',
  explanation: 'Calculate both final prices.',
  learningUnitContext: audience,
});
assert.match(prompt, /Compare discount offers/);
assert.match(prompt, /Compare final prices/);
assert.doesNotMatch(prompt, /lnu_synthetic|usr_internal|Internal Author/);

console.log('S13-T04 linked LearningUnit context tests passed (propagation and audience-safe prompt projection).');
