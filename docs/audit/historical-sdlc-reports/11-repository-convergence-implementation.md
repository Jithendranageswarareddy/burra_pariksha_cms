# Phase 6: Repository Convergence Implementation Report

## Executive Summary
This document records the architectural convergence of the Burra Pariksha CMS repository layer under **Phase 6: Repository Convergence**.

Canonical data persistence for all primary entities is anchored in Google Sheets-backed repositories that extend `BaseRepository`. Compatibility adapters delegating to canonical repositories have been established for phase-prefixed interfaces (`phase20SocialReviewsRepository` and `phase22PublishingRepository`), and canonical services (`publishing.service.ts` and `phase20-social-review.service.ts`) have been refactored to depend directly on canonical repositories (`publishingRepository` and `socialReviewsRepository`).

---

## 1. Canonical Repository Ownership
Canonical repositories directly extend `BaseRepository` and map to declared Google Sheets schema worksheets in `SHEET_SCHEMAS`:

1. **`socialReviewsRepository` (`src/lib/repositories/social-reviews.repository.ts`)**:
   - Canonical repository for social review records and Phase 20 quality gate records.
   - Maps to `SHEET_TABS.SOCIAL_REVIEWS`.
   - Exposes canonical Phase 20 review persistence methods (`createPhase20Record`, `findPhase20ById`, `findPhase20ByContentId`, `getLatestPhase20ByContentId`, `updatePhase20Record`, `invalidatePhase20ReviewsForContent`, `clearPhase20Store`).
   - Automatically synchronizes Phase 20 review records into Google Sheets `SOCIAL_REVIEWS` records.

2. **`publishingRepository` (`src/lib/repositories/publishing.repository.ts`)**:
   - Canonical repository for publishing distribution records and multi-platform publishing hub records.
   - Maps to `SHEET_TABS.PUBLISHING`.
   - Exposes canonical Phase 22 publishing hub methods (`generateId`, `savePhase22Record`, `findPhase22ById`, `findPhase22ByContentIdAndPlatform`, `findPhase22ByContentIdPlatformAndVersion`, `findPhase22ByContentId`, `findAllPhase22`, `searchPhase22`, `clearPhase22Store`).

3. **Other Canonical Google Sheets Repositories**:
   - `questionsRepository` (`questions.repository.ts`)
   - `videosRepository` (`videos.repository.ts`)
   - `scriptsRepository` (`scripts.repository.ts`)
   - `thumbnailsRepository` (`thumbnails.repository.ts`)
   - `pinnedCommentsRepository` (`pinned-comments.repository.ts`)
   - `assignmentsRepository` (`assignments.repository.ts`)
   - `contentMastersRepository` (`content-masters.repository.ts`)
   - `auditLogRepository` (`audit-log.repository.ts`)
   - `workflowRepository` (`workflow.repository.ts`)

---

## 2. Compatibility Adapters
Phase-prefixed repositories exist strictly as thin compatibility adapters for legacy/external callers and test suites that require phase-prefixed contracts. They delegate all persistence operations to canonical repositories:

1. **`Phase20SocialReviewsRepository` (`src/lib/repositories/phase20-social-reviews.repository.ts`)**:
   - Compatibility adapter class delegating directly to `socialReviewsRepository`.
   - Contains no independent state or duplicate persistence store.

2. **`Phase22PublishingRepository` (`src/lib/repositories/phase22-publishing.repository.ts`)**:
   - Compatibility adapter class delegating directly to `publishingRepository`.
   - Contains no independent state or duplicate persistence store.

3. **Re-Export Proxies (`users.repository.ts`, `question-videos.repository.ts`, `script-versions.repository.ts`, `thumbnail-versions.repository.ts`, `pinned-comment-versions.repository.ts`)**:
   - Compatibility proxies re-exporting canonical repository definitions for backwards compatibility.

---

## 3. Service → Repository Convergence
Canonical services have been updated to depend directly on canonical repositories rather than compatibility adapters:

- **`publishing.service.ts`**:
  - Removed imports of `phase22PublishingRepository` and `phase20SocialReviewsRepository`.
  - Now imports and invokes `publishingRepository` and `socialReviewsRepository` directly.

- **`phase20-social-review.service.ts`**:
  - Removed import of `phase20SocialReviewsRepository`.
  - Now imports and invokes `socialReviewsRepository` directly.

Target Dependency Architecture Achieved:
```
publishing.service.ts
    ↓
publishingRepository
socialReviewsRepository

phase20-social-review.service.ts
    ↓
socialReviewsRepository
```

---

## 4. Remaining Direct Route Repository Usages
Direct repository imports in `src/server/routes.ts` were inspected and verified as intentional read-only exceptions / parameter resolution logic:

- `usersRepository.findById`: Lightweight user/session validation in authentication middleware before invoking domain services.
- `questionsRepository.findById`: Route parameter resolution and existence verification before invoking workflow services.
- `videosRepository.findById`, `scriptsRepository.findByQuestionId`, `thumbnailsRepository.findById`, `mediaAssetsRepository.findByContentIdAndStage`, `thumbnailCandidatesRepository.findByContentId`: Parameter checks and direct read responses for UI endpoints.
- `socialReviewsRepository.findAll / findById / findByQuestion`: Direct read endpoints for social review administrative lists.

No Phase 4 route redesign was performed, preserving existing service ownership boundaries.

---

## 5. Repository Classification Inventory
The 38 repository files under `src/lib/repositories/` are classified as follows:

| Repository File | Classification | Rationale |
|---|---|---|
| `social-reviews.repository.ts` | CANONICAL | Primary Google Sheets repository for social reviews and Phase 20 records. |
| `publishing.repository.ts` | CANONICAL | Primary Google Sheets repository for publishing distribution and Phase 22 records. |
| `questions.repository.ts` | CANONICAL | Primary Google Sheets repository for questions. |
| `videos.repository.ts` | CANONICAL | Primary Google Sheets repository for video records. |
| `scripts.repository.ts` | CANONICAL | Primary Google Sheets repository for scripts. |
| `thumbnails.repository.ts` | CANONICAL | Primary Google Sheets repository for thumbnails. |
| `pinned-comments.repository.ts` | CANONICAL | Primary Google Sheets repository for pinned comments. |
| `assignments.repository.ts` | CANONICAL | Primary Google Sheets repository for task assignments. |
| `content-masters.repository.ts` | CANONICAL | Primary Google Sheets repository for content masters. |
| `audit-log.repository.ts` | CANONICAL | Primary Google Sheets repository for audit trails. |
| `workflow.repository.ts` | CANONICAL | Primary Google Sheets repository for workflow transitions. |
| `phase20-social-reviews.repository.ts` | COMPATIBILITY ADAPTER | Delegates to `socialReviewsRepository`. |
| `phase22-publishing.repository.ts` | COMPATIBILITY ADAPTER | Delegates to `publishingRepository`. |
| `users.repository.ts` | COMPATIBILITY PROXY | Re-exports canonical users repository. |
| `question-videos.repository.ts` | COMPATIBILITY PROXY | Re-exports canonical videos repository. |
| `script-versions.repository.ts` | COMPATIBILITY PROXY | Re-exports canonical script versions repository. |
| `thumbnail-versions.repository.ts` | COMPATIBILITY PROXY | Re-exports canonical thumbnail versions repository. |
| `pinned-comment-versions.repository.ts` | COMPATIBILITY PROXY | Re-exports canonical pinned comment versions repository. |
| `platform-adaptations.repository.ts` | UNIQUE PRODUCTION REPOSITORY | Dedicated entity store for multi-platform adaptations (Phase 21). |
| `thumbnail-candidates.repository.ts` | UNIQUE PRODUCTION REPOSITORY | Dedicated entity store for AI thumbnail candidates (Phase 18). |
| `pinned-comment-packages.repository.ts` | UNIQUE PRODUCTION REPOSITORY | Dedicated entity store for pinned comment packages (Phase 19). |
| `refinement-candidates.repository.ts` | UNIQUE PRODUCTION REPOSITORY | Dedicated entity store for AI question refinement candidates (Phase 13). |

---

## 6. Verification & Test Results

### Typecheck
- **`npx tsc --noEmit`**: PASSED with **0 errors**.

### Compilation & Build
- **`compile_applet`**: PASSED (`Build succeeded - the applet is compiled`).

### Linting
- **`lint_applet` (`npm run lint`)**: PASSED cleanly.

### Focused Test Suites
1. **Phase 20 Social Review & Quality Gate (`npm run test:phase20`)**:
   - Total Checks: 25
   - Passed: 23
   - Failed: 2 (`P20-16` and `P20-25` attributable strictly to Google Drive OAuth `invalid_grant` credential state).
   - Code/Logic Errors: 0.

2. **Phase 21 Multi-Platform Adaptation (`npm run test:phase21`)**:
   - Total Checks: 25
   - Passed: 25
   - Failed: 0
   - Final Verdict: **PASS**.

3. **Phase 22 Publishing Hub (`npm run test:phase22`)**:
   - Total Checks: 27
   - Passed: 27
   - Failed: 0
   - Final Verdict: **PASS**.

---

## 7. Explicit Phase Deferrals
- **Phase 7 (Data Ownership & Security Policies)**: Strictly deferred. No role authorization or security rule modifications performed.
- **Phase 8 (Legacy Code Removal)**: Strictly deferred. No deprecated file deletions or breaking contract removals performed.
- **Phase 9 (Final Verification & Production Release)**: Strictly deferred.
