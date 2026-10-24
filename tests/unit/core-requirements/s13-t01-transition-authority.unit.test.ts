import assert from 'node:assert/strict';
import {
  CANONICAL_WORKFLOW_STEPS,
  WorkflowInstanceDocument,
} from '../../../shared';
import {
  CANONICAL_TRANSITION_RULES,
  checkStepPrerequisites,
  findTransitionRule,
  isCanonicalWorkflowStep,
  workflowEngine,
} from '../../../backend/domain/workflow';
import { InvalidWorkflowTransitionError } from '../../../src/lib/errors';

for (let step = 1; step <= 15; step++) {
  assert.equal(isCanonicalWorkflowStep(step), true);
  assert.ok(CANONICAL_WORKFLOW_STEPS[step as keyof typeof CANONICAL_WORKFLOW_STEPS]);
}
assert.equal(isCanonicalWorkflowStep(0), false);
assert.equal(isCanonicalWorkflowStep(16), false);
assert.equal(isCanonicalWorkflowStep('2'), false);

for (const rule of CANONICAL_TRANSITION_RULES) {
  assert.equal(findTransitionRule(rule.fromStep, rule.toStep, rule.action)?.action, rule.action);
}
assert.equal(findTransitionRule(1, 5, 'QUESTION_SUBMIT'), null);
assert.ok(findTransitionRule(1, 1, 'SAVE_DRAFT'));

const basePayload = {
  conceptTitle: 'Discounts',
  introductoryConcept: 'A percentage discount reduces a marked price.',
};
const canonicalWorkedExamples = checkStepPrerequisites(
  { currentStep: 1, metadata: { productionMode: 'WORKED_EXAMPLES' } } as WorkflowInstanceDocument,
  2,
  'QUESTION_SUBMIT',
  { productionMode: 'WORKED_EXAMPLES', targetQuestionCount: 5, questions: [{}, {}, {}, {}, {}], ...basePayload }
);
assert.equal(canonicalWorkedExamples.valid, true);

const legacyWorkedExamples = checkStepPrerequisites(
  { currentStep: 1, metadata: { productionMode: 'EXPLAINED_QUESTIONS_VIDEO' } } as WorkflowInstanceDocument,
  2,
  'QUESTION_SUBMIT',
  { productionMode: 'EXPLAINED_QUESTIONS_VIDEO', targetQuestionCount: 5, questions: [{}, {}, {}, {}, {}], ...basePayload }
);
assert.equal(legacyWorkedExamples.valid, true);

assert.throws(() => workflowEngine.evaluateTransition(
  { currentStep: 99 } as WorkflowInstanceDocument,
  2,
  'QUESTION_SUBMIT',
  { id: 'usr-1', role: 'ADMIN', isAiAgent: false } as any
), InvalidWorkflowTransitionError);

console.log('S13-T01 transition authority tests passed (15 steps, canonical/legacy modes, guards).');
