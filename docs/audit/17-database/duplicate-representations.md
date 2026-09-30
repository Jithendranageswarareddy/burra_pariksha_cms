# Duplicate Representation Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 26 of 39  

---

## 1. Verified Duplicate Representations

A forensic audit identified four major areas where the same business entity or relationship is duplicated across multiple storage representations:

### 1. Dual Content Master Identifiers: `contentId` vs `contentMasterId`
- `contentId`: Legacy string identifier used in Phase 1-11 (e.g. `CNT-001`).
- `contentMasterId`: Canonical formatted business ID introduced in Phase 12 (e.g. `BP-CNT-000001`).
- **Location:** Both exist as columns in `VIDEOS`, `CONTENT_MASTERS`, and `SOCIAL_REVIEWS`.
- **Classification:** **ACTIVE DUPLICATE / COMPATIBILITY HAZARD**.

### 2. Many-to-Many Video Linkage: `QUESTION_VIDEOS` vs `QUESTIONS.video_ids`
- Representation A: Tab `QUESTION_VIDEOS` storing individual link rows `{ id, question_id, video_id, created_at }`.
- Representation B: Column `QUESTIONS.video_ids` storing a serialized JSON array `["BP-V-000001", "BP-V-000002"]`.
- **Classification:** **REDUNDANT DATA REPRESENTATION**.

### 3. Dual Canonical Workflow States
- Model A: `src/lib/workflow/canonical-workflow.ts` (7 states: NOT_STARTED, IN_PROGRESS, COMPLETED, REVISION_REQUIRED, REJECTED, BLOCKED, ESCALATED).
- Model B: `src/lib/services/workflow-orchestration.service.ts` (11 states: DRAFT, VALIDATED, READY_FOR_REVIEW, CHANGES_REQUESTED, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED, IN_PRODUCTION, IN_REVIEW, READY_TO_PUBLISH).
- **Classification:** **DIVERGENT ARCHITECTURAL MODELS**.

### 4. Thumbnail Representations: Sheet Record vs Google Drive File
- A thumbnail exists simultaneously as a row in `THUMBNAILS` sheet, a row in `THUMBNAIL_VERSIONS`, and a binary JPEG/PNG in Google Drive folder.
