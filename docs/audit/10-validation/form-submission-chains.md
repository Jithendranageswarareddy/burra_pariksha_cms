# Form Submission Chains (End-to-End Traces for Top 10 Forms)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 23 of 30  

---

## 1. Top Form Submission Chains

### Chain 1: Question Studio Authoring (`FORM-02`)
```
FORM: Question Studio Wizard (src/pages/QuestionStudioPage.tsx)
PAGE: QuestionStudioPage (/studio)
ROUTE: /studio
PURPOSE: Author academic 4-option Telugu/English multiple-choice questions
USER/ROLE: SME / Content Creator

FIELDS:
- questionText (textarea)
- language (select: te/en)
- difficulty (select: EASY/MEDIUM/HARD)
- subjectId (select: UUID)
- topicId (select: UUID)
- subtopicId (select: UUID, optional)
- optionA..D (input[text])
- correctOption (select: A/B/C/D)
- explanation (textarea)
- tags (input[text])

REQUIRED FIELDS: questionText, language, difficulty, subjectId, topicId, optionA, optionB, optionC, optionD, correctOption, explanation
CLIENT VALIDATION: questionText length (10-500), distinct options (A!=B!=C!=D), explanation length >= 10
VALIDATION OWNER: QuestionStudioPage.tsx (UI) & question.service.ts (Domain)
API: POST /api/questions
SERVER VALIDATION: routes.ts lines 210-245 (checks required fields, enum validity, topic foreign key)
BUSINESS VALIDATION: question.service.ts (allocates unique sequential question ID Q-xxxx, sets status PENDING_VERIFICATION)
SERVICE: src/lib/services/question.service.ts -> createQuestion()
PERSISTENCE: Google Sheets QUESTIONS tab & CONTENT_MASTERS tab
AUDIT EVENT: Writes action "CREATE_QUESTION" to AUDIT_LOG tab
SUCCESS RESPONSE: HTTP 201 Created { success: true, question: Question }
ERROR RESPONSE: HTTP 400 Bad Request { error: string } | HTTP 500 Internal Server Error
UI SUCCESS STATE: Green confirmation banner; resets local wizard form state
UI ERROR STATE: Red error banner above step 4 buttons; form state preserved
RETRY: Manual button "Try Again" (Unsafe: no idempotency key; risk of duplicate question creation)
ROLLBACK: Absent (If CONTENT_MASTERS write fails, QUESTIONS row remains orphaned)
PARTIAL SAVE RISK: YES (PART-01: Multi-sheet write lacks distributed transaction)
OPTIMISTIC UPDATE: NO (Waits for API confirmation)
STALE DATA RISK: LOW
NAVIGATION: Programmatic navigate('/questions/' + id)
CONFIDENCE: CONFIRMED
```

### Chain 2: Video Recording Take Submission (`FORM-09`)
```
FORM: Video Recording Workspace (src/components/video/RecordingWorkspace.tsx)
PAGE: VideoDetailPage (/videos/:id?tab=recording)
ROUTE: /videos/:id
PURPOSE: Submit raw presenter recording Google Drive link and take metadata
USER/ROLE: Presenter / Video Lead

FIELDS:
- rawDriveUrl (input[url])
- takeNumber (input[number])
- presenterNotes (textarea)
- recordingDuration (input[number])

REQUIRED FIELDS: rawDriveUrl, takeNumber
CLIENT VALIDATION: rawDriveUrl contains "drive.google.com", takeNumber >= 1
VALIDATION OWNER: RecordingWorkspace.tsx & routes.ts
API: POST /api/videos/:id/record
SERVER VALIDATION: routes.ts line 682 (validates drive.google.com substring, video status READY_TO_RECORD)
BUSINESS VALIDATION: video.service.ts (transitions video status to RECORDED, updates take_count)
SERVICE: src/lib/services/video.service.ts -> recordTake()
PERSISTENCE: Google Sheets VIDEOS tab
AUDIT EVENT: Writes action "RECORD_TAKE" to AUDIT_LOG tab
SUCCESS RESPONSE: HTTP 200 OK { success: true, video: Video }
ERROR RESPONSE: HTTP 400 Bad Request | HTTP 404 Video Not Found
UI SUCCESS STATE: Green banner "Take recorded successfully"; advances tab to "editing"
UI ERROR STATE: Red error banner below Drive URL input; entered URL preserved
RETRY: User re-clicks "Submit Take" (Unsafe: increments take counter again)
ROLLBACK: Absent
PARTIAL SAVE RISK: NO (Single-tab update)
OPTIMISTIC UPDATE: NO
STALE DATA RISK: MEDIUM (Parent VideoDetailPage may retain pre-record video status)
NAVIGATION: Tab transition to editing workspace
CONFIDENCE: CONFIRMED
```
