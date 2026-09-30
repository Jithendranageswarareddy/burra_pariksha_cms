# State Transition Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 11 of 30  

---

## 1. Multi-Entity State Architecture

BP-CMS manages parallel state machines across several primary entities:
1. **Question Status**: `DRAFT` -> `VERIFIED` -> `IN_PRODUCTION` -> `PUBLISHED` (or `REJECTED`)
2. **Video Production Status**: `SCRIPT_READY` -> `RECORDING` -> `EDITING` -> `FINAL_REVIEW` -> `READY_TO_UPLOAD` -> `PUBLISHED`
3. **Social Review Status**: `PENDING` -> `APPROVED` -> `REJECTED`
4. **Publishing Status**: `DRAFT` -> `SCHEDULED` -> `PUBLISHED` -> `SYNC_VERIFIED`

---

## 2. Action State Transition Matrix

| Action | Entity | Initial State | Transition Trigger | Next State | Synced Entities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Save Question | Question | `[NONE]` | `createQuestion()` | `DRAFT` | Draft ContentMaster |
| Verify Question | Question | `DRAFT` | `verifyQuestion()` | `VERIFIED` | Video created in `SCRIPT_READY` |
| Reject Question | Question | `DRAFT` | `rejectQuestion()` | `REJECTED` | None |
| Approve Script | Video | `SCRIPT_READY` | `approveScript()` | `RECORDING` | Teleprompter cue generated |
| Save Best Take | Video | `RECORDING` | `recordVideoTake()` | `RECORDING` | Best take index saved |
| Advance to Edit | Video | `RECORDING` | `advanceToEditing()`| `EDITING` | Assigned to Video Editor |
| Submit Cut | Video | `EDITING` | `submitRoughCut()` | `FINAL_REVIEW` | Assigned to QA Reviewer |
| Approve Cut | Video | `FINAL_REVIEW` | `approveFinalQC()` | `READY_TO_UPLOAD` | Thumbnail Studio unlocked |
| Approve Thumb | Video | `READY_TO_UPLOAD`| `approveThumbnail()`| `READY_TO_UPLOAD` | Social Review unlocked |
| Signoff Social | SocialReview | `PENDING` | `approveReview()` | `APPROVED` | Publishing Dispatcher unlocked |
| Schedule Post | Video | `READY_TO_UPLOAD`| `scheduleRelease()`| `PUBLISHED` | Live channel sync queued |
