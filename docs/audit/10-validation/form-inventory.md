# Form & Data-Entry Surface Forensic Inventory (32 Surfaces)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 02 of 30  

---

## 1. Inventory Overview

Across 49 component and page source files, BP-CMS implements **32 discrete form and data-entry surfaces**. These surfaces encompass dedicated create/edit pages, consolidated tabbed workspaces within `VideoDetailPage.tsx`, interactive assignment modals, scheduling drawers, taxonomy tables with inline inputs, and recovery preflight dialogs.

---

## 2. Master Form Inventory Register

| Form ID | Form Name | Host File / Component | Route | Purpose | Role / User | Workflow Stage | Entity | Create / Edit / Review | Total Fields | Submit Handler | Persistence Target | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **FORM-01** | User Login | `src/pages/LoginPage.tsx` | `/login` | Authenticate user session | All Users | N/A | User Session | Create Session | 2 | `handleSubmit` | LocalStorage / Auth Service | CONFIRMED |
| **FORM-02** | Question Studio Wizard | `src/pages/QuestionStudioPage.tsx` | `/studio` | 4-step question authoring | SME / Creator | 01 Question Generation | Question | Create | 18 | `handleSaveQuestion` | `QUESTIONS` Sheet / DB | CONFIRMED |
| **FORM-03** | Question Verify & Approve | `src/pages/QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | Academic QC & verification | Lead / SME | 02 Question Verification | Question | Review / Edit | 3 | `handleApprove` / `handleReject` | `QUESTIONS` Sheet | CONFIRMED |
| **FORM-04** | Question Polish / Improve | `src/pages/QuestionImprovePage.tsx` | `/questions/:id/improve` | Academic question refinement | SME | 02 Question Verification | Question | Edit | 11 | `handleSaveDraft` | `QUESTIONS` Sheet | CONFIRMED |
| **FORM-05** | Question Detail Comment | `src/pages/QuestionDetailPage.tsx` | `/questions/:id` | Contextual note submission | SME / Admin | 01-03 Questions | Audit Note | Create | 1 | `handleAddNote` | `AUDIT_LOG` Sheet | CONFIRMED |
| **FORM-06** | Question Metadata Edit | `src/pages/QuestionDetailPage.tsx` | `/questions/:id` | Edit subject/difficulty tags | SME / Admin | 01-03 Questions | Question | Edit | 6 | `handleUpdateMetadata` | `QUESTIONS` Sheet | CONFIRMED |
| **FORM-07** | Script Teleprompter Editor | `src/components/video/ScriptWorkspace.tsx` | `/videos/:id?tab=script` | Spoken script authoring & cue timing | Scriptwriter | 03-05 Scripting | Script / Video | Create / Edit | 14 | `handleSaveScript` | `SCRIPT` / `SCRIPT_VERSIONS` | CONFIRMED |
| **FORM-08** | Legacy Script Review | `src/pages/VideoReviewScriptPage.tsx` | `/videos/:id/review-script` | Script review checklist | Reviewer | 04 Script Review | Script | Review | 8 | `handleReviewSubmit` | `SCRIPT` Sheet | CONFIRMED |
| **FORM-09** | Video Recording Workspace | `src/components/video/RecordingWorkspace.tsx` | `/videos/:id?tab=recording` | Take metadata & Drive URL entry | Presenter | 06-07 Video Recording | Video Take | Create / Edit | 5 | `handleSaveTake` | `VIDEOS` Sheet | CONFIRMED |
| **FORM-10** | Legacy Video Record Form | `src/pages/VideoRecordPage.tsx` | `/videos/:id/record` | Presenter take submission | Presenter | 06 Video Recording | Video Take | Create | 6 | `handleRecordSubmit` | `VIDEOS` Sheet | CONFIRMED |
| **FORM-11** | Video Editing Workspace | `src/components/video/EditingWorkspace.tsx` | `/videos/:id?tab=editing` | Edit Bay cut submission | Video Editor | 08 Video Editing | Video Edit | Create / Edit | 2 | `handleSubmitCut` | `VIDEOS` Sheet | CONFIRMED |
| **FORM-12** | Legacy Video Edit Form | `src/pages/VideoEditPage.tsx` | `/videos/:id/edit` | Video editor raw form | Video Editor | 08 Video Editing | Video Edit | Edit | 6 | `handleEditSubmit` | `VIDEOS` Sheet | CONFIRMED |
| **FORM-13** | Final Review 12-Pt QC | `src/components/video/FinalReviewWorkspace.tsx` | `/videos/:id?tab=final-review` | 12-point QC checklist & signoff | QA / Lead | 09 Final Review | Video QA | Review | 2 | `handleSignoff` | `VIDEOS` / `AUDIT_LOG` | CONFIRMED |
| **FORM-14** | Legacy Video Final QC | `src/pages/VideoFinalPage.tsx` | `/videos/:id/final` | Final approval submission | QA Lead | 09 Final Review | Video QA | Review | 3 | `handleFinalApproval` | `VIDEOS` Sheet | CONFIRMED |
| **FORM-15** | Thumbnail Workspace | `src/components/video/ThumbnailWorkspace.tsx` | `/videos/:id?tab=thumbnail` | Thumbnail URL & variant selection | Graphic Designer | 10 Thumbnail Creation | Thumbnail | Create / Edit | 4 | `handleSaveThumbnail` | `THUMBNAILS` Sheet | CONFIRMED |
| **FORM-16** | Legacy Thumbnail Form | `src/pages/VideoThumbnailPage.tsx` | `/videos/:id/thumbnail` | Thumbnail designer form | Designer | 10 Thumbnail Creation | Thumbnail | Create | 4 | `handleThumbnailSubmit`| `THUMBNAILS` Sheet | CONFIRMED |
| **FORM-17** | Pinned Comment Editor | `src/components/video/PinnedCommentWorkspace.tsx` | `/videos/:id?tab=pinned-comment`| Pinned comment & links | Community Mgr | 11 Pinned Comment | Pinned Comment | Create / Edit | 3 | `handleSaveComment` | `PINNED_COMMENTS` Sheet | CONFIRMED |
| **FORM-18** | Legacy Pinned Comment | `src/pages/VideoPinnedCommentPage.tsx` | `/videos/:id/pinned-comment`| Pinned comment form | Community Mgr | 11 Pinned Comment | Pinned Comment | Create | 4 | `handleCommentSubmit` | `PINNED_COMMENTS` Sheet | CONFIRMED |
| **FORM-19** | Social Review Workspace | `src/components/social/SocialReviewWorkspace.tsx` | `/social-review` | Engagement & platform review | Social Media Mgr | 12 Social Review | Social Review | Review | 1 | `handleApproveSocial` | `SOCIAL_REVIEWS` Sheet | CONFIRMED |
| **FORM-20** | Publishing Scheduler | `src/components/video/PublishingWorkspace.tsx` | `/videos/:id?tab=publishing` | Schedule across YouTube/IG/FB | Social Mgr / Lead | 13-14 Publishing | Publishing Record | Create / Schedule | 11 | `handleSchedulePublish`| `PUBLISHING` Sheet | CONFIRMED |
| **FORM-21** | Publish Schedule Modal | `src/components/publishing/PublishScheduleModal.tsx`| Modal overlay | Immediate publishing scheduling | Social Mgr | 13 Publishing Sched | Publishing Record | Schedule | 1 | `handleConfirmSchedule`| `PUBLISHING` Sheet | CONFIRMED |
| **FORM-22** | Record Publication Modal | `src/components/publishing/RecordPublicationModal.tsx`| Modal overlay | Live URL & platform ID entry | Social Mgr | 14 Live Publication | Publishing Record | Edit Live URL | 2 | `handleRecordLive` | `PUBLISHING` Sheet | CONFIRMED |
| **FORM-23** | Package Copier Modal | `src/components/publishing/PackageCopierModal.tsx` | Modal overlay | Copy package metadata | Social Mgr | 13 Publishing | Package Data | Review / Copy | 2 | `handleCopy` | Clipboard | CONFIRMED |
| **FORM-24** | Finalize Publishing Modal | `src/components/publishing/FinalizePublishingModal.tsx`| Modal overlay | Sign off all publishing channels | Admin / Lead | 15 Stage Complete | Publishing Status | Review | 1 | `handleFinalize` | `PUBLISHING` / `CONTENT_MASTERS` | CONFIRMED |
| **FORM-25** | Task Assignment Modal | `src/components/assignments/AssignmentModal.tsx` | Modal overlay | Assign task to team member | Manager / Lead | Workflow Mgmt | Assignment | Create | 9 | `handleCreateAssignment`| `ASSIGNMENTS` Sheet | CONFIRMED |
| **FORM-26** | Publishing Assign Modal | `src/components/publishing/PublishingAssignmentModal.tsx`| Modal overlay | Assign platform release owner | Manager | 13 Publishing | Assignment | Create | 5 | `handleAssign` | `ASSIGNMENTS` Sheet | CONFIRMED |
| **FORM-27** | Planning Batch Creator | `src/pages/PlanningPage.tsx` | `/planning` | Create curriculum batch plan | Content Planner | Planning | Content Batch | Create | 8 | `handleCreateBatch` | `CONTENT_BATCHES` Sheet | CONFIRMED |
| **FORM-28** | Planning Topic Manager | `src/pages/PlanningPage.tsx` | `/planning` | Edit syllabus subject & topic | Content Planner | Planning | Topic | Create / Edit | 5 | `handleSaveTopic` | `TOPICS` Sheet | CONFIRMED |
| **FORM-29** | Taxonomy Category Editor | `src/pages/SettingsPage.tsx` | `/settings` | Add/edit taxonomy categories | Administrator | Administration | Category | Create / Edit | 8 | `handleSaveTaxonomy` | `CATEGORIES` Sheet | CONFIRMED |
| **FORM-30** | Google Sheets Config | `src/pages/SettingsPage.tsx` | `/settings` | Update Spreadsheet ID & tabs | Administrator | Administration | System Config | Edit | 12 | `handleSaveSheetConfig`| `LocalSettings` / Env | CONFIRMED |
| **FORM-31** | Team Role Management | `src/pages/TeamOperationsPage.tsx` | `/team` | Reassign member operational roles | Manager / Admin | Administration | User Profile | Edit Role | 9 | `handleUpdateRole` | `USERS` Sheet | CONFIRMED |
| **FORM-32** | Recovery Preflight Form | `src/pages/RecoveryAdminPage.tsx` | `/recovery-admin` | Validate & execute restore snapshot | Super Admin | Disaster Recovery | Recovery Snapshot | Confirm / Restore | 8 | `handleExecuteRestore` | `durableSnapshotArchive` | CONFIRMED |
