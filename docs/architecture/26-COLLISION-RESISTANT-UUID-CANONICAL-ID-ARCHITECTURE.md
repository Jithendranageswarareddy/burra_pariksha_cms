# 26 — COLLISION-RESISTANT UUID CANONICAL ID ARCHITECTURE (SPRINT 6)

## 1. Executive Summary & Architectural Mandate

In Sprint 6, Burra Pariksha CMS (BP-CMS) completely decommissioned and eliminated all database-backed entity ID sequence infrastructure (`sequences` Firestore collection, Google Sheets sequence counters, sequence allocators, forward-only safety checks, sequence repair services, and sequence synchronization UI).

The platform transitioned fully to a collision-resistant, distributed UUID v4 canonical ID architecture:

$$\text{Entity Domain Service} \longrightarrow \text{CanonicalIdService} \longrightarrow \text{Prefixed UUID } (\text{e.g., } \texttt{qst\_<uuid>}, \texttt{vid\_<uuid>}) \longrightarrow \text{Cloud Firestore}$$

### Key Architectural Gains
1. **Zero Database Coordination on ID Generation**: Entity creation no longer performs transactional locking or atomic counter increments against a central sequence table, eliminating distributed bottlenecks and race conditions.
2. **Infinite Horizontal Scalability**: ID generation is purely local and stateless; millions of concurrent writes across serverless functions or edge nodes can proceed without collisions.
3. **Elimination of Sequence Sync Overhead**: Sequence desynchronization, counter gaps, out-of-order sequence repairs, and forward-only guard matrix checks are completely obsolete and removed.
4. **Preservation of Canonical Prefixes**: Human-readable, 3-character prefixes (e.g., `qst_`, `vid_`, `scr_`, `top_`, `sub_`) are preserved for instant forensic readability in logs, audits, and URLs.

---

## 2. Decommissioned Sequence Infrastructure

The following legacy sequence components and models have been completely excised from the repository:

| Decommissioned Component | Type | Former Role | Status |
| :--- | :--- | :--- | :--- |
| `src/lib/repositories/sequences.repository.ts` | Repository | Direct Firestore CRUD for `sequences` documents | **DELETED** |
| `src/lib/services/sequence-safety.service.ts` | Service | Validated forward-only counters and sequence health | **DELETED** |
| `sequences` collection in `firestore.rules` | Security Rule | Firestore rule match for sequence counter docs | **REMOVED** |
| `DOMAIN_COLLECTIONS.SEQUENCES` | Schema Constant | Registry reference to `sequences` collection | **REMOVED** |
| `SHEET_TABS.SEQUENCES` | Sheets Schema | Legacy sequence counter tab mapping | **REMOVED** |
| `SEQUENCE_ENTITIES` & `ID_PREFIX_MAP` | Schema Registry | Numeric sequence entity mapping | **REMOVED** |
| `SequenceAllocationError` | Domain Error | Thrown when sequence counters conflicted | **REMOVED** |
| `allocate*Id()` & `allocateNextNumber()` | Service API | Centralized sequence number allocation methods | **REMOVED** |
| `/api/system/sequence-safety` | Express Route | REST endpoint for sequence health matrix | **REMOVED** |
| `/api/system/recovery/sync-sequence` | Express Route | REST endpoint for forcing sequence re-sync | **REMOVED** |
| `SettingsPage.tsx` Sequence Matrix | UI Component | Admin table showing sequence counter states | **REMOVED** |
| `RecoveryAdminPage.tsx` Sequence Card | UI Component | Forward-only safety recovery button | **REMOVED** |

---

## 3. Canonical ID Service Specification (`src/lib/id.service.ts`)

The authoritative implementation resides in `src/lib/id.service.ts` (aliased via `src/lib/services/id.service.ts`). It generates lowercase UUID v4 strings prefixed by standard entity identifiers.

### ID Format Standard
```text
<prefix>_<uuid_v4>
```
Example: `qst_a80b1dfa-12e2-45e3-b684-297eb098198f`

### Complete Entity Prefix Registry

| Entity | Prefix | Generator Method | Target Firestore Collection |
| :--- | :--- | :--- | :--- |
| **Question** | `qst_` | `generateQuestionId()` | `questions` |
| **Video** | `vid_` | `generateVideoId()` | `videos` |
| **Script** | `scr_` | `generateScriptId()` | `scripts` |
| **Thumbnail** | `thm_` | `generateThumbnailId()` | `thumbnails` |
| **Pinned Comment** | `pin_` | `generatePinnedCommentId()` | `pinned_comments` |
| **Topic** | `top_` | `generateTopicId()` | `topics` |
| **Subtopic** | `sub_` | `generateSubtopicId()` | `subtopics` |
| **User** | `usr_` | `generateUserId()` | `users` |
| **Content Master** | `cnt_` | `generateContentMasterId()` | `content_master` |
| **Content Plan** | `pln_` | `generateContentPlanId()` | `content_plans` |
| **Batch** | `bch_` | `generateBatchId()` | `batches` |
| **Assignment** | `asn_` | `generateAssignmentId()` | `assignments` |
| **Analytics Metric** | `anl_` | `generateAnalyticsId()` | `analytics` |
| **Platform Adaptation** | `adp_` | `generateAdaptationId()` | `platform_adaptations` |
| **Audit Log Entry** | `aud_` | `generateAuditId()` | `audit_logs` |
| **Media Asset** | `med_` | `generateMediaAssetId()` | `media_assets` |
| **Publishing Record** | `pub_` | `generatePublishingId()` | `publishing` |
| **Review Record** | `rev_` | `generateReviewId()` | `reviews` |
| **Validation Run** | `val_` | `generateValidationRunId()` | `validation_runs` |
| **System / Config** | `cfg_` | `generateConfigId()` | `system_configs` |
| **Social Comment** | `cmt_` | `generateSocialCommentId()` | `social_comments` |
| **Comment Intelligence** | `cmi_` | `generateCommentIntelligenceId()` | `comment_intelligence` |
| **Social Perf Intel** | `spi_` | `generateSocialPerformanceId()` | `social_performance` |
| **Content Strategy** | `cst_` | `generateContentStrategyId()` | `content_strategy` |
| **Operational Recovery**| `rec_` | `generateRecoveryId()` | `recovery_jobs` |
| **Snapshot Execution** | `snp_` | `generateSnapshotExecutionId()` | `snapshot_executions` |

### Core Code Contract
```typescript
import { v4 as uuidv4 } from 'uuid';

export class CanonicalIdService {
  public generateCanonicalId(prefix: string): string {
    const cleanPrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;
    return `${cleanPrefix}${uuidv4()}`;
  }

  public async generateQuestionId(): Promise<string> {
    return this.generateCanonicalId('qst_');
  }

  public async generateVideoId(): Promise<string> {
    return this.generateCanonicalId('vid_');
  }

  // All 26 entities supported synchronously & asynchronously...
}

export const canonicalIdService = new CanonicalIdService();
```

---

## 4. Domain Services Migration (All 18 Production Services)

All 18 production domain services migrate from database sequence allocation to direct canonical ID generation:

1. `question.service.ts`: `canonicalIdService.generateQuestionId()`
2. `video.service.ts`: `canonicalIdService.generateVideoId()`
3. `script.service.ts`: `canonicalIdService.generateScriptId()`
4. `thumbnail.service.ts`: `canonicalIdService.generateThumbnailId()`
5. `pinned-comment.service.ts`: `canonicalIdService.generatePinnedCommentId()`
6. `taxonomy.service.ts`: `canonicalIdService.generateTopicId()`, `generateSubtopicId()`
7. `planning.service.ts`: `canonicalIdService.generateContentPlanId()`, `generateBatchId()`
8. `assignment.service.ts`: `canonicalIdService.generateAssignmentId()`
9. `publishing.service.ts`: `canonicalIdService.generatePublishingId()`
10. `analytics.service.ts`: `canonicalIdService.generateAnalyticsId()`
11. `social-performance-intelligence.service.ts`: `canonicalIdService.generateSocialPerformanceId()`
12. `platform-adaptation.service.ts`: `canonicalIdService.generateAdaptationId()`
13. `content-strategy.service.ts`: `canonicalIdService.generateContentStrategyId()`
14. `social-comments.service.ts`: `canonicalIdService.generateSocialCommentId()`
15. `comment-intelligence.service.ts`: `canonicalIdService.generateCommentIntelligenceId()`
16. `content-master.service.ts`: `canonicalIdService.generateContentMasterId()`
17. `video-production.service.ts`: `canonicalIdService.generateVideoId()`
18. `script-production.service.ts`: `canonicalIdService.generateScriptId()`

---

## 5. UI & System Observability Adjustments

1. **System Health Indicator (`src/components/layout/SystemHealthIndicator.tsx`)**:
   - The former "Sequence Integrity" status row was updated to **"Data Integrity"**.
   - Reflects general data validation and schema consistency rather than sequence counter tracking.
2. **Settings Page (`src/pages/SettingsPage.tsx`)**:
   - Decommissioned the "Sequence Safety Matrix" and "Sequence Synchronizer" modals.
   - Removed the obsolete sequence increment configuration tables.
3. **Recovery Administration (`src/pages/RecoveryAdminPage.tsx`)**:
   - Removed the "Sequence Forward-Only Safety" card and counter verification buttons.
   - Snapshot recovery services now preserve entity IDs directly or assign canonical UUIDs without requiring sequence allocation tables.

---

## 6. Category B Invariance Preservation

In strict accordance with the Sprint 6 specification, non-entity-ID uses of the word "sequence" were intentionally identified and preserved:

1. **Telugu Unicode Sequences**:
   - ZWJ (Zero-Width Joiner `\u200D`) and conjunct character sequences in Telugu typography (preserved in `platform-adaptation.service.ts`).
2. **Canonical 15-Step Workflow Sequences**:
   - Sequential workflow lifecycle transitions (Stage 01 to Stage 15) remain the foundation of CMS operations.
3. **Challenge Permutation Ordering**:
   - Question challenge types such as `ARRANGE_ORDER` and options sequence permutations (preserved in `options.validator.ts`).
4. **Audit Log Chronological Sequences**:
   - Sequential timestamp ordering for compliance and immutable audit replay.
5. **Historical Archive Compatibility**:
   - Archive snapshot restore services retain backward-compatibility mappings to read historical backup archives without failing if legacy fields exist.

---

## 7. Verification & Invariants

| Test Suite | Purpose | Result |
| :--- | :--- | :--- |
| `tests/s6-no-sequence-architecture.test.ts` | 10 static architectural checks: zero sequence repos, zero sequence safety services, zero sequence collections, zero allocators across 365 repository files | **10/10 PASS** |
| `tests/s6-real-runtime-e2e.test.ts` | Live Firestore end-to-end integration: Topic $\to$ Subtopic $\to$ Question $\to$ Video $\to$ Script workflow with 0 sequence documents in Firestore | **100% PASS** |
| `tests/s4-gate3-id-sequences.test.ts` | Gate 3 canonical ID generation, concurrency uniqueness, and zero sequence records | **3/3 PASS** |
| `tests/s5-two-tier-taxonomy.test.ts` | 2-Tier taxonomy with canonical UUID generation | **11/11 PASS** |
| `tests/architecture-sheets-decoupling.test.ts` | Complete decoupling of ID allocation from external spreadsheets | **7/7 PASS** |
| `tests/fc-002-rbac.test.ts` | RBAC access controls with canonical UUID identities | **12/12 PASS** |
| Static Typecheck (`npm run lint`) | Full TypeScript verification across entire codebase | **0 Errors** |
| Production Bundle (`npm run build`) | Vite client build + esbuild server bundle | **Clean Build** |
