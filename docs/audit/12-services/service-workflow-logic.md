# Service Workflow Logic Forensic Audit (15-Stage Conveyor Gating)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 09 of 30  

---

## 1. 15-Stage Conveyor Implementation

BP-CMS structures content production along a linear 15-stage conveyor. **34 domain services** contain workflow logic that gates, advances, or tracks these stages:

| Stage # | Stage Name | Governing Service | Primary Transition Method | State Invariant Enforced |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Question Generation | `question.service.ts` | `createQuestion()` | Status: `PENDING_VERIFICATION` |
| **02** | Question Verification | `question-validation.service.ts` | `verifyQuestion()` | Score >= 80 required to approve |
| **03** | Audience Script | `script.service.ts` | `saveScript()` | Target duration <= 180s |
| **04** | Teleprompter & Filming| `phase15-script-production.service`| `startTeleprompter()` | Status: `READY_TO_RECORD` |
| **05** | Raw Video | `video.service.ts` | `recordTake()` | Valid Google Drive raw URL required |
| **06** | Editing Bay | `video.service.ts` | `submitCut()` | Valid Google Drive edit URL required |
| **07** | Final QC | `video.service.ts` | `signoffQc()` | 12-point QC checklist must be 100% true |
| **08** | Thumbnail Creation | `thumbnail.service.ts` | `saveThumbnail()` | Valid image URL; status `THUMBNAIL_READY` |
| **09** | Pinned Comment | `pinned-comment.service.ts` | `saveComment()` | Pinned text non-empty; links validated |
| **10** | Social Review | `social-review.service.ts` | `approveSocial()` | Platform hooks and hashtags approved |
| **11** | Publishing Setup | `publishing.service.ts` | `schedulePublishing()` | Future ISO timestamp, credentials valid |
| **12** | Published | `publishing.service.ts` | `recordLiveUrl()` | Live platform post ID & URL recorded |
| **13** | Platform Sync | `publishing.service.ts` | `syncPlatformStatus()` | External YouTube/IG status queried |
| **14** | Analytics | `analytics.service.ts` | `collectMetrics()` | Views, likes, retention metrics captured |
| **15** | Intelligence Loop | `comment-intelligence.service.ts` | `clusterQuestions()` | Viewer comments mapped to new questions |
