# Step 06: Final Route Forensic Baseline Report

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Definitive Answers to Core Routing Inquiries

### TOTAL ROUTES
- **Total Route Declarations in App.tsx:** **79 routes** (1 parent layout shell + 78 child routes).

### STATIC ROUTES
- **Total:** **30 static page routes** (including `/dashboard`, `/planning`, `/questions`, `/studio`, `/queue`, `/production`, `/platform-packages`, `/publishing`, `/settings`, `/recovery`, 10 analytics sub-routes, etc.).

### DYNAMIC ROUTES
- **Total:** **32 dynamic routes** (utilizing `:id`, `:videoId`, `:reviewId`, or `:contentId`).

### NESTED ROUTES
- **Total:** 1 top-level layout nesting level (`<Route path="/" element={<Layout />}>`). Zero sub-nested child outlets.

### REDIRECTS
- **Total:** **39 redirects** (15 static `<Navigate replace />` routes + 24 dynamic `<VideoTabRedirect />` routes).

### ROUTE GUARDS
- **Total:** 1 global authentication gate in `AppRoutes`. Zero client-side role guards on child routes.

### CANONICAL ROUTE CANDIDATES
- **Total:** 23 primary canonical routes representing active pages in the 6 Authoritative Hubs.

### DUPLICATE ROUTES
- **Total:** 14 duplicate route pairs/aliases (11 `/videos/` vs `/production/` pairs, `/team` vs `/team-work`, `/recovery` vs `/admin`, `/studio` vs `/questions/new`).

### ORPHAN ROUTES
- **Total:** 4 orphan routes with zero UI consumers (`/admin`, `/team-work`, `/videos/platform-packages`, `/production-tracker`).

### LEGACY ROUTES
- **Total:** 18 legacy route shims preserved from earlier development stages.

### STALE ROUTES
- **Total:** 3 routes forwarding to outdated or generic status query parameters (`/production-board`, `/videos/thumbnail`, `/videos/pinned-comment`).

### MISDIRECTED ROUTES
- **Total:** 3 routes exhibiting parameter loss or misdirected landing views.

### UNAUTHORIZED ROUTE FINDINGS
- **Total:** 4 administrative routes accessible via direct browser address bar typing without client route guards (`/recovery`, `/admin`, `/settings`, `/team`).

### ID/PARAMETER PROBLEMS
- **Total:** 1 critical contract ambiguity: `/questions/:id` accepts both draft IDs (`BP-DFT-*`) and canonical IDs (`BP-Q-*`) interchangeably.

### WORKFLOW ROUTE PROBLEMS
- **Total:** 1 workflow route issue: `/videos/:id` relies on query parameter `?tab=` rather than declarative routes, causing potential synchronization drift with `ProductionJourneyContext`.

### MAJOR ROUTING OBSERVATIONS
1. **Proliferation of Backward-Compatibility Shims:** Over 49% of all declared routes (39 of 79) are redirects or aliases to maintain compatibility with older stage paths.
2. **Dual `/videos/` vs `/production/` Hierarchy:** Video workspaces can be reached through two identical URL prefixes, fragmenting deep link consistency.
3. **Absence of Declarative Sub-Routing:** The entire video lifecycle and analytics experience use monolithic parent components reading query params or path segments rather than declarative React Router sub-routes.

---

## 2. Audit Limitations
- Sandboxed execution container: Ingress routing was inspected through Express server middleware and client router files without external CDN or load-balancer layer inspection.
- Read-only forensic analysis: No routes were removed, unified, or redirected during this audit.
