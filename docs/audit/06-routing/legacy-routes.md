# Legacy Routes Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Overview of Legacy Route Artifacts

During earlier development phases (Phases 04–08), video production and question authoring utilized discrete standalone pages for each step. When `VideoDetailPage.tsx` was introduced with tabbed workspaces, the old route paths were retained as redirect shims rather than removed.

### Legacy Route Inventory (18 Routes):
1. `/questions/new` -> `/studio`
2. `/generate` -> `/studio`
3. `/production-tracker` -> `/production`
4. `/production-board` -> `/production?status=EDITING`
5. `/videos/review-script` -> `/production?status=SCRIPT_READY`
6. `/videos/record` -> `/production?status=RECORDING`
7. `/videos/edit-video` -> `/production?status=EDITING`
8. `/videos/final-video` -> `/production?status=FINAL_REVIEW`
9. `/videos/thumbnail` -> `/production?status=READY_TO_UPLOAD`
10. `/videos/pinned-comment` -> `/production`
11. `/publishing-package` -> `/platform-packages`
12. `/videos/publishing-package` -> `/platform-packages`
13. `/videos/:videoId/publishing-package` -> `/platform-packages`
14. `/production/:videoId/publishing-package` -> `/platform-packages`
15. `/videos/:videoId/script` -> `?tab=script`
16. `/videos/:videoId/create-script` -> `?tab=script`
17. `/videos/:videoId/review-script` -> `?tab=script`
18. `/production/:videoId` -> `/videos/:videoId`
