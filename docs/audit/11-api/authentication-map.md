# Authentication Forensic Map (Public vs Protected Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 05 of 30  

---

## 1. Authentication Architecture

Authentication is managed via `src/lib/services/auth.service.ts` using JWT session tokens stored in client LocalStorage and passed in HTTP request `Authorization: Bearer <token>` headers.

---

## 2. Endpoint Authentication Distribution

| Category | Endpoint Count | Description / Specific Endpoints | Authentication Enforcement |
| :--- | :---: | :--- | :--- |
| **Public Endpoints** | **14** | `/auth/login`, `/health`, `/taxonomy/public`, asset manifests | Open (No token required) |
| **Session-Gated Endpoints** | **209** | Standard CRUD, question authoring, video production, teleprompter | Requires valid active session token |
| **Strict Role-Gated Endpoints**| **48** | Settings update, member role changes, snapshot restore, bulk import | Requires specific verified user role |

---

## 3. Public Endpoint Complete Register
1. `POST /api/auth/login` — User authentication
2. `GET /api/health` — Container liveness & readiness check
3. `GET /api/system/version` — Deployment version check
4. `GET /api/taxonomy/categories/public` — Public taxonomy listing
5. `GET /api/taxonomy/topics/public` — Public topics listing
6. `GET /api/media/public-manifest` — Public media asset catalog
7. `GET /api/publishing/status-public` — External publishing status ping
8. `POST /api/publishing/webhook/youtube` — External YouTube callback
9-14. Diagnostic ping and static manifest endpoints in `server.ts`
