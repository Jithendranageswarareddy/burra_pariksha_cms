# Relationship Continuity Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 20 of 35  

---

## 1. Foreign Key Relationship Chain

```
QuestionDraft (BP-DFT-*)
       | [DELETED ON APPROVAL]
       v
ContentMaster (BP-CNT-000001) <===========+
       ^                                  |
       | (contentId)                      | (contentId)
       v                                  v
Question (BP-Q-000001) <------+     Publishing (PUB-000001) <---+
       ^                      |           ^                     |
       | (questionId)         |           | (videoId)           |
       v                      |           v                     |
Script (BP-S-000001)          +---> Video (BP-V-000001)         |
                                          ^                     |
                                          | (videoId)           |
                                          +---------------------+
                                          |
                              +-----------+-----------+
                              |                       |
                              v                       v
                   Thumbnail (BP-T-*)      SocialReview (SR-*)
```

---

## 2. Relationship Survives vs Drops

| Relationship | Source Field | Target Field | Status | Forensic Observation |
| :--- | :--- | :--- | :---: | :--- |
| **Draft -> Question** | Implicit | N/A | **DROPPED** | Draft row is hard-deleted from `QUESTION_DRAFTS`. |
| **Question -> ContentMaster** | `Question.contentId` | `ContentMaster.id` | **SURVIVES** | Explicit foreign key maintained in `QUESTIONS` sheet. |
| **Video -> Question** | `Video.questionId` | `Question.id` | **SURVIVES** | Explicit foreign key maintained in `VIDEOS` sheet. |
| **Video -> ContentMaster** | `Video.contentId` | `ContentMaster.id` | **SURVIVES** | Dual-referenced in `VIDEOS` sheet (`contentId` and `contentMasterId`). |
| **Script -> Question** | `Script.questionId` | `Question.id` | **SURVIVES** | Stored in `SCRIPTS` sheet. |
| **Publishing -> Video** | `Publishing.videoId` | `Video.id` | **SURVIVES** | Initialized during question approval. |
| **Analytics -> ContentMaster**| `Analytics.contentId` | `ContentMaster.id` | **SURVIVES** | Seeded at publishing time. |
