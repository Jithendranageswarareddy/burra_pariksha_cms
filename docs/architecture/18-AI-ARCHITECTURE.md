# 18 — ARTIFICIAL INTELLIGENCE (AI) ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 18 of 30-Stage Modernization Program — Authoritative Assistive AI Subsystem, Human-Gated Lifecycle & Prompt Governance

```
================================================================================
Document ID:       BP-ARCH-18-AI
Version:           18.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             46 Authoritative Architectural Dimensions:
                   Assistive AI Boundary, Human-Gated 7-Step Pipeline, Provider Abstraction,
                   Prompt Versioning, Multi-Layer Validation, Provenance Ledger,
                   State Separation, Rate Limiting & ₹0–₹100 Cost Governance
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-005, AP-009, AP-010, AP-011, AP-012)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md (Entity Lifecycle vs Job Execution vs AI State)
                   09-RBAC-CAPABILITY-MODEL.md (GAR-02 Anti-Self-Approval, Capability Matrix)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md (Proposals Sub-Collection)
                   14-MEDIA-ARCHITECTURE.md
                   15-API-CONTRACT.md (REST Envelopes, 202 Accepted, Idempotency-Key)
                   16-REALTIME-ARCHITECTURE.md (SSE Transport & AI Event Channels)
                   17-JOB-ASYNC-ARCHITECTURE.md (Cloud Tasks Hybrid Runner)
Downstream Stages: 19-SECURITY-ARCHITECTURE.md
                   20-ANALYTICS-ARCHITECTURE.md
                   21-AUDIT-OBSERVABILITY.md
                   22-COST-ARCHITECTURE.md
                   23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Master Rule:       AI is an ASSISTIVE SUBSYSTEM, NOT A WORKFLOW AUTHORITY.
                   Only authorized human action can mutate canonical BP-CMS data.
Budget Invariant:  Hard Initial Infrastructure Ceiling: ₹0–₹100 / month (Google AI Studio Free Tier)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Artificial Intelligence (AI) Architecture, Assistive Subsystem Specification, and Human-Gated Governance Model** for the Burra Pariksha Content Management System (BP-CMS). Its purpose is to define:
1. The structural boundaries and contracts governing generative and analytical Large Language Model (LLM) operations.
2. The canonical **Human-Gated 7-Step Lifecycle** that enforces human supremacy over all content mutations.
3. The provider and model abstraction layer that protects the codebase against vendor lock-in.
4. The prompt registry, versioning, template compilation, and immutable provenance tracking mechanisms.
5. The multi-layer validation pipeline (syntactic schema, domain business rules, safety/toxicity, pedagogical quality).
6. The strict separation of AI execution states from domain entity lifecycles, workflow transitions, and publication statuses.
7. The rate limiting, quota management, and token tracking architecture required to enforce the **₹0–₹100/month** project budget ceiling.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *conceptual and logical AI architecture*. It does **not** assert that runtime AI providers, Gemini API endpoints, live prompt injection pipelines, background worker processes, or client-side review dialogs have been implemented or activated.
2. **Zero Runtime Code Modification:** No application source code, Express router files (`src/server/routes.ts`), React frontend pages, or database collections are modified in Stage 18.
3. **No External Infrastructure or Paid Dependencies:** No paid AI credits, Vertex AI Enterprise contracts, or third-party vector databases are provisioned or assumed.
4. **Contractual Boundary:** Stage 18 establishes the binding architectural contract that **Stage 26 (Feature Contracts)**, **Stage 27 (Implementation)**, and **Stage 28 (Integration & Testing)** will physically implement and verify.

---

## 2. AI Architectural Principles

The AI subsystem in BP-CMS is governed by four immutable architectural principles derived from **Stage 04 (Architecture Principles)**:

### 2.1 Principle 1: Human Supremacy & Non-Authoritative AI (AP-009)
$$\text{AI Output} = \text{Advisory Proposal / Staged Candidate}$$
$$\text{AI Output} \neq \text{Canonical Business State}$$
AI is strictly an assistive copilot for educators, scriptwriters, and video producers. **AI agents possess zero workflow authority.** An LLM cannot approve a question, mark a script as finalized, validate a video cut, advance a workflow stage, or trigger publishing dispatch. Every AI-generated artifact must remain staged in a non-canonical draft container until an authorized human operator executes an explicit **Accept** or **Edit & Save** action.

### 2.2 Principle 2: Strict State Separation (AP-010 & Stage 08 Alignment)
$$\text{WorkflowInstance.currentStep} \neq \text{Question.lifecycleState} \neq \text{AsyncJobRecord.state} \neq \text{AiRequestRecord.state}$$
The transient execution state of an AI generation job (`REQUESTED`, `PROCESSING`, `COMPLETED`, `FAILED`) is completely decoupled from the lifecycle state of the target entity (`DRAFT`, `IN_REVIEW`, `APPROVED`). An AI failure must **never** corrupt or roll back canonical business state.

### 2.3 Principle 3: Immutable Traceability & Provenance (AP-014)
Every piece of AI-assisted content admitted to canonical persistence must maintain an unbroken chain of custody. The system records the exact model version, prompt template identifier, semantic version, SHA-256 prompt hash, input parameter snapshot, raw LLM completion, validation verdict, and human reviewer identity.

### 2.4 Principle 4: Zero-Cost Economic Invariant (AP-012)
The AI architecture must operate reliably within the project's strict infrastructure ceiling of **₹0 to ₹100 / month**. Provider integration must prioritize Google AI Studio's perpetual free tiers (up to 15 RPM, 1,500 requests/day for Gemini 2.5 Flash), utilizing local in-process mocking during development and offline testing.

---

## 3. Human-Gated Lifecycle (The Canonical 7-Step Pipeline)

All AI interactions across the 15-step studio workflow adhere strictly to the **Canonical 7-Step Lifecycle**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                         CANONICAL 7-STEP HUMAN-GATED AI LIFECYCLE                      │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   1. AI Request Ingest    │  • Client POSTs generation parameters
                        └─────────────┬─────────────┘  • Validates RBAC & Idempotency
                                      │                • Returns 202 Accepted (Stage 15)
                                      ▼
                        ┌───────────────────────────┐
                        │    2. Async Generation    │  • Cloud Tasks invokes worker (Stage 17)
                        └─────────────┬─────────────┘  • Compiles prompt with SHA-256 hash
                                      │                • Calls Provider via Adapter abstraction
                                      ▼
                        ┌───────────────────────────┐
                        │ 3. Multi-Layer Validation │  • Layer 1: Syntactic Zod Schema
                        └─────────────┬─────────────┘  • Layer 2: Business & Curriculum Rules
                                      │                • Layer 3: Safety & Constraint Filters
                                      ▼
                        ┌───────────────────────────┐
                        │   4. Staged Preview Stash │  • Writes candidate to `proposals/`
                        └─────────────┬─────────────┘  • Emits SSE signal to client (Stage 16)
                                      │                • Canonical entity REMAINS UNCHANGED
                                      ▼
                        ┌───────────────────────────┐
                        │    5. Human Review Gate   │  • Authorized Human inspects side-by-side
                        └─────────────┬─────────────┘  • UI renders diffs, quality & safe zones
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │    6a. Reject / Discard   │             │   6b. Accept / Edit-Save  │
   └─────────────┬─────────────┘             └─────────────┬─────────────┘
                 │ Proposal marked REJECTED                │ Authorized Human triggers
                 │ Zero canonical change                   │ canonical entity mutation
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │    7a. Terminal Discard   │             │   7b. Canonical Mutation  │
   └───────────────────────────┘             └───────────────────────────┘
```

---

## 4. Provider Abstraction

To prevent hard-coding BP-CMS to a single vendor or proprietary SDK, all AI operations interact exclusively through the abstract `AiProviderAdapter` interface:

```typescript
export interface AiProviderAdapter {
  readonly providerId: AiProviderId;
  
  generateStructured<TPayload, TSchema extends z.ZodType<TPayload>>(
    request: AiProviderRequest,
    outputSchema: TSchema
  ): Promise<AiProviderResponse<TPayload>>;

  generateText(
    request: AiProviderRequest
  ): Promise<AiProviderResponse<string>>;

  healthCheck(): Promise<AiProviderHealthStatus>;
  
  getModelCapabilities(modelId: AiModelId): AiModelCapabilities;
}
```

Implementations include:
- `GeminiAiStudioAdapter`: Primary production adapter using Google AI Studio REST SDK.
- `VertexAiAdapter`: Future enterprise adapter for GCP-managed billing.
- `LocalMockAiAdapter`: Offline deterministic test fixture adapter for local dev and CI.

---

## 5. Model Abstraction

The architecture abstracts LLMs into standard canonical identifiers:
```typescript
export enum AiModelId {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  LOCAL_MOCK = 'local-mock-v1',
}
```
Application code never requests raw model strings directly; it requests logical models based on task profiles (`DEFAULT_FAST`, `DEEP_REASONING`, `OFFLINE_MOCK`).

---

## 6. Provider and Model Configuration

Configuration is externalized in server environment variables:
- `AI_DEFAULT_PROVIDER`: `GEMINI`
- `AI_DEFAULT_MODEL`: `gemini-2.5-flash`
- `AI_DEEP_MODEL`: `gemini-2.5-pro`
- `AI_REQUEST_TIMEOUT_MS`: `45000` (45 seconds)
- `AI_MAX_RETRIES`: `3`
- `GEMINI_API_KEY`: Server-side secret; never leaked to frontend.
- Development vs Production: If `NODE_ENV === 'development'` and `GEMINI_API_KEY` is unset, the system defaults automatically to `LocalMockAiAdapter` with zero failure.

---

## 7. Prompt Management Framework

Prompts are managed as versioned code assets in the authoritative `PROMPT_TEMPLATE_REGISTRY`:
```typescript
export interface PromptTemplateDefinition {
  readonly promptId: string;
  readonly version: string;
  readonly taskType: AiTaskType;
  readonly model: AiModelId;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly systemInstruction: string;
  readonly userPromptTemplate: string;
  readonly requiredVariables: readonly string[];
  readonly outputSchemaName: string;
  readonly isActive: boolean;
  readonly owner: string;
  readonly lastModified: string;
}
```

---

## 8. Prompt Identity and Versioning

1. **Prompt Identity:** Follows standard taxonomy: `PRMPT-{DOMAIN}-{TASK}-{LOCALE}-V{VERSION}` (e.g. `PRMPT-QGEN-TELUGU-V1`).
2. **Semantic Versioning:** Format `MAJOR.MINOR.PATCH` (e.g. `1.1.0`).
3. **Cryptographic SHA-256 Digest:**
   $$\text{PromptHash} = \text{SHA-256}(\text{SystemInstruction} + \text{UserTemplate} + \text{Model} + \text{Temp})$$
4. **Auditability & Rollback:** Deactivating a buggy prompt version automatically cascades to the prior active version without requiring database schema changes.

---

## 9. AI Request Lifecycle

AI requests progress through a deterministic state machine:
```text
REQUESTED → VALIDATING → QUEUED → PROCESSING → COMPLETED
```
Failure and cancellation paths:
- `PROCESSING` $\to$ `FAILED_RETRYABLE` $\to$ `QUEUED` (when retries remain).
- `PROCESSING` $\to$ `FAILED_FATAL` (when safety or schema errors occur).
- `REQUESTED` / `QUEUED` $\to$ `CANCELLED` (on human abort).
- `PROCESSING` $\to$ `TIMED_OUT` (when worker fails heartbeat).

---

## 10. AI Response Lifecycle & Provenance

Every completed AI response generates an immutable `AiProvenanceRecord`:
```typescript
export interface AiProvenanceRecord {
  readonly provenanceId: string; // PROV-YYYYMMDD-XXXXXX
  readonly requestId: string;
  readonly entityId: string;
  readonly proposalId: string;
  readonly provider: AiProviderId;
  readonly model: AiModelId;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly promptHash: string; // 64-char SHA-256 hex
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly candidateTokens: number;
    readonly totalTokens: number;
  };
  readonly latencyMs: number;
  readonly generatedAt: string;
  readonly humanReviewerId: string;
  readonly reviewedAt: string;
  readonly decision: HumanReviewAction;
  readonly wasEdited: boolean;
  readonly editedFields: readonly string[];
}
```

---

## 11. Structured Output Contracts

All generative tasks emit strictly typed JSON conforming to Zod schemas. Free-form unstructured responses are prohibited for core studio entities.

### 11.1 Telugu Question Contract (`TeluguQuestionPayload`)
- `questionTextTelugu`: String ($\ge 10$ chars, Telugu Unicode regex `[\u0C00-\u0C7F]`).
- `optionsTelugu`: Exactly 4 unique options in Telugu script.
- `correctOptionIndex`: Integer in range `[0..3]`.
- `explanationTelugu`: Pedagogical explanation in Telugu.
- `bloomTaxonomyLevel`: `REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE`.
- `estimatedDifficulty`: `EASY | MEDIUM | HARD`.

### 11.2 Spoken Script Contract (`SpokenScriptPayload`)
- `hookTelugu`: High-energy 5-second video hook.
- `bodyTelugu`: Core explanation body (35–45 seconds).
- `callToActionTelugu`: 5-second engagement CTA.
- `estimatedReadTimeSeconds`: Integer (15 to 75 seconds).

---

## 12. Multi-Layer Validation Pipeline

Outputs pass four sequential validation gates:
1. **Layer 1: Syntactic Schema Gate** (Zod parsing, type boundaries, non-null guarantees).
2. **Layer 2: Business & Curriculum Gate** (SSC Class 10 curriculum compliance, Bloom levels).
3. **Layer 3: Safety & Constraint Gate** (Gemini strict safety filters, prompt injection neutralization).
4. **Layer 4: Telugu Orthography Gate** (Unicode range verification, distractor uniqueness, zero transliteration).

---

## 13. Business & Curriculum Domain Validation

Enforces specific pedagogical rules:
- **Distractor Length Symmetry:** Distractor choices must be within $\pm 30\%$ length of each other to avoid giveaway clues.
- **Syllabus Tagging:** Topic and subtopic must resolve to valid taxonomy nodes defined in Stage 06.
- **Explanation Completeness:** Must explain both why the correct answer is right and why the primary distractor is wrong.

---

## 14. Safety & Constraint Validation

- **Safety Filters:** Google Gemini safety settings configured to `BLOCK_LOW_AND_ABOVE` across HATE_SPEECH, HARASSMENT, SEXUALLY_EXPLICIT, and DANGEROUS_CONTENT.
- **Prompt Injection Defense:** External inputs are sanitized, escaped, and enclosed in immutable XML boundary tags (`<untrusted_context_input>`).

---

## 15. Preview Boundary & Proposal Staging

- **Physical Sub-Collection Isolation:** Stored under `questions/{id}/proposals/{proposalId}`.
- **Zero Root Mutation:** Root document `questions/{id}` remains unmodified with `lifecycleState = DRAFT`.
- **TTL Purge:** Unreviewed proposals expire and are archived after 14 days.

---

## 16. Human Review Operations

### 16.1 Operation: ACCEPT
- Copies proposal data verbatim into root entity fields.
- Records `decision: ACCEPT`, `wasEdited: false` in `AiProvenanceRecord`.

### 16.2 Operation: EDIT & SAVE
- Merges human edits into proposal data; validates against Zod schema.
- Records `decision: EDIT`, `wasEdited: true`, and list of modified field keys.

### 16.3 Operation: REJECT
- Flags proposal as `REJECTED`; records feedback reason.
- Zero mutation occurs on the canonical entity.

### 16.4 Operation: REGENERATE
- Marks proposal `REPLACED`; triggers new asynchronous generation job with adjusted parameters.

---

## 17. Versioning Architecture: AI Output vs. Canonical Entity

$$\text{AiOutputVersion} \neq \text{CanonicalEntityVersion}$$
- **AI Proposal Version:** Ephemeral, generation-run-specific (`run-1`, `run-2`). Discarded on rejection.
- **Canonical Entity Version:** Durable, monotonic counter (`version: 1`, `version: 2`) incremented **only** on human Accept or Edit-Save via Optimistic Concurrency Control (OCC).

---

## 18. Retry Strategy & Failure Classification

Reusing the **Stage 17 Retry Architecture**:
- **Transient (Retryable):** HTTP 429 (Rate Limit), 503 (Provider Down), Socket Timeouts. Exponential backoff ($2\text{s}, 4\text{s}, 8\text{s}$) with full jitter.
- **Fatal (Non-Retryable):** 400 Bad Request, Safety Filter Triggered, Auth Failure, Malformed Template.
- **Circuit Breaker:** 5 consecutive 5xx errors trip circuit breaker open for 60 seconds.

---

## 19. Idempotency & Deduplication

Mutating requests supply or compute a deterministic key:
$$\text{IdempotencyKey} = \text{IDEMP-AI}-{TaskType}-{EntityId}-{Digest}$$
- Stored in Firestore `/idempotency_keys` with a 24-hour TTL.
- Duplicate in-flight requests receive `409 Conflict` or existing `jobId`; duplicate completed requests return cached proposal.

---

## 20. Concurrency & Worker Leases

- Worker claims job via atomic Firestore transaction with `leaseExpiresAt = now + 60s`.
- Entity-level concurrency limit: Maximum 1 active generation job per entity at any time.

---

## 21. Rate Limiting Architecture

Protects Google AI Studio free tier limits:
- **Global Provider Bucket:** Max 10 RPM (within 15 RPM free tier).
- **User Bucket:** Max 3 requests / minute, 30 requests / day per creator.
- **Feature Bucket:** Max 2 concurrent jobs across all studio question generation.

---

## 22. Cost Control & Free-Tier Budget Proof

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.
- **Gemini 2.5 Flash Free Tier:** 15 RPM, 1,500 RPD, 1,000,000 TPM = **₹0.00 / month**.
- **Studio Workload:** Projected 40 requests/day ($\approx 2.6\%$ of daily free tier).
- **Total Projected Cost:** **₹0.00 / month** (100% Free-Tier Compliant).

---

## 23. Usage Tracking & Token Metering

Every generation records:
- `promptTokens`: Input token count.
- `candidateTokens`: Output completion token count.
- `totalTokens`: Combined billable token volume.
- Daily aggregation job sums studio token consumption; alerts administrator if utilization exceeds $70\%$ of free tier.

---

## 24. RBAC & Security Boundary

Grounded in **Stage 09 (RBAC & Capabilities)**:
- Generation requires `QUESTION_CREATE` or `SCRIPT_CREATE`.
- Review requires `QUESTION_REVIEW` or `SCRIPT_REVIEW`.
- **Anti-Self-Approval (GAR-02):** The creator who initiated AI drafting cannot approve the final question into `APPROVED` status.
- Secrets are stored server-side only in `process.env.GEMINI_API_KEY`.

---

## 25. Audit & Observability Integration

Grounded in anticipatory **Stage 21 (Audit & Observability)**:
All AI lifecycle events emit immutable audit entries to `/audit_events`:
- `AI_GENERATION_REQUESTED`
- `AI_GENERATION_COMPLETED`
- `AI_VALIDATION_FAILED`
- `AI_PROPOSAL_ACCEPTED`
- `AI_PROPOSAL_EDITED`
- `AI_PROPOSAL_REJECTED`

---

## 26. Stage 17 Asynchronous Job Integration

- Integrated as `AsyncJobType.AI_GENERATION`.
- Scheduled via Google Cloud Tasks push queue invoking internal authenticated endpoint (`POST /api/v1/jobs/execute`).
- Decouples `AsyncJobRecord.state` from `AiRequestRecord.state`.

---

## 27. Stage 16 Realtime Integration (SSE Synergy)

- Emits `JOB_STATUS_UPDATED` and `AI_PROPOSAL_GENERATED` events to `entity:question:{id}` channel.
- Frontend subscribes via EventSource to update UI dynamically without polling.

---

## 28. Stage 08 State Model Alignment

Strict separation of independent dimensions:
$$\text{WorkflowInstance.currentStep} \neq \text{Question.lifecycleState} \neq \text{AsyncJobRecord.state} \neq \text{AiRequestRecord.state} \neq \text{Publication.publicationState}$$
AI execution state never directly overwrites workflow step or entity lifecycle state.

---

## 29. Workflow Integration (15-Step Studio Touchpoints)

- **Step 01 (Question Ideation):** Draft questions, options, explanations.
- **Step 02 (Curriculum Verification):** Fact-check and Bloom classification assistance.
- **Step 03 (Script Drafting):** Spoken Telugu teleprompter scripts.
- **Step 08 (Thumbnail Concept):** Title typography & safe-zone framing.
- **Step 15 (Performance Intelligence):** Retention curve misconception synthesis.

---

## 30. Domain & Data Integration

- Staged in Firestore sub-collection: `questions/{id}/proposals/{proposalId}`.
- Provenance ledger stored in: `ai_provenance/{provenanceId}`.
- Conforms strictly to Stage 13 data contracts (`data-contracts.ts`).

---

## 31. API Integration Contracts

Defined in accordance with Stage 15:
- `POST /api/v1/ai/generate`: Initiates job, returns `202 Accepted` with `jobId`.
- `GET /api/v1/ai/requests/:id`: Returns request status and staged proposals.
- `POST /api/v1/ai/proposals/:id/decision`: Submits human review action (`ACCEPT`, `EDIT`, `REJECT`).

---

## 32. Frontend Information Architecture Integration

- Embedded directly in Step 01, Step 03, and Step 15 Workspaces.
- Side-by-side diff viewer for original vs AI vs edited Telugu text.
- Safe-zone preview overlay for video thumbnails.

---

## 33. Observability, Telemetry & Metrics

Metrics emitted to Cloud Monitoring:
- `ai_request_latency_seconds` (p50, p95, p99).
- `ai_tokens_consumed_total` (by model and task type).
- `ai_validation_failure_count` (by layer).
- `ai_human_acceptance_rate` ($\frac{\text{accepted} + \text{edited}}{\text{total proposals}}$).

---

## 34. Provider Decision Matrix

```text
┌──────────────────────┬─────────┬──────────┬──────────┬──────────┐
│ Criteria             │ Weight  │ Gemini AI│ Vertex AI│ OpenAI   │
│                      │         │ Studio   │ Enterpr. │ API      │
├──────────────────────┼─────────┼──────────┼──────────┼──────────┤
│ Zero-Cost Compliance │ 2.0     │ 10.0     │ 6.0      │ 1.0      │
│ Telugu Fluency       │ 1.5     │ 9.5      │ 9.5      │ 7.0      │
│ Free Tier Generosity │ 1.5     │ 10.0     │ 4.0      │ 1.0      │
│ Cloud Run Synergy    │ 1.0     │ 10.0     │ 10.0     │ 8.0      │
│ Operational Simplic. │ 1.0     │ 9.5      │ 7.0      │ 9.0      │
├──────────────────────┼─────────┼──────────┼──────────┼──────────┤
│ TOTAL WEIGHTED SCORE │ 7.0 max │ 9.8 / 10 │ 7.1 / 10 │ 4.7 / 10 │
└──────────────────────┴─────────┴──────────┴──────────┴──────────┘
```
**Decision:** Google AI Studio is selected as the primary production provider.

---

## 35. Model Decision Criteria

1. **Default Model:** `gemini-2.5-flash` for all standard generation and verification tasks ($< 4\text{s}$ latency, high RPM).
2. **Deep Reasoning Model:** `gemini-2.5-pro` strictly for Step 15 complex retention curve analysis.
3. **Local Dev Model:** `local-mock-v1` for unit testing and offline development.

---

## 36. Cost Decision Matrix

```text
┌──────────────────────┬────────────────────────┬────────────────────────┐
│ Mechanism            │ Projected Monthly Cost │ Budget Ceiling Fit     │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ Gemini 2.5 Flash     │ ₹0.00 / month          │ PASSED (100% Free)     │
│ Gemini 2.5 Pro (Cap) │ ₹0.00 / month          │ PASSED (Within Quota)  │
│ Cloud Tasks Push     │ ₹0.00 / month          │ PASSED (1M Tasks Free) │
│ Paid OpenAI / Claude │ ₹3,000 – ₹10,000 / mo  │ FAILED (Breaches ₹100) │
└──────────────────────┴────────────────────────┴────────────────────────┘
```

---

## 37. Migration & Brownfield Implications

- Replaces legacy unmonitored `geminiClient` in `src/server/routes.ts` with structured `AiProviderAdapter`.
- Eliminates client-side mock timers simulating AI renders.
- Migrates existing legacy prompt strings into the typed `PROMPT_TEMPLATE_REGISTRY`.

---

## 38. Comprehensive Testing Requirements

16 mandatory test suites defined:
- `TEST-AI-01`: Valid Telugu question generation passes all 4 validation layers.
- `TEST-AI-02`: Missing required prompt variables throws `400 Bad Request`.
- `TEST-AI-03`: Malformed JSON triggers schema error and retry.
- `TEST-AI-04`: Safety filter violation flags `FAILED_FATAL` without retry.
- `TEST-AI-05`: Duplicate submission with same `Idempotency-Key` returns existing job.
- `TEST-AI-06`: Provider 429 triggers exponential backoff retry.
- `TEST-AI-07`: Staged proposal written to `/proposals/` does NOT modify canonical document.
- `TEST-AI-08`: Human `ACCEPT` action commits proposal to canonical entity and logs provenance.
- `TEST-AI-09`: Human `EDIT` action records `wasEdited: true` and edited field names.
- `TEST-AI-10`: Human `REJECT` action archives proposal with zero canonical change.
- `TEST-AI-11`: AI regeneration increments proposal version without replacing canonical version.
- `TEST-AI-12`: AI agent blocked from executing human-gated workflow transitions (AP-009).
- `TEST-AI-13`: Global rate limiter throttles requests exceeding 10 RPM.
- `TEST-AI-14`: Local mock adapter executes offline with zero network calls.
- `TEST-AI-15`: SSE event `JOB_STATUS_UPDATED` delivered upon generation completion.
- `TEST-AI-16`: Cryptographic SHA-256 prompt hash verified in provenance record.

---

## 39. Open Decisions & Conflict Registers

### 39.1 Job Architecture Records (JAR-AI)
- **JAR-AI-01 (Approved):** Adopt Gemini 2.5 Flash as standard production model.
- **JAR-AI-02 (Approved):** Mandate Telugu Unicode regex in Layer 1 validation.

### 39.2 Conflict Register (JACR-AI)
- **JACR-AI-01 (Resolved):** Worker buffering adopted for production; token streaming reserved for future playground.
- **JACR-AI-02 (Deferred):** Multi-tenant free-tier terms validation deferred to Stage 22.

---

## 40. Architecture Decision Records (ADR)

- **ADR-AI-01:** Adopt `gemini-2.5-flash` via Google AI Studio as the primary production model to ensure ₹0.00 operational cost.
- **ADR-AI-02:** Enforce the Human-Gated 7-Step Lifecycle: AI output must never directly mutate canonical domain data.
- **ADR-AI-03:** Store unreviewed AI outputs in an isolated `/proposals/` sub-collection, completely separate from root entity documents.
- **ADR-AI-04:** Mandate immutable SHA-256 prompt hashing and provenance ledger recording for every accepted generation.
- **ADR-AI-05:** Strictly forbid commercial LLM APIs with recurring base subscription fees under the ₹0–₹100/mo budget ceiling.

---

## 41. Stage 18 Acceptance Criteria & Anti-Overclaim Confirmation

### 41.1 Acceptance Criteria Checklist
- [x] AI architectural principles and AP-009 non-authoritative boundary defined.
- [x] Canonical 7-Step Human-Gated Lifecycle established.
- [x] Provider abstraction (`AiProviderAdapter`) and error mapping specified.
- [x] Model abstraction, tiering, and selection criteria defined.
- [x] Prompt management, semantic versioning, and SHA-256 hashing specified.
- [x] Multi-layer validation pipeline (Schema, Business, Safety, Telugu) defined.
- [x] Preview boundary and non-canonical proposal stashing documented.
- [x] Human review actions (ACCEPT, EDIT, REJECT, REGENERATE) defined.
- [x] Separation of AI Output Version from Canonical Entity Version established.
- [x] Integration contracts defined for Stage 17 (Async Jobs), Stage 16 (Realtime SSE), and Stage 08 (State Model).
- [x] ₹0.00 / month cost proof documented under Google AI Studio free tier.
- [x] Zero runtime code files modified during Stage 18.

### 41.2 Final Anti-Overclaim Statement
**Stage 18 AI architecture is documented and contractually defined; runtime AI provider clients, prompt injection pipelines, and worker implementations remain for later implementation stages.**
