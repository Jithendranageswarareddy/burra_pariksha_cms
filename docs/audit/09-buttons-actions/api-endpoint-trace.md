# API / Endpoint Trace Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 07 of 30  

---

## 1. Action-to-API Mapping Architecture

There are **270 registered API routes** declared in `src/server/routes.ts`. User actions in the frontend communicate with these routes either via the centralized `apiClient` (`src/lib/api-client.ts`) or direct `fetch` calls.

---

## 2. Definitive Action-to-Endpoint Trace Matrix

| Action ID | Triggering Component | Target API Endpoint | HTTP Method | Payload Summary | Backend Handler Function in `routes.ts` |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `ACT-AUTH-01` | `LoginPage.tsx` | `/api/auth/login` | `POST` | `{ email, password, role }` | `authService.login()` |
| `ACT-QSTU-01` | `QuestionStudioPage.tsx`| `/api/ai/generate-question` | `POST` | `{ topicId, difficulty, syllabusContext }` | `geminiClient.generateQuestion()` |
| `ACT-QSTU-02` | `QuestionStudioPage.tsx`| `/api/questions` | `POST` | Full `Question` entity data | `questionService.createQuestion()` |
| `ACT-QVER-01` | `QuestionVerifyApprovePage`| `/api/questions/:id/verify` | `POST` | `{ checklist, verifiedBy, notes }` | `questionService.verifyQuestion()` |
| `ACT-QVER-02` | `QuestionVerifyApprovePage`| `/api/questions/:id/reject` | `POST` | `{ reason, rejectedBy }` | `questionService.rejectQuestion()` |
| `ACT-SCPT-01` | `ScriptWorkspace.tsx` | `/api/scripts/:id/approve` | `POST` | `{ scriptText, durationSeconds }` | `scriptService.approveScript()` |
| `ACT-REC-01` | `RecordingWorkspace.tsx` | `/api/videos/:id/record` | `POST` | `{ rawVideoUrl, takes, bestTake }` | `videoService.updateRecordingStatus()` |
| `ACT-EDIT-01` | `EditingWorkspace.tsx` | `/api/videos/:id/submit-edit`| `POST` | `{ roughCutUrl, editNotes }` | `videoService.submitRoughCut()` |
| `ACT-QC-01` | `FinalReviewWorkspace.tsx` | `/api/videos/:id/approve-qc` | `POST` | `{ checklistScores, approvedBy }` | `videoService.approveFinalQC()` |
| `ACT-THUM-01` | `ThumbnailWorkspace.tsx` | `/api/videos/:id/thumbnail` | `POST` | `{ thumbnailUrl, textHook }` | `thumbnailService.saveThumbnail()` |
| `ACT-SOC-01` | `SocialReviewPage.tsx` | `/api/social-reviews/:id/approve`|`POST`| `{ reviewId, reviewerId, signoff }` | `socialReviewService.approveReview()` |
| `ACT-PUB-01` | `PublishingWorkspace.tsx` | `/api/publishing/schedule` | `POST` | `{ videoId, scheduledTime, platforms }`| `publishingService.scheduleRelease()` |
| `ACT-REST-01` | `RecoveryAdminPage.tsx` | `/api/recovery/restore` | `POST` | `{ snapshotId, confirmationPhrase }` | `fullSnapshotRestoreExecutionService.executeRestore()` |
| `ACT-TEAM-01` | `TeamOperationsPage.tsx` | `/api/team/reassign` | `POST` | `{ assignmentId, newAssigneeId }` | `assignmentService.reassign()` |
