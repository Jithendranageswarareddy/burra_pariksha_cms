# Complete File-by-File Forensic Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28
**Audit Mode:** Read-Only Forensic Analysis
**Total Verified Files:** 636 (Excludes node_modules, .git, and generated docs/)

## Forensic Inventory Master Table

| ID | Path | Language / Size | Primary Purpose | Consumers | API | Sheets | Drive | Workflow Stage | Duplicate? | Legacy? | Risk |
| :- | :--- | :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- | :--- | :--- |
| `FILE-0001` | `.dockerignore` | (none) (0.0 KB) | Exclusions from Docker container build context | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0002` | `.env.example` | .example (0.7 KB) | Template environment variable reference without secrets | 0 | - | YES | YES | NONE | NO | CURRENT | LOW |
| `FILE-0003` | `.gitignore` | (none) (0.1 KB) | Git version control file and directory exclusion rules | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0004` | `01-product-truth.md` | .md (72.3 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0005` | `02-repository-inventory.md` | .md (46.3 KB) | Root milestone architectural specification or audit document | 0 | YES | YES | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0006` | `03-routing-navigation-audit.md` | .md (65.1 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0007` | `04-page-workflow-map.md` | .md (74.2 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0008` | `05-backend-data-map.md` | .md (97.9 KB) | Root milestone architectural specification or audit document | 0 | YES | YES | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0009` | `06-canonical-architecture.md` | .md (66.0 KB) | Root milestone architectural specification or audit document | 0 | YES | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0010` | `07-page-ownership-implementation.md` | .md (6.6 KB) | Root milestone architectural specification or audit document | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0011` | `08-production-workflow-verification.md` | .md (10.2 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0012` | `08-workflow-convergence-implementation.md` | .md (13.4 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0013` | `08A-workflow-convergence-remediation.md` | .md (5.9 KB) | Root milestone architectural specification or audit document | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0014` | `09-api-convergence-implementation.md` | .md (9.2 KB) | Root milestone architectural specification or audit document | 0 | YES | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0015` | `09-production-hardening.md` | .md (24.6 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0016` | `10-production-readiness.md` | .md (15.2 KB) | Root milestone architectural specification or audit document | 0 | YES | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0017` | `10-service-convergence-implementation.md` | .md (11.7 KB) | Root milestone architectural specification or audit document | 0 | YES | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0018` | `11-legacy-removal-implementation.md` | .md (8.0 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0019` | `11-repository-convergence-implementation.md` | .md (8.9 KB) | Root milestone architectural specification or audit document | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0020` | `12-data-ownership-implementation.md` | .md (13.9 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0021` | `12-final-verification-report.md` | .md (9.8 KB) | Root milestone architectural specification or audit document | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0022` | `13-github-local-reconciliation-report.md` | .md (10.9 KB) | Root milestone architectural specification or audit document | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | HISTORICAL | LOW |
| `FILE-0023` | `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` | .md (11.8 KB) | Root milestone architectural specification or audit document | 0 | YES | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0024` | `Dockerfile` | (none) (0.7 KB) | Production multi-stage Node 20 Alpine container specification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0025` | `FINAL-TEST-DATA-DELETION-MANIFEST.md` | .md (8.0 KB) | Root milestone architectural specification or audit document | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0026` | `README.md` | .md (7.4 KB) | Root milestone architectural specification or audit document | 0 | - | YES | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0027` | `bun.lock` | .lock (84.8 KB) | Bun binary/text dependency resolution lockfile | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0028` | `full-repo-inventory.json` | .json (65.8 KB) | Application utility or helper module | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | SAME | LEGACY CANDIDATE | LOW |
| `FILE-0029` | `index.html` | .html (1.1 KB) | Single Page Application HTML entry shell with Google Fonts | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0030` | `metadata.json` | .json (0.3 KB) | Google AI Studio application identity manifest | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0031` | `package.json` | .json (3.4 KB) | NPM manifest, project scripts and dependencies specification | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0032` | `repo-inventory.json` | .json (45.1 KB) | Application utility or helper module | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | SAME | LEGACY CANDIDATE | LOW |
| `FILE-0033` | `run-phase10-runner.ts` | .ts (0.4 KB) | Batch CLI test runner | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0034` | `run-phase9-runner.ts` | .ts (0.3 KB) | Batch CLI test runner | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0035` | `run-stage8-runner.ts` | .ts (0.4 KB) | Batch CLI test runner | 0 | - | - | - | NONE | POSSIBLE | CURRENT | LOW |
| `FILE-0036` | `scripts/audit-and-clean-bp-cnt-000001.ts` | .ts (21.6 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0037` | `scripts/clean-audit-log.ts` | .ts (2.7 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0038` | `scripts/cleanup-and-migrate-users.ts` | .ts (7.5 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0039` | `scripts/comprehensive-audit.ts` | .ts (5.8 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0040` | `scripts/execute-phase-2b.ts` | .ts (14.7 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | LEGACY CANDIDATE | LOW |
| `FILE-0041` | `scripts/execute-phase-2c.ts` | .ts (20.2 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | LEGACY CANDIDATE | LOW |
| `FILE-0042` | `scripts/execute-phase-2d.ts` | .ts (8.8 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | LEGACY CANDIDATE | LOW |
| `FILE-0043` | `scripts/execute-production-baseline-reset.ts` | .ts (16.3 KB) | CLI maintenance, verification, reset, or migration script | 0 | YES | YES | YES | NONE | NO | CURRENT | HIGH |
| `FILE-0044` | `scripts/final-baseline-read-only-audit.ts` | .ts (9.2 KB) | CLI maintenance, verification, reset, or migration script | 0 | YES | YES | YES | NONE | NO | CURRENT | LOW |
| `FILE-0045` | `scripts/google-oauth-setup.ts` | .ts (4.3 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0046` | `scripts/live-audit-and-reset.ts` | .ts (3.7 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0047` | `scripts/phase-b-launch-reset.ts` | .ts (24.9 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | LEGACY CANDIDATE | LOW |
| `FILE-0048` | `scripts/purge-test-data-for-production.ts` | .ts (15.7 KB) | CLI maintenance, verification, reset, or migration script | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | HIGH |
| `FILE-0049` | `scripts/restore-sequences-phase-e.ts` | .ts (19.2 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0050` | `scripts/seed-100-questions-e2e-workflow.ts` | .ts (32.2 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0051` | `scripts/taxonomy-cross-audit.ts` | .ts (5.3 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0052` | `scripts/test-task-3b2-ui-e2e.ts` | .ts (22.8 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0053` | `scripts/verify-canonical-content-id.ts` | .ts (6.9 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0054` | `scripts/verify-drive-state.ts` | .ts (3.6 KB) | CLI maintenance, verification, reset, or migration script | 0 | YES | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0055` | `scripts/verify-gcs-state.ts` | .ts (1.3 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0056` | `scripts/verify-task5.ts` | .ts (13.4 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0057` | `scripts/verify-worksheet-preservation.ts` | .ts (3.2 KB) | CLI maintenance, verification, reset, or migration script | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0058` | `server.ts` | .ts (2.2 KB) | Express server bootstrap, Vite middleware mounting, API registration | 0 | YES | - | YES | NONE | NO | CURRENT | CRITICAL |
| `FILE-0059` | `src/App.tsx` | .tsx (10.9 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0060` | `src/components/assignments/AssignmentBadge.tsx` | .tsx (3.8 KB) | Domain UI React component for assignments | 4 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0061` | `src/components/assignments/AssignmentModal.tsx` | .tsx (20.6 KB) | Domain UI React component for assignments | 4 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0062` | `src/components/assignments/EntityAssignmentsSection.tsx` | .tsx (8.5 KB) | Domain UI React component for assignments | 2 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0063` | `src/components/common/Button.tsx` | .tsx (0.3 KB) | Domain UI React component for common | 50 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0064` | `src/components/common/DifficultyBadge.tsx` | .tsx (0.9 KB) | Domain UI React component for common | 6 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0065` | `src/components/common/EmptyState.tsx` | .tsx (0.3 KB) | Domain UI React component for common | 13 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0066` | `src/components/common/LoadingState.tsx` | .tsx (0.6 KB) | Domain UI React component for common | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0067` | `src/components/common/Modal.tsx` | .tsx (0.3 KB) | Domain UI React component for common | 13 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0068` | `src/components/common/SearchInput.tsx` | .tsx (0.8 KB) | Domain UI React component for common | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0069` | `src/components/common/StatCard.tsx` | .tsx (2.1 KB) | Domain UI React component for common | 4 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0070` | `src/components/common/StatusBadge.tsx` | .tsx (2.4 KB) | Domain UI React component for common | 9 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0071` | `src/components/common/TechnicalDetails.tsx` | .tsx (3.4 KB) | Domain UI React component for common | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0072` | `src/components/dashboard/ChannelPerformanceSection.tsx` | .tsx (7.9 KB) | Domain UI React component for dashboard | 0 | - | - | - | 14 Performance Review (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0073` | `src/components/dashboard/ContinueProductionCard.tsx` | .tsx (7.6 KB) | Domain UI React component for dashboard | 2 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0074` | `src/components/dashboard/ConveyorBeltVisualizer.tsx` | .tsx (7.0 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0075` | `src/components/dashboard/DailyWorkflowGuide.tsx` | .tsx (3.9 KB) | Domain UI React component for dashboard | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0076` | `src/components/dashboard/DashboardFilterBar.tsx` | .tsx (4.4 KB) | Domain UI React component for dashboard | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0077` | `src/components/dashboard/ExecutiveHeroBanner.tsx` | .tsx (7.3 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0078` | `src/components/dashboard/ExecutiveVitalsBento.tsx` | .tsx (6.9 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0079` | `src/components/dashboard/GlobalSearchBar.tsx` | .tsx (6.2 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0080` | `src/components/dashboard/OperationalDispatch.tsx` | .tsx (20.0 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0081` | `src/components/dashboard/PipelineVisualizer.tsx` | .tsx (12.2 KB) | Domain UI React component for dashboard | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0082` | `src/components/dashboard/RecentAuditFeed.tsx` | .tsx (5.0 KB) | Domain UI React component for dashboard | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0083` | `src/components/dashboard/StaleContentSection.tsx` | .tsx (6.5 KB) | Domain UI React component for dashboard | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0084` | `src/components/dashboard/TodaysWorkSection.tsx` | .tsx (8.3 KB) | Domain UI React component for dashboard | 0 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0085` | `src/components/dashboard/WhatsWaitingSection.tsx` | .tsx (8.5 KB) | Domain UI React component for dashboard | 2 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0086` | `src/components/layout/ErrorBoundary.tsx` | .tsx (3.9 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0087` | `src/components/layout/Header.tsx` | .tsx (3.7 KB) | Domain UI React component for layout | 29 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0088` | `src/components/layout/Layout.tsx` | .tsx (3.6 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0089` | `src/components/layout/NotificationsMenu.tsx` | .tsx (8.0 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0090` | `src/components/layout/PageHeader.tsx` | .tsx (0.4 KB) | Domain UI React component for layout | 27 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0091` | `src/components/layout/Sidebar.tsx` | .tsx (13.9 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0092` | `src/components/layout/SystemHealthIndicator.tsx` | .tsx (6.1 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0093` | `src/components/layout/UserProfileMenu.tsx` | .tsx (6.4 KB) | Domain UI React component for layout | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0094` | `src/components/production/PipelineProgress.tsx` | .tsx (2.6 KB) | Domain UI React component for production | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0095` | `src/components/production/ProductionJourneyBar.tsx` | .tsx (11.2 KB) | Domain UI React component for production | 8 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0096` | `src/components/production/ProductionKanban.tsx` | .tsx (10.4 KB) | Domain UI React component for production | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0097` | `src/components/production/ProductionTable.tsx` | .tsx (7.3 KB) | Domain UI React component for production | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0098` | `src/components/publishing/FinalizePublishingModal.tsx` | .tsx (6.3 KB) | Domain UI React component for publishing | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0099` | `src/components/publishing/PackageCopierModal.tsx` | .tsx (16.3 KB) | Domain UI React component for publishing | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0100` | `src/components/publishing/PublishScheduleModal.tsx` | .tsx (9.5 KB) | Domain UI React component for publishing | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0101` | `src/components/publishing/PublishingAssignmentModal.tsx` | .tsx (10.7 KB) | Domain UI React component for publishing | 2 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0102` | `src/components/publishing/PublishingTable.tsx` | .tsx (23.5 KB) | Domain UI React component for publishing | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0103` | `src/components/publishing/PublishingWorkflowHeader.tsx` | .tsx (7.1 KB) | Domain UI React component for publishing | 3 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0104` | `src/components/publishing/RecordPublicationModal.tsx` | .tsx (9.5 KB) | Domain UI React component for publishing | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0105` | `src/components/publishing/RetryPlatformModal.tsx` | .tsx (8.1 KB) | Domain UI React component for publishing | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0106` | `src/components/questions/QuestionTable.tsx` | .tsx (10.4 KB) | Domain UI React component for questions | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0107` | `src/components/questions/QuestionWorkflowHeader.tsx` | .tsx (5.0 KB) | Domain UI React component for questions | 4 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0108` | `src/components/queue/QueueTable.tsx` | .tsx (8.4 KB) | Domain UI React component for queue | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0109` | `src/components/social/AssetWorkflowHeader.tsx` | .tsx (7.0 KB) | Domain UI React component for social | 4 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0110` | `src/components/social/SocialReviewWorkspace.tsx` | .tsx (52.6 KB) | Domain UI React component for social | 2 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0111` | `src/components/video/EditingWorkspace.tsx` | .tsx (28.9 KB) | Domain UI React component for video | 1 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0112` | `src/components/video/FinalReviewWorkspace.tsx` | .tsx (19.4 KB) | Domain UI React component for video | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0113` | `src/components/video/PinnedCommentWorkspace.tsx` | .tsx (11.8 KB) | Domain UI React component for video | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0114` | `src/components/video/PublishingWorkspace.tsx` | .tsx (47.0 KB) | Domain UI React component for video | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0115` | `src/components/video/RecordingWorkspace.tsx` | .tsx (48.9 KB) | Domain UI React component for video | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0116` | `src/components/video/ScriptWorkspace.tsx` | .tsx (51.5 KB) | Domain UI React component for video | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0117` | `src/components/video/ThumbnailWorkspace.tsx` | .tsx (40.7 KB) | Domain UI React component for video | 1 | YES | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0118` | `src/components/video/VideoWorkflowHeader.tsx` | .tsx (5.9 KB) | Domain UI React component for video | 5 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0119` | `src/config/constants.ts` | .ts (11.1 KB) | Domain business rule configuration and operational parameters | 14 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0120` | `src/config/media-upload.config.ts` | .ts (3.0 KB) | Domain business rule configuration and operational parameters | 7 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0121` | `src/config/navigation.ts` | .ts (5.8 KB) | Domain business rule configuration and operational parameters | 5 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0122` | `src/config/question-creation.config.ts` | .ts (8.3 KB) | Domain business rule configuration and operational parameters | 10 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0123` | `src/config/roles.ts` | .ts (10.4 KB) | Domain business rule configuration and operational parameters | 5 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0124` | `src/config/snapshot.config.ts` | .ts (5.2 KB) | Domain business rule configuration and operational parameters | 10 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0125` | `src/contexts/AuthContext.tsx` | .tsx (2.0 KB) | Application utility or helper module | 14 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0126` | `src/contexts/ProductionJourneyContext.tsx` | .tsx (34.3 KB) | Application utility or helper module | 10 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0127` | `src/design-system/components/Alert.tsx` | .tsx (2.4 KB) | Atomic design system primitive or token definition | 13 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0128` | `src/design-system/components/AppBreadcrumbs.tsx` | .tsx (9.4 KB) | Atomic design system primitive or token definition | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0129` | `src/design-system/components/Badge.tsx` | .tsx (3.2 KB) | Atomic design system primitive or token definition | 33 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0130` | `src/design-system/components/Button.tsx` | .tsx (4.2 KB) | Atomic design system primitive or token definition | 51 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0131` | `src/design-system/components/Card.tsx` | .tsx (3.3 KB) | Atomic design system primitive or token definition | 23 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0132` | `src/design-system/components/EmptyState.tsx` | .tsx (1.8 KB) | Atomic design system primitive or token definition | 14 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0133` | `src/design-system/components/ErrorState.tsx` | .tsx (2.6 KB) | Atomic design system primitive or token definition | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0134` | `src/design-system/components/Form.tsx` | .tsx (2.1 KB) | Atomic design system primitive or token definition | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0135` | `src/design-system/components/Icon.tsx` | .tsx (0.7 KB) | Atomic design system primitive or token definition | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0136` | `src/design-system/components/Input.tsx` | .tsx (4.6 KB) | Atomic design system primitive or token definition | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0137` | `src/design-system/components/Loading.tsx` | .tsx (3.7 KB) | Atomic design system primitive or token definition | 10 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0138` | `src/design-system/components/Modal.tsx` | .tsx (4.9 KB) | Atomic design system primitive or token definition | 14 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0139` | `src/design-system/components/PageHeader.tsx` | .tsx (2.7 KB) | Atomic design system primitive or token definition | 28 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0140` | `src/design-system/components/Select.tsx` | .tsx (2.4 KB) | Atomic design system primitive or token definition | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0141` | `src/design-system/components/StepIndicator.tsx` | .tsx (5.3 KB) | Atomic design system primitive or token definition | 3 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0142` | `src/design-system/components/SuccessState.tsx` | .tsx (1.9 KB) | Atomic design system primitive or token definition | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0143` | `src/design-system/components/Table.tsx` | .tsx (5.9 KB) | Atomic design system primitive or token definition | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0144` | `src/design-system/components/WorkflowStepNav.tsx` | .tsx (5.6 KB) | Atomic design system primitive or token definition | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0145` | `src/design-system/index.ts` | .ts (0.9 KB) | Atomic design system primitive or token definition | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0146` | `src/design-system/tokens.ts` | .ts (7.9 KB) | Atomic design system primitive or token definition | 16 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0147` | `src/design-system/types.ts` | .ts (0.8 KB) | Atomic design system primitive or token definition | 370 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0148` | `src/index.css` | .css (0.3 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0149` | `src/lib/ai/config.ts` | .ts (1.3 KB) | Application utility or helper module | 18 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0150` | `src/lib/ai/error.ts` | .ts (4.3 KB) | Application utility or helper module | 5 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0151` | `src/lib/ai/gemini.client.ts` | .ts (1.6 KB) | Application utility or helper module | 17 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0152` | `src/lib/ai/gemini.service.ts` | .ts (94.8 KB) | Application utility or helper module | 14 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0153` | `src/lib/ai/index.ts` | .ts (0.8 KB) | Application utility or helper module | 1 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0154` | `src/lib/ai/orchestrator.ts` | .ts (6.6 KB) | Application utility or helper module | 4 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0155` | `src/lib/ai/phase24-orchestrator.service.ts` | .ts (16.0 KB) | Application utility or helper module | 19 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0156` | `src/lib/ai/phase24-registry.ts` | .ts (3.7 KB) | Application utility or helper module | 7 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0157` | `src/lib/ai/prompts/comment-intelligence.prompt.ts` | .ts (4.1 KB) | Structured LLM prompt template for comment-intelligence | 2 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0158` | `src/lib/ai/prompts/generation.prompt.ts` | .ts (11.1 KB) | Structured LLM prompt template for generation | 5 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0159` | `src/lib/ai/prompts/performance-intelligence.prompt.ts` | .ts (4.9 KB) | Structured LLM prompt template for performance-intelligence | 1 | - | - | - | 14 Performance Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0160` | `src/lib/ai/prompts/pinned-comment.prompt.ts` | .ts (3.6 KB) | Structured LLM prompt template for pinned-comment | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0161` | `src/lib/ai/prompts/platform-adaptation.prompt.ts` | .ts (3.1 KB) | Structured LLM prompt template for platform-adaptation | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0162` | `src/lib/ai/prompts/refinement.prompt.ts` | .ts (5.4 KB) | Structured LLM prompt template for refinement | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0163` | `src/lib/ai/prompts/script-generation.prompt.ts` | .ts (4.3 KB) | Structured LLM prompt template for script-generation | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0164` | `src/lib/ai/prompts/social-hook.prompt.ts` | .ts (5.3 KB) | Structured LLM prompt template for social-hook | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0165` | `src/lib/ai/prompts/social-metadata.prompt.ts` | .ts (4.7 KB) | Structured LLM prompt template for social-metadata | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0166` | `src/lib/ai/prompts/social-quality.prompt.ts` | .ts (5.4 KB) | Structured LLM prompt template for social-quality | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0167` | `src/lib/ai/prompts/teleprompter-script.prompt.ts` | .ts (6.5 KB) | Structured LLM prompt template for teleprompter-script | 2 | - | - | - | 04 Teleprompter & Filming (DIRECT) | NO | CURRENT | LOW |
| `FILE-0168` | `src/lib/ai/prompts/thumbnail-intelligence.prompt.ts` | .ts (2.9 KB) | Structured LLM prompt template for thumbnail-intelligence | 1 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0169` | `src/lib/ai/prompts/validation.prompt.ts` | .ts (2.6 KB) | Structured LLM prompt template for validation | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0170` | `src/lib/ai/providers/base.adapter.ts` | .ts (11.2 KB) | LLM provider adapter for base | 9 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0171` | `src/lib/ai/providers/cerebras.adapter.ts` | .ts (2.1 KB) | LLM provider adapter for cerebras | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0172` | `src/lib/ai/providers/cohere.adapter.ts` | .ts (2.1 KB) | LLM provider adapter for cohere | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0173` | `src/lib/ai/providers/experimental-labs.adapter.ts` | .ts (2.4 KB) | LLM provider adapter for experimental-labs | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0174` | `src/lib/ai/providers/gemini.adapter.ts` | .ts (2.3 KB) | LLM provider adapter for gemini | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0175` | `src/lib/ai/providers/groq.adapter.ts` | .ts (2.1 KB) | LLM provider adapter for groq | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0176` | `src/lib/ai/providers/huggingface.adapter.ts` | .ts (2.4 KB) | LLM provider adapter for huggingface | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0177` | `src/lib/ai/providers/mistral.adapter.ts` | .ts (2.1 KB) | LLM provider adapter for mistral | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0178` | `src/lib/ai/providers/openrouter.adapter.ts` | .ts (2.3 KB) | LLM provider adapter for openrouter | 2 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0179` | `src/lib/ai/providers/xai.client.ts` | .ts (1.4 KB) | LLM provider adapter for xai.client.ts | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0180` | `src/lib/ai/registry.ts` | .ts (2.6 KB) | Application utility or helper module | 9 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0181` | `src/lib/ai/schemas/comment-intelligence.schema.ts` | .ts (8.0 KB) | Zod structured output schema for comment-intelligence | 2 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0182` | `src/lib/ai/schemas/performance-intelligence.schema.ts` | .ts (6.3 KB) | Zod structured output schema for performance-intelligence | 1 | - | - | - | 14 Performance Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0183` | `src/lib/ai/schemas/pinned-comment.schema.ts` | .ts (1.9 KB) | Zod structured output schema for pinned-comment | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0184` | `src/lib/ai/schemas/platform-adaptation.schema.ts` | .ts (3.7 KB) | Zod structured output schema for platform-adaptation | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0185` | `src/lib/ai/schemas/question-candidate.schema.ts` | .ts (4.0 KB) | Zod structured output schema for question-candidate | 14 | - | - | - | 01 Question Generation (DIRECT) | NO | CURRENT | LOW |
| `FILE-0186` | `src/lib/ai/schemas/script-generation.schema.ts` | .ts (2.9 KB) | Zod structured output schema for script-generation | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0187` | `src/lib/ai/schemas/social-hook.schema.ts` | .ts (4.6 KB) | Zod structured output schema for social-hook | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0188` | `src/lib/ai/schemas/social-metadata.schema.ts` | .ts (3.1 KB) | Zod structured output schema for social-metadata | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0189` | `src/lib/ai/schemas/social-quality.schema.ts` | .ts (5.1 KB) | Zod structured output schema for social-quality | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0190` | `src/lib/ai/schemas/teleprompter-script.schema.ts` | .ts (3.4 KB) | Zod structured output schema for teleprompter-script | 2 | - | - | - | 04 Teleprompter & Filming (DIRECT) | NO | CURRENT | LOW |
| `FILE-0191` | `src/lib/ai/schemas/thumbnail-intelligence.schema.ts` | .ts (4.6 KB) | Zod structured output schema for thumbnail-intelligence | 1 | YES | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0192` | `src/lib/ai/schemas/validation.schema.ts` | .ts (1.4 KB) | Zod structured output schema for validation | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0193` | `src/lib/ai/testing/mock-provider.ts` | .ts (5.0 KB) | Application utility or helper module | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0194` | `src/lib/ai/types.ts` | .ts (3.6 KB) | Application utility or helper module | 369 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0195` | `src/lib/ai/validators/blind-verifier.ts` | .ts (26.5 KB) | Linguistic/orthographic semantic validator for Telugu and math | 7 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0196` | `src/lib/ai/validators/candidate.validator.ts` | .ts (14.3 KB) | Linguistic/orthographic semantic validator for Telugu and math | 17 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0197` | `src/lib/ai/validators/mathematical.validator.ts` | .ts (36.7 KB) | Linguistic/orthographic semantic validator for Telugu and math | 9 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0198` | `src/lib/ai/validators/script.validator.ts` | .ts (4.2 KB) | Linguistic/orthographic semantic validator for Telugu and math | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0199` | `src/lib/ai/validators/semantic-reasoning.provider.ts` | .ts (5.8 KB) | Linguistic/orthographic semantic validator for Telugu and math | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0200` | `src/lib/ai/verifier/arbitration.ts` | .ts (2.0 KB) | Application utility or helper module | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0201` | `src/lib/api-client.ts` | .ts (58.1 KB) | Application utility or helper module | 59 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0202` | `src/lib/google-sheets/client.ts` | .ts (37.2 KB) | Google Sheets API client, rate limiting, and error types | 113 | - | YES | - | NONE | NO | CURRENT | CRITICAL |
| `FILE-0203` | `src/lib/google-sheets/errors.ts` | .ts (9.5 KB) | Google Sheets API client, rate limiting, and error types | 60 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0204` | `src/lib/google-sheets/helpers.ts` | .ts (14.1 KB) | Google Sheets API client, rate limiting, and error types | 11 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0205` | `src/lib/mock-data/dashboard.ts` | .ts (4.3 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0206` | `src/lib/mock-data/index.ts` | .ts (1.0 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0207` | `src/lib/mock-data/production.ts` | .ts (4.5 KB) | Application utility or helper module | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0208` | `src/lib/mock-data/publishing.ts` | .ts (3.3 KB) | Application utility or helper module | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0209` | `src/lib/mock-data/questions.ts` | .ts (12.0 KB) | Application utility or helper module | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0210` | `src/lib/mock-data/queue.ts` | .ts (3.2 KB) | Application utility or helper module | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0211` | `src/lib/mock-data/taxonomy.ts` | .ts (4.3 KB) | Application utility or helper module | 6 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0212` | `src/lib/ownership/data-ownership.ts` | .ts (8.4 KB) | Data ownership matrix and RBAC operation safety gate | 0 | YES | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0213` | `src/lib/ownership/index.ts` | .ts (0.2 KB) | Data ownership matrix and RBAC operation safety gate | 1 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0214` | `src/lib/repositories/analytics.repository.ts` | .ts (5.1 KB) | Data access repository for analytics worksheet | 8 | - | YES | - | 13 Analytics (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0215` | `src/lib/repositories/assignments.repository.ts` | .ts (3.9 KB) | Data access repository for assignments worksheet | 19 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0216` | `src/lib/repositories/audit-log.repository.ts` | .ts (12.7 KB) | Data access repository for audit-log worksheet | 37 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0217` | `src/lib/repositories/base.repository.ts` | .ts (21.5 KB) | Data access repository for base worksheet | 29 | - | YES | - | NONE | NO | CURRENT | HIGH |
| `FILE-0218` | `src/lib/repositories/categories.repository.ts` | .ts (1.1 KB) | Data access repository for categories worksheet | 9 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0219` | `src/lib/repositories/comment-intelligence.repository.ts` | .ts (2.7 KB) | Data access repository for comment-intelligence worksheet | 7 | - | YES | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0220` | `src/lib/repositories/content-batches.repository.ts` | .ts (1.8 KB) | Data access repository for content-batches worksheet | 5 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0221` | `src/lib/repositories/content-masters.repository.ts` | .ts (1.9 KB) | Data access repository for content-masters worksheet | 44 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0222` | `src/lib/repositories/content-plans.repository.ts` | .ts (1.9 KB) | Data access repository for content-plans worksheet | 6 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0223` | `src/lib/repositories/index.ts` | .ts (1.7 KB) | Data access repository for index.ts worksheet | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | HIGH |
| `FILE-0224` | `src/lib/repositories/intelligence.repository.ts` | .ts (2.2 KB) | Data access repository for intelligence worksheet | 12 | - | YES | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0225` | `src/lib/repositories/media-assets.repository.ts` | .ts (2.9 KB) | Data access repository for media-assets worksheet | 16 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0226` | `src/lib/repositories/phase20-social-reviews.repository.ts` | .ts (1.9 KB) | Data access repository for phase20-social-reviews worksheet | 3 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0227` | `src/lib/repositories/phase22-publishing.repository.ts` | .ts (2.2 KB) | Data access repository for phase22-publishing worksheet | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0228` | `src/lib/repositories/pinned-comment-packages.repository.ts` | .ts (3.0 KB) | Data access repository for pinned-comment-packages worksheet | 7 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0229` | `src/lib/repositories/pinned-comment-versions.repository.ts` | .ts (0.2 KB) | Data access repository for pinned-comment-versions worksheet | 3 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0230` | `src/lib/repositories/pinned-comments.repository.ts` | .ts (1.9 KB) | Data access repository for pinned-comments worksheet | 20 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0231` | `src/lib/repositories/platform-adaptations.repository.ts` | .ts (8.4 KB) | Data access repository for platform-adaptations worksheet | 3 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0232` | `src/lib/repositories/publishing.repository.ts` | .ts (4.7 KB) | Data access repository for publishing worksheet | 20 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0233` | `src/lib/repositories/question-config.repository.ts` | .ts (3.5 KB) | Data access repository for question-config worksheet | 8 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0234` | `src/lib/repositories/question-drafts.repository.ts` | .ts (1.9 KB) | Data access repository for question-drafts worksheet | 5 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0235` | `src/lib/repositories/question-videos.repository.ts` | .ts (0.2 KB) | Data access repository for question-videos worksheet | 3 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0236` | `src/lib/repositories/questions.repository.ts` | .ts (4.1 KB) | Data access repository for questions worksheet | 85 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0237` | `src/lib/repositories/refinement-candidates.repository.ts` | .ts (2.4 KB) | Data access repository for refinement-candidates worksheet | 0 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0238` | `src/lib/repositories/script-versions.repository.ts` | .ts (0.2 KB) | Data access repository for script-versions worksheet | 3 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0239` | `src/lib/repositories/scripts.repository.ts` | .ts (2.1 KB) | Data access repository for scripts worksheet | 34 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0240` | `src/lib/repositories/sequences.repository.ts` | .ts (10.0 KB) | Data access repository for sequences worksheet | 24 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0241` | `src/lib/repositories/social-comments.repository.ts` | .ts (5.9 KB) | Data access repository for social-comments worksheet | 7 | - | YES | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0242` | `src/lib/repositories/social-reviews.repository.ts` | .ts (5.5 KB) | Data access repository for social-reviews worksheet | 23 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0243` | `src/lib/repositories/strategy-recommendation.repository.ts` | .ts (1.9 KB) | Data access repository for strategy-recommendation worksheet | 3 | - | YES | - | NONE | NO | CURRENT | HIGH |
| `FILE-0244` | `src/lib/repositories/subtopics.repository.ts` | .ts (1.9 KB) | Data access repository for subtopics worksheet | 11 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0245` | `src/lib/repositories/thumbnail-candidates.repository.ts` | .ts (2.9 KB) | Data access repository for thumbnail-candidates worksheet | 5 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0246` | `src/lib/repositories/thumbnail-versions.repository.ts` | .ts (0.2 KB) | Data access repository for thumbnail-versions worksheet | 5 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0247` | `src/lib/repositories/thumbnails.repository.ts` | .ts (2.1 KB) | Data access repository for thumbnails worksheet | 27 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | HIGH |
| `FILE-0248` | `src/lib/repositories/topics.repository.ts` | .ts (1.5 KB) | Data access repository for topics worksheet | 12 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0249` | `src/lib/repositories/users.repository.ts` | .ts (0.2 KB) | Data access repository for users worksheet | 31 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0250` | `src/lib/repositories/validations.repository.ts` | .ts (6.2 KB) | Data access repository for validations worksheet | 13 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0251` | `src/lib/repositories/videos.repository.ts` | .ts (2.9 KB) | Data access repository for videos worksheet | 51 | - | - | - | NONE | NO | CURRENT | HIGH |
| `FILE-0252` | `src/lib/repositories/workflow.repository.ts` | .ts (1.0 KB) | Data access repository for workflow worksheet | 15 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | HIGH |
| `FILE-0253` | `src/lib/schemas/google-sheets-schema.ts` | .ts (84.1 KB) | Application utility or helper module | 94 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0254` | `src/lib/services/analytics.service.ts` | .ts (9.5 KB) | Domain orchestration service singleton for analytics | 9 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | LOW |
| `FILE-0255` | `src/lib/services/assignment.service.ts` | .ts (50.2 KB) | Domain orchestration service singleton for assignment | 11 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0256` | `src/lib/services/audit.service.ts` | .ts (5.0 KB) | Domain orchestration service singleton for audit | 46 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0257` | `src/lib/services/auth.service.ts` | .ts (12.3 KB) | Domain orchestration service singleton for auth | 44 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0258` | `src/lib/services/comment-intelligence.service.ts` | .ts (19.0 KB) | Domain orchestration service singleton for comment-intelligence | 4 | YES | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0259` | `src/lib/services/content-master.service.ts` | .ts (36.6 KB) | Domain orchestration service singleton for content-master | 21 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0260` | `src/lib/services/content-strategy.service.ts` | .ts (19.8 KB) | Domain orchestration service singleton for content-strategy | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0261` | `src/lib/services/dashboard.service.ts` | .ts (59.6 KB) | Domain orchestration service singleton for dashboard | 5 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0262` | `src/lib/services/data-integrity.service.ts` | .ts (66.7 KB) | Domain orchestration service singleton for data-integrity | 10 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0263` | `src/lib/services/deletion-safety.service.ts` | .ts (9.3 KB) | Domain orchestration service singleton for deletion-safety | 4 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0264` | `src/lib/services/durable-snapshot-archive.service.ts` | .ts (15.8 KB) | Domain orchestration service singleton for durable-snapshot-archive | 7 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0265` | `src/lib/services/full-snapshot-preflight.service.ts` | .ts (8.7 KB) | Domain orchestration service singleton for full-snapshot-preflight | 3 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0266` | `src/lib/services/full-snapshot-restore-execution.service.ts` | .ts (21.9 KB) | Domain orchestration service singleton for full-snapshot-restore-execution | 3 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0267` | `src/lib/services/full-snapshot-restore-plan.service.ts` | .ts (17.2 KB) | Domain orchestration service singleton for full-snapshot-restore-plan | 4 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0268` | `src/lib/services/full-snapshot-restore.service.ts` | .ts (15.7 KB) | Domain orchestration service singleton for full-snapshot-restore | 6 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0269` | `src/lib/services/google-drive.service.ts` | .ts (24.1 KB) | Domain orchestration service singleton for google-drive | 22 | YES | - | YES | NONE | STRONG | CURRENT | CRITICAL |
| `FILE-0270` | `src/lib/services/granular-assignment-restore.service.ts` | .ts (15.5 KB) | Domain orchestration service singleton for granular-assignment-restore | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0271` | `src/lib/services/granular-pinned-comment-restore.service.ts` | .ts (17.0 KB) | Domain orchestration service singleton for granular-pinned-comment-restore | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0272` | `src/lib/services/granular-publishing-restore.service.ts` | .ts (13.7 KB) | Domain orchestration service singleton for granular-publishing-restore | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0273` | `src/lib/services/granular-question-restore.service.ts` | .ts (14.1 KB) | Domain orchestration service singleton for granular-question-restore | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0274` | `src/lib/services/granular-script-restore.service.ts` | .ts (18.3 KB) | Domain orchestration service singleton for granular-script-restore | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0275` | `src/lib/services/granular-thumbnail-restore.service.ts` | .ts (16.5 KB) | Domain orchestration service singleton for granular-thumbnail-restore | 1 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0276` | `src/lib/services/granular-video-restore.service.ts` | .ts (15.8 KB) | Domain orchestration service singleton for granular-video-restore | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0277` | `src/lib/services/id.service.ts` | .ts (4.5 KB) | Domain orchestration service singleton for id | 48 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0278` | `src/lib/services/index.ts` | .ts (2.9 KB) | Domain orchestration service singleton for index.ts | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0279` | `src/lib/services/object-auth.service.ts` | .ts (20.7 KB) | Domain orchestration service singleton for object-auth | 26 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0280` | `src/lib/services/operational-health.service.ts` | .ts (6.0 KB) | Domain orchestration service singleton for operational-health | 3 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0281` | `src/lib/services/operational-recovery.service.ts` | .ts (8.1 KB) | Domain orchestration service singleton for operational-recovery | 2 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0282` | `src/lib/services/phase12-workflow.service.ts` | .ts (17.7 KB) | Domain orchestration service singleton for phase12-workflow | 8 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0283` | `src/lib/services/phase13-refinement.service.ts` | .ts (23.4 KB) | Domain orchestration service singleton for phase13-refinement | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0284` | `src/lib/services/phase14-drive.service.ts` | .ts (9.6 KB) | Domain orchestration service singleton for phase14-drive | 7 | - | - | YES | NONE | STRONG | CURRENT | LOW |
| `FILE-0285` | `src/lib/services/phase15-script-production.service.ts` | .ts (20.0 KB) | Domain orchestration service singleton for phase15-script-production | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0286` | `src/lib/services/phase17-video-production.service.ts` | .ts (23.8 KB) | Domain orchestration service singleton for phase17-video-production | 3 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0287` | `src/lib/services/phase18-thumbnail-intelligence.service.ts` | .ts (27.6 KB) | Domain orchestration service singleton for phase18-thumbnail-intelligence | 1 | - | - | YES | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0288` | `src/lib/services/phase19-pinned-comment-intelligence.service.ts` | .ts (24.7 KB) | Domain orchestration service singleton for phase19-pinned-comment-intelligence | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0289` | `src/lib/services/phase20-social-review.service.ts` | .ts (29.2 KB) | Domain orchestration service singleton for phase20-social-review | 5 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0290` | `src/lib/services/phase21-platform-adaptation.service.ts` | .ts (4.4 KB) | Domain orchestration service singleton for phase21-platform-adaptation | 6 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0291` | `src/lib/services/phase22-publishing-hub.service.ts` | .ts (2.9 KB) | Domain orchestration service singleton for phase22-publishing-hub | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0292` | `src/lib/services/phase23-production.service.ts` | .ts (35.0 KB) | Domain orchestration service singleton for phase23-production | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0293` | `src/lib/services/phase25-consensus.service.ts` | .ts (19.5 KB) | Domain orchestration service singleton for phase25-consensus | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0294` | `src/lib/services/phase26-copilot.service.ts` | .ts (45.5 KB) | Domain orchestration service singleton for phase26-copilot | 1 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0295` | `src/lib/services/pinned-comment.service.ts` | .ts (10.0 KB) | Domain orchestration service singleton for pinned-comment | 5 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0296` | `src/lib/services/planning.service.ts` | .ts (29.9 KB) | Domain orchestration service singleton for planning | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0297` | `src/lib/services/platform-adaptation.service.ts` | .ts (53.1 KB) | Domain orchestration service singleton for platform-adaptation | 9 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0298` | `src/lib/services/production-asset-validation.service.ts` | .ts (6.8 KB) | Domain orchestration service singleton for production-asset-validation | 9 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0299` | `src/lib/services/production-board.service.ts` | .ts (7.4 KB) | Domain orchestration service singleton for production-board | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0300` | `src/lib/services/production-sheet-initializer.service.ts` | .ts (12.2 KB) | Domain orchestration service singleton for production-sheet-initializer | 2 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0301` | `src/lib/services/publishing.service.ts` | .ts (79.4 KB) | Domain orchestration service singleton for publishing | 24 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0302` | `src/lib/services/question-config.service.ts` | .ts (12.6 KB) | Domain orchestration service singleton for question-config | 13 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0303` | `src/lib/services/question-draft.service.ts` | .ts (6.4 KB) | Domain orchestration service singleton for question-draft | 3 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0304` | `src/lib/services/question-validation.service.ts` | .ts (5.5 KB) | Domain orchestration service singleton for question-validation | 7 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0305` | `src/lib/services/question.service.ts` | .ts (41.6 KB) | Domain orchestration service singleton for question | 38 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | HIGH |
| `FILE-0306` | `src/lib/services/restore-validator.service.ts` | .ts (16.2 KB) | Domain orchestration service singleton for restore-validator | 11 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0307` | `src/lib/services/script.service.ts` | .ts (15.5 KB) | Domain orchestration service singleton for script | 14 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0308` | `src/lib/services/sequence-safety.service.ts` | .ts (12.1 KB) | Domain orchestration service singleton for sequence-safety | 5 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0309` | `src/lib/services/similarity.service.ts` | .ts (10.7 KB) | Domain orchestration service singleton for similarity | 4 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0310` | `src/lib/services/smart-random.service.ts` | .ts (8.1 KB) | Domain orchestration service singleton for smart-random | 9 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0311` | `src/lib/services/snapshot-exporter.service.ts` | .ts (4.3 KB) | Domain orchestration service singleton for snapshot-exporter | 32 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0312` | `src/lib/services/snapshot-history.service.ts` | .ts (8.2 KB) | Domain orchestration service singleton for snapshot-history | 4 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0313` | `src/lib/services/snapshot-scheduler.service.ts` | .ts (12.4 KB) | Domain orchestration service singleton for snapshot-scheduler | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0314` | `src/lib/services/social-comments.service.ts` | .ts (11.2 KB) | Domain orchestration service singleton for social-comments | 4 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0315` | `src/lib/services/social-enhancement.service.ts` | .ts (25.8 KB) | Domain orchestration service singleton for social-enhancement | 11 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0316` | `src/lib/services/social-performance-intelligence.service.ts` | .ts (35.2 KB) | Domain orchestration service singleton for social-performance-intelligence | 6 | - | - | - | 14 Performance Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0317` | `src/lib/services/social-quality.service.ts` | .ts (19.3 KB) | Domain orchestration service singleton for social-quality | 2 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0318` | `src/lib/services/social-review.service.ts` | .ts (26.5 KB) | Domain orchestration service singleton for social-review | 21 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0319` | `src/lib/services/spreadsheet-verification.service.ts` | .ts (11.9 KB) | Domain orchestration service singleton for spreadsheet-verification | 2 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0320` | `src/lib/services/taxonomy.service.ts` | .ts (35.8 KB) | Domain orchestration service singleton for taxonomy | 46 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0321` | `src/lib/services/thumbnail.service.ts` | .ts (19.1 KB) | Domain orchestration service singleton for thumbnail | 10 | - | - | YES | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0322` | `src/lib/services/video.service.ts` | .ts (35.7 KB) | Domain orchestration service singleton for video | 26 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | HIGH |
| `FILE-0323` | `src/lib/services/workflow-orchestration.service.ts` | .ts (30.3 KB) | Domain orchestration service singleton for workflow-orchestration | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0324` | `src/lib/services/workflow.service.ts` | .ts (0.2 KB) | Domain orchestration service singleton for workflow | 15 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0325` | `src/lib/validation/ambiguity.detector.ts` | .ts (3.4 KB) | Validation engine for mathematical and question consistency | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0326` | `src/lib/validation/consensus.engine.ts` | .ts (4.3 KB) | Validation engine for mathematical and question consistency | 4 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0327` | `src/lib/validation/consistency.validator.ts` | .ts (4.5 KB) | Validation engine for mathematical and question consistency | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0328` | `src/lib/validation/explanation.validator.ts` | .ts (4.6 KB) | Validation engine for mathematical and question consistency | 4 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0329` | `src/lib/validation/fairness.validator.ts` | .ts (4.0 KB) | Validation engine for mathematical and question consistency | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0330` | `src/lib/validation/gemini-validation.provider.ts` | .ts (4.0 KB) | Validation engine for mathematical and question consistency | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0331` | `src/lib/validation/index.ts` | .ts (0.4 KB) | Validation engine for mathematical and question consistency | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0332` | `src/lib/validation/interfaces.ts` | .ts (0.4 KB) | Validation engine for mathematical and question consistency | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0333` | `src/lib/validation/mathematical-logical.engine.ts` | .ts (54.4 KB) | Validation engine for mathematical and question consistency | 6 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0334` | `src/lib/validation/multi-layer-verification.engine.ts` | .ts (31.9 KB) | Validation engine for mathematical and question consistency | 7 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0335` | `src/lib/validation/options.validator.ts` | .ts (13.6 KB) | Validation engine for mathematical and question consistency | 5 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0336` | `src/lib/validation/question-validation.engine.ts` | .ts (20.9 KB) | Validation engine for mathematical and question consistency | 11 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0337` | `src/lib/validation/testing/mock-validation-provider.ts` | .ts (2.0 KB) | Validation engine for mathematical and question consistency | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0338` | `src/lib/validators/phase15-script.validator.ts` | .ts (4.9 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0339` | `src/lib/validators/phase20-social-quality-gate.validator.ts` | .ts (16.4 KB) | Application utility or helper module | 2 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0340` | `src/lib/validators/pinned-comment-safety.validator.ts` | .ts (10.5 KB) | Application utility or helper module | 4 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0341` | `src/lib/validators/platform-adaptation.validator.ts` | .ts (4.5 KB) | Application utility or helper module | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0342` | `src/lib/validators/question-creation.validator.ts` | .ts (11.2 KB) | Application utility or helper module | 12 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0343` | `src/lib/validators/social-invariance.validator.ts` | .ts (20.7 KB) | Application utility or helper module | 7 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0344` | `src/lib/validators/thumbnail-safety.validator.ts` | .ts (6.4 KB) | Application utility or helper module | 5 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0345` | `src/lib/workflow/canonical-workflow.ts` | .ts (21.0 KB) | Application utility or helper module | 6 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0346` | `src/main.tsx` | .tsx (0.2 KB) | Application utility or helper module | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0347` | `src/pages/AnalyticsExperiencePage.tsx` | .tsx (54.7 KB) | Routed full-page React view component for AnalyticsExperiencePage | 1 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0348` | `src/pages/ContentMasterPage.tsx` | .tsx (65.9 KB) | Routed full-page React view component for ContentMasterPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0349` | `src/pages/DashboardPage.tsx` | .tsx (13.3 KB) | Routed full-page React view component for DashboardPage | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0350` | `src/pages/LoginPage.tsx` | .tsx (7.4 KB) | Routed full-page React view component for LoginPage | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0351` | `src/pages/MyWorkPage.tsx` | .tsx (46.6 KB) | Routed full-page React view component for MyWorkPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0352` | `src/pages/NotFoundPage.tsx` | .tsx (1.0 KB) | Routed full-page React view component for NotFoundPage | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0353` | `src/pages/PlanningPage.tsx` | .tsx (129.2 KB) | Routed full-page React view component for PlanningPage | 1 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0354` | `src/pages/PlatformPackagesPage.tsx` | .tsx (32.5 KB) | Routed full-page React view component for PlatformPackagesPage | 1 | - | - | - | 10 Publishing Setup (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0355` | `src/pages/ProductionBoardPage.tsx` | .tsx (42.1 KB) | Routed full-page React view component for ProductionBoardPage | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0356` | `src/pages/ProductionTrackerPage.tsx` | .tsx (17.5 KB) | Routed full-page React view component for ProductionTrackerPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0357` | `src/pages/PublishingPackagePage.tsx` | .tsx (34.4 KB) | Routed full-page React view component for PublishingPackagePage | 0 | - | - | - | 10 Publishing Setup (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0358` | `src/pages/PublishingPage.tsx` | .tsx (33.2 KB) | Routed full-page React view component for PublishingPage | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0359` | `src/pages/QuestionDetailPage.tsx` | .tsx (54.6 KB) | Routed full-page React view component for QuestionDetailPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0360` | `src/pages/QuestionImprovePage.tsx` | .tsx (40.8 KB) | Routed full-page React view component for QuestionImprovePage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0361` | `src/pages/QuestionLibraryPage.tsx` | .tsx (17.4 KB) | Routed full-page React view component for QuestionLibraryPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0362` | `src/pages/QuestionStudioPage.tsx` | .tsx (69.3 KB) | Routed full-page React view component for QuestionStudioPage | 2 | - | - | - | 01 Question Generation (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0363` | `src/pages/QuestionVerifyApprovePage.tsx` | .tsx (46.3 KB) | Routed full-page React view component for QuestionVerifyApprovePage | 1 | - | - | - | 02 Question Verification (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0364` | `src/pages/QueuePage.tsx` | .tsx (17.1 KB) | Routed full-page React view component for QueuePage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0365` | `src/pages/RecoveryAdminPage.tsx` | .tsx (112.5 KB) | Routed full-page React view component for RecoveryAdminPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0366` | `src/pages/SettingsPage.tsx` | .tsx (127.6 KB) | Routed full-page React view component for SettingsPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0367` | `src/pages/SocialAnalyticsPage.tsx` | .tsx (70.7 KB) | Routed full-page React view component for SocialAnalyticsPage | 1 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0368` | `src/pages/SocialReviewPage.tsx` | .tsx (23.1 KB) | Routed full-page React view component for SocialReviewPage | 1 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0369` | `src/pages/TeamOperationsPage.tsx` | .tsx (48.7 KB) | Routed full-page React view component for TeamOperationsPage | 1 | - | - | - | NONE | NO | CURRENT | MEDIUM |
| `FILE-0370` | `src/pages/VideoCreateScriptPage.tsx` | .tsx (5.3 KB) | Routed full-page React view component for VideoCreateScriptPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0371` | `src/pages/VideoDetailPage.tsx` | .tsx (27.6 KB) | Routed full-page React view component for VideoDetailPage | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0372` | `src/pages/VideoEditPage.tsx` | .tsx (37.0 KB) | Routed full-page React view component for VideoEditPage | 0 | - | - | - | 06 Editing Bay (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0373` | `src/pages/VideoFinalPage.tsx` | .tsx (29.8 KB) | Routed full-page React view component for VideoFinalPage | 0 | - | - | - | 07 Final QC (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0374` | `src/pages/VideoPinnedCommentPage.tsx` | .tsx (24.7 KB) | Routed full-page React view component for VideoPinnedCommentPage | 0 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0375` | `src/pages/VideoRecordPage.tsx` | .tsx (48.4 KB) | Routed full-page React view component for VideoRecordPage | 0 | - | - | - | 04 Teleprompter & Filming (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0376` | `src/pages/VideoReviewScriptPage.tsx` | .tsx (30.9 KB) | Routed full-page React view component for VideoReviewScriptPage | 0 | - | - | - | 03 Audience Script (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0377` | `src/pages/VideoThumbnailPage.tsx` | .tsx (38.8 KB) | Routed full-page React view component for VideoThumbnailPage | 0 | YES | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | MEDIUM |
| `FILE-0378` | `src/server/middleware/auth.middleware.ts` | .ts (4.6 KB) | Express route registration or authentication middleware | 13 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0379` | `src/server/routes.ts` | .ts (240.3 KB) | Express route registration or authentication middleware | 5 | YES | YES | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0380` | `src/server/test-routes.ts` | .ts (30.8 KB) | Express route registration or authentication middleware | 1 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0381` | `src/tests/api-client-header-regression.test.ts` | .ts (2.6 KB) | Automated test suite verifying api-client-header-regression | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0382` | `src/tests/canonical-sequence-parsing.test.ts` | .ts (12.1 KB) | Automated test suite verifying canonical-sequence-parsing | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0383` | `src/tests/category-decoupling-verification.test.ts` | .ts (21.9 KB) | Automated test suite verifying category-decoupling-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0384` | `src/tests/comprehensive-e2e-suite.ts` | .ts (11.1 KB) | Automated test suite verifying comprehensive-e2e-suite | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0385` | `src/tests/creation-compensation-resilience.test.ts` | .ts (17.1 KB) | Automated test suite verifying creation-compensation-resilience | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0386` | `src/tests/d01-concurrency-protection.test.ts` | .ts (11.1 KB) | Automated test suite verifying d01-concurrency-protection | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0387` | `src/tests/deletion-safety-pipeline.test.ts` | .ts (10.7 KB) | Automated test suite verifying deletion-safety-pipeline | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0388` | `src/tests/edit-integration-test.ts` | .ts (7.1 KB) | Automated test suite verifying edit-integration-test | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0389` | `src/tests/execute-phase-2-cleanup.ts` | .ts (6.1 KB) | Automated test suite verifying execute-phase-2-cleanup | 0 | - | YES | - | NONE | NO | LEGACY CANDIDATE | LOW |
| `FILE-0390` | `src/tests/execute-phase-4a-topics.ts` | .ts (9.0 KB) | Automated test suite verifying execute-phase-4a-topics | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0391` | `src/tests/execute-phase-4b1-subtopics.ts` | .ts (11.9 KB) | Automated test suite verifying execute-phase-4b1-subtopics | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0392` | `src/tests/execute-safe-remediation.ts` | .ts (10.0 KB) | Automated test suite verifying execute-safe-remediation | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0393` | `src/tests/execute-testdata-cleanup.ts` | .ts (9.0 KB) | Automated test suite verifying execute-testdata-cleanup | 0 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0394` | `src/tests/final-cleanup-verification.ts` | .ts (5.1 KB) | Automated test suite verifying final-cleanup-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0395` | `src/tests/find-context.ts` | .ts (0.7 KB) | Automated test suite verifying find-context | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0396` | `src/tests/forensic-audit-check.ts` | .ts (1.4 KB) | Automated test suite verifying forensic-audit-check | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0397` | `src/tests/forensic-audit-results.txt` | .txt (9.0 KB) | Automated test suite verifying forensic-audit-results.txt | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0398` | `src/tests/fraction-persistence-retest.ts` | .ts (5.9 KB) | Automated test suite verifying fraction-persistence-retest | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0399` | `src/tests/fraction-protection.test.ts` | .ts (1.8 KB) | Automated test suite verifying fraction-protection | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0400` | `src/tests/hybrid-math-boundary.test.ts` | .ts (5.4 KB) | Automated test suite verifying hybrid-math-boundary | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0401` | `src/tests/idempotency-concurrency-resilience.test.ts` | .ts (25.0 KB) | Automated test suite verifying idempotency-concurrency-resilience | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0402` | `src/tests/integration-semantic.test.ts` | .ts (9.2 KB) | Automated test suite verifying integration-semantic | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0403` | `src/tests/language-default-verification.ts` | .ts (6.9 KB) | Automated test suite verifying language-default-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0404` | `src/tests/library-integration-retest.ts` | .ts (4.7 KB) | Automated test suite verifying library-integration-retest | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0405` | `src/tests/live-production-verification.ts` | .ts (10.9 KB) | Automated test suite verifying live-production-verification | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0406` | `src/tests/multi-take-persistence.test.ts` | .ts (7.7 KB) | Automated test suite verifying multi-take-persistence | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0407` | `src/tests/negative-tests.ts` | .ts (5.9 KB) | Automated test suite verifying negative-tests | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0408` | `src/tests/p02-request-pressure-protection.test.ts` | .ts (10.7 KB) | Automated test suite verifying p02-request-pressure-protection | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0409` | `src/tests/parse-audit-calls.ts` | .ts (1.3 KB) | Automated test suite verifying parse-audit-calls | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0410` | `src/tests/phase-5-question-model.ts` | .ts (30.5 KB) | Automated test suite verifying phase-5-question-model | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0411` | `src/tests/phase-6-configuration-engine.ts` | .ts (16.8 KB) | Automated test suite verifying phase-6-configuration-engine | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0412` | `src/tests/phase-7-ai-generation-engine.ts` | .ts (29.4 KB) | Automated test suite verifying phase-7-ai-generation-engine | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0413` | `src/tests/phase03-design-system-verification.ts` | .ts (11.4 KB) | Automated test suite verifying phase03-design-system-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0414` | `src/tests/phase03-security-regression.ts` | .ts (19.9 KB) | Automated test suite verifying phase03-security-regression | 0 | - | - | - | NONE | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0415` | `src/tests/phase04-shell-navigation-verification.ts` | .ts (18.3 KB) | Automated test suite verifying phase04-shell-navigation-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0416` | `src/tests/phase04-taxonomy-verification.ts` | .ts (18.9 KB) | Automated test suite verifying phase04-taxonomy-verification | 0 | - | - | - | NONE | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0417` | `src/tests/phase05-dashboard-home-verification.ts` | .ts (15.7 KB) | Automated test suite verifying phase05-dashboard-home-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0418` | `src/tests/phase06-question-workflow-verification.ts` | .ts (11.7 KB) | Automated test suite verifying phase06-question-workflow-verification | 0 | - | - | - | 02 Question Verification (DIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0419` | `src/tests/phase07-video-workflow-verification.ts` | .ts (13.0 KB) | Automated test suite verifying phase07-video-workflow-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0420` | `src/tests/phase08-asset-review-verification.ts` | .ts (12.1 KB) | Automated test suite verifying phase08-asset-review-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0421` | `src/tests/phase09-publishing-workflow-verification.ts` | .ts (13.7 KB) | Automated test suite verifying phase09-publishing-workflow-verification | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0422` | `src/tests/phase10-analytics-experience-verification.ts` | .ts (5.4 KB) | Automated test suite verifying phase10-analytics-experience-verification | 0 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | LOW |
| `FILE-0423` | `src/tests/phase10-publishing-verification.ts` | .ts (33.9 KB) | Automated test suite verifying phase10-publishing-verification | 1 | YES | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0424` | `src/tests/phase10-verification.ts` | .ts (41.4 KB) | Automated test suite verifying phase10-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0425` | `src/tests/phase11-canonical-lifecycle-verification.ts` | .ts (20.5 KB) | Automated test suite verifying phase11-canonical-lifecycle-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0426` | `src/tests/phase11-legacy-ui-simplification-verification.ts` | .ts (11.1 KB) | Automated test suite verifying phase11-legacy-ui-simplification-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0427` | `src/tests/phase11-step1-dashboard-verification.ts` | .ts (11.3 KB) | Automated test suite verifying phase11-step1-dashboard-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0428` | `src/tests/phase11-step2-manager-dashboard-verification.ts` | .ts (7.3 KB) | Automated test suite verifying phase11-step2-manager-dashboard-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0429` | `src/tests/phase11-step3-specialist-workboards-verification.ts` | .ts (6.5 KB) | Automated test suite verifying phase11-step3-specialist-workboards-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0430` | `src/tests/phase11a-verification.ts` | .ts (8.4 KB) | Automated test suite verifying phase11a-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0431` | `src/tests/phase11b-auth-verification.ts` | .ts (10.7 KB) | Automated test suite verifying phase11b-auth-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0432` | `src/tests/phase12-final-ui-ux-acceptance-verification.ts` | .ts (49.6 KB) | Automated test suite verifying phase12-final-ui-ux-acceptance-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0433` | `src/tests/phase12-review-assignment-verification.ts` | .ts (24.1 KB) | Automated test suite verifying phase12-review-assignment-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0434` | `src/tests/phase12-step2-production-asset-validation.ts` | .ts (11.6 KB) | Automated test suite verifying phase12-step2-production-asset-validation | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0435` | `src/tests/phase12-step3-production-asset-synchronization.ts` | .ts (16.4 KB) | Automated test suite verifying phase12-step3-production-asset-synchronization | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0436` | `src/tests/phase12-step4-production-asset-readiness.ts` | .ts (14.2 KB) | Automated test suite verifying phase12-step4-production-asset-readiness | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0437` | `src/tests/phase13-8-assignment-race-remediation.ts` | .ts (14.9 KB) | Automated test suite verifying phase13-8-assignment-race-remediation | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0438` | `src/tests/phase13-9-thumbnail-rollback-remediation.ts` | .ts (13.3 KB) | Automated test suite verifying phase13-9-thumbnail-rollback-remediation | 0 | - | - | YES | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0439` | `src/tests/phase13-ai-refinement-verification.ts` | .ts (27.1 KB) | Automated test suite verifying phase13-ai-refinement-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0440` | `src/tests/phase13-live-verification.ts` | .ts (28.4 KB) | Automated test suite verifying phase13-live-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0441` | `src/tests/phase13-step1-publishing-scheduling.ts` | .ts (17.7 KB) | Automated test suite verifying phase13-step1-publishing-scheduling | 1 | - | YES | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0442` | `src/tests/phase13-step1-rbac-audit.ts` | .ts (3.7 KB) | Automated test suite verifying phase13-step1-rbac-audit | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0443` | `src/tests/phase13-step2-retry-logic.ts` | .ts (24.2 KB) | Automated test suite verifying phase13-step2-retry-logic | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0444` | `src/tests/phase13-step3-package-copier.ts` | .ts (25.1 KB) | Automated test suite verifying phase13-step3-package-copier | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0445` | `src/tests/phase13-step4-publishing-assignments.ts` | .ts (35.5 KB) | Automated test suite verifying phase13-step4-publishing-assignments | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0446` | `src/tests/phase13-step5-publishing-integration.ts` | .ts (32.2 KB) | Automated test suite verifying phase13-step5-publishing-integration | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0447` | `src/tests/phase14-production-drive-verification.ts` | .ts (14.7 KB) | Automated test suite verifying phase14-production-drive-verification | 1 | - | YES | YES | NONE | NO | CURRENT | LOW |
| `FILE-0448` | `src/tests/phase14-real-drive-e2e.ts` | .ts (10.5 KB) | Automated test suite verifying phase14-real-drive-e2e | 0 | - | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0449` | `src/tests/phase14-step2-verification.ts` | .ts (12.9 KB) | Automated test suite verifying phase14-step2-verification | 1 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0450` | `src/tests/phase14-step3-verification.ts` | .ts (19.1 KB) | Automated test suite verifying phase14-step3-verification | 1 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0451` | `src/tests/phase14-step4-verification.ts` | .ts (23.4 KB) | Automated test suite verifying phase14-step4-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0452` | `src/tests/phase14-step5-verification.ts` | .ts (12.5 KB) | Automated test suite verifying phase14-step5-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0453` | `src/tests/phase15-script-production-verification.ts` | .ts (14.7 KB) | Automated test suite verifying phase15-script-production-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0454` | `src/tests/phase15-step2-verification.ts` | .ts (11.3 KB) | Automated test suite verifying phase15-step2-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0455` | `src/tests/phase15-step3-verification.ts` | .ts (10.0 KB) | Automated test suite verifying phase15-step3-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0456` | `src/tests/phase15-step5-verification.ts` | .ts (14.8 KB) | Automated test suite verifying phase15-step5-verification | 1 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0457` | `src/tests/phase15-step6-assignment-deduplication-verification.ts` | .ts (19.3 KB) | Automated test suite verifying phase15-step6-assignment-deduplication-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0458` | `src/tests/phase16-human-script-workflow-verification.ts` | .ts (10.6 KB) | Automated test suite verifying phase16-human-script-workflow-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0459` | `src/tests/phase16-step2-lifecycle-orchestration.ts` | .ts (19.7 KB) | Automated test suite verifying phase16-step2-lifecycle-orchestration | 0 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0460` | `src/tests/phase16-step3-rbac-gate.ts` | .ts (13.3 KB) | Automated test suite verifying phase16-step3-rbac-gate | 0 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0461` | `src/tests/phase16-step3-ui-integration.ts` | .ts (12.4 KB) | Automated test suite verifying phase16-step3-ui-integration | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0462` | `src/tests/phase17-video-workflow-verification.ts` | .ts (30.7 KB) | Automated test suite verifying phase17-video-workflow-verification | 1 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0463` | `src/tests/phase18-thumbnail-intelligence.ts` | .ts (24.8 KB) | Automated test suite verifying phase18-thumbnail-intelligence | 1 | - | - | YES | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0464` | `src/tests/phase19-pinned-comment-intelligence.ts` | .ts (26.5 KB) | Automated test suite verifying phase19-pinned-comment-intelligence | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0465` | `src/tests/phase2-verification.ts` | .ts (7.3 KB) | Automated test suite verifying phase2-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0466` | `src/tests/phase20-social-review.ts` | .ts (55.8 KB) | Automated test suite verifying phase20-social-review | 1 | - | - | YES | 09 Social Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0467` | `src/tests/phase21-platform-adaptation.ts` | .ts (41.4 KB) | Automated test suite verifying phase21-platform-adaptation | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0468` | `src/tests/phase22-publishing-hub.ts` | .ts (31.3 KB) | Automated test suite verifying phase22-publishing-hub | 1 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0469` | `src/tests/phase23-production-dashboard.ts` | .ts (24.6 KB) | Automated test suite verifying phase23-production-dashboard | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0470` | `src/tests/phase24-ai-orchestrator.ts` | .ts (31.0 KB) | Automated test suite verifying phase24-ai-orchestrator | 1 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0471` | `src/tests/phase27-social-analytics-verification.ts` | .ts (7.1 KB) | Automated test suite verifying phase27-social-analytics-verification | 0 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | LOW |
| `FILE-0472` | `src/tests/phase28-social-performance-intelligence-verification.ts` | .ts (7.2 KB) | Automated test suite verifying phase28-social-performance-intelligence-verification | 0 | - | - | - | 14 Performance Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0473` | `src/tests/phase29-controlled-strategy-integration-verification.ts` | .ts (7.3 KB) | Automated test suite verifying phase29-controlled-strategy-integration-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0474` | `src/tests/phase29b-posting-time-intelligence-verification.ts` | .ts (9.5 KB) | Automated test suite verifying phase29b-posting-time-intelligence-verification | 1 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0475` | `src/tests/phase3-verification.ts` | .ts (12.5 KB) | Automated test suite verifying phase3-verification | 0 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0476` | `src/tests/phase4-verification.ts` | .ts (14.5 KB) | Automated test suite verifying phase4-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0477` | `src/tests/phase5-verification.ts` | .ts (20.2 KB) | Automated test suite verifying phase5-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0478` | `src/tests/phase6-verification.ts` | .ts (20.5 KB) | Automated test suite verifying phase6-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | TEST LEGACY CANDIDATE | LOW |
| `FILE-0479` | `src/tests/phase7-oauth-verification.ts` | .ts (22.8 KB) | Automated test suite verifying phase7-oauth-verification | 0 | - | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0480` | `src/tests/phase7-real-drive-e2e.ts` | .ts (5.9 KB) | Automated test suite verifying phase7-real-drive-e2e | 0 | YES | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0481` | `src/tests/phase7-verification.ts` | .ts (9.2 KB) | Automated test suite verifying phase7-verification | 0 | - | - | YES | NONE | NO | CURRENT | LOW |
| `FILE-0482` | `src/tests/phase8-recovery-verification.ts` | .ts (16.9 KB) | Automated test suite verifying phase8-recovery-verification | 0 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0483` | `src/tests/phase8a-verification.ts` | .ts (11.7 KB) | Automated test suite verifying phase8a-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0484` | `src/tests/phase8b-verification.ts` | .ts (13.8 KB) | Automated test suite verifying phase8b-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0485` | `src/tests/phase8i-security-qa-verification.ts` | .ts (42.9 KB) | Automated test suite verifying phase8i-security-qa-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0486` | `src/tests/phase9-content-workflow-verification.ts` | .ts (101.1 KB) | Automated test suite verifying phase9-content-workflow-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0487` | `src/tests/phase9-verification.ts` | .ts (25.0 KB) | Automated test suite verifying phase9-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0488` | `src/tests/pipeline-convergence-sequence-resilience.test.ts` | .ts (18.0 KB) | Automated test suite verifying pipeline-convergence-sequence-resilience | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0489` | `src/tests/production-sheet-initializer-test.ts` | .ts (4.5 KB) | Automated test suite verifying production-sheet-initializer-test | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0490` | `src/tests/purge-test-artifacts.ts` | .ts (8.2 KB) | Automated test suite verifying purge-test-artifacts | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0491` | `src/tests/qa-user-verification.ts` | .ts (5.9 KB) | Automated test suite verifying qa-user-verification | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0492` | `src/tests/qa-user.fixture.ts` | .ts (1.2 KB) | Automated test suite verifying qa-user.fixture | 3 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0493` | `src/tests/qs-duplicate-check-regression.test.ts` | .ts (4.3 KB) | Automated test suite verifying qs-duplicate-check-regression | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0494` | `src/tests/qs-repair-regression.test.ts` | .ts (11.1 KB) | Automated test suite verifying qs-repair-regression | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0495` | `src/tests/qs-successive-percentage-math.test.ts` | .ts (8.2 KB) | Automated test suite verifying qs-successive-percentage-math | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0496` | `src/tests/qs-validation-alias-regression.test.ts` | .ts (6.9 KB) | Automated test suite verifying qs-validation-alias-regression | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0497` | `src/tests/qs14b-e2e-production-execution.ts` | .ts (22.1 KB) | Automated test suite verifying qs14b-e2e-production-execution | 0 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0498` | `src/tests/qs18b-blind-math-verification.test.ts` | .ts (14.1 KB) | Automated test suite verifying qs18b-blind-math-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0499` | `src/tests/qs19b-runtime-verification.ts` | .ts (7.0 KB) | Automated test suite verifying qs19b-runtime-verification | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0500` | `src/tests/qs19d-server-static-serving.test.ts` | .ts (7.0 KB) | Automated test suite verifying qs19d-server-static-serving | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0501` | `src/tests/qs21b-mathematical-safety-gate.test.ts` | .ts (14.6 KB) | Automated test suite verifying qs21b-mathematical-safety-gate | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0502` | `src/tests/question-config-infrastructure.test.ts` | .ts (19.7 KB) | Automated test suite verifying question-config-infrastructure | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0503` | `src/tests/question-contract-regression.test.ts` | .ts (14.5 KB) | Automated test suite verifying question-contract-regression | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0504` | `src/tests/question-studio-config-integration.test.ts` | .ts (9.2 KB) | Automated test suite verifying question-studio-config-integration | 0 | YES | - | - | 01 Question Generation (DIRECT) | NO | CURRENT | LOW |
| `FILE-0505` | `src/tests/question-style-persistence.test.ts` | .ts (19.4 KB) | Automated test suite verifying question-style-persistence | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0506` | `src/tests/real-life-context-configuration.test.ts` | .ts (13.4 KB) | Automated test suite verifying real-life-context-configuration | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0507` | `src/tests/run-all-regressions.ts` | .ts (6.0 KB) | Automated test suite verifying run-all-regressions | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0508` | `src/tests/run-phase11-only.ts` | .ts (1.3 KB) | Automated test suite verifying run-phase11-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0509` | `src/tests/run-phase11-step1-dashboard.ts` | .ts (0.7 KB) | Automated test suite verifying run-phase11-step1-dashboard | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0510` | `src/tests/run-phase11-step2-manager-dashboard.ts` | .ts (0.8 KB) | Automated test suite verifying run-phase11-step2-manager-dashboard | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0511` | `src/tests/run-phase11-step3-specialist-workboards.ts` | .ts (0.8 KB) | Automated test suite verifying run-phase11-step3-specialist-workboards | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0512` | `src/tests/run-phase12-only.ts` | .ts (1.3 KB) | Automated test suite verifying run-phase12-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0513` | `src/tests/run-phase12-step2.ts` | .ts (0.3 KB) | Automated test suite verifying run-phase12-step2 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0514` | `src/tests/run-phase12-step3.ts` | .ts (0.3 KB) | Automated test suite verifying run-phase12-step3 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0515` | `src/tests/run-phase12-step4.ts` | .ts (0.3 KB) | Automated test suite verifying run-phase12-step4 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0516` | `src/tests/run-phase13-live.ts` | .ts (0.4 KB) | Automated test suite verifying run-phase13-live | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0517` | `src/tests/run-phase13-only.ts` | .ts (1.3 KB) | Automated test suite verifying run-phase13-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0518` | `src/tests/run-phase13-step1.ts` | .ts (0.4 KB) | Automated test suite verifying run-phase13-step1 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0519` | `src/tests/run-phase14-only.ts` | .ts (1.3 KB) | Automated test suite verifying run-phase14-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0520` | `src/tests/run-phase15-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase15-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0521` | `src/tests/run-phase15-step5.ts` | .ts (2.5 KB) | Automated test suite verifying run-phase15-step5 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0522` | `src/tests/run-phase16-only.ts` | .ts (0.9 KB) | Automated test suite verifying run-phase16-only | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0523` | `src/tests/run-phase17-only.ts` | .ts (0.9 KB) | Automated test suite verifying run-phase17-only | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0524` | `src/tests/run-phase18-only.ts` | .ts (0.9 KB) | Automated test suite verifying run-phase18-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0525` | `src/tests/run-phase19-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase19-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0526` | `src/tests/run-phase20-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase20-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0527` | `src/tests/run-phase21-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase21-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0528` | `src/tests/run-phase22-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase22-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0529` | `src/tests/run-phase23-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase23-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0530` | `src/tests/run-phase24-only.ts` | .ts (1.1 KB) | Automated test suite verifying run-phase24-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0531` | `src/tests/run-phase25-only.ts` | .ts (36.5 KB) | Automated test suite verifying run-phase25-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0532` | `src/tests/run-phase26-only.ts` | .ts (23.9 KB) | Automated test suite verifying run-phase26-only | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0533` | `src/tests/run-phase27-only.ts` | .ts (19.8 KB) | Automated test suite verifying run-phase27-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0534` | `src/tests/run-phase28-only.ts` | .ts (19.2 KB) | Automated test suite verifying run-phase28-only | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0535` | `src/tests/run-phase29.ts` | .ts (0.7 KB) | Automated test suite verifying run-phase29 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0536` | `src/tests/run-phase30-social-comments.ts` | .ts (19.0 KB) | Automated test suite verifying run-phase30-social-comments | 0 | - | YES | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0537` | `src/tests/run-phase31-comment-intelligence.ts` | .ts (23.7 KB) | Automated test suite verifying run-phase31-comment-intelligence | 0 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0538` | `src/tests/run-phase32-c4-feedback-loop.ts` | .ts (15.9 KB) | Automated test suite verifying run-phase32-c4-feedback-loop | 0 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0539` | `src/tests/run-phase9.ts` | .ts (0.4 KB) | Automated test suite verifying run-phase9 | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0540` | `src/tests/run-task2.ts` | .ts (1.2 KB) | Automated test suite verifying run-task2 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0541` | `src/tests/run-task3d4.ts` | .ts (0.4 KB) | Automated test suite verifying run-task3d4 | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0542` | `src/tests/run-task3d5.ts` | .ts (0.4 KB) | Automated test suite verifying run-task3d5 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0543` | `src/tests/run-task3e1.ts` | .ts (0.4 KB) | Automated test suite verifying run-task3e1 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0544` | `src/tests/run-task3f55.ts` | .ts (0.7 KB) | Automated test suite verifying run-task3f55 | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0545` | `src/tests/semantic-verification.test.ts` | .ts (3.4 KB) | Automated test suite verifying semantic-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0546` | `src/tests/sequence-self-healing-resilience.test.ts` | .ts (24.5 KB) | Automated test suite verifying sequence-self-healing-resilience | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0547` | `src/tests/stage01-draft-workflow-separation.test.ts` | .ts (6.6 KB) | Automated test suite verifying stage01-draft-workflow-separation | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0548` | `src/tests/stage02-targeted-bugfixes.test.ts` | .ts (8.9 KB) | Automated test suite verifying stage02-targeted-bugfixes | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0549` | `src/tests/stage02-video-transitions.test.ts` | .ts (10.1 KB) | Automated test suite verifying stage02-video-transitions | 0 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0550` | `src/tests/stage8-continuous-verification.ts` | .ts (40.0 KB) | Automated test suite verifying stage8-continuous-verification | 1 | - | - | YES | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0551` | `src/tests/step01-question-studio-workflow-state.test.ts` | .ts (8.7 KB) | Automated test suite verifying step01-question-studio-workflow-state | 0 | - | - | - | 01 Question Generation (DIRECT) | NO | CURRENT | LOW |
| `FILE-0552` | `src/tests/studio-e2e-integration.ts` | .ts (9.5 KB) | Automated test suite verifying studio-e2e-integration | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0553` | `src/tests/surgical-repair.ts` | .ts (8.0 KB) | Automated test suite verifying surgical-repair | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0554` | `src/tests/task2-content-master-verification.ts` | .ts (14.2 KB) | Automated test suite verifying task2-content-master-verification | 1 | - | YES | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0555` | `src/tests/task2b-taxonomy-verification.ts` | .ts (13.8 KB) | Automated test suite verifying task2b-taxonomy-verification | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0556` | `src/tests/task2c-question-verification.ts` | .ts (23.5 KB) | Automated test suite verifying task2c-question-verification | 0 | - | YES | - | 02 Question Verification (DIRECT) | NO | CURRENT | LOW |
| `FILE-0557` | `src/tests/task2d-gemini-verification.ts` | .ts (18.4 KB) | Automated test suite verifying task2d-gemini-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0558` | `src/tests/task2d1-gemini-fallback-math.ts` | .ts (6.5 KB) | Automated test suite verifying task2d1-gemini-fallback-math | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0559` | `src/tests/task2e1-question-to-video.ts` | .ts (10.1 KB) | Automated test suite verifying task2e1-question-to-video | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0560` | `src/tests/task2e2-video-script-versioning.ts` | .ts (15.0 KB) | Automated test suite verifying task2e2-video-script-versioning | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0561` | `src/tests/task2e3-thumbnail-workflow.ts` | .ts (13.0 KB) | Automated test suite verifying task2e3-thumbnail-workflow | 0 | YES | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0562` | `src/tests/task2e4-pinned-comment-workflow.ts` | .ts (15.1 KB) | Automated test suite verifying task2e4-pinned-comment-workflow | 0 | YES | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0563` | `src/tests/task2e5-cleanup-safety.ts` | .ts (5.9 KB) | Automated test suite verifying task2e5-cleanup-safety | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0564` | `src/tests/task2e5-publishing-workflow.ts` | .ts (17.6 KB) | Automated test suite verifying task2e5-publishing-workflow | 0 | YES | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0565` | `src/tests/task2e6-final-pipeline-verification.ts` | .ts (12.0 KB) | Automated test suite verifying task2e6-final-pipeline-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0566` | `src/tests/task3-taxonomy-engine-verification.ts` | .ts (14.7 KB) | Automated test suite verifying task3-taxonomy-engine-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0567` | `src/tests/task3a-planning-verification.ts` | .ts (15.6 KB) | Automated test suite verifying task3a-planning-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0568` | `src/tests/task3d1-assignment-verification.ts` | .ts (15.7 KB) | Automated test suite verifying task3d1-assignment-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0569` | `src/tests/task3d2-rbac-verification.ts` | .ts (18.3 KB) | Automated test suite verifying task3d2-rbac-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0570` | `src/tests/task3d3-review-workflow-verification.ts` | .ts (30.8 KB) | Automated test suite verifying task3d3-review-workflow-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0571` | `src/tests/task3d4-script-designer-workflow-verification.ts` | .ts (44.6 KB) | Automated test suite verifying task3d4-script-designer-workflow-verification | 1 | - | - | - | 03 Audience Script (DIRECT) | NO | CURRENT | LOW |
| `FILE-0572` | `src/tests/task3d5-workload-dashboard-verification.ts` | .ts (30.8 KB) | Automated test suite verifying task3d5-workload-dashboard-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0573` | `src/tests/task3e1-my-work-operations-verification.ts` | .ts (16.1 KB) | Automated test suite verifying task3e1-my-work-operations-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0574` | `src/tests/task3e2-production-board-api.ts` | .ts (4.1 KB) | Automated test suite verifying task3e2-production-board-api | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0575` | `src/tests/task3e3-readiness-rules-inspection.ts` | .ts (4.2 KB) | Automated test suite verifying task3e3-readiness-rules-inspection | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0576` | `src/tests/task3f4-restore-validator-verification.ts` | .ts (11.4 KB) | Automated test suite verifying task3f4-restore-validator-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0577` | `src/tests/task3f4-snapshot-exporter-verification.ts` | .ts (3.3 KB) | Automated test suite verifying task3f4-snapshot-exporter-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0578` | `src/tests/task3f410a-snapshot-config-verification.ts` | .ts (7.2 KB) | Automated test suite verifying task3f410a-snapshot-config-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0579` | `src/tests/task3f410b-durable-archive-verification.ts` | .ts (11.7 KB) | Automated test suite verifying task3f410b-durable-archive-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0580` | `src/tests/task3f410c-durable-archive-integration-verification.ts` | .ts (11.8 KB) | Automated test suite verifying task3f410c-durable-archive-integration-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0581` | `src/tests/task3f410d-recovery-archive-ui-verification.ts` | .ts (11.6 KB) | Automated test suite verifying task3f410d-recovery-archive-ui-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0582` | `src/tests/task3f410e-gcs-smoke-test.ts` | .ts (16.0 KB) | Automated test suite verifying task3f410e-gcs-smoke-test | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0583` | `src/tests/task3f410f-scheduler-verification.ts` | .ts (15.0 KB) | Automated test suite verifying task3f410f-scheduler-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0584` | `src/tests/task3f47a-granular-question-restore-verification.ts` | .ts (11.8 KB) | Automated test suite verifying task3f47a-granular-question-restore-verification | 0 | - | - | - | 02 Question Verification (DIRECT) | NO | CURRENT | LOW |
| `FILE-0585` | `src/tests/task3f47b-granular-video-restore-verification.ts` | .ts (19.1 KB) | Automated test suite verifying task3f47b-granular-video-restore-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0586` | `src/tests/task3f47c-granular-script-restore-verification.ts` | .ts (20.2 KB) | Automated test suite verifying task3f47c-granular-script-restore-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0587` | `src/tests/task3f47d-granular-thumbnail-restore-verification.ts` | .ts (20.3 KB) | Automated test suite verifying task3f47d-granular-thumbnail-restore-verification | 0 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0588` | `src/tests/task3f47e-granular-pinned-comment-restore-verification.ts` | .ts (19.7 KB) | Automated test suite verifying task3f47e-granular-pinned-comment-restore-verification | 0 | - | - | - | 15 Intelligence Loop (DIRECT) | NO | CURRENT | LOW |
| `FILE-0589` | `src/tests/task3f47f-granular-publishing-restore-verification.ts` | .ts (18.4 KB) | Automated test suite verifying task3f47f-granular-publishing-restore-verification | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0590` | `src/tests/task3f47g-granular-assignment-restore-verification.ts` | .ts (26.0 KB) | Automated test suite verifying task3f47g-granular-assignment-restore-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0591` | `src/tests/task3f48-full-snapshot-preflight-verification.ts` | .ts (9.2 KB) | Automated test suite verifying task3f48-full-snapshot-preflight-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0592` | `src/tests/task3f48-full-snapshot-restore-execution-verification.ts` | .ts (35.7 KB) | Automated test suite verifying task3f48-full-snapshot-restore-execution-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0593` | `src/tests/task3f48-full-snapshot-restore-plan-verification.ts` | .ts (13.9 KB) | Automated test suite verifying task3f48-full-snapshot-restore-plan-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0594` | `src/tests/task3f48-full-snapshot-restore-planner-verification.ts` | .ts (6.6 KB) | Automated test suite verifying task3f48-full-snapshot-restore-planner-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0595` | `src/tests/task3f49-full-restore-api-verification.ts` | .ts (15.0 KB) | Automated test suite verifying task3f49-full-restore-api-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0596` | `src/tests/task3f49-full-restore-ui-verification.ts` | .ts (19.3 KB) | Automated test suite verifying task3f49-full-restore-ui-verification | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0597` | `src/tests/task3f49-granular-restore-api-verification.ts` | .ts (18.8 KB) | Automated test suite verifying task3f49-granular-restore-api-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0598` | `src/tests/task3f49-granular-restore-ui-verification.ts` | .ts (16.4 KB) | Automated test suite verifying task3f49-granular-restore-ui-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0599` | `src/tests/task3f49-recovery-admin-status-ui-verification.ts` | .ts (7.5 KB) | Automated test suite verifying task3f49-recovery-admin-status-ui-verification | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0600` | `src/tests/task3f49-recovery-dry-run-api-verification.ts` | .ts (13.6 KB) | Automated test suite verifying task3f49-recovery-dry-run-api-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0601` | `src/tests/task3f49-recovery-dry-run-ui-verification.ts` | .ts (16.5 KB) | Automated test suite verifying task3f49-recovery-dry-run-ui-verification | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0602` | `src/tests/task3f49-recovery-security-verification.ts` | .ts (18.9 KB) | Automated test suite verifying task3f49-recovery-security-verification | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0603` | `src/tests/task3f49-recovery-snapshot-history-ui-verification.ts` | .ts (10.4 KB) | Automated test suite verifying task3f49-recovery-snapshot-history-ui-verification | 0 | YES | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0604` | `src/tests/task3f49-recovery-status-api-verification.ts` | .ts (9.7 KB) | Automated test suite verifying task3f49-recovery-status-api-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0605` | `src/tests/task3f55-global-search-routing-verification.ts` | .ts (16.5 KB) | Automated test suite verifying task3f55-global-search-routing-verification | 1 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0606` | `src/tests/task4-question-creation-engine-verification.ts` | .ts (24.5 KB) | Automated test suite verifying task4-question-creation-engine-verification | 0 | - | YES | - | 02 Question Verification (DIRECT) | NO | CURRENT | LOW |
| `FILE-0607` | `src/tests/task5-question-validation-engine-verification.ts` | .ts (36.7 KB) | Automated test suite verifying task5-question-validation-engine-verification | 1 | - | - | - | 02 Question Verification (DIRECT) | NO | CURRENT | LOW |
| `FILE-0608` | `src/tests/task5b-security-correctness-verification.ts` | .ts (19.2 KB) | Automated test suite verifying task5b-security-correctness-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0609` | `src/tests/task6-telugu-script-verification.ts` | .ts (12.5 KB) | Automated test suite verifying task6-telugu-script-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0610` | `src/tests/task6b-provider-abstraction-verification.ts` | .ts (9.8 KB) | Automated test suite verifying task6b-provider-abstraction-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0611` | `src/tests/task6c-orchestrator-verification.ts` | .ts (15.2 KB) | Automated test suite verifying task6c-orchestrator-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0612` | `src/tests/task6d-validation-adapter-verification.ts` | .ts (15.5 KB) | Automated test suite verifying task6d-validation-adapter-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0613` | `src/tests/task7-video-queue-verification.ts` | .ts (25.4 KB) | Automated test suite verifying task7-video-queue-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0614` | `src/tests/task7b-unified-studio-verification.ts` | .ts (7.1 KB) | Automated test suite verifying task7b-unified-studio-verification | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0615` | `src/tests/task7c-question-studio-quality-verification.ts` | .ts (10.4 KB) | Automated test suite verifying task7c-question-studio-quality-verification | 1 | YES | - | - | 01 Question Generation (DIRECT) | NO | CURRENT | LOW |
| `FILE-0616` | `src/tests/task8-publishing-verification.ts` | .ts (25.6 KB) | Automated test suite verifying task8-publishing-verification | 0 | - | - | - | 11 Published (DIRECT) | NO | CURRENT | LOW |
| `FILE-0617` | `src/tests/task8b-social-content-foundation-verification.ts` | .ts (14.1 KB) | Automated test suite verifying task8b-social-content-foundation-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0618` | `src/tests/task8c-hook-presentation-engine-verification.ts` | .ts (21.0 KB) | Automated test suite verifying task8c-hook-presentation-engine-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0619` | `src/tests/task8d-teleprompter-spoken-enhancer-verification.ts` | .ts (20.4 KB) | Automated test suite verifying task8d-teleprompter-spoken-enhancer-verification | 1 | - | - | - | 04 Teleprompter & Filming (DIRECT) | NO | CURRENT | LOW |
| `FILE-0620` | `src/tests/task8e-social-metadata-generator-verification.ts` | .ts (24.5 KB) | Automated test suite verifying task8e-social-metadata-generator-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0621` | `src/tests/task8f-multi-platform-adaptation-verification.ts` | .ts (32.9 KB) | Automated test suite verifying task8f-multi-platform-adaptation-verification | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0622` | `src/tests/task8g-social-quality-engagement-verification.ts` | .ts (44.9 KB) | Automated test suite verifying task8g-social-quality-engagement-verification | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0623` | `src/tests/task8h-social-review-workflow-verification.ts` | .ts (31.3 KB) | Automated test suite verifying task8h-social-review-workflow-verification | 1 | - | - | - | 09 Social Review (DIRECT) | NO | CURRENT | LOW |
| `FILE-0624` | `src/tests/task9-auth-verification.ts` | .ts (22.0 KB) | Automated test suite verifying task9-auth-verification | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0625` | `src/tests/test-isolation-safety-gate.test.ts` | .ts (14.4 KB) | Automated test suite verifying test-isolation-safety-gate | 0 | - | YES | - | NONE | NO | CURRENT | LOW |
| `FILE-0626` | `src/tests/thumbnail-real-upload-workflow.test.ts` | .ts (21.4 KB) | Automated test suite verifying thumbnail-real-upload-workflow | 0 | - | - | - | 08 Thumbnail (DIRECT) | NO | CURRENT | LOW |
| `FILE-0627` | `src/tests/unified-question-creation.test.ts` | .ts (12.4 KB) | Automated test suite verifying unified-question-creation | 0 | YES | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0628` | `src/tests/verify-cleanup.ts` | .ts (2.6 KB) | Automated test suite verifying verify-cleanup | 0 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0629` | `src/tests/verify-social-analytics-ui.ts` | .ts (11.9 KB) | Automated test suite verifying verify-social-analytics-ui | 0 | - | - | - | 13 Analytics (DIRECT) | NO | CURRENT | LOW |
| `FILE-0630` | `src/types/index.ts` | .ts (86.7 KB) | TypeScript interfaces, workflow enums, and system types | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0631` | `src/types/phase24-ai.ts` | .ts (3.2 KB) | TypeScript interfaces, workflow enums, and system types | 21 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0632` | `src/types/phase25-consensus.ts` | .ts (2.9 KB) | TypeScript interfaces, workflow enums, and system types | 1 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0633` | `src/types/phase26-copilot.ts` | .ts (7.6 KB) | TypeScript interfaces, workflow enums, and system types | 1 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0634` | `src/utils/formatters.ts` | .ts (3.9 KB) | Application utility or helper module | 4 | - | - | - | Cross-Stage Workflow Coordinator (INDIRECT) | NO | CURRENT | LOW |
| `FILE-0635` | `tsconfig.json` | .json (0.5 KB) | TypeScript compiler and bundler resolution configuration | 0 | - | - | - | NONE | NO | CURRENT | LOW |
| `FILE-0636` | `vite.config.ts` | .ts (0.7 KB) | Vite SPA dev server and Tailwind v4 CSS bundler config | 5 | - | - | - | NONE | NO | CURRENT | LOW |
