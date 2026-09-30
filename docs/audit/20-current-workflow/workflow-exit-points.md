# Workflow Exit Points

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 05 of 41  

---

## 1. Terminal Lifecycle States & Exit Points

| Terminal State | Affected Entity | State Machine | Exit Trigger | Storage Modified | Downstream Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PUBLISHED** | Video / Publishing | `SocialPublishStatus` | All platforms live | `PUBLISHING` + `ANALYTICS` | Moves to Analytics tracking |
| **CANCELLED** | Video | `VideoProductionStatus` | User cancellation | `VIDEOS` + `QUESTIONS` | Terminal; resets Question to allow re-queue |
| **REJECTED** | Question / Draft | `QuestionStatus` | Failed verification | `QUESTIONS` tab | Returned to Studio or Archived |
| **ARCHIVED** | Question | `QuestionStatus` | Deletion safety / Archive | `QUESTIONS` tab | Hidden from production lists |
| **ON_HOLD** | Video | `VideoProductionStatus` | Blocked asset | `VIDEOS` tab | Non-terminal; can resume |
