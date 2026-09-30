# Database ↔ Google Sheets Architectural Comparison

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 21 of 39  

---

## 1. Architectural Comparison Matrix

This document provides a rigorous architectural comparison between the **CURRENT Google Sheets Database Architecture** and an **Enterprise Relational Database (e.g. PostgreSQL / Google Cloud SQL)**:

| Architectural Dimension | Current Google Sheets Implementation | Standard Relational SQL Database (PostgreSQL) | Impact on BP-CMS |
| :--- | :--- | :--- | :--- |
| **Storage Model** | Remote spreadsheet tabs over HTTPS REST API | Local / Networked Relational Tables over TCP pool | Sheets adds 150-400ms HTTP latency per call |
| **Transactions (ACID)** | ❌ Zero atomic multi-table transactions | ✅ Full `BEGIN ... COMMIT / ROLLBACK` support | 19 multi-sheet cascades risk partial save corruption |
| **Referential Integrity**| ❌ No storage-level foreign keys | ✅ `FOREIGN KEY ... ON DELETE RESTRICT / CASCADE` | Deletion safety must be enforced 100% in app code |
| **Indexes & Scanning** | ❌ Zero indexes; `O(N)` full table memory scans | ✅ B-Tree, Hash, GIN, GiST indexes (`O(log N)`) | Full-sheet downloads limit scale to ~50K rows |
| **Concurrency / Locks** | ⚠️ In-memory single-process lock map | ✅ Row-level locks, table locks, MVCC | High risk of lost updates across Cloud Run instances |
| **Data Types** | ⚠️ Raw text cells with JSON serialization | ✅ Strongly typed columns, enums, JSONB | Corrupted text or JSON strings cause runtime crashes |
| **API Quotas / Limits** | ⚠️ 300 requests/min per project, 60 req/min/user | ✅ Thousands of queries/sec limited only by CPU/RAM| Concurrent operations trigger HTTP 429 errors |
| **Primary Keys** | ⚠️ App-generated sequence counter | ✅ Database sequences, `BIGSERIAL`, `UUID` | Concurrent creations can generate duplicate IDs |
| **Security / IAM** | ⚠️ Service account requires broad sheet editor role| ✅ Granular SQL role-based grants (`GRANT SELECT`) | Any compromised token grants full spreadsheet wipe |
| **Backup & Recovery** | ⚠️ Custom snapshot export to JSON/Drive | ✅ Automated PITR (Point-in-Time Recovery), WAL logs| Recovery requires complex sequential row overwrites |

---

## 2. Key Synthesis
Google Sheets provides an accessible, visual, and zero-infrastructure data browser for non-technical team members. However, as an application persistence tier, it introduces severe architectural bottlenecks: no ACID guarantees, severe throughput quotas, `O(N)` query latency, and total lack of storage constraints.
