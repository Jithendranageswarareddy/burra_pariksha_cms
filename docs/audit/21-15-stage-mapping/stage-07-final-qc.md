# Stage 07: Final QC Certification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 09 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 07 Final QC
- **Canonical Purpose:** 6-point Master QC certification (1080x1920 9:16 safe-zones, audio LUFS, Telugu typo check).
- **Current Implementation:** `VideoDetailPage.tsx?tab=final-review`, `FinalReviewWorkspace.tsx`, `ProductionAssetValidationService`.
- **Active Route:** `/videos/:id?tab=final-review`

---

## 2. Operational Flow Reconstructed

### INPUT
- Edited master video (`finalRenderPath` or `driveFileId`).
- Master QC checklist:
  1. 9:16 aspect ratio (1080x1920) confirmed
  2. UI safe zones unobstructed (bottom 20%, top 10%)
  3. Audio normalized to -14 LUFS (no clipping)
  4. Telugu subtitle orthography verified (zero typos)
  5. 3-second hook engagement verified
  6. Final duration within 45–60 seconds limit.

### WORK
- Producer / Lead reviews video playback in embedded player.
- Audits and signs off all 6 checklist checkpoints.
- Calls `ProductionAssetValidationService.determineReadiness()`.
- Transitions video status from `FINAL_REVIEW` to `READY_TO_UPLOAD`.

### OUTPUT
- Certified QC sign-off audit log.
- Video status updated to `READY_TO_UPLOAD` in `VIDEOS` sheet.

### STATE
- **Entity:** `Video`
- **Field:** `status`
- **Current State:** `VideoProductionStatus.READY_TO_UPLOAD`
- **State Machine:** Video Production Machine (`VALID_VIDEO_TRANSITIONS`).
- **Authoritative Storage:** Google Sheets (`VIDEOS` tab).

### NEXT STAGE
- **Expected Canonical Next Stage:** 08 Thumbnail Studio
- **Actual Implementation Next Stage:** Switches tab to `/videos/:id?tab=thumbnail`.
- **Rejection Loop:** If QC fails, returns to `EDITING` with reviewer critique.

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/FinalReviewWorkspace.tsx`, `src/lib/services/production-asset-validation.service.ts`.
- **Implementation Status:** **FULLY IMPLEMENTED**
