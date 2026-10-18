# S10-T06: Mode 3: Explained Questions Video Typed Contract Specification

**Sprint:** Sprint 10
**Task ID:** S10-T06
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Typed Contract & Schema Mapping
**Authority:** `shared/contracts/question-generation/question-generation.contract.ts`, `shared/types/question.ts`

---

## 1. Explained Questions TypeScript Contract

```typescript
export interface ExplainedQuestionsPackageCandidate {
  topicId: string;
  subtopicId: string;
  productionMode: 'EXPLAINED_QUESTIONS_VIDEO';
  targetQuestionCount: 5 | 10 | 15 | 20;
  aspectRatio: '16:9';
  conceptTitle?: string;
  introductoryConcept: string;
  syllabusScopeNotes?: string;
  questions: ExplainedQuestionItem[];
  language: QuestionLanguage | string;
  difficulty: DifficultyLevel | string;
  tags?: string[];
}

export interface ExplainedQuestionItem {
  questionNumber: number;
  slotId?: string;
  questionText: string;
  options: { a: string; b: string; c: string; d: string };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  trickOrPitfall?: string;
}
```

---

## 2. Valid vs Invalid Payload Examples

### 2.1 Valid Explained Questions Masterclass (5 Questions)
```json
{
  "topicId": "TOP-QA-01",
  "subtopicId": "SUB-01",
  "productionMode": "EXPLAINED_QUESTIONS_VIDEO",
  "targetQuestionCount": 5,
  "aspectRatio": "16:9",
  "conceptTitle": "à°°à±ˆà°²à± à°¸à°®à°¸à±à°¯à°²à± â€” à°®à°¾à°¸à±à°Ÿà°°à±â€Œà°•à±à°²à°¾à°¸à±",
  "introductoryConcept": "à°ˆ à°µà±€à°¡à°¿à°¯à±‹à°²à±‹ à°®à°¨à°‚ à°°à±ˆà°²à± à°¸à°®à°¸à±à°¯à°² (Trains Problems) à°ªà±ˆ 5 à°•à±€à°²à°•à°®à±ˆà°¨ à°ªà±à°°à°¾à°•à±à°Ÿà±€à°¸à± à°ªà±à°°à°¶à±à°¨à°²à°¨à± à°¨à±‡à°°à±à°šà±à°•à±à°‚à°¦à°¾à°‚.",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "à°’à°• à°°à±ˆà°²à± 60 à°•à°¿.à°®à±€/à°—à°‚ à°µà±‡à°—à°‚à°¤à±‹ à°ªà±à°°à°¯à°¾à°£à°¿à°¸à±à°¤à±‹à°‚à°¦à°¿. 300 à°®à±€à°Ÿà°°à±à°² à°¦à±‚à°°à°¾à°¨à±à°¨à°¿ à°Žà°‚à°¤ à°¸à°®à°¯à°‚à°²à±‹ à°¦à°¾à°Ÿà±à°¤à±à°‚à°¦à°¿?",
      "options": { "a": "15 à°¸à±†à°•à°¨à±à°²à±", "b": "18 à°¸à±†à°•à°¨à±à°²à±", "c": "20 à°¸à±†à°•à°¨à±à°²à±", "d": "25 à°¸à±†à°•à°¨à±à°²à±" },
      "correctAnswer": "B",
      "explanation": "à°µà±‡à°—à°‚ = 60 * 5/18 = 50/3 m/s. à°•à°¾à°²à°‚ = 300 / (50/3) = 18 à°¸à±†à°•à°¨à±à°²à±."
    },
    {
      "questionNumber": 2,
      "questionText": "à°°à±†à°‚à°¡à± à°°à±ˆà°³à±à°²à± à°µà±à°¯à°¤à°¿à°°à±‡à°• à°¦à°¿à°¶à°²à°²à±‹ à°ªà±à°°à°¯à°¾à°£à°¿à°¸à±à°¤à±à°¨à±à°¨à°ªà±à°ªà±à°¡à± à°µà°¾à°Ÿà°¿ à°¸à°¾à°ªà±‡à°•à±à°· à°µà±‡à°—à°‚ à°Žà°‚à°¤?",
      "options": { "a": "à°µà±‡à°—à°¾à°² à°®à±Šà°¤à±à°¤à°‚", "b": "à°µà±‡à°—à°¾à°² à°µà±à°¯à°¤à±à°¯à°¾à°¸à°‚", "c": "à°µà±‡à°—à°¾à°² à°—à±à°£à°•à°¾à°°à°‚", "d": "à°µà±‡à°—à°¾à°² à°¸à°—à°Ÿà±" },
      "correctAnswer": "A",
      "explanation": "à°µà±à°¯à°¤à°¿à°°à±‡à°• à°¦à°¿à°¶à°²à±à°²à±‹ à°¸à°¾à°ªà±‡à°•à±à°· à°µà±‡à°—à°‚ v1 + v2 à°…à°µà±à°¤à±à°‚à°¦à°¿."
    },
    {
      "questionNumber": 3,
      "questionText": "120 à°®à±€à°Ÿà°°à±à°² à°ªà±Šà°¡à°µà± à°—à°² à°°à±ˆà°²à± à°¸à±à°¤à°‚à°­à°¾à°¨à±à°¨à°¿ 6 à°¸à±†à°•à°¨à±à°²à°²à±‹ à°¦à°¾à°Ÿà°¿à°¤à±‡ à°¦à°¾à°¨à°¿ à°µà±‡à°—à°‚ à°Žà°‚à°¤?",
      "options": { "a": "54 à°•à°¿.à°®à±€/à°—à°‚", "b": "72 à°•à°¿.à°®à±€/à°—à°‚", "c": "90 à°•à°¿.à°®à±€/à°—à°‚", "d": "36 à°•à°¿.à°®à±€/à°—à°‚" },
      "correctAnswer": "B",
      "explanation": "à°µà±‡à°—à°‚ = 120/6 = 20 m/s = 20 * 18/5 = 72 km/h."
    },
    {
      "questionNumber": 4,
      "questionText": "à°ªà±à°²à°¾à°Ÿà±â€Œà°«à°¾à°°à°®à±â€Œà°¨à± à°¦à°¾à°Ÿà°¡à°¾à°¨à°¿à°•à°¿ à°ªà°Ÿà±à°Ÿà±‡ à°¸à°®à°¯à°‚ à°²à±†à°•à±à°•à°¿à°‚à°šà±‡à°Ÿà°ªà±à°ªà±à°¡à± à°°à±ˆà°²à± à°ªà±Šà°¡à°µà±à°¤à±‹ à°ªà°¾à°Ÿà± à°à°®à°¿ à°•à°²à°ªà°¾à°²à°¿?",
      "options": { "a": "à°Ÿà±à°°à°¾à°•à± à°ªà±Šà°¡à°µà±", "b": "à°ªà±à°²à°¾à°Ÿà±â€Œà°«à°¾à°°à°®à± à°ªà±Šà°¡à°µà±", "c": "à°¸à°¿à°—à±à°¨à°²à± à°¦à±‚à°°à°‚", "d": "à°‡à°‚à°œà°¨à± à°¬à°°à±à°µà±" },
      "correctAnswer": "B",
      "explanation": "à°®à±Šà°¤à±à°¤à°‚ à°¦à±‚à°°à°‚ = à°°à±ˆà°²à± à°ªà±Šà°¡à°µà± + à°ªà±à°²à°¾à°Ÿà±â€Œà°«à°¾à°°à°®à± à°ªà±Šà°¡à°µà±."
    },
    {
      "questionNumber": 5,
      "questionText": "à°’à°• à°°à±ˆà°²à± à°Ÿà°¨à±à°¨à±†à°²à±â€Œà°¨à± à°¦à°¾à°Ÿà°¡à°¾à°¨à°¿à°•à°¿ à°ªà°Ÿà±à°Ÿà±‡ à°¸à°®à°¯à°‚ 30 à°¸à±†à°•à°¨à±à°²à±. à°°à±ˆà°²à± à°ªà±Šà°¡à°µà± 200 à°®à±€, à°Ÿà°¨à±à°¨à±†à°²à± 400 à°®à±€ à°…à°¯à°¿à°¤à±‡ à°µà±‡à°—à°‚ à°Žà°‚à°¤?",
      "options": { "a": "60 à°•à°¿.à°®à±€/à°—à°‚", "b": "72 à°•à°¿.à°®à±€/à°—à°‚", "c": "80 à°•à°¿.à°®à±€/à°—à°‚", "d": "90 à°•à°¿.à°®à±€/à°—à°‚" },
      "correctAnswer": "B",
      "explanation": "à°®à±Šà°¤à±à°¤à°‚ à°¦à±‚à°°à°‚ = 600 à°®à±€. à°µà±‡à°—à°‚ = 600/30 = 20 m/s = 72 km/h."
    }
  ]
}
```

### 2.2 Invalid Payload (Missing Explanation in Question #3)
```json
{
  "topicId": "TOP-QA-01",
  "subtopicId": "SUB-01",
  "productionMode": "EXPLAINED_QUESTIONS_VIDEO",
  "targetQuestionCount": 5,
  "aspectRatio": "16:9",
  "introductoryConcept": "à°ˆ à°µà±€à°¡à°¿à°¯à±‹à°²à±‹ à°®à°¨à°‚ à°°à±ˆà°²à± à°¸à°®à°¸à±à°¯à°² à°ªà±ˆ à°ªà±à°°à°¾à°•à±à°Ÿà±€à°¸à± à°ªà±à°°à°¶à±à°¨à°²à°¨à± à°¨à±‡à°°à±à°šà±à°•à±à°‚à°¦à°¾à°‚.",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "à°¸à°®à°¸à±à°¯ 1 à°ªà°¾à° à±à°¯à°‚...",
      "options": { "a": "A", "b": "B", "c": "C", "d": "D" },
      "correctAnswer": "A",
      "explanation": "à°µà°¿à°µà°°à°£ 1..."
    },
    {
      "questionNumber": 2,
      "questionText": "à°¸à°®à°¸à±à°¯ 2 à°ªà°¾à° à±à°¯à°‚...",
      "options": { "a": "A", "b": "B", "c": "C", "d": "D" },
      "correctAnswer": "B",
      "explanation": "" // Missing explanation -> Rejected with VAL-Q-03 (ERR_EMPTY_EXPLANATION)
    }
  ]
}
```

---

## 3. Firestore Datastore Mapping

The record persists to `question_drafts` with:
- `productionMode = 'EXPLAINED_QUESTIONS_VIDEO'`
- `targetQuestionCount = 5 | 10 | 15 | 20`
- `aspectRatio = '16:9'`
- `introductoryConcept = candidate.introductoryConcept`
- `conceptTitle = candidate.conceptTitle`
- `questions = candidate.questions` (exact ordered array)
