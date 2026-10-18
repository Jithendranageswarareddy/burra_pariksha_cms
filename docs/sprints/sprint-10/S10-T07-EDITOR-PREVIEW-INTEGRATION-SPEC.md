# S10-T07: Shared Editors, Previews, and Backend Integration Design

**Sprint:** Sprint 10
**Task ID:** S10-T07
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Integration Architecture & UI Design
**Authority:** `frontend/features/question-generation/components/QuestionStudioPage.tsx`, `useQuestionGeneration.ts`

---

## 1. Unified Production Shell & Router

All 3 content modes are authored from a single canonical route `/questions/generate` (`QuestionStudioPage.tsx`).
The page switches authoring environments dynamically based on `productionMode`:
```tsx
{/* Mode 2: Topic Introduction */}
{productionMode === 'TOPIC_INTRODUCTION' && (
  <TopicIntroWorkspace
    candidate={candidate}
    aspectRatio={aspectRatio as '9:16' | '16:9'}
    isDirty={isDirty}
    isSaving={isSaving}
    onUpdateField={updateField}
    onChangeAspectRatio={changeAspectRatio}
    onManualDraft={handleManualDraft}
  />
)}

{/* Mode 3: Explained Questions Video */}
{productionMode === 'EXPLAINED_QUESTIONS_VIDEO' && (
  <ExplainedQuestionsWorkspace
    candidate={candidate}
    targetQuestionCount={targetQuestionCount}
    activeQuestionIndex={activeQuestionIndex}
    isDirty={isDirty}
    isSaving={isSaving}
    onSelectTab={setActiveQuestionIndex}
    onUpdateField={updateField}
    onUpdateQuestion={updateExplainedQuestion}
    onManualDraft={handleManualDraft}
  />
)}

{/* Mode 1: Question Challenge Short */}
{productionMode === 'QUESTION_CHALLENGE_SHORT' && (
  <CandidateCanvas ... />
)}
```

---

## 2. Shared State Machine (`useQuestionGeneration.ts`)

The React hook `useQuestionGeneration`:
1. **Taxonomy & Mode Sync:** Coordinates topic, subtopic, mode, question count, and aspect ratio.
2. **Draft Hydration:** Seamlessly hydrates existing drafts from Firestore (`/api/v1/question-generation/drafts/:id`).
3. **Save Draft vs Verify:**
   - `handleSaveDraft()` calls `questionGenerationService.saveDraft()`, persisting without advancing workflow step.
   - `handleSubmitForVerification()` calls `questionGenerationService.submitForVerification()`, which enforces deterministic validation gates and transitions to Stage 02.
4. **OCC Protection:** Pass-through of `expectedVersion` ensures concurrent edits receive HTTP 409 conflict errors.

---

## 3. Real-Time Audience Preview Projections

- **Mode 1 Preview:** `AudienceQuestionPreview.tsx` renders 9:16 vertical short simulation with 58s countdown timer.
- **Mode 2 Preview:** Live simulation card in `TopicIntroWorkspace.tsx` projecting headline, concept definition, syllabus scope, and hook in chosen aspect ratio (9:16 or 16:9).
- **Mode 3 Preview:** Live simulation cards in `ExplainedQuestionsWorkspace.tsx` displaying the intro roadmap when tab 0 is active, or the specific question card with options and explanation when tabs 1..N are active.
