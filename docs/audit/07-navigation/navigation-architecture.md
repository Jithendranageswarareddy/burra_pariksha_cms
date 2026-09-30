# Navigation Architecture & Information Topology

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 02 of 27  

---

## 1. Information Architecture Overview

The Burra Pariksha CMS navigation topology is organized as a **multi-layered, role-aware operational matrix**. It balances high-level administrative oversight with granular, task-oriented conveyor belt workflows.

```
+----------------------------------------------------------------------------------------------------+
|                                    GLOBAL APPLICATION SHELL                                         |
|                                                                                                    |
|  +--------------------+  +-----------------------------------------------------------------------+  |
|  |   PRIMARY SIDEBAR  |  | TOP HEADER: Context Title | Search | Status | Notifications | Profile |  |
|  |                    |  +-----------------------------------------------------------------------+  |
|  |  [HOME]            |  | STICKY BREADCRUMBS: Home > Hub > Page / Context > Workspace Tab       |  |
|  |   - Overview       |  +-----------------------------------------------------------------------+  |
|  |   - My Work        |  | WORKSPACE / PAGE BODY                                                 |  |
|  |                    |  |                                                                       |  |
|  |  [QUESTIONS]       |  |  +-----------------------------------------------------------------+  |  |
|  |   - Library        |  |  | PRODUCTION JOURNEY STEPPER BAR (Stages 01 - 15)                 |  |  |
|  |   - Studio         |  |  +-----------------------------------------------------------------+  |  |
|  |                    |  |                                                                       |  |
|  |  [PRODUCTION]      |  |  +-----------------------------------------------------------------+  |  |
|  |   - Queue          |  |  | CONSOLIDATED WORKSPACE TABS (?tab=script|recording|editing|...) |  |  |
|  |   - Pipeline       |  |  +-----------------------------------------------------------------+  |  |
|  |                    |  |                                                                       |  |
|  |  [PUBLISHING]      |  |  +-----------------------------------------------------------------+  |  |
|  |   - Signoff        |  |  | ACTIVE TASK CONTENT / ACTION FOOTERS (Back / Save / Next Stage) |  |  |
|  |   - Manager        |  |  +-----------------------------------------------------------------+  |  |
|  |                    |  +-----------------------------------------------------------------------+  |
|  |  [ANALYTICS]       |  | APPLICATION FOOTER: System Operational Indicator                      |  |
|  |   - Hub            |  +-----------------------------------------------------------------------+  |
|  |                    |                                                                             |
|  |  [MANAGEMENT]      |                                                                             |
|  |   - Planning       |                                                                             |
|  |   - Team           |                                                                             |
|  |   - Explorer       |                                                                             |
|  |   - Health         |                                                                             |
|  |   - Recovery       |                                                                             |
|  +--------------------+                                                                             |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Structural Layers of Navigation

The application navigation is composed of five distinct structural tiers:

### Tier 1: Persistent Global Shell
- **Source**: `src/components/layout/Layout.tsx`
- **Responsibility**: Renders the persistent structural frame around all authenticated routes.
- **Components**:
  - `<Sidebar />`: Primary vertical navigation hub anchor.
  - `<Header />`: Top bar containing contextual identity, page title, global search, notification center, and user profile drawer.
  - `<AppBreadcrumbs />`: Contextual location anchor providing hierarchical path ascent.
  - `<Outlet />`: Mount point for active page component.
  - `<footer />`: Operational status baseline.

### Tier 2: Authoritative 6-Hub Information Architecture
- **Source**: `src/config/navigation.ts`
- **Responsibility**: Defines the official taxonomic structure of the CMS.
- **Hubs**:
  1. `HOME`: Global operations and personal workload.
  2. `QUESTIONS`: Academic authoring and question validation.
  3. `PRODUCTION`: Studio recording and video pipeline tracking.
  4. `PUBLISHING`: Editorial quality signoff and multi-platform distribution.
  5. `ANALYTICS`: Performance intelligence and retention metrics.
  6. `MANAGEMENT & SYSTEM`: Curriculum planning, team workload, content exploration, database health, and disaster recovery.

### Tier 3: Workflow Stepper Navigation (15-Stage Conveyor Belt)
- **Source**: `src/components/production/ProductionJourneyBar.tsx` & `src/contexts/ProductionJourneyContext.tsx`
- **Responsibility**: Provides linear and non-linear navigation along the 15 canonical production stages defined in `01-product-truth.md`.
- **Mechanics**:
  - Highlights active stage number and label.
  - Computes contextual "Next Action" button (e.g. "Continue to Filming", "Approve Thumbnail").
  - Enforces dependency locking (`isBlocked`) preventing advance without required stage artifacts.
  - Supports direct stage jumping (`jumpToStage(n)`).

### Tier 4: Consolidated Workspace Tab Systems
- **Source**: `src/pages/VideoDetailPage.tsx`, `src/pages/AnalyticsExperiencePage.tsx`
- **Responsibility**: Eliminates disjointed multi-page hopping by hosting full stage workspaces under a single master URL synced via query parameters (`?tab=...`).
- **Mechanics**:
  - Synchronizes active tab with browser URL history without page reloading.
  - Bridges legacy phase URLs (`/videos/create-script` -> `/videos/:id?tab=script`) via `<VideoTabRedirect />`.

### Tier 5: Contextual Action & Progression Navigation
- **Source**: Page-level buttons, tables, and forms.
- **Responsibility**: Initiates programmatic transitions upon task completion:
  - Save Question -> Navigate to Verification.
  - Verify Question -> Navigate to Video Scripting Workspace.
  - Approve Script -> Navigate to Teleprompter / Studio Queue.
  - Complete QC Review -> Navigate to Thumbnail Studio.
  - Schedule Video -> Navigate to Publishing Manager.
