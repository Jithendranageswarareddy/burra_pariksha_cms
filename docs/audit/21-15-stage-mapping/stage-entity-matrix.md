# Stage-to-Entity Mapping Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 21 of 31  

---

## 1. Domain Entities Mutated and Read Across Stages

| Stage | Primary Entity | Secondary Entities | Entity Created | Entity Updated | Entity Read | Binary File |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `QuestionDraft` | `Taxonomy` | `QuestionDraft` | None | `Topic`, `Subtopic` | None |
| **02** | `Question` | `ContentMaster`, `Video` | `Question`, `ContentMaster`, `Video` | None | `QuestionDraft` | None |
| **03** | `Script` | `ScriptVersion` | `Script`, `ScriptVersion` | None | `Video`, `Question` | None |
| **04** | `Video` | `Script` | None | `Video` | `Script` | None |
| **05** | `MediaAsset` | `Video` | `MediaAsset` | `Video` | None | Raw MP4 in Drive |
| **06** | `Video` | `MediaAsset` | None | `Video` | `MediaAsset` | Final MP4 in Drive |
| **07** | `Video` | QC Checklist | None | `Video` | None | None |
| **08** | `Thumbnail` | `ThumbnailVersion`, `Publishing` | `Thumbnail`, `ThumbnailVersion` | `Publishing` | `Video` | Image in Drive |
| **09** | `SocialReview` | `PinnedComment` | `SocialReviewPackage` | `PinnedComment` | `Video`, `Thumbnail` | None |
| **10** | `Publishing` | `Video` | `Publishing` | None | `Video`, `Review` | None |
| **11** | `Publishing` | `Analytics` | `SocialAnalyticsRecord` | `Publishing` | None | None |
| **12** | `PlatformSync` | `Publishing` | `PlatformSyncLog` | None | `Publishing` | None |
| **13** | `Analytics` | None | `SocialAnalyticsRecord` | None | `Publishing` | None |
| **14** | `Analytics` | None | None | None | `Analytics` rows | None |
| **15** | `Intelligence`| `Analytics` | `SocialPerfIntRecord` | None | `Analytics` rows | None |
