# Consistency Model Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 29 of 35  

---

## 1. Entity Consistency Classifications

| Consistency Model | Entities / Operations | Architectural Rationale |
| :--- | :--- | :--- |
| **Strong Consistency (Single Sheet)** | Question CRUD, User CRUD, Category CRUD | Single atomic HTTP append or row overwrite to Google Sheets. |
| **Eventual Consistency (Cache TTL)** | In-memory reads (`rowCache`, `cachedHeaders`) | Bounded by 2,500ms row cache and 60,000ms header cache. |
| **Best-Effort Consistency (Dual Writes)** | Video status -> Question sync; Script versioning | Secondary writes are non-atomic; errors are swallowed or uncoordinated. |
| **Weak / Broken Consistency (Drive-Sheets)** | Media asset upload and deletion | Zero two-phase commit between Drive API and Sheets API. |
| **Manual Consistency (Denormalized Data)** | `Question.categoryName`, `topicName` | Taxonomy renames never cascade to denormalized question fields. |
