# 07 — CANONICAL 15-STEP WORKFLOW
## Burra Pariksha Content Management System (BP-CMS)
### Stage 07 of 30-Stage Modernization Program — Authoritative Business Workflow Contract

```
================================================================================
Document ID:       BP-ARCH-07-WORKFLOW
Version:           7.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE CONTRACT
Scope:             Canonical 15-Stage Business Workflow Contract
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
Downstream Stages: 08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATA-ARCHITECTURE.md
                   13-API-CONTRACT.md
                   14+ Implementation Stages
Target Entity:     Content (Aggregate Root) & WorkflowInstance
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document defines the authoritative, mandatory **Business Workflow Contract** for the Burra Pariksha Content Management System (BP-CMS). It formalizes the exact sequential business progression, quality gates, actor roles, input/output artifacts, failure models, revision routing, and bypass-prevention invariants across all 15 stages of the educational content lifecycle.

### 1.2 Anti-Overclaim Invariants
In accordance with the foundational Prime Directive of the BP-CMS SDLC:
1. **Specification Only:** This document defines the *contract* that future workflow engines, state machines, APIs, databases, and user interfaces must uphold. It does **not** claim that a newly unified workflow engine has been deployed or executed at runtime.
2. **Zero Runtime Code Modification:** No production TypeScript source code, Express server routes, React components, or background daemon jobs are modified within Stage 07.
3. **Zero Database DDL / Migration Execution:** No Google Sheets columns, SQL schemas, or database tables are created, altered, or migrated.
4. **Separation of Concerns:** Business Workflow Stage (macro operational position) is strictly decoupled from Technical Entity State (micro lifecycle status of individual domain entities).

---

## 2. Canonical 15-Stage Production Workflow Overview

The BP-CMS business lifecycle consists of **exactly 15 canonical stages**. These stages are sequential, strictly ordered, and immutable in definition. They cannot be merged, skipped, reordered, or split.

| # | Canonical Business Stage | Primary Responsibility | Bounded Context Owner | Primary Artifact Handled |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Question Generation** | AI drafting, taxonomy binding, Telugu distraction options, and mathematical proof formulation. | Curriculum & Question | `QuestionVersion` (Draft) |
| **02** | **Question Verification** | 10-point pedagogical audit, proof verification, editorial sign-off, and production queueing. | Curriculum & Question | `QuestionReview` (Approved) |
| **03** | **Audience Script** | 60-second presenter script drafting with 3-second hook, pacing markers, and speed tricks. | Studio Production | `ScriptVersion` (Locked) |
| **04** | **Teleprompter & Filming**| Studio presenter recording session using interactive auto-scroll teleprompter and multi-take logging. | Studio Production | `VideoTake` (Logged) |
| **05** | **Raw Video** | Raw camera footage ingestion, external Drive folder registration, and handoff to the editing bay. | Media Metadata & Storage | `MediaAsset` (Raw Footage) |
| **06** | **Editing Bay** | Video master cut assembly, dynamic Telugu captions, sound effects, graphics, and timer overlays. | Studio Production | `VideoEdit` (Master Cut) |
| **07** | **Final QC** | 6-point Master QC certification (9:16 safe-zones, audio LUFS, Telugu typo audit, timing check). | Studio Production | `VideoEdit.qcStatus` (Certified) |
| **08** | **Thumbnail** | High-CTR curiosity-framing thumbnail artwork creation, mobile simulation, and approval. | Packaging & Social | `Thumbnail` (Approved) |
| **09** | **Social Review** | 9:16 smartphone simulator inspection, copy packaging, hashtags, and pinned comment sign-off. | Packaging & Social | `SocialReview` (Approved) |
| **10** | **Publishing Setup** | Multi-platform scheduling, platform slot configuration, and pre-publish readiness confirmation. | Distribution & Sync | `PublishingPackage` (Scheduled) |
| **11** | **Published** | Live publication execution on YouTube Shorts, Instagram Reels, and Facebook Video with URL verification. | Distribution & Sync | `Publication` (Live Reference) |
| **12** | **Platform Sync** | Cross-platform metadata reconciliation, URL verification, and post-publish status confirmation. | Distribution & Sync | `Publication` (Reconciled) |
| **13** | **Analytics** | Scheduled ingestion of audience telemetry (24h/7d views, retention curves, engagement metrics). | Audience Analytics | `AnalyticsSnapshot` (Ingested) |
| **14** | **Performance Review** | Retention drop-off analysis, student confusion pattern identification, and editorial critique. | Audience Analytics | `PerformanceRecord` (Finalized) |
| **15** | **Intelligence Loop** | Pedagogical intelligence synthesis, topic recommendation extraction, and directives seeding future Step 01. | Pedagogical Intelligence | `IntelligenceInsight` (Approved) |

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CANONICAL 15-STAGE BUSINESS LIFECYCLE                                │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   [01 Q-Gen] ──► [02 Q-Verify] ──► [03 Script] ──► [04 Filming] ──► [05 Raw Video]
         ▲              │
         │ (Revisions)  ▼
   [10 Pub-Setup] ◄── [09 Soc-Rev] ◄── [08 Thumb] ◄── [07 Final QC] ◄── [06 Edit-Bay]
         │
         ▼
   [11 Published] ──► [12 Sync] ──► [13 Analytics] ──► [14 Perf-Rev] ──► [15 Intel-Loop]
                                                                                │
                                                                                ▼ (Directive)
                                                                       [NEW Content Cycle]
                                                                           [01 Q-Gen]
```

---

## 3. WorkflowInstance Domain Contract

### 3.1 Business Responsibility
A `WorkflowInstance` represents the end-to-end operational execution of the canonical 15-stage lifecycle for exactly one `Content` item (the Aggregate Root established in Stage 06). It serves as the single authoritative coordinator of business progression.

### 3.2 Field Contract
| Field Name | Type / Structure | Mutability | Business Responsibility |
| :--- | :--- | :---: | :--- |
| `id` | `BP-WFI-######` (UUID/String) | **Immutable** | Authoritative workflow execution identity. |
| `contentId` | `BP-CNT-######` | **Immutable** | Foreign correlation key linking directly to the parent `Content` aggregate root. |
| `currentStage` | Integer (`1` through `15`) | Mutable | Current canonical business stage of the workflow. |
| `stageStatus` | Enum (`NOT_STARTED`, `IN_PROGRESS`, `PENDING_REVIEW`, `CHANGES_REQUESTED`, `COMPLETED`, `BLOCKED`) | Mutable | Operational status within the current canonical stage. |
| `workflowStatus` | Enum (`ACTIVE`, `SUSPENDED`, `COMPLETED`, `TERMINATED`) | Mutable | High-level macro health status of the overall workflow instance. |
| `currentAssigneeId`| `BP-USR-######` (User Reference) | Mutable | Accountable user currently responsible for stage completion. |
| `assignedRole` | `Role` | Mutable | Authorized role required to perform stage actions. |
| `startedAt` | ISO-8601 Timestamp | **Immutable** | Timestamp when Step 01 was initiated. |
| `lastTransitionAt`| ISO-8601 Timestamp | Mutable | Timestamp when the most recent stage movement occurred. |
| `completedAt` | ISO-8601 Timestamp \| Null | Mutable | Timestamp when Step 15 was finalized (null while active). |
| `transitionCount` | Integer (Non-negative) | Mutable | Monotonically increasing counter of transitions executed. |

### 3.3 Lifecycle Rules
1. **Strict 1:1 Content Binding:** Exactly one active `WorkflowInstance` exists for each `Content` item.
2. **Sequential Progression:** `currentStage` can only advance forward to `currentStage + 1` via a validated `WorkflowTransition`.
3. **No Resetting History:** When Step 15 completes, the `WorkflowInstance` transitions to `workflowStatus = COMPLETED`. It is never reset to Step 01. Future cycles create a new `Content` item and a new `WorkflowInstance`.

---

## 4. WorkflowTransition Domain Contract

### 4.1 Business Responsibility
A `WorkflowTransition` is an **append-only, immutable historical record** of an actual movement from one stage or state to another. It provides undeniable operational auditability, accountability, and traceability.

### 4.2 Field Contract
| Field Name | Type / Structure | Mutability | Business Responsibility |
| :--- | :--- | :---: | :--- |
| `id` | `BP-WFT-######` (UUID/String) | **Immutable** | Authoritative transition event identity. |
| `workflowInstanceId`| `BP-WFI-######` | **Immutable** | Reference to the parent `WorkflowInstance`. |
| `contentId` | `BP-CNT-######` | **Immutable** | Correlation reference to the `Content` item. |
| `sourceStage` | Integer (`1` through `15`) | **Immutable** | The canonical stage where the transition originated. |
| `targetStage` | Integer (`1` through `15`) | **Immutable** | The canonical stage reached by the transition. |
| `transitionType` | Enum (`FORWARD_ADVANCE`, `REVISION_DISPATCH`, `REJECTION_HALT`, `RECOVERY_OVERRIDE`) | **Immutable** | Category of business movement. |
| `actorId` | `BP-USR-######` | **Immutable** | The authenticated user who authorized the transition. |
| `actorRole` | `Role` | **Immutable** | The verified role held by the actor at execution time. |
| `outcome` | Enum (`SUCCESS`, `REJECTED`, `CHANGES_REQUESTED`, `FAILED`) | **Immutable** | Business result of the transition attempt. |
| `reason` | String (Non-empty for rejections) | **Immutable** | Mandatory business explanation when rejecting or requesting revisions. |
| `prerequisiteGateCheck`| JSON / Boolean Matrix | **Immutable** | Snapshot of passed safety checklist validations. |
| `timestamp` | ISO-8601 Timestamp | **Immutable** | System timestamp when the transition was committed. |

### 4.3 Transition Audit Invariant
Under no circumstances may a `WorkflowTransition` record be modified, soft-deleted, or purged. Every transition must emit an asynchronous `AuditEvent` to the audit log.

---

## 5. Stage-by-Stage Specifications (Stages 01 through 15)

Every canonical stage is governed by a rigorous contract covering all 11 required operational dimensions.

```text
Stage Specification Schema:
├── A. Entry Condition
├── B. Owner (Provisional Role)
├── C. Inputs
├── D. Outputs
├── E. UI Workbench Responsibility
├── F. Actions
├── G. Validation Gate
├── H. Completion Criteria
├── I. Failure States
├── J. Revision Path
└── K. Next Step
```

---

### 5.1 Stage 01 — Question Generation

#### A. Entry Condition
- A new content production cycle has been initialized, OR an approved `IntelligenceInsight` from a previous production cycle has triggered a syllabus-driven generation task.
- The parent `Content` aggregate root and `WorkflowInstance` are instantiated in Stage `01`.

#### B. Owner
- **Primary Owner:** `Question Author` (`CONTENT_WRITER` / `CONTENT_CREATOR`)
- **Supervising Role:** `Lead SME` (`SUBJECT_MATTER_EXPERT`)

#### C. Inputs
- Syllabus topic, subtopic, grade level, and exam target (e.g., SSC CGL, RRB NTPC).
- Difficulty rating constraint (`EASY`, `MEDIUM`, `HARD`).
- Pedagogical directives and historical drop-off guidance from approved `IntelligenceInsight` (if available).
- Optional AI assistance prompts and prompt engineering templates.

#### D. Outputs
- Canonical `Question` aggregate child.
- `QuestionVersion` (Draft v1, mutable).
- Complete question prompt in Telugu and English.
- Exactly 4 distinct multiple-choice options with exactly 1 correct key.
- Step-by-step mathematical/logical solution proof with speed trick explanation.

#### E. UI Workbench Responsibility
- **Workbench:** Question Studio (`/studio`).
- **Primary View:** Dual-pane interface with AI prompt configuration and preview on the left, structured question schema editor on the right.
- **Controls:** "Generate with AI", "Validate Schema", "Save Draft", "Submit for Verification".
- **States:** Active draft editing, AI loading spinner, inline validation error callouts, submission confirmation modal.

#### F. Actions
- `createDraft()`: Instantiate a new draft question container.
- `generateAiCandidate()`: Request advisory candidate options and proofs from Gemini AI.
- `editQuestion()`: Manually adjust question text, distractors, options, or proof steps.
- `saveDraft()`: Persist working draft without advancing workflow.
- `submitForVerification()`: Trigger schema validation and dispatch to Stage 02.

#### G. Validation Gate
- Question text is non-empty in Telugu.
- Options array contains exactly 4 mutually exclusive choices.
- Correct answer index is unambiguously defined (0 to 3).
- Mathematical/logical proof is fully articulated with no missing steps.
- Syllabus taxonomy fields (`topic`, `subtopic`, `difficulty`) are strictly non-empty.

#### H. Completion Criteria
- Validated `QuestionVersion` is persisted.
- Submission action is executed by an authorized `Question Author`.
- Forward `WorkflowTransition` (01 → 02) is recorded.

#### I. Failure States
- **AI Service Unavailable:** Retryable external error; user falls back to manual authoring or retries generation.
- **Validation Failure:** Incomplete schema, duplicate options, or missing proof blocks submission.
- **Save Conflict:** Optimistic lock collision if edited concurrently.

#### J. Revision Path
- Remains in Stage 01. The author iterates on the draft until all schema validation gates pass.

#### K. Next Step
- **Stage 02 — Question Verification**

---

### 5.2 Stage 02 — Question Verification

#### A. Entry Condition
- Valid `QuestionVersion` successfully submitted from Stage 01.
- `WorkflowInstance.currentStage == 2` and `stageStatus == PENDING_REVIEW`.

#### B. Owner
- **Primary Owner:** `QA Reviewer` / `Lead SME` (`SUBJECT_MATTER_EXPERT` / `CONTENT_MANAGER`)
- **Constraint:** Strict anti-self-approval (`GAR-02`). Reviewer cannot be the author of the question draft.

#### C. Inputs
- Submitted `QuestionVersion` payload.
- Complete mathematical/logical solution proof and speed trick.
- Syllabus taxonomy and difficulty rating.
- Author identity metadata.

#### D. Outputs
- `QuestionReview` record containing decision (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`).
- 10-point pedagogical audit checklist results.
- Locked `QuestionVersion` (immutable upon approval).
- Queued studio project binding.

#### E. UI Workbench Responsibility
- **Workbench:** Question Verification (`/questions/:id/verify`).
- **Primary View:** Read-only question presentation with interactive 10-point pedagogical audit checklist and mathematical proof validator.
- **Controls:** "Certify & Approve", "Request Changes", "Reject Question".
- **States:** Pending review, proof inspection view, feedback modal for rejections/changes.

#### F. Actions
- `inspectQuestion()`: Review question structure and verify mathematical proof steps.
- `executeAuditChecklist()`: Complete the 10-point pedagogical evaluation.
- `approveQuestion()`: Lock the question version and dispatch to Stage 03.
- `requestChanges()`: Provide structured feedback notes and return to Stage 01.
- `rejectQuestion()`: Terminate the draft with permanent rejection remarks.

#### G. Validation Gate
- Anti-Self-Approval check (`reviewerId !== question.authorId`).
- 10-point pedagogical criteria all certified `PASS`.
- Mathematical proof independently verified by the SME.
- Mandatory remarks provided if changes are requested or rejected.

#### H. Completion Criteria
- `QuestionReview` persisted with decision `APPROVED`.
- `QuestionVersion.isLocked` set to `true`.
- Forward `WorkflowTransition` (02 → 03) recorded.

#### I. Failure States
- **GAR-02 Violation:** Author attempts self-approval; system rejects with HTTP 403.
- **Pedagogical Flaw:** Distractor ambiguity, incorrect proof step, or inappropriate difficulty.
- **Missing Remarks:** Attempting to reject without providing feedback.

#### J. Revision Path
- **Changes Requested:** Transitions 02 → 01 (`REVISION_DISPATCH`). Question unlocks for author revisions.
- **Rejection:** Terminal transition (`REJECTION_HALT`). Workflow instance halts; question marked archived.

#### K. Next Step
- **Stage 03 — Audience Script**

---

### 5.3 Stage 03 — Audience Script

#### A. Entry Condition
- Question successfully verified and locked in Stage 02.
- `WorkflowInstance.currentStage == 3`.

#### B. Owner
- **Primary Owner:** `Scriptwriter` (`CONTENT_WRITER` / `CONTENT_CREATOR`)
- **Supervising Role:** `Creative Director` (`CONTENT_MANAGER`)

#### C. Inputs
- Verified, locked `QuestionVersion` (text, options, proof, speed trick).
- Audience target profile and 60-second YouTube Shorts / Reels formatting rules.
- Approved pacing and retention guidelines.

#### D. Outputs
- `Script` entity container.
- `ScriptVersion` (Draft v1, progressing to Locked).
- Spoken script text in Telugu formatted with 3-second hook, solution breakdown, and call-to-action (CTA).
- Estimated teleprompter speech duration (target: 45–58 seconds).

#### E. UI Workbench Responsibility
- **Workbench:** Script Studio (`/videos/:id?tab=script`).
- **Primary View:** Side-by-side view with verified question on the left and structured script editor (Hook, Problem, Solution, Speed Trick, CTA) on the right.
- **Controls:** "AI Script Assistant", "Calculate Pacing", "Save Script Draft", "Lock Script for Filming".
- **States:** Editing mode, word-count / timing indicator (Green = 45–58s, Red = >60s), lock confirmation.

#### F. Actions
- `draftScript()`: Author spoken dialogue for presenter delivery.
- `generateAiScript()`: Request conversational hooks and Telugu pacing suggestions from AI.
- `validatePacing()`: Execute syllable/word count duration estimator.
- `lockScript()`: Freeze the script version and dispatch to Stage 04.

#### G. Validation Gate
- Hook statement occurs within the first 15 words (3-second rule).
- Total estimated delivery duration strictly between 40 and 59 seconds.
- Spoken answer and solution step align perfectly with verified `QuestionVersion`.
- Telugu phonetic readability verified (no awkward transliterations).

#### H. Completion Criteria
- `ScriptVersion.isLocked == true`.
- Script status set to `SCRIPT_READY`.
- Forward `WorkflowTransition` (03 → 04) recorded.

#### I. Failure States
- **Duration Exceeded:** Script exceeds 60 seconds; teleprompter pacing gate fails.
- **Pedagogical Drift:** Script contradicts the verified mathematical proof.
- **Formatting Incomplete:** Missing hook or call-to-action sections.

#### J. Revision Path
- Remains in Stage 03 until word count, timing, and content checks pass.
- If verified question has an underlying flaw discovered during scripting, an escalation transition (03 → 01) requires Lead SME sign-off.

#### K. Next Step
- **Stage 04 — Teleprompter & Filming**

---

### 5.4 Stage 04 — Teleprompter & Filming

#### A. Entry Condition
- `ScriptVersion` is locked and in status `SCRIPT_READY`.
- Studio presenter and recording studio environment prepared.

#### B. Owner
- **Primary Owner:** `Presenter` (`PRESENTER` / `TALENT`)
- **Studio Lead:** `Camera Operator / Production Lead` (`PRODUCER`)

#### C. Inputs
- Locked `ScriptVersion` formatted for teleprompter display.
- Studio recording parameters (camera framing, microphone levels, lighting setup).

#### D. Outputs
- `Video` entity instantiated.
- One or more `VideoTake` records logged with timestamps, duration, take number, and presenter rating.
- Selected "Golden Take" identifier for editing bay handoff.

#### E. UI Workbench Responsibility
- **Workbench:** Studio Teleprompter & Recording Console (`/videos/:id?tab=recording`).
- **Primary View:** Fullscreen teleprompter with variable speed auto-scroll, large-font Telugu script rendering, and take logging drawer.
- **Controls:** "Start Prompt", "Speed +/-", "Pause/Resume", "Log Take (Good/Bad)", "Complete Filming Session".
- **States:** Prompter scrolling state, take logging modal, session summary review.

#### F. Actions
- `startPrompterSession()`: Launch auto-scroll teleprompter display.
- `logTake()`: Record take metadata (take number, file identifier, duration, quality score, notes).
- `selectGoldenTake()`: Mark the preferred take for editor handoff.
- `completeFilming()`: Finalize recording session and advance workflow.

#### G. Validation Gate
- At least one take logged with status `USABLE` or `GOLDEN`.
- Logged take duration aligns with script duration (40–60 seconds).
- Presenter and operator sign-off confirmed.

#### H. Completion Criteria
- Selected `VideoTake` identified and linked to parent `Video` record.
- `Video.status` transitions to `RECORDED`.
- Forward `WorkflowTransition` (04 → 05) recorded.

#### I. Failure States
- **Presenter Technical Flub:** Presenter stumbles or misreads; take marked `UNUSABLE`. Session continues until a good take is achieved.
- **Studio Hardware Failure:** Camera or audio equipment failure; session paused in Stage 04 (`stageStatus = BLOCKED`).

#### J. Revision Path
- Re-take executed immediately within Stage 04 without resetting upstream stages.
- If script wording is physically unreadable by presenter, formal request to unlock returns to Stage 03 (`REVISION_DISPATCH`).

#### K. Next Step
- **Stage 05 — Raw Video**

---

### 5.5 Stage 05 — Raw Video

#### A. Entry Condition
- Filming session completed; raw camera files stored on physical media.
- `WorkflowInstance.currentStage == 5`.

#### B. Owner
- **Primary Owner:** `Camera Operator / Media Ingestion Lead` (`PRODUCER`)

#### C. Inputs
- Physical/digital raw camera footage files.
- Selected `VideoTake` metadata from Stage 04.
- Dedicated Google Drive studio folder target.

#### D. Outputs
- `MediaAsset` registered in BP-CMS datastore.
- Valid `MediaReference` containing external Google Drive File ID and URI.
- SHA-256 checksum and verified MIME type (`video/mp4`, `video/quicktime`).

#### E. UI Workbench Responsibility
- **Workbench:** Raw Video Ingestion Bay (`/videos/:id?tab=recording` - Media Upload Drawer).
- **Primary View:** Drag-and-drop file ingestion zone with Google Drive upload progress, file integrity indicators, and raw playback preview.
- **Controls:** "Upload to Drive", "Attach Existing Drive Link", "Verify Media Integrity", "Dispatch to Editing Bay".
- **States:** Uploading progress bar, checksum computing indicator, verification badge, error state.

#### F. Actions
- `uploadRawFootage()`: Stream camera video binary to Google Drive via Drive API.
- `registerMediaReference()`: Link external Google Drive ID and metadata to `MediaAsset`.
- `verifyAssetIntegrity()`: Verify file accessibility, permissions, and streamability.
- `dispatchToEditing()`: Advance workflow to Stage 06.

#### G. Validation Gate
- External Google Drive file ID is non-empty and accessible via API.
- File MIME type matches allowed video formats (`mp4`, `mov`).
- File size > 5 MB and < 2 GB.
- Binary media isolation upheld: Zero raw video binary stored in application database.

#### H. Completion Criteria
- `MediaAsset` record committed with status `INGESTED`.
- `Video.rawMediaAssetId` bound to `MediaAsset.id`.
- Forward `WorkflowTransition` (05 → 06) recorded.

#### I. Failure States
- **Upload Timeout / Disconnect:** Network interruption during upload to Drive.
- **Permission Denied:** Google Drive folder authorization failure.
- **Corrupt File:** Missing audio stream or unreadable video container.

#### J. Revision Path
- Re-upload or re-select take within Stage 05.
- If raw footage is fundamentally corrupt, workflow returns to Stage 04 for a studio re-shoot (`REVISION_DISPATCH`).

#### K. Next Step
- **Stage 06 — Editing Bay**

---

### 5.6 Stage 06 — Editing Bay

#### A. Entry Condition
- Verified raw `MediaAsset` available and accessible.
- `WorkflowInstance.currentStage == 6`.

#### B. Owner
- **Primary Owner:** `Video Editor` (`VIDEO_EDITOR`)

#### C. Inputs
- Ingested raw `MediaAsset` (Google Drive stream link).
- Locked `ScriptVersion` for dialogue and caption alignment.
- Visual assets: Burra Pariksha branding lower-thirds, countdown timer overlays, sound effects.

#### D. Outputs
- `VideoEdit` entity containing master cut versioning.
- Rendered master cut `MediaAsset` registered on Google Drive.
- Editing cut metadata: duration, aspect ratio (9:16), audio LUFS estimate.

#### E. UI Workbench Responsibility
- **Workbench:** Editing Bay Console (`/videos/:id?tab=editing`).
- **Primary View:** Editor work order drawer showing script cues, download links for raw footage, master cut render uploader, and video preview player.
- **Controls:** "Download Raw Footage", "Upload Master Cut", "Validate Render Spec", "Submit for Final QC".
- **States:** Editing in progress, render upload progress, specification checklist, submission modal.

#### F. Actions
- `acceptEditingAssignment()`: Claim content item for active editing.
- `uploadMasterCut()`: Upload final rendered 1080x1920 video to Google Drive.
- `registerVideoEdit()`: Save master cut metadata and version number.
- `submitForQc()`: Dispatch rendered master cut to Stage 07.

#### G. Validation Gate
- Video resolution strictly 1080x1920 (9:16 vertical portrait).
- Video duration strictly between 45 and 59 seconds.
- Video container has both video and AAC audio tracks.
- Dynamic Telugu subtitles present and synchronized with spoken audio.
- Master cut uploaded to verified Google Drive path.

#### H. Completion Criteria
- `VideoEdit` record persisted with `isMasterCut = true`.
- `Video.status` set to `EDITED`.
- Forward `WorkflowTransition` (06 → 07) recorded.

#### I. Failure States
- **Spec Mismatch:** Editor uploads horizontal (16:9) video or video exceeding 60 seconds.
- **Audio Distortion:** Audio clips severely or is out of sync with video.
- **Drive Upload Failure:** Failure to stream rendered cut to Google Drive.

#### J. Revision Path
- Editor replaces render cut within Stage 06.
- If Master QC in Stage 07 rejects the cut, workflow returns to Stage 06 with explicit revision timecodes.

#### K. Next Step
- **Stage 07 — Final QC**

---

### 5.7 Stage 07 — Final QC

#### A. Entry Condition
- Rendered `VideoEdit` master cut submitted from Stage 06.
- `WorkflowInstance.currentStage == 7` and `stageStatus == PENDING_REVIEW`.

#### B. Owner
- **Primary Owner:** `Quality Control Lead / Producer` (`PRODUCER` / `CONTENT_MANAGER`)
- **Constraint:** Reviewer cannot be the Video Editor who submitted the cut (`GAR-02`).

#### C. Inputs
- Submitted `VideoEdit` master cut stream.
- Locked `ScriptVersion` and verified `QuestionVersion`.
- 6-Point Master QC specification standard.

#### D. Outputs
- `VideoEdit.qcStatus` set to `PASSED` or `REJECTED`.
- Completed 6-Point Master QC Audit Record.
- Specific timecoded defect remarks (if rejected).

#### E. UI Workbench Responsibility
- **Workbench:** Final QC Theater (`/videos/:id?tab=final-review`).
- **Primary View:** High-fidelity video player with 9:16 mobile safe-zone overlay toggles, audio waveform visualizer, and 6-point checklist.
- **Controls:** "Certify 6-Point QC & Approve", "Reject & Request Edit Revision", "Play at 0.5x/1x/2x".
- **States:** Inspection view, safe-zone violation highlighting, defect entry modal.

#### F. Actions
- `auditVideoQuality()`: Play video and review against 6-point criteria.
- `toggleSafeZones()`: Verify no critical text/graphics overlap UI elements (YouTube Shorts / Reels UI).
- `approveQc()`: Sign off on technical and visual quality.
- `rejectQc()`: Document specific revision items with exact video timecodes and reject.

#### G. Validation Gate
- Anti-Self-Approval verified (`qcReviewerId !== editorId`).
- 6-Point Master QC criteria all certified:
  1. Resolution: Exactly 1080x1920 (9:16).
  2. Safe-Zone: No text clipped by bottom title or right-side buttons.
  3. Audio Loudness: Normalized (-14 to -16 LUFS, no clipping).
  4. Subtitles: Zero Telugu orthographic or phonetic typos.
  5. Pacing: Hook delivery within 3 seconds; total duration < 60s.
  6. Visual Clarity: No compression artifacts or color banding.

#### H. Completion Criteria
- `VideoEdit.qcStatus` set to `PASSED`.
- `Video.status` set to `READY_TO_UPLOAD`.
- Forward `WorkflowTransition` (07 → 08) recorded.

#### I. Failure States
- **Safe-Zone Violation:** Telugu captions covered by Shorts bottom title area.
- **Typo in Subtitle:** Spelling mistake in Telugu technical term.
- **Audio Defect:** Muffled dialogue, music overpowers voice, or clipping.

#### J. Revision Path
- **QC Rejection:** Transitions 07 → 06 (`REVISION_DISPATCH`). Work returns to the Video Editor with required timecoded fixes.

#### K. Next Step
- **Stage 08 — Thumbnail**

---

### 5.8 Stage 08 — Thumbnail

#### A. Entry Condition
- Video master cut passed Stage 07 Final QC.
- `WorkflowInstance.currentStage == 8`.

#### B. Owner
- **Primary Owner:** `Graphic Designer / Thumbnail Artist` (`GRAPHIC_DESIGNER` / `CONTENT_CREATOR`)

#### C. Inputs
- Approved video context, verified question, and hook statement.
- Candidate thumbnail templates and Telugu typography font assets.
- Mobile CTR curiosity framing guidelines.

#### D. Outputs
- `Thumbnail` entity record.
- Candidate thumbnail artwork files uploaded to Google Drive.
- Selected and approved primary thumbnail image asset.

#### E. UI Workbench Responsibility
- **Workbench:** Thumbnail Studio (`/videos/:id?tab=thumbnail`).
- **Primary View:** Thumbnail artwork uploader, side-by-side A/B candidate comparator, and mobile smartphone search results simulator.
- **Controls:** "Upload Candidate", "Preview on Mobile Lockscreen", "Run CTR Simulator", "Approve Thumbnail".
- **States:** Candidate gallery, mobile preview modal, approval confirmation.

#### F. Actions
- `uploadThumbnailCandidate()`: Upload candidate PNG/JPG images to Google Drive.
- `previewMobileFraming()`: Inspect readability at small smartphone thumbnail scale.
- `selectApprovedThumbnail()`: Designate primary thumbnail asset for publication packaging.
- `submitThumbnail()`: Advance workflow to Stage 09.

#### G. Validation Gate
- Aspect ratio strictly 9:16 (for Shorts) and/or 16:9 (for YouTube standard preview).
- Image dimensions at least 1080x1920 (or 1280x720).
- File format strictly PNG or JPG; file size < 5 MB.
- Mobile readability check: Text legible at 100px width.
- External Google Drive file reference confirmed accessible.

#### H. Completion Criteria
- `Thumbnail.status` set to `APPROVED`.
- Primary `Thumbnail.mediaAssetId` linked to parent `Content`.
- Forward `WorkflowTransition` (08 → 09) recorded.

#### I. Failure States
- **Illegible Text:** Font too small or cluttered to read on mobile screens.
- **Asset Inaccessible:** Google Drive upload fails or permissions restricted.
- **Dimension Mismatch:** Image uploaded in unsupported aspect ratio.

#### J. Revision Path
- Designer uploads replacement candidate artwork within Stage 08.
- If upstream video hook changes, an authorized manager routes back to Stage 03.

#### K. Next Step
- **Stage 09 — Social Review**

---

### 5.9 Stage 09 — Social Review

#### A. Entry Condition
- Approved video cut (from Stage 07) and approved thumbnail (from Stage 08) ready.
- `WorkflowInstance.currentStage == 9`.

#### B. Owner
- **Primary Owner:** `Social Media Lead / Content Manager` (`SOCIAL_MEDIA_MANAGER` / `CONTENT_MANAGER`)

#### C. Inputs
- Approved video stream and primary thumbnail.
- Generated social post copy: Title, description, hashtags (#TeluguShorts, #BurraPariksha), and pinned engagement comment.
- Platform distribution requirements (YouTube, Instagram, Facebook).

#### D. Outputs
- `SocialReview` entity record.
- Certified social copy package: Final title, caption, hashtags, and pinned comment.
- Safe-zone mobile simulator audit sign-off.

#### E. UI Workbench Responsibility
- **Workbench:** Social Review Studio (`/social-review/:reviewId` or `/videos/:id?tab=social`).
- **Primary View:** Interactive 9:16 smartphone simulator displaying real-time video playback with platform UI overlays (YouTube Shorts & Instagram Reels skins), title text, and pinned comment preview.
- **Controls:** "Edit Social Copy", "Toggle Platform Skin", "Approve Social Package", "Request Packaging Revision".
- **States:** Interactive simulator mode, copy editing drawer, approval badge.

#### F. Actions
- `inspectSimulator()`: Verify video playback against platform UI chrome.
- `editSocialCopy()`: Refine title hook, description links, and hashtags.
- `verifyPinnedComment()`: Ensure educational challenge or question is present in the pinned comment.
- `approveSocialReview()`: Authorize packaging bundle for publishing configuration.

#### G. Validation Gate
- Anti-Self-Approval verified (`reviewerId !== scriptwriterId`).
- Video safe-zone verified with platform UI skins active.
- Title length strictly <= 95 characters (avoiding truncation on mobile).
- Hashtags contain required brand tags (`#BurraPariksha`, `#TeluguQuiz`).
- Pinned comment text explicitly defined.

#### H. Completion Criteria
- `SocialReview.status` set to `APPROVED`.
- Packaging bundle certified.
- Forward `WorkflowTransition` (09 → 10) recorded.

#### I. Failure States
- **UI Chrome Collision:** Key formula or presenter face obscured by platform like/comment buttons.
- **Title Truncation:** Essential question hook cut off by platform character limits.
- **Missing Pinned Comment:** Engagement strategy omitted.

#### J. Revision Path
- **Copy Revision:** Adjusted directly within Stage 09 by the Social Media Lead.
- **Thumbnail Defect:** Returns to Stage 08 (`REVISION_DISPATCH`) for artwork adjustment.
- **Video Defect:** Returns to Stage 06 (`REVISION_DISPATCH`) if visual overlay adjustment is needed.

#### K. Next Step
- **Stage 10 — Publishing Setup**

---

### 5.10 Stage 10 — Publishing Setup

#### A. Entry Condition
- `SocialReview` approved in Stage 09.
- `WorkflowInstance.currentStage == 10`.

#### B. Owner
- **Primary Owner:** `Release Coordinator / Publisher` (`PUBLISHER` / `CONTENT_MANAGER`)

#### C. Inputs
- Approved video cut, thumbnail, and certified social package.
- Target distribution channels (YouTube Shorts, Instagram, Facebook).
- Target publication schedule slot (immediate vs. scheduled release window).

#### D. Outputs
- `PublishingPackage` entity record.
- Scheduled dispatch configuration with UTC release timestamp.
- Pre-publish readiness validation report.

#### E. UI Workbench Responsibility
- **Workbench:** Publishing & Distribution Console (`/publishing`).
- **Primary View:** Multi-channel distribution matrix showing publishing checklist, platform destination toggles, schedule calendar, and pre-publish asset validator.
- **Controls:** "Select Schedule Time", "Run Pre-Publish Validation", "Lock & Schedule", "Publish Immediately".
- **States:** Configuration mode, pre-publish validation checklist (all green required), scheduled confirmation card.

#### F. Actions
- `configurePlatforms()`: Select target platforms and destination channels.
- `setPublishSchedule()`: Specify scheduled release timestamp or immediate flag.
- `runPrePublishValidation()`: Execute automated health check on all required assets and tokens.
- `commitPublishingPackage()`: Finalize package and queue for execution.

#### G. Validation Gate
- Master video asset and thumbnail asset confirmed reachable.
- Social copy and metadata complete for each selected platform.
- Scheduled timestamp is in the future (or immediate execution flag is true).
- External platform authorization credentials (OAuth tokens) verified valid.

#### H. Completion Criteria
- `PublishingPackage` persisted in status `READY` or `SCHEDULED`.
- Pre-publish readiness check certified 100%.
- Forward `WorkflowTransition` (10 → 11) recorded.

#### I. Failure States
- **Expired Token:** Platform OAuth credentials expired or invalid.
- **Missing Asset:** Thumbnail or video link broken or unreachable.
- **Scheduling Collision:** Another video already scheduled in the identical release slot.

#### J. Revision Path
- Configuration adjusted within Stage 10.
- If social copy requires editorial alteration, returns to Stage 09 (`REVISION_DISPATCH`).

#### K. Next Step
- **Stage 11 — Published**

---

### 5.11 Stage 11 — Published

#### A. Entry Condition
- `PublishingPackage` validated and scheduled slot reached (or manual publish triggered).
- `WorkflowInstance.currentStage == 11`.

#### B. Owner
- **Primary Owner:** `Distribution Specialist` (`PUBLISHER`) / `Automated Publishing Daemon`

#### C. Inputs
- Validated `PublishingPackage` and media asset references.
- Platform distribution adapters and API credentials.

#### D. Outputs
- `Publication` entity record(s) (one per target platform).
- External platform identifiers (`platformVideoId`, e.g., YouTube Video ID).
- Confirmed live canonical URLs.
- Publication execution timestamp.

#### E. UI Workbench Responsibility
- **Workbench:** Publishing Live Monitor (`/publishing`).
- **Primary View:** Real-time publishing activity monitor, API upload progress bars, live link confirmation drawer, and external URL launch buttons.
- **Controls:** "Execute Publish", "Verify Live Link", "Retry Platform Upload", "Manual URL Override".
- **States:** Publishing in progress, live verification success card, API error alert.

#### F. Actions
- `executePublish()`: Dispatch media and metadata to external platform APIs.
- `pollPublicationStatus()`: Confirm video is processed and live on the external platform.
- `recordPublicationUrl()`: Save verified public URL and platform video ID to `Publication`.
- `confirmLivePublication()`: Finalize publishing stage.

#### G. Validation Gate
- Platform API returns successful creation response with valid video ID.
- Live public URL matches canonical platform URL regex pattern:
  - YouTube: `^https:\/\/(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)[a-zA-Z0-9_-]{11}$`
  - Instagram: `^https:\/\/(www\.)?instagram\.com\/(reel|p)\/[a-zA-Z0-9_-]+`
- Video accessibility confirmed via public endpoint check.
- Never fabricate a publication record: Publication cannot be marked complete without an external identifier.

#### H. Completion Criteria
- `Publication` record persisted with status `LIVE`.
- Valid external video ID and verified URL stored.
- Forward `WorkflowTransition` (11 → 12) recorded.

#### I. Failure States
- **Platform API Rejection:** Quota exceeded, copyright strike, or file format rejection by platform.
- **Network Timeout:** Upload stream broken before platform receives complete binary.
- **Invalid URL:** Returned URL fails regex validation.

#### J. Revision Path
- Automated or manual retry of upload in Stage 11.
- If package metadata was rejected by platform rules, return to Stage 10 (`REVISION_DISPATCH`) to adjust configuration.

#### K. Next Step
- **Stage 12 — Platform Sync**

---

### 5.12 Stage 12 — Platform Sync

#### A. Entry Condition
- Live `Publication` record exists with confirmed platform video ID.
- `WorkflowInstance.currentStage == 12`.

#### B. Owner
- **Primary Owner:** `Social Operations Specialist` (`SOCIAL_MEDIA_MANAGER` / `PUBLISHER`)

#### C. Inputs
- Confirmed `Publication` record and external platform IDs.
- External platform APIs (YouTube Data API, Meta Graph API).

#### D. Outputs
- Reconciled `Publication` metadata.
- Verification of cross-platform description, tags, pinned comment placement, and monetization flags.
- Sync audit log entry.

#### E. UI Workbench Responsibility
- **Workbench:** Platform Packages & Sync Console (`/platform-packages`).
- **Primary View:** Multi-platform sync status dashboard displaying live post state, platform-specific metadata alignment, and discrepancy warnings.
- **Controls:** "Refresh Sync", "Reconcile Metadata", "Verify Pinned Comment Live", "Acknowledge Sync".
- **States:** Syncing spinner, synchronized status pill, mismatch warning alert.

#### F. Actions
- `fetchPlatformMetadata()`: Query platform API for current live video metadata.
- `reconcileMetadata()`: Compare live platform title/description with BP-CMS `PublishingPackage`.
- `confirmPinnedCommentLive()`: Verify that the educational pinned comment is actually posted and pinned.
- `completeSync()`: Finalize synchronization state.

#### G. Validation Gate
- Platform confirms video is public and streamable.
- External title and description match BP-CMS authoritative package.
- Pinned comment verified active on primary channel.

#### H. Completion Criteria
- Cross-platform synchronization verified and logged.
- `Publication.syncStatus` set to `SYNCHRONIZED`.
- Forward `WorkflowTransition` (12 → 13) recorded.

#### I. Failure States
- **Metadata Mismatch:** Manual change made directly on YouTube Studio causing drift.
- **Rate Limit:** Platform API rate limit exceeded during query.
- **Video Blocked:** Video geo-restricted or taken down by platform.

#### J. Revision Path
- Trigger re-sync or push authoritative BP-CMS metadata to platform.
- Note: A confirmed live publication is **never** rolled back simply because a sync query timed out.

#### K. Next Step
- **Stage 13 — Analytics**

---

### 5.13 Stage 13 — Analytics

#### A. Entry Condition
- Content published and synchronized; minimum telemetry maturation window reached (e.g., 24 hours post-publish).
- `WorkflowInstance.currentStage == 13`.

#### B. Owner
- **Primary Owner:** `Analytics Specialist` (`ANALYTICS_SPECIALIST` / `CONTENT_MANAGER`)

#### C. Inputs
- Confirmed `Publication` identifiers.
- Platform analytics reporting APIs (YouTube Analytics API).
- Target observation milestone intervals (24h, 48h, 7d).

#### D. Outputs
- `AnalyticsSnapshot` entity record(s).
- Raw audience telemetry: Total views, watch time, average view duration (AVD), completion rate %, like count, comment count, share count.
- Relative retention curve array (second-by-second audience percentage).

#### E. UI Workbench Responsibility
- **Workbench:** Social Analytics Studio (`/social-analytics/:contentId`).
- **Primary View:** Audience performance dashboard displaying headline KPI tiles, interactive second-by-second retention curve graph, and audience comment stream.
- **Controls:** "Fetch Latest Metrics", "Select Milestone (24h / 7d)", "Export Snapshot", "Submit for Performance Review".
- **States:** Ingesting metrics spinner, retention graph render, data freshness timestamp, ingestion error banner.

#### F. Actions
- `ingestAnalyticsSnapshot()`: Pull raw audience metrics from platform API.
- `parseRetentionCurve()`: Structure second-by-second retention data into standardized telemetry schema.
- `recordSnapshot()`: Persist immutable `AnalyticsSnapshot` record.
- `dispatchToReview()`: Advance workflow once minimum observation criteria are satisfied.

#### G. Validation Gate
- Ingested metrics originate from verified platform publication ID.
- Metric values are non-negative and mathematically consistent (e.g., completion rate <= 100%).
- Retention curve array length matches video duration in seconds.
- Observation milestone explicitly tagged (`MILESTONE_24H`, `MILESTONE_7D`).

#### H. Completion Criteria
- Authoritative `AnalyticsSnapshot` persisted.
- Minimum telemetry threshold met (e.g., 24-hour observation complete).
- Forward `WorkflowTransition` (13 → 14) recorded.

#### I. Failure States
- **Platform Telemetry Delay:** YouTube Analytics API lag (metrics not yet populated). System schedules a retry without failing workflow.
- **API Authentication Failure:** Analytics reporting OAuth scope missing.
- **Zero View Outlier:** Video has insufficient views to generate a statistically valid retention curve.

#### J. Revision Path
- System or user schedules a subsequent re-fetch of analytics.
- Existing historical snapshots remain immutable; new observations create a new `AnalyticsSnapshot`.

#### K. Next Step
- **Stage 14 — Performance Review**

---

### 5.14 Stage 14 — Performance Review

#### A. Entry Condition
- Authoritative `AnalyticsSnapshot` available for analysis.
- `WorkflowInstance.currentStage == 14`.

#### B. Owner
- **Primary Owner:** `Content Strategy Lead` (`CONTENT_MANAGER` / `PRODUCER`)

#### C. Inputs
- Ingested `AnalyticsSnapshot` (views, completion rate, retention drop-offs).
- Verified `QuestionVersion` and `ScriptVersion` for content cross-referencing.
- Historical benchmark metrics for the same syllabus topic.

#### D. Outputs
- `PerformanceRecord` entity record.
- Identified retention drop-off inflection points mapped to specific script lines.
- Qualitative diagnostic evaluation: Why students abandoned or re-watched (e.g., "Hook was misleading", "Speed trick was too fast").

#### E. UI Workbench Responsibility
- **Workbench:** Performance Review & Engagement Bay (`/analytics/engagement` or `/analytics/retention`).
- **Primary View:** Dual-synchronized view displaying the retention drop-off curve on the top and the synchronized video script on the bottom. Clicking a drop-off point highlights the exact spoken line.
- **Controls:** "Flag Drop-Off Point", "Tag Confusion Marker", "Save Performance Diagnostic", "Submit for Intelligence Loop".
- **States:** Diagnostic analysis mode, script alignment view, finalized review card.

#### F. Actions
- `analyzeRetentionDropOffs()`: Correlate audience drops with script timing.
- `tagConfusionPoints()`: Identify concepts where viewers repeatedly rewound or dropped off.
- `compilePerformanceFindings()`: Synthesize diagnostic review into structured findings.
- `finalizePerformanceReview()`: Commit `PerformanceRecord` and advance workflow.

#### G. Validation Gate
- Diagnostic findings are strictly evidence-based, directly referencing `AnalyticsSnapshot` data points.
- At least one pedagogical or engagement evaluation conclusion recorded.
- Reviewer identity and timestamp authenticated.
- Raw telemetry is strictly separated from human diagnostic interpretation.

#### H. Completion Criteria
- `PerformanceRecord` persisted with status `FINALIZED`.
- Forward `WorkflowTransition` (14 → 15) recorded.

#### I. Failure States
- **Inconclusive Data:** Retention curve flat or sample size too small for meaningful diagnosis.
- **Unsubstantiated Critique:** Reviewer records assertions contradicted by the analytics data.

#### J. Revision Path
- Reviewer refines analysis based on additional metrics.
- Prior drafts remain versioned; finalized review is locked.

#### K. Next Step
- **Stage 15 — Intelligence Loop**

---

### 5.15 Stage 15 — Intelligence Loop

#### A. Entry Condition
- `PerformanceRecord` finalized in Stage 14.
- `WorkflowInstance.currentStage == 15`.

#### B. Owner
- **Primary Owner:** `Executive Producer / Lead Pedagogical Strategist` (`CONTENT_MANAGER` / `ADMIN`)

#### C. Inputs
- Finalized `PerformanceRecord` and historical topic benchmarks.
- Cumulative syllabus performance trends across past 30 days.
- Optional AI pedagogical synthesis suggestions.

#### D. Outputs
- `IntelligenceInsight` entity record.
- Approved, actionable curriculum directive or question-generation guideline (e.g., "For Time & Work problems, explain ratio method before formula to reduce drop-off").
- Completion of the current `WorkflowInstance`.

#### E. UI Workbench Responsibility
- **Workbench:** Pedagogical Intelligence & Strategy Console (`/analytics/intelligence` or `/analytics/strategy`).
- **Primary View:** High-level curriculum intelligence board showing topic mastery trends, AI-synthesized pedagogical recommendations, and directive authorization queue.
- **Controls:** "Synthesize Insight", "Edit Directive", "Approve & Apply to Question Studio", "Complete Workflow Cycle".
- **States:** Advisory insight review, directive authoring drawer, finalized workflow celebration/archive card.

#### F. Actions
- `synthesizePedagogicalInsight()`: Generate candidate curriculum insights from cumulative performance records.
- `reviewDirective()`: Refine candidate recommendations into precise, human-verified rules.
- `approveDirective()`: Authorize insight to become active guidance for future Stage 01 Question Generation tasks.
- `closeWorkflowInstance()`: Mark current `WorkflowInstance` as `COMPLETED`.

#### G. Validation Gate
- Human-in-the-Loop Approval (Principle 09): AI recommendations are strictly advisory; directive must be explicitly authorized by an authenticated human strategist.
- Directive must specify target syllabus topic, subtopic, or pedagogical approach.
- Invariant: Current `WorkflowInstance` cannot reset back to Step 01. Step 15 completes the current workflow; approved insights feed into *future* independent workflow instances.

#### H. Completion Criteria
- `IntelligenceInsight` persisted with status `APPROVED`.
- `WorkflowInstance.workflowStatus` set to `COMPLETED`.
- `WorkflowInstance.completedAt` timestamp recorded.
- Terminal `WorkflowTransition` (15 → COMPLETED) logged.

#### I. Failure States
- **AI Hallucination:** AI proposes pedagogical rule unsupported by performance data. Rejected during human review.
- **Missing Attribution:** Attempting to publish an insight without human author sign-off.

#### J. Revision Path
- Strategist revises insight directive within Stage 15.
- Historical analytics and performance records remain permanently intact.

#### K. Next Step
- **Lifecycle Completion:** The current `WorkflowInstance` is closed and archived.
- **Future Production Seeding:** The approved `IntelligenceInsight` is stored in the pedagogical knowledge base and automatically surfaces in **Stage 01 (Question Generation)** for future question authoring tasks.

---

## 6. Canonical Forward Transition Matrix

Every forward movement between stages must satisfy strict entry conditions and prerequisite gates.

| Transition | Source Stage | Target Stage | Prerequisite Completion Gate | Authorized Role | Transition Type |
| :-: | :---: | :---: | :--- | :--- | :---: |
| **T01-02** | 01 Question Gen | 02 Question Verify | Valid 4-option Question schema, mathematical proof, and taxonomy complete. | Question Author | `FORWARD_ADVANCE` |
| **T02-03** | 02 Question Verify | 03 Audience Script | 10-point audit certified `PASS`, proof verified, anti-self-approval verified. | QA Reviewer / Lead SME | `FORWARD_ADVANCE` |
| **T03-04** | 03 Audience Script | 04 Filming | Script duration between 40-59s, hook within 3s, script locked. | Scriptwriter / Producer | `FORWARD_ADVANCE` |
| **T04-05** | 04 Filming | 05 Raw Video | Golden take logged, duration valid, presenter session finalized. | Camera Operator / Talent| `FORWARD_ADVANCE` |
| **T05-06** | 05 Raw Video | 06 Editing Bay | Raw media uploaded to Google Drive, SHA-256 verified, binary isolated. | Camera Operator / Media | `FORWARD_ADVANCE` |
| **T06-07** | 06 Editing Bay | 07 Final QC | 1080x1920 9:16 master cut rendered, synced subtitles, uploaded to Drive. | Video Editor | `FORWARD_ADVANCE` |
| **T07-08** | 07 Final QC | 08 Thumbnail | 6-point Master QC certified `PASS`, safe-zones and LUFS approved. | QC Reviewer / Producer | `FORWARD_ADVANCE` |
| **T08-09** | 08 Thumbnail | 09 Social Review | Primary thumbnail approved, mobile readability confirmed, Drive link valid. | Graphic Designer | `FORWARD_ADVANCE` |
| **T09-10** | 09 Social Review | 10 Pub Setup | 9:16 simulator audit passed, title <= 95 chars, pinned comment verified. | Social Media Lead | `FORWARD_ADVANCE` |
| **T10-11** | 10 Pub Setup | 11 Published | Pre-publish checklist 100%, scheduling slot assigned, credentials valid. | Publisher / System | `FORWARD_ADVANCE` |
| **T11-12** | 11 Published | 12 Platform Sync | Platform API confirms upload, live video ID & regex-verified URL saved. | Publisher / System | `FORWARD_ADVANCE` |
| **T12-13** | 12 Platform Sync | 13 Analytics | Platform sync confirmed, metadata reconciled, pinned comment verified live. | Social Ops Specialist | `FORWARD_ADVANCE` |
| **T13-14** | 13 Analytics | 14 Perf Review | Minimum observation window reached (24h), retention array persisted. | Analytics Specialist | `FORWARD_ADVANCE` |
| **T14-15** | 14 Perf Review | 15 Intel Loop | Evidence-based retention drop-off diagnosis finalized by strategist. | Content Strategy Lead | `FORWARD_ADVANCE` |
| **T15-END** | 15 Intel Loop | COMPLETED | Pedagogical directive human-approved, insight stored, workflow archived. | Executive Producer | `TERMINAL_COMPLETE` |

---

## 7. Revision & Failure Taxonomy & Routing Matrix

BP-CMS rejects the concept of a generic "FAILED" status. Failures are categorized into precise architectural failure types, each with a defined, non-destructive return route.

### 7.1 Failure Type Taxonomy
1. **Schema / Validation Failure:** Missing fields, invalid options, or malformed data preventing submission. Remains in current stage.
2. **Pedagogical Rejection:** Question or proof fails SME verification in Stage 02. Routes back to Stage 01.
3. **Technical QC Rejection:** Video cut fails 6-point QC in Stage 07. Routes back to Stage 06 with timecoded remarks.
4. **Packaging Rejection:** Social packaging or thumbnail fails review in Stage 09. Routes back to Stage 08 or 06 depending on defect.
5. **External Provider API Failure:** Transient network timeout, quota exceeded, or authorization token expired in Stages 11, 12, or 13. Retried in place without rolling back workflow stage.
6. **Telemetry Lag / Insufficient Data:** Analytics reporting delay from YouTube in Stage 13. Remains in Stage 13 with scheduled re-fetch.

### 7.2 Revision Routing Matrix
| Origin Stage | Triggering Event | Return Target Stage | Target Assignee | Impact on Upstream Artifacts |
| :---: | :--- | :---: | :--- | :--- |
| **02** | SME requests question changes | **01** Question Gen | Question Author | Unlocks `QuestionVersion` for revision (v2 created). |
| **02** | SME rejects question permanently | **TERMINATED** | None (Archived) | `WorkflowInstance` halted; marked `TERMINATED`. |
| **03** | Scriptwriter discovers question flaw | **01** Question Gen | Lead SME + Author| Requires formal escalation; unlocks Question. |
| **04** | Script unreadable / tongue-twister | **03** Audience Script | Scriptwriter | Unlocks `ScriptVersion` for revision (v2 created). |
| **05** | Raw footage corrupt / unusable | **04** Filming | Presenter / Camera | Filming session reopened for re-shoot. |
| **07** | Master cut fails 6-point QC | **06** Editing Bay | Video Editor | `VideoEdit` marked `REJECTED`; editor submits cut v2. |
| **09** | Thumbnail visual defect in review | **08** Thumbnail | Graphic Designer | Designer submits replacement artwork candidate. |
| **09** | Safe-zone text clipping in review | **06** Editing Bay | Video Editor | Editor adjusts graphic/caption placement. |
| **10** | Scheduling slot cancelled / altered| **10** Pub Setup | Publisher | Remains in Stage 10; slot re-assigned. |
| **11** | External platform upload API fails | **11** Published | Publisher / Daemon| Retry in place (exponential backoff). |
| **12** | Platform metadata out of sync | **12** Platform Sync | Social Ops | Re-push BP-CMS authoritative package to platform. |
| **13** | Analytics API metrics not yet ready | **13** Analytics | Analytics Lead | Scheduled re-fetch at +6 hours. |
| **14** | Diagnostic analysis incomplete | **14** Perf Review | Strategy Lead | Diagnostic draft updated using latest snapshot. |
| **15** | Directive rejected during review | **15** Intel Loop | Strategist | Directive refined or dismissed without resetting workflow. |

---

## 8. UI Workbench & Interaction Contract

The frontend user interface is an **operational window and request initiator**, not the authority for workflow progression.

### 8.1 Architectural UI Boundary Rules
1. **Frontend Proposes, Backend Disposes:** A UI workbench can request a stage transition via API. The backend workflow engine authoritatively evaluates the transition against prerequisite gates and RBAC permissions.
2. **No Client-Side State Forgery:** Frontend components must never assume a stage transition has succeeded until an authoritative HTTP 200 response with an updated `WorkflowInstance` envelope is received.
3. **Route Navigation ≠ Stage Completion:** Merely navigating to `/publishing` or `/videos/:id` does not advance or complete any business stage.
4. **Immutable State Protection:** Locked artifacts (e.g., locked scripts, approved QC cuts) must be rendered in read-only mode in subsequent workbenches, preventing accidental modification.

### 8.2 UI Workbench Responsibility Map
| Canonical Stage | Primary Workbench Component | Canonical URL Route | Primary Visual Information | Transition Trigger Action |
| :-: | :--- | :--- | :--- | :--- |
| **01** | `QuestionStudioPage` | `/studio` | AI prompt config, question editor, proof builder | "Submit for Verification" button |
| **02** | `QuestionVerifyApprovePage` | `/questions/:id/verify` | 10-point audit checklist, proof validator | "Certify & Approve" button |
| **03** | `VideoDetailPage` (`tab=script`) | `/videos/:id?tab=script` | Script editor, teleprompter pacing meter | "Lock Script for Filming" button |
| **04** | `VideoDetailPage` (`tab=recording`)| `/videos/:id?tab=recording` | Fullscreen teleprompter, take logger | "Complete Filming Session" button |
| **05** | `VideoDetailPage` (`tab=recording`)| `/videos/:id?tab=recording` | Drive upload drawer, checksum validator | "Dispatch to Editing Bay" button |
| **06** | `VideoDetailPage` (`tab=editing`) | `/videos/:id?tab=editing` | Render cut uploader, spec checklist | "Submit for Final QC" button |
| **07** | `VideoDetailPage` (`tab=final-review`)| `/videos/:id?tab=final-review`| 9:16 safe-zone player, 6-point QC audit | "Certify 6-Point QC" button |
| **08** | `VideoDetailPage` (`tab=thumbnail`)| `/videos/:id?tab=thumbnail`| Candidate comparator, mobile CTR preview | "Approve Thumbnail" button |
| **09** | `SocialReviewPage` | `/social-review/:reviewId` | 9:16 smartphone simulator, copy editor | "Approve Social Package" button |
| **10** | `PublishingPage` | `/publishing` | Multi-channel matrix, scheduling calendar | "Lock & Schedule" button |
| **11** | `PublishingPage` | `/publishing` | Live upload monitor, regex URL verifier | "Confirm Live Link" button |
| **12** | `PlatformPackagesPage` | `/platform-packages` | Sync reconciliation matrix, pinned comment check | "Complete Platform Sync" button |
| **13** | `SocialAnalyticsPage` | `/social-analytics/:contentId` | KPI summary tiles, retention drop-off curve | "Submit for Performance Review" |
| **14** | `AnalyticsExperiencePage` | `/analytics/engagement` | Synchronized retention-script diagnostic bay | "Finalize Diagnostic Review" |
| **15** | `AnalyticsExperiencePage` | `/analytics/intelligence` | Curriculum directive board, insight editor | "Approve & Complete Cycle" |

---

## 9. Ownership & Provisional Role Matrix

In alignment with Stage 06 Domain Model and anticipating Stage 09 RBAC, each stage is assigned to an authoritative business role:

| Canonical Stage | Primary Responsible Role | Supervising / Fallback Role | Anti-Self-Approval Restriction |
| :-: | :--- | :--- | :---: |
| **01** | `CONTENT_WRITER` / `CONTENT_CREATOR` | `CONTENT_MANAGER` / `ADMIN` | N/A |
| **02** | `SUBJECT_MATTER_EXPERT` | `CONTENT_MANAGER` / `ADMIN` | **MANDATORY (`GAR-02`):** Reviewer !== Author |
| **03** | `CONTENT_WRITER` / `CONTENT_CREATOR` | `CONTENT_MANAGER` | N/A |
| **04** | `PRESENTER` / `TALENT` | `PRODUCER` | N/A |
| **05** | `PRODUCER` / `CAMERA_OPERATOR` | `CONTENT_MANAGER` | N/A |
| **06** | `VIDEO_EDITOR` | `PRODUCER` | N/A |
| **07** | `PRODUCER` / `CONTENT_MANAGER` | `ADMIN` | **MANDATORY (`GAR-02`):** QC Reviewer !== Editor |
| **08** | `GRAPHIC_DESIGNER` / `CREATOR` | `CONTENT_MANAGER` | N/A |
| **09** | `SOCIAL_MEDIA_MANAGER` | `CONTENT_MANAGER` | **MANDATORY (`GAR-02`):** Reviewer !== Scriptwriter |
| **10** | `PUBLISHER` / `CONTENT_MANAGER` | `ADMIN` | N/A |
| **11** | `PUBLISHER` / `SYSTEM_DAEMON` | `ADMIN` | N/A |
| **12** | `SOCIAL_MEDIA_MANAGER` | `PUBLISHER` | N/A |
| **13** | `ANALYTICS_SPECIALIST` | `CONTENT_MANAGER` | N/A |
| **14** | `CONTENT_MANAGER` / `PRODUCER` | `ADMIN` | N/A |
| **15** | `CONTENT_MANAGER` / `ADMIN` | `ADMIN` | **MANDATORY:** Human Strategist !== AI Agent |

---

## 10. Hard Safety Gates & Bypass Prevention Rules

The canonical workflow enforces strict, non-bypassable sequence invariants. The backend rejects any out-of-order transition attempt.

### 10.1 Prohibited Sequence Bypasses
1. **Unverified Question Bypass Prohibited:** Step 01 cannot transition directly to Step 03. No script may be drafted for an unverified question.
2. **Self-Approval Bypass Prohibited (`GAR-02`):** Step 02 cannot be approved by the question author; Step 07 cannot be approved by the video editor.
3. **Unscripted Filming Bypass Prohibited:** Step 04 cannot proceed without a locked `ScriptVersion`.
4. **Raw Media Registration Bypass Prohibited:** Step 06 cannot proceed without a verified `MediaAsset` reference in Step 05.
5. **Uncertified Master Cut Bypass Prohibited:** Step 08 and Step 09 cannot be approved unless the master cut in Step 07 has `qcStatus == PASSED`.
6. **Social Review Bypass Prohibited:** Step 10 cannot schedule a publishing package without an approved `SocialReview` from Step 09.
7. **Fabricated Publication Bypass Prohibited:** Step 11 cannot transition to Step 12 without a verified external platform video ID and regex-validated public URL.
8. **Fabricated Analytics Bypass Prohibited:** Step 14 cannot record performance findings without an existing `AnalyticsSnapshot` from Step 13.
9. **Autonomous AI Approval Bypass Prohibited (Principle 09):** Step 15 cannot complete based solely on AI output; explicit human strategist sign-off is mandatory.
10. **History Erasure / Reset Bypass Prohibited:** Step 15 cannot reset the existing `WorkflowInstance` back to Step 01. History is append-only.

---

## 11. Idempotency & Retry Governance

To maintain data integrity in distributed cloud operations, retryable workflow actions must be strictly idempotent:

### 11.1 Idempotency Rules by Operation
1. **AI Generation Retries (Stages 01, 03, 15):** Re-generating AI content generates an alternative candidate version; it must never overwrite an existing locked version or create phantom workflow instances.
2. **Media Asset Registration (Stages 05, 06, 08):** Ingesting a file with an identical Google Drive File ID and SHA-256 checksum reuses the existing `MediaAsset` record rather than creating duplicate rows.
3. **Publication Execution (Stage 11):** Retrying a publish request uses a client-generated idempotency key (`contentId + platform + scheduleSlot`). If the video was already uploaded to YouTube, the adapter queries the existing video ID rather than uploading a duplicate video binary.
4. **Platform Synchronization (Stage 12):** Polling or re-running metadata sync is naturally idempotent; it updates `Publication.syncStatus` without creating duplicate publication records.
5. **Analytics Ingestion (Stage 13):** Ingesting analytics for a given milestone (e.g., `MILESTONE_24H`) updates the existing milestone snapshot row or inserts with a unique timestamp compound key (`publicationId + milestone`).

---

## 12. Workflow History & Audit Traceability Invariants

Every operational event in the workflow lifecycle must be permanently traceable.

### 12.1 History Traceability Rules
1. **Append-Only Transition Log:** Every stage movement creates an immutable `WorkflowTransition` row.
2. **Transition Metadata Requirements:** Each transition record must contain:
   - Exact source and target stage numbers.
   - Verified actor ID and role.
   - Accurate ISO-8601 UTC timestamp.
   - Outcome (`SUCCESS`, `REJECTED`, `CHANGES_REQUESTED`).
   - Detailed remarks (mandatory for rejections/changes).
   - Snapshot of passed safety checklist points.
3. **Audit Log Mirroring:** Every `WorkflowTransition` automatically triggers an immutable `AuditEvent` in the central audit system.
4. **Zero State Mutation of Past Records:** Under no circumstances may historical transitions be edited, reordered, or deleted to hide production delays or rejections.

---

## 13. Brownfield Workflow Mapping & Migration Strategy

Analysis of the Stage 03 baseline and current codebase reveals multiple legacy workflow implementations that must be converged into the canonical 15-step model:

| Current Implementation Mechanism | Baseline Location | Canonical Target Concept | Strategic Action | Detailed Migration / Refactoring Rationale |
| :--- | :--- | :--- | :---: | :--- |
| **`WorkflowOrchestrationService` (11 States)** | `src/lib/services/workflow-orchestration.service.ts` | Canonical 15-Step `WorkflowInstance` | **MIGRATE & RETIRE** | The legacy 11-state enum compresses production (Teleprompter, Raw Video, Editing, QC, Thumbnail all collapsed into `IN_PRODUCTION`) and omits analytics/intelligence. Migrate orchestration logic to 15 discrete steps. |
| **`CANONICAL_15_STEPS` Metadata** | `src/lib/workflow/canonical-workflow.ts` | 15-Step Contract Specifications | **CONSOLIDATE** | Align step definitions, labels, and routes with this canonical contract. Fix line 321 (`forwardStep: 1` loopback bug). |
| **Legacy `Workflow` Interface & Repository** | `src/types/index.ts`, `src/lib/repositories/workflow.repository.ts` | `WorkflowTransition` Entity | **MIGRATE & RENAME** | The existing `Workflow` table in Google Sheets acts as an ad-hoc transition log (`fromStatus`, `toStatus`). Formalize it as the immutable `WorkflowTransition` repository. |
| **`QuestionStatus` (7 states)** | `src/types/index.ts` | Micro-State of `Question` | **ISOLATE** | Decouple question entity status (`DRAFT`, `SUBMITTED`, `APPROVED`) from the macro `WorkflowInstance.currentStage`. |
| **`VideoProductionStatus` (9 states)** | `src/types/index.ts` | Micro-State of `Video` | **ISOLATE** | Decouple video production status (`QUEUED`, `RECORDING`, `EDITING`, etc.) from the global workflow stage. |
| **`ContentMaster` Workflow** | `src/lib/services/content-workflow.service.ts` | `Content` Workflow Coordinator | **CONSOLIDATE** | Unify `ContentMasterStatus` transitions into `WorkflowInstance` transitions bound to `Content`. |
| **Legacy Route Aliases** | `src/App.tsx` (e.g., `/videos/edit-video` redirects) | Canonical Workbench Routes | **KEEP** | Maintain backwards-compatible route redirects while standardizing on canonical workbench URLs. |
| **Ad-Hoc Direct Repository Mutations** | Various Express routes in `src/server/routes.ts` | Authoritative `WorkflowEngine` | **MIGRATE** | In Stage 19+, route all stage advancements through the centralized, authorized workflow engine rather than ad-hoc status patches. |

---

## 14. Stage 06 Domain Model Alignment & Consistency

The canonical workflow defined herein directly instantiates and governs the domain entities established in `docs/architecture/06-DOMAIN-MODEL.md`:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              STAGE 06 DOMAIN MODEL INTEGRATION                         │
 └────────────────────────────────────────────────────────────────────────────────────────┘
  Aggregate Root:
    └── Content (BP-CNT-######)
          │
          ├── Managed by: WorkflowInstance (BP-WFI-######) [Tracks Stage 1 to 15]
          │     └── Historical Log: WorkflowTransition (BP-WFT-######) [Append-Only]
          │
          ├── Stage 01–02: Question ──► QuestionVersion ──► QuestionReview
          ├── Stage 03:    Script ──► ScriptVersion
          ├── Stage 04–07: Video ──► VideoTake ──► VideoEdit
          ├── Stage 05:    MediaAsset (Raw) ──► MediaReference (Drive)
          ├── Stage 08:    Thumbnail ──► MediaReference (Drive)
          ├── Stage 09:    SocialReview
          ├── Stage 10–12: PublishingPackage ──► Publication ──► Platform
          ├── Stage 13:    AnalyticsSnapshot
          ├── Stage 14:    PerformanceRecord
          └── Stage 15:    IntelligenceInsight (Feeds future Content aggregate roots)
```

### 14.1 Alignment Confirmations
- **Single State Ownership:** `WorkflowInstance` is the sole owner of the macro business stage. Individual child entities (`Question`, `VideoEdit`, `Publication`) own only their micro-technical statuses.
- **Content as Anchor:** Every workflow transition references the parent `Content` ID, ensuring zero disjoint state across questions, videos, and publications.
- **Binary Media Boundary:** At no point in the 15-step workflow are raw media binaries ingested into workflow records or database rows.

---

## 15. Workflow Decision Register (WDR)

The following architectural decisions govern the canonical workflow design:

| Decision ID | Architectural Question | Decision Made | Rationale | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **WDR-001** | Should Step 15 loop back to Step 01 in the same `WorkflowInstance`? | **NO. A new `WorkflowInstance` and `Content` item must be created.** | Looping back in the same instance erases historical stage timing, violates immutability, and corrupts auditability. Approved insights feed future instances. | **CLOSED in Stage 07** |
| **WDR-002** | Can a single `Question` spawn multiple `Video` projects (1:N)? | **Provisional 1:1 binding for current scope; extensible to 1:N.** | Each `Content` item currently tracks one educational short. If 1:N is required, `Content` acts as the umbrella with branched child workflows. | **Stage 12 / Stage 16** |
| **WDR-003** | Should Stage 11 (Published) execute synchronously or asynchronously? | **Asynchronous job dispatch with webhook/polling confirmation.** | External video uploads take 30–120s; holding HTTP connections open causes gateway timeouts. | **Stage 13 / Stage 22** |
| **WDR-004** | How should 24h vs 7d analytics observation windows be handled? | **Stage 13 completes upon 24h snapshot; subsequent 7d snapshots attach asynchronously.** | Waiting 7 days before moving to Performance Review unacceptably stalls the intelligence feedback loop. | **Stage 12 / Stage 25** |

---

## 16. Database & Implementation Boundary Statement

> [!IMPORTANT]
> **Explicit Database & Implementation Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual and operational **Business Workflow Contract** for BP-CMS.
> 
> It does **NOT** define:
> - Physical database tables, column definitions, or foreign key constraints.
> - Google Sheets worksheet tabs, column mappings, or cell serialization logic.
> - Express server route endpoints, middleware, or HTTP handler implementations.
> - React UI component implementations, hooks, or Redux/Zustand state slices.
> - Automated background job runners, cron schedules, or worker queues.
> 
> Technical state modeling is deferred to **Stage 08 (State Model)**; physical persistence is deferred to **Stage 12 (Data Architecture)** and **Stage 16 (Persistence Implementation)**.

---

## 17. Traceability Matrix

### 17.1 Upstream Traceability (Stages 01–06 to Stage 07)
| Stage 07 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 2 (15 Steps)** | Stage 01 Section 6 & Stage 02 Section 02.2 | Enforces the canonical 15 business stages without addition or deletion. |
| **Section 3 & 4 (Instance/Transition)**| Stage 04 Principle 01 & Stage 06 Section 10 | Establishes `WorkflowInstance` and append-only `WorkflowTransition` contracts. |
| **Section 5.2 & 5.7 (Quality Gates)** | Stage 04 Principle 02 & Stage 06 Section 9 | Enforces `GAR-02` Anti-Self-Approval on Question Review and Final QC. |
| **Section 5.5 & 5.6 (Media Boundary)** | Stage 04 Principle 07 & Stage 05 Section 6 | Maintains externalized binary media isolation in Google Drive. |
| **Section 5.15 (Intelligence Loop)** | Stage 04 Principle 09 & Stage 06 Section 12 | Guarantees Human-in-the-Loop approval for pedagogical directives. |
| **Section 10 (Safety Gates)** | Stage 02 Acceptance Criteria AC-01 to AC-15 | Codifies prerequisite gates preventing bypass of any production stage. |

### 17.2 Downstream Traceability (Stage 07 to Future Stages)
| Downstream Stage | Consumed Workflow Artifact | Implementation Expectation |
| :--- | :--- | :--- |
| **Stage 08 — State Model** | Macro Stage vs. Micro State Contract | Decouples 5 discrete state dimensions across the 15 stages. |
| **Stage 09 — RBAC Model** | Ownership & Role Matrix (Section 9) | Maps granular capability tokens (`WORKFLOW_TRANSITION`, `QC_APPROVE`) to roles. |
| **Stage 11 — Page & Route Contract**| UI Workbench Map (Section 8) | Defines canonical page URLs and navigation rules for all 15 stages. |
| **Stage 12 — Data Architecture** | Instance & Transition Field Contracts | Maps `WorkflowInstance` and `WorkflowTransition` to physical Sheets/DB schemas. |
| **Stage 13 — API Contracts** | Transition Matrix & Rejection Routing | Designs REST envelopes and Zod schemas for `/api/workflow/transition`. |
| **Stage 19–26 — Implementation** | Complete Stage Specifications (Section 5)| Guides full-stack implementation of each stage workbench and engine. |

---

## 18. Stage 07 Completion Checklist & Sign-off

- [x] Read all six prior canonical artifacts (`01` through `06`).
- [x] Inspected existing brownfield workflow code (`canonical-workflow.ts`, `workflow-orchestration.service.ts`, `App.tsx`, `routes.ts`).
- [x] Defined exactly 15 canonical business stages in authoritative sequential order.
- [x] Formalized `WorkflowInstance` and `WorkflowTransition` business models.
- [x] Specified all 15 stages across all 11 required dimensions (A through K):
  - Entry Condition, Owner, Inputs, Outputs, UI Responsibility, Actions, Validation, Completion, Failure States, Revision Path, Next Step.
- [x] Resolved the Step 15 loopback bug: Established that Step 15 completes the instance and seeds a *new* production cycle.
- [x] Established Canonical Forward Transition Matrix (T01 through T15).
- [x] Codified precise Revision & Failure Taxonomy with non-destructive return routing.
- [x] Formulated UI Workbench Interaction Contract (Frontend proposes, Backend disposes).
- [x] Defined Provisional Ownership & Role Matrix with mandatory `GAR-02` quality gates.
- [x] Formalized 10 Hard Safety Gates preventing production sequence bypasses.
- [x] Established Idempotency and Retry Governance for distributed operations.
- [x] Defined Workflow History and Audit Traceability Invariants.
- [x] Conducted comprehensive Brownfield Mapping of legacy 11-state and entity-status systems.
- [x] Aligned with Stage 06 Domain Model (`Content` aggregate root integration).
- [x] Recorded Workflow Decision Register (`WDR-001` through `WDR-004`).
- [x] Enforced strict Database & Implementation Boundary Statement.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 07 — CANONICAL 15-STEP WORKFLOW
================================================================================
Artifact:            docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
Version:             7.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 07 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 07. Awaiting Stage 08 Instruction.
================================================================================
```
