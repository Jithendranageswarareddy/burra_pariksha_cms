# Source-of-Truth Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 02 of 35  

---

## 1. Inventory of System Business Entities & Authoritative Sources

| # | Business Entity | Authoritative System | Storage Subsystem | Storage Key / Identifier | Authoritative Evidence | Secondary Representations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Question** | Google Sheets | `QUESTIONS` Tab | `BP-Q-######` | `questions.repository.ts` | In-memory cache, React state, Draft |
| 2 | **Question Draft** | Google Sheets | `QUESTION_DRAFTS` Tab | `BP-DFT-*-* ` | `question-drafts.repository.ts` | Stage 01 UI State, Form buffers |
| 3 | **Content Master** | Google Sheets | `CONTENT_MASTERS` Tab | `BP-CNT-######` | `content-masters.repository.ts` | Linked questions, Drive folder name |
| 4 | **Script** | Google Sheets | `SCRIPTS` Tab | `BP-S-######` | `scripts.repository.ts` | Teleprompter UI state, Versions tab |
| 5 | **Script Version** | Google Sheets | `SCRIPT_VERSIONS` Tab | `BP-S-######-V#` | `script-versions.repository.ts` | JSON cell in `SCRIPTS` |
| 6 | **Video** | Google Sheets | `VIDEOS` Tab | `BP-V-######` | `videos.repository.ts` | `Question.videoStatus`, Join table |
| 7 | **Raw Video Binary** | Google Drive | Drive Folder `Videos` / `Raw` | `driveFileId` (alphanumeric) | `google-drive.service.ts` | Sheet row file pointer |
| 8 | **Edited Video Binary**| Google Drive | Drive Folder `Edited` | `driveFileId` (alphanumeric) | `phase14-drive.service.ts` | Sheet row file pointer |
| 9 | **Media Asset Metadata**| Google Sheets | `MEDIA_ASSETS` Tab | `ASSET-######` | `media-assets.repository.ts` | Google Drive File metadata |
| 10 | **Thumbnail Metadata**| Google Sheets | `THUMBNAILS` Tab | `BP-T-######` | `thumbnails.repository.ts` | Publishing tab flag, UI state |
| 11 | **Thumbnail Binary** | Google Drive | Drive Folder `Thumbnails` | `driveFileId` (alphanumeric) | `phase14-drive.service.ts` | Data URI previews in UI |
| 12 | **Thumbnail Version** | Google Sheets | `THUMBNAIL_VERSIONS` Tab | `BP-T-######-V#` | `thumbnail-versions.repository.ts` | Embedded version strings |
| 13 | **Pinned Comment** | Google Sheets | `PINNED_COMMENTS` Tab | `BP-PIN-######` | `pinned-comments.repository.ts` | Publishing tab flag, Social review |
| 14 | **Social Review Package**| Google Sheets | `SOCIAL_REVIEWS` Tab | `SR-######` | `social-reviews.repository.ts` | In-memory `draftCache` |
| 15 | **Publishing Record** | Google Sheets | `PUBLISHING` Tab | `PUB-######` | `publishing.repository.ts` | Video status, Analytics record |
| 16 | **Platform Sync Log** | Google Sheets | `PLATFORM_SYNC_LOGS` Tab | `SYNC-######` | `platform-sync-logs.repository.ts` | YouTube/Instagram platform status |
| 17 | **Analytics Snapshot**| Google Sheets | `ANALYTICS` Tab | `ANL-######` | `analytics.repository.ts` | Aggregate dashboard stats |
| 18 | **Intelligence Report**| Google Sheets | `ANALYTICS_INTELLIGENCE` | `INT-######` | `intelligence.repository.ts` | AI suggestions, Copilot cache |
| 19 | **User Record** | Google Sheets | `USERS` Tab | `USR-###` | `users.repository.ts` | In-memory session versions |
| 20 | **User Session Token** | Node.js Process | In-Memory Memory Map | JWT Token String | `auth.service.ts` | Client localStorage `bp_session_token` |
| 21 | **Audit Log** | Google Sheets | `AUDIT_LOGS` Tab | `LOG-######` | `audit-log.repository.ts` | Disk JSON files during deletion |
| 22 | **Sequence Mutex** | Node.js Process | In-Memory Promise Chain | Sequence Name String | `sequences.repository.ts` | `SEQUENCES` Sheet row counter |
| 23 | **Workflow Transition**| Google Sheets | `WORKFLOW_TRANSITIONS` Tab | `WF-######` | `workflow-transitions.repository.ts`| Entity status fields |
| 24 | **Category** | Google Sheets | `CATEGORIES` Tab | `CAT-###` | `categories.repository.ts` | Question denormalized categoryName |
| 25 | **Topic** | Google Sheets | `TOPICS` Tab | `TOP-###` | `topics.repository.ts` | Question denormalized topicName |
| 26 | **Subtopic** | Google Sheets | `SUBTOPICS` Tab | `SUB-###` | `subtopics.repository.ts` | Question denormalized subtopicName |
| 27 | **Assignment** | Google Sheets | `ASSIGNMENTS` Tab | `BP-ASN-######` | `assignments.repository.ts` | Video assignedHost/Editor |
| 28 | **Planning Plan/Batch**| Google Sheets | `PLANNING_PLANS` Tab | `PLAN-######` | `planning.repository.ts` | Question generation queue |

---

## 2. Inventory Classification Summary

- **Total Entities Audited:** 28 Major Business Entities
- **Tabular Storage Primary:** 26 Entities stored authoritative in Google Sheets API v4
- **Binary Storage Primary:** 2 Entities stored authoritative in Google Drive API v3 (Raw/Edited Videos, Thumbnails)
- **Runtime Ephemeral Primary:** 2 Entities stored authoritative in Server Memory (User Session Token states, Sequence Mutex locks)
- **SQL Database Storage:** 0 Entities (Relational database not configured in current architecture)
