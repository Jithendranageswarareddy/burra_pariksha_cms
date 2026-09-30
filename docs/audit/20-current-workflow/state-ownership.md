# State Ownership & Writer Authority

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 19 of 41  

---

## 1. Writer Authority Across State Fields

| State Field | Canonical Storage | Authoritative Writer Service | Allowed User Roles | Secondary Writers |
| :--- | :--- | :--- | :--- | :--- |
| **Question.status** | `QUESTIONS` Tab | `QuestionService.updateStatus` | Admin, Manager, Verifier | `QuestionDraftService.approveDraft` |
| **Video.status** | `VIDEOS` Tab | `VideoService.transitionStatus` | Admin, Manager, Editor, Host | `VideoService.queueApprovedQuestion` |
| **Question.videoStatus** | `QUESTIONS` Tab | `VideoService.transitionStatus` | System (Sync) | Swallowed error risk |
| **Script.currentVersion**| `SCRIPTS` Tab | `ScriptService.saveScript` | Writer, Creator | In-place version increment |
| **Thumbnail.status** | `THUMBNAILS` Tab | `ThumbnailService.saveThumbnail`| Designer, Lead | Auto-syncs `Publishing.thumbnailReady` |
| **Publishing.status** | `PUBLISHING` Tab | `PublishingService.markPlatformPublished`| Publisher, Admin | Multi-platform independent writes |
