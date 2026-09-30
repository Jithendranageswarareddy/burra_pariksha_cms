# Page Purpose Forensic Classification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 03 of 30  

---

## 1. Functional Purpose Classification Taxonomy

Every page in BP-CMS serves a distinct operational purpose within the content pipeline. We classify pages into 18 purpose archetypes:
- **AUTH**: Session authentication and token acquisition
- **DASHBOARD**: Cross-functional status aggregation and telemetry
- **LIST / SEARCH**: High-volume tabular browsing, filtering, and entity retrieval
- **DETAIL**: In-depth read-only or low-mutation entity inspection
- **CREATE**: New entity authoring with validation and draft saving
- **EDIT**: In-place modification of existing drafts or verified assets
- **VERIFY / APPROVE**: Formal quality gates, academic audits, and signoffs
- **PRODUCE / RECORD**: Media capture, teleprompter control, footage ingestion
- **EDIT_BAY**: Cut sequencing, rough cut assembly, timestamping
- **REVIEW**: Quality control, compliance checks, and bilingual transcription audits
- **PUBLISH**: Multi-platform distribution scheduling and dispatch
- **ANALYZE**: Quantitative performance tracking and retention analytics
- **MANAGE**: Resource planning, syllabus batch management, and team reassignments
- **SYSTEM**: Environment health diagnostics, taxonomy definitions, and Google Sheets sync
- **DISASTER_RECOVERY**: Database snapshot creation, inspection, and state restoration
- **UTILITY**: Error handling, routing fallbacks (404), and error boundaries
- **LEGACY**: Superseded standalone pages replaced by consolidated tabbed cockpits

---

## 2. Page-by-Page Purpose Audit

| Page ID | Page Name | Primary Purpose Archetype | Secondary Purpose | Forensic Purpose Summary |
|---|---|---|---|---|
| `PAGE-LOGIN` | LoginPage | **AUTH** | Role Demo Selector | Authenticates users; provides one-click role switching in dev/demo mode. |
| `PAGE-DASH` | DashboardPage | **DASHBOARD** | Workflow Routing | High-level metrics, stage velocity counters, and direct jump shortcuts. |
| `PAGE-MYWORK` | MyWorkPage | **LIST** | Task Dispatcher | Aggregates tasks assigned to active user; direct deep-link into task views. |
| `PAGE-PLAN` | PlanningPage | **MANAGE** | CREATE / Batch | Syllabus taxonomy browser, sprint batch creation, and curriculum planning. |
| `PAGE-QLIB` | QuestionLibraryPage | **LIST** | SEARCH / Filter | Centralized repository of all academic questions with status filters. |
| `PAGE-QDET` | QuestionDetailPage | **DETAIL** | VERIFY / Edit Link | Full question audit trail, options inspection, explanation, and action links. |
| `PAGE-QSTUDIO` | QuestionStudioPage | **CREATE** | AI Assisted Polish | 4-step wizard for authoring bilingual questions with Gemini candidate generator. |
| `PAGE-QIMP` | QuestionImprovePage | **EDIT** | Academic Review | Refines question phrasing, options, explanation, and pedagogical rigor. |
| `PAGE-QVERIFY`| QuestionVerifyApprovePage| **VERIFY / APPROVE**| Rejection Logging | Academic quality signoff gate with checklist and launch to video production. |
| `PAGE-QUEUE` | QueuePage | **LIST** | PRODUCE / Record | Teleprompter staging queue for presenters preparing for studio recording. |
| `PAGE-PRODTRK`| ProductionTrackerPage | **DASHBOARD** | Pipeline Kanban | 15-stage conveyor belt tracker for all videos from script to publication. |
| `PAGE-VCSCRIPT`| VideoCreateScriptPage | **CREATE** | Scriptwriting | Standalone script generator translating approved questions into spoken scripts. |
| `PAGE-VDET` | VideoDetailPage | **WORKFLOW COCKPIT**| Consolidated Tabs | Single unified master workspace hosting 8 production phases via `?tab=`. |
| `PAGE-SOCREV` | SocialReviewPage | **REVIEW** | APPROVE / QA | Validates YouTube/Instagram metadata, Telugu hashtag blocks, and thumbnails. |
| `PAGE-PLTPKG` | PlatformPackagesPage | **MANAGE** | PUBLISH Prep | Formats video packages for YouTube Shorts, Instagram Reels, and Facebook. |
| `PAGE-PUB` | PublishingPage | **PUBLISH** | Scheduling / Live | Live release scheduler, broadcast dispatcher, and cross-platform verification. |
| `PAGE-ANL-EXP`| AnalyticsExperiencePage | **ANALYZE** | Intelligence Loop | 10 sub-tabs analyzing video watch time, drop-offs, topic mastery, and AI insights. |
| `PAGE-SOCANL` | SocialAnalyticsPage | **ANALYZE** | Audience Feedback | Aggregates social media comments, audience sentiment, and student questions. |
| `PAGE-TEAM` | TeamOperationsPage | **MANAGE** | Reassignment | Team workload distribution, capacity tracking, and task reassignment. |
| `PAGE-CMASTER` | ContentMasterPage | **DETAIL / EXPLORER**| Entity Linking | Inspects the unified Content Master record linking questions, videos, and metrics. |
| `PAGE-SETT` | SettingsPage | **SYSTEM** | Diagnostics | Google Sheets connectivity test, taxonomy sync, and system configuration. |
| `PAGE-RECOV` | RecoveryAdminPage | **DISASTER_RECOVERY**| Snapshot Management| Preflight database check, disaster recovery snapshot, and restore execution. |
| `PAGE-404` | NotFoundPage | **UTILITY** | Navigation Recovery | Catches unmatched routes and directs stranded users back to `/dashboard`. |
