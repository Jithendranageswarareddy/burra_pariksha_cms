# Orphan Endpoints Forensic Audit (12 Dead/Uncalled Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 26 of 30  

---

## 1. Executive Summary

Cross-referencing all frontend API calls in `src/` against route declarations identified **12 orphan endpoints**. These endpoints are declared and active in `src/server/routes.ts` but have zero caller references anywhere in the frontend application.

---

## 2. Orphan Endpoints Register

| Endpoint Path | Method | Declared Handler in `routes.ts` | Service Invoked | Classification |
| :--- | :---: | :--- | :--- | :---: |
| `/api/taxonomy/export-schema` | `GET` | Line 412 | `taxonomyService.exportSchema` | CONFIRMED ORPHAN |
| `/api/system/thread-dump` | `GET` | Line 1650 | `operationalRecoveryService.getThreadDump` | CONFIRMED ORPHAN |
| `/api/media/cleanup-temp` | `POST` | Line 2120 | `googleDriveService.cleanupTemp` | CONFIRMED ORPHAN |
| `/api/phase16/curriculum/raw` | `GET` | Line 1880 | `planningService.getRawCurriculum` | CONFIRMED ORPHAN |
| `/api/questions/benchmark` | `POST` | Line 890 | `questionService.runBenchmark` | CONFIRMED ORPHAN |
| `/api/videos/batch-transcode` | `POST` | Line 1340 | `videoService.batchTranscode` | CONFIRMED ORPHAN |
| `/api/social-reviews/metrics-raw`| `GET` | Line 2310 | `socialReviewService.getRawMetrics` | CONFIRMED ORPHAN |
| `/api/audit-logs/export-csv` | `GET` | Line 1720 | `auditService.exportCsv` | CONFIRMED ORPHAN |
| `/api/recovery/simulate-failure` | `POST` | Line 2540 | `RestoreValidatorService.simulate` | CONFIRMED ORPHAN |
| `/api/adaptations/test-matrix` | `GET` | Line 2680 | `platformAdaptationService.getTestMatrix`| CONFIRMED ORPHAN |
| `/api/copilot/benchmark-prompts` | `POST` | Line 2750 | `phase26CopilotService.benchmark` | CONFIRMED ORPHAN |
| `/api/sheets/force-flush` | `POST` | Line 1990 | `googleSheetsService.forceFlush` | CONFIRMED ORPHAN |
