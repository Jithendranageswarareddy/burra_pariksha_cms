/**
 * BURRA PARIKSHA CMS - Production Board Service
 * Task 3E.2.1: Unified Production Board Read Model
 */

import {
  ProductionBoardItem,
  VideoProductionStatus,
  SocialPublishStatus,
  DifficultyLevel,
  User,
  RenderValidationStatus,
  CanonicalProductionReadiness,
} from '../../types';
import { publishingService } from './publishing.service';
import { ProductionAssetValidationService } from './production-asset-validation.service';
import {
  videosRepository,
  questionsRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  assignmentsRepository,
  usersRepository,
} from '../repositories';

export class ProductionBoardService {
  private static instance: ProductionBoardService | null = null;

  private constructor() {}

  public static getInstance(): ProductionBoardService {
    if (!ProductionBoardService.instance) {
      ProductionBoardService.instance = new ProductionBoardService();
    }
    return ProductionBoardService.instance;
  }

  /**
   * Generates a unified view of all active production items (videos)
   * with their associated related entity statuses for the Unified Production Board.
   * Utilizes batched repository fetches for high-performance sub-second evaluation.
   */
  public async getProductionBoard(): Promise<ProductionBoardItem[]> {
    // 1. Fetch all related collections concurrently in batched queries
    const [
      videos,
      questions,
      scripts,
      thumbnails,
      pinnedComments,
      publishings,
      assignments,
      users,
    ] = await Promise.all([
      videosRepository.findAll(),
      questionsRepository.findAll(),
      scriptsRepository.findAll(),
      thumbnailsRepository.findAll(),
      pinnedCommentsRepository.findAll(),
      publishingRepository.findAll(),
      assignmentsRepository.findAll(),
      usersRepository.findAll().catch((): User[] => []),
    ]);

    // 2. Build indexed lookup maps
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const scriptMap = new Map(scripts.map((s) => [s.videoId, s]));
    const thumbnailMap = new Map(thumbnails.map((t) => [t.videoId, t]));
    const commentMap = new Map(pinnedComments.map((c) => [c.videoId, c]));
    const publishingMap = new Map(publishings.map((p) => [p.videoId, p]));
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

    // Index active video assignments
    const activeAssignmentsByVideo = new Map<string, typeof assignments[0]>();
    for (const a of assignments) {
      const vId = a.videoId || (a.entityType?.toLowerCase() === 'video' ? a.entityId : undefined);
      if (
        vId &&
        (a.status === 'ACTIVE' || a.status === 'PENDING' || a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS')
      ) {
        if (!activeAssignmentsByVideo.has(vId)) {
          activeAssignmentsByVideo.set(vId, a);
        }
      }
    }

    const now = new Date();
    const boardItems: ProductionBoardItem[] = [];
    const seenVideoIds = new Set<string>();

    const readinessResults = await Promise.all(
      videos.map(async (v) => {
        try {
          const res = await publishingService.validatePublishReadiness(v.id, { skipAudit: true });
          return { videoId: v.id, res };
        } catch {
          return { videoId: v.id, res: null };
        }
      })
    );
    const readinessMap = new Map(readinessResults.map((r) => [r.videoId, r.res]));

    // 3. Assemble production board records in-memory with zero redundant network hops
    for (const video of videos) {
      if (!video.id || seenVideoIds.has(video.id)) continue;
      seenVideoIds.add(video.id);

      const question = questionMap.get(video.questionId);
      if (!question) continue;

      const script = scriptMap.get(video.id);
      const thumbnail = thumbnailMap.get(video.id);
      const pinnedComment = commentMap.get(video.id);
      const publishing = publishingMap.get(video.id);
      const activeAssignment = activeAssignmentsByVideo.get(video.id);

      let assignee = undefined;
      if (activeAssignment) {
        const u = userMap.get(activeAssignment.assigneeId);
        assignee = {
          id: activeAssignment.assigneeId,
          name: activeAssignment.assigneeName || u?.name || activeAssignment.assigneeId,
          email: u?.email,
          role: activeAssignment.assignmentRole || u?.role,
        };
      }

      const dueDate = video.scheduledPublishDate ? new Date(video.scheduledPublishDate) : undefined;
      const isOverdue = dueDate ? dueDate < now && video.status !== VideoProductionStatus.UPLOADED : false;

      // Completed platforms count
      const completedPlatformsCount = [
        publishing?.youtube?.status === SocialPublishStatus.PUBLISHED,
        publishing?.instagram?.status === SocialPublishStatus.PUBLISHED,
        publishing?.facebook?.status === SocialPublishStatus.PUBLISHED,
      ].filter(Boolean).length;

      // Readiness score calculation based on lifecycle rules
      let readinessScore = undefined;
      if (publishing) {
        const checks = [
          video.status === VideoProductionStatus.READY_TO_UPLOAD || video.status === VideoProductionStatus.UPLOADED,
          thumbnail?.status === 'APPROVED',
          Boolean(pinnedComment?.isApproved),
          Boolean(script || video.status === VideoProductionStatus.READY_TO_UPLOAD || video.status === VideoProductionStatus.UPLOADED),
          Boolean(video.title && video.questionId),
        ];
        const passed = checks.filter(Boolean).length;
        readinessScore = `${Math.round((passed / checks.length) * 100)}%`;
      }

      const item: ProductionBoardItem = {
        videoId: video.id,
        questionId: question.id,
        title: video.title || (question?.questionText ? (question.questionText.length > 50 ? `${question.questionText.substring(0, 50)}...` : question.questionText) : `Video for Question ${video.questionId}`),
        questionText: question.questionText,
        category: question.categoryId,
        topic: question.topicId,
        subtopic: question.subtopicId,
        difficulty: question.difficulty as DifficultyLevel,
        videoStatus: video.status,
        assignee,
        priority: video.priority,
        dueDate: video.scheduledPublishDate,
        isOverdue,

        scriptId: script?.id,
        scriptVersion: script?.currentVersion,

        thumbnailId: thumbnail?.id,
        thumbnailVersion: thumbnail?.currentVersion,
        thumbnailStatus: thumbnail?.status,

        pinnedCommentId: pinnedComment?.id,
        pinnedCommentApproval: pinnedComment?.isApproved,

        publishingId: publishing?.id,
        youtubeStatus: publishing?.youtube?.status,
        instagramStatus: publishing?.instagram?.status,
        facebookStatus: publishing?.facebook?.status,

        completedPlatformsCount,
        totalPlatformsCount: 3,
        publishingReadiness: readinessScore,
        finalRenderWidth: video.finalRenderWidth,
        finalRenderHeight: video.finalRenderHeight,
        finalRenderFormat: video.finalRenderFormat,
        finalRenderAspectRatio: video.finalRenderAspectRatio,
        actualDurationSeconds: video.actualDurationSeconds,
        finalRenderPath: video.finalRenderPath,
        finalRenderValidationStatus: video.finalRenderValidationStatus,
        canonicalProductionReadiness: ProductionAssetValidationService.determineReadiness(video, readinessMap.get(video.id)),
      };

      boardItems.push(item);
    }

    return boardItems;
  }
}

export const productionBoardService = ProductionBoardService.getInstance();

