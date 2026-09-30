# Service Side-Effects Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 22 of 30  

---

## 1. Side-Effect Scope Classification

Services are classified based on the number and severity of side effects triggered by their primary methods:
- **COMPLEX (3+ cascading writes + external APIs)**: 8 services (`PublishingService`, `VideoService`, `QuestionService`, `RestoreExecutionService`, etc.)
- **HIGH (2-3 cascading Sheet writes)**: 11 services (`AssignmentService`, `ScriptService`, `PlanningService`)
- **MEDIUM (Single Sheet write + Audit log)**: 21 services (`TaxonomyService`, `AuthService`, `ThumbnailService`)
- **LOW / READ-ONLY**: 32 services (Analytics, Dashboard, Preflight, Search)

---

## 2. Top Side-Effect Chains

```
videoService.signoffQc(videoId)
  ├── 1. Read current video record from VIDEOS tab
  ├── 2. Assert 12-point QC checklist passes
  ├── 3. Update video status to READY_TO_PUBLISH in VIDEOS tab
  ├── 4. Advance conveyor state in WORKFLOW tab
  ├── 5. Query active social managers in USERS tab
  ├── 6. Create publishing assignment task in ASSIGNMENTS tab
  └── 7. Append audit transaction record to AUDIT_LOG tab
```
