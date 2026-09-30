# Entity ↔ File Relationship Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 13 of 40  

---

## 1. Cardinality & Association Map

| Application Entity | Drive File Asset | Cardinality | Association Mechanism | Cascade Behavior on Entity Delete |
| :--- | :--- | :---: | :--- | :--- |
| **ContentMaster** (`BP-CNT-######`) | Drive Folder Hierarchy | 1 : 1 (Folder) | Folder named with Content ID | Deletion safety service prevents folder removal |
| **Video** (`BP-V-######`) | Active Master Video File | 1 : 1 (Active) | `VIDEOS.drive_file_id` pointer | Manual cleanup; no automatic Drive cascade |
| **Video** (`BP-V-######`) | Raw Recorded Takes | 1 : N (Takes) | Linked via `MEDIA_ASSETS.content_id` | Historical takes retained in Drive |
| **Video** (`BP-V-######`) | Edited Cut Sequences | 1 : N (Cuts) | Stored in `Edited/` folder | Historical cuts retained in Drive |
| **Thumbnail** (`BP-THM-######`) | Active Thumbnail Image | 1 : 1 (Active) | `THUMBNAILS.drive_file_id` | Replaced file retained as version |
| **Thumbnail** (`BP-THM-######`) | Revision Iterations | 1 : N (Revisions)| Linked via `THUMBNAIL_VERSIONS` | Previous images remain in Drive |
| **Script** (`BP-SCR-######`) | Drive Document | 1 : 0 (No file) | **NONE:** Scripts stored in Sheets text | N/A |
| **Question** (`BP-Q-######`) | Drive File | 1 : 0 (No file) | Linked indirectly via Video | N/A |

---

## 2. Active Pointer vs Historical Archive Model
BP-CMS implements an **Active Pointer Model**:
- The `VIDEOS` sheet stores only the **active/latest** Drive file ID in `driveFileId`.
- All historical takes are archived in the `MEDIA_ASSETS` sheet and reside permanently in the Drive `Videos` folder.
- Selecting an older take updates the pointer in `VIDEOS.driveFileId` without modifying Drive files.
