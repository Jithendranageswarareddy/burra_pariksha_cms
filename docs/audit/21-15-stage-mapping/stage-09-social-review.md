# Stage 09: Social Review & Packaging

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 11 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 09 Social Review
- **Canonical Purpose:** 9:16 smartphone simulator review, title/copy packaging, tags, hashtags, and pinned comment sign-off.
- **Current Implementation:** `SocialReviewPage.tsx`, `social-review.service.ts`, `pinned-comment.service.ts`, `socialReviewsRepository`.
- **Active Route:** `/social-review/:reviewId`

---

## 2. Operational Flow Reconstructed

### INPUT
- QC-approved `Video` (`BP-V-######`), approved `Thumbnail` (`BP-T-######`), and `Question` text.
- Pinned comment draft and social hashtags.

### WORK
- Renders 9:16 vertical smartphone preview frame with realistic YouTube/Instagram UI overlays.
- Allows live editing of hook title, platform descriptions, and hashtags.
- Executes automated AI packaging copilot (`Phase26CopilotService`).
- Reviews and approves Telugu pinned comment (`BP-PIN-######`).
- Persists approved social package bundle in `SOCIAL_REVIEWS` worksheet.

### OUTPUT
- Approved `SocialReviewPackage` (`SR-######`).
- Certified pinned comment (`pinnedCommentReady = true`).

### STATE
- **Entity:** `SocialReviewPackage` (status: `APPROVED`), `PinnedComment` (status: `APPROVED`).
- **State Machine:** Social Review Lifecycle.
- **Authoritative Storage:** Google Sheets (`SOCIAL_REVIEWS`, `PINNED_COMMENTS`).

### NEXT STAGE
- **Expected Canonical Next Stage:** 10 Publishing Setup
- **Actual Implementation Next Stage:** Dispatches to `/publishing`.
- **Mismatch:** None.

---

## 3. Evidence & Status

- **Evidence:** `src/pages/SocialReviewPage.tsx`, `src/lib/services/social-review.service.ts:220-300`.
- **Implementation Status:** **FULLY IMPLEMENTED**
