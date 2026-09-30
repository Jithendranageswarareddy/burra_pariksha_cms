# Frontend Authentication & RBAC Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Authentication Flow & Session Guarding

1. **Initial Mount:**
   - `AppRoutes` calls `useAuth()`.
   - While `isLoading`, a full-screen loading spinner is displayed.
   - If `!user`, `AppRoutes` unconditionally returns `<LoginPage />`.
2. **Session Persistence:**
   - `apiClient` retrieves session tokens from `localStorage.getItem("bp_session_token")` and passes them via `Authorization: Bearer <token>` headers.
   - Calling `logout()` removes the token and sets `user = null`.

---

## 2. Role-Based Access Control (RBAC) in Frontend

Defined in `src/config/roles.ts` (11 Canonical Roles):
- `ADMIN`, `CONTENT_LEAD`, `PUBLISHING_LEAD`, `QA_REVIEWER`, `QUESTION_AUTHOR`, `QUESTION_EDITOR`, `SCRIPTWRITER`, `PRESENTER`, `VIDEO_EDITOR`, `DESIGNER`, `ANALYST`.

### Enforcement Mechanisms:
1. **Dynamic Landing Route:**
   - `getDefaultLandingRoute(user.role)` routes users upon login (e.g. Presenter -> `/queue`; Video Editor -> `/production?status=EDITING`; Admin -> `/dashboard`).
2. **Sidebar Link Visibility:**
   - `Sidebar.tsx` calls `canAccessRoute(user.role, link.route)` to conditionally render navigation items.
3. **Component Action Disabling:**
   - Pages disable action buttons (e.g. `RecoveryAdminPage` disables restore triggers if role != `ADMIN`).

### Architectural Vulnerability: Client Route Guarding Absence
- In `src/App.tsx`, child routes inside `<Layout />` are **not guarded by route-level AuthGuard / RoleGuard wrappers**.
- A non-admin user who types `/recovery` directly into the browser URL bar can mount `RecoveryAdminPage.tsx`. While the backend API correctly rejects unauthorized restore calls with 403, the client UI does not prevent route navigation.
