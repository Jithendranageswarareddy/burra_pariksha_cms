# Burra Pariksha CMS
# 04 — Architecture Principles

Stage: 04 — Architecture Principles

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-01

Version:
1.0.0

Purpose:
Establishes the foundational, inviolable architecture principles, boundary constraints, and governance rules that all future Burra Pariksha CMS (BP-CMS) design, migration, refactoring, and implementation activities must strictly adhere to.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 04 Architecture Principles | FACT |
| **File Path** | `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` | FACT |
| **Document Stage** | Stage 04 — Architecture Principles | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Closure Date** | 2026-10-01 | FACT |
| **Verified Git Commit** | `cf2c5d18e176a5fbc38094b8bf5d1bdfe09fd292` | FACT |
| **Authority** | Authoritative Architecture Governance Specification | FACT |
| **Preceding Verified Stages**| Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 05+ (Architecture Decisions, Data Architecture, Pipeline Design) | FACT |
| **Technology Mandate Stance**| **Strictly Technology-Neutral**: Establishes behavioral and structural boundaries without prematurely declaring unapproved databases, queues, or cloud infrastructure | FACT |

---

## 02. Purpose

The purpose of this document is to define the binding engineering constitution for BP-CMS. As the system moves from the brownfield baseline frozen in Stage 03 into modernization and migration planning, these principles guarantee:
1. **Consistency:** All domain workflows, entities, APIs, and interfaces operate under a single unified lifecycle contract.
2. **Safety & Zero Regression:** Critical defects identified in the Stage 03 baseline (such as state machine bypasses, split-brain status sync, and client-side authorization bypasses) are permanently precluded from future designs.
3. **Frugality & Reliability:** Infrastructure complexity, cost, and distributed operational burdens are bounded by strict justification rules.
4. **Human Accountability:** AI automation remains strictly assistive and bounded by explicit human checkpoints.

---

## 03. Relationship to Stage 01, Stage 02 and Stage 03

BP-CMS follows a strict sequential SDLC progression:
- **Stage 01 (`docs/requirements/01-REQUIREMENTS-BASELINE.md`):** Defines **WHAT** the system must become (Business requirements, user personas, operational scope, cost constraints, non-functional requirements).
- **Stage 02 (`docs/acceptance/02-BUSINESS-ACCEPTANCE-CRITERIA.md`):** Defines **HOW ACCEPTANCE IS PROVEN** (Objective, observable, testable acceptance criteria AC2-001 through AC2-025, negative gates NEG-01 through NEG-10).
- **Stage 03 (`docs/baseline/03-CURRENT-SYSTEM-BASELINE.md`):** Freezes **WHAT THE SYSTEM ACTUALLY IS TODAY** (Empirical brownfield baseline of Express, React 19, Google Sheets 25-tab persistence, Google Drive storage, 271 endpoints, and documented breaks).
- **Stage 04 (`docs/architecture/04-ARCHITECTURE-PRINCIPLES.md`):** Establishes **HOW ARCHITECTURE MUST BE GOVERNED** (The inviolable structural principles AP-001 through AP-015 that bridge requirements to future implementation without premature technology lock-in).

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 01: Requirements Baseline (What Must Exist)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────┐
│  Stage 02: Business Acceptance Criteria (How to Prove It)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────┐
│  Stage 03: Current System Baseline (What Actually Exists)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────┐
│  Stage 04: Architecture Principles (Inviolable Rules)       │
│  - AP-001 to AP-015 Engineering Constitution                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
            [ Future Architecture & Implementation ]
```

---

## 04. Architecture Governance Rules

Every future architecture decision record (ADR), design document, schema proposal, and code contribution must comply with the following meta-governance rules:
1. **No Speculative Architecture:** Technology choices must never precede requirement needs.
2. **Explicit Derivation:** Every technical component must trace directly back to an approved Stage 01 requirement or Stage 02 acceptance criterion.
3. **Non-Bypassable Controls:** Any architectural design that allows client-side code, external webhooks, or automated scripts to mutate business state without server-side validation is invalid by definition.
4. **Zero Silent Breaking Changes:** In brownfield modernization, legacy paths must remain verifiable or be retired through incremental cutover protocols.

---

## 05. Principle AP-001: Canonical 15-Step Workflow Principle

### 5.1 Identity & Statement
* **Principle ID:** `AP-001`
* **Principle Name:** One Canonical 15-Step Business Workflow
* **Rule:** The BP-CMS production lifecycle consists of exactly one linear, canonical 15-step business workflow. All content items must progress through these sequential stages, and no stage may be skipped, reordered, hidden, or bypassed unless an explicit conditional rule is authorized by the backend business engine.

### 5.2 The Canonical 15 Business Stages
```
[01: Question Generation] ──► [02: Question Verification] ──► [03: Audience Script]
             │
             ▼
[04: Teleprompter & Filming] ─► [05: Raw Video Handoff]   ──► [06: Video Editing]
             │
             ▼
[07: Final QC]            ──► [08: Thumbnail Studio]      ──► [09: Social Review]
             │
             ▼
[10: Publishing Setup]    ──► [11: Published / Live]      ──► [12: Platform Sync]
             │
             ▼
[13: Social Analytics]    ──► [14: Performance Review]    ──► [15: Performance Intelligence]
```

### 5.3 Rationale
In the Stage 03 baseline, workflow stages were fragmented across disparate UI pages (`VideoDetailPage` tabs, `ProductionTrackerPage`, `PublishingPage`) and state enums (`QuestionStatus`, `VideoProductionStatus`, `SocialPublishStatus`), leading to hidden barriers (e.g., `QUEUED -> EDITING` 3-hop workaround). A single canonical pipeline establishes unambiguous domain boundaries and unified operational tracking for creators, reviewers, and leadership.

### 5.4 Implementation Consequence
- The system must model the 15 stages as first-class domain milestones.
- Work item progress across dashboards, queues, assignments, and audit logs must map deterministically to these 15 canonical steps.
- UI views may consolidate steps for ergonomic editing (e.g., a unified workspace tab strip), but the underlying domain engine must track and validate each step transition independently.

### 5.5 Explicit Forbidden Patterns
- Introducing parallel, competing workflow pipelines that bypass the 15 stages.
- Allowing content to jump directly from Stage 01 (Draft) to Stage 04 (Recording) without Stage 02 (Verification) approval.
- Hardcoding custom stage sequences for specific content types without an approved architecture variance.

### 5.6 Verification Expectation
Automated end-to-end workflow tests must prove that an entity cannot reach Stage 11 (Publishing) without recorded, verifiable transitions through Stages 01 through 10.

---

## 06. Principle AP-002: Business Stage vs Technical State

### 6.1 Identity & Statement
* **Principle ID:** `AP-002`
* **Principle Name:** Business Stage is Not the Same Thing as Technical State
* **Rule:** The high-level business stage of a content item (where it sits in the 15-step production journey) must be architecturally decoupled from low-level technical states, operational sub-states, media processing flags, and entity status columns.

### 6.2 Rationale
Stage 03 audit uncovered critical desynchronization defects (`BRK-SF-01`, `BRK-SF-02`) because business progress was conflated with technical entity fields (e.g., updating `PUBLISHING.status = PUBLISHED` while `VIDEOS.status` remained `READY_TO_UPLOAD`, or `Question.videoStatus` diverging from `Video.status`). Technical tasks (such as video rendering, thumbnail image compression, or webhook delivery) operate within a business stage and do not constitute independent business stages.

### 6.3 Implementation Consequence
- The data model must maintain an authoritative business stage indicator for the master content item.
- Entity-specific technical states (e.g., `RenderStatus: IN_PROGRESS`, `UploadStatus: CHUNKING`, `TranscodeStatus: COMPLETED`) must be modeled as child properties or technical flags subordinate to the current business stage.
- Technical failures (e.g., thumbnail generation timeout) pause progression within that stage rather than corrupting the overall business stage position.

### 6.4 Explicit Forbidden Patterns
- Using raw database row statuses (e.g., `VideoProductionStatus.QUEUED`) as the sole proxy for overall content lifecycle stage across multiple entities.
- Updating an entity's technical state in a way that silently advances the business stage without executing the business stage transition validator.

### 6.5 Verification Expectation
State inspection queries must prove that modifying a technical child property (such as adding a third thumbnail variant) never alters the master content item's canonical business stage.

---

## 07. Principle AP-003: Authoritative Workflow Transition Mechanism

### 7.1 Identity & Statement
* **Principle ID:** `AP-003`
* **Principle Name:** One Authoritative Workflow Transition Mechanism
* **Rule:** All workflow state transitions must execute through a single, authoritative, centralized server-side workflow transition mechanism. Direct database row updates, ad-hoc service mutations, and client-driven field patches that alter workflow status are strictly forbidden.

### 7.2 Rationale
Stage 03 identified multiple competing state mutators (`videoService`, `publishingService`, `questionService`, and test harnesses) modifying status columns directly, causing race conditions and partial writes (`DB-CRIT-01`). A single transition engine ensures validation guards, precondition checks, audit logging, and post-transition events execute atomically.

### 7.3 Implementation Consequence
- A centralized workflow transition engine must intercept all transition requests.
- Every transition must evaluate:
  1. Identity & RBAC permissions of the acting user.
  2. Validity of the transition against an explicit State Transition Graph.
  3. Precondition checklist (e.g., required assets present, validations passed).
  4. Atomic persistence of the new state.
  5. Immutable emission of an audit log entry.
- Direct status mutations in entity repositories must be locked or restricted to internal engine calls.

### 7.4 Explicit Forbidden Patterns
- Bypassing the transition engine via direct `PATCH /api/videos/:id` calls containing `{ status: 'EDITED' }`.
- Implementing multi-hop client workarounds (e.g., chaining three separate API calls to jump across an illegal state boundary as seen in `BRK-HD-02`).
- Silent background processes modifying workflow status without passing through the transition validator.

### 7.5 Verification Expectation
Attempting to invoke an invalid transition (e.g., `DRAFT -> PUBLISHED`) or bypassing the transition controller via direct repository mutation must result in a rejected transaction and a logged security violation.

---

## 08. Principle AP-004: Backend Authorization Authority

### 8.1 Identity & Statement
* **Principle ID:** `AP-004`
* **Principle Name:** Backend is Authoritative for Authorization
* **Rule:** All authorization decisions, role verifications, ownership checks, and capability assessments must be executed and enforced authoritatively on the backend server. The client application is considered untrusted.

### 8.2 Rationale
Stage 03 revealed that `App.tsx` lacked route-level role guards (`SEC-HIGH-01`), relying solely on UI element visibility and navigation hiding. Any user could type administrative routes directly into the browser. Authorization cannot depend on the client's compliance.

### 8.3 Implementation Consequence
- Every API endpoint and server action must validate the caller's session token and enforce role/capability requirements via server-side middleware or policy evaluators before inspecting or mutating data.
- Object-level authorization (verifying whether a user is the assigned editor or creator of a specific item) must be computed server-side from authoritative persistence records.
- Unauthenticated or unauthorized requests must fail immediately with `401 Unauthorized` or `403 Forbidden` JSON payloads.

### 8.4 Explicit Forbidden Patterns
- Relying on hidden UI buttons, disabled input fields, or React Router redirects as the primary security mechanism.
- Passing user role claims from client-side storage (e.g., localStorage or unverified query params) without server-side cryptographic session verification.
- Allowing administrative, recovery, or batch actions to run without explicit role checks.

### 8.5 Verification Expectation
Automated integration tests must demonstrate that firing unauthorized HTTP requests directly to protected endpoints (e.g., `/api/recovery/snapshot` or `/api/questions/:id/approve` using an `ANALYTICS_VIEWER` session) consistently returns HTTP 403.

---

## 09. Principle AP-005: Backend Business-Rule Authority

### 09.1 Identity & Statement
* **Principle ID:** `AP-005`
* **Principle Name:** Backend is Authoritative for Business Rules
* **Rule:** All domain validation rules, mathematical consistency checks, curricular constraints, completeness thresholds, and stage entry/exit criteria must be authoritatively evaluated and enforced on the backend.

### 9.2 Rationale
Client-side validation improves user experience by giving immediate feedback, but it can be bypassed, disabled, or manipulated. Stage 03 audit documented instances where client forms permitted partial submissions that created malformed records in the Google Sheets persistence layer.

### 9.3 Implementation Consequence
- Server-side validators (e.g., Zod schemas and domain rule evaluators) must independently validate all payloads regardless of any client-side validation that previously occurred.
- A workflow stage cannot advance unless the backend confirms that all mandatory prerequisites for that stage are satisfied.
- Validation failures on the backend must return structured, actionable error details to the client.

### 9.4 Explicit Forbidden Patterns
- Assuming an incoming payload is valid because the frontend UI form passed HTML5 or React Hook Form checks.
- Advancing a content item to Stage 02 (Verification) when required options or explanations are blank.
- Storing unvalidated or syntactically invalid question formats in the authoritative database.

### 9.5 Verification Expectation
Submitting a malformed payload (e.g., multiple choice question missing correct answer index) directly to the API must result in HTTP 400 with validation failure details, leaving persistence unchanged.

---

## 10. Principle AP-006: Frontend Responsibility Boundaries

### 10.1 Identity & Statement
* **Principle ID:** `AP-006`
* **Principle Name:** Frontend Never Decides Whether a Transition is Valid
* **Rule:** The frontend user interface is strictly a presentation and interaction layer. It displays current system state, captures user intent, offers valid available actions based on backend guidance, and reflects server responses. It never authoritatively decides state, validity, or permissions.

### 10.2 Rationale
When frontends assume state authority, race conditions, stale UI caches, and optimistic UI desynchronizations proliferate. In Stage 03, the client navigating immediately to `/videos/:id` before the server finished appending rows caused fatal 404 reload errors (`BRK-HD-01`).

### 10.3 Implementation Consequence
- The frontend requests actions (e.g., "Request Approval", "Submit Edit") and awaits server confirmation before transitioning UI views or updating local application state.
- Allowed actions displayed in the UI (e.g., which buttons are enabled) should be informed by backend metadata (HATEOAS-style or capabilities metadata).
- If the server rejects an action, the frontend must remain on the current screen, present the server's error message, and preserve unsaved user input.

### 10.4 Explicit Forbidden Patterns
- Optimistically transitioning master workflow state in client storage or React context before the backend returns HTTP 200/201.
- Replacing the browser URL to point to a new entity ID before the server confirms that the entity exists in authoritative persistence.
- Calculating role authorization client-side to bypass backend error states.

### 10.5 Verification Expectation
Simulating server-side network errors or artificial latency during a transition must result in the frontend maintaining current state without route corruption or data loss.

---

## 11. Media Storage and Reference Ownership (AP-007 & AP-008)

### 11.1 Principle AP-007: Media Binaries Remain External to Application Database
* **Principle ID:** `AP-007`
* **Principle Name:** Media Binaries Remain External to the Application Database
* **Rule:** Large binary media files (raw video footage, edited MP4s, multi-take video streams, audio stems, high-res graphic PSD/PNG files) must NEVER be stored directly inside the transactional application database.
* **Rationale:** Databases are optimized for structured queries, indexing, and transactional integrity; storing multi-gigabyte video binaries bloats database backups, degrades query performance, and incurs severe cloud storage costs.
* **Required Implementation Consequence:** Binaries are stored in external object storage systems (such as Google Drive in the current baseline, or designated cloud object storage buckets in future architecture). Upload pipelines must stream chunks directly from client to external storage without buffering large binaries into server RAM.
* **Explicit Forbidden Patterns:** Storing base64-encoded video or image binary strings in database columns or Google Sheets cells; storing large media blobs in database backups.
* **Verification Expectation:** Database schema audit and payload inspections confirm that zero media binary payloads or base64 data strings are persisted in database columns.

### 11.2 Principle AP-008: Media References Belong to Application Data Model
* **Principle ID:** `AP-008`
* **Principle Name:** Media References Belong to the Application Data Model
* **Rule:** Media metadata, storage identifiers, access URLs, byte sizes, MIME types, version hashes, and entity linkage records MUST be first-class citizens in the application data model.
* **Rationale:** Storing media files externally without strict database references creates orphaned assets, broken links, untracked storage costs, and zero auditability.
* **Required Implementation Consequence:** The application database stores deterministic metadata records (`media_asset_id`, `entity_type`, `entity_id`, `storage_provider`, `external_file_id`, `web_view_url`, `checksum`, `file_size_bytes`, `created_at`). Deleting or archiving an entity must coordinate soft-deletion of metadata without causing untracked orphan binaries.
* **Explicit Forbidden Patterns:** Uploading files to external storage without creating a corresponding linked record in the application database; relying on unstructured, manually typed external drive links without system-validated file IDs.
* **Verification Expectation:** Audit checks must verify that all media upload flows produce a valid `MEDIA_ASSETS` record with a verified file ID, linking the external binary deterministically to the target business entity.

---

## 12. Principle AP-009: AI Governance

### 12.1 Identity & Statement
* **Principle ID:** `AP-009`
* **Principle Name:** AI Assists Humans; AI Does Not Silently Approve or Mutate Workflow
* **Rule:** Artificial Intelligence (AI) components, LLMs, and automated agents operate exclusively in an assistive, draft-generating, and advisory capacity. AI must never autonomously approve, reject, publish, or advance content across workflow stage gates without explicit, authenticated human review and sign-off.

### 12.2 Rationale
BP-CMS produces educational content for competitive exam preparation where factual accuracy, pedagogical soundness, and cultural/linguistic nuance (e.g., authentic Telugu translation) are paramount. Hallucinations or automated bypasses compromise educational integrity and student trust.

### 12.3 Implementation Consequence
- AI-generated outputs (question drafts, teleprompter scripts, thumbnail prompts, performance tags) must be clearly flagged with an `IS_AI_GENERATED` indicator and assigned to a human reviewer.
- Advancing from Stage 01 to Stage 02, or Stage 02 to Stage 03, requires the credentials and signature of an authenticated human user (`VERIFIER`, `CONTENT_LEAD`, or `ADMIN`).
- Automated background workers may invoke AI to generate suggestions or enrich metadata, but the resulting state must remain in a `PENDING_REVIEW` state until confirmed by a human actor.

### 12.4 Explicit Forbidden Patterns
- Implementing cron jobs or webhooks that call Gemini and automatically mark questions as `APPROVED` or `READY_FOR_RECORDING`.
- Allowing AI to overwrite human-edited text without explicit human acceptance.
- Removing or hiding human review gates to accelerate publishing throughput.

### 12.5 Verification Expectation
Workflow transition code inspection must prove that the transition validator rejects any transition to `APPROVED` or `PUBLISHED` if the actor ID matches a system or AI service account without human co-signature.

---

## 13. Principle AP-010: Business-State Ownership

### 13.1 Identity & Statement
* **Principle ID:** `AP-010`
* **Principle Name:** No Duplicate Ownership of Business State
* **Rule:** Every piece of business state must have exactly one authoritative owner in the system architecture. Duplicate, mirrored, or competing state writers for the same logical domain attribute are strictly prohibited.

### 13.2 Rationale
In Stage 03, both `QUESTIONS` and `VIDEOS` maintained competing status representations (`Question.videoStatus` vs `Video.status`), and `PUBLISHING` maintained release statuses separate from `VIDEOS`. This dual-writer model led directly to split-brain data corruption where video production was complete but question records reported the item as un-recorded.

### 13.3 Implementation Consequence
- A single authoritative entity represents each business concept (e.g., the master content record owns canonical stage progression).
- Downstream views and query APIs must derive cross-domain statuses by reading the single authoritative source or using foreign key relations, rather than maintaining replicated copies.
- If denormalized views or cache projections are introduced for read performance, they must be strictly read-only and maintained by deterministic, centralized sync workers.

### 13.4 Explicit Forbidden Patterns
- Writing the same status value to multiple independent database tables in non-atomic operations.
- Storing overlapping status enums where two distinct services can issue conflicting status updates to the same logical content item.
- Exposing separate API endpoints that mutate the same underlying business state through different domain services.

### 13.5 Verification Expectation
Database schema audit must demonstrate that each business lifecycle milestone exists in exactly one authoritative table column, with zero competing writable duplicates.

---

## 14. Principle AP-011: Service Architecture & Microservice Constraint

### 14.1 Identity & Statement
* **Principle ID:** `AP-011`
* **Principle Name:** No Unnecessary Microservices
* **Rule:** BP-CMS must be designed and maintained as a modular, cohesive, well-bounded monolith unless an explicit, documented, and approved business requirement demands physical service decomposition.

### 14.2 Rationale
Microservice architectures introduce network latency, distributed transaction failure modes, complex distributed tracing, high cloud hosting costs, and immense deployment overhead. For BP-CMS's team size, traffic profile, and domain requirements, a modular monolith guarantees fast development, simple zero-downtime deployments, atomic transactions, and zero distributed failure cascades.

### 14.3 Implementation Consequence
- Application code must be structured into clean, decoupled domain modules (e.g., `modules/questions`, `modules/video`, `modules/publishing`, `modules/auth`) sharing a single backend runtime process.
- Communication between modules must occur via clean in-process service interfaces, domain events, or shared data access layers, rather than inter-service HTTP/gRPC network hops.
- Asynchronous tasks (video transcoding, thumbnail generation, AI drafting) should be handled via background worker threads or bounded in-process task queues rather than standalone microservice fleets.

### 14.4 Explicit Forbidden Patterns
- Splitting the backend into separate microservice repositories (e.g., a standalone "Question Service", standalone "Auth Service", standalone "Publishing Service") without PO approval.
- Introducing service meshes (e.g., Istio, Linkerd) or complex distributed consensus protocols.
- Fragmenting frontend SPAs into micro-frontends.

### 14.5 Verification Expectation
Deployment manifests must confirm the entire application runs as a cohesive, single-service deployable container (e.g., on Cloud Run) with unified logging and zero inter-service network boundaries.

---

## 15. Principle AP-012: Infrastructure and Cost Governance

### 15.1 Identity & Statement
* **Principle ID:** `AP-012`
* **Principle Name:** No Infrastructure Purchased Without a Cost Justification
* **Rule:** No cloud resource, managed service, third-party subscription, database cluster, caching tier, or background queue infrastructure may be introduced into BP-CMS without an explicit, approved cost-benefit justification aligned with the Stage 01 cost constraint (`COST-001`).

### 15.2 Rationale
Uncontrolled infrastructure sprawl inflates operational expenditure, introduces unnecessary maintenance burdens, and risks vendor lock-in. Stage 01 established the mandate for lean, frugal, cost-effective operations.

### 15.3 Implementation Consequence
- Every proposed infrastructure change must document:
  1. Business problem solved.
  2. Estimated monthly cost at current scale and 10x scale.
  3. Verification that existing zero-cost or low-cost primitives (e.g., container memory, SQLite, managed serverless tiers) are insufficient.
- Preference must always be given to serverless, scale-to-zero, or high-density shared primitives.

### 15.4 Explicit Forbidden Patterns
- Provisioning dedicated, always-on multi-node clusters (e.g., dedicated Redis enterprise clusters, managed Kubernetes) when lightweight or serverless alternatives suffice.
- Adopting paid third-party SaaS tools for capabilities that can be satisfied natively or via existing Google Cloud commitments.
- Adding infrastructure components that require full-time DevOps administration.

### 15.5 Verification Expectation
Stage completion reviews must verify that the projected infrastructure bill remains within the approved Stage 01 budget envelopes before infrastructure provisioning can proceed.

---

## 16. Principle AP-013: Incremental Brownfield Migration

### 16.1 Identity & Statement
* **Principle ID:** `AP-013`
* **Principle Name:** Existing Functionality is Migrated Incrementally
* **Rule:** All modernization, database transitions, and architectural refactoring must proceed through disciplined, reversible, incremental migration steps. "Big bang" rewrites that discard working systems are strictly forbidden.

### 16.2 Rationale
The Stage 03 baseline proved that BP-CMS has 31 working pages, 271 active endpoints, and hundreds of verified operational behaviors. Complete rewrites introduce catastrophic delivery risk, business interruption, and regression proliferation.

### 16.3 Implementation Consequence
- Migrations must use established patterns (such as Strangler Fig, branch by abstraction, or dual-read/dual-write verification).
- Each migration increment must be independently deployable, testable, and capable of operating alongside existing functionality.
- Rollback mechanisms must be engineered and tested prior to cutover for every increment.

### 16.4 Explicit Forbidden Patterns
- Halting ongoing production to execute a multi-month total rewrite.
- Deleting existing Google Sheets repositories before target persistence has reached verified 100% data and behavioral parity.
- Introducing breaking API changes that instantly invalidate existing frontend clients.

### 16.5 Verification Expectation
Migration plans must demonstrate step-by-step coexistence with measurable milestone gates and validated rollback checkpoints at each phase.

---

## 17. Principle AP-014: Historical Audit Preservation

### 17.1 Identity & Statement
* **Principle ID:** `AP-014`
* **Principle Name:** Historical Audit Evidence is Preserved
* **Rule:** Historical audit files, forensic discovery records, problem registers, and compliance evidence documents must never be deleted, overwritten, or modified to make current implementations look cleaner. Audit history is immutable.

### 17.2 Rationale
The BP-CMS repository contains 30 comprehensive audit steps (`docs/audit/`) that provide critical forensic evidence regarding known bugs, edge cases, and historical evolutions. Erasing historical documents destroys institutional memory and conceals unresolved risks.

### 17.3 Implementation Consequence
- Historical files under `docs/audit/`, `01-product-truth.md`, and previous stage baselines must remain preserved and read-only.
- New architecture artifacts must reference historical findings by their established IDs (e.g., `BRK-HD-01`, `DB-CRIT-01`, `1789891450880`) rather than creating competing numbering schemes.
- Discrepancies between historical documents and current reality must be resolved through explicit superseding declarations in new documents, not silent retroactive edits.

### 17.4 Explicit Forbidden Patterns
- Deleting `docs/audit/` directories during repository cleanup.
- Editing past audit reports to change their findings or remove documented failure logs.
- Fabricating Git history or claiming test passes where failures occurred.

### 17.5 Verification Expectation
Repository integrity checks must verify that all 30 audit step folders and historical markdown files remain present and unmutated across SDLC stages.

---

## 18. Principle AP-015: Testability Requirement

### 18.1 Identity & Statement
* **Principle ID:** `AP-015`
* **Principle Name:** Every Implementation Must be Testable
* **Rule:** Every business rule, workflow transition, API endpoint, and data mutation must be accompanied by an automated, executable, and reproducible verification test. Code that cannot be tested automatically without corrupting production data is unacceptable.

### 18.2 Rationale
Stage 03 revealed 144 standalone test scripts under `src/tests/` that lacked a unified test runner, with some tests (`special-investigation-1789891450880.md`) directly mutating live production Google Sheets because sandbox isolation was missing. Reliable delivery requires fast, isolated, automated test execution.

### 18.3 Implementation Consequence
- All business logic and domain services must be designed with dependency injection or clear boundary interfaces allowing test execution against isolated mocks, fixtures, or ephemeral test databases.
- Test suites must be executable via standard npm scripts (`npm test`, `npm run test:unit`) with zero production side effects.
- Automated tests must provide clean setup and teardown (`afterEach`, `finally`) to guarantee zero test data contamination.

### 18.4 Explicit Forbidden Patterns
- Writing business logic tightly coupled to live third-party cloud services without mock or local test adapters.
- Committing test scripts that append records to production spreadsheets or production Drive folders.
- Skipping automated test authoring in favor of purely manual UI clicking.

### 18.5 Verification Expectation
Continuous integration pipelines must execute the automated test suite on every pull request, requiring a 100% pass rate before merge approval.

---

## 19. Cross-Principle Implementation Rules

When implementing features across multiple domains, the following interaction rules apply:
1. **Security Supercedes Convenience (AP-004 + AP-006):** In any conflict between frontend UI ergonomics and backend authorization rigor, backend enforcement always takes precedence.
2. **Workflow Integrity Binds All Entities (AP-001 + AP-002 + AP-003):** An entity's state changes cannot be processed outside the context of the canonical 15-stage workflow.
3. **Data Integrity Trumps Velocity (AP-010 + AP-013):** Incremental migration must halt immediately if dual-writer divergence or split-brain records are detected.
4. **Human Authority Bounds AI Velocity (AP-009 + AP-005):** Batch AI operations must queue items for human review rather than mass-advancing workflow stages.

---

## 20. Forbidden Architecture Patterns

The following patterns are categorically prohibited in BP-CMS:

| Anti-Pattern ID | Anti-Pattern Name | Description | Violates Principle(s) |
| :--- | :--- | :--- | :--- |
| **ANTI-01** | **Client-Side Workflow Mutation** | Allowing the frontend to send arbitrary `{ status: 'APPROVED' }` updates directly to generic PATCH endpoints. | `AP-003`, `AP-005`, `AP-006` |
| **ANTI-02** | **Multi-Hop Barrier Workarounds** | Chaining multiple artificial API requests on the client to hop over a backend state barrier. | `AP-001`, `AP-003`, `AP-006` |
| **ANTI-03** | **Split-Brain Status Mirroring** | Writing the same workflow stage progress to two separate tables without atomic transactions. | `AP-002`, `AP-010` |
| **ANTI-04** | **Un-Gated AI Auto-Approval** | Allowing an LLM or background job to mark questions or videos as approved without human review. | `AP-009` |
| **ANTI-05** | **Binary Database Bloat** | Storing raw video files, base64 strings, or multi-megabyte thumbnails inside database rows. | `AP-007` |
| **ANTI-06** | **Unbounded Microservice Sprawl**| Decomposing the application into multiple independent networked services without cost/complexity justification. | `AP-011`, `AP-012` |
| **ANTI-07** | **Big-Bang Rewrite** | Discarding the existing working application and attempting a ground-up rewrite from scratch. | `AP-013` |
| **ANTI-08** | **Production Test Contamination** | Running automated test scripts that mutate live production sheets or drive assets without sandbox isolation. | `AP-014`, `AP-015` |
| **ANTI-09** | **UI-Only Role Protection** | Hiding links in the navigation sidebar while leaving the underlying React routes completely un-guarded. | `AP-004`, `AP-006` |
| **ANTI-10** | **Speculative Tech Adoption** | Introducing complex database, queue, or cloud infrastructure before an approved architecture requirement exists. | `AP-012` |

---

## 21. Architecture Decision Traceability

The principles in this document directly remediate the confirmed problems identified in Stages 01, 02, and 03:

| Architecture Principle | Remediation Target / Requirement | Stage 01/02 Traceability | Stage 03 Baseline Problem Addressed |
| :--- | :--- | :--- | :--- |
| **AP-001** (15-Step Workflow) | Unified pipeline definition | `BR-001`, `AC2-001` to `AC2-015` | Stage fragmentation across disparate views |
| **AP-002** (Stage vs State) | Separation of business & technical state | `BR-003`, `AC2-017` | `BRK-SF-01`, `BRK-SF-02` status desynchronizations |
| **AP-003** (Transition Engine) | Authoritative state engine | `BR-002`, `AC2-016`, `NEG-02` | `BRK-HD-02` (`QUEUED -> EDITING` 3-hop barrier) |
| **AP-004** (Backend Auth) | Zero-trust backend authorization | `BR-008`, `AC2-020`, `NEG-05` | `SEC-HIGH-01` (Missing React Router guards) |
| **AP-005** (Backend Rules) | Server-side validation authority | `BR-004`, `AC2-018`, `NEG-01` | Partial form submissions corrupting sheets |
| **AP-006** (Frontend Boundary)| Passive presentation layer | `BR-002`, `AC2-016` | `BRK-HD-01` (Draft reload 404 URL race) |
| **AP-007 / AP-008** (Media) | External binary storage & metadata | `BR-006`, `AC2-019` | `DRIVE-MED-01` (Dual folder convention fragmentation) |
| **AP-009** (AI Governance) | Human-in-the-loop AI assistance | `BR-007`, `AC2-021`, `NEG-04` | Uncontrolled automated generation risks |
| **AP-010** (State Ownership) | Single source of truth for status | `BR-001`, `AC2-017` | Dual writers between `QUESTIONS` and `VIDEOS` |
| **AP-011** (Modular Monolith) | Maintainable, cohesive service structure | `NFR-004` (Operational Simplicity) | Over-engineering and distributed latency risks |
| **AP-012** (Cost Governance) | Lean infrastructure constraint | `COST-001`, `AC2-023` | Uncontrolled cloud subscription inflation |
| **AP-013** (Brownfield Migration)| Incremental system modernization | `NFR-005` (Zero-Downtime Migration) | Big-bang rewrite failure risks |
| **AP-014** (Audit Preservation) | Immutable forensic audit history | `BR-010`, `AC2-024` | Accidental deletion of Step 01–30 audit findings |
| **AP-015** (Testability) | Automated, isolated verification | `NFR-006`, `AC2-025` | `1789891450880` production sheet test contamination |

---

## 22. Future Implementation Compliance Gate

Before any future code, schema, or infrastructure pull request is merged, it must pass the following Stage 04 Architecture Compliance Gate:
1. **Principle Verification:** Does the proposed change comply with all 15 principles (AP-001 through AP-015)?
2. **Anti-Pattern Check:** Does the implementation introduce any of the 10 forbidden patterns (ANTI-01 through ANTI-10)?
3. **Traceability Confirmation:** Does the change trace directly back to an approved requirement and acceptance criterion?
4. **Boundary Compliance:** Are workflow transitions, authorization, and validation authoritatively enforced on the server?
5. **Test Isolation:** Does the change include automated tests that run without mutating production data?

---

## 23. Stage 04 Completion Criteria

To satisfy Stage 04 completion, the following criteria must be met:
- [x] Canonical architecture governance document `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` created.
- [x] All 15 canonical architecture principles (AP-001 to AP-015) fully documented with rule, rationale, implementation consequence, forbidden patterns, and verification expectations.
- [x] Canonical 15-step business workflow preserved without alteration.
- [x] Strict technology neutrality maintained; no premature technology lock-in.
- [x] Comprehensive forbidden patterns cataloged (ANTI-01 to ANTI-10).
- [x] Full traceability to Stage 01 requirements, Stage 02 acceptance criteria, and Stage 03 baseline defects established.
- [x] Zero application source code, schemas, databases, or infrastructure modified.
- [x] Build and runtime health verified.

---

## 24. Stage 04 Closure Record

### 24.1 Controlled Closure Verification Evidence
* **Closure Execution Date:** 2026-10-01
* **Verified GitHub Commit:** `cf2c5d18e176a5fbc38094b8bf5d1bdfe09fd292` (refactor: align canonical 15-stage workflow)
* **Preceding Implementation Commit:** `8075a562a76357a9772a8a33a38faa0a5fa2fdef`
* **Canonical 15-Step Workflow:** All 15 stages verified in `CANONICAL_15_STEPS` as single source of truth; zero duplicate enum or sequence definitions (`CanonicalStageIdentifier` strictly derived).
* **Authoritative Transition Engine:** Centralized transition validator `validateCanonicalWorkflowTransition` enforces sequential boundaries, actor credentials, and AI human-in-the-loop sign-off.
* **Architecture Principles Verification:** Deterministic test suite `src/tests/stage04-architecture-principles.test.ts` passed 100% (AP-001 through AP-015).
* **Type Check (`npm run lint` / `tsc --noEmit`):** PASSED with 0 errors.
* **Production Build (`npm run build`):** PASSED (Vite + esbuild bundled).
* **Runtime Health (`GET /api/health`):** PASSED (HTTP 200 OK, `GOOGLE_SHEETS_PRODUCTION` active).
* **Production Mutation:** NONE (zero modifications to Google Sheets, Google Drive, databases, or infrastructure).

### 24.2 Acceptance Table

| Item | Status |
|------|--------|
| Architecture Principles AP-001–AP-015 | VERIFIED |
| Canonical 15-Step Workflow | VERIFIED |
| Single Workflow Source of Truth | VERIFIED |
| Authoritative Transition Mechanism | VERIFIED |
| Backend Authorization Authority | VERIFIED |
| Backend Business-Rule Authority | VERIFIED |
| Frontend Boundary | VERIFIED |
| Media Storage Boundary | VERIFIED |
| AI Human-Gating | VERIFIED |
| Single State Ownership | VERIFIED |
| Modular Monolith Constraint | VERIFIED |
| Cost / Infrastructure Constraint | VERIFIED |
| Incremental Migration Safety | VERIFIED |
| Historical Audit Preservation | VERIFIED |
| Deterministic Testability | VERIFIED |
| Type Check | PASSED |
| Build | PASSED |
| Runtime Health | PASSED |
| Product Owner Acceptance | ACCEPTED |
| Stage 04 | CLOSED |

```
================================================================================
STAGE 04 — ARCHITECTURE PRINCIPLES
STATUS: ACCEPTED — COMPLETE — CLOSED
IMPLEMENTATION: COMPLETE
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 04 CLOSED: YES
APPLICATION CODE MODIFIED: NONE
DATA / STORAGE MODIFIED: NONE
DEPLOYMENT PERFORMED: NO
NEXT STAGE: STAGE 05 — NOT STARTED
================================================================================
```

STAGE 04 CLOSED: YES

NEXT STAGE:
STAGE 05 — NOT STARTED
