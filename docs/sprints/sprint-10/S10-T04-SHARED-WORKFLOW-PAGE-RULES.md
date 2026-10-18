# S10-T04: Shared Page, Role, and Workflow Acceptance Rules

**Sprint:** Sprint 10
**Task ID:** S10-T04
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Architecture & Acceptance Criteria
**Authority:** `AGENTS.md`, `shared/constants/workflow.ts`, `shared/constants/roles.ts`

---

## 1. Multi-Mode Comparison Matrix

| Attribute | Mode 1: Question Challenge Short | Mode 2: Topic Introduction | Mode 3: Explained Questions Video |
| :--- | :--- | :--- | :--- |
| **Primary Code** | `QUESTION_CHALLENGE_SHORT` | `TOPIC_INTRODUCTION` | `EXPLAINED_QUESTIONS_VIDEO` |
| **Question Counts** | 1 (single) or {5, 10, 15, 20} (batch) | **0 (enforced)** | **{5, 10, 15, 20} (enforced)** |
| **Aspect Ratios** | `9:16` strictly | `9:16` or `16:9` | `16:9` strictly |
| **Target Duration** | 30s â€“ 58s (hard ceiling 58s) | 60s â€“ 180s (target 90s) | 12m â€“ 52m (target 25m) |
| **Authoring Workspace** | `CandidateCanvas` / `QuestionStudioWorkspace` | `TopicIntroWorkspace` | `ExplainedQuestionsWorkspace` |
| **Stage 02 Checklist** | 10-Point Proof Checklist | 5-Point Concept Checklist | 10-Point Proof Checklist |
| **Data Shape** | Single MCQ or `slots[]` array | `introductoryConcept` string | `introductoryConcept` + `questions[]` array |

---

## 2. Canonical 15-Stage Workflow Applicability

All three modes flow through the authoritative 15-stage workflow (`Stage 01` through `Stage 15`). None of the stages are bypassed, reordered, or deleted:

- **Stage 01: Concept / Question Generation & Studio Authoring**
  - Save Draft: Persists working state with status `DRAFT`. Does NOT advance workflow.
  - Submit for Verification: Validates draft completeness (HTTP 422 if invalid) and advances to Stage 02.
- **Stage 02: Pedagogical & Factual Verification Gate**
  - Evaluates mode-specific verification checklist.
  - Strict anti-self-approval (GAR-02): $authorId \neq approverId$.
- **Stages 03 â€“ 15:** Script teleprompter formatting, presenter rehearsal, video recording, QC review, social packaging, publishing scheduling.

---

## 3. Page-State Acceptance Matrix

| UI State | Studio Behavior Across Modes |
| :--- | :--- |
| **EMPTY** | Taxonomy selectors active; empty workspace placeholder displayed; "Submit" disabled. |
| **INCOMPLETE** | Author is actively drafting; missing fields highlighted with real-time feedback; "Save Draft" enabled, "Submit" disabled. |
| **VALID** | All required mode fields satisfied; validation badges green; both "Save Draft" and "Submit" active. |
| **SUBMITTED** | Draft locked with status `SUBMITTED_FOR_REVIEW`; inputs read-only; revision comments visible. |
| **REJECTED / REVISION** | Reviewer remarks displayed; inputs re-enabled for author; resubmission advances back to Stage 02. |
