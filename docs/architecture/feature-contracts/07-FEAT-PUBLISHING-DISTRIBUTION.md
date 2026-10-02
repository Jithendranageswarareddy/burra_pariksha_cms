# Feature Contract: FEAT-07 YouTube Multi-Platform Publishing

**Feature ID:** `FEAT-07`  
**Feature Name:** YouTube Multi-Platform Publishing  
**Workflow Steps:** Step 11 (Publishing Package Assembly) & Step 12 (Multi-Platform Distribution)  
**Primary Hub:** Distribution Hub (`/distribution/publishing`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Package video, thumbnail, SEO metadata, tags, and pinned comment into an atomic release package, and publish/schedule to YouTube Shorts via YouTube Data API v3.
- **Goal:** Provide reliable scheduling, idempotency tokens, and multi-platform packaging with instant unpublish capability.

### 2. Business Acceptance Criteria
- Complete publication payload: Video, Custom Thumbnail, SEO Title, Description, Tags, Pinned Comment.
- Idempotent upload via YouTube API with quota awareness; duplicate upload requests return cached publication metadata.
- Pinned comment automatically posted after video upload.

### 3. Domain Entities
- `PublishingPackageEntity`, `YouTubeReleaseRecord`, `PinnedCommentEntity`, `DistributionChannel`.

### 4. Database Persistence
- **Collection:** `publishing_packages`, `publications`
- **Keys:** `packageId` (UUID v4), `youtubeVideoId`
- **Indexes:** `status + scheduledTime`, `youtubeVideoId` (unique)
- **Concurrency:** OCC `version` increment.

### 5. API Contract
- **Package Path:** `POST /api/v1/publishing/package` (Step 11)
- **Execute Path:** `POST /api/v1/publishing/publish` (Step 12)
- **Envelope:** `ApiResponseEnvelope<PublishingResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Distribution Hub (`/distribution/publishing`)
- **Layout:** Release Package Inspector, Live YouTube Metadata Preview, Scheduled Time Picker, and Publish Action Bar.

### 7. RBAC & Access Control
- **Required Capability:** `publish:execute`
- **Allowed Roles:** `PUBLISHER`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 10 (Video QC Approved) $\to$ Step 11 (Package Assembled) $\to$ Step 12 (Published to YouTube)
- **Initial Status:** `READY_FOR_PUBLISHING`
- **Target Status:** `PUBLISHED` (Proceeds to Step 13 Analytics)
- **Human Gate:** Mandatory Human Confirmation before live dispatch.

### 9. Validation Schemas
- **Schema:** `PublishPackageRequestSchema`, `SchedulePublishSchema` (Zod)
- **Rules:** Title length 10–100 chars, description $\le 5000$ chars, tags 1–30 items, valid future timestamp if scheduled.

### 10. Error Handling & Codes
- `ERR_YOUTUBE_QUOTA_EXCEEDED` (429 Rate Limit)
- `ERR_YOUTUBE_AUTH_EXPIRED` (401 Unauthorized)
- `ERR_PACKAGE_INCOMPLETE` (422 Unprocessable Entity)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_VIDEO_PUBLISHED`
- **Severity:** `INFO`
- **Payload:** Package ID, YouTube Video ID, Scheduled Time, Publisher ID.

### 12. Realtime SSE Events
- **Topic:** `publication.status`
- **Payload:** `{ packageId, youtubeVideoId, status: "PUBLISHED", url: "https://youtu.be/..." }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including simulated YouTube API outage, network drop retry, and token refresh.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, YouTube Data API v3 OAuth2, Cloud Tasks for scheduled dispatch, Firestore Native mode.

### 15. Rollback Safety Net
- Change YouTube video privacy status to `private` or `unlisted`, mark package as `UNPUBLISHED`, emit rollback audit log.
