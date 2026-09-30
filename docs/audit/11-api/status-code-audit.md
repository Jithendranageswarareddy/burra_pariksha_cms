# HTTP Status Code Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 19 of 30  

---

## 1. Status Code Frequency Distribution

Analysis of `src/server/routes.ts` confirms the distribution of explicit HTTP status codes returned across all endpoints:
- `200 OK`: 27 explicit declarations (plus Express default for `res.json()`)
- `201 Created`: 24 explicit declarations (Resource creation endpoints)
- `207 Multi-Status`: 1 explicit declaration (Batch processing partial success)
- `400 Bad Request`: **146** declarations (Parameter, validation, and format failures)
- `401 Unauthorized`: **5** declarations (Missing or expired session tokens)
- `403 Forbidden`: **48** declarations (RBAC permission denials)
- `404 Not Found`: **55** declarations (Unknown entity IDs)
- `500 Internal Server Error`: **128** declarations (Unhandled exceptions & storage failures)

---

## 2. Status Code Inconsistencies Discovered
1. **POST Creation Returning 200 instead of 201**: Several entity creation routes (e.g. `POST /api/videos/:id/record`, `POST /api/assignments/create`) return `res.status(200)` instead of the canonical REST `201 Created`.
2. **Missing 422 Unprocessable Entity**: Semantic business rule validation failures (e.g. invalid status transitions) return `400 Bad Request` instead of `422`.
