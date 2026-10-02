# Feature Contract: FEAT-05 Visual Asset Generation & Drive Ingestion

**Feature ID:** `FEAT-05`  
**Feature Name:** Visual Asset Generation & Drive Ingestion  
**Workflow Steps:** Step 07 (Visual Asset Assembly) & Step 08 (Thumbnail Creation)  
**Primary Hub:** Media Lab (`/media/visuals`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Generate and assemble high-impact 9:16 background graphics, question overlays, option cards, countdown timer animations, and click-worthy 1280x720/1080x1920 YouTube thumbnails.
- **Goal:** Manage visual layers in Google Drive storage with deterministic SHA-256 hashes and Firestore metadata references.

### 2. Business Acceptance Criteria
- Visual asset generation with strict aspect ratio compliance (9:16 vertical short, 16:9 landscape preview).
- Automatic thumbnail text rendering with bilingual Telugu/English high-contrast typography.
- Zero orphaned assets: every visual record mapped to an active `questionId` or `scriptId`.

### 3. Domain Entities
- `VisualAssetEntity`, `ThumbnailEntity`, `MediaLayer`, `DriveAssetReference`.

### 4. Database Persistence
- **Collection:** `visual_assets`, `thumbnails`
- **Keys:** `assetId` (UUID v4), `driveFileId`
- **Indexes:** `questionId + assetType`, `sha256Hash` (unique)
- **Concurrency:** OCC `version` increment.

### 5. API Contract
- **Visuals Path:** `POST /api/v1/media/visuals`
- **Thumbnail Path:** `POST /api/v1/media/thumbnails`
- **Envelope:** `ApiResponseEnvelope<VisualAssetResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Media Lab (`/media/visuals`)
- **Layout:** Canvas stage preview, layer hierarchy tree, color palette picker, and thumbnail A/B comparison gallery.

### 7. RBAC & Access Control
- **Required Capability:** `media:upload`
- **Allowed Roles:** `DESIGNER`, `MEDIA_PRODUCER`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 06 (Audio Approved) $\to$ Step 07 (Visuals Ready) $\to$ Step 08 (Thumbnail Approved)
- **Initial Status:** `VISUALS_PENDING`
- **Target Status:** `VISUALS_APPROVED` (Proceeds to Step 09)
- **Human Gate:** Mandatory Human Approval at Step 08.

### 9. Validation Schemas
- **Schema:** `VisualAssetSchema`, `ThumbnailSchema` (Zod)
- **Rules:** Dimensions $1080\times1920$ (video) or $1280\times720$ (thumbnail), mime in (`image/png`, `image/webp`, `image/jpeg`).

### 10. Error Handling & Codes
- `ERR_INVALID_ASPECT_RATIO` (422 Unprocessable Entity)
- `ERR_DRIVE_QUOTA_EXCEEDED` (507 Insufficient Storage)
- `ERR_CHECKSUM_VERIFICATION_FAILED` (400 Bad Request)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_VISUAL_ASSET_CREATED`, `AUDIT_THUMBNAIL_APPROVED`
- **Severity:** `INFO`
- **Payload:** Asset ID, Dimensions, SHA-256 Hash, Designer ID.

### 12. Realtime SSE Events
- **Topic:** `visuals.updated`
- **Payload:** `{ assetId, type: "THUMBNAIL", status: "VISUALS_APPROVED" }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including corrupt image header detection and Drive retry resilience.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, Google Drive API v3, Firestore Native mode.

### 15. Rollback Safety Net
- Delete generated preview from Drive, restore previous thumbnail version, reset state to `VISUALS_PENDING`.
