# Media Asset Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 15 of 51  

---

## 1. Distinction: Video Business Entity vs Media Asset

The codebase establishes a clear architectural distinction:
- **`Video`:** The business production order, lifecycle state machine, and scheduling record.
- **`MediaAsset`:** The physical file artifact stored in Google Drive (raw take, cut render, audio track, snapshot zip).

---

## 2. MediaAsset Schema (`src/types/index.ts:2410–2450`)

Stored in Google Sheets tab `MEDIA_ASSETS`:

| Header | Type | Description |
| :--- | :---: | :--- |
| `id` | string | Primary Key (`BP-MED-XXXXXX`) |
| `content_id` | string | FK to `CONTENT_MASTERS` or `VIDEOS` |
| `media_stage` | enum | `RAW`, `EDITED`, `THUMBNAIL`, `AUDIO` |
| `file_name` | string | Original filename (e.g. `cut_001.mp4`) |
| `drive_file_id` | string | Google Drive file ID |
| `mime_type` | string | `video/mp4`, `image/jpeg`, etc. |
| `file_size_bytes`| number | File size in bytes |
| `uploaded_by` | string | User ID of uploader |
| `created_at` | ISO date | Upload timestamp |
