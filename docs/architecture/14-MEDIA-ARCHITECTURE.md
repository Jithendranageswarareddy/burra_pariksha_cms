# 14 — MEDIA ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 14 of 30-Stage Modernization Program — Authoritative Media Architecture, Storage Isolation & Binary Governance

```
================================================================================
Document ID:       BP-ARCH-14-MEDIA
Version:           14.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Tri-Layer Media Architecture, Binary Isolation, Active Storage,
                   Archival Lifecycle, Integrity Verification & Provider Independence
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-007, AP-008)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md
                   13-DATA-MODEL-DATA-CONTRACT.md
Downstream Stages: 16-PERSISTENCE-IMPLEMENTATION.md
                   17-MEDIA-STORAGE-IMPLEMENTATION.md
                   19-22 PRODUCTION, QC & PACKAGING WORKFLOWS
                   23-PUBLISHING-SYSTEM.md
                   27-NOTIFICATIONS-AUDIT.md
                   28-E2E-INTEGRATION-TESTING.md
                   29-SECURITY-PERFORMANCE-CONCURRENCY.md
                   30-FINAL-SYSTEM-AUDIT.md
Metadata Store:    Cloud Firestore Native Mode (System of Record)
Active Storage:    Google Drive (Hot Working Production Binaries)
Cold Archive:      Google Cloud Storage / External Coldline Archive
Budget Constraint: Hard Initial Infrastructure Ceiling: ₹0–₹100 (Zero-Cost Invariant)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Media Architecture, Storage Isolation, and Binary Lifecycle Contract** for the Burra Pariksha Content Management System (BP-CMS). Grounded in Architecture Principle **AP-007** (*Media binaries remain strictly external to the transactional database*) and **AP-008** (*Media references belong to the application data model*), this specification governs the creation, ingestion, validation, streaming, integrity auditing, archival, restoration, and quarantine of all digital media assets across the 15-step studio production pipeline.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *conceptual and logical media architecture*. It does **not** assert that runtime media handlers, Google Drive folders, GCS buckets, or streaming proxies have been deployed or altered.
2. **Zero Runtime Code Modification:** No application source code, Express upload routes, busboy handlers, or Google Drive service methods are modified in Stage 14.
3. **Zero Media Data Manipulation:** No real media files in Google Drive or GCS are uploaded, moved, deleted, renamed, or restored.
4. **No Premature Dependency Installation:** No external media parsing libraries, FFmpeg wrappers, or cloud storage SDKs are installed during this stage.
5. **Contractual Boundary:** Stage 14 establishes the binding architectural contract that **Stage 17 (Media Storage Implementation)** will physically implement.

---

## 2. Canonical Tri-Layer Media Architecture

BP-CMS segregates digital media into three decoupled, orthogonal layers:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CANONICAL TRI-LAYER ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                        BP-CMS                                          │
│                                           │                                            │
│                      ┌────────────────────┴────────────────────┐                       │
│                      ▼                                         ▼                       │
│              MEDIA METADATA LAYER                     WORKFLOW & DOMAIN                │
│         Cloud Firestore (Native Mode)                 BUSINESS AGGREGATES              │
│        ├── media_assets (`MED-######`)                ├── questions                    │
│        ├── media_references (`MREF-######`)           ├── content (`BP-CNT-######`)    │
│        └── archive_references (`ARC-######`)          ├── videos                       │
│                      │                                └── publishing_packages          │
│                      │ (Abstract Locators)                                             │
│         ┌────────────┴────────────┐                                                    │
│         ▼                         ▼                                                    │
│  ACTIVE STORAGE LAYER      COLD ARCHIVE LAYER                                          │
│     Google Drive             GCS Archive                                               │
│   (Hot Working Files)     (Preservation / Deep)                                        │
│  ├── Raw Video Takes      ├── Master MP4 Vault                                         │
│  ├── Master Cuts (MP4)    ├── B-Roll & Camera Tapes                                    │
│  ├── High-Res Thumbnails  └── Release Manifests                                        │
│  └── Teleprompter Tracks                                                               │
│         │                         │                                                    │
│         └────────────┬────────────┘                                                    │
│                      ▼                                                                 │
│             INTEGRITY & RECOVERY                                                       │
│         ├── SHA-256 Cryptographic Audit                                                │
│         ├── Broken Reference Quarantine Protocol                                       │
│         └── Idempotent Rehydration Pipeline                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 The Four Decoupled Realities
1. **Metadata Ownership (BP-CMS / Firestore):** Cloud Firestore authoritatively owns all metadata records (`MediaAsset`, `MediaReference`, `ArchiveReference`). Metadata includes business identifiers, MIME types, byte sizes, durations, loudness metrics, and SHA-256 hashes.
2. **Active Binary Custody (Google Drive):** Google Drive provides active, working storage for studio editors, presenters, and reviewers during Steps 04 through 11. Google Drive is a *storage custodian*, not a business state owner.
3. **Archive Binary Custody (GCS / External Cold Storage):** High-durability, cost-optimized object storage retains completed masters, raw camera rolls, and project archives post-publication (Steps 12 through 15).
4. **Provider-Independent References:** Business entities (`VideoEdit`, `Thumbnail`) reference abstract `MediaReference` identifiers (`MREF-######`), never vendor-locked URLs or vendor-specific file IDs.

---

## 3. Canonical Media Types & Format Governance

BP-CMS classifies all production files into **four canonical media types**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CANONICAL MEDIA TYPE MATRIX                             │
├──────────┬────────────────────────┬──────────────────────┬─────────────┬───────────────┤
│ Media    │ Business Purpose       │ Allowed MIME Types   │ Size Limits │ Content       │
│ Type     │ & Production Stage     │ & Standard Exts      │ (Hard Max)  │ Signatures    │
├──────────┼────────────────────────┼──────────────────────┼─────────────┼───────────────┤
│ IMAGE    │ Thumbnails (08),       │ `image/png` (.png)   │ 10 MiB      │ PNG: 89 50 4E │
│          │ Safe-Zone Overlays (09)│ `image/jpeg` (.jpg)  │ (Target)    │ JPEG: FF D8 FF│
│          │ Formulas, Diagrams (01)│ `image/webp` (.webp) │ [5 MB Brown]│ WebP: 52 49 46│
├──────────┼────────────────────────┼──────────────────────┼─────────────┼───────────────┤
│ AUDIO    │ Voiceovers, Scratch(04)│ `audio/wav` (.wav)   │ 50 MiB      │ WAV: 52 49 46 │
│          │ Teleprompter Track(03) │ `audio/mpeg` (.mp3)  │             │ MP3: 49 44 33 │
│          │ Presenter Audio (05)   │ `audio/aac` (.aac)   │             │ AAC: FF F1/F9 │
├──────────┼────────────────────────┼──────────────────────┼─────────────┼───────────────┤
│ VIDEO    │ Studio Raw Takes (05), │ `video/mp4` (.mp4)   │ 500 MiB     │ MP4: 00 00 00 │
│          │ Editing Cuts (06),     │ `video/quicktime`    │ (Target)    │ QuickTime:    │
│          │ Master MP4 Cuts (07)   │ (.mov)               │[100MB Brown]│ 66 74 79 70   │
├──────────┼────────────────────────┼──────────────────────┼─────────────┼───────────────┤
│ DOCUMENT │ Question Proofs (02),  │ `application/pdf`    │ 25 MiB      │ PDF: 25 50 44 │
│          │ Scripts (03),          │ `text/plain` (.txt)  │             │ JSON: 7B / 5B │
│          │ Release Manifests (10) │ `application/json`   │             │ UTF-8 text    │
└──────────┴────────────────────────┴──────────────────────┴─────────────┴───────────────┘
```

### 3.1 Format Rules by Type
- **IMAGE:** Vertical 9:16 aspect ratio ($1080 \times 1920\text{ px}$) mandatory for Thumbnails. Alpha channel transparency permitted only for overlays and graphic bug inserts (`image/png`).
- **AUDIO:** 48 kHz, 24-bit PCM WAV preferred for studio voice recording; high-bitrate AAC (256 kbps) accepted for teleprompter reference tracks.
- **VIDEO:** Final master cuts (Stage 07 Final QC) **strictly require `video/mp4`** with H.264 video codec and AAC-LC stereo audio. Frame rate must be exactly 30 fps or 60 fps progressive; pixel dimensions must be $1080 \times 1920$ (vertical 9:16). QuickTime ProRes (.mov) is permitted exclusively for intermediate editing cuts in Stage 06.
- **DOCUMENT:** Academic reference source proofs must be standard PDF/A or UTF-8 plain text.

---

## 4. Authoritative MediaAsset Contract

The `MediaAsset` document in Firestore (`/media_assets/{id}`) represents the canonical business identity of a digital file:

```typescript
export interface MediaAssetContract {
  // Identity & Canonical Categorization
  id: string;                       // Regex: ^MED-[0-9]{6}$ (BP-CMS Primary Key)
  contentId: string;                // Regex: ^BP-CNT-[0-9]{6}$ (Associated Content Aggregate)
  mediaType: MediaType;             // 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'
  mimeType: CanonicalMimeType;       // Verified server-detected MIME type
  originalFileName: string;         // Name submitted by studio client
  normalizedFileName: string;       // BP-CMS canonical file naming convention

  // Physical Attributes & Cryptographic Fingerprint
  byteSize: number;                 // Verified byte length (> 0)
  sha256Checksum: string;           // 64-character lowercase hex SHA-256 hash (Immutable)
  durationSeconds: number | null;   // Temporal duration for Audio/Video (seconds)
  resolutionWidth: number | null;   // Pixel width (e.g. 1080)
  resolutionHeight: number | null;  // Pixel height (e.g. 1920)
  audioLoudnessLufs: number | null; // Integrated loudness in LUFS (-14.0 LUFS target)

  // Storage Locators (Abstract Provider Independence)
  storageProvider: StorageProvider; // 'GOOGLE_DRIVE' | 'GCS_COLDLINE' | 'EXTERNAL_ARCHIVE'
  activeReferenceId: string | null; // Pointer to active MediaReference (^MREF-[0-9]{6}$)
  archiveReferenceId: string | null;// Pointer to cold ArchiveReference (^ARC-[0-9]{6}$)

  // Multi-Dimensional State Governance (Stage 08 Alignment)
  lifecycleState: MediaLifecycleState; // REGISTERED, AVAILABLE, VALID, INVALID, etc.
  processingState: MediaProcessingState;// UNPROCESSED, PROCESSING, PROCESSED, FAILED
  archiveState: MediaArchiveState;     // HOT_ACTIVE, ARCHIVING, COLD_ARCHIVED, RESTORING

  // Safety & Quarantine
  isQuarantined: boolean;           // True if binary is inaccessible or hash corrupt
  quarantineReason: string | null;  // Diagnostic reason for quarantine

  // Base Entity Metadata & OCC
  version: number;                  // Concurrency token (OCC)
  isDeleted: boolean;               // Soft-delete flag
  deletedAt: string | null;         // ISO 8601 UTC
  deletedBy: string | null;         // User ID USR-xxxxxx
  createdAt: string;                // ISO 8601 UTC
  createdBy: string;                // User ID USR-xxxxxx
  updatedAt: string;                // ISO 8601 UTC
  updatedBy: string;                // User ID USR-xxxxxx
}
```

### 4.1 Normalized File Naming Convention
To eliminate collision risks and sanitize filenames across POSIX and cloud filesystems, all binaries are renamed upon ingestion according to the **Deterministic File Naming Rule**:
$$\texttt{BP\_[CONTENT\_ID]\_[STAGE]\_[VERSION]\_[TIMESTAMP]\.[EXT]}$$
*Example:* `BP_CNT_000142_RAW_TAKE01_20261004T014500Z.mp4`

---

## 5. Provider-Independent Media Reference Model

To insulate BP-CMS from vendor lock-in (AP-008), domain entities never store Google Drive file IDs or S3 ARNs directly. Instead, they reference an abstract `MediaReference`:

```typescript
export interface MediaReferenceContract {
  id: string;                       // Regex: ^MREF-[0-9]{6}$
  mediaAssetId: string;             // Regex: ^MED-[0-9]{6}$
  provider: 'GOOGLE_DRIVE' | 'GCS' | 'AWS_S3' | 'LOCAL_FS';
  externalObjectId: string;         // Vendor-specific object ID (e.g. Drive File ID)
  containerIdentifier: string;      // Vendor bucket or folder identifier
  hierarchyPath: string;            // Human-readable logical path in storage
  accessUri: string;                // Canonical internal streaming proxy URI
  directContentLink: string | null; // Temporary signed URL or restricted content link
  isAccessible: boolean;            // Liveness check status
  isQuarantined: boolean;           // Active quarantine isolation flag
  quarantineReason: string | null;  // Defect explanation
  lastVerifiedAt: string;           // ISO 8601 UTC of last successful liveness ping
  createdAt: string;                // ISO 8601 UTC
  updatedAt: string;                // ISO 8601 UTC
}
```

If Google Drive is migrated to Google Cloud Storage or Cloudflare R2, only the `MediaReference` adapter changes. Business records (`Content`, `VideoEdit`, `PublishingPackage`) remain 100% untouched.

---

## 6. Google Drive as Active Media Storage

Google Drive serves as the **Hot Working Storage** environment for human production teams.

### 6.1 Deterministic Folder Hierarchy
Drive storage is structured deterministically under a root folder (`GOOGLE_DRIVE_ROOT_FOLDER_ID`):

```text
Google Drive Root: "Burra Pariksha Production Master"
└── BP-Production
    └── Content Items
        └── BP-CNT-000142/
            ├── 01_raw_takes/       (Raw camera footage, presenter takes)
            ├── 02_edits/           (Intermediate cuts, project XMLs)
            ├── 03_master/          (Final verified 1080x1920 MP4 cuts)
            ├── 04_thumbnails/      (Vertical 9:16 thumbnail variants A/B)
            └── 05_documents/       (Verified syllabus proof, teleprompter text)
```

### 6.2 Service Account & Authentication Boundary
1. **Zero Browser Exposure:** Google Drive service account credentials (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) or OAuth refresh tokens (`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`) reside strictly on the Cloud Run backend.
2. **Server-Mediated Streaming:** The frontend video player and teleprompter never connect directly to Google Drive. The BP-CMS server exposes authenticated streaming endpoints (`/api/media/stream/:refId`) supporting HTTP Range requests (`bytes=0-1048576`) to enable smooth scrub bar playback.
3. **No Public URLs:** Files in Google Drive are stored with restricted permissions. Public link sharing (`Anyone with the link can view`) is strictly prohibited.

---

## 7. External Cold Archive Architecture

When a Content item completes Stage 11 (Published) and Stage 12 (Platform Sync), high-resolution raw camera takes and intermediate project cuts become candidates for cold preservation:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL ARCHIVE LIFECYCLE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ACTIVE MEDIA] ──(Archive Request)──► [ARCHIVE_REQUESTED]                             │
│  (Google Drive)                                │                                       │
│                                                ▼ (Worker Job)                          │
│                                         [ARCHIVING]                                    │
│                                                │ (Copy & SHA-256 Checksum)             │
│                                                ▼                                       │
│                                         [ARCHIVED]                                     │
│                                                │                                       │
│                                                ▼ (Cryptographic Audit)                 │
│                                         [ARCHIVE_VERIFIED]                             │
│                                                │                                       │
│                                                ├──► (Safe Drive Binary Retirement)     │
│                                                │                                       │
│  [COLD STORAGE] ◄──────────────────────────────┘                                       │
│  (GCS Coldline / Deep Archive)                                                         │
│        │                                                                               │
│        ├──(Restore Request)──► [RESTORE_REQUESTED]                                     │
│                                      │                                                 │
│                                      ▼ (Rehydration Job)                               │
│                                 [RESTORING]                                            │
│                                      │ (Checksum Audit)                                │
│                                      ▼                                                 │
│                                 [RESTORED] ──► [AVAILABLE IN ACTIVE DRIVE]             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Authoritative Archive Reference Contract (`ArchiveReference`)
```typescript
export interface ArchiveReferenceContract {
  id: string;                       // Regex: ^ARC-[0-9]{6}$
  mediaAssetId: string;             // Regex: ^MED-[0-9]{6}$
  archiveProvider: 'GCS_COLDLINE' | 'EXTERNAL_DEEP_ARCHIVE';
  bucketName: string;               // e.g. 'bp-cms-cold-preservation'
  objectKey: string;                // e.g. 'archives/2026/CNT-000142/MED-000892.mp4'
  manifestId: string;               // Release manifest identifier
  archiveSha256: string;            // SHA-256 hash verified inside the archive bucket
  archiveByteSize: number;          // Byte size inside the archive bucket
  archivedAt: string;               // ISO 8601 UTC
  verifiedAt: string;               // ISO 8601 UTC
  restoredAt: string | null;        // ISO 8601 UTC
}
```

---

## 8. Cryptographic Hash & Content Integrity Contract

Cryptographic hashes are the **sole authoritative proof** of binary identity and integrity in BP-CMS.

### 8.1 Hash Rules
1. **Algorithm:** Lowercase 64-character hexadecimal **SHA-256** (`^[a-f0-9]{64}$`). Brownfield MD5 checksums are formally deprecated.
2. **Calculation Authority:** Calculated **server-side** during binary stream ingestion prior to committing the file to storage.
3. **Immutability Invariant:** Once written to `media_assets.sha256Checksum`, the hash is **strictly immutable**.
4. **Archive Handshake:** An active binary in Google Drive cannot be retired or deleted until:
   $$\text{Active SHA-256} == \text{Archive SHA-256} \quad \text{AND} \quad \text{Active ByteSize} == \text{Archive ByteSize}$$
5. **No Silent Replacements:** If an editor uploads a revised cut for an existing video, the server generates a **new MediaAsset** (`MED-######`) with its own unique SHA-256. It **never** silently mutates or overwrites the binary under an existing asset ID.

---

## 9. MIME, Size & File Validation Pipeline

All uploaded binaries must traverse a mandatory 5-stage validation pipeline on the server before storage:

```text
Client Upload Stream
        │
        ▼
[Stage 1: Filename Sanitization] ──► Reject path traversal ('..', '/', '\')
        │
        ▼
[Stage 2: Magic Number Inspection]──► Verify true file signature (Reject spoofed extensions)
        │
        ▼
[Stage 3: Streamed Size Limiting] ──► Abort stream if byte count exceeds max threshold
        │
        ▼
[Stage 4: SHA-256 Hash Digest]    ──► Compute incremental hash over raw incoming bytes
        │
        ▼
[Stage 5: Format Verification]   ──► Validate 9:16 aspect ratio (Image) or -14 LUFS (Audio)
        │
        ▼
Commit to Google Drive & Create Firestore Metadata
```

Client-provided MIME headers (`Content-Type: video/mp4`) are treated as untrusted hints. The server inspects the binary magic numbers (e.g. `ftypmp42` at offset 4 for MP4) before granting validity.

---

## 10. Media Ownership & Authorization Matrix

In compliance with Stage 09 (RBAC Capability Model), media actions are governed by fine-grained capabilities:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MEDIA CAPABILITY AUTHORIZATION MATRIX                     │
├────────────────────┬─────────────────────────────┬─────────────────────────────────────┤
│ Capability Token   │ Allowed Organizational Role │ Permitted Action                    │
├────────────────────┼─────────────────────────────┼─────────────────────────────────────┤
│ `MEDIA:INGEST`     │ `PRESENTER`, `VIDEO_EDITOR` │ Stream new take or cut to Drive     │
│ `MEDIA:VERIFY`     │ `CONTENT_LEAD`, `FACULTY`   │ Approve safe-zone or QC compliance  │
│ `MEDIA:ATTACH`     │ `CONTENT_LEAD`, `EDITOR`    │ Link MediaReference to Video/Content│
│ `MEDIA:QUARANTINE` │ `ADMIN`, `CONTENT_LEAD`     │ Manually isolate broken/failed asset│
│ `MEDIA:ARCHIVE`    │ `CONTENT_LEAD`, `PUBLISHER` │ Dispatch active asset to cold GCS   │
│ `MEDIA:RESTORE`    │ `CONTENT_LEAD`, `ADMIN`     │ Rehydrate archived file to Drive    │
│ `MEDIA:RETIRE`     │ `ADMIN` (Sole Authority)    │ Soft-delete or purge media metadata │
└────────────────────┴─────────────────────────────┴─────────────────────────────────────┘
```

---

## 11. Canonical Media Lifecycle State Machine

The Media lifecycle is strictly decoupled from the Content workflow stage and worker job state:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MEDIA LIFECYCLE STATES                                 │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ State                   │ Semantic Operational Meaning                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1. `REGISTERED`         │ Metadata intent initialized in CMS; stream pending.         │
│ 2. `INGESTING`          │ Binary stream currently uploading to active Drive storage.   │
│ 3. `AVAILABLE`          │ File confirmed present in Drive; awaiting inspection.        │
│ 4. `VALIDATING`         │ Server inspecting magic bytes, aspect ratio, loudness.       │
│ 5. `VALID`              │ Passed all technical and quality checks; ready for editing.  │
│ 6. `INVALID`            │ Failed validation (e.g. wrong aspect ratio, corrupt header). │
│ 7. `STORAGE_UNAVAILABLE`│ Drive API reported temporary outage; retry scheduled.        │
│ 8. `DEPRECATED`         │ Superseded by newer take or cut; retained for reference.     │
│ 9. `ARCHIVE_REQUESTED`  │ Queued for transfer to cold GCS archive.                     │
│ 10. `ARCHIVING`         │ Background worker transferring binary to preservation tier.  │
│ 11. `ARCHIVED`          │ Binary confirmed in cold storage; Drive copy can retire.     │
│ 12. `RESTORE_REQUESTED` │ Team requested active rehydration to Google Drive.           │
│ 13. `RESTORING`         │ Background worker pulling binary from GCS back to Drive.     │
│ 14. `RESTORED`          │ Binary back in Drive; checksum re-verified.                  │
│ 15. `ARCHIVE_FAILED`    │ Transfer to cold storage failed; active binary preserved.    │
│ 16. `PURGED`            │ Legal retention expired; binary permanently eradicated.      │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

### 11.1 State Transition Preconditions
| Current State | Trigger Action | Required Preconditions | Next State | Failure State |
| :--- | :--- | :--- | :--- | :--- |
| `REGISTERED` | Stream Starts | User has `MEDIA:INGEST` | `INGESTING` | `INVALID` |
| `INGESTING` | Upload Complete | Drive returns File ID | `AVAILABLE` | `STORAGE_UNAVAILABLE`|
| `AVAILABLE` | Start QC | System begins inspection | `VALIDATING` | `INVALID` |
| `VALIDATING` | Passes Checks | Valid magic bytes, ratio | `VALID` | `INVALID` |
| `VALID` | Cold Migration | Stage 12 Sync complete | `ARCHIVE_REQUESTED` | `VALID` |
| `ARCHIVING` | Hash Verified | GCS hash == Active hash | `ARCHIVED` | `ARCHIVE_FAILED` |
| `ARCHIVED` | Request Restore| User has `MEDIA:RESTORE` | `RESTORE_REQUESTED` | `ARCHIVED` |
| `RESTORING` | Drive Restored | Active hash == GCS hash | `RESTORED` | `STORAGE_UNAVAILABLE`|

---

## 12. Archive Verification Contract

An archive transfer is **never** considered complete upon HTTP 200 response alone. It must satisfy the **Two-Phase Handshake**:

```text
Phase 1: Binary Replication
  Worker copies byte stream from Google Drive to GCS Coldline bucket.

Phase 2: Cryptographic Audit Handshake
  1. GCS returns MD5 and computed SHA-256 header.
  2. Worker fetches byte size and validates: GCS_Bytes == MediaAsset.byteSize.
  3. Worker computes SHA-256 of archived object and verifies: GCS_SHA256 == MediaAsset.sha256Checksum.
  4. On match: Create `archive_references` record; transition `archiveState = COLD_ARCHIVED`.
  5. On mismatch: Throw `CORRUPTED_ARCHIVE_ABORT`; emit `AuditEvent`; leave active Drive file intact.
```

---

## 13. Restore Process & Rehydration Contract

Restoring an archived media file to active production:
1. **Authorization Check:** Actor must hold `MEDIA:RESTORE` capability.
2. **Idempotency Invariant:** If `archiveState` is already `RESTORE_IN_PROGRESS`, duplicate requests return the existing job ID rather than spawning parallel downloads.
3. **Target Destination Resolution:** The system re-creates the canonical folder hierarchy in Google Drive (`/BP-Production/...`) if it was archived.
4. **Post-Restore Integrity Audit:** After copying binary from GCS back to Google Drive, the server streams the restored Drive file, re-calculates SHA-256, and confirms parity with `MediaAsset.sha256Checksum`. Only upon successful verification is `MediaReference.isAccessible` set to `true`.

---

## 14. Broken Reference Handling & Quarantine Protocol

When a Google Drive file is deleted by a human out-of-band or an external API returns HTTP 404 / 403:
1. **Metadata Preservation Invariant:** A broken external reference **never deletes the Firestore `MediaAsset` record**. The metadata is preserved for forensic recovery.
2. **Quarantine Isolation:** The `MediaReference` is immediately marked:
   - `isAccessible = false`
   - `isQuarantined = true`
   - `quarantineReason = "HTTP 404: External Drive file missing or permissions revoked"`
3. **Safe UI Fallback:** Studio workspaces referencing the quarantined asset display a clean, informative SVG fallback placeholder (`/assets/placeholders/media-unavailable-placeholder.svg`) rather than throwing fatal runtime React crashes.
4. **High-Priority Alert:** Emits an operational `AuditEvent` and creates an alert `Notification` for `ROLE_ADMIN` and `ROLE_CONTENT_LEAD`.

---

## 15. Media Versioning Architecture

To eliminate the silent overwrite defect present in unversioned cloud storage architectures:
1. **Binaries are Immutable:** Once verified, a binary file is never altered in place.
2. **Re-shoots and Re-edits Create New Assets:** If Presenter takes a second shot (Take 2), the system creates a brand-new `MediaAsset` (`MED-000412`) and links it to `video_takes`.
3. **Active Pointer Selection:** Aggregate roots (`Video`, `PublishingPackage`) maintain pointer references to the active asset (`selectedTakeMediaAssetId`, `masterCutMediaAssetId`). Switching to an earlier take simply swaps the pointer in the aggregate root; no binary files are deleted.
4. **OCC Versioning:** The `version` counter on `MediaAsset` tracks metadata updates (e.g. tag changes, description edits), strictly separate from the physical binary contents.

---

## 16. Entity-to-Media Relationship Model

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY-TO-MEDIA RELATIONSHIP MAP                          │
├─────────────────────┬──────────────┬───────────────┬───────────────────────────────────┤
│ Domain Entity       │ Media Type   │ Cardinality   │ Semantic Association              │
├─────────────────────┼──────────────┼───────────────┼───────────────────────────────────┤
│ `Question`          │ `DOCUMENT`   │ 0 : N         │ Academic proof source PDF / LaTeX │
│ `Question`          │ `IMAGE`      │ 0 : N         │ Formula diagrams, syllabus maps   │
│ `Script`            │ `AUDIO`      │ 0 : 1         │ Voiceover cadence reference track │
│ `VideoTake`         │ `VIDEO`      │ 1 : 1         │ Raw studio camera take MP4        │
│ `VideoEdit`         │ `VIDEO`      │ 1 : 1         │ Master cut MP4 with audio stamp   │
│ `Thumbnail`         │ `IMAGE`      │ 1 : 2         │ Vertical 9:16 cover variants (A/B)│
│ `PublishingPackage` │ `VIDEO`      │ 1 : 1         │ Released broadcast master MP4     │
│ `PublishingPackage` │ `IMAGE`      │ 1 : 1         │ Selected release thumbnail        │
│ `Publication`       │ `DOCUMENT`   │ 0 : 1         │ Release broadcast audit manifest  │
└─────────────────────┴──────────────┴───────────────┴───────────────────────────────────┘
```

---

## 17. Media Security & Access Control

1. **Least Privilege Service Account:** Google Drive service account is granted access strictly to the dedicated root folder (`GOOGLE_DRIVE_ROOT_FOLDER_ID`), preventing exposure of personal or enterprise drive spaces.
2. **Server-Side Token Gating:** Media streaming routes verify the user's active session cookie and RBAC capabilities before streaming audio/video bytes.
3. **No Direct Drive Downloads for End Users:** Web clients receive chunked data streams via Node.js passthrough pipes. Raw Google Drive download links containing sensitive OAuth tokens are never passed to the DOM.
4. **Rate Limiting & Bandwidth Defense:** Video streaming routes implement rate-limiting middleware to guard against denial-of-service bandwidth attacks.

---

## 18. Authoritative Media Source-of-Truth Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MEDIA SOURCE-OF-TRUTH MATRIX                              │
├──────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ Attribute / Property │ Primary Source of Truth       │ Verification Authority          │
├──────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ `mediaAssetId`       │ Cloud Firestore               │ BP-CMS Server Sequence Counter  │
│ `mediaType`          │ Cloud Firestore               │ Ingestion Pipeline              │
│ `originalFileName`   │ Cloud Firestore               │ Ingestion Request Metadata      │
│ `mimeType`           │ Media Inspector (Magic Bytes) │ Server-Side File Sniffer        │
│ `byteSize`           │ Google Drive / Storage API    │ Server Stream Byte Counter      │
│ `sha256Checksum`     │ Server Crypto Engine          │ Server-Side SHA-256 Digest      │
│ `audioLoudnessLufs`  │ FFmpeg / Audio Analyzer       │ Post-Production QC Gate         │
│ `durationSeconds`    │ Media Header Parser           │ Server-Side Header Extractor    │
│ `driveFileId`        │ Google Drive API              │ Active Storage Custodian        │
│ `gcsObjectKey`       │ Google Cloud Storage API      │ Cold Preservation Custodian     │
│ `lifecycleState`     │ Cloud Firestore               │ BP-CMS State Machine Engine     │
│ `archiveState`       │ Cloud Firestore               │ Archival Orchestration Worker   │
│ `isQuarantined`      │ Cloud Firestore               │ Liveness & Integrity Guard      │
└──────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 19. Media Failure Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MEDIA FAILURE MATRIX                                  │
├─────┬──────────────────────┬──────────────────────┬───────────────────┬────────────────┤
│ ID  │ Failure Scenario     │ Detection Mechanism  │ System State      │ Recovery Path  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F01 │ Upload Stream Timeout│ Socket hangup / 30s  │ `INGESTING` ->    │ Client auto-   │
│     │                      │ inactivity           │ `REGISTERED`      │ retry with OCC │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F02 │ Spoofed MIME Type    │ Magic byte mismatch  │ `INVALID`         │ Reject upload; │
│     │ (e.g. .exe as .mp4)  │ (Magic sniffer)      │ (Quarantined)     │ log security ev│
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F03 │ Oversized Binary     │ Byte counter exceeds │ `INVALID`         │ Stream aborted;│
│     │                      │ 500 MB limit         │                   │ HTTP 413 error │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F04 │ SHA-256 Mismatch on  │ Checksum != metadata │ `INVALID`         │ Re-stream byte │
│     │ Ingestion            │                      │                   │ payload        │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F05 │ Google Drive Outage  │ Drive API HTTP 500   │ `STORAGE_         │ Exponential    │
│     │ (Transient 5xx)      │ or 503               │ UNAVAILABLE`      │ backoff retry  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F06 │ Quota Exhaustion     │ Drive API HTTP 429   │ `STORAGE_         │ Queue worker;  │
│     │                      │                      │ UNAVAILABLE`      │ throttle reqs  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F07 │ Drive Permissions    │ Drive API HTTP 403   │ `INVALID`         │ Admin reauth;  │
│     │ Revoked              │                      │ (Quarantined)     │ notify lead    │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F08 │ Out-of-band File Del │ Liveness probe 404   │ `STORAGE_UNAVAIL` │ Quarantine;    │
│     │ by human in Drive UI │                      │ (Quarantined)     │ restore from GCS│
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F09 │ Cold Archive Hash Mis│ GCS hash != Drive hash│ `ARCHIVE_FAILED` │ Abort delete;  │
│     │                      │                      │                   │ re-run archive │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F10 │ Restore Rehydration  │ GCS to Drive copy    │ `ARCHIVED`        │ Retry restore  │
│     │ Network Failure      │ error                │                   │ job with backoff│
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F11 │ Restored Checksum Mis│ Restored SHA != Meta │ `ARCHIVE_FAILED`  │ Re-download    │
│     │                      │                      │ (Quarantined)     │ from archive   │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ F12 │ Concurrent Take Edit │ Firestore OCC version│ HTTP 409          │ Refresh state; │
│     │ Collision            │ conflict             │ Conflict          │ re-submit      │
└─────┴──────────────────────┴──────────────────────┴───────────────────┴────────────────┘
```

---

## 20. Brownfield Media Implementation Audit

Inspection of current repository assets reveals the following disposition:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD REPOSITORY AUDIT                               │
├───────────────────────────────────┬──────────────┬─────────────────────────────────────┤
│ Component / File                  │ Disposition  │ Architectural Analysis & Transition │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `google-drive.service.ts`         │ MODIFY       │ Retain Drive API client and folder  │
│                                   │              │ hierarchy logic; wrap inside the    │
│                                   │              │ provider-independent storage adapter│
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `drive-sync.service.ts`           │ MODIFY       │ Deprecate MD5; upgrade to SHA-256;  │
│                                   │              │ replace Google Sheets repository with│
│                                   │              │ Firestore `media_assets` repository.│
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `media-storage-guard.ts`          │ KEEP         │ Enforce AP-007 / AP-008 checks to   │
│                                   │              │ block binary data payloads in models│
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `media-assets.repository.ts`      │ MIGRATE      │ Migrate from Google Sheets storage  │
│                                   │              │ to Firestore in Stage 16 / 17.      │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ `src/types/media-architecture.ts` │ KEEP         │ Standard TypeScript interfaces for  │
│                                   │              │ MediaAsset and MediaReference.      │
├───────────────────────────────────┼──────────────┼─────────────────────────────────────┤
│ 100 MB Video Limit in code        │ TRANSFORM    │ Upgrade target video limit to 500MB │
│                                   │              │ for 4K/1080p60 high-bitrate masters.│
└───────────────────────────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 21. Media Architecture Diagram

```text
                          ┌──────────────────────────┐
                          │   BP-CMS Web Client      │
                          │   (React Studio UI)      │
                          └────────────┬─────────────┘
                                       │ 1. Ingest Stream / Request Media
                                       ▼
                          ┌──────────────────────────┐
                          │   Express API Server     │
                          │  (Cloud Run Stateless)   │
                          └──────┬────────────────┬──┘
                                 │                │
            2. Metadata & Hashes │                │ 3. Active Binary Stream
                                 ▼                ▼
     ┌─────────────────────────────┐    ┌───────────────────────────────┐
     │   Cloud Firestore Native    │    │      Google Drive Storage     │
     │   (System of Record)        │    │    (Hot Production Active)    │
     │ ├── media_assets (Meta)     │    │  ├── /01_raw_takes/           │
     │ ├── media_references (Loc)  │    │  ├── /02_edits/               │
     │ └── archive_references      │    │  └── /03_master/ (Master MP4) │
     └──────────────┬──────────────┘    └───────────────┬───────────────┘
                    │                                   │
                    │ 4. Cold Preservation Trigger      │ 5. Asynchronous Transfer
                    └─────────────────┬─────────────────┘
                                      ▼
                        ┌───────────────────────────────┐
                        │   Archival Worker & Audit     │
                        │   ├── SHA-256 Verification    │
                        │   └── Safe Drive Retirement   │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │    External Cold Archive      │
                        │       (GCS Coldline)          │
                        │  └── Immutable Preserved MP4s │
                        └───────────────────────────────┘
```

---

## 22. Architectural Invariants

The Media Architecture enforces **17 non-negotiable invariants**:
1. **Firestore Owns Media Metadata:** All business metadata, durations, loudness tags, and checksums reside in Firestore.
2. **Binary Blobs Strictly Externalized (AP-007):** Binary buffers, byte arrays, and large base64 strings are prohibited from database documents.
3. **Storage-Provider IDs Never Primary Keys:** Vendor IDs (Drive File ID, GCS Key) are stored as reference attributes, never as BP-CMS entity IDs.
4. **Provider Independence (AP-008):** Media references are abstract locators allowing zero-downtime storage provider migration.
5. **SHA-256 Cryptographic Primacy:** SHA-256 hash digests are the sole authoritative proof of content integrity.
6. **Zero Trust for Client Metadata:** MIME types and byte lengths are verified server-side via magic byte inspection.
7. **Verified Media Immutability:** Once a media asset is verified, its binary cannot be overwritten in place.
8. **Archive Verification Handshake:** Archival requires cryptographic SHA-256 parity verification before active binary retirement.
9. **Idempotent Restore:** Rehydration from archive verifies SHA-256 integrity before marking the restored asset available.
10. **Metadata Survives Broken References:** External 404 errors isolate and quarantine references without deleting metadata.
11. **Decoupled Media Lifecycle:** Media lifecycle states are orthogonal to the 15-step business workflow and async job states.
12. **Server-Mediated Media Access:** Direct public URLs to cloud storage are prohibited; playback streams via authenticated server proxies.
13. **Destructive Operations Auditable:** Soft-deletions, quarantines, and archival migrations emit immutable `AuditEvent` records.
14. **Anti-Self-Approval in QC Gates:** Quality Control sign-off cannot be executed by the video editor who submitted the cut (`GAR-02`).
15. **Transient Outage Resilience:** Cloud storage network timeouts trigger exponential backoff without corrupting application state.
16. **Deterministic File Naming:** Ingested files are renamed using canonical patterns to eliminate filesystem collisions.
17. **Strict Zero-Cost Infrastructure Invariant:** Initial storage architecture operates 100% within free tier allowances (₹0–₹100 investment constraint).

---

## 23. Conflict & Decision Registers

### 23.1 Media Architecture Decision Register (MAR)
- **MAR-001 (Active Storage Selection):** Selected Google Drive via Service Account / OAuth2 as active working storage because studio staff currently collaborate via Google Workspace at zero incremental cost.
- **MAR-002 (Archive Storage Tier):** Selected Google Cloud Storage (GCS Standard Tier for first 5 GB free, transition to Coldline upon volume growth) as cold preservation vault.
- **MAR-003 (Checksum Standardization):** Standardized on SHA-256 across all entities, replacing legacy MD5 checksums.
- **MAR-004 (Streaming Delivery Strategy):** Selected Node.js Express server proxy with HTTP Range support for video delivery, avoiding public Google Drive file sharing.

### 23.2 Media Architecture Conflict Register (MACR)
- **MACR-001 (MD5 vs. SHA-256):** `drive-sync.service.ts` computed MD5 checksums. Resolved: Replaced with SHA-256 in Stage 14 contract; physical upgrade in Stage 17.
- **MACR-002 (In-Memory Google Drive Auth):** Legacy code allowed temporary in-memory refresh tokens in non-production. Resolved: In-memory tokens prohibited in production; credentials managed strictly via server environment secrets.
- **MACR-003 (Legacy Video Size Cap):** Brownfield code enforced a 100 MB video cap. Resolved: Upgraded target cap to 500 MB to support 1080p60 high-bitrate master cuts while preserving free tier storage boundaries.
- **MACR-004 (Direct Drive IDs in Models):** Legacy schemas placed `driveFileId` directly on domain entities. Resolved: Domain entities reference abstract `MediaReference` pointers.

---

## 24. Downstream Implementation Contract

This document forms the binding specification for downstream SDLC stages:
- **Stage 16 (Persistence Implementation):** Deliver physical Firestore collections and Zod schemas for `media_assets`, `media_references`, and `archive_references`.
- **Stage 17 (Media Storage Implementation):**
  1. Build the Provider-Independent Storage Interface (`IStorageProvider`).
  2. Implement the `GoogleDriveStorageAdapter` with chunked upload, Range streaming, and folder hierarchy caching.
  3. Implement the `GCSArchiveStorageAdapter` with cryptographic handshake verification.
  4. Implement the server-side magic byte sniffer and SHA-256 stream digester.
  5. Implement the Broken Reference Quarantine and UI SVG fallback protocol.
- **Stage 19–22 (Studio Production & QC Workflows):** Enforce loudness checks (-14.0 LUFS) and 9:16 vertical safe-zone checks during video sign-off.
- **Stage 27 (Notifications & Audit):** Wire media failure alerts to the Notification and Audit Event subsystem.
- **Stage 28 (E2E Integration Testing):** Execute automated mock tests for upload, stream playback, quarantine, archive, and restore pipelines.

---

## 25. Traceability Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STAGE 14 TRACEABILITY MATRIX                              │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ Requirement / Principle    │ Stage 14 Architecture Sec.  │ Downstream Implementation   │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ AP-007 (Binary Isolation)  │ Section 2, 4, 17            │ Stage 16, 17                │
│ AP-008 (Media References)  │ Section 5, 16               │ Stage 16, 17                │
│ Stage 01 (Media Limits)    │ Section 3, 9                │ Stage 17 (Upload Guard)     │
│ Stage 02 (GAR-02 QC Gate)  │ Section 10, 22              │ Stage 19, 21 (QC Engine)    │
│ Stage 06 (Media Entities)  │ Section 4, 5, 7             │ Stage 16 (Repositories)     │
│ Stage 07 (15-Step Workflow)│ Section 6, 7                │ Stage 17, 20 (Filming/Edit) │
│ Stage 08 (State Axiom)     │ Section 11                  │ Stage 14, 17 (State Mach)   │
│ Stage 11 (Media Route)     │ Section 6.2, 17             │ Stage 17 (API Endpoints)    │
│ Stage 12 (Zero-Cost Invar) │ Section 2, 6, 7             │ Stage 17 (GCS Free Tier)    │
│ Stage 13 (Data Contract)   │ Section 4, 5, 18            │ Stage 16 (Firestore Schema) │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 26. Completion Checklist & Sign-off

- [x] Defined tri-layer media architecture (Metadata, Active Storage, External Archive).
- [x] Specified canonical media types (`IMAGE`, `AUDIO`, `VIDEO`, `DOCUMENT`) and MIME formats.
- [x] Defined authoritative `MediaAsset` contract with physical and cryptographic attributes.
- [x] Established provider-independent `MediaReference` contract.
- [x] Specified Google Drive active storage role, folder hierarchy, and streaming mechanics.
- [x] Defined external cold archive architecture and `ArchiveReference` contract.
- [x] Formulated SHA-256 cryptographic integrity and two-phase archive verification handshake.
- [x] Specified 5-stage MIME, size, and magic byte file validation pipeline.
- [x] Defined media authorization matrix referencing Stage 09 capabilities.
- [x] Codified 16-state media lifecycle and transition precondition matrix.
- [x] Defined idempotent restore and rehydration contract.
- [x] Established broken reference quarantine protocol and safe UI fallback behavior.
- [x] Codified media immutability and OCC versioning rules.
- [x] Mapped domain entity relationships to media references.
- [x] Formulated media security and server-mediated token streaming rules.
- [x] Established comprehensive Source-of-Truth and Failure matrices.
- [x] Conducted brownfield audit of existing media services and repositories.
- [x] Codified 17 mandatory architectural invariants.
- [x] Documented Decision (MAR) and Conflict (MACR) registers.
- [x] Established downstream implementation contract for Stage 16, 17, and beyond.
- [x] **Zero production application source code modified.**
- [x] **Zero cloud storage folders or buckets created.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 14 — MEDIA ARCHITECTURE
================================================================================
Artifact:            docs/architecture/14-MEDIA-ARCHITECTURE.md
Version:             14.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 14 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Storage / Infra:     UNCHANGED (Zero Drive/GCS Changes)
Stage Boundary:      HALTED AT STAGE 14. Awaiting Stage 15 Instruction.
================================================================================
```

---

## 27. Anti-Overclaim Statement

> **CONFIRMATION:**
> SDLC Stage 14 is an ARCHITECTURE / MEDIA CONTRACT stage.
> 
> **MEDIA ARCHITECTURE CONTRACT COMPLETE.**
> **MEDIA IMPLEMENTATION NOT PERFORMED.**
> 
> No Google Drive folders, GCS buckets, or streaming routes were created or deployed. No production binary files were uploaded, moved, deleted, or restored. No application source code or repository implementations were modified. All physical storage adapter construction, busboy upload streaming, and emulator tests are deferred strictly to **Stage 17 (Media Storage Implementation)**.
