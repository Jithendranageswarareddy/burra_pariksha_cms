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
} from '../repositories';
import { assignmentService } from './assignment.service';
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

export class DashboardService {
  private static instance: DashboardService | null = null;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Computes comprehensive dashboard metric cards across Questions, Videos, and Publishing.
   */
  public async getMetrics(filters?: DashboardFilterOptions): Promise<DashboardMetrics> {
    const [allQuestions, allVideos, allPublishing] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      publishingRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    const questions = this.applyQuestionFilters(allQuestions, filters);
    const videos = this.applyVideoFilters(allVideos, filters, qMap);

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
    const [questions, videos, publishingList] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      publishingRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(questions.map((q) => [q.id, q]));
    const filteredQuestions = this.applyQuestionFilters(questions, filters);
    const filteredVideos = this.applyVideoFilters(videos, filters, qMap);
    const items: TodaysWorkItem[] = [];

    const now = Date.now();

    // 1. Ready to upload videos (Highest priority for publishing)
    for (const v of filteredVideos.filter((vid) => vid.status === VideoProductionStatus.READY_TO_UPLOAD)) {
      const q = qMap.get(v.questionId);
      const days = this.calculateDays(v.updatedAt || v.createdAt, now);
      items.push({
        id: v.id,
        entityType: 'VIDEO',
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Perform Final QC Review',
        actionUrl: `/videos/${encodeURIComponent(v.id)}`,
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: v.priority === 'HIGH' || v.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
        ageDays: days,
        recommendedAction: 'Draft Telugu Script & Hook',
        actionUrl: `/videos/${encodeURIComponent(v.id)}?tab=script`,
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Record in Studio with Teleprompter',
        actionUrl: `/videos/${encodeURIComponent(v.id)}?tab=script`,
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'HIGH',
        ageDays: days,
        recommendedAction: 'Edit 9:16 Vertical Video & Captions',
        actionUrl: `/videos/${encodeURIComponent(v.id)}`,
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        priority: 'MEDIUM',
        ageDays: days,
        recommendedAction: 'Complete Video Edit & Render',
        actionUrl: `/videos/${encodeURIComponent(v.id)}`,
        reason: 'Video undergoing editing; finalize captions and motion graphics',
      });
    }

    // 7. Approved questions not yet queued
    const queuedQuestionIds = new Set(videos.map((v) => v.questionId));
    for (const q of filteredQuestions.filter((item) => item.status === QuestionStatus.APPROVED && !queuedQuestionIds.has(item.id))) {
      const days = this.calculateDays(q.updatedAt || q.createdAt, now);
      items.push({
        id: q.id,
        entityType: 'QUESTION',
        title: q.questionText.substring(0, 60),
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
    for (const pub of publishingList.filter((p) => p.completedPlatformsCount > 0 && p.completedPlatformsCount < p.totalPlatformsCount)) {
      const days = this.calculateDays(pub.updatedAt || pub.createdAt, now);
      const vid = videos.find((v) => v.id === pub.videoId);
      const q = vid ? qMap.get(vid.questionId) : undefined;
      items.push({
        id: pub.videoId,
        entityType: 'VIDEO',
        title: vid?.title || `Publishing Record for ${pub.videoId}`,
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
        title: q.questionText.substring(0, 60),
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
    const [allVideos, allQuestions] = await Promise.all([
      videosRepository.findAll(),
      questionsRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    const videos = this.applyVideoFilters(allVideos, filters, qMap);
    const questions = this.applyQuestionFilters(allQuestions, filters);

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

    // Find the max count among non-zero stages
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
    const [allVideos, allQuestions] = await Promise.all([
      videosRepository.findAll(),
      questionsRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    const videos = this.applyVideoFilters(allVideos, filters, qMap);
    const questions = this.applyQuestionFilters(allQuestions, filters);
    const now = Date.now();
    const staleItems: StaleContentItem[] = [];

    // Analyze Active Videos
    for (const v of videos) {
      if (v.status === VideoProductionStatus.UPLOADED || v.status === VideoProductionStatus.CANCELLED) {
        continue;
      }
      const q = qMap.get(v.questionId);
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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
        category: q?.categoryName || q?.categoryId || 'Quantitative Aptitude',
        topic: q?.topicName || q?.topicId || 'General',
        currentStatus: v.status,
        daysInStage: days,
        statusCategory,
        lastUpdated: v.updatedAt || v.createdAt,
        actionUrl: `/videos/${encodeURIComponent(v.id)}`,
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
        title: q.questionText.substring(0, 60),
        category: q.categoryName || q.categoryId,
        topic: q.topicName || q.topicId,
        currentStatus: q.status,
        daysInStage: days,
        statusCategory,
        lastUpdated: q.updatedAt || q.createdAt,
        actionUrl: `/questions/${encodeURIComponent(q.id)}`,
      });
    }

    // Sort: Stale first, then Waiting, then Fresh; within category by daysInStage descending
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
    const [allVideos, publishingList, thumbnails, pinnedComments, allQuestions] = await Promise.all([
      videosRepository.findAll(),
      publishingRepository.findAll(),
      thumbnailsRepository.findAll(),
      pinnedCommentsRepository.findAll(),
      questionsRepository.findAll(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    const targetVideos = this.applyVideoFilters(allVideos, filters, qMap).filter(
      (v) => v.status === VideoProductionStatus.READY_TO_UPLOAD || v.status === VideoProductionStatus.FINAL_REVIEW || v.status === VideoProductionStatus.UPLOADED
    );

    const results: PublishingReadinessItem[] = [];

    for (const v of targetVideos) {
      const q = qMap.get(v.questionId);
      const pub = publishingList.find((p) => p.videoId === v.id);
      const thumb = thumbnails.find((t) => t.videoId === v.id);
      const pin = pinnedComments.find((p) => p.videoId === v.id);

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
        title: v.title || (q ? q.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
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
  public async search(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const [questions, videos, categories, topics] = await Promise.all([
      questionsRepository.findAll(),
      videosRepository.findAll(),
      categoriesRepository.findAll(),
      topicsRepository.findAll(),
    ]);

    const results: GlobalSearchResult[] = [];

    // Helper map for names
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const topicMap = new Map(topics.map((t) => [t.id, t.name]));
    const qMap = new Map<string, Question>(questions.map((item) => [item.id, item]));

    // Search Questions
    for (const item of questions) {
      const matchId = item.id.toLowerCase().includes(q);
      const matchText = item.questionText.toLowerCase().includes(q);
      const matchTopic = (item.topicName || topicMap.get(item.topicId) || item.topicId).toLowerCase().includes(q);
      const matchCat = (item.categoryName || catMap.get(item.categoryId) || item.categoryId).toLowerCase().includes(q);

      if (matchId || matchText || matchTopic || matchCat) {
        results.push({
          id: item.id,
          type: 'QUESTION',
          title: item.questionText.substring(0, 60),
          subtitle: `Question • ${item.difficulty} • ${QUESTION_STATUS_CONFIG[item.status]?.label || item.status}`,
          category: item.categoryName || catMap.get(item.categoryId) || item.categoryId,
          topic: item.topicName || topicMap.get(item.topicId) || item.topicId,
          status: item.status,
          url: `/questions/${encodeURIComponent(item.id)}`,
        });
      }
      if (results.length >= 25) break;
    }

    // Search Videos
    for (const v of videos) {
      const question = qMap.get(v.questionId);
      const matchId = v.id.toLowerCase().includes(q);
      const matchQId = v.questionId.toLowerCase().includes(q);
      const matchTitle = (v.title || '').toLowerCase().includes(q);
      const catName = question?.categoryName || (question ? catMap.get(question.categoryId) : '') || 'Quantitative Aptitude';
      const topName = question?.topicName || (question ? topicMap.get(question.topicId) : '') || 'General';
      const matchTopic = topName.toLowerCase().includes(q);
      const matchCat = catName.toLowerCase().includes(q);

      if (matchId || matchQId || matchTitle || matchTopic || matchCat) {
        results.push({
          id: v.id,
          type: 'VIDEO',
          title: v.title || (question ? question.questionText.substring(0, 60) : `Video for Question ${v.questionId}`),
          subtitle: `Video • ${VIDEO_STATUS_CONFIG[v.status]?.label || v.status} • Priority: ${v.priority}`,
          category: catName,
          topic: topName,
          status: v.status,
          url: `/videos/${encodeURIComponent(v.id)}`,
        });
      }
      if (results.length >= 50) break;
    }

    return results;
  }

  /**
   * Unified dashboard overview data aggregator.
   */
  public async getOverview(filters?: DashboardFilterOptions): Promise<DashboardOverviewData> {
    const [
      metrics,
      todaysWork,
      bottlenecks,
      staleContent,
      publishingReadiness,
      allQuestions,
      allVideos,
      auditLogs,
      teamWorkload,
      unassignedWork,
    ] = await Promise.all([
      this.getMetrics(filters),
      this.getTodaysWork(filters),
      this.getBottlenecks(filters),
      this.getStaleContent(filters),
      this.getPublishingReadiness(filters),
      questionsRepository.findAll(),
      videosRepository.findAll(),
      auditLogRepository.findAll(),
      assignmentService.getTeamWorkloadSummary(),
      assignmentService.getUnassignedWork(),
    ]);

    const qMap = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));
    const recentQuestions = this.applyQuestionFilters(allQuestions, filters).slice(0, 5);
    const recentVideos = this.applyVideoFilters(allVideos, filters, qMap).slice(0, 5);
    const recentAuditLogs = auditLogs.slice(0, 10);

    return {
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
