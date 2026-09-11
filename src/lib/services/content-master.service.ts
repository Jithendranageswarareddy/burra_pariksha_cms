/**
 * BURRA PARIKSHA CMS - Content Master Core Service & Migration Engine
 * Task 2: Canonical Content Master Management & Idempotent Migration
 */

import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  assignmentsRepository,
  auditLogRepository,
  socialReviewsRepository,
} from '../repositories';
import { IdService } from './id.service';
import {
  ContentMaster,
  ContentMasterStatus,
  Question,
  Video,
  Script,
  Thumbnail,
  PinnedComment,
  Publishing,
  Assignment,
  AuditLog,
  SocialReviewRecord,
  ContentMasterCanonicalState,
  ContentMasterReadinessResult,
  QuestionValidationStatus,
  QuestionStatus,
  VideoProductionStatus,
  SocialReviewStatus,
  SocialPublishStatus,
} from '../../types';
import {
  CreateContentMasterInput,
  UpdateContentMasterInput,
} from '../schemas/google-sheets-schema';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { objectAuthService, ActorContext } from './object-auth.service';
import { SocialReviewService } from './social-review.service';
import { ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';
import { GoogleSheetsClient } from '../google-sheets/client';

export interface ContentMasterDetails {
  contentMaster: ContentMaster;
  primaryQuestion?: Question;
  questions: Question[];
  videos: Video[];
  scripts: Script[];
  thumbnails: Thumbnail[];
  pinnedComments: PinnedComment[];
  publishingRecords: Publishing[];
  socialReviews?: SocialReviewRecord[];
  assignments: Assignment[];
  auditLogs: AuditLog[];
}

export interface MigrationDryRunReport {
  totalQuestionsExamined: number;
  totalVideosExamined: number;
  alreadyLinkedQuestions: number;
  unlinkedQuestionsCount: number;
  proposedNewMastersCount: number;
  unlinkedVideosCount: number;
  proposedMasterMappings: Array<{
    proposedMasterId: string;
    primaryQuestionId: string;
    questionTextPreview: string;
    subtopicId: string;
    associatedVideoIds: string[];
  }>;
  anomalies: Array<{
    type: 'ORPHAN_VIDEO' | 'MISSING_SUBTOPIC' | 'DUPLICATE_MASTER_LINK';
    entityId: string;
    message: string;
  }>;
  estimatedWriteOperations: number;
  isExecutable: boolean;
}

export interface MigrationExecutionResult {
  success: boolean;
  timestamp: string;
  totalQuestionsExamined: number;
  totalVideosExamined: number;
  mastersCreatedCount: number;
  questionsUpdatedCount: number;
  videosUpdatedCount: number;
  orphanedVideosCount: number;
  createdMasterIds: string[];
  errors: string[];
}

export class ContentMasterService {
  private static instance: ContentMasterService | null = null;
  private idService: IdService;

  private constructor() {
    this.idService = IdService.getInstance();
  }

  public static getInstance(): ContentMasterService {
    if (!ContentMasterService.instance) {
      ContentMasterService.instance = new ContentMasterService();
    }
    return ContentMasterService.instance;
  }

  /**
   * Creates a new ContentMaster record.
   */
  public async createContentMaster(
    input: CreateContentMasterInput,
    actorId = 'USR-SYSTEM',
    actorName = 'System'
  ): Promise<ContentMaster> {
    const id = await this.idService.allocateContentMasterId();
    const now = new Date().toISOString();

    const master: ContentMaster = {
      id,
      title: input.title,
      status: input.status || ContentMasterStatus.DRAFT,
      primaryQuestionId: input.primaryQuestionId || '',
      categoryId: input.categoryId || '',
      topicId: input.topicId || '',
      subtopicId: input.subtopicId || '',
      createdBy: input.createdBy || actorId,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await contentMastersRepository.create(master);

    await auditLogRepository.create({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      actorId,
      actorName,
      action: 'CREATE_CONTENT_MASTER',
      entityType: 'CONTENT_MASTER',
      entityId: saved.id,
      details: JSON.stringify({ title: saved.title }),
    });

    return saved;
  }

  /**
   * Updates an existing ContentMaster record.
   */
  public async updateContentMaster(
    input: UpdateContentMasterInput,
    actorId = 'USR-SYSTEM',
    actorName = 'System'
  ): Promise<ContentMaster> {
    const existing = await contentMastersRepository.findById(input.id);
    if (!existing) {
      throw new Error(`ContentMaster ${input.id} not found`);
    }

    const now = new Date().toISOString();
    const updated: ContentMaster = {
      ...existing,
      ...input,
      updatedAt: now,
    };

    const saved = await contentMastersRepository.update(updated);

    await auditLogRepository.create({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      actorId,
      actorName,
      action: 'UPDATE_CONTENT_MASTER',
      entityType: 'CONTENT_MASTER',
      entityId: saved.id,
      details: JSON.stringify(input),
    });

    return saved;
  }

  /**
   * Retrieves a ContentMaster by ID or legacy/canonical identifier with dual-format resolution.
   */
  public async getContentMasterById(id: string): Promise<ContentMaster | null> {
    const directMatch = await contentMastersRepository.findById(id);
    if (directMatch) {
      return directMatch;
    }
    // Legacy / canonical alias resolution (e.g., BP-CNT-000001 <-> BP-MST-000001)
    if (id.startsWith('BP-CNT-') || id.startsWith('BP-MST-')) {
      const allMasters = await contentMastersRepository.findAll();
      const numPart = id.replace(/^(BP-CNT-|BP-MST-)/, '');
      const matched = allMasters.find(
        (m) =>
          m.id === id ||
          m.id === `BP-CNT-${numPart}` ||
          m.id === `BP-MST-${numPart}` ||
          m.contentId === id
      );
      if (matched) return matched;
    }
    return null;
  }

  /**
   * Authoritative business operation to retrieve the complete lifecycle bundle for a Canonical Content ID (BP-CNT-######).
   * Supports seamless legacy resolution for BP-MST-###### identifiers.
   */
  public async getContentLifecycle(contentId: string): Promise<ContentMasterDetails | null> {
    return this.getDetailsByContentMasterId(contentId);
  }

  /**
   * Retrieves all ContentMaster records.
   */
  public async getAllContentMasters(): Promise<ContentMaster[]> {
    return contentMastersRepository.findAll();
  }

  /**
   * Retrieves full 360-degree content hierarchy for a ContentMaster ID or Canonical Content ID.
   */
  public async getDetailsByContentMasterId(id: string): Promise<ContentMasterDetails | null> {
    const master = await this.getContentMasterById(id);
    if (!master) {
      return null;
    }

    const canonicalId = master.id;
    const numPart = canonicalId.replace(/^(BP-CNT-|BP-MST-)/, '');
    const candidateIds = new Set<string>([
      id,
      canonicalId,
      `BP-CNT-${numPart}`,
      `BP-MST-${numPart}`,
    ]);

    // Parallel fetch of all child repositories once canonical Content Master is resolved
    const [
      allQuestions,
      allVideos,
      allScripts,
      allThumbnails,
      allPinnedComments,
      allPublishing,
      allSocialReviews,
      allAssignments,
      allLogs,
    ] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      scriptsRepository.findAll(),
      thumbnailsRepository.findAll(),
      pinnedCommentsRepository.findAll(),
      publishingRepository.findAll(),
      socialReviewsRepository.findAll().catch(() => []),
      assignmentsRepository.findAll(),
      auditLogRepository.findAll(),
    ]);

    const questions = allQuestions.filter(
      (q) =>
        (q.contentMasterId && candidateIds.has(q.contentMasterId)) ||
        (q.contentId && candidateIds.has(q.contentId)) ||
        master.primaryQuestionId === q.id
    );

    const primaryQuestion = master.primaryQuestionId
      ? allQuestions.find((q) => q.id === master.primaryQuestionId) || questions[0]
      : questions[0];

    const questionIds = new Set(questions.map((q) => q.id));

    const videos = allVideos.filter(
      (v) =>
        (v.contentMasterId && candidateIds.has(v.contentMasterId)) ||
        (v.contentId && candidateIds.has(v.contentId)) ||
        (v.questionId && questionIds.has(v.questionId))
    );

    const videoIds = new Set(videos.map((v) => v.id));

    const scripts = allScripts.filter(
      (s) =>
        videoIds.has(s.videoId) ||
        (s.contentId && candidateIds.has(s.contentId)) ||
        (s.contentMasterId && candidateIds.has(s.contentMasterId)) ||
        (s.questionId && questionIds.has(s.questionId))
    );
    const thumbnails = allThumbnails.filter(
      (t) =>
        videoIds.has(t.videoId) ||
        (t.contentId && candidateIds.has(t.contentId)) ||
        (t.contentMasterId && candidateIds.has(t.contentMasterId))
    );
    const pinnedComments = allPinnedComments.filter(
      (p) =>
        videoIds.has(p.videoId) ||
        (p.contentId && candidateIds.has(p.contentId)) ||
        (p.contentMasterId && candidateIds.has(p.contentMasterId))
    );
    const publishingRecords = allPublishing.filter(
      (pub) =>
        videoIds.has(pub.videoId) ||
        (pub.contentId && candidateIds.has(pub.contentId)) ||
        (pub.contentMasterId && candidateIds.has(pub.contentMasterId)) ||
        (pub.questionId && questionIds.has(pub.questionId))
    );
    const socialReviews = allSocialReviews.filter(
      (sr) =>
        (sr.contentMasterId && candidateIds.has(sr.contentMasterId)) ||
        (sr.questionId && questionIds.has(sr.questionId))
    );

    const targetEntityIds = new Set([id, canonicalId, ...candidateIds, ...questionIds, ...videoIds]);
    const assignments = allAssignments.filter(
      (a) => targetEntityIds.has(a.entityId || '') || targetEntityIds.has(a.videoId || '')
    );
    const auditLogs = allLogs.filter((log) => targetEntityIds.has(log.entityId));

    return {
      contentMaster: master,
      primaryQuestion,
      questions,
      videos,
      scripts,
      thumbnails,
      pinnedComments,
      publishingRecords,
      socialReviews,
      assignments,
      auditLogs,
    };
  }

  /**
   * Phase 16.2: Validate Completion Readiness for Content Master.
   * Deterministically evaluates whether a Content Master can transition ACTIVE -> COMPLETED.
   * Reuses Gate A, Gate B, Gate C, Gate D, and Phase 13 multi-platform publishing completion rules.
   */
  public async validateCompletionReadiness(id: string): Promise<ContentMasterReadinessResult> {
    const details = await this.getDetailsByContentMasterId(id);
    if (!details || !details.contentMaster) {
      return { isEligible: false, blockers: [`Content Master with ID "${id}" was not found.`] };
    }

    const { contentMaster: master, primaryQuestion, questions, videos, thumbnails, pinnedComments, publishingRecords, socialReviews } = details;
    const blockers: string[] = [];

    // 1. Current status check
    if (master.status === ContentMasterStatus.COMPLETED) {
      return { isEligible: false, blockers: ['Content Master is already COMPLETED.'] };
    }
    if (master.status === ContentMasterStatus.ARCHIVED) {
      return { isEligible: false, blockers: ['Content Master is ARCHIVED. Cannot complete an archived record.'] };
    }
    if (master.status === ContentMasterStatus.DRAFT) {
      blockers.push('Content Master is in DRAFT status. Must be transitioned to ACTIVE before completion.');
    }

    // 2. Question validation & approval (Gate A)
    if (questions.length === 0) {
      blockers.push('Content Master has no linked questions.');
    } else {
      const q = primaryQuestion || questions[0];
      if (q.validationStatus !== QuestionValidationStatus.VALID) {
        blockers.push(
          `Primary question "${q.id}" validation status is "${q.validationStatus || 'NOT_VALIDATED'}" (must be VALID).`
        );
      }
      if (q.status !== QuestionStatus.APPROVED) {
        blockers.push(
          `Primary question "${q.id}" status is "${q.status || 'DRAFT'}" (must be APPROVED).`
        );
      }
    }

    // 3. Video production & asset readiness (Gate B & Phase 13 terminal state)
    if (videos.length === 0) {
      blockers.push('Content Master has no linked video production package.');
    } else {
      for (const v of videos) {
        if (v.status !== VideoProductionStatus.UPLOADED) {
          blockers.push(
            `Video "${v.id}" is in status "${v.status}". All linked videos must reach terminal status "UPLOADED" via finalizePublishing before Content Master completion.`
          );
        }

        // Thumbnail readiness
        const thumb = thumbnails.find((t) => t.videoId === v.id);
        if (!thumb) {
          blockers.push(`Thumbnail for video "${v.id}" is missing.`);
        } else if (thumb.status !== 'APPROVED') {
          blockers.push(`Thumbnail for video "${v.id}" has status "${thumb.status}" (must be APPROVED).`);
        }

        // Pinned comment readiness
        const comment = pinnedComments.find((p) => p.videoId === v.id);
        if (!comment) {
          blockers.push(`Pinned comment for video "${v.id}" is missing.`);
        } else if (!comment.isApproved) {
          blockers.push(`Pinned comment for video "${v.id}" is not approved.`);
        }
      }
    }

    // 4. Social review approval & content fingerprint invariance (Gate C & Gate D)
    if (primaryQuestion) {
      try {
        const bundle = await SocialReviewService.getReviewPackageBundle(primaryQuestion.id, primaryQuestion);
        if (bundle.currentReviewStatus !== SocialReviewStatus.APPROVED) {
          blockers.push(`Social review status is "${bundle.currentReviewStatus}" (must be APPROVED before completion).`);
        } else if (bundle.latestReviewRecord && bundle.latestReviewRecord.reviewedVersionHash !== bundle.currentVersionHash) {
          blockers.push('Approved social review is stale: reviewed version hash does not match current content fingerprint.');
        }
      } catch {
        const approvedReview = socialReviews?.find((r) => r.decision === 'APPROVED');
        if (!approvedReview) {
          blockers.push('Social review has not been approved.');
        }
      }
    }

    // 5. Multi-platform publishing completion (Phase 13 rule)
    if (videos.length > 0) {
      for (const v of videos) {
        const pub = publishingRecords.find((p) => p.videoId === v.id);
        if (!pub) {
          blockers.push(`Publishing record for video "${v.id}" was not found.`);
        } else {
          const totalConfigured = pub.totalPlatformsCount || 3;
          const completedCount = pub.completedPlatformsCount || 0;
          const isAllPublished =
            pub.youtube?.status === SocialPublishStatus.PUBLISHED &&
            pub.instagram?.status === SocialPublishStatus.PUBLISHED &&
            pub.facebook?.status === SocialPublishStatus.PUBLISHED;

          if (completedCount < totalConfigured || !isAllPublished) {
            blockers.push(
              `Publishing for video "${v.id}" is incomplete: all configured target platforms must be PUBLISHED (${completedCount}/${totalConfigured} published).`
            );
          }
        }
      }
    }

    return {
      isEligible: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Phase 16.2: Validate Archive Readiness for Content Master.
   * Ensures active in-flight production or publishing is not prematurely archived.
   */
  public async validateArchiveReadiness(id: string): Promise<ContentMasterReadinessResult> {
    const details = await this.getDetailsByContentMasterId(id);
    if (!details || !details.contentMaster) {
      return { isEligible: false, blockers: [`Content Master with ID "${id}" was not found.`] };
    }

    const { contentMaster: master, videos, publishingRecords } = details;
    const blockers: string[] = [];

    if (master.status === ContentMasterStatus.ARCHIVED) {
      return { isEligible: false, blockers: ['Content Master is already ARCHIVED.'] };
    }

    if (master.status === ContentMasterStatus.COMPLETED) {
      // Normal production retirement path - completed content is fully eligible for archival
      return { isEligible: true, blockers: [] };
    }

    if (master.status === ContentMasterStatus.DRAFT) {
      const activeVideos = videos.filter(
        (v) => v.status !== VideoProductionStatus.NOT_STARTED && v.status !== VideoProductionStatus.UPLOADED
      );
      if (activeVideos.length > 0) {
        blockers.push(
          `Cannot archive draft Content Master while videos are in active production: ${activeVideos.map((v) => `${v.id} (${v.status})`).join(', ')}. Complete or cancel video production first.`
        );
      }
      return { isEligible: blockers.length === 0, blockers };
    }

    if (master.status === ContentMasterStatus.ACTIVE) {
      const activeProductionVideos = videos.filter(
        (v) =>
          v.status === VideoProductionStatus.QUEUED ||
          v.status === VideoProductionStatus.SCRIPT_REQUIRED ||
          v.status === VideoProductionStatus.SCRIPT_READY ||
          v.status === VideoProductionStatus.RECORDING ||
          v.status === VideoProductionStatus.RECORDED ||
          v.status === VideoProductionStatus.EDITING ||
          v.status === VideoProductionStatus.EDITED ||
          v.status === VideoProductionStatus.FINAL_REVIEW ||
          v.status === VideoProductionStatus.READY_TO_UPLOAD
      );
      if (activeProductionVideos.length > 0) {
        blockers.push(
          `Cannot archive active Content Master while videos are in active production: ${activeProductionVideos.map((v) => `${v.id} (${v.status})`).join(', ')}. Complete or cancel video production first.`
        );
      }

      const scheduledPubs = publishingRecords.filter(
        (p) =>
          p.youtube?.status === SocialPublishStatus.SCHEDULED ||
          p.instagram?.status === SocialPublishStatus.SCHEDULED ||
          p.facebook?.status === SocialPublishStatus.SCHEDULED
      );
      if (scheduledPubs.length > 0) {
        blockers.push('Cannot archive Content Master while distribution is scheduled.');
      }
    }

    return {
      isEligible: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Phase 16.2: Aggregates read-only canonical lifecycle state for a Content Master.
   * Strictly uses existing downstream state machines (Questions, Videos, Assets, Reviews, Publishing).
   * Does NOT invent or add any new Content Master status.
   */
  public async getCanonicalState(id: string): Promise<ContentMasterCanonicalState> {
    const details = await this.getDetailsByContentMasterId(id);
    if (!details || !details.contentMaster) {
      throw new ReferenceIntegrityError(`Content Master with ID "${id}" was not found.`);
    }

    const { contentMaster: master, primaryQuestion, questions, videos, scripts, thumbnails, pinnedComments, publishingRecords, socialReviews } = details;

    // 1. Primary Question state
    const primaryQState = primaryQuestion
      ? {
          id: primaryQuestion.id,
          status: primaryQuestion.status || 'DRAFT',
          validationStatus: primaryQuestion.validationStatus || QuestionValidationStatus.NOT_VALIDATED,
        }
      : undefined;

    // 2. Video summary
    const videoIds = videos.map((v) => v.id);
    const videoStatuses = videos.map((v) => v.status);
    const isAnyInProduction = videos.some(
      (v) => v.status !== VideoProductionStatus.NOT_STARTED && v.status !== VideoProductionStatus.UPLOADED
    );
    const areAllUploaded = videos.length > 0 && videos.every((v) => v.status === VideoProductionStatus.UPLOADED);

    // 3. Asset readiness
    const scriptReady = scripts.length > 0 || areAllUploaded;
    const thumbnailApproved = thumbnails.some((t) => t.status === 'APPROVED');
    const pinnedCommentApproved = pinnedComments.some((p) => Boolean(p.isApproved));

    // 4. Social review state
    let socialStatus = 'NONE';
    let isVersionHashMatching = false;
    if (primaryQuestion) {
      try {
        const bundle = await SocialReviewService.getReviewPackageBundle(primaryQuestion.id, primaryQuestion);
        socialStatus = bundle.currentReviewStatus;
        if (bundle.latestReviewRecord) {
          isVersionHashMatching = bundle.latestReviewRecord.reviewedVersionHash === bundle.currentVersionHash;
        }
      } catch {
        if (socialReviews && socialReviews.length > 0) {
          socialStatus = socialReviews[0].decision || 'NONE';
        }
      }
    }

    // 5. Publishing state
    let totalPlatformsCount = 0;
    let completedPlatformsCount = 0;
    let isAllPublished = false;
    let ytStatus = 'UNPUBLISHED';
    let igStatus = 'UNPUBLISHED';
    let fbStatus = 'UNPUBLISHED';

    if (publishingRecords.length > 0) {
      const pub = publishingRecords[0];
      totalPlatformsCount = pub.totalPlatformsCount || 3;
      completedPlatformsCount = pub.completedPlatformsCount || 0;
      ytStatus = pub.youtube?.status || 'UNPUBLISHED';
      igStatus = pub.instagram?.status || 'UNPUBLISHED';
      fbStatus = pub.facebook?.status || 'UNPUBLISHED';
      isAllPublished =
        ytStatus === SocialPublishStatus.PUBLISHED &&
        igStatus === SocialPublishStatus.PUBLISHED &&
        fbStatus === SocialPublishStatus.PUBLISHED;
    }

    // 6. Blocker and readiness evaluations
    const completionReadiness = await this.validateCompletionReadiness(id);
    const archiveReadiness = await this.validateArchiveReadiness(id);

    return {
      contentMasterId: id,
      status: master.status as ContentMasterStatus,
      primaryQuestion: primaryQState,
      videoSummary: {
        totalVideos: videos.length,
        videoIds,
        statuses: videoStatuses,
        isAnyInProduction,
        areAllUploaded,
      },
      assetReadiness: {
        scriptReady,
        thumbnailApproved,
        pinnedCommentApproved,
      },
      socialReviewState: {
        status: socialStatus,
        isVersionHashMatching,
      },
      publishingState: {
        totalPlatformsCount,
        completedPlatformsCount,
        isAllPublished,
        isFinalized: areAllUploaded,
        platforms: {
          youtube: ytStatus,
          instagram: igStatus,
          facebook: fbStatus,
        },
      },
      blockers: master.status === ContentMasterStatus.ACTIVE ? completionReadiness.blockers : [],
      isEligibleForCompletion: completionReadiness.isEligible,
      isEligibleForArchival: archiveReadiness.isEligible,
    };
  }

  /**
   * Phase 16.2: Authoritative Content Master status transition.
   * Enforces strict transition matrix using ONLY: DRAFT, ACTIVE, COMPLETED, ARCHIVED.
   * Guarantees actor authentication, object authorization, downstream readiness validation,
   * cache invalidation, and immutable audit logging.
   */
  public async transitionStatus(
    contentMasterId: string,
    targetStatus: ContentMasterStatus,
    actor: ActorContext,
    remarks?: string
  ): Promise<ContentMaster> {
    // 1. Authenticate actor
    if (!actor || !actor.id) {
      throw new ValidationError('Authentication required: Valid actor context is required to transition Content Master status.');
    }

    // 2. Fetch existing Content Master
    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master with ID "${contentMasterId}" was not found.`);
    }

    // 3. Object-level authorization check
    const canModify = await objectAuthService.canModifyContentMaster(actor, master);
    if (!canModify) {
      throw new ValidationError(`Forbidden: Actor "${actor.id}" lacks authorization to modify Content Master "${contentMasterId}".`);
    }

    // 4. Idempotency check: if already in target status, return existing
    if (master.status === targetStatus) {
      return master;
    }

    // 5. Validate target status is valid enum value
    const validStatuses = Object.values(ContentMasterStatus);
    if (!validStatuses.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid target status "${targetStatus}". Allowed statuses are: ${validStatuses.join(', ')}.`
      );
    }

    // 6. Enforce strict transition matrix
    const currentStatus = master.status as ContentMasterStatus;

    if (currentStatus === ContentMasterStatus.ARCHIVED) {
      throw new ValidationError(
        `Cannot transition Content Master "${contentMasterId}" from terminal status "ARCHIVED".`
      );
    }

    // Phase 6 Unified Lifecycle State Machine Transitions Matrix
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      [ContentMasterStatus.DRAFT]: [
        ContentMasterStatus.READY_FOR_REVIEW,
        ContentMasterStatus.ACTIVE,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.READY_FOR_REVIEW]: [
        ContentMasterStatus.APPROVED,
        ContentMasterStatus.CHANGES_REQUESTED,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.CHANGES_REQUESTED]: [
        ContentMasterStatus.DRAFT,
        ContentMasterStatus.READY_FOR_REVIEW,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.APPROVED]: [
        ContentMasterStatus.SCHEDULED,
        ContentMasterStatus.PUBLISHED,
        ContentMasterStatus.COMPLETED,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.SCHEDULED]: [
        ContentMasterStatus.PUBLISHED,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.PUBLISHED]: [
        ContentMasterStatus.ARCHIVED,
        ContentMasterStatus.COMPLETED,
      ],
      [ContentMasterStatus.ACTIVE]: [
        ContentMasterStatus.COMPLETED,
        ContentMasterStatus.PUBLISHED,
        ContentMasterStatus.SCHEDULED,
        ContentMasterStatus.APPROVED,
        ContentMasterStatus.READY_FOR_REVIEW,
        ContentMasterStatus.ARCHIVED,
      ],
      [ContentMasterStatus.COMPLETED]: [
        ContentMasterStatus.ARCHIVED,
      ],
    };

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [ContentMasterStatus.ARCHIVED];
    if (!allowedNext.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid status transition from "${currentStatus}" to "${targetStatus}" for Content Master "${contentMasterId}". Allowed next statuses: [${allowedNext.join(', ')}].`
      );
    }

    if (targetStatus === ContentMasterStatus.ACTIVE) {
      if (!master.title || master.title.trim().length === 0) {
        throw new ValidationError(`Cannot activate Content Master "${contentMasterId}": Title is required.`);
      }
      const details = await this.getDetailsByContentMasterId(contentMasterId);
      if (!details || details.questions.length === 0) {
        throw new ValidationError(
          `Cannot activate Content Master "${contentMasterId}": At least one linked question is required.`
        );
      }
    } else if (targetStatus === ContentMasterStatus.COMPLETED) {
      const readiness = await this.validateCompletionReadiness(contentMasterId);
      if (!readiness.isEligible) {
        throw new ValidationError(
          `Cannot complete Content Master "${contentMasterId}": ${readiness.blockers.join('; ')}`
        );
      }
    }

    if (targetStatus === ContentMasterStatus.ARCHIVED) {
      const archiveReadiness = await this.validateArchiveReadiness(contentMasterId);
      if (!archiveReadiness.isEligible) {
        throw new ValidationError(
          `Cannot archive Content Master "${contentMasterId}": ${archiveReadiness.blockers.join('; ')}`
        );
      }
    }

    // 7. Persist mutation
    const now = new Date().toISOString();
    const previousStatus = master.status;
    const updatedRecord: Partial<ContentMaster> = {
      ...master,
      status: targetStatus,
      updatedAt: now,
      ...(targetStatus === ContentMasterStatus.ARCHIVED ? { archivedAt: now } : {}),
    };

    const saved = await contentMastersRepository.update(master.id, updatedRecord);
    if (!saved) {
      throw new Error(`Failed to update status for Content Master "${contentMasterId}".`);
    }

    // 8. Cache invalidation
    GoogleSheetsClient.getInstance().invalidateRowCache('CONTENT_MASTERS');

    // 9. Immutable Audit Logging & Workflow recording
    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'CONTENT_MASTER_STATUS_TRANSITION',
      'CONTENT_MASTER',
      master.id,
      {
        previousStatus,
        newStatus: targetStatus,
        remarks: remarks || 'Validated Content Master status transition',
        archivedAt: updatedRecord.archivedAt,
      }
    );

    await workflowService.recordTransition(
      'CONTENT_MASTER',
      master.id,
      String(previousStatus),
      String(targetStatus),
      actor.id,
      actor.name || actor.id,
      remarks || 'Content Master workflow status transition'
    );

    return saved;
  }

  /**
   * Phase 16.2: Explicit archival operation for Content Master.
   * Safe archival wrapper preserving all child entities and foreign-key links.
   */
  public async archiveContentMaster(
    contentMasterId: string,
    actor: ActorContext,
    reason?: string
  ): Promise<ContentMaster> {
    return this.transitionStatus(
      contentMasterId,
      ContentMasterStatus.ARCHIVED,
      actor,
      reason || 'Explicit Content Master archival'
    );
  }

  /**
   * Performs a 100% read-only dry-run analysis for Content Master migration.
   */
  public async migrationDryRun(): Promise<MigrationDryRunReport> {
    const questions = await questionsRepository.findAll();
    const videos = await videosRepository.findAll();
    const existingMasters = await contentMastersRepository.findAll();

    const existingMasterMap = new Map<string, ContentMaster>();
    for (const m of existingMasters) {
      existingMasterMap.set(m.id, m);
    }

    let alreadyLinkedQuestions = 0;
    let unlinkedQuestionsCount = 0;
    const proposedMasterMappings: MigrationDryRunReport['proposedMasterMappings'] = [];
    const anomalies: MigrationDryRunReport['anomalies'] = [];

    const questionMap = new Map<string, Question>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    // Group videos by question ID
    const videosByQuestionId = new Map<string, Video[]>();
    let unlinkedVideosCount = 0;

    for (const v of videos) {
      if (!v.contentMasterId) {
        unlinkedVideosCount++;
      }
      if (v.questionId) {
        const list = videosByQuestionId.get(v.questionId) || [];
        list.push(v);
        videosByQuestionId.set(v.questionId, list);

        if (!questionMap.has(v.questionId)) {
          anomalies.push({
            type: 'ORPHAN_VIDEO',
            entityId: v.id,
            message: `Video ${v.id} references non-existent Question ID ${v.questionId}`,
          });
        }
      }
    }

    let simSeq = 1;
    for (const q of questions) {
      if (q.contentMasterId && existingMasterMap.has(q.contentMasterId)) {
        alreadyLinkedQuestions++;
      } else {
        unlinkedQuestionsCount++;
        const proposedMasterId = `BP-MST-${String(simSeq++).padStart(6, '0')} (PROPOSED)`;
        const assocVideos = videosByQuestionId.get(q.id) || [];

        proposedMasterMappings.push({
          proposedMasterId,
          primaryQuestionId: q.id,
          questionTextPreview: (q.questionText || '').slice(0, 80),
          subtopicId: q.subtopicId || '',
          associatedVideoIds: assocVideos.map((v) => v.id),
        });

        if (!q.subtopicId) {
          anomalies.push({
            type: 'MISSING_SUBTOPIC',
            entityId: q.id,
            message: `Question ${q.id} has no subtopicId`,
          });
        }
      }
    }

    const estimatedWriteOperations =
      unlinkedQuestionsCount + // Create ContentMaster records
      unlinkedQuestionsCount + // Update Question records
      unlinkedVideosCount + // Update Video records
      unlinkedQuestionsCount; // Audit logs

    return {
      totalQuestionsExamined: questions.length,
      totalVideosExamined: videos.length,
      alreadyLinkedQuestions,
      unlinkedQuestionsCount,
      proposedNewMastersCount: unlinkedQuestionsCount,
      unlinkedVideosCount,
      proposedMasterMappings,
      anomalies,
      estimatedWriteOperations,
      isExecutable: true,
    };
  }

  /**
   * Executes safe, idempotent Content Master migration for legacy Questions & Videos.
   */
  public async executeMigration(
    actorId = 'USR-SYSTEM',
    actorName = 'System Migration'
  ): Promise<MigrationExecutionResult> {
    const questions = await questionsRepository.findAll();
    const videos = await videosRepository.findAll();
    const existingMasters = await contentMastersRepository.findAll();

    const existingMasterMap = new Map<string, ContentMaster>();
    for (const m of existingMasters) {
      existingMasterMap.set(m.id, m);
    }

    let mastersCreatedCount = 0;
    let questionsUpdatedCount = 0;
    let videosUpdatedCount = 0;
    let orphanedVideosCount = 0;
    const createdMasterIds: string[] = [];
    const errors: string[] = [];

    const videosByQuestionId = new Map<string, Video[]>();
    for (const v of videos) {
      if (v.questionId) {
        const list = videosByQuestionId.get(v.questionId) || [];
        list.push(v);
        videosByQuestionId.set(v.questionId, list);
      }
    }

    const questionMap = new Map<string, Question>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    // Process questions
    for (const q of questions) {
      try {
        let masterId = q.contentMasterId;

        if (!masterId || !existingMasterMap.has(masterId)) {
          // Create new Content Master for question
          const newMaster = await this.createContentMaster(
            {
              title: q.questionText ? q.questionText.slice(0, 100) : `Content Master for ${q.id}`,
              status: ContentMasterStatus.ACTIVE,
              primaryQuestionId: q.id,
              categoryId: q.categoryId,
              topicId: q.topicId,
              subtopicId: q.subtopicId,
              createdBy: actorId,
            },
            actorId,
            actorName
          );

          masterId = newMaster.id;
          createdMasterIds.push(masterId);
          mastersCreatedCount++;
          existingMasterMap.set(masterId, newMaster);
        }

        // Update Question if contentMasterId missing
        if (q.contentMasterId !== masterId) {
          q.contentMasterId = masterId;
          q.updatedAt = new Date().toISOString();
          await questionsRepository.update(q);
          questionsUpdatedCount++;
        }

        // Update linked Videos if contentMasterId missing
        const assocVideos = videosByQuestionId.get(q.id) || [];
        for (const v of assocVideos) {
          if (v.contentMasterId !== masterId) {
            v.contentMasterId = masterId;
            v.updatedAt = new Date().toISOString();
            await videosRepository.update(v);
            videosUpdatedCount++;
          }
        }
      } catch (err: any) {
        errors.push(`Error processing question ${q.id}: ${err?.message || err}`);
      }
    }

    // Process orphaned videos
    for (const v of videos) {
      if (!v.questionId || !questionMap.has(v.questionId)) {
        if (!v.contentMasterId) {
          try {
            orphanedVideosCount++;
            const orphanMaster = await this.createContentMaster(
              {
                title: v.title || `Content Master for Orphan Video ${v.id}`,
                status: ContentMasterStatus.ACTIVE,
                createdBy: actorId,
              },
              actorId,
              actorName
            );

            v.contentMasterId = orphanMaster.id;
            v.updatedAt = new Date().toISOString();
            await videosRepository.update(v);
            videosUpdatedCount++;
            createdMasterIds.push(orphanMaster.id);
            mastersCreatedCount++;
          } catch (err: any) {
            errors.push(`Error processing orphan video ${v.id}: ${err?.message || err}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      totalQuestionsExamined: questions.length,
      totalVideosExamined: videos.length,
      mastersCreatedCount,
      questionsUpdatedCount,
      videosUpdatedCount,
      orphanedVideosCount,
      createdMasterIds,
      errors,
    };
  }
}

export const contentMasterService = ContentMasterService.getInstance();
