# S9-T02: Question Challenge Short Content Specification & Field Matrix

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T02`<br>
**Effective Date**: October 17, 2026<br>
**Author**: Antigravity Software Architect & Systems Verification Engineer<br>
**Mode Identifier**: `QUESTION_CHALLENGE_SHORT` (Mode 1)<br>
**Status**: Specification Baseline (Grounded in Active Contracts; Proposals Marked Unapproved)

---

## 1. Executive Summary & Governance Authority Hierarchy

### 1.1 Objective
Deliver an authoritative, code-aligned content specification and field-level matrix for **Mode 1: Question Challenge Short (`QUESTION_CHALLENGE_SHORT`)**. This specification bridges Stage 01 Question Studio authoring with downstream production stages while preserving architectural invariants and explicitly distinguishing approved decisions from unapproved recommendations.

### 1.2 Governance Authority Hierarchy
To prevent over-claiming approval without evidence, all requirements in this specification are classified under the following strict four-tier hierarchy:

1. **Approved Architectural Decisions (ADRs)**: Binding rules formally authorized in [docs/architecture/DECISION-LOG.md](../../architecture/DECISION-LOG.md):
   - [ADR-008](../../architecture/DECISION-LOG.md#L12): Two-Tier Taxonomy (`Topic` $\to$ `Subtopic`) without legacy Category; 11 canonical RBAC roles.
   - [ADR-009](../../architecture/DECISION-LOG.md#L13): Strict 4-option MCQ invariant (`a, b, c, d`) and single correct answer key choice (`A, B, C, D`).
   - [ADR-010](../../architecture/DECISION-LOG.md#L14): Mode 1 Question Challenge Short single-short default ($N=1$), 9:16 vertical aspect ratio, and $\le 58\text{s}$ platform duration budget.
   - [ADR-011](../../architecture/DECISION-LOG.md#L15): Studio mode selection modal and typed query parameter direct linking (`?draftId=dft_...`).
   - [ADR-002](../../architecture/DECISION-LOG.md#L6) / Principle 3: Canonical 15-stage workflow and GAR-02 anti-self-approval rule ($authorId \neq approverId$).
2. **Verified Runtime Behavior & Active Contracts**: Grounded directly in existing, compiled TypeScript types and validators:
   - `shared/types/question.ts`, `shared/types/production-context.ts`, `shared/registry/content-mode.registry.ts`, and `shared/types/content.ts`.
   - `evaluateStep01CandidateState` in `shared/contracts/question-generation/question-generation.contract.ts`.
   - `validateProductionModeConfig` and `contentModeRegistry.validateConfig`.
   - `questionGenerationService.saveDraft` and `submitForVerification` in `backend/domain/question-generation/question-generation.service.ts`.
   - Canonical ID generation and validation in `shared/lib/id.service.ts` (`canonicalIdService`) and `isLegacyDraftId()`.
3. **Editorial & Engineering Recommendations (Unapproved Proposals)**:
   - Specific narrative segment time windows (e.g. 0–3s hook, 18–25s pause).
   - Visual rendering aesthetics (green highlight color `#22C55E`, checkmark badges, chime sounds).
   - Editorial caption length targets (e.g. 2 lines / 90 characters).
   - *Status*: Unapproved design guidance; helpful for implementation planning but not formal policy.
4. **Unresolved Policy Decisions (UPDs)**:
   - Documented in Section 6 with operational impact and required approval authority. Must not be claimed as approved without explicit Project Owner sign-off.

---

## 2. Mode 1 Package Architecture

### 2.1 Mode Identity & Purpose
| Dimension | Specification | Governance Tier | Reference |
| :--- | :--- | :---: | :--- |
| **Production Mode** | `QUESTION_CHALLENGE_SHORT` (`ContentProductionMode`) | ADR-010 / Active Contract | `shared/types/production-context.ts` |
| **Numeric Code** | `MODE_1` | Active Contract | `shared/registry/content-mode.registry.ts` |
| **Short Display Label** | `Challenge Short` | Active Contract | `shared/registry/content-mode.registry.ts` |
| **Primary Goal** | Rapid viewer engagement, viral comment challenge, mental shortcut reveal ("Burra Trick"), and competitive exam aptitude practice. | Editorial Specification | `S8-T03 §2.1` |
| **Target Distribution** | YouTube Shorts (primary), Instagram Reels, Facebook Reels | Active Contract | `shared/constants/enums.ts` (`PublishingPlatform`) |

### 2.2 Physical Media Constraints & Question Count Semantics
- **Aspect Ratio**: Strictly **`9:16` Vertical Portrait** ($1080 \times 1920\text{ px}$). Landscape (`16:9`) is rejected for Mode 1 by `validateProductionModeConfig`.
- **Duration Budget**:
  - Minimum Duration: $30\text{ seconds}$ (per `content-mode.registry.ts`).
  - Target Duration: $52\text{ seconds}$ (design guideline).
  - Maximum Safe Duration: $58\text{ seconds}$ (hard ceiling in `content-mode.registry.ts` to prevent platform truncation under 60s).
- **Question Count Semantics**:
  - **Single Published Video**: Contains **exactly 1 question** ($N=1$).
  - **Batch Creation Series**: While configuration validation accepts counts `[1, 5, 10, 15, 20]`, runtime workbench code and backend persistence currently author and persist **single question drafts** ($N=1$). Multi-instance batch dispatching is an unbuilt capability (ADR-010 OD-02 / S9-T01).

### 2.3 Recommended Narrative Choreography (Unapproved Editorial Guidance)
The following 5-segment choreography represents recommended editorial guidance from Sprint 8 design specifications. These timings are target approximations for scripting and are not hardcoded validator constraints:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│             RECOMMENDED MODE 1 NARRATIVE CHOREOGRAPHY (TARGET: ≤ 58s)                            │
├───────────────┬──────────────┬───────────────────────────────────────────────────────────────────┤
│ Segment       │ Target Time  │ Recommended Editorial & Visual Function                           │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 1. Hook       │ 0s – 3s      │ Provocative question challenge hook in Telugu.                    │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 2. Problem &  │ 3s – 18s     │ Problem statement presentation with 4 distinct MCQ options        │
│    Options    │              │ labeled with Telugu characters (ఎ, బి, సి, డి).                    │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 3. Comment    │ 18s – 25s    │ Visual countdown pause (target 5s) inviting viewer comments:      │
│    Challenge  │              │ "వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి!"                        │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 4. Reveal &   │ 25s – 50s    │ Correct option highlight; step-by-step mathematical proof and     │
│    Shortcut   │              │ mental math speed trick ("బుర్ర ట్రిక్").                           │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 5. Outro &    │ 50s – 58s    │ Pinned-comment teaser and follow call-to-action: "సరైన ఆన్సర్ పిన్│
│    CTA        │              │ కామెంట్‌లో ఉంది! రేపటి ఛాలెంజ్ కోసం ఫాలో అవ్వండి."                 │
└───────────────┴──────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 3. Comprehensive Field-Level Specification Matrix

### 3.1 Requirement Classification Legend
To ensure strict alignment with TypeScript interfaces and runtime backend code, every field is classified under one of the following requirement categories:
- **Required TS Property**: Mandatory field on `QuestionDraft` or `Question` TypeScript interface.
- **Runtime-Enforced**: Explicitly validated by runtime domain validators (e.g. `saveDraft`, `evaluateStep01CandidateState`, `submitForVerification`).
- **Conditional Requirement**: Optional on generic entity types in TypeScript, but strictly required when operating in Mode 1 workflows.
- **Optional Compatibility Projection**: Flat or legacy alias populated automatically for backward compatibility (not independently required).
- **Downstream Output (DO)**: Produced in subsequent workflow stages (Scripting, Rendering, Publishing).
- **Proposed / Non-Canonical (PNC)**: Field recommended in editorial proposals that does not exist in canonical TypeScript interfaces.

---

### 3.2 Stage 01 Question Draft & Question Entity Matrix

| Canonical Field Name | Contract Location & Type | Requirement Category | Actual Validation Constraints (Runtime vs Proposed) | Persistence Location & Lifecycle | Public Output / Render Destination |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`id` (Draft)** | `QuestionDraft.id`<br>`string` | **Required TS Property** & **Runtime-Enforced** | Generated statelessly as `dft_<uuid_v4>` via `canonicalIdService.generateDraftId()`.<br>*Compatibility*: Runtime also accepts legacy format `^BP-DFT-\d+$` (e.g. `BP-DFT-1042`) validated by `isLegacyDraftId()`. | `question_drafts/{draftId}`.<br>Stage 01 lifecycle. | **Internal Only**.<br>Never exposed to audience. |
| **`id` (Question)** | `Question.id`<br>`string` | **Required TS Property** (Stage 02+) | Generated statelessly as `qst_<uuid_v4>` via `canonicalIdService.generateQuestionId()`.<br>*Compatibility*: Also supports legacy formats `BP-Q-###` / `QST-###`.<br>*Correlation*: Linked to root asset via `contentId?: string` (`BP-CNT-######` or `cnt_<uuid_v4>`). | `questions/{questionId}`.<br>Stage 02+ persistent entity. | **Internal Only**.<br>Used for database correlation. |
| **`productionMode`** | `productionMode?: string`<br>`shared/types/question.ts` | **Conditional Requirement** (Mode 1) | Optional in TypeScript on `QuestionDraft`, but **Runtime-Enforced** as `'QUESTION_CHALLENGE_SHORT'` for Mode 1. Validated by `validateProductionModeConfig`. | Persisted on draft, question, and context. | **Internal Only**.<br>Directs workbench routing. |
| **`topicId`** | `QuestionDraft.topicId`<br>`string` | **Required TS Property** & **Runtime-Enforced** | Must be a non-empty string matching an existing root topic in `topics` collection (`top_<uuid>` or legacy `TOP-*`). Validated by `resolveTaxonomyTopic()`. | `question_drafts.topicId`, `questions.topicId`. | **Public Platform Metadata**.<br>Used in playlist / tag mapping. |
| **`topicName`** | `QuestionDraft.topicName?: string`<br>`Question.topicName: string` | **Required on Question** (Derived on Draft) | Optional in TypeScript on `QuestionDraft`, but **Required on `Question`**. Resolved from taxonomy service during draft save and persisted as a snapshot. | `question_drafts.topicName`, `questions.topicName`. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`subtopicId`** | `QuestionDraft.subtopicId`<br>`string` | **Required TS Property** & **Runtime-Enforced** | Must be a non-empty string matching a subtopic in `subtopics` and satisfying parent-child link `subtopic.topicId === topic.id`. Validated by `resolveTaxonomySubtopic()`. | `question_drafts.subtopicId`, `questions.subtopicId`. | **Public Platform Metadata**.<br>Used in playlist / hashtag mapping. |
| **`subtopicName`** | `QuestionDraft.subtopicName?: string`<br>`Question.subtopicName: string` | **Required on Question** (Derived on Draft) | Optional in TypeScript on `QuestionDraft`, but **Required on `Question`**. Resolved from taxonomy service during draft save and persisted as a snapshot. | `question_drafts.subtopicName`, `questions.subtopicName`. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`language`** | `language?: QuestionLanguage \| string`<br>`shared/types/question.ts` | **Runtime-Enforced** (Defaults to TELUGU) | Optional in TypeScript; defaults to `'TELUGU'` in `saveDraft`.<br>*Enum Scope*: `shared/constants/enums.ts` defines 4 values: `TELUGU`, `ENGLISH`, `HINGLISH`, `TELUGU_ENGLISH`.<br>*UI Scope*: `loadGenerationOptions()` and `GenerationConfigPanel.tsx` currently return and expose only `['TELUGU', 'ENGLISH']`. (Hinglish/Telugu-English exist in contracts but are not in the Studio UI dropdown). | `question_drafts.language`, `questions.language`. | **Audience Facing**.<br>Determines audio voiceover & subtitle script. |
| **`difficulty`** | `QuestionDraft.difficulty`<br>`DifficultyLevel \| string` | **Required TS Property** | Reuses canonical enum `DifficultyLevel`: `EASY`, `MEDIUM`, `HARD`. (Defaults to `'Intermediate'` / `MEDIUM` if omitted in payload). | `question_drafts.difficulty`, `questions.difficulty`. | **Public Platform Metadata**.<br>Rendered as optional on-screen badge. |
| **`questionCount`** | `targetQuestionCount?: number`<br>`shared/types/question.ts` | **Conditional Requirement** | Optional in TypeScript; validated by `validateProductionModeConfig` for Mode 1: accepts `1` (default) or `[5, 10, 15, 20]` (batch creation series). | `question_drafts.targetQuestionCount`. | **Internal Only**.<br>Determines batch dispatching scope. |
| **`aspectRatio`** | `aspectRatio?: string`<br>`shared/types/question.ts` | **Conditional Requirement** | Optional in TypeScript; strictly validated by `validateProductionModeConfig` to `'9:16'` (Vertical Portrait) for Mode 1. | Persisted in mode config and video records. | **Render Engine Constraint**.<br>Canvas dimension: $1080 \times 1920\text{ px}$. |
| **`questionText`** | `QuestionDraft.questionText`<br>`string` | **Required TS Property** & **Runtime-Enforced** | Must be a non-empty string. `evaluateStep01CandidateState` enforces `length >= 5`.<br>*Note*: Character upper bounds (e.g. 180 chars) are proposed editorial guidelines, not runtime validator limits. | `question_drafts.questionText`, `questions.questionText`. | **Public Rendered Video**.<br>Rendered on-screen during Problem segment. |
| **`options`** | `QuestionDraft.options`<br>`{ a: string, b: string, c: string, d: string }` | **Required TS Property** & **Runtime-Enforced (Canonical)** | Canonical nested representation. `evaluateStep01CandidateState` strictly enforces all 4 choices non-empty and verifies that pairwise choice texts are distinct (no duplicate choices). | `question_drafts.options`, `questions.options`. | **Public Rendered Video**.<br>Displayed on-screen as choice cards (ఎ, బి, సి, డి). |
| **`optionA` – `optionD`** | `optionA?: string` ... `optionD?: string`<br>`shared/types/question.ts` | **Optional Compatibility Projections** | Optional flat string properties in TypeScript. Populated automatically by `saveDraft` from `options` for backward compatibility with form bindings. **Not independently required alongside `options`.** | Stored on draft/question alongside `options`. | **Form / Shim Projections**.<br>Used by legacy form bindings. |
| **`correctAnswer`** | `QuestionDraft.correctAnswer`<br>`'A' \| 'B' \| 'C' \| 'D'` | **Required TS Property** & **Runtime-Enforced** | Strictly one of `'A'`, `'B'`, `'C'`, or `'D'`. Validated by `evaluateStep01CandidateState` and `validateCandidate()`. | Separately stored key in `question_drafts` and `questions`. | **Audience Facing (Reveal Only)**.<br>Highlighted on-screen at $t \ge 25\text{s}$. |
| **`explanation`** | `QuestionDraft.explanation`<br>`string` | **Required TS Property** & **Runtime-Enforced** | Length $\ge 5$ characters required for verification submission (`evaluateStep01CandidateState`). Contains full mathematical proof. | `question_drafts.explanation`, `questions.explanation`. | **Script & Teleprompter**.<br>Spoken explanation in Reveal segment. |
| **`realWorldContext`** | `realWorldContext?: string`<br>`shared/types/question.ts` | **Optional Property** | Optional string in `QuestionDraft`. (`realLifeContext` is a supported alias).<br>*Note*: No length limit (e.g. 120 chars) exists in active validators. | `question_drafts.realWorldContext`. | **Scripting Input**.<br>Used in Segment 1 hook generation. |
| **`challengeType`** | `challengeType?: string`<br>`shared/types/question.ts` | **Conditional Requirement** | Optional in TypeScript; normalized to `'ABCD'` for Mode 1 per ADR-009. Non-MCQ challenge formats are prohibited. | `question_drafts.challengeType`. | **Internal Only**.<br>Enforces 4-option validation schema. |
| **`presentationType`** | `presentationType?: string`<br>`shared/types/question.ts` | **Optional Property** | E.g. `'SPEED_MATH_TRICK'`, `'STANDARD_MCQ'`, `'TEXT_ONLY'`. Normalized to `'TEXT_ONLY'` if unset in `saveDraft`. | `question_drafts.presentationType`. | **Rendering Bay Style**.<br>Directs visual template selection. |
| **`questionStyle`** | `questionStyle?: QuestionStyle \| string`<br>`shared/types/question.ts` | **Optional Property** | Canonical enum value from `shared/constants/enums.ts`. Defaults to `'STORY_BASED'` if unspecified in `saveDraft`. | `question_drafts.questionStyle`. | **AI Prompting Guidance**. |
| **`version`** | `version?: number`<br>`shared/types/question.ts` | **Runtime-Enforced (OCC)** | Optional in TypeScript on `QuestionDraft`, but **Runtime-Enforced**: initialized to `1` by `saveDraft`, incremented on every update. Stale version rejects with HTTP 409 `ConcurrencyConflictError`. Positive integer required by `submitForVerification`. | `question_drafts.version`, `questions.version`. | **Internal OCC Gate**.<br>Guards against concurrent overwrites. |
| **`status`** | `status: QuestionStatus \| string`<br>`shared/types/question.ts` | **Required TS Property** & **Runtime-Enforced** | Reuses canonical enum `QuestionStatus`: `DRAFT`, `GENERATED`, `EDITING`, `APPROVED`, `REJECTED`, `ARCHIVED`.<br>*Workflow Lifecycle*: Created as `DRAFT`. Updated to transient string `'SUBMITTED_FOR_REVIEW'` during `submitForVerification()`. Approved entity written as `APPROVED`. | `question_drafts.status`, `questions.status`. | **Internal Workflow State**.<br>Never exposed to audience. |
| **`workflowStage`** | `workflowStage?: string`<br>`shared/types/question.ts` | **Conditional Runtime Property** | Set to `'STAGE_02_VERIFICATION'` upon `submitForVerification()`. Associated with `WorkflowStepNumber` (1 to 15). | `question_drafts.workflowStage`, `workflow_instances`. | **Internal Workflow Engine**.<br>Governs role permissions. |
| **`authorId`** | `authorId?: string`<br>`shared/types/question.ts` | **Runtime-Enforced (GAR-02)** | Populated with authenticated user ID (`usr_<uuid_v4>`) of creator. Required for GAR-02 anti-self-approval enforcement. | Persisted in draft and question records. | **Internal Audit & GAR-02 Gate**.<br>Prevents author from self-approving. |
| **`authorName`** | `authorName?: string`<br>`shared/types/question.ts` | **Optional Property** | Display name of the author for internal team audit. | Persisted snapshot in draft record. | **Internal Team Display**.<br>Never exposed to audience. |
| **`mathematicalVerification`** | `mathematicalVerification?: any`<br>`shared/types/question.ts` | **Optional Property** | Advisory AI verification summary (`PROVABLY_VALID`, `CONTRADICTORY`, etc.). | `question_drafts.mathematicalVerification`. | **Internal Verification Workbench**.<br>Advisory only under AP-009. |
| **`createdAt`, `updatedAt`** | `createdAt: string`, `updatedAt: string`<br>`shared/types/question.ts` | **Required TS Property** | ISO 8601 UTC timestamp strings populated automatically on save/update. | Persisted on all Firestore documents. | **Internal Audit & Sorting**.<br>Never exposed to audience. |

---

### 3.3 Downstream Production & Publishing Fields (Stage 03+)

The following fields belong to subsequent stages in the 15-stage workflow. They are documented here to establish end-to-end trace, but they are **not authored or stored on `QuestionDraft` in Stage 01**:

| Field Name | Canonical Location & Contract Status | Class | Stage | Operational Definition & Constraints | Public Destination |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`hookText`** | `Script.hookText`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 03 | Opening voiceover script for Segment 1. | Spoken audio & on-screen text. |
| **`speedTrickOrTakeaway`** | `Script.speedTrickOrTakeaway`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 03 | Mental math shortcut / "Burra Trick" verbal explanation.<br>*Note*: On `QuestionDraft`, shortcuts are captured in `explanation` unless UPD-01 introduces a dedicated field. | Spoken audio in Segment 4. |
| **`callToAction`** | `Script.callToAction`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 03 | Outro script directing viewers to like, comment, and follow. | Spoken audio & outro card. |
| **`answerLeakageDetected`** | `SpokenTeleprompterScriptPayload`<br>`shared/types/content.ts` (Active Contract) | DV | Stage 03 / 10 | Boolean check. Must be `false`. Evaluates whether correct answer choice leaked into title, hook, or opening segments. | **Internal Quality Gate**.<br>Blocks publishing if `true`. |
| **`shortTitle`** | `SocialMetadataPayload.shortTitle`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 10 | Max 100 characters. Public video title for YouTube Shorts and Reels. | Public platform video title. |
| **`socialCaption`** | `SocialMetadataPayload.socialCaption`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 10 | Max 500 characters. Post caption on Instagram and Facebook. | Public platform caption. |
| **`hashtags`** | `SocialMetadataPayload.hashtags`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 10 | Array of strings (e.g. `['#BurraPariksha', '#SpeedMath']`). | Public platform tags. |
| **`pinnedCommentPrompt`** | `SocialMetadataPayload.cta.pinnedCommentPrompt`<br>`shared/types/content.ts` (Active Contract) | DO | Stage 10 | Engagement copy for pinned comment. | Public pinned comment. |
| **`countdownTimerMs`** | **Proposed / Non-Canonical (PNC)**<br>Mentioned in S8-T03; not in canonical types. | PNC | Stage 04 | Proposed parameter (`3000` or `5000` ms) for countdown graphic timer.<br>*Active Contract Status*: `shared/types/content.ts` uses `pauseDurationSeconds` / `pauseAfterMs` in teleprompter segments. | On-screen graphic countdown timer. |
| **`commentPromptText`** | **Proposed / Non-Canonical (PNC)**<br>Mentioned in S8-T03; not in canonical types. | PNC | Stage 03 | Proposed string for on-screen comment prompt.<br>*Active Contract Status*: Handled via `Script.callToAction` or teleprompter segment text. | On-screen text card. |

---

## 4. Publication Boundary & Data Segregation Architecture

### 4.1 Strict Segregation of Operational vs. Public Package
Under BP-CMS architecture, internal operational metadata must never leak into audience-facing deliverables:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BP-CMS PUBLICATION BOUNDARY                                    │
├──────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ STRICTLY INTERNAL (FIRESTORE TRANSACTIONAL)  │ AUDIENCE-FACING (PUBLIC MEDIA & METADATA)         │
├──────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ • Entity UUIDs (dft_..., qst_..., usr_...)   │ • Rendered MP4 Video (1080x1920, 9:16 vertical)   │
│ • Author ID, Reviewer ID, Team Identifiers   │ • Question Statement Text (on-screen graphics)    │
│ • Workflow State Machine Step (1 to 15)      │ • Four Option Choice Boxes (ఎ, బి, సి, డి)        │
│ • Review Comments, Notes & Rejection Reasons │ • Correct Option Highlight (visual reveal at t≥25s│
│ • Optimistic Concurrency Control (version)   │ • "Burra Trick" Graphical Card (during reveal)    │
│ • AI Prompts, Model IDs, Tokens & Latency    │ • Spoken Voiceover Audio & Sound Effects          │
│ • Advisory Mathematical Verification Details │ • Public Social Title (shortTitle, ≤ 100 chars)   │
│ • Raw Correct Answer Key ('A'..'D') in JSON  │ • Public Social Caption & Hashtags                │
│ • Internal Invariance Reports                │ • Pinned Comment Copy & Engagement Callout        │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### 4.2 Answer Sequestration & Anti-Leakage Invariant
1. **Internal Key vs. Visual Reveal**:
   - In Cloud Firestore (`question_drafts` and `questions`), the correct answer is stored as a single-character key: `correctAnswer: 'A' | 'B' | 'C' | 'D'`.
   - In the audience-facing package, the raw JSON answer key is **never exposed**.
   - In the rendered video, the correct answer is visually revealed during the solution segment ($t \ge 25\text{s}$) by highlighting the target option choice card in green with an audio chime and presenting the mental shortcut.
2. **Anti-Leakage Quality Gate**:
   - The correct answer choice must **never appear** in:
     - The public video title (`shortTitle`).
     - The visible opening lines of the social caption (`socialCaption`).
     - The video thumbnail text or graphics.
     - Segments 1, 2, or 3 of the video or teleprompter script ($0\text{s} - 25\text{s}$).
   - `answerLeakageDetected: boolean` is an automated validation gate in `shared/types/content.ts`. If answer leakage is detected in script or metadata, the stage transition is blocked.

---

## 5. Resolution of Contract-Grounded Requirements

### 5.1 Four-Option MCQ Invariant
- **Authority**: [ADR-009](../../architecture/DECISION-LOG.md#L13), `request-schemas.ts`, and `FC-005`.
- **Rule**: Mode 1 requires **exactly four multiple-choice options** (`a`, `b`, `c`, `d`) and a single correct-answer key (`A`, `B`, `C`, `D`).
- **Enforcement**: Non-MCQ formats (e.g. true/false, open text) are prohibited. All four choices must be non-empty strings. Duplicate option text is rejected by `evaluateStep01CandidateState`.

### 5.2 Explanation Requirement Scope
- **Authority**: `shared/contracts/question-generation/question-generation.contract.ts` and `shared/registry/content-mode.registry.ts` (`inputs.requiresProofExplanation: true`).
- **Rule**: The `explanation` field is **mandatory** for Mode 1. A draft cannot be submitted for verification without a valid mathematical proof ($\ge 5\text{ characters}$).

### 5.3 Language Policy & Defaults
- **Authority**: `shared/constants/enums.ts` (`QuestionLanguage`).
- **Rule**: `QuestionLanguage` defines four valid enums: `TELUGU`, `ENGLISH`, `HINGLISH`, and `TELUGU_ENGLISH`.
- **Guidance & Runtime Boundary**: Mode 1 authoring defaults to `TELUGU`. The contract supports all four enum values. However, `loadGenerationOptions()` in `question-generation.service.ts` and `GenerationConfigPanel.tsx` currently return and expose only `['TELUGU', 'ENGLISH']` in the Studio UI dropdown. Support for Hinglish and Telugu-English remains a contract-level capability not yet active in the frontend generator.

### 5.4 Difficulty Policy
- **Authority**: `shared/constants/enums.ts` (`DifficultyLevel`).
- **Rule**: Reuses the three canonical enum values: `EASY`, `MEDIUM`, and `HARD`.
- **Default for Mode 1**: `MEDIUM` (standard aptitude difficulty).

---

## 6. Unresolved Policy Decisions Register

The following open decisions represent business, editorial, or platform policy questions that are not resolved by existing code or approved ADRs. They are documented here with evidence, operational impact, and required approval authority:

| Decision ID | Policy Topic | Current Code & Contract Evidence | Operational Impact | Recommended Policy | Required Approval Authority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UPD-01** | **Dedicated Burra Trick Field on `QuestionDraft`** | `explanation` is mandatory on `QuestionDraft`. `trickOrPitfall` exists only on `ExplainedQuestionItem` (Mode 3). S8-T03 mentions `burraSpeedTrick` as "Optional (recommended)". | Authors currently combine proof and shortcut into `explanation`, or wait until Stage 03 (`Script.speedTrickOrTakeaway`). | **Keep `explanation` as the sole mandatory proof field in Stage 01. Allow authors to append shortcuts in `explanation`. Defer adding a new dedicated schema field until explicitly approved.** | Project Owner / Content Lead |
| **UPD-02** | **Bilingual Typography & Subtitle Rendering Rules** | `QuestionLanguage` includes `TELUGU_ENGLISH`. Technical exam terms (e.g., "Profit & Loss", "Speed", "Hypotenuse") are commonly spoken in English by Telugu students. | Video render engine subtitle generator requires a typography policy for Latin glyphs vs. Telugu Unicode glyphs in 9:16 vertical canvas. | **Render formulas and option keys ($A, B, C, D$) in Latin script; render narrative text in Telugu Unicode (Gautami/Suranna font).** | Video Lead & Creative Director |
| **UPD-03** | **Pinned Comment Content Strategy** | S8-T03 states: *"సరైన ఆన్సర్ పిన్ కామెంట్‌లో ఉంది!"*. However, Segment 4 of the video also reveals the answer at $t \ge 25\text{s}$. | Comment section engagement directly impacts YouTube Shorts algorithm retention and distribution. | **Pinned comment provides the correct answer + step summary + a bonus "Home Challenge" question to drive comment replies.** | Social Media / Publishing Lead |
| **UPD-04** | **Platform Caption Truncation Thresholds** | `SocialMetadataPayload` defines `socialCaption` with max 500 characters. Mobile video overlays truncate descriptions after ~90-100 characters. | Long captions obstruct the lower third of the 9:16 video on mobile screens. | **Enforce a recommended 2-line "Hook Caption" threshold ($\le 90\text{ characters}$) before the ellipsis break.** | Publishing Lead |
| **UPD-05** | **Batch Creation Series Runner Architecture (OD-02)** | ADR-010 approved batch series selection ($5, 10, 15, 20$) as conceptual Option A, but classified the batch execution runner as Open Decision OD-02. S9-T01 verified that runtime code only creates single drafts ($N=1$). | Selecting $>1$ in UI accepts configuration but does not spawn multiple workflow instances. | **Maintain Single-Short ($N=1$) as the sole operational execution scope for Sprint 9. Assign batch runner implementation to a dedicated future infrastructure task.** | Project Owner / Architecture Review Board |

---

## 7. Contract & Schema Alignment Notes

1. **Options Normalization**:
   - Canonical contract is `options: { a: string, b: string, c: string, d: string }`.
   - `optionA` through `optionD` are optional compatibility projections.
   - Persistence service normalizes flat inputs into the canonical `options` object upon writing to Firestore.
2. **Context Aliasing**:
   - `realWorldContext` and `realLifeContext` are mutual aliases across contracts and services.
   - Canonical standard for new contracts is `realWorldContext`; `realLifeContext` is preserved as a backward-compatibility shim.
3. **Downstream Field Gaps**:
   - Fields such as `countdownTimerMs` and `commentPromptText` from S8-T03 are not part of canonical shared contracts (`shared/types/content.ts`). Downstream tasks (Stage 03 Scripting, Stage 04 Rendering) must map them to canonical properties (`pauseDurationSeconds`, `pauseAfterMs`, `Script.callToAction`) or formally propose contract amendments.

---

## 8. Readiness Verdict & Next Action

- **Specification Status**: **`COMPLIANT WITH EXISTING CONTRACTS & ADRs`**
- **Evidence-Based Verdict**:
  - Reuses exact canonical types without inventing unbacked schemas or duplicate requirements.
  - Distinguishes approved ADRs from editorial recommendations and unresolved decisions.
  - Preserves Cloud Firestore transactional authority and single-short ($N=1$) runtime boundary.
  - Zero application code, database migrations, or production data modified.
- **Next Action**: Task `S9-T02` deliverable established. **Do NOT begin Task `S9-T03`**.
