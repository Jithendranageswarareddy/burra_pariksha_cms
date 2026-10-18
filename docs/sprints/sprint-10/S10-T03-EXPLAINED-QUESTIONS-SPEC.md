# S10-T03: Content Specification â€” Mode 3: Explained Questions Video

**Sprint:** Sprint 10
**Task ID:** S10-T03
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Requirements Baseline
**Authority:** `shared/registry/content-mode.registry.ts`, `shared/types/question.ts`

---

## 1. Pedagogical Scope & Objectives

Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`) is an in-depth educational masterclass combining an introductory orientation roadmap with sequential, detailed practice question breakdowns. It prepares aspirants for exam-level problem-solving with speed math, shortcut techniques, and common pitfalls explained.

### Canonical Constraints
- **Question Batch Sizes:** Exactly **5, 10, 15, or 20 questions** (enforced by `ContentModeRegistry`).
- **Aspect Ratio:** Strictly **16:9** (landscape video format).
- **Target Duration:** 12 to 52 minutes (720s to 3120s; target: 1500s).
- **Stage 02 Verification Checklist:** 10-Point Proof Checklist (`S8-M3-01` through `S8-M3-10`).
- **Navigation Scheme:** DD-03 Horizontal segmented tabs: `[Intro Roadmap] [Q1] [Q2] ... [QN]`.

---

## 2. Explained Questions Field Matrix

### 2.1 Package-Level Fields
| Field | Type | Required / Optional | Min Length | Description |
| :--- | :--- | :--- | :--- | :--- |
| `topicId` | UUID string | Required | N/A | Bound topic ID. |
| `subtopicId` | UUID string | Required | N/A | Bound subtopic ID. |
| `productionMode` | Enum | Required | N/A | Must equal `'EXPLAINED_QUESTIONS_VIDEO'`. |
| `conceptTitle` | String | Optional | 0 | Masterclass title / theme. |
| `introductoryConcept` | String | **Required** | **15 chars** | Orientation overview framing the problem set. |
| `targetQuestionCount` | Number | Required | N/A | Must be in `{5, 10, 15, 20}`. |
| `aspectRatio` | Enum | Required | N/A | Strictly `'16:9'`. |
| `questions` | Array | **Required** | **N items** | Ordered array of `ExplainedQuestionItem`. |

### 2.2 Per-Question Fields (`ExplainedQuestionItem`)
| Field | Type | Required / Optional | Rule / Constraint |
| :--- | :--- | :--- | :--- |
| `questionNumber` | Number | Required | 1-indexed, contiguous (1 to N). |
| `questionText` | String | Required | Minimum 5 chars; <= 180 chars advisory. |
| `options` / `optionA..D` | Object/Strings | Required | 4 distinct non-empty options (A, B, C, D). |
| `correctAnswer` | Enum | Required | Exactly `'A'`, `'B'`, `'C'`, or `'D'`. |
| `explanation` | String | Required | Minimum 5 chars. Clear mathematical/logical solution. |
| `trickOrPitfall` | String | Optional | Shortcut trick or common student misconception. |

---

## 3. Validation & Completeness Gates

1. **VAL-Q-01 / ERR_INSUFFICIENT_CONCEPT_LENGTH:** `introductoryConcept` must be >= 15 chars.
2. **VAL-Q-05 / ERR_INVALID_ASPECT_RATIO:** Aspect ratio must be `'16:9'`.
3. **VAL-Q-08 / ERR_INCOMPLETE_BATCH:** `questions.length` must exactly match `targetQuestionCount`.
4. **VAL-Q-01 & VAL-Q-02:** Every question in the batch must have:
   - `questionText` >= 5 chars.
   - 4 distinct non-empty options.
   - Valid `correctAnswer` in {A, B, C, D}.
   - `explanation` >= 5 chars.
5. **VAL-Q-06A / ERR_DUPLICATE_QUESTION:** No two questions in the batch may have duplicate statements.
6. **VAL-Q-05 / ERR_PLACEHOLDER_CONTENT:** No placeholders (`TODO`, `N/A`, `{{...}}`) permitted.
