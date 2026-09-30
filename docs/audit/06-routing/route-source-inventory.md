# Route Source & Influencer File Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Inventory of Files Defining or Influencing Routing

| File Path | Type | Apparent Purpose | Routes Defined / Affected | Navigation Method |
| :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | **DIRECT ROUTER SOURCE** | Authoritative declarative route definitions and top-level BrowserRouter wrapper | All 79 application routes | `<Routes>`, `<Route>`, `<Navigate>`, `useLocation` |
| `src/config/navigation.ts` | **NAVIGATION SOURCE** | Master configuration of 6 Authoritative Hubs and 12 hub navigation items | 12 primary hub hrefs | Static hub items array consumed by Sidebar |
| `src/config/roles.ts` | **ROUTE GUARD HELPER** | Declares `getDefaultLandingRoute(role)` and role navigation capabilities | Landing routes (`/dashboard`, `/queue`, etc.) | Functional role matching |
| `src/components/layout/Sidebar.tsx` | **NAVIGATION SOURCE** | Role-filtered left navigation drawer with active route calculation | 12 hub links + sub-path matching | `<NavLink to={href}>` |
| `src/components/layout/UserProfileMenu.tsx`| **NAVIGATION SOURCE** | User profile popover menu links | `/my-work`, `/settings`, `/recovery` | `<Link to={...}>` |
| `src/components/production/ProductionJourneyBar.tsx`| **WORKFLOW NAVIGATION** | 15-stage workflow progression bar | `/studio`, `/questions/:id/verify`, `/videos/:id?tab=...` | Programmatic `navigate()` |
| `src/contexts/ProductionJourneyContext.tsx` | **WORKFLOW ROUTER** | Manages stage transitions and triggers navigation | Workflow stage URLs | `advanceToNextStage()`, `jumpToStage()` |
| `src/pages/VideoDetailPage.tsx` | **TAB ROUTER** | Tabbed workspace controller | `/videos/:videoId?tab={tab}` | `useSearchParams` / `navigate` |
| `server.ts` | **SERVER FALLBACK** | Serves static assets and provides SPA HTML fallback | `app.get("*", ...)` fallback for all non-API paths | Express route wildcard |
