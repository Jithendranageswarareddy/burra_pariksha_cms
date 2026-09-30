# Data Access Involvement (Google Sheets & Storage)

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

Total files touching Google Sheets or Google Drive: **94**

| Path | Category | Google Sheets Role | Google Drive Role |
| :--- | :--- | :--- | :--- |
| `.env.example` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `02-repository-inventory.md` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `05-backend-data-map.md` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `06-canonical-architecture.md` | undefined | - | Active Binary / Folder Access |
| `09-api-convergence-implementation.md` | undefined | - | Active Binary / Folder Access |
| `10-production-readiness.md` | undefined | Active Worksheet Access | - |
| `10-service-convergence-implementation.md` | undefined | - | Active Binary / Folder Access |
| `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` | undefined | - | Active Binary / Folder Access |
| `README.md` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `scripts/audit-and-clean-bp-cnt-000001.ts` | undefined | - | Active Binary / Folder Access |
| `scripts/clean-audit-log.ts` | undefined | Active Worksheet Access | - |
| `scripts/cleanup-and-migrate-users.ts` | undefined | Active Worksheet Access | - |
| `scripts/comprehensive-audit.ts` | undefined | Active Worksheet Access | - |
| `scripts/execute-phase-2b.ts` | undefined | Active Worksheet Access | - |
| `scripts/execute-phase-2c.ts` | undefined | Active Worksheet Access | - |
| `scripts/execute-phase-2d.ts` | undefined | Active Worksheet Access | - |
| `scripts/execute-production-baseline-reset.ts` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `scripts/final-baseline-read-only-audit.ts` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `scripts/google-oauth-setup.ts` | undefined | - | Active Binary / Folder Access |
| `scripts/live-audit-and-reset.ts` | undefined | Active Worksheet Access | - |
| `scripts/phase-b-launch-reset.ts` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `scripts/purge-test-data-for-production.ts` | undefined | Active Worksheet Access | - |
| `scripts/restore-sequences-phase-e.ts` | undefined | Active Worksheet Access | - |
| `scripts/taxonomy-cross-audit.ts` | undefined | Active Worksheet Access | - |
| `scripts/verify-canonical-content-id.ts` | undefined | Active Worksheet Access | - |
| `scripts/verify-drive-state.ts` | undefined | - | Active Binary / Folder Access |
| `scripts/verify-worksheet-preservation.ts` | undefined | Active Worksheet Access | - |
| `server.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/google-sheets/client.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/analytics.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/base.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/comment-intelligence.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/intelligence.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/social-comments.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/repositories/strategy-recommendation.repository.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/data-integrity.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/deletion-safety.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/google-drive.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/services/operational-health.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/operational-recovery.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/phase14-drive.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/services/phase17-video-production.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/services/phase18-thumbnail-intelligence.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/services/production-sheet-initializer.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/snapshot-exporter.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/spreadsheet-verification.service.ts` | undefined | Active Worksheet Access | - |
| `src/lib/services/thumbnail.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/lib/services/video.service.ts` | undefined | - | Active Binary / Folder Access |
| `src/server/routes.ts` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `src/tests/deletion-safety-pipeline.test.ts` | undefined | Active Worksheet Access | - |
| `src/tests/execute-phase-2-cleanup.ts` | undefined | Active Worksheet Access | - |
| `src/tests/execute-phase-4a-topics.ts` | undefined | Active Worksheet Access | - |
| `src/tests/execute-phase-4b1-subtopics.ts` | undefined | Active Worksheet Access | - |
| `src/tests/execute-safe-remediation.ts` | undefined | Active Worksheet Access | - |
| `src/tests/execute-testdata-cleanup.ts` | undefined | Active Worksheet Access | - |
| `src/tests/find-context.ts` | undefined | Active Worksheet Access | - |
| `src/tests/forensic-audit-check.ts` | undefined | Active Worksheet Access | - |
| `src/tests/live-production-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/p02-request-pressure-protection.test.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase11-canonical-lifecycle-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase12-review-assignment-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase12-step4-production-asset-readiness.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase13-9-thumbnail-rollback-remediation.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase13-ai-refinement-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase13-live-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase13-step1-publishing-scheduling.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase14-production-drive-verification.ts` | undefined | Active Worksheet Access | Active Binary / Folder Access |
| `src/tests/phase14-real-drive-e2e.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase15-step5-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase16-step2-lifecycle-orchestration.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase16-step3-rbac-gate.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase17-video-workflow-verification.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase18-thumbnail-intelligence.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase20-social-review.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase3-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/phase7-oauth-verification.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase7-real-drive-e2e.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase7-verification.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase8-recovery-verification.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/phase9-content-workflow-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/production-sheet-initializer-test.ts` | undefined | Active Worksheet Access | - |
| `src/tests/purge-test-artifacts.ts` | undefined | Active Worksheet Access | - |
| `src/tests/qa-user-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/qs14b-e2e-production-execution.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/question-contract-regression.test.ts` | undefined | Active Worksheet Access | - |
| `src/tests/run-phase30-social-comments.ts` | undefined | Active Worksheet Access | - |
| `src/tests/sequence-self-healing-resilience.test.ts` | undefined | Active Worksheet Access | - |
| `src/tests/stage02-video-transitions.test.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/stage8-continuous-verification.ts` | undefined | - | Active Binary / Folder Access |
| `src/tests/task2-content-master-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/task2b-taxonomy-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/task2c-question-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/task4-question-creation-engine-verification.ts` | undefined | Active Worksheet Access | - |
| `src/tests/test-isolation-safety-gate.test.ts` | undefined | Active Worksheet Access | - |
