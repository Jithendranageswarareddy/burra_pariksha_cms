# Burra Pariksha CMS
# 21 — Audit & Observability Architecture

Stage: 21 — Audit & Observability Architecture

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative Audit & Observability Architecture for the Burra Pariksha Content Management System (BP-CMS). Formally codifies:
1. **The Forensic Audit Pillar (AP-014):** Immutably captures the 7 mandatory dimensions of every state mutation: `Who`, `Did What`, `To What`, `When`, `From Where/Context`, `Before`, and `After`.
2. **The Observability Pillar:** Defines structured JSON logging, error taxonomy, request tracing (`X-Request-ID`), and health check probes (`/healthz`, `/readyz`).
3. **Failure Domain Telemetry:** Dedicated failure detection and diagnostics covering Workflow transitions, Stage 17 Background Jobs, Stage 14 Media ingestion/hashing, and Stage 18 Gemini AI operations.
4. **Zero-Cost Telemetry Proof (COST-001, AP-012):** Utilizes Google Cloud Logging's 50 GiB/month free tier with standard `stdout`/`stderr` serialization and Firestore `audit_events` storage, guaranteeing ₹0.00/month operational costs.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 21 Audit & Observability Architecture | FACT |
| **File Path** | `docs/architecture/21-AUDIT-OBSERVABILITY.md` | FACT |
| **Document Stage** | Stage 21 — Audit & Observability Architecture | FACT |
| **Authority** | Authoritative Audit & System Health Specification (AP-014) | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 20 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 22+ (Physical Backend Services, Data Access Layer, Express Controllers) | FACT |
| **Baseline Repository Commit** | `429b417` | FACT |
| **Architectural Scope** | Formally specifies audit schemas, structured logging, failure telemetry, and health probes without paid APM tools | FACT |

---

## 02. Pillar 1: The 7 Forensic Audit Dimensions (AP-014)

Every state-changing mutation in BP-CMS creates an immutable document in the `audit_events` Firestore collection capturing:

| Dimension | Field Name | Type / Structure | Description & Governance Rule |
| :--- | :--- | :--- | :--- |
| **1. Who** | `who` | `AuditActor` | `actorId` (e.g. `USR-000102`), `actorRole`, `isAiAgent`, `authScheme`. |
| **2. Did What** | `didWhat` | `AuditAction` | Canonical `action` (e.g. `QUESTION_REVIEW:VERIFY`), required `capability`. |
| **3. To What** | `toWhat` | `AuditTarget` | `targetEntity` (e.g. `Question`), `targetEntityId`, `collection`. |
| **4. When** | `when` | `AuditTimestamp` | `timestampISO` (UTC), `epochMs`. |
| **5. From Where / Context** | `fromWhere` | `AuditContext` | `ipAddress`, `userAgent`, `workspaceHub`, `requestId`, `correlationId`. |
| **6. Before** | `before` | `Record<string, unknown> \| null` | State snapshot prior to mutation (or `null` on entity creation). |
| **7. After** | `after` | `Record<string, unknown> \| null` | State snapshot after mutation (or `null` on entity deletion). |
| **Diff** | `diff` | `Record<string, { from: unknown, to: unknown }>` | Computed delta between before and after states. |

### Invariant: Non-Repudiation
Audit documents are strictly append-only. Firestore security rules and backend repositories categorically reject update (`PATCH`/`PUT`) and delete (`DELETE`) operations on the `audit_events` collection.

---

## 03. Pillar 2: System Observability Framework

### 3.1 Structured Logging (Google Cloud Logging Standard)
Logs are serialized as single-line JSON to `stdout` (for `INFO`/`DEBUG`) and `stderr` (for `WARN`/`ERROR`/`CRITICAL`):
```json
{
  "severity": "INFO",
  "message": "Step 02 Question Verification completed successfully",
  "timestamp": "2026-10-02T22:30:00.000Z",
  "component": "WORKFLOW_ENGINE",
  "requestId": "REQ-20261002-abc12345",
  "correlationId": "CORR-20261002-xyz987",
  "context": {
    "questionId": "BP-Q-000412",
    "reviewerId": "USR-000102",
    "status": "APPROVED"
  }
}
```

### 3.2 The 4 Failure Telemetry Domains
1. **Workflow Failures:** Tracks illegal jump attempts, prerequisites failures (`AP-005`), and transitions to `BLOCKED`.
2. **Background Job Failures:** Monitors Stage 17 Cloud Tasks retries, timeouts, and transitions to Dead-Letter Queue (`FAILED_FATAL`).
3. **Media Failures:** Detects Google Drive API 403/429 limits, upload dropouts, and SHA-256 checksum mismatches.
4. **AI Generation Failures:** Captures Gemini API 429 rate limit events, Zod schema validation errors, and safety filter blocks.

---

## 04. Health Probes & System Readiness

- **Liveness Probe (`GET /healthz`):** Verifies the Node.js Express process is responsive and event loop latency is within acceptable limits ($<100\text{ms}$).
- **Readiness Probe (`GET /readyz`):** Deep health inspection verifying active connectivity to:
  1. Firestore Native Hybrid DB (`ping` write/read test)
  2. Google Drive API (token freshness check)
  3. Stage 16 Realtime EventBus (listener count check)
  4. Stage 18 Gemini AI API (configuration check)

---

## 05. Zero-Cost Financial Analysis (`COST-001`, `AP-012`)

- **Google Cloud Logging Free Tier:** 50 GiB/month free ingestion.
- **Estimated Log Volume:**
  - 1 to 5 questions/day = ~500 operations/day $\approx$ 5,000 log entries/day.
  - Average log size: 500 bytes $\approx$ 2.5 MB/day $\approx$ **75 MB/month** ($<0.15\%$ of the 50 GiB free quota).
- **Operating Cost:** **₹0.00 INR / month**. Zero paid APM services.

---

## 06. Architectural Deferral Declaration
All physical Express route controller execution implementations, Google Cloud Logging agent daemons, and Prometheus metric exporters are **EXPLICITLY DEFERRED** to subsequent implementation stages (Stage 22+ Physical Backend Services). Stage 21 authoritatively establishes audit contracts, structured log schemas, failure telemetry models, and verification tests.
