# Frontend Application Shell Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Application Shell Hierarchy

The frontend architecture implements two distinct shell states:

1. **Public Unauthenticated Shell (`LoginPage.tsx`):**
   - Completely standalone full-screen login card.
   - Bypasses application layout, sidebar, header, and production journey bars.
   - Handles password/credential authentication via `apiClient.login()`.

2. **Authenticated Global Application Shell (`src/components/layout/Layout.tsx`):**
   - Mounted as root route element: `<Route path="/" element={<Layout />}>`.
   - All 23 active application routes render inside the `<Outlet />` of this shell.

---

## 2. Authenticated Shell Composition (`Layout.tsx`)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Header.tsx                                │
│  [Logo & Brand]  [Global Search]  [System Health]  [Notifications] [User] │
├──────────────┬─────────────────────────────────────────────────────────┤
│              │                 ProductionJourneyBar.tsx                │
│              ├─────────────────────────────────────────────────────────┤
│ Sidebar.tsx  │                                                         │
│              │                      <Outlet />                         │
│  [Navigation │                   (Page Component)                      │
│   Links]     │                                                         │
│              │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### Shell Component Responsibilities

1. **`Sidebar.tsx`:**
   - Left navigation drawer (collapsible).
   - Groups links into:
     - *Overview:* Dashboard, My Work, Planning
     - *Content Production:* Questions, Studio, Content Masters, Social Review
     - *Video & Production:* Queue, Production Tracker, Platform Packages, Publishing
     - *Intelligence:* Analytics Overview, Social Analytics, Team Operations
     - *System:* Settings, Recovery Admin
   - Filters links using `canAccessRoute(user?.role, item.route)` from `src/config/roles.ts`.

2. **`Header.tsx`:**
   - Top banner displaying active system context.
   - Embeds:
     - `GlobalSearchBar.tsx` (Live search across questions, videos, scripts)
     - `SystemHealthIndicator.tsx` (Real-time polling of Google Sheets connectivity)
     - `NotificationsMenu.tsx` (System alerts and assignment notifications)
     - `UserProfileMenu.tsx` (User avatar, role badge, session logout button)

3. **`ProductionJourneyBar.tsx`:**
   - Mounted immediately above the page `<Outlet />`.
   - Dynamically displays the canonical 15-stage workflow timeline whenever a content entity (`questionId`, `videoId`, or `contentMasterId`) is active in `ProductionJourneyContext`.

4. **`ErrorBoundary.tsx`:**
   - Wraps the `<Outlet />` to isolate page-level rendering crashes from tearing down the application shell.

---

## 3. Shell Architecture Findings

- **Single Authoritative Shell:** Only one global authenticated shell exists (`Layout.tsx`). There are no conflicting nested shells.
- **Persistent State:** Shell sidebar collapse state is persisted to `localStorage.getItem("bp_sidebar_collapsed")`.
