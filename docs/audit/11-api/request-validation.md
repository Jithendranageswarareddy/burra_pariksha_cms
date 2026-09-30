# Request Validation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 07 of 30  

---

## 1. Request Validation Architecture

Validation across the 270 endpoints in `src/server/routes.ts` is performed using two complementary patterns:
1. **Imperative Inline Parameter Checks**: Directly inspecting `req.body`, `req.params`, and `req.query` (146 occurrences of `res.status(400).json({ error: ... })`).
2. **Declarative Zod Schema Parsing**: Calling `schema.safeParse(req.body)` before dispatching to underlying services (18 occurrences).

---

## 2. Request Validation Distribution by Layer

| Validation Mechanism | Endpoints Covered | Primary Validations Checked | Failure Response |
| :--- | :---: | :--- | :---: |
| **Inline Imperative Guard** | 184 endpoints | Required field existence, empty string checks, string type | `400 Bad Request` |
| **Zod DTO Schema Parse** | 37 endpoints | Type coercion, enum values, array bounds, UUID regex | `400 Bad Request` |
| **Entity ID Existence Guard** | 55 endpoints | Verifying entity exists in Sheets before mutation | `404 Not Found` |
| **Role / RBAC Guard** | 48 endpoints | Verifying user role against endpoint permissions | `403 Forbidden` |
| **Unvalidated Raw Body** | 12 endpoints | Endpoints passing `req.body` directly to service without pre-validation | Varies by service |

---

## 3. Validation Discrepancy Findings
- **Unvalidated Raw Object Passthrough**: Endpoints such as `PATCH /api/videos/:id/metadata` pass `req.body` directly to `videoService.updateMetadata` without checking for unknown or malicious property keys.
- **Missing Path Parameter Sanitization**: `req.params.id` is passed directly into Google Sheets queries without validating format or preventing injection.
