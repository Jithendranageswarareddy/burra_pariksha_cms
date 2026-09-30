# Service State Changes & Status Mutation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 10 of 30  

---

## 1. Entity State Mutations Summary

**50 domain services** execute state changes on persistent entities. State changes modify enum status columns in Google Sheets:
- `QuestionStatus`: `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `POLISHED`, `ARCHIVED`
- `VideoProductionStatus`: `SCRIPTING`, `READY_TO_RECORD`, `RECORDED`, `EDITING`, `EDITED`, `FINAL_REVIEW`, `READY_TO_PUBLISH`, `PUBLISHED`
- `SocialPublishStatus`: `UNSCHEDULED`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`
- `ContentMasterStatus`: `PLANNING`, `IN_PRODUCTION`, `COMPLETED`, `ARCHIVED`

---

## 2. Master State Mutation Register (Sample)

| Entity | State Field | Transition From -> To | Mutating Service | Mutating Method | Persistence Sheet |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Question | `status` | `DRAFT` -> `PENDING_VERIFICATION` | `question.service.ts` | `createQuestion` | `QUESTIONS` |
| Question | `status` | `PENDING_VERIFICATION` -> `VERIFIED` | `question-validation.service.ts` | `verifyQuestion` | `QUESTIONS` |
| Question | `status` | `PENDING_VERIFICATION` -> `REJECTED` | `question-validation.service.ts` | `rejectQuestion` | `QUESTIONS` |
| Video | `status` | `SCRIPTING` -> `READY_TO_RECORD` | `script.service.ts` | `finalizeScript` | `VIDEOS` |
| Video | `status` | `READY_TO_RECORD` -> `RECORDED` | `video.service.ts` | `recordTake` | `VIDEOS` |
| Video | `status` | `RECORDED` -> `EDITED` | `video.service.ts` | `submitCut` | `VIDEOS` |
| Video | `status` | `FINAL_REVIEW` -> `READY_TO_PUBLISH` | `video.service.ts` | `signoffQc` | `VIDEOS` |
| Publishing | `status` | `UNSCHEDULED` -> `SCHEDULED` | `publishing.service.ts` | `schedulePublishing`| `PUBLISHING` |
| Publishing | `status` | `SCHEDULED` -> `PUBLISHED` | `publishing.service.ts` | `recordLiveUrl` | `PUBLISHING` |
