# Lifecycle Stage 02: Verification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 05 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | `QuestionDraft` (`BP-DFT-529472-5SOD`) |
| **Action** | "Approve Question" |
| **Resulting Entity** | `Question` (`BP-Q-000001`), `ContentMaster` (`BP-CNT-000001`), `Video` (`BP-V-000001`) |
| **State** | `Question.status = APPROVED`, `Video.status = QUEUED` |
| **Page / Component** | `QuestionVerifyApprovePage.tsx` |
| **Active Route** | `/questions/:id/verify` |
| **REST API** | `POST /api/questions/create-from-draft` |
| **Service Layer** | `question.service.ts:createQuestionFromDraft()`, `video.service.ts:queueApprovedQuestion()` |
| **Repository Layer** | `questionsRepository`, `contentMastersRepository`, `videosRepository`, `publishingRepository` |
| **Authoritative Storage**| Google Sheets `QUESTIONS`, `CONTENT_MASTERS`, `VIDEOS`, `PUBLISHING` |
| **Next Entity / State** | `Video` (`BP-V-000001`) -> Status `QUEUED` |

---

## 2. Critical Forensic Breakdown (The BP-DFT-529472-5SOD Case)

1. **Atomic Sequence Allocation:** `SequencesService.getNextSequence(SEQUENCE_ENTITIES.QUESTION)` safely increments sequence to generate `BP-Q-000001`.
2. **Draft Cleanup:** `questionDraftsRepository.deleteRecord(draftId)` successfully purges the draft row from `QUESTION_DRAFTS`.
3. **Cascade Initialization:** In `video.service.ts:queueApprovedQuestion`:
   - Appends `BP-V-000001` to `VIDEOS`.
   - Appends record to `QUESTION_VIDEOS`.
   - Creates blank publishing row `PUB-000001` in `PUBLISHING`.
4. **FATAL ROUTE ANOMALY (STG-HIGH-01):**
   - The frontend `QuestionVerifyApprovePage.tsx` executes approval via API.
   - The draft row is gone from the database/sheets.
   - However, the browser URL address bar remains `/questions/BP-DFT-529472-5SOD/verify`.
   - If the user reloads the browser, the component calls `GET /api/questions/BP-DFT-529472-5SOD`.
   - The backend checks `QUESTIONS` (not found) and `QUESTION_DRAFTS` (deleted), returning **HTTP 404: Draft Not Found**.
