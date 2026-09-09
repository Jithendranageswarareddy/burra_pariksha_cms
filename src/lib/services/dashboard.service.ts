/**
 * BURRA PARIKSHA CMS - Content Operations Dashboard Service (Phase 7)
 * 
 * Provides centralized operations intelligence, bottleneck detection,
 * aging/stale content tracking, today's priority work queue,
 * publishing readiness verification, and global search.
 * 
 * Backed solely by Google Sheets authoritative repositories.
 */

import {
  questionsRepository,
  videosRepository,
  publishingRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  categoriesRepository,
  topicsRepository,
  auditLogRepository,
  assignmentsRepository,
  usersRepository,
  contentMastersRepository,
  socialReviewsRepository,
} from '../repositories';
import { assignmentService } from './assignment.service';
import { objectAuthService, ActorContext } from './object-auth.service';
import {
  AGING_THRESHOLDS,
  BOTTLENECK_CONFIG,
  QUESTION_STATUS_CONFIG,
  VIDEO_STATUS_CONFIG,
} from '../../config/constants';
import {
  BottleneckStage,
  DashboardMetrics,
  DashboardOverviewData,
  GlobalSearchResult,
  PriorityLevel,
  PublishingReadinessItem,
  Question,
  QuestionStatus,
  SocialPublishStatus,
  StaleContentItem,
  TodaysWorkItem,
  UserRole,
  Video,
  VideoProductionStatus,
} from '../../types';

export interface DashboardFilterOptions {
  categoryId?: string;
  topicId?: string;
  difficulty?: string;
  priority?: string;
  questionStatus?: string;
  videoStatus?: string;
  search?: string;
}

export interface DashboardDataContext {
  allQuestions: Question[];
  allVideos: Video[];
  allPublishing: any[];
  allThumbnails: any[];
  allPinnedComments: any[];
  allAuditLogs: any[];
  allAssignments: any[];
  allUsers: any[];
  qMap: Map<string, Question>;
}

function safeTruncate(str: string | undefined | null, maxLength = 60, fallback = 'Untitled Item'): string {
  if (typeof str !== 'string' || !str.trim()) {
    return fallback;
  }
  const trimmed = str.trim();
  return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed;
}

export class DashboardService {
  private static instance: DashboardService | null = null;

  private overviewCache = new Map<string, { timestamp: number; data: DashboardOverviewData }>();
  private overviewInFlight = new Map<string, Promise<DashboardOverviewData>>();
  private readonly OVERVIEW_CACHE_TTL_MS = 20_000; // 20 seconds TTL

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  public clearOverviewCache(): void {
    this.overviewCache.clear();
    this.overviewInFlight.clear();
  }

  /**
   * Single-pass fetch of all required repositories in parallel for dashboard calculations.
   */
  public async buildDataContext(): Promise<DashboardDataContext> {
    const [
      allQuestions,
      allVideos,
      allPublishing,
      allThumbnails,
      allPinnedComments,
      allAuditLogs,
      allAssignments,
      allUsers,
    ] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      publishingRepository.findAll(),
      thumbnailsRepository.findAll(),
      pinnedCommentsRepository.findAll(),
      auditLogRepository.findAll(),
      assignmentsRepository.findAll(),
      usersRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    return {
      allQuestions,
      allVideos,
      allPublishing,
      allThumbnails,
      allPinnedComments,
      allAuditLogs,
      allAssignments,
      allUsers,
      qMap,
    };
  }

  /**
   * Computes comprehensive dashboard metric cards across Questions, Videos, and Publishing.
   */
  public async getMetrics(filters?: DashboardFilterOptions): Promise<DashboardMetrics> {
    const ctx = await this.buildDataContext();
    return this.getMetricsFromContext(ctx, filters);
  }

  public getMetricsFromContext(ctx: DashboardDataContext, filters?: DashboardFilterOptions): DashboardMetrics {
    const questions = this.applyQuestionFilters(ctx.allQuestions, filters);
    const videos = this.applyVideoFilters(ctx.allVideos, filters, ctx.qMap);
    const allPublishing = ctx.allPublishing;

    // Questions Breakdown
    const qGenerated = questions.filter((q) => q.status === QuestionStatus.GENERATED || q.status === QuestionStatus.DRAFT).length;
    const qEditing = questions.filter((q) => q.status === QuestionStatus.EDITING).length;
    const qApproved = questions.filter((q) => q.status === QuestionStatus.APPROVED).length;
    const qRejected = questions.filter((q) => q.status === QuestionStatus.REJECTED).length;

    // Videos Breakdown
    const vQueued = videos.filter((v) => v.status === VideoProductionStatus.QUEUED).length;
    const vScriptReq = videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_REQUIRED).length;
    const vScriptReady = videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_READY).length;
    const vRecording = videos.filter((v) => v.status === VideoProductionStatus.RECORDING).length;
    const vRecorded = videos.filter((v) => v.status === VideoProductionStatus.RECORDED).length;
    const vEditing = videos.filter((v) => v.status === VideoProductionStatus.EDITING).length;
    const vEdited = videos.filter((v) => v.status === VideoProductionStatus.EDITED).length;
    const vFinalReview = videos.filter((v) => v.status === VideoProductionStatus.FINAL_REVIEW).length;
    const vReadyUpload = videos.filter((v) => v.status === VideoProductionStatus.READY_TO_UPLOAD).length;
    const vUploaded = videos.filter((v) => v.status === VideoProductionStatus.UPLOADED).length;
    const vOnHold = videos.filter((v) => v.status === VideoProductionStatus.ON_HOLD).length;
    const vCancelled = videos.filter((v) => v.status === VideoProductionStatus.CANCELLED).length;

    const totalActive =
      vQueued +
      vScriptReq +
      vScriptReady +
      vRecording +
      vRecorded +
      vEditing +
      vEdited +
      vFinalReview +
      vReadyUpload;

    // Publishing Breakdown
    const pubPublished = allPublishing.filter((p) => p.completedPlatformsCount === p.totalPlatformsCount && p.totalPlatformsCount > 0).length;
    const pubIncomplete = allPublishing.filter((p) => p.completedPlatformsCount > 0 && p.completedPlatformsCount < p.totalPlatformsCount).length;
    const pubReady = videos.filter((v) => v.status === VideoProductionStatus.READY_TO_UPLOAD).length;
    const pubNotStarted = allPublishing.filter((p) => p.completedPlatformsCount === 0).length;

    return {
      questions: {
        generated: qGenerated,
        editing: qEditing,
        approved: qApproved,
        rejected: qRejected,
        total: questions.length,
      },
      videos: {
        queued: vQueued,
        scriptRequired: vScriptReq,
        scriptReady: vScriptReady,
        recording: vRecording,
        recorded: vRecorded,
        editing: vEditing,
        edited: vEdited,
        finalReview: vFinalReview,
        readyToUpload: vReadyUpload,
        uploaded: vUploaded,
        onHold: vOnHold,
        cancelled: vCancelled,
        totalActive,
      },
      publishing: {
        notStarted: pubNotStarted,
        ready: pubReady,
        published: pubPublished,
        incomplete: pubIncomplete,
        total: allPublishing.length,
      },
      // Backward-compatible fields
      questionsGenerated: qGenerated,
      questionsApproved: qApproved,
      questionsQueued: vQueued,
      videosInRecording: vRecording,
      videosInEditing: vEditing,
      finalReviewCount: vFinalReview,
      readyToUploadCount: vReadyUpload,
      uploadedCount: vUploaded,
    };
  }

  /**
   * Generates Today's Priority Work list identifying immediate actionable records.
   */
  public async getTodaysWork(filters?: DashboardFilterOptions): Promise<TodaysWorkItem[]> {
    const ctx = await this.buildDataContext();
    return this.getTodaysWorkFromContext(ctx, filters);
  }

  public getTodaysWorkFromContext(ctx: DashboardDataContext, filters?: DashboardFilterOptions): TodaysWorkItem[] {
    const qMap = ctx.qMap;
    const filteredQuestions = this.applyQuestionFilters(ctx.allQuestions, filters);
    const filteredVideos = this.applyVideoFilters(ctx.allVideos, filters, qMap);
    const publishingList = ctx.allPublishing;
    const items: TodaysWorkItem[] = [];

    const now = Date.now();

    // 1. Ready to upload videos (Highest priority for publishing)
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.READY_TO_UPLOAD)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'URGENT',
        ageDays: days,
        recommendedAction: 'Upload to YouTube Shorts, Reels & FB',
        actionUrl: `/publishing?videoId=${encodeURIComponent(v.id)}`,
        reason: 'Video render completed and ready for manual social publishing',
      });
    }

    // 2. Final Review videos
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.FINAL_REVIEW)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Perform Final QC Review',
        actionUrl: `/production/${encodeURIComponent(v.id)}`,
        reason: 'Edited video awaiting administrative approval and thumbnail sign-off',
      });
    }

    // 3. Script Required / Queued videos without script
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.SCRIPT_REQUIRED || vid.status === VideoProductionStatus.QUEUED)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: v.priority === 'HIGH' || v.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
        ageDays: days,
        recommendedAction: 'Draft Telugu Script & Hook',
        actionUrl: `/production/${encodeURIComponent(v.id)}?tab=script`,
        reason: 'Video in queue requires 10-second hook and Telugu timing breakdown',
      });
    }

    // 4. Script Ready videos waiting for recording
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.SCRIPT_READY)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Record in Studio with Teleprompter',
        actionUrl: `/production/${encodeURIComponent(v.id)}?tab=script`,
        reason: 'Script approved, ready for host filming in studio',
      });
    }

    // 5. Recorded videos waiting for editing
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.RECORDED)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Edit 9:16 Vertical Video & Captions',
        actionUrl: `/production/${encodeURIComponent(v.id)}`,
        reason: 'Raw studio footage filmed; editor assignment and cut needed',
      });
    }

    // 6. Editing in progress
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.EDITING)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'MEDIUM',
        ageDays: days,
        recommendedAction: 'Complete Video Edit & Render',
        actionUrl: `/production/${encodeURIComponent(v.id)}`,
        reason: 'Video undergoing editing; finalize captions and motion graphics',
      });
    }

    // 7. Approved questions not yet queued
    const queuedQuestionIds = new Set(ctx.allVideos.map((v) => v.questionId));
    for (const q of filteredQuestions.filter((item) => item.status === QuestionStatus.APPROVED && !queuedQuestionIds.has(item.id))) {
      const days = this.calculateDays(q.updatedAt || q.createdAt, now);
      items.push({
        id: q.id,
        entityType: 'QUESTION',
        title: safeTruncate(q.questionText, 60, `Question ${q.id}`),
        category: q.categoryName || q.categoryId,
        topic: q.topicName || q.topicId,
        currentStatus: q.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Add to Video Queue',
        actionUrl: `/queue?selectQuestion=${encodeURIComponent(q.id)}`,
        reason: 'Pedagogy and Telugu verified; ready to enter video production pipeline',
      });
    }

    // 8. Incomplete publishing records
    for (const pub of publishingList.filter((p: any) => p.completedPlatformsCount > 0 && p.completedPlatformsCount < p.totalPlatformsCount)) {
      const days = this.calculateDays(pub.updatedAt || pub.createdAt, now);
      const vid = ctx.allVideos.find((v) => v.id === pub.videoId);
      const q = vid ? qMap.get(vid.questionId) : undefined;
      items.push({
        id: pub.videoId,
        entityType: 'VIDEO',
        title: safeTruncate(vid?.title || q?.questionText, 60, `Publishing Record for ${pub.videoId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: 'INCOMPLETE_PUBLISHING',
        priority: 'MEDIUM',
        ageDays: days,
        recommendedAction: 'Complete All Platform URLs',
        actionUrl: `/publishing?videoId=${encodeURIComponent(pub.videoId)}`,
        reason: `Published on ${pub.completedPlatformsCount}/${pub.totalPlatformsCount} channels. Complete remaining platforms.`,
      });
    }

    // 9. Generated questions awaiting review
    for (const q of filteredQuestions.filter((item) => item.status === QuestionStatus.GENERATED).slice(0, 5)) {
      const days = this.calculateDays(q.updatedAt || q.createdAt, now);
      items.push({
        id: q.id,
        entityType: 'QUESTION',
        title: safeTruncate(q.questionText, 60, `Question ${q.id}`),
        category: q.categoryName || q.categoryId,
        topic: q.topicName || q.topicId,
        currentStatus: q.status,
        priority: 'NORMAL',
        ageDays: days,
        recommendedAction: 'Review AI Question Draft',
        actionUrl: `/questions/${encodeURIComponent(q.id)}`,
        reason: 'AI-generated question requires human verification and Telugu check',
      });
    }

    // Sort by priority weight, then by ageDays descending
    const priorityWeight: Record<string, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      NORMAL: 1,
      LOW: 0,
    };

    return items.sort((a, b) => {
      const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (weightDiff !== 0) return weightDiff;
      return b.ageDays - a.ageDays;
    });
  }

  /**
   * Analyzes production pipeline accumulation to detect workflow bottlenecks.
   */
  public async getBottlenecks(filters?: DashboardFilterOptions): Promise<BottleneckStage[]> {
    const ctx = await this.buildDataContext();
    return this.getBottlenecksFromContext(ctx, filters);
  }

  public getBottlenecksFromContext(ctx: DashboardDataContext, filters?: DashboardFilterOptions): BottleneckStage[] {
    const videos = this.applyVideoFilters(ctx.allVideos, filters, ctx.qMap);
    const questions = this.applyQuestionFilters(ctx.allQuestions, filters);

    const stages: BottleneckStage[] = [
      {
        stage: 'GENERATED_REVIEW',
        label: 'AI Questions for Review',
        count: questions.filter((q) => q.status === QuestionStatus.GENERATED).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Review and approve pending AI questions in Question Library',
      },
      {
        stage: VideoProductionStatus.SCRIPT_REQUIRED,
        label: 'Script Writing',
        count: videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_REQUIRED || v.status === VideoProductionStatus.QUEUED).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Draft Telugu scripts and speed trick hooks in Script Workspace',
      },
      {
        stage: VideoProductionStatus.SCRIPT_READY,
        label: 'Recording Studio Queue',
        count: videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_READY).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Schedule studio recording batches using fullscreen Teleprompter',
      },
      {
        stage: VideoProductionStatus.RECORDED,
        label: 'Post-Production / Editing',
        count: videos.filter((v) => v.status === VideoProductionStatus.RECORDED || v.status === VideoProductionStatus.EDITING).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Assign video editors to process 9:16 vertical shorts',
      },
      {
        stage: VideoProductionStatus.FINAL_REVIEW,
        label: 'Final Review & QC',
        count: videos.filter((v) => v.status === VideoProductionStatus.FINAL_REVIEW).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Lead review of edited video cuts and thumbnail approvals',
      },
      {
        stage: VideoProductionStatus.READY_TO_UPLOAD,
        label: 'Ready for Manual Upload',
        count: videos.filter((v) => v.status === VideoProductionStatus.READY_TO_UPLOAD).length,
        isBottleneck: false,
        severity: 'LOW',
        suggestion: 'Upload renders manually to YouTube Shorts, Reels, and Facebook',
      },
    ];

    let maxCount = 0;
    let bottleneckIndex = -1;

    stages.forEach((s, idx) => {
      if (s.count > maxCount) {
        maxCount = s.count;
        bottleneckIndex = idx;
      }
    });

    const threshold = BOTTLENECK_CONFIG.STAGE_ACCUMULATION_THRESHOLD;

    return stages.map((s, idx) => {
      const isMax = idx === bottleneckIndex && s.count > 0;
      const isOverThreshold = s.count >= threshold;
      const isBottleneck = isMax || isOverThreshold;

      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (s.count >= threshold * 2) {
        severity = 'HIGH';
      } else if (s.count >= threshold) {
        severity = 'MEDIUM';
      } else if (isMax && s.count > 1) {
        severity = 'MEDIUM';
      }

      return {
        ...s,
        isBottleneck,
        severity,
      };
    });
  }

  /**
   * Detects aging / stale content that has lingered in its current workflow stage.
   */
  public async getStaleContent(filters?: DashboardFilterOptions): Promise<StaleContentItem[]> {
    const ctx = await this.buildDataContext();
    return this.getStaleContentFromContext(ctx, filters);
  }

  public getStaleContentFromContext(ctx: DashboardDataContext, filters?: DashboardFilterOptions): StaleContentItem[] {
    const videos = this.applyVideoFilters(ctx.allVideos, filters, ctx.qMap);
    const questions = this.applyQuestionFilters(ctx.allQuestions, filters);
    const now = Date.now();
    const staleItems: StaleContentItem[] = [];

    // Analyze Active Videos
    for (const v of videos) {
      if (v.status === VideoProductionStatus.UPLOADED || v.status === VideoProductionStatus.CANCELLED) {
        continue;
      }
      const q = ctx.qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      let statusCategory: 'FRESH' | 'WAITING' | 'STALE' = 'FRESH';
      if (days >= AGING_THRESHOLDS.STALE_MIN_DAYS) {
        statusCategory = 'STALE';
      } else if (days >= AGING_THRESHOLDS.FRESH_MAX_DAYS) {
        statusCategory = 'WAITING';
      }

      staleItems.push({
        id: v.id,
        entityType: 'VIDEO',
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        daysInStage: days,
        statusCategory,
        lastUpdated: v.updatedAt || v.createdAt,
        actionUrl: `/production/${encodeURIComponent(v.id)}`,
      });
    }

    // Analyze Active Questions
    for (const q of questions) {
      if (q.status === QuestionStatus.APPROVED || q.status === QuestionStatus.REJECTED) {
        continue;
      }
      const days = this.calculateDays(q.updatedAt || q.createdAt, now);
      let statusCategory: 'FRESH' | 'WAITING' | 'STALE' = 'FRESH';
      if (days >= AGING_THRESHOLDS.STALE_MIN_DAYS) {
        statusCategory = 'STALE';
      } else if (days >= AGING_THRESHOLDS.FRESH_MAX_DAYS) {
        statusCategory = 'WAITING';
      }

      staleItems.push({
        id: q.id,
        entityType: 'QUESTION',
        title: safeTruncate(q.questionText, 60, `Question ${q.id}`),
        category: q.categoryName || q.categoryId,
        topic: q.topicName || q.topicId,
        currentStatus: q.status,
        daysInStage: days,
        statusCategory,
        lastUpdated: q.updatedAt || q.createdAt,
        actionUrl: `/questions/${encodeURIComponent(q.id)}`,
      });
    }

    const categoryOrder = { STALE: 3, WAITING: 2, FRESH: 1 };
    return staleItems.sort((a, b) => {
      const orderDiff = categoryOrder[b.statusCategory] - categoryOrder[a.statusCategory];
      if (orderDiff !== 0) return orderDiff;
      return b.daysInStage - a.daysInStage;
    });
  }

  /**
   * Evaluates publishing readiness for READY_TO_UPLOAD videos based on authoritative Phase 6 records.
   */
  public async getPublishingReadiness(filters?: DashboardFilterOptions): Promise<PublishingReadinessItem[]> {
    const ctx = await this.buildDataContext();
    return this.getPublishingReadinessFromContext(ctx, filters);
  }

  public getPublishingReadinessFromContext(ctx: DashboardDataContext, filters?: DashboardFilterOptions): PublishingReadinessItem[] {
    const targetVideos = this.applyVideoFilters(ctx.allVideos, filters, ctx.qMap).filter(
      (v) => v.status === VideoProductionStatus.READY_TO_UPLOAD || v.status === VideoProductionStatus.FINAL_REVIEW || v.status === VideoProductionStatus.UPLOADED
    );

    const results: PublishingReadinessItem[] = [];

    for (const v of targetVideos) {
      const q = ctx.qMap.get(v.questionId);
      const pub = ctx.allPublishing.find((p: any) => p.videoId === v.id);
      const thumb = ctx.allThumbnails.find((t: any) => t.videoId === v.id);
      const pin = ctx.allPinnedComments.find((p: any) => p.videoId === v.id);

      const videoRenderReady = v.status === VideoProductionStatus.READY_TO_UPLOAD || v.status === VideoProductionStatus.UPLOADED;
      const thumbnailApproved = thumb?.status === 'APPROVED' || pub?.thumbnailReady === true;
      const pinnedCommentReady = pin?.isApproved === true || pub?.pinnedCommentReady === true;
      const publishingRecordExists = Boolean(pub);

      const missingItems: string[] = [];
      if (!videoRenderReady) missingItems.push('Video render not completed');
      if (!thumbnailApproved) missingItems.push('Thumbnail approval pending');
      if (!pinnedCommentReady) missingItems.push('Pinned comment not approved');
      if (!publishingRecordExists) missingItems.push('Publishing checklist record missing');

      let status: 'READY' | 'BLOCKED' | 'INCOMPLETE' = 'READY';
      if (v.status === VideoProductionStatus.ON_HOLD || v.status === VideoProductionStatus.CANCELLED) {
        status = 'BLOCKED';
      } else if (missingItems.length > 0) {
        status = 'INCOMPLETE';
      }

      results.push({
        videoId: v.id,
        title: safeTruncate(v.title || q?.questionText, 60, `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        videoRenderReady,
        thumbnailApproved,
        pinnedCommentReady,
        publishingRecordExists,
        status,
        missingItems,
        platforms: {
          youtube: pub?.youtube?.status || SocialPublishStatus.NOT_STARTED,
          instagram: pub?.instagram?.status || SocialPublishStatus.NOT_STARTED,
          facebook: pub?.facebook?.status || SocialPublishStatus.NOT_STARTED,
        },
        actionUrl: `/publishing?videoId=${encodeURIComponent(v.id)}`,
      });
    }

    return results;
  }

  /**
   * Fast global search across questions and videos.
   */
  public async search(
    query: string,
    userRole?: string,
    userId?: string,
    existingActor?: ActorContext
  ): Promise<GlobalSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    if (!userId || !userRole) {
      return [];
    }

    const actor: ActorContext = existingActor || { id: userId, role: userRole as UserRole };
    const q = query.toLowerCase().trim();
    const [questions, videos, categories, topics, scripts, thumbnails, pinnedComments, assignments, contentMasters, socialReviews, publishingRecords] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      categoriesRepository.findAll(),
      topicsRepository.findAll(),
      scriptsRepository.findAll().catch(() => []),
      thumbnailsRepository.findAll().catch(() => []),
      pinnedCommentsRepository.findAll().catch(() => []),
      assignmentsRepository.findAll().catch(() => []),
      contentMastersRepository.findAll().catch(() => []),
      socialReviewsRepository.findAll().catch(() => []),
      publishingRepository.findAll().catch(() => []),
    ]);

    // Request-scoped optimization: Pre-populate actor active assignments from already fetched assignments
    if (!actor._cachedActiveAssignments && assignments && Array.isArray(assignments)) {
      actor._cachedActiveAssignments = assignments.filter(
        (a) => a.assigneeId === actor.id && a.status === 'ACTIVE'
      );
    }

    const results: GlobalSearchResult[] = [];

    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const topicMap = new Map(topics.map((t) => [t.id, t.name]));
    const qMap = new Map<string, Question>(questions.map((item) => [item.id, item]));
    const vMap = new Map(videos.map((v) => [v.id, v]));

    // Bounded concurrency helper to evaluate independent authorization checks concurrently
    // without unrestricted Promise.all or excessive simultaneous calls.
    const mapLimit = async <T, R>(
      items: T[],
      limit: number,
      fn: (item: T) => Promise<R>
    ): Promise<R[]> => {
      const results: R[] = new Array(items.length);
      let index = 0;
      const worker = async () => {
        while (index < items.length) {
          const current = index++;
          results[current] = await fn(items[current]);
        }
      };
      const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
      await Promise.all(workers);
      return results;
    };

    const isManagerOrAdmin = objectAuthService.isManagerOrAdmin(actor);
    const CONCURRENCY_LIMIT = 6;

    // 0. Content Masters
    const matchingMasters = contentMasters.filter((m) => {
      const matchId = (m.id || '').toLowerCase().includes(q);
      const matchTitle = (m.title || '').toLowerCase().includes(q);
      const matchPrimary = (m.primaryQuestionId || '').toLowerCase().includes(q);
      return matchId || matchTitle || matchPrimary;
    });

    if (matchingMasters.length > 0) {
      if (isManagerOrAdmin) {
        for (const m of matchingMasters) {
          const primaryQuestion = m.primaryQuestionId ? qMap.get(m.primaryQuestionId) : undefined;
          const targetUrl = m.id
            ? `/content-masters/${encodeURIComponent(m.id)}`
            : (primaryQuestion ? `/questions/${encodeURIComponent(primaryQuestion.id)}` : `/questions`);

          results.push({
            id: m.id,
            type: 'CONTENT_MASTER' as any,
            title: safeTruncate(m.title, 60, `Content Master ${m.id}`),
            subtitle: `Content Master • ${m.status} • Primary: ${m.primaryQuestionId || 'N/A'}`,
            category: primaryQuestion?.categoryName || catMap.get(m.categoryId || '') || 'General',
            topic: primaryQuestion?.topicName || topicMap.get(m.topicId || '') || 'General',
            status: m.status,
            url: targetUrl,
          });
          if (results.length >= 15) break;
        }
      } else {
        const authDecisions = await mapLimit(matchingMasters, CONCURRENCY_LIMIT, (m) =>
          objectAuthService.canAccessContentMaster(actor, m).catch(() => false)
        );
        for (let i = 0; i < matchingMasters.length; i++) {
          if (authDecisions[i]) {
            const m = matchingMasters[i];
            const primaryQuestion = m.primaryQuestionId ? qMap.get(m.primaryQuestionId) : undefined;
            const targetUrl = m.id
              ? `/content-masters/${encodeURIComponent(m.id)}`
              : (primaryQuestion ? `/questions/${encodeURIComponent(primaryQuestion.id)}` : `/questions`);

            results.push({
              id: m.id,
              type: 'CONTENT_MASTER' as any,
              title: safeTruncate(m.title, 60, `Content Master ${m.id}`),
              subtitle: `Content Master • ${m.status} • Primary: ${m.primaryQuestionId || 'N/A'}`,
              category: primaryQuestion?.categoryName || catMap.get(m.categoryId || '') || 'General',
              topic: primaryQuestion?.topicName || topicMap.get(m.topicId || '') || 'General',
              status: m.status,
              url: targetUrl,
            });
            if (results.length >= 15) break;
          }
        }
      }
    }

    // 1. Questions
    const matchingQuestions = questions.filter((item) => {
      const matchId = (item.id || '').toLowerCase().includes(q);
      const matchText = (item.questionText || '').toLowerCase().includes(q);
      const matchTopic = (item.topicName || topicMap.get(item.topicId) || item.topicId || '').toLowerCase().includes(q);
      const matchCat = (item.categoryName || catMap.get(item.categoryId) || item.categoryId || '').toLowerCase().includes(q);
      return matchId || matchText || matchTopic || matchCat;
    });

    if (matchingQuestions.length > 0 && results.length < 25) {
      if (isManagerOrAdmin) {
        for (const item of matchingQuestions) {
          results.push({
            id: item.id,
            type: 'QUESTION',
            title: safeTruncate(item.questionText, 60, `Question ${item.id}`),
            subtitle: `Question • ${item.difficulty || 'MEDIUM'} • ${QUESTION_STATUS_CONFIG[item.status]?.label || item.status}`,
            category: item.categoryName || catMap.get(item.categoryId) || item.categoryId || 'General',
            topic: item.topicName || topicMap.get(item.topicId) || item.topicId || 'General',
            status: item.status,
            url: `/questions/${encodeURIComponent(item.id)}`,
          });
          if (results.length >= 25) break;
        }
      } else {
        const authDecisions = await mapLimit(matchingQuestions, CONCURRENCY_LIMIT, (item) =>
          objectAuthService.canAccessQuestion(actor, item).catch(() => false)
        );
        for (let i = 0; i < matchingQuestions.length; i++) {
          if (authDecisions[i]) {
            const item = matchingQuestions[i];
            results.push({
              id: item.id,
              type: 'QUESTION',
              title: safeTruncate(item.questionText, 60, `Question ${item.id}`),
              subtitle: `Question • ${item.difficulty || 'MEDIUM'} • ${QUESTION_STATUS_CONFIG[item.status]?.label || item.status}`,
              category: item.categoryName || catMap.get(item.categoryId) || item.categoryId || 'General',
              topic: item.topicName || topicMap.get(item.topicId) || item.topicId || 'General',
              status: item.status,
              url: `/questions/${encodeURIComponent(item.id)}`,
            });
            if (results.length >= 25) break;
          }
        }
      }
    }

    // 2. Videos
    const matchingVideos = videos.filter((v) => {
      const question = qMap.get(v.questionId);
      const matchId = (v.id || '').toLowerCase().includes(q);
      const matchQId = (v.questionId || '').toLowerCase().includes(q);
      const matchTitle = (v.title || '').toLowerCase().includes(q);
      const catName = question?.categoryName || (question ? catMap.get(question.categoryId) : '') || 'Quantitative Aptitude';
      const topName = question?.topicName || (question ? topicMap.get(question.topicId) : '') || 'General';
      const matchTopic = topName.toLowerCase().includes(q);
      const matchCat = catName.toLowerCase().includes(q);
      return matchId || matchQId || matchTitle || matchTopic || matchCat;
    });

    if (matchingVideos.length > 0 && results.length < 50) {
      if (isManagerOrAdmin) {
        for (const v of matchingVideos) {
          const question = qMap.get(v.questionId);
          const catName = question?.categoryName || (question ? catMap.get(question.categoryId) : '') || 'Quantitative Aptitude';
          const topName = question?.topicName || (question ? topicMap.get(question.topicId) : '') || 'General';
          results.push({
            id: v.id,
            type: 'VIDEO',
            title: safeTruncate(v.title || question?.questionText, 60, `Video for Question ${v.questionId}`),
            subtitle: `Video • ${VIDEO_STATUS_CONFIG[v.status]?.label || v.status} • Priority: ${v.priority}`,
            category: catName,
            topic: topName,
            status: v.status,
            url: `/production/${encodeURIComponent(v.id)}`,
          });
          if (results.length >= 50) break;
        }
      } else {
        const authDecisions = await mapLimit(matchingVideos, CONCURRENCY_LIMIT, (v) =>
          objectAuthService.canAccessVideo(actor, v).catch(() => false)
        );
        for (let i = 0; i < matchingVideos.length; i++) {
          if (authDecisions[i]) {
            const v = matchingVideos[i];
            const question = qMap.get(v.questionId);
            const catName = question?.categoryName || (question ? catMap.get(question.categoryId) : '') || 'Quantitative Aptitude';
            const topName = question?.topicName || (question ? topicMap.get(question.topicId) : '') || 'General';
            results.push({
              id: v.id,
              type: 'VIDEO',
              title: safeTruncate(v.title || question?.questionText, 60, `Video for Question ${v.questionId}`),
              subtitle: `Video • ${VIDEO_STATUS_CONFIG[v.status]?.label || v.status} • Priority: ${v.priority}`,
              category: catName,
              topic: topName,
              status: v.status,
              url: `/production/${encodeURIComponent(v.id)}`,
            });
            if (results.length >= 50) break;
          }
        }
      }
    }

    // Role permissions for entity search results
    const canViewScript = userRole && [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER].includes(userRole as UserRole);
    const canViewThumbnail = userRole && [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.DESIGNER].includes(userRole as UserRole);
    const canViewPinnedComment = userRole && [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER, UserRole.CONTENT_WRITER, UserRole.SCRIPT_WRITER].includes(userRole as UserRole);
    const canViewAllAssignments = userRole && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(userRole as UserRole);

    // 3. Scripts
    if (canViewScript && results.length < 65) {
      const matchingScripts = scripts.filter((s) => {
        const matchId = (s.id || '').toLowerCase().includes(q);
        const matchVId = (s.videoId || '').toLowerCase().includes(q);
        const matchContent = (s.content || s.hook || '').toLowerCase().includes(q);
        return matchId || matchVId || matchContent;
      });

      if (matchingScripts.length > 0) {
        if (isManagerOrAdmin) {
          for (const s of matchingScripts) {
            const v = vMap.get(s.videoId);
            const qRecord = v ? qMap.get(v.questionId) : undefined;
            const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
            const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
            results.push({
              id: s.id,
              type: 'SCRIPT',
              title: safeTruncate(s.hook || s.content || v?.title || `Script for ${s.videoId}`, 60, `Script ${s.id}`),
              subtitle: `Script • ${s.status || 'DRAFT'} • Video: ${s.videoId}`,
              category: catName,
              topic: topName,
              status: s.status || 'DRAFT',
              url: `/production/${encodeURIComponent(s.videoId)}?tab=script`,
            });
            if (results.length >= 65) break;
          }
        } else {
          const authDecisions = await mapLimit(matchingScripts, CONCURRENCY_LIMIT, (s) =>
            objectAuthService.canAccessScript(actor, s).catch(() => false)
          );
          for (let i = 0; i < matchingScripts.length; i++) {
            if (authDecisions[i]) {
              const s = matchingScripts[i];
              const v = vMap.get(s.videoId);
              const qRecord = v ? qMap.get(v.questionId) : undefined;
              const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
              const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
              results.push({
                id: s.id,
                type: 'SCRIPT',
                title: safeTruncate(s.hook || s.content || v?.title || `Script for ${s.videoId}`, 60, `Script ${s.id}`),
                subtitle: `Script • ${s.status || 'DRAFT'} • Video: ${s.videoId}`,
                category: catName,
                topic: topName,
                status: s.status || 'DRAFT',
                url: `/production/${encodeURIComponent(s.videoId)}?tab=script`,
              });
              if (results.length >= 65) break;
            }
          }
        }
      }
    }

    // 4. Thumbnails
    if (canViewThumbnail && results.length < 75) {
      const matchingThumbnails = thumbnails.filter((t) => {
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchVId = (t.videoId || '').toLowerCase().includes(q);
        const matchConcept = (t.conceptTitle || t.prompt || '').toLowerCase().includes(q);
        return matchId || matchVId || matchConcept;
      });

      if (matchingThumbnails.length > 0) {
        if (isManagerOrAdmin) {
          for (const t of matchingThumbnails) {
            const v = vMap.get(t.videoId);
            const qRecord = v ? qMap.get(v.questionId) : undefined;
            const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
            const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
            results.push({
              id: t.id,
              type: 'THUMBNAIL',
              title: safeTruncate(t.conceptTitle || t.prompt || `Thumbnail for ${t.videoId}`, 60, `Thumbnail ${t.id}`),
              subtitle: `Thumbnail • ${t.status || 'PENDING'} • Video: ${t.videoId}`,
              category: catName,
              topic: topName,
              status: t.status || 'PENDING',
              url: `/production/${encodeURIComponent(t.videoId)}?tab=thumbnail`,
            });
            if (results.length >= 75) break;
          }
        } else {
          const authDecisions = await mapLimit(matchingThumbnails, CONCURRENCY_LIMIT, (t) =>
            objectAuthService.canAccessThumbnail(actor, t).catch(() => false)
          );
          for (let i = 0; i < matchingThumbnails.length; i++) {
            if (authDecisions[i]) {
              const t = matchingThumbnails[i];
              const v = vMap.get(t.videoId);
              const qRecord = v ? qMap.get(v.questionId) : undefined;
              const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
              const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
              results.push({
                id: t.id,
                type: 'THUMBNAIL',
                title: safeTruncate(t.conceptTitle || t.prompt || `Thumbnail for ${t.videoId}`, 60, `Thumbnail ${t.id}`),
                subtitle: `Thumbnail • ${t.status || 'PENDING'} • Video: ${t.videoId}`,
                category: catName,
                topic: topName,
                status: t.status || 'PENDING',
                url: `/production/${encodeURIComponent(t.videoId)}?tab=thumbnail`,
              });
              if (results.length >= 75) break;
            }
          }
        }
      }
    }

    // 5. Pinned Comments
    if (canViewPinnedComment && results.length < 85) {
      const matchingComments = pinnedComments.filter((p) => {
        const matchId = (p.id || '').toLowerCase().includes(q);
        const matchVId = (p.videoId || '').toLowerCase().includes(q);
        const matchComment = (p.commentText || '').toLowerCase().includes(q);
        return matchId || matchVId || matchComment;
      });

      if (matchingComments.length > 0) {
        if (isManagerOrAdmin) {
          for (const p of matchingComments) {
            const v = vMap.get(p.videoId);
            const qRecord = v ? qMap.get(v.questionId) : undefined;
            const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
            const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
            results.push({
              id: p.id,
              type: 'PINNED_COMMENT',
              title: safeTruncate(p.commentText || `Pinned comment for ${p.videoId}`, 60, `Comment ${p.id}`),
              subtitle: `Pinned Comment • ${p.status || 'DRAFT'} • Video: ${p.videoId}`,
              category: catName,
              topic: topName,
              status: p.status || 'DRAFT',
              url: `/production/${encodeURIComponent(p.videoId)}?tab=pinned-comment`,
            });
            if (results.length >= 85) break;
          }
        } else {
          const authDecisions = await mapLimit(matchingComments, CONCURRENCY_LIMIT, (p) =>
            objectAuthService.canAccessPinnedComment(actor, p).catch(() => false)
          );
          for (let i = 0; i < matchingComments.length; i++) {
            if (authDecisions[i]) {
              const p = matchingComments[i];
              const v = vMap.get(p.videoId);
              const qRecord = v ? qMap.get(v.questionId) : undefined;
              const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'General';
              const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'General';
              results.push({
                id: p.id,
                type: 'PINNED_COMMENT',
                title: safeTruncate(p.commentText || `Pinned comment for ${p.videoId}`, 60, `Comment ${p.id}`),
                subtitle: `Pinned Comment • ${p.status || 'DRAFT'} • Video: ${p.videoId}`,
                category: catName,
                topic: topName,
                status: p.status || 'DRAFT',
                url: `/production/${encodeURIComponent(p.videoId)}?tab=pinned-comment`,
              });
              if (results.length >= 85) break;
            }
          }
        }
      }
    }

    // 6. Assignments
    for (const a of assignments) {
      const isAssignedToUser = userId && a.assigneeId === userId;
      if (!canViewAllAssignments && !isAssignedToUser) {
        continue;
      }

      const matchId = (a.id || '').toLowerCase().includes(q);
      const matchEId = (a.entityId || a.videoId || '').toLowerCase().includes(q);
      const matchName = (a.assigneeName || a.notes || '').toLowerCase().includes(q);

      if (matchId || matchEId || matchName) {
        const entityId = a.entityId || a.videoId || '';
        const entityType = a.entityType || 'VIDEO';
        const isQuestion = entityType === 'QUESTION';
        const url = isQuestion
          ? `/questions/${encodeURIComponent(entityId)}`
          : `/production/${encodeURIComponent(entityId)}`;

        results.push({
          id: a.id,
          type: 'ASSIGNMENT',
          title: safeTruncate(`Assignment: ${a.assigneeName || 'Unassigned'} (${a.role})`, 60, `Assignment ${a.id}`),
          subtitle: `Assignment • ${a.status} • Entity: ${entityId}`,
          category: 'Team Operations',
          topic: a.role || 'General',
          status: a.status,
          url,
        });
      }
      if (results.length >= 100) break;
    }

    // 7. Social Reviews (Phase 14.2)
    if (results.length < 115) {
      const matchingReviews = socialReviews.filter((sr) => {
        const matchId = (sr.id || '').toLowerCase().includes(q);
        const matchQId = (sr.questionId || '').toLowerCase().includes(q);
        const matchCMId = (sr.contentMasterId || '').toLowerCase().includes(q);
        const matchDecision = (sr.decision || '').toLowerCase().includes(q);
        const matchReason = (sr.reason || '').toLowerCase().includes(q);

        const qRecord = sr.questionId ? qMap.get(sr.questionId) : undefined;
        const matchQText = (qRecord?.questionText || '').toLowerCase().includes(q);

        const linkedVideo = Array.from(vMap.values()).find((v) => v.questionId === sr.questionId);
        const matchVId = Boolean(linkedVideo && (linkedVideo.id || '').toLowerCase().includes(q));

        const canSearchReviewerInfo = isManagerOrAdmin || actor.id === sr.reviewerId;
        const matchReviewer = canSearchReviewerInfo && (
          (sr.reviewerName || '').toLowerCase().includes(q) ||
          (sr.reviewerId || '').toLowerCase().includes(q)
        );

        return matchId || matchQId || matchCMId || matchDecision || matchReason || matchQText || matchVId || matchReviewer;
      });

      if (matchingReviews.length > 0) {
        if (isManagerOrAdmin) {
          for (const sr of matchingReviews) {
            const qRecord = sr.questionId ? qMap.get(sr.questionId) : undefined;
            const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'Quality Assurance';
            const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'Social Review';
            results.push({
              id: sr.id,
              type: 'SOCIAL_REVIEW',
              title: safeTruncate(
                `Social Review (${sr.decision || 'PENDING'}): ${qRecord?.questionText || sr.questionId}`,
                60,
                `Review ${sr.id}`
              ),
              subtitle: `Social Review • ${sr.decision || 'PENDING'} • Question: ${sr.questionId}${sr.reviewerName ? ` • Reviewer: ${sr.reviewerName}` : ''}`,
              category: catName,
              topic: topName,
              status: sr.decision || 'PENDING',
              url: sr.questionId ? `/questions/${encodeURIComponent(sr.questionId)}` : `/questions`,
            });
            if (results.length >= 115) break;
          }
        } else {
          const authDecisions = await mapLimit(matchingReviews, CONCURRENCY_LIMIT, async (sr) => {
            const qRecord = sr.questionId ? qMap.get(sr.questionId) : undefined;
            if (actor.role === UserRole.REVIEWER) {
              if (sr.reviewerId === actor.id) return true;
              if (sr.questionId) {
                return await objectAuthService.hasActiveAssignment(actor, 'QUESTION', sr.questionId).catch(() => false);
              }
            } else if (qRecord && (qRecord.authorId === actor.id || (qRecord as any).createdBy === actor.id)) {
              return true;
            }
            return false;
          });

          for (let i = 0; i < matchingReviews.length; i++) {
            if (authDecisions[i]) {
              const sr = matchingReviews[i];
              const qRecord = sr.questionId ? qMap.get(sr.questionId) : undefined;
              const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'Quality Assurance';
              const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'Social Review';
              results.push({
                id: sr.id,
                type: 'SOCIAL_REVIEW',
                title: safeTruncate(
                  `Social Review (${sr.decision || 'PENDING'}): ${qRecord?.questionText || sr.questionId}`,
                  60,
                  `Review ${sr.id}`
                ),
                subtitle: `Social Review • ${sr.decision || 'PENDING'} • Question: ${sr.questionId}${sr.reviewerName ? ` • Reviewer: ${sr.reviewerName}` : ''}`,
                category: catName,
                topic: topName,
                status: sr.decision || 'PENDING',
                url: sr.questionId ? `/questions/${encodeURIComponent(sr.questionId)}` : `/questions`,
              });
              if (results.length >= 115) break;
            }
          }
        }
      }
    }

    // 8. Publishing Records (Phase 14.2)
    if (results.length < 130) {
      const matchingPublishing = publishingRecords.filter((p) => {
        const matchId = (p.id || '').toLowerCase().includes(q);
        const matchVId = (p.videoId || '').toLowerCase().includes(q);
        const matchQId = (p.questionId || '').toLowerCase().includes(q);
        const matchTitle = (p.videoTitle || '').toLowerCase().includes(q);
        const matchStatus = (p.finalVideoStatus || '').toLowerCase().includes(q);
        const matchYoutube = (p.youtube?.status || '').toLowerCase().includes(q);
        const matchInstagram = (p.instagram?.status || '').toLowerCase().includes(q);
        const matchFacebook = (p.facebook?.status || '').toLowerCase().includes(q);
        const matchScheduled = (
          (p.youtubeScheduledAt || '').toLowerCase().includes(q) ||
          (p.instagramScheduledAt || '').toLowerCase().includes(q) ||
          (p.facebookScheduledAt || '').toLowerCase().includes(q)
        );
        return matchId || matchVId || matchQId || matchTitle || matchStatus || matchYoutube || matchInstagram || matchFacebook || matchScheduled;
      });

      if (matchingPublishing.length > 0) {
        if (isManagerOrAdmin) {
          for (const p of matchingPublishing) {
            const qRecord = p.questionId ? qMap.get(p.questionId) : undefined;
            const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'Publishing';
            const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'Distribution';
            results.push({
              id: p.id,
              type: 'PUBLISHING',
              title: safeTruncate(
                p.videoTitle || `Publishing Package for ${p.videoId}`,
                60,
                `Publishing ${p.id}`
              ),
              subtitle: `Publishing • ${p.finalVideoStatus || 'READY'} • Video: ${p.videoId}`,
              category: catName,
              topic: topName,
              status: p.finalVideoStatus || 'READY',
              url: p.videoId ? `/publishing?videoId=${encodeURIComponent(p.videoId)}` : `/publishing`,
            });
            if (results.length >= 130) break;
          }
        } else {
          const authDecisions = await mapLimit(matchingPublishing, CONCURRENCY_LIMIT, (p) =>
            objectAuthService.canAccessPublishing(actor, p).catch(() => false)
          );
          for (let i = 0; i < matchingPublishing.length; i++) {
            if (authDecisions[i]) {
              const p = matchingPublishing[i];
              const qRecord = p.questionId ? qMap.get(p.questionId) : undefined;
              const catName = qRecord?.categoryName || (qRecord ? catMap.get(qRecord.categoryId) : '') || 'Publishing';
              const topName = qRecord?.topicName || (qRecord ? topicMap.get(qRecord.topicId) : '') || 'Distribution';
              results.push({
                id: p.id,
                type: 'PUBLISHING',
                title: safeTruncate(
                  p.videoTitle || `Publishing Package for ${p.videoId}`,
                  60,
                  `Publishing ${p.id}`
                ),
                subtitle: `Publishing • ${p.finalVideoStatus || 'READY'} • Video: ${p.videoId}`,
                category: catName,
                topic: topName,
                status: p.finalVideoStatus || 'READY',
                url: p.videoId ? `/publishing?videoId=${encodeURIComponent(p.videoId)}` : `/publishing`,
              });
              if (results.length >= 130) break;
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Unified dashboard overview data aggregator with single-pass repository fetch and short-lived memory cache.
   */
  public async getOverview(filters?: DashboardFilterOptions, forceRefresh = false): Promise<DashboardOverviewData> {
    const cacheKey = JSON.stringify(filters || {});
    const now = Date.now();

    if (!forceRefresh) {
      const cached = this.overviewCache.get(cacheKey);
      if (cached && now - cached.timestamp < this.OVERVIEW_CACHE_TTL_MS) {
        return cached.data;
      }

      const inFlight = this.overviewInFlight.get(cacheKey);
      if (inFlight) {
        return inFlight;
      }
    }

    const computePromise = (async () => {
      const ctx = await this.buildDataContext();

      const metrics = this.getMetricsFromContext(ctx, filters);
      const todaysWork = this.getTodaysWorkFromContext(ctx, filters);
      const bottlenecks = this.getBottlenecksFromContext(ctx, filters);
      const staleContent = this.getStaleContentFromContext(ctx, filters);
      const publishingReadiness = this.getPublishingReadinessFromContext(ctx, filters);
      const teamWorkload = assignmentService.getTeamWorkloadSummaryWithData(ctx.allUsers, ctx.allAssignments);
      const unassignedWork = assignmentService.getUnassignedWorkWithData(ctx.allVideos, ctx.allAssignments, ctx.allPublishing);

      const recentQuestions = this.applyQuestionFilters(ctx.allQuestions, filters).slice(0, 5);
      const recentVideos = this.applyVideoFilters(ctx.allVideos, filters, ctx.qMap).slice(0, 5);
      const recentAuditLogs = ctx.allAuditLogs.slice(0, 10);

      const data: DashboardOverviewData = {
        metrics,
        todaysWork,
        bottlenecks,
        staleContent,
        publishingReadiness,
        recentQuestions,
        recentVideos,
        recentAuditLogs,
        teamOperations: {
          totalActiveTasks: teamWorkload.totalActiveTasks,
          totalOverdueTasks: teamWorkload.totalOverdueTasks,
          totalBlockedTasks: teamWorkload.totalBlockedTasks,
          totalUnassignedTasks: unassignedWork.length,
          unassignedWork: unassignedWork.slice(0, 6),
          topWorkloadUser: teamWorkload.highestWorkloadUser
            ? { name: teamWorkload.highestWorkloadUser.name, score: teamWorkload.highestWorkloadUser.score }
            : undefined,
        },
      };

      this.overviewCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    })();

    this.overviewInFlight.set(cacheKey, computePromise);

    try {
      return await computePromise;
    } finally {
      this.overviewInFlight.delete(cacheKey);
    }
  }

  // --- Helper Functions ---

  private calculateDays(isoString: string | undefined, nowMs: number): number {
    if (!isoString) return 0;
    try {
      const dateMs = new Date(isoString).getTime();
      if (isNaN(dateMs)) return 0;
      const diffMs = Math.max(0, nowMs - dateMs);
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  private applyQuestionFilters(questions: Question[], filters?: DashboardFilterOptions): Question[] {
    if (!filters) return questions;
    return questions.filter((q) => {
      if (filters.categoryId && q.categoryId !== filters.categoryId) return false;
      if (filters.topicId && q.topicId !== filters.topicId) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.questionStatus && q.status !== filters.questionStatus) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const match =
          q.id.toLowerCase().includes(query) ||
          q.questionText.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }

  private applyVideoFilters(
    videos: Video[],
    filters?: DashboardFilterOptions,
    questionsMap?: Map<string, Question>
  ): Video[] {
    if (!filters) return videos;
    return videos.filter((v) => {
      const q = questionsMap?.get(v.questionId);
      if (filters.categoryId && q && q.categoryId !== filters.categoryId) return false;
      if (filters.topicId && q && q.topicId !== filters.topicId) return false;
      if (filters.difficulty && q && q.difficulty !== filters.difficulty) return false;
      if (filters.videoStatus && v.status !== filters.videoStatus) return false;
      if (filters.priority && v.priority !== filters.priority) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const match =
          v.id.toLowerCase().includes(query) ||
          v.questionId.toLowerCase().includes(query) ||
          (v.title || '').toLowerCase().includes(query) ||
          (q && q.questionText.toLowerCase().includes(query));
        if (!match) return false;
      }
      return true;
    });
  }
}

export const dashboardService = DashboardService.getInstance();
