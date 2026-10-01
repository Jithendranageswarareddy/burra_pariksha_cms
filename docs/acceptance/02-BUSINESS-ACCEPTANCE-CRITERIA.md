# Burra Pariksha CMS
# 02 — Business Acceptance Criteria

Stage: 02 — Business Acceptance Criteria

Status:
DRAFT

Implementation Status:
BUSINESS ACCEPTANCE CRITERIA DOCUMENT CREATED

Approval:
PENDING PRODUCT OWNER ACCEPTANCE

Version:
1.0.0

---

## 01. Document Control

| Attribute | Specification |
| :--- | :--- |
| **Document Name** | BP-CMS Stage 02 Business Acceptance Criteria |
| **File Path** | `docs/acceptance/02-BUSINESS-ACCEPTANCE-CRITERIA.md` |
| **Stage** | 02 — Business Acceptance Criteria |
| **Status** | **DRAFT** |
| **Version** | `1.0.0` |
| **Acceptance Status** | **PENDING PRODUCT OWNER ACCEPTANCE** |
| **Implementation Status** | **BUSINESS ACCEPTANCE CRITERIA DOCUMENT CREATED** |
| **Scope Boundary** | Business Acceptance Criteria & Observable Verification Proofs (HOW we prove WHAT was defined in Stage 01). |
| **Owner** | Burra Pariksha Product Owner & QA / Engineering Governance |
| **Last Updated** | 2026-10-01 |
| **Implementation Restriction** | Documentation / Governance Artifact Only. Zero application code, schema, API, or infrastructure modification permitted during Stage 02. |
| **Next Stage** | **STAGE 03 — TARGET ARCHITECTURE SPECIFICATION** *(Pending Product Owner Acceptance of Stage 02)* |

### Provenance & Governance Authority
- **Authoritative Requirements Baseline:** `docs/requirements/01-REQUIREMENTS-BASELINE.md` (Stage 01, Version 1.0.0, Accepted).
- **Approved Planning Specification:** Stage 02 Planning Specification (25-Section Behavioral Blueprint).
- **Predecessor Reference:** `01-product-truth.md` (Historical discovery audit artifact).
- **Binding Rule:** This document formalizes the observable, testable, business criteria necessary to accept BP-CMS. It does not select technologies, design schemas, or implement application features.

---

## 02. Purpose

The purpose of this document is to establish the definitive, measurable, and observable **Business Acceptance Criteria** for the Burra Pariksha Content Management System (BP-CMS).

Stage 01 defined **WHAT** BP-CMS must become.  
Stage 02 converts that baseline into:

> **"HOW WE WILL PROVE THE BUSINESS REQUIREMENT IS ACCEPTED"**

This document serves as the contract between:
- **Product Owner & Channel Leadership:** To verify that editorial, educational, and operational needs are met.
- **Content, Production & Studio Teams:** To confirm that day-to-day workflow surfaces operate without friction.
- **Quality Assurance & Verification Teams:** To provide unambiguous, reproducible test scenarios.
- **Architects & Developers:** To define the behavioral acceptance boundaries that subsequent technical designs (Stage 03+) must fulfill.

---

## 03. Relationship to Stage 01

This specification is directly derived from `docs/requirements/01-REQUIREMENTS-BASELINE.md`:
1. **Zero Scope Creep:** No new functional domains are introduced outside the Stage 01 baseline.
2. **Zero Requirement Weakening:** No Stage 01 requirement is omitted, relaxed, or diluted.
3. **Traceability:** Every business requirement (`BR-xxx`), non-functional requirement (`NFR-xxx`), and cost constraint (`COST-001`) is mapped to one or more observable criteria (`AC2-xxx`).
4. **Decoupled Architecture:** Technical implementation decisions (PostgreSQL vs Firestore, Redis vs Cloud Tasks, WebSockets vs SSE) remain strictly deferred to Stage 03.

---

## 04. Acceptance Philosophy

BP-CMS acceptance is governed by four core principles:

1. **Observable Behavior Over Internal Code:** Acceptance is determined by what users, testers, and external systems observe at interface boundaries, not by internal code structure.
2. **Deterministic Quality Gates:** Progression through the 15-stage pipeline requires meeting explicit, verifiable criteria. No stage may be bypassed through client tampering or informal assumptions.
3. **Structured Scenario Formulation:** Criteria are specified using the **GIVEN / WHEN / THEN** behavioral format:
   - **GIVEN:** Preconditions, system state, and authenticated actor role.
   - **WHEN:** The specific user or automated action triggered.
   - **THEN:** The observable, measurable outcome and state change.
   - **NEGATIVE:** Conditions that must be explicitly rejected.
4. **Anti-Regression & Audit Enforcement:** Every acceptance verification must confirm that existing functionality is preserved and an immutable audit trail is recorded.

---

## 05. Business Actors & Functional Roles

Acceptance criteria are evaluated against the following functional roles:

| Functional Role | Operational Domain | Key Acceptance Boundaries |
| :--- | :--- | :--- |
| **Administrator** | System governance, user provisioning | Global overrides, user management, audit inspection. |
| **Question Creator** | Step 01 (Question Generation) | Authoring, bilingual text, options, initial submission. |
| **Academic Reviewer** | Step 02 (Question Verification) | Mathematical proof check, syllabus check, anti-self-approval. |
| **Script Writer** | Step 03 (Audience Script) | Spoken formatting, pacing, teleprompter cues. |
| **Studio Presenter** | Step 04 (Teleprompter & Filming) | Teleprompter speed control, take logging. |
| **Video Editor** | Step 06 (Editing Bay) | Cut assembly, bilingual captions, audio mastering. |
| **QC Officer** | Step 07 (Final QC) | Broadcast standards, -14 LUFS loudness, sync checks. |
| **Thumbnail Designer**| Step 08 (Thumbnail) | Graphic upload, dimension checks, A/B variants. |
| **Social Manager** | Step 09 & 10 (Social Review / Setup)| Full package inspection, copy limits, scheduling. |
| **Publishing Lead** | Step 11 & 12 (Publishing / Sync) | Live release confirmation, URL checks, pinned comments. |
| **Analytics Specialist**| Step 13 & 14 (Analytics / Review) | Telemetry ingestion, drop-off curve diagnosis. |
| **Editorial Director**| Step 15 (Intelligence Loop) | Closed-loop directives, curriculum recalibration. |

> *Note:* The technical mapping of roles to permission matrices and security tokens is an engineering contract deliverable for Stage 03/07.

---

## 06. Global Acceptance Rules

The following invariants apply across all 15 stages of BP-CMS:

- **GAR-01 (Single Authoritative State):** Every content item exists in exactly one canonical business stage at any given moment. Dual or conflicting states across tables are prohibited.
- **GAR-02 (Anti-Self-Approval):** An actor who authors an artifact (question, script, video edit) cannot be the sole approver of that artifact in an upstream verification gate.
- **GAR-03 (Rejection Actionability):** Every rejection or revision request must mandate structured feedback explaining the deficiency before the action can complete.
- **GAR-04 (Zero Silent Overwrites):** Simultaneous updates to the same entity by multiple users must detect the conflict and prevent the second submission from silently destroying prior work.
- **GAR-05 (Server-Side Authorization):** All access rules must be evaluated and enforced by the server; disabling a button in the UI is not sufficient proof of security.
- **GAR-06 (Mandatory Audit Trails):** Every stage transition, approval, rejection, and privileged override must record an immutable audit entry.

### Negative Acceptance Gates (What BP-CMS Must NOT Allow)

| Negative Gate ID | Prohibited Action | Expected Observable Behavior |
| :--- | :--- | :--- |
| **NEG-01** | **Self-Approval in Verification** | Author of a question attempts to verify their own question in Step 02 ➔ Action blocked with explicit error: *"Self-approval prohibited"*. Verification button disabled. |
| **NEG-02** | **Illegal Stage Skipping** | User attempts to transition an unverified question directly to Step 06 (Editing) or Step 10 (Publishing) ➔ Server rejects mutation with HTTP 400/403. Item remains at valid current stage. |
| **NEG-03** | **Uncertified QC Publishing** | User attempts to schedule video for publishing without a signed Step 07 QC Certificate ➔ Publishing Setup interface displays blocking banner: *"QC Certification Required"*. Publish toggle disabled. |
| **NEG-04** | **Duplicate Publishing Trigger** | User double-clicks "Publish Now" or sends concurrent publish requests ➔ System enforces idempotency; exactly one remote publishing job is executed; subsequent requests return cached or active job status. |
| **NEG-05** | **Silent Overwrite (Lost Updates)** | Two users open the same script simultaneously; User B saves after User A ➔ User B's save is rejected with concurrency conflict notice: *"Record modified by another user; please refresh and review changes"*. User A's data preserved. |
| **NEG-06** | **AI Autonomous State Mutation** | AI service completes question generation or script drafting ➔ System stores output as uncommitted draft; AI CANNOT transition workflow state or approve content. Requires explicit human review and save. |
| **NEG-07** | **Direct Binary Media in DB** | Upload endpoint receives video file ➔ Database rejects storing binary blob; media service streams file to external storage, storing only metadata and URL reference in application records. |
| **NEG-08** | **Unauthenticated Route Access** | Unauthenticated request accesses `/api/admin/*`, `/api/questions/*`, or pipeline pages ➔ Immediate redirect to login (UI) or HTTP 401 Unauthorized (API). |
| **NEG-09** | **Unapproved Paid Infrastructure** | System or deployment attempts to provision paid cloud resources without written Product Owner sign-off ➔ Build/deployment gate rejects configuration; enforces COST-001 (₹0–₹100 limit). |
| **NEG-10** | **Audit Trail Bypass** | State mutation attempted without capturing actor ID and timestamp ➔ Mutation fails database/service transaction; zero un-audited state transitions permitted. |

---

## 07. Canonical 15-Step Workflow Acceptance Criteria

BP-CMS executes exclusively across 15 canonical business stages. Each stage is governed by a 10-point behavioral acceptance specification:

```
[01 — Question Generation]
           ↓
[02 — Question Verification]
           ↓
[03 — Audience Script]
           ↓
[04 — Teleprompter & Filming]
           ↓
[05 — Raw Video]
           ↓
[06 — Editing Bay]
           ↓
[07 — Final QC]
           ↓
[08 — Thumbnail]
           ↓
[09 — Social Review]
           ↓
[10 — Publishing Setup]
           ↓
[11 — Published]
           ↓
[12 — Platform Sync]
           ↓
[13 — Analytics]
           ↓
[14 — Performance Review]
           ↓
[15 — Intelligence Loop]
           ↓
(Directives Feed Back to 01 — Question Generation)
```

---

### STEP 01 — Question Generation

- **AC2-101 (Question Formulation & Drafting):**
  - **GIVEN:** An authenticated Question Creator on the Question Studio interface.
  - **WHEN:** The creator submits a question with exam category, topic, difficulty (1–5), bilingual stems (English and Telugu), exactly 4 distinct options, single designated correct key, step-by-step solution proof, and distractor rationales.
  - **THEN:** The system validates all fields, generates a unique Draft ID, transitions status to `PENDING_VERIFICATION`, and adds the item to the Step 02 queue.
  - **NEGATIVE:** If any option is empty, if fewer than 4 options exist, or if no correct key is selected, submission is blocked with inline validation errors.
  - **Verification Method:** UI Observation & API Contract Test.

---

### STEP 02 — Question Verification

- **AC2-102 (Academic Verification Gate):**
  - **GIVEN:** An authenticated Academic Reviewer inspecting an item in `PENDING_VERIFICATION`.
  - **WHEN:** The reviewer completes the verification checklist (Calculations Checked, Syllabus Mapped, No Linguistic Ambiguity, Mutually Exclusive Options) and clicks `APPROVE`.
  - **THEN:** The system assigns a canonical Question ID (`BP-Q-*`), stamps the verification signature, transitions status to `VERIFIED`, and places the item in the Step 03 backlog.
  - **NEGATIVE (Anti-Self-Approval):** If the reviewer ID matches the question author ID, the `APPROVE` button is disabled, and API attempts return HTTP 403 Forbidden (*"Self-approval prohibited"*).
  - **NEGATIVE (Rejection):** If the reviewer clicks `REJECT` without entering feedback, the action is blocked. When feedback is provided, status transitions to `REVISION_REQUESTED` and returns to the author's workboard.
  - **Verification Method:** Security Test & Human Acceptance Test (HAT).

---

### STEP 03 — Audience Script

- **AC2-103 (Presentation Script Authoring):**
  - **GIVEN:** An authenticated Script Writer viewing a verified question (`BP-Q-*`).
  - **WHEN:** The writer creates a spoken script with verbal hook (first 3 seconds), spoken walkthrough, on-screen visual directives, and pronunciation cues.
  - **THEN:** The system calculates target speaking duration based on word count (130–150 wpm pacing benchmark), attaches the script to the Content Master, and marks the script ready for teleprompter staging.
  - **NEGATIVE:** If the spoken script is empty or missing visual cues, submission to the studio queue is blocked.
  - **Verification Method:** UI Observation & API Test.

---

### STEP 04 — Teleprompter & Filming

- **AC2-104 (Studio Recording & Teleprompter Execution):**
  - **GIVEN:** An authenticated Studio Presenter loading an approved script in the Teleprompter view.
  - **WHEN:** The teleprompter scrolls at the presenter's configured speed preset, takes are recorded, take notes are logged, and a primary take is designated.
  - **THEN:** The teleprompter maintains smooth rendering (60 FPS target), take counts increment monotonically, and the session is committed with status `FILMED`.
  - **NEGATIVE:** Presenter cannot mark filming complete without logging at least one take with valid duration.
  - **Verification Method:** UI Frame Rate Profiling & Workflow Test.

---

### STEP 05 — Raw Video

- **AC2-105 (Raw Footage Ingestion & Registration):**
  - **GIVEN:** Raw camera footage from a completed filming session.
  - **WHEN:** The operator registers the raw footage external storage reference (Google Drive ID/URL), filename, format (MP4/MOV), resolution, and SHA-256 checksum.
  - **THEN:** The system verifies the external reference is reachable, records metadata, links the raw asset to the Content Master, and advances status to `RAW_INGESTED`.
  - **NEGATIVE:** Direct upload of binary video blobs into the application database is rejected; invalid or broken external links are flagged immediately.
  - **Verification Method:** Integration Test & Data Integrity Test.

---

### STEP 06 — Editing Bay

- **AC2-106 (Post-Production & Master Assembly):**
  - **GIVEN:** An assigned Video Editor working on an item with `RAW_INGESTED` status.
  - **WHEN:** The editor cuts the footage, adds motion graphics, synchronizes bilingual subtitle tracks (VTT/SRT), renders the master cut, uploads it to external storage, and registers the master video cut.
  - **THEN:** The system validates the presence of the video reference and subtitle track, and transitions status to `PENDING_QC`.
  - **NEGATIVE:** Editor cannot submit for QC without specifying aspect ratio (9:16 or 16:9) and linking the master video cut.
  - **Verification Method:** UI Observation & Workflow Test.

---

### STEP 07 — Final QC

- **AC2-107 (Technical Quality Control Certification):**
  - **GIVEN:** An authenticated QC Officer reviewing a master video in `PENDING_QC`.
  - **WHEN:** The QC Officer verifies video quality, audio loudness compliance (-14 LUFS ± 1 LUFS), subtitle sync alignment (< 200ms delta), and academic accuracy against the verified question, then signs off.
  - **THEN:** The system issues a signed QC Certificate, advances status to `QC_APPROVED`, and unlocks downstream Thumbnail and Social Review stages.
  - **NEGATIVE:** If any mandatory checklist item fails, the QC Officer must select a rejection category (Audio, Visual, Sync, Academic) and provide timestamped notes; status routes back to Step 06 or Step 04.
  - **Verification Method:** Human Acceptance Test & Audio/Video Profiler.

---

### STEP 08 — Thumbnail

- **AC2-108 (Thumbnail Visual Packaging):**
  - **GIVEN:** An authenticated Thumbnail Designer assigned to a QC-approved item.
  - **WHEN:** The designer uploads the master thumbnail graphic (and optional B-variant for A/B testing).
  - **THEN:** The system validates image dimensions (1280x720 / 1080x1920), format (PNG/JPEG), file size (< 2MB), stores external references, and links the asset to the Content Master.
  - **NEGATIVE:** Images violating aspect ratio or exceeding size limits are rejected with explanatory errors.
  - **Verification Method:** UI Observation & File Validation Test.

---

### STEP 09 — Social Review

- **AC2-109 (Holistic Packaging Review):**
  - **GIVEN:** An authenticated Social Manager opening an item with QC approval and approved thumbnail.
  - **WHEN:** The manager inspects the combined package (video preview, thumbnail mockup, platform titles, descriptions, hashtags, and initial pinned engagement comment) and clicks `APPROVE_PACKAGE`.
  - **THEN:** The system marks the package `SOCIAL_APPROVED`, locks editorial copy, and advances the item to Step 10.
  - **NEGATIVE:** If the pinned comment is blank or if platform copy exceeds platform character limits, approval is blocked.
  - **Verification Method:** UI Consistency Test & API Test.

---

### STEP 10 — Publishing Setup

- **AC2-110 (Distribution Configuration & Scheduling):**
  - **GIVEN:** An item in `SOCIAL_APPROVED` status.
  - **WHEN:** The publishing manager selects target distribution channels (YouTube Shorts, Instagram Reels, Facebook), sets publication timestamps (immediate or scheduled future date), and locks pre-publish parameters.
  - **THEN:** The system creates a Publishing Record with status `SCHEDULED` and displays scheduled release time in UTC and IST.
  - **NEGATIVE:** Cannot schedule for a past timestamp; cannot proceed without at least one valid target channel selected.
  - **Verification Method:** Workflow Test & UI Observation.

---

### STEP 11 — Published

- **AC2-111 (Distribution Execution & Live Confirmation):**
  - **GIVEN:** A scheduled publishing record reaching its target execution timestamp.
  - **WHEN:** Distribution is executed (via platform API connector or guided manual workflow).
  - **THEN:** The system records external platform identifiers (e.g., YouTube Video ID, Instagram Media ID), live URLs, and updates publication status to `PUBLISHED`.
  - **NEGATIVE:** If platform distribution fails, the system captures the external error code, leaves the item in `PUBLISH_FAILED`, and notifies the publishing lead without corrupting existing content.
  - **Verification Method:** Integration Test & Failure Recovery Test.

---

### STEP 12 — Platform Sync

- **AC2-112 (Post-Publish Verification & Syndication Sync):**
  - **GIVEN:** An item marked `PUBLISHED`.
  - **WHEN:** The operator or automated checker verifies public URL accessibility and confirms the first pinned comment is live on the primary platform.
  - **THEN:** The system updates status to `LIVE_VERIFIED`, registers the verification timestamp, and activates the item for analytics harvesting.
  - **NEGATIVE:** If the live URL returns HTTP 404 or video playback fails, status remains `SYNC_PENDING` with an urgent alert.
  - **Verification Method:** Operational Observation & HTTP Status Test.

---

### STEP 13 — Analytics

- **AC2-113 (Cross-Platform Telemetry Harvesting):**
  - **GIVEN:** An item in `LIVE_VERIFIED` status reaching a standardized milestone (24 hours, 7 days, 30 days).
  - **WHEN:** Performance telemetry is ingested (views, impressions, CTR, retention curve drop-off points, likes, shares, comments).
  - **THEN:** The system records an immutable telemetry snapshot linked to the Content Item and updates dashboard aggregations.
  - **NEGATIVE:** Non-numeric or negative metric values are rejected; duplicate milestone records are prevented.
  - **Verification Method:** API Contract Test & Data Integrity Test.

---

### STEP 14 — Performance Review

- **AC2-114 (Pedagogical & Retention Diagnosis):**
  - **GIVEN:** A Content Manager viewing ingested telemetry for a published asset.
  - **WHEN:** The manager evaluates audience drop-off points, hook retention, and student confusion in comments, then submits a diagnostic evaluation.
  - **THEN:** The system saves the Performance Review record containing retention classification, viral rating, and pedagogical observations.
  - **NEGATIVE:** Review cannot be submitted without selecting at least one diagnostic observation tag.
  - **Verification Method:** Human Acceptance Test & UI Observation.

---

### STEP 15 — Intelligence Loop

- **AC2-115 (Closed-Loop Directive Synthesis):**
  - **GIVEN:** Completed performance reviews from Step 14.
  - **WHEN:** An Editorial Director synthesizes findings into a Next-Content Directive (specifying target exam, topic, difficulty adjustment, and script hook patterns).
  - **THEN:** The system creates an active Directive card that automatically surfaces in Step 01 (Question Studio) to guide the next production batch.
  - **NEGATIVE:** Directives cannot be saved without an explicit topic mapping and curricular rationale.
  - **Verification Method:** End-to-End Workflow Test & HAT.

---

## 08. Multi-User Collaboration Acceptance

- **AC2-200 (Multi-User Work Isolation):**
  - **GIVEN:** User A is editing an audience script in Step 03 while User B is reviewing a question in Step 02.
  - **WHEN:** Both users execute simultaneous mutations on their respective records.
  - **THEN:** Both mutations succeed independently with zero cross-talk, data corruption, or session collision.
  - **Verification Method:** Concurrency Test.

- **AC2-201 (Concurrent Session Presence):**
  - **GIVEN:** Multiple authenticated users active in the CMS across different browser sessions.
  - **WHEN:** Users navigate across workboards.
  - **THEN:** Each user's identity, role permissions, and active filter preferences remain strictly isolated to their session.
  - **Verification Method:** Integration Test.

---

## 09. Assignment & Ownership Acceptance

- **AC2-210 (Stage-Level Assignment):**
  - **GIVEN:** A Content Item advancing to a new stage (e.g., Step 06 Editing Bay).
  - **WHEN:** A manager assigns the item to a specific Video Editor.
  - **THEN:** The item appears in that editor's personalized queue, the assignee ID is recorded on the entity, and the previous assignee history is preserved.
  - **NEGATIVE:** Cannot assign an item to a non-existent user or a user without appropriate role qualifications.
  - **Verification Method:** UI Observation & API Test.

---

## 10. Notification & Alerting Acceptance

- **AC2-220 (Event-Driven Operational Alerts):**
  - **GIVEN:** An item rejected during Step 02 (Verification) or Step 07 (Final QC).
  - **WHEN:** The rejection is committed with feedback notes.
  - **THEN:** The responsible author or editor receives an immediate, observable in-app notification indicating rejection rationale and item link.
  - **Verification Method:** UI Observation & Notification Verification Test.

---

## 11. Search, Discovery & Dashboard Acceptance

- **AC2-300 (Multi-Faceted Content Search):**
  - **GIVEN:** A user on the Content Library view.
  - **WHEN:** The user searches by keyword, exam category, topic, difficulty, canonical stage (01–15), or date range.
  - **THEN:** Matching items return within acceptable latency (< 500ms for standard queries), highlighting status and assignee.
  - **Verification Method:** UI Observation & Performance Test.

- **AC2-310 (Executive & Operational Dashboards):**
  - **GIVEN:** A Channel Lead viewing the central Operations Dashboard.
  - **WHEN:** The dashboard loads.
  - **THEN:** It accurately displays total items in progress across all 15 stages, bottleneck alerts (stages with items exceeding threshold wait times), and scheduled release timelines.
  - **Verification Method:** UI Observation & Data Audit.

---

## 12. Media Lifecycle Acceptance

- **AC2-400 (Metadata & Reference Separation):**
  - **GIVEN:** An operator uploading raw or edited video.
  - **WHEN:** The file is registered in the CMS.
  - **THEN:** The system stores only external references (Google Drive File ID, web view URL, stream URL), format, resolution, and duration; zero binary media bytes are written to the transactional database.
  - **Verification Method:** Database Inspection & Integration Test.

- **AC2-401 (Integrity Checksum Validation):**
  - **GIVEN:** A registered video asset.
  - **WHEN:** Ingested into the system.
  - **THEN:** A valid SHA-256 checksum is computed and stored to ensure asset immutability across post-production handoffs.
  - **Verification Method:** Integration Test.

- **AC2-402 (Cold Archive References):**
  - **GIVEN:** An older content item whose raw footage has been moved to cold storage.
  - **WHEN:** The record is inspected.
  - **THEN:** The system maintains historical archive pointers and retrieval manifests without requiring active live streaming links.
  - **Verification Method:** Document Review & Data Integrity Test.

---

## 13. AI Assistive Behavior Acceptance

- **AC2-500 (Human-in-the-Loop AI Boundary):**
  - **GIVEN:** A user requesting AI question drafting, translation, or script ideation.
  - **WHEN:** The AI model generates content.
  - **THEN:** Generated content is presented strictly in an editable preview buffer; it is NEVER committed to system state or advanced through the pipeline until a human explicitly edits, validates, and approves it.
  - **Verification Method:** UI Observation & Workflow Test.

- **AC2-501 (AI Provenance & Audit):**
  - **GIVEN:** An artifact created or modified using AI assistance.
  - **WHEN:** The artifact is saved by a human editor.
  - **THEN:** The record stores an immutable `aiAssisted: true` flag, prompt context summary, and model identifier alongside the human author ID.
  - **Verification Method:** Data Integrity Test & Audit Log Check.

- **AC2-502 (AI Non-Authority Invariant):**
  - **GIVEN:** Any critical approval endpoint (Verification, QC, Publishing, Security).
  - **WHEN:** An automated script or AI service attempts to invoke the endpoint directly.
  - **THEN:** The system rejects the call with HTTP 403 Forbidden; only authenticated human user session tokens can grant approvals.
  - **Verification Method:** Security Penetration Test.

---

## 14. Realtime Awareness Acceptance

- **AC2-600 (Observable State Visibility):**
  - **GIVEN:** Multiple users viewing the same pipeline workboard.
  - **WHEN:** An item advances from Step 06 to Step 07.
  - **THEN:** All active operators observe the updated stage position in near-realtime (without requiring manual browser reloads or seeing stale ghost items).
  - **Verification Method:** Multi-Browser UI Observation.

---

## 15. Concurrency & Idempotency Acceptance

- **AC2-610 (Optimistic Concurrency & Conflict Rejection):**
  - **GIVEN:** User A and User B open the same script version `v1` simultaneously.
  - **WHEN:** User A saves changes (creating `v2`), and subsequently User B attempts to save changes based on `v1`.
  - **THEN:** User B's submission is rejected with HTTP 409 Conflict (*"Record has been modified by another user; please refresh and merge"*); User A's changes remain uncorrupted.
  - **Verification Method:** Automated Concurrency Test.

- **AC2-611 (Idempotent Mutation Execution):**
  - **GIVEN:** A network retry or double-click triggers duplicate POST requests for a stage transition or publishing action with the same idempotency key.
  - **WHEN:** Processed by the server.
  - **THEN:** The action executes exactly once; subsequent requests return the identical success response without creating duplicate records or state transitions.
  - **Verification Method:** API Contract Test.

---

## 16. Data Integrity & Single Source of Truth Acceptance

- **AC2-620 (Referential & Relationship Consistency):**
  - **GIVEN:** A Content Item linked across Question, Script, Video, and Publishing records.
  - **WHEN:** Any query retrieves the item.
  - **THEN:** All related entities reflect consistent stage pointers and timestamps. Deletion of parent entities without audit archiving is prevented.
  - **Verification Method:** Database Integrity Test.

---

## 17. Security & Authorization Acceptance

- **AC2-700 (Unauthenticated Access Prevention):**
  - **GIVEN:** An unauthenticated visitor.
  - **WHEN:** Attempting to access protected API endpoints (`/api/*`) or application pages (`/questions/*`, `/studio/*`, `/admin/*`).
  - **THEN:** The system blocks access with HTTP 401 Unauthorized or redirects immediately to the login view.
  - **Verification Method:** Automated Security Route Test.

- **AC2-701 (Server-Side Role Guarding):**
  - **GIVEN:** A user with role `STUDIO_PRESENTER`.
  - **WHEN:** Attempting to execute an administrative action or sign off on Step 07 QC.
  - **THEN:** The server rejects the mutation with HTTP 403 Forbidden, regardless of client UI button states.
  - **Verification Method:** Security Route Penetration Test.

- **AC2-702 (Zero Secret Exposure in Client Bundles):**
  - **GIVEN:** Production client bundles, source maps, and network traffic.
  - **WHEN:** Scanned for credentials.
  - **THEN:** Zero OAuth client secrets, private service account keys, or backend tokens are exposed to the browser.
  - **Verification Method:** Static Code & Bundle Security Scan.

---

## 18. Auditability & Traceability Acceptance

- **AC2-710 (Complete Audit Log Schema):**
  - **GIVEN:** Any state transition, review decision, or configuration change.
  - **WHEN:** Committed to the system.
  - **THEN:** An immutable audit record is created capturing: `actorId`, `actorRole`, `actionType`, `resourceId`, `timestampUtc`, `previousState`, `newState`, and `clientIp/metadata`.
  - **Verification Method:** Audit Log Inspection Test.

- **AC2-711 (Tamper-Resistant Audit Log):**
  - **GIVEN:** An existing audit log record.
  - **WHEN:** Any user (including an Administrator) attempts to update or delete the audit entry.
  - **THEN:** The operation is rejected; audit logs are strictly append-only.
  - **Verification Method:** Security & Database Integrity Test.

---

## 19. Non-Functional Acceptance

- **AC2-800 (UI Responsiveness Benchmark):**
  - **GIVEN:** Standard operational load.
  - **WHEN:** Navigating between pipeline views or loading content forms.
  - **THEN:** Visual rendering completes within 500ms.
  - **Verification Method:** Performance Profiler.

- **AC2-801 (Teleprompter Smooth Rendering):**
  - **GIVEN:** An active in-studio recording session.
  - **WHEN:** Teleprompter scrolling is active at any preset speed (1x to 3x).
  - **THEN:** The animation maintains 60 FPS without stutter or frame drops exceeding 2 consecutive frames.
  - **Verification Method:** Browser Performance Frame Rate Audit.

- **AC2-802 (Long-Running Task Isolation):**
  - **GIVEN:** Heavy background tasks (video integrity verification, analytics harvesting, bulk publishing).
  - **WHEN:** Triggered by user action or schedule.
  - **THEN:** Initial HTTP acknowledgment returns within 2000ms; background processing completes asynchronously without locking UI threads or web request workers.
  - **Verification Method:** Asynchronous Job Test.

- **AC2-803 (Infrastructure Sizing & Architecture-Dependent Thresholds):**
  - *Statement:* Concrete measurement of maximum concurrent database connections, IOPS throughput, and serverless cold-start thresholds:
  - **"ACCEPTANCE MEASUREMENT REQUIRES ARCHITECTURE / DESIGN DECISION (STAGE 03)"**

---

## 20. Cost Constraint Acceptance

- **AC2-900 (COST-001 Hard Budget Compliance):**
  - **GIVEN:** The active deployment and operational infrastructure of BP-CMS.
  - **WHEN:** Audited for infrastructure expenditures.
  - **THEN:** Total initial out-of-pocket investment remains strictly between **₹0 and ₹100**, utilizing free tiers and existing provisioned platform resources.
  - **Verification Method:** Operational Cost Audit.

- **AC2-901 (Paid Infrastructure Pre-Approval Gate):**
  - **GIVEN:** Any proposed architectural addition that incurs recurring or upfront financial costs.
  - **WHEN:** Evaluated during architecture or implementation.
  - **THEN:** It must be rejected unless accompanied by formal written business justification and Product Owner approval.
  - **Verification Method:** Governance Document Review.

---

## 21. Failure / Rejection & Recovery Acceptance

- **AC2-910 (Structured Stage Rejection Recovery):**
  - **GIVEN:** An item rejected at Step 02 (Verification) or Step 07 (QC).
  - **WHEN:** Routed backward in the pipeline.
  - **THEN:** It returns to the exact authoring/editing workboard with all prior fields intact and rejection feedback displayed prominently; previous versions are preserved in history.
  - **Verification Method:** Workflow Recovery Test.

- **AC2-911 (Container Restart Fault Recovery):**
  - **GIVEN:** An unexpected container restart or network termination during a user session.
  - **WHEN:** The system resumes.
  - **THEN:** Zero uncommitted half-records or corrupted states exist; all committed items remain intact at their valid canonical stage.
  - **Verification Method:** Resilience & Fault Injection Test.

---

## 22. Brownfield Modernization Acceptance

- **AC2-920 (Preservation of Existing Assets & Workflows):**
  - **GIVEN:** Existing production content, questions, scripts, and video metadata in Google Sheets and Google Drive.
  - **WHEN:** BP-CMS operates or transitions through modernization phases.
  - **THEN:** Existing data is preserved without corruption, loss, or unauthorized schema destruction.
  - **Verification Method:** Data Reconciliation Audit.

- **AC2-921 (Disciplined Component Classification):**
  - **GIVEN:** Legacy code components in the codebase.
  - **WHEN:** Addressed in future stages.
  - **THEN:** Each component must be categorized under the approved modernization taxonomy (`KEEP`, `MODIFY`, `MERGE`, `DEPRECATE`, `REMOVE`, `CREATE`); wholesale rewrites without classification are prohibited.
  - **Verification Method:** Architecture Audit Review.

---

## 23. Master Traceability Matrix

| Stage 01 Requirement | Subject Domain | Stage 02 Acceptance Criterion | Primary Verification Method |
| :--- | :--- | :--- | :--- |
| **BR-001** | Complete Content Lifecycle | **AC2-101** through **AC2-115** | End-to-End Workflow Test |
| **BR-100** | Question Production | **AC2-101** | UI & API Contract Test |
| **BR-200** | Question Verification | **AC2-102**, **NEG-01** | Security Test & HAT |
| **BR-300** | Audience Script | **AC2-103** | UI & API Test |
| **BR-400** | Teleprompter & Filming | **AC2-104**, **AC2-801** | UI Profiler & Workflow Test |
| **BR-500** | Raw Video Ingestion | **AC2-105**, **AC2-401** | Integration & File Test |
| **BR-600** | Editing Bay | **AC2-106** | UI & Workflow Test |
| **BR-700** | Final QC Certification | **AC2-107**, **NEG-03** | HAT & Video Profiler |
| **BR-800** | Thumbnail Packaging | **AC2-108** | UI & File Validation Test |
| **BR-900** | Social Review | **AC2-109** | UI Consistency Test |
| **BR-1000**| Publishing Setup | **AC2-110** | Workflow Test |
| **BR-1100**| Published Execution | **AC2-111**, **NEG-04** | Integration & Failure Test |
| **BR-1200**| Platform Synchronization | **AC2-112** | HTTP Status & Operational Test|
| **BR-1300**| Analytics Harvesting | **AC2-113** | API Contract Test |
| **BR-1400**| Performance Review | **AC2-114** | HAT & UI Observation |
| **BR-1500**| Intelligence Loop | **AC2-115** | End-to-End Workflow Test |
| **BR-1600**| Multi-User Operation | **AC2-200**, **AC2-201** | Concurrency Test |
| **BR-1700**| Stage Assignment | **AC2-210** | UI & API Test |
| **BR-1800**| Workflow Transition Rules| **AC2-101**–**115**, **NEG-02**| State Machine & API Test |
| **BR-1900**| Data Integrity & Ownership | **AC2-620** | Database Integrity Test |
| **BR-2000**| Media Management | **AC2-400**, **NEG-07** | Database Inspection Test |
| **BR-2100**| Archive References | **AC2-402** | Document Review & Data Test |
| **BR-2200**| Operational Notifications | **AC2-220** | UI Notification Test |
| **BR-2300**| Search & Discovery | **AC2-300** | UI & Performance Test |
| **BR-2400**| Operations Dashboards | **AC2-310** | UI Observation & Data Audit |
| **BR-2500**| Audit Trails | **AC2-710**, **AC2-711**, **NEG-10**| Security & Audit Log Test |
| **BR-2600**| AI Assistance & Governance| **AC2-500**, **AC2-501**, **AC2-502**, **NEG-06**| UI, Data & Security Test |
| **BR-2700**| Realtime Awareness | **AC2-600** | Multi-Browser UI Observation |
| **NFR-001**| Data Reliability | **AC2-620**, **AC2-911** | Resilience & Integrity Test |
| **NFR-002**| Transition Reliability | **AC2-611**, **NEG-02** | API & State Machine Test |
| **NFR-003**| External Reliability | **AC2-111**, **AC2-400** | Integration Failure Test |
| **NFR-004**| System Recovery | **AC2-911** | Resilience Injection Test |
| **NFR-010**| Performance Benchmarks | **AC2-800**, **AC2-801** | Performance Profiler Test |
| **NFR-011**| Long-Running Work | **AC2-802** | Asynchronous Job Test |
| **NFR-020**| Authentication | **AC2-700** | Automated Security Route Test |
| **NFR-021**| Authorization & RBAC | **AC2-701** | Security Route Test |
| **NFR-022**| Server-Side Authorization| **AC2-701**, **NEG-08** | Security Penetration Test |
| **NFR-023**| Route/Data Protection | **AC2-700**, **AC2-701** | Security Route Test |
| **NFR-024**| Secret Protection | **AC2-702** | Static Code Security Scan |
| **NFR-025**| Media Authorization | **AC2-400**, **AC2-700** | Access Control Test |
| **NFR-026**| Administrative Protection| **AC2-701**, **AC2-711** | Security Penetration Test |
| **NFR-030**| Maintainability | **AC2-921** | Code & Architecture Review |
| **NFR-031**| Duplicate Control | **AC2-921** | Static Code Analysis |
| **NFR-032**| Legacy Classification | **AC2-921** | Architecture Audit Review |
| **NFR-033**| Historical Preservation | **AC2-920** | Documentation & Data Audit |
| **NFR-034**| Architecture Docs | **AC2-921** | Documentation Review |
| **NFR-040**| Auditability | **AC2-710** | Audit Log Inspection |
| **NFR-041**| Review Traceability | **AC2-102**, **AC2-710** | HAT & Audit Inspection |
| **NFR-042**| Publishing Traceability | **AC2-111**, **AC2-710** | Integration & Audit Test |
| **NFR-043**| Admin Traceability | **AC2-711** | Security Audit Test |
| **NFR-044**| AI Provenance | **AC2-501** | Data Integrity Test |
| **COST-001**| Hard Cost Constraint | **AC2-900**, **AC2-901**, **NEG-09**| Operational Cost & Governance Audit|

---

## 24. Acceptance Test Method Classification

Every criterion in this document is mapped to one of seven test categories:

1. **HAT (Human Acceptance Test):** Evaluated by human subject matter experts, presenters, editors, or QC officers for subjective and pedagogical quality.
2. **UI (User Interface Observation):** Automated browser checks (or tester walkthroughs) verifying layout, form validation, responsiveness, and state reflection.
3. **API (Endpoint Contract Test):** Automated HTTP request/response validation testing payload schemas, status codes, and error formats.
4. **SEC (Security & Penetration Test):** Automated verification testing route authorization, token validation, privilege escalation rejection, and credential leakage.
5. **CONC (Concurrency & Race Condition Test):** Automated multi-threaded simulation of simultaneous edits, conflicting submissions, and idempotency tokens.
6. **INTEG (Data Integrity & Storage Test):** Automated checks confirming relational referential integrity, external storage link validity, and SHA-256 checksums.
7. **PERF (Performance & Load Profiling):** Automated profiling measuring latency (< 500ms), animation frame rates (60 FPS), and resource utilization.

---

## 25. Stage 02 Completion Gate

To achieve **PRODUCT OWNER ACCEPTED** status and close Stage 02, the following conditions must be satisfied:

```
[ ] Complete Acceptance Criteria Coverage: All Stage 01 requirements (BR-xxx, NFR-xxx, COST-001) mapped.
[ ] Canonical 15-Step Completeness: All 15 canonical steps have fully defined behavioral criteria.
[ ] Negative Gates Defined: All 10 negative criteria (NEG-01 through NEG-10) specified with expected errors.
[ ] Zero Premature Implementation: No application code, schemas, or database migrations written.
[ ] Technology Neutrality Preserved: No premature lock-in of database, queue, or realtime protocols.
[ ] Verification Methods Assigned: Every criterion assigned a concrete test category (HAT, UI, API, SEC, etc.).
[ ] Product Owner Review & Sign-Off: Formally reviewed and accepted by the Product Owner.
```

```
================================================================================
STAGE 02 — BUSINESS ACCEPTANCE CRITERIA
DOCUMENT STATUS: DRAFT
IMPLEMENTATION STATUS: BUSINESS ACCEPTANCE CRITERIA DOCUMENT CREATED
APPROVAL: PENDING PRODUCT OWNER ACCEPTANCE
VERSION: 1.0.0
================================================================================
```
