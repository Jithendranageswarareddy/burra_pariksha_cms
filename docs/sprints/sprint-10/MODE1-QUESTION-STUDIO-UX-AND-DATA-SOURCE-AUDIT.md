# Mode 1 Question Challenge Short — UX/UI Simplification & Data Source Audit

## 1. Overview & Objective

The objective of this sprint task is to refactor the Question Studio workspace for **Mode 1: Question Challenge Short** (`9:16` vertical mobile challenge with speed math shortcut reveal, $\le 58\text{s}$) into a compact, production-ready question-generation workbench.

Prior to this refactoring, the page suffered from:
- Excessive vertical stretching (~1200px+ of scroll depth before reaching question authoring actions).
- Duplicate and oversized banners (expanded 15-stage timeline cards, verbose Mode identification cards, and duplicated summary blocks).
- An empty syllabus alert reporting "No topics available" with no actionable guidance or routing to the taxonomy administration system.
- Frontend-defined arbitrary values for Difficulty (`'Basic'`, `'Intermediate'`, `'Advanced'`) instead of strictly adhering to the canonical `DifficultyLevel` contract (`EASY`, `MEDIUM`, `HARD`).
- Misleading decorative real-world context suggestions hardcoded into the component rather than sourcing from authoritative data.

---

## 2. Field-by-Field Source Map & Data Ownership

| Field / Control | Current Source | Authoritative? | Administrator Managed? | Recommended Ownership | Validation Location | Existing Contract |
|---|---|---|---|---|---|---|
| **Topic** | Cloud Firestore (`topics` collection) via `taxonomyApi.getTaxonomyTree()` | Yes | Yes (Admin Settings `/settings?tab=taxonomy`) | Backend / Database (Firestore) | Backend `request-schemas.ts` & Domain service | `taxonomyApi.getTaxonomyTree()`, `Topic` model |
| **Subtopic** | Cloud Firestore (`subtopics` collection) via `taxonomyApi.getSubtopicsByTopic(topicId)` | Yes | Yes (Admin Settings `/settings?tab=taxonomy`) | Backend / Database (Firestore) | Backend `request-schemas.ts` & Domain service | `taxonomyApi.getSubtopicsByTopic()`, `Subtopic` model |
| **Question Count** | Shared content-mode registry (`APPROVED_MODE_1_COUNTS = [1, 5, 10, 15, 20]`) | Yes | No (Fixed platform rule) | Shared Contract / Mode Registry | Shared validator & Backend `validateProductionModeConfig` | `ContentProductionMode` & `QuestionBatchAssembly` |
| **Aspect Ratio** | Fixed canonical value `9:16` (Vertical Short) | Yes | No (Fixed Mode 1 constraint) | Shared Contract (`CONTENT_MODE_REGISTRY`) | Client & Backend validation gate | `ContentProductionModeConfig` (`aspectRatio: '9:16'`) |
| **Difficulty** | Canonical `DifficultyLevel` (`EASY`, `MEDIUM`, `HARD`) | Yes | No (Fixed pedagogical standard) | Shared Contract (`DifficultyLevel` enum) | Client & Backend request validator | `DifficultyLevel` (`shared/constants/enums.ts`) |
| **Language** | Canonical `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | Yes | Configurable per candidate | Shared Contract (`QuestionLanguage`) | Client & Backend request validator | `QuestionLanguage` (`shared/constants/enums.ts`) |
| **Question Style / Hook** | Approved Mode 1 styles (`SPEED_MATH_TRICK`, `STORY_BASED`, `CONCEPTUAL`, `TRAP_DISTRACTOR`) | Yes | No (Pedagogical blueprint) | Shared Contract / AI Prompt Schema | Client & Backend AI generation orchestrator | `QUESTION_STYLES` / AI prompts |
| **Real-World Context** | Optional user text input; decorative hardcoded chips removed | Yes | Optional author input | Frontend state / Firestore draft persistence | Client length check & AI prompt variable | `StudioCandidate.realLifeContext` |
| **Generation Summary** | Dynamically derived from form state & mode rules | Yes | Derived presentation | Derived ViewModel | Pure calculation (`deriveSummary`) | Dynamic form evaluation |
| **Draft Persistence** | Cloud Firestore (`question_drafts` collection) | Yes | Author session | Backend persistence (`questionsApi.saveDraft`) | Optimistic locking + server validation | `QuestionDraft` / `questionsApi` |
| **Verification Submission** | Canonical workflow engine (Stage 01 $\to$ Stage 02) | Yes | Author action | Backend workflow service (`submitForVerification`) | Strict anti-self-approval (GAR-02) & validation gate | `SubmitForVerificationResult` |

---

## 3. Empty Taxonomy Root Cause Analysis

### Investigation Findings
1. **API Call**: On mount, `useQuestionGeneration` executes `loadTaxonomyOptions()`, calling `taxonomyApi.getTaxonomyTree()`, which issues an authenticated `GET /api/taxonomy/tree`.
2. **Backend Execution**: The backend route delegates to `taxonomyService.getTopicTree({ includeInactive: false })` backed by Cloud Firestore collections `topics` and `subtopics`.
3. **Database State**: Inspection via `scripts/inspect-db.ts` verified that Cloud Firestore currently contains 0 topic documents and 0 subtopic documents (the database was zeroed down during previous administrative cleanup).
4. **Conclusion**: The "No topics available" state is **genuinely accurate** because the authorized database contains no active syllabus records.
5. **Remediation**:
   - The empty state banner in `GenerationConfigPanel` has been updated with a direct navigation link (`<Link to="/settings?tab=taxonomy" data-testid="configure-taxonomy-link">Configure &rarr;</Link>`) allowing administrators to immediately access the taxonomy manager.
   - The selector displays an informative disabled state explaining that taxonomy records must be created before generation can proceed.

---

## 4. UI/UX Layout Refactoring Summary

### Compact Workflow Header
- Replaced the tall multi-line `PageHeader` with a single high-density operational workflow ribbon.
- Clearly displays:
  - **Mode Badge**: `Mode 1: Question Challenge Short` (`9:16 Vertical • ≤ 58s`).
  - **Stage Indicator**: `Stage 01: Question Generation (Step 01 / 15)`.
  - **Next Stage Indicator**: `Next: Stage 02 Question Verification`.
- Renders `<ProductionJourneyBar activeStage="QUESTION_STUDIO" showDetails={false} />`, providing an interactive, horizontal 15-stage stepper without bulky cards.

### Streamlined Integrated Workbench Summary
- Refactored `ProductionWorkbenchSummary.tsx` from an 832-line, 250px-tall card into a compact, responsive status ribbon (~44px height).
- Preserved all authoritative attributes, test IDs, and pure resolution functions:
  - `data-testid="workbench-summary"`
  - `data-testid="workbench-topic-name"`, `data-testid="workbench-subtopic-name"`
  - `data-testid="workbench-mode-name"`, `data-testid="workbench-mode-count"`, `data-testid="workbench-mode-aspect"`
  - `data-testid="workbench-content-status"`, `data-testid="workbench-draft-id"`
  - `data-testid="workbench-current-step"`, `data-testid="workbench-stages-progress"`
  - `data-testid="workbench-next-action-btn"`, `data-testid="workbench-next-action-desc"`, `data-testid="workbench-change-mode-btn"`

### Left Column: Ordered Question Configuration
Organized strictly into the canonical sequence:
1. **Topic (Syllabus Root)**: Authoritative Firestore topics, loading indicator, retry action, and admin link on empty state.
2. **Subtopic**: Cascading dependent subtopics with invalidation guard and retry action.
3. **Question Count & Aspect Ratio**: Supported counts (`[1, 5, 10, 15, 20]`) and fixed `9:16 Vertical` indicator.
4. **Difficulty**: Canonical `DifficultyLevel` (`EASY`, `MEDIUM`, `HARD`).
5. **Language**: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`).
6. **Question Style / Hook Type**: Approved pedagogical hook options.
7. **Real-World Context**: Clean optional input without decorative hardcoded suggestion chips.
8. **Generation Summary**: Compact summary dynamically derived from selected configuration.
9. **Primary Generate Action**: Full-width button with spinner and duplicate-click protection.

### Right Column: Question Editor and Canvas
- Empty workspace shows clean prompt with **Generate Candidate** and **Manual Draft** options.
- Active workspace provides:
  - Problem statement editor.
  - Four answer options (A, B, C, D) with single correct answer selection.
  - Detailed explanation and speed-math shortcut solution.
  - 9:16 Audience preview toggle.
  - Distinct **Save Draft** (in-place persistence) vs. **Submit for Verification** (dispatches to Stage 02 with anti-self-approval).

---

## 5. Verification Results

| Check | Command | Result |
|---|---|---|
| S8-T13 Shared Production Workbench | `npx tsx tests/unit/s8-t13-production-workbench.unit.test.ts` | **PASS** (26/26 tests passed) |
| S9-T08 Mode Generation Configuration | `npx tsx tests/unit/s9-t08-mode-generation-config.unit.test.ts` | **PASS** (19/19 tests passed) |
| Architecture & Boundary Gates | `npm run test:architecture` | **PASS** (All 8 boundary gates passed) |
| Full Application Build | `npm run build` | **PASS** (Vite + esbuild successful, 0 errors) |
| Git Index Check | `git diff --check` | **PASS** (Clean diff, 0 trailing whitespace errors) |

---

## 6. Git Synchronization & Modified Files

- `frontend/features/question-generation/components/GenerationConfigPanel.tsx`: Compact reordered form, canonical DifficultyLevel, and taxonomy admin link.
- `frontend/features/question-generation/components/ProductionWorkbenchSummary.tsx`: Streamlined single-strip summary ribbon retaining all contract test IDs.
- `frontend/features/question-generation/hooks/useQuestionGeneration.ts`: Default canonical `DifficultyLevel.MEDIUM` and draft rehydration preservation.
- `frontend/features/question-generation/pages/QuestionStudioPage.tsx`: Compact workflow header, compact 15-stage timeline strip, and balanced 2-column workbench.
- `docs/sprints/sprint-10/MODE1-QUESTION-STUDIO-UX-AND-DATA-SOURCE-AUDIT.md`: Complete audit and closure report.
- `tests/architecture/s7-t01-inventory-reconciliation.test.ts`: Registered new deliverable in `AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS`.
