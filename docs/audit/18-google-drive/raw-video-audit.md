# Raw Video Asset Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 06 of 40  

---

## 1. Raw Video Upload & Correlation Lifecycle

Raw video represents recorded teleprompter footage ingested into the system:

```
[Video Editor / Presenter]
           │
           ▼ (Multipart HTTP POST: /api/videos/:id/upload)
[handleVideoUploadRoute (busboy stream)]
           │
           ▼
[videoService.uploadVideoAsset()]
           │
           ├── 1. Validate MIME & sanitize filename
           ├── 2. Verify ContentMaster (BP-CNT-######) exists
           ├── 3. Resolve Drive folder: Root/Content/BP-CNT-######/Videos
           ├── 4. Upload binary stream to Google Drive
           │        └── Yields Drive File ID (e.g. 1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB)
           ├── 5. Compute Monotonic Version: nextVersion = max(mediaVersion, videoVersion) + 1
           ├── 6. Append to Google Sheets MEDIA_ASSETS tab (id: MEDIA-######-RAW-1)
           ├── 7. Update Google Sheets VIDEOS tab (driveFileId, driveFolderId, status: RECORDED)
           └── 8. Append to AUDIT_LOG tab (action: VIDEO_ASSET_UPLOAD)
```

---

## 2. Live Raw Video Evidence

In live Drive folder `BP-CNT-000001/Videos` (`1DBudvMCAA7uc8qHDuZEmnTvvEVPtHVrr`):
- **Take 1:** `vd1.1.mp4`
  - Drive File ID: `1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB`
  - Size: 2,649,854 bytes (~2.65 MB)
  - Created: 2026-09-27T19:31:09.008Z
  - Linked in `MEDIA_ASSETS` as: `MEDIA-000001-RAW-1` (Version 1)
- **Take 2:** `vd1.2.mp4`
  - Drive File ID: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK`
  - Size: 2,684,852 bytes (~2.68 MB)
  - Created: 2026-09-27T19:31:50.423Z
  - Linked in `MEDIA_ASSETS` as: `MEDIA-000001-RAW-2` (Version 2)
  - Linked in `VIDEOS` as active pointer (`BP-V-000001.driveFileId`)
