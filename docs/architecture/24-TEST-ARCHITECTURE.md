# Burra Pariksha CMS
# 24 — Test Architecture

Stage: 24 — Test Architecture

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
Establishes the authoritative Test Architecture for the Burra Pariksha Content Management System (BP-CMS). Formally codifies:
1. **The 9 Levels of Testing Architecture:** A comprehensive testing pyramid spanning Unit, Component, Integration, API, Workflow, Security, E2E, Human Acceptance, and Production Verification.
2. **The Universal 135-Cell Workflow Test Matrix:** Exhaustive test coverage combining all 15 canonical workflow steps with 9 mandatory operational and failure scenarios:
   - Happy Path (Nominal forward step transition)
   - Validation Failure (Malformed payloads / 400 `VALIDATION_ERROR`)
   - Authorization Failure (Missing RBAC capability / 403 `FORBIDDEN`)
   - Invalid Transition (Illegal step jump / 409 `INVALID_STATE`)
   - Missing Data (Omitted mandatory references / 404 `NOT_FOUND`)
   - Concurrency Conflict (Optimistic locking version mismatch / 409 `OPTIMISTIC_LOCK_CONFLICT`)
   - Media Failure (Drive API dropout / SHA-256 mismatch / 502 `MEDIA_ERROR`)
   - Network Failure (External dependency timeout / 504 `GATEWAY_TIMEOUT`)
   - Recovery (Automated rollback / retry / dead-letter queue resolution)
3. **Deterministic, Non-Mutating Testing Invariants (`AP-015`):** Side-effect-free test execution with strict test doubles and fixture factories.
4. **Governance & Anti-Self-Approval Testing (`GAR-02`, `AP-009`):** Explicit test suites validating non-authoritative AI boundaries and segregation of duties.
5. **Zero-Cost Test Operations (`COST-001`, `AP-012`):** 100% in-process TypeScript test runners (`tsx`, Node.js assert) requiring zero paid cloud test runners.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 24 Test Architecture | FACT |
| **File Path** | `docs/architecture/24-TEST-ARCHITECTURE.md` | FACT |
| **Document Stage** | Stage 24 — Test Architecture | FACT |
| **Authority** | Authoritative Test Strategy & Quality Governance Specification (AP-015) | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 23 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 25+ (Continuous Testing & Production Implementation) | FACT |
| **Baseline Repository Commit** | `429b417` | FACT |
| **Test Matrix Scale** | 15 Canonical Workflow Steps $\times$ 9 Scenarios = 135 Explicit Test Cells | FACT |

---

## 02. The 9 Levels of Testing Architecture

```
                    ┌───────────────────────────────┐
                    │  9. PRODUCTION VERIFICATION   │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │  8. HUMAN ACCEPTANCE TESTING  │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │        7. E2E TESTING         │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │      6. SECURITY TESTING      │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │      5. WORKFLOW TESTING      │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │        4. API TESTING         │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │    3. INTEGRATION TESTING     │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │     2. COMPONENT TESTING      │
                    └───────────────┬───────────────┘
                    ┌───────────────┴───────────────┐
                    │        1. UNIT TESTING        │
                    └───────────────────────────────┘
```

1. **Level 1: Unit Testing:** Pure functions, state transitions, Zod schemas, mathematical evaluators, cryptographic hash utilities.
2. **Level 2: Component Testing:** React UI components in isolation (Empty, Loading, Ready, Error states).
3. **Level 3: Integration Testing:** Clean boundary testing between Domain Services, Repositories, and in-memory test databases.
4. **Level 4: API Testing:** Express endpoint contracts, HTTP status code assertions, `ApiResponseEnvelope` validation.
5. **Level 5: Workflow Testing:** 15-step sequential forward progression, backward rework loops, anti-jump verification.
6. **Level 6: Security Testing:** RBAC capability matrix enforcement, `GAR-02` anti-self-approval, JWT `sessionVersion` revocation, `AP-009` AI boundaries.
7. **Level 7: E2E Testing:** Synthetic full journeys from Question authoring $\to$ Review $\to$ Video generation $\to$ Social publishing.
8. **Level 8: Human Acceptance Testing:** Subject-matter expert (SME) validation of Telugu pedagogical quality, Bloom taxonomy alignment, and tone.
9. **Level 9: Production Verification:** Liveness (`/healthz`) and deep readiness (`/readyz`) synthetic monitoring, canary assertions.

---

## 03. The Universal 135-Cell Workflow Test Matrix

Every step from the Stage 07 15-Step Canonical Workflow is strictly tested against 9 standardized scenarios:

| # | Canonical Step Name | 1. Happy Path | 2. Validation | 3. Auth (RBAC) | 4. Invalid Step | 5. Missing Data | 6. OCC Lock | 7. Media Error | 8. Network | 9. Recovery |
| :- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **01** | Content Ingestion & Sourcing | 200 OK | 400 Bad Schema | 403 Unauthorized | 409 Bad Transition | 404 No Source | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **02** | Question Authoring & Telugu Review | 200 OK | 400 Bad Telugu | 403 Self-Approve | 409 Skip Step 01 | 404 No Question | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **03** | Technical Fact-Check & Verification | 200 OK | 400 Bad Schema | 403 Unauthorized | 409 Skip Step 02 | 404 No Fact Data | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **04** | Pedagogical & Bloom's Tagging | 200 OK | 400 Invalid Bloom | 403 Unauthorized | 409 Skip Step 03 | 404 No Question | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **05** | Media Asset Generation (Image/Audio)| 200 OK | 400 Bad Prompt | 403 Unauthorized | 409 Skip Step 04 | 404 No Media Ref | 409 Lock Conflict | 502 Hash Mismatch| 504 Timeout | Rollback / DLQ |
| **06** | Video Composition & Template Binding | 200 OK | 400 Bad Template | 403 Unauthorized | 409 Skip Step 05 | 404 No Assets | 409 Lock Conflict | 502 Render Error | 504 Timeout | Rollback / DLQ |
| **07** | Quality Assurance (QA) & Verification| 200 OK | 400 Incomplete QA | 403 Self-Approve | 409 Skip Step 06 | 404 No Video | 409 Lock Conflict | 502 Video Mismatch| 504 Timeout | Rollback / DLQ |
| **08** | Publishing Package Assembly | 200 OK | 400 Bad Package | 403 Unauthorized | 409 Skip Step 07 | 404 No Metadata | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **09** | Legal & Compliance Gate | 200 OK | 400 Compliance Err| 403 Self-Approve | 409 Skip Step 08 | 404 No Package | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **10** | Executive Final Sign-Off | 200 OK | 400 Signoff Err | 403 Non-Admin | 409 Skip Step 09 | 404 No Approval | 409 Lock Conflict | 502 Drive Error | 504 Timeout | Rollback / DLQ |
| **11** | Platform Dispatch (YouTube/Insta/FB)| 200 OK | 400 Bad Payload | 403 Unauthorized | 409 Skip Step 10 | 404 No Dispatch | 409 Lock Conflict | 502 Upload Fail | 504 Timeout | Rollback / DLQ |
| **12** | Telemetry Ingestion & Realtime Tracking| 200 OK| 400 Bad Metric | 403 Unauthorized | 409 Skip Step 11 | 404 No Post Ref | 409 Lock Conflict | 502 Metric Mismatch| 504 Timeout| Rollback / DLQ |
| **13** | Performance Aggregation & Analytics | 200 OK | 400 Invalid Rollup| 403 Unauthorized | 409 Skip Step 12 | 404 No Analytics | 409 Lock Conflict | 502 Calc Error | 504 Timeout | Rollback / DLQ |
| **14** | Archival & Coldline Synchronization | 200 OK | 400 Bad Checksum | 403 Unauthorized | 409 Skip Step 13 | 404 No Media | 409 Lock Conflict | 502 Hash Mismatch| 504 Timeout | Rollback / DLQ |
| **15** | Curriculum Feedback Loop | 200 OK | 400 Loop Malformed| 403 Unauthorized | 409 Skip Step 14 | 404 No Feedback | 409 Lock Conflict | 502 Sync Error | 504 Timeout | Rollback / DLQ |

$$\text{Total Test Coverage} = 15 \text{ Steps} \times 9 \text{ Scenarios} = 135 \text{ Explicit Test Cells}$$

---

## 04. Deterministic Testing Invariants (AP-015)

- **Non-Mutating Execution:** All tests execute against deterministic memory fixtures or isolated in-memory stores. Zero mutations to production databases or persistent local files.
- **Fixture Factories:** Centralized builders generate valid domain entities (`createValidQuestionFixture()`, `createValidWorkflowInstanceFixture()`).
- **Cryptographic Mocking:** SHA-256 test vectors match true NIST crypto standards without requiring network calls to Google Drive.

---

## 05. Zero-Cost Financial Discipline (`COST-001`, `AP-012`)

All 135 test matrix scenarios and 9 testing levels execute via `tsx` on the Node.js runtime in local development and standard GitHub Actions CI runner without third-party test cloud subscriptions (e.g. BrowserStack, SauceLabs, paid Cypress Cloud). Total operating test cost: **₹0.00 INR / month**.
