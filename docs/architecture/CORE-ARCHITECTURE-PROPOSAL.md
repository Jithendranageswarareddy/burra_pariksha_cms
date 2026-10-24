# BURRA PARIKSHA CMS — CORE ARCHITECTURE PROPOSAL & REQUIREMENTS RECONCILIATION

**Document Path:** `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md`
**SDLC Stage:** Core Architecture Phase & Primary Scope Reconciliation
**Primary Scope Document:** [`docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md`](../BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md)
**Governance & Policy:** [`AGENTS.md`](../../AGENTS.md), [`04-ARCHITECTURE-PRINCIPLES.md`](04-ARCHITECTURE-PRINCIPLES.md), [`DECISION-LOG.md`](DECISION-LOG.md)
**Target Environments:** Local Development Workspace & Google AI Studio Applet Production Runtime

> **Current authority notice (2026-10-24):** This proposal is preserved as
> historical planning context. The evidence-backed current architecture, status
> reconciliation, and remaining-work plan are maintained in
> [`CORE-ARCHITECTURE-RECONCILIATION.md`](CORE-ARCHITECTURE-RECONCILIATION.md)
> and [`../sprints/CORE-REQUIREMENTS-ROADMAP.md`](../sprints/CORE-REQUIREMENTS-ROADMAP.md).

---

## 1. EXECUTIVE SUMMARY & GOVERNANCE OBJECTIVE

This document establishes the authoritative core technical architecture and development plan for the **Burra Pariksha Content Management System (BP-CMS)**. It reconciles the application's existing brownfield baseline with the primary product requirements codified in [`bp_cms_core_requirements1.md`](../BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md).

### Cardinal Principles:
1. **Primary Requirements Authority**: `bp_cms_core_requirements1.md` is the primary product scope. Its terminology, content modes, presentation formats, audience contexts, learning unit models, and editorial standards take precedence over speculative agent enhancements.
2. **Unified Local-to-Deployment Architecture (Principle 16 / ADR-014)**: The application maintains a single production-quality codebase that runs identically locally and when published through Google AI Studio.
3. **Preservation of Verified Baseline**: Existing Firestore authority, Two-Tier taxonomy (`Topic` $\to$ `Subtopic`), 15-stage workflow backbone, anti-self-approval rule (GAR-02), and datastore isolation guards are preserved with 100% backward compatibility.
4. **Controlled Backward-Compatible Evolution**: Stored data is never purged or rewritten. Technical differences (such as `EXPLAINED_QUESTIONS_VIDEO` serving as the legacy identifier for `WORKED_EXAMPLES`) are reconciled via strongly typed runtime adapters and aliases.

---

## 2. REQUIREMENT-BY-REQUIREMENT APPLICATION AUDIT MATRIX

The following audit evaluates the current BP-CMS implementation and test baseline against every section of [`bp_cms_core_requirements1.md`](../BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md).

| Req Ref | Requirement Summary | Status | Implementation Evidence | Gaps, Dependencies & Risks | Acceptance Criteria for Completion |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **REQ-01** | **Vision & Business Objective**<br>Help Telugu-speaking people think faster, calculate faster, solve practical problems, make smarter decisions. Practical math, language, everyday intelligence. | `PARTIAL` | Telugu generation prompts (`gemini.service.ts`), `LANGUAGES` in `enums.ts`, Topic taxonomies in `production-taxonomy.ts`. | Focus was historically restricted to competitive exam MCQs. Practical everyday math, logic, and decision scenarios lack dedicated prompt templates and metadata. | System provides templates and prompts specifically tailored to practical math, calculation shortcuts, and everyday decision problems. |
| **REQ-02** | **Three Canonical Content Modes**<br>1. `TOPIC_INTRODUCTION`<br>2. `WORKED_EXAMPLES`<br>3. `QUESTION_CHALLENGE_SHORT`<br>Sequence: Intro $\to$ Worked Examples $\to$ Challenge. | `PARTIAL` | `shared/registry/content-mode.registry.ts`, `TopicIntroWorkspace.tsx`, `ExplainedQuestionsWorkspace.tsx`, unit tests `s10-t16`, `s10-t17`. | Current codebase registers Mode 1 as `QUESTION_CHALLENGE_SHORT`, Mode 2 as `TOPIC_INTRODUCTION`, and Mode 3 as `EXPLAINED_QUESTIONS_VIDEO`. Missing `WORKED_EXAMPLES` canonical enum and preferred sequence enforcement. | Register `WORKED_EXAMPLES` as canonical Mode 2; support `EXPLAINED_QUESTIONS_VIDEO` as backward-compatible alias. Enforce sequential instructional progression in UI. |
| **REQ-03** | **Five Presentation Formats**<br>Orthogonal to content mode: Text-based, Video, Audio, Image, Animation. A lesson can be rendered across any format. | `MISSING` | Legacy `PRESENTATION_TYPES` in `enums.ts` (`TEXT_ONLY`, `IMAGE_BASED`) represented question stimulus types, not delivery formats. | Architecture currently assumes 100% Video delivery (9:16 Shorts or 16:9 Landscape). No schema fields, templates, or workflows exist for Audio, Image sequences, or Animation briefs. | Introduce `presentationFormat` enum (`TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION`) in schema contracts; provide template generators for non-video formats. |
| **REQ-04** | **Editorial Pillars & Usefulness**<br>Every item answers 5 usefulness questions. Initial Pillars A–F (Numerical, Logic, Everyday Money, Practical Understanding, Data/Decisions, Thinking Strategies). | `MISSING` | `TopicIntroWorkspace.tsx` captures "Concept" and "Why it matters", but does not structure them against the 5 questions or Pillars A–F. | Pillars A–F are absent from data contracts. Authors cannot categorize content by editorial pillar or tag the real-life decision/mistake addressed. | Add optional metadata fields for `editorialPillar` and `realLifeApplication` in planning contracts; validate that drafted lessons address a clear practical problem. |
| **REQ-05** | **Audience Context & Skill Level**<br>Independent dimensions: 7 Audience Contexts (Children, Students, Exam learners, Adults, Households, Shopkeepers, Seniors); 4 Skill Levels (Foundation, Beginner, Intermediate, Advanced). | `PARTIAL` | Difficulty exists in `enums.ts` (`EASY`, `MEDIUM`, `HARD`), but conflates age and complexity. | No schema fields or UI selectors exist for Audience Context. Skill levels do not match the canonical 4-tier foundation standard. | Implement `audienceContext` enum (7 values) and canonical `skillLevel` enum (4 values); wire into planning schemas and Question Studio. |
| **REQ-06** | **Central Asset: Verified Learning Unit**<br>Distinguish underlying lesson from publications produced from it. Contains objective, prerequisites, verified method, calculations, common mistakes. Multiple artifacts link to 1 Learning Unit. | `MISSING` | Currently, `question_drafts` and `questions` serve as isolated aggregate roots. No `learning_units` entity exists. | Publications are disconnected. Correcting an underlying mathematical method or calculation cannot automatically flag or update related publications. | Implement `learning_units` Firestore collection contract, repository, and linking foreign keys (`learningUnitId`) on drafts, questions, and videos. |
| **REQ-07** | **4-Layer Content-Planning Model**<br>Layer 1: Knowledge Reference; Layer 2: Learning Design; Layer 3: Content Artifact; Layer 4: Publication & Feedback. | `PARTIAL` | Layer 1 (Taxonomy: Topic/Subtopic) is implemented. Layer 3 (Artifacts: drafts, videos) is implemented. | Layer 2 (Learning Design: audience, skill level, misconceptions) and Layer 4 (Publication Feedback: production cost, time, artifact-level metrics) are unmodeled. | Reconcile data models to structure content across the 4 logical layers without imposing burdensome forms on the creator. |
| **REQ-08.1** | **Protect Production Foundation**<br>Preserve Firestore, Two-Tier taxonomy, workflow state machine, RBAC, audit, and datastore isolation. `EXPLAINED_QUESTIONS_VIDEO` compatibility. | `IMPLEMENTED` | `assertDatastoreSafe()`, `transition-matrix.ts`, `users.repository.ts`, `roles.ts`, test suites `s9-isolation-guard`, `strict-database-taxonomy`. | Stored data must never be rewritten. Aliases must maintain seamless read/write compatibility for existing documents. | 100% regression pass on existing datastore, authorization, and taxonomy tests. `EXPLAINED_QUESTIONS_VIDEO` loads seamlessly as `WORKED_EXAMPLES`. |
| **REQ-08.2** | **Practical Learning-Unit Planning**<br>Simple planning process defining what viewers learn, why it matters, real-life context, verified method, initial mode/format without huge forms. | `MISSING` | Studio currently jumps straight into Question MCQ generation or raw Topic Intro text editing. | No pre-production planning workspace exists to capture the core lesson before generating format-specific scripts or questions. | Implement lightweight Learning Unit Planning Studio allowing fast capture of learning objectives, verified methods, and target modes. |
| **REQ-08.3** | **Strengthen Content Verification**<br>Verify arithmetic, reasoning, solution completeness, Telugu clarity, question/script/visual consistency, duplicates, fact checks. AI is assistive only. | `PARTIAL` | `question-quality-validator.ts` enforces VAL-Q-01..05 (4 options, non-empty explanation, Telugu script presence). | Calculation correctness engine, reasoning proofs, and script-visual consistency checks are not yet automated; relies solely on human review. | Introduce calculation validation helpers and enhanced checklist gates in Stage 02 Verification enforcing mathematical proof and Telugu clarity. |
| **REQ-08.4** | **Connect Related Content**<br>Identify the Learning Unit behind an artifact, the intro, worked example, challenge, and alternate presentation formats. | `MISSING` | `audience-preview-projection.ts` projects a single draft into slots, but cross-artifact relationships do not exist. | Cannot query or display "all videos/shorts created from Learning Unit X". | Build relational query methods on `learning_units` resolving all child drafts, videos, and multi-format publications. |
| **REQ-08.5** | **Support Multi-Format Production**<br>Reusable templates for Text, Video, Audio, Image, Animation (scripts, narration, image instructions, scene outlines). | `MISSING` | Only video production contracts (`14-MEDIA-ARCHITECTURE.md`, `video_takes`, `ScriptGenerationPage.tsx`) exist. | Non-video templates do not exist. Audio scripts, visual image instructions, and animation briefs have no schemas or UI. | Add multi-format template schemas and generation options for Text posts, Audio podcasts, and Image breakdowns in Studio. |
| **REQ-08.6** | **Performance & Effort Tracking**<br>Track performance at artifact and platform level. Record audience outcomes (views, retention) alongside production effort (time, cost). | `PARTIAL` | Analytics dashboard (`AnalyticsPage.tsx`) displays mock platform view counts and completion rates. | Production time per artifact, cost per artifact, revision counts, and learning-unit reuse rates are not persisted or aggregated. | Add operational metrics schema (`productionTimeMinutes`, `productionCostInr`, `revisionCount`) to publication records and analytics views. |
| **REQ-09** | **Content Production Pipeline**<br>10-step lifecycle: Discover $\to$ Plan $\to$ Verify $\to$ Design $\to$ Generate $\to$ Review $\to$ Approve $\to$ Publish $\to$ Measure $\to$ Improve. | `PARTIAL` | Mapped partially onto technical 15-stage workflow (`07-CANONICAL-15-STEP-WORKFLOW.md`). | Planning and Discovery stages occur offline; CMS begins at Stage 01 (Generation) rather than Plan/Verify. | Formally map the 10-step content pipeline to Stages 01–15; introduce Stage 00/01 Learning Unit planning bridge. |
| **REQ-10** | **90-Day Implementation Roadmap**<br>Days 1–30: Foundation (Modes, Formats, Learning-Unit template, Calculations/Telugu checks, Percentages batch). | `PARTIAL` | Sprint 10 completed initial Mode 2 and Mode 3 draft workspaces; foundation requires learning units and format decoupling. | Immediate roadmap must directly mirror Days 1–30 requirements rather than generic technical refactoring. | Adopt Days 1–30 deliverables as the explicit scope for Sprints 11 and 12. |
| **REQ-11** | **Business Strategy (Trust & Revenue)**<br>Discovery, Retention, Repeat viewing, Trust, Phased Monetization (Ads $\to$ Sponsorships $\to$ Paid learning products). | `PARTIAL` | Architectural budget invariant (`₹0–₹100/mo`) prevents infrastructure burn. Trust upheld via GAR-02. | Monetization and product tiers are speculative; core focus must remain educational value and accuracy. | Preserve free-tier operational discipline; do not build premature payment systems until learning unit engagement is proven. |
| **REQ-12** | **Three Measurement Categories**<br>1. Audience growth (reach, retention, returners)<br>2. Learning engagement (participation, accuracy, requests)<br>3. Business/production (time, cost, consistency, reuse). | `PARTIAL` | View metrics modelled in `shared/types/content.ts` (`PlatformAnalyticsRecord`). | Engagement accuracy and production cost/time are completely uncollected. | Extend analytics contracts to ingest challenge response accuracy and production time per artifact. |
| **REQ-13** | **Long-Term Expansion Principles**<br>Order: Useful problems $\to$ Learning units $\to$ 3 modes $\to$ 5 formats $\to$ Publication $\to$ Measurement $\to$ Monetization. | `ALIGNED` | Current architectural governance strictly forbids premature microservices and overengineering. | Must ensure subsequent sprint planning adheres strictly to this construction sequence. | Formalize the construction sequence as an architectural invariant in `04-ARCHITECTURE-PRINCIPLES.md`. |

---

## 3. ARCHITECTURE RECONCILIATION & DECISION AUDIT

### 3.1 Architectural Decisions Supported by Evidence (Retained)
The following decisions in [`DECISION-LOG.md`](DECISION-LOG.md) are strongly validated by the requirements and empirical codebase evidence:
- **ADR-001**: Single 15-stage workflow engine (`src/lib/workflow/transition-matrix.ts`). Provides the transactional backbone for all content modes.
- **ADR-002 & ADR-013**: Server-enforced anti-self-approval (GAR-02) with audited System Administrator operational override. Protects educational content accuracy (REQ-08.3, REQ-11).
- **ADR-003**: AI Human Gating (AP-009). AI is advisory; humans must sign off on factual correctness and Telugu spoken clarity.
- **ADR-004 & ADR-007**: Google AI Studio Applet as production runtime and release authority.
- **ADR-008**: Two-Tier Taxonomy (`Topic` $\to$ `Subtopic`). Category remains permanently obsolete.
- **ADR-009**: 4-option MCQ schema invariant for challenge shorts; polymorphic concept verification for Mode 2 (Topic Introduction).
- **ADR-014**: Unified Local-to-Deployment Architecture (Principle 16). Single codebase running locally and in Google AI Studio.

### 3.2 Architectural Decisions Needing Revision (Formalized in ADR-015)
To satisfy `bp_cms_core_requirements1.md`, the following revisions are established:

1. **Content Mode Enumeration & Sequence Alignment**:
   - Realign the canonical mode sequence to match REQ-02:
     * Mode 1: `TOPIC_INTRODUCTION` ("Topic Introduction Video", $N=0$ questions)
     * Mode 2: `WORKED_EXAMPLES` ("Worked Examples Video", step-by-step problem demonstration)
     * Mode 3: `QUESTION_CHALLENGE_SHORT` ("Question Challenge Short", retrieval practice)
   - **Backward-Compatible Alias Invariant**: In code and schemas, `WORKED_EXAMPLES` is the primary canonical identifier; `EXPLAINED_QUESTIONS_VIDEO` is retained as a 100% supported runtime alias for existing Firestore documents, draft payloads, and routes. Zero data rewrites.
2. **Introduction of the Verified Learning Unit Aggregate Root**:
   - Establish `learning_units` as a top-level Firestore collection (REQ-06).
   - A Learning Unit stores the foundational curriculum knowledge: topic, subtopic, learning objective, prerequisite skills, verified calculation/method, common misconceptions, and real-life scenario.
   - Publications (`question_drafts`, `questions`, `videos`) reference `learningUnitId: string | null`. Standalone drafts remain supported for backward compatibility.
3. **Decoupling Presentation Format from Content Mode**:
   - Establish `presentationFormat` as an orthogonal 5-value enum: `TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION` (REQ-03).
   - Existing workflows default to `VIDEO`. New templates for text calculations, audio narration, and visual breakdown instructions will attach to the same learning unit.
4. **Audience Context and 4-Tier Skill Level**:
   - Introduce `audienceContext` (`CHILDREN`, `STUDENTS`, `COMPETITIVE_EXAM`, `WORKING_ADULTS`, `HOUSEHOLDS`, `BUSINESS_OPERATORS`, `OLDER_LEARNERS`).
   - Introduce `skillLevel` (`FOUNDATION`, `BEGINNER`, `INTERMEDIATE`, `ADVANCED`).

---

## 4. LOCAL AND GOOGLE AI STUDIO UNIFIED DEPLOYMENT ARCHITECTURE

In accordance with **Principle 16 (ADR-014)**, the application logic and schemas remain identical across local development and Google AI Studio publication.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BURRA PARIKSHA CMS CODEBASE                        │
│   Shared Presentation, Workflow Engine, Repositories, Schemas, & Adapters   │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
        Local Development Workspace             Google AI Studio Applet
        (Antigravity / Local Node)               (Production Container)
                       │                               │
       ┌───────────────┴───────────────┐       ┌───────┴──────────────────────┐
       │ - NODE_ENV=development        │       │ - NODE_ENV=production        │
       │ - Express + Vite Middleware   │       │ - Express serving dist/      │
       │ - Firestore Emulator (8080)   │       │ - Production Cloud Firestore │
       │ - Synthetic: burra-pariksha-  │       │ - Named DB: ai-studio-burra- │
       │   test ((default))            │       │ - 8 Canonical Secrets panel  │
       │ - Mock AI / Deterministic Fix │       │ - Live @google/genai & Drive │
       │ - Strict Datastore Guard      │       │ - Live Health & Probes       │
       └───────────────────────────────┘       └──────────────────────────────┘
```

- **Environment-Specific Adapters**: The persistence layer uses the Firebase Admin SDK. In local development, `src/config/datastore-guard.ts` intercepts all requests and ensures connection only to loopback emulator `127.0.0.1:8080`. In Google AI Studio, it connects to the authoritative named Firestore database.
- **Production Build Artifact**: `npm run build` produces `dist/server.cjs` (backend Node.js CJS bundle) and `dist/` (React SPA static bundle). Express mounts both simultaneously on `$PORT` (default 3000).

---

## 5. PRIORITIZED REQUIREMENTS-DRIVEN DEVELOPMENT PLAN

This plan directly translates the 90-Day Implementation Roadmap (`bp_cms_core_requirements1.md` Section 10) into actionable engineering sprints.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PHASE 1: DAYS 1–30 — ESTABLISH THE FOUNDATION               │
│   Canonical Modes 1–3, Learning Unit Schema, 5 Formats, Numerical Pillar A  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│          PHASE 2: DAYS 31–60 — TEST REAL-LIFE CONTENT & MULTI-FORMAT        │
│   Worked Examples Demonstration, Audio/Image Templates, Verification Engine │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            PHASE 3: DAYS 61–90 — CONNECTED SERIES & PERFORMANCE TRACKING     │
│   Learning Sequences, Artifact-Level Analytics, Production Time/Cost Audit   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Sprint Sequence Breakdown

#### Sprint 11: Foundation, Learning Units, and Mode Alignment (Days 1–15)
- **Objective**: Implement the Verified Learning Unit aggregate entity, reconcile the canonical 3 content modes with backward-compatible aliases, introduce the 5 presentation format definitions, and implement the lightweight Learning Unit Planning Studio.
- **Tasks**:
  - `S11-T01`: **Core Requirements Architecture Decision & Schema Contract** (Formalize ADR-015; author TypeScript interfaces and Zod validation schemas for `LearningUnit`, `presentationFormat`, `audienceContext`, `skillLevel`, and `editorialPillar`).
  - `S11-T02`: **Content Mode Registry Alignment & Legacy Aliasing** (Update `content-mode.registry.ts` to designate `WORKED_EXAMPLES` as canonical Mode 2 with `EXPLAINED_QUESTIONS_VIDEO` as transparent alias; align Mode 1 as `TOPIC_INTRODUCTION` and Mode 3 as `QUESTION_CHALLENGE_SHORT`).
  - `S11-T03`: **Learning Unit Firestore Repository & Datastore Contract** (Implement `learning-units.repository.ts` following `FIRESTORE-COLLECTION-CONTRACT.md`; add `learning_units` to purge allowlist and emulator seed scripts with safe datastore isolation).
  - `S11-T04`: **Audience Context & Skill Level Studio Selectors** (Implement UI controls in Studio workspace supporting the 7 audience contexts and 4 canonical skill levels).
  - `S11-T05`: **Lightweight Learning Unit Planning Studio UI** (Create creator-friendly planning screen to draft and store the core educational lesson—objective, verified calculation, misconception—without burdensome forms).
  - `S11-T06`: **Artifact-to-Learning-Unit Linking Integration** (Wire `learningUnitId` foreign key into Question Studio drafts across all three modes; ensure existing standalone drafts remain valid).
  - `S11-T07`: **Automated Unit & Integration Test Suite** (Comprehensive code-level tests verifying learning unit persistence, alias transparency, schema validation, and datastore isolation).

#### Sprint 12: Content Verification & Multi-Format Templates (Days 16–30)
- **Objective**: Strengthen Stage 02 Content Verification (mathematical proof, reasoning completeness, spoken Telugu clarity), and introduce reusable templates for non-video presentation formats (Text, Audio, Image).
- **Tasks**:
  - `S12-T01`: **Calculation & Reasoning Verification Engine** (Stage 02 automated verification checks for arithmetic correctness and solution completeness).
  - `S12-T02`: **Linguistic & Consistency Quality Gate** (Verification checks comparing question wording, answer keys, Telugu explanations, and visual instructions).
  - `S12-T03`: **Text & Image Presentation Templates** (Structured schemas and markdown/visual outline generators for text explanations and visual image breakdowns).
  - `S12-T04`: **Audio Narration & Script Templates** (Spoken audio script generator with timing pauses and pronunciation guides).
  - `S12-T05`: **Initial Numerical Foundation Batch (Percentages)** (Author and verify foundational learning units and multi-mode artifacts for shopping discounts and percentage calculations per REQ-10).

#### Sprint 13: Downstream Multi-Mode Workflow & Production Ingestion (Days 31–45)
- **Objective**: Adapt downstream workflow stages (Stage 03 Audience Script, Stage 04 Teleprompter, Stage 05/06 Ingestion & Editing) to seamlessly ingest Mode 2 Worked Examples and Mode 3 Challenges linked to their learning units.

#### Sprint 14: Connected Learning Sequences & Editorial Calendar (Days 46–60)
- **Objective**: Link related content artifacts (Intro $\to$ Worked Example $\to$ Challenge) sharing the same Learning Unit ID; implement editorial calendar views.

#### Sprint 15: Artifact Performance, Production Cost & Measurement (Days 61–90)
- **Objective**: Implement the 3 measurement categories (Audience growth, Learning engagement accuracy, Production time/cost per artifact).

---

## 6. SELECTED FIRST IMPLEMENTATION TASK: S11-T01

Based on the empirical audit evidence, starting downstream scripting (`S11-T01` in the old proposal) would be premature because the application lacks the foundational **Learning Unit schema**, the **canonical content mode alignment (`WORKED_EXAMPLES`)**, and the **orthogonal presentation format definitions**.

### Selected First Implementation Task:
**`S11-T01` — Core Requirements Architecture Decision & Schema Contract**
- **Scope**: Author the formal schema contract in `shared/contracts/learning-unit.contract.ts` and `shared/types/`, codifying:
  1. `LearningUnit` interface and Zod schema (Layer 1 & 2 planning model).
  2. `PresentationFormat` enum (`TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION`).
  3. Canonical Content Mode enum alignment (`TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, `QUESTION_CHALLENGE_SHORT`) with `EXPLAINED_QUESTIONS_VIDEO` alias.
  4. `AudienceContext` (7 values) and `SkillLevel` (4 values).
  5. `EditorialPillar` (Pillars A through F).
- **Acceptance Criteria**:
  - Strongly typed, framework-free schemas authored in `shared/`.
  - Zero breaking changes to existing `question_drafts` or `videos` contracts.
  - `npm run lint` compiles cleanly with zero type errors.

---

## 7. ARCHITECTURE ACCEPTANCE CRITERIA (AAC)

- **[AAC-01] Scope Fidelity**: System terminology, content modes, formats, and planning layers strictly reflect `bp_cms_core_requirements1.md`.
- **[AAC-02] Single Codebase (Principle 16)**: Zero code branching or separate development shims between local and Google AI Studio environments.
- **[AAC-03] Backward Compatibility**: `EXPLAINED_QUESTIONS_VIDEO` continues to function seamlessly as an alias for `WORKED_EXAMPLES` without rewriting persisted documents.
- **[AAC-04] Datastore Authority & Isolation**: Cloud Firestore remains sole transactional authority; datastore safety guard prevents tests from touching production.
- **[AAC-05] Learning Unit Integrity**: All new publications support linking to an authoritative `LearningUnit`; standalone legacy artifacts remain valid.
- **[AAC-06] Format Decoupling**: Presentation format is strictly decoupled from content mode.
- **[AAC-07] Verified Quality Gates**: Stage 02 verification enforces calculation correctness, reasoning completeness, and spoken Telugu naturalness.
- **[AAC-08] GAR-02 Compliance**: Anti-self-approval strictly enforced; System Admin override immutably logged with justification.
