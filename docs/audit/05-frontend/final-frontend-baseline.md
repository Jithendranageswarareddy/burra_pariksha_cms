# Step 05: Final Frontend Architecture Forensic Baseline Report

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Definitive Answers to Core Audit Questions

### FRONTEND ENTRY POINT
- **Actual entry point:** `src/main.tsx` -> `src/App.tsx` mounted onto `index.html` (`<div id="root">`).
- **Evidence:** Confirmed in `src/main.tsx` line 6: `createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>)`. Zero secondary entry points.

### APPLICATION SHELL
- **Shells:** 2 distinct shells:
  1. Public Unauthenticated Shell: `LoginPage.tsx`
  2. Authenticated Global Shell: `src/components/layout/Layout.tsx`
- **Layouts:** 8 layout files under `src/components/layout/` (`Layout`, `Header`, `Sidebar`, `PageHeader`, `ErrorBoundary`, `NotificationsMenu`, `UserProfileMenu`, `SystemHealthIndicator`).
- **Providers:** `<BrowserRouter>` -> `<AuthProvider>` -> `<ProductionJourneyProvider>`.

### PAGES
- **Total:** 31 pages under `src/pages/`.
- **Current Routed Candidates:** 23 pages imported and mounted into active routes in `src/App.tsx`.
- **Legacy Candidates:** 8 pages unrouted in `src/App.tsx` (`ProductionBoardPage`, `PublishingPackagePage`, `VideoEditPage`, `VideoFinalPage`, `VideoPinnedCommentPage`, `VideoRecordPage`, `VideoReviewScriptPage`, `VideoThumbnailPage`).
- **Duplicate Candidates:** 0 direct duplicate page files (superseded by `VideoDetailPage` tabbed workspaces).

### COMPONENTS
- **Total Relevant:** 80 components (59 in `src/components/`, 21 in `src/design-system/`).
- **Shared Primitives:** 27 components.
- **Page-Specific / Single-Use:** 31 components.
- **Duplicate Candidates:** 5 critical component pairs (`Button`, `PageHeader`, `EmptyState`, `Modal`, `Badge`).
- **Legacy Candidates:** 2 design system components (`Form.tsx`, `StepIndicator.tsx`).

### HOOKS
- **Total:** 2 custom hooks (`useAuth` in `AuthContext.tsx`, `useProductionJourney` in `ProductionJourneyContext.tsx`).
- **Business-Logic Hooks:** 1 (`useProductionJourney` handles stage blockers and transition progression).
- **API Hooks:** 0.
- **State Hooks:** 0.
- **Directory Status:** `src/hooks/` does not exist in repository.

### CONTEXTS
- **Total:** 2 global React contexts (`AuthContext.tsx`, `ProductionJourneyContext.tsx`).
- **Authentication:** `AuthContext` (stores `User`, `isLoading`, session token in `localStorage`).
- **RBAC:** Managed via `user.role` within `AuthContext` and helper functions in `src/config/roles.ts`.
- **Application & Workflow State:** `ProductionJourneyContext` (orchestrates canonical IDs and 15-stage workflow).
- **UI State:** Local component state (`useState`).

### STATE MANAGEMENT
- **Mechanisms:** React `useState` (62 files), React `createContext` (2 files), React Router `useSearchParams` / URL (14 files), `localStorage` (2 files).
- **Sources of Truth:** Google Sheets (Backend via `apiClient`).
- **Observed Conflicts:** Tri-state divergence between local workspace state, URL query parameter (`?tab=`), and `ProductionJourneyContext.currentStage`.

### SERVICES
- **Total Frontend Service Imports:** 4 files.
- **API Client:** Monolithic `src/lib/api-client.ts` (1,667 lines) used by 49 frontend files.
- **Business Service Leakage:** `PublishingTable.tsx` imports backend `ProductionAssetValidationService` directly.

### BACKEND LEAKAGE
- **Findings:** 19 distinct references to Google Sheets worksheet names, spreadsheet IDs, Google Drive folder IDs, or Cloud Storage concepts in UI components.
- **Severity:** 1 CRITICAL (`PublishingTable.tsx` direct backend service instantiation), 3 HIGH, 4 MEDIUM.

### FRONTEND BUSINESS LOGIC
- **Findings:** Workflow transition blocker logic in `ProductionJourneyContext`, question schema rules in `QuestionStudioPage`, publishing validation rules in `PublishingTable`.
- **Severity:** HIGH.

### MAJOR FRONTEND ARCHITECTURE OBSERVATIONS
1. **Consolidated Video Workspaces:** The transition from discrete step pages to tabbed workspaces inside `VideoDetailPage` was successful functionally, but left 8 unrouted legacy page files in `src/pages/`.
2. **Dual Component Ecosystem:** An unresolved competition between `src/design-system/` and `src/components/common/` divides UI primitives 50/50 across the codebase.
3. **Absence of Domain Hooks & Data Cache:** Data fetching is written directly in component `useEffect` blocks without caching, leading to redundant network calls and stale state risks.

---

## 2. Audit Limitations
- Sandboxed browser runtime: UI interaction states were audited through AST parsing and source code inspection without running browser automation (Playwright/Puppeteer).
- Read-only forensic analysis: No components were merged or deleted.
