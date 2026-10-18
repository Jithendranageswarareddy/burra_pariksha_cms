# S10-T01: Sprint 8 & Sprint 9 Dependency Audit and Three-Mode Integration Baseline

**Sprint:** Sprint 10
**Task ID:** S10-T01
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Requirements Baseline & Dependency Audit
**Authority:** `AGENTS.md`, `shared/registry/content-mode.registry.ts`, `shared/types/production-context.ts`

---

## 1. Executive Summary & Objective

The objective of S10-T01 is to audit the live Sprint 8 dynamic production foundation and Sprint 9 `QUESTION_CHALLENGE_SHORT` implementation to establish an authoritative, zero-regression integration baseline for the two new content production modes in Sprint 10:
1. **Mode 2: Topic Introduction (`TOPIC_INTRODUCTION`)** â€” Foundational concept overview, syllabus scope, and real-world hook without MCQs (0 questions).
2. **Mode 3: Explained Questions Video (`EXPLAINED_QUESTIONS_VIDEO`)** â€” Ordered educational masterclass package comprising an introductory orientation followed by 5, 10, 15, or 20 explained practice questions in 16:9 aspect ratio.

All three modes share a single authoritative architecture: Cloud Firestore datastore, two-tier taxonomy (Topic -> Subtopic), canonical 15-stage workflow, backend RBAC, optimistic concurrency control (OCC), immutable audit logs, and strict anti-self-approval (GAR-02: $authorId \neq approverId$).

---

## 2. Reusable Component & Service Inventory

| Architectural Layer | Component / File | Sprint 8 / 9 Status | Sprint 10 Reusability |
| :--- | :--- | :--- | :--- |
| **Content Mode Registry** | `shared/registry/content-mode.registry.ts` | Complete | Registers Modes 1, 2, and 3 with question counts, aspect ratios, checklists, and workflow mappings. |
| **Production Context** | `shared/types/production-context.ts` | Complete | Provides polymorphic context validation (`validateProductionModeConfig`). |
| **Question Generation Contract** | `shared/contracts/question-generation/question-generation.contract.ts` | Complete | Defines `StudioCandidate`, `evaluateStep01CandidateState`, `GenerateCandidateInput`. |
| **Deterministic Quality Validator** | `shared/lib/question-quality-validator.ts` | Complete | Pure, deterministic validator enforcing VAL-Q-01 through VAL-Q-12 across all 3 modes. |
| **Domain Service** | `backend/domain/question-generation/question-generation.service.ts` | Complete | Manages draft persistence, validation gates, OCC, and workflow submission. |
| **Firestore Repository** | `database/firestore/repositories/question-drafts.repository.ts` | Complete | Multi-mode payload persistence (`questions`, `introductoryConcept`, `slots`). |
| **Studio Page Router** | `frontend/features/question-generation/components/QuestionStudioPage.tsx` | Complete | Renders `TopicIntroWorkspace` for Mode 2, `ExplainedQuestionsWorkspace` for Mode 3, `CandidateCanvas` for Mode 1. |
| **Mode 2 Workspace** | `frontend/features/question-generation/components/TopicIntroWorkspace.tsx` | Complete | Concept title, hook, syllabus scope, 0-question enforcement, 9:16/16:9 preview. |
| **Mode 3 Workspace** | `frontend/features/question-generation/components/ExplainedQuestionsWorkspace.tsx` | Complete | Horizontal tab navigation `[Intro] [Q1]..[QN]`, batch sizes {5, 10, 15, 20}, 16:9. |
| **Studio State Hook** | `frontend/features/question-generation/hooks/useQuestionGeneration.ts` | Complete | Unified state management, mode switching, dirty tracking, draft saving. |

---

## 3. Strict Invariant & Non-Negotiable Enforcement

1. **Cloud Firestore Sole Datastore:** Zero Google Sheets or secondary runtime datastores.
2. **Taxonomy Schema:** Strictly two-tier `Topic -> Subtopic`. `Category` remains obsolete.
3. **Canonical 15-Stage Workflow:** Workflow transitions advance through canonical stages without reordering or stage deletion.
4. **GAR-02 Anti-Self-Approval:** The author of a candidate artifact cannot approve that artifact at Stage 02 (`authorId !== approverId`).
5. **Save Draft != Verify:** Saving a draft retains status `DRAFT` and workflow step 1; submission explicitly requires a complete, valid draft and transitions to Stage 02 with OCC checking.
6. **No Production Data Mutation:** Normal testing operates strictly against isolated synthetic fixtures. Production deployment remains strictly manual.

---

## 4. Baseline Regression Commands & Evidence

- `npm run test:architecture` â€” Passed (boundary checks, API access, inventory reconciliation).
- `npx tsx tests/unit/question-generation/s9-s10-launch-closure.unit.test.ts` â€” Passed (5/5 tests: Mode 3 questions array preservation, Mode 1 batch runner, regeneration preservation, server-side validation gate rejection, Mode 2 zero-question enforcement & draft resumption).
