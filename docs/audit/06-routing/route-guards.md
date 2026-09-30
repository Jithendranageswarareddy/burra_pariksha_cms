# Route Guards & Authorization Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Authentication Gate Evaluation

The application implements a single monolithic authentication gate in `src/App.tsx` (`AppRoutes`):
```tsx
const { user, isLoading } = useAuth();
if (isLoading) return <LoadingScreen />;
if (!user) return <LoginPage />;
```
- **Efficacy:** 100% effective at blocking unauthenticated users from seeing authenticated application views. No route inside `<Routes>` can be mounted if `user` is null.

---

## 2. RBAC Route Guard Absence (Architectural Finding)

### The Issue:
While authentication is strictly enforced, **fine-grained role-based route guards are completely absent from `<Route>` declarations in `src/App.tsx`**.

### Evidence:
- `<Route path="recovery" element={<RecoveryAdminPage />} />` has NO `<RequireRole role="ADMIN">` wrapper.
- `<Route path="team" element={<TeamOperationsPage />} />` has NO role wrapper.
- `<Route path="settings" element={<SettingsPage />} />` has NO role wrapper.

### Actual Protection Level:
1. **UI Hiding:** `Sidebar.tsx` uses `canAccessRoute(user.role, link.route)` to hide links from unauthorized users.
2. **Backend Enforcement:** The backend Express server validates session tokens and returns `403 Forbidden` on unauthorized API calls.
3. **Client Ingress Hole:** A non-admin user can manually type `/recovery` into the URL address bar and the frontend will mount `RecoveryAdminPage`. The page will render its UI shell, though API calls will subsequently fail.
