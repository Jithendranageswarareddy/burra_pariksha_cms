# FEATURE CONTRACT: FC-016-PLATFORM-RELEASE-SYNC

## 1. Feature Identity
- **Feature ID**: FC-016
- **Feature Name**: External Platform Release & Sync
- **Business Area**: Distribution / Multi-Platform Integration & Sync
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: External Integrations Context
- **Related Workflow Stage(s)**: Step 12 (Platform Sync)

---

## 2. Requirement
- **Business Requirement**: BR-008 (Multi-Platform Publishing) & BR-010 (Platform Synchronization & Token Governance).
- **User Problem**: Manual uploading of video files to YouTube and Instagram creates duplicate effort, inconsistent metadata, broken link tracking, and risks operator credential leaks.
- **Business Purpose**: Provide an automated multi-platform distribution engine that uploads verified publishing packages to YouTube Shorts and Instagram Reels via authorized OAuth2 connections, captures remote platform video IDs, and synchronizes live publication status into BP-CMS.
- **Expected Capability**:
  - YouTube Data API v3 integration for video upload, title, description, tags, and category assignment.
  - Meta Graph API / Instagram Graph API integration for Instagram Reels publishing.
  - Creation and maintenance of `Publication` records tracking remote platform video ID (`remoteVideoId`), platform URL, and upload status.
  - Automatic token refresh management for OAuth2 access tokens.
  - Distribution Hub UI (`/distribution`) with real-time sync status badges.
  - Workflow transition to Step 12 (`SYNC_OK`).
- **Scope**: Platform upload worker, OAuth2 token refresh, publication status synchronization.
- **Explicit Non-Scope**: Analytics view tracking (FC-020).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Live publishing package triggers upload job. YouTube API worker uploads master video directly from Drive storage.
  - Remote video ID (e.g., `dQw4w9WgXcQ`) and canonical URL captured in `publications` record.
  - Item transitions to Step 12 with `publicationStatus = SYNC_OK`.
- **Failure & Retry Acceptance**:
  - If platform API returns rate limit (HTTP 429) or transient 5xx, worker applies exponential backoff with jitter and retries up to 3 times before setting `SYNC_ERROR`.
- **Security Acceptance**:
  - Platform OAuth2 client secrets and refresh tokens stored strictly in GCP Secret Manager.
- **Audit Acceptance**:
  - `PLATFORM_SYNC_STARTED`, `PLATFORM_SYNC_COMPLETED`, and `PLATFORM_SYNC_FAILED` events logged with remote IDs and error codes.

---

## 4. Domain Entities
- **Entities Involved**: `Publication`, `PlatformAccount`, `PlatformSyncLog`.
- **Entity Ownership**: Platform Integrations Context.
- **Relationships**: A `PublishingPackage` produces one `Publication` per target platform.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `packageId`, `platform`, `createdAt`.
- **Mutable Fields**: `remoteVideoId`, `remoteUrl`, `syncStatus`, `syncErrorMessage`, `lastSyncedAt`.
- **Lifecycle**: `SYNC_PENDING` $\to$ `SYNCING` $\to$ `SYNC_OK` | `SYNC_FAILED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `publications`, `platform_accounts`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface PublicationDocument extends BaseEntity {
    id: string; // pbc_ + UUIDv4
    packageId: string;
    platform: 'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS' | 'TELEGRAM';
    remoteVideoId?: string;
    remoteUrl?: string;
    syncStatus: 'SYNC_PENDING' | 'SYNCING' | 'SYNC_OK' | 'SYNC_FAILED';
    syncErrorMessage?: string;
    publishedAt: string;
    lastSyncedAt: string;
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(platform, syncStatus, lastSyncedAt DESC)`.
- **Source of Truth**: Firestore `publications` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/publications/:id/sync`
- **Authentication**: Required.
- **Required Capability**: `PLATFORM_SYNC`.
- **Request Schema**: `{}`.
- **Response Schema**: `ApiResponseEnvelope<{ publication: PublicationDocument, nextStep: 12 }>`.

### 6.2 `GET /api/v1/publications`
- **Authentication**: Required.
- **Required Capability**: `PUBLISHING_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ publications: PublicationDocument[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/distribution` (Distribution Hub), `/distribution/:id` (Sync Detail).
- **Allowed Roles / Capabilities**: `Publisher`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Platform cards showing live status icons (YouTube logo with green "Live" badge and direct clickable link).
  - Manual "Retry Sync" button on failed publications.
  - Live video preview embedded via YouTube IFrame player once sync completes.

---

## 8. RBAC / Capability Contract
- **`PLATFORM_SYNC`**: Authorizes initiating or retrying platform synchronization.

---

## 9. Workflow Contract
- **Step 12 Entry**: Released in Step 11 (`PUB_RELEASED`).
- **Step 12 Exit**: Remote platforms return valid video IDs $\to$ Workflow transitions to Step 12 (`SYNC_OK`), unlocking Step 13 (Analytics).

---

## 10. Validation Contract
- **Remote ID Validation**: YouTube ID must match 11-character regex `[a-zA-Z0-9_-]{11}`.

---

## 11. Error Contract
- `429 TOO_MANY_REQUESTS`: YouTube upload quota exceeded (10,000 units/day). Handled gracefully with scheduled backoff.
- `502 BAD_GATEWAY`: Platform API connection failure.

---

## 12. Audit Contract
- **Events**: `PLATFORM_SYNC_COMPLETED`, `PLATFORM_SYNC_FAILED`.
- **Payload**: `packageId`, `platform`, `remoteVideoId`, `remoteUrl`.

---

## 13. Realtime Contract
- **SSE Event**: `platform.synced` broadcast upon successful upload.

---

## 14. Job / Async Contract
- **Cloud Tasks Worker**: Long-running video upload executed asynchronously via `CloudTasksQueue: platform-upload-worker` with 10-minute timeout.

---

## 15. AI Contract
- **Applicable**: No.

---

## 16. Media Contract
- **Direct Streaming**: Worker streams video binary from Google Drive straight to YouTube API via resumable chunked HTTP POST.

---

## 17. Analytics Contract
- **Source Link**: `remoteVideoId` stored here is the critical foreign key consumed by FC-020 (Analytics Ingestion).

---

## 18. Security Contract
- **Token Isolation**: OAuth2 refresh tokens encrypted in GCP Secret Manager (`YOUTUBE_OAUTH_REFRESH_TOKEN`).

---

## 19. Observability Contract
- **Metrics**: Counter `platform_sync.uploads_total{platform, status}`, histogram `platform_sync.duration_seconds`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. YouTube API v3 and Instagram Graph API are free within daily quota limits. Cloud Tasks within 1M free tier.

---

## 21. Migration Contract
- **Legacy Parity**: Existing YouTube video URLs mapped into historical `Publication` records.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-PLT-01`: YouTube API client handles token refresh and error parsing.
  - `TC-PLT-02`: Remote ID format validation.
- **API Tests**:
  - `TC-PLT-03`: `POST /api/v1/publications/:id/sync` enqueues upload task and returns envelope.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-010, FC-015.
- **Stage 25 Node**: `D-17 (Platforms)`, `D-18 (Publications)`.
- **Downstream Consumers**: FC-020 (Telemetry Ingestion).

---

## 24. Implementation Sequence
1. Define Publication schemas (`src/types/publication.ts`).
2. Implement YouTube Data API client adapter (`src/lib/platforms/youtube.ts`).
3. Implement `PublicationRepository` and sync worker.
4. Implement `/api/v1/publications/*` endpoints.
5. Build React Distribution Hub UI (`src/pages/distribution/`).
6. Verify against `TC-PLT-01..03`.

---

## 25. Deployment Contract
- **Required Secrets**: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Published remote videos are unlisted or left intact.

---

## 27. Feature Completion Criteria
- [ ] YouTube API integration tested with mock upload.
- [ ] Publication document records `remoteVideoId` and live URL.
- [ ] Transition to Step 12 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 05, 07, 10, 15, and 17.

---

## 29. Traceability
- **Stage 01**: BR-008, BR-010
- **Stage 02**: DAC-006
- **Stage 07**: Step 12 Specification
- **Stage 10**: Distribution Hub Architecture
- **Stage 13**: `publications` schema
- **Stage 15**: `/api/v1/publications/*`
- **Stage 17**: Background Task Upload Engine
- **Stage 24**: TC-WF12-01..09
- **Stage 25**: Nodes `D-17`, `D-18`
