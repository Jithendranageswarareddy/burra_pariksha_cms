# FEATURE CONTRACT: FC-013-THUMBNAIL-CREATIVE-CDN

## 1. Feature Identity
- **Feature ID**: FC-013
- **Feature Name**: Thumbnail Creative & CDN Delivery
- **Business Area**: Creative Production / Thumbnail Management
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Creative Media Context
- **Related Workflow Stage(s)**: Step 08 (Thumbnail)

---

## 2. Requirement
- **Business Requirement**: BR-007 (Thumbnail Creative & Multi-Aspect Cropping).
- **User Problem**: Thumbnails designed without multi-aspect crop testing look broken or have critical text cropped out when displayed across YouTube Shorts grid (9:16), regular search feeds (16:9), and Instagram explore (1:1).
- **Business Purpose**: Provide a thumbnail management workspace with live multi-aspect ratio crop previews (9:16, 16:9, 1:1), contrast verification, direct CDN asset linking, and workflow progression to Social Review.
- **Expected Capability**:
  - Thumbnail asset upload via resumable ticket (`POST /api/v1/publishing/:id/thumbnail`).
  - Multi-aspect crop preview rendering (9:16 Shorts, 16:9 Landscape, 1:1 Square).
  - Mobile feed preview simulation (rendering simulated YouTube/Instagram feed card).
  - Automated WebP compression & image dimensions validation ($\ge 1080\times 1920$).
  - Workflow transition to Step 09 (`SOC_IN_REVIEW`) upon approval.
- **Scope**: Thumbnail upload, multi-aspect preview, dimension validation, publishing package linking.
- **Explicit Non-Scope**: Video packaging (FC-015), multi-platform release (FC-016).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Designer uploads high-resolution 1080×1920 JPG/PNG. Backend verifies dimensions and generates WebP version.
  - Designer inspects 16:9 and 1:1 crops in preview console, adjusts focal center, and confirms.
  - Item transitions to Step 09 with `workflowStatus = T_APPROVED`.
- **Validation Acceptance**:
  - Uploading image smaller than 1080×1920 or non-image MIME type returns HTTP 400 `INVALID_THUMBNAIL_DIMENSIONS`.
- **Authorization Acceptance**:
  - Requires `THUMBNAIL_CREATE` or `THUMBNAIL_APPROVE` capability.
- **Cost Acceptance**:
  - Thumbnail served through public Cloud Storage CDN bucket with aggressive cache-control (`max-age=31536000`).
- **Audit Acceptance**:
  - `THUMBNAIL_UPLOADED` and `THUMBNAIL_CROPS_CONFIRMED` logged with dimensions and mediaAssetId.

---

## 4. Domain Entities
- **Entities Involved**: `ThumbnailAsset`, `MediaAsset`, `PublishingPackage`, `CropCoordinates`.
- **Entity Ownership**: Creative Assets Context.
- **Relationships**: A `PublishingPackage` references a primary `ThumbnailAsset`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `mediaAssetId`, `createdAt`.
- **Mutable Fields**: `focalPointX`, `focalPointY`, `squareCrop`, `landscapeCrop`, `isApproved`.
- **Lifecycle**: `T_DRAFT` $\to$ `T_APPROVED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `publishing_packages`, `media_assets`.
- **Document Structure**:
  ```typescript
  export interface ThumbnailData {
    mediaAssetId: string;
    cdnUrl: string;
    width: number;
    height: number;
    focalPoint: { x: number; y: number };
    crops: {
      vertical9x16: string;
      square1x1: string;
      landscape16x9: string;
    };
    approvedAt?: string;
    approvedBy?: string;
  }
  ```
- **Source of Truth**: Embedded in `publishing_packages.thumbnail` and tracked in `media_assets`.

---

## 6. API Contract
### 6.1 `POST /api/v1/publishing/:id/thumbnail`
- **Authentication**: Required.
- **Required Capability**: `THUMBNAIL_CREATE`.
- **Request Schema**:
  ```typescript
  {
    mediaAssetId: string,
    focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ thumbnail: ThumbnailData, nextStep: 9 }>`.

### 6.2 `GET /api/v1/publishing/:id/thumbnail/preview`
- **Authentication**: Required.
- **Response Schema**: `ApiResponseEnvelope<{ previewUrls: Record<string, string> }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/thumbnails` (Creative Studio Hub), `/thumbnails/:packageId` (Crop Workspace).
- **Allowed Roles / Capabilities**: `GraphicDesigner`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Three simultaneous preview frames: 9:16 (Shorts), 1:1 (Insta), 16:9 (Desktop feed).
  - Draggable focal point crosshair to reposition the center of interest for automated crops.
  - simulated YouTube mobile feed card rendering title, channel avatar, and thumbnail.

---

## 8. RBAC / Capability Contract
- **`THUMBNAIL_CREATE`**: Upload and adjust thumbnail crops.
- **`THUMBNAIL_APPROVE`**: Approve thumbnail and transition to Step 09.

---

## 9. Workflow Contract
- **Step 08 Entry**: QC approved in Step 07 (`QC_APPROVED`).
- **Step 08 Exit**: Thumbnail approved $\to$ Workflow transitions item to Step 09 (`SOC_IN_REVIEW`).

---

## 10. Validation Contract
- **Dimension Check**: Minimum width 1080px, minimum height 1920px.
- **Aspect Ratio**: 9:16 ($\pm 1\%$ tolerance).

---

## 11. Error Contract
- `400 BAD_REQUEST`: Image dimensions below required 1080×1920 resolution.
- `422 UNPROCESSABLE_ENTITY`: Package has not passed Step 07 QC.

---

## 12. Audit Contract
- **Events**: `THUMBNAIL_UPLOADED`, `THUMBNAIL_APPROVED`.
- **Payload**: `packageId`, `mediaAssetId`, `focalPoint`, `actorId`.

---

## 13. Realtime Contract
- **SSE Event**: `thumbnail.updated` broadcast to publishing team.

---

## 14. Job / Async Contract
- **Async Execution**: Optional Cloud Tasks worker generates automated WebP derivatives and multi-aspect crops.

---

## 15. AI Contract
- **Contrast / OCR Analysis**: Optional Gemini vision check to verify text contrast ratio and readability on mobile screens.

---

## 16. Media Contract
- **Storage**: Thumbnails stored in Google Cloud Storage public CDN bucket or Google Drive shared folder.

---

## 17. Analytics Contract
- **Metrics**: Thumbnail A/B click-through rate (CTR) telemetry once published.

---

## 18. Security Contract
- **File Header Validation**: Magic bytes verified to guarantee uploaded file is true JPG/PNG/WebP, not disguised executable.

---

## 19. Observability Contract
- **Logs**: Structured logs recording thumbnail image processing and dimension validation.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Negligible storage ($< 1\text{MB}$ per thumbnail) within GCS 5GB free tier.

---

## 21. Migration Contract
- **Legacy Parity**: Existing thumbnail URLs in Google Sheets mapped to `ThumbnailData`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-THM-01`: Focal point crop calculation generates valid bounding boxes.
  - `TC-THM-02`: Rejection of images below 1080×1920.
- **API Tests**:
  - `TC-THM-03`: `POST /api/v1/publishing/:id/thumbnail` updates package and transitions to Step 09.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-010, FC-012.
- **Stage 25 Node**: `D-12 (Media Assets)`, `D-16 (Publishing)`.
- **Downstream Consumers**: FC-014 (Social Review), FC-015 (Publishing Package).

---

## 24. Implementation Sequence
1. Define Thumbnail schemas (`src/types/thumbnail.ts`).
2. Implement crop calculation utility (`src/lib/media/crop.ts`).
3. Implement `/api/v1/publishing/:id/thumbnail` endpoints.
4. Build React Creative Studio crop workspace (`src/pages/thumbnails/`).
5. Verify against `TC-THM-01..03`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] 1080×1920 dimension validation enforced.
- [ ] Multi-aspect crop preview renders accurately in UI.
- [ ] Transition to Step 09 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 14.

---

## 29. Traceability
- **Stage 01**: BR-007
- **Stage 02**: DAC-006
- **Stage 07**: Step 08 Specification
- **Stage 10**: Creative Studio Hub
- **Stage 13**: `publishing_packages` schema
- **Stage 15**: `/api/v1/publishing/:id/thumbnail`
- **Stage 24**: TC-WF08-01..09
- **Stage 25**: Nodes `D-12`, `D-16`
