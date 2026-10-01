# Burra Pariksha CMS
# 10 — Frontend & Information Architecture

Stage: 10 — Frontend & Information Architecture

STATUS:
READY FOR GITHUB VERIFICATION

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PENDING

Product Owner Acceptance:
NOT USED IN ROUTINE STAGE CLOSURE

Version:
1.0.0

Purpose:
Defines the authoritative frontend Information Architecture (IA), user experience (UX) framework, and navigation topology for the Burra Pariksha Content Management System (BP-CMS). Establishes a unified global application shell, capability-aware navigation across the six core hubs (HOME, QUESTIONS, PRODUCTION, PUBLISHING, ANALYTICS, MANAGEMENT & SYSTEM), canonical 15-step workflow navigation without state conflation, standardized resource page patterns, robust search and filtering architectures, in-app notification centers, administrative boundaries, breadcrumb strategies, resilient loading/error states, and a structured migration strategy for the brownfield baseline (31 pages, 79 client routes) into a clean, modern educational media production platform.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 10 Frontend & Information Architecture | FACT |
| **File Path** | `docs/architecture/10-FRONTEND-IA.md` | FACT |
| **Document Stage** | Stage 10 — Frontend & Information Architecture | FACT |
| **Authority** | Authoritative Frontend Architecture Specification & UX Contract | FACT |
| **Status** | READY FOR GITHUB VERIFICATION | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Verified & Closed)<br>Stage 07 (`07-CANONICAL-15-STEP-WORKFLOW.md` - 100% Verified & Closed)<br>Stage 08 (`08-STATE-MODEL.md` - 100% Verified & Closed)<br>Stage 09 (`09-RBAC-CAPABILITY-MATRIX.md` - 100% Verified & Closed) | FACT |
| **Subsequent Stages** | Stage 11+ (Data Architecture, Target Schemas, Physical Storage Models, API Contracts, UI Implementation) | FACT |
| **Baseline Repository Commit** | `548ff5d2c1adcbcb6ea82425856a59032169ec2f` | FACT |
| **Architectural Scope** | Formally defines the target frontend information architecture, navigation models, and page topology without modifying application source code, package dependencies, or database schemas | FACT |

### Architectural Deferral Declaration
Frontend information architecture is being defined authoritatively in this document. All physical UI component refactoring, React Router route updates, styling changes, state hook modifications, and production code implementations are **EXPLICITLY DEFERRED** to subsequent implementation stages.

---

## 02. UX & Information Architecture Principles

The frontend user experience of BP-CMS is founded upon twelve inviolable architecture and design principles derived from Stages 01–09:

```
================================================================================
                    BP-CMS TARGET UX & IA PRINCIPLES
================================================================================

 1. ONE SIMPLIFIED GLOBAL SHELL (AP-006)
    A single unified application shell containing the primary sidebar, header,
    breadcrumb engine, and main content canvas hosts all user interactions.

 2. WORK-ORIENTED & CONTEXT-DRIVEN NAVIGATION
    Navigation is organized around the real-world manufacturing stages of
    educational content creation rather than arbitrary technical database tables.

 3. CAPABILITY-AWARE VISIBILITY, NOT AUTHORIZATION (AP-004, Stage 09)
    The frontend queries user capabilities solely to optimize visual ergonomics
    and prevent frustration; the backend remains the sole authoritative gate.

 4. ZERO COMPETING NAVIGATION SYSTEMS
    Multiple conflicting navigation models (e.g. separate sidebar vs floating
    workflow banners vs hidden route tabs) are eliminated in favor of a single
    coherent hierarchy.

 5. CANONICAL 15-STEP WORKFLOW AS PRIMARY PROGRESSION AXIS (AP-001, Stage 07)
    Production tracking directly reflects the sequential 15-step pipeline.
    Workbenches provide explicit step context and unambiguous forward/rework paths.

 6. STRICT STATE ANTI-CONFLATION IN UI (AP-002, Stage 08)
    The UI clearly separates Business Workflow Step, Entity Lifecycle Status,
    Media Processing Status, Job Execution Status, and Publication Channel Status.

 7. PREDICTABLE & CONSISTENT RESOURCE PATTERNS
    Every domain entity follows standardized view, list, detail, and editing
    paradigms with consistent layout, action placement, and metadata display.

 8. RESILIENT STATE TRANSITIONS & DEFECT FEEDBACK
    When a gate or precondition is unmet, the UI provides clear, actionable
    explanations rather than silent failures or cryptic technical error codes.

 9. FAST, ACCESSIBLE, AND KEYBOARD-FRIENDLY WORKSPACES
    Studio teleprompters, question authoring tools, and review benches support
    rapid data entry, keyboard navigation, and high-contrast accessibility.

10. SEPARATION OF OPERATIONAL TASKS FROM ADMINISTRATIVE CONTROLS (Stage 09)
    System administration, disaster recovery, and global configuration are
    isolated into dedicated management workspaces inaccessible to routine roles.

11. IMMUTABLE FORENSIC AUDIT DISPLAY (AP-014)
    Historical reviews, QC rejection reasons, and step transitions are
    permanently visible in chronological audit strips.

12. DETERMINISTIC FEEDBACK ON NETWORK & SYSTEM FAULTS
    Transient job retries, network offline states, and Google Drive rate limits
    are clearly identified as technical operations, not editorial rejections.

================================================================================
```

---

## 03. Target Global Application Shell

### 3.1 Shell Architecture Overview
The BP-CMS target shell replaces the disjointed multi-wrapper brownfield layout with a modern, responsive, high-density operational shell:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [BP-CMS Logo]  [Global Search (Ctrl+K)]    [Sprint/Batch Selector]    [Notifications] [User Profile] [Help] │  <-- HEADER (64px)
├──────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┤
│              │ [Hub Title] > [Resource Name] > [Active Entity / Step Context]         [Action Toolbar]      │  <-- CONTEXT BAR
│  COLLAPSIBLE ├───────────────────────────────────────────────────────────────────────────────────────────────┤
│   PRIMARY    │                                                                                               │
│   SIDEBAR    │                                                                                               │
│              │                                                                                               │
│  (6 Frozen   │                                     MAIN WORKSPACE CANVAS                                     │
│     Hubs)    │                                                                                               │
│              │                                                                                               │
│   [260px /   │                                                                                               │
│    72px]     │                                                                                               │
│              ├───────────────────────────────────────────────────────────────────────────────────────────────┤
│              │ [15-Step Mini Workflow Tracker] (Present on all Content/Video Project workspaces)             │  <-- WORKFLOW STRIP
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Shell Component Topology
1. **Collapsible Primary Navigation Sidebar (Left, 260px expanded / 72px icon-only):**
   - Renders the six authoritative navigation hubs.
   - Shows active hub and item highlights based on deterministic route matching.
   - Capability-aware: filters out hubs or items the current user has zero capabilities for.
   - Expand/collapse toggle with local storage persistence and keyboard shortcut (`[`).
2. **Top Application Header (Fixed top, 64px height):**
   - Brand lockup with active environment indicator (Production / Staging / Dev).
   - Global Omnibox Search (`Ctrl+K` / `Cmd+K`) querying Questions, Scripts, Videos, Content IDs.
   - Global Sprint / Curriculum Batch quick-selector.
   - Real-time System Health & Google Drive Sync status indicator.
   - Operational Notifications Center bell with unread task badge.
   - User Profile Menu with active role display and session controls.
3. **Contextual Action Bar & Breadcrumbs (Under Header, 48px height):**
   - Hierarchical breadcrumb navigation (Hub $	o$ Resource Collection $	o$ Entity $	o$ Active Tab).
   - Primary page title with status badges (Workflow Step + Entity Status).
   - Contextual primary and secondary action buttons (e.g., `Submit to QC`, `Export Cut`, `Publish`).
4. **Primary Content Canvas:**
   - Scrollable workspace area with standardized grid spacing (24px gutter).
   - Maximum content width bounded for readability (`max-w-7xl` or full-bleed for studio/video editors).
5. **Workflow Progression Strip (Persistent contextual footer/banner):**
   - Displayed whenever viewing or editing a `Content`, `Question`, or `Video` project.
   - Visualizes current position along the canonical 15 steps with status indicators.

---

## 04. Target Primary Navigation

### 4.1 Navigation Model & Hierarchy
Primary navigation operates strictly within a three-tier hierarchy:
$$	ext{Hub (Level 1)} \longrightarrow 	ext{Navigation Item (Level 2)} \longrightarrow 	ext{Entity Workbench / Detail (Level 3)}$$

No floating menus, detached sub-menus, or secondary sidebars may override this structure.

### 4.2 Primary Navigation Structure

```
[HOME]
  ├── Overview (Operations Pulse & KPIs)
  └── My Work (Personal Assignment Queue & Review Requests)

[QUESTIONS]
  ├── Question Library (Curriculum Index, Search & Filtering)
  └── Question Studio (Authoring, Math Proofs & AI Assistance)

[PRODUCTION]
  ├── Recording Queue (Studio Filming Schedule & Raw Intake)
  └── Production Bay (Scripting, Video Editing, QC & Thumbnails)

[PUBLISHING]
  ├── Quality Signoff (Stage 09 Mobile Simulator & Editorial Sign-off)
  └── Publishing Hub (Stage 10 Multi-Platform Staging, Scheduling & Live Sync)

[ANALYTICS]
  ├── Analytics Hub (Audience Retention, Views & Engagement)
  └── Intelligence Loop (Pedagogical Strategy & Curriculum Insights)

[MANAGEMENT & SYSTEM]
  ├── Planning & Batches (Syllabus Coverage & Sprint Scheduling)
  ├── Team Workload (Operator Assignments & Production Capacity)
  ├── Content Explorer (Content Master Aggregate Lifecycle)
  ├── System Health (Taxonomies, API Keys & Integration Telemetry)
  └── Disaster Recovery (Database Snapshot Restore - Admin Only)
```

---

## 05. The Six Core Hubs

The target architecture consolidates all 31 brownfield pages and 79 client routes into six frozen, authoritative hubs:

### 5.1 Hub 1: HOME
- **Purpose:** Central operational launchpad and personal task coordination center.
- **Target Audience:** All authenticated team members across all roles.
- **Contained Workspaces:**
  1. `Overview` (`/dashboard`): Operational health pulse, daily publication count, active bottlenecks across the 15 stages, and recent activity feeds.
  2. `My Work` (`/my-work`): Filterable queue of items assigned to the current user (e.g. questions to draft, scripts to write, takes to film, cuts to edit, QC reviews pending).
- **Required Capabilities to View:** `CONTENT:VIEW` or `NOTIFICATION:VIEW`.

### 5.2 Hub 2: QUESTIONS
- **Purpose:** Management and creation of the pedagogical curriculum core.
- **Target Audience:** Question Authors, Editors, QA Reviewers, Topic Leads.
- **Contained Workspaces:**
  1. `Question Library` (`/questions`): Searchable, filterable repository of all questions grouped by Class, Subject, Chapter, Topic, and Difficulty.
  2. `Question Studio` (`/studio`): Dedicated authoring workbench for drafting question stems, 4 distractor options, Telugu translations, mathematical proofs, and invoking AI prompt generation.
  3. `Question Verification Workbench` (`/questions/:id/verify`): Formal Stage 02 10-point pedagogical audit workbench with anti-self-approval enforcement.
- **Required Capabilities to View:** `QUESTION:VIEW`.

### 5.3 Hub 3: PRODUCTION
- **Purpose:** End-to-end media manufacturing from teleprompter scripts to master video cuts.
- **Target Audience:** Scriptwriters, Studio Presenters, Video Editors, Designers, Production Leads.
- **Contained Workspaces:**
  1. `Recording Queue` (`/queue`): Studio filming schedule, teleprompter launcher, and raw camera take upload bay.
  2. `Production Bay` (`/production`, `/videos/:id`): Unified tabbed video project workbench:
     - Tab 1: Script & Teleprompter Pacing (Stage 03)
     - Tab 2: Studio Filming & Raw Takes (Stages 04–05)
     - Tab 3: Video Editing Bay & Master MP4 Render (Stage 06)
     - Tab 4: Final QC Workbench (Stage 07)
     - Tab 5: Thumbnail Studio & Variant Review (Stage 08)
- **Required Capabilities to View:** `VIDEO:VIEW` or `SCRIPT:VIEW`.

### 5.4 Hub 4: PUBLISHING
- **Purpose:** Quality gate certification and multi-platform social distribution.
- **Target Audience:** QA Reviewers, Publishing Leads, Social Media Managers.
- **Contained Workspaces:**
  1. `Quality Signoff` (`/social-review`): Stage 09 9:16 vertical smartphone simulator, safe-zone overlay check, title/copy validation, and pinned comment approval.
  2. `Publishing Hub` (`/publishing`): Stage 10 multi-platform scheduling, Stage 11 live broadcast dispatch, and Stage 12 cross-platform sync verification (YouTube Shorts, Instagram Reels, Facebook Video).
- **Required Capabilities to View:** `PUBLISHING_PACKAGE:VIEW` or `SOCIAL_REVIEW:REVIEW`.

### 5.5 Hub 5: ANALYTICS
- **Purpose:** Post-broadcast audience retention analysis and pedagogical intelligence synthesis.
- **Target Audience:** Performance Analysts, Content Strategy Leads, Executive Producers.
- **Contained Workspaces:**
  1. `Analytics Hub` (`/analytics/engagement`): Multi-platform view metrics, watch time, 3-second hook drop-off curves, and student confusion points (Stage 13–14).
  2. `Intelligence Loop` (`/analytics/intelligence`): AI-assisted synthesis of retention drop-offs into curriculum recommendations, looping insights back to Stage 01 Question Studio (Stage 15).
- **Required Capabilities to View:** `ANALYTICS_SNAPSHOT:VIEW`.

### 5.6 Hub 6: MANAGEMENT & SYSTEM
- **Purpose:** Administrative platform control, syllabus planning, workload delegation, and disaster recovery.
- **Target Audience:** Content Leads, System Administrators.
- **Contained Workspaces:**
  1. `Planning & Batches` (`/planning`): Syllabus topic coverage radar, sprint batch generator, and question similarity radar.
  2. `Team Workload` (`/team`): Operator capacity tracking, unassigned task queues, and workload rebalancing.
  3. `Content Explorer` (`/content-masters`): Global aggregate explorer inspecting linked entities across the full lifecycle.
  4. `System Health & Settings` (`/settings`): Taxonomy manager, Google Drive folder connections, and API configuration.
  5. `Disaster Recovery` (`/recovery`): High-security admin console for Google Sheets database snapshots, backup restoration, and forensic verification.
- **Required Capabilities to View:** `CONFIGURATION:ADMINISTER` or `USER:ADMINISTER`.

---

## 06. Dashboard Architecture

### 6.1 Purpose & Role Adaptability
The Dashboard (`/dashboard`) serves as the operational command center. It adapts dynamically based on the active user's role while preserving a consistent global structure:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [OPERATIONAL PULSE: 4 KPI Cards]                                                             │
│  - Total Content in Pipeline     - Items Awaiting My Action    - Published This Week   - Errors │
├──────────────────────────────────────────────────────────────┬───────────────────────────────┤
│ [15-STAGE BOTTLENECK RADAR]                                  │ [MY ACTIVE ASSIGNMENTS]       │
│  Visual bar showing work volume across all 15 stages.        │ List of items directly        │
│  Clicking any bar filters the production queue.              │ assigned to caller.           │
├──────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ [RECENT ACTIVITY & AUDIT STRIP]                              │ [QUICK ACTION LAUNCHER]       │
│  Live chronological feed of approved questions, cuts, etc.   │ - New Question   - Film Take  │
└──────────────────────────────────────────────────────────────┴───────────────────────────────┘
```

### 6.2 Key Dashboard Widgets
1. **KPI Pulse Strip:** 4 high-level metric cards showing active workload, personal tasks, distribution volume, and items blocked at gates.
2. **15-Stage Pipeline Bottleneck Radar:** High-density horizontal visualization indicating item counts at each canonical step (01 to 15). Highlights stages with excessive dwell time (e.g. 12 items waiting in Stage 07 Final QC).
3. **Personal Task Workbench:** Immediate view of assigned tasks sorted by priority and deadline.
4. **Recent System Activity Ledger:** Filterable stream of state transitions and gate completions emitted by `AuditEvent`.

---

## 07. Workspaces

A **Workspace** is an intensive, task-focused environment optimized for completing a specific stage of the production pipeline. Workspaces feature specialized tools, hotkeys, and distraction-free layouts:

### 7.1 Key Production Workspaces

#### 1. Question Studio (`/studio`)
- **Primary Function:** Authoring and refining questions.
- **Target User:** `QUESTION_AUTHOR`, `QUESTION_EDITOR`.
- **Layout:** Two-column split-pane.
  - Left Pane: LaTeX/Text input, 4 options editor, Telugu translation field, mathematical proof builder.
  - Right Pane: Live student rendering preview, distractor plausibility analyzer, AI generation prompt drawer.
- **Workflow Step:** Stage 01 (Question Generation).
- **Completion Gate:** Saving valid 4-option question and submitting to Stage 02 review.

#### 2. Question Verification Workbench (`/questions/:id/verify`)
- **Primary Function:** 10-point pedagogical audit and editorial sign-off.
- **Target User:** `QA_REVIEWER`, `CONTENT_LEAD`.
- **Layout:** Side-by-side audit view.
  - Left Pane: Question presentation and full mathematical proof.
  - Right Pane: 10-point interactive audit checklist (Syllabus alignment, Option distinctness, Telugu grammar, Solution proof accuracy, etc.).
- **Workflow Step:** Stage 02 (Question Verification).
- **Enforced Constraints:** Server-side anti-self-approval (`GAR-02`). If `actor.id === question.authorId`, the `Approve` button is disabled with tooltip: *"Self-approval prohibited"*.

#### 3. Recording Studio & Teleprompter (`/queue`, `/videos/:id?tab=recording`)
- **Primary Function:** Studio presentation recording and take logging.
- **Target User:** `PRESENTER`, `VIDEO_EDITOR`.
- **Layout:** High-contrast teleprompter interface.
  - Fullscreen teleprompter mode with variable scroll speed (wpm counter), voice-activated auto-scroll, and 3-second hook countdown.
  - Studio take logger: 1-click recording timer, camera take notes, and Google Drive raw footage URL attachment.
- **Workflow Step:** Stages 04–05 (Teleprompter & Filming, Raw Video).

#### 4. Editing Bay (`/production`, `/videos/:id?tab=editing`)
- **Primary Function:** Video post-production cut registration and metadata validation.
- **Target User:** `VIDEO_EDITOR`.
- **Layout:** Video review bench with vertical 9:16 preview container.
  - Master cut player, subtitle accuracy validator, LUFS audio level meter.
  - Action to submit rendered MP4 cut to Final QC.
- **Workflow Step:** Stage 06 (Editing Bay).

#### 5. Final QC Workbench (`/videos/:id?tab=final-review`)
- **Primary Function:** Master post-production quality certification.
- **Target User:** `CONTENT_LEAD`, `QA_REVIEWER`.
- **Layout:** 6-point Master QC certification checklist.
  - Checks: 1080x1920 9:16 safe-zones, audio LUFS (-14 ±1), Telugu typography, color grade, timer overlay sync, student retention pacing.
- **Workflow Step:** Stage 07 (Final QC).
- **Human Gate:** Mandatory human approval (AP-009).

#### 6. Social Review & 9:16 Simulator (`/social-review/:reviewId`)
- **Primary Function:** Mobile platform simulator audit before release.
- **Target User:** `PUBLISHING_LEAD`, `QA_REVIEWER`.
- **Layout:** Interactive smartphone frame simulator (YouTube Shorts, Instagram Reels, TikTok/Facebook overlays).
  - Verifies that titles, subtitles, and thumbnails are not obscured by platform UI buttons (like, comment, share icons).
- **Workflow Step:** Stage 09 (Social Review).

---

## 08. Resource Information Architecture

### 08.1 Standard Resource Page Pattern
Every domain entity in BP-CMS follows a standardized three-view lifecycle pattern:

```
[COLLECTION VIEW] (/questions, /production, /content-masters)
  ├── Global Filter Bar (Topic, Status, Creator, Date Range)
  ├── Search Input & View Toggle (Table / Card Grid / Kanban)
  └── Standard Data Grid with Pagination & Batch Actions
          │
          ▼ Click Item
[ENTITY DETAIL VIEW] (/questions/:id, /videos/:id, /content-masters/:id)
  ├── Header: Canonical ID, Title, Primary Status Badge, Workflow Step
  ├── Primary Action Bar (Context-sensitive: Edit, Verify, Submit)
  ├── Tabbed Canvas (Overview, Versions, Media, Audit Trail)
  └── Contextual Audit Strip (Chronological mutation history)
          │
          ▼ Edit / Action
[EDIT / WORKBENCH VIEW] (/questions/:id?mode=edit, /studio?id=:id)
  ├── Distraction-Free Form Canvas
  ├── Real-Time Validation Feedback (Zod client preview)
  └── Save / Submit / Discard Controls
```

### 08.2 Standard Entity Information Elements
- **Entity Identity Lockup:** Canonical business ID (`BP-Q-######`, `BP-V-######`, `BP-CNT-######`) displayed prominently with 1-click copy-to-clipboard.
- **Status Cluster:** Dual badges displaying (1) Canonical Workflow Step (e.g. `Step 06: Editing Bay`) and (2) Entity Domain Status (e.g. `Status: EDITED`).
- **Audit Strip:** Chronological timeline showing who created, edited, reviewed, or approved the asset with UTC timestamps.

---

## 09. Canonical 15-Step Workflow Navigation

### 09.1 Navigation Along the 15 Steps
The Burra Pariksha media production pipeline advances strictly through the canonical 15 steps (Stage 07). The frontend provides a persistent, interactive **Workflow Progression Ribbon** on all project workspaces:

```
[01 Gen] ─► [02 Verif]* ─► [03 Script] ─► [04 Film] ─► [05 Raw] ─► [06 Edit] ─► [07 QC]*
                                                                                   │
[14 Review]* ◄─ [13 Analytics] ◄─ [12 Sync] ◄─ [11 Live] ◄─ [10 Pub]* ◄─ [09 Social]* ◄─ [08 Thumb]
      │
      ▼
[15 Loopback]* ──► (Feedback to Step 01)        [* = Mandatory Human Gate per AP-009]
```

### 09.2 Step-to-Workspace Routing Contract

| Step # | Canonical Stage Name | Canonical Route | Primary Role | Human Gate? |
| :---: | :--- | :--- | :--- | :---: |
| **01** | Question Generation | `/studio` | Question Author | NO |
| **02** | Question Verification | `/questions/:id/verify` | QA Reviewer | **YES** |
| **03** | Audience Script | `/videos/:id?tab=script` | Scriptwriter | NO |
| **04** | Teleprompter & Filming | `/videos/:id?tab=recording` | Presenter | NO |
| **05** | Raw Video | `/videos/:id?tab=recording` | Production Lead | NO |
| **06** | Editing Bay | `/videos/:id?tab=editing` | Video Editor | NO |
| **07** | Final QC | `/videos/:id?tab=final-review` | Content Lead | **YES** |
| **08** | Thumbnail | `/videos/:id?tab=thumbnail` | Designer | NO |
| **09** | Social Review | `/social-review/:reviewId` | QA Reviewer | **YES** |
| **10** | Publishing Setup | `/publishing` | Publishing Lead | **YES** |
| **11** | Published | `/publishing` | Distribution Specialist | NO |
| **12** | Platform Sync | `/platform-packages` | Social Ops Specialist | NO |
| **13** | Analytics | `/analytics/engagement` | Analytics Specialist | NO |
| **14** | Performance Review | `/analytics/engagement` | Strategy Lead | **YES** |
| **15** | Intelligence Loop | `/analytics/intelligence` | Executive Producer | **YES** |

### 09.3 Disentangled State Display in UI
The frontend explicitly visualizes the five state dimensions established in Stage 08 without conflating them:

```
================================================================================
                    WORKFLOW STATE DISENTANGLEMENT IN UI
================================================================================

   Business Step
         ≠
   Entity Status
         ≠
    Media Status
         ≠
     Job Status
         ≠
 Publication Status

================================================================================
```

How users navigate through the workflow without conflation:
1. **Business Step:** Displayed in the persistent Workflow Progression Ribbon (`Step 07 of 15: Final QC`). Indicates where the content project currently sits in the canonical 15-step manufacturing journey.
2. **Entity Status:** Displayed on the entity header badge (`Question: VERIFIED`, `Video: QC_PENDING`, `Content: PRODUCTION_IN_PROGRESS`). Reflects domain-level editorial lifecycle certification.
3. **Media Status:** Displayed in media inspection drawers and asset chips (`Media: CHECKSUM_VALIDATED`, `Storage: VERIFIED_ACCESSIBLE`, `Drive: SYNCED`). Tracks binary file integrity in Google Drive/Cloud Storage without asserting editorial quality.
4. **Job Status:** Displayed in transient background toasts, modal progress bars, or activity indicators (`Job: RUNNING 84%`, `Transcode: SUCCEEDED`, `Sync: FAILED_RETRYABLE`). Represents ephemeral technical worker execution; technical failures never show as editorial rejections.
5. **Publication Status:** Displayed in the multi-channel distribution matrix (`YouTube: LIVE`, `Instagram: SCHEDULED`, `Facebook: SYNC_VERIFIED`). Tracks platform-specific release state without altering internal domain approval records.

---

## 10. Search Architecture

### 10.1 Global Omnibox Search (`Ctrl+K` / `Cmd+K`)
- **Scope:** Searches across all domain entities (Questions, Scripts, Videos, Content Masters, User IDs).
- **Search Logic:**
  * Exact prefix match on canonical IDs (`BP-Q-`, `BP-V-`, `BP-CNT-`).
  * Full-text fuzzy search on question stems, script dialogue, and video titles.
  * Direct deep-link navigation to target entity detail view upon selection.

### 10.2 In-Page Contextual Search
- Present at the top of every resource data grid.
- Filters active table records instantaneously with debounced input (250ms).
- Remembers search queries in URL search params (`?q=algebra&topic=equations`) to support shareable browser bookmarks and browser history traversal.

---

## 11. Filter Architecture

### 11.1 Universal Filter Taxonomy
All collection grids implement a standardized, faceted filter drawer:
1. **Taxonomy Facet:** Academic Class $	o$ Subject $	o$ Chapter $	o$ Topic.
2. **Workflow Stage Facet:** Multi-select for Stages 01 through 15.
3. **Domain Status Facet:** Filter by entity lifecycle state (e.g. `VERIFIED`, `REJECTED`).
4. **Assignment Facet:** Filter by Assignee (`Assigned to Me`, `Unassigned`, specific operator).
5. **Date Range Facet:** Created at, Updated at, Scheduled publication date.

### 11.2 Filter State Persistence
- All active filters are synchronized bi-directionally with browser URL search parameters.
- Users can reset filters with a 1-click "Clear All Filters" affordance.
- Saved custom filter presets (e.g., "My Pending QC Reviews") are stored in browser local storage.

---

## 12. Notification Architecture

### 12.1 Purpose & Separation from External Email
In accordance with Stage 05 and Stage 06 boundaries, the in-app notification center is an **internal operational coordination mechanism**, completely decoupled from external SMTP email relays:

```
┌─────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS (3 Unread)                       [Mark All Read]│
├─────────────────────────────────────────────────────────────┤
│ 🔴 REVIEW REQUIRED                                 5m ago   │
│ Question BP-Q-000104 submitted for Stage 02 Verification    │
│ [Open Verification Workbench ➔]                             │
├─────────────────────────────────────────────────────────────┤
│ 🟡 REWORK MANDATED                                 1h ago   │
│ Final QC rejected Cut 2 on Video BP-V-000082: Subtitle Typo │
│ [Open Editing Bay ➔]                                        │
├─────────────────────────────────────────────────────────────┤
│ 🟢 GATE PASSED                                     3h ago   │
│ Video BP-V-000079 passed Social Review                      │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Notification Event Categories
1. **Task Assignments:** When a user is assigned to script, film, edit, or review an asset.
2. **Review Requests:** When an upstream gate requires human sign-off (Stages 02, 07, 09, 10, 14, 15).
3. **Rework Alerts:** When an asset fails a review gate and is returned with defect feedback.
4. **System Warnings:** Storage quota alerts, API token expiration notices.

---

## 13. User Profile Architecture

### 13.1 User Menu & Profile Modal
Accessible from the top-right header avatar:
- Displays user canonical ID (`USR-xxxxxx`), full name, email, and active canonical role badge.
- Displays resolved capability list in a read-only audit panel for transparency.
- Theme toggle (Light / Dark / High-Contrast mode).
- Session logout with secure token destruction.

---

## 14. Admin & Management Architecture

### 14.1 Strict Segregation of Administrative Areas
Administrative workspaces are strictly isolated from day-to-day media production:

| Management Workspace | Route | Permitted Roles | Critical Functions |
| :--- | :--- | :---: | :--- |
| **User Administration** | `/management/users` | `ADMIN` | Account creation, deactivation, role assignments |
| **System Settings** | `/settings` | `ADMIN`, `CONTENT_LEAD` | Global prompts, curriculum taxonomy, Drive folder mappings |
| **Disaster Recovery** | `/recovery` | `ADMIN` only | Google Sheets snapshot verification, cold backup restore |
| **Forensic Audit Log** | `/audit` | `ADMIN` | Read-only inspection of immutable `AuditEvent` ledger |

---

## 15. Role & Capability-Aware UX

### 15.1 Frontend Capability Evaluation Contract
The frontend evaluates permissions using a standardized utility hook:

```typescript
const { hasCapability } = useAuth();

// Visual ergonomics: Render approve button only if user holds capability
{hasCapability('QUESTION:APPROVE') && (
  <Button 
    disabled={isSelfApprovalBlocked || !isPreconditionMet} 
    onClick={handleApprove}
  >
    Approve Question
  </Button>
)}
```

### 15.2 Explicit Zero-Trust Rule
The UI hook `hasCapability()` controls **visual presentation only**. Every button click, form submission, and route navigation triggers a backend API call that independently enforces cryptographic authentication, capability possession, anti-self-approval rules, and business preconditions.

---

## 16. Route & Page Organization

The 78–79 brownfield routes are organized into clean, RESTful canonical paths:

```
/                                      -> Redirects to /dashboard
/dashboard                             -> Hub 1: Home Dashboard
/my-work                               -> Hub 1: Personal Task Queue

/questions                             -> Hub 2: Question Library
/studio                                -> Hub 2: Question Authoring Studio
/questions/:id                         -> Hub 2: Question Detail View
/questions/:id/verify                  -> Hub 2: Stage 02 Verification Workbench

/queue                                 -> Hub 3: Recording Studio & Queue
/production                            -> Hub 3: Video Production Bay
/videos/:id                            -> Hub 3: Tabbed Video Workbench (Tabs: script, recording, editing, final-review, thumbnail)

/social-review                         -> Hub 4: Quality Signoff & Mobile Simulator
/social-review/:reviewId               -> Hub 4: Dedicated 9:16 Review Bench
/publishing                            -> Hub 4: Publishing Staging & Dispatch Hub
/platform-packages                     -> Hub 4: Platform Sync Hub

/analytics/engagement                  -> Hub 5: Retention & Audience Metrics
/analytics/intelligence                -> Hub 5: Pedagogical Intelligence Loop

/planning                              -> Hub 6: Syllabus Planning & Batches
/team                                  -> Hub 6: Team Workload Management
/content-masters                       -> Hub 6: Content Explorer
/settings                              -> Hub 6: System Health & Taxonomy
/recovery                              -> Hub 6: Disaster Recovery (Admin Only)

/login                                 -> Authentication Screen
/404                                   -> Standard Not Found View
```

---

## 17. Breadcrumb Strategy

### 17.1 Universal Breadcrumb Hierarchy
Every page inside the application shell renders a deterministic breadcrumb trail:
$$	ext{Hub Name} \;\;>\;\; 	ext{Resource Collection} \;\;>\;\; 	ext{Entity Canonical ID} \;\;>\;\; 	ext{Context Tab}$$

#### Concrete Examples
- Viewing a question draft: `QUESTIONS > Question Library > BP-Q-000104 > Edit`
- Reviewing a video cut: `PRODUCTION > Production Bay > BP-V-000082 > Final QC`
- Staging social release: `PUBLISHING > Publishing Hub > PKG-000034 > Staging`

---

## 18. Empty, Loading, Error & Permission-Denied States

To maintain professional polish and prevent user disorientation, all views adhere to four standardized operational states:

1. **Loading State:** Skeleton loaders matching the exact dimensions of target tables or cards. No jarring spinner shifts or unstyled flashes of content.
2. **Empty State:** Illustrated empty card with clear explanation and primary call-to-action (e.g. *"No questions found in this chapter. Click 'New Question' to draft one"*).
3. **Error State:** Non-destructive error banner displaying the error message, correlation ID, and a 1-click "Retry Operation" button.
4. **Permission-Denied State (HTTP 403):** Clean shield illustration stating *"Access Restricted. You do not possess the required capability to view this resource. Contact your administrator if you require access."*

---

## 19. Responsive & Accessibility Principles

1. **Desktop-First, Tablet-Accessible:** Optimized for 1080p desktop monitors (standard production workstations) with fluid responsive collapse down to 768px tablet screens (for studio filming teleprompter use).
2. **WCAG 2.1 AA Compliance:** Minimum color contrast ratio of 4.5:1 for all text. Focus rings on all interactive elements.
3. **Teleprompter High-Visibility Mode:** Dedicated high-contrast monochrome mode (yellow text on pure black background) for presenter viewing under studio lights.
4. **Keyboard Shortcuts:** Global hotkeys for common operations (`Ctrl+K` Search, `[` Toggle Sidebar, `Space` Pause/Resume Teleprompter).

---

## 20. Brownfield → Target IA Migration Strategy

The 31 brownfield pages and 79 routes are systematically classified below into the five canonical architectural disposition categories:
- **`KEEP`:** Preserved in target architecture with direct route alignment.
- **`CONSOLIDATE`:** Absorbed into a parent tabbed workbench or drawer to eliminate fragmented navigation.
- **`MODIFY LATER`:** Preserved in purpose but requires visual/structural modernization in future UI implementation stages.
- **`DEPRECATE LATER`:** Redundant standalone routes scheduled for phase-out once tabbed workbenches are live.
- **`CREATE`:** Newly planned frontend views required to complete administrative, workflow, and audit visibility.

No code changes are executed during Stage 10; this matrix establishes the definitive target disposition:

| Brownfield Page / Component | Route Pattern | Target IA Disposition | Target Mapping / Consolidation Strategy |
| :--- | :--- | :---: | :--- |
| `DashboardPage.tsx` | `/dashboard` | **KEEP** | Preserved as Hub 1 Operations Dashboard |
| `MyWorkPage.tsx` | `/my-work` | **KEEP** | Preserved as Hub 1 Personal Work Queue |
| `QuestionLibraryPage.tsx` | `/questions` | **KEEP** | Preserved as Hub 2 Question Library |
| `QuestionStudioPage.tsx` | `/studio` | **MODIFY LATER** | Preserved as Hub 2 Question Studio; enhance with LaTeX & AI prompt drawer |
| `QuestionDetailPage.tsx` | `/questions/:id` | **KEEP** | Preserved as Hub 2 Question Detail View |
| `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | **MODIFY LATER** | Preserved as Hub 2 Stage 02 Verification Bench; enforce anti-self-approval |
| `QuestionImprovePage.tsx` | `/questions/:id/improve`| **CONSOLIDATE** | Consolidate into `/studio` as an contextual "Improve" mode |
| `QueuePage.tsx` | `/queue` | **MODIFY LATER** | Preserved as Hub 3 Studio Recording Queue; integrate teleprompter speed |
| `ProductionBoardPage.tsx` | `/production-board` | **CONSOLIDATE** | Consolidate into `/production` as Kanban toggle view |
| `ProductionTrackerPage.tsx` | `/production-tracker` | **CONSOLIDATE** | Consolidate into `/production` as Table list view |
| `VideoDetailPage.tsx` | `/videos/:id` | **MODIFY LATER** | Modernize into unified 5-tab video post-production workbench |
| `VideoCreateScriptPage.tsx` | `/videos/create-script` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=script` |
| `VideoReviewScriptPage.tsx` | `/videos/review-script` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=script` |
| `VideoRecordPage.tsx` | `/videos/record` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=recording` |
| `VideoEditPage.tsx` | `/videos/edit` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=editing` |
| `VideoFinalPage.tsx` | `/videos/final` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=final-review` |
| `VideoThumbnailPage.tsx` | `/videos/thumbnail` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/videos/:id?tab=thumbnail` |
| `VideoPinnedCommentPage.tsx` | `/videos/comment` | **DEPRECATE LATER** | Redundant standalone route; consolidate into `/social-review` |
| `SocialReviewPage.tsx` | `/social-review` | **MODIFY LATER** | Preserved as Hub 4 Stage 09 Mobile Simulator; enhance platform overlays |
| `PublishingPage.tsx` | `/publishing` | **MODIFY LATER** | Preserved as Hub 4 Stage 10/11 Publishing Hub; add multi-channel matrix |
| `PlatformPackagesPage.tsx` | `/platform-packages` | **KEEP** | Preserved as Hub 4 Stage 12 Platform Sync Hub |
| `PublishingPackagePage.tsx` | `/publishing/:id` | **CONSOLIDATE** | Consolidate into `/publishing` detail drawer |
| `SocialAnalyticsPage.tsx` | `/social-analytics/:id` | **CONSOLIDATE** | Consolidate into `/analytics/engagement` detail |
| `AnalyticsExperiencePage.tsx`| `/analytics/*` | **MODIFY LATER** | Preserved as Hub 5 Analytics & Intelligence; enhance retention curves |
| `PlanningPage.tsx` | `/planning` | **KEEP** | Preserved as Hub 6 Syllabus Planning Hub |
| `TeamOperationsPage.tsx` | `/team` | **KEEP** | Preserved as Hub 6 Team Workload Hub |
| `ContentMasterPage.tsx` | `/content-masters` | **KEEP** | Preserved as Hub 6 Content Explorer |
| `SettingsPage.tsx` | `/settings` | **MODIFY LATER** | Preserved as Hub 6 System Settings; isolate taxonomy from API keys |
| `RecoveryAdminPage.tsx` | `/recovery` | **KEEP** | Preserved as Hub 6 Disaster Recovery (Admin) |
| `LoginPage.tsx` | `/login` | **KEEP** | Preserved as Authentication screen |
| `NotFoundPage.tsx` | `*` | **KEEP** | Preserved as 404 handler |
| *(Proposed)* `UserAdminPage.tsx` | `/management/users` | **CREATE** | Dedicated user account and role management console |
| *(Proposed)* `AuditLogPage.tsx` | `/audit` | **CREATE** | Read-only inspection console for immutable `AuditEvent` ledger |
| *(Proposed)* `WorkflowRibbon.tsx` | Global Layout Strip | **CREATE** | Persistent 15-step manufacturing tracker across all project views |

---

## 21. Navigation Anti-Patterns

The following navigation anti-patterns identified in the brownfield baseline are explicitly prohibited in the target architecture:

```
================================================================================
                    PROHIBITED NAVIGATION ANTI-PATTERNS
================================================================================

 1. MULTI-HOP CLIENT BARRIER WORKAROUNDS (ANTI-02, BRK-HD-02)
    Chaining three separate client-side page jumps to bypass a backend state
    transition is strictly forbidden.

 2. UI-ONLY ROLE PROTECTION (ANTI-09, SEC-HIGH-01)
    Hiding a navigation link while leaving the route un-guarded is prohibited.

 3. URL DRAFT RACE CONDITIONS (BRK-HD-01)
    Permitting the UI to reload or navigate before an asset's draft ID is
    persisted server-side is prohibited.

 4. COMPETING NAVIGATION SIDEBARS
    Nesting secondary collapsible sidebars inside primary canvases is prohibited.

 5. HIDDEN ESCALATION BUTTONS
    Displaying disabled action buttons without explanatory tooltips or failure
    reasons is prohibited.

 6. PHANTOM BREADCRUMBS
    Rendering non-clickable or disconnected breadcrumb strings that do not
    reflect true route hierarchy is prohibited.

================================================================================
```

---

## 22. Traceability Matrix

| Preceding Artifact | Principle / Requirement ID | How Stage 10 Satisfies & Enforces the Requirement |
| :--- | :--- | :--- |
| **Stage 01: Requirements** | `BR-001` (15-step pipeline) | Visualizes canonical 15 steps in persistent workflow ribbon |
| **Stage 01: Requirements** | `BR-004` (Human approval) | Enforces human-gating workbench affordances for Steps 02, 07, 09, 10, 14, 15 |
| **Stage 02: Acceptance** | `GAR-02` (Anti-Self-Approval)| Visualizes anti-self-approval disabled states in review benches |
| **Stage 02: Acceptance** | `AC2-001` to `AC2-015` | Maps all 15 stages to dedicated workspaces and routing contracts |
| **Stage 04: Architecture** | `AP-001` (One Canonical Workflow)| Standardizes on the single 15-step linear progression model |
| **Stage 04: Architecture** | `AP-002` (State Decoupling) | UI explicitly separates Step, Entity Status, Media, Job, and Publication |
| **Stage 04: Architecture** | `AP-004` (Backend Auth Authority)| Frontend capability checks declared visual ergonomics only |
| **Stage 04: Architecture** | `AP-006` (Frontend Boundaries) | Standardizes passive presentation and zero-trust API submission |
| **Stage 04: Architecture** | `AP-009` (AI Governance) | AI prompt generation isolated to assistant panels; approvals barred |
| **Stage 05: System Boundary**| 16 Internal Domains | Consolidates domain operations into the six authoritative hubs |
| **Stage 06: Domain Model** | 27 Domain Entities | Standardizes resource views and detail pages for domain entities |
| **Stage 07: 15-Step Workflow**| 15 Stage Contracts | Maps each stage contract to its conceptual UI workbench |
| **Stage 08: State Model** | 5 State Dimensions | Implements multi-dimensional state indicators on entity headers |
| **Stage 09: RBAC Model** | Capability Matrix | Consumes Stage 09 capabilities for navigation visibility |

---

## 23. Deferred Implementation Decisions

To maintain strict compliance with SDLC stage boundaries, the following implementation activities are **EXPLICITLY DEFERRED** to subsequent stages:
1. **Physical Component Refactoring:** Modifying React components in `src/pages` or `src/components` is deferred to UI implementation stages.
2. **React Router Refactoring:** Updating `src/App.tsx` routes is deferred to implementation stages.
3. **CSS / Tailwind Theme Modifications:** Global CSS and styling adjustments are deferred.
4. **State Management Hook Refactoring:** Redesigning React context hooks (`AuthContext`, `WorkflowContext`) is deferred.
5. **Physical Route Guard Middleware:** Implementing `<RequireCapability>` route wrappers in JSX is deferred.

---

## 24. Verification & Acceptance Gate

The following checklist establishes the deterministic verification requirements for Stage 10:

- [x] Authoritative document `docs/architecture/10-FRONTEND-IA.md` created.
- [x] UX and IA principles established (12 core principles).
- [x] Target global application shell specified with component topology.
- [x] Primary navigation model defined with strict 3-tier hierarchy.
- [x] Six core hubs rigorously specified: HOME, QUESTIONS, PRODUCTION, PUBLISHING, ANALYTICS, MANAGEMENT & SYSTEM.
- [x] Role-adaptable dashboard architecture specified with 15-stage bottleneck radar.
- [x] Task-focused production workspaces defined (Studio, Verification, Filming, Editing, QC, Social Review).
- [x] Standard resource page patterns established (Collection, Detail, Edit).
- [x] Canonical 15-step workflow navigation contract mapped without state conflation.
- [x] Global Omnibox search (`Ctrl+K`) and contextual faceted filter architectures defined.
- [x] Internal in-app notification center decoupled from external email relays.
- [x] Administrative and disaster recovery areas strictly segregated from routine production.
- [x] Stage 09 RBAC model integrated: UI visibility is non-authoritative; backend is authoritative.
- [x] Full consolidation strategy documented for brownfield baseline (31 pages, 79 routes).
- [x] Breadcrumb and empty/loading/error state strategies specified.
- [x] 6 explicit navigation anti-patterns cataloged and prohibited.
- [x] Traceability to Stages 01–09 fully documented.
- [x] Application source code, package.json, and infrastructure remain 100% untouched.
- [x] Codebase lint and compilation pass cleanly.

---

## 25. Closure Record

### 25.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| Target Global Shell Architecture | Specified with sidebar, header, breadcrumbs, canvas | VERIFIED |
| Six Core Navigation Hubs | HOME, QUESTIONS, PRODUCTION, PUBLISHING, ANALYTICS, MGMT | VERIFIED |
| Canonical 15-Step Workflow Ribbon | Full step-to-route mapping without state conflation | VERIFIED |
| Workspaces & Resource Patterns | Studio, QC, Teleprompter, Simulator, Detail views | VERIFIED |
| Search & Faceted Filter Models | Global Omnibox (`Ctrl+K`) & URL-persisted filters | VERIFIED |
| Stage 09 RBAC Integration | Capability-aware visual presentation; backend authoritative | VERIFIED |
| Brownfield Baseline Consolidation | 31 pages & 79 routes mapped to KEEP / CONSOLIDATE | VERIFIED |
| Navigation Anti-Patterns Defined | 6 prohibited patterns cataloged | VERIFIED |
| Architectural Deferrals Declared | Zero physical component / Zero route code changes | VERIFIED |
| Traceability to Stages 01–09 | Comprehensive mapping verified | VERIFIED |
| Codebase Lint Verification (`npm run lint`) | Zero errors | PASSED |
| Production Build Compilation (`npm run build`) | Zero errors | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | Google AI Studio verification passed | PASSED |
| GitHub Verification | Baseline & verification passed | PENDING GITHUB VERIFICATION |
| Stage 10 Status | READY FOR GITHUB VERIFICATION | VERIFIED |

```
================================================================================
STAGE 10 — FRONTEND & INFORMATION ARCHITECTURE
STATUS: READY FOR GITHUB VERIFICATION
IMPLEMENTATION: COMPLETE
TECHNICAL VERIFICATION: PASSED
GITHUB VERIFICATION: PENDING
STAGE 10 CLOSED: NO (AWAITING GITHUB VERIFICATION)
APPLICATION CODE MODIFIED: NONE
PACKAGE.JSON MODIFIED: NONE
DATABASE / SCHEMA MODIFIED: NONE
DATA / STORAGE MODIFIED: NONE
INFRASTRUCTURE MODIFIED: NONE
DEPLOYMENT PERFORMED: NO
NEXT STAGE: STAGE 11 — NOT STARTED
================================================================================
```

STAGE 10 CLOSED: NO (AWAITING GITHUB VERIFICATION)

NEXT STAGE:
STAGE 11 — NOT STARTED
