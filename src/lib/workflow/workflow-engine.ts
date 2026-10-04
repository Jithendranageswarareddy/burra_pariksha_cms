/**
 * BURRA PARIKSHA CMS — Authoritative Workflow Engine
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 * - docs/architecture/08-STATE-MODEL.md
 *
 * Implements deterministic transition evaluation, transition guards, GAR-02 anti-self-approval,
 * prerequisite gate checks, and orthogonal 5-dimensional state resolution.
 */

import {
  WorkflowInstanceDocument,
  WorkflowActorContext,
  WorkflowStepNumber,
  ValidTransitionTarget,
  TransitionRule,
} from '../../types/workflow';
import { IWorkflowEngine, WorkflowPrerequisiteValidationResult } from './workflow-engine.interface';
import {
  findTransitionRule,
  getRulesForStep,
  checkStepPrerequisites,
} from './transition-matrix';
import {
  ForbiddenError,
  InvalidWorkflowTransitionError,
  ValidationError,
} from '../errors';
import { CanonicalRbacRole, roleHasCapability, resolveBrownfieldRole } from '../../types/rbac-models';

export class WorkflowEngine implements IWorkflowEngine {
  private static instance: WorkflowEngine | null = null;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Evaluates and validates a proposed workflow state transition.
   * Throws 422 if transition is illegal according to the canonical matrix.
   * Throws 403 if GAR-02 is violated or actor lacks required capability.
   */
  public evaluateTransition(
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
  } {
    // 1. Verify target step bounds (1..15)
    if (!Number.isInteger(targetStep) || targetStep < 1 || targetStep > 15) {
      throw new InvalidWorkflowTransitionError(
        `Target step ${targetStep} is out of bounds. Canonical workflow steps are strictly 1..15.`
      );
    }

    const currentStep = item.currentStep as WorkflowStepNumber;

    // 2. Lookup rule in canonical transition matrix
    const rule = findTransitionRule(currentStep, targetStep, action);
    if (!rule) {
      throw new InvalidWorkflowTransitionError(
        `Illegal workflow transition: Cannot transition from Step ${currentStep} to Step ${targetStep} using action '${action}'. Normal forward transitions are strictly N -> N+1.`
      );
    }

    // 3. AP-009: AI agents cannot execute workflow approval or transition decisions
    if (actorContext.isAiAgent) {
      throw new ForbiddenError(
        'Autonomous AI transition prohibited: Workflow transitions require human-in-the-loop authorization (AP-009).'
      );
    }

    // 4. GAR-02 Anti-Self-Approval Enforcement
    // Verification steps (Steps 02, 07, 09) strictly prohibit the author from approving their own work.
    const isVerificationStep = currentStep === 2 || currentStep === 7 || currentStep === 9;
    const isApprovalAction =
      rule.isVerificationGate ||
      action.toUpperCase().includes('APPROVE') ||
      action.toUpperCase().includes('VERIFY');

    if (isVerificationStep && isApprovalAction) {
      const authorId = item.authorId || (contentPayload?.authorId as string) || (contentPayload?.authorUserId as string);
      if (authorId && authorId.trim() === actorContext.id.trim()) {
        throw new ForbiddenError(
          `Self-approval strictly prohibited under GAR-02 segregation of duties: Author (${authorId}) cannot approve their own work at Step ${currentStep}.`
        );
      }
    }

    // 5. Capability possession check
    // Admins have supervisory transition capability, others require specific role capability
    const canonicalRole = resolveBrownfieldRole(actorContext.role);
    if (canonicalRole !== CanonicalRbacRole.ADMIN) {
      const requiredCap = rule.requiredCapability;
      const possessesCap =
        roleHasCapability(canonicalRole, requiredCap as any) ||
        roleHasCapability(canonicalRole, 'WORKFLOW_INSTANCE:TRANSITION' as any);

      if (!possessesCap) {
        throw new ForbiddenError(
          `Actor lacks required capability '${requiredCap}' to perform action '${action}' from Step ${currentStep} to Step ${targetStep}.`
        );
      }
    }

    // 6. Prerequisite completeness check
    const prereqCheck = this.validatePrerequisites(item, targetStep, action, contentPayload);
    if (!prereqCheck.valid) {
      throw new InvalidWorkflowTransitionError(
        `Workflow prerequisite validation failed: ${prereqCheck.errors.join('; ')}`
      );
    }

    // 7. Resolve orthogonal 5-dimensional state
    const resultingDimensions = {
      workflowStep: (rule.resultingDimensions?.workflowStep ?? targetStep) as WorkflowStepNumber,
      contentStatus: rule.resultingDimensions?.contentStatus ?? item.contentStatus,
      mediaStatus: rule.resultingDimensions?.mediaStatus ?? item.mediaStatus,
      publicationStatus: rule.resultingDimensions?.publicationStatus ?? item.publicationStatus,
      jobStatus: rule.resultingDimensions?.jobStatus ?? item.jobStatus,
    };

    return {
      rule,
      resultingDimensions,
    };
  }

  /**
   * Returns available and blocked next transition targets from current step.
   */
  public getValidNextSteps(
    item: WorkflowInstanceDocument,
    actorContext?: WorkflowActorContext
  ): ValidTransitionTarget[] {
    const rules = getRulesForStep(item.currentStep);
    return rules.map((rule) => {
      let isAvailable = true;
      let blockedReason: string | undefined;

      // Check GAR-02 if actor provided
      if (actorContext && rule.isVerificationGate) {
        const authorId = item.authorId;
        if (authorId && authorId.trim() === actorContext.id.trim()) {
          isAvailable = false;
          blockedReason = 'Self-approval prohibited (GAR-02): Author cannot approve own work.';
        }
      }

      // Check capabilities if actor provided
      if (actorContext && isAvailable) {
        const canonicalRole = resolveBrownfieldRole(actorContext.role);
        if (canonicalRole !== CanonicalRbacRole.ADMIN) {
          const possesses =
            roleHasCapability(canonicalRole, rule.requiredCapability as any) ||
            roleHasCapability(canonicalRole, 'WORKFLOW_INSTANCE:TRANSITION' as any);
          if (!possesses) {
            isAvailable = false;
            blockedReason = `Requires capability '${rule.requiredCapability}'.`;
          }
        }
      }

      return {
        targetStep: rule.toStep,
        action: rule.action,
        type: rule.type,
        isAvailable,
        requiredCapability: rule.requiredCapability,
        blockedReason,
      };
    });
  }

  /**
   * Validates content prerequisites before entering a step.
   */
  public validatePrerequisites(
    item: WorkflowInstanceDocument,
    targetStep: number,
    action: string,
    contentPayload?: Record<string, unknown>
  ): WorkflowPrerequisiteValidationResult {
    return checkStepPrerequisites(item, targetStep, action, contentPayload);
  }
}

export const workflowEngine: IWorkflowEngine = WorkflowEngine.getInstance();
