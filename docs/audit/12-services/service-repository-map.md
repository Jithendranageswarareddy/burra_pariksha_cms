# Service to Repository Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 12 of 30  

---

## 1. Repository Architecture & Mediation

BP-CMS routes all persistent database operations through repository adapters that encapsulate Google Cloud APIs:
1. **Google Sheets Repository Adapter**: `src/lib/services/google-sheets.service.ts`
   - Implements generic methods: `getRows()`, `appendRow()`, `updateRow()`, `deleteRow()`, `batchUpdate()`.
2. **Google Drive Repository Adapter**: `src/lib/services/google-drive.service.ts`
   - Implements methods: `uploadFile()`, `getFileMetadata()`, `verifyFileAccess()`, `createFolder()`.
3. **Disaster Recovery Repository**: `src/lib/services/durable-snapshot-archive.service.ts`
   - Manages local filesystem and Cloud Storage snapshot archives.

---

## 2. Service to Repository Mapping Matrix (Sample)

| Domain Service | Repository Adapter Used | Primary Worksheet / Asset Target | Direct Storage Bypass? |
| :--- | :--- | :--- | :---: |
| `question.service.ts` | `googleSheetsService` | `QUESTIONS`, `CONTENT_MASTERS` | NO (Encapsulated) |
| `video.service.ts` | `googleSheetsService`, `googleDriveService` | `VIDEOS`, Google Drive Takes | NO (Encapsulated) |
| `script.service.ts` | `googleSheetsService` | `SCRIPT`, `SCRIPT_VERSIONS` | NO (Encapsulated) |
| `publishing.service.ts` | `googleSheetsService` | `PUBLISHING`, `AUDIT_LOG` | NO (Encapsulated) |
| `taxonomy.service.ts` | `googleSheetsService` | `CATEGORIES`, `TOPICS`, `SUBTOPICS`| NO (Encapsulated) |
| `assignment.service.ts` | `googleSheetsService` | `ASSIGNMENTS` | NO (Encapsulated) |
| `audit.service.ts` | `googleSheetsService` | `AUDIT_LOG` | NO (Encapsulated) |
