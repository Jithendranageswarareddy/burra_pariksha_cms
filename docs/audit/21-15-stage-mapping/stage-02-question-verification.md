# Stage 02: Question Verification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 04 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 02 Question Verification
- **Canonical Purpose:** 10-point pedagogical audit, solution proof check, editorial sign-off, and video production queueing.
- **Current Implementation:** `QuestionVerifyApprovePage.tsx`, `MultiLayerVerificationEngine`, `question.service.ts`, `video.service.ts`.
- **Active Route:** `/questions/:id/verify`

---

## 2. Operational Flow Reconstructed

### INPUT
- `QuestionDraft` (`BP-DFT-*`) or unapproved `Question` (`BP-Q-*`).
- Verification parameters (human review notes, AI verifier score).

### WORK
- Executes 10-point automated pedagogical audit (`MultiLayerVerificationEngine.verify()`).
- Checks mathematical derivation consistency, distractor plausibility, and Telugu grammar.
- On approval, allocates permanent sequence IDs:
  - Allocates `BP-Q-######` on `SEQUENCES`.
  - Creates Content Master `BP-CNT-######` on `CONTENT_MASTERS`.
  - Persists canonical row to `QUESTIONS`.
  - Deletes draft row from `QUESTION_DRAFTS`.
  - Automatically queues video project (`BP-V-######`) in `VIDEOS` worksheet.

### OUTPUT
- Canonical `Question` (`BP-Q-######`) with status `APPROVED`.
- Canonical `ContentMaster` (`BP-CNT-######`).
- Queued `Video` (`BP-V-######`) with status `QUEUED`.

### STATE
- **Entity:** `Question` (status: `APPROVED`, `videoStatus: QUEUED`), `Video` (status: `QUEUED`).
- **State Machine:** Question Lifecycle + Video Production Machine.
- **Authoritative Storage:** Google Sheets (`QUESTIONS`, `CONTENT_MASTERS`, `VIDEOS`).

### NEXT STAGE
- **Expected Canonical Next Stage:** 03 Audience Script
- **Actual Implementation Next Stage:** Dispatches to `/videos/:videoId?tab=script`.
- **Vulnerability Discovered:** Leaves old draft ID in browser address bar; refreshing triggers 404 (`BP-DFT-529472-5SOD` case).

---

## 3. Evidence & Status

- **Evidence:** `src/pages/QuestionVerifyApprovePage.tsx:250-320`, `src/lib/services/question-draft.service.ts:160-200`.
- **Implementation Status:** **FULLY IMPLEMENTED** (with URL refresh bug).
