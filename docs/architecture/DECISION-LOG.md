# BP-CMS Architecture & Engineering Decision Log

| Decision ID | Date | Topic | Decision | Context / Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | 2026-10-03 | Workflow Authority | Converge on single 15-stage state engine (`src/lib/workflow/transition-matrix.ts`) | Principle 3 invariant: exactly one authoritative workflow state engine. |
| **ADR-002** | 2026-10-03 | Anti-Self-Approval & Admin Override Governance | Enforce GAR-02 server-side: strict zero-bypass for employees; audited administrative override with explicit confirmation and >= 10-char justification for System Administrator | Prevents academic errors and conflicts of interest while ensuring the primary system operator is not blocked from ordinary operations. |
| **ADR-003** | 2026-10-03 | AI Human Gating | Prohibit AI autonomous approval via AP-009 | Generative AI is assistive; human sign-off is mandatory on critical quality gates. |
| **ADR-004** | 2026-10-04 | Environment Transition | Designate Google AI Studio as primary development environment | Unified development, build, test, and Cloud Run preview with zero environment drift. |
| **ADR-005** | 2026-10-04 | Source of Truth | GitHub `main` is authoritative upstream baseline | Git tracking ensures strict linear revision history. |
| **ADR-006** | 2026-10-04 | Environment Contract | Stabilize 44-variable environment contract & Secret topology | Audited live code references; established explicit mandatory vs optional defaults across AI Studio container and Cloud Run target. |
| **ADR-007** | 2026-10-04 | Operating Model | Authorize 5-tier environment topology: GitHub main as Source of Truth, Google AI Studio as Primary Implementation & Release Authority, Antigravity as Local Development Workspace, ChatGPT as Independent Verification Surface, and Cloud Run as Live Team Deployment Target | Standardizes development flow, defines strict Task Closure (HEAD == origin/main == GitHub main), and mandates intentional conflict reconciliation. |
| **ADR-008** | 2026-10-14 | Canonical Role & Taxonomy Integrity (DD-08) | Retain 11 Canonical Roles under `shared/constants/roles.ts` and Two-Tier Taxonomy (`Topic` $\to$ `Subtopic`) | Resolves DD-08: Social review and publishing capabilities remain formally governed under `PUBLISHING_LEAD` (with `QA_REVIEWER` peer approval) without introducing an autonomous 12th enum. Permanently enforces Two-Tier Taxonomy without legacy Category. |
| **ADR-009** | 2026-10-14 | Challenge Option Schema & Step 02 Invariant Across Modes (OD-03, OD-06) | Enforce strict 4-option MCQ invariant (`a,b,c,d`) across challenge types; adapt Step 02 into polymorphic Concept Verification for zero-question Mode 2 without skipping stages | Resolves OD-06: Maintains 100% schema consistency with `request-schemas.ts` and `FC-005`. Resolves OD-03: Preserves the sequential 15-stage workflow invariant and GAR-02 anti-self-approval rule by evaluating syllabus and concept accuracy rather than mathematical proofs when questions are absent. |
| **ADR-010** | 2026-10-14 | Content Mode Production Architecture & Multi-Question Invariants (OD-01, OD-02, OD-04, OD-05, OD-07) | Adopt Option A across all content mode open decisions: OD-01 Additive ($1\text{ Intro} + N\text{ Questions}$); OD-02 Mode 1 Batch creation series for counts $>1$ ($N=1$ single short default); OD-04 Mode-governed aspect ratio expansion (9:16 vertical for Mode 1; configurable for Mode 2; 16:9 landscape for Mode 3 masterclasses) amending `14-MEDIA-ARCHITECTURE.md`; OD-05 `ContentMaster` aggregate root with nullable `video.questionId` and `questionIds: string[]`; OD-07 Tiered duration budgets and extended async worker timeouts (up to 20m) amending `17-JOB-ASYNC-ARCHITECTURE.md`. | Resolves OD-01, OD-02, OD-04, OD-05, and OD-07 as authorized by Project Owner. Formally reconciles media and async processing contracts with Mode 3 masterclasses while preserving single-short vertical integrity for Mode 1. |
| **ADR-011** | 2026-10-14 | Production Workbench UX, Direct Linking & QC Route Architecture (DD-01–DD-07) | Resolve DD-01 through DD-07 via documented recommendations: DD-01 Consolidate Step 07 Final QC as Tab 4 inside `VideoDetailPage.tsx` (amending FC-012 standalone route requirement while preserving `video_qc_reviews` persistence and GAR-02); DD-02 Modal selection dialog for production modes on `/studio`; DD-03 Horizontal segmented tab bar for Mode 3 multi-question studio; DD-04 Typed query parameter contracts (`?draftId=dft_...`, `?videoId=vid_...`); DD-05 Single atomic aggregate document in `question_drafts` for multi-question sets; DD-06 Segmented teleprompter takes per question in Stage 06; DD-07 Formally retire 8 orphaned unmounted page files in Sprint 09. | Resolves DD-01 through DD-07 as authorized by Project Owner. Eliminates UX friction, unifies video workbench navigation, standardizes entity query parameters, and deprecates 297 KB of orphaned dead code. |
| **ADR-012** | 2026-10-18 | Sprint 9 Phase A/B Approval, Batch Runner (OD-02) & Phase C Runtime Authorization | Formally approve Gate A (`DEC-A-01`–`DEC-A-05`), Gate B (`S9-T05`–`S9-T07`), and authorize `OD-02` (Mode 1 Batch Dispatch Runner, candidate buffering, bounded retries, recovery behavior) and Phase C runtime implementation. Prioritize end-to-end System Admin operational permissions across all 15 stages with audited administrative self-approval override capability when admin is author ($authorId == approverId$ strictly for ADMIN with confirmed override and $\ge 10$-char justification; strict GAR-02 for employees). | Explicit Project Owner decision on 2026-10-18 establishing implementation baseline. Eliminates admin operational blockers, enforces strict GAR-02 for employees, and initiates Phase C Mode 1 batch generation ($N \in \{5,10,15,20\}$). |
| **ADR-013** | 2026-10-20 | System Administrator Operational Authority & Audited GAR-02 Override Remediation | Authorize authenticated System Administrator operational self-approval across all 15 workflow stages strictly through explicit, confirmed, audited override (`confirmedByAdmin: true`, reason $\ge 10$ chars). Strict zero-bypass GAR-02 remains enforced for all employees. | Resolves operational deadlock where the single System Administrator / primary operator was blocked from reviewing their own content. Establishes transparent accountability, durable immutable audit logs, and clear UI confirmation while safeguarding educational quality controls. |
| **ADR-014** | 2026-10-24 | Unified Local-to-Deployment Architecture & Google AI Studio Governance | Enforce single production-quality codebase running locally and when published via Google AI Studio; forbid separate development-only implementations or weakening of security/datastore safeguards | Eliminates environment drift and untestable cloud bugs. Ensures shared domain logic, explicit adapter separation, strict datastore guard isolation, and verified container builds (`dist/server.cjs`). |
| **ADR-015** | 2026-10-24 | Core Requirements Reconciliation: Canonical Mode Alignment, Learning Unit Entity, and Orthogonal 5 Presentation Formats | Realign canonical content modes to Mode 1 `TOPIC_INTRODUCTION`, Mode 2 `WORKED_EXAMPLES` (retaining `EXPLAINED_QUESTIONS_VIDEO` as 100% backward-compatible alias), Mode 3 `QUESTION_CHALLENGE_SHORT`; introduce `learning_units` collection as central educational asset; decouple 5 presentation formats (`TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION`) from content modes | Satisfies `bp_cms_core_requirements1.md` without data loss or breaking changes. Distinguishes underlying lessons from multi-format publications, enables cross-artifact linking, and preserves existing Firestore documents and routes. |
| **ADR-016** | 2026-10-24 | **Correction Propagation and Review Queue — PROPOSED / PENDING APPROVAL** | See the proposal below. No correction-review lifecycle is authorized or implemented by this record. | S14-T03 requires a persisted, auditable way to identify linked artifacts affected by a correction, but the current approved contracts define neither correction evidence nor review-flag semantics. |
| **ADR-017** | 2026-10-24 | Content Mode/Format Compatibility and Legacy Normalization | Treat all 15 canonical mode/format pairs as contract-supported because ADR-015 defines formats as orthogonal to educational mode; keep the matrix backend-authoritative and do not infer automatic rendering or generation from support. Normalize `EXPLAINED_QUESTIONS_VIDEO` to `WORKED_EXAMPLES` only for compatibility checks while preserving the stored legacy identifier and route behavior. | No approved requirement excludes a pair. A single matrix prevents frontend/backend drift, while explicit normalization preserves existing data without migration, backfill, or identifier rewrite. |

## ADR-015 Detailed Reconciliation Record

This section expands the table entry without changing the approved decision. The
current evidence and remaining work are maintained in
[`CORE-ARCHITECTURE-RECONCILIATION.md`](CORE-ARCHITECTURE-RECONCILIATION.md).

### Context

The core requirements baseline defines three educational modes, five independent
presentation formats, a verified LearningUnit, independent audience and skill
dimensions, and a preferred Intro -> Worked Examples -> Challenge sequence. The
brownfield application already had `TOPIC_INTRODUCTION`,
`QUESTION_CHALLENGE_SHORT`, and `EXPLAINED_QUESTIONS_VIDEO`, but the latter was
the legacy name for the worked-example behavior. Existing question, video,
workflow, and Firestore documents must remain readable without a migration.

### Options considered

1. Rewrite existing stored identifiers and routes to `WORKED_EXAMPLES`. Rejected:
   it risks data loss, breaks persisted compatibility, and violates the no-rewrite
   development invariant.
2. Keep `EXPLAINED_QUESTIONS_VIDEO` as the canonical product term. Rejected:
   it leaves the implementation vocabulary inconsistent with the approved core
   requirements.
3. Use canonical shared constants with a runtime compatibility alias, add a
   LearningUnit collection, and make presentation format orthogonal. Accepted:
   it is additive, preserves legacy records, and provides a path to related
   artifacts without creating a competing datastore.

### Consequences and migration implications

- `WORKED_EXAMPLES` is the canonical new identifier;
  `EXPLAINED_QUESTIONS_VIDEO` remains a supported read/write alias.
- `learning_units` is authoritative for verified educational knowledge. Existing
  standalone artifacts remain valid; new linking is optional until their creation
  paths use the planning flow.
- `presentationFormat` is independent from content mode. Existing video paths
  keep their behavior while TEXT, AUDIO, IMAGE, and ANIMATION begin as contracts
  and production briefs rather than automatic renderers.
- No production migration, backfill, purge, or identifier rewrite is part of this
  decision. Any future migration requires a separate reviewed decision and safe
  isolated verification.
- The decision does not claim that planning API/UI, reverse artifact queries,
  non-video templates, or measurement persistence are complete. Those are tracked
  in the core requirements roadmap.

## ADR-016 Proposal — Correction Propagation and Review Queue

**Status: PROPOSED / PENDING APPROVAL**
**Proposed date:** 2026-10-24
**Decision owner required:** Product Owner and architecture owner
**Scope:** Resolve the architecture dependency for S14-T03 only. This proposal
does not authorize implementation, migration, backfill, or production data changes.

### Context and problem statement

The core requirements say that a verified LearningUnit is the educational
foundation, each publication is a separate linked artifact, and a correction
can identify affected artifacts without rewriting historical publications.
Sprint 14 makes that relationship operational: S14-T03 must provide a correction
propagation/review queue, and its acceptance test must create review flags while
preserving historical artifacts.

The current repository evidence is narrower:

- `LearningUnitArtifactsService` performs bounded reverse queries and returns
  `correctionReview.supported: false`; it explicitly states that correction
  version evidence, flag persistence, transition policy, authorized actors, and
  projection semantics are undefined.
- `LearningUnit`, `Question`, `QuestionDraft`, and `Video` already have stable
  identifiers and version/timestamp fields in their respective contracts or
  repositories. The generic Firestore repository rejects stale versions through
  OCC and appends audit notifications around mutations.
- The domain model requires locked versions, review decisions, workflow
  transitions, and audit events to be immutable. A correction therefore cannot
  rewrite an approved publication or overwrite a prior review decision.
- The canonical workflow remains the existing 15-stage engine and transition
  matrix. The product-pipeline contract says improvement/revision re-enters at
  Stage 01; it does not authorize a new correction workflow.
- Existing planning DTOs and linked-artifact projections intentionally omit
  author, reviewer, audit, provider, notes, and OCC metadata from audience-safe
  responses.
- S11-T06 tracking explicitly marked the correction-review model
  `PROPOSED / UNAPPROVED`; no later accepted ADR or owner approval was found.

### Decision drivers and constraints

1. Meet the stated requirement to identify affected linked publications without
   rewriting their historical content.
2. Keep Firestore as the only transactional source of truth.
3. Reuse repository OCC, authorization, audit, and workflow authorities.
4. Preserve GAR-02, including explicit audited System Administrator overrides.
5. Keep internal review evidence out of audience-facing projections.
6. Avoid a new workflow stage, recommendation engine, bulk migration, or
   compatibility-breaking change.
7. Make duplicate, stale, and partially failed requests deterministic and
   auditable.

### Options considered

#### Option A — Minimal additive correction-review model (recommended, pending approval)

Add a correction evidence record associated with a LearningUnit and an additive
review-flag record for each affected linked artifact. These are operational
records, not replacements for the artifact or workflow documents. A correction
would reference the immutable source artifact version that triggered review and
would create flags for the linked artifacts that require human reassessment.

**Requirement and user impact:** Covers the roadmap exit criterion by allowing a
creator/reviewer to see which Intro, Worked Examples, Challenge, or alternate
format artifacts require review. Historical publications remain visible and
unchanged. The queue is an operational view, not an automatic republisher.

**Proposed data and version semantics:**

- `CorrectionEvidence`: immutable `id`, `learningUnitId`, source entity/version,
  correction reason/evidence, actor, timestamps, and OCC version for the
  LearningUnit mutation that establishes the correction. The exact source
  fields and whether a correction requires a new LearningUnit version are
  product-owner decisions.
- `ArtifactReviewFlag`: immutable flag identity, `learningUnitId`,
  `artifactType`, `artifactId`, `artifactVersionAtFlag`, `correctionId`,
  lifecycle status, assigned/acted-on actor fields, timestamps, and OCC
  version. Existing artifact documents are not rewritten solely to add a flag.
- Firestore repositories own these records; a domain service owns validation,
  affected-artifact selection, lifecycle rules, and authorization.

**Proposed lifecycle:** `OPEN` -> `IN_REVIEW` -> `CLEARED` or `REQUIRES_REVISION`.
`REQUIRES_REVISION` means the linked artifact must re-enter its existing
workflow at Stage 01; it is not a new workflow state. `CLEARED` records that a
human reviewed the artifact against the correction. Terminal decisions are
append-only; reopening requires a new flag or correction event rather than
editing history.

**Role/capability matrix (proposed):**

| Operation | Author/creator | Reviewer/QA | Content lead/manager | System Administrator |
| --- | --- | --- | --- | --- |
| Submit correction evidence | Own resource only, if product approves | Authorized linked resource | Authorized linked resource | Any permitted resource |
| Create/propagate flags | No direct bypass; service derives flags | Yes, if assigned capability | Yes | Yes |
| Mark `IN_REVIEW` / `CLEARED` | Not on own artifact under GAR-02 | Yes, never self-approve | Yes, subject to GAR-02 | Yes with explicit confirmation and audited reason |
| Mark `REQUIRES_REVISION` | No | Yes | Yes | Yes with explicit confirmation and audited reason |

This matrix is illustrative until the owner confirms capability names and
whether authors may submit evidence for their own artifacts. GAR-02 must remain
strict for review/clearance decisions.

**Concurrency and duplicates:** Creation must require the current expected
LearningUnit version and reject stale requests with the existing OCC conflict.
A deterministic idempotency key derived from correction identity, artifact
identity, and source version should make retries return the existing flag
instead of duplicating it; the exact key contract requires approval. A flag
whose `artifactVersionAtFlag` no longer equals the current artifact version
must not be silently cleared; the service should require a fresh review against
the current version.

**Audit and reasons:** Append immutable events for correction submission,
flag creation, status transitions, clearance, revision requirement, and
administrator override. Human decisions that reject or require revision must
require a non-empty reason; administrator overrides must preserve the existing
explicit confirmation and minimum 10-character audited reason rule. Audit
payloads must contain identifiers, versions, action, actor, and reason, but no
secrets or audience-facing internal notes.

**Projection boundaries:** Internal queue APIs may expose flag status,
correction ID, artifact ID/type, source and current versions, actor assignment,
reasons, and audit timestamps to authorized staff. Audience-facing artifact
and publication responses must not expose correction IDs, review flags,
internal reasons, actor identity, OCC versions, or audit metadata.

**Compatibility, migration, and implementation scope:** Additive records avoid
rewriting existing questions, videos, drafts, scripts, or publications.
Legacy artifacts without a LearningUnit link remain outside the queue. No
production migration/backfill is required. S14-T03 would require new schemas,
repositories, a domain service, protected internal endpoints, and deterministic
unit/emulator tests; it must not modify the canonical workflow engine.

**Risks:** The system could over-flag artifacts if affected-artifact selection
is vague; reviewers could clear a stale version without rechecking; or a
correction record could be mistaken for approval/rejection in the 15-stage
workflow. These risks require explicit version binding, fail-closed
authorization, append-only decisions, and clear UI/API separation.

#### Option B — Defer correction review

Retain `correctionReview.supported: false`, revise Sprint 14 dependency and
exit planning, and do not add persistence or mutation. This is safest when the
product does not yet need operational correction tracking. It provides no way
to identify affected linked artifacts after a correction, so the Sprint 14 exit
criterion remains unmet and S14-T03/T04 stay blocked or must be replanned.

**Trade-offs:** Zero data-model and security risk, no migration, and no new
maintenance burden; however, creators must track corrections outside the CMS,
the stated requirement is not covered, and later implementation may cost more
once more artifacts exist.

### Recommendation

Recommend **Option A**, but keep it `PROPOSED / PENDING APPROVAL`. It is the
smallest design that satisfies the explicit “identify affected artifacts
without rewriting historical publications” requirement while reusing existing
Firestore repositories, OCC, audit, authorization, and the canonical workflow.
It does not justify a new workflow stage or automatic content mutation.

Implementation must not begin until the unresolved product-owner questions
below are answered and this ADR is explicitly changed to `ACCEPTED`.

### Unresolved product-owner questions

1. What constitutes authoritative correction evidence: a changed LearningUnit
   field/version, a reviewer-authored evidence record, or both?
2. Does submitting correction evidence increment the LearningUnit version, or is
   a separate correction version required?
3. Which linked artifact types and formats are affected by each correction, and
   may staff override the derived set?
4. Which exact roles/capabilities may submit evidence, assign reviews, clear
   flags, or require revision? May an author submit evidence for their own work?
5. Are `OPEN`, `IN_REVIEW`, `CLEARED`, and `REQUIRES_REVISION` sufficient, and
   may a terminal flag ever be reopened?
6. What idempotency key and duplicate-request behavior are required?
7. Must clearing a flag require an artifact's current OCC version and a new
   workflow review, or is an independent educational review sufficient?
8. Which internal queue fields may be exposed to each staff role, and which
   correction details must remain restricted?

### Proposed acceptance criteria for ADR-016

This ADR is ready to become `ACCEPTED` only when the owner confirms the
questions above and the implementation plan can demonstrate:

- A correction is bound to authoritative LearningUnit/source evidence and an
  immutable version.
- Affected linked artifacts receive deterministic, duplicate-safe review flags
  without historical artifact mutation or deletion.
- Every flag transition enforces capability, ownership, GAR-02, OCC, and
  append-only audit requirements.
- Stale source/artifact versions fail closed and cannot be silently cleared.
- Internal queue projections are separated from audience-safe artifact output.
- Emulator-backed synthetic tests cover creation, duplicate/stale requests,
  permissions, audit append, historical immutability, and cleanup.
