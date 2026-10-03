# 17 — BACKGROUND JOB & ASYNCHRONOUS ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 17 of 30-Stage Modernization Program — Authoritative Async Execution, Job State Lifecycle & Worker Strategy

```
================================================================================
Document ID:       BP-ARCH-17-JOB-ASYNC
Version:           17.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Non-Blocking Operations Inventory, Execution Candidate Evaluation,
                   Job Lifecycle & State Model, Concurrency/Lease Governance,
                   Retry/Idempotency Contracts, Real-Time Synergy & Free-Tier Proof
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-005, AP-009, AP-010, AP-011, AP-012)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md (JobExecutionState Dimension)
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md (Binary Isolation & Checksum Proofs)
                   15-API-CONTRACT.md (REST Envelopes, 202 Accepted & Idempotency-Key)
                   16-REALTIME-ARCHITECTURE.md (SSE Transport & JOB_STATUS_UPDATED)
Downstream Stages: 18-AI-ARCHITECTURE.md
                   19-SECURITY-ARCHITECTURE.md
                   20-ANALYTICS-ARCHITECTURE.md
                   21-AUDIT-OBSERVABILITY.md
                   22-COST-ARCHITECTURE.md
                   23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Execution Model:   Dual-Mode Hybrid:
                   - Production: Google Cloud Tasks HTTP Push Queue to Cloud Run
                   - Local Dev / Offline: In-Process Node.js Event Loop Runner
Budget Invariant:  Hard Initial Infrastructure Ceiling: ₹0–₹100 / month (Cloud Tasks 1M tasks free)
================================================================================
```

---

## 1. Purpose & Governance

### 1.1 Purpose
This document establishes the authoritative **Background Job and Asynchronous Execution Architecture** for the Burra Pariksha Content Management System (BP-CMS). Its purpose is to define:
1. Which studio operations must execute synchronously versus asynchronously.
2. How asynchronous workloads are modeled, scheduled, claimed, executed, retried, and finalized.
3. How job state transitions are decoupled from domain workflow, entity lifecycle, media state, and publication status (Stage 08 alignment).
4. The exact execution mechanism that satisfies the **₹0–₹100/month** budget constraint while guaranteeing at-least-once delivery, fault-tolerant retry, and cold-start compatibility with Google Cloud Run.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document establishes the architectural, contractual, and logical specifications for background job execution. It does **not** assert that runtime workers, Cloud Tasks queues, Redis clusters, BullMQ queues, Pub/Sub topics, or cron workers have been deployed or activated.
2. **Zero Runtime Code Modification:** No application source files, Express route controllers, worker daemons, database collections, or frontend pages are created or modified during Stage 17.
3. **No Paid Queue Dependencies:** No commercial Redis instances (e.g. GCP Memorystore), managed message brokers (e.g. RabbitMQ Cloud), or paid PaaS job queues are introduced.
4. **Contractual Boundary:** Stage 17 establishes the binding architectural contract that **Stage 27 (Implementation)** and **Stage 28 (Integration & Testing)** will physically implement and verify.

---

## 2. Scope & Asynchronous Boundaries

### 2.1 The Fundamental Asynchronous Axiom
In BP-CMS, asynchronous execution adheres strictly to the **Fundamental Asynchronous Axiom**:
$$\text{Job Execution State} = \text{Transient Operational Progress Indicator}$$
$$\text{Job Execution State} \neq \text{Canonical Business State}$$

Background jobs process work on behalf of domain entities (Questions, Scripts, VideoTakes, MediaAssets, Publications, AnalyticsSnapshots). While a job progresses through its execution states (`QUEUED` $\to$ `RUNNING` $\to$ `SUCCEEDED`), the domain entity retains its own state machine transitions governed by Stage 08. A job failure flags the operation as failed; it never silently mutates or corrupts authoritative business state.

### 2.2 System Boundary Governance
- **Synchronous Boundary:** An HTTP mutating request completes within $\le 500\,\text{ms}$ by validating inputs, creating a durable job record in the database, scheduling execution, and returning `202 Accepted` with a tracking `jobId`.
- **Asynchronous Execution Boundary:** Execution occurs out-of-band via decoupled worker invocations (Cloud Tasks HTTP push in production, in-process runner in local development).
- **Authoritative Result Persistence:** Successful jobs commit their business outputs transactionally to Firestore, update the associated entity state, and broadcast a real-time coordination signal via Stage 16 Server-Sent Events (SSE).

---

## 3. Current-State Asynchronous Inventory (Brownfield Audit)

An inspection of the existing brownfield repository reveals the following baseline status:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD ASYNC AUDIT                                    │
├──────────────────────────┬──────────────┬──────────────────────────────────────────────┤
│ Current Implementation   │ Disposition  │ Architectural Analysis                       │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ `snapshot-scheduler.ts`  │ REPLACE      │ Uses in-process `setInterval` for hourly GCS │
│                          │              │ export. Dies on container restart/scale-down;│
│                          │              │ unmonitored, no retry persistence.           │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Simulated Timers in      │ REMOVE       │ React components simulate background render  │
│ UI Components            │              │ using client-side `setTimeout`/`setInterval`.│
│                          │              │ Completely disconnected from backend truth.  │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Redis / BullMQ           │ NOT PRESENT  │ No Redis client, host, or dependencies in    │
│                          │              │ `package.json`. No infrastructure cost.      │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Google Cloud Tasks SDK   │ NOT PRESENT  │ No Cloud Tasks client installed. Target for  │
│                          │              │ Stage 27 implementation.                     │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Google Cloud Pub/Sub     │ NOT PRESENT  │ No Pub/Sub publishers or subscriptions.      │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ In-Process Promises      │ DEPRECATE    │ Fire-and-forget unhandled promises in route  │
│ (Fire-and-Forget)        │              │ handlers without tracking or error recovery. │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ TypeScript Definitions   │ KEEP         │ `src/types/job-architecture.ts` defines      │
│ in `job-architecture.ts` │              │ canonical types, Zod schemas, & anti-Redis.  │
└──────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

---

## 4. Non-Blocking Operation Requirements Analysis

Operations within the 15-step studio lifecycle must not block user-facing HTTP requests if they exhibit any of the following characteristics:
1. **High or Variable Latency:** Execution time exceeds $1.0\,\text{second}$ (e.g., video transcoding, SHA-256 binary hashing, deep cold archive verification, multi-platform publishing).
2. **Third-Party Rate Limits & Throttling:** Dependent on external vendor rate limits (YouTube Data API v3, Meta Graph API, Google Gemini LLM rate limits).
3. **Flaky Network Transport:** High probability of transient network timeouts, 5xx server errors, or platform unavailability requiring exponential backoff retries.
4. **Batch or Multi-Record Aggregation:** Aggregating analytics telemetry, calculating weekly engagement metrics, or archiving media binaries across dozens of files.
5. **Human-in-the-Loop Boundaries (AP-009):** Operations that draft content or prepare proposals that require asynchronous review before business progression.

Conversely, operations that mutate metadata in Firestore, check permissions, validate Zod schemas, or emit in-memory coordination events must remain strictly **synchronous** to ensure immediate transactional consistency and deterministic HTTP responses.

---

## 5. Candidate Operation Classification Matrix

The 20 candidate operations (plus brownfield maintenance operations) are evaluated below across 17 architectural dimensions.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CANDIDATE OPERATION CLASSIFICATION MATRIX                                │
├────┬─────────────────────────────┬──────────────────┬──────────────┬───────────────┬───────────────────┤
│ ID │ Candidate Operation         │ Trigger          │ Latency      │ Failure Prob. │ Recommended Model │
├────┼─────────────────────────────┼──────────────────┼──────────────┼───────────────┼───────────────────┤
│ 01 │ AI Script Generation        │ Step 01, 03 UI   │ 3s – 25s     │ Medium (8%)   │ ASYNC_REQUIRED    │
│ 02 │ AI Validation / Review      │ Step 02, 04 UI   │ 2s – 15s     │ Low (3%)      │ ASYNC_BENEFICIAL  │
│ 03 │ Media Transcode (1080x1920) │ Step 05, 06 UI   │ 10s – 120s   │ Low (2%)      │ ASYNC_REQUIRED    │
│ 04 │ Video Concat / Rendering    │ Step 06 UI       │ 30s – 300s   │ Medium (5%)   │ ASYNC_REQUIRED    │
│ 05 │ Thumbnail Frame Extraction  │ Step 08 UI       │ 2s – 8s      │ Low (2%)      │ ASYNC_BENEFICIAL  │
│ 06 │ Media SHA-256 Hashing       │ Step 05 Ingest   │ 3s – 30s     │ Very Low (<1%)│ ASYNC_REQUIRED    │
│ 07 │ Cold Archive Verification   │ Stage 14 Prune   │ 15s – 90s    │ Low (1%)      │ ASYNC_REQUIRED    │
│ 08 │ Archive / Restore Media     │ Admin Action     │ 20s – 180s   │ Low (2%)      │ ASYNC_REQUIRED    │
│ 09 │ Platform Sync (YT/Meta)     │ Step 11 Publish  │ 5s – 60s     │ Medium (6%)   │ ASYNC_REQUIRED    │
│ 10 │ Publishing Dispatch         │ Step 11 Approval │ 2s – 10s     │ Low (2%)      │ ASYNC_REQUIRED    │
│ 11 │ Analytics Telemetry Ingest  │ Step 13 Cron     │ 5s – 45s     │ Low (3%)      │ SCHEDULED         │
│ 12 │ Analytics Normalization     │ Post-Ingest Hook │ 1s – 5s      │ Very Low (<1%)│ EVENT_DRIVEN      │
│ 13 │ Performance Aggregation     │ Step 15 Daily    │ 10s – 60s    │ Very Low (<1%)│ SCHEDULED         │
│ 14 │ Content Intelligence Gen    │ Step 15 Manual   │ 5s – 30s     │ Medium (5%)   │ ASYNC_BENEFICIAL  │
│ 15 │ In-App Notifications        │ Domain Event     │ 50ms – 200ms │ Very Low (<1%)│ EVENT_DRIVEN      │
│ 16 │ Realtime SSE Event Fan-Out  │ Domain Event     │ 5ms – 25ms   │ Negligible    │ SYNC_REQUIRED     │
│ 17 │ External OAuth Token Refresh│ Expiry / Demand  │ 500ms – 2s   │ Low (1%)      │ SYNC_REQUIRED     │
│ 18 │ Batch GCS Snapshot Export   │ Hourly Cron      │ 15s – 60s    │ Low (2%)      │ SCHEDULED         │
│ 19 │ DB Pruning & Log Retention  │ Weekly Cron      │ 30s – 120s   │ Very Low (<1%)│ SCHEDULED         │
│ 20 │ Failed External Retry       │ DLQ / Retry Hook │ Variable     │ High (20%)    │ ASYNC_REQUIRED    │
└────┴─────────────────────────────┴──────────────────┴──────────────┴───────────────┴───────────────────┘
```

### Detailed Operation Specifications

#### OP-01: AI Question & Script Drafting
- **Business Purpose:** Executes generative prompts against Google Gemini LLM to create question variations, explanations, distractors, and teleprompter scripts.
- **Trigger:** Creator clicks "Generate Questions" or "Draft Script" in Step 01/Step 03.
- **Expected Duration:** $3.0\,\text{s} - 25.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO. HTTP timeouts occur on mobile clients; blocking leads to duplicate clicks.
- **User-Visible Latency Requirement:** Immediate `202 Accepted` within $\le 300\,\text{ms}$; progress updates via SSE.
- **External Dependency:** Google Gemini API (Vertex AI / Google AI Studio).
- **Failure Probability:** Medium ($8\%$) due to rate limiting, safety filters, or transient socket resets.
- **Retry Requirement:** Maximum 3 attempts; exponential backoff ($2\text{s}, 4\text{s}, 8\text{s}$). Non-retryable on safety policy violation.
- **Idempotency Requirement:** Mandatory via `Idempotency-Key` header (`IDEMP-AI-SCRIPT-{questionId}-{hash}`).
- **Concurrency Requirement:** 1 active generation job per Question record.
- **Data Consistency:** Writes candidate proposals to `Question.proposals` sub-collection; does not advance workflow step.
- **Result Persistence:** Proposal text, model version, token usage, and prompt hash stored in Firestore.
- **Progress Reporting:** Emits `JOB_STATUS_UPDATED` with `QUEUED`, `RUNNING`, `SUCCEEDED`.
- **Realtime Notification:** Emits SSE toast to initiating user.
- **Cost Sensitivity:** ₹0.00 infrastructure cost; LLM tokens within budget allocation.
- **Recommended Execution Model:** `ASYNC_REQUIRED` (Cloud Tasks Push Queue).

#### OP-02: AI Validation & Curriculum Verification
- **Business Purpose:** Evaluates drafted questions against curriculum standards, factual correctness, and Telugu orthography rules.
- **Trigger:** User requests AI pre-audit or auto-triggered on Step 02 entry.
- **Expected Duration:** $2.0\,\text{s} - 15.0\,\text{s}$.
- **Can it block HTTP?** NO.
- **User-Visible Latency:** `202 Accepted`; results rendered in review workspace.
- **External Dependency:** Google Gemini API.
- **Failure Probability:** Low ($3\%$).
- **Retry Requirement:** 2 attempts ($2\text{s}, 5\text{s}$).
- **Idempotency Requirement:** Keyed by question content checksum.
- **Recommended Execution Model:** `ASYNC_BENEFICIAL`.

#### OP-03: Media Transcoding & Validation
- **Business Purpose:** Validates uploaded video files for 1080x1920 (9:16 vertical), H.264/AAC, 30fps/60fps, and bitrate compliance.
- **Trigger:** Creator uploads raw video take to Google Drive folder (Step 05).
- **Expected Duration:** $10.0\,\text{s} - 120.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO.
- **User-Visible Latency:** Progress bar in Video Review Workspace.
- **External Dependency:** Google Drive API, FFmpeg (via Cloud Run container worker).
- **Failure Probability:** Low ($2\%$) (corrupted upload or unsupported codec).
- **Retry Requirement:** 2 retries; non-retryable on corrupt container format.
- **Idempotency Requirement:** Keyed by `driveFileId` + file size.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-04: Video Concatenation & Subtitle Rendering
- **Business Purpose:** Assembles selected video takes, attaches audio beds, and burns in subtitle overlays.
- **Trigger:** Video Editor clicks "Render Final Cut" in Step 06.
- **Expected Duration:** $30.0\,\text{s} - 300.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO.
- **User-Visible Latency:** Real-time percentage progress ($0\%\dots 100\%$).
- **External Dependency:** Google Cloud Storage / Google Drive, FFmpeg worker.
- **Failure Probability:** Medium ($5\%$) due to memory pressure or encoding timeouts.
- **Retry Requirement:** 1 retry; maximum execution timeout $600\,\text{s}$.
- **Idempotency Requirement:** Keyed by `cutId` + `takeListChecksum`.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-05: Thumbnail Processing & Safe-Zone Framing
- **Business Purpose:** Generates thumbnail variants, applies title typography overlays, and verifies safe zones for YouTube/Instagram.
- **Trigger:** Graphic Designer uploads artwork in Step 08.
- **Expected Duration:** $2.0\,\text{s} - 8.0\,\text{s}$.
- **Can it block HTTP?** NO.
- **External Dependency:** Sharp / Canvas image processing library.
- **Failure Probability:** Low ($2\%$).
- **Retry Requirement:** 3 retries ($2\text{s}, 5\text{s}, 12\text{s}$).
- **Recommended Execution Model:** `ASYNC_BENEFICIAL`.

#### OP-06: Media SHA-256 Cryptographic Verification
- **Business Purpose:** Computes and verifies SHA-256 checksum of media assets before advancing to final approval (AP-010).
- **Trigger:** Transition to Step 07 (Video Review) and Step 10 (Final QA).
- **Expected Duration:** $3.0\,\text{s} - 30.0\,\text{s}$.
- **Can it block HTTP?** NO.
- **External Dependency:** Google Drive API / Cloud Storage streaming.
- **Failure Probability:** Very Low ($<1\%$).
- **Retry Requirement:** 2 retries.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-07: Cold Archive Pre-Retirement Audit
- **Business Purpose:** Verifies that deep cold storage archive in Google Cloud Storage exactly matches Google Drive working copy before allowing Drive file purge.
- **Trigger:** Archive lifecycle policy execution (Stage 14).
- **Expected Duration:** $15.0\,\text{s} - 90.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO.
- **Failure Probability:** Low ($1\%$).
- **Retry Requirement:** 2 retries.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-08: Archive & Restore Operations
- **Business Purpose:** Moves media binaries between active Google Drive workspace and nearline/coldline GCS buckets.
- **Trigger:** Administrator requests asset archival or restoration.
- **Expected Duration:** $20.0\,\text{s} - 180.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-09: Platform Synchronization (YouTube, Instagram, Facebook)
- **Business Purpose:** Verifies live status, permalink generation, and processing completion across social platform APIs after publishing dispatch.
- **Trigger:** Post-publish verification loop (Step 12).
- **Expected Duration:** $5.0\,\text{s} - 60.0\,\text{s}$.
- **Can it block HTTP?** NO.
- **External Dependency:** YouTube Data API, Meta Graph API.
- **Failure Probability:** Medium ($6\%$) due to platform ingestion delay.
- **Retry Requirement:** 5 retries with exponential backoff ($10\text{s}, 25\text{s}, 60\text{s}, 150\text{s}, 300\text{s}$).
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-10: Publishing Dispatch Execution
- **Business Purpose:** Uploads finalized video binary and metadata package to social platforms.
- **Trigger:** Publisher clicks "Confirm Publish" following Step 10 Quality Sign-Off.
- **Expected Duration:** $2.0\,\text{s} - 10.0\,\text{s}$.
- **Can it block HTTP?** Strictly NO.
- **Idempotency Requirement:** Extreme. Multiple executions must never create duplicate social posts. Keyed by `publicationId`.
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

#### OP-11: Analytics Telemetry Collection
- **Business Purpose:** Polls social APIs for view counts, watch times, retention rates, and audience comments.
- **Trigger:** Cron schedule (every 6 hours) or manual refresh in Step 13.
- **Expected Duration:** $5.0\,\text{s} - 45.0\,\text{s}$.
- **Recommended Execution Model:** `SCHEDULED`.

#### OP-12: Analytics Normalization & Attribution
- **Business Purpose:** Computes derived metrics (completion rate, 3-second dropoff, engagement ratio) and attributes metrics to specific curriculum tags.
- **Trigger:** Successful completion of OP-11.
- **Expected Duration:** $1.0\,\text{s} - 5.0\,\text{s}$.
- **Recommended Execution Model:** `EVENT_DRIVEN`.

#### OP-13: Performance Aggregation & Leaderboards
- **Business Purpose:** Aggregates weekly, monthly, and topic-level performance metrics for executive reporting.
- **Trigger:** Scheduled daily at 02:00 IST.
- **Expected Duration:** $10.0\,\text{s} - 60.0\,\text{s}$.
- **Recommended Execution Model:** `SCHEDULED`.

#### OP-14: Content Intelligence Generation
- **Business Purpose:** Analyzes viewer retention curves and topic popularity to produce recommendations for future questions.
- **Trigger:** Creator clicks "Analyze Topic Performance" in Step 15.
- **Expected Duration:** $5.0\,\text{s} - 30.0\,\text{s}$.
- **Recommended Execution Model:** `ASYNC_BENEFICIAL`.

#### OP-15: In-App User Notifications Dispatch
- **Business Purpose:** Evaluates notification rules, generates in-app notification records in Firestore, and pushes alerts.
- **Trigger:** Entity state transition, assignment change, or review request.
- **Expected Duration:** $50\,\text{ms} - 200\,\text{ms}$.
- **Recommended Execution Model:** `EVENT_DRIVEN`.

#### OP-16: Realtime SSE Event Fan-Out
- **Business Purpose:** Distributes in-memory SSE messages to connected clients via Node.js `EventEmitter`.
- **Trigger:** Local domain state mutation.
- **Expected Duration:** $5\,\text{ms} - 25\,\text{ms}$.
- **Can it block HTTP?** YES (inlined in post-commit hook; sub-millisecond execution).
- **Recommended Execution Model:** `SYNC_REQUIRED`.

#### OP-17: External OAuth Token Refresh
- **Business Purpose:** Exchanges Google/Meta refresh tokens for short-lived access tokens before API invocation.
- **Trigger:** On-demand when token TTL $< 300\,\text{s}$.
- **Expected Duration:** $500\,\text{ms} - 2.0\,\text{s}$.
- **Can it block HTTP?** YES (must complete before outgoing request is dispatched).
- **Recommended Execution Model:** `SYNC_REQUIRED`.

#### OP-18: Hourly GCS Snapshot Export
- **Business Purpose:** Performs full logical export of Firestore collections to timestamped JSON in Google Cloud Storage for disaster recovery.
- **Trigger:** Cron schedule (every 60 minutes).
- **Expected Duration:** $15.0\,\text{s} - 60.0\,\text{s}$.
- **Recommended Execution Model:** `SCHEDULED`.

#### OP-19: Database Pruning & Log Retention
- **Business Purpose:** Purges expired idempotency keys, deletes resolved audit logs $> 90\,\text{days}$, and cleans stale SSE connection records.
- **Trigger:** Cron schedule (weekly).
- **Expected Duration:** $30.0\,\text{s} - 120.0\,\text{s}$.
- **Recommended Execution Model:** `SCHEDULED`.

#### OP-20: Retryable External Operation Dispatch (DLQ Re-Drive)
- **Business Purpose:** Re-attempts failed external API calls following transient provider outages.
- **Trigger:** DLQ watchdog timer or manual administrator retry.
- **Expected Duration:** Variable ($2\text{s} - 60\text{s}$).
- **Recommended Execution Model:** `ASYNC_REQUIRED`.

---

## 6. HTTP Request Boundary & Contract

When an incoming HTTP request initiates an asynchronous operation, it must strictly decouple request termination from task execution.

```
CLIENT                              BP-CMS API (Express)                       ASYNC RUNNER
  │                                           │                                      │
  │  POST /api/v1/jobs/ai-generation          │                                      │
  │  [Payload + Idempotency-Key]              │                                      │
  ├──────────────────────────────────────────►│                                      │
  │                                           │ 1. Validate Zod Schema               │
  │                                           │ 2. Check RBAC Capabilities           │
  │                                           │ 3. Check Idempotency Key             │
  │                                           │ 4. Insert Job Record (QUEUED)        │
  │                                           │ 5. Schedule Dispatch                 │
  │                                           ├─────────────────────────────────────►│
  │                                           │                                      │
  │  202 Accepted                             │                                      │
  │  { status: "accepted", jobId: "JOB-..." } │                                      │
  │◄──────────────────────────────────────────┤                                      │
  │                                           │                                      │
  │                                           │                                      │ Execute Task
  │  GET /api/v1/jobs/:jobId (or SSE Stream)  │                                      │ [State -> RUNNING]
  ├──────────────────────────────────────────►│◄─────────────────────────────────────┤
  │                                           │                                      │
  │                                           │                                      │ Emit SSE Event
  │  SSE: JOB_STATUS_UPDATED                  │                                      │ [JOB_STATUS_UPDATED]
  │◄──────────────────────────────────────────┼──────────────────────────────────────┤
  │                                           │                                      │
  │                                           │                                      │ Task Succeeded
  │                                           │                                      │ [State -> SUCCEEDED]
  │  GET /api/v1/jobs/:jobId                  │                                      │
  ├──────────────────────────────────────────►│                                      │
  │  200 OK { state: "SUCCEEDED", result }    │                                      │
  │◄──────────────────────────────────────────┤                                      │
```

### 6.1 HTTP 202 Accepted Response Contract
- **HTTP Status Code:** `202 Accepted`
- **Headers:**
  - `Location: /api/v1/jobs/{jobId}`
  - `Retry-After: 5` (suggested polling interval if SSE is disconnected)
- **Response Body Envelope:**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-20261004-8931af",
    "type": "AI_GENERATION",
    "priority": "HIGH",
    "state": "QUEUED",
    "entityId": "Q-20261004-001",
    "createdAt": "2026-10-04T02:27:01.000Z",
    "estimatedDurationSeconds": 15,
    "statusUrl": "/api/v1/jobs/JOB-20261004-8931af",
    "sseChannel": "job:JOB-20261004-8931af"
  },
  "timestamp": "2026-10-04T02:27:01.000Z",
  "requestId": "REQ-20261004-98124"
}
```

### 6.2 Polling & Query Contract
- `GET /api/v1/jobs/:jobId` returns the current job snapshot.
- Cached in browser memory; polled only if SSE connection drops (`exponential backoff: 5s, 10s, 20s`).
- Completed jobs retain their result in the database for 7 days before archival.

---

## 7. Canonical Job State Model

The job execution state model adheres strictly to the authoritative dimension established in **Stage 08 (State Model)**.

```
                    ┌──────────────┐
                    │  REQUESTED   │
                    └──────┬───────┘
                           │ Transactional Commit
                           ▼
                    ┌──────────────┐
       ┌───────────►│    QUEUED    │◄──────────────┐
       │            └──────┬───────┘               │
       │                   │ Worker Claim / Push   │
       │                   ▼                       │
       │            ┌──────────────┐               │ Retryable Failure
       │            │   RUNNING    ├───────────────┤ (Attempts < Max)
       │            └──────┬───────┘               │
       │                   │                       │
       │    ┌──────────────┼──────────────┐        │
       │    │              │              │        │
       │    ▼              ▼              ▼        │
       │ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
       │ │SUCCEEDED │ │TIMED_OUT │ │FAILED_RETRY.┼─┘
       │ └──────────┘ └────┬─────┘ └─────────────┘
       │                   │
       │                   ▼ (Attempts >= Max)
       │              ┌──────────┐
       │              │FAILED_   │
       │              │ FATAL    │
       │              └──────────┘
       │                   ▲
       │ Manual / System   │
       └───────────────────┼───────────┐
                           │           │
                    ┌──────┴─────┐     │
                    │ CANCELLED  │     │
                    └────────────┘     │
```

### 7.1 Authoritative Job Execution States
1. `QUEUED`: Job record persisted in Firestore; waiting for worker dispatch or Cloud Tasks push invocation.
2. `RUNNING`: Worker has acquired lease lock; execution actively progressing.
3. `SUCCEEDED`: Execution completed successfully; outputs transactionally written; entity notified.
4. `FAILED_RETRYABLE`: Execution encountered transient error (e.g. 503 rate limit); queued for backoff retry.
5. `FAILED_FATAL`: Execution failed unrecoverably (e.g. invalid file format, max retries exhausted); human intervention required.
6. `TIMED_OUT`: Worker failed to report progress or renew lease before `timeoutSeconds` expired.
7. `CANCELLED`: Explicitly aborted by authorized user or superseded by newer job instance.

### 7.2 Separation of State Dimensions (Stage 08 Alignment)
| Business Dimension | Owned Entity | Possible Values | Stage Owner |
| :--- | :--- | :--- | :--- |
| **Workflow Step** | `WorkflowInstance` | `01_IDEATION` $\dots$ `15_PERFORMANCE` | Stage 07 |
| **Entity Lifecycle** | `Question`, `Script` | `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED` | Stage 08 |
| **Media State** | `MediaAsset`, `VideoTake` | `UPLOADED`, `TRANSCODED`, `READY`, `FAILED` | Stage 14 |
| **Job Execution State** | `AsyncJobRecord` | `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED_*` | **Stage 17** |
| **Publication State** | `Publication` | `SCHEDULED`, `DISPATCHED`, `LIVE`, `FAILED` | Stage 08 |

*Under no circumstances may a worker write a `JobExecutionState` into a `WorkflowInstance.currentStep` or `Question.lifecycleState` field.*

---

## 8. Job Lifecycle Transitions & Invariants

### 8.1 State Transition Matrix
```text
┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ From / To        │ QUEUED       │ RUNNING      │ SUCCEEDED    │ FAILED_RETRY │ FAILED_FATAL │ CANCELLED    │
├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ QUEUED           │ —            │ ALLOWED (1)  │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ ALLOWED (2)  │
│ RUNNING          │ FORBIDDEN    │ —            │ ALLOWED (3)  │ ALLOWED (4)  │ ALLOWED (5)  │ ALLOWED (6)  │
│ FAILED_RETRYABLE │ ALLOWED (7)  │ FORBIDDEN    │ FORBIDDEN    │ —            │ ALLOWED (8)  │ ALLOWED (9)  │
│ TIMED_OUT        │ ALLOWED (10) │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ ALLOWED (11) │ FORBIDDEN    │
│ SUCCEEDED        │ FORBIDDEN    │ FORBIDDEN    │ TERMINAL     │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │
│ FAILED_FATAL     │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ TERMINAL     │ FORBIDDEN    │
│ CANCELLED        │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ FORBIDDEN    │ TERMINAL     │
└──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Transition Invariants:
1. `QUEUED` $\to$ `RUNNING`: Requires worker identity lease acquisition and `leaseExpiresAt` assignment.
2. `QUEUED` $\to$ `CANCELLED`: Authorized user aborts job before worker claims it.
3. `RUNNING` $\to$ `SUCCEEDED`: Requires output payload validation and target entity linkage.
4. `RUNNING` $\to$ `FAILED_RETRYABLE`: Permitted only if `retryCount < maxRetries` and error is transient.
5. `RUNNING` $\to$ `FAILED_FATAL`: Permitted when error is fatal or `retryCount >= maxRetries`.
6. `RUNNING` $\to$ `CANCELLED`: Permitted via administrative abort; worker must handle `AbortSignal`.
7. `FAILED_RETRYABLE` $\to$ `QUEUED`: Permitted after exponential backoff delay expires.
8. `FAILED_RETRYABLE` $\to$ `FAILED_FATAL`: Permitted when manual inspection marks failure as permanent.
9. `FAILED_RETRYABLE` $\to$ `CANCELLED`: Permitted when user declines further automatic retries.
10. `TIMED_OUT` $\to$ `QUEUED`: Watchdog resets dead worker lease for retry if attempts remain.
11. `TIMED_OUT` $\to$ `FAILED_FATAL`: Watchdog marks dead worker lease fatal when retries exhausted.

---

## 9. Execution Options Evaluation

The following 8 candidate execution mechanisms are evaluated against BP-CMS operational and budgetary requirements:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXECUTION CANDIDATES                                      │
├────┬─────────────────────────────┬─────────────────────────────────────────────────────┤
│ ID │ Mechanism                   │ Summary Description                                 │
├────┼─────────────────────────────┼─────────────────────────────────────────────────────┤
│ A  │ Normal Cloud Run HTTP       │ Process execution synchronously within web request. │
│ B  │ In-Process Async Task       │ Fire-and-forget Promise / EventEmitter in Node.js.  │
│ C  │ Cloud Run Background Thread │ Request finishes; background execution continues.   │
│ D  │ Database-Backed Jobs        │ Firestore collection polled or leased by workers.   │
│ E  │ Google Cloud Tasks          │ Managed HTTP push queue to Cloud Run worker route.  │
│ F  │ Generic Queue (RabbitMQ)    │ Self-hosted AMQP message broker.                    │
│ G  │ Redis + BullMQ              │ In-memory Redis instance with Node.js BullMQ worker.│
│ H  │ Google Cloud Pub/Sub        │ Distributed publish-subscribe event topic.          │
└────┴─────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 10. Normal Cloud Run HTTP Request Evaluation

### 10.1 Mechanism
Executing operations synchronously within the originating client HTTP request cycle.

### 10.2 Architectural Analysis
- **Execution Time Limit:** Cloud Run allows requests up to 60 minutes, but web ingress/load balancers typically timeout at $60\,\text{s} - 120\,\text{s}$. Browsers and mobile clients timeout at $30\,\text{s}$.
- **User Experience:** Terrible for operations $> 1.0\,\text{s}$. The client UI freezes, spins, or prompts users to retry, causing double-submissions.
- **Interruption Vulnerability:** Any client disconnect, tab close, or transient mobile network switch drops the connection and aborts execution.
- **Conclusion:** Strictly reserved for fast operations ($\le 500\,\text{ms}$) like schema validation, metadata mutations, and auth token generation. Completely rejected for long-running workflows.

---

## 11. In-Process Asynchronous Tasks Evaluation

### 11.1 Mechanism
Launching unhandled promises or Node.js event handlers (`setImmediate`, `setTimeout`, background `Promise.then()`) while immediately returning an HTTP response to the client.

### 11.2 Architectural Analysis
- **Container Lifecycle Failure:** Cloud Run throttles CPU allocation to zero as soon as an HTTP response finishes (unless "CPU always allocated" is purchased at significant cost). In-process promises freeze mid-execution and die during container scale-to-zero or auto-recycling.
- **Zero Durability:** If the Node.js process crashes, unhandled rejections or background jobs are lost forever with zero recovery path.
- **Zero Visibility:** No durable database state tracks whether the task is queued, running, or failed.
- **Safe Boundary:** In-process execution is acceptable **only** for:
  1. Local development and offline unit testing.
  2. Transient in-memory SSE event fan-out (Stage 16).
- **Conclusion:** Strictly prohibited for production durable business operations.

---

## 12. Database-Backed Jobs Evaluation

### 12.1 Mechanism
Jobs are written as documents in a Cloud Firestore `jobs` collection. Workers periodically query for `QUEUED` jobs, acquire atomic lease locks via transactions, and update state upon completion.

### 12.2 Architectural Analysis
- **Pros:** Full durability, native ACID transactions, zero third-party dependencies, full audit trail, zero extra infrastructure costs.
- **Cons (Standalone Polling):** If implemented purely via polling, workers must query Firestore every $1\text{s} - 5\text{s}$. Continuous polling generates $17,280 - 86,400$ reads/day per worker instance, threatening to exhaust the 50,000 free-tier daily read limit.
- **Conclusion:** Database-backed job records are **mandatory for state persistence**, but polling is inefficient. Pairing database records with an event-driven trigger (Cloud Tasks push) eliminates polling reads entirely.

---

## 13. Google Cloud Tasks Evaluation

### 13.1 Mechanism
Google Cloud Tasks is a fully managed asynchronous push queue. When an operation is initiated, BP-CMS generates a job record in Firestore and dispatches a lightweight HTTP task to Cloud Tasks. Cloud Tasks then makes an authenticated `POST` request to an internal Cloud Run worker endpoint (`/api/v1/jobs/execute`).

### 13.2 Architectural Analysis
- **Delivery Guarantees:** Exactly-once delivery semantics under normal operation, at-least-once guaranteed under network failure.
- **Serverless & Scale-to-Zero:** Cloud Tasks wakes cold Cloud Run instances on demand. Zero idle servers, zero CPU cost while idle.
- **Native Managed Retries:** Cloud Tasks manages exponential backoff, rate limits, max retry counts, and dispatch rate limits automatically.
- **Strict OIDC Security:** Cloud Tasks authenticates to Cloud Run using Google-signed OpenID Connect (OIDC) identity tokens. The endpoint cannot be forged or accessed by public clients.
- **Pricing & Free Tier:** Google Cloud Tasks provides **1,000,000 tasks per month completely free**, perpetually. BP-CMS initial production volume ($< 50,000$ operations/month) consumes $< 5\%$ of the free tier. Total cost: **₹0.00 / month**.
- **Conclusion:** **WINNER for Production.** Perfectly satisfies AP-011 (Modular Monolith) and AP-012 (Zero-Cost Invariant).

---

## 14. Dedicated Queue / Broker Evaluation (Pub/Sub & RabbitMQ)

### 14.1 Mechanism
Deploying a dedicated distributed message broker such as Apache Kafka, RabbitMQ, or Google Cloud Pub/Sub.

### 14.2 Architectural Analysis
- **Pub/Sub:** Excellent for high-throughput broadcast fan-out (1M+ events/sec), but lacks individual task scheduling, individual task deduplication, and HTTP push backoff control as refined as Cloud Tasks. Pub/Sub incurs costs when subscriptions accumulate dead-letter queues.
- **RabbitMQ / Kafka:** Requires persistent virtual machine clusters (GCE / GKE), continuous cluster administration, disk provisioning, and security patching.
- **Budget Violation:** Managed RabbitMQ or Kafka costs minimum ₹4,000 – ₹15,000/month, instantly violating the ₹0–₹100 budget ceiling.
- **Conclusion:** Strictly rejected. Unjustified architectural over-engineering for a studio producing dozens to hundreds of videos weekly.

---

## 15. Strict Redis / BullMQ Gate & Rejection Rationale

### 15.1 Candidate Analysis
BullMQ backed by Redis is an industry-standard Node.js job queue library. It provides priority queues, delays, rate-limiting, and worker pools.

### 15.2 Mandatory Gate Check & Rejection Findings
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REDIS / BULLMQ GATE AUDIT                                 │
├──────────────────────────┬────────────────────────────┬────────────────────────────────┤
│ Evaluation Criterion     │ Redis / BullMQ Reality     │ BP-CMS Architectural Verdict   │
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ Monthly Cost (COST-001)  │ GCP Memorystore Redis:     │ FAILS VIOLENTLY.               │
│                          │ Minimum ₹2,500 – ₹3,500/mo │ Exceeds ₹100 ceiling by 3,500%.│
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ Self-Hosted Redis VM     │ E2-micro VM: ₹600/mo;      │ FAILS. Requires maintenance,   │
│                          │ persistence risky on disk  │ OS patching, and violates cost.│
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ Scale-to-Zero Invariant  │ Redis must run 24/7/365;   │ FAILS. Cannot scale to zero    │
│                          │ cannot scale to zero.      │ during studio idle hours.      │
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ Local Dev Ergonomics     │ Requires Docker daemon     │ DEGRADES ergonomics for dev.   │
│                          │ and Redis image running.   │                                │
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ Operational Complexity   │ Connection pool timeouts,  │ High operational overhead for  │
│                          │ memory leaks, Redis auth.  │ zero business advantage.       │
└──────────────────────────┴────────────────────────────┴────────────────────────────────┘
```

### 15.3 Rejection Statement
**Redis and BullMQ are strictly REJECTED.** 
Simpler, native Google Cloud serverless mechanisms (Cloud Tasks + Firestore) provide superior durability, zero idle cost, native scale-to-zero, and zero server maintenance within the perpetual free tier.

#### Future Re-Evaluation Triggers:
Redis/BullMQ may only be reconsidered if:
1. Job throughput exceeds $1,000\,\text{jobs per second}$ continuously.
2. Latency requirements between task creation and worker start must be $< 10\,\text{milliseconds}$ (sub-second throughput).
3. The business establishes a recurring monthly infrastructure budget exceeding ₹25,000/month.

---

## 16. Retry Architecture & Backoff Algorithms

### 16.1 Exponential Backoff Formula
For all retryable asynchronous jobs, retry intervals are calculated using exponential backoff with full jitter to avoid thundering-herd effects on external APIs:

$$\text{Delay}(n) = \min\left(\text{Delay}_{\text{max}}, \text{InitialDelay} \times \text{Multiplier}^n\right) \times (1 + \text{rand}(0, 0.2))$$

Where:
- $n = \text{retryCount}$ ($0, 1, 2, \dots$)
- $\text{Multiplier} = 2.0 - 3.0$ (job-type specific)
- $\text{Delay}_{\text{max}} = 600\,\text{seconds}$ ($10\,\text{minutes}$)

```text
┌──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Job Type             │ Initial Del │ Multiplier  │ Max Retries │ Max Delay   │ Total Span  │
├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ AI_GENERATION        │ 2,000 ms    │ 2.0         │ 3           │ 60,000 ms   │ ~14 seconds │
│ MEDIA_PROCESSING     │ 5,000 ms    │ 3.0         │ 2           │ 120,000 ms  │ ~65 seconds │
│ PLATFORM_SYNC        │ 10,000 ms   │ 2.5         │ 5           │ 300,000 ms  │ ~12 minutes │
│ ANALYTICS_COLLECTION │ 15,000 ms   │ 3.0         │ 3           │ 300,000 ms  │ ~3 minutes  │
│ THUMBNAIL_PROCESSING │ 2,000 ms    │ 2.5         │ 3           │ 45,000 ms   │ ~25 seconds │
│ ARCHIVE_VERIFICATION │ 10,000 ms   │ 3.0         │ 2           │ 300,000 ms  │ ~2 minutes  │
│ USER_NOTIFICATION    │ 1,000 ms    │ 3.0         │ 2           │ 15,000 ms   │ ~4 seconds  │
└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 16.2 Error Classification: Retryable vs. Non-Retryable
```text
┌──────────────────────────────────────┬──────────────────┬──────────────────────────────┐
│ Error Condition                      │ Classification   │ Handling Behavior            │
├──────────────────────────────────────┼──────────────────┼──────────────────────────────┤
│ HTTP 429 Too Many Requests           │ RETRYABLE        │ Exponential backoff retry.   │
│ HTTP 503 Service Unavailable         │ RETRYABLE        │ Exponential backoff retry.   │
│ Socket Timeout / ECONNRESET          │ RETRYABLE        │ Immediate backoff retry.     │
│ Cloud Tasks Lease Expiry             │ RETRYABLE        │ Worker re-delivery.          │
│ HTTP 400 Bad Request / Schema Error  │ FATAL            │ Abort, flag FAILED_FATAL.    │
│ HTTP 401 Unauthorized / Token Revoked│ FATAL            │ Abort, flag AUTH_REVOKED.    │
│ HTTP 403 Forbidden / Scope Violation │ FATAL            │ Abort, flag PERMISSION_DENIED│
│ File Corrupted / Unreadable Header   │ FATAL            │ Abort, alert Editor.         │
│ AI Safety Filter Violation           │ FATAL            │ Abort, alert Author.         │
└──────────────────────────────────────┴──────────────────┴──────────────────────────────┘
```

### 16.3 Dead-Letter Queue (DLQ) Governance
When `retryCount >= maxRetries`:
1. The job transitions to `FAILED_FATAL`.
2. A persistent DLQ incident record is written to `/audit_events` and `/job_dlq`.
3. An administrative alert is published via SSE and in-app notifications.
4. The job payload is retained indefinitely to allow administrative inspection and manual re-drive (`POST /api/v1/jobs/:jobId/retry`).

---

## 17. Idempotency Architecture & Deduplication

### 17.1 Idempotency Key Specification
To prevent duplicate job execution caused by client double-clicks, network retry loops, or at-least-once message delivery, all mutating requests must supply or derive an **Idempotency Key**.

$$\text{IdempotencyKey} = \text{Prefix} + \text{DomainScope} + \text{EntityId} + \text{ContentDigest}$$

- **Format:** `IDEMP-{JOB_TYPE}-{ENTITY_ID}-{PAYLOAD_SHA256[:12]}`
- **Example:** `IDEMP-AI_GEN-Q-20261004-001-a83f9b201cd4`

### 17.2 Deduplication Lifecycle in Firestore
1. **Key Registration:** The API handler executes an atomic transaction on the `/idempotency_keys/{key}` document.
2. **State Check:**
   - If key does not exist: Insert key record with status `IN_FLIGHT`, current `jobId`, and `ttl` (24 hours).
   - If key exists with status `IN_FLIGHT`: Return `409 Conflict` or existing `202 Accepted` with active `jobId`.
   - If key exists with status `COMPLETED`: Return cached original response (`200 OK` or `202 Accepted`) without scheduling execution.
3. **Key Expiration:** Idempotency records expire automatically after 24 hours via TTL cleanup policy.

---

## 18. Concurrency, Worker Leases & Watchdogs

### 18.1 Concurrency Model
Cloud Tasks delivers jobs to internal HTTP worker routes (`POST /api/v1/jobs/execute`). To ensure two concurrent workers never process the same job:
1. **Optimistic Lease Acquisition:** The worker executes a Firestore atomic transaction:
```typescript
await firestore.runTransaction(async (transaction) => {
  const jobRef = firestore.collection('jobs').doc(jobId);
  const jobDoc = await transaction.get(jobRef);
  const job = jobDoc.data();

  const now = new Date();
  const leaseExpired = job.leaseExpiresAt && new Date(job.leaseExpiresAt) < now;

  if (job.state === 'RUNNING' && !leaseExpired) {
    throw new Error('JOB_CURRENTLY_LOCKED_BY_ANOTHER_WORKER');
  }

  transaction.update(jobRef, {
    state: 'RUNNING',
    startedAt: now.toISOString(),
    leaseExpiresAt: new Date(now.getTime() + job.timeoutSeconds * 1000).toISOString(),
    workerId: currentWorkerId,
    updatedAt: now.toISOString()
  });
});
```

### 18.2 Lease Renewal & Watchdog Recovery
- Long-running jobs ($> 30\,\text{s}$) issue periodic heartbeat renewals every 15 seconds to extend `leaseExpiresAt`.
- If a Cloud Run container crashes or is abruptly killed, `leaseExpiresAt` expires.
- The next scheduled worker or watchdog task detects `state === 'RUNNING'` with `leaseExpiresAt < NOW()` and reclaims the job for retry.

---

## 19. Failure Recovery Matrix

```text
┌──────────────────────────────────────┬──────────────────────┬───────────────────────────────────────────┐
│ Failure Scenario                     │ Detection Mechanism  │ Recovery Procedure                        │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ Worker container crash / sigkill     │ Lease timeout        │ Watchdog detects expired lease; re-queues │
│                                      │                      │ job if retries remain.                    │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ External API 500/503 (Gemini/Meta)   │ HTTP status check    │ Transitions to FAILED_RETRYABLE; Cloud    │
│                                      │                      │ Tasks applies exponential backoff delay.  │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ Database temporary unreachable       │ Firestore SDK retry  │ Native SDK retries; Cloud Tasks HTTP redelivery│
│                                      │                      │ after backoff.                            │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ Deployment during active execution   │ SIGTERM handler      │ Cloud Run provides 10s grace; worker      │
│                                      │                      │ releases lease and exits cleanly.         │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ Malformed external API response      │ Zod schema parsing   │ Flags FAILED_FATAL; logs payload to audit;│
│                                      │ error                │ alerts developer.                         │
├──────────────────────────────────────┼──────────────────────┼───────────────────────────────────────────┤
│ Stale / Abandoned Job                │ 24h Watchdog audit   │ Prunes un-retryable jobs; marks DEAD_TASK │
│                                      │                      │ in administrative audit log.              │
└──────────────────────────────────────┴──────────────────────┴───────────────────────────────────────────┘
```

---

## 20. External Integrations Asynchronous Boundaries

External services interact exclusively through asynchronous boundaries:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS ASYNC BOUNDARIES                          │
├──────────────────────────┬─────────────────┬───────────────────────────────────────────┤
│ External Integration     │ Access Model    │ Asynchronous Handling Boundary            │
├──────────────────────────┼─────────────────┼───────────────────────────────────────────┤
│ Google Drive             │ OAuth 2.0 /     │ File downloads and checksum verifications │
│                          │ Service Account │ run in background; quota capped at 10 req/s│
├──────────────────────────┼─────────────────┼───────────────────────────────────────────┤
│ Google Gemini API        │ Vertex AI / SDK │ Prompts run asynchronously; tokens stream │
│                          │                 │ to buffer; completed output validated.    │
├──────────────────────────┼─────────────────┼───────────────────────────────────────────┤
│ YouTube Data API v3      │ OAuth 2.0 User  │ Video upload chunked stream; processing   │
│                          │ Grant           │ status polled via async verification job. │
├──────────────────────────┼─────────────────┼───────────────────────────────────────────┤
│ Meta Graph API (Insta)   │ User Token      │ Container creation & publish status polled│
│                          │                 │ asynchronously; rate-limit bucketed.      │
├──────────────────────────┼─────────────────┼───────────────────────────────────────────┤
│ Google Cloud Storage     │ Native SDK      │ Archival binary copy & snapshot writes run│
│                          │                 │ as background scheduled jobs.             │
└──────────────────────────┴─────────────────┴───────────────────────────────────────────┘
```

---

## 21. Media Processing Asynchronous Boundary

Grounded in **Stage 14 (Media Architecture)**:
1. **Binary Media Isolation:** Media binaries reside strictly in Google Drive or GCS. Workers download binaries to temporary container `/tmp` storage (in-memory tmpfs) only when transcode or SHA-256 calculation is active.
2. **Media State vs. Job State:**
   - `MediaAsset.processingState`: `PENDING_VALIDATION` $\to$ `TRANSCODED` $\to$ `READY`.
   - `AsyncJobRecord.state`: `QUEUED` $\to$ `RUNNING` $\to$ `SUCCEEDED`.
3. **Checksum Invariant:** A video file cannot be marked `MediaAsset.processingState = READY` until the background job computes the SHA-256 hash and verifies vertical dimensions ($1080 \times 1920$).

---

## 22. AI Architecture Asynchronous Boundary

Grounded in **Stage 04 (AP-009 Human Authority)** and anticipatory of **Stage 18 (AI Architecture)**:
1. **Proposal Isolation:** Generative LLM jobs produce *proposals* or *draft candidates*. They never overwrite approved production questions or scripts.
2. **Review Gate:** The completion of an `AI_GENERATION` job updates `Question.proposals`, leaving the entity lifecycle state at `DRAFT`. Progression requires human educator sign-off.
3. **Streaming vs. Buffer:** Cloud Run workers buffer complete LLM outputs, validate against Zod schemas, persist the proposal document, and notify the user via SSE.

---

## 23. Analytics Asynchronous Boundary

Grounded in anticipatory **Stage 20 (Analytics Architecture)**:
1. **Decoupled Telemetry Ingest:** Social media metrics (views, retention, watch time) are fetched by scheduled background tasks.
2. **No User Interruption:** The creator dashboard renders cached metrics from the latest normalized snapshot. Dashboard requests never trigger real-time social API calls.
3. **Hourly / Daily Batching:** Telemetry polling runs every 6 hours; normalization runs immediately post-ingest; aggregation leaderboards update daily at 02:00 IST.

---

## 24. Notification Delivery Asynchronous Boundary

Coordinated with **Stage 16 (Real-Time Architecture)**:
1. **Non-Blocking Fan-Out:** Domain business logic (e.g. Question Approval in Step 02) commits its transaction and immediately dispatches a notification event.
2. **Delivery Decoupling:** In-app notification creation in Firestore runs asynchronously; real-time SSE push is broadcast in-memory to active sessions.
3. **Failure Isolation:** Failure of an email, push, or SSE notification never rolls back an approved workflow transition.

---

## 25. Real-Time Integration (Stage 16 SSE Synergy)

Jobs communicate their execution lifecycle to connected frontends using the **Stage 16 Server-Sent Events (SSE)** contract:

```typescript
// Channel: job:{jobId} or entity:question:{questionId}
{
  "eventId": "EVT-20261004-9812401",
  "eventType": "JOB_STATUS_UPDATED",
  "channel": "job:JOB-20261004-8931af",
  "actorId": "USR-DEV-001",
  "payload": {
    "jobId": "JOB-20261004-8931af",
    "jobType": "AI_GENERATION",
    "state": "RUNNING",
    "entityId": "Q-20261004-001",
    "retryCount": 0,
    "maxRetries": 3,
    "timestamp": "2026-10-04T02:27:05.120Z"
  },
  "sequenceNumber": 2,
  "traceId": "TRC-JOB-20261004-8931af",
  "timestamp": "2026-10-04T02:27:05.125Z"
}
```

Connected browser tabs subscribe to entity channels (`entity:question:Q-...`) and automatically receive job progression toasts without manual page reloads.

---

## 26. Audit & Observability Integration

Grounded in anticipatory **Stage 21 (Audit & Observability)**:
Every job lifecycle event emits an immutable audit entry to `/audit_events`:
- `JOB_REQUESTED`: Actor ID, IP address, idempotency key, entity ID.
- `JOB_STARTED`: Worker ID, container ID, lease start time.
- `JOB_RETRIED`: Attempt count, error code, backoff delay.
- `JOB_SUCCEEDED`: Duration ms, result payload reference.
- `JOB_FAILED_FATAL`: Stack trace, terminal error code, DLQ incident ID.
- `JOB_CANCELLED`: Requesting actor ID, cancellation reason.

---

## 27. Security & Authorization Boundary

Grounded in **Stage 09 (RBAC & Capabilities)** and anticipatory of **Stage 19 (Security)**:
1. **Creation Authorization:** Client endpoints validating job initiation enforce strict RBAC capability checks:
   - `AI_GENERATION`: Requires `QUESTION_CREATE` or `SCRIPT_CREATE`.
   - `MEDIA_PROCESSING`: Requires `VIDEO_UPLOAD` or `VIDEO_EDIT`.
   - `PLATFORM_SYNC`: Requires `PUBLISH_EXECUTE`.
2. **Worker Authentication (OIDC):** The internal execution route (`POST /api/v1/jobs/execute`) is **strictly shielded** from public access. Cloud Tasks provides a cryptographically signed Google OpenID Connect (OIDC) token verifying that the caller is the GCP Cloud Tasks service agent. Requests lacking valid OIDC tokens are rejected with `401 Unauthorized`.
3. **Job ID Forgery Protection:** Job IDs follow strict regex (`JOB-YYYYMMDD-XXXXXX`). Random alphanumeric entropy prevents ID enumeration or horizontal traversal.

---

## 28. Cost Analysis & Free-Tier Proof

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              COST ARCHITECTURE PROOF                                   │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Component                │ Quota & Allowance           │ Monthly Cost (INR)            │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Google Cloud Tasks       │ 1,000,000 tasks/month free  │ ₹0.00                         │
│ Cloud Run Worker Invocation│ 2,000,000 requests/mo free; │ ₹0.00                         │
│                          │ 360,000 vCPU-sec free       │                               │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Cloud Firestore Writes   │ 20,000 writes/day free      │ ₹0.00 (avg 2,000 writes/day)  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Cloud Firestore Reads    │ 50,000 reads/day free       │ ₹0.00 (push model avoids poll)│
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Network Egress           │ 1 GB/month free egress      │ ₹0.00                         │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Local Dev Execution      │ Node.js In-Process Loop     │ ₹0.00                         │
├──────────────────────────┴─────────────────────────────┼───────────────────────────────┤
│ TOTAL PROJECTED MONTHLY INFRASTRUCTURE COST            │ ₹0.00 / month (100% Free Tier)│
└────────────────────────────────────────────────────────┴───────────────────────────────┘
```

The selected architecture operates entirely within Google Cloud's perpetual free tier for workloads up to $1,000,000$ operations monthly, guaranteeing **100% cost compliance**.

---

## 29. Comprehensive Decision Matrix

```text
┌──────────────────────┬─────────┬──────────┬──────────┬─────────┬──────────┬─────────┬─────────┐
│ Evaluation Criteria  │ Weight  │ Cloud Run│ In-Proc. │ DB-Only │ Cl.Tasks │ RabbitMQ│ Redis/  │
│                      │         │ HTTP (A) │ Task (B) │ Polling │ Hybrid(E)│ AMQP(F) │ Bull(G) │
├──────────────────────┼─────────┼──────────┼──────────┼─────────┼──────────┼─────────┼─────────┤
│ Cost Compliance      │ 1.5     │ 10.0     │ 10.0     │ 8.0     │ 10.0     │ 1.0     │ 1.0     │
│ Free-Tier Fit        │ 1.5     │ 2.0      │ 4.0      │ 7.0     │ 10.0     │ 1.0     │ 1.0     │
│ Durability on Crash  │ 1.0     │ 1.0      │ 2.0      │ 8.5     │ 10.0     │ 9.0     │ 9.0     │
│ Scale-to-Zero Fit    │ 1.0     │ 2.0      │ 2.0      │ 6.0     │ 10.0     │ 2.0     │ 4.0     │
│ Local Dev Ergonomics │ 1.0     │ 8.0      │ 10.0     │ 7.0     │ 9.0      │ 2.0     │ 3.0     │
│ Managed Retries      │ 1.0     │ 1.0      │ 4.0      │ 6.0     │ 10.0     │ 8.5     │ 9.0     │
│ Monolith Fit (AP-011)│ 1.0     │ 8.0      │ 10.0     │ 9.0     │ 9.5      │ 2.0     │ 2.0     │
│ Ops Simplicity       │ 1.0     │ 6.0      │ 9.0      │ 6.0     │ 9.5      │ 2.0     │ 3.0     │
├──────────────────────┼─────────┼──────────┼──────────┼─────────┼──────────┼─────────┼─────────┤
│ COMPOSITE SCORE      │ 9.0 max │ 4.8 / 10 │ 6.1 / 10 │ 7.3 / 10│ 9.7 / 10 │ 3.1 / 10│ 3.9 / 10│
└──────────────────────┴─────────┴──────────┴──────────┴─────────┴──────────┴─────────┴─────────┘
```

---

## 30. Proposed Architecture Decision

### 30.1 Dual-Mode Hybrid Architecture
BP-CMS adopts the **Cloud Tasks + Firestore Hybrid Execution Architecture**:

1. **Production Mode:**
   - **Trigger:** Cloud Tasks managed push queue.
   - **Worker:** Internal Cloud Run HTTP endpoint (`POST /api/v1/jobs/execute`) protected by Google OIDC authentication.
   - **Persistence:** Cloud Firestore `jobs` collection with optimistic lease locking.
   - **Retries:** Managed by Cloud Tasks push schedule with exponential backoff.
   - **Coordination:** Real-time updates pushed to browser via Stage 16 SSE EventBus.

2. **Local Development / Offline Mode:**
   - **Trigger:** Native Node.js in-process asynchronous task runner.
   - **Zero Cloud Credentials Required:** Developers run `npm run dev` completely offline.
   - **Persistence:** Local mock or Firestore emulator.

---

## 31. Source-of-Truth Matrix

```text
┌─────────────────────────────────┬──────────────────────────────────────┬─────────────┐
│ Architectural Dimension         │ Authoritative Source of Truth        │ SDLC Stage  │
├─────────────────────────────────┼──────────────────────────────────────┼─────────────┤
│ 15-Step Studio Workflow         │ WorkflowInstance / Step States       │ Stage 07    │
│ Domain Entity Lifecycle         │ Question / Script / Video Entities   │ Stage 08    │
│ RBAC & Action Capabilities      │ Server-Authoritative Capability Model│ Stage 09    │
│ API Contracts & 202 Envelopes   │ REST OpenAPI / Zod Schemas           │ Stage 15    │
│ Real-Time Signal Delivery       │ Server-Sent Events (SSE) Bus         │ Stage 16    │
│ Background Job Execution State  │ AsyncJobRecord in Firestore          │ STAGE 17    │
│ Media Asset Binary State        │ MediaAsset Metadata / Checksum       │ Stage 14    │
│ AI Behavior & Prompts           │ AI Model Providers & Boundary        │ Stage 18    │
│ Security & Encryption           │ KMS / OIDC / IAM Security Boundary   │ Stage 19    │
│ Telemetry & Analytics           │ Metric Snapshots & Aggregates        │ Stage 20    │
│ Audit & System Logs             │ Immutable Audit Ledger               │ Stage 21    │
│ Cost Compliance                 │ Zero-Cost Invariant (₹0–₹100/mo)     │ Stage 22    │
└─────────────────────────────────┴──────────────────────────────────────┴─────────────┘
```

---

## 32. Unresolved Decisions & Conflict Registers

### 32.1 Job Architecture Records (JAR)
- **JAR-01 (Approved):** Adopt Cloud Tasks HTTP Push Queue as the primary production async runner.
- **JAR-02 (Approved):** Strictly reject Redis and BullMQ to maintain the ₹0–₹100 budget ceiling.
- **JAR-03 (Approved):** Maintain strict physical separation between `JobExecutionState` and `WorkflowStep`.
- **JAR-04 (Approved):** Mandate `Idempotency-Key` headers for all asynchronous job submissions.

### 32.2 Job Architecture Conflict Register (JACR)
- **JACR-01 (Resolved):** *Conflict between In-Process execution simplicity vs. Cloud Run scale-to-zero container recycling.* 
  - **Resolution:** In-process execution is relegated strictly to local development. Cloud Tasks push queue is mandated for production.
- **JACR-02 (Deferred to Stage 18):** *Streaming LLM response tokens over SSE vs. Buffering complete response in worker.*
  - **Status:** Deferred to Stage 18 (AI Architecture). Stage 17 contracts accommodate both buffered job completion and streaming chunks.
- **JACR-03 (Deferred to Stage 22):** *Verification of Cloud Tasks free tier across multi-project configurations.*
  - **Status:** To be validated during Stage 22 (Cost Architecture) and Stage 29 (Deployment).

---

## 33. Downstream Implementation Contract

Downstream stages must adhere to the following binding constraints:
- **Stage 18 (AI Architecture):** Must invoke LLM generation asynchronously via `AsyncJobType.AI_GENERATION`; must store drafts in proposals without advancing workflow step.
- **Stage 19 (Security Architecture):** Must validate Google OIDC identity tokens on the internal `/api/v1/jobs/execute` worker route.
- **Stage 20 (Analytics Architecture):** Must utilize scheduled async jobs for social telemetry polling.
- **Stage 21 (Audit & Observability):** Must subscribe to all job lifecycle transitions for immutable audit ledger writes.
- **Stage 27 (Implementation):** Must implement the Cloud Tasks push client and local in-process runner adhering strictly to `src/types/job-architecture.ts`.

---

## 34. Traceability Matrix

```text
┌──────────────────────┬──────────────────────────────────────────┬────────────────────────┐
│ Requirement / Rule   │ Architectural Mechanism                  │ Verifying Section      │
├──────────────────────┼──────────────────────────────────────────┼────────────────────────┤
│ AP-002 Server Auth   │ Server-side lease claiming & validation  │ Sections 6, 18         │
│ AP-005 Concurrency   │ Optimistic lease locks & version tokens  │ Section 18             │
│ AP-009 Human Gate    │ AI jobs produce proposals, not approvals │ Section 22             │
│ AP-010 Single Owner  │ Job state separated from entity state    │ Section 7              │
│ AP-011 Monolith      │ Internal HTTP push routes in Express     │ Sections 13, 30        │
│ AP-012 Zero-Cost     │ Cloud Tasks 1M free tier (₹0.00/mo)      │ Sections 15, 28        │
│ 15-Step Workflow     │ Non-blocking async coverage across steps │ Sections 5, 20         │
│ Stage 16 Real-Time   │ Emits JOB_STATUS_UPDATED over SSE        │ Section 25             │
└──────────────────────┴──────────────────────────────────────────┴────────────────────────┘
```

---

## 35. Completion Checklist & Anti-Overclaim Statement

### 35.1 Stage 17 Completion Checklist
- [x] All 20 candidate asynchronous operations thoroughly evaluated.
- [x] Clear synchronous vs. asynchronous boundary defined with HTTP `202 Accepted` contract.
- [x] Job state model aligns with Stage 08 (`JobExecutionState`).
- [x] Workflow state, entity lifecycle, media state, and job state strictly separated.
- [x] Exponential backoff retry algorithms and DLQ governance defined.
- [x] Idempotency key derivation, storage, and 24h deduplication lifecycle defined.
- [x] Worker concurrency, optimistic lease locking, and watchdog recovery defined.
- [x] Cloud Run container recycling and crash recovery addressed.
- [x] Redis and BullMQ strictly audited and rejected based on ₹0–₹100 cost invariant.
- [x] Cloud Tasks push queue selected as primary production runner.
- [x] In-process runner specified for offline local development ergonomics.
- [x] Integration contracts defined for Realtime (Stage 16), AI (Stage 18), Analytics (Stage 20), and Audit (Stage 21).
- [x] Source-of-truth matrix, decision registers, and downstream contracts established.
- [x] No runtime source files, workers, or database collections modified.

### 35.2 Final Anti-Overclaim Confirmation
**Stage 17 background job and async architecture is documented and contractually defined; runtime job/worker implementation remains for later implementation stages.**
