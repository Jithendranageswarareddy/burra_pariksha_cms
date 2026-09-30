# Social Publishing State Machine Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 08 of 30  

---

## 1. SocialPublishStatus State Model

Defined in `src/types/index.ts:83–90`, `SocialPublishStatus` governs the multi-platform scheduling and distribution lifecycle across YouTube Shorts, Instagram Reels, and Facebook Video.

### Defined States
- `NOT_STARTED`: Distribution record created; no platform schedules assigned.
- `DRAFT`: Platform package prepared (title, caption, tags) but uncommitted.
- `SCHEDULED`: Scheduled with future timestamp; locked for broadcast.
- `UPLOADED`: Media uploaded to platform servers; processing.
- `PUBLISHED`: Live post confirmed; public URL and platform post ID recorded.
- `FAILED`: API upload or token error; flagged for retry.

---

## 2. Publishing Transition Flow

```
[NOT_STARTED] -> [DRAFT] -> [SCHEDULED] -> [UPLOADED] -> [PUBLISHED]
                    ^            |             |              |
                    |            v             v              v
                    +------- [FAILED] <--------+              (Terminal Success)
                                 |
                                 +---> [RETRY] ---> [SCHEDULED]
```

---

## 3. Multi-Platform State Divergence Hazard

In the `PUBLISHING` sheet tab, each platform maintains independent status columns:
- `youtube_status`
- `instagram_status`
- `facebook_status`

However, the top-level `Publishing` entity contains an aggregate `status` column. Code inspection of `src/lib/services/publishing.service.ts:445–460` reveals that the aggregate status is calculated as:
```typescript
if (completedCount === totalPlatformsCount && totalPlatformsCount > 0) {
  status = SocialPublishStatus.PUBLISHED;
} else if (hasAnyFailure) {
  status = SocialPublishStatus.FAILED;
} else if (hasAnyScheduled) {
  status = SocialPublishStatus.SCHEDULED;
}
```

### The Partial Publication Asymmetry Problem
If YouTube Shorts publishes successfully (`PUBLISHED`), but Instagram Reels upload fails (`FAILED`), the aggregate status is flagged as `FAILED`. The UI renders the video as "Publishing Failed", obscuring the fact that the content is already live on YouTube. If an operator clicks "Retry Publishing", the system re-attempts the entire package, potentially publishing a duplicate video to YouTube if platform-level deduplication is bypassed.
