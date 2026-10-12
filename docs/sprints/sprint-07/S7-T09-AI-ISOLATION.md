# S7-T09 — AI Boundary Isolation Architecture Report

## Executive Summary

- **Task**: S7-T09 AI Boundary Isolation (Final Remediation Pass)
- **Status**: COMPLETE (100% Isolated)
- **Canonical Boundary**: `backend/ai/`
- **Objective**: Establish complete isolation of AI infrastructure, multi-provider abstraction, prompt engineering, structured schemas, output validation, and error classification behind a single canonical server-side boundary. Eliminate cross-boundary leaks of `@google/genai` SDK, remove all direct AI dependencies on feature services and database persistence, establish correct AI type ownership, and verify strict architectural constraints via automated tests.

---

## 1. Canonical AI Architecture (`backend/ai/`)

The authoritative AI implementation is consolidated strictly into:

```
backend/ai/
├── orchestrator/      # Task routing, provider selection, timeout enforcement, fallback, provenance
├── providers/         # Multi-provider SDK adapters (Gemini, Groq, Mistral, OpenRouter, Cohere, etc.)
├── prompts/           # Production prompt templates & system instructions
├── schemas/           # GenAI structured output response schemas
├── validators/        # AI candidate & output validation engines, 9-layer verification adapters
├── errors/            # AI error taxonomy, provider error classification, retryability
└── index.ts           # Authoritative AI subsystem barrel export
```

All legacy AI implementation locations have been permanently removed:
- `backend/infrastructure/ai` — DELETED
- `backend/features/ai` — DELETED
- `backend/features/question-verification/ai` — DELETED
- `backend/features/question-verification/validation` — DELETED

---

## 2. Dependency Inversion & Architectural Boundaries

### 2.1 AI → Feature Dependency Rule (Zero Dependencies)
- **Constraint**: `backend/ai` MUST NOT import from `backend/features/*`.
- **Remediation**:
  - `ScriptContentPayload` was extracted to `shared/types/content.ts` and re-exported from `shared`. `backend/ai/orchestrator/ai-orchestrator.service.ts` and `backend/ai/providers/gemini.service.ts` now import `ScriptContentPayload` from `shared`.
  - String normalization and lexical similarity utilities (`normalizeText`, `calculateJaccardSimilarity`) were extracted into `shared/lib/similarity.ts` as pure deterministic algorithms. `backend/ai/validators/multi-layer-verification.engine.ts` no longer imports `similarityService` from `backend/features/planning`.
- **Result**: `backend/ai` contains **ZERO** imports from `backend/features`.

### 2.2 AI → Database Dependency Rule (Zero Persistence)
- **Constraint**: The AI layer must not own persistence mechanics or query Firestore repositories.
- **Remediation**:
  - `backend/ai/validators/multi-layer-verification.engine.ts`: Direct import of `questionsRepository` was removed. The caller (the feature service `QuestionValidationService` or `QuestionService`) queries existing questions and passes them into `options.existingQuestions`.
  - `backend/ai/providers/gemini.service.ts`: Direct import of `questionsRepository` in `generateContentPlanRecommendation` was removed. The route handler / owning feature retrieves `allQuestions` and passes it via input parameters.
- **Result**: `backend/ai` contains **ZERO** imports from `database/` or `repositories`.

### 2.3 Provider SDK Isolation (@google/genai)
- Direct usage of `@google/genai` is strictly restricted to:
  - `backend/ai/providers/` (adapter implementations & client initialization)
  - `backend/ai/schemas/` (GenAI structured output Type/Schema definitions)
- **Frontend leaks**: 0 (SettingsPage mentions it only as display text inside documentation badge).
- **Shared leaks**: 0.
- **Feature leaks**: 0.

---

## 3. Validator Classification & Ownership

Validators in `backend/ai/validators/` have been audited and classified according to domain responsibility:

| Validator | Classification | Role / Function |
|---|---|---|
| `candidate.validator.ts` | **A. AI output validator** | Validates structured candidate output from AI generation |
| `mathematical.validator.ts` | **A. AI output validator** | Mathematical and formula consistency for generated questions |
| `script.validator.ts` | **A. AI output validator** | Validates generated video teleprompter scripts |
| `thumbnail-safety.validator.ts` | **A. AI output validator** | Safety and clickbait checks for AI thumbnail concepts |
| `pinned-comment-safety.validator.ts` | **A. AI output validator** | Spoiler protection and engagement checks for AI comments |
| `gemini-validation.provider.ts` | **B. AI provider adapter** | Implements `QuestionValidatorProvider` using Gemini API |
| `semantic-reasoning.provider.ts` | **B. AI provider adapter** | Gemini-powered semantic audit and fallacy detection |
| `blind-verifier.ts` | **B. AI provider adapter** | Independent blind derivation of correct answer via Gemini |
| `consensus.engine.ts` | **B. AI provider adapter** | Multi-model consensus and contradiction resolution |
| `multi-layer-verification.engine.ts`| **E. Verification Boundary** | Orchestrates 9-layer verification; receives data from features |
| `question-validation.engine.ts` | **E. Verification Boundary** | Executes 10-stage validation pipeline across providers |

---

## 4. AI Type Ownership Migration

Multi-provider infrastructure types were migrated from `src/types/ai.ts` to canonical ownership in `backend/ai/orchestrator/types.ts`:
- `AIProviderId`
- `AITaskType`
- `AIProviderHealthState`
- `AIFailureCategory`
- `AIGenerationSource`
- `AIRetryPolicy`
- `AIRateLimitState`
- `AIProviderMetadata`
- `AIRequest`
- `AIAttemptDetail`
- `AIProvenance`
- `AINormalizedResponse`
- `AIProviderHealth`
- `IAIProvider`

`src/types/ai.ts` now acts as a backward-compatibility re-export shim, while all provider adapters and orchestrator files in `backend/ai/` import directly from `./types` or `../orchestrator/types`.
- **Result**: `backend/ai` contains **ZERO** imports from `src/types/ai`.

---

## 5. Architectural Verification Suite (`tests/s7-t09-ai-boundary.test.ts`)

The automated architectural verification test validates 9 distinct quality criteria:

1. **TC-AI-01**: All 6 canonical `backend/ai` directories exist (`orchestrator`, `providers`, `prompts`, `schemas`, `validators`, `errors`).
2. **TC-AI-02**: All 4 obsolete AI directories are confirmed deleted.
3. **TC-AI-03**: Zero `@google/genai` imports exist in `frontend/` or `shared/`.
4. **TC-AI-04**: AI Orchestration service, error taxonomy, and classification functions work correctly.
5. **TC-AI-05**: Production schemas, prompts, and validators are exported cleanly from `backend/ai`.
6. **TC-AI-06**: `backend/ai` has **ZERO** dependencies on `backend/features`.
7. **TC-AI-07**: `backend/ai` has **ZERO** dependencies on `database/` or Firestore repositories.
8. **TC-AI-08**: `backend/ai` has **ZERO** dependencies on `src/types/ai`.
9. **TC-AI-10**: `backend/ai` has **ZERO** dependencies on `src/` (types, config, or lib).
10. **TC-AI-09**: Frontend and shared layers have **ZERO** imports from `backend/ai`.

**Test Execution**:
```bash
npx tsx tests/s7-t09-ai-boundary.test.ts
# Result: 10 PASSED, 0 FAILED
```
