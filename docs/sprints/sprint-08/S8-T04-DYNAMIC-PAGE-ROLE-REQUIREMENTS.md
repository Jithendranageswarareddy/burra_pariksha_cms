# S8-T04 — Dynamic-Page and Role Requirements Specification
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 08 — Dynamic Production Foundation / Gate A Requirements

```text
================================================================================
Document ID:       BP-S8-T04-DYNAMIC-PAGE-ROLE-REQUIREMENTS
Version:           1.7.0-RECONCILED-BASELINE
Date:              2026-10-15
Status:            RECONCILED REQUIREMENTS SPECIFICATION (Submitted for Gate A Sign-Off)
Gate A Status:     OPEN (Pending Stakeholder Sign-Off on S8-T04 Dynamic-Page Requirements)
Inspected Commit:  216d746 (main)
Scope:             Shared Production Context, Direct-Link & Draft Resumption,
                   15-Stage Page-State Matrix, Role-to-Action Matrix,
                   GAR-02 Anti-Self-Approval, and Gate A Prerequisites & Sign-Off Criteria
Upstream Inputs:   docs/sprints/sprint-08/S8-T01-QUESTION-GENERATION-AUDIT.md
                   docs/sprints/sprint-08/S8-T02-PRODUCTION-PAGE-WORKFLOW-INVENTORY.md
                   docs/sprints/sprint-08/S8-T03-CONTENT-MODE-REQUIREMENTS.md
                   docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
                   docs/architecture/09-RBAC-CAPABILITY-MODEL.md
                   docs/architecture/11-PAGE-ROUTE-CONTRACT.md
                   docs/architecture/12-DATABASE-ARCHITECTURE.md
                   docs/architecture/15-API-CONTRACT.md
                   docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md
                   docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md
                   docs/architecture/DECISION-LOG.md (ADR-008, ADR-009, ADR-010, ADR-011)
                   shared/lib/id.service.ts
                   shared/constants/roles.ts
                   src/types/rbac-models.ts
Downstream Impact: S8-T05 (Shared Production Context Contract), Gate A Formal Closure
================================================================================
```

---

## 1. Executive Summary & Architectural Governance

### 1.1 Purpose
This specification formalizes the **Dynamic-Page, Production-Context, and Role Authorization Requirements** for the Burra Pariksha Content Management System (BP-CMS). Building directly on the forensic baselines established in S8-T01 (Question Generation Audit), S8-T02 (Production Page & Workflow Inventory), and S8-T03 (Content Mode Requirements), and reconciled against the authoritative ID contract ([id.service.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/lib/id.service.ts)) and canonical role enum ([roles.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/roles.ts)), this document defines:
1. The **Shared Production Context** propagated across all production workbenches, including field sources, ownership, lifecycles, and validity rules.
2. The **Page-State Matrix** specifying the behavior of every in-scope canonical page and mounted workspace across all 15 workflow stages in all six fundamental UI states (`loading`, `empty`, `error`, `read-only`, `incomplete`, and `completed`), including explicit draft resumption, invalid-context handling, and recovery rules.
3. The **Role-to-Action Matrix** mapping the 11 canonical roles and atomic capabilities to page visibility, resource-scoped access, business preconditions, and **GAR-02 Anti-Self-Approval**.
4. The exact rules governing **direct-link hydration**, **draft resumption**, and the architectural invariant separating **Save Draft vs. Submit for Verification**.
5. The formal criteria for **Gate A**, which remains **OPEN** pending verified stakeholder sign-off on S8-T04.

### 1.2 Boundary with S8-T05 Production-Context Contract
This document (S8-T04) defines the **business and operational requirements**, user-facing page states, authorization rules, and acceptance criteria for dynamic pages. The companion specification [S8-T05-PRODUCTION-CONTEXT-CONTRACT.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/sprints/sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md) defines the **implementation-level TypeScript contract**, provider architecture, hook signatures, and parameter parsers. S8-T04 serves as the authoritative requirements baseline; S8-T05 serves as the technical implementation design.

### 1.3 Core Architectural Invariants (Non-Negotiable)
Every requirement defined herein adheres strictly to the authoritative BP-CMS architectural principles in [AGENTS.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/AGENTS.md):
- **Zero-Trust Server Authority**: Client-side UI controls, visibility rules, and disabled buttons are strictly advisory presentation layers. Every HTTP read and mutation must be independently authenticated and authorized by Express server middleware (`requireCapability`) evaluating the 12-step RBAC pipeline.
- **15 Canonical Sequential Stages**: The end-to-end educational production pipeline preserves all 15 canonical steps in strict sequence (Stage 01 Question Generation through Stage 15 Social Performance Analytics). No stage may be bypassed, skipped, or merged out of existence ([07-CANONICAL-15-STEP-WORKFLOW.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md)).
- **Cloud Firestore Sole Transactional Datastore**: All runtime entities (`questions`, `question_drafts`, `scripts`, `videos`, `thumbnails`, `social_reviews`, `publishing`, `analytics_snapshots`, `users`, `audit_logs`) persist exclusively to Cloud Firestore ([12-DATABASE-ARCHITECTURE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/12-DATABASE-ARCHITECTURE.md)). Zero runtime persistence to Google Sheets.
- **Canonical Two-Tier Taxonomy**: Educational classification is strictly two-tier: **Topic** (`top_<uuid>` or legacy `TOP-*`) $\longrightarrow$ **Subtopic** (`sub_<uuid>` or legacy `SUB-*`) ([25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)). The legacy `Category` concept is permanently obsolete.
- **Collision-Resistant UUID Canonical IDs**: Entity IDs are distributed, stateless UUID v4 identifiers formatted as `<prefix>_<uuid>` generated by `shared/lib/id.service.ts`:
  - Question Draft: `dft_<uuid>` (via `generateDraftId()`, reconciled with S8-T01)
  - Content Master: `cnt_<uuid>` (via `generateContentMasterId()`)
  - Question: `qst_<uuid>`
  - Concept Brief: `cbr_<uuid>`
  - Video: `vid_<uuid>`
  - Script: `scr_<uuid>`
  - Thumbnail: `thm_<uuid>`
  - Social Review: `rev_<uuid>`
  - Publishing: `pub_<uuid>`
  - Analytics Snapshot: `anl_<uuid>`
  - Performance Intelligence / Insight: `spi_<uuid>`
  - User: `usr_<uuid>`
  - Topic: `top_<uuid>`
  - Subtopic: `sub_<uuid>`
  - Workflow Instance: `wfl_<uuid>`
- **Save Draft $\neq$ Submit for Verification**: Saving a draft persists minimal valid fields to `question_drafts` without leaving the page or triggering verification. Submitting for verification is an explicit, deliberate user action that executes authoritative validation gates and advances the workflow from Stage 01 to Stage 02.
- **Anti-Self-Approval (`GAR-02`)**: No author may approve their own submission across review gates (Stage 02 Question Verification, Stage 07 Final QC, Stage 09 Social Review). This rule is an absolute mathematical and architectural invariant enforced server-side with zero role-based bypass, zero administrative exceptions, and zero emergency overrides across all roles, including `ADMIN`.
- **Documentation & Specification Only**: In strict compliance with Sprint 8 rules, this document provides architecture contracts and specifications. Zero application code, routes, or schema migrations may be executed prior to formal Gate A approval.

---

## 2. Shared Production Context Specification

### 2.1 Context Definition & Required Facets
The **Shared Production Context** (`ProductionContext`) represents the unified operational envelope passed across all production workbenches. It binds the active curriculum domain, content format, persistence entities, workflow lifecycle, task assignment, and current actor authorization into a cohesive state.

```typescript
export interface ProductionContext {
  // 1. Curriculum Taxonomy (Authoritative Two-Tier)
  taxonomy: {
    topicId: string;                     // Canonical: top_<uuid> (legacy: TOP-###)
    topicName: string;                   // Human-readable topic title
    topicSlug: string;                   // URL-safe slug
    subtopicId: string;                  // Canonical: sub_<uuid> (legacy: SUB-###)
    subtopicName: string;                // Human-readable subtopic title
    subtopicSlug: string;                // URL-safe slug
  };

  // 2. Production Mode & Configuration (Traced to S8-T03)
  modeConfig: {
    productionMode: ContentProductionMode; // QUESTION_CHALLENGE_SHORT | TOPIC_INTRODUCTION | EXPLAINED_QUESTIONS_VIDEO
    questionCount: number;               // Mode 1: 1 (or batch series {5,10,15,20}); Mode 2: 0; Mode 3: 5, 10, 15, 20
    aspectRatio: '9:16' | '16:9';        // Mode 1: '9:16'; Mode 2: '9:16' | '16:9'; Mode 3: '16:9'
    language: QuestionLanguage;          // TELUGU | ENGLISH | TELUGU_ENGLISH
    difficulty?: DifficultyLevel;        // EASY | MEDIUM | HARD | PROGRESSIVE (Mode 3)
    targetDurationSeconds?: number;      // Mode 1: <= 58s; Mode 2: 60-180s; Mode 3: 720-3120s
  };

  // 3. Entity Identifiers & Aggregation (Reconciled with id.service.ts)
  entityIds: {
    contentMasterId?: string;            // Root aggregate: cnt_<uuid>
    draftId?: string;                    // Active Question Draft: dft_<uuid> (Stage 01)
    questionId?: string;                 // Approved Question: qst_<uuid> (Stage 02+)
    questionIds?: string[];              // Mode 3 practice questions array: qst_<uuid>[]
    conceptBriefId?: string;             // Mode 2 conceptual overview ID: cbr_<uuid>
    scriptId?: string;                   // Teleprompter Script: scr_<uuid> (Stage 03)
    videoId?: string;                    // Video production entity: vid_<uuid> (Stage 04-12)
    thumbnailId?: string;                // Master thumbnail: thm_<uuid> (Stage 08)
    reviewId?: string;                   // QC/Social review: rev_<uuid> (Stage 07 & 09)
    publishingId?: string;               // Publishing record: pub_<uuid> (Stage 10-12)
    analyticsId?: string;                // Performance snapshot: anl_<uuid> (Stage 13-14)
    workflowInstanceId?: string;         // State machine tracking: wfl_<uuid>
  };

  // 4. Workflow Lifecycle & State
  workflow: {
    currentStage: number;                // Canonical integer: 1 to 15
    stageStatus: WorkflowStageStatus;    // DRAFT | IN_PROGRESS | PENDING_REVIEW | CHANGES_REQUESTED | APPROVED | SCHEDULED | PUBLISHED | SYNCED | COMPLETED | TERMINATED
    isTerminal: boolean;                 // True if PUBLISHED or ARCHIVED
    lastTransitionAt: string;            // ISO 8601 UTC timestamp
    lastTransitionBy: string;            // usr_<uuid>
    rejectionNotes?: string;             // Feedback from Stage 02, 07, or 09 rejection
    allowedActions: string[];            // Permitted transitions for active actor
  };

  // 5. Assignment & Ownership Context
  assignment: {
    ownerId: string;                     // Creator / initiator of content record (usr_<uuid>)
    assignedAuthorId?: string;           // Author assigned to draft (Stage 01)
    assignedReviewerId?: string;         // Reviewer assigned to verification (Stage 02)
    assignedScriptwriterId?: string;     // Scriptwriter assigned to script (Stage 03)
    assignedPresenterId?: string;        // Studio talent assigned to filming (Stage 04)
    assignedEditorId?: string;           // Editor assigned to render cut (Stage 06)
    assignedQcLeadId?: string;           // QC reviewer assigned to Final QC (Stage 07)
    assignedDesignerId?: string;         // Graphic artist assigned to thumbnail (Stage 08)
    assignedPublisherId?: string;        // Publishing lead assigned to publishing/sync (Stages 09–12)
  };

  // 6. Authenticated Actor & Effective Capabilities
  actor: {
    userId: string;                      // Authenticated User ID: usr_<uuid>
    name: string;                        // Full name
    roles: CanonicalRbacRole[];          // Assigned canonical roles (from CanonicalRbacRole enum)
    capabilities: string[];              // Expanded atomic tokens ('QUESTION:CREATE', etc.)
    isAiAgent: boolean;                  // Flag distinguishing automated bots from humans
  };

  // 7. Workbench Session State
  isDirty: boolean;                      // Unsaved changes in active workbench
  isLoading: boolean;                    // Context hydration in progress
  error?: string | null;                 // Hydration or validation failure
}
```

### 2.2 Field Ownership, Lifecycle, and Validity Rules

| Context Facet | Authoritative Source | Ownership & Mutability | Validity Rules |
| :--- | :--- | :--- | :--- |
| **Taxonomy** (`topicId`, `subtopicId`) | Firestore `topics`, `subtopics` collections | Owned by Stage 01 author; becomes immutable upon submission to Stage 02. | Must reference valid Firestore docs. Subtopic must satisfy: `subtopic.topicId === topic.id`. Zero legacy Category. |
| **Mode Configuration** (`productionMode`, `questionCount`, `aspectRatio`) | Selected via `ProductionModeModal` on `/studio` entry; stored in `question_drafts` | Owned by Stage 01 author; immutable from Stage 02 onward. | Mode 1: count=1 (or batch series), aspect=9:16.<br>Mode 2: count=0, aspect=9:16 or 16:9.<br>Mode 3: count $\in \{5, 10, 15, 20\}$, aspect=16:9. |
| **Entity Identifiers** (`draftId`, `questionId`, `videoId`, etc.) | Stateless generator in `shared/lib/id.service.ts` | Server-assigned upon document creation; strictly immutable once generated. | Must match canonical UUID format `<prefix>_<uuid_v4>`. No database sequence counters. |
| **Workflow State** (`currentStage`, `stageStatus`) | Firestore `workflow_instances` collection; transitions via `workflow-engine.service.ts` | Server-authoritative state engine; client cannot directly mutate. | Integer $1 \le \text{stage} \le 15$. State transitions must follow valid transition matrix. |
| **Assignment** (`ownerId`, `assignedAuthorId`, etc.) | Firestore `assignments` / entity doc fields | Managed by `CONTENT_LEAD` or `ADMIN`; immutable during active review. | Must reference valid active `usr_<uuid>` user records. |
| **Actor Context** (`userId`, `roles`, `capabilities`) | Authenticated session token verified by server auth middleware | Read-only client projection of server session; immutable per session. | Must hold at least 1 canonical role. Capabilities derived strictly from role union. |
| **Draft Identity & Dirty State** | Local component state + Firestore `question_drafts` | Owned by active workbench session. | `isDirty` set to true on any field modification; cleared upon successful draft persistence. |

### 2.3 Context Creation, Mutation, and Cross-Navigation Consistency
1. **Initial Creation**: When a user enters `/studio` without query parameters, context initializes with empty taxonomy, default mode `QUESTION_CHALLENGE_SHORT`, `currentStage = 1`, and `stageStatus = 'DRAFT'`.
2. **Context Mutation**: All updates occur through typed action dispatchers (`setTaxonomy`, `setModeConfig`, `setEntityIds`, `setIsDirty`).
3. **Consistency Across Navigation**: The application uses URL query parameters (`?draftId=...`, `?videoId=...`, `?contentId=...`) as the source of truth for deep links, browser refreshes, and back/forward navigation. Context providers hydrate directly from these parameters rather than relying on ephemeral React state.
4. **Missing or Invalid References**:
   - Malformed ID: Displays in-place validation error and redirects to `/studio`.
   - Entity Not Found in Firestore: Displays HTTP 404 / `NotFoundPage` with breadcrumb to dashboard.
   - Unauthorized Access: Displays HTTP 403 Forbidden with explanation of missing capabilities.
5. **Persistence Boundary**: Client context modifications exist in browser memory until explicitly persisted via "Save Draft" or stage submission endpoints. Unsaved changes trigger standard `beforeunload` warnings.

---

## 3. Comprehensive Page-State Matrix

The following matrix defines the operational behavior across all 15 canonical workflow stages and their canonical workbenches across all six fundamental states: `Loading`, `Empty`, `Error`, `Read-Only`, `Incomplete`, and `Completed`.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                           CANONICAL PAGE-STATE MATRIX (STAGES 01–15)                   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Stage 01: Question Generation
- **Canonical Route:** `/studio` (`P-04 Question Studio` / `QuestionStudioPage.tsx`)
- **Required Context & Data:** Topic taxonomy tree (`topics`, `subtopics`), active draft container (`draftId: dft_<uuid>`), AI prompt configurations.
- **Data Displayed & Editable Fields:** Topic/Subtopic dropdowns, Production Mode modal selector, Question Stem textarea, 4 Option inputs (`a`, `b`, `c`, `d`), Correct Answer selector (`A`, `B`, `C`, `D`), Explanation textarea, Mathematical Proof editor. (For Mode 2: Concept Title, Introductory Concept statement, Syllabus Scope notes. For Mode 3: Concept Roadmap, $N$ Explained Question blocks).
- **Available Actions & Preconditions:**
  - `GENERATE`: Topic and Subtopic selected.
  - `SAVE_DRAFT`: Topic and Subtopic selected; minimal content present ($\ge 5\text{ chars}$).
  - `SUBMIT`: All required fields valid (for Mode 1 & 3: 4 options, valid proof, correct answer; for Mode 2: concept statement $\ge 15\text{ chars}$).
- **State Specifications:**
  - **Loading:** Split-screen skeleton loader (taxonomy left, form fields right). Buttons disabled.
  - **Empty:** Blank authoring workspace; Topic selector pulsing. Inputs disabled until valid Topic/Subtopic selected.
  - **Error:** AI generation timeout displays alert banner with `[Retry Generation]` and `[Manual Entry]`. Save draft network failure displays toast; form remains dirty.
  - **Read-Only:** Active when viewing archived draft or when user lacks `QUESTION:EDIT`. Controls rendered disabled.
  - **Incomplete:** Missing fields show red validation borders. Submit button disabled; Save Draft remains enabled.
  - **Completed:** Form locked; green badge *"Submitted for Verification — Stage 02"*. Link: *"View in Verification Queue $\to$"*.
- **Invalid-Context / Unauthorized Behavior:** Missing draft ID creates a new blank draft. Non-existent draft ID shows 404 alert with "Create New Draft" button. Actor lacking `QUESTION:CREATE` redirected to dashboard.
- **Draft Resumption & Recovery:** Navigating to `/studio?draftId=dft_<uuid>` restores all saved fields from Firestore `question_drafts`, sets `isDirty = false`. Resumption NEVER triggers verification or Stage 02 transition. Rejection from Stage 02 displays non-dismissible banner with reviewer feedback.

---

### 3.2 Stage 02: Question Verification
- **Canonical Route:** `/questions/:id/verify` (`P-05 Question Verification` / `QuestionVerifyApprovePage.tsx`)
- **Required Context & Data:** Submitted `Question` record (`qst_<uuid>`), version history, proof payload, author ID (`usr_<uuid>`), audit checklist.
- **Data Displayed & Editable Fields:** Dual-pane layout: Question Preview with LaTeX math (left); Verification checklist toggles (right); Reviewer Remarks textarea. (For Mode 1: 10-point pedagogical checklist; for Mode 2: 5-point Concept Accuracy checklist per ADR-009; for Mode 3: multi-question batch review).
- **Available Actions & Preconditions:**
  - `INSPECT`: Always available to actors with `QUESTION_REVIEW:VIEW`.
  - `REQUEST_CHANGES`: Requires $\ge 10\text{ characters}$ in remarks.
  - `APPROVE_QUESTION`: All checklist items evaluated; **GAR-02 strictly satisfied (`actor.userId !== question.authorUserId`)**.
- **State Specifications:**
  - **Loading:** Shimmering question preview card and checklist skeleton.
  - **Empty:** Parameter route. If question has no pending submission: *"No submission found for verification."*
  - **Error:** Red alert banner: *"Unable to load question verification record"* with retry handler.
  - **Read-Only (Self-Approval Restriction / GAR-02):**
    - Active when authenticated actor is the author (`actor.userId === question.authorUserId`).
    - Checklist toggles disabled. "Approve Question" button replaced with amber badge:
      $$\text{"Anti-Self-Approval Active: As author, you cannot verify this question (GAR-02)."}$$
  - **Incomplete:** Unchecked items disable approval.
  - **Completed:** Banner: *"Question Verified & Approved by [reviewer] on [timestamp]"*. Checklist locked. Button: *"Advance to Scripting Bay (Stage 03) $\to$"*.
- **Recovery Behavior:** `REQUEST_CHANGES` sets status to `CHANGES_REQUESTED`, rolls workflow back to Stage 01, routes author back to `/studio?draftId=dft_<uuid>`.

---

### 3.3 Stage 03: Audience Script
- **Canonical Route:** `/videos/:videoId?tab=script` (`P-09 Video Production Workbench — Tab 1` / `ScriptWorkspace.tsx`)
- **Required Context & Data:** Approved Question text (`qst_<uuid>`), distractors, proof, current `Script` draft (`scr_<uuid>`), teleprompter word counter.
- **Data Displayed & Editable Fields:** 3-Second Hook editor, Spoken Dialogue editor, Telugu transliteration, Pacing meter (Target: 40–58s; Max: 60s). (For Mode 2: 5-part concept narration; for Mode 3: segmented question takes per ADR-011).
- **Available Actions & Preconditions:** `SCRIPT:CREATE`, `SCRIPT:EDIT`, `SCRIPT:SUBMIT` (`LOCK_SCRIPT`), `ESCALATE_QUESTION_DEFECT`. Lock requires pacing $\le 58\text{ seconds}$ ($\le 135\text{ words}$).
- **State Specifications:**
  - **Loading:** Script editor skeleton and teleprompter preview card shimmer.
  - **Empty:** Blank workspace with button *"Generate Initial Script from Question (AI Advisory)"*.
  - **Error:** Script save failure toast; lock constraint violation message.
  - **Read-Only:** Script locked for filming. Padlock displayed: *"Script locked for filming by [author]. Edits disabled."*
  - **Incomplete:** Word count exceeds duration budget (> 135 words). Lock button disabled.
  - **Completed:** Green badge *"Script Locked & Approved for Teleprompter"*. Button: *"Proceed to Recording Queue (Stage 04) $\to$"*.
- **Draft Resumption & Recovery:** "Save Script Draft" persists to `scripts` collection without advancing workflow. "Report Question Defect" routes defect back to Stage 02.

---

### 3.4 Stage 04: Teleprompter & Filming
- **Canonical Route:** `/videos/:videoId?tab=recording` (`P-09 Video Production Workbench — Tab 2` / `RecordingWorkspace.tsx`) & `/queue` (`QueuePage.tsx`)
- **Required Context & Data:** Locked `Script` text (`scr_<uuid>`), presenter profile (`usr_<uuid>`), video project metadata (`vid_<uuid>`), take log (`video_takes`).
- **Data Displayed & Editable Fields:** High-contrast Teleprompter scroll canvas, Scroll speed slider, Font size slider, Mirrored mode toggle, Take Logging panel (Take #, Duration, Rating 1–5 stars, Notes), "Mark Golden Take" selector.
- **Available Actions & Preconditions:** `VIDEO:RECORD`, `VIDEO_TAKE:CREATE`, `FILMING_COMPLETE` (requires at least one Golden Take marked).
- **State Specifications:**
  - **Loading:** Teleprompter canvas skeleton and take history table shimmer.
  - **Empty:** *"Awaiting locked script from Stage 03. Teleprompter cannot launch."*
  - **Error:** Take logging API error toast. Audio/visual sync device warning.
  - **Read-Only:** Takes logged and finalized. Teleprompter operable in rehearsal mode only.
  - **Incomplete:** Zero takes logged, or no Golden Take designated. "Filming Complete" disabled.
  - **Completed:** Card: *"Filming Concluded. Golden Take: Take #3 (Duration: 52s). Dispatched to Raw Footage Ingest."*
- **Draft Resumption & Recovery:** Each logged take is immediately written to Firestore `video_takes`. Presenter can trigger "Request Script Revision", routing back to Stage 03.

---

### 3.5 Stage 05: Raw Video Handoff
- **Canonical Route:** `/videos/:videoId?tab=recording` (`P-09 Video Production Workbench — Raw Handoff Section`)
- **Required Context & Data:** Video project container (`vid_<uuid>`), camera operator ID, Google Drive raw folder link.
- **Data Displayed & Editable Fields:** Google Drive Raw Folder URL input, File Name / Take Reference input, Camera Format selector (1080p, 4K, ProRes).
- **Available Actions & Preconditions:** `MEDIA_ASSET:UPLOAD`, `LINK_DRIVE_FOLDER`, `DISPATCH_EDITING` (requires validated Google Drive URL), `REQUEST_RE_SHOOT`.
- **State Specifications:**
  - **Loading:** Upload metadata form skeleton.
  - **Empty:** URL input with placeholder `https://drive.google.com/drive/folders/...`.
  - **Error:** Regex failure: *"Invalid Google Drive folder link. Must be a valid shared Drive URL."*
  - **Read-Only:** Verified Drive folder URL rendered with external link and green checkmark.
  - **Incomplete:** URL field empty or unverified. Dispatch button disabled.
  - **Completed:** Banner: *"Raw footage registered in Drive. Dispatched to Editing Bay (Stage 06)."*
- **Draft Resumption & Recovery:** Partial Drive URLs saved in draft metadata. "Request Re-Shoot" reverts workflow stage 05 $\to$ 04 with operator remarks.

---

### 3.6 Stage 06: Editing Bay
- **Canonical Route:** `/videos/:videoId?tab=editing` (`P-09 Video Production Workbench — Tab 3` / `EditingWorkspace.tsx`)
- **Required Context & Data:** Raw footage Drive link, locked Script dialogue, master render cut metadata, Telugu subtitle configuration.
- **Data Displayed & Editable Fields:** Master Render Cut Drive URL input, Video Specs checklist (9:16 vertical 1080x1920 for Mode 1/2; 16:9 1920x1080 for Mode 3; LUFS audio normalization), Telugu Subtitle toggle.
- **Available Actions & Preconditions:** `VIDEO_EDIT:EDIT`, `SAVE_EDIT_CUT`, `SUBMIT_QC` (requires validated cut URL and specs checklist confirmed), `REQUEST_RE_SHOOT`.
- **State Specifications:**
  - **Loading:** Editing specifications checklist and video asset loader skeleton.
  - **Empty:** Blank render cut form with link to Raw Footage Drive folder.
  - **Error:** URL validation failure or status mutation toast.
  - **Read-Only:** Master cut submitted and awaiting QC review. Edits frozen.
  - **Incomplete:** Master render URL missing, or technical check unverified. Submit disabled.
  - **Completed:** Green badge: *"Master Cut Approved by QC Lead"*. Button: *"Proceed to Thumbnail Studio (Stage 08) $\to$"*.
- **Draft Resumption & Recovery:** "Save Cut Draft" persists render URL and notes without advancing workflow. Rejection from Stage 07 displays red defect callout with timecoded issues.

---

### 3.7 Stage 07: Final QC Gate
- **Canonical Route:** `/videos/:videoId?tab=final-review` (`P-09 Video Production Workbench — Tab 4` / `FinalReviewWorkspace.tsx`)
- **Required Context & Data:** Master render cut URL, locked script, original question, 6-point Master QC checklist (Audio LUFS -14, Safe-Zones, Subtitle Sync, Hook Energy, Answer Accuracy, Resolution).
- **Data Displayed & Editable Fields:** Video Player embed, 6-Point QC checklist toggles, Timecoded Defect Logger, Decision radios (Approve / Reject), Mandatory Remarks textarea.
- **Available Actions & Preconditions:**
  - `VIDEO_EDIT:APPROVE`: All 6 checklist items verified; **GAR-02 strictly satisfied (`actor.userId !== video.editorUserId`)**.
  - `VIDEO_EDIT:REJECT`: Requires $\ge 10\text{ characters}$ and at least one timecoded defect marker.
- **State Specifications:**
  - **Loading:** Video player skeleton and 6-point checklist shimmer loader.
  - **Empty:** *"No master render cut available for QC audit."*
  - **Error:** Player streaming error banner or approval API failure toast.
  - **Read-Only (Self-Approval Restriction / GAR-02):**
    - Active when authenticated actor is the editor (`actor.userId === video.editorUserId`).
    - Checklist toggles disabled. "Certify QC & Approve" replaced with amber banner:
      $$\text{"Anti-Self-Approval Active: As video editor, you cannot certify your own render cut (GAR-02)."}$$
  - **Incomplete:** Fewer than 6 checklist items verified. Approve button disabled.
  - **Completed:** Banner: *"Final QC Certified by [qc_lead] on [timestamp]. Video locked for publication."*
- **Recovery Behavior:** Action `REJECT_QC` sets `video.status = EDITING`, requires defect notes, reverts workflow stage 07 $\to$ 06, alerts video editor.

---

### 3.8 Stage 08: Thumbnail Studio
- **Canonical Route:** `/videos/:videoId?tab=thumbnail` (`P-09 Video Production Workbench — Tab 5` / `ThumbnailWorkspace.tsx`)
- **Required Context & Data:** Approved Question headline, curiosity framing concept, candidate thumbnail asset links.
- **Data Displayed & Editable Fields:** Candidate Thumbnail Gallery grid, Drive Asset URL input, CTR Prediction badge, Safe-Zone Overlay toggle (testing mobile crop).
- **Available Actions & Preconditions:** `THUMBNAIL:CREATE`, `THUMBNAIL:EDIT`, `THUMBNAIL:APPROVE` (requires at least one candidate selected as primary).
- **State Specifications:**
  - **Loading:** Thumbnail card grid skeleton loader.
  - **Empty:** *"No candidate thumbnails uploaded. Upload at least 1 high-resolution graphic."*
  - **Error:** Invalid image format or broken asset link error banner.
  - **Read-Only:** Primary thumbnail approved and locked. Controls disabled.
  - **Incomplete:** Candidate uploaded but no image selected as primary. Approve disabled.
  - **Completed:** Selected thumbnail framed in green with badge *"Primary Thumbnail Approved"*. Button: *"Proceed to Social Review (Stage 09) $\to$"*.
- **Draft Resumption & Recovery:** Uploading candidate artwork creates draft `thm_<uuid>` records in Firestore `thumbnails`. Rejection from Stage 09 unlocks gallery for replacement.

---

### 3.9 Stage 09: Social Review Studio
- **Canonical Route:** `/social-review/:reviewId` (`P-10 Social Review Studio` / `SocialReviewPage.tsx`)
- **Required Context & Data:** QC-approved video stream, approved primary thumbnail, YouTube Shorts / Reels post copy, hashtags, pinned comment.
- **Data Displayed & Editable Fields:** Interactive Smartphone Simulator (YouTube Shorts vs. Instagram Reels chrome), Post Title input (100-char counter), Description/Hashtags input, Pinned Comment editor.
- **Available Actions & Preconditions:**
  - `SOCIAL_REVIEW:APPROVE`: Title $\le 100\text{ chars}$, pinned comment non-empty; **GAR-02 strictly satisfied (`actor.userId !== script.authorUserId`)**.
  - `SOCIAL_REVIEW:REJECT`: Requires feedback notes specifying copy, video, or thumbnail defect.
- **State Specifications:**
  - **Loading:** Smartphone frame skeleton with shimmering copy placeholders.
  - **Empty:** *"Awaiting upstream video QC and thumbnail approvals."*
  - **Error:** Social bundle fetch error banner with retry handler.
  - **Read-Only (Self-Approval Restriction / GAR-02):**
    - Active when authenticated actor is the scriptwriter (`actor.userId === script.authorUserId`).
    - "Approve Social Package" replaced with amber banner:
      $$\text{"Anti-Self-Approval Active: As scriptwriter, you cannot approve the final social copy package (GAR-02)."}$$
  - **Incomplete:** Title $> 100\text{ chars}$ or pinned comment blank. Approve disabled.
  - **Completed:** Green badge: *"Social Review Certified & Signed Off by [reviewer]"*. Button: *"Advance to Publishing Manager (Stage 10) $\to$"*.
- **Recovery Behavior:** Thumbnail defect reverts to Stage 08; video caption defect reverts to Stage 06.

---

### 3.10 Stage 10: Publishing Setup
- **Canonical Route:** `/publishing` (`P-11 Publishing Manager — Tab 1: Scheduled` / `PublishingPage.tsx`)
- **Required Context & Data:** Certified social review bundle, target distribution platforms, publishing calendar slots.
- **Data Displayed & Editable Fields:** Platform checkboxes (YouTube, Instagram, Facebook), Calendar Date & Time Picker, Pre-Publish Readiness Checklist.
- **Available Actions & Preconditions:** `PUBLISHING_PACKAGE:SCHEDULE` (requires valid future timestamp and all checklist items confirmed), `PUBLISH_IMMEDIATELY`.
- **State Specifications:**
  - **Loading:** Release calendar and platform settings skeleton loader.
  - **Empty:** *"No videos scheduled for distribution this week. Select an approved package to schedule."*
  - **Error:** Platform API connection error or expired OAuth credentials toast.
  - **Read-Only:** Publishing package scheduled and locked in calendar. Controls disabled for non-leads.
  - **Incomplete:** Target timestamp in the past, or checklist unconfirmed. Schedule disabled.
  - **Completed:** Status badge: *"Scheduled for Broadcast: [Date & Time] across [Platforms]"*. Button: *"Monitor Live Dispatch (Stage 11) $\to$"*.
- **Recovery Behavior:** Publishing lead can return package to Stage 09 for copy adjustment prior to broadcast.

---

### 3.11 Stage 11: Published
- **Canonical Route:** `/publishing?tab=live` (`P-11 Publishing Manager — Tab 2: Live` / `PublishingPage.tsx`)
- **Required Context & Data:** Scheduled publishing record (`pub_<uuid>`), external video dispatch job state, live post URLs.
- **Data Displayed & Editable Fields:** Live Dispatch Monitor, Live Platform URLs table (YouTube Shorts link, Instagram Reel link), URL verification badges.
- **Available Actions & Preconditions:** `PUBLICATION:PUBLISH`, `CONFIRM_LIVE`, `VERIFY_URL`, `CANCEL_SCHEDULE`.
- **State Specifications:**
  - **Loading:** Dispatch progress bar and live link verification skeleton.
  - **Empty:** *"No live broadcasts dispatched today."*
  - **Error:** Upload dispatch failure banner with error payload from platform API + `[Retry Upload]`.
  - **Read-Only:** Live links confirmed and verified. Cancel button permanently disabled.
  - **Incomplete:** Broadcast triggered but external URLs not yet confirmed. Status spinner displayed.
  - **Completed:** Green badge: *"Broadcast Confirmed Live on All Platforms"*. Clickable URL pills rendered. Button: *"Proceed to Platform Sync (Stage 12) $\to$"*.
- **Recovery Behavior:** "Cancel Scheduled Release" aborts scheduled upload and returns item to Stage 10. Transient upload failure triggers automated retry.

---

### 3.12 Stage 12: Platform Sync Console
- **Canonical Route:** `/platform-packages`, `/platform-packages/:videoId` (`P-12 Platform Sync Console` / `PlatformPackagesPage.tsx`)
- **Required Context & Data:** Live publication records, external platform API metadata payloads, cross-platform synchronization state.
- **Data Displayed & Editable Fields:** Cross-Platform Sync Matrix (YouTube, Instagram, Facebook), Drift Detection indicator (CMS title/desc vs live platform title/desc), Pinned Comment verification status.
- **Available Actions & Preconditions:** `PUBLICATION:SYNC`, `RECONCILE_METADATA`, `RE_PUSH_METADATA`, `COMPLETE_SYNC` (requires zero unresolved drift).
- **State Specifications:**
  - **Loading:** Sync table skeleton loader.
  - **Empty:** *"All published videos are fully synchronized across active channels."*
  - **Error:** Synchronization drift alert callout: *"Metadata drift detected on Instagram Reels."*
  - **Read-Only:** Sync finalized and verified. Re-push controls disabled.
  - **Incomplete:** Drift detected or pinned comment unverified. "Finalize Synchronization" disabled.
  - **Completed:** Green checkmarks across all channels: *"Fully Synchronized across 3/3 Platforms"*. Button: *"Advance to Telemetry Ingestion (Stage 13) $\to$"*.
- **Recovery Behavior:** "Re-Push CMS Metadata" updates external platform copy without rolling back the video production pipeline.

---

### 3.13 Stage 13: Social Analytics
- **Canonical Route:** `/social-analytics/:contentId` (`P-14 Social Retention Bay` / `SocialAnalyticsPage.tsx`)
- **Required Context & Data:** External platform video IDs, 24-hour post-publication observation milestone state, second-by-second audience retention telemetry stream (`anl_<uuid>`).
- **Data Displayed & Editable Fields:** Second-by-Second Retention Graph, Total Views card, Average View Duration (AVD) meter, Drop-off Inflection Points table, Top Student Comments stream.
- **Available Actions & Preconditions:** `ANALYTICS_SNAPSHOT:VIEW`, `ANALYTICS_SNAPSHOT:EXPORT`, `REFRESH_METRICS`, `DISPATCH_PERF_REVIEW` (requires 24h milestone elapsed).
- **State Specifications:**
  - **Loading:** Retention graph shimmer loader and KPI card skeletons.
  - **Empty:** Pre-maturation banner: *"Awaiting 24-hour telemetry maturation. Maturation milestone reached at [timestamp]. Check back in [X] hours."*
  - **Error:** Platform API telemetry ingestion failure alert with `[Re-fetch Metrics]` action.
  - **Read-Only:** Telemetry ingested and frozen for diagnostic review.
  - **Incomplete:** 24-hour observation milestone not yet elapsed. Dispatch disabled.
  - **Completed:** Retention curve analyzed and indexed. Button: *"Open Diagnostic Performance Review (Stage 14) $\to$"*.
- **Recovery Behavior:** Re-querying external analytics refreshes the graph without altering historical snapshot records.

---

### 3.14 Stage 14: Performance Review
- **Canonical Route:** `/analytics/engagement` (`P-15 Performance Intelligence — Tab 1: Review` / `AnalyticsExperiencePage.tsx`)
- **Required Context & Data:** Second-by-second retention curve (Stage 13), synchronized spoken script lines (Stage 03), topic benchmark metrics (`spi_<uuid>`).
- **Data Displayed & Editable Fields:** Synchronized Script-Retention Split Viewer (highlighting dialogue lines where retention drops > 15%), Pedagogical Confusion Tagging panel, Root Cause selector (Pacing, Dialogue Complexity, Misleading Hook, Answer Reveal), Pedagogical Critique textarea.
- **Available Actions & Preconditions:** `PERFORMANCE_RECORD:VIEW`, `PERFORMANCE_RECORD:REVIEW`, `PERFORMANCE_RECORD:CREATE`, `FINALIZE_PERF_REVIEW` (requires drop-off points tagged and critique text $\ge 20\text{ chars}$).
- **State Specifications:**
  - **Loading:** Split-screen script-retention diagnostic skeleton loader.
  - **Empty:** *"No completed videos awaiting diagnostic performance review."*
  - **Error:** Review submission failure alert.
  - **Read-Only:** Performance review signed off. Critique text locked.
  - **Incomplete:** Retention drop-off points unmapped to script lines, or critique text missing. Finalize disabled.
  - **Completed:** Green badge: *"Diagnostic Review Completed. Pedagogical Critique Logged."* Button: *"Proceed to Intelligence Strategy Loop (Stage 15) $\to$"*.
- **Draft Resumption & Recovery:** "Save Review Draft" persists tagged confusion points and critique draft in `performance_records`. Author can update critique notes without rewinding the video lifecycle.

---

### 3.15 Stage 15: Intelligence Loop
- **Canonical Route:** `/analytics/intelligence` (`P-15 Performance Intelligence — Tab 2: Intelligence` / `AnalyticsExperiencePage.tsx`)
- **Required Context & Data:** Historical pedagogical confusion patterns (Stage 14), curriculum syllabus coverage radar, candidate AI strategy directives.
- **Data Displayed & Editable Fields:** Syllabus Health Heatmap, Recurring Student Confusion Trends list, AI Candidate Directive generator, Curriculum Strategy Directive editor.
- **Available Actions & Preconditions:** `INTELLIGENCE_INSIGHT:VIEW`, `INTELLIGENCE_INSIGHT:APPROVE` (**Human gate; AI prohibited via AP-009**), `COMPLETE_WORKFLOW`.
- **State Specifications:**
  - **Loading:** Heatmap and strategy console skeleton loader.
  - **Empty:** *"Insufficient diagnostic data to synthesize curriculum strategy directives."*
  - **Error:** Directive generation or authorization error banner.
  - **Read-Only (Principle 09 / Human Gate):**
    - AI agents cannot autonomously approve directives.
    - If user lacks `INTELLIGENCE_INSIGHT:APPROVE`, approval button is disabled with explanatory tooltip.
  - **Incomplete:** Directive editor empty or lacking target Topic/Subtopic association. Approval disabled.
  - **Completed:** Status badge: *"Curriculum Directive Authorized. Workflow Instance Formally COMPLETED & ARCHIVED."* Directive tagged for loopback injection.
- **Recovery Behavior:**
  - Action `APPROVE_DIRECTIVE`: Authorizes directive, sets `workflowStatus = COMPLETED`, archives instance.
  - Loopback Injection: Approved directive automatically seeds new Question Generation cycles in Stage 01 (`/studio`), closing the full educational loop.

---

## 4. Master Role-to-Action Matrix and Server Authorization Pipeline

### 4.1 Master Role-to-Action Matrix
This matrix governs all **11 Canonical Roles** defined in the authoritative runtime enum `CanonicalRbacRole` ([roles.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/roles.ts)) across all operational verbs in all 15 workflow stages:

```typescript
export enum CanonicalRbacRole {
  ADMIN = 'ADMIN',
  CONTENT_LEAD = 'CONTENT_LEAD',
  PUBLISHING_LEAD = 'PUBLISHING_LEAD',
  QA_REVIEWER = 'QA_REVIEWER',
  QUESTION_AUTHOR = 'QUESTION_AUTHOR',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  SCRIPTWRITER = 'SCRIPTWRITER',
  PRESENTER = 'PRESENTER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  DESIGNER = 'DESIGNER',
  ANALYST = 'ANALYST',
}
```

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              MASTER ROLE-TO-ACTION MATRIX                                                  │
 ├───────────────────┬──────────────────────┬─────────────────────────────┬───────────────────┬──────────────┬────────────────┤
 │ Canonical Role    │ In-Scope Stages      │ Required Capability Token   │ Resource Scope    │ Advisory UI  │ Server Gate    │
 ├───────────────────┼──────────────────────┼─────────────────────────────┼───────────────────┼──────────────┼────────────────┤
 │ QUESTION_AUTHOR   │ Stage 01             │ QUESTION:CREATE             │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ QUESTION_AUTHOR   │ Stage 01             │ QUESTION:EDIT               │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ QUESTION_AUTHOR   │ Stage 01             │ QUESTION:SUBMIT             │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ QUESTION_EDITOR   │ Stage 01             │ QUESTION:EDIT               │ DOMAIN            │ Visible      │ Enforced       │
 │ QUESTION_EDITOR   │ Stage 01             │ QUESTION:SUBMIT             │ DOMAIN            │ Visible      │ Enforced       │
 │ QA_REVIEWER       │ Stage 02             │ QUESTION_REVIEW:VERIFY      │ WORKFLOW_STAGE    │ Visible      │ Enforced       │
 │ QA_REVIEWER       │ Stage 02             │ QUESTION:APPROVE (GAR-02)   │ WORKFLOW_STAGE    │ Visible/Lock │ Enforced/Block │
 │ QA_REVIEWER       │ Stage 02             │ QUESTION:REJECT             │ WORKFLOW_STAGE    │ Visible      │ Enforced       │
 │ QA_REVIEWER       │ Stage 09             │ SOCIAL_REVIEW:REVIEW        │ WORKFLOW_STAGE    │ Visible      │ Enforced       │
 │ QA_REVIEWER       │ Stage 09             │ SOCIAL_REVIEW:APPROVE(GAR02)│ WORKFLOW_STAGE    │ Visible/Lock │ Enforced/Block │
 │ SCRIPTWRITER      │ Stage 03             │ SCRIPT:CREATE               │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ SCRIPTWRITER      │ Stage 03             │ SCRIPT:EDIT                 │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ SCRIPTWRITER      │ Stage 03             │ SCRIPT:SUBMIT               │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ PRESENTER         │ Stage 04             │ VIDEO:RECORD                │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ PRESENTER         │ Stage 04             │ VIDEO_TAKE:CREATE           │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ VIDEO_EDITOR      │ Stage 05, 06         │ MEDIA_REFERENCE:UPLOAD      │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ VIDEO_EDITOR      │ Stage 06             │ VIDEO_EDIT:EDIT             │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ VIDEO_EDITOR      │ Stage 06             │ VIDEO_EDIT:SUBMIT           │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ CONTENT_LEAD      │ Stage 07             │ VIDEO_EDIT:APPROVE (GAR-02) │ DOMAIN            │ Visible/Lock │ Enforced/Block │
 │ CONTENT_LEAD      │ Stage 07             │ VIDEO_EDIT:REJECT           │ DOMAIN            │ Visible      │ Enforced       │
 │ DESIGNER          │ Stage 08             │ THUMBNAIL:CREATE            │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ DESIGNER          │ Stage 08             │ THUMBNAIL:SUBMIT            │ RESOURCE_OWNER    │ Visible      │ Enforced       │
 │ PUBLISHING_LEAD   │ Stage 09             │ SOCIAL_REVIEW:REVIEW        │ DOMAIN            │ Visible      │ Enforced       │
 │ PUBLISHING_LEAD   │ Stage 09             │ SOCIAL_REVIEW:APPROVE(GAR02)│ DOMAIN            │ Visible/Lock │ Enforced/Block │
 │ PUBLISHING_LEAD   │ Stage 10             │ PUBLISHING_PACKAGE:SCHEDULE │ DOMAIN            │ Visible      │ Enforced       │
 │ PUBLISHING_LEAD   │ Stage 11             │ PUBLICATION:PUBLISH         │ DOMAIN            │ Visible      │ Enforced       │
 │ PUBLISHING_LEAD   │ Stage 12             │ PUBLICATION:SYNC            │ DOMAIN            │ Visible      │ Enforced       │
 │ ANALYST           │ Stage 13             │ ANALYTICS_SNAPSHOT:VIEW     │ DOMAIN            │ Visible      │ Enforced       │
 │ ANALYST           │ Stage 13             │ ANALYTICS_SNAPSHOT:EXPORT   │ DOMAIN            │ Visible      │ Enforced       │
 │ ANALYST           │ Stage 14             │ PERFORMANCE_RECORD:VIEW     │ DOMAIN            │ Visible      │ Enforced       │
 │ CONTENT_LEAD      │ Stage 14             │ PERFORMANCE_RECORD:REVIEW   │ DOMAIN            │ Visible      │ Enforced       │
 │ CONTENT_LEAD      │ Stage 15             │ INTELLIGENCE_INSIGHT:APPROVE│ GLOBAL            │ Visible      │ Enforced       │
 │ ADMIN             │ All Stages           │ SYSTEM:MANAGE               │ GLOBAL            │ Visible      │ Enforced       │
 └───────────────────┴──────────────────────┴─────────────────────────────┴───────────────────┴──────────────┴────────────────┘
```

> [!NOTE]
> **Resolution of `SOCIAL_LEAD` via ADR-008**: In `09-RBAC-CAPABILITY-MODEL.md`, a `SOCIAL_LEAD` role was referenced conceptually. In the active code contracts ([roles.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/roles.ts)), social review, publishing, and sync capabilities (`SOCIAL_REVIEW:*`, `PUBLICATION:*`) are formally assigned to **`PUBLISHING_LEAD`**, with **`QA_REVIEWER`** holding peer approval privileges for social review. The 11 canonical roles remain fixed; no autonomous 12th enum is created.

### 4.2 GAR-02 Anti-Self-Approval Invariant Specification
To protect educational rigor and quality standards, BP-CMS strictly enforces the **Anti-Self-Approval Invariant (`GAR-02`)**:

$$\mathbf{GAR\text{-}02}: \quad \text{Reviewer Actor ID} \neq \text{Author Actor ID}$$

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              GAR-02 ENFORCEMENT POINTS                                 │
 ├─────────────────────────┬──────────────────────┬───────────────────────────────────────┤
 │ Quality Gate            │ Governed Action      │ Invariant Requirement                 │
 ├─────────────────────────┼──────────────────────┼───────────────────────────────────────┤
 │ Stage 02: Verification  │ QUESTION:APPROVE     │ actor.id !== question.authorUserId    │
 │ Stage 07: Final QC      │ VIDEO_EDIT:APPROVE   │ actor.id !== video.editorUserId       │
 │ Stage 09: Social Review │ SOCIAL_REVIEW:APPROVE│ actor.id !== script.authorUserId      │
 └─────────────────────────┴──────────────────────┴───────────────────────────────────────┘
```

#### Server-Side Enforcement Rules:
1. When any approval endpoint is invoked (`/api/questions/:id/verify`, `/api/videos/:id/status`, `/api/social-reviews/:id/approve`), the Express authorization middleware extracts `actor.id` from the authenticated session token and compares it with the target entity's author/creator ID (`entity.authorUserId`).
2. If `actor.id === entity.authorUserId`, the request is **instantly rejected** on the server with `HTTP 403 Forbidden` and error code `FORBIDDEN_BY_SEGREGATION_OF_DUTIES` (or `SELF_APPROVAL_FORBIDDEN`).
3. **Universal Zero-Bypass Principle**: The anti-self-approval rule applies unconditionally and equally to all 11 canonical roles, including `CONTENT_LEAD` and `ADMIN`. Administrative status provides zero authority to approve one's own authored artifact.
4. **Absolute Prohibition of Administrative & Emergency Overrides**:
   - There are **zero exceptions, emergency bypasses, break-glass mechanisms, or administrative override protocols** for GAR-02 in BP-CMS.
   - Any client payload attempting to bypass segregation of duties via override fields (e.g., `isOverride`, `bypassGar02`, `confirmedByAdmin`) must be rejected server-side as invalid/forbidden.
   - Operational deadlocks, sick leave, or emergency content progression must be resolved exclusively via legitimate separation of duties: assigning or delegating the review gate to an independent, qualified reviewer or lead.

#### Frontend Presentation Rules:
1. When an author inspects their own submitted artifact at a review gate, the approval button is replaced by an informational badge:
   $$\text{"Anti-Self-Approval Active: As author, you cannot verify your own submission (GAR-02)."}$$
2. The UI never gives the impression that the user is authorized to approve their own work.
3. The author retains full read-only inspection access to verify how their submission appears in the review bay.

### 4.3 12-Step Server Authorization Decision Pipeline
Every protected API request executes the 12-step server evaluation pipeline defined in `backend/infrastructure/security/rbac-evaluator.ts`:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      12-STEP SERVER AUTHORIZATION DECISION PIPELINE                    │
 └────────────────────────────────────────────────────────────────────────────────────────┘
   1. Authenticate Actor Context: Extract and verify session token; verify isActive == true.
   2. Resolve Actor Identity & Roles: Map user ID to canonical roles array.
   3. Resolve Requested Capability: Parse required RESOURCE:ACTION token.
   4. Evaluate Capability Possession: Check if actor holds the required token (multi-role union).
   5. Resolve Target Entity Instance: Query Firestore for target document (Question, Video, etc.).
   6. Evaluate Object-Level Access: Check resource ownership / data scope.
   7. Evaluate Segregation-of-Duties (GAR-02): Inviolable check reviewerId !== authorId for APPROVE/VERIFY across all roles (zero bypass).
   8. Evaluate Business & State Preconditions: Check if prerequisites are satisfied.
   9. Evaluate Workflow Transition Rules: Verify WorkflowInstance.currentStage matches operation.
  10. Evaluate AI Human-Gating Constraints (AP-009): Prevent AI from executing gated transitions.
  11. Execute State Mutation & Atomic Audit Log: Persist updates and append AuditEvent.
  12. Return Safe Authorization Result: Return HTTP 200/201 or appropriate standardized error.
```

---

## 5. Draft Resumption and Context Restoration Specification

### 5.1 Supported Route and Query-Parameter Forms
The application supports the following explicit, typed URL query parameter forms for direct-link navigation and draft resumption:

- **Stage 01 Question Studio**:
  - `/studio?draftId=dft_<uuid>` (Reopens an existing saved draft)
  - `/studio?mode=QUESTION_CHALLENGE_SHORT&topicId=top_<uuid>&subtopicId=sub_<uuid>` (Initializes a new draft with pre-seeded context)
- **Stage 02 Verification**:
  - `/questions/:id/verify` (Direct verification workbench by canonical question ID)
- **Stages 03–08 Master Video Production**:
  - `/videos/:videoId?tab=script` (Stage 03 Audience Script)
  - `/videos/:videoId?tab=recording` (Stage 04 Teleprompter & Filming / Stage 05 Raw Handoff)
  - `/videos/:videoId?tab=editing` (Stage 06 Editing Bay)
  - `/videos/:videoId?tab=final-review` (Stage 07 Final QC Gate)
  - `/videos/:videoId?tab=thumbnail` (Stage 08 Thumbnail Studio)
- **Stage 09 Social Review**:
  - `/social-review/:reviewId` (Direct review studio by canonical review ID)
- **Stages 10–11 Publishing**:
  - `/publishing` (Stage 10 Publishing Setup / Scheduled)
  - `/publishing?tab=live` (Stage 11 Live Published Monitor)
- **Stage 12 Platform Sync**:
  - `/platform-packages/:videoId` (Platform Sync Console by video ID)
- **Stages 13–15 Analytics & Intelligence**:
  - `/social-analytics/:contentId` (Stage 13 Retention Bay)
  - `/analytics/engagement` (Stage 14 Performance Review)
  - `/analytics/intelligence` (Stage 15 Intelligence Loop)

### 5.2 Draft-ID Validation and Authorization Before Loading
Prior to rendering or restoring data:
1. **Format Validation**: The client and server validate that `draftId` matches the canonical regex `^dft_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Malformed IDs trigger immediate client-side error notification without issuing database queries.
2. **Authorization & Scope Verification**: The server verifies that the authenticated user either owns the draft (`authorUserId === actor.userId`), holds `QUESTION_EDITOR` privileges, or holds `ADMIN` scope. Unauthorized attempts return `HTTP 403 Forbidden`.
3. **Stage-Bound Guard**: If the draft has already been submitted and advanced to Stage 02 (`workflowStage > 1` and `stageStatus !== 'CHANGES_REQUESTED'`), the editor loads in read-only mode with a notice redirecting to the verification bay.

### 5.3 Loading and Failure States

| State / Condition | System Behavior & User Experience | Recovery / Next Action |
| :--- | :--- | :--- |
| **Valid Saved Draft Found** | Hydrates all saved fields into form; sets `isDirty = false`; displays toast: *"Draft restored from saved version: [timestamp]"*. | User continues editing. Save Draft and Submit buttons available. |
| **Missing / Not Found (`404`)** | Displays alert banner: *"The requested draft (dft_...) could not be found or has been purged."* | Provides button: `[Create New Draft]`, clearing query parameters. |
| **Inaccessible / Unauthorized (`403`)** | Displays access forbidden alert: *"You do not have permission to view or edit this draft."* | Provides button: `[Back to My Work]`. |
| **Stale Version Conflict (`409`)** | Optimistic Concurrency Control (OCC) detects `expectedVersion !== currentVersion`. Displays **Stale Version Conflict Dialog** showing server vs local diff. | Option A: `[Overwrite Server Version]`.<br>Option B: `[Discard Local & Load Server]`. |
| **Malformed / Corrupted Data** | Fallback parser repairs missing fields with defaults; displays warning: *"Draft data was partially corrupted and repaired with defaults."* | User reviews repaired fields before saving. |
| **Rejection Resumption (`CHANGES_REQUESTED`)** | Restores all previously submitted fields; displays sticky, non-dismissible **Rejection Banner** containing reviewer name, timestamp, failed checklist items, and mandatory revision notes. | Author modifies flagged fields; re-submitting clears the rejection banner. |

### 5.4 Distinction Between Persisted Data and Unsaved Edits
- **Persisted Data**: Exists strictly in Cloud Firestore (`question_drafts`).
- **Unsaved Edits**: Tracked via `isDirty: boolean`.
- **Accidental Closure Protection**: If the browser crashes or closes unexpectedly, the application checks `localStorage` cache. If cached draft timestamp is newer than Firestore record, the user is presented with the **Unsaved Changes Recovered Modal**:
  - `Restore Local Edits`: Restores cached form state; sets `isDirty = true`.
  - `Discard Local Edits`: Loads authoritative Firestore document; sets `isDirty = false`.

### 5.5 Prevention of Context Leakage
To ensure strict multi-tenant and multi-record isolation:
1. When navigating between different drafts or workbenches, the `ProductionContextProvider` executes a complete state reset (`resetContext()`) before mounting the new record.
2. Form fields are never allowed to carry over residual state from previously viewed drafts.
3. User session logout immediately purges all in-memory production contexts and local storage draft caches.

---

## 6. Discrepancy & Open Decision Register

The following design decisions and architectural discrepancies are recorded and tracked across Sprint 08:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             OPEN DECISION & DISCREPANCY REGISTER                       │
 ├───────┬───────────────────────────────┬──────────────────────────────────┬─────────────┤
 │ ID    │ Scope & Description           │ Architectural Options            │ Status      │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-01 │ Final QC Route Unification    │ Option A: Retain as Tab 4 inside │ RESOLVED    │
 │       │ (Overlapping Tab vs FC-012)   │   VideoDetailPage.tsx (amend     │ VIA ADR-011 │
 │       │                               │   FC-012 standalone route req.)  │ (Option A)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-02 │ Production Mode Selection UX  │ Option A: Modal on /studio entry │ RESOLVED    │
 │       │                               │ Option B: Batch config on /plan  │ VIA ADR-011 │
 │       │                               │ Option C: Dedicated /content/new │ (Option A)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-03 │ Multi-Question Studio Layout  │ Option A: Horizontal question tab│ RESOLVED    │
 │       │ (Mode 1 & 3: 5/10/15/20 Qs)   │ Option B: Accordion list         │ VIA ADR-011 │
 │       │                               │ Option C: Stepper wizard         │ (Option A)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-04 │ Deep-Link Param Standardiz.   │ Option A: Use cnt_<uuid> as root │ RESOLVED    │
 │       │ (contentId vs videoId vs qst) │ Option B: Entity-specific params │ VIA ADR-011 │
 │       │                               │   (videoId, questionId)          │ (Option B)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-05 │ Multi-Question Draft Storage  │ Option A: Single aggregate draft │ RESOLVED    │
 │       │                               │ Option B: Array of dft_<uuid> ids│ VIA ADR-011 │
 │       │                               │   in question_drafts collection  │ (Option A)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-06 │ Teleprompter Multi-Q Nav      │ Option A: Continuous vertical run│ RESOLVED    │
 │       │                               │ Option B: Per-question segmenting│ VIA ADR-011 │
 │       │                               │   with independent take clips    │ (Option B)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-07 │ Unmounted Page Disposition    │ Option A: Retire 8 orphaned files│ RESOLVED    │
 │       │ (8 unmounted files in pages/) │ Option B: Migrate into workbenches│ VIA ADR-011 │
 │       │                               │   (Delete 297 KB dead code S09)  │ (Option A)  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ DD-08 │ Canonical Role Governance:    │ Option A: Formalize SOCIAL_LEAD  │ RESOLVED    │
 │       │ SOCIAL_LEAD Role Evaluation   │   as 12th CanonicalRbacRole enum │ VIA ADR-008 │
 │       │                               │ Option B: Keep social review &   │ (Option B)  │
 │       │                               │   sync under PUBLISHING_LEAD     │             │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ OD-02 │ Mode 1 Batch Runner Engine    │ Automated dispatch runner for    │ OPEN /      │
 │       │ (Multi-Short Parallel Dispatch│ Mode 1 batch generation series   │ PROPOSED    │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ OD-04 │ Media Worker 16:9 Adaptation  │ Reconcile transcode workers with │ OPEN /      │
 │       │ (Worker Upload Hardcoded 9:16)│ 16:9 masterclass assets          │ DOWNSTREAM  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ OD-05 │ Masterclass Video Assembly    │ Multi-take stitching & chapter   │ OPEN /      │
 │       │ (Downstream Stitch Pipeline)  │ rendering for Mode 3 videos      │ DOWNSTREAM  │
 ├───────┼───────────────────────────────┼──────────────────────────────────┼─────────────┤
 │ OD-07 │ Async Worker Timeouts (3GB)   │ Worker memory & chunked uploads  │ OPEN /      │
 │       │ (Masterclass 52m Video Jobs)  │ for long-running masterclasses   │ DOWNSTREAM  │
 └───────┴───────────────────────────────┴──────────────────────────────────┴─────────────┘
```

---

## 7. Acceptance Criteria, Traceability, and Gate A Approval Record

### 7.1 Testable Acceptance Criteria
- **AC-T04-01 (Shared Context Grounding)**: Every in-scope production workbench must initialize and maintain a typed `ProductionContext` comprising `taxonomy` (`topicId`, `subtopicId`), `modeConfig` (`productionMode`, `questionCount`, `aspectRatio`), `entityIds`, `workflow` (15 stages), `assignment`, and `actor`.
- **AC-T04-02 (Direct-Link Hydration)**: Navigating directly to any canonical workbench route with valid query parameters must successfully hydrate session credentials, fetch target Firestore entities, validate workflow stage alignment, and render the correct page state without dropping context.
- **AC-T04-03 (Draft Resumption Independence)**: Resuming a draft via `/studio?draftId=dft_<uuid>` must load saved draft fields into the editor without dirty state, and must **never** automatically trigger Stage 02 verification or advance workflow stage.
- **AC-T04-04 (Save Draft vs. Submit Separation)**: The `Save Draft` action must persist minimal valid fields to `question_drafts` and remain on the current page. The `Submit for Verification` action must execute comprehensive schema validation, require a saved draft, and advance the workflow to Stage 02.
- **AC-T04-05 (15-Stage Page-State Completeness)**: The specification must account for all 15 canonical workflow stages, defining all six essential states (`loading`, `empty`, `error`, `read-only`, `incomplete`, and `completed`) along with draft resumption and recovery behavior for each stage.
- **AC-T04-06 (Zero-Trust Server Authority)**: Frontend button states and page visibility must be treated strictly as presentation. Every backend API endpoint must independently execute authentication, capability checks, and stage precondition validation.
- **AC-T04-07 (GAR-02 Server Enforcement)**: The backend authorization pipeline must reject self-approval requests with `HTTP 403 Forbidden` (`FORBIDDEN_BY_SEGREGATION_OF_DUTIES` / `SELF_APPROVAL_FORBIDDEN`) whenever `actor.id === authorUserId` across Stages 02, 07, and 09.
- **AC-T04-08 (Universal Zero-Bypass GAR-02 Enforcement)**: Server-side GAR-02 anti-self-approval enforcement is absolute across all roles, including `ADMIN`. There are zero emergency, administrative, or audited bypass mechanisms. Any self-approval attempt by an author or administrator must be rejected server-side with `HTTP 403 Forbidden`.
- **AC-T04-09 (Multi-Role Capability Union)**: A user holding multiple canonical roles must possess the union of all capabilities granted by those roles, evaluated atomically without inheritance assumptions.
- **AC-T04-10 (Two-Tier Taxonomy Alignment)**: All workbench contexts and persistence rules must enforce the strictly two-tier taxonomy `Topic` $\to$ `Subtopic`. Any reference to the legacy `Category` concept is prohibited.
- **AC-T04-11 (Traceability & Reconciliation)**: The requirements must explicitly trace to and reconcile with S8-T01 (Question Generation Audit, `dft_<uuid>` prefix), S8-T02 (Workflow Inventory), and S8-T03 (Content Mode Requirements).
- **AC-T04-12 (Zero Implementation Prior to Gate A)**: The repository must contain zero application code, route modifications, or schema changes for S8-T04 until Gate A is formally approved.

### 7.2 Contract Traceability Matrix
```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                CONTRACT TRACEABILITY MATRIX                            │
 ├───────────────────────┬──────────────────────────────────┬─────────────────────────────┤
 │ S8-T04 Section        │ Upstream Authority Source        │ Contractual Alignment       │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 2: Production Ctx │ docs/sprints/sprint-08/S8-T03    │ Propagates Mode 1, 2, 3 and │
 │                       │ shared/lib/id.service.ts         │ canonical dft_ & cnt_ IDs   │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 2.4: Save vs Sub  │ AGENTS.md (Rule 11)              │ Strictly separates Save     │
 │                       │ docs/sprints/sprint-08/S8-T01    │ Draft from Submit / Verify  │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 3: Page-State Mat │ docs/architecture/07-CANONICAL   │ 100% coverage across all 15 │
 │                       │ docs/sprints/sprint-08/S8-T02    │ canonical production stages │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 4.1: Role Matrix  │ shared/constants/roles.ts        │ Maps 11 canonical roles to  │
 │                       │ src/types/rbac-models.ts         │ atomic capability tokens    │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 4.2: GAR-02 Invar │ docs/architecture/09-RBAC (Sec 9)│ Universal zero-bypass:      │
 │                       │ AGENTS.md (Rule 10)              │ author !== reviewer across  │
 │                       │                                  │ all roles (incl. ADMIN)     │
 ├───────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 │ Sec 7: Gate A Record  │ AGENTS.md (Prime Directive)      │ Blocks implementation until │
 │                       │ S8-T01 through S8-T04 approved   │ formal approval recorded    │
 └───────────────────────┴──────────────────────────────────┴─────────────────────────────┘
```

### 7.3 Gate A Definition, Prerequisites & Status

Gate A is the mandatory architectural checkpoint that formally certifies the **Dynamic Production Foundation** before any runtime application code, UI components, routes, or database schemas may be implemented in Sprint 09.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                      GATE A PREREQUISITE TRACEABILITY MATRIX                                           │
 ├───────┬──────────────────────────┬─────────────────────────────────┬─────────────────────────────────┬─────────────────┤
 │ ID    │ Prerequisite Scope       │ Authoritative Artifact File     │ Verified Code / Arch Evidence   │ Gate A Status   │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-01 │ S8-T01 Accepted: Stage 01│ docs/sprints/sprint-08/         │ Save Draft != Verify decoupled; │ SATISFIED       │
 │       │ Question Generation Audit│ S8-T01-QUESTION-GENERATION-AUDIT│ dft_<uuid> draft persistence in │ (Audit Accepted │
 │       │                          │ .md                             │ Firestore; zero Category leaks. │ at commit 5938) │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-02 │ S8-T02 Accepted: 15-Stage│ docs/sprints/sprint-08/         │ 15 stages mapped; 8 unmounted   │ SATISFIED       │
 │       │ Workflow & Page Inventory│ S8-T02-PRODUCTION-PAGE-WORKFLOW │ pages cataloged; QC gate duality│ (Inventory Done │
 │       │                          │ -INVENTORY.md                   │ (FC-012 vs Tab 4) forensic audit│ at commit 9b40) │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-03 │ S8-T03 Accepted: Three   │ docs/sprints/sprint-08/         │ Modes 1, 2, 3 specified; matrix │ SATISFIED       │
 │       │ Content Mode Requirements│ S8-T03-CONTENT-MODE-REQUIREMENTS│ reconciled; OD-01 through OD-07 │ (Accepted at    │
 │       │                          │ .md                             │ resolved via ADR-009 & ADR-010. │ commit 216d746) │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-04 │ S8-T04 Accepted: Dynamic │ docs/sprints/sprint-08/         │ ProductionContext, 15-stage page│ SPECIFIED —     │
 │       │ Pages, Roles & GAR-02    │ S8-T04-DYNAMIC-PAGE-ROLE-       │ states, 11 roles, zero-bypass   │ PENDING USER /  │
 │       │                          │ REQUIREMENTS.md                 │ GAR-02; DD-01 through DD-08 res.│ STAKEHOLDER     │
 │       │                          │                                 │                                 │ SIGN-OFF        │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-05 │ Full Workflow Lifecycle  │ docs/architecture/              │ 100% of all 15 canonical stages │ SATISFIED       │
 │       │ Coverage (Stages 01–15)  │ 07-CANONICAL-15-STEP-WORKFLOW.md│ mapped with all 6 UI states     │ (Specification  │
 │       │                          │ S8-T04 Section 3                │ (loading, empty, error, etc.)   │ Complete)       │
 ├───────┼──────────────────────────┼─────────────────────────────────┼─────────────────────────────────┼─────────────────┤
 │ PR-06 │ Zero Implementation      │ Codebase root, git status,      │ Zero runtime code, routes, or   │ SATISFIED       │
 │       │ Prematurity Prior to Gate│ package.json, App.tsx           │ schemas implemented before Gate │ (Verified Clean)│
 │       │                          │                                 │ A formal approval.              │                 │
 └───────┴──────────────────────────┴─────────────────────────────────┴─────────────────────────────────┴─────────────────┘
```

### 7.4 Gate A Formal Approval Record & Open Status

$$\mathbf{GATE\ A\ CURRENT\ STATUS}: \quad \mathbf{OPEN\ (Pending\ Stakeholder\ Sign\text{-}Off\ on\ S8\text{-}T04)}$$

In strict adherence to the project governance rule that **an existing approval label or commit is not proof of approval**, Gate A remains **OPEN**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              GATE A FORMAL APPROVAL RECORD                                             │
 ├────────────────────────────┬─────────────────────────────┬──────────────┬──────────────┬───────────────────────────────┤
 │ Stakeholder / Authority    │ Review Scope                │ Decision     │ Date         │ Attributable Evidence         │
 ├────────────────────────────┼─────────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
 │ Project Owner / User       │ S8-T01 Question Gen Audit   │ ACCEPTED     │ 2026-10-14   │ Commit 5938946                │
 ├────────────────────────────┼─────────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
 │ Project Owner / User       │ S8-T02 Workflow Inventory   │ ACCEPTED     │ 2026-10-14   │ Commit 9b409c5                │
 ├────────────────────────────┼─────────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
 │ Project Owner / User       │ S8-T03 Content Mode Req.    │ ACCEPTED     │ 2026-10-15   │ Commit 216d746                │
 ├────────────────────────────┼─────────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
 │ Project Owner / User       │ S8-T04 Dynamic Page & Roles │ PENDING      │ 2026-10-15   │ Under Review in Task S8-T04   │
 ├────────────────────────────┼─────────────────────────────┼──────────────┼──────────────┼───────────────────────────────┤
 │ Architecture Review Board  │ ADR-008 through ADR-011     │ APPROVED     │ 2026-10-14   │ docs/architecture/DECISION-LOG│
 └────────────────────────────┴─────────────────────────────┴──────────────┴──────────────┴───────────────────────────────┘
```

### Actionable Criteria for Gate A Closure:
1. Prerequisites PR-01, PR-02, PR-03, PR-05, and PR-06 are verified and satisfied.
2. Prerequisite PR-04 is fully authored, internally consistent, and submitted for stakeholder review in this deliverable.
3. Once the Project Owner reviews and confirms acceptance of S8-T04, Gate A will be formally marked **CLOSED / SATISFIED**, releasing Phase B implementation planning. Until that sign-off is recorded, Gate A remains **OPEN**.
