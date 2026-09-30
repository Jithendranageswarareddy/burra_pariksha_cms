# 15-Stage Workflow UI Surface Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 27 of 30  

---

## 1. Workflow Surface Mapping Overview

This document maps the 15 canonical production stages to the concrete UI pages and workspace tabs that operationalize them.

---

## 2. Definitive Stage-to-Surface Map

```
STAGE 01: Question Generation
  - Primary UI: src/pages/QuestionStudioPage.tsx (/studio)
  - Pre-planning: src/pages/PlanningPage.tsx (/planning)
  - Primary Action: "Save & Continue to Verification" -> Stage 02

STAGE 02: Question Verification
  - Primary UI: src/pages/QuestionVerifyApprovePage.tsx (/questions/:id/verify)
  - Primary Action: "Approve Question & Launch Production" -> Stage 03

STAGE 03: Audience Scriptwriting
  - Primary UI: src/components/video/ScriptWorkspace.tsx (/videos/:id?tab=script)
  - Legacy Standalone: src/pages/VideoCreateScriptPage.tsx (/videos/create-script)
  - Primary Action: "Approve Script & Advance to Filming" -> Stage 04

STAGE 04: Teleprompter Preparation
  - Primary UI: src/pages/QueuePage.tsx (/queue) & /videos/:id?tab=recording
  - Primary Action: "Launch Teleprompter" -> Stage 05

STAGE 05: Raw Video Filming
  - Primary UI: src/components/video/RecordingWorkspace.tsx (/videos/:id?tab=recording)
  - Primary Action: "Raw Footage Uploaded - Begin Edit" -> Stage 06

STAGE 06: Video Editing Bay
  - Primary UI: src/components/video/EditingWorkspace.tsx (/videos/:id?tab=editing)
  - Primary Action: "Submit Cut for Executive Review" -> Stage 07

STAGE 07: Final QC Review
  - Primary UI: src/components/video/FinalReviewWorkspace.tsx (/videos/:id?tab=final-review)
  - Primary Action: "Approve Video & Design Thumbnail" -> Stage 08

STAGE 08: Thumbnail Studio
  - Primary UI: src/components/video/ThumbnailWorkspace.tsx (/videos/:id?tab=thumbnail)
  - Primary Action: "Approve Thumbnail & Package" -> Stage 09

STAGE 09: Social Gatekeeper Review
  - Primary UI: src/pages/SocialReviewPage.tsx (/social-review) & /videos/:id?tab=social
  - Primary Action: "Approve Social Package" -> Stage 10

STAGE 10: Publishing Setup & Packaging
  - Primary UI: src/pages/PlatformPackagesPage.tsx & /videos/:id?tab=publishing
  - Primary Action: "Schedule Multi-Platform Broadcast" -> Stage 11

STAGE 11: Published & Live Verification
  - Primary UI: src/pages/PublishingPage.tsx (/publishing)
  - Primary Action: "Verify Live Multi-Platform Sync" -> Stage 12

STAGE 12: Platform Sync Check
  - Primary UI: src/pages/PublishingPage.tsx & PlatformPackagesPage.tsx
  - Primary Action: "Confirm Channel Sync" -> Stage 13

STAGE 13: Social Analytics
  - Primary UI: src/pages/SocialAnalyticsPage.tsx (/social-analytics)
  - Primary Action: "Review Comments & Misconceptions" -> Stage 14

STAGE 14: Performance Review
  - Primary UI: src/pages/AnalyticsExperiencePage.tsx (/analytics/video, /retention)
  - Primary Action: "Extract Retention Insights" -> Stage 15

STAGE 15: Pedagogical Intelligence Loop
  - Primary UI: src/pages/AnalyticsExperiencePage.tsx (/analytics/intelligence)
  - Primary Action: "Apply Intelligence to Next Batch" -> Loops back to Stage 01!
```
