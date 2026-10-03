# Phase 7: Data Ownership Implementation Report

## Executive Summary
This document records the data ownership architecture established for the Burra Pariksha CMS under **Stage 7 — Phase 7: Data Ownership**.

The objective of Phase 7 is to eliminate ambiguity around data ownership, entity identity, authoritative Google Sheets worksheets, service-level mutation authority, derived/cached fields, and data safety boundaries across all 20+ production entities in the system.

---

## 1. Objective
Establish a single source of truth (SSOT) architecture across the system stack:
```
UI Component / Page
       ↓
API Endpoint (routes.ts)
       ↓
Owning Domain Service
       ↓
Canonical Repository
       ↓
Authoritative Google Sheet Worksheet
```
Every production entity has exactly one authoritative repository and worksheet, one owning domain service for business mutations, and deterministic identity mappings.

---

## 2. Entity Ownership Matrix

| Entity | Primary Key | Parent Entity | Authoritative Worksheet | Authoritative Repository | Owning Service | Mutating API Route |
|---|---|---|---|---|---|---|
| **ContentMaster** | `id` (`BP-CNT-######`) | None (Root) | `CONTENT_MASTERS` | `contentMastersRepository` | `contentMasterService` | `/api/content-masters` |
| **Question** | `id` (`BP-Q-######`) | ContentMaster | `QUESTIONS` | `questionsRepository` | `questionService` | `/api/questions` |
| **Script** | `id` (`BP-S-######`) | Question | `SCRIPT` | `scriptsRepository` | `scriptService` | `/api/scripts` |
| **Video** | `id` (`BP-V-######`) | Question | `VIDEOS` | `videosRepository` | `videoService` | `/api/videos` |
| **Thumbnail** | `id` (`BP-T-######`) | Video | `THUMBNAILS` | `thumbnailsRepository` | `thumbnailService` | `/api/thumbnails` |
| **PinnedComment** | `id` (`BP-PIN-######`) | Video | `PINNED_COMMENTS` | `pinnedCommentsRepository` | `pinnedCommentService` | `/api/pinned-comments` |
| **SocialReview** | `id` (`BP-REV-######`) | ContentMaster | `SOCIAL_REVIEWS` | `socialReviewsRepository` | `socialReviewService` | `/api/social-reviews` |
| **PlatformAdaptation** | `id` (`BP-ADP-######`) | ContentMaster | `MEDIA_ASSETS` / In-Memory | `platformAdaptationsRepository` | `platformAdaptationService` | `/api/platform-adaptations` |
| **PublishingRecord** | `id` (`BP-PUB-######`) | ContentMaster | `PUBLISHING` | `publishingRepository` | `publishingService` | `/api/publishing` |
| **User** | `id` (`USR-###`) | None | `USERS` | `usersRepository` | `authService` | `/api/users` |
| **Assignment** | `id` (`BP-ASN-######`) | ContentMaster / Entity | `ASSIGNMENTS` | `assignmentsRepository` | `assignmentService` | `/api/assignments` |
| **ContentPlan** | `id` (`BP-PLN-####`) | Category/Topic | `CONTENT_PLANS` | `contentPlansRepository` | `planningService` | `/api/planning/plans` |
| **ContentBatch** | `id` (`BP-BCH-####`) | ContentPlan | `CONTENT_BATCHES` | `contentBatchesRepository` | `planningService` | `/api/planning/batches` |
| **QuestionValidation** | `id` (`UUID`/`SEQ`) | Question | `QUESTION_VALIDATIONS` | `validationsRepository` | `questionValidationService` | `/api/questions/:id/validate` |

---

## 3. ID Ownership Matrix & Identity Chain

### Canonical ID Format Standards:
- **Content Master:** `BP-CNT-######` (6-digit zero-padded)
- **Question:** `BP-Q-######` (6-digit zero-padded)
- **Video:** `BP-V-######` (6-digit zero-padded)
- **Script:** `BP-S-######` (6-digit zero-padded)
- **Thumbnail:** `BP-T-######` (6-digit zero-padded)
- **Pinned Comment:** `BP-PIN-######` (6-digit zero-padded)
- **Social Review:** `BP-REV-######` (6-digit zero-padded)
- **Platform Adaptation:** `BP-ADP-######` (6-digit zero-padded)
- **Publishing:** `BP-PUB-######` (6-digit zero-padded)
- **User:** `USR-###` (3-digit zero-padded)

### Structural Identity Chain:
```
Content Master (BP-CNT-######)
 ├── Question (BP-Q-######)
 │     ├── Script (BP-S-######) [references Video & Question]
 │     ├── Video (BP-V-######) [references Question]
 │     ├── Thumbnail (BP-T-######) [references Video]
 │     └── Pinned Comment (BP-PIN-######) [references Video]
 ├── Social Review (BP-REV-######) [locks package hash]
 ├── Platform Adaptations (BP-ADP-######) [locks source package hash]
 └── Publishing Record (BP-PUB-######) [locks adaptation version & source hash]
```

---

## 4. `contentId` vs `contentMasterId` Findings & Conclusion
- **Findings:**
  - `contentMasterId` is the formal foreign key property name defined in Google Sheets schema contracts (`QUESTIONS`, `VIDEOS`, `WORKFLOW`, `ASSIGNMENTS`).
  - `contentId` is the universally used alias/property across Phase 12 through Phase 26 representing the exact same root `BP-CNT-######` value.
- **Conclusion:**
  - They represent the **exact same root logical content identity**.
  - No destructive column renames or schema migrations were performed in Google Sheets.
  - `resolveContentMasterId` helper was implemented in `src/lib/ownership/data-ownership.ts` to guarantee unambiguous resolution across all services and repositories.

---

## 5. Worksheet Ownership Matrix

| Worksheet Name (`SHEET_TABS`) | Entity Domain | Authoritative Data |
|---|---|---|
| `CONTENT_MASTERS` | Content Master | Root logical content identity, title, overall status, taxonomy FKs |
| `QUESTIONS` | Question | Question text, options, answer, explanation, difficulty, style, status |
| `SCRIPT` | Script | Active teleprompter hook, problem statement, solution, trick, CTA |
| `SCRIPT_VERSIONS` | Script History | Immutable script version history |
| `VIDEOS` | Video | Recording/editing status, drive file IDs, render paths, target/actual duration |
| `THUMBNAILS` | Thumbnail | Headline text, drive asset URLs, approval status, version |
| `THUMBNAIL_VERSIONS` | Thumbnail History | Immutable thumbnail design history |
| `PINNED_COMMENTS` | Pinned Comment | Comment text, solution breakdown, next challenge, approval status |
| `PINNED_COMMENT_VERSIONS` | Pinned Comment History | Immutable pinned comment version history |
| `SOCIAL_REVIEWS` | Social Quality Gate | Human review decisions, quality scores, feedback categories, hashes |
| `PUBLISHING` | Multi-Platform Distribution | YouTube/IG/FB publish statuses, external post URLs, publish timestamps |
| `ASSIGNMENTS` | Task Management | Task type, assignee ID/name, due date, completion status |
| `USERS` | User Management | Name, email, role, active status, last login timestamp |
| `CATEGORIES` | Taxonomy | Top-level aptitude domain names and codes |
| `TOPICS` | Taxonomy | Topic names, category FKs, display orders |
| `SUBTOPICS` | Taxonomy | Subtopic names, topic FKs, notes |
| `WORKFLOW` | State Machine | Audit history of 15-step workflow state transitions |
| `AUDIT_LOG` | Audit Trail | System audit logs (actor, action, entity type, entity ID, details) |
| `SEQUENCES` | Auto-Increment IDs | Source of truth for permanent domain sequence numbers |

---

## 6. Service Ownership Matrix

| Domain Service | Responsibilities / Business Mutations |
|---|---|
| `contentMasterService` | Content Master creation, primary question linking, dashboard aggregation |
| `questionService` | Question creation, editing, validation status updates |
| `scriptService` | Script creation, revision history append, teleprompter formatting |
| `videoService` | Video production lifecycle, status transitions, Drive folder creation |
| `thumbnailService` | Thumbnail proposal, asset upload, designer feedback |
| `pinnedCommentService` | Pinned comment drafting, solution verification, package approval |
| `socialReviewService` | Social quality gate review decisions, artifact mutation invalidation |
| `platformAdaptationService` | Multi-platform content adaptation, platform constraints validation |
| `publishingService` | Multi-platform readiness evaluation, manual publish execution |
| `authService` | User authentication, RBAC permissions check, session management |

---

## 7. Status Ownership
- **Canonical Workflow Status (15-Step Conveyor):**
  - Owned by `workflowService` and persisted in `WORKFLOW` worksheet.
  - States: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `REVISION_REQUIRED`, `REJECTED`, `BLOCKED`, `ESCALATED`.
- **Domain-Specific Statuses:**
  - `QuestionStatus`: Owned by `questionService` (`DRAFT`, `VALIDATED`, `APPROVED`, etc.).
  - `VideoProductionStatus`: Owned by `videoService` (`UNASSIGNED`, `RECORDING`, `EDITING`, `FINAL_RENDER`, `READY_FOR_PUBLISH`).
  - `SocialReviewStatus`: Owned by `socialReviewService` (`PENDING_REVIEW`, `APPROVED`, `CHANGES_REQUESTED`, `REJECTED`).
  - `SocialPublishStatus`: Owned by `publishingService` (`NOT_SCHEDULED`, `SCHEDULED`, `PUBLISHED`, `FAILED`).
- **UI State vs Business State:**
  - UI navigation tabs and conveyor column positions are derived projections from backend domain statuses and must not mutate business state independently.

---

## 8. Version Ownership & Cryptographic Hashing
- **Script Versions:** Incrementing integer `versionNumber` owned by `scriptService`, logged to `SCRIPT_VERSIONS`.
- **Thumbnail Versions:** Incrementing integer `versionNumber` owned by `thumbnailService`, logged to `THUMBNAIL_VERSIONS`.
- **Pinned Comment Versions:** Incrementing integer `versionNumber` owned by `pinnedCommentService`, logged to `PINNED_COMMENT_VERSIONS`.
- **Artifact Hashes:** SHA-256 deterministic hashes computed over canonical artifact representations (`questionHash`, `scriptHash`, `videoHash`, `thumbnailHash`, `pinnedCommentHash`, `packageOverallHash`).
- **Hash Lock Enforcement:**
  - `SocialReview` locks `packageOverallHash` at the moment of review decision.
  - `PlatformAdaptation` locks canonical source package hash.
  - Any post-review mutation of underlying artifacts produces a hash mismatch, automatically invalidating social review PASS status and blocking downstream publishing.

---

## 9. Social Review, Platform Adaptation, and Publishing Boundaries

### Social Review Ownership
- `socialReviewsRepository` is the sole canonical repository.
- `socialReviewService` is the sole mutating business service.
- Review decisions (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`) are persisted to `SOCIAL_REVIEWS` sheet.
- Publishing readiness reads review decisions; publishing NEVER creates or overwrites review records.

### Platform Adaptation Ownership
- `platformAdaptationsRepository` is the sole entity store for platform-adapted text packages (YouTube, Instagram, Facebook).
- `platformAdaptationService` owns platform-specific validation (hashtag counts, title lengths, anti-answer-leakage).
- Adaptations store locked source package hashes to ensure canonical synchronization.

### Publishing Ownership
- `publishingRepository` and `publishingService` own platform distribution records (`PUBLISHING` worksheet).
- A Publishing Record stores platform execution state (`youtubeStatus`, `instagramStatus`, `facebookStatus`, external URLs, timestamps).
- Publishing derives readiness from Social Review PASS and Platform Adaptation APPROVAL without mutating source content.

---

## 10. Analytics & Audit/History Boundaries
- **Operational Production Data:** `QUESTIONS`, `VIDEOS`, `SCRIPT`, `THUMBNAILS`, `PINNED_COMMENTS`, `SOCIAL_REVIEWS`, `PUBLISHING`. Represents live active state.
- **Audit & Version History:** `WORKFLOW`, `AUDIT_LOG`, `SCRIPT_VERSIONS`, `THUMBNAIL_VERSIONS`, `PINNED_COMMENT_VERSIONS`, `QUESTION_VALIDATIONS`. Append-only immutable log.
- **Analytics Boundary:** Social performance metrics and engagement analytics are isolated from production workflow state and stored in dedicated analytics structures (`social_analytics`).

---

## 11. Code Changes Made
1. **`src/lib/ownership/data-ownership.ts`**:
   - Implemented `resolveContentMasterId` identity resolution helper.
   - Implemented `isCanonicalDomainId` pattern validator.
   - Defined `FieldSemanticRole` enum (`AUTHORITATIVE`, `DERIVED`, `CACHE`, `SNAPSHOT`, `HISTORY_AUDIT`, `COMPATIBILITY`).
   - Programmatically declared `ENTITY_OWNERSHIP_MATRIX` mapping all 14 major production entities.
2. **`src/lib/ownership/index.ts`**:
   - Re-exported data ownership governance utilities.

---

## 12. Code Changes Intentionally NOT Made
- **NO destructive migrations or schema updates:** Existing Google Sheets columns and row structures were kept 100% intact.
- **NO field deletions:** Compatibility fields (`contentId`, `contentMasterId`) were preserved to prevent breaking external integrations.
- **NO database engine change:** PostgreSQL / SQL migration was not performed; Google Sheets remains the authoritative database.
- **NO route or workflow redesign:** Existing route handlers and 15-step workflow state machine preserved.

---

## 13. Data Safety Verification
- **Sequence Safety:** Confirmed no test IDs (`TEST-P09-...`) pollute sequence counters in `SEQUENCES` worksheet.
- **Read-Only Safety Guarantee:** Diagnostics and verification tools operate in read-only mode without mutating live sheet rows.
- **Zero Record Destruction:** Verified no production rows were deleted, cleared, or reset.

---

## 14. Verification & Test Results

### TypeScript Typecheck
- **Command:** `npx tsc --noEmit`
- **Result:** PASSED with **0 errors**.

### Applet Compilation & Build
- **Command:** `compile_applet` (`npm run build`)
- **Result:** PASSED (`Build succeeded - the applet is compiled`).

### Linting
- **Command:** `lint_applet` (`npm run lint`)
- **Result:** PASSED (`Linting completed successfully`).

### Focused Test Suites
1. **Phase 20 Social Review & Quality Gate (`npm run test:phase20`)**:
   - Passed: 23 / 25
   - Failed: 2 (`P20-16` and `P20-25` attributable strictly to Google Drive OAuth `invalid_grant` credential state).
   - Code/Logic Errors: 0.

2. **Phase 21 Multi-Platform Adaptation (`npm run test:phase21`)**:
   - Passed: 25 / 25
   - Final Verdict: **PASS**.

3. **Phase 22 Publishing Hub (`npm run test:phase22`)**:
   - Passed: 27 / 27
   - Final Verdict: **PASS**.

---

## 15. Explicit Phase Deferrals
- **Phase 8 (Legacy Code Removal & Deprecation Cleanup)**: Strictly deferred.
- **Phase 9 (Final Verification & Release Production Readiness)**: Strictly deferred.
