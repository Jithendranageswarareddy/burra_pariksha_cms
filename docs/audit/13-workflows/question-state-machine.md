# Question State Machine & Verification Lifecycle

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 04 of 30  

---

## 1. QuestionStatus State Model

The `QuestionStatus` state machine governs the initial creation, AI generation, human refinement, and SME verification of exam questions in `src/lib/services/question.service.ts`.

### Defined States (`src/types/index.ts:15–22`)
- `DRAFT`: Initial scratchpad state; manually created or batch initiated.
- `GENERATED`: AI prompt output produced by Gemini 2.5 Flash.
- `EDITING`: Content editor actively modifying question text, options, or explanation.
- `APPROVED`: Verified by SME; locked for video production queueing.
- `REJECTED`: Failed syllabus or clarity standards; returned for revision.
- `ARCHIVED`: Soft-deleted or retired from active curriculum.

---

## 2. Formal Transition Table (`VALID_QUESTION_TRANSITIONS`)

Declared at `src/lib/services/question.service.ts:84–91`:

| Current State (`fromStatus`) | Allowed Target States (`toStatus`) | Mutating API Endpoint | Required Role | Mandatory Business Rules / Safety Guards |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `GENERATED`, `ARCHIVED` | `POST /api/questions/create` | USER, SME | Title and Category required |
| `GENERATED` | `EDITING`, `APPROVED`, `REJECTED`, `ARCHIVED` | `POST /api/questions/draft/:id/approve` | SME, ADMIN | Auto-approval requires validation score >= 80 |
| `EDITING` | `APPROVED`, `REJECTED`, `GENERATED`, `ARCHIVED` | `PATCH /api/questions/:id/status` | SME, LEAD | Must pass 4 distinct options check, explanation present |
| `APPROVED` | `EDITING`, `ARCHIVED` | `PATCH /api/questions/:id/status` | ADMIN, LEAD | Demotion to `EDITING` blocked if video already in production |
| `REJECTED` | `EDITING`, `DRAFT`, `ARCHIVED` | `PATCH /api/questions/:id/status` | USER, SME | Rejection notes required in payload |
| `ARCHIVED` | `DRAFT`, `EDITING` | `POST /api/questions/:id/restore` | ADMIN | Reactivation restores record to draft workspace |

---

## 3. Parallel QuestionValidationStatus State Machine

A secondary state machine tracks automated quality scoring:
- `NOT_VALIDATED`: Initial state.
- `VALIDATING`: AI / rule evaluation in progress.
- `VALID`: Score >= 80; all schema checks passed.
- `NEEDS_REVIEW`: Score 50–79; flagged for human inspection.
- `INVALID`: Score < 50; duplicate options or formatting failure.

### State Desynchronization Hazard
A critical finding is that `QuestionStatus` and `QuestionValidationStatus` can become completely desynchronized. For example, a Question can be manually moved to `APPROVED` while `QuestionValidationStatus` remains `INVALID` or `NOT_VALIDATED` if updated via legacy endpoints (`PATCH /api/questions/:id/status`) which do not assert `validationStatus === VALID`.
