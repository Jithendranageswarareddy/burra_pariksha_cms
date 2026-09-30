# Master Entity Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 02 of 51  

---

## 1. Complete Entity Inventory Table

Static AST parsing and schema auditing discovered **28 distinct entities** actively modeled in BP-CMS:

| Entity Name | Primary Type / Model | Physical Storage Sheet / System | Primary Identifier Scheme | Source of Truth | Confidence |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Question** | `Question` (`src/types/index.ts:180`) | Google Sheets: `QUESTIONS` | `BP-Q-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Draft Question** | `DraftQuestion` (`src/types/index.ts:1680`) | Ephemeral / `question-drafts.repository.ts` | `BP-DFT-XXXXXX` | Cache / LocalStore | CONFIRMED |
| **Content Master** | `ContentMaster` (`src/types/index.ts:290`) | Google Sheets: `CONTENT_MASTERS` | `BP-CNT-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Script** | `Script` (`src/types/index.ts:410`) | Google Sheets: `SCRIPT` | `BP-S-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Script Version** | `ScriptVersion` (`src/types/index.ts:445`) | Google Sheets: `SCRIPT_VERSIONS` | `BP-SV-XXXXXX` | Google Sheets | CONFIRMED |
| **Video** | `Video` (`src/types/index.ts:480`) | Google Sheets: `VIDEOS` + Drive | `BP-V-XXXXXX` (Seq) | Google Sheets (Meta) | CONFIRMED |
| **Media Asset** | `MediaAsset` (`src/types/index.ts:2410`) | Google Sheets: `MEDIA_ASSETS` + Drive | `BP-MED-XXXXXX` | Google Sheets / Drive| CONFIRMED |
| **Thumbnail** | `Thumbnail` (`src/types/index.ts:610`) | Google Sheets: `THUMBNAILS` + Drive | `BP-T-XXXXXX` (Seq) | Google Sheets (Meta) | CONFIRMED |
| **Thumbnail Candidate**| `ThumbnailCandidate` (`phase18`) | Ephemeral / Candidate cache | `BP-TC-XXXXXX` | Memory / Drive | CONFIRMED |
| **Pinned Comment** | `PinnedComment` (`src/types/index.ts:670`) | Google Sheets: `PINNED_COMMENTS` | `BP-PIN-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Social Review Package**| `SocialReviewBundle` (`types:2110`) | Google Sheets: `SOCIAL_REVIEWS` | `BP-REV-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Publishing Record** | `Publishing` (`src/types/index.ts:720`) | Google Sheets: `PUBLISHING` | `PUB-XXXXXX` (UUID/Seq) | Google Sheets | CONFIRMED |
| **Platform Adaptation**| `PlatformAdaptation` (`types:2570`) | Google Sheets: `ADAPTATIONS` | `BP-ADP-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Content Plan** | `ContentPlan` (`src/types/index.ts:1350`) | Google Sheets: `CONTENT_PLANS` | `BP-PLN-XXXX` (Seq) | Google Sheets | CONFIRMED |
| **Content Batch** | `ContentBatch` (`src/types/index.ts:1385`) | Google Sheets: `CONTENT_BATCHES` | `BP-BCH-XXXX` (Seq) | Google Sheets | CONFIRMED |
| **Assignment** | `Assignment` (`src/types/index.ts:790`) | Google Sheets: `ASSIGNMENTS` | `BP-ASN-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **Category** | `Category` (`src/types/index.ts:850`) | Google Sheets: `CATEGORIES` | `BP-CAT-XXX` (Seq) | Google Sheets | CONFIRMED |
| **Topic** | `Topic` (`src/types/index.ts:880`) | Google Sheets: `TOPICS` | `BP-TOP-XXXX` (Seq) | Google Sheets | CONFIRMED |
| **Subtopic** | `Subtopic` (`src/types/index.ts:910`) | Google Sheets: `SUBTOPICS` | `BP-SUB-XXXXXX` (Seq) | Google Sheets | CONFIRMED |
| **User** | `User` (`src/types/index.ts:950`) | Google Sheets: `USERS` | `USR-XXX` (Seq) | Google Sheets | CONFIRMED |
| **Role** | `UserRole` (Enum, `types:1010`) | Hardcoded TypeScript Enum | String Enum Value | Codebase Enum | CONFIRMED |
| **Permission** | Hardcoded logic in auth services | In-Memory / Code constants | Permission String | Codebase Rules | CONFIRMED |
| **Question-Video Join**| `QuestionVideo` (`types:1050`) | Google Sheets: `QUESTION_VIDEOS` | Composite / ID | Google Sheets | CONFIRMED |
| **Workflow Record** | `Workflow` (`src/types/index.ts:1110`) | Google Sheets: `WORKFLOW` | `WF-timestamp-seq-id` | Google Sheets | CONFIRMED |
| **Audit Event** | `AuditLog` (`src/types/index.ts:1150`) | Google Sheets: `AUDIT_LOG` | `LOG-timestamp-rand` | Google Sheets | CONFIRMED |
| **Sequence** | `SequenceRecord` (`types:1200`) | Google Sheets: `SEQUENCES` | Entity Name string | Google Sheets | CONFIRMED |
| **Social Analytics** | `SocialAnalytics` (`types:2250`) | Derived / Google Sheets | `BP-ANL-XXXXXX` (Seq) | External YouTube API | CONFIRMED |
| **Comment Intelligence**| `CommentIntelligence` (`types:2680`)| Derived / Google Sheets | `BP-CMI-XXXXXX` (Seq) | AI Clustering Engine | CONFIRMED |
