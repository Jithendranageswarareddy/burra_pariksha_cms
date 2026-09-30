# Stage 06: Video Editing Bay

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 08 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 06 Video Editing Bay
- **Canonical Purpose:** Editing bay master cut, dynamic Telugu subtitles, sound effects, and timer overlay.
- **Current Implementation:** `VideoDetailPage.tsx?tab=editing`, `EditingWorkspace.tsx`, `Phase14DriveService`.
- **Active Route:** `/videos/:id?tab=editing`

---

## 2. Operational Flow Reconstructed

### INPUT
- Raw video asset (`driveFileId`) and `Script` text.
- Editor assignment (`assignedEditor`).

### WORK
- Video editor downloads raw footage or streams via direct proxy pipe.
- Edits 9:16 vertical short, burns Telugu captions, and sound effects.
- Uploads final render cut to Google Drive or inputs Google Drive share URL.
- Transitions video production status:
  - First to `EDITING` (when actively working).
  - Then to `EDITED` (when master cut is submitted).

### OUTPUT
- Edited master video file in Google Drive.
- Updated `Video` record with `finalRenderPath` and duration.

### STATE
- **Entity:** `Video`
- **Field:** `status`
- **Current State:** `VideoProductionStatus.EDITED`
- **State Machine:** Video Production Machine (`VALID_VIDEO_TRANSITIONS`).
- **Authoritative Storage:** Google Sheets (`VIDEOS` tab) + Google Drive.

### NEXT STAGE
- **Expected Canonical Next Stage:** 07 Final QC
- **Actual Implementation Next Stage:** Switches tab to `/videos/:id?tab=final-review`.
- **Mismatch:** None. Clean handoff inside `VideoDetailPage.tsx`.

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/EditingWorkspace.tsx`, `src/lib/services/video.service.ts:380-420`.
- **Implementation Status:** **FULLY IMPLEMENTED**
