# Orphan File & Dangling Reference Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 25 of 40  

---

## 1. Classification of Orphan Conditions

The audit investigated three distinct orphan scenarios:
1. **Orphan Drive File:** A physical file in Google Drive with zero entity references in Google Sheets.
2. **Dangling Sheet Reference:** A `driveFileId` in Google Sheets that references a deleted or non-existent Drive file.
3. **Synthetic Reference:** A hardcoded mock ID (`fixed_drive_file_id_12345`) stored in production Google Sheets.

---

## 2. Forensic Findings from Live Inspection

### 1. Dangling Sheet References (Confirmed)
- In `MEDIA_ASSETS` tab: `MEDIA-172872-RAW-1` (`1La1zcgjPW7whpuCo3fp2qJrNqIx2rb-p`) and `MEDIA-172872-RAW-2` (`1_BHViPhsSObQtX-Wnwoy1tpRvjvWYdV4`).
- Both files were moved to Google Drive Trash during automated test cleanup, leaving the Google Sheets rows pointing to deleted files.
- Calling `GET /api/videos/BP-V-172872/stream` fails with HTTP 404.

### 2. Synthetic Mock Contamination (Confirmed)
- In `MEDIA_ASSETS` tab: rows for `BP-CNT-731056`, `BP-CNT-561774`, and `BP-CNT-743611` contain `driveFileId: fixed_drive_file_id_12345`.
- In `VIDEOS` tab: `BP-V-731056`, `BP-V-561774`, `BP-V-743611` contain `fixed_drive_file_id_12345`.
- Any attempt to play or download these videos crashes with `File not found`.

### 3. Orphan Entities (Confirmed)
- `BP-V-372937` has `status: EDITING` but `driveFileId: undefined`. A video entered the editing bay without raw footage.
