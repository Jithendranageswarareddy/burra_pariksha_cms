# Master Service State Machine Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 39 of 30  

---

## 1. Master State Machine Transitions

| State Machine Entity | Current State | Target State | Authorized Service Method | Pre-Conditions Verified | Storage Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Question** | `DRAFT` | `PENDING_VERIFICATION` | `questionService.createQuestion()` | Schema validation passes | `QUESTIONS` |
| **Question** | `PENDING_VERIFICATION`| `VERIFIED` | `questionValidationService.verify()` | Score >= 80, role == SME | `QUESTIONS` |
| **Question** | `PENDING_VERIFICATION`| `REJECTED` | `questionValidationService.reject()` | Rejection reason provided | `QUESTIONS` |
| **Video** | `SCRIPTING` | `READY_TO_RECORD` | `scriptService.finalizeScript()` | Target duration <= 180s | `VIDEOS` |
| **Video** | `READY_TO_RECORD` | `RECORDED` | `videoService.recordTake()` | Valid Drive take URL | `VIDEOS` |
| **Video** | `RECORDED` | `EDITED` | `videoService.submitCut()` | Valid Drive cut URL | `VIDEOS` |
| **Video** | `EDITED` | `READY_TO_PUBLISH` | `videoService.signoffQc()` | 12-point QC checklist passes | `VIDEOS` |
| **Video** | `READY_TO_PUBLISH` | `SCHEDULED` | `publishingService.schedulePublishing()`| Future datetime specified | `VIDEOS` |
| **Video** | `SCHEDULED` | `PUBLISHED` | `publishingService.recordLiveUrl()` | Live platform ID recorded | `VIDEOS` |
