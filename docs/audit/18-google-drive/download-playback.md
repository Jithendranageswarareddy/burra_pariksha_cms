# Download & Playback Architecture Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 20 of 40  

---

## 1. HTTP Range (206 Partial Content) Streaming

In `src/server/routes.ts:1751` and `src/lib/services/google-drive.service.ts:600`:

```typescript
// Client sends Range: bytes=0-1048575
const rangeHeader = req.headers.range;
const download = await googleDriveService.downloadFile(video.driveFileId, rangeHeader);

res.status(download.statusCode || 206);
res.setHeader('Content-Type', 'video/mp4');
res.setHeader('Accept-Ranges', 'bytes');
res.setHeader('Content-Range', download.contentRange);
download.stream.pipe(res);
```

---

## 2. Browser Playback Compatibility
- **HTML5 Video Player:** The frontend `<video>` element streams directly from `/api/videos/:id/stream`.
- **Seeking Support:** Because the backend forwards HTTP Range headers to Google Drive, users can seek forward/backward in the video player without downloading the entire file.
- **Access Control:** Playback requires a valid `ais_session` cookie or Bearer token; unauthenticated requests are rejected with HTTP 401.
