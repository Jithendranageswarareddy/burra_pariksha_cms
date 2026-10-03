# 09 — RBAC & CAPABILITY MODEL
## Burra Pariksha Content Management System (BP-CMS)
### Stage 09 of 30-Stage Modernization Program — Authoritative Authorization & Security Architecture

```
================================================================================
Document ID:       BP-ARCH-09-RBAC
Version:           9.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL CONTRACT
Scope:             Role-Based Access Control, Granular Capabilities, & Server Authorization
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
Downstream Stages: 11-PAGE-ROUTE-CONTRACT.md
                   12-DATA-ARCHITECTURE.md
                   13-API-CONTRACT.md
                   15-AUTH-IMPLEMENTATION.md
                   18+ Frontend Workspace Implementation
Target Architecture: Zero-Trust, Server-Authoritative Capability Authorization Pipeline
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document defines the authoritative, server-authoritative **Role-Based Access Control (RBAC) and Capability Authorization Architecture** for the Burra Pariksha Content Management System (BP-CMS). It replaces the legacy brownfield anti-pattern:

$$\text{ROLE} \longrightarrow \text{RANDOM PAGE ACCESS}$$

with the rigorous, zero-trust authorization pipeline:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                        CANONICAL ZERO-TRUST AUTHORIZATION PIPELINE                     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
    USER (Authenticated Identity)
      │
      ▼
    ROLE (Responsibility Grouping)
      │
      ▼
    CAPABILITY (Atomic Permission Token: RESOURCE:ACTION)
      │
      ▼
    RESOURCE (Target Bounded Entity & Scope)
      │
      ▼
    ACTION (Requested Operational Verb)
      │
      ▼
    BUSINESS STATE PRECONDITIONS (Stage 07 Workflow Step + Stage 08 Entity State + GAR-02)
      │
      ▼
    AUTHORIZATION DECISION (ALLOW vs DENY + Audit Log)
      │
      ▼
    SERVER API ENFORCEMENT (Authoritative Gate)
```

### 1.2 Anti-Overclaim Invariants
1. **Contractual Architecture Specification Only:** This document defines the *authorization contract*, permission taxonomy, capability catalogue, and decision algorithms that future services and middleware must enforce. It does **not** assert that runtime middleware or database permission tables have been executed or deployed.
2. **Zero Runtime Source Code Alteration:** No Express middleware, React route guards, TypeScript types, or database schemas are modified in Stage 09.
3. **No Phantom Security Claims:** Identifying brownfield vulnerabilities (such as the silent `getRequestActor` Admin fallback) establishes architectural remediation requirements; it does not claim that legacy production vulnerabilities have been wiped out prior to Stage 15.

---

## 2. Authentication vs. Authorization

BP-CMS strictly decouples **Identity Verification** from **Permission Evaluation**:

```text
 ┌───────────────────────────────────────┬───────────────────────────────────────┐
 │ AUTHENTICATION (Who are you?)         │ AUTHORIZATION (What can you do now?)  │
 ├───────────────────────────────────────┼───────────────────────────────────────┤
 │ • Verifies user credentials / token   │ • Evaluates actor's active capabilities│
 │ • Establishes session validity        │ • Checks target resource ownership    │
 │ • Confirms account is active/unlocked │ • Enforces business workflow stage    │
 │ • Attaches authenticated actor context│ • Verifies Anti-Self-Approval (GAR-02)│
 │ • Outcome: 401 Unauthorized if invalid│ • Outcome: 403 Forbidden if denied    │
 └───────────────────────────────────────┴───────────────────────────────────────┘
```

### 2.1 Identity & Session States
1. **UNAUTHENTICATED:** No session token supplied, or malformed bearer cookie. Result: HTTP 401.
2. **AUTHENTICATED:** Session verified against secret; user account confirmed active. Proceeds to authorization.
3. **AUTHENTICATED BUT UNAUTHORIZED:** Actor lacks the atomic capability or fails business state checks. Result: HTTP 403.
4. **SESSION EXPIRED / REVOKED:** Token expiration reached or user's `sessionVersion` bumped in repository. Result: HTTP 401.
5. **ACCOUNT DEACTIVATED:** User `isActive == false`. Immediate rejection with HTTP 401/403.

---

## 3. User Model & Actor Resolution

### 3.1 Authorization-Relevant User Properties (Traced to Stage 06)
- `id`: Stable business identifier (`BP-USR-######` or legacy `USR-###`).
- `email`: Unique corporate email used for credential verification.
- `name`: Display name utilized for audit attribution.
- `isActive`: Boolean flag. If `false`, all session generation and API authorization are instantly halted.
- `assignedRoles`: Non-empty array of `CanonicalRole` values (multi-role assignment supported).
- `sessionVersion`: Integer counter incremented upon security events (password change, role modification, administrative lockout) to immediately invalidate existing JWT cookies.

### 3.2 Eradication of the Silent Admin Fallback
In the brownfield baseline, `getRequestActor()` in `src/server/routes.ts` contained a critical security defect:
```typescript
// CRITICAL BROWNFIELD DEFECT (To be eradicated in Stage 15):
} else {
  actor = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };
}
```
If an unauthenticated request reached any endpoint calling `getRequestActor()`, the system silently converted the caller into `USR-001` Super-Admin.

**Target Architecture Mandate:**
- Silent administrative fallback is **strictly prohibited**.
- If a protected endpoint receives a request lacking valid authentication:
  $$\text{Request lacks valid session} \Longrightarrow \text{HTTP 401 Unauthorized}$$
- No request is ever elevated to Admin without explicit, authenticated credentials and active session verification.

---

## 4. Role Model

A **Role** is a named, operational responsibility grouping within the Burra Pariksha organization.

### 4.1 Role Architectural Constraints
1. **Roles Do Not Equal Permissions:** A role never grants direct page access or ad-hoc API bypass. A role grants an explicit set of atomic **Capabilities**.
2. **Non-Hierarchical Structure:** BP-CMS rejects arbitrary role inheritance trees (e.g., `Admin > Manager > Editor`). Instead, roles are decoupled peer groupings mapped directly to capability sets.
3. **Multi-Role Assignment:** A user may hold multiple roles simultaneously (e.g., a subject matter expert may be both `QUESTION_AUTHOR` and `SCRIPTWRITER`). The actor's effective capability set is the union of all capabilities granted by their assigned roles.
4. **System-Defined & Immutable:** Core operational roles are statically defined by the architecture; ad-hoc runtime creation of custom roles is prohibited to prevent privilege escalation.

---

## 5. Capability Model

A **Capability** is an atomic, granular business permission token formatted as:

$$\mathbf{CAPABILITY} = \mathbf{RESOURCE} : \mathbf{ACTION}$$

### 5.1 Capability Token Grammar
- **Resource:** One of the 28 canonical domain entities established in Stage 06.
- **Action:** One of the canonical operational verbs from the authorization vocabulary.
- **Separation Syntax:** Colon-delimited uppercase string (e.g., `QUESTION:VERIFY`, `VIDEO_EDIT:APPROVE`, `PUBLISHING_PACKAGE:SCHEDULE`).

Every protected business operation requires the executing actor to possess the exact corresponding `RESOURCE:ACTION` capability token.

---

## 6. Resource Model

Tracing directly to `docs/architecture/06-DOMAIN-MODEL.md`, the authorization system governs **28 Canonical Resources**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                           28 CANONICAL AUTHORIZATION RESOURCES                         │
 ├───────────────────────────────┬────────────────────────────────────────────────────────┤
 │ Domain / Bounded Context      │ Canonical Resources                                    │
 ├───────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Identity & Governance         │ USER, ROLE, CAPABILITY, CONFIGURATION                  │
 │ Curriculum & Question         │ QUESTION, QUESTION_VERSION, QUESTION_REVIEW            │
 │ Studio Production             │ CONTENT, SCRIPT, SCRIPT_VERSION, VIDEO, VIDEO_TAKE,    │
 │                               │ VIDEO_EDIT                                             │
 │ Media Metadata & Storage      │ MEDIA_ASSET, MEDIA_REFERENCE, ARCHIVE_REFERENCE        │
 │ Packaging & Social            │ THUMBNAIL, SOCIAL_REVIEW                               │
 │ Distribution & Sync           │ PUBLISHING_PACKAGE, PUBLICATION, PLATFORM              │
 │ Audience Analytics            │ ANALYTICS_SNAPSHOT, PERFORMANCE_RECORD                 │
 │ Pedagogical Intelligence      │ INTELLIGENCE_INSIGHT                                   │
 │ Workflow Orchestration        │ WORKFLOW_INSTANCE, WORKFLOW_TRANSITION                 │
 │ Operational Assurance         │ NOTIFICATION, AUDIT_EVENT                              │
 └───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 7. Action Model

BP-CMS restricts all authorization operations to a standardized vocabulary of **23 Canonical Actions**:

### 7.1 Primary Actions (10)
- `VIEW`: Read metadata or payload of an entity.
- `CREATE`: Instantiate a new container or draft record.
- `EDIT`: Mutate an existing unlocked/draft entity.
- `APPROVE`: Formally certify a quality gate or review.
- `REJECT`: Turn down a submitted artifact with mandatory remarks.
- `PUBLISH`: Dispatch media or package to live external distribution.
- `ARCHIVE`: Migrate completed content or media to cold storage.
- `RESTORE`: Retrieve an archived asset to active operational storage.
- `DELETE`: Permanently retire an entity where legally/business allowed.
- `ADMINISTER`: Perform privileged configuration or user management.

### 7.2 Specialized Operational Actions (13)
- `ASSIGN`: Delegate a content task or review to a specific user.
- `SUBMIT`: Advance an entity from draft to pending review.
- `VERIFY`: Execute a formal pedagogical or technical checklist audit.
- `REVIEW`: Conduct diagnostic or packaging safe-zone inspection.
- `GENERATE`: Trigger AI advisory drafting (Gemini integration).
- `UPLOAD`: Stream binary media to external storage (Google Drive).
- `DOWNLOAD`: Retrieve binary media for studio production.
- `EXPORT`: Generate compliance or diagnostic data extracts.
- `SYNC`: Poll and reconcile cross-platform metadata.
- `SCHEDULE`: Lock an approved package into a publication calendar slot.
- `CANCEL`: Abort a pending job or scheduled publication.
- `RETRY`: Re-execute a transiently failed technical operation.
- `TRANSITION`: Authorize stage advancement on `WorkflowInstance`.

---

## 8. Capability + Business-State Authorization Model

A foundational principle of BP-CMS authorization is that **Capability Possession is a Necessary, but Not Sufficient, Condition** for execution.

$$\mathbf{AUTHORIZATION\ DECISION} = \mathbf{CAPABILITY\ CHECK} \ \land \ \mathbf{BUSINESS\ STATE\ PRECONDITIONS} \ \land \ \mathbf{GAR\text{-}02\ INVARIANT}$$

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      CAPABILITY VS. BUSINESS VALIDITY SEPARATION                       │
 ├───────────────────────────────────────┬────────────────────────────────────────────────┤
 │ 1. Capability Permission Check        │ "Does this actor possess `VIDEO_EDIT:APPROVE`?"│
 │ 2. Workflow Stage Check               │ "Is the WorkflowInstance at Stage 07 Final QC?"│
 │ 3. Entity Lifecycle State Check       │ "Is the VideoEdit in state `QC_SUBMITTED`?"    │
 │ 4. Anti-Self-Approval Check (GAR-02)  │ "Is the reviewer different from the editor?"   │
 │ 5. Concurrency Check (OCC)            │ "Does incoming version match database version?"│
 └───────────────────────────────────────┴────────────────────────────────────────────────┘
```
If any of conditions 2 through 5 fail, the request is rejected with HTTP 403 or HTTP 409, even if the user holds the `ADMIN` role.

---

## 9. Anti-Self-Approval & Separation of Duties (GAR-02)

To maintain absolute educational integrity, BP-CMS strictly enforces the **Anti-Self-Approval Invariant (`GAR-02`)**:

$$\mathbf{GAR\text{-}02}: \quad \text{Reviewer Actor ID} \neq \text{Author Actor ID}$$

### 9.1 Gated Review Points Governed by GAR-02
1. **Stage 02 Question Verification:**
   - Capability: `QUESTION_REVIEW:VERIFY` / `QUESTION:APPROVE`
   - Restriction: Reviewer cannot be the author who submitted the draft `QuestionVersion`.
2. **Stage 07 Final QC Certification:**
   - Capability: `VIDEO_EDIT:APPROVE`
   - Restriction: QC Lead cannot be the Video Editor who uploaded the rendered master cut.
3. **Stage 09 Social Review Certification:**
   - Capability: `SOCIAL_REVIEW:APPROVE`
   - Restriction: Reviewer cannot be the Scriptwriter who authored the core hook copy.

**Server Enforcement Invariant:** The backend evaluates `GAR-02` inside the authorization pipeline. If `actor.id === entity.authorId`, the system returns `HTTP 403 Forbidden` with error code `SELF_APPROVAL_FORBIDDEN`. This rule cannot be bypassed by any role, including Administrator.

---

## 10. Role Catalogue

The system formalizes **11 Canonical Roles** aligned with the 15-stage workflow:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                               11 CANONICAL OPERATIONAL ROLES                           │
 ├───────────────────┬────────────────────────────────────────────────────────────────────┤
 │ Role Identifier   │ Primary Operational Responsibility & Scope                         │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ ADMIN             │ Global system governance, user administration, recovery, and audit.│
 │ CONTENT_LEAD      │ Executive producer overseeing overall pipeline velocity & approvals│
 │ QA_REVIEWER       │ Lead SME conducting 10-point pedagogical audits on questions.      │
 │ QUESTION_AUTHOR   │ Curriculum specialist drafting syllabus-aligned question versions. │
 │ QUESTION_EDITOR   │ Content creator refining distractors, translations, and proofs.    │
 │ SCRIPTWRITER      │ Dialogue writer adapting questions into 60s presenter scripts.     │
 │ PRESENTER         │ Studio talent executing teleprompter sessions and take logging.    │
 │ VIDEO_EDITOR      │ Studio technician assembling master cuts, captions, and effects.   │
 │ DESIGNER          │ Graphic artist producing curiosity-framed mobile CTR thumbnails.   │
 │ SOCIAL_LEAD       │ Social media manager auditing 9:16 safe-zones and copy packages.   │
 │ PUBLISHING_LEAD   │ Release coordinator managing multi-platform schedules and sync.   │
 │ ANALYST           │ Data specialist evaluating retention curves and student confusion. │
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 11. Capability Catalogue

The canonical capability inventory partitions into functional tiers:

### 11.1 Curriculum & Question Tier
- `QUESTION:VIEW`: Read questions and solution proofs.
- `QUESTION:CREATE`: Instantiate draft questions.
- `QUESTION:EDIT`: Mutate draft question content.
- `QUESTION:SUBMIT`: Advance question from Stage 01 to Stage 02.
- `QUESTION_VERSION:CREATE`: Fork or draft a new version snapshot.
- `QUESTION_REVIEW:VERIFY`: Execute the 10-point pedagogical audit checklist.
- `QUESTION:APPROVE`: Certify question; advance to Stage 03 (`GAR-02` applies).
- `QUESTION:REJECT`: Reject question; return to Stage 01 or terminate.

### 11.2 Studio Production Tier
- `SCRIPT:VIEW`: Inspect presenter scripts.
- `SCRIPT:CREATE`: Author spoken short-form scripts.
- `SCRIPT:EDIT`: Adjust dialogue, hook, and pacing.
- `SCRIPT:SUBMIT`: Lock script for teleprompter; advance to Stage 04.
- `VIDEO:VIEW`: Access video projects and production board.
- `VIDEO:RECORD`: Launch teleprompter and log studio takes.
- `VIDEO_TAKE:CREATE`: Register individual filming takes and golden take.
- `MEDIA_ASSET:UPLOAD`: Stream raw camera footage to Google Drive.
- `VIDEO_EDIT:CREATE`: Register rendered master cut in Editing Bay.
- `VIDEO_EDIT:EDIT`: Replace render cut during editing iterations.
- `VIDEO_EDIT:SUBMIT`: Advance master cut from Stage 06 to Stage 07.
- `VIDEO_EDIT:APPROVE`: Certify 6-point Master QC; advance to Stage 08 (`GAR-02`).
- `VIDEO_EDIT:REJECT`: Reject master cut; return to Stage 06 with remarks.

### 11.3 Packaging, Social & Distribution Tier
- `THUMBNAIL:VIEW`: View candidate thumbnail artwork.
- `THUMBNAIL:CREATE`: Upload candidate thumbnail graphics.
- `THUMBNAIL:APPROVE`: Designate primary thumbnail; advance to Stage 09.
- `SOCIAL_REVIEW:VIEW`: Inspect 9:16 smartphone simulator.
- `SOCIAL_REVIEW:EDIT`: Refine title, hashtags, and pinned comment.
- `SOCIAL_REVIEW:APPROVE`: Certify social package; advance to Stage 10 (`GAR-02`).
- `PUBLISHING_PACKAGE:VIEW`: Inspect release calendar and distribution matrix.
- `PUBLISHING_PACKAGE:SCHEDULE`: Lock publication slot; advance to Stage 11.
- `PUBLICATION:PUBLISH`: Trigger live upload to YouTube Shorts / Meta APIs.
- `PUBLICATION:SYNC`: Execute cross-platform metadata reconciliation.

### 11.4 Analytics & Intelligence Tier
- `ANALYTICS_SNAPSHOT:VIEW`: Inspect raw audience telemetry and retention graphs.
- `ANALYTICS_SNAPSHOT:INGEST`: Manually or automatically trigger platform metric pull.
- `PERFORMANCE_RECORD:REVIEW`: Conduct retention drop-off diagnosis.
- `PERFORMANCE_RECORD:CREATE`: Finalize diagnostic review; advance to Stage 15.
- `INTELLIGENCE_INSIGHT:CREATE`: Synthesize pedagogical directives from trends.
- `INTELLIGENCE_INSIGHT:APPROVE`: Formally authorize directive for future Question Gen.

### 11.5 Governance & Administration Tier (Privileged)
- `USER:VIEW`: View user list and assigned roles.
- `USER:ADMINISTER`: Create, edit, deactivate users; reset session versions.
- `ROLE:ADMINISTER`: Assign roles to users.
- `CONFIGURATION:ADMINISTER`: Manage system-wide environment flags and Drive IDs.
- `AUDIT_EVENT:VIEW`: Inspect append-only audit trail and transition logs.
- `CONTENT:ARCHIVE`: Authorize long-term cold-storage archival of completed content.
- `MEDIA_ASSET:RESTORE`: Trigger retrieval from GCS Coldline.

---

## 12. Scope Model

To avoid unnecessary multi-tenant complexity while maintaining enterprise rigor, authorization scopes are partitioned into four operational levels:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             AUTHORIZATION SCOPE LEVELS                                 │
 ├───────────────────┬────────────────────────────────────────────────────────────────────┤
 │ Scope Level       │ Definition & Boundary                                              │
 ├───────────────────┼────────────────────────────────────────────────────────────────────┤
 │ GLOBAL            │ System-wide authority across all domains (Restricted to ADMIN).    │
 │ DOMAIN            │ Authority across an entire bounded context (e.g., all Questions).  │
 │ WORKFLOW_STAGE    │ Authority bounded strictly to a specific canonical step (01–15).   │
 │ RESOURCE_OWNER    │ Authority bounded to resources authored/created by the actor.      │
 └───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 13. Page Authorization & Capability-Aware Workspaces

### 13.1 Page Visibility ≠ API Security
1. **Frontend Role:** The UI queries the authenticated user's capabilities upon login. It hides navigation tabs, disables buttons, and renders read-only views to provide an intuitive UX.
2. **Backend Role:** The server **never trusts frontend visibility**. Every HTTP request reaching Express API routes independently executes authentication, capability validation, and business state checks.

### 13.2 Workspace Capability Map
| Canonical Page / Workspace | Canonical Route | Required View Capability | Visible Action Buttons | Read-Only Fallback Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Question Studio** | `/studio` | `QUESTION:VIEW` | "Generate AI", "Submit" | When user lacks `QUESTION:CREATE` |
| **Question Verification** | `/questions/:id/verify` | `QUESTION_REVIEW:VERIFY` | "Approve", "Request Changes" | When actor is author (`GAR-02`) |
| **Video Teleprompter** | `/videos/:id?tab=recording` | `VIDEO:RECORD` | "Start Prompter", "Log Take" | When user lacks `VIDEO_TAKE:CREATE` |
| **Editing Bay** | `/videos/:id?tab=editing` | `VIDEO:VIEW` | "Upload Master", "Submit QC" | When user lacks `VIDEO_EDIT:EDIT` |
| **Final QC Theater** | `/videos/:id?tab=final-review`| `VIDEO_EDIT:APPROVE` | "Certify QC", "Reject Cut" | When actor is editor (`GAR-02`) |
| **Social Review Studio** | `/social-review/:id` | `SOCIAL_REVIEW:VIEW` | "Approve Package", "Edit" | When user lacks `SOCIAL_REVIEW:APPROVE`|
| **Publishing Console** | `/publishing` | `PUBLISHING_PACKAGE:VIEW`| "Schedule", "Publish Now" | When user lacks `PUBLICATION:PUBLISH` |
| **Analytics Studio** | `/social-analytics/:id` | `ANALYTICS_SNAPSHOT:VIEW`| "Refresh Metrics", "Export" | When user lacks `ANALYTICS:INGEST` |
| **Recovery / Admin** | `/admin` | `CONFIGURATION:ADMINISTER`| "Flush Session", "Re-index" | Page completely hidden for non-admins |

---

## 14. Master Authorization Matrix: Role → Capability → Page → Action → API

This central matrix governs the operational mapping across all 15 stages:

| Role | Required Capability | Resource | Action | Workspace URL | Target API Operation | Business State Preconditions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QUESTION_AUTHOR** | `QUESTION:CREATE` | `QUESTION` | `CREATE` | `/studio` | `POST /api/questions` | None (New draft container) |
| **QUESTION_AUTHOR** | `QUESTION:SUBMIT` | `QUESTION` | `SUBMIT` | `/studio` | `POST /api/questions/:id/submit`| Step == 01; Schema valid |
| **QA_REVIEWER** | `QUESTION:APPROVE` | `QUESTION_REVIEW` | `APPROVE` | `/questions/:id/verify` | `POST /api/questions/:id/verify`| Step == 02; GAR-02 passes |
| **SCRIPTWRITER** | `SCRIPT:SUBMIT` | `SCRIPT` | `SUBMIT` | `/videos/:id?tab=script` | `POST /api/scripts/:id/lock` | Step == 03; Pacing 40–59s |
| **PRESENTER** | `VIDEO_TAKE:CREATE` | `VIDEO_TAKE` | `CREATE` | `/videos/:id?tab=recording`| `POST /api/videos/:id/takes` | Step == 04; Script locked |
| **VIDEO_EDITOR** | `VIDEO_EDIT:SUBMIT` | `VIDEO_EDIT` | `SUBMIT` | `/videos/:id?tab=editing` | `POST /api/videos/:id/master-cut`| Step == 06; 1080x1920 9:16 |
| **CONTENT_LEAD** | `VIDEO_EDIT:APPROVE`| `VIDEO_EDIT` | `APPROVE` | `/videos/:id?tab=final-review`| `POST /api/videos/:id/qc-approve`| Step == 07; GAR-02 passes |
| **DESIGNER** | `THUMBNAIL:APPROVE` | `THUMBNAIL` | `APPROVE` | `/videos/:id?tab=thumbnail` | `POST /api/thumbnails/:id/approve`| Step == 08; Drive link valid |
| **SOCIAL_LEAD** | `SOCIAL_REVIEW:APPROVE`| `SOCIAL_REVIEW`| `APPROVE`| `/social-review/:id` | `POST /api/social-reviews/:id/approve`| Step == 09; GAR-02 passes |
| **PUBLISHING_LEAD**| `PUBLISHING_PACKAGE:SCHEDULE`| `PUBLISHING_PACKAGE`| `SCHEDULE`| `/publishing` | `POST /api/publishing/schedule` | Step == 10; Pre-publish 100% |
| **PUBLISHING_LEAD**| `PUBLICATION:PUBLISH` | `PUBLICATION` | `PUBLISH` | `/publishing` | `POST /api/publishing/dispatch` | Step == 11; Slot reached |
| **SOCIAL_LEAD** | `PUBLICATION:SYNC` | `PUBLICATION` | `SYNC` | `/platform-packages` | `POST /api/platform-sync/refresh`| Step == 12; Video live |
| **ANALYST** | `ANALYTICS_SNAPSHOT:INGEST`| `ANALYTICS_SNAPSHOT`| `INGEST`| `/social-analytics/:id` | `POST /api/analytics/ingest` | Step == 13; Maturation >= 24h |
| **CONTENT_LEAD** | `PERFORMANCE_RECORD:CREATE`| `PERFORMANCE_RECORD`| `CREATE`| `/analytics/engagement`| `POST /api/analytics/performance-review`| Step == 14; Snapshot exists |
| **CONTENT_LEAD** | `INTELLIGENCE_INSIGHT:APPROVE`| `INTELLIGENCE_INSIGHT`| `APPROVE`| `/analytics/intelligence`| `POST /api/analytics/intelligence/approve`| Step == 15; Human sign-off |
| **ADMIN** | `USER:ADMINISTER` | `USER` | `ADMINISTER` | `/admin` | `POST /api/users` | Active session; caller == ADMIN |

---

## 15. Specialized Separation of Privileges

### 15.1 Read vs. Mutation Separation
Possession of a read capability (`*.VIEW`) never implies write or update authority:
- `QUESTION:VIEW` does not permit `QUESTION:EDIT`.
- `ANALYTICS_SNAPSHOT:VIEW` does not permit `ANALYTICS_SNAPSHOT:INGEST`.
- `AUDIT_EVENT:VIEW` does not permit `AUDIT_EVENT:DELETE` (which is globally prohibited).

### 15.2 Approval vs. Edit Separation
To preserve organizational checks and balances:
- Reviewers possessing `QUESTION_REVIEW:VERIFY` cannot edit the question text during review. They must request changes, forcing the author to make explicit revisions.
- QC Reviewers possessing `VIDEO_EDIT:APPROVE` cannot alter the video render cut. They must reject the cut and instruct the editor.

### 15.3 Publishing Privilege Restrictions
Publishing live content to external social channels carries brand and legal risk. The system enforces three distinct tiers:
1. `PUBLISHING_PACKAGE:VIEW`: Inspect calendar (Open to Creator, Editor, Social Lead).
2. `PUBLISHING_PACKAGE:SCHEDULE`: Lock schedule slot (Restricted to Publishing Lead).
3. `PUBLICATION:PUBLISH`: Dispatch live video binary (Restricted to Publishing Lead & Automated Daemon).

### 15.4 Archive vs. Restore vs. Delete
- **Archive (`CONTENT:ARCHIVE`):** Cold storage migration; allowed only for completed or cancelled content.
- **Restore (`MEDIA_ASSET:RESTORE`):** Retrieval from cold storage; requires Lead Producer approval.
- **Delete (`*:DELETE`):** **Globally Prohibited** for completed content, video cuts, and audit logs. Only ephemeral draft questions that have never entered review may be deleted.

---

## 16. Audit Immutability & Administration Boundaries

### 16.1 Audit Log Immutability
- `AUDIT_EVENT` records are **strictly append-only**.
- No user, including `ADMIN`, possesses an `AUDIT_EVENT:EDIT` or `AUDIT_EVENT:DELETE` capability.
- Attempting to issue a SQL `DELETE` or Sheets row deletion against the audit trail is rejected at the database adapter layer.

### 16.2 Administrative Boundaries
Administrators are subject to system invariants:
- Administrators cannot approve reviews where they are the author (`GAR-02` applies to Admins).
- Administrators cannot skip mandatory workflow stages without logging an audited `RECOVERY_OVERRIDE` event.
- All administrative actions emit an immediate high-priority audit event.

---

## 17. Authorization Decision Model & Evaluation Pipeline

The authorization engine executes a **14-step sequential decision pipeline**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      14-STEP AUTHORIZATION DECISION ENGINE PIPELINE                    │
 └────────────────────────────────────────────────────────────────────────────────────────┘
   1. Extract bearer token from HTTP Cookie (bp_session) or Authorization Header.
   2. Verify cryptographic signature & expiration; reject with 401 if invalid.
   3. Check user repository: verify user exists and isActive == true; reject with 401 if false.
   4. Verify sessionVersion: token version >= stored sessionVersion; reject with 401 if stale.
   5. Resolve assigned roles for the authenticated actor.
   6. Expand roles into effective atomic capabilities set.
   7. Identify requested target resource and operational action.
   8. Check if required capability (RESOURCE:ACTION) exists in actor's capability set.
      └── If missing: DENY with 403 (CAPABILITY_MISSING).
   9. Evaluate resource ownership / tenancy scope.
  10. Query WorkflowInstance: verify currentStage matches stage requirements.
      └── If out-of-sequence: DENY with 403 (INVALID_STAGE).
  11. Query target entity: verify lifecycle state allows requested action.
      └── If locked or wrong state: DENY with 403 (INVALID_STATE).
  12. Check Anti-Self-Approval (GAR-02): verify reviewerId !== authorId.
      └── If same user: DENY with 403 (SELF_APPROVAL_FORBIDDEN).
  13. Validate Optimistic Concurrency Control: verify expectedVersion === storedVersion.
      └── If stale version: DENY with 409 (STALE_VERSION_CONFLICT).
  14. Commits: ALLOW operation and emit asynchronous AuditEvent log.
```

---

## 18. Authorization Error Model

The API layer maps authorization outcomes to standardized error envelopes:

```typescript
export enum AuthorizationErrorCode {
  AUTH_REQUIRED            = 'AUTH_REQUIRED',            // HTTP 401: Missing session token
  INVALID_TOKEN            = 'INVALID_TOKEN',            // HTTP 401: Signature or expiration failure
  SESSION_REVOKED          = 'SESSION_REVOKED',          // HTTP 401: sessionVersion incremented
  ACCOUNT_DISABLED         = 'ACCOUNT_DISABLED',         // HTTP 403: User isActive == false
  CAPABILITY_MISSING       = 'CAPABILITY_MISSING',       // HTTP 403: User lacks RESOURCE:ACTION
  SELF_APPROVAL_FORBIDDEN  = 'SELF_APPROVAL_FORBIDDEN',  // HTTP 403: GAR-02 violation (Author == Reviewer)
  INVALID_WORKFLOW_STAGE   = 'INVALID_WORKFLOW_STAGE',   // HTTP 403: Entity not at expected stage
  INVALID_ENTITY_STATE     = 'INVALID_ENTITY_STATE',     // HTTP 403: Entity locked or in wrong state
  STALE_VERSION_CONFLICT   = 'STALE_VERSION_CONFLICT',   // HTTP 409: OCC version collision
}
```

---

## 19. Brownfield Authorization Mapping & Conflict Register

### 19.1 Mapping of Existing Brownfield Mechanisms
| Brownfield Mechanism | Current Implementation | Target Architectural Disposition | Action |
| :--- | :--- | :--- | :---: |
| `getRequestActor` Admin fallback | `src/server/routes.ts` (lines 138–140) | Eradicate fallback. Return strict HTTP 401 on unauthenticated requests. | **RETIRE / FIX** |
| `requireRole` middleware | `src/server/middleware/auth.middleware.ts` | Replace with capability-aware `requireCapability(resource, action)`. | **MIGRATE** |
| Hardcoded `ADMIN` bypass in `requireRole`| `auth.middleware.ts` (line 147) | Remove blanket bypass. Admin must possess explicit administrative capabilities. | **RETIRE** |
| `ObjectAuthorizationService` | `src/lib/services/object-auth.service.ts` | Formalize as core authorization evaluator implementing the 14-step pipeline. | **CONSOLIDATE** |
| Frontend navigation checks | `src/components/navigation/*` | Align navigation visibility with user capabilities returned by `/api/auth/me`. | **MIGRATE** |
| Direct DB Status Patching | Express routes in `src/server/routes.ts` | Enforce capability and state gates before executing repository updates. | **MIGRATE** |

### 19.2 Authorization Conflict Register (ACR)
| Conflict ID | Nature of Conflict | Brownfield Risk | Target Authority | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **ACR-001** | Silent Admin Fallback in `getRequestActor` | Unauthenticated requests executed with super-admin permissions. | Enforces strict HTTP 401 rejection on missing session tokens. | **Stage 09 / Stage 15** |
| **ACR-002** | Blanket Admin Bypass in `requireRole` | Admin role bypassed all business validations and review restrictions. | Strips universal bypass; enforces `GAR-02` on all actors. | **Stage 09 / Stage 15** |
| **ACR-003** | Frontend-Only Review Restrictions | Self-approval was blocked in UI buttons but unvalidated on server API routes. | Moves `GAR-02` evaluation inside Express server route handlers. | **Stage 09 / Stage 15** |
| **ACR-004** | Role-to-Page Direct Mapping | Roles directly determined page routes without capability checks on underlying APIs. | Decouples pages from roles; binds both pages and APIs to atomic capabilities. | **Stage 09 / Stage 11** |
| **ACR-005** | Privilege Overlap (Edit vs. Approve) | Editors were granted approval privileges in common routes. | Separates `EDIT` from `APPROVE` across all domain endpoints. | **Stage 09 / Stage 13** |
| **ACR-006** | Ad-Hoc Direct Repository Mutations | Routes bypassed `WorkflowOrchestrationService` and updated Sheet rows directly. | Forces all state mutations through authoritative `WorkflowEngine`. | **Stage 09 / Stage 14** |

---

## 20. Privilege Escalation Invariants

The authorization system must uphold these **15 mandatory privilege escalation invariants**:

1. **Zero Silent Elevation:** No unauthenticated request may ever be converted into `USR-001` or granted administrative rights.
2. **Page Visibility Never Authorizes:** Being able to navigate to a page URL provides zero authority to execute API mutations.
3. **Roles Are Groups, Not Checks:** Code must evaluate atomic capabilities (`QUESTION:VERIFY`), never raw role strings (`role === 'QA_REVIEWER'`).
4. **Capability Does Not Bypass State:** Holding `VIDEO_EDIT:APPROVE` provides zero authority to approve a video that is in stage `04 Filming`.
5. **Separation of Duties (`GAR-02`):** No user may approve their own authored submission.
6. **Edit Does Not Imply Approve:** Authoring capabilities never grant review certification privileges.
7. **View Does Not Imply Edit:** Read-only viewing permissions never permit data mutation.
8. **Publish Does Not Imply Administer:** Content publishers have zero administrative authority over system users or credentials.
9. **Archive Does Not Imply Delete:** Preserving historical records does not permit destroying records.
10. **Audit Is Forever:** Audit log records cannot be modified or deleted by any user or administrator.
11. **Session Revocation Is Immediate:** Incrementing a user's `sessionVersion` must immediately invalidate all existing JWT cookies.
12. **Frontend Subordination:** Client-side state and UI controls are never trusted as security gates.
13. **Backend Is Authoritative:** The backend server is the sole arbiter of authorization decisions.
14. **Deterministic Auditing:** Every authorization failure on protected mutations must be logged with actor ID and reason.
15. **Admins Obey Physics:** Administrative credentials do not permit creating invalid states, corrupting schemas, or breaking sequential workflow invariants.

---

## 21. Traceability Matrix

### 21.1 Upstream Traceability (Stages 01–08 to Stage 09)
| Stage 09 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 3 (Eradicate Fallback)** | Stage 03 Section 3 & AP-004 | Directly addresses and resolves the `getRequestActor` Admin fallback defect. |
| **Section 5 & 6 (Resources & Caps)**| Stage 06 Domain Model (Section 4) | Binds capabilities to the exact 28 canonical domain resources. |
| **Section 8 & 9 (State Decoupling)** | Stage 08 State Model (Section 2) | Enforces that capability checks require decoupled workflow/entity state gates. |
| **Section 9 (GAR-02 Anti-Self-Approval)**| Stage 02 AC-02, Stage 04 AP-006 | Embeds `reviewer !== author` as an inviolable server-side authorization rule. |
| **Section 10 (Canonical Roles)** | Stage 07 Workflow (Section 9) | Formalizes the provisional roles established in the canonical 15-step workflow. |
| **Section 16 (Audit Immutability)** | Stage 04 AP-014 & Stage 06 Section 13 | Guarantees that audit trails are append-only and cannot be tampered with. |

### 21.2 Downstream Traceability (Stage 09 to Future Stages)
| Downstream Stage | Consumed RBAC Architecture Component | Implementation Expectation |
| :--- | :--- | :--- |
| **Stage 11 — Page & Route Contract**| Workspace Capability Map (Section 13) | Defines capability-gated navigation, redirects, and read-only views. |
| **Stage 12 — Data Architecture** | User & Role Schema Contracts (Sections 3 & 4)| Maps `User`, `Role`, and `sessionVersion` into physical Google Sheets / DB rows. |
| **Stage 13 — API Contract** | Master Authorization Matrix (Section 14)| Embeds required capability tokens in OpenAPI / REST route specifications. |
| **Stage 15 — Auth Implementation** | 14-Step Decision Pipeline (Section 17) | Implements `requireAuth`, `requireCapability`, and `GAR-02` Express middleware. |
| **Stage 18+ — Workspace UI** | Capability-Aware Components (Section 13) | Implements UI hooks querying user capabilities for dynamic button rendering. |
| **Stage 29 — Security Audit** | Privilege Escalation Invariants (Section 20) | Executes penetration tests against fallback elimination and `GAR-02`. |

---

## 22. Explicit Implementation Boundary Statement

> [!IMPORTANT]
> **Explicit Implementation Boundary Statement:**
> This document establishes **EXCLUSIVELY** the conceptual and architectural **Role-Based Access Control, Capability Taxonomy, and Authorization Governance Contract** for BP-CMS.
> 
> It does **NOT** define or execute:
> - Express authentication or authorization middleware code.
> - JWT signing, cookie parsing, or bcrypt password hashing implementations.
> - React route guard components or AuthProvider context rewrites.
> - Database user tables, role assignment sheets, or permission matrix DDL.
> - Network firewall rules, OAuth token refresh flows, or secret provisioning.
> 
> Physical data storage is deferred to **Stage 12 (Data Architecture)**; REST API contract schemas to **Stage 13 (API Contract)**; and authentication/authorization runtime implementation to **Stage 15 (Authentication & Authorization Implementation)**.

---

## 23. Stage 09 Completion Checklist & Sign-off

- [x] Read all eight prior canonical artifacts (`01` through `08`).
- [x] Inspected existing brownfield authentication and authorization code (`auth.middleware.ts`, `object-auth.service.ts`, `routes.ts`, `rbac-models.ts`).
- [x] Explicitly identified and mandated remediation of the critical `getRequestActor` Admin fallback defect.
- [x] Established the canonical zero-trust authorization chain: User → Role → Capability → Resource → Action → Business State → Decision.
- [x] Strictly decoupled Authentication (Identity) from Authorization (Permission).
- [x] Formalized 28 Canonical Resources traced to the Stage 06 Domain Model.
- [x] Defined standardized 23 Canonical Actions vocabulary.
- [x] Established atomic `RESOURCE:ACTION` capability token grammar.
- [x] Integrated Business State Preconditions into authorization decisions.
- [x] Formulated server-enforced Anti-Self-Approval (`GAR-02`) across all review quality gates.
- [x] Defined complete 11 Canonical Roles catalogue and capability assignments.
- [x] Formulated detailed Capability Catalogue across all functional tiers.
- [x] Established 4-tier Scope Model (Global, Domain, Workflow Stage, Resource Owner).
- [x] Mapped Capability-Aware Workspaces and enforced Page Visibility ≠ API Security.
- [x] Created Master Role → Capability → Page → Action → API Operation Matrix.
- [x] Enforced strict separations: Read vs. Write, Edit vs. Approve, Publishing Privilege, Archive vs. Delete.
- [x] Guaranteed perpetual Audit Trail Immutability.
- [x] Formulated the 14-Step Authorization Decision Pipeline.
- [x] Established standardized Authorization Error Model (`AUTH_REQUIRED`, `SELF_APPROVAL_FORBIDDEN`, etc.).
- [x] Conducted comprehensive Brownfield Mapping of legacy middleware and roles.
- [x] Established Authorization Conflict Register (`ACR-001` through `ACR-006`).
- [x] Defined 15 mandatory Privilege Escalation Invariants.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 09 — RBAC & CAPABILITY MODEL
================================================================================
Artifact:            docs/architecture/09-RBAC-CAPABILITY-MODEL.md
Version:             9.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 09 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 09. Awaiting Stage 10 Instruction.
================================================================================
```
