# Feature Contract: FEAT-06 Video Rendering & Quality Inspection

**Feature ID:** `FEAT-06`  
**Feature Name:** Video Rendering & Quality Inspection  
**Workflow Steps:** Step 09 (Video Rendering / Composition) & Step 10 (Video QC & Approval)  
**Primary Hub:** Production Studio (`/production/board`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Composite audio, visual overlays, countdown animations, and captions into a high-definition 1080x1920 60fps MP4 video, followed by strict human quality inspection.
- **Goal:** Execute background job rendering with progress tracking and enforce final producer QC approval before publishing.

### 2. Business Acceptance Criteria
- Video render job executes asynchronously with progress emitted via Server-Sent Events (SSE).
- Render output validated: 1080x1920 resolution, H.264 video codec, AAC audio, duration 30–60 seconds, no audio drift ($\le 50\text{ms}$).
- Step 10 Human QC gate: Video Producer or Admin must visually inspect and sign off.

### 3. Domain Entities
- `VideoJobEntity`, `VideoRenderOutput`, `VideoQcInspection`, `MediaAssetRecord`.

### 4. Database Persistence
- **Collection:** `video_jobs`, `videos`
- **Keys:** `videoId` (UUID v4), `jobId`
- **Indexes:** `status + createdAt`, `questionId + isFinal`
- **Concurrency:** OCC `version` increment on state changes.

### 5. API Contract
- **Render Path:** `POST /api/v1/videos/render` (Step 09)
- **QC Approval Path:** `POST /api/v1/videos/:id/qc` (Step 10)
- **Envelope:** `ApiResponseEnvelope<VideoResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Production Studio (`/production/board`)
- **Layout:** Video Player with frame-by-frame scrubbing, audio sync visualizer, and QC pass/fail scorecard.

### 7. RBAC & Access Control
- **Required Capability:** `video:render` (Step 09), `video:qc` (Step 10)
- **Allowed Roles:** `VIDEO_EDITOR`, `PRODUCER`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 08 (Visuals Ready) $\to$ Step 09 (Video Rendered) $\to$ Step 10 (Video QC Approved)
- **Initial Status:** `RENDER_PENDING`
- **Target Status:** `READY_FOR_PUBLISHING` (Proceeds to Step 11)
- **Human Gate:** Mandatory Human Gate at Step 10 (`AP-009`).

### 9. Validation Schemas
- **Schema:** `RenderJobRequestSchema`, `VideoQcSchema` (Zod)
- **Rules:** Output codec `video/mp4`, duration $\le 60$s, bit rate $\ge 8000\text{kbps}$.

### 10. Error Handling & Codes
- `ERR_RENDER_PIPELINE_FAILED` (500 Internal Server Error)
- `ERR_AUDIO_VIDEO_SYNC_DRIFT` (422 Unprocessable Entity)
- `ERR_INVALID_VIDEO_DIMENSIONS` (400 Bad Request)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_VIDEO_RENDERED`, `AUDIT_VIDEO_QC_APPROVED`
- **Severity:** `INFO`
- **Payload:** Video ID, Duration, File Size, Render Time Ms, Inspector ID.

### 12. Realtime SSE Events
- **Topic:** `video.render.progress`, `video.qc.completed`
- **Payload:** `{ videoId, progressPct: 100, status: "READY_FOR_PUBLISHING" }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including render worker failure retry and OCC lock conflict during simultaneous QC reviews.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service / Cloud Tasks push queue, Google Drive storage, Firestore Native mode.

### 15. Rollback Safety Net
- Delete rendered video binary from Drive, mark job as `RENDER_FAILED`, reset workflow state to `RENDER_PENDING`.
