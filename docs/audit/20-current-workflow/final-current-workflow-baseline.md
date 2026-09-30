# Final Current Workflow Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 41 of 41  

---

## 1. Executive Forensic Synthesis

### Foundational Inquiries Answered:

1. **What workflow does the application actually execute today?**
   The application executes a **hybrid 15-stage conveyor workflow** anchored by `CANONICAL_15_STEPS` in the frontend, backed by an **11-state strict Video Production state machine** in `video.service.ts`, and operated across **7 unified workspace tabs** in `VideoDetailPage.tsx`.

2. **How much of the 15-stage workflow is implemented?**
   - **12 Stages (80.0%)** are **FULLY IMPLEMENTED** with complete frontend UI, backend APIs, domain services, and Google Sheets/Drive persistence.
   - **3 Stages (20.0%)** (Stages 12, 13, 15) are **PARTIALLY IMPLEMENTED** (UI components exist, but external social platform automation and feedback loopback rely on manual intervention or mock adapters).

3. **Is the QUEUED -> EDITING conflict still present?**
   **YES**. The backend state machine (`VALID_VIDEO_TRANSITIONS`) continues to prohibit `QUEUED -> EDITING`. The frontend actively circumvents this barrier in `RecordingWorkspace.tsx` by issuing **three sequential HTTP PATCH calls** (`QUEUED -> SCRIPT_READY -> RECORDED -> EDITING`) in a single user click.

4. **Does Video.status conflict with Question.videoStatus?**
   **YES**. `VideoService.transitionStatus()` executes an asynchronous secondary update to `Question.videoStatus` wrapped in a `try/catch` that swallows errors. When secondary writes fail, the two fields permanently diverge.

5. **Where do draft and canonical IDs differ?**
   Drafts (`BP-DFT-*`) exist in `QUESTION_DRAFTS` while canonical Questions (`BP-Q-*`) exist in `QUESTIONS`. When approved, the draft is deleted, but `QuestionVerifyApprovePage` fails to update the browser URL, causing an immediate 404 error if the user refreshes.

---

## 2. Canonical 15-Stage Implementation Summary

| Stage | Business Name | Actual Implementation | Status |
| :---: | :--- | :--- | :---: |
| **01** | Question Generation | AI Studio & Manual Drafts | FULLY IMPLEMENTED |
| **02** | Question Verification | 10-Point Pedagogical Audit & Auto-Queue | FULLY IMPLEMENTED |
| **03** | Audience Script | Script Workspace & Versioning | FULLY IMPLEMENTED |
| **04** | Teleprompter & Filming | Auto-Scroll Prompter & Recording Bay | FULLY IMPLEMENTED |
| **05** | Raw Video Handoff | Google Drive Multipart Upload | FULLY IMPLEMENTED |
| **06** | Video Editing Bay | Master Cut Linking & Subtitles | FULLY IMPLEMENTED |
| **07** | Final QC | 6-Point Master QC Checklist | FULLY IMPLEMENTED |
| **08** | Thumbnail Studio | 1080x1920 Upload & 5MB Validation | FULLY IMPLEMENTED |
| **09** | Social Review | 9:16 Smartphone Simulator | FULLY IMPLEMENTED |
| **10** | Publishing Setup | Gate D Checks & Platform Scheduling | FULLY IMPLEMENTED |
| **11** | Published / Live | Regex URL Verification & Metrics Init | FULLY IMPLEMENTED |
| **12** | Platform Sync | Package Preview (API Stubbed) | PARTIALLY IMPLEMENTED |
| **13** | Social Analytics | Manual Metric Entry (0 Webhooks) | PARTIALLY IMPLEMENTED |
| **14** | Performance Review | Aggregate Charts & Diagnostics | FULLY IMPLEMENTED |
| **15** | Intelligence Loop | Gemini Advisory Output | PARTIALLY IMPLEMENTED |

---

## 3. Unresolved Forensic Questions
1. What was the original architectural intent of the `QUESTION_VIDEOS` join worksheet given that `Video.questionId` already enforces a 1:1 foreign key?
2. Why is there no automated webhook worker configured to poll YouTube Data API v3 for live Shorts analytics?
