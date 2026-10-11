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
  contentStatus: string;
  mediaStatus: string;
  publicationStatus: string;
  jobStatus: string;
  authorId?: string;
  lastTransitionAt: string;
  version?: number;
}

export type TransitionType = 'FORWARD' | 'REJECT' | 'REVISE' | 'RETRY' | 'OVERRIDE';

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

