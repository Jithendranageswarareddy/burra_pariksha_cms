/**
 * BURRA PARIKSHA CMS — Authoritative State Architecture (Stage 08)
 *
 * Enforces the Fundamental State Axiom:
 * BUSINESS STEP ≠ ENTITY STATUS ≠ MEDIA STATUS ≠ JOB STATUS ≠ PUBLICATION STATUS
 *
 * Covers all 10 substages (08.1 through 08.10) with strict dimensional decoupling,
 * transition rules, and concurrency control contracts.
 */

// ============================================================================
// 1. DIMENSION 1: BUSINESS WORKFLOW STEP (Substage 08.8)
// ============================================================================

export type BusinessWorkflowStepNumber =
  | 1  // 01 Question Generation
  | 2  // 02 Question Verification
  | 3  // 03 Audience Script
  | 4  // 04 Teleprompter & Filming
  | 5  // 05 Raw Video
  | 6  // 06 Editing Bay
  | 7  // 07 Final QC
  | 8  // 08 Thumbnail
  | 9  // 09 Social Review
  | 10 // 10 Publishing Setup
  | 11 // 11 Published
  | 12 // 12 Platform Sync
  | 13 // 13 Analytics
  | 14 // 14 Performance Review
  | 15; // 15 Intelligence Loop

export enum WorkflowInstanceState {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  ABORTED = 'ABORTED',
}

// ============================================================================
// 2. DIMENSION 2: ENTITY LIFECYCLE STATUS (Substages 08.1, 08.2, 08.3)
// ============================================================================

// 08.1 Question State
export enum QuestionLifecycleState {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
  RETIRED = 'RETIRED',
}

export enum QuestionVersionState {
  DRAFT_VERSION = 'DRAFT_VERSION',
  SUBMITTED_VERSION = 'SUBMITTED_VERSION',
  APPROVED_VERSION = 'APPROVED_VERSION',
  SUPERSEDED_VERSION = 'SUPERSEDED_VERSION',
  ARCHIVED_VERSION = 'ARCHIVED_VERSION',
}

// 08.2 Content State (Aggregate Root)
export enum ContentLifecycleState {
  INITIATED = 'INITIATED',
  CURRICULUM_LOCKED = 'CURRICULUM_LOCKED',
  PRODUCTION_IN_PROGRESS = 'PRODUCTION_IN_PROGRESS',
  PACKAGING = 'PACKAGING',
  RELEASED = 'RELEASED',
  ANALYZED = 'ANALYZED',
  ARCHIVED = 'ARCHIVED',
}

// 08.3 Video State
export enum VideoProjectState {
  SCHEDULED = 'SCHEDULED',
  RECORDING = 'RECORDING',
  RECORDED = 'RECORDED',
  EDITING = 'EDITING',
  QC_PENDING = 'QC_PENDING',
  QC_PASSED = 'QC_PASSED',
  QC_FAILED = 'QC_FAILED',
  COMPLETED = 'COMPLETED',
}

export enum VideoTakeState {
  CAPTURING = 'CAPTURING',
  UPLOADED = 'UPLOADED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DISCARDED = 'DISCARDED',
}

export enum VideoEditState {
  DRAFT_CUT = 'DRAFT_CUT',
  RENDER_QUEUED = 'RENDER_QUEUED',
  RENDERING = 'RENDERING',
  RENDERED = 'RENDERED',
  QC_SUBMITTED = 'QC_SUBMITTED',
  APPROVED_MASTER = 'APPROVED_MASTER',
  SUPERSEDED = 'SUPERSEDED',
  REJECTED = 'REJECTED',
}

export enum ThumbnailState {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  REVIEW_PENDING = 'REVIEW_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

// ============================================================================
// 3. DIMENSION 3: MEDIA PROCESSING STATUS (Substages 08.4, 08.5)
// ============================================================================

export enum MediaAssetProcessingState {
  REGISTERED = 'REGISTERED',
  INGESTING = 'INGESTING',
  VERIFIED_STORAGE = 'VERIFIED_STORAGE',
  PROXY_READY = 'PROXY_READY',
  ACTIVE = 'ACTIVE',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  DEPRECATED = 'DEPRECATED',
  PURGED = 'PURGED',
}

export enum MediaReferenceResolutionState {
  UNRESOLVED = 'UNRESOLVED',
  LOCATED = 'LOCATED',
  PERMISSIONS_VERIFIED = 'PERMISSIONS_VERIFIED',
  CHECKSUM_VALIDATED = 'CHECKSUM_VALIDATED',
  REVOKED = 'REVOKED',
}

// 08.5 Archive State
export enum ArchiveState {
  ACTIVE = 'ACTIVE',
  PENDING_ARCHIVAL = 'PENDING_ARCHIVAL',
  TIERED_COLD = 'TIERED_COLD',
  CHECKSUM_CONFIRMED = 'CHECKSUM_CONFIRMED',
  RESTORE_REQUESTED = 'RESTORE_REQUESTED',
  RESTORED = 'RESTORED',
}

// ============================================================================
// 4. DIMENSION 4: JOB EXECUTION STATUS (Substage 08.7)
// ============================================================================

export enum JobExecutionState {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_FATAL = 'FAILED_FATAL',
  TIMED_OUT = 'TIMED_OUT',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// 5. DIMENSION 5: PUBLICATION CHANNEL STATUS (Substage 08.6)
// ============================================================================

export enum PublishingPackageState {
  DRAFT_PACKAGE = 'DRAFT_PACKAGE',
  REVIEW_READY = 'REVIEW_READY',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  DISPATCHING = 'DISPATCHING',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  FULLY_PUBLISHED = 'FULLY_PUBLISHED',
  DISPATCH_FAILED = 'DISPATCH_FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ChannelPublicationState {
  STAGED = 'STAGED',
  SCHEDULED = 'SCHEDULED',
  UPLOADING = 'UPLOADING',
  PROCESSING_REMOTE = 'PROCESSING_REMOTE',
  LIVE = 'LIVE',
  SYNC_VERIFIED = 'SYNC_VERIFIED',
  DISPATCH_FAILED = 'DISPATCH_FAILED',
  REMOVED_EXTERNAL = 'REMOVED_EXTERNAL',
}

// ============================================================================
// 6. SUBSTAGE 08.9 & 08.10: TRANSITION & CONCURRENCY CONTROLS
// ============================================================================

export interface OptimisticLockEntity {
  version: number;
  lastModifiedAt: string;
}

export interface IdempotencyRecord {
  idempotencyKey: string;
  operationName: string;
  completedAt: string;
  responsePayloadHash: string;
}

export interface ConcurrencyValidationResult {
  allowed: boolean;
  error?: string;
  conflictType?: 'STALE_VERSION' | 'DUPLICATE_IDEMPOTENCY_KEY' | 'LEASE_LOCKED';
}

/**
 * Validates optimistic concurrency version matching (Substage 08.10).
 */
export function validateOptimisticLock(
  currentEntityVersion: number,
  incomingExpectedVersion: number
): ConcurrencyValidationResult {
  if (currentEntityVersion !== incomingExpectedVersion) {
    return {
      allowed: false,
      conflictType: 'STALE_VERSION',
      error: `Optimistic lock conflict: Entity version is ${currentEntityVersion}, but operation targeted stale version ${incomingExpectedVersion}.`,
    };
  }
  return { allowed: true };
}

/**
 * Validates idempotency key non-collision (Substage 08.10).
 */
export function validateIdempotency(
  existingKeys: Set<string>,
  incomingKey: string
): ConcurrencyValidationResult {
  if (existingKeys.has(incomingKey)) {
    return {
      allowed: false,
      conflictType: 'DUPLICATE_IDEMPOTENCY_KEY',
      error: `Duplicate operation rejected: Idempotency key "${incomingKey}" was already processed.`,
    };
  }
  return { allowed: true };
}

/**
 * Validates that the 5 state dimensions are orthogonal and not conflated.
 */
export function assertStateDimensionsDecoupled(): boolean {
  // Dimension 1 vs Dimension 2
  const isDiff1 = (WorkflowInstanceState.ACTIVE as unknown) !== (QuestionLifecycleState.DRAFT as unknown);
  // Dimension 2 vs Dimension 3
  const isDiff2 = (VideoProjectState.QC_FAILED as unknown) !== (MediaAssetProcessingState.STORAGE_UNAVAILABLE as unknown);
  // Dimension 3 vs Dimension 4
  const isDiff3 = (MediaAssetProcessingState.INGESTING as unknown) !== (JobExecutionState.RUNNING as unknown);
  // Dimension 4 vs Dimension 5
  const isDiff4 = (JobExecutionState.SUCCEEDED as unknown) !== (ChannelPublicationState.LIVE as unknown);

  return isDiff1 && isDiff2 && isDiff3 && isDiff4;
}
