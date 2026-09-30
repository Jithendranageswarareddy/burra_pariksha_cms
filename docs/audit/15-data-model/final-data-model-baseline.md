# Final Data Model Baseline & Reconciliation Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 51 of 51  

---

## 1. Executive Forensic Verdict

The current data model of BP-CMS is **100% reliant on Google Sheets as an improvised tabular database**, complemented by **Google Drive for binary media asset storage**:

- **28 distinct entities** exist across the application.
- **11 core business entities** represent the primary domain lifecycle.
- **0 relational SQL databases** exist in the architecture.
- **25 authoritative Google Sheets worksheet tabs** store all tabular data.
- While the conceptual model is rich and well-structured, **physical implementation suffers from lack of ACID transactions, absence of storage-level foreign keys, duplicated state columns, and competing uncoordinated writers**.

---

## 2. Strategic Convergence Recommendations for Future Implementation

1. **Migrate Tabular Store to Cloud SQL (PostgreSQL):** Replace Google Sheets with a relational database to achieve true ACID transactions, row-level concurrency locks, and enforceable foreign keys.
2. **Eliminate Duplicated State Columns:** Remove `video_status` from `QUESTIONS` sheet; establish `VIDEOS.status` as the sole single source of truth.
3. **Centralize Sequence Allocation in Database:** Replace in-memory sheet mutexes with native PostgreSQL sequences (`SERIAL` / `BIGSERIAL`).
4. **Implement Optimistic Concurrency:** Add `row_version` integers across all mutable entity tables.
5. **Synchronize Drive Media References:** Ensure every Drive upload writes atomically to `MEDIA_ASSETS` before returning URLs.
