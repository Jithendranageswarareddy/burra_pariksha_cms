/**
 * Shared Discover-to-Improve adapter.
 *
 * It is intentionally pure: the workflow engine remains the only mutation
 * authority, while this view connects LearningUnit planning to stage 01–15.
 */
import {
  ProductPipelinePhase,
  ProductPipelinePhaseDefinition,
  ResolvedProductPipeline,
  WorkflowResolutionInput,
} from '../contracts';
import { WorkflowStepNumber } from '../constants/workflow';
import { resolveDynamicWorkflow } from './workflow-resolver';

export const PRODUCT_PIPELINE_PHASES: readonly ProductPipelinePhaseDefinition[] = [
  { phase: 'DISCOVER', label: 'Discover', learningUnitBoundary: 'LearningUnit problem and audience need', stageRange: [1, 1], primaryStage: 1, description: 'Identify the real-life question, skill gap, or audience need.' },
  { phase: 'PLAN', label: 'Plan', learningUnitBoundary: 'LearningUnit objective, audience, skill, and outcome', stageRange: [1, 1], primaryStage: 1, description: 'Define the learning objective and intended outcome before workflow submission.' },
  { phase: 'VERIFY', label: 'Verify', learningUnitBoundary: 'LearningUnit verified method and answer', stageRange: [2, 2], primaryStage: 2, description: 'Verify correctness, reasoning, clarity, and supporting evidence.' },
  { phase: 'DESIGN', label: 'Design', learningUnitBoundary: 'LearningUnit mode and presentation format', stageRange: [3, 3], primaryStage: 3, description: 'Select the appropriate content mode and presentation format.' },
  { phase: 'GENERATE', label: 'Generate', learningUnitBoundary: 'Linked artifact drafts and production materials', stageRange: [3, 6], primaryStage: 3, description: 'Draft audience script and produce the media asset.' },
  { phase: 'REVIEW', label: 'Review', learningUnitBoundary: 'Linked artifact quality and packaging evidence', stageRange: [7, 9], primaryStage: 7, description: 'Review correctness, clarity, relevance, originality, and presentation.' },
  { phase: 'APPROVE', label: 'Approve', learningUnitBoundary: 'Human-gated approval evidence', stageRange: [7, 9], primaryStage: 7, description: 'Apply existing independent human approval gates.' },
  { phase: 'PUBLISH', label: 'Publish', learningUnitBoundary: 'Publication setup and platform release', stageRange: [10, 12], primaryStage: 10, description: 'Configure, release, and synchronize the approved artifact.' },
  { phase: 'MEASURE', label: 'Measure', learningUnitBoundary: 'Artifact/platform performance evidence', stageRange: [13, 14], primaryStage: 13, description: 'Record reach, retention, engagement, and production effort.' },
  { phase: 'IMPROVE', label: 'Improve', learningUnitBoundary: 'Revision or related LearningUnit planning', stageRange: [15, 15], primaryStage: 15, description: 'Use evidence to revise or extend content; revisions re-enter at Stage 01.' },
];

export function getProductPipelinePhase(phase: ProductPipelinePhase): ProductPipelinePhaseDefinition {
  const definition = PRODUCT_PIPELINE_PHASES.find((candidate) => candidate.phase === phase);
  if (!definition) {
    throw new Error(`Unsupported product pipeline phase: '${phase}'.`);
  }
  return definition;
}

export function phaseForWorkflowStep(step: WorkflowStepNumber): ProductPipelinePhase {
  if (step === 1) return 'PLAN';
  if (step === 2) return 'VERIFY';
  if (step === 3) return 'DESIGN';
  if (step >= 4 && step <= 6) return 'GENERATE';
  if (step === 7) return 'REVIEW';
  if (step === 8 || step === 9) return 'APPROVE';
  if (step >= 10 && step <= 12) return 'PUBLISH';
  if (step === 13 || step === 14) return 'MEASURE';
  return 'IMPROVE';
}

export function resolveProductPipeline(input: WorkflowResolutionInput): ResolvedProductPipeline {
  const workflow = resolveDynamicWorkflow(input);
  const phase = phaseForWorkflowStep(workflow.currentStage);
  return {
    phase,
    phaseDefinition: getProductPipelinePhase(phase),
    workflow,
    improvementTargetStage: 1,
  };
}
