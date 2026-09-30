# Multiple-Source Entity Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 32 of 51  

---

## 1. Split-Storage Entities

Five entities are stored across multiple disconnected storage systems simultaneously:

1. **Video Production Entity:**
   - Metadata & Status: Stored in Google Sheets tab `VIDEOS`.
   - Raw Binary Take: Stored in Google Drive `RAW` folder.
   - Edited Binary Cut: Stored in Google Drive `EDITED` folder.
   - *Synchronization Risk:* If a video file is moved, renamed, or deleted in Google Drive directly via Google Drive web UI, the `drive_file_id` in `VIDEOS` sheet becomes a broken dangling reference.

2. **Thumbnail Entity:**
   - Review Status & Concept Prompt: Stored in Google Sheets tab `THUMBNAILS`.
   - JPEG Image Binary: Stored in Google Drive `THUMBNAILS` folder.
   - Candidate Generation Prompts: Stored in ephemeral application memory.

3. **Media Asset Entity:**
   - Physical Asset: Google Drive.
   - Asset Audit Record: Google Sheets tab `MEDIA_ASSETS`.
