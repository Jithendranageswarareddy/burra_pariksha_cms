# Burra Pariksha CMS
# 08 — State Model

Stage: 08 — State Model

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
Defines the authoritative state architecture and lifecycle models for the Burra Pariksha Content Management System (BP-CMS). Formally decouples and specifies the five core state dimensions—Business Workflow Stage, Entity Lifecycle Status, Media Processing Status, Job Execution Status, and Publication Channel Status—and establishes rigorous state transition graphs, precondition guards, concurrency locking protocols, error isolation boundaries, and revision mechanics across all 10 substages (08.1 through 08.10).

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 08 State Model | FACT |
| **File Path** | `docs/architecture/08-STATE-MODEL.md` | FACT |
| **Document Stage** | Stage 08 — State Model | FACT |
| **Authority** | Authoritative Architecture Specification & Formal State Contract | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Accepted & Closed)<br>Stage 07 (`07-CANONICAL-15-STEP-WORKFLOW.md` - 100% Accepted & Closed at commit `9202e44`) | FACT |
| **Subsequent Stages** | Stage 09+ (Data Architecture, Target Schemas, Physical Storage Models, API Contracts) | FACT |
| **Baseline Repository Commit** | `9202e44` | FACT |
| **Architectural Scope** | Formally defines state machines, status enums, transition invariants, concurrency models, and failure isolation boundaries without declaring physical database tables or writing engine implementations | FACT |

---

## 02. Purpose

The objective of Stage 08 is to eliminate state ambiguity, split-brain desynchronization, and lifecycle conflation across BP-CMS. 

In the Stage 03 brownfield baseline, state management suffered from severe structural defects:
1. **Conflation of Dimensions:** Database row statuses (`VideoProductionStatus.QUEUED`, `SocialPublishStatus.PUBLISHED`, `QuestionStatus.APPROVED`) were treated interchangeably as business stage indicators, leading to multi-hop workarounds (`BRK-HD-02`) and orphaned records (`BRK-SF-01`).
2. **Technical Failure Masked as Business Rejection:** A transient ffmpeg transcode failure or Google Drive upload timeout was conflated with an editorial QC rejection, forcing creators through redundant re-recording cycles.
3. **Technical Retry Corrupting Versioning:** Automatic network retry logic in background workers caused business version numbers (`QuestionVersion`, `ScriptVersion`) to increment artificially.
4. **External Platform Intrusion:** Third-party webhook payloads or API sync flags directly altered core domain approval records, violating internal data ownership.
5. **Race Conditions:** Simultaneous writes across browser tabs or background jobs created split-brain states where a video was marked `PUBLISHED` on YouTube while its parent Content record remained `DRAFT`.

Stage 08 establishes the inviolable state constitution that permanently resolves these defects, providing mathematical clarity, strict encapsulation, and clean transition semantics for all future data architecture and implementation stages.

---

## 03. Scope & The Anti-Conflation Axiom

### 3.1 The Fundamental Axiom
The architecture of BP-CMS is founded upon the strict mathematical separation of five independent state dimensions:

```
================================================================================
                           THE BP-CMS STATE AXIOM
================================================================================

   BUSINESS STEP
         ≠
   ENTITY STATUS
         ≠
    MEDIA STATUS
         ≠
     JOB STATUS
         ≠
 PUBLICATION STATUS

(Also articulated in domain architecture as:
 Business Workflow Stage ≠ Entity Lifecycle Status ≠ Media Processing Status ≠ Job Execution Status ≠ Publication Channel Status)

================================================================================
```

### 3.2 Dimensional Definitions
1. **Business Workflow Stage (`WorkflowInstance.currentStage`):**
   - The authoritative 1-to-15 sequential manufacturing position of the content project (Stage 07).
   - Governed strictly by `WorkflowInstance` and validated by the centralized workflow engine (AP-001, AP-003).
   - Never stored on raw entity tables as a loose status string.

2. **Entity Lifecycle Status (`Entity.status`):**
   - The semantic business state of an individual domain object (e.g., `Question.status`, `Content.status`, `Video.status`, `Thumbnail.status`).
   - Represents whether the entity is draft, under review, certified, or deprecated within its own domain boundary.
   - Independent of external infrastructure or transient worker jobs.

3. **Media Processing Status (`MediaAsset.processingStatus`, `MediaReference.linkStatus`):**
   - The technical availability, storage integrity, and transcode readiness of binary media files in Google Drive or object storage (AP-007, AP-008).
   - Tracks checksums, proxy generation, and URL resolution without asserting editorial quality.

4. **Job Execution Status (`Job.status`):**
   - The transient runtime lifecycle of asynchronous worker tasks (AI generation calls, ffmpeg transcodes, thumbnail renders, batch syncs).
   - Purely operational and short-lived: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_FATAL`, `CANCELLED`.
   - Never modifies business approval records on failure.

5. **Publication Channel Status (`Publication.channelStatus`):**
   - The external distribution state of a staged release package on a specific third-party destination (YouTube Shorts, Instagram Reels, Facebook Video).
   - Encapsulates platform-specific scheduling, live URLs, API dispatch tokens, and sync validation.
   - Failures on one channel do not contaminate the internal master approval state or other channels.

### 3.3 Explicit Boundary Invariants
- **INV-08-01 (Dimensional Independence):** A mutation in any one dimension shall never implicitly mutate another dimension without explicit evaluation by the authoritative transition controller (AP-002, AP-003).
- **INV-08-02 (Separation of Failure):** A technical failure in Job Execution or Media Processing shall never be translated into an editorial rejection in Entity Lifecycle or a backward step in Workflow Stage.
- **INV-08-03 (Separation of Retry):** A technical retry of a failed job or network request shall never create a new business version or alter business timestamps.
- **INV-08-04 (External Isolation):** External platform states (e.g. YouTube video processing, copyright claim, or deletion) are recorded as external telemetry and shall never overwrite internal master editorial approval records.
- **INV-08-05 (Server-Side Authority):** All state evaluations, preconditions, and transitions must be executed and enforced on the backend server (AP-004, AP-005).

---

## 04. State Architecture Overview & Dimensional Separation

### 4.1 State Dimensional Matrix

| Dimension | Primary Owner | Scope / Responsibility | Cardinality to Content | Mutation Trigger | Persistence Location |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **1. Business Stage** | `WorkflowInstance` | Progression along Canonical Steps 01–15 | 1:1 | Server transition engine upon completed gate check | Workflow Ledger |
| **2. Entity Status** | Domain Aggregate (`Question`, `Content`, `Video`) | Editorial readiness, domain certification | 1:1 or 1:N | Human sign-off, SME audit, editor submission | Entity Record |
| **3. Media Status** | `MediaAsset` / `MediaReference` | Binary storage integrity, transcode readiness | 1:N | Storage webhook, transcode completion, virus scan | Media Catalog |
| **4. Job Status** | `JobInstance` / Task Queue | Technical async execution lifecycle | 0:N | Worker thread start, exit code, timeout | Ephemeral Queue / Job Store |
| **5. Publication Status**| `Publication` | Platform release execution & live URL sync | 1:N (per platform) | Platform API response, scheduler tick | Publishing Store |

### 4.2 Cross-Dimensional State Interaction Flow
The following diagram demonstrates how the five dimensions interact during a typical production milestone (e.g., Stage 06 Video Editing transitioning to Stage 07 Final QC) without conflating states:

```
[WORKFLOW DIMENSION]   Stage 06 (Editing Bay) ───────────────────────────────► Stage 07 (Final QC)
                               │                                                   ▲
                               │ (Trigger Render)                                  │ (Advance Step)
                               ▼                                                   │
[JOB DIMENSION]        Job: QUEUED ──► RUNNING ──► SUCCEEDED ──────────────────────┤
                                                     │                             │
                                                     ▼ (Output MP4)                │
[MEDIA DIMENSION]      MediaRef: UNRESOLVED ──► CHECKSUM_VALIDATED ────────────────┤
                                                     │                             │
                                                     ▼                             │
[ENTITY DIMENSION]     VideoEdit: DRAFT_CUT ──► RENDERED ──► QC_SUBMITTED ─────────┘
                                                              │
                                                              ▼ (Stage 07 Gate)
                                                       Master QC Sign-Off
```

If the render job fails (`Job: FAILED_RETRYABLE`), the Job dimension handles retry. The `WorkflowInstance` remains securely in Stage 06, `VideoEdit` remains in `DRAFT_CUT`, and no bogus editorial rejection is emitted.

---

## 05. Substage 08.1 — Question State Model

### 5.1 Entities in Question Domain
The Question Domain governs the pedagogical core of Burra Pariksha and contains three primary entities with independent lifecycles:
1. `Question` (Curriculum root entity)
2. `QuestionVersion` (Immutable revision record)
3. `QuestionReview` (SME verification audit)

### 5.2 Question Lifecycle States
```
                      ┌──────────────────────────────────────────────┐
                      │                                              │
                      ▼                                              │
 [DRAFT] ──► [PENDING_REVIEW] ──► [VERIFIED] ──► [RETIRED]           │
                  │                   │                              │
                  ▼                   └──────────► [SUPERSEDED]      │
            [REJECTED]                                               │
                  │                                                  │
                  ▼                                                  │
         [REVISION_REQUIRED] ────────────────────────────────────────┘
```

#### State Definitions
- `DRAFT`: Initial authoring state. Question text, options, explanations, and math proofs are being composed by a creator or generated via AI assistant. Editable by author.
- `PENDING_REVIEW`: Authoring complete. Question is locked for editing and enqueued for formal 10-point pedagogical audit by Lead Subject Matter Expert (Stage 02).
- `VERIFIED`: 10-point pedagogical audit passed with certified proof. Question is mathematically sound, grade-appropriate, and certified for downstream scriptwriting and filming. Locked against direct modification.
- `REJECTED`: Fails pedagogical audit on fundamental grounds (e.g., incorrect curriculum concept, unrecoverable ambiguity). Archived without rework.
- `REVISION_REQUIRED`: Audit identified remediable defects (e.g., typo in Telugu translation, ambiguous distractor option). Returns to creator queue for new revision.
- `SUPERSEDED`: A new approved `QuestionVersion` has replaced this question in an active content project.
- `RETIRED`: Pedagogically sound but withdrawn from active syllabus circulation.

### 5.3 QuestionVersion Lifecycle States
- `DRAFT_VERSION`: Uncommitted working revision.
- `SUBMITTED_VERSION`: Submitted for formal audit; content frozen.
- `APPROVED_VERSION`: Officially approved version attached to production project. Immutable.
- `SUPERSEDED_VERSION`: Historical approved version superseded by later revision. Immutable.
- `ARCHIVED_VERSION`: Historical record retained for audit purposes.

### 5.4 QuestionReview Lifecycle States
- `PENDING_ASSIGNMENT`: Review record initialized, awaiting SME claim.
- `IN_REVIEW`: SME actively evaluating the 10-point pedagogical audit criteria.
- `ACCEPTED`: Reviewer certifies all 10 criteria pass. Emits signed verification token (AP-009).
- `CHANGES_REQUESTED`: Reviewer notes specific defects requiring revision.
- `REJECTED`: Reviewer rejects question outright.

### 5.5 Permitted vs Forbidden Transitions

| Source State | Target State | Permitted? | Authorization Guard | Required Side Effects |
| :--- | :--- | :---: | :--- | :--- |
| `DRAFT` | `PENDING_REVIEW` | YES | Author or Content Creator | Validates Zod schema, emits `QUESTION_SUBMITTED` audit |
| `PENDING_REVIEW`| `VERIFIED` | YES | Lead SME / QA Reviewer (Human) | Requires 10/10 audit checklist pass (AP-009) |
| `PENDING_REVIEW`| `REVISION_REQUIRED`| YES | Lead SME / QA Reviewer | Requires recorded defect explanation |
| `PENDING_REVIEW`| `REJECTED` | YES | Lead SME / QA Reviewer | Emits `QUESTION_REJECTED` audit |
| `REVISION_REQUIRED`|`PENDING_REVIEW` | YES | Content Creator | Creates new incremented `QuestionVersion` |
| `VERIFIED` | `DRAFT` | **FORBIDDEN**| None (Violates Immutability) | Verified questions cannot be mutated in-place; must fork |
| `DRAFT` | `VERIFIED` | **FORBIDDEN**| None (Bypasses AP-009 Gate) | Direct jump to verified without review is prohibited |
| `REJECTED` | `VERIFIED` | **FORBIDDEN**| None | Rejected records cannot be resurrected directly |

### 5.6 Relationship to Workflow Stage
- In Step 01 (`Question Generation`), Question is in `DRAFT`.
- Advancing from Step 01 to Step 02 (`Question Verification`) moves Question to `PENDING_REVIEW`.
- Advancing from Step 02 to Step 03 requires Question to be in `VERIFIED` status.
- If Question enters `REVISION_REQUIRED`, the WorkflowInstance remains at Step 02 in `REWORK_REQUIRED` status, or routes revision back to Step 01.

---

## 06. Substage 08.2 — Content State Model

### 6.1 Entity: Content (Aggregate Root)
The `Content` entity acts as the macroscopic business coordinator uniting curriculum question, teleprompter script, video production project, graphic thumbnail, and multi-platform publishing package.

### 6.2 Content Lifecycle States
```
 [INITIATED] ──► [CURRICULUM_LOCKED] ──► [PRODUCTION_IN_PROGRESS] ──► [PACKAGING]
                                                                            │
 [ARCHIVED]  ◄──────────────── [ANALYZED] ◄──────────────── [RELEASED] ◄────┘
```

#### State Definitions
- `INITIATED`: Content container created and linked to an initial Question draft. No downstream production authorized.
- `CURRICULUM_LOCKED`: Associated Question has achieved `VERIFIED` status (Step 02 certified). The pedagogical foundation is locked. Scriptwriting is authorized.
- `PRODUCTION_IN_PROGRESS`: Script approved; filming takes or video editing cuts are actively being recorded and processed (Steps 03–07).
- `PACKAGING`: Master video cut certified by Final QC (Step 07 passed). Creative thumbnail framing and social distribution bundles are being configured (Steps 08–10).
- `RELEASED`: Content has been successfully published live on at least one production broadcast channel (Step 11).
- `ANALYZED`: 24-hour and 7-day audience engagement metrics collected and evaluated; pedagogical insights synthesized (Steps 13–15).
- `ARCHIVED`: Full production and evaluation lifecycle completed. Project files preserved in long-term archive.

### 6.3 State Invariants & Guards
- **INV-08-06 (Curriculum Precondition):** `Content` shall never enter `CURRICULUM_LOCKED` unless its linked `Question` is in `VERIFIED` status.
- **INV-08-07 (Production Freeze):** Once `Content` enters `PACKAGING`, the linked `Script` and raw filming takes are frozen against modification.
- **INV-08-08 (Release Truth):** `Content` shall enter `RELEASED` only when at least one associated `Publication` has attained verified `LIVE` status with a validated live URL regex.

---

## 07. Substage 08.3 — Video State Model

### 7.1 Entities in Video Production Domain
1. `Video` (Production container project)
2. `VideoTake` (Raw filming studio take)
3. `VideoEdit` (Post-production rendered cut)

### 7.2 Video Project Lifecycle States
```
 [SCHEDULED] ──► [RECORDING] ──► [RECORDED] ──► [EDITING] ──► [QC_PENDING] ──► [QC_PASSED] ──► [COMPLETED]
                                                   ▲                │
                                                   │ (QC Reject)    │
                                                   └────────────────┴────────► [QC_FAILED]
```

#### State Definitions
- `SCHEDULED`: Filming session booked; teleprompter script locked.
- `RECORDING`: Active camera session in studio. One or more `VideoTake` items being captured.
- `RECORDED`: Camera session concluded. At least one acceptable raw camera take uploaded and linked to Google Drive.
- `EDITING`: Video editor actively cutting master timeline, applying 9:16 vertical crop, Telugusubtitles, sound effects, and speed pacing.
- `QC_PENDING`: Master rendered MP4 cut submitted for 6-point Final QC review (Stage 07).
- `QC_PASSED`: Certified by QC Lead (all 6 technical and editorial QC points verified).
- `QC_FAILED`: Rejected by QC Lead with recorded failure defect codes. Rework routed back to `EDITING`.
- `COMPLETED`: Publication released and post-production deliverables signed off.

### 7.3 VideoTake & VideoEdit Child Lifecycles

#### VideoTake States
- `CAPTURING`: Studio camera stream actively recording.
- `UPLOADED`: Video raw file ingested into staging storage.
- `ACCEPTED`: Producer/Presenter marks take as viable for edit bay.
- `REJECTED`: Cut due to stumble, lighting glitch, or audio defect.
- `DISCARDED`: Camera test or unusable take.

#### VideoEdit States
- `DRAFT_CUT`: Work-in-progress timeline in NLE.
- `RENDER_QUEUED`: Master export requested.
- `RENDERING`: Background transcode worker processing MP4.
- `RENDERED`: Master MP4 rendered and checksum validated.
- `QC_SUBMITTED`: Submitted to Stage 07 review workbench.
- `APPROVED_MASTER`: Formally certified master cut for distribution.
- `SUPERSEDED`: Earlier render cut replaced by a newer revision.
- `REJECTED`: QC rejected cut.

### 7.4 Technical Render Failure vs Editorial QC Rejection
- **Case A: Render Job Fails:** Ffmpeg transcode runs out of memory or times out.
  - `Job.status`: `FAILED_RETRYABLE`
  - `VideoEdit.status`: Remains `DRAFT_CUT` or `RENDER_QUEUED`
  - `Video.status`: Remains `EDITING`
  - `WorkflowInstance.currentStage`: Remains 06 (`Editing Bay`)
  - **Result:** Purely technical retry. No QC rejection record created. No human alerted for editorial error.
- **Case B: Editorial QC Rejection:** QC Lead inspects rendered cut and finds Telugu subtitle typo or audio LUFS out of spec.
  - `VideoEdit.status`: `REJECTED`
  - `Video.status`: `QC_FAILED`
  - `WorkflowInstance.currentStage`: Rolls back to Stage 06 via backward rework transition (AP-001)
  - **Result:** True business rejection. Defect code logged in `QualityControlReview`. Editor notified.

---

## 08. Substage 08.4 — Media State Model

### 8.1 Entities in Media Domain
1. `MediaAsset` (Logical catalog descriptor)
2. `MediaReference` (External storage locator / URI pointer)

### 8.2 Media Processing & Storage Lifecycle States
```
 [REGISTERED] ──► [INGESTING] ──► [VERIFIED_STORAGE] ──► [PROXY_READY] ──► [ACTIVE]
        │                                                                    │
        ▼ (Storage Unreachable)                                              ▼
 [STORAGE_UNAVAILABLE] ◄─────────────────────────────────────────────── [DEPRECATED]
                                                                             │
                                                                             ▼
                                                                        [PURGED]
```

#### State Definitions
- `REGISTERED`: Logical asset record created in CMS; file upload initialized or external link registered.
- `INGESTING`: File binary transferring to designated storage bucket or Google Drive folder.
- `VERIFIED_STORAGE`: Remote file exists, is non-zero length, and matches expected SHA-256 checksum.
- `PROXY_READY`: Low-bitrate streaming proxy generated for web preview.
- `ACTIVE`: Fully operational asset accessible for editorial and distribution use.
- `STORAGE_UNAVAILABLE`: Storage provider reports 404, authorization failure, or timeout. Asset marked unresolvable without corrupting parent business entity.
- `DEPRECATED`: Replaced by newer media asset; preserved for historical reference.
- `PURGED`: Binary permanently deleted per data retention policies.

### 8.3 Media Reference URI Resolution States
- `UNRESOLVED`: Stored as a raw path or unvalidated URI.
- `LOCATED`: URI resolves to remote endpoint.
- `PERMISSIONS_VERIFIED`: Service account possesses read/write permission to file.
- `CHECKSUM_VALIDATED`: Remote byte stream verified against recorded checksum.
- `REVOKED`: Remote permissions removed or link broken.

---

## 09. Substage 08.5 — Archive State Model

### 09.1 Entities in Archive Domain
1. `ArchiveReference` (Deep storage manifest record)
2. `MediaAsset` Archival Flag / Tier Indicator

### 9.2 Archival Tiering Lifecycle States
```
 [HOT_OPERATIONAL] ──► [TIER_ELIGIBLE] ──► [ARCHIVING_IN_FLIGHT] ──► [COLD_ARCHIVED]
                                                                            │
                                                                            ▼
 [PURGED] ◄─────────────── [RESTORED_CACHE] ◄────────────────────── [RESTORE_REQUESTED]
```

#### State Definitions
- `HOT_OPERATIONAL`: Asset resides in active Google Drive production folders and CDN storage. Full instantaneous read/write access.
- `TIER_ELIGIBLE`: Content project completed and 90-day active broadcast retention window expired. Eligible for automated cold tiering.
- `ARCHIVING_IN_FLIGHT`: Background archival job transferring master raw footage and project files to cold cloud storage.
- `COLD_ARCHIVED`: Assets successfully written to cold storage; manifest recorded in `ArchiveReference`. Operational storage stubbed to conserve costs.
- `RESTORE_REQUESTED`: Operator requests retrieval of archived assets for re-broadcast or remastered release.
- `RESTORED_CACHE`: Assets temporarily rehydrated into operational storage with a 14-day expiry TTL.
- `PURGED`: Non-essential raw camera takes permanently purged per retention policy after 365 days. Master cuts are never purged.

### 9.3 Invariants
- Master MP4 video cuts, final thumbnails, and verified question proofs shall **NEVER** be purged.
- Archival tiering of media assets shall never modify the historical `PUBLISHED` status of a `Content` item or alter its published URLs.

---

## 10. Substage 08.6 — Publishing State Model

### 10.1 Entities in Publishing Domain
1. `PublishingPackage` (Staging release container)
2. `Publication` (Platform-specific release record)

### 10.2 PublishingPackage Lifecycle States
```
 [DRAFT_PACKAGE] ──► [REVIEW_READY] ──► [APPROVED] ──► [SCHEDULED] ──► [DISPATCHING]
                                                             │                │
 [CANCELLED] ◄───────────────────────────────────────────────┘                ▼
                                                       [FULLY_PUBLISHED] ◄── [PARTIALLY_PUBLISHED]
                                                              │
                                                              ▼
                                                       [DISPATCH_FAILED]
```

#### State Definitions
- `DRAFT_PACKAGE`: Metadata, platform-specific descriptions, hashtags, and pinned comments being assembled.
- `REVIEW_READY`: Package assembled; awaits Stage 10 Publishing Setup review.
- `APPROVED`: Release Coordinator certifies publishing readiness across all targets.
- `SCHEDULED`: Release scheduled for future automated publication at a specified timestamp.
- `DISPATCHING`: Distribution engine actively transmitting media binaries and metadata to platform APIs.
- `PARTIALLY_PUBLISHED`: Dispatched successfully to at least one platform, but failed or pending on others (e.g. YouTube Live, Instagram Failed).
- `FULLY_PUBLISHED`: All targeted platforms successfully published and verified live.
- `DISPATCH_FAILED`: All targeted platforms failed dispatch.
- `CANCELLED`: Scheduled release aborted by publisher before dispatch.

### 10.3 Publication (Per-Platform) Lifecycle States
Each target platform (YouTube Shorts, Instagram Reels, Facebook Video) maintains an independent `Publication` record:

| State | Definition | Trigger / Guard |
| :--- | :--- | :--- |
| `STAGED` | Platform payload generated and formatted. | Added to `PublishingPackage`. |
| `SCHEDULED` | Platform publication queue time set. | Package scheduled. |
| `UPLOADING` | Binary payload in transit to platform server. | Dispatcher starts upload. |
| `PROCESSING_REMOTE`| Upload complete; platform processing video (e.g. YouTube 4K/SD transcode). | Platform upload response received. |
| `LIVE` | Video is publicly accessible on platform. | Validated regex live URL confirmed. |
| `SYNC_VERIFIED`| Stage 12 verification passed (hashtags, sound, pinned comment confirmed). | Stage 12 sync audit passed. |
| `DISPATCH_FAILED` | Upload or API call failed. | API error response or retry exhaustion. |
| `REMOVED_EXTERNAL`| Video deleted or set private on remote platform. | Platform sync poll / webhook. |

### 10.4 Multi-Platform Partial Failure Isolation
If a content project is scheduled for YouTube Shorts, Instagram Reels, and Facebook Video:
- **Scenario:** YouTube upload succeeds (`LIVE`). Instagram upload fails due to OAuth token expiry (`DISPATCH_FAILED`).
- **State Impact:**
  - `Publication[YouTube]`: `LIVE`
  - `Publication[Instagram]`: `DISPATCH_FAILED`
  - `PublishingPackage`: `PARTIALLY_PUBLISHED`
  - `Content`: Enters `RELEASED` (because YouTube is live)
  - `WorkflowInstance`: Remains at Stage 11 in `BLOCKED_PARTIAL` or proceeds to Stage 12 with Instagram remediation enqueued.
- **Critical Guarantee:** The Instagram failure **DOES NOT** roll back YouTube, does not delete the video from YouTube, and does not revoke the QC approval!

---

## 11. Substage 08.7 — Job State Model

### 11.1 The Job Dimension: Asynchronous Worker Tasks
Jobs represent transient, automated technical executions:
- AI question generation calls
- Video ffmpeg proxy rendering
- Thumbnail PNG export and image compression
- Google Drive batch file ingestion
- Social platform analytics scrapers

### 11.2 Job Lifecycle States
```
                      ┌────────────────────────────────────────┐
                      │                                        │
                      ▼                                        │
 [QUEUED] ──► [RUNNING] ──► [SUCCEEDED]                        │
                 │                                             │
                 ├────────► [FAILED_RETRYABLE] ────────────────┘
                 │                 │ (Retries Exhausted)
                 │                 ▼
                 ├────────► [FAILED_FATAL] ──► [DEAD_LETTER]
                 │
                 ├────────► [TIMED_OUT]
                 │
                 └────────► [CANCELLED]
```

#### State Definitions
- `QUEUED`: Enqueued in persistent job queue; awaiting available worker thread.
- `RUNNING`: Worker process has acquired distributed lease and is actively executing. Heartbeat emitted periodically.
- `SUCCEEDED`: Job completed successfully with exit code 0. Output artifacts persisted.
- `FAILED_RETRYABLE`: Job failed due to transient network failure, rate limit, or temporary storage lock. Scheduled for exponential backoff retry.
- `FAILED_FATAL`: Job failed due to unrecoverable semantic error (e.g. corrupted input file, syntax error in prompt). Dead-lettered.
- `TIMED_OUT`: Worker heartbeat expired or total execution time exceeded max threshold.
- `CANCELLED`: Job aborted by operator or superseded by a newer request before completion.

### 11.3 Strict Job Invariants
- **INV-08-09 (Job Transience):** Job records are operational execution logs. They do not hold domain authority.
- **INV-08-10 (Failure Immunity):** A job terminating in `FAILED_RETRYABLE` or `FAILED_FATAL` shall never mutate an entity's business status to `REJECTED`.
- **INV-08-11 (Retry Isolation):** Automatic retries by the job engine shall never increment business version counters (`QuestionVersion.versionNumber`, `ScriptVersion.versionNumber`).

---

## 12. Substage 08.8 — Workflow State Model

### 12.1 Entities in Workflow Domain
1. `WorkflowInstance` (15-step state controller)
2. `WorkflowTransition` (Immutable transition event)

### 12.2 WorkflowInstance States
The `WorkflowInstance` coordinates overall content progression across the 15 canonical stages:

```
 [NOT_STARTED] ──► [ACTIVE] ──► [PAUSED] ──► [COMPLETED]
                     │            ▲
                     ▼            │
                 [BLOCKED] ───────┘
```

#### Operational States
- `NOT_STARTED`: Content project created; Step 01 has not yet been initiated.
- `ACTIVE`: Content is actively progressing through one of the 15 canonical steps.
- `BLOCKED`: Progression halted due to unmet prerequisite, missing asset, or failed human gate check.
- `PAUSED`: Operator placed project on hold for business reasons.
- `COMPLETED`: Content has completed all 15 stages, including Stage 15 Intelligence Loop synthesis.

### 12.3 Step Execution Sub-States within WorkflowInstance
For each step $n \in \{1 \dots 15\}$ in the active workflow, the step execution state is tracked:
- `STEP_NOT_STARTED`: Upstream step has not completed.
- `STEP_IN_PROGRESS`: Step workbench active; work being performed.
- `STEP_AWAITING_HUMAN_SIGN_OFF`: Prerequisite work finished; awaiting authorized human approval (mandatory for Steps 02, 07, 09, 10, 14, 15 per AP-009).
- `STEP_COMPLETED`: Human sign-off certified; output entity validated; ready for forward transition.
- `STEP_REWORK_REQUIRED`: Reviewer rejected step output; rework path engaged.

### 12.4 WorkflowTransition: The Immutable Transition Record
Every advancement or backward movement of the workflow is immutably recorded in `WorkflowTransition`:
- `transitionId`: Canonical identifier (`TRN-xxxxxxxx`)
- `workflowInstanceId`: Parent workflow ID
- `fromStage`: Prior canonical stage (1–15)
- `toStage`: Target canonical stage (1–15)
- `transitionType`:
  * `FORWARD`: Standard sequential progression ($n 	o n+1$)
  * `BACKWARD_REWORK`: Validated backward rework path (e.g. Stage 07 QC Reject $	o$ Stage 06 Editing)
  * `RETRY_STEP`: Re-evaluating current step after defect resolution
  * `CURRICULUM_LOOPBACK`: Validated loopback from Stage 15 $	o$ Stage 01
- `actorUserId`: Authenticated user executing the transition
- `humanSignOff`: Cryptographically verified approval token if human-gated (AP-009)
- `transitionReason`: Mandatory explanatory text
- `timestamp`: UTC timestamp of transition

---

## 13. Substage 08.9 — Transition Rules & Invariants

### 13.1 Universal Transition Invariants

```
================================================================================
                    UNIVERSAL WORKFLOW TRANSITION RULES
================================================================================

1. SEQUENTIAL PROGRESSION (AP-001):
   Forward transitions MUST be strictly sequential: toStage = fromStage + 1.
   Arbitrary jumps (e.g. Stage 01 -> Stage 04) are architecturally forbidden.

2. AUTHORITATIVE ENGINE ROUTING (AP-003):
   Every transition MUST execute through the centralized workflow transition
   engine. Direct database updates or client-side status patches are rejected.

3. MANDATORY HUMAN GATING (AP-009):
   Stages 02, 07, 09, 10, 14, and 15 require explicit, authenticated human
   sign-off. AI agents are structurally barred from self-approving these gates.

4. PRECONDITION VERIFICATION (AP-005):
   A forward transition shall fail immediately if any required prerequisite
   entity, media asset, or validation rule is not 100% satisfied.

5. ATOMIC AUDIT EMISSION (AP-014):
   A transition transaction MUST atomically persist the new state and write an
   immutable AuditEvent. If audit writing fails, the transition rolls back.

================================================================================
```

### 13.2 Valid Forward & Backward Transitions Matrix

| From Stage | To Stage | Type | Permitted? | Required Actor / Authority | Mandatory Precondition Checklist |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **01** | **02** | FORWARD | YES | Creator / SME | Valid 4-option Question schema, mathematical proof verified |
| **02** | **03** | FORWARD | YES | Lead SME (Human) | 10-point pedagogical audit passed, Question in `VERIFIED` status |
| **02** | **01** | REWORK | YES | Lead SME (Human) | Question audit failed; defect reason recorded; new version required |
| **03** | **04** | FORWARD | YES | Scriptwriter | Script approved, teleprompter pacing certified, status `SCRIPT_READY` |
| **03** | **02** | REWORK | YES | Scriptwriter / SME | Scripting uncovered pedagogical ambiguity; question re-audit required |
| **04** | **05** | FORWARD | YES | Presenter / Camera Op | Studio session logged; at least 1 raw take recorded |
| **04** | **03** | REWORK | YES | Presenter | Spoken pacing defect; script adjustment required |
| **05** | **06** | FORWARD | YES | Production Lead | Raw camera footage attached to Drive; status `RECORDED` |
| **05** | **04** | REWORK | YES | Editor / Director | Raw footage unusable (audio buzz/lighting); re-shoot required |
| **06** | **07** | FORWARD | YES | Video Editor | Final cut exported and linked; status `EDITED` |
| **07** | **08** | FORWARD | YES | QC Lead (Human) | All 6 Master QC points certified; status `READY_TO_UPLOAD` |
| **07** | **06** | REWORK | YES | QC Lead (Human) | Master cut failed QC; specific defect codes logged |
| **08** | **09** | FORWARD | YES | Graphic Designer | Thumbnail image uploaded to Drive; status `APPROVED` |
| **08** | **03** | REWORK | YES | Designer / Producer | Hook headline misaligned with script; hook copy revision required |
| **09** | **10** | FORWARD | YES | Social Lead (Human) | 9:16 mobile simulator audit passed; safe-zones verified |
| **09** | **08** | REWORK | YES | Social Lead (Human) | Thumbnail illegible in mobile feed; thumbnail redesign required |
| **09** | **06** | REWORK | YES | Social Lead (Human) | Subtitles clipped in mobile UI overlay; re-edit required |
| **10** | **11** | FORWARD | YES | Publisher (Human) | Release schedule confirmed; multi-platform payloads staged |
| **10** | **09** | REWORK | YES | Publisher | Platform compliance failure; packaging rework required |
| **11** | **12** | FORWARD | YES | Distribution Engine | Regex validated live URLs confirmed on primary channel |
| **12** | **13** | FORWARD | YES | Social Ops Spec. | Cross-platform adaptation verified; sound sync confirmed |
| **13** | **14** | FORWARD | YES | Analytics Engine | 24h / 7d engagement metrics collected and recorded |
| **14** | **15** | FORWARD | YES | Strategy Lead (Human) | Retention curve drop-offs analyzed; student confusion identified |
| **15** | **01** | LOOPBACK| YES | Exec Producer (Human) | Pedagogical insight synthesized into new curriculum topic |

### 13.3 Forbidden Transition Patterns
- **Illegal Forward Skip:** Attempting $n 	o n+2$ (e.g. Stage 01 $	o$ Stage 03, bypassing Stage 02 SME verification) is rejected with `ERR_WORKFLOW_ILLEGAL_JUMP`.
- **Unverified Backward Hop:** Jumping backward to arbitrary non-contiguous stages without documented rationale is prohibited.
- **Client-Side Direct Mutation:** Firing `PATCH /api/content/:id` with `{ stage: 11 }` bypasses the transition controller and is rejected with HTTP 403.
- **Automated AI Sign-Off on Gated Stages:** Submitting an AI agent token to advance Steps 02, 07, 09, 10, 14, or 15 without human cryptographic signature is rejected with `ERR_AI_HUMAN_GATING_VIOLATION`.

---

## 14. Substage 08.10 — Concurrency & Synchronization Rules

### 14.1 Concurrency Challenges in Educational Media Pipelines
In BP-CMS, multiple operators (presenters, editors, QC reviewers) and automated processes (video renderers, analytics scrapers) concurrently interact with the same content items. Without strict concurrency controls, split-brain updates and lost writes occur.

### 14.2 Concurrency Protocols

#### 1. Optimistic Locking on Domain Entities
All mutable domain entities (`Question`, `Content`, `Video`, `PublishingPackage`) maintain an integer `version` and UTC `updatedAt` timestamp:
- Every mutation request must submit the current `version` number.
- The server executes:
  ```sql
  UPDATE entities 
  SET version = version + 1, status = :newStatus, updatedAt = NOW()
  WHERE id = :id AND version = :expectedVersion;
  ```
- If the affected row count is 0, the transaction aborts with `HTTP 409 Conflict` (`ERR_CONCURRENT_MODIFICATION_DETECTED`). The client must re-fetch and present diff reconciliation.

#### 2. Idempotency Keys on Transition Commands
Every workflow transition command must supply a unique client-generated or transaction-scoped `idempotencyKey` (`UUIDv4`):
- The server checks if `idempotencyKey` has already been processed within the last 24 hours.
- If already processed, the server returns the cached transition response without re-executing business logic or creating duplicate `AuditEvent` rows.

#### 3. Distributed Lease / Critical Section for Stage Advancement
Advancing a `WorkflowInstance` from Stage $n 	o n+1$ requires an exclusive distributed lease on `workflow:{contentId}`:
- Lease TTL is set to 5000ms.
- Prevents concurrent requests (e.g. double-click by user or simultaneous webhook and UI click) from advancing the workflow twice.
- If lease cannot be acquired within 1000ms, the request fails with `HTTP 429 Too Many Requests` or `HTTP 409 Conflict`.

#### 4. Fork-Join Synchronization for Multi-Platform Publishing
When publishing across multiple platforms (YouTube, Instagram, Facebook):
- The `PublishingPackage` initiates a fork: creates independent `Publication` records for each channel.
- Each channel dispatches asynchronously under its own worker lease.
- A join evaluator evaluates channel statuses:
  * When all channels reach `LIVE`, `PublishingPackage` transitions to `FULLY_PUBLISHED`.
  * If one channel fails and others succeed, status becomes `PARTIALLY_PUBLISHED`.
  * Lock on `PublishingPackage` is held only during the status rollup evaluation, avoiding channel starvation.

---

## 15. Disentanglement: Technical Failure vs Business Rejection

### 15.1 Architectural Problem
In flawed architectures, an exception in a technical service is treated as an editorial decision. For example, if a video transcode fails due to lack of disk space, the system sets `Video.status = REJECTED`, which displays "Rejected by QC" in the user interface. This erodes user trust and destroys audit integrity.

### 15.2 Disentanglement Matrix

| Event Scenario | Technical Dimension Impact | Entity Dimension Impact | Workflow Dimension Impact | User Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Ffmpeg Out-of-Memory during render** | `Job: FAILED_RETRYABLE` | `VideoEdit: RENDER_QUEUED` (No change) | `WorkflowInstance: Stage 06` (No change) | Infrastructure team / Automatic retry with larger memory |
| **Google Drive API 503 Service Unavailable** | `MediaRef: STORAGE_UNAVAILABLE` | `VideoTake: RECORDED` (No change) | `WorkflowInstance: Stage 05` (No change) | Automatic exponential backoff retry |
| **QC Lead identifies audio clipping & typo** | `Job: None (Human review)` | `VideoEdit: REJECTED`<br>`Video: QC_FAILED` | `WorkflowInstance: Stage 07 -> Stage 06` (Rework) | Video Editor re-cuts audio and subtitles |
| **YouTube API 401 Invalid Credentials** | `Job: FAILED_FATAL` | `Publication[YT]: DISPATCH_FAILED` | `PublishingPackage: PARTIALLY_PUBLISHED` | Admin re-authenticates OAuth token |
| **Lead SME identifies factual error in math** | `Job: None (Human review)` | `Question: REVISION_REQUIRED` | `WorkflowInstance: Stage 02 -> Stage 01` (Rework) | Creator rewires mathematical proof |

---

## 16. Disentanglement: Technical Retry vs Business Revision

### 16.1 Architectural Problem
When a network call times out or an asynchronous job restarts, naive systems trigger revision logic, creating unwanted entity versions (e.g., jumping from `QuestionVersion 1` to `QuestionVersion 5` after 4 network retries).

### 16.2 Disentanglement Rules
1. **Business Version Increment Rule:** An entity's business version number (`versionNumber`) shall increment **ONLY** upon an authenticated human submission containing modified domain content or responding to an editorial rework request.
2. **Technical Retry Rule:** Technical worker retries (up to max retry budget) shall operate strictly upon the same version token, mutating only `JobInstance.attemptCount` and `JobInstance.lastError`.
3. **Idempotent Artifact Storage:** Re-running a render or transcode job overwrites or replaces the intermediate technical file without generating a new domain entity.

---

## 17. External Platform State Decoupling Architecture

### 17.1 The Threat of External Contamination
External social platforms (YouTube, Instagram, Facebook) are non-authoritative third parties:
- They may delete videos, alter transcoding flags, demonetize content, or change metrics algorithms at will.
- If BP-CMS permitted external platform webhooks to directly mutate internal editorial approval statuses, a copyright claim on YouTube could delete a verified educational curriculum record in BP-CMS!

### 17.2 The Decoupled Ingestion Model

```
┌─────────────────────────┐          ┌──────────────────────────┐          ┌─────────────────────────┐
│ External Platform API   │          │ Integration Buffer       │          │ Authoritative BP-CMS    │
│ (YouTube / Meta)        │ ───────► │ (Telemetry Ingestion)    │ ───────► │ Domain Core             │
└─────────────────────────┘          └──────────────────────────┘          └─────────────────────────┘
      (Non-authoritative)               (Filtered & Normalised)                (Protected & Sovereign)
      - Video Demoted                   - Stores External Event                - Editorial Status INTACT
      - View Count Changed              - Updates Snapshot Record              - Question Verified INTACT
      - Copyright Flagged               - Dispatches Admin Alert               - Master MP4 INTACT
```

### 17.3 Ingestion Rules
1. External platform events are ingested as raw telemetry into `AnalyticsSnapshot` or `ExternalPlatformEvent`.
2. External events shall **NEVER** modify `Question.status`, `Content.status`, `Video.status`, or `WorkflowInstance.currentStage`.
3. If an external platform flags or deletes a live video, the `Publication.channelStatus` transitions to `REMOVED_EXTERNAL` or `FLAGGED_EXTERNAL`, and an operational `Notification` is sent to the Release Coordinator. The internal historical record of publication remains permanently intact.

---

## 18. Brownfield Status Transition Mapping Matrix

To ensure flawless modernization from the Stage 03 brownfield baseline into the clean Stage 08 architecture, all legacy status enums are mapped deterministically to their new canonical dimensions:

| Legacy Brownfield Enum & Value | Modern Domain Dimension | Clean Target Status | Resolution / Modernization Action |
| :--- | :--- | :--- | :--- |
| `QuestionStatus.DRAFT` | Entity Status (`Question`) | `QuestionStatus.DRAFT` | Preserved as question authoring state |
| `QuestionStatus.GENERATED` | Entity Status (`Question`) | `QuestionStatus.DRAFT` (AI-assisted) | Normalized to draft with `isAiGenerated = true` |
| `QuestionStatus.EDITING` | Entity Status (`Question`) | `QuestionStatus.DRAFT` | Normalized to active authoring draft |
| `QuestionStatus.APPROVED` | Entity Status (`Question`) | `QuestionStatus.VERIFIED` | Renamed to verified to signify 10-point audit |
| `QuestionStatus.REJECTED` | Entity Status (`Question`) | `QuestionStatus.REJECTED` | Preserved as editorial rejection |
| `QuestionStatus.ARCHIVED` | Entity Status (`Question`) | `QuestionStatus.RETIRED` | Mapped to retirement from syllabus |
| `VideoProductionStatus.QUEUED` | Workflow / Entity Status | Workflow Step 03 / `Video.SCHEDULED` | Decoupled: Step is in workflow, video is scheduled |
| `VideoProductionStatus.RECORDING` | Entity Status (`Video`) | `Video.RECORDING` | Preserved as studio camera session |
| `VideoProductionStatus.RECORDED` | Entity Status (`Video`) | `Video.RECORDED` | Preserved; raw footage verified in Drive |
| `VideoProductionStatus.EDITING` | Entity Status (`Video`) | `Video.EDITING` | Preserved as post-production cut |
| `VideoProductionStatus.EDITED` | Entity Status (`Video`) | `Video.QC_PENDING` | Mapped to pending Final QC review |
| `VideoProductionStatus.READY_TO_UPLOAD`| Entity Status (`Video`) | `Video.QC_PASSED` | Certified master cut ready for packaging |
| `VideoProductionStatus.UPLOADED` | Publication Status | `Publication.LIVE` | Extracted from video entity to publication! |
| `SocialPublishStatus.SCHEDULED` | Publishing Status | `PublishingPackage.SCHEDULED` | Moved to publishing domain aggregate |
| `SocialPublishStatus.PUBLISHED` | Publication Status | `Publication.LIVE` | Tracked per platform with regex URL |
| `SocialPublishStatus.FAILED` | Publication Status | `Publication.DISPATCH_FAILED` | Isolated to specific failed channel |
| `ContentMasterStatus.APPROVED` | Content Status | `Content.CURRICULUM_LOCKED` | Clarified as curriculum certification |

---

## 19. Authoritative State Enum Declarations

The following TypeScript definitions represent the authoritative contract for target state enums across all dimensions:

```typescript
// ============================================================================
// 1. BUSINESS WORKFLOW DIMENSION (Owned by WorkflowInstance)
// ============================================================================

export type CanonicalStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export enum WorkflowInstanceState {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum StepExecutionState {
  STEP_NOT_STARTED = 'STEP_NOT_STARTED',
  STEP_IN_PROGRESS = 'STEP_IN_PROGRESS',
  STEP_AWAITING_HUMAN_SIGN_OFF = 'STEP_AWAITING_HUMAN_SIGN_OFF',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_REWORK_REQUIRED = 'STEP_REWORK_REQUIRED',
}

export enum WorkflowTransitionType {
  FORWARD = 'FORWARD',
  BACKWARD_REWORK = 'BACKWARD_REWORK',
  RETRY_STEP = 'RETRY_STEP',
  CURRICULUM_LOOPBACK = 'CURRICULUM_LOOPBACK',
}

// ============================================================================
// 2. ENTITY LIFECYCLE DIMENSIONS (Owned by Domain Aggregates)
// ============================================================================

export enum QuestionLifecycleState {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
  RETIRED = 'RETIRED',
}

export enum QuestionVersionState {
  DRAFT_VERSION = 'DRAFT_VERSION',
  SUBMITTED_VERSION = 'SUBMITTED_VERSION',
  APPROVED_VERSION = 'APPROVED_VERSION',
  SUPERSEDED_VERSION = 'SUPERSEDED_VERSION',
  ARCHIVED_VERSION = 'ARCHIVED_VERSION',
}

export enum ContentLifecycleState {
  INITIATED = 'INITIATED',
  CURRICULUM_LOCKED = 'CURRICULUM_LOCKED',
  PRODUCTION_IN_PROGRESS = 'PRODUCTION_IN_PROGRESS',
  PACKAGING = 'PACKAGING',
  RELEASED = 'RELEASED',
  ANALYZED = 'ANALYZED',
  ARCHIVED = 'ARCHIVED',
}

export enum VideoProjectState {
  SCHEDULED = 'SCHEDULED',
  RECORDING = 'RECORDING',
  RECORDED = 'RECORDED',
  EDITING = 'EDITING',
  QC_PENDING = 'QC_PENDING',
  QC_PASSED = 'QC_PASSED',
  QC_FAILED = 'QC_FAILED',
  COMPLETED = 'COMPLETED',
}

export enum VideoTakeState {
  CAPTURING = 'CAPTURING',
  UPLOADED = 'UPLOADED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DISCARDED = 'DISCARDED',
}

export enum VideoEditState {
  DRAFT_CUT = 'DRAFT_CUT',
  RENDER_QUEUED = 'RENDER_QUEUED',
  RENDERING = 'RENDERING',
  RENDERED = 'RENDERED',
  QC_SUBMITTED = 'QC_SUBMITTED',
  APPROVED_MASTER = 'APPROVED_MASTER',
  SUPERSEDED = 'SUPERSEDED',
  REJECTED = 'REJECTED',
}

export enum ThumbnailState {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  REVIEW_PENDING = 'REVIEW_PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

// ============================================================================
// 3. MEDIA PROCESSING DIMENSION (Owned by Media Domain)
// ============================================================================

export enum MediaAssetProcessingState {
  REGISTERED = 'REGISTERED',
  INGESTING = 'INGESTING',
  VERIFIED_STORAGE = 'VERIFIED_STORAGE',
  PROXY_READY = 'PROXY_READY',
  ACTIVE = 'ACTIVE',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  DEPRECATED = 'DEPRECATED',
  PURGED = 'PURGED',
}

export enum MediaReferenceResolutionState {
  UNRESOLVED = 'UNRESOLVED',
  LOCATED = 'LOCATED',
  PERMISSIONS_VERIFIED = 'PERMISSIONS_VERIFIED',
  CHECKSUM_VALIDATED = 'CHECKSUM_VALIDATED',
  REVOKED = 'REVOKED',
}

// ============================================================================
// 4. JOB EXECUTION DIMENSION (Ephemeral Technical Tasks)
// ============================================================================

export enum JobExecutionState {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_FATAL = 'FAILED_FATAL',
  TIMED_OUT = 'TIMED_OUT',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// 5. PUBLICATION CHANNEL DIMENSION (Platform Release Execution)
// ============================================================================

export enum PublishingPackageState {
  DRAFT_PACKAGE = 'DRAFT_PACKAGE',
  REVIEW_READY = 'REVIEW_READY',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  DISPATCHING = 'DISPATCHING',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  FULLY_PUBLISHED = 'FULLY_PUBLISHED',
  DISPATCH_FAILED = 'DISPATCH_FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ChannelPublicationState {
  STAGED = 'STAGED',
  SCHEDULED = 'SCHEDULED',
  UPLOADING = 'UPLOADING',
  PROCESSING_REMOTE = 'PROCESSING_REMOTE',
  LIVE = 'LIVE',
  SYNC_VERIFIED = 'SYNC_VERIFIED',
  DISPATCH_FAILED = 'DISPATCH_FAILED',
  REMOVED_EXTERNAL = 'REMOVED_EXTERNAL',
}
```

---

## 20. Architectural Deferrals

To maintain strict adherence to SDLC boundary governance, the following areas are explicitly deferred to future stages:
1. **Physical Database Schemas & DDL:** SQL create table scripts, foreign key constraints, table column types, and migration scripts are deferred to Stage 09.
2. **ORM / Persistence Models:** Drizzle ORM schemas, Prisma models, or repository classes are deferred to Stage 09+.
3. **Workflow Engine Implementation:** The physical implementation of the workflow transition engine in code is deferred to implementation stages.
4. **API Endpoints & Controllers:** REST routes (`POST /api/transitions`), DTO validators, and HTTP controllers are deferred to Stage 10+.
5. **Physical Message Queues:** Selection and provisioning of BullMQ, Redis, or Cloud Pub/Sub infrastructure are deferred to infrastructure stages.

---

## 21. Traceability Matrix

### 21.1 Traceability to Preceding Authoritative Stages

| Preceding Artifact | Principle / Requirement ID | How Stage 08 Satisfies & Enforces the Requirement |
| :--- | :--- | :--- |
| **Stage 01: Requirements** | `BR-001` (15-step pipeline) | Formally specifies `WorkflowInstance` and sequential transition graph |
| **Stage 01: Requirements** | `BR-004` (Human approval) | Enforces human-gating rules for Steps 02, 07, 09, 10, 14, 15 in state engine |
| **Stage 01: Requirements** | `NFR-004` (Audit compliance) | Enforces atomic `AuditEvent` emission on every state transition |
| **Stage 02: Acceptance** | `AC2-001` (Sequential progress) | Prohibits non-sequential jumps via strict transition matrix |
| **Stage 02: Acceptance** | `AC2-005` (Media storage decoupling)| Isolates `MediaReference` state from editorial video project state |
| **Stage 04: Architecture** | `AP-001` (One canonical workflow)| Models canonical 15 steps as sole business progression axis |
| **Stage 04: Architecture** | `AP-002` (Business vs Tech State)| Establishes the 5 independent state dimensions axiom |
| **Stage 04: Architecture** | `AP-003` (Transition authority)| Enforces centralized server-side transition engine execution |
| **Stage 04: Architecture** | `AP-004` (Backend authorization)| All state transitions require authenticated actor roles |
| **Stage 04: Architecture** | `AP-005` (Backend business rules)| Preconditions independently verified on server prior to state advancement |
| **Stage 04: Architecture** | `AP-007` (Binary offload) | Decouples media storage availability from domain approvals |
| **Stage 04: Architecture** | `AP-009` (AI human gating) | AI agents barred from advancing human-gated checkpoints |
| **Stage 04: Architecture** | `AP-014` (Immutable audit trail)| State transitions require atomic audit ledger persistence |
| **Stage 05: System Boundary**| Domain Boundaries | 16 internal domains mapped to their respective state responsibilities |
| **Stage 06: Domain Model** | 27 Domain Entities | All entity lifecycles mapped to the clean state architecture |
| **Stage 07: 15-Step Workflow**| 15 Canonical Stages | Step contracts mapped 1:1 to workflow states and gate conditions |

---

## 22. Stage 08 Verification Gate

The following checklist must be satisfied to establish completion of Stage 08:

- [x] Authoritative document `docs/architecture/08-STATE-MODEL.md` created.
- [x] The fundamental state axiom established: Business Step ≠ Entity Status ≠ Media Status ≠ Job Status ≠ Publication Status.
- [x] All 10 required substages accounted for:
  * 08.1 Question state
  * 08.2 Content state
  * 08.3 Video state
  * 08.4 Media state
  * 08.5 Archive state
  * 08.6 Publishing state
  * 08.7 Job state
  * 08.8 Workflow state
  * 08.9 Transition rules
  * 08.10 Concurrency rules
- [x] Technical failure formally disentangled from business rejection.
- [x] Technical retry formally disentangled from business version increment.
- [x] External platform state decoupled from internal authoritative domain state.
- [x] Optimistic locking and concurrency controls specified.
- [x] Complete brownfield enum mapping matrix established.
- [x] Authoritative TypeScript state enum declarations provided.
- [x] Physical database schemas, DDL, and API code explicitly deferred.
- [x] Full traceability to Stages 01, 02, 04, 05, 06, and 07 documented.
- [x] Application source code, package.json, and infrastructure remain 100% untouched.
- [x] Codebase lint and compilation pass cleanly.

---

## 23. Closure Record

### 23.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| 5 State Dimensions Formally Decoupled | Axiom enforced across all domains | VERIFIED |
| TypeScript State Code (`src/types/state-models.ts`) | All 5 dimensions & 10 substages strongly typed | VERIFIED |
| Stage 08 Automated Test Suite (`npm run test:stage08`) | 7/7 verification checks passed | PASSED |
| Substage 08.1 Question State Machine | Question, QuestionVersion, QuestionReview lifecycles | VERIFIED |
| Substage 08.2 Content State Machine | Content aggregate root lifecycle & invariants | VERIFIED |
| Substage 08.3 Video State Machine | Video, VideoTake, VideoEdit lifecycles & QC failure path | VERIFIED |
| Substage 08.4 Media State Machine | MediaAsset, MediaReference, storage availability | VERIFIED |
| Substage 08.5 Archive State Machine | ArchiveReference, cold tiering, and restore cache | VERIFIED |
| Substage 08.6 Publishing State Machine | PublishingPackage & per-platform Publication lifecycle | VERIFIED |
| Substage 08.7 Job State Machine | Ephemeral async task execution lifecycle | VERIFIED |
| Substage 08.8 Workflow State Machine | WorkflowInstance & 15-step progression lifecycle | VERIFIED |
| Substage 08.9 Transition Rules & Invariants | Sequential rules, validation guards, AP-001/003/009 | VERIFIED |
| Substage 08.10 Concurrency Rules | Optimistic locking, idempotency keys, distributed leases | VERIFIED |
| Failure & Retry Disentanglement | Technical failures != rejections; retries != revisions | VERIFIED |
| External Platform Decoupling | External webhooks cannot mutate internal approval records | VERIFIED |
| Brownfield Status Mapping | Complete mapping for all Stage 03 enums | VERIFIED |
| Persistence & API Deferment Declared | No SQL / No DTOs / No Engine Code | VERIFIED |
| Non-Requirements Enforced | Zero premature SQL / Zero infra | VERIFIED |
| Traceability to Stages 01–07 | Comprehensive mapping verified | VERIFIED |
| Codebase Lint Verification (`npm run lint`) | Zero errors | PASSED |
| Production Build Compilation (`npm run build`) | Zero errors | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | All tests passed | PASSED |
| Product Owner Acceptance | Accepted | ACCEPTED |
| Stage Closure | Stage 08 closed | CLOSED |

```
================================================================================
STAGE 08 — STATE MODEL
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
IMPLEMENTATION: COMPLETE
STATE CODE: src/types/state-models.ts (5 DIMENSIONS TYPED)
TEST SUITE: src/tests/stage08-state-model.test.ts (PASSED)
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 08 CLOSED: YES
STAGE 09: NOT STARTED
================================================================================
```

STAGE 08 CLOSED: YES

NEXT STAGE:
STAGE 09 — NOT STARTED
