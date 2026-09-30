# Final RBAC & Access Control Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 41 of 41  

---

## 1. Executive Forensic Verdict

> **"Does the current application have a complete and consistently enforced access-control chain?"**  
> **FORENSIC VERDICT: PARTIALLY**

### Evidence-Based Synthesis:
1. **Robust API & Object Security:** Backend Express APIs and domain services enforce strict cryptographic HMAC-SHA256 authentication, role checks (`requireRole`), and object-level assignment/ownership verification (`objectAuthService`).
2. **Frontend Route Guard Gap:** Frontend routing lacks page-level role guards; once authenticated, any user can mount any page view, though backend APIs will reject unauthorized mutations.
3. **Global Admin Authority:** Administrators possess complete operational bypass across all workflows, assignments, and recovery endpoints.
4. **Key Gaps:**
   - **First Authentication Gap:** Lack of mandatory multi-factor authentication (MFA) for high-privilege disaster recovery tools.
   - **First Authorization Gap:** Missing route-level role gates in React Router (`App.tsx`).
   - **First Resource-Access Gap:** Repository layer lacks data-level access controls, relying entirely on service layer discipline.
   - **Most Privileged Admin Action:** `POST /api/recovery/restore/full` (Overwrites all worksheets with snapshot archive).
   - **Most Important Frontend/Backend Mismatch:** Frontend renders full dashboard views for unauthorized roles who cannot trigger the underlying actions.

---

## 2. Mandatory Master Access-Control Matrix

| USER/ROLE | CAPABILITY | PAGE | ACTION | RESOURCE | CURRENT STATE | NEXT STATE | API | SERVICE | PERSISTENCE | BACKEND ENFORCED |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **QUESTION_CREATOR**| `question.draft` | `/studio` | Save Draft | `QuestionDraft` | None | `DRAFT` | `POST /api/question-drafts` | `question-draft.service` | `QUESTION_DRAFTS` | **YES** |
| **QUESTION_EDITOR** | `question.verify`| `/questions/verify` | Approve Draft | `Question` | `DRAFT` | `APPROVED` | `POST /api/questions/create-from-draft`| `question.service` | `QUESTIONS` | **YES** |
| **SCRIPT_WRITER** | `script.author` | `/videos/:id` | Save Script | `Script` | None | `SCRIPT_READY` | `POST /api/scripts` | `script.service` | `SCRIPTS` | **YES** |
| **STUDIO_PRESENTER**| `video.film` | `/videos/:id` | Log Take | `Video` | `SCRIPT_READY` | `RECORDING` | `PATCH /api/videos/:id/status`| `video.service` | `VIDEOS` | **YES** |
| **STUDIO_PRESENTER**| `video.upload` | `/videos/:id` | Upload Raw | `MediaAsset` | `RECORDING` | `RECORDED` | `POST /api/videos/:id/upload-raw` | `google-drive.service` | Drive + `MEDIA_ASSETS` | **YES** |
| **VIDEO_EDITOR** | `video.edit` | `/videos/:id` | Save Render | `Video` | `RECORDED` | `EDITED` | `PATCH /api/videos/:id/status`| `video.service` | Drive + `VIDEOS` | **YES** |
| **REVIEWER** | `video.qc` | `/videos/:id` | Certify QC | `Video` | `EDITED` | `READY_TO_UPLOAD`| `PATCH /api/videos/:id/status`| `production-asset-validation`| `VIDEOS` | **YES** |
| **THUMBNAIL_DESIGNER**|`thumbnail.upload`|`/videos/:id` | Approve Thumb | `Thumbnail` | None | `APPROVED` | `POST /api/thumbnails` | `thumbnail.service` | Drive + `THUMBNAILS` | **YES** |
| **REVIEWER** | `social.review` | `/social-review/:id`| Approve Social| `SocialReview`| None | `APPROVED` | `POST /api/social-reviews/:id/approve`| `social-review.service` | `SOCIAL_REVIEWS` | **YES** |
| **PUBLISHING_MGR** | `publishing.schedule`|`/publishing` | Schedule Slot | `Publishing` | `DRAFT` | `SCHEDULED` | `POST /api/publishing/schedule` | `publishing.service` | `PUBLISHING` | **YES** |
| **PUBLISHING_MGR** | `publishing.publish` |`/publishing` | Ingest Live URL| `Publishing` | `SCHEDULED`| `PUBLISHED` | `POST /api/publishing/mark-published` | `publishing.service` | `PUBLISHING` | **YES** |
| **ANALYTICS_VIEWER**| `analytics.view` | `/analytics/*` | View Metrics | `Analytics` | Any | Any | `GET /api/analytics/summary` | `analytics.service` | `ANALYTICS` | **YES** |
| **ADMIN** | `admin.recover` | `/recovery` | Full Restore | Database | Any | Reset | `POST /api/recovery/restore/full` | `restoreExecutionService` | All Sheets | **YES** |
