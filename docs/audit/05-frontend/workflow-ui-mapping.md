# 15-Stage Workflow UI Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Mapping Frontend Views to the 15 Canonical Stages

| Stage Number | Canonical Stage Name | Primary Frontend Page / Workspace | Stage Involvement Type |
| :---: | :--- | :--- | :---: |
| **01** | Question Generation | `QuestionStudioPage.tsx` / `PlanningPage.tsx` | **DIRECT** |
| **02** | Question Verification | `QuestionVerifyApprovePage.tsx` / `QuestionImprovePage.tsx` | **DIRECT** |
| **03** | Audience Script | `VideoCreateScriptPage.tsx` / `ScriptWorkspace.tsx` | **DIRECT** |
| **04** | Teleprompter & Filming | `RecordingWorkspace.tsx` (in `VideoDetailPage`) | **DIRECT** |
| **05** | Raw Video Ingestion | `RecordingWorkspace.tsx` (Footage upload panel) | **DIRECT** |
| **06** | Editing Bay | `EditingWorkspace.tsx` (in `VideoDetailPage`) | **DIRECT** |
| **07** | Final QC & Signoff | `FinalReviewWorkspace.tsx` (in `VideoDetailPage`) | **DIRECT** |
| **08** | Thumbnail Design | `ThumbnailWorkspace.tsx` (in `VideoDetailPage`) | **DIRECT** |
| **09** | Social Review & Comments | `SocialReviewPage.tsx` / `PinnedCommentWorkspace.tsx` | **DIRECT** |
| **10** | Publishing Setup | `PlatformPackagesPage.tsx` | **DIRECT** |
| **11** | Published | `PublishingPage.tsx` / `PublishingWorkspace.tsx` | **DIRECT** |
| **12** | Platform Sync | `PublishingPage.tsx` (Sync platform status) | **DIRECT** |
| **13** | Analytics Ingestion | `SocialAnalyticsPage.tsx` / `AnalyticsExperiencePage.tsx` | **DIRECT** |
| **14** | Performance Review | `AnalyticsExperiencePage.tsx` | **DIRECT** |
| **15** | Intelligence Loop | `PlanningPage.tsx` / `ContentMasterPage.tsx` | **DIRECT** |

---

## 2. Consolidation into Workspaces
All video production stages (Stages 03 to 09) have been successfully unified into specialized workspaces embedded inside `VideoDetailPage.tsx`, while earlier discrete pages remain unrouted.
