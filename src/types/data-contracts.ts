/**
 * BURRA PARIKSHA CMS — Stage 13 Data Model & Data Contract
 *
 * Implements authoritative, strongly typed physical Data Contracts for Firestore Native Hybrid:
 * - 28 Top-Level Canonical Collections
 * - Deterministic Canonical ID Patterns (Regex Enforced)
 * - Standard Base Entity Contract (Timestamps, Concurrency Versioning, Soft Deletion, Ownership)
 * - Strict Immutability Assertions for Append-Only Collections
 * - Authoritative Source of Truth (SoT) Registry
 * - Firestore Composite Index Specifications
 * - Zod Validation Schemas and TypeScript Interfaces for Primary Entities
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-005, AP-007, AP-008, AP-010, AP-014)
 * - Stage 06 Domain Model (28 Canonical Entities)
 * - Stage 07 Canonical 15-Step Workflow
 * - Stage 08 State Model (5 State Dimensions & OCC Versioning)
 * - Stage 12 Database Architecture Decision (Firestore Hybrid Architecture)
 */

import { z } from 'zod';

// ============================================================================
// 1. CANONICAL COLLECTION ENUMERATION (28 TOP-LEVEL COLLECTIONS)
// ============================================================================

export enum CanonicalCollection {
  USERS = 'users',
  ROLES = 'roles',
  CAPABILITIES = 'capabilities',
  QUESTIONS = 'questions',
  QUESTION_VERSIONS = 'question_versions',
  QUESTION_REVIEWS = 'question_reviews',
  CONTENT = 'content',
  SCRIPTS = 'scripts',
  SCRIPT_VERSIONS = 'script_versions',
  VIDEOS = 'videos',
  VIDEO_TAKES = 'video_takes',
  VIDEO_EDITS = 'video_edits',
  MEDIA_ASSETS = 'media_assets',
  MEDIA_REFERENCES = 'media_references',
  ARCHIVE_REFERENCES = 'archive_references',
  THUMBNAILS = 'thumbnails',
  SOCIAL_REVIEWS = 'social_reviews',
  PUBLISHING_PACKAGES = 'publishing_packages',
  PUBLICATIONS = 'publications',
  PLATFORMS = 'platforms',
  ANALYTICS_SNAPSHOTS = 'analytics_snapshots',
  PERFORMANCE_RECORDS = 'performance_records',
  INTELLIGENCE_INSIGHTS = 'intelligence_insights',
  WORKFLOW_INSTANCES = 'workflow_instances',
  WORKFLOW_TRANSITIONS = 'workflow_transitions',
  NOTIFICATIONS = 'notifications',
  AUDIT_EVENTS = 'audit_events',
  CONFIGURATIONS = 'configurations',
}

export const CANONICAL_COLLECTIONS = Object.values(CanonicalCollection);

// ============================================================================
// 2. CANONICAL ID PATTERNS (REGEX ENFORCED)
// ============================================================================

export const CANONICAL_ID_PATTERNS: Record<CanonicalCollection, RegExp> = {
  [CanonicalCollection.USERS]: /^USR-[0-9]{6}$/,
  [CanonicalCollection.ROLES]: /^ROLE_[A-Z0-9_]+$/,
  [CanonicalCollection.CAPABILITIES]: /^[A-Z0-9_]+:[A-Z0-9_]+$/,
  [CanonicalCollection.QUESTIONS]: /^BP-Q-[0-9]{6}$/,
  [CanonicalCollection.QUESTION_VERSIONS]: /^BP-QV-[0-9]{6}-V[0-9]{2}$/,
  [CanonicalCollection.QUESTION_REVIEWS]: /^BP-QR-[0-9]{6}-[0-9]{3}$/,
  [CanonicalCollection.CONTENT]: /^BP-CNT-[0-9]{6}$/,
  [CanonicalCollection.SCRIPTS]: /^BP-S-[0-9]{6}$/,
  [CanonicalCollection.SCRIPT_VERSIONS]: /^BP-SV-[0-9]{6}-V[0-9]{2}$/,
  [CanonicalCollection.VIDEOS]: /^BP-V-[0-9]{6}$/,
  [CanonicalCollection.VIDEO_TAKES]: /^BP-VT-[0-9]{6}-T[0-9]{2}$/,
  [CanonicalCollection.VIDEO_EDITS]: /^BP-VE-[0-9]{6}-C[0-9]{2}$/,
  [CanonicalCollection.MEDIA_ASSETS]: /^MED-[0-9]{6}$/,
  [CanonicalCollection.MEDIA_REFERENCES]: /^MREF-[0-9]{6}$/,
  [CanonicalCollection.ARCHIVE_REFERENCES]: /^ARC-[0-9]{6}$/,
  [CanonicalCollection.THUMBNAILS]: /^BP-TH-[0-9]{6}$/,
  [CanonicalCollection.SOCIAL_REVIEWS]: /^SR-[0-9]{6}$/,
  [CanonicalCollection.PUBLISHING_PACKAGES]: /^PKG-[0-9]{6}$/,
  [CanonicalCollection.PUBLICATIONS]: /^PUB-[0-9]{6}$/,
  [CanonicalCollection.PLATFORMS]: /^PLT-[A-Z0-9_]+$/,
  [CanonicalCollection.ANALYTICS_SNAPSHOTS]: /^SNP-[0-9]{8}-[0-9]{4}$/,
  [CanonicalCollection.PERFORMANCE_RECORDS]: /^PRF-[0-9]{6}$/,
  [CanonicalCollection.INTELLIGENCE_INSIGHTS]: /^INS-[0-9]{6}$/,
  [CanonicalCollection.WORKFLOW_INSTANCES]: /^WF-[0-9]{6}$/,
  [CanonicalCollection.WORKFLOW_TRANSITIONS]: /^TRN-[0-9]{8}-[0-9]{4}$/,
  [CanonicalCollection.NOTIFICATIONS]: /^NOTIF-[0-9]{6}$/,
  [CanonicalCollection.AUDIT_EVENTS]: /^AUD-[0-9]{8}-[0-9]{4}$/,
  [CanonicalCollection.CONFIGURATIONS]: /^CFG-[A-Z0-9_]+$/,
};

// ============================================================================
// 3. STANDARD BASE ENTITY CONTRACT
// Every mutable document in Firestore must adhere to this base structure.
// ============================================================================

export interface BaseEntityContract {
  id: string; // Canonical identifier matching CANONICAL_ID_PATTERNS
  createdAt: string; // ISO 8601 UTC timestamp
  createdBy: string; // Canonical User ID USR-xxxxxx
  updatedAt: string; // ISO 8601 UTC timestamp
  updatedBy: string; // Canonical User ID USR-xxxxxx
  version: number; // Positive integer for OCC (Stage 08)
  isDeleted: boolean; // Soft deletion flag (hard delete prohibited)
  deletedAt: string | null;
  deletedBy: string | null;
}

export const BaseEntitySchema = z.object({
  id: z.string().min(3),
  createdAt: z.string().datetime(),
  createdBy: z.string().regex(/^USR-[0-9]{6}$/),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().regex(/^USR-[0-9]{6}$/),
  version: z.number().int().positive(),
  isDeleted: z.boolean(),
  deletedAt: z.string().datetime().nullable(),
  deletedBy: z.string().regex(/^USR-[0-9]{6}$/).nullable(),
});

// ============================================================================
// 4. IMMUTABILITY SPECIFICATION & RUNTIME GUARD
// The following collections are append-only; update/delete operations throw.
// ============================================================================

export const IMMUTABLE_COLLECTIONS: readonly CanonicalCollection[] = [
  CanonicalCollection.AUDIT_EVENTS,
  CanonicalCollection.WORKFLOW_TRANSITIONS,
  CanonicalCollection.QUESTION_VERSIONS,
  CanonicalCollection.SCRIPT_VERSIONS,
  CanonicalCollection.ANALYTICS_SNAPSHOTS,
] as const;

export function isCollectionImmutable(collection: CanonicalCollection | string): boolean {
  return (IMMUTABLE_COLLECTIONS as readonly string[]).includes(collection);
}

export function assertImmutability(collection: CanonicalCollection | string): void {
  if (isCollectionImmutable(collection)) {
    throw new Error(
      `[IMMUTABILITY_VIOLATION] Collection '${collection}' is strictly append-only and immutable. Modifications and deletions are prohibited.`
    );
  }
}

// ============================================================================
// 5. SOURCE OF TRUTH (SoT) AUTHORITY REGISTRY
// ============================================================================

export enum SourceOfTruth {
  CMS_FIRESTORE = 'CMS_FIRESTORE',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  EXTERNAL_PLATFORMS = 'EXTERNAL_PLATFORMS',
  ASSISTIVE_AI_GEMINI = 'ASSISTIVE_AI_GEMINI',
}

export interface FieldSourceOfTruthConfig {
  collection: CanonicalCollection;
  fieldPath: string;
  sourceOfTruth: SourceOfTruth;
  authorityDescription: string;
  isHumanGated: boolean;
}

export const SOURCE_OF_TRUTH_REGISTRY: FieldSourceOfTruthConfig[] = [
  {
    collection: CanonicalCollection.QUESTIONS,
    fieldPath: 'questionTextTelugu',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: 'Pedagogical question stem in Telugu authored or verified in CMS.',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.QUESTIONS,
    fieldPath: 'options',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: '4 multiple-choice options with exactly 1 correct answer.',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.QUESTIONS,
    fieldPath: 'aiDraftPayload',
    sourceOfTruth: SourceOfTruth.ASSISTIVE_AI_GEMINI,
    authorityDescription: 'AI-suggested draft question. Untrusted until human author approves.',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.SCRIPTS,
    fieldPath: 'teleprompterCopy',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: 'Master presenter script and teleprompter copy stored in CMS.',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.SCRIPTS,
    fieldPath: 'aiSuggestedCopy',
    sourceOfTruth: SourceOfTruth.ASSISTIVE_AI_GEMINI,
    authorityDescription: 'AI teleprompter draft. Must be edited and approved by human scriptwriter.',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.MEDIA_REFERENCES,
    fieldPath: 'driveFileId',
    sourceOfTruth: SourceOfTruth.GOOGLE_DRIVE,
    authorityDescription: 'External Google Drive file identifier. CMS owns metadata only (AP-007).',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.VIDEO_TAKES,
    fieldPath: 'driveFileUri',
    sourceOfTruth: SourceOfTruth.GOOGLE_DRIVE,
    authorityDescription: 'Raw camera video take stored in Google Drive. CMS stores pointer only.',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.VIDEO_EDITS,
    fieldPath: 'renderedCutDriveUri',
    sourceOfTruth: SourceOfTruth.GOOGLE_DRIVE,
    authorityDescription: 'Final rendered master MP4 stored in Google Drive. CMS stores metadata.',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.WORKFLOW_INSTANCES,
    fieldPath: 'currentStep',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: 'Authoritative 15-step workflow progression step (AP-010).',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.WORKFLOW_INSTANCES,
    fieldPath: 'workflowStatus',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: 'Authoritative workflow lifecycle state (AP-002, AP-010).',
    isHumanGated: true,
  },
  {
    collection: CanonicalCollection.PUBLICATIONS,
    fieldPath: 'liveUrl',
    sourceOfTruth: SourceOfTruth.EXTERNAL_PLATFORMS,
    authorityDescription: 'Public URL on YouTube, Instagram, or Facebook verified via external API.',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.PUBLICATIONS,
    fieldPath: 'publishedStatus',
    sourceOfTruth: SourceOfTruth.EXTERNAL_PLATFORMS,
    authorityDescription: 'External publication state reported by platform distribution workers.',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.ANALYTICS_SNAPSHOTS,
    fieldPath: 'retentionCurve',
    sourceOfTruth: SourceOfTruth.EXTERNAL_PLATFORMS,
    authorityDescription: '3-second hook and second-by-second retention curve from YouTube Analytics.',
    isHumanGated: false,
  },
  {
    collection: CanonicalCollection.AUDIT_EVENTS,
    fieldPath: 'immutableLedger',
    sourceOfTruth: SourceOfTruth.CMS_FIRESTORE,
    authorityDescription: 'Tamper-evident, append-only operational audit trail (AP-014).',
    isHumanGated: false,
  },
];

// ============================================================================
// 6. FIRESTORE COMPOSITE INDEX SPECIFICATIONS
// ============================================================================

export interface FirestoreCompositeIndex {
  collection: CanonicalCollection;
  fields: Array<{ fieldPath: string; order: 'ASCENDING' | 'DESCENDING' }>;
  purpose: string;
}

export const FIRESTORE_COMPOSITE_INDEXES: FirestoreCompositeIndex[] = [
  {
    collection: CanonicalCollection.QUESTIONS,
    fields: [
      { fieldPath: 'subject', order: 'ASCENDING' },
      { fieldPath: 'classLevel', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ],
    purpose: 'Curriculum Question Library filtering by subject, class, and approval status.',
  },
  {
    collection: CanonicalCollection.CONTENT,
    fields: [
      { fieldPath: 'currentWorkflowStep', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' },
    ],
    purpose: 'Executive Operations Radar and Pipeline Bottleneck visualization.',
  },
  {
    collection: CanonicalCollection.VIDEOS,
    fields: [
      { fieldPath: 'currentWorkflowStep', order: 'ASCENDING' },
      { fieldPath: 'assignedEditorId', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ],
    purpose: 'Production Bay personal editing queue and filming schedule.',
  },
  {
    collection: CanonicalCollection.AUDIT_EVENTS,
    fields: [
      { fieldPath: 'resourceType', order: 'ASCENDING' },
      { fieldPath: 'resourceId', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' },
    ],
    purpose: 'Audit Trail investigation filtered by resource and ordered chronologically.',
  },
  {
    collection: CanonicalCollection.PUBLICATIONS,
    fields: [
      { fieldPath: 'platformId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'publishedAt', order: 'DESCENDING' },
    ],
    purpose: 'Platform release distribution tracker and schedule verifier.',
  },
  {
    collection: CanonicalCollection.ANALYTICS_SNAPSHOTS,
    fields: [
      { fieldPath: 'contentId', order: 'ASCENDING' },
      { fieldPath: 'snapshotTimestamp', order: 'DESCENDING' },
    ],
    purpose: 'Time-series retention curves and engagement growth telemetry.',
  },
];

// ============================================================================
// 7. PRIMARY DOMAIN COLLECTION ZOD SCHEMAS & INTERFACES
// ============================================================================

// 7.1 QuestionDocument
export const QuestionDocumentSchema = BaseEntitySchema.extend({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.QUESTIONS]),
  subject: z.string().min(1),
  classLevel: z.string().min(1),
  chapter: z.string().min(1),
  topic: z.string().min(1),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD']),
  questionTextTelugu: z.string().min(1),
  questionTextEnglish: z.string().optional(),
  options: z.array(
    z.object({
      optionKey: z.enum(['A', 'B', 'C', 'D']),
      optionTextTelugu: z.string().min(1),
      isCorrect: z.boolean(),
    })
  ).length(4).refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
    message: 'Question must have exactly one correct option.',
  }),
  explanationTelugu: z.string().min(1),
  pedagogicalDefectCount: z.number().int().nonnegative().default(0),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISED']),
  currentWorkflowStep: z.number().int().min(1).max(15),
  authorUserId: z.string().regex(/^USR-[0-9]{6}$/),
  reviewerUserId: z.string().regex(/^USR-[0-9]{6}$/).nullable(),
});
export type QuestionDocument = z.infer<typeof QuestionDocumentSchema>;

// 7.2 ContentDocument (Aggregate Root)
export const ContentDocumentSchema = BaseEntitySchema.extend({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.CONTENT]),
  questionId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.QUESTIONS]),
  title: z.string().min(1),
  classLevel: z.string().min(1),
  subject: z.string().min(1),
  currentWorkflowStep: z.number().int().min(1).max(15),
  status: z.enum(['IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'ARCHIVED']),
  activeScriptId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.SCRIPTS]).nullable(),
  activeVideoId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.VIDEOS]).nullable(),
  activePublishingPackageId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.PUBLISHING_PACKAGES]).nullable(),
  assignedOperatorIds: z.array(z.string().regex(/^USR-[0-9]{6}$/)),
});
export type ContentDocument = z.infer<typeof ContentDocumentSchema>;

// 7.3 VideoDocument
export const VideoDocumentSchema = BaseEntitySchema.extend({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.VIDEOS]),
  contentId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.CONTENT]),
  scriptId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.SCRIPTS]),
  assignedPresenterId: z.string().regex(/^USR-[0-9]{6}$/),
  assignedEditorId: z.string().regex(/^USR-[0-9]{6}$/),
  currentWorkflowStep: z.number().int().min(4).max(8),
  videoStatus: z.enum(['SCHEDULED', 'FILMING', 'RAW_LOGGED', 'EDITING', 'QC_PENDING', 'QC_APPROVED', 'QC_REJECTED']),
  rawTakeCount: z.number().int().nonnegative().default(0),
  selectedTakeId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.VIDEO_TAKES]).nullable(),
  activeEditId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.VIDEO_EDITS]).nullable(),
  masterCutDriveFileId: z.string().nullable(), // Stored in Google Drive per AP-007
  durationSeconds: z.number().positive().nullable(),
});
export type VideoDocument = z.infer<typeof VideoDocumentSchema>;

// 7.4 ScriptDocument
export const ScriptDocumentSchema = BaseEntitySchema.extend({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.SCRIPTS]),
  contentId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.CONTENT]),
  authorId: z.string().regex(/^USR-[0-9]{6}$/),
  hookCopyTelugu: z.string().min(1),
  teleprompterCopy: z.string().min(1),
  callToActionTelugu: z.string().min(1),
  estimatedReadTimeSeconds: z.number().int().positive(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REVISION_REQUESTED']),
  currentVersionNumber: z.number().int().positive(),
});
export type ScriptDocument = z.infer<typeof ScriptDocumentSchema>;

// 7.5 AuditEventDocument (Strictly Immutable per AP-014)
export const AuditEventDocumentSchema = z.object({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.AUDIT_EVENTS]),
  timestamp: z.string().datetime(),
  actorId: z.string().regex(/^USR-[0-9]{6}$/),
  actorRole: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  action: z.string().min(1),
  preconditionState: z.record(z.string(), z.unknown()).nullable(),
  postconditionState: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  correlationId: z.string().uuid(),
});
export type AuditEventDocument = z.infer<typeof AuditEventDocumentSchema>;

// 7.6 WorkflowInstanceDocument
export const WorkflowInstanceDocumentSchema = BaseEntitySchema.extend({
  id: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.WORKFLOW_INSTANCES]),
  contentId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.CONTENT]),
  currentStep: z.number().int().min(1).max(15),
  workflowStatus: z.enum(['ACTIVE', 'BLOCKED', 'REWORK_REQUESTED', 'COMPLETED', 'HALTED']),
  stepEntryTimestamp: z.string().datetime(),
  activeAssigneeId: z.string().regex(/^USR-[0-9]{6}$/),
  totalTransitionsCount: z.number().int().nonnegative(),
  lastTransitionId: z.string().regex(CANONICAL_ID_PATTERNS[CanonicalCollection.WORKFLOW_TRANSITIONS]).nullable(),
});
export type WorkflowInstanceDocument = z.infer<typeof WorkflowInstanceDocumentSchema>;
