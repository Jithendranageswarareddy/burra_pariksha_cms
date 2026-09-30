# Workflow Model Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 14 of 41  

---

## 1. Master Inventory of Workflow Models

| Model ID | Model Name | Stage Count | Primary Code Location | Active Consumers | Storage Subsystem | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **WM-01** | Canonical Production Journey | 15 | `src/lib/workflow/canonical-workflow.ts` | JourneyBar, Navigation | `WORKFLOW_TRANSITIONS` | **ACTIVE CORE** |
| **WM-02** | Video Production State Machine | 11 | `src/lib/services/video.service.ts` | `VideoService`, Routes | `VIDEOS` Tab | **ACTIVE CORE** |
| **WM-03** | Question Verification Engine | 10 | `question-validation.engine.ts` | `QuestionVerifyApprovePage` | `VALIDATIONS` Tab | **ACTIVE CORE** |
| **WM-04** | Unified Video Workspace Tabs | 7 | `src/pages/VideoDetailPage.tsx` | Frontend Workspace | UI State / Query Param | **ACTIVE CORE** |
| **WM-05** | Question Lifecycle Enum | 6 | `src/types/index.ts:QuestionStatus` | `QuestionService` | `QUESTIONS` Tab | **ACTIVE CORE** |
| **WM-06** | Social Publishing State Machine | 4 | `src/types/index.ts:SocialPublishStatus` | `PublishingService` | `PUBLISHING` Tab | **ACTIVE CORE** |
| **WM-07** | Master QC Checklist Gate | 6 | `production-asset-validation.service.ts`| FinalReviewWorkspace | Computed Gate | **ACTIVE CORE** |
