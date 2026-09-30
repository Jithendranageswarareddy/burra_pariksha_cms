# Role to Page Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 10 of 41  

---

| Page / Route | Visible in Sidebar? | Direct URL Access? | Route Guard | Backend API Guarded? |
| :--- | :---: | :---: | :---: | :---: |
| `/dashboard` | All Roles | All Roles | `requireAuth` | Yes (`requireAuth`) |
| `/studio` | Creators / Admins | Any Authenticated | `requireAuth` | Yes (`requireAuth`) |
| `/questions/verify` | Reviewers / Admins | Any Authenticated | `requireAuth` | Yes (`requireAuth` + Role) |
| `/videos/:id` | Assigned Roles / Admins | Any Authenticated | `requireAuth` | Yes (`objectAuthService`) |
| `/publishing` | Publishers / Admins | Any Authenticated | `requireAuth` | Yes (`requireRole`) |
| `/analytics/*` | Viewers / Admins | Any Authenticated | `requireAuth` | Yes (`requireRole`) |
| `/recovery` (`/admin`) | **ADMIN ONLY** | Blocked in Page UI | `isAdmin` in Page | Yes (`requireRole([ADMIN])`) |
