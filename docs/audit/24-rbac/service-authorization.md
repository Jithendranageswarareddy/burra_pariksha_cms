# Service-Layer Authorization Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 16 of 41  

---

## 1. Domain Service Defensive Authorization

Multiple services re-verify actor permissions independently of Express middleware:
1. `question.service.ts`:
   - `executeQuestionCreation`: `allowed = [ADMIN, CONTENT_MANAGER, QUESTION_EDITOR, CONTENT_WRITER]`
   - `approveQuestion`: requires `ADMIN` or `CONTENT_MANAGER`.
2. `video.service.ts`:
   - `verifyVideoRole`: `allowed = [ADMIN, CONTENT_MANAGER, VIDEO_EDITOR, PUBLISHING_MANAGER]`.
3. `phase17-video-production.service.ts`:
   - Checks role arrays before saving recording metadata or rendering cuts.
