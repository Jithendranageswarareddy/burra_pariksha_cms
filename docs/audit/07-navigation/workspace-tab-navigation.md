# Consolidated Workspace Tab Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 08 of 27  

---

## 1. Workspace Tab Architecture

A defining evolutionary advancement in BP-CMS is the **Consolidated Workspace Model**. Rather than navigating between independent page routes across production phases, the application hosts related phases inside master tabbed containers synchronized with URL search parameters (`?tab=...`).

---

## 2. Video Production Workspace (`VideoDetailPage.tsx`)

`VideoDetailPage.tsx` serves as the master production cockpit for video lifecycle management.

### Tab Navigation Matrix

| Tab Key | Tab Label | Underlying Stage | Rendered Workspace Component | Deep Link Route |
| :--- | :--- | :--- | :--- | :--- |
| `overview` | Video Overview | Cross-Stage (Identity) | `<VideoOverviewTab />` | `/videos/:videoId?tab=overview` |
| `script` | Script Workspace | Stage 03 (`AUDIENCE_SCRIPT`) | `<ScriptWorkspace />` | `/videos/:videoId?tab=script` |
| `recording` | Studio Recording | Stages 04 & 05 (`RAW_VIDEO`) | `<RecordingWorkspace />` | `/videos/:videoId?tab=recording` |
| `editing` | Video Editing | Stage 06 (`EDITING`) | `<EditingWorkspace />` | `/videos/:videoId?tab=editing` |
| `final-review`| Final QC Review | Stage 07 (`FINAL_QC`) | `<FinalReviewWorkspace />` | `/videos/:videoId?tab=final-review` |
| `thumbnail` | Thumbnail Studio | Stage 08 (`THUMBNAIL`) | `<ThumbnailWorkspace />` | `/videos/:videoId?tab=thumbnail` |
| `social` | Social Simulator | Stage 09 (`SOCIAL_REVIEW`) | `<SocialSimulatorWorkspace />` | `/videos/:videoId?tab=social` |
| `publishing` | Publishing Dispatcher | Stage 10 (`PUBLISHING_SETUP`)| `<PublishingWorkspace />` | `/videos/:videoId?tab=publishing` |

### URL Sync & Tab Transition
- URL search param `tab` is monitored via `useSearchParams()`.
- Tab changes execute `setSearchParams({ tab: newTab })`, updating the browser history stack without remounting the parent page.
- Direct external links (e.g. bookmarks or notification alerts) deep-link immediately into the specific production phase.

---

## 3. Analytics Experience Workspace (`AnalyticsExperiencePage.tsx`)

`AnalyticsExperiencePage.tsx` organizes the 10 dimensions of performance intelligence into sub-tabs:

| Sub-Route | Sub-Tab Title | Analytical Focus |
| :--- | :--- | :--- |
| `/analytics/overview` | Overview | Executive KPI dashboard, cross-platform views, total watch time |
| `/analytics/video` | Video Performance | Per-video breakdown, retention curves, drop-off timestamps |
| `/analytics/platform` | Platform Sync | YouTube vs Instagram Reels vs Facebook performance diffs |
| `/analytics/topic` | Topic Intelligence | Performance correlated with syllabus topics |
| `/analytics/subtopic` | Subtopic Breakdown | Granular topic mastery and reach |
| `/analytics/difficulty`| Difficulty Index | Correlation between question difficulty and viewer retention |
| `/analytics/engagement`| Viewer Engagement | Likes, shares, saves, comment frequency, discussion density |
| `/analytics/retention` | Retention Curves | 30-second mark retention and end-screen completion rates |
| `/analytics/intelligence`| Pedagogical AI Insights| Common student misconceptions extracted from comments |
| `/analytics/strategy` | Content Strategy | AI recommendations for sprint planning and question authoring |
