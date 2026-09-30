# Critical Action Traces Deep-Dive

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 29 of 30  

---

## 1. Deep-Dive Actions Overview

This document presents detailed end-to-end execution traces for the 10 highest-consequence actions across the 15-stage workflow:

### Action 1: Create Question (`QuestionStudioPage.tsx`)
- **Intent**: Authors new bilingual question with academic proof.
- **Trace**: Form submit -> Zod validation -> `POST /api/questions` -> `QuestionService.createQuestion()` -> Allocates `BP-Q-*` via `sequenceSafetyService` -> Appends to `Questions` sheet -> Navigates to `/questions/:id/verify`.

### Action 2: Script Signoff (`ScriptWorkspace.tsx`)
- **Intent**: Signs off spoken dialogue for teleprompter.
- **Trace**: Button click -> Spoken duration check -> `POST /api/scripts/:id/approve` -> `ScriptService.approveScript()` -> Appends to `ScriptVersions` sheet -> Updates `Videos` sheet status to `RECORDING` -> Switches tab to `?tab=recording`.

### Action 3: Ingest Raw Footage (`RecordingWorkspace.tsx`)
- **Intent**: Logs recorded video takes from studio.
- **Trace**: "Save Take" click -> Google Drive URL validation -> `POST /api/videos/:id/record` -> `GoogleDriveService.verifyFileAccess()` -> Updates `Videos` sheet take metadata.

### Action 4: Submit Rough Cut (`EditingWorkspace.tsx`)
- **Intent**: Hands off edited rough cut for final review.
- **Trace**: "Submit for QC" click -> `POST /api/videos/:id/submit-edit` -> Updates `Videos` status to `FINAL_REVIEW` -> Creates task in `Assignments` sheet for QA Reviewer -> Switches tab to `?tab=final-review`.

### Action 5: Final QC Signoff (`FinalReviewWorkspace.tsx`)
- **Intent**: Authorizes technical and educational quality.
- **Trace**: 12/12 checklist verified -> `POST /api/videos/:id/approve-qc` -> Updates `Videos` status to `READY_TO_UPLOAD` -> Unlocks Thumbnail Studio tab.

### Action 6: Thumbnail Approval (`ThumbnailWorkspace.tsx`)
- **Intent**: Signs off 9:16 vertical poster design.
- **Trace**: "Approve Thumbnail" click -> Validates 1080x1920 image -> `POST /api/videos/:id/thumbnail` -> Updates `Thumbnails` sheet -> Unlocks Social Review tab.

### Action 7: Social Gatekeeper Signoff (`SocialReviewPage.tsx`)
- **Intent**: Verifies Telugu transcription, title hook, and hashtag block.
- **Trace**: "Signoff Social" click -> `POST /api/social-reviews/:id/approve` -> Updates `SocialReviews` sheet to `APPROVED` -> Navigates to `/publishing`.

### Action 8: Schedule Broadcast Release (`PublishingWorkspace.tsx`)
- **Intent**: Queues multi-platform broadcast release.
- **Trace**: Datetime picker -> Platform selection -> `POST /api/publishing/schedule` -> Appends to `PublishingQueue` sheet -> Navigates to `/publishing`.

### Action 9: Team Workload Reassignment (`TeamOperationsPage.tsx`)
- **Intent**: Reallocates bottlenecked task to another team member.
- **Trace**: Modal user select -> `POST /api/team/reassign` -> `AssignmentService.reassign()` -> Updates `Assignments` sheet -> Refetches team workload grid.

### Action 10: Disaster Recovery Restoration (`RecoveryAdminPage.tsx`)
- **Intent**: Performs catastrophic rollback to GCS snapshot.
- **Trace**: "Initiate Restore" -> "CONFIRM RESTORE" phrase -> `POST /api/recovery/restore` -> `FullSnapshotRestoreExecutionService` -> Wipes and reloads all 14 sheets -> Redirects to `/dashboard`.
