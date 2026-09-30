# End-to-End File ↔ Entity Data Flow

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 36 of 40  

---

## 1. Master Media Data Flow Architecture

```
[USER / CREATOR]
       │
       ▼ (1. Multipart Upload: /api/videos/:id/upload)
[EXPRESS ROUTE: handleVideoUploadRoute]
       │ (2. Busboy stream parsing & role authorization)
       ▼
[DOMAIN SERVICE: videoService.uploadVideoAsset]
       │ (3. validateMediaUpload: check extension, size, MIME)
       │ (4. ensureContentHierarchy: resolve Drive folder)
       ▼
[STORAGE CLIENT: googleDriveService.uploadFile]
       │ (5. OAuth 2.0 JWT exchange & drive.files.create)
       ▼
[GOOGLE DRIVE API v3]
       │ (6. Binary stored in /Videos folder; returns driveFileId)
       ▼
[REPOSITORY: mediaAssetsRepository.create]
       │ (7. Append record to Google Sheets MEDIA_ASSETS tab)
       ▼
[REPOSITORY: videosRepository.update]
       │ (8. Update driveFileId & status to RECORDED in VIDEOS tab)
       ▼
[REPOSITORY: auditLogRepository.append]
       │ (9. Record VIDEO_ASSET_UPLOAD event in AUDIT_LOG tab)
       ▼
[CLIENT RESPONSE (201 Created)]
       │
       ▼ (10. Playback Request: GET /api/videos/:id/stream)
[EXPRESS ROUTE: videoService -> googleDriveService.downloadFile]
       │ (11. Forward HTTP Range header; stream pipe from Drive)
       ▼
[FRONTEND VIDEO PLAYER (HTML5 <video> with byte-range seeking)]
```
