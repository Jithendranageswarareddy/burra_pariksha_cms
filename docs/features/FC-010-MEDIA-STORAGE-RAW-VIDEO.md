# FEATURE CONTRACT: FC-010-MEDIA-STORAGE-RAW-VIDEO

## 1. Feature Identity
- **Feature ID**: FC-010
- **Feature Name**: Google Drive Media Storage & Raw Video
- **Business Area**: Media Management / Tri-Layer Storage & Ingestion
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Media Architecture Context
- **Related Workflow Stage(s)**: Step 05 (Raw Video)

---

## 2. Requirement
- **Business Requirement**: BR-005 (Secure Media Ingestion & Google Drive Integration) & NFR-007 (Tri-Layer Binary Isolation).
- **User Problem**: Uploading large multi-gigabyte video files directly through application web servers crashes container memory, exceeds Cloud Run payload limits, and introduces severe network latency.
- **Business Purpose**: Provide a resilient, tri-layer media pipeline where video binaries are streamed directly to external Google Drive storage via resumable upload tickets, while Firestore tracks metadata, file hashes, and referential integrity.
- **Expected Capability**:
  - Direct-to-Drive resumable upload ticket issuance (`POST /api/v1/media/upload-ticket`).
  - Strict binary isolation: Video binaries **never** pass through backend application memory.
  - Client-side SHA-256 checksum calculation verified against Drive file metadata.
  - Creation of `MediaAsset` record (`med_` prefix) linked to `VideoTake` and `Video` entities.
  - Raw Video Ingestion workspace (`/video/raw`).
  - Automatic workflow transition to Step 06 (`E_IN_PROGRESS`) upon verified upload.
- **Scope**: Upload ticket generation, Drive OAuth2 adapter, SHA-256 verification, media metadata persistence, raw video hub.
- **Explicit Non-Scope**: Video proxy transcoding (FC-011), YouTube publishing distribution (FC-016).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Studio operator selects filmed raw MP4/MOV file. Frontend requests upload ticket from backend.
  - File is uploaded in 10MB chunks directly to designated Google Drive folder.
  - Upload completes; backend verifies file size and SHA-256 hash. `MediaAsset` document created with `mediaStatus = READY`.
  - Item transitions to Step 06 with `workflowStatus = V_INGESTED`.
- **Integrity Acceptance**:
  - Mismatched SHA-256 hash marks media record `mediaStatus = FAILED` and alerts user to re-upload.
- **Security Acceptance**:
  - Temporary upload tickets expire after 60 minutes and restrict write access to the specific designated folder.
- **Cost Acceptance**:
  - ₹0.00 infrastructure egress: Zero Google Cloud Storage egress costs incurred during raw upload by utilizing shared Google Drive storage.
- **Audit Acceptance**:
  - `RAW_VIDEO_UPLOADED` and `MEDIA_CHECKSUM_VERIFIED` logged with `fileSize`, `driveFileId`, and `sha256Hash`.

---

## 4. Domain Entities
- **Entities Involved**: `MediaAsset`, `MediaReference`, `Video`, `RawVideoManifest`.
- **Entity Ownership**: Media Bounded Context.
- **Relationships**: A `Video` entity owns one or more `MediaReference` records pointing to `MediaAsset`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `driveFileId`, `sha256Hash`, `byteSize`, `mimeType`, `uploadedBy`, `createdAt`.
- **Mutable Fields**: `mediaStatus`, `storageUri`, `thumbnailUri`.
- **Lifecycle**: `PENDING_UPLOAD` $\to$ `VERIFYING` $\to$ `READY` | `FAILED` $\to$ `ARCHIVED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `media_assets`, `media_references`, `videos`.
- **Document Structure**:
  ```typescript
  export interface MediaAssetDocument extends BaseEntity {
    id: string; // med_ + UUIDv4
    driveFileId: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    sha256Hash: string;
    storageLayer: 'GOOGLE_DRIVE' | 'GCS_HOT' | 'COLD_ARCHIVE';
    storageUri: string;
    mediaStatus: MediaStatus;
    uploadedBy: string;
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(driveFileId)` and `(uploadedBy, createdAt DESC)`.
- **Source of Truth**: Firestore `media_assets` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/media/upload-ticket`
- **Authentication**: Required.
- **Required Capability**: `MEDIA_UPLOAD`.
- **Request Schema**:
  ```typescript
  {
    fileName: z.string(),
    mimeType: z.string(),
    byteSize: z.number().positive(),
    entityType: z.enum(['VIDEO_RAW', 'THUMBNAIL', 'EDITED_MASTER']),
    entityId: string
  }
  ```
- **Response Schema**:
  ```typescript
  ApiResponseEnvelope<{
    ticketId: string,
    resumableUploadUrl: string,
    mediaAssetId: string,
    expiresAt: string
  }>
  ```

### 6.2 `POST /api/v1/media/:id/verify-checksum`
- **Authentication**: Required.
- **Required Capability**: `MEDIA_UPLOAD`.
- **Request Schema**: `{ sha256Hash: z.string().length(64) }`.
- **Response Schema**: `ApiResponseEnvelope<{ mediaAsset: MediaAssetDocument, isVerified: boolean }>`.

### 6.3 `POST /api/v1/videos/raw`
- **Authentication**: Required.
- **Required Capability**: `VIDEO_CREATE`.
- **Request Schema**: `{ scriptId: string, mediaAssetId: string, takeId?: string }`.
- **Response Schema**: `ApiResponseEnvelope<{ video: VideoDocument, nextStep: 6 }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/video/raw` (Raw Video Ingestion), `/video/upload` (Upload Modal).
- **Allowed Roles / Capabilities**: `VideoEditor`, `Presenter`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Drag-and-drop file upload zone supporting `.mp4`, `.mov`, `.mkv`.
  - Resumable chunked progress bar showing upload percentage, transfer rate, and time remaining.
  - Client-side Web Workers calculating SHA-256 in background during upload.
  - Video preview player rendering Google Drive stream upon completion.

---

## 8. RBAC / Capability Contract
- **`MEDIA_UPLOAD`**: Authorizes upload ticket generation.
- **`VIDEO_CREATE`**: Authorizes linking raw media to video manufacturing pipeline.

---

## 9. Workflow Contract
- **Step 05 Entry**: Filming marked complete in Step 04 (`F_COMPLETED`).
- **Step 05 Exit**: Raw video file verified and ingested $\to$ Workflow transitions item to Step 06 (`RAW_VIDEO_INGESTED`).

---

## 10. Validation Contract
- **MIME Type Validation**: Must be `video/mp4`, `video/quicktime`, or `video/x-matroska`.
- **Size Boundary**: Max file size 4GB for raw take uploads.
- **Checksum Verification**: Server verifies Drive file MD5/SHA matches client-reported hash.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Unsupported MIME type or invalid file size.
- `422 UNPROCESSABLE_ENTITY`: Checksum mismatch between client and Drive.
- `502 BAD_GATEWAY`: Google Drive API unreachable.

---

## 12. Audit Contract
- **Events**: `MEDIA_TICKET_ISSUED`, `RAW_VIDEO_INGESTED`, `MEDIA_CHECKSUM_FAILED`.
- **Payload**: `mediaAssetId`, `driveFileId`, `byteSize`, `uploadedBy`.

---

## 13. Realtime Contract
- **SSE Event**: `video.raw_uploaded` broadcast to editing team.

---

## 14. Job / Async Contract
- **Drive Polling Job**: Optional fallback job verifying upload completion if client disconnects before sending completion ping.

---

## 15. AI Contract
- **Applicable**: No.

---

## 16. Media Contract
- **Tri-Layer Enforcement**:
  - Active: Google Drive for video files.
  - Metadata: Firestore for records and hashes.
  - RAM: Zero binary caching in Node.js server.

---

## 17. Analytics Contract
- **Metrics**: Total storage consumed by raw footage (GB).

---

## 18. Security Contract
- **Token Security**: Google Drive Service Account / OAuth2 refresh tokens stored exclusively in GCP Secret Manager (`GOOGLE_DRIVE_CREDENTIALS`).
- **Short-Lived Upload URLs**: Upload ticket URLs expire in 3600 seconds.

---

## 19. Observability Contract
- **Metrics**: Histogram `media.upload_duration_seconds`, counter `media.checksum_failures_total`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Uses team Google Drive workspace storage; zero Cloud Storage egress.

---

## 21. Migration Contract
- **Legacy Parity**: Existing Drive folders indexed and mapped into `media_assets`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-MED-01`: Upload ticket generator creates compliant Google Drive resumable session.
  - `TC-MED-02`: SHA-256 verification confirms matching hashes and flags corruption.
- **API Tests**:
  - `TC-MED-03`: `POST /api/v1/media/upload-ticket` returns valid ticket envelope.
  - `TC-MED-04`: Linking media asset transitions workflow to Step 06.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-009.
- **Stage 25 Node**: `D-12 (Media Assets)`, `D-13 (Media References)`.
- **Downstream Consumers**: FC-011 (Editing Bay), FC-012 (Final QC), FC-013 (Thumbnails).

---

## 24. Implementation Sequence
1. Define Media schemas (`src/types/media.ts`).
2. Implement Google Drive API adapter (`src/lib/drive/drive-adapter.ts`).
3. Implement `MediaRepository` and checksum verification service.
4. Implement `/api/v1/media/*` and `/api/v1/videos/raw` endpoints.
5. Create React chunked file uploader component (`src/components/media/ChunkedUploader.tsx`).
6. Verify against `TC-MED-01..04`.

---

## 25. Deployment Contract
- **Required Secrets**: `GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY` (in GCP Secret Manager).
- **Required Env Vars**: `DRIVE_RAW_FOLDER_ID`, `DRIVE_MASTERS_FOLDER_ID`.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. External Drive files remain untouched.

---

## 27. Feature Completion Criteria
- [ ] Direct-to-Drive resumable upload works without server memory bloat.
- [ ] SHA-256 checksum verified on upload completion.
- [ ] MediaAsset metadata saved to Firestore.
- [ ] Workflow transitions cleanly to Step 06.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Tri-layer architecture fully specified in Stage 14.

---

## 29. Traceability
- **Stage 01**: BR-005, NFR-007
- **Stage 02**: DAC-005
- **Stage 07**: Step 05 Specification
- **Stage 10**: Video Hub Architecture
- **Stage 13**: `media_assets`, `media_references` schemas
- **Stage 14**: Authoritative Tri-Layer Media Architecture
- **Stage 15**: `/api/v1/media/*`
- **Stage 24**: TC-WF05-01..09
- **Stage 25**: Nodes `D-12`, `D-13`
