# Forensic UI Problem Register (UI-001 through UI-030)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 28 of 30  

---

## 1. Problem Classification Matrix

| Finding ID | Classification Category | Location / Component | Problem Summary | Severity |
| :--- | :--- | :--- | :--- | :---: |
| **UI-001** | Purpose Ambiguity | `SocialReviewPage` vs `VideoDetailPage?tab=social` | Dual UI surfaces represent identical review gate with divergent layouts | MEDIUM |
| **UI-002** | Role/User Ambiguity | `PlanningPage.tsx` | Lacks clear persona indicator; combines admin planning with authoring | MEDIUM |
| **UI-003** | Workflow Mapping Ambiguity | `VideoCreateScriptPage` | Standalone route exists alongside integrated `?tab=script` workspace | LOW |
| **UI-004** | Duplicate Page | `ProductionBoardPage` vs `ProductionTrackerPage` | Duplicate board page exists unrouted in codebase | LOW |
| **UI-005** | Duplicate UI Component | `src/design-system/Badge` vs `src/components/common/Badge` | Dual badge components with different prop signatures | MEDIUM |
| **UI-006** | Legacy UI | 8 unrouted legacy pages in `src/pages/` | Retained unrouted files clutter codebase | LOW |
| **UI-007** | Multiple Responsibilities | `PlanningPage.tsx` (132KB) | Combines taxonomy editing, batch generation, and chart views | HIGH |
| **UI-008** | Incorrect Data Display | `DashboardPage.tsx` | Fallback stats display 0 without explicit empty explanation | LOW |
| **UI-009** | Incorrect Data Source | `PlanningPage.tsx` | Executes 17 raw fetches on mount bypassing unified cache layer | HIGH |
| **UI-010** | Incorrect Editability | `QuestionDetailPage.tsx` | Edit button shown to roles lacking academic solver capability | MEDIUM |
| **UI-011** | Action Conflict | `QuestionStudioPage.tsx` | "Save Draft" vs "Save & Continue" causes user uncertainty | MEDIUM |
| **UI-012** | Button Conflict | `NotFoundPage` vs `QuestionDetailPage` | "Back" uses `navigate(-1)` vs static path | HIGH |
| **UI-013** | Form Problem | `QuestionStudioPage.tsx` | Deep form lacks persistent draft auto-save across crashes | MEDIUM |
| **UI-014** | Table Problem | `QuestionLibraryPage.tsx` | Table pagination resets to page 1 on search input without debounce | MEDIUM |
| **UI-015** | Card Problem | `DashboardPage.tsx` | Cards feature hover shadows giving false impression of clickability | LOW |
| **UI-016** | Modal/Drawer Problem | All 18 Modals | In-memory state only; back button unloads parent page | HIGH |
| **UI-017** | Status Indicator Problem| `ProductionTrackerPage` | Mini-stepper status badges use different color tokens than library | MEDIUM |
| **UI-018** | Loading State Problem | `PlanningPage.tsx` | Buttons lack loading spinners during raw fetch execution | HIGH |
| **UI-019** | Empty State Problem | `PublishingPage.tsx` | Calendar grid renders blank squares without clear empty prompt | MEDIUM |
| **UI-020** | Error State Problem | `QuestionDetailPage.tsx` | Missing question ID displays generic error instead of helpful 404 | MEDIUM |
| **UI-021** | Permission UI Problem | `RecoveryAdminPage`, `SettingsPage` | Route guards absent in `App.tsx`; accessible via address bar | **CRITICAL** |
| **UI-022** | Navigation Problem | `Sidebar.tsx` mini-mode | Mini-sidebar tooltips clipped on smaller desktop viewports | LOW |
| **UI-023** | Workflow UI Problem | `ProductionJourneyBar.tsx` | Horizontal stepper lacks swipe indicators on mobile displays | MEDIUM |
| **UI-024** | API/UI Coupling Problem | `PlanningPage.tsx` | UI tightly bound to raw endpoint responses without adapters | HIGH |
| **UI-025** | Persistence Problem | `VideoDetailPage` tabs | Active tab lost if user navigates away and clicks back without `?tab=`| LOW |
| **UI-026** | Stale Data Problem | `SettingsPage.tsx` | Health ping cache can report STALE status after network reconnection | MEDIUM |
| **UI-027** | Terminology Inconsistency| Cross-Page CTAs | Mixes "Continue", "Advance", "Approve & Next", "Proceed" | LOW |
| **UI-028** | Multiple Responsibilities | `SettingsPage.tsx` (130KB) | Combines diagnostics, Google Sheets config, and taxonomy tables | HIGH |
| **UI-029** | Missing Page | Stage 08 (Thumbnail Studio)| Exists solely as a tab in `VideoDetailPage`; lacks standalone list | LOW |
| **UI-030** | Requires Runtime Verification| Gemini AI live stream generation | Live streaming SSE text chunking requires live execution test | MEDIUM |
