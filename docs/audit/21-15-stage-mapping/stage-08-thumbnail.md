# Stage 08: Thumbnail Studio

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 10 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 08 Thumbnail Studio
- **Canonical Purpose:** High-CTR curiosity framing thumbnail design with mobile preview and Drive asset link.
- **Current Implementation:** `VideoDetailPage.tsx?tab=thumbnail`, `ThumbnailWorkspace.tsx`, `thumbnail.service.ts`, `thumbnailsRepository`.
- **Active Route:** `/videos/:id?tab=thumbnail`

---

## 2. Operational Flow Reconstructed

### INPUT
- Parent Question curiosity hook headline.
- High-resolution image asset (JPEG/PNG up to 5MB, 1080x1920 recommended).

### WORK
- Graphic designer uploads thumbnail image.
- Enforces byte limit: rejected if > 5MB (`file.size > 5 * 1024 * 1024`).
- Streams file to Google Drive `Thumbnails` folder.
- Generates base64 data URI preview for client UI.
- Allocates `BP-T-######` and version `BP-T-######-V1`.
- Appends rows to `THUMBNAILS` and `THUMBNAIL_VERSIONS` worksheets.
- Automatically synchronizes `Publishing.thumbnailReady = true` if status is `APPROVED`.

### OUTPUT
- `Thumbnail` record (`BP-T-######`) with Drive share URL.
- Synchronized publishing readiness flag.

### STATE
- **Entity:** `Thumbnail` (status: `APPROVED`), `Publishing` (`thumbnailReady: true`).
- **State Machine:** Thumbnail Lifecycle.
- **Authoritative Storage:** Google Sheets (`THUMBNAILS`) + Google Drive (Binary).

### NEXT STAGE
- **Expected Canonical Next Stage:** 09 Social Review
- **Actual Implementation Next Stage:** Dispatches to `/social-review/:reviewId` (or `?tab=social`).
- **Mismatch:** None. Direct handoff to Stage 09.

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/ThumbnailWorkspace.tsx`, `src/lib/services/thumbnail.service.ts:102-180`.
- **Implementation Status:** **FULLY IMPLEMENTED**
