# Video Production Business Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 14 of 51  

---

## 1. Video Identity & Multi-Storage Structure

- **Canonical Name:** Video
- **Classification:** Business Entity (Production Work Order & Media Record)
- **Primary Identifier:** `id` (Pattern: `BP-V-XXXXXX`, 6 digits)
- **Foreign Keys Held:**
  - `questionId` -> `QUESTIONS.id`
  - `contentMasterId` -> `CONTENT_MASTERS.id`
  - `assignedHost` -> `USERS.id`
  - `assignedEditor` -> `USERS.id`
- **Physical Storage:**
  - Metadata: Google Sheets tab `VIDEOS` (22 columns)
  - Raw Footage Binary: Google Drive folder `RAW` (`driveFileId`)
  - Edited Cut Binary: Google Drive folder `EDITED` (`editedVideoDriveId`)
- **Repository:** `videosRepository` (`src/lib/repositories/videos.repository.ts`)

---

## 2. Column-by-Column Schema Reconciliation (`VIDEOS`)

| Col | Header | Property | Type | Description |
| :-: | :--- | :--- | :---: | :--- |
| **A** | `id` | `id` | string | Primary Key (`BP-V-XXXXXX`) |
| **B** | `content_master_id` | `contentMasterId` | string | FK to `CONTENT_MASTERS` |
| **C** | `question_id` | `questionId` | string | FK to `QUESTIONS` |
| **D** | `title` | `title` | string | Production title |
| **E** | `status` | `status` | enum | `VideoProductionStatus` (13 states) |
| **F** | `priority` | `priority` | enum | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| **G** | `target_duration_seconds`| `targetDurationSeconds`| number | Duration limit (<= 180s) |
| **H** | `assigned_host` | `assignedHost` | string | FK to `USERS` |
| **I** | `assigned_editor` | `assignedEditor` | string | FK to `USERS` |
| **J** | `drive_folder_url` | `driveFolderUrl` | string | Google Drive folder URL |
| **K** | `drive_file_id` | `driveFileId` | string | Raw take Drive file ID |
| **L** | `raw_footage_path` | `rawFootagePath` | string | Alternative storage path |
| **M** | `youtube_url` | `youtubeUrl` | string | Live YouTube Shorts URL |
| **N** | `created_at` | `createdAt` | ISO date | Creation timestamp |
| **O** | `updated_at` | `updatedAt` | ISO date | Update timestamp |
