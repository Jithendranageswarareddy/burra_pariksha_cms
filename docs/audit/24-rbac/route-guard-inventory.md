# Route Guard Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 12 of 41  

---

## 1. Inventory of Frontend vs Backend Guards

| Route | Frontend Component Guard | Express API Guard | Authority |
| :--- | :--- | :--- | :--- |
| `/studio` | `App.tsx: !user` | `requireAuth` | Backend Express |
| `/questions/verify` | `App.tsx: !user` | `requireAuth`, `requireRole([REVIEWER, ADMIN])` | Backend Express |
| `/videos/:videoId` | `App.tsx: !user` | `requireAuth`, `objectAuthService.canAccessVideo` | Backend Service |
| `/social-review` | `App.tsx: !user` | `requireAuth`, `requireRole` | Backend Express |
| `/publishing` | `App.tsx: !user` | `requireAuth`, `requireRole([PUBLISHING_MGR, ADMIN])` | Backend Express |
| `/analytics/*` | `App.tsx: !user` | `requireAuth`, `requireRole([ANALYTICS_VIEWER, ADMIN])`| Backend Express |
| `/recovery` | `RecoveryAdminPage: isAdmin` | `requireRole([UserRole.ADMIN])` | Both Layers |
