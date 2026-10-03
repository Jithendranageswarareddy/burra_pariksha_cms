# 18 — ARTIFICIAL INTELLIGENCE (AI) ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 18 of 30-Stage Modernization Program — Authoritative Assistive AI Subsystem, Human-Gated Lifecycle & Prompt Governance

```
================================================================================
Document ID:       BP-ARCH-18-AI
Version:           18.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Assistive AI Boundary, Human-Gated 7-Step Pipeline, Provider Abstraction,
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

### Principle 1: Human Supremacy & Non-Authoritative AI (AP-009)
$$\text{AI Output} = \text{Advisory Proposal / Staged Candidate}$$
$$\text{AI Output} \neq \text{Canonical Business State}$$
AI is strictly an assistive copilot for educators, scriptwriters, and video producers. **AI agents possess zero workflow authority.** An LLM cannot approve a question, mark a script as finalized, validate a video cut, advance a workflow stage, or trigger publishing dispatch. Every AI-generated artifact must remain staged in a non-canonical draft container until an authorized human operator executes an explicit **Accept** or **Edit & Save** action.

### Principle 2: Strict State Separation (AP-010 & Stage 08 Alignment)
$$\text{WorkflowInstance.currentStep} \neq \text{Question.lifecycleState} \neq \text{AsyncJobRecord.state} \neq \text{AiRequestRecord.state}$$
The transient execution state of an AI generation job (`REQUESTED`, `PROCESSING`, `COMPLETED`, `FAILED`) is completely decoupled from the lifecycle state of the target entity (`DRAFT`, `IN_REVIEW`, `APPROVED`). An AI failure must **never** corrupt or roll back canonical business state.

### Principle 3: Immutable Traceability & Provenance (AP-014)
Every piece of AI-assisted content admitted to canonical persistence must maintain an unbroken chain of custody. The system records the exact model version, prompt template identifier, semantic version, SHA-256 prompt hash, input parameter snapshot, raw LLM completion, validation verdict, and human reviewer identity.

### Principle 4: Zero-Cost Economic Invariant (AP-012)
The AI architecture must operate reliably within the project's strict infrastructure ceiling of **₹0 to ₹100 / month**. Provider integration must prioritize Google AI Studio's perpetual free tiers (up to 15 RPM, 1,500 requests/day for Gemini 2.5 Flash), utilizing local in-process mocking during development and offline testing.

---

## 3. The Human-Gated AI Canonical Lifecycle

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

### Stage 1: AI Request Ingest
An authorized studio operator initiates an assistive action from the workspace UI (e.g. "Generate Telugu Question" in Step 01). The backend validates request parameters against Zod contracts, checks RBAC capabilities (`QUESTION_CREATE`), verifies the client's `Idempotency-Key`, inserts an `AiRequestRecord` with state `REQUESTED`, and returns `202 Accepted`.

### Stage 2: Asynchronous Generation
The asynchronous worker (invoked via Cloud Tasks push queue per Stage 17) acquires the job lease, updates the AI request state to `PROCESSING`, retrieves the active prompt template, compiles context variables, calculates the immutable SHA-256 prompt hash, and invokes the configured `AiProviderAdapter`.

### Stage 3: Multi-Layer Validation Pipeline
The raw completion is intercepted by the validation engine before reaching any application state. It passes through four sequential validation gates:
1. Syntactic JSON Schema validation (Zod).
2. Business domain and SSC Class 10 curriculum compliance.
3. Safety, toxicity, and hallucination boundary checks.
4. Telugu Unicode orthography and distractor uniqueness verifications.
*If validation fails, the request transitions to `FAILED_FATAL` or triggers an automatic internal retry (if retry limits allow). Failed outputs are never staged for preview.*

### Stage 4: Staged Preview Stash
Validated AI outputs are written into a non-canonical, isolated sub-collection: `/questions/{id}/proposals/{proposalId}`. The target entity's canonical fields remain completely untouched. A real-time notification (`JOB_STATUS_UPDATED` / `AI_PROPOSAL_GENERATED`) is broadcast over SSE (Stage 16).

### Stage 5: Human Review Gate (The Non-Negotiable Boundary)
The creator opens the Review Workspace. The UI renders the staged AI proposal side-by-side with curriculum requirements. The user can inspect the generated Telugu text, distractors, explanation, and Bloom taxonomy rating.

### Stage 6: Human Action Decision
The human reviewer executes one of four exclusive actions:
- **ACCEPT:** The human accepts the proposal without modifications.
- **EDIT:** The human edits specific fields (e.g. tweaking Telugu phrasing or correcting an option) and saves.
- **REJECT:** The human rejects the proposal. It is flagged as `REJECTED` and archived for audit.
- **REGENERATE:** The human rejects the current proposal and triggers a new generation cycle with adjusted parameters.

### Stage 7: Canonical Mutation & Workflow Progression
Only **Stage 6b (Accept or Edit & Save)** produces a canonical mutation. The backend executes a Firestore atomic transaction that:
1. Copies the accepted or edited payload into the canonical entity fields (`Question.questionTextTelugu`, `Question.optionsTelugu`, etc.).
2. Creates an immutable `AiProvenanceRecord` linking the canonical entity version to the originating `AiRequestRecord` and human reviewer ID.
3. Advances the entity lifecycle state (e.g. from `DRAFT` to `IN_REVIEW`), complying strictly with the GAR-02 anti-self-approval rule.

---

## 4. Provider Architecture & Abstraction

To prevent hard-coding BP-CMS to a single vendor or proprietary SDK, all AI operations interact exclusively through the abstract `AiProviderAdapter` contract.

```
                           ┌───────────────────────────┐
                           │      Application Core     │
                           │   (Services / Workflows)  │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │    AiProviderAdapter      │  <<Interface>>
                           │  - generateStructured()   │
                           │  - generateText()         │
                           │  - healthCheck()          │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
   ┌───────────────────────────┐ ┌───────────────┐ ┌───────────────────────────┐
   │   GeminiAiStudioAdapter   │ │ VertexAiAdap. │ │   LocalMockAiAdapter      │
   │   (Primary Production)    │ │ (Future Ent.) │ │ (Local Dev & Unit Tests)  │
   │  - Google AI Studio API   │ │ - GCP Vertex  │ │ - Deterministic Fixtures  │
   │  - Perpetual Free Tier    │ │ - Enterprise  │ │ - Zero Network Calls      │
   └───────────────────────────┘ └───────────────┘ └───────────────────────────┘
```

### 4.1 The Provider Adapter Contract
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

export interface AiProviderRequest {
  readonly modelId: AiModelId;
  readonly systemInstruction: string;
  readonly userPrompt: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly safetySettings: AiSafetySetting[];
  readonly traceId: string;
  readonly timeoutMs: number;
}

export interface AiProviderResponse<T> {
  readonly rawText: string;
  readonly parsedData: T;
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly candidateTokens: number;
    readonly totalTokens: number;
  };
  readonly finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'OTHER';
  readonly latencyMs: number;
  readonly providerRequestId?: string;
}
```

### 4.2 Standardized Provider Error Mapping
All provider-specific SDK exceptions (e.g. Google Generative AI errors, HTTP 429s, gRPC status codes) are translated into canonical domain errors:
```text
┌──────────────────────────────────────┬────────────────────────┬──────────────────────┐
│ Raw Provider Error                   │ Canonical Error Code   │ Retry Disposition    │
├──────────────────────────────────────┼────────────────────────┼──────────────────────┤
│ HTTP 429 Too Many Requests           │ AI_RATE_LIMITED        │ RETRYABLE (Backoff)  │
│ HTTP 503 Service Unavailable         │ AI_PROVIDER_DOWN       │ RETRYABLE (Backoff)  │
│ Socket Hangup / ETIMEDOUT            │ AI_NETWORK_TIMEOUT     │ RETRYABLE (Backoff)  │
│ Safety Block / FinishReason SAFETY   │ AI_SAFETY_VIOLATION    │ FATAL (Non-retryable)│
│ Malformed JSON in Response           │ AI_SCHEMA_PARSE_ERROR  │ RETRYABLE (Max 2)    │
│ HTTP 400 Bad Request / Invalid Param │ AI_INVALID_REQUEST     │ FATAL (Non-retryable)│
│ HTTP 401 Unauthorized / Invalid Key │ AI_AUTH_FAILURE        │ FATAL (Admin Alert)  │
└──────────────────────────────────────┴────────────────────────┴──────────────────────┘
```

---

## 5. Model Abstraction & Decision Matrix

BP-CMS defines a multi-tiered model hierarchy to optimize cost, latency, and reasoning depth:

```text
┌─────────────────────┬──────────────────┬──────────────┬───────────────┬──────────────────────────┐
│ Canonical Model ID  │ Target Workload  │ Latency      │ Cost / Quota  │ Selection Rationale      │
├─────────────────────┼──────────────────┼──────────────┼───────────────┼──────────────────────────┤
│ `gemini-2.5-flash`  │ Primary QGen,    │ 1.5s – 4.0s  │ ₹0.00 / mo    │ Fast, high Telugu fluency│
│                     │ Scripting, Tags  │              │ (Free Tier)   │ low token cost, high RPM │
├─────────────────────┼──────────────────┼──────────────┼───────────────┼──────────────────────────┤
│ `gemini-2.5-pro`    │ Complex Audit,   │ 4.0s – 12.0s │ ₹0.00 / mo    │ Deep reasoning, rigorous │
│                     │ Misconceptions   │              │ (Free Tier)   │ psychometric analysis    │
├─────────────────────┼──────────────────┼──────────────┼───────────────┼──────────────────────────┤
│ `local-mock-v1`     │ Local Dev & CI   │ < 50ms       │ ₹0.00         │ Offline deterministic    │
│                     │ Unit Testing     │              │ (Zero Cloud)  │ test fixtures, no keys   │
└─────────────────────┴──────────────────┴──────────────┴───────────────┴──────────────────────────┘
```

### Model Selection Criteria:
1. **Flash as Default:** `gemini-2.5-flash` is the default model for $90\%$ of studio tasks (Telugu question drafting, spoken script phrasing, safe-zone layout calculations).
2. **Pro by Exception:** `gemini-2.5-pro` is gated exclusively to deep pedagogical tasks: analyzing cross-platform retention drop-offs, detecting curriculum misconceptions in Step 15, and performing multi-point blind verification.
3. **Pro Model Administrative Gate:** Invoking `gemini-2.5-pro` requires the `AI_PRO_INVOKE` capability or specific curriculum lead assignment to prevent quota exhaustion.

---

## 6. Prompt Management Framework

Prompts are treated as **version-controlled source code**, not ad-hoc strings in application handlers.

### 6.1 Prompt Template Structure
Every prompt in BP-CMS is defined as a typed `PromptTemplateDefinition`:
```typescript
export interface PromptTemplateDefinition {
  readonly promptId: string;
  readonly version: string; // Semantic versioning (e.g. "1.1.0")
  readonly taskType: AiTaskType;
  readonly model: AiModelId;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly systemInstruction: string;
  readonly userPromptTemplate: string;
  readonly requiredVariables: readonly string[];
  readonly outputSchemaName: string;
  readonly isActive: boolean;
  readonly owner: string; // Team or domain owner
  readonly lastModified: string;
}
```

### 6.2 The Authoritative Prompt Registry
The application maintains an immutable registry of prompt templates:
1. `PRMPT-QGEN-TELUGU-V1`: Class 10 SSC Telugu Question Generation (Class, Subject, Topic, Bloom Level).
2. `PRMPT-SCRIPT-SPOKEN-V1`: Conversational 60-second vertical teleprompter scripts in Telugu.
3. `PRMPT-SAFEZONE-TAGS-V1`: Vertical video safe-zone analysis and platform title tag formatting.
4. `PRMPT-LOOP-INTEL-V1`: Step 15 Audience retention drop-off and misconception analysis.

---

## 7. Prompt Identity, Versioning & Rollback

### 7.1 Semantic Prompt Versioning
Prompt versions adhere to semantic conventions:
- **PATCH (`1.0.0` $\to$ `1.0.1`):** Wording adjustments or minor clarifications that do not change output schema.
- **MINOR (`1.0.0` $\to$ `1.1.0`):** Adding optional context variables or upgrading recommended base model.
- **MAJOR (`1.0.0` $\to$ `2.0.0`):** Breaking schema modifications, altering required variables, or restructuring JSON keys.

### 7.2 Immutable SHA-256 Prompt Digest
To ensure absolute auditability, prompt compilation produces an immutable cryptographic digest:
$$\text{PromptDigest} = \text{SHA-256}\left(\text{SystemInstruction} + \text{CompiledUserPrompt} + \text{ModelId} + \text{Temperature}\right)$$
This 64-character hex digest is recorded in the `AiProvenanceRecord`. Even if a template definition is subsequently edited in source code, historical generations remain cryptographically tied to the exact text that produced them.

### 7.3 Rollback Governance
In the event that an updated prompt produces lower-quality Telugu orthography or introduces subtle hallucinations:
1. The administrator or curriculum lead updates the `isActive` flag in the registry.
2. The runtime prompt compiler automatically resolves to the latest active version matching the major version line.
3. Rollback does not require application database migrations; it is executed via template configuration.

---

## 8. AI Request Model & Lifecycle

The AI request tracks execution progress from client dispatch to final worker completion.

```
                    ┌──────────────┐
                    │  REQUESTED   │  • Validates parameters & RBAC
                    └──────┬───────┘
                           │ Dispatched to Cloud Tasks
                           ▼
                    ┌──────────────┐
                    │  PROCESSING  │  • Worker acquires lease
                    └──────┬───────┘  • Calls LLM & validates schema
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
     ┌─────────────┐               ┌─────────────┐
     │  COMPLETED  │               │   FAILED_   │
     └─────────────┘               │  RETRYABLE  │
                                   └──────┬──────┘
                                          │ Attempts < Max
                                          ▼
                                   ┌─────────────┐
                                   │  FAILED_    │
                                   │   FATAL     │
                                   └─────────────┘
```

### 8.1 Authoritative AI Request States
- `REQUESTED`: Initial request persisted in Firestore; waiting for worker claiming.
- `PROCESSING`: Worker has claimed lease; LLM generation or validation actively executing.
- `COMPLETED`: Generation and multi-layer validation completed successfully; candidate stashed in `/proposals/`.
- `FAILED_RETRYABLE`: Encountered transient provider rate limit (429) or network timeout; queued for backoff retry.
- `FAILED_FATAL`: Validation failed, safety block triggered, or retries exhausted; terminal failure.
- `CANCELLED`: Aborted by client or superseded by a newer request before processing started.
- `TIMED_OUT`: Worker failed to report completion within `timeoutSeconds`.

---

## 9. AI Response Model & Provenance Ledger

Every validated AI generation creates an immutable **Provenance Ledger Record** (`AiProvenanceRecord`) that links the generated artifact to its originating request and human reviewer.

### 9.1 Provenance Record Schema
```typescript
export interface AiProvenanceRecord {
  readonly provenanceId: string; // PROV-YYYYMMDD-XXXXXX
  readonly requestId: string;
  readonly entityId: string;     // Canonical entity (e.g. Q-20261004-001)
  readonly proposalId: string;   // Staged proposal identifier
  readonly provider: AiProviderId;
  readonly model: AiModelId;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly promptHash: string;   // SHA-256 digest
  readonly tokenUsage: {
    readonly promptTokens: number;
    readonly candidateTokens: number;
    readonly totalTokens: number;
  };
  readonly latencyMs: number;
  readonly generatedAt: string;
  
  // Human Review Audit Fields
  readonly humanReviewerId: string;
  readonly reviewedAt: string;
  readonly decision: HumanReviewAction; // ACCEPT, EDIT, REJECT
  readonly wasEdited: boolean;
  readonly editedFields: readonly string[];
}
```

---

## 10. Structured Output Contracts

All generative AI operations must emit **strictly structured JSON**, adhering to strict Zod schemas. Free-form text completions without structured contracts are strictly prohibited for core domain assets.

### 10.1 Telugu Question Contract (`TeluguQuestionPayload`)
```typescript
export const TeluguQuestionPayloadSchema = z.object({
  questionTextTelugu: z
    .string()
    .min(10)
    .regex(/[\u0C00-\u0C7F]/, 'Question must contain valid Telugu Unicode characters'),
  optionsTelugu: z
    .array(
      z.object({
        optionIndex: z.number().int().min(0).max(3),
        textTelugu: z.string().min(1).regex(/[\u0C00-\u0C7F]/, 'Option must contain Telugu script'),
      })
    )
    .length(4, 'Must contain exactly 4 options')
    .refine(
      (options) => new Set(options.map((o) => o.textTelugu)).size === 4,
      { message: 'All 4 options must be unique' }
    ),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanationTelugu: z
    .string()
    .min(10)
    .regex(/[\u0C00-\u0C7F]/, 'Explanation must contain Telugu script'),
  bloomTaxonomyLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  estimatedDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});
```

### 10.2 Teleprompter Spoken Script Contract (`SpokenScriptPayload`)
```typescript
export const SpokenScriptPayloadSchema = z.object({
  hookTelugu: z.string().min(5).max(150),
  bodyTelugu: z.string().min(20).max(1000),
  callToActionTelugu: z.string().min(5).max(150),
  estimatedReadTimeSeconds: z.number().int().min(15).max(75),
  pronunciationNotes: z.array(z.string()).optional(),
});
```

---

## 11. Multi-Layer Validation Pipeline

Validation is a strict multi-layer gate. An output must pass **all four layers** before being staged for preview.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-LAYER AI VALIDATION PIPELINE                            │
├─────────┬────────────────────────────┬─────────────────────────────────────────────────┤
│ Layer   │ Name                       │ Validation Scope                                │
├─────────┼────────────────────────────┼─────────────────────────────────────────────────┤
│ Layer 1 │ Syntactic Schema Gate      │ Valid JSON, Zod type enforcement, field bounds, │
│         │                            │ correct array lengths, non-null values.         │
├─────────┼────────────────────────────┼─────────────────────────────────────────────────┤
│ Layer 2 │ Business & Curriculum Gate │ Class 10 SSC syllabus alignment, valid Bloom    │
│         │                            │ taxonomy level, correct option index in [0..3]. │
├─────────┼────────────────────────────┼─────────────────────────────────────────────────┤
│ Layer 3 │ Safety & Constraint Gate   │ Zero hate speech, zero political bias, zero     │
│         │                            │ inappropriate content, no hallucinated metadata.│
├─────────┼────────────────────────────┼─────────────────────────────────────────────────┤
│ Layer 4 │ Telugu Orthography Gate    │ Telugu Unicode range (U+0C00–U+0C7F) check, no  │
│         │                            │ English transliteration, 4 distinct options.    │
└─────────┴────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 12. Business & Curriculum Domain Validation

Beyond syntactic checks, Layer 2 enforces domain-specific educational rules:
1. **Option Symmetry:** Distractors must be of comparable character length ($\pm 30\%$) to prevent obvious visual clues.
2. **Pedagogical Alignment:** The question subject and topic must match valid SSC 10th Class curriculum tags defined in Stage 06 (`DOMAIN_MODEL`).
3. **Explanation Quality:** Explanations must not simply repeat the correct option; they must articulate *why* the distractor choices are incorrect.

---

## 13. Safety & Constraint Validation

Layer 3 enforces strict AI safety guidelines:
1. **Safety Filter Configuration:** Prompts execute with Gemini's strictest safety thresholds:
   - `HARM_CATEGORY_HATE_SPEECH`: BLOCK_LOW_AND_ABOVE
   - `HARM_CATEGORY_HARASSMENT`: BLOCK_LOW_AND_ABOVE
   - `HARM_CATEGORY_SEXUALLY_EXPLICIT`: BLOCK_LOW_AND_ABOVE
   - `HARM_CATEGORY_DANGEROUS_CONTENT`: BLOCK_LOW_AND_ABOVE
2. **Prompt Injection Neutralization:** User inputs (e.g. topic names, notes) are sanitized and wrapped in strict XML delimiters (`<context_input>...</context_input>`) to prevent context escape or instruction hijacking.

---

## 14. Preview Boundary & Proposal Staging

To guarantee that non-reviewed AI content never corrupts canonical records:
1. **Physical Isolation:** Generated proposals are written to an isolated sub-collection:
   `questions/{questionId}/proposals/{proposalId}`
2. **Zero Canonical Impact:** The root document (`questions/{questionId}`) is never updated by the worker. The entity remains in `DRAFT` status with `lifecycleState = DRAFT`.
3. **TTL Clean-Up:** Staged proposals that receive no human review action within 14 days are automatically flagged as `EXPIRED` and purged.

---

## 15. Human Review Operations

The Review Workspace provides four explicit actions for authorized humans:

### 15.1 Action: ACCEPT
- **Precondition:** Reviewer has `QUESTION_CREATE` or `QUESTION_APPROVE` capability.
- **Action:** Copies proposal fields directly into the canonical `Question` document.
- **Result:** Canonical entity updated; `AiProvenanceRecord` written; proposal marked `ACCEPTED`.

### 15.2 Action: EDIT & SAVE
- **Precondition:** Reviewer modifies one or more fields in the UI editor.
- **Action:** Merges human edits into proposal payload; validates against Zod schema; commits merged data to canonical entity.
- **Result:** Canonical entity updated; `AiProvenanceRecord` records `wasEdited: true` and the list of modified field keys.

### 15.3 Action: REJECT
- **Precondition:** Reviewer deems proposal unsatisfactory or off-curriculum.
- **Action:** Proposal state set to `REJECTED`; human enters optional feedback note.
- **Result:** Zero mutation to canonical entity; feedback retained for prompt improvement.

### 15.4 Action: REGENERATE
- **Precondition:** Reviewer rejects current candidate and requests fresh generation.
- **Action:** Marks current proposal `REPLACED`; triggers new asynchronous generation job with adjusted temperature or prompt variables.

---

## 16. Versioning Architecture: AI Output vs. Canonical Entity

A fundamental rule of BP-CMS versioning:
$$\text{AiOutputVersion} \neq \text{CanonicalEntityVersion}$$

```text
┌─────────────────────────────────┬─────────────────────────────────┐
│ AI Proposal Versioning          │ Canonical Entity Versioning     │
├─────────────────────────────────┼─────────────────────────────────┤
│ • Keyed by `proposalId`         │ • Keyed by `questionId`         │
│ • Increments on each generation │ • Increments ONLY on human save │
│   run (e.g. run 1, run 2, run 3)│   via OCC `version` field       │
│ • Ephemeral; discarded if       │ • Durable; permanent audit      │
│   rejected by human             │   history and change logs       │
│ • Non-authoritative             │ • Authoritative source of truth │
└─────────────────────────────────┴─────────────────────────────────┘
```
*An AI regeneration can NEVER overwrite an already-approved canonical entity version without human sign-off.*

---

## 17. Asynchronous Execution & Stage 17 Integration

AI operations reuse the **Stage 17 Background Job Architecture**:
1. **Job Type:** Handled under `AsyncJobType.AI_GENERATION`.
2. **Runner:** Invoked via Cloud Tasks push queue (`POST /api/v1/jobs/execute`) in production; in-process runner in local dev.
3. **Priority:** Assigned `JobPriority.HIGH`.
4. **Timeout:** Execution timeout set to $60\,\text{seconds}$.
5. **Lease Locking:** Optimistic Firestore lease locking prevents concurrent workers from executing duplicate prompts for the same request.

---

## 18. Real-Time Integration (Stage 16 SSE Synergy)

AI job progression is surfaced to connected frontends using **Stage 16 Server-Sent Events (SSE)**:
- **Channel:** `entity:question:{questionId}` and `job:{jobId}`
- **Event:** `JOB_STATUS_UPDATED` (emitted on `PROCESSING`, `FAILED`, and `COMPLETED`).
- **Client Handling:** The studio UI displays a live spinner, progress bar, or toast notification without requiring polling or manual page refresh.

---

## 19. State Separation Invariant (Stage 08 Alignment)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STATE SEPARATION INVARIANT                                │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ State Dimension          │ Authorized States & Boundaries                              │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Workflow Step            │ 01_IDEATION .. 15_PERFORMANCE (Stage 07)                    │
│ Entity Lifecycle         │ DRAFT, IN_REVIEW, APPROVED, REJECTED (Stage 08)             │
│ Job Execution State      │ QUEUED, RUNNING, SUCCEEDED, FAILED_* (Stage 17)             │
│ AI Request State         │ REQUESTED, PROCESSING, COMPLETED, FAILED_* (Stage 18)       │
│ Publication State        │ SCHEDULED, DISPATCHED, LIVE, FAILED (Stage 08)              │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```
*AI Request State reflects generation progress only. It never mutates Workflow Step or Entity Lifecycle.*

---

## 20. Workflow Integration (15-Step Studio Touchpoints)

AI assists specific stages across the 15-step studio pipeline:
- **Step 01 (Question Ideation):** Generates draft questions, options, and explanations from curriculum topics.
- **Step 02 (Curriculum Verification):** Assists human verifiers with automated fact-checking and Bloom taxonomy classification.
- **Step 03 (Script Drafting):** Generates conversational spoken Telugu teleprompter scripts.
- **Step 08 (Thumbnail Concept):** Evaluates vertical safe zones and title typography framing.
- **Step 15 (Performance Intelligence):** Analyzes retention curves and social comments to identify student misconceptions.

---

## 21. Rate Limiting Architecture

To protect Google AI Studio's free tier quotas and prevent abuse, rate limiting is enforced across multiple tiers:

```text
┌──────────────────┬──────────────────────┬──────────────────────────────────────────────┐
│ Tier             │ Limit Threshold      │ Enforcement Mechanism                        │
├──────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ Global Provider  │ 10 requests / minute │ Token bucket in Redis / Memory (keeps well   │
│ (Gemini Free)    │ (under 15 RPM cap)   │ within 15 RPM free-tier limit)               │
├──────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ User Quota       │ 3 requests / minute; │ Prevents single user from exhausting studio  │
│                  │ 30 requests / day    │ daily allowance                              │
├──────────────────┼──────────────────────┼──────────────────────────────────────────────┤
│ Feature Limit    │ 2 concurrent jobs    │ Prevents burst job stacking                  │
│                  │ per question entity  │                                              │
└──────────────────┴──────────────────────┴──────────────────────────────────────────────┘
```

---

## 22. Cost Architecture & Free-Tier Budget Proof

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.

### 22.1 Google AI Studio Free Tier Verification
- **Model:** `gemini-2.5-flash`
- **Rate Limit:** 15 Requests Per Minute (RPM)
- **Daily Quota:** 1,500 Requests Per Day (RPD)
- **Token Quota:** 1,000,000 Tokens Per Minute (TPM)
- **Cost:** **₹0.00 / month** perpetually under Google AI Studio terms.

### 22.2 Monthly Studio Consumption Projection
$$\text{Expected Production} = 10\text{ videos/day} \times 4\text{ AI ops/video} = 40\text{ AI requests/day}$$
$$40\text{ requests/day} \ll 1,500\text{ free requests/day} \quad (\approx 2.6\% \text{ of free-tier quota})$$
**Total Projected AI Infrastructure Cost: ₹0.00 / month.**

---

## 23. Security & RBAC Boundary

Grounded in **Stage 09 (RBAC & Capabilities)**:
1. **Generation Capability:** Requesting AI generation requires `QUESTION_CREATE` or `SCRIPT_CREATE`.
2. **Review Capability:** Reviewing and accepting proposals requires `QUESTION_REVIEW` or `SCRIPT_REVIEW`.
3. **Anti-Self-Approval (GAR-02):** The author who requested AI generation cannot unilaterally approve the canonical entity into `APPROVED` status. A separate human verifier is required.
4. **Secret Protection:** Gemini API keys are strictly externalized in server-side environment variables (`GEMINI_API_KEY`) and are never exposed in client bundles, logs, or stored metadata.

---

## 24. Audit & Observability Integration

Grounded in anticipatory **Stage 21 (Audit & Observability)**:
Every AI lifecycle transition emits an immutable structured audit log to `/audit_events`:
- `AI_GENERATION_REQUESTED`: Actor ID, prompt ID, input parameters, trace ID.
- `AI_GENERATION_COMPLETED`: Provider, model, token usage, latency ms, prompt hash.
- `AI_VALIDATION_FAILED`: Validation errors, failure layer, raw output snippet.
- `AI_PROPOSAL_ACCEPTED`: Reviewer ID, proposal ID, canonical entity ID.
- `AI_PROPOSAL_EDITED`: Reviewer ID, edited field list, original vs edited diff.
- `AI_PROPOSAL_REJECTED`: Reviewer ID, rejection reason.

---

## 25. Retry Strategy & Failure Classification

Reusing the **Stage 17 Retry Architecture**:
- **Transient Failures (429, 503, ETIMEDOUT):** Retried up to 3 times with exponential backoff ($2\text{s}, 4\text{s}, 8\text{s}$).
- **Fatal Failures (Safety Block, 400 Bad Request, Auth Failure):** Zero retries; immediate transition to `FAILED_FATAL`.
- **Circuit Breaker:** If 5 consecutive requests fail with 5xx or timeouts, the provider adapter trips open for 60 seconds, returning immediate service unavailable errors to prevent quota burning.

---

## 26. Architecture Decision Records (ADR)

- **ADR-AI-01:** Adopt `gemini-2.5-flash` via Google AI Studio as the primary production model to ensure ₹0.00 operational cost.
- **ADR-AI-02:** Enforce the Human-Gated 7-Step Lifecycle: AI output must never directly mutate canonical domain data.
- **ADR-AI-03:** Store unreviewed AI outputs in an isolated `/proposals/` sub-collection, completely separate from root entity documents.
- **ADR-AI-04:** Mandate immutable SHA-256 prompt hashing and provenance ledger recording for every accepted generation.
- **ADR-AI-05:** Strictly forbid commercial LLM APIs with recurring base subscription fees (e.g. OpenAI Enterprise, Anthropic Claude Team) under the ₹0–₹100/mo budget ceiling.

---

## 27. Open Decisions & Conflict Registers

### 27.1 Job Architecture Records (JAR-AI)
- **JAR-AI-01 (Approved):** Use Gemini 2.5 Flash as default; gate Gemini 2.5 Pro behind specific permissions.
- **JAR-AI-02 (Approved):** Mandate Telugu Unicode regex verification in Layer 1 Zod validation.

### 27.2 Conflict Register (JACR-AI)
- **JACR-AI-01 (Resolved):** *Streaming LLM tokens over SSE vs. Buffering in background worker.*
  - **Resolution:** Full buffering in background worker is adopted for primary production. Workers validate the complete JSON payload before stashing. Token streaming is reserved for future interactive playground features.
- **JACR-AI-02 (Deferred to Stage 22):** *Verification of Gemini free tier terms under high multi-tenant usage.*
  - **Status:** To be re-verified during Stage 22 (Cost Architecture).

---

## 28. Comprehensive Testing Strategy

Stage 24 and Stage 28 must implement the following 16 architectural test suites:
1. `TEST-AI-01`: Valid Telugu question generation passes all 4 validation layers.
2. `TEST-AI-02`: Missing required prompt variables throws `400 Bad Request`.
3. `TEST-AI-03`: Malformed JSON completion triggers schema error and retry.
4. `TEST-AI-04`: Safety block immediately flags `FAILED_FATAL` without retry.
5. `TEST-AI-05`: Duplicate submission with same `Idempotency-Key` returns existing job.
6. `TEST-AI-06`: Provider 429 triggers exponential backoff retry.
7. `TEST-AI-07`: Staged proposal written to `/proposals/` does NOT modify canonical document.
8. `TEST-AI-08`: Human `ACCEPT` action commits proposal to canonical entity and logs provenance.
9. `TEST-AI-09`: Human `EDIT` action records `wasEdited: true` and edited field names.
10. `TEST-AI-10`: Human `REJECT` action archives proposal with zero canonical change.
11. `TEST-AI-11`: AI regeneration increments proposal version without replacing canonical version.
12. `TEST-AI-12`: AI agent blocked from executing human-gated workflow transitions (AP-009).
13. `TEST-AI-13`: Global rate limiter throttles requests exceeding 10 RPM.
14. `TEST-AI-14`: Local mock adapter executes offline with zero network calls.
15. `TEST-AI-15`: SSE event `JOB_STATUS_UPDATED` delivered upon generation completion.
16. `TEST-AI-16`: Cryptographic SHA-256 prompt hash verified in provenance record.

---

## 29. Stage 18 Acceptance Criteria & Anti-Overclaim Confirmation

### 29.1 Acceptance Criteria
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

### 29.2 Final Anti-Overclaim Statement
**Stage 18 AI architecture is documented and contractually defined; runtime AI provider clients, prompt injection pipelines, and worker implementations remain for later implementation stages.**
