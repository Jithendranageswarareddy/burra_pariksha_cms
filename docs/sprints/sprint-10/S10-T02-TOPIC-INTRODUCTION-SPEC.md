# S10-T02: Content Specification â€” Mode 2: Topic Introduction

**Sprint:** Sprint 10
**Task ID:** S10-T02
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Requirements Baseline
**Authority:** `shared/registry/content-mode.registry.ts`, `shared/types/production-context.ts`

---

## 1. Pedagogical Scope & Objectives

Mode 2 (`TOPIC_INTRODUCTION`) provides structured conceptual orientation for competitive exams (APPSC, TSPSC, Banking, SSC). It demystifies key principles, definitions, exam relevance, weightage, and real-world intuition before students encounter practice questions.

### Canonical Constraints
- **Question Count:** Strictly **0 questions** (enforced by `ContentModeRegistry`, `TopicIntroWorkspace`, and `questionQualityValidator`).
- **Aspect Ratio:** Configurable **9:16** (Vertical Short ~60s Hook) or **16:9** (Landscape Video ~90s Overview).
- **Target Duration:** 60 to 180 seconds (target: 90s).
- **Stage 02 Verification Checklist:** 5-Point Concept Accuracy Checklist (`S8-M2-01` through `S8-M2-05`).

---

## 2. Topic Introduction Field Matrix

| Field | Type | Required / Optional | Min Length | Description & Audience Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `topicId` | UUID string | Required | N/A | Bound topic ID from the two-tier taxonomy. |
| `subtopicId` | UUID string | Required | N/A | Bound subtopic ID from the two-tier taxonomy. |
| `productionMode` | Enum | Required | N/A | Must equal `'TOPIC_INTRODUCTION'`. |
| `conceptTitle` | String | Optional (Recommended) | 0 | Catchy headline hook in Telugu / English. |
| `introductoryConcept` | String | **Required** | **15 chars** | Core definition, conceptual explanation, shortcut intuition. Audience-facing. |
| `syllabusScopeNotes` | String | Optional | 0 | Exam weightage, syllabus section mapping, formula overview. |
| `realLifeContext` | String | Optional | 0 | Relatable everyday scenario or emotional hook. |
| `aspectRatio` | Enum | Required | N/A | `'9:16'` or `'16:9'`. Default: `'9:16'`. |
| `targetQuestionCount` | Number | Required | N/A | Enforced `0`. |
| `questions` | Array | Forbidden / Empty | N/A | Enforced empty array or undefined. |

---

## 3. Validation & Stage Gate Rules

1. **VAL-Q-01 / ERR_INSUFFICIENT_CONCEPT_LENGTH:** `introductoryConcept` must be at least 15 characters. Empty or shorter strings block verification submission with HTTP 422.
2. **VAL-Q-05 / ERR_PLACEHOLDER_CONTENT:** Placeholders (`TODO`, `N/A`, `{{...}}`) are strictly prohibited in `introductoryConcept`.
3. **VAL-Q-05 / ERR_INVALID_ASPECT_RATIO:** Aspect ratio must be either `9:16` or `16:9`.
4. **VAL-Q-05 / ERR_INVALID_TARGET_COUNT:** `targetQuestionCount` must be 0; any non-empty `questions` array is rejected.
5. **Stage 02 Verification:** Handled by QA reviewer evaluating the 5-point concept checklist under strict GAR-02 ($authorId \neq reviewerId$).
