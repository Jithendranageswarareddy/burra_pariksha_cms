# Google Drive & Media File Action Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 16 of 30  

---

## 1. Google Drive Integration Architecture

Media file operations route through `src/lib/services/google-drive.service.ts` using server-to-server OAuth2 credentials:
- **Root Folder**: `BP_ROOT_DRIVE_FOLDER`
- **Subfolders**: `01_RAW_FOOTAGE`, `02_ROUGH_CUTS`, `03_FINAL_CUTS`, `04_THUMBNAILS`, `05_SOCIAL_PACKAGES`

---

## 2. Media Action Trace Register

| Action ID | Triggering Action | Drive Operation | Target Folder | Handled File Types | Stored Metadata |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACT-REC-01` | Record / Ingest Take | `createOrUpdateFile()` | `01_RAW_FOOTAGE` | `.mp4`, `.mov` | Take #, Duration, Presenter ID |
| `ACT-EDIT-01` | Submit Rough Cut | `verifyFileAccess()` | `02_ROUGH_CUTS` | `.mp4` | Resolution, Bitrate, Editor ID |
| `ACT-THUM-01` | Save Thumbnail | `uploadImage()` | `04_THUMBNAILS` | `.png`, `.jpg` | 1080x1920 (9:16), Size, Contrast |
| `ACT-PUB-01` | Dispatch Release | `exportPublicDownload()`| `05_SOCIAL_PACKAGES`| Zip package | Platform-specific video bundles |
