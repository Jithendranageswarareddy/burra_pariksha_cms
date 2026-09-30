/**
 * BURRA PARIKSHA CMS - Phase 23 Production Search, Queues & Dashboard Service
 * 
 * Provides centralized production management operating directly on existing
 * authoritative Google Sheets repositories and canonical lifecycle state.
 * 
 * NO DUPLICATION OF TRUTH.
 * ALL STATUSES AND QUEUES DERIVED FROM EXISTING AUTHORITATIVE DATA.
 */

import {
  questionsRepository,
  videosRepository,
  contentMastersRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  socialReviewsRepository,
  platformAdaptationsRepository,
  publishingRepository,
  assignmentsRepository,
  usersRepository,
  auditLogRepository,
  topicsRepository,
  subtopicsRepository,
} from '../repositories';
import { objectAuthService, ActorContext } from './object-auth.service';
import { publishingService } from './publishing.service';
import { taxonomyService } from './taxonomy.service';
import {
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  VideoProductionStatus,
  SocialReviewStatus,
  UserRole,
  Phase23QueueType,
  Phase23SearchOptions,
  Phase23SearchResultItem,
  Phase23SearchResult,
  Phase23QueueItem,
  Phase23QueueResult,
  Phase23DashboardMetrics,
  Phase23ContentIdDetails,
} from '../../types';

export interface Phase23ContextData {
  allMasters: any[];
  allQuestions: any[];
  allVideos: any[];
  allScripts: any[];
  allThumbnails: any[];
  allPinnedComments: any[];
  allSocialReviews: any[];
  allAdaptations: any[];
  allPublishing: any[];
  allAssignments: any[];
  allUsers: any[];
  allAuditLogs: any[];
  topicsMap: Map<string, any>;
  subtopicsMap: Map<string, any>;
  usersMap: Map<string, any>;
}

export class ProductionDashboardService {
  private static instance: ProductionDashboardService | null = null;

  private contextCache: { timestamp: number; data: Phase23ContextData } | null = null;
  private contextInFlight: Promise<Phase23ContextData> | null = null;
  private readonly CACHE_TTL_MS = 20_000; // 20 seconds TTL

  private constructor() {}

  public static getInstance(): ProductionDashboardService {
    if (!ProductionDashboardService.instance) {
      ProductionDashboardService.instance = new ProductionDashboardService();
    }
    return ProductionDashboardService.instance;
  }

  public clearCache(): void {
    this.contextCache = null;
    this.contextInFlight = null;
  }

  /**
   * Single-pass parallel fetch of all authoritative records from repositories
   * with a 20s in-memory TTL cache to prevent redundant sheet scans.
   */
  public async buildContext(forceRefresh = false): Promise<Phase23ContextData> {
    const now = Date.now();
    if (!forceRefresh && this.contextCache && now - this.contextCache.timestamp < this.CACHE_TTL_MS) {
      return this.contextCache.data;
    }

    if (this.contextInFlight && !forceRefresh) {
      return await this.contextInFlight;
    }

    const computePromise = (async () => {
      const [
        allMasters,
        allQuestions,
        allVideos,
        allScripts,
        allThumbnails,
        allPinnedComments,
        allSocialReviews,
        allAdaptations,
        allPublishing,
        allAssignments,
        allUsers,
        allAuditLogs,
        allTopics,
        allSubtopics,
      ] = await Promise.all([
        contentMastersRepository.findAll().catch(() => []),
        questionsRepository.findAll().catch(() => []),
        videosRepository.findAll().catch(() => []),
        scriptsRepository.findAll().catch(() => []),
        thumbnailsRepository.findAll().catch(() => []),
        pinnedCommentsRepository.findAll().catch(() => []),
        socialReviewsRepository.findAll().catch(() => []),
        platformAdaptationsRepository.findAll().catch(() => []),
        publishingRepository.findAll().catch(() => []),
        assignmentsRepository.findAll().catch(() => []),
        usersRepository.findAll().catch(() => []),
        auditLogRepository.findAll().catch(() => []),
        topicsRepository.findAll().catch(() => []),
        subtopicsRepository.findAll().catch(() => []),
      ]);

      const topicsMap = new Map<string, any>();
      (allTopics || []).forEach((t: any) => {
        if (t.id) topicsMap.set(t.id, t);
        if (t.name) topicsMap.set(t.name.toLowerCase(), t);
      });

      const subtopicsMap = new Map<string, any>();
      (allSubtopics || []).forEach((st: any) => {
        if (st.id) subtopicsMap.set(st.id, st);
        if (st.name) subtopicsMap.set(st.name.toLowerCase(), st);
      });

      const usersMap = new Map<string, any>();
      (allUsers || []).forEach((u: any) => {
        if (u.id) usersMap.set(u.id, u);
      });

      const data: Phase23ContextData = {
        allMasters,
        allQuestions,
        allVideos,
        allScripts,
        allThumbnails,
        allPinnedComments,
        allSocialReviews,
        allAdaptations,
        allPublishing,
        allAssignments,
        allUsers,
        allAuditLogs,
        topicsMap,
        subtopicsMap,
        usersMap,
      };

      this.contextCache = { timestamp: Date.now(), data };
      return data;
    })();

    this.contextInFlight = computePromise;

    try {
      return await computePromise;
    } finally {
      this.contextInFlight = null;
    }
  }

  /**
   * Resolves Content ID (e.g. BP-CNT-000001 or fallback BP-Q-#### / BP-V-####)
   */
  private resolveContentId(record: any): string {
    if (record.contentId) return String(record.contentId).trim();
    if (record.contentMasterId) return String(record.contentMasterId).trim();
    if (record.id) return String(record.id).trim();
    return 'BP-CNT-UNKNOWN';
  }

  /**
   * Helper to derive active blockers for a Content ID
   */
  private deriveBlockers(
    question: any,
    video: any,
    script: any,
    socialReview: any,
    adaptations: any[],
    publishing: any
  ): string[] {
    const blockers: string[] = [];

    // Question blockers
    if (question) {
      if (question.status === QuestionStatus.REJECTED) {
        blockers.push('QUESTION_REJECTED');
      } else if (question.status === QuestionStatus.DRAFT || question.status === QuestionStatus.GENERATED) {
        blockers.push('QUESTION_APPROVAL_PENDING');
      }
      if (question.validationStatus === 'INVALID' || question.validationStatus === 'NEEDS_REVIEW') {
        blockers.push('QUESTION_VALIDATION_FAILED');
      }
    }

    // Video & Script blockers
    if (video) {
      if (video.status === VideoProductionStatus.SCRIPT_REQUIRED && !script) {
        blockers.push('MISSING_SCRIPT');
      }
      if (video.status === VideoProductionStatus.CANCELLED) {
        blockers.push('VIDEO_CANCELLED');
      } else if (video.status === VideoProductionStatus.ON_HOLD) {
        blockers.push('VIDEO_ON_HOLD');
      } else if (video.status === VideoProductionStatus.FINAL_REVIEW) {
        blockers.push('VIDEO_FINAL_REVIEW_PENDING');
      }
    }

    // Social review blockers
    if (socialReview) {
      if (
        socialReview.status === SocialReviewStatus.PENDING_REVIEW ||
        socialReview.status === 'PENDING' ||
        socialReview.status === 'IN_REVIEW' ||
        socialReview.status === 'DRAFT'
      ) {
        blockers.push('SOCIAL_REVIEW_PENDING');
      } else if (socialReview.status === SocialReviewStatus.REJECTED) {
        blockers.push('SOCIAL_REVIEW_REJECTED');
      }
    }

    // Adaptation staleness blockers
    if (adaptations && adaptations.length > 0) {
      const hasStale = adaptations.some((a) => a.isStale === true);
      if (hasStale) {
        blockers.push('STALE_PLATFORM_ADAPTATION');
      }
    }

    // Publishing blockers
    if (publishing) {
      if (publishing.status === 'FAILED') {
        blockers.push('PUBLISHING_FAILED');
      }
    }

    return blockers;
  }

  /**
   * Helper to build a canonical Search Result Item for a given Content ID
   */
  public buildSearchResultItem(contentId: string, ctx: Phase23ContextData): Phase23SearchResultItem {
    const master = ctx.allMasters.find((m) => m.contentId === contentId || m.id === contentId);

    const question = ctx.allQuestions.find(
      (q) => q.contentId === contentId || q.contentMasterId === contentId || q.id === contentId
    );

    const video = ctx.allVideos.find(
      (v) =>
        v.contentId === contentId ||
        v.contentMasterId === contentId ||
        (question && v.questionId === question.id) ||
        v.id === contentId
    );

    const script = video
      ? ctx.allScripts.find((s) => s.videoId === video.id || (question && s.questionId === question.id))
      : question
      ? ctx.allScripts.find((s) => s.questionId === question.id)
      : null;

    const socialReview = video
      ? ctx.allSocialReviews.find((r) => r.videoId === video.id || r.contentId === contentId)
      : null;

    const adaptations = ctx.allAdaptations.filter(
      (a) => a.contentId === contentId || (video && a.videoId === video.id)
    );

    const publishing = ctx.allPublishing.find(
      (p) => p.contentId === contentId || (video && p.videoId === video.id)
    );

    // Topic & Subtopic resolution
    let topicId = question?.topicId || master?.topicId || '';
    let topicName = question?.topicName || '';
    if (!topicName && topicId && ctx.topicsMap.has(topicId)) {
      topicName = ctx.topicsMap.get(topicId).name;
    }

    let subtopicId = question?.subtopicId || master?.subtopicId || '';
    let subtopicName = question?.subtopicName || '';
    if (!subtopicName && subtopicId && ctx.subtopicsMap.has(subtopicId)) {
      subtopicName = ctx.subtopicsMap.get(subtopicId).name;
    }

    // Title
    const title =
      video?.title || master?.title || question?.questionText || question?.question || 'Untitled Content';

    // Difficulty, Language, Challenge Type, Presentation Type, Question Style
    const difficulty = question?.difficulty || DifficultyLevel.MEDIUM;
    const language = question?.language || QuestionLanguage.TELUGU;
    const challengeType = question?.challengeType || 'ABCD';
    const presentationType = question?.presentationType || 'Text';
    const questionStyle = question?.questionStyle || QuestionStyle.EXAM_STYLE;

    // Aggregated Status & Workflow Stage
    let status = 'DRAFT';
    let workflowStage = 'QUESTION';

    if (publishing && (publishing.status === 'PUBLISHED' || publishing.status === 'MANUALLY_PUBLISHED')) {
      status = 'MANUALLY_PUBLISHED';
      workflowStage = 'PUBLISHING';
    } else if (video && video.status === VideoProductionStatus.READY_TO_UPLOAD) {
      status = 'READY_TO_PUBLISH';
      workflowStage = 'PUBLISHING';
    } else if (video) {
      status = video.status;
      workflowStage = 'VIDEO';
    } else if (script) {
      status = script.status || 'SCRIPT_READY';
      workflowStage = 'SCRIPT';
    } else if (question) {
      status = question.status;
      workflowStage = 'QUESTION';
    } else if (master) {
      status = master.status;
      workflowStage = 'QUESTION';
    }

    // Assignee resolution
    let assigneeId = video?.assignedEditor || video?.assignedHost || question?.authorId || master?.ownerId || '';
    let assigneeName = '';

    // Check active assignments
    const activeAssign = ctx.allAssignments.find(
      (a) =>
        (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') &&
        (a.entityId === contentId ||
          (question && a.entityId === question.id) ||
          (video && a.entityId === video.id))
    );

    if (activeAssign) {
      assigneeId = activeAssign.assigneeId || activeAssign.userId || assigneeId;
      assigneeName = activeAssign.assigneeName || activeAssign.userName || '';
    }

    if (!assigneeName && assigneeId && ctx.usersMap.has(assigneeId)) {
      assigneeName = ctx.usersMap.get(assigneeId).name;
    }

    // Blockers
    const blockers = this.deriveBlockers(question, video, script, socialReview, adaptations, publishing);

    // Timestamps
    const dates = [
      master?.updatedAt,
      question?.updatedAt,
      video?.updatedAt,
      script?.updatedAt,
      socialReview?.updatedAt,
      publishing?.updatedAt,
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));

    const maxTime = dates.length > 0 ? Math.max(...dates) : Date.now();
    const minTime = dates.length > 0 ? Math.min(...dates) : Date.now();

    const updatedAt = new Date(maxTime).toISOString();
    const createdAt = new Date(minTime).toISOString();

    return {
      contentId,
      masterId: master?.id,
      questionId: question?.id,
      videoId: video?.id,
      title,
      topicId,
      topicName,
      subtopicId,
      subtopicName,
      difficulty: String(difficulty),
      language: String(language),
      challengeType: String(challengeType),
      presentationType: String(presentationType),
      questionStyle: String(questionStyle),
      status: String(status),
      workflowStage,
      assigneeId,
      assigneeName,
      questionStatus: question?.status,
      scriptStatus: script?.status || (video?.status === VideoProductionStatus.SCRIPT_READY ? 'APPROVED' : undefined),
      videoStatus: video?.status,
      reviewStatus: socialReview?.status || (video?.status === VideoProductionStatus.FINAL_REVIEW ? 'FINAL_REVIEW' : undefined),
      socialReviewStatus: socialReview?.status,
      platformAdaptationStatus: adaptations.length > 0 ? adaptations[0].status : undefined,
      publishingReadiness: video?.status === VideoProductionStatus.READY_TO_UPLOAD ? 'READY_TO_PUBLISH' : 'NOT_READY',
      publishingStatus: publishing?.status,
      blockers,
      updatedAt,
      createdAt,
    };
  }

  /**
   * SECTION 1 & 2: Production Search
   * Filterable by Content ID, Topic, Subtopic, Difficulty, Language, Challenge Type,
   * Presentation Type, Question Style, Status, Assignee.
   */
  public async search(options: Phase23SearchOptions = {}, actor?: ActorContext): Promise<Phase23SearchResult> {
    const ctx = await this.buildContext();

    // 1. Collect all unique Content IDs across Masters, Questions, Videos
    const contentIdSet = new Set<string>();

    ctx.allMasters.forEach((m) => {
      const cid = this.resolveContentId(m);
      if (cid) contentIdSet.add(cid);
    });

    ctx.allQuestions.forEach((q) => {
      const cid = this.resolveContentId(q);
      if (cid) contentIdSet.add(cid);
    });

    ctx.allVideos.forEach((v) => {
      const cid = this.resolveContentId(v);
      if (cid) contentIdSet.add(cid);
    });

    // Build Search Result Items
    const allItems: Phase23SearchResultItem[] = Array.from(contentIdSet).map((cid) =>
      this.buildSearchResultItem(cid, ctx)
    );

    // 2. Apply Filters (AND logic)
    let filtered = allItems.filter((item) => {
      // Content ID filter (exact or partial)
      if (options.contentId && options.contentId.trim()) {
        const queryCid = options.contentId.trim().toLowerCase();
        const itemCid = item.contentId.toLowerCase();
        const itemQid = (item.questionId || '').toLowerCase();
        const itemVid = (item.videoId || '').toLowerCase();
        const itemMid = (item.masterId || '').toLowerCase();
        const matchesCid =
          itemCid === queryCid ||
          itemCid.includes(queryCid) ||
          itemQid.includes(queryCid) ||
          itemVid.includes(queryCid) ||
          itemMid.includes(queryCid);
        if (!matchesCid) return false;
      }

      // General text search (Content ID, Title, Topic, Subtopic)
      if (options.search && options.search.trim()) {
        const query = options.search.trim().toLowerCase();
        const textMatch =
          item.contentId.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.topicName.toLowerCase().includes(query) ||
          item.subtopicName.toLowerCase().includes(query) ||
          (item.questionId || '').toLowerCase().includes(query) ||
          (item.videoId || '').toLowerCase().includes(query);
        if (!textMatch) return false;
      }

      // Topic filter
      if (options.topicId && options.topicId.trim()) {
        const target = options.topicId.trim().toLowerCase();
        const match =
          item.topicId.toLowerCase() === target || item.topicName.toLowerCase().includes(target);
        if (!match) return false;
      }

      // Subtopic filter
      if (options.subtopicId && options.subtopicId.trim()) {
        const target = options.subtopicId.trim().toLowerCase();
        const match =
          item.subtopicId.toLowerCase() === target || item.subtopicName.toLowerCase().includes(target);
        if (!match) return false;
      }

      // Difficulty filter
      if (options.difficulty && options.difficulty.trim()) {
        const target = options.difficulty.trim().toLowerCase();
        if (item.difficulty.toLowerCase() !== target) return false;
      }

      // Language filter
      if (options.language && options.language.trim()) {
        const target = options.language.trim().toLowerCase();
        if (item.language.toLowerCase() !== target) return false;
      }

      // Challenge Type filter
      if (options.challengeType && options.challengeType.trim()) {
        const target = options.challengeType.trim().toLowerCase();
        if (item.challengeType.toLowerCase() !== target) return false;
      }

      // Presentation Type filter
      if (options.presentationType && options.presentationType.trim()) {
        const target = options.presentationType.trim().toLowerCase();
        if (item.presentationType.toLowerCase() !== target) return false;
      }

      // Question Style filter
      if (options.questionStyle && options.questionStyle.trim()) {
        const target = options.questionStyle.trim().toLowerCase();
        if (item.questionStyle.toLowerCase() !== target) return false;
      }

      // Status filter (matches aggregated status, question status, video status, or publishing status)
      if (options.status && options.status.trim()) {
        const target = options.status.trim().toLowerCase();
        const match =
          item.status.toLowerCase() === target ||
          (item.questionStatus || '').toLowerCase() === target ||
          (item.videoStatus || '').toLowerCase() === target ||
          (item.publishingStatus || '').toLowerCase() === target ||
          (item.workflowStage || '').toLowerCase() === target;
        if (!match) return false;
      }

      // Assignee filter
      if (options.assigneeId && options.assigneeId.trim()) {
        const target = options.assigneeId.trim().toLowerCase();
        const match =
          (item.assigneeId || '').toLowerCase() === target ||
          (item.assigneeName || '').toLowerCase().includes(target);
        if (!match) return false;
      }

      return true;
    });

    // 3. Sorting
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof Phase23SearchResultItem] || '';
      let valB: any = b[sortBy as keyof Phase23SearchResultItem] || '';

      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 4. Pagination
    const totalCount = filtered.length;
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit !== undefined ? options.limit : 20;

    let paginatedItems = filtered;
    let totalPages = 1;

    if (limit > 0) {
      totalPages = Math.ceil(totalCount / limit) || 1;
      const startIndex = (page - 1) * limit;
      paginatedItems = filtered.slice(startIndex, startIndex + limit);
    }

    return {
      totalCount,
      returnedCount: paginatedItems.length,
      page,
      limit,
      totalPages,
      items: paginatedItems,
    };
  }

  /**
   * SECTION 3 & 4: Production Queues & Queue Safety
   * MY WORK, QUESTIONS, SCRIPTS, VIDEOS, REVIEWS, PUBLISHING
   */
  public async getQueue(
    queueType: Phase23QueueType,
    actor: ActorContext,
    options: { page?: number; limit?: number } = {}
  ): Promise<Phase23QueueResult> {
    const ctx = await this.buildContext();
    const searchRes = await this.search({ limit: 0 }, actor);
    const allSearchItems = searchRes.items;

    // Evaluate RBAC for actor
    const actorRole = String(actor?.role || '').trim().toUpperCase();
    const isAnalyticsViewer = actorRole === 'ANALYTICS_VIEWER' || objectAuthService.hasAnyRole(actor, ['ANALYTICS_VIEWER']);
    const isManagerOrAdmin = objectAuthService.isManagerOrAdmin(actor);

    // Queue safety: if analytics viewer, they cannot perform actions, so queue actionable items are empty or marked non-actionable
    const queueItems: Phase23QueueItem[] = [];

    for (const item of allSearchItems) {
      let isMatch = false;
      let queueItemType: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'REVIEW' | 'PUBLISHING' = 'QUESTION';
      let actionRequired = '';
      let priority = 'NORMAL';

      switch (queueType) {
        case 'MY_WORK': {
          const isAssigned =
            (item.assigneeId && item.assigneeId === actor.id) ||
            ctx.allAssignments.some(
              (a) =>
                (a.assigneeId === actor.id || a.userId === actor.id) &&
                (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') &&
                (a.entityId === item.contentId ||
                  a.entityId === item.questionId ||
                  a.entityId === item.videoId)
            );
          if (isAssigned) {
            isMatch = true;
            queueItemType = (item.workflowStage as any) || 'QUESTION';
            actionRequired = `Complete work for stage ${item.workflowStage} (Status: ${item.status})`;
          }
          break;
        }

        case 'QUESTIONS': {
          const isQuestionActionable =
            item.questionStatus === QuestionStatus.DRAFT ||
            item.questionStatus === QuestionStatus.GENERATED ||
            item.questionStatus === QuestionStatus.EDITING;

          const canModifyQ = isManagerOrAdmin || objectAuthService.hasAnyRole(actor, [
            UserRole.QUESTION_CREATOR,
            UserRole.QUESTION_EDITOR,
            UserRole.TOPIC_LEAD,
            UserRole.CREATOR,
            UserRole.CONTENT_WRITER,
            UserRole.EDITOR,
          ]);

          if (isQuestionActionable && (canModifyQ || !isAnalyticsViewer)) {
            isMatch = true;
            queueItemType = 'QUESTION';
            actionRequired =
              item.questionStatus === QuestionStatus.GENERATED
                ? 'Review AI generated question pedagogy'
                : 'Refine question composition and options';
          }
          break;
        }

        case 'SCRIPTS': {
          const isScriptActionable =
            item.videoStatus === VideoProductionStatus.SCRIPT_REQUIRED ||
            item.scriptStatus === 'DRAFT' ||
            item.status === 'SCRIPT_REQUIRED';

          const canModifyS = isManagerOrAdmin || objectAuthService.hasAnyRole(actor, [
            UserRole.SCRIPT_WRITER,
            UserRole.TELUGU_TRANSLATOR,
            UserRole.CREATOR,
            UserRole.CONTENT_WRITER,
            UserRole.EDITOR,
          ]);

          if (isScriptActionable && (canModifyS || !isAnalyticsViewer)) {
            isMatch = true;
            queueItemType = 'SCRIPT';
            actionRequired = 'Write/translate Telugu short script and spoken timing';
          }
          break;
        }

        case 'VIDEOS': {
          const isVideoActionable =
            item.videoStatus === VideoProductionStatus.QUEUED ||
            item.videoStatus === VideoProductionStatus.SCRIPT_READY ||
            item.videoStatus === VideoProductionStatus.RECORDING ||
            item.videoStatus === VideoProductionStatus.RECORDED ||
            item.videoStatus === VideoProductionStatus.EDITING ||
            item.videoStatus === VideoProductionStatus.EDITED ||
            item.videoStatus === VideoProductionStatus.FINAL_REVIEW;

          const canModifyV = isManagerOrAdmin || objectAuthService.hasAnyRole(actor, [
            UserRole.VIDEO_EDITOR,
            UserRole.STUDIO_PRESENTER,
            UserRole.CREATOR,
            UserRole.EDITOR,
            UserRole.SPEAKER,
          ]);

          if (isVideoActionable && (canModifyV || !isAnalyticsViewer)) {
            isMatch = true;
            queueItemType = 'VIDEO';
            actionRequired = `Perform video production step: ${item.videoStatus}`;
          }
          break;
        }

        case 'REVIEWS': {
          const isReviewPending =
            item.questionStatus === QuestionStatus.GENERATED ||
            item.videoStatus === VideoProductionStatus.FINAL_REVIEW ||
            item.socialReviewStatus === SocialReviewStatus.PENDING_REVIEW ||
            item.socialReviewStatus === 'PENDING' ||
            item.socialReviewStatus === 'IN_REVIEW' ||
            item.reviewStatus === 'NEEDS_REVIEW';

          const canReview = isManagerOrAdmin || objectAuthService.hasAnyRole(actor, [
            UserRole.REVIEWER,
            UserRole.CONTENT_MANAGER,
            UserRole.TOPIC_LEAD,
            UserRole.PUBLISHING_MANAGER,
            UserRole.ADMIN,
          ]);

          if (isReviewPending && (canReview || !isAnalyticsViewer)) {
            isMatch = true;
            queueItemType = 'REVIEW';
            actionRequired =
              item.videoStatus === VideoProductionStatus.FINAL_REVIEW
                ? 'Perform final video cut quality review'
                : 'Review question or social package accuracy';
            priority = 'HIGH';
          }
          break;
        }

        case 'PUBLISHING': {
          const isPublishingActionable =
            item.videoStatus === VideoProductionStatus.READY_TO_UPLOAD ||
            item.publishingReadiness === 'READY_TO_PUBLISH' ||
            item.publishingStatus === 'READY_TO_PUBLISH';

          const canPublish = isManagerOrAdmin || objectAuthService.hasAnyRole(actor, [
            UserRole.PUBLISHER,
            UserRole.PUBLISHING_MANAGER,
            UserRole.ADMIN,
          ]);

          if (isPublishingActionable && (canPublish || !isAnalyticsViewer)) {
            isMatch = true;
            queueItemType = 'PUBLISHING';
            actionRequired = 'Retrieve approved package and perform manual platform upload';
            priority = 'URGENT';
          }
          break;
        }
      }

      if (isMatch) {
        // RBAC Actionability check
        const isActionableByCurrentActor = !isAnalyticsViewer;

        // If analytics viewer, do NOT include in actionable queues
        if (isAnalyticsViewer) {
          continue;
        }

        queueItems.push({
          id: item.contentId,
          contentId: item.contentId,
          type: queueItemType,
          title: item.title,
          topicName: item.topicName,
          subtopicName: item.subtopicName,
          difficulty: item.difficulty,
          language: item.language,
          status: item.status,
          workflowStage: item.workflowStage,
          assigneeId: item.assigneeId,
          assigneeName: item.assigneeName,
          actionRequired,
          isActionableByCurrentActor,
          priority,
          blockers: item.blockers,
          updatedAt: item.updatedAt,
        });
      }
    }

    return {
      queueType,
      totalCount: queueItems.length,
      items: queueItems,
    };
  }

  /**
   * SECTION 5: Production Dashboard
   * Comprehensive aggregate metrics & active blockers.
   */
  public async getDashboard(actor: ActorContext): Promise<Phase23DashboardMetrics> {
    const ctx = await this.buildContext();
    const searchRes = await this.search({ limit: 0 }, actor);
    const items = searchRes.items;

    // Handle 0 items safely
    if (items.length === 0) {
      return {
        totalActiveProductionItems: 0,
        myAssignedWork: 0,
        questionsNeedingAction: 0,
        scriptsNeedingAction: 0,
        videosNeedingAction: 0,
        reviewsPending: 0,
        socialReviewsPending: 0,
        publishingReadyItems: 0,
        publishingBlockersCount: 0,
        activeBlockersBreakdown: {
          reviewPending: 0,
          changesRequested: 0,
          missingAsset: 0,
          staleAdaptation: 0,
          unreadyPublishing: 0,
          unassignedWork: 0,
        },
        recentlyUpdatedItems: [],
      };
    }

    // Active production items (non-terminal)
    const activeItems = items.filter(
      (item) =>
        item.status !== 'ARCHIVED' &&
        item.status !== 'REJECTED' &&
        item.status !== 'CANCELLED' &&
        item.status !== 'MANUALLY_PUBLISHED'
    );

    // Metrics calculations
    const totalActiveProductionItems = activeItems.length;

    const myAssignedWork = items.filter(
      (item) => item.assigneeId && item.assigneeId === actor.id
    ).length;

    const questionsNeedingAction = items.filter(
      (item) =>
        item.questionStatus === QuestionStatus.DRAFT ||
        item.questionStatus === QuestionStatus.GENERATED ||
        item.questionStatus === QuestionStatus.EDITING
    ).length;

    const scriptsNeedingAction = items.filter(
      (item) =>
        item.videoStatus === VideoProductionStatus.SCRIPT_REQUIRED || item.scriptStatus === 'DRAFT'
    ).length;

    const videosNeedingAction = items.filter(
      (item) =>
        item.videoStatus === VideoProductionStatus.RECORDING ||
        item.videoStatus === VideoProductionStatus.RECORDED ||
        item.videoStatus === VideoProductionStatus.EDITING ||
        item.videoStatus === VideoProductionStatus.EDITED
    ).length;

    const reviewsPending = items.filter(
      (item) =>
        item.videoStatus === VideoProductionStatus.FINAL_REVIEW ||
        item.questionStatus === QuestionStatus.GENERATED
    ).length;

    const socialReviewsPending = items.filter(
      (item) =>
        item.socialReviewStatus === SocialReviewStatus.PENDING_REVIEW ||
        item.socialReviewStatus === 'PENDING' ||
        item.socialReviewStatus === 'IN_REVIEW' ||
        item.socialReviewStatus === 'DRAFT'
    ).length;

    const publishingReadyItems = items.filter(
      (item) =>
        item.videoStatus === VideoProductionStatus.READY_TO_UPLOAD ||
        item.publishingReadiness === 'READY_TO_PUBLISH'
    ).length;

    // Blockers breakdown
    let reviewPending = 0;
    let changesRequested = 0;
    let missingAsset = 0;
    let staleAdaptation = 0;
    let unreadyPublishing = 0;
    let unassignedWork = 0;
    let totalBlockersCount = 0;

    items.forEach((item) => {
      totalBlockersCount += item.blockers.length;
      if (!item.assigneeId) unassignedWork++;

      item.blockers.forEach((b) => {
        if (b.includes('REVIEW_PENDING') || b.includes('APPROVAL_PENDING')) reviewPending++;
        if (b.includes('REJECTED')) changesRequested++;
        if (b.includes('MISSING')) missingAsset++;
        if (b.includes('STALE')) staleAdaptation++;
        if (b.includes('PUBLISHING')) unreadyPublishing++;
      });
    });

    const sortedByDate = [...items].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return {
      totalActiveProductionItems,
      myAssignedWork,
      questionsNeedingAction,
      scriptsNeedingAction,
      videosNeedingAction,
      reviewsPending,
      socialReviewsPending,
      publishingReadyItems,
      publishingBlockersCount: totalBlockersCount,
      activeBlockersBreakdown: {
        reviewPending,
        changesRequested,
        missingAsset,
        staleAdaptation,
        unreadyPublishing,
        unassignedWork,
      },
      recentlyUpdatedItems: sortedByDate.slice(0, 10),
    };
  }

  /**
   * SECTION 7: Content ID Drilldown
   * Consolidated lifecycle details for a given Content ID.
   */
  public async getContentIdDetails(contentId: string, actor?: ActorContext): Promise<Phase23ContentIdDetails | null> {
    const ctx = await this.buildContext();

    const master = ctx.allMasters.find((m) => m.contentId === contentId || m.id === contentId);

    const question = ctx.allQuestions.find(
      (q) => q.contentId === contentId || q.contentMasterId === contentId || q.id === contentId
    );

    const video = ctx.allVideos.find(
      (v) =>
        v.contentId === contentId ||
        v.contentMasterId === contentId ||
        (question && v.questionId === question.id) ||
        v.id === contentId
    );

    const script = video
      ? ctx.allScripts.find((s) => s.videoId === video.id || (question && s.questionId === question.id))
      : question
      ? ctx.allScripts.find((s) => s.questionId === question.id)
      : null;

    const thumbnail = video ? ctx.allThumbnails.find((t) => t.videoId === video.id) : null;
    const pinnedComment = video ? ctx.allPinnedComments.find((p) => p.videoId === video.id) : null;
    const socialReview = video
      ? ctx.allSocialReviews.find((r) => r.videoId === video.id || r.contentId === contentId)
      : null;

    const platformAdaptations = ctx.allAdaptations.filter(
      (a) => a.contentId === contentId || (video && a.videoId === video.id)
    );

    const publishing = ctx.allPublishing.find(
      (p) => p.contentId === contentId || (video && p.videoId === video.id)
    );

    if (!master && !question && !video) {
      return null;
    }

    // Evaluate Phase 22 publishing readiness if video exists
    let publishingReadiness = null;
    if (contentId && /^BP-CNT-\d{6}$/.test(contentId)) {
      try {
        publishingReadiness = await publishingService.evaluateReadiness(contentId, 'YOUTUBE');
      } catch {
        publishingReadiness = null;
      }
    }

    const searchItem = this.buildSearchResultItem(contentId, ctx);

    // Assignees breakdown
    const assignees: Array<{ role: string; userId: string; userName: string }> = [];
    if (question?.authorId) {
      assignees.push({
        role: 'QUESTION_CREATOR',
        userId: question.authorId,
        userName: ctx.usersMap.get(question.authorId)?.name || question.author || question.authorId,
      });
    }
    if (video?.assignedHost) {
      assignees.push({
        role: 'STUDIO_PRESENTER',
        userId: video.assignedHost,
        userName: ctx.usersMap.get(video.assignedHost)?.name || video.assignedHost,
      });
    }
    if (video?.assignedEditor) {
      assignees.push({
        role: 'VIDEO_EDITOR',
        userId: video.assignedEditor,
        userName: ctx.usersMap.get(video.assignedEditor)?.name || video.assignedEditor,
      });
    }

    // Audit logs history
    const history = ctx.allAuditLogs
      .filter(
        (l) =>
          l.entityId === contentId ||
          (question && l.entityId === question.id) ||
          (video && l.entityId === video.id)
      )
      .map((l) => ({
        timestamp: l.createdAt || l.timestamp,
        action: l.action,
        actorName: l.actorName || l.userId,
        details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
      }));

    return {
      contentId,
      contentMaster: master,
      question,
      script,
      video,
      thumbnail,
      pinnedComment,
      socialReview,
      platformAdaptations,
      publishing,
      publishingReadiness,
      aggregatedStatus: searchItem.status,
      workflowStage: searchItem.workflowStage,
      assignees,
      blockers: searchItem.blockers,
      history,
    };
  }
}

export const productionDashboardService = ProductionDashboardService.getInstance();
export const phase23ProductionService = productionDashboardService;
export type Phase23ProductionService = ProductionDashboardService;
