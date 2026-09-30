# Stage 11: Published / Live Verification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 13 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 11 Published / Live
- **Canonical Purpose:** Live publication on YouTube Shorts, Instagram Reels, and Facebook Video with regex URL checks.
- **Current Implementation:** `PublishingPage.tsx`, `publishing.service.ts:markPlatformPublished`.
- **Active Route:** `/publishing`

---

## 2. Operational Flow Reconstructed

### INPUT
- Live platform post URLs (e.g. `https://youtube.com/shorts/...`, `https://instagram.com/reel/...`).

### WORK
- Validates URLs against strict platform regex patterns.
- Protects against duplicate cross-video URL registration.
- Records live publish timestamp.
- Increments `completedPlatformsCount` (1, 2, 3 of 3).
- Updates platform status to `PUBLISHED` in `PUBLISHING` worksheet.
- **Auto-initializes baseline tracking row** in `ANALYTICS` worksheet with 0 views.

### OUTPUT
- Verified live platform record in `PUBLISHING`.
- Baseline analytics row in `ANALYTICS`.

### STATE
- **Entity:** `Publishing` (`youtube.status = PUBLISHED`), `Video` (Status in `VIDEOS` sheet often remains `READY_TO_UPLOAD` due to uncoordinated cascade).
- **State Machine:** Social Publishing Machine.
- **Authoritative Storage:** Google Sheets (`PUBLISHING`, `ANALYTICS`).

### NEXT STAGE
- **Expected Canonical Next Stage:** 12 Platform Sync
- **Actual Implementation Next Stage:** Dispatches to `/platform-packages` or `/social-analytics/:id`.
- **Cascade Flaw:** Code fails to automatically advance `Video.status` to `UPLOADED` on the `VIDEOS` sheet.

---

## 3. Evidence & Status

- **Evidence:** `src/lib/services/publishing.service.ts:520-650`.
- **Implementation Status:** **FULLY IMPLEMENTED** (with video status cascade omission).
