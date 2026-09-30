# Complete File Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 01 — Repository & Environment Baseline
**Audit Date:** 2026-09-28
**Audit Mode:** Read-Only Forensic Inventory
**Total Files Audited:** 636 (100% exhaustive catalog excluding node_modules)

## Category Summary Table

| File Category | Count | Percentage | Description |
| :--- | :--- | :--- | :--- |
| **SOURCE** | 310 | 48.7% | Core application logic (Frontend React, Backend Express, Services, Repositories, AI) |
| **TEST** | 252 | 39.6% | Regression, integration, unit, and phase verification test files & runners |
| **DOCUMENTATION** | 22 | 3.5% | Root-level architectural, product truth, and verification markdown documents |
| **SCRIPT** | 21 | 3.3% | Maintenance, data validation, seeding, and diagnostic scripts |
| **SCHEMA** | 13 | 2.0% | Google Sheets worksheet schema and Zod AI output response schemas |
| **CONFIGURATION** | 4 | 0.6% | Compiler, bundler, git, and applet configuration files |
| **TYPE_DEFINITION** | 4 | 0.6% | Global TypeScript entity interfaces, workflow enums, and system types |
| **DEPLOYMENT** | 2 | 0.3% | Multi-stage Docker containerization definition and ignore patterns |
| **GENERATED** | 2 | 0.3% | Pre-computed static repository dependency analysis JSON artifacts |
| **ASSET** | 2 | 0.3% | HTML template and global Tailwind CSS stylesheets |
| **ENVIRONMENT_REFERENCE** | 1 | 0.2% | Template environment variable specification without secrets |
| **LOCKFILE** | 1 | 0.2% | Bun frozen dependency lockfile |
| **PACKAGE_MANIFEST** | 1 | 0.2% | npm/bun package manifest specifying dependencies and execution scripts |
| **MIGRATION** | 1 | 0.2% | Database schema and user account reconciliation scripts |

---

## Directory File Listings

### Directory: `.` (38 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.dockerignore` | DEPLOYMENT | INFRASTRUCTURE | 42 | YES | NO |
| `.env.example` | ENVIRONMENT_REFERENCE | CONFIGURATION | 699 | YES | NO |
| `.gitignore` | CONFIGURATION | CONFIGURATION | 82 | YES | NO |
| `01-product-truth.md` | DOCUMENTATION | DOCUMENTATION | 74,046 | REFERENCE | HISTORICAL_RECORD |
| `02-repository-inventory.md` | DOCUMENTATION | DOCUMENTATION | 47,434 | REFERENCE | HISTORICAL_RECORD |
| `03-routing-navigation-audit.md` | DOCUMENTATION | DOCUMENTATION | 66,649 | REFERENCE | HISTORICAL_RECORD |
| `04-page-workflow-map.md` | DOCUMENTATION | DOCUMENTATION | 75,934 | REFERENCE | HISTORICAL_RECORD |
| `05-backend-data-map.md` | DOCUMENTATION | DOCUMENTATION | 100,220 | REFERENCE | HISTORICAL_RECORD |
| `06-canonical-architecture.md` | DOCUMENTATION | DOCUMENTATION | 67,591 | REFERENCE | HISTORICAL_RECORD |
| `07-page-ownership-implementation.md` | DOCUMENTATION | DOCUMENTATION | 6,797 | REFERENCE | HISTORICAL_RECORD |
| `08-production-workflow-verification.md` | DOCUMENTATION | DOCUMENTATION | 10,489 | REFERENCE | HISTORICAL_RECORD |
| `08-workflow-convergence-implementation.md` | DOCUMENTATION | DOCUMENTATION | 13,729 | REFERENCE | HISTORICAL_RECORD |
| `08A-workflow-convergence-remediation.md` | DOCUMENTATION | DOCUMENTATION | 6,080 | REFERENCE | HISTORICAL_RECORD |
| `09-api-convergence-implementation.md` | DOCUMENTATION | DOCUMENTATION | 9,471 | REFERENCE | HISTORICAL_RECORD |
| `09-production-hardening.md` | DOCUMENTATION | DOCUMENTATION | 25,149 | REFERENCE | HISTORICAL_RECORD |
| `10-production-readiness.md` | DOCUMENTATION | DOCUMENTATION | 15,614 | REFERENCE | HISTORICAL_RECORD |
| `10-service-convergence-implementation.md` | DOCUMENTATION | DOCUMENTATION | 11,969 | REFERENCE | HISTORICAL_RECORD |
| `11-legacy-removal-implementation.md` | DOCUMENTATION | DOCUMENTATION | 8,192 | REFERENCE | HISTORICAL_RECORD |
| `11-repository-convergence-implementation.md` | DOCUMENTATION | DOCUMENTATION | 9,103 | REFERENCE | HISTORICAL_RECORD |
| `12-data-ownership-implementation.md` | DOCUMENTATION | DOCUMENTATION | 14,200 | REFERENCE | HISTORICAL_RECORD |
| `12-final-verification-report.md` | DOCUMENTATION | DOCUMENTATION | 10,026 | REFERENCE | HISTORICAL_RECORD |
| `13-github-local-reconciliation-report.md` | DOCUMENTATION | DOCUMENTATION | 11,160 | REFERENCE | HISTORICAL_RECORD |
| `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` | DOCUMENTATION | DOCUMENTATION | 12,069 | REFERENCE | NO |
| `bun.lock` | LOCKFILE | CONFIGURATION | 86,858 | YES | NO |
| `Dockerfile` | DEPLOYMENT | INFRASTRUCTURE | 697 | YES | NO |
| `FINAL-TEST-DATA-DELETION-MANIFEST.md` | DOCUMENTATION | DOCUMENTATION | 8,191 | REFERENCE | NO |
| `full-repo-inventory.json` | GENERATED | DOCUMENTATION | 67,339 | NO | STATIC_ANALYSIS_SNAPSHOT |
| `index.html` | ASSET | FRONTEND | 1,111 | YES | NO |
| `metadata.json` | CONFIGURATION | CONFIGURATION | 261 | YES | NO |
| `package.json` | PACKAGE_MANIFEST | CONFIGURATION | 3,440 | YES | NO |
| `README.md` | DOCUMENTATION | DOCUMENTATION | 7,546 | YES | NO |
| `repo-inventory.json` | GENERATED | DOCUMENTATION | 46,224 | NO | STATIC_ANALYSIS_SNAPSHOT |
| `run-phase10-runner.ts` | TEST | TEST | 370 | VERIFICATION | PHASE_SUITE |
| `run-phase9-runner.ts` | TEST | TEST | 336 | VERIFICATION | PHASE_SUITE |
| `run-stage8-runner.ts` | TEST | TEST | 445 | VERIFICATION | PHASE_SUITE |
| `server.ts` | SOURCE | BACKEND | 2,291 | YES | NO |
| `tsconfig.json` | CONFIGURATION | CONFIGURATION | 508 | YES | NO |
| `vite.config.ts` | CONFIGURATION | CONFIGURATION | 708 | YES | NO |

### Directory: `scripts` (22 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `audit-and-clean-bp-cnt-000001.ts` | SCRIPT | UTILITY | 22,089 | OPERATIONAL | NO |
| `clean-audit-log.ts` | SCRIPT | UTILITY | 2,764 | OPERATIONAL | NO |
| `cleanup-and-migrate-users.ts` | MIGRATION | UTILITY | 7,689 | OPERATIONAL | NO |
| `comprehensive-audit.ts` | SCRIPT | UTILITY | 5,896 | OPERATIONAL | NO |
| `execute-phase-2b.ts` | SCRIPT | UTILITY | 15,088 | OPERATIONAL | PHASE_SPECIFIC |
| `execute-phase-2c.ts` | SCRIPT | UTILITY | 20,644 | OPERATIONAL | PHASE_SPECIFIC |
| `execute-phase-2d.ts` | SCRIPT | UTILITY | 9,009 | OPERATIONAL | PHASE_SPECIFIC |
| `execute-production-baseline-reset.ts` | SCRIPT | UTILITY | 16,676 | OPERATIONAL | PHASE_SPECIFIC |
| `final-baseline-read-only-audit.ts` | SCRIPT | UTILITY | 9,387 | OPERATIONAL | NO |
| `google-oauth-setup.ts` | SCRIPT | UTILITY | 4,405 | OPERATIONAL | NO |
| `live-audit-and-reset.ts` | SCRIPT | UTILITY | 3,810 | OPERATIONAL | PHASE_SPECIFIC |
| `phase-b-launch-reset.ts` | SCRIPT | UTILITY | 25,459 | OPERATIONAL | PHASE_SPECIFIC |
| `purge-test-data-for-production.ts` | SCRIPT | UTILITY | 16,035 | OPERATIONAL | NO |
| `restore-sequences-phase-e.ts` | SCRIPT | UTILITY | 19,685 | OPERATIONAL | PHASE_SPECIFIC |
| `seed-100-questions-e2e-workflow.ts` | SCRIPT | UTILITY | 32,965 | OPERATIONAL | NO |
| `taxonomy-cross-audit.ts` | SCRIPT | UTILITY | 5,420 | OPERATIONAL | NO |
| `test-task-3b2-ui-e2e.ts` | SCRIPT | UTILITY | 23,347 | OPERATIONAL | PHASE_SPECIFIC |
| `verify-canonical-content-id.ts` | SCRIPT | UTILITY | 7,083 | OPERATIONAL | NO |
| `verify-drive-state.ts` | SCRIPT | UTILITY | 3,737 | OPERATIONAL | NO |
| `verify-gcs-state.ts` | SCRIPT | UTILITY | 1,295 | OPERATIONAL | NO |
| `verify-task5.ts` | SCRIPT | UTILITY | 13,747 | OPERATIONAL | NO |
| `verify-worksheet-preservation.ts` | SCRIPT | UTILITY | 3,287 | OPERATIONAL | NO |

### Directory: `src` (3 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `App.tsx` | SOURCE | FRONTEND | 11,113 | YES | NO |
| `index.css` | ASSET | FRONTEND | 261 | YES | NO |
| `main.tsx` | SOURCE | FRONTEND | 231 | YES | NO |

### Directory: `src/components/assignments` (3 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AssignmentBadge.tsx` | SOURCE | COMPONENT | 3,859 | YES | NO |
| `AssignmentModal.tsx` | SOURCE | COMPONENT | 21,093 | YES | NO |
| `EntityAssignmentsSection.tsx` | SOURCE | COMPONENT | 8,705 | YES | NO |

### Directory: `src/components/common` (9 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Button.tsx` | SOURCE | COMPONENT | 308 | YES | NO |
| `DifficultyBadge.tsx` | SOURCE | COMPONENT | 967 | YES | NO |
| `EmptyState.tsx` | SOURCE | COMPONENT | 352 | YES | NO |
| `LoadingState.tsx` | SOURCE | COMPONENT | 601 | YES | NO |
| `Modal.tsx` | SOURCE | COMPONENT | 336 | YES | NO |
| `SearchInput.tsx` | SOURCE | COMPONENT | 851 | YES | NO |
| `StatCard.tsx` | SOURCE | COMPONENT | 2,177 | YES | NO |
| `StatusBadge.tsx` | SOURCE | COMPONENT | 2,498 | YES | NO |
| `TechnicalDetails.tsx` | SOURCE | COMPONENT | 3,461 | YES | NO |

### Directory: `src/components/dashboard` (14 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ChannelPerformanceSection.tsx` | SOURCE | COMPONENT | 8,051 | YES | NO |
| `ContinueProductionCard.tsx` | SOURCE | COMPONENT | 7,806 | YES | NO |
| `ConveyorBeltVisualizer.tsx` | SOURCE | COMPONENT | 7,204 | YES | NO |
| `DailyWorkflowGuide.tsx` | SOURCE | COMPONENT | 4,017 | YES | NO |
| `DashboardFilterBar.tsx` | SOURCE | COMPONENT | 4,500 | YES | NO |
| `ExecutiveHeroBanner.tsx` | SOURCE | COMPONENT | 7,430 | YES | NO |
| `ExecutiveVitalsBento.tsx` | SOURCE | COMPONENT | 7,042 | YES | NO |
| `GlobalSearchBar.tsx` | SOURCE | COMPONENT | 6,357 | YES | NO |
| `OperationalDispatch.tsx` | SOURCE | COMPONENT | 20,527 | YES | NO |
| `PipelineVisualizer.tsx` | SOURCE | COMPONENT | 12,483 | YES | NO |
| `RecentAuditFeed.tsx` | SOURCE | COMPONENT | 5,167 | YES | NO |
| `StaleContentSection.tsx` | SOURCE | COMPONENT | 6,659 | YES | NO |
| `TodaysWorkSection.tsx` | SOURCE | COMPONENT | 8,477 | YES | NO |
| `WhatsWaitingSection.tsx` | SOURCE | COMPONENT | 8,654 | YES | NO |

### Directory: `src/components/layout` (8 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ErrorBoundary.tsx` | SOURCE | COMPONENT | 4,039 | YES | NO |
| `Header.tsx` | SOURCE | COMPONENT | 3,818 | YES | NO |
| `Layout.tsx` | SOURCE | COMPONENT | 3,713 | YES | NO |
| `NotificationsMenu.tsx` | SOURCE | COMPONENT | 8,154 | YES | NO |
| `PageHeader.tsx` | SOURCE | COMPONENT | 400 | YES | NO |
| `Sidebar.tsx` | SOURCE | COMPONENT | 14,200 | YES | NO |
| `SystemHealthIndicator.tsx` | SOURCE | COMPONENT | 6,270 | YES | NO |
| `UserProfileMenu.tsx` | SOURCE | COMPONENT | 6,580 | YES | NO |

### Directory: `src/components/production` (4 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PipelineProgress.tsx` | SOURCE | COMPONENT | 2,693 | YES | NO |
| `ProductionJourneyBar.tsx` | SOURCE | COMPONENT | 11,496 | YES | NO |
| `ProductionKanban.tsx` | SOURCE | COMPONENT | 10,696 | YES | NO |
| `ProductionTable.tsx` | SOURCE | COMPONENT | 7,445 | YES | NO |

### Directory: `src/components/publishing` (8 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FinalizePublishingModal.tsx` | SOURCE | COMPONENT | 6,452 | YES | NO |
| `PackageCopierModal.tsx` | SOURCE | COMPONENT | 16,738 | YES | NO |
| `PublishingAssignmentModal.tsx` | SOURCE | COMPONENT | 10,966 | YES | NO |
| `PublishingTable.tsx` | SOURCE | COMPONENT | 24,042 | YES | NO |
| `PublishingWorkflowHeader.tsx` | SOURCE | COMPONENT | 7,226 | YES | NO |
| `PublishScheduleModal.tsx` | SOURCE | COMPONENT | 9,756 | YES | NO |
| `RecordPublicationModal.tsx` | SOURCE | COMPONENT | 9,703 | YES | NO |
| `RetryPlatformModal.tsx` | SOURCE | COMPONENT | 8,305 | YES | NO |

### Directory: `src/components/questions` (2 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `QuestionTable.tsx` | SOURCE | COMPONENT | 10,663 | YES | NO |
| `QuestionWorkflowHeader.tsx` | SOURCE | COMPONENT | 5,076 | YES | NO |

### Directory: `src/components/queue` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `QueueTable.tsx` | SOURCE | COMPONENT | 8,554 | YES | NO |

### Directory: `src/components/social` (2 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AssetWorkflowHeader.tsx` | SOURCE | COMPONENT | 7,161 | YES | NO |
| `SocialReviewWorkspace.tsx` | SOURCE | COMPONENT | 53,900 | YES | NO |

### Directory: `src/components/video` (8 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EditingWorkspace.tsx` | SOURCE | COMPONENT | 29,628 | YES | NO |
| `FinalReviewWorkspace.tsx` | SOURCE | COMPONENT | 19,868 | YES | NO |
| `PinnedCommentWorkspace.tsx` | SOURCE | COMPONENT | 12,063 | YES | NO |
| `PublishingWorkspace.tsx` | SOURCE | COMPONENT | 48,129 | YES | NO |
| `RecordingWorkspace.tsx` | SOURCE | COMPONENT | 50,041 | YES | NO |
| `ScriptWorkspace.tsx` | SOURCE | COMPONENT | 52,689 | YES | NO |
| `ThumbnailWorkspace.tsx` | SOURCE | COMPONENT | 41,638 | YES | NO |
| `VideoWorkflowHeader.tsx` | SOURCE | COMPONENT | 6,089 | YES | NO |

### Directory: `src/config` (6 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `constants.ts` | SOURCE | CONFIGURATION | 11,370 | YES | NO |
| `media-upload.config.ts` | SOURCE | CONFIGURATION | 3,096 | YES | NO |
| `navigation.ts` | SOURCE | CONFIGURATION | 5,891 | YES | NO |
| `question-creation.config.ts` | SOURCE | CONFIGURATION | 8,544 | YES | NO |
| `roles.ts` | SOURCE | CONFIGURATION | 10,644 | YES | NO |
| `snapshot.config.ts` | SOURCE | CONFIGURATION | 5,346 | YES | NO |

### Directory: `src/contexts` (2 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AuthContext.tsx` | SOURCE | CONTEXT | 2,069 | YES | NO |
| `ProductionJourneyContext.tsx` | SOURCE | CONTEXT | 35,083 | YES | NO |

### Directory: `src/design-system` (3 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.ts` | SOURCE | COMPONENT | 925 | YES | NO |
| `tokens.ts` | SOURCE | COMPONENT | 8,124 | YES | NO |
| `types.ts` | SOURCE | COMPONENT | 843 | YES | NO |

### Directory: `src/design-system/components` (18 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Alert.tsx` | SOURCE | COMPONENT | 2,507 | YES | NO |
| `AppBreadcrumbs.tsx` | SOURCE | COMPONENT | 9,612 | YES | NO |
| `Badge.tsx` | SOURCE | COMPONENT | 3,277 | YES | NO |
| `Button.tsx` | SOURCE | COMPONENT | 4,314 | YES | NO |
| `Card.tsx` | SOURCE | COMPONENT | 3,351 | YES | NO |
| `EmptyState.tsx` | SOURCE | COMPONENT | 1,847 | YES | NO |
| `ErrorState.tsx` | SOURCE | COMPONENT | 2,705 | YES | NO |
| `Form.tsx` | SOURCE | COMPONENT | 2,101 | YES | NO |
| `Icon.tsx` | SOURCE | COMPONENT | 750 | YES | NO |
| `Input.tsx` | SOURCE | COMPONENT | 4,753 | YES | NO |
| `Loading.tsx` | SOURCE | COMPONENT | 3,834 | YES | NO |
| `Modal.tsx` | SOURCE | COMPONENT | 4,974 | YES | NO |
| `PageHeader.tsx` | SOURCE | COMPONENT | 2,732 | YES | NO |
| `Select.tsx` | SOURCE | COMPONENT | 2,493 | YES | NO |
| `StepIndicator.tsx` | SOURCE | COMPONENT | 5,449 | YES | NO |
| `SuccessState.tsx` | SOURCE | COMPONENT | 1,924 | YES | NO |
| `Table.tsx` | SOURCE | COMPONENT | 6,006 | YES | NO |
| `WorkflowStepNav.tsx` | SOURCE | COMPONENT | 5,782 | YES | NO |

### Directory: `src/lib` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `api-client.ts` | SOURCE | OTHER | 59,462 | YES | NO |

### Directory: `src/lib/ai` (10 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `config.ts` | SOURCE | AI | 1,368 | YES | NO |
| `error.ts` | SOURCE | AI | 4,380 | YES | NO |
| `gemini.client.ts` | SOURCE | AI | 1,682 | YES | NO |
| `gemini.service.ts` | SOURCE | AI | 97,051 | YES | NO |
| `index.ts` | SOURCE | AI | 838 | YES | NO |
| `orchestrator.ts` | SOURCE | AI | 6,779 | YES | NO |
| `phase24-orchestrator.service.ts` | SOURCE | AI | 16,409 | YES | NO |
| `phase24-registry.ts` | SOURCE | AI | 3,809 | YES | NO |
| `registry.ts` | SOURCE | AI | 2,625 | YES | NO |
| `types.ts` | SOURCE | AI | 3,692 | YES | NO |

### Directory: `src/lib/ai/prompts` (13 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `comment-intelligence.prompt.ts` | SOURCE | AI | 4,151 | YES | NO |
| `generation.prompt.ts` | SOURCE | AI | 11,351 | YES | NO |
| `performance-intelligence.prompt.ts` | SOURCE | AI | 4,997 | YES | NO |
| `pinned-comment.prompt.ts` | SOURCE | AI | 3,636 | YES | NO |
| `platform-adaptation.prompt.ts` | SOURCE | AI | 3,196 | YES | NO |
| `refinement.prompt.ts` | SOURCE | AI | 5,501 | YES | NO |
| `script-generation.prompt.ts` | SOURCE | AI | 4,429 | YES | NO |
| `social-hook.prompt.ts` | SOURCE | AI | 5,468 | YES | NO |
| `social-metadata.prompt.ts` | SOURCE | AI | 4,789 | YES | NO |
| `social-quality.prompt.ts` | SOURCE | AI | 5,560 | YES | NO |
| `teleprompter-script.prompt.ts` | SOURCE | AI | 6,608 | YES | NO |
| `thumbnail-intelligence.prompt.ts` | SOURCE | AI | 3,001 | YES | NO |
| `validation.prompt.ts` | SOURCE | AI | 2,713 | YES | NO |

### Directory: `src/lib/ai/providers` (10 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `base.adapter.ts` | SOURCE | AI | 11,436 | YES | NO |
| `cerebras.adapter.ts` | SOURCE | AI | 2,125 | YES | NO |
| `cohere.adapter.ts` | SOURCE | AI | 2,118 | YES | NO |
| `experimental-labs.adapter.ts` | SOURCE | AI | 2,497 | YES | NO |
| `gemini.adapter.ts` | SOURCE | AI | 2,307 | YES | NO |
| `groq.adapter.ts` | SOURCE | AI | 2,158 | YES | NO |
| `huggingface.adapter.ts` | SOURCE | AI | 2,451 | YES | NO |
| `mistral.adapter.ts` | SOURCE | AI | 2,182 | YES | NO |
| `openrouter.adapter.ts` | SOURCE | AI | 2,342 | YES | NO |
| `xai.client.ts` | SOURCE | AI | 1,384 | YES | NO |

### Directory: `src/lib/ai/schemas` (12 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `comment-intelligence.schema.ts` | SCHEMA | SCHEMA | 8,236 | YES | NO |
| `performance-intelligence.schema.ts` | SCHEMA | SCHEMA | 6,443 | YES | NO |
| `pinned-comment.schema.ts` | SCHEMA | SCHEMA | 1,967 | YES | NO |
| `platform-adaptation.schema.ts` | SCHEMA | SCHEMA | 3,822 | YES | NO |
| `question-candidate.schema.ts` | SCHEMA | SCHEMA | 4,105 | YES | NO |
| `script-generation.schema.ts` | SCHEMA | SCHEMA | 3,013 | YES | NO |
| `social-hook.schema.ts` | SCHEMA | SCHEMA | 4,670 | YES | NO |
| `social-metadata.schema.ts` | SCHEMA | SCHEMA | 3,124 | YES | NO |
| `social-quality.schema.ts` | SCHEMA | SCHEMA | 5,175 | YES | NO |
| `teleprompter-script.schema.ts` | SCHEMA | SCHEMA | 3,518 | YES | NO |
| `thumbnail-intelligence.schema.ts` | SCHEMA | SCHEMA | 4,731 | YES | NO |
| `validation.schema.ts` | SCHEMA | SCHEMA | 1,467 | YES | NO |

### Directory: `src/lib/ai/testing` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mock-provider.ts` | SOURCE | AI | 5,100 | YES | NO |

### Directory: `src/lib/ai/validators` (5 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `blind-verifier.ts` | SOURCE | AI | 27,129 | YES | NO |
| `candidate.validator.ts` | SOURCE | AI | 14,651 | YES | NO |
| `mathematical.validator.ts` | SOURCE | AI | 37,540 | YES | NO |
| `script.validator.ts` | SOURCE | AI | 4,321 | YES | NO |
| `semantic-reasoning.provider.ts` | SOURCE | AI | 5,896 | YES | NO |

### Directory: `src/lib/ai/verifier` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `arbitration.ts` | SOURCE | AI | 2,094 | YES | NO |

### Directory: `src/lib/google-sheets` (3 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `client.ts` | SOURCE | DATABASE | 38,064 | YES | NO |
| `errors.ts` | SOURCE | DATABASE | 9,719 | YES | NO |
| `helpers.ts` | SOURCE | DATABASE | 14,449 | YES | NO |

### Directory: `src/lib/mock-data` (7 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dashboard.ts` | SOURCE | MODEL | 4,361 | YES | NO |
| `index.ts` | SOURCE | MODEL | 1,007 | YES | NO |
| `production.ts` | SOURCE | MODEL | 4,613 | YES | NO |
| `publishing.ts` | SOURCE | MODEL | 3,423 | YES | NO |
| `questions.ts` | SOURCE | MODEL | 12,310 | YES | NO |
| `queue.ts` | SOURCE | MODEL | 3,271 | YES | NO |
| `taxonomy.ts` | SOURCE | MODEL | 4,437 | YES | NO |

### Directory: `src/lib/ownership` (2 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `data-ownership.ts` | SOURCE | RBAC | 8,632 | YES | NO |
| `index.ts` | SOURCE | RBAC | 172 | YES | NO |

### Directory: `src/lib/repositories` (39 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `analytics.repository.ts` | SOURCE | REPOSITORY | 5,225 | YES | NO |
| `assignments.repository.ts` | SOURCE | REPOSITORY | 4,008 | YES | NO |
| `audit-log.repository.ts` | SOURCE | REPOSITORY | 13,048 | YES | NO |
| `base.repository.ts` | SOURCE | REPOSITORY | 22,059 | YES | NO |
| `categories.repository.ts` | SOURCE | REPOSITORY | 1,130 | YES | NO |
| `comment-intelligence.repository.ts` | SOURCE | REPOSITORY | 2,787 | YES | NO |
| `content-batches.repository.ts` | SOURCE | REPOSITORY | 1,801 | YES | NO |
| `content-masters.repository.ts` | SOURCE | REPOSITORY | 1,940 | YES | NO |
| `content-plans.repository.ts` | SOURCE | REPOSITORY | 1,911 | YES | NO |
| `index.ts` | SOURCE | REPOSITORY | 1,717 | YES | NO |
| `intelligence.repository.ts` | SOURCE | REPOSITORY | 2,223 | YES | NO |
| `media-assets.repository.ts` | SOURCE | REPOSITORY | 2,932 | YES | NO |
| `phase20-social-reviews.repository.ts` | SOURCE | REPOSITORY | 1,984 | YES | NO |
| `phase22-publishing.repository.ts` | SOURCE | REPOSITORY | 2,247 | YES | NO |
| `pinned-comment-packages.repository.ts` | SOURCE | REPOSITORY | 3,069 | YES | NO |
| `pinned-comment-versions.repository.ts` | SOURCE | REPOSITORY | 250 | YES | NO |
| `pinned-comments.repository.ts` | SOURCE | REPOSITORY | 1,913 | YES | NO |
| `platform-adaptations.repository.ts` | SOURCE | REPOSITORY | 8,588 | YES | NO |
| `publishing.repository.ts` | SOURCE | REPOSITORY | 4,842 | YES | NO |
| `question-config.repository.ts` | SOURCE | REPOSITORY | 3,559 | YES | NO |
| `question-drafts.repository.ts` | SOURCE | REPOSITORY | 1,921 | YES | NO |
| `question-videos.repository.ts` | SOURCE | REPOSITORY | 211 | YES | NO |
| `questions.repository.ts` | SOURCE | REPOSITORY | 4,157 | YES | NO |
| `refinement-candidates.repository.ts` | SOURCE | REPOSITORY | 2,467 | YES | NO |
| `script-versions.repository.ts` | SOURCE | REPOSITORY | 220 | YES | NO |
| `scripts.repository.ts` | SOURCE | REPOSITORY | 2,125 | YES | NO |
| `sequences.repository.ts` | SOURCE | REPOSITORY | 10,264 | YES | NO |
| `social-comments.repository.ts` | SOURCE | REPOSITORY | 6,022 | YES | NO |
| `social-reviews.repository.ts` | SOURCE | REPOSITORY | 5,680 | YES | NO |
| `strategy-recommendation.repository.ts` | SOURCE | REPOSITORY | 1,949 | YES | NO |
| `subtopics.repository.ts` | SOURCE | REPOSITORY | 1,955 | YES | NO |
| `thumbnail-candidates.repository.ts` | SOURCE | REPOSITORY | 2,977 | YES | NO |
| `thumbnail-versions.repository.ts` | SOURCE | REPOSITORY | 232 | YES | NO |
| `thumbnails.repository.ts` | SOURCE | REPOSITORY | 2,173 | YES | NO |
| `topics.repository.ts` | SOURCE | REPOSITORY | 1,554 | YES | NO |
| `users.repository.ts` | SOURCE | REPOSITORY | 217 | YES | NO |
| `validations.repository.ts` | SOURCE | REPOSITORY | 6,322 | YES | NO |
| `videos.repository.ts` | SOURCE | REPOSITORY | 2,979 | YES | NO |
| `workflow.repository.ts` | SOURCE | REPOSITORY | 985 | YES | NO |

### Directory: `src/lib/schemas` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `google-sheets-schema.ts` | SCHEMA | SCHEMA | 86,073 | YES | NO |

### Directory: `src/lib/services` (71 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `analytics.service.ts` | SOURCE | SERVICE | 9,728 | YES | NO |
| `assignment.service.ts` | SOURCE | SERVICE | 51,413 | YES | NO |
| `audit.service.ts` | SOURCE | SERVICE | 5,114 | YES | NO |
| `auth.service.ts` | SOURCE | SERVICE | 12,587 | YES | NO |
| `comment-intelligence.service.ts` | SOURCE | SERVICE | 19,417 | YES | NO |
| `content-master.service.ts` | SOURCE | SERVICE | 37,480 | YES | NO |
| `content-strategy.service.ts` | SOURCE | SERVICE | 20,276 | YES | NO |
| `dashboard.service.ts` | SOURCE | SERVICE | 61,044 | YES | NO |
| `data-integrity.service.ts` | SOURCE | SERVICE | 68,297 | YES | NO |
| `deletion-safety.service.ts` | SOURCE | SERVICE | 9,558 | YES | NO |
| `durable-snapshot-archive.service.ts` | SOURCE | SERVICE | 16,230 | YES | NO |
| `full-snapshot-preflight.service.ts` | SOURCE | SERVICE | 8,872 | YES | NO |
| `full-snapshot-restore-execution.service.ts` | SOURCE | SERVICE | 22,402 | YES | NO |
| `full-snapshot-restore-plan.service.ts` | SOURCE | SERVICE | 17,619 | YES | NO |
| `full-snapshot-restore.service.ts` | SOURCE | SERVICE | 16,094 | YES | NO |
| `google-drive.service.ts` | SOURCE | SERVICE | 24,634 | YES | NO |
| `granular-assignment-restore.service.ts` | SOURCE | SERVICE | 15,920 | YES | NO |
| `granular-pinned-comment-restore.service.ts` | SOURCE | SERVICE | 17,425 | YES | NO |
| `granular-publishing-restore.service.ts` | SOURCE | SERVICE | 14,014 | YES | NO |
| `granular-question-restore.service.ts` | SOURCE | SERVICE | 14,465 | YES | NO |
| `granular-script-restore.service.ts` | SOURCE | SERVICE | 18,741 | YES | NO |
| `granular-thumbnail-restore.service.ts` | SOURCE | SERVICE | 16,876 | YES | NO |
| `granular-video-restore.service.ts` | SOURCE | SERVICE | 16,139 | YES | NO |
| `id.service.ts` | SOURCE | SERVICE | 4,559 | YES | NO |
| `index.ts` | SOURCE | SERVICE | 3,002 | YES | NO |
| `object-auth.service.ts` | SOURCE | SERVICE | 21,188 | YES | NO |
| `operational-health.service.ts` | SOURCE | SERVICE | 6,183 | YES | NO |
| `operational-recovery.service.ts` | SOURCE | SERVICE | 8,315 | YES | NO |
| `phase12-workflow.service.ts` | SOURCE | SERVICE | 18,122 | YES | NO |
| `phase13-refinement.service.ts` | SOURCE | SERVICE | 23,953 | YES | NO |
| `phase14-drive.service.ts` | SOURCE | SERVICE | 9,870 | YES | NO |
| `phase15-script-production.service.ts` | SOURCE | SERVICE | 20,442 | YES | NO |
| `phase17-video-production.service.ts` | SOURCE | SERVICE | 24,409 | YES | NO |
| `phase18-thumbnail-intelligence.service.ts` | SOURCE | SERVICE | 28,280 | YES | NO |
| `phase19-pinned-comment-intelligence.service.ts` | SOURCE | SERVICE | 25,333 | YES | NO |
| `phase20-social-review.service.ts` | SOURCE | SERVICE | 29,934 | YES | NO |
| `phase21-platform-adaptation.service.ts` | SOURCE | SERVICE | 4,505 | YES | NO |
| `phase22-publishing-hub.service.ts` | SOURCE | SERVICE | 3,006 | YES | NO |
| `phase23-production.service.ts` | SOURCE | SERVICE | 35,800 | YES | NO |
| `phase25-consensus.service.ts` | SOURCE | SERVICE | 19,937 | YES | NO |
| `phase26-copilot.service.ts` | SOURCE | SERVICE | 46,555 | YES | NO |
| `pinned-comment.service.ts` | SOURCE | SERVICE | 10,208 | YES | NO |
| `planning.service.ts` | SOURCE | SERVICE | 30,622 | YES | NO |
| `platform-adaptation.service.ts` | SOURCE | SERVICE | 54,423 | YES | NO |
| `production-asset-validation.service.ts` | SOURCE | SERVICE | 6,928 | YES | NO |
| `production-board.service.ts` | SOURCE | SERVICE | 7,619 | YES | NO |
| `production-sheet-initializer.service.ts` | SOURCE | SERVICE | 12,491 | YES | NO |
| `publishing.service.ts` | SOURCE | SERVICE | 81,295 | YES | NO |
| `question-config.service.ts` | SOURCE | SERVICE | 12,945 | YES | NO |
| `question-draft.service.ts` | SOURCE | SERVICE | 6,582 | YES | NO |
| `question-validation.service.ts` | SOURCE | SERVICE | 5,645 | YES | NO |
| `question.service.ts` | SOURCE | SERVICE | 42,636 | YES | NO |
| `restore-validator.service.ts` | SOURCE | SERVICE | 16,625 | YES | NO |
| `script.service.ts` | SOURCE | SERVICE | 15,877 | YES | NO |
| `sequence-safety.service.ts` | SOURCE | SERVICE | 12,349 | YES | NO |
| `similarity.service.ts` | SOURCE | SERVICE | 10,957 | YES | NO |
| `smart-random.service.ts` | SOURCE | SERVICE | 8,300 | YES | NO |
| `snapshot-exporter.service.ts` | SOURCE | SERVICE | 4,404 | YES | NO |
| `snapshot-history.service.ts` | SOURCE | SERVICE | 8,382 | YES | NO |
| `snapshot-scheduler.service.ts` | SOURCE | SERVICE | 12,718 | YES | NO |
| `social-comments.service.ts` | SOURCE | SERVICE | 11,420 | YES | NO |
| `social-enhancement.service.ts` | SOURCE | SERVICE | 26,455 | YES | NO |
| `social-performance-intelligence.service.ts` | SOURCE | SERVICE | 35,995 | YES | NO |
| `social-quality.service.ts` | SOURCE | SERVICE | 19,762 | YES | NO |
| `social-review.service.ts` | SOURCE | SERVICE | 27,162 | YES | NO |
| `spreadsheet-verification.service.ts` | SOURCE | SERVICE | 12,215 | YES | NO |
| `taxonomy.service.ts` | SOURCE | SERVICE | 36,629 | YES | NO |
| `thumbnail.service.ts` | SOURCE | SERVICE | 19,508 | YES | NO |
| `video.service.ts` | SOURCE | SERVICE | 36,578 | YES | NO |
| `workflow-orchestration.service.ts` | SOURCE | SERVICE | 31,066 | YES | NO |
| `workflow.service.ts` | SOURCE | SERVICE | 187 | YES | NO |

### Directory: `src/lib/validation` (12 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ambiguity.detector.ts` | SOURCE | VALIDATION | 3,525 | YES | NO |
| `consensus.engine.ts` | SOURCE | VALIDATION | 4,374 | YES | NO |
| `consistency.validator.ts` | SOURCE | VALIDATION | 4,559 | YES | NO |
| `explanation.validator.ts` | SOURCE | VALIDATION | 4,720 | YES | NO |
| `fairness.validator.ts` | SOURCE | VALIDATION | 4,062 | YES | NO |
| `gemini-validation.provider.ts` | SOURCE | VALIDATION | 4,065 | YES | NO |
| `index.ts` | SOURCE | VALIDATION | 387 | YES | NO |
| `interfaces.ts` | SOURCE | VALIDATION | 421 | YES | NO |
| `mathematical-logical.engine.ts` | SOURCE | VALIDATION | 55,732 | YES | NO |
| `multi-layer-verification.engine.ts` | SOURCE | VALIDATION | 32,661 | YES | NO |
| `options.validator.ts` | SOURCE | VALIDATION | 13,921 | YES | NO |
| `question-validation.engine.ts` | SOURCE | VALIDATION | 21,377 | YES | NO |

### Directory: `src/lib/validation/testing` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mock-validation-provider.ts` | SOURCE | VALIDATION | 2,000 | YES | NO |

### Directory: `src/lib/validators` (7 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `phase15-script.validator.ts` | SOURCE | VALIDATION | 5,056 | YES | NO |
| `phase20-social-quality-gate.validator.ts` | SOURCE | VALIDATION | 16,772 | YES | NO |
| `pinned-comment-safety.validator.ts` | SOURCE | VALIDATION | 10,784 | YES | NO |
| `platform-adaptation.validator.ts` | SOURCE | VALIDATION | 4,621 | YES | NO |
| `question-creation.validator.ts` | SOURCE | VALIDATION | 11,514 | YES | NO |
| `social-invariance.validator.ts` | SOURCE | VALIDATION | 21,199 | YES | NO |
| `thumbnail-safety.validator.ts` | SOURCE | VALIDATION | 6,583 | YES | NO |

### Directory: `src/lib/workflow` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `canonical-workflow.ts` | SOURCE | WORKFLOW | 21,494 | YES | NO |

### Directory: `src/pages` (31 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AnalyticsExperiencePage.tsx` | SOURCE | PAGE | 55,977 | YES | NO |
| `ContentMasterPage.tsx` | SOURCE | PAGE | 67,532 | YES | NO |
| `DashboardPage.tsx` | SOURCE | PAGE | 13,664 | YES | NO |
| `LoginPage.tsx` | SOURCE | PAGE | 7,535 | YES | NO |
| `MyWorkPage.tsx` | SOURCE | PAGE | 47,757 | YES | NO |
| `NotFoundPage.tsx` | SOURCE | PAGE | 1,013 | YES | NO |
| `PlanningPage.tsx` | SOURCE | PAGE | 132,280 | YES | NO |
| `PlatformPackagesPage.tsx` | SOURCE | PAGE | 33,296 | YES | NO |
| `ProductionBoardPage.tsx` | SOURCE | PAGE | 43,076 | YES | NO |
| `ProductionTrackerPage.tsx` | SOURCE | PAGE | 17,937 | YES | NO |
| `PublishingPackagePage.tsx` | SOURCE | PAGE | 35,217 | YES | NO |
| `PublishingPage.tsx` | SOURCE | PAGE | 33,979 | YES | NO |
| `QuestionDetailPage.tsx` | SOURCE | PAGE | 55,937 | YES | NO |
| `QuestionImprovePage.tsx` | SOURCE | PAGE | 41,805 | YES | NO |
| `QuestionLibraryPage.tsx` | SOURCE | PAGE | 17,867 | YES | NO |
| `QuestionStudioPage.tsx` | SOURCE | PAGE | 70,945 | YES | NO |
| `QuestionVerifyApprovePage.tsx` | SOURCE | PAGE | 47,395 | YES | NO |
| `QueuePage.tsx` | SOURCE | PAGE | 17,554 | YES | NO |
| `RecoveryAdminPage.tsx` | SOURCE | PAGE | 115,158 | YES | NO |
| `SettingsPage.tsx` | SOURCE | PAGE | 130,669 | YES | NO |
| `SocialAnalyticsPage.tsx` | SOURCE | PAGE | 72,365 | YES | NO |
| `SocialReviewPage.tsx` | SOURCE | PAGE | 23,694 | YES | NO |
| `TeamOperationsPage.tsx` | SOURCE | PAGE | 49,825 | YES | NO |
| `VideoCreateScriptPage.tsx` | SOURCE | PAGE | 5,419 | YES | NO |
| `VideoDetailPage.tsx` | SOURCE | PAGE | 28,303 | YES | NO |
| `VideoEditPage.tsx` | SOURCE | PAGE | 37,879 | YES | NO |
| `VideoFinalPage.tsx` | SOURCE | PAGE | 30,560 | YES | NO |
| `VideoPinnedCommentPage.tsx` | SOURCE | PAGE | 25,281 | YES | NO |
| `VideoRecordPage.tsx` | SOURCE | PAGE | 49,594 | YES | NO |
| `VideoReviewScriptPage.tsx` | SOURCE | PAGE | 31,649 | YES | NO |
| `VideoThumbnailPage.tsx` | SOURCE | PAGE | 39,714 | YES | NO |

### Directory: `src/server` (2 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `routes.ts` | SOURCE | API | 246,066 | YES | NO |
| `test-routes.ts` | SOURCE | API | 31,505 | YES | NO |

### Directory: `src/server/middleware` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.middleware.ts` | SOURCE | API | 4,681 | YES | NO |

### Directory: `src/tests` (249 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `api-client-header-regression.test.ts` | TEST | TEST | 2,652 | VERIFICATION | NO |
| `canonical-sequence-parsing.test.ts` | TEST | TEST | 12,434 | VERIFICATION | NO |
| `category-decoupling-verification.test.ts` | TEST | TEST | 22,375 | VERIFICATION | NO |
| `comprehensive-e2e-suite.ts` | TEST | TEST | 11,395 | VERIFICATION | NO |
| `creation-compensation-resilience.test.ts` | TEST | TEST | 17,488 | VERIFICATION | NO |
| `d01-concurrency-protection.test.ts` | TEST | TEST | 11,381 | VERIFICATION | NO |
| `deletion-safety-pipeline.test.ts` | TEST | TEST | 10,948 | VERIFICATION | NO |
| `edit-integration-test.ts` | TEST | TEST | 7,257 | VERIFICATION | NO |
| `execute-phase-2-cleanup.ts` | TEST | TEST | 6,296 | VERIFICATION | PHASE_SUITE |
| `execute-phase-4a-topics.ts` | TEST | TEST | 9,187 | VERIFICATION | PHASE_SUITE |
| `execute-phase-4b1-subtopics.ts` | TEST | TEST | 12,197 | VERIFICATION | PHASE_SUITE |
| `execute-safe-remediation.ts` | TEST | TEST | 10,225 | VERIFICATION | NO |
| `execute-testdata-cleanup.ts` | TEST | TEST | 9,231 | VERIFICATION | NO |
| `final-cleanup-verification.ts` | TEST | TEST | 5,189 | VERIFICATION | NO |
| `find-context.ts` | TEST | TEST | 687 | VERIFICATION | NO |
| `forensic-audit-check.ts` | TEST | TEST | 1,454 | VERIFICATION | NO |
| `forensic-audit-results.txt` | TEST | TEST | 9,262 | VERIFICATION | NO |
| `fraction-persistence-retest.ts` | TEST | TEST | 6,039 | VERIFICATION | NO |
| `fraction-protection.test.ts` | TEST | TEST | 1,863 | VERIFICATION | NO |
| `hybrid-math-boundary.test.ts` | TEST | TEST | 5,525 | VERIFICATION | NO |
| `idempotency-concurrency-resilience.test.ts` | TEST | TEST | 25,553 | VERIFICATION | NO |
| `integration-semantic.test.ts` | TEST | TEST | 9,447 | VERIFICATION | NO |
| `language-default-verification.ts` | TEST | TEST | 7,040 | VERIFICATION | NO |
| `library-integration-retest.ts` | TEST | TEST | 4,823 | VERIFICATION | NO |
| `live-production-verification.ts` | TEST | TEST | 11,174 | VERIFICATION | NO |
| `multi-take-persistence.test.ts` | TEST | TEST | 7,886 | VERIFICATION | NO |
| `negative-tests.ts` | TEST | TEST | 6,021 | VERIFICATION | NO |
| `p02-request-pressure-protection.test.ts` | TEST | TEST | 10,922 | VERIFICATION | NO |
| `parse-audit-calls.ts` | TEST | TEST | 1,337 | VERIFICATION | NO |
| `phase-5-question-model.ts` | TEST | TEST | 31,256 | VERIFICATION | PHASE_SUITE |
| `phase-6-configuration-engine.ts` | TEST | TEST | 17,239 | VERIFICATION | PHASE_SUITE |
| `phase-7-ai-generation-engine.ts` | TEST | TEST | 30,083 | VERIFICATION | PHASE_SUITE |
| `phase03-design-system-verification.ts` | TEST | TEST | 11,643 | VERIFICATION | PHASE_SUITE |
| `phase03-security-regression.ts` | TEST | TEST | 20,369 | VERIFICATION | PHASE_SUITE |
| `phase04-shell-navigation-verification.ts` | TEST | TEST | 18,728 | VERIFICATION | PHASE_SUITE |
| `phase04-taxonomy-verification.ts` | TEST | TEST | 19,332 | VERIFICATION | PHASE_SUITE |
| `phase05-dashboard-home-verification.ts` | TEST | TEST | 16,085 | VERIFICATION | PHASE_SUITE |
| `phase06-question-workflow-verification.ts` | TEST | TEST | 11,997 | VERIFICATION | PHASE_SUITE |
| `phase07-video-workflow-verification.ts` | TEST | TEST | 13,356 | VERIFICATION | PHASE_SUITE |
| `phase08-asset-review-verification.ts` | TEST | TEST | 12,419 | VERIFICATION | PHASE_SUITE |
| `phase09-publishing-workflow-verification.ts` | TEST | TEST | 13,997 | VERIFICATION | PHASE_SUITE |
| `phase10-analytics-experience-verification.ts` | TEST | TEST | 5,542 | VERIFICATION | PHASE_SUITE |
| `phase10-publishing-verification.ts` | TEST | TEST | 34,749 | VERIFICATION | PHASE_SUITE |
| `phase10-verification.ts` | TEST | TEST | 42,359 | VERIFICATION | PHASE_SUITE |
| `phase11-canonical-lifecycle-verification.ts` | TEST | TEST | 21,042 | VERIFICATION | PHASE_SUITE |
| `phase11-legacy-ui-simplification-verification.ts` | TEST | TEST | 11,342 | VERIFICATION | PHASE_SUITE |
| `phase11-step1-dashboard-verification.ts` | TEST | TEST | 11,582 | VERIFICATION | PHASE_SUITE |
| `phase11-step2-manager-dashboard-verification.ts` | TEST | TEST | 7,495 | VERIFICATION | PHASE_SUITE |
| `phase11-step3-specialist-workboards-verification.ts` | TEST | TEST | 6,629 | VERIFICATION | PHASE_SUITE |
| `phase11a-verification.ts` | TEST | TEST | 8,571 | VERIFICATION | PHASE_SUITE |
| `phase11b-auth-verification.ts` | TEST | TEST | 10,935 | VERIFICATION | PHASE_SUITE |
| `phase12-final-ui-ux-acceptance-verification.ts` | TEST | TEST | 50,771 | VERIFICATION | PHASE_SUITE |
| `phase12-review-assignment-verification.ts` | TEST | TEST | 24,656 | VERIFICATION | PHASE_SUITE |
| `phase12-step2-production-asset-validation.ts` | TEST | TEST | 11,849 | VERIFICATION | PHASE_SUITE |
| `phase12-step3-production-asset-synchronization.ts` | TEST | TEST | 16,795 | VERIFICATION | PHASE_SUITE |
| `phase12-step4-production-asset-readiness.ts` | TEST | TEST | 14,518 | VERIFICATION | PHASE_SUITE |
| `phase13-8-assignment-race-remediation.ts` | TEST | TEST | 15,223 | VERIFICATION | PHASE_SUITE |
| `phase13-9-thumbnail-rollback-remediation.ts` | TEST | TEST | 13,624 | VERIFICATION | PHASE_SUITE |
| `phase13-ai-refinement-verification.ts` | TEST | TEST | 27,771 | VERIFICATION | PHASE_SUITE |
| `phase13-live-verification.ts` | TEST | TEST | 29,118 | VERIFICATION | PHASE_SUITE |
| `phase13-step1-publishing-scheduling.ts` | TEST | TEST | 18,152 | VERIFICATION | PHASE_SUITE |
| `phase13-step1-rbac-audit.ts` | TEST | TEST | 3,803 | VERIFICATION | PHASE_SUITE |
| `phase13-step2-retry-logic.ts` | TEST | TEST | 24,826 | VERIFICATION | PHASE_SUITE |
| `phase13-step3-package-copier.ts` | TEST | TEST | 25,696 | VERIFICATION | PHASE_SUITE |
| `phase13-step4-publishing-assignments.ts` | TEST | TEST | 36,305 | VERIFICATION | PHASE_SUITE |
| `phase13-step5-publishing-integration.ts` | TEST | TEST | 32,979 | VERIFICATION | PHASE_SUITE |
| `phase14-production-drive-verification.ts` | TEST | TEST | 15,007 | VERIFICATION | PHASE_SUITE |
| `phase14-real-drive-e2e.ts` | TEST | TEST | 10,776 | VERIFICATION | PHASE_SUITE |
| `phase14-step2-verification.ts` | TEST | TEST | 13,260 | VERIFICATION | PHASE_SUITE |
| `phase14-step3-verification.ts` | TEST | TEST | 19,554 | VERIFICATION | PHASE_SUITE |
| `phase14-step4-verification.ts` | TEST | TEST | 23,975 | VERIFICATION | PHASE_SUITE |
| `phase14-step5-verification.ts` | TEST | TEST | 12,782 | VERIFICATION | PHASE_SUITE |
| `phase15-script-production-verification.ts` | TEST | TEST | 15,075 | VERIFICATION | PHASE_SUITE |
| `phase15-step2-verification.ts` | TEST | TEST | 11,534 | VERIFICATION | PHASE_SUITE |
| `phase15-step3-verification.ts` | TEST | TEST | 10,230 | VERIFICATION | PHASE_SUITE |
| `phase15-step5-verification.ts` | TEST | TEST | 15,118 | VERIFICATION | PHASE_SUITE |
| `phase15-step6-assignment-deduplication-verification.ts` | TEST | TEST | 19,762 | VERIFICATION | PHASE_SUITE |
| `phase16-human-script-workflow-verification.ts` | TEST | TEST | 10,823 | VERIFICATION | PHASE_SUITE |
| `phase16-step2-lifecycle-orchestration.ts` | TEST | TEST | 20,144 | VERIFICATION | PHASE_SUITE |
| `phase16-step3-rbac-gate.ts` | TEST | TEST | 13,644 | VERIFICATION | PHASE_SUITE |
| `phase16-step3-ui-integration.ts` | TEST | TEST | 12,741 | VERIFICATION | PHASE_SUITE |
| `phase17-video-workflow-verification.ts` | TEST | TEST | 31,436 | VERIFICATION | PHASE_SUITE |
| `phase18-thumbnail-intelligence.ts` | TEST | TEST | 25,418 | VERIFICATION | PHASE_SUITE |
| `phase19-pinned-comment-intelligence.ts` | TEST | TEST | 27,149 | VERIFICATION | PHASE_SUITE |
| `phase2-verification.ts` | TEST | TEST | 7,440 | VERIFICATION | PHASE_SUITE |
| `phase20-social-review.ts` | TEST | TEST | 57,099 | VERIFICATION | PHASE_SUITE |
| `phase21-platform-adaptation.ts` | TEST | TEST | 42,410 | VERIFICATION | PHASE_SUITE |
| `phase22-publishing-hub.ts` | TEST | TEST | 32,005 | VERIFICATION | PHASE_SUITE |
| `phase23-production-dashboard.ts` | TEST | TEST | 25,195 | VERIFICATION | PHASE_SUITE |
| `phase24-ai-orchestrator.ts` | TEST | TEST | 31,793 | VERIFICATION | PHASE_SUITE |
| `phase27-social-analytics-verification.ts` | TEST | TEST | 7,231 | VERIFICATION | PHASE_SUITE |
| `phase28-social-performance-intelligence-verification.ts` | TEST | TEST | 7,326 | VERIFICATION | PHASE_SUITE |
| `phase29-controlled-strategy-integration-verification.ts` | TEST | TEST | 7,525 | VERIFICATION | PHASE_SUITE |
| `phase29b-posting-time-intelligence-verification.ts` | TEST | TEST | 9,763 | VERIFICATION | PHASE_SUITE |
| `phase3-verification.ts` | TEST | TEST | 12,820 | VERIFICATION | PHASE_SUITE |
| `phase4-verification.ts` | TEST | TEST | 14,798 | VERIFICATION | PHASE_SUITE |
| `phase5-verification.ts` | TEST | TEST | 20,650 | VERIFICATION | PHASE_SUITE |
| `phase6-verification.ts` | TEST | TEST | 20,949 | VERIFICATION | PHASE_SUITE |
| `phase7-oauth-verification.ts` | TEST | TEST | 23,317 | VERIFICATION | PHASE_SUITE |
| `phase7-real-drive-e2e.ts` | TEST | TEST | 6,063 | VERIFICATION | PHASE_SUITE |
| `phase7-verification.ts` | TEST | TEST | 9,371 | VERIFICATION | PHASE_SUITE |
| `phase8-recovery-verification.ts` | TEST | TEST | 17,356 | VERIFICATION | PHASE_SUITE |
| `phase8a-verification.ts` | TEST | TEST | 11,950 | VERIFICATION | PHASE_SUITE |
| `phase8b-verification.ts` | TEST | TEST | 14,087 | VERIFICATION | PHASE_SUITE |
| `phase8i-security-qa-verification.ts` | TEST | TEST | 43,976 | VERIFICATION | PHASE_SUITE |
| `phase9-content-workflow-verification.ts` | TEST | TEST | 103,541 | VERIFICATION | PHASE_SUITE |
| `phase9-verification.ts` | TEST | TEST | 25,578 | VERIFICATION | PHASE_SUITE |
| `pipeline-convergence-sequence-resilience.test.ts` | TEST | TEST | 18,393 | VERIFICATION | NO |
| `production-sheet-initializer-test.ts` | TEST | TEST | 4,580 | VERIFICATION | NO |
| `purge-test-artifacts.ts` | TEST | TEST | 8,402 | VERIFICATION | NO |
| `qa-user-verification.ts` | TEST | TEST | 6,086 | VERIFICATION | NO |
| `qa-user.fixture.ts` | TEST | TEST | 1,254 | VERIFICATION | NO |
| `qs-duplicate-check-regression.test.ts` | TEST | TEST | 4,439 | VERIFICATION | NO |
| `qs-repair-regression.test.ts` | TEST | TEST | 11,360 | VERIFICATION | NO |
| `qs-successive-percentage-math.test.ts` | TEST | TEST | 8,347 | VERIFICATION | NO |
| `qs-validation-alias-regression.test.ts` | TEST | TEST | 7,027 | VERIFICATION | NO |
| `qs14b-e2e-production-execution.ts` | TEST | TEST | 22,670 | VERIFICATION | NO |
| `qs18b-blind-math-verification.test.ts` | TEST | TEST | 14,479 | VERIFICATION | NO |
| `qs19b-runtime-verification.ts` | TEST | TEST | 7,145 | VERIFICATION | NO |
| `qs19d-server-static-serving.test.ts` | TEST | TEST | 7,216 | VERIFICATION | NO |
| `qs21b-mathematical-safety-gate.test.ts` | TEST | TEST | 14,937 | VERIFICATION | NO |
| `question-config-infrastructure.test.ts` | TEST | TEST | 20,168 | VERIFICATION | NO |
| `question-contract-regression.test.ts` | TEST | TEST | 14,849 | VERIFICATION | NO |
| `question-studio-config-integration.test.ts` | TEST | TEST | 9,451 | VERIFICATION | NO |
| `question-style-persistence.test.ts` | TEST | TEST | 19,884 | VERIFICATION | NO |
| `real-life-context-configuration.test.ts` | TEST | TEST | 13,708 | VERIFICATION | NO |
| `run-all-regressions.ts` | TEST | TEST | 6,190 | VERIFICATION | NO |
| `run-phase11-only.ts` | TEST | TEST | 1,332 | VERIFICATION | PHASE_SUITE |
| `run-phase11-step1-dashboard.ts` | TEST | TEST | 755 | VERIFICATION | PHASE_SUITE |
| `run-phase11-step2-manager-dashboard.ts` | TEST | TEST | 785 | VERIFICATION | PHASE_SUITE |
| `run-phase11-step3-specialist-workboards.ts` | TEST | TEST | 801 | VERIFICATION | PHASE_SUITE |
| `run-phase12-only.ts` | TEST | TEST | 1,341 | VERIFICATION | PHASE_SUITE |
| `run-phase12-step2.ts` | TEST | TEST | 295 | VERIFICATION | PHASE_SUITE |
| `run-phase12-step3.ts` | TEST | TEST | 300 | VERIFICATION | PHASE_SUITE |
| `run-phase12-step4.ts` | TEST | TEST | 294 | VERIFICATION | PHASE_SUITE |
| `run-phase13-live.ts` | TEST | TEST | 450 | VERIFICATION | PHASE_SUITE |
| `run-phase13-only.ts` | TEST | TEST | 1,333 | VERIFICATION | PHASE_SUITE |
| `run-phase13-step1.ts` | TEST | TEST | 374 | VERIFICATION | PHASE_SUITE |
| `run-phase14-only.ts` | TEST | TEST | 1,359 | VERIFICATION | PHASE_SUITE |
| `run-phase15-only.ts` | TEST | TEST | 1,112 | VERIFICATION | PHASE_SUITE |
| `run-phase15-step5.ts` | TEST | TEST | 2,531 | VERIFICATION | PHASE_SUITE |
| `run-phase16-only.ts` | TEST | TEST | 929 | VERIFICATION | PHASE_SUITE |
| `run-phase17-only.ts` | TEST | TEST | 931 | VERIFICATION | PHASE_SUITE |
| `run-phase18-only.ts` | TEST | TEST | 926 | VERIFICATION | PHASE_SUITE |
| `run-phase19-only.ts` | TEST | TEST | 1,127 | VERIFICATION | PHASE_SUITE |
| `run-phase20-only.ts` | TEST | TEST | 1,099 | VERIFICATION | PHASE_SUITE |
| `run-phase21-only.ts` | TEST | TEST | 1,110 | VERIFICATION | PHASE_SUITE |
| `run-phase22-only.ts` | TEST | TEST | 1,086 | VERIFICATION | PHASE_SUITE |
| `run-phase23-only.ts` | TEST | TEST | 1,115 | VERIFICATION | PHASE_SUITE |
| `run-phase24-only.ts` | TEST | TEST | 1,108 | VERIFICATION | PHASE_SUITE |
| `run-phase25-only.ts` | TEST | TEST | 37,383 | VERIFICATION | PHASE_SUITE |
| `run-phase26-only.ts` | TEST | TEST | 24,485 | VERIFICATION | PHASE_SUITE |
| `run-phase27-only.ts` | TEST | TEST | 20,277 | VERIFICATION | PHASE_SUITE |
| `run-phase28-only.ts` | TEST | TEST | 19,681 | VERIFICATION | PHASE_SUITE |
| `run-phase29.ts` | TEST | TEST | 729 | VERIFICATION | PHASE_SUITE |
| `run-phase30-social-comments.ts` | TEST | TEST | 19,490 | VERIFICATION | PHASE_SUITE |
| `run-phase31-comment-intelligence.ts` | TEST | TEST | 24,296 | VERIFICATION | PHASE_SUITE |
| `run-phase32-c4-feedback-loop.ts` | TEST | TEST | 16,285 | VERIFICATION | PHASE_SUITE |
| `run-phase9.ts` | TEST | TEST | 401 | VERIFICATION | PHASE_SUITE |
| `run-task2.ts` | TEST | TEST | 1,196 | VERIFICATION | PHASE_SUITE |
| `run-task3d4.ts` | TEST | TEST | 414 | VERIFICATION | PHASE_SUITE |
| `run-task3d5.ts` | TEST | TEST | 429 | VERIFICATION | PHASE_SUITE |
| `run-task3e1.ts` | TEST | TEST | 429 | VERIFICATION | PHASE_SUITE |
| `run-task3f55.ts` | TEST | TEST | 689 | VERIFICATION | PHASE_SUITE |
| `semantic-verification.test.ts` | TEST | TEST | 3,499 | VERIFICATION | NO |
| `sequence-self-healing-resilience.test.ts` | TEST | TEST | 25,105 | VERIFICATION | NO |
| `stage01-draft-workflow-separation.test.ts` | TEST | TEST | 6,716 | VERIFICATION | PHASE_SUITE |
| `stage02-targeted-bugfixes.test.ts` | TEST | TEST | 9,069 | VERIFICATION | PHASE_SUITE |
| `stage02-video-transitions.test.ts` | TEST | TEST | 10,376 | VERIFICATION | PHASE_SUITE |
| `stage8-continuous-verification.ts` | TEST | TEST | 41,005 | VERIFICATION | PHASE_SUITE |
| `step01-question-studio-workflow-state.test.ts` | TEST | TEST | 8,876 | VERIFICATION | NO |
| `studio-e2e-integration.ts` | TEST | TEST | 9,697 | VERIFICATION | NO |
| `surgical-repair.ts` | TEST | TEST | 8,153 | VERIFICATION | NO |
| `task2-content-master-verification.ts` | TEST | TEST | 14,517 | VERIFICATION | PHASE_SUITE |
| `task2b-taxonomy-verification.ts` | TEST | TEST | 14,130 | VERIFICATION | PHASE_SUITE |
| `task2c-question-verification.ts` | TEST | TEST | 24,037 | VERIFICATION | PHASE_SUITE |
| `task2d-gemini-verification.ts` | TEST | TEST | 18,838 | VERIFICATION | PHASE_SUITE |
| `task2d1-gemini-fallback-math.ts` | TEST | TEST | 6,681 | VERIFICATION | PHASE_SUITE |
| `task2e1-question-to-video.ts` | TEST | TEST | 10,336 | VERIFICATION | PHASE_SUITE |
| `task2e2-video-script-versioning.ts` | TEST | TEST | 15,310 | VERIFICATION | PHASE_SUITE |
| `task2e3-thumbnail-workflow.ts` | TEST | TEST | 13,286 | VERIFICATION | PHASE_SUITE |
| `task2e4-pinned-comment-workflow.ts` | TEST | TEST | 15,429 | VERIFICATION | PHASE_SUITE |
| `task2e5-cleanup-safety.ts` | TEST | TEST | 6,090 | VERIFICATION | PHASE_SUITE |
| `task2e5-publishing-workflow.ts` | TEST | TEST | 18,064 | VERIFICATION | PHASE_SUITE |
| `task2e6-final-pipeline-verification.ts` | TEST | TEST | 12,286 | VERIFICATION | PHASE_SUITE |
| `task3-taxonomy-engine-verification.ts` | TEST | TEST | 15,090 | VERIFICATION | PHASE_SUITE |
| `task3a-planning-verification.ts` | TEST | TEST | 16,018 | VERIFICATION | PHASE_SUITE |
| `task3d1-assignment-verification.ts` | TEST | TEST | 16,080 | VERIFICATION | PHASE_SUITE |
| `task3d2-rbac-verification.ts` | TEST | TEST | 18,726 | VERIFICATION | PHASE_SUITE |
| `task3d3-review-workflow-verification.ts` | TEST | TEST | 31,554 | VERIFICATION | PHASE_SUITE |
| `task3d4-script-designer-workflow-verification.ts` | TEST | TEST | 45,641 | VERIFICATION | PHASE_SUITE |
| `task3d5-workload-dashboard-verification.ts` | TEST | TEST | 31,502 | VERIFICATION | PHASE_SUITE |
| `task3e1-my-work-operations-verification.ts` | TEST | TEST | 16,461 | VERIFICATION | PHASE_SUITE |
| `task3e2-production-board-api.ts` | TEST | TEST | 4,199 | VERIFICATION | PHASE_SUITE |
| `task3e3-readiness-rules-inspection.ts` | TEST | TEST | 4,281 | VERIFICATION | PHASE_SUITE |
| `task3f4-restore-validator-verification.ts` | TEST | TEST | 11,627 | VERIFICATION | PHASE_SUITE |
| `task3f4-snapshot-exporter-verification.ts` | TEST | TEST | 3,385 | VERIFICATION | PHASE_SUITE |
| `task3f410a-snapshot-config-verification.ts` | TEST | TEST | 7,361 | VERIFICATION | PHASE_SUITE |
| `task3f410b-durable-archive-verification.ts` | TEST | TEST | 11,931 | VERIFICATION | PHASE_SUITE |
| `task3f410c-durable-archive-integration-verification.ts` | TEST | TEST | 12,081 | VERIFICATION | PHASE_SUITE |
| `task3f410d-recovery-archive-ui-verification.ts` | TEST | TEST | 11,909 | VERIFICATION | PHASE_SUITE |
| `task3f410e-gcs-smoke-test.ts` | TEST | TEST | 16,416 | VERIFICATION | PHASE_SUITE |
| `task3f410f-scheduler-verification.ts` | TEST | TEST | 15,396 | VERIFICATION | PHASE_SUITE |
| `task3f47a-granular-question-restore-verification.ts` | TEST | TEST | 12,119 | VERIFICATION | PHASE_SUITE |
| `task3f47b-granular-video-restore-verification.ts` | TEST | TEST | 19,576 | VERIFICATION | PHASE_SUITE |
| `task3f47c-granular-script-restore-verification.ts` | TEST | TEST | 20,715 | VERIFICATION | PHASE_SUITE |
| `task3f47d-granular-thumbnail-restore-verification.ts` | TEST | TEST | 20,812 | VERIFICATION | PHASE_SUITE |
| `task3f47e-granular-pinned-comment-restore-verification.ts` | TEST | TEST | 20,139 | VERIFICATION | PHASE_SUITE |
| `task3f47f-granular-publishing-restore-verification.ts` | TEST | TEST | 18,828 | VERIFICATION | PHASE_SUITE |
| `task3f47g-granular-assignment-restore-verification.ts` | TEST | TEST | 26,631 | VERIFICATION | PHASE_SUITE |
| `task3f48-full-snapshot-preflight-verification.ts` | TEST | TEST | 9,458 | VERIFICATION | PHASE_SUITE |
| `task3f48-full-snapshot-restore-execution-verification.ts` | TEST | TEST | 36,593 | VERIFICATION | PHASE_SUITE |
| `task3f48-full-snapshot-restore-plan-verification.ts` | TEST | TEST | 14,184 | VERIFICATION | PHASE_SUITE |
| `task3f48-full-snapshot-restore-planner-verification.ts` | TEST | TEST | 6,806 | VERIFICATION | PHASE_SUITE |
| `task3f49-full-restore-api-verification.ts` | TEST | TEST | 15,354 | VERIFICATION | PHASE_SUITE |
| `task3f49-full-restore-ui-verification.ts` | TEST | TEST | 19,746 | VERIFICATION | PHASE_SUITE |
| `task3f49-granular-restore-api-verification.ts` | TEST | TEST | 19,209 | VERIFICATION | PHASE_SUITE |
| `task3f49-granular-restore-ui-verification.ts` | TEST | TEST | 16,786 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-admin-status-ui-verification.ts` | TEST | TEST | 7,685 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-dry-run-api-verification.ts` | TEST | TEST | 13,905 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-dry-run-ui-verification.ts` | TEST | TEST | 16,882 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-security-verification.ts` | TEST | TEST | 19,356 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-snapshot-history-ui-verification.ts` | TEST | TEST | 10,681 | VERIFICATION | PHASE_SUITE |
| `task3f49-recovery-status-api-verification.ts` | TEST | TEST | 9,909 | VERIFICATION | PHASE_SUITE |
| `task3f55-global-search-routing-verification.ts` | TEST | TEST | 16,860 | VERIFICATION | PHASE_SUITE |
| `task4-question-creation-engine-verification.ts` | TEST | TEST | 25,094 | VERIFICATION | PHASE_SUITE |
| `task5-question-validation-engine-verification.ts` | TEST | TEST | 37,574 | VERIFICATION | PHASE_SUITE |
| `task5b-security-correctness-verification.ts` | TEST | TEST | 19,620 | VERIFICATION | PHASE_SUITE |
| `task6-telugu-script-verification.ts` | TEST | TEST | 12,827 | VERIFICATION | PHASE_SUITE |
| `task6b-provider-abstraction-verification.ts` | TEST | TEST | 10,060 | VERIFICATION | PHASE_SUITE |
| `task6c-orchestrator-verification.ts` | TEST | TEST | 15,538 | VERIFICATION | PHASE_SUITE |
| `task6d-validation-adapter-verification.ts` | TEST | TEST | 15,901 | VERIFICATION | PHASE_SUITE |
| `task7-video-queue-verification.ts` | TEST | TEST | 25,968 | VERIFICATION | PHASE_SUITE |
| `task7b-unified-studio-verification.ts` | TEST | TEST | 7,263 | VERIFICATION | PHASE_SUITE |
| `task7c-question-studio-quality-verification.ts` | TEST | TEST | 10,633 | VERIFICATION | PHASE_SUITE |
| `task8-publishing-verification.ts` | TEST | TEST | 26,225 | VERIFICATION | PHASE_SUITE |
| `task8b-social-content-foundation-verification.ts` | TEST | TEST | 14,440 | VERIFICATION | PHASE_SUITE |
| `task8c-hook-presentation-engine-verification.ts` | TEST | TEST | 21,461 | VERIFICATION | PHASE_SUITE |
| `task8d-teleprompter-spoken-enhancer-verification.ts` | TEST | TEST | 20,920 | VERIFICATION | PHASE_SUITE |
| `task8e-social-metadata-generator-verification.ts` | TEST | TEST | 25,085 | VERIFICATION | PHASE_SUITE |
| `task8f-multi-platform-adaptation-verification.ts` | TEST | TEST | 33,663 | VERIFICATION | PHASE_SUITE |
| `task8g-social-quality-engagement-verification.ts` | TEST | TEST | 46,002 | VERIFICATION | PHASE_SUITE |
| `task8h-social-review-workflow-verification.ts` | TEST | TEST | 32,021 | VERIFICATION | PHASE_SUITE |
| `task9-auth-verification.ts` | TEST | TEST | 22,513 | VERIFICATION | PHASE_SUITE |
| `test-isolation-safety-gate.test.ts` | TEST | TEST | 14,779 | VERIFICATION | NO |
| `thumbnail-real-upload-workflow.test.ts` | TEST | TEST | 21,957 | VERIFICATION | NO |
| `unified-question-creation.test.ts` | TEST | TEST | 12,745 | VERIFICATION | NO |
| `verify-cleanup.ts` | TEST | TEST | 2,693 | VERIFICATION | NO |
| `verify-social-analytics-ui.ts` | TEST | TEST | 12,225 | VERIFICATION | NO |

### Directory: `src/types` (4 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.ts` | TYPE_DEFINITION | TYPE | 88,808 | YES | NO |
| `phase24-ai.ts` | TYPE_DEFINITION | TYPE | 3,309 | YES | NO |
| `phase25-consensus.ts` | TYPE_DEFINITION | TYPE | 2,964 | YES | NO |
| `phase26-copilot.ts` | TYPE_DEFINITION | TYPE | 7,741 | YES | NO |

### Directory: `src/utils` (1 files)

| Filename | Category | Technical Area | Size (bytes) | Critical | Legacy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `formatters.ts` | SOURCE | UTILITY | 3,993 | YES | NO |

