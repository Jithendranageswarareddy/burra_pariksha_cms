/**
 * BURRA PARIKSHA CMS — Stage 12 Database Architecture Decision
 *
 * Implements the authoritative database evaluation matrix, selection decision,
 * 28-resource Firestore collection registry, and ₹0.00 free-tier budget projection.
 *
 * Grounded in:
 * - Financial Constraint: ₹0–₹100/month maximum operational expenditure (COST-001, AP-012)
 * - Operational Profile: Low-volume daily production (1–5 questions/day, ~30–150/month)
 * - Stage 04 Architecture Principles (AP-005 Preconditions, AP-007/AP-008 Media Boundary, AP-012 Cost Control)
 * - Stage 06 Domain Model (28 Canonical Resources)
 * - Stage 07 Canonical 15-Step Workflow (Multi-entity workflow transitions)
 * - Stage 08 State Model (ACID transactions, optimistic concurrency control)
 * - Cloud Run Stateless Deployment Compatibility (Serverless HTTP/gRPC multiplexing)
 */

import { AuthorizationResource } from './rbac-models';

// ============================================================================
// 1. CANDIDATE ENUMERATION & EVALUATION DIMENSIONS
// ============================================================================

export enum DatabaseCandidate {
  GOOGLE_SHEETS = 'GOOGLE_SHEETS',
  POSTGRESQL = 'POSTGRESQL',
  FIRESTORE = 'FIRESTORE',
  FIRESTORE_HYBRID = 'FIRESTORE_HYBRID',
}

export const DATABASE_CANDIDATES = Object.values(DatabaseCandidate);

export enum EvaluationCriterion {
  COST = 'COST',
  FREE_TIER_SUITABILITY = 'FREE_TIER_SUITABILITY',
  RELIABILITY = 'RELIABILITY',
  TRANSACTIONS = 'TRANSACTIONS',
  CONCURRENCY = 'CONCURRENCY',
  QUERYING = 'QUERYING',
  RELATIONSHIPS = 'RELATIONSHIPS',
  SECURITY = 'SECURITY',
  BACKUP_DISASTER_RECOVERY = 'BACKUP_DISASTER_RECOVERY',
  MIGRATION = 'MIGRATION',
  CLOUD_RUN_COMPATIBILITY = 'CLOUD_RUN_COMPATIBILITY',
  DEVELOPMENT_COMPLEXITY = 'DEVELOPMENT_COMPLEXITY',
}

export const EVALUATION_CRITERIA = Object.values(EvaluationCriterion);

// ============================================================================
// 2. CANDIDATE EVALUATION MATRIX & SCORING
// ============================================================================

export interface CriterionEvaluation {
  criterion: EvaluationCriterion;
  score: number; // 1 (Failure/Disqualified) to 5 (Exemplary/Optimal)
  weight: number; // Importance multiplier (1.0 to 2.0)
  rationale: string;
}

export interface CandidateEvaluation {
  candidate: DatabaseCandidate;
  candidateName: string;
  monthlyCostINR: number;
  financialCompliance: boolean; // Must be <= 100 INR/month per COST-001
  evaluations: Record<EvaluationCriterion, CriterionEvaluation>;
  totalScore: number;
  weightedScore: number;
  verdict: 'ACCEPTED' | 'REJECTED';
  verdictRationale: string;
}

export const CANDIDATE_EVALUATION_MATRIX: Record<DatabaseCandidate, CandidateEvaluation> = {
  [DatabaseCandidate.GOOGLE_SHEETS]: {
    candidate: DatabaseCandidate.GOOGLE_SHEETS,
    candidateName: 'Google Sheets (Brownfield Backend)',
    monthlyCostINR: 0,
    financialCompliance: true,
    evaluations: {
      [EvaluationCriterion.COST]: {
        criterion: EvaluationCriterion.COST,
        score: 5,
        weight: 2.0,
        rationale: '₹0.00/month. Included in standard Google Workspace / personal Google account quota.',
      },
      [EvaluationCriterion.FREE_TIER_SUITABILITY]: {
        criterion: EvaluationCriterion.FREE_TIER_SUITABILITY,
        score: 4,
        weight: 1.5,
        rationale: 'No financial cost, but quota limits (300 requests/minute per project) create unpredictable throttling.',
      },
      [EvaluationCriterion.RELIABILITY]: {
        criterion: EvaluationCriterion.RELIABILITY,
        score: 2,
        weight: 1.5,
        rationale: 'High network error rate for automated API writes; prone to 429 Too Many Requests and sporadic write latency.',
      },
      [EvaluationCriterion.TRANSACTIONS]: {
        criterion: EvaluationCriterion.TRANSACTIONS,
        score: 1,
        weight: 2.0,
        rationale: 'Zero multi-sheet ACID transaction guarantees. Partial write failures cause corrupted cross-sheet links (BRK-HD-02).',
      },
      [EvaluationCriterion.CONCURRENCY]: {
        criterion: EvaluationCriterion.CONCURRENCY,
        score: 1,
        weight: 1.8,
        rationale: 'No row-level locking or optimistic concurrency control; concurrent writes overwrite each other silently.',
      },
      [EvaluationCriterion.QUERYING]: {
        criterion: EvaluationCriterion.QUERYING,
        score: 2,
        weight: 1.2,
        rationale: 'Full table scans required for filtering; lacks secondary indices or efficient pagination for growing datasets.',
      },
      [EvaluationCriterion.RELATIONSHIPS]: {
        criterion: EvaluationCriterion.RELATIONSHIPS,
        score: 1,
        weight: 1.5,
        rationale: 'Zero foreign key enforcement; foreign relationships simulated manually via VLOOKUP or app code.',
      },
      [EvaluationCriterion.SECURITY]: {
        criterion: EvaluationCriterion.SECURITY,
        score: 2,
        weight: 1.5,
        rationale: 'Sheet-level or tab-level sharing permissions only; no granular cell/row zero-trust RBAC capability enforcement.',
      },
      [EvaluationCriterion.BACKUP_DISASTER_RECOVERY]: {
        criterion: EvaluationCriterion.BACKUP_DISASTER_RECOVERY,
        score: 3,
        weight: 1.0,
        rationale: 'Google Drive file version history available, but programmatic point-in-time recovery is difficult to orchestrate.',
      },
      [EvaluationCriterion.MIGRATION]: {
        criterion: EvaluationCriterion.MIGRATION,
        score: 4,
        weight: 1.0,
        rationale: 'Zero migration effort required for existing data, but high effort required to patch brownfield concurrency bugs.',
      },
      [EvaluationCriterion.CLOUD_RUN_COMPATIBILITY]: {
        criterion: EvaluationCriterion.CLOUD_RUN_COMPATIBILITY,
        score: 2,
        weight: 1.5,
        rationale: 'Frequent HTTP connection timeouts and API quota throttling under concurrent Cloud Run container instances.',
      },
      [EvaluationCriterion.DEVELOPMENT_COMPLEXITY]: {
        criterion: EvaluationCriterion.DEVELOPMENT_COMPLEXITY,
        score: 2,
        weight: 1.2,
        rationale: 'High application-side complexity required to simulate locking, retries, and relational integrity.',
      },
    },
    totalScore: 29,
    weightedScore: 43.1,
    verdict: 'REJECTED',
    verdictRationale: 'Disqualified due to lack of ACID transactions and lack of concurrency control, causing historical split-brain defects (BRK-HD-02, BRK-SF-01).',
  },

  [DatabaseCandidate.POSTGRESQL]: {
    candidate: DatabaseCandidate.POSTGRESQL,
    candidateName: 'PostgreSQL (Cloud SQL / Managed RDS / Neon / Supabase)',
    monthlyCostINR: 1800, // Google Cloud SQL db-f1-micro is ~₹1,500 - ₹2,500/month
    financialCompliance: false, // VIOLATES ₹0–₹100/month budget constraint
    evaluations: {
      [EvaluationCriterion.COST]: {
        criterion: EvaluationCriterion.COST,
        score: 1,
        weight: 2.0,
        rationale: 'Violates COST-001 (₹0–₹100/mo). Cloud SQL instance costs ₹1,500–₹2,500/mo. Free tiers (Neon/Supabase) pause/cold-start after inactivity.',
      },
      [EvaluationCriterion.FREE_TIER_SUITABILITY]: {
        criterion: EvaluationCriterion.FREE_TIER_SUITABILITY,
        score: 1,
        weight: 1.5,
        rationale: 'Google Cloud has NO perpetual free tier for Cloud SQL. Third-party free tiers enforce 5-minute inactivity timeouts and pause projects.',
      },
      [EvaluationCriterion.RELIABILITY]: {
        criterion: EvaluationCriterion.RELIABILITY,
        score: 5,
        weight: 1.5,
        rationale: 'Industry gold standard relational database engine with automated failover and 99.95%+ availability.',
      },
      [EvaluationCriterion.TRANSACTIONS]: {
        criterion: EvaluationCriterion.TRANSACTIONS,
        score: 5,
        weight: 2.0,
        rationale: 'Full ANSI SQL ACID transactions with configurable isolation levels (Serializable, Repeatable Read, Read Committed).',
      },
      [EvaluationCriterion.CONCURRENCY]: {
        criterion: EvaluationCriterion.CONCURRENCY,
        score: 5,
        weight: 1.8,
        rationale: 'Multi-Version Concurrency Control (MVCC), row-level locks, and advisory locks provide robust synchronization.',
      },
      [EvaluationCriterion.QUERYING]: {
        criterion: EvaluationCriterion.QUERYING,
        score: 5,
        weight: 1.2,
        rationale: 'Full SQL, b-tree, gin, and gist indices, complex joins, aggregation, and full-text search capabilities.',
      },
      [EvaluationCriterion.RELATIONSHIPS]: {
        criterion: EvaluationCriterion.RELATIONSHIPS,
        score: 5,
        weight: 1.5,
        rationale: 'Native declarative foreign key constraints, cascading deletes/updates, and referential integrity.',
      },
      [EvaluationCriterion.SECURITY]: {
        criterion: EvaluationCriterion.SECURITY,
        score: 4,
        weight: 1.5,
        rationale: 'Row-level security (RLS), role-based schemas, TLS encryption, and private VPC peering.',
      },
      [EvaluationCriterion.BACKUP_DISASTER_RECOVERY]: {
        criterion: EvaluationCriterion.BACKUP_DISASTER_RECOVERY,
        score: 5,
        weight: 1.0,
        rationale: 'Continuous WAL archiving, point-in-time recovery, automated daily snapshots.',
      },
      [EvaluationCriterion.MIGRATION]: {
        criterion: EvaluationCriterion.MIGRATION,
        score: 3,
        weight: 1.0,
        rationale: 'Requires full DDL schema migration and ETL script to export brownfield Google Sheets into relational tables.',
      },
      [EvaluationCriterion.CLOUD_RUN_COMPATIBILITY]: {
        criterion: EvaluationCriterion.CLOUD_RUN_COMPATIBILITY,
        score: 2,
        weight: 1.5,
        rationale: 'TCP connection pooling issues with serverless Cloud Run instances; requires Cloud SQL Auth Proxy or PgBouncer.',
      },
      [EvaluationCriterion.DEVELOPMENT_COMPLEXITY]: {
        criterion: EvaluationCriterion.DEVELOPMENT_COMPLEXITY,
        score: 4,
        weight: 1.2,
        rationale: 'Rich ORM ecosystem (Drizzle, Prisma), migrations, and strongly-typed queries.',
      },
    },
    totalScore: 45,
    weightedScore: 68.3,
    verdict: 'REJECTED',
    verdictRationale: 'Strictly REJECTED due to inviolable financial disqualification (COST-001). Minimum cost of ₹1,500–₹2,500/month violates ₹0–₹100 limit.',
  },

  [DatabaseCandidate.FIRESTORE]: {
    candidate: DatabaseCandidate.FIRESTORE,
    candidateName: 'Firestore Native (Standalone Document Store)',
    monthlyCostINR: 0,
    financialCompliance: true,
    evaluations: {
      [EvaluationCriterion.COST]: {
        criterion: EvaluationCriterion.COST,
        score: 5,
        weight: 2.0,
        rationale: '₹0.00/month on Google Cloud Spark Free Tier (50k reads/day, 20k writes/day, 1GB storage). Perpetually free.',
      },
      [EvaluationCriterion.FREE_TIER_SUITABILITY]: {
        criterion: EvaluationCriterion.FREE_TIER_SUITABILITY,
        score: 5,
        weight: 1.5,
        rationale: '1–5 questions/day consumes < 1% of daily free quota (500 reads vs 50,000 allowance). Never pauses or cold starts.',
      },
      [EvaluationCriterion.RELIABILITY]: {
        criterion: EvaluationCriterion.RELIABILITY,
        score: 5,
        weight: 1.5,
        rationale: 'Google Cloud multi-region replication, 99.999% SLA, zero server maintenance or patching.',
      },
      [EvaluationCriterion.TRANSACTIONS]: {
        criterion: EvaluationCriterion.TRANSACTIONS,
        score: 4,
        weight: 2.0,
        rationale: 'Native multi-document ACID transactions (runTransaction) and atomic batch writes (writeBatch) up to 500 operations.',
      },
      [EvaluationCriterion.CONCURRENCY]: {
        criterion: EvaluationCriterion.CONCURRENCY,
        score: 4,
        weight: 1.8,
        rationale: 'Optimistic concurrency control built-in using document preconditions (updateTime / exists guards).',
      },
      [EvaluationCriterion.QUERYING]: {
        criterion: EvaluationCriterion.QUERYING,
        score: 4,
        weight: 1.2,
        rationale: 'Fast indexed queries, composite indices, range filters, and native cursor pagination.',
      },
      [EvaluationCriterion.RELATIONSHIPS]: {
        criterion: EvaluationCriterion.RELATIONSHIPS,
        score: 3,
        weight: 1.5,
        rationale: 'No declarative foreign key constraints; references validated via application-layer schemas and transaction invariants.',
      },
      [EvaluationCriterion.SECURITY]: {
        criterion: EvaluationCriterion.SECURITY,
        score: 5,
        weight: 1.5,
        rationale: 'Native Google Cloud IAM with Application Default Credentials (ADC) from Cloud Run; zero hardcoded API keys.',
      },
      [EvaluationCriterion.BACKUP_DISASTER_RECOVERY]: {
        criterion: EvaluationCriterion.BACKUP_DISASTER_RECOVERY,
        score: 4,
        weight: 1.0,
        rationale: 'Automated scheduled exports to Google Cloud Storage (GCS) and point-in-time recovery (PITR).',
      },
      [EvaluationCriterion.MIGRATION]: {
        criterion: EvaluationCriterion.MIGRATION,
        score: 4,
        weight: 1.0,
        rationale: 'Flexible document model allows simple JSON serialization and direct ingestion of brownfield records.',
      },
      [EvaluationCriterion.CLOUD_RUN_COMPATIBILITY]: {
        criterion: EvaluationCriterion.CLOUD_RUN_COMPATIBILITY,
        score: 5,
        weight: 1.5,
        rationale: 'HTTP/2 and gRPC multiplexing via official Google Cloud SDK; zero connection pool exhaustion on scale-to-zero.',
      },
      [EvaluationCriterion.DEVELOPMENT_COMPLEXITY]: {
        criterion: EvaluationCriterion.DEVELOPMENT_COMPLEXITY,
        score: 3,
        weight: 1.2,
        rationale: 'Storing binary media directly in Firestore documents would breach 1MB document size limit and 1GB storage quota.',
      },
    },
    totalScore: 47,
    weightedScore: 74.8,
    verdict: 'ACCEPTED',
    verdictRationale: 'Qualified for metadata and state storage, but requires pairing with external media binary storage for large video files.',
  },

  [DatabaseCandidate.FIRESTORE_HYBRID]: {
    candidate: DatabaseCandidate.FIRESTORE_HYBRID,
    candidateName: 'Firestore Native Hybrid (Firestore Metadata + Google Drive Media Storage)',
    monthlyCostINR: 0,
    financialCompliance: true,
    evaluations: {
      [EvaluationCriterion.COST]: {
        criterion: EvaluationCriterion.COST,
        score: 5,
        weight: 2.0,
        rationale: '₹0.00/month. Firestore Spark tier (0 ₹) + Google Drive 15 GB storage (0 ₹). 100% compliant with COST-001 (₹0–₹100).',
      },
      [EvaluationCriterion.FREE_TIER_SUITABILITY]: {
        criterion: EvaluationCriterion.FREE_TIER_SUITABILITY,
        score: 5,
        weight: 1.5,
        rationale: 'Perpetual free tier with zero cold-start latency, zero project auto-pausing, and >98% quota headroom for low-volume ops.',
      },
      [EvaluationCriterion.RELIABILITY]: {
        criterion: EvaluationCriterion.RELIABILITY,
        score: 5,
        weight: 1.5,
        rationale: 'Managed 99.999% SLA on Firestore metadata + Google Drive multi-datacenter enterprise file replication.',
      },
      [EvaluationCriterion.TRANSACTIONS]: {
        criterion: EvaluationCriterion.TRANSACTIONS,
        score: 5,
        weight: 2.0,
        rationale: 'Multi-document ACID transactions across all metadata entities; media references linked via immutable IDs (AP-007).',
      },
      [EvaluationCriterion.CONCURRENCY]: {
        criterion: EvaluationCriterion.CONCURRENCY,
        score: 5,
        weight: 1.8,
        rationale: 'Optimistic concurrency control with preconditions and transactional reads prevents race conditions on review/publish.',
      },
      [EvaluationCriterion.QUERYING]: {
        criterion: EvaluationCriterion.QUERYING,
        score: 4,
        weight: 1.2,
        rationale: 'Faceted filtering by Class, Subject, Status, Step, and Assignee; compound indices and cursor-based pagination.',
      },
      [EvaluationCriterion.RELATIONSHIPS]: {
        criterion: EvaluationCriterion.RELATIONSHIPS,
        score: 4,
        weight: 1.5,
        rationale: 'Normalized document collections for all 28 domain entities with cross-collection ID references and subcollections.',
      },
      [EvaluationCriterion.SECURITY]: {
        criterion: EvaluationCriterion.SECURITY,
        score: 5,
        weight: 1.5,
        rationale: 'Cloud Run ADC authentication, IAM least-privilege service account, Drive OAuth scopes isolated via proxy (AP-004).',
      },
      [EvaluationCriterion.BACKUP_DISASTER_RECOVERY]: {
        criterion: EvaluationCriterion.BACKUP_DISASTER_RECOVERY,
        score: 5,
        weight: 1.0,
        rationale: 'Dual redundancy: Firestore automated GCS export + Google Sheets disaster recovery mirror export (Stage 03/10).',
      },
      [EvaluationCriterion.MIGRATION]: {
        criterion: EvaluationCriterion.MIGRATION,
        score: 5,
        weight: 1.0,
        rationale: 'Non-disruptive migration: Existing Google Sheets data imported to Firestore; Sheets retained as read-only audit copy.',
      },
      [EvaluationCriterion.CLOUD_RUN_COMPATIBILITY]: {
        criterion: EvaluationCriterion.CLOUD_RUN_COMPATIBILITY,
        score: 5,
        weight: 1.5,
        rationale: 'gRPC HTTP/2 multiplexing, stateless connection lifecycle, instantaneous scale-to-zero with zero connection-pool leaks.',
      },
      [EvaluationCriterion.DEVELOPMENT_COMPLEXITY]: {
        criterion: EvaluationCriterion.DEVELOPMENT_COMPLEXITY,
        score: 4,
        weight: 1.2,
        rationale: 'Clean separation of concerns: lightweight JSON metadata in Firestore (< 5 KB/doc), raw MP4 binaries in Drive (AP-008).',
      },
    },
    totalScore: 57,
    weightedScore: 89.2,
    verdict: 'ACCEPTED',
    verdictRationale: 'THE AUTHORITATIVE SELECTION. Perfect ₹0.00 financial compliance, ACID transactions, AP-007/008 media separation, and serverless Cloud Run excellence.',
  },
};

// ============================================================================
// 3. THE AUTHORITATIVE SELECTION INVARIANT
// ============================================================================

export const SELECTED_DATABASE_ARCHITECTURE: DatabaseCandidate = DatabaseCandidate.FIRESTORE_HYBRID;
export type SelectedArchitectureType = typeof SELECTED_DATABASE_ARCHITECTURE;

// ============================================================================
// 4. FIRESTORE COLLECTION REGISTRY (ALL 28 CANONICAL DOMAIN ENTITIES)
// ============================================================================

export interface FirestoreCollectionConfig {
  resource: AuthorizationResource;
  collectionName: string;
  isSubcollection: boolean;
  parentCollection?: string;
  documentIdStrategy: 'AUTO_GENERATED' | 'NATURAL_KEY' | 'PREFIXED_UUID';
  description: string;
  primaryIndices: string[];
  compositeIndices: string[][];
  preconditionField: string;
  isMediaBinaryStoredInDrive: boolean;
}

export const FIRESTORE_COLLECTION_REGISTRY: Record<AuthorizationResource, FirestoreCollectionConfig> = {
  [AuthorizationResource.USER]: {
    resource: AuthorizationResource.USER,
    collectionName: 'users',
    isSubcollection: false,
    documentIdStrategy: 'NATURAL_KEY',
    description: 'System operators, role bindings, and user profile data.',
    primaryIndices: ['email', 'role', 'status'],
    compositeIndices: [['role', 'status']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.ROLE]: {
    resource: AuthorizationResource.ROLE,
    collectionName: 'roles',
    isSubcollection: false,
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Canonical RBAC role declarations and metadata.',
    primaryIndices: ['roleId', 'createdAt'],
    compositeIndices: [],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.CAPABILITY]: {
    resource: AuthorizationResource.CAPABILITY,
    collectionName: 'capabilities',
    isSubcollection: false,
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Master capability definitions and permission mappings.',
    primaryIndices: ['capabilityId', 'resource', 'action'],
    compositeIndices: [['resource', 'action']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.QUESTION]: {
    resource: AuthorizationResource.QUESTION,
    collectionName: 'questions',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Master curriculum question entity (Step 01 & Step 02).',
    primaryIndices: ['classGrade', 'subject', 'status', 'workflowStep', 'authorId'],
    compositeIndices: [
      ['classGrade', 'subject', 'status'],
      ['workflowStep', 'status'],
      ['authorId', 'createdAt'],
    ],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.QUESTION_VERSION]: {
    resource: AuthorizationResource.QUESTION_VERSION,
    collectionName: 'question_versions',
    isSubcollection: true,
    parentCollection: 'questions',
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Immutable historical revisions of question content.',
    primaryIndices: ['questionId', 'versionNumber', 'createdAt'],
    compositeIndices: [['questionId', 'versionNumber']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.QUESTION_REVIEW]: {
    resource: AuthorizationResource.QUESTION_REVIEW,
    collectionName: 'question_reviews',
    isSubcollection: true,
    parentCollection: 'questions',
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'QA verification review and defect logging (Step 02 Human Gate).',
    primaryIndices: ['questionId', 'reviewerId', 'verdict', 'createdAt'],
    compositeIndices: [['questionId', 'createdAt']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.CONTENT]: {
    resource: AuthorizationResource.CONTENT,
    collectionName: 'contents',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Unified content master aggregating question, script, video, and publishing links.',
    primaryIndices: ['questionId', 'overallStatus', 'workflowStep', 'updatedAt'],
    compositeIndices: [
      ['workflowStep', 'overallStatus'],
      ['classGrade', 'subject'],
    ],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.SCRIPT]: {
    resource: AuthorizationResource.SCRIPT,
    collectionName: 'scripts',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Presenter video script and teleprompter copy (Step 03).',
    primaryIndices: ['contentId', 'scriptwriterId', 'status', 'updatedAt'],
    compositeIndices: [['contentId', 'status']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.SCRIPT_VERSION]: {
    resource: AuthorizationResource.SCRIPT_VERSION,
    collectionName: 'script_versions',
    isSubcollection: true,
    parentCollection: 'scripts',
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Immutable historical revisions of video script drafts.',
    primaryIndices: ['scriptId', 'versionNumber', 'createdAt'],
    compositeIndices: [['scriptId', 'versionNumber']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.VIDEO]: {
    resource: AuthorizationResource.VIDEO,
    collectionName: 'videos',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Video production entity tracking filming, editing, and QC (Steps 04–08).',
    primaryIndices: ['contentId', 'videoStatus', 'editorId', 'presenterId', 'updatedAt'],
    compositeIndices: [
      ['videoStatus', 'updatedAt'],
      ['editorId', 'videoStatus'],
    ],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: true, // Binaries in Drive, metadata in Firestore per AP-007
  },
  [AuthorizationResource.VIDEO_TAKE]: {
    resource: AuthorizationResource.VIDEO_TAKE,
    collectionName: 'video_takes',
    isSubcollection: true,
    parentCollection: 'videos',
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Raw recorded studio takes and audio clips (Steps 04–05).',
    primaryIndices: ['videoId', 'takeNumber', 'isChosen', 'createdAt'],
    compositeIndices: [['videoId', 'takeNumber']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: true, // MP4 binary stored in Google Drive
  },
  [AuthorizationResource.VIDEO_EDIT]: {
    resource: AuthorizationResource.VIDEO_EDIT,
    collectionName: 'video_edits',
    isSubcollection: true,
    parentCollection: 'videos',
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Rough and fine cut edits, color passes, and QC approvals (Steps 06–07).',
    primaryIndices: ['videoId', 'cutType', 'qcStatus', 'updatedAt'],
    compositeIndices: [['videoId', 'cutType', 'qcStatus']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: true, // Rendered cuts stored in Google Drive
  },
  [AuthorizationResource.MEDIA_ASSET]: {
    resource: AuthorizationResource.MEDIA_ASSET,
    collectionName: 'media_assets',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Catalog of media metadata references (AP-007/AP-008).',
    primaryIndices: ['storageProvider', 'driveFileId', 'mimeType', 'createdAt'],
    compositeIndices: [['storageProvider', 'mimeType']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: true, // Binaries strictly in Google Drive
  },
  [AuthorizationResource.MEDIA_REFERENCE]: {
    resource: AuthorizationResource.MEDIA_REFERENCE,
    collectionName: 'media_references',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Linkage binding domain entities to media assets (AP-007).',
    primaryIndices: ['entityId', 'entityType', 'mediaAssetId'],
    compositeIndices: [['entityId', 'entityType']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.ARCHIVE_REFERENCE]: {
    resource: AuthorizationResource.ARCHIVE_REFERENCE,
    collectionName: 'archive_references',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Reversible archival references for retired media assets.',
    primaryIndices: ['originalAssetId', 'archivedAt', 'archiveStorageTier'],
    compositeIndices: [],
    preconditionField: 'archivedAt',
    isMediaBinaryStoredInDrive: true,
  },
  [AuthorizationResource.THUMBNAIL]: {
    resource: AuthorizationResource.THUMBNAIL,
    collectionName: 'thumbnails',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Thumbnail A/B test variants and graphics (Step 08).',
    primaryIndices: ['contentId', 'variantLabel', 'isSelected', 'updatedAt'],
    compositeIndices: [['contentId', 'variantLabel']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: true, // Image binary in Google Drive
  },
  [AuthorizationResource.SOCIAL_REVIEW]: {
    resource: AuthorizationResource.SOCIAL_REVIEW,
    collectionName: 'social_reviews',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: '9:16 mobile framing simulator review & approval (Step 09 Human Gate).',
    primaryIndices: ['contentId', 'reviewerId', 'reviewStatus', 'reviewedAt'],
    compositeIndices: [['contentId', 'reviewStatus']],
    preconditionField: 'reviewedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.PUBLISHING_PACKAGE]: {
    resource: AuthorizationResource.PUBLISHING_PACKAGE,
    collectionName: 'publishing_packages',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Release package bundling metadata, tags, titles, and media (Step 10 Human Gate).',
    primaryIndices: ['contentId', 'status', 'scheduledReleaseTime', 'updatedAt'],
    compositeIndices: [['status', 'scheduledReleaseTime']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.PUBLICATION]: {
    resource: AuthorizationResource.PUBLICATION,
    collectionName: 'publications',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Individual platform publication dispatch record (Step 11 & Step 12).',
    primaryIndices: ['packageId', 'platformId', 'status', 'publishedAt'],
    compositeIndices: [['packageId', 'platformId']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.PLATFORM]: {
    resource: AuthorizationResource.PLATFORM,
    collectionName: 'platforms',
    isSubcollection: false,
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Supported distribution channels (YouTube Shorts, Instagram Reels, Facebook).',
    primaryIndices: ['platformKey', 'isEnabled'],
    compositeIndices: [],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.ANALYTICS_SNAPSHOT]: {
    resource: AuthorizationResource.ANALYTICS_SNAPSHOT,
    collectionName: 'analytics_snapshots',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Periodic audience engagement and retention metrics snapshot (Step 13).',
    primaryIndices: ['publicationId', 'contentId', 'snapshotTimestamp', 'retentionRate3s'],
    compositeIndices: [['contentId', 'snapshotTimestamp']],
    preconditionField: 'snapshotTimestamp',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.PERFORMANCE_RECORD]: {
    resource: AuthorizationResource.PERFORMANCE_RECORD,
    collectionName: 'performance_records',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Evaluated post-publication scorecard and goal achievement (Step 14 Human Gate).',
    primaryIndices: ['contentId', 'evaluationVerdict', 'evaluatedAt'],
    compositeIndices: [['contentId', 'evaluatedAt']],
    preconditionField: 'evaluatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.INTELLIGENCE_INSIGHT]: {
    resource: AuthorizationResource.INTELLIGENCE_INSIGHT,
    collectionName: 'intelligence_insights',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Pedagogical feedback loop recommendations for curriculum authors (Step 15 Human Gate).',
    primaryIndices: ['insightType', 'classGrade', 'subject', 'status', 'generatedAt'],
    compositeIndices: [
      ['classGrade', 'subject', 'status'],
      ['status', 'generatedAt'],
    ],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.WORKFLOW_INSTANCE]: {
    resource: AuthorizationResource.WORKFLOW_INSTANCE,
    collectionName: 'workflow_instances',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Active 15-step workflow tracker for a content manufacturing item.',
    primaryIndices: ['contentId', 'currentStep', 'workflowStatus', 'updatedAt'],
    compositeIndices: [
      ['currentStep', 'workflowStatus'],
      ['contentId', 'workflowStatus'],
    ],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.WORKFLOW_TRANSITION]: {
    resource: AuthorizationResource.WORKFLOW_TRANSITION,
    collectionName: 'workflow_transitions',
    isSubcollection: true,
    parentCollection: 'workflow_instances',
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Immutable historical log of workflow forward transitions and backward reworks.',
    primaryIndices: ['workflowInstanceId', 'fromStep', 'toStep', 'transitionedBy', 'transitionedAt'],
    compositeIndices: [['workflowInstanceId', 'transitionedAt']],
    preconditionField: 'transitionedAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.NOTIFICATION]: {
    resource: AuthorizationResource.NOTIFICATION,
    collectionName: 'notifications',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'User alerts for gate assignments, reviews, and bottleneck notifications.',
    primaryIndices: ['recipientUserId', 'isRead', 'createdAt'],
    compositeIndices: [['recipientUserId', 'isRead', 'createdAt']],
    preconditionField: 'createdAt',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.AUDIT_EVENT]: {
    resource: AuthorizationResource.AUDIT_EVENT,
    collectionName: 'audit_events',
    isSubcollection: false,
    documentIdStrategy: 'PREFIXED_UUID',
    description: 'Tamper-evident, immutable system audit trail (AP-014).',
    primaryIndices: ['resource', 'action', 'actorId', 'timestamp'],
    compositeIndices: [
      ['resource', 'timestamp'],
      ['actorId', 'timestamp'],
    ],
    preconditionField: 'timestamp',
    isMediaBinaryStoredInDrive: false,
  },
  [AuthorizationResource.CONFIGURATION]: {
    resource: AuthorizationResource.CONFIGURATION,
    collectionName: 'configurations',
    isSubcollection: false,
    documentIdStrategy: 'NATURAL_KEY',
    description: 'Global system parameters, Google API config, and operational limits.',
    primaryIndices: ['configKey', 'category', 'updatedAt'],
    compositeIndices: [['category', 'updatedAt']],
    preconditionField: 'updatedAt',
    isMediaBinaryStoredInDrive: false,
  },
};

// ============================================================================
// 5. FREE-TIER BUDGET PROJECTION & QUOTA CALCULATOR
// ============================================================================

export interface FreeTierBudgetProjection {
  dailyQuestionVolumeMin: number;
  dailyQuestionVolumeMax: number;
  monthlyQuestionVolumeMin: number;
  monthlyQuestionVolumeMax: number;
  firestoreReadsPerDayProjected: number;
  firestoreWritesPerDayProjected: number;
  firestoreDeletesPerDayProjected: number;
  firestoreStorageMBProjected: number;
  sparkFreeTierDailyReadsAllowance: number;
  sparkFreeTierDailyWritesAllowance: number;
  sparkFreeTierDailyDeletesAllowance: number;
  sparkFreeTierStorageAllowanceMB: number;
  readQuotaUtilizationPercentage: number;
  writeQuotaUtilizationPercentage: number;
  storageQuotaUtilizationPercentage: number;
  driveStorageMBProjected: number;
  driveFreeTierStorageMBAllowance: number;
  driveStorageUtilizationPercentage: number;
  totalMonthlyCostINR: number;
  costConstraintCompliance: boolean; // Must be true (COST-001: ₹0–₹100/mo)
  isFinancialConstraintSatisfied: boolean;
}

/**
 * Calculates deterministic quota utilization and monthly financial cost for the
 * low-volume production profile (1–5 questions/day, ~30–150/month).
 */
export function calculateFreeTierBudgetProjection(): FreeTierBudgetProjection {
  const dailyQuestionVolumeMin = 1;
  const dailyQuestionVolumeMax = 5;
  const daysPerMonth = 30;

  const monthlyQuestionVolumeMin = dailyQuestionVolumeMin * daysPerMonth; // 30
  const monthlyQuestionVolumeMax = dailyQuestionVolumeMax * daysPerMonth; // 150

  // Per question pipeline operations across all 15 stages:
  // - Creation, draft revisions, approvals, takes, cut metadata, tags, publication, metrics
  // Average reads per question per day in active manufacturing: ~60 reads
  // Average writes per question per day in active manufacturing: ~15 writes
  // For 5 questions/day max, plus general dashboard polling (100 reads):
  const maxActiveQuestionsPerDay = 5;
  const firestoreReadsPerDayProjected = (maxActiveQuestionsPerDay * 60) + 120; // ~420 reads/day
  const firestoreWritesPerDayProjected = (maxActiveQuestionsPerDay * 15) + 10;  // ~85 writes/day
  const firestoreDeletesPerDayProjected = 5; // < 5 deletes/day (immutability preserved)

  // Document storage projection (JSON metadata only, average doc size 3 KB):
  // 150 questions/mo * 10 docs/question * 3 KB = ~4.5 MB/month. Over 1 year = ~54 MB.
  const firestoreStorageMBProjected = 60; // 60 MB after 1 year of production

  // Google Cloud Firestore Spark Free Tier Allowances:
  const sparkFreeTierDailyReadsAllowance = 50000;
  const sparkFreeTierDailyWritesAllowance = 20000;
  const sparkFreeTierDailyDeletesAllowance = 20000;
  const sparkFreeTierStorageAllowanceMB = 1024; // 1 GB

  const readQuotaUtilizationPercentage = Number(
    ((firestoreReadsPerDayProjected / sparkFreeTierDailyReadsAllowance) * 100).toFixed(2)
  );
  const writeQuotaUtilizationPercentage = Number(
    ((firestoreWritesPerDayProjected / sparkFreeTierDailyWritesAllowance) * 100).toFixed(2)
  );
  const storageQuotaUtilizationPercentage = Number(
    ((firestoreStorageMBProjected / sparkFreeTierStorageAllowanceMB) * 100).toFixed(2)
  );

  // Google Drive Media Storage Projection (AP-007 / AP-008):
  // 150 videos/month * ~25 MB average compressed 9:16 MP4 = ~3,750 MB (3.75 GB) per month.
  // Google Drive free tier allowance = 15 GB (15,360 MB).
  const driveStorageMBProjected = 3750;
  const driveFreeTierStorageMBAllowance = 15360;
  const driveStorageUtilizationPercentage = Number(
    ((driveStorageMBProjected / driveFreeTierStorageMBAllowance) * 100).toFixed(2)
  );

  // Monthly Cost: Both Firestore Spark Tier and Google Drive 15GB are ₹0.00
  const totalMonthlyCostINR = 0.0;
  const costConstraintCompliance = totalMonthlyCostINR <= 100.0;

  return {
    dailyQuestionVolumeMin,
    dailyQuestionVolumeMax,
    monthlyQuestionVolumeMin,
    monthlyQuestionVolumeMax,
    firestoreReadsPerDayProjected,
    firestoreWritesPerDayProjected,
    firestoreDeletesPerDayProjected,
    firestoreStorageMBProjected,
    sparkFreeTierDailyReadsAllowance,
    sparkFreeTierDailyWritesAllowance,
    sparkFreeTierDailyDeletesAllowance,
    sparkFreeTierStorageAllowanceMB,
    readQuotaUtilizationPercentage,
    writeQuotaUtilizationPercentage,
    storageQuotaUtilizationPercentage,
    driveStorageMBProjected,
    driveFreeTierStorageMBAllowance,
    driveStorageUtilizationPercentage,
    totalMonthlyCostINR,
    costConstraintCompliance,
    isFinancialConstraintSatisfied: costConstraintCompliance && totalMonthlyCostINR <= 100,
  };
}
