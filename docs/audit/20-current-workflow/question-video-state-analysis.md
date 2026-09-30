# Question.videoStatus vs. Video.status Conflict

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 36 of 41  

---

## 1. Deep Dive into State Desynchronization

### The Asymmetric Writer Architecture:
1. **Video Table:** When a status changes, `videosRepository.updateRecord(videoId, { status: newStatus })` executes.
2. **Question Table:** In `src/lib/services/video.service.ts:405-420`:
```typescript
try {
  const question = await questionsRepository.findById(updatedVideo.questionId);
  if (question) {
    let questionVideoStatus = newStatus;
    if (newStatus === VideoProductionStatus.CANCELLED) {
      questionVideoStatus = VideoProductionStatus.CANCELLED;
    }
    await questionsRepository.updateRecord(question.id, {
      videoStatus: questionVideoStatus,
      updatedAt: now,
    });
  }
} catch (syncErr) {
  console.warn(`Failed to synchronize question status for video "${videoId}":`, syncErr);
}
```

### Concrete Impact:
- **Error Swallowing:** The `try/catch` block catches any failure in updating the Question row and logs `console.warn`.
- **Permanent Divergence:** The caller receives a successful HTTP 200 response because `Video.status` succeeded. However, `Question.videoStatus` in `QUESTIONS` remains unchanged.
- **UI Inconsistency:** `/questions` lists the video in `QUEUED` state, while `/videos` displays it as `EDITING`.
