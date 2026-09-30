# Repository & Data Access Layer Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 10 of 30  

---

## 1. Repository Architecture

In BP-CMS, data access is mediated through specialized repository classes and service adapters that encapsulate Google Sheets row read/write operations:
- **Core Sheets Repository Adapter**: `src/lib/services/google-sheets.service.ts`
- **Authoritative Schema Contracts**: `src/lib/schemas/google-sheets-schema.ts`
- **Sequence Safety Repository**: `src/lib/services/sequence-safety.service.ts`
- **Audit Logging Repository**: `src/lib/services/audit.service.ts`

---

## 2. Service to Repository Trace Register

| Domain Service | Underlying Repository / Adapter | Primary Sheet / Table | Access Mode |
| :--- | :--- | :--- | :---: |
| `questionService` | `googleSheetsService` | `QUESTIONS`, `CONTENT_MASTERS` | Read / Write |
| `videoService` | `googleSheetsService` | `VIDEOS`, `WORKFLOW` | Read / Write |
| `scriptService` | `googleSheetsService` | `SCRIPT`, `SCRIPT_VERSIONS` | Read / Write |
| `thumbnailService` | `googleSheetsService` | `THUMBNAILS`, `THUMBNAIL_VERSIONS`| Read / Write |
| `publishingService` | `googleSheetsService` | `PUBLISHING` | Read / Write |
| `assignmentService` | `googleSheetsService` | `ASSIGNMENTS` | Read / Write |
| `taxonomyService` | `googleSheetsService` | `CATEGORIES`, `TOPICS`, `SUBTOPICS`| Read / Write |
| `auditService` | `googleSheetsService` | `AUDIT_LOG` | Append Only |
| `recoveryService` | `durableSnapshotArchive` | Local Filesystem / GCS | Read / Write |
