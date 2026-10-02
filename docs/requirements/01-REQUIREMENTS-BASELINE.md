# 01 — REQUIREMENTS BASELINE

## 1. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Name** | BP-CMS Stage 01 Requirements Baseline | FACT |
| **Stage** | Stage 01 — Requirements Baseline | FACT |
| **Version** | 1.1.0 (Master SDLC Reset Baseline) | FACT |
| **Status** | READY FOR EXTERNAL VERIFICATION | FACT |
| **Date** | 2026-10-02 | FACT |
| **Purpose** | Defines WHAT BP-CMS must become before architecture, contracts, and implementation decisions are finalized | FACT |
| **Scope** | Functional, Non-Functional, Operational, and Boundary Requirements for BP-CMS | FACT |
| **Source of Truth Statement** | This document is the sole authoritative Requirements Baseline for the BP-CMS brownfield modernization project. All subsequent SDLC stages (Architecture, Contracts, Implementation, Verification) must remain traceable to this document. | FACT |
| **Brownfield Status** | Brownfield modernization of existing production-grade system (Repository baseline: `548ff5d2c1adcbcb6ea82425856a59032169ec2f`). Existing functionality and production data must be preserved. | FACT |

### Mandatory Governance Declaration
1. **This document defines WHAT BP-CMS must become.**
2. **It does NOT define HOW the requirements will be implemented.**
3. **All technical, architectural, schema, and implementation decisions belong strictly to later SDLC stages.**
4. **Documentation describing a requirement must NEVER be represented as evidence that the feature is already implemented.**

---

## 2. Product Purpose

### 2.1 What BP-CMS Is
Burra Pariksha Content Management System (BP-CMS) is the operational, end-to-end content-production operating system for the Burra Pariksha educational media channel. It governs an industrial-standard digital assembly line, transforming raw competitive examination syllabi and academic problem concepts into thoroughly verified, studio-recorded, professionally edited, packaged, broadcasted, and analytically evaluated short-form and long-form video assets.

BP-CMS is NOT merely a question generator or a simple prompt wrapper. It is a comprehensive production operating system providing a controlled, audited, and closed-loop lifecycle for producing, reviewing, publishing, measuring, and continuously refining pedagogical content.

### 2.2 Who Uses It
BP-CMS is operated by a coordinated cross-functional content production organization. Based on the established brownfield product context and operational workflows, the user categories are:

1. **Question Authors & Curricular Specialists:** Subject matter experts who draft competitive exam questions, distractor rationales, Telugu translations, and mathematical proofs.
2. **Academic Verifiers & QA Reviewers:** Independent pedagogical experts responsible for rigorous peer audit and verification of questions, solutions, and syllabi alignment before production handoff.
3. **Scriptwriters & Educational Adapters:** Content writers who transform verified mathematical solutions into engaging spoken presentation scripts with visual cues and pacing notes.
4. **Studio Presenters & Camera Crew:** On-camera faculty and studio operators who record spoken explanations, utilize teleprompters, and log camera takes.
5. **Video Editors & Motion Graphic Artists:** Post-production specialists who assemble raw video takes, sync bilingual subtitles, create motion graphics, master audio (-14 LUFS standard), and render master cuts.
6. **Quality Control (QC) Officers:** Independent gatekeepers who certify technical broadcast compliance (audio loudness, subtitle sync, visual fidelity, academic correctness).
7. **Thumbnail Designers & Visual Packaging Artists:** Creative specialists who produce high-CTR cover artwork, hook typography, and mobile-optimized graphic variants.
8. **Publishing & Social Media Managers:** Distribution coordinators who review 9:16 mobile framing, craft titles/descriptions/hashtags, schedule releases, dispatch live publications, and manage pinned comments.
9. **Analytics & Performance Researchers:** Data analysts who harvest multi-platform audience retention curves, diagnostic drop-offs, and engagement metrics.
10. **Content Strategy Leads & Executive Producers:** Curriculum directors and channel leads who review operational throughput, identify pedagogical misconceptions, and allocate sprint batches.
11. **System Administrators:** Infrastructure and governance operators who oversee user authentication, role assignments, disaster recovery snapshots, and forensic audit logs.

### 2.3 Problem It Solves
High-velocity educational media production in competitive examination channels typically suffers from severe operational fragmentation:
- **Fragmented Content Production:** Production steps scattered across ad-hoc chat groups, personal hard drives, and disconnected spreadsheets.
- **Unclear Workflow Ownership:** Ambiguous handoffs between question writers, scriptwriters, studio presenters, and video editors leading to pipeline bottlenecks.
- **Disconnected Production Stages:** Post-production video editors working from outdated scripts or unverified question keys without change tracking.
- **Inconsistent Review & Approval:** Lack of objective quality gates, allowing mathematical errors, audio defects, or unverified claims to leak into live broadcasts.
- **Scattered Media Handling:** Raw camera footage and master video renders scattered without deterministic checksums, external storage pointers, or version references.
- **Publishing Coordination Errors:** Mismatched video titles, missing pinned comments, wrong platform aspect ratios, or accidental duplicate publications.
- **Platform Synchronization Failures:** Broadcast links going live on YouTube Shorts while failing silently on Instagram Reels or Facebook Video without operator visibility.
- **Disjointed Analytics Feedback:** Viewer retention drop-off data isolated in platform dashboards without connecting back to the original script or pedagogical concept.
- **Lack of Empirical Continuous Improvement:** Question authors continuing to write questions without insight into why students abandon specific video topics after 3 seconds.
- **Absence of Operational Traceability & Auditability:** Inability to determine who authored, verified, edited, or approved an asset in the event of an academic error or compliance dispute.

### 2.4 Product Outcome
The definitive product outcome of BP-CMS is:
> **A single, unified, controlled content-production system in which educational content moves deterministically through the canonical 15-step manufacturing lifecycle with unambiguous ownership, mandatory human-gated validation, verified broadcast publishing, deep multi-platform synchronization, and an empirical intelligence loop that continuously refines future curriculum creation.**

---

## 3. System Scope

### 3.1 Inside System Scope (Internal BP-CMS Ownership)
The internal scope of BP-CMS encompasses all core domain models, business logic, workflows, state engines, metadata, and operational user interfaces:
1. **Identity & Authentication:** User accounts, authentication tokens, session verification, active status.
2. **Roles & Capabilities:** Granular RBAC, capability-to-action resolution, server-authoritative authorization.
3. **Curriculum & Question Production:** Syllabus taxonomies, question authoring, bilingual options, math proofs, draft lifecycles.
4. **Academic Verification:** 10-point pedagogical audit checklist, verification records, anti-self-approval enforcement.
5. **Script & Teleprompter Orchestration:** Spoken script authoring, versioning, visual directives, teleprompter pacing.
6. **Video Production Tracking:** Production projects, take logging, editing bay tracking, render cut registration.
7. **Quality Control (QC):** Technical quality inspection, loudness certification, pass/fail decision recording.
8. **Thumbnail Packaging:** Creative asset registration, metadata, variant tracking, CTR inspection.
9. **Social Review:** 9:16 vertical smartphone simulator, safe-zone validation, pinned comment sign-off.
10. **Publishing Orchestration:** Release scheduling, distribution staging packages, multi-platform dispatch triggers.
11. **Platform Synchronization:** Verification of live broadcast URLs, syndication status, external platform IDs.
12. **Analytics & Performance:** Ingestion of audience retention telemetry, second-by-second drop-off curve mapping.
13. **Pedagogical Intelligence Loop:** Synthesis of viewer drop-offs into curriculum recommendations and topic directives.
14. **Workflow State Engine:** Canonical 15-step transition validation, state machine enforcement, forward and rework routing.
15. **Media Metadata & References:** External storage locators (URI/URL), checksums, format descriptors, MIME types.
16. **Notifications & Team Workload:** Operational task assignments, reviewer alerts, stage bottleneck visibility.
17. **Forensic Audit Ledger:** Immutable, append-only business event ledger recording all mutations, actors, and outcomes.
18. **System Configuration:** Platform configuration, taxonomy definitions, prompt templates, disaster recovery manifests.

### 3.2 Outside System Scope (External Systems & Providers)
The following systems are external to BP-CMS; BP-CMS maintains references, identifiers, and API boundaries with them, but does NOT own or re-implement their infrastructure:
1. **External Binary Media Storage:** Active storage (Google Drive) and long-term cold archives. BP-CMS stores metadata and references; multi-gigabyte video binaries NEVER live in the application database.
2. **Social Video Distribution Platforms:** Third-party networks (YouTube, Instagram, Facebook). BP-CMS interfaces via APIs or guided operator workflows for dispatch and verification.
3. **Generative AI Model Providers:** External AI model APIs (e.g., Google Gemini). Used strictly as assistive tools via client/server boundaries.
4. **External Deep Archive Vendors:** Enterprise cold archive tiers for historical camera rushes beyond active operational retention.
5. **External Notification & Email Relays:** Third-party SMTP/email delivery systems.

---

## 4. Business Requirements

### BR-001 — Question Production
The system must support the authoring, drafting, AI-assisted generation, and editing of structured competitive examination questions.
- **Bilingual Content:** Support for English and regional language (Telugu) problem statements, mathematical proofs, and distractor explanations.
- **Standardized Format:** Four distinct multiple-choice options with a single mathematically verified correct answer key.
- **Taxonomy Alignment:** Explicit tagging with Class, Subject, Chapter, Topic, Subtopic, and Difficulty Level.
- **Solution Proofs:** Required step-by-step mathematical or logical proof for every problem.
- **Draft Separation:** Question generation (Stage 01) must produce unverified drafts without allocating permanent production identifiers or triggering downstream manufacturing steps.

### BR-002 — Script Production
The system must support transforming verified academic questions into engaging, spoken presentation scripts.
- **Audience Optimization:** Structuring explanations for high audience comprehension, spoken conversational cadence, and 3-second hook retention.
- **Visual Callouts:** Explicit notation of visual directives, on-screen text overlays, and animation triggers for video editors.
- **Timing & Pacing:** Target duration estimation based on spoken word-count calculations to enforce short-form video constraints.
- **Script Versioning:** Immutable version history of script revisions and presenter notes.

### BR-003 — Video Production
The system must manage the physical studio recording and post-production assembly of video assets.
- **Teleprompter & Filming:** Synchronized full-screen teleprompter display with adjustable scroll speed, take logging, and primary camera take selection.
- **Raw Video Registration:** Recording duration, video resolution, frame rate, container format, SHA-256 checksums, and external storage reference links.
- **Editing Bay Tracking:** Tracking post-production assembly, bilingual subtitle generation, motion graphic insertion, and master MP4 cut registration.
- **Final QC Certification:** Multi-point technical quality gate verifying broadcast visual clarity, audio loudness compliance (-14 LUFS standard), lip-sync, and typo elimination before release.

### BR-004 — Thumbnail
The system must govern the creation, validation, and association of visual thumbnail packaging.
- **High-Contrast Packaging:** Uploading and tracking high-resolution thumbnail images optimized for mobile viewports.
- **Metadata & Variations:** Supporting A/B testing variants, hook text legibility checks, and aspect ratio validation.
- **Workflow Binding:** Linking approved thumbnail assets directly to the parent video and publication package.

### BR-005 — Social Review
The system must provide an integrated editorial review of the combined social broadcast package.
- **9:16 Mobile Simulation:** Interactive vertical smartphone preview simulating safe-zone overlays for YouTube Shorts, Instagram Reels, and Facebook Video.
- **Packaging Inspection:** Unified review of video cut, thumbnail graphic, platform title, description, hashtags, and Telugu pinned comment.
- **Human Gate Sign-off:** Mandatory human sign-off with clear approval, rejection, or changes-requested pathways.

### BR-006 — Publishing
The system must govern the scheduling and live dispatch of broadcast packages.
- **Multi-Platform Staging:** Pre-publish parameter validation and destination channel assignment.
- **Scheduling:** Automated or guided release time scheduling based on audience peak hours.
- **Duplicate Prevention:** Strict controls preventing accidental duplicate uploads or re-broadcasting of previously dispatched content.
- **Broadcast Record Registration:** Capturing live platform response identifiers, timestamps, and operator identity upon broadcast.

### BR-007 — Platform Synchronization
The system must verify that published content achieves consistent public availability across external platforms.
- **Live URL Verification:** Post-publish automated or operator verification that public video links respond with HTTP 200 and valid media playback.
- **Cross-Platform Parity:** Verifying that content dispatched to primary channels is successfully mirrored to secondary platforms.
- **Failure Isolation:** External platform API failures or network timeouts must be isolated; they must never corrupt internal business state or trigger unverified status changes.
- **Recovery & Retry:** Structured retry workflows for transient platform synchronization failures.

### BR-008 — Analytics
The system must capture and store multi-platform audience engagement telemetry.
- **Metric Ingestion:** Capturing impressions, view counts, watch time, likes, shares, comments, and average percentage viewed (APV) at standardized intervals (24h, 7d, 30d).
- **Retention Curve Mapping:** Ingesting second-by-second audience retention curves to pinpoint viewer drop-offs.
- **Historical Association:** Permanently linking analytical snapshots to the parent content aggregate root.

### BR-009 — Performance Review
The system must provide diagnostic assessment tools for content strategists and educators.
- **Drop-off Diagnosis:** Cross-referencing retention drop-off timestamps with specific script segments, mathematical formulas, or presenter delivery cues.
- **Pedagogical Evaluation:** Identifying student misconception signals and confusion indicators from viewer comments.
- **Human Evaluation:** Enabling editors to review content outcomes and record diagnostic findings without automated state overwrites.

### BR-010 — Intelligence Loop
The system must close the operational loop by converting performance insights into actionable curriculum directives.
- **Curriculum Feedback:** Generating structured directives that identify high-confusion syllabus topics needing improved explanatory videos.
- **Script Refinement:** Identifying high-performing hook patterns and distractor structures to guide future authoring.
- **Step 01 Seeding:** Looping recommendations directly back into Stage 01 Question Generation to prioritize future sprint batches.
- **Assistive AI Boundary:** AI may suggest recommendations, but human strategists must review and approve topic directives before they initiate new production batches.

---

## 5. Canonical Business Workflow

BP-CMS is structured around a single, immutable, sequential 15-step business workflow:

```
================================================================================
                    THE CANONICAL 15-STEP CONTENT PIPELINE
================================================================================

  01. Question Generation      - Authoring, translating, drafting distractor sets & proofs
  02. Question Verification    - Independent academic & syllabus audit (Human Gate)
  03. Audience Script          - Spoken teleprompter script & visual directive authoring
  04. Teleprompter & Filming   - Studio recording, teleprompter pacing & take logging
  05. Raw Video                - Registration of camera raw footage & storage pointers
  06. Editing Bay              - Video assembly, bilingual captions & master MP4 render
  07. Final QC                 - Technical quality & -14 LUFS loudness certification (Human Gate)
  08. Thumbnail                - High-CTR mobile cover artwork & variant association
  09. Social Review            - 9:16 smartphone simulator & packaging audit (Human Gate)
  10. Publishing Setup         - Multi-platform scheduling & destination config (Human Gate)
  11. Published                - Live broadcast execution & publication record creation
  12. Platform Sync            - Cross-platform availability check & URL verification
  13. Analytics                - Audience retention telemetry & metric ingestion
  14. Performance Review       - Diagnostic assessment of viewer retention & drop-offs
  15. Intelligence Loop        - Synthesis of curriculum feedback seeding Step 01 batches

================================================================================
```

### The State Separation Axiom
In all documentation, architecture, contracts, and code, the five fundamental state dimensions must remain strictly separated:

```
================================================================================
                           THE BP-CMS STATE AXIOM
================================================================================

   BUSINESS WORKFLOW STEP   ≠   ENTITY STATUS   ≠   MEDIA STATUS   ≠   JOB STATUS   ≠   PUBLICATION STATUS

================================================================================
```
1. **Business Workflow Step:** The operational manufacturing stage (Steps 01 to 15).
2. **Entity Status:** The lifecycle condition of a domain aggregate (e.g., `DRAFT`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `ARCHIVED`).
3. **Media Status:** The availability and verification state of binary assets (e.g., `NOT_RECORDED`, `TAKE_UPLOADED`, `MASTER_RENDERED`, `STORAGE_VERIFIED`).
4. **Job Status:** The technical execution state of asynchronous tasks (e.g., `IDLE`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).
5. **Publication Status:** The distribution state across external networks (e.g., `UNPUBLISHED`, `SCHEDULED`, `LIVE`, `SYNCED`, `FAILED`).

---

## 6. Non-Functional Requirements

### NFR-001 — Reliability
- The system must guarantee zero data loss for approved curriculum questions, verified scripts, and live publication records.
- All state transitions must be atomic and validated server-side.
- In-flight background failures or network timeouts must fail safely without creating corrupt or indeterminate business records.

### NFR-002 — Performance
- Core UI interactions, navigation transitions, and standard API responses must remain responsive and lightweight under normal operational load.
- Repetitive external API calls must be avoided through effective caching, request deduplication, and batching.
- Long-running operations (file uploads, media processing, external synchronization) must execute asynchronously without blocking operator workstations.

### NFR-003 — Security
- **Authentication:** All protected routes and operations require authenticated user sessions.
- **Server-Authoritative Authorization:** All permission and access gates must be enforced on the backend. Frontend UI visibility controls are strictly for user experience.
- **Secret Protection:** Zero storage of external API keys, service account credentials, or OAuth secrets in client bundles or public repositories.
- **Least Privilege:** Users must possess discrete capabilities corresponding strictly to their operational role responsibilities.

### NFR-004 — Scalability
- The architectural design must accommodate scaling from initial daily batches to hundreds of concurrent content projects in flight across the 15 stages.
- The data and media architecture must handle historical accumulation of thousands of curriculum questions and publication records over multi-year operational cycles.

### NFR-005 — Maintainability
- The codebase must be modular, adhering to clear separation between UI components, business services, data repositories, and infrastructure adapters.
- Duplicate business logic, competing state machines, and ad-hoc status checks must be strictly prevented.
- All domain modules must have clean, testable interfaces with explicit contracts.

### NFR-006 — Cost
- **INITIAL INFRASTRUCTURE INVESTMENT TARGET: ₹0 – ₹100.**
- The system must maximize the use of existing cloud free-tier quotas, container runtimes, and provisioned services.
- No paid infrastructure components (paid databases, dedicated message queues, commercial SaaS) may be introduced without explicit Product Owner justification and approval.

### NFR-007 — Availability
- The operational CMS must remain accessible and functional for day-to-day studio workflows despite transient outages in external platforms (e.g., YouTube API quotas, social network downtimes).
- External failures must be isolated and must never take down internal authoring, scripting, filming, or editing bays.

### NFR-008 — Auditability
- Every business-critical mutation, approval, rejection, override, and publishing dispatch must be permanently recorded in an append-only audit trail.
- Audit records must capture:
  * **Actor:** User ID and role.
  * **Action:** Exact capability/operation exercised.
  * **Entity:** Resource type and unique identifier.
  * **State Delta:** Pre-mutation and post-mutation state.
  * **Timestamp:** ISO 8601 UTC timestamp.
  * **Outcome:** Success, failure, or validation rejection status.

---

## 7. Core Product Principles

BP-CMS is guided by twelve inviolable core product principles:

1. **One Canonical 15-Step Business Workflow:** Content moves strictly through the 15 approved manufacturing stages; no alternative competing workflows are permitted.
2. **Strict State Separation:** Business workflow stage is conceptually separate from entity status, media status, job status, and publication status.
3. **Backend Is Authoritative for Business Logic:** All business rules, transitions, and validations are enforced on the server.
4. **Backend Is Authoritative for Authorization:** Frontend permission gating is purely cosmetic; the backend must independently validate every operation.
5. **AI Assists Humans; AI Does Not Approve:** AI generates, translates, and suggests, but cannot approve human gates or mutate workflow state autonomously.
6. **Media Binaries Remain External:** Large video and audio files live in external object/drive storage; the application database stores metadata and references only.
7. **Media References Belong to the Domain:** Storage pointers, URLs, and checksums are core domain metadata and must maintain referential integrity.
8. **Single Source of Truth for Business State:** Every business fact has exactly one authoritative owner and state machine.
9. **Incremental Brownfield Modernization:** Preserve working production code; classify, consolidate, migrate, and retire legacy pathways safely.
10. **Historical Audit Evidence Is Preserved:** Existing production data, worksheets, and audit histories must never be destroyed or silently cleared.
11. **Testable Implementations:** Every functional capability and workflow gate must have verifiable automated tests.
12. **Frugal Infrastructure Governance:** All designs must adhere strictly to the ₹0–₹100 initial infrastructure investment constraint.

---

## 8. Data / Media Requirement Boundary

The relationship between BP-CMS and digital media assets is defined by a strict architectural boundary:
- **BP-CMS Responsibility:**
  * Owns the lifecycle metadata (project IDs, title, spoken script text, duration, resolution, frame rate, MIME type).
  * Owns the cryptographic integrity hashes (SHA-256 checksums) of registered media files.
  * Owns the external storage URI/URL references connecting content items to their storage locations.
  * Owns the access control rules determining which operator roles may access, edit, or publish media references.
- **External Storage Responsibility:**
  * Physical persistence, byte-stream delivery, streaming playback, and bit-level replication of high-definition video and raw camera files (e.g., Google Drive, external cloud buckets).
- **Failure Boundary:**
  * Transient external storage network failures must NOT leave BP-CMS in an ambiguous or corrupted state.
  * If a file upload or download fails, the media status must reflect `STORAGE_ERROR` or `RETRY_PENDING` while the parent business entity remains intact.
- **Technology Deferral:**
  * The selection of specific database engines and external archive providers is explicitly deferred to later architecture stages.

---

## 9. AI Requirements

Artificial Intelligence within BP-CMS is strictly **assistive** and human-gated:
- **Permitted AI Activities:**
  * Generating candidate question stems, distractor options, and draft Telugu translations.
  * Checking candidate questions for potential duplicate phrasing or taxonomy mismatch.
  * Formatting spoken script cadences and suggesting visual cues.
  * Analyzing viewer comments to summarize common student misconception themes.
  * Synthesizing audience drop-off data into recommended curriculum topics.
- **Prohibited AI Activities (Negative Constraints):**
  * AI must NEVER approve an academic verification gate (Stage 02).
  * AI must NEVER certify a technical QC gate (Stage 07).
  * AI must NEVER approve social packaging (Stage 09).
  * AI must NEVER authorize live broadcast dispatch (Stage 10/11).
  * AI must NEVER mutate workflow states without explicit human operator acceptance.
  * AI must NEVER evaluate user authentication or escalate access permissions.
- **Auditability:** Every AI prompt invocation, model identifier, generated payload, and human modification must be captured in audit logs.

---

## 10. Constraints

### COST-001: Financial Constraint
- **Initial Infrastructure Investment: ₹0 – ₹100.**
- All architectural proposals must prioritize free tiers, serverless quotas, and existing platform components.
- Any architecture requiring paid infrastructure requires explicit Product Owner business justification.

### Brownfield Constraints
- **Preserve Existing Functionality:** Working question drafting, LaTeX rendering, studio queue tracking, and publishing features must remain operational throughout modernization.
- **Protect Production Data:** Data housed in production spreadsheets, Google Drive folders, and existing databases must never be purged or corrupted.
- **Safe Integration Handling:** Existing Google Sheets, Google Drive, and Gemini API connections must be managed with robust rate limiting and error recovery.
- **Zero Big-Bang Rewrites:** Modernization must proceed through incremental, verified stages (Classify → Consolidate → Migrate → Verify → Retire).
- **Historical Evidence Preservation:** Prior forensic audits and baseline documents must remain intact as immutable project evidence.

---

## 11. Explicit Non-Requirements (Stage 01 Deferrals)

To maintain disciplined SDLC boundaries, Stage 01 explicitly does NOT decide:
1. **Database Engine:** Whether PostgreSQL, Cloud SQL, SQLite, Firestore, Google Sheets, or a hybrid model will be used.
2. **State Machine Code Implementation:** The exact code mechanics or libraries implementing state transitions.
3. **API & Endpoint Contracts:** Specific REST/RPC URL paths, payload JSON schemas, or HTTP status codes.
4. **UI Component Framework:** Specific React component libraries, CSS frameworks, or design tokens.
5. **Deployment & Hosting Topology:** Cloud Run configurations, Docker container specifics, or CI/CD pipelines.
6. **Queue & Background Worker Technologies:** Redis, BullMQ, Cloud Tasks, or in-process queue mechanisms.
7. **Third-Party Archive Vendors:** Selection of specific cold storage providers.
8. **Realtime Protocol Implementation:** WebSockets vs Server-Sent Events vs polling.
9. **Granular RBAC Code Syntax:** The exact TypeScript type signatures for permissions.

All such decisions belong strictly to subsequent architecture, contract, and implementation stages.

---

## 12. Requirement Traceability Matrix

The business and operational requirements defined in this baseline map directly to subsequent SDLC stages:

| Requirement ID | Requirement Description | Business Area | Downstream SDLC Stage | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **BR-001** | Question Production & Drafting | Questions | Stage 06 (Domain), Stage 19 (Impl) | Automated Unit & Integration Tests |
| **BR-002** | Spoken Scripting & Visual Cues | Scripts | Stage 06 (Domain), Stage 20 (Impl) | Script Workflow Contract Tests |
| **BR-003** | Video Recording, Takes & Editing | Production | Stage 06 (Domain), Stage 21 (Impl) | Video Pipeline State Tests |
| **BR-004** | Thumbnail Packaging & Variants | Creative | Stage 06 (Domain), Stage 22 (Impl) | Media Reference & Variant Tests |
| **BR-005** | Social Review & 9:16 Simulation | Publishing | Stage 07 (Workflow), Stage 22 (Impl) | Human Gate Audit & UI Contract Tests |
| **BR-006** | Publishing Scheduling & Dispatch | Publishing | Stage 07 (Workflow), Stage 23 (Impl) | Live Dispatch & Idempotency Tests |
| **BR-007** | Platform Sync & Live Availability | Integration | Stage 07 (Workflow), Stage 24 (Impl) | URL Verification & Retry Tests |
| **BR-008** | Analytics & Retention Harvesting | Analytics | Stage 06 (Domain), Stage 25 (Impl) | Telemetry Ingestion Tests |
| **BR-009** | Diagnostic Performance Review | Analytics | Stage 07 (Workflow), Stage 25 (Impl) | Performance Review UI Tests |
| **BR-010** | Closed-Loop Pedagogical Intelligence | Intelligence | Stage 07 (Workflow), Stage 26 (Impl) | Intelligence Feedback Loop Tests |
| **NFR-001** | Data & Transition Reliability | Reliability | Stage 08 (State), Stage 14 (Engine) | Concurrency & Atomic State Tests |
| **NFR-002** | UI & API Responsiveness | Performance | Stage 10 (IA), Stage 13 (API), Stage 29 | Latency & Async Processing Tests |
| **NFR-003** | Server-Authoritative Security | Security | Stage 09 (RBAC), Stage 15 (Auth Impl) | Zero-Trust & Negative Auth Tests |
| **NFR-004** | Operational Pipeline Scalability | Scalability | Stage 12 (Data Arch), Stage 16 (DB) | Batch Load & Query Stress Tests |
| **NFR-005** | Modularity & Clean Contracts | Architecture | Stage 04 (Principles), Stage 13 (API) | Codebase Static Analysis & Lint |
| **NFR-006** | Initial Cost Constraint (₹0–₹100) | Governance | Stage 04 (Principles), Stage 16 (DB) | Infrastructure Audit & Bill Review |
| **NFR-007** | Fault-Tolerant Availability | Operations | Stage 05 (Boundary), Stage 28 (E2E) | Service Isolation & Offline Tests |
| **NFR-008** | Immutable Forensic Auditability | Governance | Stage 09 (RBAC), Stage 27 (Audit) | Audit Ledger Verification Tests |

---

## 13. Acceptance Criteria

Stage 01 is verified against the following objective acceptance criteria:

| Criteria ID | Acceptance Criteria Specification | Verification Status |
| :--- | :--- | :---: |
| **AC-01** | **Product Definition:** The document explicitly defines what BP-CMS is, its target users, the business problems it solves, its vision, and operational purpose. | **PASS** |
| **AC-02** | **User Definition:** Functional user categories covering all content, production, review, and management roles are documented based on existing product context. | **PASS** |
| **AC-03** | **Internal Scope:** Internal system capabilities covering identity, questions, scripts, production, publishing, analytics, and governance are fully defined. | **PASS** |
| **AC-04** | **External Boundary:** External systems (Google Drive, YouTube, social networks, AI models, archive tiers) are explicitly demarcated as external. | **PASS** |
| **AC-05** | **Business Capabilities:** Core business requirements (BR-001 through BR-010) covering all 15 manufacturing steps are formally specified. | **PASS** |
| **AC-06** | **Canonical Workflow:** The 15 canonical steps are recorded exactly as established, with explicit enforcement of the 5-dimensional State Separation Axiom. | **PASS** |
| **AC-07** | **Non-Functional Requirements:** Specific, testable NFRs for Reliability, Performance, Security, Scalability, Maintainability, Cost, Availability, and Auditability are defined. | **PASS** |
| **AC-08** | **Cost Constraint:** The ₹0–₹100 initial infrastructure investment constraint (COST-001) and cost-control principles are recorded as hard requirements. | **PASS** |
| **AC-09** | **AI Governance:** AI is explicitly established as assistive, subject to human review, and prohibited from autonomous gate approvals or state mutations. | **PASS** |
| **AC-10** | **Media Boundary:** Separation of internal media metadata/references from external binary storage is formalized. | **PASS** |
| **AC-11** | **Brownfield Constraints:** Inviolable rules regarding incremental modernization, functionality preservation, and zero data corruption are documented. | **PASS** |
| **AC-12** | **Explicit Non-Requirements:** Implementation decisions (database, state code, API schemas, UI components, deployment) are explicitly deferred to later stages. | **PASS** |
| **AC-13** | **Traceability:** A comprehensive traceability matrix maps all requirements to downstream architecture, contract, and implementation stages. | **PASS** |

---

## 14. Document Governance

1. **Requirements Authority:** This document serves as the supreme product-level authority for WHAT BP-CMS must become.
2. **Subsequent Stage Alignment:** Later architecture, contract, and implementation stages must never contradict or circumvent these requirements without an explicit, versioned Requirements Change Request.
3. **Traceability Rule:** All production source code, API routes, database schemas, and automated test suites must eventually trace back to one or more requirements in this baseline.
4. **Anti-Substitution Rule:** Requirements documentation must NEVER be cited as proof that a feature is implemented. Implementation requires verified, compiling repository source code and passing automated tests.

---

```
================================================================================
STAGE 01 — REQUIREMENTS BASELINE
STATUS: READY FOR EXTERNAL VERIFICATION
DOCUMENT: docs/requirements/01-REQUIREMENTS-BASELINE.md
VERSION: 1.1.0
IMPLEMENTATION STATUS: REQUIREMENTS BASELINE COMPLETE (100%)
APPLICATION SOURCE CODE CHANGED: NONE
DATA / DATABASE / SHEETS / DRIVE CHANGED: NONE
INFRASTRUCTURE / DEPLOYMENT CHANGED: NONE
TECHNICAL VERIFICATION: PASSED
NEXT STAGE: STAGE 02 — BUSINESS ACCEPTANCE CRITERIA
================================================================================
```
