# Legacy Workflows & Historical Logic

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 12 of 41  

---

## 1. Catalog of Legacy Workflow Implementations

| Legacy Workflow Component | Location | Original Function | Replacement | Status |
| :--- | :--- | :--- | :--- | :--- |
| **8 Discrete Video Pages** | `src/pages/videos/*` | Individual page per stage | Unified `VideoDetailPage.tsx` tabs | Dormant / Redirected |
| **Legacy Video Tab Redirects** | `src/App.tsx:VideoTabRedirect`| Redirect `/videos/:id/script` -> `?tab=script` | Declarative tab parameter | Active shim |
| **Phase 12 Workflow Service** | `phase12-workflow.service.ts` | Prototype journey validation | `canonical-workflow.ts` + Context | Partially active |
| **Direct Route Access to Admin**| `src/App.tsx` (`/admin`, `/recovery`) | Unprotected debug surfaces | Role-guarded operational pages | Active vulnerability |
