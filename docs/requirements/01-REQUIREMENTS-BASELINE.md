# 01 — REQUIREMENTS BASELINE
## Burra Pariksha Content Management System (BP-CMS)
### 30-Stage SDLC — Stage 01 Authoritative Requirements Specification

---

## 1. Document Control & Governance Declaration

| Attribute | Specification | Evidence / Governance Classification |
| :--- | :--- | :---: |
| **Document Identifier** | `docs/requirements/01-REQUIREMENTS-BASELINE.md` | FACT |
| **SDLC Stage** | Stage 01 — Requirements Baseline | FACT |
| **Document Version** | 2.0.0 (Authoritative 30-Stage SDLC Restart) | FACT |
| **Status** | ACCEPTED — COMPLETE — AUTHORITATIVE BASELINE | FACT |
| **System** | Burra Pariksha Content Management System (BP-CMS) | FACT |
| **Target Repository** | `Jithendranageswarareddy/burra_pariksha_cms` (`main`) | FACT |
| **Initial Cost Target** | ₹0 – ₹100 (Hard Financial Constraint) | FACT |
| **Workflow Baseline** | Canonical 15-Step Educational Media Production Pipeline | FACT |

### Mandatory Governance Declaration & Anti-Overclaim Rule
1. **Definition of "WHAT", Not "HOW":** This document defines **WHAT** BP-CMS must become. It does **NOT** define HOW requirements will be technically implemented.
2. **Strict Stage Boundary:** All technical implementation details, architectural choices, database engines, workflow engines, schemas, and endpoint designs belong strictly to subsequent SDLC stages (Stages 04 through 30).
3. **Anti-Overclaim Invariant:** **REQUIREMENT is NOT IMPLEMENTATION and is NOT VERIFICATION.** Never state "implemented" when "required" is meant. This document defines the authoritative target baseline; it does **not** constitute evidence that the corresponding functionality is currently implemented in production runtime.
4. **Brownfield Protection:** BP-CMS is an active brownfield production application. Existing production capabilities, sheets data, drive assets, and historical records must be preserved throughout modernization.

---

## 2. Product Purpose & Operational Scope

### 2.1 What BP-CMS Is
**Burra Pariksha Content Management System (BP-CMS)** is the dedicated, operational content-production operating system for the *Burra Pariksha* educational media channel. It governs an industrial-standard digital production line, coordinating the end-to-end transformation of competitive examination syllabi (Telugu States APPSC/TSPSC, SI, Constable, DSC, SSC, RRB) into rigorously verified, studio-recorded, professionally edited, packaged, broadcasted, and analytically evaluated short-form and long-form video assets.

BP-CMS is explicitly **NOT**:
- A simple question generator or single-prompt AI sandbox
- A shallow wrapper around external LLM APIs
- A disjointed collection of CMS web forms
- An uncoordinated spreadsheet viewer
- A standalone manual social publishing dashboard

BP-CMS **IS** the central production operating system that orchestrates and traces the lifecycle across:
```text
Question Generation
  → Academic Verification
  → Audience Script
  → Teleprompter & Studio Filming
  → Raw Video Registration
  → Editing Bay Post-Production
  → Final Technical QC
  → Thumbnail Packaging
  → 9:16 Social Simulator Review
  → Publishing Setup
  → Multi-Platform Broadcast
  → Platform Synchronization
  → Audience Analytics Ingestion
  → Performance Review
  → Pedagogical Intelligence Loop (Seeding Step 01)
```

### 2.2 Operational User Categories (Who Uses It)
Based on the existing brownfield system and production workflows, BP-CMS serves 17 distinct operational user categories:

1. **Question Authors:** Curriculum writers who draft competitive examination multiple-choice questions, mathematical proof steps, options, and distractor rationales in bilingual English/Telugu.
2. **Subject Matter Experts (SMEs):** Domain authorities in Quantitative Aptitude, Reasoning, Pure Maths, and General Studies who establish question correctness and syllabus depth.
3. **Academic Verifiers:** Independent pedagogical auditors who review draft questions against a strict 10-point academic quality gate (anti-self-approval rule enforced).
4. **QA Reviewers:** Quality assurance officers who audit formatting consistency, bilingual fidelity, LaTeX formula validity, and syllabus tagging.
5. **Scriptwriters:** Spoken-word educational adapters who transform formal mathematical proofs into conversational 60-second video scripts with visual editor callouts.
6. **Studio Presenters / Faculty:** On-camera educators who deliver spoken explanations, utilize teleprompters, and record audio/video takes.
7. **Camera & Studio Production Operators:** Technical studio personnel who manage filming setups, lighting, audio levels, teleprompter pacing, and video take logging.
8. **Video Editors:** Post-production specialists who assemble raw camera takes, overlay animated bilingual captions, insert motion graphics, master audio (-14 LUFS standard), and render master cuts.
9. **Quality Control (QC) Officers:** Independent gatekeepers who certify technical broadcast compliance (audio loudness, subtitle sync, video clarity, academic accuracy).
10. **Thumbnail Designers:** Visual packaging artists who produce high-CTR mobile cover artwork, hook typography, and mobile-optimized graphic variants.
11. **Social Media Managers:** Editorial strategists who audit 9:16 vertical smartphone framing, safe-zones, titles, descriptions, hashtags, and Telugu pinned comments.
12. **Publishing / Distribution Operators:** Release coordinators who schedule, stage, and dispatch live broadcasts across YouTube, Instagram, and Facebook.
13. **Analytics Specialists:** Data analysts who ingest, structure, and monitor multi-platform audience retention curves and engagement metrics.
14. **Performance Researchers:** Diagnostic researchers who correlate second-by-second drop-offs with specific explanation segments or math formulas.
15. **Content Strategy Leads:** Curriculum planners who synthesize channel retention patterns into high-yield sprint directives and batch plans.
16. **Executive / Production Managers:** Channel directors who monitor pipeline throughput, team velocity, bottlenecks, and release schedules.
17. **System Administrators:** Operational custodians who manage authentication, role assignments, security policies, backup snapshots, and forensic audit logs.

### 2.3 Operational Problems BP-CMS Solves
BP-CMS is engineered to eliminate critical operational failure points common in high-velocity competitive exam content creation:
1. **Fragmented Content Production:** Eliminates the dispersion of questions, scripts, camera takes, and publishing metadata across disconnected personal drives, chat groups, and spreadsheets.
2. **Unclear Workflow Ownership:** Establishes unambiguous stage-by-stage responsibility, preventing bottlenecks and abandoned assets.
3. **Disconnected Production Stages:** Prevents video editors from working from unverified question drafts or outdated script revisions.
4. **Inconsistent Review & Academic Leakage:** Eliminates the risk of mathematical errors, erroneous answer keys, or confusing distractor explanations reaching live students.
5. **Scattered Media Handling:** Resolves lost or mismatched video footage through deterministic metadata references, storage URIs, and SHA-256 checksums without bloating the primary application database.
6. **Publishing Mistakes & Duplicate Dispatch:** Prevents accidental double-uploads, mismatched titles/descriptions, or wrong platform aspect ratios.
7. **Platform Synchronization Failures:** Eliminates blind spots where a video goes live on YouTube Shorts but fails silently on Instagram Reels or Facebook Video.
8. **Disconnected Analytics Feedback:** Bridges the gap between viewer drop-off metrics and the educators who write the scripts.
9. **Empirical Improvement Void:** Replaces guesswork with a closed-loop intelligence mechanism that directs future question sprints based on measured student confusion points.
10. **Auditability & Compliance Void:** Provides an immutable, append-only ledger capturing who created, verified, filmed, edited, approved, and published every asset.

### 2.4 Desired Product Outcome
> **A single, authoritative, controlled production operating system where educational content moves deterministically through the canonical 15-step manufacturing lifecycle with clear human ownership, mandatory human-gated approvals, traceable state changes, coordinated multi-platform publishing, detailed audience retention analytics, and a closed intelligence loop that continuously refines future curriculum creation.**

---

## 3. System Boundary & Scope Definition

### 3.1 Inside System Scope (Internal to BP-CMS)
BP-CMS possesses authoritative ownership over the following internal subsystems and capabilities:
1. **Identity & Authentication:** User accounts, authentication credentials, cryptographic session lifecycle, and credential revocation.
2. **Roles & Capabilities (RBAC):** Granular capability assignments, server-authoritative authorization checks, and anti-self-approval enforcement (`GAR-02`).
3. **Curriculum & Syllabus Taxonomy:** Canonical competitive exam hierarchy (Class, Subject, Chapter, Topic, Subtopic, Cognitive Difficulty).
4. **Question Production:** Question ideation, bilingual authoring (Telugu/English), four-option structure, step-by-step mathematical proofs.
5. **Question Verification:** Formal 10-point pedagogical audit checklist, verification records, reviewer notes, and revision routing.
6. **Script Production:** Conversational audience adaptation, spoken word-count pacing, visual directives, and teleprompter script versioning.
7. **Teleprompter & Studio Coordination:** Pacing control, presentation cue display, and multi-take logging.
8. **Raw Video Registration:** Ingestion of camera take metadata (resolution, frame rate, container, duration, checksums, external storage URIs).
9. **Editing Bay Workflow Tracking:** Post-production assignment tracking, subtitle generation status, and master video cut registration.
10. **Final Quality Control (QC):** Broadcast technical compliance inspection, -14 LUFS audio loudness check, and pass/fail/rework recording.
11. **Thumbnail Packaging:** Asset registration, high-CTR variant tracking (Variants A/B/C), hook headline legibility, and aspect ratio validation.
12. **Social Review:** 9:16 vertical smartphone safe-zone simulator, packaging audit, and pinned comment verification.
13. **Publishing Setup:** Parameter validation, distribution channel scheduling, release staging packages.
14. **Publishing Records:** Historical log of live broadcast executions, operator stamps, and platform publication identifiers.
15. **Platform Synchronization:** Verification of live broadcast URLs, syndication status tracking, and error isolation.
16. **Analytics Ingestion:** Capture of multi-platform engagement metrics (views, watch time, likes, shares, APV) and retention drop-off curves.
17. **Performance Review:** Diagnostic analysis tools correlating drop-off timestamps with script sections and mathematical formulas.
18. **Pedagogical Intelligence Loop:** Synthesis of retention insights into structured syllabus topic directives seeding Step 01 batches.
19. **Workflow Orchestration Engine:** Enforcing sequential progression through the canonical 15 steps, rework pathways, and gate constraints.
20. **Media Metadata & Reference Store:** Canonical pointers, MIME types, resolutions, file sizes, and cryptographic checksums.
21. **Workload & Assignment Management:** Team task distribution, reviewer queues, and bottleneck monitoring.
22. **Operational Notifications:** In-app alerts, handoff signals, and approval requests.
23. **Forensic Audit Ledger:** Immutable, append-only audit trail capturing actor, action, entity, state delta, timestamp, and outcome.
24. **System Configuration:** Platform parameters, taxonomy definitions, and prompt template management.

### 3.2 Outside System Scope (External Systems & Boundaries)
The following systems are external to BP-CMS. BP-CMS interfaces with them via explicit boundary adapters, storing references, identifiers, and metadata, but does **NOT** own or re-implement their infrastructure:
1. **External Binary Media Storage:** Active storage (e.g., Google Drive) and archival cold storage (e.g., Google Cloud Storage). Large video/audio binary files remain strictly external to the application database.
2. **Social Video Distribution Platforms:** External networks (YouTube, Instagram, Facebook). Handled via external APIs or guided operator handoffs.
3. **Generative AI Model Providers:** External LLM APIs (e.g., Google Gemini, OpenAI, Claude). Utilized strictly as assistive client/server adapters.
4. **External Email / Notification Relays:** Third-party SMTP relays or messaging notification services.
5. **External Operating Systems & Hardware:** Studio camera hardware, physical audio mixers, editing workstation software (DaVinci Resolve, Premiere Pro).

---

## 4. Business Capability Requirements (BR-001 through BR-010)

```
================================================================================
                    BUSINESS CAPABILITY REQUIREMENTS MATRIX
================================================================================
  BR-001: Question Production        BR-006: Publishing
  BR-002: Script Production          BR-007: Platform Synchronization
  BR-003: Video Production           BR-008: Analytics
  BR-004: Thumbnail                  BR-009: Performance Review
  BR-005: Social Review              BR-010: Intelligence Loop
================================================================================
```

### BR-001 — Question Production
- **Objective:** Enable structured drafting, authoring, and AI-assisted generation of competitive exam questions.
- **Required Business Capability:** Support bilingual authoring (English & Telugu), mathematical proof generation, distractor rationale explanations, and curriculum tagging.
- **Required Inputs:** Syllabus taxonomy (Subject, Topic, Subtopic), difficulty tier (Easy, Medium, Hard), exam context (APPSC, TSPSC, SSC, RRB).
- **Expected Business Output:** Formatted question candidate with 4 distinct options, exactly 1 verified answer key, step-by-step solution proof, and distractor rationales.
- **Business Rules:**
  1. Every question must have exactly four multiple-choice options (A, B, C, D).
  2. Question generation produces unverified draft entities without allocating permanent production numbers.
  3. No question may proceed to script authoring without passing formal Stage 02 Academic Verification.
- **Human Approval Requirements:** Mandatory independent SME / Academic Verifier approval.
- **Failure / Revision Expectations:** Rejected questions route back to author with specific feedback notes or are discarded.
- **Auditability Expectations:** Capture creator, authoring timestamp, prompt/model metadata (if AI-assisted), and full revision history.

### BR-002 — Script Production
- **Objective:** Transform verified academic questions into engaging, conversational short-form video scripts.
- **Required Business Capability:** Generate and edit 60-second spoken presentation scripts with 3-second retention hooks, spoken explanations, and visual editor directives.
- **Required Inputs:** Verified question record (BR-001), target audience profile, target video duration (45–60 seconds).
- **Expected Business Output:** Approved spoken teleprompter script partitioned into Hook, Problem, Solution, Burra Trick, and CTA, with visual overlays and timing cues.
- **Business Rules:**
  1. Scripts must adhere to spoken cadence limits (word count calculated at ~130–150 words per minute).
  2. Script revisions must be versioned immutably.
- **Human Approval Requirements:** Mandatory sign-off by Script Lead or Presenter before studio scheduling.
- **Failure / Revision Expectations:** Presenter can request script adjustments for cadence or clarity before filming.
- **Auditability Expectations:** Record writer, version number, word count, estimated duration, and presenter sign-off.

### BR-003 — Video Production
- **Objective:** Coordinate studio filming, raw take logging, post-production video editing, and final technical quality control.
- **Required Business Capability:** Synchronized teleprompter display, multi-take metadata logging, raw video registration, post-production assembly tracking, and broadcast QC certification.
- **Required Inputs:** Approved script (BR-002), studio camera raw footage, editor graphics package.
- **Expected Business Output:** Broadcast-ready master MP4 video cut meeting 9:16 mobile format and -14 LUFS audio loudness standards.
- **Business Rules:**
  1. Raw camera takes must be registered with duration, resolution, frame rate, external storage URI, and SHA-256 checksum.
  2. Master render must pass Final QC (audio loudness, subtitle sync, video clarity) before proceeding to thumbnail and social packaging.
  3. Binary video files must NEVER be stored in the application database.
- **Human Approval Requirements:** Mandatory Final QC sign-off by an independent QC Officer.
- **Failure / Revision Expectations:** QC failure routes master cut back to editing bay with specific timestamped rework notes.
- **Auditability Expectations:** Log take selection, editor ID, master cut checksum, loudness level, and QC certification stamp.

### BR-004 — Thumbnail
- **Objective:** Manage visual packaging, cover artwork, and high-CTR thumbnail assets for mobile viewports.
- **Required Business Capability:** Creation, variant tracking (A/B testing), hook headline legibility verification, and asset association.
- **Required Inputs:** Parent question and video record, thumbnail graphic files (JPEG/PNG/WebP), curiosity hook text.
- **Expected Business Output:** Registered thumbnail package with high-contrast variants linked to the production project.
- **Business Rules:**
  1. Thumbnail graphics must be verified for high mobile contrast and 9:16 / 16:9 compliance.
  2. Hook text must not leak the correct answer key.
- **Human Approval Requirements:** Creative Lead or Social Media Manager visual approval.
- **Failure / Revision Expectations:** Low-contrast or illegible thumbnails rejected with redesign guidance.
- **Auditability Expectations:** Track designer ID, variant identifiers, image resolution, external storage URI, and approval timestamp.

### BR-005 — Social Review
- **Objective:** Provide a holistic editorial review of the combined mobile social broadcast package before release.
- **Required Business Capability:** Interactive 9:16 smartphone simulator previewing video cut, thumbnail, title, description, hashtags, and Telugu pinned comment with safe-zone overlays.
- **Required Inputs:** Master video cut (BR-003), approved thumbnail (BR-004), platform copy, Telugu pinned comment.
- **Expected Business Output:** Formally certified social packaging release package approved for distribution.
- **Business Rules:**
  1. No video may proceed to publishing without passing the 9:16 safe-zone review.
  2. Pinned comment must contain the full academic explanation and call-to-action.
- **Human Approval Requirements:** Mandatory human sign-off by Social Media Manager or Lead Publisher.
- **Failure / Revision Expectations:** Flawed framing or copy issues returned to packaging team for immediate remediation.
- **Auditability Expectations:** Record reviewer ID, simulator approval stamp, copy revisions, and approval remarks.

### BR-006 — Publishing
- **Objective:** Govern the scheduling and live release dispatch of broadcast packages across distribution channels.
- **Required Business Capability:** Staging multi-platform parameters, release time scheduling, automated or guided live dispatch, and duplicate upload prevention.
- **Required Inputs:** Certified social package (BR-005), channel configuration, target release timestamp.
- **Expected Business Output:** Dispatched live broadcast record with platform-specific content identifiers and live URLs.
- **Business Rules:**
  1. Strict idempotency and duplicate-prevention controls must prevent accidental double-publishing of any asset.
  2. Every publication must generate an immutable broadcast record capturing operator, timestamp, and platform response codes.
- **Human Approval Requirements:** Publishing Operator authorization for live dispatch.
- **Failure / Revision Expectations:** Failed dispatches trigger immediate operator alert without corrupting internal asset status.
- **Auditability Expectations:** Record publisher ID, dispatch timestamp, target channels, platform video IDs, and API response logs.

### BR-007 — Platform Synchronization
- **Objective:** Continuously verify that dispatched content achieves and maintains consistent public availability across external platforms.
- **Required Business Capability:** Automated and operator-guided verification of live broadcast URLs (HTTP 200, valid playback) and cross-platform status parity.
- **Required Inputs:** Live publication records (BR-006), external video URLs, platform status APIs.
- **Expected Business Output:** Verified synchronization ledger certifying live status across YouTube, Instagram, and Facebook.
- **Business Rules:**
  1. External platform API outages or network timeouts must be isolated; they must never corrupt internal CMS state.
  2. Transient synchronization errors must support structured retry workflows.
- **Human Approval Requirements:** Operator review required if automated sync verification encounters repeated failures.
- **Failure / Revision Expectations:** Broken public links flagged for immediate channel manager intervention.
- **Auditability Expectations:** Log sync check timestamps, HTTP response codes, latency, and recovery actions.

### BR-008 — Analytics
- **Objective:** Ingest, structure, and permanently store multi-platform audience engagement telemetry.
- **Required Business Capability:** Ingesting view counts, watch time, likes, shares, comments, APV (average percentage viewed), and second-by-second audience retention curves at 24h, 7d, and 30d milestones.
- **Required Inputs:** Verified broadcast records (BR-007), platform analytics telemetry.
- **Expected Business Output:** Structured analytical snapshots permanently linked to the parent content aggregate root.
- **Business Rules:**
  1. Analytics data ingestion must never mutate the upstream video or question business status.
  2. Telemetry snapshots must be timestamped and immutable.
- **Human Approval Requirements:** Automated ingestion; manual override by Analytics Specialist permitted for audited corrections.
- **Failure / Revision Expectations:** Ingestion failures trigger backoff retry without loss of historical milestone tracking.
- **Auditability Expectations:** Log ingestion source, payload volume, processing duration, and milestone timestamps.

### BR-009 — Performance Review
- **Objective:** Provide diagnostic evaluation tools correlating retention drop-off curves with pedagogical content elements.
- **Required Business Capability:** Interactive diagnostic review cross-referencing viewer drop-off points with script timestamps, formula presentations, or presenter pacing.
- **Required Inputs:** Ingested analytics and retention curves (BR-008), video script (BR-002), student comment themes.
- **Expected Business Output:** Diagnostic assessment findings recording whether viewer drop-offs stemmed from confusing math, audio issues, or hook failure.
- **Business Rules:**
  1. Performance reviews provide diagnostic analysis and do not alter the published broadcast asset.
  2. Diagnostic findings must be recorded by human strategists or educators.
- **Human Approval Requirements:** Content Strategy Lead or Educator review sign-off.
- **Failure / Revision Expectations:** Inconclusive telemetry flagged for extended observation window.
- **Auditability Expectations:** Record reviewer ID, diagnostic categorization, identified confusion timestamps, and review notes.

### BR-010 — Intelligence Loop
- **Objective:** Close the operational production loop by converting performance insights into actionable curriculum directives.
- **Required Business Capability:** Synthesizing student misconception patterns into structured topic recommendations, distractor improvements, and priority sprint batches seeding Step 01.
- **Required Inputs:** Diagnostic review findings (BR-009), aggregated retention trends across topics, syllabus coverage metrics.
- **Expected Business Output:** Approved pedagogical sprint directive specifying topics, difficulty distributions, and hook patterns for new question authoring.
- **Business Rules:**
  1. AI may generate candidate topic directives and recommendations, but human content strategists must explicitly review and approve them before new batches are initiated.
  2. Approved directives feed directly into Step 01 Question Generation to guide future authoring cycles.
- **Human Approval Requirements:** Mandatory human approval by Content Strategy Lead.
- **Failure / Revision Expectations:** Unapproved recommendations archived without initiating production batches.
- **Auditability Expectations:** Log recommendation provenance, human modification diff, approval stamp, and child question batch links.

---

## 5. Canonical 15-Step Business Workflow

BP-CMS is structured around a single, immutable, sequential 15-step business workflow. No alternative or competing workflows are permitted:

```
================================================================================
                    THE CANONICAL 15-STEP CONTENT PIPELINE
================================================================================

  01. Question Generation      - Drafting, translating, proofs, distractor rationales
  02. Question Verification    - Independent academic & syllabus audit [HUMAN GATE]
  03. Audience Script          - Spoken teleprompter script & visual directive authoring
  04. Teleprompter & Filming   - Studio recording, teleprompter pacing & take logging
  05. Raw Video                - Registration of camera raw footage & storage pointers
  06. Editing Bay              - Video assembly, bilingual captions & master MP4 render
  07. Final QC                 - Technical quality & -14 LUFS loudness check [HUMAN GATE]
  08. Thumbnail                - High-CTR mobile cover artwork & variant association
  09. Social Review            - 9:16 smartphone simulator & packaging audit [HUMAN GATE]
  10. Publishing Setup         - Multi-platform scheduling & destination config [HUMAN GATE]
  11. Published                - Live broadcast execution & publication record creation
  12. Platform Sync            - Cross-platform availability check & URL verification
  13. Analytics                - Audience retention telemetry & metric ingestion
  14. Performance Review       - Diagnostic assessment of viewer retention & drop-offs
  15. Intelligence Loop        - Synthesis of curriculum feedback seeding Step 01 batches

================================================================================
```

---

## 6. The State Separation Requirement (State Axiom)

It is an explicit, mandatory architectural requirement that the five fundamental state dimensions must remain strictly separated across all models, workflows, contracts, and code:

```
================================================================================
                         THE BP-CMS STATE AXIOM
================================================================================

   BUSINESS WORKFLOW STAGE
   ≠ ENTITY STATUS
   ≠ MEDIA STATUS
   ≠ JOB STATUS
   ≠ PUBLICATION STATUS

================================================================================
```

1. **Business Workflow Stage (Where in the pipeline):** Represents the operational stage in the 15-step lifecycle (e.g., `01_QUESTION_GENERATION`, `02_QUESTION_VERIFICATION`, ..., `15_INTELLIGENCE_LOOP`).
2. **Entity Status (What is its lifecycle condition):** Represents the approval/validity state of the primary domain aggregate (e.g., `DRAFT`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `ARCHIVED`).
3. **Media Status (What is the binary state):** Represents the physical storage and processing state of associated media binaries (e.g., `NOT_RECORDED`, `TAKE_UPLOADED`, `MASTER_RENDERED`, `STORAGE_VERIFIED`, `STORAGE_ERROR`).
4. **Job Status (What is the async execution state):** Represents the runtime state of asynchronous background tasks (e.g., `IDLE`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).
5. **Publication Status (What is the public availability state):** Represents the broadcast state across external social networks (e.g., `UNPUBLISHED`, `SCHEDULED`, `DISPATCHING`, `LIVE`, `SYNCED`, `FAILED`).

*Note: The exact technical mechanism implementing this separation belongs to Stage 08 (State Model).*

---

## 7. Human-Gated Business Control (AI Assistive Boundary)

In accordance with core governance principle `AP-009`, Artificial Intelligence within BP-CMS is strictly **assistive**:
- **Permitted AI Activities:**
  - Generating candidate question stems, options, proofs, and draft Telugu translations.
  - Suggesting spoken script cadences, retention hooks, and visual timing directives.
  - Checking candidate questions for duplicate phrasing, ambiguity, or syllabus misalignment.
  - Generating candidate thumbnail concepts and curiosity hook headlines.
  - Analyzing viewer comments to summarize common student misconception themes.
  - Synthesizing audience drop-off curves into recommended curriculum priorities.
- **Strictly Prohibited AI Actions (Negative Constraints):**
  - AI must **NEVER** independently approve an academic verification gate (Stage 02).
  - AI must **NEVER** independently certify a technical QC broadcast gate (Stage 07).
  - AI must **NEVER** independently approve social packaging or safe-zones (Stage 09).
  - AI must **NEVER** independently authorize live broadcast dispatch (Stage 10/11).
  - AI must **NEVER** independently approve diagnostic performance conclusions (Stage 14).
  - AI must **NEVER** autonomously mutate protected business workflow state without explicit human operator confirmation.

---

## 8. Media Architecture Boundary Requirement

The relationship between BP-CMS and digital media assets is governed by a strict boundary requirement:
- **BP-CMS Owns Metadata & References:**
  - Media identifier and parent entity linkage.
  - External storage locator (canonical URI / URL).
  - File technical metadata (filename, container format, MIME type, file size, video resolution, frame rate, audio sample rate, duration).
  - Cryptographic integrity verification (SHA-256 checksums).
  - Lifecycle state (raw take, master cut, thumbnail variant, archive tier).
- **External Storage Owns Physical Binaries:**
  - Physical byte storage, streaming delivery, replication, and physical retention live entirely in external storage (Google Drive / Google Cloud Storage).
- **Prohibition:**
  - **Large video, audio, or high-resolution image binary files must NEVER be stored inside the primary business database.**
- **Fault Isolation:**
  - Transient external storage outages or network timeouts must never corrupt internal CMS metadata or leave domain aggregates in an indeterminate state.

---

## 9. Non-Functional Requirements (NFR-001 through NFR-008)

### NFR-001 — Reliability
- **Zero Silent Data Loss:** Approved curriculum questions, verified scripts, and live broadcast records must never be lost.
- **Safe Failures:** External API errors, network timeouts, or power interruptions must fail safely without creating orphaned or corrupted records.
- **Controlled State Transitions:** All workflow transitions must be atomic, validated, and state-machine enforced.
- **External Recovery:** The system must gracefully handle transient outages in external services (Drive, YouTube, Gemini) with idempotent retry pathways.
- **Concurrency Protection:** Optimistic locking and version checking must prevent concurrent edit conflicts and race conditions.

### NFR-002 — Performance
- **Responsive UI:** Core operational UI interactions, navigation transitions, and form submissions must render within responsive, sub-second bounds under standard workloads.
- **Responsive APIs:** Standard CRUD and query API endpoints must maintain consistent low-latency responses.
- **Asynchronous Long-Running Tasks:** File uploads, video exports, AI prompt orchestrations, and analytics harvests must execute asynchronously without freezing operator user interfaces.
- **Controlled External Usage:** External API requests must be rate-limited, batched, and deduplicated to protect external quotas.

### NFR-003 — Security
- **Authentication:** All protected routes, operational tools, and data mutations require verified, authenticated user sessions.
- **Server-Side Authorization:** All business gates, approvals, and mutations must be authorized by server-side logic; frontend UI checks are strictly decorative.
- **Least Privilege:** Users must possess discrete capabilities matching their assigned operational role responsibilities.
- **Secret Protection:** Zero storage of external API keys, service account credentials, or OAuth secrets in client-side bundles or public source code.
- **Protected Business Operations:** Critical state changes (Academic Approval, QC Pass, Broadcast Dispatch) require verified actor identity and permission checks.

### NFR-004 — Scalability
- **Volume Scaling:** Architecture must accommodate growth from initial single-question sprints to hundreds of concurrent production projects in flight across all 15 stages.
- **Historical Scaling:** Data models must support accumulating thousands of curriculum questions, video takes, and historical analytics over multi-year operational lifecycles without performance degradation.
- **Media Scaling:** Media metadata architecture must cleanly index and reference expanding external video storage archives.

### NFR-005 — Maintainability
- **Modular Architecture:** Clean separation of concerns across UI Presentation, Application Use Cases, Domain State, and Data/Storage Adapters.
- **Zero Dead Code:** Systematic elimination of orphaned components, obsolete mock layers, unused imports, and duplicate route definitions.
- **Testable Capabilities:** All domain capabilities, validation engines, and workflow gates must be designed with clean, testable interfaces.

### NFR-006 — Cost (COST-001 Hard Constraint)
- **Initial Infrastructure Investment Target: ₹0 – ₹100.**
- The system must maximize existing free-tier allowances, serverless container runtimes, and developer quotas.
- No paid infrastructure components (commercial databases, paid message queues, enterprise SaaS) may be introduced without formal Product Owner approval and cost justification.

### NFR-007 — Availability & Fault Tolerance
- **Continued Internal Operations:** Studio filming, question drafting, teleprompter usage, and video editing bays must remain operational even if external platforms (YouTube API, Instagram, Gemini) experience outages.
- **Graceful Degradation:** When an external integration fails, the system must degrade gracefully, alerting operators while keeping internal authoring workflows alive.

### NFR-008 — Auditability
- **Immutable Audit Trail:** Every business-critical mutation, approval, rejection, override, and publishing dispatch must be permanently recorded in an append-only audit trail.
- **Required Audit Attributes:** Every record must capture:
  1. `actor`: User ID and canonical role.
  2. `action`: Capability or operation executed.
  3. `entity`: Resource type and unique identifier.
  4. `previous_state`: Pre-mutation state.
  5. `new_state`: Post-mutation state.
  6. `timestamp`: ISO 8601 UTC timestamp.
  7. `outcome`: Success, failure, or validation rejection.
  8. `reason_remarks`: Human notes, justification, or error message.

---

## 10. Brownfield Constraints & Modernization Rules

BP-CMS is an active production-grade system. Modernization must respect nine inviolable brownfield constraints:
1. **Preserve Existing Production Functionality:** Working question authoring, studio queues, editing trackers, LaTeX math rendering, and publishing flows must remain operational throughout modernization.
2. **Protect Production Data:** Data housed in production spreadsheets, databases, and Google Drive folders must never be destroyed, overwritten, or corrupted.
3. **No Google Sheets Purging:** Production Google Sheets data tabs must never be dropped or cleared.
4. **No Google Drive Deletion:** Video master cuts, raw takes, and thumbnail assets stored in Google Drive must not be deleted.
5. **Preserve Historical Audit Evidence:** Prior audit reports, verification ledgers, and forensic baselines must remain intact as immutable project evidence.
6. **Incremental Modernization:** Upgrades must be delivered in controlled, verifiable increments.
7. **No Big-Bang Rewrite:** Modernization must proceed through safe, staged transitions rather than replacing the application wholesale.
8. **Classify Before Retirement:** Legacy code, routes, or mock layers must be explicitly classified and evaluated before decommissioning.
9. **Controlled Modernization Lifecycle:**
```text
   CLASSIFY  →  CONSOLIDATE  →  MIGRATE  →  VERIFY  →  RETIRE
```

---

## 11. Explicit Non-Requirements & Deferred Technical Decisions

To maintain strict SDLC boundaries, Stage 01 explicitly defers the following technical decisions to later architecture and design stages:
1. **Database Engine Selection:** Deferring whether Google Sheets, PostgreSQL, Cloud SQL, SQLite, Firestore, or a hybrid persistence layer will be chosen (deferred to Stage 12).
2. **Database Schemas:** Deferring physical table definitions, columns, and indexes (deferred to Stage 13).
3. **Workflow Engine Implementation:** Deferring specific code mechanics, state-machine libraries, or custom transition engines (deferred to Stage 08 & Stage 14).
4. **REST / RPC API Contracts:** Deferring URL endpoints, JSON payload schemas, and HTTP status code mappings (deferred to Stage 15).
5. **Frontend Framework & Component Details:** Deferring specific UI component libraries, widget architectures, or styling systems (deferred to Stage 10).
6. **Deployment Topology:** Deferring container configurations, Dockerfiles, Cloud Run resource allocations, or CI/CD pipelines (deferred to Stage 29).
7. **Background Queue Technology:** Deferring Redis, BullMQ, Cloud Tasks, or in-memory job queues (deferred to Stage 17).
8. **Realtime Protocol Details:** Deferring WebSockets vs Server-Sent Events vs polling (deferred to Stage 16).
9. **Granular RBAC Code Syntax:** Deferring specific TypeScript code types or middleware syntax (deferred to Stage 09).
10. **Archive Storage Vendor:** Deferring long-term cold archive provider selections (deferred to Stage 14).
11. **CSS Framework Versioning:** Deferring specific utility class structures or build plugins (deferred to Stage 10).
12. **Analytics Aggregation Mechanics:** Deferring specific calculation algorithms or visualization chart engines (deferred to Stage 20).
13. **Cache Storage Engine:** Deferring in-memory vs Redis vs local storage caching solutions (deferred to Stage 16).
14. **Error Tracking Vendor:** Deferring specific monitoring SDKs (Sentry, Cloud Logging) (deferred to Stage 21).

---

## 12. Requirement Traceability Matrix

Every requirement established in Stage 01 maps to downstream 30-stage SDLC architecture, implementation, and verification stages:

| Requirement ID | Business Area | Downstream SDLC Stage | Verification Method |
| :--- | :--- | :--- | :--- |
| **BR-001** | Question Production | Stage 06 (Domain Model), Stage 19 (Question Implementation) | Automated Question Contract & Validation Tests |
| **BR-002** | Script Production | Stage 06 (Domain Model), Stage 20 (Script Implementation) | Script Cadence & Pacing Contract Tests |
| **BR-003** | Video Production | Stage 06 (Domain Model), Stage 21 (Video Pipeline Impl) | Video Take & QC Gate Integration Tests |
| **BR-004** | Thumbnail Packaging | Stage 06 (Domain Model), Stage 22 (Asset Packaging Impl) | Thumbnail Aspect & Legibility Tests |
| **BR-005** | Social Review | Stage 07 (Workflow), Stage 22 (Asset Packaging Impl) | 9:16 Simulator Safe-Zone UI & Review Tests |
| **BR-006** | Publishing Dispatch | Stage 07 (Workflow), Stage 23 (Publishing Impl) | Live Dispatch Idempotency & Duplicate Tests |
| **BR-007** | Platform Synchronization | Stage 07 (Workflow), Stage 24 (Sync Implementation) | URL Verification & Retry Workflow Tests |
| **BR-008** | Analytics Ingestion | Stage 06 (Domain Model), Stage 25 (Analytics Impl) | Retention Curve Ingestion & Association Tests |
| **BR-009** | Performance Review | Stage 07 (Workflow), Stage 25 (Analytics Impl) | Drop-off Correlation & Diagnostic UI Tests |
| **BR-010** | Intelligence Loop | Stage 07 (Workflow), Stage 26 (Intelligence Impl) | Closed-Loop Recommendation Seeding Tests |
| **NFR-001** | Reliability | Stage 08 (State Model), Stage 14 (Workflow Engine) | Concurrency & Atomic State Transition Tests |
| **NFR-002** | Performance | Stage 10 (Frontend IA), Stage 13 (API), Stage 29 | Latency Benchmarks & Async Processing Tests |
| **NFR-003** | Security | Stage 09 (RBAC), Stage 15 (Auth Implementation) | Server-Side Authorization & Zero-Trust Tests |
| **NFR-004** | Scalability | Stage 12 (Database Decision), Stage 16 (DB Impl) | Volume Stress Tests & Multi-Year Query Tests |
| **NFR-005** | Maintainability | Stage 04 (Principles), Stage 13 (Data Contracts) | Static Architecture Analysis & Linting |
| **NFR-006** | Cost (₹0–₹100) | Stage 04 (Principles), Stage 12 (DB Decision) | Infrastructure Cost Audit & Bill Review |
| **NFR-007** | Availability | Stage 05 (System Boundary), Stage 28 (E2E Verif) | External Provider Failure Isolation Tests |
| **NFR-008** | Auditability | Stage 09 (RBAC), Stage 27 (Audit Implementation) | Immutable Audit Ledger Append Verification |
| **COST-001** | Cost Governance | Stage 04 (Principles), Stage 22 (Cost Architecture) | Financial Resource Expenditure Audit |
| **BF-001** | Brownfield Protection | Stage 03 (Baseline), Stage 23 (Migration Architecture) | Non-Regression & Data Preservation Tests |

---

## 13. Stage 01 Acceptance Criteria Verification

Stage 01 compliance is evaluated against 15 objective acceptance criteria:

| Criteria ID | Acceptance Criteria Specification | Verification Result | Evidence in Document |
| :--- | :--- | :---: | :--- |
| **AC-01** | **Product Purpose Defined:** Authoritative definition of what BP-CMS is and what it is not. | **PASS** | Section 2.1 |
| **AC-02** | **Users Defined:** Comprehensive operational user categories (17 roles) documented from product context. | **PASS** | Section 2.2 |
| **AC-03** | **Problem Definition Complete:** 10 core operational challenges in competitive exam production detailed. | **PASS** | Section 2.3 |
| **AC-04** | **Internal Scope Defined:** 24 authoritative internal subsystems and capabilities documented. | **PASS** | Section 3.1 |
| **AC-05** | **External Boundaries Defined:** 5 external systems (Drive, YouTube, Social, AI, Relays) demarcated. | **PASS** | Section 3.2 |
| **AC-06** | **All 10 Business Capabilities Defined:** BR-001 through BR-010 detailed with 8 required sub-dimensions. | **PASS** | Section 4 |
| **AC-07** | **Canonical 15-Step Workflow Defined:** Exactly 15 sequential steps recorded without modification. | **PASS** | Section 5 |
| **AC-08** | **State Separation Defined:** Mandatory separation of the 5 state dimensions formalized. | **PASS** | Section 6 |
| **AC-09** | **NFRs Defined:** NFR-001 through NFR-008 detailed with concrete, testable criteria. | **PASS** | Section 9 |
| **AC-10** | **₹0–₹100 Cost Constraint Defined:** Hard financial constraint (COST-001) recorded. | **PASS** | Section 9 (NFR-006) & Section 10 |
| **AC-11** | **AI Human-Gating Defined:** Permitted and strictly prohibited AI behaviors formalized (`AP-009`). | **PASS** | Section 7 |
| **AC-12** | **Media Boundary Defined:** Internal metadata/references separated from external binary storage. | **PASS** | Section 8 |
| **AC-13** | **Brownfield Constraints Defined:** 9 brownfield protection rules and 5-stage migration lifecycle set. | **PASS** | Section 10 |
| **AC-14** | **Deferred Decisions Explicitly Identified:** 14 specific technical implementation choices deferred. | **PASS** | Section 11 |
| **AC-15** | **Requirement Traceability Defined:** Complete matrix mapping requirements to stages and tests. | **PASS** | Section 12 |

---

## 14. Document Governance & Stage Sign-Off

```
================================================================================
BP-CMS 30-STAGE SDLC — STAGE 01 VERIFICATION RECORD
================================================================================
Stage:               01 — REQUIREMENTS BASELINE
Document:            docs/requirements/01-REQUIREMENTS-BASELINE.md
Status:              ACCEPTED — COMPLETE — CLOSED
Governance Standard: BP-CMS Operational Rules & 30-Stage Master Plan
Source Code Changed: NONE (Documentation Baseline Only)
Database Changed:    NONE
Infrastructure:      NONE
Verification Verdict: PASS (15 of 15 Acceptance Criteria Satisfied)
Next Stage:          STAGE 02 — BUSINESS ACCEPTANCE CRITERIA
================================================================================
```
