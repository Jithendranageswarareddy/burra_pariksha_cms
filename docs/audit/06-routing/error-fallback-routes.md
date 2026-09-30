# Error & Fallback Routes Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Error & Fallback Architecture

The application handles routing anomalies and missing resources through three tiers:

### Tier 1: Client Catch-All Route (`/*`)
- **Declaration:** `<Route path="*" element={<NotFoundPage />} />` (Line 191 in `src/App.tsx`).
- **Behavior:** Any URL path that does not match the 78 registered routes renders `NotFoundPage`.
- **UI Presentation:** Displays 404 illustration, headline "Page Not Found", and a primary action button "Return to Dashboard" (`/` -> `landingRoute`).

### Tier 2: Shell Error Boundary
- **Component:** `src/components/layout/ErrorBoundary.tsx`
- **Behavior:** Class component wrapping `<Outlet />` in `Layout.tsx`. Catches unhandled JavaScript runtime exceptions inside child pages, displaying an error card with error stack inspection and a "Reload Page" button, preventing complete crash of the application shell.

### Tier 3: Server SPA Fallback
- **Component:** Express `app.get("*", ...)` in `server.ts`
- **Behavior:** When running in production container mode, any non-`/api` GET request returns `dist/index.html` with HTTP 200, enabling React Router client-side routing on hard browser reloads.
