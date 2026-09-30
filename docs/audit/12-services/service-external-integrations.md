# Service External Integrations Forensic Audit (18 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 13 of 30  

---

## 1. External Integration Overview

Across the 72 services, **18 services** establish integrations with external platforms, cloud SDKs, and third-party APIs:
1. **Google Sheets API v4**: Relational tabular database operations via `googleapis`.
2. **Google Drive API v3**: Large media file upload, streaming, and metadata tracking.
3. **Google Gen AI SDK (`@google/genai`)**: Gemini 2.5 Pro/Flash LLM and Imagen generation.
4. **YouTube Data API v3**: Video upload, thumbnail binding, and publication analytics.
5. **Meta Graph API (Instagram/Facebook)**: Multi-platform social publication hooks.

---

## 2. External Integration Register

| Service File | External Provider | SDK / API Used | Operations Performed | Authentication | Timeout / Retry |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `google-sheets.service.ts` | Google Cloud | `googleapis.sheets_v4` | Read, append, update rows across 18 tabs | Service Account JWT | 30s timeout; exponential backoff |
| `google-drive.service.ts` | Google Cloud | `googleapis.drive_v3` | Upload MP4s, verify permissions, create folders| Service Account JWT | 60s timeout; manual retry |
| `gemini.service.ts` | Google AI | `@google/genai` | LLM prompt completion, candidate question generation| Gemini API Key | 45s timeout; 2 retries |
| `phase26-copilot.service.ts`| Google AI | `@google/genai` | Workflow copilot multi-turn chat | Gemini API Key | 30s timeout; no retry |
| `publishing.service.ts` | YouTube / Google | `googleapis.youtube_v3` | Video upload, schedule, title/tag metadata | OAuth 2.0 User Token| 120s timeout; no auto-retry |
| `social-review.service.ts` | Meta Platforms | Meta Graph REST API | Post preview verification, hashtag check | OAuth Access Token | 15s timeout; no retry |
