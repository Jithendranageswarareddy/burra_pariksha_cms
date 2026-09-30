# Stale Routes Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Stale Parameter & Redirect Analysis

A route is classified as **stale** if it forwards users to an outdated query parameter or state representation:

### 1. `/production-board`
- **Redirects to:** `/production?status=EDITING`
- **Stale Aspect:** In the unified `ProductionTrackerPage`, the status filter parameter is typically plural or derived from canonical workflow stages (e.g. `status=06_EDITING_BAY`). The legacy string `EDITING` is a remnant of the early 4-stage pipeline.

### 2. `/videos/thumbnail`
- **Redirects to:** `/production?status=READY_TO_UPLOAD`
- **Stale Aspect:** Stage 08 is Thumbnail Design. Redirecting a user looking for thumbnails to a pipeline filtered by `READY_TO_UPLOAD` loses the video context entirely.

### 3. `/videos/pinned-comment`
- **Redirects to:** `/production` (Unfiltered)
- **Stale Aspect:** Discards user intent without pointing to `SocialReviewPage` or `PinnedCommentWorkspace`.
