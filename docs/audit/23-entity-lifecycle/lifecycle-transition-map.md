# End-to-End Lifecycle Transition Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 24 of 35  

---

## Visual Progression Chart

```
[Stage 01: Question Studio]
  │
  ├─> Status: DRAFT (Sheet: QUESTION_DRAFTS)
  │
  ▼
[Stage 02: Verification Page]
  │
  ├─> [Approval Action]
  ├─> Allocates BP-Q-000001 (Sheet: QUESTIONS)
  ├─> Allocates BP-CNT-000001 (Sheet: CONTENT_MASTERS)
  ├─> Allocates BP-V-000001 (Sheet: VIDEOS)
  ├─> Deletes BP-DFT-529472-5SOD
  │   [HARD BREAK 1: Browser reload on /questions/BP-DFT-*/verify throws 404]
  │
  ▼
[Stage 03: Script Tab] (/videos/BP-V-000001?tab=script)
  │
  ├─> Generates BP-S-000001 (Sheet: SCRIPTS)
  ├─> Video Status: SCRIPT_READY
  │
  ▼
[Stage 04: Recording Tab] (/videos/BP-V-000001?tab=recording)
  │
  ├─> Prompter Execution
  ├─> Video Status: RECORDING
  │
  ▼
[Stage 05: Raw Video Upload] (/videos/BP-V-000001?tab=recording)
  │
  ├─> Streams vd1.2.mp4 to Google Drive
  ├─> Sets driveFileId: 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK
  ├─> Video Status: RECORDED
  │
  ▼
[Stage 06: Editing Bay Tab] (/videos/BP-V-000001?tab=editing)
  │
  ├─> * If status was QUEUED: 3-step sequential PATCH hop required *
  ├─> Uploads master render
  ├─> Video Status: EDITED
  │
  ▼
[Stage 07: Final QC Tab] (/videos/BP-V-000001?tab=final-review)
  │
  ├─> 6-point checklist verified
  ├─> Video Status: READY_TO_UPLOAD
  │
  ▼
[Stage 08: Thumbnail Tab] (/videos/BP-V-000001?tab=thumbnail)
  │
  ├─> Uploads image to Drive
  ├─> Synchronizes Publishing: thumbnailReady = true
  │
  ▼
[Stage 09: Social Review Page] (/social-review/SR-000001)
  │
  ├─> Signs off copy, tags & Telugu pinned comment
  ├─> Synchronizes Publishing: pinnedCommentReady = true
  │
  ▼
[Stage 10: Publishing Page] (/publishing)
  │
  ├─> Gate D audit passes
  ├─> Publishing Status: SCHEDULED
  │
  ▼
[Stage 11: Live Published] (/publishing)
  │
  ├─> Enters live YouTube/Instagram URLs
  ├─> Publishing Status: PUBLISHED
  │   [SOFT BREAK 2: Video.status in VIDEOS sheet remains READY_TO_UPLOAD]
  │
  ▼
[Stage 12: Platform Sync] (/platform-packages)
  │
  ├─> Simulated UI sync verification
  │
  ▼
[Stage 13: Analytics Page] (/social-analytics/BP-CNT-000001)
  │
  ├─> Baseline row auto-minted
  ├─> Subsequent snapshots entered manually
  │
  ▼
[Stage 14: Diagnostics Page] (/analytics/engagement)
  │
  ├─> Renders engagement drop-off curves
  │
  ▼
[Stage 15: Intelligence Page] (/analytics/intelligence)
  │
  ├─> Gemini AI synthesizes recommendations
  ├─> Human clicks "Apply to Question Studio"
  │
  └─> [Loops back to Stage 01 via query parameters]
```
