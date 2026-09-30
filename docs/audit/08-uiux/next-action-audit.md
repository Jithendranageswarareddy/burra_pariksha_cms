# "Next Action" Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 22 of 30  

---

## 1. Next Action Architecture

In a conveyor belt content pipeline, operator velocity depends on a clear, singular, unambiguous **Next Meaningful Action**.
This document evaluates the primary forward CTA on every workflow-relevant surface.

---

## 2. Page-by-Page Next Action Analysis

| Page / Workspace | Stage | Current Primary Next Action CTA | Target Destination | Competing Secondary Actions | Clarity Score |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `QuestionStudioPage` | 01 | "Save & Continue to Verification" | `/questions/:id/verify` | "Generate AI Batch", "Save Draft" | 75% (Competing CTA) |
| `QuestionVerifyApprove`| 02 | "Approve Question & Launch Production"| `/videos/:id?tab=script` | "Reject Question" (Danger CTA) | 100% (Clear gate) |
| `ScriptWorkspace` | 03 | "Approve Script & Advance to Filming" | `/videos/:id?tab=recording` | "Save Draft Script", "AI Enhance" | 90% (Good hierarchy) |
| `RecordingWorkspace`| 04/05| "Raw Footage Uploaded - Begin Edit"| `/videos/:id?tab=editing` | "Add Take", "Launch Teleprompter" | 85% (Prompter popup) |
| `EditingWorkspace` | 06 | "Submit Cut for Executive Review" | `/videos/:id?tab=final-review`| "Save Draft Cut" | 100% (Clear handoff) |
| `FinalReviewWorkspace`| 07 | "Approve Video & Design Thumbnail" | `/videos/:id?tab=thumbnail` | "Reject Cut & Log Defect" | 100% (Clear gate) |
| `ThumbnailWorkspace` | 08 | "Approve Thumbnail & Package" | `/videos/:id?tab=social` | "Generate Variations" | 90% (Good hierarchy) |
| `SocialSimulatorWorkspace`| 09| "Approve Social Package" | `/videos/:id?tab=publishing` | "Edit Telugu Hashtags" | 90% (Clear progression)|
| `PublishingWorkspace`| 10 | "Schedule Multi-Platform Broadcast"| `/publishing` | "Save Distribution Draft" | 95% (Clear launch) |
| `PublishingPage` | 11/12| "Verify Live Broadcasts" | External Links (YouTube/IG)| "Export Sync Report" | 90% (Outbound links) |
| `AnalyticsExperience`| 13-15| "Apply Intelligence to Next Batch"| `/planning` | 10 sub-tab filters | 80% (Passive review) |
