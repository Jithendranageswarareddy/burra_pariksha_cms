# Source-of-Truth & Data-Flow Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 33 of 35  

---

## 1. Classified Problem Findings

| Finding ID | Classification | Severity | Affected Scope | Root Cause & Description |
| :--- | :--- | :---: | :--- | :--- |
| **SOT-CRIT-01** | Dual State Authority | **CRITICAL** | `Video.status` & `Question.videoStatus` | State synchronization is non-atomic and swallows errors; creates irreconcilable status divergence between production and listing views. |
| **SOT-CRIT-02** | Cross-Tier Non-Atomicity | **CRITICAL** | Google Drive + Google Sheets | Uploading to Drive and saving metadata to Sheets lacks two-phase commit; failed sheet updates orphan large media files in Drive. |
| **SOT-CRIT-03** | Volatile Session Authority | **CRITICAL** | User Authentication & JWTs | Active session versions reside in Node.js process RAM; Cloud Run container restarts or multi-instance scaling invalidate or bifurcate sessions. |
| **SOT-CRIT-04** | Process-Bound Sequence Mutex | **CRITICAL** | Sequence Allocation (`IdService`)| In-memory promise queue cannot prevent duplicate sequence IDs across multiple Cloud Run container instances. |
| **SOT-HIGH-01** | Test Artifact Contamination | **HIGH** | Production Google Sheets | Integration tests write directly to production spreadsheets without isolated IDs, polluting production reads. |
| **SOT-HIGH-02** | Dual Drive Folder Conventions| **HIGH** | Google Drive Folder Layout | Phase 7 layout (`Content/BP-CNT/Videos`) competes with Phase 14 layout (`BP-CNT/Raw`), fragmenting media asset lookups. |
| **SOT-HIGH-03** | Missing Storage Foreign Keys | **HIGH** | Cross-Entity Relationships | Google Sheets provides zero relational constraints; dangling references occur on manual sheet row deletion. |
| **SOT-HIGH-04** | Unsynchronized Local Cache | **HIGH** | `GoogleSheetsClient.rowCache`| Multi-container Cloud Run instances serve stale data within 2.5s window without cross-instance invalidation bus. |
| **SOT-MED-01** | Denormalized Taxonomy Drift | **MEDIUM** | `Question.topicName` / `categoryName` | Renaming topics in `TOPICS` sheet does not propagate to historical questions. |
| **SOT-MED-02** | Redundant Join Storage | **MEDIUM** | `Video.questionId` & `QUESTION_VIDEOS`| 1:1 relationship is persisted redundantly in both entity row and separate join table. |
