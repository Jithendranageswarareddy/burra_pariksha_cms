# Persistence Layer Forensic Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 13 of 30  

---

## 1. Persistence Tiers

Mutating actions in BP-CMS persist data into three storage layers:
1. **Google Sheets Database (Authoritative Single Source of Truth)**: 14 distinct worksheets accessed via `googleSheetsClient`.
2. **Google Drive Asset Storage**: Storage of raw footage, edited video mp4s, thumbnail jpgs, and platform packages.
3. **Google Cloud Storage (GCS) Snapshot Backups**: Disaster recovery snapshot tarballs created by `snapshotSchedulerService`.

---

## 2. Mutating Action Persistence Register

| Action ID | Triggering Action | Target Storage Layer | Authoritative Entity Tab | Persistence Repository |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-QSTU-02` | Save Question | Google Sheets | `Questions` | `QuestionsRepository` |
| `ACT-QVER-01` | Approve Question | Google Sheets | `Questions`, `Videos` | `QuestionsRepository`, `VideosRepository` |
| `ACT-SCPT-01` | Approve Script | Google Sheets | `Scripts`, `ScriptVersions` | `ScriptsRepository` |
| `ACT-REC-01` | Record Footage | Google Sheets + Drive | `Videos`, Drive Folder | `VideosRepository`, `GoogleDriveService` |
| `ACT-EDIT-01` | Submit Cut | Google Sheets + Drive | `Videos`, Drive Folder | `VideosRepository` |
| `ACT-QC-01` | Approve Cut | Google Sheets | `Videos`, `AuditLogs` | `VideosRepository`, `AuditService` |
| `ACT-THUM-01` | Approve Thumbnail | Google Sheets + Drive | `Thumbnails`, Drive Folder | `ThumbnailsRepository` |
| `ACT-SOC-01` | Signoff Social | Google Sheets | `SocialReviews` | `SocialReviewsRepository` |
| `ACT-PUB-01` | Schedule Release | Google Sheets | `PublishingQueue`, `Videos` | `PublishingRepository` |
| `ACT-REST-01` | Execute Restore | GCS -> Google Sheets | All 14 Sheets Wiped & Reloaded| `FullSnapshotRestoreExecutionService` |
