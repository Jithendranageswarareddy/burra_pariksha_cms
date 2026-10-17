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
   - `questionGenerationService.saveDraft` in `backend/domain/question-generation/question-generation.service.ts`.
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

### 3.1 Field Classification & Authority Legend
- **Author Input (AI)**: Entered or selected by the author in Stage 01 Question Studio.
- **System Generated (SG)**: Automatically populated by backend services or canonical generators.
- **Derived Value (DV)**: Evaluated dynamically by pure validation or workflow functions.
- **Downstream Output (DO)**: Authored or generated in subsequent stages (Stage 03 Scripting, Stage 04–09 Video/Media, Stage 10–12 Publishing).
- **Proposed / Non-Canonical (PNC)**: Field recommended in editorial design documents (e.g. S8-T03) that does **not yet exist** in canonical shared TypeScript interfaces.

---

### 3.2 The Field Matrix

| Canonical Field Name | Contract Location | Class | Requirement Status | Actual Validation Constraints (Runtime vs Proposed) | Persistence Location & Lifecycle | Public Output / Render Destination |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **`id` (Draft)** | `shared/types/question.ts` | SG | **Required** | Canonical UUID format: `dft_<uuid_v4>` (validated by `canonicalIdService`). | `question_drafts/{draftId}`.<br>Stage 01 lifecycle. | **Internal Only**.<br>Never exposed to audience. |
| **`id` (Question)** | `shared/types/question.ts` | SG | **Required** (Stage 02+) | Canonical UUID format: `qst_<uuid_v4>`. Generated upon approval. | `questions/{questionId}`.<br>Stage 02+ persistent entity. | **Internal Only**.<br>Used in internal database correlation. |
| **`productionMode`** | `shared/types/production-context.ts` | AI / SG | **Required** | Must be `'QUESTION_CHALLENGE_SHORT'`. Validated by `validateProductionModeConfig`. | Persisted on draft, question, and context. | **Internal Only**.<br>Directs workbench routing. |
| **`topicId`** | `shared/types/production-context.ts` | AI | **Required** | Must be a non-empty string matching an existing root topic in `topics` collection (`top_<uuid>` or legacy `TOP-*`). | `question_drafts.topicId`, `questions.topicId`. | **Public Platform Metadata**.<br>Used in playlist / tag mapping. |
| **`topicName`** | `shared/types/question.ts` | DV | **Required** | Non-empty string. Derived from authoritative taxonomy service. | Persisted snapshot in draft and question records. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`subtopicId`** | `shared/types/production-context.ts` | AI | **Required** | Must be a non-empty string matching a subtopic in `subtopics` and satisfying `subtopic.topicId === topic.id`. | `question_drafts.subtopicId`, `questions.subtopicId`. | **Public Platform Metadata**.<br>Used in playlist / hashtag mapping. |
| **`subtopicName`** | `shared/types/question.ts` | DV | **Required** | Non-empty string. Derived from authoritative taxonomy service. | Persisted snapshot in draft and question records. | **Public Platform Metadata**.<br>Appears in video description & tags. |
| **`language`** | `shared/constants/enums.ts` (`QuestionLanguage`) | AI | **Required** | Canonical enum: `TELUGU` (default), `ENGLISH`, `HINGLISH`, `TELUGU_ENGLISH`. All 4 values valid. | `question_drafts.language`, `questions.language`. | **Audience Facing**.<br>Determines audio voiceover & subtitle script. |
| **`difficulty`** | `shared/constants/enums.ts` (`DifficultyLevel`) | AI | **Required** | Canonical enum: `EASY`, `MEDIUM`, `HARD`. (Default in UI: `MEDIUM`). | `question_drafts.difficulty`, `questions.difficulty`. | **Public Platform Metadata**.<br>Rendered as optional on-screen badge. |
| **`questionCount`** | `shared/types/production-context.ts` | AI / SG | **Required** | `1` (single short default); `[5, 10, 15, 20]` (batch creation series). | Persisted in mode config. | **Internal Only**.<br>Determines batch dispatching scope. |
| **`aspectRatio`** | `shared/types/production-context.ts` | SG | **Required** | Strictly `'9:16'` (Vertical Portrait). Enforced by `validateProductionModeConfig`. | Persisted in mode config and video records. | **Render Engine Constraint**.<br>Canvas dimension: $1080 \times 1920\text{ px}$. |
| **`questionText`** | `shared/types/question.ts` | AI | **Required** | Length $\ge 5$ characters (enforced by `evaluateStep01CandidateState`). Non-empty string.<br>*Note*: Character upper bounds (e.g. 180 chars) are proposed editorial guidelines, not runtime validator limits. | `question_drafts.questionText`, `questions.questionText`. | **Public Rendered Video**.<br>Rendered on-screen during Problem segment. |
| **`options`** | `shared/types/question.ts` | AI | **Required (Canonical)** | Strictly 4 non-empty, distinct choices: `{ a: string, b: string, c: string, d: string }`. Pairwise duplicate text is rejected by `evaluateStep01CandidateState`. | `question_drafts.options`, `questions.options`. | **Public Rendered Video**.<br>Displayed on-screen as choice cards (ఎ, బి, సి, డి). |
| **`optionA` – `optionD`** | `shared/types/question.ts` | AI / DV | **Optional Compatibility Projections** | Optional flat string properties. Populated automatically by `saveDraft` from `options` for backward compatibility. **Not independently required alongside `options`.** | Stored on draft/question alongside `options`. | **Form / Shim Projections**.<br>Used by legacy form bindings. |
| **`correctAnswer`** | `shared/types/question.ts` | AI | **Required** | Strictly one of `'A'`, `'B'`, `'C'`, or `'D'`. Validated by `evaluateStep01CandidateState`. | Separately stored key in `question_drafts` and `questions`. | **Audience Facing (Reveal Only)**.<br>Highlighted on-screen at $t \ge 25\text{s}$. |
| **`explanation`** | `shared/types/question.ts` | AI | **Required** | Length $\ge 5$ characters (enforced by `saveDraft` and `content-mode.registry.ts`). Contains mathematical proof. | `question_drafts.explanation`, `questions.explanation`. | **Script & Teleprompter**.<br>Spoken explanation in Reveal segment. |
| **`realWorldContext`** | `shared/types/question.ts` | AI | **Optional** | Optional string in `QuestionDraft`. (`realLifeContext` is a supported alias).<br>*Note*: No length limit (e.g. 120 chars) exists in active validators. | `question_drafts.realWorldContext`. | **Scripting Input**.<br>Used in Segment 1 hook generation. |
| **`challengeType`** | `shared/types/question.ts` | SG | **Required** | Strictly `'ABCD'` for Mode 1 per ADR-009. Non-MCQ challenge formats prohibited. | `question_drafts.challengeType`. | **Internal Only**.<br>Enforces 4-option validation schema. |
| **`presentationType`** | `shared/types/question.ts` | AI / SG | **Optional** | E.g. `'SPEED_MATH_TRICK'`, `'STANDARD_MCQ'`, `'TEXT_ONLY'`. Normalized to `'TEXT_ONLY'` if unset in `saveDraft`. | `question_drafts.presentationType`. | **Rendering Bay Style**.<br>Directs visual template selection. |
| **`questionStyle`** | `shared/constants/enums.ts` (`QuestionStyle`) | AI / SG | **Optional** | Optional canonical enum value from `shared/constants/enums.ts`. Defaults to `'STORY_BASED'` if unspecified in `saveDraft`. | `question_drafts.questionStyle`. | **AI Prompting Guidance**. |
| **`version`** | `shared/types/question.ts` | SG | **Required** | Positive integer ($1, 2, 3, \dots$). Incremented on every update in Firestore repository. Stale version rejects with HTTP 409. | `question_drafts.version`, `questions.version`. | **Internal OCC Gate**.<br>Guards against concurrent overwrites. |
| **`status`** | `shared/constants/enums.ts` (`QuestionStatus`) | SG | **Required** | `DRAFT` $\to$ `SUBMITTED_FOR_REVIEW` $\to$ `APPROVED` $\to$ `REJECTED` $\to$ `ARCHIVED`. | `question_drafts.status`, `questions.status`. | **Internal Workflow State**.<br>Never exposed to audience. |
| **`workflowStage`** | `shared/types/production-context.ts` | SG | **Required** | Canonical workflow step integer ($1 \dots 15$). Step 1 for Draft; Step 2 for Verification. | `question_drafts.workflowStage`, `workflow_instances`. | **Internal Workflow Engine**.<br>Governs role permissions. |
| **`authorId`** | `shared/types/question.ts` | SG | **Required** | Authenticated user ID (`usr_<uuid_v4>`) of the draft creator. | Persisted in draft and question records. | **Internal Audit & GAR-02 Gate**.<br>Prevents author from self-approving. |
| **`authorName`** | `shared/types/question.ts` | SG | **Optional** | Display name of the author for internal team audit. | Persisted snapshot in draft record. | **Internal Team Display**.<br>Never exposed to audience. |
| **`mathematicalVerification`** | `shared/contracts/question-generation/` | SG / DV | **Optional** | Advisory AI verification summary (`PROVABLY_VALID`, `CONTRADICTORY`, etc.). | `question_drafts.mathematicalVerification`. | **Internal Verification Workbench**.<br>Advisory only under AP-009. |
| **`createdAt`, `updatedAt`** | `shared/types/question.ts` | SG | **Required** | ISO 8601 UTC timestamp strings. | Persisted on all Firestore documents. | **Internal Audit & Sorting**.<br>Never exposed to audience. |

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
- **Guidance**: Mode 1 authoring defaults to `TELUGU`. The contract supports all four enum values, permitting English, Hinglish, and bilingual questions without schema violations.

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
