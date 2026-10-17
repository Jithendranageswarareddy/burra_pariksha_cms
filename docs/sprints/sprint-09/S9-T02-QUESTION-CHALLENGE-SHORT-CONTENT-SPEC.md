# S9-T02: Question Challenge Short Content Specification & Field Matrix

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T02`<br>
**Effective Date**: October 17, 2026<br>
**Auditor / Author**: Antigravity Software Architect & Systems Verification Engineer<br>
**Mode Identifier**: `QUESTION_CHALLENGE_SHORT` (Mode 1)<br>
**Status**: Authoritative Content Specification & Field Matrix Baseline

---

## 1. Executive Summary & Specification Scope

### 1.1 Objective
Deliver an authoritative, approved content specification and field-level required/optional matrix for **Mode 1: Question Challenge Short (`QUESTION_CHALLENGE_SHORT`)**, grounded strictly in existing shared contracts, active Architectural Decision Records ([ADR-008](../../architecture/DECISION-LOG.md#L12), [ADR-009](../../architecture/DECISION-LOG.md#L13), [ADR-010](../../architecture/DECISION-LOG.md#L14), [ADR-011](../../architecture/DECISION-LOG.md#L15)), and the canonical 15-stage workflow ([07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md)).

### 1.2 Non-Goals & Invariants Preserved
- **Documentation & Specification Scope Only**: Does not modify UI components, runtime validators, database schemas, or API routes.
- **Contract Fidelity**: Strictly reuses existing canonical TypeScript contracts (`shared/types/question.ts`, `shared/types/production-context.ts`, `shared/registry/content-mode.registry.ts`, `shared/contracts/question-generation/question-generation.contract.ts`, and `shared/types/content.ts`). Does not invent new identifiers, aliases, or disconnected schemas.
- **Transactional Authority**: Cloud Firestore remains the sole authoritative transactional datastore. Zero Google Sheets runtime persistence.
- **GAR-02 Anti-Self-Approval**: Enforces $authorId \neq approverId$ across verification gates without exception.
- **Single-Short Execution Focus**: Reflects the operational reality established in S9-T01: single-question vertical short ($N=1$) is the fully verified runtime path.

---

## 2. Core Content Package Architecture

### 2.1 Mode Identity & Pedagogical Purpose
| Attribute | Specification | Reference Contract |
| :--- | :--- | :--- |
| **Production Mode** | `QUESTION_CHALLENGE_SHORT` (`ContentProductionMode`) | `shared/types/production-context.ts` |
| **Numeric Code** | `MODE_1` | `shared/registry/content-mode.registry.ts` |
| **Short Display Label** | `Challenge Short` | `shared/registry/content-mode.registry.ts` |
| **Pedagogical Objective** | Rapid viewer engagement, viral comment challenge, instant mental math shortcut reveal ("Burra Trick"), and competitive exam practice (APPSC, TSPSC, SSC CGL, Banking). | `S8-T03 §2.1` |
| **Primary Platform** | YouTube Shorts ($1080 \times 1920\text{ px}$, 9:16 vertical) | `14-MEDIA-ARCHITECTURE.md` |
| **Secondary Platforms** | Instagram Reels, Facebook Reels | `shared/constants/enums.ts` (`PublishingPlatform`) |

### 2.2 Physical Media Constraints
- **Aspect Ratio**: Strictly **`9:16` Vertical Portrait** ($1080 \times 1920\text{ px}$). Landscape (`16:9`) is strictly prohibited for Mode 1.
- **Duration Budget**:
  - Minimum Duration: $30\text{ seconds}$
  - Target Duration: $52\text{ seconds}$
  - Maximum Safe Duration: $58\text{ seconds}$
  - Platform Hard Ceiling: $60\text{ seconds}$ (strictly bounded to $\le 58\text{s}$ to prevent truncation across platform transcoder variances).
- **Question Count Semantics**:
  - **Single Published Video**: Contains **exactly 1 question** ($N=1$). A multi-question Short within 58 seconds is physical nonsense.
  - **Batch Creation Series**: Selection of $N \in \{5, 10, 15, 20\}$ at the configuration level represents an approved conceptual series (ADR-010 OD-02) sharing taxonomy context, where each question forms an autonomous single-question Short. (The batch execution dispatcher remains an unbuilt downstream capability per S9-T01).

### 2.3 Narrative 5-Segment Choreography
Every Question Challenge Short follows a strict 5-segment narrative sequence:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      MODE 1: 5-SEGMENT NARRATIVE CHOREOGRAPHY (≤ 58s)                            │
├───────────────┬──────────────┬───────────────────────────────────────────────────────────────────┤
│ Segment       │ Time Window  │ Narrative & Visual Function                                       │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 1. Hook       │ 0s – 3s      │ Provocative curiosity anchor in Telugu (e.g., "ఈ ప్రశ్నను 10       │
│               │              │ సెకన్లలో సాల్వ్ చేయగలరా?").                                        │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 2. Problem &  │ 3s – 18s     │ Rapid statement presentation with 4 distinct MCQ options labeled  │
│    Options    │              │ with Telugu characters (ఎ, బి, సి, డి).                            │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 3. Comment    │ 18s – 25s    │ Visual 5-second countdown timer accompanied by explicit           │
│    Challenge  │              │ engagement invite: "వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి!"    │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 4. Reveal &   │ 25s – 50s    │ Highlight correct option in green; reveal "Burra Trick"           │
│    Shortcut   │              │ (బుర్ర ట్రిక్) mental-math shortcut and proof explanation.         │
├───────────────┼──────────────┼───────────────────────────────────────────────────────────────────┤
│ 5. Outro &    │ 50s – 58s    │ Pinned-comment teaser and follow CTA: "సరైన ఆన్సర్ పిన్           │
│    CTA        │              │ కామెంట్‌లో ఉంది! రేపటి ఛాలెంజ్ కోసం ఫాలో అవ్వండి."                 │
└───────────────┴──────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 3. Comprehensive Field-Level Specification Matrix

The following matrix documents every field in the `QUESTION_CHALLENGE_SHORT` content package, referencing its canonical contract, classification, validation rules, persistence lifecycle, and rendering destination.

### 3.1 Field Classification Legend
- **Author Input (AI)**: Entered or selected by the human author during Stage 01 authoring.
- **System Generated (SG)**: Automatically created by server-side infrastructure or canonical services (e.g. UUID generator, timestamp).
- **Derived Value (DV)**: Calculated or inferred by domain services or pure evaluation functions.
- **Downstream Output (DO)**: Produced in subsequent workflow stages (Scripting, Media Production, Social Publishing).

---

### 3.2 The Field Specification Matrix

| Canonical Field Name | Type & Contract Location | Class | Required / Optional | Validation Constraints & Allowed Values | Persistence Location & Lifecycle | Public Output / Render Destination |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **`id` (Draft)** | `string`<br>`shared/types/question.ts` | SG | **Required** | Canonical UUID: `^dft_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | `question_drafts/{draftId}`.<br>Transient to Stage 01. | **Internal Only**.<br>Never exposed to audience. |
| **`id` (Question)** | `string`<br>`shared/types/question.ts` | SG | **Required** (Stage 02+) | Canonical UUID: `^qst_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | `questions/{questionId}`.<br>Immutable once published. | **Internal Only**.<br>Used in internal database correlation. |
| **`contentMasterId`** | `string`<br>`shared/types/production-context.ts` | SG | **Conditional** | Canonical UUID: `^cnt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | Firestore root aggregate entity correlation. | **Internal Only**.<br>Never exposed to audience. |
| **`productionMode`** | `ContentProductionMode`<br>`shared/types/production-context.ts` | AI / SG | **Required** | Strictly `'QUESTION_CHALLENGE_SHORT'`. | `question_drafts`, `questions`, `production_contexts`. | **Internal Only**.<br>Controls workbench UI & pipeline routing. |
| **`topicId`** | `string`<br>`shared/types/production-context.ts` | AI | **Required** | Must exist in Firestore `topics` collection (`top_<uuid_v4>` or legacy `TOP-*`). Root syllabus entity. | `question_drafts.topicId`, `questions.topicId`. | **Public Platform Metadata**.<br>Used in video category / tags. |
| **`topicName`** | `string`<br>`shared/types/question.ts` | DV | **Required** | Non-empty string. Derived from authoritative taxonomy service. | Persisted snapshot in draft and question records. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`subtopicId`** | `string`<br>`shared/types/production-context.ts` | AI | **Required** | Must exist in `subtopics` and satisfy parent link: `subtopic.topicId === topic.id`. | `question_drafts.subtopicId`, `questions.subtopicId`. | **Public Platform Metadata**.<br>Used in playlist / hashtag mapping. |
| **`subtopicName`** | `string`<br>`shared/types/question.ts` | DV | **Required** | Non-empty string. Derived from authoritative taxonomy service. | Persisted snapshot in draft and question records. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`language`** | `QuestionLanguage`<br>`shared/constants/enums.ts` | AI | **Required** | `TELUGU` (primary/default), `ENGLISH`, `TELUGU_ENGLISH`. | Persisted across all stage records. | **Audience Facing**.<br>Determines spoken language & subtitles. |
| **`difficulty`** | `DifficultyLevel`<br>`shared/constants/enums.ts` | AI | **Required** | `EASY`, `MEDIUM`, `HARD`. Default: `MEDIUM`. | `question_drafts.difficulty`, `questions.difficulty`. | **Public Platform Metadata**.<br>Rendered as on-screen badge (optional). |
| **`questionCount`** | `number`<br>`shared/types/production-context.ts` | AI / SG | **Required** | `1` (single short default); `[5, 10, 15, 20]` (batch creation series). | Persisted in mode config. | **Internal Only**.<br>Determines batch dispatching scope. |
| **`aspectRatio`** | `'9:16' \| '16:9'`<br>`shared/types/production-context.ts` | SG | **Required** | Strictly `'9:16'` (Vertical Portrait). | Persisted in mode config and media records. | **Render Engine Constraint**.<br>Governs canvas dimensions ($1080 \times 1920$). |
| **`questionText`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Length $\ge 5$ characters (typically $40-180$ chars). Non-empty, clear mathematical/conceptual statement. | `question_drafts.questionText`, `questions.questionText`. | **Public Rendered Video**.<br>Rendered on-screen during Segments 2 & 3. |
| **`options`** | `Record<'a'\|'b'\|'c'\|'d', string>`<br>`shared/types/question.ts` | AI | **Required** | Strictly 4 non-empty, distinct choices. All 4 (`a`, `b`, `c`, `d`) must be present. Duplicate options prohibited. | `question_drafts.options`, `questions.options`. | **Public Rendered Video**.<br>Displayed on-screen as choice cards. |
| **`optionA`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Non-empty string. Flat projection of `options.a`. | Persisted alongside nested options object. | **Public Rendered Video** (Option ఎ / A). |
| **`optionB`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Non-empty string. Flat projection of `options.b`. | Persisted alongside nested options object. | **Public Rendered Video** (Option బి / B). |
| **`optionC`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Non-empty string. Flat projection of `options.c`. | Persisted alongside nested options object. | **Public Rendered Video** (Option సి / C). |
| **`optionD`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Non-empty string. Flat projection of `options.d`. | Persisted alongside nested options object. | **Public Rendered Video** (Option డి / D). |
| **`correctAnswer`** | `'A' \| 'B' \| 'C' \| 'D'`<br>`shared/types/question.ts` | AI | **Required** | Strictly one of `'A'`, `'B'`, `'C'`, or `'D'`. Must match exactly one declared option key. | Separately stored key in `question_drafts` and `questions`. | **Audience Facing (Segment 4 Only)**.<br>Highlighted green on-screen at $t \ge 25\text{s}$. |
| **`explanation`** | `string`<br>`shared/types/question.ts` | AI | **Required** | Length $\ge 5$ characters. Full step-by-step mathematical proof and pedagogical derivation. | `question_drafts.explanation`, `questions.explanation`. | **Script & Teleprompter**.<br>Spoken explanation in Segment 4 ($25-42\text{s}$). |
| **`trickOrPitfall` / `burraSpeedTrick`** | `string`<br>`shared/types/question.ts` | AI | **Optional / Recommended** | Mental math shortcut, mnemonic, or rapid speed trick ("బుర్ర ట్రిక్"). | `question_drafts.trickOrPitfall`, `script.speedTrickOrTakeaway`. | **Public Rendered Video & Script**.<br>On-screen graphics card in Segment 4. |
| **`realWorldContext` / `realLifeContext`** | `string`<br>`shared/types/question.ts` | AI | **Optional** | Real-world scenario framing the problem (e.g., trains, shopping, banking). Max 120 chars. | `question_drafts.realWorldContext`. | **Scripting Input**.<br>Used in Segment 1 hook generation. |
| **`challengeType`** | `string`<br>`shared/types/question.ts` | SG | **Required** | Strictly `'ABCD'` for Mode 1 per ADR-009. Non-MCQ challenge formats prohibited. | `question_drafts.challengeType`. | **Internal Only**.<br>Enforces 4-option validation schema. |
| **`presentationType`** | `string`<br>`shared/types/question.ts` | AI / SG | **Optional** | E.g. `'SPEED_MATH_TRICK'`, `'STANDARD_MCQ'`, `'VISUAL_PUZZLE'`. Default: `'SPEED_MATH_TRICK'`. | `question_drafts.presentationType`. | **Rendering Bay Style**.<br>Directs visual template theme. |
| **`questionStyle`** | `QuestionStyle`<br>`shared/constants/enums.ts` | AI / SG | **Optional** | Canonical enum from `shared/constants/enums.ts`. | `question_drafts.questionStyle`. | **AI Prompting & Scripting Guidance**. |
| **`countdownTimerMs`** | `number`<br>`shared/types/content.ts` | SG / DV | **Required** | `3000` or `5000` ms. Default: `5000` ms ($5\text{ seconds}$). | Teleprompter script and render composition payload. | **Public Rendered Video**.<br>On-screen graphic countdown timer. |
| **`commentPromptText`** | `string`<br>`shared/types/content.ts` | DV | **Required** | Telugu engagement callout (e.g., *"వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి!"*). | Teleprompter script segment 3. | **Public Rendered Video & Teleprompter**.<br>On-screen text and presenter voiceover. |
| **`hookText`** | `string`<br>`shared/types/content.ts` | DO | **Required** (Stage 03+) | Provocative question challenge hook in Telugu ($\le 3\text{ seconds}$). | `scripts/{scriptId}.hookText`. | **Public Rendered Video & Script**.<br>Opening segment voiceover & headline. |
| **`shortTitle`** | `string`<br>`shared/types/content.ts` | DO | **Required** (Stage 10+) | Max 100 chars. Engaging, searchable YouTube Shorts / Reels title. | `social_metadata.shortTitle`. | **Public Platform Metadata**.<br>Video title on YouTube/Reels. |
| **`socialCaption`** | `string`<br>`shared/types/content.ts` | DO | **Required** (Stage 10+) | Max 500 chars. Platform-specific caption including problem context. | `social_metadata.socialCaption`. | **Public Platform Metadata**.<br>Post caption on Instagram/Facebook. |
| **`hashtags`** | `string[]`<br>`shared/types/content.ts` | DO | **Required** (Stage 10+) | Array of relevant tags (e.g., `['#BurraPariksha', '#TeluguShorts', '#SpeedMath']`). | `social_metadata.hashtags`. | **Public Platform Metadata**.<br>Platform tags and hashtags. |
| **`pinnedCommentPrompt`** | `string`<br>`shared/types/content.ts` | DO | **Required** (Stage 10+) | Audience callout directing to pinned comment for full derivation and bonus challenge. | `social_metadata.cta.pinnedCommentPrompt`. | **Public Platform Metadata**.<br>Pinned comment on YouTube/Instagram. |
| **`answerLeakageDetected`** | `boolean`<br>`shared/types/content.ts` | DV | **Required** (Stage 03+) | Strictly `false`. Evaluates whether correct answer key leaked into hook, title, or early segments. | Social invariance and script validation reports. | **Internal Gate**.<br>Blocks publishing if `true`. |
| **`version`** | `number`<br>`shared/types/question.ts` | SG | **Required** | Positive integer ($1, 2, 3, \dots$). Incremented on every atomic Firestore update. | `question_drafts.version`, `questions.version`. | **Internal OCC Gate**.<br>Prevents lost updates via HTTP 409. |
| **`status`** | `QuestionStatus`<br>`shared/constants/enums.ts` | SG | **Required** | `DRAFT` $\to$ `SUBMITTED_FOR_REVIEW` $\to$ `APPROVED` $\to$ `REJECTED` $\to$ `ARCHIVED`. | `question_drafts.status`, `questions.status`. | **Internal Workflow State**.<br>Never exposed to audience. |
| **`workflowStage`** | `string` / `number`<br>`shared/types/production-context.ts` | SG | **Required** | Canonical workflow step ($1 \dots 15$). Stage 01 for Drafts; Stage 02 for Verification. | `question_drafts.workflowStage`, `workflow_instances`. | **Internal Workflow Engine**.<br>Governs role actions and permissions. |
| **`authorId`** | `string`<br>`shared/types/question.ts` | SG | **Required** | Authenticated user ID (`usr_<uuid_v4>`) of the draft creator. | Persisted in draft and question records. | **Internal Audit & GAR-02 Gate**.<br>Strictly prevents author from approving. |
| **`authorName`** | `string`<br>`shared/types/question.ts` | SG | **Optional** | Display name of the author for internal team audit. | Persisted snapshot in draft record. | **Internal Team Display**.<br>Never exposed to audience. |
| **`mathematicalVerification`**| `MathVerificationSummary`<br>`shared/contracts/question-generation/` | SG / DV | **Optional** | Advisory AI verification summary (`PROVABLY_VALID`, `CONTRADICTORY`, etc.). | `question_drafts.mathematicalVerification`. | **Internal Verification Workbench**.<br>Advisory only (AP-009). |
| **`createdAt`, `updatedAt`**| `string`<br>`shared/types/question.ts` | SG | **Required** | ISO 8601 UTC timestamp strings. | Persisted on all Firestore documents. | **Internal Audit & Sorting**.<br>Never exposed to audience. |

---

## 4. Publication Boundary & Data Segregation Architecture

### 4.1 Strict Segregation of Operational vs. Public Package
The BP-CMS architecture enforces a strict one-way publication boundary between internal operational metadata and audience-facing media:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BP-CMS PUBLICATION BOUNDARY                                    │
├──────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ STRICTLY INTERNAL (PERSISTED IN FIRESTORE)   │ AUDIENCE-FACING (PUBLICLY EXPOSED)                │
├──────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ • Entity UUIDs (dft_..., qst_..., usr_...)   │ • Rendered MP4 Video (1080x1920, 9:16)            │
│ • Author Identity & User IDs                 │ • Question Statement Text (on-screen graphics)    │
│ • Workflow State & State Machine Step (1-15) │ • Four Option Choice Boxes (ఎ, బి, సి, డి)        │
│ • Review Comments, Notes & Rejections        │ • Correct Option Highlight (Green at t ≥ 25s)     │
│ • Optimistic Concurrency Control (version)   │ • "Burra Trick" Visual Text Card (t ≥ 25s)        │
│ • AI Prompts, Model IDs, Tokens & Latency    │ • Spoken Audio Voiceover & Sound Effects          │
│ • Advisory Mathematical Verification Details │ • Public Social Title (shortTitle, ≤ 100 chars)   │
│ • Raw Correct Answer Key ('A'..'D') in JSON  │ • Public Social Caption & Hashtags                │
│ • Unprocessed Invariance Reports             │ • Pinned Comment Copy & Engagement Callout        │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### 4.2 Answer Sequestration & Anti-Leakage Invariant
1. **Internal Key vs. Visual Reveal**:
   - In Cloud Firestore (`question_drafts` and `questions`), the correct answer is stored as an invariant single character key: `correctAnswer: 'A' | 'B' | 'C' | 'D'`.
   - In the audience-facing package, the answer is **never exposed as raw JSON metadata**.
   - In the rendered video, the correct answer is visually presented by transitioning the target option card border and fill to green (`#22C55E`) while playing an audio chime at timestamp $t \ge 25\text{ seconds}$.
2. **Strict Answer Leakage Prevention**:
   - The correct answer key and explanation must **never appear** in:
     - The video title (`shortTitle`).
     - The first 2 lines of the video caption (`socialCaption`).
     - The video thumbnail text or graphics.
     - Segments 1, 2, or 3 of the video or teleprompter script ($0\text{s} - 25\text{s}$).
   - Domain validation (`answerLeakageDetected: boolean`) strictly audits generated scripts and metadata. Any detection of answer leakage immediately fails the social invariance gate and blocks publishing.

### 4.3 Representation of Answer & Explanation: Firestore vs. Video
| Dimension | Cloud Firestore Representation | Rendered Video Representation |
| :--- | :--- | :--- |
| **Correct Answer** | Key: `'A'`, `'B'`, `'C'`, or `'D'` (1 char) | Visual state transition: Option card ఎ/బి/సి/డి turns green with checkmark icon at $t \ge 25\text{s}$. |
| **Burra Trick / Shortcut** | Plain text string in `trickOrPitfall` | Animated on-screen lower-third card displaying "బుర్ర ట్రిక్" with the speed calculation formula. |
| **Proof Explanation** | Markdown / LaTeX string in `explanation` | Spoken verbal teleprompter explanation synchronized with animated whiteboard solving steps. |
| **Timing** | Static document field | Time-gated: strictly revealed during Segment 4 ($25\text{s} - 50\text{s}$). |

---

## 5. Resolution of Contract-Grounded Requirements

### 5.1 Four-Option MCQ Invariant
- **Approved Authority**: ADR-009, `request-schemas.ts`, and `FC-005`.
- **Rule**: Mode 1 strictly requires **exactly four multiple-choice options** (`a`, `b`, `c`, `d`) and a single correct-answer key (`A`, `B`, `C`, `D`).
- **Enforcement**:
  - Non-MCQ challenge formats (e.g. true/false, open text, fill-in-the-blank) are **prohibited**.
  - All four options must be non-empty strings.
  - Pairwise duplicate option text (case-insensitive) is strictly rejected by `evaluateStep01CandidateState`.

### 5.2 Explanation Requirement Scope
- **Contract Inspection**: In `shared/contracts/question-generation/question-generation.contract.ts`, candidate evaluation requires `explanation` ($\ge 5\text{ chars}$) for canonical question drafts.
- **Mode 1 Scope**: In `shared/registry/content-mode.registry.ts`, Mode 1 explicitly sets `inputs.requiresProofExplanation: true`.
- **Resolution**: The `explanation` field is **mandatory** for Mode 1. A Question Challenge Short cannot proceed to Stage 02 without a verified mathematical explanation.

### 5.3 Language Policy & Defaults
- **Approved Authority**: `shared/constants/enums.ts` (`QuestionLanguage`).
- **Rule**: `TELUGU` is the canonical default for Burra Pariksha CMS. However, `ENGLISH` and `TELUGU_ENGLISH` (bilingual transliteration) are valid existing enums and permitted in the contract.
- **Guidance**: Mode 1 authoring defaults to `TELUGU`. The contract does not restrict questions to Telugu-only, ensuring bilingual competitive exam questions remain valid.

### 5.4 Difficulty Policy
- **Approved Authority**: `shared/constants/enums.ts` (`DifficultyLevel`).
- **Rule**: Reuses the three canonical enum values: `EASY`, `MEDIUM`, and `HARD`.
- **Default for Mode 1**: `MEDIUM` (optimal difficulty for viral engagement and mental math tricks).

---

## 6. Unresolved Policy Decisions Register

The following open decisions represent business, editorial, or platform policy decisions where existing code and approved ADRs do not provide unambiguous authority. They are formally documented below with their current evidence, operational impact, and required approval authority.

| Decision ID | Policy Topic | Current Code & Contract Evidence | Operational Impact | Recommended Policy | Approval Authority Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UPD-01** | **Burra Trick Field: Mandatory vs. Optional in Stage 01** | `inputs.requiresProofExplanation: true` is enforced for `explanation`. However, `trickOrPitfall` in `ExplainedQuestionItem` and `burraSpeedTrick` in `S8-T03` are marked "Optional (recommended)". | If made strictly mandatory, authors cannot save valid standard competitive exam questions that do not have a separate "speed trick". | **Keep `explanation` strictly mandatory; keep `trickOrPitfall` optional but strongly recommended in the Studio UI.** Verified during Stage 03 Scripting. | Content Lead / Curriculum Architect |
| **UPD-02** | **Bilingual On-Screen Subtitle Rendering Policy** | `QuestionLanguage` supports `TELUGU_ENGLISH`. Mathematical terms (e.g., "Profit & Loss", "Ratio", "Hypotenuse") are commonly spoken in English by Telugu students. | Video render engine subtitle generator requires a deterministic typography rule for Latin vs. Telugu font glyphs in 9:16 vertical canvas. | **Render mathematical expressions and option keys in Latin script ($A, B, C, D; x, y, \%$); render narrative text in Telugu Unicode script (Gautami/Suranna font).** | Video Production Lead / Creative Director |
| **UPD-03** | **Pinned Comment Content & Engagement Strategy** | S8-T03 narrative notes state: *"సరైన ఆన్సర్ పిన్ కామెంట్‌లో ఉంది!"*. However, Segment 4 of the video also reveals the answer at $t \ge 25\text{s}$. | Audience engagement in the comments section directly influences YouTube Shorts algorithm distribution. | **Pinned comment provides the correct answer + formula summary + a bonus "Home Challenge" question inviting viewers to comment their answers.** | Social Media / Publishing Lead |
| **UPD-04** | **Platform-Specific Caption Truncation Thresholds** | `SocialMetadataPayload` defines `socialCaption` with max 500 characters. YouTube Shorts truncates descriptions after ~100 characters on mobile overlay; Instagram Reels truncates after ~125 characters. | Overly long opening captions cover the lower 20% of the 9:16 video overlay on mobile devices. | **Enforce a strict 2-line "Hook Caption" threshold ($\le 90\text{ characters}$) before the "more" ellipsis break.** | Publishing Lead |
| **UPD-05** | **Batch Creation Series Runner Architecture (OD-02)** | ADR-010 approved batch series selection ($5, 10, 15, 20$) as conceptual Option A, but classified the batch execution runner as Open Decision OD-02. | S9-T01 confirmed that runtime code only authors single-question drafts ($N=1$). Selecting $>1$ in UI does not spawn multiple workflow instances. | **Maintain Single-Short ($N=1$) as the sole operational execution scope for Sprint 9. Assign batch runner implementation to a dedicated future batch infrastructure task.** | Project Owner / Architecture Review Board |

---

## 7. Contract & Schema Gaps Analysis

During the audit of existing shared contracts, minor naming differences between legacy and canonical types were identified. They are reconciled as follows:

1. **`realLifeContext` vs. `realWorldContext`**:
   - `shared/types/question.ts` and `shared/contracts/question-generation/` maintain both properties as mutual aliases.
   - **Canonical Standard**: Use `realWorldContext` in new contracts and documentation; retain `realLifeContext` as an optional backward-compatibility shim.
2. **Nested `options: { a, b, c, d }` vs. Flat `optionA..D`**:
   - Firestore repository stores `options: { a, b, c, d }`.
   - UI candidate forms and API envelopes accept both flat (`optionA`) and nested (`options.a`).
   - **Canonical Standard**: Persistence layer normalizes flat inputs into the nested `options` object upon writing to Firestore.

---

## 8. Readiness Verdict & Next Action

- **Specification Approval Status**: **`ACCEPTED AS AUTHORITATIVE SPECIFICATION`**
- **Evidence-Based Verdict**:
  - All Mode 1 fields, constraints, choreography segments, and publication boundaries are grounded in verified contracts and approved ADRs (ADR-008 through ADR-011).
  - Internal operational data and audience-facing media packages are strictly segregated.
  - Zero application code, database schemas, or production records were mutated.
  - Unresolved policy decisions (UPD-01 through UPD-05) are documented with impact and recommended policies.
- **Single Next Action**: Deliverable established for Task `S9-T02`. **Do NOT start Task `S9-T03`**.
