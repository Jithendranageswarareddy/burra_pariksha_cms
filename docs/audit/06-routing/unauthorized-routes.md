# Unauthorized Route Access Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Client-Side RBAC Discrepancies

Because `src/App.tsx` mounts all 78 authenticated child routes inside `<Layout />` without route-level guard components (e.g. `<AdminGuard>` or `<RoleGuard>`), several administrative routes are exposed to client-side unauthorized navigation:

| Route Path | Expected Role | Observed Client Route Guard | Observed Backend Protection | Vulnerability Profile |
| :--- | :--- | :--- | :--- | :--- |
| `/recovery` | `ADMIN` only | None (Sidebar link hidden from non-admins) | `/api/recovery/*` enforces 403 on API requests | **OBSERVED:** Direct URL bar access renders recovery dashboard UI |
| `/admin` | `ADMIN` only | None | 403 on API requests | **OBSERVED:** Direct URL bar access renders recovery dashboard UI |
| `/settings` | `ADMIN` only | None (Sidebar link hidden) | 403 on admin configuration changes | **OBSERVED:** Direct URL bar access renders system settings UI |
| `/team` | `CONTENT_LEAD`, `ADMIN` | None | 403 on unauthorized assignments | **OBSERVED:** Any team member can view team workload screen |

---

## 2. Risk Assessment
- **Severity: MEDIUM.** The server strictly validates sessions and returns 403 on data writes, preventing actual privilege escalation or data corruption. However, the client UI reveals internal operational metrics, snapshot lists, and team capacity data to any authenticated user who navigates directly to the URL.
