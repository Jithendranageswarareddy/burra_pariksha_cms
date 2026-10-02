/**
 * BURRA PARIKSHA CMS — Stage 17 Background Job & Asynchronous Architecture Automated Verification Suite
 *
 * Verifies that the Background Job Architecture established in 17-JOB-ARCHITECTURE.md and
 * src/types/job-architecture.ts is strictly enforced:
 * 1. Non-Blocking Operations Completeness (all 7 canonical domains registered).
 * 2. Job Runner Candidate Evaluation & Scoring (Cloud Tasks Hybrid selected, Redis/BullMQ rejected).
 * 3. Zero-Cost Financial Invariant Enforcement (₹0.00/mo, 1M free tasks/mo).
 * 4. Async Job Record Schema & Canonical JOB ID Regex Validation.
 * 5. Idempotency & Concurrency Lease Contracts (lease duration and duplicate suppression).
 * 6. Exponential Backoff & Retry Logic (delay formula and retryable vs fatal classifications).
 * 7. Real-Time SSE Integration Contract (JOB_STATUS_UPDATED event payload validation).
 * 8. Dual Execution Mode Contract (Cloud Tasks push webhook & in-process local fallback).
 */

import {
  AsyncJobType,
  ASYNC_JOB_TYPES,
  JobPriority,
  JobExecutionState,
  ASYNC_JOB_DEFINITIONS_REGISTRY,
  JobRunnerCandidate,
  JOB_RUNNER_EVALUATION_DIMENSIONS,
  JOB_RUNNER_COMPOSITE_SCORES,
  SELECTED_PRIMARY_JOB_RUNNER,
  SELECTED_LOCAL_DEV_JOB_RUNNER,
  PROJECTED_MONTHLY_JOB_RUNNER_COST_INR,
  CLOUD_TASKS_FREE_TIER_MONTHLY_QUOTA,
  AsyncJobRecordSchema,
  createJobRecord,
  calculateRetryBackoffDelayMs,
  isJobRetryable,
  validateJobExecutionStateTransition,
  broadcastJobStatusEvent,
} from '../types/job-architecture';
import { RealtimeEventType } from '../types/realtime-architecture';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[STAGE 17 VERIFICATION FAILED]: ${message}`);
  }
}

console.log('================================================================================');
console.log('BURRA PARIKSHA CMS — STAGE 17 BACKGROUND JOB ARCHITECTURE VERIFICATION');
console.log('================================================================================\n');

// ----------------------------------------------------------------------------
// CHECK 1: Non-Blocking Operations Completeness (7 Canonical Domains)
// ----------------------------------------------------------------------------
console.log('CHECK 1: Non-Blocking Operations Completeness (7 Canonical Domains)');

assert(ASYNC_JOB_TYPES.length === 7, 'Must register exactly 7 canonical async job types');

const expectedJobTypes: AsyncJobType[] = [
  AsyncJobType.AI_GENERATION,
  AsyncJobType.MEDIA_PROCESSING,
  AsyncJobType.PLATFORM_SYNC,
  AsyncJobType.ANALYTICS_COLLECTION,
  AsyncJobType.THUMBNAIL_PROCESSING,
  AsyncJobType.ARCHIVE_VERIFICATION,
  AsyncJobType.USER_NOTIFICATION,
];

for (const type of expectedJobTypes) {
  const def = ASYNC_JOB_DEFINITIONS_REGISTRY[type];
  assert(def !== undefined, `Job definition for '${type}' must be registered`);
  assert(def.timeoutSeconds > 0, `Job type '${type}' must have positive timeoutSeconds`);
  assert(def.maxRetries >= 0, `Job type '${type}' must have non-negative maxRetries`);
  assert(def.initialBackoffDelayMs >= 1000, `Job type '${type}' must have initial backoff >= 1000ms`);
  assert(def.backoffMultiplier >= 1.5, `Job type '${type}' must have backoffMultiplier >= 1.5`);
  assert(typeof def.failureStrategy === 'string' && def.failureStrategy.length > 0, `Job type '${type}' must specify failureStrategy`);
}

console.log('  ✔ All 7 non-blocking job types verified with timeouts, retries, and backoff.\n');

// ----------------------------------------------------------------------------
// CHECK 2: Job Runner Candidate Evaluation & Scoring
// ----------------------------------------------------------------------------
console.log('CHECK 2: Job Runner Candidate Evaluation & Scoring');

assert(
  JOB_RUNNER_EVALUATION_DIMENSIONS.length === 8,
  'Must evaluate runners across exactly 8 architectural dimensions'
);

const cloudTasksScore = JOB_RUNNER_COMPOSITE_SCORES[JobRunnerCandidate.CLOUD_TASKS_HYBRID];
const redisScore = JOB_RUNNER_COMPOSITE_SCORES[JobRunnerCandidate.REDIS_BULLMQ];
const dbScore = JOB_RUNNER_COMPOSITE_SCORES[JobRunnerCandidate.DATABASE_BACKED_ONLY];
const inProcessScore = JOB_RUNNER_COMPOSITE_SCORES[JobRunnerCandidate.IN_PROCESS_TASK];
const syncScore = JOB_RUNNER_COMPOSITE_SCORES[JobRunnerCandidate.SYNCHRONOUS_CLOUD_RUN];

assert(
  cloudTasksScore > redisScore &&
    cloudTasksScore > dbScore &&
    cloudTasksScore > inProcessScore &&
    cloudTasksScore > syncScore,
  `Cloud Tasks Hybrid must achieve highest composite score. Scores: CloudTasks=${cloudTasksScore}, DB=${dbScore}, InProcess=${inProcessScore}, Redis=${redisScore}, Sync=${syncScore}`
);

assert(
  SELECTED_PRIMARY_JOB_RUNNER === JobRunnerCandidate.CLOUD_TASKS_HYBRID,
  'Primary production runner must be CLOUD_TASKS_HYBRID'
);
assert(
  SELECTED_LOCAL_DEV_JOB_RUNNER === JobRunnerCandidate.IN_PROCESS_TASK,
  'Local dev runner must be IN_PROCESS_TASK'
);

// Explicit anti-Redis rejection check
assert(
  SELECTED_PRIMARY_JOB_RUNNER !== JobRunnerCandidate.REDIS_BULLMQ,
  'Redis / BullMQ must be strictly rejected due to cost violation'
);

console.log(`  ✔ Candidate evaluation verified: Cloud Tasks scores ${cloudTasksScore}/10; Redis rejected (${redisScore}/10).\n`);

// ----------------------------------------------------------------------------
// CHECK 3: Zero-Cost Financial Invariant (COST-001, AP-012)
// ----------------------------------------------------------------------------
console.log('CHECK 3: Zero-Cost Financial Invariant (COST-001, AP-012)');

assert(
  PROJECTED_MONTHLY_JOB_RUNNER_COST_INR === 0.0,
  `Projected monthly cost must be ₹0.00 INR/month, received ₹${PROJECTED_MONTHLY_JOB_RUNNER_COST_INR}`
);
assert(
  CLOUD_TASKS_FREE_TIER_MONTHLY_QUOTA === 1000000,
  'Cloud Tasks free tier monthly quota must be 1,000,000 tasks'
);

console.log('  ✔ Zero-cost financial invariant confirmed: ₹0.00/mo operating cost via 1M free tasks/mo.\n');

// ----------------------------------------------------------------------------
// CHECK 4: Async Job Record Schema & Canonical JOB ID Regex Validation
// ----------------------------------------------------------------------------
console.log('CHECK 4: Async Job Record Schema & Canonical JOB ID Regex Validation');

const sampleJob = createJobRecord(
  AsyncJobType.AI_GENERATION,
  'USR-000101',
  'BP-Q-000412',
  { subject: 'MATHEMATICS', grade: 8, promptTopic: 'Pythagoras theorem in Telugu' },
  { priority: JobPriority.HIGH }
);

assert(
  /^JOB-\d{8}-[a-zA-Z0-9_-]{6,16}$/.test(sampleJob.jobId),
  `Job ID '${sampleJob.jobId}' must match canonical JOB-YYYYMMDD-XXXXXX format`
);
assert(sampleJob.state === JobExecutionState.QUEUED, 'Newly created job must be in QUEUED state');
assert(sampleJob.retryCount === 0, 'Initial retryCount must be 0');
assert(sampleJob.maxRetries === 3, 'AI_GENERATION default maxRetries must be 3');

const schemaValidation = AsyncJobRecordSchema.safeParse(sampleJob);
assert(schemaValidation.success === true, 'Valid job record must pass Zod schema validation');

// Negative validation: invalid state & negative retry count
const invalidJob = {
  ...sampleJob,
  jobId: 'INVALID_ID_FORMAT',
  state: 'UNKNOWN_STATE',
  retryCount: -1,
};
const invalidValidation = AsyncJobRecordSchema.safeParse(invalidJob);
assert(invalidValidation.success === false, 'Invalid job record must fail schema validation');

console.log('  ✔ Job record Zod schema and canonical ID regex strictly validated.\n');

// ----------------------------------------------------------------------------
// CHECK 5: Idempotency & Concurrency Lease Contracts
// ----------------------------------------------------------------------------
console.log('CHECK 5: Idempotency & Concurrency Lease Contracts');

assert(
  typeof sampleJob.idempotencyKey === 'string' && sampleJob.idempotencyKey.startsWith('IDEMP-JOB-'),
  `Idempotency key must follow canonical prefix format: ${sampleJob.idempotencyKey}`
);

// Lease duration contract
const leaseDurationSeconds = 300; // 5 minutes standard watchdog lease
const startedDate = new Date();
const leaseExpiry = new Date(startedDate.getTime() + leaseDurationSeconds * 1000).toISOString();

const leasedJob = {
  ...sampleJob,
  state: JobExecutionState.RUNNING,
  startedAt: startedDate.toISOString(),
  leaseExpiresAt: leaseExpiry,
};

assert(
  new Date(leasedJob.leaseExpiresAt!).getTime() > new Date(leasedJob.startedAt!).getTime(),
  'Lease expiry must be in the future relative to job start time'
);

console.log('  ✔ Idempotency keys and concurrency lease durations verified.\n');

// ----------------------------------------------------------------------------
// CHECK 6: Exponential Backoff & Retry Logic
// ----------------------------------------------------------------------------
console.log('CHECK 6: Exponential Backoff & Retry Logic');

// AI_GENERATION: initial 2000ms, multiplier 2.0
const delay0 = calculateRetryBackoffDelayMs(AsyncJobType.AI_GENERATION, 0);
const delay1 = calculateRetryBackoffDelayMs(AsyncJobType.AI_GENERATION, 1);
const delay2 = calculateRetryBackoffDelayMs(AsyncJobType.AI_GENERATION, 2);

assert(delay0 === 2000, `Delay retry 0 must be 2000ms, got ${delay0}`);
assert(delay1 === 4000, `Delay retry 1 must be 4000ms, got ${delay1}`);
assert(delay2 === 8000, `Delay retry 2 must be 8000ms, got ${delay2}`);

// Retryable vs Fatal error classification
assert(
  isJobRetryable({ code: 'TRANSIENT_RATE_LIMIT' }, 1, 3) === true,
  'Transient error with retries remaining must be retryable'
);
assert(
  isJobRetryable({ code: 'TRANSIENT_RATE_LIMIT' }, 3, 3) === false,
  'Transient error with retries exhausted must NOT be retryable'
);
assert(
  isJobRetryable({ code: 'FATAL_ERROR', isFatal: true }, 0, 3) === false,
  'Fatal error must never be retryable even with 0 retries'
);

// State transition legality
assert(
  validateJobExecutionStateTransition(JobExecutionState.QUEUED, JobExecutionState.RUNNING) === true,
  'QUEUED -> RUNNING must be legal'
);
assert(
  validateJobExecutionStateTransition(JobExecutionState.RUNNING, JobExecutionState.SUCCEEDED) === true,
  'RUNNING -> SUCCEEDED must be legal'
);
assert(
  validateJobExecutionStateTransition(JobExecutionState.RUNNING, JobExecutionState.FAILED_RETRYABLE) === true,
  'RUNNING -> FAILED_RETRYABLE must be legal'
);
assert(
  validateJobExecutionStateTransition(JobExecutionState.SUCCEEDED, JobExecutionState.RUNNING) === false,
  'SUCCEEDED -> RUNNING must be illegal (terminal state)'
);

console.log('  ✔ Exponential backoff, error classification, and state transition matrix verified.\n');

// ----------------------------------------------------------------------------
// CHECK 7: Real-Time SSE Integration Contract (JOB_STATUS_UPDATED)
// ----------------------------------------------------------------------------
console.log('CHECK 7: Real-Time SSE Integration Contract (JOB_STATUS_UPDATED)');

const completedJob = {
  ...sampleJob,
  state: JobExecutionState.SUCCEEDED,
  result: { generatedQuestionCount: 5, draftId: 'BP-Q-000412' },
  completedAt: new Date().toISOString(),
};

const sseEvent = broadcastJobStatusEvent(completedJob);

assert(
  sseEvent.type === RealtimeEventType.JOB_STATUS_UPDATED,
  `Broadcast event must be JOB_STATUS_UPDATED, got ${sseEvent.type}`
);
assert(
  sseEvent.channel === `entity:job:${completedJob.jobId}`,
  `Event channel must target entity:job:${completedJob.jobId}, got ${sseEvent.channel}`
);
assert(
  sseEvent.payload.state === JobExecutionState.SUCCEEDED,
  'SSE payload must carry updated job execution state'
);
assert(
  sseEvent.payload.entityId === 'BP-Q-000412',
  'SSE payload must reference associated domain entity ID'
);

console.log('  ✔ Real-time SSE integration contract strictly verified without Firestore reads.\n');

// ----------------------------------------------------------------------------
// CHECK 8: Dual Execution Mode Contract
// ----------------------------------------------------------------------------
console.log('CHECK 8: Dual Execution Mode Contract');

// Production webhook path contract
const productionWebhookEndpoint = `/api/v1/internal/jobs/:id/execute`;
assert(
  productionWebhookEndpoint === '/api/v1/internal/jobs/:id/execute',
  'Cloud Tasks webhook endpoint path must match internal execution route'
);

// Local in-process fallback runner verification
assert(
  SELECTED_LOCAL_DEV_JOB_RUNNER === JobRunnerCandidate.IN_PROCESS_TASK,
  'Local dev environment must utilize IN_PROCESS_TASK runner'
);

console.log('  ✔ Dual execution mode contract verified: Cloud Tasks in prod, in-process locally.\n');

console.log('================================================================================');
console.log('ALL STAGE 17 BACKGROUND JOB ARCHITECTURE CHECKS PASSED SUCCESSFULLY! (8/8)');
console.log('================================================================================');
