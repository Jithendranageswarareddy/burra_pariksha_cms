# Burra Pariksha CMS (BP-CMS) — Documentation Architecture & Navigation Index

Welcome to the central documentation index for the Burra Pariksha Content Management System (BP-CMS). This index establishes the canonical information architecture, defining the boundaries between active system specifications and historical sprint records.

---

## 1. Documentation Structure & Directory Purpose

The BP-CMS documentation is organized into clear, purpose-driven directories:

```text
docs/
├── README.md             # Canonical documentation navigation index & governance rules
├── architecture/         # Current, authoritative system architecture, models, and ADRs
├── burrapariksha-content-planning/ # Canonical content excellence baseline & planning
├── features/             # Current feature contracts (FC-001 through FC-022) & index
├── operations/           # Environment contracts, Git sync protocols, and developer runbooks
├── api/                  # Canonical API specifications & usage documentation (target location)
├── pages/                # Canonical page/UX contracts & route specifications (target location)
└── sprints/              # Historical sprint records, audits, logs, and task deliverables
    ├── sprint-01/        # Sprint 1 baseline audits & initial modernization artifacts
    ├── sprint-02/        # Sprint 2 system stabilization & golden path cleanup maps
    ├── sprint-03/        # Sprint 3 RBAC models, backlogs, and Firebase architecture spike
    ├── sprint-04/        # Sprint 4 Cloud Firestore migration baselines, registry, and gates
    ├── sprint-05/        # Sprint 5 operational records (directory placeholder)
    ├── sprint-06/        # Sprint 6 operational records (directory placeholder)
    └── sprint-07/        # Sprint 7 architecture baseline, forensic inventory, and refactoring tasks
```

| Directory | Authority Level | Primary Responsibility |
| :--- | :--- | :--- |
| `docs/architecture/` | **Authoritative (Current)** | System boundary, domain models, 15-step workflow, database architecture, security, state models, UUID entity IDs, 2-tier taxonomy, and ADRs. |
| `docs/burrapariksha-content-planning/` | **Authoritative (Current)** | Canonical product, editorial, audience-insight, and AI foundation; canonical content modes (`TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, `QUESTION_CHALLENGE_SHORT`). |
| `docs/features/` | **Authoritative (Current)** | Feature contracts (`FC-001` through `FC-022`) governing behavioral invariants, stage logic, and cross-stage contracts. |
| `docs/operations/` | **Authoritative (Current)** | Runtime environment secrets, configuration contracts, Git synchronization protocols, and developer workstation procedures. |
| `docs/api/` | **Authoritative (Current)** | REST API endpoint contracts, request/response payload schemas, and client usage guides (backed by `architecture/15-API-CONTRACT.md`). |
| `docs/pages/` | **Authoritative (Current)** | Canonical page routes, workspace responsibilities, deep links, and UI behavior contracts (backed by `architecture/11-PAGE-ROUTE-CONTRACT.md`). |
| `docs/sprints/` | **Historical (Traceability Only)** | Point-in-time sprint plans, task deliverables, forensically captured audit logs, historical spikes, and acceptance evidence. |

---

## 2. Source-of-Truth Hierarchy & Governance Rules

When technical specifications, codebase patterns, or documentation conflict, Antigravity and all contributors MUST follow the strict **Source-of-Truth Hierarchy** established in `AGENTS.md`:

1. **Verified Working Production Code and Automated Tests**: Establish actual runtime behavior and current operational reality.
2. **Current Authoritative Architecture Documents and Active Architecture Decisions**: Define intended system architecture, structural rules, domain models, and invariants:
   - Canonical 15-Step Workflow: [07-CANONICAL-15-STEP-WORKFLOW.md](architecture/07-CANONICAL-15-STEP-WORKFLOW.md)
   - Cloud Firestore Datastore Architecture: [12-DATABASE-ARCHITECTURE.md](architecture/12-DATABASE-ARCHITECTURE.md)
   - Two-Tier Taxonomy Architecture: [25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)
   - Collision-Resistant UUID Canonical IDs: [26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md](architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md)
   - Active Architecture Decision Log: [DECISION-LOG.md](architecture/DECISION-LOG.md)
   - Core Architecture Specifications: [04-ARCHITECTURE-PRINCIPLES.md](architecture/04-ARCHITECTURE-PRINCIPLES.md) through [26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md](architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md)
3. **Current Feature, API, Page, and Operational Contracts**: Define behavior within their respective scopes and must remain strictly consistent with the architecture:
   - Feature Contracts: [FEATURE-CONTRACT-INDEX.md](features/FEATURE-CONTRACT-INDEX.md) (`FC-001` through `FC-022`)
   - API Contracts: [15-API-CONTRACT.md](architecture/15-API-CONTRACT.md) and `docs/api/`
   - Page & Route Contracts: [11-PAGE-ROUTE-CONTRACT.md](architecture/11-PAGE-ROUTE-CONTRACT.md) and `docs/pages/`
   - Operational Runbooks: [ENVIRONMENT-CONTRACT.md](operations/ENVIRONMENT-CONTRACT.md), [GIT-SYNC-PROTOCOL.md](operations/GIT-SYNC-PROTOCOL.md), [LOCAL-ENVIRONMENT-SETUP.md](operations/LOCAL-ENVIRONMENT-SETUP.md)
4. **Historical Sprint Records**: Provide provenance, implementation evidence, and audit logs; they must not override current authoritative documents:
   - Sprint 7 Architecture Baseline ([S7-ARCHITECTURE-BASELINE.md](sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md)): Preserved as an immutable historical structural audit and implementation baseline; it does not outrank current architecture contracts.
   - Historical Sprint Archives: `docs/sprints/sprint-01/` through `docs/sprints/sprint-07/` (past sprint plans, task reports, forensic inventories, historical spikes).

### Conflict Resolution Axiom: Observed Runtime Behavior vs. Intended Architecture
When observed runtime behavior or codebase patterns conflict with intended architecture:
1. **Document the Discrepancy**: Explicitly identify and record the conflict and its scope.
2. **Preserve Verified Facts**: Do not invent false claims about runtime behavior.
3. **Follow the Approved Current Architecture**: Implement fixes and align code with the authoritative architecture and contracts rather than silently treating an implementation defect, legacy relic, or unintentional bug as the desired design.

### Precedence Axiom
> **Current Architecture ALWAYS Overrides Historical Records.**
> Documents housed under `docs/sprints/` are immutable historical records maintained strictly for provenance and auditability. Outdated architectural assumptions inside historical files (e.g., Google Sheets persistence, categories, sequence-based IDs) must **NEVER** be revived or treated as active system requirements.

### Future Documentation Policy
- **New Architecture & ADRs**: Place in `docs/architecture/` using the sequential numbering format or descriptive ADR format.
- **New Feature Specifications**: Place in `docs/features/` with corresponding `FC-###` identifiers.
- **New Product & Content Baselines**: Place in `docs/burrapariksha-content-planning/`.
- **New Operational Runbooks**: Place in `docs/operations/`.
- **New Sprint Deliverables / Task Reports**: Place under the designated sprint directory in `docs/sprints/sprint-XX/`.

---

## 3. Current Authoritative Specifications

### 3.0 Feature Page Contracts

The implementation-grounded contracts for all 15 workflow pages are indexed in
[docs/page-contracts/README.md](page-contracts/README.md). The reusable section
order is defined by [FEATURE-PAGE-CONTRACT-TEMPLATE.md](page-contracts/FEATURE-PAGE-CONTRACT-TEMPLATE.md).

### 3.1 Core Architecture & System Contracts (`docs/architecture/`)
- [04-ARCHITECTURE-PRINCIPLES.md](architecture/04-ARCHITECTURE-PRINCIPLES.md) — 14 Core Architectural Principles (AP-001 through AP-014).
- [05-TARGET-SYSTEM-BOUNDARY.md](architecture/05-TARGET-SYSTEM-BOUNDARY.md) — System boundaries, external interfaces, and security perimeter.
- [06-DOMAIN-MODEL.md](architecture/06-DOMAIN-MODEL.md) — Universal domain model, entities, and lifecycle states.
- [07-CANONICAL-15-STEP-WORKFLOW.md](architecture/07-CANONICAL-15-STEP-WORKFLOW.md) — Authoritative 15-step question-to-video production workflow.
- [08-STATE-MODEL.md](architecture/08-STATE-MODEL.md) — State machine transitions, invariants, and separation axioms.
- [09-RBAC-CAPABILITY-MODEL.md](architecture/09-RBAC-CAPABILITY-MODEL.md) — 8-tier role-based access control and capability matrix.
- [10-FRONTEND-INFORMATION-ARCHITECTURE.md](architecture/10-FRONTEND-INFORMATION-ARCHITECTURE.md) — Information architecture, navigation taxonomy, and breadcrumbs.
- [11-PAGE-ROUTE-CONTRACT.md](architecture/11-PAGE-ROUTE-CONTRACT.md) — 1:1 Page-to-route contracts, workspace URLs, and parameter schemas.
- [12-DATABASE-ARCHITECTURE.md](architecture/12-DATABASE-ARCHITECTURE.md) — Cloud Firestore persistence layer, collection schemas, and indexes.
- [13-DATA-MODEL-DATA-CONTRACT.md](architecture/13-DATA-MODEL-DATA-CONTRACT.md) — Low-level data contracts, JSON envelopes, and optimistic concurrency.
- [14-MEDIA-ARCHITECTURE.md](architecture/14-MEDIA-ARCHITECTURE.md) — Google Drive media storage, chunked uploads, and thumbnail pipeline.
- [15-API-CONTRACT.md](architecture/15-API-CONTRACT.md) — Authoritative `/api/v1` REST API contract and response envelopes.
- [16-REALTIME-ARCHITECTURE.md](architecture/16-REALTIME-ARCHITECTURE.md) — Event-bus pub/sub and SSE real-time update channels.
- [17-JOB-ASYNC-ARCHITECTURE.md](architecture/17-JOB-ASYNC-ARCHITECTURE.md) — Asynchronous background processing, worker queues, and retries.
- [18-AI-ARCHITECTURE.md](architecture/18-AI-ARCHITECTURE.md) — Google Gemini provider boundary and assistive AI pipeline.
- [19-SECURITY-ARCHITECTURE.md](architecture/19-SECURITY-ARCHITECTURE.md) — HMAC session authentication, token handling, and defense-in-depth rules.
- [20-ANALYTICS-ARCHITECTURE.md](architecture/20-ANALYTICS-ARCHITECTURE.md) — Multi-platform performance ingestion, telemetry deciles, and metrics.
- [21-AUDIT-OBSERVABILITY.md](architecture/21-AUDIT-OBSERVABILITY.md) — Immutable append-only audit trail and operational telemetry.
- [22-COST-ARCHITECTURE.md](architecture/22-COST-ARCHITECTURE.md) — Zero-cost infrastructure governance and Spark free-tier quotas.
- [23-MIGRATION-ARCHITECTURE.md](architecture/23-MIGRATION-ARCHITECTURE.md) — Strangler-fig migration patterns and legacy decommissioning.
- [24-TEST-ARCHITECTURE.md](architecture/24-TEST-ARCHITECTURE.md) — Automated testing matrix, quality gates, and verification suites.
- [25-IMPLEMENTATION-DEPENDENCY-GRAPH.md](architecture/25-IMPLEMENTATION-DEPENDENCY-GRAPH.md) — Structural dependency DAG across stages.
- [25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md) — Authoritative Topic → Subtopic 2-tier taxonomy (Category decommissioned).
- [26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md](architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md) — Distributed UUID-based entity identifiers (`<prefix>_<uuid_v4>`).
- [DECISION-LOG.md](architecture/DECISION-LOG.md) — Authoritative Architecture Decision Log (ADR-001 through ADR-007).

### 3.2 Operations Runbooks & Protocols (`docs/operations/`)
- [ENVIRONMENT-CONTRACT.md](operations/ENVIRONMENT-CONTRACT.md) — Canonical 8 production secrets and runtime environment variable topology.
- [GIT-SYNC-PROTOCOL.md](operations/GIT-SYNC-PROTOCOL.md) — Strict AI Studio ↔ GitHub Git synchronization protocol and divergence resolution.
- [LOCAL-ENVIRONMENT-SETUP.md](operations/LOCAL-ENVIRONMENT-SETUP.md) — Local development environment setup, dependencies, and execution guide.

### 3.3 Feature Contracts (`docs/features/`)
- [FEATURE-CONTRACT-INDEX.md](features/FEATURE-CONTRACT-INDEX.md) — Master index of all 22 feature contracts.
- Stage Foundation Contracts: `FC-001` (Identity), `FC-002` (RBAC), `FC-003` (Database API), `FC-004` (Audit), `FC-005` (Workflow Engine).
- Production Stage Contracts: `FC-006` (Question Studio) through `FC-016` (Platform Release Sync).
- System Infrastructure Contracts: `FC-017` (Job Queue) through `FC-022` (Strangler Migration).

### 3.4 Product and Content Principles (`docs/burrapariksha-content-planning/`)
- [01-content-excellence-baseline.md](burrapariksha-content-planning/01-content-excellence-baseline.md) — **Burra Pariksha Content Excellence Baseline**: Canonical product, editorial, audience-insight, AI, quality, and governance foundation for future CMS development. Governs canonical content modes (`TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, `QUESTION_CHALLENGE_SHORT`), comment-first qualitative intelligence, correctness pre-publication quality gates, and 25 non-negotiable principles.
- [02-content-modes-specification.md](burrapariksha-content-planning/02-content-modes-specification.md) — **Burra Pariksha Canonical Content Modes Specification**: Mode-specific expectations, purposes, structures, quality checks, failure conditions, acceptance criteria, and AI assistance boundaries for the three canonical modes (`TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, `QUESTION_CHALLENGE_SHORT`), mode selection matrices, and comment-driven improvement loops.

---

## 4. Historical Sprint Archive (`docs/sprints/`)

The `docs/sprints/` directory houses sprint plans, task execution logs, point-in-time forensic audits, and acceptance verification artifacts:

### [sprint-01/](sprints/sprint-01/) — Foundation & Baseline Audits
- [02-BUSINESS-ACCEPTANCE-CRITERIA.md](sprints/sprint-01/02-BUSINESS-ACCEPTANCE-CRITERIA.md) — Stage 02 initial business acceptance baseline (2026-10-04).
- [03-CURRENT-SYSTEM-BASELINE.md](sprints/sprint-01/03-CURRENT-SYSTEM-BASELINE.md) — Stage 03 brownfield as-built forensic audit.
- [SPRINT-1-BASELINE.md](sprints/sprint-01/SPRINT-1-BASELINE.md) — Sprint 1 existing implementation baseline report.

### [sprint-02/](sprints/sprint-02/) — System Stabilization & Golden Path
- [S2-T04-ARCHITECTURE-ROUTE-CLEANUP-MAP.md](sprints/sprint-02/S2-T04-ARCHITECTURE-ROUTE-CLEANUP-MAP.md) — Sprint 2 forensic route audit & cleanup map.

### [sprint-03/](sprints/sprint-03/) — RBAC & Firebase Architecture Spike
- [FIREBASE-ARCHITECTURE-SPIKE.md](sprints/sprint-03/FIREBASE-ARCHITECTURE-SPIKE.md) — ADR-018 Firebase operational data platform architecture spike.
- [S3-BACKLOG.md](sprints/sprint-03/S3-BACKLOG.md) — Sprint 3 product and engineering backlog.

### [sprint-04/](sprints/sprint-04/) — Production Datastore Migration (Cloud Firestore)
- [CURRENT-SPRINT.md](sprints/sprint-04/CURRENT-SPRINT.md) — Sprint 4 execution status and repair ledger.
- [PROJECT-CONTROL.md](sprints/sprint-04/PROJECT-CONTROL.md) — Sprint 4 project control state and live verification proof.
- [S4-T01-DATABASE-MIGRATION-BASELINE.md](sprints/sprint-04/S4-T01-DATABASE-MIGRATION-BASELINE.md) — Database migration baseline and abstraction inventory.
- [S4-T03-FIRESTORE-COLLECTION-REGISTRY.md](sprints/sprint-04/S4-T03-FIRESTORE-COLLECTION-REGISTRY.md) — Sprint 4 entity-to-collection mapping registry.
- [S4-T11-ANALYTICS-DATASTORE-DECISION.md](sprints/sprint-04/S4-T11-ANALYTICS-DATASTORE-DECISION.md) — Analytics datastore architecture decision record.
- [S4-T12-PRODUCTION-READINESS-GATE.md](sprints/sprint-04/S4-T12-PRODUCTION-READINESS-GATE.md) — Production readiness gate acceptance report.

### [sprint-05/](sprints/sprint-05/) & [sprint-06/](sprints/sprint-06/)
- Preserved directory structures for historical sprint sequence continuity.

### [sprint-07/](sprints/sprint-07/) — Architecture Reorganization & Feature Isolation
- [S7-ARCHITECTURE-BASELINE.md](sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md) — Authoritative structural and modular baseline for Sprint 7.
- [S7-REMEDIATION-ACCEPTANCE-REPORT.md](sprints/sprint-07/S7-REMEDIATION-ACCEPTANCE-REPORT.md) — Remediation audit report for Sprint 7 tasks S7-T01 to S7-T09.
- [S7-T01-REPOSITORY-FORENSIC-INVENTORY.md](sprints/sprint-07/S7-T01-REPOSITORY-FORENSIC-INVENTORY.md) — Complete repository forensic file ownership manifest.
- [S7-T07-DATABASE-SEPARATION.md](sprints/sprint-07/S7-T07-DATABASE-SEPARATION.md) — Database isolation architecture and separation boundaries.
- [S7-T08-SHARED-CONTRACTS.md](sprints/sprint-07/S7-T08-SHARED-CONTRACTS.md) — Pure isomorphic shared contracts specification.
- [S7-T09-AI-ISOLATION.md](sprints/sprint-07/S7-T09-AI-ISOLATION.md) — Assistive AI boundary and provider isolation report.
