# Critical Service Traces Forensic Audit (5 Core Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 35 of 30  

---

## 1. Deep Forensic Traces

### Trace 1: `QuestionService.createQuestion()`
- **File**: `src/lib/services/question.service.ts:145`
- **Input**: `QuestionInputDTO`
- **Step 1**: Validates text length, language, difficulty enums.
- **Step 2**: Calls `sequenceSafetyService.allocateNextId('Q')` to receive `Q-1042`.
- **Step 3**: Formats row array according to `SHEET_TABS.QUESTIONS` schema contract.
- **Step 4**: Appends row to Google Sheets via `googleSheetsService.appendRow()`.
- **Step 5**: Calls `contentMasterService.createLinkedMaster(questionId)`.
- **Step 6**: Calls `auditService.logAction('CREATE_QUESTION')`.
- **Output**: Populated `Question` entity with status `PENDING_VERIFICATION`.
- **Risk**: If Step 5 fails on Google Sheets API rate limit, `QUESTIONS` has a row with no linked `CONTENT_MASTERS` row (Orphaned entity).

### Trace 2: `VideoService.recordTake()`
- **File**: `src/lib/services/video.service.ts:280`
- **Input**: `videoId`, `{ rawDriveUrl, takeNumber, notes }`
- **Step 1**: Asserts current video status is `READY_TO_RECORD` or `RECORDING`.
- **Step 2**: Calls `googleDriveService.verifyFileAccess(rawDriveUrl)`.
- **Step 3**: Updates `VIDEOS` sheet row: sets `raw_drive_url`, increments `take_count`, sets status to `RECORDED`.
- **Step 4**: Calls `auditService.logAction('RECORD_TAKE')`.
- **Output**: Updated `Video` entity.
