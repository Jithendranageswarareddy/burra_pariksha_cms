# Lifecycle Stage 05: Raw Video Handoff

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 08 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Camera Recording File (`vd1.2.mp4`) |
| **Action** | Upload Video File |
| **Resulting Entity** | Physical Drive File + `MediaAsset` record |
| **Identifier** | Drive File ID: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK` |
| **State** | `Video.status = RECORDED` |
| **Page / Component** | `VideoDetailPage.tsx?tab=recording` -> `RecordingWorkspace.tsx` |
| **Active Route** | `/videos/:id?tab=recording` |
| **REST API** | `POST /api/videos/:id/upload-raw` |
| **Service Layer** | `GoogleDriveService.uploadFile()`, `video.service.ts` |
| **Repository Layer** | `videosRepository.updateRecord()`, `mediaAssetsRepository.appendRecord()` |
| **Authoritative Storage**| Google Drive (Bytes) + Google Sheets `VIDEOS` & `MEDIA_ASSETS` |
| **Next Entity / State** | Video Editing Bay |

---

## 2. Evidence from Runtime Item BP-V-000001

- Physical binary successfully uploaded to Google Drive folder `1DBudvMCAA7uc8qHDuZEmnTvvEVPtHVrr`.
- `driveFileId`: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK`.
- `fileName`: `vd1.2.mp4` (2,684,852 bytes).
- Discrepancy: Despite raw footage upload, `BP-V-000001` runtime status in sheet is currently `QUEUED`, indicating status transition was either bypassed or rolled back during testing.
