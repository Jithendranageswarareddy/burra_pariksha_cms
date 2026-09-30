# Partial Failure Data-Flow Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 28 of 35  

---

## 1. Multi-Step Cascades & Partial Failure Points

Because Google Sheets API v4 and Google Drive API v3 lack distributed transaction coordination, cascading operations present failure modes where step $N$ succeeds but step $N+1$ fails.

### Detailed Failure Walkthroughs:

1. **Question Creation Cascade:**
   - **Step 1:** `allocateQuestionId()` allocates `BP-Q-000005` on `SEQUENCES` sheet. (SUCCESS)
   - **Step 2:** `createContentMaster()` creates `BP-CNT-000005` on `CONTENT_MASTERS`. (SUCCESS)
   - **Step 3:** `questionsRepository.appendRecord()` fails due to Google Sheets 503 error. (FAILURE)
   - **Compensation:** Code catches error and calls `contentMastersRepository.delete(masterId)`.
   - **Vulnerability:** If the compensation delete also fails, `BP-CNT-000005` remains an orphaned Content Master pointing to non-existent Question `BP-Q-000005`.

2. **Video Queueing Cascade:**
   - **Step 1:** `videosRepository.appendRecord()` writes to `VIDEOS` sheet. (SUCCESS)
   - **Step 2:** `questionVideosRepository.appendRecord()` fails. (FAILURE)
   - **Step 3:** `questionsRepository.updateRecord()` never runs. (ABORTED)
   - **Result:** Video `BP-V-000001` exists in production, but Question `BP-Q-000001` still displays as un-queued in lists.

3. **Video Upload Cascade:**
   - **Step 1:** `GoogleDriveService.uploadFile()` streams 50MB to Google Drive. (SUCCESS - File ID created)
   - **Step 2:** `videosRepository.updateRecord(id, { driveFileId })` fails. (FAILURE)
   - **Result:** Google Drive stores the file, but BP-CMS has zero record of the file ID. File is permanently orphaned.
