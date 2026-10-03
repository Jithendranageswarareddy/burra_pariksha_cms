# 13 — DATA MODEL & DATA CONTRACT
## Burra Pariksha Content Management System (BP-CMS)
### Stage 13 of 30-Stage Modernization Program — Authoritative Logical Data Model & Persistence Contract

```
================================================================================
Document ID:       BP-ARCH-13-DATA-CONTRACT
Version:           13.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE DATA CONTRACT
Scope:             Logical Data Model, Entity Contracts, Field Schemas & Source of Truth
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md
Downstream Stages: 14-WORKFLOW-ENGINE-IMPLEMENTATION.md
                   15-AUTH-IMPLEMENTATION.md
                   16-PERSISTENCE-IMPLEMENTATION.md
                   17-MEDIA-STORAGE.md
                   27-NOTIFICATIONS-AUDIT.md
                   28-E2E-INTEGRATION-TESTING.md
                   30-FINAL-SYSTEM-AUDIT.md
Authoritative Store: Cloud Firestore Native Mode (System of Record)
Secondary Store:    Google Sheets (Read-Only Operational Export & Human Audit Window)
Budget Constraint:  Hard Initial Infrastructure Ceiling: ₹0–₹100 (Zero-Cost Invariant)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative, strongly-typed **Data Model and Logical Data Contract** for the Burra Pariksha Content Management System (BP-CMS). Building directly upon the Stage 06 Domain Model, Stage 08 State Model, Stage 09 RBAC Capability Model, and Stage 12 Database Architecture Decision, this artifact specifies the exact logical schema, field definitions, types, constraints, identity formats, relationship cardinalities, indexing requirements, and source-of-truth ownership for every data element within the system.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *logical data model and contract*. It does **not** assert that physical Firestore collections have been provisioned, physical composite indexes created in Google Cloud Console, Google Sheets worksheets created, or database migrations executed.
2. **Zero Runtime Code Modification:** No application source code, Express route handlers, repository classes, or database drivers are modified or installed during Stage 13.
3. **No Premature Database SDK Installation:** No database packages (such as `@google-cloud/firestore`) are added to `package.json` in this stage. Package installation, repository instantiation, and physical schema provisioning belong strictly to **Stage 16 (Persistence Implementation)**.
4. **Contractual Boundary:** Stage 13 establishes the binding specification that Stage 16 will implement. Physical collections, indexing rules, emulator test suites, and data access objects must adhere strictly to the contracts defined herein.

---

## 2. Scope & Persistence Boundary

Stage 12 definitively established **Candidate D: Hybrid Architecture** as the persistence architecture for BP-CMS:
- **Authoritative System of Record:** **Cloud Firestore (Native Mode)** owns all transactional business state, entity aggregates, workflow states, and append-only audit ledgers. All write mutations execute exclusively against Firestore via server-side API handlers.
- **Secondary Operational Export Window:** **Google Sheets** serves as an asynchronous, read-only projection mirror for human operational transparency, batch reporting, and non-technical auditing. Google Sheets **never** owns authoritative state, never initiates write mutations to Firestore, and is not a dual-master database.
- **External Media Binary Isolation:** Binary assets (raw camera takes, presenter audio, thumbnail PSDs, final 4K/1080p MP4 master cuts) reside externally in Google Drive and Google Cloud Storage (GCS). Firestore stores strictly metadata, checksums, durations, and external file references.
- **Zero-Cost Budget Adherence:** The entire data model is structured to operate within Google Cloud's perpetual free tier (1 GiB storage, 50,000 document reads/day, 20,000 document writes/day), adhering strictly to the **₹0–₹100 initial infrastructure investment constraint**.

---

## 3. Authoritative Upstream Inputs

The logical data contract synthesizes requirements and rules from eleven preceding canonical artifacts:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                AUTHORITATIVE UPSTREAM INPUTS                           │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 01. Requirements        │ Core competitive exam requirements, bilingual questions,    │
│                         │ script cadence, multi-platform publishing (AP-001–AP-018).   │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 02. Acceptance Criteria │ Hard business verification criteria, pedagogical quality    │
│                         │ gates, anti-self-approval (GAR-02), and SLA metrics.         │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 06. Domain Model        │ 28 canonical domain entities, aggregates, lifecycles, and   │
│                         │ bounded contexts across Curriculum, Studio, and Governance.  │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 07. 15-Step Workflow    │ Sequential lifecycle stages (01 Question Ideation through    │
│                         │ 15 Social Performance Analytics).                            │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 08. State Model         │ 6 strictly decoupled state dimensions (Workflow, Entity,     │
│                         │ Media, Job, Publication, Archive) and OCC concurrency rules. │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 09. RBAC Capability     │ User -> Role -> Capability matrix, action-level checks,      │
│                         │ and server-authoritative permission enforcement.             │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 11. Page Route Contract │ Workspace query patterns, filter requirements, and           │
│                         │ operational view contracts across all 15 workflow stages.    │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 12. Database Arch       │ Cloud Firestore Native decision, subcollection boundaries,   │
│                         │ 6 atomic transaction boundaries, and OCC versioning model.   │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. Canonical Collection Inventory

The logical data contract defines **28 top-level and nested collections** corresponding 1:1 with the Stage 06 Domain Model:

| # | Collection Name | Logical Entity | Domain Bounded Context | Firestore Hierarchy | Document ID Format | Immutability |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `users` | User | Identity & Governance | Root Collection | `USR-######` | Mutable (OCC) |
| 2 | `roles` | Role | Identity & Governance | Root Collection | `ROLE_[A-Z0-9_]+` | Mutable (OCC) |
| 3 | `capabilities` | Capability | Identity & Governance | Root Collection | `[A-Z0-9_]+:[A-Z0-9_]+` | Immutable Constant |
| 4 | `questions` | Question | Curriculum & Question | Root Collection | `BP-Q-######` | Mutable (OCC) |
| 5 | `question_versions` | QuestionVersion | Curriculum & Question | Subcollection / Root Projection | `BP-QV-######-V##` | **Strictly Immutable** |
| 6 | `question_reviews` | QuestionReview | Curriculum & Question | Subcollection / Root Projection | `BP-QR-######-###` | **Strictly Immutable** |
| 7 | `content` | Content | Studio Production (Aggregate Root) | Root Collection | `BP-CNT-######` | Mutable (OCC) |
| 8 | `scripts` | Script | Studio Production | Root Collection | `BP-S-######` | Mutable (OCC) |
| 9 | `script_versions` | ScriptVersion | Studio Production | Subcollection / Root Projection | `BP-SV-######-V##` | **Strictly Immutable** |
| 10 | `videos` | Video | Studio Production | Root Collection | `BP-V-######` | Mutable (OCC) |
| 11 | `video_takes` | VideoTake | Studio Production | Subcollection / Root Projection | `BP-VT-######-T##` | Mutable (Status) |
| 12 | `video_edits` | VideoEdit | Studio Production | Subcollection / Root Projection | `BP-VE-######-C##` | Mutable (QC Status) |
| 13 | `media_assets` | MediaAsset | Media Metadata | Root Collection | `MED-######` | Mutable (OCC) |
| 14 | `media_references` | MediaReference | Media Metadata | Root Collection | `MREF-######` | Mutable (Sync) |
| 15 | `archive_references`| ArchiveReference| Media Metadata | Root Collection | `ARC-######` | Mutable (Tier) |
| 16 | `thumbnails` | Thumbnail | Packaging & Social | Root Collection | `BP-TH-######` | Mutable (OCC) |
| 17 | `social_reviews` | SocialReview | Packaging & Social | Root Collection | `SR-######` | Mutable (OCC) |
| 18 | `publishing_packages`| PublishingPackage| Distribution & Sync | Root Collection | `PKG-######` | Mutable (OCC) |
| 19 | `publications` | Publication | Distribution & Sync | Root Collection | `PUB-######` | Mutable (OCC) |
| 20 | `platforms` | Platform | Distribution & Sync | Root Collection | `PLT-[A-Z0-9_]+` | Mutable (OCC) |
| 21 | `analytics_snapshots`| AnalyticsSnapshot| Audience Analytics | Root Collection | `SNP-########-####` | **Strictly Immutable** |
| 22 | `performance_records`| PerformanceRecord| Audience Analytics | Root Collection | `PRF-######` | Mutable (OCC) |
| 23 | `intelligence_insights`| IntelligenceInsight| Pedagogical Intel | Root Collection | `INS-######` | Mutable (OCC) |
| 24 | `workflow_instances`| WorkflowInstance| Workflow Orchestration | Root Collection | `WF-######` | Mutable (OCC) |
| 25 | `workflow_transitions`| WorkflowTransition| Workflow Orchestration | Subcollection / Root Projection | `TRN-########-####` | **Strictly Immutable** |
| 26 | `notifications` | Notification | Identity & Governance | Root Collection | `NOTIF-######` | Mutable (Read Flag) |
| 27 | `audit_events` | AuditEvent | Identity & Governance | Root Collection | `AUD-########-####` | **Strictly Immutable** |
| 28 | `configurations` | Configuration | Identity & Governance | Root Collection | `CFG-[A-Z0-9_]+` | Mutable (OCC) |

---

## 5. Entity / Collection Contracts

Each canonical collection adheres to a rigorous architectural specification:

### 5.1 Identity & Governance Domain
- **`users`:** Represents internal team members, authentication identities, role associations, and operational status. Root collection. Document ID: `USR-######`. Owner: Identity Domain. Deletion Policy: Soft-delete (`isDeleted: true`); hard deletion prohibited to protect audit referential integrity.
- **`roles`:** Functional organizational roles (`ADMIN`, `CONTENT_LEAD`, `QUESTION_AUTHOR`, `FACULTY_REVIEWER`, `PRESENTER`, `VIDEO_EDITOR`, `PUBLISHER`, `ANALYST`). Root collection. Document ID: `ROLE_[A-Z0-9_]+`. Owner: Governance. System roles are immutable constants; custom roles are version-controlled.
- **`capabilities`:** Atomic, fine-grained permission tokens (`RESOURCE:ACTION`). Root collection. Document ID: `[A-Z0-9_]+:[A-Z0-9_]+`. Owner: Governance. Immutable system fixtures seeded during initialization.
- **`notifications`:** User-directed alerts for task assignments, review requests, and gate rejections. Root collection. Document ID: `NOTIF-######`. Owner: Operations. Lifecycle: `UNREAD` -> `READ` -> `DISMISSED`. Hard delete allowed after 90-day retention.
- **`audit_events`:** Append-only ledger of all security, authentication, and state mutations. Root collection. Document ID: `AUD-YYYYMMDD-####`. Owner: Governance. **Strictly Immutable.** Updates and deletes throw hard system exceptions.
- **`configurations`:** Centralized system parameters, feature flags, threshold definitions, and external API sync schedules. Root collection. Document ID: `CFG-[A-Z0-9_]+`. Owner: Governance. Mutable under strict `ADMIN` OCC.

### 5.2 Curriculum & Question Domain
- **`questions`:** Canonical academic problem aggregate containing Telugu/English stems, 4 options, bilingual explanations, curriculum tags, and pedagogical quality status. Root collection. Document ID: `BP-Q-######`. Owner: Curriculum Domain. Lifecycle: `DRAFT` -> `PENDING_REVIEW` -> `VERIFIED` -> `REVISION_REQUIRED` -> `REJECTED`. Soft-delete only.
- **`question_versions`:** Historical snapshots of question text and options captured upon major revisions. Subcollection at `/questions/{questionId}/versions/{versionId}` and projected to root for global querying. Document ID: `BP-QV-######-V##`. **Strictly Immutable.**
- **`question_reviews`:** Formal verification gate submissions, academic checks, and reviewer feedback. Subcollection at `/questions/{questionId}/reviews/{reviewId}`. Document ID: `BP-QR-######-###`. **Strictly Immutable.** Must record reviewer ID to enforce anti-self-approval (`GAR-02: authorId !== reviewerId`).

### 5.3 Studio Production Domain
- **`content`:** Central Aggregate Root connecting the 15-step workflow lifecycle. Links the underlying Question, Script, Video, Thumbnail, and Publishing Package. Root collection. Document ID: `BP-CNT-######`. Owner: Production Domain. Lifecycle: `INITIATED` -> `CURRICULUM_LOCKED` -> `PRODUCTION_IN_PROGRESS` -> `PACKAGING` -> `RELEASED` -> `ANALYZED` -> `ARCHIVED`. Soft-delete only.
- **`scripts`:** 5-part spoken video script (Hook, Context, Question & Options, Solution Breakdown, Call to Action) with cadence and teleprompter metrics. Root collection. Document ID: `BP-S-######`. Owner: Production Domain. Lifecycle: `DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `REVISION_REQUESTED`. Soft-delete only.
- **`script_versions`:** Immutable snapshots of teleprompter copy locked for studio filming. Subcollection at `/scripts/{scriptId}/versions/{versionId}`. Document ID: `BP-SV-######-V##`. **Strictly Immutable.**
- **`videos`:** Production orchestrator tracking camera filming, raw takes, and post-production editing cuts. Root collection. Document ID: `BP-V-######`. Owner: Production Domain. Lifecycle: `SCHEDULED` -> `RECORDING` -> `RECORDED` -> `EDITING` -> `QC_PENDING` -> `QC_PASSED` -> `QC_FAILED` -> `COMPLETED`. Soft-delete only.
- **`video_takes`:** Camera take metadata logged during studio recording. Subcollection at `/videos/{videoId}/takes/{takeId}`. Document ID: `BP-VT-######-T##`. Mutable take selection status (`CAPTURING` -> `UPLOADED` -> `ACCEPTED` / `REJECTED`).
- **`video_edits`:** Master editing cut records with audio loudness stamps (-14 LUFS) and safe-zone compliance stamps. Subcollection at `/videos/{videoId}/edits/{editId}`. Document ID: `BP-VE-######-C##`. Mutable QC status.

### 5.4 Media Metadata Domain
- **`media_assets`:** First-class metadata representation of externally stored binaries. Root collection. Document ID: `MED-######`. Owner: Media Storage Domain. Stores Google Drive File IDs, GCS URIs, SHA-256 checksums, MIME types, dimensions, and byte sizes. Binaries remain in Drive/GCS per AP-007.
- **`media_references`:** Pointer mappings connecting media assets to content entities. Root collection. Document ID: `MREF-######`. Soft-delete only.
- **`archive_references`:** Cold storage pointers to glacier/archive backups and raw camera footage tapes. Root collection. Document ID: `ARC-######`. Immutable reference.

### 5.5 Packaging, Distribution & Sync Domain
- **`thumbnails`:** Visual packaging package with A/B variant metadata and safe-zone validation. Root collection. Document ID: `BP-TH-######`. Owner: Packaging Domain. Lifecycle: `DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `REJECTED`. Soft-delete only.
- **`social_reviews`:** 9:16 vertical video safe-zone audit and pinned comment copy sign-off. Root collection. Document ID: `SR-######`. Owner: Packaging Domain. Lifecycle: `PENDING` -> `APPROVED` -> `REJECTED`. Soft-delete only.
- **`publishing_packages`:** Staged multi-platform broadcast package combining Master MP4, Thumbnails, Title, Description, Tags, and Pinned Comment. Root collection. Document ID: `PKG-######`. Owner: Distribution Domain. Lifecycle: `STAGED` -> `SCHEDULED` -> `DISPATCHED` -> `FAILED`. Soft-delete only.
- **`publications`:** Broadcast execution record per external network (YouTube Shorts, Instagram Reels, Facebook Reels) tracking live URLs and platform video IDs. Root collection. Document ID: `PUB-######`. Owner: Distribution Domain. Lifecycle: `PENDING` -> `PUBLISHED` -> `SYNCED` -> `FAILED` -> `REMOVED`. Soft-delete only.
- **`platforms`:** Supported distribution network descriptor and API configuration. Root collection. Document ID: `PLT-[A-Z0-9_]+` (e.g., `PLT-YOUTUBE`, `PLT-INSTAGRAM`). Owner: Distribution Domain. System fixture.

### 5.6 Audience Analytics & Intelligence Domain
- **`analytics_snapshots`:** Immutable time-series engagement milestone observations (T+24h, T+7d, T+30d) capturing views, watch time, retention curve, and drop-off rates. Root collection. Document ID: `SNP-YYYYMMDD-####`. Owner: Analytics Domain. **Strictly Immutable.**
- **`performance_records`:** Derived analytical diagnostics correlating viewer drop-off points with script segments. Root collection. Document ID: `PRF-######`. Owner: Analytics Domain. Mutable under OCC.
- **`intelligence_insights`:** Pedagogical directives derived from performance patterns used to seed new Question batches in Step 01. Root collection. Document ID: `INS-######`. Owner: Intelligence Domain. Lifecycle: `GENERATED` -> `VALIDATED` -> `ACTIONED` -> `DISCARDED`. Soft-delete only.

### 5.7 Workflow Orchestration Domain
- **`workflow_instances`:** Active operational state machine tracking the current 15-step workflow stage (`currentStage: 1..15`), stage status, assignee, and SLA timer for a `Content` entity. Root collection. Document ID: `WF-######`. Owner: Workflow Domain. Lifecycle: `ACTIVE` -> `BLOCKED` -> `COMPLETED` -> `ABORTED`. Mutable under strict OCC.
- **`workflow_transitions`:** Historical, append-only record of every workflow step transition, recording from-stage, to-stage, triggering actor, reason, and transition timestamp. Subcollection at `/workflow_instances/{workflowId}/transitions/{transitionId}`. Document ID: `TRN-YYYYMMDD-####`. **Strictly Immutable.**

---

## 6. Field-Level Data Contracts

### 6.1 Base Entity Contract (`BaseEntityContract`)
Every mutable business document in Firestore implements this standard contract:

```typescript
export interface BaseEntityContract {
  id: string;               // Canonical identifier matching CANONICAL_ID_PATTERNS
  createdAt: string;        // ISO 8601 UTC timestamp (server-generated)
  createdBy: string;        // Canonical User ID USR-xxxxxx
  updatedAt: string;        // ISO 8601 UTC timestamp (server-generated)
  updatedBy: string;        // Canonical User ID USR-xxxxxx
  version: number;          // Positive integer for OCC (concurrency token)
  isDeleted: boolean;       // Soft deletion flag
  deletedAt: string | null; // ISO 8601 UTC timestamp or null
  deletedBy: string | null; // Canonical User ID USR-xxxxxx or null
}
```

### 6.2 `users` Collection Schema
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Identity | Canonical user identifier | None | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `email` | string | Yes | None | Yes | Identity | Google Workspace corporate email | None | Google OAuth / Firestore | Yes | Valid email format, unique |
| `displayName` | string | Yes | None | No | Identity | Full display name in English / Telugu | None | Firestore | Yes | Min 2, max 100 chars |
| `roles` | array<string> | Yes | `[]` | No | Governance | Assigned organizational role IDs | `roles.id` | Firestore | Yes | Min 1 role required |
| `status` | string | Yes | `ACTIVE` | No | Governance | Account status (`ACTIVE`, `SUSPENDED`) | None | Firestore | Yes | Enum `ACTIVE`, `SUSPENDED` |
| `lastLoginAt` | string | No | null | No | Identity | ISO 8601 UTC timestamp of last login | None | System-generated | No | Nullable timestamp |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Identity | Creating user or `USR-000000` (system) | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Identity | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Identity | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Identity | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Identity | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.3 `questions` Collection Schema
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Curriculum | Canonical question identifier | None | Firestore | Yes | Regex `^BP-Q-[0-9]{6}$` |
| `subject` | string | Yes | None | No | Curriculum | Academic subject (e.g., `Polity`, `History`)| None | Firestore | Yes | Min 2 chars |
| `classLevel` | string | Yes | None | No | Curriculum | Target level (e.g., `APPSC_GROUP_2`, `UPSC`) | None | Firestore | Yes | Min 2 chars |
| `chapter` | string | Yes | None | No | Curriculum | Syllabus chapter title | None | Firestore | Yes | Min 2 chars |
| `topic` | string | Yes | None | No | Curriculum | Specific syllabus micro-topic | None | Firestore | Yes | Min 2 chars |
| `difficultyLevel` | string | Yes | `MEDIUM` | No | Curriculum | Question cognitive difficulty | None | Firestore | Yes | Enum `EASY`, `MEDIUM`, `HARD` |
| `questionTextTelugu` | string | Yes | None | No | Curriculum | Master pedagogical question stem in Telugu | None | Firestore (Author/Reviewer) | Yes | Telugu script, min 10 chars |
| `questionTextEnglish` | string | No | null | No | Curriculum | English translation of question stem | None | Firestore | Yes | Nullable |
| `options` | array<object> | Yes | None | No | Curriculum | 4 multiple choice options | None | Firestore (Author/Reviewer) | Yes | Exactly 4 items, exactly 1 correct |
| `explanationTelugu` | string | Yes | None | No | Curriculum | Comprehensive solution & source citation | None | Firestore | Yes | Telugu script, min 20 chars |
| `explanationEnglish`| string | No | null | No | Curriculum | English explanation text | None | Firestore | Yes | Nullable |
| `pedagogicalDefectCount` | number | Yes | 0 | No | Curriculum | Count of review defects flagged | None | Firestore | Yes | Integer >= 0 |
| `lifecycleState` | string | Yes | `DRAFT` | No | Curriculum | Question domain state (Stage 08.1) | None | Firestore | Yes | Enum `DRAFT`, `PENDING_REVIEW`, `VERIFIED`, `REVISION_REQUIRED`, `REJECTED`, `RETIRED` |
| `authorUserId` | string | Yes | None | Yes | Curriculum | User who drafted the question | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `reviewerUserId` | string | No | null | No | Curriculum | User who conducted verification gate | `users.id` | Firestore | Yes | Must NOT equal `authorUserId` (GAR-02) |
| `currentVersionNumber` | number | Yes | 1 | No | Curriculum | Current business content version | None | Firestore | Yes | Integer >= 1 |
| `aiDraftPayload` | object | No | null | Yes | Curriculum | Raw Gemini assistive suggestion payload | None | Assistive AI (Gemini) | Yes | Untrusted until approved |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Curriculum | Creating author | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Curriculum | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Curriculum | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Curriculum | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Curriculum | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.4 `question_reviews` Collection Schema (Verification Gate)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Curriculum | Review record identifier | None | Firestore | Yes | Regex `^BP-QR-[0-9]{6}-[0-9]{3}$` |
| `questionId` | string | Yes | None | Yes | Curriculum | Associated question identifier | `questions.id`| Firestore | Yes | Regex `^BP-Q-[0-9]{6}$` |
| `versionNumber` | number | Yes | None | Yes | Curriculum | Question business version reviewed | `question_versions.versionNumber` | Firestore | Yes | Integer >= 1 |
| `reviewerUserId` | string | Yes | None | Yes | Curriculum | Verifying faculty member account | `users.id` | Firestore | Yes | **Enforces GAR-02: Must != question.authorUserId** |
| `decision` | string | Yes | None | Yes | Curriculum | Review outcome | None | Firestore (Reviewer) | Yes | Enum `VERIFIED`, `REVISION_REQUIRED`, `REJECTED` |
| `accuracyConfirmed` | boolean | Yes | false | Yes | Curriculum | Academic correctness verified | None | Firestore (Reviewer) | Yes | Boolean |
| `syllabusAligned` | boolean | Yes | false | Yes | Curriculum | Exam syllabus alignment verified | None | Firestore (Reviewer) | Yes | Boolean |
| `teluguGrammarCorrect` | boolean | Yes | false | Yes | Curriculum | Telugu language proof verified | None | Firestore (Reviewer) | Yes | Boolean |
| `feedbackNotes` | string | No | null | Yes | Curriculum | Specific reviewer defect notes | None | Firestore (Reviewer) | Yes | Nullable, max 2000 chars |
| `reviewedAt` | string | Yes | Server | Yes | System | Timestamp review was completed | None | System-generated | Yes | ISO 8601 UTC |

### 6.5 `content` Collection Schema (Central Aggregate Root)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Production | Canonical content identifier | None | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `title` | string | Yes | None | No | Production | Operational content title | None | Firestore | Yes | Min 5, max 200 chars |
| `questionId` | string | Yes | None | Yes | Curriculum | Underlying question aggregate | `questions.id` | Firestore | Yes | Regex `^BP-Q-[0-9]{6}$`, unique |
| `subject` | string | Yes | None | Yes | Curriculum | Inherited academic subject | `questions.subject` | Firestore | No | Matches question |
| `classLevel` | string | Yes | None | Yes | Curriculum | Inherited target class level | `questions.classLevel` | Firestore | No | Matches question |
| `lifecycleState` | string | Yes | `INITIATED` | No | Production | Content domain state (Stage 08.2) | None | Firestore | Yes | Enum `INITIATED`, `CURRICULUM_LOCKED`, `PRODUCTION_IN_PROGRESS`, `PACKAGING`, `RELEASED`, `ANALYZED`, `ARCHIVED` |
| `currentWorkflowStep` | number | Yes | 1 | No | Workflow | 15-step workflow macro position | `workflow_instances.currentStep` | Firestore | Yes | Integer 1..15 |
| `workflowInstanceId` | string | Yes | None | Yes | Workflow | Associated state machine instance | `workflow_instances.id` | Firestore | Yes | Regex `^WF-[0-9]{6}$` |
| `activeScriptId` | string | No | null | No | Production | Linked active script aggregate | `scripts.id` | Firestore | Yes | Nullable, regex `^BP-S-[0-9]{6}$` |
| `activeVideoId` | string | No | null | No | Production | Linked active video project | `videos.id` | Firestore | Yes | Nullable, regex `^BP-V-[0-9]{6}$` |
| `activeThumbnailId` | string | No | null | No | Packaging | Linked active thumbnail package | `thumbnails.id` | Firestore | Yes | Nullable, regex `^BP-TH-[0-9]{6}$` |
| `activePublishingPackageId`| string | No | null | No | Distribution | Linked active publishing package | `publishing_packages.id` | Firestore | Yes | Nullable, regex `^PKG-[0-9]{6}$` |
| `assignedOperatorIds` | array<string> | Yes | `[]` | No | Production | Team members currently assigned | `users.id` | Firestore | Yes | Array of `USR-######` |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Production | Initiating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Production | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Production | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Production | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Production | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.6 `scripts` Collection Schema
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Production | Canonical script identifier | None | Firestore | Yes | Regex `^BP-S-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content aggregate | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `authorId` | string | Yes | None | Yes | Production | Scriptwriter account | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `hookCopyTelugu` | string | Yes | None | No | Production | 0-3 second hook copy in Telugu | None | Firestore | Yes | Min 5 chars |
| `teleprompterCopy` | string | Yes | None | No | Production | Complete spoken script text in Telugu | None | Firestore | Yes | Min 50 chars |
| `callToActionTelugu` | string | Yes | None | No | Production | Final CTA copy in Telugu | None | Firestore | Yes | Min 5 chars |
| `estimatedReadTimeSeconds`| number | Yes | None | No | Production | Estimated presenter spoken duration | None | Firestore | Yes | Integer between 30 and 180 |
| `cadenceWordsPerMinute` | number | Yes | 130 | No | Production | Spoken delivery cadence target | None | Firestore | Yes | Integer between 100 and 160 |
| `lifecycleState` | string | Yes | `DRAFT` | No | Production | Script lifecycle status | None | Firestore | Yes | Enum `DRAFT`, `IN_REVIEW`, `APPROVED`, `REVISION_REQUESTED` |
| `currentVersionNumber` | number | Yes | 1 | No | Production | Business content version | None | Firestore | Yes | Integer >= 1 |
| `aiSuggestedCopy` | object | No | null | Yes | Production | Gemini assistive script proposal | None | Assistive AI (Gemini) | Yes | Untrusted until approved |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Production | Script author | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Production | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Production | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Production | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Production | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.7 `videos` Collection Schema
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Production | Canonical video project identifier | None | Firestore | Yes | Regex `^BP-V-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content aggregate | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `scriptId` | string | Yes | None | Yes | Production | Spoken teleprompter script | `scripts.id` | Firestore | Yes | Regex `^BP-S-[0-9]{6}$` |
| `assignedPresenterId` | string | Yes | None | No | Production | Studio presenter team member | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `assignedEditorId` | string | Yes | None | No | Production | Assigned post-production video editor | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `projectState` | string | Yes | `SCHEDULED` | No | Production | Video project state (Stage 08.3) | None | Firestore | Yes | Enum `SCHEDULED`, `RECORDING`, `RECORDED`, `EDITING`, `QC_PENDING`, `QC_PASSED`, `QC_FAILED`, `COMPLETED` |
| `rawTakeCount` | number | Yes | 0 | No | Production | Number of camera takes logged | None | Firestore | Yes | Integer >= 0 |
| `selectedTakeId` | string | No | null | No | Production | Take selected for editing | `video_takes.id` | Firestore | Yes | Nullable take ID |
| `activeEditId` | string | No | null | No | Production | Active master cut edit version | `video_edits.id` | Firestore | Yes | Nullable edit ID |
| `masterCutMediaAssetId`| string | No | null | No | Media | Master MP4 metadata record | `media_assets.id` | Firestore | Yes | Nullable media asset ID |
| `durationSeconds` | number | No | null | No | Production | Final master video duration | None | Media Metadata | Yes | Duration between 15 and 90s |
| `audioLoudnessLufs` | number | No | null | No | Production | Verified integrated audio loudness | None | Media Metadata | Yes | Target -14.0 LUFS (+/- 1.0) |
| `safeZoneCompliant` | boolean | Yes | false | No | Production | 9:16 safe-zone overlay verified | None | Firestore (QC Editor) | Yes | Boolean |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Production | Initiating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Production | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Production | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Production | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Production | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.8 `media_assets` Collection Schema (External Binary Metadata)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Media | Canonical media asset identifier | None | Firestore | Yes | Regex `^MED-[0-9]{6}$` |
| `storageProvider` | string | Yes | `GOOGLE_DRIVE`| Yes | Media | Cloud binary storage location | None | Firestore | Yes | Enum `GOOGLE_DRIVE`, `GCS_COLD` |
| `externalFileId` | string | Yes | None | Yes | Media | Google Drive File ID or GCS Object Key| None | External Platform (Drive/GCS) | Yes | Non-empty string, unique |
| `originalFileName` | string | Yes | None | Yes | Media | Uploaded file name | None | User / Studio Client | Yes | Non-empty string |
| `mimeType` | string | Yes | None | Yes | Media | Verified binary MIME type | None | Media Inspector | Yes | e.g. `video/mp4`, `image/png` |
| `byteSize` | number | Yes | None | Yes | Media | File size in bytes | None | External File Metadata | Yes | Integer > 0 |
| `sha256Checksum` | string | Yes | None | Yes | Media | Hex-encoded cryptographic SHA-256 | None | Media Inspector | Yes | 64-char hex string |
| `durationSeconds` | number | No | null | Yes | Media | Media duration for audio/video | None | Media Inspector | Yes | Nullable, positive number |
| `resolutionWidth` | number | No | null | Yes | Media | Pixel width (e.g., 1080) | None | Media Inspector | Yes | Nullable integer |
| `resolutionHeight` | number | No | null | Yes | Media | Pixel height (e.g., 1920) | None | Media Inspector | Yes | Nullable integer |
| `webContentLink` | string | No | null | No | Media | Direct streaming/download link | None | Google Drive API | No | Nullable URL |
| `processingState` | string | Yes | `READY` | No | Media | Ingestion condition (Stage 08.4) | None | Firestore | Yes | Enum `PENDING_UPLOAD`, `UPLOADING`, `READY`, `FAILED`, `ARCHIVED` |
| `createdAt` | string | Yes | Server | Yes | System | Creation ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `createdBy` | string | Yes | None | Yes | Media | Uploading user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `updatedAt` | string | Yes | Server | No | System | Update ISO 8601 UTC timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `updatedBy` | string | Yes | None | No | Media | Mutating user | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |
| `isDeleted` | boolean | Yes | false | No | Media | Soft deletion flag | None | Firestore | Yes | Boolean |
| `deletedAt` | string | No | null | No | Media | Deletion timestamp | None | System-generated | Yes | Nullable timestamp |
| `deletedBy` | string | No | null | No | Media | Deleting user | `users.id` | Firestore | Yes | Nullable user ID |

### 6.9 `publishing_packages` & `publications` Collection Schemas
#### `publishing_packages`
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Distribution | Canonical package identifier | None | Firestore | Yes | Regex `^PKG-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content aggregate | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `masterVideoAssetId`| string | Yes | None | Yes | Media | Final master MP4 media record | `media_assets.id` | Firestore | Yes | Regex `^MED-[0-9]{6}$` |
| `thumbnailAssetId` | string | Yes | None | Yes | Media | Cover thumbnail media record | `media_assets.id` | Firestore | Yes | Regex `^MED-[0-9]{6}$` |
| `broadcastTitle` | string | Yes | None | No | Distribution | Final SEO title for platforms | None | Firestore (Lead/Publisher) | Yes | Min 10, max 100 chars |
| `description` | string | Yes | None | No | Distribution | Platform description & hashtags | None | Firestore | Yes | Min 20, max 5000 chars |
| `tags` | array<string> | Yes | `[]` | No | Distribution | Search index tags | None | Firestore | Yes | Max 30 tags |
| `pinnedCommentTelugu`| string | Yes | None | No | Distribution | Pedagogical pinned comment copy | None | Firestore | Yes | Min 10 chars |
| `scheduledBroadcastAt`| string| No | null | No | Distribution | Scheduled publication release time | None | Firestore | Yes | Nullable ISO 8601 UTC |
| `packageState` | string | Yes | `STAGED` | No | Distribution | Release condition (Stage 08.5) | None | Firestore | Yes | Enum `STAGED`, `SCHEDULED`, `DISPATCHED`, `COMPLETED`, `FAILED` |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |

#### `publications`
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Distribution | Publication record identifier | None | Firestore | Yes | Regex `^PUB-[0-9]{6}$` |
| `publishingPackageId`| string| Yes | None | Yes | Distribution | Originating release package | `publishing_packages.id`| Firestore | Yes | Regex `^PKG-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content aggregate | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `platformId` | string | Yes | None | Yes | Distribution | Target network descriptor | `platforms.id` | Firestore | Yes | Enum `PLT-YOUTUBE`, `PLT-INSTAGRAM`, `PLT-FACEBOOK` |
| `externalVideoId` | string | No | null | No | Distribution | YouTube Video ID / Post ID | None | External Platform API | Yes | Sourced from platform |
| `liveUrl` | string | No | null | No | Distribution | Public web URL of published media | None | External Platform API | Yes | Valid HTTP(S) URL |
| `publicationState` | string | Yes | `PENDING` | No | Distribution | Platform broadcast condition | None | External Sync / Firestore | Yes | Enum `PENDING`, `DISPATCHED`, `CONFIRMED_LIVE`, `SYNCED`, `FAILED`, `TAKEDOWN` |
| `publishedAt` | string | No | null | No | Distribution | Timestamp video went live | None | External Platform API | Yes | Nullable ISO 8601 UTC |
| `lastSyncedAt` | string | No | null | No | Distribution | Last telemetry sync timestamp | None | System-generated | No | Nullable ISO 8601 UTC |
| `syncError` | string | No | null | No | Distribution | Error message if broadcast failed | None | External Platform API | Yes | Nullable error string |

### 6.10 `workflow_instances` & `workflow_transitions` Collection Schemas
#### `workflow_instances`
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Workflow | Canonical workflow instance ID | None | Firestore | Yes | Regex `^WF-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content item | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$`, unique |
| `currentStep` | number | Yes | 1 | No | Workflow | Authoritative 15-step stage number | None | Firestore | Yes | **Integer 1 to 15 (AP-010)** |
| `stageStatus` | string | Yes | `IN_PROGRESS`| No | Workflow | Condition within the current stage | None | Firestore | Yes | Enum `PENDING_ENTRY`, `IN_PROGRESS`, `AWAITING_REVIEW`, `REVISION_REQUIRED`, `STAGE_COMPLETED` |
| `workflowStatus` | string | Yes | `ACTIVE` | No | Workflow | Macro lifecycle condition | None | Firestore | Yes | Enum `ACTIVE`, `BLOCKED`, `COMPLETED`, `ABORTED` |
| `activeAssigneeId` | string | Yes | None | No | Workflow | User accountable for current stage | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `stepEntryTimestamp`| string| Yes | Server | No | System | Time current step was entered | None | System-generated | Yes | ISO 8601 UTC |
| `slaDeadline` | string | No | null | No | Workflow | SLA completion deadline | None | Firestore | No | Nullable ISO 8601 UTC |
| `totalTransitionsCount`| number| Yes| 0 | No | Workflow | Running count of completed steps | None | Firestore | Yes | Integer >= 0 |
| `lastTransitionId` | string | No | null | No | Workflow | Pointer to latest transition record | `workflow_transitions.id` | Firestore | Yes | Nullable transition ID |
| `version` | number | Yes | 1 | No | System | OCC concurrency token | None | Firestore | Yes | Integer >= 1 |

#### `workflow_transitions` (Strictly Immutable Ledger)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Workflow | Transition event identifier | None | Firestore | Yes | Regex `^TRN-[0-9]{8}-[0-9]{4}$` |
| `workflowInstanceId`| string| Yes | None | Yes | Workflow | Associated workflow instance | `workflow_instances.id`| Firestore | Yes | Regex `^WF-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content item | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `fromStep` | number | Yes | None | Yes | Workflow | Originating workflow stage | None | Firestore | Yes | Integer 1..15 |
| `toStep` | number | Yes | None | Yes | Workflow | Destination workflow stage | None | Firestore | Yes | Integer 1..15 |
| `action` | string | Yes | None | Yes | Workflow | Executed action verb | None | Firestore | Yes | e.g. `ADVANCE_STAGE`, `REQUEST_REWORK` |
| `triggerActorId` | string | Yes | None | Yes | Workflow | Team member initiating transition | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `reason` | string | No | null | Yes | Workflow | Human explanation for move/rejection| None | Firestore (Actor) | Yes | Nullable string, max 1000 chars |
| `transitionedAt` | string | Yes | Server | Yes | System | Timestamp transition committed | None | System-generated | Yes | ISO 8601 UTC |
| `idempotencyKey` | string | Yes | None | Yes | Workflow | Client transaction dedup key | None | Client / Middleware | Yes | UUID v4 |

### 6.11 `analytics_snapshots` & `performance_records` Schemas
#### `analytics_snapshots` (Strictly Immutable Milestone Telemetry)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Analytics | Snapshot record identifier | None | Firestore | Yes | Regex `^SNP-[0-9]{8}-[0-9]{4}$` |
| `publicationId` | string | Yes | None | Yes | Distribution | Originating broadcast publication | `publications.id` | Firestore | Yes | Regex `^PUB-[0-9]{6}$` |
| `contentId` | string | Yes | None | Yes | Production | Associated content aggregate | `content.id` | Firestore | Yes | Regex `^BP-CNT-[0-9]{6}$` |
| `platformId` | string | Yes | None | Yes | Distribution | External platform | `platforms.id` | Firestore | Yes | Enum `PLT-YOUTUBE`, etc. |
| `milestoneWindow` | string | Yes | None | Yes | Analytics | Observation window | None | Firestore | Yes | Enum `T_24H`, `T_7D`, `T_30D`, `ADHOC` |
| `viewCount` | number | Yes | 0 | Yes | Analytics | Total verified views | None | External Platform API | No | Integer >= 0 |
| `watchTimeSeconds` | number | Yes | 0 | Yes | Analytics | Total accumulated watch time | None | External Platform API | No | Number >= 0 |
| `averageViewDuration`| number | Yes | 0 | Yes | Analytics | Average watch duration in seconds | None | External Platform API | No | Number >= 0 |
| `averagePercentageViewed`| number| Yes| 0 | Yes | Analytics | Retention % across total video length| None | External Platform API | No | Float between 0 and 100 |
| `threeSecondDropOffRate`| number| Yes| 0 | Yes | Analytics | % of viewers leaving before 3s | None | External Platform API | No | Float between 0 and 100 |
| `retentionCurve` | array<number>| Yes| `[]` | Yes | Analytics | Second-by-second retention curve | None | External Platform API | No | Array of floats 0..100 |
| `likesCount` | number | Yes | 0 | Yes | Analytics | Platform like count | None | External Platform API | No | Integer >= 0 |
| `commentsCount` | number | Yes | 0 | Yes | Analytics | Platform comment count | None | External Platform API | No | Integer >= 0 |
| `sharesCount` | number | Yes | 0 | Yes | Analytics | Platform share count | None | External Platform API | No | Integer >= 0 |
| `snapshotTimestamp` | string | Yes | Server | Yes | System | Time telemetry was captured | None | System-generated | Yes | ISO 8601 UTC |

### 6.12 `audit_events` Collection Schema (Forensic Ledger)
| Field | Type | Required | Default | Immutable | Owner | Description | References | Source of Truth | Audit | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | string | Yes | None | Yes | Governance | Forensic ledger identifier | None | Firestore | Yes | Regex `^AUD-[0-9]{8}-[0-9]{4}$` |
| `timestamp` | string | Yes | Server | Yes | System | Event generation timestamp | None | System-generated | Yes | ISO 8601 UTC |
| `actorId` | string | Yes | None | Yes | Governance | Authenticated user executing action | `users.id` | Firestore | Yes | Regex `^USR-[0-9]{6}$` |
| `actorRole` | string | Yes | None | Yes | Governance | Active role assumed by actor | `roles.id` | Firestore | Yes | e.g. `ROLE_CONTENT_LEAD` |
| `resourceType` | string | Yes | None | Yes | Governance | Mutated collection/resource name | None | System-generated | Yes | Enum matching collection names |
| `resourceId` | string | Yes | None | Yes | Governance | Identifier of mutated document | None | Firestore | Yes | Non-empty string |
| `action` | string | Yes | None | Yes | Governance | Executed mutation verb | None | System-generated | Yes | e.g. `CREATE`, `UPDATE`, `VERIFY`, `TRANSITION` |
| `preconditionState` | object | No | null | Yes | Governance | Document state before mutation | None | Firestore | Yes | Nullable JSON map |
| `postconditionState`| object | No | null | Yes | Governance | Document state after mutation | None | Firestore | Yes | Nullable JSON map |
| `ipAddress` | string | No | null | Yes | System | Client IP address | None | Express Request | Yes | Nullable IP string |
| `userAgent` | string | No | null | Yes | System | Client browser/device string | None | Express Request | Yes | Nullable user-agent string |
| `correlationId` | string | Yes | None | Yes | System | Distributed trace / request UUID | None | Express Middleware | Yes | UUID v4 |

---

## 7. Identity & ID Contract

### 7.1 Separation of Identity Spaces
BP-CMS enforces absolute separation across three distinct identifier spaces:
1. **Internal Canonical BP-CMS ID:** Deterministic, human-readable primary keys managed exclusively by the backend application (`BP-Q-000142`, `BP-CNT-000089`).
2. **External Media Storage ID:** Provider-specific file identifiers (`1BxiMVs0XRA5nFMdKvBHK...` in Google Drive, `gs://bp-cms-archive/takes/...` in GCS).
3. **External Platform Broadcast ID:** Social network video keys (`dQw4w9WgXcQ` on YouTube, `C2y56_...` on Instagram).

### 7.2 Canonical ID Generation & Concurrency Authority
- **Generation Authority:** Canonical sequence numbers are generated **server-side** by a dedicated Firestore-backed counter document (`/configurations/CFG_COUNTERS`) using atomic transactions (`runTransaction`).
- **No Client Generation:** Clients never generate business entity primary keys.
- **No Timestamp Keys for Core Entities:** Sequential IDs avoid the timestamp-based sequence drift identified in the brownfield audit. Only append-only time-series logs (`AuditEvent`, `AnalyticsSnapshot`, `WorkflowTransition`) incorporate UTC date prefixes (`YYYYMMDD`) to enable natural date-partitioned range queries.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CANONICAL ID REGEX SPECIFICATIONS                         │
├──────────────────────────┬────────────────────────────┬────────────────────────────────┤
│ Entity                   │ ID Format                  │ Validation Regular Expression  │
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│ User                     │ USR-######                 │ ^USR-[0-9]{6}$                 │
│ Role                     │ ROLE_[A-Z0-9_]+            │ ^ROLE_[A-Z0-9_]+$              │
│ Capability               │ [RESOURCE]:[ACTION]        │ ^[A-Z0-9_]+:[A-Z0-9_]+$        │
│ Question                 │ BP-Q-######                │ ^BP-Q-[0-9]{6}$                │
│ QuestionVersion          │ BP-QV-######-V##           │ ^BP-QV-[0-9]{6}-V[0-9]{2}$     │
│ QuestionReview           │ BP-QR-######-###           │ ^BP-QR-[0-9]{6}-[0-9]{3}$      │
│ Content (Root)           │ BP-CNT-######              │ ^BP-CNT-[0-9]{6}$              │
│ Script                   │ BP-S-######                │ ^BP-S-[0-9]{6}$                │
│ ScriptVersion            │ BP-SV-######-V##           │ ^BP-SV-[0-9]{6}-V[0-9]{2}$     │
│ Video                    │ BP-V-######                │ ^BP-V-[0-9]{6}$                │
│ VideoTake                │ BP-VT-######-T##           │ ^BP-VT-[0-9]{6}-T[0-9]{2}$     │
│ VideoEdit                │ BP-VE-######-C##           │ ^BP-VE-[0-9]{6}-C[0-9]{2}$     │
│ MediaAsset               │ MED-######                 │ ^MED-[0-9]{6}$                 │
│ MediaReference           │ MREF-######                │ ^MREF-[0-9]{6}$                │
│ ArchiveReference         │ ARC-######                 │ ^ARC-[0-9]{6}$                 │
│ Thumbnail                │ BP-TH-######               │ ^BP-TH-[0-9]{6}$               │
│ SocialReview             │ SR-######                  │ ^SR-[0-9]{6}$                  │
│ PublishingPackage        │ PKG-######                 │ ^PKG-[0-9]{6}$                 │
│ Publication              │ PUB-######                 │ ^PUB-[0-9]{6}$                 │
│ Platform                 │ PLT-[A-Z0-9_]+             │ ^PLT-[A-Z0-9_]+$               │
│ AnalyticsSnapshot        │ SNP-YYYYMMDD-####          │ ^SNP-[0-9]{8}-[0-9]{4}$        │
│ PerformanceRecord        │ PRF-######                 │ ^PRF-[0-9]{6}$                 │
│ IntelligenceInsight      │ INS-######                 │ ^INS-[0-9]{6}$                 │
│ WorkflowInstance         │ WF-######                  │ ^WF-[0-9]{6}$                  │
│ WorkflowTransition       │ TRN-YYYYMMDD-####          │ ^TRN-[0-9]{8}-[0-9]{4}$        │
│ Notification             │ NOTIF-######               │ ^NOTIF-[0-9]{6}$               │
│ AuditEvent               │ AUD-YYYYMMDD-####          │ ^AUD-[0-9]{8}-[0-9]{4}$        │
│ Configuration            │ CFG-[A-Z0-9_]+             │ ^CFG-[A-Z0-9_]+$               │
└──────────────────────────┴────────────────────────────┴────────────────────────────────┘
```

---

## 8. Relationship & Reference Model

Relationships in Firestore are maintained via explicit string foreign keys adhering to canonical ID patterns:

```text
  ┌────────────────┐ 1      1 ┌──────────────────┐ 1      1 ┌────────────────┐
  │    Question    │◄─────────┤     Content      ├─────────►│WorkflowInstance│
  └───────┬────────┘          │ (Aggregate Root) │          └───────┬────────┘
          │ 1                 └─────────┬────────┘                  │ 1
          ▼ *                           │                           ▼ *
  ┌────────────────┐                    │ 1                 ┌────────────────┐
  │QuestionReview  │                    ▼ *                 │WorkflowTrans.. │
  └────────────────┘          ┌──────────────────┐          └────────────────┘
                              │      Script      │
                              └─────────┬────────┘
                                        │ 1
                                        ▼ *
                              ┌──────────────────┐
                              │      Video       │
                              └─────────┬────────┘
                                        │ 1
                                        ▼ *
                              ┌──────────────────┐
                              │PublishingPackage │
                              └─────────┬────────┘
                                        │ 1
                                        ▼ *
                              ┌──────────────────┐
                              │   Publication    │
                              └─────────┬────────┘
                                        │ 1
                                        ▼ *
                              ┌──────────────────┐
                              │AnalyticsSnapshot │
                              └──────────────────┘
```

### 8.1 Detailed Relationship Specifications
| Source Entity | Target Entity | Cardinality | Reference Field | Ownership | Lifecycle Dependency | Deletion Cascade Behavior | Dangling Allowed? |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `Content` | `Question` | 1 : 1 | `content.questionId` | Content | Question must exist before Content initiated | Question soft-delete blocks Content advancement | **NO** |
| `Content` | `WorkflowInstance`| 1 : 1 | `content.workflowInstanceId`| Workflow | Created atomically with Content | Workflow marked `ABORTED` on Content soft-delete | **NO** |
| `Question` | `QuestionReview` | 1 : N | `question_reviews.questionId`| Curriculum | Reviews reference parent Question | Question deletion preserves review history | **NO** |
| `Question` | `QuestionVersion`| 1 : N | `question_versions.questionId`| Curriculum | Versions reference parent Question | Question deletion preserves version history | **NO** |
| `Content` | `Script` | 1 : 1 | `content.activeScriptId` | Production | Script created in Step 03 | Nullable until Step 03 reached | YES (Steps 1-2) |
| `Content` | `Video` | 1 : 1 | `content.activeVideoId` | Production | Video created in Step 04 | Nullable until Step 04 reached | YES (Steps 1-3) |
| `Video` | `VideoTake` | 1 : N | `video_takes.videoId` | Production | Takes logged during Step 05 | Video soft-delete retains takes | **NO** |
| `Video` | `VideoEdit` | 1 : N | `video_edits.videoId` | Production | Edits submitted in Step 06 | Video soft-delete retains edits | **NO** |
| `VideoEdit` | `MediaAsset` | 1 : 1 | `video_edits.masterCutMediaAssetId`| Media | Master cut references media asset | Asset soft-delete flags Video QC invalid | **NO** |
| `Content` | `PublishingPackage`| 1 : 1 | `content.activePublishingPackageId`| Distribution| Package assembled in Step 10 | Nullable until Step 10 reached | YES (Steps 1-9) |
| `PublishingPackage`| `Publication`| 1 : N | `publications.publishingPackageId`| Distribution| Publications dispatched in Step 11 | Package deletion flags publications | **NO** |
| `Publication` | `AnalyticsSnapshot`| 1 : N| `analytics_snapshots.publicationId`| Analytics| Snapshots ingested at T+24h/7d/30d| Publication deletion retains analytics | **NO** |
| `WorkflowInstance`| `WorkflowTransition`| 1 : N| `workflow_transitions.workflowInstanceId`| Workflow| Transition logged on every step move| Transitions are append-only permanent ledger | **NO** |
| `User` | `Role` | N : M | `users.roles` (Array) | Identity | User must have at least 1 role | Role deletion prohibited if assigned | **NO** |

---

## 9. Multi-Dimensional State Model Integration

Stage 08 established the **Fundamental State Axiom**:
$$\text{Workflow Stage} \neq \text{Entity Lifecycle} \neq \text{Media State} \neq \text{Job State} \neq \text{Publication State} \neq \text{Archive State}$$

To eradicate brownfield status collisions, the logical data model codifies separate, orthogonal state fields across domain documents:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORTHOGONAL STATE FIELD GOVERNANCE                         │
├──────────────────────┬────────────────────────┬────────────────────────────────────────┤
│ State Dimension      │ Authoritative Document │ Distinct State Fields                  │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 1. Workflow Stage    │ `workflow_instances`   │ `currentStep: 1..15`                   │
│                      │                        │ `stageStatus: PENDING_ENTRY | ...`     │
│                      │                        │ `workflowStatus: ACTIVE | BLOCKED |...`│
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 2. Entity Lifecycle  │ `questions`            │ `lifecycleState: DRAFT | VERIFIED |...`│
│                      │ `content`              │ `lifecycleState: INITIATED | ...`      │
│                      │ `scripts`              │ `lifecycleState: DRAFT | APPROVED |...`│
│                      │ `videos`               │ `projectState: SCHEDULED | QC_PASSED`  │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 3. Media Processing  │ `media_assets`         │ `processingState: PENDING | READY |...`│
│                      │ `video_edits`          │ `loudnessCompliance: COMPLIANT | ...`  │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 4. Async Worker Job  │ `jobs` (Internal Task) │ `jobStatus: QUEUED | RUNNING | FAILED` │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 5. Publication State │ `publishing_packages`  │ `packageState: STAGED | DISPATCHED`    │
│                      │ `publications`         │ `publicationState: PENDING | LIVE |...`│
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 6. Archive Lifecycle │ `archive_references`   │ `archiveTier: HOT | NEARLINE | COLD`   │
└──────────────────────┴────────────────────────┴────────────────────────────────────────┘
```

A video being `EDITING` in `videos.projectState` does not alter `workflow_instances.currentStep = 6`, and an external YouTube upload failure sets `publications.publicationState = FAILED` without corrupting the approved master video record in `videos`.

---

## 10. Versioning Contract

BP-CMS strictly distinguishes **Technical Concurrency Versioning** from **Business Content Versioning**:

### 10.1 Technical Concurrency Versioning (OCC Token)
- **Field Name:** `version: number` (present on all mutable entities implementing `BaseEntityContract`).
- **Semantic Purpose:** Enforces Optimistic Concurrency Control (OCC). Detects stale writes when multiple studio operators view or mutate the same record simultaneously.
- **Increment Rule:** Incremented monotonically by `+1` on every successful document write.
- **Server Precondition:** Mutations must supply the expected `version`. If the database document has `version: 5` and the update request submits `version: 4`, the write is rejected with an HTTP 409 Conflict.

### 10.2 Business Content Versioning
- **Field Names:** `currentVersionNumber` on `Question` / `Script`, and `versionNumber` on `QuestionVersion` / `ScriptVersion`.
- **Semantic Purpose:** Represents discrete, human-approved pedagogical or presenter revisions.
- **Immutability Invariant:** Every increment of `currentVersionNumber` generates an append-only snapshot in `question_versions` or `script_versions`. Once inserted, these version documents can never be altered or deleted.

---

## 11. Timestamp Contract

All timestamps across BP-CMS adhere strictly to the following specification:
1. **Format:** ISO 8601 extended string format in UTC: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2026-10-04T01:45:00.000Z`).
2. **Authority:** Generated **server-side** at the moment of persistence commit via Firestore `FieldValue.serverTimestamp()` (resolved to ISO string). Client-supplied timestamps are untrusted and rejected.
3. **Immutability of `createdAt`:** `createdAt` is written once upon document creation and is strictly immutable.
4. **Authoritative `updatedAt`:** Every update mutation updates `updatedAt` to the current server timestamp.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CANONICAL TIMESTAMP FIELD MATRIX                          │
├──────────────────────┬────────────────────────────────┬────────────────────────────────┤
│ Category             │ Timestamp Field                │ Exact Semantic Meaning         │
├──────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Base Entity          │ `createdAt`                    │ Server commit time of record.  │
│ Base Entity          │ `updatedAt`                    │ Server commit time of revision.│
│ Base Entity          │ `deletedAt`                    │ Soft-delete tombstone time.    │
│ Workflow Engine      │ `stepEntryTimestamp`           │ Time Content entered step.     │
│ Workflow Engine      │ `transitionedAt`               │ Time step transition committed.│
│ Academic Gate        │ `reviewedAt`                   │ Time faculty signed off gate.  │
│ Studio Filming       │ `recordedAt`                   │ Time camera take completed.    │
│ Media Storage        │ `uploadedAt`                   │ Time binary confirmed in Drive.│
│ Distribution         │ `scheduledBroadcastAt`         │ Planned live broadcast time.   │
│ Distribution         │ `publishedAt`                  │ Time external post went live.  │
│ Distribution         │ `lastSyncedAt`                 │ Time social metrics fetched.   │
│ Analytics Ingestion  │ `snapshotTimestamp`            │ Observation capture time.      │
│ Audit Ledger         │ `timestamp`                    │ Forensic ledger entry time.    │
└──────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

---

## 12. Soft Deletion & Retention Policy

BP-CMS enforces strict entity disposal categories to protect referential integrity and legal auditability:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RETENTION & DELETION POLICY MATRIX                        │
├─────────────────────┬───────────────────┬──────────────────────────────────────────────┤
│ Disposal Category   │ Collections       │ Exact Rule & Behavior                        │
├─────────────────────┼───────────────────┼──────────────────────────────────────────────┤
│ NEVER DELETE        │ `audit_events`    │ Strictly immutable. Deletion and updates are │
│ (Append-Only)       │ `workflow_trans.` │ prohibited at the driver and application     │
│                     │ `question_vers.`  │ layers. Records are retained permanently.    │
│                     │ `script_vers.`    │                                              │
│                     │ `analytics_snaps.`│                                              │
├─────────────────────┼───────────────────┼──────────────────────────────────────────────┤
│ SOFT-DELETE ONLY    │ `users`           │ Documents are marked `isDeleted: true` with  │
│ (Tombstone Flag)    │ `questions`       │ `deletedAt` and `deletedBy`. Filtered out    │
│                     │ `content`         │ of normal queries (`where('isDeleted','==',  │
│                     │ `scripts`         │ false)`). Hard deletion is blocked.          │
│                     │ `videos`          │                                              │
│                     │ `media_assets`    │                                              │
│                     │ `publishing_pkgs` │                                              │
│                     │ `publications`    │                                              │
├─────────────────────┼───────────────────┼──────────────────────────────────────────────┤
│ HARD-DELETE ALLOWED │ `notifications`   │ Ephemeral operational alerts may be hard-    │
│ (Time-Bounded)      │                   │ deleted after 90 days of dismissal.          │
├─────────────────────┼───────────────────┼──────────────────────────────────────────────┤
│ ARCHIVE ONLY        │ `archive_refs`    │ Cold-storage pointers are permanently locked;│
│                     │                   │ purged only upon legal data retention expiry.│
└─────────────────────┴───────────────────┴──────────────────────────────────────────────┘
```

---

## 13. Audit Metadata Contract

BP-CMS segregates **Current State Audit Metadata** from the **Append-Only Forensic Ledger**:
- **Current State Metadata:** Carried directly on mutable business documents via `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `version`, `isDeleted`. This provides fast, O(1) inspection of who last touched a record without executing log queries.
- **Append-Only Forensic Ledger (`audit_events`):** Every significant state transition, approval gate, user role modification, and data deletion emits a cryptographically correlated `AuditEventDocument`. Even if a question is soft-deleted, its complete historical audit trail remains fully intact in `audit_events`.

---

## 14. System Constraints & Invariants

All persistence operations must enforce the following business invariants:
1. **GAR-02 Anti-Self-Approval Invariant:** In `question_reviews`, `reviewerUserId` must **never** equal `question.authorUserId`. Self-approval of academic questions is rejected at the API and validation layer.
2. **Pedagogical Integrity Invariant:** In `questions`, `options` must contain **exactly 4 items**, and **exactly 1 item** must have `isCorrect: true`.
3. **Bilingual Requirement:** Questions must have a valid `questionTextTelugu` stem of at least 10 characters and an `explanationTelugu` of at least 20 characters.
4. **Master MP4 Loudness Invariant:** In `videos`, moving from Stage 06 to Stage 07 requires `audioLoudnessLufs` to fall within $[-15.0, -13.0]$ LUFS.
5. **Safe-Zone Invariant:** Advancing past Stage 07 requires `safeZoneCompliant: true`.
6. **Unique Active Content Question:** Exactly one active `Content` item may reference a given `Question` ID (`BP-Q-######`).
7. **Single System of Record (AP-010):** Cloud Firestore Native Mode is the sole authoritative system of record.
8. **Media Externalization (AP-007):** Binary files are never stored in Firestore.

---

## 15. Logical Index Contract

To support the UI query patterns established in Stage 10 (Frontend IA) and Stage 11 (Page Route Contract) without full-table scans, the following **Logical Composite Indexes** are specified:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LOGICAL COMPOSITE INDEX SPECIFICATIONS                    │
├────┬───────────────────────┬──────────────────────────────────────────┬────────────────┤
│ ID │ Collection            │ Indexed Fields & Direction               │ Query Purpose  │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX01│ `questions`           │ `subject` ASC, `classLevel` ASC,         │ Curriculum     │
│    │                       │ `lifecycleState` ASC, `createdAt` DESC   │ Library Filter │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX02│ `questions`           │ `lifecycleState` ASC, `authorUserId` ASC,│ Faculty Review │
│    │                       │ `createdAt` DESC                         │ Queue          │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX03│ `content`             │ `currentWorkflowStep` ASC,               │ Ops Radar &    │
│    │                       │ `lifecycleState` ASC, `updatedAt` DESC   │ Bottleneck Nav │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX04│ `content`             │ `assignedOperatorIds` ARRAY_CONTAINS,    │ "My Work"      │
│    │                       │ `currentWorkflowStep` ASC                │ Personal Queue │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX05│ `videos`              │ `currentWorkflowStep` ASC,               │ Video Editing  │
│    │                       │ `assignedEditorId` ASC, `updatedAt` DESC │ Bay Queue      │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX06│ `videos`              │ `projectState` ASC,                      │ Studio Filming │
│    │                       │ `assignedPresenterId` ASC                │ Schedule       │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX07│ `publishing_packages` │ `packageState` ASC,                      │ Release Staging│
│    │                       │ `scheduledBroadcastAt` ASC               │ Dispatch Queue │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX08│ `publications`        │ `platformId` ASC,                        │ Social Monitor │
│    │                       │ `publicationState` ASC, `publishedAt`DESC│ & Verification │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX09│ `analytics_snapshots` │ `contentId` ASC,                         │ Retention Curve│
│    │                       │ `snapshotTimestamp` DESC                 │ Telemetry Graph│
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX10│ `workflow_transitions`│ `workflowInstanceId` ASC,                │ Step History   │
│    │                       │ `transitionedAt` ASC                     │ Audit Playback │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX11│ `audit_events`        │ `resourceType` ASC, `resourceId` ASC,    │ Resource Audit │
│    │                       │ `timestamp` DESC                         │ Timeline       │
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX12│ `audit_events`        │ `correlationId` ASC, `timestamp` ASC     │ Trace Audit Log│
├────┼───────────────────────┼──────────────────────────────────────────┼────────────────┤
│IX13│ `notifications`       │ `recipientUserId` ASC, `isRead` ASC,     │ User Alert Bell│
│    │                       │ `createdAt` DESC                         │ Indicator      │
└────┴───────────────────────┴──────────────────────────────────────────┴────────────────┘
```

---

## 16. Firestore Modeling Contract

### 16.1 Root Collections vs. Subcollections
To avoid exceeding Firestore's 1 MiB document size limit and eliminate document write contention, BP-CMS enforces strict containment rules:
1. **Unbounded Historical Logs Must Be Separate Documents:** Historical logs (`workflow_transitions`, `audit_events`, `analytics_snapshots`) must **never** be embedded as arrays inside parent documents. They reside in subcollections or top-level partitioned collections.
2. **Subcollection Path Hierarchy:**
   - `/questions/{questionId}/versions/{versionId}`
   - `/questions/{questionId}/reviews/{reviewId}`
   - `/scripts/{scriptId}/versions/{versionId}`
   - `/videos/{videoId}/takes/{takeId}`
   - `/videos/{videoId}/edits/{editId}`
   - `/workflow_instances/{workflowId}/transitions/{transitionId}`
3. **Top-Level Root Projections:** For collections that require cross-entity dashboard queries (such as querying all pending `question_reviews` across all questions for the Verification Hub), a root collection or Firestore Collection Group Query is utilized.

---

## 17. Analytics Data Contract

The Analytics data model cleanly separates raw platform observations from normalized metrics and AI-driven pedagogical insights:
1. **Raw Social Metrics (`AnalyticsSnapshot`):** Captured from YouTube Data API and Meta Graph API at fixed milestone intervals ($T+24\text{h}, T+7\text{d}, T+30\text{d}$). Represents external platform ground truth; immutable once written.
2. **Normalized Performance Records (`PerformanceRecord`):** Computes standardized engagement scoring (Engagement Rate, Audience Retention Index, Completion % against duration benchmark).
3. **Pedagogical Intelligence Insights (`IntelligenceInsight`):** Generated by analyzing audience drop-offs during explanation breakdown. Used by curriculum planners to seed new Question batches in Step 01. AI-suggested insights remain unverified until approved by a human curriculum lead.

---

## 18. Media Data Contract

In strict compliance with Stage 04 Principle AP-007 (*Binary Isolation*), binary files are completely externalized:
- **Google Drive Storage:** Stores raw video takes, working Premiere/FCP project files, thumbnail PSDs, and final rendered master MP4 cuts.
- **Google Cloud Storage (GCS Archive):** Stores cold archival backups of completed master cuts and raw camera footage.
- **Firestore Metadata Role (`MediaAsset`):** Stores pointers (`externalFileId`), cryptographic hashes (`sha256Checksum`), MIME types (`mimeType`), byte lengths (`byteSize`), and duration metrics. Application code verifies SHA-256 hashes to detect external file tampering.

---

## 19. External System Reference Contract

BP-CMS interfaces with external platforms exclusively through asynchronous adapters and reference pointers:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL INTEGRATION CONTRACT                             │
├─────────────────────┬───────────────────┬────────────────────┬─────────────────────────┤
│ External System     │ External ID Field │ Internal ID Field  │ Synchronization Policy  │
├─────────────────────┼───────────────────┼────────────────────┼─────────────────────────┤
│ Google Drive        │ `driveFileId`     │ `media_assets.id`  │ Unidirectional (Drive   │
│                     │                   │                    │ confirms upload to CMS) │
├─────────────────────┼───────────────────┼────────────────────┼─────────────────────────┤
│ YouTube Data API    │ `youtubeVideoId`  │ `publications.id`  │ Bidirectional (CMS posts│
│                     │                   │                    │ broadcast; pulls views) │
├─────────────────────┼───────────────────┼────────────────────┼─────────────────────────┤
│ Meta Graph API      │ `instagramMediaId`│ `publications.id`  │ Bidirectional (CMS posts│
│                     │                   │                    │ broadcast; pulls views) │
├─────────────────────┼───────────────────┼────────────────────┼─────────────────────────┤
│ Gemini Assistive AI │ `aiDraftPayload`  │ `questions.id`     │ CMS requests draft; AI  │
│                     │                   │ `scripts.id`       │ payload untrusted/gated │
└─────────────────────┴───────────────────┴────────────────────┴─────────────────────────┘
```

External platforms **never** overwrite internal business states. A change in a YouTube video title made directly in YouTube Studio is flagged as a synchronization discrepancy; it does not silently mutate the canonical CMS release title.

---

## 20. Google Sheets Export Contract

Stage 12 reclassified Google Sheets as a **Secondary Operational Export & Human Audit Window**:
1. **Unidirectional Synchronization:** Changes flow strictly from **Firestore $\rightarrow$ Google Sheets**. Writes never flow from Google Sheets to Firestore.
2. **Export Fields:** Only high-level operational summaries are exported (Content ID, Title, Subject, Current Step, Stage Status, Assignee, Live URLs, 24h Views).
3. **No Transactional Authority:** Edits made by humans directly in Google Sheets are ignored and overwritten on the next synchronization cycle.
4. **Quota Protection:** Synchronizations are batched and throttled to execute during off-peak windows, guaranteeing zero HTTP 429 quota exhaustion.

---

## 21. Data Ownership Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATA OWNERSHIP MATRIX                                  │
├──────────────────────┬──────────────────────┬──────────────────┬───────────────────────┤
│ Domain Entity        │ Owning Business Unit │ Primary Writer   │ Authoritative Store   │
├──────────────────────┼──────────────────────┼──────────────────┼───────────────────────┤
│ User & Role          │ Identity / HR        │ Administrator    │ Cloud Firestore       │
│ Question & Version   │ Curriculum Faculty   │ Question Author  │ Cloud Firestore       │
│ QuestionReview       │ Curriculum Review    │ Faculty Reviewer │ Cloud Firestore       │
│ Content (Root)       │ Studio Operations    │ Content Lead     │ Cloud Firestore       │
│ Script & Version     │ Studio Production    │ Scriptwriter     │ Cloud Firestore       │
│ Video, Take & Edit   │ Video Production     │ Video Editor     │ Cloud Firestore       │
│ MediaAsset (Meta)    │ Studio Tech / Drive  │ Storage Worker   │ Cloud Firestore       │
│ PublishingPackage    │ Marketing / Distro   │ Packaging Lead   │ Cloud Firestore       │
│ Publication          │ Distribution Team    │ Publisher Worker │ Cloud Firestore       │
│ AnalyticsSnapshot    │ Growth Analytics     │ Analytics Sync   │ Cloud Firestore       │
│ IntelligenceInsight  │ Academic Intel       │ Curriculum Lead  │ Cloud Firestore       │
│ WorkflowInstance     │ Orchestration Engine │ Workflow Service │ Cloud Firestore       │
│ WorkflowTransition   │ Orchestration Engine │ System / Actors  │ Cloud Firestore       │
│ AuditEvent           │ Governance & Security│ Express Engine   │ Cloud Firestore       │
└──────────────────────┴──────────────────────┴──────────────────┴───────────────────────┘
```

---

## 22. Source-of-Truth Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHORITATIVE SOURCE-OF-TRUTH MATRIX                      │
├──────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ Entity / Data Field  │ Primary Source of Truth       │ Notes / Invariants              │
├──────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ User Credentials     │ Google OAuth 2.0 / Workspace  │ Authenticated identity provider │
│ User Roles & Perms   │ Cloud Firestore (`users`)     │ Server-authoritative RBAC       │
│ Question Stems/Opts  │ Cloud Firestore (`questions`) │ Pedagogical content master      │
│ Question Verification│ Cloud Firestore (`reviews`)   │ Academic sign-off (GAR-02)      │
│ Spoken Script Text   │ Cloud Firestore (`scripts`)   │ Teleprompter master text        │
│ Video Master Cut Cut │ Google Drive (Binary)         │ Externalized binary storage     │
│ Video Cut Metadata   │ Cloud Firestore (`videos`)    │ Loudness & duration stamps      │
│ Workflow Stage (1..15│ Cloud Firestore (`workflows`) │ State machine master position   │
│ Step History Ledger  │ Cloud Firestore (`transitions`) Append-only immutable history   │
│ Live Public URL      │ External Platform (YouTube)   │ Public streaming broadcast link │
│ View & Watch Metrics │ External Platform API         │ Telemetry ground truth          │
│ Security Audit Log   │ Cloud Firestore (`audit`)     │ Tamper-evident operational log  │
│ System Configuration │ Cloud Firestore (`config`)    │ Application constants & flags   │
└──────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 23. Data Lifecycle Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATA LIFECYCLE MATRIX                                  │
├──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ Entity               │ Created     │ Active      │ Under Review│ Completed   │ Arch/Del│
├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│ `User`               │ PROVISIONED │ ACTIVE      │ N/A         │ N/A         │ SUSPEND │
│ `Question`           │ DRAFT       │ VERIFIED    │ PENDING_REV │ VERIFIED    │ RETIRED │
│ `Content`            │ INITIATED   │ IN_PROGRESS │ N/A         │ RELEASED    │ ARCHIVED│
│ `Script`             │ DRAFT       │ APPROVED    │ IN_REVIEW   │ APPROVED    │ ARCHIVED│
│ `Video`              │ SCHEDULED   │ RECORDING   │ QC_PENDING  │ COMPLETED   │ ARCHIVED│
│ `PublishingPackage`  │ STAGED      │ SCHEDULED   │ N/A         │ DISPATCHED  │ ARCHIVED│
│ `Publication`        │ PENDING     │ LIVE        │ N/A         │ SYNCED      │ TAKEDOWN│
│ `WorkflowInstance`   │ ACTIVE      │ ACTIVE      │ N/A         │ COMPLETED   │ ABORTED │
└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

---

## 24. Brownfield Mapping

To prepare for Stage 16 implementation, existing repository types and Google Sheets adapters are classified:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD REPOSITORY MAPPING                             │
├───────────────────────────────────┬──────────────┬─────────────────────────────────────┤
│ Existing Code / Schema            │ Disposition  │ Migration Strategy in Stage 16      │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `BaseRepository` (In-memory locks)│ DEPRECATE    │ Replace with Firestore transactions │
│                                   │              │ (`runTransaction`) and OCC tokens.  │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `google-sheets-schema.ts`         │ TRANSFORM    │ Re-target as secondary export schema│
│                                   │              │ instead of transactional storage.   │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `src/types/data-contracts.ts`     │ KEEP         │ Canonical TypeScript interfaces and │
│                                   │              │ Zod schemas for Firestore documents.│
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `src/types/domain-models.ts`      │ CONSOLIDATE  │ Align domain models 1:1 with Stage  │
│                                   │              │ 13 field schemas.                   │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `src/types/state-models.ts`       │ KEEP         │ Enforce 6 orthogonal dimensions.    │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ Single `status: string` columns   │ REMOVE       │ Eliminate universal status; replace │
│                                   │              │ with dimension-specific state enums.│
└───────────────────────────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 25. Data Model Conflict Register

| ID | Historical Problem | Evidence | Canonical Stage 13 Resolution | Resolution Stage |
| :-: | :--- | :--- | :--- | :---: |
| **DMCR-001** | Competing Question ID formats | Some legacy code used `Q-####` while domain used `BP-Q-######` | Enforce `^BP-Q-[0-9]{6}$` as the sole canonical format. | Stage 13 / 16 |
| **DMCR-002** | Universal `status` field collision | Brownfield records had single `status` property collapsing workflow and video status | Decouple into `currentWorkflowStep`, `projectState`, and `processingState`. | Stage 13 / 16 |
| **DMCR-003** | In-process concurrency locks | `BaseRepository.recordLocks` stored lock promises in Node process memory | Replace with Firestore Native OCC versioning (`version: number`). | Stage 13 / 16 |
| **DMCR-004** | Dual-master Google Sheets risk | Early drafts implied two-way editing between Sheets and database | Reclassify Google Sheets strictly as read-only operational export. | Stage 13 / 16 |
| **DMCR-005** | Question reviewer self-approval | Brownfield lacked automated check preventing question authors from approving own questions | Codify GAR-02 invariant in `question_reviews` schema (`authorId !== reviewerId`). | Stage 13 / 16 |
| **DMCR-006** | Media binary storage ambiguity | Unclear whether audio/video files could be saved as base64 or binary blobs | Codify AP-007: Media files remain in Google Drive/GCS; metadata only in Firestore. | Stage 13 / 17 |
| **DMCR-007** | Mutable transition history | Past workflow changes overwrote previous step records | Codify `workflow_transitions` as append-only strictly immutable ledger. | Stage 13 / 16 |
| **DMCR-008** | Unbounded arrays in Content document | Embedding all transitions inside `content` doc risked 1MB Firestore limit | Segregate transition logs into dedicated subcollection. | Stage 13 / 16 |

---

## 26. Traceability Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STAGE 13 TRACEABILITY MATRIX                              │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ Upstream Stage & Reference │ Stage 13 Contract Section   │ Downstream Implementation   │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Stage 01 (AP-007, AP-010)  │ Section 2 & 18 (Media/Store)│ Stage 16 (Persistence)      │
│ Stage 02 (GAR-02 Gate)     │ Section 6.4 & 14 (Reviews)  │ Stage 14 & 16 (Workflow)    │
│ Stage 06 (Domain Model)    │ Section 4 & 5 (Collections) │ Stage 16 (Repositories)     │
│ Stage 07 (15-Step Workflow)│ Section 6.10 (Workflow Doc) │ Stage 14 (Engine)           │
│ Stage 08 (State Axiom)     │ Section 9 (State Decoupling)│ Stage 14 & 16 (State Mach)  │
│ Stage 09 (RBAC Matrix)     │ Section 6.2 (Users/Roles)   │ Stage 15 (Auth Engine)      │
│ Stage 11 (Route Contract)  │ Section 15 (Composite Idx)  │ Stage 16 (GCP Indexes)      │
│ Stage 12 (Database Choice) │ Section 2 & 16 (Firestore)  │ Stage 16 (Firestore SDK)    │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 27. Stage 16 Implementation Contract

Stage 16 (Persistence Implementation) must implement the logical data contracts established in this document. Stage 16 will specifically deliver:
1. **Firestore Client Driver:** Initialization of `@google-cloud/firestore` configured for Cloud Run Application Default Credentials (`ADC`) and Firestore Local Emulator.
2. **Physical Collection Schemas:** Concrete TypeScript interfaces and Zod runtime schema validators matching Section 6.
3. **Optimistic Locking Implementation:** Enforcing OCC version checking in all update mutations.
4. **Atomic Multi-Document Transactions:** Implementing `runTransaction` blocks for the 6 mandatory boundaries defined in Stage 12.
5. **Composite Index Declarations:** Generating `firestore.indexes.json` matching Section 15.
6. **Local Emulator Test Suite:** Complete offline unit and integration tests executing against `firebase emulators:start --only firestore`.
7. **Google Sheets Export Worker:** Asynchronous background worker mirroring approved updates to Google Sheets.

**Explicit Non-Scope for Stage 13:** Stage 13 does **not** create collections, indexes, repository classes, or install NPM packages.

---

## 28. Architectural Invariants

The data model contract enforces the following non-negotiable invariants:
1. **Single Authoritative System of Record:** Exactly one system (Cloud Firestore Native Mode) authoritatively owns transactional business state.
2. **Zero Duplicate Ownership:** Google Sheets is strictly a read-only secondary export window; it never owns authoritative state.
3. **Strict Zero-Cost Compliance:** The logical schema is designed to operate 100% within GCP free tier allowances (₹0–₹100 initial investment constraint).
4. **No Binary Blobs in Firestore:** Media binaries remain strictly in Google Drive and GCS; Firestore stores only metadata, checksums, and reference URIs.
5. **Immutable History Segregation:** Historical audit logs (`audit_events`) and step transitions (`workflow_transitions`) are append-only. Updates and deletes are prohibited.
6. **Separation of Concurrency Token from Content Version:** OCC `version` is distinct from pedagogical `currentVersionNumber`.
7. **Server-Authoritative Timestamps:** All temporal markers are generated server-side in UTC ISO 8601.
8. **Anti-Self-Approval Enforcement:** Academic review records must enforce `authorUserId !== reviewerUserId` (`GAR-02`).
9. **Unbounded Log Containment:** High-volume event sequences are isolated in subcollections, never embedded as arrays in parent documents.
10. **External Platform Reference Isolation:** External IDs are reference pointers, not local primary keys.

---

## 29. Completion Checklist & Sign-off

- [x] Evaluated all 28 canonical domain entities from Stage 06.
- [x] Defined logical collection contracts for all 28 collections.
- [x] Specified detailed field-level contracts with types, constraints, nullability, and owners.
- [x] Established authoritative Source-of-Truth Matrix.
- [x] Codified canonical ID formats and regular expressions.
- [x] Mapped relationship cardinalities, foreign key references, and cascading deletion rules.
- [x] Integrated Stage 08 multi-dimensional state model without status collisions.
- [x] Established strict OCC concurrency versioning contract.
- [x] Standardized UTC ISO 8601 server timestamp contract.
- [x] Codified soft deletion and data retention policies.
- [x] Specified 13 mandatory logical composite indexes.
- [x] Codified Firestore root vs. subcollection modeling rules.
- [x] Defined external system reference contracts (Drive, YouTube, Meta, Gemini).
- [x] Defined Google Sheets unidirectional export contract.
- [x] Formulated Data Ownership and Data Lifecycle matrices.
- [x] Completed Brownfield Repository Mapping and Conflict Register.
- [x] Completed Traceability Matrix and Stage 16 Implementation Contract.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or physical infrastructure created.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 13 — DATA MODEL & DATA CONTRACT
================================================================================
Artifact:            docs/architecture/13-DATA-MODEL-DATA-CONTRACT.md
Version:             13.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 13 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Physical Collections or Indexes)
Stage Boundary:      HALTED AT STAGE 13. Awaiting Stage 14 Instruction.
================================================================================
```

---

## 30. Anti-Overclaim Statement

> **CONFIRMATION:**
> SDLC Stage 13 is a DESIGN / DATA CONTRACT stage.
> 
> **DATA MODEL CONTRACT COMPLETE.**
> **DATABASE IMPLEMENTATION NOT PERFORMED.**
> 
> No physical Firestore collections or indexes were created. No Google Sheets worksheets were altered. No application source code or repository implementations were modified. No database SDK packages were installed. All physical schema provisioning, repository construction, and emulator test suites are deferred strictly to **Stage 16 (Persistence Implementation)**.
