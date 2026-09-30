# Route Parameter & ID Contract Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Dynamic Route Parameters in `src/App.tsx`

There are **4 distinct dynamic parameter names** across 32 dynamic routes:

| Parameter Name | Example Route | Expected Entity Type | Canonical ID Prefix | Observed Format in Code | Contract Match Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `:id` | `/questions/:id` | Question or Question Draft | `BP-Q-*` or `BP-DFT-*` | String (Alpha-numeric) | **AMBIGUOUS CONTRACT** |
| `:id` | `/content-masters/:id` | Content Master Unit | `BP-CNT-*` | String (`BP-CNT-000001`) | **CONFIRMED** |
| `:videoId` | `/videos/:videoId` | Video Production Unit | `BP-V-*` | String (`BP-V-000001`) | **CONFIRMED** |
| `:reviewId` | `/social-review/:reviewId`| Social Review Package | `BP-SR-*` / `BP-REV-*` | String | **CONFIRMED** |
| `:contentId` | `/social-analytics/:contentId`| Published Social Content | `BP-PUB-*` / `BP-V-*` | String | **CONFIRMED** |

---

## 2. Critical Contract Risk: Draft IDs vs Canonical Question IDs

### Evidence:
1. In `QuestionStudioPage.tsx`:
   - When a draft question is generated or saved, it receives an ID formatted as `BP-DFT-...`.
   - The user is then navigated via `navigate(`/questions/${savedDraft.id}/verify`)`.
2. In `QuestionVerifyApprovePage.tsx`:
   - The component extracts `const { id } = useParams()` and calls `apiClient.getQuestionById(id)`.
   - If the backend Google Sheets table only indexes canonical `BP-Q-*` questions, querying with a draft ID (`BP-DFT-*`) triggers a lookup fallback or error.
3. In `QuestionDetailPage.tsx`:
   - Accepts `:id` which can be either a draft ID or canonical question ID.

### Forensic Finding:
The route path `/questions/:id` does not differentiate between drafts and canonical verified questions. Both share the identical route pattern, requiring client and server code to inspect ID prefixes dynamically at runtime.
