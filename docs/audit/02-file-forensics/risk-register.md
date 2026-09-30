# Risk Register (File-Level Forensics)

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

High & Critical Risk Files: **48** files

| Risk Level | File Path | Inbound Consumers | Forensic Risk Justification |
| :---: | :--- | :---: | :--- |
| **HIGH** | `scripts/execute-production-baseline-reset.ts` | 0 | Destructive operational script with capability to wipe Google Sheets worksheets |
| **HIGH** | `scripts/purge-test-data-for-production.ts` | 1 | Destructive operational script with capability to wipe Google Sheets worksheets |
| **CRITICAL** | `server.ts` | 0 | Core system driver with direct mutations to production external infrastructure |
| **CRITICAL** | `src/lib/google-sheets/client.ts` | 113 | Core system driver with direct mutations to production external infrastructure |
| **HIGH** | `src/lib/ownership/data-ownership.ts` | 0 | Core business state machine and RBAC safety gates governing production data mutations |
| **HIGH** | `src/lib/ownership/index.ts` | 1 | Core business state machine and RBAC safety gates governing production data mutations |
| **HIGH** | `src/lib/repositories/analytics.repository.ts` | 8 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/assignments.repository.ts` | 19 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/audit-log.repository.ts` | 37 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/base.repository.ts` | 29 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/categories.repository.ts` | 9 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/comment-intelligence.repository.ts` | 7 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/content-batches.repository.ts` | 5 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/content-masters.repository.ts` | 44 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/content-plans.repository.ts` | 6 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/index.ts` | 1 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/intelligence.repository.ts` | 12 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/media-assets.repository.ts` | 16 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/phase20-social-reviews.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/phase22-publishing.repository.ts` | 1 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/pinned-comment-packages.repository.ts` | 7 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/pinned-comment-versions.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/pinned-comments.repository.ts` | 20 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/platform-adaptations.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/publishing.repository.ts` | 20 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/question-config.repository.ts` | 8 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/question-drafts.repository.ts` | 5 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/question-videos.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/questions.repository.ts` | 85 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/refinement-candidates.repository.ts` | 0 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/script-versions.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/scripts.repository.ts` | 34 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/sequences.repository.ts` | 24 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/social-comments.repository.ts` | 7 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/social-reviews.repository.ts` | 23 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/strategy-recommendation.repository.ts` | 3 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/subtopics.repository.ts` | 11 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/thumbnail-candidates.repository.ts` | 5 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/thumbnail-versions.repository.ts` | 5 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/thumbnails.repository.ts` | 27 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/topics.repository.ts` | 12 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/users.repository.ts` | 31 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/validations.repository.ts` | 13 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/videos.repository.ts` | 51 | Direct data access layer writing/reading Google Sheets worksheets |
| **HIGH** | `src/lib/repositories/workflow.repository.ts` | 15 | Direct data access layer writing/reading Google Sheets worksheets |
| **CRITICAL** | `src/lib/services/google-drive.service.ts` | 22 | Core system driver with direct mutations to production external infrastructure |
| **HIGH** | `src/lib/services/question.service.ts` | 38 | Core business state machine and RBAC safety gates governing production data mutations |
| **HIGH** | `src/lib/services/video.service.ts` | 26 | Core business state machine and RBAC safety gates governing production data mutations |
