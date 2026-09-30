# Consumer Map

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

This document identifies **WHO USES WHAT** across the 636 audited files.

## Top 25 Most Consumed Modules (Highest Inbound Coupling)

| Rank | File Path | Inbound Consumers | Primary Functional Responsibility |
| :--- | :--- | :---: | :--- |
| 1 | `src/design-system/types.ts` | **370 files** | Atomic design system primitive or token definition |
| 2 | `src/lib/ai/types.ts` | **369 files** | Application utility or helper module |
| 3 | `src/lib/google-sheets/client.ts` | **113 files** | Google Sheets API client, rate limiting, and error types |
| 4 | `src/lib/schemas/google-sheets-schema.ts` | **94 files** | Application utility or helper module |
| 5 | `src/lib/repositories/questions.repository.ts` | **85 files** | Data access repository for questions worksheet |
| 6 | `src/lib/google-sheets/errors.ts` | **60 files** | Google Sheets API client, rate limiting, and error types |
| 7 | `src/lib/api-client.ts` | **59 files** | Application utility or helper module |
| 8 | `src/design-system/components/Button.tsx` | **51 files** | Atomic design system primitive or token definition |
| 9 | `src/lib/repositories/videos.repository.ts` | **51 files** | Data access repository for videos worksheet |
| 10 | `src/components/common/Button.tsx` | **50 files** | Domain UI React component for common |
| 11 | `src/lib/services/id.service.ts` | **48 files** | Domain orchestration service singleton for id |
| 12 | `src/lib/services/audit.service.ts` | **46 files** | Domain orchestration service singleton for audit |
| 13 | `src/lib/services/taxonomy.service.ts` | **46 files** | Domain orchestration service singleton for taxonomy |
| 14 | `src/lib/repositories/content-masters.repository.ts` | **44 files** | Data access repository for content-masters worksheet |
| 15 | `src/lib/services/auth.service.ts` | **44 files** | Domain orchestration service singleton for auth |
| 16 | `src/lib/services/question.service.ts` | **38 files** | Domain orchestration service singleton for question |
| 17 | `src/lib/repositories/audit-log.repository.ts` | **37 files** | Data access repository for audit-log worksheet |
| 18 | `src/lib/repositories/scripts.repository.ts` | **34 files** | Data access repository for scripts worksheet |
| 19 | `src/design-system/components/Badge.tsx` | **33 files** | Atomic design system primitive or token definition |
| 20 | `src/lib/services/snapshot-exporter.service.ts` | **32 files** | Domain orchestration service singleton for snapshot-exporter |
| 21 | `src/lib/repositories/users.repository.ts` | **31 files** | Data access repository for users worksheet |
| 22 | `src/components/layout/Header.tsx` | **29 files** | Domain UI React component for layout |
| 23 | `src/lib/repositories/base.repository.ts` | **29 files** | Data access repository for base worksheet |
| 24 | `src/design-system/components/PageHeader.tsx` | **28 files** | Atomic design system primitive or token definition |
| 25 | `src/components/layout/PageHeader.tsx` | **27 files** | Domain UI React component for layout |

---

## Unconsumed Files (0 Inbound Consumers Detected)

*(Note: Having 0 inbound consumers does not automatically classify a file as dead code. Root runners, scripts, test files, and top-level entry points are executed externally via CLI or container commands).* 

Total unconsumed files: **284**

| Path | Category | Reason for 0 Inbound Consumers |
| :--- | :--- | :--- |
| `.dockerignore` | undefined | Standalone execution unit |
| `.env.example` | undefined | Standalone execution unit |
| `.gitignore` | undefined | Standalone execution unit |
| `01-product-truth.md` | undefined | Documentation file (Static reference) |
| `02-repository-inventory.md` | undefined | Documentation file (Static reference) |
| `03-routing-navigation-audit.md` | undefined | Documentation file (Static reference) |
| `04-page-workflow-map.md` | undefined | Documentation file (Static reference) |
| `05-backend-data-map.md` | undefined | Documentation file (Static reference) |
| `06-canonical-architecture.md` | undefined | Documentation file (Static reference) |
| `07-page-ownership-implementation.md` | undefined | Documentation file (Static reference) |
| `08-production-workflow-verification.md` | undefined | Documentation file (Static reference) |
| `08-workflow-convergence-implementation.md` | undefined | Documentation file (Static reference) |
| `08A-workflow-convergence-remediation.md` | undefined | Documentation file (Static reference) |
| `09-api-convergence-implementation.md` | undefined | Documentation file (Static reference) |
| `09-production-hardening.md` | undefined | Documentation file (Static reference) |
| `10-production-readiness.md` | undefined | Documentation file (Static reference) |
| `10-service-convergence-implementation.md` | undefined | Documentation file (Static reference) |
| `11-legacy-removal-implementation.md` | undefined | Documentation file (Static reference) |
| `11-repository-convergence-implementation.md` | undefined | Documentation file (Static reference) |
| `12-data-ownership-implementation.md` | undefined | Documentation file (Static reference) |
| `12-final-verification-report.md` | undefined | Documentation file (Static reference) |
| `13-github-local-reconciliation-report.md` | undefined | Documentation file (Static reference) |
| `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` | undefined | Documentation file (Static reference) |
| `Dockerfile` | undefined | Standalone execution unit |
| `FINAL-TEST-DATA-DELETION-MANIFEST.md` | undefined | Documentation file (Static reference) |
| `README.md` | undefined | Documentation file (Static reference) |
| `bun.lock` | undefined | Standalone execution unit |
| `full-repo-inventory.json` | undefined | Configuration or static data dump |
| `index.html` | undefined | Standalone execution unit |
| `metadata.json` | undefined | Configuration or static data dump |
| `package.json` | undefined | Configuration or static data dump |
| `repo-inventory.json` | undefined | Configuration or static data dump |
| `run-phase10-runner.ts` | undefined | Standalone execution unit |
| `run-phase9-runner.ts` | undefined | Standalone execution unit |
| `run-stage8-runner.ts` | undefined | Standalone execution unit |
| `scripts/audit-and-clean-bp-cnt-000001.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/clean-audit-log.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/cleanup-and-migrate-users.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/comprehensive-audit.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/execute-phase-2b.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/execute-phase-2c.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/execute-phase-2d.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/execute-production-baseline-reset.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/final-baseline-read-only-audit.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/google-oauth-setup.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/live-audit-and-reset.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/phase-b-launch-reset.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/restore-sequences-phase-e.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/seed-100-questions-e2e-workflow.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/taxonomy-cross-audit.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/test-task-3b2-ui-e2e.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/verify-canonical-content-id.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/verify-drive-state.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/verify-gcs-state.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/verify-task5.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `scripts/verify-worksheet-preservation.ts` | undefined | Maintenance script (Invoked via npx tsx) |
| `server.ts` | undefined | Server runtime entry point (CMD node / npm start) |
| `src/components/common/LoadingState.tsx` | undefined | Standalone execution unit |
| `src/components/common/TechnicalDetails.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/ChannelPerformanceSection.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/DailyWorkflowGuide.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/DashboardFilterBar.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/PipelineVisualizer.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/StaleContentSection.tsx` | undefined | Standalone execution unit |
| `src/components/dashboard/TodaysWorkSection.tsx` | undefined | Standalone execution unit |
| `src/components/publishing/PublishingTable.tsx` | undefined | Standalone execution unit |
| `src/design-system/components/Form.tsx` | undefined | Standalone execution unit |
| `src/design-system/components/Icon.tsx` | undefined | Standalone execution unit |
| `src/design-system/components/Select.tsx` | undefined | Standalone execution unit |
| `src/design-system/components/SuccessState.tsx` | undefined | Standalone execution unit |
| `src/design-system/components/WorkflowStepNav.tsx` | undefined | Standalone execution unit |
| `src/lib/ai/providers/xai.client.ts` | undefined | Standalone execution unit |
| `src/lib/ai/verifier/arbitration.ts` | undefined | Standalone execution unit |
| `src/lib/ownership/data-ownership.ts` | undefined | Standalone execution unit |
| `src/lib/repositories/refinement-candidates.repository.ts` | undefined | Standalone execution unit |
| `src/lib/validation/interfaces.ts` | undefined | Standalone execution unit |
| `src/main.tsx` | undefined | Vite frontend client entry point (Loaded by index.html) |
| `src/pages/ProductionBoardPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/PublishingPackagePage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoEditPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoFinalPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoPinnedCommentPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoRecordPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoReviewScriptPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/pages/VideoThumbnailPage.tsx` | undefined | Routed page (Imported dynamically or referenced via router) |
| `src/tests/api-client-header-regression.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/canonical-sequence-parsing.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/category-decoupling-verification.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/comprehensive-e2e-suite.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/creation-compensation-resilience.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/d01-concurrency-protection.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/deletion-safety-pipeline.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/edit-integration-test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/execute-phase-2-cleanup.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/execute-phase-4a-topics.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/execute-phase-4b1-subtopics.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/execute-safe-remediation.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/execute-testdata-cleanup.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/final-cleanup-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/find-context.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/forensic-audit-check.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/forensic-audit-results.txt` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/fraction-persistence-retest.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/fraction-protection.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/hybrid-math-boundary.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/idempotency-concurrency-resilience.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/integration-semantic.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/language-default-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/library-integration-retest.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/live-production-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/multi-take-persistence.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/negative-tests.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/p02-request-pressure-protection.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/parse-audit-calls.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase-5-question-model.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase-6-configuration-engine.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase-7-ai-generation-engine.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase03-design-system-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase03-security-regression.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase04-shell-navigation-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase04-taxonomy-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase05-dashboard-home-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase06-question-workflow-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase07-video-workflow-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase08-asset-review-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase09-publishing-workflow-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase10-analytics-experience-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase10-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase11-legacy-ui-simplification-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase11a-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase11b-auth-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase12-final-ui-ux-acceptance-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-8-assignment-race-remediation.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-9-thumbnail-rollback-remediation.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-step1-rbac-audit.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-step2-retry-logic.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-step3-package-copier.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-step4-publishing-assignments.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase13-step5-publishing-integration.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase14-real-drive-e2e.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase14-step5-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase15-step6-assignment-deduplication-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase16-step2-lifecycle-orchestration.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase16-step3-rbac-gate.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase16-step3-ui-integration.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase2-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase27-social-analytics-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase28-social-performance-intelligence-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase3-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase4-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase5-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase6-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase7-oauth-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase7-real-drive-e2e.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase7-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase8-recovery-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase8a-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/phase8b-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/pipeline-convergence-sequence-resilience.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/production-sheet-initializer-test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/purge-test-artifacts.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qa-user-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs-duplicate-check-regression.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs-repair-regression.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs-successive-percentage-math.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs-validation-alias-regression.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs14b-e2e-production-execution.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs18b-blind-math-verification.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs19b-runtime-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs19d-server-static-serving.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/qs21b-mathematical-safety-gate.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/question-config-infrastructure.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/question-contract-regression.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/question-studio-config-integration.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/question-style-persistence.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/real-life-context-configuration.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-all-regressions.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase11-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase11-step1-dashboard.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase11-step2-manager-dashboard.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase11-step3-specialist-workboards.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase12-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase12-step2.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase12-step3.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase12-step4.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase13-live.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase13-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase13-step1.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase14-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase15-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase15-step5.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase16-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase17-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase18-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase19-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase20-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase21-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase22-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase23-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase24-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase25-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase26-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase27-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase28-only.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase29.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase30-social-comments.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase31-comment-intelligence.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase32-c4-feedback-loop.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-phase9.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-task2.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-task3d4.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-task3d5.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-task3e1.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/run-task3f55.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/semantic-verification.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/sequence-self-healing-resilience.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/stage01-draft-workflow-separation.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/stage02-targeted-bugfixes.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/stage02-video-transitions.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/step01-question-studio-workflow-state.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/studio-e2e-integration.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/surgical-repair.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2b-taxonomy-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2c-question-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2d-gemini-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2d1-gemini-fallback-math.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e1-question-to-video.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e2-video-script-versioning.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e3-thumbnail-workflow.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e4-pinned-comment-workflow.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e5-cleanup-safety.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e5-publishing-workflow.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task2e6-final-pipeline-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3-taxonomy-engine-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3a-planning-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3d1-assignment-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3d2-rbac-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3d3-review-workflow-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3e2-production-board-api.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3e3-readiness-rules-inspection.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f4-restore-validator-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f4-snapshot-exporter-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410a-snapshot-config-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410b-durable-archive-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410c-durable-archive-integration-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410d-recovery-archive-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410e-gcs-smoke-test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f410f-scheduler-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47a-granular-question-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47b-granular-video-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47c-granular-script-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47d-granular-thumbnail-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47e-granular-pinned-comment-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47f-granular-publishing-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f47g-granular-assignment-restore-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f48-full-snapshot-preflight-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f48-full-snapshot-restore-execution-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f48-full-snapshot-restore-plan-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f48-full-snapshot-restore-planner-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-full-restore-api-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-full-restore-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-granular-restore-api-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-granular-restore-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-admin-status-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-dry-run-api-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-dry-run-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-security-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-snapshot-history-ui-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task3f49-recovery-status-api-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task4-question-creation-engine-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task5b-security-correctness-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task6b-provider-abstraction-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task6c-orchestrator-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task6d-validation-adapter-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task7-video-queue-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task7b-unified-studio-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task8-publishing-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/task9-auth-verification.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/test-isolation-safety-gate.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/thumbnail-real-upload-workflow.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/unified-question-creation.test.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/verify-cleanup.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `src/tests/verify-social-analytics-ui.ts` | undefined | Automated test suite (Invoked via CLI runner / npm test) |
| `tsconfig.json` | undefined | Configuration or static data dump |
