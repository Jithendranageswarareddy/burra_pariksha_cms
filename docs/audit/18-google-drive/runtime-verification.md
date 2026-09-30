# Runtime Verification Requirements

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 39 of 40  

---

## 1. Deferred Runtime Verification Protocol

In strict adherence to the **READ-ONLY AUDIT CHARTER**, zero mutating file operations or stress tests were executed against production Google Drive. The following **12 dynamic behaviors** are formally deferred to live staging tests:

| Check ID | Verification Objective | Deferred Dynamic Test Procedure | Target Storage Component |
| :--- | :--- | :--- | :--- |
| **VERIF-01** | Concurrent Upload Memory Load | Upload five simultaneous 80MB video files; monitor Node.js process heap memory to detect OOM threshold | Express busboy buffer |
| **VERIF-02** | Rollback on Metadata Failure | Mock a Google Sheets API failure during video upload; verify whether `videoService` leaves an orphan file in Drive | `video.service.ts:1010` |
| **VERIF-03** | Byte-Range Seeking Performance | Issue 50 random HTTP Range requests to `/api/videos/:id/stream`; measure latency and HTTP 206 status correctness | Video streaming proxy |
| **VERIF-04** | OAuth Refresh Expiry Behavior | Mock an `invalid_grant` error; verify that `GoogleDriveService` terminates retries immediately with `GoogleAuthError` | OAuth 2.0 client |
| **VERIF-05** | MIME Extension Mismatch | Attempt to upload a `.png` file with `video/mp4` MIME type; verify that `validateMediaAsset` rejects with 400 | File validation |
| **VERIF-06** | Folder Cache Thread-Safety | Fire 10 concurrent requests to create a new content hierarchy on a cold cache; verify if duplicate folders are created | `ensureFolder` cache |
| **VERIF-07** | Drive API Quota Throttling | Issue 150 consecutive `files.get` metadata requests within 60 seconds; measure backoff behavior on HTTP 429 | Google Drive API v3 |
| **VERIF-08** | Synthetic File ID Handling | Call `GET /api/videos/BP-V-731056/stream` (contains `fixed_drive_file_id_12345`); verify error response is graceful 404 | Error handling |
| **VERIF-09** | Large Thumbnail Rejection | Attempt to upload a 6MB JPEG thumbnail; verify that upload is rejected before Drive API call | Thumbnail validation |
| **VERIF-10** | Trashed File Reference Handling | Request streaming for `MEDIA-172872-RAW-1` (file in Trash); verify error handling when Drive returns trashed status | Dangling reference |
| **VERIF-11** | Direct Link Access Check | Access a `webViewLink` from an unauthenticated incognito browser; verify whether file is accessible or blocked | Drive sharing ACL |
| **VERIF-12** | Monotonic Version Increment | Upload Take 3 for `BP-CNT-000001`; verify that `version` increments to 3 and Take 1 and 2 remain intact | Versioning engine |
