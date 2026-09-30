# Retrieval Path Execution Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 19 of 40  

---

## 1. Media Asset Retrieval Architecture

BP-CMS provides two distinct retrieval mechanisms:

### 1. Authenticated Backend Proxy Stream (Primary)
- **Routes:**
  - `GET /api/videos/:id/stream` (Streaming video with HTTP Range)
  - `GET /api/videos/:id/download` (Attachment download)
  - `GET /api/thumbnails/:id/download` (Thumbnail download)
  - `GET /api/media/download/:fileId` (Generic asset download)
- **Execution:** Backend validates user session via `requireAuth`, verifies object permission via `objectAuthService`, fetches binary stream from Drive API, and pipes chunks directly to Express `res`.

### 2. Direct Google Drive Web Links (Secondary)
- **Fields:** `driveFolderUrl`, `webViewLink`, `rawFootagePath`.
- **Format:** `https://drive.google.com/file/d/{fileId}/view`.
- **Behavior:** Redirects user to Google Drive UI. Requires the user to be logged into a Google account with Drive permissions.
