# HTTP Error Handling Forensic Audit (400, 401, 403, 404, 429, 500)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 13 of 30  

---

## 1. Overview of Backend HTTP Error Responses

Analysis of `src/server/routes.ts` confirms the distribution of HTTP error response codes emitted by the API:
- `400 Bad Request`: **146** handlers (Malformed inputs, missing fields, validation failures)
- `401 Unauthorized`: **5** handlers (Missing or expired session tokens)
- `403 Forbidden`: **48** handlers (Insufficient RBAC permissions)
- `404 Not Found`: **55** handlers (Unknown entity IDs)
- `429 Quota Exceeded`: Handled indirectly via upstream Google API responses
- `500 Internal Server Error`: **128** handlers (Unhandled exceptions, Sheets API network failures)

---

## 2. Client-Side HTTP Error Handling Matrix

| HTTP Status Code | Frontend Handling Pattern | UI Manifestation | Recovery Action Offered | Risk / Finding |
| :--- | :--- | :--- | :--- | :--- |
| **400 Bad Request** | Parses `res.json()` error string; renders inline or in banner | Red error alert above form | User edits invalid field and retries | Good when error is specific; poor when message is generic. |
| **401 Unauthorized** | Global auth interceptor or component redirect | Redirects user to `/login` | Re-enter credentials | In-progress form state is wiped out upon unexpected 401 redirect! |
| **403 Forbidden** | Renders "Access Denied" or logs warning | Banner: "You do not have permission" | None (Disabled UI) | Buttons frequently remain clickable even when user lacks role. |
| **404 Not Found** | Renders "Entity Not Found" empty state | Empty state container or redirect | Back to dashboard | Can trigger navigation loop if entity was deleted during workflow. |
| **429 Quota Exceeded**| Treated as generic `500` or network failure | Banner displaying raw quota text | None (User retries immediately) | Lack of exponential backoff leads to severe compounding quota exhaustion! |
| **500 Server Error** | Generic catch-all handler | "An internal error occurred" | "Retry" button (if present) | Retrying non-idempotent 500s risks duplicate entity creation. |
