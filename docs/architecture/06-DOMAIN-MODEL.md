# 06 — DOMAIN MODEL
## Burra Pariksha Content Management System (BP-CMS)
### Stage 06 of 30-Stage Modernization Program — Authoritative Business Domain Model

---

## 1. Document Governance & Anti-Overclaim Statement

| Attribute | Definition |
| :--- | :--- |
| **Document Path** | `docs/architecture/06-DOMAIN-MODEL.md` |
| **SDLC Stage** | Stage 06 — Domain Model |
| **Document Version** | 6.0.0-SDLC-RESTART |
| **Status** | ACTIVE DOMAIN MODEL BASELINE |
| **Scope** | Authoritative Business Entities, Relationships, Lifecycles, Field Contracts, and Immutability Rules |

### Strict Anti-Overclaim Invariants
1. **Domain Model vs. Database Schema:** This document defines the **BUSINESS OBJECT MODEL** of BP-CMS. It does **NOT** define physical database tables, SQL DDL schemas, Google Sheets worksheet rows, ORM models, or API transport schemas. Physical persistence schemas belong strictly to Stage 12 and Stage 16.
2. **Target Domain vs. Brownfield Code:** The domain definitions herein reflect the target business requirements and architectural principles established in Stages 01–05. Existing TypeScript interfaces and legacy database structures from Stage 03 are documented as brownfield evidence, but do **NOT** override this canonical domain model.
3. **No Phantom Implementation:** Words like *"Implemented"* or *"Created"* must not be applied to runtime code in Stage 06. This stage formally specifies the conceptual business entities that future implementation stages will instantiate.
4. **Zero Production Code Changes:** No production source code, route files, services, or database schemas are altered in Stage 06.

---

## 2. Scope & Bounded Contexts

The BP-CMS domain model models the end-to-end lifecycle of competitive examination educational media across the 8 internal domain bounded contexts established in Stage 05 (Target System Boundary):

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   BP-CMS DOMAIN BOUNDED CONTEXTS                       │
├───────────────────────────────┬────────────────────────────────────────┤
│ 1. Identity & Governance      │ User, Role, Capability, AuditEvent,   │
│                               │ Notification, AppConfig                │
├───────────────────────────────┼────────────────────────────────────────┤
│ 2. Curriculum & Question      │ Question, QuestionVersion,             │
│                               │ QuestionReview, SyllabusContext        │
├───────────────────────────────┼────────────────────────────────────────┤
│ 3. Studio Production          │ Content, Script, ScriptVersion,        │
│                               │ Video, VideoTake, VideoEdit (MasterCut)│
├───────────────────────────────┼────────────────────────────────────────┤
│ 4. Packaging & Social         │ Thumbnail, SocialReview                │
├───────────────────────────────┼────────────────────────────────────────┤
│ 5. Distribution & Sync        │ PublishingPackage, Publication,Platform│
├───────────────────────────────┼────────────────────────────────────────┤
│ 6. Audience Analytics         │ AnalyticsSnapshot, PerformanceRecord   │
├───────────────────────────────┼────────────────────────────────────────┤
│ 7. Pedagogical Intelligence   │ IntelligenceInsight                    │
├───────────────────────────────┼────────────────────────────────────────┤
│ 8. Media Metadata & Storage   │ MediaAsset, MediaReference,            │
│                               │ ArchiveReference                       │
├───────────────────────────────┼────────────────────────────────────────┤
│ 9. Workflow Orchestration     │ WorkflowInstance, WorkflowTransition   │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 3. Entity Classification (Candidate Set Evaluation)

Every candidate entity is evaluated against Stage 01 requirements, Stage 04 principles, and Stage 05 boundaries:

| # | Candidate Entity | Architectural Classification | Domain Owner | Strategic Disposition |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **User** | **CANONICAL ENTITY** | Identity & Governance | Core identity representing a team member account. |
| 2 | **Role** | **CANONICAL ENTITY** | Identity & Governance | Grouping of operational responsibilities. |
| 3 | **Capability** | **CANONICAL ENTITY** | Identity & Governance | Atomic permission token (`RESOURCE:ACTION`). |
| 4 | **Question** | **CANONICAL ENTITY** | Curriculum & Question | Academic problem aggregate with bilingual proof. |
| 5 | **QuestionVersion** | **SUPPORTING ENTITY** | Curriculum & Question | Immutable historical version of a question's text & proof. |
| 6 | **QuestionReview** | **CANONICAL ENTITY** | Curriculum & Question | Formal academic verification gate decision and checklist. |
| 7 | **Content** | **CANONICAL ENTITY** | Studio Production | Enduring aggregate root connecting 15-step pipeline. |
| 8 | **Script** | **CANONICAL ENTITY** | Studio Production | 5-part spoken video script entity. |
| 9 | **ScriptVersion** | **SUPPORTING ENTITY** | Studio Production | Immutable locked teleprompter version with cadence metrics. |
| 10 | **Video** | **CANONICAL ENTITY** | Studio Production | Production record orchestrating camera filming and cuts. |
| 11 | **VideoTake** | **SUPPORTING ENTITY** | Studio Production | Individual camera take logged during studio recording. |
| 12 | **VideoEdit** | **SUPPORTING ENTITY** | Studio Production | Post-production master cut record with loudness stamp. |
| 13 | **MediaAsset** | **CANONICAL ENTITY** | Media Metadata | First-class metadata record for externally stored binaries. |
| 14 | **MediaReference** | **VALUE OBJECT** | Media Metadata | Embedded pointer struct (URI, provider, checksum). |
| 15 | **ArchiveReference**| **EXTERNAL REFERENCE** | Media Metadata | Pointer to cold GCS snapshot backup or camera raw tape. |
| 16 | **Thumbnail** | **CANONICAL ENTITY** | Packaging & Social | Visual cover packaging package with A/B variants. |
| 17 | **SocialReview** | **CANONICAL ENTITY** | Packaging & Social | 9:16 safe-zone review sign-off and pinned comment audit. |
| 18 | **PublishingPackage**| **CANONICAL ENTITY**| Distribution & Sync | Staged release package ready for public broadcast. |
| 19 | **Publication** | **CANONICAL ENTITY** | Distribution & Sync | Dispatched broadcast execution record with live URL. |
| 20 | **Platform** | **SUPPORTING / VALUE OBJ**| Distribution & Sync | Target broadcast network descriptor (YouTube, Reels). |
| 21 | **AnalyticsSnapshot**| **CANONICAL ENTITY** | Audience Analytics | Immutable milestone engagement observation (24h/7d/30d).|
| 22 | **PerformanceRecord**| **DERIVED RECORD** | Audience Analytics | Diagnostic analysis correlating drop-offs with script. |
| 23 | **IntelligenceInsight**| **CANONICAL ENTITY**| Pedagogical Intel | Approved curriculum directive seeding Step 01 batches. |
| 24 | **WorkflowInstance** | **CANONICAL ENTITY** | Workflow Orchestration | Tracks 15-step lifecycle position for a Content item. |
| 25 | **WorkflowTransition**| **SUPPORTING ENTITY**| Workflow Orchestration | Immutable audit event recording an individual step move. |
| 26 | **Notification** | **CANONICAL ENTITY** | Identity & Governance | Operational alert requiring team member attention. |
| 27 | **AuditEvent** | **CANONICAL ENTITY** | Identity & Governance | Append-only forensic ledger entry for system mutations. |

---

## 4. Entity Catalogue & Responsibility Specifications

### 4.1 Identity & Governance Domain

#### User (Canonical Entity)
- **Purpose:** Represents an authenticated team member participating in BP-CMS operations.
- **Owner:** Identity & Governance
- **Relationships:**
  - Has many `Role` (via user role assignments, Cardinality: $1..*$, Required).
  - Authors many `Question` (Cardinality: $0..*$).
  - Verifies many `QuestionReview` (Cardinality: $0..*$).
  - Appears as actor in many `AuditEvent` and `WorkflowTransition` (Cardinality: $0..*$).
- **Lifecycle:** `PROVISIONED` $\rightarrow$ `ACTIVE` $\leftrightarrow$ `SUSPENDED` $\rightarrow$ `DEACTIVATED`. Cannot be hard-deleted; status changes must be soft updates.

#### Role (Canonical Entity)
- **Purpose:** Represents a functional operational responsibility profile within the production organization.
- **Owner:** Identity & Governance
- **Relationships:**
  - Composed of many `Capability` (Cardinality: $1..*$, Required).
  - Assigned to many `User` (Cardinality: $0..*$).
- **Lifecycle:** Static system roles (`ADMIN`, `CONTENT_LEAD`, `QUESTION_AUTHOR`, etc.) are immutable system constants; custom roles may be configured.

#### Capability (Canonical Entity)
- **Purpose:** Represents the atomic authorization permission required to execute an action on a domain resource.
- **Owner:** Identity & Governance
- **Structure:** Natural key formatted as `RESOURCE:ACTION` (e.g., `QUESTION:CREATE`, `QUESTION_REVIEW:VERIFY`, `VIDEO_EDIT:APPROVE`).
- **Lifecycle:** Immutable system definitions.

#### AuditEvent (Canonical Entity)
- **Purpose:** Represents an immutable, append-only forensic event recording every security, workflow, or data mutation.
- **Owner:** Identity & Governance
- **Relationships:**
  - References actor `User` (Cardinality: $1$, Required).
  - References target entity by type and ID (Cardinality: $1$, Required).
- **Lifecycle:** Strictly append-only. Mutation or deletion is prohibited by architectural invariant.

#### Notification (Canonical Entity)
- **Purpose:** Represents an operational alert or task assignment notice dispatched to a team member.
- **Owner:** Identity & Governance
- **Lifecycle:** `QUEUED` $\rightarrow$ `DELIVERED` $\rightarrow$ `READ` $\rightarrow$ `DISMISSED`.

---

### 4.2 Curriculum & Question Domain

#### Question (Canonical Entity)
- **Purpose:** Represents an academic aptitude or reasoning multiple-choice problem designed for competitive examinations.
- **Owner:** Curriculum & Question
- **Relationships:**
  - Belongs to an author `User` (Cardinality: $1$, Required).
  - Has many `QuestionVersion` (Cardinality: $1..*$, at least version 1 required).
  - Has many `QuestionReview` (Cardinality: $0..*$, tracking academic verification history).
  - Linked to exactly one `Content` item (Cardinality: $1$, Required).
- **Lifecycle:** `DRAFT` $\rightarrow$ `PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` (or `REVISION_REQUIRED` / `REJECTED`) $\rightarrow$ `ARCHIVED`.

#### QuestionVersion (Supporting Entity)
- **Purpose:** Captures an immutable snapshot of question text, options, answer key, and mathematical proof at a specific revision point.
- **Owner:** Curriculum & Question
- **Relationships:**
  - Belongs to exactly one parent `Question` (Cardinality: $1$, Required).
- **Lifecycle:** `DRAFT` (mutable during active authoring) $\rightarrow$ `LOCKED` (immutable upon submission for verification). Once `LOCKED`, it can never be mutated; edits require incrementing `versionNumber`.

#### QuestionReview (Canonical Entity)
- **Purpose:** Captures the formal pedagogical verification audit decision executed by an Academic Verifier.
- **Owner:** Curriculum & Question
- **Relationships:**
  - References the target `QuestionVersion` (Cardinality: $1$, Required).
  - References the verifier `User` (Cardinality: $1$, Required, subject to `GAR-02: authorId !== verifierId`).
- **Lifecycle:** `PENDING` $\rightarrow$ `APPROVED` | `CHANGES_REQUESTED` | `REJECTED`. Once decided, the review record is completely immutable.

---

### 4.3 Studio Production Domain

#### Content (Canonical Entity — Aggregate Root)
- **Purpose:** The enduring aggregate root representing a complete educational media asset across all 15 manufacturing steps.
- **Owner:** Studio Production
- **Relationships:**
  - Governed by exactly one `WorkflowInstance` (Cardinality: $1$, Required).
  - Originates from exactly one `Question` (Cardinality: $1$, Required).
  - Has zero or one `Script` (Cardinality: $0..1$).
  - Has zero or one `Video` project (Cardinality: $0..1$).
  - Has zero or one `Thumbnail` package (Cardinality: $0..1$).
  - Has zero or one `SocialReview` (Cardinality: $0..1$).
  - Has zero or one `PublishingPackage` (Cardinality: $0..1$).
  - Has many `Publication` records (Cardinality: $0..*$).
  - Has many `AnalyticsSnapshot` records (Cardinality: $0..*$).
- **Lifecycle:** `ACTIVE` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`.

#### Script (Canonical Entity)
- **Purpose:** Manages the conversational short-form video presentation script (45–60 seconds) adapted from the verified question.
- **Owner:** Studio Production
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - Has many `ScriptVersion` (Cardinality: $1..*$).
- **Lifecycle:** `DRAFT` $\rightarrow$ `LOCKED_FOR_STUDIO` $\rightarrow$ `SUPERSEDED`.

#### ScriptVersion (Supporting Entity)
- **Purpose:** An immutable teleprompter delivery version containing spoken Telugu/English lines, visual directives, word count, and estimated spoken duration.
- **Owner:** Studio Production
- **Lifecycle:** Mutable while authoring $\rightarrow$ Immutable once marked `LOCKED`.

#### Video (Canonical Entity)
- **Purpose:** Manages the physical camera recording and post-production editing workflow for a Content asset.
- **Owner:** Studio Production
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - Has many `VideoTake` (Cardinality: $0..*$).
  - Has zero or many `VideoEdit` (master cuts, Cardinality: $0..*$).
- **Lifecycle:** `SCHEDULED` $\rightarrow$ `FILMING` $\rightarrow$ `IN_EDITING` $\rightarrow$ `PENDING_QC` $\rightarrow$ `QC_APPROVED` $\rightarrow$ `ARCHIVED`.

#### VideoTake (Supporting Entity)
- **Purpose:** Metadata record of an individual camera take filmed in the studio.
- **Owner:** Studio Production
- **Relationships:**
  - Belongs to parent `Video` (Cardinality: $1$, Required).
  - References a `MediaAsset` (Cardinality: $1$, Required for raw take file).
- **Lifecycle:** `LOGGED` $\rightarrow$ `SELECTED` | `DISCARDED`.

#### VideoEdit (Supporting Entity — Master Cut)
- **Purpose:** Represents an edited master video cut submitted by an editor for technical Quality Control (QC).
- **Owner:** Studio Production
- **Relationships:**
  - Belongs to parent `Video` (Cardinality: $1$, Required).
  - References a `MediaAsset` (Cardinality: $1$, Required for master MP4).
- **Lifecycle:** `SUBMITTED` $\rightarrow$ `QC_PASSED` | `QC_REJECTED`. Immutable once certified by QC Officer.

---

### 4.4 Packaging & Social Domain

#### Thumbnail (Canonical Entity)
- **Purpose:** Manages mobile cover artwork candidate variants (A/B/C) and curiosity hook headlines.
- **Owner:** Packaging & Social
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - References one or more `MediaAsset` (Cardinality: $1..*$, thumbnail image files).
- **Lifecycle:** `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` | `REVISION_REQUIRED`.

#### SocialReview (Canonical Entity)
- **Purpose:** Conducts holistic review of the 9:16 vertical smartphone simulator presentation, including copy, hashtags, and Telugu pinned comments.
- **Owner:** Packaging & Social
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - References a reviewer `User` (Cardinality: $1$, Required).
- **Lifecycle:** `PENDING_REVIEW` $\rightarrow$ `APPROVED_FOR_RELEASE` | `REVISIONS_REQUESTED`.

---

### 4.5 Distribution & Sync Domain

#### PublishingPackage (Canonical Entity)
- **Purpose:** Stages release copy, channel tags, scheduled broadcast time, and platform parameters for live release.
- **Owner:** Distribution & Sync
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - Has many `Publication` dispatches (Cardinality: $0..*$).
- **Lifecycle:** `STAGED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `COMPLETED` | `FAILED`.

#### Publication (Canonical Entity)
- **Purpose:** Immutable record of an executed live broadcast on a specific external platform.
- **Owner:** Distribution & Sync
- **Relationships:**
  - Belongs to parent `PublishingPackage` (Cardinality: $1$, Required).
  - References a target `Platform` (Cardinality: $1$, Required).
- **Lifecycle:** `DISPATCHING` $\rightarrow$ `PUBLISHED` $\rightarrow$ `SYNC_VERIFIED` | `SYNC_FAILED`.

#### Platform (Supporting Entity / Value Object)
- **Purpose:** Configuration descriptor for an external broadcast channel (e.g., `YOUTUBE_SHORTS`, `INSTAGRAM_REELS`).
- **Owner:** Distribution & Sync

---

### 4.6 Audience Analytics & Pedagogical Intelligence Domains

#### AnalyticsSnapshot (Canonical Entity)
- **Purpose:** Immutable record capturing platform audience engagement metrics at a standardized milestone interval (24 hours, 7 days, 30 days).
- **Owner:** Audience Analytics
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - References originating `Publication` (Cardinality: $1$, Required).
- **Lifecycle:** Immutable once ingested. Never overwritten; subsequent observations generate new snapshots.

#### PerformanceRecord (Derived Record)
- **Purpose:** Diagnostic evaluation correlating audience drop-off points with script timestamps and pedagogical formulas.
- **Owner:** Audience Analytics
- **Relationships:**
  - Belongs to parent `Content` (Cardinality: $1$, Required).
  - References reviewer `User` (Cardinality: $1$, Required).
- **Lifecycle:** `DRAFT` $\rightarrow$ `FINALIZED`.

#### IntelligenceInsight (Canonical Entity)
- **Purpose:** Actionable curriculum directive synthesizing recurring student misconceptions into approved sprint recommendations that seed Step 01.
- **Owner:** Pedagogical Intelligence
- **Relationships:**
  - Dispatched to seed a new batch of `Question` entities in Step 01 (Cardinality: $1..*$).
  - Approved by a Strategy Lead `User` (Cardinality: $1$, Required).
- **Lifecycle:** `PROPOSED` $\rightarrow$ `APPROVED` $\rightarrow$ `SEEDED` $\rightarrow$ `ARCHIVED`.

---

### 4.7 Media Metadata & Storage Domain

#### MediaAsset (Canonical Entity)
- **Purpose:** Authoritative metadata entity representing a binary file residing in external storage.
- **Owner:** Media Metadata & Storage
- **Relationships:**
  - Referenced by `VideoTake`, `VideoEdit`, or `Thumbnail` (Cardinality: $1..*$).
- **Lifecycle:** `PENDING_UPLOAD` $\rightarrow$ `REGISTERED` $\rightarrow$ `VERIFIED` $\rightarrow$ `ARCHIVED`.
- **Constraint:** Physical binary resides exclusively in external storage; `MediaAsset` stores only metadata.

#### MediaReference (Value Object)
- **Purpose:** Embedded struct encapsulating storage locator, SHA-256 checksum, MIME type, and byte size.

#### ArchiveReference (External Reference)
- **Purpose:** Pointer to cold storage blob or physical tape archive.

---

### 4.8 Workflow Orchestration Domain

#### WorkflowInstance (Canonical Entity)
- **Purpose:** Governs the sequential execution of the canonical 15-step business lifecycle for an individual `Content` item.
- **Owner:** Workflow Orchestration
- **Relationships:**
  - Belongs to exactly one `Content` item ($1:1$, Required).
  - Has many `WorkflowTransition` records (Cardinality: $1..*$, transition history).
- **Properties:** Current `workflow_step` ($1..15$), entry timestamp, active assignee `User`.

#### WorkflowTransition (Supporting Entity)
- **Purpose:** Immutable audit record documenting an individual workflow stage advancement, rejection, or rework loop.
- **Owner:** Workflow Orchestration
- **Properties:** `from_step`, `to_step`, `actor_user_id`, `timestamp`, `transition_status` (`SUCCESS`, `REJECTED`), `reason_remarks`.

---

## 5. Field Specifications

### 5.1 Required Fields by Entity

| Entity | Field Name | Type / Format | Mutability | Business Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **User** | `userId` | `USR-xxxxxx` string | **Immutable** | Permanent unique business identity. |
| | `email` | RFC 5322 Email string | Mutable | Primary login credential and notification address. |
| | `displayName` | Non-empty string | Mutable | Operator name rendered across workbenches. |
| | `status` | `UserStatus` enum | Mutable | Enforces account access controls. |
| | `createdAt` | ISO 8601 UTC timestamp | **Immutable** | Account provisioning timestamp. |
| **Question** | `questionId` | `BP-Q-xxxxxx` string | **Immutable** | Permanent unique curriculum problem ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Relational link to parent Content aggregate root. |
| | `authorUserId`| `USR-xxxxxx` string | **Immutable** | Permanent attribution of author (GAR-02 basis). |
| | `status` | `QuestionStatus` enum | Mutable | Lifecycle state (`DRAFT`, `VERIFIED`, etc.). |
| | `currentVersionNumber`| Positive integer | Mutable | Points to current active version. |
| | `createdAt` | ISO 8601 UTC timestamp | **Immutable** | Initial draft creation timestamp. |
| **QuestionVersion**| `versionId` | `BP-QV-xxx-Vxx` string | **Immutable** | Unique version identifier. |
| | `questionId` | `BP-Q-xxxxxx` string | **Immutable** | Parent question reference. |
| | `versionNumber`| Positive integer | **Immutable** | Monotonically increasing version counter. |
| | `questionTextTelugu`| Non-empty string | Immutable* | Core question stem in Telugu script. |
| | `options` | Tuple of 4 strings | Immutable* | Exactly 4 distinct multiple-choice options. |
| | `correctOptionIndex`| 0 \| 1 \| 2 \| 3 | Immutable* | Exactly one correct answer key. |
| | `solutionProofTelugu`| Non-empty string | Immutable* | Complete step-by-step mathematical proof. |
| | `subject` / `topic` | Taxonomy strings | Immutable* | Syllabus classification. |
| | `difficulty` | `EASY` \| `MED` \| `HARD` | Immutable* | Pedagogical difficulty tier. |
| | `isLocked` | Boolean | Mutable | Flags transition from draft to locked version. |
| **QuestionReview** | `reviewId` | `BP-QR-xxxxxx` string | **Immutable** | Unique verification record ID. |
| | `versionId` | `BP-QV-xxx-Vxx` string | **Immutable** | Target question version reviewed. |
| | `verifierUserId`| `USR-xxxxxx` string | **Immutable** | Academic verifier identity (`authorId !== verifierId`).|
| | `decision` | `APPROVED` \| `REVISE` \| `REJECT`| **Immutable** | Definitive review outcome. |
| | `checklist` | Key-value boolean map | **Immutable** | Completed verification criteria results. |
| | `reviewedAt` | ISO 8601 UTC timestamp | **Immutable** | Timestamp of verification signoff. |
| **Content** | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Enduring aggregate root identifier across all 15 steps.|
| | `title` | Non-empty string | Mutable | Working title of the educational video item. |
| | `status` | `ContentStatus` enum | Mutable | High-level status (`ACTIVE`, `PUBLISHED`, `ARCHIVED`). |
| | `createdAt` | ISO 8601 UTC timestamp | **Immutable** | Production project initiation timestamp. |
| **Script** | `scriptId` | `BP-SCR-xxxxxx` string | **Immutable** | Unique script entity ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `currentVersionNumber`| Positive integer | Mutable | Points to current active script version. |
| **ScriptVersion** | `scriptVersionId`| `BP-SV-xxx-Vxx` string | **Immutable** | Unique script version identifier. |
| | `scriptId` | `BP-SCR-xxxxxx` string | **Immutable** | Parent script reference. |
| | `versionNumber`| Positive integer | **Immutable** | Script revision counter. |
| | `hookText` | Non-empty string | Immutable* | 0–5 second attention hook. |
| | `spokenLines`| Array of spoken objects| Immutable* | Spoken Telugu/English sentences with visual cues. |
| | `estimatedDurationSeconds`| Number (45–60s) | Immutable* | Calculated pacing metric based on cadence. |
| | `isLocked` | Boolean | Mutable | Locked for studio teleprompter use. |
| **Video** | `videoId` | `BP-VID-xxxxxx` string | **Immutable** | Unique video production project ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `status` | `VideoStatus` enum | Mutable | Video production state. |
| **VideoTake** | `takeId` | `BP-VTK-xxxxxx` string | **Immutable** | Camera take identifier. |
| | `videoId` | `BP-VID-xxxxxx` string | **Immutable** | Parent video project reference. |
| | `takeNumber` | Positive integer | **Immutable** | Sequence number of camera take. |
| | `mediaAssetId`| `MED-xxxxxx` string | **Immutable** | Reference to external raw video take file. |
| | `durationSeconds`| Positive number | **Immutable** | Take duration. |
| | `isSelected` | Boolean | Mutable | Flag indicating take handoff to editing bay. |
| **VideoEdit** | `editId` | `BP-VED-xxxxxx` string | **Immutable** | Master cut identifier. |
| | `videoId` | `BP-VID-xxxxxx` string | **Immutable** | Parent video project reference. |
| | `mediaAssetId`| `MED-xxxxxx` string | **Immutable** | Reference to external master cut MP4 file. |
| | `audioLoudnessLufs`| Number (target -14) | **Immutable** | Certified loudness measurement. |
| | `qcStatus` | `PENDING` \| `PASSED` \| `FAILED`| Mutable | Technical QC gate result. |
| **MediaAsset** | `mediaAssetId`| `MED-xxxxxx` string | **Immutable** | Unique media metadata record ID. |
| | `storageProvider`| `GOOGLE_DRIVE` \| `GCS` | **Immutable** | External storage provider identifier. |
| | `externalStorageUri`| URI string | Mutable | External locator (pointer to binary). |
| | `sha256Checksum`| Hex string (64 chars) | **Immutable** | Cryptographic integrity checksum. |
| | `fileSizeBytes`| Positive integer | **Immutable** | Binary size in bytes. |
| | `mimeType` | MIME string | **Immutable** | Media format (`video/mp4`, `image/png`). |
| | `status` | `MediaStatus` enum | Mutable | Verification status of external file. |
| **Thumbnail** | `thumbnailId`| `BP-THM-xxxxxx` string | **Immutable** | Unique thumbnail package ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `mediaAssetId`| `MED-xxxxxx` string | Mutable | Primary approved cover artwork reference. |
| | `hookHeadlineText`| Non-empty string | Mutable | Mobile curiosity headline (no answer leaks). |
| | `status` | `ThumbnailStatus` enum| Mutable | Approval state of thumbnail package. |
| **SocialReview** | `socialReviewId`| `BP-SRV-xxxxxx` string| **Immutable** | Unique social review record ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `reviewerUserId`| `USR-xxxxxx` string | **Immutable** | Reviewing media manager. |
| | `safeZoneApproved`| Boolean | **Immutable** | 9:16 vertical safe zone clearance certification.|
| | `pinnedCommentTelugu`| Non-empty string | **Immutable** | Verified Telugu solution and CTA comment. |
| | `decision` | `APPROVED` \| `REVISE` | **Immutable** | Social packaging release decision. |
| **PublishingPackage**| `packageId` | `BP-PKG-xxxxxx` string | **Immutable** | Unique release package ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `targetPlatforms`| Array of `Platform` | **Immutable** | Selected distribution channels. |
| | `scheduledReleaseTime`| ISO 8601 UTC timestamp| Mutable | Target broadcast publication time. |
| | `status` | `PublishingStatus` enum| Mutable | Release package staging state. |
| **Publication** | `publicationId`| `BP-PUB-xxxxxx` string | **Immutable** | Live broadcast record ID. |
| | `packageId` | `BP-PKG-xxxxxx` string | **Immutable** | Originating publishing package reference. |
| | `platform` | `Platform` enum | **Immutable** | Specific broadcast channel. |
| | `platformVideoId`| External platform ID | **Immutable** | Live YouTube / Meta video identifier. |
| | `liveWatchUrl`| URL string | **Immutable** | Canonical public viewing link. |
| | `publishedAt`| ISO 8601 UTC timestamp | **Immutable** | Live dispatch execution timestamp. |
| **AnalyticsSnapshot**| `snapshotId`| `BP-SNP-xxxxxx` string | **Immutable** | Unique telemetry snapshot ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `milestone` | `24H` \| `7D` \| `30D` | **Immutable** | Standardized measurement milestone. |
| | `viewCount` | Non-negative integer | **Immutable** | Ingested view counter at milestone. |
| | `watchTimeMinutes`| Non-negative number | **Immutable** | Cumulative watch time. |
| | `retentionCurve`| Array of `[second, pct]`| **Immutable** | Second-by-second audience retention array. |
| |`capturedAt` | ISO 8601 UTC timestamp | **Immutable** | Ingestion timestamp. |
| **PerformanceRecord**| `performanceId`| `BP-PRF-xxxxxx` string | **Immutable** | Diagnostic evaluation record ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | Parent content item reference. |
| | `reviewerUserId`| `USR-xxxxxx` string | **Immutable** | Reviewing faculty / strategist. |
| | `dropOffCauses`| Array of diagnostic codes| Mutable | Categorized causes (e.g. `CONCEPTUAL_CONFUSION`).|
| **IntelligenceInsight**| `insightId` | `BP-INS-xxxxxx` string | **Immutable** | Unique intelligence insight ID. |
| | `targetTopic` | Taxonomy string | **Immutable** | Curriculum topic requiring reinforcement. |
| | `pedagogicalDirective`| Non-empty string | **Immutable** | Actionable directive for Step 01 question sprint.|
| | `approvedByUserId`| `USR-xxxxxx` string | **Immutable** | Authorizing Content Strategy Lead. |
| **WorkflowInstance**| `workflowId` | `BP-WF-xxxxxx` string | **Immutable** | Unique workflow instance ID. |
| | `contentId` | `BP-CNT-xxxxxx` string | **Immutable** | 1:1 bound Content item. |
| | `currentStep` | Integer ($1..15$) | Mutable | Canonical business workflow stage. |
| | `updatedAt` | ISO 8601 UTC timestamp | Mutable | Last stage transition timestamp. |
| **WorkflowTransition**| `transitionId`| `BP-WFT-xxxxxx` string| **Immutable** | Unique transition event ID. |
| | `workflowId` | `BP-WF-xxxxxx` string | **Immutable** | Parent workflow instance reference. |
| | `fromStep` | Integer ($1..15$) | **Immutable** | Prior workflow stage. |
| | `toStep` | Integer ($1..15$) | **Immutable** | New workflow stage. |
| | `actorUserId`| `USR-xxxxxx` string | **Immutable** | Authorizing operator. |
| | `timestamp` | ISO 8601 UTC timestamp | **Immutable** | Exact transition execution timestamp. |
| **AuditEvent** | `auditId` | `BP-AUD-xxxxxx` string | **Immutable** | Unique append-only audit event ID. |
| | `actorUserId`| `USR-xxxxxx` string | **Immutable** | Acting user. |
| | `action` | Action token string | **Immutable** | Operation performed (`QUESTION_VERIFIED`, etc.).|
| | `entityType` / `entityId`| Entity reference strings| **Immutable** | Target entity modified. |
| | `stateDelta` | Serialized JSON delta | **Immutable** | Pre/post state mutation diff. |
| | `timestamp` | ISO 8601 UTC timestamp | **Immutable** | Tamper-evident execution timestamp. |

*(Note: Fields marked `Immutable*` are mutable only while `isLocked === false`; once locked, they are permanently frozen).*

---

### 5.2 Optional Fields by Entity

| Entity | Field Name | Type / Format | Why Absence is Valid |
| :--- | :--- | :--- | :--- |
| **User** | `phone` | Phone string | Optional personal contact number. |
| | `avatarUrl` | URL string | Optional profile avatar image pointer. |
| | `subjectSpecialties`| Array of strings | Optional pedagogical domain tags (e.g., "Aptitude", "Reasoning"). |
| **QuestionVersion**| `questionTextEnglish`| String | Telugu is primary; English translation may be added asynchronously. |
| | `solutionExplanationEnglish`| String | English solution proof is optional for Telugu-medium content. |
| | `subtopic` | String | Broad topics may not require subtopic granularity. |
| **QuestionReview** | `revisionRemarks` | String | Mandatory only when decision is `REVISE` or `REJECT`; absent on direct approval. |
| **VideoTake** | `operatorRemarks` | String | Camera crew may record takes without written notes. |
| **Thumbnail** | `variantBMediaAssetId`| `MED-xxxxxx` string | A/B testing is optional; package may launch with Variant A only. |
| | `variantCMediaAssetId`| `MED-xxxxxx` string | Variant C is optional. |
| **PublishingPackage**| `dispatchedAt` | ISO 8601 UTC timestamp | Absent while package remains in `STAGED` state prior to live broadcast. |
| **Publication** | `initialViewCount24h`| Integer | Populated only after 24 hours have elapsed post-broadcast. |
| **PerformanceRecord**| `remedialActionPlan` | String | Diagnostic review may record observations without prescribing immediate rework. |
| **WorkflowTransition**| `remarks` | String | Simple forward approvals do not require mandatory written remarks. |

---

## 6. Immutability Invariants

The domain model strictly enforces field-level and record-level immutability:

1. **Identity Immutability:** Every business entity identifier (`userId`, `questionId`, `contentId`, `mediaAssetId`, etc.) is assigned upon creation and can **never** be updated or reassigned.
2. **Creation Timestamp Immutability:** `createdAt` and `timestamp` fields capture real-time occurrence and can never be modified.
3. **Actor Attribution Immutability:** `authorUserId`, `verifierUserId`, and `actorUserId` cannot be reassigned post-creation (protecting audit accountability and Anti-Self-Approval rules).
4. **Locked Version Immutability:** Once `QuestionVersion.isLocked` or `ScriptVersion.isLocked` is set to `true`, the text, options, proofs, and spoken lines become permanently frozen. Any correction requires instantiating a new version with an incremented version number.
5. **Review Decision Immutability:** Once submitted, `QuestionReview`, `VideoEdit.qcStatus`, and `SocialReview` decision records cannot be edited or overridden. A subsequent review generates a new review entity.
6. **Audit Ledger Immutability:** `AuditEvent` and `WorkflowTransition` records are strictly append-only. No update or delete operations are permitted in domain contracts.
7. **External Publication Immutability:** Once a live broadcast is confirmed and `Publication.platformVideoId` is recorded, the identifier and publication timestamp become immutable historical facts.

---

## 7. External References Model

External references represent systems residing outside the BP-CMS boundary (Stage 05). They are modeled as first-class domain references, separating local metadata from external execution:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL REFERENCES ARCHITECTURE                     │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│ Domain Reference    │ Target System     │ Encapsulated External Data   │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ `MediaReference`    │ Google Drive / GCS│ `externalStorageUri`,        │
│                     │                   │ `storageProvider`,           │
│                     │                   │ `sha256Checksum`, `mimeType` │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ `Publication`       │ YouTube / Meta    │ `platformVideoId`,           │
│                     │                   │ `liveWatchUrl`, `platform`   │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ `AnalyticsSnapshot` │ YouTube Analytics │ `externalChannelId`,         │
│                     │                   │ `rawMilestoneMetrics`        │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ `AiPromptContext`   │ Google Gemini API │ `promptContext`,             │
│                     │                   │ `modelVersion`, `tokenCount` │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ `ArchiveReference`  │ GCS Cold Archive  │ `archiveBucketUri`,          │
│                     │                   │ `checksum`, `restorePoint`   │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

**Boundary Invariant:** The BP-CMS domain model contains **zero binary data**. All media references resolve to external storage locators managed by dedicated boundary adapters.

---

## 8. Content Aggregation & Relational Architecture

The `Content` entity serves as the enduring **Aggregate Root** across the canonical 15-step manufacturing lifecycle. This resolves the Stage 03 conflict where `Question`, `Video`, and `ContentMaster` competed for ownership.

```text
                               ┌──────────────────────────┐
                               │         Content          │
                               │     (AGGREGATE ROOT)     │
                               │                          │
                               │  - contentId             │
                               │  - title                 │
                               │  - status                │
                               │  - createdAt             │
                               └────────────┬─────────────┘
                                            │
         ┌───────────────────┬──────────────┼──────────────┬───────────────────┐
         │                   │              │              │                   │
         ▼                   ▼              ▼              ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐
│WorkflowInstance │ │    Question     │ │    Script     │ │     Video       │ │    Thumbnail    │
│  - currentStep  │ │  - questionId   │ │  - scriptId   │ │  - videoId      │ │  - thumbnailId  │
│  - transitions  │ │  - versions     │ │  - versions   │ │  - takes        │ │  - variants A/B │
│  - assignee     │ │  - reviews      │ │  - pacing     │ │  - master cuts  │ │  - hook headline│
└─────────────────┘ └─────────────────┘ └───────────────┘ └─────────────────┘ └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  SocialReview   │
                                                  │  - safe-zone    │
                                                  │  - pinned comment│
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │PublishingPackage│
                                                  │  - staged copy  │
                                                  │  - schedule     │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   Publication   │
                                                  │  - YouTube ID   │
                                                  │  - live watch URL│
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │AnalyticsSnapshot│
                                                  │  - retention    │
                                                  │  - view counts  │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │PerformanceRecord│
                                                  │  - diagnostics  │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │IntelligenceLoop │
                                                  │  - sprint directive
                                                  │  (seeds Step 01)│
                                                  └─────────────────┘
```

---

## 9. Review & Quality Gate Models

Quality reviews represent formal, human-gated decision boundaries:

```text
1. QUESTION VERIFICATION GATE (Step 02)
   QuestionVersion ───► QuestionReview ───► Decision: [APPROVED | CHANGES_REQUESTED | REJECTED]
                        (GAR-02: authorUserId !== verifierUserId)

2. MASTER CUT QUALITY CONTROL GATE (Step 07)
   VideoEdit ───────► QC Inspection ───► Decision: [QC_PASSED | QC_FAILED]
                        (Loudness check: -14 LUFS, subtitle sync, video glitches)

3. SOCIAL PACKAGING GATE (Step 09)
   SocialPackage ───► SocialReview ─────► Decision: [APPROVED_FOR_RELEASE | REVISE]
                        (9:16 vertical safe zone check, verified Telugu pinned comment)
```

**AI Boundary Rule:** AI may evaluate text for clarity or generate candidate feedback notes, but the decision property of a review entity must be populated strictly by an authenticated human operator.

---

## 10. Workflow State Machine Model

In strict accordance with Stage 04 Principle 02 (*Business Stage $\neq$ Technical State*), the workflow model is decoupled from entity lifecycles:

- **`WorkflowInstance`:** Encapsulates the sequential position within the 15-step manufacturing pipeline:
  ```text
  01_QUESTION_GENERATION    ──►  02_QUESTION_VERIFICATION  ──►  03_AUDIENCE_SCRIPT
  04_TELEPROMPTER_FILMING   ──►  05_RAW_VIDEO              ──►  06_EDITING_BAY
  07_FINAL_QC               ──►  08_THUMBNAIL              ──►  09_SOCIAL_REVIEW
  10_PUBLISHING_SETUP       ──►  11_PUBLISHED              ──►  12_PLATFORM_SYNC
  13_ANALYTICS              ──►  14_PERFORMANCE_REVIEW     ──►  15_INTELLIGENCE_LOOP
  ```
- **`WorkflowTransition`:** Records the historical ledger of all movements between stages.
- **Entity State Decoupling:**
  - `Content.status` (`ACTIVE`, `PUBLISHED`, `ARCHIVED`)
  - `Question.status` (`DRAFT`, `VERIFIED`, `REVISION_REQUIRED`)
  - `MediaAsset.status` (`PENDING`, `REGISTERED`, `VERIFIED`)
  - Mutating a media status or background job status **never** modifies `WorkflowInstance.currentStep`.

---

## 11. Security, Identity & RBAC Model

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │◄───────►│      Role       │◄───────►│   Capability    │
│  - userId       │  1..*   │  - roleCode     │  1..*   │  - code (RES:ACT│
│  - email        │         │  - roleName     │         │  - resource     │
│  - status       │         │  - isSystemRole │         │  - action       │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

- **Separation of Concerns:**
  - `User`: Account identity and authentication credentials.
  - `Role`: Broad functional grouping of responsibilities assigned to users.
  - `Capability`: Atomic permission token evaluated by backend authorization guards.
- **Server Authoritative:** Capabilities are evaluated authoritatively on the backend by domain services. Client-side role claims are never trusted for authorization.

---

## 12. Audience Analytics & Closed-Loop Intelligence Model

The analytics and intelligence domains implement the closed-loop feedback mechanism:

```text
                        ┌───────────────────────────────┐
                        │       YouTube / Meta          │
                        │    (External Live Video)      │
                        └───────────────┬───────────────┘
                                        │ (Harvest Telemetry)
                                        ▼
                        ┌───────────────────────────────┐
                        │       AnalyticsSnapshot       │
                        │   - milestone: 24H / 7D / 30D │
                        │   - viewCount, watchTime      │
                        │   - audience retention curve  │
                        └───────────────┬───────────────┘
                                        │ (Diagnostic Review)
                                        ▼
                        ┌───────────────────────────────┐
                        │       PerformanceRecord       │
                        │   - drop-off point timestamps │
                        │   - pedagogical causes        │
                        └───────────────┬───────────────┘
                                        │ (Synthesize Learnings)
                                        ▼
                        ┌───────────────────────────────┐
                        │     IntelligenceInsight       │
                        │   - approved sprint directive │
                        │   - syllabus focus & trick    │
                        └───────────────┬───────────────┘
                                        │
                                        ▼ (Seeds Step 01)
                        ┌───────────────────────────────┐
                        │       New Question Batch      │
                        │   (Step 01 Question Studio)   │
                        └───────────────────────────────┘
```

---

## 13. Entity Ownership Matrix

| Entity | Domain Owner | Primary Business Responsibility | Source of Truth | External Boundary Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **User** | Identity & Governance | Account profile and authentication state | BP-CMS Datastore | None |
| **Role** | Identity & Governance | Functional responsibility grouping | BP-CMS Datastore | None |
| **Capability** | Identity & Governance | Atomic authorization permission token | BP-CMS Code/DB | None |
| **AuditEvent** | Identity & Governance | Immutable forensic audit event ledger | BP-CMS Datastore | None |
| **Notification** | Identity & Governance | Operational alert and assignment handoff | BP-CMS Datastore | Email MTA (optional transport) |
| **Question** | Curriculum & Question | Academic syllabus problem master | BP-CMS Datastore | None |
| **QuestionVersion** | Curriculum & Question | Immutable problem text and mathematical proof | BP-CMS Datastore | None |
| **QuestionReview** | Curriculum & Question | Academic verification checklist & decision | BP-CMS Datastore | None |
| **Content** | Studio Production | Enduring 15-step pipeline aggregate root | BP-CMS Datastore | None |
| **Script** | Studio Production | 5-part spoken video script master | BP-CMS Datastore | None |
| **ScriptVersion** | Studio Production | Locked teleprompter delivery script | BP-CMS Datastore | None |
| **Video** | Studio Production | Camera recording and editing coordinator | BP-CMS Datastore | None |
| **VideoTake** | Studio Production | Camera take log metadata | BP-CMS Datastore | Google Drive (raw video file) |
| **VideoEdit** | Studio Production | Master video cut and QC certification | BP-CMS Datastore | Google Drive (master MP4 file) |
| **Thumbnail** | Packaging & Social | Cover artwork variants and hook headlines | BP-CMS Datastore | Google Drive (image files) |
| **SocialReview** | Packaging & Social | 9:16 safe-zone audit and pinned comment | BP-CMS Datastore | None |
| **PublishingPackage**| Distribution & Sync | Distribution staging and release schedule | BP-CMS Datastore | None |
| **Publication** | Distribution & Sync | Live broadcast record with public URL | BP-CMS Datastore | YouTube / Meta API |
| **Platform** | Distribution & Sync | Broadcast channel configuration | BP-CMS Code/DB | None |
| **AnalyticsSnapshot**| Audience Analytics | Ingested milestone audience retention telemetry| BP-CMS Datastore | YouTube Analytics API |
| **PerformanceRecord**| Audience Analytics | Pedagogical drop-off diagnostic review | BP-CMS Datastore | None |
| **IntelligenceInsight**| Pedagogical Intel | Approved curriculum sprint directive | BP-CMS Datastore | Gemini API (assistive only) |
| **MediaAsset** | Media Metadata | First-class media metadata and checksums | BP-CMS Datastore | Google Drive / Cloud Storage |
| **WorkflowInstance** | Workflow Orchestration | 15-step business workflow execution position | BP-CMS Datastore | None |
| **WorkflowTransition**| Workflow Orchestration | Immutable workflow stage advancement event | BP-CMS Datastore | None |

---

## 14. Domain Invariants

The BP-CMS business model enforces 10 cardinal domain invariants:

1. **Stable Business Identity:** Every canonical business entity must have a stable, globally unique, immutable identifier assigned at creation that never changes across migrations.
2. **Locked Content Immutability:** Once a `QuestionVersion` or `ScriptVersion` is marked `isLocked = true`, its content fields are permanently immutable. Any modifications require creating a new version with an incremented version number.
3. **Anti-Self-Approval (GAR-02):** The author of a question cannot serve as the academic verifier for that same question (`Question.authorUserId !== QuestionReview.verifierUserId`).
4. **Accountable Workflow Transitions:** Every `WorkflowTransition` must record a verified `actorUserId`, exact timestamp, source step, target step, and outcome. Anonymous or unlogged transitions are strictly prohibited.
5. **Workflow History Preservation:** Workflow transition history is append-only and cannot be rewritten, truncated, or deleted.
6. **Binary Storage Isolation (Principle 07):** Application datastores store only `MediaAsset` metadata, URIs, and SHA-256 checksums; raw video/audio binary data is strictly prohibited from entering database rows.
7. **External Identifiers are References:** External platform identifiers (`Publication.platformVideoId`, Google Drive file IDs) are stored as external references; they do not imply BP-CMS ownership of external platform servers.
8. **Telemetry vs. Diagnostic Separation:** Raw observed platform metrics (`AnalyticsSnapshot`) are strictly separated from human diagnostic findings (`PerformanceRecord`) and approved directives (`IntelligenceInsight`).
9. **Human-Gated Approval (Principle 09):** AI is assistive; AI outputs cannot autonomously set review decisions (`QuestionReview`, `VideoEdit.qcStatus`, `SocialReview`) without explicit authenticated human authorization.
10. **Single State Ownership (Principle 10):** Exactly one domain service and datastore entity authoritatively owns each piece of business state. No duplicate or competing models may independently mutate the same state.

---

## 15. Brownfield Mapping & Conflict Resolution

Mapping current Stage 03 baseline models to the canonical target domain model:

| Current Codebase Concept | Target Domain Entity | Strategic Disposition | Migration / Refactoring Action |
| :--- | :--- | :---: | :--- |
| `ContentMaster` (Phase 9) | `Content` | **RENAME / CONSOLIDATE** | Consolidate as the canonical aggregate root `Content`. |
| `Question` (in `types/index.ts`) | `Question` + `QuestionVersion` | **SPLIT** | Split mutable master pointer from immutable locked versions. |
| `QuestionValidation` | `QuestionReview` | **RENAME** | Align with standard verification domain nomenclature. |
| `Script` + `ScriptVersion` | `Script` + `ScriptVersion` | **KEEP** | Maintain versioned script structure; bind to `Content`. |
| `Video` (in `types/index.ts`) | `Video` + `VideoTake` + `VideoEdit` | **CONSOLIDATE** | Unify take logging and master cut QC under `Video`. |
| `ThumbnailCandidate` | `Thumbnail` | **CONSOLIDATE** | Consolidate candidate artwork tracking into `Thumbnail`. |
| `SocialReview` | `SocialReview` | **KEEP** | Retain safe-zone review and pinned comment checklist. |
| `PlatformAdaptation` | `PublishingPackage` | **CONSOLIDATE** | Consolidate multi-platform copy into `PublishingPackage`. |
| `PublishingRecord` | `Publication` | **RENAME** | Clarify distinction between staging package and live broadcast. |
| `SocialAnalytics` | `AnalyticsSnapshot` | **CONSOLIDATE** | Unify retention arrays and milestone intervals. |
| `CommentIntelligence` | `PerformanceRecord` | **CONSOLIDATE** | Integrate comment sentiment into diagnostic reviews. |
| `StrategyRecommendation` | `IntelligenceInsight` | **RENAME** | Unify curriculum directives seeding Step 01. |
| `WorkflowOrchestrationService` (11 states)| `WorkflowInstance` (15 steps) | **MIGRATE** | Migrate 11-state enum to canonical 15-step state engine. |
| `VideoProductionStatus` (9 states) | Decoupled `VideoStatus` | **ISOLATE** | Decouple video sub-states from global `workflow_step`. |
| 6 unmounted video pages (`VideoEditPage`, etc.)| N/A | **RETIRE** | Safely delete legacy page code in Stage 21. |
| Silent Admin fallback (`getRequestActor`) | Server Auth Guard | **RETIRE** | Replace with strict 401/403 rejection in Stage 09 & 15. |

---

## 16. Domain Decision Register (Unresolved Decisions)

| Decision ID | Architectural Question | Affected Entities | Why Unresolved | Information Required | Resolution Stage |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **DDR-001** | Should `Content` and `Question` share the same identifier or maintain distinct IDs? | `Content`, `Question` | Historically every piece of content began as a question; separate IDs allow 1 Question to theoretically spawn multiple media formats. | Business confirmation of 1:1 vs 1:N Question-to-Video relationship. | **Stage 07 / Stage 12** |
| **DDR-002** | What maximum retention array resolution should `AnalyticsSnapshot` persist? | `AnalyticsSnapshot` | Second-by-second curves for 60s video generate 60 data points; fine-grained intervals increase storage footprint. | Storage quota vs pedagogical diagnostic fidelity benchmark. | **Stage 12 / Stage 25** |
| **DDR-003** | Should `VideoTake` registration support multi-camera angles (A/B cam)? | `VideoTake` | Current studio setup uses a single primary camera; multi-cam metadata may be speculative. | Studio hardware operational confirmation. | **Stage 21** |

---

## 17. Database Boundary Statement

> [!IMPORTANT]
> **Explicit Database Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual and business domain model of BP-CMS.
> 
> It does **NOT** define:
> - Physical database tables, column types, or primary/foreign key DDL.
> - SQL migration scripts or indexing strategies.
> - Google Sheets worksheet names, column header mappings, or row serialization.
> - Object-Relational Mapping (ORM) or Data Access Object (DAO) classes.
> - REST/RPC API JSON payload schemas or HTTP transport envelopes.
> 
> Physical database architecture is deferred strictly to **Stage 12 (Data Architecture)** and **Stage 16 (Persistence Implementation)**.

---

## 18. Future SDLC Stage Traceability

The domain model defined herein serves as the direct specification input for downstream SDLC stages:

```text
STAGE 06 — DOMAIN MODEL
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
STAGE 07 — CANONICAL WORKFLOW          STAGE 08 — STATE MODEL
(Enforces 15 steps over Content)       (Decouples 5 state dimensions)
       │                                        │
       ├────────────────────────────────────────┘
       ▼
STAGE 09 — RBAC & CAPABILITY MODEL
(Maps Roles & Capabilities to Domain Operations)
       │
       ▼
STAGE 12 — DATA ARCHITECTURE
(Translates Domain Entities into Physical Database / Sheets Schemas)
       │
       ▼
STAGE 13 — API CONTRACTS
(Translates Domain Entities into REST Envelopes & Zod Validation)
       │
       ▼
STAGES 19–26 — IMPLEMENTATION STAGES
(Instantiates Domain Services, Repositories, and Workbenches)
```

---

## 19. Stage 06 Completion Checklist

- [x] Read all five prior canonical artifacts (`01` through `05`).
- [x] Evaluated candidate entity set of 27 entities with precise architectural classifications.
- [x] Defined complete Entity Catalogue with responsibilities, domain owners, and relationships.
- [x] Established `Content` as the canonical Aggregate Root unifying the 15-step pipeline.
- [x] Explicitly separated Required fields, Optional fields, and Immutable fields.
- [x] Documented entity lifecycles with state transitions.
- [x] Formalized external references model respecting Stage 05 boundary rules.
- [x] Codified 10 mandatory Domain Invariants (identity, locked immutability, GAR-02, audit preservation).
- [x] Created Entity Ownership Matrix assigning exactly one domain owner per entity.
- [x] Generated conceptual ASCII Relationship Map.
- [x] Completed Brownfield Mapping categorizing 16 legacy components (`KEEP`, `CONSOLIDATE`, `RENAME`, `RETIRE`).
- [x] Populated Domain Decision Register with 3 unresolved architectural questions.
- [x] Enforced strict Database Boundary Statement (zero SQL/Sheets DDL).
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 06 — DOMAIN MODEL
================================================================================
Artifact:            docs/architecture/06-DOMAIN-MODEL.md
Version:             6.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 06 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 06. Awaiting Stage 07 Instruction.
================================================================================
```
