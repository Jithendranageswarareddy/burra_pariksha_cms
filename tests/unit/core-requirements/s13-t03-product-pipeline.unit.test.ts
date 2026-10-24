import assert from 'node:assert/strict';
import {
  getProductPipelinePhase,
  phaseForWorkflowStep,
  PRODUCT_PIPELINE_PHASES,
  resolveProductPipeline,
} from '../../../shared';

assert.equal(PRODUCT_PIPELINE_PHASES.length, 10);
assert.equal(getProductPipelinePhase('DISCOVER').primaryStage, 1);
assert.equal(getProductPipelinePhase('IMPROVE').stageRange[0], 15);
assert.equal(getProductPipelinePhase('IMPROVE').description.includes('Stage 01'), true);
assert.throws(() => getProductPipelinePhase('UNKNOWN' as never));

assert.equal(phaseForWorkflowStep(1), 'PLAN');
assert.equal(phaseForWorkflowStep(2), 'VERIFY');
assert.equal(phaseForWorkflowStep(3), 'DESIGN');
assert.equal(phaseForWorkflowStep(5), 'GENERATE');
assert.equal(phaseForWorkflowStep(7), 'REVIEW');
assert.equal(phaseForWorkflowStep(9), 'APPROVE');
assert.equal(phaseForWorkflowStep(11), 'PUBLISH');
assert.equal(phaseForWorkflowStep(13), 'MEASURE');
assert.equal(phaseForWorkflowStep(15), 'IMPROVE');

const phases = new Map<number, string>();
for (let step = 1; step <= 15; step++) {
  const resolved = resolveProductPipeline({
    entityId: `synthetic-${step}`,
    entityType: 'CONTENT',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: step as any,
      contentStatus: step >= 2 ? 'APPROVED' : 'DRAFT',
      mediaStatus: 'READY',
      publicationStatus: step >= 11 ? 'LIVE' : 'UNPUBLISHED',
      jobStatus: step === 15 ? 'COMPLETED' : 'IN_PROGRESS',
    } as any,
    entityData: { topicId: 'topic-1', subtopicId: 'subtopic-1', questionText: 'Synthetic question', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', proof: '1 + 1 = 2' },
  });
  phases.set(step, resolved.phase);
  assert.equal(resolved.workflow.currentStage, step);
  assert.equal(resolved.improvementTargetStage, 1);
}
assert.deepEqual([...phases.keys()], Array.from({ length: 15 }, (_, index) => index + 1));
assert.equal(phases.get(2), 'VERIFY');
assert.equal(phases.get(11), 'PUBLISH');
assert.equal(phases.get(13), 'MEASURE');
assert.equal(phases.get(15), 'IMPROVE');

console.log('S13-T03 product pipeline tests passed (Discover-to-Improve mapping across stages 01-15).');
