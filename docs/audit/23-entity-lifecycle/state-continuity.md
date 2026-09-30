# State Continuity Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 21 of 35  

---

## 1. Lifecycle State Machine Timeline

| Stage | Entity | State Field | Observed Value | Authority | State Synchronization Target |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | `QuestionDraft` | `status` | `DRAFT` | `question-draft.service.ts` | None |
| **02** | `Question` | `status` | `APPROVED` | `question.service.ts` | `Question.videoStatus = QUEUED` |
| **02** | `Video` | `status` | `QUEUED` | `video.service.ts` | `Question.videoStatus` |
| **03** | `Video` | `status` | `SCRIPT_READY` | `script.service.ts` | Optional |
| **04** | `Video` | `status` | `RECORDING` | `video.service.ts` | `Question.videoStatus = RECORDING` |
| **05** | `Video` | `status` | `RECORDED` | `video.service.ts` | `Question.videoStatus = RECORDED` |
| **06** | `Video` | `status` | `EDITING` -> `EDITED` | `video.service.ts` | `Question.videoStatus = EDITED` |
| **07** | `Video` | `status` | `READY_TO_UPLOAD` | `video.service.ts` | `Publishing.videoReady = true` |
| **08** | `Thumbnail` | `status` | `APPROVED` | `thumbnail.service.ts` | `Publishing.thumbnailReady = true` |
| **09** | `SocialReview`| `status` | `APPROVED` | `social-review.service.ts` | `Publishing.pinnedCommentReady = true` |
| **10** | `Publishing` | `status` | `SCHEDULED` | `publishing.service.ts` | Gate D Validated |
| **11** | `Publishing` | `youtube.status`| `PUBLISHED` | `publishing.service.ts` | **FAILS TO CASCADE TO VIDEO** |

---

## 2. State Desynchronization Evidence

### Discrepancy 1: Question.videoStatus vs Video.status (STG-CRIT-02)
In `src/lib/services/video.service.ts:transitionStatus`:
```typescript
try {
  await this.questionsRepository.updateRecord(video.questionId, {
    videoStatus: nextStatus as any,
  });
} catch (qErr) {
  // QUESTION STATUS UPDATE FAILS SILENTLY!
  console.warn('Could not sync videoStatus to question:', qErr);
}
```
If the question update throws (e.g. rate limit, row lock), the error is swallowed. `Video.status` advances, but `Question.videoStatus` is permanently frozen.

### Discrepancy 2: Publishing.status vs Video.status (STG-HIGH-02)
When `markPlatformPublished()` executes in `publishing.service.ts`, it updates `PUBLISHING` but never notifies `VideoService`. `Video.status` in `VIDEOS` sheet remains `READY_TO_UPLOAD` permanently.
