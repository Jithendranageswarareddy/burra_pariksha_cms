# Drive File ID Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 11 of 40  

---

## 1. File Identifier Architecture

In BP-CMS, multiple ID schemes intersect when handling file assets:

| Identifier Type | Example Value | Generating System | Storage Location | Domain Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Google Drive File ID** | `1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB` | Google Drive API v3 | `VIDEOS.drive_file_id`, `MEDIA_ASSETS.drive_file_id` | Opaque 33-character alphanumeric Google resource pointer |
| **Media Asset ID** | `MEDIA-000001-RAW-1` | `video.service.ts` | `MEDIA_ASSETS.id` (PK) | Structured business identifier encoding Content ID, Stage, and Take |
| **Video Production ID** | `BP-V-000001` | `SequencesRepository` | `VIDEOS.id` (PK) | Canonical video production conveyor entity ID |
| **Content Master ID** | `BP-CNT-000001` | `SequencesRepository` | `CONTENT_MASTERS.id` (PK) | Canonical content umbrella ID determining Drive folder name |
| **Synthetic Test File ID**| `fixed_drive_file_id_12345` | Test Fixture | `MEDIA_ASSETS` (Rows 7-9) | Non-functional mock string injected during synthetic testing |

---

## 2. Field Name Aliasing & Drift
Across repositories and services, the Google Drive file ID is referenced under different property names:
- `driveFileId`: Canonical TypeScript property name across `Video`, `MediaAsset`, and `Thumbnail`.
- `drive_file_id`: Google Sheets column name in `VIDEOS`, `MEDIA_ASSETS`, and `THUMBNAILS`.
- `fileId`: Parameter name in `google-drive.service.ts` and `media/download/:fileId` API route.
- `rawFootagePath`: Legacy column in `VIDEOS` storing `https://drive.google.com/file/d/{fileId}/view`.
