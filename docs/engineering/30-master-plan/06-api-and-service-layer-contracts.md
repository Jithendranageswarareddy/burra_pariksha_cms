# Step 30: 06 — API & Service-Layer Contracts Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** API & Service Layer Contract Specifications  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. REST API Standard Conventions

All BP-CMS REST endpoints conform to standardized JSON response envelopes, HTTP status codes, and error formats:

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "requestId": "req-98f2b8a0-128a",
    "timestamp": "2026-09-29T18:00:00.000Z"
  }
}
```

### 1.2 Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition video from FILMED directly to PUBLISHED. Required state: EDITED_QC_PASSED.",
    "details": [
      { "field": "status", "expected": ["EDITING", "RAW_UPLOADED"], "received": "PUBLISHED" }
    ]
  },
  "metadata": {
    "requestId": "req-98f2b8a0-128a",
    "timestamp": "2026-09-29T18:00:00.000Z"
  }
}
```

---

## 2. Core REST Endpoint Inventory & Contracts

| Endpoint | Method | Required Roles | Payload (Zod) | Success Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | `{ email, password }` | `{ user, token }` | Authenticate user & issue session cookie |
| `/api/auth/me` | `GET` | Authenticated | None | `{ user }` | Fetch current session profile |
| `/api/questions` | `POST` | `QUESTION_CREATOR`, `ADMIN` | `CreateQuestionSchema` | `{ id, code, status }` | Author question & create draft record |
| `/api/questions/:id/verify` | `POST` | `REVIEWER`, `TOPIC_LEAD`, `ADMIN` | `{ notes, approved: true }` | `{ canonicalId, status }` | Verify question, canonicalize ID & advance |
| `/api/scripts` | `POST` | `SCRIPT_WRITER`, `ADMIN` | `CreateScriptSchema` | `{ id, contentId, status }`| Author teleprompter script |
| `/api/videos/:id/claim` | `POST` | `STUDIO_PRESENTER`, `ADMIN` | `{ presenterId }` | `{ videoId, status }` | Claim filming assignment |
| `/api/videos/:id/raw-upload` | `POST` | `STUDIO_PRESENTER`, `ADMIN` | `UploadRawSchema` | `{ driveRawFileId, status }`| Register raw video drive asset |
| `/api/videos/:id/claim-editing`| `POST`| `VIDEO_EDITOR`, `ADMIN` | `{ editorId }` | `{ videoId, status }` | Claim video editing & set EDITING status |
| `/api/videos/:id/qc-submit` | `POST` | `VIDEO_EDITOR`, `ADMIN` | `SubmitQCSchema` | `{ videoId, status }` | Submit edited MP4 for QC certification |
| `/api/publishing/schedule` | `POST` | `PUBLISHING_MANAGER`, `ADMIN` | `SchedulePublishSchema`| `{ publishId, status }` | Configure multi-platform publishing |
| `/api/publishing/:id/trigger` | `POST` | `PUBLISHER`, `ADMIN` | None | `{ publishJobId, status }`| Dispatch asynchronous publish worker job |
| `/api/analytics/sync` | `POST` | `ANALYTICS_VIEWER`, `ADMIN` | `{ range: '7d' }` | `{ syncedCount, status }` | Ingest external metrics from YouTube/Meta |

---

## 3. Idempotency & Concurrency Interceptors

To prevent duplicate record creation and race conditions during high concurrency:
1. **Idempotency-Key Header:** All mutating `POST` and `PUT` requests accept an optional `Idempotency-Key: <UUID>`. The server stores the result in Redis for 5 minutes and returns cached responses for identical requests.
2. **Optimistic Locking:** All entity update endpoints evaluate an `etag` or `version` timestamp before committing writes.
