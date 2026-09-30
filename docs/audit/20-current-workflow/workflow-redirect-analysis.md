# Workflow Redirect & Deep Link Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 31 of 41  

---

## 1. Redirect Shims & Deep-Link Discrepancies

The routing architecture in `src/App.tsx` contains 39 redirects to handle historical URLs:

| Historical Route | Dispatched Canonical Target | Parameter Loss Risk |
| :--- | :--- | :---: |
| `/videos/:id/script` | `/videos/:id?tab=script` | None (`:id` preserved) |
| `/videos/:id/recording` | `/videos/:id?tab=recording` | None (`:id` preserved) |
| `/videos/:id/editing` | `/videos/:id?tab=editing` | None (`:id` preserved) |
| `/videos/:id/final-review`| `/videos/:id?tab=final-review` | None (`:id` preserved) |
| `/videos/:id/thumbnail` | `/videos/:id?tab=thumbnail` | None (`:id` preserved) |
| `/videos/:id/publishing-package`| `/platform-packages` | **CRITICAL: Drops `:id` parameter!** |
| `/production-board` | `/videos` | None |
| `/questions/:id` (Draft ID) | `/questions/:id` | **CRITICAL: 404 if draft approved** |
