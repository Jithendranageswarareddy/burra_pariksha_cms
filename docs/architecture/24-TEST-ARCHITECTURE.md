# 24 — TEST ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 24 of 30-Stage Modernization Program — Comprehensive Multi-Tier Testing Pyramid, 15×9 Workflow Matrix, Security Proofs, Concurrency Verification & Quality Gates

```
================================================================================
Document ID:       BP-ARCH-24-TEST-ARCHITECTURE
Version:           24.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             9-Level Testing Pyramid, Canonical 15×9 Workflow Matrix (135 Scenarios),
                   Empirical Baseline Audit (0% Automated Coverage Ground Truth),
                   Unit, Component, Integration, API, Security, E2E, Human & Smoke Specs,
                   Deterministic Test Data Architecture, Failure/Recovery Taxonomy,
                   Concurrency & OCC Testing, Test Gates & ₹0–₹100 Financial Governance
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md (BR-001..011, NFR-001..008)
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md (DAC-001..006, CAC-001..005)
                   03-CURRENT-SYSTEM-BASELINE.md (Zero Automated Tests Discovered)
                   04-ARCHITECTURE-PRINCIPLES.md (P-15 Testability Axiom)
                   05-TARGET-SYSTEM-BOUNDARY.md (Zero Microservices Test Scope)
                   06-DOMAIN-MODEL.md (10 Bounded Context Verification Boundaries)
                   07-CANONICAL-15-STEP-WORKFLOW.md (15 Manufacturing Steps)
                   08-STATE-MODEL.md (5-Dimensional State Verification)
                   09-RBAC-CAPABILITY-MODEL.md (GAR-02 Anti-Self-Approval Enforcement)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md (8 Studio Hubs)
                   11-PAGE-ROUTE-CONTRACT.md (14 Canonical Routes & Aliases)
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Spark Verification)
                   13-DATA-MODEL-DATA-CONTRACT.md (28 Canonical Collections)
                   14-MEDIA-ARCHITECTURE.md (Tri-Layer Media & SHA-256 Checksums)
                   15-API-CONTRACT.md (Universal REST Envelopes & Error Codes)
                   16-REALTIME-ARCHITECTURE.md (Server-Sent Events & Polling Fallback)
                   17-JOB-ASYNC-ARCHITECTURE.md (Cloud Tasks & Worker Idempotency)
                   18-AI-ARCHITECTURE.md (Human-Gated Gemini Assistive Pipeline)
                   19-SECURITY-ARCHITECTURE.md (Zero-Trust Session & RBAC Proofs)
                   20-ANALYTICS-ARCHITECTURE.md (Operational vs. Analytical Segregation)
                   21-AUDIT-OBSERVABILITY.md (Canonical Audit Ledger & Cloud Logging)
                   22-COST-ARCHITECTURE.md (₹0.00 Baseline, ₹100.00 Monthly Ceiling)
                   23-MIGRATION-ARCHITECTURE.md (7-Phase Strangler Fig Parity Gates)
Downstream Stages: 25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Core Axiom:        Build Validation (tsc/build) ≠ Behavioral Testing.
                   Documentation Complete ≠ Implementation Verified.
                   Frontend Permission Tests = UX Proof; Backend Authorization Tests = Security Proof.
15×9 Matrix:       Mandatory 135 explicit test conditions across all 15 workflow stages.
Budget Invariant:  Strictly maintain Stage 22 ₹0–₹100 INR/month financial constraint.
================================================================================
```

---

## 1. Testing Objectives & Governance Axioms

Testing must exist conceptually, contractually, and structurally before large-scale implementation begins. The objective of the BP-CMS Test Architecture is to define how the system will scientifically prove that it behaves correctly, securely, reliably, and within budget across its entire operational lifecycle.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      THE FOUR TESTING AXIOMS                           │
├────────────────────────────────────────────────────────────────────────┤
│ Axiom 1: Build Validation ≠ Behavioral Testing                         │
│   A successful TypeScript compilation (`tsc --noEmit`) and production │
│   bundle build (`vite build && esbuild`) proves only syntax and type   │
│   resolution. It proves NOTHING about runtime correctness, business    │
│   logic, authorization enforcement, or race-condition handling.        │
│                                                                        │
│ Axiom 2: Documentation Complete ≠ Implementation Verified              │
│   Documenting an architecture stage does not mean the system functions.│
│   Only executable, automated test suites and human acceptance testing  │
│   can verify that runtime behavior conforms to architectural design.   │
│                                                                        │
│ Axiom 3: Frontend Tests = UX Proof; Backend Tests = Security Proof     │
│   Disabling a button or hiding a route in React proves only UX intent. │
│   It provides ZERO security. Backend authorization tests must prove   │
│   that forged API requests are rejected with HTTP 401 or 403.          │
│                                                                        │
│ Axiom 4: Zero Paid Test Infrastructure (COST-001 / AP-012)             │
│   Test suites must execute locally or within free CI allotments using  │
│   emulators, fakes, and mocks. Tests must never incur cloud bills.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Empirical Current-State Test Baseline

In strict adherence to the mandate to inspect the real repository rather than relying on abstract assumptions, an exhaustive empirical audit of `Jithendranageswarareddy/burra_pariksha_cms` at commit `d6ce566` establishes the following ground truth:

```
===========================================================================================================================================
                                       EMPIRICAL REPOSITORY TEST AUDIT (GROUND TRUTH)
===========================================================================================================================================
| Inspection Dimension             | Discovered Reality in Codebase            | Evaluation & Architectural Implication             |
| :---                             | :---                                      | :---                                               |
| **Automated Tests Existing**     | **0 automated tests**                     | Not a single test file exists in the repository.   |
| **Test Files in Repository**     | **0 test files** (`*test*`, `*spec*`)     | Zero `.test.ts`, `.spec.ts`, or test directories.  |
| **Test Runner in package.json**  | **NONE**                                  | No Vitest, Jest, Mocha, Playwright, or Cypress.    |
| **Test Scripts in package.json** | **NONE**                                  | Scripts: `dev`, `build`, `start`, `preview`, `lint`.|
| **Executable Tests Today**       | **0 tests runnable**                      | No command exists to verify application behavior.  |
| **Automated Coverage**           | **0.00% across all modules**              | Every domain, controller, and UI component is 0%.  |
| **CI Configuration**             | **NONE** (`.github/workflows` missing)    | No automated CI pipeline executes on Git push.     |
| **Existing Diagnostic Scripts**  | 2 diagnostic scripts in `scripts/`        | `verify-drive-state.ts`, `verify-gcs-state.ts`.     |
| **Evaluation of Scripts**        | Manual diagnostic probes only             | They print console logs; they assert zero tests.   |
===========================================================================================================================================
```

### 2.1 Distinction: Baseline Reality vs. Target Architecture
- **Current Brownfield Reality:** The codebase currently possesses **zero automated tests**, zero test runners, and zero test infrastructure. A passing build (`npm run build`) is the only quality gate currently active.
- **Target Test Architecture (Stage 24):** Establishes the authoritative multi-tier verification contract, canonical test pyramid, 15×9 matrix, and test gates that Stages 25 through 28 will implement.

---

## 3. The Authoritative 9-Level Testing Pyramid

BP-CMS structures verification across a rigorous 9-level testing pyramid. Tests are not interchangeable; each level possesses an explicit purpose, execution speed, and failure boundary:

```text
                              ┌─────────────────────────┐
                              │ PRODUCTION VERIFICATION │  Level 9: Live Post-Deploy Smoke
                           ┌──┴─────────────────────────┴──┐
                           │    HUMAN ACCEPTANCE (UAT)     │  Level 8: Manual Editorial Sign-Off
                        ┌──┴───────────────────────────────┴──┐
                        │      END-TO-END (PLAYWRIGHT)        │  Level 7: Complete Browser Journeys
                     ┌──┴─────────────────────────────────────┴──┐
                     │         SECURITY & RBAC AUDIT             │  Level 6: Auth, Privilege Escalation
                  ┌──┴───────────────────────────────────────────┴──┐
                  │          WORKFLOW STATE MACHINE                 │  Level 5: 15-Step Gate Transitions
               ┌──┴─────────────────────────────────────────────────┴──┐
               │              API CONTRACT ENVELOPES                   │  Level 4: Universal REST Envelopes
            ┌──┴───────────────────────────────────────────────────────┴──┐
            │               INTEGRATION (EMULATORS)                       │  Level 3: Inter-Module Wiring
         ┌──┴─────────────────────────────────────────────────────────────┴──┐
         │                 COMPONENT (REACT TESTING)                         │  Level 2: UI Render, States & UX
      ┌──┴───────────────────────────────────────────────────────────────────┴──┐
      │                      UNIT (DETERMINISTIC LOGIC)                          │  Level 1: Pure Functions, Schemas
      └──────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Pyramid Level Responsibilities & Failure Ownership

| Level | Testing Layer | Scope & Responsibility | Typical Execution Time | Failure Classification & Boundary |
| :---: | :--- | :--- | :---: | :--- |
| **L1** | **Unit Tests** | Pure business functions, validators, Zod schemas, state transition rules, metric calculations, ID parsing. | < 5 ms / test | Algorithmic error, schema mismatch, calculation bug. |
| **L2** | **Component Tests** | React component rendering, loading/empty/error states, form validation, permission UX, dialogs. | < 50 ms / test | Broken UI layout, unhandled state, missing ARIA role. |
| **L3** | **Integration Tests** | Service-to-repository wiring, Firestore emulator persistence, Cloud Tasks worker queues, in-memory caches. | < 250 ms / test | Broken contract, query failure, database schema drift. |
| **L4** | **API Contract Tests** | Universal REST envelopes, HTTP status codes, Zod body parsing, pagination, error responses, idempotency. | < 100 ms / test | Contract regression, missing header, invalid envelope. |
| **L5** | **Workflow Tests** | Sequential 15-step transitions, gate preconditions, role permissions, anti-self-approval (`GAR-02`), OCC. | < 150 ms / test | Invalid step skip, illegal gate approval, race condition. |
| **L6** | **Security Tests** | Session tokens, cookie security, vertical/horizontal privilege escalation, CORS, CSRF, sensitive log redaction. | < 100 ms / test | Authorization bypass, token leakage, unauthenticated route. |
| **L7** | **E2E Browser Tests** | Multi-step user journeys in headless Chromium (Question ideation to YouTube publishing, rejection flows). | 2–8 sec / test | Broken frontend-backend integration, client navigation bug. |
| **L8** | **Human Acceptance** | Editorial team validation of spoken Telugu scripts, video pacing, audio loudness, visual safe-zones. | Manual session | Unnatural spoken Telugu, poor teleprompter formatting. |
| **L9** | **Production Smoke** | Post-deployment automated health check probing `/api/health`, DB ping, auth handshake, read-only status. | < 5 sec total | Bad container deploy, missing environment secrets, DNS. |

---

## 4. Unit Test Architecture

Unit tests verify isolated, deterministic, side-effect-free code. They execute purely in-memory without network, filesystem, or database access.

### 4.1 Boundary Targets in BP-CMS Repository
1. **Academic & Content Validators:**
   - `src/lib/ai/validators/script.validator.ts`: Spoken Telugu word count, duration bounds (40–55s), spoken markers.
   - `src/lib/ai/validators/mathematical.validator.ts`: Arithmetic consistency, percentage calculations, option polarity.
   - `src/lib/ai/validators/candidate.validator.ts`: 4-option structure, single correct key (`A`|`B`|`C`|`D`), Telugu Unicode presence.
   - `src/lib/validators/thumbnail-safety.validator.ts`: Contrast ratios, spoiler detection, font size thresholds.
2. **Schema & Contract Parsing:**
   - Zod schema validation across `src/types/data-contracts.ts` and `src/types/api-contracts.ts`.
3. **Identifier Generation & Validation:**
   - `src/lib/services/id.service.ts`: Format adherence (`QST-YYYYMMDD-XXXX`, `VID-YYYYMMDD-XXXX`).
4. **State Machine Predicates:**
   - State transition rules in `src/types/state-models.ts` and capability evaluation in `src/types/rbac-models.ts`.
5. **Idempotency & Concurrency Calculations:**
   - Version incrementing (`_version + 1`), SHA-256 hash formatting, pagination math.

---

## 5. Component Test Architecture

Component tests verify React components rendered in a virtual DOM (happy, loading, empty, and error states).

### 5.1 Critical Rule: Permission UX vs. Security
> **Frontend permission tests verify USER EXPERIENCE ONLY.**  
> Hiding a "Publish" button or disabling a tab when `user.role === 'CREATOR'` proves that the UI adapts to the user's role. It does **NOT** prove security. Security is proven solely when the backend API rejects an unauthorized `POST /api/v1/publishing` request with HTTP 403 Forbidden.

### 5.2 Component Verification Scope
- **8 Studio Hubs (`src/components/studio/hubs/`):** Form inputs, review dialogs, teleprompter scroll containers, video players.
- **Workflow State Controls:** Action buttons display proper loading spinners during submission and disable upon invalid form state.
- **Error Boundaries:** `StudioErrorBoundary` catches rendering exceptions and displays friendly recovery actions without crashing the application shell.

---

## 6. Integration Test Architecture

Integration tests verify that distinct architectural modules communicate properly across system boundaries without relying on live paid cloud infrastructure.

### 6.1 Integration Boundaries
1. **Service $\to$ Repository:** Validates that domain services (`QuestionWorkspaceService`) invoke repository methods (`QuestionsRepository`) with correct entities and handle repository exceptions.
2. **Repository $\to$ Database Adapter:** Tests Firestore queries, transactions, and Optimistic Concurrency Control using the **Firebase Local Emulator Suite**.
3. **Service $\to$ Audit:** Verifies that every business mutation dispatches an immutable audit event to `AuditLogRepository`.
4. **Service $\to$ Media Storage:** Verifies that file registration invokes the Google Drive mock adapter and records verified SHA-256 checksums.
5. **Service $\to$ AI Adapter:** Verifies that the assistive pipeline invokes the offline Gemini mock client and enforces schema parsing.

---

## 7. API Test Architecture

API tests exercise the backend HTTP pipeline from incoming request to outgoing HTTP response envelope, including routing, middleware, authentication, authorization, validation, and error propagation.

### 7.1 Universal API Test Matrix (Target `/api/v1/*`)
Every protected endpoint in BP-CMS must pass the **Universal 7-Case API Matrix**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      UNIVERSAL 7-CASE API MATRIX                       │
├───────────────────────────┬──────────────┬─────────────────────────────┤
│ Test Condition            │ Expected Code│ Expected Envelope Payload   │
├───────────────────────────┼──────────────┼─────────────────────────────┤
│ 1. Unauthenticated        │ 401 Unauth   │ success: false, error: Auth │
│ 2. Authenticated & Auth'd │ 200 OK / 201 │ success: true, data: { ... }│
│ 3. Authenticated Unauth'd │ 403 Forbid   │ success: false, error: Perm │
│ 4. Invalid Input (Zod)    │ 400 Bad Req  │ success: false, details: [] │
│ 5. Missing Resource       │ 404 Not Found│ success: false, error: 404  │
│ 6. Version Conflict (OCC) │ 409 Conflict │ success: false, error: Stale│
│ 7. Server Failure / Panic │ 500 Server   │ success: false (redacted)   │
└───────────────────────────┴──────────────┴─────────────────────────────┘
```

---

## 8. Workflow Test Architecture

The canonical 15-step workflow is the primary business test surface of BP-CMS. Workflow tests verify that the sequential state engine strictly enforces prerequisites, anti-self-approval rules (`GAR-02`), and optimistic locking across the entire manufacturing pipeline.

### 8.1 Complete Cross-Step Chain Tests
- **Full Manufacturing Flow:** Step 01 $\to$ 02 $\to$ 03 $\to$ 04 $\to$ 05 $\to$ 06 $\to$ 07 $\to$ 08 $\to$ 09 $\to$ 10 $\to$ 11 $\to$ 12 $\to$ 13 $\to$ 14 $\to$ 15 $\to$ 01 (Intelligence Loop feedback).
- **Illegal Step Skip Rejections:** Attempting 01 $\to$ 03 (skipping verification), 04 $\to$ 06 (skipping raw video review), or 07 $\to$ 11 (skipping publishing setup) must be rejected with HTTP 400 Invalid Transition.
- **Anti-Self-Approval (`GAR-02`):** When Creator `USR-002` authors a question in Step 01, `USR-002` is strictly barred from approving it in Step 02, even if assigned the `QC_REVIEWER` role.

---

## 9. Security Test Architecture

Aligning directly with Stage 19 (`docs/architecture/19-SECURITY-ARCHITECTURE.md`):

### 9.1 Authentication & Session Tests
- Valid login sets `HttpOnly`, `SameSite=Lax`, `Secure` signed session cookies.
- Expired or tampered session tokens reject requests with HTTP 401.
- Immediate session revocation upon user logout or role modification.

### 9.2 Authorization & RBAC Tests
- **Vertical Privilege Escalation:** Verify that `CREATOR` cannot trigger `/api/v1/admin/users`.
- **Horizontal Privilege Escalation:** Verify that Editor A cannot modify Editor B's assigned video draft unless granted `WORKFLOW_OVERRIDE`.
- **Legacy Vulnerability Check:** Verify that unauthenticated requests to `getRequestActor` return HTTP 401 and **NEVER** silently grant `USR-001` (Admin) permissions.

### 9.3 Security Controls & Redaction
- CORS headers strictly permit only approved origins.
- Sensitive credentials (`password`, `refreshToken`, `sessionSecret`) are stripped from API responses and structured JSON logs.

---

## 10. E2E Test Architecture (Playwright)

End-to-End tests execute real browser-driven user journeys using headless Chromium to prove cross-tier system coherence.

### 10.1 Canonical E2E Scenarios
1. **Scenario A (Happy Path Publish):** Creator drafts question $\to$ Verifier approves $\to$ Scriptwriter generates Telugu script $\to$ Recording uploaded $\to$ Editor cuts short $\to$ QC approves $\to$ Publisher schedules $\to$ YouTube published.
2. **Scenario B (Question Revision Cycle):** Question rejected in Step 02 with critique $\to$ Creator receives notification $\to$ Creator edits distractor $\to$ Resubmits $\to$ Verifier approves.
3. **Scenario C (Video QC Rejection):** Video rejected in Step 07 for audio loudness ($-12$ LUFS) $\to$ Returned to Step 06 $\to$ Editor adjusts gain to $-14$ LUFS $\to$ Resubmits $\to$ QC passes.
4. **Scenario D (Unauthorized Action Blocked):** Unauthorized user clicks protected action $\to$ UI displays warning modal $\to$ Direct API probe returns 403.
5. **Scenario E (Analytics & Intelligence Feedback):** Published short receives simulated view telemetry $\to$ Metrics harvested $\to$ Performance classified as `TOP_DECILE` $\to$ Content pattern fed into Step 15 Intelligence Loop.
6. **Scenario F (External Integration Recovery):** Simulated YouTube API 500 error during publish $\to$ System captures error $\to$ Transitions to `SYNC_FAILED` $\to$ Automated Cloud Tasks retry successfully publishes on attempt 2.

---

## 11. Human Acceptance Testing (UAT)

Automated tests cannot evaluate spoken Telugu fluency, natural teleprompter pacing, voice inflection, or cultural tone. Human testing evaluates the live application holistically.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     HUMAN ACCEPTANCE TEST PROTOCOL                     │
├────────────────────────────────────────────────────────────────────────┤
│ Rule 1: Observe → Record → Continue If Safe.                           │
│   Testers must NOT patch code during an active acceptance session.     │
│   All defects are formally logged with reproduction steps and severity.│
│                                                                        │
│ Rule 2: Evaluated by Role Specialists:                                 │
│   - Academic Expert: Verifies syllabus alignment & question accuracy.  │
│   - Telugu Voice Artist: Tests teleprompter speed & phonetic markers.  │
│   - Video Editor: Tests timeline responsiveness & preview fidelity.    │
│   - Production Lead: Tests batch operations & publishing schedules.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Production Verification (Smoke Testing)

Immediately following production deployment, an automated, read-only smoke verification script tests foundational health without mutating production content:

1. **System Health:** Probes `/api/health` (checks process uptime, memory usage, node version).
2. **Frontend Availability:** Loads `/` and `/login`, verifying HTTP 200 and static asset bundle integrity.
3. **Database Connectivity:** Executes read-only probe on Firestore metadata collection.
4. **Storage Connectivity:** Verifies Google Drive API service account token acquisition.
5. **Auth Gateway:** Verifies that unauthenticated request to `/api/v1/auth/me` returns 401.

---

## 13. Test Data Architecture

To guarantee repeatable, deterministic test runs, test data is strictly isolated across operational tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TEST DATA ISOLATION TIERS                       │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Tier                 │ Data Characteristics & Isolation Strategy       │
├──────────────────────┼─────────────────────────────────────────────────┤
│ **Unit Tier**        │ Ephemeral in-memory fixtures; destroyed per test│
│ **Integration Tier** │ Firebase Emulator database; wiped before suite  │
│ **E2E Tier**         │ Seeded synthetic users, topics, and assets      │
│ **Human UAT Tier**   │ Staging environment containing sample questions │
│ **Production Smoke** │ Read-only queries against system metadata docs  │
└──────────────────────┴─────────────────────────────────────────────────┘
```
**Strict Invariant:** Real production credentials, private Drive folders, and live API keys are strictly prohibited in all automated test suites.

---

## 14. Mock / Fake / Stub Strategy

External third-party APIs and paid cloud services are replaced with deterministic test doubles to ensure tests execute offline, fast, and at **zero cost**:

| External Dependency | Test Double Mechanism | Verification Purpose |
| :--- | :--- | :--- |
| **Google Cloud Firestore** | Firebase Local Emulator Suite | Full local ACID transactions, queries, security rules. |
| **Google Drive API v3** | `FakeDriveStorageAdapter` (In-memory buffer) | File registration, checksum generation, byte streaming. |
| **Google AI Studio (Gemini)**| `MockGeminiClient` (Static JSON fixtures) | Structured output validation, error simulation, rate limits. |
| **YouTube Data API v3** | `FakeYouTubeApiClient` | Video metadata publishing, quota limit simulation. |
| **Google Cloud Tasks** | `InMemoryJobRunner` (`EventEmitter`) | Job queueing, execution leases, retry backoff, DLQ. |
| **Server-Sent Events (SSE)**| `MockSSEClient` (Node.js HTTP stream) | Event broadcast, client reconnects, heartbeat checks. |

---

## 15. Database Testing (Firestore Native)

Aligning with Stage 12 and Stage 13:
- **CRUD Operations:** Verify that document creation, reads, updates, and soft-deletes adhere to canonical schemas.
- **Optimistic Concurrency Control:** Simulate two concurrent workers reading `_version: 1` and attempting updates. Verify that Worker A succeeds (`_version: 2`) and Worker B fails with HTTP 409 Conflict.
- **Dual-Master Detection:** Tests assert that all writes hit Firestore and that Google Sheets receives only asynchronous read-only snapshots.

---

## 16. Migration Testing (Stage 23 Strangler Fig)

Migration tests verify data fidelity across the 7-phase transition:
- **Data Parity:** 4-point reconciliation verifies cardinality, primary keys, and SHA-256 field hashes between Sheets and Firestore.
- **Route Compatibility:** Asserts that 100% of legacy routes redirect to canonical routes with HTTP 301.
- **Rollback Safety:** Tests execute the sub-5-minute rollback script and verify that the reverse delta synchronizer replays mutations back to Sheets without data loss.

---

## 17. Media Testing (Stage 14 Tri-Layer Store)

- **Cryptographic Integrity:** Calculate SHA-256 hashes of test MP4 files; assert that modified byte streams trigger `CHECKSUM_MISMATCH` alerts.
- **Missing File Handling:** Test system behavior when a Google Drive file ID is deleted; verify that UI displays clear error state without crashing.
- **Format Validation:** Test rejection of non-vertical (16:9) video uploads or corrupt audio tracks.

---

## 18. AI Testing (Stage 18 Assistive Pipeline)

- **Assistive Boundary Enforcement:** Test that AI generation endpoints cannot mutate canonical question records directly.
- **Telugu Validation:** Test rejection of scripts with English transliteration where pure Telugu script is required.
- **Schema Conformity:** Test that Gemini structured outputs strictly parse through Zod schemas before being presented to humans.

---

## 19. Analytics Testing (Stage 20 Segregation)

- **Zero Operational Mutation:** Verify that analytics harvesting batch jobs write strictly to `platform_analytics_snapshots` and never modify question or video operational records.
- **Aggregation Math:** Verify retention curve calculations, CTR percentages, and engagement decile classifications.

---

## 20. Audit & Observability Testing (Stage 21)

- **Immutable Ledger:** Verify that business mutations generate tamper-evident audit records containing actor ID, role, timestamp, before-state, and after-state.
- **Secret Redaction:** Verify that passwords, OAuth tokens, and session secrets are automatically scrubbed from structured JSON log strings.

---

## 21. Concurrency Testing & Race Conditions

Concurrency tests execute simultaneous operations against the same resource:
1. **Concurrent Approvals:** Two QC reviewers click "Approve" at the same instant $\to$ exactly one succeeds; second receives 409 Conflict.
2. **Concurrent Video Edits:** Two editors push metadata edits simultaneously $\to$ OCC version mismatch prevents silent overwrite.
3. **Duplicate Webhooks:** Two identical YouTube publish webhooks received $\to$ idempotency key deduplicates the second call.

---

## 22. Failure / Recovery Taxonomy

The system defines 15 distinct failure modes with standardized recovery behaviors:

```
===========================================================================================================================================
                                       CANONICAL FAILURE & RECOVERY TAXONOMY
===========================================================================================================================================
| Failure Classification       | Detection Mechanism       | Expected System Behavior           | Recovery Action                       |
| :---                         | :---                      | :---                               | :---                                  |
| **1. VALIDATION_FAILURE**    | Zod Schema Parse Error    | HTTP 400 with field issue details  | Client corrects input and resubmits   |
| **2. AUTHENTICATION_FAILURE**| Missing / Invalid Cookie  | HTTP 401 Unauthorized              | Redirect to `/login`                  |
| **3. AUTHORIZATION_FAILURE** | Missing RBAC Capability   | HTTP 403 Forbidden                 | Display permission denial banner      |
| **4. INVALID_TRANSITION**    | Workflow State Guard      | HTTP 400 Invalid State Transition  | Refresh workflow state from server    |
| **5. MISSING_DATA**          | Firestore Query Empty     | HTTP 404 Not Found                 | Return to dashboard with alert        |
| **6. CONCURRENCY_CONFLICT**  | OCC Version Mismatch      | HTTP 409 Conflict                  | Reload latest document and re-apply   |
| **7. MEDIA_FAILURE**         | Drive API Error / Hash Err| HTTP 502 / Checksum Warning        | Re-upload media or re-verify hash     |
| **8. NETWORK_FAILURE**       | Socket Drop / Timeout     | HTTP 504 / Client Retry Alert      | Exponential backoff with jitter       |
| **9. EXTERNAL_API_FAILURE**  | YouTube / Meta 5xx Error  | Flag `SYNC_FAILED` in database      | Cloud Tasks background retry (max 5)  |
| **10. AI_FAILURE**           | Gemini 429 / Parse Panic  | Fallback to manual authoring UI    | Log error, alert user to type manually |
| **11. DATABASE_FAILURE**     | Firestore Unavailable     | HTTP 503 Service Unavailable       | Failover to Sheets read-only replica   |
| **12. JOB_FAILURE**          | Worker Process Crash      | Task return non-200 to Cloud Tasks | Move to Dead-Letter Queue (DLQ)       |
| **13. TIMEOUT**              | Request exceeds 30s       | AbortController terminates request | Return HTTP 504 Gateway Timeout        |
| **14. RATE_LIMIT**           | IP Rate Limiter Tripped   | HTTP 429 Too Many Requests         | Wait for `Retry-After` window         |
| **15. PARTIAL_FAILURE**      | Batch write partial drop  | Roll back transaction atomically   | Entire batch aborted; re-attempt clean |
===========================================================================================================================================
```

---

## 23. Test Environments

| Environment | Purpose | Database | External APIs | Secrets Management |
| :--- | :--- | :--- | :--- | :--- |
| **LOCAL** | Developer workbench | Local Firebase Emulator | Offline Mocks / Fakes | Local `.env` (Dummy keys) |
| **TEST / CI** | Automated PR gates | Local In-Memory Emulator | 100% Mocked Fixtures | CI Environment Variables |
| **STAGING** | Human UAT & rehearsal| Dedicated Firestore project| Sandboxed Test Accounts| Cloud Secret Manager |
| **PRODUCTION** | Live production | Cloud Firestore Native | Live Google Drive & YouTube| Cloud Secret Manager |

---

## 24. Test Execution Strategy

1. **Pre-Commit Hook (< 10 seconds):** `npm run lint` (`tsc --noEmit`) and Unit tests (`vitest run --select=unit`).
2. **Continuous Integration Gate (< 3 minutes):** Unit, Component, Integration, API, and Security suites executed on every PR.
3. **Nightly Regression Suite (< 15 minutes):** Complete E2E Playwright suite and cross-step workflow simulations.
4. **Release Deployment Gate:** Automated production smoke verification immediately post-cutover.

---

## 25. Test Ownership & Evidence Governance

- **Ownership:** Every domain module is owned by its respective engineering lead; tests are authored alongside feature code.
- **Acceptable Evidence Artifacts:**
  - Automated JUnit XML and JSON test execution reports.
  - Playwright video recordings and trace files for failed E2E journeys.
  - Cryptographic checksum logs for media integrity tests.
  - Cloud Logging structured JSON traces for API errors.

---

## 26. Multi-Dimensional Coverage Strategy

Coverage is not measured solely as a code percentage. BP-CMS enforces **Five Coverage Dimensions**:
1. **Code & Branch Coverage:** Target $\ge 85\%$ line coverage across domain logic.
2. **API Contract Coverage:** 100% of endpoints pass the Universal 7-Case API Matrix.
3. **Workflow Coverage:** 100% of the 15 manufacturing steps covered across all 9 matrix scenarios.
4. **Security & RBAC Coverage:** 100% of capabilities verified against positive and negative permission checks.
5. **E2E Business Coverage:** 100% of canonical user journeys verified in browser automation.

---

## 27. Quality Gates (Gates A through H)

No feature, refactoring, or migration cutover may proceed without satisfying its mandatory test gate:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BP-CMS QUALITY GATES                            │
├────────────────────────────────────────────────────────────────────────┤
│ GATE A: Unit Tests Pass (100% passing, 0 errors)                       │
│ GATE B: Component Tests Pass (100% passing, accessible ARIA roles)     │
│ GATE C: Integration & Database Tests Pass (Firebase Emulator green)    │
│ GATE D: API Contracts Pass (100% Universal 7-Case envelopes green)     │
│ GATE E: Canonical 15×9 Workflow Matrix Passes (135/135 scenarios green)│
│ GATE F: Security & RBAC Audit Passes (Zero privilege escalation)       │
│ GATE G: E2E Playwright Journeys Pass (All 6 scenarios green)           │
│ GATE H: Human Acceptance Sign-Off (Editorial team UAT approval logged) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 28. Test Architecture Decision Register (ADR-TEST-01 to ADR-TEST-06)

### ADR-TEST-01: Adoption of Vitest as Primary Test Runner
- **Decision:** Select Vitest over Jest and Mocha.
- **Rationale:** Native TypeScript support, zero compilation overhead, shares configuration with `vite.config.ts`, 10x faster execution than Jest.
- **Cost:** ₹0.00 (Open source).

### ADR-TEST-02: Adoption of Playwright for E2E Browser Testing
- **Decision:** Select Playwright over Cypress.
- **Rationale:** Native multi-tab support, superior iframe handling for video players, headless Chromium/Firefox/WebKit testing, built-in trace viewer.
- **Cost:** ₹0.00 (Open source).

### ADR-TEST-03: Firebase Local Emulator Suite for Database Testing
- **Decision:** Use local Firebase Emulator over live cloud Firestore instances.
- **Rationale:** Guarantees zero cloud cost, instant database wipe between test runs, executes offline without internet connectivity.
- **Cost:** ₹0.00 (Local compute).

### ADR-TEST-04: Offline Mocking for Media Storage
- **Decision:** Implement in-memory buffer adapters for Google Drive binary uploads.
- **Rationale:** Prevents test files from saturating the 15 GB shared Google Drive quota or incurring API rate limits.
- **Cost:** ₹0.00.

### ADR-TEST-05: Offline Fixtures for AI Testing
- **Decision:** Mock Gemini 2.5 Flash API calls with deterministic JSON response fixtures.
- **Rationale:** Eliminates token expenditure during test runs, prevents 429 quota exhaustion, enables testing malformed LLM outputs.
- **Cost:** ₹0.00.

### ADR-TEST-06: Strict Separation of Frontend UX vs. Backend Security Tests
- **Decision:** Mandate that UI permission checks are never classified as security tests.
- **Rationale:** Prevents false sense of security; ensures backend authorization middleware is independently tested.

---

## 29. Financial & Cost Governance Alignment

In strict alignment with Stage 22 (`docs/architecture/22-COST-ARCHITECTURE.md`):
- **Zero Paid SaaS Testing Tools:** Datadog Synthetic, BrowserStack, SauceLabs, and paid CI runners are strictly prohibited.
- **Local Emulation:** 100% of integration, unit, and database tests execute locally on developer machines or within free GitHub Actions allotments.
- **Total Testing Infrastructure Cost:** **₹0.00 INR / month**.

---

## 30. Open Decisions & Implementation Timing

1. **Test Runner Installation Timing:** Vitest and Playwright package installations are intentionally deferred to Stage 25/27 implementation. Stage 24 remains strictly architecture-only.
2. **Visual Regression Snapshot Baselines:** Snapshot diffing will be calibrated in Stage 27 after the frontend Design System tokens are finalized.

---

## 31. Acceptance Criteria Checklist

- [x] **Testing Objectives Codified:** Four testing axioms established.
- [x] **Empirical Baseline Audited:** Discovered reality (0 tests, 0 runners) documented.
- [x] **9-Level Pyramid Defined:** Responsibilities and failure ownership documented for all levels.
- [x] **Unit, Component, Integration, API Specs Complete:** All boundaries mapped to actual codebase modules.
- [x] **Canonical 15×9 Matrix Authoritative:** All 135 cells explicitly detailed with concrete proof requirements.
- [x] **Security & Concurrency Specs Complete:** Privilege escalation and OCC race condition tests defined.
- [x] **Zero Production Code Modified:** Architecture document only. Runtime source changes = 0.

---

## 32. Canonical 15×9 Workflow Test Matrix (Complete 135-Cell Specification)

The following matrix defines the authoritative test conditions for every canonical manufacturing step across all nine failure and recovery scenarios:

```
===================================================================================================================================================================================================================
                                                               CANONICAL 15×9 WORKFLOW TEST MATRIX (135 EXPLICIT SPECIFICATIONS)
===================================================================================================================================================================================================================
| Step | 1. Happy Path | 2. Validation Failure | 3. Auth Failure | 4. Invalid Transition | 5. Missing Data | 6. Concurrency | 7. Media Failure | 8. Network Failure | 9. Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01. Question Generation** | Valid question text, 4 options, syllabus topic, and correct key submitted; transitions to `DRAFT`. | Rejects question with < 4 options or missing explanation (HTTP 400). | Non-Creator role blocked from drafting new questions (HTTP 403). | Attempting to transition directly from `IDEA` to `APPROVED` blocked. | Missing target exam category returns field validation error. | Two Creators drafting same syllabus topic assigned distinct IDs. | N/A (Text payload; zero media dependencies). | Client drops during draft submit; draft cached in sessionStorage. | Creator reopens page; restores draft from sessionStorage key. |
| **02. Question Verification** | Verifier reviews, confirms academic accuracy, and approves; transitions to Step 03. | Rejects approval if Telugu grammar contains severe syntax errors. | Creator who authored question blocked from approving (`GAR-02`). | Attempting verification on an unsubmitted draft rejected. | Missing verified reference source blocks approval button. | Two Verifiers approve simultaneously; OCC rejects second approval. | N/A (Text review; zero media dependencies). | Network timeout during review submit; transaction aborted cleanly. | Verifier retries approval; Firestore transaction succeeds. |
| **03. Audience Script** | Telugu script (40–55s duration, spoken hooks) authored and approved for filming. | Rejects script exceeding 60 seconds spoken duration estimate. | Non-Scriptwriter blocked from editing approved question script. | Attempting script creation before Question Verification approved blocked. | Missing teleprompter cue formatting flags validation warning. | Scriptwriter edits script while Lead reviews; OCC version mismatch. | Audio pronunciation guide missing; fallback to standard lexicon. | Disconnect during script save; local draft auto-saved. | Author recovers unsaved script from local storage draft buffer. |
| **04. Teleprompter & Filming** | Spoken script loaded onto teleprompter; filming completed; marked filmed. | Rejects filming completion if recorded duration is < 30 seconds. | Non-Presenter blocked from marking teleprompter session completed. | Attempting filming completion without an approved script blocked. | Missing teleprompter asset ID prevents recording initiation. | Presenter marks complete while script edited; transition locked. | Teleprompter font render failure falls back to system monospace. | Stream disconnect during live teleprompter session pauses timer. | Teleprompter reconnects; resumes scrolling from exact marker. |
| **05. Raw Video** | Raw vertical MP4 (1080x1920) uploaded to Drive; checksum registered. | Rejects upload of horizontal (16:9) video or non-MP4 container. | Non-Presenter / non-Editor blocked from registering raw video. | Attempting raw video registration before filming step completed blocked. | Missing Google Drive file ID blocks video record creation. | Simultaneous raw video uploads for same question deduplicated. | Corrupt video file triggers `CHECKSUM_MISMATCH`; rejects record. | Upload socket drops at 85%; resumable Drive upload resumes byte. | Upload worker retries chunk; completes SHA-256 verification. |
| **06. Editing Bay** | Video Editor trims, adds Telugu captions, loudness normalized to -14 LUFS. | Rejects cut short exceeding 59 seconds total running time. | Non-Video Editor blocked from claiming editing workbench ticket. | Attempting edit bay submission before raw video registered blocked. | Missing caption track metadata blocks transition to QC. | Two Editors attempt to claim same edit ticket; first lock wins. | Drive streaming URL expired; automatic token refresh succeeds. | Render drop during export; intermediate timeline state saved. | Editor re-opens timeline; resumes from last rendered clip cache. |
| **07. Final QC** | QC Reviewer validates broadcast safe-zones, loudness, audio sync; approves. | Rejects video with audio loudness > -12 LUFS (broadcast violation). | Editor who edited video blocked from acting as QC reviewer (`GAR-02`). | Attempting Final QC approval before Editing Bay completed blocked. | Missing mobile safe-zone compliance tag prevents approval. | Simultaneous QC reviews resolved via optimistic concurrency. | Corrupted preview video stream displays error; prompts re-transcode. | Disconnect during review submit; approval state remains pending. | QC Reviewer reloads; submits approval successfully. |
| **08. Thumbnail** | High-contrast vertical WebP thumbnail generated, contrast validated, approved. | Rejects thumbnail containing question answer text (spoiler check). | Non-Designer / non-Editor blocked from uploading thumbnail asset. | Attempting thumbnail approval before Final QC passes blocked. | Missing thumbnail image dimensions (1080x1920) rejected. | Simultaneous thumbnail variant uploads versioned (`v1`, `v2`). | Corrupted image binary rejected during SHA-256 calculation. | Thumbnail upload drops; client prompts retry without resetting form. | Designer re-selects file; upload and hash succeed. |
| **09. Social Review** | Community manager audits title, hashtags, exam tags, and Telugu spelling. | Rejects title exceeding 100 characters or missing #Shorts tag. | Content Creator blocked from self-approving social metadata. | Attempting social review before thumbnail and QC approved blocked. | Missing exam syllabus tags prevents social review sign-off. | Concurrent metadata updates merged via field-level OCC. | Thumbnail preview fails to load; displays fallback placeholder. | Network drop during tag submission; form state preserved. | Reviewer clicks retry; tags committed to Firestore. |
| **10. Publishing Setup** | Release package assembled with platform schedule; queued for dispatch. | Rejects scheduled release time set in the past. | Non-Publisher role blocked from scheduling content dispatch. | Attempting publishing setup before Social Review approved blocked. | Missing YouTube channel credential blocks package assembly. | Two Publishers schedule same video; duplicate schedule rejected. | Video asset inaccessible on Drive; halts dispatch queue. | Network timeout during package queuing; Cloud Tasks retries. | Cloud Tasks re-executes package assembly idempotently. |
| **11. Published** | Content dispatched to YouTube API; published public; status marked `COMPLETED`. | Rejects publish if YouTube API returns invalid video ID. | Automated service worker only; unauthorized user blocked from publish. | Attempting publication of unapproved package rejected. | Missing YouTube video privacy setting defaults to `private`. | Duplicate dispatch worker invocations deduplicated by jobId. | YouTube upload fails (quota limit); moves to retry queue. | Network drop during YouTube API call; idempotent retry executes. | Publisher triggers manual retry; video publishes successfully. |
| **12. Platform Sync** | Telemetry worker verifies live status on YouTube; captures external URLs. | Rejects sync record if external URL does not match canonical regex. | Automated sync runner only; unauthorized actors blocked. | Attempting platform sync before video marked Published blocked. | Missing YouTube video ID aborts sync worker gracefully. | Multiple sync runners for same video update single sync doc. | YouTube video deleted externally; flags `EXTERNAL_DELETION_ALERT`.| YouTube API timeout; worker retries on next 15-minute cron. | Sync worker recovers on subsequent cycle; captures live metrics. |
| **13. Analytics** | Batch worker captures views, likes, comments, and retention ratios (6-hr cron). | Rejects telemetry record containing negative view/retention counts. | Unauthorized access to raw analytics ingestion endpoint blocked. | Attempting analytics harvest on unpublished video rejected. | Missing platform snapshot record creates zero-baseline entry. | Concurrent analytics writes aggregated via BigQuery export. | YouTube Analytics API 429 quota; worker delays 60 minutes. | Transient API socket error; worker moves to next video cleanly. | Scheduled job runs on subsequent window; backfills missing snapshot. |
| **14. Performance Review** | Performance reviewed against exam batch benchmarks; categorized by decile. | Rejects review if benchmark comparison dataset is unseeded. | Reviewer role required; unprivileged users view read-only summary. | Attempting performance review before analytics harvested blocked. | Missing 7-day retention metric blocks top-decile classification. | Concurrent review ratings merged via average score aggregation. | Metric visualization graph error falls back to tabular display. | Disconnect during review submit; review cached locally. | Lead re-submits review rating; committed to audit ledger. |
| **15. Intelligence Loop** | High-performing question patterns synthesized into new syllabus ideas for Step 01. | Rejects recommendation lacking correlation to exam syllabus topic. | Non-Lead roles blocked from approving intelligence recommendations. | Attempting intelligence synthesis without performance review blocked. | Missing topic correlation tags prevents recommendation creation. | Two Leads approving recommendation deduplicated by topic ID. | Report PDF generation failure falls back to in-app markdown. | Disconnect during loop commit; recommendation queued in Firestore.| System processes queued recommendation; populates Step 01 intake. |
===================================================================================================================================================================================================================
```

---

## 33. Authoritative Anti-Overclaim Statement

> **"Stage 24 test architecture is documented and contractually defined; test runners, test files, and automated suites remain for later implementation stages."**

```
================================================================================
STAGE 24 — TEST ARCHITECTURE SPECIFICATION
================================================================================
Artifact:            docs/architecture/24-TEST-ARCHITECTURE.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Stage:          Stage 24 of 30
Application Code:    UNCHANGED (Zero Runtime Modifications)
Package Files:       UNCHANGED (Zero Dependencies Installed)
Test Matrix Status:  15×9 CANONICAL MATRIX COMPLETE (135 Scenarios Documented)
Budget Compliance:   VERIFIED (₹0.00 Test Overhead / Stage 22 Compliant)
Stage Boundary:      HALTED AT STAGE 24. Awaiting Stage 25 Instruction.
================================================================================
```
