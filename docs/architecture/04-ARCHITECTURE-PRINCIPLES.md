# 04 — ARCHITECTURE PRINCIPLES
## Burra Pariksha Content Management System (BP-CMS)
### Stage 04 of 30-Stage Modernization Program — Authoritative Architectural Governance

---

## 1. Document Governance & Anti-Overclaim Statement

| Attribute | Definition |
| :--- | :--- |
| **Document Path** | `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` |
| **SDLC Stage** | Stage 04 — Architecture Principles |
| **Document Version** | 1.0.0-SDLC-RESTART |
| **Status** | ACTIVE ARCHITECTURAL GOVERNANCE BASELINE |
| **Scope** | 15 Authoritative Principles Governing All Future BP-CMS Architectural & Implementation Decisions |

### Strict Anti-Overclaim Invariants
1. **Governance vs. Implementation:** This document establishes **ARCHITECTURAL RULES** and constraints for future engineering stages. It does **NOT** claim that the current brownfield codebase already complies with these principles.
2. **Current System Preserved:** The current system remains exactly as frozen and documented in Stage 03 (`docs/baseline/03-CURRENT-SYSTEM-BASELINE.md`). Existing code paths, competing mechanisms, and discovered defects are **NOT** altered in Stage 04.
3. **No Phantom Progress:** Words such as *"Compliant"*, *"Implemented"*, or *"Refactored"* must never be applied to application code in Stage 04. Principles state what future implementations **MUST** satisfy.
4. **Zero Production Code Changes:** No production application files, routes, services, schemas, or database tables are modified in Stage 04.

---

## 2. Relationship to Stages 01–03

```text
┌──────────────────────────────────────────────┐
│  STAGE 01 — REQUIREMENTS BASELINE           │
│  Defines WHAT the product must become        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  STAGE 02 — BUSINESS ACCEPTANCE CRITERIA    │
│  Defines HOW requirements will be verified   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  STAGE 03 — CURRENT SYSTEM BASELINE         │
│  Freezes WHAT ACTUALLY EXISTS right now      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  STAGE 04 — ARCHITECTURE PRINCIPLES         │
│  Defines the RULES governing all future      │
│  design, migration, and implementation work  │
└──────────────────────────────────────────────┘
```

The 15 principles defined herein bridge the gap between requirements and implementation:
- Stage 01 defined the business capabilities (`BR-001..011`) and non-functional requirements (`NFR-001..008`).
- Stage 02 defined measurable acceptance criteria (`BAC`, `UAC`, `WAC`, `SAC`, `DAC`, `MAC`, `CAC`).
- Stage 03 discovered the brownfield reality: 6 verified defects, competing workflow enums, unmounted page code, and zero automated tests.
- Stage 04 provides the architectural constitution to resolve these conflicts systematically in Stages 05 through 30.

---

## 3. The 15 Authoritative Architecture Principles

---

### PRINCIPLE 01: ONE CANONICAL 15-STEP BUSINESS WORKFLOW
**Future BP-CMS architecture and implementation must center exclusively upon the single canonical 15-step business workflow.**

1. `01. Question Generation`
2. `02. Question Verification`
3. `03. Audience Script`
4. `04. Teleprompter & Filming`
5. `05. Raw Video`
6. `06. Editing Bay`
7. `07. Final QC`
8. `08. Thumbnail`
9. `09. Social Review`
10. `10. Publishing Setup`
11. `11. Published`
12. `12. Platform Sync`
13. `13. Analytics`
14. `14. Performance Review`
15. `15. Intelligence Loop`

- **Rationale:** Competitive examination educational media requires rigorous academic audit, precise spoken delivery, broadcast loudness standards, and mobile safe-zone verification. Allowing multiple ad-hoc or parallel workflows creates unverified content leaks and operational chaos.
- **Architectural Implications:**
  - All domain entities, routing structures, database records, and event handlers must reference this 15-step sequential backbone.
  - UI navigation and workbench layouts must cleanly map to these 15 canonical steps.
- **What This Principle Prohibits:**
  - Prohibits creating alternative, parallel, or competing business workflows (e.g., publishing a video without passing through Final QC or Social Review).
  - Prohibits introducing sub-workflows that bypass the 15-step sequence.

---

### PRINCIPLE 02: BUSINESS STAGE ≠ TECHNICAL STATE
**A canonical business workflow stage must never be conflated with technical entity status, media status, background job status, or publication status.**

The system must maintain 5 conceptually and structurally distinct state dimensions:
1. `workflow_step`: Where the item sits in the 15-step business manufacturing process (e.g., `06_EDITING_BAY`).
2. `entity_status`: The lifecycle state of the record itself (e.g., `DRAFT`, `ACTIVE`, `REVISION_REQUIRED`, `ARCHIVED`).
3. `media_status`: The availability and integrity of linked external files (e.g., `NONE`, `PENDING_UPLOAD`, `REGISTERED`, `CHECKSUM_VERIFIED`).
4. `job_status`: The execution state of asynchronous tasks (e.g., `IDLE`, `QUEUED`, `PROCESSING`, `FAILED`).
5. `publication_status`: The external broadcast availability on distribution channels (e.g., `UNPUBLISHED`, `SCHEDULED`, `PUBLISHED`, `SYNC_VERIFIED`).

- **Rationale:** Conflating these dimensions causes severe bugs—such as marking a video "Published" because an upload job finished, or resetting an entire workflow because a background transcoding task retried.
- **Architectural Implications:**
  - Database schemas, TypeScript interfaces, and API contracts must declare separate properties for each state dimension.
  - Updating a job or media status must never execute an implicit or side-effect mutation on `workflow_step`.
- **What This Principle Prohibits:**
  - Prohibits single monolithic status enums (e.g., an enum containing `DRAFT`, `ENCODING`, `PUBLISHED` in the same field).
  - Prohibits deriving workflow position solely from media attachment presence.

---

### PRINCIPLE 03: ONE AUTHORITATIVE WORKFLOW TRANSITION MECHANISM
**Exactly one centralized, server-side engine must possess authoritative power to evaluate and execute workflow stage transitions.**

- **Rationale:** Stage 03 discovered multiple fragmented mechanisms independently attempting state mutations (`WorkflowOrchestrationService`, direct repository updates in `routes.ts`, and ad-hoc client-side state pushes). This fragmentation causes inconsistent validation, race conditions, and unlogged transitions.
- **Architectural Implications:**
  - A single dedicated Workflow Engine must be designed in Stage 14.
  - All API routes requesting a stage transition must dispatch their request through this single engine.
  - The engine must validate entry prerequisites, exit conditions, actor role capabilities, and concurrency versions before committing mutations.
- **What This Principle Prohibits:**
  - Prohibits repositories, controllers, or UI components directly mutating `workflow_step` or overriding state machine rules.
  - Prohibits multiple competing workflow orchestration services.

---

### PRINCIPLE 04: BACKEND IS AUTHORITATIVE FOR AUTHORIZATION
**Authorization decisions must be evaluated and enforced strictly on the server; client-side visibility controls are strictly for user experience.**

- **Rationale:** Stage 03 revealed that `getRequestActor()` in `src/server/routes.ts` silently fell back to user `USR-001` (Admin) for unauthenticated callers, leaving backend routes vulnerable if frontend guards are bypassed.
- **Architectural Implications:**
  - Every API endpoint mutating data or accessing protected resources must execute server-side session authentication (`requireAuth`) and capability verification (`requireRole` or capability checks).
  - The server must reject unauthorized requests with HTTP 401 Unauthorized or HTTP 403 Forbidden.
  - Frontend capability checks (e.g., hiding an "Approve" button) serve solely to streamline UX and never replace server verification.
- **What This Principle Prohibits:**
  - Prohibits trusting client-supplied role claims, actor headers (`req.body._actor`), or client-side permission checks.
  - Prohibits silent administrative fallbacks on unauthenticated API execution paths.

---

### PRINCIPLE 05: BACKEND IS AUTHORITATIVE FOR BUSINESS RULES
**All domain invariants, validation rules, checklist requirements, and compliance constraints must be authoritatively enforced by the backend.**

Examples of mandatory server-enforced invariants:
- Exactly 4 multiple-choice options with exactly 1 correct key (`BR-001`).
- Anti-Self-Approval (`GAR-02: authorId !== verifierId`) (`BR-002`).
- Spoken script duration bounds (45–60 seconds at 130–150 wpm) (`BR-003`).
- Audio loudness mastering (-14 LUFS standard) and QC certification stamp (`BR-004`).
- Duplicate publishing prevention and idempotency keys (`BR-007`).
- Rationale: While client-side form validation provides instantaneous interactive feedback to users, malicious, corrupted, or script-driven network requests can bypass browser code.
- **Architectural Implications:**
  - Zod validation schemas and domain service validators must execute on the server pipeline prior to datastore writes.
  - Datastore adapters must reject non-compliant entities even if called directly by background jobs.
- **What This Principle Prohibits:**
  - Prohibits relying on browser JavaScript as the sole enforcement mechanism for any business rule.

---

### PRINCIPLE 06: FRONTEND NEVER DECIDES WHETHER A TRANSITION IS VALID
**Frontend components must never determine or compute the authoritative validity of a workflow transition.**

- **Rationale:** Decentralizing workflow transition logic into React components leads to logic drift, duplicated business rules across pages, and vulnerability to client-side manipulation.
- **Architectural Implications:**
  - The frontend queries the backend for available transitions and displays action controls accordingly.
  - When the user triggers an action, the frontend dispatches a transition intent request to the backend.
  - The backend evaluates state, permissions, and prerequisites, executing the transition or returning descriptive rejection reasons.
- **What This Principle Prohibits:**
  - Prohibits React components directly updating an entity's workflow stage in local state without server authorization.
  - Prohibits duplicating state machine transition tables in browser code.

---

### PRINCIPLE 07: MEDIA BINARIES REMAIN EXTERNAL TO THE APPLICATION DATABASE
**Multi-megabyte and gigabyte media files (raw video takes, master cuts, high-res audio, PSDs) must never be stored inside the primary application database.**

- **Rationale:** Storing multi-gigabyte video binaries inside Google Sheets, relational databases, or document stores causes immediate database bloat, quota exhaustion, network latency bottlenecks, and high operational costs.
- **Architectural Implications:**
  - Large binary media must be persisted in external storage (e.g., Google Drive, Google Cloud Storage).
  - Media uploads must stream directly from the client/proxy to the external storage target via chunked or streaming pipelines (`busboy`).
  - The primary application database stores only lightweight metadata records (pointers, URIs, checksums, dimensions, sizes).
- **What This Principle Prohibits:**
  - Prohibits Base64-encoding video/audio payloads into database rows or JSON API document bodies.
  - Prohibits storing raw camera footage in application memory buffers.

---

### PRINCIPLE 08: MEDIA REFERENCES BELONG TO THE APPLICATION DATA MODEL
**While binary media files are stored externally, their locators, integrity checksums, and lifecycle metadata constitute first-class application data.**

- **Rationale:** Storing untracked media links as arbitrary strings leads to broken links, unverified video edits reaching broadcast, and inability to audit media provenance.
- **Architectural Implications:**
  - Media assets must have formal data entities (`MediaAsset`) with defined schemas.
  - The schema must track: external storage URI, storage provider, SHA-256 checksum, file size in bytes, duration, resolution, audio loudness measure, mime type, linked project ID, and creation timestamp.
  - Workflows hand off media references, not raw files, and must verify reference integrity (e.g., pre-QC checksum checks).
- **What This Principle Prohibits:**
  - Prohibits untyped, unstructured media URLs scattered across ad-hoc text fields.
  - Prohibits promoting a master video cut to QC without registered metadata and checksum.

---

### PRINCIPLE 09: AI ASSISTS HUMANS; AI DOES NOT SILENTLY APPROVE
**Artificial intelligence capabilities must remain strictly assistive; AI is prohibited from autonomously executing human-gated workflow approvals or mutating protected business state.**

- **Rationale:** Burra Pariksha produces competitive examination educational content where mathematical errors or syllabus mismatches carry severe reputational and academic penalties. Human editorial responsibility must remain uncompromised.
- **Permitted AI Capabilities:**
  - Drafting question stems, distractor options, and preliminary proofs.
  - Generating suggested spoken script hooks and pacing estimates.
  - Analyzing viewer retention drop-offs and recommending curriculum sprint topics.
  - Synthesizing audience comment sentiment.
- **Prohibited AI Capabilities:**
  - AI must NEVER approve a question verification gate (`BR-002`).
  - AI must NEVER certify a Final QC pass (`BR-004`).
  - AI must NEVER authorize a live publishing release (`BR-007`).
  - AI recommendations must remain distinct from authoritative state until explicitly approved by an authorized human.

---

### PRINCIPLE 10: NO DUPLICATE OWNERSHIP OF BUSINESS STATE
**Every business entity and state dimension must have exactly one authoritative datastore owner and exactly one service owner.**

- **Rationale:** Stage 03 discovered competing entities (e.g., `ContentMaster` vs. `Question` + `Video`, multiple script version tables, duplicated assignment models). When multiple models represent the same reality, data divergence, concurrency conflicts, and synchronization bugs inevitably occur.
- **Architectural Implications:**
  - Downstream domain modeling (Stage 06) must establish unambiguous aggregate roots and clear entity boundaries.
  - Multiple services may read an entity, but only the designated service owner may execute mutations.
- **What This Principle Prohibits:**
  - Prohibits maintaining dual, competing data stores for the same entity without explicit master-slave synchronization.
  - Prohibits ad-hoc mutations bypassing the owning service.

---

### PRINCIPLE 11: NO UNNECESSARY MICROSERVICES (MODULAR MONOLITH)
**BP-CMS must remain a unified, modular application unless an extraordinary, empirically proven technical requirement justifies an independent deployment service.**

- **Rationale:** Splitting an application into microservices prematurely introduces massive operational overhead, network latency, distributed transaction complexities, deployment fragility, and high infrastructure expenses—violating our core constraints.
- **Architectural Implications:**
  - Architecture must be structured as a disciplined **Modular Monolith**: strict internal modular boundaries, well-defined internal interfaces, and clear separation of concerns (UI → Application Services → Repositories → Data Adapters).
  - Any future proposal to separate a capability into an independent service requires formal justification proving that scaling, security, or isolation cannot be achieved within the modular monolith.
- **What This Principle Prohibits:**
  - Prohibits splitting functionality into separate microservices for organizational appearance or theoretical modularity.
  - Prohibits distributed service meshes or complex cross-service RPC overhead.

---

### PRINCIPLE 12: NO INFRASTRUCTURE PURCHASED WITHOUT COST JUSTIFICATION
**Initial infrastructure expenditure must remain strictly within ₹0 – ₹100 (`COST-001`); no paid cloud service, commercial database, or paid license may be introduced without formal justification.**

- **Rationale:** The system is explicitly constrained by `COST-001` to operate with near-zero initial financial overhead, maximizing platform free tiers (Google Cloud free tier, Google Sheets API, local Node runtime).
- **Architectural Implications:**
  - Architecture designs must leverage zero-cost components.
  - Any proposed future expenditure above ₹100 requires:
    1. A detailed technical necessity statement.
    2. Total Cost of Ownership (TCO) breakdown.
    3. Proof that free-tier alternatives cannot fulfill the requirement.
    4. Explicit Product Owner sign-off.
- **What This Principle Prohibits:**
  - Prohibits provisioning paid cloud databases, managed Redis instances, or commercial SaaS dependencies during modernization without justification.

---

### PRINCIPLE 13: EXISTING FUNCTIONALITY IS MIGRATED INCREMENTALLY
**Modernization must proceed via disciplined, incremental stages preserving existing production capabilities and data throughout the transition.**

```text
CLASSIFY  ───►  CONSOLIDATE  ───►  MIGRATE  ───►  VERIFY  ───►  RETIRE
```

- **Rationale:** The repository contains a live brownfield application with active question libraries, Google Sheets schemas, and working UI workflows. "Big Bang" rewrites invariably cause data loss, extended downtime, regression bugs, and operational paralysis.
- **Architectural Implications:**
  - Existing working functionality must be preserved until the modernized replacement has passed verification.
  - Migrations must be executed in orderly steps:
    1. *Classify:* Audit existing code and identify overlaps (completed in Stage 03).
    2. *Consolidate:* Unify competing models into a single canonical target.
    3. *Migrate:* Transition traffic and data to the unified path.
    4. *Verify:* Execute automated tests and regression checks.
    5. *Retire:* Safely delete obsolete code only after the replacement is proven.
- **What This Principle Prohibits:**
  - Prohibits reckless "delete everything and rebuild from scratch" approaches.
  - Prohibits deleting legacy code before its modernized successor is fully verified.

---

### PRINCIPLE 14: HISTORICAL AUDIT EVIDENCE IS PRESERVED
**Audit records, historical version snapshots, publication logs, and forensic event ledgers must never be destroyed or silently overwritten.**

- **Rationale:** Educational compliance, quality accountability, and pedagogical analysis require an unbroken historical record of who authored, verified, recorded, edited, and approved each piece of content.
- **Architectural Implications:**
  - Audit logging must be append-only (`AUDIT_LOG` tab / ledger).
  - Deletions of business entities must be soft deletions (marking `entity_status = 'ARCHIVED'`), preserving historical relationships.
  - All workflow transitions, verification checklists, and publishing dispatches must record actor ID, timestamp, and before/after state deltas.
- **What This Principle Prohibits:**
  - Prohibits hard deletions (`DELETE` SQL / clearing sheet rows) of published or verified content.
  - Prohibits unlogged administrative overrides.

---

### PRINCIPLE 15: EVERY IMPLEMENTATION MUST BE TESTABLE
**Every production feature, service method, API route, and workflow transition must have an objective, automated verification path.**

- **Rationale:** Stage 03 established that the repository currently has **0.00% automated test coverage** and no test runner in `package.json`. Relying solely on manual inspection is unreliable, slow, and permits regressions to escape into production.
- **Architectural Implications:**
  - Implementation stages must be accompanied by executable test suites (unit, integration, contract, or E2E).
  - Code must be structured for testability: dependency injection, decoupled storage adapters, and pure business validation functions.
  - "The build passes" or "a Git commit exists" is strictly insufficient proof of feature completeness.
- **What This Principle Prohibits:**
  - Prohibits declaring any implementation stage complete without automated tests proving runtime correctness.
  - Prohibits untestable tightly-coupled global singletons that cannot be instantiated in a test environment.

---

## 4. Architectural Conflict Register (Stage 03 Discrepancies)

The following architectural conflicts were empirically identified during the Stage 03 baseline audit and are recorded here as mandatory resolution targets for subsequent stages.

> [!NOTE]
> In accordance with Stage 04 rules, **none of these conflicts are modified or fixed in Stage 04**. They are formally logged for resolution in designated downstream stages.

| Conflict ID | Principle Violated | Current Implementation Evidence (from Stage 03) | Why It Conflicts | Affected Subsystem | Downstream Resolution Stage | Migration Required? |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **ACR-001** | **Principle 01 & 03** (Canonical Workflow & Single Transition Authority) | `WorkflowOrchestrationService` (11 states), `VideoProductionStatus` (9 states), `QuestionStatus` (6 states) | Three competing state machines independently govern lifecycle transitions without a single source of truth. | Workflow Engine | Stage 07 & Stage 14 | **YES** |
| **ACR-002** | **Principle 04** (Backend Authoritative Authorization) | `src/server/routes.ts:138-139` (`getRequestActor` silent Admin fallback to `USR-001`) | Unauthenticated callers reaching unshielded handlers are automatically granted full administrative privileges. | Auth & API Pipeline | Stage 09 & Stage 15 | **YES** |
| **ACR-003** | **Principle 10 & 13** (Duplicate Ownership & Incremental Migration) | 6 unmounted page files (`VideoEditPage`, `VideoFinalPage`, etc., 4,900+ lines) vs. `VideoDetailPage.tsx` (tabs) | Dead historical pages exist alongside active tabbed workbench, creating code duplication and developer confusion. | Frontend Pages | Stage 10 & Stage 21 | **YES** (Retire dead code after verification) |
| **ACR-004** | **Principle 11** (Modular Architecture) | Monolithic `src/server/routes.ts` (6,562 lines, ~250 endpoints in one file) | Violates clean separation of concerns; routing, validation, error handling, and business logic are tightly coupled. | Server Routing | Stage 13 & Stage 15 | **YES** (Decompose into modular domain routers) |
| **ACR-005** | **Principle 15** (Testability) | `package.json` contains no test runner (`vitest` missing), 0 automated test files in repository | Behavioral verification is completely absent; changes cannot be objectively proven without automated test suites. | Tooling & QA | Stage 05 (Harness) & Stage 19+ | **YES** (Install test harness & write tests) |
| **ACR-006** | **Principle 02** (State Separation Axiom) | UI components and routes conflate `VideoProductionStatus` with the 15-step business workflow step | Mutating a video production status accidentally mutates or skips workflow positions. | Domain State | Stage 06 & Stage 08 | **YES** |
| **ACR-007** | **Principle 03** (Single Transition Mechanism) | `src/lib/services/workflow.service.ts` is an empty 7-line stub re-exporting `audit.service.ts` | The canonical workflow service export does not contain actual transition logic; logic is scattered across controllers. | Workflow Services | Stage 07 & Stage 14 | **YES** |

---

## 5. Principle $\rightarrow$ Future SDLC Stage Mapping

Every principle is mapped to the downstream engineering stages responsible for its formal enforcement:

| Principle # | Principle Name | Responsible SDLC Stages for Formal Enforcement |
| :---: | :--- | :--- |
| **P-01** | One Canonical 15-Step Workflow | Stage 07 (Workflow Model), Stage 14 (Workflow Engine), Stage 28 (E2E Verification) |
| **P-02** | Business Stage $\neq$ Technical State | Stage 06 (Domain Model), Stage 08 (State Models), Stage 13 (API Contracts) |
| **P-03** | One Authoritative Transition Mechanism | Stage 14 (Workflow Engine Implementation), Stage 15 (API Handlers), Stage 28 |
| **P-04** | Backend Authoritative for Authorization | Stage 09 (RBAC Specification), Stage 15 (Auth Middleware), Stage 29 (Security Audit) |
| **P-05** | Backend Authoritative for Business Rules | Stage 06 (Domain Model), Stage 13 (Contracts), Stage 19–26 (Domain Workflows) |
| **P-06** | Frontend Never Decides Transitions | Stage 10 (Frontend IA), Stage 11 (Component Contracts), Stage 28 (E2E Verification) |
| **P-07** | Media Binaries External to Database | Stage 17 (Media Storage Architecture), Stage 21 (Video Bay), Stage 29 (Performance) |
| **P-08** | Media References in Application Data | Stage 06 (Domain Model), Stage 13 (API Contracts), Stage 17 (Media Adapters) |
| **P-09** | AI Assists; AI Does Not Silently Approve| Stage 06 (Domain Model), Stage 14 (Workflow Gates), Stage 19 (AI Assistant Boundary) |
| **P-10** | No Duplicate Ownership of State | Stage 06 (Domain Model), Stage 12 (Database Architecture), Stage 16 (Persistence Impl)|
| **P-11** | No Unnecessary Microservices | Stage 05 (Boundary Architecture), Stage 12 (Modular Architecture Governance) |
| **P-12** | No Infrastructure Without Cost Justification| Stage 12 (Database Selection), Stage 27 (Deployment Topologies), Stage 30 (Audit) |
| **P-13** | Incremental Migration (Brownfield) | Stage 18 (Migration Roadmap), Stage 19–26 (Incremental Domain Delivery), Stage 27 |
| **P-14** | Historical Audit Preservation | Stage 08 (State Models), Stage 09 (RBAC), Stage 26 (Audit & History Verification) |
| **P-15** | Every Implementation Must Be Testable | Stage 05 (Test Harness Setup), Stage 19–28 (Automated Test Suites per Stage) |

---

## 6. Architectural Decision Priority Rules

When evaluating technical tradeoffs, engineering proposals, or code reviews in future stages, the following strict priority hierarchy must be enforced:

```text
1. BUSINESS REQUIREMENTS (Stage 01)
       │
       ▼
2. ACCEPTANCE CRITERIA (Stage 02)
       │
       ▼
3. ARCHITECTURE PRINCIPLES (Stage 04)
       │
       ▼
4. TARGET CONTRACTS & SCHEMAS (Stages 06–13)
       │
       ▼
5. IMPLEMENTATION CONVENIENCE / SPEED
```

**Cardinal Invariant:** *Implementation convenience must NEVER override an architecture principle, acceptance criterion, or business requirement.* If an implementation shortcut violates server-side authorization, bypasses the workflow engine, or conflates state dimensions, it must be rejected.

---

## 7. Anti-Overengineering Rule

The 15 architecture principles must never be used as a pretext for introducing speculative abstraction layers, gratuitous design patterns, or overengineered frameworks.

Every future architectural component, class, or service must satisfy:
1. **Demonstrated Responsibility:** Must directly fulfill an approved Stage 01 requirement or Stage 02 acceptance condition.
2. **Clear Single Owner:** Must belong to exactly one domain bounded context.
3. **Explicit Input/Output Contract:** Must use validated, type-safe schemas (Zod).
4. **Testability:** Must be verifiable via automated tests without requiring live production cloud infrastructure.
5. **Simplicity:** The simplest design that completely fulfills the requirements and upholds the principles is the correct design.

---

## 8. Stage 04 Completion Checklist

- [x] All 15 canonical architecture principles formally documented with rationale, implications, and prohibitions.
- [x] Canonical 15-step sequential business workflow explicitly codified.
- [x] Business Stage $\neq$ Technical State separation axiom formalized.
- [x] Server-authoritative workflow transition engine requirement established.
- [x] Backend-authoritative authorization requirement established (silent admin fallback prohibited).
- [x] Backend-authoritative business rules requirement established.
- [x] Frontend transition computation explicitly prohibited.
- [x] Media binary external storage boundary formalized.
- [x] First-class media reference application data model defined.
- [x] Human-gated AI boundary formalized (AI prohibited from autonomous approvals).
- [x] Single state ownership rule established.
- [x] Modular monolith architecture affirmed; unnecessary microservices prohibited.
- [x] Infrastructure cost ceiling (₹0–₹100) established as mandatory constraint (`COST-001`).
- [x] Incremental brownfield migration discipline established (`CLASSIFY → CONSOLIDATE → MIGRATE → VERIFY → RETIRE`).
- [x] Append-only audit history preservation formalized.
- [x] Automated testability mandatory for all future implementations.
- [x] Architectural Conflict Register populated with 7 concrete conflicts from Stage 03 baseline.
- [x] Comprehensive Principle $\rightarrow$ Future SDLC Stage Mapping table created.
- [x] Architectural decision priority rules and anti-overengineering constraints formalized.
- [x] **Zero production source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 04 — ARCHITECTURE PRINCIPLES
================================================================================
Artifact:            docs/architecture/04-ARCHITECTURE-PRINCIPLES.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 04 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 04. Awaiting Stage 05 Instruction.
================================================================================
```
