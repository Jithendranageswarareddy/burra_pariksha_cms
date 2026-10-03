# FEATURE CONTRACT: FC-017-BACKGROUND-JOB-QUEUE

## 1. Feature Identity
- **Feature ID**: FC-017
- **Feature Name**: Background Job Queue & Task Workers
- **Business Area**: Infrastructure / Asynchronous Task Execution
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Enabler)
- **Owner / Domain**: Async Infrastructure Context
- **Related Workflow Stage(s)**: Cross-cutting (Steps 05, 12, 13, 15)

---

## 2. Requirement
- **Business Requirement**: NFR-003 (Deterministic Concurrency) & NFR-006 (Zero Vendor Lock-in Async Architecture).
- **User Problem**: Long-running external tasks (video uploads, AI batch generation, metrics harvesting) block HTTP request threads, causing gateway timeouts (HTTP 504) and leaving operations in indeterminate states.
- **Business Purpose**: Provide a reliable asynchronous job execution engine supporting Cloud Tasks HTTP push queues with lease locking, idempotency keys, exponential retry backoff, and a dead letter queue (DLQ).
- **Expected Capability**:
  - `IJobQueue` interface supporting `enqueue(jobType, payload, options)`.
  - Firestore `jobs` collection tracking lifecycle: `QUEUED` $\to$ `RUNNING` $\to$ `COMPLETED` | `FAILED` $\to$ `DLQ`.
  - Lease-locking mechanism with heartbeat preventing duplicate execution.
  - Idempotency key checking ensuring each task runs at most once.
  - Secure Cloud Tasks worker endpoint: `POST /api/v1/jobs/worker/execute` protected by HMAC signature.
  - Dead Letter Queue (DLQ) alerting after 3 failed retry attempts.
- **Scope**: Job enqueueing, worker dispatching, lease locking, idempotency, retry lifecycle.
- **Explicit Non-Scope**: Specific job payload logic (handled in respective feature contracts).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Enqueueing an async job writes a `jobs` document with `status = QUEUED` and dispatches a Cloud Tasks push request.
  - Worker acquires lease, transitions job to `RUNNING`, executes payload, and marks `COMPLETED`.
  - Duplicate enqueue requests with the same `idempotencyKey` return existing job ID without duplicate execution.
- **Failure & Retry Acceptance**:
  - Worker failure applies exponential retry backoff ($10\text{s}, 60\text{s}, 300\text{s}$). If attempt $> 3$, job moves to `DLQ` and triggers admin notification.
- **Authorization Acceptance**:
  - Worker endpoint rejects requests without valid HMAC signature in `X-Worker-Signature` with HTTP 401.
- **Audit Acceptance**:
  - `JOB_ENQUEUED`, `JOB_COMPLETED`, and `JOB_DLQ_ROUTED` logged with job type, duration, and error context.

---

## 4. Domain Entities
- **Entities Involved**: `BackgroundJob`, `JobLease`, `JobRetryPolicy`, `DeadLetterEntry`.
- **Entity Ownership**: Async Infrastructure Context.
- **Relationships**: A `BackgroundJob` may reference a specific `WorkflowInstance` or content entity.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `jobType`, `idempotencyKey`, `createdAt`.
- **Mutable Fields**: `status`, `attempts`, `leaseOwner`, `leaseExpiresAt`, `lastError`, `resultPayload`.
- **Lifecycle**: `QUEUED` $\to$ `RUNNING` $\to$ `COMPLETED` | `FAILED` $\to$ `DLQ`.

---

## 5. Database / Data Contract
- **Collections Involved**: `jobs`, `jobs_dlq`.
- **Document Structure**:
  ```typescript
  export interface JobDocument extends BaseEntity {
    id: string; // job_ + UUIDv4
    jobType: 'DRIVE_SYNC' | 'PLATFORM_UPLOAD' | 'METRICS_HARVEST' | 'AI_PROPOSAL';
    idempotencyKey: string;
    payload: Record<string, unknown>;
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DLQ';
    attempts: number;
    maxAttempts: number;
    leaseOwner?: string;
    leaseExpiresAt?: string;
    lastError?: string;
    resultPayload?: Record<string, unknown>;
  }
  ```
- **Indexes**: Composite index on `(status, leaseExpiresAt ASC)` and `(idempotencyKey)`.
- **Source of Truth**: Firestore `jobs` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/jobs/worker/execute`
- **Authentication**: HMAC Header `X-Worker-Signature` (computed with `WORKER_SECRET`).
- **Request Schema**: `{ jobId: string, jobType: string }`.
- **Response Schema**: `ApiResponseEnvelope<{ status: 'COMPLETED' | 'RETRY_SCHEDULED' | 'DLQ' }>`.

### 6.2 `GET /api/v1/jobs/:id`
- **Authentication**: Required.
- **Required Capability**: `JOB_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ job: JobDocument }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/admin/jobs` (Job Monitor & DLQ Inspector).
- **Allowed Roles / Capabilities**: `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Live table of queued and running jobs with progress bars.
  - DLQ tab displaying failed jobs with stack traces and a "Retry Job" button.

---

## 8. RBAC / Capability Contract
- **`JOB_VIEW`**: View background job status.
- **`JOB_MANAGE`**: Manually retry or cancel jobs in DLQ.

---

## 9. Workflow Contract
- **Non-Blocking Rule**: Workflow transitions update `jobStatus = QUEUED` and return immediately. The job completes asynchronously and updates the orthogonal job status dimension.

---

## 10. Validation Contract
- **Idempotency Key**: Required for all enqueue calls (e.g. `upload_${packageId}_${version}`).

---

## 11. Error Contract
- `401 UNAUTHORIZED`: Worker signature verification failed.
- `409 CONFLICT`: Lease acquisition failed (job already being processed by another worker).

---

## 12. Audit Contract
- **Events**: `JOB_ENQUEUED`, `JOB_COMPLETED`, `JOB_FAILED_DLQ`.
- **Payload**: `jobId`, `jobType`, `attempts`, `executionDurationMs`.

---

## 13. Realtime Contract
- **SSE Event**: `job.status_updated` broadcast to inform client of async task completion.

---

## 14. Job / Async Contract
- Self-referential: Implements the async execution infrastructure.

---

## 15. AI Contract
- **Applicable**: FC-019 enqueues `AI_PROPOSAL` jobs through this queue.

---

## 16. Media Contract
- **Applicable**: FC-010 and FC-016 enqueue `DRIVE_SYNC` and `PLATFORM_UPLOAD` jobs here.

---

## 17. Analytics Contract
- **Applicable**: FC-020 enqueues periodic `METRICS_HARVEST` jobs here.

---

## 18. Security Contract
- **HMAC Signatures**: Worker endpoint validates SHA-256 HMAC of request body against shared secret.

---

## 19. Observability Contract
- **Metrics**: Counter `jobs.enqueued_total`, `jobs.dlq_total`, histogram `jobs.duration_seconds`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Google Cloud Tasks free tier covers 1,000,000 tasks/month. BP-CMS consumes $< 5,000$ tasks/month.

---

## 21. Migration Contract
- **Legacy Parity**: Replaces unreliable Google Apps Script time-based triggers.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-JOB-01`: Idempotency key deduplication prevents double enqueue.
  - `TC-JOB-02`: Lease locking prevents split-brain execution across workers.
  - `TC-JOB-03`: Exponential backoff and DLQ routing on 3rd failure.
- **API Tests**:
  - `TC-JOB-04`: Worker rejects invalid HMAC signature.
  - `TC-JOB-05`: Worker processes job and marks completed.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-004.
- **Stage 25 Node**: `D-25 (Background Jobs)`.
- **Downstream Consumers**: FC-016 (Upload Worker), FC-019 (AI Pipeline), FC-020 (Analytics Harvester).

---

## 24. Implementation Sequence
1. Define Job schemas (`src/types/jobs.ts`).
2. Implement Cloud Tasks adapter and in-memory test queue (`src/lib/jobs/`).
3. Implement `JobService` with lease locking and idempotency verification.
4. Implement `/api/v1/jobs/worker/execute` route handler.
5. Build React Job Monitor UI (`src/pages/admin/JobMonitorPage.tsx`).
6. Verify against `TC-JOB-01..05`.

---

## 25. Deployment Contract
- **Required Secrets**: `WORKER_SECRET` (in GCP Secret Manager).
- **Required Env Vars**: `CLOUD_TASKS_QUEUE_NAME`, `CLOUD_TASKS_LOCATION`.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Queued jobs in Firestore remain safe.

---

## 27. Feature Completion Criteria
- [ ] In-memory and Cloud Tasks queue adapters tested.
- [ ] Idempotency key deduplication verified.
- [ ] Lease locking proven under concurrent simulation.
- [ ] DLQ transition verified on failure.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 12, 13, 17, and 22.

---

## 29. Traceability
- **Stage 01**: NFR-003, NFR-006
- **Stage 04**: Async Invariant P-08
- **Stage 13**: `jobs`, `jobs_dlq` schemas
- **Stage 15**: `/api/v1/jobs/*`
- **Stage 17**: Authoritative Job & Async Architecture
- **Stage 22**: Cloud Tasks 1M Free Tier
- **Stage 25**: Node `D-25`
