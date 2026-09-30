# Critical File Operation Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 38 of 40  

---

## 1. Trace 1: Video Ingestion & Drive Storage Trace

```
[PRESENTER / EDITOR] ──(HTTP POST multipart /api/videos/:id/upload)──► [EXPRESS: handleVideoUploadRoute]
                                                                                │
                                                            (Busboy buffers chunks into memory)
                                                                                │
                                                                                ▼
                                                                  [videoService.uploadVideoAsset]
                                                                                │
                                                            (validateMediaUpload: video/mp4, <= 100MB)
                                                                                │
                                                                                ▼
                                                            [googleDriveService.ensureContentHierarchy]
                                                                                │
                                                            (Resolves Root/Content/BP-CNT-000001/Videos)
                                                                                │
                                                                                ▼
                                                                [googleDriveService.uploadFile]
                                                                                │
                                                            (OAuth2 JWT exchange -> drive.files.create)
                                                                                │
                                                                                ▼
                                                            [GOOGLE DRIVE: File 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK]
                                                                                │
                                                                                ▼
                                                            [mediaAssetsRepository.create(MEDIA-000001-RAW-2)]
                                                                                │
                                                                                ▼
                                                            [videosRepository.update(BP-V-000001, status: RECORDED)]
                                                                                │
                                                                                ▼
                                                            [auditLogRepository.append(VIDEO_ASSET_UPLOAD)]
```

---

## 2. Trace 2: HTML5 Video Streaming Playback Trace

```
[BROWSER <video>] ──(GET /api/videos/BP-V-000001/stream, Range: bytes=0-1048575)──► [EXPRESS ROUTE]
                                                                                            │
                                                                            (requireAuth & objectAuth check)
                                                                                            │
                                                                                            ▼
                                                                            [videosRepository.findById]
                                                                                            │
                                                                            (Resolves driveFileId: 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK)
                                                                                            │
                                                                                            ▼
                                                                            [googleDriveService.downloadFile]
                                                                                            │
                                                                            (drive.files.get alt: media, Range header)
                                                                                            │
                                                                                            ▼
                                                                            [GOOGLE DRIVE API v3]
                                                                                            │
                                                                            (Returns 206 Partial Content Stream)
                                                                                            │
                                                                                            ▼
                                                                            [Piped to Express Response Stream]
                                                                                            │
                                                                                            ▼
[BROWSER VIDEO DECODER: Smooth byte-range playback & seeking without full download]
```
