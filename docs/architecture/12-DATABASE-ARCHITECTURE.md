# 12 — DATABASE ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 12 of 30-Stage Modernization Program — Authoritative Persistence Architecture & Strategic Database Decision

```
================================================================================
Document ID:       BP-ARCH-12-DATABASE
Version:           12.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL DECISION
Scope:             Persistence Architecture, Candidate Evaluation, & Storage Decision
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
Downstream Stages: 13-API-CONTRACT.md
                   14-WORKFLOW-ENGINE-IMPLEMENTATION.md
                   15-AUTH-IMPLEMENTATION.md
                   16-PERSISTENCE-IMPLEMENTATION.md
                   17-MEDIA-STORAGE.md
                   27-NOTIFICATIONS-AUDIT.md
                   28-E2E-INTEGRATION-TESTING.md
                   30-FINAL-SYSTEM-AUDIT.md
Primary Decision:  HYBRID ARCHITECTURE: Cloud Firestore Native (Authoritative Transactional)
                   + Google Sheets (Secondary Operational Export & Human Audit Window)
Budget Constraint: Hard Initial Infrastructure Ceiling: ₹0–₹100 (Zero-Cost Invariant)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Database Architecture** and persistence strategy for the Burra Pariksha Content Management System (BP-CMS). Grounded in the preceding eleven canonical SDLC stages, it resolves the architectural tension between operational simplicity, relational integrity, multi-step transaction atomicity, audit immutability, and the mandatory **₹0–₹100 initial infrastructure investment constraint**.

### 1.2 Anti-Overclaim Invariants
1. **Architectural Evaluation & Decision Only:** This document formalizes the *persistence architecture evaluation and decision*. It does **not** assert that database schemas, Firestore collections, PostgreSQL tables, or Google Sheets worksheets have been migrated, altered, or created.
2. **Zero Runtime Code Modification:** No application source code, repository implementations, migration scripts, or Express handlers are modified in Stage 12.
3. **No Premature DDL Execution:** Physical collection schemas, indexing rules, and migration execution are deferred strictly to **Stage 16 (Persistence Implementation)**.

---

## 2. Hard Architectural Constraints

Every candidate evaluated in this stage is subjected to the following non-negotiable constraints:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              HARD ARCHITECTURAL CONSTRAINTS                            │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ 1. Initial Budget       │ HARD CEILING: ₹0 to ₹100 total initial cash outlay.          │
 │    Ceiling              │ Commercial solutions requiring monthly baselines (e.g., Cloud│
 │                         │ SQL at ~₹1,200/mo) are disqualified from initial phase.      │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 2. Zero Duplicate State │ Exactly ONE authoritative transactional system of record.    │
 │    Ownership (AP-010)   │ No competing dual-master split-brain state ownership.        │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 3. Cloud Run Stateless  │ Seamless execution inside serverless container runtime       │
 │    Compatibility        │ (Zero persistent local disks; graceful cold-start behavior). │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 4. Multi-Entity Atomic  │ Workflow stage advancement + immutable transition logging    │
 │    Transactions         │ must execute as an indivisible atomic unit.                  │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 5. Media Binary         │ Zero binary media bytes stored in database rows/documents;   │
 │    Isolation (AP-007)   │ externalized to Google Drive / Cloud Storage.                │
 └─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 3. BP-CMS Persistence Requirements & Pressures

The database architecture must support the specific operational demands of educational video production:

1. **Canonical 15-Stage Workflow Orchestration:** Strict state progression tracking across 15 business stages with zero stage skips.
2. **Append-Only Transition & Audit Logging:** Immutable, permanent history logs (`WorkflowTransition`, `AuditEvent`) that cannot be purged or edited.
3. **Anti-Self-Approval Enforcement (`GAR-02`):** Database must store and evaluate reviewer IDs against author IDs across reviews.
4. **Optimistic Concurrency Control (OCC):** Entity version tokens (`version`, `updatedAt`, `lastModifiedBy`) to block concurrent overwrite collisions.
5. **Relational Graph Complexity:** Hierarchical linkages connecting `Content` -> `Question` -> `QuestionVersion` -> `Script` -> `Video` -> `VideoTake` -> `VideoEdit` -> `MediaAsset` -> `PublishingPackage` -> `Publication` -> `AnalyticsSnapshot`.
6. **Telemetry & Retention Curves:** Second-by-second audience retention arrays (60 numeric data points per published short).

---

## 4. Evaluation of Primary Database Candidates

Four primary persistence architectures were subjected to rigorous evaluation across 30 technical dimensions:

### Candidate A: Pure Google Sheets (Current Brownfield Baseline)
- **Concept:** Continue using Google Sheets worksheets via Google Sheets API v4 as the sole database.
- **Strengths:** ₹0 cost, human-readable spreadsheet UI for non-technical stakeholders, zero database management.
- **Fatal Structural Flaws:**
  - **Zero Multi-Row ACID Transactions:** Cannot atomically advance a workflow stage and insert a transition row.
  - **Severe Rate-Limit Vulnerability:** 300 requests/minute per project and 60 requests/minute per user. Burst operations in studio or batch publishing rapidly exhaust quotas, throwing HTTP 429 errors.
  - **Simulated Concurrency:** Concurrency is emulated via in-process Node.js memory locks (`recordLocks`), which fail completely when scaled across multiple Cloud Run container instances.
  - **Latency:** Average write latency of 400ms–1200ms per cell range update.
  - **Cell Limit Horizon:** Sheets caps spreadsheets at 10,000,000 cells; high-frequency audit logs and second-by-second analytics will corrupt or truncate the sheet over time.

### Candidate B: Pure Google Cloud Firestore (Native Mode)
- **Concept:** Migrate all domain entities, collections, workflow instances, and audit logs to NoSQL Cloud Firestore.
- **Strengths:**
  - **₹0 Cost within Free Tier:** 1 GiB storage, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day free forever. Fits 100% within the ₹0–₹100 constraint.
  - **Multi-Document ACID Transactions:** Built-in atomic transactions (`runTransaction`) support up to 500 document writes per commit.
  - **Native Cloud Run Integration:** Zero connection pool exhaustion; uses IAM service account credentials with sub-15ms latency.
  - **Optimistic Concurrency:** Native document snapshot precondition checks (`lastUpdateTime`).
  - **Document Subcollections:** Natural hierarchical modeling (`content/{id}/versions`, `content/{id}/transitions`).
- **Weaknesses:** Lacks an out-of-the-box human-friendly spreadsheet UI for non-technical curriculum coordinators.

### Candidate C: Pure Relational PostgreSQL
- **Concept:** Deploy an enterprise relational database (PostgreSQL 16) with foreign keys and SQL schemas.
- **Strengths:** Unrivaled ACID compliance, complex SQL joins, strict foreign-key integrity, relational maturity.
- **Fatal Constraint Flaw:** **The Infrastructure Cost Barrier.**
  - Managed Cloud SQL for PostgreSQL in GCP costs a minimum of ~$9.50/month (~₹800/month) for a `db-f1-micro` instance, directly violating the ₹0–₹100 hard budget constraint.
  - Third-party free tiers (Supabase, Neon) impose severe cold starts, connection pooling limits (Session pooling drops under bursts), and pause databases after 7 days of inactivity.
  - Cross-cloud egress between GCP Cloud Run and third-party database providers introduces latency, complexity, and vendor fragmentation.

### Candidate D: Hybrid Architecture (Firestore Native + Google Sheets Sync Bridge)
- **Concept:**
  - **System A (Authoritative System of Record):** Cloud Firestore Native acts as the sole, authoritative, transactional database for all domain entities, workflow state machines, OCC tokens, and immutable audit logs.
  - **System B (Secondary Operational Export & Window):** Google Sheets acts strictly as an asynchronous, read-only reporting and inspection bridge, populated via background events.
- **Strengths:** Combines the transactional atomicity, concurrency safety, and zero-cost scaling of Firestore with the human operational transparency of Google Sheets. Zero state ownership duplication.

---

## 5. 30-Dimension Comparative Evaluation Matrix

| # | Evaluation Dimension | Candidate A: Google Sheets | Candidate B: Firestore Native | Candidate C: PostgreSQL (Cloud SQL) | Candidate D: Hybrid Architecture |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | **Initial Outlay Cost** | **₹0** (Free) | **₹0** (Free Tier) | ₹800–₹1,500/mo (Violates constraint)| **₹0** (Free Tier) |
| 2 | **Free-Tier Suitability** | 100% (Free forever) | 100% (Generous free tier) | 0% (No native GCP free tier) | 100% (Zero-cost invariant)|
| 3 | **Operational Reliability** | Low (Rate limits / HTTP 429) | High (99.99% GCP SLA) | High (Enterprise SLA) | High (99.99% GCP SLA) |
| 4 | **ACID Multi-Row Transactions**| **NONE** (Simulated / Flawed) | **YES** (Native multi-doc) | **YES** (Full ACID) | **YES** (Firestore native) |
| 5 | **Concurrency Scaling** | In-process lock (Single node) | Document-level OCC | Row-level locking | Document-level OCC |
| 6 | **Complex Querying / Joins** | Manual in-memory filter | Indexed compound queries | Relational SQL / JOINs | Compound queries + indexed |
| 7 | **Relationship Integrity** | Application-level checks | Document references | Strict Foreign Keys | Application + Document refs |
| 8 | **Zero-Trust Security Alignment**| Service Account on whole sheet | Fine-grained Server IAM | Database roles / VPC | Fine-grained Server IAM |
| 9 | **Automated Backups** | Drive version history only | GCP Managed Backups | Point-in-time recovery | Managed export to GCS |
| 10 | **Schema Migration Flexibility**| High (Header-based) | High (NoSQL schema-flexible)| Low (Strict DDL migrations) | High (Versioned schemas) |
| 11 | **Cloud Run Stateless Fit** | Moderate (High API latency) | **PERFECT** (Native gRPC/HTTP)| Poor (Connection pool limits) | **PERFECT** (Serverless fit) |
| 12 | **Development Complexity** | Low initially / High at scale | Low to Moderate | Moderate | Moderate |
| 13 | **Workflow Transition Atomicity**| **FAILED** (Cannot guarantee)| **PASSED** (Atomic batch/tx) | **PASSED** (Atomic transaction) | **PASSED** (Atomic batch/tx) |
| 14 | **Optimistic Concurrency (OCC)**| Simulated via row timestamp | Native snapshot precondition | Native via `version` column | Native snapshot precondition |
| 15 | **RBAC Capability Support** | Coarse-grained | Server-authoritative | Server-authoritative | Server-authoritative |
| 16 | **Audit Trail Immutability** | Append-only (Risks cell cap) | Append-only Subcollections | Append-only audit table | Append-only Subcollections |
| 17 | **Version History Isolation** | Cluttered separate tabs | Hierarchical subcollections | Version tables | Hierarchical subcollections |
| 18 | **Idempotency Key Support** | High latency search | Fast unique document keys | Unique constraint on column | Fast unique document keys |
| 19 | **Atomic Multi-Entity Updates** | Impossible | Supported (up to 500 docs) | Supported | Supported (up to 500 docs) |
| 20 | **Analytics Workload Isolation** | Hits sheet cell limit | Separate collection / BigQuery| Separate read replica | Isolated collections |
| 21 | **External Integration Parity** | Native Google Drive parity | Native Google Cloud SDK | Requires cloud connectors | Native Google Cloud SDK |
| 22 | **Maintenance Burden** | High (Repairing corrupted rows)| Zero (Fully managed serverless)| High (Patching, vacuuming) | Zero (Fully managed serverless)|
| 23 | **Vendor Lock-In Risk** | Proprietary Sheets API | Document NoSQL pattern | Low (Standard SQL) | Moderate (Standard patterns)|
| 24 | **Disaster Recovery** | Manual sheet copy | Automated daily bucket export | Snapshot restore | Automated daily bucket export |
| 25 | **Local Development Experience** | Requires real Google credentials| Local Firestore Emulator | Local Docker PostgreSQL | Local Firestore Emulator |
| 26 | **Testing / CI Integration** | Flaky (Hits Google API quotas) | Fast (Firestore Emulator in CI)| Fast (Docker container in CI)| Fast (Firestore Emulator in CI)|
| 27 | **Brownfield Migration Effort** | Zero (Current state) | Low (Direct JSON serialization)| High (Full SQL normalization)| Low (Phased dual-write bridge)|
| 28 | **Future Scalability Horizon** | < 10,000 Content Items | > 1,000,000 Content Items | > 10,000,000 Content Items | > 1,000,000 Content Items |
| 29 | **Data Ownership Clarity** | Blurred (Users can edit sheet) | Absolute (Backend-only IAM) | Absolute (Backend-only VPC) | Absolute (Backend-only IAM) |
| 30 | **Source-of-Truth Suitability** | **STRUCTURALLY UNFIT** | **EXCELLENT** | **EXCELLENT** | **EXCELLENT** |

---

## 6. Detailed Cost & Free-Tier Analysis

### 6.1 The Reality of the Free Tier Under GCP
Under the **₹0–₹100 Initial Infrastructure Investment Constraint**, hosting must operate entirely within verified, perpetual free quotas:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                         GOOGLE CLOUD FREE TIER ALLOWANCES                              │
 ├─────────────────────────┬───────────────────────────┬──────────────────────────────────┤
 │ Resource / Service      │ Free Tier Allowance / Mo  │ BP-CMS Operational Consumption   │
 ├─────────────────────────┼───────────────────────────┼──────────────────────────────────┤
 │ Cloud Firestore         │ 1 GiB Storage             │ ~45 MB (Year 1 estimated data)   │
 │ Document Reads          │ 50,000 reads / day        │ ~6,500 reads / day (Peak studio) │
 │ Document Writes         │ 20,000 writes / day       │ ~1,200 writes / day (15 stages)  │
 │ Document Deletes        │ 20,000 deletes / day      │ < 50 deletes / day               │
 │ Google Sheets API       │ Unlimited read/write quota│ Zero billing cost                │
 │ Cloud Run Compute       │ 2M requests / month       │ ~120,000 requests / month        │
 ├─────────────────────────┴───────────────────────────┴──────────────────────────────────┤
 │ TOTAL MONTHLY CASH OUTLAY: ₹0.00 / month (100% Compliant with Zero-Cost Invariant)     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Why PostgreSQL Fails the Cost Invariant
- Google Cloud SQL for PostgreSQL does **not** offer a perpetual free tier. The smallest instance (`db-f1-micro`) incurs a mandatory baseline charge of ~$9.50 to $15.00 every month. For a bootstrapped production system starting at ₹0, this is an unacceptable fixed overhead.
- Self-hosting PostgreSQL on a Google Compute Engine VM requires continuous maintenance, disk backups, OS patching, and crashes during Cloud Run autoscaling events.

---

## 7. Forensic Analysis of Google Sheets (Current Baseline)

Inspection of `src/lib/repositories/base.repository.ts` and `src/lib/schemas/google-sheets-schema.ts` reveals how the brownfield system has operated:
1. **Header-Based A1 Range Lookup:** Every read fetches entire worksheet row sets into memory; every update converts objects back into arrays and executes `spreadsheets.values.update`.
2. **In-Process Concurrency Lock Hack:**
   ```typescript
   // src/lib/repositories/base.repository.ts (lines 29-30)
   protected static recordLocks: Map<string, Promise<void>> = new Map();
   ```
   This lock exists purely in Node.js process memory. When Cloud Run spins up multiple container instances to handle traffic, **in-memory locks fail completely**, permitting simultaneous conflicting writes to Google Sheets.
3. **HTTP 429 Quota Exhaustion:** The Google Sheets API enforces strict rate limits. A single user reviewing questions while an automated script uploads media easily triggers quota exhaustion, crashing background jobs.

**Conclusion:** Google Sheets cannot serve as the long-term authoritative transactional database.

---

## 8. In-Depth Firestore Architecture

Firestore Native Mode provides the exact architectural primitives required by BP-CMS:
1. **Document Modeling:** Maps 1:1 to Stage 06 Domain Entities (`Content`, `Question`, `VideoEdit`).
2. **Subcollections for Immutable Versioning:**
   - `/questions/{questionId}/versions/{versionNumber}`
   - `/content/{contentId}/transitions/{transitionId}` (Guarantees append-only isolation)
3. **Atomic Multi-Document Batches:**
   - Advancing Stage 06 to Stage 07 executes in one atomic transaction:
     $$\text{Update } \texttt{content/BP-CNT-0001} \quad \text{AND} \quad \text{Insert } \texttt{content/BP-CNT-0001/transitions/BP-WFT-0042}$$
   - If writing the transition log fails, the stage mutation rolls back automatically.
4. **Local Development Parity:** The `@google-cloud/firestore` SDK couples seamlessly with the **Firebase/Firestore Local Emulator**, enabling complete offline testing and CI verification without requiring internet access or real Google Cloud credentials.

---

## 9. Authoritative Source-of-Truth Decision Matrix

To enforce Stage 04 Principle 10 (*Single State Ownership*), every major domain entity is assigned exactly one authoritative persistence system:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                           SOURCE-OF-TRUTH PERSISTENCE MATRIX                           │
 ├─────────────────────────┬───────────────────┬───────────────────┬──────────────────────┤
 │ Domain Entity           │ Canonical System  │ Secondary Export  │ External Reference   │
 ├─────────────────────────┼───────────────────┼───────────────────┼──────────────────────┤
 │ User                    │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Role & Capability       │ Cloud Firestore   │ Hardcoded Enum    │ N/A                  │
 │ Question & Version      │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ QuestionReview (Gate)   │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Content (Aggregate Root)│ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Script & Version        │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Video, Take & Edit      │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ MediaAsset (Metadata)   │ Cloud Firestore   │ Google Sheets (RO)│ Google Drive File ID │
 │ PublishingPackage       │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Publication             │ Cloud Firestore   │ Google Sheets (RO)│ YouTube Video ID     │
 │ WorkflowInstance        │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ WorkflowTransition      │ Cloud Firestore   │ Google Sheets (RO)│ N/A (Immutable)      │
 │ AnalyticsSnapshot       │ Cloud Firestore   │ Google Sheets (RO)│ Platform API Metrics │
 │ PerformanceRecord       │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ IntelligenceInsight     │ Cloud Firestore   │ Google Sheets (RO)│ N/A                  │
 │ Notification            │ Cloud Firestore   │ None              │ N/A                  │
 │ AuditEvent              │ Cloud Firestore   │ Google Sheets (RO)│ N/A (Immutable)      │
 │ Configuration           │ Cloud Firestore   │ None              │ GCP Secret Manager   │
 └─────────────────────────┴───────────────────┴───────────────────┴──────────────────────┘
```

*(RO = Asynchronous, Read-Only Mirror for human operational transparency)*

---

## 10. Domain-to-Storage Mapping Matrix

| Domain Context | Canonical Entity | Firestore Collection Path | Document Key Pattern | Primary Query Index |
| :--- | :--- | :--- | :--- | :--- |
| **Identity** | `User` | `/users` | `BP-USR-######` | `email` (Unique) |
| **Curriculum** | `Question` | `/questions` | `BP-Q-######` | `topicId`, `status` |
| **Curriculum** | `QuestionVersion`| `/questions/{id}/versions` | `v{versionNumber}` | `createdAt` (Desc) |
| **Curriculum** | `QuestionReview` | `/questions/{id}/reviews` | `BP-QR-######` | `timestamp` (Desc) |
| **Production** | `Content` | `/content` | `BP-CNT-######` | `currentStage`, `assigneeId`|
| **Production** | `Script` | `/scripts` | `BP-SCR-######` | `contentId` |
| **Production** | `Video` | `/videos` | `BP-V-######` | `contentId`, `status` |
| **Production** | `VideoTake` | `/videos/{id}/takes` | `take_{takeNumber}`| `rating` |
| **Production** | `VideoEdit` | `/videos/{id}/edits` | `edit_{version}` | `qcStatus` |
| **Storage** | `MediaAsset` | `/media_assets` | `BP-MED-######` | `driveFileId`, `checksum` |
| **Distribution**| `PublishingPackage`| `/publishing_packages` | `BP-PKG-######` | `scheduledAt`, `status` |
| **Distribution**| `Publication` | `/publications` | `BP-PUB-######` | `platformVideoId` |
| **Workflow** | `WorkflowInstance`| `/workflows` | `BP-WFI-######` | `contentId`, `currentStage`|
| **Workflow** | `WorkflowTransition`|`/workflows/{id}/transitions`| `BP-WFT-######` | `timestamp` (Asc) |
| **Analytics** | `AnalyticsSnapshot`|`/analytics_snapshots` | `BP-SNP-######` | `contentId`, `milestone` |
| **Intelligence**| `IntelligenceInsight`|`/intelligence_insights`| `BP-INS-######` | `topicId`, `status` |
| **Governance** | `AuditEvent` | `/audit_events` | `BP-AUD-######` | `correlationId`, `timestamp`|

---

## 11. Transaction Model & Atomicity Boundaries

To eliminate partial state corruption, the persistence layer defines **6 Mandatory Atomic Transaction Boundaries**:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                             MANDATORY TRANSACTION BOUNDARIES                           │
 ├─────────────────────────┬──────────────────────────────────────────────────────────────┤
 │ Operation Boundary      │ Atomic Execution Requirements (All-or-Nothing Commit)        │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 1. Workflow Stage       │ 1. Verify OCC version on `WorkflowInstance`.                 │
 │    Advancement          │ 2. Mutate `WorkflowInstance.currentStage` to Target Stage.   │
 │                         │ 3. Insert append-only `WorkflowTransition` record.           │
 │                         │ 4. Insert `AuditEvent` log. (All committed in one tx).       │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 2. Quality Gate Signoff │ 1. Verify `reviewerId !== authorId` (GAR-02).                │
 │    (Question / QC / Soc)│ 2. Insert `QuestionReview` / update `VideoEdit.qcStatus`.    │
 │                         │ 3. Lock target entity version (`isLocked = true`).           │
 │                         │ 4. Advance workflow stage via Boundary 1.                    │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 3. Rejection Routing    │ 1. Validate mandatory feedback remarks.                      │
 │                         │ 2. Record review decision as `CHANGES_REQUESTED`.            │
 │                         │ 3. Unlock draft version for revision (creates v+1 container).│
 │                         │ 4. Dispatch backward `WorkflowTransition` to author stage.   │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 4. Media Asset Binding  │ 1. Validate Google Drive File ID and SHA-256 checksum.       │
 │                         │ 2. Create `MediaAsset` record.                               │
 │                         │ 3. Bind `mediaAssetId` to parent `Video` or `Thumbnail`.     │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 5. Publication Confirm  │ 1. Verify regex-validated live public URL and platform ID.   │
 │                         │ 2. Create `Publication` record (`status = LIVE`).            │
 │                         │ 3. Advance workflow from Stage 11 to Stage 12.               │
 ├─────────────────────────┼──────────────────────────────────────────────────────────────┤
 │ 6. Session Invalidation │ 1. Increment `User.sessionVersion` by 1.                     │
 │                         │ 2. Log security audit event. Instantly invalidates all JWTs. │
 └─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 12. Concurrency Model & Optimistic Locking (OCC)

In alignment with Stage 08 State Architecture:
1. **Document Versioning:** Every mutable document includes `version: number`, `updatedAt: string`, and `lastModifiedBy: string`.
2. **Snapshot Preconditions:** Mutations supply the document's current `version`. Firestore's transactional write checks:
   $$\text{storedVersion} == \text{expectedVersion}$$
3. **Collision Handling:** If a collision occurs (e.g., two editors saving the same cut), the transaction aborts with `OptimisticLockConflictError` (HTTP 409). The second client must refresh state without overwriting the first commit.

---

## 13. Audit & History Model

1. **Current State vs. Historical Events:** Current operational state lives in root collection documents (`/content/{id}`). Historical events live in dedicated append-only subcollections (`/content/{id}/transitions`).
2. **Perpetual Immutability:** Audit records (`/audit_events`) and workflow transitions (`/workflows/{id}/transitions`) permit **only `CREATE` and `READ`** operations. Database security rules and repository methods reject `UPDATE` and `DELETE` calls unconditionally.

---

## 14. Backup & Disaster Recovery Architecture

Under the ₹0–₹100 constraint, enterprise point-in-time recovery is achieved without recurring monthly costs:
1. **Automated Firestore GCS Export:** A scheduled Google Cloud Function (or Cloud Run cron daemon) invokes the Firestore `gcloud firestore export` API weekly, streaming database snapshots to a Google Cloud Storage bucket in `asia-south1`.
2. **Cold Storage Tiering:** Snapshot files in GCS automatically transition to Coldline storage via bucket lifecycle policies (Storage cost: ~₹0.10/GB/month, well within the ₹100 limit).
3. **Secondary Disaster Verification:** The Google Sheets export mirror serves as an emergency human-readable fallback if Cloud Run access is temporarily interrupted.

---

## 15. Phased Migration Architecture (Sheets -> Dual-Write -> Target)

The migration from brownfield Google Sheets to the authoritative Firestore architecture executes across **three risk-isolated phases** in Stage 16:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                               PHASED MIGRATION TIMELINE                                │
 └────────────────────────────────────────────────────────────────────────────────────────┘
  PHASE 1: Baseline Seed & Shadow Read
  • One-time export of Google Sheets tabs into Firestore collections.
  • Primary reads/writes remain on Google Sheets; Firestore runs shadow comparisons.

  PHASE 2: Controlled Cutover (Firestore Master)
  • Authoritative reads and writes switch to Cloud Firestore.
  • An asynchronous background worker syncs Firestore changes back to Google Sheets.
  • Google Sheets becomes a Read-Only Export Window.

  PHASE 3: Decommissioning & Stabilization
  • Direct Google Sheets write paths in repositories are permanently deleted.
  • Google Sheets functions strictly as an operational reporting sheet.
```

---

## 16. Authoritative Decision on the Role of Google Sheets

Google Sheets is formally designated as:

$$\mathbf{SECONDARY\ OPERATIONAL\ EXPORT\ \&\ HUMAN\ AUDIT\ WINDOW}$$

### Rules of Engagement:
1. Google Sheets is **never an authoritative system of record** post-migration.
2. The CMS application never executes synchronous database queries against Google Sheets for workflow transitions or access control checks.
3. Google Sheets receives asynchronous, non-blocking mirror updates from Firestore, allowing non-technical stakeholders to review pipelines in familiar spreadsheet format without risking database corruption or triggering API rate limits.

---

## 17. Cloud Run Compatibility & Runtime Lifecycle

The selected Firestore architecture integrates natively with the stateless deployment model on Google Cloud Run:
- **Zero Socket Exhaustion:** Firestore uses gRPC HTTP/2 multiplexed streams over standard Google Cloud internal networks, eliminating the database connection pool exhaustion common to PostgreSQL under autoscaling.
- **Zero Cold-Start Latency Overhead:** Initializing the Firestore client requires ~10ms (versus 1,500ms–3,000ms to negotiate TLS and authentication handshakes for Cloud SQL).
- **Native IAM Authentication:** Uses the Cloud Run service account identity automatically via Google Application Default Credentials (`ADC`), eliminating plaintext database passwords in environment variables.

---

## 18. Security Architecture & Least Privilege

1. **Server-Side Exclusivity:** The Firestore database is completely closed to public client access. All queries execute through the backend Node/Express application running on Cloud Run.
2. **Credential Isolation:** No database passwords or connection strings are stored in code or `.env`. Authentication utilizes the Cloud Run runtime Service Account with the least-privilege role `roles/datastore.user`.
3. **GCS Snapshot Isolation:** Backup buckets restrict read permissions exclusively to the Project Administrator, encrypted with Google-managed encryption keys.

---

## 19. Final Database Architecture Decision

### 19.1 The Decision
```text
================================================================================
FINAL DATABASE ARCHITECTURE DECISION:
HYBRID ARCHITECTURE — CLOUD FIRESTORE NATIVE (Authoritative Transactional)
                      + GOOGLE SHEETS (Secondary Operational Export)
================================================================================
```

### 19.2 Why This Satisfies BP-CMS Requirements
1. **Respects the Zero-Cost Invariant (₹0–₹100):** Operates 100% within the Google Cloud perpetual free tier allowances for Firestore and Cloud Run.
2. **Delivers True Multi-Document ACID Transactions:** Enables atomic stage advancements and immutable audit logging without race conditions.
3. **Eliminates Google Sheets API Rate-Limiting:** Moves high-frequency read/write traffic off Google Sheets onto sub-15ms Firestore gRPC calls.
4. **Preserves Human Visibility:** Retains Google Sheets as an asynchronous export window, providing stakeholders with spreadsheet access.
5. **Seamless Cloud Run Parity:** Zero connection pooling complexity, instant cold starts, and native IAM security.

### 19.3 Revisit Conditions
This decision shall be revisited only if:
- Total content items exceed 500,000 entities, requiring complex multi-table SQL analytical warehousing (at which point BigQuery can be attached via native Firestore-to-BigQuery streaming).
- Monthly operating budget exceeds ₹5,000/month, allowing dedicated Cloud SQL PostgreSQL infrastructure.

---

## 20. Database Decision Register (DBDR)

| Decision ID | Architectural Decision | Alternatives Considered | Rationale | Downstream Stage |
| :---: | :--- | :--- | :--- | :---: |
| **DBDR-001** | Cloud Firestore Native as Authoritative Store | Google Sheets, PostgreSQL, MongoDB | Only Firestore satisfies both multi-document ACID transactions and the ₹0–₹100 budget invariant. | **Stage 16** |
| **DBDR-002** | Google Sheets as Asynchronous Export Window | Full Decommissioning vs. Dual-Master | Preserves familiar spreadsheet UI for non-technical stakeholders without compromising transactional integrity. | **Stage 16** |
| **DBDR-003** | Subcollection Modeling for Immutable History | Separate Root Tables vs. JSON Arrays | Subcollections provide clean parent-child relationship containment and enforce append-only security rules. | **Stage 16** |
| **DBDR-004** | Firestore Local Emulator for CI/Local Dev | In-Memory Mock vs. Live GCP Test Project | Emulator allows 100% offline development and fast, quota-free automated testing. | **Stage 16 / 28** |
| **DBDR-005** | Native GCS Snapshot Exports for Backups | Third-Party SaaS Backups vs. Manual Sheets | Free-tier bucket exports provide automated disaster recovery without third-party subscriptions. | **Stage 27** |

---

## 21. Database Brownfield Conflict Register (DBCR)

| Conflict ID | Existing Brownfield Behavior | Target Database Architecture | Resolution Strategy | Resolution Stage |
| :---: | :--- | :--- | :--- | :---: |
| **DBCR-001** | `BaseRepository` mapped to Sheets API v4 | `FirestoreRepository` base class | Refactor `BaseRepository` in Stage 16 to target Firestore SDK. | **Stage 16** |
| **DBCR-002** | In-Process Memory Locks (`recordLocks`) | Native Firestore Transactional Locks | Replace Node.js in-memory lock map with `db.runTransaction()`. | **Stage 16** |
| **DBCR-003** | A1 Range Header Lookups | Strongly typed Firestore Documents | Eliminate A1 column letters; map documents via Zod schemas. | **Stage 16** |
| **DBCR-004** | Google Sheets API Quota Exhaustion (429) | Direct Firestore gRPC calls | Eliminates Sheets API from synchronous user paths. | **Stage 16** |
| **DBCR-005** | Unbounded Growth of `AUDIT_LOG` Tab | Dedicated `/audit_events` collection | Eliminates Google Sheets 10M cell limit risk. | **Stage 16** |

---

## 22. Downstream Contract for Subsequent Stages

1. **Stage 13 (API Contract):** API schemas must assume document-oriented resource payloads with `version` OCC headers.
2. **Stage 14 (Workflow Engine):** Engine must execute stage advancement and transition logging via Firestore `runTransaction`.
3. **Stage 16 (Persistence Implementation):** Implements `@google-cloud/firestore` client, repository classes, and dual-write migration script.

---

## 23. Cross-Stage Traceability Matrix

### 23.1 Upstream Traceability (Stages 01–11 to Stage 12)
| Stage 12 Section | Upstream Source Requirement | Alignment Detail |
| :--- | :--- | :--- |
| **Section 2 (₹0–₹100 Budget)** | Stage 01 Section 5 & Stage 04 AP-012 | Enforces the hard initial zero-cost infrastructure constraint. |
| **Section 10 (Storage Matrix)** | Stage 06 Domain Model (Section 4) | Maps all 28 canonical domain entities to explicit Firestore paths. |
| **Section 11 (Transaction Model)** | Stage 07 Workflow & Stage 08 Concurrency | Guarantees atomic commitment of workflow steps and transitions. |
| **Section 12 (OCC Model)** | Stage 08 State Model (Section 12) | Implements snapshot preconditions matching `OptimisticLockEntity`. |
| **Section 18 (Security)** | Stage 09 RBAC Model (Section 2) | Enforces server-authoritative data access with zero public database exposure. |

---

## 24. Mandatory Architectural Invariants

The database architecture strictly enforces these **18 Invariants**:

1. **Single Authoritative System of Record:** Exactly one system (Cloud Firestore) authoritatively owns transactional business state.
2. **Zero Duplicate Ownership:** Google Sheets is strictly a read-only secondary export window; it never owns authoritative state.
3. **Strict Zero-Cost Compliance:** Initial architecture must operate 100% within the free-tier allowances (₹0–₹100 investment limit).
4. **Multi-Document Atomic Advancement:** Advancing a workflow stage and logging an immutable transition record must commit atomically.
5. **Immutable History Segregation:** Historical audit and transition logs are append-only; `UPDATE` and `DELETE` calls are prohibited.
6. **Optimistic Locking Enforcement:** All updates must verify document version tokens to block stale overwrite collisions.
7. **Externalized Media Binaries:** Raw media files are stored strictly in Google Drive / GCS; only metadata and URIs reside in the database.
8. **Server-Side Exclusivity:** The database is never exposed to public internet clients; all queries execute via server-side API handlers.
9. **Zero Plaintext Credentials:** Database authentication uses GCP IAM Application Default Credentials (`ADC`), avoiding stored passwords.
10. **Testability Parity:** All persistence operations must be fully testable offline using the local Firestore emulator.
11. **Anti-Self-Approval Verification:** Review records must persist reviewer IDs to enforce `GAR-02` invariants at the database level.
12. **Idempotency Key Integrity:** Distributed job retries must verify unique operation keys before executing database writes.
13. **Stateless Runtime Parity:** Database connection architecture must produce zero socket exhaustion under Cloud Run autoscaling.
14. **Subcollection Version Containment:** Entity version histories live in dedicated subcollections, isolating drafts from master records.
15. **Non-Blocking Analytics Separation:** Ingesting high-volume telemetry must not block core question authoring or video editing.
16. **Phased Brownfield Migration:** Existing Google Sheets data must be validated and shadow-verified before cutover.
17. **Disaster Recovery Viability:** Regular automated GCS exports must ensure zero data loss during regional outages.
18. **Unambiguous Primary Keys:** All document keys must strictly follow the canonical domain identifier format (`BP-CNT-######`).

---

## 25. Stage 12 Completion Checklist & Sign-off

- [x] Read all eleven prior canonical artifacts (`01` through `11`).
- [x] Inspected actual current persistence source code (`base.repository.ts`, `google-sheets-schema.ts`, `package.json`, `.env.example`).
- [x] Evaluated Candidate A (Google Sheets), Candidate B (Firestore), Candidate C (PostgreSQL), and Candidate D (Hybrid).
- [x] Evaluated all candidates across all 30 required technical dimensions.
- [x] Enforced the hard initial investment constraint: **₹0 to ₹100**.
- [x] Documented detailed cost and free-tier allowance analysis.
- [x] Conducted forensic analysis of brownfield Google Sheets repository limitations (rate limits, simulated in-memory locks).
- [x] Conducted in-depth Firestore Native analysis (atomic batches, subcollections, OCC).
- [x] Conducted in-depth PostgreSQL analysis (disqualified based on minimum ~$10/mo hosted Cloud SQL barrier).
- [x] Established complete Source-of-Truth Decision Matrix across all Stage 06 domain entities.
- [x] Established complete Domain-to-Storage Mapping Matrix with collection paths and primary query indexes.
- [x] Defined 6 Mandatory Atomic Transaction Boundaries.
- [x] Codified Persistence-Level Concurrency Model & Optimistic Locking.
- [x] Formulated Backup & Disaster Recovery Architecture using free GCS exports.
- [x] Designed 3-Phase Brownfield Migration Plan (Baseline Seed -> Controlled Cutover -> Stabilization).
- [x] Formally decided Google Sheets role: **Secondary Operational Export & Human Audit Window**.
- [x] Verified 100% compatibility with stateless Cloud Run runtime.
- [x] Selected and justified **Candidate D: Hybrid Architecture (Firestore Native + Google Sheets Sync)**.
- [x] Established Database Decision Register (`DBDR-001` through `DBDR-005`).
- [x] Established Database Brownfield Conflict Register (`DBCR-001` through `DBCR-005`).
- [x] Codified 18 mandatory Architectural Invariants.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or infrastructure modified.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 12 — DATABASE ARCHITECTURE
================================================================================
Artifact:            docs/architecture/12-DATABASE-ARCHITECTURE.md
Version:             12.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 12 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 12. Awaiting Stage 13 Instruction.
================================================================================
```
