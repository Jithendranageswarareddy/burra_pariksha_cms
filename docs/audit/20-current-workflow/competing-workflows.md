# Competing Workflow Models

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 13 of 41  

---

## 1. Analysis of Competing Workflow Engines

BP-CMS contains 3 competing conceptual workflow models active concurrently:

### Model 1: The Canonical 15-Stage Journey (`CANONICAL_15_STEPS`)
- **Scope:** Complete lifecycle from Question Generation to Intelligence Loop.
- **States:** 7 Canonical States (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `REVISION_REQUIRED`, `REJECTED`, `BLOCKED`, `ESCALATED`).
- **Surface:** `ProductionJourneyBar.tsx` and `ProductionJourneyContext.tsx`.

### Model 2: The Video Production State Machine (`VALID_VIDEO_TRANSITIONS`)
- **Scope:** Production bays inside `VideoDetailPage.tsx` (Script -> Video -> QC).
- **States:** 11 Strict States (`NOT_STARTED`, `QUEUED`, `SCRIPT_REQUIRED`, `SCRIPT_READY`, `RECORDING`, `RECORDED`, `EDITING`, `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `UPLOADED`).
- **Surface:** Backend `video.service.ts:59-75`.

### Model 3: The 7-Workspace UI Tab Model
- **Scope:** `VideoDetailPage.tsx` tab navigation (`script`, `recording`, `editing`, `final-review`, `thumbnail`, `social`, `publishing`).
- **Surface:** React `activeTab` state in `VideoDetailPage.tsx`.
