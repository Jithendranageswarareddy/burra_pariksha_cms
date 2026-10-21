/**
 * BURRA PARIKSHA CMS - Data Integrity & Operational Diagnostics Service
 * Phase 8A: Data Integrity & Operational Intelligence Foundation
 * 
 * Provides comprehensive, strictly READ-ONLY diagnostics over Cloud Firestore authoritative collections.
 * Detects broken references, invalid statuses, taxonomy hierarchy violations, ID collisions,
 * sequence anomalies, and lifecycle state inconsistencies.
 * 
 * CRITICAL SAFETY GUARANTEE:
 * This service is strictly READ-ONLY. It never mutates records, modifies SEQUENCES, deletes documents,
 * or alters Firestore collections in any way.
 */

import {
  AuditLog,
  computeDiagnosticCounts,
  ContentMaster,
  IntegrityCategory,
  IntegrityCheckSummary,
  IntegrityIssue,
  IntegritySeverity,
  PinnedComment,
  PinnedCommentVersion,
  PriorityLevel,
  Publishing,
  Question,
  QuestionDraft,
  QuestionStatus,
  QuestionVideo,
  Script,
  ScriptVersion,
  SocialPublishStatus,
  Subtopic,
  SystemHealthReport,
  Thumbnail,
  ThumbnailVersion,
  Topic,
  User,
  Video,
  VideoProductionStatus,
  Workflow,
  WorksheetHealthSummary,
} from '../../../../shared';

import {
  assignmentsRepository,
  auditLogRepository,
  contentBatchesRepository,
  contentMastersRepository,
  contentPlansRepository,
  mediaAssetsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  publishingRepository,
  questionConfigRepository,
  questionDraftsRepository,
  questionsRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  socialReviewsRepository,
  subtopicsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  topicsRepository,
  usersRepository,
  validationsRepository,
  videosRepository,
  workflowRepository,
} from '../../../../database/firestore/repositories';

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  TOPICS: 'topics',
  SUBTOPICS: 'subtopics',
  QUESTIONS: 'questions',
  QUESTION_VIDEOS: 'question_videos',
  VIDEOS: 'videos',
  SCRIPT: 'scripts',
  SCRIPT_VERSIONS: 'script_versions',
  THUMBNAILS: 'thumbnails',
  THUMBNAIL_VERSIONS: 'thumbnail_versions',
  PINNED_COMMENTS: 'pinned_comments',
  PINNED_COMMENT_VERSIONS: 'pinned_comment_versions',
  WORKFLOW: 'workflow_instances',
  ASSIGNMENTS: 'assignments',
  PUBLISHING: 'publishing_packages',
  AUDIT_LOG: 'audit_logs',
  CONTENT_MASTERS: 'content_masters',
  SOCIAL_REVIEWS: 'social_reviews',
  QUESTION_VALIDATIONS: 'validations',
  QUESTION_CONFIG: 'question_config',
  MEDIA_ASSETS: 'media_assets',
  CONTENT_PLANS: 'content_plans',
  CONTENT_BATCHES: 'content_batches',
} as const;

// Backward-compatible alias for existing checks targeting collections
export const SHEET_TABS = FIRESTORE_COLLECTIONS;

export const ALL_FIRESTORE_COLLECTIONS = [
  'users',
  'topics',
  'subtopics',
  'questions',
  'question_videos',
  'videos',
  'scripts',
  'script_versions',
  'thumbnails',
  'thumbnail_versions',
  'pinned_comments',
  'pinned_comment_versions',
  'workflow_instances',
  'assignments',
  'publishing_packages',
  'audit_logs',
  'content_masters',
  'social_reviews',
  'validations',
  'question_config',
  'media_assets',
  'content_plans',
  'content_batches',
] as const;

export const ALL_SHEET_TABS = ALL_FIRESTORE_COLLECTIONS as unknown as string[];

export interface VersionIdValidationConfig {
  canonicalPrefix: string;
  allowedParentPrefixes: string[];
  allowedLegacyPrefixes?: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_ID_SUFFIX_REGEX = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/**
 * Validates version identifiers against canonical standalone, supported legacy standalone,
 * or composite version formats (${parentId}-V${versionNumber}).
 */
export function isValidVersionId(id: string, config: VersionIdValidationConfig): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!trimmed) return false;

  // 1. Standalone canonical format (e.g. scv_<uuid>, thv_<uuid>, pcv_<uuid>)
  // Requires standard canonical prefix followed by a valid UUID v4
  if (trimmed.startsWith(config.canonicalPrefix)) {
    const suffix = trimmed.slice(config.canonicalPrefix.length);
    return UUID_REGEX.test(suffix);
  }

  // 2. Standalone legacy format (e.g. BP-SCV-0001, BP-THV-0001, BP-PCV-0001)
  // Requires allowed legacy prefix followed by non-empty valid alphanumeric sequence
  if (config.allowedLegacyPrefixes) {
    for (const legacyPrefix of config.allowedLegacyPrefixes) {
      if (trimmed.startsWith(legacyPrefix)) {
        const suffix = trimmed.slice(legacyPrefix.length);
        if (LEGACY_ID_SUFFIX_REGEX.test(suffix)) {
          return true;
        }
      }
    }
  }

  // 3. Composite version ID format: ${parentId}-V${versionNumber}
  // e.g. scr_<uuid>-V1, BP-S-0001-V1, thm_<uuid>-V1, pin_<uuid>-V1
  const match = trimmed.match(/^(.+)-V(\d+)$/);
  if (match) {
    const parentId = match[1];
    const versionNumStr = match[2];

    // Version number must be a positive integer without leading zeros (e.g. 1, 2, 12)
    if (!/^[1-9]\d*$/.test(versionNumStr)) {
      return false;
    }

    const matchedParentPrefix = config.allowedParentPrefixes.find((p) => parentId.startsWith(p));
    if (!matchedParentPrefix) {
      return false;
    }

    const parentSuffix = parentId.slice(matchedParentPrefix.length);
    if (!parentSuffix) {
      return false;
    }

    // Canonical parent (scr_, thm_, pin_) requires a valid UUID
    if (matchedParentPrefix.endsWith('_')) {
      return UUID_REGEX.test(parentSuffix);
    }

    // Legacy parent (BP-S-, BP-T-, BP-PIN-) requires valid alphanumeric suffix
    return LEGACY_ID_SUFFIX_REGEX.test(parentSuffix);
  }

  return false;
}

export interface DiagnosticDataSnapshot {
  users?: User[];
  topics?: Topic[];
  subtopics?: Subtopic[];
  questions?: Question[];
  questionVideos?: QuestionVideo[];
  videos?: Video[];
  scripts?: Script[];
  scriptVersions?: ScriptVersion[];
  thumbnails?: Thumbnail[];
  thumbnailVersions?: ThumbnailVersion[];
  pinnedComments?: PinnedComment[];
  pinnedCommentVersions?: PinnedCommentVersion[];
  workflows?: any[];
  assignments?: any[];
  publishingRecords?: Publishing[];
  auditLogs?: AuditLog[];
  contentMasters?: ContentMaster[];
  socialReviews?: any[];
  validations?: any[];
  questionConfig?: any[];
  mediaAssets?: any[];
  contentPlans?: any[];
  contentBatches?: any[];
  questionDrafts?: QuestionDraft[];
}

export interface DiagnosticRunOptions {
  forceFresh?: boolean;
  snapshot?: DiagnosticDataSnapshot;
}

export class DataIntegrityService {
  private static instance: DataIntegrityService | null = null;
  private cachedReport: SystemHealthReport | null = null;
  private cacheExpiresAt = 0;
  private inFlightCheck: Promise<SystemHealthReport> | null = null;

  private constructor() {}

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  public clearCache(): void {
    this.cachedReport = null;
    this.cacheExpiresAt = 0;
  }

  /**
   * Extracts numeric ID from a formatted identifier string (e.g. BP-Q-000123 -> 123).
   * If expectedPrefix is provided, only extracts if id starts with expectedPrefix.
   */
  private extractNumericId(id: string, expectedPrefix?: string): number | null {
    if (!id || typeof id !== 'string') return null;
    if (expectedPrefix) {
      if (!id.startsWith(expectedPrefix)) return null;
      const rest = id.slice(expectedPrefix.length);
      const parsed = parseInt(rest, 10);
      return isNaN(parsed) ? null : parsed;
    }
    const match = id.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Executes a full, read-only data integrity and operational health check across all worksheets.
   * Cached for 60 seconds with in-flight deduplication to prevent probe storms.
   * If a synthetic snapshot is passed in options, executes directly in-memory without contacting Firestore.
   */
  public async runFullIntegrityCheck(options?: DiagnosticRunOptions): Promise<SystemHealthReport> {
    if (options?.snapshot) {
      return this.executeFullIntegrityCheck(options.snapshot);
    }

    if (!options?.forceFresh && this.cachedReport && Date.now() < this.cacheExpiresAt) {
      return this.cachedReport;
    }

    if (this.inFlightCheck) {
      return this.inFlightCheck;
    }

    this.inFlightCheck = this.executeFullIntegrityCheck();
    try {
      const report = await this.inFlightCheck;
      this.cachedReport = report;
      this.cacheExpiresAt = Date.now() + 60000;
      return report;
    } finally {
      this.inFlightCheck = null;
    }
  }

  private async executeFullIntegrityCheck(snapshot?: DiagnosticDataSnapshot): Promise<SystemHealthReport> {
    const issues: IntegrityIssue[] = [];
    let issueCounter = 1;

    const addIssue = (
      severity: IntegritySeverity,
      category: IntegrityCategory,
      worksheet: string,
      message: string,
      recommendedAction: string,
      entityType?: string,
      entityId?: string,
      field?: string
    ) => {
      issues.push({
        id: `DI-ISSUE-${String(issueCounter++).padStart(5, '0')}`,
        severity,
        category,
        worksheet,
        collection: worksheet,
        message,
        recommendedAction,
        entityType,
        entityId,
        field,
      });
    };

    // Track individual query errors to distinguish query failures from empty collections
    const queryErrors = new Map<string, Error>();

    const safeFetch = async <T>(collectionName: string, fetchFn: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await fetchFn();
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        queryErrors.set(collectionName, error);
        const isQuotaExhausted =
          error.message.includes('RESOURCE_EXHAUSTED') ||
          error.message.includes('Quota exceeded') ||
          (err as any)?.code === 8;
        addIssue(
          isQuotaExhausted ? 'WARNING' : 'ERROR',
          'ID_INTEGRITY',
          collectionName,
          isQuotaExhausted
            ? `Firestore read quota exceeded on collection "${collectionName}": ${error.message}`
            : `Firestore query failure on collection "${collectionName}": ${error.message}`,
          isQuotaExhausted
            ? `Cloud Firestore daily read limit reached. Quota resets daily at midnight US Pacific Time.`
            : `Verify Firestore connectivity, collection permissions, or security rules for collection "${collectionName}".`,
          'COLLECTION',
          collectionName
        );
        return [];
      }
    };

    // Parallel fetch of all authoritative Firestore collections (single pass per collection)
    const [
      users,
      topics,
      subtopics,
      questions,
      questionVideos,
      videos,
      scripts,
      scriptVersions,
      thumbnails,
      thumbnailVersions,
      pinnedComments,
      pinnedCommentVersions,
      workflows,
      assignments,
      publishingRecords,
      auditLogs,
      contentMasters,
      socialReviews,
      validations,
      questionConfig,
      mediaAssets,
      contentPlans,
      contentBatches,
      questionDrafts,
    ] = snapshot
      ? [
          snapshot.users || [],
          snapshot.topics || [],
          snapshot.subtopics || [],
          snapshot.questions || [],
          snapshot.questionVideos || [],
          snapshot.videos || [],
          snapshot.scripts || [],
          snapshot.scriptVersions || [],
          snapshot.thumbnails || [],
          snapshot.thumbnailVersions || [],
          snapshot.pinnedComments || [],
          snapshot.pinnedCommentVersions || [],
          snapshot.workflows || [],
          snapshot.assignments || [],
          snapshot.publishingRecords || [],
          snapshot.auditLogs || [],
          snapshot.contentMasters || [],
          snapshot.socialReviews || [],
          snapshot.validations || [],
          snapshot.questionConfig || [],
          snapshot.mediaAssets || [],
          snapshot.contentPlans || [],
          snapshot.contentBatches || [],
          snapshot.questionDrafts || [],
        ]
      : await Promise.all([
          safeFetch(FIRESTORE_COLLECTIONS.USERS, () => usersRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.TOPICS, () => topicsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.SUBTOPICS, () => subtopicsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.QUESTIONS, () => questionsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.QUESTION_VIDEOS, () => questionVideosRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.VIDEOS, () => videosRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.SCRIPT, () => scriptsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.SCRIPT_VERSIONS, () => scriptVersionsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.THUMBNAILS, () => thumbnailsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.THUMBNAIL_VERSIONS, () => thumbnailVersionsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.PINNED_COMMENTS, () => pinnedCommentsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.PINNED_COMMENT_VERSIONS, () => pinnedCommentVersionsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.WORKFLOW, () => workflowRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.ASSIGNMENTS, () => assignmentsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.PUBLISHING, () => publishingRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.AUDIT_LOG, () => auditLogRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.CONTENT_MASTERS, () => contentMastersRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.SOCIAL_REVIEWS, () => socialReviewsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.QUESTION_VALIDATIONS, () => validationsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.QUESTION_CONFIG, () => questionConfigRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.MEDIA_ASSETS, () => mediaAssetsRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.CONTENT_PLANS, () => contentPlansRepository.findAll()),
          safeFetch(FIRESTORE_COLLECTIONS.CONTENT_BATCHES, () => contentBatchesRepository.findAll()),
          safeFetch('question_drafts', () => questionDraftsRepository.findAll()),
        ]);

    // Fast lookup maps
    const topicMap = new Map<string, Topic>(topics.map((t) => [t.id, t]));
    const subtopicMap = new Map<string, Subtopic>(subtopics.map((s) => [s.id, s]));
    const questionMap = new Map<string, Question>(questions.map((q: any) => [q.id, q] as [string, Question]));
    const videoMap = new Map<string, Video>(videos.map((v) => [v.id, v]));
    const scriptMap = new Map<string, Script>(scripts.map((s) => [s.id, s]));
    const thumbnailMap = new Map<string, Thumbnail>(thumbnails.map((t) => [t.id, t]));
    const pinnedCommentMap = new Map<string, PinnedComment>(pinnedComments.map((p) => [p.id, p]));
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
    const publishingMap = new Map<string, Publishing>(publishingRecords.map((p) => [p.id, p]));
    const contentMasterMap = new Map<string, ContentMaster>(contentMasters.map((c: any) => [c.id, c]));
    const draftMap = new Map<string, QuestionDraft>(questionDrafts.map((d: any) => [d.id, d]));
    const contentPlanMap = new Map<string, any>(contentPlans.map((cp: any) => [cp.id, cp]));
    const contentBatchMap = new Map<string, any>(contentBatches.map((cb: any) => [cb.id, cb]));
    const socialReviewMap = new Map<string, any>(socialReviews.map((sr: any) => [sr.id, sr]));

    // =========================================================================
    // A. ID INTEGRITY CHECKS ACROSS ALL FIRESTORE COLLECTIONS
    // =========================================================================
    const checkCollectionIds = (
      collectionName: string,
      items: any[],
      idField: string = 'id',
      expectedPrefix?: string,
      allowedLegacyPrefixes?: string[],
      customValidator?: (id: string) => boolean
    ) => {
      const seenIds = new Set<string>();

      items.forEach((item, index) => {
        const id = item ? item[idField] : undefined;
        const recIndex = index + 1;

        if (id === undefined || id === null || String(id).trim() === '') {
          addIssue(
            'CRITICAL',
            'ID_INTEGRITY',
            collectionName,
            `Document at index ${recIndex} in collection "${collectionName}" is missing primary identifier (${idField}).`,
            `Manually assign a unique primary ID to document at index ${recIndex} in collection "${collectionName}".`,
            collectionName,
            `DOC-${recIndex}`,
            idField
          );
          return;
        }

        const idStr = String(id).trim();

        // Duplicate check
        if (seenIds.has(idStr.toLowerCase())) {
          addIssue(
            'ERROR',
            'ID_INTEGRITY',
            collectionName,
            `Duplicate primary ID "${idStr}" detected in collection "${collectionName}".`,
            `Locate duplicated ID "${idStr}" in "${collectionName}" and manually reassign a unique canonical ID.`,
            collectionName,
            idStr,
            idField
          );
        } else {
          seenIds.add(idStr.toLowerCase());
        }

        // Test artifacts classified as informational notice
        if (idStr.startsWith('TEST-')) {
          addIssue(
            'INFO',
            'ID_INTEGRITY',
            collectionName,
            `Record "${idStr}" is an automated test artifact and does not use standard prefix "${expectedPrefix}".`,
            `Automated test artifact record recognized. No production remediation required.`,
            collectionName,
            idStr,
            idField
          );
          return;
        }

        // Validation: use customValidator if provided, else check standard and legacy prefixes
        if (customValidator) {
          if (!customValidator(idStr)) {
            addIssue(
              'WARNING',
              'ID_INTEGRITY',
              collectionName,
              `ID "${idStr}" does not follow valid canonical or composite version format for "${collectionName}".`,
              `Ensure IDs in collection "${collectionName}" follow standard nomenclature starting with "${expectedPrefix}" or composite format "${expectedPrefix ? expectedPrefix.slice(0, 2) : ''}...-V#".`,
              collectionName,
              idStr,
              idField
            );
          }
        } else if (expectedPrefix && !idStr.startsWith(expectedPrefix)) {
          // Check if this is a recognized legacy historical prefix
          if (allowedLegacyPrefixes && allowedLegacyPrefixes.some((p) => idStr.startsWith(p))) {
            return; // Preserved immutable historical ID; valid legacy format
          }

          addIssue(
            'WARNING',
            'ID_INTEGRITY',
            collectionName,
            `ID "${idStr}" does not start with standard prefix "${expectedPrefix}".`,
            `Ensure IDs in collection "${collectionName}" follow standard nomenclature starting with "${expectedPrefix}".`,
            collectionName,
            idStr,
            idField
          );
        }
      });
    };

    checkCollectionIds(SHEET_TABS.USERS, users, 'id', 'usr_', ['USR-']);
    checkCollectionIds(SHEET_TABS.TOPICS, topics, 'id', 'top_', ['BP-TOP-']);
    checkCollectionIds(SHEET_TABS.SUBTOPICS, subtopics, 'id', 'sub_', ['BP-SUB-']);
    checkCollectionIds(SHEET_TABS.QUESTIONS, questions, 'id', 'qst_', ['BP-Q-', 'dft_']);
    checkCollectionIds(SHEET_TABS.QUESTION_VIDEOS, questionVideos, 'id', 'qv_', ['QV-']);
    checkCollectionIds(SHEET_TABS.VIDEOS, videos, 'id', 'vid_', ['BP-V-']);
    checkCollectionIds(SHEET_TABS.SCRIPT, scripts, 'id', 'scr_', ['BP-S-']);
    checkCollectionIds(
      SHEET_TABS.SCRIPT_VERSIONS,
      scriptVersions,
      'id',
      'scv_',
      ['BP-SCV-'],
      (id) => isValidVersionId(id, { canonicalPrefix: 'scv_', allowedParentPrefixes: ['scr_', 'BP-S-'], allowedLegacyPrefixes: ['BP-SCV-'] })
    );
    checkCollectionIds(SHEET_TABS.THUMBNAILS, thumbnails, 'id', 'thm_', ['BP-T-']);
    checkCollectionIds(
      SHEET_TABS.THUMBNAIL_VERSIONS,
      thumbnailVersions,
      'id',
      'thv_',
      ['BP-THV-'],
      (id) => isValidVersionId(id, { canonicalPrefix: 'thv_', allowedParentPrefixes: ['thm_', 'BP-T-'], allowedLegacyPrefixes: ['BP-THV-'] })
    );
    checkCollectionIds(SHEET_TABS.PINNED_COMMENTS, pinnedComments, 'id', 'pin_', ['BP-PIN-']);
    checkCollectionIds(
      SHEET_TABS.PINNED_COMMENT_VERSIONS,
      pinnedCommentVersions,
      'id',
      'pcv_',
      ['BP-PCV-'],
      (id) => isValidVersionId(id, { canonicalPrefix: 'pcv_', allowedParentPrefixes: ['pin_', 'BP-PIN-'], allowedLegacyPrefixes: ['BP-PCV-'] })
    );
    checkCollectionIds(SHEET_TABS.WORKFLOW, workflows, 'id', 'wfl_', ['WF-']);
    checkCollectionIds(SHEET_TABS.ASSIGNMENTS, assignments, 'id', 'asn_', ['ASG-', 'BP-ASN-']);
    checkCollectionIds(SHEET_TABS.PUBLISHING, publishingRecords, 'id', 'pub_', ['PUB-', 'BP-PUB-']);
    checkCollectionIds(SHEET_TABS.AUDIT_LOG, auditLogs, 'id', 'aud_', ['AUD-', 'LOG-']);
    checkCollectionIds(SHEET_TABS.CONTENT_MASTERS, contentMasters, 'id', 'cnt_', ['BP-CNT-']);
    checkCollectionIds(SHEET_TABS.SOCIAL_REVIEWS, socialReviews, 'id', 'rev_', ['BP-REV-']);
    checkCollectionIds(SHEET_TABS.CONTENT_PLANS, contentPlans, 'id', 'pln_', ['BP-PLN-']);
    checkCollectionIds(SHEET_TABS.CONTENT_BATCHES, contentBatches, 'id', 'bch_', ['BP-BCH-']);

    // =========================================================================
    // TAXONOMY INTEGRITY CHECKS (Topics & Subtopics Referential Integrity)
    // =========================================================================
    if (topics.length === 0 && subtopics.length === 0) {
      addIssue(
        'INFO',
        'QUESTION_INTEGRITY',
        SHEET_TABS.TOPICS,
        'Taxonomy is currently empty. No topics or subtopics configured.',
        'Initialize syllabus taxonomy via Management & System -> Topics & Taxonomy (/settings?tab=taxonomy).',
        'TAXONOMY',
        'EMPTY'
      );
    } else {
      subtopics.forEach((sub) => {
        if (!sub.topicId || sub.topicId.trim() === '') {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.SUBTOPICS,
            `Subtopic "${sub.id}" (${sub.name || 'unnamed'}) is missing required topicId.`,
            `Assign a valid topicId to subtopic "${sub.id}".`,
            'SUBTOPIC',
            sub.id,
            'topicId'
          );
        } else if (!topicMap.has(sub.topicId)) {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.SUBTOPICS,
            `Subtopic "${sub.id}" (${sub.name || 'unnamed'}) references non-existent topic "${sub.topicId}".`,
            `Update topicId for subtopic "${sub.id}" to a valid topic ID, or create topic "${sub.topicId}".`,
            'SUBTOPIC',
            sub.id,
            'topicId'
          );
        }
      });
    }

    // =========================================================================
    // B. QUESTION INTEGRITY CHECKS
    // =========================================================================
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    questions.forEach((q) => {
      const isTestItem = Boolean(q.id && q.id.startsWith('TEST-'));

      if (!q.topicId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Test artifact question "${q.id}" has no topic_id.`,
            `No production remediation required for test artifact records.`,
            'QUESTION',
            q.id,
            'topicId'
          );
        } else {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" is missing required topic_id.`,
            `Set a valid Topic ID for question "${q.id}" in collection "questions".`,
            'QUESTION',
            q.id,
            'topicId'
          );
        }
      } else {
        const topic = topicMap.get(q.topicId);
        if (!topic) {
          if (isTestItem) {
            addIssue(
              'INFO',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Test artifact question "${q.id}" references non-existent topic_id "${q.topicId}".`,
              `No production remediation required for test artifact records.`,
              'QUESTION',
              q.id,
              'topicId'
            );
          } else {
            addIssue(
              'ERROR',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" references non-existent topic_id "${q.topicId}".`,
              `Update topic_id for question "${q.id}" to an existing topic in collection "topics".`,
              'QUESTION',
              q.id,
              'topicId'
            );
          }
        }
      }

      if (!q.subtopicId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Test artifact question "${q.id}" has no subtopic_id.`,
            `No production remediation required for test artifact records.`,
            'QUESTION',
            q.id,
            'subtopicId'
          );
        } else {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" is missing required subtopic_id.`,
            `Set a valid Subtopic ID for question "${q.id}" in collection "questions".`,
            'QUESTION',
            q.id,
            'subtopicId'
          );
        }
      } else {
        const subtopic = subtopicMap.get(q.subtopicId);
        if (!subtopic) {
          if (isTestItem) {
            addIssue(
              'INFO',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Test artifact question "${q.id}" references non-existent subtopic_id "${q.subtopicId}".`,
              `No production remediation required for test artifact records.`,
              'QUESTION',
              q.id,
              'subtopicId'
            );
          } else {
            addIssue(
              'ERROR',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" references non-existent subtopic_id "${q.subtopicId}".`,
              `Update subtopic_id for question "${q.id}" to an existing subtopic in collection "subtopics".`,
              'QUESTION',
              q.id,
              'subtopicId'
            );
          }
        } else if (q.topicId && subtopic.topicId !== q.topicId) {
          // Hierarchy violation: Subtopic belongs to different Topic
          if (isTestItem) {
            addIssue(
              'INFO',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Hierarchy mismatch in test artifact question "${q.id}": Subtopic "${q.subtopicId}" belongs to Topic "${subtopic.topicId}", but question is assigned to Topic "${q.topicId}".`,
              `No production remediation required for test artifact records.`,
              'QUESTION',
              q.id,
              'subtopicId'
            );
          } else {
            addIssue(
              'ERROR',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Hierarchy mismatch: Subtopic "${q.subtopicId}" belongs to Topic "${subtopic.topicId}", but question "${q.id}" is assigned to Topic "${q.topicId}".`,
              `Align topic_id and subtopic_id for question "${q.id}" in collection "questions".`,
              'QUESTION',
              q.id,
              'subtopicId'
            );
          }
        }
      }

      // 2. Question Text & Options
      if (!q.questionText || q.questionText.trim() === '') {
        addIssue(
          'CRITICAL',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has empty or missing question text.`,
          `Provide full question text content for "${q.id}" in collection "questions".`,
          'QUESTION',
          q.id,
          'questionText'
        );
      }

      const optList: string[] = q.options
        ? Array.isArray(q.options)
          ? (q.options as string[])
          : [q.options.a, q.options.b, q.options.c, q.options.d]
        : [];

      if (!q.options || optList.length < 4 || optList.some((o) => !o || String(o).trim() === '')) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has incomplete options (${optList.filter((o) => Boolean(o && String(o).trim())).length}/4 valid options defined).`,
          `Ensure question "${q.id}" defines 4 distinct non-empty multiple-choice options (A, B, C, D).`,
          'QUESTION',
          q.id,
          'options'
        );
      } else {
        // Duplicate options check
        const optTexts = optList.map((o) => (typeof o === 'string' ? o.trim().toLowerCase() : String(o || '').trim().toLowerCase()));
        const uniqueOptTexts = new Set(optTexts.filter((t) => t.length > 0));
        if (uniqueOptTexts.size < optList.length) {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" contains duplicate options text.`,
            `Review options for question "${q.id}" and ensure all 4 choices are unique.`,
            'QUESTION',
            q.id,
            'options'
          );
        }
      }

      // 3. Correct Answer Validity
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === '') {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has missing correct_answer.`,
          `Specify the correct answer (e.g. "A", "B", "C", "D" or matching text) for question "${q.id}".`,
          'QUESTION',
          q.id,
          'correctAnswer'
        );
      }

      // 4. Status Enums
      if (!Object.values(QuestionStatus).includes(q.status)) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has invalid status "${q.status}".`,
          `Update question "${q.id}" status to one of: ${Object.values(QuestionStatus).join(', ')}.`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.videoStatus && !Object.values(VideoProductionStatus).includes(q.videoStatus)) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has invalid video_status "${q.videoStatus}".`,
          `Update question "${q.id}" video_status to one of: ${Object.values(VideoProductionStatus).join(', ')}.`,
          'QUESTION',
          q.id,
          'videoStatus'
        );
      }

      // 5. Cross-Lifecycle & Stale Checks
      const qVideos = questionVideos.filter((qv) => qv.questionId === q.id);
      const activeVideos = qVideos
        .map((qv) => videoMap.get(qv.videoId))
        .filter((v) => v && v.status !== VideoProductionStatus.CANCELLED);

      if (q.status === QuestionStatus.APPROVED && qVideos.length === 0) {
        addIssue(
          'INFO',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Approved question "${q.id}" is not yet queued in video production.`,
          `Navigate to Video Queue or Question Details to enqueue "${q.id}".`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.status === QuestionStatus.REJECTED && activeVideos.length > 0) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" is marked REJECTED but has active video production in progress (${activeVideos.map((v) => v?.id).join(', ')}).`,
          `Either cancel active videos or restore question status from REJECTED.`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.createdAt) {
        const createdTime = new Date(q.createdAt).getTime();
        if (!isNaN(createdTime) && now - createdTime > THIRTY_DAYS_MS) {
          if (q.status === QuestionStatus.GENERATED || q.status === QuestionStatus.DRAFT) {
            addIssue(
              'WARNING',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" has been in GENERATED/DRAFT status for over 30 days without review.`,
              `Review or archive aged draft question "${q.id}".`,
              'QUESTION',
              q.id,
              'createdAt'
            );
          } else if (q.status === QuestionStatus.EDITING) {
            addIssue(
              'WARNING',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" has been in EDITING status for over 30 days.`,
              `Finalize review or release question "${q.id}".`,
              'QUESTION',
              q.id,
              'createdAt'
            );
          }
        }
      }
    });

    // =========================================================================
    // C. VIDEO INTEGRITY CHECKS
    // =========================================================================
    const questionToVideosCount = new Map<string, string[]>();

    videos.forEach((v) => {
      const isTestItem = Boolean(v.id && v.id.startsWith('TEST-'));

      // 1. Missing Question Reference
      if (!v.questionId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Test artifact video "${v.id}" has missing question_id.`,
            `No production remediation required for test artifact records.`,
            'VIDEO',
            v.id,
            'questionId'
          );
        } else {
          addIssue(
            'ERROR',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Video "${v.id}" has missing question_id.`,
            `Link video "${v.id}" to an authoritative Question ID in collection "videos".`,
            'VIDEO',
            v.id,
            'questionId'
          );
        }
      } else if (!questionMap.has(v.questionId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Test artifact video "${v.id}" points to non-existent question_id "${v.questionId}".`,
            `No production remediation required for test artifact records.`,
            'VIDEO',
            v.id,
            'questionId'
          );
        } else {
          addIssue(
            'ERROR',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Video "${v.id}" points to non-existent question_id "${v.questionId}".`,
            `Update question_id for video "${v.id}" to an existing question in collection "questions".`,
            'VIDEO',
            v.id,
            'questionId'
          );
        }
      } else {
        // Track active videos per question
        if (v.status !== VideoProductionStatus.CANCELLED) {
          const list = questionToVideosCount.get(v.questionId) || [];
          list.push(v.id);
          questionToVideosCount.set(v.questionId, list);
        }
      }

      // 2. Status Validation
      if (!Object.values(VideoProductionStatus).includes(v.status)) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" has invalid status "${v.status}".`,
          `Set status for video "${v.id}" to a valid VideoProductionStatus enum.`,
          'VIDEO',
          v.id,
          'status'
        );
      }

      // 3. Required Metadata
      if (!v.title || v.title.trim() === '') {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" is missing a title.`,
          `Provide a video title for "${v.id}" in collection "videos".`,
          'VIDEO',
          v.id,
          'title'
        );
      }

      if (v.priority && !Object.values(PriorityLevel).includes(v.priority)) {
        addIssue(
          'WARNING',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" has unknown priority level "${v.priority}".`,
          `Set priority to URGENT, HIGH, NORMAL, or LOW.`,
          'VIDEO',
          v.id,
          'priority'
        );
      }

      // 4. QUESTION_VIDEOS Relationship mapping
      const hasQvMapping = questionVideos.some((qv) => qv.videoId === v.id && qv.questionId === v.questionId);
      if (!hasQvMapping && v.questionId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'VIDEO_INTEGRITY',
            SHEET_TABS.QUESTION_VIDEOS,
            `Test artifact video "${v.id}" does not have a corresponding mapping document in collection "question_videos".`,
            `No production remediation required for test artifact records.`,
            'VIDEO',
            v.id,
            'id'
          );
        } else {
          addIssue(
            'WARNING',
            'VIDEO_INTEGRITY',
            SHEET_TABS.QUESTION_VIDEOS,
            `Video "${v.id}" does not have a corresponding mapping document in collection "question_videos".`,
            `Add relationship document (questionId: "${v.questionId}", videoId: "${v.id}") to collection "question_videos".`,
            'VIDEO',
            v.id,
            'id'
          );
        }
      }

      // 5. READY_TO_UPLOAD & UPLOADED Readiness verification
      if (v.status === VideoProductionStatus.READY_TO_UPLOAD) {
        const script = scripts.find((s) => s.videoId === v.id);
        const thumbnail = thumbnails.find((t) => t.videoId === v.id);
        if (!v.finalRenderPath && !v.driveFolderUrl) {
          addIssue(
            'WARNING',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Video "${v.id}" is in READY_TO_UPLOAD status but lacks final_render_path or drive_folder_url.`,
            `Attach cloud asset link or final render file path for video "${v.id}".`,
            'VIDEO',
            v.id,
            'finalRenderPath'
          );
        }
      }

      if (v.status === VideoProductionStatus.UPLOADED) {
        const pub = publishingRecords.find((p) => p.videoId === v.id);
        if (!pub) {
          addIssue(
            'WARNING',
            'VIDEO_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Video "${v.id}" is in UPLOADED status but has no publishing tracking record in collection "publishing_packages".`,
            `Create publishing record for video "${v.id}" in collection "publishing_packages".`,
            'VIDEO',
            v.id,
            'status'
          );
        }
      }
    });

    // Check duplicate active videos per question
    questionToVideosCount.forEach((videoIds, questionId) => {
      if (videoIds.length > 1) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Question "${questionId}" has multiple concurrent active video production entries: ${videoIds.join(', ')}.`,
          `Cancel duplicate active video records so only one active video represents question "${questionId}".`,
          'QUESTION',
          questionId,
          'id'
        );
      }
    });

    // =========================================================================
    // D. SCRIPT INTEGRITY CHECKS
    // =========================================================================
    const scriptVersionMap = new Map<string, ScriptVersion[]>();
    scriptVersions.forEach((sv) => {
      const isTestItem = Boolean(sv.id && sv.id.startsWith('TEST-'));
      if (!sv.scriptId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Test artifact script version "${sv.id}" is missing script_id reference.`,
            `No production remediation required for test artifact records.`,
            'SCRIPT_VERSION',
            sv.id,
            'scriptId'
          );
        } else {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Script version "${sv.id}" is missing script_id reference.`,
            `Link script version "${sv.id}" to a valid script_id in SCRIPT_VERSIONS.`,
            'SCRIPT_VERSION',
            sv.id,
            'scriptId'
          );
        }
      } else if (!scriptMap.has(sv.scriptId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Test artifact script version "${sv.id}" points to non-existent script_id "${sv.scriptId}".`,
            `No production remediation required for test artifact records.`,
            'SCRIPT_VERSION',
            sv.id,
            'scriptId'
          );
        } else {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Script version "${sv.id}" points to non-existent script_id "${sv.scriptId}".`,
            `Correct script_id in SCRIPT_VERSIONS for version "${sv.id}".`,
            'SCRIPT_VERSION',
            sv.id,
            'scriptId'
          );
        }
      } else {
        const list = scriptVersionMap.get(sv.scriptId) || [];
        list.push(sv);
        scriptVersionMap.set(sv.scriptId, list);
      }
    });

    scripts.forEach((s) => {
      const isTestItem = Boolean(s.id && s.id.startsWith('TEST-'));
      if (!s.videoId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT,
            `Test artifact script "${s.id}" is missing video_id reference.`,
            `No production remediation required for test artifact records.`,
            'SCRIPT',
            s.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT,
            `Script "${s.id}" is missing video_id reference.`,
            `Link script "${s.id}" to an existing video in collection "scripts".`,
            'SCRIPT',
            s.id,
            'videoId'
          );
        }
      } else if (!videoMap.has(s.videoId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT,
            `Test artifact script "${s.id}" points to non-existent video_id "${s.videoId}".`,
            `No production remediation required for test artifact records.`,
            'SCRIPT',
            s.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT,
            `Script "${s.id}" points to non-existent video_id "${s.videoId}".`,
            `Update video_id for script "${s.id}" to a valid video in collection "videos".`,
            'SCRIPT',
            s.id,
            'videoId'
          );
        }
      }

      // Version validation
      const versions = scriptVersionMap.get(s.id) || [];
      if (s.currentVersion === undefined || s.currentVersion === null || Number(s.currentVersion) <= 0) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT,
          `Script "${s.id}" has invalid current_version (${s.currentVersion}).`,
          `Set current_version >= 1 for script "${s.id}".`,
          'SCRIPT',
          s.id,
          'currentVersion'
        );
      }

      // Check duplicate version numbers
      const seenVerNums = new Set<number>();
      versions.forEach((v) => {
        if (seenVerNums.has(v.versionNumber)) {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Script "${s.id}" has duplicate version number v${v.versionNumber} in SCRIPT_VERSIONS.`,
            `Renumber or clean duplicate version entries for script "${s.id}".`,
            'SCRIPT',
            s.id,
            'versionNumber'
          );
        } else {
          seenVerNums.add(v.versionNumber);
        }
      });
    });

    // =========================================================================
    // E. THUMBNAIL INTEGRITY CHECKS
    // =========================================================================
    const thumbnailVersionMap = new Map<string, ThumbnailVersion[]>();
    thumbnailVersions.forEach((tv) => {
      const isTestItem = Boolean(tv.id && tv.id.startsWith('TEST-'));
      if (!tv.thumbnailId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAIL_VERSIONS,
            `Test artifact thumbnail version "${tv.id}" is missing thumbnail_id.`,
            `No production remediation required for test artifact records.`,
            'THUMBNAIL_VERSION',
            tv.id,
            'thumbnailId'
          );
        } else {
          addIssue(
            'ERROR',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAIL_VERSIONS,
            `Thumbnail version "${tv.id}" is missing thumbnail_id.`,
            `Link thumbnail version "${tv.id}" to a valid thumbnail_id in THUMBNAIL_VERSIONS.`,
            'THUMBNAIL_VERSION',
            tv.id,
            'thumbnailId'
          );
        }
      } else if (!thumbnailMap.has(tv.thumbnailId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAIL_VERSIONS,
            `Test artifact thumbnail version "${tv.id}" references non-existent thumbnail_id "${tv.thumbnailId}".`,
            `No production remediation required for test artifact records.`,
            'THUMBNAIL_VERSION',
            tv.id,
            'thumbnailId'
          );
        } else {
          addIssue(
            'ERROR',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAIL_VERSIONS,
            `Thumbnail version "${tv.id}" references non-existent thumbnail_id "${tv.thumbnailId}".`,
            `Correct thumbnail_id in THUMBNAIL_VERSIONS for version "${tv.id}".`,
            'THUMBNAIL_VERSION',
            tv.id,
            'thumbnailId'
          );
        }
      } else {
        const list = thumbnailVersionMap.get(tv.thumbnailId) || [];
        list.push(tv);
        thumbnailVersionMap.set(tv.thumbnailId, list);
      }
    });

    thumbnails.forEach((t) => {
      const isTestItem = Boolean(t.id && t.id.startsWith('TEST-'));
      if (!t.videoId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAILS,
            `Test artifact thumbnail "${t.id}" is missing video_id.`,
            `No production remediation required for test artifact records.`,
            'THUMBNAIL',
            t.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAILS,
            `Thumbnail "${t.id}" is missing video_id.`,
            `Link thumbnail "${t.id}" to a valid video in THUMBNAILS.`,
            'THUMBNAIL',
            t.id,
            'videoId'
          );
        }
      } else if (!videoMap.has(t.videoId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAILS,
            `Test artifact thumbnail "${t.id}" references non-existent video_id "${t.videoId}".`,
            `No production remediation required for test artifact records.`,
            'THUMBNAIL',
            t.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'THUMBNAIL_INTEGRITY',
            SHEET_TABS.THUMBNAILS,
            `Thumbnail "${t.id}" references non-existent video_id "${t.videoId}".`,
            `Update video_id for thumbnail "${t.id}" in THUMBNAILS.`,
            'THUMBNAIL',
            t.id,
            'videoId'
          );
        }
      }

      if (t.status === 'APPROVED' && !t.driveAssetUrl && !t.previewUrl) {
        addIssue(
          'WARNING',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAILS,
          `Thumbnail "${t.id}" is marked APPROVED but lacks drive_asset_url or preview_url.`,
          `Attach image asset link to approved thumbnail "${t.id}".`,
          'THUMBNAIL',
          t.id,
          'driveAssetUrl'
        );
      }
    });

    // =========================================================================
    // F. PINNED COMMENT INTEGRITY CHECKS
    // =========================================================================
    const pinnedCommentVersionMap = new Map<string, PinnedCommentVersion[]>();
    pinnedCommentVersions.forEach((pv) => {
      const isTestItem = Boolean(pv.id && pv.id.startsWith('TEST-'));
      if (!pv.pinnedCommentId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENT_VERSIONS,
            `Test artifact pinned comment version "${pv.id}" is missing pinned_comment_id.`,
            `No production remediation required for test artifact records.`,
            'PINNED_COMMENT_VERSION',
            pv.id,
            'pinnedCommentId'
          );
        } else {
          addIssue(
            'ERROR',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENT_VERSIONS,
            `Pinned comment version "${pv.id}" is missing pinned_comment_id.`,
            `Set pinned_comment_id for version document "${pv.id}".`,
            'PINNED_COMMENT_VERSION',
            pv.id,
            'pinnedCommentId'
          );
        }
      } else if (!pinnedCommentMap.has(pv.pinnedCommentId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENT_VERSIONS,
            `Test artifact pinned comment version "${pv.id}" references non-existent comment "${pv.pinnedCommentId}".`,
            `No production remediation required for test artifact records.`,
            'PINNED_COMMENT_VERSION',
            pv.id,
            'pinnedCommentId'
          );
        } else {
          addIssue(
            'ERROR',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENT_VERSIONS,
            `Pinned comment version "${pv.id}" references non-existent comment "${pv.pinnedCommentId}".`,
            `Fix pinned_comment_id in PINNED_COMMENT_VERSIONS for "${pv.id}".`,
            'PINNED_COMMENT_VERSION',
            pv.id,
            'pinnedCommentId'
          );
        }
      }
    });

    pinnedComments.forEach((p) => {
      const isTestItem = Boolean(p.id && p.id.startsWith('TEST-'));
      if (!p.videoId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENTS,
            `Test artifact pinned comment "${p.id}" is missing video_id.`,
            `No production remediation required for test artifact records.`,
            'PINNED_COMMENT',
            p.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENTS,
            `Pinned comment "${p.id}" is missing video_id.`,
            `Link pinned comment "${p.id}" to a valid video in PINNED_COMMENTS.`,
            'PINNED_COMMENT',
            p.id,
            'videoId'
          );
        }
      } else if (!videoMap.has(p.videoId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENTS,
            `Test artifact pinned comment "${p.id}" points to non-existent video "${p.videoId}".`,
            `No production remediation required for test artifact records.`,
            'PINNED_COMMENT',
            p.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'PINNED_COMMENT_INTEGRITY',
            SHEET_TABS.PINNED_COMMENTS,
            `Pinned comment "${p.id}" points to non-existent video "${p.videoId}".`,
            `Update video_id for pinned comment "${p.id}".`,
            'PINNED_COMMENT',
            p.id,
            'videoId'
          );
        }
      }

      if (!p.commentText || p.commentText.trim() === '') {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENTS,
          `Pinned comment "${p.id}" has empty comment_text.`,
          `Provide pinned comment text for "${p.id}".`,
          'PINNED_COMMENT',
          p.id,
          'commentText'
        );
      }
    });

    // =========================================================================
    // G. PUBLISHING INTEGRITY CHECKS
    // =========================================================================
    const publishingSeenVideos = new Set<string>();

    publishingRecords.forEach((pub) => {
      const isTestItem = Boolean(pub.id && pub.id.startsWith('TEST-'));
      if (!pub.videoId) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Test artifact publishing record "${pub.id}" has missing video_id.`,
            `No production remediation required for test artifact records.`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" has missing video_id.`,
            `Set video_id for publishing document "${pub.id}" in collection "publishing_packages".`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        }
      } else if (!videoMap.has(pub.videoId)) {
        if (isTestItem) {
          addIssue(
            'INFO',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Test artifact publishing record "${pub.id}" points to non-existent video_id "${pub.videoId}".`,
            `No production remediation required for test artifact records.`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        } else {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" points to non-existent video_id "${pub.videoId}".`,
            `Update video_id for publishing record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        }
      } else {
        if (publishingSeenVideos.has(pub.videoId)) {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Duplicate publishing record detected for video "${pub.videoId}".`,
            `Consolidate duplicate publishing records for video "${pub.videoId}".`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        } else {
          publishingSeenVideos.add(pub.videoId);
        }
      }

      // Check YouTube publication consistency
      if (pub.youtube?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.youtube.videoUrl || pub.youtube.videoUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks YouTube as PUBLISHED but is missing youtube_video_url.`,
            `Provide the live YouTube Shorts URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'youtube.videoUrl'
          );
        }
        if (!pub.youtube.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks YouTube as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for YouTube on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'youtube.publishedAt'
          );
        }
      }

      // Check Instagram publication consistency
      if (pub.instagram?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.instagram.postUrl || pub.instagram.postUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Instagram as PUBLISHED but is missing instagram_post_url.`,
            `Provide the live Instagram Reels URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'instagram.postUrl'
          );
        }
        if (!pub.instagram.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Instagram as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for Instagram on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'instagram.publishedAt'
          );
        }
      }

      // Check Facebook publication consistency
      if (pub.facebook?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.facebook.postUrl || pub.facebook.postUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Facebook as PUBLISHED but is missing facebook_post_url.`,
            `Provide the live Facebook Reels URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'facebook.postUrl'
          );
        }
        if (!pub.facebook.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Facebook as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for Facebook on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'facebook.publishedAt'
          );
        }
      }
    });

    // =========================================================================
    // H. WORKFLOW INTEGRITY CHECKS
    // =========================================================================
    workflows.forEach((wf: any) => {
      // 1. Entity Reference Resolution
      if (!wf.entityId || typeof wf.entityId !== 'string' || wf.entityId.trim() === '') {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" is missing entity_id.`,
          `Link workflow record "${wf.id}" to an entity_id.`,
          'WORKFLOW',
          wf.id,
          'entityId'
        );
      } else {
        const isResolved =
          questionMap.has(wf.entityId) ||
          videoMap.has(wf.entityId) ||
          draftMap.has(wf.entityId) ||
          contentMasterMap.has(wf.entityId) ||
          scriptMap.has(wf.entityId) ||
          publishingMap.has(wf.entityId) ||
          thumbnailMap.has(wf.entityId) ||
          contentPlanMap.has(wf.entityId) ||
          contentBatchMap.has(wf.entityId) ||
          socialReviewMap.has(wf.entityId);

        if (!isResolved) {
          const isSelfReferentialOrWorkflowId =
            wf.entityId === wf.id || wf.entityId.startsWith('wfl_') || wf.entityId.startsWith('WF-');

          if (isSelfReferentialOrWorkflowId) {
            addIssue(
              'WARNING',
              'WORKFLOW_INTEGRITY',
              SHEET_TABS.WORKFLOW,
              `Workflow record "${wf.id}" has a circular/invalid entity_id "${wf.entityId}" that references a workflow instance (${wf.entityId === wf.id ? 'self-reference' : 'wfl_ prefix'}) instead of a content entity (Question, Draft, Video, Script, Content Master, Plan, Batch, or Publishing Package).`,
              `In Firestore collection "workflow_instances", inspect document "${wf.id}". Either reassign entity_id to the target content entity (e.g. qst_..., vid_..., scr_...) or remove this placeholder/orphan workflow record if no content exists.`,
              'WORKFLOW',
              wf.id,
              'entityId'
            );
          } else {
            addIssue(
              'WARNING',
              'WORKFLOW_INTEGRITY',
              SHEET_TABS.WORKFLOW,
              `Workflow record "${wf.id}" refers to entity_id "${wf.entityId}" (entityType: "${wf.entityType || 'UNSPECIFIED'}") not found in registered entities (Questions, Drafts, Videos, Content Masters, Scripts, Publishing Packages, Content Plans, or Content Batches).`,
              `Verify whether entity "${wf.entityId}" was archived, deleted, or never persisted in Firestore. Reassign entity_id to a valid entity or clean up orphan workflow record "${wf.id}".`,
              'WORKFLOW',
              wf.id,
              'entityId'
            );
          }
        }
      }

      // 2. Discriminator & Status Validation: Canonical 15-stage instance vs. Legacy transition record
      const isCanonicalCandidate =
        typeof wf.currentStep === 'number' ||
        (typeof wf.id === 'string' && wf.id.startsWith('wfl_')) ||
        (typeof wf.contentStatus === 'string' && !wf.toStatus);

      const isLegacyCandidate =
        typeof wf.toStatus === 'string' ||
        (typeof wf.id === 'string' && wf.id.startsWith('WF-')) ||
        (typeof wf.fromStatus === 'string' && !wf.currentStep);

      if (isCanonicalCandidate && isLegacyCandidate && typeof wf.currentStep === 'number' && typeof wf.toStatus === 'string') {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" ambiguously contains both canonical 15-stage instance fields (currentStep) and legacy transition fields (toStatus).`,
          `Normalize workflow document to either canonical WorkflowInstanceDocument or legacy transition record.`,
          'WORKFLOW',
          wf.id,
          'id'
        );
      } else if (isCanonicalCandidate) {
        // Canonical 15-stage instance validation
        if (
          wf.currentStep === undefined ||
          wf.currentStep === null ||
          !Number.isInteger(wf.currentStep) ||
          wf.currentStep < 1 ||
          wf.currentStep > 15
        ) {
          addIssue(
            'ERROR',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Canonical workflow instance "${wf.id}" has invalid or out-of-range currentStep (${wf.currentStep}). Must be an integer between 1 and 15.`,
            `Set currentStep between 1 and 15 on workflow instance "${wf.id}".`,
            'WORKFLOW',
            wf.id,
            'currentStep'
          );
        }

        if (!wf.contentStatus || typeof wf.contentStatus !== 'string' || wf.contentStatus.trim() === '') {
          addIssue(
            'ERROR',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Canonical workflow instance "${wf.id}" is missing required contentStatus.`,
            `Provide contentStatus (e.g. DRAFT, IN_REVIEW, APPROVED) for workflow instance "${wf.id}".`,
            'WORKFLOW',
            wf.id,
            'contentStatus'
          );
        }

        if (!wf.jobStatus || typeof wf.jobStatus !== 'string' || wf.jobStatus.trim() === '') {
          addIssue(
            'WARNING',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Canonical workflow instance "${wf.id}" is missing required jobStatus.`,
            `Set jobStatus (IDLE, QUEUED, PROCESSING, COMPLETED, FAILED) for workflow instance "${wf.id}".`,
            'WORKFLOW',
            wf.id,
            'jobStatus'
          );
        }
      } else if (isLegacyCandidate) {
        // Legacy transition record validation
        if (!wf.toStatus || typeof wf.toStatus !== 'string' || wf.toStatus.trim() === '') {
          addIssue(
            'ERROR',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Legacy workflow record "${wf.id}" is missing to_status.`,
            `Provide to_status for workflow transition "${wf.id}".`,
            'WORKFLOW',
            wf.id,
            'toStatus'
          );
        }

        // Terminal state transition violations
        if (wf.fromStatus === VideoProductionStatus.UPLOADED && wf.toStatus !== VideoProductionStatus.UPLOADED) {
          addIssue(
            'ERROR',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Workflow record "${wf.id}" represents an illegal transition from terminal state UPLOADED to "${wf.toStatus}".`,
            `Review workflow history in collection "workflow_instances" for entity "${wf.entityId}".`,
            'WORKFLOW',
            wf.id,
            'toStatus'
          );
        }

        if (wf.fromStatus === VideoProductionStatus.CANCELLED && wf.toStatus !== VideoProductionStatus.CANCELLED) {
          addIssue(
            'ERROR',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Workflow record "${wf.id}" represents an illegal transition from terminal state CANCELLED to "${wf.toStatus}".`,
            `Review workflow history in collection "workflow_instances" for entity "${wf.entityId}".`,
            'WORKFLOW',
            wf.id,
            'toStatus'
          );
        }
      } else {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow document "${wf.id}" does not conform to either canonical 15-stage WorkflowInstanceDocument or legacy transition record schema.`,
          `Ensure document in collection "workflow_instances" adheres to canonical WorkflowInstanceDocument or legacy transition record.`,
          'WORKFLOW',
          wf.id,
          'id'
        );
      }
    });

    // =========================================================================
    // I. AUDIT LOG INTEGRITY CHECKS
    // =========================================================================
    auditLogs.forEach((log) => {
      if (!log.entityId || log.entityId.trim() === '') {
        addIssue(
          'WARNING',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has empty entity_id.`,
          `Ensure administrative audit logs record target entity_id.`,
          'AUDIT_LOG',
          log.id,
          'entityId'
        );
      }

      const actionName = (log.action || log.eventType || '').trim();
      if (!actionName) {
        addIssue(
          'ERROR',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has empty action name.`,
          `Specify administrative action in audit log "${log.id}".`,
          'AUDIT_LOG',
          log.id,
          'action'
        );
      }

      if (!log.timestamp || isNaN(new Date(log.timestamp).getTime())) {
        addIssue(
          'WARNING',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has missing or invalid timestamp.`,
          `Provide ISO-8601 timestamp for audit log "${log.id}".`,
          'AUDIT_LOG',
          log.id,
          'timestamp'
        );
      }
    });

    // J. Entity ID sequences are permanently decommissioned (Sprint 6 Canonical UUID IDs).

    // =========================================================================
    // K. ASSIGNMENT & TEAM INTEGRITY CHECKS (Phase 10)
    // =========================================================================

    // Check USERS
    users.forEach((user) => {
      if (!user.name || user.name.trim() === '') {
        addIssue(
          'ERROR',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" is missing required name.`,
          `Specify user full name in collection "users" for "${user.id}".`,
          'USER',
          user.id,
          'name'
        );
      }
      if (!user.email || !user.email.includes('@')) {
        addIssue(
          'ERROR',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" has invalid or missing email (${user.email || 'EMPTY'}).`,
          `Provide valid email for user "${user.id}".`,
          'USER',
          user.id,
          'email'
        );
      }
      if (!user.role) {
        addIssue(
          'WARNING',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" is missing role.`,
          `Assign operational role to user "${user.id}".`,
          'USER',
          user.id,
          'role'
        );
      }
    });

    // Check ASSIGNMENTS
    const activeAssignmentsKey = new Set<string>();

    assignments.forEach((asn) => {
      // Check assignee presence
      if (!asn.assigneeId) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing assignee_id.`,
          `Assign assignment "${asn.id}" to a valid team user.`,
          'ASSIGNMENT',
          asn.id,
          'assigneeId'
        );
      } else {
        const user = userMap.get(asn.assigneeId);
        if (!user) {
          addIssue(
            'ERROR',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Assignment "${asn.id}" references non-existent user "${asn.assigneeId}".`,
            `Update assignee_id for assignment "${asn.id}" to point to an active user.`,
            'ASSIGNMENT',
            asn.id,
            'assigneeId'
          );
        } else if (!user.isActive && asn.status !== 'COMPLETED' && asn.status !== 'CANCELLED') {
          addIssue(
            'WARNING',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Active assignment "${asn.id}" is assigned to inactive user "${user.name}" (${user.id}).`,
            `Reassign assignment "${asn.id}" to an active team member.`,
            'ASSIGNMENT',
            asn.id,
            'assigneeId'
          );
        }
      }

      // Check target entity link
      const entityType = asn.entityType || 'VIDEO';
      const entityId = asn.entityId || asn.videoId;

      if (!entityId) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing target entity_id or video_id.`,
          `Link assignment "${asn.id}" to a valid target entity.`,
          'ASSIGNMENT',
          asn.id,
          'entityId'
        );
      } else {
        let entityExists = false;
        if (entityType === 'VIDEO' && videoMap.has(entityId)) entityExists = true;
        else if (entityType === 'QUESTION' && questionMap.has(entityId)) entityExists = true;
        else if (entityType === 'SCRIPT' && (scriptMap.has(entityId) || scripts.some((s) => s.videoId === entityId))) entityExists = true;
        else if (entityType === 'THUMBNAIL' && (thumbnailMap.has(entityId) || thumbnails.some((t) => t.videoId === entityId))) entityExists = true;
        else if (entityType === 'PUBLISHING' && (publishingMap.has(entityId) || publishingRecords.some((p) => p.videoId === entityId))) entityExists = true;
        else if (entityType === 'CONTENT_PLAN' || entityType === 'CONTENT_BATCH') entityExists = true;

        if (!entityExists && (entityType === 'VIDEO' || entityType === 'QUESTION')) {
          addIssue(
            'ERROR',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Assignment "${asn.id}" points to non-existent ${entityType} "${entityId}".`,
            `Verify or clean up orphan assignment "${asn.id}".`,
            'ASSIGNMENT',
            asn.id,
            'entityId'
          );
        }
      }

      // Check task_type
      if (!asn.taskType) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing task_type.`,
          `Specify task_type for assignment "${asn.id}".`,
          'ASSIGNMENT',
          asn.id,
          'taskType'
        );
      }

      // Check completed status consistency
      if (asn.status === 'COMPLETED' && !asn.completedAt) {
        addIssue(
          'WARNING',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is marked COMPLETED without a completed_at timestamp.`,
          `Set completed_at ISO timestamp for completed assignment "${asn.id}".`,
          'ASSIGNMENT',
          asn.id,
          'completedAt'
        );
      }

      // Check duplicate active assignment on same entity + taskType
      if (asn.status !== 'COMPLETED' && asn.status !== 'CANCELLED' && entityId && asn.taskType) {
        const key = `${entityType}:${entityId}:${asn.taskType}`;
        if (activeAssignmentsKey.has(key)) {
          addIssue(
            'WARNING',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Duplicate active assignment found for ${entityType} "${entityId}" with task "${asn.taskType}".`,
            `Consolidate duplicate active assignments for ${entityType} "${entityId}".`,
            'ASSIGNMENT',
            asn.id,
            'taskType'
          );
        } else {
          activeAssignmentsKey.add(key);
        }
      }
    });

    // =========================================================================
    // WORKSHEET HEALTH & CATEGORY AGGREGATION
    // =========================================================================
    const countByCollection = (name: string) => {
      switch (name) {
        case SHEET_TABS.USERS: return users.length;
        case SHEET_TABS.TOPICS: return topics.length;
        case SHEET_TABS.SUBTOPICS: return subtopics.length;
        case SHEET_TABS.QUESTIONS: return questions.length;
        case SHEET_TABS.QUESTION_VIDEOS: return questionVideos.length;
        case SHEET_TABS.VIDEOS: return videos.length;
        case SHEET_TABS.SCRIPT: return scripts.length;
        case SHEET_TABS.SCRIPT_VERSIONS: return scriptVersions.length;
        case SHEET_TABS.THUMBNAILS: return thumbnails.length;
        case SHEET_TABS.THUMBNAIL_VERSIONS: return thumbnailVersions.length;
        case SHEET_TABS.PINNED_COMMENTS: return pinnedComments.length;
        case SHEET_TABS.PINNED_COMMENT_VERSIONS: return pinnedCommentVersions.length;
        case SHEET_TABS.WORKFLOW: return workflows.length;
        case SHEET_TABS.ASSIGNMENTS: return assignments.length;
        case SHEET_TABS.PUBLISHING: return publishingRecords.length;
        case SHEET_TABS.AUDIT_LOG: return auditLogs.length;
        case SHEET_TABS.CONTENT_MASTERS: return contentMasters.length;
        case SHEET_TABS.SOCIAL_REVIEWS: return socialReviews.length;
        case SHEET_TABS.QUESTION_VALIDATIONS: return validations.length;
        case SHEET_TABS.QUESTION_CONFIG: return questionConfig.length;
        case SHEET_TABS.MEDIA_ASSETS: return mediaAssets.length;
        case SHEET_TABS.CONTENT_PLANS: return contentPlans.length;
        case SHEET_TABS.CONTENT_BATCHES: return contentBatches.length;
        default: return 0;
      }
    };

    const worksheetHealth: WorksheetHealthSummary[] = ALL_FIRESTORE_COLLECTIONS.map((colName) => {
      const sheetIssues = issues.filter((i) => i.worksheet === colName || i.collection === colName);
      const totalRecs = countByCollection(colName);
      const queryError = queryErrors.get(colName);
      const counts = computeDiagnosticCounts(sheetIssues);

      let status: 'PASS' | 'EMPTY' | 'WARNING' | 'ERROR' = 'PASS';
      if (queryError) {
        status = 'ERROR';
      } else if (counts.critical > 0 || counts.error > 0) {
        status = 'ERROR';
      } else if (counts.warning > 0) {
        status = 'WARNING';
      } else if (totalRecs === 0) {
        status = 'EMPTY';
      } else {
        status = 'PASS';
      }

      return {
        worksheet: colName,
        collection: colName,
        totalRecords: totalRecs,
        validRecords: Math.max(0, totalRecs - (counts.critical + counts.error)),
        issuesCount: counts.total,
        noticesCount: counts.info,
        status,
      };
    });

    const categoriesList: { category: IntegrityCategory; name: string; description: string }[] = [
      { category: 'ID_INTEGRITY', name: 'Primary & Canonical ID Integrity', description: 'Checks primary key presence, uniqueness, and canonical prefixes.' },
      { category: 'QUESTION_INTEGRITY', name: 'Question Taxonomy & Options Integrity', description: 'Validates category/topic/subtopic relations, options uniqueness, and workflow validity.' },
      { category: 'VIDEO_INTEGRITY', name: 'Video Production & Association Integrity', description: 'Checks question-video linkages, single active video constraint, and production readiness.' },
      { category: 'SCRIPT_INTEGRITY', name: 'Script & Version Chain Integrity', description: 'Verifies script-to-video mapping, version sequence numbering, and content readiness.' },
      { category: 'THUMBNAIL_INTEGRITY', name: 'Thumbnail & Asset Reference Integrity', description: 'Validates thumbnail asset URLs, status states, and version links.' },
      { category: 'PINNED_COMMENT_INTEGRITY', name: 'Pinned Comment & Version Integrity', description: 'Checks required comment content, video linking, and version records.' },
      { category: 'PUBLISHING_INTEGRITY', name: 'Manual Publishing Records Integrity', description: 'Validates URLs, published timestamps, platform statuses, and pre-flight readiness.' },
      { category: 'WORKFLOW_INTEGRITY', name: 'Workflow Lifecycle & State Machine Integrity', description: 'Validates state transitions, entity links, and terminal state invariants.' },
      { category: 'AUDIT_LOG_INTEGRITY', name: 'Administrative Audit Trail Integrity', description: 'Verifies logging format, timestamps, entity IDs, and action tracking.' },
      { category: 'ASSIGNMENT_INTEGRITY', name: 'Team Assignments & Entity Association', description: 'Validates assignee presence, active status, target entity links, and duplicate prevention.' },
      { category: 'USER_INTEGRITY', name: 'Team Directory & Role Assignment', description: 'Checks user profile completeness, role authorization, and active status.' },
    ];

    const integrityChecks: IntegrityCheckSummary[] = categoriesList.map((c) => {
      const catIssues = issues.filter((i) => i.category === c.category);
      const counts = computeDiagnosticCounts(catIssues);

      let status: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
      if (counts.critical > 0) status = 'CRITICAL';
      else if (counts.error > 0) status = 'ERROR';
      else if (counts.warning > 0) status = 'WARNING';

      return {
        category: c.category,
        name: c.name,
        description: c.description,
        status,
        totalChecked: 1,
        passedCount: status === 'PASS' ? 1 : 0,
        issueCount: counts.total,
        noticeCount: counts.info,
      };
    });

    const globalCounts = computeDiagnosticCounts(issues);

    let overallStatus: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
    if (globalCounts.critical > 0) overallStatus = 'CRITICAL';
    else if (globalCounts.error > 0) overallStatus = 'ERROR';
    else if (globalCounts.warning > 0) overallStatus = 'WARNING';

    const passedChecks = integrityChecks.filter((c) => c.status === 'PASS').length;
    const emptyCount = worksheetHealth.filter((w) => w.status === 'EMPTY').length;

    let summary = `All ${worksheetHealth.length} authoritative Cloud Firestore collections passed data integrity and referential checks.`;
    if (emptyCount > 0) {
      summary += ` (${emptyCount} unpopulated collection(s) valid for initial/reset environment).`;
    }
    if (overallStatus === 'CRITICAL') {
      summary = `Critical Firestore integrity failure: ${globalCounts.critical} critical schema/identifier errors require administrative attention.`;
    } else if (overallStatus === 'ERROR') {
      summary = `Operational referential errors detected: ${globalCounts.error} data integrity error(s) found across collections. Review diagnostic guidance.`;
    } else if (overallStatus === 'WARNING') {
      summary = `Firestore data integrity check passed with ${globalCounts.warning} operational warning(s). Stale or incomplete records detected.`;
    }

    return {
      generatedAt: new Date().toISOString(),
      overallStatus,
      summary,
      worksheetHealth,
      integrityChecks,
      issueCounts: {
        critical: globalCounts.critical,
        error: globalCounts.error,
        warning: globalCounts.warning,
        info: globalCounts.info,
        total: globalCounts.total,
        passedChecks,
        totalNotices: globalCounts.info,
      },
      issues,
      isReadOnly: true,
      mode: 'CLOUD_FIRESTORE',
    };
  }

  /**
   * Diagnostic alias for integrity verification runners.
   */
  public async runDiagnostics(): Promise<SystemHealthReport & { categoryReports: (IntegrityCheckSummary & { totalChecks?: number })[] }> {
    const report = await this.runFullIntegrityCheck();
    return {
      ...report,
      categoryReports: (report.integrityChecks || []).map((c) => ({
        ...c,
        totalChecks: c.totalChecked,
      })),
    };
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance();
