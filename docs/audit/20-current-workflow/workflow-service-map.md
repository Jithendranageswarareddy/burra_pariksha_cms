# Workflow Service Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 26 of 41  

---

## 1. Domain Services Responsible for Stage Governance

| Stage | Primary Service | Secondary Supporting Services |
| :---: | :--- | :--- |
| **01** | `QuestionDraftService` | `TaxonomyService`, `SmartRandomService`, `GeminiClient` |
| **02** | `QuestionService` | `MultiLayerVerificationEngine`, `ContentMasterService`, `IdService` |
| **03** | `ScriptService` | `Phase15ScriptProductionService`, `AuditService` |
| **04** | `VideoService` | `WorkflowService`, `AssignmentService` |
| **05** | `GoogleDriveService` | `Phase14DriveService`, `VideoService` |
| **06** | `Phase14DriveService` | `VideoService`, `MediaAssetsRepository` |
| **07** | `ProductionAssetValidationService`| `VideoService`, `AuditService` |
| **08** | `ThumbnailService` | `Phase18ThumbnailIntelligenceService` |
| **09** | `SocialReviewService` | `Phase20SocialReviewService`, `Phase26CopilotService` |
| **10** | `PublishingService` | `Phase22PublishingHubService` |
| **11** | `PublishingService` | `AnalyticsService` |
| **12** | `PlatformAdaptationService` | `PublishingService` |
| **13** | `AnalyticsService` | `AuditService` |
| **14** | `AnalyticsService` | `SocialPerformanceIntelligenceService` |
| **15** | `SocialPerformanceIntelligenceService`| `GeminiClient`, `TaxonomyService` |
