# Social Analytics & Performance Intelligence Derived Entities

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 19 of 51  

---

## 1. Classification: Derived Analytics Entities

Analytics structures in BP-CMS are not primary transactional entities; they are **derived snapshots computed from external platform APIs**:

1. **`SocialAnalytics` (`src/types/index.ts:2250–2290`):**
   - ID: `BP-ANL-XXXXXX`
   - Metrics: `viewCount`, `likeCount`, `commentCount`, `averageWatchPercentage`, `retentionScore`.
   - Periodically synced from YouTube Data API v3.
2. **`PerformanceIntelligence` (`src/types/index.ts:2310–2350`):**
   - ID: `BP-SPI-XXXXXX`
   - AI-derived insights categorizing high-retention vs drop-off segments.
3. **`CommentIntelligence` (`src/types/index.ts:2680–2720`):**
   - ID: `BP-CMI-XXXXXX`
   - Clustered audience questions harvested from comments, feeding back into Question Generation (Stage 15 -> Stage 01 loopback).
