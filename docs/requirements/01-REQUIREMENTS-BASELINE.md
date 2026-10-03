# 01 — REQUIREMENTS BASELINE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 01 of 30-Stage Modernization Program — Authoritative Product Definition

---

## 1. Document Governance & Anti-Overclaim Statement

| Attribute | Definition |
| :--- | :--- |
| **Document Path** | `docs/requirements/01-REQUIREMENTS-BASELINE.md` |
| **SDLC Stage** | Stage 01 — Requirements Baseline |
| **Document Version** | 1.0.0-SDLC-RESTART |
| **Status** | ACTIVE BASELINE SPECIFICATION |
| **Scope** | Authoritative Product, Business, and Non-Functional Requirements for BP-CMS |

### Strict Anti-Overclaim Rule
1. **Requirements vs Implementation:** This document establishes **WHAT** BP-CMS must become from a product and business perspective. It does **NOT** constitute evidence that the corresponding capabilities are currently implemented in production source code.
2. **Implementation Neutrality:** This document defines business requirements without mandating specific database engines, state machine libraries, API endpoint URLs, or frontend component implementations.
3. **Brownfield Baseline:** The existing repository source code reflects the *current brownfield state*, not the final authoritative business target. Existing code must be evaluated against this requirements baseline in subsequent stages.
4. **Vocabulary Invariant:** The word **"Implemented"** is forbidden when **"Required"** is meant. "Complete" in Stage 01 means the *Requirements Baseline* is complete, not that the software features have been implemented.

---

## 2. 01.1 Product Purpose

### 2.1 What BP-CMS Is
**Burra Pariksha Content Management System (BP-CMS)** is an operational, multi-user content-production operating system designed specifically for the *Burra Pariksha* educational media channel. The system coordinates the end-to-end lifecycle of competitive examination aptitude and reasoning content (Telugu States APPSC/TSPSC, SI, Constable, DSC, SSC, and RRB), transforming raw syllabus concepts and academic question stems into rigorously audited, studio-filmed, professionally edited, packaged, broadcasted, and analytically evaluated video assets.

BP-CMS is fundamentally:
- A **Controlled Content Lifecycle System:** Enforcing sequential progression through distinct manufacturing steps with clear exit criteria.
- A **Multi-User Operational Workflow:** Governing task handoffs between question writers, academic reviewers, presenters, video editors, and publishing coordinators.
- A **Human-Gated Quality Platform:** Requiring mandatory human review and verification before academic content or media can advance to public broadcasting.
- A **Coordinated Publishing & Distribution Manager:** Staging release packages, coordinating multi-platform releases, and maintaining synchronized broadcast records.
- A **Closed-Loop Intelligence Engine:** Harvesting audience retention analytics, diagnosing pedagogical drop-off points, and feeding actionable insights back into future question authoring.

BP-CMS is **NOT**:
- A standalone AI prompt sandbox or simple LLM wrapper
- An uncoordinated spreadsheet view or database viewer
- A static blog or brochureware CMS

### 2.2 Who Uses BP-CMS (Operational User Categories)
The business lifecycle of BP-CMS requires 12 functional user categories:

1. **Question Author:** Drafts competitive exam questions, options, step-by-step proofs, and bilingual (English/Telugu) distractor rationales.
2. **Academic Verifier:** Subject matter expert responsible for independent pedagogical audit, mathematical verification, and syllabus alignment.
3. **Scriptwriter:** Adapts verified academic proofs into engaging 60-second spoken video presentation scripts with visual cues and pacing notes.
4. **Studio Presenter / Faculty:** On-camera educator who delivers the spoken explanation, operates teleprompter pacing, and records audio/video takes.
5. **Camera & Studio Operator:** Technical crew managing recording hardware, lighting, audio levels, teleprompter sync, and camera take logging.
6. **Video Editor:** Post-production specialist who cuts camera takes, synchronizes bilingual animated subtitles, inserts graphics, and masters audio (-14 LUFS standard).
7. **Quality Control (QC) Officer:** Independent technical gatekeeper certifying audio loudness, visual clarity, subtitle timing, and academic fidelity.
8. **Thumbnail Designer:** Visual packaging artist who designs high-contrast, mobile-optimized cover artwork and hook headlines.
9. **Social Reviewer / Media Manager:** Editorial coordinator auditing 9:16 vertical smartphone safe zones, platform copy, hashtags, and Telugu pinned comments.
10. **Publishing Operator:** Distribution coordinator managing release schedules, broadcast dispatch, and live URL verification.
11. **Analytics Specialist & Performance Researcher:** Analyst tracking audience retention curves, engagement metrics, and drop-off diagnosis.
12. **Content Strategy Lead & Executive Producer:** Curriculum director who reviews channel velocity, evaluates student confusion patterns, and prioritizes future question sprints.

*(Note: Where appropriate in small team operations, a single human may hold multiple operational roles, but the system must enforce strict role boundaries, such as preventing an author from approving their own question).*

### 2.3 Problems BP-CMS Solves
The system addresses fundamental operational breakdowns in educational media production:
1. **Fragmented Content Production:** Replaces scattered communication across personal chats, isolated hard drives, and untracked sheets with a single operational pipeline.
2. **Unclear Work Ownership:** Eliminates pipeline bottlenecks where nobody knows which team member is currently responsible for advancing an asset.
3. **Uncontrolled Workflow Progression:** Prevents downstream editors or presenters from working from unverified questions or outdated script drafts.
4. **Lack of Operational Visibility:** Provides real-time tracking of what content is in drafting, filming, editing, QC, or scheduled for release.
5. **Inconsistent Review and Approval:** Eliminates mathematical errors, audio flaws, or inaccurate answer keys reaching live students through formal quality gates.
6. **Poor Traceability:** Resolves the inability to determine who authored, verified, recorded, edited, or approved an asset in the event of an academic error.
7. **Difficulty Tracking Content Across Production:** Ensures that questions, scripts, raw video takes, master cuts, and thumbnails remain linked as a coherent unit.
8. **Disconnected Analytics:** Replaces isolated platform dashboards by importing viewer retention telemetry directly into the context of the original question and script.
9. **Inability to Close the Intelligence Loop:** Bridges the gap between audience retention data and curriculum planning, guiding future sprint batches empirically.
10. **Loss of Operational History:** Provides a permanent, immutable record of every mutation, gate decision, and publication dispatch.

### 2.4 Product Boundary: What Is INSIDE the System
The internal scope of BP-CMS includes the following business capabilities:
- Identity, authentication, and session state
- User role assignments and capability-based authorization
- Curriculum taxonomy and syllabus hierarchy management
- Question authoring, mathematical proof drafting, and bilingual option management
- Academic verification workflows, checklists, and sign-offs
- Audience script creation, teleprompter pacing, and visual directive logging
- Filming coordination, take logging, and raw footage registration
- Editing bay workflow tracking and master video cut registration
- Final technical QC inspection and broadcast compliance certification
- Thumbnail packaging, A/B variant tracking, and legibility review
- 9:16 mobile safe-zone social simulator and editorial review
- Publishing setup, distribution package staging, and release scheduling
- Publication tracking and live broadcast execution records
- Platform synchronization verification and external URL health checks
- Audience analytics ingestion and milestone tracking (24h, 7d, 30d)
- Performance diagnostic review and retention drop-off correlation
- Pedagogical intelligence synthesis and curriculum directive generation
- End-to-end workflow state orchestration across all 15 stages
- Work assignments, task ownership, and team workload queues
- Operational notifications, reviewer alerts, and handoff signals
- Append-only forensic audit logging for all business mutations
- Media metadata ownership and external storage reference management
- AI-assisted content drafting and analytical recommendation boundaries

### 2.5 Product Boundary: What Is OUTSIDE the System
The following systems are external to BP-CMS. The system maintains boundary interfaces and references, but does **NOT** own or implement their internal operations:
1. **External Binary Media Storage:** Physical persistence of multi-gigabyte video files and raw footage (e.g., Google Drive, cloud object storage). BP-CMS stores pointers, URLs, and checksums; binary video data lives externally.
2. **Social Media Distribution Platforms:** Public broadcast networks (YouTube, Instagram, Facebook). The system coordinates staging and records platform IDs/URLs, but external distribution execution remains external.
3. **External AI Providers:** Foundation model APIs (e.g., Google Gemini). Utilized strictly as external assistive services.
4. **External Archival Storage:** Cold storage systems for long-term camera raw footage archiving.
5. **Physical Studio Equipment:** Physical cameras, studio lighting, teleprompter hardware, and audio microphones.
6. **Local Post-Production NLE Suites:** Offline editing workstations (DaVinci Resolve, Adobe Premiere).
7. **Human Editorial Decisions:** Final responsibility for educational accuracy and broadcast approval rests with human operators, not the software.

---

## 3. 01.2 Business Capability Requirements (BR-001 through BR-011)

### BR-001: Question Production
- **Purpose:** Provide a structured environment for authoring high-yield competitive examination questions.
- **Business Outcome:** High-quality, syllabus-aligned multiple-choice questions drafted with complete solutions and distractor explanations.
- **Primary Users:** Question Author, Subject Matter Expert.
- **Required Capability:** Authoring question stems, 4 distinct options, single answer key, bilingual (Telugu/English) translations, mathematical step-by-step proofs, and syllabus tagging.
- **Required Inputs:** Syllabus taxonomy (Subject, Topic, Subtopic), difficulty tier (Easy, Medium, Hard), target exam context.
- **Required Outputs:** Unverified draft question entity with complete option sets, correct key, and proof.
- **Business Rules:**
  1. Exactly four multiple-choice options (A, B, C, D) are required.
  2. Exactly one option must be marked as the correct answer.
  3. Every question must include a step-by-step mathematical or conceptual solution proof.
  4. Question generation produces unverified draft entities; it does not assign permanent production IDs or initiate filming.
- **Human Decision Points:** Author confirms draft completeness and submits for verification.
- **Completion Condition:** Draft question contains all mandatory fields and is submitted to verification queue.
- **Failure / Revision Condition:** Incomplete draft remains in author's personal workspace.
- **Traceability / Audit Expectation:** Author ID, creation timestamp, prompt metadata (if AI-assisted), and full revision history captured.

### BR-002: Question Verification
- **Purpose:** Ensure rigorous academic accuracy, syllabus alignment, and pedagogical validity before studio commitment.
- **Business Outcome:** Certified academic question approved for spoken script adaptation, or detailed rejection feedback.
- **Primary Users:** Academic Verifier, Subject Matter Expert, QA Reviewer.
- **Required Capability:** Comprehensive pedagogical audit checklist (accuracy, ambiguity, distractor plausibility, translation fidelity, LaTeX rendering).
- **Required Inputs:** Draft question entity from BR-001.
- **Required Outputs:** Verification record with verification decision (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`) and reviewer remarks.
- **Business Rules:**
  1. Anti-Self-Approval Rule: The question author cannot serve as the academic verifier for their own question.
  2. Approval requires explicit certification of all mandatory checklist criteria.
  3. Rejection or change requests must include actionable, timestamped feedback notes.
- **Human Decision Points:** Verifier approves, requests revisions, or permanently rejects the question.
- **Completion Condition:** Verification record created with decision `APPROVED`.
- **Failure / Revision Condition:** Decision `CHANGES_REQUESTED` routes question back to author queue; `REJECTED` marks entity inactive.
- **Traceability / Audit Expectation:** Verifier ID, audit timestamp, checklist outcomes, and exact pre/post state recorded.

### BR-003: Script Production
- **Purpose:** Convert verified academic problems into conversational, high-retention short-form video presentation scripts.
- **Business Outcome:** Production-ready spoken teleprompter script structured for short-form video engagement (45–60 seconds).
- **Primary Users:** Scriptwriter, Studio Presenter, Content Strategy Lead.
- **Required Capability:** Structuring spoken delivery into 5 distinct components (Hook, Problem, Solution, Burra Trick, CTA) with visual cues and timing estimates.
- **Required Inputs:** Approved academic question entity from BR-002.
- **Required Outputs:** Versioned script entity containing spoken Telugu/English text, visual callouts, word count, and estimated duration.
- **Business Rules:**
  1. Script must maintain target spoken duration within 45 to 60 seconds (calculated at ~130–150 words per minute).
  2. Every visual directive (screen overlay, math highlight) must explicitly link to a script line.
  3. Script edits after approval require incrementing the script revision number.
- **Human Decision Points:** Scriptwriter locks script; Presenter confirms readability and cadence.
- **Completion Condition:** Script status marked `APPROVED` and locked for studio teleprompter use.
- **Failure / Revision Condition:** Presenter can request cadence revisions, keeping script in drafting state.
- **Traceability / Audit Expectation:** Scriptwriter ID, version number, word count, duration estimate, and presenter sign-off logged.

### BR-004: Video Production
- **Purpose:** Coordinate studio recording, raw take logging, post-production video editing, and final technical quality certification.
- **Business Outcome:** Broadcast-compliant master 9:16 MP4 video cut with certified audio loudness (-14 LUFS) and synced bilingual subtitles.
- **Primary Users:** Studio Presenter, Camera Operator, Video Editor, QC Officer.
- **Required Capability:** Teleprompter display pacing, camera take metadata logging, raw video registration (resolution, frame rate, checksum, external storage URI), editing workflow tracking, and multi-point QC inspection.
- **Required Inputs:** Approved script from BR-003, raw camera footage, motion graphics assets.
- **Required Outputs:** Master cut entity registered with duration, resolution, SHA-256 checksum, external storage locator, and QC pass stamp.
- **Business Rules:**
  1. Raw camera takes must be registered with technical metadata and external storage reference before editing begins.
  2. Large video binaries must NEVER be stored in the application database.
  3. Master cut must pass independent Final QC verification before proceeding to social packaging.
- **Human Decision Points:** Camera operator logs takes; Editor submits master cut; QC Officer certifies broadcast readiness.
- **Completion Condition:** QC Officer certifies master cut with status `QC_PASSED`.
- **Failure / Revision Condition:** QC failure routes master cut back to editor with timestamped correction notes.
- **Traceability / Audit Expectation:** Take log stamps, editor ID, master cut checksum, audio loudness measure, and QC officer approval recorded.

### BR-005: Thumbnail Production
- **Purpose:** Manage creation, validation, and association of high-CTR mobile cover artwork.
- **Business Outcome:** High-contrast mobile thumbnail package linked to the video production project.
- **Primary Users:** Thumbnail Designer, Creative Lead, Social Media Manager.
- **Required Capability:** Asset registration, high-contrast visual inspection, curiosity hook headline validation, and A/B test variant tracking (Variants A/B/C).
- **Required Inputs:** Parent question, video production project, thumbnail image file metadata, hook text.
- **Required Outputs:** Registered thumbnail package with verified mobile legibility and external storage URI pointers.
- **Business Rules:**
  1. Hook headline must never leak the correct answer key.
  2. Image assets must conform to target aspect ratios (9:16 vertical, 16:9 widescreen).
- **Human Decision Points:** Creative Lead approves thumbnail visual quality and legibility.
- **Completion Condition:** Thumbnail package marked `APPROVED` and linked to production project.
- **Failure / Revision Condition:** Illegible or answer-leaking thumbnails rejected for redesign.
- **Traceability / Audit Expectation:** Designer ID, variant IDs, external storage locators, and review approval stamps logged.

### BR-006: Social Review
- **Purpose:** Conduct holistic editorial and packaging review of the complete social broadcast bundle before release authorization.
- **Business Outcome:** Formally certified social release package verified for platform safe zones and compliance.
- **Primary Users:** Social Media Manager, Publishing Coordinator.
- **Required Capability:** Interactive 9:16 vertical smartphone simulator previewing video cut, thumbnail, platform title, description, hashtags, and Telugu pinned comment against UI safe-zone overlays.
- **Required Inputs:** Master video cut (BR-004), approved thumbnail (BR-005), platform copy, Telugu pinned comment.
- **Required Outputs:** Certified social release package approved for distribution scheduling.
- **Business Rules:**
  1. Master cut, thumbnail, platform copy, and pinned comment must all be present and approved.
  2. Pinned comment must contain the full pedagogical explanation, Burra Trick, and call-to-action.
  3. No asset can proceed to publishing without human social review sign-off.
- **Human Decision Points:** Social Media Manager approves or requests copy/packaging changes.
- **Completion Condition:** Social package marked `APPROVED_FOR_RELEASE`.
- **Failure / Revision Condition:** Packaging defects returned to video editor, thumbnail designer, or copywriter.
- **Traceability / Audit Expectation:** Reviewer ID, simulator sign-off timestamp, copy diffs, and approval remarks recorded.

### BR-007: Publishing
- **Purpose:** Coordinate scheduling and live release dispatch across distribution channels.
- **Business Outcome:** Dispatched live broadcast record with platform-specific content identifiers and publication timestamps.
- **Primary Users:** Publishing Operator, Channel Manager.
- **Required Capability:** Distribution staging, multi-channel release scheduling, guided or automated dispatch execution, and duplicate upload prevention.
- **Required Inputs:** Certified social package from BR-006, destination channel parameters, target release time.
- **Required Outputs:** Immutable broadcast record containing publication timestamps, operator ID, and platform response codes.
- **Business Rules:**
  1. Strict duplicate-prevention controls must prevent accidental re-publishing of previously dispatched content.
  2. Publishing operations must be idempotent.
- **Human Decision Points:** Publishing Operator authorizes live release dispatch.
- **Completion Condition:** Broadcast status marked `PUBLISHED` with external platform IDs recorded.
- **Failure / Revision Condition:** Dispatch failure triggers immediate operator alert and retry pathway without corrupting internal state.
- **Traceability / Audit Expectation:** Operator ID, dispatch timestamp, target channels, platform video IDs, and API response logs preserved.

### BR-008: Platform Synchronization
- **Purpose:** Continuously verify that published content maintains consistent public availability across external platforms.
- **Business Outcome:** Verified platform synchronization status confirming public video playback and link health.
- **Primary Users:** Publishing Operator, Channel Administrator.
- **Required Capability:** Automated and operator-guided verification of live broadcast URLs (HTTP 200, valid video streaming) and cross-platform status parity.
- **Required Inputs:** Live broadcast records from BR-007, external video URLs, platform status indicators.
- **Required Outputs:** Synchronization ledger certifying public availability across YouTube, Instagram, and Facebook.
- **Business Rules:**
  1. External platform outages or network timeouts must be isolated; they must never corrupt internal CMS state.
  2. Transient synchronization errors must support structured retry workflows.
- **Human Decision Points:** Operator investigates flagged broken links or syndication mismatches.
- **Completion Condition:** All target channel URLs return HTTP 200 and verified playback status.
- **Failure / Revision Condition:** Broken links trigger operator intervention and platform re-sync.
- **Traceability / Audit Expectation:** Verification timestamps, HTTP status codes, latency, and recovery actions logged.

### BR-009: Analytics
- **Purpose:** Ingest, structure, and permanently store multi-platform audience engagement telemetry.
- **Business Outcome:** Structured analytical snapshots permanently linked to the parent content aggregate root.
- **Primary Users:** Analytics Specialist, Performance Researcher.
- **Required Capability:** Ingesting view counts, watch time, likes, shares, comments, average percentage viewed (APV), and second-by-second audience retention curves at standardized milestone intervals (24h, 7d, 30d).
- **Required Inputs:** Verified broadcast records from BR-008, platform analytics telemetry.
- **Required Outputs:** Immutable analytical snapshots mapped to the parent content item.
- **Business Rules:**
  1. Analytics ingestion must never alter the upstream video, script, or question business state.
  2. Analytical snapshots are immutable and timestamped upon capture.
- **Human Decision Points:** Analytics specialist audits telemetry integrity and triggers manual refresh if platform feeds lag.
- **Completion Condition:** Milestone snapshots (24h, 7d, 30d) successfully recorded.
- **Failure / Revision Condition:** Ingestion errors trigger exponential backoff retry without data loss.
- **Traceability / Audit Expectation:** Telemetry payload source, ingestion timestamp, and milestone labels captured.

### BR-010: Performance Review
- **Purpose:** Provide diagnostic assessment tools correlating viewer retention drop-offs with pedagogical content elements.
- **Business Outcome:** Documented diagnostic findings identifying student confusion points, delivery flaws, or hook effectiveness.
- **Primary Users:** Performance Researcher, Content Strategy Lead, Faculty Presenter.
- **Required Capability:** Interactive diagnostic review cross-referencing viewer drop-off points with script timestamps, formula presentations, or presenter pacing.
- **Required Inputs:** Ingested analytics and retention curves from BR-009, video script, viewer comments.
- **Required Outputs:** Diagnostic review findings recording pedagogical observations and student confusion points.
- **Business Rules:**
  1. Performance reviews provide diagnostic evaluation; they do not alter the published broadcast asset.
  2. Diagnostic findings must be recorded by human educators or content strategists.
- **Human Decision Points:** Reviewer determines primary cause of retention drop-off (e.g., conceptual confusion, audio defect, weak hook).
- **Completion Condition:** Performance review signed off with categorized observations.
- **Failure / Revision Condition:** Inconclusive telemetry flagged for extended observation window.
- **Traceability / Audit Expectation:** Reviewer ID, diagnostic classification, drop-off timestamps, and notes recorded.

### BR-011: Intelligence Loop
- **Purpose:** Close the operational production loop by converting performance insights into actionable curriculum directives.
- **Business Outcome:** Approved pedagogical sprint directive specifying topics, difficulty distributions, and hook patterns for new question authoring.
- **Primary Users:** Content Strategy Lead, Curriculum Director, Executive Producer.
- **Required Capability:** Synthesizing student misconception patterns into structured topic recommendations, distractor improvements, and priority sprint batches seeding Step 01.
- **Required Inputs:** Diagnostic review findings from BR-010, aggregated retention trends across syllabus topics, syllabus coverage metrics.
- **Expected Business Output:** Approved pedagogical sprint directive specifying topics, difficulty distributions, and hook patterns for new question authoring.
- **Business Rules:**
  1. AI may generate candidate topic directives and recommendations, but human content strategists must explicitly review and approve them before new batches are initiated.
  2. Approved directives feed directly into Step 01 Question Generation to guide future authoring cycles.
- **Human Decision Points:** Content Strategy Lead approves, modifies, or rejects curriculum sprint directives.
- **Completion Condition:** Sprint directive approved and dispatched to Question Author queues.
- **Failure / Revision Condition:** Unapproved recommendations archived without initiating production batches.
- **Traceability / Audit Expectation:** Recommendation provenance, human modification diff, approval stamp, and child question batch links captured.

---

## 4. 01.3 Non-Functional Requirements (NFR-001 through NFR-008)

### NFR-001 — Reliability
- **Requirement:** The system must guarantee zero silent data loss for approved curriculum questions, verified scripts, master video metadata, and live broadcast records.
- **Business Reason:** Loss of verified academic content or publication records causes operational paralysis, duplicate production expense, and compliance failure.
- **Observable Expectation:** All state transitions must be atomic and validated server-side. Power interruptions, client crashes, or network timeouts must fail safely without creating orphaned or corrupted records.
- **Important Failure Condition:** Concurrent writes or aborted network requests resulting in partial, untraceable, or inconsistent entity states.

### NFR-002 — Performance
- **Requirement:** Core operational UI interactions, navigation transitions, and standard API responses must remain responsive and lightweight under normal operational load.
- **Business Reason:** Slow interfaces degrade studio recording cadence, delay editing turnarounds, and impede high-velocity daily production.
- **Observable Expectation:** Standard page navigation and data forms respond within responsive human interaction thresholds. Long-running tasks (file uploads, media processing, AI generation, analytics harvesting) must execute asynchronously without blocking operator workstations.
- **Target Parameter:** *Specific millisecond latency targets to be defined in a later architecture/engineering stage.*
- **Important Failure Condition:** Synchronous blocking of the user interface during heavy external network calls or file transfers.

### NFR-003 — Security
- **Requirement:** All protected operations, operational tools, and data mutations require authenticated sessions and strict server-side capability authorization.
- **Business Reason:** Unauthorized access can result in unverified questions being broadcasted, compromised credentials, or academic leakage.
- **Observable Expectation:** The system enforces authentication on all operational pathways. Authorization is strictly server-authoritative (frontend checks are strictly for UX). External API keys, service account credentials, and OAuth secrets are never exposed to client bundles.
- **Important Failure Condition:** Bypassing authorization gates via client manipulation or executing self-approval actions prohibited by role policies.

### NFR-004 — Scalability
- **Requirement:** The architectural design must accommodate scaling from initial daily batches to hundreds of concurrent content projects in flight across all 15 stages.
- **Business Reason:** The production channel expects substantial volume growth across multiple competitive examination categories over multi-year lifecycles.
- **Observable Expectation:** Data structures, query patterns, and workflow engines must handle accumulating thousands of curriculum questions, video takes, and historical analytics without degradation.
- **Target Parameter:** *Specific concurrent user and record throughput targets to be defined in a later architecture/engineering stage.*
- **Important Failure Condition:** System slowdown or locking when question libraries grow beyond initial baseline volumes.

### NFR-005 — Maintainability
- **Requirement:** The system must feature modular architecture with strict separation between UI Presentation, Application Use Cases, Domain State, and Data/Storage Adapters.
- **Business Reason:** Tightly coupled code makes future feature additions brittle, causes regression bugs, and complicates multi-stage development.
- **Observable Expectation:** Zero dead code, elimination of orphaned components, consistent naming conventions, and testable domain interfaces.
- **Important Failure Condition:** Scattered duplicate business logic or competing ad-hoc state implementations across UI pages.

### NFR-006 — Cost (COST-001 Hard Constraint)
- **Requirement:** **INITIAL INFRASTRUCTURE INVESTMENT TARGET: ₹0 – ₹100.**
- **Business Reason:** The system operates under strict financial frugality, maximizing existing platform free-tier allowances, serverless container runtimes, and developer quotas.
- **Observable Expectation:** Architecture proposals prioritize zero-cost tiers. No paid infrastructure components (commercial databases, paid queues, commercial SaaS) may be introduced without formal Product Owner approval and cost justification.
- **Important Failure Condition:** Incurring unplanned cloud infrastructure bills or requiring recurring paid licenses for standard operation.

### NFR-007 — Availability & Fault Tolerance
- **Requirement:** Internal studio workflows (question drafting, scriptwriting, filming teleprompter, video editing) must remain fully operational despite transient outages in external services (YouTube API, Instagram, Gemini).
- **Business Reason:** Studio faculty, cameras, and editing bays represent real-time operational commitments that cannot pause due to third-party API rate limits.
- **Observable Expectation:** External failures must be isolated behind boundary adapters with graceful degradation and operator alerting.
- **Target Parameter:** *Specific uptime SLAs to be defined in a later architecture/engineering stage.*
- **Important Failure Condition:** A third-party API quota exhaustion causing internal question authoring or teleprompter tools to crash.

### NFR-008 — Auditability
- **Requirement:** Every business-critical mutation, approval, rejection, override, and publishing dispatch must be permanently recorded in an append-only audit ledger.
- **Business Reason:** Essential for educational compliance, accountability, and forensic troubleshooting in the event of academic or broadcast errors.
- **Observable Expectation:** Every recorded event captures: Actor (ID & Role), Action (Operation), Entity (Type & ID), State Delta (Before/After), Timestamp (UTC), Outcome, and Reason/Remarks.
- **Important Failure Condition:** Unlogged workflow stage advancements or modifications to published records without audit trail.

---

## 5. 01.4 Constraints

### 5.1 Mandatory Constraints
1. **COST-001 Financial Constraint:** Initial infrastructure expenditure must remain strictly within **₹0 – ₹100**.
2. **Canonical 15-Stage Business Workflow:** All content must progress through exactly the 15 approved sequential business stages without alternative competing workflows:
   ```text
   01. Question Generation
   02. Question Verification
   03. Audience Script
   04. Teleprompter & Filming
   05. Raw Video
   06. Editing Bay
   07. Final QC
   08. Thumbnail
   09. Social Review
   10. Publishing Setup
   11. Published
   12. Platform Sync
   13. Analytics
   14. Performance Review
   15. Intelligence Loop
   ```
3. **Strict State Separation Axiom:** The system must conceptually separate:
   ```text
   Workflow Step ≠ Entity Status ≠ Media Status ≠ Job Status ≠ Publication Status
   ```
4. **Human-Gated AI Control:** AI is strictly assistive. AI must never autonomously approve academic verification, certify QC, authorize publishing, or mutate protected state without explicit human confirmation.
5. **Media Boundary Constraint:** Large binary video and audio files must live in external storage. The primary business database stores only metadata, locators, and checksums.
6. **Single Source of Truth:** Exactly one authoritative business state exists for each entity. External platforms are integrations, not competing sources of truth.

### 5.2 Brownfield Constraints
1. **Existing Code is Baseline, Not Target:** The current source code reflects the brownfield state; existing behaviors must be evaluated against this requirements baseline and updated where discrepant.
2. **Preserve Production Functionality:** Working question authoring, studio queues, editing trackers, LaTeX rendering, and publishing flows must remain operational throughout modernization.
3. **Preserve Production Data:** Existing records in production spreadsheets, Google Drive folders, and databases must never be purged or corrupted.
4. **Incremental Modernization:** Upgrades must proceed via disciplined, verifiable stages:
   ```text
   CLASSIFY  →  CONSOLIDATE  →  MIGRATE  →  VERIFY  →  RETIRE
   ```

### 5.3 Explicit Non-Requirements (Deferred Technical Decisions)
To maintain strict SDLC stage boundaries, Stage 01 explicitly defers the following technical decisions to subsequent architecture and engineering stages:
- Selection of physical database technology (Google Sheets vs PostgreSQL vs SQLite vs Cloud SQL) *(deferred to Stage 12)*
- Exact physical database schemas, table structures, and indexing *(deferred to Stage 13)*
- Workflow engine implementation mechanics and state machine libraries *(deferred to Stage 08 & 14)*
- REST/RPC API contracts, URL paths, and JSON payload schemas *(deferred to Stage 15)*
- Frontend UI component libraries and widget frameworks *(deferred to Stage 10)*
- Deployment topology, Cloud Run specs, Dockerfiles, and CI/CD pipelines *(deferred to Stage 29)*
- Background queue technology (Redis, BullMQ, Cloud Tasks, in-memory) *(deferred to Stage 17)*
- Realtime communication protocol (WebSockets vs SSE vs polling) *(deferred to Stage 16)*
- Granular RBAC code syntax and middleware type signatures *(deferred to Stage 09)*
- Cold archive storage vendor selection *(deferred to Stage 14)*
- CSS build tooling and design token variables *(deferred to Stage 10)*
- Analytics aggregation algorithms and chart rendering engines *(deferred to Stage 20)*
- Server-side caching mechanisms *(deferred to Stage 16)*
- Error tracking and observability SDK selections *(deferred to Stage 21)*

---

## 6. Requirements Traceability Matrix

Every business and operational requirement maps to downstream SDLC stages:

| Requirement ID | Description | Business Capability | Responsible Downstream Stage | Verification Method (To Be Defined Later) |
| :--- | :--- | :--- | :--- | :--- |
| **BR-001** | Question Production | Content Creation | Stage 06 (Domain), Stage 19 (Impl) | Automated Question Contract & Validation Tests |
| **BR-002** | Question Verification | Quality & Compliance | Stage 06 (Domain), Stage 19 (Impl) | Verification Gate & Segregation of Duties Tests |
| **BR-003** | Script Production | Spoken Content Adaptation | Stage 06 (Domain), Stage 20 (Impl) | Script Pacing & Component Structure Tests |
| **BR-004** | Video Production | Filming, Takes & QC | Stage 06 (Domain), Stage 21 (Impl) | Video Metadata & QC Certification Gate Tests |
| **BR-005** | Thumbnail Production | Visual Packaging | Stage 06 (Domain), Stage 22 (Impl) | Thumbnail Aspect & Legibility Verification |
| **BR-006** | Social Review | Mobile Safe-Zone Audit | Stage 07 (Workflow), Stage 22 (Impl) | 9:16 Simulator Safe-Zone UI Contract Tests |
| **BR-007** | Publishing | Release Dispatch | Stage 07 (Workflow), Stage 23 (Impl) | Live Dispatch Idempotency & Duplicate Tests |
| **BR-008** | Platform Sync | Public Link Verification | Stage 07 (Workflow), Stage 24 (Impl) | URL Status Verification & Retry Tests |
| **BR-009** | Analytics | Engagement Telemetry | Stage 06 (Domain), Stage 25 (Impl) | Retention Curve Ingestion & Association Tests |
| **BR-010** | Performance Review | Pedagogical Diagnostics | Stage 07 (Workflow), Stage 25 (Impl) | Drop-off Correlation & Review Findings Tests |
| **BR-011** | Intelligence Loop | Closed-Loop Feedback | Stage 07 (Workflow), Stage 26 (Impl) | Closed-Loop Recommendation Seeding Tests |
| **NFR-001** | Reliability | Data Integrity | Stage 08 (State), Stage 14 (Engine) | Concurrency & Atomic State Transition Tests |
| **NFR-002** | Performance | Responsiveness | Stage 10 (Frontend IA), Stage 13 (API), Stage 29 | Latency Benchmarks & Async Task Tests |
| **NFR-003** | Security | Auth & Authorization | Stage 09 (RBAC), Stage 15 (Auth Impl) | Zero-Trust & Server-Authoritative Gate Tests |
| **NFR-004** | Scalability | Volume & History | Stage 12 (Database), Stage 16 (DB Impl) | Volume Stress & Historical Query Tests |
| **NFR-005** | Maintainability | Modularity | Stage 04 (Principles), Stage 13 (Contracts) | Architecture Linter & Static Analysis Tests |
| **NFR-006** | Cost (₹0–₹100) | Financial Governance | Stage 04 (Principles), Stage 12 (Database) | Infrastructure Cost Audit & Expenditure Review |
| **NFR-007** | Availability | Fault Isolation | Stage 05 (Boundary), Stage 28 (E2E Verif) | External Provider Outage Isolation Tests |
| **NFR-008** | Auditability | Forensic Ledger | Stage 09 (RBAC), Stage 27 (Audit Impl) | Immutable Audit Ledger Append Verification |
| **COST-001** | Cost Ceiling | Financial Constraint | Stage 04 (Principles), Stage 22 (Cost Arch) | Budget Verification Check |
| **BF-001** | Brownfield Protection | Data Preservation | Stage 03 (Baseline), Stage 23 (Migration) | Regression & Data Preservation Tests |

---

## 7. Document Sign-Off & Stage Boundary

```
================================================================================
STAGE 01 — REQUIREMENTS BASELINE SPECIFICATION
================================================================================
Artifact:            docs/requirements/01-REQUIREMENTS-BASELINE.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 01 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 01. Awaiting Stage 02 Instruction.
================================================================================
```
