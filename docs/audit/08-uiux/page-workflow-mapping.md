# Page Workflow Stage Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 05 of 30  

---

## 1. The 15 Canonical Workflow Stages

The definitive Burra Pariksha production conveyor belt is defined in `01-product-truth.md`:
- **Stage 01:** Question Generation (Curriculum mapping, draft question statement, options, proof)
- **Stage 02:** Question Verification (Academic audit, distractor analysis, verification signoff)
- **Stage 03:** Audience Scriptwriting (Translating academic proof into spoken script)
- **Stage 04:** Teleprompter Preparation (Pacing, spoken phonetic cues, prompter staging)
- **Stage 05:** Raw Video Filming (Studio media capture, multi-take recording)
- **Stage 06:** Video Editing Bay (Rough cut sequencing, graphics, B-roll, audio leveling)
- **Stage 07:** Final QC Review (Quality signoff, resolution check, pacing audit)
- **Stage 08:** Thumbnail Studio (9:16 vertical poster design, contrast, text hook)
- **Stage 09:** Social Gatekeeper Review (Bilingual transcription check, Telugu hashtags, pinned comment)
- **Stage 10:** Publishing Setup & Packaging (Endpoint packaging for YouTube, Reels, FB)
- **Stage 11:** Published & Live Verification (Broadcast scheduling, live URL confirmation)
- **Stage 12:** Platform Sync (Cross-channel distribution verification)
- **Stage 13:** Social Analytics (Viewer feedback, comment sentiment, student questions)
- **Stage 14:** Performance Review (Audience retention curves, 30s drop-off analysis)
- **Stage 15:** Pedagogical Intelligence Loop (Misconception mining, syllabus feedback)

---

## 2. Page-to-Stage Mapping Matrix

| Stage # | Stage Name | Dedicated Primary Page | Consolidated Workspace Tab | Secondary / Auxiliary Pages |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Question Generation | `QuestionStudioPage.tsx` | - | `PlanningPage.tsx` (Pre-planning), `QuestionLibraryPage.tsx` |
| **02** | Question Verification | `QuestionVerifyApprovePage.tsx` | - | `QuestionImprovePage.tsx`, `QuestionDetailPage.tsx` |
| **03** | Audience Scriptwriting | `VideoCreateScriptPage.tsx` | `VideoDetailPage.tsx?tab=script` | `VideoReviewScriptPage.tsx` (Legacy Unrouted) |
| **04** | Teleprompter Preparation | `QueuePage.tsx` | `VideoDetailPage.tsx?tab=recording` | `VideoRecordPage.tsx` (Legacy Unrouted) |
| **05** | Raw Video Filming | `QueuePage.tsx` | `VideoDetailPage.tsx?tab=recording` | `VideoRecordPage.tsx` (Legacy Unrouted) |
| **06** | Video Editing Bay | `ProductionTrackerPage.tsx` | `VideoDetailPage.tsx?tab=editing` | `VideoEditPage.tsx` (Legacy Unrouted) |
| **07** | Final QC Review | `ProductionTrackerPage.tsx` | `VideoDetailPage.tsx?tab=final-review` | `VideoFinalPage.tsx` (Legacy Unrouted) |
| **08** | Thumbnail Studio | - | `VideoDetailPage.tsx?tab=thumbnail` | `VideoThumbnailPage.tsx` (Legacy Unrouted) |
| **09** | Social Gatekeeper Review| `SocialReviewPage.tsx` | `VideoDetailPage.tsx?tab=social` | `VideoPinnedCommentPage.tsx` (Legacy Unrouted) |
| **10** | Publishing Setup & Pkg | `PlatformPackagesPage.tsx` | `VideoDetailPage.tsx?tab=publishing` | `PublishingPackagePage.tsx` (Legacy Unrouted) |
| **11** | Published & Live Sync | `PublishingPage.tsx` | - | `PlatformPackagesPage.tsx` |
| **12** | Platform Sync Check | `PublishingPage.tsx` | - | `PlatformPackagesPage.tsx` |
| **13** | Social Analytics | `SocialAnalyticsPage.tsx` | `AnalyticsExperiencePage.tsx?tab=engagement`| `ContentMasterPage.tsx` |
| **14** | Performance Review | `AnalyticsExperiencePage.tsx` | `AnalyticsExperiencePage.tsx?tab=retention` | `AnalyticsExperiencePage.tsx?tab=video` |
| **15** | Pedagogical Loop | `AnalyticsExperiencePage.tsx` | `AnalyticsExperiencePage.tsx?tab=intelligence`| `PlanningPage.tsx` (Loops back to Stage 01) |

---

## 3. Workflow Observations

1. **Consolidated Cockpit Dominance**: Stages 03 through 10 are completely functional inside `VideoDetailPage.tsx` using the `?tab=` navigation contract.
2. **Dual-Surface Ambiguity**: Stage 09 has both a standalone page (`SocialReviewPage.tsx`) and a consolidated tab (`VideoDetailPage.tsx?tab=social`). Both access the same review data via different views.
3. **Closed Feedback Loop**: Stage 15 intelligence insights in `AnalyticsExperiencePage.tsx` link directly back to `PlanningPage.tsx` and `QuestionStudioPage.tsx`, closing the 15-stage pedagogical compounding loop.
