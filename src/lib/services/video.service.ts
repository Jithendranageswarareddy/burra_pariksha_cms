/**
 * BURRA PARIKSHA CMS - Video Production & Queue Management Service
 * Phase 5: Video Queue & Production Tracking
 * 
 * Provides complete video lifecycle management, strict state machine transitions,
 * Google Sheets persistence (VIDEOS, QUESTION_VIDEOS, ASSIGNMENTS, WORKFLOW, AUDIT_LOG),
 * permanent SEQUENCES ID allocation, priority queuing, and UI enrichment.
 */

import {
  videosRepository,
  questionVideosRepository,
  questionsRepository,
  assignmentsRepository,
  workflowRepository,
  auditLogRepository,
  publishingRepository,
  usersRepository,
} from '../repositories';
import { mediaAssetsRepository } from '../repositories/media-assets.repository';
import { idService } from './id.service';
import { workflowService } from './workflow.service';
import { auditService } from './audit.service';
import { assignmentService } from './assignment.service';
import { contentMasterService } from './content-master.service';
import { googleDriveService } from './google-drive.service';
import { objectAuthService, ActorContext } from './object-auth.service';
import { validateMediaUpload } from '../../config/media-upload.config';
import { Readable } from 'stream';
import {
  Assignment,
  AssignmentEntityType,
  PriorityLevel,
  ProductionStats,
  Publishing,
  Question,
  QuestionStatus,
  Video,
  MediaAsset,
  VideoProductionStatus,
  Workflow,
  AuditLog,
  UserRole,
  RenderValidationStatus,
} from '../../types';
import { ProductionAssetValidationService } from './production-asset-validation.service';
import {
  AssignVideoInput,
  QueueVideoInput,
  UpdateVideoMetadataInput,
  UpdateVideoMetadataInputSchema,
  VideoFilterInput,
} from '../schemas/google-sheets-schema';
import { ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';

/**
 * Strict legal state machine transitions for Burra Pariksha video production.
 */
export const VALID_VIDEO_TRANSITIONS: Record<VideoProductionStatus, VideoProductionStatus[]> = {
  [VideoProductionStatus.NOT_STARTED]: [VideoProductionStatus.QUEUED],
  [VideoProductionStatus.QUEUED]: [
    VideoProductionStatus.SCRIPT_REQUIRED,
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.SCRIPT_REQUIRED]: [
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.SCRIPT_READY]: [
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.RECORDING]: [
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.RECORDED]: [
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.EDITING]: [
    VideoProductionStatus.EDITED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.EDITED]: [
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.FINAL_REVIEW]: [
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.READY_TO_UPLOAD]: [
    VideoProductionStatus.UPLOADED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.ON_HOLD]: [
    VideoProductionStatus.QUEUED,
    VideoProductionStatus.SCRIPT_REQUIRED,
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.EDITED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.CANCELLED]: [], // Terminal state
  [VideoProductionStatus.UPLOADED]: [], // Terminal state
};

export class VideoService {
  private static instance: VideoService | null = null;

  private constructor() {}

  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  private verifyVideoRole(actor: { role?: string | UserRole }): void {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR, UserRole.PUBLISHING_MANAGER];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to modify videos.`);
      }
    }
  }

  /**
   * Validates if a proposed status transition is legally permitted by the state machine.
   */
  public validateTransition(fromStatus: VideoProductionStatus, toStatus: VideoProductionStatus): void {
    if (fromStatus === toStatus) return;

    if (fromStatus === VideoProductionStatus.CANCELLED) {
      throw new ValidationError(`Cannot transition from CANCELLED: CANCELLED is a terminal video state.`);
    }

    if (fromStatus === VideoProductionStatus.UPLOADED) {
      throw new ValidationError(`Cannot transition from UPLOADED: UPLOADED is a terminal video state.`);
    }

    const allowed = VALID_VIDEO_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new ValidationError(
        `Illegal status transition from "${fromStatus}" to "${toStatus}". Allowed next transitions: [${allowed.join(', ')}]`
      );
    }
  }

  /**
   * Enters an APPROVED question into the video production queue.
   * Performs all 9 required Phase 5 validation & persistence operations.
   */
  public async queueApprovedQuestion(
    input: {
      questionId: string;
      title?: string;
      priority?: PriorityLevel;
      assignedHost?: string;
      assignedEditor?: string;
      notes?: string;
      targetDurationSeconds?: number;
    },
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Video> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      if (r !== UserRole.ADMIN && r !== UserRole.CONTENT_MANAGER) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to queue questions.`);
      }
    }

    const { questionId, priority = PriorityLevel.NORMAL, assignedHost, assignedEditor, notes, targetDurationSeconds = 45 } = input;

    // 1. Question exists
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Question with ID "${questionId}" does not exist in the QUESTIONS worksheet.`, {
        entityType: 'QUESTION',
        entityId: questionId,
      });
    }

    // 1B. Validate Content ID correlation if explicitly provided
    if ((input as any).contentId && question.contentId && (input as any).contentId !== question.contentId) {
      throw new ValidationError(
        `Cross-content entity attachment rejected: provided Content ID "${(input as any).contentId}" does not match parent question Content ID "${question.contentId}".`
      );
    }

    // 2. Question status is APPROVED
    if (question.status !== QuestionStatus.APPROVED) {
      throw new ValidationError(
        `Cannot queue question "${questionId}": Only APPROVED questions can enter the video queue. Current question status is "${question.status}".`
      );
    }

    // 3. Question is not already actively queued or in production
    const isAlreadyQueued =
      question.videoStatus === VideoProductionStatus.QUEUED ||
      [
        VideoProductionStatus.SCRIPT_REQUIRED,
        VideoProductionStatus.SCRIPT_READY,
        VideoProductionStatus.RECORDING,
        VideoProductionStatus.RECORDED,
        VideoProductionStatus.EDITING,
        VideoProductionStatus.EDITED,
        VideoProductionStatus.FINAL_REVIEW,
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.UPLOADED,
      ].includes(question.videoStatus);

    // 4. No duplicate active video record exists for that question
    const existingVideos = await videosRepository.findByQuestionId(questionId);
    const activeVideo = existingVideos.find(
      (v) => v.status !== VideoProductionStatus.CANCELLED && v.status !== VideoProductionStatus.UPLOADED
    );

    if (isAlreadyQueued && activeVideo) {
      throw new ValidationError(
        `Question "${questionId}" is already active in video production with Video ID "${activeVideo.id}" (Status: ${activeVideo.status}).`
      );
    }

    if (activeVideo) {
      throw new ValidationError(
        `An active video "${activeVideo.id}" already exists for question "${questionId}". Cancel the existing video before queueing a new one.`
      );
    }

    // 5. Allocate permanent Video ID using SEQUENCES (BP-V-000001)
    const videoId = await idService.allocateVideoId();

    const now = new Date().toISOString();
    // Ensure Content Master ID exists on Question
    let contentMasterId = question.contentMasterId;
    if (!contentMasterId) {
      const master = await contentMasterService.createContentMaster(
        {
          title: question.questionText ? question.questionText.slice(0, 100) : `Content Master for ${question.id}`,
          primaryQuestionId: question.id,
          categoryId: question.categoryId,
          topicId: question.topicId,
          subtopicId: question.subtopicId,
          createdBy: actor.id,
        },
        actor.id,
        actor.name
      );
      contentMasterId = master.id;
      question.contentMasterId = master.id;
      await questionsRepository.updateRecord(question.id, { contentMasterId: master.id });
    }

    const videoTitle = input.title || `Short: ${question.questionText.slice(0, 80)}${question.questionText.length > 80 ? '...' : ''}`;

    const newVideo: Video = {
      id: videoId,
      contentId: question.contentId || contentMasterId,
      contentMasterId,
      questionId: question.id,
      title: videoTitle,
      status: VideoProductionStatus.QUEUED,
      priority,
      targetDurationSeconds,
      assignedHost,
      assignedEditor,
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
    };

    // 6. Create the required video record in VIDEOS sheet
    const createdVideo = await videosRepository.appendRecord(newVideo);

    // 7. Create QUESTION_VIDEOS join relationship
    try {
      const joinId = `QV-${videoId.replace(/^BP-V-/, '')}`;
      await questionVideosRepository.appendRecord({
        id: joinId,
        questionId: question.id,
        videoId: createdVideo.id,
        createdAt: now,
      });
    } catch (joinErr) {
      console.warn('Note on question_videos append:', joinErr);
    }

    // 8. Update question's video_status to QUEUED
    await questionsRepository.updateRecord(question.id, {
      videoStatus: VideoProductionStatus.QUEUED,
      updatedAt: now,
    });

    // 9. Record WORKFLOW & AUDIT_LOG
    await workflowService.recordTransition(
      'VIDEO',
      createdVideo.id,
      VideoProductionStatus.NOT_STARTED,
      VideoProductionStatus.QUEUED,
      actor.name,
      notes || `Queued approved question "${question.id}" for YouTube Shorts production`
    );

    await auditService.log(
      actor.id,
      actor.name,
      'VIDEO_QUEUED',
      'VIDEO',
      createdVideo.id,
      {
        questionId: question.id,
        priority,
        assignedHost,
        assignedEditor,
      }
    );

    return {
      ...createdVideo,
      question,
    };
  }

  /**
   * Transitions a video to a new production status following state machine rules.
   */
  public async transitionStatus(
    videoId: string,
    newStatus: VideoProductionStatus,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string,
    actualDurationSeconds?: number,
    bypassRawCheck: boolean = true
  ): Promise<Video> {
    this.verifyVideoRole(actor);

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found in the VIDEOS sheet.`, {
        entityType: 'VIDEO',
        entityId: videoId,
      });
    }

    if (video.status === newStatus) {
      return video;
    }

    if (newStatus === VideoProductionStatus.RECORDED && !video.driveFileId && !bypassRawCheck) {
      throw new ValidationError('Raw video file must be uploaded to Google Drive before marking as Recorded.');
    }

    if (
      (newStatus === VideoProductionStatus.EDITED || newStatus === VideoProductionStatus.FINAL_REVIEW) &&
      video.status === VideoProductionStatus.EDITING &&
      !bypassRawCheck
    ) {
      const editedAssets = await mediaAssetsRepository.findByContentIdAndStage(video.contentId || '', 'EDITED');
      if (editedAssets.length === 0) {
        throw new ValidationError('An edited video file must be uploaded before completing editing or sending to Final Review.');
      }
    }

    // Enforce state machine rules
    this.validateTransition(video.status, newStatus);

    const prevStatus = video.status;
    const now = new Date().toISOString();

    const updatePayload: Partial<Video> = {
      status: newStatus,
      updatedAt: now,
    };

    if (actualDurationSeconds !== undefined && actualDurationSeconds > 0) {
      updatePayload.actualDurationSeconds = actualDurationSeconds;
    }

    const updatedVideo = await videosRepository.updateRecord(videoId, updatePayload);
    if (!updatedVideo) {
      throw new Error(`Failed to update video record for "${videoId}".`);
    }

    // Synchronize associated question's videoStatus
    try {
      const question = await questionsRepository.findById(updatedVideo.questionId);
      if (question) {
        let questionVideoStatus = newStatus;
        if (newStatus === VideoProductionStatus.CANCELLED) {
          // If video was cancelled, reset question videoStatus to NOT_STARTED so it can be re-queued if desired
          questionVideoStatus = VideoProductionStatus.CANCELLED;
        }

        await questionsRepository.updateRecord(question.id, {
          videoStatus: questionVideoStatus,
          updatedAt: now,
        });
      }
    } catch (syncErr) {
      console.warn(`Failed to synchronize question status for video "${videoId}":`, syncErr);
    }

    // Record in WORKFLOW
    await workflowService.recordTransition(
      'VIDEO',
      videoId,
      prevStatus,
      newStatus,
      actor.name,
      remarks || `Transitioned video production status from ${prevStatus} to ${newStatus}`
    );

    // Record in AUDIT_LOG
    let auditAction = 'UPDATE_VIDEO_STATUS';
    if (newStatus === VideoProductionStatus.UPLOADED) {
      auditAction = 'VIDEO_MARKED_UPLOADED';
    } else if (newStatus === VideoProductionStatus.CANCELLED) {
      auditAction = 'VIDEO_CANCELLED';
    } else if (newStatus === VideoProductionStatus.ON_HOLD) {
      auditAction = 'VIDEO_PLACED_ON_HOLD';
    }

    await auditService.log(
      actor.id,
      actor.name,
      auditAction,
      'VIDEO',
      videoId,
      {
        from: prevStatus,
        to: newStatus,
        remarks,
        actualDurationSeconds,
      }
    );

    return updatedVideo;
  }

  /**
   * Updates video priority level.
   */
  public async updatePriority(
    videoId: string,
    priority: PriorityLevel,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<Video> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      if (r !== UserRole.ADMIN && r !== UserRole.CONTENT_MANAGER) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to modify video priority.`);
      }
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`, {
        entityType: 'VIDEO',
        entityId: videoId,
      });
    }

    const prevPriority = video.priority;
    const now = new Date().toISOString();

    const updated = await videosRepository.updateRecord(videoId, {
      priority,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to update priority for video "${videoId}".`);
    }

    await auditService.log(actor.id, actor.name, 'VIDEO_PRIORITY_CHANGED', 'VIDEO', videoId, {
      from: prevPriority,
      to: priority,
      remarks,
    });

    return updated;
  }

  /**
   * Assigns a production team member/task to a video.
   */
  public async assignVideo(
    videoId: string,
    assignment: AssignVideoInput,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Assignment> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      if (r !== UserRole.ADMIN && r !== UserRole.CONTENT_MANAGER) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to assign videos.`);
      }
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`, {
        entityType: 'VIDEO',
        entityId: videoId,
      });
    }

    let resolvedAssigneeId = assignment.assigneeId;
    const directUser = await usersRepository.findById(resolvedAssigneeId);
    if (!directUser && assignment.assigneeName) {
      const allUsers = await usersRepository.findAll();
      const matched = allUsers.find(
        (u) => u.isActive && (u.name.toLowerCase() === assignment.assigneeName.toLowerCase() || u.id === assignment.assigneeId)
      );
      if (matched) {
        resolvedAssigneeId = matched.id;
      }
    }

    const createdAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: videoId,
        assigneeId: resolvedAssigneeId,
        taskType: assignment.taskType || 'RECORDING',
        priority: video.priority || PriorityLevel.NORMAL,
        dueDate: assignment.dueDate,
        notes: assignment.notes,
      },
      actor
    );

    const now = new Date().toISOString();
    // Update video helper fields
    const videoUpdates: Partial<Video> = { updatedAt: now };
    if (assignment.taskType === 'RECORDING') {
      videoUpdates.assignedHost = assignment.assigneeName || createdAssignment.assigneeName;
    } else if (assignment.taskType === 'EDITING') {
      videoUpdates.assignedEditor = assignment.assigneeName || createdAssignment.assigneeName;
    }
    await videosRepository.updateRecord(videoId, videoUpdates);

    await auditService.log(actor.id, actor.name, 'VIDEO_ASSIGNMENT_CHANGED', 'VIDEO', videoId, {
      assignmentId: createdAssignment.id,
      assigneeId: createdAssignment.assigneeId,
      assigneeName: createdAssignment.assigneeName,
      taskType: assignment.taskType || 'RECORDING',
    });

    return createdAssignment;
  }

  /**
   * Updates metadata such as notes, target/actual duration, or production paths.
   */
  public async updateVideoMetadata(
    videoId: string,
    updates: UpdateVideoMetadataInput,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Video> {
    this.verifyVideoRole(actor);

    const parsedUpdates = UpdateVideoMetadataInputSchema.parse(updates);

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`, {
        entityType: 'VIDEO',
        entityId: videoId,
      });
    }

    // Exclude any client-provided validation status to ensure the server always recomputes it
    const sanitizedUpdates = { ...parsedUpdates };
    delete (sanitizedUpdates as any).finalRenderValidationStatus;

    // Combine existing video values with incoming updates for recomputed validation
    const validationInput = {
      finalRenderWidth: sanitizedUpdates.finalRenderWidth !== undefined ? sanitizedUpdates.finalRenderWidth : video.finalRenderWidth,
      finalRenderHeight: sanitizedUpdates.finalRenderHeight !== undefined ? sanitizedUpdates.finalRenderHeight : video.finalRenderHeight,
      finalRenderFormat: sanitizedUpdates.finalRenderFormat !== undefined ? sanitizedUpdates.finalRenderFormat : video.finalRenderFormat,
      finalRenderAspectRatio: sanitizedUpdates.finalRenderAspectRatio !== undefined ? sanitizedUpdates.finalRenderAspectRatio : video.finalRenderAspectRatio,
      actualDurationSeconds: sanitizedUpdates.actualDurationSeconds !== undefined ? sanitizedUpdates.actualDurationSeconds : video.actualDurationSeconds,
      targetDurationSeconds: sanitizedUpdates.targetDurationSeconds !== undefined ? sanitizedUpdates.targetDurationSeconds : video.targetDurationSeconds,
      finalRenderPath: sanitizedUpdates.finalRenderPath !== undefined ? sanitizedUpdates.finalRenderPath : video.finalRenderPath,
    };

    const validationResult = ProductionAssetValidationService.validateMetadata(validationInput);

    const now = new Date().toISOString();
    const updated = await videosRepository.updateRecord(videoId, {
      ...sanitizedUpdates,
      finalRenderValidationStatus: validationResult.status,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to update metadata for video "${videoId}".`);
    }

    await auditService.log(actor.id, actor.name, 'VIDEO_METADATA_UPDATED', 'VIDEO', videoId, {
      updates: parsedUpdates,
    });

    return updated;
  }

  /**
   * Retrieves all videos with optional filtering, search, and priority sorting.
   * Priority sort: URGENT > HIGH > NORMAL / MEDIUM > LOW, then oldest first.
   */
  public async getVideos(filter?: VideoFilterInput): Promise<Video[]> {
    let videos = await videosRepository.findAll();
    const questions = await questionsRepository.findAll();
    const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));

    // Attach questions for filtering and display
    videos = videos.map((v) => ({
      ...v,
      question: questionMap.get(v.questionId),
    }));

    if (filter) {
      if (filter.status) {
        videos = videos.filter((v) => v.status === filter.status);
      }
      if (filter.priority) {
        videos = videos.filter((v) => {
          if (filter.priority === PriorityLevel.NORMAL) {
            return v.priority === PriorityLevel.NORMAL || v.priority === PriorityLevel.MEDIUM;
          }
          if (filter.priority === PriorityLevel.MEDIUM) {
            return v.priority === PriorityLevel.MEDIUM || v.priority === PriorityLevel.NORMAL;
          }
          return v.priority === filter.priority;
        });
      }
      if (filter.categoryId) {
        videos = videos.filter((v) => v.question?.categoryId === filter.categoryId);
      }
      if (filter.topicId) {
        videos = videos.filter((v) => v.question?.topicId === filter.topicId);
      }
      if (filter.difficulty) {
        videos = videos.filter((v) => v.question?.difficulty === filter.difficulty);
      }
      if (filter.assignedHost) {
        videos = videos.filter(
          (v) => v.assignedHost?.toLowerCase().includes(filter.assignedHost!.toLowerCase())
        );
      }
      if (filter.assignedEditor) {
        videos = videos.filter(
          (v) => v.assignedEditor?.toLowerCase().includes(filter.assignedEditor!.toLowerCase())
        );
      }
      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        videos = videos.filter(
          (v) =>
            v.id.toLowerCase().includes(query) ||
            v.title.toLowerCase().includes(query) ||
            v.questionId.toLowerCase().includes(query) ||
            v.question?.questionText.toLowerCase().includes(query) ||
            v.question?.topicName?.toLowerCase().includes(query) ||
            v.question?.categoryName?.toLowerCase().includes(query)
        );
      }
    }

    // Sort by priority and created date
    const priorityWeight: Record<PriorityLevel, number> = {
      [PriorityLevel.URGENT]: 4,
      [PriorityLevel.HIGH]: 3,
      [PriorityLevel.NORMAL]: 2,
      [PriorityLevel.MEDIUM]: 2,
      [PriorityLevel.LOW]: 1,
    };

    return videos.sort((a, b) => {
      const weightA = priorityWeight[a.priority] || 2;
      const weightB = priorityWeight[b.priority] || 2;
      if (weightA !== weightB) {
        return weightB - weightA; // Higher priority first
      }
      // Older items first
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Retrieves single video by ID enriched with question, workflow history, assignments, audit logs, and rawAssets.
   */
  public async getVideoById(id: string): Promise<Video | null> {
    const video = await videosRepository.findById(id);
    if (!video) return null;

    const [question, assignments, workflowHistory, auditLogs] = await Promise.all([
      questionsRepository.findById(video.questionId).catch(() => undefined),
      assignmentsRepository.findByVideoId(video.id).catch(() => []),
      workflowRepository.findByEntity('VIDEO', video.id).catch(() => []),
      auditLogRepository.findByEntity('VIDEO', video.id).catch(() => []),
    ]);

    const contentId = video.contentId || video.contentMasterId || question?.contentId || question?.contentMasterId;
    let rawAssets: MediaAsset[] = [];
    if (contentId) {
      rawAssets = await mediaAssetsRepository.findByContentIdAndStage(contentId, 'RAW').catch(() => []);
      rawAssets.sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
    }

    return {
      ...video,
      contentId: video.contentId || contentId,
      rawAssets,
      question: question || undefined,
      assignments: assignments || [],
      workflowHistory: workflowHistory || [],
      auditLogs: auditLogs || [],
    };
  }

  /**
   * Computes aggregated real-time production statistics across all 18 Google Sheets tabs.
   */
  public async getProductionStats(): Promise<ProductionStats> {
    const videos = await videosRepository.findAll();

    const stats: ProductionStats = {
      total: videos.length,
      notStarted: 0,
      queued: 0,
      scriptRequired: 0,
      scriptReady: 0,
      recording: 0,
      recorded: 0,
      editing: 0,
      edited: 0,
      finalReview: 0,
      readyToUpload: 0,
      uploaded: 0,
      onHold: 0,
      cancelled: 0,
      byPriority: {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0,
      },
    };

    for (const v of videos) {
      switch (v.status) {
        case VideoProductionStatus.NOT_STARTED:
          stats.notStarted++;
          break;
        case VideoProductionStatus.QUEUED:
          stats.queued++;
          break;
        case VideoProductionStatus.SCRIPT_REQUIRED:
          stats.scriptRequired++;
          break;
        case VideoProductionStatus.SCRIPT_READY:
          stats.scriptReady++;
          break;
        case VideoProductionStatus.RECORDING:
          stats.recording++;
          break;
        case VideoProductionStatus.RECORDED:
          stats.recorded++;
          break;
        case VideoProductionStatus.EDITING:
          stats.editing++;
          break;
        case VideoProductionStatus.EDITED:
          stats.edited++;
          break;
        case VideoProductionStatus.FINAL_REVIEW:
          stats.finalReview++;
          break;
        case VideoProductionStatus.READY_TO_UPLOAD:
          stats.readyToUpload++;
          break;
        case VideoProductionStatus.UPLOADED:
          stats.uploaded++;
          break;
        case VideoProductionStatus.ON_HOLD:
          stats.onHold++;
          break;
        case VideoProductionStatus.CANCELLED:
          stats.cancelled++;
          break;
      }

      if (v.priority === PriorityLevel.URGENT) stats.byPriority.urgent++;
      else if (v.priority === PriorityLevel.HIGH) stats.byPriority.high++;
      else if (v.priority === PriorityLevel.LOW) stats.byPriority.low++;
      else stats.byPriority.normal++;
    }

    return stats;
  }

  /**
   * Phase 7: Real Google Drive binary upload & correlation with Content ID / Video metadata.
   */
  public async uploadVideoAsset(params: {
    contentId?: string;
    videoId?: string;
    fileName: string;
    mimeType: string;
    size: number;
    fileStreamOrBuffer: Readable | Buffer;
    actor: ActorContext;
  }): Promise<Video> {
    const { contentId: rawContentId, videoId, fileName, mimeType, size, fileStreamOrBuffer, actor } = params;

    if (!actor || !actor.id) {
      throw new ValidationError('Authentication required: Valid actor context is required for video asset upload.');
    }

    // 1. Validate file parameters against media allowlist
    const { sanitizedFileName } = validateMediaUpload({
      fileName,
      mimeType,
      size,
      category: 'video',
    });

    let existingVideo: Video | null = null;
    let targetContentId = rawContentId;

    if (videoId) {
      existingVideo = await videosRepository.findById(videoId);
      if (!existingVideo) {
        throw new ReferenceIntegrityError(`Video record with ID "${videoId}" was not found.`);
      }
      const canModify = await objectAuthService.canModifyVideo(actor, existingVideo);
      if (!canModify) {
        throw new ValidationError(`Forbidden: Actor "${actor.id}" is not authorized to upload assets for video "${videoId}".`);
      }
      targetContentId = targetContentId || existingVideo.contentId || existingVideo.contentMasterId;
    }

    if (!targetContentId && existingVideo?.questionId) {
      try {
        const q = await questionsRepository.findById(existingVideo.questionId);
        if (q) {
          targetContentId = q.contentId || q.contentMasterId;
        }
      } catch {
        // Fallback silently if question cannot be fetched
      }
    }

    if (!targetContentId) {
      throw new ValidationError('Canonical Content ID (e.g. BP-CNT-000001) or videoId with associated content is required for asset upload.');
    }

    // Ensure content master exists or validate content ID
    const contentDetails = await contentMasterService.getDetailsByContentMasterId(targetContentId);
    if (!contentDetails || !contentDetails.contentMaster) {
      throw new ReferenceIntegrityError(`Content Master with ID "${targetContentId}" does not exist.`);
    }

    // 2. Ensure deterministic Google Drive folder hierarchy
    const hierarchy = await googleDriveService.ensureContentHierarchy(targetContentId);

    // 3. Perform binary upload to Drive
    const driveFile = await googleDriveService.uploadFile({
      fileName: sanitizedFileName,
      mimeType,
      bodyStreamOrBuffer: fileStreamOrBuffer,
      folderId: hierarchy.videosFolderId,
      description: `Uploaded video asset for Content ID: ${targetContentId}`,
    });

    // 4. Compute incremented take/version number monotonically across both MEDIA_ASSETS and Video
    const rawAssetsBefore = await mediaAssetsRepository.findByContentIdAndStage(targetContentId, 'RAW');
    const maxMediaVersion = rawAssetsBefore.reduce((max, a) => Math.max(max, Number(a.version) || 0), 0);
    const currentVideoVer = Number(existingVideo?.version) || 0;
    const nextVersion = Math.max(maxMediaVersion, currentVideoVer) + 1;

    try {
      const now = new Date().toISOString();

      // 5. Idempotent check: if a MediaAsset with this driveFileId already exists for this content, reuse it
      let mediaAsset = rawAssetsBefore.find((a) => a.driveFileId === driveFile.fileId);
      if (!mediaAsset) {
        const assetId = `MEDIA-${targetContentId.replace('BP-CNT-', '')}-RAW-${nextVersion}`;
        mediaAsset = {
          id: assetId,
          contentId: targetContentId,
          driveFileId: driveFile.fileId,
          folderId: hierarchy.videosFolderId,
          fileName: sanitizedFileName,
          mimeType,
          fileSize: driveFile.size || size,
          createdAt: now,
          updatedAt: now,
          mediaStage: 'RAW',
          version: nextVersion,
        };
        await mediaAssetsRepository.create(mediaAsset);
      }

      // 6. Update or create video record metadata in Google Sheets (VIDEOS worksheet)
      let updatedVideo: Video;

      if (existingVideo) {
        const updatePayload: Partial<Video> = {
          contentId: targetContentId,
          contentMasterId: existingVideo.contentMasterId || targetContentId,
          driveFileId: driveFile.fileId, // Canonical pointer to active/latest take
          driveFolderId: hierarchy.videosFolderId,
          driveFolderUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.videosFolderId}`,
          fileName: sanitizedFileName,
          mimeType,
          fileSize: driveFile.size || size,
          version: mediaAsset.version || nextVersion,
          rawFootagePath: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.fileId}/view`,
          finalRenderFormat: mimeType.split('/')[1] || 'mp4',
          updatedAt: now,
        };
        // If in recording preparation states, advance to RECORDED
        if (
          existingVideo.status === VideoProductionStatus.SCRIPT_READY ||
          existingVideo.status === VideoProductionStatus.RECORDING
        ) {
          updatePayload.status = VideoProductionStatus.RECORDED;
        }
        updatedVideo = (await videosRepository.update(existingVideo.id, updatePayload)) as Video;
      } else {
        const primaryQuestionId = contentDetails.questions[0]?.id || `BP-Q-000000`;
        const newVideoId = await idService.generateId('VIDEO');
        const newVideoPayload: Video = {
          id: newVideoId,
          contentId: targetContentId,
          contentMasterId: targetContentId,
          questionId: primaryQuestionId,
          title: contentDetails.contentMaster.title || `Video for ${targetContentId}`,
          status: VideoProductionStatus.RECORDED,
          priority: PriorityLevel.NORMAL,
          driveFileId: driveFile.fileId,
          driveFolderId: hierarchy.videosFolderId,
          driveFolderUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.videosFolderId}`,
          fileName: sanitizedFileName,
          mimeType,
          fileSize: driveFile.size || size,
          version: mediaAsset.version || nextVersion,
          rawFootagePath: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.fileId}/view`,
          finalRenderFormat: mimeType.split('/')[1] || 'mp4',
          createdAt: now,
          updatedAt: now,
        };
        updatedVideo = await videosRepository.create(newVideoPayload);
      }

      // 7. Attach full rawAssets collection and newly created mediaAsset to response
      const allRawAssets = await mediaAssetsRepository.findByContentIdAndStage(targetContentId, 'RAW');
      allRawAssets.sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
      updatedVideo.rawAssets = allRawAssets;
      updatedVideo.mediaAsset = mediaAsset;

      // Audit log
      await auditService.log(
        actor.id,
        actor.name || actor.id,
        'VIDEO_ASSET_UPLOAD',
        'VIDEO',
        updatedVideo.id,
        {
          contentId: targetContentId,
          driveFileId: driveFile.fileId,
          mediaAssetId: mediaAsset.id,
          fileName: sanitizedFileName,
          mimeType,
          fileSize: size,
          version: mediaAsset.version || nextVersion,
          totalRawTakes: allRawAssets.length,
        }
      );

      return updatedVideo;
    } catch (err: any) {
      console.error('[VideoService] Failed to persist video metadata after Drive upload:', err?.message || err);
      throw new Error(`Failed to persist video metadata after Drive upload: ${err?.message || 'Unknown error'}`);
    }
  }
}

export const videoService = VideoService.getInstance();
