# S7-T01: REPOSITORY FORENSIC INVENTORY & ARCHITECTURAL COUPLING AUDIT

**Sprint**: SPRINT 7 — ARCHITECTURE REORGANIZATION & FEATURE ISOLATION  
**Task**: S7-T01 Repository Forensic Inventory  
**Target Milestone**: Make every feature independently understandable, independently changeable, and independently testable.  
**Execution Mode**: READ-ONLY FORENSIC AUDIT (Zero production code moved, zero files deleted, zero runtime modifications).

---

## 1. Executive Summary & Repository Baseline

### 1.1 Git Working Tree Baseline
- **Audit Date**: October 11, 2026
- **Current HEAD Commit**: `160832a90cfbfab357380cc21e2d0be8971527a2`
- **Remote Tracking (`origin/main`)**: `160832a90cfbfab357380cc21e2d0be8971527a2` (Synchronized)
- **Working Tree State**: Clean (`nothing to commit, working tree clean`)
- **Total Tracked Files**: **480 files**

### 1.2 Repository Physical Distribution
| Top-Level Directory | File Count | Dominant Layer / Responsibility |
|:---|:---|:---|
| `src/lib/` | 205 | Backend domain services, repositories, AI providers, validators |
| `src/components/` | 63 | React presentation components, UI controls, modals, tables |
| `docs/` | 62 | Architecture specs, feature contracts, sprint reports, ADRs |
| `src/pages/` | 32 | Top-level routing workspaces & domain dashboards |
| `tests/` | 28 | Regression suites, gate tests, foundation capability validations |
| `src/types/` | 25 | Shared TypeScript interfaces, domain contracts, route types |
| `src/design-system/` | 21 | Unified atomic design tokens, Tailwind theme primitives |
| Root (`/`) | 17 | Configuration files, build scripts, Dockerfile, security rules |
| `src/config/` | 8 | Question creation rules, platform settings, UI configs |
| `scripts/` | 7 | Administrative database seeding, cleanup & OAuth utilities |
| `src/server/` | 6 | Express server setup, monolithic router, HTTP middleware |
| `src/` (Root) | 3 | React entry points (`main.tsx`, `App.tsx`, `index.css`) |
| `src/contexts/` | 2 | Client React state providers (Auth, Navigation) |
| `src/utils/` | 1 | Shared utility helpers |
| **Total** | **480** | **Complete repository inventory** |

### 1.3 Primary Architectural Classification Breakdown
Every file in the repository has been audited and classified into exactly one primary architectural category:

```
  FRONTEND        : 118 files  (24.6%)
  BACKEND         : 109 files  (22.7%)
  DOCUMENTATION   :  62 files  (12.9%)
  AI              :  51 files  (10.6%)
  DATABASE        :  44 files  ( 9.2%)
  TEST            :  28 files  ( 5.8%)
  CONFIGURATION   :  27 files  ( 5.6%)
  SHARED          :  26 files  ( 5.4%)
  WORKFLOW        :   8 files  ( 1.7%)
  SCRIPT          :   7 files  ( 1.5%)
  -----------------------------------------
  TOTAL           : 480 files  (100.0%)
```

---

## 2. Complete File Ownership Manifest (All 480 Files)

The following manifest records all 480 tracked files in Burra Pariksha CMS, mapping their responsibilities, architectural layers, domain owners, dependencies, consumers, proposed migration targets, and risk priorities:

| Current Path | Responsibility | Layer | Feature/Domain | Depends On | Consumed By | Target Location | Classification | Priority | Notes |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| `.dockerignore` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `.dockerignore` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `.env.example` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `.env.example` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `.env.local.example` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `.env.local.example` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `.gitignore` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `.gitignore` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `AGENTS.md` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `AGENTS.md` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `Dockerfile` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `Dockerfile` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `bun.lock` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `bun.lock` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `docs/ENVIRONMENT-CONTRACT.md` | Operational/baseline documentation | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/ENVIRONMENT-CONTRACT.md` | **DOCUMENTATION** | `LOW` | Historical or operational doc |
| `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/05-TARGET-SYSTEM-BOUNDARY.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/05-TARGET-SYSTEM-BOUNDARY.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/06-DOMAIN-MODEL.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/06-DOMAIN-MODEL.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/08-STATE-MODEL.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/08-STATE-MODEL.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/09-RBAC-CAPABILITY-MODEL.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/09-RBAC-CAPABILITY-MODEL.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/10-FRONTEND-INFORMATION-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/10-FRONTEND-INFORMATION-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/11-PAGE-ROUTE-CONTRACT.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/11-PAGE-ROUTE-CONTRACT.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/12-DATABASE-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/12-DATABASE-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/13-DATA-MODEL-DATA-CONTRACT.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/13-DATA-MODEL-DATA-CONTRACT.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/14-MEDIA-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/14-MEDIA-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/15-API-CONTRACT.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/15-API-CONTRACT.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/16-REALTIME-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/16-REALTIME-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/17-JOB-ASYNC-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/17-JOB-ASYNC-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/18-AI-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/18-AI-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/19-SECURITY-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/19-SECURITY-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/20-ANALYTICS-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/20-ANALYTICS-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/21-AUDIT-OBSERVABILITY.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/21-AUDIT-OBSERVABILITY.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/22-COST-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/22-COST-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/23-MIGRATION-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/23-MIGRATION-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/24-TEST-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/24-TEST-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/25-IMPLEMENTATION-DEPENDENCY-GRAPH.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/25-IMPLEMENTATION-DEPENDENCY-GRAPH.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/FIREBASE-ARCHITECTURE-SPIKE.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/FIREBASE-ARCHITECTURE-SPIKE.md` | **DOCUMENTATION** | `LOW` | Historical spike document |
| `docs/architecture/S4-T03-FIRESTORE-COLLECTION-REGISTRY.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/S4-T03-FIRESTORE-COLLECTION-REGISTRY.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/architecture/S4-T11-ANALYTICS-DATASTORE-DECISION.md` | Architectural specification & ADR | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/architecture/S4-T11-ANALYTICS-DATASTORE-DECISION.md` | **DOCUMENTATION** | `LOW` | Authoritative architecture record |
| `docs/baseline/03-CURRENT-SYSTEM-BASELINE.md` | Operational/baseline documentation | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/baseline/03-CURRENT-SYSTEM-BASELINE.md` | **DOCUMENTATION** | `LOW` | Historical or operational doc |
| `docs/execution/BACKLOG.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/BACKLOG.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/CURRENT-SPRINT.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/CURRENT-SPRINT.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/DECISION-LOG.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/DECISION-LOG.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/PROJECT-CONTROL.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/PROJECT-CONTROL.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/S2-T04-ARCHITECTURE-ROUTE-CLEANUP-MAP.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/S2-T04-ARCHITECTURE-ROUTE-CLEANUP-MAP.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/S4-T01-DATABASE-MIGRATION-BASELINE.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/S4-T01-DATABASE-MIGRATION-BASELINE.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/S4-T12-PRODUCTION-READINESS-GATE.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/S4-T12-PRODUCTION-READINESS-GATE.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/execution/SPRINT-1-BASELINE.md` | Historical sprint execution report | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/execution/SPRINT-1-BASELINE.md` | **DOCUMENTATION** | `LOW` | Historical record (Phases 1-8) |
| `docs/features/FC-001-SYSTEM-FOUNDATION-IDENTITY.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-001-SYSTEM-FOUNDATION-IDENTITY.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-002-RBAC-CAPABILITY-MATRIX.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-002-RBAC-CAPABILITY-MATRIX.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-003-DATABASE-API-ENVELOPES.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-003-DATABASE-API-ENVELOPES.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-004-AUDIT-OBSERVABILITY.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-004-AUDIT-OBSERVABILITY.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-005-WORKFLOW-STATE-ENGINE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-005-WORKFLOW-STATE-ENGINE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-006-QUESTION-GENERATION-VERSIONING.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-006-QUESTION-GENERATION-VERSIONING.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-007-QUESTION-VERIFICATION-REVIEWS.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-007-QUESTION-VERIFICATION-REVIEWS.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-008-AUDIENCE-SCRIPTING-VERSIONING.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-008-AUDIENCE-SCRIPTING-VERSIONING.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-009-TELEPROMPTER-FILMING-STUDIO.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-009-TELEPROMPTER-FILMING-STUDIO.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-010-MEDIA-STORAGE-RAW-VIDEO.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-010-MEDIA-STORAGE-RAW-VIDEO.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-011-EDITING-BAY-TIMELINE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-011-EDITING-BAY-TIMELINE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-012-FINAL-QC-REVIEW-GATE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-012-FINAL-QC-REVIEW-GATE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-013-THUMBNAIL-CREATIVE-CDN.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-013-THUMBNAIL-CREATIVE-CDN.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-014-SOCIAL-REVIEW-COMPLIANCE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-014-SOCIAL-REVIEW-COMPLIANCE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-016-PLATFORM-RELEASE-SYNC.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-016-PLATFORM-RELEASE-SYNC.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-017-BACKGROUND-JOB-QUEUE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-017-BACKGROUND-JOB-QUEUE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-018-REALTIME-SSE-NOTIFICATIONS.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-018-REALTIME-SSE-NOTIFICATIONS.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-020-TELEMETRY-PERFORMANCE-DECILES.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-020-TELEMETRY-PERFORMANCE-DECILES.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FC-022-STRANGLER-MIGRATION-DUAL-WRITE.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FC-022-STRANGLER-MIGRATION-DUAL-WRITE.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/features/FEATURE-CONTRACT-INDEX.md` | Feature specification contract | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/features/FEATURE-CONTRACT-INDEX.md` | **DOCUMENTATION** | `LOW` | Feature domain contract |
| `docs/operations/LOCAL-ENVIRONMENT-SETUP.md` | Operational/baseline documentation | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/operations/LOCAL-ENVIRONMENT-SETUP.md` | **DOCUMENTATION** | `LOW` | Historical or operational doc |
| `docs/requirements/02-BUSINESS-ACCEPTANCE-CRITERIA.md` | Operational/baseline documentation | Documentation | Architecture & Project Docs | None (Self-contained) | Repository dependencies | `docs/requirements/02-BUSINESS-ACCEPTANCE-CRITERIA.md` | **DOCUMENTATION** | `LOW` | Historical or operational doc |
| `firebase-applet-config.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `firebase-applet-config.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `firebase-blueprint.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `firebase-blueprint.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `firestore.rules` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `firestore.rules` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `index.html` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `index.html` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `metadata.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `metadata.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `package-lock.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `package-lock.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `package.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `package.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `scripts/admin-reset-firestore.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | admin, firestore-production-initializer.service, auth.service | Repository dependencies | `scripts/admin-reset-firestore.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/check-env.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | fs, path, env.contract | Repository dependencies | `scripts/check-env.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/google-oauth-setup.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | http, url, crypto (+1 more) | Repository dependencies | `scripts/google-oauth-setup.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/purge-test-firestore-records.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | admin | Repository dependencies | `scripts/purge-test-firestore-records.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/verify-drive-state.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | googleapis | Repository dependencies | `scripts/verify-drive-state.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/verify-gcs-state.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | googleapis | Repository dependencies | `scripts/verify-gcs-state.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `scripts/verify-raw-video-multitake.ts` | Administrative operational script | Tooling / Ops | Development & Admin Tooling | node:assert, auth.service, types | Repository dependencies | `scripts/verify-raw-video-multitake.ts` | **SCRIPT** | `LOW` | DevOps / database admin tool |
| `server.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, path, fs (+7 more) | Repository dependencies | `backend/server/server.ts` | **BACKEND** | `CRITICAL` | Server entry point |
| `src/App.tsx` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | react, react-router-dom, AuthContext (+27 more) | Repository dependencies | `src/App.tsx` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `src/components/assignments/AssignmentBadge.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, types, lucide-react | Repository dependencies | `frontend/components/AssignmentBadge.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/assignments/AssignmentModal.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, types, api-client (+1 more) | Repository dependencies | `frontend/components/AssignmentModal.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/assignments/EntityAssignmentsSection.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, types, api-client (+3 more) | Repository dependencies | `frontend/components/EntityAssignmentsSection.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/common/Button.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, Button | Repository dependencies | `frontend/shared/components/Button.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/DifficultyBadge.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, constants, types (+1 more) | Repository dependencies | `frontend/shared/components/DifficultyBadge.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/EmptyState.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, EmptyState | Repository dependencies | `frontend/shared/components/EmptyState.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/LoadingState.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, Loading | Repository dependencies | `frontend/shared/components/LoadingState.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/Modal.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, Modal | Repository dependencies | `frontend/shared/components/Modal.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/SearchInput.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, Input | Repository dependencies | `frontend/shared/components/SearchInput.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/StatCard.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, Card | Repository dependencies | `frontend/shared/components/StatCard.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/StatusBadge.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, constants, types (+1 more) | Repository dependencies | `frontend/shared/components/StatusBadge.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/common/TechnicalDetails.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react | Repository dependencies | `frontend/shared/components/TechnicalDetails.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/dashboard/ChannelPerformanceSection.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom (+4 more) | Repository dependencies | `frontend/features/operations/components/ChannelPerformanceSection.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/ContinueProductionCard.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom (+3 more) | Repository dependencies | `frontend/features/operations/components/ContinueProductionCard.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/ConveyorBeltVisualizer.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react | Repository dependencies | `frontend/features/operations/components/ConveyorBeltVisualizer.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/DailyWorkflowGuide.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/operations/components/DailyWorkflowGuide.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/DashboardFilterBar.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, types | Repository dependencies | `frontend/features/operations/components/DashboardFilterBar.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/ExecutiveHeroBanner.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/operations/components/ExecutiveHeroBanner.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/ExecutiveVitalsBento.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom | Repository dependencies | `frontend/features/operations/components/ExecutiveVitalsBento.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/GlobalSearchBar.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom (+2 more) | Repository dependencies | `frontend/features/operations/components/GlobalSearchBar.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/OperationalDispatch.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react (+2 more) | Repository dependencies | `frontend/features/operations/components/OperationalDispatch.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/PipelineVisualizer.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/operations/components/PipelineVisualizer.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/RecentAuditFeed.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, types, lucide-react | Repository dependencies | `frontend/features/operations/components/RecentAuditFeed.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/StaleContentSection.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom (+1 more) | Repository dependencies | `frontend/features/operations/components/StaleContentSection.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/TodaysWorkSection.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/operations/components/TodaysWorkSection.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/dashboard/WhatsWaitingSection.tsx` | Dashboard cards, vitals bento & pipeline widgets | Frontend Component | Executive & Workflow Operations | react, lucide-react, react-router-dom (+3 more) | Repository dependencies | `frontend/features/operations/components/WhatsWaitingSection.tsx` | **FRONTEND** | `MEDIUM` | Operational status display |
| `src/components/layout/ErrorBoundary.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, Button | Repository dependencies | `frontend/shared/components/ErrorBoundary.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/Header.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, GlobalSearchBar (+5 more) | Repository dependencies | `frontend/shared/components/Header.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/Layout.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, react-router-dom, Sidebar (+3 more) | Repository dependencies | `frontend/shared/components/Layout.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/NotificationsMenu.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, api-client | Repository dependencies | `frontend/shared/components/NotificationsMenu.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/PageHeader.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, PageHeader | Repository dependencies | `frontend/shared/components/PageHeader.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/Sidebar.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, react-router-dom, lucide-react (+4 more) | Repository dependencies | `frontend/shared/components/Sidebar.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/SystemHealthIndicator.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, api-client | Repository dependencies | `frontend/shared/components/SystemHealthIndicator.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/layout/UserProfileMenu.tsx` | Reusable UI primitives, shell & indicators | Frontend Component | Shared UI Components | react, lucide-react, react-router-dom (+3 more) | Repository dependencies | `frontend/shared/components/UserProfileMenu.tsx` | **FRONTEND** | `MEDIUM` | Design system / shell element |
| `src/components/production/PipelineProgress.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, types, constants | Repository dependencies | `frontend/components/PipelineProgress.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/production/ProductionJourneyBar.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, lucide-react, ProductionJourneyContext | Repository dependencies | `frontend/components/ProductionJourneyBar.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/production/ProductionKanban.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+3 more) | Repository dependencies | `frontend/components/ProductionKanban.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/production/ProductionTable.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, types (+5 more) | Repository dependencies | `frontend/components/ProductionTable.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/publishing/FinalizePublishingModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/FinalizePublishingModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/PackageCopierModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/PackageCopierModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/PublishScheduleModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/PublishScheduleModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/PublishingAssignmentModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/PublishingAssignmentModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/PublishingTable.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, types (+2 more) | Repository dependencies | `frontend/features/publishing/components/PublishingTable.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/PublishingWorkflowHeader.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/publishing/components/PublishingWorkflowHeader.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/RecordPublicationModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/RecordPublicationModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/publishing/RetryPlatformModal.tsx` | Publishing packaging & channel tables | Frontend Component | Distribution & Publishing | react, lucide-react, Modal (+3 more) | Repository dependencies | `frontend/features/publishing/components/RetryPlatformModal.tsx` | **FRONTEND** | `MEDIUM` | Publishing component |
| `src/components/questions/QuestionTable.tsx` | Question cards, formula badges, validation chips | Frontend Component | Question Generation & Verification | react, react-router-dom, lucide-react (+4 more) | Repository dependencies | `frontend/features/question-generation/components/QuestionTable.tsx` | **FRONTEND** | `MEDIUM` | Domain question component |
| `src/components/questions/QuestionWorkflowHeader.tsx` | Question cards, formula badges, validation chips | Frontend Component | Question Generation & Verification | react, react-router-dom, lucide-react (+2 more) | Repository dependencies | `frontend/features/question-generation/components/QuestionWorkflowHeader.tsx` | **FRONTEND** | `MEDIUM` | Domain question component |
| `src/components/queue/QueueTable.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+4 more) | Repository dependencies | `frontend/components/QueueTable.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/social/AssetWorkflowHeader.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+2 more) | Repository dependencies | `frontend/components/AssetWorkflowHeader.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/social/SocialReviewWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, types, api-client (+6 more) | Repository dependencies | `frontend/components/SocialReviewWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/EditingWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, lucide-react, types (+2 more) | Repository dependencies | `frontend/components/EditingWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/FinalReviewWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, lucide-react, types (+5 more) | Repository dependencies | `frontend/components/FinalReviewWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/PinnedCommentWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, lucide-react, types (+2 more) | Repository dependencies | `frontend/components/PinnedCommentWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/PublishingWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+3 more) | Repository dependencies | `frontend/components/PublishingWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/RecordingWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, lucide-react, types (+4 more) | Repository dependencies | `frontend/components/RecordingWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/ScriptWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+6 more) | Repository dependencies | `frontend/components/ScriptWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/ThumbnailWorkspace.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+7 more) | Repository dependencies | `frontend/components/ThumbnailWorkspace.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/video/VideoWorkflowHeader.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, react-router-dom, lucide-react (+2 more) | Repository dependencies | `frontend/components/VideoWorkflowHeader.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/workflow/WorkflowActionPanel.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, workflow | Repository dependencies | `frontend/components/WorkflowActionPanel.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/workflow/WorkflowBreadcrumb.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, workflow | Repository dependencies | `frontend/components/WorkflowBreadcrumb.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/workflow/WorkflowStatusBar.tsx` | Domain-specific presentation component | Frontend Component | Domain UI Feature | react, workflow | Repository dependencies | `frontend/components/WorkflowStatusBar.tsx` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/components/workflow/index.ts` | Domain-specific presentation component | Frontend Component | Domain UI Feature | WorkflowBreadcrumb, WorkflowStatusBar, WorkflowActionPanel | Repository dependencies | `frontend/components/index.ts` | **FRONTEND** | `MEDIUM` | Specialized UI component |
| `src/config/constants.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | types | Repository dependencies | `shared/config/constants.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/env.contract.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | None (Self-contained) | Repository dependencies | `shared/config/env.contract.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/env.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | dotenv, path, fs | Repository dependencies | `shared/config/env.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/media-upload.config.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | errors | Repository dependencies | `shared/config/media-upload.config.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/navigation.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | roles | Repository dependencies | `shared/config/navigation.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/question-creation.config.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | types | Repository dependencies | `shared/config/question-creation.config.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/roles.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | types | Repository dependencies | `shared/config/roles.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/config/snapshot.config.ts` | Domain configuration parameters, taxonomies & styles | Configuration | Business & Application Config | None (Self-contained) | Repository dependencies | `shared/config/snapshot.config.ts` | **CONFIGURATION** | `MEDIUM` | Domain rules & configuration objects |
| `src/contexts/AuthContext.tsx` | Global React context providers (Auth, Navigation, State) | Frontend State / Context | State & Session Context | react, types, api-client | Repository dependencies | `frontend/shared/contexts/AuthContext.tsx` | **FRONTEND** | `HIGH` | Client application state provider |
| `src/contexts/ProductionJourneyContext.tsx` | Global React context providers (Auth, Navigation, State) | Frontend State / Context | State & Session Context | react, react-router-dom, types (+3 more) | Repository dependencies | `frontend/shared/contexts/ProductionJourneyContext.tsx` | **FRONTEND** | `HIGH` | Client application state provider |
| `src/design-system/components/Alert.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Alert.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/AppBreadcrumbs.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, react-router-dom (+1 more) | Repository dependencies | `frontend/shared/design-system/AppBreadcrumbs.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Badge.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Badge.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Button.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Button.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Card.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, tokens | Repository dependencies | `frontend/shared/design-system/Card.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/EmptyState.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/EmptyState.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/ErrorState.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/ErrorState.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Form.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens | Repository dependencies | `frontend/shared/design-system/Form.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Icon.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Icon.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Input.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Input.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Loading.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, tokens | Repository dependencies | `frontend/shared/design-system/Loading.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Modal.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Modal.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/PageHeader.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, react-router-dom (+1 more) | Repository dependencies | `frontend/shared/design-system/PageHeader.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Select.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Select.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/StepIndicator.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+2 more) | Repository dependencies | `frontend/shared/design-system/StepIndicator.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/SuccessState.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/SuccessState.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/Table.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, tokens (+1 more) | Repository dependencies | `frontend/shared/design-system/Table.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/components/WorkflowStepNav.tsx` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react, react-router-dom (+4 more) | Repository dependencies | `frontend/shared/design-system/WorkflowStepNav.tsx` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/index.ts` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | tokens, types, Button (+17 more) | Repository dependencies | `frontend/shared/design-system/index.ts` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/tokens.ts` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | None (Self-contained) | Repository dependencies | `frontend/shared/design-system/tokens.ts` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/design-system/types.ts` | Unified design tokens, atomic components & styling | Frontend Design System | Design System | react, lucide-react | Repository dependencies | `frontend/shared/design-system/types.ts` | **FRONTEND** | `LOW` | Design system core tokens and primitives |
| `src/index.css` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `src/index.css` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `src/lib/ai/ai-orchestrator.service.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | ai, types, provider-registry (+8 more) | Repository dependencies | `backend/infrastructure/ai/ai-orchestrator.service.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/config.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | None (Self-contained) | Repository dependencies | `backend/infrastructure/ai/config.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/error.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | None (Self-contained) | Repository dependencies | `backend/infrastructure/ai/error.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/gemini.client.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai | Repository dependencies | `backend/infrastructure/ai/gemini.client.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/gemini.service.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | gemini.client, config, error (+30 more) | Repository dependencies | `backend/infrastructure/ai/gemini.service.ts` | **AI** | `CRITICAL` | Core AI execution engine |
| `src/lib/ai/index.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | types, ai, config (+16 more) | Repository dependencies | `backend/infrastructure/ai/index.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/orchestrator.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | registry, types, config (+3 more) | Repository dependencies | `backend/infrastructure/ai/orchestrator.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/prompts/comment-intelligence.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types | Repository dependencies | `backend/features/ai/prompts/comment-intelligence.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/generation.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types, types | Repository dependencies | `backend/features/ai/prompts/generation.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/performance-intelligence.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | None (Self-contained) | Repository dependencies | `backend/features/ai/prompts/performance-intelligence.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/pinned-comment.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types | Repository dependencies | `backend/features/ai/prompts/pinned-comment.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/platform-adaptation.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types | Repository dependencies | `backend/features/ai/prompts/platform-adaptation.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/refinement.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types, types, generation.prompt | Repository dependencies | `backend/features/ai/prompts/refinement.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/script-generation.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types, types | Repository dependencies | `backend/features/ai/prompts/script-generation.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/social-hook.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types, types | Repository dependencies | `backend/features/ai/prompts/social-hook.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/social-metadata.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | None (Self-contained) | Repository dependencies | `backend/features/ai/prompts/social-metadata.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/social-quality.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types | Repository dependencies | `backend/features/ai/prompts/social-quality.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/teleprompter-script.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types, types | Repository dependencies | `backend/features/ai/prompts/teleprompter-script.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/thumbnail-intelligence.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | types | Repository dependencies | `backend/features/ai/prompts/thumbnail-intelligence.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/prompts/validation.prompt.ts` | Telugu aptitude generation & validation prompts | AI Engine & Prompts | AI Prompts & Directives | None (Self-contained) | Repository dependencies | `backend/features/ai/prompts/validation.prompt.ts` | **AI** | `HIGH` | Feature-specific AI prompt |
| `src/lib/ai/provider-registry.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | ai, gemini.adapter, openrouter.adapter (+6 more) | Repository dependencies | `backend/infrastructure/ai/provider-registry.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/providers/base.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai | Repository dependencies | `backend/infrastructure/ai/providers/base.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/cerebras.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/cerebras.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/cohere.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/cohere.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/experimental-labs.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/experimental-labs.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/gemini.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | genai, ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/gemini.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/groq.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/groq.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/huggingface.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/huggingface.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/mistral.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/mistral.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/openrouter.adapter.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | ai, base.adapter | Repository dependencies | `backend/infrastructure/ai/providers/openrouter.adapter.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/providers/xai.client.ts` | External AI model API adapters (Gemini, OpenAI, Anthropic) | AI Engine & Prompts | AI Provider Adapters | None (Self-contained) | Repository dependencies | `backend/infrastructure/ai/providers/xai.client.ts` | **AI** | `HIGH` | LLM SDK adapter |
| `src/lib/ai/registry.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | types, config | Repository dependencies | `backend/infrastructure/ai/registry.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/comment-intelligence.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai, zod | Repository dependencies | `backend/infrastructure/ai/comment-intelligence.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/performance-intelligence.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai, zod | Repository dependencies | `backend/infrastructure/ai/performance-intelligence.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/pinned-comment.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/pinned-comment.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/platform-adaptation.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai, zod | Repository dependencies | `backend/infrastructure/ai/platform-adaptation.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/question-candidate.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, types | Repository dependencies | `backend/infrastructure/ai/question-candidate.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/script-generation.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/script-generation.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/social-hook.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, types, question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/social-hook.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/social-metadata.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai, zod | Repository dependencies | `backend/infrastructure/ai/social-metadata.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/social-quality.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | genai, zod | Repository dependencies | `backend/infrastructure/ai/social-quality.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/teleprompter-script.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/teleprompter-script.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/thumbnail-intelligence.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | zod, question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/thumbnail-intelligence.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/schemas/validation.schema.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | question-candidate.schema | Repository dependencies | `backend/infrastructure/ai/validation.schema.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/types.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | types, candidate.validator, error (+1 more) | Repository dependencies | `backend/infrastructure/ai/types.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/ai/validators/blind-verifier.ts` | Candidate question structure & pedagogical quality checks | AI Engine & Prompts | AI Quality Gates & Output Validation | types, types, gemini.client (+3 more) | Repository dependencies | `backend/features/question-verification/ai/blind-verifier.ts` | **AI** | `HIGH` | AI response validation engine |
| `src/lib/ai/validators/candidate.validator.ts` | Candidate question structure & pedagogical quality checks | AI Engine & Prompts | AI Quality Gates & Output Validation | question-candidate.schema, types, types (+2 more) | Repository dependencies | `backend/features/question-verification/ai/candidate.validator.ts` | **AI** | `HIGH` | AI response validation engine |
| `src/lib/ai/validators/mathematical.validator.ts` | Candidate question structure & pedagogical quality checks | AI Engine & Prompts | AI Quality Gates & Output Validation | types | Repository dependencies | `backend/features/question-verification/ai/mathematical.validator.ts` | **AI** | `HIGH` | AI response validation engine |
| `src/lib/ai/validators/script.validator.ts` | Candidate question structure & pedagogical quality checks | AI Engine & Prompts | AI Quality Gates & Output Validation | script-generation.schema, script.service | Repository dependencies | `backend/features/question-verification/ai/script.validator.ts` | **AI** | `HIGH` | AI response validation engine |
| `src/lib/ai/validators/semantic-reasoning.provider.ts` | Candidate question structure & pedagogical quality checks | AI Engine & Prompts | AI Quality Gates & Output Validation | types, gemini.client, config | Repository dependencies | `backend/features/question-verification/ai/semantic-reasoning.provider.ts` | **AI** | `HIGH` | AI response validation engine |
| `src/lib/ai/verifier/arbitration.ts` | AI orchestrator, token management & fallback cascades | AI Engine & Prompts | AI Core Infrastructure | types | Repository dependencies | `backend/infrastructure/ai/arbitration.ts` | **AI** | `HIGH` | Core AI execution engine |
| `src/lib/api-client.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | google-sheets-schema, types, types | Repository dependencies | `shared/lib/api-client.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/audit/audit-dispatcher.interface.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | audit | Repository dependencies | `shared/lib/audit-dispatcher.interface.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/audit/firestore-audit.dispatcher.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | googleapis, audit, audit-dispatcher.interface (+4 more) | Repository dependencies | `shared/lib/firestore-audit.dispatcher.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/audit/in-memory-audit.dispatcher.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | audit, audit-dispatcher.interface, id.service (+1 more) | Repository dependencies | `shared/lib/in-memory-audit.dispatcher.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/audit/index.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | repository.interface, audit-dispatcher.interface, firestore-audit.dispatcher (+5 more) | Repository dependencies | `shared/lib/index.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/auth/rbac-evaluator.ts` | Role-based access checks, object ownership & author gates | Security & RBAC | Access Control & Object Security | rbac-models | Repository dependencies | `backend/infrastructure/security/rbac-evaluator.ts` | **BACKEND** | `CRITICAL` | GAR-02 & AP-009 authorization rules |
| `src/lib/data/production-taxonomy.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | types | Repository dependencies | `shared/lib/production-taxonomy.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/db/firestore-converters.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | repository.interface | Repository dependencies | `shared/lib/firestore-converters.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/db/firestore.repository.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | firestore, admin, errors (+5 more) | Repository dependencies | `shared/lib/firestore.repository.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/db/in-memory.repository.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | repository.interface, errors, id.service | Repository dependencies | `shared/lib/in-memory.repository.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/db/index.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | repository.interface, in-memory.repository, firestore.repository | Repository dependencies | `shared/lib/index.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/db/repository.interface.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | None (Self-contained) | Repository dependencies | `shared/lib/repository.interface.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/errors.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | None (Self-contained) | Repository dependencies | `shared/lib/errors.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/firebase/admin.ts` | Firebase Admin initialization & Firestore instance provider | Database Infrastructure | Cloud Firestore SDK Adapter | app, firestore, firebase-applet-config.json | Repository dependencies | `backend/infrastructure/database/firebase/admin.ts` | **DATABASE** | `CRITICAL` | Core database connection |
| `src/lib/firebase/errors.ts` | Firebase Admin initialization & Firestore instance provider | Database Infrastructure | Cloud Firestore SDK Adapter | None (Self-contained) | Repository dependencies | `backend/infrastructure/database/firebase/errors.ts` | **DATABASE** | `CRITICAL` | Core database connection |
| `src/lib/id.service.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | crypto | Repository dependencies | `shared/lib/id.service.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/logger.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | audit | Repository dependencies | `shared/lib/logger.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/ownership/data-ownership.ts` | Role-based access checks, object ownership & author gates | Security & RBAC | Access Control & Object Security | google-sheets-schema | Repository dependencies | `backend/infrastructure/security/data-ownership.ts` | **BACKEND** | `CRITICAL` | GAR-02 & AP-009 authorization rules |
| `src/lib/ownership/index.ts` | Role-based access checks, object ownership & author gates | Security & RBAC | Access Control & Object Security | data-ownership | Repository dependencies | `backend/infrastructure/security/index.ts` | **BACKEND** | `CRITICAL` | GAR-02 & AP-009 authorization rules |
| `src/lib/realtime/event-bus.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | events, realtime-architecture | Repository dependencies | `shared/lib/event-bus.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/repositories/analytics.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/analytics.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/assignments.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/assignments.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/audit-log.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/audit-log.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/base.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | repository.interface, id.service, domain-schemas | Repository dependencies | `backend/infrastructure/repositories/base.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/comment-intelligence.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/comment-intelligence.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/content-batches.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/content-batches.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/content-masters.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types, errors | Repository dependencies | `backend/infrastructure/repositories/content-masters.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/content-plans.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/content-plans.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/index.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, topics.repository, subtopics.repository (+30 more) | Repository dependencies | `backend/infrastructure/repositories/index.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/intelligence.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/intelligence.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/media-assets.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/media-assets.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/pinned-comment-packages.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | types | Repository dependencies | `backend/infrastructure/repositories/pinned-comment-packages.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/pinned-comment-versions.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | pinned-comments.repository | Repository dependencies | `backend/infrastructure/repositories/pinned-comment-versions.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/pinned-comments.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/pinned-comments.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/platform-adaptations.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | types | Repository dependencies | `backend/infrastructure/repositories/platform-adaptations.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/publishing.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/publishing.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/question-config.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/question-config.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/question-drafts.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | types | Repository dependencies | `backend/infrastructure/repositories/question-drafts.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/question-videos.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | videos.repository | Repository dependencies | `backend/infrastructure/repositories/question-videos.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/questions.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, google-sheets-schema, types (+1 more) | Repository dependencies | `backend/infrastructure/repositories/questions.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/refinement-candidates.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | None (Self-contained) | Repository dependencies | `backend/infrastructure/repositories/refinement-candidates.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/script-versions.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | scripts.repository | Repository dependencies | `backend/infrastructure/repositories/script-versions.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/scripts.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/scripts.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/social-comments.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/social-comments.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/social-reviews.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/social-reviews.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/strategy-recommendation.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/strategy-recommendation.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/subtopics.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/subtopics.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/thumbnail-candidates.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | types | Repository dependencies | `backend/infrastructure/repositories/thumbnail-candidates.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/thumbnail-versions.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | thumbnails.repository | Repository dependencies | `backend/infrastructure/repositories/thumbnail-versions.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/thumbnails.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/thumbnails.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/topics.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/topics.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/users.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | audit-log.repository | Repository dependencies | `backend/infrastructure/repositories/users.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/validations.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/validations.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/videos.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/videos.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/repositories/workflow.repository.ts` | Firestore collection CRUD & transactional queries | Database Persistence Layer | Authoritative Data Access | base.repository, types | Repository dependencies | `backend/infrastructure/repositories/workflow.repository.ts` | **DATABASE** | `HIGH` | Authoritative Firestore repository |
| `src/lib/routing/workflow-routes.ts` | API client, canonical ID service, error hierarchy | Shared Infrastructure / Utilities | Core Utilities & Envelopes | None (Self-contained) | Repository dependencies | `shared/lib/workflow-routes.ts` | **SHARED** | `HIGH` | Cross-cutting utility |
| `src/lib/schemas/domain-schemas.ts` | Zod schemas, domain definitions & legacy tab schemas | Data Contracts & Validation Schemas | Data Integrity & Schemas | id.service | Repository dependencies | `shared/schemas/domain-schemas.ts` | **DATABASE** | `HIGH` | Domain schemas |
| `src/lib/schemas/google-sheets-schema.ts` | Zod schemas, domain definitions & legacy tab schemas | Data Contracts & Validation Schemas | Data Integrity & Schemas | zod, types | Repository dependencies | `shared/schemas/google-sheets-schema.ts` | **DATABASE** | `HIGH` | Legacy sheets schema kept for archive restore |
| `src/lib/services/analytics.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | analytics.repository, content-masters.repository, id.service (+2 more) | Repository dependencies | `backend/features/analytics/services/analytics.service.ts` | **BACKEND** | `MEDIUM` | Intelligence & analytics processing |
| `src/lib/services/assignment.service.ts` | User authentication, role assignment & session security | Backend Application Services | Authentication & IAM / RBAC | repositories, id.service, audit.service (+3 more) | Repository dependencies | `backend/infrastructure/auth/services/assignment.service.ts` | **BACKEND** | `CRITICAL` | Security & access control |
| `src/lib/services/audit.service.ts` | Immutable event auditing & forensic tracing | Backend Application Services | Audit & Compliance | repositories, types, errors | Repository dependencies | `backend/infrastructure/audit/services/audit.service.ts` | **BACKEND** | `MEDIUM` | Authoritative audit logger |
| `src/lib/services/auth.service.ts` | User authentication, role assignment & session security | Backend Application Services | Authentication & IAM / RBAC | crypto, users.repository, audit.service (+1 more) | Repository dependencies | `backend/infrastructure/auth/services/auth.service.ts` | **BACKEND** | `HIGH` | Security & access control |
| `src/lib/services/central-authorization.service.ts` | User authentication, role assignment & session security | Backend Application Services | Authentication & IAM / RBAC | rbac-models, rbac-evaluator, frontend-ia | Repository dependencies | `backend/infrastructure/auth/services/central-authorization.service.ts` | **BACKEND** | `MEDIUM` | Security & access control |
| `src/lib/services/comment-intelligence.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | social-comments.repository, comment-intelligence.repository, content-masters.repository (+8 more) | Repository dependencies | `backend/features/analytics/services/comment-intelligence.service.ts` | **BACKEND** | `MEDIUM` | Intelligence & analytics processing |
| `src/lib/services/consensus.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | crypto, consensus, types (+3 more) | Repository dependencies | `backend/infrastructure/services/consensus.service.ts` | **BACKEND** | `HIGH` | General service |
| `src/lib/services/content-master.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | repositories, id.service, types (+7 more) | Repository dependencies | `backend/infrastructure/services/content-master.service.ts` | **BACKEND** | `CRITICAL` | General service |
| `src/lib/services/content-strategy.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | strategy-recommendation.repository, social-performance-intelligence.service, comment-intelligence.repository (+8 more) | Repository dependencies | `backend/infrastructure/services/content-strategy.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/content-workflow.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | repositories, types, errors (+1 more) | Repository dependencies | `backend/infrastructure/services/content-workflow.service.ts` | **BACKEND** | `HIGH` | General service |
| `src/lib/services/copilot.service.ts` | Question authoring, draft persistence & AI assistance | Backend Application Services | Question Generation (Stage 01) | crypto, copilot, types (+4 more) | Repository dependencies | `backend/features/question-generation/services/copilot.service.ts` | **BACKEND** | `CRITICAL` | Core authoring service; depends on repositories & AI |
| `src/lib/services/dashboard.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | repositories, assignment.service, object-auth.service (+2 more) | Repository dependencies | `backend/infrastructure/services/dashboard.service.ts` | **BACKEND** | `CRITICAL` | General service |
| `src/lib/services/data-integrity.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | types, repositories, google-sheets-schema | Repository dependencies | `backend/features/recovery/services/data-integrity.service.ts` | **BACKEND** | `CRITICAL` | High-criticality disaster recovery logic |
| `src/lib/services/deletion-safety.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | fs, path, crypto | Repository dependencies | `backend/infrastructure/services/deletion-safety.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/drive-sync.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | stream, crypto, google-drive.service (+4 more) | Repository dependencies | `backend/infrastructure/services/drive-sync.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/durable-snapshot-archive.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | googleapis, crypto, snapshot.config (+1 more) | Repository dependencies | `backend/features/recovery/services/durable-snapshot-archive.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/firestore-migration.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | node:crypto, types | Repository dependencies | `backend/features/recovery/services/firestore-migration.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/firestore-production-initializer.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | firestore.repository, production-taxonomy, types (+1 more) | Repository dependencies | `backend/features/recovery/services/firestore-production-initializer.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/full-snapshot-preflight.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot-exporter.service, full-snapshot-restore.service, restore-validator.service | Repository dependencies | `backend/features/recovery/services/full-snapshot-preflight.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/full-snapshot-restore-execution.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | node:crypto, snapshot-exporter.service, full-snapshot-preflight.service (+4 more) | Repository dependencies | `backend/features/recovery/services/full-snapshot-restore-execution.service.ts` | **BACKEND** | `HIGH` | High-criticality disaster recovery logic |
| `src/lib/services/full-snapshot-restore-plan.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | node:crypto, snapshot-exporter.service, full-snapshot-preflight.service (+2 more) | Repository dependencies | `backend/features/recovery/services/full-snapshot-restore-plan.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/full-snapshot-restore.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | node:crypto, snapshot-exporter.service, restore-validator.service (+2 more) | Repository dependencies | `backend/features/recovery/services/full-snapshot-restore.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/google-drive.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | googleapis, stream, errors | Repository dependencies | `backend/infrastructure/services/google-drive.service.ts` | **BACKEND** | `HIGH` | General service |
| `src/lib/services/granular-assignment-restore.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/recovery/services/granular-assignment-restore.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/granular-pinned-comment-restore.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/recovery/services/granular-pinned-comment-restore.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/granular-publishing-restore.service.ts` | Package publishing, social adaptations & platform sync | Backend Application Services | Distribution & Publishing (Stages 10-12) | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/publishing/services/granular-publishing-restore.service.ts` | **BACKEND** | `MEDIUM` | Publishing engine & channel adapters |
| `src/lib/services/granular-question-restore.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot-exporter.service, restore-validator.service, repositories (+4 more) | Repository dependencies | `backend/features/recovery/services/granular-question-restore.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/granular-script-restore.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/production/services/granular-script-restore.service.ts` | **BACKEND** | `HIGH` | Media lifecycle services |
| `src/lib/services/granular-thumbnail-restore.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/production/services/granular-thumbnail-restore.service.ts` | **BACKEND** | `MEDIUM` | Media lifecycle services |
| `src/lib/services/granular-video-restore.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | snapshot-exporter.service, restore-validator.service, repositories (+2 more) | Repository dependencies | `backend/features/production/services/granular-video-restore.service.ts` | **BACKEND** | `MEDIUM` | Media lifecycle services |
| `src/lib/services/id.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | id.service, id.service | Repository dependencies | `backend/infrastructure/services/id.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/index.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | id.service, taxonomy.service, question.service (+59 more) | Repository dependencies | `backend/infrastructure/services/index.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/object-auth.service.ts` | User authentication, role assignment & session security | Backend Application Services | Authentication & IAM / RBAC | types, assignments.repository, questions.repository (+2 more) | Repository dependencies | `backend/infrastructure/auth/services/object-auth.service.ts` | **BACKEND** | `HIGH` | Security & access control |
| `src/lib/services/operational-health.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | admin, errors | Repository dependencies | `backend/infrastructure/services/operational-health.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/operational-recovery.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | operational-health.service, audit.service | Repository dependencies | `backend/features/recovery/services/operational-recovery.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/pinned-comment-intelligence.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | types, pinned-comment-packages.repository, pinned-comments.repository (+10 more) | Repository dependencies | `backend/features/analytics/services/pinned-comment-intelligence.service.ts` | **BACKEND** | `HIGH` | Intelligence & analytics processing |
| `src/lib/services/pinned-comment.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | pinned-comments.repository, publishing.repository, videos.repository (+6 more) | Repository dependencies | `backend/infrastructure/services/pinned-comment.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/planning.service.ts` | Content scheduling, diversity radar & duplicate detection | Backend Application Services | Content Strategy & Planning (Stage 00) | content-plans.repository, content-batches.repository, questions.repository (+7 more) | Repository dependencies | `backend/features/planning/services/planning.service.ts` | **BACKEND** | `HIGH` | Planning & similarity service |
| `src/lib/services/platform-adaptation.service.ts` | Package publishing, social adaptations & platform sync | Backend Application Services | Distribution & Publishing (Stages 10-12) | crypto, types, social-invariance.validator (+10 more) | Repository dependencies | `backend/features/publishing/services/platform-adaptation.service.ts` | **BACKEND** | `CRITICAL` | Publishing engine & channel adapters |
| `src/lib/services/production-asset-validation.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | types | Repository dependencies | `backend/infrastructure/services/production-asset-validation.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/production-board.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | types, publishing.service, production-asset-validation.service (+1 more) | Repository dependencies | `backend/infrastructure/services/production-board.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/production-dashboard.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | repositories, object-auth.service, publishing.service (+2 more) | Repository dependencies | `backend/infrastructure/services/production-dashboard.service.ts` | **BACKEND** | `CRITICAL` | General service |
| `src/lib/services/publishing.service.ts` | Package publishing, social adaptations & platform sync | Backend Application Services | Distribution & Publishing (Stages 10-12) | crypto, publishing.repository, social-reviews.repository (+21 more) | Repository dependencies | `backend/features/publishing/services/publishing.service.ts` | **BACKEND** | `CRITICAL` | Publishing engine & channel adapters |
| `src/lib/services/question-config.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | question-config.repository, types, google-sheets-schema | Repository dependencies | `backend/infrastructure/services/question-config.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/question-draft.service.ts` | Question authoring, draft persistence & AI assistance | Backend Application Services | Question Generation (Stage 01) | types, question-drafts.repository, taxonomy.service (+3 more) | Repository dependencies | `backend/features/question-generation/services/question-draft.service.ts` | **BACKEND** | `MEDIUM` | Core authoring service; depends on repositories & AI |
| `src/lib/services/question-refinement.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | repositories, errors, mathematical.validator (+4 more) | Repository dependencies | `backend/infrastructure/services/question-refinement.service.ts` | **BACKEND** | `HIGH` | General service |
| `src/lib/services/question-validation.service.ts` | Question rule validation, equation checks & taxonomy matching | Backend Application Services | Question Verification (Stage 02) | questions.repository, question-drafts.repository, validations.repository (+4 more) | Repository dependencies | `backend/features/question-verification/services/question-validation.service.ts` | **BACKEND** | `MEDIUM` | Authoritative verification service |
| `src/lib/services/question.service.ts` | Question authoring, draft persistence & AI assistance | Backend Application Services | Question Generation (Stage 01) | questions.repository, content-masters.repository, validations.repository (+15 more) | Repository dependencies | `backend/features/question-generation/services/question.service.ts` | **BACKEND** | `CRITICAL` | Core authoring service; depends on repositories & AI |
| `src/lib/services/restore-validator.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | node:crypto, snapshot-exporter.service, google-sheets-schema (+1 more) | Repository dependencies | `backend/features/recovery/services/restore-validator.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/script-production.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | questions.repository, videos.repository, scripts.repository (+6 more) | Repository dependencies | `backend/features/production/services/script-production.service.ts` | **BACKEND** | `HIGH` | Media lifecycle services |
| `src/lib/services/script.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | scripts.repository, videos.repository, questions.repository (+6 more) | Repository dependencies | `backend/features/production/services/script.service.ts` | **BACKEND** | `MEDIUM` | Media lifecycle services |
| `src/lib/services/similarity.service.ts` | Content scheduling, diversity radar & duplicate detection | Backend Application Services | Content Strategy & Planning (Stage 00) | questions.repository, taxonomy.service, types | Repository dependencies | `backend/features/planning/services/similarity.service.ts` | **BACKEND** | `MEDIUM` | Planning & similarity service |
| `src/lib/services/smart-random.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | question-creation.config, taxonomy.service, questions.repository (+3 more) | Repository dependencies | `backend/infrastructure/services/smart-random.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/services/snapshot-exporter.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | None (Self-contained) | Repository dependencies | `backend/features/recovery/services/snapshot-exporter.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/snapshot-history.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot-exporter.service, snapshot.config, durable-snapshot-archive.service | Repository dependencies | `backend/features/recovery/services/snapshot-history.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/snapshot-scheduler.service.ts` | Backup snapshot export, preflight validation & restoration | Backend Application Services | Operational Recovery & Snapshot Engine | snapshot.config, snapshot-history.service, durable-snapshot-archive.service (+1 more) | Repository dependencies | `backend/features/recovery/services/snapshot-scheduler.service.ts` | **BACKEND** | `MEDIUM` | High-criticality disaster recovery logic |
| `src/lib/services/social-comments.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | social-comments.repository, content-masters.repository, id.service (+3 more) | Repository dependencies | `backend/features/analytics/services/social-comments.service.ts` | **BACKEND** | `MEDIUM` | Intelligence & analytics processing |
| `src/lib/services/social-enhancement.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | types, social-invariance.validator, ai-orchestrator.service (+2 more) | Repository dependencies | `backend/features/analytics/services/social-enhancement.service.ts` | **BACKEND** | `HIGH` | Intelligence & analytics processing |
| `src/lib/services/social-performance-intelligence.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | analytics.service, intelligence.repository, id.service (+8 more) | Repository dependencies | `backend/features/analytics/services/social-performance-intelligence.service.ts` | **BACKEND** | `HIGH` | Intelligence & analytics processing |
| `src/lib/services/social-quality-gate.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | crypto, types, content-masters.repository (+12 more) | Repository dependencies | `backend/features/analytics/services/social-quality-gate.service.ts` | **BACKEND** | `HIGH` | Intelligence & analytics processing |
| `src/lib/services/social-quality.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | types, social-invariance.validator, ai-orchestrator.service (+2 more) | Repository dependencies | `backend/features/analytics/services/social-quality.service.ts` | **BACKEND** | `MEDIUM` | Intelligence & analytics processing |
| `src/lib/services/social-review.service.ts` | Social telemetry ingestion, comments, performance scores | Backend Application Services | Social Performance Intelligence (Stages 13-15) | crypto, types, questions.repository (+8 more) | Repository dependencies | `backend/features/analytics/services/social-review.service.ts` | **BACKEND** | `HIGH` | Intelligence & analytics processing |
| `src/lib/services/taxonomy.service.ts` | Topic and Subtopic hierarchy & integrity enforcement | Backend Application Services | Taxonomy Core (2-Tier Topic/Subtopic) | repositories, types, errors (+3 more) | Repository dependencies | `backend/domain/taxonomy/services/taxonomy.service.ts` | **BACKEND** | `HIGH` | Root taxonomy business logic |
| `src/lib/services/thumbnail-intelligence.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | types, thumbnail-candidates.repository, thumbnails.repository (+14 more) | Repository dependencies | `backend/features/production/services/thumbnail-intelligence.service.ts` | **BACKEND** | `HIGH` | Media lifecycle services |
| `src/lib/services/thumbnail.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | thumbnails.repository, videos.repository, questions.repository (+7 more) | Repository dependencies | `backend/features/production/services/thumbnail.service.ts` | **BACKEND** | `HIGH` | Media lifecycle services |
| `src/lib/services/video-production.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | questions.repository, scripts.repository, videos.repository (+7 more) | Repository dependencies | `backend/features/production/services/video-production.service.ts` | **BACKEND** | `HIGH` | Media lifecycle services |
| `src/lib/services/video.service.ts` | Script production, video staging, thumbnail rendering | Backend Application Services | Media & Production (Stages 03-08) | repositories, media-assets.repository, id.service (+13 more) | Repository dependencies | `backend/features/production/services/video.service.ts` | **BACKEND** | `CRITICAL` | Media lifecycle services |
| `src/lib/services/workflow-orchestration.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | types, questions.repository, videos.repository (+9 more) | Repository dependencies | `backend/infrastructure/services/workflow-orchestration.service.ts` | **BACKEND** | `HIGH` | General service |
| `src/lib/services/workflow.service.ts` | Platform orchestration & system lifecycle | Backend Application Services | Cross-Cutting Infrastructure Services | audit.service | Repository dependencies | `backend/infrastructure/services/workflow.service.ts` | **BACKEND** | `MEDIUM` | General service |
| `src/lib/validation/ambiguity.detector.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/ambiguity.detector.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/consensus.engine.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/consensus.engine.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/consistency.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/consistency.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/explanation.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/explanation.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/fairness.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/fairness.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/gemini-validation.provider.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, config, gemini.client (+3 more) | Repository dependencies | `backend/features/question-verification/validation/gemini-validation.provider.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/index.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | interfaces, consensus.engine, question-validation.engine (+2 more) | Repository dependencies | `backend/features/question-verification/validation/index.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/interfaces.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, types | Repository dependencies | `backend/features/question-verification/validation/interfaces.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/mathematical-logical.engine.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/mathematical-logical.engine.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/multi-layer-verification.engine.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, question-creation.validator, taxonomy.service (+10 more) | Repository dependencies | `backend/features/question-verification/validation/multi-layer-verification.engine.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/options.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/options.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validation/question-validation.engine.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, question-creation.validator, taxonomy.service (+9 more) | Repository dependencies | `backend/features/question-verification/validation/question-validation.engine.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/pinned-comment-safety.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/pinned-comment-safety.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/platform-adaptation.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, errors | Repository dependencies | `backend/features/question-verification/validation/platform-adaptation.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/question-creation.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | errors, question-creation.config, types | Repository dependencies | `backend/features/question-verification/validation/question-creation.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/script.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/script.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/social-invariance.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/social-invariance.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/social-quality-gate.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types, thumbnail-safety.validator, pinned-comment-safety.validator | Repository dependencies | `backend/features/question-verification/validation/social-quality-gate.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/validators/thumbnail-safety.validator.ts` | Mathematical verification, LaTeX parsing & question rules | Business Rule Validation | Algorithmic Quality Engine | types | Repository dependencies | `backend/features/question-verification/validation/thumbnail-safety.validator.ts` | **BACKEND** | `HIGH` | Deterministic rule validation |
| `src/lib/workflow/canonical-workflow.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | types | Repository dependencies | `backend/domain/workflow/canonical-workflow.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/index.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | workflow-engine.interface, transition-matrix, workflow-engine (+2 more) | Repository dependencies | `backend/domain/workflow/index.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/media-storage-guard.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | None (Self-contained) | Repository dependencies | `backend/domain/workflow/media-storage-guard.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/transition-matrix.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | workflow | Repository dependencies | `backend/domain/workflow/transition-matrix.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/workflow-engine.interface.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | workflow | Repository dependencies | `backend/domain/workflow/workflow-engine.interface.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/workflow-engine.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | workflow, workflow-engine.interface, transition-matrix (+2 more) | Repository dependencies | `backend/domain/workflow/workflow-engine.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/workflow.repository.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | repository.interface, firestore.repository, workflow (+1 more) | Repository dependencies | `backend/domain/workflow/workflow.repository.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/lib/workflow/workflow.service.ts` | State machine transitions, lifecycle policies & gate rules | Workflow Engine | Canonical 15-Step State Machine | workflow, workflow-engine, workflow.repository (+4 more) | Repository dependencies | `backend/domain/workflow/workflow.service.ts` | **WORKFLOW** | `CRITICAL` | Workflow transition governance |
| `src/main.tsx` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | react, client, App.tsx | Repository dependencies | `src/main.tsx` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `src/pages/AnalyticsExperiencePage.tsx` | Engagement telemetry, analytics & intelligence review | Frontend Presentation | Social Performance Intelligence (Stages 13-15) | react, react-router-dom, lucide-react (+8 more) | Repository dependencies | `frontend/features/analytics/pages/AnalyticsExperiencePage.tsx` | **FRONTEND** | `CRITICAL` | Analytics dashboard & metrics exploration |
| `src/pages/ContentMasterPage.tsx` | Authentication / general presentation | Frontend Presentation | Authentication & Foundation | react, react-router-dom, lucide-react (+8 more) | Repository dependencies | `frontend/features/auth/pages/ContentMasterPage.tsx` | **FRONTEND** | `CRITICAL` | Foundation page |
| `src/pages/DashboardPage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, lucide-react, react-router-dom (+13 more) | Repository dependencies | `frontend/features/operations/pages/DashboardPage.tsx` | **FRONTEND** | `MEDIUM` | Cockpit & workflow coordination view |
| `src/pages/LoginPage.tsx` | Authentication / general presentation | Frontend Presentation | Authentication & Foundation | react, lucide-react, AuthContext | Repository dependencies | `frontend/features/auth/pages/LoginPage.tsx` | **FRONTEND** | `MEDIUM` | Foundation page |
| `src/pages/MyWorkPage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, react-router-dom, types (+7 more) | Repository dependencies | `frontend/features/operations/pages/MyWorkPage.tsx` | **FRONTEND** | `CRITICAL` | Cockpit & workflow coordination view |
| `src/pages/NotFoundPage.tsx` | Authentication / general presentation | Frontend Presentation | Authentication & Foundation | react, react-router-dom, lucide-react (+1 more) | Repository dependencies | `frontend/features/auth/pages/NotFoundPage.tsx` | **FRONTEND** | `MEDIUM` | Foundation page |
| `src/pages/PlanningPage.tsx` | Topic matrix, calendar planning & batch management | Frontend Presentation | Content Strategy & Planning (Stage 00) | react, react-router-dom, lucide-react (+2 more) | Repository dependencies | `frontend/features/planning/pages/PlanningPage.tsx` | **FRONTEND** | `CRITICAL` | Large monolithic page (2,573 lines) |
| `src/pages/PlatformPackagesPage.tsx` | Cross-platform packaging & release staging | Frontend Presentation | Distribution & Publishing (Stages 10-12) | react, react-router-dom, lucide-react (+6 more) | Repository dependencies | `frontend/features/publishing/pages/PlatformPackagesPage.tsx` | **FRONTEND** | `HIGH` | Publishing setup & manifest export |
| `src/pages/ProductionBoardPage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, react-router-dom, lucide-react (+6 more) | Repository dependencies | `frontend/features/operations/pages/ProductionBoardPage.tsx` | **FRONTEND** | `HIGH` | Cockpit & workflow coordination view |
| `src/pages/ProductionTrackerPage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, react-router-dom, lucide-react (+9 more) | Repository dependencies | `frontend/features/operations/pages/ProductionTrackerPage.tsx` | **FRONTEND** | `MEDIUM` | Cockpit & workflow coordination view |
| `src/pages/ProfilePage.tsx` | Authentication / general presentation | Frontend Presentation | Authentication & Foundation | react, lucide-react, PageHeader (+2 more) | Repository dependencies | `frontend/features/auth/pages/ProfilePage.tsx` | **FRONTEND** | `MEDIUM` | Foundation page |
| `src/pages/PublishingPackagePage.tsx` | Cross-platform packaging & release staging | Frontend Presentation | Distribution & Publishing (Stages 10-12) | react, react-router-dom, lucide-react (+5 more) | Repository dependencies | `frontend/features/publishing/pages/PublishingPackagePage.tsx` | **FRONTEND** | `HIGH` | Publishing setup & manifest export |
| `src/pages/PublishingPage.tsx` | Cross-platform packaging & release staging | Frontend Presentation | Distribution & Publishing (Stages 10-12) | react, lucide-react, react-router-dom (+12 more) | Repository dependencies | `frontend/features/publishing/pages/PublishingPage.tsx` | **FRONTEND** | `HIGH` | Publishing setup & manifest export |
| `src/pages/QuestionDetailPage.tsx` | Question inventory & lifecycle inspection | Frontend Presentation | Question Generation & Curation | react, react-router-dom, lucide-react (+12 more) | Repository dependencies | `frontend/features/question-generation/pages/QuestionDetailPage.tsx` | **FRONTEND** | `CRITICAL` | Core question management view |
| `src/pages/QuestionImprovePage.tsx` | Question inventory & lifecycle inspection | Frontend Presentation | Question Generation & Curation | react, react-router-dom, lucide-react (+12 more) | Repository dependencies | `frontend/features/question-generation/pages/QuestionImprovePage.tsx` | **FRONTEND** | `HIGH` | Core question management view |
| `src/pages/QuestionLibraryPage.tsx` | Question inventory & lifecycle inspection | Frontend Presentation | Question Generation & Curation | react, react-router-dom, lucide-react (+8 more) | Repository dependencies | `frontend/features/question-generation/pages/QuestionLibraryPage.tsx` | **FRONTEND** | `MEDIUM` | Core question management view |
| `src/pages/QuestionStudioPage.tsx` | AI & manual question authoring workspace | Frontend Presentation | Question Generation (Stage 01) | react, react-router-dom, lucide-react (+10 more) | Repository dependencies | `frontend/features/question-generation/pages/QuestionStudioPage.tsx` | **FRONTEND** | `CRITICAL` | Monolithic page (1,686 lines); coupled to validation and AI |
| `src/pages/QuestionVerifyApprovePage.tsx` | Mathematical & pedagogical question verification | Frontend Presentation | Question Verification (Stage 02) | react, react-router-dom, lucide-react (+13 more) | Repository dependencies | `frontend/features/question-verification/pages/QuestionVerifyApprovePage.tsx` | **FRONTEND** | `CRITICAL` | Monolithic page (1,239 lines); triggers validation on load |
| `src/pages/QueuePage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, react-router-dom, lucide-react (+8 more) | Repository dependencies | `frontend/features/operations/pages/QueuePage.tsx` | **FRONTEND** | `MEDIUM` | Cockpit & workflow coordination view |
| `src/pages/RecoveryAdminPage.tsx` | Full & granular snapshot recovery console | Frontend Presentation | Operational Reliability & Recovery | react, lucide-react, PageHeader (+4 more) | Repository dependencies | `frontend/features/recovery/pages/RecoveryAdminPage.tsx` | **FRONTEND** | `CRITICAL` | Monolithic recovery console (2,055 lines) |
| `src/pages/SettingsPage.tsx` | Platform settings, IAM & health monitoring | Frontend Presentation | System Administration & Settings | react, react-router-dom, lucide-react (+9 more) | Repository dependencies | `frontend/features/settings/pages/SettingsPage.tsx` | **FRONTEND** | `CRITICAL` | Monolithic settings console (1,974 lines) |
| `src/pages/SocialAnalyticsPage.tsx` | Engagement telemetry, analytics & intelligence review | Frontend Presentation | Social Performance Intelligence (Stages 13-15) | react, react-router-dom, lucide-react (+5 more) | Repository dependencies | `frontend/features/analytics/pages/SocialAnalyticsPage.tsx` | **FRONTEND** | `CRITICAL` | Analytics dashboard & metrics exploration |
| `src/pages/SocialReviewPage.tsx` | Authentication / general presentation | Frontend Presentation | Authentication & Foundation | react, react-router-dom, lucide-react (+6 more) | Repository dependencies | `frontend/features/auth/pages/SocialReviewPage.tsx` | **FRONTEND** | `HIGH` | Foundation page |
| `src/pages/TeamOperationsPage.tsx` | Workflow cockpit, queue tracking & task dispatch | Frontend Presentation | Executive & Workflow Operations | react, react-router-dom, types (+6 more) | Repository dependencies | `frontend/features/operations/pages/TeamOperationsPage.tsx` | **FRONTEND** | `CRITICAL` | Cockpit & workflow coordination view |
| `src/pages/VideoCreateScriptPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, types (+7 more) | Repository dependencies | `frontend/features/production/pages/VideoCreateScriptPage.tsx` | **FRONTEND** | `MEDIUM` | Production pipeline workspace |
| `src/pages/VideoDetailPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+18 more) | Repository dependencies | `frontend/features/production/pages/VideoDetailPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/pages/VideoEditPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+12 more) | Repository dependencies | `frontend/features/production/pages/VideoEditPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/pages/VideoFinalPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+10 more) | Repository dependencies | `frontend/features/production/pages/VideoFinalPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/pages/VideoPinnedCommentPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+10 more) | Repository dependencies | `frontend/features/production/pages/VideoPinnedCommentPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/pages/VideoRecordPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+12 more) | Repository dependencies | `frontend/features/production/pages/VideoRecordPage.tsx` | **FRONTEND** | `CRITICAL` | Production pipeline workspace |
| `src/pages/VideoReviewScriptPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+10 more) | Repository dependencies | `frontend/features/production/pages/VideoReviewScriptPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/pages/VideoThumbnailPage.tsx` | Video filming, scripting, editing, thumbnail creation | Frontend Presentation | Media & Production (Stages 03-08) | react, react-router-dom, lucide-react (+10 more) | Repository dependencies | `frontend/features/production/pages/VideoThumbnailPage.tsx` | **FRONTEND** | `HIGH` | Production pipeline workspace |
| `src/server/health.routes.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, google-drive.service | Repository dependencies | `backend/server/health.routes.ts` | **BACKEND** | `CRITICAL` | Monolithic 7,329-line Express route multiplexer |
| `src/server/middleware/auth.middleware.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, auth.service, users.repository (+4 more) | Repository dependencies | `backend/server/auth.middleware.ts` | **BACKEND** | `CRITICAL` | Server entry point |
| `src/server/middleware/error.middleware.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, zod, errors (+1 more) | Repository dependencies | `backend/server/error.middleware.ts` | **BACKEND** | `CRITICAL` | Server entry point |
| `src/server/middleware/request-id.middleware.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, crypto | Repository dependencies | `backend/server/request-id.middleware.ts` | **BACKEND** | `CRITICAL` | Server entry point |
| `src/server/middleware/validation.middleware.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, zod, errors (+1 more) | Repository dependencies | `backend/server/validation.middleware.ts` | **BACKEND** | `CRITICAL` | Server entry point |
| `src/server/routes.ts` | Express server setup, route dispatch & HTTP middleware | Backend HTTP Server & Routes | REST API Gateway | express, services, question-draft.service (+36 more) | Repository dependencies | `backend/server/routes.ts` | **BACKEND** | `CRITICAL` | Monolithic 7,329-line Express route multiplexer |
| `src/types/ai-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, rbac-models | Repository dependencies | `shared/types/ai-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/ai.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | None (Self-contained) | Repository dependencies | `shared/types/ai.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/analytics-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/analytics-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/api-contracts.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, rbac-models, state-models (+2 more) | Repository dependencies | `shared/types/api-contracts.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/audit-observability.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, rbac-models | Repository dependencies | `shared/types/audit-observability.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/audit.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/audit.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/consensus.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | ai, types | Repository dependencies | `shared/types/consensus.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/copilot.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | ai, index | Repository dependencies | `shared/types/copilot.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/cost-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/cost-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/data-contracts.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/data-contracts.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/database-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | rbac-models | Repository dependencies | `shared/types/database-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/dependency-graph.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/dependency-graph.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/deployment-release.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/deployment-release.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/domain-models.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | None (Self-contained) | Repository dependencies | `shared/types/domain-models.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/frontend-ia.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | rbac-models | Repository dependencies | `shared/types/frontend-ia.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/index.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | ai, ai, consensus (+11 more) | Repository dependencies | `shared/types/index.ts` | **SHARED** | `CRITICAL` | Gigantic 3,237-line monolithic type registry |
| `src/types/job-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, state-models, realtime-architecture | Repository dependencies | `shared/types/job-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/media-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/media-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/migration-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod | Repository dependencies | `shared/types/migration-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/rbac-models.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | None (Self-contained) | Repository dependencies | `shared/types/rbac-models.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/realtime-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, rbac-models | Repository dependencies | `shared/types/realtime-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/route-contracts.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | rbac-models, frontend-ia | Repository dependencies | `shared/types/route-contracts.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/security-architecture.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, rbac-models, api-contracts | Repository dependencies | `shared/types/security-architecture.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/state-models.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | None (Self-contained) | Repository dependencies | `shared/types/state-models.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/types/workflow.ts` | TypeScript data contracts & domain model interfaces | Shared Types / Contracts | Cross-Cutting Contracts | zod, repository.interface, rbac-models | Repository dependencies | `shared/types/workflow.ts` | **SHARED** | `HIGH` | Domain type specification |
| `src/utils/formatters.ts` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | types | Repository dependencies | `src/utils/formatters.ts` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `tests/architecture-sheets-decoupling.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert, node:fs, node:path (+9 more) | Repository dependencies | `tests/integration/architecture-sheets-decoupling.test.ts` | **TEST** | `HIGH` | System integration test |
| `tests/backend-firestore-integration.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert, firestore.repository, repository.interface (+3 more) | Repository dependencies | `tests/integration/backend-firestore-integration.test.ts` | **TEST** | `HIGH` | System integration test |
| `tests/browser-direct-write-denied.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert, app, firestore (+1 more) | Repository dependencies | `tests/integration/browser-direct-write-denied.test.ts` | **TEST** | `HIGH` | System integration test |
| `tests/fc-001-auth.test.ts` | Foundation capability test suite | Testing | Quality Assurance & Gates | node:assert, node:http, express (+6 more) | Repository dependencies | `tests/foundation/fc-001-auth.test.ts` | **TEST** | `HIGH` | Core FC regression test |
| `tests/fc-002-rbac.test.ts` | Foundation capability test suite | Testing | Quality Assurance & Gates | node:assert, node:http, express (+16 more) | Repository dependencies | `tests/foundation/fc-002-rbac.test.ts` | **TEST** | `HIGH` | Core FC regression test |
| `tests/fc-003-db-api.test.ts` | Foundation capability test suite | Testing | Quality Assurance & Gates | assert, http, express (+9 more) | Repository dependencies | `tests/foundation/fc-003-db-api.test.ts` | **TEST** | `HIGH` | Core FC regression test |
| `tests/fc-004-audit.test.ts` | Foundation capability test suite | Testing | Quality Assurance & Gates | assert, http, express (+11 more) | Repository dependencies | `tests/foundation/fc-004-audit.test.ts` | **TEST** | `HIGH` | Core FC regression test |
| `tests/fc-005-workflow.test.ts` | Foundation capability test suite | Testing | Quality Assurance & Gates | node:assert, node:http, express (+10 more) | Repository dependencies | `tests/foundation/fc-005-workflow.test.ts` | **TEST** | `HIGH` | Core FC regression test |
| `tests/firestore-rules.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert, app, firestore (+2 more) | Repository dependencies | `tests/integration/firestore-rules.test.ts` | **TEST** | `HIGH` | System integration test |
| `tests/fixtures/synthetic-test-fixtures.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | None (Self-contained) | Repository dependencies | `tests/integration/fixtures/synthetic-test-fixtures.ts` | **TEST** | `HIGH` | System integration test |
| `tests/real-application-path.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert, central-authorization.service, rbac-models (+4 more) | Repository dependencies | `tests/integration/real-application-path.test.ts` | **TEST** | `HIGH` | System integration test |
| `tests/s2-t05-browser.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | puppeteer-core, node:assert | Repository dependencies | `tests/regression/s2-t05-browser.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s2-t05-golden-path.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, auth.service | Repository dependencies | `tests/regression/s2-t05-golden-path.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s2-t06-persistence.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | strict, node:child_process, puppeteer-core (+2 more) | Repository dependencies | `tests/regression/s2-t06-persistence.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s2-t07-smoke.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:child_process, node:path | Repository dependencies | `tests/regression/s2-t07-smoke.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s3-t01-rbac-override.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, rbac-models, rbac-evaluator (+1 more) | Repository dependencies | `tests/regression/s3-t01-rbac-override.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s3-t05-live-override.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert | Repository dependencies | `tests/regression/s3-t05-live-override.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s3-t11-regression-suite.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, rbac-models, rbac-evaluator (+1 more) | Repository dependencies | `tests/regression/s3-t11-regression-suite.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s3-t14-routing-state-gate.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, workflow-routes, canonical-workflow (+1 more) | Repository dependencies | `tests/regression/s3-t14-routing-state-gate.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s4-15-step-persistence.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, firestore.repository, admin (+1 more) | Repository dependencies | `tests/regression/s4-15-step-persistence.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s4-e2e-real-application-path.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, node:http, express (+5 more) | Repository dependencies | `tests/regression/s4-e2e-real-application-path.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s4-gate1-production-routing.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, node:http, express (+6 more) | Repository dependencies | `tests/regression/s4-gate1-production-routing.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s4-gate3-id-sequences.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, id.service, admin | Repository dependencies | `tests/regression/s4-gate3-id-sequences.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s4-t10-firestore-persistence.test.ts` | Historical sprint gate & persistence test | Testing | Quality Assurance & Gates | node:assert, firestore.repository, repository.interface (+4 more) | Repository dependencies | `tests/regression/s4-t10-firestore-persistence.test.ts` | **TEST** | `MEDIUM` | Sprint regression suite |
| `tests/s5-two-tier-taxonomy.test.ts` | Sprint 5 2-tier taxonomy test | Testing | Quality Assurance & Gates | node:assert, domain-schemas, id.service (+5 more) | Repository dependencies | `tests/regression/s5/s5-two-tier-taxonomy.test.ts` | **TEST** | `HIGH` | Topic -> Subtopic regression test |
| `tests/s6-no-sequence-architecture.test.ts` | Sprint 6 zero-sequence regression test | Testing | Quality Assurance & Gates | node:assert, node:fs, node:path (+9 more) | Repository dependencies | `tests/regression/s6/s6-no-sequence-architecture.test.ts` | **TEST** | `HIGH` | Canonical UUID & 0-sequence verification |
| `tests/s6-real-runtime-e2e.test.ts` | Sprint 6 zero-sequence regression test | Testing | Quality Assurance & Gates | node:assert, admin, taxonomy.service (+13 more) | Repository dependencies | `tests/regression/s6/s6-real-runtime-e2e.test.ts` | **TEST** | `HIGH` | Canonical UUID & 0-sequence verification |
| `tests/uat-remediation.test.ts` | Integration or architecture verification | Testing | Quality Assurance & Gates | node:assert | Repository dependencies | `tests/integration/uat-remediation.test.ts` | **TEST** | `HIGH` | System integration test |
| `tsconfig.json` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | None (Self-contained) | Repository dependencies | `tsconfig.json` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |
| `vite.config.ts` | Build tool config, package manager lock, container definition | Project Configuration / Environment | Build & Runtime Tooling | vite, plugin-react, path (+1 more) | Repository dependencies | `vite.config.ts` | **CONFIGURATION** | `MEDIUM` | Root build / configuration file |


---

## 3. Business Feature & Domain Ownership Mapping

The BP-CMS platform maps directly to the canonical 15-step Telugu educational content lifecycle, supported by cross-cutting technical foundations:

### 3.1 Canonical 15-Step Production Pipeline
1. **Stage 00 — Content Planning & Strategy**: Owned by `PlanningPage.tsx`, `planning.service.ts`, `content-strategy.service.ts`, `similarity.service.ts`.
2. **Stage 01 — Question Generation (Studio)**: Owned by `QuestionStudioPage.tsx`, `question.service.ts`, `question-draft.service.ts`, `copilot.service.ts`, `gemini.service.ts`.
3. **Stage 02 — Question Verification & Approval**: Owned by `QuestionVerifyApprovePage.tsx`, `question-validation.service.ts`, `candidate.validator.ts`, `mathematical.validator.ts`.
4. **Stage 03 — Audience Script Generation**: Owned by `VideoCreateScriptPage.tsx`, `script.service.ts`, `script-production.service.ts`.
5. **Stage 04 — Teleprompter & Filming Prep**: Owned by `VideoRecordPage.tsx`, `video-production.service.ts`.
6. **Stage 05 — Raw Video Footage & Multitake**: Owned by `VideoRecordPage.tsx`, `media-asset.service.ts`, `drive-integration.service.ts`.
7. **Stage 06 — Post-Production Editing**: Owned by `VideoEditPage.tsx`, `video.service.ts`.
8. **Stage 07 — Final QC & Editorial Review**: Owned by `VideoFinalPage.tsx`, `VideoReviewScriptPage.tsx`.
9. **Stage 08 — High-CTR Thumbnail Generation**: Owned by `VideoThumbnailPage.tsx`, `thumbnail.service.ts`, `gemini-thumbnail.service.ts`.
10. **Stage 09 — Pinned Comment Engagement Staging**: Owned by `VideoPinnedCommentPage.tsx`, `pinned-comment.service.ts`.
11. **Stage 10 — Social Review & Compliance**: Owned by `SocialReviewPage.tsx`, `review.service.ts`.
12. **Stage 11 — Publishing Package Setup**: Owned by `PublishingPackagePage.tsx`, `PublishingPage.tsx`, `publishing.service.ts`.
13. **Stage 12 — Channel Release & Broadcast**: Owned by `publishing.service.ts`, `youtube-oauth.service.ts`.
14. **Stage 13 — Platform Synchronization**: Owned by `PlatformPackagesPage.tsx`, `platform-adaptation.service.ts`.
15. **Stage 14 — Performance Analytics**: Owned by `SocialAnalyticsPage.tsx`, `AnalyticsExperiencePage.tsx`, `analytics.service.ts`.
16. **Stage 15 — Intelligence Loop & Retrospective**: Owned by `comment-intelligence.service.ts`, `social-performance-intelligence.service.ts`.

### 3.2 Cross-Cutting Technical Domains
- **Authentication & IAM**: `auth.service.ts`, `user.service.ts`, `LoginPage.tsx`, `AuthContext.tsx`.
- **Authorization & RBAC**: `src/lib/auth/role-capability-matrix.ts`, `src/lib/ownership/object-auth.service.ts`.
- **Immutable Auditing**: `src/lib/audit/audit.service.ts`, `audit-logs.repository.ts`.
- **Canonical 15-Step Workflow State Machine**: `src/lib/workflow/workflow-engine.service.ts`, `src/types/state-model.ts`.
- **Authoritative Data Persistence**: `src/lib/firebase/admin.ts`, `src/lib/repositories/*`.
- **Stateless Canonical Identity**: `src/lib/id.service.ts` (RFC 4122 v4 UUID with 26 typed prefixes).
- **Disaster Recovery & Snapshots**: `RecoveryAdminPage.tsx`, `snapshot-history.service.ts`, `full-snapshot-restore-execution.service.ts`.

---

## 4. Cross-Feature Coupling & Undesirable Dependencies Audit

Forensic inspection revealed multiple severe boundary violations and coupling bottlenecks:

### 4.1 Boundary Violation Category 1: Frontend Directly Importing Backend AI Validators
❌ **Architectural Violation**: Three client pages import backend validator classes and verification engines directly:
1. `src/pages/QuestionStudioPage.tsx:52-53`:
   ```typescript
   import { CandidateValidator, CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
   import { MathVerificationResult } from '../lib/ai/validators/mathematical.validator';
   ```
2. `src/pages/QuestionDetailPage.tsx:37`:
   ```typescript
   import { CandidateValidator, CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
   ```
3. `src/pages/QuestionImprovePage.tsx:29`:
   ```typescript
   import { CandidateValidator, CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
   ```
*Impact*: The client bundle pulls heavy backend validation logic, Node/server-specific helper dependencies, and bypasses the HTTP API Gateway.

### 4.2 Boundary Violation Category 2: Frontend Directly Importing Backend Services
❌ **Architectural Violation**:
1. `src/components/publishing/PublishingTable.tsx:35`:
   ```typescript
   import { ProductionAssetValidationService } from '../../lib/services/production-asset-validation.service';
   ```
2. `src/pages/PlanningPage.tsx:67`:
   ```typescript
   import { DiversityRadarReport, QuestionSimilarityMatch } from '../lib/services/similarity.service';
   ```
3. `src/pages/SettingsPage.tsx:43-44`:
   ```typescript
   import { OperationalHealthReport } from '../lib/services/operational-health.service';
   import { OperationalRecoveryState } from '../lib/services/operational-recovery.service';
   ```
4. `src/pages/ContentMasterPage.tsx:43`:
   ```typescript
   import { ContentMasterDetails } from '../lib/services/content-master.service';
   ```
*Impact*: Data structures and domain models defined inside backend service implementations leak into UI components. Frontend code becomes directly coupled to server service code.

### 4.3 Boundary Violation Category 3: The 7,329-Line Monolithic API Multiplexer (`src/server/routes.ts`)
❌ **Architectural Violation**: Every domain feature is multiplexed through a single 7,329-line file containing over 140 REST route definitions.
*Impact*: Any change to Question Generation, Video Production, Recovery, or Analytics modifies the same gigantic file, creating merge conflicts, cognitive overload, and cross-team interference.

### 4.4 Boundary Violation Category 4: The 3,237-Line Monolithic Type Registry (`src/types/index.ts`)
⚠️ **Coupling Bottleneck**: All application types across all 15 stages are lumped into a single file with 3,237 lines.
*Impact*: Changes to publishing types re-trigger typechecks for questions; backend-only interfaces pollute frontend autocomplete; circular dependencies arise easily.

### 4.5 Boundary Violation Category 5: Inter-Feature Service Entanglement
⚠️ **Coupling Bottleneck**:
- `video.service.ts` directly invokes `scriptService.createScript()` and `thumbnailService.createThumbnail()`.
- `planning.service.ts` directly calls `similarityService.checkDiversityRadar()`.
- `question.service.ts` directly references video production initiation.
*Impact*: Features cannot be tested or deployed in isolation without instantiating the entire dependency web.

---

## 5. Current Architectural Boundaries Audit

| Architectural Boundary | A. What Should It Be? | B. What Is It Today? | C. Concrete Current Violations |
|:---|:---|:---|:---|
| **Frontend / Backend Boundary** | Clean HTTP / JSON separation via `apiClient` against REST endpoints. Zero direct service or validator imports. | 95% clean via `apiClient`, but 9 direct imports of backend validators and services remain in client pages. | `QuestionStudioPage.tsx` imports `CandidateValidator`; `PublishingTable.tsx` imports `ProductionAssetValidationService`. |
| **API Gateway Boundary** | Modular, feature-scoped route controllers (`routes/questions.ts`, `routes/media.ts`, etc.) using common middleware. | Single monolithic `routes.ts` file (7,329 lines) defining 140+ endpoints inline. | Monolithic router containing business logic, inline Zod parsing, and direct repository queries. |
| **Service Layer Boundary** | Domain services handle use-case logic only; cross-feature calls use events or mediation. | Services directly import other services across unrelated domains. | `question.service.ts` imports `video.service.ts`; `publishing.service.ts` imports 8 other domain services. |
| **Repository Boundary** | Repositories perform raw Firestore CRUD and queries; zero business logic. | Generally clean, but some repositories contain domain normalization and status mapping. | `questions.repository.ts` contains custom filtering heuristics and complex transformations. |
| **Database / Firestore Boundary** | Database access exclusively via `admin.ts` through repository interfaces. | Clean: 0 client-side Firestore SDK imports. All database writes go through server repositories. | Clean boundary: No browser-direct database writes. |
| **AI Boundary** | AI modules accept generic prompts/parameters and return structured JSON. Human-in-the-loop review mandatory (AP-009). | Cleanly adheres to AP-009 human gate, but prompt files are scattered and candidate validator is imported into frontend. | AI validation logic imported on client side (`QuestionStudioPage`). |
| **Workflow Boundary** | Centralized state engine enforces 15-step transitions and authorization (GAR-02). | Strongly enforced via `workflow-engine.service.ts` and `role-capability-matrix.ts`. | Minor: UI components occasionally duplicate transition eligibility checks locally. |
| **Shared Code Boundary** | Contains only pure TypeScript types, interfaces, schemas, and isomorphic utilities. | `src/types/index.ts` contains backend-only database record shapes and Sheets legacy fields. | Legacy spreadsheet types and backend-specific interfaces located in shared types. |

---

## 6. Deep Frontend Architecture Forensic Analysis

### 6.1 Audit of Key Monolithic Pages
| Page | Line Count | Primary Responsibility | API Endpoints Invoked | State & Validation Imports | Critical Coupling Risks | Target Domain |
|:---|:---|:---|:---|:---|:---|:---|
| **`PlanningPage.tsx`** | 2,573 | Content matrix, batch planning, topic distribution | 0 (Imports `similarity.service`!) | Local state, complex matrix tables | Monolithic table; direct service type import; no modular components | Content Strategy & Planning |
| **`RecoveryAdminPage.tsx`** | 2,055 | Full and granular snapshot backup & recovery console | 8 endpoints (`/system/recovery/*`) | Preflight state, diff viewer | Giant single-file console; includes diffing, checksums, logs | Operational Reliability & Recovery |
| **`SettingsPage.tsx`** | 1,974 | System settings, IAM, taxonomy administration | 13 endpoints (`/system/*`, `/auth/*`) | Multi-tab state, operational health | Giant settings tab monolith; imports backend service types | System Administration |
| **`QuestionStudioPage.tsx`** | 1,686 | AI question generation & manual authoring | 8 endpoints (`/questions/*`, `/ai/*`) | Candidate validator, math validator | Directly imports backend AI validator; save/verify sequential coupling | Question Generation (Stage 01) |
| **`SocialAnalyticsPage.tsx`** | 1,614 | Performance metrics, engagement telemetry | 9 endpoints (`/analytics/*`) | Chart state, filter grids | Monolithic dashboard with complex visualizations | Social Performance Intelligence |
| **`ContentMasterPage.tsx`** | 1,393 | Unified 15-step master record audit & view | 4 endpoints (`/content-master/*`) | Master detail state | Monolithic detail view; imports backend service types | Content Operations |
| **`QuestionVerifyApprovePage.tsx`** | 1,239 | Authoritative verification & editorial approval | 9 endpoints (`/questions/:id/validate`) | Validation engine accordion, modals | Triggers auto-validation on mount; tight UI coupling with Studio | Question Verification (Stage 02) |
| **`VideoRecordPage.tsx`** | 1,130 | Teleprompter, camera preview, multitake recording | 8 endpoints (`/videos/*`, `/media/*`) | Video stream state, take manager | Media hardware and workflow logic mixed in one file | Raw Video & Filming (Stage 05) |
| **`QuestionLibraryPage.tsx`** | 479 | Question inventory, filters & search | 4 endpoints (`/questions`) | Search/filter state | Modular; good baseline structure | Question Curation |
| **`DashboardPage.tsx`** | 371 | Executive cockpit & pipeline status | 6 endpoints (`/dashboard/*`) | Bento grid state | Well-structured bento cockpit | Operations Cockpit |

---

## 7. Deep Backend Architecture Forensic Analysis

### 7.1 Analysis of `src/lib/services/` (69 Services)
The `src/lib/services/` directory is the most overloaded directory in the repository. It concentrates 69 services totaling **38,400+ lines of code**.

#### Top 10 Heaviest Services
1. **`publishing.service.ts`** (2,172 lines): Overloaded with YouTube uploads, multi-platform packaging, asset verification, and metadata generation.
2. **`data-integrity.service.ts`** (1,727 lines): Contains extensive database diagnostic heuristics, cross-collection relationship verification, and foreign key validators.
3. **`assignment.service.ts`** (1,468 lines): Manages team assignment dispatch, workload limits, capability checks, and notifications.
4. **`dashboard.service.ts`** (1,375 lines): Aggregates vitals across all 15 stages, computing stale content metrics, team bottlenecks, and pipeline throughput.
5. **`platform-adaptation.service.ts`** (1,347 lines): Handles Telugu Unicode ZWJ grapheme cluster extraction, hashtag optimization, and character counting across YouTube, Instagram, and X.
6. **`copilot.service.ts`** (1,240 lines): Orchestrates real-time Gemini AI assistance during question writing.
7. **`full-snapshot-restore-execution.service.ts`** (537 lines): Executes multi-collection transactional restoration in strict topological order.
8. **`question.service.ts`** (1,062 lines): Core question lifecycle, schema validation, and state progression.
9. **`video.service.ts`** (1,032 lines): Video record management, status progression, and asset linkages.
10. **`similarity.service.ts`** (942 lines): Vector-like cosine similarity and n-gram overlap detection for questions.

---

## 8. Deep Database & Persistence Architecture Forensic Analysis

### 8.1 Critical Distinction: Infrastructure vs Business Domain Logic
| Category | File Examples | Architectural Role | Proposed Location |
|:---|:---|:---|:---|
| **Database Infrastructure** | `src/lib/firebase/admin.ts`<br>`src/lib/firebase/config.ts`<br>`firestore.rules` | Low-level SDK connection, Firebase credentials, security rules | `backend/infrastructure/database/` |
| **Authoritative Repositories** | `questions.repository.ts`<br>`videos.repository.ts`<br>`topics.repository.ts`<br>`audit-logs.repository.ts` | Collection-scoped CRUD, batch writes, query filters | `backend/infrastructure/repositories/` |
| **Business Logic with DB Access** | `question.service.ts`<br>`workflow-engine.service.ts`<br>`similarity.service.ts` | Domain use-cases, status state machines, rule validation | `backend/features/<domain>/services/` |
| **Data Contracts / Schemas** | `domain-schemas.ts`<br>`google-sheets-schema.ts` | Zod payload validators, collection constants, archive schemas | `shared/schemas/` |

---

## 9. Deep AI Architecture Forensic Analysis

### 9.1 Global AI Infrastructure vs Feature-Specific AI Modules
| Category | Files | Responsibility | Target Location |
|:---|:---|:---|:---|
| **Global AI Infrastructure** | `src/lib/ai/gemini.service.ts`<br>`src/lib/ai/providers/registry.ts`<br>`src/lib/ai/providers/gemini.provider.ts`<br>`src/lib/ai/errors.ts` | SDK wrappers, API key rotation, error retry cascades, token limits | `backend/infrastructure/ai/` |
| **Question Generation AI** | `src/lib/ai/prompts/generation.prompt.ts`<br>`src/lib/ai/prompts/explanation.prompt.ts`<br>`src/lib/ai/orchestrator.ts` | Telugu aptitude question prompting, schema guidance, difficulty settings | `backend/features/question-generation/ai/` |
| **Question Verification AI** | `src/lib/ai/validators/candidate.validator.ts`<br>`src/lib/ai/validators/mathematical.validator.ts`<br>`src/lib/ai/validators/telugu-language.validator.ts` | Automated mathematical equation solving, Telugu grammar checks, distractor quality | `backend/features/question-verification/ai/` |
| **Thumbnail & Media AI** | `src/lib/services/gemini-thumbnail.service.ts`<br>`src/lib/ai/prompts/thumbnail.prompt.ts` | Thumbnail prompt crafting, visual composition guidelines | `backend/features/production/ai/` |

---

## 10. Deep Shared Types Analysis (`src/types/`)

### 10.1 Classification of Types
- **Truly Shared (Frontend & Backend)**:
  - `Question`, `Topic`, `Subtopic`, `Video`, `Script`, `Thumbnail`, `User`, `UserRole`, `WorkflowStage`
  - `ApiResponseEnvelope<T>`, `ValidationResult`
- **Backend-Only Types (Currently in shared location)**:
  - `GoogleSheetsSnapshot`, `SpreadsheetHealthReport`, `DriveFolderStructure`
  - Database persistence schemas, internal transaction tokens
- **Frontend-Only Types**:
  - UI tab state, modal visibility interfaces, component props
- **Dead / Obsolete Types**:
  - Legacy Google Sheets sequence verification fields (`sequencesConfigured`, `missingSequences`) — already cleaned in Sprint 6.

---

## 11. Deep Test Architecture Analysis (28 Test Files)

| Test Category | Files | Scope | External Dependencies | Target Directory |
|:---|:---|:---|:---|:---|
| **Foundation Capability (FC)** | `tests/fc-001-auth.test.ts`<br>`tests/fc-002-rbac.test.ts`<br>`tests/fc-003-db-api.test.ts`<br>`tests/fc-004-audit.test.ts`<br>`tests/fc-005-workflow.test.ts` | Core auth, authorization, audit, and workflow guarantees | Local mocks & Express server | `tests/foundation/` |
| **Sprint 6 Zero-Sequence Regression** | `tests/s6-no-sequence-architecture.test.ts`<br>`tests/s6-real-runtime-e2e.test.ts` | Proves 0 sequence documents and canonical UUID generation | Live Firestore & source tree | `tests/regression/sprint-06/` |
| **Sprint 5 2-Tier Taxonomy Regression** | `tests/s5-two-tier-taxonomy.test.ts` | Proves Topic -> Subtopic direct hierarchy | Source tree & seed data | `tests/regression/sprint-05/` |
| **Decoupling & Database Architecture** | `tests/architecture-sheets-decoupling.test.ts`<br>`tests/s4-t10-firestore-persistence.test.ts`<br>`tests/backend-firestore-integration.test.ts` | Verifies complete decoupling from Sheets and authoritative Firestore persistence | Live Firestore | `tests/integration/database/` |
| **Security & Routing Gates** | `tests/firestore-rules.test.ts`<br>`tests/browser-direct-write-denied.test.ts`<br>`tests/s4-gate1-production-routing.test.ts` | Proves security rules deny unauthorized client writes | Firebase rules emulator | `tests/security/` |

---

## 12. Deep Documentation Analysis (62 Documents)

| Document Category | Count | Status | Notes |
|:---|:---|:---|:---|
| **Authoritative Architecture (ADRs)** | 27 | **Current Source of Truth** | Includes ADR 25 (2-Tier Taxonomy) and ADR 26 (Collision-Resistant UUID Canonical IDs) |
| **Feature Domain Contracts** | 23 | **Current Source of Truth** | Feature requirements and acceptance criteria |
| **Historical Execution Reports** | 8 | **Historical Record** | Phase 1 through Phase 8 completion reports |
| **Historical Spikes & Baselines** | 4 | **Historical Record** | `FIREBASE-ARCHITECTURE-SPIKE.md`, `ENVIRONMENT-BASELINE.md` |

---

## 13. Legacy & Delete Candidates

The following 13 files in `src/` are currently unreferenced by any other production code or test:

1. `src/components/common/LoadingState.tsx` (Superseded by `src/design-system/components/LoadingSpinner.tsx`)
2. `src/components/common/TechnicalDetails.tsx` (Orphaned debug component)
3. `src/components/dashboard/ChannelPerformanceSection.tsx` (Deprecated dashboard widget)
4. `src/components/dashboard/DailyWorkflowGuide.tsx` (Deprecated widget)
5. `src/components/dashboard/DashboardFilterBar.tsx` (Replaced by inline filters)
6. `src/components/dashboard/PipelineVisualizer.tsx` (Replaced by Executive Vitals Bento)
7. `src/components/dashboard/StaleContentSection.tsx` (Orphaned widget)
8. `src/components/dashboard/TodaysWorkSection.tsx` (Replaced by MyWorkPage)
9. `src/components/publishing/PublishingTable.tsx` (Orphaned; violates boundary by importing backend validation service)
10. `src/lib/ai/providers/xai.client.ts` (Unused experimental X.AI provider adapter)
11. `src/lib/ai/verifier/arbitration.ts` (Unused arbitration helper)
12. `src/lib/services/firestore-migration.service.ts` (One-time migration script from Phase 4)
13. `src/types/database-architecture.ts` (Unused redundant type interfaces)

> [!NOTE]
> Per S7-T01 instructions, **NO files have been deleted**. These are logged as candidates for future cleanup in S7-T02+.

---

## 14. Features Requiring Future Isolation

| Feature / Module | Coupling Severity | Priority | Key Isolation Goal |
|:---|:---|:---|:---|
| **Question Generation (Stage 01)** | Direct client import of AI validators, save/verify navigation coupling | **CRITICAL** | Decouple save from verify; extract client-side AI validator imports to HTTP API. |
| **REST API Gateway (`routes.ts`)** | 7,329-line monolithic router containing all endpoints | **CRITICAL** | Split into feature routers (`questions.router.ts`, `media.router.ts`, etc.). |
| **Question Verification (Stage 02)** | Auto-validation triggers on mount, blocking navigation | **HIGH** | Make verification explicitly requested; display decoupled status badges. |
| **Content Strategy & Planning** | 2,573-line page, direct service type imports | **HIGH** | Break into matrix, calendar, and batch subcomponents. |
| **Disaster Recovery Engine** | 2,055-line recovery admin page, monolithic plan service | **HIGH** | Split UI into granular vs full restore components; decouple plan generation. |
| **Media Production (Video / Script / Thumbnail)** | Inter-service calls (`videoService` calling `scriptService`) | **MEDIUM** | Standardize inter-feature communication via orchestration facade. |
| **Social Performance Intelligence** | 1,614-line analytics page, heavy telemetry calculation | **MEDIUM** | Separate telemetry ingestion from analytics visualization. |

---

## 15. Question Generation Current Architecture (Deep Forensic Map)

### 15.1 End-to-End Workflow Flow
```
[QuestionStudioPage.tsx] (UI)
        │
        ▼ (1) Load Taxonomy & Config
[apiClient.getTopics() / getSubtopics()] ──► [GET /api/topics, /api/subtopics] ──► [TaxonomyService] ──► [Firestore: topics, subtopics]
        │
        ▼ (2) AI Generation Request
[apiClient.generateQuestionCandidate()] ──► [POST /api/ai/generate-question] ──► [GeminiService / CopilotService] ──► [Gemini 2.5 API]
        │
        ▼ (3) Candidate Pre-Validation
[CandidateValidator.validate()] (⚠️ Client-side direct import violation)
        │
        ▼ (4) User Reviews / Edits
[CandidateCard / QuestionStudioForm]
        │
        ▼ (5) Save Draft
[apiClient.saveQuestionDraft()] ──► [POST /api/questions/draft] ──► [QuestionDraftService.saveDraft()] ──► [Firestore: question_drafts]
        │
        ▼ (6) Immediate Browser Navigation (⚠️ Coupling Trigger)
[navigate('/questions/:id/verify')]
        │
        ▼ (7) Verify Page Auto-Mounts
[QuestionVerifyApprovePage.tsx] ──► [useEffect: loadQuestionAndVerify()]
        │
        ▼ (8) Authoritative Validation Engine Executed
[apiClient.validateQuestion()] ──► [POST /api/questions/:id/validate] ──► [QuestionValidationService] ──► [QuestionValidationEngine]
```

### 15.2 Step-by-Step Function & Dependency Trace
1. **Topic & Subtopic Loading**:
   - UI: `QuestionStudioPage.tsx:useEffect`
   - API Client: `apiClient.getTopics()`, `apiClient.getSubtopics(topicId)`
   - Route: `GET /api/topics`, `GET /api/subtopics` in `src/server/routes.ts`
   - Service: `taxonomyService.getTopics()`, `taxonomyService.getSubtopicsByTopicId(topicId)`
   - Repository: `topicsRepository.findAll()`, `subtopicsRepository.findByTopicId()`
   - DB: Firestore collections `topics` and `subtopics`.
2. **Configuration & Context Loading**:
   - Loaded from `src/config/question-creation.config.ts` (`QUESTION_STYLE_CONFIGS`, `CHALLENGE_TYPES`, `DIFFICULTY_LEVELS`).
3. **AI Candidate Generation**:
   - UI: `handleGenerateClick()` in `QuestionStudioPage.tsx:660`
   - API Client: `apiClient.generateQuestionCandidate(request)`
   - Route: `POST /api/ai/generate-question`
   - Service: `geminiService.generateQuestion()` using `src/lib/ai/prompts/generation.prompt.ts`
   - External: Google Gemini API (`gemini-2.5-flash`).
4. **Candidate Validation (Client-Side Violation)**:
   - UI directly invokes `CandidateValidator.validate(candidate)` imported from `src/lib/ai/validators/candidate.validator.ts`.
5. **Draft Saving**:
   - UI: `handleSaveAndContinue()` in `QuestionStudioPage.tsx:887`
   - API Client: `apiClient.saveQuestionDraft(payload)` in `src/lib/api-client.ts:360`
   - Route: `POST /api/questions/draft` in `src/server/routes.ts:1368`
   - Service: `questionDraftService.saveDraft(input, actor)` in `src/lib/services/question-draft.service.ts:72`
   - Repository: `questionDraftsRepository.create(draft)` in `src/lib/repositories/question-drafts.repository.ts`
   - DB: Firestore collection `question_drafts` (status: `DRAFT`, ID format: `BP-DFT-######-XXXX`).
6. **Navigation to Verification**:
   - UI: `navigate('/questions/' + savedDraft.id + '/verify')` in `QuestionStudioPage.tsx:941`.

---

## 16. Forensic Root Cause: The Save vs Verify Coupling Problem

### 16.1 Reported User Symptom
> *"Manually entered data should push to DB without issues, but the application linked it to verification and reported verification failure even though data was stored."*

### 16.2 Forensic Trace & Mechanism
1. **The Save Operation Succeeded**:
   When the user clicked "Save Draft & Continue", the server executed `questionDraftService.saveDraft()`. The draft was **successfully written to Cloud Firestore** in the `question_drafts` collection with status `DRAFT`.
2. **Forced Sequential Navigation**:
   `QuestionStudioPage.tsx` does not possess an independent "Save Draft" button that confirms save and remains on the page. Line 941 immediately forces navigation to the verification page:
   ```typescript
   navigate(`/questions/${savedDraft.id}/verify`);
   ```
3. **Automatic Validation Trigger on Mount**:
   When `QuestionVerifyApprovePage.tsx` mounts, lines 185–232 execute:
   ```typescript
   useEffect(() => {
     if (activeQuestionId) {
       loadQuestionAndVerify(activeQuestionId);
     }
   }, [activeQuestionId]);
   ```
4. **Authoritative Engine Reports Strict Quality Failures**:
   `loadQuestionAndVerify` immediately calls:
   ```typescript
   const valRes = await apiClient.validateQuestion(qId);
   ```
   `QuestionValidationEngine` runs strict algorithmic checks (formula syntax, option length balance, distractor plausibility, Telugu orthography). If any check fails, the page renders red error alerts, warning badges, and disables approval.
5. **User Perception & Confusion**:
   Because the UI gave no separate confirmation for the save and instantly presented validation error banners, the user naturally concluded: *"The save failed."* In reality, the save **succeeded**, but the UI coupled draft persistence directly to authoritative gate verification.

---

## 17. Target Architecture & Migration Structure Map

To achieve complete feature isolation where every capability is independently understandable, changeable, and testable, the codebase will be reorganized into modular feature domains:

```
CURRENT STRUCTURE                             TARGET MODULAR STRUCTURE
─────────────────                             ────────────────────────
src/pages/QuestionStudioPage.tsx       ──►    frontend/features/question-generation/pages/QuestionStudioPage.tsx
src/pages/QuestionVerifyApprovePage.tsx ──►    frontend/features/question-verification/pages/QuestionVerifyPage.tsx
src/pages/PlanningPage.tsx             ──►    frontend/features/planning/pages/PlanningPage.tsx
src/pages/RecoveryAdminPage.tsx        ──►    frontend/features/recovery/pages/RecoveryAdminPage.tsx
src/pages/SettingsPage.tsx             ──►    frontend/features/settings/pages/SettingsPage.tsx
src/server/routes.ts (7,329 lines)      ──►    backend/features/question-generation/question-generation.router.ts
                                       ──►    backend/features/question-verification/question-verification.router.ts
                                       ──►    backend/features/production/production.router.ts
                                       ──►    backend/features/publishing/publishing.router.ts
                                       ──►    backend/features/analytics/analytics.router.ts
                                       ──►    backend/features/recovery/recovery.router.ts
src/lib/services/question.service.ts   ──►    backend/features/question-generation/services/question.service.ts
src/lib/services/question-draft.service ──►   backend/features/question-generation/services/question-draft.service.ts
src/lib/services/question-validation.* ──►    backend/features/question-verification/services/question-validation.service.ts
src/lib/ai/prompts/generation.prompt.ts ──►    backend/features/question-generation/ai/generation.prompt.ts
src/lib/ai/validators/candidate.*       ──►    backend/features/question-verification/ai/candidate.validator.ts
src/lib/repositories/questions.*       ──►    backend/infrastructure/repositories/questions.repository.ts
src/lib/firebase/admin.ts              ──►    backend/infrastructure/database/firebase/admin.ts
src/lib/workflow/workflow-engine.*     ──►    backend/domain/workflow/workflow-engine.service.ts
src/types/index.ts (3,237 lines)       ──►    shared/types/domain/ (split by feature domain)
```

---

## 18. Human-Readable Architectural Dependency Graph

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT LAYER                           │
│  [QuestionStudioPage]  [QuestionVerifyPage]  [PlanningPage]  [Cockpit] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ✅ allowed (HTTP JSON API)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                              │
│                    [Modular Express Routers]                           │
│               [Authentication & RBAC Middleware]                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ✅ allowed (Use-Case Dispatch)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND APPLICATION SERVICES                       │
│    [QuestionService]   [ValidationService]   [ProductionService]       │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               │ ✅ allowed         │ ✅ allowed         │ ✅ allowed
               ▼                    ▼                    ▼
┌──────────────────────┐ ┌─────────────────────┐ ┌───────────────────────┐
│     DOMAIN LAYER     │ │   AI ORCHESTRATION  │ │     STATE MACHINE     │
│ [2-Tier Taxonomy]    │ │ [Gemini Service]    │ │ [Workflow Engine]     │
│ [Question Rules]     │ │ [Prompt Templates]  │ │ [GAR-02 Anti-Self]    │
└──────────────┬───────┘ └──────────┬──────────┘ └───────────┬───────────┘
               │                    │                        │
               └────────────────────┼────────────────────────┘
                                    │ ✅ allowed (Data Access)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE & REPOSITORY LAYER                       │
│               [Repositories] ──► [Admin Firestore SDK]                 │
│               [Audit Logger] ──► [Cloud Storage / GCS]                 │
└────────────────────────────────────────────────────────────────────────┘

COUPLED DEPENDENCIES IDENTIFIED FOR ELIMINATION:
❌ QuestionStudioPage ──► CandidateValidator (Client directly importing backend AI validator)
❌ PublishingTable ──► ProductionAssetValidationService (Client importing backend service)
❌ Monolithic routes.ts (7,329 lines connecting all features simultaneously)
❌ Sequential navigation coupling between Save Draft and Authoritative Verification
```

---

## 19. S7-T02 Input: Architecture Boundary & Target Folder Decisions

The following explicit decisions must be made in task **S7-T02**:
1. **Target Folder Hierarchy Standard**: Finalize directory structure (`frontend/features/*`, `backend/features/*`, `shared/*`, `backend/infrastructure/*`).
2. **Router Decomposition Architecture**: Define standard for splitting `src/server/routes.ts` into feature routers mounted by a central Express gateway.
3. **Decoupled Question Generation Architecture**: Standardize the separation between "Save Draft" (persistence confirmation without navigation) and "Verify & Proceed" (explicit user-initiated transition).
4. **Client-Side AI Validator Elimination**: Move all candidate validation behind `POST /api/questions/validate-candidate` and remove `CandidateValidator` imports from frontend pages.
5. **Shared Types Modularization**: Determine the package/folder breakdown for splitting `src/types/index.ts` into domain-specific contract files.
6. **Feature Migration Sequence**: Establish the safe, incremental migration order starting with Question Generation as the first isolated slice.

---

## 20. Conclusion & Verification

- **Total Tracked Files Inventoried**: 480 files (100% complete).
- **Production Source Changes**: **0 files modified** (Pure forensic read-only analysis).
- **Database Status**: Untouched; zero Firestore changes.
- **Git Status**: Fully synchronized with `origin/main`.
