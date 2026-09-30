# Duplicate Endpoints Forensic Audit (14 Redundant Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 25 of 30  

---

## 1. Executive Summary

Static analysis discovered **14 duplicate or overlapping endpoint definitions** in `src/server/routes.ts`. These routes execute identical or near-identical business logic under differing URL paths.

---

## 2. Duplicate Endpoint Pairs Register

| Canonical Modern Route | Duplicate / Legacy Route | Method | Overlapping Entity | Risk / Architectural Finding |
| :--- | :--- | :---: | :--- | :--- |
| `/api/scripts/ai-generate` | `/api/phase15/script/generate` | `POST` | Spoken Script | Both invoke `scriptService.generateScript`; legacy route lacks teleprompter validation! |
| `/api/planning/batches` | `/api/phase16/batch/plan` | `POST` | Curriculum Batch | Redundant batch creation handlers; parameters differ slightly. |
| `/api/videos/:id/final-qc` | `/api/phase17/video/qc-check` | `POST` | Video Quality Control | Canonical route enforces 12-point QC checks; legacy bypasses checks! |
| `/api/videos/:id/thumbnail` | `/api/phase18/thumbnail/select`| `POST` | Video Thumbnail | Dual entry points for thumbnail association. |
| `/api/questions/search` | `/api/search/questions` | `GET` | Question Library | Duplicate search queries with differing query parameter names. |
| `/api/team/members` | `/api/users` | `GET` | User Profiles | Both query `USERS` sheet tab; one returns raw rows, other filtered active users. |
| `/api/publishing/schedule` | `/api/videos/:id/publish` | `POST` | Publishing Schedule | Dual publishing trigger paths with divergent payload structures. |
