# S4-T01: Database Migration Baseline & Architectural Inventory

## 1. Executive Summary
- **Sprint Target**: Migrate BP-CMS operational persistence model from Google Sheets to Cloud Firestore as the single authoritative production datastore.
- **Rule AP-004**: Backend authorization remains authoritative. Direct client SDK access is governed defensively by Firestore Security Rules.
- **Zero Dual-Master**: Firestore is authoritative for all transactional state; Google Sheets becomes legacy / optional read-only archive/export.
- **Data Continuity**: Project owner confirmed existing Google Sheets contain no valuable production data. Clean production schema initialization on Firestore with deterministic ID formats, OCC versioning, and zero data loss.

---

## 2. Abstraction Hierarchy & Interfaces
- **Current State**:
  - `IRepository<T extends BaseEntity>` defined in `src/lib/db/repository.interface.ts` with `BaseEntity: { id, version, createdAt, updatedAt, isDeleted }`.
  - `InMemoryRepository<T>`: In-memory simulation of `IRepository<T>` with atomic locking, OCC checking, soft-delete filtering, and mutation audit hook notifications.
  - `FirestoreRepository<T>`: Existing partial REST-based implementation using `googleapis` with fallback to `InMemoryRepository<T>`.
  - `BaseRepository<T>` in `src/lib/repositories/base.repository.ts`: Legacy Google Sheets row-to-object CRUD adapter using `google-sheets/client.ts` with deletion safety pipeline and in-memory caches.
  - Repositories in `src/lib/repositories/` currently extend `BaseRepository<T>`.
- **Target State (S4-T03 & S4-T08)**:
  - Migrate all operational repositories from Google Sheets `BaseRepository<T>` to `FirestoreRepository<T>` implementing `IRepository<T>`.
  - Use official `firebase/firestore` SDK configured via `firebase-applet-config.json`.
  - Preserve OCC semantics (`expectedVersion` comparison, atomic increment `version + 1`).
  - Preserve mutation audit event propagation to `IAuditDispatcher` (`audit_logs` collection).

---

## 3. Entity to Collection Mapping

| Domain Entity | Google Sheets Tab | Firestore Collection | Primary Key Format | OCC & Versioning | Audit Hook |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `USERS` | `users` | `USR-###` | `sessionVersion`, `version` | Yes |
| **Question Draft** | `QUESTIONS` (drafts) | `question_drafts` | `BP-DFT-######` | `version` | Yes |
| **Question** | `QUESTIONS` | `questions` | `BP-Q-######` | `version` | Yes |
| **Category** | `CATEGORIES` | `categories` | `BP-CAT-###` | `version` | Yes |
| **Topic** | `TOPICS` | `topics` | `BP-TOP-####` | `version` | Yes |
| **Subtopic** | `SUBTOPICS` | `subtopics` | `BP-SUB-######` | `version` | Yes |
| **Video** | `VIDEOS` | `videos` | `BP-V-######` | `version` | Yes |
| **Question Video** | `QUESTION_VIDEOS` | `question_videos` | `QV-######` | `version` | Yes |
| **Script** | `SCRIPT` | `scripts` | `BP-S-######` | `version` | Yes |
| **Script Version** | `SCRIPT_VERSIONS` | `script_versions` | `BP-SV-######` | `version` | Yes |
| **Thumbnail** | `THUMBNAILS` | `thumbnails` | `BP-T-######` | `version` | Yes |
| **Thumbnail Version**| `THUMBNAIL_VERSIONS`| `thumbnail_versions` | `BP-TV-######` | `version` | Yes |
| **Pinned Comment** | `PINNED_COMMENTS` | `pinned_comments` | `BP-PIN-######` | `version` | Yes |
| **Pinned Comment Ver**| `PINNED_COMMENT_VERSIONS`| `pinned_comment_versions`| `BP-PV-######` | `version` | Yes |
| **Assignment** | `ASSIGNMENTS` | `assignments` | `BP-ASN-######` | `version` | Yes |
| **Publishing Package**| `PUBLISHING` | `publishing_packages`| `PUB-######` / `BP-PUB-######` | `version` | Yes |
| **Audit Log** | `AUDIT_LOG` | `audit_logs` | `AUD-###` / `aud_###` | Immutable append | Yes |
| **Sequence Counter** | `SEQUENCES` | `sequences` | `{entity_type}` | Atomic counter | System |
| **Content Master** | `CONTENT_MASTERS` | `content_masters` | `BP-CNT-######` | `version` | Yes |
| **Content Plan** | `CONTENT_PLANS` | `content_plans` | `BP-PLN-####` | `version` | Yes |
| **Content Batch** | `CONTENT_BATCHES` | `content_batches` | `BP-BCH-####` | `version` | Yes |
| **Question Validation**| `QUESTION_VALIDATIONS`| `question_validations`| `BP-VAL-######` | `version` | Yes |
| **Social Review** | `SOCIAL_REVIEWS` | `social_reviews` | `BP-REV-######` | `version` | Yes |
| **Question Config** | `QUESTION_CONFIG` | `question_configs` | `BP-QCFG-###` | `version` | Yes |
| **Media Asset** | `MEDIA_ASSETS` | `media_assets` | `BP-MED-######` | `version` | Yes |
| **Social Analytics** | `SOCIAL_ANALYTICS` | `social_analytics` | `BP-ANL-######` | `version` | Yes |
| **Analytics Intelligence**| `ANALYTICS_INTELLIGENCE`| `analytics_intelligences`| `BP-SPI-######` | `version` | Yes |
| **Strategy Recommendation**| `STRATEGY_RECOMMENDATIONS`| `strategy_recommendations`| `BP-STR-######`| `version` | Yes |
| **Social Comment** | `SOCIAL_COMMENTS` | `social_comments` | `BP-CMT-######` | `version` | Yes |
| **Comment Intelligence**| `COMMENT_INTELLIGENCE`| `comment_intelligences`| `BP-CMI-######` | `version` | Yes |
| **Workflow Instance**| `WORKFLOW` | `workflow_instances` | `wfl_###` | `version` | Yes |
| **Workflow History** | `WORKFLOW` (history) | `workflow_history` | `wfh_###` | Immutable append | Yes |

---

## 4. Concurrency & Optimistic Locking Strategy
- Firestore documents store an integer `version` field (starts at 1).
- Every update and delete operation accepts an `expectedVersion: number`.
- Atomic Firestore transactions (`runTransaction`) verify `doc.data().version === expectedVersion`.
- On match: write patch, increment version to `expectedVersion + 1`, update `updatedAt`.
- On mismatch: throw `ConcurrencyConflictError` (HTTP 409).

---

## 5. Security & RBAC Enforcement Plan
1. **Server-Side Authoritative Gatekeeper (Backend)**:
   - Node.js / Express routes check `requireAuth` session cookie / Bearer token.
   - Evaluates capabilities via `centralAuthorizationService` and `rbacEvaluator`.
   - Executes mutations via Firestore SDK on the server.
2. **Client-Side Direct Security Rules (`firestore.rules`)**:
   - Deployed to Cloud Firestore for defense-in-depth.
   - Enforces default deny, authentication, role claims/document verification, and immutability for `audit_logs`.
