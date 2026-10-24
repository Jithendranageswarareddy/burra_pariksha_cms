# BP-CMS Core-Requirements Target Architecture

**Date:** 2026-10-25  
**Status:** Architecture baseline for future planning; this document does not
authorize application implementation.  
**Authority:** `docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md`,
the approved ADRs, verified production code, and the reconciled roadmap in
`docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`.

## 1. Purpose and evidence boundary

This document reconciles the approved core requirements with the brownfield
repository. It separates observed behavior from target design and from decisions
that still require explicit approval. Existing architecture documents remain
authoritative for their detailed contracts; this document is the requirements
traceability and boundary index for future S16+ planning.

Evidence inspected:

- Core requirements: `docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md`
- Existing architecture: `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md`,
  `05-TARGET-SYSTEM-BOUNDARY.md`, `06-DOMAIN-MODEL.md`,
  `07-CANONICAL-15-STEP-WORKFLOW.md`, `08-STATE-MODEL.md`,
  `09-RBAC-CAPABILITY-MODEL.md`, `10-FRONTEND-INFORMATION-ARCHITECTURE.md`,
  `11-PAGE-ROUTE-CONTRACT.md`, `12-DATABASE-ARCHITECTURE.md`,
  `13-DATA-MODEL-DATA-CONTRACT.md`, `14-MEDIA-ARCHITECTURE.md`,
  `15-API-CONTRACT.md`, `19-SECURITY-ARCHITECTURE.md`,
  `20-ANALYTICS-ARCHITECTURE.md`, `21-AUDIT-OBSERVABILITY.md`,
  `24-TEST-ARCHITECTURE.md`, `25-IMPLEMENTATION-DEPENDENCY-GRAPH.md`,
  `27-DEPENDENCY-BOUNDARIES.md`
- Decision log: `docs/architecture/DECISION-LOG.md`
- Verified implementation baseline: commit `fb8076a7e2044de208d5c34b8340ec54ddbbb09f`
- Current tests and commands: `package.json`, `docs/TESTING-GUIDE.md`,
  `tests/unit/core-requirements/`, and the S13-T06 emulator test.

### 1.1 Current repository evidence

The code is a modular TypeScript monolith:

```text
React/Vite frontend
  -> typed/shared contracts and API boundary
  -> Express backend routes and middleware
  -> domain/feature services
  -> Firestore repositories and audit dispatcher
  -> adapters for Drive, AI, publishing, and analytics providers
```

The repository already contains LearningUnit contracts and persistence,
LearningUnit-linked artifact queries, the canonical workflow transition
authority, protected planning read models, social analytics persistence,
performance contracts, and the S15-T02 `production_effort` repository/service.
The frontend is not yet a complete requirements-driven workbench: existing
pages and navigation remain a brownfield mixture, and source inspection alone
does not prove role-page behavior or live workflow acceptance.

The following are verified limitations, not design assumptions:

- `npm run build` passes at the planning baseline, with existing bundle and
  dependency warnings.
- `npm run lint` / TypeScript checking is blocked by the installed
  `googleapis` declaration error at
  `containeranalysis/v1.d.ts(1450,48)` (`TS1010: '*/' expected`).
- Unit tests for S11–S15 selected capabilities pass according to the current
  scripts and tracking, but emulator, browser, provider, and human acceptance
  evidence is narrower than the full requirements.
- S15-T02 accepts explicit metric observations. It does not define or derive
  formulas for time, cost, revisions, rejection, or reuse.
- ADR-016 remains `PROPOSED / PENDING APPROVAL`; no correction-review lifecycle
  is authorized.

## 2. Requirements coverage matrix

| Core requirement area | Classification at baseline | Evidence / gap | Future response |
| --- | --- | --- | --- |
| Three canonical modes and preferred Intro -> Worked Examples -> Challenge sequence | Implemented and unit-verified | `shared/contracts/`, mode compatibility tests, S14 sequence service | Preserve aliases and add end-to-end acceptance where missing |
| Five orthogonal presentation formats | Partially implemented | S12 format contracts and mocked metadata paths exist; rendering and complete editorial UX are not established | Complete format-specific workbench and acceptance without new mode systems |
| Topic -> Subtopic taxonomy | Implemented in contracts and production taxonomy | `src/lib/data/production-taxonomy.ts`, topic/subtopic repositories | No Category or additional taxonomy level |
| Audience context and skill level as independent dimensions | Partially implemented | LearningUnit contracts/planning tests exist; complete role-aware UX and downstream consistency need evidence | Verify through workspace, artifact, and projection tests |
| Verified LearningUnit as central educational asset | Partially implemented | `learning_units` repository, linking, sequence/calendar read models | Finish lifecycle and correction dependency before claiming complete |
| Save Draft separate from Submit for Verification | Implemented in service/test paths; broader acceptance insufficient | S11/S13 tests and workflow authority | Add API/browser regression evidence |
| Stage 02 usefulness, calculation, Telugu clarity, and human verification | Partially implemented | S12 validator tests and existing workflow/GAR-02 | Complete mode/format coverage and human-gated API acceptance |
| Canonical 15-stage workflow | Implemented in transition authority; operational coverage incomplete | `transition-matrix.ts`, `WorkflowEngine`, S13 tests | Verify every supported mode and invalid transition at API/emulator boundaries |
| GAR-02 anti-self-approval and audited admin override | Implemented in workflow/auth code; live acceptance not established | workflow tests and architecture ADRs | Maintain fail-closed identity and add complete route matrix evidence |
| Linked artifact correction propagation/review | Blocked by decision | ADR-016 explicitly proposed and unapproved | Product/architecture approval required before S14-T03/S14-T04 |
| Publication records and platform-specific outputs | Partially implemented | publishing repositories/services and linked context exist | Complete safe publication package/read-model acceptance |
| Audience performance and learning engagement measurement | Partially implemented | S15-T01 contracts and legacy social analytics | Define source/provenance and aggregation in S17 |
| Production effort measurement | Partially implemented | S15-T02 explicit artifact/platform record, OCC, audit | Approve semantics before aggregation or dashboard claims |
| Feedback and Intelligence Loop | Missing/insufficiently verified | Existing intelligence services are provider/operational slices, not approved feedback loop | Add audited advisory recommendations after measurement semantics |
| Frontend work-oriented IA and role navigation | Partially implemented | Approved IA documents and existing pages/navigation | Consolidate only through focused vertical slices and browser evidence |
| Observability, privacy, cost, local/deployed parity | Partially implemented | audit/logging/datastore guards and architecture contracts exist | Close known verification and operational gaps without new infrastructure |

## 3. Current-state and target-state boundaries

### 3.1 Domain ownership

| Boundary | Authoritative owner | Current implementation anchor | Target rule |
| --- | --- | --- | --- |
| Identity, actor, roles, capabilities | Backend auth middleware and user repositories | `backend/server/middleware/auth.middleware.ts`, `src/config/roles.ts` | Resolve identity fail-closed; UI permissions never authorize |
| Topic and Subtopic | Taxonomy services/repositories | `src/lib/data/production-taxonomy.ts`, `database/firestore/repositories/topics.repository.ts` | Keep exactly two levels |
| LearningUnit | Planning service/repository | `backend/features/planning/`, `learning-units.repository.ts` | Own objective, prerequisites, verified knowledge, audience, skill, and links |
| Content artifact and versions | Existing artifact services/repositories | question, script, video, thumbnail, publishing services | Artifact identity and version remain distinct from LearningUnit identity |
| Verification and workflow | `WorkflowEngine` and transition matrix | `backend/domain/workflow/` | No feature service may duplicate transition authority |
| Publication | Publishing service/repository and provider adapters | `backend/features/publishing/` | Store package/status/URL metadata; external platforms own delivery |
| Platform performance | Analytics service/repository plus S15 contracts | `backend/features/analytics/`, `social_analytics` | Store snapshots with source, capture time, platform, and missing-data semantics |
| Production effort | `ProductionEffortService` and `production_effort` | S15-T02 implementation | Store explicit observations; do not infer unavailable business definitions |
| Feedback/intelligence | Backend intelligence services and audited recommendations | existing intelligence services | Recommendations are advisory and cannot approve, publish, or mutate content |

### 3.2 Persistence and integration

Firestore remains the sole transactional authority. Repositories own persistence
mechanics, services own business rules, and shared contracts remain free of
backend secrets and framework dependencies. Google Drive/GCS retain binary
media; Firestore retains metadata, references, checksums, and workflow evidence.
Gemini, publishing platforms, and analytics providers are adapters with bounded,
mockable contracts. No event bus, second datastore, billing system, or new
workflow engine is justified by the current requirements.

Every mutable domain record must preserve immutable identity/creation data,
actor attribution, version checks, and append-only audit history. Create,
update, retry, and provider synchronization operations need idempotency keys or
duplicate detection when their external side effects make retries possible.
Provider failure is explicit; it must not become a success-shaped empty result.

### 3.3 Workflow and correction boundary

The canonical workflow remains stages 01–15. Save Draft never advances the
workflow; Submit for Verification is a distinct command. Ordinary authors
cannot approve their own artifact, while the approved System Administrator
override remains explicit, reason-validated, and audited.

Correction review is intentionally outside the target implementation contract
until ADR-016 is accepted. The eventual smallest design should bind evidence to
the LearningUnit/artifact version, use existing OCC and audit infrastructure,
identify affected linked artifacts, and re-enter existing workflow stages rather
than adding a sixteenth stage. The lifecycle states, evidence authority,
capabilities, role-visible queue fields, and version increment rule are product
decisions, not assumptions.

## 4. Frontend information architecture

The target is one work-oriented shell, not separate role-specific applications.
The existing approved IA (`10-FRONTEND-INFORMATION-ARCHITECTURE.md`) remains the
presentation authority; backend capability checks remain the security authority.

| Hub/page family | Primary users | Allowed actions are projections of | Internal data excluded from audience projections |
| --- | --- | --- | --- |
| Home / work queue | all authenticated roles | assigned capabilities and resource ownership | audit payloads, provider credentials |
| Questions / LearningUnits | authors, leads, reviewers | create/edit/save/submit/read capabilities | reviewer notes and OCC internals |
| Production workbench | script, presenter, editor, QC roles | stage-specific capabilities and workflow state | internal assignments and rejection metadata |
| Publishing | publishing/review roles | package review, scheduling, sync capabilities | credentials, provider diagnostics |
| Analytics / production effort | analytics and management roles | read scopes, explicit observation write capability | private audience data and internal audit details |
| Management / administration | administrators and leads | user, taxonomy, configuration capabilities | secrets and raw provider payloads |

Each page must use typed API clients and a server-issued actor context. Route
visibility is not an authorization decision. The frontend must preserve
audience-safe DTO projections and show unavailable metrics explicitly rather
than rendering zero.

## 5. Proposed changes and approval gates

| Proposed change | Requirement served | Existing gap | Smallest change | Approval |
| --- | --- | --- | --- | --- |
| Accept ADR-016 or explicitly defer the feature | Related lessons must identify affected publications | No approved correction evidence/lifecycle | Approve the minimal additive model or replan S14 | Product owner + architecture owner |
| Define production-effort semantics | Measure production cost and effort | S15-T02 stores observations but formulas/ownership are open | Approve units, currency, source, reuse definition, and derivation policy | Product owner |
| Add bounded analytics aggregation | Compare platform/mode/format/audience/series | Contracts exist; no approved aggregation/read model | Query existing snapshots with explicit windows and sample/missing rules | Architecture review after metric decisions |
| Close end-to-end workflow/UI evidence | Repeatable production system | Code/unit evidence does not prove browser or all API behavior | Focused API/emulator/browser slices over existing services | No new ADR; requires test/environment gate |
| Add audited advisory feedback loop | Intelligence Loop in core requirements | Existing intelligence services are not a governed recommendation contract | Persist recommendation evidence and authorized command boundary | Architecture review; AI remains advisory |

No proposed change authorizes a new taxonomy level, provider, event system,
datastore, workflow stage, migration/backfill, or production operation.

## 6. Non-functional contracts

- **Security:** authentication fails closed; authorization checks capability,
  ownership, workflow preconditions, GAR-02, and resource version.
- **Privacy:** internal notes, audit details, actor/reviewer metadata, provider
  diagnostics, and secrets never enter audience-facing DTOs.
- **Concurrency:** stale expected versions return an explicit conflict; retries
  do not overwrite newer decisions.
- **Reliability:** external calls have bounded retries and idempotency; failures
  are logged and surfaced.
- **Cost:** retain the existing free-tier constraints and avoid recursive scans,
  live AI calls, or paid services during verification.
- **Environment:** local and Google AI Studio execution share production logic;
  only adapters/configuration vary, with datastore isolation failing closed.
- **Testing:** unit, mocked API, emulator, browser/human, and provider/cloud
  evidence are separate claims. A build does not prove runtime behavior.

## 7. Planning authority

Future code-changing work must be selected from the S16+ roadmap, have a
dependency-ready status, identify exact acceptance evidence, and add meaningful
comments for non-obvious logic, invariants, authorization, concurrency, and
integration boundaries. This document does not mark any future task complete and
does not approve ADR-016.
