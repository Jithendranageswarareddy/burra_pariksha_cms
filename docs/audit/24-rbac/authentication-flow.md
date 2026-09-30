# Authentication Flow Forensic Reconstruction

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 03 of 41  

---

## 1. Operational Authentication Sequence

```
[User Enters Credentials] (userId/email + password)
             │
             ▼
[POST /api/auth/login] (Express API)
             │
             ▼
[AuthService.login()]
  ├─> Fetches user row from USERS sheet via UsersRepository
  ├─> Verifies account status (isActive === true)
  ├─> Executes crypto.timingSafeEqual with scrypt hash
  ├─> Increments last_login_at in USERS sheet
  └─> Mints HMAC-SHA256 token containing (userId, role, roles, sessionVersion)
             │
             ▼
[Set-Cookie: bp_session=<token>; HttpOnly; SameSite=Lax]
             │
             ▼
[Frontend AuthContext.tsx]
  ├─> Calls GET /api/auth/me on app mount
  └─> Stores user payload in React state (user, isLoading=false)
             │
             ▼
[Authenticated API Requests]
  └─> Express requireAuth middleware validates HMAC signature, expiration & sessionVersion
```
