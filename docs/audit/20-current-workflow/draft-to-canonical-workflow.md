# Draft-to-Canonical Workflow Reconstruction

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 28 of 41  

---

## 1. The `BP-DFT-*` to `BP-Q-*` Handoff & Root Cause Analysis

### The Critical Issue Investigated:
`Question with ID "BP-DFT-529472-5SOD" not found`

### Exact Execution Sequence in `QuestionVerifyApprovePage.tsx`:
1. **User loads draft:** Browser URL is `/questions/BP-DFT-529472-5SOD/verify`.
2. **Draft verification:** Draft loads successfully from `QUESTION_DRAFTS` worksheet.
3. **Approval action:** User clicks "Approve & Queue Video".
4. **Backend execution (`QuestionDraftService.approveDraft`):**
   - Allocates canonical ID `BP-Q-000003` on `SEQUENCES`.
   - Appends row to `QUESTIONS` tab.
   - Deletes draft row `BP-DFT-529472-5SOD` from `QUESTION_DRAFTS` tab.
5. **Frontend state update:** React state updates `question.id = "BP-Q-000003"`.
6. **The Failure Vector:**
   - **The browser URL is NOT updated via `navigate()` or `window.history.replaceState()`!**
   - The address bar remains `/questions/BP-DFT-529472-5SOD/verify`.
   - If the user reloads the browser, `useParams()` retrieves `BP-DFT-529472-5SOD`.
   - The query attempts to load the draft, but the draft was deleted in step 4.
   - The query then attempts to load it as a canonical Question from `QUESTIONS`, but it does not exist with that ID.
   - **Throws: 404 Question with ID "BP-DFT-529472-5SOD" not found.**
