# Database Connection Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 03 of 39  

---

## 1. Connection Path & Execution Flow

The application executes persistence operations over HTTPS REST API calls to Google APIs:

```
[Frontend / Client]
       │
       ▼ (HTTP REST / JSON)
[Express Server: src/server/routes.ts]
       │
       ▼ (TypeScript Method Call)
[Domain Services: src/lib/services/*.service.ts]
       │
       ▼ (Repository Method Call)
[Repository: src/lib/repositories/*.repository.ts]
       │
       ▼ (Inherited BaseRepository CRUD)
[src/lib/repositories/base.repository.ts]
       │
       ▼ (API Wrapper Call)
[GoogleSheetsClient: src/lib/google-sheets/client.ts]
       │
       ├── Credentials Present?
       │     ├── YES: googleapis.google.sheets({ version: 'v4', auth: JWT })
       │     │          │
       │     │          ▼ (HTTPS POST/GET to sheets.googleapis.com)
       │     │     [Google Sheets Cloud Infrastructure]
       │     │
       │     └── NO: BaseRepository.fallbackStore (Local in-memory Map)
```

---

## 2. Authentication & Connection Initialization

### Module: `src/lib/google-sheets/client.ts`
- **Auth Provider:** `google.auth.JWT`
- **Scopes Requested:**
  - `https://www.googleapis.com/auth/spreadsheets` (Full read/write access to Google Sheets)
  - `https://www.googleapis.com/auth/drive` (Full read/write access to Google Drive)
- **Credential Sourcing:**
  - `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `process.env.GOOGLE_PRIVATE_KEY` (Parsed to replace literal `\n` with true newlines)
- **Spreadsheet Sourcing:**
  - Primary CMS Spreadsheet: `process.env.SPREADSHEET_ID`
  - Secondary Analytics Spreadsheet: `process.env.ANALYTICS_SPREADSHEET_ID`
  - Test/Fallback Spreadsheet: `process.env.TEST_SPREADSHEET_ID`

---

## 3. Connection Pool & Transport Characteristics

1. **HTTP/2 Transport:**  
   Google APIs client library utilizes standard Node.js HTTPS agent. It does NOT maintain a stateful TCP connection pool like PostgreSQL `pg.Pool` or MySQL connection pools. Every batch of requests executes over HTTPS sessions.
2. **Connection Lifecyle:**  
   The `JWT` client is created once as a singleton during `GoogleSheetsClient` initialization and reused across all incoming requests. Token refresh is managed automatically by the `google-auth-library` when access tokens expire (1-hour lifespan).
3. **Timeouts:**  
   No explicit HTTP request timeout is configured on the `sheets` client instance. Calls rely on standard Node.js socket timeouts, exposing long-running requests to unbounded latency if Google APIs experience degradation.
4. **Retry Logic & Backoff:**  
   `GoogleSheetsClient` implements an exponential backoff retry loop for HTTP 429 (Rate Limit Exceeded) and HTTP 503 (Service Unavailable):
   - Maximum retries: 3 attempts
   - Base delay: 1000ms with jitter
5. **Rate Limits & Quota Constraints:**  
   - Google Sheets API v4 imposes a quota of **300 requests per minute per project** and **60 requests per minute per user**.
   - Under concurrent multi-user load, batch updates easily exhaust quota, triggering 429 errors.
