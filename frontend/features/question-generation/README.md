# Question Generation Feature Slice (`frontend/features/question-generation`)

## 1. Overview
The **Question Generation** feature slice encapsulates the UI components, local state management, candidate presentation, and user interaction for Step 01 (Question Generation) of the canonical 15-stage content-production lifecycle.

## 2. Directory Structure
```text
frontend/features/question-generation/
├── components/
│   ├── ActionBar.tsx              # Save Draft vs. Submit for Verification actions
│   ├── CandidateCanvas.tsx        # Bilingual canvas, 4 options editor, speed trick
│   └── GenerationConfigPanel.tsx  # Topic/subtopic cascading selector & AI trigger
├── hooks/
│   └── useQuestionGeneration.ts   # Feature state machine, API calls, and validation
├── pages/
│   └── QuestionStudioPage.tsx     # Canonical dual-pane workspace assembly
├── index.ts                       # Public API barrel export
└── README.md                      # Feature documentation
```

## 3. Canonical User Workflow
The feature strictly follows the canonical sequence:
```text
LOAD OPTIONS
    ↓
SELECT TOPIC
    ↓
SELECT SUBTOPIC
    ↓
SELECT / ACCEPT CONTEXT
    ↓
GENERATE CANDIDATE
    ↓
REVIEW CANDIDATE
    ↓
SAVE DRAFT (In-Place)
    ↓
EXPLICIT SUBMIT TO VERIFICATION (Separate Command)
```

## 4. Critical Invariant: Save Draft Is Not Verify
- **SAVE DRAFT**: Persists draft data to Cloud Firestore (`question_drafts`). The user remains in the workspace, dirty state is cleared, and the draft ID is retained. It does not submit or verify.
- **SUBMIT FOR VERIFICATION**: An explicit, separate user command that dispatches the saved draft into Stage 02 Verification.

## 5. API Boundaries
The UI never issues raw HTTP requests or accesses Firestore directly. All transport interactions flow through `frontend/api/questions.api.ts` and `frontend/api/taxonomy.api.ts`.
