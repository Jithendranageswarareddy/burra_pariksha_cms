# Burra Pariksha CMS
# 28 — Verification & Human Testing Architecture

Stage: 28 — Verification & Human Testing Architecture

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
Establishes the authoritative Verification & Human Testing Architecture for the Burra Pariksha Content Management System (BP-CMS).
Codifies:
1. **The Tri-Partite Verification Architecture:** Three mandatory, non-overlapping pillars:
   - **Pillar 1 (Automated Verification):** Static compile checking (`tsc`), unit tests, integration tests, workflow sequential validation, and zero-trust security test suites.
   - **Pillar 2 (Independent Forensic Review - Antigravity):** Independent diff auditing, non-repudiation audit checks, invariant enforcement, and gate report issuance.
   - **Pillar 3 (Human & SME Operational Testing):** Live UI/UX and pedagogical validation by the Product Owner and Telugu educational Subject Matter Experts (SMEs).
2. **The 20-Step Canonical Execution Process:** Complete end-to-end SDLC sequence mapping from Requirement Submission to Final Gate Certification.
3. **The Human Testing Protocol ("Observe $\to$ Record $\to$ Continue if safe"):** Formal prohibition of reactive AI micro-patching loops during active human test sessions (`ANTI_THRASHING_INVARIANT`).
4. **Defect Severity Hierarchy & Batch Remediation:** `BLOCKER` (halts session), `MAJOR` (record & continue), `MINOR` (record & continue), `COSMETIC` (record & continue).

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 28 Verification & Human Testing Architecture | FACT |
| **File Path** | `docs/architecture/28-VERIFICATION-HUMAN-TESTING.md` | FACT |
| **Document Stage** | Stage 28 — Verification & Human Testing | FACT |
| **Authority** | Master SDLC Verification Standard | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 27 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 29+ (Physical Feature Execution) | FACT |
| **Verification Pillars** | 3 Mandatory Pillars (Automated, Independent, Human) | FACT |

---

## 02. The Tri-Partite Verification Architecture

A feature or stage is only certified for production when all three independent verification pillars reach 100% agreement:

```
               ┌─────────────────────────────────────────────────────┐
               │    TRI-PARTITE VERIFICATION ARCHITECTURE (GATE)     │
               └──────────────────────────┬──────────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
 ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
 │       PILLAR 1       │      │       PILLAR 2       │      │       PILLAR 3       │
 │      AUTOMATED       │      │     INDEPENDENT      │      │     HUMAN & SME      │
 │     VERIFICATION     │      │   FORENSIC REVIEW    │      │ OPERATIONAL TESTING  │
 ├──────────────────────┤      ├──────────────────────┤      ├──────────────────────┤
 │ • tsc --noEmit (0)   │      │ • Git Diff Auditing  │      │ • PO Acceptance      │
 │ • Unit Tests         │      │ • Invariant Checks   │      │ • Telugu SME Review  │
 │ • Integration Tests  │      │ • Regression Safety  │      │ • UI/UX Flow Audit   │
 │ • 9-Scenario Matrix  │      │ • Non-Repudiation    │      │ • "Observe->Record-> │
 │ • Production Build   │      │ • Gate Cert Report   │      │    Continue if safe" │
 └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
            │                             │                             │
            └─────────────────────────────┼─────────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ PRODUCTION GATE CERTIFIED & CLOSED ✅ │
                      └───────────────────────────────────────┘
```

---

## 03. The 20-Step Canonical Execution Process

| Step # | Enum Identifier | Step Name | Primary Actor | Deliverables / Verification Outcome |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `STEP_01_REQ_SUBMISSION` | Requirement Submission | Product Owner | Business brief, problem scope, user goals |
| **02** | `STEP_02_FORENSIC_AUDIT` | Forensic Audit & Context Pull | Antigravity | Codebase inspection, sheet schema audit, context synthesis |
| **03** | `STEP_03_PRINCIPLES_CHECK` | Principles & Boundary Check | Antigravity | Verification against AP-001 through AP-015 and boundary maps |
| **04** | `STEP_04_DOMAIN_MODELING` | Domain & State Modeling | Antigravity | Entity relationships, lifecycle states decoupled from tech status |
| **05** | `STEP_05_SECURITY_BOUNDARIES` | Security & RBAC Capabilities | Antigravity | Capability definitions, sessionVersion checks, GAR-02 anti-self-approval |
| **06** | `STEP_06_DATA_CONTRACTS` | Data Contracts & OCC | Antigravity | Firestore schema, indexes, mandatory OCC versioning |
| **07** | `STEP_07_API_CONTRACTS` | API Contracts & Envelopes | Antigravity | REST routes, ApiResponseEnvelope, Zod payload schemas |
| **08** | `STEP_08_UI_CONTRACTS` | UI Contracts & State Matrix | Antigravity | Workspace hub placement, route path, 5-state UI model |
| **09** | `STEP_09_TEST_STRATEGY` | Test Strategy (9-Scenario Matrix) | Antigravity | 9 failure/recovery scenario coverage plan |
| **10** | `STEP_10_COST_GUARD` | Cost & Budget Ceiling Guard | Antigravity | Mathematical proof of <= ₹100 INR/month cloud budget |
| **11** | `STEP_11_IMPLEMENTATION_SPEC` | Implementation Spec Authoring | Antigravity | File-by-file ADD / MODIFY / REMOVE specification |
| **12** | `STEP_12_AI_PROMPT_AUTHORING` | External AI Studio Prompt Generation | Antigravity | Pristine, copy-paste prompt authored |
| **13** | `STEP_13_STUDIO_EXECUTION` | External Code Execution | Google AI Studio | Physical code changes created/edited with 0 errors |
| **14** | `STEP_14_GITHUB_PUSH` | Git Commit & Push to GitHub | Google AI Studio / User | Changes pushed to origin/main |
| **15** | `STEP_15_LOCAL_PULL_SYNC` | Local Pull & Workspace Sync | Antigravity | Workspace updated from GitHub origin/main |
| **16** | `STEP_16_STATIC_COMPILE_CHECK` | Automated Static & Compile Check | Automated / Antigravity | `tsc --noEmit` and `npm run build` verify 0 errors |
| **17** | `STEP_17_STAGE_TEST_EXECUTION` | Target Stage Test Execution | Automated / Antigravity | `npm run test:stageXX` 100% pass |
| **18** | `STEP_18_REGRESSION_EXECUTION` | Complete Regression Suite Execution | Automated / Antigravity | All historical stage tests pass with 0 regressions |
| **19** | `STEP_19_HUMAN_SME_TESTING` | Human SME Testing Session | Product Owner / SME | "Observe -> Record -> Continue if safe" protocol |
| **20** | `STEP_20_GATE_CERTIFICATION_STOP` | Final Gate Certification & Mandatory Stop | Antigravity & PO | Formal stage closure and execution halt |

---

## 04. The Human Testing Protocol & Anti-Patching Policy

### The "Observe $\to$ Record $\to$ Continue if safe" Principle

During an active human testing session (Pillar 3):
1. **Observe:** The tester interacts with the live application in the designated Workspace Hub.
2. **Record:** When unexpected behavior or a bug occurs, the tester records a structured Defect Record (`defectId`, `title`, `severity`, `observedBehavior`, `expectedBehavior`, `workspaceHub`, `stepNumber`).
3. **Continue if safe:** Unless the defect is a **BLOCKER** that prevents further testing, the tester **continues testing the remainder of the session**.

### Strict Anti-Patching Invariant (`ANTI_THRASHING_INVARIANT`)
- **Prohibition:** AI agents and developers are strictly forbidden from attempting to continuously micro-patch individual bugs during an active human test session.
- **Rationale:**
  1. *Context Thrashing:* Reactive code changes invalidate the test environment mid-session.
  2. *Regression Masking:* Unplanned emergency patches introduce unreviewed side-effects.
  3. *Incomplete Defect Discovery:* Stopping for every minor flaw prevents testers from discovering broader systemic issues.
- **Batch Remediation Protocol:** All non-blocking defects are cataloged into the Defect Observation Log and remediated in a single, planned engineering cycle after the test session concludes.

### Defect Classification Matrix

| Severity | Definition | Session Action | Remediation Timing |
| :--- | :--- | :--- | :--- |
| **`BLOCKER`** | Application crash, white screen, complete data loss, unhandled 500 error preventing further navigation | **HALT SESSION IMMEDIATELY** | Immediate critical fix & re-test |
| **`MAJOR`** | Core functional defect where a workaround exists or other parts of the workflow remain testable | **RECORD & CONTINUE** | Post-session batched engineering fix |
| **`MINOR`** | Secondary feature anomaly, non-critical validation timing, minor edge case | **RECORD & CONTINUE** | Post-session batched engineering fix |
| **`COSMETIC`** | Typography, alignment, color contrast, micro-copy translation phrasing | **RECORD & CONTINUE** | Post-session batched engineering fix |

---

## 05. Verification Gate Certification Criteria

A stage or feature receives formal **`ACCEPTED — COMPLETE — CLOSED`** certification only when:
1. **Automated Verification:** 100% of target and regression test suites pass (`0 failed`), `tsc --noEmit` clean, `npm run build` succeeds.
2. **Independent Forensic Review:** Antigravity confirms zero architectural invariant violations and all constraints (OCC, cost ceiling, anti-self-approval) hold.
3. **Human & SME Testing:** Product Owner / Telugu SME confirms acceptable user experience with zero unresolved `BLOCKER` defects.
4. **Mandatory Stop:** Cycle halts immediately upon certification.
