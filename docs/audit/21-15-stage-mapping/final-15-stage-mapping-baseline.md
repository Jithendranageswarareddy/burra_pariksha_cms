# Final 15-Stage Mapping Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 31 of 31  

---

## 1. Executive Forensic Verdict

> **"Can the current application be mapped cleanly to the canonical 15-stage business workflow?"**  
> **FORENSIC VERDICT: PARTIALLY**

### Evidence-Based Synthesis:
1. **Structural Convergence (80% Implemented):**
   - 12 of the 15 canonical stages exist with full end-to-end functionality (UI, REST routes, domain services, Google Sheets/Drive persistence).
   - The conceptual journey stepper (`ProductionJourneyBar.tsx` and `CANONICAL_15_STEPS`) explicitly declares and models all 15 stages.
2. **Implementation Compression:**
   - Stages 03 through 08 are physically compressed inside tabbed workspaces of a single page (`VideoDetailPage.tsx`), rather than having dedicated standalone routes.
3. **State Machine Friction:**
   - The backend `VALID_VIDEO_TRANSITIONS` state machine has only 11 states and does not cleanly map 1:1 to the 15 business stages.
   - The direct transition from `QUEUED` to `EDITING` is strictly illegal, forcing the frontend to execute a **3-step sequential API jump** in `RecordingWorkspace.tsx`.
4. **Automation Voids in Late Stages:**
   - Stage 12 (Platform Sync) and Stage 13 (Analytics Ingestion) lack automated third-party OAuth background workers and rely on simulated UI toggles or manual human data entry.
   - Stage 15 (Intelligence Loop) generates real advisory reports via Gemini LLM, but loopback to Stage 01 is semi-automated via URL query parameters.

---

## 2. Canonical 15-Stage Baseline Specification Table

| Stage | Business Name | Implemented Component | Authoritative Storage | State Value | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **01** | Question Generation | `QuestionStudioPage.tsx` | `QUESTION_DRAFTS` Sheet | `DRAFT` | **FULLY IMPLEMENTED** |
| **02** | Question Verification | `QuestionVerifyApprovePage.tsx`| `QUESTIONS` Sheet | `APPROVED` | **FULLY IMPLEMENTED** |
| **03** | Audience Script | `ScriptWorkspace.tsx` | `SCRIPTS` Sheet | `SCRIPT_READY` | **FULLY IMPLEMENTED** |
| **04** | Teleprompter & Filming| `RecordingWorkspace.tsx` | `VIDEOS` Sheet | `RECORDING` | **FULLY IMPLEMENTED** |
| **05** | Raw Video Handoff | `RecordingWorkspace.tsx` | Google Drive + `MEDIA_ASSETS`| `RECORDED` | **FULLY IMPLEMENTED** |
| **06** | Video Editing Bay | `EditingWorkspace.tsx` | Google Drive + `VIDEOS` | `EDITED` | **FULLY IMPLEMENTED** |
| **07** | Final QC | `FinalReviewWorkspace.tsx` | `VIDEOS` Sheet | `READY_TO_UPLOAD` | **FULLY IMPLEMENTED** |
| **08** | Thumbnail Studio | `ThumbnailWorkspace.tsx` | Google Drive + `THUMBNAILS` | `APPROVED` | **FULLY IMPLEMENTED** |
| **09** | Social Review | `SocialReviewPage.tsx` | `SOCIAL_REVIEWS` Sheet | `APPROVED` | **FULLY IMPLEMENTED** |
| **10** | Publishing Setup | `PublishingPage.tsx` | `PUBLISHING` Sheet | `SCHEDULED` | **FULLY IMPLEMENTED** |
| **11** | Published / Live | `PublishingPage.tsx` | `PUBLISHING` Sheet | `PUBLISHED` | **FULLY IMPLEMENTED** |
| **12** | Platform Sync | `PlatformPackagesPage.tsx` | `PLATFORM_SYNC_LOGS` Sheet | `SYNCED` | **PARTIALLY IMPLEMENTED**|
| **13** | Social Analytics | `SocialAnalyticsPage.tsx` | `ANALYTICS` Sheet | Metric Row | **PARTIALLY IMPLEMENTED**|
| **14** | Performance Review | `AnalyticsExperiencePage.tsx` | `ANALYTICS` (Computed) | Aggregated | **FULLY IMPLEMENTED** |
| **15** | Intelligence Loop | `AnalyticsExperiencePage.tsx` | `ANALYTICS_INTELLIGENCE` | `ADVISORY` | **PARTIALLY IMPLEMENTED**|
