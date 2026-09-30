# Critical End-to-End Data-Flow Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 32 of 35  

---

## 1. Trace 1: Question Creation
```
USER -> QuestionCreatePage -> api-client.ts -> POST /api/questions 
  -> requireAuth -> QuestionService.createQuestionFromRequest()
  -> MultiLayerVerificationEngine.verify()
  -> IdService.allocateQuestionId() [SEQUENCES Sheet]
  -> ContentMasterService.createContentMaster() [CONTENT_MASTERS Sheet]
  -> QuestionsRepository.appendRecord() [QUESTIONS Sheet]
  -> ValidationsRepository.saveValidationResult() [VALIDATIONS Sheet]
  -> WorkflowService.recordTransition() [WORKFLOW_TRANSITIONS Sheet]
  -> AuditService.log() [AUDIT_LOGS Sheet]
  -> HTTP 201 Created -> React Navigation
```

## 2. Trace 2: Video Production Queueing
```
USER -> ApprovedQuestionsPage -> api-client.ts -> POST /api/videos/queue
  -> requireAuth -> VideoService.queueApprovedQuestion()
  -> IdService.allocateVideoId() [SEQUENCES Sheet]
  -> VideosRepository.appendRecord() [VIDEOS Sheet]
  -> QuestionVideosRepository.appendRecord() [QUESTION_VIDEOS Sheet]
  -> QuestionsRepository.updateRecord({ videoStatus: QUEUED }) [QUESTIONS Sheet]
  -> WorkflowService.recordTransition() [WORKFLOW_TRANSITIONS Sheet]
  -> AuditService.log() [AUDIT_LOGS Sheet]
  -> HTTP 200 OK -> UI Notification
```

## 3. Trace 3: Raw Video Upload & Ingestion
```
USER -> RecordingWorkspace -> Multer Stream -> POST /api/videos/:id/upload
  -> requireAuth & objectAuthService
  -> GoogleDriveService.uploadFile() [Google Drive API v3 files.create]
  -> Returns driveFileId
  -> VideosRepository.updateRecord(id, { driveFileId }) [VIDEOS Sheet]
  -> MediaAssetsRepository.appendRecord() [MEDIA_ASSETS Sheet]
  -> VideoService.transitionStatus(RECORDED) [VIDEOS Sheet]
  -> QuestionsRepository.updateRecord({ videoStatus: RECORDED }) [QUESTIONS Sheet]
  -> HTTP 200 OK -> Player Displays Stream
```

## 4. Trace 4: Social Platform Publishing
```
USER -> PublishingWorkspace -> POST /api/videos/:id/publish-platform
  -> requireAuth -> PublishingService.markPlatformPublished()
  -> PublishingService.validatePublishReadiness()
  -> PublishingRepository.updateRecord() [PUBLISHING Sheet]
  -> WorkflowService.recordTransition() [WORKFLOW_TRANSITIONS Sheet]
  -> AuditService.log() [AUDIT_LOGS Sheet]
  -> AnalyticsService.recordAnalyticsSnapshot() [ANALYTICS Sheet]
  -> HTTP 200 OK -> Status Chips Turn Green
```

## 5. Trace 5: User Authentication & Session Token Flow
```
USER -> LoginPage -> POST /api/auth/login
  -> AuthService.login()
  -> UsersRepository.findById(userId) [USERS Sheet]
  -> AuthService.verifyPassword(password, user.passwordHash)
  -> jwt.sign({ userId, role })
  -> UsersRepository.setUserSessionState(token, version) [Node.js RAM Map]
  -> Returns { token, user }
  -> Client saves to localStorage.setItem('bp_session_token', token)
```
