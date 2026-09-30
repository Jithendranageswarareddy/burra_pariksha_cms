# Dual-Write Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 17 of 35  

---

## 1. Dual-Write Operations Across Subsystems

Dual-write occurs when a single user operation updates two or more separate persistent stores without a two-phase commit (2PC) or distributed transaction coordinator.

### Catalog of Critical Dual Writes:

1. **Question Creation (`QuestionService.createQuestionFromRequest`):**
   - **Write 1:** `contentMasterService.createContentMaster()` -> `CONTENT_MASTERS` worksheet.
   - **Write 2:** `questionsRepository.appendRecord()` -> `QUESTIONS` worksheet.
   - **Failure Point:** If Write 2 fails, code executes compensation delete on Write 1. If compensation delete fails, orphan `ContentMaster` is permanently created.
   - **Transaction Boundary:** ABSENT.

2. **Video Queueing (`VideoService.queueApprovedQuestion`):**
   - **Write 1:** `videosRepository.appendRecord()` -> `VIDEOS` worksheet.
   - **Write 2:** `questionVideosRepository.appendRecord()` -> `QUESTION_VIDEOS` worksheet.
   - **Write 3:** `questionsRepository.updateRecord()` -> `QUESTIONS` worksheet (updates `videoStatus`).
   - **Failure Point:** If Write 2 or Write 3 fails, Video exists in `VIDEOS`, but Question still appears un-queued or join record is missing.
   - **Transaction Boundary:** ABSENT.

3. **Video Upload (`handleVideoUploadRoute`):**
   - **Write 1:** `GoogleDriveService.uploadFile()` -> Google Drive API v3 binary file creation.
   - **Write 2:** `videosRepository.updateRecord()` -> `VIDEOS` worksheet (`driveFileId`).
   - **Failure Point:** If Write 2 fails, binary file is uploaded to Drive with zero referencing record in Sheets.
   - **Transaction Boundary:** ABSENT.

4. **Script Versioning (`ScriptService.saveScript`):**
   - **Write 1:** `scriptsRepository.updateRecord()` -> `SCRIPTS` worksheet.
   - **Write 2:** `scriptVersionsRepository.appendRecord()` -> `SCRIPT_VERSIONS` worksheet.
   - **Failure Point:** If Write 2 fails, Script content is updated but version history entry is lost.
   - **Transaction Boundary:** ABSENT.
