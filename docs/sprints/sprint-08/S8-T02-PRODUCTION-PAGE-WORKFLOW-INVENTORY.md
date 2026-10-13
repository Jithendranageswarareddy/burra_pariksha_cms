# S8-T02 — Production Pages and Workflow Steps Forensic Inventory
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 08 — Task S8-T02: Production Pages, Workbenches, and 15-Step Canonical Lifecycle Reconciliation

```text
================================================================================
Document ID:       BP-S8-T02-WORKFLOW-PAGE-INVENTORY
Version:           1.0.0
Date:              2026-10-14
Status:            AUDIT COMPLETE / AUTHORITATIVE INVENTORY
Classification:    Internal Architecture & Production Engineering Audit
Inspected Commit:  cec9229 (main)
Scope:             Canonical Steps 01–15, Mounted Routes, Unmounted Page Files,
                   Workbench Tabs, RBAC Capabilities, and QC Gate Architecture
Downstream:        S8-T03 (Route & Workbench Consolidation Proposal),
                   S8-T04 (Quality Gate & QC Decoupling Implementation)
================================================================================
```

---

## 1. Executive Summary

This forensic inventory establishes the complete, evidence-based reconciliation between the **Canonical 15-Step Educational Content Workflow** (`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`), the **18 Canonical Page Contracts** (`docs/architecture/11-PAGE-ROUTE-CONTRACT.md`), and the actual **runtime implementation** across `frontend/app/App.tsx`, `frontend/pages/`, `frontend/components/`, `backend/server/routers/routes.ts`, and Firestore persistence repositories.

### Key Audit Findings:
1. **15-Step Lifecycle Fully Mapped but Structurally Asymmetric**:
   - Every canonical step from 01 through 15 has verified underlying domain models, state transition rules (`CANONICAL_TRANSITION_RULES` in `backend/domain/workflow/transition-matrix.ts`), and stepper representations (`ProductionJourneyBar.tsx`).
   - However, the physical presentation layer is highly asymmetric: Steps 01, 02, 09, 10, 12, and 13 have dedicated top-level pages; Steps 03, 04, 05, 06, 07, and 08 are collapsed into tabs of a single master workbench (`VideoDetailPage.tsx`); and Steps 14 and 15 are sub-tabs inside a monolithic analytics console (`AnalyticsExperiencePage.tsx`).
2. **8 Orphaned / Unmounted Page Files in `frontend/pages/`**:
   - `frontend/pages/` contains 32 page files, but only 24 are imported and mounted in `frontend/app/App.tsx`.
   - **8 complete page components remain completely unmounted**: `VideoFinalPage.tsx` (31 KB), `VideoEditPage.tsx` (38 KB), `VideoRecordPage.tsx` (52 KB), `VideoThumbnailPage.tsx` (40 KB), `VideoReviewScriptPage.tsx` (32 KB), `VideoPinnedCommentPage.tsx` (25 KB), `ProductionBoardPage.tsx` (43 KB), and `PublishingPackagePage.tsx` (36 KB). These represent 297 KB of orphaned brownfield source code.
3. **The QC Gate Duality (Overlapping Tab vs. Missing Dedicated Gate)**:
   - **Contractual Design**: Feature contract `FC-012-FINAL-QC-REVIEW-GATE.md` specifies a dedicated route `/qc/:videoId`, a dedicated collection `video_qc_reviews`, and endpoint `POST /api/v1/videos/:id/qc-reviews` with mandatory GAR-02 anti-self-approval.
   - **Runtime Reality**: Neither `/qc/:videoId` nor `POST /api/v1/videos/:id/qc-reviews` nor the `video_qc_reviews` collection exists in runtime code. Step 07 Final QC operates exclusively as tab `final-review` inside `VideoDetailPage.tsx` using `FinalReviewWorkspace.tsx`. The 6-point QC checklist exists strictly in ephemeral React state and is never persisted to Firestore; it merely calls generic `apiClient.updateVideoStatus` to set `video.status = READY_TO_UPLOAD`.
   - Concurrently, unmounted `VideoFinalPage.tsx` implements a contradictory 4-dimensional matrix that is completely unreachable by users.

---

## 2. Complete 15-Step Page-to-Workflow Matrix

The following matrix accounts for all 15 canonical business lifecycle steps, tracing each from frontend presentation to backend execution and database persistence:

| # | Step Name | Existing Page / Workbench | Route & Access Pattern | Frontend Implementation | Backend Operations | Roles (Responsible / Supervising) | Input Data & Source | Output Artifact | Entity State & Status | Allowed Actions | Validation & Approval Gates | Revision Routing | Persistence Mechanism | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **01** | **Question Generation** | `QuestionStudioPage` (P-04) | `/studio`<br>*(Aliases: `/questions/new`, `/generate`)* | [QuestionStudioPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionStudioPage.tsx), [QuestionStudio.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/features/question-generation/components/QuestionStudio.tsx), [useQuestionGeneration.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/features/question-generation/hooks/useQuestionGeneration.ts) | `POST /api/ai/generate`<br>`POST /api/questions/drafts`<br>`POST /api/questions`<br>`POST /api/workflow/instances` | `QUESTION_AUTHOR`<br>*(Sup: `CONTENT_LEAD`)* | Topic taxonomy (`topicId`, `subtopicId`), generation prompt options | `QuestionDraft` (`draft_<uuid>`), `Question` (`qst_<uuid>`) | Step 1<br>`contentStatus: DRAFT / GENERATED`<br>`stageStatus: IN_PROGRESS` | `GENERATE`, `EDIT`, `SAVE_DRAFT`, `QUESTION_SUBMIT` | Save: basic field presence.<br>Submit: 4 options, valid answer index (0–3), mathematical proof if required | Entry step; receives Step 02 revisions via `QUESTION_REQUEST_CHANGES` | Firestore `question_drafts`, `questions`, `workflow_instances` | **VERIFIED** |
| **02** | **Question Verification** | `QuestionVerifyApprovePage` (P-05) | `/questions/verify`<br>`/questions/:id/verify` | [QuestionVerifyApprovePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionVerifyApprovePage.tsx) | `GET /api/questions/:id`<br>`POST /api/questions/:id/verify`<br>`POST /api/workflow/:id/transition`<br>`POST /api/videos` *(stub creation)* | `QA_REVIEWER`<br>*(Sup: `CONTENT_LEAD`)* | Submitted `Question` in `IN_REVIEW`, mathematical proof steps, author ID | Approved `Question`, initial `Video` stub (`vid_<uuid>`) | Step 2<br>`contentStatus: IN_REVIEW -> APPROVED`<br>`stageStatus: PENDING_REVIEW` | `INSPECT`, `CERTIFY`, `QUESTION_APPROVE`, `QUESTION_REQUEST_CHANGES`, `QUESTION_TERMINATE` | **GAR-02 Anti-Self-Approval** (`authorId !== reviewerId`), 10-point pedagogical audit | Rejection returns to Step 01 (`/studio` or `/questions/:id?mode=edit`) | Firestore `questions` (`status = APPROVED`), `videos` (`status = QUEUED`), `workflow_instances`, `audit_logs` | **VERIFIED** |
| **03** | **Audience Script** | `VideoDetailPage` tab `script` (P-09)<br>*(Also: `VideoCreateScriptPage`)* | `/videos/:videoId?tab=script`<br>`/videos/create-script` | [ScriptWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/ScriptWorkspace.tsx), [VideoCreateScriptPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoCreateScriptPage.tsx) | `GET /api/scripts/:videoId`<br>`POST /api/scripts`<br>`PUT /api/scripts/:id`<br>`POST /api/workflow/:id/transition` (`LOCK_SCRIPT`) | `SCRIPTWRITER`<br>*(Sup: `CONTENT_LEAD`)* | Approved Question text, distractors, explanation | `Script` (`scr_<uuid>`), pacing markers, 3s hook | Step 3<br>`video.status: SCRIPT_REQUIRED -> SCRIPT_READY`<br>`contentStatus: APPROVED` | `EDIT_SCRIPT`, `SAVE_SCRIPT_DRAFT`, `LOCK_SCRIPT`, `ESCALATE_QUESTION_DEFECT` | Speaking duration $\le 60\text{s}$ (target 45–58s), 3-second hook verified, script frozen | Returns to Step 03 if requested by studio host during Step 04 | Firestore `scripts`, `videos` (`scriptId`, `status = SCRIPT_READY`), `workflow_instances` | **VERIFIED** |
| **04** | **Teleprompter & Filming** | `VideoDetailPage` tab `recording` (P-09)<br>*(Queue: `QueuePage` P-07)* | `/videos/:videoId?tab=recording`<br>`/queue` | [RecordingWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/RecordingWorkspace.tsx), [QueuePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QueuePage.tsx) | `GET /api/queue`<br>`POST /api/videos/:id/takes`<br>`POST /api/videos/:id/status` (`RECORDING`)<br>`POST /api/workflow/:id/transition` | `PRESENTER`<br>*(Sup: `PRODUCER` / `CONTENT_LEAD`)* | Locked `Script` (`SCRIPT_READY`), presenter assignment | `VideoTake` records, golden take metadata, presenter session notes | Step 4<br>`video.status: RECORDING`<br>`mediaStatus: PENDING_UPLOAD` | `START_FILMING`, `SCROLL_PROMPTER`, `LOG_TAKE`, `FILMING_COMPLETE`, `REQUEST_SCRIPT_REVISION` | Script locked check; at least 1 valid take logged before completing filming | Tongue-twister/dialogue defect returns to Step 03 via `REQUEST_SCRIPT_REVISION` | Firestore `videos` (`takes`, `actualDurationSeconds`, `status`), `workflow_instances` | **VERIFIED** |
| **05** | **Raw Video** | Reused inside `VideoDetailPage` tab `recording` (P-09) | `/videos/:videoId?tab=recording` *(bottom section)* | [RecordingWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/RecordingWorkspace.tsx) *(Raw Video Handoff section)* | `PUT /api/videos/:id`<br>`POST /api/videos/:id/status` (`RECORDED`)<br>`POST /api/workflow/:id/transition` (`VIDEO_INGEST`) | Camera Operator / Production Lead<br>*(Sup: `PRODUCER`)* | Raw camera MP4/MOV footage, Google Drive folder URL | Registered media metadata (`driveFolderUrl`, `rawFootagePath`) | Step 5<br>`video.status: RECORDED`<br>`mediaStatus: READY` | `UPLOAD_RAW`, `LINK_DRIVE_FOLDER`, `DISPATCH_EDITING`, `RE_SHOOT_REQUIRED` | Valid Google Drive folder / file link format check | Corrupt or unusable footage returns to Step 04 via `RE_SHOOT_REQUIRED` | Firestore `videos` (`rawFootagePath`, `driveFolderUrl`, `status = RECORDED`), `workflow_instances` | **ADAPTED** *(Sub-section, no standalone page)* |
| **06** | **Editing Bay** | `VideoDetailPage` tab `editing` (P-09) | `/videos/:videoId?tab=editing` | [EditingWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/EditingWorkspace.tsx) | `PUT /api/videos/:id`<br>`POST /api/videos/:id/status` (`EDITED`)<br>`POST /api/workflow/:id/transition` (`SUBMIT_QC`) | `VIDEO_EDITOR`<br>*(Sup: Lead Producer / `CONTENT_LEAD`)* | Raw footage in Drive, locked script dialogue lines | Master Render Cut (`finalRenderPath`), dynamic Telugu captions, sound mix | Step 6<br>`video.status: EDITING -> EDITED`<br>`contentStatus: IN_REVIEW` | `SAVE_EDIT_CUT`, `SUBMIT_QC`, `REQUEST_RE_SHOOT` | 9:16 vertical ratio check, non-empty master cut Drive link, Telugu caption completeness | Rejection from Step 07 returns to Step 06 with timecoded defect list | Firestore `videos` (`finalRenderPath`, `status = EDITED`), `workflow_instances` | **VERIFIED** |
| **07** | **Final QC** | `VideoDetailPage` tab `final-review` (P-09)<br>*(Orphaned: `VideoFinalPage`)* | `/videos/:videoId?tab=final-review`<br>*(Redirect: `/videos/:videoId/final-video`)* | [FinalReviewWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/FinalReviewWorkspace.tsx), [VideoFinalPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoFinalPage.tsx) *(unmounted)* | `POST /api/videos/:id/status` (`READY_TO_UPLOAD` / `EDITING`)<br>`POST /api/workflow/:id/transition` (`VIDEO_QC_VERIFY` / `APPROVE_QC` / `VIDEO_QC_REJECT`) | Quality Control Lead / `QA_REVIEWER`<br>*(Sup: `CONTENT_LEAD`)* | Master render cut (`finalRenderPath`), linked `Question`, locked `Script` | QC Certified Video status (`READY_TO_UPLOAD`), inspection remarks | Step 7<br>`video.status: FINAL_REVIEW -> READY_TO_UPLOAD`<br>`contentStatus: APPROVED` | `APPROVE_QC`, `VIDEO_QC_VERIFY`, `VIDEO_QC_REJECT` | **GAR-02 Anti-Self-Approval** (`editorId !== reviewerId`), 6-point Master QC standards (LUFS -14, safe-zones) | Rejection returns to Step 06 (`/videos/:id?tab=editing`) with defect notes | Firestore `videos` (`status = READY_TO_UPLOAD`, `notes`), `workflow_instances`, `audit_logs` *(Note: `video_qc_reviews` collection unbuilt)* | **DUAL/OVERLAPPING** *(See Sec. 4)* |
| **08** | **Thumbnail** | `VideoDetailPage` tab `thumbnail` (P-09) | `/videos/:videoId?tab=thumbnail`<br>*(Redirect: `/videos/:videoId/thumbnail`)* | [ThumbnailWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/ThumbnailWorkspace.tsx) | `GET /api/thumbnails/:videoId`<br>`POST /api/thumbnails`<br>`POST /api/thumbnails/:id/approve`<br>`POST /api/workflow/:id/transition` | `DESIGNER`<br>*(Sup: `SOCIAL_LEAD` / `CONTENT_LEAD`)* | Approved Question headline, curiosity framing concept | `Thumbnail` (`thm_<uuid>`), Drive image asset link, CTR prediction | Step 8<br>`thumbnail.status: DRAFT -> APPROVED`<br>`contentStatus: APPROVED` | `GENERATE_CANDIDATES`, `UPLOAD_ARTWORK`, `THUMBNAIL_APPROVE` | Minimum 1080x1920 (or 720x1280) resolution, mobile contrast test, Drive asset verified | Rejection from Step 09 returns to Step 08 (`/videos/:id?tab=thumbnail`) | Firestore `thumbnails`, `videos` (`thumbnailId`), `workflow_instances` | **VERIFIED** |
| **09** | **Social Review** | `SocialReviewPage` (P-10)<br>*(Also: `VideoDetailPage` tab `social`)* | `/social-review/:reviewId`<br>`/social-review`<br>`/videos/:videoId?tab=social` | [SocialReviewPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/SocialReviewPage.tsx), [SocialReviewWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/social/SocialReviewWorkspace.tsx) | `GET /api/social-reviews/:id`<br>`POST /api/social-reviews/:id/approve`<br>`POST /api/social-reviews/:id/request-changes`<br>`POST /api/workflow/:id/transition` | `SOCIAL_LEAD` / `PUBLISHING_LEAD`<br>*(Sup: `CONTENT_LEAD`)* | QC-approved video (`READY_TO_UPLOAD`), approved thumbnail, post copy, hashtags, pinned comment | Certified `SocialReviewPackageBundle` (`APPROVED`) | Step 9<br>`socialReview.status: APPROVED`<br>`publicationStatus: UNPUBLISHED` | `INSPECT_SIMULATOR`, `EDIT_COPY`, `SOCIAL_REVIEW_APPROVE`, `REQUEST_THUMBNAIL_REVISION`, `REQUEST_VIDEO_REVISION` | **GAR-02 Anti-Self-Approval** (script hook author cannot approve social package), 9:16 mobile simulator safe-zone audit | Thumbnail defect $\to$ Step 08;<br>Video subtitle/UI defect $\to$ Step 06 | Firestore `social_reviews`, `workflow_instances`, `audit_logs` | **VERIFIED** |
| **10** | **Publishing Setup** | `PublishingPage` (P-11)<br>*(Also: `VideoDetailPage` tab `publishing`)* | `/publishing`<br>`/videos/:videoId?tab=publishing` | [PublishingPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PublishingPage.tsx), [PublishingWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/PublishingWorkspace.tsx) | `GET /api/publishing/schedule`<br>`POST /api/publishing`<br>`PUT /api/publishing/:id`<br>`POST /api/workflow/:id/transition` (`PUBLISH_SCHEDULE`) | Release Coordinator / `PUBLISHING_LEAD`<br>*(Sup: `CONTENT_LEAD`)* | Approved social review bundle, target platform toggles (YouTube Shorts, Reels, FB) | `Publishing` record (`pub_<uuid>`), scheduled distribution slots | Step 10<br>`publishing.status: SCHEDULED`<br>`publicationStatus: SCHEDULED` | `CONFIGURE_PLATFORMS`, `ASSIGN_SLOT`, `PUBLISH_SCHEDULE`, `REQUEST_COPY_REVISION` | Prerequisite assets confirmed (video render, thumbnail, pinned comment), scheduled timestamp in future | Copy defect returns to Step 09 (`/social-review/:reviewId`) | Firestore `publishing`, `workflow_instances` | **VERIFIED** |
| **11** | **Published** | Reused inside `PublishingPage` (P-11 tab "Live") | `/publishing?tab=live`<br>`/videos/:videoId?tab=publishing` | [PublishingPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PublishingPage.tsx) *(Live / Dispatched tab)* | `POST /api/publishing/:id/dispatch`<br>`POST /api/publishing/:id/live`<br>`POST /api/workflow/:id/transition` (`PUBLISH_EXECUTE`) | Distribution Specialist / `PUBLISHING_LEAD`<br>*(Sup: `CONTENT_LEAD`)* | Scheduled publishing record, manual/automated publish trigger | Live platform post URLs (`youtube.postUrl`, `instagram.postUrl`), external video IDs | Step 11<br>`publicationStatus: LIVE`<br>`publishing.status: PUBLISHED` | `PUBLISH_EXECUTE`, `CONFIRM_LIVE`, `VERIFY_URL`, `CANCEL_SCHEDULE` | Strict regex URL validation for platform URLs (`youtube.com/shorts/...`, `instagram.com/reel/...`) | Cancelled schedule returns to Step 10 via `CANCEL_SCHEDULE` | Firestore `publishing` (`postUrl`, `status = PUBLISHED`), `workflow_instances` | **ADAPTED** *(Sub-tab, no standalone page)* |
| **12** | **Platform Sync** | `PlatformPackagesPage` (P-12) | `/platform-packages`<br>`/platform-packages/:videoId` | [PlatformPackagesPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PlatformPackagesPage.tsx) | `GET /api/platform-packages/:videoId`<br>`POST /api/platform-sync/reconcile`<br>`POST /api/workflow/:id/transition` (`PLATFORM_SYNC`) | Social Operations Specialist / `PUBLISHING_LEAD`<br>*(Sup: `CONTENT_LEAD`)* | Live published post URLs and platform response payloads | Cross-platform sync status record, verified pinned comment state | Step 12<br>`publicationStatus: SYNCED`<br>`completedPlatformsCount == totalPlatformsCount` | `POLL_SYNC`, `RECONCILE_METADATA`, `RE_PUSH_METADATA`, `COMPLETE_SYNC` | Character limits, hashtags, and description compliance across all active platforms | Re-pushing metadata updates platform without rewinding video workflow | Firestore `publishing` / `platform_packages`, `workflow_instances` | **VERIFIED** |
| **13** | **Analytics** | `SocialAnalyticsPage` (P-14)<br>*(Overview: `AnalyticsExperiencePage` P-13)* | `/social-analytics/:contentId`<br>`/analytics/overview` | [SocialAnalyticsPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/SocialAnalyticsPage.tsx), [AnalyticsExperiencePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/AnalyticsExperiencePage.tsx) | `GET /api/social-analytics/:contentId`<br>`POST /api/social-analytics`<br>`POST /api/workflow/:id/transition` (`ANALYTICS_INGEST`) | `ANALYST`<br>*(Sup: `CONTENT_LEAD`)* | External platform video IDs, 24h / 7d telemetry streams | `AnalyticsSnapshot` (`asn_<uuid>`), second-by-second retention curve, views, AVD | Step 13<br>`stageStatus: IN_PROGRESS`<br>`workflowStatus: ACTIVE` | `REFRESH_METRICS`, `ANALYZE_CURVE`, `DISPATCH_PERF_REVIEW` | 24-hour observation maturity milestone reached | Metric re-fetch without workflow rollback | Firestore `analytics_snapshots` / `social_analytics`, `workflow_instances` | **VERIFIED** |
| **14** | **Performance Review** | Reused inside `AnalyticsExperiencePage` (P-15 tab "Engagement") | `/analytics/engagement`<br>`/analytics/retention` | [AnalyticsExperiencePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/AnalyticsExperiencePage.tsx) *(tabs engagement & retention)* | `GET /api/analytics/engagement`<br>`POST /api/analytics/reviews`<br>`POST /api/workflow/:id/transition` (`PERFORMANCE_INDEX`) | `ANALYST` / `CONTENT_LEAD`<br>*(Sup: Executive Producer)* | Second-by-second retention curves (Step 13), spoken dialogue lines (Step 03) | `PerformanceRecord` (`prf_<uuid>`), student confusion inflection points, pedagogical critique | Step 14<br>`stageStatus: COMPLETED` | `TAG_CONFUSION`, `LOG_CRITIQUE`, `PERFORMANCE_INDEX`, `FINALIZE_PERF_REVIEW` | Retention drop-off causes mapped directly to specific script lines | Critique refinement without workflow rewinding | Firestore `performance_records`, `workflow_instances` | **ADAPTED** *(Sub-tab, no standalone page)* |
| **15** | **Intelligence Loop** | Reused inside `AnalyticsExperiencePage` (P-15 tab "Intelligence") | `/analytics/intelligence`<br>`/analytics/strategy` | [AnalyticsExperiencePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/AnalyticsExperiencePage.tsx) *(tabs intelligence & strategy)* | `GET /api/analytics/intelligence`<br>`POST /api/analytics/intelligence/approve`<br>`POST /api/workflow/:id/transition` (`INTELLIGENCE_LOOP_FEED`) | `CONTENT_LEAD` / `ADMIN`<br>*(Sup: Executive Producer / AI Engine)* | Pedagogical confusion patterns (Step 14), curriculum syllabus coverage radar | `IntelligenceInsight` (`ins_<uuid>`), Curriculum Strategy Directive, archived workflow instance | Step 15<br>`workflowStatus: COMPLETED`<br>`contentStatus: ARCHIVED`<br>`jobStatus: COMPLETED` | `SYNTHESIZE_DIRECTIVE`, `APPROVE_DIRECTIVE`, `INTELLIGENCE_LOOP_FEED`, `COMPLETE_WORKFLOW` | **Principle 09 / AP-009**: Human review mandatory; AI cannot autonomously approve directives | Approved directive loopback seeds new content cycle in Step 01 (`/studio`); instance archives | Firestore `intelligence_insights`, `workflow_instances` (`status = COMPLETED`), `audit_logs` | **ADAPTED** *(Sub-tab, no standalone page)* |

---

## 3. Page and Route Inventory with Classifications

### 3.1 All 32 Files in `frontend/pages/` Classified

Every file in `frontend/pages/` has been inspected and classified against its canonical architectural responsibility:

| File Name | Mounted in `App.tsx`? | Route(s) in `App.tsx` | Canonical Contract | Architectural Classification | Rationale & Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- |
| [AnalyticsExperiencePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/AnalyticsExperiencePage.tsx) | **YES** | `/analytics/overview`, `/analytics/video`, `/analytics/platform`, `/analytics/topic`, `/analytics/subtopic`, `/analytics/difficulty`, `/analytics/engagement`, `/analytics/retention`, `/analytics/intelligence`, `/analytics/strategy` | P-13, P-15 | **Needs Adaptation** | Monolithic 60.7 KB page handling 10 distinct sub-routes via internal state tabs. Embeds Canonical Step 14 (Performance Review) and Step 15 (Intelligence Loop) rather than hosting isolated workbenches. |
| [ContentMasterPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/ContentMasterPage.tsx) | **YES** | `/content-masters`, `/content-masters/:id` | Operational | **Reusable** | Well-isolated master entity manager for cross-domain correlation (ContentMaster $\to$ Question $\to$ Video $\to$ Publishing). |
| [DashboardPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/DashboardPage.tsx) | **YES** | `/dashboard` | P-01 | **Reusable** | Primary operational pulse overview. Correctly utilizes `useAuth`, `apiClient.getDashboardStats`, and clean metric cards. |
| [LoginPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/LoginPage.tsx) | **YES** | Rendered when `!user` | Auth Core | **Reusable** | Session credential authentication entry point with secure password dispatch and team selector. |
| [MyWorkPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/MyWorkPage.tsx) | **YES** | `/my-work` | P-02 | **Reusable** | Personalized task queue filtering assignments and GAR-02 eligible reviews. |
| [NotFoundPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/NotFoundPage.tsx) | **YES** | `*` (Catch-all) | System | **Reusable** | 404 error fallback component. |
| [PlanningPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PlanningPage.tsx) | **YES** | `/planning` | P-16 | **Reusable** | Syllabus coverage matrix, sprint batches, and question generation dispatcher. |
| [PlatformPackagesPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PlatformPackagesPage.tsx) | **YES** | `/platform-packages`, `/platform-packages/:videoId` | P-12 | **Reusable** | Canonical Step 12 Platform Sync Console. Verifies cross-platform character counts, tags, and pinned comments. |
| [ProductionBoardPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/ProductionBoardPage.tsx) | **NO** | *Unmounted* (`/production-board` redirects to `/production?status=EDITING`) | P-08 | **Potentially Redundant** | 43.8 KB full Kanban board implementation completely bypassed by redirect in `App.tsx` line 120. Duplicates pipeline board capabilities of `ProductionTrackerPage.tsx`. |
| [ProductionTrackerPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/ProductionTrackerPage.tsx) | **YES** | `/production` | P-08 | **Needs Adaptation** | Serves as Canonical P-08 Production Pipeline Board, but page title states "Production Tracker" and primarily defaults to table view. Requires title and view alignment with P-08 contract. |
| [ProfilePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/ProfilePage.tsx) | **YES** | `/profile` | User Ops | **Reusable** | User account settings and session capability inspector. |
| [PublishingPackagePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PublishingPackagePage.tsx) | **NO** | *Unmounted* (`/publishing-package` redirects to `/platform-packages`) | P-12 | **Potentially Redundant** | 36.0 KB orphaned legacy page from Sprint 3. Bypassed by redirect in `App.tsx` line 168. Completely superseded by `PlatformPackagesPage.tsx`. |
| [PublishingPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PublishingPage.tsx) | **YES** | `/publishing` | P-11 | **Needs Adaptation** | Covers Step 10 (Publishing Setup) and Step 11 (Published). Features release calendar and live link verification, but blends scheduling and dispatch into single views. |
| [QuestionDetailPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionDetailPage.tsx) | **YES** | `/questions/:id` | P-06 | **Reusable** | 58.4 KB comprehensive 5-section question resource inspector, proof viewer, version switcher, and audit logger. |
| [QuestionImprovePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionImprovePage.tsx) | **YES** | `/questions/improve`<br>*(Param route redirects to `/questions/:id?mode=edit`)* | Non-canonical | **Potentially Redundant / Needs Adaptation** | 44.1 KB legacy standalone page. Parameterized route `/questions/:id/improve` redirects away to `QuestionDetailPage`. Standalone `/questions/improve` without ID has unverified workflow purpose. |
| [QuestionLibraryPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionLibraryPage.tsx) | **YES** | `/questions` | P-03 | **Reusable** | Searchable, filterable question master catalog with two-tier topic taxonomy pills. |
| [QuestionStudioPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionStudioPage.tsx) | **YES** | `/studio` | P-04 | **Reusable** | Clean, thin presentation wrapper (498 bytes) mounting the vertical feature slice `QuestionStudio` component. |
| [QuestionVerifyApprovePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionVerifyApprovePage.tsx) | **YES** | `/questions/verify`, `/questions/:id/verify` | P-05 | **Reusable** | Canonical Step 02 Question Verification workspace. 10-point pedagogical audit, proof checker, and GAR-02 enforcement. |
| [QueuePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QueuePage.tsx) | **YES** | `/queue` | P-07 | **Reusable** | Studio recording call sheet displaying filming schedule, script readiness, and presenter avatars. |
| [RecoveryAdminPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/RecoveryAdminPage.tsx) | **YES** | `/recovery`, `/admin` | P-18 | **Needs Adaptation** | 114.3 KB heavyweight administrative bay. Combines disaster recovery, Coldline snapshots, audit explorer, and user administration. Should cleanly separate routine administration from disaster recovery. |
| [SettingsPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/SettingsPage.tsx) | **YES** | `/settings` | System Ops | **Reusable** | System parameters, AI model configuration, and feature flag management. |
| [SocialAnalyticsPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/SocialAnalyticsPage.tsx) | **YES** | `/social-analytics`, `/social-analytics/:contentId` | P-14 | **Reusable** | Canonical Step 13 Social Retention Bay. Interactive second-by-second curve, audience retention graph, and comment engagement. |
| [SocialReviewPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/SocialReviewPage.tsx) | **YES** | `/social-review`, `/social-review/:reviewId` | P-10 | **Reusable** | Canonical Step 09 Social Review Studio. 9:16 mobile simulator with platform chrome overlays and copy signoff. |
| [TeamOperationsPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/TeamOperationsPage.tsx) | **YES** | `/team`, `/team-work` | P-17 | **Reusable** | Team workload visualizer, capacity monitoring, and task reassignment dispatcher. |
| [VideoCreateScriptPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoCreateScriptPage.tsx) | **YES** | `/videos/create-script` | Non-canonical (P-09 tab) | **Potentially Redundant** | Thin standalone script generation page. Competes with `VideoDetailPage?tab=script` and duplicates script generation initiation. |
| [VideoDetailPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoDetailPage.tsx) | **YES** | `/videos/:videoId` | P-09 | **Needs Adaptation** | Canonical P-09 Video Production Workbench. Houses 8 separate workspace components across Steps 03–10. Needs adaptation to streamline route synchronization and reduce reliance on unverified query params. |
| [VideoEditPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoEditPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/edit-video` redirects to `/videos/:videoId?tab=editing`) | P-09 tab | **Potentially Redundant** | 38.7 KB orphaned standalone editing page. Bypassed by redirect in `App.tsx` line 138. Duplicates `EditingWorkspace.tsx`. |
| [VideoFinalPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoFinalPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/final-video` redirects to `/videos/:videoId?tab=final-review`) | P-09 tab / FC-012 | **Potentially Redundant** | 31.2 KB orphaned standalone QC page. Bypassed by redirect in `App.tsx` line 142. Features conflicting 4-dimensional matrix vs 6-point `FinalReviewWorkspace.tsx`. |
| [VideoPinnedCommentPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoPinnedCommentPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/pinned-comment` redirects to `/videos/:videoId?tab=pinned-comment`) | P-09 tab | **Potentially Redundant** | 25.8 KB orphaned standalone page. Bypassed by redirect in `App.tsx` line 151. Duplicates `PinnedCommentWorkspace.tsx`. |
| [VideoRecordPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoRecordPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/record` redirects to `/videos/:videoId?tab=recording`) | P-09 tab | **Potentially Redundant** | 52.1 KB orphaned standalone teleprompter page. Bypassed by redirect in `App.tsx` line 134. Duplicates `RecordingWorkspace.tsx`. |
| [VideoReviewScriptPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoReviewScriptPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/review-script` redirects to `/videos/:videoId?tab=script`) | P-09 tab | **Potentially Redundant** | 32.3 KB orphaned standalone script review page. Bypassed by redirect in `App.tsx` line 130. Duplicates `ScriptWorkspace.tsx`. |
| [VideoThumbnailPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoThumbnailPage.tsx) | **NO** | *Unmounted* (`/videos/:videoId/thumbnail` redirects to `/videos/:videoId?tab=thumbnail`) | P-09 tab | **Potentially Redundant** | 40.6 KB orphaned standalone thumbnail page. Bypassed by redirect in `App.tsx` line 147. Duplicates `ThumbnailWorkspace.tsx`. |

---

## 4. Resolution of Quality Control (QC) Classification

### 4.1 The Core Problem
Across the architecture contracts and codebase, Quality Control (QC) exhibits a dual nature:
- Is QC a **distinct, standalone governance gate** with its own route, schema, and persistent audit record?
- Or is QC an **embedded sub-tab** of the general video production workbench (`VideoDetailPage.tsx`)?

### 4.2 Comprehensive Evidence Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                EVIDENCE AUDIT: QC CLASSIFICATION DUALITY                               │
├──────────────────────────┬───────────────────────────────┬─────────────────────────────────────────────┤
│ Architectural Dimension  │ Contracted / Historical Design │ Verified Runtime Implementation             │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 1. Dedicated Route       │ FC-012: `/qc/:videoId`        │ MISSING. App.tsx mounts NO /qc route.       │
│                          │ P-09 Tab: `/videos/:id?tab=..`│ Tab mounted at `/videos/:videoId`           │
│                          │ Legacy: `/videos/final-video` │ Redirects to `/production?status=..`        │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. UI Component          │ `VideoFinalPage.tsx` (31 KB)  │ UNMOUNTED in App.tsx (0 user visits).       │
│                          │ `FinalReviewWorkspace.tsx`    │ MOUNTED inside VideoDetailPage.tsx.         │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Checklist Standards   │ FC-012: 5-Point Checklist     │ Neither FC-012 nor VideoFinalPage active.   │
│                          │ VideoFinalPage: 4-D Matrix    │ FinalReviewWorkspace uses 6-Point Master    │
│                          │ FinalReview: 6-Point Standards│ Video QC Standards (LUFS -14, Safe Zones).  │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 4. Backend Route         │ `POST /api/v1/videos/:id/qc..`│ DOES NOT EXIST in routes.ts (HTTP 404).     │
│                          │ `POST /api/videos/:id/status` │ VERIFIED. Generic video status endpoint.    │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 5. Datastore Collection  │ `video_qc_reviews`            │ DOES NOT EXIST in Firestore. 0 collections. │
│                          │ `videos` collection           │ Updates `videos[id].status = READY_TO_UPLOAD│
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 6. Checklist Persistence │ Persistent review ledger      │ EPHEMERAL in React state (`qcChecks`).      │
│                          │ with timestamped defects      │ Lost immediately upon browser refresh!      │
├──────────────────────────┼───────────────────────────────┼─────────────────────────────────────────────┤
│ 7. GAR-02 Rule           │ Server-enforced anti-self-appr│ transition-matrix.ts defines rule, but      │
│                          │ (editorId !== reviewerId)     │ FinalReviewWorkspace bypasses workflow API! │
└──────────────────────────┴───────────────────────────────┴─────────────────────────────────────────────┘
```

### 4.3 Detailed Code Citations:
1. **Unmounted Legacy Page**:
   - In [frontend/pages/VideoFinalPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/VideoFinalPage.tsx#L52-L58):
     ```typescript
     const [qcState, setQcState] = useState({
       audioBalance: true,      // -14 LUFS Voiceover / Crisp SFX
       subtitleTelugu: true,    // Accurate Telugu Orthography
       frameSafePacing: true,   // 9:16 Vertical Safe Area
       pedagogicalKey: true,    // Correct Answer Option Key Matches Question
     });
     ```
   - This 4-dimensional matrix has no connection to `FC-012`'s 5 points or `FinalReviewWorkspace.tsx`'s 6 points.
2. **Active Runtime Component**:
   - In [frontend/components/video/FinalReviewWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/FinalReviewWorkspace.tsx#L38-L75):
     Defines 6 standards: `questionScriptMatch`, `resolutionFormat`, `safeZones`, `audioClarity`, `teluguTypography`, `hookPacing`.
   - In lines 161–165, approving the QC gate executes:
     ```typescript
     await apiClient.updateVideoStatus(
       videoId,
       nextStatus, // VideoProductionStatus.READY_TO_UPLOAD
       remarks || `Transitioned to ${nextStatus} via Final Review Workspace`
     );
     ```
   - It does **not** call any QC review API and does **not** persist which of the 6 checks passed or failed.
3. **Backend Routes Absence**:
   - An inspection of [backend/server/routers/routes.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/routers/routes.ts) confirms zero references to `/qc-reviews` or `video_qc_reviews`.

### 4.4 Resolution & Classification Verdict:
**QC exhibits BOTH conditions (Distinct Gate + Overlapping Page):**
- **Contractually / Functionally**: QC is an immutable, distinct **Quality Gate (Step 07)** requiring independent actor sign-off, GAR-02 verification (`editorId !== reviewerId`), and strict defect logging.
- **Physically / Structurally**: In the current runtime, QC **overlaps** the video workbench (`VideoDetailPage.tsx` tab `final-review`), relying on a generic video status mutation without dedicated persistence.
- **De-duplication Recommendation for S8-T04**:
  - Delete or archive the unmounted `VideoFinalPage.tsx`.
  - Retain `FinalReviewWorkspace.tsx` as the authoritative UI.
  - Implement the missing `video_qc_reviews` Firestore persistence and backend endpoint `POST /api/v1/videos/:id/qc-reviews` as contracted in `FC-012`, enforcing persistent checklist results and GAR-02 anti-self-approval.

---

## 5. Confirmed Mismatches with Evidence and Severity

| ID | Finding / Mismatch | Severity | Evidence / Source Paths | Current Behavior vs. Intended Architecture |
| :--- | :--- | :---: | :--- | :--- |
| **MIS-01** | **8 Orphaned Brownfield Page Files (297 KB dead code)** | **HIGH** | `frontend/pages/`:<br>- `VideoFinalPage.tsx`<br>- `VideoEditPage.tsx`<br>- `VideoRecordPage.tsx`<br>- `VideoThumbnailPage.tsx`<br>- `VideoReviewScriptPage.tsx`<br>- `VideoPinnedCommentPage.tsx`<br>- `ProductionBoardPage.tsx`<br>- `PublishingPackagePage.tsx` | These 8 files are neither imported nor routed in [frontend/app/App.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/app/App.tsx). They duplicate logic from workbench components, diverge in schemas, and increase maintenance overhead. |
| **MIS-02** | **Ephemeral QC Checklist (0 Datastore Persistence)** | **HIGH** | [FinalReviewWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/FinalReviewWorkspace.tsx#L92-L100),<br>[FC-012](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/features/FC-012-FINAL-QC-REVIEW-GATE.md#L63-L90) | The 6-point QC audit in `FinalReviewWorkspace` is held only in React component state. When QC is certified, only `videos.status` changes to `READY_TO_UPLOAD`; checklist results, audio LUFS verification, and safe-zone compliance are never saved to Firestore. |
| **MIS-03** | **Missing FC-012 Backend Endpoint & Datastore Schema** | **HIGH** | [backend/server/routers/routes.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/routers/routes.ts),<br>`database/firestore/repositories/` | Contract `FC-012` specifies `POST /api/v1/videos/:id/qc-reviews` and collection `video_qc_reviews`. Neither the route nor the repository exists in backend code. |
| **MIS-04** | **Step 05 (Raw Video) Lacks Dedicated First-Class UI Surface** | **MEDIUM** | [07-CANONICAL-15-STEP-WORKFLOW.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md#L53),<br>[RecordingWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/RecordingWorkspace.tsx) | Step 05 is a canonical macro stage with its own transition actions (`VIDEO_INGEST`), but has no dedicated page or workbench tab. It is crammed into the bottom of the filming teleprompter tab in `RecordingWorkspace.tsx`. |
| **MIS-05** | **Steps 14 & 15 Collapsed into Monolithic Analytics Page** | **MEDIUM** | [AnalyticsExperiencePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/AnalyticsExperiencePage.tsx),<br>[11-PAGE-ROUTE-CONTRACT.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/11-PAGE-ROUTE-CONTRACT.md#L524-L554) | Contract P-15 specifies `/analytics/intelligence` for Performance Review & Intelligence Loop. Current implementation is a 60 KB monolithic page switching 10 URL sub-routes via client state. |
| **MIS-06** | **Production Pipeline Board Page Title Mismatch** | **LOW** | [ProductionTrackerPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/ProductionTrackerPage.tsx),<br>[11-PAGE-ROUTE-CONTRACT.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/11-PAGE-ROUTE-CONTRACT.md#L298-L325) | Contract P-08 specifies "Production Pipeline Board" at `/production`. The active page displays "Production Tracker" and defaults to a tabular list rather than a Kanban pipeline. |
| **MIS-07** | **Legacy QuestionImprovePage Unverified Role** | **LOW** | [QuestionImprovePage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/QuestionImprovePage.tsx),<br>[App.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/app/App.tsx#L37-L47) | `/questions/:id/improve` redirects to `/questions/:id?mode=edit`. Standalone `/questions/improve` remains mounted without an ID or verified upstream workflow caller. |

---

## 6. Missing Pages and Unverified Mappings

### 6.1 Missing Dedicated First-Class Routes
1. **`/qc/:videoId` (Step 07 Dedicated QC Gate)**:
   - Contracted in `FC-012`, but currently unmounted. Accessible only via tab `/videos/:videoId?tab=final-review`.
2. **`/videos/:videoId?tab=raw-video` (Step 05 Raw Video Ingestion)**:
   - Contracted in `07-CANONICAL-15-STEP-WORKFLOW.md`, but currently merged with Step 04 inside `?tab=recording`.
3. **`/publishing/live` (Step 11 Published Dispatch Confirmation)**:
   - Embedded as a secondary tab inside `PublishingPage.tsx` rather than an explicit stage destination.
4. **`/analytics/intelligence` (Step 14 & 15 Workbenches)**:
   - Contracted in P-15; currently handled as one of 10 sub-route aliases in `AnalyticsExperiencePage.tsx`.

### 6.2 Unverified Backend & Datastore Mappings
1. **`video_qc_reviews` Firestore Collection**:
   - Specified in `FC-012`; zero document schemas, repository classes, or Firestore rules currently exist.
2. **`POST /api/v1/videos/:id/qc-reviews` API Endpoint**:
   - Specified in `FC-012`; completely absent from `backend/server/routers/routes.ts`.
3. **Dedicated QC GAR-02 Backend Check for `FinalReviewWorkspace`**:
   - Because `FinalReviewWorkspace` directly calls `POST /api/videos/:id/status` rather than the workflow engine transition route (`POST /api/v1/workflow/:id/transition`), the backend GAR-02 check in `transition-matrix.ts` is bypassed during runtime QC status updates.

---

## 7. Acceptance Checklist: Canonical 15 Steps Accounted For

- [x] **Step 01 (Question Generation)**: Accounted for (`QuestionStudioPage`, `/studio`, `QuestionDraft` / `Question`).
- [x] **Step 02 (Question Verification)**: Accounted for (`QuestionVerifyApprovePage`, `/questions/:id/verify`, GAR-02 enforced).
- [x] **Step 03 (Audience Script)**: Accounted for (`VideoDetailPage?tab=script`, `ScriptWorkspace`, `Script` entity).
- [x] **Step 04 (Teleprompter & Filming)**: Accounted for (`VideoDetailPage?tab=recording`, `RecordingWorkspace`, `QueuePage`).
- [x] **Step 05 (Raw Video)**: Accounted for (`VideoDetailPage?tab=recording` sub-section, media link ingestion).
- [x] **Step 06 (Editing Bay)**: Accounted for (`VideoDetailPage?tab=editing`, `EditingWorkspace`, master cut render link).
- [x] **Step 07 (Final QC)**: Accounted for (`VideoDetailPage?tab=final-review`, `FinalReviewWorkspace`, QC duality diagnosed).
- [x] **Step 08 (Thumbnail)**: Accounted for (`VideoDetailPage?tab=thumbnail`, `ThumbnailWorkspace`, `Thumbnail` entity).
- [x] **Step 09 (Social Review)**: Accounted for (`SocialReviewPage`, `/social-review/:reviewId`, 9:16 smartphone simulator).
- [x] **Step 10 (Publishing Setup)**: Accounted for (`PublishingPage`, `/publishing`, multi-platform scheduling).
- [x] **Step 11 (Published)**: Accounted for (`PublishingPage` Live tab, URL regex verification).
- [x] **Step 12 (Platform Sync)**: Accounted for (`PlatformPackagesPage`, `/platform-packages`, sync reconciliation).
- [x] **Step 13 (Analytics)**: Accounted for (`SocialAnalyticsPage`, `/social-analytics/:contentId`, 24h/7d retention curves).
- [x] **Step 14 (Performance Review)**: Accounted for (`AnalyticsExperiencePage` engagement/retention tabs, confusion tags).
- [x] **Step 15 (Intelligence Loop)**: Accounted for (`AnalyticsExperiencePage` intelligence tab, strategy directive loopback).

---

## 8. Prioritized Strategic Roadmap (S8-T03 & S8-T04)

1. **Sprint 8 Task S8-T03 (Route & Workbench Consolidation)**:
   - Formulate architectural retirement plan for the 8 orphaned page files in `frontend/pages/` (297 KB dead code).
   - Clean up redirect aliases in `frontend/app/App.tsx`.
   - Align P-08 Production Pipeline Board title and default view in `ProductionTrackerPage.tsx`.
2. **Sprint 8 Task S8-T04 (QC Gate Decoupling & Datastore Implementation)**:
   - Implement `video_qc_reviews` Firestore repository and document schema.
   - Implement `POST /api/v1/videos/:id/qc-reviews` endpoint with strict GAR-02 anti-self-approval enforcement (`editorId !== reviewerId`).
   - Update `FinalReviewWorkspace.tsx` to persist 6-point checklist results, LUFS verification, and defect markers to `video_qc_reviews`.
   - Remove or archive contradictory unmounted `VideoFinalPage.tsx`.
