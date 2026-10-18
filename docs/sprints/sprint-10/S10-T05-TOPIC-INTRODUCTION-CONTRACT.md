# S10-T05: Mode 2: Topic Introduction Typed Contract Specification

**Sprint:** Sprint 10
**Task ID:** S10-T05
**Status:** ACCEPTED WITH EVIDENCE
**Classification:** Typed Contract & Schema Mapping
**Authority:** `shared/contracts/question-generation/question-generation.contract.ts`, `database/firestore/repositories/question-drafts.repository.ts`

---

## 1. Topic Introduction TypeScript Contract

```typescript
export interface TopicIntroductionCandidate {
  topicId: string;
  subtopicId: string;
  productionMode: 'TOPIC_INTRODUCTION';
  targetQuestionCount: 0;
  aspectRatio: '9:16' | '16:9';
  conceptTitle?: string;
  introductoryConcept: string;
  syllabusScopeNotes?: string;
  realLifeContext?: string;
  language: QuestionLanguage | string;
  difficulty: DifficultyLevel | string;
  tags?: string[];
}
```

---

## 2. Valid vs Invalid Payload Examples

### 2.1 Valid Topic Introduction Payload
```json
{
  "topicId": "TOP-QA-01",
  "subtopicId": "SUB-01",
  "productionMode": "TOPIC_INTRODUCTION",
  "targetQuestionCount": 0,
  "aspectRatio": "9:16",
  "conceptTitle": "à°µà°¯à°¸à± à°¸à°®à°¸à±à°¯à°²à± â€” à°¤à±à°°à°¿à°•à°¾à°² à°¸à±‚à°¤à±à°°à°‚",
  "introductoryConcept": "à°ˆ à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°®à°¨à°‚ à°µà°¯à°¸à± à°²à±†à°•à±à°•à°²à°¨à± X à°®à°°à°¿à°¯à± Y à°¸à°®à±€à°•à°°à°£à°¾à°²à± à°²à±‡à°•à±à°‚à°¡à°¾, à°•à±‡à°µà°²à°‚ à°¨à°¿à°·à±à°ªà°¤à±à°¤à±à°² à°µà±à°¯à°¤à±à°¯à°¾à°¸à°‚ à°ªà°¦à±à°§à°¤à°¿à°¤à±‹ 10 à°¸à±†à°•à°¨à±à°²à°²à±‹ à°Žà°²à°¾ à°¸à°¾à°§à°¿à°‚à°šà°µà°šà±à°šà±‹ à°¨à±‡à°°à±à°šà±à°•à±à°‚à°¦à°¾à°‚.",
  "syllabusScopeNotes": "APPSC Group 2 à°ªà±à°°à°¿à°²à°¿à°®à±à°¸à± à°•à±Šà°°à°•à± à°ªà±à°°à°¾à°®à°¾à°£à°¿à°• à°¸à±‚à°¤à±à°°à°¾à°²à±.",
  "realLifeContext": "à°•à±à°Ÿà±à°‚à°¬ à°¸à°­à±à°¯à±à°² à°µà°¯à°¸à±à°¸à± à°µà°¿à°µà°¾à°¦à°¾à°²à± à°®à°°à°¿à°¯à± à°¨à°¿à°·à±à°ªà°¤à±à°¤à±à°²à±",
  "language": "TELUGU",
  "difficulty": "INTERMEDIATE"
}
```

### 2.2 Invalid Payload (Short Concept String)
```json
{
  "topicId": "TOP-QA-01",
  "subtopicId": "SUB-01",
  "productionMode": "TOPIC_INTRODUCTION",
  "targetQuestionCount": 0,
  "aspectRatio": "9:16",
  "introductoryConcept": "à°šà°¿à°¨à±à°¨ à°µà°¿à°µà°°à°£" // < 15 characters -> Rejected with VAL-Q-01 (ERR_INSUFFICIENT_CONCEPT_LENGTH)
}
```

### 2.3 Invalid Payload (Non-Zero Questions Violation)
```json
{
  "topicId": "TOP-QA-01",
  "subtopicId": "SUB-01",
  "productionMode": "TOPIC_INTRODUCTION",
  "targetQuestionCount": 5, // Violation! Mode 2 requires 0 questions -> Rejected with VAL-Q-05 (ERR_INVALID_TARGET_COUNT)
  "introductoryConcept": "à°ˆ à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°®à°¨à°‚ à°µà°¯à°¸à± à°²à±†à°•à±à°•à°²à°¨à± à°¸à°¾à°§à°¿à°‚à°šà°µà°šà±à°šà±‹ à°¨à±‡à°°à±à°šà±à°•à±à°‚à°¦à°¾à°‚."
}
```

---

## 3. Firestore Datastore Mapping

The record persists to the authoritative Firestore collection `question_drafts` with:
- `productionMode = 'TOPIC_INTRODUCTION'`
- `introductoryConcept = candidate.introductoryConcept`
- `conceptTitle = candidate.conceptTitle`
- `syllabusScopeNotes = candidate.syllabusScopeNotes`
- `realLifeContext = candidate.realLifeContext`
- `targetQuestionCount = 0`
- `questions = []` (or omitted)
- `slots = []` (or omitted)
