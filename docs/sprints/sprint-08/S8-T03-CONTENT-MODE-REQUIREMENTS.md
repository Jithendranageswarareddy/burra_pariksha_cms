# S8-T03 — Content Mode Requirements & Specification Contract
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 08 — Task S8-T03: Requirements, Input/Output Contracts, Field Validation Matrix, and Architectural Decision Register for Three Production Modes

```text
================================================================================
Document ID:       BP-S8-T03-CONTENT-MODES
Version:           1.7.0-RECONCILED-BASELINE
Date:              2026-10-15
Status:            APPROVED BASELINE & RECONCILED REQUIREMENTS CONTRACT
Classification:    Content Engineering, Production Architecture & AI Contracts
Inspected Commit:  9b409c5 (main)
Scope:             Three Production Modes (Question Challenge Short, Topic
                   Introduction, Explained Questions Video), Input/Output
                   Contracts, Shared/Specific Matrix, Validation, and Classified Decisions
Upstream:          07-CANONICAL-15-STEP-WORKFLOW.md, 11-PAGE-ROUTE-CONTRACT.md,
                   12-DATABASE-ARCHITECTURE.md, 14-MEDIA-ARCHITECTURE.md,
                   15-API-CONTRACT.md, 17-JOB-ASYNC-ARCHITECTURE.md,
                   24-TEST-ARCHITECTURE.md, 25-TWO-TIER-TAXONOMY-ARCHITECTURE.md,
                   DECISION-LOG.md (ADR-009, ADR-010, ADR-011),
                   S8-T01-QUESTION-GENERATION-AUDIT.md,
                   S8-T02-PRODUCTION-PAGE-WORKFLOW-INVENTORY.md
Downstream:        S8-T04 (Dynamic Page Role Requirements),
                   S8-T05 (Production Context Contract),
                   Stage 01 Studio UI, Multi-Mode AI Orchestrators, Media Pipeline
Approval State:    RECONCILED BASELINE (Approved ADRs & Verified Reality Codified)
================================================================================
```

---

## 1. Executive Summary & Governance Boundaries

### 1.1 Purpose
The Burra Pariksha Content Management System (BP-CMS) was baseline-engineered around a single core production unit: a **single-question, short-form 9:16 vertical video ($\le 58\text{ seconds}$)** formatted for competitive examination micro-learning on YouTube Shorts and Instagram Reels.

To support curriculum onboarding, conceptual foundations, and comprehensive masterclasses, this specification defines the formal requirements, input/output contracts, validation rules, and architectural boundaries for **Three Production Modes**:

1. **Mode 1: Question Challenge Short** (`QUESTION_CHALLENGE_SHORT`) — High-energy short-form video posing a single challenge and inviting audience participation via comments before revealing the solution and mental speed shortcut.
2. **Mode 2: Topic Introduction** (`TOPIC_INTRODUCTION`) — Foundational curriculum overview introducing a Topic and Subtopic, syllabus relevance, real-world context, and key concepts without requiring a question-count input ($N = 0$).
3. **Mode 3: Explained Questions Video** (`EXPLAINED_QUESTIONS_VIDEO`) — Structured long-form masterclass featuring an introductory concept orientation followed by sequential, in-depth question explanations, proofs, and speed shortcuts with configurable question counts ($5, 10, 15, 20$).

### 1.2 Non-Negotiable System Invariants
All mode specifications strictly operate within the verified invariants defined in [AGENTS.md](../../../AGENTS.md):
1. **Cloud Firestore Sole Transactional Datastore**: All entities, drafts, metadata, and workflow states persist exclusively in Firestore ([12-DATABASE-ARCHITECTURE.md](../../architecture/12-DATABASE-ARCHITECTURE.md)). Google Sheets is never runtime state.
2. **Canonical Two-Tier Taxonomy**: Autonomous `Topic` (`top_<uuid>`) $\to$ Child `Subtopic` (`sub_<uuid>`) ([25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)). Legacy `Category` remains permanently obsolete.
3. **Collision-Resistant UUID Canonical IDs**: All entities utilize distributed UUID v4 format (`shared/lib/id.service.ts`). Numeric sequence allocation counters are prohibited.
4. **Canonical 15-Step Workflow & GAR-02 Rule**: Every production journey preserves all 15 sequential stages without omitting or reordering steps. Anti-self-approval (`authorId !== approverId`) remains strictly enforced at every review gate ([07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md), [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md)).
5. **Save Draft $\neq$ Submit for Verification**: Draft saving remains an isolated persistence action with minimal structural checks that never triggers verification or state transitions.

### 1.3 Decision Classification Framework
To eliminate ambiguity between established reality, approved architectural expansions, and pending engineering proposals, all requirements and decisions in this specification are explicitly classified into four distinct governance states:

- **Approved**: Formally authorized by the Project Owner / Architecture Review Board in [DECISION-LOG.md](../../architecture/DECISION-LOG.md) (specifically ADR-009, ADR-010, and ADR-011).
- **Verified Existing Behavior**: Directly implemented, compiled, and confirmed through active runtime code and passing test suites in the repository (e.g., `shared/types/production-context.ts`, `question-generation.service.ts`, `ProductionModeModal.tsx`).
- **Open Decision**: Outstanding technical, operational, or downstream pipeline questions where authoritative contracts or runtime infrastructure have not yet been fully settled.
- **Proposed—Approval Required**: Specific architectural proposals or feature expansions drafted for future sprints that require explicit review and authorization before implementation.

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
  - *Status*: **Approved (ADR-010) & Verified Existing Behavior**. Strictly **9:16 Vertical Portrait** ($1080 \times 1920\text{ px}$) per [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) and [shared/types/production-context.ts](../../../shared/types/production-context.ts).
- **Target Duration**: Strictly **30–58 seconds** (Platform hard ceiling: $60\text{ seconds}$).
- **Question Count Semantics**:
  - *Single-Short Behavior (Established & Verified)*: A single published Short video contains **exactly 1 question**.
  - *Batch Generation Series ($5, 10, 15, 20$)*: Selection of $> 1$ questions in Mode 1 is conceptually approved via ADR-010 as a **Batch Creation Series** producing $N$ standalone 1-question Shorts sharing taxonomy context. The actual batch-runner execution engine is classified as **Proposed—Approval Required & Open Decision** (*see Section 6, OD-02*).
- **Option Constraints**:
  - *Status*: **Approved (ADR-009) & Verified Existing Behavior**. Must strictly contain 4 multiple-choice options (`a`, `b`, `c`, `d`) and a single correct answer (`A`, `B`, `C`, `D`). Non-MCQ challenge formats are prohibited.

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
  - *Status*: **Approved (ADR-010) & Verified Existing Behavior**. Configurable support for **9:16 Vertical** ($1080 \times 1920\text{ px}$) or **16:9 Landscape** ($1920 \times 1080\text{ px}$) per `shared/types/production-context.ts`.
- **Target Duration**: **60–180 seconds** (1 to 3 minutes).
- **Question Requirement**: **Strictly Non-Required ($N = 0$)**.
  - Mode 2 does not require a question count input, multiple-choice options, answer keys, or distractors.
  - In `shared/types/production-context.ts`, `validateProductionModeConfig` strictly validates that `questionCount === 0`.
- **Workflow Step 02 Adaptation**:
  - *Status*: **Approved (ADR-009) & Verified Existing Behavior**. Step 02 executes a **Polymorphic Concept Accuracy Verification** (SME reviews syllabus scope and conceptual definitions against a 5-point checklist) in lieu of mathematical proof verification, preserving the immutable 15-step sequential pipeline and GAR-02 anti-self-approval gate.

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
  - *Status*: **Approved (ADR-010) & Verified Existing Behavior**. Strictly **16:9 Landscape** ($1920 \times 1080\text{ px}$) for standard desktop/tablet YouTube viewing.
- **Question Count Semantics**:
  - *Status*: **Approved (ADR-010) & Verified Existing Behavior**. Mandatory selection of **5, 10, 15, or 20 questions**.
  - *Introductory Segment Relationship*: **Additive ($1 + N$)**. The count $N$ strictly enumerates practice questions *in addition* to the introductory segment (i.e., 1 Intro Concept Segment + $N$ Explained Questions).
- **Target Duration**: **12–55 minutes** (proportional to question count: ~2 to 2.5 minutes per explained question + 2 minutes intro/outro).

---

## 3. Explicit Mode Contracts

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRODUCTION MODE CONTRACT SPECIFICATIONS                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Mode Contract: Question Challenge Short

#### Purpose
Generate a single-question, high-tension short-form challenge video script and production package designed to provoke viewer comments and viral engagement on vertical video platforms ($\le 58\text{s}$, 9:16).

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `difficulty`: `DifficultyLevel` (`EASY`, `MEDIUM`, `HARD`)
- `challengeType`: Multiple-choice challenge style (strictly constrained to 4-option MCQ; format `ABCD`)
- `productionMode`: `'QUESTION_CHALLENGE_SHORT'`

#### Optional Inputs
- `questionCount`: Defaults to `1` for single-short generation (Established behavior). Selecting `5, 10, 15, 20` is supported in context validation but designated as a batch series (*see OD-02*).
- `aspectRatio`: Fixed to `'9:16'` (default).
- `realWorldContext`: Real-life framing theme (e.g., "Telangana Heritage", "Speed Calculation").
- `customInstructions`: Ad-hoc editorial directives.
- `countdownDurationSeconds`: On-screen pause timer duration (`3` or `5` seconds; default: `5`).
- `hookStyle`: Hook style (`CURIOSITY`, `SPEED_CHALLENGE`, `BRAIN_CHALLENGE`).

#### Generated Outputs
1. `QuestionCandidate`: Validated question text, 4 distinct options (A, B, C, D), correct answer identifier (`A`, `B`, `C`, or `D`), detailed explanation/proof.
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
- 10-point pedagogical audit passed and approved by QA reviewer with GAR-02 enforced (Stage 02).
- Teleprompter script locked with pacing $\le 58\text{s}$ (Stage 03).
- Master cut verified with 9:16 safe-zones and countdown timer overlay in Stage 07 Final QC.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio`).
- **Sequential Flow**: Step 01 $\to$ Step 02 $\to$ Step 03 $\to$ Step 04 $\to$ Step 05 $\to$ Step 06 $\to$ Step 07 $\to$ Step 08 $\to$ Step 09 $\to$ Step 10 $\to$ Step 11 $\to$ Step 12 $\to$ Step 13 $\to$ Step 14 $\to$ Step 15.
- **Workflow Invariant**: Preserves 1:1 question-to-video mapping (`Video.questionId`). Proposed batch generation (*OD-02*) dispatches $N$ parallel single-question journeys sharing taxonomy context.

---

### 3.2 Mode Contract: Topic Introduction

#### Purpose
Produce an educational curriculum orientation video that introduces and demystifies a Topic / Subtopic, explains its real-world relevance, details its competitive examination scope, and previews upcoming problem-solving modules without solving practice questions ($N = 0$).

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `targetExamCategory`: Target exam board (`APPSC`, `TSPSC`, `SSC_CGL`, `BANKING`, `GENERAL`)
- `productionMode`: `'TOPIC_INTRODUCTION'`

#### Optional Inputs
- `questionCount`: **Strictly Non-Required ($N = 0$)**. Fixed to `0` in context validation; ignored/rejected if non-zero count is passed.
- `aspectRatio`: Video framing (Configurable `'9:16'` or `'16:9'`; default: `'9:16'`).
- `realWorldContext`: Real-life phenomenon or historical application.
- `keyFormulasOrTheorems`: Array of key principles or formulas to introduce conceptually.
- `targetDurationSeconds`: Duration target in seconds (`60` to `180`; default: `90`).
- `customInstructions`: Presenter tone guidance.

#### Generated Outputs
1. `TopicIntroductionBrief`: Conceptual brief detailing syllabus scope, weightage analysis, and core learning goals.
2. `ConceptScriptPayload`: 5-part explanatory script (Why It Matters $\to$ Concept Definition $\to$ Syllabus Scope & Weightage $\to$ Core Intuition $\to$ Roadmap CTA).
3. `VisualAssetPrompts`: Suggestions for graphic charts, diagrams, or title cards to be rendered on screen.
4. `SocialMetadataPayload`: Video title, educational description, syllabus tags, and pinned comment preview.

#### Minimum Validation Rules
- `topicId` and `subtopicId` must be valid active taxonomy records in Firestore with valid parent-child relationship.
- **Question Count Non-Required ($N = 0$)**: Mode 2 strictly does not require a question-count input. Validation rejects any payload attempting to enforce practice questions.
- Introductory concept statement must be $\ge 15\text{ characters}$ (`question-generation.service.ts`).
- Script must contain both conceptual definition and exam weightage sections.
- Spoken Telugu narration must maintain academic accuracy without archaic formalisms.

#### Completion Criteria
- Concept Brief and Script reviewed and certified for pedagogical accuracy.
- Stage 02 Concept Accuracy Verification approved by QA reviewer (GAR-02 enforced).
- Video master cut assembled with concept visualizers and title cards.
- Master QC certified for audio loudness (-14 LUFS) and legibility in Step 07.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `TOPIC_INTRODUCTION`).
- **Sequential Flow**: Preserves all 15 sequential steps without omission:
  - Step 01 creates a `ConceptBrief` persisted in `question_drafts` with `productionMode: 'TOPIC_INTRODUCTION'` and `questionCount: 0`.
  - Step 02 executes **Polymorphic Concept Accuracy Verification** (5-point checklist signed off by QA Reviewer, preserving the immutable 15-step pipeline and GAR-02).
  - Step 03 locks the explanatory script $\to$ proceeds sequentially through Steps 04–15 with `Video.questionId = null` and `conceptBriefId` linkage.

---

### 3.3 Mode Contract: Explained Questions Video

#### Purpose
Produce an in-depth, comprehensive educational masterclass that begins with an introductory concept orientation and proceeds through a structured sequence of 5, 10, 15, or 20 explained practice questions with step-by-step proofs, common mistake analyses, and speed shortcuts in 16:9 landscape format.

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `QuestionLanguage` (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`)
- `questionCount`: Mandatory selection of exactly `5`, `10`, `15`, or `20`
- `difficultyDistribution`: Single level (`EASY`, `MEDIUM`, `HARD`) or `PROGRESSIVE` (starts Easy, scales to Hard)
- `productionMode`: `'EXPLAINED_QUESTIONS_VIDEO'`

#### Optional Inputs
- `aspectRatio`: Fixed to `'16:9'` (Landscape).
- `introStyle`: Style for the introductory segment (`CONCEPT_OVERVIEW`, `EXAM_STRATEGY`, `HISTORICAL_PUZZLE`).
- `includeBurraSpeedTricks`: Boolean flag (whether every question includes a speed shortcut; default: `true`).
- `realWorldContext`: Unifying thematic context across the question set.
- `customInstructions`: Specific drafting instructions.

#### Generated Outputs
1. `IntroductorySegmentPayload`: 60–90 second spoken intro explaining topic strategy and question roadmap.
2. `ExplainedQuestionSetPayload`: Array of exactly $N$ validated questions ($N \in \{5, 10, 15, 20\}$), each containing:
   - Question text & 4 options (`a, b, c, d`)
   - Correct answer key (`A, B, C, D`)
   - Detailed step-by-step mathematical derivation / proof
   - Exam trap / common misconception note ("విద్యార్థులు చేసే సాధారణ తప్పు")
   - Burra speed shortcut (5–10s method)
3. `MasterTeleprompterScriptPayload`: Unified sequential script linking Intro Segment $\to$ Questions 1 to $N$ $\to$ Outro Recap.
4. `ChapterTimestampsSpec`: YouTube chapter marker list (`00:00 Intro`, `01:30 Q1`, etc.).
5. `VideoProductionPackage`: Metadata linking the master video project to all constituent questions via `ContentMaster` and `questionIds[]`.

#### Minimum Validation Rules
- The number of generated question candidates must strictly match the selected `questionCount` ($N \in \{5, 10, 15, 20\}$).
- Every question in the set must independently pass the 4-option validation and mathematical proof evaluation.
- Introductory concept overview must be non-empty and $\ge 15\text{ characters}$ (`question-generation.service.ts`).
- No duplicate or highly similar questions within the generated set (similarity threshold $< 0.85$ via `QuestionSimilarityMatch`).
- Total estimated duration must align with the format budget (~2 to 2.5 minutes per question + 2 minutes intro/outro).

#### Completion Criteria
- All $N$ questions verified and certified in Step 02.
- Intro segment and master teleprompter script locked in Step 03.
- Studio recording session logged with approved takes for all $N$ questions in Step 04.
- Master timeline cut assembled with on-screen question graphics, chapter markers, and subtitles in Step 06.
- Master QC certified for technical compliance, chapter sync, and audio loudness in Step 07.

#### Canonical 15-Step Workflow Handoff
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `EXPLAINED_QUESTIONS_VIDEO`).
- **Sequential Flow**:
  - Step 01 dispatches batch candidate generation and persists an aggregate draft document containing $1\text{ Intro} + N\text{ Questions}$.
  - Step 02 presents a multi-question verification queue where the SME verifies all $N$ questions.
  - Step 03 produces a unified long-form script with segmented teleprompter takes.
  - Steps 04 through 15 manage the master video asset as an aggregate container referencing all $N$ question IDs via `ContentMaster` and `questionIds: string[]`.

---

## 4. Mode-to-Field / Validation Matrix

The following matrix categorizes all inputs, entity fields, and validation gates across the three production modes. Each entry is classified as:
- **Shared (All Modes)**
- **Required Only by Particular Modes**
- **Optional / Conditionally Required**
- **Mode-Specific Output / Validation**

| Field / Attribute Name | Technical Type & Source | Category / Scope | Mode 1: Question Challenge Short | Mode 2: Topic Introduction | Mode 3: Explained Questions Video | Governance Status & Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `topicId` | `string` (`top_<uuid>` / `TOP-*`) | **Shared (All Modes)** | **Required** (single topic) | **Required** (single topic) | **Required** (single topic) | **Approved & Verified** ([25-TWO-TIER-TAXONOMY](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)) |
| `subtopicId` | `string` (`sub_<uuid>` / `SUB-*`) | **Shared (All Modes)** | **Required** (single subtopic) | **Required** (single subtopic) | **Required** (single subtopic) | **Approved & Verified** ([25-TWO-TIER-TAXONOMY](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md)) |
| `taxonomyLink` | Two-tier parent-child check | **Shared Validation** | **Mandatory Validation** (`subtopic.topicId === topic.id`) | **Mandatory Validation** (`subtopic.topicId === topic.id`) | **Mandatory Validation** (`subtopic.topicId === topic.id`) | **Approved & Verified** (`validateTaxonomyLink` in `shared/types/production-context.ts`) |
| `language` | `QuestionLanguage` enum | **Shared (All Modes)** | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **Required** (`TELUGU`, `ENGLISH`, `TELUGU_ENGLISH`) | **Approved & Verified** (`shared/constants/enums.ts`) |
| `productionMode` | `ContentProductionMode` | **Shared (All Modes)** | **Required**: `'QUESTION_CHALLENGE_SHORT'` | **Required**: `'TOPIC_INTRODUCTION'` | **Required**: `'EXPLAINED_QUESTIONS_VIDEO'` | **Approved & Verified** (ADR-010, `shared/types/production-context.ts`) |
| `difficulty` | `DifficultyLevel` enum | **Required Only by Particular Modes** | **Required** (`EASY`, `MEDIUM`, `HARD`) | **Not Applicable** | **Required** (`EASY`, `MEDIUM`, `HARD`, or `PROGRESSIVE`) | **Approved & Verified** (`shared/constants/enums.ts`) |
| `questionCount` | `number` (`0, 1, 5, 10, 15, 20`) | **Required Only by Particular Modes** | **Required: 1** (single short default). Batch configs `5, 10, 15, 20` apply as proposed series (*see OD-02*). | **Strictly Non-Required ($N = 0$)**. Enforced $0$ in context validation; rejected if non-zero. | **Required Product Configuration**: Mandatory selection of `5`, `10`, `15`, or `20` (additive $1+N$). | **Approved & Verified** (ADR-010; `validateProductionModeConfig` in `production-context.ts`) |
| `aspectRatio` | `'9:16' \| '16:9'` | **Mode-Specific Validation** | Strictly `'9:16'` (Vertical Portrait) | Supported: `'9:16'` or `'16:9'` (Default: `'9:16'`) | Strictly `'16:9'` (Horizontal Landscape) | **Approved & Verified** (ADR-010; `validateProductionModeConfig`) |
| `realWorldContext` | `string` | **Optional / Conditional** | Optional | Optional | Optional | **Approved & Verified** (`shared/constants/enums.ts`) |
| `customInstructions` | `string` | **Optional / Conditional** | Optional | Optional | Optional | **Approved & Verified** |
| `challengeType` | `string` (`ABCD`, `ODD_ONE_OUT`)| **Required Only by Particular Modes** | **Required**: 4-option MCQ format (`ABCD`). | **Not Applicable** | Optional (default: `ABCD` 4-option MCQ). | **Approved & Verified** (ADR-009; `request-schemas.ts`) |
| `questionText` | `string` ($\ge 5\text{ chars}$) | **Required Only by Particular Modes** | **Required** (1 question) | **Not Applicable** | **Required** ($N$ questions) | **Approved & Verified** (`question-generation.service.ts`) |
| `options` (A, B, C, D)| `Record<'a'\|'b'\|'c'\|'d', string>` | **Required Only by Particular Modes** | **Required** (strictly 4 non-empty options) | **Not Applicable** | **Required** (strictly 4 non-empty options per question) | **Approved & Verified** (ADR-009; `request-schemas.ts`) |
| `correctAnswer` | `'A' \| 'B' \| 'C' \| 'D'` | **Required Only by Particular Modes** | **Required** (single key) | **Not Applicable** | **Required** (single key per question) | **Approved & Verified** (`request-schemas.ts`) |
| `explanation` / Proof | `string` ($\ge 5\text{ chars}$) | **Required Only by Particular Modes** | **Required** (1 explanation) | **Not Applicable** | **Required** ($N$ explanations) | **Approved & Verified** (`request-schemas.ts`) |
| `introductoryConcept` | `string` ($\ge 15\text{ chars}$) | **Required Only by Particular Modes** | **Not Applicable** | **Required** (core syllabus overview) | **Required** (roadmap orientation segment) | **Approved & Verified** (`question-generation.service.ts`) |
| `syllabusScopeNotes` | `string` | **Mode-Specific Output** | **Not Applicable** | **Required** (weightage & board scope) | Optional | **Approved & Verified** |
| `countdownTimerMs` | `number` (`3000` or `5000`) | **Mode-Specific Validation** | **Required** (default: `5000`) | **Not Applicable** | Optional | **Approved & Verified** (`shared/types/content.ts`) |
| `commentPromptText` | `string` | **Mode-Specific Output** | **Required** (engagement CTA) | Optional | Optional | **Approved & Verified** (`shared/types/content.ts`) |
| `burraSpeedTrick` | `string` | **Mode-Specific Output** | Optional (recommended) | **Not Applicable** | **Required** (per explained question) | **Approved & Verified** (`script-generation.prompt.ts`) |
| `chapterTimestamps` | `Array<{ time: string; title: string }>` | **Mode-Specific Output** | **Not Applicable** | **Not Applicable** | **Required** (YouTube chapters) | **Approved (ADR-010)** |
| `targetMaxDuration` | `number` (seconds) | **Mode-Specific Validation** | $\le 58\text{ seconds}$ | $60\text{ to }180\text{ seconds}$ | $12\text{ to }55\text{ minutes}$ | **Approved (ADR-010)**; Open async worker scaling (*OD-07*) |
| `step02Verification` | Human Verification Gate | **Shared Gate / Mode-Specific Validation** | 10-point pedagogical audit & proof verification (1 question; GAR-02) | 5-point Concept Accuracy Verification (0 questions; GAR-02) | Batch verification of all $N$ questions + intro (GAR-02) | **Approved & Verified** (ADR-009, GAR-02; `07-CANONICAL-15-STEP-WORKFLOW.md`) |
| `datastoreEntityLinkage`| Entity Correlation Architecture | **Mode-Specific Architecture** | 1:1 scalar `Video.questionId` | 1 `Video` with 0 questions (`questionId: null`, `conceptBriefId`) | 1 `Video` with $N$ questions (`Video.questionIds: string[]`, `ContentMaster`) | **Approved (ADR-010)**; Downstream stitch worker is Open Decision (*OD-05*) |

---

## 5. Question-Count Applicability Analysis

### 5.1 Question Count Settings Breakdown ($0, 1, 5, 10, 15, 20$)
The application of question counts across the three production modes is strictly bounded as follows:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 QUESTION COUNT CONFIGURATION MATRIX                                    │
├───────────────────────────────┬────────────┬────────────┬────────────┬────────────┬────────────────────┤
│ Production Mode               │ Count = 0  │ Count = 1  │ Count = 5  │ Count = 10 │ Counts = 15, 20    │
├───────────────────────────────┼────────────┼────────────┼────────────┼────────────┼────────────────────┤
│ Mode 1: Challenge Short       │ Rejected   │ Default    │ Batch Only │ Batch Only │ Batch Only         │
│ Mode 2: Topic Introduction    │ Mandatory  │ Rejected   │ Rejected   │ Rejected   │ Rejected           │
│ Mode 3: Explained Masterclass │ Rejected   │ Rejected   │ Allowed    │ Allowed    │ Allowed            │
└───────────────────────────────┴────────────┴────────────┴────────────┴────────────┴────────────────────┘
```

### 5.2 Mode 1: Single-Question Short ($N=1$) vs. Batch Generation Series
- **Physical Platform Constraint**: YouTube Shorts enforces a $\le 60\text{s}$ platform ceiling (BP-CMS targets $\le 58\text{s}$ to avoid truncation). A high-retention question challenge video comprising hook (3s), question statement & options (15s), pause/countdown (5s), solution explanation (20s), trick (10s), and comment CTA (5s) requires **between 45 and 58 seconds**.
- **Question Count Applicability**:
  - A single Short video naturally contains **exactly 1 question**.
  - Selecting `questionCount` of `5`, `10`, `15`, or `20` in Mode 1 **does not produce a multi-question short video** (which is physical nonsense under 60 seconds).
  - Instead, multi-count selection applies as a **Batch Creation Series** producing $N$ standalone single-question Short videos (*Conditional on downstream implementation of Decision OD-02*).

### 5.3 Mode 2: Topic Introduction (Zero Questions Enforced, $N=0$)
- **Acceptance Criterion Alignment**: Mode 2 does not require a question count input. It serves as an orienting curriculum overview covering syllabus scope and weightage without practice questions ($N = 0$).
- **Enforcement Mechanism**:
  - In `shared/types/production-context.ts`, `validateProductionModeConfig('TOPIC_INTRODUCTION', count, aspect)` strictly enforces `count === 0`.
  - In `ProductionModeModal.tsx`, Mode 2 locks allowed counts to `[0]` with `defaultCount = 0`, hiding or disabling question count selectors in the UI.
  - In `question-generation.service.ts`, `validateCandidate` evaluates only the `introductoryConcept` statement ($\ge 15\text{ chars}$) and bypasses question array requirements.

### 5.4 Mode 3: Explained Questions Video ($1 + N$ Additive Masterclass)
- **Question Count Applicability**: Mode 3 strictly supports question counts of **5, 10, 15, and 20**.
- **Introductory Segment Additive Invariant ($1 + N$)**:
  - The question count $N \in \{5, 10, 15, 20\}$ strictly enumerates the *practice questions*.
  - The video contains:
    $$\text{Total Segments} = 1\text{ (Intro)} + N\text{ (Questions)} + 1\text{ (Outro)} = N + 2\text{ Segments}$$
  - Example: A "10 Explained Questions" video contains 1 introductory concept segment followed by 10 distinct, fully explained questions.
  - This avoids student confusion ("Video title says 10 questions, but there were only 9").

---

## 6. Authoritative Decision & Open Decisions Register

This register formally classifies all architecture-expanding requirements and records remaining open downstream questions.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ARCHITECTURAL DECISION REGISTER                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### OD-01: Inclusion vs. Exclusion of Intro Segment in Mode 3 Question Count
- **Classification**: **Approved (ADR-010) & Verified Existing Behavior**
- **Decision Taken**: **Option A: Additive Structure ($1\text{ Intro} + N\text{ Questions}$)**.
  - The count $N \in \{5, 10, 15, 20\}$ strictly specifies the number of practice questions generated, verified, and solved.
  - The introductory concept segment is an additive prerequisite ($1\text{ Intro} + N\text{ Questions}$).
- **Implementation Verification**:
  - Implemented and verified in `backend/domain/question-generation/question-generation.service.ts` (`validateCandidate`) and `shared/types/production-context.ts`.
- **Open Decision / Outstanding Gap**: None. This contract is settled.

---

### OD-02: Mode 1 Question Counts: Single-Question Short vs. Batch Generation Series
- **Classification**:
  - Single-Short Default ($N=1$): **Approved (ADR-010) & Verified Existing Behavior**
  - Batch Creation Series ($5, 10, 15, 20$): **Proposed—Approval Required & Open Decision**
- **Decision Context**:
  - A single published Short video is strictly bounded to $N=1$ question ($\le 58\text{ seconds}$, 9:16 vertical).
  - ADR-010 conceptually authorized selecting `5, 10, 15, 20` as a **Batch Creation Series** producing $N$ standalone single-question Shorts sharing taxonomy context.
- **Open Decision / Outstanding Gap**:
  - The automated batch dispatch runner, background parallel generation engine, and multi-draft Firestore transaction coordinator across the 15-step pipeline remain an **Open Decision** awaiting downstream execution.
  - In Stage 01 studio, selecting $> 1$ for Mode 1 currently generates candidate arrays in memory, but production handoff to independent workflow instances requires batch execution engine implementation.

---

### OD-03: Mode 2 Workflow Alignment: Canonical Step 02 Adaptation for Zero-Question Content
- **Classification**: **Approved (ADR-009) & Verified Existing Behavior**
- **Decision Taken**: **Option A: Polymorphic Step 02 (Concept Accuracy Verification)**.
  - Step 02 remains an immutable mandatory gate preserving the sequential 15-stage workflow and GAR-02 anti-self-approval rule (`authorId !== approverId`).
  - For Mode 2, Step 02 evaluates a **5-Point Concept Audit Checklist** (Syllabus accuracy, definition clarity, exam relevance, Telugu orthography, roadmap completeness) instead of mathematical proof validation.
- **Implementation Verification**:
  - Verified in `shared/types/production-context.ts`, `tests/unit/s8-t06-production-context.unit.test.ts`, and `question-generation.service.ts`.
- **Open Decision / Outstanding Gap**: None. The workflow invariant and verification gate are fully preserved.

---

### OD-04: Aspect Ratio Governance: 9:16 Vertical Mandate vs. 16:9 Landscape Expansion
- **Classification**:
  - Contract & Studio UI Level: **Approved (ADR-010) & Verified Existing Behavior**
  - Media Worker Execution Level: **Open Decision & Implementation Gap**
- **Decision Taken**:
  - Mode 1: Strictly **9:16 Vertical Portrait** ($1080 \times 1920\text{ px}$).
  - Mode 2: **Configurable** (`9:16` for Shorts overview or `16:9` for standard video).
  - Mode 3: Strictly **16:9 Landscape** ($1920 \times 1080\text{ px}$) for masterclasses.
- **Open Decision / Outstanding Gap**:
  - While context and UI validation enforce this contract (`validateProductionModeConfig`), historical media architecture specs ([14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md), Lines 132–134) and automated test specs ([24-TEST-ARCHITECTURE.md](../../architecture/24-TEST-ARCHITECTURE.md), Line 262) still mandate vertical video and specify: *"Rejects upload of horizontal (16:9) video"*.
  - Updating transcode workers, upload validation adapters, and thumbnail dimensions ($1280 \times 720$ for 16:9 vs $1080 \times 1920$ for 9:16) remains an **Open Decision** for the media pipeline team.

---

### OD-05: Datastore Entity Architecture: Scalar `questionId` vs. Multi-Question Aggregate Root
- **Classification**:
  - Contract & Schema Level: **Approved (ADR-010) & Verified Existing Behavior**
  - Video Assembly & Downstream Worker Level: **Open Decision & Implementation Gap**
- **Decision Taken**:
  - Mode 1: 1:1 scalar `Video.questionId` preserved.
  - Mode 2: `Video.questionId = null`, linked via `conceptBriefId`.
  - Mode 3: `ContentMaster` root with `Video.questionIds: string[]` and `primaryQuestionId: string`.
- **Implementation Verification**:
  - Verified in `shared/types/production-context.ts` (`ProductionContextEntityIds`) and `shared/types/question.ts` (`questions?: ExplainedQuestionItem[]`).
- **Open Decision / Outstanding Gap**:
  - Downstream video rendering in Stages 04–07 currently assumes single-question video assets. The multi-take video assembly and chapter stitching mechanism for Mode 3 masterclasses remains an **Open Decision**.

---

### OD-06: Option Validation & Challenge Formats: Strict 4-Option MCQ Invariant
- **Classification**: **Approved (ADR-009) & Verified Existing Behavior**
- **Decision Taken**: **Option A: Strict 4-Option MCQ Conformance**.
  - All challenge types across Mode 1 and Mode 3 strictly require 4 options (`a, b, c, d`) and a single correct key (`A, B, C, D`).
  - Binary choices (e.g., True/False) or open riddles are prohibited unless structured as 4 distinct propositions.
- **Implementation Verification**:
  - Enforced in `backend/server/validation/request-schemas.ts` and `backend/domain/question-generation/question-generation.service.ts`.
- **Open Decision / Outstanding Gap**: None. This contract is settled.

---

### OD-07: Mode 3 Duration Scaling & Asynchronous Processing Boundaries
- **Classification**:
  - Duration Budgets: **Approved (ADR-010)**
  - Async Worker Infrastructure Scaling: **Open Decision & Implementation Gap**
- **Decision Taken**:
  - Tiered duration budgets established:
    - 5 Questions: 12–15 minutes (Transcode window: 5 minutes).
    - 10 Questions: 22–26 minutes (Transcode window: 10 minutes).
    - 15 Questions: 32–38 minutes (Transcode window: 15 minutes).
    - 20 Questions: 42–52 minutes (Transcode window: 20 minutes).
- **Open Decision / Outstanding Gap**:
  - [17-JOB-ASYNC-ARCHITECTURE.md](../../architecture/17-JOB-ASYNC-ARCHITECTURE.md) assumes jobs complete under 120 seconds. Masterclasses of 40–52 minutes produce video files of 1.5–3.0 GB.
  - Chunked Google Drive uploads, worker memory limits, and long-running job retry parameters remain an **Open Decision** for infrastructure engineering.

---

## 7. Traceability to Existing Contracts & Architecture

| Requirement / Component | Existing Architecture Spec / Contract | Codebase Implementation | Governance State |
| :--- | :--- | :--- | :--- |
| **Two-Tier Taxonomy** | [25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](../../architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md) | `database/firestore/repositories/topic.repository.ts`, `subtopic.repository.ts` | **Approved & Verified** |
| **Canonical 15 Steps** | [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md) | [`shared/constants/workflow.ts`](../../../shared/constants/workflow.ts), `backend/domain/workflow/transition-matrix.ts` | **Approved & Verified** |
| **GAR-02 Anti-Self-Approval** | [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md), `FC-002` | [`backend/domain/workflow/transition-matrix.ts`](../../../backend/domain/workflow/transition-matrix.ts) | **Approved & Verified** |
| **Strict 4-Option MCQ Schema** | `FC-005`, ADR-009 | [`backend/server/validation/request-schemas.ts`](../../../backend/server/validation/request-schemas.ts#L69-L80) | **Approved & Verified** |
| **Mode Configuration Validation** | ADR-010, `S8-T05` | [`shared/types/production-context.ts`](../../../shared/types/production-context.ts) | **Approved & Verified** |
| **Stage 01 Mode Selector** | ADR-011 | [`frontend/features/question-generation/components/ProductionModeModal.tsx`](../../../frontend/features/question-generation/components/ProductionModeModal.tsx) | **Approved & Verified** |
| **Teleprompter Pacing ($\le 58\text{s}$)** | [14-MEDIA-ARCHITECTURE.md](../../architecture/14-MEDIA-ARCHITECTURE.md) | [`backend/ai/prompts/teleprompter-script.prompt.ts`](../../../backend/ai/prompts/teleprompter-script.prompt.ts) | **Approved & Verified** |
| **16:9 Landscape Expansion** | ADR-010 | [`shared/types/production-context.ts`](../../../shared/types/production-context.ts) | **Approved (Contract); Open (Worker)** |
| **Mode 1 Batch Series Dispatch** | ADR-010 | [`shared/contracts/planning.ts`](../../../shared/contracts/planning.ts) | **Proposed—Approval Required** |
| **Async Transcode Timeout Scaling** | ADR-010, [17-JOB-ASYNC-ARCHITECTURE.md](../../architecture/17-JOB-ASYNC-ARCHITECTURE.md) | `backend/infrastructure/queue/*` | **Approved (Contract); Open (Worker)** |

---

## 8. Acceptance Criteria Traceability

| Acceptance Criterion | Specification Section | Implementation Summary | Status |
| :--- | :--- | :--- | :---: |
| **Mode 1: Question Challenge Short Contract** | Section 2.1, 3.1, 4, 5.2 | Established single-short ($N=1$, $\le 58\text{s}$, 9:16) with question, answer, explanation, script, and handoff. Batch series ($5, 10, 15, 20$) recorded as proposed series (*OD-02*). | **COMPLIANT** |
| **Mode 2: Topic Introduction Contract** | Section 2.2, 3.2, 4, 5.3 | Defined conceptual brief, script, syllabus context, and downstream handoff. Enforces zero questions ($N=0$); no question count required or permitted. | **COMPLIANT** |
| **Mode 3: Explained Questions Video Contract** | Section 2.3, 3.3, 4, 5.4 | Established masterclass contract with intro segment + configurable practice set ($N \in \{5, 10, 15, 20\}$) in 16:9 landscape format with answer keys, proofs, traps, and tricks. | **COMPLIANT** |
| **Mode-to-Field / Validation Matrix** | Section 4 | Categorized all 23 inputs, outputs, entity fields, and gates into Shared, Required only by particular modes, Optional/conditional, and Mode-specific validation. | **COMPLIANT** |
| **Unambiguous Question-Count Applicability** | Section 4, 5.1–5.4 | Explicitly defined question count rules across all modes. Mode 1 defaults to 1 (batch series for $>1$); Mode 2 has $N=0$ strictly non-required; Mode 3 requires $5, 10, 15, 20$ (additive $1+N$). | **COMPLIANT** |
| **Decision Classification Without Guessing** | Section 1.3, 6 | Formally classified all decisions into Approved, Verified Existing Behavior, Open Decision, and Proposed—Approval Required. Zero unapproved requirements converted to approved. | **COMPLIANT** |
| **Unresolved Questions Explicitly Recorded** | Section 6 (OD-01 to OD-07) | Recorded batch dispatch runner, downstream 16:9 worker compatibility, multi-question video assembly, and long-running async timeouts as explicit Open Decisions. | **COMPLIANT** |
| **Canonical 15-Stage Workflow Preservation** | Section 1.2, 3.1–3.3, 7 | All 15 stages preserved sequentially across all modes; zero skipped stages; GAR-02 anti-self-approval enforced at every review gate. | **COMPLIANT** |
| **Strict Documentation-Only Scope** | Entire Document | Zero modifications to production code, schemas, routes, or database configurations. | **COMPLIANT** |
