# 10 — FRONTEND & INFORMATION ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 10 of 30-Stage Modernization Program — Authoritative Frontend Information Architecture

```
================================================================================
Document ID:       BP-ARCH-10-FE-IA
Version:           10.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL CONTRACT
Scope:             Frontend Information Architecture, Global Shell, & Workspaces
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
Downstream Stages: 11-PAGE-ROUTE-CONTRACT.md
                   12-DATA-ARCHITECTURE.md
                   13-API-CONTRACT.md
                   18-FRONTEND-SHELL-IMPLEMENTATION.md
                   19+ Workflow Workspace Implementation
Target Paradigm:   Work-Oriented, Capability-Aware, Single-Shell Information Architecture
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document defines the authoritative **Frontend Information Architecture (IA)** and User Experience (UX) specification for the Burra Pariksha Content Management System (BP-CMS). It replaces the brownfield sprawl—characterized by 31 heterogeneous React pages, 6 orphaned video pages, competing navigation sidebars, and duplicated workflow progress headers—with **one unified, work-oriented frontend architecture**.

### 1.2 Anti-Overclaim Invariants
1. **Specification Only:** This document formalizes the *information architecture*, component hierarchies, navigation ownership rules, and workspace models. It does **not** assert that frontend React components have been rewritten, deleted, or deployed at runtime.
2. **Zero Runtime Source Code Alteration:** No JSX/TSX files in `src/`, route definitions in `src/App.tsx`, or CSS stylesheets are created, deleted, or edited during Stage 10.
3. **No Route Finalization:** Conceptual page paths defined herein represent architectural relationships. Formal route strings, query parameter schemas, and dynamic regex patterns are strictly deferred to **Stage 11 (Page & Route Contract)**.

---

## 2. Core UX Principles

BP-CMS is an **operational production environment**, not a generic administrative CRUD portal or abstract dashboard. The user experience is governed by four foundational principles:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                               CORE FRONTEND UX PRINCIPLES                              │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ 1. Work-First Paradigm  │ The primary navigation question is: "What work do I need to  │
 │                         │ do?", NOT "Which technical subsystem do I need to open?"     │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 2. Single Navigation    │ ONE Purpose ──► ONE Navigation Mechanism. Elimination of     │
 │    Ownership            │ competing sidebars, redundant tabs, and duplicate headers.   │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 3. Contextual Workflow  │ The canonical 15-step workflow is rendered contextually      │
 │    Visibility           │ inside active resources, NOT as a competing global sidebar.  │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 4. Capability-Aware UX  │ UI visibility is a graceful presentation projection of       │
 │    (Zero-Trust Security)│ Stage 09 capabilities; the server remains authoritative.     │
 └─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 3. Global Application Shell Architecture

BP-CMS enforces a single, persistent **Global Application Shell** that maintains spatial continuity while users transition across business hubs.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                 GLOBAL APPLICATION SHELL                               │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ [Logo: BP-CMS] │ Global Search [Ctrl+K] │ Notifications [3] │ User Menu (USR-001) [▼]  │
 ├──────────────┬─┴───────────────────────────────────────────────────────────────────────┤
 │ PRIMARY HUB  │ BREADCRUMBS: Production > Content > BP-CNT-000104 > Editing Bay          │
 │ SIDEBAR      ├─────────────────────────────────────────────────────────────────────────┤
 │              │ WORKSPACE / RESOURCE REGION                                             │
 │ • HOME       │ ┌─────────────────────────────────────────────────────────────────────┐ │
 │ • QUESTIONS  │ │ RESOURCE HEADER: BP-CNT-000104 | Stage 06: Editing Bay | [Pass QC]  │ │
 │ • PRODUCTION │ ├─────────────────────────────────────────────────────────────────────┤ │
 │ • PUBLISHING │ │ CONTEXTUAL WORKFLOW STEPPER (Steps 01 ──► 06 ──► 15)                │ │
 │ • ANALYTICS  │ ├─────────────────────────────────────────────────────────────────────┤ │
 │ • MANAGEMENT │ │ ACTIVE WORKBENCH CONTENT (Player, Subtitles, Waveform, Actions)     │ │
 │              │ └─────────────────────────────────────────────────────────────────────┘ │
 └──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Structural Shell Regions
1. **Top Application Bar:**
   - Brand Identity (`Burra Pariksha CMS`).
   - Omnipresent Global Search Box (`Ctrl+K` shortcut).
   - Real-Time Notification Bell with unread badge counter.
   - User Profile Menu with active role badges and logout control.
2. **Primary Navigation Sidebar (Left):**
   - Collapsible icon-and-label dock presenting the **6 Authoritative Hubs**.
   - Bottom dock: System Health indicator and collapse toggle.
3. **Contextual Utility Header (Top-Main):**
   - Hierarchical Breadcrumbs reflecting true IA depth.
   - Primary page-level action bar.
4. **Primary Viewport Region:**
   - Dedicated scrollable region hosting Workspaces or Resource Detail views.

---

## 4. The Six Primary Business Hubs

All frontend capabilities are organized under **six canonical business hubs**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                               THE SIX CANONICAL BUSINESS HUBS                          │
 ├───────────────────┬────────────────────────────────────────────────────────────────────┤
 │ Hub Identifier    │ Business Scope & Operational Focus                                 │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ 1. HOME           │ Daily operations pulse, personalized "My Work" queue, and alerts.  │
 │ 2. QUESTIONS      │ Curriculum question bank, AI studio authoring, and verification.   │
 │ 3. PRODUCTION     │ Studio recording queue, filming teleprompter, editing, and QC.     │
 │ 4. PUBLISHING     │ 9:16 safe-zone signoff, release scheduling, and live platform sync.│
 │ 5. ANALYTICS      │ Audience retention drop-off analysis and pedagogical intelligence. │
 │ 6. MANAGEMENT     │ Curriculum sprint planning, team assignments, settings, and audit. │
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 5. Hub 1: Home Experience & "My Work"

The Home hub serves as the operational command center answering: *"What requires my attention right now?"*

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   HOME / DASHBOARD LAYOUT                              │
 ├───────────────────────────────────────────────────┬────────────────────────────────────┤
 │ 1. "My Work" Active Task Queue                    │ 2. Attention & Blockers Banner     │
 │    • Tasks assigned to current actor              │    • Rejections needing revisions  │
 │    • Gated reviews awaiting my signature          │    • Overdue recording sessions    │
 │    • Direct "Resume Work" action buttons          │    • Storage or upload warnings    │
 ├───────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 3. Pipeline Velocity Pulse                        │ 4. Recent Production Activity      │
 │    • Active items across 15 stages (Mini-board)   │    • Real-time audit activity feed │
 │    • Ready to Publish vs. Published counts        │    • System announcements          │
 └───────────────────────────────────────────────────┴────────────────────────────────────┘
```

### 5.1 My Work Architectural Integration (Decision: First-Class Workspace)
- **Primary Operational Landing:** For individual contributors (Authors, Editors, Presenters), the default landing view is **My Work**, filtering the universe of content down to items where `assignedUserId === currentUser.id` or reviews where `GAR-02` permits action.
- **Queue Grouping:** Tasks group into:
  1. `ACTION_REQUIRED` (Revisions requested on my submissions).
  2. `IN_PROGRESS` (Active claimed editing/filming tasks).
  3. `PENDING_REVIEW` (Assigned verification or QC signoffs).

---

## 6. Hub 2: Questions Hub

Governs **Stages 01 and 02** of the canonical workflow.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                  QUESTIONS HUB TOPOLOGY                                │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Workspace / View              │ Business Responsibility & Scope                        │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Question Library (List)       │ Search, filter, and paginate syllabus question bank.   │
 │ Question Studio (Workspace)   │ Stage 01 authoring with Gemini AI drafting assistant.  │
 │ Question Verification (Review)│ Stage 02 10-point pedagogical audit and proof signoff. │
 │ Question Detail (Resource)    │ Inspect historical versions, proofs, and linked video. │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 7. Hub 3: Production Hub

Governs studio and video execution spanning **Stages 03, 04, 05, 06, and 07**.

### 7.1 Consolidation of Orphaned Video Pages
Stage 03 audit identified 6 dead/orphaned pages (`VideoEditPage`, `VideoFinalPage`, etc.). In this architecture, all video operations are unified inside the **Production Board Workspace** and the tabbed **Video Detail Resource Workbench**:

```text
  Production Board (List / Pipeline Queue)
         │
         ▼
  Video Detail Resource Workbench (Consolidated)
         ├── Tab 1: Script & Hook (Stage 03)
         ├── Tab 2: Teleprompter & Recording (Stages 04 & 05)
         ├── Tab 3: Editing Bay (Stage 06)
         ├── Tab 4: Final QC Certification (Stage 07)
         └── Tab 5: Thumbnail Artwork Studio (Stage 08)
```

---

## 8. Hub 4: Publishing Hub

Governs **Stages 08, 09, 10, 11, and 12**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                  PUBLISHING HUB TOPOLOGY                               │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Workspace / View              │ Business Responsibility & Scope                        │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Social Review Studio (Review) │ Stage 09 9:16 smartphone simulator & safe-zone audit.  │
 │ Publishing Manager (Console)  │ Stage 10 multi-channel release scheduling matrix.      │
 │ Live Broadcast Monitor        │ Stage 11 real-time API upload execution & regex check. │
 │ Platform Sync Console         │ Stage 12 cross-platform metadata reconciliation.       │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 9. Hub 5: Analytics Hub

Governs **Stages 13, 14, and 15**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   ANALYTICS HUB TOPOLOGY                               │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Workspace / View              │ Business Responsibility & Scope                        │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Telemetry Overview (Dashboard)│ Aggregated 24h/7d views, watch time, and completion %.  │
 │ Social Analytics (Stage 13)   │ Content-level retention drop-off graphs and comments.  │
 │ Performance Review (Stage 14) │ Synchronized retention-script diagnostic workbench.    │
 │ Intelligence Loop (Stage 15)  │ Curriculum directive synthesis board (feeds Step 01).  │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 10. Hub 6: Management & System Hub

Governs governance, sprint planning, and administrative operations:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                  MANAGEMENT HUB TOPOLOGY                               │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Workspace / View              │ Business Responsibility & Scope                        │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Planning & Batches            │ Curriculum topic taxonomy and sprint batch creation.   │
 │ Team Operations               │ Workload distribution, capacity, and task assignments. │
 │ Content Explorer              │ Master lifecycle tracking of `Content` aggregate roots.│
 │ System Configuration          │ Google Drive roots, platform API keys, and settings.   │
 │ Audit & Recovery (Admin Only) │ Immutable audit log viewer and Coldline backup tools.  │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 11. Resource Page Model vs. Workspace Model

To eliminate page proliferation, the IA enforces a strict structural distinction between **Workspaces** and **Resource Pages**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      WORKSPACE VS. RESOURCE DETAIL DISTINCTION                         │
 ├───────────────────────────────────────┬────────────────────────────────────────────────┤
 │ WORKSPACE (Operational Bay)           │ RESOURCE DETAIL (Entity Record)                │
 ├───────────────────────────────────────┼────────────────────────────────────────────────┤
 │ • A place to DO a category of work    │ • A place to INSPECT a single business object  │
 │ • Filterable queue / multi-item board │ • Deep inspector of fields and attachments     │
 │ • Highly specialized toolsets         │ • Standardized 5-section layout                │
 │ • Example: Question Studio, Prompter  │ • Example: Question Detail, Content Master     │
 └───────────────────────────────────────┴────────────────────────────────────────────────┘
```

### 11.1 Standard Resource Page Layout (The 5 Sections)
Every Resource Detail page consists of:
1. **Header Block:** Resource Identifier (`BP-CNT-######`), Title, Status Badge, Assignee Avatar, and Primary Action Button.
2. **Contextual Workflow Strip:** Visual position across canonical Stages 01–15.
3. **Core Information Panel:** Domain payload (e.g., question text, script dialogue, video player).
4. **Historical Activity & Audit Trail:** Append-only timeline of review decisions, edits, and transitions.
5. **Connected Resources Drawer:** Collapsible links to parent `Content`, child `MediaAsset`, `Publication` URLs, and analytics snapshots.

---

## 12. Contextual Workflow Progress UI

BP-CMS rejects the anti-pattern of rendering a permanent, competing 15-item navigation sidebar. Instead, workflow progression is rendered **contextually inside active resources**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                       CANONICAL WORKFLOW STEPPER COMPONENT                             │
 └────────────────────────────────────────────────────────────────────────────────────────┘
   [01] ──► [02] ──► [03] ──► [04] ──► [05] ──► [06*] ──► [07] ──► ... ──► [15]
   Done     Done     Done     Done     Done     CURRENT   Next              Upcoming
                                                (Editing) (Final QC)
```

### 12.1 Visual State Semantics
- **Completed Step (Green Check):** Passed prerequisite gates; historical transition logged.
- **Current Active Step (Blue Pulsing Pill):** Current stage of `WorkflowInstance`. Clicking focuses the active tab/action.
- **Blocked Step (Red Alert Pill):** `stageStatus == BLOCKED` (e.g., hardware fault or missing asset).
- **Upcoming Step (Muted Grey Circle):** Inactive future stage; clicking disabled.
- **Revision Return Arrow (Yellow Loop):** Highlights when work was returned from review (e.g., Step 07 → Step 06).

---

## 13. Single Navigation Ownership Hierarchy

To prevent duplicate navigation paths, every navigational element is assigned **strictly one architectural owner**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             NAVIGATION OWNERSHIP MATRIX                                │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ Navigation Element      │ Sole Architectural Responsibility & Boundary                 │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ Primary Sidebar         │ Switches macro Business Hubs (Home, Questions, Production...)│
 │ Hub Navigation Strip    │ Switches primary Workspaces within a Hub (Queue vs Pipeline) │
 │ Breadcrumbs             │ Displays hierarchical location; provides one-level-up exit.  │
 │ Resource Tabs           │ Switches operational views inside an entity (Script, Edit...)│
 │ Workflow Stepper        │ Visualizes business stage progress; triggers stage advance.  │
 ├─────────────────────────┴──────────────────────────────────────────────────────────────┤
 │ INVARIANT: No two navigation mechanisms may ever represent the same hierarchy level.   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Global Omnipresent Search Architecture

The global search experience (`Ctrl+K`) operates across all business domain entities:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                            GLOBAL SEARCH MODAL ([Ctrl+K])                              │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ [🔍 Search by keyword, ID (BP-Q-...), topic, or presenter...                         ] │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ QUICK FILTERS: [All] [Questions] [Videos] [Publishing] [Users]                         │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ RESULTS:                                                                               │
 │ • Questions: "Time & Work Speed Trick" (BP-Q-000104) ── [Stage 02: Verification]       │
 │ • Videos:    "Quadratic Shortcuts" (BP-V-000088) ────── [Stage 06: Editing Bay]        │
 │ • Published: "Trigonometry Ratio Intro" ─────────────── [YouTube Live ↗]               │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 14.1 Search Capabilities
- **Direct ID Jump:** Typing a canonical ID (e.g., `BP-Q-000104` or `BP-CNT-000042`) navigates directly to the resource workbench.
- **Capability Filtering:** Results are filtered on the server; actors never see results for resources they lack `*.VIEW` capability to access.

---

## 15. Contextual Filtering Architecture

Filtering controls are partitioned into three distinct tiers:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                               THREE-TIER FILTERING MODEL                               │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ Filter Tier             │ Scope & UI Location                                          │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ Global Search Filter    │ Scope selector inside Omnisearch modal (Entity type toggles).│
 │ Workspace List Filter   │ Top toolbar of workspace queues (Stage, Assignee, Date range)│
 │ Resource Drawer Filter  │ In-page sub-filters (e.g., Take filter: "Golden Takes only").│
 └─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 16. Notification Center Architecture

The global notification drawer separates actionable tasks from informational updates:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              NOTIFICATIONS CENTER DRAWER                               │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ [Tabs: Action Required (2) | Informational (5)]                                        │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ ACTION REQUIRED:                                                                       │
 │ 🔴 Stage 02 Revisions: "SME requested distractor adjustment on BP-Q-000104" [Fix Now]  │
 │ 🔴 Final QC Assigned: "Master cut for BP-V-000092 ready for review" [Review Now]       │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ INFORMATIONAL:                                                                         │
 │ 🟢 Video Published: "YouTube upload confirmed live: BP-CNT-000081" [View Analytics]    │
 │ 🔵 Coldline Archive: "Asset BP-CNT-000040 successfully tiered to cold storage"         │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. User Profile & Administrative Workspace

### 17.1 User Profile Experience
- Displays user identity (`name`, `email`, avatar).
- Lists assigned operational roles with descriptive badges.
- Displays active session information and a direct "Log Out" action that clears `bp_session` cookies.

### 17.2 Administrative Area (`/admin`)
- Strictly gated to actors possessing `CONFIGURATION:ADMINISTER` or `USER:ADMINISTER`.
- Completely hidden from navigation for non-administrative users.
- Sections:
  1. `User Directory`: Manage active status, session invalidation, and role grants.
  2. `System Configuration`: Google Drive folder binding and platform API credentials.
  3. `Audit Explorer`: Forensic log viewer querying immutable `AuditEvent` records.
  4. `Disaster Recovery`: Snapshot export and rollback verification tools.

---

## 18. Capability-Aware UI State & UX Projection

In alignment with Stage 09 RBAC:
1. **Dynamic Button Rendering:** Action buttons evaluate the actor's capabilities:
   - If user has capability and business conditions pass: **Render Active Button**.
   - If user has capability but business conditions fail: **Render Disabled Button with Tooltip** (e.g., *"Cannot approve QC: Video cut not submitted"*).
   - If user lacks capability entirely: **Omit Button from UI** (or show read-only status badge).
2. **Anti-Self-Approval Tooltip:** If an SME authored the question, the "Certify & Approve" button is disabled with the explicit explanation: *"Anti-Self-Approval Policy (GAR-02): Another SME must verify your submission."*

---

## 19. Status Presentation Strategy

To prevent confusing users with 6 independent state dimensions, the frontend utilizes a **Canonical Business Status Presentation Model**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      CANONICAL STATUS PRESENTATION STRATEGY                            │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Underlying Multi-State Model  │ User-Facing Presentation Badge                         │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Stage 01 + DRAFT              │ 🟡 Draft Authoring (In Progress)                       │
 │ Stage 02 + PENDING_REVIEW     │ 🟣 Verification (Awaiting SME Signoff)                 │
 │ Stage 02 + CHANGES_REQUESTED  │ 🔴 Revisions Requested (Needs SME Fixes)               │
 │ Stage 04 + RECORDING          │ 🎥 Studio Recording (Session Active)                   │
 │ Stage 06 + IN_PROGRESS        │ ✂️ Editing Bay (Master Cut in Assembly)                │
 │ Stage 07 + PENDING_REVIEW     │ 🛡️ Final QC (Pending Master Certification)             │
 │ Stage 08 + APPROVED           │ 🖼️ Thumbnail (Artwork Approved)                        │
 │ Stage 10 + SCHEDULED          │ 📅 Publishing (Scheduled for [Timestamp])              │
 │ Stage 11 + LIVE               │ 🟢 Published (Live on Social Platforms)                │
 │ Stage 13 + INGESTING          │ 📊 Analytics (Awaiting 24h Telemetry Ingestion)        │
 │ Stage 15 + COMPLETED          │ 🏁 Production Completed (Cycle Archived)               │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 20. Standardized Error, Empty, and Loading States

Every workspace component implements standard presentation templates:

```text
 ┌───────────────────┬────────────────────────────────────────────────────────────────────┐
 │ UI State          │ Visual Representation & Interaction Contract                       │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ LOADING           │ Skeleton layout placeholders matching actual card/table dimensions.│
 │ EMPTY             │ Informative visual illustration + contextual "Create First" button.│
 │ NO RESULTS        │ "No matching items" message + "Clear Filters" button.              │
 │ ERROR (500)       │ Friendly error message + "Retry Request" button (Zero stack traces)│
 │ FORBIDDEN (403)   │ "Access Denied: Requires [CAPABILITY]" + link back to My Work.     │
 │ STALE DATA (409)  │ OCC conflict banner: "Content updated by another user. [Refresh]"  │
 │ OFFLINE / TIMEOUT │ Non-blocking toast: "Storage temporarily unavailable. Retrying..." │
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 21. Responsive & Device Interaction Model

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             DEVICE INTERACTION CAPABILITY                              │
 ├───────────────────┬────────────────────────────────────────────────────────────────────┤
 │ Form Factor       │ Targeted Workspaces & Optimizations                                │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Desktop (Primary) │ Full Editing Bay, Multi-track Audio, 9:16 Simulator, Teleprompter. │
 │ Tablet / iPad     │ Question Verification, Final QC playback, Teleprompter scroll view.│
 │ Mobile (Reviewer) │ "My Work" task approvals, notification center, analytics reading.  │
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 22. Accessibility Architecture

1. **Semantic HTML Landmarks:** Every shell section uses semantic tags (`<header>`, `<nav>`, `<aside>`, `<main>`, `<footer>`).
2. **Keyboard Focus & Navigation:** Full `Tab` navigation across all controls with high-visibility focus rings. Global search invoked via `Ctrl+K` / `Cmd+K`.
3. **Non-Color-Only Indicators:** Status badges always combine color with an explicit textual label and icon.
4. **ARIA Standards:** Dynamic alerts (toasts, live telemetry) declare `aria-live="polite"`. Modals trap keyboard focus and dismiss on `Esc`.

---

## 23. Legacy Frontend Mapping & Consolidation Plan

Detailed disposition of all 31 existing React pages in `src/pages/`:

| Current React Page File | Hub Target | Strategic Action | Detailed Migration / Consolidation Action |
| :--- | :--- | :---: | :--- |
| `DashboardPage.tsx` | HOME | **KEEP & REFINE** | Align with Home Operations pulse layout. |
| `MyWorkPage.tsx` | HOME | **KEEP** | First-class personal assignment queue. |
| `QuestionLibraryPage.tsx` | QUESTIONS | **KEEP** | Standard question bank list view. |
| `QuestionStudioPage.tsx` | QUESTIONS | **KEEP** | Stage 01 AI authoring workspace. |
| `QuestionVerifyApprovePage.tsx` | QUESTIONS | **KEEP** | Stage 02 pedagogical audit view. |
| `QuestionDetailPage.tsx` | QUESTIONS | **KEEP** | 5-section Question Resource view. |
| `QuestionImprovePage.tsx` | QUESTIONS | **MERGE** | Merge AI revision tools directly into `QuestionStudioPage`. |
| `PlanningPage.tsx` | MANAGEMENT | **KEEP** | Syllabus sprint batching and planning. |
| `QueuePage.tsx` | PRODUCTION | **KEEP** | Stage 04/05 studio recording queue. |
| `ProductionBoardPage.tsx` | PRODUCTION | **KEEP** | Macro pipeline Kanban board. |
| `ProductionTrackerPage.tsx` | PRODUCTION | **CONSOLIDATE**| Unify with `ProductionBoardPage`. |
| `VideoDetailPage.tsx` | PRODUCTION | **CORE MASTER**| Authoritative tabbed workbench (supersedes 6 legacy pages). |
| `VideoCreateScriptPage.tsx`| PRODUCTION | **MERGE** | Merge into `VideoDetailPage` (Tab 1: Script). |
| `VideoReviewScriptPage.tsx`| PRODUCTION | **RETIRE** | Orphaned; fully covered by `VideoDetailPage?tab=script`. |
| `VideoRecordPage.tsx` | PRODUCTION | **RETIRE** | Orphaned; fully covered by `VideoDetailPage?tab=recording`. |
| `VideoEditPage.tsx` | PRODUCTION | **RETIRE** | Orphaned; fully covered by `VideoDetailPage?tab=editing`. |
| `VideoFinalPage.tsx` | PRODUCTION | **RETIRE** | Orphaned; fully covered by `VideoDetailPage?tab=final-review`.|
| `VideoThumbnailPage.tsx` | PRODUCTION | **RETIRE** | Orphaned; fully covered by `VideoDetailPage?tab=thumbnail`. |
| `VideoPinnedCommentPage.tsx`| PRODUCTION | **RETIRE** | Orphaned; fully covered by `SocialReviewPage`. |
| `SocialReviewPage.tsx` | PUBLISHING | **KEEP** | Stage 09 9:16 simulator review bay. |
| `PublishingPage.tsx` | PUBLISHING | **KEEP** | Stage 10 & 11 scheduling and live monitor. |
| `PublishingPackagePage.tsx` | PUBLISHING | **CONSOLIDATE**| Unify into `PublishingPage`. |
| `PlatformPackagesPage.tsx` | PUBLISHING | **KEEP** | Stage 12 cross-platform sync console. |
| `SocialAnalyticsPage.tsx` | ANALYTICS | **KEEP** | Stage 13 content-level retention drop-off bay. |
| `AnalyticsExperiencePage.tsx`| ANALYTICS | **KEEP** | Stage 14 & 15 performance & intelligence console. |
| `ContentMasterPage.tsx` | MANAGEMENT | **KEEP** | Permanent Content aggregate root explorer. |
| `TeamOperationsPage.tsx` | MANAGEMENT | **KEEP** | Workload distribution and user tasks. |
| `SettingsPage.tsx` | MANAGEMENT | **KEEP** | System configuration and taxonomy settings. |
| `RecoveryAdminPage.tsx` | MANAGEMENT | **KEEP** | Admin disaster recovery and audit logs. |
| `LoginPage.tsx` | AUTH | **KEEP** | Dedicated standalone authentication entry. |
| `NotFoundPage.tsx` | SYSTEM | **KEEP** | 404 Route fallback. |

---

## 24. Canonical Page Inventory

The target frontend architecture stabilizes on **18 Canonical Production Workspaces/Pages** (down from 31 unmanaged files):

| Page ID | Hub | Canonical Workspace Name | Type | Primary Purpose | Required Capability |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **P-01** | HOME | Operations Overview | Dashboard | Daily pulse, alerts, pipeline metrics | `VIEW_HOME` |
| **P-02** | HOME | My Work Queue | Queue | Personal tasks, rejections, reviews | `VIEW_MY_WORK` |
| **P-03** | QUESTIONS | Question Library | List | Filterable repository of syllabus questions | `QUESTION:VIEW` |
| **P-04** | QUESTIONS | Question Studio | Workspace | Stage 01 question drafting with AI | `QUESTION:CREATE` |
| **P-05** | QUESTIONS | Question Verification | Review Bay | Stage 02 10-point pedagogical audit | `QUESTION_REVIEW:VERIFY` |
| **P-06** | QUESTIONS | Question Detail | Resource | Full question history, versions, proof | `QUESTION:VIEW` |
| **P-07** | PRODUCTION| Recording Queue | Queue | Stage 04 presenter filming call sheet | `VIDEO:RECORD` |
| **P-08** | PRODUCTION| Production Pipeline | Board | Kanban visualization of active video stages | `VIDEO:VIEW` |
| **P-09** | PRODUCTION| Video Production Workbench| Tabbed Bay | Consolidated Stages 03–08 execution | `VIDEO:VIEW` |
| **P-10** | PUBLISHING | Social Review Studio | Review Bay | Stage 09 9:16 safe-zone simulator audit | `SOCIAL_REVIEW:VIEW` |
| **P-11** | PUBLISHING | Publishing Manager | Console | Stages 10 & 11 release scheduling & live | `PUBLISHING_PACKAGE:VIEW` |
| **P-12** | PUBLISHING | Platform Sync Console | Console | Stage 12 cross-platform sync & verify | `PUBLICATION:SYNC` |
| **P-13** | ANALYTICS | Analytics Dashboard | Dashboard | High-level audience reach and watch time | `ANALYTICS_SNAPSHOT:VIEW`|
| **P-14** | ANALYTICS | Social Retention Bay | Diagnostic | Stage 13 second-by-second drop-off curve | `ANALYTICS_SNAPSHOT:VIEW`|
| **P-15** | ANALYTICS | Performance Intelligence | Strategy | Stages 14 & 15 pedagogical directives | `INTELLIGENCE_INSIGHT:VIEW`|
| **P-16** | MANAGEMENT| Planning & Batches | Workspace | Syllabus sprint planning & coverage radar | `VIEW_PLANNING` |
| **P-17** | MANAGEMENT| Team Operations | Workspace | Workload distribution & task assignment | `VIEW_TEAM` |
| **P-18** | MANAGEMENT| System Administration | Admin Bay | Gated user admin, recovery, and audit | `CONFIGURATION:ADMINISTER`|

---

## 25. Core Architectural Matrices

### 25.1 Navigation Matrix
| Navigation Label | Target Hub | Destination Page | Capability Visibility Gate |
| :--- | :--- | :--- | :--- |
| **Overview** | HOME | `P-01 Operations Overview` | `VIEW_HOME` |
| **My Work** | HOME | `P-02 My Work Queue` | `VIEW_MY_WORK` |
| **Question Library** | QUESTIONS | `P-03 Question Library` | `QUESTION:VIEW` |
| **Question Studio** | QUESTIONS | `P-04 Question Studio` | `QUESTION:CREATE` |
| **Recording Queue** | PRODUCTION | `P-07 Recording Queue` | `VIDEO:RECORD` |
| **Production Board** | PRODUCTION | `P-08 Production Pipeline`| `VIDEO:VIEW` |
| **Quality Signoff** | PUBLISHING | `P-10 Social Review Studio` | `SOCIAL_REVIEW:VIEW` |
| **Publishing Manager**| PUBLISHING | `P-11 Publishing Manager` | `PUBLISHING_PACKAGE:VIEW` |
| **Platform Sync** | PUBLISHING | `P-12 Platform Sync Console`| `PUBLICATION:SYNC` |
| **Analytics Hub** | ANALYTICS | `P-13 Analytics Dashboard` | `ANALYTICS_SNAPSHOT:VIEW` |
| **Performance Bay** | ANALYTICS | `P-14 Social Retention Bay` | `ANALYTICS_SNAPSHOT:VIEW` |
| **Intelligence Loop** | ANALYTICS | `P-15 Performance Intel` | `INTELLIGENCE_INSIGHT:VIEW` |
| **Planning & Batches**| MANAGEMENT | `P-16 Planning & Batches` | `VIEW_PLANNING` |
| **Team Operations** | MANAGEMENT | `P-17 Team Operations` | `VIEW_TEAM` |
| **Administration** | MANAGEMENT | `P-18 System Administration`| `CONFIGURATION:ADMINISTER` |

### 25.2 Search & Filter Matrix
| Target Workspace | Searchable Domain Entities | Supported Contextual Filters | Sort Options |
| :--- | :--- | :--- | :--- |
| **Question Library** | `Question`, `QuestionVersion` | Topic, Subtopic, Difficulty, Status | Newest, Difficulty, Title |
| **Production Board** | `Video`, `Script`, `Content` | Current Stage, Assignee, Blocked Flag| Stage, Due Date, Urgency |
| **Publishing Manager**| `PublishingPackage`, `Publication`| Platform, Release Window, Sync Status | Scheduled Date, Platform |
| **Social Retention** | `AnalyticsSnapshot`, `Content` | Views Threshold, Completion %, Topic | Lowest Retention, Most Views |
| **Audit Explorer** | `AuditEvent`, `WorkflowTransition`| Actor ID, Resource Type, Action, Date | Most Recent, High Risk |

### 25.3 Notification Matrix
| Business Event | Notification Category | Target Roles | Destination Link |
| :--- | :--- | :--- | :--- |
| Question Submitted for Verification | `ACTION_REQUIRED` | `QA_REVIEWER` | `P-05 Question Verification` |
| Question Changes Requested | `ACTION_REQUIRED` | `QUESTION_AUTHOR` | `P-04 Question Studio` |
| Master Cut Ready for QC | `ACTION_REQUIRED` | `CONTENT_LEAD` | `P-09 Video Workbench (Tab 4)` |
| Social Review Certified | `ACTION_REQUIRED` | `PUBLISHING_LEAD` | `P-11 Publishing Manager` |
| Video Live on YouTube | `INFORMATIONAL` | All Content Creators | `P-12 Platform Sync Console` |
| Analytics Ingestion Delayed | `INFORMATIONAL` | `ANALYST` | `P-14 Social Retention Bay` |
| Admin Session Flushed | `SECURITY_ALERT` | `ADMIN` | `P-18 System Administration` |

---

## 26. Mandatory UX Invariants

The frontend architecture strictly enforces these **20 UX Invariants**:

1. **One Global Shell:** There is exactly one application shell. No workspace or role may spawn an independent navigation shell.
2. **Work-Oriented Organization:** Navigation is organized around business outcomes, never backend software packages.
3. **No Competing Hierarchies:** One Purpose ──► One Navigation Mechanism. No parallel sidebars representing identical routes.
4. **Contextual Workflow Stepper:** The canonical 15-step workflow progress is displayed inside resource workbenches, never as a global navigation sidebar.
5. **No Universal State Exposure:** Complex 6-dimensional backend state is translated into intuitive, single-concept business badges.
6. **Capability-Gated Visibility:** Menu items and buttons render based on Stage 09 capabilities; the server remains authoritative.
7. **Anti-Self-Approval Tooltips:** Gated review actions explicitly explain `GAR-02` restrictions when disabled.
8. **Resource vs. Workspace Separation:** Workspaces (task bays) and Resource Details (record inspectors) remain distinct.
9. **Consolidated Video Workbench:** All video sub-tasks (Script, Record, Edit, QC, Thumbnail) execute inside `P-09 Video Production Workbench`.
10. **Zero Orphaned Pages:** All 6 legacy video page files are formally retired in favor of the tabbed workbench.
11. **Omnipresent Global Search:** Global search (`Ctrl+K`) is accessible from every viewport location.
12. **Unified Notification Center:** One canonical drawer separates actionable tasks from informational updates.
13. **Isolated Admin Bay:** Administrative tools (`/admin`) are completely hidden for non-administrative roles.
14. **Deterministic Active Navigation:** Clicking a sub-page maintains the active highlighting of its parent primary hub.
15. **Predictable Action Hierarchy:** Every page distinguishes Primary, Secondary, and Destructive actions.
16. **No Phantom Routes:** Navigating to an unassigned route renders the canonical 404 page with a return-home action.
17. **Optimistic Locking Transparency:** Stale client state triggers an immediate, non-destructive refresh prompt.
18. **Accessible Color Contrast:** All textual badges and buttons pass high-contrast readability standards.
19. **Keyboard Navigability:** All primary interactions support standard keyboard shortcuts and tab trapping.
20. **Responsive Integrity:** Mobile views gracefully degrade to view/approve flows without breaking studio tooling.

---

## 27. UX Decision Register (UDR)

| Decision ID | Architectural Decision | Alternatives Considered | Business & Technical Rationale | Downstream Stage |
| :---: | :--- | :--- | :--- | :---: |
| **UDR-001** | Six Primary Business Hubs | 4 Hubs (Merged Prod/Pub) vs. 11 Hubs (One per role) | 6 Hubs reflect natural operational velocity without overwhelming navigation. | **Stage 11** |
| **UDR-002** | First-Class "My Work" Queue | Sub-tab inside Dashboard vs. Dedicated Hub | Users require an instant, zero-click view of their assigned tasks and review queues. | **Stage 11** |
| **UDR-003** | Contextual Stepper over Sidebar | Permanent 15-item left sidebar | A permanent 15-step sidebar steals horizontal screen width required for video editing and proofing. | **Stage 18** |
| **UDR-004** | Tabbed Video Workbench Consolidation | Keeping 6 standalone video pages | Eliminates route fragmentation; maintains single video context across editing, QC, and thumbnails. | **Stage 18 / 21** |
| **UDR-005** | Modal Omnisearch (`Ctrl+K`) | Page-specific search inputs | Universal search shortcut provides instant cross-entity navigation for power users. | **Stage 18** |

---

## 28. Brownfield Conflict Register (BCR)

| Conflict ID | Existing Frontend Conflict | UX / Maintenance Risk | Target IA Resolution | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **BCR-001** | 6 Orphaned Video Pages in `src/pages/` | Code bloat, route confusion, inconsistent styling. | Retires files; consolidates all operations into `VideoDetailPage`. | **Stage 10 / Stage 21** |
| **BCR-002** | Competing Workflow Step Navigation | `WorkflowStepNav`, `VideoWorkflowHeader`, etc. | Retires duplicate headers; standardizes on single contextual stepper. | **Stage 10 / Stage 18** |
| **BCR-003** | Role-Based Landing Redirects | Hardcoded redirects in `App.tsx` bypassing IA. | Replaces role redirects with capability-aware Home/My Work routing. | **Stage 10 / Stage 11** |
| **BCR-004** | Duplicated Production Dashboards | `ProductionBoardPage` vs. `ProductionTrackerPage`. | Consolidates into single `P-08 Production Pipeline` board. | **Stage 10 / Stage 21** |
| **BCR-005** | Technical Status Exposure | Raw DB status (`SCRIPT_READY`, `QC_PENDING`) shown. | Standardizes on human-friendly presentation badges (Section 19). | **Stage 10 / Stage 18** |
| **BCR-006** | Unprotected Admin Route in Nav | Admin items visible to general users in sidebar. | Gated strictly by `CONFIGURATION:ADMINISTER` capability. | **Stage 10 / Stage 18** |

---

## 29. Traceability Matrix

### 29.1 Upstream Traceability (Stages 01–09 to Stage 10)
| Stage 10 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 2 & 4 (Hubs)** | Stage 01 Requirements & Stage 04 AP-002 | Structures application around core educational production hubs. |
| **Section 7 (Consolidated Video)**| Stage 03 Baseline Section 5 | Resolves the 6 orphaned video pages identified in the baseline audit. |
| **Section 12 (Workflow Stepper)** | Stage 07 Canonical Workflow | Renders the sequential 15-step business progression contextually. |
| **Section 18 & 19 (Status Badges)**| Stage 08 State Model | Translates 6-dimensional backend state into unified business badges. |
| **Section 13 & 20 (Capabilities)** | Stage 09 RBAC Model | Derives menu, button, and workspace visibility from Stage 09 tokens. |
| **Section 18 (GAR-02 Tooltip)** | Stage 09 Section 9 & Stage 02 AC-02 | Explains Anti-Self-Approval visually on disabled review buttons. |

### 29.2 Downstream Traceability (Stage 10 to Future Stages)
| Downstream Stage | Consumed Frontend IA Component | Implementation Expectation |
| :--- | :--- | :--- |
| **Stage 11 — Page & Route Contract**| Page Inventory (Section 24) & Hubs | Formalizes exact URL route strings, query params, and redirects. |
| **Stage 13 — API Contract** | Workspace Matrix (Section 25.1) | Designs REST endpoints matching workspace data and action requirements. |
| **Stage 18 — Frontend Shell** | Global Shell (Section 3) & Navigation | Implements Sidebar, Header, Breadcrumbs, and Search modal components. |
| **Stage 19–26 — Workspaces** | Workspace Specifications (Sections 6–10)| Implements Question Studio, Video Workbench, and Publishing bay. |
| **Stage 28 — E2E Testing** | Invariants (Section 26) & Workspaces | Validates end-to-end task completion flows across all 6 hubs. |

---

## 30. Explicit Implementation Boundary Statement

> [!IMPORTANT]
> **Explicit Implementation Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual and architectural **Frontend Information Architecture, Global Shell Layout, and Workspace Hierarchy** for BP-CMS.
> 
> It does **NOT** define or execute:
> - Physical React component code (`.tsx`), hooks, or contexts.
> - Client-side routing configuration in `App.tsx` (deferred to Stage 11).
> - CSS styling, Tailwind classes, or design-system token values.
> - Express server route endpoints or API handler code.
> - Deletion or file movement of the 6 orphaned video page files.
> 
> Route contract specifications are deferred strictly to **Stage 11 (Page & Route Contract)**; REST API schemas to **Stage 13 (API Contract)**; and React component implementation to **Stage 18 (Frontend Shell Implementation)**.

---

## 31. Stage 10 Completion Checklist & Sign-off

- [x] Read all nine prior canonical artifacts (`01` through `09`).
- [x] Inspected actual current frontend pages in `src/pages/` (all 31 files audited).
- [x] Inspected current navigation components, sidebars, headers, and route redirects.
- [x] Formally resolved the 6 orphaned video pages (`VideoEditPage`, etc.) via Video Workbench consolidation.
- [x] Established the Work-First Paradigm ("What work do I need to do?").
- [x] Defined the Single Global Application Shell architecture.
- [x] Formalized the 6 Authoritative Business Hubs (Home, Questions, Production, Publishing, Analytics, Management).
- [x] Designed the Home and "My Work" personal queue experience.
- [x] Defined all Hub Information Architectures (Questions, Production, Publishing, Analytics, Management).
- [x] Codified the structural distinction between Resource Detail and Workspace models.
- [x] Formulated the Contextual Workflow Stepper component (eliminating competing 15-item sidebar).
- [x] Established the Single Navigation Ownership Hierarchy (ONE purpose ──► ONE navigation mechanism).
- [x] Designed Omnipresent Global Search (`Ctrl+K`) and Contextual Filtering tiers.
- [x] Designed the Unified Notification Center (Action Required vs. Informational).
- [x] Formulated Capability-Aware Navigation and Status Presentation strategies.
- [x] Established comprehensive Legacy Frontend Mapping (all 31 pages classified).
- [x] Created Canonical Page Inventory (18 target production workspaces).
- [x] Created Navigation, Search/Filter, and Notification Matrices.
- [x] Defined 20 mandatory UX Invariants.
- [x] Established UX Decision Register (`UDR-001` through `UDR-005`).
- [x] Established Brownfield Conflict Register (`BCR-001` through `BCR-006`).
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 10 — FRONTEND & INFORMATION ARCHITECTURE
================================================================================
Artifact:            docs/architecture/10-FRONTEND-INFORMATION-ARCHITECTURE.md
Version:             10.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 10 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 10. Awaiting Stage 11 Instruction.
================================================================================
```
