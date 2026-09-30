# Master Relationship Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 26 of 51  

---

## 1. Master Cross-Entity Reference Inventory

Forensic analysis discovered **32 distinct cross-entity references** across models and schemas:

| # | From Entity | Reference Field | Target Entity | Target Column | Storage Sheet |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **01** | `Topic` | `categoryId` | `Category` | `id` | `TOPICS` |
| **02** | `Subtopic` | `topicId` | `Topic` | `id` | `SUBTOPICS` |
| **03** | `Question` | `categoryId` | `Category` | `id` | `QUESTIONS` |
| **04** | `Question` | `topicId` | `Topic` | `id` | `QUESTIONS` |
| **05** | `Question` | `subtopicId` | `Subtopic` | `id` | `QUESTIONS` |
| **06** | `Question` | `contentMasterId` | `ContentMaster` | `id` | `QUESTIONS` |
| **07** | `Question` | `createdByUser` | `User` | `id` | `QUESTIONS` |
| **08** | `ContentMaster`| `primaryQuestionId`| `Question` | `id` | `CONTENT_MASTERS` |
| **09** | `ContentMaster`| `topicId` | `Topic` | `id` | `CONTENT_MASTERS` |
| **10** | `ContentMaster`| `subtopicId` | `Subtopic` | `id` | `CONTENT_MASTERS` |
| **11** | `ContentMaster`| `ownerId` | `User` | `id` | `CONTENT_MASTERS` |
| **12** | `Video` | `questionId` | `Question` | `id` | `VIDEOS` |
| **13** | `Video` | `contentMasterId` | `ContentMaster` | `id` | `VIDEOS` |
| **14** | `Video` | `assignedHost` | `User` | `id` | `VIDEOS` |
| **15** | `Video` | `assignedEditor` | `User` | `id` | `VIDEOS` |
| **16** | `Script` | `videoId` | `Video` | `id` | `SCRIPT` |
| **17** | `Script` | `questionId` | `Question` | `id` | `SCRIPT` |
| **18** | `ScriptVersion`| `scriptId` | `Script` | `id` | `SCRIPT_VERSIONS` |
| **19** | `Thumbnail` | `videoId` | `Video` | `id` | `THUMBNAILS` |
| **20** | `PinnedComment`| `videoId` | `Video` | `id` | `PINNED_COMMENTS` |
| **21** | `Publishing` | `videoId` | `Video` | `id` | `PUBLISHING` |
| **22** | `Publishing` | `contentMasterId` | `ContentMaster` | `id` | `PUBLISHING` |
| **23** | `SocialReview`| `questionId` | `Question` | `id` | `SOCIAL_REVIEWS` |
| **24** | `SocialReview`| `contentMasterId` | `ContentMaster` | `id` | `SOCIAL_REVIEWS` |
| **25** | `MediaAsset` | `contentId` | `ContentMaster` | `id` | `MEDIA_ASSETS` |
| **26** | `Assignment` | `assignedUserId` | `User` | `id` | `ASSIGNMENTS` |
| **27** | `Assignment` | `assignedByUserId`| `User` | `id` | `ASSIGNMENTS` |
| **28** | `Assignment` | `entityId` | Polymorphic | `id` | `ASSIGNMENTS` |
| **29** | `Workflow` | `entityId` | Polymorphic | `id` | `WORKFLOW` |
| **30** | `Workflow` | `triggeredBy` | `User` | `id` | `WORKFLOW` |
| **31** | `AuditLog` | `userId` | `User` | `id` | `AUDIT_LOG` |
| **32** | `AuditLog` | `entityId` | Polymorphic | `id` | `AUDIT_LOG` |
