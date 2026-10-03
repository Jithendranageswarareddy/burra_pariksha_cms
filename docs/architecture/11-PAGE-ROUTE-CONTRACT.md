# 11 — PAGE & ROUTE CONTRACT
## Burra Pariksha Content Management System (BP-CMS)
### Stage 11 of 30-Stage Modernization Program — Authoritative Page & Route Contract

```
================================================================================
Document ID:       BP-ARCH-11-ROUTES
Version:           11.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL CONTRACT
Scope:             Frontend Page Routes, Workspace URLs, & Deep-Link Contracts
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
Downstream Stages: 12-DATA-ARCHITECTURE.md
                   13-API-CONTRACT.md
                   15-AUTH-IMPLEMENTATION.md
                   18-FRONTEND-SHELL-IMPLEMENTATION.md
                   19–26 Workflow Workspace Implementation Stages
                   28-E2E-INTEGRATION-TESTING.md
                   30-FINAL-SYSTEM-AUDIT.md
Target Paradigm:   Strict 1:1 Page-to-Route Contract & Consolidated Brownfield Routing
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Page & Route Contract** for the Burra Pariksha Content Management System (BP-CMS). Grounded in the Information Architecture defined in Stage 10, this contract eliminates the brownfield route sprawl—comprising 78 disparate route definitions, 49 redirect aliases, and 6 orphaned video page components—by defining the exact URL routes, parameter schemas, state boundaries, breadcrumbs, capability gates, and deep-link behaviors for all **18 Canonical Production Workspaces/Pages (`P-01` through `P-18`)**.

### 1.2 Anti-Overclaim Invariants
1. **Contractual Specification Only:** This document formalizes the *routing specification and contract*. It does **not** assert that client-side routes in `src/App.tsx` have been refactored, that legacy routes have been disabled, or that orphaned pages have been deleted.
2. **Zero Runtime Code Modification:** No application source code, React components, route definitions, or Express server handlers are modified during Stage 11.
3. **Brownfield Baseline Preservation:** The current 78 route definitions in `src/App.tsx` are documented as forensic evidence; migration and retirement actions are strictly scheduled for downstream implementation stages.

---

## 2. Forensic Route Inventory (Current Brownfield Baseline)

An audit of `src/App.tsx` reveals **78 currently defined route paths**:
- **28 Direct Page Renders** (active React page components)
- **25 Static Redirects** (using `<Navigate replace />`)
- **24 Dynamic Video Tab Redirects** (using custom `VideoTabRedirect`)
- **1 Dynamic Question Redirect** (using custom `QuestionImproveRedirect`)
- **6 Orphaned Page Files** in `src/pages/` not mounted in `src/App.tsx` (`VideoEditPage`, `VideoFinalPage`, `VideoPinnedCommentPage`, `VideoRecordPage`, `VideoReviewScriptPage`, `VideoThumbnailPage`)

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                         CURRENT ROUTE TAXONOMY & DISPOSITION                           │
 ├────────────────────────────────────────┬───────┬───────────────────────────────────────┤
 │ Category                               │ Count │ Architectural Disposition             │
 ├────────────────────────────────────────┼───────┼───────────────────────────────────────┤
 │ Active Canonical Hub Routes            │ 18    │ Retain as Stage 11 Canonical Routes   │
 │ Redundant Video Tab Redirects          │ 24    │ Retain temporarily; retire in Stg 21 │
 │ Static Workflow-Step Redirects         │ 25    │ Retain temporarily; retire in Stg 21 │
 │ Secondary Navigation Aliases           │ 10    │ Migrate to canonical URL queries      │
 │ Unauthenticated / System Routes        │ 2     │ Keep (Login, NotFound)                │
 ├────────────────────────────────────────┼───────┼───────────────────────────────────────┤
 │ Total Routes Audited in App.tsx        │ 78    │ 100% Accounted For & Reconciled       │
 └────────────────────────────────────────┴───────┴───────────────────────────────────────┘
```

---

## 3. Canonical Page & Route Contracts (`P-01` through `P-18`)

Every canonical page established in Stage 10 is governed by a complete, standardized architectural contract.

---

### Page Contract: P-01 (Operations Overview)
- **Page ID:** `P-01`
- **Hub:** `HOME`
- **Page Name:** Operations Overview
- **Canonical Route:** `/dashboard`
- **Route Parameters:** None
- **Query Parameters:** None
- **Purpose:** Central operational dashboard displaying operations pulse, daily pipeline velocity metrics, attention banners, and real-time activity feed.
- **Resource:** `WorkflowInstance`, `AuditEvent`
- **Workflow Stage:** N/A / Cross-cutting Operations
- **Entry Conditions:** User authenticated with an active session.
- **Required Capabilities:** `CONTENT:VIEW`, `NOTIFICATION:VIEW`
- **Allowed Actions:** `VIEW`, `REFRESH`
- **Required Data:** High-level pipeline stage counts, recent audit logs, user notification summary.
- **API Dependencies:** `GET /api/dashboard/stats`, `GET /api/notifications/summary`, `GET /api/audit/recent`
- **Loading State:** Skeleton layout with placeholder KPI cards and activity rows.
- **Empty State:** Clean dashboard illustration: *"All systems operational. No active pipeline bottlenecks."*
- **Error State:** Banner: *"Failed to load operational metrics."* + `[Retry]` button.
- **Unauthorized State:** Redirect to `/login`.
- **Not Found State:** N/A (Static root route).
- **Success State:** Interactive KPI tiles, pipeline throughput graph, and real-time activity feed.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Contextual jump to active stage workbenches.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Home`
- **Parent Navigation:** Global Shell -> Home -> Overview
- **Deep-Link Behavior:** Direct load; preserves active session.
- **Owner:** `CONTENT_LEAD` / All Authorized Roles

---

### Page Contract: P-02 (My Work Queue)
- **Page ID:** `P-02`
- **Hub:** `HOME`
- **Page Name:** My Work Queue
- **Canonical Route:** `/my-work`
- **Route Parameters:** None
- **Query Parameters:** `?tab=assigned|revisions|reviews` (Default: `assigned`)
- **Purpose:** Personalized task queue filtering content items requiring direct action from the current authenticated actor.
- **Resource:** `Content`, `WorkflowInstance`, `Assignment`
- **Workflow Stage:** N/A / Multi-stage Personal Dispatcher
- **Entry Conditions:** User authenticated.
- **Required Capabilities:** `CONTENT:VIEW`
- **Allowed Actions:** `VIEW`, `CLAIM`, `RESUME`
- **Required Data:** Array of `Content` items where `assigneeId == user.id` or eligible reviews where `GAR-02` passes.
- **API Dependencies:** `GET /api/my-work/tasks`
- **Loading State:** Task card skeletons.
- **Empty State:** Illustration: *"You have zero pending tasks or assigned reviews. Great job!"*
- **Error State:** Card error alert + retry handler.
- **Unauthorized State:** Redirect to `/login`.
- **Not Found State:** N/A
- **Success State:** Grouped task list: *Revisions Requested (Red)*, *Active In-Progress (Blue)*, *Assigned Reviews (Purple)*.
- **Revision / Failure Behavior:** Clicking a revision card routes directly to the authoring stage with reviewer remarks highlighted.
- **Next Workflow Step:** Contextual transition to specific resource route.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Home > My Work`
- **Parent Navigation:** Global Shell -> Home -> My Work
- **Deep-Link Behavior:** Deep-link loads specific filter tab.
- **Owner:** All Operational Contributors (`QUESTION_AUTHOR`, `VIDEO_EDITOR`, etc.)

---

### Page Contract: P-03 (Question Library)
- **Page ID:** `P-03`
- **Hub:** `QUESTIONS`
- **Page Name:** Question Library
- **Canonical Route:** `/questions`
- **Route Parameters:** None
- **Query Parameters:** `?topic=&subtopic=&difficulty=&status=&page=&q=`
- **Purpose:** Search, filter, and review the master repository of curriculum questions.
- **Resource:** `Question`, `QuestionVersion`
- **Workflow Stage:** Stages 01–02 Overview
- **Entry Conditions:** User authenticated.
- **Required Capabilities:** `QUESTION:VIEW`
- **Allowed Actions:** `VIEW`, `SEARCH`, `FILTER`, `SELECT`
- **Required Data:** Paginated question items with taxonomy tags, current version, and lifecycle status.
- **API Dependencies:** `GET /api/questions?page=...&limit=25`
- **Loading State:** Table skeleton loader (10 rows).
- **Empty State:** *"No questions match the current filter criteria."* + `[Clear Filters]`.
- **Error State:** Full-width error callout + retry action.
- **Unauthorized State:** HTTP 403 Forbidden banner.
- **Not Found State:** N/A
- **Success State:** Sortable data table with topic pills, status badges, difficulty indicators, and row actions.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Clicking a row opens `P-06 Question Detail` or `P-05 Question Verification`.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Questions > Library`
- **Parent Navigation:** Global Shell -> Questions -> Question Library
- **Deep-Link Behavior:** Preserves search query and filter parameters in URL.
- **Owner:** `QUESTION_AUTHOR`, `QA_REVIEWER`, `CONTENT_LEAD`

---

### Page Contract: P-04 (Question Studio)
- **Page ID:** `P-04`
- **Hub:** `QUESTIONS`
- **Page Name:** Question Studio
- **Canonical Route:** `/studio`
- **Route Parameters:** None
- **Query Parameters:** `?contentId=&cloneFrom=`
- **Purpose:** Authoring workspace for drafting new questions, configuring syllabus taxonomies, generating AI candidates, and submitting for review.
- **Resource:** `Question`, `QuestionVersion`
- **Workflow Stage:** Stage 01 (Question Generation)
- **Entry Conditions:** Workflow initiated for new content or revision dispatched.
- **Required Capabilities:** `QUESTION:CREATE`, `QUESTION:EDIT`
- **Allowed Actions:** `GENERATE`, `EDIT`, `SAVE_DRAFT`, `SUBMIT`
- **Required Data:** Topic taxonomy tree, AI generation prompt templates, draft question container.
- **API Dependencies:** `POST /api/ai/generate`, `POST /api/questions`, `PUT /api/questions/:id`
- **Loading State:** Dual-pane skeleton (prompt panel left, schema form right).
- **Empty State:** Blank authoring template with topic selector highlighted.
- **Error State:** Field-level validation callouts; toast for AI connection timeouts.
- **Unauthorized State:** HTTP 403 Forbidden: *"You do not have question authoring permissions."*
- **Not Found State:** N/A
- **Success State:** Form filled with 4 validated options, correct answer index, and mathematical proof steps.
- **Revision / Failure Behavior:** If returned from Stage 02, reviewer rejection remarks are displayed in a sticky banner at the top of the editor.
- **Next Workflow Step:** Advance to Stage 02 (`P-05 Question Verification`).
- **Previous Workflow Step:** N/A (Stage 01 is entry point).
- **Breadcrumb:** `Questions > Question Studio`
- **Parent Navigation:** Global Shell -> Questions -> Question Studio
- **Deep-Link Behavior:** If `?contentId=...` provided, loads active draft for that content.
- **Owner:** `QUESTION_AUTHOR`, `CONTENT_LEAD`

---

### Page Contract: P-05 (Question Verification)
- **Page ID:** `P-05`
- **Hub:** `QUESTIONS`
- **Page Name:** Question Verification
- **Canonical Route:** `/questions/:id/verify`
- **Route Parameters:** `:id` (Question ID: `BP-Q-######`)
- **Query Parameters:** None
- **Purpose:** Formal 10-point pedagogical audit and mathematical solution proof verification gate.
- **Resource:** `QuestionReview`, `QuestionVersion`
- **Workflow Stage:** Stage 02 (Question Verification)
- **Entry Conditions:** `WorkflowInstance.currentStage == 02` and `stageStatus == PENDING_REVIEW`.
- **Required Capabilities:** `QUESTION_REVIEW:VERIFY`, `QUESTION:APPROVE`, `QUESTION:REJECT`
- **Allowed Actions:** `INSPECT`, `CERTIFY`, `REQUEST_CHANGES`, `REJECT`
- **Required Data:** Submitted `QuestionVersion` payload, proof steps, author metadata.
- **API Dependencies:** `GET /api/questions/:id`, `POST /api/questions/:id/verify`
- **Loading State:** Shimmering audit checklist and proof viewer.
- **Empty State:** N/A (Param-bound).
- **Error State:** Alert banner: *"Unable to load question for verification."*
- **Unauthorized State:** HTTP 403 Forbidden. If author attempts self-review, renders `GAR-02` warning badge.
- **Not Found State:** Standard 404: *"Question ID [id] not found."*
- **Success State:** Full question audit view with interactive 10-point pass/fail toggles and decision modal.
- **Revision / Failure Behavior:**
  - `REQUEST_CHANGES`: Transitions 02 -> 01; returns author to `P-04 Question Studio`.
  - `REJECT`: Terminal halt; transitions workflow to `TERMINATED`.
- **Next Workflow Step:** Advance to Stage 03 (`P-09 Video Production Workbench?tab=script`).
- **Previous Workflow Step:** Stage 01 (`P-04 Question Studio`).
- **Breadcrumb:** `Questions > Library > BP-Q-###### > Verification`
- **Parent Navigation:** Questions -> Question Library -> Resource Row -> Verify
- **Deep-Link Behavior:** Direct route access; loads specific question review.
- **Owner:** `QA_REVIEWER`, `CONTENT_LEAD`

---

### Page Contract: P-06 (Question Detail)
- **Page ID:** `P-06`
- **Hub:** `QUESTIONS`
- **Page Name:** Question Detail
- **Canonical Route:** `/questions/:id`
- **Route Parameters:** `:id` (Question ID: `BP-Q-######`)
- **Query Parameters:** `?version=&mode=view|edit` (Default: `mode=view`)
- **Purpose:** Comprehensive 5-section resource inspector for viewing version history, mathematical proofs, review history, and connected video projects.
- **Resource:** `Question`, `QuestionVersion`, `Content`
- **Workflow Stage:** Contextual (Displays current stage indicator)
- **Entry Conditions:** Question exists in datastore.
- **Required Capabilities:** `QUESTION:VIEW`
- **Allowed Actions:** `VIEW`, `SWITCH_VERSION`, `FORK_VERSION`
- **Required Data:** Complete `Question` aggregate container, version history array, review trail.
- **API Dependencies:** `GET /api/questions/:id`, `GET /api/questions/:id/versions`
- **Loading State:** 5-section skeleton layout.
- **Empty State:** N/A
- **Error State:** *"Failed to fetch question record."*
- **Unauthorized State:** HTTP 403 Forbidden banner.
- **Not Found State:** Standard 404 resource page.
- **Success State:** Tabbed view showing current approved version, historical drafts, connected `Content` ID, and audit log.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Contextual jump button to current active workflow stage.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Questions > Library > BP-Q-######`
- **Parent Navigation:** Questions -> Question Library -> Resource Row
- **Deep-Link Behavior:** Permalinks to specific versions via `?version=2`.
- **Owner:** All Authorized Roles

---

### Page Contract: P-07 (Recording Queue)
- **Page ID:** `P-07`
- **Hub:** `PRODUCTION`
- **Page Name:** Recording Queue
- **Canonical Route:** `/queue`
- **Route Parameters:** None
- **Query Parameters:** `?presenter=&status=&date=`
- **Purpose:** Studio call sheet displaying filming schedule, script readiness, and raw footage intake queue.
- **Resource:** `Video`, `Script`, `Content`
- **Workflow Stage:** Stages 04 & 05
- **Entry Conditions:** Script locked in Stage 03 (`SCRIPT_READY`).
- **Required Capabilities:** `VIDEO:RECORD`, `VIDEO:VIEW`
- **Allowed Actions:** `START_FILMING`, `LOG_TAKE`, `CLAIM_SESSION`
- **Required Data:** List of video projects with locked scripts ready for studio recording.
- **API Dependencies:** `GET /api/production/recording-queue`
- **Loading State:** Table skeleton.
- **Empty State:** *"Studio recording queue is clear. No scripts awaiting filming."*
- **Error State:** Network error alert with retry.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Grid of filming cards with presenter avatars, target duration (45–58s), and "Launch Teleprompter" button.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Launches `P-09 Video Production Workbench?tab=recording`.
- **Previous Workflow Step:** Stage 03 Scripting.
- **Breadcrumb:** `Production > Recording Queue`
- **Parent Navigation:** Global Shell -> Production -> Recording Queue
- **Deep-Link Behavior:** Filterable by presenter ID.
- **Owner:** `PRESENTER`, `PRODUCER`, `CONTENT_LEAD`

---

### Page Contract: P-08 (Production Pipeline Board)
- **Page ID:** `P-08`
- **Hub:** `PRODUCTION`
- **Page Name:** Production Pipeline Board
- **Canonical Route:** `/production`
- **Route Parameters:** None
- **Query Parameters:** `?stage=&assignee=&blocked=true|false`
- **Purpose:** Macro Kanban board visualizing content items progressing across production stages (Scripting, Recording, Editing, QC, Thumbnail).
- **Resource:** `Content`, `WorkflowInstance`, `Video`
- **Workflow Stage:** Stages 03 through 08
- **Entry Conditions:** User authenticated.
- **Required Capabilities:** `VIDEO:VIEW`
- **Allowed Actions:** `VIEW`, `FILTER`, `REASSIGN`
- **Required Data:** Content cards grouped by workflow stage with health badges.
- **API Dependencies:** `GET /api/production/board`
- **Loading State:** Multi-column Kanban skeleton.
- **Empty State:** Columns render empty lane drop-zones.
- **Error State:** Board error alert banner.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Dynamic drag-and-drop / click-through Kanban board with lane counts.
- **Revision / Failure Behavior:** Cards with `stageStatus == CHANGES_REQUESTED` render with high-visibility red badges.
- **Next Workflow Step:** Clicking a card opens `P-09 Video Production Workbench` at the active tab.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Production > Pipeline Board`
- **Parent Navigation:** Global Shell -> Production -> Production Pipeline
- **Deep-Link Behavior:** Preserves active lane filters in query string.
- **Owner:** `PRODUCER`, `VIDEO_EDITOR`, `CONTENT_LEAD`

---

### Page Contract: P-09 (Video Production Workbench)
- **Page ID:** `P-09`
- **Hub:** `PRODUCTION`
- **Page Name:** Video Production Workbench
- **Canonical Route:** `/videos/:videoId`
- **Route Parameters:** `:videoId` (Video / Content ID: `BP-V-######` or `BP-CNT-######`)
- **Query Parameters:** `?tab=script|recording|editing|final-review|thumbnail` (Default: active stage tab)
- **Purpose:** The consolidated operational master workbench housing all video production stages (Scripting, Filming Prompter, Editing Bay, 6-Point QC, and Thumbnail Studio).
- **Resource:** `Video`, `VideoEdit`, `VideoTake`, `Script`, `Thumbnail`
- **Workflow Stage:** Stages 03, 04, 05, 06, 07, and 08
- **Entry Conditions:** Project queued in production.
- **Required Capabilities:** `VIDEO:VIEW`, plus stage-specific capabilities (`SCRIPT:EDIT`, `VIDEO_EDIT:EDIT`, `VIDEO_EDIT:APPROVE`, `THUMBNAIL:APPROVE`)
- **Allowed Actions:**
  - Tab 1 (Script): `EDIT_SCRIPT`, `LOCK_SCRIPT` (Advance 03 -> 04)
  - Tab 2 (Prompter/Raw): `SCROLL_PROMPTER`, `LOG_TAKE`, `UPLOAD_RAW` (Advance 04/05 -> 06)
  - Tab 3 (Editing): `UPLOAD_MASTER_CUT`, `SUBMIT_QC` (Advance 06 -> 07)
  - Tab 4 (Final QC): `AUDIT_6POINT`, `APPROVE_QC` (Advance 07 -> 08), `REJECT_QC` (Return 07 -> 06)
  - Tab 5 (Thumbnail): `UPLOAD_ARTWORK`, `APPROVE_THUMBNAIL` (Advance 08 -> 09)
- **Required Data:** Script versions, video takes, master render cut metadata, QC checklist, candidate thumbnails.
- **API Dependencies:** `GET /api/videos/:id`, `POST /api/videos/:id/status`, `POST /api/videos/:id/qc`
- **Loading State:** Studio workbench skeleton with tab bar and media player placeholder.
- **Empty State:** N/A (Param-bound).
- **Error State:** Alert callout: *"Video project could not be loaded."*
- **Unauthorized State:** Read-only mode with action buttons disabled and tooltip explaining capability requirements.
- **Not Found State:** Standard 404: *"Video [videoId] not found."*
- **Success State:** High-fidelity video studio player with 9:16 safe-zones, audio visualizer, synced teleprompter, and action bar.
- **Revision / Failure Behavior:**
  - QC Rejection in Tab 4 switches focus to Tab 3 with timecoded defect markers.
  - Script rewrite switches to Tab 1 with unlocked draft.
- **Next Workflow Step:** Advance to Stage 09 (`P-10 Social Review Studio`).
- **Previous Workflow Step:** Stage 02 (`P-05 Question Verification`).
- **Breadcrumb:** `Production > Pipeline > BP-V-###### > [Tab Name]`
- **Parent Navigation:** Production -> Production Pipeline -> Card Click
- **Deep-Link Behavior:** Direct tab selection via `?tab=editing`. If tab omitted, automatically activates the tab matching `WorkflowInstance.currentStage`.
- **Owner:** `VIDEO_EDITOR`, `PRODUCER`, `PRESENTER`, `DESIGNER`, `CONTENT_LEAD`

---

### Page Contract: P-10 (Social Review Studio)
- **Page ID:** `P-10`
- **Hub:** `PUBLISHING`
- **Page Name:** Social Review Studio
- **Canonical Route:** `/social-review/:reviewId`
- **Route Parameters:** `:reviewId` (Social Review / Content ID)
- **Query Parameters:** None
- **Purpose:** 9:16 smartphone simulator review bay for verifying video safe-zones, title character limits, hashtags, and pinned educational comments.
- **Resource:** `SocialReview`, `PublishingPackage`
- **Workflow Stage:** Stage 09 (Social Review)
- **Entry Conditions:** Master cut approved (Stage 07) and thumbnail approved (Stage 08).
- **Required Capabilities:** `SOCIAL_REVIEW:VIEW`, `SOCIAL_REVIEW:APPROVE`, `SOCIAL_REVIEW:REJECT`
- **Allowed Actions:** `INSPECT_SIMULATOR`, `EDIT_COPY`, `APPROVE_PACKAGE`, `REQUEST_REVISIONS`
- **Required Data:** Video stream, approved thumbnail, social post copy, pinned comment.
- **API Dependencies:** `GET /api/social-reviews/:id`, `POST /api/social-reviews/:id/approve`
- **Loading State:** Mobile phone frame skeleton with pulsing media area.
- **Empty State:** N/A
- **Error State:** Banner: *"Failed to load social review bundle."*
- **Unauthorized State:** HTTP 403 Forbidden. `GAR-02` warning if reviewer authored the script hook.
- **Not Found State:** 404: *"Review bundle not found."*
- **Success State:** Interactive mobile simulator running YouTube Shorts and Instagram Reels UI overlays with toggle controls.
- **Revision / Failure Behavior:**
  - Thumbnail defect: Returns to `P-09 Video Workbench?tab=thumbnail` (Stage 08).
  - Video caption defect: Returns to `P-09 Video Workbench?tab=editing` (Stage 06).
- **Next Workflow Step:** Advance to Stage 10 (`P-11 Publishing Manager`).
- **Previous Workflow Step:** Stage 08 Thumbnail Studio.
- **Breadcrumb:** `Publishing > Quality Signoff > Review`
- **Parent Navigation:** Publishing -> Quality Signoff -> Review Queue
- **Deep-Link Behavior:** Direct link loads mobile simulation for specified review ID.
- **Owner:** `SOCIAL_LEAD`, `CONTENT_LEAD`

---

### Page Contract: P-11 (Publishing Manager)
- **Page ID:** `P-11`
- **Hub:** `PUBLISHING`
- **Page Name:** Publishing Manager
- **Canonical Route:** `/publishing`
- **Route Parameters:** None
- **Query Parameters:** `?tab=scheduled|queue|live` (Default: `scheduled`)
- **Purpose:** Multi-platform release scheduling calendar, pre-publish readiness confirmation, and live broadcast dispatch monitor.
- **Resource:** `PublishingPackage`, `Publication`
- **Workflow Stage:** Stages 10 & 11 (Publishing Setup & Published)
- **Entry Conditions:** Social review approved in Stage 09.
- **Required Capabilities:** `PUBLISHING_PACKAGE:VIEW`, `PUBLISHING_PACKAGE:SCHEDULE`, `PUBLICATION:PUBLISH`
- **Allowed Actions:** `SCHEDULE`, `ASSIGN_SLOT`, `EXECUTE_PUBLISH`, `VERIFY_LIVE_LINK`
- **Required Data:** Release calendar slots, platform credentials status, scheduled package details.
- **API Dependencies:** `GET /api/publishing/schedule`, `POST /api/publishing/dispatch`
- **Loading State:** Calendar and queue skeleton loader.
- **Empty State:** *"No videos scheduled for publication this week."*
- **Error State:** Toast error for platform API rejection or expired OAuth credentials.
- **Unauthorized State:** Read-only calendar mode; publish buttons hidden.
- **Not Found State:** N/A
- **Success State:** Drag-and-drop release calendar with platform pills (YouTube, Meta), pre-publish 100% check, and live URL launch buttons.
- **Revision / Failure Behavior:** If platform upload fails, error details are displayed with a non-blocking `[Retry Upload]` action.
- **Next Workflow Step:** Advance to Stage 12 (`P-12 Platform Sync Console`).
- **Previous Workflow Step:** Stage 09 (`P-10 Social Review Studio`).
- **Breadcrumb:** `Publishing > Manager`
- **Parent Navigation:** Global Shell -> Publishing -> Publishing Manager
- **Deep-Link Behavior:** Supports tab filtering (`?tab=live`).
- **Owner:** `PUBLISHING_LEAD`, `CONTENT_LEAD`

---

### Page Contract: P-12 (Platform Sync Console)
- **Page ID:** `P-12`
- **Hub:** `PUBLISHING`
- **Page Name:** Platform Sync Console
- **Canonical Route:** `/platform-packages`
- **Route Parameters:** None
- **Query Parameters:** `?syncStatus=synchronized|drift|error`
- **Purpose:** Cross-platform metadata reconciliation, URL verification, and live pinned comment verification.
- **Resource:** `Publication`, `Platform`
- **Workflow Stage:** Stage 12 (Platform Sync)
- **Entry Conditions:** Video confirmed live in Stage 11.
- **Required Capabilities:** `PUBLICATION:SYNC`
- **Allowed Actions:** `POLL_SYNC`, `RECONCILE_METADATA`, `RE_PUSH_METADATA`
- **Required Data:** Live publication records, external platform metadata responses, drift indicators.
- **API Dependencies:** `GET /api/platform-sync/status`, `POST /api/platform-sync/reconcile`
- **Loading State:** Sync matrix skeleton.
- **Empty State:** *"All published videos are fully synchronized across platforms."*
- **Error State:** Drift alert callout highlighting discrepancies between CMS and YouTube.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Multi-channel sync table showing YouTube Shorts, Instagram Reels, and Facebook statuses with green checkmarks.
- **Revision / Failure Behavior:** Re-pushing CMS metadata updates the external platform without rolling back the video.
- **Next Workflow Step:** Advance to Stage 13 (`P-14 Social Retention Bay`).
- **Previous Workflow Step:** Stage 11 (`P-11 Publishing Manager`).
- **Breadcrumb:** `Publishing > Platform Sync`
- **Parent Navigation:** Global Shell -> Publishing -> Platform Sync
- **Deep-Link Behavior:** Direct access to sync status queue.
- **Owner:** `SOCIAL_LEAD`, `PUBLISHING_LEAD`

---

### Page Contract: P-13 (Analytics Dashboard)
- **Page ID:** `P-13`
- **Hub:** `ANALYTICS`
- **Page Name:** Analytics Dashboard
- **Canonical Route:** `/analytics`
- **Route Parameters:** None
- **Query Parameters:** `?range=7d|30d|90d&topic=`
- **Purpose:** High-level audience reach, watch time aggregations, and syllabus topic performance metrics.
- **Resource:** `AnalyticsSnapshot`
- **Workflow Stage:** N/A / Cross-cutting Telemetry Overview
- **Entry Conditions:** User authenticated.
- **Required Capabilities:** `ANALYTICS_SNAPSHOT:VIEW`
- **Allowed Actions:** `VIEW`, `FILTER_TIMEFRAME`, `EXPORT_REPORT`
- **Required Data:** Total views, aggregate watch time, completion rate distributions by topic.
- **API Dependencies:** `GET /api/analytics/overview`
- **Loading State:** Chart skeleton layouts.
- **Empty State:** *"Insufficient telemetry collected for the selected date range."*
- **Error State:** Chart failure error banner.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Responsive KPI summary tiles, topic performance heatmaps, and retention trend lines.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Contextual drill-down to `P-14 Social Retention Bay`.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Analytics > Overview`
- **Parent Navigation:** Global Shell -> Analytics -> Analytics Hub
- **Deep-Link Behavior:** Preserves date range and topic filter in URL.
- **Owner:** `ANALYST`, `CONTENT_LEAD`, `ADMIN`

---

### Page Contract: P-14 (Social Retention Bay)
- **Page ID:** `P-14`
- **Hub:** `ANALYTICS`
- **Page Name:** Social Retention Bay
- **Canonical Route:** `/social-analytics/:contentId`
- **Route Parameters:** `:contentId` (Content ID: `BP-CNT-######`)
- **Query Parameters:** `?milestone=24h|48h|7d` (Default: `24h`)
- **Purpose:** Content-level telemetry analysis displaying second-by-second audience retention curves, drop-off points, and viewer comments.
- **Resource:** `AnalyticsSnapshot`, `Content`
- **Workflow Stage:** Stage 13 (Analytics)
- **Entry Conditions:** 24-hour post-publication observation milestone reached.
- **Required Capabilities:** `ANALYTICS_SNAPSHOT:VIEW`, `ANALYTICS_SNAPSHOT:INGEST`
- **Allowed Actions:** `REFRESH_METRICS`, `ANALYZE_CURVE`, `DISPATCH_TO_REVIEW`
- **Required Data:** Second-by-second retention array, view count, average view duration (AVD), top comments.
- **API Dependencies:** `GET /api/analytics/:contentId`, `POST /api/analytics/:contentId/refresh`
- **Loading State:** Retention graph shimmer loader.
- **Empty State:** *"Awaiting 24-hour telemetry maturation. Check back in [X] hours."*
- **Error State:** Telemetry ingestion error banner with `[Re-fetch]` action.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** 404: *"Analytics record for [contentId] not found."*
- **Success State:** Interactive second-by-second curve showing student drop-off inflection points.
- **Revision / Failure Behavior:** Re-fetching queries the YouTube Analytics API without mutating historical records.
- **Next Workflow Step:** Advance to Stage 14 (`P-15 Performance Intelligence?tab=review`).
- **Previous Workflow Step:** Stage 12 (`P-12 Platform Sync Console`).
- **Breadcrumb:** `Analytics > Social Retention > BP-CNT-######`
- **Parent Navigation:** Analytics -> Analytics Dashboard -> Content Row
- **Deep-Link Behavior:** Permalinks to specific content telemetry.
- **Owner:** `ANALYST`, `CONTENT_LEAD`

---

### Page Contract: P-15 (Performance Intelligence & Strategy)
- **Page ID:** `P-15`
- **Hub:** `ANALYTICS`
- **Page Name:** Performance Intelligence & Strategy
- **Canonical Route:** `/analytics/intelligence`
- **Route Parameters:** None
- **Query Parameters:** `?contentId=&tab=review|intelligence` (Default: `intelligence`)
- **Purpose:** Stages 14 & 15 workbenches for retention drop-off diagnosis, pedagogical critique, and curriculum directive authorization.
- **Resource:** `PerformanceRecord`, `IntelligenceInsight`
- **Workflow Stage:** Stages 14 & 15 (Performance Review & Intelligence Loop)
- **Entry Conditions:** Stage 13 telemetry available.
- **Required Capabilities:** `PERFORMANCE_RECORD:REVIEW`, `PERFORMANCE_RECORD:CREATE`, `INTELLIGENCE_INSIGHT:APPROVE`
- **Allowed Actions:** `TAG_CONFUSION`, `FINALIZE_REVIEW`, `SYNTHESIZE_DIRECTIVE`, `APPROVE_DIRECTIVE`
- **Required Data:** Synchronized script text with retention drop-off markers, historical topic benchmarks, candidate AI insights.
- **API Dependencies:** `GET /api/analytics/intelligence`, `POST /api/analytics/intelligence/approve`
- **Loading State:** Split-screen script-retention diagnostic skeleton.
- **Empty State:** *"No completed videos awaiting diagnostic review."*
- **Error State:** Strategy synthesis error alert.
- **Unauthorized State:** HTTP 403 Forbidden. AI cannot approve directives autonomously (Principle 09).
- **Not Found State:** N/A
- **Success State:** Active diagnostic console mapping drop-off spikes directly to script dialogue lines, plus directive authorization queue.
- **Revision / Failure Behavior:** Strategist refines directive text within Stage 15 without restarting workflow.
- **Next Workflow Step:**
  - Current workflow instance: Transitions to `COMPLETED` (Archived).
  - Future cycle: Approved directive automatically seeds Stage 01 (`P-04 Question Studio`).
- **Previous Workflow Step:** Stage 13 (`P-14 Social Retention Bay`).
- **Breadcrumb:** `Analytics > Performance Intelligence`
- **Parent Navigation:** Global Shell -> Analytics -> Performance Intelligence
- **Deep-Link Behavior:** Supports direct content diagnostic lookup via `?contentId=...`.
- **Owner:** `CONTENT_LEAD`, `ADMIN`

---

### Page Contract: P-16 (Planning & Batches)
- **Page ID:** `P-16`
- **Hub:** `MANAGEMENT`
- **Page Name:** Planning & Batches
- **Canonical Route:** `/planning`
- **Route Parameters:** None
- **Query Parameters:** `?batchId=&topic=`
- **Purpose:** Syllabus sprint planning, curriculum topic distribution radar, and similarity deduplication monitoring.
- **Resource:** `ContentPlan`, `ContentBatch`, `Question`
- **Workflow Stage:** Pre-Production Planning
- **Entry Conditions:** User authenticated.
- **Required Capabilities:** `VIEW_PLANNING`, `QUESTION:CREATE`
- **Allowed Actions:** `CREATE_BATCH`, `ASSIGN_TOPIC`, `RUN_SIMILARITY_CHECK`
- **Required Data:** Syllabus taxonomy tree, active sprint batches, question count per topic.
- **API Dependencies:** `GET /api/planning/batches`, `POST /api/planning/batches`
- **Loading State:** Batch board skeleton.
- **Empty State:** *"No active planning sprints. Create a new syllabus batch to begin."*
- **Error State:** Planning service error banner.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Interactive syllabus coverage matrix and similarity radar with duplicate alert indicators.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Initiates batch question generation in `P-04 Question Studio`.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Management > Planning & Batches`
- **Parent Navigation:** Global Shell -> Management -> Planning & Batches
- **Deep-Link Behavior:** Preserves selected batch ID in query string.
- **Owner:** `CONTENT_LEAD`, `ADMIN`

---

### Page Contract: P-17 (Team Operations & Workload)
- **Page ID:** `P-17`
- **Hub:** `MANAGEMENT`
- **Page Name:** Team Operations & Workload
- **Canonical Route:** `/team`
- **Route Parameters:** None
- **Query Parameters:** `?role=&view=workload|unassigned` (Default: `workload`)
- **Purpose:** Team capacity monitoring, active assignment distribution, and unassigned work queue triage.
- **Resource:** `Assignment`, `User`, `Content`
- **Workflow Stage:** Cross-cutting Task Allocation
- **Entry Conditions:** User authenticated with management role.
- **Required Capabilities:** `VIEW_TEAM`, `USER:VIEW`
- **Allowed Actions:** `ASSIGN_TASK`, `REALLOCATE_WORKLOAD`, `TRIAGE_UNASSIGNED`
- **Required Data:** Team user cards with active task counts, overdue indicators, unassigned item queue.
- **API Dependencies:** `GET /api/team/workload`, `POST /api/team/assign`
- **Loading State:** User workload card skeletons.
- **Empty State:** *"All active production tasks are currently assigned."*
- **Error State:** Workload fetch error alert.
- **Unauthorized State:** HTTP 403 Forbidden.
- **Not Found State:** N/A
- **Success State:** Team capacity visualizer with drag-and-drop task reassignment between team members.
- **Revision / Failure Behavior:** N/A
- **Next Workflow Step:** Contextual jump to assigned resource.
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Management > Team Operations`
- **Parent Navigation:** Global Shell -> Management -> Team Workload
- **Deep-Link Behavior:** Filterable by operational role.
- **Owner:** `CONTENT_LEAD`, `ADMIN`

---

### Page Contract: P-18 (System Administration & Recovery)
- **Page ID:** `P-18`
- **Hub:** `MANAGEMENT`
- **Page Name:** System Administration & Recovery
- **Canonical Route:** `/admin`
- **Route Parameters:** None
- **Query Parameters:** `?tab=users|config|audit|recovery` (Default: `users`)
- **Purpose:** Strictly capability-gated administration bay for user management, system configuration, immutable audit trail inspection, and disaster recovery.
- **Resource:** `User`, `Role`, `Configuration`, `AuditEvent`, `ArchiveReference`
- **Workflow Stage:** Governance & Administrative Core
- **Entry Conditions:** Authenticated user possessing administrative capabilities.
- **Required Capabilities:** `CONFIGURATION:ADMINISTER`, `USER:ADMINISTER`, `AUDIT_EVENT:VIEW`
- **Allowed Actions:** `CREATE_USER`, `DEACTIVATE_USER`, `INVALIDATE_SESSIONS`, `VIEW_AUDIT`, `RESTORE_SNAPSHOT`
- **Required Data:** User directory, system environment status, audit log table, backup snapshot catalog.
- **API Dependencies:** `GET /api/users`, `GET /api/audit/logs`, `POST /api/recovery/restore`
- **Loading State:** Multi-tab administrative skeleton.
- **Empty State:** N/A
- **Error State:** Administrative critical error alert with diagnostic event code.
- **Unauthorized State:** HTTP 403 Forbidden. Page completely hidden from navigation for non-administrators.
- **Not Found State:** N/A
- **Success State:** Secure administrative dashboard with session invalidation controls, immutable audit search, and Coldline snapshot verification.
- **Revision / Failure Behavior:** Restoring a backup snapshot requires two-factor password confirmation and emits a high-priority audit log.
- **Next Workflow Step:** N/A
- **Previous Workflow Step:** N/A
- **Breadcrumb:** `Management > System Administration`
- **Parent Navigation:** Global Shell -> Management -> Administration
- **Deep-Link Behavior:** Preserves active administrative tab in URL.
- **Owner:** `ADMIN`

---

## 4. Master Page / Action Matrix

This matrix governs allowed actions across all 18 canonical pages:

| Page ID | Canonical Route | Hub | Required Capability | VIEW | CREATE | EDIT | SUBMIT | APPROVE | REJECT | PUBLISH | ARCHIVE | TRANSITION |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P-01** | `/dashboard` | HOME | `CONTENT:VIEW` | **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-02** | `/my-work` | HOME | `CONTENT:VIEW` | **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-03** | `/questions` | QUESTIONS | `QUESTION:VIEW` | **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-04** | `/studio` | QUESTIONS | `QUESTION:CREATE` | **YES** | **YES** | **YES** | **YES** | NO | NO | NO | NO | **T01-02** |
| **P-05** | `/questions/:id/verify` | QUESTIONS | `QUESTION_REVIEW:VERIFY`| **YES** | NO | NO | NO | **YES** | **YES** | NO | NO | **T02-03** |
| **P-06** | `/questions/:id` | QUESTIONS | `QUESTION:VIEW` | **YES** | NO | **YES** | NO | NO | NO | NO | **YES** | NO |
| **P-07** | `/queue` | PRODUCTION| `VIDEO:RECORD` | **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-08** | `/production` | PRODUCTION| `VIDEO:VIEW` | **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-09** | `/videos/:videoId` | PRODUCTION| `VIDEO:VIEW` | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** | NO | NO | **T03–08** |
| **P-10** | `/social-review/:id` | PUBLISHING | `SOCIAL_REVIEW:VIEW` | **YES** | NO | **YES** | NO | **YES** | **YES** | NO | NO | **T09-10** |
| **P-11** | `/publishing` | PUBLISHING | `PUBLISHING_PACKAGE:VIEW`| **YES** | NO | **YES** | NO | NO | NO | **YES** | NO | **T10-11** |
| **P-12** | `/platform-packages` | PUBLISHING | `PUBLICATION:SYNC` | **YES** | NO | NO | NO | NO | NO | NO | NO | **T12-13** |
| **P-13** | `/analytics` | ANALYTICS | `ANALYTICS_SNAPSHOT:VIEW`| **YES** | NO | NO | NO | NO | NO | NO | NO | NO |
| **P-14** | `/social-analytics/:id` | ANALYTICS | `ANALYTICS_SNAPSHOT:VIEW`| **YES** | NO | NO | NO | NO | NO | NO | NO | **T13-14** |
| **P-15** | `/analytics/intelligence`| ANALYTICS | `INTELLIGENCE_INSIGHT:VIEW`| **YES** | NO | **YES** | NO | **YES** | NO | NO | NO | **T14–15** |
| **P-16** | `/planning` | MANAGEMENT| `VIEW_PLANNING` | **YES** | **YES** | **YES** | NO | NO | NO | NO | NO | NO |
| **P-17** | `/team` | MANAGEMENT| `VIEW_TEAM` | **YES** | NO | **YES** | NO | NO | NO | NO | NO | NO |
| **P-18** | `/admin` | MANAGEMENT| `CONFIGURATION:ADMINISTER`| **YES** | **YES** | **YES** | NO | NO | NO | NO | **YES** | NO |

---

## 5. Canonical Workflow to Route Mapping (15 Stages)

Mapping the canonical 15-step production lifecycle to the canonical page contracts:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      CANONICAL 15-STEP WORKFLOW TO ROUTE MAPPING                       │
 ├────┬─────────────────────────┬──────────────────────────┬─────────────────────────────┤
 │ #  │ Canonical Stage Name    │ Supporting Workspace     │ Canonical Target Route      │
 ├────┼─────────────────────────┼──────────────────────────┼─────────────────────────────┤
 │ 01 │ Question Generation     │ P-04 Question Studio     │ `/studio`                   │
 │ 02 │ Question Verification   │ P-05 Question Verify     │ `/questions/:id/verify`     │
 │ 03 │ Audience Script         │ P-09 Video Workbench     │ `/videos/:videoId?tab=script`│
 │ 04 │ Teleprompter & Filming  │ P-09 Video Workbench     │ `/videos/:videoId?tab=recording`
 │ 05 │ Raw Video Handoff       │ P-09 Video Workbench     │ `/videos/:videoId?tab=recording`
 │ 06 │ Editing Bay             │ P-09 Video Workbench     │ `/videos/:videoId?tab=editing`
 │ 07 │ Final QC Certification  │ P-09 Video Workbench     │ `/videos/:videoId?tab=final-review`
 │ 08 │ Thumbnail Studio        │ P-09 Video Workbench     │ `/videos/:videoId?tab=thumbnail`
 │ 09 │ Social Review           │ P-10 Social Review       │ `/social-review/:reviewId`  │
 │ 10 │ Publishing Setup        │ P-11 Publishing Manager  │ `/publishing?tab=scheduled` │
 │ 11 │ Published               │ P-11 Publishing Manager  │ `/publishing?tab=live`      │
 │ 12 │ Platform Sync           │ P-12 Platform Sync       │ `/platform-packages`        │
 │ 13 │ Analytics               │ P-14 Social Retention    │ `/social-analytics/:contentId`
 │ 14 │ Performance Review      │ P-15 Performance Intel   │ `/analytics/intelligence?tab=review`
 │ 15 │ Intelligence Loop       │ P-15 Performance Intel   │ `/analytics/intelligence`   │
 └────┴─────────────────────────┴──────────────────────────┴─────────────────────────────┘
```

---

## 6. Route Retirement & Migration Plan

This plan governs the orderly migration and retirement of the 49 legacy redirect routes and 6 orphaned page files:

| Current Brownfield Route | Disposition | Migration Target Route | Retirement Stage | Migration Action |
| :--- | :---: | :--- | :---: | :--- |
| `/questions/new` | **REDIRECT** | `/studio` | Stage 21 | Redirect to canonical studio route. |
| `/generate` | **REDIRECT** | `/studio` | Stage 21 | Redirect legacy alias. |
| `/questions/improve` | **REDIRECT** | `/studio` | Stage 21 | Consolidated into studio page. |
| `/questions/:id/improve` | **REDIRECT** | `/questions/:id?mode=edit` | Stage 21 | Query param parameter mapping. |
| `/questions/verify` | **REDIRECT** | `/questions` | Stage 21 | Route missing ID redirects to library. |
| `/production-tracker` | **REDIRECT** | `/production` | Stage 21 | Redirect duplicate tracker alias. |
| `/production-board` | **REDIRECT** | `/production?stage=06` | Stage 21 | Redirect to filtered pipeline board. |
| `/videos/create-script` | **REDIRECT** | `/production` | Stage 21 | Redirect to pipeline board. |
| `/videos/:videoId/script` | **COMPATIBILITY**| `/videos/:videoId?tab=script` | Stage 21 | Parameter mapped to query param. |
| `/production/:videoId/script`| **COMPATIBILITY**| `/videos/:videoId?tab=script` | Stage 21 | Parameter mapped to query param. |
| `/videos/:videoId/record` | **COMPATIBILITY**| `/videos/:videoId?tab=recording` | Stage 21 | Parameter mapped to query param. |
| `/videos/:videoId/edit-video`| **COMPATIBILITY**| `/videos/:videoId?tab=editing` | Stage 21 | Parameter mapped to query param. |
| `/videos/:videoId/final-video`| **COMPATIBILITY**| `/videos/:videoId?tab=final-review`| Stage 21| Parameter mapped to query param. |
| `/videos/:videoId/thumbnail` | **COMPATIBILITY**| `/videos/:videoId?tab=thumbnail` | Stage 21 | Parameter mapped to query param. |
| `/videos/:videoId/social-review`| **COMPATIBILITY**| `/videos/:videoId?tab=social` | Stage 21 | Parameter mapped to query param. |
| `/production/:videoId` | **REDIRECT** | `/videos/:videoId` | Stage 21 | Consolidated into `/videos/:videoId`. |
| `/videos/platform-packages` | **REDIRECT** | `/platform-packages` | Stage 21 | Consolidated into canonical sync route.|
| `/publishing-package` | **REDIRECT** | `/publishing` | Stage 21 | Redirect to canonical publishing manager.|
| `/analytics/overview` | **REDIRECT** | `/analytics` | Stage 21 | Consolidated into canonical dashboard. |
| `/analytics/video` | **REDIRECT** | `/analytics` | Stage 21 | Sub-route folded into query filter. |
| `/analytics/engagement` | **REDIRECT** | `/analytics/intelligence?tab=review`| Stage 21 | Mapped to intelligence review tab. |
| `/analytics/retention` | **REDIRECT** | `/analytics/intelligence?tab=review`| Stage 21 | Mapped to intelligence review tab. |
| `/analytics/strategy` | **REDIRECT** | `/analytics/intelligence` | Stage 21 | Mapped to canonical intelligence loop. |
| `/social-analytics` | **REDIRECT** | `/analytics` | Stage 21 | Missing param redirects to overview. |
| `/team-work` | **REDIRECT** | `/team` | Stage 21 | Duplicate alias redirected. |
| `/recovery` | **REDIRECT** | `/admin?tab=recovery` | Stage 21 | Merged into administration bay. |
| `VideoEditPage.tsx` | **RETIRE** | None (Consolidated in P-09)| Stage 21 | Delete orphaned source file. |
| `VideoFinalPage.tsx` | **RETIRE** | None (Consolidated in P-09)| Stage 21 | Delete orphaned source file. |
| `VideoPinnedCommentPage.tsx`| **RETIRE**| None (Consolidated in P-10)| Stage 21 | Delete orphaned source file. |
| `VideoRecordPage.tsx` | **RETIRE** | None (Consolidated in P-09)| Stage 21 | Delete orphaned source file. |
| `VideoReviewScriptPage.tsx` | **RETIRE** | None (Consolidated in P-09)| Stage 21 | Delete orphaned source file. |
| `VideoThumbnailPage.tsx` | **RETIRE** | None (Consolidated in P-09)| Stage 21 | Delete orphaned source file. |

---

## 7. Route Accessibility Categories

Every route is classified into one of four security tiers (grounded in Stage 09 RBAC):

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             ROUTE ACCESSIBILITY CATEGORIES                             │
 ├───────────────────┬────────────────────────────────────────────────────────────────────┤
 │ Category          │ Security Rule & Behavior                                           │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ 1. PUBLIC         │ Accessible without session (Only `/login` and `/404`).             │
 │ 2. AUTHENTICATED  │ Requires valid session token (`/dashboard`, `/my-work`).           │
 │ 3. CAPABILITY-GATED│ Requires specific `RESOURCE:ACTION` token (e.g., `/studio` requires │
 │                   │ `QUESTION:CREATE`; `/questions/:id/verify` requires `QUESTION:VERIFY`).│
 │ 4. ADMIN-GATED    │ Restricted to `ADMIN` holding `CONFIGURATION:ADMINISTER` (`/admin`).│
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

**Client Guard Principle:** The React frontend uses route guards to redirect unauthenticated requests to `/login` and unauthorized requests to `/404` or `/dashboard`. However, **frontend route guards are never a security boundary**; Express server endpoints independently validate every request.

---

## 8. Standardized Error and Edge-State Contract

When navigating or deep-linking to canonical routes, the application renders predictable edge states:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                           STANDARDIZED EDGE-STATE CONTRACT                             │
 ├───────────────────────┬────────────────────────────────────────────────────────────────┤
 │ Condition             │ Prescribed Client-Side Presentation & Recovery                 │
 ├───────────────────────┼────────────────────────────────────────────────────────────────┤
 │ LOADING               │ Shimmer skeleton matching target component geometry.           │
 │ EMPTY QUEUE           │ Contextual graphic + "Create First [Entity]" CTA button.       │
 │ RESOURCE NOT FOUND    │ Standard 404 container: "Resource [ID] not found." + [Return]  │
 │ UNAUTHENTICATED (401) │ Session expired toast + immediate client redirect to `/login`. │
 │ FORBIDDEN (403)       │ "Permission Denied: Missing [CAPABILITY]" + link to /my-work.  │
 │ SELF-APPROVAL (GAR-02)│ Specific error badge: "Anti-Self-Approval: Another SME required"│
 │ STALE VERSION (409)   │ Non-destructive banner: "Record updated by another user." [Sync]│
 │ SERVER ERROR (500)    │ Friendly callout: "Unable to process request." [Retry]         │
 └───────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 9. Route Naming Rules & Conventions

To ensure perpetual stability, all target routes adhere to these **7 Naming Rules**:
1. **Lowercase Hyphenated URLs:** All static segments must use lowercase letters and hyphens (e.g., `/social-review`, `/platform-packages`).
2. **Plural Resource Collections:** Top-level resource collections are plural nouns (`/questions`, `/videos`).
3. **Canonical Route Parameters:** Dynamic entity identifiers use colon notation (`:id`, `:videoId`, `:reviewId`, `:contentId`).
4. **Sub-Actions as Query Parameters:** Sub-states and workspace modes are expressed via query parameters (`?tab=editing`, `?mode=edit`), avoiding deep URL path nesting.
5. **No Role Strings in URLs:** Routes must never contain role names (e.g., prohibited: `/admin-dashboard`, `/editor-studio`).
6. **No Workflow Step Numbers in URLs:** Canonical stages are identified by business domain names, not sequence numbers (e.g., prohibited: `/step-06`, `/step-11`).
7. **Deterministic Trailing Slashes:** Routes do not include trailing slashes (handled transparently by client router).

---

## 10. Mandatory Route Invariants

The routing architecture strictly enforces these **15 Route Invariants**:

1. **Singular Canonical Route:** Every canonical page (`P-01` through `P-18`) possesses exactly one authoritative route path.
2. **Singular Page Ownership:** Every canonical route is owned by exactly one top-level React page component.
3. **Compatibility Subordination:** Compatibility routes never supersede or compete with canonical routes; they redirect immediately.
4. **Zero Role Duplication:** No duplicate pages or routes exist for the same business responsibility based on user roles.
5. **Contextual Workflow Alignment:** Navigating through workflow stages occurs via contextual resource tabs, not global navigation sidebars.
6. **Server Authoritative Security:** Route guard evaluation is presentational; backend APIs enforce the definitive security boundary.
7. **Deterministic Deep-Links:** Entering a valid resource URL directly (e.g., `/videos/BP-V-000104?tab=editing`) loads that exact tab.
8. **Invalid Param 404:** Malformed or non-existent resource IDs render a canonical 404 page, never a blank screen.
9. **Zero Silent Admin Redirection:** Unauthenticated users are sent to `/login`, never silently defaulted to an Admin role.
10. **Tab State Normalization:** Omitting `?tab=` on `P-09 Video Production Workbench` automatically defaults to the tab matching the item's active `WorkflowInstance.currentStage`.
11. **Anti-Self-Approval Visibility:** Review routes visited by the author render disabled certification controls with `GAR-02` tooltips.
12. **Search Query Preservation:** Refreshing a filtered table view preserves active search and filter query parameters.
13. **Active Sidebar State:** Navigating to nested resource routes maintains active highlighting of the parent Authoritative Hub.
14. **Immediate Session Termination:** Navigating to logout clears client cookies and forces a clean redirect to `/login`.
15. **Full Testability:** Every canonical route must be testable via automated Cypress/Playwright integration suites in Stage 28.

---

## 11. Route Decision Register (RDR) & Brownfield Conflict Register (RBCR)

### 11.1 Route Decision Register (RDR)
| Decision ID | Route Decision | Alternatives Considered | Business & Technical Rationale | Downstream Stage |
| :---: | :--- | :--- | :--- | :---: |
| **RDR-001** | Consolidated Video Route (`/videos/:videoId`) | Separate routes for each stage (`/videos/:id/edit`, etc.) | Single param-bound route with `?tab=` query parameter maintains context and eliminates 24 redundant redirect definitions. | **Stage 18 / 21** |
| **RDR-002** | `/studio` as Canonical Authoring Route | `/questions/studio` or `/questions/new` | Matches existing user habits; provides short, memorable top-level authoring URL. | **Stage 18** |
| **RDR-003** | Query Params for Workspace Tabs | Nested child paths (`/videos/:id/tab/script`) | Query params allow flexible tab switching without triggering full React route dismounts. | **Stage 18** |
| **RDR-004** | Deprecation of 6 Orphaned Video Pages | Refactoring files into components | The files are completely dead code; keeping them creates technical debt and bundle bloat. | **Stage 21** |

### 11.2 Route Brownfield Conflict Register (RBCR)
| Conflict ID | Existing Route Conflict | Technical Risk | Canonical Resolution | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **RBCR-001** | Role-Based Landing Route Divergence | Users landed on disjoint pages based on `user.role`. | Replaces role redirects with unified Home / My Work dispatching. | **Stage 18** |
| **RBCR-002** | 24 Competing `VideoTabRedirect` Routes | Route sprawl in `App.tsx` (lines 114–146). | Consolidated into single `/videos/:videoId?tab=...` pattern. | **Stage 21** |
| **RBCR-003** | Inconsistent Route Parameter Names | Mixed usage of `:id`, `:videoId`, `:reviewId`, `:contentId`. | Standardizes parameter names per resource type in route contract. | **Stage 18** |
| **RBCR-004** | Dual Administration Routes (`/admin` & `/recovery`) | Duplicate routes for disaster recovery. | Consolidates under `/admin?tab=recovery`. | **Stage 21** |

---

## 12. Cross-Stage Traceability Matrix

### 12.1 Upstream Traceability (Stages 01–10 to Stage 11)
| Stage 11 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 3 (Page Contracts P-01 to P-18)**| Stage 10 Section 24 (Page Inventory) | Implements route specifications for all 18 canonical pages. |
| **Section 5 (Workflow Mapping)** | Stage 07 Canonical Workflow | Maps each of the 15 sequential stages to its supporting route. |
| **Section 4 (Page/Action Matrix)** | Stage 09 Master Authorization Matrix | Embeds Stage 09 capability tokens as required route entry gates. |
| **Section 8 (GAR-02 Edge States)** | Stage 02 AC-02 & Stage 09 Section 9 | Formulates client presentation for Anti-Self-Approval rejections. |
| **Section 6 (Retirement Plan)** | Stage 03 Baseline & Stage 10 Section 23 | Schedules retirement of 6 orphaned pages and 49 redirect aliases. |

### 12.2 Downstream Traceability (Stage 11 to Future Stages)
| Downstream Stage | Consumed Route Contract Component | Implementation Expectation |
| :--- | :--- | :--- |
| **Stage 12 — Data Architecture** | Resource IDs & Collections (Section 3) | Maps route parameters (`:videoId`, `:id`) to persistent table primary keys. |
| **Stage 13 — API Contract** | API Dependencies in Page Contracts | Specifies REST endpoints matching exact page data requirements. |
| **Stage 15 — Auth Implementation** | Route Accessibility Categories (Section 7) | Implements server-side session checks and capability middleware. |
| **Stage 18 — Frontend Shell** | Route Contracts & Navigation (Sections 3 & 9)| Refactors `App.tsx` and `navigation.ts` to implement canonical routes. |
| **Stage 21 — Production Workspaces** | Consolidated Video Workbench (`P-09`) | Implements tabbed video production studio; deletes 6 legacy files. |
| **Stage 28 — E2E Testing** | Complete Route Inventory & Edge States | Executes automated route traversal and deep-link regression tests. |

---

## 13. Explicit Implementation Boundary Statement

> [!IMPORTANT]
> **Explicit Implementation Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual, architectural **Page & Route Contract** for BP-CMS.
> 
> It does **NOT** define or execute:
> - Client-side routing code changes in `src/App.tsx`.
> - Modifications or deletions of page files in `src/pages/`.
> - Express route handler implementations or backend route redirects.
> - Database queries, Google Sheets schemas, or API contracts.
> - Runtime deployment or bundle recompilation.
> 
> Physical database architecture is deferred strictly to **Stage 12 (Data Architecture)**; REST API endpoint design to **Stage 13 (API Contract)**; and React routing implementation to **Stage 18 (Frontend Shell Implementation)** and **Stage 21 (Video Production Implementation)**.

---

## 14. Stage 11 Completion Checklist & Sign-off

- [x] Read all ten prior canonical artifacts (`01` through `10`).
- [x] Audited actual current routes in `src/App.tsx` (all 78 route paths categorized).
- [x] Audited all 31 page files in `src/pages/` including the 6 orphaned video page components.
- [x] Formulated authoritative Route Contracts for all 18 Canonical Pages (`P-01` through `P-18`).
- [x] Applied standardized Page Contract Template across all 18 pages covering all 26 required fields.
- [x] Mapped all 15 Canonical Workflow stages to specific frontend routes and contextual workspaces.
- [x] Established Master Page / Action Matrix binding capabilities and business states to route actions.
- [x] Formulated detailed Route Retirement & Migration Plan for the 49 legacy redirects and 6 orphaned files.
- [x] Defined 4 Route Accessibility Categories (Public, Authenticated, Capability-Gated, Admin-Gated).
- [x] Defined Standardized Error and Edge-State Contract (Loading, 404, 401, 403, 409, 500).
- [x] Established 7 Route Naming Rules & Conventions.
- [x] Codified 15 mandatory Route Invariants.
- [x] Established Route Decision Register (`RDR-001` through `RDR-004`).
- [x] Established Route Brownfield Conflict Register (`RBCR-001` through `RBCR-004`).
- [x] Formulated complete Upstream and Downstream Cross-Stage Traceability matrices.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 11 — PAGE & ROUTE CONTRACT
================================================================================
Artifact:            docs/architecture/11-PAGE-ROUTE-CONTRACT.md
Version:             11.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 11 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 11. Awaiting Stage 12 Instruction.
================================================================================
```
