# 08 — STATE MODEL
## Burra Pariksha Content Management System (BP-CMS)
### Stage 08 of 30-Stage Modernization Program — Authoritative Multi-Dimensional State Architecture

```
================================================================================
Document ID:       BP-ARCH-08-STATE
Version:           8.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL CONTRACT
Scope:             Multi-Dimensional State Model & Concurrency Governance
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
Downstream Stages: 09-RBAC-CAPABILITY-MODEL.md
                   12-DATA-ARCHITECTURE.md
                   13-API-CONTRACT.md
                   14-WORKFLOW-ENGINE-IMPLEMENTATION.md
                   15+ Runtime Implementation Stages
Target Concept:    Strict Dimensional Decoupling of State
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative, multi-dimensional **State Model** for the Burra Pariksha Content Management System (BP-CMS). Its primary objective is to definitively eradicate the architectural defect present in the brownfield system where disparate operational states—business workflow position, entity lifecycle, external media availability, asynchronous worker job status, external publication status, and archival tiers—were collapsed into competing and ambiguous universal `status` fields.

### 1.2 The Fundamental State Axiom
Every state representation in BP-CMS must adhere to the **Fundamental State Axiom**:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE FUNDAMENTAL STATE AXIOM                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│   BUSINESS WORKFLOW STAGE  ≠  ENTITY LIFECYCLE STATE  ≠  MEDIA ASSET / REFERENCE STATE      │
│                            ≠  ASYNC JOB STATE         ≠  EXTERNAL PUBLICATION STATE         │
│                            ≠  ARCHIVE LIFECYCLE STATE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

These dimensions represent fundamentally distinct physical and conceptual realities. Collapsing them into a single `status` property causes state collisions, phantom workflow resets, race conditions, and corrupted audit logs.

### 1.3 Anti-Overclaim Invariants
1. **Contractual Specification Only:** This document formalizes the *conceptual state model* and transition boundaries. It does **not** assert that database schemas, migration scripts, or full runtime state-machine engines have been implemented or deployed.
2. **Zero Runtime Code Modification:** No application source code, Express handlers, database records, or frontend store implementations are altered during Stage 08.
3. **Zero Database / Persistence Execution:** No Google Sheets columns, Firestore collections, or SQL DDL statements are created or executed.

---

## 2. State-Dimension Architecture

BP-CMS partitions all system state into **six strictly decoupled, orthogonal dimensions**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              MULTI-DIMENSIONAL STATE MATRIX                            │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ State Dimension               │ Business & Architectural Responsibility                │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ 1. Business Workflow State    │ "What canonical business stage is this Content in?"    │
 │ 2. Entity Lifecycle State     │ "What operational condition is this business domain    │
 │                               │  object currently in?"                                 │
 │ 3. Media Processing State     │ "What is the ingestion, verification, or availability  │
 │                               │  condition of the external media asset?"               │
 │ 4. Async Job State            │ "What is the technical progress of an asynchronous     │
 │                               │  worker execution unit?"                               │
 │ 5. Publication State          │ "What is the readiness of the package, and what is     │
 │                               │  the confirmed condition on external platforms?"       │
 │ 6. Archive Lifecycle State    │ "What cold-storage tier or preservation condition is   │
 │                               │  this completed asset retained under?"                 │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

### 2.1 Why Universal `status = "..."` is Strictly Prohibited
In brownfield codebases, developers frequently attach a single `status: string` or generic enum to an aggregate. This creates severe structural failures:
1. **False Equivalence of Failure:** If an external YouTube upload job fails due to an API timeout (`JOB FAILED`), marking the entity `status = FAILED` falsely implies that the verified Question or edited Video cut is invalid.
2. **State Overwriting on Review:** If an editor touches an approved video during safe-zone inspection, an ad-hoc status patch can overwrite `QC_PASSED` back to `EDITING`, breaking the upstream stage.
3. **Loss of Parallel Visibility:** A video can be simultaneously `EDITED` (Entity State), have raw footage `AVAILABLE` (Media State), have a proxy generation job `RUNNING` (Job State), and be positioned at Stage `07 Final QC` (Workflow State). A single string cannot represent these simultaneous truths.

---

## 3. Business Workflow State Dimension

The Business Workflow State tracks the macro operational position of a `Content` item across the 15 canonical stages defined in Stage 07.

### 3.1 Sub-Properties of Business Workflow State
To avoid creating competing enums, the workflow state is composed of three distinct properties within `WorkflowInstance`:

1. `currentStage` (Integer `1` to `15`): The authoritative sequential stage number.
2. `stageStatus` (Enum): The micro-operational condition of work *within* that specific stage.
3. `workflowStatus` (Enum): The macro lifecycle condition of the overall `WorkflowInstance`.

```typescript
export type BusinessWorkflowStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export enum WorkflowStageStatus {
  NOT_STARTED       = 'NOT_STARTED',       // Assigned stage has not yet had work commenced
  IN_PROGRESS       = 'IN_PROGRESS',       // Active authoring, filming, or editing underway
  PENDING_REVIEW    = 'PENDING_REVIEW',    // Work submitted; awaiting authorized reviewer gate
  CHANGES_REQUESTED = 'CHANGES_REQUESTED', // Reviewer requested specific revisions
  BLOCKED           = 'BLOCKED',           // External dependency or hardware blocker halted progress
  COMPLETED         = 'COMPLETED',         // Prerequisite gates satisfied; ready for forward transition
}

export enum WorkflowInstanceStatus {
  ACTIVE     = 'ACTIVE',     // Workflow progressing normally through Stages 01–15
  SUSPENDED  = 'SUSPENDED',  // Administratively paused by Lead Producer / Admin
  COMPLETED  = 'COMPLETED',  // Terminal state: Step 15 approved; cycle archived
  TERMINATED = 'TERMINATED', // Terminal state: Question permanently rejected in Step 02
}
```

---

## 4. Entity Lifecycle State Dimension

Entity states describe the operational maturity of individual domain objects. Each domain entity possesses its own discrete lifecycle enum.

### 4.1 Question & QuestionVersion State (Substage 08.1)
Stage 06 established that `Question` is a container, `QuestionVersion` is an immutable snapshot, and `QuestionReview` is a recorded decision.

```typescript
// Question Aggregate Container State
export enum QuestionLifecycleState {
  DRAFT            = 'DRAFT',            // Container initialized; authoring underway
  UNDER_REVIEW     = 'UNDER_REVIEW',     // Active version submitted for pedagogical audit
  VERIFIED         = 'VERIFIED',         // Passed 10-point audit; eligible for scripting
  REVISION_PENDING = 'REVISION_PENDING', // Reviewer requested changes; draft unlocked
  REJECTED         = 'REJECTED',         // Formally rejected by SME (terminal for this question)
  ARCHIVED         = 'ARCHIVED',         // Retained for historical syllabus reference
}

// QuestionVersion Snapshot State
export enum QuestionVersionState {
  DRAFT_MUTABLE    = 'DRAFT_MUTABLE',    // Working version; author can modify fields
  SUBMITTED_LOCKED = 'SUBMITTED_LOCKED', // Frozen for review; edits blocked
  APPROVED_LOCKED  = 'APPROVED_LOCKED',  // Formally approved; permanently immutable
  SUPERSEDED       = 'SUPERSEDED',       // Replaced by a subsequent approved version
  ARCHIVED         = 'ARCHIVED',         // Historical record preserved in storage
}

// QuestionReview Gate Decision
export enum QuestionReviewDecision {
  APPROVED          = 'APPROVED',          // 10-point audit certified; advances to Step 03
  CHANGES_REQUESTED = 'CHANGES_REQUESTED', // Feedback provided; routes back to Step 01
  REJECTED          = 'REJECTED',          // Fatal pedagogical flaw; terminates workflow
}
```

### 4.2 Content State (Aggregate Root) (Substage 08.2)
`Content` represents the enduring identity of the short-form educational asset. Its state indicates macro business maturity, independent of the 15 workflow steps.

```typescript
export enum ContentLifecycleState {
  INITIATED   = 'INITIATED',   // Shell created; curriculum taxonomy assigned
  DEVELOPMENT = 'DEVELOPMENT', // Active in pre-production or production (Steps 01–07)
  PACKAGING   = 'PACKAGING',   // Visual assets and social copy being assembled (Steps 08–10)
  PUBLISHED   = 'PUBLISHED',   // Live on external platforms; undergoing sync (Steps 11–12)
  EVALUATED   = 'EVALUATED',   // Telemetry analyzed; intelligence extracted (Steps 13–15)
  ARCHIVED    = 'ARCHIVED',    // Completed production cycle preserved in cold storage
  CANCELLED   = 'CANCELLED',   // Halted before publication; preserved for audit
}
```

### 4.3 Video, VideoTake, & VideoEdit State (Substage 08.3)
Deconstructs the legacy 13-state `VideoProductionStatus` into discrete entity lifecycles:

```typescript
// Video Aggregate Child State
export enum VideoLifecycleState {
  UNSCHEDULED = 'UNSCHEDULED', // Script ready; filming session not yet booked
  RECORDING   = 'RECORDING',   // Studio session active; logging takes
  RECORDED    = 'RECORDED',    // Raw footage selected and ingested
  EDITING     = 'EDITING',     // Video editor assembling master cut
  QC_REVIEW   = 'QC_REVIEW',   // Master cut undergoing 6-point QC audit
  READY       = 'READY',       // Master cut certified passed; ready for packaging
  ARCHIVED    = 'ARCHIVED',    // Master video preserved in cold storage
}

// VideoTake State (Logged Studio Takes)
export enum VideoTakeState {
  RECORDING = 'RECORDING', // Take currently being captured
  USABLE    = 'USABLE',    // Technically sound take
  GOLDEN    = 'GOLDEN',    // Preferred take selected for editor cut
  OUTTAKE   = 'OUTTAKE',   // Presenter stumble or technical defect; preserved
  DISCARDED = 'DISCARDED', // Defective take excluded from editing bay
}

// VideoEdit State (Rendered Cuts)
export enum VideoEditState {
  DRAFT_CUT       = 'DRAFT_CUT',       // Editor working cut
  RENDERED_MASTER = 'RENDERED_MASTER', // 1080x1920 cut exported and uploaded to Drive
  QC_SUBMITTED    = 'QC_SUBMITTED',    // Dispatched to QC reviewer
  QC_APPROVED     = 'QC_APPROVED',     // Certified 6-point QC passed
  QC_REJECTED     = 'QC_REJECTED',     // Defective; returned with timecoded remarks
  SUPERSEDED      = 'SUPERSEDED',      // Replaced by subsequent render cut
}
```

### 4.4 Script & ScriptVersion State
```typescript
export enum ScriptLifecycleState {
  DRAFT        = 'DRAFT',        // Spoken dialogue being authored
  PACING_CHECK = 'PACING_CHECK', // Automated / manual 45–58s speech rate estimation
  READY        = 'READY',        // Script locked for teleprompter delivery
  REVISED      = 'REVISED',      // Unlocked for studio presenter adjustments
  SUPERSEDED   = 'SUPERSEDED',   // Replaced by newer revision
}
```

### 4.5 Thumbnail State
```typescript
export enum ThumbnailLifecycleState {
  DRAFT       = 'DRAFT',       // Graphic designer drafting candidate layouts
  CANDIDATE   = 'CANDIDATE',   // Uploaded to Drive; undergoing mobile CTR simulation
  APPROVED    = 'APPROVED',    // Certified for publication packaging
  SUPERSEDED  = 'SUPERSEDED',  // Replaced by higher-CTR candidate
  ARCHIVED    = 'ARCHIVED',    // Preserved in archive
}
```

---

## 5. Media Processing State Dimension (Substage 08.4)

Media binaries are strictly externalized to Google Drive / Cloud Storage. The Media State reflects the system's authoritative knowledge of external assets.

### 5.1 MediaAsset vs. MediaReference States
```typescript
// MediaAsset Processing State (Physical Binary Lifecycle)
export enum MediaAssetProcessingState {
  REGISTERED          = 'REGISTERED',          // External file URI / Drive ID recorded
  INGESTING           = 'INGESTING',           // Stream upload to Drive currently in progress
  AVAILABLE           = 'AVAILABLE',           // Binary accessible, streamable, and size-checked
  VALIDATING          = 'VALIDATING',          // Computing SHA-256 and media container specs
  VALID               = 'VALID',               // Format (mp4, mov, png) and resolution confirmed
  INVALID             = 'INVALID',             // Corrupted container, audio missing, or wrong spec
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE', // External Drive permission revoked or offline
  DEPRECATED          = 'DEPRECATED',          // Replaced by re-render; scheduled for cleanup
  PURGED              = 'PURGED',              // Physical file removed from external storage
}

// MediaReference Resolution State (Pointer Health)
export enum MediaReferenceResolutionState {
  UNRESOLVED          = 'UNRESOLVED',          // Reference URI not yet verified
  RESOLVED_ACCESSIBLE = 'RESOLVED_ACCESSIBLE', // HTTP HEAD / Drive API confirms read access
  PERMISSION_DENIED   = 'PERMISSION_DENIED',   // Service account lacks read/write scope
  NOT_FOUND           = 'NOT_FOUND',           // External File ID does not exist (HTTP 404)
  STALE               = 'STALE',               // Cached reference exceeds TTL; re-verify required
}
```

### 5.2 Failure Isolation Principle
A media asset in state `STORAGE_UNAVAILABLE` or `INVALID` halts the dependent stage (e.g., Step 05 or 06 `stageStatus = BLOCKED`), but does **not** fail the `WorkflowInstance` or invalidate upstream verified question data.

---

## 6. Archive State Dimension (Substage 08.5)

Archiving governs long-term preservation and cold storage tiering.

```typescript
export enum ArchiveLifecycleState {
  NOT_ARCHIVED      = 'NOT_ARCHIVED',      // Asset active in production / hot storage
  ARCHIVE_REQUESTED = 'ARCHIVE_REQUESTED', // Queued for cold-storage tier migration
  ARCHIVING         = 'ARCHIVING',         // Streaming raw footage and master cut to GCS Coldline
  ARCHIVED          = 'ARCHIVED',          // Checksum verified in cold storage; hot copy pruned
  RESTORE_REQUESTED = 'RESTORE_REQUESTED', // User initiated retrieval from cold storage
  RESTORED          = 'RESTORED',          // Temporary warm copy available for re-editing
  ARCHIVE_FAILED    = 'ARCHIVE_FAILED',    // Checksum mismatch or external bucket error
}
```

**Key Invariant:** Moving an asset to `ARCHIVED` does **not** rewrite, truncate, or overwrite historical `WorkflowTransition` records. Workflow history is immutable and perpetual.

---

## 7. Publishing & Publication State Dimension (Substage 08.6)

Distinguishes internal pre-publish packaging preparation from external live broadcast reality.

### 7.1 PublishingPackage State (Internal Assembly)
```typescript
export enum PublishingPackageState {
  DRAFT_CONFIG     = 'DRAFT_CONFIG',     // Platform selection and metadata drafting
  REVIEW_READY     = 'REVIEW_READY',     // Copy, tags, and pinned comment staged
  APPROVED         = 'APPROVED',         // Social Media Lead signed off in Step 09
  SCHEDULED        = 'SCHEDULED',        // Slot locked in release calendar (Step 10)
  DISPATCHING      = 'DISPATCHING',      // Publication worker actively calling platform APIs
  PARTIAL_DISPATCH = 'PARTIAL_DISPATCH', // Live on 1 of 3 platforms; others retrying
  COMPLETED        = 'COMPLETED',        // Successfully dispatched to all target channels
  CANCELLED        = 'CANCELLED',        // Release cancelled prior to execution
}
```

### 7.2 Publication State (External Platform Reality)
Represents the verified condition of the broadcast on external servers (YouTube, Instagram, Facebook):

```typescript
export enum ChannelPublicationState {
  STAGED           = 'STAGED',           // Destination configured; binary not yet uploaded
  UPLOADING        = 'UPLOADING',        // Streaming video binary to external platform API
  PROCESSING_REMOTE= 'PROCESSING_REMOTE',// Platform processing (YouTube 4K/Shorts transcoding)
  LIVE             = 'LIVE',             // Publicly streamable; regex-verified URL confirmed
  SYNC_VERIFIED    = 'SYNC_VERIFIED',    // Metadata, tags, and pinned comment confirmed active
  DISPATCH_FAILED  = 'DISPATCH_FAILED',  // External API rejected upload (quota, copyright, auth)
  REMOVED_EXTERNAL = 'REMOVED_EXTERNAL', // Video deleted or taken down directly on platform
}
```

---

## 8. Asynchronous Job State Dimension (Substage 08.7)

Tracks the operational status of non-blocking worker executions (Cloud Tasks / Node Event Loop):

```typescript
export enum JobExecutionState {
  QUEUED           = 'QUEUED',           // Task placed in queue; awaiting worker pickup
  RUNNING          = 'RUNNING',          // Worker currently executing task
  SUCCEEDED        = 'SUCCEEDED',        // Task completed successfully
  FAILED_RETRYABLE = 'FAILED_RETRYABLE', // Transient network/rate-limit error; backoff scheduled
  FAILED_FATAL     = 'FAILED_FATAL',     // Unrecoverable error (bad payload); moved to DLQ
  TIMED_OUT        = 'TIMED_OUT',        // Execution exceeded lease deadline
  CANCELLED        = 'CANCELLED',        // Administratively aborted
}
```

### 8.1 Job Types Inventory
1. `JOB_AI_GENERATE_QUESTION`: Advisory prompt execution via Gemini.
2. `JOB_MEDIA_DRIVE_UPLOAD`: Binary streaming to Google Drive.
3. `JOB_MEDIA_CHECKSUM`: SHA-256 calculation and container verification.
4. `JOB_PUBLISH_DISPATCH`: Upload to YouTube Shorts / Meta APIs.
5. `JOB_PLATFORM_SYNC`: Metadata reconciliation polling.
6. `JOB_ANALYTICS_INGEST`: Audience telemetry collection (24h/7d).
7. `JOB_ARCHIVE_TRANSFER`: Streaming master cut to GCS Coldline.

---

## 9. State Transition Rules & State Machine Tables (Substage 08.9)

### 9.1 Question State Transition Matrix
| Current State | Triggering Event | Next State | Authorized Actor | Precondition / Validation Gate |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `SUBMIT_FOR_REVIEW` | `UNDER_REVIEW` | Question Author | Schema valid, 4 options, proof complete |
| `UNDER_REVIEW`| `CERTIFY_APPROVE` | `VERIFIED` | QA Reviewer / SME | 10-point audit PASS, anti-self-approval (`GAR-02`) |
| `UNDER_REVIEW`| `REQUEST_CHANGES` | `REVISION_PENDING` | QA Reviewer / SME | Specific feedback remarks non-empty |
| `UNDER_REVIEW`| `PERMANENT_REJECT` | `REJECTED` | QA Reviewer / SME | Fatal pedagogical flaw documented |
| `REVISION_PENDING`| `RESUBMIT` | `UNDER_REVIEW` | Question Author | Revised draft submitted (creates Version v2) |
| `VERIFIED` | `SUPERSEDE` | `ARCHIVED` | Lead SME / Admin | Replaced by updated syllabus question |

### 9.2 Content (Aggregate Root) State Transition Matrix
| Current State | Triggering Event | Next State | Authorized Actor / System | Precondition / Validation Gate |
| :--- | :--- | :--- | :--- | :--- |
| `INITIATED` | `START_PRODUCTION` | `DEVELOPMENT` | System / Creator | Step 01 initiated |
| `DEVELOPMENT` | `QC_PASSED` | `PACKAGING` | Producer | Step 07 Final QC certified `PASS` |
| `PACKAGING` | `CONFIRM_LIVE` | `PUBLISHED` | Publisher / System | Step 11 confirmed on >= 1 live channel |
| `PUBLISHED` | `ANALYTICS_FINALIZED`| `EVALUATED` | Strategist | Step 14/15 diagnostic completed |
| `EVALUATED` | `ARCHIVE_CYCLE` | `ARCHIVED` | Executive Producer | Terminal transition; cold storage verified |
| Any Active | `ADMIN_CANCEL` | `CANCELLED` | Admin | Administrative termination with logged audit |

### 9.3 Video State Transition Matrix
| Current State | Triggering Event | Next State | Authorized Actor / System | Precondition / Validation Gate |
| :--- | :--- | :--- | :--- | :--- |
| `UNSCHEDULED` | `START_FILMING` | `RECORDING` | Presenter / Camera | Script locked (`SCRIPT_READY`) |
| `RECORDING` | `COMPLETE_SESSION` | `RECORDED` | Camera Operator | At least 1 `GOLDEN` take logged |
| `RECORDED` | `CLAIM_EDITING` | `EDITING` | Video Editor | Raw media uploaded and verified |
| `EDITING` | `SUBMIT_CUT` | `QC_REVIEW` | Video Editor | 1080x1920 master cut uploaded to Drive |
| `QC_REVIEW` | `APPROVE_QC` | `READY` | Producer / QC Lead | 6-point QC certified `PASS` (`GAR-02`) |
| `QC_REVIEW` | `REJECT_QC` | `EDITING` | Producer / QC Lead | Timecoded defect remarks provided |
| `READY` | `RETIRE_VIDEO` | `ARCHIVED` | Producer | Content cycle archived |

### 9.4 MediaAsset State Transition Matrix
| Current State | Triggering Event | Next State | Authorized Actor / System | Precondition / Validation Gate |
| :--- | :--- | :--- | :--- | :--- |
| `REGISTERED` | `START_STREAM` | `INGESTING` | Ingestion Daemon | External upload initiated |
| `INGESTING` | `UPLOAD_COMPLETE` | `AVAILABLE` | External Storage API | Byte stream fully received by Google Drive |
| `AVAILABLE` | `START_VERIFY` | `VALIDATING` | Worker Job | Integrity watchdog triggered |
| `VALIDATING` | `SPEC_CONFIRMED` | `VALID` | Worker Job | MIME type, duration, and SHA-256 match |
| `VALIDATING` | `CORRUPT_DETECTED` | `INVALID` | Worker Job | Missing audio stream or truncated container |
| `AVAILABLE` | `AUTH_REVOKED` | `STORAGE_UNAVAILABLE`| Storage Watchdog | Drive API returns 401/403/404 |

### 9.5 PublishingPackage & Publication State Transition Matrix
| Entity | Current State | Triggering Event | Next State | Authorized Actor | Precondition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Package** | `DRAFT_CONFIG` | `LOCK_PACKAGE` | `REVIEW_READY` | Social Media Lead | Video & thumbnail approved |
| **Package** | `REVIEW_READY` | `APPROVE_SOCIAL`| `APPROVED` | Social Media Lead | 9:16 safe-zone verified |
| **Package** | `APPROVED` | `ASSIGN_SLOT` | `SCHEDULED` | Publisher | Release calendar slot locked |
| **Package** | `SCHEDULED` | `DISPATCH` | `DISPATCHING` | Publishing Daemon | Scheduled timestamp reached |
| **Publication**| `STAGED` | `UPLOAD_START` | `UPLOADING` | Platform Adapter | Valid OAuth token |
| **Publication**| `UPLOADING` | `PLATFORM_ACK` | `PROCESSING_REMOTE`| YouTube/Meta API| Binary received by platform |
| **Publication**| `PROCESSING` | `LIVE_VERIFIED` | `LIVE` | Sync Worker | Regex URL verified |
| **Publication**| `LIVE` | `SYNC_CHECK` | `SYNC_VERIFIED` | Sync Worker | Pinned comment confirmed |
| **Publication**| `UPLOADING` | `API_ERROR` | `DISPATCH_FAILED` | Platform Adapter | Quota/auth failure |

### 9.6 Asynchronous Job State Transition Matrix
| Current State | Triggering Event | Next State | System Handler | Precondition / Semantic |
| :--- | :--- | :--- | :--- | :--- |
| `QUEUED` | `WORKER_PICKUP` | `RUNNING` | Task Dispatcher | Distributed lease acquired |
| `RUNNING` | `TASK_SUCCESS` | `SUCCEEDED` | Worker Runner | Zero errors returned; payload verified |
| `RUNNING` | `NETWORK_ERROR` | `FAILED_RETRYABLE` | Worker Runner | Retry count < MAX_RETRIES (exponential backoff) |
| `FAILED_RETRYABLE`| `BACKOFF_EXPIRE` | `QUEUED` | Scheduler | Next attempt timestamp reached |
| `RUNNING` | `PAYLOAD_CORRUPT` | `FAILED_FATAL` | Worker Runner | Bad schema / 400 Bad Request; moved to DLQ |
| `RUNNING` | `LEASE_EXPIRE` | `TIMED_OUT` | Watchdog | Execution time exceeded max lease |

### 9.7 Business Workflow State Transition Matrix
| Current Stage | Triggering Event | Next Stage | Authorized Actor | Prerequisite Gate (Stage 07) |
| :---: | :--- | :---: | :--- | :--- |
| **01** | `T01-02` | **02** | Question Author | Valid question schema & mathematical proof |
| **02** | `T02-03` | **03** | QA Reviewer / SME | 10-point audit certified `PASS` (`GAR-02`) |
| **02** | `REVISION_DISPATCH`| **01** | QA Reviewer / SME | Revision remarks non-empty |
| **03** | `T03-04` | **04** | Scriptwriter | Script locked (40–59s pacing confirmed) |
| **04** | `T04-05` | **05** | Presenter / Camera | Golden take logged; filming complete |
| **05** | `T05-06` | **06** | Camera Operator | Raw footage uploaded to Drive & validated |
| **06** | `T06-07` | **07** | Video Editor | 1080x1920 master cut uploaded to Drive |
| **07** | `T07-08` | **08** | Producer / QC Lead | 6-point Master QC certified `PASS` (`GAR-02`)|
| **07** | `REVISION_DISPATCH`| **06** | Producer / QC Lead | Timecoded defect remarks provided |
| **08** | `T08-09` | **09** | Graphic Designer | Primary thumbnail approved & mobile legible |
| **09** | `T09-10` | **10** | Social Media Lead | 9:16 simulator audit passed; copy certified |
| **10** | `T10-11` | **11** | Publisher / System | Pre-publish checklist 100%; slot assigned |
| **11** | `T11-12` | **12** | Publisher / System | Platform confirms video ID & regex URL |
| **12** | `T12-13` | **13** | Social Ops | Multi-platform metadata & comments synced |
| **13** | `T13-14` | **14** | Analytics Lead | 24-hour observation milestone persisted |
| **14** | `T14-15` | **15** | Strategy Lead | Diagnostic retention drop-off review finalized|
| **15** | `TERMINAL_COMPLETE`| **COMPLETED** | Executive Producer | Pedagogical directive human-approved |

---

## 10. State Ownership & Single Source of Truth

To prevent competing state authorities, each state dimension is assigned to exactly one authoritative bounded context:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              STATE OWNERSHIP MATRIX                                    │
 ├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
 │ State Dimension               │ Authoritative Bounded Context │ Backing Domain Service │
 ├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
 │ Business Workflow State       │ Workflow Orchestration Domain │ `WorkflowEngine`       │
 │ Question Entity State         │ Curriculum & Question Domain  │ `QuestionService`      │
 │ Content Aggregate State       │ Identity & Governance Domain  │ `ContentMasterService` │
 │ Video Entity State            │ Studio Production Domain      │ `VideoService`         │
 │ Media Asset & Reference State │ Media Metadata & Storage      │ `MediaAssetService`    │
 │ Publication State             │ Distribution & Sync Domain    │ `PublishingService`    │
 │ Asynchronous Job State        │ Infrastructure Execution Engine│ `JobRunnerService`     │
 │ Archive Lifecycle State       │ Media Metadata & Storage      │ `ArchiveService`       │
 └───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

**Rule:** External APIs, Google Sheets spreadsheets, and React client stores are **never** authoritative state owners. External systems report observations; BP-CMS services evaluate observations and commit authoritative state.

---

## 11. Authoritative State vs. Derived UI Status (Substage 08.10)

A critical source of brownfield confusion was treating computed UI labels as persisted database states.

### 11.1 Derived UI Status Rules
1. **Computed on the Fly:** User interface pills such as `"Ready for QC"`, `"Needs Attention"`, `"Pacing Overdue"`, or `"Safe-Zone Violation"` are **Derived Projections** calculated in the presentation layer from underlying authoritative fields.
2. **Never Stored in Database:** Derived statuses are never written to Google Sheets cells, Firestore documents, or SQL rows. Persisting derived statuses creates synchronization drift when underlying business rules evolve.
3. **Formal Separation Matrix:**

| Authoritative Persisted State | Auxiliary Domain Data | Computed / Derived UI Presentation |
| :--- | :--- | :--- |
| `currentStage = 06 (Editing Bay)` | `VideoEdit.isMasterCut = true` | **"Ready for QC"** (Blue badge) |
| `currentStage = 02 (Verification)` | `QuestionReview.decision = CHANGES_REQUESTED`| **"Action Required: Revisions"** (Yellow alert)|
| `currentStage = 07 (Final QC)` | `now() > assignment.dueDate` | **"Overdue in Review"** (Red pill) |
| `ChannelPublicationState = LIVE` | `AnalyticsSnapshot.milestone24h = null` | **"Awaiting 24h Telemetry"** (Purple pill) |
| `JobExecutionState = FAILED_RETRYABLE`| `retryCount = 2, maxRetries = 3` | **"Retrying in 2m"** (Orange spinner) |

---

## 12. Concurrency Governance & Collision Rules (Substage 08.10)

In a multi-user collaborative CMS operating over distributed cloud environments, concurrent operations must be strictly regulated.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              CONCURRENCY GOVERNANCE ARCHITECTURE                       │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ Concurrency Scenario    │ Prescribed Resolution Rule                                   │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 1. Concurrent Editing   │ Optimistic Concurrency Control (OCC) via `version` token.    │
 │                         │ First commit succeeds; second commit rejected with HTTP 409. │
 │ 2. Concurrent Review    │ Single-Winner Invariant: First certified review commits;     │
 │                         │ subsequent review attempt receives `ReviewAlreadyFinalized`. │
 │ 3. Concurrent Transition│ Distributed Atomic Lock: Only one `WorkflowTransition` can   │
 │                         │ commit for a given `(workflowId, currentStage)` pair.        │
 │ 4. Duplicate Retries    │ Idempotency Key matching: Duplicate client requests return   │
 │                         │ cached response without re-executing business side effects.  │
 │ 5. Stale UI Action      │ ETag / Version Precondition Check: If client state version   │
 │                         │ < server version, mutation is rejected (HTTP 412).           │
 │ 6. External State Race  │ Platform Sync Reconciliation: Authoritative CMS state pushes │
 │                         │ to platform; platform drift generates warning, not rollback. │
 └─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

### 12.1 Optimistic Concurrency Control (OCC) Contract
Every mutable domain entity must incorporate an `OptimisticLockEntity` contract:

```typescript
export interface OptimisticLockEntity {
  version: number;          // Monotonically increasing sequence integer (1, 2, 3...)
  updatedAt: string;        // ISO-8601 UTC timestamp of last successful mutation
  lastModifiedBy: string;   // User ID of the actor who performed the mutation
}
```

**OCC Invariant:** Every update mutation must supply `expectedVersion`. If `expectedVersion !== storedVersion`, the database adapter aborts the transaction with `OptimisticLockConflictError`. The client UI must prompt the user to refresh and review changes.

### 12.2 Transition Atomicity Invariant
A workflow stage advancement and its historical `WorkflowTransition` record must be committed as **one logically atomic business transaction**:
- Under no circumstances may `WorkflowInstance.currentStage` advance if writing the `WorkflowTransition` log fails.
- If transition history writing fails, the stage mutation rolls back completely, ensuring the audit trail is never decoupled from current state.

---

## 13. Failure Isolation Architecture

Failures in one technical or external dimension must be structurally isolated from corrupting business domain entities.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             FAILURE ISOLATION BOUNDARY                                 │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Subsystem Failure             │ Isolated Effect on System                              │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Background Job Times Out      │ `JobExecutionState = TIMED_OUT`. Workflow stage is     │
 │ (e.g., AI generation fails)   │ NOT failed. User is notified to retry prompt.          │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ External Storage Offline      │ `MediaAssetProcessingState = STORAGE_UNAVAILABLE`.     │
 │ (e.g., Google Drive API down) │ Workflow stage status set to `BLOCKED`. Video entity   │
 │                               │ metadata and upstream verified questions remain safe.  │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ External Upload Rejected      │ `ChannelPublicationState = DISPATCH_FAILED`. Stage 11  │
 │ (e.g., YouTube API quota hit) │ remains active. Publishing package remains valid;      │
 │                               │ job schedules retry. Upstream video is NOT deleted.    │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Analytics Ingestion Incomplete│ `AnalyticsSnapshot = null`. Stage 13 remains in        │
 │ (e.g., YouTube lag)           │ `IN_PROGRESS` awaiting data. Workflow is NOT halted.   │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 14. Brownfield State Mapping & Migration Strategy

The following table maps existing legacy state representations from the Stage 03 baseline to the target multi-dimensional state architecture:

| Legacy Concept | Source Code Location | Target State Dimension | Architectural Action | Detailed Refactoring Rationale |
| :--- | :--- | :--- | :---: | :--- |
| `QuestionStatus` | `src/types/index.ts` | Question Entity State | **SPLIT & RENAME** | Split: `QuestionLifecycleState` (`DRAFT`, `VERIFIED`, `REJECTED`) separated from `QuestionVersionState` and macro workflow stage. |
| `QuestionValidationStatus` | `src/types/index.ts` | Question Review Decision | **CONSOLIDATE** | Consolidate `NOT_VALIDATED`, `VALID`, `INVALID` into `QuestionReviewDecision` (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`). |
| `ContentMasterStatus` | `src/types/index.ts` | Content Aggregate State | **MIGRATE & CLEAN** | Remove workflow steps (`SCHEDULED`, `PUBLISHED`, `READY_FOR_REVIEW`) from ContentMaster. Restrict to `ContentLifecycleState`. |
| `VideoProductionStatus` (13 states)| `src/types/index.ts` | Video Entity State | **SPLIT & ISOLATE** | Decouple: `SCRIPT_READY` belongs to Script; `RECORDED` to Video; `READY_TO_UPLOAD` to QC; `UPLOADED` to Publication. |
| `CanonicalWorkflowState` (11 states)| `src/lib/services/workflow-orchestration.service.ts` | Business Workflow State | **RETIRE** | Entirely replace 11-state enum with canonical 15-stage `BusinessWorkflowStepNumber` (`1` through `15`). |
| `CanonicalWorkflowState` (7 states)| `src/lib/workflow/canonical-workflow.ts` | Stage Status | **RENAME** | Rename to `WorkflowStageStatus` (`IN_PROGRESS`, `PENDING_REVIEW`, `BLOCKED`, `COMPLETED`). |
| `SocialPublishStatus` | `src/types/index.ts` | Publication State | **SPLIT** | Split into internal `PublishingPackageState` (`SCHEDULED`) and external `ChannelPublicationState` (`LIVE`). |
| `SocialReviewStatus` | `src/types/index.ts` | Social Review Decision | **KEEP** | Retain as gate decision enum for Step 09 safe-zone certification. |
| `RenderValidationStatus` | `src/types/index.ts` | Video Edit QC Status | **CONSOLIDATE** | Unify under `VideoEditState.QC_APPROVED` / `QC_REJECTED`. |
| Direct DB Status Patching | `src/server/routes.ts` | Workflow Transition Engine | **RETIRE** | Deprecate direct status mutations; route all movements through `WorkflowEngine.transition()`. |

---

## 15. State Conflict Register (SCR)

The following active state conflicts in the brownfield codebase have been identified and formally resolved by this architecture:

| Conflict ID | Nature of Conflict | Brownfield Manifestation | Authoritative Target Resolution | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **SCR-001** | 11-State vs. 15-Step Workflow | `WorkflowOrchestrationService` uses 11 states; `canonical-workflow.ts` uses 15 steps. | Retires the 11-state enum. All orchestration must bind strictly to the 15 canonical steps. | **Stage 08 / Stage 14** |
| **SCR-002** | VideoProductionStatus Duplication | `VideoProductionStatus.RECORDING` duplicates Step 04 workflow stage. | Isolates `VideoLifecycleState` as internal entity state; Step 04 owns the macro business stage. | **Stage 08 / Stage 12** |
| **SCR-003** | Publication Ambiguity | `SocialPublishStatus.PUBLISHED` conflates package readiness with external YouTube stream status. | Splits into `PublishingPackageState` (internal) and `ChannelPublicationState` (external). | **Stage 08 / Stage 13** |
| **SCR-004** | Transient Job Overwriting Entity | Failed upload job previously marked parent video as `FAILED`. | Enforces Failure Isolation: `JobExecutionState.FAILED` isolates to worker queue without failing video. | **Stage 08 / Stage 17** |
| **SCR-005** | Question Status as Workflow Stage | `QuestionStatus.APPROVED` was used to indicate video readiness. | Question status restricted to `VERIFIED`; `WorkflowInstance` advances from Step 02 to Step 03. | **Stage 08 / Stage 14** |

---

## 16. Domain Invariants

The following 12 mandatory domain invariants govern all state transitions across BP-CMS:

1. **Orthogonal Dimensions Invariant:** Under no circumstances may a single persisted database column represent more than one state dimension.
2. **Canonical Workflow Singularity:** There is exactly one business workflow progression: the sequential 15-stage pipeline (`currentStage = 1` through `15`). No alternative workflow stage enum may exist.
3. **No Entity as Workflow:** No entity lifecycle status (`QuestionLifecycleState`, `VideoLifecycleState`) may represent or substitute for the canonical workflow stage.
4. **Media State Isolation:** Media processing conditions (`AVAILABLE`, `STORAGE_UNAVAILABLE`) cannot alter or reset business workflow stages.
5. **Technical Job Isolation:** Background job failures cannot corrupt or abort business entities or workflow instances.
6. **Publication Separation:** Publication packaging status (`PublishingPackageState`) is strictly decoupled from live external broadcast reality (`ChannelPublicationState`).
7. **Archive Immutability:** Migrating assets to cold storage (`ArchiveLifecycleState = ARCHIVED`) cannot rewrite or purge historical workflow transitions.
8. **Anti-Self-Approval Enforcement (`GAR-02`):** Review gate transitions (`QuestionReviewDecision`, `VideoEdit.qcStatus`, `SocialReview`) strictly reject attempts where `reviewerId === authorId`.
9. **Optimistic Locking Enforcement:** Updates to versioned entities must verify `expectedVersion === storedVersion`. Stale writes are rejected with HTTP 409.
10. **Atomic Stage Advancement:** Updating `WorkflowInstance.currentStage` and appending an immutable `WorkflowTransition` row must occur as a logically indivisible business operation.
11. **External State as Observation:** State reported by YouTube, Instagram, or Facebook is stored as external observations, never as local ownership of external servers.
12. **Frontend Subordination:** Client UI components and state stores are purely presentational; backend services are the sole authoritative arbiters of valid transitions.

---

## 17. State Observability Contract

To enable comprehensive forensic auditing and real-time operational observability, every authoritative state transition must emit an observable event containing the following standardized telemetry envelope:

```typescript
export interface StateTransitionObservabilityEvent {
  eventId: string;                   // Unique UUID for the transition event
  timestamp: string;                 // ISO-8601 UTC timestamp
  correlationId: string;             // Correlation key (Content ID: BP-CNT-######)
  stateDimension:                    // Target state dimension being mutated
    | 'BUSINESS_WORKFLOW'
    | 'QUESTION_ENTITY'
    | 'CONTENT_AGGREGATE'
    | 'VIDEO_ENTITY'
    | 'MEDIA_PROCESSING'
    | 'PUBLICATION_CHANNEL'
    | 'ASYNC_JOB'
    | 'ARCHIVE_LIFECYCLE';
  entityId: string;                  // Specific entity ID (e.g., BP-Q-######, BP-V-######)
  previousState: string;             // State value prior to transition
  nextState: string;                 // New committed state value
  actorId: string;                   // Authenticated user ID or 'SYSTEM_DAEMON'
  actorRole: string;                 // Role of the executing actor
  reason?: string;                   // Required for rejections, optional for advances
  optimisticVersion: number;         // Entity version after mutation
  executionDurationMs?: number;      // Milliseconds taken to execute transition
}
```

---

## 18. Conceptual State Machine Diagrams

### 18.1 Business Workflow State Diagram (Macro Stages 01–15)
```text
 [01 Question Gen] ───────────────► [02 Question Verify] ────────────► [03 Audience Script]
        ▲                                   │                                    │
        │ (Revision)                        │ (Revision)                         │ (Revision)
        └───────────────────────────────────┴────────────────────────────────────┘
                                            │
                                            ▼
 [06 Editing Bay] ◄─────────────── [05 Raw Video] ◄─────────────────── [04 Filming]
        │                                   │
        ▼ (Submit)                          │ (Re-shoot)
 [07 Final QC] ─────────────────────────────┘
        │
        ├─────────────────────────────┐ (Pass)
        ▼ (Reject)                    ▼
 [06 Editing Bay]             [08 Thumbnail] ───────────────► [09 Social Review]
                                      │                               │
                                      │ (Revision)                    │ (Revision)
                                      └───────────────────────────────┘
                                                                      │
                                                                      ▼
 [13 Analytics] ◄───────────────── [12 Platform Sync] ◄────────────── [10 Pub Setup]
        │                                                             │
        ▼                                                             ▼
 [14 Perf Review] ───────────────► [15 Intel Loop] ────────────► [11 Published]
                                         │
                                         ▼ (Feeds NEW Cycle)
                                 [01 Question Gen]
```

### 18.2 Question Entity & Review State Diagram
```text
  [DRAFT] ──(submit)──► [UNDER_REVIEW] ──(approve)──► [VERIFIED] ──(supersede)──► [ARCHIVED]
                              │
            ┌─────────────────┴─────────────────┐
            ▼ (changes requested)               ▼ (reject)
    [REVISION_PENDING]                      [REJECTED]
            │                               (Terminal)
            └──(resubmit v2)──► [UNDER_REVIEW]
```

### 18.3 Asynchronous Job State Diagram
```text
  [QUEUED] ──(pickup)──► [RUNNING] ──(success)──► [SUCCEEDED] (Terminal)
                            │
            ┌───────────────┴───────────────┐
            ▼ (transient error)             ▼ (fatal/schema error)
   [FAILED_RETRYABLE]                 [FAILED_FATAL] ──► [DLQ]
            │                               (Terminal)
            └──(backoff timeout)──► [QUEUED]
```

### 18.4 Publication State Diagram (Packaging vs. Channel)
```text
  PACKAGING (Internal):
  [DRAFT_CONFIG] ──► [REVIEW_READY] ──► [APPROVED] ──► [SCHEDULED] ──► [DISPATCHING] ──► [COMPLETED]

  CHANNEL (External):
  [STAGED] ──► [UPLOADING] ──► [PROCESSING_REMOTE] ──► [LIVE] ──► [SYNC_VERIFIED]
                     │
                     ▼ (API failure)
              [DISPATCH_FAILED] ──(retry)──► [UPLOADING]
```

### 18.5 Media & Archive Lifecycle State Diagram
```text
  MEDIA PROCESSING:
  [REGISTERED] ──► [INGESTING] ──► [AVAILABLE] ──► [VALIDATING] ──► [VALID]
                                         │                              │
                                         ▼ (Drive permission lost)      ▼ (re-render)
                              [STORAGE_UNAVAILABLE]                [DEPRECATED]

  ARCHIVE LIFECYCLE:
  [NOT_ARCHIVED] ──► [ARCHIVE_REQUESTED] ──► [ARCHIVING] ──► [ARCHIVED] (Coldline)
                                                                  │
                                                                  ▼ (restore)
                                                          [RESTORED] (Warm)
```

---

## 19. Traceability Matrix

### 19.1 Upstream Traceability (Stages 01–07 to Stage 08)
| Stage 08 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 2 (State Axiom)** | Stage 04 Principle 01 & Stage 03 Baseline | Eradicates universal `status` anti-pattern identified in Stage 03 audit. |
| **Section 3 (Workflow State)** | Stage 07 Canonical 15 Steps | Upholds the 15-stage sequence without adding alternative stage enums. |
| **Section 4.1 & 4.3 (Entity States)**| Stage 06 Domain Model (Sections 4 & 5) | Maps `Question`, `QuestionVersion`, `VideoEdit`, `Thumbnail` to explicit states. |
| **Section 5 (Media State)** | Stage 04 Principle 07 & Stage 05 Section 6 | Maintains binary media isolation in external storage states. |
| **Section 7 (Publication State)** | Stage 05 Section 5 & Stage 07 Step 11 | Decouples internal packaging from external YouTube/Meta broadcast status. |
| **Section 8 (Job State)** | Stage 04 Principle 11 & Stage 07 Step 11/13 | Defines asynchronous worker states preventing job failures from halting workflow. |
| **Section 12 (Concurrency)** | Stage 02 AC-14 & Stage 04 Principle 10 | Implements OCC versioning, atomic transitions, and idempotency guarantees. |

### 19.2 Downstream Traceability (Stage 08 to Future Stages)
| Downstream Stage | Consumed State Architecture Component | Implementation Expectation |
| :--- | :--- | :--- |
| **Stage 09 — RBAC Model** | State Machine Tables (Section 9) | Binds capability tokens to specific state transition triggers. |
| **Stage 12 — Data Architecture** | Multi-Dimensional Schemas (Sections 3–8)| Allocates dedicated database columns for each state dimension (zero overloading). |
| **Stage 13 — API Contract** | OCC & Transition Payloads (Sections 12 & 17)| Defines `expectedVersion` headers, ETag validation, and transition REST envelopes. |
| **Stage 14 — Workflow Engine** | Transition Matrices & Atomicity (Sections 9 & 12)| Implements authoritative `WorkflowEngine` transition handlers and rollback locks. |
| **Stage 17 — Job Architecture** | Job State & DLQ Governance (Section 8) | Implements Cloud Tasks push queue with exponential backoff handlers. |
| **Stage 28 — E2E Integration** | Concurrency & Collision Rules (Section 12)| Tests concurrent editing, double-approval rejection, and stale UI blocking. |

---

## 20. Explicit Database & Implementation Boundary Statement

> [!IMPORTANT]
> **Explicit Database & Implementation Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual, multi-dimensional **State Model and Concurrency Governance Contract** for BP-CMS.
> 
> It does **NOT** define or execute:
> - Physical database column definitions, SQL DDL migrations, or indexes.
> - Google Sheets tab configurations, column letter assignments, or cell formulas.
> - Firestore document collections or subcollection layouts.
> - Express server route handlers or Redux/Zustand client store code.
> - Background job worker processes or Redis queues.
> 
> Physical data storage is deferred strictly to **Stage 12 (Data Architecture)**; API schemas to **Stage 13 (API Contract)**; and workflow engine code to **Stage 14 (Workflow Engine Implementation)**.

---

## 21. Stage 08 Completion Checklist & Sign-off

- [x] Read all seven prior canonical artifacts (`01` through `07`).
- [x] Inspected existing state enums in codebase (`QuestionStatus`, `VideoProductionStatus`, `ContentMasterStatus`, `state-models.ts`, `job-architecture.ts`).
- [x] Enforced the Fundamental State Axiom: Decoupled Workflow, Entity, Media, Job, Publication, and Archive states.
- [x] Defined Business Workflow State (`currentStage`, `stageStatus`, `workflowStatus`).
- [x] Defined Question State (`QuestionLifecycleState`, `QuestionVersionState`, `QuestionReviewDecision`).
- [x] Defined Content Aggregate Root State (`ContentLifecycleState`).
- [x] Defined Video State (`VideoLifecycleState`, `VideoTakeState`, `VideoEditState`).
- [x] Defined Media State (`MediaAssetProcessingState`, `MediaReferenceResolutionState`).
- [x] Defined Archive State (`ArchiveLifecycleState`).
- [x] Defined Publishing & Publication States (`PublishingPackageState`, `ChannelPublicationState`).
- [x] Defined Asynchronous Job State (`JobExecutionState`) and job types inventory.
- [x] Formulated complete State Machine Transition Tables for all 7 state dimensions.
- [x] Established strict State Ownership Matrix assigning exactly one domain context per dimension.
- [x] Formalized separation between Authoritative Persisted State and Derived UI Status.
- [x] Codified Concurrency Rules: OCC versioning, single-winner review, atomic transitions, and idempotency.
- [x] Codified Failure Isolation Boundaries preventing technical glitches from failing business entities.
- [x] Documented comprehensive Brownfield State Mapping table.
- [x] Established State Conflict Register (`SCR-001` through `SCR-005`).
- [x] Established 12 mandatory Domain Invariants.
- [x] Formalized State Observability Event Envelope.
- [x] Generated conceptual State Machine Diagrams for all dimensions.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 08 — STATE MODEL
================================================================================
Artifact:            docs/architecture/08-STATE-MODEL.md
Version:             8.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 08 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 08. Awaiting Stage 09 Instruction.
================================================================================
```
