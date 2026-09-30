# State Data-Flow Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 24 of 35  

---

## 1. State Machine Transitions & Divergence Vectors

The system contains 3 primary state enums:
1. **QuestionStatus:** `DRAFT`, `GENERATED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`
2. **VideoProductionStatus:** `NOT_STARTED`, `QUEUED`, `SCRIPT_REQUIRED`, `SCRIPT_READY`, `RECORDING`, `RECORDED`, `EDITING`, `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `UPLOADED`, `ON_HOLD`, `CANCELLED`
3. **SocialPublishStatus:** `NOT_STARTED`, `SCHEDULED`, `PUBLISHED`, `FAILED`

### The `Video.status` vs `Question.videoStatus` Divergence:
- **Where Created:** `video.service.ts:315` updates both `Video.status` and `Question.videoStatus` to `QUEUED`.
- **Where Mutated:** `VideoService.transitionStatus()` updates `Video.status` in `VIDEOS` tab, then executes a separate asynchronous write to `Question.videoStatus` in `QUESTIONS` tab.
- **Divergence Evidence:** If the second write encounters a network timeout, quota limit, or error, the error is swallowed with:
  ```typescript
  console.warn(`Failed to synchronize question status for video "${videoId}":`, syncErr);
  ```
- **Result:** `Video.status` is `EDITING`, but `Question.videoStatus` remains `QUEUED`. Different UI surfaces display conflicting statuses.
