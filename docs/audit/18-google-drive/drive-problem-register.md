# Google Drive & File Storage Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 37 of 40  

---

## 1. Problem Classification & Risk Distribution

A forensic analysis of the Google Drive integration and file storage tier identified **26 distinct problem findings**:

| Risk Severity | Total Findings | Classification Summary |
| :--- | :---: | :--- |
| **CRITICAL** | **5** | In-memory upload buffer OOM risk, missing rollback on video upload failure, synthetic file ID contamination in production sheets, zero test/prod Drive folder separation, direct Drive web link RBAC bypass |
| **HIGH** | **12** | Dual folder hierarchy divergence (Phase 7 vs Phase 14), client-supplied MIME spoofing, orphan entities without Drive files, dangling sheet references pointing to Trashed files, race condition on initial folder creation, multi-instance folder cache incoherency, lack of upload checksum deduplication, unbounded Drive API quota consumption on large downloads, empty dormant `Scripts` folders, lack of storage-level quota alerts, unmanaged test folder clutter, single OAuth refresh token dependency |
| **MEDIUM** | **6** | Stale folder cache upon manual Drive rename, lack of signed temporary download URLs, mixed video versioning conventions, missing file size limit headers in multipart stream, lack of automated virus/malware scanning, zero thumbnail records in production sheet |
| **LOW** | **3** | Non-standard video filename casing, duplicate legacy `rawFootagePath` column, deprecated phase comments in Drive services |

---

## 2. Complete Inventory of the 26 Problem Findings

### Critical Severity (DRV-CRIT-01 to DRV-CRIT-05)
- **DRV-CRIT-01 (In-Memory Upload Buffer OOM Hazard):** Multipart uploads buffer entire video files (up to 100MB) in Node.js V8 memory before streaming to Drive; concurrent uploads cause Cloud Run container crashes.
- **DRV-CRIT-02 (Missing Rollback on Video Upload Metadata Failure):** In `video.service.ts:1010`, when Google Sheets fails to persist metadata after Drive upload, the Drive file is NOT deleted, creating permanent orphan files.
- **DRV-CRIT-03 (Synthetic Mock File ID Contamination):** Six active production rows in `VIDEOS` and `MEDIA_ASSETS` contain `fixed_drive_file_id_12345` from automated tests, causing runtime 404 crashes.
- **DRV-CRIT-04 (Zero Test vs Production Drive Folder Isolation):** Integration tests upload directly into the production Drive root folder, polluting production storage with test content.
- **DRV-CRIT-05 (Direct Drive Web Link RBAC Bypass):** Sharing Google Sheets rows exposes `drive_folder_url` links that bypass application authorization if Drive sharing is set to domain/public.

### High Severity (DRV-HIGH-01 to DRV-HIGH-12)
- **DRV-HIGH-01 (Dual Competing Folder Hierarchies):** Phase 7 (`Root/Content/BP-CNT/Videos`) and Phase 14 (`Root/BP-CNT/Raw`) create fragmented, incompatible folder structures.
- **DRV-HIGH-02 (Client-Reported MIME Spoofing):** Upload validation trusts `info.mimeType` without verifying magic bytes, permitting malicious files with video extensions.
- **DRV-HIGH-03 (Orphan Entities Without Drive Assets):** `BP-V-372937` is in `EDITING` status but has no associated Drive file (`driveFileId: undefined`).
- **DRV-HIGH-04 (Dangling References to Trashed Files):** `MEDIA-172872` rows reference Drive files that were moved to Trash during test cleanup.
- **DRV-HIGH-05 (Folder Creation Race Condition):** Concurrent requests for a new content ID create duplicate Drive folders with identical names.
- **DRV-HIGH-06 (Multi-Instance Cache Incoherency):** `folderCache` is local to a single Cloud Run container; auto-scaled instances cannot share folder lookups.
- **DRV-HIGH-07 (Lack of Checksum Deduplication):** Uploading identical video files creates duplicate Drive files and increments version numbers without deduplication.
- **DRV-HIGH-08 (Unbounded Quota Depletion on Streams):** High-frequency video playback through backend proxy consumes Google Drive API rate limits.
- **DRV-HIGH-09 (Empty Dormant `Scripts` Folders):** `GoogleDriveService` creates `Scripts` folders for all content IDs, but scripts are stored solely in Google Sheets.
- **DRV-HIGH-10 (Lack of Storage Quota Monitoring):** No automated telemetry monitors remaining Google Drive storage capacity.
- **DRV-HIGH-11 (Test Folder Clutter in Root):** `BP-CNT-E2E17-*` test folders clutter the root Drive directory.
- **DRV-HIGH-12 (Single OAuth Refresh Token Bottleneck):** All Drive operations funnel through a single user refresh token; token revocation halts all media operations.

### Medium Severity (DRV-MED-01 to DRV-MED-06)
- **DRV-MED-01 (Stale Folder Cache on Manual Rename):** Renaming folders in Drive UI breaks uploads until Node process restart.
- **DRV-MED-02 (Lack of Signed Temporary URLs):** Direct Drive URLs are static and permanent rather than short-lived expiring links.
- **DRV-MED-03 (Mixed Versioning Conventions):** Versioning is tracked differently across `VIDEOS` (single active take) and `MEDIA_ASSETS` (full history).
- **DRV-MED-04 (Missing Content-Length Stream Limits):** `busboy` relies on in-flight chunk counting rather than rejecting oversized streams at request start.
- **DRV-MED-05 (Zero Antivirus / Malware Scanning):** Files uploaded to Drive are not scanned for malware prior to storage.
- **DRV-MED-06 (Zero Active Thumbnail Records in Production):** `THUMBNAILS` sheet has 0 active records, indicating thumbnail production pipeline is decoupled.

### Low Severity (DRV-LOW-01 to DRV-LOW-03)
- **DRV-LOW-01 (Non-Standard Filename Casing):** Inconsistent filename casing (`vd1.1.mp4` vs `raw_footage_01.mp4`).
- **DRV-LOW-02 (Redundant `rawFootagePath` Column):** `VIDEOS` sheet maintains redundant URL column duplicating `driveFileId`.
- **DRV-LOW-03 (Deprecated Phase Comments):** Outdated phase comments in Drive integration services.
