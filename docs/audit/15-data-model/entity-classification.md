# Entity Classification Framework

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 03 of 51  

---

## 1. Classification Categories

Every discovered entity in BP-CMS is categorized into one of 7 functional architectural classes:

```
[BUSINESS ENTITIES] --------> Core domain models representing real operational assets
[DRAFT / PRE-CANONICAL] ---> Uncommitted staging work awaiting validation or approval
[DERIVED ENTITIES] ---------> Computed, aggregated, or AI-clustered analytics
[JOIN / RELATIONSHIP] ------> Relational bridge tables modeling N:M associations
[TECHNICAL / INFRA] --------> Concurrency locks, ID sequences, append-only journals
[SECURITY / ACCESS] --------> Authentication identities, RBAC roles, and capabilities
[PHYSICAL STORAGE] ---------> Raw Google Sheets rows, Drive files, memory buffers
```

---

## 2. Comprehensive Entity Classification Matrix

| Classification Category | Entities Included | Lifecycle Scope | Mutability | Persistence Guarantees |
| :--- | :--- | :--- | :---: | :--- |
| **A. Business Entity** | `Question`, `ContentMaster`, `Script`, `Video`, `Thumbnail`, `PinnedComment`, `SocialReview`, `Publishing`, `Category`, `Topic`, `Subtopic` | Full 15-stage conveyor belt | Mutable (Status driven) | Permanent Google Sheets storage |
| **B. Draft / Temporary**| `DraftQuestion`, `ThumbnailCandidate`, `RefinementCandidate` | Pre-creation sandbox | Highly mutable | Ephemeral; auto-cleared upon promotion |
| **C. Derived Entity** | `SocialAnalytics`, `PerformanceIntelligence`, `SocialCommentCluster`, `StrategyRecommendation` | Post-publishing analysis | Read-mostly / periodic batch update | Re-generable from external platform APIs |
| **D. Join / Relational**| `QUESTION_VIDEOS`, `ContentBatchQuestionJoin` | Lifecycle of parent entities | Append / Delete | Google Sheets bridge tabs |
| **E. Technical / Infra**| `Sequence`, `Workflow`, `AuditLog`, `QuestionConfig` | System lifespan | Append-only (except Sequence) | System operational tables |
| **F. Security / Access**| `User`, `UserRole`, `SessionToken` | Organization membership | Low change frequency | `USERS` sheet + JWT session cache |
| **G. Storage File Rep** | Raw MP4 Takes, Rendered 9:16 Cuts, JPEG Thumbnails | Production lifecycle | Immutable takes / versioned cuts | Google Drive folders |
