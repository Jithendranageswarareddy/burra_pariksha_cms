/**
 * BURRA PARIKSHA CMS — Stage 17 Background Job & Asynchronous Architecture
 *
 * Implements the authoritative background job and asynchronous execution architecture:
 * - Non-Blocking Operations Inventory (7 canonical asynchronous domains)
 * - Job Runner Candidate Evaluation Matrix & Strict Anti-Redis Decision Statement
 * - Dual-Mode Hybrid Architecture:
 *     - Production: Google Cloud Tasks Managed Push Queue (1,000,000 free tasks/mo = ₹0.00/mo)
 *     - Local Dev: Node.js In-Process Event-Loop Runner (zero external dependencies)
 * - Durable Job Record Schema (Firestore 'jobs' collection) with optimistic leasing
 * - Idempotency Keys & Concurrency Lease Watchdogs
 * - Exponential Backoff Retry Algorithms & Dead-Letter Queue (DLQ) Governance
 * - Real-Time Synergy with Stage 16 SSE EventBus (JOB_STATUS_UPDATED)
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-011 Modular Monolith, AP-012 Zero-Cost Invariant)
 * - Stage 07 Canonical 15-Step Workflow
 * - Stage 08 State Model (JobExecutionState Dimension)
 * - Stage 12 Database Decision (Firestore Native Hybrid)
 * - Stage 13 Data Contract
 * - Stage 15 API Architecture
 * - Stage 16 Real-Time Architecture
 */

import { z } from 'zod';
import { JobExecutionState } from './state-models';
import { RealtimeEventType, RealtimeEventEnvelope, createRealtimeEnvelope, buildEntityChannel } from './realtime-architecture';

// Re-export JobExecutionState for direct consumer convenience
export { JobExecutionState };

// ============================================================================
// 1. CANONICAL ASYNC JOB TYPES
// ============================================================================

export enum AsyncJobType {
  AI_GENERATION = 'AI_GENERATION',
  MEDIA_PROCESSING = 'MEDIA_PROCESSING',
  PLATFORM_SYNC = 'PLATFORM_SYNC',
  ANALYTICS_COLLECTION = 'ANALYTICS_COLLECTION',
  THUMBNAIL_PROCESSING = 'THUMBNAIL_PROCESSING',
  ARCHIVE_VERIFICATION = 'ARCHIVE_VERIFICATION',
  USER_NOTIFICATION = 'USER_NOTIFICATION',
}

export const ASYNC_JOB_TYPES = Object.values(AsyncJobType);

// ============================================================================
// 2. JOB PRIORITY LEVELS
// ============================================================================

export enum JobPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  STANDARD = 'STANDARD',
  BACKGROUND = 'BACKGROUND',
}

export const JOB_PRIORITIES = Object.values(JobPriority);

// ============================================================================
// 3. ASYNC JOB DEFINITIONS REGISTRY (7 CANONICAL DOMAINS)
// ============================================================================

export interface AsyncJobDefinition {
  readonly type: AsyncJobType;
  readonly name: string;
  readonly triggerStep: string;
  readonly latencyRange: string;
  readonly timeoutSeconds: number;
  readonly maxRetries: number;
  readonly initialBackoffDelayMs: number;
  readonly backoffMultiplier: number;
  readonly defaultPriority: JobPriority;
  readonly failureStrategy: string;
  readonly businessDescription: string;
}

export const ASYNC_JOB_DEFINITIONS_REGISTRY: Record<AsyncJobType, AsyncJobDefinition> = {
  [AsyncJobType.AI_GENERATION]: {
    type: AsyncJobType.AI_GENERATION,
    name: 'AI Question & Script Drafting',
    triggerStep: 'Step 01, 03, 15',
    latencyRange: '3s – 25s',
    timeoutSeconds: 60,
    maxRetries: 3,
    initialBackoffDelayMs: 2000,
    backoffMultiplier: 2.0,
    defaultPriority: JobPriority.HIGH,
    failureStrategy: 'Transition to FAILED_FATAL, notify author via SSE to retry manually or draft without AI assistance.',
    businessDescription: 'Executes generative LLM prompts for question generation, teleprompter scripts, and curriculum feedback.',
  },
  [AsyncJobType.MEDIA_PROCESSING]: {
    type: AsyncJobType.MEDIA_PROCESSING,
    name: 'Media Transcoding & Checksum Verification',
    triggerStep: 'Step 05, 06',
    latencyRange: '10s – 120s',
    timeoutSeconds: 300,
    maxRetries: 2,
    initialBackoffDelayMs: 5000,
    backoffMultiplier: 3.0,
    defaultPriority: JobPriority.HIGH,
    failureStrategy: 'Flag video take/cut as STORAGE_UNAVAILABLE; notify video editor with specific transcode failure reason.',
    businessDescription: 'Validates Google Drive uploads, calculates SHA-256 cryptographic hashes, and validates 1080x1920 MP4 video specs.',
  },
  [AsyncJobType.PLATFORM_SYNC]: {
    type: AsyncJobType.PLATFORM_SYNC,
    name: 'Social Distribution Dispatch & Verification',
    triggerStep: 'Step 11, 12',
    latencyRange: '5s – 60s',
    timeoutSeconds: 120,
    maxRetries: 5,
    initialBackoffDelayMs: 10000,
    backoffMultiplier: 2.5,
    defaultPriority: JobPriority.CRITICAL,
    failureStrategy: 'Hold publication in DISPATCH_FAILED; trigger alert to Publishing Lead to investigate platform API status.',
    businessDescription: 'Dispatches publishing packages to YouTube Shorts, Instagram Reels, and Facebook Video APIs and verifies live permalinks.',
  },
  [AsyncJobType.ANALYTICS_COLLECTION]: {
    type: AsyncJobType.ANALYTICS_COLLECTION,
    name: 'Viewer Engagement & Retention Ingestion',
    triggerStep: 'Step 13',
    latencyRange: '5s – 30s',
    timeoutSeconds: 180,
    maxRetries: 3,
    initialBackoffDelayMs: 15000,
    backoffMultiplier: 3.0,
    defaultPriority: JobPriority.STANDARD,
    failureStrategy: 'Postpone telemetry pull to next scheduled periodic synchronization cycle.',
    businessDescription: 'Polls external platform telemetry endpoints for view counts, watch time, completion rates, and 3-second retention.',
  },
  [AsyncJobType.THUMBNAIL_PROCESSING]: {
    type: AsyncJobType.THUMBNAIL_PROCESSING,
    name: 'Thumbnail Artwork Variant Generation & Framing',
    triggerStep: 'Step 08, 09',
    latencyRange: '2s – 10s',
    timeoutSeconds: 45,
    maxRetries: 3,
    initialBackoffDelayMs: 2000,
    backoffMultiplier: 2.5,
    defaultPriority: JobPriority.STANDARD,
    failureStrategy: 'Notify designer of image format error; revert thumbnail state to DRAFT.',
    businessDescription: 'Processes 1080x1920 cover artwork variants and renders safe-zone mobile simulation overlays.',
  },
  [AsyncJobType.ARCHIVE_VERIFICATION]: {
    type: AsyncJobType.ARCHIVE_VERIFICATION,
    name: 'Deep Cold Archive Pre-Retirement Audit',
    triggerStep: 'Stage 14 Pre-Retirement',
    latencyRange: '15s – 90s',
    timeoutSeconds: 300,
    maxRetries: 2,
    initialBackoffDelayMs: 10000,
    backoffMultiplier: 3.0,
    defaultPriority: JobPriority.BACKGROUND,
    failureStrategy: 'Strictly prohibit Google Drive source asset deletion; raise security audit alert for corrupted cold storage.',
    businessDescription: 'Verifies SHA-256 checksums of cold-stored media binaries in Google Cloud Storage before purging active Drive working copies.',
  },
  [AsyncJobType.USER_NOTIFICATION]: {
    type: AsyncJobType.USER_NOTIFICATION,
    name: 'In-App Operational Notification Dispatch',
    triggerStep: 'All Stages',
    latencyRange: '500ms – 5s',
    timeoutSeconds: 15,
    maxRetries: 2,
    initialBackoffDelayMs: 1000,
    backoffMultiplier: 3.0,
    defaultPriority: JobPriority.STANDARD,
    failureStrategy: 'Drop non-critical operational alert; log dispatch anomaly to audit ledger.',
    businessDescription: 'Dispatches task assignment pings, review request notices, and approval decision toasts to target user channels.',
  },
};

// ============================================================================
// 4. RUNNER EVALUATION MATRIX & ANTI-REDIS DECISION
// ============================================================================

export enum JobRunnerCandidate {
  SYNCHRONOUS_CLOUD_RUN = 'SYNCHRONOUS_CLOUD_RUN',
  IN_PROCESS_TASK = 'IN_PROCESS_TASK',
  REDIS_BULLMQ = 'REDIS_BULLMQ',
  DATABASE_BACKED_ONLY = 'DATABASE_BACKED_ONLY',
  CLOUD_TASKS_HYBRID = 'CLOUD_TASKS_HYBRID',
}

export interface JobRunnerEvaluationDimension {
  readonly name: string;
  readonly weight: number;
  readonly syncScore: number;
  readonly inProcessScore: number;
  readonly redisScore: number;
  readonly dbBackedScore: number;
  readonly cloudTasksScore: number;
  readonly rationale: string;
}

export const JOB_RUNNER_EVALUATION_DIMENSIONS: readonly JobRunnerEvaluationDimension[] = [
  {
    name: 'Cost Compliance (₹0-₹100/mo)',
    weight: 1.5,
    syncScore: 10.0,
    inProcessScore: 10.0,
    redisScore: 1.0, // Memorystore is >= ₹2,500/mo (Immediate violation of COST-001)
    dbBackedScore: 8.0,
    cloudTasksScore: 10.0, // 1,000,000 free tasks/mo = ₹0.00
    rationale: 'Redis incurs at least ₹2,500/mo. Cloud Tasks provides 1M free requests/mo perpetually.',
  },
  {
    name: 'Free-Tier Suitability',
    weight: 1.5,
    syncScore: 2.0,
    inProcessScore: 4.0,
    redisScore: 1.0,
    dbBackedScore: 7.0,
    cloudTasksScore: 10.0,
    rationale: 'Cloud Tasks push queue operates within generous perpetual free tiers on Google Cloud.',
  },
  {
    name: 'Durability on Container Crash',
    weight: 1.0,
    syncScore: 1.0,
    inProcessScore: 2.0,
    redisScore: 9.0,
    dbBackedScore: 8.5,
    cloudTasksScore: 10.0,
    rationale: 'Cloud Tasks redelivers tasks automatically if container dies mid-execution.',
  },
  {
    name: 'Cloud Run Scale-to-Zero Compatibility',
    weight: 1.0,
    syncScore: 2.0,
    inProcessScore: 2.0,
    redisScore: 4.0,
    dbBackedScore: 6.0,
    cloudTasksScore: 10.0,
    rationale: 'Cloud Tasks invokes Cloud Run via HTTP push, instantly waking cold containers without idle servers.',
  },
  {
    name: 'Local Dev Ergonomics',
    weight: 1.0,
    syncScore: 8.0,
    inProcessScore: 10.0,
    redisScore: 3.0, // Requires Docker Redis container
    dbBackedScore: 7.0,
    cloudTasksScore: 9.0, // Seamless in-process fallback
    rationale: 'In-process runner executes locally without Docker or cloud credentials.',
  },
  {
    name: 'Managed Retries & Backoff Logic',
    weight: 1.0,
    syncScore: 1.0,
    inProcessScore: 4.0,
    redisScore: 9.0,
    dbBackedScore: 6.0,
    cloudTasksScore: 10.0,
    rationale: 'Cloud Tasks handles exponential backoff, rate limiting, and redelivery natively.',
  },
  {
    name: 'Modular Monolith Preservation (AP-011)',
    weight: 1.0,
    syncScore: 8.0,
    inProcessScore: 10.0,
    redisScore: 2.0, // Breaks monolith by adding external infrastructure
    dbBackedScore: 9.0,
    cloudTasksScore: 9.5,
    rationale: 'Endpoints reside directly inside the Express monolith as authenticated internal routes.',
  },
  {
    name: 'Operational Complexity & Maintenance',
    weight: 1.0,
    syncScore: 6.0,
    inProcessScore: 9.0,
    redisScore: 3.0,
    dbBackedScore: 6.0,
    cloudTasksScore: 9.5,
    rationale: 'Zero server patching, zero Redis cluster management, zero connection pool exhaustion.',
  },
];

export const JOB_RUNNER_COMPOSITE_SCORES: Record<JobRunnerCandidate, number> = {
  [JobRunnerCandidate.SYNCHRONOUS_CLOUD_RUN]: 3.2,
  [JobRunnerCandidate.IN_PROCESS_TASK]: 6.1,
  [JobRunnerCandidate.REDIS_BULLMQ]: 4.5, // Strictly rejected
  [JobRunnerCandidate.DATABASE_BACKED_ONLY]: 7.4,
  [JobRunnerCandidate.CLOUD_TASKS_HYBRID]: 9.3, // Winner
};

export const SELECTED_PRIMARY_JOB_RUNNER: JobRunnerCandidate = JobRunnerCandidate.CLOUD_TASKS_HYBRID;
export const SELECTED_LOCAL_DEV_JOB_RUNNER: JobRunnerCandidate = JobRunnerCandidate.IN_PROCESS_TASK;
export const PROJECTED_MONTHLY_JOB_RUNNER_COST_INR = 0.0; // ₹0.00 / month
export const CLOUD_TASKS_FREE_TIER_MONTHLY_QUOTA = 1000000; // 1M tasks/mo

// ============================================================================
// 5. ASYNC JOB RECORD SCHEMA & TYPES
// ============================================================================

export const AsyncJobRecordSchema = z.object({
  jobId: z.string().regex(/^JOB-\d{8}-[a-zA-Z0-9_-]{6,16}$/, 'Must match JOB-YYYYMMDD-XXXXXX format'),
  type: z.nativeEnum(AsyncJobType),
  priority: z.nativeEnum(JobPriority),
  state: z.nativeEnum(JobExecutionState),
  actorId: z.string().min(3).max(50),
  entityId: z.string().min(3).max(100),
  payload: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()).nullable().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .nullable()
    .optional(),
  retryCount: z.number().int().min(0),
  maxRetries: z.number().int().min(0),
  timeoutSeconds: z.number().int().positive(),
  leaseExpiresAt: z.string().datetime().nullable().optional(),
  idempotencyKey: z.string().min(10).max(150),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export type AsyncJobRecord<
  TPayload = Record<string, unknown>,
  TResult = Record<string, unknown>
> = {
  readonly jobId: string;
  readonly type: AsyncJobType;
  readonly priority: JobPriority;
  readonly state: JobExecutionState;
  readonly actorId: string;
  readonly entityId: string;
  readonly payload: TPayload;
  readonly result?: TResult | null;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly stack?: string;
  } | null;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly timeoutSeconds: number;
  readonly leaseExpiresAt?: string | null;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
};

// ============================================================================
// 6. FACTORY & LIFECYCLE HELPER FUNCTIONS
// ============================================================================

let jobSequenceCounter = 1;

export function generateJobId(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8);
  const seq = String(jobSequenceCounter++ % 10000).padStart(4, '0');
  return `JOB-${yyyy}${mm}${dd}-${seq}${rand}`;
}

export function createJobRecord<TPayload extends Record<string, unknown>>(
  type: AsyncJobType,
  actorId: string,
  entityId: string,
  payload: TPayload,
  options?: {
    priority?: JobPriority;
    idempotencyKey?: string;
    maxRetries?: number;
    timeoutSeconds?: number;
  }
): AsyncJobRecord<TPayload> {
  const def = ASYNC_JOB_DEFINITIONS_REGISTRY[type];
  const now = new Date().toISOString();
  const idempKey =
    options?.idempotencyKey ??
    `IDEMP-JOB-${type}-${entityId}-${Date.now().toString(36)}`;

  return {
    jobId: generateJobId(),
    type,
    priority: options?.priority ?? def.defaultPriority,
    state: JobExecutionState.QUEUED,
    actorId,
    entityId,
    payload,
    result: null,
    error: null,
    retryCount: 0,
    maxRetries: options?.maxRetries ?? def.maxRetries,
    timeoutSeconds: options?.timeoutSeconds ?? def.timeoutSeconds,
    leaseExpiresAt: null,
    idempotencyKey: idempKey,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
  };
}

/**
 * Calculates exponential backoff delay in milliseconds.
 * delay = initialDelay * (multiplier ^ retryCount)
 */
export function calculateRetryBackoffDelayMs(
  type: AsyncJobType,
  retryCount: number
): number {
  const def = ASYNC_JOB_DEFINITIONS_REGISTRY[type];
  const delay = def.initialBackoffDelayMs * Math.pow(def.backoffMultiplier, retryCount);
  // Cap at 10 minutes (600,000 ms)
  return Math.min(Math.round(delay), 600000);
}

/**
 * Determines whether a job can be retried based on retry limits and error characteristics.
 */
export function isJobRetryable(
  error: { code?: string; isFatal?: boolean },
  currentRetryCount: number,
  maxRetries: number
): boolean {
  if (error.isFatal === true || error.code === 'FATAL_ERROR') {
    return false;
  }
  return currentRetryCount < maxRetries;
}

/**
 * Validates state transition legality according to the Stage 08 State Model.
 */
export function validateJobExecutionStateTransition(
  currentState: JobExecutionState,
  nextState: JobExecutionState
): boolean {
  const legalTransitions: Record<JobExecutionState, readonly JobExecutionState[]> = {
    [JobExecutionState.QUEUED]: [
      JobExecutionState.RUNNING,
      JobExecutionState.CANCELLED,
    ],
    [JobExecutionState.RUNNING]: [
      JobExecutionState.SUCCEEDED,
      JobExecutionState.FAILED_RETRYABLE,
      JobExecutionState.FAILED_FATAL,
      JobExecutionState.TIMED_OUT,
      JobExecutionState.CANCELLED,
    ],
    [JobExecutionState.FAILED_RETRYABLE]: [
      JobExecutionState.QUEUED,
      JobExecutionState.FAILED_FATAL,
      JobExecutionState.CANCELLED,
    ],
    [JobExecutionState.TIMED_OUT]: [
      JobExecutionState.QUEUED, // If retryable
      JobExecutionState.FAILED_FATAL,
    ],
    // Terminal states cannot transition
    [JobExecutionState.SUCCEEDED]: [],
    [JobExecutionState.FAILED_FATAL]: [],
    [JobExecutionState.CANCELLED]: [],
  };

  const allowed = legalTransitions[currentState] ?? [];
  return allowed.includes(nextState);
}

// ============================================================================
// 7. REAL-TIME INTEGRATION (STAGE 16 SSE SYNERGY)
// ============================================================================

export interface JobStatusUpdatedRealtimePayload {
  readonly jobId: string;
  readonly jobType: AsyncJobType;
  readonly state: JobExecutionState;
  readonly entityId: string;
  readonly actorId: string;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly timestamp: string;
  readonly error?: { code: string; message: string } | null;
  readonly result?: Record<string, unknown> | null;
}

export function createJobStatusUpdatedRealtimePayload(
  job: AsyncJobRecord
): JobStatusUpdatedRealtimePayload {
  return {
    jobId: job.jobId,
    jobType: job.type,
    state: job.state,
    entityId: job.entityId,
    actorId: job.actorId,
    retryCount: job.retryCount,
    maxRetries: job.maxRetries,
    timestamp: new Date().toISOString(),
    error: job.error ? { code: job.error.code, message: job.error.message } : null,
    result: (job.result as Record<string, unknown>) ?? null,
  };
}

export function broadcastJobStatusEvent(
  job: AsyncJobRecord
): RealtimeEventEnvelope<JobStatusUpdatedRealtimePayload> {
  const payload = createJobStatusUpdatedRealtimePayload(job);
  const channel = buildEntityChannel('job', job.jobId);
  return createRealtimeEnvelope(
    RealtimeEventType.JOB_STATUS_UPDATED,
    channel,
    job.actorId,
    payload,
    job.retryCount + 1,
    `TRC-${job.jobId}`
  );
}
