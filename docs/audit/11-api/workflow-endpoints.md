# Workflow Endpoints Forensic Audit (15-Stage Conveyor Mapping)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 23 of 30  

---

## 1. 15-Stage Business Workflow vs Backend Endpoints

The 15 stages of the Burra Pariksha production conveyor map to the following backend API endpoints:

| Stage # | Stage Name | Governing API Endpoints | Current Status Value | Target Status Value |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Question Generation | `POST /api/questions`, `POST /api/questions/ai-generate` | `DRAFT` | `PENDING_VERIFICATION` |
| **02** | Question Verification | `POST /api/questions/:id/verify` | `PENDING_VERIFICATION` | `VERIFIED` / `REJECTED` |
| **03** | Audience Script | `POST /api/videos/:id/script`, `POST /api/scripts/ai-generate` | `SCRIPTING` | `SCRIPT_COMPLETED` |
| **04** | Teleprompter & Filming| `POST /api/videos/:id/teleprompter` | `READY_TO_RECORD` | `RECORDING` |
| **05** | Raw Video | `POST /api/videos/:id/record` | `RECORDING` | `RECORDED` |
| **06** | Editing Bay | `POST /api/videos/:id/edit` | `EDITING` | `EDITED` |
| **07** | Final QC | `POST /api/videos/:id/final-qc` | `FINAL_REVIEW` | `READY_TO_PUBLISH` |
| **08** | Thumbnail Creation | `POST /api/videos/:id/thumbnail` | `THUMBNAIL_DRAFT` | `THUMBNAIL_APPROVED` |
| **09** | Pinned Comment | `POST /api/videos/:id/pinned-comment` | `COMMENT_DRAFT` | `COMMENT_APPROVED` |
| **10** | Social Review | `POST /api/social-reviews/:id/approve` | `SOCIAL_REVIEW` | `SOCIAL_APPROVED` |
| **11** | Publishing Setup | `POST /api/publishing/schedule` | `READY_TO_PUBLISH` | `SCHEDULED` |
| **12** | Published | `POST /api/publishing/:id/record-live` | `SCHEDULED` | `PUBLISHED` |
| **13** | Platform Sync | `POST /api/publishing/sync` | `PUBLISHED` | `SYNCED` |
| **14** | Analytics | `GET /api/analytics/overview` | `SYNCED` | `ANALYTICS_COLLECTED` |
| **15** | Intelligence Loop | `POST /api/comment-intelligence/analyze` | `ANALYTICS_COLLECTED` | `CLOSED_LOOP` |
