# FEATURE CONTRACT: FC-019-ASSISTIVE-AI-PIPELINE

## 1. Feature Identity
- **Feature ID**: FC-019
- **Feature Name**: Assistive AI Pipeline & Human Approval
- **Business Area**: Content Intelligence / Assistive AI Generation
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P2 (Assistive Enhancement)
- **Owner / Domain**: AI Subsystem Context
- **Related Workflow Stage(s)**: Steps 01 (Questions), 03 (Scripts), 10 (Publishing Setup)

---

## 2. Requirement
- **Business Requirement**: BR-011 (Assistive AI Content Generation) & Architectural Principle AP-009 (Human-in-the-Loop AI Boundary).
- **User Problem**: Drafting bilingual questions, compelling video hooks, and SEO metadata from scratch is time-consuming for solo creators and SMEs.
- **Business Purpose**: Provide an assistive AI generation pipeline powered by Google Gemini 2.5 Flash that drafts questions, suggests script pacing improvements, and generates SEO metadata—while strictly enforcing a human approval barrier that prevents AI from directly mutating canonical business data or advancing workflow stages.
- **Expected Capability**:
  - `IAIProvider` interface with Google Gemini 2.5 Flash implementation.
  - Standardized Prompt Registry managing versioned, temperature-controlled prompts.
  - Dedicated `ai_proposals` collection storing generated suggestions (`prp_` prefix).
  - Human review workspace allowing creators to inspect, edit, accept, or discard AI proposals.
  - Canonical mutation boundary: Accepting a proposal triggers standard domain repositories under the human user's credentials.
  - Strict token, cost, and rate-limiting guardrails (15 RPM free-tier quota).
- **Scope**: AI provider adapter, prompt registry, proposal lifecycle, human review modal, rate limiter.
- **Explicit Non-Scope**: Autonomous content publishing, unsupervised state machine transitions.

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Author requests Telugu translation or distractors for an English question.
  - Gemini 2.5 Flash generates 4 options and explanation; result is saved to `ai_proposals` with `status = PENDING_REVIEW`.
  - Author reviews proposal in UI, modifies 1 option, and clicks *"Apply to Draft"*.
  - Canonical question document is updated with human author's ID attached; proposal marked `ACCEPTED`.
- **AP-009 Guardrail Acceptance**:
  - System mathematically prevents AI from directly updating `questions`, `scripts`, or `workflow_instances` collections without human signature.
- **Rate Limit & Cost Acceptance**:
  - In-memory token bucket limits requests to $\le 15\text{RPM}$ and $\le 1\text{M tokens/day}$, guaranteeing ₹0.00 cost under Google AI Studio free tier.
- **Audit Acceptance**:
  - `AI_REQUEST_DISPATCHED`, `AI_PROPOSAL_GENERATED`, and `AI_PROPOSAL_ACCEPTED` logged with prompt version, token usage, and reviewing user ID.

---

## 4. Domain Entities
- **Entities Involved**: `AIProposal`, `PromptTemplate`, `AITokenUsage`.
- **Entity Ownership**: AI Intelligence Bounded Context.
- **Relationships**: An `AIProposal` references a target `entityType` and `entityId`, authored by `AI_SYSTEM`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `promptId`, `modelName`, `rawPrompt`, `rawResponse`, `createdAt`.
- **Mutable Fields**: `status` (`PENDING_REVIEW`, `ACCEPTED`, `REJECTED`, `EDITED_AND_ACCEPTED`), `reviewedBy`, `reviewedAt`.
- **Lifecycle**: `PENDING_REVIEW` $\to$ `ACCEPTED` | `REJECTED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `ai_proposals`, `prompt_registry`.
- **Document Structure**:
  ```typescript
  export interface AIProposalDocument extends BaseEntity {
    id: string; // prp_ + UUIDv4
    entityType: 'QUESTION' | 'SCRIPT' | 'METADATA';
    entityId: string;
    promptKey: string;
    model: 'gemini-2.5-flash';
    proposalData: Record<string, unknown>;
    tokensUsed: { prompt: number; candidate: number; total: number };
    status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'EDITED_AND_ACCEPTED';
    reviewedBy?: string;
    reviewedAt?: string;
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(entityId, status, createdAt DESC)`.
- **Source of Truth**: Firestore `ai_proposals` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/ai/generate`
- **Authentication**: Required.
- **Required Capability**: `AI_ASSIST_GENERATE`.
- **Request Schema**:
  ```typescript
  {
    promptKey: z.enum(['QUESTION_DISTRACTORS', 'SCRIPT_HOOK_EXPANSION', 'SEO_METADATA_OPTIMIZE']),
    entityType: z.enum(['QUESTION', 'SCRIPT', 'METADATA']),
    entityId: string,
    contextData: Record<string, unknown>
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ proposal: AIProposalDocument }>`.

### 6.2 `POST /api/v1/ai/proposals/:id/accept`
- **Authentication**: Required.
- **Required Capability**: Matching content edit capability (`QUESTION_UPDATE` or `SCRIPT_UPDATE`).
- **Request Schema**: `{ modifiedData?: Record<string, unknown> }`.
- **Response Schema**: `ApiResponseEnvelope<{ success: true, updatedEntityId: string }>`.

---

## 7. Frontend Contract
- **Canonical Route**: Integrated as `<AIAssistantDrawer>` across Questions Hub and Scripts Studio.
- **Allowed Roles / Capabilities**: `SubjectMatterExpert`, `ScriptWriter`, `Admin`.
- **UI Behavior**:
  - Sparkle icon *"Ask AI"* button opens side drawer.
  - Streamed preview showing AI suggestions with diff highlighting against current form values.
  - Three distinct buttons: *"Accept All"*, *"Edit in Place"*, *"Discard"*.
  - Clear visual indicator: *"Generated by Gemini 2.5 Flash — Review required before saving."*

---

## 8. RBAC / Capability Contract
- **`AI_ASSIST_GENERATE`**: Required to invoke generation endpoints.
- **Human Invariant**: Only authenticated users with explicit edit capability on the target resource can accept a proposal.

---

## 9. Workflow Contract
- **Non-Bypass Rule**: AI generation cannot trigger workflow transitions. Only the human user's acceptance and subsequent explicit *"Submit"* action advances workflow state.

---

## 10. Validation Contract
- **Output Schema**: Gemini responses parsed and validated via strict Zod schemas before being saved as proposals. Malformed JSON triggers automatic retry.

---

## 11. Error Contract
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded (15 RPM). UI displays cooldown timer.
- `502 BAD_GATEWAY`: Gemini API unreachable or safety filter blocked output.

---

## 12. Audit Contract
- **Events**: `AI_PROPOSAL_GENERATED`, `AI_PROPOSAL_ACCEPTED`, `AI_PROPOSAL_REJECTED`.
- **Payload**: `proposalId`, `entityId`, `tokensUsed`, `actorId`.

---

## 13. Realtime Contract
- **SSE Event**: `ai.proposal_ready` emitted if request was processed asynchronously.

---

## 14. Job / Async Contract
- **Async Execution**: Long generation requests enqueued via FC-017 `CloudTasksQueue` to prevent browser timeouts.

---

## 15. AI Contract
- Self-referential: Implements the AI Subsystem architecture.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- **Metrics**: AI acceptance rate (% of proposals accepted by creators).

---

## 18. Security Contract
- **API Key Security**: `GEMINI_API_KEY` stored exclusively in GCP Secret Manager; never passed to client.
- **Prompt Injection Defense**: User context sanitized and wrapped in rigid XML boundary tags (`<context>...</context>`).

---

## 19. Observability Contract
- **Metrics**: Counter `ai.requests_total{promptKey, status}`, histogram `ai.latency_seconds`, counter `ai.tokens_consumed_total`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Operates strictly within Google AI Studio free tier (15 RPM, 1M TPM).

---

## 21. Migration Contract
- **Legacy Parity**: Current system has zero AI integration; entirely additive feature.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-AI-01`: Mock Gemini adapter generates compliant structured proposal.
  - `TC-AI-02`: Zod validator rejects malformed AI output.
  - `TC-AI-03`: Rate limiter enforces 15 RPM ceiling.
- **API Tests**:
  - `TC-AI-04`: Accepting proposal mutates target entity under human credentials.
  - `TC-AI-05`: Proposal cannot be accepted by user without edit capability.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-006, FC-008, FC-017.
- **Stage 25 Node**: `D-26 (AI Subsystem)`.
- **Downstream Consumers**: Questions Hub, Scripts Hub, Publishing Hub.

---

## 24. Implementation Sequence
1. Define AI Proposal schemas (`src/types/ai.ts`).
2. Implement Gemini Flash provider adapter (`src/lib/ai/gemini-adapter.ts`).
3. Implement Prompt Registry and rate limiter (`src/lib/ai/prompt-registry.ts`).
4. Implement `/api/v1/ai/*` route handlers.
5. Build React `<AIAssistantDrawer>` component.
6. Verify against `TC-AI-01..05`.

---

## 25. Deployment Contract
- **Required Secrets**: `GEMINI_API_KEY` (in GCP Secret Manager).

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. AI is non-critical; system operates 100% manually if AI is disabled.

---

## 27. Feature Completion Criteria
- [ ] Gemini adapter produces structured Zod-compliant JSON.
- [ ] Human approval barrier proven with unit and API tests.
- [ ] Zero canonical data mutations without human signature.
- [ ] Rate limiter blocks requests $> 15\text{RPM}$.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 04 (AP-009), 13, 17, 18, and 22.

---

## 29. Traceability
- **Stage 01**: BR-011
- **Stage 04**: AP-009 Human-in-the-Loop AI Boundary
- **Stage 13**: `ai_proposals`, `prompt_registry` schemas
- **Stage 15**: `/api/v1/ai/*`
- **Stage 17**: Async Cloud Tasks Integration
- **Stage 18**: Authoritative AI Subsystem Architecture
- **Stage 22**: Gemini Flash Free Tier Quota Gate
- **Stage 24**: TC-AI01..05
- **Stage 25**: Node `D-26`
