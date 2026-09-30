# Upload Endpoints Forensic Audit (8 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 17 of 30  

---

## 1. Upload Processing Architecture

BP-CMS processes file uploads using Express `multer` middleware for multipart form data, routing files either to local temporary storage or directly streaming to Google Drive.

---

## 2. Upload Endpoint Register

| Endpoint Path | Method | Accepted MIME Types | Max Size | Target Storage | Service Handler |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/media/upload` | `POST` | `image/*`, `video/*` | 100 MB | Google Drive | `googleDriveService.uploadFile` |
| `/api/thumbnails/:id/upload` | `POST` | `image/png`, `image/jpeg` | 10 MB | Google Drive | `thumbnailService.uploadCustom` |
| `/api/taxonomy/import-bulk` | `POST` | `text/csv`, `application/json`| 5 MB | Memory / Sheets | `taxonomyService.bulkImport` |
| `/api/social-comments/import` | `POST` | `text/csv` | 10 MB | Sheets | `socialCommentsService.importCsv`|
| `/api/recovery/upload-snapshot` | `POST` | `application/json`, `application/gzip` | 50 MB | Snapshot Archive | `FullSnapshotRestoreExecutionService`|
