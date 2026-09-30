# Critical Lifecycle Forensic Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 32 of 35  

---

## 1. Trace 1: The Draft Canonicalization Hand-off
```
1. POST /api/questions/create-from-draft { draftId: 'BP-DFT-529472-5SOD' }
2. SequencesService.getNextSequence('QUESTION') -> 'BP-Q-000001'
3. ContentMasterService.createContentMaster() -> 'BP-CNT-000001'
4. QuestionsRepository.appendRecord('BP-Q-000001') -> QUESTIONS sheet
5. QuestionDraftsRepository.deleteRecord('BP-DFT-529472-5SOD') -> QUESTION_DRAFTS sheet
6. VideoService.queueApprovedQuestion('BP-Q-000001') -> 'BP-V-000001' on VIDEOS sheet
7. PublishingRepository.appendRecord('PUB-000001') -> PUBLISHING sheet
```

## 2. Trace 2: The Direct Editing Transition Bypass
```
1. User clicks "Open in Editing Bay" on Queued Video
2. Direct PATCH /api/videos/:id/status { status: 'EDITING' } throws 400
3. RecordingWorkspace interceptor executes sequential jumps:
   a. PATCH /api/videos/:id/status { status: 'RECORDING' } -> 200 OK
   b. PATCH /api/videos/:id/status { status: 'RECORDED' } -> 200 OK
   c. PATCH /api/videos/:id/status { status: 'EDITING' } -> 200 OK
4. Video.status is now EDITED
```
