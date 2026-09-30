# Google Drive Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 13 of 35  

---

## 1. Binary Media Ingestion & Delivery

Google Drive API v3 serves as the primary binary storage tier for BP-CMS video, audio, and high-resolution thumbnail assets.

```
[USER RECORDING / BROWSER]
  ↓ (Multipart Form Data via Multer)
Express Route (/api/videos/:id/upload)
  ↓ (Streaming Buffer)
GoogleDriveService.uploadFile()
  ↓ (OAuth 2.0 Refresh Token Header)
Google Drive API v3 (files.create)
  ↓
Drive Folder: Root -> Content -> BP-CNT-###### -> Videos -> vd1.1.mp4
  ↓
Returns: { fileId: "1ab2cd...", webViewLink, webContentLink, md5Checksum }
  ↓
VideoService updates Sheets VIDEOS row with driveFileId
```

### Streaming Retrieval Flow:
```
[USER PLAYBACK / BROWSER]
  ↓ (GET /api/videos/:id/stream)
Express Route Handler
  ↓ (Lookup driveFileId from VIDEOS repository)
GoogleDriveService.getFileStream(driveFileId)
  ↓ (Drive API files.get with alt=media)
Pipes Stream Directly to Express Response (res)
```
