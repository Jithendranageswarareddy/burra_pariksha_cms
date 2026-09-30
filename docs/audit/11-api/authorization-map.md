# Authorization & RBAC Forensic Map (48 Role-Gated Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 06 of 30  

---

## 1. Role Hierarchy & Permission Levels

BP-CMS defines six operational roles in `src/types/auth.types.ts`:
```
SUPER_ADMIN > ADMIN > MANAGER > SME / CREATOR > PRESENTER / EDITOR > VIEWER
```

---

## 2. Role-Gated Endpoint Audit Register (48 Endpoints)

| Endpoint Path | Method | Minimum Role Required | Enforced By | Failure Status |
| :--- | :--- | :--- | :--- | :---: |
| `/api/recovery/*` (14 endpoints) | ALL | `SUPER_ADMIN` | `requireRole('SUPER_ADMIN')` | `403 Forbidden` |
| `/api/team/roles` | `PATCH`| `ADMIN` | `requireRole('ADMIN')` | `403 Forbidden` |
| `/api/settings/*` (6 endpoints) | `POST/PATCH`| `ADMIN` | `requireRole('ADMIN')` | `403 Forbidden` |
| `/api/assignments/create` | `POST` | `MANAGER` | `requireRole('MANAGER')` | `403 Forbidden` |
| `/api/assignments/reassign` | `POST` | `MANAGER` | `requireRole('MANAGER')` | `403 Forbidden` |
| `/api/questions/:id/verify` | `POST` | `SME` (Verifier) | `requireRole('SME')` | `403 Forbidden` |
| `/api/videos/:id/final-qc` | `POST` | `ADMIN` / `LEAD` | `requireRole('LEAD')` | `403 Forbidden` |
| `/api/publishing/schedule` | `POST` | `MANAGER` | `requireRole('MANAGER')` | `403 Forbidden` |
| `/api/taxonomy/*` (4 endpoints) | `POST/DELETE`| `ADMIN` | `requireRole('ADMIN')` | `403 Forbidden` |

---

## 3. RBAC Security Gaps Discovered
1. **Unprotected Content Strategy Endpoints**: `POST /api/content-strategy/generate` does not enforce a role check; any authenticated viewer can trigger heavy Gemini AI strategy generations.
2. **Missing Video Delete Guard**: `DELETE /api/videos/:id` only checks session authentication, not administrative role!
