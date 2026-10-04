/**
 * BURRA PARIKSHA CMS — Canonical Workflow Service
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 * - docs/architecture/08-STATE-MODEL.md
 *
 * Coordinates authentication, capability verification, deterministic state-machine
 * execution, OCC optimistic concurrency control, Firestore persistence, history logging,
 * FC-004 audit dispatching, and realtime SSE event broadcasting.
 */

import {
  WorkflowInstanceDocument,
  WorkflowHistoryEntry,
  WorkflowActorContext,
  WorkflowTransitionInput,
  WorkflowTransitionResult,
  CreateWorkflowInstanceInput,
  CreateWorkflowInstanceSchema,
  WorkflowTransitionRequestSchema,
} from '../../types/workflow';
import { workflowEngine } from './workflow-engine';
import {
  workflowInstancesRepository,
  workflowHistoryRepository,
} from './workflow.repository';
import { auditDispatcher } from '../audit';
import { realtimeEventBus } from '../realtime/event-bus';
import {
  ConcurrencyConflictError,
  NotFoundError,
  ValidationError,
  AppError,
} from '../errors';
import { canonicalIdService } from '../id.service';

export class WorkflowService {
  private static instance: WorkflowService | null = null;

  private constructor() {}

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  /**
   * Creates a new workflow instance linked to a content item.
   */
  public async createInstance(
    input: CreateWorkflowInstanceInput,
    actorContext?: WorkflowActorContext
  ): Promise<WorkflowInstanceDocument> {
    const validated = CreateWorkflowInstanceSchema.parse(input);
    const now = new Date().toISOString();
    const actorId = actorContext?.id || validated.authorId || 'SYSTEM';

    const doc = await workflowInstancesRepository.create(
      {
        entityType: validated.entityType,
        entityId: validated.entityId,
        currentStep: validated.currentStep as any,
        contentStatus: validated.contentStatus,
        mediaStatus: validated.mediaStatus,
        publicationStatus: validated.publicationStatus,
        jobStatus: validated.jobStatus,
        authorId: validated.authorId || actorId,
        lastTransitionAt: now,
        lastTransitionBy: actorId,
        metadata: validated.metadata || {},
      },
      {
        actorId,
        timestamp: now,
      }
    );

    // Record initial creation history
    await workflowHistoryRepository.create({
      workflowId: doc.id,
      entityId: doc.entityId,
      entityType: doc.entityType,
      fromStep: validated.currentStep as any,
      toStep: validated.currentStep as any,
      action: 'WORKFLOW_INITIALIZED',
      actorId,
      actorRole: actorContext?.role || 'SYSTEM',
      timestamp: now,
      reason: 'Workflow initialized in Step 01',
      result: 'SUCCESS',
      metadata: validated.metadata || {},
    });

    return doc;
  }

  /**
   * Retrieves a workflow instance by ID.
   */
  public async getInstance(id: string): Promise<WorkflowInstanceDocument> {
    const instance = await workflowInstancesRepository.findById(id);
    if (!instance) {
      throw new NotFoundError(`Workflow instance '${id}' not found.`);
    }
    return instance;
  }

  /**
   * Retrieves the immutable chronological transition history of a workflow instance.
   */
  public async getHistory(id: string): Promise<WorkflowHistoryEntry[]> {
    // Verify instance existence first
    await this.getInstance(id);

    return workflowHistoryRepository.findMany({
      where: { workflowId: id },
      orderBy: {
        field: 'createdAt',
        direction: 'asc',
      },
    });
  }

  /**
   * Authoritative Workflow Transition Pipeline:
   * 1. Retrieve Current Instance
   * 2. Validate OCC expectedVersion vs current.version
   * 3. Evaluate Transition via WorkflowEngine (guards, capabilities, GAR-02, prerequisites)
   * 4. Perform atomic update in workflow_instances (increments version)
   * 5. Record immutable history entry in workflow_history
   * 6. Dispatch FC-004 Audit Events (WORKFLOW.TRANSITION_SUCCESS / WORKFLOW.TRANSITION_REJECTED)
   * 7. Broadcast realtime event (workflow.step_transitioned)
   */
  public async transition(
    id: string,
    input: WorkflowTransitionInput,
    actorContext: WorkflowActorContext,
    options?: { requestId?: string }
  ): Promise<WorkflowTransitionResult> {
    const parsed = WorkflowTransitionRequestSchema.parse(input);
    const instance = await this.getInstance(id);
    const now = new Date().toISOString();
    const requestId = options?.requestId || `req_wfl_${Date.now()}`;

    // 1. Optimistic Concurrency Control (OCC) Verification
    if (instance.version !== parsed.expectedVersion) {
      const conflictErr = new ConcurrencyConflictError(
        'workflow_instances',
        id,
        parsed.expectedVersion,
        instance.version
      );

      // Audit transition rejection due to OCC conflict
      await auditDispatcher.dispatch({
        actor: {
          actorId: actorContext.id,
          actorRole: actorContext.role,
        },
        action: 'WORKFLOW.TRANSITION_REJECTED',
        resource: {
          resourceType: 'WORKFLOW_INSTANCE',
          resourceId: id,
          resourceVersion: instance.version,
        },
        context: {
          requestId,
          workflowStep: instance.currentStep,
        },
        result: 'FAILURE',
        reason: conflictErr.message,
        stateChange: {
          changeType: 'TRANSITION',
        },
      }).catch(() => {});

      throw conflictErr;
    }

    try {
      // 2. Evaluate State-Machine Legality, Capability, GAR-02, Prerequisites
      const evaluation = workflowEngine.evaluateTransition(
        instance,
        parsed.targetStep,
        parsed.action,
        actorContext,
        parsed.contentPayload
      );

      // 3. Atomically persist state update with expectedVersion OCC check
      const updated = await workflowInstancesRepository.update(
        id,
        parsed.expectedVersion,
        {
          currentStep: evaluation.resultingDimensions.workflowStep,
          contentStatus: evaluation.resultingDimensions.contentStatus,
          mediaStatus: evaluation.resultingDimensions.mediaStatus,
          publicationStatus: evaluation.resultingDimensions.publicationStatus,
          jobStatus: evaluation.resultingDimensions.jobStatus,
          lastTransitionAt: now,
          lastTransitionBy: actorContext.id,
        },
        {
          actorId: actorContext.id,
          timestamp: now,
        }
      );

      // 4. Record immutable history entry in workflow_history
      const historyEntry = await workflowHistoryRepository.create({
        workflowId: id,
        entityId: instance.entityId,
        entityType: instance.entityType,
        fromStep: instance.currentStep,
        toStep: evaluation.resultingDimensions.workflowStep,
        action: parsed.action,
        actorId: actorContext.id,
        actorRole: actorContext.role,
        timestamp: now,
        reason: parsed.reason,
        result: 'SUCCESS',
        metadata: {
          previousStep: instance.currentStep,
          previousDimensions: {
            contentStatus: instance.contentStatus,
            mediaStatus: instance.mediaStatus,
            publicationStatus: instance.publicationStatus,
            jobStatus: instance.jobStatus,
          },
          resultingDimensions: evaluation.resultingDimensions,
        },
      });

      // 5. Emit FC-004 Audit Event
      await auditDispatcher.dispatch({
        actor: {
          actorId: actorContext.id,
          actorRole: actorContext.role,
        },
        action: 'WORKFLOW.TRANSITION_SUCCESS',
        resource: {
          resourceType: 'WORKFLOW_INSTANCE',
          resourceId: id,
          resourceVersion: updated.version,
        },
        context: {
          requestId,
          workflowStep: updated.currentStep,
        },
        result: 'SUCCESS',
        stateChange: {
          changeType: 'TRANSITION',
          before: {
            step: instance.currentStep,
            contentStatus: instance.contentStatus,
            mediaStatus: instance.mediaStatus,
            publicationStatus: instance.publicationStatus,
            jobStatus: instance.jobStatus,
          },
          after: {
            step: updated.currentStep,
            contentStatus: updated.contentStatus,
            mediaStatus: updated.mediaStatus,
            publicationStatus: updated.publicationStatus,
            jobStatus: updated.jobStatus,
          },
          diff: {
            previousStep: instance.currentStep,
            newStep: updated.currentStep,
            action: parsed.action,
          },
        },
      }).catch(() => {});

      // 6. Broadcast Realtime SSE Event
      realtimeEventBus.emitWorkflowTransition({
        workflowId: id,
        entityId: updated.entityId,
        entityType: updated.entityType,
        fromStep: instance.currentStep,
        toStep: updated.currentStep,
        action: parsed.action,
        actorId: actorContext.id,
        timestamp: now,
        version: updated.version,
        stateDimensions: {
          workflowStep: updated.currentStep,
          contentStatus: updated.contentStatus,
          mediaStatus: updated.mediaStatus,
          publicationStatus: updated.publicationStatus,
          jobStatus: updated.jobStatus,
        },
      });

      return {
        success: true,
        workflow: updated,
        historyEntry,
        auditAction: 'WORKFLOW.TRANSITION_SUCCESS',
        realtimeEvent: 'workflow.step_transitioned',
      };
    } catch (err: any) {
      // Record failed transition in audit trail before rethrowing
      await auditDispatcher.dispatch({
        actor: {
          actorId: actorContext.id,
          actorRole: actorContext.role,
        },
        action: 'WORKFLOW.TRANSITION_REJECTED',
        resource: {
          resourceType: 'WORKFLOW_INSTANCE',
          resourceId: id,
          resourceVersion: instance.version,
        },
        context: {
          requestId,
          workflowStep: instance.currentStep,
        },
        result: 'FAILURE',
        reason: err.message || 'Transition rejected by workflow engine.',
        stateChange: {
          changeType: 'TRANSITION',
        },
      }).catch(() => {});

      throw err;
    }
  }
}

export const workflowService = WorkflowService.getInstance();
