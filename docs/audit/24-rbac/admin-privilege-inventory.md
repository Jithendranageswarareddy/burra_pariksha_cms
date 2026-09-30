# Admin Privilege Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 29 of 41  

---

## 1. Complete Scope of Administrator Authority

1. **Global Workflow Bypass:** In `requireRole`, `const isAdmin = userRoles.includes('ADMIN')` short-circuits all checks to `isAllowed = true`.
2. **Object Ownership Bypass:** In `objectAuthService.ts`, `if (this.isManagerOrAdmin(actor)) return true` allows modifying any question, video, script, thumbnail, or publishing record regardless of assignment.
3. **User Management:** Can create, edit, deactivate users, and reset passwords via `POST/PUT /api/users`.
4. **Disaster Recovery:** Exclusive access to `/api/recovery/restore/*` and full backup exporter.
5. **Sequence Modification:** Can inspect and alter sequence numbers in `SEQUENCES` sheet.
