# Entity-by-Entity Data-Flow Reconstruction

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 06 of 35  

---

## 1. Question Entity Complete Data Flow

```
1. USER (Content Creator / SME)
   ↓ Inputs Telugu question text, 4 options, correct answer, explanation
2. FRONTEND (src/pages/questions/QuestionCreatePage.tsx)
   ↓ Client-side validation: character limits, option uniqueness
3. HOOK / BRIDGE (src/lib/api-client.ts -> createQuestionCanonical())
   ↓ Serializes to JSON payload with client-generated idempotencyKey
4. HTTP REQUEST (POST /api/questions)
   ↓ Transport over HTTPS with Bearer JWT
5. ROUTE CONTROLLER (src/server/routes.ts -> handleCreateQuestionRoute)
   ↓ Authentication gate: requireAuth (validates token against userSessionStates)
   ↓ Authorization gate: requireRole([ADMIN, CONTENT_MANAGER, QUESTION_EDITOR])
6. DOMAIN SERVICE (src/lib/services/question.service.ts -> createQuestionFromRequest)
   ↓ Idempotency registry check: inFlightRegistry & completedCache
   ↓ Taxonomy validation: taxonomyService.validateQuestionTaxonomy()
   ↓ Structural validation: QuestionCreationValidator.validateStructure()
   ↓ Multi-Layer Verification Engine: MultiLayerVerificationEngine.verify()
7. ID SERVICE (src/lib/services/id.service.ts -> allocateQuestionId())
   ↓ Mutex-locked sequence read & increment on SEQUENCES sheet
8. ANCHOR GENERATION (src/lib/services/content-master.service.ts)
   ↓ Appends new Content Master row in CONTENT_MASTERS tab (BP-CNT-######)
9. REPOSITORY PERSISTENCE (src/lib/repositories/questions.repository.ts)
   ↓ Appends canonical row to QUESTIONS tab (BP-Q-######)
   ↓ If error: triggers compensation delete of Content Master
10. AUXILIARY WRITES (Best-effort non-fatal)
    ↓ validationsRepository.saveValidationResult() -> VALIDATIONS tab
    ↓ workflowService.recordTransition() -> WORKFLOW_TRANSITIONS tab
    ↓ auditService.log() -> AUDIT_LOGS tab
11. RESPONSE & FRONTEND UPDATE
    ↓ HTTP 201 Created with Question JSON
    ↓ React component state updated; navigates to /questions/:id
```

---

## 2. Video Entity Complete Data Flow

```
1. USER (Content Manager / Lead)
   ↓ Clicks "Queue for Video Production" on Approved Question
2. FRONTEND (src/pages/questions/ApprovedQuestionsPage.tsx)
   ↓ Selects priority, assigns host and editor
3. API BRIDGE (src/lib/api-client.ts -> queueApprovedQuestion())
   ↓ POST /api/videos/queue
4. ROUTE HANDLER (src/server/routes.ts)
   ↓ requireAuth & role check (ADMIN or CONTENT_MANAGER)
5. DOMAIN SERVICE (src/lib/services/video.service.ts -> queueApprovedQuestion())
   ↓ Rule 1: Question must exist in QUESTIONS tab
   ↓ Rule 2: Question status must be APPROVED
   ↓ Rule 3: Question must not already be in production (videoStatus check)
   ↓ Rule 4: No existing non-cancelled video record
6. ID SERVICE (src/lib/services/id.service.ts -> allocateVideoId())
   ↓ Allocates BP-V-###### from SEQUENCES
7. REPOSITORY WRITES (3 Distinct Tab Writes)
   ↓ Write A: videosRepository.appendRecord(newVideo) -> VIDEOS tab
   ↓ Write B: questionVideosRepository.appendRecord(joinRow) -> QUESTION_VIDEOS tab
   ↓ Write C: questionsRepository.updateRecord(qId, { videoStatus: QUEUED }) -> QUESTIONS tab
8. AUXILIARY WRITES
   ↓ workflowService.recordTransition() -> WORKFLOW_TRANSITIONS tab
   ↓ auditService.log() -> AUDIT_LOGS tab
9. RESPONSE
   ↓ HTTP 200 OK with Video JSON
```
