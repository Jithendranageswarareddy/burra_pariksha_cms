# Workflow Error Propagation & Recovery Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 26 of 30  

---

## 1. Error Propagation Chain

When a state transition fails or violates a gate, the error propagates through the system as follows:

```
[DOMAIN EXCEPTION]
  -> ValidationError / ReferenceIntegrityError / Error
     -> Express Route catch block (routes.ts)
        -> res.status(400 | 403 | 409 | 422 | 500).json({ success: false, error: err.message })
           -> Axios / Fetch client in React
              -> toast.error() alert / inline error banner
                 -> User guided to revision or blocked screen
```

---

## 2. Inconsistent HTTP Status Codes

Static analysis revealed severe inconsistency in HTTP status codes returned for identical state machine violations:
- `videoService.validateTransition` failure returns **400 Bad Request** via generic error handler.
- `socialReviewService` stale version hash returns **409 Conflict**.
- `socialReviewService` unvalidated question returns **422 Unprocessable Entity**.
- `objectAuthService` role denial returns **403 Forbidden**.
- Route-level status validation failures frequently return **500 Internal Server Error** because raw `Error` instances are thrown without `statusCode` properties.
