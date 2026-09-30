# Nested Routes Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Route Tree Nesting Structure

In `src/App.tsx`, React Router nesting is structured as a two-level hierarchy:

```
<Routes>
  └─ <Route path="/" element={<Layout />}>   <-- Level 1: Root Layout Shell
        ├─ <Route index ... />                <-- Level 2: Child Route Outlet
        ├─ <Route path="dashboard" ... />
        ├─ <Route path="planning" ... />
        ├─ ... (77 additional child routes)
        └─ <Route path="*" ... />             <-- Catch-all 404
```

---

## 2. Findings on Sub-Nesting & Absence of Child Outlets

1. **Flat Child Hierarchy:**
   - Despite complex URL paths such as `/analytics/overview` or `/production/:videoId/script`, these are declared as **flat siblings** under the parent `Layout` route.
   - None of the child routes declare nested sub-`<Route>` elements or nested `<Outlet />` containers.
2. **Pseudo-Nesting via Query Parameters:**
   - `VideoDetailPage.tsx` implements pseudo-nested views by reading `?tab=` and switching between 7 workspace components in local state rather than using declarative React Router child routes.
3. **Analytics Pseudo-Nesting:**
   - `AnalyticsExperiencePage.tsx` is mapped to 10 distinct routes (`/analytics/overview`, `/analytics/video`, etc.). The page reads `useLocation().pathname` to switch internal tabs rather than using nested outlets.
