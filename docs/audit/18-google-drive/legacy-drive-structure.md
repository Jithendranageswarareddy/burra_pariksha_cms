# Legacy Drive Structure & Evolution Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 30 of 40  

---

## 1. Evolution of Storage Architecture Across Phases

Google Drive integration in BP-CMS evolved through four distinct architectural phases:

1. **Phase 1-6 (Pre-Drive Era):**  
   Video assets were represented as dummy external YouTube URLs or local strings. No real binary storage existed.
2. **Phase 7 (Introduction of Real Drive Infrastructure):**  
   Added `GoogleDriveService` with service account and OAuth 2.0. Established Convention A: `Root/Content/BP-CNT-######/{Videos, Scripts, Thumbnails}`.
3. **Phase 14 (Production Stage Granularity):**  
   Introduced `Phase14DriveService` and Convention B: `Root/BP-CNT-######/{Raw, Edited, Final, Thumbnail}`. Added strict MIME and size validations.
4. **Phase 18 (Thumbnail Intelligence & Asset Tracking):**  
   Introduced `MEDIA_ASSETS` sheet to track multi-take versioning and thumbnail candidate selection.

---

## 2. Deprecated & Legacy Relics
- **Legacy `Scripts` Folder:** Still created by Phase 7 `ensureContentHierarchy()`, but permanently empty.
- **Legacy `rawFootagePath` Column:** In `VIDEOS` sheet, duplicate representation of `driveFileId`.
- **Legacy `GOOGLE_DRIVE_REFRESH_TOKEN` Env Var:** Replaced by `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`.
