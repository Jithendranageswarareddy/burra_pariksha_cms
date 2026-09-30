# Duplicate & Overlapping Entity Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 30 of 51  

---

## 1. Conceptual Overlaps Discovered

| Overlapping Entity Pair | Functional Overlap | Divergence in Implementation | Risk Level |
| :--- | :--- | :--- | :---: |
| **`Question` vs `DraftQuestion`** | Both represent syllabus questions | `Question` is in `QUESTIONS` sheet; `DraftQuestion` is in memory cache | **MEDIUM** |
| **`Video` vs `MediaAsset`** | Both reference video production | `Video` is the production state machine; `MediaAsset` is Drive file metadata | **HIGH** |
| **`Thumbnail` vs `ThumbnailCandidate`** | Both represent video cover art | `Thumbnail` is approved; candidate is pre-approval variation | **LOW** |
| **`ContentMaster` vs `Question`** | Both represent the core content item | 1:1 coupling in 95% of cases; duplicate title & status columns | **HIGH** |
| **`Publishing` vs `SocialReview`** | Both store social metadata & review | `SocialReview` holds quality score; `Publishing` holds live platform URLs | **MEDIUM** |
