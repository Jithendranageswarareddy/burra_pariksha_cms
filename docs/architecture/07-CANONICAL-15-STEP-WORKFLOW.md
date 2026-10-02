# Burra Pariksha CMS
# 07 — Canonical 15-Step Workflow

Stage: 07 — Canonical 15-Step Workflow

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
Defines the authoritative canonical business workflow contract for the Burra Pariksha Content Management System (BP-CMS). Establishes formal entry conditions, domain ownership, required inputs, outputs, conceptual UI workbenches, permitted actions, business validation rules, completion criteria, failure modes, revision pathways, and transition governance across all 15 canonical business stages.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 07 Canonical 15-Step Workflow | FACT |
| **File Path** | `docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md` | FACT |
| **Document Stage** | Stage 07 — Canonical 15-Step Workflow | FACT |
| **Authority** | Authoritative Business Workflow Specification & Stage Contract | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Accepted & Closed at commit `3577eb5`) | FACT |
| **Subsequent Stages** | Stage 08+ (Data Architecture, Target Schemas, Physical Storage Models, API Contracts) | FACT |
| **Baseline Repository Commit** | `3577eb5` | FACT |
| **Architectural Scope** | Exclusively defines business workflow stages, stage contracts, gates, and transitions without declaring database schemas or writing workflow engines | FACT |

---

## 02. Purpose

The objective of Stage 07 is to formalize the canonical business workflow contract for BP-CMS. The Burra Pariksha educational media pipeline is a precision manufacturing process that transforms curriculum concepts into high-engagement short-form video broadcasts (YouTube Shorts, Instagram Reels, Facebook Video), measures real student learning resonance, and loops pedagogical insights back into curriculum generation.

This specification guarantees:
1. **One Authoritative Workflow (AP-001):** The 15 stages documented herein are the sole canonical progression of BP-CMS. No secondary, divergent, or alternative workflow definitions exist.
2. **Business Stage vs. Technical Status Separation (AP-002):** The 15 steps represent true business stages. Technical processing states (e.g., `UPLOADING`, `TRANSCODING`, `QUEUED`), media storage states, and third-party API flags are internal operational sub-states that never masquerade as canonical stages.
3. **Deterministic Transitions (AP-003, AP-004, AP-005):** Transitions between stages are guarded by server-side business rules, prerequisite verifications, role authorizations, and mandatory human sign-off checkpoints (AP-009).
4. **Resilient Failure & Revision Paths:** Every stage defines explicit failure handling, rejection mechanisms, and rework pathways that preserve audit integrity and prevent orphaned work items.

---

## 03. Scope

### In-Scope
- Formal stage contracts for all 15 canonical business stages:
  1. 01 Question Generation
  2. 02 Question Verification
  3. 03 Audience Script
  4. 04 Teleprompter & Filming
  5. 05 Raw Video
  6. 06 Editing Bay
  7. 07 Final QC
  8. 08 Thumbnail
  9. 09 Social Review
  10. 10 Publishing Setup
  11. 11 Published
  12. 12 Platform Sync
  13. 13 Analytics
  14. 14 Performance Review
  15. 15 Intelligence Loop
- For every stage: Entry Condition, Owner, Inputs, Outputs, Conceptual UI Workbench, Permitted Actions, Backend Validations, Completion Criteria, Failure States, Revision Path, and Next Step.
- Sequential normal path progression and structured rework/loopback mechanics (specifically Stage 15 -> Stage 01).
- Human approval boundaries enforcing AP-009 (AI human-gating).
- External integration boundaries separating BP-CMS business stage from third-party provider status (Google Drive, YouTube, Meta, AI APIs, Email).
- Mapping and traceability of all 27 Stage 06 domain entities to workflow stages.
- Failure, recovery, notification, and audit models.
- Workflow invariants and testability guarantees.

### Out-of-Scope (Strict Non-Requirements for Stage 07)
- Declaring SQL database tables, migrations, DDL schemas, or ORM models.
- Writing REST endpoints, request/response DTOs, or server API routes.
- Creating or editing React UI components, CSS styles, or frontend routers.
- Introducing a secondary or replacement workflow engine in application code.
- Mutating live production data in Google Sheets or Google Drive.
- Provisioning cloud infrastructure or executing deployments.

---

## 04. Workflow Governance

The canonical 15-step workflow is governed by core architectural principles established in Stage 04:

1. **AP-001 (One Canonical 15-Step Business Workflow):** BP-CMS maintains exactly one canonical sequence of 15 business stages. All workspaces, navigation headers, dashboards, and APIs adhere strictly to this sequence.
2. **AP-002 (Business Stage vs. Technical State Separation):** Business stages reflect human and pedagogical milestones. Technical states (e.g., background render jobs, upload chunks, network retries) exist entirely within the boundary of an individual stage.
3. **AP-003 (One Authoritative Transition Mechanism):** All workflow progressions and rollbacks must pass through the centralized server-side transition validator (`validateCanonicalWorkflowTransition`). Client-side state mutations cannot advance workflow stages.
4. **AP-004 & AP-005 (Backend Authorization & Business-Rule Authority):** The backend evaluates user permissions, prerequisite gate checklists, and entity completeness before granting any stage change.
5. **AP-006 (Workflow Boundary):** Frontend views and mobile simulators display workflow state passively; workflow progression occurs only via authenticated backend commands.
6. **AP-009 (Human-Gated AI):** Artificial intelligence is strictly assistive. AI tools may draft questions, translations, scripts, or analytics summaries, but cannot approve, verify, sign off, or transition any workflow gate autonomously.
7. **AP-010 (Single State Ownership):** A content project has exactly one active canonical stage at any point in time. Multiple parallel contradictory stage states are prohibited.
8. **AP-015 (Testable Implementation):** Every entry condition, validation gate, and completion criterion must be objectively verifiable through automated tests.

---

## 05. Canonical 15-Step Overview

The following table summarizes the 15 canonical business stages of BP-CMS:

| Step # | Canonical Stage Name | Short Label | Domain Owner | Responsible Role / Capability | Input Entity (Stage 06) | Output Entity (Stage 06) | Completion Gate |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **01 Question Generation** | Question Gen | Question Domain | Content Creator / SME (`canCreateQuestion`) | Syllabus Node & Prompt Config | `Question` (`BP-Q-######`), `QuestionVersion` | 4-option schema, Telugu text, math proof created |
| **02** | **02 Question Verification** | Verification | Reviews Domain | Lead SME / QA Reviewer (`canApproveQuestion`) | `QuestionVersion` (Draft) | `QuestionReview` (`QV-######`), `Content` (`BP-C-######`) | 10-point pedagogical audit certified; anti-self-approval |
| **03** | **03 Audience Script** | Audience Script | Scripts Domain | Scriptwriter (`canCreateScript`) | Approved `Question` | `Script` (`BP-SCR-######`), `ScriptVersion` | 3-sec hook, 60-sec pacing, speed-trick reveal certified |
| **04** | **04 Teleprompter & Filming** | Filming | Videos Domain | Presenter / Host (`canRecordVideo`) | Approved `Script` | `Video` (`BP-V-######`), `VideoTake` (`TK##`) | Studio filming session completed, multi-takes logged |
| **05** | **05 Raw Video** | Raw Video | Media Metadata Domain | Production Lead / Camera (`canManageMedia`) | Raw Video Take File / Link | `MediaAsset` (`MED-######`), `MediaReference` | External Drive file attached, byte size and SHA-256 verified |
| **06** | **06 Editing Bay** | Editing Bay | Videos Domain | Video Editor (`canEditVideo`) | Raw `MediaReference` | `VideoEdit` (`ED##`), Rendered `MediaReference` | 9:16 master cut, subtitles, timer, -14 LUFS audio rendered |
| **07** | **07 Final QC** | Final QC | Reviews Domain | QC Lead / Producer (`canSignOffQC`) | `VideoEdit` (Master Cut) | QC Sign-off Record, Video Status `READY_TO_UPLOAD` | 6-point Master QC certified; human sign-off mandatory |
| **08** | **08 Thumbnail** | Thumbnail | Creative Assets Domain | Graphic Designer (`canManageMedia`) | Question Hook & Video Frame | `Thumbnail` (`THUMB-######`), `MediaReference` | High-CTR Telugu hook graphic uploaded and approved |
| **09** | **09 Social Review** | Social Review | Reviews Domain | Social Media Lead (`canSignOffQC`) | QC Video + `Thumbnail` | `SocialReview` (`SR-######`) | 9:16 smartphone simulator audit passed, safe-zones verified |
| **10** | **10 Publishing Setup** | Publishing Setup | Publishing Domain | Release Coordinator (`canTriggerPublish`) | `SocialReview` Bundle | `PublishingPackage` (`PUB-######`) | Multi-platform copy, hashtags, pinned comment scheduled |
| **11** | **11 Published** | Published | Publishing Domain | Distribution Specialist (`canTriggerPublish`) | Scheduled `PublishingPackage`| `Publication` (`PUB-######-XX`), Live URLs | Platform dispatch confirmed; live URL regex verified |
| **12** | **12 Platform Sync** | Platform Sync | Publishing Domain | Social Operations Specialist (`canSyncPlatforms`) | Live `Publication` | Synced Platform Packages | Cross-platform metadata, attribution, and permalinks verified |
| **13** | **13 Analytics** | Analytics | Analytics Domain | Analytics Specialist (`canManageAnalytics`) | Platform Content Identifiers | `AnalyticsSnapshot` | 24h / 7d views, retention, and engagement ingested |
| **14** | **14 Performance Review** | Performance Review | Analytics Domain | Content Strategy Lead (`canReviewPerformance`) | `AnalyticsSnapshot` Series | `PerformanceRecord` (`PERF-######`) | Retention curve drop-offs analyzed; benchmark tier assigned |
| **15** | **15 Intelligence Loop** | Intelligence Loop | Intelligence Domain | Executive Producer / Strategy Lead (`canGenerateIntelligence`) | `PerformanceRecord` Aggregations | `IntelligenceInsight` (`INTEL-######`) | Pedagogical insights generated; loopback to Stage 01 |

```
[01: Question Generation] ──► [02: Question Verification] ──► [03: Audience Script]
             │
             ▼
[04: Teleprompter & Filming] ─► [05: Raw Video]          ──► [06: Editing Bay]
             │
             ▼
[07: Final QC]            ──► [08: Thumbnail]           ──► [09: Social Review]
             │
             ▼
[10: Publishing Setup]    ──► [11: Published]           ──► [12: Platform Sync]
             │
             ▼
[13: Analytics]           ──► [14: Performance Review]  ──► [15: Intelligence Loop]
                                                                      │
                                                                      ▼ (Loopback)
                                                          [01: Question Generation]
```

---

## 06. Stage 01 — Question Generation

### 1. Entry Condition
The operator initiates question generation by selecting an authoritative curriculum node (`Class`, `Subject`, `Topic`, `Subtopic`) or by selecting an actionable `IntelligenceInsight` recommendation emitted by Stage 15.

### 2. Owner
**Domain Owner:** Question Domain.  
**Responsible Role / Capability:** Content Creator / Subject Matter Expert holding capability `canCreateQuestion`.

### 3. Inputs
- Curriculum taxonomy hierarchy (Class 6–10, Mathematics, Physical Science).
- Optional `IntelligenceInsight` record (`INTEL-######`) identifying high-difficulty syllabus concepts.
- Generation prompt configuration parameters (difficulty target, speed-trick requirements).

### 4. Outputs
- New `Question` business entity (`BP-Q-######`).
- Initial `QuestionVersion` (`BP-Q-######-V01`) containing Telugu problem text, 4 structured multiple-choice options, single correct answer key, and step-by-step mathematical proof.

### 5. UI (Conceptual Workbench)
- **Workbench:** Question Studio (`/studio`).
- **Information Shown:** Curriculum taxonomy selector, formula editor, Telugu script input keyboard/IME, AI prompt generator drawer, live 4-option preview card.
- **Controls & Actions:** "Generate with AI", "Translate to Telugu", "Validate Math Proof", "Save Draft", "Submit for Verification".

### 6. Actions
- `SELECT_TAXONOMY`: Choose Class, Subject, Topic, Subtopic.
- `DRAFT_QUESTION`: Author problem statement and multiple-choice options manually.
- `AI_ASSIST_GENERATE`: Request assistive draft generation from Gemini API.
- `VALIDATE_SCHEMA`: Run client-side schema preflight check.
- `SUBMIT_FOR_VERIFICATION`: Persist draft and transition to Stage 02.

### 7. Validation
Backend business rules enforce:
- Valid taxonomy node selection belonging to active curriculum tree.
- Telugu question text present, non-empty, and free of placeholder tokens.
- Exactly 4 distinct multiple-choice options (A, B, C, D) with non-empty content.
- Single unambiguous correct option designated (`A`, `B`, `C`, or `D`).
- Complete mathematical/logical solution proof explaining why the key is correct.
- Operator holds valid `canCreateQuestion` capability.

### 8. Completion Criteria
The Question entity is persisted with business ID (`BP-Q-######`), initial `QuestionVersion` is stored, and the content project transitions to Stage 02.

### 9. Failure States
- `ERR_TAXONOMY_MISSING`: No syllabus topic selected.
- `ERR_INVALID_OPTIONS`: Options count is not exactly 4, or options contain duplicates.
- `ERR_MISSING_PROOF`: Solution derivation is blank or mathematically incomplete.
- `ERR_AI_TRANSCRIPTION`: Raw AI output contains formatting errors or hallucinated terms.

### 10. Revision Path
If drafting fails validation or is deemed incomplete by the author, the work item remains in Stage 01 under draft status for editing.

### 11. Next Step
**Normal Next Stage:** Stage 02 (Question Verification).

---

## 07. Stage 02 — Question Verification

### 1. Entry Condition
Question exists in draft state with an active `QuestionVersion` submitted for review from Stage 01.

### 2. Owner
**Domain Owner:** Reviews Domain.  
**Responsible Role / Capability:** Lead Subject Matter Expert / QA Reviewer holding capability `canApproveQuestion`.

### 3. Inputs
- `Question` entity (`BP-Q-######`).
- `QuestionVersion` (`BP-Q-######-V01`) submitted for verification.
- 10-point pedagogical audit checklist rubric.

### 4. Outputs
- `QuestionReview` record (`QV-######`) recording checklist responses, feedback notes, reviewer identity, timestamp, and verdict.
- Overarching `Content` project entity (`BP-C-######`) initialized upon approval.
- Associated `Video` project entity (`BP-V-######`) queued in status `QUEUED`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Question Verification Workspace (`/questions/:id/verify`).
- **Information Shown:** Side-by-side Telugu question text, mathematical proof breakdown, distractor analysis, 10-point interactive audit checklist, author attribution.
- **Controls & Actions:** "Pass All Checks", "Request Revision", "Reject Question", "Certify & Approve".

### 6. Actions
- `AUDIT_CHECKLIST`: Verify each of the 10 pedagogical criteria:
  1. Syllabus mapping accurate
  2. Question unambiguous
  3. Single unique correct answer
  4. Plausible distractors
  5. Mathematical proof rigorous
  6. Telugu terminology natural and standard
  7. 60-second solvability confirmed
  8. Speed-trick pedagogically sound
  9. Diagram clarity (if applicable)
  10. Formatting standards satisfied
- `APPROVE_QUESTION`: Certify all 10 points and advance to Stage 03.
- `REQUEST_REVISION`: Flag defects with feedback notes and return to Stage 01.
- `REJECT_QUESTION`: Permanently retire unviable question draft.

### 7. Validation
Backend business rules enforce:
- **Anti-Self-Approval Rule:** Reviewer user ID must be different from author user ID (`reviewerUserId !== authorUserId`).
- All 10 checklist items explicitly marked as passed.
- Reviewer possesses `canApproveQuestion` capability.
- Authenticated human sign-off explicitly confirmed (AP-009).

### 8. Completion Criteria
`QuestionReview` persisted with verdict `APPROVED`, `Question` marked approved, `Content` project (`BP-C-######`) created, and video project (`BP-V-######`) initialized in status `QUEUED`.

### 9. Failure States
- `ERR_SELF_APPROVAL_VIOLATION`: Author attempts to verify their own question.
- `ERR_INCOMPLETE_CHECKLIST`: One or more checklist items uncertified.
- `ERR_MATHEMATICAL_DEFECT`: Reviewer uncovers an error in the problem or answer key.
- `ERR_UNAUTHORIZED_REVIEWER`: User lacks SME reviewer capability.

### 10. Revision Path
- **Revision Required:** Reviewer returns question to Stage 01 with structured remarks; creator modifies draft and creates `QuestionVersion-V02`.
- **Rejection:** Question is closed as `REJECTED` and does not advance.

### 11. Next Step
**Normal Next Stage:** Stage 03 (Audience Script).

---

## 08. Stage 03 — Audience Script

### 1. Entry Condition
Question is verified and approved in Stage 02; linked `Content` project (`BP-C-######`) is active.

### 2. Owner
**Domain Owner:** Scripts Domain.  
**Responsible Role / Capability:** Scriptwriter / Content Creator holding capability `canCreateScript`.

### 3. Inputs
- Approved `Question` (`BP-Q-######`) and active `QuestionVersion`.
- Solution proof and verified speed-trick derivation.
- 60-second short-form pacing guidelines (3-second hook, 45-second explanation, 10-second call-to-action).

### 4. Outputs
- `Script` business entity (`BP-SCR-######`).
- Initial `ScriptVersion` (`BP-SCR-######-V01`) containing formatted teleprompter copy, spoken Telugu hook, pause cues, speed-trick reveal, and estimated reading duration.

### 5. UI (Conceptual Workbench)
- **Workbench:** Scriptwriting Studio (`/videos/:id?tab=script`).
- **Information Shown:** Approved question card, step-by-step math proof, live teleprompter script editor, syllable/word count meter, estimated speaking duration calculator, pacing guide.
- **Controls & Actions:** "Generate Hook Variations", "Calculate Duration", "Format for Teleprompter", "Save Script Draft", "Certify Script Ready".

### 6. Actions
- `DRAFT_HOOK`: Compose opening 3-second hook designed to arrest scroll retention.
- `DRAFT_BODY`: Write spoken Telugu script breaking down the problem step-by-step.
- `EMBED_PACING_CUES`: Add rhythm markers, visual callout cues, and pauses.
- `VALIDATE_DURATION`: Test word count against standard 130–150 words-per-minute Telugu speaking rate.
- `LOCK_SCRIPT`: Certify script as ready for studio filming.

### 7. Validation
Backend business rules enforce:
- Parent question must be in verified/approved state.
- Hook phrasing present and under 15 words.
- Total script duration calculated between 45 and 58 seconds (strictly <= 60 seconds).
- Teleprompter copy non-empty and formatted in clean Telugu script.
- Scriptwriter holds `canCreateScript` capability.

### 8. Completion Criteria
`Script` and `ScriptVersion` persisted, reading duration certified, script status marked `SCRIPT_READY`, and workflow advances to Stage 04.

### 9. Failure States
- `ERR_DURATION_EXCEEDED`: Script reading time exceeds 60 seconds.
- `ERR_HOOK_MISSING`: No 3-second hook phrasing defined.
- `ERR_UNAPPROVED_QUESTION`: Attempt to script an unverified question.

### 10. Revision Path
Script remains in Stage 03 under drafting status until duration and pacing constraints are satisfied. If question wording is found defective during scripting, item returns to Stage 01/02 via formal loopback.

### 11. Next Step
**Normal Next Stage:** Stage 04 (Teleprompter & Filming).

---

## 09. Stage 04 — Teleprompter & Filming

### 1. Entry Condition
Script is locked and marked `SCRIPT_READY` in Stage 03. Video project exists in status `QUEUED` or `RECORDING`.

### 2. Owner
**Domain Owner:** Videos Domain.  
**Responsible Role / Capability:** Presenter / Host holding capability `canRecordVideo`.

### 3. Inputs
- Locked `Script` (`BP-SCR-######`) and active `ScriptVersion`.
- Video production project (`BP-V-######`).
- Studio camera and lighting setup.

### 4. Outputs
- `VideoTake` records (`BP-V-######-TK01`, `TK02`, etc.) logging take sequence, duration, host performance notes, and take classification (`PREFERRED_TAKE`, `USABLE_BACKUP`, `REJECTED_OUTTAKE`).
- Video project status transitioned to `RECORDED`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Teleprompter & Studio Recording Workspace (`/videos/:id?tab=recording`).
- **Information Shown:** Full-screen responsive teleprompter display, auto-scroll speed controls, font size adjustments, mirrored text toggle, stopwatch/timer, take logging drawer.
- **Controls & Actions:** "Start Prompter", "Pause / Reset", "Adjust Speed (WPM)", "Log Take", "Mark Preferred Take", "Complete Filming Session".

### 6. Actions
- `CALIBRATE_PROMPTER`: Configure scroll speed and font scale for presenter readability.
- `RECORD_TAKE`: Execute camera filming take while reading teleprompter.
- `LOG_TAKE_METADATA`: Record take number, duration, clapper sync point, and host notes.
- `SELECT_BEST_TAKE`: Tag the preferred take for the video editor.
- `FINISH_SESSION`: Conclude studio filming session and advance to Stage 05.

### 7. Validation
Backend business rules enforce:
- Script must be locked; teleprompter text cannot be modified during active recording session.
- At least one take logged with valid duration.
- Exactly one take designated as `PREFERRED_TAKE`.
- No binary video bytes accepted into application database (AP-007).
- Presenter holds `canRecordVideo` capability.

### 8. Completion Criteria
At least one valid take recorded and logged, `PREFERRED_TAKE` designated, video status marked `RECORDED`, and workflow advances to Stage 05.

### 9. Failure States
- `ERR_NO_TAKE_LOGGED`: Attempt to complete session without recording any take.
- `ERR_PROMPTER_UNSYNC`: Presenter stumbles or delivery deviates significantly from script.
- `ERR_TAKE_OVERLENGTH`: Filmed take duration exceeds 60-second platform limit.

### 10. Revision Path
If filming yields no usable takes, the session remains in Stage 04 for re-recording. If the script requires wording adjustments for spoken delivery, content returns to Stage 03 for a revised `ScriptVersion`.

### 11. Next Step
**Normal Next Stage:** Stage 05 (Raw Video).

---

## 10. Stage 05 — Raw Video

### 1. Entry Condition
Filming session concluded in Stage 04; preferred take metadata logged in `VideoTake`.

### 2. Owner
**Domain Owner:** Media Metadata Domain.  
**Responsible Role / Capability:** Production Lead / Camera Operator holding capability `canManageMedia`.

### 3. Inputs
- Preferred `VideoTake` record (`BP-V-######-TKxx`).
- Physical raw video camera file stored in external cloud storage (Google Drive).
- Google Drive file metadata (file size, MIME type, MD5 checksum).

### 4. Outputs
- `MediaAsset` catalog record (`MED-######`) tracking raw footage metadata.
- `MediaReference` record (`MED-######-REF01`) storing Google Drive file ID (`driveFileId`) and shareable link.
- Video project updated with raw footage attachment in status `RECORDED`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Raw Video Handoff Interface (`/videos/:id?tab=recording`).
- **Information Shown:** Filming session summary, take selection card, Google Drive upload dropzone / file picker, file integrity verification indicator.
- **Controls & Actions:** "Select Drive File", "Verify File Integrity", "Attach Raw Footage", "Hand Off to Editor".

### 6. Actions
- `UPLOAD_TO_DRIVE`: Upload raw camera video container (.MP4/.MOV) directly to external Google Drive production folder (AP-007).
- `REGISTER_MEDIA_METADATA`: Submit file name, byte size, MIME type, and SHA-256 hash to BP-CMS backend.
- `VERIFY_INTEGRITY`: Validate external file reachability and MIME type compliance.
- `ATTACH_TO_PROJECT`: Bind `MediaReference` to `Video` project.
- `HANDOFF_TO_EDITING`: Complete stage and notify assigned video editor.

### 7. Validation
Backend business rules enforce:
- External storage provider is authorized (Google Drive).
- `driveFileId` is non-empty and formatted correctly.
- Binary media resides in external storage; zero byte buffers in database (AP-007, AP-008).
- File MIME type matches allowed video formats (`video/mp4`, `video/quicktime`).
- File size is positive (> 0 bytes).
- Operator holds `canManageMedia` capability.

### 8. Completion Criteria
`MediaAsset` and `MediaReference` persisted and verified, video entity linked to raw footage locator, status confirmed as `RECORDED`, and workflow advances to Stage 06.

### 9. Failure States
- `ERR_DRIVE_UNREACHABLE`: Google Drive API returns 404 or permission denied for file ID.
- `ERR_INVALID_MIME`: Attached file is not a supported video container.
- `ERR_ZERO_BYTE_FILE`: External file is corrupted or 0 bytes.

### 10. Revision Path
If footage is lost or corrupted, work item returns to Stage 04 for a studio re-take.

### 11. Next Step
**Normal Next Stage:** Stage 06 (Editing Bay).

---

## 11. Stage 06 — Editing Bay

### 1. Entry Condition
Raw footage `MediaReference` attached and verified in Stage 05; video project assigned to editor.

### 2. Owner
**Domain Owner:** Videos Domain.  
**Responsible Role / Capability:** Video Editor holding capability `canEditVideo`.

### 3. Inputs
- Raw video `MediaReference` hosted on Google Drive.
- Approved `Question` and `Script` for text synchronization.
- Post-production branding assets (sound effects, timer graphics, lower-thirds, Telugu fonts).

### 4. Outputs
- `VideoEdit` business entity (`BP-V-######-ED01`, `ED02`, etc.) representing rendered cuts.
- Master rendered MP4 video file uploaded to Google Drive.
- New `MediaAsset` and `MediaReference` tracking the edited master cut.
- Video project status transitioned to `EDITED`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Editing Bay Workspace (`/videos/:id?tab=editing`).
- **Information Shown:** Production brief, question details, raw footage download link, master cut upload surface, technical specs checklist (1080x1920, 9:16 aspect ratio, -14 LUFS audio level, burned-in Telugu subtitles).
- **Controls & Actions:** "Download Raw Footage", "Register Master Cut", "Validate Technical Specs", "Submit for Final QC".

### 6. Actions
- `IMPORT_RAW_ASSET`: Download or stream raw take into editing software.
- `ASSEMBLE_CUT`: Trim silences, burn in high-readability Telugu subtitles, overlay 60-second countdown timer, apply visual emphasis on speed-trick.
- `NORMALIZE_AUDIO`: Master audio loudness to YouTube/Meta standard (-14 LUFS ± 1 LUFS).
- `EXPORT_MASTER_MP4`: Render vertical 1080x1920 9:16 MP4 container.
- `UPLOAD_MASTER_TO_DRIVE`: Upload finished cut to Google Drive export folder.
- `REGISTER_VIDEO_EDIT`: Record edit cut metadata and submit to Stage 07.

### 7. Validation
Backend business rules enforce:
- Rendered video `MediaReference` points to valid Google Drive MP4 file.
- Exact aspect ratio confirmed as vertical 9:16 (1080x1920).
- Total duration strictly <= 60.0 seconds.
- Audio loudness reading entered and within valid broadcast limits.
- Flag `hasSubtitlesBurnedIn` set to true.
- Editor holds `canEditVideo` capability.

### 8. Completion Criteria
`VideoEdit` persisted, master cut media reference linked, technical parameters certified, video project marked `EDITED`, and workflow advances to Stage 07.

### 9. Failure States
- `ERR_DURATION_LIMIT`: Edited cut exceeds 60.0 seconds.
- `ERR_WRONG_ASPECT_RATIO`: File rendered in horizontal 16:9 or square 1:1 instead of vertical 9:16.
- `ERR_AUDIO_CLIPPING`: Loudness exceeds broadcast ceiling or exhibits audio clipping.
- `ERR_MISSING_SUBTITLES`: Cut submitted without burned-in Telugu captions.

### 10. Revision Path
If technical rendering fails or editor identifies flaws, cut remains in Stage 06 for re-export.

### 11. Next Step
**Normal Next Stage:** Stage 07 (Final QC).

---

## 12. Stage 07 — Final QC

### 1. Entry Condition
Master cut `VideoEdit` submitted from Stage 06 with video project in status `EDITED`.

### 2. Owner
**Domain Owner:** Reviews Domain.  
**Responsible Role / Capability:** Quality Control Lead / Producer holding capability `canSignOffQC`.

### 3. Inputs
- Submitted master cut `VideoEdit` (`BP-V-######-EDxx`).
- Linked `MediaReference` for video playback streaming.
- Approved `Question` and `Script` references.
- 6-point Shorts Master Quality Control checklist rubric.

### 4. Outputs
- Formal QC sign-off audit record.
- Designation of `VideoEdit` as authoritative master cut (`isMasterCut = true`).
- Video project status transitioned to `READY_TO_UPLOAD`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Final QC Review Workspace (`/videos/:id?tab=final-review`).
- **Information Shown:** High-resolution vertical 9:16 video player with scrubber, audio VU meter, side-by-side script and question verification panel, 6-point interactive Master QC checklist.
- **Controls & Actions:** "Play Master Cut", "Audit Safe-Zones", "Pass All Checks", "Request Edit Revisions", "Certify & Sign Off QC".

### 6. Actions
- `EXECUTE_QC_AUDIT`: Audit all 6 master QC criteria:
  1. 1080x1920 vertical 9:16 framing verified with critical elements in safe zone
  2. Audio loudness normalized (-14 LUFS target, voice clear over music)
  3. Telugu subtitles 100% synchronized with spoken audio and free of spelling errors
  4. Question text, options, and math trick visually aligned with verified Question
  5. 3-second visual retention hook engages viewer immediately
  6. Final cut duration strictly <= 60 seconds
- `SIGN_OFF_QC`: Certify all 6 points and approve master cut.
- `REJECT_QC`: Detail defect checklist and return video to Stage 06.

### 7. Validation
Backend business rules enforce:
- All 6 QC checklist items certified as passed.
- Reviewer holds `canSignOffQC` capability.
- Authenticated human sign-off mandatory (AP-009); automated or AI sign-off prohibited.
- Video project cannot transition to `READY_TO_UPLOAD` without valid QC certification.

### 8. Completion Criteria
All 6 Master QC points certified by authorized QC Lead, `VideoEdit` flagged as master cut, video project marked `READY_TO_UPLOAD`, and workflow advances to Stage 08.

### 9. Failure States
- `ERR_QC_CHECKLIST_INCOMPLETE`: One or more checklist items uncertified.
- `ERR_SUBTITLE_DESYNC`: Subtitles lag or lead presenter spoken voice.
- `ERR_AUDIO_IMBALANCE`: Background music drowns out host voice.
- `ERR_SAFE_ZONE_VIOLATION`: Essential graphics placed where platform UI overlays will cover them.

### 10. Revision Path
Reviewer returns project to Stage 06 (Editing Bay) with specific defect notes; editor renders revised cut (`VideoEdit-ED02`) for re-inspection.

### 11. Next Step
**Normal Next Stage:** Stage 08 (Thumbnail).

---

## 13. Stage 08 — Thumbnail

### 1. Entry Condition
Video project has passed Stage 07 Final QC and is in status `READY_TO_UPLOAD`.

### 2. Owner
**Domain Owner:** Creative Assets Domain.  
**Responsible Role / Capability:** Graphic Designer / Thumbnail Artist holding capability `canManageMedia`.

### 3. Inputs
- QC-approved video master cut frame grabs.
- Approved question hook phrasing and curiosity headline text.
- High-CTR mobile thumbnail framing specifications (9:16 mobile crop, bold Telugu typography, high-contrast face reaction).

### 4. Outputs
- `Thumbnail` business entity (`THUMB-######`).
- High-resolution PNG thumbnail graphic uploaded to Google Drive.
- Associated `MediaAsset` and `MediaReference`.

### 5. UI (Conceptual Workbench)
- **Workbench:** Thumbnail Studio (`/videos/:id?tab=thumbnail`).
- **Information Shown:** Hook headline copy, video still extractor, design canvas / upload zone, mobile search result simulation card, contrast analyzer.
- **Controls & Actions:** "Upload Thumbnail PNG", "Simulate Mobile Feed", "Check Readability Score", "Approve Thumbnail".

### 6. Actions
- `DESIGN_THUMBNAIL`: Create vertical/square thumbnail graphics with curiosity hook text.
- `UPLOAD_TO_DRIVE`: Upload image file (.PNG/.JPG) to external Google Drive thumbnail folder.
- `REGISTER_THUMBNAIL_METADATA`: Store dimensions, file hash, headline text, and variant tag (`VARIANT_A`, `VARIANT_B`).
- `VERIFY_MOBILE_READABILITY`: Confirm text readability on small smartphone screens.
- `APPROVE_THUMBNAIL`: Set approval flag and advance to Stage 09.

### 7. Validation
Backend business rules enforce:
- Image file hosted on Google Drive with valid `MediaReference`.
- Image dimensions satisfy platform requirements (min 1080px resolution).
- Telugu headline text recorded and non-empty.
- Graphic Designer holds `canManageMedia` capability.

### 8. Completion Criteria
`Thumbnail` entity created, media reference linked, mobile readability verified, thumbnail status set to `APPROVED`, and workflow advances to Stage 09.

### 9. Failure States
- `ERR_IMAGE_DIMENSIONS`: Uploaded image is below minimum required resolution.
- `ERR_UNREADABLE_TEXT`: Headline text illegible at mobile thumbnail scale.
- `ERR_DRIVE_ATTACHMENT`: Image file unreachable in Google Drive.

### 10. Revision Path
Thumbnail remains in Stage 08 for graphic adjustments and re-upload.

### 11. Next Step
**Normal Next Stage:** Stage 09 (Social Review).

---

## 14. Stage 09 — Social Review

### 1. Entry Condition
Video project passed Stage 07 QC and Thumbnail approved in Stage 08.

### 2. Owner
**Domain Owner:** Reviews Domain.  
**Responsible Role / Capability:** Social Media Lead / Content Manager holding capability `canSignOffQC`.

### 3. Inputs
- Approved master cut `VideoEdit` (`BP-V-######-EDxx`).
- Approved `Thumbnail` (`THUMB-######`).
- Content project (`BP-C-######`) metadata.

### 4. Outputs
- `SocialReview` audit record (`SR-######`) documenting mobile simulator verification.
- Certified Social Review Package Bundle ready for publishing setup.

### 5. UI (Conceptual Workbench)
- **Workbench:** Social Review Workspace (`/social-review/:reviewId`).
- **Information Shown:** Realistic 9:16 smartphone simulator overlaying YouTube Shorts and Instagram Reels UI elements (like buttons, comment icons, profile chips, sound titles), synchronized video playback, thumbnail preview.
- **Controls & Actions:** "Toggle Platform Overlays", "Check Safe-Zones", "Verify Subtitle Clearance", "Request Creative Rework", "Certify & Approve Social Review".

### 6. Actions
- `SIMULATE_MOBILE_EXPERIENCE`: Play master cut inside smartphone simulator with platform UI overlays active.
- `AUDIT_SAFE_ZONES`: Verify that no burned-in subtitles, math options, or presenter facial expressions are obscured by platform buttons.
- `AUDIT_HOOK_SYNERGY`: Verify thumbnail headline matches the spoken 3-second video hook.
- `CERTIFY_PACKAGE`: Sign off mobile review and advance to Stage 10.

### 7. Validation
Backend business rules enforce:
- Video passed Stage 07 QC and Thumbnail is approved.
- Reviewer holds `canSignOffQC` capability.
- Authenticated human sign-off explicitly confirmed (AP-009).
- Subtitle safe-zone clearance verified.

### 8. Completion Criteria
`SocialReview` persisted with verdict `APPROVED`, review bundle certified, and workflow advances to Stage 10.

### 9. Failure States
- `ERR_SAFE_ZONE_CLASH`: Critical subtitles or options covered by YouTube/Instagram action buttons.
- `ERR_HOOK_MISMATCH`: Thumbnail text contradicts spoken video hook.
- `ERR_AUDIO_DISTORTION`: Playback distortion observed during mobile emulation.

### 10. Revision Path
- If video edits required: Returns to Stage 06 (Editing Bay).
- If thumbnail adjustments required: Returns to Stage 08 (Thumbnail).

### 11. Next Step
**Normal Next Stage:** Stage 10 (Publishing Setup).

---

## 15. Stage 10 — Publishing Setup

### 1. Entry Condition
Social review bundle certified and signed off in Stage 09.

### 2. Owner
**Domain Owner:** Publishing Packages Domain.  
**Responsible Role / Capability:** Release Coordinator / Publisher holding capability `canTriggerPublish`.

### 3. Inputs
- Certified `SocialReview` bundle.
- Master cut `VideoEdit` and approved `Thumbnail`.
- Approved `Question` and `Script` for metadata extraction.

### 4. Outputs
- `PublishingPackage` business entity (`PUB-######`).
- Platform-adapted distribution payloads:
  - YouTube Shorts title (SEO keywords + Telugu curiosity hook, <= 100 chars), full description, search tags, pinned comment copy.
  - Instagram Reels caption, hashtags, audio attribution.
  - Facebook Video title and description.
- Scheduled publishing timestamp.

### 5. UI (Conceptual Workbench)
- **Workbench:** Publishing Setup Workspace (`/publishing`).
- **Information Shown:** Multi-platform packaging studio, YouTube/Instagram metadata editors, character count validators, hashtag managers, pinned comment composer, release scheduling calendar.
- **Controls & Actions:** "Generate Platform Copy", "Validate SEO Tags", "Compose Pinned Comment", "Set Broadcast Schedule", "Authorize Publishing Schedule".

### 6. Actions
- `COMPOSE_YOUTUBE_METADATA`: Author title, description, tags, and pinned comment for YouTube Shorts.
- `ADAPT_SOCIAL_CAPTIONS`: Format Instagram and Facebook captions with targeted curriculum hashtags.
- `SCHEDULE_RELEASE`: Set scheduled release timestamp or designate immediate dispatch.
- `VALIDATE_PACKAGE`: Run pre-publishing compliance checks.
- `LOCK_SCHEDULE`: Authorize publishing package for execution.

### 7. Validation
Backend business rules enforce:
- Title, description, and tags conform to platform character limits.
- Pinned comment composed with solution link or engagement question.
- Master video edit and thumbnail media references valid and accessible.
- Release timestamp is valid (future timestamp or immediate dispatch flag).
- Release Coordinator holds `canTriggerPublish` capability.

### 8. Completion Criteria
`PublishingPackage` persisted, platform payloads validated, package status marked `SCHEDULED`, and workflow advances to Stage 11.

### 9. Failure States
- `ERR_TITLE_LENGTH`: YouTube title exceeds platform character limit.
- `ERR_PINNED_COMMENT_MISSING`: No pinned comment defined for YouTube Shorts.
- `ERR_INVALID_SCHEDULE`: Scheduled timestamp is in the past.

### 10. Revision Path
Package copy remains in Stage 10 for editorial revisions.

### 11. Next Step
**Normal Next Stage:** Stage 11 (Published).

---

## 16. Stage 11 — Published

### 1. Entry Condition
`PublishingPackage` scheduled and authorized in Stage 10.

### 2. Owner
**Domain Owner:** Publishing Packages Domain.  
**Responsible Role / Capability:** Distribution Specialist / Publishing Engine holding capability `canTriggerPublish`.

### 3. Inputs
- Scheduled `PublishingPackage` (`PUB-######`).
- Master video binary file in Google Drive.
- Distribution platform API credentials (server-side secrets).

### 4. Outputs
- `Publication` records (`PUB-######-YT`, `PUB-######-IG`) documenting platform execution.
- Verified live platform content IDs (e.g., YouTube `videoId`) and public live permalinks (`https://youtube.com/shorts/...`).
- Project business stage marked **`PUBLISHED`**.

### 5. UI (Conceptual Workbench)
- **Workbench:** Publishing Dispatch & Live Status Console (`/publishing`).
- **Information Shown:** Active dispatch queue, platform upload progress monitors, live URL links, immediate regex URL validation card.
- **Controls & Actions:** "Dispatch to YouTube", "Dispatch to Social Platforms", "Verify Live URL", "Confirm Publication".

### 6. Actions
- `EXECUTE_DISPATCH`: Upload video container and metadata to YouTube Data API / Meta Graph API via server adapter.
- `POLL_PLATFORM_STATUS`: Check platform processing status until video is live.
- `POST_PINNED_COMMENT`: Automatically insert and pin authorized comment on YouTube.
- `CAPTURE_LIVE_URL`: Ingest public permalink and validate via strict URL regex.
- `CONFIRM_PUBLISHED`: Transition business workflow to Stage 11 (Published).

### 7. Validation
Backend business rules enforce:
- Live URL is reachable and satisfies platform URL regex format.
- Platform returned valid external content identifier (`videoId`).
- Authorized human or automated publishing service confirmed live status.
- External status does NOT overwrite internal business workflow without validation (AP-002).

### 8. Completion Criteria
Primary platform (YouTube Shorts) confirms video is live, permalink regex validated and stored, `Publication` marked `LIVE`, content project canonical stage updated to `PUBLISHED`, and workflow advances to Stage 12.

### 9. Failure States
- `ERR_PLATFORM_UPLOAD_FAILED`: Third-party API rejects upload (quota, token expiry).
- `ERR_INVALID_LIVE_URL`: Ingested URL does not match canonical platform URL pattern.
- `ERR_COPYRIGHT_STRIKE`: Platform Content ID flags audio/video copyright claim.

### 10. Revision Path
If dispatch fails, package remains in Stage 10/11 for retry or credentials refresh. Core business records remain intact (AP-015).

### 11. Next Step
**Normal Next Stage:** Stage 12 (Platform Sync).

---

## 17. Stage 12 — Platform Sync

### 1. Entry Condition
Content is confirmed published on primary platform (Stage 11); secondary social distribution posts initiated.

### 2. Owner
**Domain Owner:** Publishing Packages Domain.  
**Responsible Role / Capability:** Social Operations Specialist holding capability `canSyncPlatforms`.

### 3. Inputs
- Live `Publication` record for primary platform.
- Secondary platform packages (Instagram Reels, Facebook Video).
- Live social post URLs and IDs.

### 4. Outputs
- Updated `Publication` records for secondary platforms.
- Consolidated multi-platform distribution manifest.
- Confirmation of cross-platform attribution and synchronization.

### 5. UI (Conceptual Workbench)
- **Workbench:** Cross-Platform Sync Dashboard (`/platform-packages`).
- **Information Shown:** Multi-platform status matrix, Instagram Reel permalink card, Facebook Video player embed, audio attribution sync indicator.
- **Controls & Actions:** "Verify Instagram Sync", "Verify Facebook Sync", "Re-sync Metadata", "Complete Platform Sync".

### 6. Actions
- `VERIFY_INSTAGRAM_POST`: Verify Instagram Reel is live, audio track attributed, and hashtags indexed.
- `VERIFY_FACEBOOK_POST`: Verify Facebook Video post is published.
- `RECONCILE_METADATA`: Ensure title, description, and links are consistent across platforms.
- `CONFIRM_SYNC_COMPLETE`: Sign off synchronization and advance to Stage 13.

### 7. Validation
Backend business rules enforce:
- All targeted secondary platforms verified live or explicitly marked skipped.
- Secondary permalinks valid and formatted correctly.
- Specialist holds `canSyncPlatforms` capability.

### 8. Completion Criteria
Cross-platform synchronization verified and recorded, all active distribution channels accounted for, and workflow advances to Stage 13.

### 9. Failure States
- `ERR_SYNC_FAILED`: Secondary platform post failed to publish or was rejected.
- `ERR_BROKEN_PERMALINK`: Secondary platform URL returns 404.

### 10. Revision Path
Failed secondary platforms are flagged for retry without invalidating the live primary publication.

### 11. Next Step
**Normal Next Stage:** Stage 13 (Analytics).

---

## 18. Stage 13 — Analytics

### 1. Entry Condition
Content is published and synced (Stages 11 & 12); live posts have been active for at least 24 hours.

### 2. Owner
**Domain Owner:** Analytics Domain.  
**Responsible Role / Capability:** Analytics Specialist holding capability `canManageAnalytics`.

### 3. Inputs
- Live `Publication` platform identifiers (`youtubeVideoId`, `instagramMediaId`).
- External platform telemetry queried via APIs or entered manually.

### 4. Outputs
- `AnalyticsSnapshot` records capturing views, likes, comments, shares, watch time, and average view duration.
- Historical metrics time-series data (24-hour, 7-day, 30-day snapshots).

### 5. UI (Conceptual Workbench)
- **Workbench:** Social Analytics Workspace (`/social-analytics/:contentId`).
- **Information Shown:** Real-time views counter, likes/engagement ratio meters, audience retention curve chart, comment volume breakdown.
- **Controls & Actions:** "Refresh Metrics from Platform APIs", "Ingest Snapshot", "View Retention Curve", "Advance to Performance Review".

### 6. Actions
- `QUERY_PLATFORM_METRICS`: Fetch views, likes, comments, and retention data from platform APIs.
- `NORMALIZE_METRICS`: Map platform-specific fields into standard BP-CMS analytics structure.
- `RECORD_SNAPSHOT`: Append immutable point-in-time metrics sample.
- `VERIFY_INGESTION`: Ensure required metric fields are populated.

### 7. Validation
Backend business rules enforce:
- Content project must be in `PUBLISHED` stage.
- Non-negative integer values for views, likes, comments, and shares.
- Snapshot timestamp recorded.
- Operator holds `canManageAnalytics` capability.

### 8. Completion Criteria
At least one valid normalized `AnalyticsSnapshot` ingested and persisted, initial performance window captured, and workflow advances to Stage 14.

### 9. Failure States
- `ERR_API_QUOTA_EXCEEDED`: Platform analytics API rate limit reached.
- `ERR_MISSING_METRICS`: Platform reports zero data or private video status.

### 10. Revision Path
If telemetry collection fails, snapshot is rescheduled for retry; active publication is unaffected.

### 11. Next Step
**Normal Next Stage:** Stage 14 (Performance Review).

---

## 19. Stage 14 — Performance Review

### 1. Entry Condition
Analytics snapshot ingested and available in Stage 13.

### 2. Owner
**Domain Owner:** Analytics Domain.  
**Responsible Role / Capability:** Content Strategy Lead holding capability `canReviewPerformance`.

### 3. Inputs
- `AnalyticsSnapshot` time-series data.
- Audience retention drop-off curve.
- Subject/topic benchmark averages.

### 4. Outputs
- `PerformanceRecord` business entity (`PERF-######`).
- Standardized editorial evaluation: aggregated views, engagement ratio, retention benchmark classification (`TOP_10_PERCENT`, `ABOVE_AVERAGE`, `AVERAGE`, `BELOW_AVERAGE`), and drop-off diagnostic notes.

### 5. UI (Conceptual Workbench)
- **Workbench:** Performance Review & Engagement Analysis (`/analytics/engagement`).
- **Information Shown:** Comparative retention curve against syllabus benchmark, drop-off point timestamp scrubber (e.g., "70% dropped at 0:14 mark"), engagement ratio gauge, student sentiment analysis.
- **Controls & Actions:** "Tag Drop-off Reason", "Assign Benchmark Tier", "Record Editorial Critique", "Complete Performance Review".

### 6. Actions
- `ANALYZE_RETENTION_CURVE`: Identify exact timestamp where audience retention drops.
- `EVALUATE_ENGAGEMENT`: Measure like-to-view and comment-to-view ratios.
- `ASSIGN_BENCHMARK_TIER`: Categorize video performance against historical curriculum norms.
- `DOCUMENT_CONTENT_DIAGNOSTICS`: Record qualitative feedback on hook efficacy, explanation clarity, and pacing.

### 7. Validation
Backend business rules enforce:
- Aggregated metrics mathematically consistent with underlying snapshots.
- Retention benchmark tier explicitly assigned.
- Qualitative diagnostic notes present.
- Strategy Lead holds `canReviewPerformance` capability.

### 8. Completion Criteria
`PerformanceRecord` persisted, benchmark tier assigned, editorial diagnosis completed, and workflow advances to Stage 15.

### 9. Failure States
- `ERR_INSUFFICIENT_DATA`: Performance review attempted before sufficient audience sample collected.
- `ERR_UNASSIGNED_TIER`: Benchmark categorization omitted.

### 10. Revision Path
If unexpected traffic surges occur later, performance review can be updated with a newer snapshot.

### 11. Next Step
**Normal Next Stage:** Stage 15 (Intelligence Loop).

---

## 20. Stage 15 — Intelligence Loop

### 1. Entry Condition
`PerformanceRecord` finalized in Stage 14.

### 2. Owner
**Domain Owner:** Intelligence Domain.  
**Responsible Role / Capability:** Executive Producer / AI Strategy Engine holding capability `canGenerateIntelligence`.

### 3. Inputs
- `PerformanceRecord` (`PERF-######`).
- Audience comments and student confusion signals.
- Curriculum syllabus coverage map.

### 4. Outputs
- `IntelligenceInsight` business entity (`INTEL-######`).
- Strategic directives: topic difficulty alerts, curriculum gap recommendations, and Question Studio prompt presets.
- **Loopback Signal:** Actionable recommendations channeled into Stage 01 (Question Generation) to guide the next batch of curriculum content.

### 5. UI (Conceptual Workbench)
- **Workbench:** Pedagogical Intelligence & Strategy Console (`/analytics/intelligence`).
- **Information Shown:** Curriculum resonance heatmaps, high-difficulty concept clusters, student misunderstanding patterns, AI-generated insight synthesis drawer, "Apply to Studio" button.
- **Controls & Actions:** "Synthesize Pedagogical Insights", "Review AI Recommendation", "Approve Curriculum Directive", "Apply Recommendation to Question Studio".

### 6. Actions
- `SYNTHESIZE_INSIGHTS`: Analyze comment themes and drop-off points to identify student learning barriers.
- `FORMULATE_DIRECTIVES`: Draft recommendations (e.g., "Class 10 Trigonometry: Students struggle with identity transformations; create focused 45-second trick video").
- `HUMAN_REVIEW_DIRECTIVE`: Executive Producer reviews and approves strategic recommendations (AP-009).
- `TRIGGER_LOOPBACK`: Export insight as an actionable preset into Question Studio (Stage 01).
- `CLOSE_CONTENT_LIFECYCLE`: Mark workflow instance lifecycle complete.

### 7. Validation
Backend business rules enforce:
- Insight linked to verified curriculum subject and topic.
- Strategic directive is actionable and pedagogically grounded.
- Authenticated human review confirmed before directive is published to Question Studio (AP-009).
- Strategy Lead holds `canGenerateIntelligence` capability.

### 8. Completion Criteria
`IntelligenceInsight` persisted, curriculum directive approved, loopback recommendation made available to Question Studio, and `WorkflowInstance` marked `COMPLETED`.

### 9. Failure States
- `ERR_VAGUE_INSIGHT`: AI recommendation lacks actionable pedagogical substance.
- `ERR_UNASSIGNED_TOPIC`: Directive not linked to valid syllabus node.

### 10. Revision Path
Insights remain in Stage 15 for human refinement before broadcast to Question Studio.

### 11. Next Step
**Normal Next Step:** Stage 01 (Loopback to Question Generation for new content project) or Content Lifecycle `COMPLETED`.

---

## 21. Transition Model

### 21.1 Canonical Normal Path
The standard happy path progresses sequentially through all 15 stages without omission:
```
01 ──► 02 ──► 03 ──► 04 ──► 05 ──► 06 ──► 07 ──► 08 ──► 09 ──► 10 ──► 11 ──► 12 ──► 13 ──► 14 ──► 15
                                                                                                    │
                                                                                                    ▼ (Loopback)
                                                                                                    01
```

### 21.2 Legitimate Non-Sequential Transitions
Arbitrary stage jumps (e.g., 01 -> 07, 03 -> 11) are strictly prohibited and architecturally blocked by `validateCanonicalWorkflowTransition()`. Only the following non-sequential transitions are authorized:

1. **Review Rejection / Rework Pathways (Backward Movement):**
   - **Stage 02 -> Stage 01:** Question rejected or revision requested by SME; returns to Question Studio.
   - **Stage 07 -> Stage 06:** Final QC rejects video cut; returns to Editing Bay for re-rendering.
   - **Stage 09 -> Stage 06:** Social review flags video safe-zone clash; returns to Editing Bay.
   - **Stage 09 -> Stage 08:** Social review flags thumbnail issue; returns to Thumbnail Studio.
   - **Stage 04 -> Stage 03:** Presenter identifies pacing defect; returns to Scriptwriting Studio.

2. **Same-Stage Continuation (In-Place Retries):**
   - Multiple takes logged in Stage 04 without advancing.
   - Multiple edits rendered in Stage 06 without advancing.
   - Multiple analytics snapshots ingested in Stage 13 over time.

3. **Curriculum Loopback (Stage 15 -> Stage 01):**
   - Stage 15 emits an `IntelligenceInsight` that initializes or seeds a brand-new content project in Stage 01. This is a curriculum feedback loop, not an in-place cycle of the same entity.

---

## 22. Human Approval Boundaries

In strict compliance with AP-009 (Human-Gated AI), automated algorithms and AI models are strictly prohibited from approving workflow transitions into or out of human checkpoints. The following stages enforce mandatory authenticated human sign-off:

| Canonical Stage | Gate Checkpoint | Required Human Role | Mandatory Human Sign-Off Invariant |
| :---: | :--- | :--- | :--- |
| **02** | Question Verification | Lead SME / QA Reviewer | Must be signed off by a human SME. Anti-self-approval rule enforced: reviewer cannot be the creator. |
| **07** | Final QC | Quality Control Lead | Must be certified by human QC Lead across all 6 points. Technical render success cannot substitute. |
| **09** | Social Review | Social Media Lead / Content Manager | Must be certified by human reviewer inside 9:16 mobile simulator. |
| **10** | Publishing Setup | Release Coordinator / Publisher | Must be authorized by human publisher before scheduling broadcast. |
| **14** | Performance Review | Content Strategy Lead | Must be reviewed and benchmarked by human strategist. |
| **15** | Intelligence Loop | Executive Producer / Strategy Lead | Strategic curriculum recommendations must be human-approved before seeding Question Studio. |

---

## 23. External Integration Boundaries

External systems interface with BP-CMS strictly as subordinate utility providers situated behind integration adapters (Stage 05). The following boundary contracts govern workflow interactions:

| External System | Consuming Stages | External Responsibility | BP-CMS Business State (Authoritative) | External State (Subordinate) | Failure Isolation Boundary |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Google Drive** | 05, 06, 08 | Binary storage for raw video, master cuts, and thumbnails. | Media catalog metadata (`MediaAsset`), project links (`MediaReference`). | Google Drive `fileId`, upload chunk progress. | Drive API errors (500, 429) do not corrupt CMS records; upload retried asynchronously. |
| **YouTube** | 10, 11, 13 | Public Shorts distribution, video hosting, comment serving. | BP-CMS canonical stage `PUBLISHED`, release package (`PUB-######`). | YouTube `videoId`, transcode state, view counters. | YouTube API outage holds project in Stage 10/11; does not block internal drafting or QC. |
| **Meta Graph API** | 11, 12, 13 | Instagram Reels & Facebook Video broadcast. | Sync status, platform publications (`Publication`). | Meta Container ID, processing status. | Instagram sync failure leaves YouTube publication intact; Stage 12 flagged for retry. |
| **Gemini API** | 01, 03, 15 | AI text generation, translation, insight clustering. | Verified question, locked script, approved insight. | Raw LLM completion text, token usage logs. | AI API timeout falls back 100% to manual human authoring; zero workflow blockage. |
| **Email Gateway** | All | Transactional notification delivery to staff inboxes. | In-app notification (`Notification`), workflow transition record. | SMTP transfer logs, mail server receipts. | SMTP failure never blocks or rolls back business transactions. |
| **Archive Store** | Post-15 | Deep cold storage of completed raw footage and takes. | Archive manifest (`ArchiveReference`), checksums. | Physical tape blocks, glacier vault ARN. | Cold storage delay has zero impact on active production pipeline. |

---

## 24. Entity Traceability

All 27 Stage 06 canonical domain entities map directly to workflow stages:

| Stage 06 Entity | Primary Workflow Stages | Conceptual Role in Workflow |
| :--- | :---: | :--- |
| `User` | All Stages | Authenticated human actor, creator, reviewer, or administrator. |
| `Role` | All Stages | Functional responsibility profile evaluated for stage authorization. |
| `Capability` | All Stages | Granular security permission evaluated prior to executing stage actions. |
| `Question` | Stages 01, 02, 03 | Core educational atom and curriculum concept. |
| `QuestionVersion` | Stages 01, 02 | Immutable snapshot of problem text, options, and Telugu math proof. |
| `QuestionReview` | Stage 02 | Formal 10-point SME verification audit checklist and verdict gate. |
| `Content` | Stages 02–15 | Central aggregate root uniting creative assets across the production journey. |
| `Script` | Stages 03, 04 | Vertical short-form presenter teleprompter script entity. |
| `ScriptVersion` | Stage 03 | Immutable revision of spoken presenter teleprompter copy. |
| `Video` | Stages 04–07 | Multimedia video production project encapsulating filming and editing. |
| `VideoTake` | Stage 04 | Individual studio filming take linked to raw footage in Google Drive. |
| `VideoEdit` | Stages 06, 07 | Post-production rendered cut evaluated during Final QC. |
| `MediaAsset` | Stages 05, 06, 08 | Logical metadata catalog descriptor for digital media files. |
| `MediaReference` | Stages 05, 06, 08 | External URI locator / Google Drive pointer for media binaries. |
| `ArchiveReference` | Post-Stage 15 | Cold-storage manifest tracking deep-archived project assets. |
| `Thumbnail` | Stages 08, 09, 10 | High-resolution cover artwork and curiosity hook headline text. |
| `SocialReview` | Stage 09 | Stage 09 pre-publishing 9:16 mobile framing and playback QC audit gate. |
| `PublishingPackage` | Stages 10, 11 | Multi-platform staged release bundle (titles, tags, pinned comments). |
| `Publication` | Stages 11, 12, 13 | Concrete execution record of a release to an individual platform. |
| `Platform` | Stages 10, 11, 12 | External distribution channel destination reference (YouTube, Instagram). |
| `AnalyticsSnapshot` | Stages 13, 14 | Raw point-in-time metrics sample ingested from external platform APIs. |
| `PerformanceRecord` | Stages 14, 15 | Normalized, aggregated audience resonance and retention card. |
| `IntelligenceInsight` | Stage 15 (-> 01) | Pedagogical recommendations looped back into Question Studio. |
| `WorkflowInstance` | All Stages | Authoritative state machine instance governing canonical 15-step progression. |
| `WorkflowTransition` | All Stages | Immutable historical record of validated stage advances and loopbacks. |
| `Notification` | All Stages | Internal operational task alert and production coordination signal. |
| `AuditEvent` | All Stages | Authoritative append-only legal and operational mutation ledger. |

---

## 25. Failure & Recovery Model

BP-CMS enforces a structured, deterministic failure and recovery classification:

```
┌───────────────────────┬───────────────────────────────────┬───────────────────────────────────────────┐
│     FAILURE TYPE      │          ROOT CAUSE               │           RECOVERY MECHANISM              │
├───────────────────────┼───────────────────────────────────┼───────────────────────────────────────────┤
│ Review Rejection      │ Pedagogical or technical defect   │ Backward transition to designated rework  │
│                       │ identified during formal gate     │ stage; author revises and creates new     │
│                       │ (Stage 02, 07, 09).               │ version.                                  │
├───────────────────────┼───────────────────────────────────┼───────────────────────────────────────────┤
│ External Outage       │ Google Drive, YouTube, or Meta    │ Exponential backoff retry at adapter      │
│                       │ API temporary error / 429 quota.  │ boundary; business stage remains stable.  │
├───────────────────────┼───────────────────────────────────┼───────────────────────────────────────────┤
│ Sync Discrepancy      │ Secondary platform post fails or  │ Reconciliation task triggered in Stage 12 │
│                       │ is delayed.                       │ without affecting primary live status.    │
├───────────────────────┼───────────────────────────────────┼───────────────────────────────────────────┤
│ AI Service Disruption │ Gemini API timeout or unavail.    │ Graceful fallback to 100% manual author-  │
│                       │                                   │ ing; zero workflow blockage.              │
├───────────────────────┼───────────────────────────────────┼───────────────────────────────────────────┤
│ Human Gate Block      │ Prerequisite checklist incomplete │ Work item holds in current stage until    │
│                       │ or unauthorized actor attempt.    │ authorized human certifies gate.          │
└───────────────────────┴───────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 26. Notification Model

Operational notifications (`Notification`) are emitted at key workflow milestones to coordinate handoffs without idle latency:

- **Review Required:** Emitted to Lead SME when a question enters Stage 02.
- **Review Rejected / Revision Requested:** Emitted to author when Stage 02, 07, or 09 requests rework.
- **Task Assignment:** Emitted to Presenter (Stage 04), Video Editor (Stage 06), Graphic Designer (Stage 08), or Publisher (Stage 10).
- **QC Certified:** Emitted to producer when Stage 07 passes.
- **Publication Live:** Emitted to entire team when Stage 11 confirms live release.
- **Performance Alert:** Emitted to strategy team when Stage 14/15 detects top-tier retention or critical confusion drop-off.

*Note:* Notifications are internal BP-CMS business entities. Optional email dispatch to Google Workspace inboxes is an external integration relay.

---

## 27. Audit Model

Every consequential workflow action generates an immutable `AuditEvent` (AP-014):

- Question creation, revision, and submission.
- Verification checklist responses and approval/rejection verdicts (with actor attribution).
- Script locking and teleprompter finalization.
- Filming session completion and take metadata logging.
- Media asset registration and checksum verification.
- Video edit cut submissions and Final QC certifications.
- Mobile simulator review sign-offs.
- Publishing package authorization and platform dispatches.
- Live URL validations.
- Every invocation of `validateCanonicalWorkflowTransition()`.

Audit records are append-only and preserve before/after state diffs for operational transparency.

---

## 28. Workflow Invariants

The canonical 15-step workflow contract guarantees the following structural invariants:

1. **Exactly 15 Stages:** The workflow consists of precisely 15 canonical business stages (01 to 15).
2. **No Alternate Lists:** No alternative, shadow, or duplicate workflow stage sequences exist.
3. **No Arbitrary Jumps:** Forward progression must follow the sequential order (01 -> 02 -> ... -> 15).
4. **Backend Transition Authority:** Only the server-side validator (`validateCanonicalWorkflowTransition`) can advance or regress workflow stages (AP-003, AP-004, AP-005).
5. **Business Stage != Technical Status:** External upload flags, transcode states, and job IDs are operational sub-states that do not alter canonical stage ownership (AP-002).
6. **Human-Gated Milestones:** AI models and automated systems cannot sign off stages 02, 07, 09, 10, 14, or 15 (AP-009).
7. **External Media Storage:** Media binaries reside strictly in external cloud storage; BP-CMS stores only metadata and references (AP-007, AP-008).
8. **Decoupled External Systems:** External provider downtime cannot freeze or corrupt internal authoring, review, or QC workflows (AP-013).
9. **Single Active Stage:** A content project occupies exactly one canonical stage at any time (AP-010).
10. **Immutable Event Audit:** All stage mutations are recorded in the append-only audit ledger (AP-014).

---

## 29. Persistence/API Deferment

Stage 07 is strictly a business workflow contract and architectural specification. In accordance with SDLC phase boundaries, the following implementation concerns are formally deferred:

1. **No Database Tables or DDL:** No SQL tables, columns, indexes, foreign keys, or database migrations are declared.
2. **No Google Sheets Schema:** No Google Sheets tabs, spreadsheet ranges, or cell formulas are defined.
3. **No ORM Models:** No Drizzle, Prisma, or TypeORM entity schemas are declared.
4. **No API Endpoints:** No Express routes, REST endpoints (e.g., `POST /api/workflow/transition`), or GraphQL mutations are implemented.
5. **No UI Code:** No React components, pages, or client hooks are created or altered.
6. **No Workflow Engine Implementation:** The existing authoritative server-side transition logic in `canonical-workflow.ts` remains the implementation authority.

---

## 30. Traceability Matrix

This specification traces directly to authoritative SDLC baselines:

| Workflow Specification Item | Stage 01 Requirements | Stage 02 Acceptance Criteria | Stage 04 Architecture Principles | Stage 05 System Boundary | Stage 06 Domain Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canonical 15 Steps** | Core Production Lifecycle | AC-04: Production Journey | AP-001: 15-Step Workflow | Domain 09: Workflow | `WorkflowInstance`, `WorkflowTransition` |
| **Stage vs State** | Technical Architecture | AC-13: Transition Engine | AP-002: Stage vs State | Section 09: Workflow Ownership | Section 16: Lifecycle Model |
| **Transition Authority** | Security & Integrity | AC-13: Transition Checks | AP-003, AP-004, AP-005 | Section 13: Security Boundary | `WorkflowTransition` |
| **Human-Gated AI** | AI Governance Specs | AC-03, AC-09: Review Gates | AP-009: Human-Gated AI | Section 10: AI Boundary | `QuestionReview`, `SocialReview` |
| **Media Separation** | Media Management Specs | AC-07: Media Integrity | AP-007, AP-008: Media Separation| Section 08: Media Boundary | `MediaAsset`, `MediaReference` |
| **External Decoupling** | Reliability Specs | AC-10, AC-11: Sync Gates | AP-013: Incremental Resilience | Section 12: Failure Isolation | `Publication`, `Platform` |
| **Audit Ledger** | Compliance Specs | AC-15: Audit Traceability | AP-014: Authoritative Audit | Section 14: Audit Boundary | `AuditEvent` |

---

## 31. Non-Requirements (Strictly Excluded from Stage 07)

To ensure strict scope control, the following activities are prohibited in Stage 07:

1. **No Database Implementations:** Zero SQL tables, migrations, column types, or database connections.
2. **No Application Source Code Changes:** Zero TypeScript files in `src/` modified or created.
3. **No Package Dependency Changes:** `package.json` and `package-lock.json` remain untouched.
4. **No API Routes:** Zero Express endpoints, routes, or middleware added.
5. **No UI Changes:** Zero frontend components, pages, or styling changed.
6. **No Cloud Infrastructure:** Zero cloud databases, queues, or hosting resources provisioned.
7. **No External Integration Mutations:** Zero live API calls to Google Drive, YouTube, Meta, or Google Gemini.
8. **No Live Production Data Changes:** Production Google Sheets and Google Drive directories remain untouched.

---

## 32. Stage 07 Verification Gate

The following checklist must be satisfied to establish completion of Stage 07:

- [x] Authoritative document `docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md` created.
- [x] All 15 canonical stages accounted for sequentially (01 to 15).
- [x] Stage names and numbers match canonical definitions exactly without deviation.
- [x] Every stage specifies all 11 required elements: Entry Condition, Owner, Inputs, Outputs, Conceptual UI, Permitted Actions, Backend Validation, Completion Criteria, Failure States, Revision Path, and Next Step.
- [x] Sequential normal path (01 -> 15) documented.
- [x] Legitimate backward rework/rejection paths defined without arbitrary jumps.
- [x] Stage 15 -> Stage 01 curriculum loopback explicitly documented.
- [x] AP-001, AP-002, AP-003, AP-004, AP-005, AP-006, AP-009, AP-010, and AP-015 preserved.
- [x] Human approval boundaries explicitly articulated for stages 02, 07, 09, 10, 14, and 15.
- [x] External integration boundaries defined for Google Drive, YouTube, Meta, AI, and Email.
- [x] All 27 Stage 06 domain entities mapped to workflow stages.
- [x] Structured failure and recovery classifications established.
- [x] In-app operational notifications separated from external email relays.
- [x] Authoritative append-only audit trail required for all stage transitions.
- [x] Persistence and API implementations explicitly deferred.
- [x] Full traceability to Stages 01, 02, 04, 05, and 06 documented.
- [x] Application source code, package.json, and infrastructure remain 100% untouched.
- [x] Codebase lint and compilation pass cleanly.

---

## 33. Closure Record

### 33.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| Canonical 15 Stages Documented Sequentially | Steps 01 through 15 defined | VERIFIED |
| Stage Naming Consistency | Exactly matches canonical workflow terminology | VERIFIED |
| Stage Contract Completeness | All 11 subsections defined for all 15 stages | VERIFIED |
| Normal Sequential Path Defined | 01 -> 02 -> ... -> 15 | VERIFIED |
| Rework & Rejection Pathways Defined | Validated backward movement only | VERIFIED |
| Stage 15 -> Stage 01 Curriculum Loopback | Formally documented as curriculum feedback | VERIFIED |
| Human Approval & AI Human-Gating (AP-009) | Enforced for Stages 02, 07, 09, 10, 14, 15 | VERIFIED |
| Media Reference vs Binary Storage Separation | AP-007 and AP-008 compliance verified | VERIFIED |
| Stage 06 Entity Mapping Traceability | All 27 domain entities mapped | VERIFIED |
| Automated Stage 07 Test Suite (`npm run test:stage07`) | 6/6 verification checks passed | PASSED |
| Persistence & API Deferment Declared | No SQL / No DTOs / No Endpoints | VERIFIED |
| Non-Requirements Enforced | Zero premature schemas / Zero infra | VERIFIED |
| Traceability to Stages 01, 02, 04, 05, 06 | Comprehensive mapping verified | VERIFIED |
| Codebase Lint Verification (`npm run lint`) | Zero errors | PASSED |
| Production Build Compilation (`npm run build`) | Zero errors | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | All tests passed | PASSED |
| GitHub Verification | Baseline & verification passed | PASSED |
| Product Owner Acceptance | Accepted | ACCEPTED |
| Stage Closure | Stage 07 closed | CLOSED |

```
================================================================================
STAGE 07 — CANONICAL 15-STEP WORKFLOW
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
IMPLEMENTATION: COMPLETE
WORKFLOW ENGINE: src/lib/workflow/canonical-workflow.ts (CANONICAL_15_STEPS)
TEST SUITE: src/tests/stage07-canonical-workflow.test.ts (PASSED)
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 07 CLOSED: YES
STAGE 08: NOT STARTED
================================================================================
```

STAGE 07 CLOSED: YES

NEXT STAGE:
STAGE 08 — NOT STARTED
