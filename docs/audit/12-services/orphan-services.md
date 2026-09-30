# Orphan Services Forensic Audit (9 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 34 of 30  

---

## 1. Executive Summary

Static code analysis cross-referencing all 270 API routes and all frontend components in `src/` identified **9 orphan services** that have zero external consumers:

| Orphan Service Name | File Path | Exports | Classification | Notes / Evidence |
| :--- | :--- | :--- | :---: | :--- |
| `SimilarityService` | `similarity.service.ts` | `SimilarityService` | CONFIRMED ORPHAN | Vector/Levenshtein question duplicate detector; never called |
| `Phase25ConsensusService`| `phase25-consensus.service.ts`| `Phase25ConsensusService` | CONFIRMED ORPHAN | Multi-agent consensus engine; no active API route |
| `ProductionSheetInitializer`| `production-sheet-initializer.service.ts`| `ProductionSheetInitializer` | POSSIBLE ORPHAN | One-off migration script; unreferenced in runtime |
| `GranularScriptRestoreService`| `granular-script-restore.service.ts`| `GranularScriptRestoreService`| POSSIBLE ORPHAN | Granular restore endpoint calls full restore instead |
| `GranularThumbnailRestoreService`| `granular-thumbnail-restore.service.ts`| `GranularThumbnailRestoreService`| POSSIBLE ORPHAN | Granular restore endpoint calls full restore instead |
| `RestoreValidatorService` | `restore-validator.service.ts`| `RestoreValidatorService` | CONFIRMED ORPHAN | Preflight validation handled by `fullSnapshotPreflight` |
| `SmartRandomService` | `smart-random.service.ts` | `SmartRandomService` | CONFIRMED ORPHAN | Studio page uses direct Math.random instead of service |
| `SnapshotSchedulerService`| `snapshot-scheduler.service.ts`| `SnapshotSchedulerService`| CONFIRMED ORPHAN | Automated cron backup scheduler not registered in Express |
| `Phase12WorkflowService` | `phase12-workflow.service.ts`| `Phase12WorkflowService` | CONFIRMED ORPHAN | Superseded completely by `workflow.service.ts` |
