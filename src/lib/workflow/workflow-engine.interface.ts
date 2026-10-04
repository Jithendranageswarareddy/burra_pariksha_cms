/**
 * BURRA PARIKSHA CMS — Authoritative Workflow Engine Interface
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 * - docs/architecture/08-STATE-MODEL.md
 */

import {
  WorkflowInstanceDocument,
  WorkflowActorContext,
  WorkflowTransitionResult,
  ValidTransitionTarget,
  TransitionRule,
  WorkflowStepNumber,
} from '../../types/workflow';

export interface WorkflowPrerequisiteValidationResult {
  valid: boolean;
  errors: string[];
}

export interface IWorkflowEngine {
  /**
   * Deterministically transitions a workflow instance to the target step after validating
   * current step, target step, action legality, capability, prerequisites, and GAR-02.
   */
  evaluateTransition(
    item: WorkflowInstanceDocument,
    targetStep: number,
    action: string,
    actorContext: WorkflowActorContext,
    contentPayload?: Record<string, unknown>
  ): {
    rule: TransitionRule;
    resultingDimensions: {
      workflowStep: WorkflowStepNumber;
      contentStatus: WorkflowInstanceDocument['contentStatus'];
      mediaStatus: WorkflowInstanceDocument['mediaStatus'];
      publicationStatus: WorkflowInstanceDocument['publicationStatus'];
      jobStatus: WorkflowInstanceDocument['jobStatus'];
    };
  };

  /**
   * Returns all valid transition targets from the current step of an item.
   */
  getValidNextSteps(
    item: WorkflowInstanceDocument,
    actorContext?: WorkflowActorContext
  ): ValidTransitionTarget[];

  /**
   * Validates content/state prerequisites before entering a step.
   */
  validatePrerequisites(
    item: WorkflowInstanceDocument,
    targetStep: number,
    action: string,
    contentPayload?: Record<string, unknown>
  ): WorkflowPrerequisiteValidationResult;
}
