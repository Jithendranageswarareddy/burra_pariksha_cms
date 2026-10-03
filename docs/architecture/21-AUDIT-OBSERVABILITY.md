# 21 — AUDIT & OBSERVABILITY ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 21 of 30-Stage Modernization Program — Authoritative Audit Ledger, Structured Observability, Tracing & System Health Signals

```
================================================================================
Document ID:       BP-ARCH-21-AUDIT-OBSERVABILITY
Version:           21.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Audit Architecture ("What happened, who did it, and what changed?"),
                   Observability Architecture ("Is the system working, and where is it failing?"),
                   Canonical Audit Event Schema, Immutability & Retention Governance,
                   Structured Logging, Error Diagnostics, Distributed Request Tracing,
                   Subsystem Observability (Workflow, Jobs, Media, AI), Alerting & Free-Tier Proof
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-009, AP-010, AP-011, AP-012, AP-014)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md (15 Studio Stages)
                   08-STATE-MODEL.md (State Dimension Separation)
                   09-RBAC-CAPABILITY-MODEL.md (AUDIT_VIEW, AUDIT_EXPORT Capabilities)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md (Checksum & Binary Integrity)
                   15-API-CONTRACT.md (REST Envelopes, Request IDs & Error Codes)
                   16-REALTIME-ARCHITECTURE.md (SSE Handshake & Event Channels)
                   17-JOB-ASYNC-ARCHITECTURE.md (Job States & Worker Leases)
                   18-AI-ARCHITECTURE.md (Human-Gated AI Provenance Ledger)
                   19-SECURITY-ARCHITECTURE.md (Defense-in-Depth & Access Control)
                   20-ANALYTICS-ARCHITECTURE.md (Operational Observability != Business Analytics)
Downstream Stages: 22-COST-ARCHITECTURE.md
                   23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Core Distinction:  AUDIT = "What happened, who did it, and what changed?" (Forensic Proof)
                   OBSERVABILITY = "Is the system working, and where is it failing?" (Diagnostic Telemetry)
Budget Invariant:  Hard Initial Infrastructure Ceiling: ₹0–₹100 / month (Cloud Logging 50 GB Free Tier)
================================================================================
```

---

## 1. Purpose & Objectives

This document establishes the authoritative **Audit and Observability Architecture** for the Burra Pariksha Content Management System (BP-CMS). Its purpose is to define:
1. **Audit Architecture:** How the system captures an immutable, tamper-resistant record of all business, workflow, security, and administrative actions to answer: *Who did what, to what resource, when, from where, and what changed?*
2. **Observability Architecture:** How the system monitors, measures, traces, and diagnoses runtime execution to answer: *Is the system functioning properly, what is current performance, and where is a failure occurring?*
3. **Subsystem Monitoring:** Standardized telemetry and event structures across the 15-step workflow, background asynchronous jobs (Stage 17), media processing (Stage 14), assistive AI pipelines (Stage 18), and security barriers (Stage 19).
4. **Cost & Privacy Invariants:** Zero sensitive data leakage into logs (AP-014) while operating strictly within Google Cloud's perpetual free tier (**₹0–₹100 / month**).

---

## 2. The Core Separation: Health vs. Observability vs. Audit vs. Analytics

To prevent architectural confusion, BP-CMS enforces strict boundaries across four distinct operational domains:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE FOUR OPERATIONAL DOMAINS                              │
├──────────────┬────────────────────────────┬────────────────────────────┬───────────────┤
│ Domain       │ Core Question Answered     │ Primary Consumers          │ Storage / SLA │
├──────────────┼────────────────────────────┼────────────────────────────┼───────────────┤
│ **HEALTH**   │ "Is the service or         │ Cloud Run Load Balancer,   │ Ephemeral     │
│              │ component available?"      │ Uptime Monitors, Ingress   │ (Live Probes) │
├──────────────┼────────────────────────────┼────────────────────────────┼───────────────┤
│ **OBSERV-    │ "What is happening right   │ Engineers, SREs, Studio    │ Cloud Logging │
│ ABILITY**    │ now, and where is failure?"│ Operators, Health Alerts   │ (30-day TTL)  │
├──────────────┼────────────────────────────┼────────────────────────────┼───────────────┤
│ **AUDIT**    │ "Who did what, when, and   │ Compliance, Studio Leads,  │ Firestore /   │
│              │ what exact data changed?"  │ Security Administrators    │ GCS (1 Year)  │
├──────────────┼────────────────────────────┼────────────────────────────┼───────────────┤
│ **ANALYT-    │ "How is published content  │ Educators, Content Leads,  │ Analytics DB  │
│ ICS**        │ performing with viewers?"  │ Executive Stakeholders     │ (Aggregates)  │
└──────────────┴────────────────────────────┴────────────────────────────┴───────────────┘
```

---

## 3. Canonical Audit Event Schema

Every business, security, workflow, and administrative mutation produces a canonical `AuditEvent` complying with the following schema:

```typescript
export interface AuditEvent {
  readonly auditEventId: string;    // AUD-YYYYMMDD-XXXXXX (256-bit entropy)
  readonly timestamp: string;       // ISO-8601 UTC timestamp
  readonly actor: {
    readonly actorId: string;       // User ID (e.g. USR-20261004-001) or 'SYSTEM'
    readonly actorName: string;     // Human-readable display name
    readonly actorRole: string;     // Canonical role at time of action
    readonly impersonatorId?: string; // Present if acting on behalf of another
  };
  readonly action: string;          // Dot-notated action (e.g. QUESTION.APPROVE)
  readonly resource: {
    readonly resourceType: string;  // QUESTION | SCRIPT | VIDEO | MEDIA | PUBLICATION | CONFIG
    readonly resourceId: string;    // Primary entity identifier
    readonly resourceVersion?: number; // Pre-mutation entity version
  };
  readonly context: {
    readonly requestId: string;     // REQ-YYYYMMDD-XXXXX
    readonly traceId: string;       // TRC-YYYYMMDD-XXXXX
    readonly ipAddress: string;     // Client IP address (sanitized for proxies)
    readonly userAgent: string;     // Client browser or service identity
    readonly workflowStep?: number; // 1 to 15 (if workflow-bound)
    readonly jobId?: string;        // Present if triggered via background job
    readonly aiRequestId?: string;  // Present if linked to AI generation
  };
  readonly result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  readonly reason?: string;         // Human or error explanation
  readonly stateChange?: {
    readonly changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION';
    readonly before?: Record<string, unknown> | null;
    readonly after?: Record<string, unknown> | null;
    readonly diff?: Record<string, unknown> | null; // Structured changed-fields map
  };
}
```

---

## 4. The Who / What / When / Context Model

Every audit entry rigorously captures six foundational dimensions:
1. **WHO:** Cryptographically verified actor identity (`actorId`, `actorRole`), distinguishing human creators from automated system workers and preventing repudiation.
2. **DID WHAT:** Canonical action verb matching the Stage 09 capability taxonomy (`QUESTION.CREATE`, `SCRIPT.APPROVE`, `MEDIA.UPLOAD`).
3. **TO WHAT:** Strict resource attribution (`resourceType`, `resourceId`) with entity version.
4. **WHEN:** Monotonically synchronized ISO-8601 UTC timestamp recorded by the authoritative server clock.
5. **FROM WHERE:** Network ingress context (`ipAddress`, `userAgent`, `origin`).
6. **IN WHAT CONTEXT:** Correlation tracking connecting the action to its originating `requestId`, distributed `traceId`, workflow step number, and asynchronous `jobId`.

---

## 5. The Before / After State Change Model

To optimize database storage while preserving forensic completeness:
- **CREATE Operations:** `before` is `null`; `after` captures the initial canonical payload.
- **UPDATE Operations:** `diff` captures only the modified fields:
  ```json
  {
    "diff": {
      "questionTextTelugu": {
        "before": "పాత ప్రశ్న పాఠ్యం...",
        "after": "సవరించిన ప్రశ్న పాఠ్యం..."
      },
      "estimatedDifficulty": {
        "before": "MEDIUM",
        "after": "HARD"
      }
    }
  }
  ```
- **DELETE Operations:** `before` stores the full final entity state before deletion; `after` is `null`.
- **WORKFLOW TRANSITIONS:** Captures previous workflow step, target step, and verifying reviewer identity.
- **ZERO UNCONTROLLED BLOB DUPLICATION:** Full documents are never cloned into audit records if a structured delta (`diff`) is sufficient.

---

## 6. Audit Event Taxonomy & Coverage

The audit subsystem enforces exhaustive coverage across 7 domain categories:

```text
┌──────────────────────┬────────────────────────────┬────────────────────────────────────┐
│ Category             │ Event Name                 │ Trigger Condition                  │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Identity / Sec**   │ `AUTH.LOGIN_SUCCESS`       │ User credentials verified          │
│                      │ `AUTH.LOGIN_FAILURE`       │ Invalid password or inactive user  │
│                      │ `AUTH.LOGOUT`              │ Explicit session termination       │
│                      │ `AUTH.SESSION_REVOKED`     │ Multi-device global session reset  │
│                      │ `AUTH.AUTHORIZATION_DENIED`│ Actor lacks required capability    │
│                      │ `USER.ROLE_CHANGED`        │ Administrator updates user role    │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Content**          │ `QUESTION.CREATED`         │ Step 01 draft question committed   │
│                      │ `QUESTION.EDITED`          │ Author updates question fields     │
│                      │ `QUESTION.APPROVED`        │ Verifier signs off in Step 02      │
│                      │ `QUESTION.REJECTED`        │ Verifier requests revisions        │
│                      │ `SCRIPT.DRAFTED`           │ Scriptwriter commits Step 03 take  │
│                      │ `SCRIPT.APPROVED`          │ Script verified in Step 04         │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Workflow**         │ `WORKFLOW.INITIALIZED`     │ New 15-step instance created       │
│                      │ `WORKFLOW.TRANSITION_ATT.` │ Actor requests step advancement    │
│                      │ `WORKFLOW.TRANSITION_SUCC.`│ Target step successfully activated │
│                      │ `WORKFLOW.TRANSITION_REJ.` │ Rule guard or capability failure   │
│                      │ `WORKFLOW.REVISION_REQ.`   │ Reviewer routes back to prior step │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Publishing**       │ `PUBLISH.PACKAGE_CREATED`  │ Metadata package sealed in Step 10 │
│                      │ `PUBLISH.DISPATCH_ATTEMPT` │ Outgoing call to YouTube/Meta API  │
│                      │ `PUBLISH.DISPATCH_SUCCESS` │ Live permalink verified in Step 12 │
│                      │ `PUBLISH.DISPATCH_FAILED`  │ Social API error or rate limit     │
│                      │ `PUBLISH.PLATFORM_SYNC`    │ Periodic status verification sync  │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Media**            │ `MEDIA.UPLOAD_INITIATED`   │ Creator begins Drive upload        │
│                      │ `MEDIA.TRANSCODE_SUCCESS`  │ FFmpeg vertical format validated   │
│                      │ `MEDIA.CHECKSUM_VERIFIED`  │ SHA-256 hash verified against disk │
│                      │ `MEDIA.CHECKSUM_MISMATCH`  │ Tamper alert; binary corrupted     │
│                      │ `MEDIA.ARCHIVED_TO_GCS`    │ Coldline archive copy confirmed    │
│                      │ `MEDIA.PURGED_FROM_DRIVE`  │ Working copy safely deleted        │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Assistive AI**     │ `AI.GENERATION_REQUESTED`  │ Actor triggers Gemini prompt       │
│                      │ `AI.GENERATION_COMPLETED`  │ LLM completion parsed & validated  │
│                      │ `AI.VALIDATION_FAILED`     │ Schema or Telugu orthography error │
│                      │ `AI.PROPOSAL_STAGED`       │ Candidate placed in `/proposals/`  │
│                      │ `AI.PROPOSAL_ACCEPTED`     │ Human accepts into canonical data  │
│                      │ `AI.PROPOSAL_EDITED`       │ Human modifies AI candidate        │
│                      │ `AI.PROPOSAL_REJECTED`     │ Human discards AI candidate        │
├──────────────────────┼────────────────────────────┼────────────────────────────────────┤
│ **Administration**   │ `CONFIG.PARAM_UPDATED`     │ System setting or timeout altered  │
│                      │ `DISASTER.RECOVERY_INIT`   │ GCS hourly snapshot restore run    │
└──────────────────────┴────────────────────────────┴────────────────────────────────────┘
```

---

## 7. Sensitive Data Redaction & Privacy Invariants

To guarantee that audit logs never become a vector for credential theft (AP-014):
1. **Strict Sanitization Filter:** Before any payload is written to `/audit_events` or Cloud Logging, it passes through a recursive sanitization filter.
2. **Redaction Keys:** Any key containing `password`, `secret`, `token`, `auth`, `credential`, `private_key`, `session_secret`, or `api_key` (case-insensitive) is replaced with `[REDACTED]`.
3. **Safe Identifier Exemption:** Keys explicitly representing safe tracing identifiers (e.g. `idempotencyKey`, `jobId`, `traceId`) are exempt from redaction.
4. **Never Log Session Cookies:** The `bp_session` cookie value is stripped at ingress before reaching application log formatters.

---

## 8. Immutability, Tamper Resistance & Retention

1. **Append-Only Ledger:** The Firestore `/audit_events` collection enforces append-only semantics. Client security rules and backend repositories strictly prohibit `update` and `delete` operations.
2. **Cryptographic Event ID:** Every event ID incorporates 128 bits of cryptographic entropy (`AUD-YYYYMMDD-XXXXXX`), preventing collision or forgery.
3. **Multi-Tier Retention Policy:**
   - **Hot Storage (Firestore):** Retained for **90 days** for instant querying in studio workspaces.
   - **Cold Archive (Google Cloud Storage):** Batched daily into compressed, immutable JSON files in a Coldline bucket with Object Lock (WORM: Write Once, Read Many) for **1 year**.
   - **Purge:** Records older than 365 days are pruned automatically via GCS Lifecycle Management.

---

## 9. Audit Access Control & Export (Stage 19 Alignment)

- **Viewing Access:** Querying `/api/v1/audit` requires the `AUDIT_VIEW` capability (assigned exclusively to `ADMIN` and `CURRICULUM_LEAD`).
- **Export Access:** Generating full audit CSV/JSON dumps requires `AUDIT_EXPORT` and is limited to administrative roles.
- **Tenant Isolation:** In multi-team studio configurations, creators may only view audit events where `actorId === currentUserId` or where they are the assigned reviewer.

---

## 10. Application Logging Architecture

BP-CMS adopts **Structured JSON Logging** formatted for automatic ingestion by Google Cloud Logging:

```json
{
  "severity": "INFO",
  "timestamp": "2026-10-04T03:06:15.120Z",
  "service": "bp-cms-api",
  "environment": "production",
  "requestId": "REQ-20261004-98124",
  "traceId": "TRC-20261004-8931af",
  "actorId": "USR-20261004-001",
  "operation": "QUESTION.APPROVE",
  "resource": "QUESTION:Q-20261004-001",
  "durationMs": 42,
  "message": "Question Q-20261004-001 approved by reviewer USR-20261004-001"
}
```

### 10.1 Standardized Severity Levels
- `DEBUG`: Verbose diagnostics, internal state machine transitions (disabled in production).
- `INFO`: Normal operational milestones (login success, batch completion, publishing dispatch).
- `WARN`: Recoverable anomalies, transient retries, degraded performance, 429 rate limits.
- `ERROR`: Unhandled exceptions, failed transactions, broken checksums, dead-letter jobs.

---

## 11. Error Observability & Canonical Error Model

Grounded in **Stage 15 (API Architecture)**:
All system failures produce a typed, structured diagnostic error:

```typescript
export interface DiagnosticErrorEnvelope {
  readonly errorCode: ApiErrorCode; // E.g. FORBIDDEN_LACKS_CAPABILITY
  readonly message: string;         // Safe client-facing description
  readonly requestId: string;       // Unique correlation identifier
  readonly timestamp: string;
  readonly path: string;
  readonly internalDetails?: {
    readonly stackSnippet?: string; // Captured in logs; NEVER sent to client in prod
    readonly failedConstraint?: string;
    readonly retryable: boolean;
  };
}
```
*Stack traces and raw database error strings are strictly contained within server-side logs and are never exposed in client API responses.*

---

## 12. Distributed Tracing & Request ID Propagation

Every incoming HTTP request, background worker task, and real-time event shares a unified correlation chain:

```text
CLIENT (Browser)                 EXPRESS INGRESS                  BACKGROUND WORKER (Cloud Tasks)
  │                                     │                                      │
  │  POST /api/v1/questions/generate    │                                      │
  │  [X-Request-ID: REQ-20261004-001]   │                                      │
  ├────────────────────────────────────►│ Generate TRC-20261004-001            │
  │                                     │ Logs with REQ & TRC                  │
  │                                     │ Schedules Task with TRC-20261004-001 │
  │                                     ├─────────────────────────────────────►│
  │  202 Accepted                       │                                      │ Worker inherits TRC
  │  { requestId: "REQ-...", traceId }  │                                      │ Logs execution with TRC
  │◄────────────────────────────────────┤                                      │ Emits SSE with TRC
  │                                     │                                      │ Emits Audit with TRC
```

- **Propagation Header:** `X-Request-ID` is extracted from incoming headers or generated on ingress (`REQ-YYYYMMDD-XXXXX`).
- **Distributed Trace ID:** `X-Trace-ID` or `TRC-YYYYMMDD-XXXXX` follows the operation across async boundaries, ensuring an operator can query one ID to see the entire lifecycle from web click to background completion.

---

## 13. Workflow Observability (The 15-Step Pipeline)

To detect where content is blocked across the 15 studio stages:
- **Stage Metrics:** For every active `WorkflowInstance`, the system tracks `currentStep`, `timeInCurrentStepSeconds`, and `rejectionCount`.
- **Bottleneck Detection:** If an asset remains in a review stage (e.g. Step 02 or Step 07) for $> 48\,\text{hours}$, a health alert flags the item on the Studio Operations Board.
- **Stage Transition Failure Logs:** Rejections, validation errors, and rule guard denials record the exact blocking constraint (e.g. `GAR-02: Self-approval rejected`).

---

## 14. Job Observability (Stage 17 Alignment)

Aligning with the **Stage 17 Job Architecture**:
- **Execution Monitoring:** Tracks active jobs across `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_FATAL`, `TIMED_OUT`, and `CANCELLED`.
- **Stuck Job Detection:** Watchdogs detect jobs where `state === 'RUNNING'` and `leaseExpiresAt < NOW()`, re-queueing them or flagging them as `STUCK_WORKER_FAILURE`.
- **Dead-Letter Queue (DLQ) Visibility:** Terminal failures (`FAILED_FATAL`) record full error diagnostics to `/job_dlq` for administrative re-drive.

---

## 15. Media Observability (Stage 14 Alignment)

- **Ingestion Tracking:** Monitors upload durations, Google Drive API quotas, and FFmpeg transcode times.
- **Integrity Alarms:** Any failure during SHA-256 verification immediately triggers a `CRITICAL` alert: `MEDIA_CHECKSUM_TAMPER_DETECTED`.
- **Broken Reference Monitor:** Nightly audit script scans active questions to verify that linked Google Drive IDs resolve to accessible files.

---

## 16. AI Subsystem Observability (Stage 18 Alignment)

The observability engine monitors LLM health without violating privacy:
- **Tri-State Diagnostic Separation:**
  $$\mathbf{AI\ PROVIDER\ FAILURE} \neq \mathbf{SCHEMA\ VALIDATION\ FAILURE} \neq \mathbf{HUMAN\ REJECTION}$$
- **Token Metering:** Logs `promptTokens`, `candidateTokens`, and `latencyMs` for every call.
- **Safety Blocks:** Captures rate-limit blocks (HTTP 429) and content filter triggers to track prompt stability.

---

## 17. Performance Observability & Latency Thresholds

System operations are benchmarked against explicit latency targets:

```text
┌──────────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Operation Category           │ Target (p50) │ Warning(p95) │ Critical(p99)│
├──────────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Standard API GET (Metadata)  │ < 100 ms     │ > 300 ms     │ > 1,000 ms   │
│ Mutating POST / PUT          │ < 250 ms     │ > 600 ms     │ > 2,000 ms   │
│ Firestore Document Read      │ < 20 ms      │ > 80 ms      │ > 250 ms     │
│ Asynchronous Job Queue Delay │ < 1.0 s      │ > 5.0 s      │ > 15.0 s     │
│ Video Transcode (60s Short)  │ < 30.0 s     │ > 60.0 s     │ > 120.0 s    │
│ Gemini 2.5 Flash Generation  │ < 2.5 s      │ > 6.0 s      │ > 15.0 s     │
│ SSE Realtime Event Fan-Out   │ < 10 ms      │ > 50 ms      │ > 200 ms     │
└──────────────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 18. Health & System Signals

BP-CMS exposes standard lightweight health endpoints:
- `GET /health/live` (Liveness Probe): Returns `200 OK` if the Express process is responsive.
- `GET /health/ready` (Readiness Probe): Verifies connectivity to Cloud Firestore, Google Drive API status, and environment secret availability.
- **Subsystem Status Map:** Exposes live operational states for internal administrative dashboards:
  `{ database: 'UP', drive: 'UP', gemini: 'UP', cloudTasks: 'UP' }`.

---

## 19. Alerting Architecture & Fatigue Mitigation

To prevent notification spam, alerting rules enforce **anomaly thresholds** over rolling time windows:

```text
┌──────────────────────────────┬──────────────────┬──────────────┬───────────────┐
│ Incident Trigger             │ Anomaly Rule     │ Severity     │ Channel       │
├──────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ Brute Force Login Attack     │ > 10 auth fails  │ WARNING      │ In-App Toast, │
│                              │ in 5 minutes     │              │ Admin Audit   │
├──────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ Elevated API 5xx Rate        │ > 2% 5xx errors  │ HIGH         │ Cloud Monitor,│
│                              │ over 5 minutes   │              │ Email Alert   │
├──────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ Media Checksum Tampering     │ 1 SHA-256 failure│ CRITICAL     │ Immediate     │
│                              │                  │              │ Admin Alert   │
├──────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ AI Free-Tier Exhaustion      │ > 12 RPM or      │ WARNING      │ Circuit Break,│
│                              │ > 1,200 req/day  │              │ Lead Toast    │
├──────────────────────────────┼──────────────────┼──────────────┼───────────────┤
│ Dead-Letter Job Accumulation │ > 3 fatal jobs   │ HIGH         │ Admin Queue   │
│                              │ in 1 hour        │              │ Notification  │
└──────────────────────────────┴──────────────────┴──────────────┴───────────────┘
```

---

## 20. Security & Access Boundaries (Stage 19 Alignment)

- Diagnostic logs and error traces are restricted to authorized administrators (`ADMIN` role).
- Audit records cannot be modified or purged through application APIs.
- Real-time error toasts shown to users display sanitized messages, never raw system exceptions.

---

## 21. Analytics Boundary (Stage 20 Alignment)

The architecture preserves the strict distinction:
$$\mathbf{OPERATIONAL\ OBSERVABILITY\ \neq\ BUSINESS\ CONTENT\ ANALYTICS}$$
- **Observability:** Measures internal system performance (API response times, queue latencies, transcode failure rates).
- **Business Analytics:** Measures external audience engagement (viewer counts, watch time, 3-second retention drop-offs).
- They share tracing identifiers (`contentId`, `publicationId`), but reside in independent collections and services.

---

## 22. Cost Architecture & Free-Tier Budget Proof

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.
- **Google Cloud Logging:** Provides **50 GB / month free**, perpetually. BP-CMS structured logging generates $\approx 1.5\text{ GB / month}$ ($< 3\%$ of free allowance) = **₹0.00 / month**.
- **Cloud Monitoring & Health Checks:** Basic metric collection and uptime checks operate within Google Cloud free tier = **₹0.00 / month**.
- **Firestore Audit Storage:** 90-day hot retention consumes $\approx 5,000$ documents ($\approx 2.5\text{ MB}$) = **₹0.00 / month**.
- **Total Audit & Observability Infrastructure Cost:** **₹0.00 / month** (100% Free-Tier Compliant).

---

## 23. Comprehensive Testing Architecture

Stage 24 and Stage 28 must implement the following 16 architectural test suites:
1. `TEST-AUD-01`: Canonical audit record emitted on every mutating state change.
2. `TEST-AUD-02`: Sensitive fields (`password`, `token`, `secret`) sanitized to `[REDACTED]`.
3. `TEST-AUD-03`: `requestId` and `traceId` propagate seamlessly from HTTP to background worker.
4. `TEST-AUD-04`: Before and after diff accurately captures modified entity fields.
5. `TEST-AUD-05`: Non-admin users rejected when querying `/api/v1/audit`.
6. `TEST-AUD-06`: Audit collection rejects client `update` and `delete` operations.
7. `TEST-AUD-07`: High-severity error triggers structured JSON logging with error code.
8. `TEST-AUD-08`: Workflow transition failure logs exact rejected business constraint.
9. `TEST-AUD-09`: Dead-letter job automatically recorded to `/job_dlq` with stack snippet.
10. `TEST-AUD-10`: Media SHA-256 failure triggers `CRITICAL` audit alert.
11. `TEST-AUD-11`: AI logging captures token counts, latency, and model identifier.
12. `TEST-AUD-12`: AI provider failure distinguished from schema validation failure.
13. `TEST-AUD-13`: Uptime probes (`/health/live`, `/health/ready`) return `200 OK`.
14. `TEST-AUD-14`: Brute force auth attempts trigger rate-limiting and audit alerts.
15. `TEST-AUD-15`: Structured logs format correctly for Cloud Logging ingestion.
16. `TEST-AUD-16`: Monthly audit log volume stays strictly within 50 GB free-tier allowance.

---

## 24. Migration & Brownfield Implications

- Replaces legacy Google Sheets `AuditService.log()` calls with structured writes to the native Firestore `/audit_events` collection.
- Standardizes unstructured `console.log()` statements into JSON format with `severity`, `requestId`, and `traceId`.
- Preserves existing historical audit logs from Google Sheets via a read-only compatibility layer.

---

## 25. Open Decisions & Decision Register

### 25.1 Audit Decision Register (ADR-AUD)
- **ADR-AUD-01:** Adopt Google Cloud Logging structured JSON format as the primary application logging standard.
- **ADR-AUD-02:** Enforce the 90-day hot (Firestore) / 1-year cold (GCS WORM) tiered audit retention policy.
- **ADR-AUD-03:** Store structured field deltas (`diff`) rather than cloning full entity documents on updates.
- **ADR-AUD-04:** Strictly enforce server-side sensitive credential redaction across all logs and audit events.

### 25.2 Conflict Register (JACR-AUD)
- **JACR-AUD-01 (Resolved):** *Client-Side vs. Server-Side Request ID Generation.*
  - **Resolution:** Client may provide an `X-Request-ID` header; however, the backend server validates and overrides it with a cryptographically unique `REQ-YYYYMMDD-XXXXX` identifier if absent or malformed.

---

## 26. Stage 21 Acceptance Criteria & Anti-Overclaim Confirmation

### 26.1 Acceptance Criteria Checklist
- [x] Dual-concern boundary explicitly defined: Audit ("What happened?") vs. Observability ("Is it working?").
- [x] Canonical `AuditEvent` schema specified with Who/What/When/Context model.
- [x] Before/After state change and diffing rules established.
- [x] Comprehensive 7-category audit taxonomy documented.
- [x] Sensitive credential redaction and privacy invariants defined.
- [x] Structured JSON application logging with standard severity levels specified.
- [x] Request ID and distributed Trace ID propagation contracts established.
- [x] Subsystem observability defined for Workflow, Jobs, Media, AI, and Security.
- [x] Performance latency targets, health probes, and alerting thresholds specified.
- [x] Operational Observability decoupled from Business Content Analytics.
- [x] ₹0.00 / month cost compliance proven under Cloud Logging free tier.
- [x] Zero runtime code files modified during Stage 21.

### 26.2 Final Anti-Overclaim Statement
**Stage 21 audit and observability architecture is documented and contractually defined; runtime audit middleware, structured log formatters, and monitoring integrations remain for later implementation stages.**
