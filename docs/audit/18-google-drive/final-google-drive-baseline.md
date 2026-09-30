# Final Google Drive & File Storage Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 40 of 40  

---

## 1. Master Architectural Baseline Summary

This baseline specification establishes the authoritative forensic record of the Google Drive and file-storage architecture of Burra Pariksha CMS as of **2026-09-29**:

1. **Storage Technology:**  
   Google Drive API v3 via `googleapis ^176.0.0` is the sole active persistent file storage tier. In-memory `mockFiles` map acts as fallback when credentials are absent. Zero GCS, S3, or local disk persistence.
2. **Authentication Architecture:**  
   OAuth 2.0 user credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`). Service Account mode is restricted to non-production.
3. **Folder Structure:**  
   Two competing conventions co-exist: Phase 7 (`Root/Content/BP-CNT-######/{Videos, Scripts, Thumbnails}`) and Phase 14 (`Root/BP-CNT-######/{Raw, Edited, Final, Thumbnail}`).
4. **Active Root Content Folder:**  
   `1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx` (`Content` under Root `1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN`).
5. **Raw Video Files:**  
   Recorded teleprompter takes stored as MP4 in `Videos` folder (`vd1.1.mp4`, `vd1.2.mp4`) with monotonic versioning.
6. **Edited & Final Video Files:**  
   Post-production cuts (`edited_cut_v1.mp4`) and approved master renders (`final_published_render.mp4`) stored in dedicated stage folders.
7. **Thumbnails:**  
   Targeted for `Thumbnails/` folder (<= 5MB, JPEG/PNG). 0 active records in current live spreadsheet.
8. **Scripts & Documents:**  
   Zero Drive files. Stored exclusively as text strings in Google Sheets `SCRIPT` tab. The Drive `Scripts` folder is an empty shell.
9. **Generated Assets:**  
   AI thumbnails and snapshot JSON backups uploaded to Drive or returned in-memory.
10. **File Identifiers:**  
    Opaque 33-character alphanumeric Google Drive file IDs (e.g. `1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB`) stored in `drive_file_id` sheet columns.
11. **Metadata Architecture:**  
    Binary attributes (size, MIME, createdTime) stored in Drive; business context (Content ID, Take Version, Stage) stored exclusively in Google Sheets.
12. **Entity-File Relationships:**  
    1:1 for active video pointer; 1:N for historical media asset takes.
13. **File References:**  
    Referenced in `VIDEOS.drive_file_id`, `MEDIA_ASSETS.drive_file_id`, and `THUMBNAILS.drive_file_id`.
14. **Sheets ↔ Drive Reconciliation:**  
    2 valid live files match perfectly; 3 records contaminated with `fixed_drive_file_id_12345`; 1 video entity has no file attached.
15. **Database ↔ Drive Reconciliation:**  
    0 relational SQL databases exist; Google Sheets is the sole tabular registry of Drive file IDs.
16. **Source of Truth:**  
    Google Drive is authoritative for binary content; Google Sheets is authoritative for business metadata.
17. **Upload Execution:**  
    Multipart streaming via `busboy` buffered into Node.js `Buffer` before piping to Drive.
18. **Retrieval Execution:**  
    Authenticated backend proxy streaming with HTTP Range (206) support.
19. **Download / Playback:**  
    HTML5 video player streams directly from `/api/videos/:id/stream`.
20. **Permissions & ACLs:**  
    Single OAuth identity owns all files; application RBAC is enforced exclusively at the Express route layer.
21. **Ownership:**  
    Drive owner is Google OAuth service identity; application owner is recorded in `created_by` / `assigned_editor_id`.
22. **Lifecycle:**  
    Follows 15-stage conveyor: RECORDED -> EDITING -> FINAL_REVIEW -> READY_TO_UPLOAD -> PUBLISHED.
23. **Replacement & Versioning:**  
    Monotonic version increments; older takes are preserved in Drive and tracked in `MEDIA_ASSETS`.
24. **Orphan Files:**  
    Failed video uploads leave orphan files in Drive due to missing rollback in `video.service.ts`.
25. **Duplicate Files:**  
    Duplicate uploads create multiple Drive files with identical bytes due to lack of checksum deduplication.
26. **Folder Consistency:**  
    In-memory `folderCache` prevents redundant lookups but suffers from multi-instance cache incoherency.
27. **Hardcoded References:**  
    `fixed_drive_file_id_12345` leaked from test scripts into production sheets.
28. **Test/Production Separation:**  
    High risk: tests upload into the production Drive root folder.
29. **Legacy Structure:**  
    Phase 7 `Content` folder hierarchy co-exists with Phase 14 stage folder hierarchy.
30. **Security:**  
    Direct `webViewLink` exposure bypasses application RBAC if folder is domain/public shared.
31. **Validation:**  
    Extension and MIME checks enforced in service layer; magic byte verification is missing.
32. **Error Handling:**  
    Bounded 3-attempt exponential backoff on HTTP 429/5xx; non-retryable on `invalid_grant`.
33. **Partial Failures:**  
    Multi-tier transaction gap: Drive upload succeeds but Sheets write fails, creating untracked files.
34. **Cache & URLs:**  
    Process-lifetime folder cache; static permanent Drive URLs.
35. **Data-Flow Architecture:**  
    End-to-end trace mapped from multipart upload through Drive storage to browser playback.
36. **Critical Findings:**  
    5 Critical and 12 High severity problems registered in Problem Register.
37. **Problem Register:**  
    26 classified issues documented in `drive-problem-register.md`.
38. **Unknowns:**  
    Total cumulative byte consumption across all subfolders pending full recursive sweep.
39. **Evidence Limitations:**  
    Read-only static code and safe live metadata audit; zero mutating operations executed.
