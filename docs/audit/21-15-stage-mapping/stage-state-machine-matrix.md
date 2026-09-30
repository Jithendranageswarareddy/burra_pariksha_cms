# Stage-to-State-Machine Mapping Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 23 of 31  

---

## 1. Controlling State Machines Across Stages

| Stage | Controlling State Machine | Relevant Status Enum | Authoritative Transition Gate |
| :---: | :--- | :--- | :--- |
| **01** | Question Draft Lifecycle | `QuestionStatus.DRAFT` | `QuestionDraftService.saveDraft` |
| **02** | Question & Video Queue Machines | `QuestionStatus.APPROVED`, `VideoProductionStatus.QUEUED` | `MultiLayerVerificationEngine.verify` |
| **03** | Video Production Machine | `VideoProductionStatus.SCRIPT_READY` | `ScriptService.saveScript` |
| **04** | Video Production Machine | `VideoProductionStatus.RECORDING` | `VideoService.transitionStatus` |
| **05** | Video Production Machine | `VideoProductionStatus.RECORDED` | `GoogleDriveService.uploadFile` |
| **06** | Video Production Machine | `VideoProductionStatus.EDITING` -> `EDITED` | `VideoService.transitionStatus` |
| **07** | Video Production Machine | `VideoProductionStatus.READY_TO_UPLOAD` | `ProductionAssetValidationService` |
| **08** | Thumbnail Lifecycle | `ThumbnailStatus.APPROVED` | `ThumbnailService.saveThumbnail` |
| **09** | Social Review Lifecycle | `SocialReviewStatus.APPROVED` | `SocialReviewService.saveSocialReview` |
| **10** | Social Publishing Machine | `SocialPublishStatus.SCHEDULED` | `PublishingService.schedulePublishing` |
| **11** | Social Publishing Machine | `SocialPublishStatus.PUBLISHED` | `PublishingService.markPlatformPublished`|
| **12** | Platform Sync Lifecycle | `PlatformAdaptationStatus.SYNCED` | Simulated / Manual toggle |
| **13** | Immutable Append Log | Metric Row Created | `AnalyticsService.recordAnalyticsSnapshot`|
| **14** | Deterministic Aggregator | Derived / Calculated | In-memory aggregation functions |
| **15** | Intelligence Lifecycle | Advisory State | `SocialPerformanceIntelligenceService` |
