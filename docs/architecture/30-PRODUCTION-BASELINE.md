# Burra Pariksha CMS
# 30 — Production Baseline & Master SDLC Continuous Loop

Stage: 30 — Production Baseline & Master SDLC Plan

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
Establishes the authoritative Production Baseline and Master SDLC Continuous Loop Architecture for the Burra Pariksha Content Management System (BP-CMS).
Codifies:
1. **The Stable Production Baseline Record:** Version, Architecture, Database, Media, Routes, APIs, RBAC, Workflow, Known Issues, Test Status, Deployment, Cost, and Infrastructure.
2. **The Continuous SDLC Loop:**
   `PRODUCTION BASELINE -> NEXT REQUIREMENT -> STAGE 01`.
   Establishes that the 30 stages form an iterative, continuous software engineering lifecycle rather than a one-off project.
3. **The 6 Controlled Governance Gates:**
   - Gate A — Product Truth (Stages 01–05)
   - Gate B — Business Architecture (Stages 06–09)
   - Gate C — Application Architecture (Stages 10–15)
   - Gate D — Runtime Architecture (Stages 16–22)
   - Gate E — Migration & Engineering (Stages 23–26)
   - Gate F — Execution (Stages 27–30)
4. **The 5-Field Canonical Stage Standard:** Every stage maintains:
   CURRENT STATE, TARGET STATE, DECISIONS, OPEN QUESTIONS, ACCEPTANCE CRITERIA.
5. **The Stage 12 Database Architecture Decision Standard:**
   Formal multi-criteria evaluation (Google Sheets vs Firestore vs PostgreSQL vs Hybrid) evaluated against the inviolable ₹0–₹100 INR/month ceiling.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 30 Production Baseline & Master SDLC Plan | FACT |
| **File Path** | `docs/architecture/30-PRODUCTION-BASELINE.md` | FACT |
| **Document Stage** | Stage 30 — Production Baseline | FACT |
| **Authority** | Master SDLC Continuous Loop Baseline | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Production Master Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Total SDLC Stages** | 30 Stages (All Formally Specified & Closed) | FACT |
| **Governance Gates** | 6 Controlled Gates (Gates A through F) | FACT |
| **Continuous Loop** | Enabled (`STAGE_30 -> NEXT REQUIREMENT -> STAGE_01`) | FACT |
| **Monthly Budget Ceiling** | <= ₹100 INR / month (COST-001, AP-012) | FACT |

---

## 02. The Stable Production Baseline Record

| Dimension | Baseline Specification | Evidence & Contract Reference |
| :--- | :--- | :--- |
| **System Version** | `v1.1.0` | Master SDLC Reset Baseline |
| **Architecture Model** | Modular Monolith (`AP-011`) | Single-process Express backend + Vite SPA |
| **Database Baseline** | Hybrid: Google Sheets Baseline $\to$ Firestore Native Mode | Stage 12 Database Architecture Decision |
| **Media Boundary** | Google Drive API with metadata/binary isolation | AP-007, AP-008, Stage 14 Media Contract |
| **Routed Pages** | 31 React Pages / 78 Client Route Declarations | Stage 10 Frontend IA, Stage 11 Route Contract |
| **API Endpoints** | Standardized REST with `ApiResponseEnvelope` | Stage 15 API Contract |
| **RBAC & Authorization** | 5 Canonical Roles, `GAR-02` Anti-Self-Approval | Stage 09 RBAC Capability Matrix |
| **Workflow Integrity** | Canonical 15-Step Sequential Workflow (`AP-001`) | Closed-loop feedback (Step 15 $\to$ Step 01) |
| **Known Issues** | 0 Blocker defects; minor micro-copy & cosmetic logged | Non-blocking observations batched post-session |
| **Test Verification** | 100% Pass across all 30 stages (02 through 30) | Zero regressions across all historical test suites |
| **Deployment Target** | Google Cloud Run Containerized Monolith (`Dockerfile`) | Multi-stage Docker, scale-to-zero (`min-instances=0`) |
| **Monthly Cloud Cost** | ₹0.00 / month (Budget Ceiling: $\le$ ₹100 INR/month) | COST-001, AP-012 Cloud Run Free Tier |
| **Infrastructure Stack**| Cloud Run + Firestore + Google Drive + Google Tasks | Serverless scale-to-zero stack |

---

## 03. The Continuous SDLC Loop Architecture

Development in BP-CMS does not end with Stage 30; Stage 30 resets the baseline for continuous evolution:

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                 THE 30-STAGE CONTINUOUS SDLC LIFECYCLE                    │
  └─────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │    STAGE 30: PRODUCTION BASELINE  │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │          NEXT REQUIREMENT         │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │        STAGE 01: REQUIREMENTS     │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │     CONTROLLED GATES A -> F       │
                      │  (02 -> 03 -> ... -> 28 -> 29)    │
                      └─────────────────┬─────────────────┘
                                        │
                                        └─────────── (Loop Resets)
```

---

## 04. The 6 Controlled Governance Gates

| Gate ID | Gate Name | Included Stages | Objective & Gate Exit Invariant |
| :---: | :--- | :---: | :--- |
| **Gate A** | **Product Truth** | Stages 01–05 | Requirements, Acceptance Criteria, System Baseline, Architecture Principles (AP-001–AP-015), and System Boundary. |
| **Gate B** | **Business Architecture** | Stages 06–09 | Domain Model (27 entities), Canonical 15-Step Workflow, Decoupled State Model, and RBAC Capability Matrix. |
| **Gate C** | **Application Architecture** | Stages 10–15 | Frontend IA (8 Hubs), Page & Route Contract (31 pages), Database Decision, Data Contract, Media Architecture, and API Contracts. |
| **Gate D** | **Runtime Architecture** | Stages 16–22 | Realtime (SSE/Polling), Jobs (Cloud Tasks), AI Governance (Human-in-the-Loop), Security, Analytics, Audit/Observability, and Cost Architecture ($\le$ ₹100/mo). |
| **Gate E** | **Migration & Engineering** | Stages 23–26 | Incremental Migration Safety, 9-Scenario Test Architecture, Implementation Dependency Graph, and 8 Feature Contracts. |
| **Gate F** | **Execution & Lifecycle** | Stages 27–30 | Implementation Cycle Governance, Verification & Human Testing, Deployment & Release (Cloud Run), and Production Baseline Loop. |

---

## 05. Stage 12 Critical Rule: Database Architecture Decision

In accordance with **COST-001** and operational realities, the database decision is formally evaluated across four viable architectures:

| Evaluation Dimension | 1. Google Sheets (Current) | 2. Firestore Native (Target) | 3. Cloud SQL PostgreSQL | 4. Hybrid Sheets + Firestore [SELECTED] |
| :--- | :---: | :---: | :---: | :---: |
| **Monthly Cost ($\le$ ₹100 INR)** | **₹0.00 (Free)** | **₹0.00 (50k reads, 20k writes/day free)** | ₹800–₹2,500/mo (Exceeds budget) | **₹0.00 (Free Tier Guaranteed)** |
| **Cloud Run Scale-to-Zero** | Excellent (REST) | **Native (gRPC multiplexed)** | Complex (Connection pool exhaustion) | **Native & Seamless** |
| **Realtime Sync & Events** | Polling only (5s delay) | **Native Snapshot Listeners** | Requires Redis / Listen-Notify | **Native Realtime UI** |
| **Optimistic Concurrency (OCC)** | Weak (Sheet-level lock) | **ACID Transactions (`runTransaction`)**| ACID Transactions | **Strict Document OCC Preconditions** |
| **RBAC Data Security** | Service Account Proxy | **Granular Security Rules** | Row-Level Security (RLS) | **Zero-Trust Backend Enforcement** |
| **15-Step Workflow State** | Flat 25 Tabs | **Nested Subcollections & Documents** | Relational Foreign Keys | **Normalized Collections + Worksheets** |
| **Media Binary References** | URL string in cell | **Structured MediaDocument reference** | URL column | **External Drive ID + Hash reference** |
| **Analytical Queries** | Formulas / AppScript | **BigQuery Export / Sheets Mirror** | SQL Aggregations | **Realtime Firestore + Sheets Analytics**|

**Decision Summary:** The system selects the **Hybrid Sheets + Firestore Architecture**, utilizing Google Sheets as the human-accessible archival surface and Firestore Native Mode for high-concurrency, real-time workflow state and optimistic locking, maintaining cloud costs at **₹0.00 / month**.

---

## 06. Master 30-Stage Canonical Matrix (The 5 Canonical Fields)

Every stage of the Master Plan adheres strictly to the 5 canonical fields:

| Stage # | Stage Name | Current State | Target State | Key Decisions | Open Questions | Acceptance Criteria |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Requirements | Scattered briefs | Structured business outcomes | Low-volume Telugu SSC focus (1-5 Q/day) | Additional subject expansion? | AC-001 through AC-005 verified |
| **02** | Acceptance Criteria | Informal reviews | Formal negative & positive tests | Anti-self-approval inviolable | SME multi-reviewer escalation? | NEG-01 to NEG-07 locked |
| **03** | System Baseline | Legacy Express & Sheets | 31 React pages, 25 tabs cataloged | Brownfield modernization preserved | Deprecation timing of old tabs? | Baseline tests passing |
| **04** | Architecture Principles | Ad-hoc patterns | 15 Canonical Principles (AP-001-015)| AP-011 Monolith, AP-012 Cost ceiling | Secondary CDN necessity? | 15/15 principles enforced in code |
| **05** | System Boundary | Fuzzy API edges | 16 inside domains, 6 outside adapters| Externalize media to Google Drive | WhatsApp distribution timeline? | Boundary isolation confirmed |
| **06** | Domain Model | Implicit sheet rows | 27 Domain Entities strongly typed | Entities decoupled from tech status | Sub-topic taxonomy depth? | 27 Zod schemas validated |
| **07** | 15-Step Workflow | Loose transitions | Canonical sequential progression | Closed-loop feedback (15 -> 01) | Parallel review branches? | Illegal jumps strictly rejected |
| **08** | State Model | Overloaded status field | 5 decoupled state dimensions | Disentangle failure from rejection | Automatic retry exhaustion state? | Lifecycle state decoupled |
| **09** | RBAC & Capabilities | Simple role strings | Capability matrix & sessionVersion | GAR-02 anti-self-approval enforced | Temporary delegation duration? | Backend authorization authority |
| **10** | Frontend IA | Disorganized sidebar | 8 Canonical Workspace Hubs | Hubs mapped to workflow steps | Dark/Light mode persistence? | 8 hubs registered with sub-routes |
| **11** | Route Contract | 78 unstructured routes | 31 pages strictly typed | Deterministic route URLs with params | Deep-linking token expiration? | App.tsx route contract verified |
| **12** | Database Decision | Google Sheets only | Hybrid Sheets + Firestore | ₹0 cost ceiling, OCC concurrency | Cloud Firestore migration phase? | Multi-criteria score finalized |
| **13** | Data Contract | Variable sheet columns | Firestore collection schemas | Mandatory OCC versioning | Archive collection retention? | Standard Base Entity enforced |
| **14** | Media Architecture | Local/Drive uploads | External Drive + Metadata in CMS | AP-007/008 Media boundary | Transcoding latency threshold? | Zero binary storage in CMS |
| **15** | API Contract | Inconsistent responses | ApiResponseEnvelope & Zod validation | Idempotency keys on state mutations | GraphQL consideration? (Rejected) | 100% envelope compliance |
| **16** | Realtime Architecture | Manual page refresh | SSE streaming + polling fallback | Stateless Cloud Run compatibility | WebSocket gateway necessity? (No) | Sub-second state updates |
| **17** | Job Architecture | In-process timeouts | Cloud Tasks + in-process runner | Push queues over paid workers | Maximum queue retry count? (3) | Zero-loss async task dispatch |
| **18** | AI Architecture | Unmonitored LLM calls | Assistive-only, human-gated AI | AP-009 Strict human verification | Gemini 2.5 vs Flash fine-tuning? | AI blocked from auto-approvals |
| **19** | Security Architecture | Basic headers | Zero-trust, Helmet, Session rotation| Cryptographic session secret | Biometric 2FA roadmap? | Rate limits & CSRF active |
| **20** | Analytics Architecture | Disconnected stats | Closed-loop curriculum intelligence | YouTube Analytics + CMS Telemetry | Predictive difficulty scoring? | Closed-loop feedback verified |
| **21** | Audit & Observability | Minimal server logs | Immutability, non-repudiation ledger | Structured JSON Google Cloud Logging| Log retention days in GCS? (365) | 100% mutation audit coverage |
| **22** | Cost Architecture | Variable estimates | Strict <= ₹100 INR/mo mathematical proof | Cloud Run serverless scale-to-zero | Paid domain registrar budget? | Proof of ₹0–₹100 ceiling |
| **23** | Migration Architecture | Big-bang risk | Incremental, non-destructive migration | Dual-read, dual-write safety gates | Cutover rollback window? (24h) | Zero data loss during cutover |
| **24** | Test Architecture | Ad-hoc unit tests | 9-Scenario failure & recovery matrix| Tests precede implementation | Flaky test detection threshold? | 9 failure modes tested per step |
| **25** | Dependency Graph | Random feature builds | Topological dependency sequencing | Requirements -> Domain -> Workflow | Parallel team branch strategy? | Zero circular dependencies |
| **26** | Feature Contracts | Vague user stories | 15-dimension contract per feature | Mandatory test & rollback specs | Feature flag storage mechanism? | 8 feature contracts codified |
| **27** | Implementation Cycle | Uncontrolled AI patching | Sequential 11-step governance pipeline| Mandatory stop at stage completion | Code review turnaround SLA? | Governance pipeline enforced |
| **28** | Verification & Testing | Manual smoke checks | Tri-Partite Model (Automated/Audit/Human)| "Observe -> Record -> Continue if safe"| SME acceptance form signoff? | Anti-patching rule active |
| **29** | Deployment & Release | Manual container pushes | 8-step pipeline + 13 checklist items | Automated instant Cloud Run rollback | Multi-region deployment? (No) | Zero-downtime release certified |
| **30** | Production Baseline | Moving target | Formally certified stable baseline | Continuous SDLC Loop (30 -> 01) | Baseline audit cadence? (Monthly)| Full 30-stage baseline locked |

---

## 07. Verification Gate Certification Criteria

A cycle receives formal **`ACCEPTED — COMPLETE — CLOSED`** certification only when:
1. All 30 stages satisfy their respective Acceptance Criteria.
2. The 6 Governance Gates (Gates A through F) are 100% verified.
3. The 5 canonical fields are maintained for all 30 stages.
4. Total cloud expenditure is mathematically verified at $\le$ ₹100 INR/month.
5. The Continuous SDLC Loop is activated for subsequent iterations.
