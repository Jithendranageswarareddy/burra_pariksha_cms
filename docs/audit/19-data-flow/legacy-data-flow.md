# Legacy Data Flows & Deprecated Paths

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 31 of 35  

---

## 1. Catalog of Legacy & Deprecated Data Paths

| Legacy Flow | File / Location | Historical Purpose | Modern Replacement | Risk Level |
| :--- | :--- | :--- | :--- | :---: |
| **contentId vs contentMasterId** | `google-sheets-schema.ts` | Early prototype used `contentId` | Unified `contentMasterId` | **MEDIUM** |
| **Phase 7 Drive Layout** | `video.service.ts:890` | Initial 3-folder layout (Videos, Scripts, Thumbnails) | Phase 14 4-folder layout (Raw, Edited, Final, Thumbnail) | **HIGH** |
| **Legacy Video Detail Workspaces**| `src/pages/videos/*` | 8 discrete page components | Unified `VideoDetailPage.tsx` tabbed workspaces | **LOW** |
| **Phase 15/16/17 Route Stubs** | `src/server/routes.ts` | Prototype endpoints for phased development | Consolidated service pipelines | **LOW** |
| **Unlinked Video Tab Redirects** | `src/App.tsx` | Backward compatibility route redirects | Canonical route hierarchy | **LOW** |
