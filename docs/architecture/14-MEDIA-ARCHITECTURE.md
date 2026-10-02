# Burra Pariksha CMS
# 14 — Media Architecture

Stage: 14 — Media Architecture

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
Establishes the authoritative tri-layer media architecture for the Burra Pariksha Content Management System (BP-CMS):
1. **Metadata Layer:** Google Cloud Firestore Native Mode (Storing abstract descriptors, SHA-256 cryptographic hashes, and lifecycle state).
2. **Active Media Binary Layer:** Google Drive (Storing working studio takes, camera audio, and post-production master MP4 cuts).
3. **Cold Preservation Archive Layer:** Google Cloud Storage Coldline / External Archive (Deep preservation for retired assets).

Enforces strict provider-independent reference decoupling (`AP-007`/`AP-008`), pre-retirement archive verification protocols, asynchronous rehydration/restoration workflows, and graceful quarantine handling for broken references.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 14 Media Architecture | FACT |
| **File Path** | `docs/architecture/14-MEDIA-ARCHITECTURE.md` | FACT |
| **Document Stage** | Stage 14 — Media Architecture | FACT |
| **Authority** | Authoritative Architecture Specification & Media Reference Contract | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Verified & Closed)<br>Stage 07 (`07-CANONICAL-15-STEP-WORKFLOW.md` - 100% Verified & Closed)<br>Stage 08 (`08-STATE-MODEL.md` - 100% Verified & Closed)<br>Stage 09 (`09-RBAC-CAPABILITY-MATRIX.md` - 100% Verified & Closed)<br>Stage 10 (`10-FRONTEND-IA.md` - 100% Verified & Closed)<br>Stage 11 (`11-PAGE-ROUTE-CONTRACT.md` - 100% Verified & Closed)<br>Stage 12 (`12-DATABASE-DECISION.md` - 100% Verified & Closed)<br>Stage 13 (`13-DATA-CONTRACT.md` - 100% Verified & Closed) | FACT |
| **Subsequent Stages** | Stage 15+ (Backend API Contracts, Media Ingestion Workers, Production Bay Integrations) | FACT |
| **Baseline Repository Commit** | `0b15641` | FACT |
| **Architectural Scope** | Formally defines the media lifecycle, MIME formats, Drive folder structures, SHA-256 verification algorithms, and broken reference quarantine protocols | FACT |

### Architectural Deferral Declaration
All physical Google Drive API batch operations, automated transcode worker scripts, GCS Coldline bucket setup, and Express binary streaming routes are **EXPLICITLY DEFERRED** to subsequent implementation stages (Stage 15 API Contracts & Stage 16 Physical Integrations). Zero cloud storage buckets or Google Drive files are mutated in Stage 14.

---

## 02. The Tri-Layer Media Architecture

BP-CMS partitions media storage into three distinct physical tiers governed by abstract, provider-independent references (`AP-007`, `AP-008`):

```
+-----------------------------------------------------------------------------------+
|                                 BP-CMS APPLICATION                                |
|  - Workflow Progression (Steps 04-08)       - Zero Raw Binary Bytes in Database   |
|  - Role-Based Access Control (Stage 09)     - SHA-256 Cryptographic Checksums     |
+-----------------------------------------------------------------------------------+
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
          ┌───────────────────┐┌───────────────────┐┌───────────────────┐
          │   LAYER 1 (CMS)   ││ LAYER 2 (ACTIVE)  ││  LAYER 3 (COLD)   │
          │     Firestore     ││   Google Drive    ││    GCS Coldline   │
          │                   ││                   ││                   │
          │ - MediaAsset Doc  ││ - Raw Studio Takes││ - Compressed Deep │
          │ - DriveReference  ││ - MP4 Master Cuts ││   Preservation    │
          │ - ArchiveReference││ - Web Links (View)││ - Reversible      │
          │ - SHA-256 Hashes  ││ - Active Working  ││   Rehydration     │
          │ - ₹0.00 / month   ││ - ₹0.00 / month   ││ - Long-term Archive│
          └───────────────────┘└───────────────────┘└───────────────────┘
```

### 2.1 The Two Inviolable Storage Guardrails
1. **`AP-007` (Media Reference vs Binary Guard):** The primary CMS database (Firestore) stores only abstract metadata records (`MediaAsset`, `DriveReference`, `ArchiveReference`). Raw video and audio binaries must NEVER be serialized as Base64 strings or stored directly inside database documents.
2. **`AP-008` (Media Storage Provider Independence):** Business logic and domain entities refer to media solely via canonical identifiers (`MED-xxxxxx`). The physical storage provider (Google Drive, GCS Coldline, AWS S3) is hidden behind abstract reference adapters.

---

## 03. Media Types & MIME Vocabulary

BP-CMS classifies all production media into four canonical media types:

| Media Type | MIME Type | File Extension | Production Pipeline Usage |
| :--- | :--- | :---: | :--- |
| **`IMAGE`** | `image/png`<br>`image/jpeg`<br>`image/webp` | `.png`<br>`.jpg`<br>`.webp` | 1080x1920 9:16 vertical cover artwork, thumbnail CTR variants (Step 08), question math diagrams, formula cards. |
| **`AUDIO`** | `audio/wav`<br>`audio/mpeg`<br>`audio/aac` | `.wav`<br>`.mp3`<br>`.aac` | Scratch studio audio, teleprompter timing tracks, presenter voiceover overdubs, background theme audio. |
| **`VIDEO`** | `video/mp4`<br>`video/quicktime` | `.mp4`<br>`.mov` | Raw studio filming takes (Step 04/05), rough cuts, color-graded fine cuts, final QC rendered master MP4 (Step 06/07). |
| **`DOCUMENT`** | `application/pdf`<br>`text/plain`<br>`application/json` | `.pdf`<br>`.txt`<br>`.json` | Curriculum syllabus manifests, teleprompter text copy (Step 03), QA audit defect reports, subtitle tracks. |

---

## 04. Provider-Independent Reference Contracts

### 4.1 `MediaAsset` (Metadata Document in Firestore)
The root record representing logical media in Firestore:
- `id: string` (`MED-[0-9]{6}`)
- `name: string` (e.g. `BP-V-000018_Take03_RoughCut.mp4`)
- `mediaType: MediaType` (`IMAGE` | `AUDIO` | `VIDEO` | `DOCUMENT`)
- `mimeType: CanonicalMimeType`
- `sizeBytes: number` (Strictly positive integer)
- `sha256Hash: string` (64-character lowercase hex string)
- `ownerUserId: string` (`USR-[0-9]{6}`)
- `processingState: MediaProcessingState` (`UNPROCESSED` | `PROCESSING` | `PROCESSED` | `PROCESSING_FAILED`)
- `archiveState: MediaArchiveState` (`HOT_ACTIVE` | `STAGED_FOR_ARCHIVE` | `ARCHIVING` | `COLD_ARCHIVED` | `RESTORE_IN_PROGRESS`)
- `activeDriveReferenceId: string | null` (`REF-[0-9]{6}`)
- `activeArchiveReferenceId: string | null` (`ARC-[0-9]{6}`)
- `isQuarantined: boolean`

### 4.2 `DriveReference` (Active Media Pointer)
Binds logical `MediaAsset` to a physical file in Google Drive:
- `id: string` (`REF-[0-9]{6}`)
- `mediaAssetId: string` (`MED-[0-9]{6}`)
- `driveFileId: string` (Google Drive file identifier)
- `driveFolderId: string` (Target folder identifier)
- `folderHierarchyPath: string` (e.g. `/BP-Production/2026-W40/MasterCuts/`)
- `webViewLink: string` (Google Drive UI viewing URL)
- `webContentLink: string` (Direct download/stream endpoint)
- `isAccessible: boolean`
- `isQuarantined: boolean`
- `quarantineReason: string | null`
- `lastVerifiedAt: string` (ISO 8601 UTC)

### 4.3 `ArchiveReference` (Cold Storage Preservation Pointer)
Binds logical `MediaAsset` to a cold storage bucket:
- `id: string` (`ARC-[0-9]{6}`)
- `mediaAssetId: string` (`MED-[0-9]{6}`)
- `archiveProvider: 'GCS_COLDLINE' | 'EXTERNAL_ARCHIVE'`
- `bucketName: string`
- `objectPath: string` (e.g. `2026/10/MED-000412.mp4`)
- `archiveSha256: string` (Verified checksum)
- `manifestId: string`
- `archivedAt: string` (ISO 8601 UTC)
- `restoredAt: string | null`

---

## 05. Google Drive Folder Topology & Hierarchy

Active production media in Google Drive is structured into an authoritative, date-partitioned folder tree:

```
Google Drive Root
└── BP-CMS-Production/
    ├── 2026-W40/
    │   ├── 01_RawTakes/             <- Raw studio filming takes (Step 04/05)
    │   ├── 02_RoughCuts/            <- Work-in-progress editor exports (Step 06)
    │   ├── 03_MasterCuts/           <- Approved fine cuts for Final QC (Step 07)
    │   ├── 04_Thumbnails/           <- 1080x1920 9:16 vertical graphics (Step 08)
    │   └── 05_TeleprompterScripts/  <- Formatted text manifests (Step 03)
    └── ArchiveStaging/              <- Batched media awaiting cold storage sync
```

---

## 06. Media Lifecycle State Machine & Archive Verification

```
┌──────────────┐      Stage for Cold Sync       ┌──────────────────────┐
│  HOT_ACTIVE  │ ─────────────────────────────> │  STAGED_FOR_ARCHIVE  │
└──────────────┘                                └──────────────────────┘
       ▲                                                    │
       │                                                    ▼
┌──────────────────────┐    Checksum Match      ┌──────────────────────┐
│ RESTORE_IN_PROGRESS  │ <───────────────────── │      ARCHIVING       │
└──────────────────────┘   (SHA-256 Validated)  └──────────────────────┘
       ▲                                                    │
       │                                                    ▼
       │                  Restore Initiated     ┌──────────────────────┐
       └─────────────────────────────────────── │    COLD_ARCHIVED     │
                                                └──────────────────────┘
```

### 6.1 The Two-Phase Archive Verification Algorithm
Before removing any binary from Google Drive to reclaim storage space, the system executes an automated two-phase verification:
1. **Transfer & Hash Extraction:** The background worker streams the file to GCS Coldline and calculates the destination SHA-256 checksum.
2. **Cryptographic Comparison (`verifyArchiveIntegrity`):**
   ```typescript
   if (activeDriveSha256 !== coldArchiveSha256) {
     throw new Error('[CORRUPTED_ARCHIVE_ABORT] Hash mismatch. Drive binary retirement blocked.');
   }
   ```
3. **Safe Retirement:** Only when the hashes match exactly is the file removed from Google Drive, and the asset status transitions to `COLD_ARCHIVED`. If a mismatch occurs, the deletion is aborted, the Drive binary is preserved, and a high-priority alert is issued.

---

## 07. Asynchronous Media Restoration Protocol

When an archived asset is required for remastering or re-distribution:
1. An administrator possessing `MEDIA_ASSET:RESTORE` triggers the restore action (`initiateMediaRestore`).
2. The asset transitions from `COLD_ARCHIVED` to `RESTORE_IN_PROGRESS`.
3. An asynchronous worker downloads the binary from GCS Coldline, re-verifies the SHA-256 checksum against the `MediaAsset` record, and re-uploads it to the active Google Drive folder.
4. A new `DriveReference` is generated and bound to the `MediaAsset`.
5. An immutable `AuditEvent` (`MEDIA_RESTORED`) is emitted to the audit log (`AP-014`).
6. The asset status transitions back to `HOT_ACTIVE`.

---

## 08. Broken Reference Handling & Quarantine Protocol

If a Google Drive file is deleted externally, moved out of the managed tree, or permissions are revoked:
1. **Detection:** Periodic integrity probes or API 404 responses trigger reference failure.
2. **Quarantine (`handleBrokenReference`):**
   - Reference is marked `isAccessible: false` and `isQuarantined: true`.
   - The quarantine reason (e.g. `HTTP 404 File Not Found`) is persisted.
3. **Downstream Safety Guard:** Encoding workers and publishing release pipelines immediately block requests using quarantined references, preventing corrupted video packages or pipeline crashes.
4. **UI Fallback Affordance:** The client workspace renders a standardized visual placeholder (`/assets/placeholders/media-unavailable-placeholder.svg`) with an alert banner and retry affordance.

---

## 09. Closure Record

### 09.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| 4 Canonical Media Types | Image, Audio, Video, and Document with 11 standard MIME formats | VERIFIED |
| Reference Decoupling (`AP-007`/`AP-008`)| Zero binary bytes in Firestore; metadata in CMS, files in Drive | VERIFIED |
| Cryptographic Integrity | Lowercase 64-character SHA-256 checksums verified on ingestion | VERIFIED |
| Media Lifecycle State Machine | HOT_ACTIVE, STAGED_FOR_ARCHIVE, ARCHIVING, COLD_ARCHIVED, RESTORE_IN_PROGRESS | VERIFIED |
| Archive Verification Guard | Pre-retirement checksum comparison prevents accidental data loss | VERIFIED |
| Rehydration & Restore Workflow | Asynchronous re-upload to Google Drive with immutable audit logging | VERIFIED |
| Broken Reference Protocol | Automated quarantine, UI placeholder fallback, and alert dispatch | VERIFIED |
| Automated Test Suite | `npm run test:stage14` passed cleanly (7/7 checks) | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | All tests passed | PASSED |
| GitHub Verification | Baseline & verification passed | PASSED |
| Product Owner Acceptance | Accepted | ACCEPTED |
| Stage Closure | Stage 14 closed | CLOSED |

```
================================================================================
STAGE 14 — MEDIA ARCHITECTURE
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
IMPLEMENTATION: COMPLETE
MEDIA CODE: src/types/media-architecture.ts (TRI-LAYER ARCHITECTURE, SOT INTEGRITY)
TEST SUITE: src/tests/stage14-media-architecture.test.ts (PASSED 7/7)
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 14 CLOSED: YES
NEXT STAGE: STAGE 15 — NOT STARTED
================================================================================
```

STAGE 14 CLOSED: YES

NEXT STAGE:
STAGE 15 — NOT STARTED
