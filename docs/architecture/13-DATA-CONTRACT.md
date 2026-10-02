# Burra Pariksha CMS
# 13 — Data Model & Data Contract

Stage: 13 — Data Model & Data Contract

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
Defines the authoritative, physical data contracts and Firestore schema definitions for the Burra Pariksha Content Management System (BP-CMS). Translates the Stage 06 Domain Model and Stage 12 Firestore Native Hybrid architecture into strongly typed document schemas across all 28 canonical collections. Establishes deterministic canonical identifier schemes (regex-enforced), universal Base Entity contracts (ISO 8601 UTC timestamps, integer versioning for optimistic concurrency control, soft deletion invariants, and operator ownership), runtime immutability guards for append-only audit and revision collections, an authoritative Source of Truth (SoT) registry, and mandatory Firestore composite indexes.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 13 Data Model & Data Contract | FACT |
| **File Path** | `docs/architecture/13-DATA-CONTRACT.md` | FACT |
| **Document Stage** | Stage 13 — Data Model & Data Contract | FACT |
| **Authority** | Authoritative Architecture Specification & Physical Data Contract | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Verified & Closed)<br>Stage 07 (`07-CANONICAL-15-STEP-WORKFLOW.md` - 100% Verified & Closed)<br>Stage 08 (`08-STATE-MODEL.md` - 100% Verified & Closed)<br>Stage 09 (`09-RBAC-CAPABILITY-MATRIX.md` - 100% Verified & Closed)<br>Stage 10 (`10-FRONTEND-IA.md` - 100% Verified & Closed)<br>Stage 11 (`11-PAGE-ROUTE-CONTRACT.md` - 100% Verified & Closed)<br>Stage 12 (`12-DATABASE-DECISION.md` - 100% Verified & Closed) | FACT |
| **Subsequent Stages** | Stage 14+ (Data Access Layer, Express API Contracts, Firestore Security Rules) | FACT |
| **Baseline Repository Commit** | `089ec11` | FACT |
| **Architectural Scope** | Formally defines physical Firestore collection contracts, Zod schemas, canonical ID formats, and Source of Truth mappings without mutating live database instances | FACT |

### Architectural Deferral Declaration
All physical database migrations, live Firestore rule deployments, backend data access layer repositories, and Express route handler modifications are **EXPLICITLY DEFERRED** to subsequent implementation stages (Stage 14 Data Access Layer & Stage 15 Backend API Contracts). Zero production records or live database instances are mutated in Stage 13.

---

## 02. Canonical Collection Inventory (28 Collections)

All 28 domain entities established in Stage 06 are mapped to top-level Firestore collections in the Firestore Native Hybrid architecture:

| # | Collection Name | Primary Resource | Domain Aggregate | Mutability | Media Stored in Drive |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `users` | `USER` | Identity & Access | Mutable | No |
| 2 | `roles` | `ROLE` | Access Control | Mutable | No |
| 3 | `capabilities` | `CAPABILITY` | Access Control | Mutable | No |
| 4 | `questions` | `QUESTION` | Curriculum Master | Mutable | No |
| 5 | `question_versions` | `QUESTION_VERSION` | Question Revisions | **IMMUTABLE** | No |
| 6 | `question_reviews` | `QUESTION_REVIEW` | QA Quality Gate | Mutable | No |
| 7 | `content` | `CONTENT` | Content Master (Aggregate Root) | Mutable | No |
| 8 | `scripts` | `SCRIPT` | Production Copy | Mutable | No |
| 9 | `script_versions` | `SCRIPT_VERSION` | Script Revisions | **IMMUTABLE** | No |
| 10 | `videos` | `VIDEO` | Studio Production | Mutable | **Yes (AP-007)** |
| 11 | `video_takes` | `VIDEO_TAKE` | Studio Production | Mutable | **Yes (AP-007)** |
| 12 | `video_edits` | `VIDEO_EDIT` | Post-Production QC | Mutable | **Yes (AP-007)** |
| 13 | `media_assets` | `MEDIA_ASSET` | Media Catalog | Mutable | **Yes (AP-007)** |
| 14 | `media_references` | `MEDIA_REFERENCE` | Media Storage Links | Mutable | No |
| 15 | `archive_references` | `ARCHIVE_REFERENCE` | Media Lifecycle | Mutable | **Yes (AP-007)** |
| 16 | `thumbnails` | `THUMBNAIL` | Creative Artwork | Mutable | **Yes (AP-007)** |
| 17 | `social_reviews` | `SOCIAL_REVIEW` | Mobile Framing Gate | Mutable | No |
| 18 | `publishing_packages` | `PUBLISHING_PACKAGE` | Distribution Staging | Mutable | No |
| 19 | `publications` | `PUBLICATION` | Platform Delivery | Mutable | No |
| 20 | `platforms` | `PLATFORM` | Distribution Channels | Mutable | No |
| 21 | `analytics_snapshots` | `ANALYTICS_SNAPSHOT` | Performance Feedback | **IMMUTABLE** | No |
| 22 | `performance_records` | `PERFORMANCE_RECORD` | Editorial Review | Mutable | No |
| 23 | `intelligence_insights` | `INTELLIGENCE_INSIGHT`| Pedagogical Loopback | Mutable | No |
| 24 | `workflow_instances` | `WORKFLOW_INSTANCE` | Process Orchestration | Mutable | No |
| 25 | `workflow_transitions` | `WORKFLOW_TRANSITION` | Transition History | **IMMUTABLE** | No |
| 26 | `notifications` | `NOTIFICATION` | Operations Alerting | Mutable | No |
| 27 | `audit_events` | `AUDIT_EVENT` | Security Ledger (AP-014) | **IMMUTABLE** | No |
| 28 | `configurations` | `CONFIGURATION` | System Administration | Mutable | No |

---

## 03. Deterministic Canonical ID Schemes

To eliminate identifier collisions, ambiguous database keys, and cross-collection misreferences, all document IDs are governed by strict, regex-enforced prefixes:

| Collection | ID Format / Syntax | Regex Pattern | Example Identifier |
| :--- | :--- | :--- | :--- |
| `questions` | `BP-Q-[0-9]{6}` | `^BP-Q-[0-9]{6}$` | `BP-Q-000104` |
| `question_versions` | `BP-QV-[0-9]{6}-V[0-9]{2}` | `^BP-QV-[0-9]{6}-V[0-9]{2}$` | `BP-QV-000104-V02` |
| `question_reviews` | `BP-QR-[0-9]{6}-[0-9]{3}` | `^BP-QR-[0-9]{6}-[0-9]{3}$` | `BP-QR-000104-001` |
| `content` | `BP-CNT-[0-9]{6}` | `^BP-CNT-[0-9]{6}$` | `BP-CNT-000042` |
| `scripts` | `BP-S-[0-9]{6}` | `^BP-S-[0-9]{6}$` | `BP-S-000042` |
| `script_versions` | `BP-SV-[0-9]{6}-V[0-9]{2}` | `^BP-SV-[0-9]{6}-V[0-9]{2}$` | `BP-SV-000042-V01` |
| `videos` | `BP-V-[0-9]{6}` | `^BP-V-[0-9]{6}$` | `BP-V-000018` |
| `video_takes` | `BP-VT-[0-9]{6}-T[0-9]{2}` | `^BP-VT-[0-9]{6}-T[0-9]{2}$` | `BP-VT-000018-T03` |
| `video_edits` | `BP-VE-[0-9]{6}-C[0-9]{2}` | `^BP-VE-[0-9]{6}-C[0-9]{2}$` | `BP-VE-000018-C01` |
| `thumbnails` | `BP-TH-[0-9]{6}` | `^BP-TH-[0-9]{6}$` | `BP-TH-000042` |
| `social_reviews` | `SR-[0-9]{6}` | `^SR-[0-9]{6}$` | `SR-000042` |
| `publishing_packages`| `PKG-[0-9]{6}` | `^PKG-[0-9]{6}$` | `PKG-000042` |
| `publications` | `PUB-[0-9]{6}` | `^PUB-[0-9]{6}$` | `PUB-000099` |
| `platforms` | `PLT-[A-Z0-9_]+` | `^PLT-[A-Z0-9_]+$` | `PLT-YOUTUBE_SHORTS` |
| `users` | `USR-[0-9]{6}` | `^USR-[0-9]{6}$` | `USR-000101` |
| `roles` | `ROLE_[A-Z0-9_]+` | `^ROLE_[A-Z0-9_]+$` | `ROLE_QUESTION_AUTHOR` |
| `capabilities` | `[A-Z0-9_]+:[A-Z0-9_]+` | `^[A-Z0-9_]+:[A-Z0-9_]+$` | `QUESTION:CREATE` |
| `media_assets` | `MED-[0-9]{6}` | `^MED-[0-9]{6}$` | `MED-000501` |
| `media_references` | `MREF-[0-9]{6}` | `^MREF-[0-9]{6}$` | `MREF-000501` |
| `archive_references`| `ARC-[0-9]{6}` | `^ARC-[0-9]{6}$` | `ARC-000012` |
| `workflow_instances`| `WF-[0-9]{6}` | `^WF-[0-9]{6}$` | `WF-000042` |
| `workflow_transitions`| `TRN-[0-9]{8}-[0-9]{4}` | `^TRN-[0-9]{8}-[0-9]{4}$` | `TRN-20261002-0001` |
| `analytics_snapshots`| `SNP-[0-9]{8}-[0-9]{4}` | `^SNP-[0-9]{8}-[0-9]{4}$` | `SNP-20261002-0001` |
| `performance_records`| `PRF-[0-9]{6}` | `^PRF-[0-9]{6}$` | `PRF-000042` |
| `intelligence_insights`| `INS-[0-9]{6}` | `^INS-[0-9]{6}$` | `INS-000015` |
| `notifications` | `NOTIF-[0-9]{6}` | `^NOTIF-[0-9]{6}$` | `NOTIF-000001` |
| `audit_events` | `AUD-[0-9]{8}-[0-9]{4}` | `^AUD-[0-9]{8}-[0-9]{4}$` | `AUD-20261002-0001` |
| `configurations` | `CFG-[A-Z0-9_]+` | `^CFG-[A-Z0-9_]+$` | `CFG-GLOBAL_SETTINGS` |

---

## 04. Standard Base Entity Contract

Every mutable entity document stored in Firestore inherits from `BaseEntityContract`. This structure guarantees strict operational accountability and enables rock-solid Optimistic Concurrency Control (Stage 08):

```typescript
export interface BaseEntityContract {
  id: string;              // Canonical identifier matching CANONICAL_ID_PATTERNS
  createdAt: string;       // ISO 8601 UTC timestamp (e.g. '2026-10-02T10:00:00.000Z')
  createdBy: string;       // User ID 'USR-xxxxxx' who authored the record
  updatedAt: string;       // ISO 8601 UTC timestamp of last state change
  updatedBy: string;       // User ID 'USR-xxxxxx' who last modified the record
  version: number;         // Positive integer incremented on every write for OCC
  isDeleted: boolean;      // Soft deletion flag (hard delete strictly prohibited)
  deletedAt: string | null;// ISO 8601 UTC timestamp when soft-deleted, else null
  deletedBy: string | null;// User ID 'USR-xxxxxx' who soft-deleted the record, else null
}
```

### 4.1 Invariants of the Base Contract
1. **Zero Hard Deletion:** Physical deletion of documents from production Firestore collections is strictly prohibited (`AP-014`). Records are marked `isDeleted: true` with `deletedAt` and `deletedBy` populated.
2. **Optimistic Concurrency Control (OCC):** On every update, the client transmits the known `version`. The server transaction verifies `document.version === request.version` before incrementing `version = version + 1`. If mismatched, the server rejects the request with HTTP 409 Conflict, preventing silent lost updates (`BRK-SF-01`).
3. **UTC Timestamps:** All timestamps are formatted strictly as ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 05. Immutability Enforcements

The following five collections are **APPEND-ONLY & STRICTLY IMMUTABLE**. Updates, revisions, and deletions are permanently blocked at the data access layer:

1. `audit_events`: Tamper-evident record of all system events (`AP-014`).
2. `workflow_transitions`: Complete historical log of all forward and backward workflow steps.
3. `question_versions`: Snapshot copies of questions preserved whenever a revision is created.
4. `script_versions`: Snapshot copies of presenter copy preserved whenever scripts are modified.
5. `analytics_snapshots`: Time-series audience retention metrics retrieved from platform APIs.

Any attempt to execute an `updateDoc` or `deleteDoc` operation against an immutable collection triggers an immediate `[IMMUTABILITY_VIOLATION]` exception.

---

## 06. Source of Truth (SoT) Authority Registry

To resolve conflicting data between Google Sheets, Google Drive, External Platform APIs, and internal CMS state, every critical field is bound to an unambiguous Source of Truth:

| Entity / Field Path | Source of Truth | Authority Description & Governance Note |
| :--- | :---: | :--- |
| `questions.questionTextTelugu` | `CMS_FIRESTORE` | Master pedagogical stem in Telugu authored and approved in CMS. |
| `questions.options` | `CMS_FIRESTORE` | 4 multiple-choice options with exactly 1 correct answer. |
| `questions.aiDraftPayload` | `ASSISTIVE_AI_GEMINI` | AI draft question. Untrusted until human author edits & approves. |
| `scripts.teleprompterCopy` | `CMS_FIRESTORE` | Master presenter script and teleprompter copy stored in CMS. |
| `scripts.aiSuggestedCopy` | `ASSISTIVE_AI_GEMINI` | AI suggested hook copy. Untrusted until human scriptwriter approves. |
| `media_references.driveFileId` | `GOOGLE_DRIVE` | Raw Google Drive file identifier. CMS owns metadata only (`AP-007`). |
| `video_takes.driveFileUri` | `GOOGLE_DRIVE` | Raw studio camera take stored in Google Drive (`AP-008`). |
| `video_edits.renderedCutDriveUri` | `GOOGLE_DRIVE` | Final rendered MP4 cut stored in Google Drive (`AP-008`). |
| `workflow_instances.currentStep` | `CMS_FIRESTORE` | Authoritative 15-step workflow progression tracker (`AP-010`). |
| `workflow_instances.workflowStatus`| `CMS_FIRESTORE` | Decoupled workflow lifecycle state (`AP-002`, `AP-010`). |
| `publications.liveUrl` | `EXTERNAL_PLATFORMS` | Public URL on YouTube or Instagram verified via external API. |
| `publications.publishedStatus` | `EXTERNAL_PLATFORMS` | Live publication status verified via distribution worker. |
| `analytics_snapshots.retentionCurve`| `EXTERNAL_PLATFORMS` | Second-by-second audience retention curve from YouTube Analytics. |
| `audit_events.immutableLedger` | `CMS_FIRESTORE` | Tamper-evident, append-only operational audit trail (`AP-014`). |

---

## 07. Firestore Composite Index Specifications

The following composite indexes are declared to support performant filtering, sorting, and dashboard telemetry without full collection scans:

| Collection | Index Fields (Ordered) | Query / Workbench Purpose |
| :--- | :--- | :--- |
| `questions` | `subject ASC`, `classLevel ASC`, `status ASC`, `createdAt DESC` | Curriculum Library faceted filtering and sorting. |
| `content` | `currentWorkflowStep ASC`, `status ASC`, `updatedAt DESC` | Executive Operations Radar and 15-step pipeline bottlenecks. |
| `videos` | `currentWorkflowStep ASC`, `assignedEditorId ASC`, `createdAt DESC` | Production Bay personal editing queue and filming schedule. |
| `audit_events` | `resourceType ASC`, `resourceId ASC`, `timestamp DESC` | Security Audit Trail chronological inspection. |
| `publications` | `platformId ASC`, `status ASC`, `publishedAt DESC` | Multi-platform publishing dispatch calendar. |
| `analytics_snapshots`| `contentId ASC`, `snapshotTimestamp DESC` | Time-series retention curves and drop-off analysis. |

---

## 08. Primary Collection Schemas

### 8.1 `QuestionDocument` (`questions`)
- Primary aggregate for pedagogical questions:
  - `subject: string` (e.g. `'PHYSICS'`)
  - `classLevel: string` (e.g. `'CLASS_10'`)
  - `chapter: string`
  - `topic: string`
  - `difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD'`
  - `questionTextTelugu: string`
  - `questionTextEnglish?: string`
  - `options: Array<{ optionKey: 'A'|'B'|'C'|'D'; optionTextTelugu: string; isCorrect: boolean }>` (Length 4, exactly 1 correct)
  - `explanationTelugu: string`
  - `pedagogicalDefectCount: number`
  - `status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISED'`
  - `currentWorkflowStep: number` (1 to 15)
  - `authorUserId: string` (`USR-xxxxxx`)
  - `reviewerUserId: string | null` (`USR-xxxxxx`)

### 8.2 `ContentDocument` (`content`)
- Unified manufacturing aggregate root linking question, video, script, and publishing packages:
  - `questionId: string` (`BP-Q-xxxxxx`)
  - `title: string`
  - `classLevel: string`
  - `subject: string`
  - `currentWorkflowStep: number` (1 to 15)
  - `status: 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'ARCHIVED'`
  - `activeScriptId: string | null` (`BP-S-xxxxxx`)
  - `activeVideoId: string | null` (`BP-V-xxxxxx`)
  - `activePublishingPackageId: string | null` (`PKG-xxxxxx`)
  - `assignedOperatorIds: string[]`

### 8.3 `VideoDocument` (`videos`)
- Studio video production project:
  - `contentId: string` (`BP-CNT-xxxxxx`)
  - `scriptId: string` (`BP-S-xxxxxx`)
  - `assignedPresenterId: string` (`USR-xxxxxx`)
  - `assignedEditorId: string` (`USR-xxxxxx`)
  - `currentWorkflowStep: number` (4 to 8)
  - `videoStatus: 'SCHEDULED' | 'FILMING' | 'RAW_LOGGED' | 'EDITING' | 'QC_PENDING' | 'QC_APPROVED' | 'QC_REJECTED'`
  - `rawTakeCount: number`
  - `selectedTakeId: string | null` (`BP-VT-xxxxxx-Txx`)
  - `activeEditId: string | null` (`BP-VE-xxxxxx-Cxx`)
  - `masterCutDriveFileId: string | null` (Google Drive pointer per `AP-007`)
  - `durationSeconds: number | null`

### 8.4 `AuditEventDocument` (`audit_events`)
- Immutable operational audit trail (`AP-014`):
  - `timestamp: string` (ISO 8601 UTC)
  - `actorId: string` (`USR-xxxxxx`)
  - `actorRole: string`
  - `resourceType: string`
  - `resourceId: string`
  - `action: string`
  - `preconditionState: Record<string, unknown> | null`
  - `postconditionState: Record<string, unknown> | null`
  - `ipAddress: string | null`
  - `userAgent: string | null`
  - `correlationId: string` (UUID v4)

---

## 09. Closure Record

### 09.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| 28 Canonical Collections | All 28 domain entities mapped to top-level Firestore collections | VERIFIED |
| Canonical ID Schemes | Deterministic regex patterns verified across all 28 collections | VERIFIED |
| Standard Base Contract | Timestamps, OCC versioning, soft deletion, and ownership enforced | VERIFIED |
| Source of Truth Registry | Unambiguous authority defined for all critical fields | VERIFIED |
| Append-Only Immutability | Runtime guards block updates/deletions on audit & revision collections | VERIFIED |
| Composite Index Specifications | 6 composite indexes declared for querying and pipeline telemetry | VERIFIED |
| Zod Schemas Validation | Zod schemas and TypeScript interfaces validated for primary collections | VERIFIED |
| Automated Test Suite | `npm run test:stage13` passed cleanly (7/7 checks) | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | All tests passed | PASSED |
| GitHub Verification | Baseline & verification passed | PASSED |
| Product Owner Acceptance | Accepted | ACCEPTED |
| Stage Closure | Stage 13 closed | CLOSED |

```
================================================================================
STAGE 13 — DATA MODEL & DATA CONTRACT
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
IMPLEMENTATION: COMPLETE
DATA CONTRACT: src/types/data-contracts.ts (28 COLLECTIONS, ZOD SCHEMAS, SOT REGISTRY)
TEST SUITE: src/tests/stage13-data-contract.test.ts (PASSED 7/7)
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 13 CLOSED: YES
NEXT STAGE: STAGE 14 — NOT STARTED
================================================================================
```

STAGE 13 CLOSED: YES

NEXT STAGE:
STAGE 14 — NOT STARTED
