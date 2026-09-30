# Service-Layer Problem Register (28 Classified Findings)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 41 of 30  

---

## 1. Master Forensic Problem Register

| Problem ID | Classification | Severity | Target Service / Component | Specific Finding Description | Evidence Location |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **SVC-001** | Responsibility Ambiguity | **MEDIUM** | `planning.service.ts` | Blends academic curriculum planning with raw batch scheduling and AI generation | `planning.service.ts:1-850` |
| **SVC-002** | Multiple Responsibilities | **HIGH** | `video.service.ts` | Manages video production takes, edit submissions, QC signoffs, and assignment generation | `video.service.ts:1-920` |
| **SVC-003** | Potential God Service | **HIGH** | `publishing.service.ts` | 2,168 lines; handles social formatting, hashtag parsing, YouTube API, and sheet status | `publishing.service.ts:1-2168` |
| **SVC-004** | High Coupling | **HIGH** | `data-integrity.service.ts` | Directly coupled to all 18 Google Sheets tabs; any schema change breaks repair methods | `data-integrity.service.ts` |
| **SVC-005** | Low Cohesion | **HIGH** | `dashboard.service.ts` | Combines pipeline KPI math, UI chart formatting, and cross-sheet relation parsing | `dashboard.service.ts:1-1425` |
| **SVC-006** | Duplicate Logic | **MEDIUM** | `script.service` vs `phase15` | Duplicate spoken teleprompter pacing formulas with divergent WPM constants | `script.service.ts:120` |
| **SVC-007** | Duplicate Service | **MEDIUM** | `thumbnail.service` vs `phase18`| Dual thumbnail generation services active simultaneously | `thumbnail.service.ts` |
| **SVC-008** | Legacy Service | **MEDIUM** | Phase 12-25 Services (11 services) | Phase-specific service files retained alongside modern canonical domain services | `src/lib/services/` |
| **SVC-009** | Orphan Service | **LOW** | `similarity.service.ts` | Vector/Levenshtein question duplicate detector has zero callers in codebase | `similarity.service.ts` |
| **SVC-010** | Circular Dependency | **NONE** | All Services | Zero circular service dependencies found | `service-dependency-graph.md` |
| **SVC-011** | Excessive Service Chain | **MEDIUM** | Publishing Flow | 5-tier call chain: `routes` -> `publishing` -> `platform` -> `video` -> `sheets` | `publishing.service.ts` |
| **SVC-012** | Controller Logic Duplication | **HIGH** | `routes.ts` (Video status) | Route handler implements inline status validation instead of delegating to `videoService` | `routes.ts:740` |
| **SVC-013** | Repository Bypass | **NONE** | All Services | Zero repository bypasses; all services call storage adapters | `service-repository-map.md` |
| **SVC-014** | Direct Storage Access | **NONE** | Domain Services | Zero domain services invoke raw Google API SDKs directly | `service-repository-boundary.md` |
| **SVC-015** | Frontend Coupling | **LOW** | `dashboard.service.ts` | Returns UI chart color hex codes and component-specific prop models | `dashboard.service.ts:310` |
| **SVC-016** | External Integration Coupling | **HIGH** | `publishing.service.ts` | Tightly couples YouTube Data API SDK into core publishing scheduling logic | `publishing.service.ts:1450` |
| **SVC-017** | Workflow Logic Conflict | **CRITICAL** | `video.service.ts` (Status update)| Generic `updateStatus` method permits skipping stages without gating checks | `video.service.ts:412` |
| **SVC-018** | State Ownership Conflict | **CRITICAL** | Video `status` column | Mutated independently by `videoService`, `scriptService`, and `publishingService` | `service-state-ownership.md` |
| **SVC-019** | Duplicate State Writer | **HIGH** | Question `status` | Modified by `questionService`, `questionValidationService`, and `phase13Service` | `service-state-ownership.md` |
| **SVC-020** | Validation Duplication | **MEDIUM** | Required fields | Required checks duplicated across Zod schemas, services, and route handlers | `service-validation.md` |
| **SVC-021** | Business Rule Duplication | **MEDIUM** | Script Pacing | Word count duration calculated independently in service and in `ScriptWorkspace` | `ScriptWorkspace.tsx:140` |
| **SVC-022** | Partial Transaction Risk | **CRITICAL** | `questionService.createQuestion` | `QUESTIONS` write succeeds, `CONTENT_MASTERS` write fails on quota; orphaned entity | `question.service.ts:180` |
| **SVC-023** | Error Handling Problem | **HIGH** | `dashboard.service.ts` | Catches database read timeout and silently returns zeroed metrics | `dashboard.service.ts:240` |
| **SVC-024** | Retry / Idempotency Risk | **CRITICAL** | `questionService.createQuestion` | Retrying on network timeout allocates duplicate sequential question ID | `sequence-safety.service.ts` |
| **SVC-025** | Excessive Side Effects | **HIGH** | `videoService.signoffQc` | Single method triggers 4 sequential writes across 4 different sheet tabs | `video.service.ts:510` |
| **SVC-026** | AI Service Boundary Problem | **HIGH** | `phase26-copilot.service.ts` | Directly reads and writes Google Sheets tabs instead of using domain services | `phase26-copilot.service.ts:410` |
| **SVC-027** | Persistence Responsibility | **HIGH** | `FullSnapshotRestoreExecutionService`| Wipes 18 sheets sequentially without backup verification or rollback | `full-snapshot-restore-execution.service.ts` |
| **SVC-028** | Requires Runtime Verification | **MEDIUM** | Exponential Backoff | Behavior of Google Sheets 429 retry loop under sustained concurrency | `google-sheets.service.ts:95` |
