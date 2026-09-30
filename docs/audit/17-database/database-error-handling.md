# Database Error Handling & Resilience Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 33 of 39  

---

## 1. Error Hierarchy (`src/lib/google-sheets/errors.ts`)

BP-CMS implements a structured domain error hierarchy for persistence failures:

```
Error
 └── GoogleSheetsError (Base Domain Error)
      ├── WorksheetNotFoundError     (Tab missing from spreadsheet)
      ├── MissingHeaderError        (Expected column header not found)
      ├── RateLimitError            (HTTP 429 quota exceeded)
      ├── QuotaExceededError        (Daily / per-minute project quota hit)
      ├── CellUpdateError           (A1 cell write failure)
      └── RowAppendError            (Row append failure)
```

---

## 2. Error Propagation & Retry Policy

1. **Exponential Backoff:**  
   `GoogleSheetsClient` catches HTTP 429 and 503 errors and executes up to 3 retries with jittered exponential backoff (`1000ms * 2^attempt + random(200)`).
2. **Unhandled HTTP 400 (Bad Request):**  
   If an invalid value or cell formula error occurs, Google Sheets returns HTTP 400. `GoogleSheetsClient` wraps this in `GoogleSheetsError` and aborts without retrying.
3. **Route Error Transformation:**  
   In `src/server/routes.ts`, persistence errors are caught in global error-handling middleware:
   - `RateLimitError` -> HTTP 503 Service Unavailable (`"Database rate limit exceeded. Please retry."`)
   - `WorksheetNotFoundError` -> HTTP 500 Internal Error (`"Storage configuration error"`)
   - `MissingHeaderError` -> HTTP 500 Internal Error (`"Schema integrity failure"`)
