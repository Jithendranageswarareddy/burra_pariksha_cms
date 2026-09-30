# Thumbnail Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 08 of 40  

---

## 1. Thumbnail Upload & Approval Flow

Thumbnail image management is orchestrated by `src/lib/services/thumbnail.service.ts`:

```
[Designer / AI Generator]
           │
           ▼ (POST /api/videos/:videoId/thumbnail/upload)
[thumbnailService.uploadThumbnailAsset()]
           │
           ├── 1. Ensure folder: Root/Content/BP-CNT-######/Thumbnails
           ├── 2. Upload image (JPEG/PNG, <= 5MB) to Google Drive
           │        └── Returns driveFileId and webViewLink
           ├── 3. Create or update row in THUMBNAILS sheet:
           │        - drive_file_id
           │        - drive_asset_url
           │        - drive_folder_id
           │        - status: PENDING_REVIEW
           └── 4. Append historical record to THUMBNAIL_VERSIONS sheet
```

---

## 2. Hard Safety Gate for Approval (`approveThumbnail`)
In `thumbnail.service.ts:296`:
```typescript
if (!existing.driveFileId || !existing.driveFileId.trim()) {
  throw new ValidationError(
    `Cannot approve thumbnail "${thumbnailId}": No real Google Drive thumbnail asset exists (driveFileId is missing). An actual thumbnail image must be uploaded before approval.`
  );
}
```
**Finding:** A thumbnail cannot be approved without an authentic Google Drive asset link.

---

## 3. Live State Reconciliation
- In the active live spreadsheet, the `THUMBNAILS` tab contains **0 rows**.
- Live Drive folder `1V4EDuzVy2n5C3xFwiV7486mzxccmbHvD` (`Thumbnails` under `BP-CNT-000001`) contains **0 files**.
- Historical test folders (`BP-CNT-802170`, `BP-CNT-906043`) contain thumbnail subfolders, but image assets were cleaned up or moved to Trash during test teardown.
