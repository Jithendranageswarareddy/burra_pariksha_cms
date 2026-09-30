# Complete Route Problem & Risk Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Forensic Route Problem Register

| ID | Category | Route(s) | Severity | Confidence | Problem Description |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **RT-01** | DUPLICATE | `/videos/:id/*` vs `/production/:id/*` (11 pairs) | **HIGH** | CONFIRMED | Dual parallel route hierarchies for video production create redundant routing paths. |
| **RT-02** | DUPLICATE | `/team` vs `/team-work` | **LOW** | CONFIRMED | Duplicate routes render identical `TeamOperationsPage` without canonical redirect. |
| **RT-03** | DUPLICATE | `/recovery` vs `/admin` | **LOW** | CONFIRMED | Duplicate routes render identical `RecoveryAdminPage` without canonical redirect. |
| **RT-04** | ORPHAN | `/admin`, `/team-work`, `/videos/platform-packages` | **MEDIUM**| CONFIRMED | Declared routes have zero inbound links or navigation triggers in application UI. |
| **RT-05** | LEGACY | 18 redirect shims for deprecated step pages | **MEDIUM**| CONFIRMED | Outdated step page paths remain declared as redirects rather than normalized. |
| **RT-06** | ID_MISMATCH | `/questions/:id` & `/questions/:id/verify` | **HIGH** | CONFIRMED | Accepts both draft IDs (`BP-DFT-*`) and canonical IDs (`BP-Q-*`) without contract discrimination. |
| **RT-07** | MISDIRECTED | `/videos/:videoId/publishing-package` | **MEDIUM**| CONFIRMED | Redirect strips `:videoId` parameter, forwarding user to unparameterized `/platform-packages`. |
| **RT-08** | MISDIRECTED | `/videos/pinned-comment` | **MEDIUM**| CONFIRMED | Forwards user to generic `/production` rather than pinned comment workspace. |
| **RT-09** | UNAUTHORIZED | `/recovery`, `/admin`, `/settings`, `/team` | **MEDIUM**| CONFIRMED | No client-side route guards on administrative routes; direct address bar navigation mounts protected views. |
| **RT-10** | STALE | `/production-board` -> `/production?status=EDITING` | **LOW** | CONFIRMED | Relies on legacy pipeline filter string rather than canonical 15-stage workflow status. |
