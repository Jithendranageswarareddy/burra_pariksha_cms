# S8-T03 — Content Mode Requirements & Specification Contract
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 08 — Task S8-T03: Requirements, Input/Output Contracts, and Field Validation Matrix for the Three Production Modes

```text
================================================================================
Document ID:       BP-S8-T03-CONTENT-MODES
Version:           1.0.0
Date:              2026-10-14
Status:            APPROVED / AUTHORITATIVE CONTRACT SPECIFICATION
Classification:    Content Engineering, Production Architecture & AI Contracts
Inspected Commit:  86dd984 (main)
Scope:             Three Production Modes (Question Challenge Short, Topic
                   Introduction, Explained Questions Video), Input/Output
                   Contracts, Shared/Specific Matrix, Validation, and Open Decisions
Upstream:          07-CANONICAL-15-STEP-WORKFLOW.md, 11-PAGE-ROUTE-CONTRACT.md,
                   14-MEDIA-ARCHITECTURE.md, S8-T01, S8-T02
Downstream:        S8-T04 (Quality Gate Decoupling), Stage 01 Mode Selector UI,
                   AI Orchestrator Multi-Mode Prompt Engines
================================================================================
```

---

## 1. Executive Summary & Purpose

The Burra Pariksha Content Management System (BP-CMS) was historically baseline-engineered around a single content model: a **single-question, short-form 9:16 vertical video (30–60 seconds)** designed for competitive examination micro-learning on YouTube Shorts and Instagram Reels.

To expand pedagogical reach, support comprehensive syllabus onboarding, and enable mid/long-form masterclasses, this contract establishes the authoritative architectural specification for **Three Production Modes**:

1. **Mode 1: Question Challenge Short** — Fast-paced, high-virality short-form challenge (9:16 portrait, $\le 60\text{s}$) where the host poses an aptitude problem, presents distractors, creates an engagement pause, and challenges viewers to comment their answers before time runs out.
2. **Mode 2: Topic Introduction** — Foundational concept-orientation video (no questions required) introducing a Topic/Subtopic, explaining what it is, why it matters in real life, what exam syllabus areas it covers, and roadmap context for upcoming problems.
3. **Mode 3: Explained Questions Video** — Comprehensive educational masterclass featuring an introductory concept orientation followed by sequential, in-depth question explanations, step-by-step proofs, and speed shortcuts, supporting configurable question counts of **5, 10, 15, and 20**.

This document defines the formal purpose, inputs, outputs, validation rules, handoff mechanics to the canonical 15-step production workflow, a mode-to-field matrix, question-count applicability rules, and an authoritative **Open Decisions** register.

---

## 2. Production Mode Definitions

### 2.1 Mode 1: Question Challenge Short
- **Mode Code**: `QUESTION_CHALLENGE_SHORT`
- **Primary Objective**: Audience engagement, algorithmic reach, comment-section interaction, and viral distribution on YouTube Shorts and Instagram Reels.
- **Narrative Structure**:
  1. *Hook (0–3s)*: High-energy challenge framing (e.g., "ఈ ప్రశ్నను 10 సెకన్లలో సాల్వ్ చేయగలరా?").
  2. *Problem Statement (3–18s)*: Rapid presentation of the question and 4 multiple-choice options with Telugu letters (ఎ, బి, సి, డి).
  3. *Comment Challenge & Pause (18–25s)*: Visual on-screen countdown timer (3s or 5s) with a direct call to action: "వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి!"
  4. *Quick Reveal & Trick (25–50s)*: Correct option reveal and immediate "Burra Trick" (బుర్ర ట్రిక్) mental-math shortcut.
  5. *CTA & Follow (50–58s)*: Interactive prompt: "సరైన ఆన్సర్ పిన్ కామెంట్‌లో ఉంది! రేపటి ఛాలెంజ్ కోసం ఫాలో అవ్వండి."
- **Target Aspect Ratio**: Strictly **9:16 Vertical Portrait** ($1080 \times 1920\text{ px}$).
- **Target Duration**: Strictly **30–58 seconds** (Hard platform ceiling: $60\text{ seconds}$).

### 2.2 Mode 2: Topic Introduction
- **Mode Code**: `TOPIC_INTRODUCTION`
- **Primary Objective**: Curriculum orientation, conceptual grounding, anxiety reduction, and syllabus mapping for competitive exam aspirants (APPSC, TSPSC, SSC, Banking).
- **Narrative Structure**:
  1. *Curiosity Anchor (0–5s)*: Real-world hook or historical puzzle highlighting why this concept exists (e.g., "రైలు వేగం, టైమ్ అండ్ డిస్టెన్స్ కాన్సెప్ట్ లేకుండా ఎగ్జామ్ పేపర్ ఎందుకు ఉండదు?").
  2. *Concept Demystification (5–25s)*: Clear, non-technical explanation of the core concept in conversational, accessible Telugu.
  3. *Syllabus Scope & Weightage (25–45s)*: Breakdown of which subtopics are included, typical marks weightage, and competitive exam question patterns.
  4. *Core Formulas & Intuition (45–80s)*: The fundamental guiding principle or master formula explained conceptually without rote memorization.
  5. *Learning Roadmap CTA (80–90s)*: Call to action inviting students to watch the upcoming Explained Questions and take the daily Question Challenges.
- **Target Aspect Ratio**: **9:16 Vertical** ($1080 \times 1920$) for short overviews, or **16:9 Landscape** ($1920 \times 1080$) for comprehensive topic masterclasses.
- **Target Duration**: **60–180 seconds** (1 to 3 minutes).
- **Question Requirement**: **0 Questions Required**. Does not require multiple-choice options, correct answer keys, or distractors.

### 2.3 Mode 3: Explained Questions Video
- **Mode Code**: `EXPLAINED_QUESTIONS_VIDEO`
- **Primary Objective**: In-depth mastery, pedagogical rigor, step-by-step problem-solving competency, and exam preparation.
- **Narrative Structure**:
  1. *Introductory Segment (0:00–1:30)*: Topic context, learning objectives, exam level, and structure of the masterclass.
  2. *Question 1 through $N$ ($N \in \{5, 10, 15, 20\}$)*:
     - Question presentation on screen with graphic visualizer.
     - 4 multiple-choice options with key terms in Telugu and English.
     - Step-by-step mathematical proof / logical derivation.
     - Common pitfalls & exam traps ("విద్యార్థులు చేసే సాధారణ తప్పు").
     - Burra Speed Trick ("ఎగ్జామ్ హాల్‌లో 10 సెకన్లలో చేసే పద్ధతి").
  3. *Summary & Outro*: Key takeaway recap, downloadable PDF/study guide link, and comment prompt for homework question.
- **Target Aspect Ratio**: Strictly **16:9 Landscape** ($1920 \times 1080\text{ px}$) for YouTube standard video, with optional 9:16 multi-part carousel export.
- **Target Duration**: **8–35 minutes** (proportional to question count: ~2 to 2.5 minutes per explained question plus 2-minute intro/outro).

---

## 3. Explicit Mode Contracts

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRODUCTION MODE CONTRACT SPECIFICATION                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Mode Contract: Question Challenge Short

#### Purpose
Generate a single-question, high-tension short-form challenge video script and production package designed to provoke viewer comments on YouTube Shorts and Instagram Reels.

#### Required Inputs
- `topicId`: Valid root topic identifier (`top_<uuid>` or legacy `TOP-*`)
- `subtopicId`: Valid child subtopic identifier (`sub_<uuid>` or legacy `SUB-*`)
- `language`: `TELUGU`, `ENGLISH`, or `BILINGUAL`
- `difficulty`: `EASY`, `MEDIUM`, or `HARD`
- `challengeType`: Multiple-choice challenge style (`ABCD`, `ODD_ONE_OUT`, `TRUE_FALSE`, `YES_NO`)

#### Optional Inputs
- `questionCount`: Defaults to `1`. If batch mode selected, allows `5`, `10`, `15`, `20` (Generates a batch of distinct 1-question Short scripts; see Open Decision 02).
- `realWorldContext`: Real-life framing theme (e.g., "Telangana Culture", "Household Science").
- `customInstructions`: Ad-hoc editorial directives.
- `countdownDurationSeconds`: On-screen timer duration (`3` or `5` seconds; default: `5`).
- `hookStyle`: Initial hook style (`CURIOSITY`, `SPEED_CHALLENGE`, `BRAIN_CHALLENGE`).

#### Generated Outputs
1. `QuestionCandidate`: Validated question text, 4 distinct options (A, B, C, D), correct answer index, detailed explanation.
2. `SpokenTeleprompterScriptPayload`: 5-part script (Hook $\to$ Problem $\to$ Pause/Countdown $\to$ Solution $\to$ CTA).
3. `SocialMetadataPayload`: Shorts-optimized title ($\le 95\text{ chars}$), hashtags, and pinned comment engagement prompt.
4. `TimerOverlaySpec`: Timestamp markers for when the video editor must overlay the countdown graphic and audio ticking SFX.

#### Minimum Validation
- Question statement must not reveal the correct answer option or value in the Hook or Problem sections (zero answer leakage).
- Exactly 4 options must be present with non-empty text.
- Mathematical proof must deterministically evaluate to the marked correct option.
- Total spoken script word count must strictly map to $\le 58\text{ seconds}$ at 140 WPM ($\le 135\text{ words}$).
- Teleprompter script must contain an explicit `PAUSE_CHALLENGE` segment and comment-invitation prompt.

#### Completion Criteria
- Candidate question saved to Firestore `question_drafts` (Stage 01).
- 10-point pedagogical audit passed and approved by QA reviewer (Stage 02).
- Script locked with pacing $\le 58\text{s}$ (Stage 03).
- Master cut verified with 9:16 safe-zones and countdown timer overlay in Stage 07 Final QC.

#### Handoff to Canonical 15-Step Workflow
- **Entry**: Step 01 (`QuestionStudioPage` `/studio`).
- **Sequential Flow**: Step 01 $\to$ Step 02 $\to$ Step 03 $\to$ Step 04 $\to$ Step 05 $\to$ Step 06 $\to$ Step 07 $\to$ Step 08 $\to$ Step 09 $\to$ Step 10 $\to$ Step 11 $\to$ Step 12 $\to$ Step 13 $\to$ Step 14 $\to$ Step 15.

---

### 3.2 Mode Contract: Topic Introduction

#### Purpose
Produce an educational curriculum orientation video that introduces and demystifies a Topic / Subtopic, explains its real-world relevance, details its competitive examination scope, and previews upcoming problem-solving modules without solving specific practice questions.

#### Required Inputs
- `topicId`: Valid root topic identifier
- `subtopicId`: Valid child subtopic identifier
- `language`: `TELUGU`, `ENGLISH`, or `BILINGUAL`
- `targetExamCategory`: Target exam board (`APPSC`, `TSPSC`, `SSC_CGL`, `BANKING`, `GENERAL`)

#### Optional Inputs
- `realWorldContext`: Real-life phenomenon or historical application.
- `keyFormulasOrTheorems`: String array of key principles to mention in the intro.
- `targetDurationSeconds`: Duration target in seconds (`60` to `180`; default: `90`).
- `aspectRatio`: `9:16` (Short) or `16:9` (Standard Landscape; default: `16:9`).
- `customInstructions`: Ad-hoc presenter tone guidance.

#### Generated Outputs
1. `TopicIntroductionBrief`: Conceptual brief detailing syllabus scope, weightage analysis, and core learning goals.
2. `ConceptScriptPayload`: 5-part explanatory script (Why It Matters $\to$ Concept Definition $\to$ Syllabus Scope & Weightage $\to$ Core Intuition $\to$ Roadmap CTA).
3. `VisualAssetPrompts`: Suggestions for graphic charts, diagrams, or title cards to be rendered on screen.
4. `SocialMetadataPayload`: Video title, educational description, syllabus tags, and pinned comment preview.

#### Minimum Validation
- `topicId` and `subtopicId` must be valid active taxonomy records in Firestore.
- **Question count validation is strictly bypassed**: 0 questions required.
- Script must contain both conceptual definition and exam weightage sections.
- Spoken Telugu narration must be free of archaic textbook grammar while maintaining academic accuracy.

#### Completion Criteria
- Concept Brief and Script reviewed and certified for pedagogical accuracy.
- Video master cut assembled with concept visualizers and title cards.
- Master QC certified for audio loudness (-14 LUFS) and legibility.

#### Handoff to Canonical 15-Step Workflow
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `TOPIC_INTRODUCTION`).
- **Workflow Adaptation**:
  - Step 01 creates a `ConceptBrief` rather than a `QuestionDraft`.
  - **Step 02 Adaptation**: Bypasses question mathematical proof check; executes **Concept Accuracy Verification** (SME signs off on conceptual correctness and syllabus alignment).
  - Step 03 locks the explanatory script $\to$ proceeds through standard Steps 04–15.

---

### 3.3 Mode Contract: Explained Questions Video

#### Purpose
Produce an in-depth, long-form educational masterclass that begins with an introductory concept orientation and proceeds through a structured sequence of 5, 10, 15, or 20 explained practice questions with step-by-step proofs, common mistake analyses, and speed shortcuts.

#### Required Inputs
- `topicId`: Valid root topic identifier
- `subtopicId`: Valid child subtopic identifier
- `language`: `TELUGU`, `ENGLISH`, or `BILINGUAL`
- `questionCount`: Mandatory selection of exactly `5`, `10`, `15`, or `20`
- `difficultyDistribution`: Single level (`EASY`, `MEDIUM`, `HARD`) or `PROGRESSIVE` (starts Easy, progresses to Hard)

#### Optional Inputs
- `introStyle`: Style for the introductory segment (`CONCEPT_OVERVIEW`, `EXAM_STRATEGY`, `HISTORICAL_PUZZLE`).
- `includeBurraSpeedTricks`: Boolean (whether every question includes a speed shortcut; default: `true`).
- `realWorldContext`: Real-world theme unifying the question set.
- `customInstructions`: Specific question drafting criteria.
- `aspectRatio`: Defaults to `16:9` Landscape ($1920 \times 1080$).

#### Generated Outputs
1. `IntroductorySegmentPayload`: 60–90 second spoken intro explaining topic strategy and question roadmap.
2. `ExplainedQuestionSetPayload`: Array of exactly $N$ validated questions ($N \in \{5, 10, 15, 20\}$), each containing:
   - Question text & 4 options
   - Correct answer key
   - Detailed step-by-step mathematical derivation
   - Exam trap / common misconception note
   - Burra speed shortcut (5–10s method)
3. `MasterTeleprompterScriptPayload`: Unified sequential teleprompter script linking the Intro Segment $\to$ Questions 1 to $N$ $\to$ Outro Recap.
4. `ChapterTimestampsSpec`: YouTube chapter marker list (e.g., `00:00 Intro`, `01:30 Q1 - Basic Formula`, `03:45 Q2 - Trick Method`, etc.).
5. `VideoProductionPackage`: Long-form production metadata linking all $N$ question stubs to a single master video project.

#### Minimum Validation
- The number of generated question candidates must strictly match the selected `questionCount` ($N \in \{5, 10, 15, 20\}$).
- Every single question in the set must independently pass the 4-option validation and mathematical proof evaluation.
- The introductory segment must be non-empty and must precede Question 1.
- No duplicate or highly similar questions within the generated set (similarity threshold $< 0.85$ via `QuestionSimilarityMatch`).
- Total estimated duration must align with the format budget (~2 to 3 minutes per question + 2 minutes intro/outro).

#### Completion Criteria
- All $N$ questions verified and certified in Step 02.
- Intro segment and master teleprompter script locked in Step 03.
- Studio recording session logged with golden takes for all $N$ questions in Step 04.
- Master timeline cut assembled with on-screen question graphics, chapter markers, and subtitles in Step 06.
- Master QC certified for 16:9 compliance, chapter sync, and audio loudness in Step 07.

#### Handoff to Canonical 15-Step Workflow
- **Entry**: Step 01 (`QuestionStudioPage` `/studio` with Mode Selector set to `EXPLAINED_QUESTIONS_VIDEO`).
- **Workflow Adaptation**:
  - Step 01 initiates a **Batch Question Generation** operation linked to a single `ContentPlan` / `ContentBatch`.
  - Step 02 presents a **Batch Verification Queue** where the SME verifies all $N$ questions.
  - Step 03 produces a unified long-form script.
  - Subsequent stages (04 through 15) manage the master video asset as an aggregate container referencing all $N$ question IDs.

---

## 4. Mode-to-Field / Validation Matrix

The following matrix categorizes all inputs, entity fields, and validation gates across the three production modes, distinguishing universal shared taxonomy fields from mode-specific requirements:

| Field / Attribute Name | Technical Type & Source | Question Challenge Short (Mode 1) | Topic Introduction (Mode 2) | Explained Questions Video (Mode 3) | Reusable Code Artifact / Contract Reference |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `topicId` | `string` (`top_<uuid>` / `TOP-*`) | **REQUIRED** | **REQUIRED** | **REQUIRED** | [shared/types/question.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/types/question.ts), `QuestionInputBaseSchema` |
| `subtopicId` | `string` (`sub_<uuid>` / `SUB-*`) | **REQUIRED** | **REQUIRED** | **REQUIRED** | [shared/types/question.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/types/question.ts), `QuestionInputBaseSchema` |
| `language` | `QuestionLanguage` enum | **REQUIRED** | **REQUIRED** | **REQUIRED** | [shared/constants/enums.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/enums.ts#L231), `LANGUAGES` |
| `difficulty` | `DifficultyLevel` enum | **REQUIRED** | **NOT APPLICABLE** | **REQUIRED** *(or Progressive)* | [shared/constants/enums.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/enums.ts#L217), `DIFFICULTY_LEVELS` |
| `questionCount` | `number` (`1, 5, 10, 15, 20`) | Optional / Default: 1 *(Batch: 5, 10, 15, 20)* | **NOT PERMITTED** *(0 required)* | **REQUIRED** (`5, 10, 15, 20`) | [shared/contracts/planning.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/contracts/planning.ts#L35), `targetQuestionCount` |
| `realWorldContext` | `string` (Context string) | Optional | Optional | Optional | [shared/constants/enums.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/enums.ts#L253), `REAL_LIFE_CONTEXTS` |
| `questionStyle` | `QuestionStyle` enum / `string` | Optional | **NOT APPLICABLE** | Optional | [shared/constants/enums.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/enums.ts), `QuestionConfigEntryZodSchema` |
| `challengeType` | `string` (`ABCD`, `ODD_ONE_OUT`)| **REQUIRED** | **NOT APPLICABLE** | Optional *(default: `ABCD`)* | [shared/constants/enums.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/enums.ts#L237), `CHALLENGE_TYPES` |
| `questionText` | `string` ($\ge 5\text{ chars}$) | **REQUIRED** | **NOT APPLICABLE** | **REQUIRED** *(Array of $N$)* | [backend/server/validation/request-schemas.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/validation/request-schemas.ts#L67) |
| `options` (A, B, C, D)| `Record<'a'|'b'|'c'|'d', string>` | **REQUIRED** (4 options) | **NOT APPLICABLE** | **REQUIRED** (4 options each) | [backend/server/validation/request-schemas.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/validation/request-schemas.ts#L69-L74) |
| `correctAnswer` | `'A' | 'B' | 'C' | 'D'` | **REQUIRED** | **NOT APPLICABLE** | **REQUIRED** (per question) | [backend/server/validation/request-schemas.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/validation/request-schemas.ts#L79) |
| `explanation` / Proof | `string` ($\ge 5\text{ chars}$) | **REQUIRED** | **NOT APPLICABLE** | **REQUIRED** (per question) | [backend/server/validation/request-schemas.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/validation/request-schemas.ts#L80) |
| `introductoryConcept` | `string` | **NOT APPLICABLE** | **REQUIRED** | **REQUIRED** | New field for Modes 2 & 3 |
| `syllabusScopeNotes` | `string` | **NOT APPLICABLE** | **REQUIRED** | Optional | New field for Mode 2 |
| `countdownTimerMs` | `number` (`3000` or `5000`) | **REQUIRED** *(default: 5000)*| **NOT APPLICABLE** | Optional | [shared/types/content.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/types/content.ts#L1405), `pauseDurationSeconds` |
| `commentPromptText` | `string` | **REQUIRED** | Optional | Optional | [shared/types/content.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/types/content.ts#L1346), `commentChallengePrompt` |
| `burraSpeedTrick` | `string` | Optional | **NOT APPLICABLE** | **REQUIRED** *(if selected)* | [backend/ai/prompts/script-generation.prompt.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/ai/prompts/script-generation.prompt.ts#L28) |
| `chapterTimestamps` | `Array<{ time: string; title: string }>` | **NOT APPLICABLE** | **NOT APPLICABLE** | **REQUIRED** | New field for Mode 3 |
| `aspectRatio` | `'9:16' | '16:9'` | Strictly `'9:16'` | `'9:16'` or `'16:9'` | Strictly `'16:9'` | [docs/architecture/14-MEDIA-ARCHITECTURE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/14-MEDIA-ARCHITECTURE.md#L132) |
| `targetMaxDuration` | `number` (seconds) | $\le 58\text{ seconds}$ | $60\text{ to }180\text{ seconds}$ | $8\text{ to }35\text{ minutes}$ | [backend/ai/prompts/teleprompter-script.prompt.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/ai/prompts/teleprompter-script.prompt.ts) |

---

## 5. Question-Count Applicability & Analysis

### 5.1 Mode 1 (Question Challenge Short)
- **Single-Video Reality**: By platform constraint (YouTube Shorts $\le 60\text{s}$, Instagram Reels $\le 90\text{s}$), a high-retention question challenge video with hook (3s), problem statement (15s), pause/countdown (5s), solution explanation (20s), trick (10s), and comment CTA (5s) requires **between 45 and 58 seconds**.
- **Question Count Applicability**:
  - A single Short video naturally contains **exactly 1 question**.
  - Where question counts of `5`, `10`, `15`, and `20` are specified:
    - **Contract Interpretation**: Applies as a **Batch Generation Configuration**. The creator selects Topic + Subtopic and `questionCount = 10`; the system generates a batch of 10 distinct, self-contained `Question Challenge Short` videos (e.g., a "10-Day Speed Math Challenge Sprint").
    - **Alternative (Rapid-Fire Short)**: A single 60s video with 5 ultra-rapid 8-second flash questions (no explanations). *Evaluated in Open Decision 02.*

### 5.2 Mode 2 (Topic Introduction)
- **Zero Question Count**: Topic Introduction is strictly an orienting overview.
- **Contract Enforcement**: No `questionCount` parameter is accepted or required in the generation schema. Attempting to pass `questionCount` returns a validation error or ignores the field.

### 5.3 Mode 3 (Explained Questions Video)
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
  - **Authoritative Contract Ruling**: The configuration $N \in \{5, 10, 15, 20\}$ **EXCLUDES the introductory segment**. A 10-question video consists of 1 Introduction + 10 Explained Questions. *Documented formally in Open Decision 01.*

---

## 6. Open Decisions Register

The following register formally records all unresolved, ambiguous, or architecture-expanding requirements identified during the forensic audit of the three production modes:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OPEN ARCHITECTURAL DECISIONS REGISTER                                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### OD-01: Inclusion vs. Exclusion of Intro Segment in Mode 3 Question Count
- **Question**: When a creator configures an Explained Questions Video for `5`, `10`, `15`, or `20` questions, does this count include or exclude the introductory segment?
- **Context**: In YouTube video packaging, titles like *"Top 10 Percentage Questions for TSPSC"* establish a strict expectation of 10 solved questions. If Question 1 is sacrificed for the introduction, students perceive the video as short-changed (only 9 questions).
- **Architectural Impact**: Affects array lengths in `ExplainedQuestionSetPayload`, loop counts in prompt orchestrators, chapter indexing ($Q_1 \dots Q_N$ vs $Q_1 \dots Q_{N-1}$), and duration budget calculations.
- **Options Evaluated**:
  - *Option A (Recommended)*: **Exclusionary / Additive ($1 + N$)**. The count $N$ specifies exactly how many distinct questions are generated, solved, and explained. The introductory concept segment is an additive prerequisite ($1\text{ Intro} + N\text{ Questions}$).
  - *Option B*: **Inclusive ($N$ total items)**. The count represents total video chapters, yielding 1 Intro + $(N - 1)$ questions.
- **Decision Needed**: Formal approval of Option A as the authoritative contract standard.

---

### OD-02: Mode 1 Question Counts (Batch Generation vs. Rapid-Fire Video)
- **Question**: How should configurable question counts of `5`, `10`, `15`, and `20` be realized for Mode 1 (Question Challenge Short) given the platform constraint of $\le 60\text{ seconds}$?
- **Context**: A standard single short cannot comfortably fit more than 1 question with pause and explanation within 60 seconds. A 5-question short would allow only 12 seconds per question, making spoken Telugu narration, options reading, a 3s pause, and a trick impossible. Fitting 10, 15, or 20 questions into a 60-second video is physically impossible.
- **Architectural Impact**: Determines whether Mode 1 triggers a single-video generation pipeline or dispatches a `ContentBatch` containing $N$ individual Short video stubs.
- **Options Evaluated**:
  - *Option A (Recommended)*: **Batch Creation Mode**. Selecting 5, 10, 15, or 20 in Mode 1 creates a *Batch / Series* of $N$ separate, stand-alone Short videos (e.g., "10 Daily Math Challenges"). Each video is a 1-question Short progressing independently through the 15-step pipeline.
  - *Option B*: **Rapid-Fire Carousel**. A multi-slide or multi-question single video without explanations, where the answers are only posted in the pinned comment. (Permissible up to 5 questions; impossible for 10, 15, 20).
- **Decision Needed**: Formal confirmation that $N \in \{5, 10, 15, 20\}$ in Mode 1 represents a **Batch of $N$ Individual Shorts**.

---

### OD-03: Stage 02 (Question Verification) Behavior for Mode 2 (Topic Introduction)
- **Question**: Since Mode 2 (Topic Introduction) generates zero questions, how does it progress through Step 02 (Question Verification) in the canonical 15-step workflow?
- **Context**: Canonical Step 02 is defined in `07-CANONICAL-15-STEP-WORKFLOW.md` as "10-point pedagogical audit, proof verification, editorial sign-off, and production queueing" with rule `GAR-02`. If there is no question or proof, the standard 10-point audit cannot pass.
- **Architectural Impact**: Affects state machine transition `T01-02` $\to$ `T02-03` in `transition-matrix.ts`, capability checks, and UI rendering on `QuestionVerifyApprovePage.tsx`.
- **Options Evaluated**:
  - *Option A (Recommended)*: **Polymorphic Step 02 (Concept Accuracy Verification)**. Step 02 remains an immutable gate (preserving the 15 steps), but dynamically displays a **5-Point Concept Audit Checklist** (Syllabus accuracy, definition clarity, exam relevance, Telugu orthography, roadmap completeness) instead of mathematical proof steps. GAR-02 anti-self-approval remains enforced.
  - *Option B*: **Bypass Step 02 directly to Step 03**. Transitions directly $01 \to 03$. Breaks the invariant that stages cannot be skipped.
- **Decision Needed**: Formal approval of Option A to uphold canonical 15-step compliance.

---

### OD-04: Video Aspect Ratio & Primary Distribution Channel per Mode
- **Question**: Does BP-CMS permit 16:9 landscape video assets in production, and how are aspect ratios governed across the three modes?
- **Context**: `docs/architecture/14-MEDIA-ARCHITECTURE.md` (Lines 132–134) states: *"Final master cuts strictly require video/mp4... pixel dimensions must be $1080 \times 1920$ (vertical 9:16)."* However, an Explained Questions Video (Mode 3) running 15–30 minutes is designed for desktop/tablet landscape viewing on YouTube standard, where 9:16 is inappropriate.
- **Architectural Impact**: Affects safe-zone checking in Step 07 Final QC, mobile simulator in Step 09 Social Review, and YouTube upload API parameters in Step 11.
- **Options Evaluated**:
  - *Option A (Recommended)*: **Mode-Governed Aspect Ratio Contract**:
    - Mode 1: Strictly **9:16 Vertical Portrait** ($1080 \times 1920$).
    - Mode 2: **Configurable** (`9:16` for Shorts overview or `16:9` for standard video).
    - Mode 3: Strictly **16:9 Landscape** ($1920 \times 1080$) for main video, with optional 9:16 highlight teaser.
  - *Option B*: Force 9:16 on all modes. (Degrades viewer experience for 20-question masterclasses).
- **Decision Needed**: Approve updating the media contract to support 16:9 for Modes 2 & 3.

---

### OD-05: Datastore Aggregate Root for Mode 2 & Mode 3 Multi-Entity Projects
- **Question**: Should Mode 2 (Topic Intro) and Mode 3 (Explained Questions) store their payloads directly in `questions` / `videos`, or introduce a unified aggregate root container?
- **Context**: In Mode 3, there are $N$ questions linked to 1 video project. In Mode 2, there is 1 video project with 0 questions. Currently, Firestore `videos` collection expects `video.questionId` as a 1:1 scalar string.
- **Architectural Impact**: Affects Firestore `videos` collection schema (`questionId: string` vs `questionIds: string[]`), `ContentMaster` linking, and foreign key relations.
- **Options Evaluated**:
  - *Option A (Recommended)*: **Utilize `ContentMaster` Aggregate Root & `video.questionIds` Array**:
    - Mode 1: 1 `ContentMaster` $\to$ 1 `Question` $\to$ 1 `Video`.
    - Mode 2: 1 `ContentMaster` $\to$ 0 `Questions` $\to$ 1 `ConceptBrief` $\to$ 1 `Video`.
    - Mode 3: 1 `ContentMaster` $\to$ $N$ `Questions` $\to$ 1 `MasterScript` $\to$ 1 `Video` (with `questionIds: string[]`).
  - *Option B*: Introduce new root collections `topic_introductions` and `explained_videos`.
- **Decision Needed**: Formal approval to utilize `ContentMaster` with an array-compatible `questionIds` on `Video`.

---

## 7. Traceability to Existing Contracts & Architecture

| Requirement / Component | Existing Architecture Spec / Contract | Codebase Implementation |
| :--- | :--- | :--- |
| **Two-Tier Taxonomy** | [25-TWO-TIER-TAXONOMY-ARCHITECTURE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md) | `database/firestore/repositories/topic.repository.ts`, `subtopic.repository.ts` |
| **Canonical 15 Steps** | [07-CANONICAL-15-STEP-WORKFLOW.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md) | [shared/constants/workflow.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/constants/workflow.ts#L225), `transition-matrix.ts` |
| **GAR-02 Anti-Self-Approval** | [09-RBAC-CAPABILITY-MODEL.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/09-RBAC-CAPABILITY-MODEL.md), `FC-002` | [backend/domain/workflow/transition-matrix.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/domain/workflow/transition-matrix.ts#L55) |
| **Question Options & Proof** | [FC-005-WORKFLOW-STATE-ENGINE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/features/FC-005-WORKFLOW-STATE-ENGINE.md) | [backend/server/validation/request-schemas.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/server/validation/request-schemas.ts#L69-L80) |
| **Teleprompter Scripting** | `Phase 8D Teleprompter Scripting` | [backend/ai/prompts/teleprompter-script.prompt.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/backend/ai/prompts/teleprompter-script.prompt.ts) |
| **Batch Target Counts** | `Phase 9 Content Planning` | [shared/contracts/planning.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/contracts/planning.ts#L35), [PlanningPage.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/pages/PlanningPage.tsx#L100) |
| **Short-Form 9:16 Video** | [14-MEDIA-ARCHITECTURE.md](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/docs/architecture/14-MEDIA-ARCHITECTURE.md#L132-L134) | [FinalReviewWorkspace.tsx](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/frontend/components/video/FinalReviewWorkspace.tsx#L46-L56) |
| **Comment Engagement CTA** | `Phase 8C Social CTAs` | [shared/types/content.ts](file:///c:/Users/jithendra/OneDrive/Desktop/burra_pariksha_cms/shared/types/content.ts#L1343-L1348), `SocialCTA` |

---

## 8. Acceptance Checklist & Verification

- [x] **Requirement 1**: Defined requirements for Mode 1 (Question Challenge Short) with comment-invitation mechanics and configurable counts (5, 10, 15, 20).
- [x] **Requirement 2**: Defined requirements for Mode 2 (Topic Introduction) explaining Topic/Subtopic with 0 questions required.
- [x] **Requirement 3**: Defined requirements for Mode 3 (Explained Questions Video) with intro segment followed by questions, answers, and explanations, supporting question counts 5, 10, 15, 20.
- [x] **Requirement 4**: Produced explicit contracts for each mode (Purpose, Required inputs, Optional inputs, Generated outputs, Minimum validation, Completion criteria, Handoff).
- [x] **Requirement 5**: Built comprehensive Mode-to-Field / Validation matrix distinguishing shared from mode-specific fields.
- [x] **Requirement 6**: Reusable fields, types, and validation rules identified from existing contracts and code.
- [x] **Requirement 7**: Recorded unsupported or ambiguous requirements in numbered Open Decisions register (OD-01 through OD-05) with question, context, impact, options, and decisions needed.
- [x] **Requirement 8**: Reconciled tracked files inventory in `S7-T01-REPOSITORY-FORENSIC-INVENTORY.md` (712 files).
- [x] **Requirement 9**: Validated quality gates (`npm run test:architecture`, `npm run lint`, `npm run build`).
