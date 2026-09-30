# API Idempotency Forensic Audit (16 Risk Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 21 of 30  

---

## 1. Executive Summary

Idempotency ensures that executing a request multiple times produces the identical outcome without duplicate side effects.
An audit of all 122 `POST` endpoints revealed that **zero endpoints implement Idempotency-Key headers**. Mutating endpoints rely solely on application state guards or duplicate checks in service memory.

---

## 2. High-Risk Non-Idempotent Endpoints Register

| Endpoint Path | Method | Operation | Risk of Duplicate Execution | Severity |
| :--- | :--- | :--- | :--- | :---: |
| `/api/questions` | `POST` | Create Question | Sequential double-click allocates two distinct `Q-xxxx` IDs | **CRITICAL** |
| `/api/videos/:id/record` | `POST` | Record Video Take | Retrying take submission increments `take_count` twice | **HIGH** |
| `/api/publishing/schedule` | `POST` | Schedule Publish | Double submission creates duplicate scheduled tasks | **CRITICAL** |
| `/api/assignments/create` | `POST` | Create Assignment | Creates duplicate assignment rows in `ASSIGNMENTS` sheet | **MEDIUM** |
| `/api/planning/batches` | `POST` | Generate Batch | Creates duplicate curriculum batches with identical topics | **HIGH** |
| `/api/social-comments/import`| `POST` | Bulk Import | Re-importing CSV without deduplication doubles comment counts | **MEDIUM** |
