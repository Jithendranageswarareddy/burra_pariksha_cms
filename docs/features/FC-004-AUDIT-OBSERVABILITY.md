# FEATURE CONTRACT: FC-004-AUDIT-OBSERVABILITY

## 1. Feature Identity
- **Feature ID**: FC-004
- **Feature Name**: Audit Ledger & Observability
- **Business Area**: Foundation / Audit & Observability
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P0 (Blocker)
- **Owner / Domain**: Observability & Compliance Context
- **Related Workflow Stage(s)**: Universal (Audits all 15 workflow steps)

---

## 2. Requirement
- **Business Requirement**: BR-009 (System Integrity, Audit & Multi-User Governance) & NFR-005 (Auditability & Observability).
- **User Problem**: Without an immutable audit trail and structured observability, administrative teams cannot investigate editorial errors, verify state transitions, diagnose production failures, or trace security incidents.
- **Business Purpose**: Provide an authoritative, immutable 7-dimensional audit ledger answering *"Who did what to what, when, from where, with what before/after state"* coupled with Google Cloud Logging-compliant structured telemetry and liveness/readiness probes.
- **Expected Capability**:
  - `IAuditDispatcher` interface decoupled from concrete storage for zero-dependency testability.
  - Canonical 7-dimensional `AuditEvent` schema stored in Firestore `audit_events` collection.
  - Express correlation ID middleware (`X-Request-Id`, `X-Trace-Id`) propagating trace context across all requests.
  - Structured JSON logger emitting standard Cloud Logging payloads (`severity`, `message`, `httpRequest`, `labels`).
  - Standardized health endpoints (`GET /healthz`, `GET /readyz`).
- **Scope**: Audit event dispatcher, Firestore audit writer, structured logger, trace middleware, health probes.
- **Explicit Non-Scope**: Advanced log querying dashboards or external ELK infrastructure.

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Every state transition or critical mutation produces an immutable audit record in `audit_events`.
  - Every application log line contains `requestId`, `timestamp`, `severity`, and sanitized metadata.
  - `GET /healthz` returns HTTP 200 with `{ status: "ok" }` when server is running.
  - `GET /readyz` returns HTTP 200 with database connectivity status.
- **Validation Acceptance**:
  - Missing mandatory audit fields (`actorId`, `action`, `resourceId`) throws runtime error before committing mutation.
- **Authorization Acceptance**:
  - Only `SuperAdmin` and `Admin` roles can query the audit trail API (`GET /api/v1/audit/events`).
- **Security Acceptance**:
  - Audit records cannot be modified or deleted via any API endpoint (append-only ledger).
  - Passwords, tokens, API keys, and PII are redacted from log outputs.
- **Performance Acceptance**:
  - Audit dispatching executes asynchronously in background or non-blocking batch to add $< 3\text{ms}$ to request lifecycle.
- **Cost Acceptance**:
  - Cloud Logging payload sizes strictly constrained to remain within GCP 50GB free tier.

---

## 4. Domain Entities
- **Entities Involved**: `AuditEvent`, `AuditActor`, `AuditResource`, `HealthStatus`.
- **Entity Ownership**: Compliance & Observability Domain.
- **Relationships**: `AuditEvent` references `actorId` and `resourceId`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: ALL fields in `AuditEvent` are strictly immutable upon creation.
- **Mutable Fields**: None (Append-only).
- **Lifecycle**: `Recorded` $\to$ `Archived` (after 365 days).

---

## 5. Database / Data Contract
- **Collections Involved**: `audit_events`.
- **Document Structure**:
  ```typescript
  export interface AuditEventDocument {
    id: string; // aud_ + UUIDv4
    actorId: string;
    actorRole: string;
    action: string; // E.g., QUESTION_VERIFIED, ROLE_UPDATED
    resourceType: string; // E.g., question, script, video
    resourceId: string;
    timestamp: string; // ISO 8601 UTC
    ipAddress?: string;
    userAgent?: string;
    requestId: string;
    workflowStep?: number;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    status: 'SUCCESS' | 'FAILURE';
    errorMessage?: string;
  }
  ```
- **Indexes**: Composite index on `(resourceType, resourceId, timestamp DESC)` and `(actorId, timestamp DESC)`.
- **Source of Truth**: Firestore `audit_events` collection.

---

## 6. API Contract
### 6.1 `GET /api/v1/audit/events`
- **Authentication**: Required.
- **Required Capability**: `AUDIT_VIEW` (`SuperAdmin`, `Admin`).
- **Query Parameters**: `resourceType`, `resourceId`, `actorId`, `startDate`, `endDate`, `page`, `limit`.
- **Response Schema**: `ApiResponseEnvelope<{ events: AuditEventDocument[] }>`.

### 6.2 `GET /healthz` & `GET /readyz`
- **Authentication**: Public.
- **Response**: `{ status: "ok", uptime: number, timestamp: string }`.

---

## 7. Frontend Contract
- **Canonical Route**: `/admin/audit` (Audit Log Explorer).
- **Allowed Roles / Capabilities**: `SuperAdmin`, `Admin`.
- **UI Behavior**: Searchable, filterable table displaying chronological audit history with diff viewer for `beforeState` vs. `afterState`.

---

## 8. RBAC / Capability Contract
- **`AUDIT_VIEW`**: Required to read audit logs.
- **No Role** (including SuperAdmin) possesses capability to delete or alter audit logs.

---

## 9. Workflow Contract
- **Universal Hook**: Whenever a workflow engine state transition executes, an audit event is automatically created and queued for persistence before returning HTTP 200.

---

## 10. Validation Contract
- **Schema Validation**: Validated via `AuditEventSchema` Zod object.
- **Sanitization**: Automatic stripping of fields named `password`, `token`, `secret`, `authorization`.

---

## 11. Error Contract
- `401 UNAUTHORIZED`: Unauthenticated request to audit endpoints.
- `403 FORBIDDEN`: Non-admin requesting audit trail.
- `503 SERVICE_UNAVAILABLE`: `/readyz` fails if Firestore connection is severed.

---

## 12. Audit Contract
- Self-referential: Inquiring about audit logs generates an audit event: `AUDIT_LOG_ACCESSED`.

---

## 13. Realtime Contract
- **Applicable**: Realtime SSE bus optionally broadcasts `audit.security_alert` to admin sessions for high-risk operations (e.g. bulk deletion, role elevation).

---

## 14. Job / Async Contract
- **Background Flusher**: Audit events can be buffered in memory and flushed in batches of 50 to conserve Firestore write operations.

---

## 15. AI Contract
- **Applicable**: All AI suggestions accepted by humans explicitly log `action: "AI_SUGGESTION_ACCEPTED"` with the AI prompt and proposal ID.

---

## 16. Media Contract
- **Applicable**: Media upload tickets, deletions, and checksum verifications generate audit events.

---

## 17. Analytics Contract
- **Applicable**: Audit events provide the source data for team productivity and turnaround time metrics.

---

## 18. Security Contract
- **Tamper Evidence**: Hash chaining / monotonic sequence counters can be verified for integrity.
- **Zero Exposure**: Client IP addresses are truncated/masked in compliance with privacy regulations where necessary.

---

## 19. Observability Contract
- **Structured Logger**: Standard logger outputting single-line JSON with Google Cloud Logging `severity` levels (`INFO`, `WARN`, `ERROR`, `CRITICAL`).
- **Error Capture**: Unhandled rejections emit `ERROR` severity log with full stack trace and correlation ID.

---

## 20. Cost Contract
- **Budget Compliance**: Stays within Firestore Spark free tier write limits ($\le 20,000$ writes/day) via batching. Free Google Cloud Logging tier provides 50GB/month (CMS generates $< 1\text{GB/month}$). Expected cost: ₹0.00.

---

## 21. Migration Contract
- **Legacy Systems**: Current Apps Script logs to spreadsheet cells. Audit events will be created prospectively; historical spreadsheet logs can be imported via batch script.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-AUD-01`: `IAuditDispatcher` buffers and formats 7-dimensional audit records.
  - `TC-AUD-02`: Sensitive fields are redacted from payload before dispatch.
  - `TC-AUD-03`: Structured logger produces compliant Cloud Logging JSON.
- **Integration Tests**:
  - `TC-AUD-04`: State transition automatically records document in `audit_events`.
  - `TC-AUD-05`: `/healthz` and `/readyz` endpoints return correct health status.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001 (Auth context), FC-002 (RBAC), FC-003 (Database & API envelope).
- **Stage 25 Node**: `D-19 (Audit Subsystem)`, `D-29 (Observability)`.
- **Downstream Consumers**: All workflow features (FC-005 through FC-022).

---

## 24. Implementation Sequence
1. Define `AuditEvent` interface and Zod schema (`src/types/audit.ts`).
2. Implement `IAuditDispatcher` interface and in-memory mock dispatcher.
3. Implement `FirestoreAuditDispatcher` for production.
4. Implement trace ID and structured logging middleware (`src/lib/logger.ts`).
5. Implement `/healthz` and `/readyz` route handlers.
6. Implement `/api/v1/audit/events` admin endpoint.
7. Verify against `TC-AUD-01..05`.

---

## 25. Deployment Contract
- **Required Env Vars**: `LOG_LEVEL` (default `info`), `ENABLE_AUDIT_BATCHING` (default `false` in development).

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Audit collections are append-only and backward compatible.

---

## 27. Feature Completion Criteria
- [ ] 7-dimensional audit schema fully implemented and validated.
- [ ] `X-Request-Id` propagated on all requests.
- [ ] Structured JSON logging output verified against Cloud Logging schema.
- [ ] `/healthz` and `/readyz` return 200 in healthy state.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully aligned with Stage 21.

---

## 29. Traceability
- **Stage 01**: BR-009, NFR-005
- **Stage 02**: DAC-001, DAC-006
- **Stage 04**: Audit Invariant P-04
- **Stage 13**: `audit_events` collection schema
- **Stage 15**: `/healthz`, `/readyz`, `/api/v1/audit/*`
- **Stage 19**: Security & Tamper Proofing
- **Stage 21**: Authoritative Audit & Observability Architecture
- **Stage 22**: Cloud Logging 50GB Free Tier
- **Stage 25**: Nodes `D-19`, `D-29`
