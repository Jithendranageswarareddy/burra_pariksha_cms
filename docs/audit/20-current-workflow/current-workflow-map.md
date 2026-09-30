# Current Workflow Map (Actual End-to-End Path)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 03 of 41  

---

## 1. The Actual End-to-End Operational Workflow

Starting from a real user interaction today, the system executes this real execution path:

```
[STAGE 01: QUESTION GENERATION]
User on /studio -> Inputs Topic / Prompts AI
  ↓ POST /api/questions/drafts
Saved to QUESTION_DRAFTS as BP-DFT-*-*
  ↓
[STAGE 02: QUESTION VERIFICATION & APPROVAL]
User on /questions/:id/verify -> Runs MultiLayerVerificationEngine
  ↓ Clicks "Approve & Queue Video"
  ↓ Calls POST /api/questions/drafts/:id/approve
  ↓ Creates Content Master (BP-CNT-######) in CONTENT_MASTERS
  ↓ Creates Question (BP-Q-######) in QUESTIONS
  ↓ Deletes Draft from QUESTION_DRAFTS
  ↓ Calls POST /api/videos/queue
  ↓ Creates Video (BP-V-######) in VIDEOS (Status: QUEUED)
  ↓ Updates Question.videoStatus = QUEUED
  ↓
[STAGE 03: SCRIPTING]
User on /videos/:id?tab=script -> Enters Hook, Steps, Takeaway
  ↓ Calls POST /api/videos/:id/script
  ↓ Writes to SCRIPTS and SCRIPT_VERSIONS (Status: SCRIPT_READY)
  ↓
[STAGE 04 & 05: TELEPROMPTER & RAW RECORDING]
User on /videos/:id?tab=recording -> Uses Teleprompter
  ↓ Uploads Raw MP4 via POST /api/videos/:id/upload
  ↓ File saved to Google Drive; returns driveFileId
  ↓ Client chains 3 calls to bypass QUEUED -> EDITING barrier:
    1. QUEUED -> SCRIPT_READY
    2. SCRIPT_READY -> RECORDED
    3. RECORDED -> EDITING
  ↓
[STAGE 06: EDITING BAY]
User on /videos/:id?tab=editing -> Links final render MP4
  ↓ Calls PATCH /api/videos/:id/status (EDITING -> EDITED)
  ↓
[STAGE 07: FINAL QC]
User on /videos/:id?tab=final-review -> Reviews 6-point QC checklist
  ↓ Calls PATCH /api/videos/:id/status (EDITED -> READY_TO_UPLOAD)
  ↓
[STAGE 08: THUMBNAIL STUDIO]
User on /videos/:id?tab=thumbnail -> Uploads 1080x1920 image
  ↓ Calls POST /api/videos/:id/thumbnail
  ↓ Status: APPROVED -> Syncs Publishing.thumbnailReady = true
  ↓
[STAGE 09: SOCIAL REVIEW]
User on /social-review/:reviewId -> 9:16 simulator check
  ↓ Calls POST /api/videos/:id/social-review (Status: APPROVED)
  ↓
[STAGE 10 & 11: PUBLISHING]
User on /publishing -> Enters YouTube/Instagram URLs
  ↓ Calls POST /api/videos/:id/publish-platform
  ↓ Updates PUBLISHING tab (Status: PUBLISHED)
  ↓ Auto-initializes ANALYTICS tab row (Views: 0)
  ↓
[STAGE 12-15: PLATFORM SYNC, ANALYTICS & INTELLIGENCE]
User on /platform-packages & /analytics
  ↓ Ingests engagement metrics (ANALYTICS tab)
  ↓ Generates AI strategy recommendations (ANALYTICS_INTELLIGENCE tab)
  ↓ Loopback to /studio
```
