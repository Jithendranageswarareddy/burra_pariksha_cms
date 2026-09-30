# API-to-Storage Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 08 of 35  

---

## 1. API Routing & Middleware Pipeline

All inbound API requests enter `src/server/routes.ts` through Express router endpoints.

```
INBOUND HTTP REQUEST
  ↓
1. CORS & JSON Body Parser
  ↓
2. requireAuth Middleware (Validates JWT & Checks in-memory session version)
  ↓
3. requireRole Middleware (Enforces role whitelist against user.role)
  ↓
4. objectAuthService Middleware (Fine-grained object ownership verification)
  ↓
5. Request Body Validation (Zod schema parse OR imperative boundary checks)
  ↓
6. Domain Service Invocation (Encapsulates business rules and multi-repository actions)
  ↓
7. Repositories (googleSheetsClient API calls)
  ↓
8. HTTP Response Serialization (JSON response payload)
```

### Bypass Audit:
- **Direct Sheets/Drive Access in Routes:** Zero route handlers bypass domain services to query Google Sheets or Google Drive directly. 100% of API endpoints route through service layer abstractions.
- **Direct Database Queries:** Zero SQL queries exist in any route handler.
