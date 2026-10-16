/**
 * BURRA PARIKSHA CMS — Shared Workflow Contracts
 * Stage 27 Feature Contract: FC-005 (Workflow State Transitions)
 */

import {
  AssetStatus,
  EditorialStatus,
  PublishStatus,
  ValidationStatus,
  WorkflowStepNumber,
  FiveDimensionalState,
  ContentStatus,
  MediaStatus,
  PublicationStatus,
  JobStatus,
} from '../constants/workflow';

export interface WorkflowDimensionState {
  editorial: EditorialStatus;
  validation: ValidationStatus;
  asset: AssetStatus;
  publish: PublishStatus;
}

export interface WorkflowTransitionRequest {
  entityId: string;
  fromStep: WorkflowStepNumber;
  toStep: WorkflowStepNumber;
  remarks?: string;
  context?: Record<string, unknown>;
}

export interface WorkflowTransitionResponse {
  success: boolean;
  entityId: string;
  previousStep: WorkflowStepNumber;
  currentStep: WorkflowStepNumber;
  transitionedAt: string;
  actorId: string;
  actorRole: string;
  dimensions: WorkflowDimensionState;
}

export interface WorkflowActionContext {
  authorId?: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  sourceIp?: string;
  userAgent?: string;
}

export type WorkflowEntityType = 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'PACKAGE' | 'CONTENT';

export interface WorkflowInstanceDocument {
  id: string; // e.g. wfl_xxxx
  entityType: WorkflowEntityType;
  entityId: string;
  currentStep: WorkflowStepNumber;
  contentStatus: ContentStatus | string;
  mediaStatus: MediaStatus | string;
  publicationStatus: PublicationStatus | string;
  jobStatus: JobStatus | string;
  authorId?: string;
  lastTransitionAt: string;
  lastTransitionBy?: string;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type TransitionType = 'FORWARD' | 'REJECT' | 'REVISE' | 'RETRY' | 'OVERRIDE';

export interface TransitionRule {
  fromStep: WorkflowStepNumber;
  toStep: WorkflowStepNumber;
  action: string;
  type: TransitionType | string;
  requiredCapability: string;
  isVerificationGate?: boolean;
  resultingDimensions?: Partial<FiveDimensionalState>;
  description: string;
}

export interface ValidTransitionTarget {
  targetStep: WorkflowStepNumber;
  action: string;
  type: TransitionType | string;
  isAvailable: boolean;
  requiredCapability: string;
  blockedReason?: string;
}

export interface WorkflowActorContext {
  id: string;
  name?: string;
  role: string;
  roles?: string[];
  isAiAgent?: boolean;
}

export interface WorkflowTransitionInput {
  targetStep: number;
  action: string;
  reason?: string;
  expectedVersion: number;
  contentPayload?: Record<string, unknown>;
}

export interface WorkflowTransitionResult {
  success: boolean;
  workflow: WorkflowInstanceDocument;
  historyEntry?: any;
  auditAction?: string;
  realtimeEvent?: string;
}

/**
 * S8-T07 / S8-T14: Dynamic Workflow Resolution Contracts
 */

export interface ResolvedWorkflowStep {
  stepNumber: WorkflowStepNumber;
  code: string;
  name: string;
  shortName: string;
  description: string;
  isApplicable: boolean;
  isConditional?: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  isBlocked: boolean;
  blockerReason?: string;
  applicableChecklistType?: string;
  route: string;
}

export interface ResolvedWorkflowProgress {
  currentStage: WorkflowStepNumber;
  currentStageCode: string;
  currentStageName: string;
  stageStatus: WorkflowStageStatus | string;
  completedApplicableSteps: number;
  totalApplicableSteps: number;
  percentage: number;
}

export interface ResolvedWorkflowAction {
  actionId: string;
  label: string;
  actionType: string;
  targetStep: WorkflowStepNumber;
  isAvailable: boolean;
  requiredCapability: string;
  blockedReason?: string;
  isGar02Restricted?: boolean;
  route?: string;
}

export interface WorkflowResolutionInput {
  entityId: string;
  entityType?: 'QUESTION' | 'VIDEO' | 'CONTENT' | 'DRAFT' | string;
  productionMode?: string;
  persistedWorkflow?: Partial<WorkflowInstanceDocument>;
  entityData?: Record<string, unknown>;
  actor?: WorkflowActorContext;
}

export interface ResolvedWorkflowState {
  workflowInstanceId: string;
  entityId: string;
  entityType: string;
  productionMode: string;
  currentStage: WorkflowStepNumber;
  stageCode: string;
  stageStatus: WorkflowStageStatus | string;
  multiDimensionalState: {
    contentStatus: string;
    mediaStatus: string;
    publicationStatus: string;
    jobStatus: string;
  };
  version: number;
  assignment: {
    ownerId: string;
    stageAssigneeId?: string;
  };
  applicableSteps: ResolvedWorkflowStep[];
  progress: ResolvedWorkflowProgress;
  permittedActions: ResolvedWorkflowAction[];
  primaryNextAction: ResolvedWorkflowAction | null;
  isGar02Restricted: boolean;
  isTerminal: boolean;
  lastTransitionAt: string;
  lastTransitionBy: string;
  metadata?: Record<string, unknown>;
}

