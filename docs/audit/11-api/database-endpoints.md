# Database Endpoints Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 13 of 30  

---

## 1. Relational / SQL Database Involvement

A comprehensive code audit of all 271 endpoints confirms that **zero endpoints interact with a traditional SQL or relational database engine (e.g. PostgreSQL, MySQL, SQLite)**.
- **Authoritative Database**: Google Sheets operates as the sole persistent relational data store across all 18 entity tabs.
- **Local SQLite / Drizzle**: No active database connection pool, ORM entities, or SQL query drivers are mounted in `server.ts` or `src/server/routes.ts`.

---

## 2. In-Memory Mock & Cache Structures
Certain service functions maintain in-memory mock or cached arrays for test execution and offline fallback:
- `src/lib/services/question-draft.service.ts` maintains an in-memory `Map<string, QuestionDraft>` for un-persisted drafting sessions.
- `src/lib/services/durable-snapshot-archive.service.ts` reads and writes JSON files directly to disk for backup storage.
