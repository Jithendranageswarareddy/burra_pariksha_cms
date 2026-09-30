# Legacy & Deprecated Phase Endpoints Forensic Audit (23 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 24 of 30  

---

## 1. Legacy Phase Architecture Overview

During the progressive construction of BP-CMS, dedicated phase-specific namespaces were created. Many of these routes have since been superseded by unified domain endpoints but remain active in `src/server/routes.ts`:
- `/api/phase15/*` (Phase 15 Script Production Service) — 2 endpoints
- `/api/phase16/*` (Phase 16 Batch Generation Stubs) — 5 endpoints
- `/api/phase17/*` (Phase 17 Video Production Services) — 6 endpoints
- `/api/phase18/*` (Phase 18 Thumbnail Intelligence) — 10 endpoints

---

## 2. Legacy Endpoint Register (23 Endpoints)

| Endpoint Path | Method | Historical Phase | Modern Canonical Replacement | Status |
| :--- | :--- | :--- | :--- | :---: |
| `/api/phase15/script/generate` | `POST` | Phase 15 | `/api/scripts/ai-generate` | Deprecated Candidate |
| `/api/phase15/script/versions` | `GET` | Phase 15 | `/api/videos/:id/script-versions` | Deprecated Candidate |
| `/api/phase16/batch/plan` | `POST` | Phase 16 | `/api/planning/batches` | Deprecated Candidate |
| `/api/phase17/video/status` | `POST` | Phase 17 | `/api/videos/:id/status` | Deprecated Candidate |
| `/api/phase17/video/qc-check` | `POST` | Phase 17 | `/api/videos/:id/final-qc` | Deprecated Candidate |
| `/api/phase18/thumbnail/prompt` | `POST` | Phase 18 | `/api/thumbnails/ai-variants` | Deprecated Candidate |
| `/api/phase18/thumbnail/select` | `POST` | Phase 18 | `/api/videos/:id/thumbnail` | Deprecated Candidate |
