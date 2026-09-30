# First Hard Break Forensic Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 26 of 35  

---

## 1. Identification of the FIRST HARD BREAK

> **The First Hard Break occurs in STAGE 02 (Question Verification) upon Browser Reload.**

### Forensic Profile:
- **Break ID:** `BRK-HD-01`
- **Stage:** 02 Question Verification
- **Previous Successful Step:** Stage 01 Question Generation & Initial Verification Load
- **Failed Step:** Browser Refresh / Subsequent Navigation via Address Bar
- **Entity Involved:** `QuestionDraft` (`BP-DFT-529472-5SOD`)
- **HTTP Code:** `404 Not Found`
- **Error Message:** `Question with ID "BP-DFT-529472-5SOD" not found`

---

## 2. Root Cause Analysis

1. `QuestionVerifyApprovePage.tsx` mounts on route `/questions/:id/verify`.
2. When the user approves the draft:
   - `questionService.createQuestionFromDraft(draftId)` generates canonical IDs (`BP-Q-000001`, `BP-CNT-000001`, `BP-V-000001`).
   - It invokes `questionDraftsRepository.deleteRecord(draftId)`.
   - The draft row is permanently removed from the Google Sheet.
3. The frontend updates local component state, but **does not replace the browser URL** with the new canonical ID (`window.history.replaceState` or `navigate('/questions/BP-Q-000001/verify', { replace: true })` is omitted).
4. If the user hits refresh (F5), `useParams()` extracts the old draft ID.
5. The API handler searches `QUESTIONS` (not found under draft ID) and `QUESTION_DRAFTS` (deleted), returning **HTTP 404**.
6. The entire UI crashes into the error boundary.
