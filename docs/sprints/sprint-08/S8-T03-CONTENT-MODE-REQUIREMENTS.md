# S8-T03 — Content Mode Requirements & Specification Contract
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 08 — Task S8-T03: Requirements, Input/Output Contracts, Field Validation Matrix, and Architectural Decision Register for Three Production Modes

```text
================================================================================
Document ID:       BP-S8-T03-CONTENT-MODES
Version:           1.6.0-ACCEPTED-BASELINE
Date:              2026-10-14
Status:            ACCEPTED REQUIREMENTS BASELINE (Project Owner Approved)
Classification:    Content Engineering, Production Architecture & AI Contracts
Inspected Commit:  cb9acb8 (main)
Scope:             Three Production Modes (Question Challenge Short, Topic
                   Introduction, Explained Questions Video), Input/Output
                   Contracts, Shared/Specific Matrix, Validation, and Resolved Decisions
Upstream:          07-CANONICAL-15-STEP-WORKFLOW.md, 11-PAGE-ROUTE-CONTRACT.md,
                   12-DATABASE-ARCHITECTURE.md, 14-MEDIA-ARCHITECTURE.md,
                   15-API-CONTRACT.md, 24-TEST-ARCHITECTURE.md,
                   25-TWO-TIER-TAXONOMY-ARCHITECTURE.md,
                   S8-T01-QUESTION-GENERATION-AUDIT.md,
                   S8-T02-PRODUCTION-PAGE-WORKFLOW-INVENTORY.md
Downstream:        S8-T04 (Quality Gate Decoupling), Stage 01 Mode Selector UI,
                   AI Orchestrator Multi-Mode Prompt Engines, Media Pipeline Expansion
Approval State:    APPROVED BASELINE (Decisions Resolved via ADR-009 & ADR-010)
================================================================================
```

---

## 1. Executive Summary & Governance Boundaries

### 1.1 Purpose
The Burra Pariksha Content Management System (BP-CMS) was baseline-engineered around a single core production unit: a **single-question, short-form 9:16 vertical video ($\le 60\text{ seconds}$)** formatted for competitive examination micro-learning on YouTube Shorts and Instagram Reels.

To support curriculum onboarding, conceptual foundations, and comprehensive masterclasses, this specification defines the formal requirements, input/output contracts, and validation rules for **Three Production Modes**:

1. **Mode 1: Question Challenge Short** (`QUESTION_CHALLENGE_SHORT`) — High-energy short-form video posing a single challenge and inviting audience participation via comments before revealing the solution.
2. **Mode 2: Topic Introduction** (`TOPIC_INTRODUCTION`) — Foundational curriculum overview introducing a Topic and Subtopic, syllabus relevance, real-world context, and key concepts without requiring a question-count input.
3. **Mode 3: Explained Questions Video** (`EXPLAINED_QUESTIONS_VIDEO`) — Structured long-form masterclass featuring an introductory concept orientation followed by sequential, in-depth question explanations, proofs, and speed shortcuts with configurable question counts ($5, 10, 15, 20$).

### 1.2 Non-Negotiable System Invariants
All mode specifications strictly operate within the verified invariants defined in [AGENTS.md](../../../AGENTS.md):
1. **Cloud Firestore Sole Transactional Datastore**: All entities, drafts, metadata, and workflow states persist exclusively in Firestore ([12-DATABASE-ARCHITECTURE.md](../../architecture/12-DATABASE-ARCHITECTURE.md)). Google Sheets is never runtime state.
2. **Canonical Two-Tier Taxonomy**: Autonomous `Topic` (`top_<uuid>`) $\to$ Child `Subtopic` (`sub_<uuid>`) ([25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)). Legacy `Category` remains permanently obsolete.
3. **Collision-Resistant UUID Canonical IDs**: All entities utilize distributed UUID v4 format (`shared/lib/id.service.ts`).
4. **Canonical 15-Step Workflow & GAR-02 Rule**: Every production journey preserves all 15 sequential stages without omitting or reordering steps. Anti-self-approval (`authorId !== approverId`) remains strictly enforced at every review gate ([07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md), [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md)).
5. **Save Draft $\neq$ Submit for Verification**: Draft saving remains an isolated persistence action with minimal structural checks that never triggers verification or state transitions.

### 1.3 Approval Boundary: Established Reality vs. Proposed Extensions
This document strictly distinguishes **Established Contracts** (already codified in the repository) from **Proposed Mode Extensions** (pending explicit Architecture Decision Record sign-off):
- **Established Repository Reality**: Single-question short-form video, 9:16 vertical format ($1080 \times 1920\text{ px}$), strict 4-option MCQ schema (`options: {a, b, c, d}`), scalar `questionId` references in `Video`, and the 15-stage sequential state machine.
- **Proposed Extensions (Pending Decisions OD-01 through OD-07)**: Mode 1 batch generation series, Mode 2 zero-question verification adaptation, Mode 3 intro inclusion rules, 16:9 landscape aspect ratio support, multi-question video aggregate models, non-MCQ challenge options, and extended masterclass duration scaling.

---

## 2. Production Mode Definitions

### 2.1 Mode 1: Question Challenge Short
- **Mode Identifier**: `QUESTION_CHALLENGE_SHORT`
- **Primary Objective**: Algorithmic distribution, viewer retention, and comment-section engagement across YouTube Shorts, Instagram Reels, and Facebook Reels.
- **Pedagogical Function**: Poses an engaging problem, introduces distractors, creates an intentional pause inviting viewer comments, reveals the answer, and demonstrates a mental speed shortcut ("Burra Trick").
- **Narrative Structure**:
  1. *Hook (0–3s)*: Provocative challenge hook in Telugu (e.g., "ఈ ప్రశ్నను 10 సెకన్లలో సాల్వ్ చేయగలరా?").
  2. *Problem Statement (3–18s)*: Rapid presentation of question statement and 4 options labeled with Telugu characters (ఎ, బి, సి, డి).
  3. *Comment Challenge & Pause (18–25s)*: Visual 3-second or 5-second on-screen countdown timer with a direct engagement invitation: "వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి!"
  4. *Reveal & Shortcut (25–50s)*: Correct option highlight and immediate "Burra Trick" (బుర్ర ట్రిక్) mental-math explanation.
  5. *CTA & Outro (50–58s)*: Pinned-comment teaser and follow prompt: "సరైన ఆన్సర్ పిన్ కామెంట్‌లో ఉంది! రేపటి ఛాలెంజ్ కోసం ఫాలో అవ్వండి."
- **Aspect Ratio**:
  - *Established Contract*: Strictly **9:16 Vertical Portrait** ($1080 \times 1920\text{ px}$) per [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) and [15-API-CONTRACT.md](../../architecture/15-API-CONTRACT.md).
- **Target Duration**: Strictly **30–58 seconds** (Platform hard ceiling: $60\text{ seconds}$).
- **Question Count Semantics**:
  - *Established Single-Short Behavior*: A single published Short video contains **exactly 1 question**.
  - *Proposed Batch Generation ($5, 10, 15, 20$)*: Selection of multiple questions in Mode 1 is proposed as a **Series / Batch Generation** producing $N$ standalone 1-question Shorts sharing taxonomy context (*Conditional on approval of Decision OD-02*).
- **Option Constraints**:
  - *Established Schema*: Must strictly contain 4 multiple-choice options (`a`, `b`, `c`, `d`) and a single correct answer (`A`, `B`, `C`, `D`) (*Subject to Decision OD-06 for alternative challenge formats*).

---

### 2.2 Mode 2: Topic Introduction
- **Mode Identifier**: `TOPIC_INTRODUCTION`
- **Primary Objective**: Curriculum orientation, syllabus mapping, conceptual clarity, and learning roadmap establishment for competitive exam aspirants (APPSC, TSPSC, SSC CGL, Banking).
- **Pedagogical Function**: Demystifies an entire Topic / Subtopic by explaining why it exists, where it appears in exams, its typical mark weightage, and its foundational intuition without solving practice questions.
- **Narrative Structure**:
  1. *Curiosity Anchor (0–5s)*: Real-life phenomenon or historical motivation (e.g., "రైలు వేగం, టైమ్ అండ్ డిస్టెన్స్ కాన్సెప్ట్ లేకుండా ఎగ్జామ్ పేపర్ ఎందుకు ఉండదు?").
  2. *Concept Demystification (5–25s)*: Clear, conversational explanation of the core concept in accessible Telugu.
  3. *Syllabus Scope & Weightage (25–45s)*: Marks weightage analysis and subtopic distribution across target exams.
  4. *Core Principle / Master Intuition (45–80s)*: Foundational governing formula or mental model explained without rote memorization.
  5. *Learning Roadmap CTA (80–90s)*: Call to action previewing upcoming Explained Questions and daily Question Challenges.
- **Aspect Ratio**:
  - *Established Contract*: Currently restricted to **9:16 Vertical** ($1080 \times 1920\text{ px}$) in existing media pipelines.
  - *Proposed Extension*: Configurable support for **16:9 Landscape** ($1920 \times 1080\text{ px}$) for classroom-style YouTube overviews (*Conditional on approval of Decision OD-04*).
- **Target Duration**: **60–180 seconds** (1 to 3 minutes).
- **Question Requirement**: **Non-Required ($N = 0$)**. Mode 2 strictly does not require a question-count input, focus questions, multiple-choice options, answer keys, or distractors.
- **Workflow Step 02 Adaptation**:
  - *Proposed*: Step 02 executes a **Concept Accuracy Verification** (SME reviews syllabus scope and conceptual definitions) in lieu of mathematical proof verification (*Conditional on approval of Decision OD-03*).

---

### 2.3 Mode 3: Explained Questions Video
- **Mode Identifier**: `EXPLAINED_QUESTIONS_VIDEO`
- **Primary Objective**: Rigorous pedagogical mastery, systematic problem-solving methodology, and comprehensive syllabus coverage.
- **Pedagogical Function**: Delivers an educational masterclass starting with an introductory concept orientation followed by sequential, in-depth question breakdowns, derivations, trap warnings, and speed shortcuts.
- **Narrative Structure**:
  1. *Introductory Segment (0:00–1:30)*: Topic context, exam strategy, difficulty progression, and masterclass roadmap.
  2. *Sequential Question Blocks ($Q_1 \dots Q_N$, where $N \in \{5, 10, 15, 20\}$)*:
     - On-screen question presentation with bilingual terminology (Telugu/English).
     - 4 options with distractor analysis.
     - Step-by-step mathematical proof / derivation.
     - Common student mistakes / exam traps ("విద్యార్థులు చేసే సాధారణ తప్పు").
     - Burra speed shortcut ("ఎగ్జామ్ హాల్‌లో 10 సెకన్లలో చేసే పద్ధతి").
  3. *Summary & Outro*: Key formula recap, downloadable reference guide prompt, and homework question.
- **Aspect Ratio**:
  - *Proposed*: **16:9 Landscape** ($1920 \times 1080\text{ px}$) for standard desktop/tablet YouTube viewing (*Conditional on approval of Decision OD-04*).
- **Question Count Semantics**:
  - *Required Product Configuration*: Mandatory selection of **5, 10, 15, or 20 questions**.
  - *Introductory Segment Relationship*: Proposed as **Additive ($1 + N$)**, where count $N$ strictly enumerates practice questions *in addition* to the introductory segment (*Conditional on approval of Decision OD-01*).
- **Target Duration**: **12–55 minutes** (proportional to question count: ~2 to 2.5 minutes per explained question + 2 minutes intro/outro; *Conditional on approval of Decision OD-07*).

---

## 3. Explicit Mode Contracts

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRODUCTION MODE CONTRACT SPECIFICATIONS                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Mode Contract: Question Challenge Short

#### Purpose
Generate a single-question, high-tension short-form challenge video script and production package designed to provoke viewer comments and viral engagement on vertical video platforms.

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `difficulty`: `DifficultyLevel` (`EASY`, `MEDIUM`, `HARD`)
- `challengeType`: Multiple-choice challenge style (Currently constrained to 4-option MCQ; *see OD-06*)

#### Optional Inputs
- `questionCount`: Defaults to `1` for single-short generation (Established behavior). Selection of `5, 10, 15, 20` is proposed as a multi-short batch creation series (*Conditional on OD-02 approval*).
- `realWorldContext`: Real-life framing theme (e.g., "Telangana Heritage", "Speed Calculation").
- `customInstructions`: Ad-hoc editorial directives.
- `countdownDurationSeconds`: On-screen pause timer duration (`3` or `5` seconds; default: `5`).
- `hookStyle`: Hook style (`CURIOSITY`, `SPEED_CHALLENGE`, `BRAIN_CHALLENGE`).

#### Generated Outputs
1. `QuestionCandidate`: Validated question text, 4 distinct options (A, B, C, D), correct answer identifier, detailed explanation.
2. `SpokenTeleprompterScriptPayload`: 5-part script (Hook $\to$ Problem $\to$ Pause/Countdown $\to$ Solution $\to$ CTA).
3. `SocialMetadataPayload`: Title ($\le 95\text{ chars}$), platform hashtags, and pinned comment engagement prompt.
4. `TimerOverlaySpec`: Timestamp markers for visual countdown overlay and audio ticking SFX.

#### Minimum Validation Rules
- Question text must not disclose the correct answer in the Hook or Problem sections.
- Exactly 4 options (`a`, `b`, `c`, `d`) must be present with non-empty text.
- Mathematical proof must deterministically evaluate to the marked correct option.
- Total spoken script word count must strictly map to $\le 58\text{ seconds}$ at 140 WPM ($\le 135\text{ words}$).
- Teleprompter script must contain an explicit `PAUSE_CHALLENGE` segment and comment-invitation prompt.

#### Completion Criteria
- Candidate question saved to Firestore `question_drafts` (Stage 01).
- 10-point pedagogical audit passed and approved by QA reviewer (Stage 02).
- Teleprompter script locked with pacing $\le 58\text{s}$ (Stage 03).
- Master cut verified with 9:16 safe-zones and countdown timer overlay in Stage 07 Final QC.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio`).
- **Sequential Flow**: Step 01 $\to$ Step 02 $\to$ Step 03 $\to$ Step 04 $\to$ Step 05 $\to$ Step 06 $\to$ Step 07 $\to$ Step 08 $\to$ Step 09 $\to$ Step 10 $\to$ Step 11 $\to$ Step 12 $\to$ Step 13 $\to$ Step 14 $\to$ Step 15.
- **Workflow Invariant**: Preserves 1:1 question-to-video mapping in existing Firestore schemas for single-video production. Proposed batch generation (*OD-02*) dispatches $N$ parallel single-question journeys sharing taxonomy context.

---

### 3.2 Mode Contract: Topic Introduction

#### Purpose
Produce an educational curriculum orientation video that introduces and demystifies a Topic / Subtopic, explains its real-world relevance, details its competitive examination scope, and previews upcoming problem-solving modules without solving practice questions.

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `targetExamCategory`: Target exam board (`APPSC`, `TSPSC`, `SSC_CGL`, `BANKING`, `GENERAL`)

#### Optional Inputs
- `realWorldContext`: Real-life phenomenon or historical application.
- `keyFormulasOrTheorems`: Array of key principles or formulas to introduce conceptually.
- `targetDurationSeconds`: Duration target in seconds (`60` to `180`; default: `90`).
- `aspectRatio`: Video framing (Proposed `9:16` or `16:9`; default: `9:16` under current media contract; *see OD-04*).
- `customInstructions`: Presenter tone guidance.

#### Generated Outputs
1. `TopicIntroductionBrief`: Conceptual brief detailing syllabus scope, weightage analysis, and core learning goals.
2. `ConceptScriptPayload`: 5-part explanatory script (Why It Matters $\to$ Concept Definition $\to$ Syllabus Scope & Weightage $\to$ Core Intuition $\to$ Roadmap CTA).
3. `VisualAssetPrompts`: Suggestions for graphic charts, diagrams, or title cards to be rendered on screen.
4. `SocialMetadataPayload`: Video title, educational description, syllabus tags, and pinned comment preview.

#### Minimum Validation Rules
- `topicId` and `subtopicId` must be valid active taxonomy records in Firestore.
- **Question Count Non-Required ($N = 0$)**: Mode 2 does not require a question-count input. Proposed validation rule: When Mode 2 endpoints are implemented, any submitted question-count parameter will be treated as non-required and ignored or rejected, ensuring the generation yields a conceptual overview rather than practice problems.
- Script must contain both conceptual definition and exam weightage sections.
- Spoken Telugu narration must maintain academic accuracy without archaic formalisms.

#### Completion Criteria
- Concept Brief and Script reviewed and certified for pedagogical accuracy.
- Video master cut assembled with concept visualizers and title cards.
- Master QC certified for audio loudness (-14 LUFS) and legibility in Step 07.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `TOPIC_INTRODUCTION`).
- **Workflow Adaptation** (*Proposed under Decision OD-03; pending ARB approval*):
  - Step 01 creates a `ConceptBrief` persisted in Firestore.
  - Step 02 executes **Concept Accuracy Verification** (SME signs off on conceptual correctness and syllabus alignment, preserving the immutable 15-step sequential pipeline and GAR-02 anti-self-approval gate).
  - Step 03 locks the explanatory script $\to$ proceeds sequentially through standard Steps 04–15.

---

### 3.3 Mode Contract: Explained Questions Video

#### Purpose
Produce an in-depth, comprehensive educational masterclass that begins with an introductory concept orientation and proceeds through a structured sequence of 5, 10, 15, or 20 explained practice questions with step-by-step proofs, common mistake analyses, and speed shortcuts.

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `questionCount`: Mandatory selection of exactly `5`, `10`, `15`, or `20`
- `difficultyDistribution`: Single level (`EASY`, `MEDIUM`, `HARD`) or `PROGRESSIVE` (starts Easy, scales to Hard)

#### Optional Inputs
- `introStyle`: Style for the introductory segment (`CONCEPT_OVERVIEW`, `EXAM_STRATEGY`, `HISTORICAL_PUZZLE`).
- `includeBurraSpeedTricks`: Boolean flag (whether every question includes a speed shortcut; default: `true`).
- `realWorldContext`: Unifying thematic context across the question set.
- `customInstructions`: Specific drafting instructions.
- `aspectRatio`: Video framing (Proposed: `16:9` Landscape; *see OD-04*).

#### Generated Outputs
1. `IntroductorySegmentPayload`: 60–90 second spoken intro explaining topic strategy and question roadmap.
2. `ExplainedQuestionSetPayload`: Array of exactly $N$ validated questions ($N \in \{5, 10, 15, 20\}$), each containing:
   - Question text & 4 options
   - Correct answer key
   - Detailed step-by-step mathematical derivation
   - Exam trap / common misconception note
   - Burra speed shortcut (5–10s method)
3. `MasterTeleprompterScriptPayload`: Unified sequential script linking Intro Segment $\to$ Questions 1 to $N$ $\to$ Outro Recap.
4. `ChapterTimestampsSpec`: YouTube chapter marker list (`00:00 Intro`, `01:30 Q1`, etc.).
5. `VideoProductionPackage`: Metadata linking the master video project to all constituent questions (*see OD-05*).

#### Minimum Validation Rules
- The number of generated question candidates must strictly match the selected `questionCount` ($N \in \{5, 10, 15, 20\}$).
- Every question in the set must independently pass the 4-option validation and mathematical proof evaluation.
- The introductory segment must be non-empty and must precede Question 1.
- No duplicate or highly similar questions within the generated set (similarity threshold $< 0.85$ via `QuestionSimilarityMatch`).
- Total estimated duration must align with the format budget (~2 to 2.5 minutes per question + 2 minutes intro/outro; *see OD-07*).

#### Completion Criteria
- All $N$ questions verified and certified in Step 02.
- Intro segment and master teleprompter script locked in Step 03.
- Studio recording session logged with approved takes for all $N$ questions in Step 04.
- Master timeline cut assembled with on-screen question graphics, chapter markers, and subtitles in Step 06.
- Master QC certified for technical compliance, chapter sync, and audio loudness in Step 07.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `EXPLAINED_QUESTIONS_VIDEO`).
- **Workflow Adaptation** (*Proposed under Decision OD-05; pending ARB approval*):
  - Step 01 dispatches a batch question generation linked to a `ContentMaster` / `ContentBatch`.
  - Step 02 presents a batch verification queue where the SME verifies all $N$ questions.
  - Step 03 produces a unified long-form script.
  - Steps 04 through 15 manage the master video asset as an aggregate container referencing all $N$ question IDs.

---

## 4. Mode-to-Field / Validation Matrix

The following matrix categorizes all inputs, entity fields, and validation gates across the three production modes. It strictly distinguishes **Required Product Behavior**, **Supported Configuration Values**, and **Implementation Dependencies Awaiting Approval (OD-01 through OD-07)**, with per-mode contract statuses:

| Field / Attribute Name | Technical Type & Source | Mode 1: Question Challenge Short | Mode 2: Topic Introduction | Mode 3: Explained Questions Video | Architectural Contract Status & Dependency (Per Mode) | Reusable Code Artifact / Contract Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `topicId` | `string` (`top_<uuid>` / `TOP-*`) | **Required** (single topic) | **Required** (single topic) | **Required** (single topic) | **ESTABLISHED** across all modes | [`shared/types/question.ts`](../../../shared/types/question.ts), `QuestionInputBaseSchema` |
| `subtopicId` | `string` (`sub_<uuid>` / `SUB-*`) | **Required** (single subtopic) | **Required** (single subtopic) | **Required** (single subtopic) | **ESTABLISHED** across all modes | [`shared/types/question.ts`](../../../shared/types/question.ts), `QuestionInputBaseSchema` |
| `language` | `QuestionLanguage` enum | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **ESTABLISHED** across all modes | [`shared/constants/enums.ts`](../../../shared/constants/enums.ts#L64), `LANGUAGES` |
| `difficulty` | `DifficultyLevel` enum | **Required** (`EASY`, `MEDIUM`, `HARD`) | **Not Applicable** | **Required** (`EASY`, `MEDIUM`, `HARD`, or `PROGRESSIVE`) | **ESTABLISHED** across all modes | [`shared/constants/enums.ts`](../../../shared/constants/enums.ts#L6), `DIFFICULTY_LEVELS` |
| `questionCount` | `number` (`1, 5, 10, 15, 20`) | **Required**: `1` (single short). Supported batch configs: `5, 10, 15, 20` (ADR-010 resolved). | **Non-Required** ($N = 0$). Validation rule: ignored/rejected if passed. | **Required Product Configuration**: Must select `5`, `10`, `15`, or `20`. | - **Mode 1**: Established for $N=1$; Resolved via **ADR-010** for batch series.<br>- **Mode 2**: Established non-required ($N=0$).<br>- **Mode 3**: Established required configuration; Resolved via **ADR-010** (additive $1+N$). | [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts#L35), `targetQuestionCount` |
| `realWorldContext` | `string` | Optional | Optional | Optional | **ESTABLISHED** across all modes | [`shared/constants/enums.ts`](../../../shared/constants/enums.ts#L253), `REAL_LIFE_CONTEXTS` |
| `questionStyle` | `QuestionStyle` enum / `string` | Optional | **Not Applicable** | Optional | **ESTABLISHED** across all modes | [`shared/constants/enums.ts`](../../../shared/constants/enums.ts#L108), `QuestionConfigEntryZodSchema` |
| `challengeType` | `string` (`ABCD`, `ODD_ONE_OUT`)| **Required**: 4-option MCQ format. Supported: `ABCD`. | **Not Applicable** | Optional (default: `ABCD` 4-option MCQ). | - **Mode 1 & 3**: Established for 4-option MCQ; Resolved via **ADR-009**.<br>- **Mode 2**: Not applicable. | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L83) |
| `questionText` | `string` ($\ge 5\text{ chars}$) | **Required** (1 question) | **Not Applicable** | **Required** ($N$ questions) | **ESTABLISHED** across all modes | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L67) |
| `options` (A, B, C, D)| `Record<'a'|'b'|'c'|'d', string>` | **Required** (exactly 4 options) | **Not Applicable** | **Required** (exactly 4 options per question) | **ESTABLISHED & RESOLVED via ADR-009** (Strict 4-option schema enforced) | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L69-L74) |
| `correctAnswer` | `'A' | 'B' | 'C' | 'D'` | **Required** (single key) | **Not Applicable** | **Required** (single key per question) | **ESTABLISHED** across all modes | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L79) |
| `explanation` / Proof | `string` ($\ge 5\text{ chars}$) | **Required** (1 explanation) | **Not Applicable** | **Required** ($N$ explanations) | **ESTABLISHED** across all modes | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L80) |
| `introductoryConcept` | `string` | **Not Applicable** | **Required** | **Required** | **RESOLVED** field specification for Modes 2 & 3 | New field for Modes 2 & 3 |
| `syllabusScopeNotes` | `string` | **Not Applicable** | **Required** | Optional | **RESOLVED** field specification for Mode 2 | New field for Mode 2 |
| `countdownTimerMs` | `number` (`3000` or `5000`) | **Required** (default: `5000`) | **Not Applicable** | Optional | **ESTABLISHED** (aligned with `pauseDurationSeconds`) | [`shared/types/content.ts`](../../../shared/types/content.ts#L1405) |
| `commentPromptText` | `string` | **Required** (engagement CTA) | Optional | Optional | **ESTABLISHED** (aligned with `commentChallengePrompt`) | [`shared/types/content.ts`](../../../shared/types/content.ts#L1346) |
| `burraSpeedTrick` | `string` | Optional | **Not Applicable** | **Required** (if enabled) | **ESTABLISHED** across applicable modes | [`backend/ai/prompts/script-generation.prompt.ts`](../../../backend/ai/prompts/script-generation.prompt.ts) |
| `chapterTimestamps` | `Array<{ time: string; title: string }>` | **Not Applicable** | **Not Applicable** | **Required** (YouTube chapters) | **RESOLVED** field specification for Mode 3 | New field for Mode 3 |
| `aspectRatio` | `'9:16' | '16:9'` | Strictly `'9:16'` (vertical) | Supported: `'9:16' | '16:9'` | Strictly `'16:9'` (horizontal) | - **Mode 1**: Established 9:16 vertical.<br>- **Modes 2 & 3**: Resolved via **ADR-010** (amending [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md)). | [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) |
| `targetMaxDuration` | `number` (seconds) | $\le 58\text{ seconds}$ | $60\text{ to }180\text{ seconds}$ | $12\text{ to }55\text{ minutes}$ | - **Modes 1 & 2**: Established/bounded.<br>- **Mode 3**: Resolved via **ADR-010** (tiered duration scaling & async timeouts; amending [17-JOB-ASYNC-ARCHITECTURE.md](../../architecture/17-JOB-ASYNC-ARCHITECTURE.md)). | Default: 45s in [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L183) |
| `step02Verification` | Verification checklist | 10-point pedagogical audit & proof verification (1 question) | 5-point Concept Accuracy Verification (0 questions) | Verification of all $N$ practice questions | - **Modes 1 & 3**: Established question proof verification.<br>- **Mode 2**: Resolved via **ADR-009** (Polymorphic Step 02 Concept Audit). | [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md#L185) |
| `datastoreEntityLinkage`| Relational mapping | 1:1 scalar `Video.questionId` | 1 `Video` with 0 questions (`questionId: null`, `conceptBriefId`) | 1 `Video` with $N$ questions (`Video.questionIds: string[]`, `ContentMaster`) | - **Mode 1**: Established 1:1 scalar `questionId`.<br>- **Modes 2 & 3**: Resolved via **ADR-010** (`ContentMaster` aggregate root with nullable `video.questionId`). | [`shared/types/content.ts`](../../../shared/types/content.ts#L101), [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts#L83) |

---

## 5. Question-Count Applicability Analysis

### 5.1 Mode 1: Question Challenge Short
- **Single-Video Reality**: Given platform limits (YouTube Shorts $\le 60\text{s}$, Instagram Reels $\le 90\text{s}$), a high-retention question challenge video with hook (3s), problem statement (15s), pause/countdown (5s), solution explanation (20s), trick (10s), and comment CTA (5s) requires **between 45 and 58 seconds**.
- **Question Count Applicability**:
  - A single Short video naturally contains **exactly 1 question**.
  - When a user configures `questionCount` as `5`, `10`, `15`, or `20`, this configuration applies as a **Batch Generation Configuration** creating $N$ standalone single-question Short videos (*Conditional on approval of Decision OD-02*).

### 5.2 Mode 2: Topic Introduction
- **Acceptance Criterion Alignment**: In strict accordance with the approved mode requirements, Mode 2 does not require a question-count input. It serves as an orienting curriculum overview covering syllabus scope and weightage without practice questions ($N = 0$).
- **Proposed Validation Enforcement**: In future endpoint implementations, the validation schema will treat `questionCount` as non-required and ignore or reject any submitted `questionCount` payload.

### 5.3 Mode 3: Explained Questions Video
- **Question Count Applicability**: Explicitly supports question counts of **5, 10, 15, and 20**.
- **Introductory Segment Inclusion vs. Exclusion Analysis**:
  - **The Core Ambiguity**: Does the question count figure ($N \in \{5, 10, 15, 20\}$) *include* or *exclude* the introductory segment?
  - **Case A: Additive / Intro-Plus Structure ($1 + N$)**:
    - The count $N$ strictly enumerates the *practice questions*.
    - The video contains:
      $$\text{Total Segments} = 1\text{ (Intro)} + N\text{ (Questions)} + 1\text{ (Outro)} = N + 2\text{ Segments}$$
    - Example: A "10 Explained Questions" video contains 1 introductory concept segment followed by 10 distinct, fully explained questions.
    - *Pedagogical Value*: High. The student receives the advertised 10 practice problems plus the orientation bonus.
  - **Case B: Total Segment Budget ($N$ Total)**:
    - The count $N$ represents the total chapter chunks, where Segment 1 is the Introduction, followed by $N - 1$ questions.
    - Example: A "10-segment video" contains 1 Intro + 9 Questions.
    - *Pedagogical Value*: Lower; risks student confusion ("Video title says 10 questions, but there were only 9").
  - **Proposed Recommendation**: Option A ($1 + N$ additive) is recommended to prevent student confusion, subject to formal approval (*Conditional on approval of Decision OD-01*).

---

## 6. Authoritative Open Decisions Register

The following register formally records all unresolved, ambiguous, or architecture-expanding requirements identified across the three production modes. **No recommended option is encoded as mandatory behavior prior to formal approval.**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OPEN ARCHITECTURAL DECISIONS REGISTER                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### OD-01: Inclusion vs. Exclusion of Intro Segment in Mode 3 Question Count
- **Status**: `RESOLVED VIA AUTHORITATIVE DECISION & ADR-010 (Option A: Additive 1 Intro + N Questions)`
- **Decision Required**: When a creator selects `5`, `10`, `15`, or `20` questions for Mode 3 (Explained Questions Video), does this count include or exclude the introductory segment?
- **Current Repository Reality**:
  - The codebase currently has no multi-question masterclass generation engine; existing prompts and schemas assume single questions (`shared/contracts/question-generation/question-generation.contract.ts`).
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Additive ($1 + N$)**. The count $N$ strictly specifies the number of practice questions generated, verified, and solved. The introductory concept segment is an additive prerequisite ($1\text{ Intro} + N\text{ Questions}$).
  - *Option B*: **Inclusive ($N$ total segments)**. The count represents total chapters, yielding 1 Intro + $(N - 1)$ questions.
- **Architectural & Operational Impact**:
  - Affects array lengths in `ExplainedQuestionSetPayload`, loop counts in prompt orchestrators, chapter indexing ($Q_1 \dots Q_N$ vs $Q_1 \dots Q_{N-1}$), and total video duration budget.
- **Approval Authority**: Lead Architect & Content Director.

---

### OD-02: Mode 1 Question Counts: Single-Question Short vs. Batch Generation Series
- **Status**: `RESOLVED VIA AUTHORITATIVE DECISION & ADR-010 (Option A: Batch Creation Series for Counts > 1; Single Short N=1 Default)`
- **Decision Required**: How should configurable question counts of `5`, `10`, `15`, and `20` be realized for Mode 1 (Question Challenge Short) given the platform constraint of $\le 60\text{ seconds}$?
- **Current Repository Reality**:
  - [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) (Line 134) and [15-API-CONTRACT.md](../../architecture/15-API-CONTRACT.md) (Line 398) enforce a video duration between 15 and 70 seconds.
  - `QueueVideoInputSchema` in [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L183) sets `targetDurationSeconds` default to 45 seconds.
  - A single Short video cannot comfortably fit more than 1 question with pause and explanation within 60 seconds.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Batch Creation Series**. Selecting 5, 10, 15, or 20 in Mode 1 creates a *Batch / Series* of $N$ separate, standalone Short videos (e.g., "10 Daily Math Challenges"). Each video is a 1-question Short progressing independently through the 15-step pipeline.
  - *Option B*: **Rapid-Fire Single Short**. A single 60s video with multiple ultra-rapid 8-second flash questions without on-video explanations (answers posted in pinned comments). Technically limited to a maximum of 4–5 questions; physically impossible for 10, 15, or 20 questions.
  - *Option C*: **Strict Single-Question Only**. Disallow question counts $> 1$ for Mode 1; lock Mode 1 strictly to $N = 1$.
- **Architectural & Operational Impact**:
  - Option A requires integrating with `ContentBatch` / `ContentPlan` infrastructure in [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts). Option B requires specialized rapid-fire teleprompter templates. Option C requires disabling count controls in the UI for Mode 1.
- **Approval Authority**: Architecture Review Board (ARB) & Product Manager.

---

### OD-03: Mode 2 Workflow Alignment: Canonical Step 02 Adaptation for Zero-Question Content
- **Status**: `RESOLVED VIA ARCHITECTURAL CONTRACT & ADR-009 (Option A: Polymorphic Step 02 Concept Audit)`
- **Decision Required**: Since Mode 2 (Topic Introduction) generates zero questions, how does it progress through Step 02 (Question Verification) in the canonical 15-step workflow without violating workflow invariants?
- **Current Repository Reality**:
  - Canonical Step 02 in [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md) is defined as "10-point pedagogical audit, proof verification, editorial sign-off, and production queueing" with mandatory anti-self-approval rule `GAR-02`.
  - Workflow transitions are sequential and immutable (`transition-matrix.ts`). Bypassing Step 02 violates workflow invariants.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Polymorphic Step 02 (Concept Accuracy Verification)**. Step 02 remains an immutable mandatory gate, but dynamically adapts its checklist based on content mode. For Mode 2, it displays a **5-Point Concept Audit Checklist** (Syllabus accuracy, definition clarity, exam relevance, Telugu orthography, roadmap completeness) instead of mathematical proof validation. Anti-self-approval (`GAR-02`) remains strictly enforced.
  - *Option B*: **Auto-Pass Step 02 Gate**. The system automatically transitions Mode 2 content through Step 02 without human review. (*Rejected: Violates Human-in-the-Loop AP-009 and GAR-02*).
  - *Option C*: **Skip Step 02 Transition**. Allow a direct transition from Step 01 to Step 03 (`T01-03`) specifically for Mode 2. (*Violates sequential 15-stage workflow invariant*).
- **Architectural & Operational Impact**:
  - Option A preserves the immutable 15-step sequential state machine while updating `QuestionVerifyApprovePage.tsx` to render mode-appropriate verification controls.
- **Approval Authority**: Lead Architect.

---

### OD-04: Aspect Ratio Governance: 9:16 Vertical Mandate vs. 16:9 Landscape Expansion
- **Status**: `RESOLVED VIA AUTHORITATIVE DECISION & ADR-010 (Option A: Mode-Governed Aspect Ratio Expansion; Amending 14-MEDIA-ARCHITECTURE.md)`
- **Decision Required**: Does BP-CMS permit 16:9 landscape video assets in production, and how are aspect ratios governed across the three production modes?
- **Current Repository Reality**:
  - [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) (Lines 132–134) strictly mandates: *"pixel dimensions must be $1080 \times 1920$ (vertical 9:16)"*.
  - [24-TEST-ARCHITECTURE.md](../../architecture/24-TEST-ARCHITECTURE.md) (Line 262) explicitly mandates: *"Rejects upload of horizontal (16:9) video or non-MP4 container"*.
  - [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md) (Lines 479, 539) enforces 1080x1920 vertical resolution at Step 06 and Step 07 QC gates.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Expand Media Contract to Support Mode-Governed Aspect Ratios**:
    - Mode 1: Strictly **9:16 Vertical Portrait** ($1080 \times 1920\text{ px}$).
    - Mode 2: **Configurable** (`9:16` for Shorts overview or `16:9` for standard video).
    - Mode 3: Strictly **16:9 Landscape** ($1920 \times 1080\text{ px}$) for main masterclass.
  - *Option B*: **Strict Vertical Invariant Retention**. Enforce 9:16 across all modes without exception. For Mode 3, masterclasses are split into vertical carousel segments.
- **Architectural & Operational Impact**:
  - Option A amends [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md), [15-API-CONTRACT.md](../../architecture/15-API-CONTRACT.md), Step 07 Final QC validation rules, and Step 08 Thumbnail generator dimensions ($1280 \times 720$ for 16:9 vs $1080 \times 1920$ for 9:16).
- **Approval Authority**: Architecture Review Board (ARB).

---

### OD-05: Datastore Entity Architecture: Scalar `questionId` vs. Multi-Question Aggregate Root
- **Status**: `RESOLVED VIA AUTHORITATIVE DECISION & ADR-010 (Option A: ContentMaster Aggregate Root & Schema Relaxation)`
- **Decision Required**: Should Mode 2 (Topic Intro, 0 questions) and Mode 3 (Explained Questions, $N$ questions) store their payloads directly in existing collections, or introduce an aggregate root container?
- **Current Repository Reality**:
  - In Firestore, the `videos` collection schema defines `questionId: string` as a mandatory 1:1 scalar foreign key ([`shared/types/content.ts`](../../../shared/types/content.ts#L101)).
  - `QueueVideoInputSchema` in [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L177) enforces `questionId: z.string().min(1)`.
  - Mode 2 has no `questionId`, and Mode 3 has multiple question IDs.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Leverage `ContentMaster` Aggregate Root & Make `Video.questionId` Nullable with `questionIds: string[]`**:
    - Mode 1: 1 `ContentMaster` $\to$ 1 `Question` $\to$ 1 `Video` (`questionId` populated).
    - Mode 2: 1 `ContentMaster` $\to$ 0 `Questions` $\to$ 1 `ConceptBrief` $\to$ 1 `Video` (`questionId: null`, `conceptBriefId: string`).
    - Mode 3: 1 `ContentMaster` $\to$ $N$ `Questions` $\to$ 1 `Video` (`questionIds: string[]`, `primaryQuestionId: string`).
  - *Option B*: **Create Separate Top-Level Collections**. Introduce `topic_introductions` and `masterclass_videos` as independent Firestore root collections.
- **Architectural & Operational Impact**:
  - Option A reuses existing `ContentMaster` types defined in [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts#L83) while requiring non-breaking schema relaxation in `QueueVideoInputSchema`. Option B duplicates workflow, assignment, and media infrastructure.
- **Approval Authority**: Lead Architect & Database Custodian.

---

### OD-06: Option Validation & Challenge Formats: Strict 4-Option MCQ Invariant vs. Non-MCQ Formats
- **Status**: `RESOLVED VIA AUTHORITATIVE CONTRACT & ADR-009 (Option A: Strict 4-Option MCQ Invariant)`
- **Decision Required**: Does Mode 1 (Question Challenge Short) permit non-MCQ formats (e.g., true/false, odd-one-out, open riddle), or must all challenge formats strictly conform to the 4-option multiple-choice schema?
- **Current Repository Reality**:
  - [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L69-L79) strictly enforces:
    ```ts
    options: z.object({
      a: z.string().min(1),
      b: z.string().min(1),
      c: z.string().min(1),
      d: z.string().min(1),
    }),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    ```
  - [`shared/contracts/question-generation/question-generation.contract.ts`](../../../shared/contracts/question-generation/question-generation.contract.ts) mandates exactly 4 options.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Strict 4-Option MCQ Conformance**. All challenge types (including `ODD_ONE_OUT`, `SPEED_MATH`, `COMMENT_CHALLENGE`) must be structured as 4-option MCQs. For binary choices (e.g., `TRUE_FALSE`), options C and D are either not permitted or the format is adapted into 4 distinct propositions.
  - *Option B*: **Polymorphic Option Schema**. Relax schema to allow 2 options (`TRUE_FALSE`) or open-ended challenges with 0 options.
- **Architectural & Operational Impact**:
  - Option A ensures 100% backward compatibility with all downstream rendering engines, teleprompter templates, and database schemas. Option B requires pervasive schema refactoring across validation, UI, and AI validators.
- **Approval Authority**: Architecture Review Board (ARB).

---

### OD-07: Mode 3 Duration Scaling & Asynchronous Processing Boundaries
- **Status**: `RESOLVED VIA AUTHORITATIVE DECISION & ADR-010 (Option A: Tiered Duration Budgets & Extended Async Timeouts; Amending 17-JOB-ASYNC-ARCHITECTURE.md)`
- **Decision Required**: What are the upper duration limits for Mode 3 (Explained Questions Video) across question counts ($5, 10, 15, 20$), and how do they impact background job execution?
- **Current Repository Reality**:
  - [17-JOB-ASYNC-ARCHITECTURE.md](../../architecture/17-JOB-ASYNC-ARCHITECTURE.md) (Lines 143, 197) specifies video transcode and validation jobs assuming durations under 70 seconds with a transcode window of 10s–120s.
  - A 20-question video may run between 40 and 55 minutes, resulting in video file sizes of ~1.5 GB to 3.0 GB.
- **Options Evaluated**:
  - *Option A (Recommended Proposal)*: **Tiered Duration Budgets with Extended Async Timeouts**:
    - 5 Questions: 12–15 minutes (Max transcode window: 5 minutes).
    - 10 Questions: 22–26 minutes (Max transcode window: 10 minutes).
    - 15 Questions: 32–38 minutes (Max transcode window: 15 minutes).
    - 20 Questions: 42–52 minutes (Max transcode window: 20 minutes).
    - Media processing timeouts in [17-JOB-ASYNC-ARCHITECTURE.md](../../architecture/17-JOB-ASYNC-ARCHITECTURE.md) updated accordingly.
  - *Option B*: **Cap Maximum Question Count to 10**. Defer 15 and 20 question masterclasses to a future sprint to avoid long-running video transcode overhead.
- **Architectural & Operational Impact**:
  - Option A requires updating asynchronous job worker timeouts, Google Drive upload chunking rules, and client-side playback buffer limits.
- **Approval Authority**: Lead Architect & Infrastructure Engineer.

---

## 7. Traceability to Existing Contracts & Architecture

| Requirement / Component | Existing Architecture Spec / Contract | Codebase Implementation |
| :--- | :--- | :--- |
| **Two-Tier Taxonomy** | [25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md) | `database/firestore/repositories/topic.repository.ts`, `subtopic.repository.ts` |
| **Canonical 15 Steps** | [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md) | [`shared/constants/workflow.ts`](../../../shared/constants/workflow.ts), `backend/domain/workflow/transition-matrix.ts` |
| **GAR-02 Anti-Self-Approval** | [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md), `FC-002` | [`backend/domain/workflow/transition-matrix.ts`](../../../backend/domain/workflow/transition-matrix.ts) |
| **Strict 4-Option MCQ Schema** | `FC-005-WORKFLOW-STATE-ENGINE.md` | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L69-L80) |
| **Teleprompter Scripting** | `Phase 8D Teleprompter Scripting` | [`backend/ai/prompts/teleprompter-script.prompt.ts`](../../../backend/ai/prompts/teleprompter-script.prompt.ts) |
| **Batch Target Counts** | `Phase 9 Content Planning` | [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts#L35), [`frontend/pages/PlanningPage.tsx`](../../../frontend/pages/PlanningPage.tsx) |
| **Current 9:16 Video Contract** | [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md#L132-L134) | [`frontend/components/video/FinalReviewWorkspace.tsx`](../../../frontend/components/video/FinalReviewWorkspace.tsx) |
| **Comment Engagement CTA** | `Phase 8C Social CTAs` | [`shared/types/content.ts`](../../../shared/types/content.ts), `commentChallengePrompt` |

---

## 8. Acceptance Criteria Traceability

| Acceptance Criterion | Implementation Section | Verification Summary | Status |
| :--- | :--- | :--- | :---: |
| **Mode 1: Question Challenge Short** | Section 2.1, 3.1, 4, 5.1 | Single-short ($N=1$) established; batch series ($5, 10, 15, 20$) resolved via ADR-010. | **COMPLIANT** |
| **Mode 2: Topic Introduction** | Section 2.2, 3.2, 4, 5.2 | Question count non-required ($N=0$) established; polymorphic Step 02 resolved via ADR-009. | **COMPLIANT** |
| **Mode 3: Explained Questions Video** | Section 2.3, 3.3, 4, 5.3 | Masterclass structure with counts $\{5, 10, 15, 20\}$; intro inclusion (OD-01), 16:9 (OD-04), aggregate model (OD-05), duration scaling (OD-07) all resolved via ADR-010. | **COMPLIANT** |
| **Explicit Input/Output Contracts** | Section 3.1, 3.2, 3.3 | Provided purpose, required/optional inputs, outputs, validation, completion, and handoffs for all 3 modes. | **COMPLIANT** |
| **Shared vs. Mode-Specific Matrix** | Section 4 | Analyzed 22 schema fields/gates; all fields reconciled with ADR-009 & ADR-010 resolutions. | **COMPLIANT** |
| **Question-Count Applicability** | Section 5 | Detailed question count semantics across all 3 modes with intro segment additive analysis ($1+N$). | **COMPLIANT** |
| **Open Decisions Register** | Section 6 | Numbered register (OD-01 to OD-07) detailing decision required, current reality, options, impacts, and authorities; all 7 decisions formally resolved. | **COMPLIANT** |
| **Preservation of Canonical 15-Stage Workflow** | Section 1.2, 3, 7 | All 15 stages preserved in sequential order; zero skipped stages; GAR-02 enforced across all modes. | **COMPLIANT** |
| **Truthful Approval Status** | Document Header, Section 1.3 | Labeled document as `ACCEPTED REQUIREMENTS BASELINE (Project Owner Approved)`; decisions recorded in `DECISION-LOG.md`. | **COMPLIANT** |
| **Contract Reconciliation** | Throughout, Section 7 | Replaced all local `file:///` URLs with repo-relative paths; verified against request schemas, media architecture, and async job contracts. | **COMPLIANT** |
