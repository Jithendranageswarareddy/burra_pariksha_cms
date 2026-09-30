# Route Authorization Forensic Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 13 of 41  

---

## 1. Direct Route Access Vulnerability

- **Finding:** A user with role `STUDIO_PRESENTER` or `ANALYTICS_VIEWER` who navigates directly to `/publishing` will see the complete Publishing Dashboard UI mount.
- **Backend Protection:** When the user clicks "Schedule" or "Publish", the underlying `POST /api/publishing/...` rejects with `403 Forbidden: Insufficient role permissions`.
- **Verdict:** Page navigation protection is **Soft / UI-Only**, while data mutation is **Hard / Backend-Enforced**.
