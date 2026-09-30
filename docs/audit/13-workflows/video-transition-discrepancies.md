# Video Transition Matrix Discrepancy Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 06 of 30  

---

## 1. Summary of Forensic Discovery

A critical architectural defect exists in the video transition engine: **two conflicting definitions of `VALID_VIDEO_TRANSITIONS` exist in the codebase**, resulting in desynchronized behavior between frontend UI components and backend validation services.

- **Definition A (Backend Service):** `src/lib/services/video.service.ts:59–125`
- **Definition B (Configuration Constants):** `src/config/constants.ts:232–295`
- **UI Consumer:** `src/pages/VideoDetailPage.tsx:47, 239` imports **Definition B** from `constants.ts`
- **Backend Consumer:** `videoService` and Express routes execute **Definition A**

---

## 2. State-by-State Discrepancy Comparison

| State Name | Definition A (`video.service.ts`) Allowed Next States | Definition B (`constants.ts`) Allowed Next States | Discrepancy Detail & Severity |
| :--- | :--- | :--- | :--- |
| `EDITING` | `EDITED`, **`FINAL_REVIEW`**, `ON_HOLD`, `CANCELLED` | `EDITED`, `ON_HOLD`, `CANCELLED` | **HIGH**: Backend permits jumping directly from `EDITING` to `FINAL_REVIEW`; UI hides this button. |
| `EDITED` | `FINAL_REVIEW`, **`READY_TO_UPLOAD`**, `EDITING`, `ON_HOLD`, `CANCELLED` | `FINAL_REVIEW`, `EDITING`, `ON_HOLD`, `CANCELLED` | **CRITICAL**: Backend permits skipping QC (`READY_TO_UPLOAD`); UI correctly prevents it. |
| `FINAL_REVIEW` | `READY_TO_UPLOAD`, `EDITING`, `ON_HOLD`, `CANCELLED` | `READY_TO_UPLOAD`, `EDITING`, **`RECORDING`**, `ON_HOLD`, `CANCELLED` | **CRITICAL**: UI offers "Send back to Recording", but backend `videoService.validateTransition` throws 400 error! |

---

## 3. Operational Impact of the `FINAL_REVIEW` Discrepancy

When a QC Lead reviews a video in `VideoDetailPage.tsx` that has severe audio/lighting issues originating during filming:
1. The UI displays the transition option: **"Return to Recording"** (because `RECORDING` is listed in `constants.ts`).
2. The user clicks "Return to Recording", triggering `PATCH /api/videos/:id/status` with `{ status: "RECORDING" }`.
3. The server invokes `videoService.updateStatus(videoId, "RECORDING")`.
4. `videoService.validateTransition(VideoProductionStatus.FINAL_REVIEW, VideoProductionStatus.RECORDING)` checks **Definition A**.
5. `allowed` for `FINAL_REVIEW` in Definition A is `[READY_TO_UPLOAD, EDITING, ON_HOLD, CANCELLED]`.
6. `allowed.includes("RECORDING")` evaluates to **FALSE**.
7. The server throws:
   ```
   ValidationError: Illegal video production status transition from "FINAL_REVIEW" to "RECORDING". Allowed transitions: [READY_TO_UPLOAD, EDITING, ON_HOLD, CANCELLED]
   ```
8. The UI receives HTTP 400 and renders a red toast error: *"Failed to update status: Illegal video production status transition"*.
9. **Result:** The user is permanently blocked from sending defective takes back to filming from the QC screen.
