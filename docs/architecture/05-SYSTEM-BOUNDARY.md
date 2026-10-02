# Burra Pariksha CMS
# 05 — Target System Boundary

Stage: 05 — Target System Boundary

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative system boundary specification for the Burra Pariksha Content Management System (BP-CMS). Explicitly demarcates internal BP-CMS ownership from external third-party systems, cloud services, and integration providers, preserving core architectural invariants established in Stage 01 through Stage 04.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 05 Target System Boundary | FACT |
| **File Path** | `docs/architecture/05-SYSTEM-BOUNDARY.md` | FACT |
| **Document Stage** | Stage 05 — Target System Boundary | FACT |
| **Authority** | Authoritative System Boundary & Domain Ownership Specification | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed at commit `22ad89e`) | FACT |
| **Subsequent Stages** | Stage 06+ (Data Architecture, Target Schemas, API Specifications) | FACT |
| **Architectural Scope** | Exclusively defines domain boundaries, ownership scopes, and integration contracts without declaring low-level table schemas or implementing premature infrastructure | FACT |

---

## 02. Purpose

The purpose of this document is to define the exact system boundary of BP-CMS. As the platform transitions from historical audit baselines to target architecture modernization, a rigorous separation between **what BP-CMS owns** and **what belongs to external systems** is paramount.

This boundary specification guarantees:
1. **Unambiguous Domain Ownership:** Every business concept, data entity, state machine, and authorization rule has exactly one authoritative owner (AP-010).
2. **Decoupling from External Providers:** External infrastructure (Google Drive, YouTube, Meta/Instagram, AI APIs, Email SMTP, Cold Archives) acts strictly as subordinate utilities; external state changes never unilaterally mutate BP-CMS core workflow.
3. **Preservation of Architectural Principles:** AP-001 through AP-015 (specifically AP-001 single workflow, AP-002 stage vs status, AP-004 backend authorization, AP-007 external media binaries, AP-008 internal media references, AP-009 human-gated AI, and AP-010 single state ownership) are structurally enforced at the system boundary.
4. **Resilience & Failure Isolation:** Transients, outages, or API deprecations in external third-party services cannot corrupt, lock, or invalidate internal business records.

---

## 03. Canonical Domain Partitioning (8 Core Workspaces)

The BP-CMS system boundary is partitioned into 8 canonical operational domains:

1. **Question Domain:** Question generation, syllabus taxonomies, Telugu/English translations, mathematical proofs, and verification reviews (Steps 01, 02).
2. **Production Domain:** Short-form presenter scripts, teleprompter workflows, raw video filming handoffs, and video edit suites (Steps 03, 04, 05, 06).
3. **Packaging & Review Domain:** Final pedagogical QC sign-off, thumbnail creation/variants, and multi-channel social review (Steps 07, 08, 09).
4. **Distribution Domain:** Publishing setup, release scheduling, live broadcast dispatch, and multi-platform synchronization (Steps 10, 11, 12).
5. **Analytics Domain:** Multi-platform metrics ingestion, view normalization, and engagement retention analysis (Step 13).
6. **Intelligence Domain:** Strategic curriculum feedback, syllabus difficulty diagnosis, and ideation loops back into Question Studio (Steps 14, 15).
7. **Media Domain:** Media metadata indexing, external storage pointers, SHA-256 asset verification, and stream routing (Cross-cutting).
8. **Identity & Audit Domain:** User accounts, RBAC capabilities, session management, and immutable append-only audit trail (Cross-cutting).

---

## 04. BP-CMS Internal Ownership (16 Core Business Domains)

BP-CMS is authoritatively responsible for 16 internal business domains. No external provider or client-side application may usurp control over these areas:

### 4.1 Domain 01: Identity
- **What BP-CMS Owns:** User identity identifiers (`USR-xxxxxx`), account provisioning status, active session lifecycles, and credential verification records.
- **Business Meaning:** Defines who is recognized as an authenticated operator within the Burra Pariksha production ecosystem.
- **Lifecycle & Control:** Account creation, suspension, session termination, password hash invalidation, and session timeouts.

### 4.2 Domain 02: Users
- **What BP-CMS Owns:** User profile metadata, employment/team associations, contact details, assignment capacity, and editorial preferences.
- **Business Meaning:** Represents the operational staff members (SMEs, Scriptwriters, Hosts, Editors, Reviewers, Publishers).
- **Lifecycle & Control:** User onboarding, role assignment changes, profile updates, and deactivation.

### 4.3 Domain 03: Roles
- **What BP-CMS Owns:** Authoritative role taxonomy (`ADMIN`, `CONTENT_CREATOR`, `LEAD_CREATOR`, `REVIEWER`, `SME_REVIEWER`, `PRODUCER`, `VIDEO_EDITOR`, `HOST`, `GRAPHIC_DESIGNER`, `COMMUNITY_MANAGER`).
- **Business Meaning:** Functional operational designations determining responsibility areas across the 15-step production journey.
- **Lifecycle & Control:** Centralized definition of roles; assignment and revocation of roles to user identities.

### 4.4 Domain 04: Capabilities
- **What BP-CMS Owns:** Granular permission flags (e.g., `canApproveQuestion`, `canSignOffQC`, `canTriggerPublish`, `canOverrideReview`).
- **Business Meaning:** Fine-grained security privileges evaluated by the server before executing business-rule mutations.
- **Lifecycle & Control:** Capability matrix mapping roles to permissions; dynamic server-side authorization checks.

### 4.5 Domain 05: Questions
- **What BP-CMS Owns:** Authoritative pedagogical question entity (`BP-Q-xxxxxx`), Telugu/English text, 4 multiple-choice options, correct answer key, mathematical solution proof, curriculum taxonomy (`Class`, `Subject`, `Topic`, `Subtopic`), and difficulty level.
- **Business Meaning:** The foundational core intellectual property and educational curriculum atom of Burra Pariksha.
- **Lifecycle & Control:** Draft -> Verification Review -> Approved -> Revisions Required -> Rejected.

### 4.6 Domain 06: Scripts
- **What BP-CMS Owns:** Short-form video presenter script (`BP-SCR-xxxxxx`), 3-second hook phrasing, step-by-step teleprompter copy, speed-trick callouts, target reading duration, and version history.
- **Business Meaning:** The spoken narrative and pacing structure tailored for vertical short-form pedagogical delivery.
- **Lifecycle & Control:** Draft -> Script Ready -> Locked for Recording -> Archived.

### 4.7 Domain 07: Videos
- **What BP-CMS Owns:** Video production entity (`BP-V-xxxxxx`), production metadata, target aspect ratio (9:16), audio LUFS targets, editor assignments, take numbers, and stage flags.
- **Business Meaning:** The multimedia production project encapsulating filming, cut master rendering, and final quality control.
- **Lifecycle & Control:** Queued -> Recording -> Recorded -> Editing -> Edited -> Final Review -> Ready to Upload -> Uploaded.

### 4.8 Domain 08: Media Metadata
- **What BP-CMS Owns:** Media descriptor index (`MED-xxxxxx`), entity association (`entityType`, `entityId`), file name, MIME type, file size in bytes, SHA-256 integrity hash, aspect ratio, frame rate, audio sample rate, and remote URI pointers.
- **Business Meaning:** The catalogue index enabling BP-CMS to track, locate, verify, and stream external digital assets without hosting binary streams in the database (AP-007, AP-008).
- **Lifecycle & Control:** Registered -> Verified -> Archived -> Soft-Deleted.

### 4.9 Domain 09: Workflow
- **What BP-CMS Owns:** The canonical 15-step linear business progression (`CANONICAL_15_STEPS`), transition prerequisites, stage blockers, loopback cycles, and active milestone pointers for every content project.
- **Business Meaning:** The overarching operational manufacturing line guiding an educational concept from ideation to publication and intelligence feedback.
- **Lifecycle & Control:** Strictly sequential stage advancement enforced by `validateCanonicalWorkflowTransition()`.

### 4.10 Domain 10: Reviews
- **What BP-CMS Owns:** Verification audit records (`QV-xxxxxx`), Quality Control sign-offs (`QC-xxxxxx`), and Social Review packages (`SR-xxxxxx`), scoring rubrics, defect checklists, reviewer remarks, and pass/fail verdicts.
- **Business Meaning:** Formal pedagogical, technical, and branding gates ensuring quality standards before distribution.
- **Lifecycle & Control:** Pending Review -> Approved / Revision Required / Rejected.

### 4.11 Domain 11: Publishing Packages
- **What BP-CMS Owns:** Publishing schedule (`PUB-xxxxxx`), platform-specific adaptation packages (YouTube Shorts title/description/tags/pinned comment; Instagram Reels audio/caption/hashtags; Facebook Video metadata), target release timestamps, and manual/automated release state.
- **Business Meaning:** Multi-platform packaging and scheduling configuration for distributed broadcast.
- **Lifecycle & Control:** Staged -> Scheduled -> Publishing Initiated -> Published -> Verified Synced.

### 4.12 Domain 12: Analytics
- **What BP-CMS Owns:** Standardized internal performance metrics, normalized view counts, engagement ratios (likes/views, comments/views), retention curve benchmark classifications, and historical snapshot timestamps.
- **Business Meaning:** Normalized pedagogical resonance and reach measurement across distribution channels.
- **Lifecycle & Control:** Raw Ingestion -> Normalized -> Aggregated -> Archived.

### 4.13 Domain 13: Intelligence
- **What BP-CMS Owns:** Pedagogical insight syntheses, high-difficulty topic identification, syllabus gap diagnostics, audience confusion signals, and recommendation records looped back into Question Studio (Step 15 -> Step 01).
- **Business Meaning:** Strategic curriculum intelligence that guides what educational content should be authored next.
- **Lifecycle & Control:** Generated -> Reviewed -> Applied to Curriculum Plan -> Retired.

### 4.14 Domain 14: Notifications
- **What BP-CMS Owns:** In-app operational notifications, assignment alerts, workflow gate notices (e.g., "Script approved for BP-V-000123", "QC revision requested"), and delivery recipient queues.
- **Business Meaning:** Internal team coordination signals that minimize idle wait time across production handoffs.
- **Lifecycle & Control:** Queued -> Dispatched -> Read -> Dismissed.

### 4.15 Domain 15: Audit
- **What BP-CMS Owns:** Append-only historical event ledger (`AUD-xxxxxx`), recording actor identity, role, timestamp, action verb, target entity, previous state, new state, and client IP/user-agent context (AP-014).
- **Business Meaning:** Immutable legal and operational evidence of all mutations performed across the platform.
- **Lifecycle & Control:** Append-only. Strictly immutable; deletion and updates are architecturally prohibited.

### 4.16 Domain 16: Configuration
- **What BP-CMS Owns:** Application business settings, curriculum taxonomy hierarchies (Class 6-10 syllabus nodes), QC check criteria definitions, teleprompter scroll speed defaults, and operational feature toggles.
- **Business Meaning:** The operational parameters that govern CMS behavior without requiring code modifications.
- **Lifecycle & Control:** Draft -> Active -> Deprecated.

---

## 05. External Systems Boundary (6 External Integration Services)

External systems are third-party services situated strictly behind boundary adapters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BP-CMS INTERNAL DOMAIN                          │
│                                                                        │
│   [Identity & RBAC]  [Questions & Scripts]  [Videos & QC]             │
│   [Canonical 15-Step Workflow]              [Publishing Packages]      │
│   [Media Metadata & References]             [Authoritative Audit Log]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       INTEGRATION BOUNDARY ADAPTERS
                                    │
      ┌──────────────┬──────────────┼──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼              ▼              ▼
[Google Drive]   [YouTube]     [Social APIs]  [AI Providers] [Email SMTP]  [Cold Storage]
(Binary Store) (Distribution) (Distribution) (Assistive LLM) (Alert Relay)  (Archival)
```

### 5.1 Google Drive (Binary Object Storage)
- **External Responsibility:** Storing multi-gigabyte raw footage, exported master MP4 cuts, and thumbnail PNG graphics in cloud folders. Managing physical byte streaming and chunked uploads.
- **BP-CMS Interaction:** Issues upload sessions, verifies file hashes, queries `webViewLink`. BP-CMS stores `driveFileId` as a reference; Google Drive never stores domain state.
- **Failure Boundary:** If Google Drive is down (500 / 429), video projects remain in `RECORDED` or `EDITING` status and retry asynchronously. Core editing records are never corrupted.

### 5.2 YouTube (Distribution Platform)
- **External Responsibility:** Public video streaming, Shorts playback, comment management, and platform metrics.
- **BP-CMS Interaction:** Uploads video binary via YouTube API, configures tags/pinned comment, queries view counters.
- **Failure Boundary:** YouTube quota limits or upload failures pause Stage 10 (`Publishing Setup`) without corrupting internal QC approvals.

### 5.3 Social Platforms (Instagram Reels & Facebook Video)
- **External Responsibility:** Public distribution to mobile audiences on Instagram and Facebook; collecting platform-native reactions.
- **BP-CMS Interaction:** Dispatches publishing containers via Meta Graph API, checks container status, tracks permalinks.
- **Failure Boundary:** Failure on Instagram or Facebook does NOT invalidate YouTube publishing; Stage 12 (`Platform Sync`) holds pending retry.

### 5.4 AI Providers (Transformation & Synthesis Engines)
- **External Responsibility:** Executing LLM inference (e.g., Gemini API) to suggest question drafts, draft translations, or analyze comment sentiments.
- **BP-CMS Interaction:** Dispatches stateless prompts; receives candidate text.
- **Human-in-the-Loop Gate (AP-009):** AI outputs remain in `PENDING_REVIEW` until an authenticated human signs off. AI cannot advance workflow gates autonomously.
- **Failure Boundary:** AI outages gracefully degrade to 100% manual authoring.

### 5.5 External Archive Providers (Cold Storage / Disaster Recovery)
- **External Responsibility:** Long-term archival preservation of raw footage beyond active production lifecycles.
- **BP-CMS Interaction:** Dispatches export manifests and verifies checksums.
- **Failure Boundary:** Archival unavailability has zero impact on active production pipelines.

### 5.6 Email Providers (SMTP / Alert Gateways)
- **External Responsibility:** Relaying operational email notices to staff inboxes.
- **BP-CMS Interaction:** Asynchronous email dispatch.
- **Failure Boundary:** Email delivery failure never rolls back a business transaction; in-app notifications remain authoritative.

---

## 06. Data Ownership Matrix

| Business Area | BP-CMS Ownership | External Ownership | Reference Stored by BP-CMS | Authoritative Business State |
| :--- | :--- | :--- | :--- | :--- |
| **User Identity & Roles** | User accounts, role definitions, capability grants, session records | OAuth provider authentication claims | External OAuth Provider Subject ID / Email | **BP-CMS Identity Domain** |
| **Questions & Curriculum** | Question text, math proof, 4 options, key, syllabus mapping, verification audit | None | None | **BP-CMS Question Domain** |
| **Scripts & Teleprompter** | Script text, hook, pacing markers, version history, script approval | None | None | **BP-CMS Script Domain** |
| **Raw Footage** | Footage metadata, take numbers, cameraman notes, quality gate pass/fail | Raw binary video container bytes (.MP4, .MOV) | `driveFileId`, `rawFootagePath`, `driveFolderUrl` | **BP-CMS Video Domain** |
| **Master Video Edits** | Edit cut metadata, subtitle sync flags, LUFS audio specs, QC certificate | Master rendered MP4 video binary file | `driveFileId`, `editedVideoUrl`, SHA-256 Hash | **BP-CMS Video Domain** |
| **Thumbnails** | Graphic design metadata, A/B test variant flags, hook headline text | High-resolution image binary files (.PNG, .JPG) | `driveFileId`, `thumbnailUrl`, SHA-256 Hash | **BP-CMS Thumbnail Domain** |
| **15-Step Workflow** | Stage sequence, active stage, gate validation, actor attribution, loopback rules | None | None | **BP-CMS Workflow Domain** |
| **Pedagogical & Final QC** | 10-point SME check, 6-point video QC rubric, feedback notes, reviewer verdicts | None | None | **BP-CMS Review Domain** |
| **Publishing Packages** | Schedule timestamp, title, description, tags, pinned comment copy, platform adaptation | Platform-side container ingestion queues | `youtubeVideoId`, `metaContainerId`, Live URLs | **BP-CMS Publishing Domain** |
| **Social Analytics** | Normalized views, engagement ratios, retention benchmarks, historical snapshots | Platform view counters, impression algorithms | Platform video/post identifiers | **BP-CMS Analytics Domain** |
| **Pedagogical Intelligence**| Topic recommendations, difficulty diagnoses, syllabus feedback loop | None | None | **BP-CMS Intelligence Domain** |
| **Audit Ledger** | Immutable event stream: actor, timestamp, verb, entity, before/after state diff | Cloud provider infrastructure logs | None | **BP-CMS Audit Domain** |
| **App Configuration** | Taxonomy trees, QC checklists, teleprompter presets, platform limits | Cloud environment variable secrets | None | **BP-CMS Config Domain** |

---

## 07. Stage 05 Closure Record & Acceptance Table

### 07.1 Controlled Closure Verification Evidence
* **Closure Execution Date:** 2026-10-02
* **Version:** 1.1.0 (Master SDLC Reset Baseline)
* **Preceding Verified Stages:** Stage 01 (Accepted), Stage 02 (Accepted), Stage 03 (Accepted), Stage 04 (Accepted & Closed at commit `22ad89e`)
* **Verified GitHub Commit:** `22ad89e`
* **Inside Domains Defined:** All 16 core business domains documented with strict BP-CMS ownership.
* **Outside Integrations Defined:** All 6 external services isolated behind boundary adapters.
* **Domain Partitioning:** 8 canonical domain workspaces defined.
* **Automated Test Suite:** Deterministic verification suite `src/tests/stage05-system-boundary.test.ts` passed 100%.

### 07.2 Acceptance Table

| Item | Status |
| :--- | :---: |
| BP-CMS 16 Internal Business Domains Defined | VERIFIED |
| External Systems Integration Boundary Defined (6 Services) | VERIFIED |
| Canonical Domain Partitioning (8 Workspaces) | VERIFIED |
| Data Ownership Matrix Created | VERIFIED |
| Media Reference vs Binary Storage Boundary (AP-007, AP-008) | VERIFIED |
| Workflow Ownership & Transition Authority (AP-001, AP-002, AP-003) | VERIFIED |
| AI Assistive & Human-Gated Boundary (AP-009) | VERIFIED |
| External Failure Isolation Boundary Defined | VERIFIED |
| Security & Server Authorization Authority (AP-004, AP-006) | VERIFIED |
| Internal Audit Ledger Authority (AP-014) | VERIFIED |
| Non-Requirements Enforced (Zero Schema/Code/Infra) | VERIFIED |
| Traceability to Stages 01, 02, 04 | VERIFIED |
| Architecture Principles Test Suite (`npm run test:architecture`) | PASSED |
| Stage 05 System Boundary Test Suite (`npm run test:stage05`) | PASSED |
| Full TypeScript Type Check (`npm run lint`) | PASSED |
| Production Build Compilation (`npm run build`) | PASSED |
| Product Owner Acceptance | ACCEPTED |
| Stage 05 Status | ACCEPTED — COMPLETE — CLOSED |

```
================================================================================
STAGE 05 — TARGET SYSTEM BOUNDARY
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
IMPLEMENTATION: COMPLETE
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 05 CLOSED: YES
APPLICATION CODE MODIFIED: NONE
DATABASE / SCHEMA MODIFIED: NONE
DATA / STORAGE MODIFIED: NONE
INFRASTRUCTURE MODIFIED: NONE
DEPLOYMENT PERFORMED: NO
NEXT STAGE: STAGE 06 — NOT STARTED
================================================================================
```

STAGE 05 CLOSED: YES

NEXT STAGE:
STAGE 06 — NOT STARTED
