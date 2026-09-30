# Route Entry Mechanisms Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Route Entry Taxonomy

Users enter application routes through five distinct mechanisms:

### A. Authoritative Sidebar Hub Links (12 primary routes)
- `/dashboard`, `/my-work`, `/questions`, `/studio`, `/queue`, `/production`, `/social-review`, `/publishing`, `/analytics/overview`, `/planning`, `/team`, `/content-masters`, `/settings`, `/recovery`.

### B. User Profile Menu Deep Links (3 routes)
- `/my-work`, `/settings`, `/recovery` (Admin only).

### C. Data Table Row Clicks (Entity Detail Pages)
- Clicking a question row in `QuestionTable.tsx` -> `/questions/:id`
- Clicking a video row in `QueueTable.tsx` -> `/videos/:id`
- Clicking a pipeline card in `ProductionKanban.tsx` -> `/videos/:id?tab=editing`
- Clicking a content master in `ContentMasterPage.tsx` -> `/content-masters/:id`
- Clicking a review card in `SocialReviewPage.tsx` -> `/social-review/:reviewId`

### D. Workflow Stage Advance & Next Actions (`ProductionJourneyBar.tsx`)
- Clicking "Next Stage" or stage nodes triggers programmatic navigation into the next workspace tab (`/videos/:id?tab=...`).

### E. Direct URL / Deep-Link Ingress
- Browser address bar inputs fall through Express SPA fallback and mount directly.
