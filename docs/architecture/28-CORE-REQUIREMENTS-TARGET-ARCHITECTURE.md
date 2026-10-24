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

## 2. Requirements-to-architecture-to-task traceability

The task column is the planning ownership for the requirement; it is not
acceptance evidence. A task is accepted only when its own criteria and evidence
gate pass.

| Core requirement area | Architectural component/boundary | Classification at baseline | Evidence / gap | Planned task(s) |
| --- | --- | --- | --- | --- |
| Three canonical modes and preferred Intro -> Worked Examples -> Challenge sequence | Mode registry, LearningUnit/artifact relationship, sequence read model | Implemented and unit-verified | `shared/contracts/`, mode compatibility tests, S14 sequence service | S16-T01, S19-T03 |
| Five orthogonal presentation formats | Shared artifact contract and format-specific metadata/media adapters | Partially implemented | S12 contracts and mocked metadata paths exist; complete editorial UX/rendering is not established | S19-T02 |
| Topic -> Subtopic taxonomy | Taxonomy services and repositories | Implemented in contracts and production taxonomy | `src/lib/data/production-taxonomy.ts` and topic/subtopic repositories; no end-to-end role evidence | S16-T01, S19-T01 |
| Audience context and skill level as independent dimensions | LearningUnit planning contract and safe artifact projections | Partially implemented | Planning tests exist; complete role-aware UX and downstream consistency need evidence | S16-T01, S19-T01 |
| Verified LearningUnit as central educational asset | LearningUnit repository/service and linked artifact boundary | Partially implemented | `learning_units` persistence, linking, sequence/calendar read models; full lifecycle and correction semantics are incomplete | S16-T01, S18-T01, S19-T01 |
| Save Draft separate from Submit for Verification | Backend commands and WorkflowEngine preconditions | Implemented in service/test paths; broader acceptance insufficient | S11/S13 tests and workflow authority; API/emulator/browser evidence remains incomplete | S16-T01, S16-T02 |
| Stage 02 usefulness, calculation, Telugu clarity, and human verification | Deterministic validators, AI advisory boundary, human review gate | Partially implemented | S12 validator tests and existing workflow/GAR-02; full mode/format and API acceptance remain | S16-T01, S19-T03 |
| Canonical 15-stage workflow | `WorkflowEngine` and `transition-matrix.ts` | Implemented in transition authority; operational coverage incomplete | S13 tests; all supported modes and route boundaries are not fully evidenced | S16-T01, S16-T02, S19-T03 |
| GAR-02 anti-self-approval and audited admin override | Backend authorization, workflow gate, immutable audit | Implemented in workflow/auth code; live acceptance not established | Workflow tests and ADRs; complete route matrix and emulator evidence remain | S16-T01, S16-T02 |
| Linked artifact correction propagation/review | Version-bound correction evidence and internal review projection | Blocked by decision | ADR-016 explicitly proposed and unapproved | S18-T01 through S18-T04 |
| Publication records and platform-specific outputs | Publishing package repository/service and provider adapters | Partially implemented | Publishing repositories/services and linked context exist; safe package/sync acceptance is incomplete | S20-T01 through S20-T04 |
| Audience performance and learning engagement measurement | Snapshot contracts, analytics repository/service, bounded aggregation | Partially implemented | S15-T01 contracts and legacy social analytics; source/provenance and aggregation are incomplete | S17-T01 through S17-T04 |
| Production time, cost, revisions, rejection, and LearningUnit reuse | `production_effort` repository/service plus metric dictionary | Partially implemented | S15-T02 stores explicit observations with OCC/audit; formulas, ownership, currency, and derivation are open | S17-T01 through S17-T04 |
| Publishing consistency and revenue by platform/content series | Publication status/read model and revenue-source adapter boundary | Missing/insufficiently specified | Core requirements name the outcomes, but no approved revenue source or consistency formula is present | S17-T01, S17-T02, S20-T03 |
| Revenue relative to production costs and sustainable revenue decisions | Measurement/reporting boundary; no billing authority | Not currently justified as billing implementation; reporting requirement remains | Requirements call for measuring business outcomes, not a payment system; no source contract exists | S17-T01, S17-T04; billing remains out of scope |
| Feedback and Intelligence Loop | Audited advisory recommendation service and authorized command boundary | Missing/insufficiently verified | Existing intelligence services are provider/operational slices, not an approved feedback loop | S21-T01 through S21-T04 |
| Frontend work-oriented IA and role navigation | Single shell, capability-aware hubs, typed API clients | Partially implemented | Approved IA and existing navigation/pages; role/action behavior is not fully evidenced | S16-T03, S19-T01, S19-T03 |
| Observability, privacy, cost, local/deployed parity | Audit/logging, datastore guards, adapters, environment contract | Partially implemented | Guards and architecture contracts exist; operational proof and parity evidence remain | S16-T04, S22-T01 through S22-T04 |

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

| Hub/page family | Canonical roles with primary responsibility | Representative actions (always server-authorized) | Internal data excluded from audience projections |
| --- | --- | --- | --- |
| Home / work queue | All authenticated roles | View assigned work and permitted operational summaries | audit payloads, provider credentials |
| Questions / LearningUnits | `QUESTION_AUTHOR`, `QUESTION_EDITOR`, `CONTENT_LEAD`, `QA_REVIEWER` | Create/edit/save/submit/read within ownership and workflow gates | reviewer notes and OCC internals |
| Production workbench | `SCRIPTWRITER`, `PRESENTER`, `VIDEO_EDITOR`, `DESIGNER`, `CONTENT_LEAD`, `QA_REVIEWER` | Perform stage-specific work and submit decisions | internal assignments and rejection metadata |
| Publishing | `PUBLISHING_LEAD`, `QA_REVIEWER`, `CONTENT_LEAD` | Review packages, schedule, and synchronize through authorized adapters | credentials and provider diagnostics |
| Analytics / production effort | `ANALYST`, `CONTENT_LEAD`, `ADMIN` | Read scoped metrics; record effort only with explicit capability | private audience data and internal audit details |
| Management / administration | `ADMIN`, `CONTENT_LEAD` | Manage planning, taxonomy, team operations, and recovery according to capability | secrets and raw provider payloads |

This is the planning matrix for S16-T03 and S19-T03, not a grant of
permissions. The canonical role names and navigation capabilities remain those
in `src/config/roles.ts` and `src/config/navigation.ts`; backend capability
resolution is authoritative.

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

### 5.1 S17 approval-readiness decision package

This package separates verified repository facts from recommendations requiring
explicit approval. It does not approve a metric definition or authorize S17
implementation.

**Verified baseline**

- S15-T01 defines observations with explicit `AVAILABLE` and `UNAVAILABLE`
  states, including `INSUFFICIENT_SAMPLE`; it does not define business
  formulas or thresholds.
- S15-T02 stores production-effort observations supplied by an authorized
  operator. The contract names `productionTimeMinutes`, an optional
  three-letter `currency`, `cost`, `revisionCount`, `rejectionCount`, and
  `reuseCount`; it does not derive values from workflow timestamps or audience
  data.
- Existing performance dimensions include artifact, platform, mode, format,
  audience context, and series. Topic, time-window boundaries, aggregation
  formulas, and minimum sample thresholds are not approved by these contracts.
- The roadmap requires product-owner approval of metric definitions and
  explicitly requires units and derivation policy before S17-T01
  implementation. S17-T02 remains dependent on that approval.

**Decision record**

| Decision ID | Precise question | Recommendation for approval | Alternatives and trade-offs | Impact and acceptance condition | Required approver / status |
| --- | --- | --- | --- | --- | --- |
| `S17-MET-01` | What is authoritative for each production-effort value: operator observation, derived value, or both? | Treat explicitly recorded observations as authoritative; permit derived values only where a separately approved source and derivation are recorded. Do not infer values from workflow or audience timestamps. | Operator-only is auditable but manual; derived-only is repeatable but depends on complete event semantics; dual-source is flexible but requires provenance and conflict rules. | Contracts/records need source and derivation provenance; reports must distinguish observed, derived, and unavailable. S17-T01 unblocks when the source policy and conflict rule are approved. | Product owner + architecture owner; `APPROVED` |
| `S17-MET-02` | What units and currency apply to production time and cost, and when is currency mandatory? | Retain the existing minute field and ISO-like three-letter currency shape as candidate contract constraints; require approval of cost units, currency applicability, conversion policy, and rounding before aggregation. | A single reporting currency simplifies comparison but introduces exchange-rate policy; native currencies preserve evidence but complicate comparison; time in minutes is clear but may not represent labor allocation. | Shared contracts, Firestore records, aggregation DTOs, and exports must preserve units/currency without silently converting values. S17-T01 unblocks when the unit and currency policy is explicit. | Product owner + architecture owner; `APPROVED; conversion deferred` |
| `S17-MET-03` | What do revisions, rejection, and reuse count, and what uses are permitted? | Define each as an approved observation/derivation rule and restrict metrics to authorized reporting and operational analysis; do not use them to mutate workflow, approve content, publish, or create billing/payroll authority. | Event-derived counts improve repeatability but require canonical event identity; operator-entered counts are available sooner but need correction/audit policy. | Service validation, audit attribution, and reporting labels must preserve the approved meaning. S17-T01 unblocks when definitions and permitted uses are signed off. | Product owner + architecture owner; `APPROVED` |
| `S17-MET-04` | What time-window boundaries, timezone, minimum sample rules, and unavailable-value behavior govern S17-T02? | Approve one explicit window convention, sample threshold, and aggregation rule for unavailable values; never convert unavailable or insufficient samples to zero. | Fixed UTC windows are deterministic; local business windows are easier for operators but require timezone ownership; lower thresholds improve coverage but reduce privacy/statistical confidence. | Repository queries must be bounded and deterministic; DTOs must expose source/window and measured, unavailable, or insufficient-sample outcomes. S17-T02 unblocks only after the complete window/sample/missing-data policy is approved. | Architecture owner + product owner; `APPROVED; numeric threshold deferred` |
| `S17-MET-05` | How is topic resolved for aggregation when stored snapshots contain artifact/platform dimensions but not an explicit topic field? | Approve a bounded, documented lookup from the artifact/LearningUnit authority, or explicitly exclude topic until a source field is approved; never use recursive scans or inferred text classification. | A bounded lookup preserves the existing model but adds joins; adding a denormalized topic field improves reads but requires write/version/backfill policy; exclusion reduces scope but weakens required comparisons. | Repository/service query shape, indexes, DTO filters, and historical-record treatment depend on this decision. S17-T02 unblocks when topic source and historical handling are explicit. | Product owner + architecture owner; `APPROVED` |

**Concrete recommendation details (approved for S17-T01; deferred sub-policies
remain explicitly identified below)**

- **`S17-MET-01` — source and derivation:** Keep operator-recorded
  production-effort values authoritative for S15-T02. Treat platform snapshots
  as direct observations at their provider capture time. Permit a derived value
  only when its auditable source records, source version/window, derivation
  policy identifier, and derivation timestamp are retained. Aggregates and
  interpretations are reporting outputs, never source observations. Do not
  derive production duration from workflow timestamps, infer a labor rate from
  duration, or merge incompatible sources. If approved, the minimum contract
  addition is provenance metadata; existing value fields remain unchanged. This
  was implemented for S17-T01 as a server-owned provenance envelope.

- **`S17-MET-02` — units and cost:** Keep `productionTimeMinutes` as elapsed
  production time in minutes, independently from `cost`. Represent cost as a
  monetary observation with an explicit currency whenever it is available;
  currency is not the infrastructure budget and no INR rate or labor rate is
  implied. Do not compare or sum different currencies without an approved
  conversion source, effective date, and rounding rule. If approved, add only
  the minimum unit/currency metadata needed by the existing contract and
  preserve native recorded values; do not introduce billing, payroll, or
  compensation authority. Automatic conversion remains disabled.

- **`S17-MET-03` — outcome counts and permitted use:** Count revisions and
  rejections from unique, immutable, auditable workflow/editorial outcomes
  under an approved identity rule; retries, duplicate requests, and provider
  transport failures are not additional editorial outcomes. Define reuse as a
  verified artifact relationship to a LearningUnit, not text similarity or a
  duplicate artifact. These values may support authorized operational
  comparisons and planning, but cannot prove quality, learning impact,
  profitability, approval, publication readiness, or a correction-review
  decision. Revenue and production cost remain separately attributable until a
  later approved business calculation exists.

- **`S17-MET-04` — windows and missingness:** Use the authoritative observation
  timestamp (`recordedAt` for production effort and provider `capturedAt` for
  performance) with a deterministic half-open reporting window
  `[start, end)`; approve whether boundaries are UTC or an explicitly owned
  business timezone. Preserve genuine zero separately from unavailable,
  not-collected, not-applicable, privacy-restricted, and insufficient-sample
  outcomes. The current contract supports several unavailable reasons but not
  every distinction; any enum extension requires approval and compatibility
  handling. The product owner must set the minimum sample rule; no threshold is
  proposed here. Until then, comparisons are qualified or suppressed rather
  than filled with zero.

- **`S17-MET-05` — bounded taxonomy resolution:** Resolve Topic and Subtopic
  only through the authoritative verified LearningUnit/taxonomy identifiers
  and their recorded relationship. Do not infer a topic from titles, free text,
  or similar artifacts. Missing, ambiguous, invalid, or changed associations
  fail closed and are reported as unavailable; historical results retain the
  source identifiers/version needed to explain the classification at capture
  time. Prefer a bounded lookup over denormalization; adding a snapshot field
  is only justified if the owner approves its write, version, and historical
  handling policy.

These recommendations are mutually consistent: observations retain their
original source and units; derivations and aggregates retain provenance; missing
evidence is never converted to zero; dimensions remain artifact/platform
scoped; and no metric grants authorization or changes workflow state.

**Decision dependencies and approval action**

1. Approve `S17-MET-01` and `S17-MET-02` first; source ownership and units
   determine whether later values can be compared at all.
2. Approve `S17-MET-03` next; its meanings and permitted uses depend on the
   source/units policy and constrain reporting without granting workflow,
   publishing, billing, or payroll authority.
3. Approve `S17-MET-04` after the metric meanings are fixed; its windows,
   timezone, sample, and unavailable-value rules govern bounded aggregation.
4. Approve `S17-MET-05` before S17-T02 query design; topic is a required
   comparison dimension only if an authoritative bounded source is approved.

The product owner and architecture owner approved the five decision IDs on
2026-10-25. The approval record identifies the accepted option, effective date,
and rejected alternatives. Automatic currency conversion and a numeric minimum
sample threshold remain deferred sub-policies for later aggregation work.

**Approval evidence required before implementation**

The approval record states units, source/ownership, formulas or derivation
policy, currency, permitted uses, UTC window boundaries, unavailable handling,
and topic source. S17-T01 is therefore complete. S17-T02 remains `GATED`;
no schema migration, aggregation service, dashboard, or production-data
operation is authorized by this record.

### 5.2 Owner approval record — 2026-10-25

The owner explicitly confirmed in the project execution conversation that they
hold both the Product Owner and Architecture Owner roles and approved the
recommended directions for `S17-MET-01` through `S17-MET-05` on 2026-10-25.
This record reflects that explicit role declaration; no separate approver is
invented.

| Decision | Accepted direction | Deferred or rejected alternatives | Effective status |
| --- | --- | --- | --- |
| `S17-MET-01` | Operator production-effort observations and provider measurements remain source observations; derived values require documented formula and provenance. | Silent timestamp inference and labor-cost inference are rejected. | Approved by both roles; effective 2026-10-25 |
| `S17-MET-02` | Time is minutes; monetary cost remains separate with explicit native currency; no automatic conversion or labor rate. | Infrastructure budget as production-cost formula, inferred rates, and unapproved conversion are rejected. Automatic conversion remains deferred. | Approved by both roles; effective 2026-10-25 |
| `S17-MET-03` | Count unique auditable editorial outcomes; retries/duplicates are excluded; reuse requires a verified artifact-to-LearningUnit relationship; revenue and cost remain separate. | Similarity-based reuse and operational metrics granting approval, publication, authorization, or correction-review rights are rejected. | Approved by both roles; effective 2026-10-25 |
| `S17-MET-04` | Use UTC half-open `[start, end)` windows and authoritative timestamps; preserve zero and missingness distinctions; use existing `INSUFFICIENT_SAMPLE` behavior. | Filling missing data with zero is rejected. A numeric minimum sample threshold remains deferred to product policy and is not invented here. | Approved by both roles with threshold deferred; effective 2026-10-25 |
| `S17-MET-05` | Resolve Topic/Subtopic through verified identifiers and LearningUnit relationships, fail closed on ambiguity, and preserve historical traceability. | Free-text/similarity inference and unbounded recursive scans are rejected. | Approved by both roles; effective 2026-10-25 |

The owner approved the recommended metric dictionary for S17-T01. The
automatic currency-conversion policy and numeric minimum sample threshold are
explicitly deferred; neither is required to define the source, units,
provenance, permitted uses, UTC window shape, or fail-closed taxonomy policy.
S17-T02 remains gated until those aggregation-specific policies and evidence
are complete.

### 5.2.1 S17-T01 runtime acceptance evidence

S17-T01 runtime scope is complete without enabling aggregation or derivation:

- `ProductionEffortProvenanceSchema` requires either an operator observation
  reference and observation timestamp, or complete source/version/window,
  derivation-policy, and derivation-timestamp fields for a derived value.
- `ProductionEffortService` assigns `OBSERVED` provenance from the
  server-resolved actor. Client-supplied actor identity and provenance are not
  trusted, and existing audit/OCC behavior remains unchanged.
- `productionTimeMinutes` remains explicitly measured in minutes and `cost`
  retains its recorded native currency. No labor-rate inference or currency
  conversion is performed.
- Focused S17-T01 tests prove operator authority, provenance validation,
  native-currency preservation, and rejection of incomplete derived metadata.
  S15-T01, S15-T02, S16-T01, S16-T03, and S16-T04 regressions, lint, and build
  also passed. S17-T02 remains gated.

### 5.3 Snapshot and Sheets coupling audit

The audit distinguishes the following implementation classes:

| Surface | Classification | Finding and preservation/removal decision |
| --- | --- | --- |
| `snapshot-exporter.service.ts` and `GoogleSheetsSnapshot` types | Disabled legacy Sheets export and compatibility input type | `exportSnapshot()` already fails closed because Firestore is authoritative. The type remains an input contract for administrative restore/archive validation; no safe complete removal was established. |
| `snapshot-history.service.ts`, `durable-snapshot-archive.service.ts`, `snapshot-scheduler.service.ts`, and recovery routes | Active recovery/archive functionality | Retain. These provide integrity-checked durable archives, retention controls, restore history, and explicitly authorized recovery paths; Firestore authority does not replace disaster-recovery evidence. |
| `social_analytics` repository/service and performance contracts | Firestore performance observation snapshots | Retain. Append-only captured observations support historical reporting, duplicate protection, auditability, and time-based comparisons; they are not Google Sheets synchronization copies. |
| Script, thumbnail, video, publishing, and pinned-comment version repositories/services | Application version snapshots | Retain. They preserve artifact/version traceability and historical workflow context. |
| `secondary-sheet-schema.ts` and related restore validators | Compatibility/offline recovery schema | Retain until a separately authorized migration proves no archived payload, restore route, or compatibility consumer remains. |
| Historical Sheets E2E/architecture references and runtime-mode strings | Legacy tests/documentation/configuration references | Not removed in this task. They require a bounded compatibility cleanup with test ownership and deployment-impact review; deleting them now would exceed the demonstrated safe scope. |

No Firestore collection, audit record, recovery archive, deployed resource,
production data, or legitimate performance/version snapshot was deleted.

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

## 8. Independent planning review result

**Result: ACCEPTED WITH DOCUMENTED CORRECTIONS.** The architecture and roadmap
are suitable as the S16+ planning baseline after the corrections in this
revision. This acceptance is not acceptance of application behavior, ADR-016,
metric definitions, revenue integrations, or production readiness.

Material corrections made:

1. **Traceability gap corrected:** the coverage matrix now names the
   architectural boundary, baseline classification, and S16+ task owner for
   every core requirement area. Evidence remains task-specific.
2. **Revenue gap corrected:** publishing consistency, revenue by platform/series,
   and revenue-relative-to-cost reporting are now explicit requirements with a
   metric-definition gate. No billing or payment system is authorized because
   the core requirements do not establish one.
3. **Operator usability gap corrected:** the target architecture now records
   canonical role-to-hub/action responsibilities grounded in
   `src/config/roles.ts` and `src/config/navigation.ts`; S16-T03 and S19-T03
   own behavioral verification.
4. **Sequencing ambiguity corrected:** the roadmap now states that S16 is the
   future baseline, removes stale “next S11-T03” language, and gives S16-T01 a
   bounded acceptance matrix before emulator work in S16-T02.
5. **Unsupported complexity constrained:** the plan explicitly retains a
   modular monolith, existing adapters, Firestore, and the canonical workflow;
   it does not authorize a new event system, datastore, billing service,
   taxonomy level, or workflow stage.

Confirmed facts, assumptions, and unresolved decisions remain separate:

- **Confirmed:** baseline commit and synchronization, existing repository/service
  boundaries, recorded unit-test/build evidence, and the known TypeScript
  declaration blocker.
- **Assumptions for planning:** S16-T01 can test existing routes without
  changing runtime behavior; S16-T02 can use a safe loopback emulator.
- **Unresolved:** ADR-016 lifecycle approval; automatic currency conversion and
  numeric minimum sample threshold for aggregation; revenue source and
  reporting authority; owner human acceptance of live UI and external
  providers.
