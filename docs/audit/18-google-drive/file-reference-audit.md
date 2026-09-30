# File Reference Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 14 of 40  

---

## 1. Drive File References Across Codebase

A complete audit of code references to `driveFileId` was performed across repositories, services, routes, and UI components:

| Location / File | Context | How Drive Reference is Consumed |
| :--- | :--- | :--- |
| `src/lib/services/video.service.ts:895` | Video Upload | Saves newly minted `driveFile.fileId` to `mediaAsset` and `video` records |
| `src/lib/services/thumbnail.service.ts:264` | Thumbnail Download | Invokes `googleDriveService.downloadFile(thumb.driveFileId)` to serve image |
| `src/lib/services/thumbnail.service.ts:296` | Thumbnail Approval | Verifies `driveFileId` is non-empty before permitting approval |
| `src/lib/services/publishing.service.ts:249` | Publishing Blocker Check | Blocks publishing if `video.driveFileId` is missing or empty |
| `src/lib/services/publishing.service.ts:1788`| Distribution Packaging | Packages `video.driveFileId` for multi-platform uploader integration |
| `src/server/routes.ts:1728` | Video Download Route | Passes `video.driveFileId` to `googleDriveService.downloadFile()` |
| `src/server/routes.ts:1759` | Video Stream Route | Passes `video.driveFileId` and `Range` header for browser streaming |
| `src/server/routes.ts:6002` | Generic Media Download | Downloads any file via `GET /api/media/download/:fileId` |
| `src/components/production/VideoPlayer.tsx` | Frontend Playback | Sets video source to `/api/videos/${video.id}/stream` |

---

## 2. Reference Integrity Risks
- If a user deletes a file directly in the Google Drive web UI, all references in `VIDEOS`, `MEDIA_ASSETS`, and `THUMBNAILS` immediately become broken pointers.
- Attempting to stream or download returns HTTP 404 or Google API `File not found`.
