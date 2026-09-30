# Stage 10: Publishing Setup & Gate D Checks

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 12 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 10 Publishing Setup
- **Canonical Purpose:** Multi-platform scheduling, platform slot configuration, and pre-publish readiness confirmation.
- **Current Implementation:** `PublishingPage.tsx`, `publishing.service.ts`, `publishingRepository`.
- **Active Route:** `/publishing`

---

## 2. Operational Flow Reconstructed

### INPUT
- Approved `SocialReviewPackage`, `Video`, `Thumbnail`, and `PinnedComment`.
- Target release schedule (ISO-8601 UTC timestamp) and platforms (YouTube, Instagram, Facebook).

### WORK
- Executes **Gate D Pre-Publish Readiness Audit** (`validatePublishReadiness`):
  1. `videoReady`: Video in `READY_TO_UPLOAD`
  2. `thumbnailReady`: Thumbnail marked `APPROVED`
  3. `pinnedCommentReady`: Pinned comment approved
  4. `scriptReady`: Script certified
  5. `metadataReady`: Titles and descriptions validated.
- Configures release slots per platform.
- Transitions publishing record status to `SCHEDULED`.

### OUTPUT
- Scheduled `Publishing` record (`PUB-######`).
- Persisted timestamp in `PUBLISHING` worksheet.

### STATE
- **Entity:** `Publishing`
- **Field:** `status`
- **Current State:** `SocialPublishStatus.SCHEDULED`
- **State Machine:** Social Publishing Machine.
- **Authoritative Storage:** Google Sheets (`PUBLISHING` tab).

### NEXT STAGE
- **Expected Canonical Next Stage:** 11 Published / Live
- **Actual Implementation Next Stage:** Remains on `/publishing` awaiting live post URL entry.
- **Mismatch:** None. Clean state progression.

---

## 3. Evidence & Status

- **Evidence:** `src/pages/PublishingPage.tsx`, `src/lib/services/publishing.service.ts:350-450`.
- **Implementation Status:** **FULLY IMPLEMENTED**
