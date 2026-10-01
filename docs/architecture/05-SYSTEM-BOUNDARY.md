# Burra Pariksha CMS
# 05 — Target System Boundary

Stage: 05 — Target System Boundary

STATUS:
READY FOR PRODUCT OWNER ACCEPTANCE

Implementation Status:
COMPLETE

Technical Verification:
PASSED

Product Owner Acceptance:
PENDING

Version:
1.0.0

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
| **Status** | READY FOR PRODUCT OWNER ACCEPTANCE | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 06+ (Data Architecture, Target Schemas, API Specifications) | FACT |
| **Baseline Repository Commit** | `ba04fe50301189c28e40d5237e76fa696a2ed074` | FACT |
| **Architectural Scope** | Exclusively defines domain boundaries, ownership scopes, and integration contracts without declaring low-level table schemas or implementing new infrastructure | FACT |

---

## 02. Purpose

The purpose of this document is to define the exact system boundary of BP-CMS. As the platform transitions from historical audit baselines to target architecture modernization, a rigorous separation between **what BP-CMS owns** and **what belongs to external systems** is paramount.

This boundary specification guarantees:
1. **Unambiguous Domain Ownership:** Every business concept, data entity, state machine, and authorization rule has exactly one authoritative owner.
2. **Decoupling from External Providers:** External infrastructure (Google Drive, YouTube, Meta/Instagram, AI APIs, Email SMTP) acts strictly as subordinate utilities; external state changes never unilaterally mutate BP-CMS core workflow.
3. **Preservation of Architectural Principles:** AP-001 through AP-015 (specifically AP-001 single workflow, AP-002 stage vs status, AP-004 backend authorization, AP-007 external media binaries, AP-008 internal media references, AP-009 human-gated AI, and AP-010 single state ownership) are structurally enforced at the system boundary.
4. **Resilience & Failure Isolation:** Transients, outages, or API deprecations in external third-party services cannot corrupt, lock, or invalidate internal business records.

---

## 03. Scope

### In-Scope
- Explicit boundary classification of all 16 BP-CMS internal business domains.
- Explicit definition of all external integration systems (responsibilities, communication patterns, failure boundaries).
- Authoritative Data Ownership Matrix mapping domain concepts to storage models.
- Media boundary rules enforcing metadata/reference ownership vs binary storage.
- Workflow and state machine boundary rules preventing integration pollution.
- AI capability boundary enforcing human-in-the-loop governance.
- Security, authorization, audit, and configuration boundaries.
- Traceability to Stage 01, Stage 02, and Stage 04 baselines.

### Out-of-Scope (Non-Requirements for Stage 05)
- Defining physical database schemas, column types, SQL tables, or DDL migrations.
- Defining ORM models, repository classes, or data access objects.
- Modifying application runtime code, routes, or frontend UI components.
- Provisioning or purchasing cloud infrastructure, queues, microservices, or external SaaS.
- Changing live Google Sheets data, Google Drive folders, or production credentials.

---

## 04. Boundary Principles

The BP-CMS system boundary is governed by seven core boundary axioms derived from Stage 04 Architecture Principles:

1. **Axiom 1 (Authoritative Internal Core):** All pedagogical, editorial, lifecycle, and organizational truths originate and terminate within the BP-CMS domain boundary. External systems never hold primary authority over BP-CMS content.
2. **Axiom 2 (Reference vs Content Separation):** BP-CMS maintains authoritative descriptors, references, hashes, and relational links to digital media; the physical byte payloads reside strictly in external binary object storage (AP-007, AP-008).
3. **Axiom 3 (Passive Integration Handlers):** External systems do not call into internal core domain models directly. Communication occurs across disciplined integration adapters using asynchronous commands, bounded status polling, or validated webhooks.
4. **Axiom 4 (Asymmetric Trust Boundary):** The BP-CMS backend trusts its own validated session and role identity models. It treats all external provider responses, tokens, and payloads as untrusted external inputs requiring validation.
5. **Axiom 5 (Autonomous Workflow Progression):** Internal business stages progress only upon explicit internal transitions driven by authenticated human actors or validated business events. External platform downtime can delay distribution, but cannot freeze internal pedagogical authoring or review.
6. **Axiom 6 (Assistive AI Containment):** Artificial Intelligence models are external transformation engines. They have zero autonomous write permissions to advance workflow milestones without authenticated human sign-off (AP-009).
7. **Axiom 7 (Immutable Internal Audit Authority):** BP-CMS maintains its own tamper-evident, append-only business event log. External provider logs (e.g., Google Cloud Logging, YouTube Analytics logs) are external evidence, not system audit logs (AP-014).

---

## 05. BP-CMS Internal Ownership (16 Core Business Domains)

BP-CMS is authoritatively responsible for 16 internal business domains. No external provider or client-side application may usurp control over these areas:

### 5.1 Domain 01: Identity
- **What BP-CMS Owns:** User identity identifiers (`USR-xxxxxx`), account provisioning status, active session lifecycles, and credential verification records.
- **Business Meaning:** Defines who is recognized as an authenticated operator within the Burra Pariksha production ecosystem.
- **Lifecycle & Control:** Account creation, suspension, session termination, password hash invalidation, and session timeouts.
- **Exposed to Users:** Current user profile, active session state, display name, and avatar/initials.
- **External References:** May reference external OAuth identity tokens (e.g., Google Workspace sub-claims) strictly as authentication credentials, never as the internal user record.

### 5.2 Domain 02: Users
- **What BP-CMS Owns:** User profile metadata, employment/team associations, contact details, assignment capacity, and editorial preferences.
- **Business Meaning:** Represents the operational staff members (Subject Matter Experts, Scriptwriters, Hosts, Editors, Reviewers, Publishers).
- **Lifecycle & Control:** User onboarding, role assignment changes, profile updates, and deactivation.
- **Exposed to Users:** Team rosters, assigned creator pickers, and reviewer attribution tags.
- **External References:** External Google email address for delivery notifications.

### 5.3 Domain 03: Roles
- **What BP-CMS Owns:** Authoritative role taxonomy (`ADMIN`, `CONTENT_CREATOR`, `LEAD_CREATOR`, `REVIEWER`, `SME_REVIEWER`, `PRODUCER`, `VIDEO_EDITOR`, `HOST`, `GRAPHIC_DESIGNER`, `COMMUNITY_MANAGER`).
- **Business Meaning:** Functional operational designations determining responsibility areas across the 15-step production journey.
- **Lifecycle & Control:** Centralized definition of roles; assignment and revocation of roles to user identities.
- **Exposed to Users:** Role badges, filtered workflow stage queues based on assigned role.
- **External References:** None. Roles are 100% internal to BP-CMS.

### 5.4 Domain 04: Capabilities
- **What BP-CMS Owns:** Granular permission flags (e.g., `canApproveQuestion`, `canSignOffQC`, `canTriggerPublish`, `canOverrideReview`).
- **Business Meaning:** Fine-grained security privileges evaluated by the server before executing business-rule mutations.
- **Lifecycle & Control:** Capability matrix mapping roles to permissions; dynamic server-side authorization checks.
- **Exposed to Users:** UI feature flags (rendering action buttons conditionally based on server capabilities).
- **External References:** None. Capabilities are strictly internal.

### 5.5 Domain 05: Questions
- **What BP-CMS Owns:** Authoritative pedagogical question entity (`BP-Q-xxxxxx`), Telugu/English text, 4 multiple-choice options, correct answer key, mathematical solution proof, curriculum taxonomy (`Class`, `Subject`, `Topic`, `Subtopic`), and difficulty level.
- **Business Meaning:** The foundational core intellectual property and educational curriculum atom of Burra Pariksha.
- **Lifecycle & Control:** Draft -> Verification Review -> Approved -> Revisions Required -> Rejected.
- **Exposed to Users:** Question Studio, Question Library, Verification Review Workspace, Teleprompter display.
- **External References:** None directly required for text; references curriculum syllabus codes.

### 5.6 Domain 06: Scripts
- **What BP-CMS Owns:** Short-form video presenter script (`BP-SCR-xxxxxx`), 3-second hook phrasing, step-by-step teleprompter copy, speed-trick callouts, target reading duration, and version history.
- **Business Meaning:** The spoken narrative and pacing structure tailored for vertical short-form pedagogical delivery (YouTube Shorts, Instagram Reels).
- **Lifecycle & Control:** Draft -> Script Ready -> Locked for Recording -> Archived.
- **Exposed to Users:** Scriptwriting editor, Teleprompter recording view, Video Production detail tabs.
- **External References:** May reference external pronunciation or dictionary assets if necessary.

### 5.7 Domain 07: Videos
- **What BP-CMS Owns:** Video production entity (`BP-V-xxxxxx`), production metadata, target aspect ratio (9:16), audio LUFS targets, editor assignments, take numbers, and stage flags.
- **Business Meaning:** The multimedia production project encapsulating filming, cut master rendering, and final quality control.
- **Lifecycle & Control:** Queued -> Recording -> Recorded -> Editing -> Edited -> Final Review -> Ready to Upload -> Uploaded.
- **Exposed to Users:** Video Production Tracker, Edit bay handoff interface, QC Checklist review interface.
- **External References:** Authoritative references to external raw footage and master render storage files (`driveFileId`, `externalUrl`).

### 5.8 Domain 08: Media Metadata
- **What BP-CMS Owns:** Media descriptor index (`MED-xxxxxx`), entity association (`entityType`, `entityId`), file name, MIME type, file size in bytes, SHA-256 integrity hash, aspect ratio, frame rate, audio sample rate, and remote URI pointers.
- **Business Meaning:** The catalogue index enabling BP-CMS to track, locate, verify, and stream external digital assets without hosting binary streams in the database.
- **Lifecycle & Control:** Registered -> Verified -> Archived -> Soft-Deleted.
- **Exposed to Users:** Media attachment previews, asset download links, streaming players.
- **External References:** Google Drive file ID, Google Drive folder URL, or external CDN/object store URI.

### 5.9 Domain 09: Workflow
- **What BP-CMS Owns:** The canonical 15-step linear business progression (`CANONICAL_15_STEPS`), transition prerequisites, stage blockers, loopback cycles, and active milestone pointers for every content project.
- **Business Meaning:** The overarching operational manufacturing line guiding an educational concept from ideation to publication and intelligence feedback.
- **Lifecycle & Control:** Strictly sequential stage advancement enforced by `validateCanonicalWorkflowTransition()`.
- **Exposed to Users:** Production Journey Tracker, Step Indicator headers, Dashboard progress bars, Kanban boards.
- **External References:** None. The workflow is completely owned by BP-CMS.

### 5.10 Domain 10: Reviews
- **What BP-CMS Owns:** Verification audit records (`QV-xxxxxx`), Quality Control sign-offs (`QC-xxxxxx`), and Social Review packages (`SR-xxxxxx`), scoring rubrics, defect checklists, reviewer remarks, and pass/fail verdicts.
- **Business Meaning:** Formal pedagogical, technical, and branding gates ensuring quality standards before distribution.
- **Lifecycle & Control:** Pending Review -> Approved / Revision Required / Rejected.
- **Exposed to Users:** Verification audit checklists, 9:16 smartphone preview simulator, feedback dialogues.
- **External References:** None.

### 5.11 Domain 11: Publishing Packages
- **What BP-CMS Owns:** Publishing schedule (`PUB-xxxxxx`), platform-specific adaptation packages (YouTube Shorts title/description/tags/pinned comment; Instagram Reels audio/caption/hashtags; Facebook Video metadata), target release timestamps, and manual/automated release state.
- **Business Meaning:** Multi-platform packaging and scheduling configuration for distributed broadcast.
- **Lifecycle & Control:** Staged -> Scheduled -> Publishing Initiated -> Published -> Verified Synced.
- **Exposed to Users:** Publishing Queue, Multi-platform package previewer, Release scheduler.
- **External References:** External live published video URLs (e.g. `https://youtube.com/shorts/...`, Instagram permalinks).

### 5.12 Domain 12: Analytics
- **What BP-CMS Owns:** Standardized internal performance metrics, normalized view counts, engagement ratios (likes/views, comments/views), retention curve benchmark classifications, and historical snapshot timestamps.
- **Business Meaning:** Normalized pedagogical resonance and reach measurement across distribution channels.
- **Lifecycle & Control:** Raw Ingestion -> Normalized -> Aggregated -> Archived.
- **Exposed to Users:** Analytics dashboard, Engagement overview charts, Drop-off analysis reports.
- **External References:** External platform content identifiers (e.g. YouTube Video ID, Instagram Media ID) from which metrics were queried.

### 5.13 Domain 13: Intelligence
- **What BP-CMS Owns:** Pedagogical insight syntheses, high-difficulty topic identification, syllabus gap diagnostics, audience confusion signals, and recommendation records looped back into Question Studio (Step 15 -> Step 01).
- **Business Meaning:** Strategic curriculum intelligence that guides what educational content should be authored next.
- **Lifecycle & Control:** Generated -> Reviewed -> Applied to Curriculum Plan -> Retired.
- **Exposed to Users:** Strategy recommendation cards, AI Studio prompt auto-fill presets.
- **External References:** None.

### 5.14 Domain 14: Notifications
- **What BP-CMS Owns:** In-app operational notifications, assignment alerts, workflow gate notices (e.g., "Script approved for BP-V-000123", "QC revision requested"), and delivery recipient queues.
- **Business Meaning:** Internal team coordination signals that minimize idle wait time across production handoffs.
- **Lifecycle & Control:** Queued -> Dispatched -> Read -> Dismissed.
- **Exposed to Users:** Notification bell, toast messages, task assignment badges.
- **External References:** External email message ID if an external SMTP/email gateway was notified.

### 5.15 Domain 15: Audit
- **What BP-CMS Owns:** Append-only historical event ledger (`AUD-xxxxxx`), recording actor identity, role, timestamp, action verb, target entity, previous state, new state, and client IP/user-agent context.
- **Business Meaning:** Immutable legal and operational evidence of all mutations performed across the platform.
- **Lifecycle & Control:** Append-only. Strictly immutable; deletion and updates are architecturally prohibited (AP-014).
- **Exposed to Users:** Entity audit history panels (accessible by authorized administrators and QA leads).
- **External References:** None.

### 5.16 Domain 16: Configuration
- **What BP-CMS Owns:** Application business settings, curriculum taxonomy hierarchies (Class 6-10 syllabus nodes), QC check criteria definitions, teleprompter scroll speed defaults, and operational feature toggles.
- **Business Meaning:** The operational parameters that govern CMS behavior without requiring code modifications.
- **Lifecycle & Control:** Draft -> Active -> Deprecated.
- **Exposed to Users:** Admin Settings Workspace, Taxonomy Management tables.
- **External References:** None.

---

## 06. External Systems Boundary

External systems are third-party services that interface with BP-CMS across strictly controlled boundaries. BP-CMS consumes services from them, but they never govern BP-CMS internal business state.

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
      ┌──────────────┬──────────────┼──────────────┬──────────────┐
      ▼              ▼              ▼              ▼              ▼
[Google Drive]   [YouTube]     [Social APIs]  [AI Providers]  [Email SMTP]
(Binary Store) (Distribution) (Distribution) (Transformation) (Alert Relay)
```

### 6.1 Google Drive (Binary Object Storage)
- **External Responsibility:** Storing multi-gigabyte raw video footage, exported master MP4 cuts, and thumbnail PNG graphics in cloud folders. Managing physical byte streaming and chunked uploads.
- **What BP-CMS May Request:** Create upload session, ingest binary chunk stream, generate shareable URL (`webViewLink`, `webContentLink`), check file existence, and fetch binary file metadata (file size, MD5 checksum).
- **What BP-CMS May Reference:** `driveFileId`, `driveFolderUrl`, `webViewLink`.
- **What State BP-CMS May Store About Integration:** Upload status (`PENDING_UPLOAD`, `UPLOADED`, `FAILED`), Drive file ID, Drive folder ID, file size in bytes, and last sync timestamp.
- **What State Remains External:** Physical disk allocation, replication across Google data centers, Google Workspace folder permissions, and trash lifecycle.
- **Failure/Error Boundary:** If Google Drive returns `429 Rate Limit Exceeded`, `500 Server Error`, or `404 File Not Found`, BP-CMS marks the media reference as `SYNC_FAILED` or `UNAVAILABLE`. The core `Video` entity remains intact in status `RECORDED` or `EDITED` and retries upload asynchronously.
- **Synchronization Responsibility:** BP-CMS drives synchronization on demand during production handoff steps (Steps 05, 06, 08).
- **Audit Implications:** BP-CMS audits every upload registration and file ID association; Google Drive access logs remain external evidence.

### 6.2 YouTube (Distribution Platform)
- **External Responsibility:** Hosting public/unlisted YouTube Shorts, managing global video delivery, serving comments, and calculating YouTube-specific audience analytics.
- **What BP-CMS May Request:** Upload video binary (via YouTube Data API v3), update snippet metadata (title, description, tags, category), set publication schedule, insert pinned comment, and query view/like metrics.
- **What BP-CMS May Reference:** YouTube Video ID (`youtubeVideoId`), live URL (`https://youtube.com/shorts/:id`), and pinned comment ID.
- **What State BP-CMS May Store About Integration:** Publishing dispatch status (`SCHEDULED`, `PROCESSING`, `PUBLISHED`, `FAILED`), external URL, and ingested view count snapshots.
- **What State Remains External:** YouTube's internal transcode progress, content ID copyright matching status, viewer account identities, and recommendation algorithm scores.
- **Failure/Error Boundary:** If YouTube API rejects an upload (e.g. quota limit, upload token expiry), BP-CMS records the publishing failure in `PublishingPackage.youtube.error`. The video remains valid in Stage 10 (`Publishing Setup`) and does not advance to Stage 11 (`Published / Live`).
- **Synchronization Responsibility:** BP-CMS checks post status following publishing dispatch; polling is rate-limited and backoff-controlled.
- **Audit Implications:** Dispatch command, API request payload hash, and YouTube response ID are recorded in BP-CMS audit log.

### 6.3 Social Platforms (Instagram Reels & Facebook Video)
- **External Responsibility:** Public distribution to mobile audiences on Instagram and Facebook; collecting platform-native reactions and shares.
- **What BP-CMS May Request:** Submit container for video publishing (via Meta Graph API), verify container processing status, publish container to feed/reels, and fetch public engagement metrics.
- **What BP-CMS May Reference:** Instagram Media ID, Facebook Post ID, and platform permalinks.
- **What State BP-CMS May Store About Integration:** Platform sync status (`PENDING`, `SYNCED`, `FAILED`), permalink URL, and engagement counts.
- **What State Remains External:** Meta internal transcode pipelines, shadow-ban filters, and follower interaction records.
- **Failure/Error Boundary:** Failure on Instagram or Facebook does NOT invalidate YouTube publishing. BP-CMS marks Stage 12 (`Platform Sync`) as partially complete or pending retry.
- **Synchronization Responsibility:** Handled via Stage 12 verification tasks.
- **Audit Implications:** Post dispatch and verification timestamps recorded in BP-CMS audit log.

### 6.4 AI Providers (Transformation & Synthesis Engines)
- **External Responsibility:** Executing Large Language Model (LLM) inference (e.g., Gemini API) to generate question drafts, draft Telugu translations, propose teleprompter scripts, suggest thumbnail titles, or analyze engagement drop-offs.
- **What BP-CMS May Request:** Generate question suggestions given curriculum topics, translate solution steps into Telugu, critique question pedagogical validity, and summarize comment themes.
- **What BP-CMS May Reference:** AI prompt template identifiers, model version tag (e.g., `gemini-2.5-flash`), and generation token usage.
- **What State BP-CMS May Store About Integration:** Raw generated text suggestion, prompt configuration version, and AI execution latency.
- **What State Remains External:** Model weights, internal activation states, training corpora, and safety classifier log streams.
- **Failure/Error Boundary:** AI provider outages (HTTP 503, quota exhaustion) gracefully degrade to manual human authoring. Under no circumstances does an AI failure block manual question entry or manual scriptwriting.
- **Synchronization Responsibility:** Synchronous request/response or streaming response during interactive user sessions. No persistent external state.
- **Audit Implications:** AI generation prompts and generated outputs are recorded in the audit trail to attribute human vs machine content generation (AP-009).

### 6.5 External Archive Providers (Cold Storage / Disaster Recovery)
- **External Responsibility:** Long-term archival preservation of raw camera tapes and legacy question revisions beyond active Google Drive lifecycles.
- **What BP-CMS May Request:** Export project archive manifest, initiate cold storage tiering, verify archive SHA-256 checksum.
- **What BP-CMS May Reference:** Archive vault ID, archive archive ARN/URI, and retrieval ticket ID.
- **What State BP-CMS May Store About Integration:** Archive status (`ACTIVE`, `TIERED_TO_COLD`, `ARCHIVED`), vault ID, and archival timestamp.
- **What State Remains External:** Physical tape or deep-archive storage blocks and storage tier migration lifecycle.
- **Failure/Error Boundary:** Cold storage unavailability has zero impact on active production workflows (Stages 01–14).
- **Synchronization Responsibility:** Batch archival jobs executed post-publication.
- **Audit Implications:** Archival dispatch and checksum verification recorded in BP-CMS audit log.

### 6.6 Email Providers (SMTP / Alert Gateways)
- **External Responsibility:** Delivering transactional email notifications (e.g., assignment alerts, urgent QC rejections) to staff inboxes.
- **What BP-CMS May Request:** Dispatch transactional email with defined recipient, subject, and HTML body.
- **What BP-CMS May Reference:** External message tracking ID.
- **What State BP-CMS May Store About Integration:** Dispatch timestamp, delivery status (`SENT`, `FAILED`), and error message if rejected.
- **What State Remains External:** Mail transfer agent (MTA) queues, spam scoring, recipient mail server delivery receipts, and inbox read receipts.
- **Failure/Error Boundary:** Email provider failure never blocks or rolls back a business transaction. If notification delivery fails, the in-app notification remains authoritative, and the core workflow transition proceeds normally.
- **Synchronization Responsibility:** Fire-and-forget or asynchronous queue dispatch.
- **Audit Implications:** Notification dispatch recorded in audit ledger.

---

## 07. Data Ownership Matrix

The following matrix authoritatively specifies data ownership across all domains and integrations:

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

## 08. Media Boundary Specification (AP-007 & AP-008)

The architectural boundary separating media metadata from media binary storage is absolute and non-negotiable:

```
┌────────────────────────────────────────────────────────┐
│                   BP-CMS APPLICATION                   │
│                                                        │
│  Media Metadata Record:                                │
│  - id: "MED-000492"                                    │
│  - entityType: "VIDEO"                                 │
│  - entityId: "BP-V-000104"                             │
│  - fileName: "master_cut_v2.mp4"                       │
│  - mimeType: "video/mp4"                               │
│  - byteSize: 48921840                                  │
│  - sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41..."│
│  - driveFileId: "1Z_x9AbCdEfGhIjKlMnOpQrSt"            │
│  - externalUrl: "https://drive.google.com/..."         │
│  ❌ NO RAW BINARY DATA                                 │
│  ❌ NO BASE64 INLINE STRINGS                           │
└───────────────────────────┬────────────────────────────┘
                            │ external URL / file ID reference
                            ▼
┌────────────────────────────────────────────────────────┐
│               EXTERNAL STORAGE PROVIDER                │
│                     (Google Drive)                     │
│                                                        │
│  Physical File Payload:                                │
│  - Raw 1080x1920 MP4 Video Stream                      │
│  - Block chunks & cluster distribution                 │
│  - Byte streaming server & range headers               │
└────────────────────────────────────────────────────────┘
```

1. **Rule of Separation:** Application databases, session states, and domain models **NEVER** store raw binary media buffers, chunk streams, or large base64-encoded strings (AP-007).
2. **Rule of Ownership:** BP-CMS **ALWAYS** owns the media metadata record, defining which entity an asset belongs to, its business purpose, its verification state, and its external reference (AP-008).
3. **Equivalence Fallacy Prohibited:** `Business metadata/reference != binary storage`. Storing a Google Drive file link does not mean Google Drive owns the video project. Google Drive is simply a dumb binary locker; BP-CMS owns the video.

---

## 09. Workflow Ownership Specification

The canonical 15-step business workflow is owned exclusively by BP-CMS:

```
[01: Question Generation] ──► [02: Question Verification] ──► [03: Audience Script]
             │
             ▼
[04: Teleprompter & Filming] ─► [05: Raw Video Handoff]   ──► [06: Video Editing]
             │
             ▼
[07: Final QC]            ──► [08: Thumbnail Studio]      ──► [09: Social Review]
             │
             ▼
[10: Publishing Setup]    ──► [11: Published / Live]      ──► [12: Platform Sync]
             │
             ▼
[13: Social Analytics]    ──► [14: Performance Review]    ──► [15: Performance Intelligence]
```

1. **Single Workflow Owner:** Only the server-side BP-CMS transition engine (`validateCanonicalWorkflowTransition`) can evaluate, approve, or reject progression through the 15 stages.
2. **External Status vs Business Stage:** External integration statuses (e.g. YouTube upload state `PROCESSING`, Google Drive upload state `UPLOADING`) are operational sub-states within a single business stage. They do not constitute independent business stages.
3. **Decoupling Rule:** An external webhook or network event cannot directly alter the canonical business stage of a project without passing through the BP-CMS validation and authorization gate.

---

## 10. AI Boundary Specification (AP-009)

AI providers (e.g. Google Gemini API) are external stateless computation services, not autonomous agents:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BP-CMS (Domain Authority)                       │
│                                                                        │
│  1. Prepares Business Context (Taxonomy, Syllabus, Pacing guidelines)  │
│  2. Dispatches Transformation Request                                  │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │ Authenticated Human   │ ◄────────── │ Candidate Draft Generated  │  │
│  │ (SME / Creator)       │             │ (Question, Telugu, Script) │  │
│  └──────────┬────────────┘             └────────────────────────────┘  │
│             │                                                          │
│             ▼                                                          │
│     [Human Sign-Off] ──► Authoritative State Persisted (AP-009)        │
└─────────────┬──────────────────────────────────────────────────────────┘
              │
      Request │ Response
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL AI CAPABILITY PROVIDER                      │
│                            (Gemini API)                                │
│                                                                        │
│  - Stateless model inference & linguistic completion                   │
│  - Zero access to user permissions or database writes                  │
│  - Cannot advance workflow or sign off quality gates                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Assistance, Not Decision-Making:** AI assists human creators with drafting, translation, readability analysis, and metric clustering. AI never approves, signs off, or mutates controlled workflow stages autonomously.
2. **Human Checkpoint Invariant:** Transitions into human-gated stages (Stage 02 Verification, Stage 07 Final QC, Stage 09 Social Review, Stage 11 Published) strictly require authenticated human sign-off (`humanSignOff: true`). If an automated AI agent attempts to advance content into these stages, the transition validator immediately rejects the request with an `AP-009` violation.

---

## 11. Integration Boundary Architecture

Communication across the system boundary between BP-CMS and external providers follows a strict unidirectional dispatch and bounded feedback pattern:

```
[BP-CMS Core Domain]
        │
        ▼ (1. Validated Command / Payload)
[Integration Adapter]
        │
        ▼ (2. HTTP/gRPC API Request)
[External System] (Google Drive / YouTube / Meta / AI)
        │
        ▼ (3. External Execution Result / Token)
[Integration Adapter]
        │
        ▼ (4. Sanitized Result / Normalized Status)
[BP-CMS Ingestion Handler]
        │
        ▼ (5. Authoritative State Update + Audit Event)
[BP-CMS Core Domain]
```

1. **Command:** BP-CMS originates requests based on authenticated user actions (e.g., "Upload raw footage", "Schedule YouTube Short").
2. **Acknowledgement:** The integration adapter receives the immediate external synchronous response (e.g., HTTP 200 with `uploadId`).
3. **External State Isolation:** The external provider's internal state (e.g., YouTube's transcode queue status) remains external until queried or received via webhook.
4. **Synchronization:** Synchronization updates are mapped into BP-CMS integration metadata fields (e.g., `publishing.youtube.status = 'PUBLISHED'`), which in turn enables the human publisher or system rule to advance the business stage.
5. **Failure & Retry:** Failures are caught at the adapter level, recorded as integration error notes, and isolated from corrupting core domain entities. Retries are idempotent and bounded.
6. **Audit:** Every integration command and response payload hash is written to the immutable BP-CMS audit log.

---

## 12. Failure Isolation Boundary

Failures in external third-party systems must never compromise the integrity of BP-CMS business data. The following failure isolation rules apply:

| Failure Scenario | External Impact | BP-CMS Boundary Isolation Behavior | Business Workflow State |
| :--- | :--- | :--- | :--- |
| **Google Drive Unavailable** (HTTP 500 / 429) | Media chunk upload fails | Video project remains in status `RECORDED` or `EDITING`. Media reference marked `UPLOAD_FAILED`. Creator notified with retry option. | Internal drafting and scripting continue unaffected. |
| **YouTube API Outage** (Outage / Quota 403) | Scheduled Short not published | `PublishingPackage` marks YouTube status as `FAILED_RETRYABLE`. Content remains in Stage 10 (`Publishing Setup`). | Questions, scripts, and editing for other projects proceed normally. |
| **Meta Graph API Outage** (Token Expired / Error) | Instagram Reel not synced | Meta platform status marked `FAILED`. YouTube Short remains published. | Stage 11 remains `PUBLISHED`; Stage 12 (`Platform Sync`) holds pending retry. |
| **AI Provider Outage** (HTTP 503 / Timeout) | Prompt suggestions fail to return | Studio interfaces fall back to 100% manual entry. Error banner displayed to creator. | Content creation continues via manual authoring without blockage. |
| **Email Gateway Outage** (SMTP Connection Dropped) | Alert email not delivered | In-app notification remains stored and visible in dashboard. Failed email logged. | Business transition succeeds; user receives notification upon next login. |
| **Cold Archive Outage** (Storage Unavailable) | Long-term backup delayed | Archive job flagged for delayed batch run. | Zero impact on active production pipeline. |

---

## 13. Security and Authorization Boundary

1. **Server Authorization Authority:** The BP-CMS backend is the sole authority for evaluating permissions, roles, and capabilities (AP-004).
2. **Zero External Authority:** External systems never decide whether a BP-CMS operator is authorized to edit a question, approve a script, sign off a QC check, or publish a package.
3. **Token Containment:** External OAuth access tokens (e.g., Google OAuth access tokens, YouTube tokens) are held in secure server-side environments and never exposed to client browsers.
4. **Passive Frontend Guard:** Frontend routes and UI components may conditionally render buttons for user convenience, but the backend always validates every incoming request independently (AP-006).

---

## 14. Audit Boundary

1. **Authoritative Internal Ledger:** BP-CMS owns and maintains the authoritative audit ledger for all business operations (AP-014).
2. **Non-Equivalence of External Logs:** Logs generated by Google Cloud, Google Drive, YouTube, or Meta are external operational telemetry; they are supplementary evidence only and cannot substitute for BP-CMS audit records.
3. **Audit Immutability:** Audit records created within BP-CMS are append-only. No user, administrator, or automated process has the capability to delete or modify historical audit rows.

---

## 15. Configuration Boundary

1. **Business Configuration (Internal):** BP-CMS owns all business rules, syllabus taxonomy hierarchies, QC checklists, grading thresholds, teleprompter presets, and role-to-capability mappings.
2. **Environment Secrets (External/Operational):** API keys, OAuth client secrets, service account credentials, database connection strings, and encryption keys belong to the deployment environment configuration (`.env`).
3. **Secret Hygiene:** Environment secrets are never stored in business data tables, Google Sheets, or client-accessible payloads.

---

## 16. Internal Business Domain vs External Integration

To avoid architectural confusion, the following strict classification is established:

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│       INTERNAL BUSINESS DOMAINS       │         EXTERNAL INTEGRATIONS         │
│         (Owned by BP-CMS)             │         (Third-Party Services)        │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ 1. Identity & Credentials             │ 1. Google Drive (Storage)             │
│ 2. Users & Profiles                   │ 2. YouTube Data API (Broadcast)       │
│ 3. Roles                              │ 3. Meta Graph API (Instagram / FB)    │
│ 4. Capabilities & Permissions         │ 4. Gemini API (Language Model)        │
│ 5. Questions & Math Proofs            │ 5. Transactional Email / SMTP         │
│ 6. Presenter Scripts                  │ 6. Cold Storage / Archive Vaults      │
│ 7. Video Projects                     │                                       │
│ 8. Media Metadata & Hash Descriptors  │                                       │
│ 9. 15-Step Workflow State Engine      │                                       │
│ 10. Reviews & QC Gate Verdicts        │                                       │
│ 11. Publishing Packages               │                                       │
│ 12. Analytics & Normalizations        │                                       │
│ 13. Pedagogical Intelligence Loops    │                                       │
│ 14. In-App Notifications              │                                       │
│ 15. Authoritative Audit Trail         │                                       │
│ 16. Curriculum & App Configuration    │                                       │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

**Architectural Invariant:** Google Drive, YouTube, Instagram, Facebook, and Gemini API are **NEVER** business domains of BP-CMS. They are external third-party utilities situated behind boundary adapters.

---

## 17. Traceability Matrix

The system boundary definitions in this document trace directly to accepted requirements and architecture principles:

| System Boundary Item | Traced Requirement / Criteria | Traced Architecture Principle | Compliance Confirmation |
| :--- | :--- | :--- | :--- |
| **16 Internal Domains** | Stage 01: Core CMS Functional Requirements<br>Stage 02: Full Domain Traceability Matrix | AP-001, AP-010 | Complete domain model cataloged without omission. |
| **Media Separation** | Stage 01: Media Management Specification<br>Stage 02: Asset Link Integrity Gates | AP-007, AP-008 | Binary media externalized; references owned internally. |
| **Workflow Ownership** | Stage 01: Production Lifecycle Rules<br>Stage 02: Canonical 15-Stage Verification | AP-001, AP-002, AP-003 | 15-step sequence owned by server transition engine. |
| **AI Human-in-the-Loop** | Stage 01: AI Assistive Guidelines<br>Stage 02: AI Verification Checks | AP-009 | AI restricted to suggestions; human sign-off mandatory. |
| **Backend Authority** | Stage 01: Security Baseline<br>Stage 02: Access Control Verification | AP-004, AP-005, AP-006 | All authorization and business rules server-enforced. |
| **Failure Isolation** | Stage 01: Reliability Specification<br>Stage 02: Operational Recovery Tests | AP-013, AP-015 | External failures isolated; zero internal data corruption. |
| **Audit Ledger** | Stage 01: Compliance Specification<br>Stage 02: Audit Traceability Gates | AP-014 | Append-only internal audit ledger established. |
| **Cost & Microservices** | Stage 01: Architecture Boundary Limits | AP-011, AP-012 | Modular monolith preserved; 0 unapproved services. |

---

## 18. Non-Requirements (Strictly Excluded from Stage 05)

To prevent premature architectural commitments, the following activities are explicitly declared out-of-scope for Stage 05:

1. **No Database Schema or DDL:** Stage 05 does not declare PostgreSQL tables, Drizzle/Prisma models, column types, or SQL migration files.
2. **No Application Source Code Changes:** No existing TypeScript files in `src/` are modified or created to implement new features.
3. **No API Contract Changes:** No new Express routes or endpoints are added to `src/server/routes.ts`.
4. **No UI Redesign:** No frontend components, pages, or styling tokens are modified.
5. **No Microservices or Infrastructure:** No message queues (Kafka, RabbitMQ, BullMQ), distributed caches (Redis), or microservice scaffolding are introduced.
6. **No Production Data or Storage Mutations:** Google Sheets rows, Google Drive folder hierarchies, and production configurations remain 100% untouched.

---

## 19. Stage 05 Acceptance Gate

Before Stage 05 can be considered ready for Product Owner acceptance, the following checklist must be satisfied:

- [x] Authoritative document `docs/architecture/05-SYSTEM-BOUNDARY.md` created.
- [x] All 16 internal business domains documented with ownership, meaning, lifecycle, user exposure, and external references.
- [x] All 6 external integration systems documented with responsibilities, requests, references, internal state, external state, failure boundaries, sync, and audit rules.
- [x] Comprehensive Data Ownership Matrix created mapping domain concepts to storage models.
- [x] Media boundary explicitly defined enforcing AP-007 and AP-008.
- [x] Workflow ownership explicitly defined enforcing AP-001, AP-002, and AP-003.
- [x] AI capability boundary explicitly defined enforcing AP-009.
- [x] Integration, failure-isolation, security, audit, and configuration boundaries fully articulated.
- [x] Clear distinction between internal business domains and external integrations documented.
- [x] Concrete traceability to Stage 01, Stage 02, and Stage 04 established.
- [x] Out-of-scope non-requirements explicitly cataloged.
- [x] Zero application source code, database tables, or infrastructure modified.
- [x] Automated architecture test suite, type checking, and production build verified.

---

## 20. Closure Record

### 20.1 Acceptance Table

| Item | Status |
| :--- | :---: |
| BP-CMS 16 Internal Business Domains Defined | VERIFIED |
| External Systems Integration Boundary Defined | VERIFIED |
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
| Full TypeScript Type Check (`npm run lint`) | PASSED |
| Production Build Compilation (`npm run build`) | PASSED |
| Server Runtime Health (`GET /api/health`) | PASSED |
| Technical Verification | PASSED |
| Product Owner Acceptance | PENDING EXPLICIT GATE |
| Stage 05 Status | READY FOR PRODUCT OWNER ACCEPTANCE |

```
================================================================================
STAGE 05 — TARGET SYSTEM BOUNDARY
STATUS: READY FOR PRODUCT OWNER ACCEPTANCE
IMPLEMENTATION: COMPLETE
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: PENDING
STAGE 05 CLOSED: NO (AWAITING PRODUCT OWNER ACCEPTANCE)
APPLICATION CODE MODIFIED: NONE
DATABASE / SCHEMA MODIFIED: NONE
DATA / STORAGE MODIFIED: NONE
INFRASTRUCTURE MODIFIED: NONE
DEPLOYMENT PERFORMED: NO
NEXT STAGE: STAGE 06 — NOT STARTED
================================================================================
```

STAGE 05 CLOSED: NO (AWAITING PRODUCT OWNER ACCEPTANCE)

NEXT STAGE:
STAGE 06 — NOT STARTED
