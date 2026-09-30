# Stage 05: Raw Video Handoff

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 07 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 05 Raw Video
- **Canonical Purpose:** Raw camera video asset ingestion, Drive folder attachment, and handoff to editing bay.
- **Current Implementation:** `VideoDetailPage.tsx?tab=recording`, `GoogleDriveService.uploadFile()`, `mediaAssetsRepository`.
- **Active Route:** `/videos/:id?tab=recording`

---

## 2. Operational Flow Reconstructed

### INPUT
- Binary MP4 video file from camera / studio recording.
- Target video project ID (`BP-V-######`) and Content Master ID (`BP-CNT-######`).

### WORK
- Streams multipart video file via Multer to `GoogleDriveService.uploadFile()`.
- Places file into Google Drive hierarchical folder:
  `Root -> Content -> BP-CNT-###### -> Videos -> vd1.1.mp4`.
- Resolves `driveFileId`, file size, and MD5 checksum.
- Updates `Video.driveFileId` on `VIDEOS` tab.
- Appends metadata record in `MEDIA_ASSETS` tab.
- Transitions status to `RECORDED`.

### OUTPUT
- Physical binary MP4 file in Google Drive.
- Ingested `MediaAsset` record (`ASSET-######`).
- Updated `Video` row referencing `driveFileId`.

### STATE
- **Entity:** `Video` (status: `RECORDED`), `MediaAsset` (stage: `RAW`).
- **State Machine:** Video Production Machine.
- **Authoritative Storage:** Google Drive (Bytes) + Google Sheets (`VIDEOS`, `MEDIA_ASSETS`).

### NEXT STAGE
- **Expected Canonical Next Stage:** 06 Editing Bay
- **Actual Implementation Next Stage:** Switches tab to `/videos/:id?tab=editing`.
- **Critical Hack:** Dispatches 3 sequential calls if originating from `QUEUED` status (`QUEUED -> SCRIPT_READY -> RECORDED -> EDITING`).

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/RecordingWorkspace.tsx:220-255`, `src/lib/services/google-drive.service.ts:321-460`.
- **Implementation Status:** **FULLY IMPLEMENTED**
