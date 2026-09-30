# Role Assignment Forensic Flow

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 24 of 41  

---

## 1. How Roles Are Assigned

- **Mechanism:** Admin management via `TeamOperationsPage.tsx` or direct Google Sheets edit.
- **REST API:** `PUT /api/users/:id` and `POST /api/users`.
- **Authorization Guard:** Protected by `requireRole([UserRole.ADMIN])`. Only users with `ADMIN` role can create or alter user roles.
