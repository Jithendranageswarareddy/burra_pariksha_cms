# Data Model Conflicts & Inconsistencies

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 47 of 51  

---

## 1. Confirmed Structural Conflicts

1. **Dual Video Status Storage:** Status is stored in `VIDEOS.status` and duplicated in `QUESTIONS.video_status`. Incomplete transaction cascades frequently leave the Question displaying stale video states.
2. **Missing Database Integrity Engine:** The entire relational model is built on Google Sheets with zero physical foreign keys. Accidental cell edits or row deletions permanently orphan dependent records.
3. **Multi-Platform Publish Asymmetry:** `PUBLISHING` maintains an aggregate `status` column. A failure on 1 of 3 channels marks the entire row as `FAILED`, concealing partial publication.
4. **Drive Orphan Hazard:** Deleting a file directly in Google Drive creates a broken dangling pointer in `VIDEOS.drive_file_id` and `MEDIA_ASSETS.drive_file_id`.
5. **Sequence Collision Risk:** `sequenceSafetyService` uses in-memory process locks. Multiple Cloud Run container instances will allocate duplicate primary keys simultaneously.
