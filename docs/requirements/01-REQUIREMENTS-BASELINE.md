# Burra Pariksha CMS
# 01 — Requirements Baseline

Stage: 01 — Requirements Baseline

Status:
ACCEPTED

Implementation Status:
REQUIREMENTS BASELINE COMPLETE

Approval:
PRODUCT OWNER ACCEPTED

Purpose:
Defines what BP-CMS must become before architecture,
contracts and implementation decisions are finalized.

---

## 01. Document Control

| Attribute | Specification |
| :--- | :--- |
| **Document Name** | BP-CMS Stage 01 Requirements Baseline |
| **File Path** | `docs/requirements/01-REQUIREMENTS-BASELINE.md` |
| **Stage** | 01 — Requirements Baseline |
| **Status** | **ACCEPTED** |
| **Version** | `1.0.0` |
| **Acceptance Status** | **PRODUCT OWNER ACCEPTED** |
| **Implementation Status** | **REQUIREMENTS BASELINE COMPLETE (100%)** |
| **Scope** | Functional & Non-Functional Requirements (WHAT BP-CMS must become) |
| **Owner** | Burra Pariksha Product Owner / Engineering Governance |
| **Last Updated** | 2026-10-01 |
| **Implementation Restriction** | Documentation / Governance Only. No application code, database schema, infrastructure, or architecture implementation permitted during Stage 01. |
| **Next Stage** | **STAGE 02 — BUSINESS ACCEPTANCE CRITERIA** |

### Historical Document & Provenance Reference
- **Predecessor Discovery Document:** `01-product-truth.md` (Stage 1 — Product & Workflow Truth, forensic analysis artifact dated 2026-09-28).
- **Engineering Blueprint Document:** `docs/engineering/30-master-plan/03-15-stage-canonical-pipeline.md` (Engineering specification artifact).
- **Canonical Status:** This document (`docs/requirements/01-REQUIREMENTS-BASELINE.md`) is the sole authoritative, versioned, and accepted Requirements Baseline for BP-CMS. Prior files are preserved intact as historical audit records and must not be deleted.

---

## 02. Purpose

This document establishes the official, unambiguous Requirements Baseline for the Burra Pariksha Content Management System (BP-CMS). 

> **Core Governance Principle:**  
> **This document defines WHAT BP-CMS must become.**  
> **Technology decisions belong to later architecture stages.**

The purpose of this baseline is to:
1. Formulate the definitive functional, non-functional, operational, and business requirements accepted by the Product Owner.
2. Establish a frozen baseline against which subsequent business acceptance criteria (Stage 02), architecture specifications (Stage 03), data contracts, API designs, and implementations will be rigorously validated.
3. Prevent architectural scope creep, premature technology lock-in, and unauthorized implementation before contracts and specifications are finalized.
4. Provide absolute clarity across all 15 stages of the educational content manufacturing lifecycle.

---

## 03. Product Definition

### What is Burra Pariksha CMS?
Burra Pariksha CMS (BP-CMS) is a specialized, production-grade content manufacturing and performance intelligence operating system for competitive examination preparation media. It operates as an industrial-standard digital assembly line, transforming raw syllabus domains and academic problem concepts into verified, produced, distributed, and measured short-form and long-form educational video assets.

### Who Uses It?
BP-CMS is used by a coordinated cross-functional content production team, including:
- **Curricular Specialists & Question Creators:** Formulate syllabus-aligned academic problems and distractor rationales.
- **Academic Reviewers & Verifiers:** Perform rigorous peer verification to guarantee zero mathematical or pedagogical defects.
- **Script Writers & Teleprompter Editors:** Craft spoken presentation scripts formatted for spoken rhythm and visual engagement.
- **Studio Hosts & Filming Crew:** Record on-camera delivery with teleprompter integration and manage raw video takes.
- **Video Editors & Motion Graphic Artists:** Assemble high-retention video cuts with bilingual captions and audio mastering.
- **Quality Control (QC) Officers:** Certify broadcast compliance, audio loudness (-14 LUFS), and presentation fidelity.
- **Thumbnail Designers & Visual Artists:** Produce high-CTR, mobile-optimized visual packaging and A/B variations.
- **Community & Publishing Managers:** Orchestrate multi-platform staging, social copy, hashtags, and pinned comment engagement.
- **Analytics & Intelligence Researchers:** Harvest cross-platform engagement telemetry to diagnose viewer drop-off.
- **System Administrators & Operations Leads:** Oversee pipeline velocity, role assignments, platform security, and audit integrity.

### What Problem Does It Solve?
High-velocity educational media production typically suffers from fragmented communication, uncoordinated handoffs, human error in mathematical solutions, erratic video quality, unverified publication links, and a total disconnect between post-publish performance metrics and future curriculum planning. 

BP-CMS solves this by replacing ad-hoc spreadsheets, chat channels, and disparate drives with a single unified, sequential assembly line governed by deterministic quality gates, multi-user assignment controls, and closed-loop performance intelligence.

### Product Vision
To serve as the premier high-reliability content manufacturing OS for competitive exam education, scaling high-quality bilingual video delivery across major digital platforms with verifiable academic precision and algorithmic audience resonance.

### Operational Purpose
The operational purpose of BP-CMS is to enforce zero-defect quality gates across the end-to-end content lifecycle, ensuring that every published question, script, video, thumbnail, and social package is academically accurate, pedagogically sound, broadcast-ready, and continuously optimized through empirical audience intelligence.

---

## 04. Product Scope

### In Scope
1. **Canonical 15-Stage Pipeline:** End-to-end management from concept genesis to closed-loop intelligence.
2. **Question Authoring & Verification:** Bilingual problem formulation, 4 distinct options, single definitive answer, step-by-step solution proofs, and non-author verification sign-off.
3. **Studio Scripting & Teleprompter Orchestration:** Spoken explanation formatting, timing calculations, pacing cues, and in-studio teleprompter scrolling.
4. **Filming & Raw Footage Registration:** Recording session logging, take selection, raw footage registration, and integrity checksum tracking.
5. **Editing Bay & QC Certification:** Post-production tracking, subtitle generation, audio loudness normalization (-14 LUFS standard), and formal pass/fail QC certification.
6. **Packaging & Social Review:** Thumbnail design tracking, A/B packaging, consolidated social review (video + thumbnail + copy + pinned comment), and editorial sign-off.
7. **Publishing Orchestration & Verification:** Multi-platform publishing setup, release scheduling, live publication verification, and live URL checks.
8. **Cross-Platform Syndication & Sync:** Replication across primary and secondary distribution channels, audio pairing checks, and pinned engagement comment verification.
9. **Analytics Harvesting & Performance Review:** Cross-platform metric ingestion (views, retention curves, CTR, likes, comments) and editorial drop-off diagnosis.
10. **Closed-Loop Intelligence Loop:** Derivation of actionable pedagogical and editorial directives from audience data to drive future Step 01 batches.
11. **Multi-User Collaboration & RBAC:** Multi-user operational workspace, role-based capability boundaries, and task assignments.
12. **Audit Logging & Governance:** Comprehensive, tamper-evident audit trails recording every workflow transition, review gate, and administrative action.
13. **Assistive AI Framework:** AI acceleration for drafting, translation, and analysis subject to strict human-in-the-loop review.

### Out of Scope / External Systems (Defined Functionally)
The following are external systems that interface with BP-CMS; BP-CMS governs metadata, references, and orchestrations without re-implementing these external systems:
1. **External Binary Media Storage:** Active media and raw footage are stored in external storage systems (current operational direction: Google Drive). BP-CMS stores metadata, identifiers, and access references. BP-CMS does not store multi-gigabyte video binaries directly in its operational transactional database.
2. **Video Hosting & Distribution Platforms:** YouTube, Instagram, Facebook, and other external distribution networks are third-party endpoints. BP-CMS integrates via platform APIs or guided operator workflows.
3. **Generative AI Providers:** External AI model endpoints (e.g., Google Gemini) provide generative capabilities via API boundaries.
4. **External Deep Cold Archive Providers:** Long-term archival of raw camera rushes beyond active operational retention is managed via external archive mechanisms (e.g., manual cold cloud or enterprise archive tiers). The selection of specific archive providers remains an architectural decision.
5. **External Notification & Delivery Services:** External email/push/webhook delivery infrastructure.

---

## 05. Target Users

The functional user categories operating BP-CMS are:

1. **Administrators:**
   - Operational governance, user provisioning, permission configuration, emergency stage overrides, system-wide configuration, and audit inspection.
2. **Content / Question Team:**
   - Subject matter experts and question creators responsible for authoring questions, defining option sets, creating solution proofs, and responding to verification feedback.
3. **Script / Content Team:**
   - Script writers and pedagogical adapters responsible for converting academic solutions into engaging spoken scripts with visual directives and pacing markers.
4. **Production Team:**
   - Studio presenters, camera operators, teleprompter operators, and filming leads who execute on-camera recording, log takes, and ingest raw footage.
5. **Design Team:**
   - Graphic designers and thumbnail specialists responsible for visual packaging, hook typography, and thumbnail variants.
6. **Video Editing & Post-Production Team:**
   - Video editors and motion graphic artists who assemble rough and fine cuts, add overlays, burn subtitles, master audio, and submit assets for QC.
7. **Quality Control (QC) Officers:**
   - Independent verification specialists who inspect video/audio fidelity, loudness compliance, and educational correctness prior to packaging.
8. **Publishing / Social Team:**
   - Community managers, social media coordinators, and publishing operators who manage social copy, tags, scheduling, distribution execution, and post-live verification.
9. **Analytics / Intelligence Users:**
   - Data analysts, performance researchers, and content strategists who monitor viewer retention, diagnose audience drop-offs, and generate next-question directives.
10. **Management / Oversight Users:**
    - Executive editors, channel directors, and curriculum leads who monitor pipeline throughput, team velocity, and overall editorial quality.

> **Governance Invariant:**  
> **The final role → capability → page/action matrix is a later architecture/security/RBAC deliverable.**

---

## 06. Canonical 15-Step Workflow

BP-CMS is organized around a strictly defined, sequential, 15-step business workflow. Every content item progresses through these stages governed by verifiable quality gates:

```
[01 — Question Generation]
           ↓
[02 — Question Verification]
           ↓
[03 — Audience Script]
           ↓
[04 — Teleprompter & Filming]
           ↓
[05 — Raw Video]
           ↓
[06 — Editing Bay]
           ↓
[07 — Final QC]
           ↓
[08 — Thumbnail]
           ↓
[09 — Social Review]
           ↓
[10 — Publishing Setup]
           ↓
[11 — Published]
           ↓
[12 — Platform Sync]
           ↓
[13 — Analytics]
           ↓
[14 — Performance Review]
           ↓
[15 — Intelligence Loop]
           ↓
(Directives Feed Back to 01 — Question Generation)
```

### Canonical Step Inventory

| Step Number | Canonical Step Name | Core Business Objective |
| :---: | :--- | :--- |
| **01** | **Question Generation** | Ingest or author syllabus-aligned competitive exam questions with bilingual text, 4 options, single key, and detailed proof. |
| **02** | **Question Verification** | Independent multi-criteria academic verification (math proof, syllabus, clarity, single correct key) with anti-self-approval. |
| **03** | **Audience Script** | Author spoken teleprompter script optimized for spoken rhythm, visual callouts, hook pacing, and timing constraints. |
| **04** | **Teleprompter & Filming** | Studio recording orchestration, synchronized teleprompter playback, take logging, and selection of primary camera take. |
| **05** | **Raw Video** | Registration of raw filmed footage, duration/format validation, checksum recording, and external storage reference linking. |
| **06** | **Editing Bay** | Post-production assembly, dynamic motion graphics, bilingual subtitle integration, and video export rendering. |
| **07** | **Final QC** | Rigorous multi-point quality certification (audio loudness at -14 LUFS, video sync, typo check, academic accuracy). |
| **08** | **Thumbnail** | Creation, validation, and association of high-contrast, mobile-optimized thumbnail packaging and A/B variations. |
| **09** | **Social Review** | Holistic editorial review of the combined package (video + thumbnail + title + description + hashtags + pinned comment). |
| **10** | **Publishing Setup** | Multi-platform scheduling, visibility configuration, target channel selection, and pre-publish parameter lockdown. |
| **11** | **Published** | Distribution execution across target platforms (YouTube, Instagram, etc.) and registration of live publication records. |
| **12** | **Platform Sync** | Post-live verification, live URL responsiveness check, secondary channel replication, and pinned engagement comment validation. |
| **13** | **Analytics** | Cross-platform audience telemetry harvesting (views, impressions, CTR, retention drop-off curves, likes, comments). |
| **14** | **Performance Review** | Editorial and pedagogical evaluation of audience retention, hook effectiveness, topic appeal, and student misconception points. |
| **15** | **Intelligence Loop** | Synthesis of empirical findings into prioritized topic directives, difficulty recalibrations, and script hooks for Step 01. |

> **Governance Invariant:**  
> **This is the canonical BUSINESS workflow.**  
> **Technical states may exist, but technical states must not create a competing business workflow.**

---

## 07. Business Requirements

### Lifecycle & Pipeline Core
- **BR-001 Complete Content Lifecycle:** The system must support the complete, unbroken end-to-end progression of a content item through all 15 canonical steps without dead ends, orphan states, or reliance on undocumented external communication.
- **BR-100 Question Production:** The system must support the authoring, drafting, AI-assisted generation, and editing of structured exam questions, including bilingual representations, standardized 4-option sets, single definitive answer keys, taxonomy tags, and step-by-step solution proofs.
- **BR-200 Question Verification:** The system must enforce an independent academic verification gate requiring explicit sign-off on mathematical proof, syllabus alignment, unambiguous phrasing, and distractor rationale. The system must prevent self-approval by the question author and support structured rejection feedback that returns the item to Step 01.
- **BR-300 Audience Script:** The system must support authoring and managing spoken scripts derived from verified questions, including verbal hooks, conversational explanations, on-screen visual directives, pronunciation keys, and target duration/timing calculations.
- **BR-400 Teleprompter & Filming:** The system must support studio filming workflows, including variable-speed teleprompter display, presenter assignments, take numbering, take notes, and designation of selected master takes.
- **BR-500 Raw Video:** The system must record and verify the ingestion of raw video files, capturing duration, container format, resolution, SHA-256 integrity checksums, and external storage reference pointers.
- **BR-600 Editing Bay:** The system must track post-production editing assignments, status, bilingual subtitle/caption tracks, motion graphic assets, and delivery of rendered master video cuts.
- **BR-700 Final QC:** The system must enforce a formal Technical Quality Control gate with an objective checklist verifying video clarity, audio loudness (-14 LUFS compliance), lip-sync alignment, subtitle accuracy, and academic fidelity before allowing an asset to proceed to packaging.
- **BR-800 Thumbnail:** The system must support uploading, generating, validating, and associating high-resolution thumbnail images, verifying dimension compliance (e.g., 1280x720), aspect ratio, high-contrast mobile legibility, and A/B test variants.
- **BR-900 Social Review:** The system must provide a unified social packaging review interface where reviewers simultaneously inspect the edited video master, thumbnail, title, description, tags, and pinned comment before release approval.
- **BR-1000 Publishing Setup:** The system must support multi-platform distribution configuration, allowing operators to set release times, target platform destinations (e.g., YouTube Shorts, Instagram Reels, Facebook), playlist assignments, and privacy settings.
- **BR-1100 Published:** The system must track distribution status, capture live platform identifiers (e.g., YouTube Video ID, Instagram Media ID), record live timestamps, and register published records.
- **BR-1200 Platform Synchronization:** The system must verify post-publish public availability via live URLs, confirm cross-platform syndication consistency, and verify automated or guided placement of the initial pinned engagement comment.
- **BR-1300 Analytics:** The system must support ingesting and recording cross-platform performance metrics at standardized milestones (e.g., 24 hours, 7 days, 30 days), including view counts, impressions, CTR, average percentage viewed (APV), retention curves, likes, shares, and comments.
- **BR-1400 Performance Review:** The system must provide diagnostic assessment capabilities for content managers to evaluate audience drop-off points, hook failure rates, topic fatigue, and student comprehension gaps reflected in comment queries.
- **BR-1500 Intelligence Loop:** The system must close the production loop by transforming diagnostic findings into structured Next-Content Directives that directly seed Step 01 batches with prioritized topics, difficulty calibrations, and revised script hooks.

### Operational, Multi-User & Governance Capabilities
- **BR-1600 Multi-User Operation:** The system must support concurrent operation by multiple users across distinct pipeline stages without data corruption, race conditions, or session cross-talk.
- **BR-1700 Assignment:** The system must support assigning individual content items or specific stage responsibilities to specific users or functional teams, providing clear ownership visibility.
- **BR-1800 Workflow Transition:** The system must govern all stage transitions through a validated state transition graph, preventing illegal stage skips, unverified promotions, and orphaned workflow states.
- **BR-1900 Data Integrity:** The system must maintain a single authoritative source of truth for all content metadata, ensuring that related entities (questions, scripts, videos, publications) remain synchronized.
- **BR-2000 Media:** The system must manage media metadata, streaming/preview references, and external storage pointers without requiring the storage of binary media blobs in transactional application databases.
- **BR-2100 Archive References:** The system must maintain historical references and manifests for archived raw footage and retired assets in external cold storage.
- **BR-2200 Notifications:** The system must generate operational notifications alerting users to stage assignments, review requests, quality rejections, and publishing status updates.
- **BR-2300 Search & Discovery:** The system must provide search and multi-facet filtering across content items by examination category, topic, difficulty, workflow stage, assignee, date range, and keyword.
- **BR-2400 Dashboard / Operational Visibility:** The system must provide executive and operational dashboards displaying pipeline throughput, stage bottlenecks, upcoming publication schedules, and team performance metrics.
- **BR-2500 Audit:** The system must record an immutable audit log of all critical business events, stage transitions, verification decisions, and administrative modifications.
- **BR-2600 AI Assistance:** The system must provide assistive AI capabilities for question generation, bilingual translations, script suggestions, and telemetry summaries, strictly bounded by human review.
- **BR-2700 Realtime / Near-Realtime Awareness:** The system must support near-realtime awareness of stage updates, assignment changes, and active editing states to prevent conflicting work across team members.

---

## 08. Non-Functional Requirements

### Data Reliability & Integrity
- **NFR-001 Data Reliability:** Zero data loss for approved content, verified questions, and publication records. The system must guarantee transactional consistency for all state changes and relationship updates.
- **NFR-002 Transition Reliability:** All workflow state transitions must be atomic, validated server-side against the canonical transition graph, and impossible to bypass through client-side manipulation.
- **NFR-003 External Integration Reliability:** External API interactions (storage, social platforms, AI providers) must incorporate robust timeout handling, failure isolation, and idempotent retry capabilities without corrupting internal state.
- **NFR-004 Recovery:** The system must support predictable recovery from process termination, container restarts, or transient network failures without leaving records in indeterminate or locked states.

### Performance & Scalability
- **NFR-010 Performance:** Core UI interactions, navigation, and API response times must execute under 500ms under standard operational load. Teleprompter scrolling must maintain smooth 60 FPS rendering without jitter.
- **NFR-011 Long-running Work:** Heavy, time-consuming operations (video processing, bulk publishing, telemetry harvesting) must execute asynchronously without blocking the user interface or web request cycles.
- **Scalability:** The architecture must support scaling from initial batch production up to hundreds of concurrent content items in the pipeline simultaneously.
- **Availability:** The system must provide high operational availability during active studio production hours with minimal planned maintenance downtime.

### Security, Authentication & Access Control
- **NFR-020 Authentication:** Secure user authentication verifying user identity across all sessions.
- **NFR-021 Authorization:** Granular role-based access control enforcing least-privilege principles across all functional domains and pipeline stages.
- **NFR-022 Server-side Authorization:** All authorization checks must be strictly enforced on the server for every endpoint and mutation, regardless of client UI state.
- **NFR-023 Route/Data Protection:** Unauthenticated or unauthorized users must be prevented from accessing restricted routes, unpublished drafts, or administrative data.
- **NFR-024 Secret Protection:** Zero storage or exposure of API credentials, OAuth client secrets, or private tokens in client bundles or public repository files.
- **NFR-025 Media Authorization:** Access to raw footage, pre-release master cuts, and draft thumbnails must be restricted to authorized team members.
- **NFR-026 Administrative Protection:** Elevated protection, audit logging, and strict authorization rules governing user provisioning, permission changes, and stage overrides.

### Maintainability, Documentation & Quality
- **NFR-030 Maintainability:** Modular codebase architecture adhering to clean separation of concerns, explicit interfaces, and clear architectural layering.
- **NFR-031 Duplicate Implementation Control:** Strict prevention of duplicate or competing implementations for the same business capability (e.g., single canonical state engine, single media resolver).
- **NFR-032 Legacy Classification:** Explicit categorization, documentation, and containment of existing legacy services and components pending planned migration.
- **NFR-033 Historical Audit Preservation:** Preservation of all prior audit reports, forensic inventories, and historical documentation within the repository.
- **NFR-034 Architecture Documentation:** Maintenance of up-to-date architecture documentation, API specifications, and workflow state graphs.

### Auditability & Traceability
- **NFR-040 Auditability:** All state modifications, editorial sign-offs, and critical system events must generate persistent audit records capturing actor, action, resource, timestamp, and state delta.
- **NFR-041 Review Traceability:** Full traceability for academic verifications and QC decisions, capturing the reviewer identity, checklist evaluation, and comments.
- **NFR-042 Publishing Traceability:** Complete recording of publishing actions, including authorizer identity, target platforms, platform responses, and live URLs.
- **NFR-043 Administrative Traceability:** Immutable logging of all role assignments, user creations, configuration changes, and emergency overrides.
- **NFR-044 AI Provenance:** Clear tracking of AI involvement, distinguishing between human-authored and AI-generated text, recording prompts, model identifiers, and human editor sign-offs.

### Robustness & Operational Invariants
- **Failure Isolation:** Failures in downstream stages (e.g., social publishing or analytics polling) must not block or corrupt upstream stages (e.g., question creation or video editing).
- **Validation:** Strict server-side schema validation for all incoming payloads using deterministic schema contracts.
- **Concurrency & Idempotency:** Support for concurrent updates with conflict detection; all mutations and external webhook handlers must be idempotent to prevent duplicate processing.
- **Error Handling:** Comprehensive, structured error responses providing actionable messages without leaking stack traces or sensitive environment details.

---

## 09. Cost Constraints

> **HARD REQUIREMENT — COST-001**  
> **Initial infrastructure investment constraint:**  
> **₹0 – ₹100**

### Cost-Control Principles
1. **Prioritize Existing Infrastructure:** Maximize the utility of existing platform components, runtime environments, and provisioned services.
2. **Prioritize Free Tiers:** Utilize cloud free-tier quotas and community editions for foundational databases, compute, and serverless hosting.
3. **Avoid Unnecessary Paid Infrastructure:** Disallow the introduction of premium paid managed services, enterprise licenses, or paid add-ons where free or open-source alternatives suffice.
4. **Minimize Paid Storage:** Avoid storing bulk binary media (video files, camera raw takes) in expensive database storage tiers; delegate binary media to existing cloud drive quotas.
5. **Minimize Paid Compute:** Optimize compute efficiency, serverless execution limits, and background processing to remain well within free compute allocations.
6. **Control AI Usage:** Regulate API token consumption via caching, prompt minimization, and rate-limiting to prevent runaway API billing.
7. **Explicit Justification Gate:** Any proposed infrastructure component that incurs a direct financial cost requires explicit Product Owner business justification and written approval.

> **Governance Invariant:**  
> **Do not select a technology merely to satisfy this requirement.**  
> **Technology selection occurs in subsequent architecture stages.**

---

## 10. Media Requirements

### Approved Conceptual Model
1. **Active Media:** External storage (Current operational direction: Google Drive).
2. **Low-Use / Raw Media:** Manual external archive for historical raw camera rushes and long-term project files.
3. **BP-CMS Responsibility:** BP-CMS stores media metadata, file identifiers, MIME types, resolutions, checksums, and reference URLs.
4. **No Direct Binary Storage:** BP-CMS does NOT need to store archived or active binary media inside the relational or transactional database.
5. **Neutrality on Archive Providers:** Do not implement an archive provider in this stage. Do not hard-code TeraBox or any specific external archive vendor. The archive provider remains an architectural evaluation for future stages.

---

## 11. AI Requirements

### Assistive Boundary Principle
Artificial Intelligence within BP-CMS is strictly **assistive**, operating as an accelerator for human subject matter experts and editors.

### Operational AI Lifecycle
All AI-generated content must follow the deterministic pipeline:
```
Request
  ↓
Generate (Model API invocation)
  ↓
Validate (Schema, format & safety check)
  ↓
Preview (UI presentation to operator)
  ↓
Human Review (Subject matter expert inspection)
  ↓
Accept / Reject / Edit (Human decision gate)
  ↓
Canonical Mutation (Persist to system state)
```

### Negative Governance Constraints
AI models and autonomous agents must **NEVER** become authoritative for:
- User authentication or session tokens.
- User authorization, role evaluation, or permission escalation.
- Workflow state transitions or pipeline advancement.
- Database schema changes or transactional migrations.
- Final academic verification or broadcast production sign-off.

---

## 12. Realtime / Multi-User Requirements

### Business Requirement
BP-CMS must support collaborative multi-user operation where team members receive timely, near-realtime awareness of critical pipeline events, including:
- Workflow stage transitions and handoffs.
- Task assignments and reassignments.
- Verification approvals and rejection notifications.
- Background rendering and video upload completion.
- Scheduled publishing execution and live verification.
- Urgent editorial notifications.

> **Governance Invariant:**  
> **Stage 01 does NOT decide technical protocols (WebSockets vs Server-Sent Events vs Firestore listeners vs polling).**  
> **Protocol selection belongs to Stage 03 (Architecture).**

---

## 13. Concurrency Requirements

### Business Concurrency Principles
1. **Concurrent Multi-User Access:** Multiple users from different departments must be able to view and operate on separate or related content items simultaneously.
2. **Conflict Prevention:** The system must prevent concurrent editing conflicts where two users overwrite each other's work (e.g., simultaneous script editing or question revisions).
3. **Optimistic / Concurrency Protection:** State updates must incorporate optimistic concurrency checks (e.g., version tagging or dirty checking) to detect stale modifications.
4. **Duplicate Prevention:** The system must disallow duplicate submissions of questions, duplicate publishing triggers, and multiple identical pipeline transitions.
5. **Idempotency:** State transition requests, API mutations, and background processing jobs must be idempotent.
6. **Controlled Conflict Responses:** When a conflict occurs, the system must inform the user gracefully with actionable resolution options rather than silent overwrites or system crashes.

---

## 14. Data Integrity

### Authoritative Ownership Principle
Every business fact within the content lifecycle must have exactly **one authoritative owner** and single source of truth:

| Business Fact | Authoritative Entity / Scope |
| :--- | :--- |
| **Workflow Step** | Canonical Workflow State Engine |
| **Question Content & Verification State** | Question Record & Academic Verification Sign-off |
| **Spoken Script & Pacing** | Presentation Script Entity |
| **Video Production State** | Video Production Record |
| **QC Certification** | Quality Control Certificate |
| **Thumbnail Assets** | Thumbnail Entity |
| **Publication State & Live Identifiers** | Publishing Record |
| **User Identity & Role** | User & RBAC Authority |
| **Assignment Ownership** | Workflow Assignment Record |
| **Audience Telemetry** | Analytics Telemetry Store |

> **Governance Invariant:**  
> **Do not implement a database migration or schema restructure in Stage 01.**

---

## 15. Auditability

### Traceability Standard
Every significant business action and state transition in BP-CMS must be permanently traceable.

### Minimum Audit Record Schema (Conceptual)
Each audit entry must capture:
- **Actor:** User ID, role, and authentication context.
- **Action:** Exact business operation performed (e.g., `APPROVE_QUESTION`, `REJECT_QC`, `PUBLISH_SCHEDULE`).
- **Resource:** Entity type and unique identifier affected.
- **Timestamp:** ISO 8601 UTC timestamp of execution.
- **Previous Relevant State:** Pre-mutation state or version.
- **New Relevant State:** Post-mutation state or version.
- **Result:** Success, failure, or validation rejection status.
- **Metadata:** Optional rationale, review notes, or external response identifiers.

> **Governance Invariant:**  
> **Do not implement a new audit subsystem in this task.**

---

## 16. Brownfield Modernization

### Mandatory Modernization Principle
BP-CMS is an existing, functional production application. Architectural evolution must follow the disciplined brownfield engineering cycle:

```
UNDERSTAND
  ↓
CLASSIFY
  ↓
CONSOLIDATE
  ↓
DEFINE TARGET
  ↓
MIGRATE
  ↓
VERIFY
  ↓
RETIRE LEGACY
```

> **Strict Prohibition:**  
> **NEVER: DELETE EVERYTHING → REBUILD.**

### Future Component Classification Taxonomy
In future architecture stages, existing components and codebases will be systematically categorized as:
- **KEEP:** Production-grade components that satisfy target requirements without alteration.
- **MODIFY:** Existing components requiring targeted refactoring or interface alignment.
- **MERGE:** Redundant or duplicate services/components to be unified into a canonical module.
- **DEPRECATE:** Legacy paths maintained temporarily for backward compatibility.
- **REMOVE:** Dead code or obsolete pathways cleanly excised after replacement is verified.
- **CREATE:** New capabilities required by the target baseline that do not currently exist.

> **Governance Invariant:**  
> **Do not perform component classifications or deletions in Stage 01.**

---

## 17. Technology-Neutrality

Stage 01 defines **WHAT** the system must do, deliberately leaving **HOW** to subsequent architecture specifications.

### Explicitly Deferred Technology Decisions
This Stage 01 Requirements Baseline does **NOT** decide:
1. **Database Engine:** Whether PostgreSQL, Cloud SQL, Firestore, Google Sheets, or a hybrid model serves as persistence.
2. **State Engine Implementation:** The specific code mechanics of state transition machines.
3. **Queue & Worker Architecture:** Redis, BullMQ, Cloud Tasks, or in-memory queues.
4. **Realtime Communication Protocol:** WebSockets, Server-Sent Events (SSE), Firestore listeners, or intelligent polling.
5. **Archive Storage Vendor:** TeraBox, Google Cloud Storage Archive, AWS Glacier, or manual cold storage.
6. **Deployment & Infrastructure Architecture:** Microservices vs modular monolith, Cloud Run vs Kubernetes vs App Engine.
7. **ORM & Query Layer:** Drizzle, Prisma, native SQL, or custom repository wrappers.

All technology decisions belong to Stage 03 (Architecture Baseline) and later engineering specifications.

---

## 18. Requirements Traceability

### Requirements Identifier Scheme
- **`BR-xxx`:** Business Requirements (Functional capabilities)
- **`NFR-xxx`:** Non-Functional Requirements (Quality, performance, reliability, security)
- **`COST-xxx`:** Cost Constraints (Budget and financial invariants)
- **`AC-xxx`:** Acceptance Criteria (Stage verification criteria)

### Future Lifecycle Traceability Extensions
Subsequent stages will expand this traceability matrix:
- **`ARCH-xxx`:** Architecture Decision Records (Stage 03)
- **`DATA-xxx`:** Data Schema & Persistence Contracts (Stage 04)
- **`API-xxx`:** API & Endpoint Contracts (Stage 05)
- **`UI-xxx`:** UI/UX & Interaction Contracts (Stage 06)
- **`SEC-xxx`:** Security & RBAC Contracts (Stage 07)
- **`TEST-xxx`:** Test Strategy & Test Suites (Stage 08)

### Complete SDLC Chain
```
Requirement (Stage 01)
  ↓
Business Acceptance Criteria (Stage 02)
  ↓
Architecture Impact & Baseline (Stage 03)
  ↓
Design Specifications (Stage 04)
  ↓
Data Contract
  ↓
API Contract
  ↓
UI/UX Contract
  ↓
Security/RBAC Contract
  ↓
Test Strategy
  ↓
Implementation Specification
  ↓
Implementation
  ↓
Static Verification (Lint, Typecheck, Build)
  ↓
Unit / Integration Testing
  ↓
Independent Review
  ↓
Human Acceptance Test
  ↓
GitHub Commit / Pull Request
  ↓
Merge
  ↓
Deploy
  ↓
Cloud Run Verification
  ↓
Release Record
```

---

## 19. Stage 01 Acceptance Criteria

| Criteria ID | Subject | Acceptance Criteria Specification | Verification Status |
| :--- | :--- | :--- | :---: |
| **AC-01** | **Product Definition** | The document defines what BP-CMS is, its target users, the problem it solves, its vision, and operational purpose. | **PASS** |
| **AC-02** | **User Definition** | Functional user categories covering all content, production, review, and management roles are documented without premature RBAC binding. | **PASS** |
| **AC-03** | **Product Scope** | In-scope capabilities and out-of-scope external systems (storage, social platforms, AI, archives) are clearly demarcated. | **PASS** |
| **AC-04** | **Canonical Workflow** | All 15 canonical steps are explicitly named, ordered, and documented as the sole authoritative business workflow. | **PASS** |
| **AC-05** | **Multi-User Operation** | Requirements for multi-user collaboration, stage assignments, and operational visibility are explicitly formulated. | **PASS** |
| **AC-06** | **Data Ownership** | The principle of single authoritative ownership for every core business fact is established without database lock-in. | **PASS** |
| **AC-07** | **Media Model** | The conceptual model separating metadata from binary storage, prioritizing Google Drive and external archives, is formalized. | **PASS** |
| **AC-08** | **AI Governance** | Assistive-only AI boundary, human-in-the-loop review lifecycle, and explicit negative constraints are defined. | **PASS** |
| **AC-09** | **Security & Access** | Non-functional requirements for authentication, server-side authorization, secret protection, and least-privilege access are documented. | **PASS** |
| **AC-10** | **Auditability** | Comprehensive audit tracking requirements with conceptual schema parameters are established. | **PASS** |
| **AC-11** | **Cost Constraint** | Hard cost constraint (₹0–₹100 initial investment) and 7 cost-control principles are formally recorded. | **PASS** |
| **AC-12** | **Brownfield Principle** | Disciplined brownfield modernization principle (Understand → Classify → Consolidate → Migrate → Verify → Retire) is recorded. | **PASS** |
| **AC-13** | **Technology-Neutrality**| Explicit statement confirming that technology selections (DB, queues, protocols, hosting) are deferred to later stages. | **PASS** |

---

## 20. Stage 01 Completion Statement

```
================================================================================
STAGE 01 — REQUIREMENTS BASELINE

STATUS:
ACCEPTED

COMPLETION:
100%

APPROVAL:
PRODUCT OWNER ACCEPTED

GOVERNANCE DECLARATION:
This document formally records and establishes the authoritative Requirements
Baseline for Burra Pariksha CMS (BP-CMS).

This completion status certifies that the business, functional, non-functional,
operational, and governance requirements have been fully specified, audited,
and accepted.

It does NOT mean that the requirements have already been implemented as
application functionality. Implementation decisions and development belong
strictly to subsequent stages of the engineering lifecycle.

NEXT STAGE:
STAGE 02 — BUSINESS ACCEPTANCE CRITERIA
================================================================================
```
