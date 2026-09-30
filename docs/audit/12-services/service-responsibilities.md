# Service Responsibilities & Single-Responsibility Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 03 of 30  

---

## 1. Functional Responsibility Distribution

The 72 services in BP-CMS cover the following primary operational domains:
- **Questions & Pedagogy**: 6 services (QuestionService, QuestionDraftService, QuestionConfigService, SmartRandomService, etc.)
- **Video & Studio Production**: 8 services (VideoService, ScriptService, ThumbnailService, PinnedCommentService, etc.)
- **Publishing & Social Distribution**: 7 services (PublishingService, SocialReviewService, SocialCommentsService, etc.)
- **Workflow & Conveyor Gating**: 9 services (WorkflowService, AssignmentService, ProductionBoardService, etc.)
- **Disaster Recovery & Snapshots**: 18 services (Snapshot exporter, scheduler, preflight, granular restores)
- **Infrastructure & Adapters**: 6 services (GoogleSheetsService, GoogleDriveService, AuthService, AuditService)
- **AI & Copilot Orchestration**: 7 services (GeminiService, CopilotService, CommentIntelligenceService, etc.)
- **Legacy Phase Services**: 11 services (Phase 12 through Phase 25 modules)

---

## 2. Single-Responsibility Principle (SRP) Compliance

| SRP Classification | Service Count | Characteristics | Examples |
| :--- | :---: | :--- | :--- |
| **Single Responsibility (Cohesive)** | 48 | One entity, clear bounded context, cohesive methods | `ScriptService`, `TaxonomyService`, `AuthService` |
| **Moderately Broad** | 16 | Covers entity lifecycle plus cross-cutting audit/workflow | `QuestionService`, `AssignmentService` |
| **Broad / Multiple Responsibilities** | 4 | Orchestrates across multiple unrelated entity domains | `PlanningService`, `PlatformAdaptationService` |
| **Potential God Services** | 4 | 1,000+ lines, 50+ methods, touches 4+ worksheets & states | `PublishingService`, `DataIntegrityService`, `DashboardService`, `VideoService` |
