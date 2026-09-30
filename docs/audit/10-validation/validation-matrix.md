# Master Validation Matrix (Machine-Readable Rule Catalog)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 24 of 30  

---

## 1. Machine-Readable Validation Matrix

| Rule ID | Entity | Target Field | Validation Rule Specification | Client Enforcement | Server Enforcement | Database Constraint | Authoritative Owner | Duplicated? | Conflict? | Bypass? | Error Message Displayed | Confidence |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **VAL-R01** | Question | `questionText` | String length between 10 and 500 chars | YES | YES | YES | `question.service.ts` | YES | NO | NO | "Question text must be 10-500 characters" | CONFIRMED |
| **VAL-R02** | Question | `optionA..D` | Options A, B, C, D must all be distinct | YES | NO | NO | `QuestionStudioPage.tsx` | NO | YES | YES | "Answer options must be unique" | CONFIRMED |
| **VAL-R03** | Question | `subjectId` | Must match existing Category ID | YES | YES | YES | `taxonomy.service.ts` | YES | NO | NO | "Valid subject is required" | CONFIRMED |
| **VAL-R04** | Question | `topicId` | Must match existing Topic ID under subject | YES | YES | YES | `taxonomy.service.ts` | YES | NO | NO | "Valid topic is required" | CONFIRMED |
| **VAL-R05** | Question | `correctOption`| Value must be one of 'A', 'B', 'C', 'D' | YES | YES | YES | `QuestionStudioPage.tsx` | YES | NO | NO | "Select correct answer option" | CONFIRMED |
| **VAL-R06** | Question | `explanation` | String length >= 10 characters | YES | YES | YES | `question.service.ts` | YES | NO | NO | "Explanation must be at least 10 characters" | CONFIRMED |
| **VAL-R07** | Script | `targetDuration`| Integer duration between 30 and 180 seconds | YES | NO | YES | `script.service.ts` | YES | YES | YES | "Target duration must be 30-180 seconds" | CONFIRMED |
| **VAL-R08** | Video | `rawDriveUrl` | Must be valid URL containing drive.google.com | YES | YES | YES | `routes.ts` | YES | NO | NO | "Valid Google Drive URL required" | CONFIRMED |
| **VAL-R09** | Video | `editedDriveUrl`| Must be valid URL containing drive.google.com | YES | YES | YES | `routes.ts` | YES | NO | NO | "Valid Google Drive cut URL required" | CONFIRMED |
| **VAL-R10** | Video | QC Checklist | All 12 Quality Control items must be true | YES | NO | NO | `FinalReviewWorkspace.tsx` | NO | YES | YES | "All QC checks must pass before signoff" | CONFIRMED |
| **VAL-R11** | Publishing| `scheduledTime`| Valid future ISO-8601 timestamp string | YES | NO | YES | `google-sheets-schema.ts` | YES | YES | YES | "Schedule time must be in the future" | CONFIRMED |
| **VAL-R12** | Settings | `spreadsheetId`| Valid alphanumeric Google Sheets ID | YES | YES | NO | `SettingsPage.tsx` | YES | NO | NO | "Invalid Spreadsheet ID format" | CONFIRMED |
| **VAL-R13** | Recovery | `confirmText` | String strictly equal to 'RESTORE-SNAPSHOT' | YES | NO | NO | `RecoveryAdminPage.tsx` | NO | YES | YES | "Type RESTORE-SNAPSHOT to confirm" | CONFIRMED |
