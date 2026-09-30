# Google Drive Binary Data Model Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 40 of 51  

---

## 1. Drive Directory Hierarchy

Google Drive acts as the binary blob store for all video takes, cut renders, and thumbnail images. Assets are structured in a defined folder tree:

```
[BURRA PARIKSHA PRODUCTION ROOT]
  |-- /01_RAW_FOOTAGE/          (Camera takes uploaded by talent)
  |-- /02_EDITED_CUTS/          (Rendered vertical 9:16 video files)
  |-- /03_THUMBNAILS/           (720x1280 JPEG/PNG graphics)
  |-- /04_PROMPTER_SCRIPTS/     (Exported teleprompter text files)
  |-- /05_SNAPSHOT_ARCHIVES/    (ZIP dumps of Google Sheets database)
```

---

## 2. Drive Metadata vs Physical Blobs
- Google Drive stores file metadata (`fileId`, `name`, `mimeType`, `size`, `createdTime`).
- The application links Drive files via the string property `driveFileId` in Sheets (`VIDEOS.drive_file_id`, `MEDIA_ASSETS.drive_file_id`).
- *Dangling Reference Risk:* Deleting a file in Drive leaves the `driveFileId` intact in Sheets, causing 404 stream/download errors on the frontend.
