# Burra Pariksha CMS
# 06 — Canonical Domain Model

Stage: 06 — Domain Model

STATUS:
COMPLETE — VERIFIED — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
NOT USED IN ROUTINE STAGE CLOSURE

Version:
1.0.0

Purpose:
Defines the authoritative canonical business domain model for the Burra Pariksha Content Management System (BP-CMS). Specifies all business entities, conceptual boundaries, domain ownership, relationships, cardinalities, lifecycles, and governance invariants across the 15-step pedagogical production pipeline, strictly decoupled from physical database persistence and low-level API implementations.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 06 Canonical Domain Model | FACT |
| **File Path** | `docs/architecture/06-DOMAIN-MODEL.md` | FACT |
| **Document Stage** | Stage 06 — Domain Model | FACT |
| **Authority** | Authoritative Business Domain & Entity Model Specification | FACT |
| **Status** | COMPLETE — VERIFIED — CLOSED | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed) | FACT |
| **Subsequent Stages** | Stage 07+ (Target Data Architecture, Physical Storage Schemas, Migration Specifications, API Contracts) | FACT |
| **Baseline Repository Commit** | `26e445a0fbd68455fe63f9eb7d36148d277b9abb` | FACT |
| **Architectural Scope** | Defines business entities, domain ownership, relationships, and invariants without declaring database tables, ORM models, or API endpoints | FACT |

---

## 02. Purpose

The objective of Stage 06 is to define the canonical business domain model of BP-CMS. Following the system boundary established in Stage 05, this document models the core business concepts, conceptual data structures, and operational entities that power the Burra Pariksha video production and educational publishing lifecycle.

This domain model provides:
1. **Unambiguous Conceptual Entities:** Precise formal definitions for all 27 candidate domain entities across identity, curriculum, production, media, review, publishing, analytics, workflow, and governance.
2. **Single Ownership Authority (AP-010):** Every entity is owned by exactly one BP-CMS business domain. Consuming domains interact across explicit reference contracts.
3. **Decoupled Persistence:** Clear distinction between business identity, business lifecycles, and eventual physical database or API representations.
4. **Preservation of Invariants:** Structural enforcement of the canonical 15-step workflow (AP-001), stage vs state separation (AP-002), media reference vs binary separation (AP-007, AP-008), and human-gated review governance (AP-009).

---

## 03. Scope

### In-Scope
- Canonical definition of all 27 candidate entities across 9 functional domain groupings:
  - Identity & Access (User, Role, Capability)
  - Question Domain (Question, QuestionVersion, QuestionReview)
  - Content & Production (Content, Script, ScriptVersion, Video, VideoTake, VideoEdit)
  - Media (MediaAsset, MediaReference, ArchiveReference)
  - Review & Creative Assets (Thumbnail, SocialReview)
  - Publishing & Distribution (PublishingPackage, Publication, Platform)
  - Analytics & Intelligence (AnalyticsSnapshot, PerformanceRecord, IntelligenceInsight)
  - Workflow (WorkflowInstance, WorkflowTransition)
  - Operations & Governance (Notification, AuditEvent)
- Specification of Business Identity vs Technical Storage ID for every entity.
- Specification of Domain Owner, Relationships, Cardinalities (1:1, 1:N, N:1, N:N), Lifecycles, Required Fields, Optional Fields, Immutable Fields, and Reference Types.
- In-depth analysis of versioning, review models, media boundaries, video hierarchies, publishing intent, analytics tiers, and workflow mechanics.
- Cross-Domain Relationship Matrix and Conceptual Entity Relationship Map.
- Authoritative vs Derived vs External vs Historical data classification.
- Entity Decision Register documenting acceptance, deferment, and proposed additions.
- Traceability to Stages 01, 02, 04, and 05.

### Out-of-Scope (Strict Non-Requirements for Stage 06)
- Declaring SQL tables, PostgreSQL schemas, column data types, foreign key constraints, or indexes.
- Declaring Google Sheets tab names, range addresses, or cell formula schemas.
- Declaring ORM models (Drizzle, Prisma, TypeORM) or Data Access Objects (DAOs).
- Writing REST endpoints, Express route handlers, GraphQL schemas, or client DTOs.
- Creating or editing React UI components, forms, or styling.
- Provisioning cloud databases, queues, or microservice infrastructure.

---

## 04. Domain Modeling Principles

The BP-CMS domain model is governed by seven core architectural axioms:

1. **Principle 1 — Business Identity Distinction:** Every business entity possesses a human-readable, domain-meaningful business identity (e.g., `BP-Q-000104`, `BP-V-000088`, `USR-000012`) that exists independently of transient primary keys or surrogate database IDs.
2. **Principle 2 — Single Domain Ownership (AP-010):** Every entity belongs to exactly one authoritative BP-CMS domain. Other domains may reference the entity by its business identity, but may never directly mutate or re-declare it.
3. **Principle 3 — Media Reference Independence (AP-007, AP-008):** Entities that involve media assets store references, hashes, and descriptive metadata. Physical byte binaries reside strictly in external cloud object storage (Google Drive).
4. **Principle 4 — Business Stage vs Technical Status Separation (AP-002):** An entity's progress along the canonical 15-step pipeline is tracked via the Workflow domain, while technical statuses (e.g., `DRAFT`, `ENCODING`, `FAILED`) describe operational conditions within a stage.
5. **Principle 5 — Immutable Audit & Review History (AP-009, AP-014):** Formal reviews, sign-offs, workflow transitions, and audit events are append-only and strictly immutable. Historical records cannot be rewritten or erased.
6. **Principle 6 — Assistive AI Subordination (AP-009):** Candidate entities generated by AI models (e.g., draft questions, script suggestions) remain in an unapproved candidate state until verified and signed off by an authorized human operator.
7. **Principle 7 — Persistence Neutrality:** The domain model describes real-world business concepts, invariant constraints, and relationships without assuming SQL relational tables, NoSQL documents, or spreadsheet rows.

---

## 05. Domain Map

The 27 candidate entities are mapped to the authoritative BP-CMS business domains established in Stage 05:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BURRA PARIKSHA CMS                                         │
│                                                                                                  │
│   ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────────────┐   │
│   │   IDENTITY & ACCESS    │  │    QUESTION DOMAIN     │  │       CONTENT & PRODUCTION       │   │
│   │   - User               │  │    - Question          │  │       - Content (Aggregate Root) │   │
│   │   - Role               │  │    - QuestionVersion   │  │       - Script                   │   │
│   │   - Capability         │  │    - QuestionReview    │  │       - ScriptVersion            │   │
│   └───────────┬────────────┘  └───────────┬────────────┘  │       - Video                    │   │
│               │                           │               │       - VideoTake                │   │
│               ▼                           ▼               │       - VideoEdit                │   │
│   ┌────────────────────────┐  ┌────────────────────────┐  └────────────────┬─────────────────┘   │
│   │   WORKFLOW DOMAIN      │  │ REVIEW & CREATIVE      │                   │                     │
│   │   - WorkflowInstance   │  │ - Thumbnail            │                   ▼                     │
│   │   - WorkflowTransition │  │ - SocialReview         │  ┌──────────────────────────────────┐   │
│   └───────────┬────────────┘  └───────────┬────────────┘  │           MEDIA DOMAIN           │   │
│               │                           │               │   - MediaAsset                   │   │
│               ▼                           ▼               │   - MediaReference               │   │
│   ┌────────────────────────┐  ┌────────────────────────┐  │   - ArchiveReference             │   │
│   │ PUBLISHING & DISTRIB.  │  │ ANALYTICS & INTEL.     │  └──────────────────────────────────┘   │
│   │ - PublishingPackage    │  │ - AnalyticsSnapshot    │                   │                     │
│   │ - Publication          │  │ - PerformanceRecord    │                   ▼                     │
│   │ - Platform             │  │ - IntelligenceInsight  │  ┌──────────────────────────────────┐   │
│   └────────────────────────┘  └────────────────────────┘  │      OPERATIONS & GOVERNANCE     │   │
│                                                           │      - Notification              │   │
│                                                           │      - AuditEvent                │   │
│                                                           └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 06. Identity & Access Domain

### 6.1 Entity: User

#### Entity
User

#### Purpose
Represents a human operator, educator, creator, reviewer, or administrator authorized to access and execute tasks within BP-CMS.

#### Domain Owner
Identity Domain

#### Business Meaning
A verified individual participant in the Burra Pariksha production lifecycle (e.g., Telugu Subject Matter Expert, Presenter/Host, Video Editor, Quality Lead).

#### Business Identity vs Technical Storage ID
- **Business Identity:** `USR-` prefixed 6-digit identifier (e.g., `USR-000014`, `USR-000042`).
- **Technical Storage ID:** Database surrogate identifier (e.g., UUID or serial primary key).

#### Relationships
- `User` 1:N `Role` (N:N resolved through user role assignments; a User possesses 1 or more functional Roles).
- `User` 1:N `Question` (User as Author / Creator).
- `User` 1:N `QuestionReview` (User as Reviewer / SME).
- `User` 1:N `Script` (User as Scriptwriter).
- `User` 1:N `VideoTake` (User as Host / Presenter).
- `User` 1:N `VideoEdit` (User as Video Editor).
- `User` 1:N `WorkflowTransition` (User as Authorizing Actor).
- `User` 1:N `AuditEvent` (User as Action Initiator).
- `User` 1:N `Notification` (User as Recipient).

#### Lifecycle
1. **Provisioned:** Created by Administrator with email and identity reference.
2. **Active:** Granted roles, actively performing authoring, editing, review, or administrative tasks.
3. **Suspended:** Temporarily blocked from initiating actions or approving workflow transitions.
4. **Deactivated:** Permanently deactivated upon departure; historical associations and audit attribution remain preserved forever.

#### Required Fields
- `businessId`: Unique human-readable identifier (`USR-xxxxxx`).
- `email`: Corporate or authorized Google Workspace email address.
- `displayName`: Full name of the operator.
- `status`: Account lifecycle state (`PROVISIONED`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`).
- `createdAt`: Timestamp of account provisioning.

#### Optional Fields
- `phone`: Mobile contact for urgent production alerts.
- `avatarUrl`: Profile image URL.
- `assignedSubjectSpecialties`: Array of curriculum subjects for SME routing (e.g., `["Class 10 Mathematics", "Class 9 Physical Science"]`).

#### Immutable Fields
- `businessId`
- `createdAt`

#### References
- **Internal Entity References:** Set of assigned `Role` business identifiers.
- **External-System References:** Google Workspace OAuth Subject Claim (`googleSubId`), External Email Address.
- **Media References:** None directly (optional avatar metadata).
- **Archive References:** None.

---

### 6.2 Entity: Role

#### Entity
Role

#### Purpose
Defines an authoritative operational responsibility profile that bundles capabilities required to perform specific production stages.

#### Domain Owner
Roles Domain

#### Business Meaning
A designated business function within Burra Pariksha (e.g., `ADMIN`, `CONTENT_CREATOR`, `LEAD_CREATOR`, `REVIEWER`, `SME_REVIEWER`, `PRODUCER`, `VIDEO_EDITOR`, `HOST`, `GRAPHIC_DESIGNER`, `COMMUNITY_MANAGER`).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical uppercase role code (e.g., `ROLE_SME_REVIEWER`, `ROLE_VIDEO_EDITOR`, `ROLE_ADMIN`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Role` N:M `User` (Multiple users share a role; users can hold multiple roles).
- `Role` 1:N `Capability` (A role grants one or more granular business capabilities).

#### Lifecycle
1. **Defined:** Initialized in system configuration.
2. **Active:** Assigned to users to authorize business tasks.
3. **Deprecated:** Retired in favor of updated operational profiles; existing assignments migrated.

#### Required Fields
- `roleCode`: Canonical business role code (`ROLE_xxxx`).
- `roleName`: Human-readable label (e.g., "Subject Matter Expert Reviewer").
- `description`: Formal summary of operational responsibilities.
- `isSystemRole`: Boolean indicating whether the role is a core immutable system profile.

#### Optional Fields
- `workflowStageAuthorizations`: Array of canonical stage numbers (1–15) this role is authorized to transition.

#### Immutable Fields
- `roleCode`
- `isSystemRole`

#### References
- **Internal Entity References:** List of granted `Capability` codes.
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

### 6.3 Entity: Capability

#### Entity
Capability

#### Purpose
Defines the atomic, fine-grained permission gate required to perform a specific domain mutation or sign-off.

#### Domain Owner
Capabilities Domain

#### Business Meaning
A granular security privilege evaluated server-side before executing a business action (e.g., `canApproveQuestion`, `canSignOffQC`, `canTriggerPublish`, `canOverrideReview`, `canBypassGate`).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Namespaced action string (e.g., `question:approve`, `qc:signoff`, `publishing:trigger`, `script:lock`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Capability` N:M `Role` (Mapped via capability grant matrices).

#### Lifecycle
1. **Declared:** Defined in system security architecture.
2. **Active:** Evaluated during backend authorization checks.
3. **Retired:** Deprecated if the underlying business operation is eliminated.

#### Required Fields
- `capabilityCode`: Canonical identifier string (`domain:action`).
- `domain`: Associated business domain (e.g., `QUESTION`, `WORKFLOW`, `PUBLISHING`).
- `description`: Specific business operation authorized by this capability.

#### Optional Fields
- `requiresHumanSignOff`: Boolean flag indicating whether exercising this capability satisfies an AP-009 human gate.

#### Immutable Fields
- `capabilityCode`
- `domain`

#### References
- **Internal Entity References:** Associated `Role` codes.
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

## 07. Question Domain

### 7.1 Entity: Question

#### Entity
Question

#### Purpose
Represents the core educational concept and curriculum asset of Burra Pariksha.

#### Domain Owner
Question Domain

#### Business Meaning
The foundational pedagogical question unit comprising curriculum taxonomy, mathematical/logical problem statement, multiple-choice options, correct key, and explanatory solution proof in Telugu and English.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `BP-Q-` with 6-digit sequence (e.g., `BP-Q-000104`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Question` 1:N `QuestionVersion` (A question has one or more sequential revisions; exactly one is active).
- `Question` 1:N `QuestionReview` (Evaluated across pedagogical verification reviews).
- `Question` 1:1 `Content` (Associated with an overarching production Content project).
- `Question` 1:N `Script` (Informs one or more video presenter scripts).

#### Lifecycle
1. **Draft:** Question created manually or via AI suggestion.
2. **In Review:** Submitted to Stage 02 Question Verification; awaiting SME sign-off.
3. **Approved:** Verified by SME as mathematically, pedagogically, and linguistically accurate.
4. **Revision Requested:** Defect noted during review; sent back to creator for rework.
5. **Locked:** Content moved into studio recording; question text frozen.
6. **Archived:** Retired from active syllabus circulation.

#### Required Fields
- `businessId`: Canonical identifier (`BP-Q-xxxxxx`).
- `curriculumClass`: Target academic standard (e.g., `Class 10`, `Class 9`, `Competitive`).
- `subject`: Academic discipline (e.g., `Mathematics`, `Physical Science`).
- `topic`: Primary syllabus topic (e.g., `Quadratic Equations`, `Trigonometry`).
- `subtopic`: Detailed concept node (e.g., `Nature of Roots`).
- `difficulty`: Pedagogical grading (`EASY`, `MEDIUM`, `HARD`, `CHALLENGER`).
- `currentVersionNumber`: Sequential version counter pointing to active `QuestionVersion`.
- `authorUserId`: Business ID of creator (`USR-xxxxxx`).
- `createdAt`: Creation timestamp.

#### Optional Fields
- `curriculumStandard`: Academic board code (e.g., `AP_SSC`, `TS_SSC`, `CBSE`).
- `sourceTextbookReference`: Chapter and exercise reference.
- `aiAssisted`: Boolean indicating whether initial draft utilized Gemini API generation.

#### Immutable Fields
- `businessId`
- `authorUserId`
- `createdAt`

#### References
- **Internal Entity References:** `authorUserId` (`User`), `currentVersionId` (`QuestionVersion`), `contentId` (`Content`).
- **External-System References:** Syllabus curriculum node codes.
- **Media References:** Optional diagram `MediaReference` for geometry/graph questions.
- **Archive References:** None.

---

### 7.2 Entity: QuestionVersion

#### Entity
QuestionVersion

#### Purpose
Maintains an immutable historical record of the pedagogical question text, options, and solution proof for a specific revision.

#### Domain Owner
Question Domain

#### Business Meaning
A specific snapshot in time of a question's wording, choices, mathematical proof, and Telugu translations.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<QuestionBusinessId>-V<VersionNumber>` (e.g., `BP-Q-000104-V01`, `BP-Q-000104-V02`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `QuestionVersion` N:1 `Question` (Belongs to a parent Question).
- `QuestionVersion` 1:N `QuestionReview` (Each review targets a specific question version).

#### Lifecycle
1. **Created:** Instantiated upon question creation or whenever question text/options are modified.
2. **Submitted:** Associated with a verification review cycle.
3. **Superceded:** Replaced by a newer version following revision requests.
4. **Authoritative Active:** Marked as the canonical approved snapshot for production.

#### Required Fields
- `businessId`: Compound version identifier (`BP-Q-xxxxxx-Vxx`).
- `parentQuestionId`: Business ID of parent question.
- `versionNumber`: Positive integer sequence (1, 2, 3...).
- `questionTextTelugu`: Full question text formatted in Telugu script.
- `questionTextEnglish`: Optional or parallel English translation text.
- `options`: Array of exactly 4 structured multiple-choice options (A, B, C, D) with Telugu and English copy.
- `correctOption`: Single authoritative answer key indicator (`A`, `B`, `C`, or `D`).
- `solutionTelugu`: Detailed step-by-step mathematical proof and explanation in Telugu.
- `solutionEnglish`: Parallel English explanation or mathematical derivation.
- `changeSummary`: Human rationale for creating this version (e.g., "Initial draft", "Fixed Telugu typo in Option B").
- `createdById`: Business ID of editor (`USR-xxxxxx`).
- `createdAt`: Timestamp of version creation.

#### Optional Fields
- `diagramMediaReferenceId`: Reference to geometry or graph media descriptor.

#### Immutable Fields
- `businessId`
- `parentQuestionId`
- `versionNumber`
- `questionTextTelugu`
- `options`
- `correctOption`
- `solutionTelugu`
- `createdById`
- `createdAt`

#### References
- **Internal Entity References:** `parentQuestionId` (`Question`), `createdById` (`User`).
- **External-System References:** None.
- **Media References:** Optional diagram `MediaReference`.
- **Archive References:** None.

---

### 7.3 Entity: QuestionReview

#### Entity
QuestionReview

#### Purpose
Captures the formal pedagogical verification, mathematical correctness audit, and sign-off verdict for a QuestionVersion.

#### Domain Owner
Reviews Domain

#### Business Meaning
The Stage 02 gate record where an authorized Subject Matter Expert (SME) audits the problem statement, choices, correct key, and Telugu terminology against the 10-point verification checklist.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `QV-` with 6-digit sequence (e.g., `QV-000104`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `QuestionReview` N:1 `QuestionVersion` (Targets a specific version).
- `QuestionReview` N:1 `User` (Conducted by an authenticated SME Reviewer).
- `QuestionReview` 1:1 `WorkflowTransition` (Serves as prerequisite evidence for Stage 02 -> Stage 03 transition).

#### Lifecycle
1. **Pending:** Verification assigned to SME.
2. **Completed:** SME completes 10-point checklist and renders verdict (`APPROVED`, `REVISION_REQUIRED`, `REJECTED`).
3. **Immutable Record:** Once signed off, the review record is sealed and can never be modified.

#### Required Fields
- `businessId`: Canonical review identifier (`QV-xxxxxx`).
- `targetQuestionVersionId`: Target version ID (`BP-Q-xxxxxx-Vxx`).
- `reviewerUserId`: Business ID of SME reviewer (`USR-xxxxxx`).
- `verdict`: Formal decision (`APPROVED`, `REVISIONS_REQUIRED`, `REJECTED`).
- `checklistResponses`: Structured record of the 10-point verification items:
  1. Syllabus mapping verified
  2. Question ambiguity check passed
  3. Single unique correct answer verified
  4. Distractor plausibility verified
  5. Mathematical proof verified
  6. Telugu script terminology accurate
  7. 60-second solvability confirmed
  8. Speed-trick pedagogical validity checked
  9. Visual/diagram clarity confirmed
  10. Formatting standards satisfied
- `reviewRemarks`: Feedback notes from reviewer.
- `reviewedAt`: Timestamp of review sign-off.

#### Optional Fields
- `recommendedRevisions`: Specific corrective guidance if verdict is `REVISIONS_REQUIRED`.

#### Immutable Fields
- Entire entity is immutable upon sign-off.

#### References
- **Internal Entity References:** `targetQuestionVersionId` (`QuestionVersion`), `reviewerUserId` (`User`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

## 08. Content & Production Domain

### 8.1 Entity: Content

#### Entity
Content

#### Purpose
Serves as the central aggregate root and commercial project entity linking an educational question, presenter script, video production assets, and multi-platform publishing packages.

#### Domain Owner
Content Domain

#### Business Meaning
The umbrella creative project (e.g., `BP-C-000088`: "Class 10 Trigonometry Speed Trick Short") uniting all creative artifacts across the 15-step production lifecycle.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `BP-C-` with 6-digit sequence (e.g., `BP-C-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Content` 1:1 `Question` (Core educational atom).
- `Content` 1:1 `Script` (Presenter spoken script).
- `Content` 1:1 `Video` (Video production project).
- `Content` 1:1 `Thumbnail` (Graphic asset project).
- `Content` 1:1 `PublishingPackage` (Distribution package).
- `Content` 1:1 `WorkflowInstance` (Tracks canonical 15-step progression).
- `Content` 1:N `AuditEvent` (Historical operational trace).

#### Lifecycle
1. **Initiated:** Created when a question enters production planning.
2. **In Production:** Progressing through filming, editing, QC, and packaging (Stages 03–10).
3. **Published:** Live across YouTube Shorts and social platforms (Stage 11).
4. **In Analysis:** Collecting performance snapshots and intelligence feedback (Stages 12–15).
5. **Completed:** Lifecycle closed; historical intelligence incorporated into syllabus planning.
6. **Archived:** Deep-archived after distribution cycle.

#### Required Fields
- `businessId`: Canonical content identifier (`BP-C-xxxxxx`).
- `title`: Working production title.
- `primaryQuestionId`: Business ID of linked question (`BP-Q-xxxxxx`).
- `leadCreatorUserId`: Assigned production owner (`USR-xxxxxx`).
- `createdAt`: Timestamp of content initiation.

#### Optional Fields
- `targetPublishDate`: Scheduled broadcast date.
- `campaignTag`: Marketing or curriculum campaign designation.

#### Immutable Fields
- `businessId`
- `primaryQuestionId`
- `createdAt`

#### References
- **Internal Entity References:** `primaryQuestionId` (`Question`), `leadCreatorUserId` (`User`), `workflowInstanceId` (`WorkflowInstance`).
- **External-System References:** None.
- **Media References:** None directly (aggregates entities holding media references).
- **Archive References:** `ArchiveReference` when cold-archived.

---

### 8.2 Entity: Script

#### Entity
Script

#### Purpose
Represents the vertical short-form teleprompter script and spoken narrative designed for high-retention video delivery.

#### Domain Owner
Scripts Domain

#### Business Meaning
The 60-second presenter script formatted with a 3-second hook, speed-trick reveal, step-by-step question breakdown, and audience call-to-action in Telugu.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `BP-SCR-` with 6-digit sequence (e.g., `BP-SCR-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Script` 1:1 `Content` (Belongs to an overarching Content project).
- `Script` N:1 `Question` (Derived from a pedagogical question).
- `Script` 1:N `ScriptVersion` (Sequential revisions of presenter copy).
- `Script` 1:1 `VideoTake` (Used as the teleprompter feed during recording).

#### Lifecycle
1. **Drafting:** Scriptwriter authors teleprompter text.
2. **Ready for Recording:** Script reviewed and marked ready for teleprompter feed.
3. **Locked:** Recording commenced; script text frozen to guarantee sync with recorded audio.
4. **Archived:** Retired with content project.

#### Required Fields
- `businessId`: Canonical script identifier (`BP-SCR-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `questionId`: Linked question (`BP-Q-xxxxxx`).
- `authorUserId`: Scriptwriter (`USR-xxxxxx`).
- `currentVersionNumber`: Pointer to active `ScriptVersion`.
- `targetDurationSeconds`: Expected reading time (typically 50–58 seconds).
- `createdAt`: Creation timestamp.

#### Optional Fields
- `suggestedPacingWpm`: Target words-per-minute for teleprompter scroll speed.
- `teleprompterFontScale`: Presenter preference setting.

#### Immutable Fields
- `businessId`
- `contentId`
- `questionId`
- `createdAt`

#### References
- **Internal Entity References:** `contentId` (`Content`), `questionId` (`Question`), `authorUserId` (`User`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

### 8.3 Entity: ScriptVersion

#### Entity
ScriptVersion

#### Purpose
Captures an immutable historical revision of presenter teleprompter copy.

#### Domain Owner
Scripts Domain

#### Business Meaning
A specific version of the hook, teleprompter body, problem breakdown, and call-to-action copy.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<ScriptBusinessId>-V<VersionNumber>` (e.g., `BP-SCR-000088-V01`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `ScriptVersion` N:1 `Script` (Belongs to parent Script).

#### Lifecycle
1. **Created:** Created upon initial drafting or subsequent revision.
2. **Active:** Marked as current active version for teleprompter feed.
3. **Superceded:** Replaced by revised draft.

#### Required Fields
- `businessId`: Compound version ID (`BP-SCR-xxxxxx-Vxx`).
- `parentScriptId`: Parent script ID (`BP-SCR-xxxxxx`).
- `versionNumber`: Sequence integer (1, 2, 3...).
- `hookText`: Opening 3-second attention-grabbing Telugu hook phrasing.
- `teleprompterBody`: Full spoken Telugu script formatted with rhythm markers and pause cues.
- `speedTrickCallout`: Explicit spoken shortcut or pedagogical trick explanation.
- `callToAction`: Closing subscription and comment prompt.
- `estimatedWordCount`: Word count used to calculate reading duration.
- `createdById`: Author (`USR-xxxxxx`).
- `createdAt`: Timestamp.

#### Optional Fields
- `editorNotes`: Guidance notes for host pronunciation and emphasis.

#### Immutable Fields
- Entire entity is immutable upon creation.

#### References
- **Internal Entity References:** `parentScriptId` (`Script`), `createdById` (`User`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

### 8.4 Entity: Video

#### Entity
Video

#### Purpose
Represents the multimedia video project encapsulating filming takes, post-production editing cuts, and final quality control.

#### Domain Owner
Videos Domain

#### Business Meaning
The primary audio-visual production asset for a Burra Pariksha short-form video.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `BP-V-` with 6-digit sequence (e.g., `BP-V-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Video` 1:1 `Content` (Belongs to Content project).
- `Video` 1:N `VideoTake` (Contains one or more raw filming takes).
- `Video` 1:N `VideoEdit` (Contains one or more rendered edit cuts).
- `Video` 1:1 `SocialReview` (Evaluated for vertical smartphone viewing experience).

#### Lifecycle
1. **Scheduled:** Filming slot planned.
2. **Recording:** Studio takes being captured (Stage 04).
3. **Handoff:** Raw footage transferred to editor (Stage 05).
4. **Editing:** Post-production cut assembly (Stage 06).
5. **QC Review:** Undergoing 6-point Quality Control sign-off (Stage 07).
6. **Approved Master:** Master cut verified and signed off for packaging.
7. **Archived:** Raw takes and project files cold-tiered.

#### Required Fields
- `businessId`: Canonical video identifier (`BP-V-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `hostUserId`: Assigned presenter (`USR-xxxxxx`).
- `assignedEditorUserId`: Assigned video editor (`USR-xxxxxx`).
- `aspectRatio`: Target video orientation (canonical: `9:16`).
- `createdAt`: Timestamp.

#### Optional Fields
- `studioLocation`: Physical or virtual studio tag.
- `productionNotes`: Camera setup, lighting, or microphone notes.

#### Immutable Fields
- `businessId`
- `contentId`
- `createdAt`

#### References
- **Internal Entity References:** `contentId` (`Content`), `hostUserId` (`User`), `assignedEditorUserId` (`User`).
- **External-System References:** Google Drive Project Folder ID (`driveFolderId`).
- **Media References:** References active master cut `MediaReference`.
- **Archive References:** `ArchiveReference` when raw footage is tiered.

---

### 8.5 Entity: VideoTake

#### Entity
VideoTake

#### Purpose
Records an individual filming take captured in the studio during presenter recording.

#### Domain Owner
Videos Domain

#### Business Meaning
A specific physical camera recording session (e.g., Take 1, Take 2, Take 3) of the presenter reading the teleprompter.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<VideoBusinessId>-TK<TakeNumber>` (e.g., `BP-V-000088-TK01`, `BP-V-000088-TK02`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `VideoTake` N:1 `Video` (Belongs to parent Video).
- `VideoTake` 1:1 `MediaReference` (Points to raw video file in Google Drive).

#### Lifecycle
1. **Recorded:** Logged by camera operator / host.
2. **Flagged:** Marked as `PREFERRED_TAKE`, `USABLE_BACKUP`, or `REJECTED_OUTTAKE`.
3. **Handed Off:** Transferred to editing pipeline.

#### Required Fields
- `businessId`: Compound take ID (`BP-V-xxxxxx-TKxx`).
- `parentVideoId`: Parent video ID (`BP-V-xxxxxx`).
- `takeNumber`: Sequence integer (1, 2, 3...).
- `takeStatus`: Operational classification (`PREFERRED_TAKE`, `USABLE_BACKUP`, `REJECTED_OUTTAKE`).
- `rawMediaReferenceId`: Reference to raw video file descriptor (`MED-xxxxxx`).
- `durationSeconds`: Recorded take duration.
- `recordedAt`: Timestamp.

#### Optional Fields
- `presenterNotes`: Commentary on delivery, stumble points, or audio claps.

#### Immutable Fields
- `businessId`
- `parentVideoId`
- `takeNumber`
- `recordedAt`

#### References
- **Internal Entity References:** `parentVideoId` (`Video`), `rawMediaReferenceId` (`MediaReference`).
- **External-System References:** Google Drive raw file ID via `MediaReference`.
- **Media References:** `rawMediaReferenceId`.
- **Archive References:** None directly (handled via parent Video).

---

### 8.6 Entity: VideoEdit

#### Entity
VideoEdit

#### Purpose
Represents a rendered post-production edit cut produced by the video editor.

#### Domain Owner
Videos Domain

#### Business Meaning
A specific rendered cut (e.g., Rough Cut v1, Fine Cut v2, Final Master v3) incorporating subtitles, sound effects, motion graphics, speed-trick callouts, and audio loudness normalization.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<VideoBusinessId>-ED<EditNumber>` (e.g., `BP-V-000088-ED01`, `BP-V-000088-ED02`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `VideoEdit` N:1 `Video` (Belongs to parent Video).
- `VideoEdit` 1:1 `MediaReference` (Points to rendered MP4 file in Google Drive).
- `VideoEdit` 1:N `SocialReview` (Evaluated for technical and branding quality).

#### Lifecycle
1. **Rendered:** Editor uploads rendered cut and registers metadata.
2. **In Review:** Submitted to Stage 07 Final QC.
3. **Approved Master:** Passed QC checklist; designated as authoritative release master.
4. **Superceded:** Replaced by revised cut if QC defects identified.

#### Required Fields
- `businessId`: Compound edit cut ID (`BP-V-xxxxxx-EDxx`).
- `parentVideoId`: Parent video ID (`BP-V-xxxxxx`).
- `cutVersionNumber`: Sequence integer (1, 2, 3...).
- `renderedMediaReferenceId`: Reference to rendered MP4 descriptor (`MED-xxxxxx`).
- `durationSeconds`: Exact playback duration.
- `editorUserId`: Video editor (`USR-xxxxxx`).
- `audioLufsLevel`: Measured loudness reading (target: -14 LUFS ± 1 LUFS).
- `hasSubtitlesBurnedIn`: Boolean confirmation of Telugu subtitles.
- `isMasterCut`: Boolean flag indicating whether this cut is the approved distribution master.
- `renderedAt`: Timestamp.

#### Optional Fields
- `editorChangeLog`: Description of changes made in this cut.
- `colorProfile`: Color space tag (e.g., `Rec.709`).

#### Immutable Fields
- `businessId`
- `parentVideoId`
- `cutVersionNumber`
- `renderedAt`

#### References
- **Internal Entity References:** `parentVideoId` (`Video`), `editorUserId` (`User`), `renderedMediaReferenceId` (`MediaReference`).
- **External-System References:** Google Drive rendered file ID via `MediaReference`.
- **Media References:** `renderedMediaReferenceId`.
- **Archive References:** None.

---

## 09. Media Domain

### 9.1 Entity: MediaAsset

#### Entity
MediaAsset

#### Purpose
Represents the authoritative BP-CMS business catalog descriptor for any digital multimedia file utilized across the production pipeline.

#### Domain Owner
Media Metadata Domain

#### Business Meaning
The logical metadata record tracking file attributes, content hashes, format specifications, and business context, completely decoupled from physical byte storage.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `MED-` with 6-digit sequence (e.g., `MED-000492`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `MediaAsset` 1:N `MediaReference` (May be referenced across multiple entities or URI endpoints).
- `MediaAsset` 1:1 `ArchiveReference` (Linked to cold archive record when tiered).

#### Lifecycle
1. **Registered:** Descriptor created prior to or immediately following file upload.
2. **Verified:** SHA-256 integrity hash, byte size, and format validated by server guard.
3. **Active:** Linked to business entities (takes, edits, thumbnails).
4. **Tiered:** Physical file moved to cold storage; active link replaced by archive pointer.
5. **Soft-Deleted:** Marked deleted; binary file removed from cloud drive.

#### Required Fields
- `businessId`: Canonical media identifier (`MED-xxxxxx`).
- `fileName`: Original file name (e.g., `trig_trick_master_v2.mp4`).
- `mimeType`: Standard MIME type (e.g., `video/mp4`, `image/png`).
- `byteSize`: Exact file size in bytes.
- `sha256Hash`: Cryptographic checksum guaranteeing bitstream integrity.
- `mediaCategory`: Classification (`RAW_FOOTAGE`, `MASTER_EDIT`, `THUMBNAIL`, `DIAGRAM`, `AUDIO`).
- `createdAt`: Registration timestamp.

#### Optional Fields
- `width`: Pixel width (e.g., 1080).
- `height`: Pixel height (e.g., 1920).
- `frameRate`: Frames per second (e.g., 30, 60).
- `audioChannels`: Audio channel count (e.g., 2).

#### Immutable Fields
- `businessId`
- `sha256Hash`
- `createdAt`

#### References
- **Internal Entity References:** Association to owning business entity (`entityType`, `entityId`).
- **External-System References:** None directly (stored in `MediaReference`).
- **Media References:** None (this is the root asset descriptor).
- **Archive References:** Linked `ArchiveReference`.

---

### 9.2 Entity: MediaReference

#### Entity
MediaReference

#### Purpose
Encapsulates an external pointer, cloud locator, or streaming URI for accessing a physical media binary stored in an external system.

#### Domain Owner
Media Metadata Domain

#### Business Meaning
The concrete integration link enabling BP-CMS operators and external players to locate, download, or stream a file hosted on Google Drive or an external CDN.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<MediaAssetBusinessId>-REF<Sequence>` (e.g., `MED-000492-REF01`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `MediaReference` N:1 `MediaAsset` (Points to parent logical MediaAsset).

#### Lifecycle
1. **Active:** Resolves to live external file.
2. **Expired:** External temporary token or URL revoked.
3. **Renewed:** Re-authenticated via integration adapter.
4. **Revoked:** File moved or removed.

#### Required Fields
- `businessId`: Compound reference identifier (`MED-xxxxxx-REFxx`).
- `parentMediaAssetId`: Parent media asset (`MED-xxxxxx`).
- `storageProvider`: External provider identifier (`GOOGLE_DRIVE`, `S3`, `CLOUDFRONT`).
- `externalStorageId`: Provider's native file key (e.g., Google Drive `fileId`).
- `locatorUri`: Canonical URI to view or stream the asset.
- `isPrimary`: Boolean indicating whether this is the default streaming locator.
- `createdAt`: Creation timestamp.

#### Optional Fields
- `downloadUri`: Direct binary download URL.
- `thumbnailPreviewUri`: Small thumbnail preview image URL.
- `lastSyncAt`: Timestamp when external existence was last verified.

#### Immutable Fields
- `businessId`
- `parentMediaAssetId`
- `storageProvider`
- `externalStorageId`
- `createdAt`

#### References
- **Internal Entity References:** `parentMediaAssetId` (`MediaAsset`).
- **External-System References:** Google Drive `fileId`, Google Drive `folderId`.
- **Media References:** None.
- **Archive References:** None.

---

### 9.3 Entity: ArchiveReference

#### Entity
ArchiveReference

#### Purpose
Tracks the deep-storage preservation record of historical video projects and raw footage retired from active cloud drives.

#### Domain Owner
Media Metadata Domain

#### Business Meaning
The cold-storage manifest tracking offline archive location, vault container ARN, retrieval ticket, and archive hash for compliance and disaster recovery.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `ARC-` with 6-digit sequence (e.g., `ARC-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `ArchiveReference` 1:1 `MediaAsset` (or 1:1 `Content` project archive manifest).

#### Lifecycle
1. **Pending Archive:** Batch job scheduled for completed content project.
2. **Archived:** Physical bytes verified transferred to cold storage; active drive files purged.
3. **Retrieval Requested:** Request logged to thaw archive for re-release or remastering.
4. **Restored:** Restored back to active cloud drive.

#### Required Fields
- `businessId`: Canonical archive identifier (`ARC-xxxxxx`).
- `targetEntityType`: Classification (`MEDIA_ASSET` or `CONTENT_PROJECT`).
- `targetEntityId`: Business ID of archived entity.
- `archiveProvider`: Provider tag (e.g., `GLACIER`, `COLDLINE`, `OFFLINE_TAPE`).
- `vaultIdentifier`: Storage container or vault name.
- `archivePackageSha256`: Cryptographic checksum of the compressed tar/zip archive container.
- `byteSize`: Size of archived package.
- `archivedAt`: Timestamp of archival completion.

#### Optional Fields
- `retrievalTicketId`: Active ticket identifier when thaw request is pending.
- `retrievalExpiresAt`: Expiration timestamp of restored warm cache.

#### Immutable Fields
- `businessId`
- `targetEntityType`
- `targetEntityId`
- `archivePackageSha256`
- `archivedAt`

#### References
- **Internal Entity References:** `targetEntityId`.
- **External-System References:** Archive vault ID, Cloud storage ARN.
- **Media References:** Linked `MediaAsset`.
- **Archive References:** This is the authoritative archive record.

---

## 10. Review & Creative Assets Domain

### 10.1 Entity: Thumbnail

#### Entity
Thumbnail

#### Purpose
Represents the graphic packaging artwork, hook typography, and visual cover designed to maximize click-through rate (CTR) on short-form platforms.

#### Domain Owner
Reviews & Creative Assets Domain

#### Business Meaning
The high-resolution cover image displaying Telugu headline text, host reaction shot, and curiosity trigger for YouTube Shorts and Instagram Reels (Stage 08 Thumbnail Studio).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `THUMB-` with 6-digit sequence (e.g., `THUMB-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Thumbnail` 1:1 `Content` (Creative cover for content project).
- `Thumbnail` 1:1 `MediaReference` (Points to high-res PNG image in Google Drive).
- `Thumbnail` 1:N `PublishingPackage` (Packaged into distribution release).

#### Lifecycle
1. **Briefed:** Designer assigned hook headline text.
2. **Drafted:** Graphic uploaded to Google Drive.
3. **Reviewed:** Evaluated against mobile readability standards.
4. **Approved:** Designated as official cover for publication.

#### Required Fields
- `businessId`: Canonical thumbnail identifier (`THUMB-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `graphicDesignerUserId`: Designer (`USR-xxxxxx`).
- `mediaReferenceId`: Reference to PNG asset descriptor (`MED-xxxxxx`).
- `headlineTelugu`: Spoken or graphic Telugu hook text on image.
- `variantTag`: A/B test variant label (e.g., `VARIANT_A`, `VARIANT_B`).
- `isApproved`: Boolean confirmation of editorial approval.
- `createdAt`: Timestamp.

#### Optional Fields
- `contrastScore`: Automated or manual visual readability score.
- `fontFamilyUsed`: Telugu typography font designation.

#### Immutable Fields
- `businessId`
- `contentId`
- `createdAt`

#### References
- **Internal Entity References:** `contentId` (`Content`), `graphicDesignerUserId` (`User`), `mediaReferenceId` (`MediaReference`).
- **External-System References:** Google Drive image file ID via `MediaReference`.
- **Media References:** `mediaReferenceId`.
- **Archive References:** None.

---

### 10.2 Entity: SocialReview

#### Entity
SocialReview

#### Purpose
Captures the formal Stage 09 pre-publishing review, verifying vertical 9:16 mobile playback, audio balance, subtitle synchronization, thumbnail hook synergy, and branding compliance.

#### Domain Owner
Reviews & Creative Assets Domain

#### Business Meaning
The smartphone simulator audit gate where an authorized Producer or Reviewer simulates real mobile viewing conditions before content enters final publishing setup.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `SR-` with 6-digit sequence (e.g., `SR-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `SocialReview` N:1 `VideoEdit` (Audits the master video cut).
- `SocialReview` N:1 `Thumbnail` (Audits thumbnail pairing).
- `SocialReview` N:1 `User` (Conducted by an authorized Producer/Reviewer).
- `SocialReview` 1:1 `WorkflowTransition` (Prerequisite evidence for Stage 09 -> Stage 10 transition).

#### Lifecycle
1. **Pending:** Content enters Stage 09 queue.
2. **Under Review:** Reviewer audits playback in 9:16 mobile framing simulator.
3. **Signed Off:** Checklist completed with verdict (`APPROVED`, `REVISION_REQUIRED`).
4. **Sealed Record:** Immutable audit gate record.

#### Required Fields
- `businessId`: Canonical review identifier (`SR-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `targetVideoEditId`: Evaluated video edit (`BP-V-xxxxxx-EDxx`).
- `targetThumbnailId`: Evaluated thumbnail (`THUMB-xxxxxx`).
- `reviewerUserId`: Reviewer (`USR-xxxxxx`).
- `verdict`: Decision (`APPROVED`, `REVISION_REQUIRED`).
- `checklistResponses`: Structured record of 5 mobile simulation checks:
  1. Subtitle safe-zone compliance (no cutoff by platform UI buttons)
  2. Audio voice clarity over background music
  3. Hook text readability on small mobile screens
  4. 3-second visual retention hook strength
  5. Telugu spelling and font rendering
- `reviewedAt`: Timestamp of review completion.

#### Optional Fields
- `feedbackNotes`: Specific guidance if revisions required.

#### Immutable Fields
- Entire entity is immutable upon sign-off.

#### References
- **Internal Entity References:** `contentId` (`Content`), `targetVideoEditId` (`VideoEdit`), `targetThumbnailId` (`Thumbnail`), `reviewerUserId` (`User`).
- **External-System References:** None.
- **Media References:** None directly (references entities holding media references).
- **Archive References:** None.

---

## 11. Publishing & Distribution Domain

### 11.1 Entity: PublishingPackage

#### Entity
PublishingPackage

#### Purpose
Represents the structured staging bundle containing all platform-adapted titles, descriptions, hashtags, pinned comments, and scheduling configuration for release.

#### Domain Owner
Publishing Packages Domain

#### Business Meaning
The multi-platform distribution manifest assembled in Stage 10 (Publishing Setup) that configures how a video project is dispatched to YouTube, Instagram, and Facebook.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `PUB-` with 6-digit sequence (e.g., `PUB-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `PublishingPackage` 1:1 `Content` (Belongs to Content project).
- `PublishingPackage` 1:N `Publication` (Dispatches one publication event per distribution platform).

#### Lifecycle
1. **Drafting:** Content team prepares platform-specific copy.
2. **Ready to Publish:** All copy, hashtags, and pinned comments finalized and validated.
3. **Scheduled:** Release timestamp locked.
4. **Dispatched:** Handed off to publication dispatch adapters (Stage 11).
5. **Closed:** All platform releases completed and verified synced.

#### Required Fields
- `businessId`: Canonical publishing package identifier (`PUB-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `masterVideoEditId`: Approved master cut (`BP-V-xxxxxx-EDxx`).
- `approvedThumbnailId`: Approved thumbnail (`THUMB-xxxxxx`).
- `youtubeTitle`: YouTube Shorts title (max 100 chars, SEO keywords + Telugu curiosity hook).
- `youtubeDescription`: Video description with syllabus tags and solution explanation.
- `youtubeTags`: Array of search tags (e.g., `["BurraPariksha", "TeluguMaths", "Class10SSC"]`).
- `youtubePinnedComment`: Pre-composed engagement question or solution link for pinned comment.
- `scheduledPublishAt`: Target broadcast timestamp.
- `createdAt`: Timestamp.

#### Optional Fields
- `instagramCaption`: Platform-adapted caption for Instagram Reels with up to 10 hashtags.
- `facebookDescription`: Formatted description for Facebook distribution.

#### Immutable Fields
- `businessId`
- `contentId`
- `createdAt`

#### References
- **Internal Entity References:** `contentId` (`Content`), `masterVideoEditId` (`VideoEdit`), `approvedThumbnailId` (`Thumbnail`).
- **External-System References:** None directly (stored in `Publication`).
- **Media References:** References master edit and thumbnail media.
- **Archive References:** None.

---

### 11.2 Entity: Publication

#### Entity
Publication

#### Purpose
Represents the concrete dispatch, execution record, and live release tracking of a PublishingPackage to a specific distribution platform.

#### Domain Owner
Publishing Packages Domain

#### Business Meaning
The individual platform release record tracking the lifecycle of a video post on YouTube Shorts, Instagram Reels, or Facebook Video.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<PublishingPackageBusinessId>-<PlatformCode>` (e.g., `PUB-000088-YT`, `PUB-000088-IG`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Publication` N:1 `PublishingPackage` (Belongs to parent package).
- `Publication` N:1 `Platform` (Targets a specific distribution platform).
- `Publication` 1:N `AnalyticsSnapshot` (Source of ongoing engagement metrics).

#### Lifecycle
1. **Pending:** Queued for dispatch.
2. **Uploading:** Video container being uploaded to platform API.
3. **Processing:** Platform transcode / content check underway.
4. **Live / Published:** Video publicly viewable at permalink (advances project to Stage 11).
5. **Failed:** Dispatch rejected by platform; awaiting retry.
6. **Delisted / Removed:** Video removed from platform by administrator.

#### Required Fields
- `businessId`: Compound publication identifier (`PUB-xxxxxx-XX`).
- `parentPublishingPackageId`: Parent package (`PUB-xxxxxx`).
- `platformCode`: Target platform code (`YOUTUBE`, `INSTAGRAM`, `FACEBOOK`).
- `publicationStatus`: Release status (`PENDING`, `UPLOADING`, `PROCESSING`, `LIVE`, `FAILED`).
- `dispatchedAt`: Timestamp when API call was initiated.

#### Optional Fields
- `externalPlatformContentId`: Native platform ID (e.g., YouTube `videoId`, Instagram `mediaId`).
- `livePermalinkUrl`: Public live viewing URL (e.g., `https://youtube.com/shorts/dQw4w9WgXcQ`).
- `publishedAt`: Timestamp when platform confirmed video is live.
- `errorMessage`: Error diagnostics if dispatch failed.
- `retryCount`: Number of automated or manual dispatch retries.

#### Immutable Fields
- `businessId`
- `parentPublishingPackageId`
- `platformCode`
- `dispatchedAt`

#### References
- **Internal Entity References:** `parentPublishingPackageId` (`PublishingPackage`), `platformCode` (`Platform`).
- **External-System References:** YouTube Video ID, Instagram Media ID, Meta Container ID.
- **Media References:** None.
- **Archive References:** None.

---

### 11.3 Entity: Platform

#### Entity
Platform

#### Purpose
Represents an external public distribution channel where Burra Pariksha publishes content.

#### Domain Owner
Publishing Packages Domain

#### Business Meaning
A configured social or broadcast platform destination (e.g., YouTube Shorts, Instagram Reels, Facebook Watch). Platform is a reference concept, never an owner of the internal BP-CMS workflow.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical platform code string (e.g., `YOUTUBE`, `INSTAGRAM`, `FACEBOOK`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Platform` 1:N `Publication` (Destination for multiple publications).

#### Lifecycle
1. **Configured:** Integration adapter established with API credentials.
2. **Active:** Open for publishing dispatches.
3. **Suspended:** Temporarily disabled (e.g., API quota exhausted).

#### Required Fields
- `platformCode`: Canonical code (`YOUTUBE`, `INSTAGRAM`, `FACEBOOK`).
- `displayName`: Human-readable name (e.g., "YouTube Shorts").
- `supportedAspectRatios`: Array of valid aspect ratios (e.g., `["9:16"]`).
- `maxVideoDurationSeconds`: Platform maximum length limit (e.g., 60 seconds).
- `maxTitleLength`: Platform character limit for titles.

#### Optional Fields
- `apiRateLimitPerDay`: Operational request limit.
- `defaultChannelHandle`: Associated channel username (e.g., `@BurraPariksha`).

#### Immutable Fields
- `platformCode`

#### References
- **Internal Entity References:** None.
- **External-System References:** External API endpoint specifications.
- **Media References:** None.
- **Archive References:** None.

---

## 12. Analytics & Intelligence Domain

### 12.1 Entity: AnalyticsSnapshot

#### Entity
AnalyticsSnapshot

#### Purpose
Captures a raw, immutable point-in-time metrics sample ingested from an external distribution platform for a specific publication.

#### Domain Owner
Analytics Domain

#### Business Meaning
The timestamped metrics reading (views, likes, comments, shares, watch time) queried from YouTube Analytics or Meta Graph API at a specific moment in time (Stage 13 Social Analytics).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<PublicationBusinessId>-SNAP-<Timestamp>` (e.g., `PUB-000088-YT-SNAP-1727800000`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `AnalyticsSnapshot` N:1 `Publication` (Metrics for a specific platform release).

#### Lifecycle
1. **Ingested:** Captured via scheduled ingestion job or manual sync request.
2. **Normalized:** Mapped into BP-CMS standardized analytics metrics.
3. **Immutable Record:** Stored as historical telemetry snapshot.

#### Required Fields
- `businessId`: Compound snapshot identifier.
- `publicationId`: Associated publication (`PUB-xxxxxx-XX`).
- `snapshotTimestamp`: Exact time metrics were queried.
- `viewCount`: Total recorded views.
- `likeCount`: Total recorded likes / upvotes.
- `commentCount`: Total public comments.
- `shareCount`: Total platform shares / reposts.

#### Optional Fields
- `estimatedWatchTimeMinutes`: Total watch duration in minutes.
- `averageViewDurationSeconds`: Mean audience retention length.
- `rawPayloadHash`: Checksum of raw JSON response from platform API.

#### Immutable Fields
- Entire entity is immutable upon ingestion.

#### References
- **Internal Entity References:** `publicationId` (`Publication`).
- **External-System References:** External platform content identifier.
- **Media References:** None.
- **Archive References:** None.

---

### 12.2 Entity: PerformanceRecord

#### Entity
PerformanceRecord

#### Purpose
Maintains a normalized, aggregated evaluation of a content project's overall audience resonance and engagement efficiency across all platforms.

#### Domain Owner
Analytics Domain

#### Business Meaning
The standardized editorial performance card evaluated in Stage 14 (Performance Review), synthesizing multi-platform views, engagement velocity, and retention benchmarking against historical syllabus averages.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `PERF-` with 6-digit sequence (e.g., `PERF-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `PerformanceRecord` 1:1 `Content` (Evaluation of a content project).
- `PerformanceRecord` 1:N `IntelligenceInsight` (Informs pedagogical insights).

#### Lifecycle
1. **Initial Assessment:** Generated 24–48 hours post-publication.
2. **Updated:** Recalculated at 7-day and 30-day performance milestones.
3. **Finalized:** Benchmark tier locked for historical intelligence.

#### Required Fields
- `businessId`: Canonical performance identifier (`PERF-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `aggregatedViews`: Total views summed across all platforms.
- `engagementRatio`: Normalized engagement percentage ((likes + comments + shares) / views * 100).
- `retentionTier`: Benchmark classification (`TOP_10_PERCENT`, `ABOVE_AVERAGE`, `AVERAGE`, `BELOW_AVERAGE`).
- `evaluatedAt`: Timestamp of performance calculation.

#### Optional Fields
- `dropOffPointSeconds`: Significant audience drop-off timestamp in video playback.
- `syllabusResonanceScore`: Relative performance compared to other topics in the same subject.

#### Immutable Fields
- `businessId`
- `contentId`

#### References
- **Internal Entity References:** `contentId` (`Content`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

### 12.3 Entity: IntelligenceInsight

#### Entity
IntelligenceInsight

#### Purpose
Represents strategic pedagogical feedback and curriculum recommendations derived from content performance to guide future question authoring.

#### Domain Owner
Intelligence Domain

#### Business Meaning
The Stage 15 (Performance Intelligence) feedback atom that closes the production loop (Stage 15 -> Stage 01) by identifying high-difficulty topics, common student misunderstandings, and optimal hook formats.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `INTEL-` with 6-digit sequence (e.g., `INTEL-000042`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `IntelligenceInsight` N:1 `PerformanceRecord` (Derived from performance data).
- `IntelligenceInsight` N:1 `Question` (Linked to curriculum topic).
- `IntelligenceInsight` 1:N `Question` (Informs new questions created in Stage 01).

#### Lifecycle
1. **Formulated:** Synthesized from comment themes and performance drop-offs.
2. **Active Recommendation:** Displayed in Question Studio as a prompt preset or curriculum alert.
3. **Applied:** SME adopts insight when creating a new question (`BP-Q-xxxxxx`).
4. **Retired:** Insight superseded by newer curriculum data.

#### Required Fields
- `businessId`: Canonical intelligence identifier (`INTEL-xxxxxx`).
- `targetSubject`: Curriculum subject (e.g., `Class 10 Mathematics`).
- `targetTopic`: Curriculum topic (e.g., `Trigonometric Identities`).
- `insightType`: Category (`CURRICULUM_GAP`, `STUDENT_CONFUSION`, `HIGH_ENGAGEMENT_HOOK`, `PEDAGOGICAL_RETRY`).
- `recommendationSummary`: Actionable directive for scriptwriters and question creators.
- `generatedAt`: Timestamp.

#### Optional Fields
- `sourcePerformanceRecordId`: Performance record triggering this insight.
- `promptTemplatePreset`: Pre-configured AI prompt suggestion for Question Studio.

#### Immutable Fields
- `businessId`
- `generatedAt`

#### References
- **Internal Entity References:** `sourcePerformanceRecordId` (`PerformanceRecord`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

## 13. Workflow Domain

### 13.1 Entity: WorkflowInstance

#### Entity
WorkflowInstance

#### Purpose
Tracks the authoritative progress of a content project across the canonical 15-step linear production journey.

#### Domain Owner
Workflow Domain

#### Business Meaning
The overarching state machine instance enforcing sequential progression, prerequisites, and milestone blockers from ideation to distribution and intelligence.

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `WF-` with 6-digit sequence (e.g., `WF-000088`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `WorkflowInstance` 1:1 `Content` (Manages lifecycle of a content project).
- `WorkflowInstance` 1:N `WorkflowTransition` (Contains sequential history of all stage transitions).

#### Lifecycle
1. **Initialized:** Started at Stage 01 (Question Generation) upon content creation.
2. **Advancing:** Progressing sequentially through stages 01 -> 15.
3. **Loopback:** Sent back to an earlier stage upon review rejection (e.g., Stage 07 -> Stage 06).
4. **Completed:** Successfully reached Stage 15 (Performance Intelligence).
5. **Terminated / Cancelled:** Content cancelled by Producer.

#### Required Fields
- `businessId`: Canonical workflow identifier (`WF-xxxxxx`).
- `contentId`: Associated content project (`BP-C-xxxxxx`).
- `currentStageNumber`: Current active canonical stage integer (1–15).
- `currentStageId`: Canonical stage code (e.g., `01_QUESTION_GENERATION`, `07_FINAL_QC`).
- `workflowStatus`: Operational state (`IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`).
- `startedAt`: Workflow initiation timestamp.
- `updatedAt`: Last state mutation timestamp.

#### Optional Fields
- `blockedReason`: Explanation if workflow is blocked.
- `targetCompletionDate`: Expected delivery deadline.

#### Immutable Fields
- `businessId`
- `contentId`
- `startedAt`

#### References
- **Internal Entity References:** `contentId` (`Content`).
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

### 13.2 Entity: WorkflowTransition

#### Entity
WorkflowTransition

#### Purpose
Captures an immutable historical event record of a validated stage progression or loopback within a WorkflowInstance.

#### Domain Owner
Workflow Domain

#### Business Meaning
The atomic transition record documenting when, why, and by whom content was advanced from one canonical stage to another, verifying prerequisite gates and human sign-off (AP-001, AP-003, AP-009).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Compound identifier: `<WorkflowInstanceBusinessId>-TR<Sequence>` (e.g., `WF-000088-TR01`, `WF-000088-TR02`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `WorkflowTransition` N:1 `WorkflowInstance` (Belongs to parent workflow instance).
- `WorkflowTransition` N:1 `User` (Authorized by an authenticated operator).
- `WorkflowTransition` 1:1 `AuditEvent` (Mirrored in system audit log).

#### Lifecycle
1. **Validated & Recorded:** Created atomically when `validateCanonicalWorkflowTransition()` approves a transition.
2. **Immutable Record:** Stored append-only; cannot be updated or deleted.

#### Required Fields
- `businessId`: Compound transition identifier (`WF-xxxxxx-TRxx`).
- `parentWorkflowInstanceId`: Parent workflow (`WF-xxxxxx`).
- `fromStageNumber`: Originating canonical stage number (1–15).
- `toStageNumber`: Destination canonical stage number (1–15).
- `isLoopback`: Boolean flag indicating whether transition moves backwards in the workflow.
- `actorUserId`: Business ID of operator authorizing transition (`USR-xxxxxx`).
- `humanSignOff`: Boolean confirmation that an authenticated human verified this gate (AP-009).
- `transitionTimestamp`: Exact time of transition.

#### Optional Fields
- `transitionReason`: Rationale for transition or loopback explanation.
- `associatedGateReviewId`: ID of formal review record satisfying prerequisite (e.g., `QV-xxxxxx`, `SR-xxxxxx`).

#### Immutable Fields
- Entire entity is immutable upon creation.

#### References
- **Internal Entity References:** `parentWorkflowInstanceId` (`WorkflowInstance`), `actorUserId` (`User`), `associatedGateReviewId`.
- **External-System References:** None.
- **Media References:** None.
- **Archive References:** None.

---

## 14. Operations & Governance Domain

### 14.1 Entity: Notification

#### Entity
Notification

#### Purpose
Represents an internal operational signal, task assignment notice, or workflow gate alert directed to an authenticated user.

#### Domain Owner
Notifications Domain

#### Business Meaning
The in-app coordination alert that notifies staff members of assignments, review requests, or defect revisions (e.g., "SME Review requested for Question BP-Q-000104").

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `NOTIF-` with 6-digit sequence (e.g., `NOTIF-001290`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `Notification` N:1 `User` (Target recipient).
- `Notification` N:1 `Content` (Associated content project).

#### Lifecycle
1. **Dispatched:** Enqueued and displayed in user's in-app notification center.
2. **Read:** User views notification.
3. **Dismissed:** User clears or acts upon alert.
4. **Archived:** Historical alerts cleared from active view.

#### Required Fields
- `businessId`: Canonical notification identifier (`NOTIF-xxxxxx`).
- `recipientUserId`: Recipient (`USR-xxxxxx`).
- `notificationType`: Classification (`ASSIGNMENT`, `REVIEW_REQUEST`, `GATE_PASSED`, `REVISION_REQUIRED`, `SYSTEM_ALERT`).
- `title`: Short alert headline.
- `message`: Detailed description of action required.
- `isRead`: Boolean read indicator.
- `dispatchedAt`: Timestamp.

#### Optional Fields
- `associatedContentId`: Business ID of linked content project (`BP-C-xxxxxx`).
- `actionTargetUri`: Internal deep-link to relevant CMS workspace.
- `externalEmailDispatchId`: ID of outgoing SMTP delivery if external email was dispatched.

#### Immutable Fields
- `businessId`
- `recipientUserId`
- `dispatchedAt`

#### References
- **Internal Entity References:** `recipientUserId` (`User`), `associatedContentId` (`Content`).
- **External-System References:** External SMTP message ID.
- **Media References:** None.
- **Archive References:** None.

---

### 14.2 Entity: AuditEvent

#### Entity
AuditEvent

#### Purpose
Represents the authoritative, append-only historical event record of all business mutations, authorizations, and data changes across BP-CMS.

#### Domain Owner
Audit Domain

#### Business Meaning
The immutable system ledger entry guaranteeing compliance, operational transparency, and change traceability across the entire platform lifecycle (AP-014).

#### Business Identity vs Technical Storage ID
- **Business Identity:** Canonical prefix `AUD-` with 8-digit sequence (e.g., `AUD-00049281`).
- **Technical Storage ID:** Database surrogate identifier.

#### Relationships
- `AuditEvent` N:1 `User` (Actor who performed the mutation).
- `AuditEvent` N:1 `Content` (Optional content project context).

#### Lifecycle
1. **Appended:** Written atomically with business transaction.
2. **Immutable Record:** Strictly read-only; deletion or modification is architecturally prohibited.

#### Required Fields
- `businessId`: Canonical audit identifier (`AUD-xxxxxxxx`).
- `actorUserId`: Operator initiating the event (`USR-xxxxxx`).
- `actorRole`: Active operational role at time of event.
- `actionVerb`: Action performed (e.g., `QUESTION_CREATED`, `QUESTION_APPROVED`, `SCRIPT_LOCKED`, `QC_REJECTED`, `WORKFLOW_TRANSITION`).
- `targetEntityType`: Domain entity affected (e.g., `Question`, `Script`, `WorkflowInstance`).
- `targetEntityId`: Business ID of affected entity.
- `timestamp`: High-precision event timestamp.

#### Optional Fields
- `beforeStateSnapshot`: JSON or serialized state of entity prior to mutation.
- `afterStateSnapshot`: JSON or serialized state of entity following mutation.
- `clientIpAddress`: Client network IP address.
- `userAgent`: Client browser/device string.
- `correlationId`: Request tracking identifier linking related operations.

#### Immutable Fields
- Entire entity is strictly immutable upon creation.

#### References
- **Internal Entity References:** `actorUserId` (`User`), `targetEntityId`.
- **External-System References:** None (internal audit authority).
- **Media References:** None.
- **Archive References:** None.

---

## 15. Cross-Domain Relationships

### 15.1 Relationship Matrix

| Source Entity | Target Entity | Relationship Meaning | Cardinality | Conceptual Invariant |
| :--- | :--- | :--- | :---: | :--- |
| `User` | `Role` | Possesses operational role | N:M | Every active user must hold at least 1 role |
| `Role` | `Capability` | Grants granular permission | N:M | Permissions evaluated server-side (AP-004) |
| `Content` | `Question` | Pedagogical curriculum core | 1:1 | Every content project originates from 1 question |
| `Content` | `Script` | Spoken teleprompter script | 1:1 | 1 active presenter script per content project |
| `Content` | `Video` | Video production project | 1:1 | 1 video project encapsulating filming and editing |
| `Content` | `Thumbnail` | Graphic cover artwork | 1:1 | 1 primary cover thumbnail per content project |
| `Content` | `PublishingPackage` | Multi-platform publishing staged | 1:1 | 1 staging package per distribution release |
| `Content` | `WorkflowInstance` | 15-step pipeline progression | 1:1 | Exactly 1 workflow instance per content project |
| `Question` | `QuestionVersion` | Historical revision history | 1:N | Exactly 1 version is the active approved version |
| `QuestionVersion` | `QuestionReview` | Verification audit by SME | 1:N | Stage 02 gate requires 1 approved review (AP-009) |
| `Script` | `ScriptVersion` | Presenter copy revision | 1:N | Frozen when video recording commences |
| `Video` | `VideoTake` | Studio filming camera take | 1:N | Raw camera takes captured in studio |
| `Video` | `VideoEdit` | Post-production rendered cut | 1:N | Exactly 1 edit cut is the approved master |
| `VideoEdit` | `SocialReview` | Pre-publishing mobile QC audit | 1:N | Stage 09 gate requires 1 approved review |
| `VideoTake` | `MediaReference` | External raw footage locator | 1:1 | Points to Google Drive raw file (AP-007, AP-008) |
| `VideoEdit` | `MediaReference` | External master cut locator | 1:1 | Points to Google Drive master MP4 |
| `Thumbnail` | `MediaReference` | External thumbnail image locator | 1:1 | Points to Google Drive PNG graphic |
| `MediaAsset` | `MediaReference` | URI resolution endpoints | 1:N | Logical asset can have multiple locators |
| `MediaAsset` | `ArchiveReference` | Cold storage preservation | 1:1 | Linked when asset is tiered to deep archive |
| `PublishingPackage` | `Publication` | Platform release execution | 1:N | Dispatches 1 publication per platform |
| `Publication` | `Platform` | Distribution channel destination | N:1 | Platform is an external integration reference |
| `Publication` | `AnalyticsSnapshot` | Timestamped metrics samples | 1:N | Periodic snapshots queried from platform API |
| `Content` | `PerformanceRecord` | Aggregated audience score | 1:1 | Standardized performance card |
| `PerformanceRecord` | `IntelligenceInsight` | Pedagogical recommendations | 1:N | Loops insights back to Question Studio (Step 15 -> 01) |
| `WorkflowInstance` | `WorkflowTransition` | Validated progression steps | 1:N | Immutable history of all stage advances |
| `User` | `Notification` | Operational task alert | 1:N | In-app alerts to coordinate production handoffs |
| `User` | `AuditEvent` | Authoritative system log | 1:N | Immutable append-only audit trail (AP-014) |

---

## 16. Lifecycle Model

The BP-CMS business entities progress through structured lifecycles that reflect real-world educational media production:

```
[Creation] ──► [Drafting / Rework] ──► [Formal Review] ──► [Approved Gate] ──► [Distribution / Active] ──► [Archived]
     │                                        │
     └── (AI Assist / Human Entry)            └── (Defect Identified ──► Loopback)
```

### 16.1 Lifecycle Summary by Entity Group

| Entity Group | Creation Trigger | Modification / Revision | Review / Gate Checkpoint | Operational Completion | Archival / Retirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Questions** | Manual authoring or AI suggestion | New `QuestionVersion` created on rework | Stage 02 `QuestionReview` (10-point SME check) | Approved for scriptwriting and teleprompter | Retired from active syllabus circulation |
| **Scripts** | Content planning initiated | New `ScriptVersion` created on edit | Producer review / pacing check | Locked when filming begins | Archived with content project |
| **Videos** | Scheduled filming slot | Multiple `VideoTake` and `VideoEdit` iterations | Stage 07 Final QC & Stage 09 `SocialReview` | Master cut verified and signed off | Raw takes tiered to cold storage |
| **Thumbnails** | Graphic brief assigned | Re-exported PNG revisions | Mobile readability review | Approved for publication package | Stored with published project |
| **Publishing** | Video master approved | Platform copy adjustments | Stage 10 Publishing Setup review | Dispatched and verified live on platforms | Archived after campaign window |
| **Analytics** | Scheduled ingestion jobs | New snapshots appended | Stage 14 Performance Review | Finalized performance record | Historical snapshots retained in warehouse |
| **Workflow** | Content project created | Transitions advance stage (1–15) | Human-gated stage checkpoints (AP-009) | Reaches Stage 15 (Intelligence) | Project lifecycle closed |
| **Audit** | Every business mutation | Strictly immutable (no modification) | System verification | Append-only ledger entry | Indefinite legal preservation |

---

## 17. Authoritative vs Derived Data

To prevent conflicting data ownership, every business data element in BP-CMS is categorized into one of four structural authority tiers:

| Authority Tier | Definition | BP-CMS Entities in this Tier | Governance Invariant |
| :--- | :--- | :--- | :--- |
| **AUTHORITATIVE** | The primary, source-of-truth business data originated and maintained within BP-CMS. | `User`, `Role`, `Capability`, `Question`, `QuestionVersion`, `QuestionReview`, `Content`, `Script`, `ScriptVersion`, `Video`, `Thumbnail`, `SocialReview`, `PublishingPackage`, `WorkflowInstance`, `WorkflowTransition`, `Notification` | Must never be overwritten by external provider webhooks or client defaults. |
| **DERIVED** | Calculated, aggregated, or synthesized data computed by internal BP-CMS engines from authoritative or snapshot data. | `PerformanceRecord`, `IntelligenceInsight`, `aggregatedViews`, `engagementRatio`, `retentionTier`, `estimatedWordCount` | Deterministically recalculable; if invalidated, recomputed from underlying records. |
| **EXTERNAL REFERENCE** | Pointers, locators, and foreign identifiers representing assets or resources hosted in external systems. | `MediaReference`, `Platform`, `externalPlatformContentId`, `livePermalinkUrl`, `driveFileId`, `driveFolderUrl` | BP-CMS owns the reference; external provider owns the physical payload or remote state. |
| **HISTORICAL RECORD** | Immutable, append-only evidence recording events, audits, or point-in-time metrics that must never change once written. | `AuditEvent`, `AnalyticsSnapshot`, `ArchiveReference`, `QuestionReview` verdicts, `WorkflowTransition` records | Modification and deletion are strictly prohibited (AP-014). |

---

## 18. Entity Decision Register

All 27 candidate entities from the Stage 06 brief have been rigorously evaluated and assigned formal architectural dispositions:

| Candidate Entity | Domain Owner | Decision | Architectural Rationale |
| :--- | :--- | :---: | :--- |
| **1. User** | Identity Domain | **ACCEPTED** | Essential operational participant and authorization subject. |
| **2. Role** | Roles Domain | **ACCEPTED** | Authoritative functional responsibility profile grouping capabilities. |
| **3. Capability** | Capabilities Domain | **ACCEPTED** | Fine-grained security permission gate evaluated server-side. |
| **4. Question** | Question Domain | **ACCEPTED** | Core curriculum asset and pedagogical atom of Burra Pariksha. |
| **5. QuestionVersion** | Question Domain | **ACCEPTED** | Immutable revision history of question text, options, and Telugu math proof. |
| **6. QuestionReview** | Reviews Domain | **ACCEPTED** | Formal Stage 02 SME verification audit checklist and verdict gate (AP-009). |
| **7. Content** | Content Domain | **ACCEPTED** | Central aggregate root uniting question, script, video, thumbnail, and publishing. |
| **8. Script** | Scripts Domain | **ACCEPTED** | Vertical short-form presenter teleprompter script entity. |
| **9. ScriptVersion** | Scripts Domain | **ACCEPTED** | Immutable revision of spoken presenter teleprompter copy. |
| **10. Video** | Videos Domain | **ACCEPTED** | Video production project uniting raw takes, edit cuts, and final master. |
| **11. VideoTake** | Videos Domain | **ACCEPTED** | Individual studio filming take linked to raw footage in Google Drive. |
| **12. VideoEdit** | Videos Domain | **ACCEPTED** | Individual post-production rendered cut linked to master MP4 in Google Drive. |
| **13. MediaAsset** | Media Metadata Domain | **ACCEPTED** | Logical metadata catalog descriptor for digital media files (AP-008). |
| **14. MediaReference** | Media Metadata Domain | **ACCEPTED** | External URI locator / Google Drive pointer for media binaries (AP-007). |
| **15. ArchiveReference** | Media Metadata Domain | **ACCEPTED** | Cold-storage manifest tracking deep-archived project assets. |
| **16. Thumbnail** | Creative Assets Domain | **ACCEPTED** | High-resolution cover artwork and hook headline text. |
| **17. SocialReview** | Reviews Domain | **ACCEPTED** | Stage 09 pre-publishing 9:16 mobile framing and playback QC audit gate. |
| **18. PublishingPackage**| Publishing Domain | **ACCEPTED** | Multi-platform staged release bundle (titles, tags, pinned comments). |
| **19. Publication** | Publishing Domain | **ACCEPTED** | Concrete execution record of a release to an individual platform. |
| **20. Platform** | Publishing Domain | **ACCEPTED** | External distribution channel destination reference (YouTube, Instagram). |
| **21. AnalyticsSnapshot**| Analytics Domain | **ACCEPTED** | Raw point-in-time metrics sample ingested from external platform APIs. |
| **22. PerformanceRecord**| Analytics Domain | **ACCEPTED** | Normalized, aggregated audience resonance and retention card. |
| **23. IntelligenceInsight**| Intelligence Domain | **ACCEPTED** | Pedagogical recommendations looped back into Question Studio (Step 15 -> 01). |
| **24. WorkflowInstance** | Workflow Domain | **ACCEPTED** | State machine instance governing canonical 15-step pipeline progression. |
| **25. WorkflowTransition**| Workflow Domain | **ACCEPTED** | Immutable historical record of validated stage advances and loopbacks. |
| **26. Notification** | Notifications Domain | **ACCEPTED** | Internal operational task alert and production coordination signal. |
| **27. AuditEvent** | Audit Domain | **ACCEPTED** | Authoritative append-only legal and operational mutation ledger (AP-014). |

### 18.1 Proposed Additions Register

| Proposed Addition | Conceptual Owner | Business Rationale | Disposition in Stage 06 |
| :--- | :--- | :--- | :---: |
| **QualityControlReview** (`QCReview`) | Reviews Domain | In the canonical 15-step workflow, Stage 07 is Final QC, where a 6-point technical and editorial check (audio loudness, subtitle sync, video resolution, color) is conducted on `VideoEdit`. Candidate 6 is `QuestionReview` (Stage 02) and Candidate 17 is `SocialReview` (Stage 09). Currently, Stage 07 QC is represented as a review sign-off attribute on `VideoEdit` or an audit event. A dedicated `QualityControlReview` entity is formally proposed to standardize review modeling across all three review checkpoints (Stages 02, 07, 09). | **PROPOSED ADDITION**<br>(Documented only; NOT implemented in application code). |

---

## 19. Persistence Deferment

Stage 06 is strictly a business domain modeling stage. To prevent premature architectural constraints, the following persistence implementation details are explicitly and formally deferred to Stage 07+:

1. **No SQL Database Tables:** This document does not define PostgreSQL tables, primary keys, foreign keys, or database data types (e.g., `VARCHAR`, `INTEGER`, `BIGINT`, `JSONB`).
2. **No Google Sheets Persistence:** This document does not define Google Sheets tabs, spreadsheet ranges, row schemas, or cell formulas.
3. **No Database Constraints & Indexes:** No unique constraints, composite indexes, B-tree indexes, or cascade deletion rules are declared.
4. **No ORM Models:** No Drizzle ORM schemas, Prisma schemas, or TypeORM entity classes are declared or written.
5. **No Migration Scripts:** No SQL DDL migrations or database migration files are generated.
6. **No Persistence Adapters:** No repository interfaces, database connection pools, or SQL queries are implemented.

---

## 20. API Deferment

Stage 06 does not define or implement application communication interfaces. The following API and presentation concerns are explicitly deferred:

1. **No REST Endpoints:** No Express route handlers, URLs (e.g., `POST /api/questions`), or HTTP verbs are declared.
2. **No DTO Schemas:** No request Data Transfer Objects (DTOs), response DTOs, or input validation schemas (Zod, Joi) are implemented.
3. **No GraphQL Schemas:** No GraphQL types, queries, or mutations are declared.
4. **No Frontend Forms or UI Components:** No React components, UI forms, or client-side controllers are modified or introduced.

---

## 21. Traceability Matrix

The domain entities defined in this document trace directly to accepted requirements, acceptance criteria, architecture principles, and system boundaries:

| Domain Entity | Stage 01 Requirements | Stage 02 Acceptance Criteria | Stage 04 Architecture Principles | Stage 05 System Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **User, Role, Capability** | Security & RBAC Specs | AC-01: Access Control Gates | AP-004: Backend Auth Authority<br>AP-006: Frontend Boundary | Domain 01: Identity<br>Domain 02: Users<br>Domain 03: Roles<br>Domain 04: Capabilities |
| **Question, QuestionVersion** | Question Studio Specs | AC-02: Pedagogical Integrity | AP-005: Backend Business Rules<br>AP-010: Single State Ownership | Domain 05: Questions |
| **QuestionReview** | Verification Audit Specs | AC-03: SME Review Gate | AP-009: Human-Gated AI<br>AP-014: Authoritative Audit | Domain 10: Reviews |
| **Content** | Production Core Specs | AC-04: Production Journey | AP-001: 15-Step Workflow<br>AP-010: Single State Ownership | Domain 07: Videos / Content Core |
| **Script, ScriptVersion** | Teleprompter & Pacing Specs | AC-05: Script Pacing Gate | AP-005: Backend Business Rules | Domain 06: Scripts |
| **Video, VideoTake, VideoEdit** | Studio & Post-Production | AC-06: Video QC Verification | AP-007: External Media Binaries<br>AP-008: App Media References | Domain 07: Videos |
| **MediaAsset, MediaReference, ArchiveReference** | Media Storage Specs | AC-07: Media Reference Integrity | AP-007: External Media Storage<br>AP-008: Internal Media References | Domain 08: Media Metadata |
| **Thumbnail** | Thumbnail Studio Specs | AC-08: Mobile Thumbnail Readability | AP-008: App Media References | Domain 10: Reviews / Creative |
| **SocialReview** | Pre-Publishing Simulation | AC-09: 9:16 Simulator Gate | AP-009: Human-Gated AI | Domain 10: Reviews |
| **PublishingPackage, Publication, Platform** | Multi-Platform Packaging | AC-10: Publishing Dispatch | AP-002: Stage vs Status<br>AP-010: Single State Ownership | Domain 11: Publishing Packages |
| **AnalyticsSnapshot, PerformanceRecord** | Social Analytics Specs | AC-11: Standardized Analytics | AP-002: Stage vs Status | Domain 12: Analytics |
| **IntelligenceInsight** | Intelligence Loop Specs | AC-12: Intelligence Feedback | AP-001: 15-Step Workflow Loop | Domain 13: Intelligence |
| **WorkflowInstance, WorkflowTransition** | Workflow Transition Engine | AC-13: Canonical Transition Check | AP-001: 15-Step Workflow<br>AP-003: Authoritative Transition | Domain 09: Workflow |
| **Notification** | Operations Notifications | AC-14: Team Alert Dispatch | AP-005: Backend Business Rules | Domain 14: Notifications |
| **AuditEvent** | System Audit & Governance | AC-15: Immutable Audit Ledger | AP-014: Authoritative Audit Log | Domain 15: Audit |

---

## 22. Non-Requirements (Strictly Excluded from Stage 06)

To ensure controlled execution, the following activities are strictly prohibited and non-functional for Stage 06:

1. **No Database Implementation:** Zero SQL tables, migrations, column types, or database connections.
2. **No Application Source Code Changes:** Zero TypeScript files in `src/` modified or created.
3. **No Package Dependency Changes:** `package.json` and `package-lock.json` remain 100% untouched.
4. **No API Routes:** Zero Express endpoints, routes, or middleware added.
5. **No UI Changes:** Zero frontend components, pages, or styling changed.
6. **No Cloud Infrastructure:** Zero cloud databases, queues, or hosting resources provisioned.
7. **No External Integration Mutations:** Zero live API calls to Google Drive, YouTube, Meta, or Google Gemini.
8. **No Live Production Data Changes:** Production Google Sheets and Google Drive directories remain untouched.

---

## 23. Stage 06 Verification Gate

The following checklist must be satisfied to establish completion of Stage 06:

- [x] Authoritative document `docs/architecture/06-DOMAIN-MODEL.md` created.
- [x] All 27 candidate entities accounted for without omission or silent merging.
- [x] Every entity specifies: Purpose, Domain Owner, Business Meaning, Relationships, Lifecycle, Required Fields, Optional Fields, Immutable Fields, and References.
- [x] Clear distinction between Business Identity and Technical Storage ID for every entity.
- [x] Single domain ownership established for every entity (AP-010).
- [x] Versioning model rigorously defined for `QuestionVersion` and `ScriptVersion`.
- [x] Review model defined enforcing human-gated checkpoints (AP-009).
- [x] Media model enforces reference ownership vs external binary storage (AP-007, AP-008).
- [x] Video hierarchy distinguishes `Video`, `VideoTake`, and `VideoEdit`.
- [x] Publishing model distinguishes intent, execution, and external platform.
- [x] Analytics model distinguishes raw snapshot, normalized record, and intelligence insight.
- [x] Workflow model preserves the canonical 15-step linear progression (AP-001 through AP-006).
- [x] Notification model distinguishes in-app intent from external email delivery.
- [x] Audit model establishes immutable internal business event authority (AP-014).
- [x] Cross-Domain Relationship Matrix and Conceptual Map completed.
- [x] Authoritative vs Derived Data Matrix established.
- [x] Entity Decision Register completed with 27 accepted entities and 1 proposed addition (`QualityControlReview`).
- [x] Persistence deferment explicitly declared.
- [x] API deferment explicitly declared.
- [x] Full traceability to Stages 01, 02, 04, and 05 documented.
- [x] Out-of-scope non-requirements explicitly cataloged.
- [x] Application source code, package.json, and infrastructure remain 100% untouched.
- [x] Codebase lint and compilation pass cleanly.

---

## 24. Closure Record

### 24.1 Acceptance Table

| Verification Item | Specification | Result |
| :--- | :--- | :---: |
| Canonical 27 Candidate Entities Accounted For | 27 of 27 entities defined | VERIFIED |
| Business Identity vs Technical Key Distinguished | All 27 entities specify business ID | VERIFIED |
| Single Domain Ownership Established | AP-010 compliance verified | VERIFIED |
| Media Reference vs Binary Storage Separation | AP-007 and AP-008 compliance verified | VERIFIED |
| Canonical 15-Step Workflow Invariant Preserved | AP-001 and AP-003 compliance verified | VERIFIED |
| Human-Gated Review & AI Subordination Preserved | AP-009 compliance verified | VERIFIED |
| Cross-Domain Relationship Matrix Defined | Full cardinality & invariant mapping | VERIFIED |
| Entity Decision Register Documented | 27 accepted, 0 deferred, 1 proposed addition | VERIFIED |
| Persistence & API Deferment Declared | No SQL / No DTOs / No Endpoints | VERIFIED |
| Non-Requirements Enforced | Zero code / Zero schema / Zero infra | VERIFIED |
| Traceability to Stages 01, 02, 04, 05 | Comprehensive mapping verified | VERIFIED |
| Codebase Lint Verification (`npm run lint`) | Zero errors | PASSED |
| Production Build Compilation (`npm run build`) | Zero errors | PASSED |
| Implementation Status | Complete | COMPLETE |
| Technical Verification | Google AI Studio verification passed | PASSED |
| GitHub Verification | Baseline & verification passed | PASSED |
| Stage Closure | Stage 06 closed per routine governance | CLOSED |

```
================================================================================
STAGE 06 — DOMAIN MODEL
IMPLEMENTATION: COMPLETE
TECHNICAL VERIFICATION: PASSED
GITHUB VERIFICATION: PASSED
STAGE 06 CLOSED: YES
STAGE 07: NOT STARTED
================================================================================
```

STAGE 06 CLOSED: YES

NEXT STAGE:
STAGE 07 — NOT STARTED
