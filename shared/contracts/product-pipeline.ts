/**
 * Product pipeline mapping for LearningUnit planning and the canonical
 * 15-stage workflow. These labels are planning views, not workflow states.
 */
import { WorkflowResolutionInput, ResolvedWorkflowState } from './workflow';
import { WorkflowStepNumber } from '../constants/workflow';

export type ProductPipelinePhase =
  | 'DISCOVER'
  | 'PLAN'
  | 'VERIFY'
  | 'DESIGN'
  | 'GENERATE'
  | 'REVIEW'
  | 'APPROVE'
  | 'PUBLISH'
  | 'MEASURE'
  | 'IMPROVE';

export interface ProductPipelinePhaseDefinition {
  phase: ProductPipelinePhase;
  label: string;
  learningUnitBoundary: string;
  stageRange: readonly [WorkflowStepNumber, WorkflowStepNumber];
  primaryStage: WorkflowStepNumber;
  description: string;
}

export interface ResolvedProductPipeline {
  phase: ProductPipelinePhase;
  phaseDefinition: ProductPipelinePhaseDefinition;
  workflow: ResolvedWorkflowState;
  improvementTargetStage: WorkflowStepNumber;
}
