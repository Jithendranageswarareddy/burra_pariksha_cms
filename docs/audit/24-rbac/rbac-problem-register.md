# RBAC & Access Control Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 39 of 41  

---

| Finding ID | Classification | Severity | Affected Area | Root Cause & Description |
| :--- | :--- | :---: | :---: | :--- |
| **SEC-HIGH-01** | Missing Route-Level Guards | **HIGH** | Frontend Router | `App.tsx` only checks `!user`. Authenticated users can type any URL to mount unauthorized pages. |
| **SEC-HIGH-02** | Omitted Publishing Cascade | **HIGH** | Video State | `markPlatformPublished` omits updating `Video.status` in `VIDEOS` sheet. |
| **SEC-MED-01** | Role Aliasing Discrepancies | **MEDIUM** | Types & Services | Checks alternate between string literals ('CREATOR', 'EDITOR') and enum `UserRole`. |
| **SEC-MED-02** | Repository Passthrough Risk | **MEDIUM** | Repositories | Repositories have zero access control, relying 100% on callers to enforce authorization. |
| **SEC-LOW-01** | UI Direct Action Button Leak | **LOW** | UI Components | Disabled buttons sometimes display before permissions resolve. |
