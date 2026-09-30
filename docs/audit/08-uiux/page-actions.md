# Page Actions Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 08 of 30  

---

## 1. Action Lifecycle Architecture

Every interactive action in BP-CMS follows a structured lifecycle:
```
[UI Element Click] -> [Client Validation] -> [API Request] -> [State Mutation] -> [Navigation / Feedback]
```

---

## 2. Page Action Inventory & End-to-End Traces

### Action 1: Create Question & Continue (`QuestionStudioPage.tsx`)
- **Trigger**: Click "Save & Continue to Verification"
- **Handler**: `handleSaveSuccess()`
- **Validation**: Enforces question statement in English & Telugu, 4 options, 1 correct option, and academic proof.
- **API Call**: `POST /api/questions`
- **Mutation**: Inserts new row in Questions Google Sheet; creates draft ContentMaster entity.
- **Navigation**: `navigate(`/questions/${created.id}/verify`)` (Advances Stage 01 -> Stage 02).

### Action 2: Academic Approval (`QuestionVerifyApprovePage.tsx`)
- **Trigger**: Click "Approve Question & Launch Production"
- **Handler**: `handleApproveSuccess()`
- **Validation**: Verifies all 5 academic checklist criteria are toggled ON.
- **API Call**: `POST /api/questions/:id/verify` and `POST /api/videos`
- **Mutation**: Question status updated to `VERIFIED`; new Video entity initialized in status `SCRIPT_READY`.
- **Navigation**: `navigate(`/videos/${targetVideoId}?tab=script`)` (Advances Stage 02 -> Stage 03).

### Action 3: Script Signoff (`ScriptWorkspace.tsx`)
- **Trigger**: Click "Approve Script & Advance to Filming"
- **Handler**: `handleApproveScript()`
- **Validation**: Checks Telugu script length and estimated duration (30-60 seconds).
- **API Call**: `POST /api/scripts/:id/approve`
- **Mutation**: Video status updated to `RECORDING`; teleprompter assets generated.
- **Navigation**: `navigate(`/videos/${videoId}?tab=recording`)` (Advances Stage 03 -> Stage 04).

### Action 4: Submit Rough Cut (`EditingWorkspace.tsx`)
- **Trigger**: Click "Submit Cut for Executive Review"
- **Handler**: `handleSubmitForQC()`
- **Validation**: Verifies rough cut video URL is provided and accessible.
- **API Call**: `POST /api/videos/:id/submit-edit`
- **Mutation**: Video status updated to `FINAL_REVIEW`.
- **Navigation**: `navigate(`/videos/${videoId}?tab=final-review`)` (Advances Stage 06 -> Stage 07).

### Action 5: Approve Final Cut (`FinalReviewWorkspace.tsx`)
- **Trigger**: Click "Approve Video & Design Thumbnail"
- **Handler**: `handleApproveVideo()`
- **Validation**: Verifies all 12 QC checklist items are checked.
- **API Call**: `POST /api/videos/:id/approve-qc`
- **Mutation**: Video status updated to `READY_TO_UPLOAD`.
- **Navigation**: `navigate(`/videos/${videoId}?tab=thumbnail`)` (Advances Stage 07 -> Stage 08).

### Action 6: Schedule Broadcast (`PublishingWorkspace.tsx`)
- **Trigger**: Click "Schedule Multi-Platform Broadcast"
- **Handler**: `handleScheduleSuccess()`
- **Validation**: Future timestamp confirmed; at least 1 destination platform checked.
- **API Call**: `POST /api/publishing/schedule`
- **Mutation**: Video status updated to `PUBLISHED` / `SCHEDULED`.
- **Navigation**: `navigate("/publishing")` (Advances Stage 10 -> Stage 11).
