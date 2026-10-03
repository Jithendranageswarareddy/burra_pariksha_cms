# 02 — BUSINESS ACCEPTANCE CRITERIA
## Burra Pariksha Content Management System (BP-CMS)
### Stage 02 of 30-Stage Modernization Program — Authoritative Acceptance Baseline

---

## 1. Document Governance & Anti-Overclaim Statement

| Attribute | Definition |
| :--- | :--- |
| **Document Path** | `docs/requirements/02-BUSINESS-ACCEPTANCE-CRITERIA.md` |
| **SDLC Stage** | Stage 02 — Business Acceptance Criteria |
| **Document Version** | 1.0.0-SDLC-RESTART |
| **Status** | ACTIVE ACCEPTANCE BASELINE |
| **Scope** | Measurable, Observable, Testable Acceptance Criteria for all Stage 01 Requirements |

### Strict Anti-Overclaim Invariants
1. **Acceptance Criteria vs Implementation:** This document establishes **HOW** downstream implementation stages will be formally tested and verified. It does **NOT** claim that any business feature, workflow engine, API endpoint, or UI component is currently implemented.
2. **Vocabulary Invariant:** Words like *"Implemented"*, *"Complete"*, and *"Verified"* must never be applied to application features in Stage 02. In this stage, "Complete" refers strictly to the completion of the *Acceptance Criteria Baseline*.
3. **No Mock or Phantom Implementations:** No dummy code, mock objects, or pseudo-implementations are introduced.
4. **Zero Production Code Changes:** No production source code, database tables, or server routes are modified in Stage 02.

---

## 2. Relationship to Stage 01 Requirements

This document is derived directly from the Stage 01 Product Requirements Baseline:
- Every business requirement (`BR-001` through `BR-011`) maps to one or more measurable acceptance criteria.
- Every non-functional requirement (`NFR-001` through `NFR-008`) and the cost constraint (`COST-001`) maps to testable verification conditions.
- The canonical 15-stage workflow is translated into exhaustive positive and negative transition rules preventing workflow bypass.
- The State Separation Axiom (`Workflow Step ≠ Entity Status ≠ Media Status ≠ Job Status ≠ Publication Status`) is formalized into observable data constraints.

---

## 3. Acceptance Criteria Methodology

All acceptance criteria in this document follow the standard behavioral structure:
```text
Given <initial context, user role, and system state>,
When <specific user or system action occurs>,
Then <observable, verifiable system result and state mutation>.
```
Where necessary, criteria also explicitly define:
- **Preconditions:** Required system state prior to execution.
- **Expected Result:** Observable outcome across UI, API, and persistence layers.
- **Failure Condition:** Observable behavior when inputs or authorizations are invalid.
- **Required System State:** Post-execution entity status and state machine positions.
- **Required Audit / Result Evidence:** Ledger entries, timestamps, and actor attributions.

---

## 4. 02.1 Business Acceptance Criteria

### BAC-001: Question Production (Mapping: BR-001)

#### BAC-001.1: Complete Question Draft Creation
- **Preconditions:** User is authenticated with `QUESTION_AUTHOR` role and has assigned curriculum context.
- **Given** an authenticated Question Author in the authoring workspace,
- **When** the author submits a question with stem, exactly 4 distinct options (A, B, C, D), exactly one marked correct answer, a complete mathematical/conceptual solution proof, bilingual (Telugu & English) translations, and syllabus classification (Subject, Topic, Subtopic),
- **Then** the system creates a new draft question entity with lifecycle status `DRAFT`, workflow step `01_QUESTION_GENERATION`, assigns a unique identifier, associates the author's user ID, and records an append-only audit event `QUESTION_CREATED`.
- **Failure Condition:** If any option is missing, if zero or multiple options are marked correct, if the solution proof is empty, or if syllabus taxonomy is omitted, the submission is rejected with validation errors and no database entity is created.
- **Required System State:** Entity exists with `workflow_step = '01_QUESTION_GENERATION'`, `status = 'DRAFT'`.
- **Required Audit Evidence:** Audit log record with action `QUESTION_CREATED`, actor ID, timestamp, and entity ID.

#### BAC-001.2: AI-Assisted Question Generation Boundary
- **Preconditions:** Author invokes AI draft assistant within the authoring workspace.
- **Given** an author requesting AI question generation with target topic parameters,
- **When** the external AI service returns candidate question text,
- **Then** the candidate text is presented in the author's local editor as an uncommitted draft; the system does NOT persist the question to the central repository until the human author explicitly verifies, edits, and submits the draft.
- **Failure Condition:** AI failure or rate limiting displays a non-blocking error notice; manual authoring remains fully operable.
- **Required System State:** No state change until human submits.

---

### BAC-002: Question Verification (Mapping: BR-002)

#### BAC-002.1: Academic Verification Approval
- **Preconditions:** Question is in `workflow_step = '01_QUESTION_GENERATION'`, `status = 'DRAFT'`. User has `ACADEMIC_VERIFIER` role and is NOT the author of the question (Anti-Self-Approval GAR-02).
- **Given** an unverified question submitted for review,
- **When** the Academic Verifier certifies all mandatory verification criteria (mathematical accuracy, syllabus alignment, ambiguity check, Telugu translation fidelity) and clicks `APPROVE`,
- **Then** the question status updates to `VERIFIED`, workflow step advances to `02_QUESTION_VERIFICATION`, verifier ID and verification checklist notes are permanently recorded, and the question becomes visible in the Script Production queue.
- **Failure Condition:** If the verifier has not ticked all mandatory verification criteria, the approval action is rejected.
- **Required System State:** `workflow_step = '02_QUESTION_VERIFICATION'`, `status = 'VERIFIED'`.
- **Required Audit Evidence:** Audit record with action `QUESTION_VERIFIED`, verifier ID, checklist summary, and timestamp.

#### BAC-002.2: Anti-Self-Approval Enforcement (GAR-02)
- **Preconditions:** User `U_01` created the question draft.
- **Given** user `U_01` has both `QUESTION_AUTHOR` and `ACADEMIC_VERIFIER` role capabilities,
- **When** user `U_01` attempts to verify or approve their own question draft,
- **Then** the system rejects the operation with error `FORBIDDEN_SELF_APPROVAL`, the question remains in `DRAFT` state, and an unauthorized attempt alert is recorded.
- **Failure Condition:** Any code path allowing author ID == verifier ID must fail validation.

#### BAC-002.3: Verification Revision Request
- **Preconditions:** Question is in `workflow_step = '01_QUESTION_GENERATION'`.
- **Given** an Academic Verifier reviewing an unverified question,
- **When** the verifier identifies an error and submits `CHANGES_REQUESTED` with specific feedback remarks,
- **Then** the question status transitions to `REVISION_REQUIRED`, workflow step remains at `01_QUESTION_GENERATION`, the question returns to the author's action queue with verifier notes, and the script queue cannot access it.
- **Required Audit Evidence:** Audit record with action `QUESTION_REVISION_REQUESTED` containing remarks.

---

### BAC-003: Script Production (Mapping: BR-003)

#### BAC-003.1: 5-Part Audience Script Creation & Duration Check
- **Preconditions:** Question has `status = 'VERIFIED'`. User has `SCRIPTWRITER` role.
- **Given** an approved question in the Script Production queue,
- **When** the scriptwriter creates a script containing Hook, Problem, Solution, Burra Trick, and Call to Action (CTA), with estimated spoken duration between 45 and 60 seconds (130–150 wpm cadence),
- **Then** the system creates a versioned script entity linked to the question, sets script status to `DRAFT`, and calculates word count and pacing metrics.
- **Failure Condition:** If spoken text length calculates to less than 40 seconds or greater than 65 seconds, the system displays a pacing warning. If any of the 5 required structural sections is missing, script submission is blocked.
- **Required System State:** Script entity created with `version = 1`, `status = 'DRAFT'`.

#### BAC-003.2: Script Approval & Teleprompter Lock
- **Preconditions:** Script draft completed. Presenter or Script Lead reviews.
- **Given** a complete script draft,
- **When** the reviewer confirms spoken cadence and submits `LOCK_FOR_STUDIO`,
- **Then** the script status transitions to `LOCKED`, workflow step advances to `03_AUDIENCE_SCRIPT`, and the script content becomes read-only and available to the studio teleprompter view.
- **Failure Condition:** Any attempt to edit locked script without initiating a new version (`version = 2`) is rejected.
- **Required System State:** `workflow_step = '03_AUDIENCE_SCRIPT'`, `script.status = 'LOCKED'`.

---

### BAC-004: Video Production (Mapping: BR-004)

#### BAC-004.1: Studio Camera Take Registration
- **Preconditions:** Script is in `03_AUDIENCE_SCRIPT` with `status = 'LOCKED'`. User has `STUDIO_OPERATOR` or `PRESENTER` role.
- **Given** the studio filming session,
- **When** the camera operator registers a filmed take with take number, duration, camera identifier, external storage locator (Google Drive URI), and operator remarks,
- **Then** the system records the take record linked to the production project, advances workflow step to `04_TELEPROMPTER_FILMING`, and sets take status to `REGISTERED`.
- **Failure Condition:** Submission without external storage pointer or with negative duration is rejected. Raw video binary data is NEVER accepted into the database payload.
- **Required System State:** `workflow_step = '04_TELEPROMPTER_FILMING'`.

#### BAC-004.2: Raw Video Handoff to Editing Bay
- **Preconditions:** At least one camera take is marked `SELECTED_TAKE`.
- **Given** registered camera takes for a production item,
- **When** the studio operator flags selected takes and clicks `HANDOFF_TO_EDITING`,
- **Then** the workflow step advances to `05_RAW_VIDEO`, entity status updates to `IN_EDITING_QUEUE`, and the project appears in the Video Editor queue.
- **Required System State:** `workflow_step = '05_RAW_VIDEO'`.

#### BAC-004.3: Master Cut Submission & Final QC Certification
- **Preconditions:** Project is in `06_EDITING_BAY`. User has `VIDEO_EDITOR` role.
- **Given** an editor completing post-production (9:16 vertical MP4, animated bilingual subtitles, motion graphics),
- **When** the editor registers the master cut metadata (external URI, SHA-256 checksum, duration, audio loudness tag) and submits for QC,
- **Then** workflow step advances to `07_FINAL_QC` and status updates to `PENDING_QC`.
- **When** an independent QC Officer certifies loudness (-14 LUFS standard), subtitle sync, and visual safety and clicks `QC_PASSED`,
- **Then** workflow step advances to `08_THUMBNAIL` and status becomes `QC_APPROVED`.
- **Failure Condition:** If QC Officer rejects with `QC_FAILED`, the item reverts to `06_EDITING_BAY` with timestamped defect notes.
- **Required System State:** `workflow_step = '07_FINAL_QC'` → `08_THUMBNAIL`.

---

### BAC-005: Thumbnail Production (Mapping: BR-005)

#### BAC-005.1: High-Contrast Thumbnail Package & Answer-Leak Guard
- **Preconditions:** Project has passed Final QC (`08_THUMBNAIL`). User has `THUMBNAIL_DESIGNER` role.
- **Given** the thumbnail authoring workspace,
- **When** the designer registers 1 to 3 candidate thumbnail artwork variants (A/B/C) with external storage URLs, aspect ratio (9:16 and 16:9), and curiosity hook headline text,
- **Then** the system verifies that the hook headline does NOT match or contain the correct question option key/value, validates aspect ratio metadata, and saves the package in `status = 'PENDING_APPROVAL'`.
- **Failure Condition:** If the hook headline leaks the correct answer, registration is rejected with error `ANSWER_LEAK_DETECTED`.
- **Required System State:** Thumbnail package registered and linked to production entity.

---

### BAC-006: Social Review (Mapping: BR-006)

#### BAC-006.1: 9:16 Smartphone Simulator Review & Sign-Off
- **Preconditions:** Master video cut approved, thumbnail package approved. User has `SOCIAL_REVIEWER` role.
- **Given** the interactive 9:16 mobile safe-zone preview simulator,
- **When** the Social Reviewer verifies that subtitles, formula overlays, and hook text do not collide with platform UI elements (like/comment buttons, audio ticker), audits the Telugu pinned comment (containing full proof and CTA), and clicks `APPROVE_SOCIAL_PACKAGE`,
- **Then** workflow step advances to `09_SOCIAL_REVIEW` with `status = 'APPROVED_FOR_RELEASE'`, and the item enters the Publishing Setup queue.
- **Failure Condition:** If platform title, description, or pinned comment is missing, approval is blocked.

---

### BAC-007: Publishing (Mapping: BR-007)

#### BAC-007.1: Duplicate-Protected Publishing Dispatch
- **Preconditions:** Social package in `status = 'APPROVED_FOR_RELEASE'`. User has `PUBLISHING_OPERATOR` role.
- **Given** a release package scheduled for distribution,
- **When** the operator confirms target release channels (YouTube Shorts, Instagram Reels) and triggers publishing,
- **Then** the system validates idempotency key, records external platform broadcast identifiers upon dispatch, advances workflow step to `10_PUBLISHING_SETUP` then `11_PUBLISHED`, and updates entity status to `PUBLISHED`.
- **Failure Condition:** If an asset already has `status = 'PUBLISHED'` or an active dispatch in progress, duplicate publishing is strictly blocked with `DUPLICATE_DISPATCH_PREVENTED`.
- **Required System State:** `workflow_step = '11_PUBLISHED'`, `status = 'PUBLISHED'`.
- **Required Audit Evidence:** Dispatch event with operator ID, channel targets, external platform video IDs, and timestamp.

---

### BAC-008: Platform Synchronization (Mapping: BR-008)

#### BAC-008.1: Live Video URL Verification & Parity Reconciliation
- **Preconditions:** Entity is in `11_PUBLISHED` with external platform IDs registered.
- **Given** a published broadcast entity,
- **When** the platform sync worker or operator checks external platform status,
- **Then** the system performs HTTP HEAD/GET checks on live URLs, confirms HTTP 200 and playable streaming status, advances workflow step to `12_PLATFORM_SYNC`, and marks synchronization status `VERIFIED_LIVE`.
- **Failure Condition:** If a platform returns HTTP 404 or playback error, sync status updates to `SYNC_ERROR`, alerting the operator without corrupting internal CMS data.
- **Required System State:** `workflow_step = '12_PLATFORM_SYNC'`.

---

### BAC-009: Analytics (Mapping: BR-009)

#### BAC-009.1: Milestone Retention Curve Ingestion
- **Preconditions:** Entity has `status = 'PUBLISHED'`. Reaches milestone age (24 hours, 7 days, 30 days).
- **Given** published content with active audience traffic,
- **When** analytics telemetry is ingested (views, watch time, shares, comments, APV, and second-by-second audience retention curves),
- **Then** the system creates an immutable analytical snapshot stamped with milestone label and timestamp, advances workflow step to `13_ANALYTICS`, and preserves upstream video and question state completely untouched.
- **Failure Condition:** Ingestion payload with malformed retention array (timestamps not monotonically increasing) is rejected.
- **Required System State:** Analytical snapshot persisted; upstream entity status unchanged.

---

### BAC-010: Performance Review (Mapping: BR-010)

#### BAC-010.1: Pedagogical Drop-Off Correlation
- **Preconditions:** Entity has ingested analytics (`13_ANALYTICS`). User has `CONTENT_STRATEGY_LEAD` or `FACULTY` role.
- **Given** viewer retention curves showing drop-off points,
- **When** the reviewer correlates a drop-off timestamp with the corresponding script line or formula presentation, categorizes the cause (e.g., `CONCEPTUAL_CONFUSION`, `PACING_DRAG`, `AUDIO_BLEED`), and saves findings,
- **Then** the system records the diagnostic review linked to the content item and advances workflow step to `14_PERFORMANCE_REVIEW`.
- **Required System State:** `workflow_step = '14_PERFORMANCE_REVIEW'`.

---

### BAC-011: Intelligence Loop (Mapping: BR-011)

#### BAC-011.1: Closed-Loop Curriculum Directive Seeding
- **Preconditions:** Multiple performance reviews completed across a syllabus topic. User has `CURRICULUM_DIRECTOR` role.
- **Given** diagnostic findings showing recurring student confusion in a specific subtopic,
- **When** the strategy lead generates and approves a new Curriculum Sprint Directive specifying target topic, difficulty, and pedagogical focus,
- **Then** the workflow step advances to `15_INTELLIGENCE_LOOP`, and the system automatically dispatches the approved directive as input to Step 01 (Question Generation) for the next authoring batch.
- **Failure Condition:** Unapproved AI recommendations cannot autonomously create question authoring queues.
- **Required System State:** `workflow_step = '15_INTELLIGENCE_LOOP'` and new batch initiated in Step 01.

---

## 5. 02.2 User Acceptance Criteria

### UAC-001: Question Author Workspace
- **Actor:** Question Author (`QUESTION_AUTHOR`).
- **Can See:** Assigned curriculum topics, their own draft questions, verification feedback notes, and authoring guidelines.
- **Can Do:** Create draft questions, edit draft questions, request AI drafting assistance, submit drafts for verification.
- **Must Happen After Action:** Draft is saved with version incremented and routed to verifier queue.
- **On Failure:** Unsaved changes are preserved locally in editor; validation errors are highlighted per field.
- **Must NOT Be Allowed To Do:** Verify or approve their own question; modify questions currently locked in verification; delete verified questions; publish questions directly.

### UAC-002: Academic Verifier Workspace
- **Actor:** Academic Verifier (`ACADEMIC_VERIFIER`).
- **Can See:** Queue of unverified question drafts authored by OTHER team members, complete question stem, LaTeX proofs, bilingual options, and syllabus tags.
- **Can Do:** Complete mandatory verification checklist, approve question, request revisions with timestamped notes, or reject question.
- **Must Happen After Action:** Approved questions move to Script queue; revision requests notify author.
- **On Failure:** Form displays uncompleted checklist items; action blocked until resolved.
- **Must NOT Be Allowed To Do:** Approve questions they authored (GAR-02); edit question text directly during review (must request author revision).

### UAC-003: Scriptwriter Workspace
- **Actor:** Scriptwriter (`SCRIPTWRITER`).
- **Can See:** Verified questions queue, script templates, teleprompter cadence estimator, word counter.
- **Can Do:** Draft 5-part video scripts, link visual callouts to spoken sentences, lock scripts for filming.
- **Must Happen After Action:** Locked script appears in Studio Teleprompter workspace.
- **Must NOT Be Allowed To Do:** Author scripts from unverified questions; modify approved question stems.

### UAC-004: Studio Presenter & Camera Operator
- **Actor:** Studio Presenter (`PRESENTER`) / Camera Operator (`STUDIO_OPERATOR`).
- **Can See:** Locked teleprompter script, pacing speed controls, camera take logger.
- **Can Do:** Adjust teleprompter scroll speed, log camera takes (take #, duration, Google Drive URI, rating).
- **Must Happen After Action:** Selected takes are flagged for post-production handoff.
- **Must NOT Be Allowed To Do:** Edit script text in the studio view; advance takes to QC without registering external storage locators.

### UAC-005: Video Editor Workspace
- **Actor:** Video Editor (`VIDEO_EDITOR`).
- **Can See:** Assigned filming projects, selected take locators, script visual directives, audio mastering specifications (-14 LUFS).
- **Can Do:** Download raw footage from external URI, register master cut metadata (URI, checksum, duration, loudness), submit for QC.
- **Must Happen After Action:** Master cut enters QC Officer queue.
- **Must NOT Be Allowed To Do:** Upload binary video files directly into application database; bypass Final QC to publish directly.

### UAC-006: Quality Control (QC) Officer
- **Actor:** QC Officer (`QC_OFFICER`).
- **Can See:** Master cut video player, technical checklist (audio loudness, subtitle sync, video glitches, academic correctness).
- **Can Do:** Certify QC pass (`QC_PASSED`) or issue QC reject (`QC_FAILED`) with exact timestamped defect notes.
- **Must Happen After Action:** QC pass unlocks thumbnail and social packaging; QC fail returns item to editor.
- **Must NOT Be Allowed To Do:** Approve their own video edits; approve master cuts lacking audio loudness certification.

### UAC-007: Thumbnail Designer Workspace
- **Actor:** Thumbnail Designer (`THUMBNAIL_DESIGNER`).
- **Can See:** QC-approved video projects, question context, hook text guidelines, safe-zone overlays.
- **Can Do:** Register candidate thumbnail image locators (Variants A, B, C) and curiosity headlines.
- **Must Happen After Action:** Thumbnail package submitted for social review.
- **Must NOT Be Allowed To Do:** Submit headlines containing the correct answer key; upload raw image binaries directly into database.

### UAC-008: Social Reviewer Workspace
- **Actor:** Social Media Manager / Reviewer (`SOCIAL_REVIEWER`).
- **Can See:** Interactive 9:16 smartphone simulator rendering video cut, thumbnail, platform title, description, hashtags, and Telugu pinned comment with safe-zone UI overlays.
- **Can Do:** Audit safe-zone clearance, verify pinned comment proof, approve complete social package for release.
- **Must Happen After Action:** Package unlocked for publishing scheduling.
- **Must NOT Be Allowed To Do:** Approve packages with missing Telugu pinned comments or incomplete safe-zone audits.

### UAC-009: Publishing Operator Workspace
- **Actor:** Publishing Operator (`PUBLISHING_OPERATOR`).
- **Can See:** Approved release packages, release calendar, channel targets, publishing status monitors.
- **Can Do:** Schedule broadcast, execute idempotent publish dispatch, monitor live broadcast confirmation.
- **Must Happen After Action:** Broadcast record created with live platform IDs; item status becomes `PUBLISHED`.
- **Must NOT Be Allowed To Do:** Dispatch unapproved packages; execute duplicate publishing on already-published assets.

### UAC-010: Analytics Specialist & Performance Researcher
- **Actor:** Analytics Specialist (`ANALYTICS_SPECIALIST`) / Researcher.
- **Can See:** Live content performance dashboards, retention curves, milestone metrics (24h, 7d, 30d).
- **Can Do:** Trigger telemetry sync, correlate retention drop-offs with script timestamps, record pedagogical diagnostic findings.
- **Must Happen After Action:** Diagnostic findings linked to parent question and syllabus subtopic.
- **Must NOT Be Allowed To Do:** Mutate published broadcast records or upstream video metadata.

### UAC-011: Content Strategy Lead Workspace
- **Actor:** Content Strategy Lead / Curriculum Director (`CONTENT_STRATEGY_LEAD`).
- **Can See:** Aggregated channel performance, syllabus coverage heatmaps, student confusion patterns, AI-generated curriculum recommendations.
- **Can Do:** Author and approve Curriculum Sprint Directives to seed new question authoring batches.
- **Must Happen After Action:** New sprint directive dispatched to Question Author queues in Step 01.
- **Must NOT Be Allowed To Do:** Allow unreviewed AI recommendations to silently spawn production batches without human approval.

---

## 6. 02.3 Workflow Acceptance Criteria (Canonical 15 Stages)

The 15 stages must execute in strict sequential order. Bypass or stage-skipping is strictly rejected.

| Stage # | Stage Name | Entry Condition | Required Input | Required Output | Responsible Role | Valid Next Stage |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **01** | **Question Generation** | New content requirement or approved sprint directive | Syllabus taxonomy, difficulty, exam context | Complete draft question with 4 options, key & proof | `QUESTION_AUTHOR` | 02 |
| **02** | **Question Verification** | Question submitted by author (`DRAFT`) | Draft question entity | Certified verification record (`APPROVED`) | `ACADEMIC_VERIFIER` | 03 |
| **03** | **Audience Script** | Question is `VERIFIED` | Approved question | 5-part script (45–60s) locked for studio | `SCRIPTWRITER` | 04 |
| **04** | **Teleprompter & Filming** | Script is `LOCKED` | Locked script, studio presenter | Registered camera takes with external URIs | `PRESENTER` / `OPERATOR` | 05 |
| **05** | **Raw Video** | Takes recorded and selected | Selected camera takes | Registered raw video package | `STUDIO_OPERATOR` | 06 |
| **06** | **Editing Bay** | Raw video package handed off | Raw takes, visual assets, script | Master cut metadata (URI, checksum, LUFS) | `VIDEO_EDITOR` | 07 |
| **07** | **Final QC** | Master cut submitted for inspection | Master cut entity | QC pass stamp (`QC_PASSED`) | `QC_OFFICER` | 08 |
| **08** | **Thumbnail** | QC certification approved | Master cut, question context | Approved thumbnail package (A/B/C) | `THUMBNAIL_DESIGNER` | 09 |
| **09** | **Social Review** | Master cut and thumbnail approved | Video, thumbnail, copy, pinned comment | Certified social release package | `SOCIAL_REVIEWER` | 10 |
| **10** | **Publishing Setup** | Social package approved | Certified release package | Staged distribution schedule | `PUBLISHING_OPERATOR` | 11 |
| **11** | **Published** | Staged schedule ready for release | Staged release package, target channels | Dispatched broadcast record with platform IDs | `PUBLISHING_OPERATOR` | 12 |
| **12** | **Platform Sync** | Content dispatched to public channels | Platform IDs, channel URLs | Verified live streaming playback status (HTTP 200) | `PUBLISHING_OPERATOR` | 13 |
| **13** | **Analytics** | Content verified live on platforms | External platform telemetry | Immutable milestone analytical snapshots | `ANALYTICS_SPECIALIST` | 14 |
| **14** | **Performance Review**| Analytical snapshots available | Retention curves, script, comments | Documented pedagogical drop-off findings | `CONTENT_STRATEGY_LEAD`| 15 |
| **15** | **Intelligence Loop** | Performance reviews completed | Diagnostic findings, syllabus stats | Approved sprint directive seeding Step 01 | `CONTENT_STRATEGY_LEAD`| 01 |

### Workflow Bypass Prevention Criteria

#### WAC-POS-01: Valid Sequential Transition
- **Given** an entity at Stage $N$ that has fulfilled all exit and approval criteria for Stage $N$,
- **When** an authorized user triggers transition to Stage $N+1$,
- **Then** the system transitions the entity to Stage $N+1$, records the transition in audit history, and updates active task queues.

#### WAC-NEG-01: Forward Stage Skip Rejection
- **Given** an entity currently at Stage 01 (`Question Generation`),
- **When** any user attempts to transition the entity directly to Stage 03 (`Audience Script`), Stage 04 (`Filming`), or Stage 11 (`Published`),
- **Then** the system immediately rejects the transition with error `INVALID_STAGE_TRANSITION`, logs a workflow violation warning, and preserves the entity at Stage 01.

#### WAC-NEG-02: Missing Prerequisite Gate Rejection
- **Given** an entity at Stage 06 (`Editing Bay`) where the master cut has NOT passed Final QC (Stage 07),
- **When** an editor or operator attempts to package thumbnails (Stage 08) or publish (Stage 11),
- **Then** the transition is rejected with error `PREREQUISITE_GATE_UNMET: FINAL_QC_REQUIRED`.

#### WAC-NEG-03: Reverse Regression Control
- **Given** an entity at Stage 07 (`Final QC`),
- **When** QC fails, the entity may ONLY be routed backwards to Stage 06 (`Editing Bay`) or Stage 04 (`Filming`) with formal defect documentation; it can NEVER transition directly to Published or Thumbnail.

---

## 7. 02.4 Security Acceptance Criteria

### SAC-001: Server-Authoritative Authentication
- **Given** an unauthenticated request to any operational API endpoint (except `/api/auth/login` and `/api/health`),
- **When** the request is received by the backend,
- **Then** the system responds with HTTP 401 Unauthorized and an informative JSON error envelope; client code is strictly prevented from bypassing this check.

### SAC-002: Role-Based Capability Authorization
- **Given** an authenticated user possessing only the `QUESTION_AUTHOR` role,
- **When** the user attempts an administrative or publishing action (e.g., `POST /api/publishing/dispatch` or `POST /api/questions/:id/verify`),
- **Then** the system rejects the request with HTTP 403 Forbidden and error code `INSUFFICIENT_CAPABILITY`.

### SAC-003: Anti-Self-Approval Enforcement (GAR-02)
- **Given** a user `U_1` who authored question `Q_1`,
- **When** user `U_1` attempts to execute verification `POST /api/questions/Q_1/verify`,
- **Then** the backend checks `author_id !== reviewer_id`, rejects the operation with HTTP 403 Forbidden and code `FORBIDDEN_SELF_APPROVAL`, and creates a security audit alert.

### SAC-004: Credential & Secret Protection
- **Given** server runtime configuration containing Google Cloud credentials, OAuth client secrets, or API keys,
- **When** any client inspects frontend bundles, network responses, or client-side storage,
- **Then** zero server secrets, service account private keys, or raw OAuth refresh tokens are exposed. All external API operations execute exclusively server-side.

### SAC-005: Security Auditability
- **Given** any security-sensitive event (failed login, forbidden access attempt, role escalation, data export, emergency override),
- **When** the event occurs,
- **Then** the system synchronously records an append-only security log containing actor IP, user agent, actor ID, action, resource target, and timestamp.

---

## 8. 02.5 Data Acceptance Criteria

### DAC-001: Entity Identity & Immutability
- **Given** a newly created business entity (Question, Script, Video, Thumbnail, Broadcast Record, Analytics Snapshot),
- **When** persisted to the authoritative datastore,
- **Then** the entity receives a globally unique, immutable identifier and created timestamp (ISO 8601 UTC) that can never be modified.

### DAC-002: Strict State Separation Axiom
- **Given** any managed content item in BP-CMS,
- **When** querying or mutating its state,
- **Then** the system maintains 5 distinct, uncoupled status fields:
  1. `workflow_step`: Canonical production stage (01 to 15)
  2. `entity_status`: Lifecycle condition of the record (`DRAFT`, `ACTIVE`, `ARCHIVED`)
  3. `media_status`: Readiness of linked external media (`PENDING`, `REGISTERED`, `VERIFIED`)
  4. `job_status`: Background processing state (`IDLE`, `QUEUED`, `PROCESSING`, `FAILED`)
  5. `publication_status`: External broadcast state (`UNPUBLISHED`, `SCHEDULED`, `PUBLISHED`, `SYNCED`)
- **Verification:** An update to `job_status` or `media_status` must NEVER accidentally mutate `workflow_step`.

### DAC-003: Concurrency & Atomic Transitions
- **Given** two concurrent users attempting to update the same entity simultaneously,
- **When** both submissions reach the backend,
- **Then** the system uses optimistic locking / version counters to ensure exactly one update succeeds; the second request receives HTTP 409 Conflict with current state and is prevented from silently overwriting data.

### DAC-004: Duplicate Entity Prevention
- **Given** an existing question with a specific mathematical stem and syllabus classification,
- **When** an author attempts to submit an identical question in the same category,
- **Then** the system triggers duplicate detection, displays the matching existing record, and warns the author before allowing draft creation.

### DAC-005: Referential Integrity Across Stages
- **Given** an Audience Script at Stage 03,
- **When** inspecting its relational links,
- **Then** it must maintain an unbroken foreign reference to its parent Verified Question; a Video Project must reference its Script; a Master Cut must reference its Video Project; and an Analytical Snapshot must reference its Broadcast Record.

---

## 9. 02.6 Media Acceptance Criteria

### MAC-001: External Binary Storage Boundary
- **Given** any video cut, camera take, or high-resolution thumbnail artwork,
- **When** registered with BP-CMS,
- **Then** the binary payload is stored in external object storage (Google Drive / Cloud Storage); BP-CMS stores ONLY the URI locator, storage provider ID, SHA-256 integrity checksum, file size in bytes, and mime type.
- **Failure Condition:** Any API payload attempting to upload raw video/audio base64 or binary data into the primary database is rejected with HTTP 413 Payload Too Large.

### MAC-002: Media Integrity Verification
- **Given** a registered master video cut with registered SHA-256 checksum,
- **When** handoff occurs between Editing Bay (Stage 06) and Final QC (Stage 07),
- **Then** the system verifies that the external storage URL is accessible and matches the recorded checksum before permitting QC inspection.
- **Failure Condition:** If the external file is inaccessible (HTTP 404/403) or checksum mismatches, the item is flagged `MEDIA_UNAVAILABLE` and cannot proceed.

### MAC-003: Media Lifecycle & Version Handoff
- **Given** a master cut requiring post-production revisions following a QC failure,
- **When** the editor uploads a revised cut,
- **Then** the system creates a new media asset version (`cut_version = 2`), retains the previous version in history, updates the active pointer, and records the change in the production audit log.

---

## 10. 02.7 Performance Acceptance Criteria

> [!IMPORTANT]
> In accordance with Stage 01 governance, arbitrary numerical performance targets must not be invented. Where specific thresholds are not defined in Stage 01, they are explicitly marked below.

| Operation | Expected Condition | Measurement Method | Acceptance Threshold | Failure Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Page Load** | Authenticated user navigates between operational workspaces | Browser Performance Navigation Timing | *Threshold requires future architectural/performance decision.* | UI freeze or blank page > 5s |
| **Standard API Request** | Read/write queries for questions, scripts, assignments | Server-side request duration logging | *Threshold requires future architectural/performance decision.* | Request timeout (HTTP 504) |
| **Long-Running Operations** | Video checksum hashing, AI generation, analytics ingestion | Asynchronous background execution | Operation must execute asynchronously without blocking main thread | Synchronous HTTP blocking > 30s |
| **Concurrent Workflow Edits** | Multiple operators working in distinct workspaces | Database lock wait time | Zero deadlocks; atomic write commits | Database lock timeout or corrupted records |
| **Teleprompter Display** | Presenter scrolling teleprompter text during filming | Frame render cadence | Smooth 60fps rendering without stutter | Visible dropped frames or script lag |

---

## 11. 02.8 Cost Acceptance Criteria

### CAC-001: Initial Infrastructure Investment Ceiling (COST-001)
- **Constraint:** **₹0 – ₹100** initial infrastructure expenditure.
- **Given** the BP-CMS deployment topology and hosting architecture,
- **When** auditing recurring or upfront infrastructure costs,
- **Then** the system must run entirely within free-tier allowances (e.g., Google Cloud free tier, Google Workspace developer quotas, local/serverless execution); total invoiced cost must equal **₹0.00** (strictly $\le$ ₹100).
- **Failure Condition:** Any architectural component requiring a paid commercial license, paid cloud database instance, or recurring credit card charge fails cost acceptance.

### CAC-002: Zero-Cost Persistence & Storage Verification
- **Given** the persistence mechanism for application records and external media,
- **When** evaluating storage operational expense,
- **Then** all structured records utilize zero-cost persistence (Google Sheets API / SQLite / local container volumes) and media assets utilize existing Google Drive storage allowances without dedicated enterprise storage fees.

---

## 12. Stage 01 → Stage 02 Traceability Matrix

| Stage 01 Requirement | Stage 02 Acceptance Criteria | Verification Scope | Future Verification Method |
| :--- | :--- | :--- | :--- |
| **BR-001** (Question Production) | `BAC-001.1`, `BAC-001.2`, `UAC-001` | Draft authoring, options, proof, Telugu/English, AI boundary | Unit + API Contract Tests |
| **BR-002** (Question Verification) | `BAC-002.1`, `BAC-002.2`, `BAC-002.3`, `UAC-002` | Verification checklist, GAR-02 anti-self-approval, revisions | Integration + Authorization Tests |
| **BR-003** (Script Production) | `BAC-003.1`, `BAC-003.2`, `UAC-003` | 5-part structure, pacing check (45–60s), teleprompter lock | Unit + Workflow Tests |
| **BR-004** (Video Production) | `BAC-004.1`, `BAC-004.2`, `BAC-004.3`, `UAC-004`, `UAC-005`, `UAC-006` | Camera take logging, raw video handoff, master cut QC | Integration + QC Gate Tests |
| **BR-005** (Thumbnail Production) | `BAC-005.1`, `UAC-007` | High-contrast artwork, answer-leak guard, variants A/B/C | Automated Rule + UI Acceptance Tests |
| **BR-006** (Social Review) | `BAC-006.1`, `UAC-008` | 9:16 simulator safe zones, Telugu pinned comment check | UI Component + E2E Tests |
| **BR-007** (Publishing) | `BAC-007.1`, `UAC-009` | Idempotent dispatch, release scheduling, duplicate guard | API + Integration Tests |
| **BR-008** (Platform Sync) | `BAC-008.1` | Public link verification, HTTP 200 health, status parity | External Mock Integration Tests |
| **BR-009** (Analytics) | `BAC-009.1`, `UAC-010` | Milestone ingestion (24h/7d/30d), retention curve immutability | Data Pipeline Tests |
| **BR-010** (Performance Review) | `BAC-010.1`, `UAC-010` | Pedagogical drop-off correlation with script/formulas | Workflow + Data Tests |
| **BR-011** (Intelligence Loop) | `BAC-011.1`, `UAC-011` | Closed-loop curriculum sprint directives seeding Step 01 | E2E Round-Trip Tests |
| **NFR-001** (Reliability) | `DAC-001`, `DAC-003` | Zero silent data loss, atomic writes, version counters | Concurrency Stress Tests |
| **NFR-002** (Performance) | Table in Section 10 | Async tasks, non-blocking UI, responsive forms | Latency Benchmark Tests |
| **NFR-003** (Security) | `SAC-001`, `SAC-002`, `SAC-004` | Session auth, server-authoritative RBAC, secret isolation | Security Penetration Tests |
| **NFR-004** (Scalability) | `DAC-001`, `DAC-004` | High volume of questions, takes, and analytics records | Load & Volume Tests |
| **NFR-005** (Maintainability) | `DAC-002` | Modular boundaries, strict state separation | Static Architecture Analysis |
| **NFR-006** (Cost) | `CAC-001`, `CAC-002` | Initial infrastructure cost ceiling ₹0–₹100 | Financial & Deployment Audit |
| **NFR-007** (Availability) | `BAC-001.2`, `BAC-008.1` | Graceful degradation on third-party API outages | Fault Injection Tests |
| **NFR-008** (Auditability) | `SAC-005`, `BAC-001.1`, `BAC-002.1` | Immutable append-only audit trail for all mutations | Audit Log Ledger Verification |
| **COST-001** | `CAC-001`, `CAC-002` | Hard cost ceiling ₹0–₹100 | Cost Verification Check |
| **Canonical Workflow** | Section 6 (`WAC-POS-01`, `WAC-NEG-01..03`) | 15 sequential stages, strict bypass prevention | Workflow Engine Test Suite |
| **State Separation** | `DAC-002` | 5 distinct decoupled state dimensions | Schema & Domain Contract Tests |
| **AI Boundary** | `BAC-001.2`, `BAC-011.1` | AI is assistive; human-gated approval mandatory | Workflow Gate Tests |
| **Media Boundary** | `MAC-001`, `MAC-002`, `MAC-003` | Media binaries externalized; metadata in CMS | Media Adapter Contract Tests |

---

## 13. Future Verification Method Mapping

Every acceptance criterion defined in this document will be verified in downstream engineering stages through one or more of the following formal testing methods:

1. **Unit Tests:** Verify individual business validation rules (e.g., question option count, answer-leak detection, spoken word count estimation).
2. **Integration Tests:** Verify interactions between domain services, repositories, and persistence adapters.
3. **API Contract Tests:** Verify HTTP status codes, JSON response envelopes, validation schemas (Zod), and error payloads.
4. **Authorization & RBAC Tests:** Verify that unauthorized users and unauthenticated sessions are strictly rejected with HTTP 401/403.
5. **Workflow Transition Tests:** Verify the canonical 15-step state machine, ensuring valid transitions succeed and illegal bypasses fail.
6. **Concurrency & Locking Tests:** Verify optimistic concurrency controls and race-condition prevention under simulated simultaneous writes.
7. **UI Component & Acceptance Tests:** Verify safe-zone simulator overlays, teleprompter pacing controls, and interactive verification forms.
8. **End-to-End (E2E) Lifecycle Tests:** Verify the complete journey of a content item from Stage 01 Question Generation to Stage 15 Closed-Loop Feedback.
9. **Fault Injection & Resilience Tests:** Verify that third-party API failures (YouTube, Gemini, Google Drive) fail gracefully without corrupting internal CMS state.
10. **Cost & Infrastructure Audit:** Verify that deployment topology remains strictly within the ₹0–₹100 financial ceiling.

---

## 14. Explicit Unresolved / Threshold Decisions

In accordance with strict SDLC discipline, the following parameters remain open for decision in later architecture and engineering stages:
- **API Latency SLA Thresholds:** Specific millisecond targets (e.g., p95 < 200ms) will be benchmarked and finalized during Stage 10 (Frontend Architecture) and Stage 13 (API Design).
- **Physical Datastore Engine:** Final selection between Google Sheets, PostgreSQL, SQLite, or Cloud SQL will be evaluated in Stage 12 (Database Architecture).
- **Background Job Queue Provider:** Selection of in-memory vs Redis vs Cloud Tasks queue mechanism deferred to Stage 17.
- **Realtime Teleprompter Sync Protocol:** Protocol selection (Server-Sent Events vs WebSockets vs long polling) deferred to Stage 16.

---

## 15. Stage 02 Completion Checklist

- [x] Every Stage 01 requirement (`BR-001` through `BR-011`) has measurable acceptance coverage.
- [x] User acceptance conditions defined across all 12 operational roles.
- [x] All 15 canonical workflow stages have detailed entry, exit, input, output, and role criteria.
- [x] Positive and negative workflow transition criteria defined (bypass prevention).
- [x] Security acceptance criteria defined (auth, server-authoritative RBAC, GAR-02 anti-self-approval).
- [x] Data acceptance criteria defined (identity, State Separation Axiom, concurrency, referential integrity).
- [x] Media acceptance criteria defined (external storage boundary, checksums, versioning).
- [x] Performance acceptance criteria defined without invented numerical targets.
- [x] Cost acceptance criteria explicitly enforce the ₹0–₹100 ceiling (`COST-001`).
- [x] Comprehensive Stage 01 $\rightarrow$ Stage 02 traceability matrix established.
- [x] Future verification methods mapped for every criterion.
- [x] Zero production application source code modified.
- [x] Zero runtime behavior modified.

```
================================================================================
STAGE 02 — BUSINESS ACCEPTANCE CRITERIA
================================================================================
Artifact:            docs/requirements/02-BUSINESS-ACCEPTANCE-CRITERIA.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 02 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 02. Awaiting Stage 03 Instruction.
================================================================================
```
