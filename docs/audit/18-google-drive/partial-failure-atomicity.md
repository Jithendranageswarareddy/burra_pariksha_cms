# Partial Failure & Storage Atomicity Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 34 of 40  

---

## 1. Dual-Tier Transaction Vulnerability

Uploading a media asset requires coordinating two independent external systems:
1. **Google Drive API:** Binary asset creation (`drive.files.create`).
2. **Google Sheets API:** Tabular metadata append/update (`appendRow` / `updateRow`).

```
Step 1: Upload to Google Drive (SUCCEEDS -> File ID allocated)
Step 2: Append to Google Sheets (FAILS -> Network timeout / 429 quota error)
```

---

## 2. Inconsistent Rollback Implementations

A forensic comparison of rollback behavior across services reveals major inconsistencies:

| Service / Method | Rollback Implemented on Sheets Failure? | Rollback Code | Consequence on Failure |
| :--- | :---: | :--- | :--- |
| `thumbnailService.uploadThumbnailAsset` | **YES** | `await googleDriveService.deleteFile(driveFile.fileId)` | Clean rollback; file deleted from Drive |
| `phase14DriveService.uploadProductionAsset` | **YES** | `await googleDriveService.deleteFile(driveFileId)` | Clean rollback; file deleted from Drive |
| `videoService.uploadVideoAsset` | ❌ **NO** | `catch (err) { throw new Error(...); }` | **ORPHAN FILE:** Binary file remains permanently in Drive with no Sheet record |

**Critical Finding:** In `video.service.ts:1010`, when Google Sheets fails to persist video metadata after a successful Drive upload, the uploaded video file is **NOT deleted**, permanently littering Google Drive with untracked orphan video files.
