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
  contentMastersRepository,
  assignmentsRepository,
  workflowRepository,
  auditLogRepository,
  publishingRepository,
} from '../repositories';
import { idService } from './id.service';
import { workflowService } from './workflow.service';
import { auditService } from './audit.service';
import { contentMasterService } from './content-master.service';
import {
  Assignment,
  AssignmentEntityType,
  PriorityLevel,
  ProductionStats,
  Publishing,
  Question,
  QuestionStatus,
  Video,
  VideoProductionStatus,
  Workflow,
  AuditLog,
  UserRole,
  RenderValidationStatus,
  ContentMasterStatus,
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
      const allowed = [
        UserRole.ADMIN,
        UserRole.CONTENT_MANAGER,
        UserRole.VIDEO_EDITOR,
        UserRole.PUBLISHING_MANAGER,
        UserRole.REVIEWER,
      ];
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
    } else {
      const cm = await contentMastersRepository.findById(contentMasterId);
      if (!cm) {
        throw new ReferenceIntegrityError(
          `Content Master with ID "${contentMasterId}" referenced by Question "${question.id}" was not found in CONTENT_MASTERS sheet.`
        );
      }
      if (cm.status === ContentMasterStatus.ARCHIVED || cm.status === ContentMasterStatus.COMPLETED) {
        throw new ValidationError(
          `Cannot queue video for production: Parent Content Master "${contentMasterId}" is in status "${cm.status}".`
        );
      }
    }

    const videoTitle = input.title || `Short: ${question.questionText.slice(0, 80)}${question.questionText.length > 80 ? '...' : ''}`;

    const newVideo: Video = {
      id: videoId,
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
   * Phase 16.7: Alias for queueApprovedQuestion conforming to workflow naming.
   */
  public async queueVideoForProduction(
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
    return this.queueApprovedQuestion(input, actor);
  }

  /**
   * Transitions a video to a new production status following state machine rules.
   */
  public async transitionStatus(
    videoId: string,
    newStatus: VideoProductionStatus,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string,
    actualDurationSeconds?: number
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

    // Enforce state machine rules
    this.validateTransition(video.status, newStatus);

    // Reviewer role transition boundary
    if (actor.role && String(actor.role).toUpperCase() === UserRole.REVIEWER) {
      const allowedReviewTransitions = [
        VideoProductionStatus.FINAL_REVIEW,
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.EDITING,
      ];
      if (!allowedReviewTransitions.includes(newStatus)) {
        throw new ValidationError(
          `Unauthorized: Role "REVIEWER" is only permitted to transition video to FINAL_REVIEW, READY_TO_UPLOAD, or EDITING.`
        );
      }
    }

    // Phase 18: Content Master Downstream Terminal-State Guardrail
    let cmId = video.contentMasterId;
    if (!cmId && video.questionId) {
      const q = await questionsRepository.findById(video.questionId);
      cmId = q?.contentMasterId;
    }
    if (cmId) {
      const cm = await contentMastersRepository.findById(cmId);
      if (cm && cm.status === ContentMasterStatus.ARCHIVED) {
        if (newStatus !== VideoProductionStatus.CANCELLED && newStatus !== VideoProductionStatus.ON_HOLD) {
          throw new ValidationError(
            `Cannot transition video "${videoId}" to "${newStatus}": Parent Content Master "${cmId}" is in terminal status "ARCHIVED". Only CANCELLED and ON_HOLD transitions are permitted for retirement.`
          );
        }
      }
    }

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

    const now = new Date().toISOString();
    const assignmentId = `ASG-${Date.now().toString(36).toUpperCase()}`;

    const newAssignment: Assignment = {
      id: assignmentId,
      entityType: AssignmentEntityType.VIDEO,
      entityId: videoId,
      videoId,
      assigneeId: assignment.assigneeId,
      assigneeName: assignment.assigneeName,
      taskType: assignment.taskType,
      status: 'PENDING',
      priority: video.priority || PriorityLevel.NORMAL,
      dueDate: assignment.dueDate,
      notes: assignment.notes,
      createdAt: now,
    };

    const createdAssignment = await assignmentsRepository.appendRecord(newAssignment);

    // Update video helper fields
    const videoUpdates: Partial<Video> = { updatedAt: now };
    if (assignment.taskType === 'RECORDING') {
      videoUpdates.assignedHost = assignment.assigneeName;
    } else if (assignment.taskType === 'EDITING') {
      videoUpdates.assignedEditor = assignment.assigneeName;
    }
    await videosRepository.updateRecord(videoId, videoUpdates);

    await auditService.log(actor.id, actor.name, 'VIDEO_ASSIGNMENT_CHANGED', 'VIDEO', videoId, {
      assigneeId: assignment.assigneeId,
      assigneeName: assignment.assigneeName,
      taskType: assignment.taskType,
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

    if (actor.role && String(actor.role).toUpperCase() === UserRole.REVIEWER) {
      throw new Error(`Unauthorized: Role "REVIEWER" is not allowed to modify video metadata.`);
    }

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
   * Retrieves single video by ID enriched with question, workflow history, assignments, and audit logs.
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

    return {
      ...video,
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
}

export const videoService = VideoService.getInstance();
