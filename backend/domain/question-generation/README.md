# Question Generation Domain Slice (`backend/domain/question-generation`)

## 1. Overview
The **Question Generation** domain slice encapsulates server-side business rules, candidate generation orchestration, candidate validation, isolated draft persistence, and explicit dispatch to Stage 02 verification.

## 2. Directory Structure
```text
backend/domain/question-generation/
├── question-generation.service.ts # Core domain service
├── index.ts                       # Public domain exports
└── README.md                      # Domain documentation
```

## 3. Key Responsibilities
- **Generation Options**: Provides active Topic and Subtopic options from `taxonomyService`.
- **Generation Validation**: Enforces two-tier taxonomy invariants (`topicId` and `subtopicId` alignment).
- **Candidate Generation**: Orchestrates advisory AI generation via `aiOrchestrator` with deterministic fallbacks.
- **Draft Persistence**: Persists working candidate to `questionDraftsRepository` in `DRAFT` status.
- **Save Draft vs. Verify Isolation**: Saving draft never creates a canonical question, never assigns permanent `qst_` ID, and never executes Stage 02 verification.
- **Explicit Submission**: `submitForVerification()` transitions draft to `STAGE_02_VERIFICATION` without performing self-approval (`GAR-02`).
