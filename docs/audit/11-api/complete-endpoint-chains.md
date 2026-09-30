# Complete Endpoint Execution Chains (Top Canonical Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 30 of 30  

---

## 1. Deep Forensic Execution Chains

### Chain 1: `POST /api/questions` (Create Question)
```
ENDPOINT: API-007
METHOD: POST
ROUTE: /api/questions
FRONTEND CONSUMERS: QuestionStudioPage.tsx (handleSaveQuestion)
ROUTE DEFINITION: src/server/routes.ts line 210
CONTROLLER/HANDLER: Inline anonymous async (req, res) handler
AUTHENTICATION: Authenticated via Authorization: Bearer token
AUTHORIZATION: Creator role (RoleLevel >= 2)
REQUEST VALIDATION: routes.ts (checks questionText, subjectId, topicId, options)
REQUEST PAYLOAD: QuestionInputDTO (questionText, language, difficulty, subjectId, topicId, options, explanation)
SERVICE: src/lib/services/question.service.ts -> createQuestion()
BUSINESS RULES: Allocates sequential ID (Q-xxxx), sets status to PENDING_VERIFICATION
STATE TRANSITION: DRAFT -> PENDING_VERIFICATION
REPOSITORY: googleSheetsService
STORAGE: Google Sheets
PERSISTENCE: Appends row to QUESTIONS tab; appends row to CONTENT_MASTERS tab
AUDIT EVENT: Appends CREATE_QUESTION event to AUDIT_LOG tab
SUCCESS RESPONSE: HTTP 201 Created { success: true, question: Question }
ERROR RESPONSES: HTTP 400 Bad Request, HTTP 500 Internal Server Error
FRONTEND RESPONSE HANDLER: QuestionStudioPage.tsx sets question ID, triggers navigate()
UI REFRESH: Clears wizard state, refreshes QuestionLibrary table cache
NAVIGATION: Programmatic redirect to /questions/:id
SIDE EFFECTS: 4 sequential sheet writes (QUESTIONS, CONTENT_MASTERS, SEQUENCES, AUDIT_LOG)
CURRENT / LEGACY: CURRENT
PROBLEMS: Multi-sheet write lacks distributed transaction; partial save risk
EVIDENCE: routes.ts:210, question.service.ts:145, google-sheets.service.ts:312
CONFIDENCE: CONFIRMED
```
