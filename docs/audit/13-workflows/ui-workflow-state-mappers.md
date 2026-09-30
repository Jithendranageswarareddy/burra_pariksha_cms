# UI Workflow State Mappers Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 25 of 30  

---

## 1. Role of Client-Side State Mappers

Because backend entity statuses (`QuestionStatus`, `VideoProductionStatus`) are fine-grained, `src/lib/workflow/canonical-workflow.ts` provides client-side mapper functions that project entity states into the 15-stage conveyor states (`CanonicalWorkflowState`):

- `mapQuestionToWorkflowState(question)`: Maps question to Stages 01 and 02.
- `mapVideoToWorkflowState(video, script, thumbnail)`: Maps video, script, and thumbnail to Stages 03 through 08.
- `mapSocialReviewToWorkflowState(bundle)`: Maps social review bundle to Stage 10.
- `mapPublishingToWorkflowState(publishing, video)`: Maps publishing record to Stages 10, 11, and 12.

---

## 2. Forensic Logic Inspection of `mapVideoToWorkflowState`

Inspecting lines 85–180 of `canonical-workflow.ts`:
- **Stage 03 (Script):** Marked `COMPLETED` if `script.status === 'APPROVED'` OR if video is in any status from `RECORDING` to `UPLOADED`. Marked `IN_PROGRESS` if `SCRIPT_REQUIRED` or `QUEUED`.
- **Stage 05 (Raw Video):** Marked `COMPLETED` if `video.driveFileId` or `rawFootagePath` is present. If not, marked `BLOCKED`.
- **Stage 06 (Editing):** Marked `COMPLETED` if `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, or `UPLOADED`.
- **Stage 07 (Final QC):** Marked `COMPLETED` if `READY_TO_UPLOAD` or `UPLOADED`.

**Finding:** The mapper correctly derives stage indicators for UI presentation, but because it is client-side, it cannot prevent a compromised or buggy client from sending invalid API requests directly to the server.
