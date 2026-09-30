# Entity ID Continuity Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 19 of 35  

---

## 1. ID Lifecycle Transition Matrix

| Stage | Entity | ID Format | Example (Runtime) | Created By | Referenced By | Storage Tab | Next ID Reference |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `QuestionDraft` | `BP-DFT-######-XXXX` | `BP-DFT-529472-5SOD` | `QuestionStudioPage` | Verification URL | `QUESTION_DRAFTS` | Promoted to `BP-Q-*` (Draft row deleted) |
| **02** | `Question` | `BP-Q-######` | `BP-Q-000001` | `SequencesService` | `Video`, `Script`, `Publishing` | `QUESTIONS` | Parent of `BP-CNT-*` and `BP-V-*` |
| **02** | `ContentMaster` | `BP-CNT-######` | `BP-CNT-000001` | `contentMasterService` | `Video`, `Publishing`, `Analytics` | `CONTENT_MASTERS` | Canonical Umbrella Key |
| **02** | `Video` | `BP-V-######` | `BP-V-000001` | `videoService:queueApprovedQuestion`| `Thumbnail`, `Publishing` | `VIDEOS` | Video Production Entity |
| **03** | `Script` | `BP-S-######` | `BP-S-000001` | `scriptService` | Teleprompter, `Video` | `SCRIPTS` | References `BP-Q-000001` |
| **05** | `DriveFile` | Base64 / Google ID | `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK` | Google Drive API | `Video.driveFileId` | Google Drive | Physical MP4 Binary |
| **08** | `Thumbnail` | `BP-T-######` | `BP-T-000001` | `thumbnailService` | `Publishing` | `THUMBNAILS` | References `BP-V-000001` |
| **09** | `SocialReview`| `SR-######` | `SR-000001` | `socialReviewService` | `Publishing` | `SOCIAL_REVIEWS` | References `BP-V-000001` |
| **10** | `Publishing` | `PUB-######` | `PUB-000001` | `videoService` (Auto-queued) | Publishing Gate D | `PUBLISHING` | References `BP-V-000001` & `BP-CNT-000001` |
| **13** | `Analytics` | `ANL-######` | `ANL-000001` | `publishingService` / User | Analytics Aggregator | `ANALYTICS` | References `BP-CNT-000001` |
| **15** | `Intelligence`| `INT-######` | `INT-000001` | `SocialPerformanceIntelligence`| Stage 01 Query Params | `ANALYTICS_INTELLIGENCE` | Feeds back to `QuestionStudioPage` |

---

## 2. ID Continuity Anomalies

1. **The Stale Draft ID (STG-HIGH-01):** Once `BP-DFT-529472-5SOD` is promoted to `BP-Q-000001`, the draft ID is permanently deleted from sheets. However, the browser URL retains the draft ID, breaking on page reload.
2. **Triad Key Proliferation:** A single educational unit is known by 3 distinct IDs: `BP-CNT-000001` (umbrella), `BP-Q-000001` (pedagogy), and `BP-V-000001` (media). Hand-offs alternate between referencing `questionId` and `videoId`.
