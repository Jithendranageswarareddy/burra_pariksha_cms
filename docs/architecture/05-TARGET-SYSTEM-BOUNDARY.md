# 05 — TARGET SYSTEM BOUNDARY
## Burra Pariksha Content Management System (BP-CMS)
### Stage 05 of 30-Stage Modernization Program — Authoritative Architectural Boundary

---

## 1. Document Governance & Anti-Overclaim Statement

| Attribute | Definition |
| :--- | :--- |
| **Document Path** | `docs/architecture/05-TARGET-SYSTEM-BOUNDARY.md` |
| **SDLC Stage** | Stage 05 — Target System Boundary |
| **Document Version** | 1.0.0-SDLC-RESTART |
| **Status** | ACTIVE ARCHITECTURAL BOUNDARY BASELINE |
| **Scope** | Authoritative Domain Ownership, External System Boundaries, Data Flow Contracts, and Adapter Rules |

### Strict Anti-Overclaim Invariants
1. **Target Boundary vs. Current Implementation:** This document establishes the **TARGET SYSTEM BOUNDARY** for all future architecture, contracts, implementation, and integration work. It does **NOT** claim that the current brownfield codebase already conforms to this boundary.
2. **No Production Code Mutations:** No application source code, Express routes, services, repositories, Google Sheets schemas, or external integrations are modified in Stage 05.
3. **No External Infrastructure Alterations:** No external cloud services, API credentials, or remote resources are provisioned, modified, or decommissioned in Stage 05.
4. **Vocabulary Invariant:** The word *"Implemented"* must never be used to describe boundary decisions established in this document. This stage defines **WHAT BP-CMS OWNS** and **WHAT REMAINS EXTERNAL**.

---

## 2. Relationship to Stages 01–04

```text
┌─────────────────────────────────────────────────────────┐
│ STAGE 01 — REQUIREMENTS BASELINE                        │
│ Defines WHAT BP-CMS must become (BR-001..011, NFRs)     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 02 — BUSINESS ACCEPTANCE CRITERIA                 │
│ Defines HOW requirements will be verified               │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 03 — CURRENT SYSTEM BASELINE                      │
│ Freezes the brownfield reality (routes, services, debt) │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 04 — ARCHITECTURE PRINCIPLES                      │
│ Establishes the 15 governing architectural laws         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 05 — TARGET SYSTEM BOUNDARY                       │
│ Establishes exact domain ownership & external adapters  │
└─────────────────────────────────────────────────────────┘
```

Stage 05 builds directly on the foundational constraints established in earlier stages:
- **Enforces Principle 01:** BP-CMS owns the canonical 15-step workflow end-to-end.
- **Enforces Principle 02:** Separates business workflow steps from independent technical states across all boundaries.
- **Enforces Principle 07 & 08:** Physical media binaries remain external; media metadata and references belong inside.
- **Enforces Principle 09:** External AI providers execute inference; BP-CMS strictly owns human-gated approval state.
- **Enforces Principle 10:** Eliminates duplicate ownership of business state across system boundaries.
- **Enforces Principle 11:** Organizes internal domains as a modular monolith without unnecessary microservices.

---

## 3. Inside BP-CMS (Internal System Ownership)

The following core business capabilities and information assets are owned authoritatively and exclusively by **BP-CMS**:

### 3.1 Identity
BP-CMS owns user authentication session state, token signing and verification (`bp_session`), password hash verification, session revocation, and multi-device session version tracking.

### 3.2 Users
BP-CMS owns the internal user directory, account active/inactive statuses, profile attributes, and system user IDs (`USR-xxx`).

### 3.3 Roles
BP-CMS owns the canonical role catalog (`ADMIN`, `CONTENT_LEAD`, `QUESTION_AUTHOR`, `QUESTION_VERIFIER`, `SCRIPTWRITER`, `PRESENTER`, `VIDEO_EDITOR`, `QC_OFFICER`, `THUMBNAIL_DESIGNER`, `SOCIAL_REVIEWER`, `PUBLISHING_OPERATOR`, `ANALYTICS_SPECIALIST`).

### 3.4 Capabilities
BP-CMS owns the granular capability matrix (e.g., `QUESTION:CREATE`, `QUESTION_REVIEW:VERIFY`, `VIDEO_EDIT:APPROVE`) and capability evaluation logic.

### 3.5 Questions
BP-CMS owns question production lifecycle records: question stems, 4 multiple-choice options, correct answer keys, mathematical/conceptual solution proofs, bilingual translations (Telugu/English), syllabus classifications (Subject, Topic, Subtopic), difficulty ratings, and draft versions.

### 3.6 Scripts
BP-CMS owns audience presentation scripts: spoken text lines, 5-part structure (Hook, Problem, Solution, Burra Trick, CTA), visual directives, pacing estimates, word counts, and immutable locked teleprompter versions.

### 3.7 Videos (Production Metadata)
BP-CMS owns video production projects, camera take metadata logs (take numbers, durations, ratings), editing project tracking, master cut records, and QC inspection checklists.

### 3.8 Media Metadata
BP-CMS owns all metadata references describing media assets: external storage URIs, storage provider identifiers, SHA-256 integrity checksums, file sizes in bytes, MIME types, resolutions, audio loudness measures (-14 LUFS), and version pointers. *(BP-CMS does NOT own media binaries).*

### 3.9 Workflow
BP-CMS owns the canonical 15-step sequential business workflow, state transition tables, entry/exit prerequisites, and the authoritative Workflow Engine.

### 3.10 Reviews & Human Approvals
BP-CMS owns academic verification records, QC certification stamps, safe-zone social signoffs, reviewer remarks, checklist evaluations, and the Anti-Self-Approval constraint (`GAR-02`).

### 3.11 Publishing Packages
BP-CMS owns release staging packages: platform-specific titles, descriptions, Telugu pinned comments, tags, scheduled broadcast release times, and live publication records.

### 3.12 Analytics
BP-CMS owns ingested analytical snapshots: view counts, watch time, shares, comments, average percentage viewed (APV), and second-by-second audience retention curves linked to production projects.

### 3.13 Intelligence
BP-CMS owns internally synthesized pedagogical insights: drop-off diagnosis findings, syllabus misconception heatmaps, and approved Curriculum Sprint Directives seeding Step 01.

### 3.14 Notifications
BP-CMS owns in-app operational alerts, reviewer queue notifications, assignment handoff events, and notification dispatch histories.

### 3.15 Audit
BP-CMS owns the append-only forensic audit ledger (`AUDIT_LOG`), recording actor IDs, actions, entity references, state deltas, timestamps, and reason codes for all mutations.

### 3.16 Configuration
BP-CMS owns application-level business configuration: operational limits, workflow thresholds, pacing constants, role defaults, and feature flags.

---

## 4. Outside BP-CMS (External Systems & Boundary Scope)

The following systems reside strictly **OUTSIDE** BP-CMS. The system maintains boundary adapters to interact with them, but does not own or govern their internal mechanics:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS BOUNDARY                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ External System          │ External Ownership (Outside BP-CMS)         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ **Google Drive**         │ Physical binary storage, disk sectors,      │
│                          │ Google Drive folder trees, quota accounting │
├──────────────────────────┼─────────────────────────────────────────────┤
│ **YouTube**              │ Public video hosting, streaming servers,    │
│                          │ native comments/likes, recommendation engine│
├──────────────────────────┼─────────────────────────────────────────────┤
│ **Social Platforms**     │ Instagram Reels, Facebook Watch platform    │
│                          │ execution, native playback, audience feeds  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ **AI Providers**         │ Foundation model execution, GPU clusters,   │
│                          │ neural weights, token rate limits (Gemini)  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ **External Archives**    │ Cold blob storage (GCS Archive, AWS Glacier)│
│                          │ physical data retention                     │
├──────────────────────────┼─────────────────────────────────────────────┤
│ **Email / SMS Services** │ SMTP transport, mail transfer agents (MTA), │
│                          │ inbox delivery, telecommunication gateways  │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 5. Internal Domain Grouping (Modular Monolith Architecture)

In strict accordance with Stage 04 Principle 11 (*No Unnecessary Microservices*), BP-CMS is organized as a cohesive **Modular Monolith**. The 16 internal capabilities are structured into 8 cohesive domain bounded contexts:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    BP-CMS MODULAR MONOLITH CORE                         │
├───────────────────────────────┬─────────────────────────────────────────┤
│ Domain Module                 │ Encapsulated Capabilities               │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **1. Identity & Governance**  │ Identity, Users, Roles, Capabilities,   │
│                               │ Audit Ledger, App Configuration         │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **2. Curriculum & Question**  │ Syllabus Taxonomy, Question Authoring,  │
│                               │ Proof Drafting, Academic Verification   │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **3. Studio Production**      │ Audience Scripts, Teleprompter Pacing,  │
│                               │ Camera Take Logging, Video Editing, QC  │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **4. Packaging & Social**     │ Thumbnail Cover Art, Hook Headlines,    │
│                               │ 9:16 Mobile Safe-Zone Simulator Review  │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **5. Distribution & Sync**    │ Publishing Packages, Release Scheduling,│
│                               │ Idempotent Live Dispatch, URL Sync Check│
├───────────────────────────────┼─────────────────────────────────────────┤
│ **6. Audience Analytics**     │ Telemetry Ingestion, Milestone Snapshots│
│                               │ (24h/7d/30d), Retention Curve Tracking  │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **7. Pedagogical Intelligence**│ Drop-off Diagnostics, Misconception     │
│                               │ Heatmaps, Curriculum Sprint Directives  │
├───────────────────────────────┼─────────────────────────────────────────┤
│ **8. Media Metadata & Storage**│ Media Asset Entities, Checksums, URIs,  │
│                               │ External Storage Adapter Interfaces     │
└───────────────────────────────┴─────────────────────────────────────────┘
```

---

## 6. Explicit Ownership Matrix

| Capability / Entity / Data Asset | BP-CMS Owns? | External System | Authoritative Owner | Boundary Interaction Type |
| :--- | :---: | :--- | :--- | :--- |
| **User Identity & Sessions** | **YES** | None | **BP-CMS** | Internal Application Core |
| **User Roles & Capabilities** | **YES** | None | **BP-CMS** | Internal Application Core |
| **Question Stems, Proofs, Options** | **YES** | None | **BP-CMS** | Internal Domain Model |
| **Academic Verification Decisions** | **YES** | None | **BP-CMS** | Internal Human Review Gate |
| **Video Scripts & Visual Directives** | **YES** | None | **BP-CMS** | Internal Domain Model |
| **Camera Take Logs & Metadata** | **YES** | None | **BP-CMS** | Internal Domain Model |
| **Media Metadata (Checksum, URI, Size)** | **YES** | Google Drive / GCS | **BP-CMS** | Boundary Metadata Reference |
| **Physical Media Binaries (MP4, PNG)** | **NO** | Google Drive / GCS | **External Storage** | External Boundary Storage |
| **Canonical 15-Step Workflow State** | **YES** | None | **BP-CMS** | Authoritative Workflow Engine |
| **QC Certification & Loudness Stamp** | **YES** | None | **BP-CMS** | Internal Human Review Gate |
| **Thumbnail Metadata & Hook Copy** | **YES** | None | **BP-CMS** | Internal Domain Model |
| **Social Review Safe-Zone Signoff** | **YES** | None | **BP-CMS** | Internal Human Review Gate |
| **Publishing Release Packages** | **YES** | None | **BP-CMS** | Internal Distribution Manager |
| **External Video Broadcast / Playback**| **NO** | YouTube / Meta | **External Platform** | External Broadcast Endpoint |
| **Platform Video IDs & Live URLs** | **YES** | YouTube / Meta | **BP-CMS** (stores pointer) | External Identifier Ledger |
| **Audience Engagement Snapshots** | **YES** | YouTube Analytics | **BP-CMS** (stores snapshot) | Ingestion Boundary |
| **Raw Public Platform Metrics** | **NO** | YouTube Analytics | **External Platform** | Upstream Telemetry Source |
| **Pedagogical Diagnostic Findings** | **YES** | None | **BP-CMS** | Internal Intelligence Model |
| **Curriculum Sprint Directives** | **YES** | None | **BP-CMS** | Internal Closed-Loop Directive |
| **AI Inference Execution** | **NO** | Google Gemini API | **External AI Provider** | External Stateless Adapter |
| **AI Request Prompts & Cached Responses**| **YES** | None | **BP-CMS** | Internal Traceability Record |
| **Email Message Transmission** | **NO** | SMTP / Sendgrid | **External Email Host** | External Transport Gateway |
| **Notification Records & Status** | **YES** | None | **BP-CMS** | Internal Operational Queue |
| **Forensic Audit Ledger** | **YES** | None | **BP-CMS** | Internal Append-Only Store |
| **Application Business Config** | **YES** | None | **BP-CMS** | Internal Runtime Configuration |
| **Cloud Hosting & Infrastructure** | **NO** | Google Cloud Platform | **External Cloud Host** | Underlying Runtime Platform |

---

## 7. Data Ownership Rules

### Rule 1: Principle of Business Meaning Ownership
**BP-CMS authoritatively owns the business meaning, workflow position, compliance certification, and pedagogical validity of every managed content item.**
External providers own only the technical execution of their specialized services (file storage, video streaming, neural inference).

### Rule 2: Single Source of Truth Invariant (Principle 10)
For any given piece of business state, there is exactly one authoritative record.
- **Media Asset:** BP-CMS owns `MediaAsset` (URI, SHA-256, duration, status). Google Drive owns the byte stream at that URI.
- **Publication Record:** BP-CMS owns `PublishingPackage` and `publication_status`. YouTube owns the live broadcast container on youtube.com.
- **Analytics Snapshot:** BP-CMS owns the immutable historical snapshot captured at milestone $T$. YouTube owns the continuously fluctuating live view counter.

### Rule 3: External Status Isolation
External system status or transient errors must never directly overwrite or corrupt internal business workflow state. If YouTube API returns an error or rate limit, `workflow_step` remains untouched; only `job_status` or `sync_status` reflects the error.

---

## 8. External Boundary Interaction Model

```text
                                  ┌───────────────────────────────┐
                                  │            BP-CMS             │
                                  │      (MODULAR MONOLITH)       │
                                  │                               │
                                  │  - Identity & RBAC            │
                                  │  - Curriculum & Questions     │
                                  │  - Studio Scripts & Takes     │
                                  │  - QC & Social Reviews        │
                                  │  - Canonical Workflow Engine  │
                                  │  - Publishing Setup & Sync    │
                                  │  - Audience Analytics         │
                                  │  - Pedagogical Intelligence   │
                                  │  - Forensic Audit Ledger      │
                                  └───────────────┬───────────────┘
                                                  │
       ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
       │                  │                       │                       │                  │
       ▼                  ▼                       ▼                       ▼                  ▼
┌──────────────┐   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐   ┌──────────────┐
│ Google Drive │   │   YouTube    │        │    Social    │        │  AI Provider │   │  Email / SMS │
│   Storage    │   │ Distribution │        │  Platforms   │        │   (Gemini)   │   │  Transport   │
│   Adapter    │   │   Adapter    │        │   Adapters   │        │   Adapter    │   │   Adapter    │
└──────┬───────┘   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘   └──────┬───────┘
       │                  │                       │                       │                  │
       ▼                  ▼                       ▼                       ▼                  ▼
┌──────────────┐   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐   ┌──────────────┐
│ Google Drive │   │ YouTube API  │        │ Meta / Reels │        │ Google Cloud │   │ SMTP Gateway │
│ Cloud Storage│   │ Broadcasts   │        │ Distribution │        │ Model Server │   │ Delivery MTA │
└──────────────┘   └──────────────┘        └──────────────┘        └──────────────┘   └──────────────┘
 [EXTERNAL MEDIA]  [EXTERNAL BROADCAST]   [EXTERNAL BROADCAST]     [EXTERNAL AI]      [EXTERNAL COMMS]
```

### 8.1 Google Drive Media Storage Adapter
- **BP-CMS Sends:** Chunked binary stream (via `busboy`), target folder classification (`raw-videos`, `master-cuts`, `thumbnails`), filename.
- **BP-CMS Receives:** File ID, web view link, download URL, file size.
- **BP-CMS Stores:** External URI locator, file ID, SHA-256 checksum, MIME type, file size, duration.
- **Remains External:** Physical binary storage blocks, drive trash lifecycle, Google drive permissions.
- **Authoritative Owner:** BP-CMS owns the `MediaAsset` record; Google Drive owns binary persistence.
- **Timing:** Asynchronous streaming for video uploads; synchronous metadata lookup.
- **Requirement:** Required for video and thumbnail production; optional during offline drafting (`SKIP_DRIVE_SYNC=true`).

### 8.2 YouTube Distribution Adapter
- **BP-CMS Sends:** Master cut stream/pointer, title, description, tags, scheduled release timestamp, privacy status.
- **BP-CMS Receives:** YouTube Video ID, canonical watch URL (`https://youtu.be/...`), HTTP response codes.
- **BP-CMS Stores:** YouTube Video ID, live publication record, published timestamp, operator ID.
- **Remains External:** Public streaming delivery, YouTube CDN distribution, platform recommendation indexing.
- **Authoritative Owner:** BP-CMS owns `PublishingPackage` and internal publication ledger; YouTube owns the public broadcast container.
- **Timing:** Asynchronous background dispatch with polling/webhook verification.
- **Requirement:** Required for live Step 11 distribution; optional in offline development.

### 8.3 Social Media Platforms Adapter (Meta / Instagram)
- **BP-CMS Sends:** Vertical 9:16 video cut reference, caption, hashtags, Telugu pinned comment text.
- **BP-CMS Receives:** Platform post ID, permalink, broadcast status.
- **BP-CMS Stores:** Platform identifiers, publication timestamp, syndication status.
- **Remains External:** Platform app feeds, algorithms, native social interactions.
- **Authoritative Owner:** BP-CMS owns the release bundle; platforms own social distribution.
- **Timing:** Asynchronous dispatch.
- **Requirement:** Optional secondary syndication.

### 8.4 AI Execution Adapter (Google Gemini)
- **BP-CMS Sends:** Structured prompt context (syllabus topic, exam category, difficulty tier, formula hints).
- **BP-CMS Receives:** Candidate draft question text, distractor rationales, suggested script hooks, retention summaries.
- **BP-CMS Stores:** Generated candidate text (in author's local editor), prompt tokens, model version, generation timestamp.
- **Remains External:** Model weights, GPU cluster execution, neural inference pipelines.
- **Authoritative Owner:** BP-CMS owns the generated text after human author accepts/saves it; Gemini owns the model execution service.
- **Timing:** Synchronous request/response bounded by `aiRateLimiter`.
- **Requirement:** Optional assistive accelerator; manual authoring remains 100% functional without AI.

### 8.5 External Archive Provider Adapter (GCS Cold Storage)
- **BP-CMS Sends:** Immutable snapshot JSON payloads, archive rotation metadata.
- **BP-CMS Receives:** GCS object URI, archive generation timestamp, bucket confirmation.
- **BP-CMS Stores:** Snapshot archive metadata locator, checksum, restore point tag.
- **Remains External:** Physical cloud storage bucket, retention policies.
- **Authoritative Owner:** BP-CMS owns disaster recovery ledger; GCS owns raw archive blobs.
- **Timing:** Asynchronous periodic background job (`snapshotSchedulerService`).
- **Requirement:** Optional disaster recovery feature (`GCS_SNAPSHOT_ENABLED=true`).

### 8.6 Email / Notification Transport Adapter
- **BP-CMS Sends:** Recipient email address, subject line, notification body HTML/text.
- **BP-CMS Receives:** SMTP delivery receipt, message ID, bounce status.
- **BP-CMS Stores:** Notification record, delivery attempt timestamp, status (`QUEUED`, `SENT`, `FAILED`).
- **Remains External:** SMTP server routing, spam filters, recipient mail server.
- **Authoritative Owner:** BP-CMS owns notification records; email provider owns email delivery.
- **Timing:** Asynchronous non-blocking queue.
- **Requirement:** Optional operational alert channel.

---

## 9. Specific Boundary Enforcements

### 9.1 Workflow Boundary
The canonical 15-step business workflow is **100% internal to BP-CMS**.
- External systems NEVER initiate, decide, or advance workflow transitions.
- A successful upload to Google Drive does NOT advance a project to Step 06; an authorized human editor must click handoff.
- A live video upload to YouTube does NOT automatically advance the workflow to Step 12; the server verifies live status before transitioning.
- The Workflow Engine is entirely hosted, evaluated, and executed within the BP-CMS application.

### 9.2 Media Boundary (Principles 07 & 08)
```text
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│             INSIDE BP-CMS              │       │          OUTSIDE BP-CMS                │
│                                        │       │                                        │
│  - MediaAsset ID: "MED-2026-0042"      │       │  - Google Drive / Cloud Storage        │
│  - Storage Provider: "GOOGLE_DRIVE"    │       │  - Physical File: "take_03_master.mp4" │
│  - External Locator: "drive://.../xyz" │──────►│  - Binary Size: 1.42 GB                │
│  - SHA-256 Checksum: "e3b0c442..."     │       │  - Disk Sectors & Blocks               │
│  - Resolution: 1080x1920 (9:16)        │       │  - Storage Quota Consumption           │
│  - Loudness: -14.1 LUFS                │       │                                        │
│  - Media Status: "REGISTERED"          │       │                                        │
└────────────────────────────────────────┘       └────────────────────────────────────────┘
```

### 9.3 AI Boundary (Principle 09)
```text
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│             INSIDE BP-CMS              │       │          OUTSIDE BP-CMS                │
│                                        │       │                                        │
│  - Author drafts prompt & context      │──────►│  - Gemini Model Inference             │
│  - Receives candidate text             │◄──────│  - Generates raw completion tokens     │
│                                        │       │                                        │
│  - HUMAN AUTHOR reviews & edits        │       │                                        │
│  - HUMAN VERIFIER approves question    │       │  [AI IS FORBIDDEN FROM EXECUTING       │
│  - HUMAN QC certifies master cut       │       │   APPROVAL GATES OR MUTATING STATE]    │
│  - Human Decision permanently logged   │       │                                        │
└────────────────────────────────────────┘       └────────────────────────────────────────┘
```

### 9.4 Analytics Boundary
The analytics pipeline strictly distinguishes external telemetry from internal intelligence:
```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. EXTERNAL SOURCE METRICS (Outside: YouTube Analytics raw fluctuating counters)        │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ (Ingestion Adapter)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. BP-CMS INGESTION (Inside: Sanitizes and stamps milestone interval: 24h, 7d, 30d)     │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. BP-CMS ANALYTICS RECORDS (Inside: Immutable analytical snapshot linked to project)   │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. BP-CMS PERFORMANCE ANALYSIS (Inside: Human diagnostic review correlating drop-offs)  │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. BP-CMS INTELLIGENCE LOOP (Inside: Approved curriculum sprint directives seeding St.01)│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.5 Configuration Boundary
- **Application Configuration (Inside):** Business constraints, pacing guidelines (45–60s), audio mastering thresholds (-14 LUFS), pagination sizes, rate limits.
- **Provider Configuration (Outside):** Cloud project numbers, IAM roles, OAuth consent screen configurations, platform API quota ceilings.
- **Secrets Governance:** All sensitive credentials (`SESSION_SECRET`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`) reside in environment variables and are **never** hardcoded into application source files.

---

## 10. Authoritative Boundary Rules

1. **Internal State Sovereignty:** BP-CMS is the sole authority for its internal business state, entity relationships, and workflow progression.
2. **External Execution Containment:** External platforms own only their technical execution. Failures in external systems must not compromise internal data integrity.
3. **References Over Binaries:** BP-CMS stores lightweight metadata and cryptographic references; physical binary objects remain external.
4. **No External Workflow Bypass:** External systems, third-party webhooks, and AI responses cannot bypass BP-CMS authorization gates or transition rules.
5. **Human Gate Sovereignty:** External provider responses (e.g., successful AI generation, 200 OK from video upload) never equate to business approval. Human signoff is mandatory.
6. **Adapter Isolation:** Every external integration must be encapsulated behind an adapter interface. Domain services must never make direct raw HTTP calls to third-party endpoints.
7. **Fault Isolation & Graceful Degradation:** A total outage of YouTube, Gemini, or Google Drive must not crash internal question authoring, teleprompter displays, or audit logging.
8. **Provider Swappability:** Substituting an external provider (e.g., swapping Google Drive for S3, or Gemini for Claude) must require changing only the boundary adapter, leaving core domain services untouched.
9. **Monolithic Boundary Discipline:** Internal domain modules communicate via direct TypeScript service interfaces; no internal network microservice boundaries are permitted.
10. **Testable Boundary Contracts:** All boundary adapters must support mock/stub implementations for offline automated testing.

---

## 11. Brownfield Comparison & Component Classification

Comparing the target boundary against the actual Stage 03 baseline:

| Existing Component / File | Current Stage 03 Role | Target Boundary Disposition | Action for Subsequent Stages |
| :--- | :--- | :---: | :--- |
| `src/server/routes.ts` | Monolithic 6,562-line API | **CONSOLIDATE / MIGRATE** | Decompose into 8 modular domain routers in Stage 13 & 15. |
| `src/lib/services/google-drive.service.ts` | Direct Drive API calls in service | **ISOLATE** | Encapsulate as formal `MediaStorageAdapter` in Stage 17. |
| `src/lib/ai/gemini.client.ts` | Direct Gemini SDK client | **ISOLATE** | Encapsulate as formal `AiAssistantAdapter` in Stage 19. |
| `src/lib/repositories/base.repository.ts` | Google Sheets v4 persistence | **ISOLATE** | Encapsulate as datastore adapter behind repository interfaces in Stage 12 & 16. |
| `VideoEditPage`, `VideoFinalPage`, etc. (6 pages)| Unmounted historical pages (4,900+ lines)| **RETIRE** | Safely delete after verifying `VideoDetailPage.tsx` tab coverage in Stage 21. |
| `src/server/routes.ts:138-139` (Admin fallback)| Silent admin fallback in `getRequestActor`| **RETIRE** | Eliminate fallback; enforce strict 401/403 rejection in Stage 09 & 15. |
| `WorkflowOrchestrationService` (11 states) | Historical Phase 9 state machine | **CONSOLIDATE** | Unify into canonical 15-step Workflow Engine in Stage 07 & 14. |
| `QuestionStudioPage.tsx` | Step 01 Question drafting | **KEEP** | Retain and bind to verified domain contracts in Stage 19. |
| `VideoDetailPage.tsx` | Consolidated workbench (tabs) | **KEEP** | Retain as primary studio production UI shell in Stage 20 & 21. |
| `SocialReviewPage.tsx` | Step 09 9:16 safe-zone review | **KEEP** | Retain as publishing review workbench in Stage 22. |
| `PublishingPage.tsx` | Step 11 distribution dispatch | **KEEP** | Retain as distribution control workbench in Stage 23. |
| `SocialAnalyticsPage.tsx` | Step 13 performance telemetry | **KEEP** | Retain as analytics ingestion UI in Stage 25. |

---

## 12. Future SDLC Stage Traceability

The boundary decisions established in Stage 05 directly govern the scope and implementation of all downstream stages:

| SDLC Stage | Stage Name | Boundary Governance & Enforcement Responsibility |
| :---: | :--- | :--- |
| **Stage 06** | Domain Model | Models internal entities only; excludes external provider schemas. |
| **Stage 07** | Canonical Workflow | Encapsulates the 15 steps entirely within BP-CMS. |
| **Stage 08** | State Models | Establishes the 5 decoupled state dimensions (`workflow_step` $\neq$ `media_status`, etc.). |
| **Stage 09** | RBAC Model | Implements internal role capabilities; removes silent admin fallbacks. |
| **Stage 10** | Frontend / IA | Aligns UI navigation to the 8 internal domains; removes dead page routes. |
| **Stage 11** | Component Contracts | Defines typed props and events for internal workbenches. |
| **Stage 12** | Database Architecture | Treats Google Sheets/SQL as persistence adapters behind repository interfaces. |
| **Stage 13** | API Contracts | Defines REST envelopes and Zod schemas for all internal domain endpoints. |
| **Stage 14** | Workflow Engine | Builds the single authoritative server-side transition engine. |
| **Stage 15** | Auth Implementation | Enforces server-authoritative authentication and capability middleware. |
| **Stage 16** | Persistence Implementation | Implements resilient CRUD with optimistic concurrency locking. |
| **Stage 17** | Media Storage Adapter | Implements Google Drive streaming adapter with checksum validation. |
| **Stage 19** | Question Production | Implements Step 01 & 02 with human-gated verification. |
| **Stage 20** | Script Production | Implements Step 03 teleprompter script workbench. |
| **Stage 21** | Video Production | Implements Steps 04–07 (filming, raw video, editing bay, Final QC). |
| **Stage 22** | Thumbnail & Social Review | Implements Steps 08 & 09 (mobile cover art, 9:16 safe-zone review). |
| **Stage 23** | Publishing | Implements Steps 10 & 11 (release staging, idempotent dispatch). |
| **Stage 24** | Platform Sync | Implements Step 12 (live URL playback health verification). |
| **Stage 25** | Analytics | Implements Step 13 (milestone telemetry ingestion: 24h, 7d, 30d). |
| **Stage 26** | Intelligence Loop | Implements Steps 14 & 15 (drop-off diagnostics, closed-loop sprint directives). |
| **Stage 27** | Audit & Notifications | Implements append-only audit ledger and in-app alerts. |
| **Stage 28** | E2E Integration | Verifies complete round-trip across all 15 stages. |
| **Stage 29** | Security & Concurrency | Audits boundary penetration resistance and race condition locks. |
| **Stage 30** | Final System Audit | Production readiness certification. |

---

## 13. Stage 05 Completion Checklist

- [x] Internal system ownership defined across 16 core business capabilities.
- [x] External systems defined (Google Drive, YouTube, Social Networks, AI Providers, Archives, Email).
- [x] Internal domain grouping organized as an 8-module Modular Monolith (Principle 11).
- [x] Comprehensive 26-row Explicit Ownership Matrix established.
- [x] Data ownership rules codified (business state sovereignty, single source of truth).
- [x] External boundary interaction models detailed for all 6 external integrations.
- [x] Textual target system context diagram created.
- [x] Workflow boundary strictly isolated from external ownership.
- [x] Media boundary (Principles 07 & 08) rigorously enforced.
- [x] AI boundary (Principle 09) rigorously enforced (human approval gates protected).
- [x] Publishing, Analytics, Notification, and Configuration boundaries formalized.
- [x] 10 authoritative boundary rules codified.
- [x] Brownfield comparison completed with 12 existing components classified (`KEEP`, `CONSOLIDATE`, `ISOLATE`, `RETIRE`).
- [x] Traceability mapped across all downstream stages (Stage 06 through Stage 30).
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 05 — TARGET SYSTEM BOUNDARY
================================================================================
Artifact:            docs/architecture/05-TARGET-SYSTEM-BOUNDARY.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 05 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 05. Awaiting Stage 06 Instruction.
================================================================================
```
