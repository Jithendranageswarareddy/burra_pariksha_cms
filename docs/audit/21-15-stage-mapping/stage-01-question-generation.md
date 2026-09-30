# Stage 01: Question Generation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 03 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 01 Question Generation
- **Canonical Purpose:** AI question generation, syllabus taxonomy selection, 4-option generation, and initial draft creation.
- **Current Implementation:** `QuestionStudioPage.tsx`, `question-draft.service.ts`, `questionDraftsRepository`.
- **Active Route:** `/studio`

---

## 2. Operational Flow Reconstructed

### INPUT
- Topic Taxonomy (`categoryId`, `topicId`, `subtopicId`).
- Difficulty level (`Easy`, `Intermediate`, `Advanced`).
- Presentation type, style (`STORY_BASED`, `REAL_WORLD`), and language (`TELUGU`).
- User prompt or Gemini AI prompt generation.

### WORK
- Generates 4 distractor options (A, B, C, D) and mathematical derivation.
- Validates structural completeness via `QuestionCreationValidator`.
- Persists draft candidate without allocating permanent production sequence ID.

### OUTPUT
- `QuestionDraft` object with ID format `BP-DFT-######-XXXX`.
- Appended row in `QUESTION_DRAFTS` worksheet.

### STATE
- **Entity:** `QuestionDraft`
- **Field:** `status`
- **Current State:** `QuestionStatus.DRAFT`
- **State Machine:** Draft Lifecycle
- **Authoritative Storage:** Google Sheets (`QUESTION_DRAFTS` tab)

### NEXT STAGE
- **Expected Canonical Next Stage:** 02 Question Verification
- **Actual Implementation Next Stage:** Dispatches to `/questions/:id/verify` (or remains in Studio).
- **Mismatch:** None. Clean separation between draft generation and verification.

---

## 3. Evidence & Status

- **Evidence:** `src/lib/services/question-draft.service.ts:40-120`, `src/pages/QuestionStudioPage.tsx`.
- **Implementation Status:** **FULLY IMPLEMENTED**
