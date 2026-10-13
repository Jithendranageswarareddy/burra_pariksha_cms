# Stage 08 — Thumbnail

## 3.1 Page Identity
- Shared route `/videos/:videoId?tab=thumbnail`; `ThumbnailWorkspace`; **Reviewed**.
  Related FC-013.

## 3.2 Purpose
- Create, preview, version, and approve thumbnail packaging.

## 3.3 Entry Condition
- Eligible video after QC and thumbnail capability.

## 3.4 Required Data
- Video/master reference, thumbnail versions, creative metadata, preview, and
  approval status.

## 3.5 GET Requests
- Typed video/thumbnail APIs load context; exact endpoints **UNVERIFIED**.

## 3.6 User Inputs
- Artwork/reference, title/copy, preview settings, version notes, and approval.

## 3.7 Defaults
- Existing thumbnail/version or configured creative preset; exact defaults **UNVERIFIED**.

## 3.8 Primary Action
- Save version and approve; approval does not publish or bypass social review.

## 3.9 API Request
- Thumbnail service API sends metadata/reference and status command; backend validates.

## 3.10 Backend Use Case
- Thumbnail service/intelligence, media integration, workflow, audit, repository.

## 3.11 Response
- Returns version/status; approved thumbnail satisfies packaging prerequisite.

## 3.12 Persistence
- Thumbnail metadata/version is Firestore-backed; binary asset is externalized.
  Exact transaction behavior **UNVERIFIED**.

## 3.13 Workflow State
- Thumbnail in progress → approved; revision remains Stage 08.

## 3.14 Audit
- Version and approval events require audit; exact coverage **UNVERIFIED**.

## 3.15 Error States
- Invalid asset, upload failure, missing QC, stale version, unauthorized approval,
  duplicate approval, and network failure.

## 3.16 Empty States
- No thumbnail: creative first-use state. No eligible video: explain QC prerequisite.

## 3.17 Next Action
- Approved asset proceeds to Social Review/packaging; failures stay retryable.

## 3.18 Role Visibility
- Packaging/creative roles edit and approve per capability matrix; backend gates.

## 3.19 Performance
- Preview thumbnails lazily, show upload progress, and avoid duplicate versions.
  Target: **TBD**.

## 3.20 Acceptance Criteria
- Thumbnail workspace/service exists. Version, approval, audit, and E2E coverage
  are **UNVERIFIED**.
