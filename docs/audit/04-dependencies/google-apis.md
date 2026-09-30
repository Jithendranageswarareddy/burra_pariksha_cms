# Google APIs & SDKs Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Google SDK Inventory

The project utilizes exactly one official Google client library:
- **Package Name:** `googleapis`
- **Declared Version:** `^176.0.0`
- **Resolved Version:** `176.0.0`
- **Services Used:**
  1. **Google Sheets API v4 (`sheets_v4`):** Primary structured operational database across 21 core and reference worksheets.
  2. **Google Drive API v3 (`drive_v3`):** Binary media storage for video recordings, script drafts, and thumbnail images.

---

## 2. Authentication & Credential Architecture

| Google Service | Authentication Method | Credential Environment Variables |
| :--- | :--- | :--- |
| **Google Sheets API** | Service Account JWT (RSA SHA256) | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` |
| **Google Drive API** | OAuth 2.0 Web Client with Refresh Token (Fallback to Service Account) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`, `GOOGLE_REDIRECT_URI` |

---

## 3. Rate-Limiting & Concurrency Controls

- Implemented in `src/lib/google-sheets/client.ts`:
  - Outbound `RequestPressureLimiter` enforces token-bucket pacing (10 capacity, 1 token/sec).
  - Maximum 4 concurrent requests.
  - Minimum 60ms dispatch spacing.
  - Global HTTP 429 exponential backoff with circuit breaker.
