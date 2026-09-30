# Critical Workflow Execution Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 39 of 41  

---

## 1. Trace 1: The Canonical Question Approval & Auto-Queue
```
1. User clicks "Approve & Queue Video" on /questions/BP-DFT-100001/verify
2. QuestionVerifyApprovePage invokes apiClient.approveQuestionDraft()
3. Backend QuestionDraftService allocates BP-Q-000005 and BP-CNT-000005
4. Appends to QUESTIONS and CONTENT_MASTERS worksheets
5. Deletes BP-DFT-100001 from QUESTION_DRAFTS
6. Frontend automatically invokes apiClient.queueQuestionForVideo(BP-Q-000005)
7. VideoService creates BP-V-000005 in VIDEOS with status QUEUED
8. Updates Question.videoStatus = QUEUED
9. Appends join row in QUESTION_VIDEOS
10. UI updates canonicalIds and loads journey stepper
```

## 2. Trace 2: The 3-Step QUEUED -> EDITING Jump
```
1. User on /videos/BP-V-000005?tab=recording uploads raw footage
2. File streams to Google Drive via POST /api/videos/BP-V-000005/upload
3. Drive returns fileId; video row updated with driveFileId
4. User clicks "Advance to Video Editing"
5. Request 1: PATCH /api/videos/BP-V-000005/status (QUEUED -> SCRIPT_READY)
6. Request 2: PATCH /api/videos/BP-V-000005/status (SCRIPT_READY -> RECORDED)
7. Request 3: PATCH /api/videos/BP-V-000005/status (RECORDED -> EDITING)
8. UI switches tab to ?tab=editing
```
