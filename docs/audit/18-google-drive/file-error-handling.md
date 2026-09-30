# File Storage Error Handling & Resilience Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 33 of 40  

---

## 1. Retry Policy & Transient Failure Handling

`GoogleDriveService.executeWithRetry()` implements bounded exponential backoff:
- **Maximum Retries:** 3 attempts.
- **Base Delay:** 1000ms (`backoff = 1000 * 2^(attempt - 1)`).
- **Retried Status Codes:** HTTP 408, 429, 500, 502, 503, 504.
- **Retried Network Errors:** `ECONNRESET`, `ETIMEDOUT`, `socket hang up`.

---

## 2. Non-Retryable Error Handling: `invalid_grant`
If the OAuth 2.0 refresh token expires or is revoked:
```typescript
if (err?.message?.includes('invalid_grant') || err?.response?.data?.error === 'invalid_grant') {
  throw new GoogleAuthError(
    'Google Drive OAuth refresh token is invalid, expired, or revoked. Update GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN in the runtime secret store.'
  );
}
```
The service aborts retries immediately and emits a clear diagnostic error message.
