/**
 * BURRA PARIKSHA CMS - Phase 17 Real Video Production Workflow Service
 * 
 * Implements the real video production lifecycle:
 * Question -> Approved Script -> Raw Video -> Editing -> Edited Video -> Final Video
 * 
 * Strict invariants enforced:
 * 1. Content correlation: Canonical Content ID (BP-CNT-######), Question ID, Script ID preserved across all stages.
 * 2. Cross-content rejection: Entity or file mismatch is strictly rejected.
 * 3. Video technical ID separation: Video ID is separate from Content ID.
 * 4. Production states & strictly forward transitions: RAW -> EDITING -> EDITED -> FINAL.
 * 5. Drive storage: Binaries reside exclusively in Google Drive in BP-CNT-######/{Raw, Edited, Final}/.
 * 6. RBAC: Role-based permissions enforced via user session context.
 * 7. History & Audit: Versioning preserved; no media asset records destroyed.
 * 8. Zero auto-publish: Final stage approves video for distribution, does not auto-post.
 */

import { questionsRepository } from '../repositories/questions.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { mediaAssetsRepository } from '../repositories/media-assets.repository';
import { phase14DriveService } from './phase14-drive.service';
import { idService } from './id.service';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import {
  Video,
  MediaAsset,
  MediaStage,
  VideoProductionStatus,
  UserRole,
  PriorityLevel,
  VideoProductionWorkflowState,
  InitializeRawVideoInput,
  TransitionToEditingInput,
  UploadEditedVideoInput,
  ApproveFinalVideoInput,
  Phase17VideoWorkflowStateResult,
} from '../../types';
import { ValidationError } from '../google-sheets/errors';

export interface WorkflowActor {
  id: string;
  name: string;
  role?: string | UserRole;
  roles?: (string | UserRole)[];
}

export class Phase17VideoProductionService {
  private static instance: Phase17VideoProductionService | null = null;

  public static getInstance(): Phase17VideoProductionService {
    if (!Phase17VideoProductionService.instance) {
      Phase17VideoProductionService.instance = new Phase17VideoProductionService();
    }
    return Phase17VideoProductionService.instance;
  }

  /**
   * Helper to verify actor has one of the allowed roles.
   */
  private verifyRole(actor: WorkflowActor, allowedRoles: string[], actionDescription: string): void {
    const actorRole = actor.role ? String(actor.role).toUpperCase() : '';
    const actorRoles = (actor.roles || []).map((r) => String(r).toUpperCase());
    if (actorRole) actorRoles.push(actorRole);

    const isAllowed = actorRoles.some((r) => allowedRoles.includes(r) || r === UserRole.ADMIN);
    if (!isAllowed) {
      throw new ValidationError(
        `Role "${actor.role || 'UNKNOWN'}" is not authorized to ${actionDescription}. Required roles: [${allowedRoles.join(', ')}]`
      );
    }
  }

  /**
   * Resolves canonical Content ID from a question.
   */
  private resolveQuestionContentId(question: any): string {
    return question.contentId || question.contentMasterId || '';
  }

  /**
   * Maps Video record status to workflow lifecycle state.
   */
  public getWorkflowState(video: Video): VideoProductionWorkflowState {
    if (video.status === VideoProductionStatus.RECORDED) {
      return 'RAW';
    }
    if (video.status === VideoProductionStatus.EDITING) {
      return 'EDITING';
    }
    if (video.status === VideoProductionStatus.EDITED) {
      return 'EDITED';
    }
    if (video.status === VideoProductionStatus.FINAL_REVIEW || video.status === VideoProductionStatus.READY_TO_UPLOAD) {
      return 'FINAL';
    }
    // Fallback if freshly queued or in other intermediate state
    return 'RAW';
  }

  /**
   * Step 1: Initialize RAW Video from Approved Script
   * 
   * Prerequisites:
   * - Script must exist and status must be APPROVED.
   * - Source Question must exist and be APPROVED.
   * - Canonical Content ID must match across Question, Script, and input.
   * - Raw binary file must be uploaded to Drive via Phase14DriveService in RAW folder.
   * - Video record created/updated in RECORDED (RAW) state.
   */
  public async initializeRawVideo(
    input: InitializeRawVideoInput,
    actor: WorkflowActor
  ): Promise<Phase17VideoWorkflowStateResult> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.STUDIO_PRESENTER, UserRole.SPEAKER, UserRole.CREATOR],
      'initialize raw video'
    );

    const { scriptId, expectedContentId, rawBinaryBuffer, fileName, mimeType } = input;

    // 1. Fetch Script
    const script = await scriptsRepository.findById(scriptId);
    if (!script) {
      throw new ValidationError(`Script with ID "${scriptId}" does not exist.`);
    }

    // 2. Validate Script is APPROVED
    if (script.status !== 'APPROVED') {
      throw new ValidationError(
        `Cannot produce raw video: Script "${scriptId}" is in status "${script.status}". Must be APPROVED.`
      );
    }

    // 3. Fetch source Question
    const question = await questionsRepository.findById(script.questionId);
    if (!question) {
      throw new ValidationError(`Source question "${script.questionId}" for script "${scriptId}" does not exist.`);
    }

    // 4. Content ID Correlation & Invariants
    const canonicalContentId = script.contentId || this.resolveQuestionContentId(question);
    if (!canonicalContentId || !canonicalContentId.startsWith('BP-CNT-')) {
      throw new ValidationError(
        `Invalid canonical Content ID "${canonicalContentId}" on script "${scriptId}". Must follow BP-CNT-###### pattern.`
      );
    }

    const questionContentId = this.resolveQuestionContentId(question);
    if (questionContentId && questionContentId !== canonicalContentId) {
      throw new ValidationError(
        `Cross-content violation: Script Content ID "${canonicalContentId}" does not match Question Content ID "${questionContentId}".`
      );
    }

    if (expectedContentId && expectedContentId !== canonicalContentId) {
      throw new ValidationError(
        `Cross-content violation: Expected Content ID "${expectedContentId}" does not match Script Content ID "${canonicalContentId}".`
      );
    }

    // 5. Upload Raw binary into Google Drive via Phase14DriveService
    const mediaAsset = await phase14DriveService.uploadProductionAsset({
      contentId: canonicalContentId,
      mediaStage: 'RAW',
      fileName,
      mimeType,
      bodyStreamOrBuffer: rawBinaryBuffer,
    });

    // 6. Check if an active video record already exists for this question/script
    const existingVideos = await videosRepository.findByQuestionId(question.id);
    let video = existingVideos.find(
      (v) => v.status !== VideoProductionStatus.CANCELLED && v.status !== VideoProductionStatus.UPLOADED
    );

    const now = new Date().toISOString();
    if (!video) {
      const videoId = await idService.allocateVideoId();
      const newVideo: Video = {
        id: videoId,
        contentId: canonicalContentId,
        contentMasterId: canonicalContentId,
        questionId: question.id,
        title: `Short: ${question.questionText?.slice(0, 80) || script.hookText.slice(0, 80)}`,
        status: VideoProductionStatus.RECORDED,
        priority: PriorityLevel.NORMAL,
        driveFileId: mediaAsset.driveFileId,
        driveFolderId: mediaAsset.folderId,
        fileName: mediaAsset.fileName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        version: mediaAsset.version,
        rawFootagePath: `drive:${mediaAsset.driveFileId}`,
        assignedHost: actor.id,
        createdAt: now,
        updatedAt: now,
      };

      video = await videosRepository.appendRecord(newVideo);
    } else {
      // Cross-content check on existing video
      if (video.contentId && video.contentId !== canonicalContentId) {
        throw new ValidationError(
          `Cross-content violation: Existing video "${video.id}" Content ID "${video.contentId}" does not match "${canonicalContentId}".`
        );
      }

      // Update existing video to RECORDED (RAW) state
      const updated = await videosRepository.updateRecord(video.id, {
        contentId: canonicalContentId,
        status: VideoProductionStatus.RECORDED,
        driveFileId: mediaAsset.driveFileId,
        driveFolderId: mediaAsset.folderId,
        fileName: mediaAsset.fileName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        version: mediaAsset.version,
        rawFootagePath: `drive:${mediaAsset.driveFileId}`,
        updatedAt: now,
      });
      if (updated) video = updated;
    }

    // Update Script videoId if not linked
    if (!script.videoId || script.videoId !== video.id) {
      await scriptsRepository.updateRecord(script.id, {
        videoId: video.id,
        updatedAt: now,
      });
    }

    // 7. Audit log & workflow transition
    await auditService.log(actor.id, actor.name, 'INITIALIZE_RAW_VIDEO', 'VIDEO', video.id, {
      contentId: canonicalContentId,
      scriptId: script.id,
      questionId: question.id,
      mediaAssetId: mediaAsset.id,
      driveFileId: mediaAsset.driveFileId,
      version: mediaAsset.version,
    });

    await workflowService.recordTransition(
      'VIDEO',
      video.id,
      VideoProductionStatus.SCRIPT_READY,
      VideoProductionStatus.RECORDED,
      actor.id,
      `Raw video binary uploaded and registered for script ${script.id}`
    );

    return {
      video,
      currentWorkflowState: 'RAW',
      latestMediaAsset: mediaAsset,
      scriptId: script.id,
      questionId: question.id,
      contentId: canonicalContentId,
    };
  }

  /**
   * Step 2: Transition from RAW to EDITING
   * 
   * Validates:
   * - Video must exist and be in RAW (RECORDED) state.
   * - Backward or invalid transitions rejected.
   * - Assigned editor can be assigned.
   */
  public async transitionToEditing(
    input: TransitionToEditingInput,
    actor: WorkflowActor
  ): Promise<Phase17VideoWorkflowStateResult> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR, UserRole.EDITOR],
      'transition video to editing'
    );

    const { videoId, expectedContentId, assignedEditorId } = input;

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ValidationError(`Video with ID "${videoId}" does not exist.`);
    }

    // Cross-content check
    if (expectedContentId && video.contentId && video.contentId !== expectedContentId) {
      throw new ValidationError(
        `Cross-content violation: Expected Content ID "${expectedContentId}" does not match Video Content ID "${video.contentId}".`
      );
    }

    // State machine check: only RAW -> EDITING is permitted here
    const currentState = this.getWorkflowState(video);
    if (currentState !== 'RAW') {
      throw new ValidationError(
        `Illegal transition to EDITING: Video "${videoId}" is currently in state "${currentState}". Only videos in state "RAW" can transition to "EDITING".`
      );
    }

    const now = new Date().toISOString();
    const updateData: Partial<Video> = {
      status: VideoProductionStatus.EDITING,
      updatedAt: now,
    };
    if (assignedEditorId) {
      updateData.assignedEditor = assignedEditorId;
    }

    const updatedVideo = await videosRepository.updateRecord(videoId, updateData);
    if (!updatedVideo) {
      throw new ValidationError(`Failed to update video "${videoId}" status to EDITING.`);
    }

    await auditService.log(actor.id, actor.name, 'TRANSITION_VIDEO_TO_EDITING', 'VIDEO', videoId, {
      previousStatus: video.status,
      newStatus: VideoProductionStatus.EDITING,
      assignedEditor: assignedEditorId,
    });

    await workflowService.recordTransition(
      'VIDEO',
      videoId,
      video.status,
      VideoProductionStatus.EDITING,
      actor.id,
      `Video entered EDITING stage`
    );

    const latestMedia = await phase14DriveService.getLatestAsset(updatedVideo.contentId || '', 'RAW');

    return {
      video: updatedVideo,
      currentWorkflowState: 'EDITING',
      latestMediaAsset: latestMedia || undefined,
      scriptId: '',
      questionId: updatedVideo.questionId,
      contentId: updatedVideo.contentId || '',
    };
  }

  /**
   * Step 3: Upload Edited Video (Transition to EDITED)
   * 
   * Validates:
   * - Video must exist and be in EDITING state.
   * - File is uploaded to Drive under EDITED folder.
   * - Status transitions to EDITED.
   */
  public async uploadEditedVideo(
    input: UploadEditedVideoInput,
    actor: WorkflowActor
  ): Promise<Phase17VideoWorkflowStateResult> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR, UserRole.EDITOR],
      'upload edited video'
    );

    const { videoId, expectedContentId, editedBinaryBuffer, fileName, mimeType, advanceStatus } = input;
    const shouldAdvance = advanceStatus !== false;

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ValidationError(`Video with ID "${videoId}" does not exist.`);
    }

    const canonicalContentId = video.contentId;
    if (!canonicalContentId || !canonicalContentId.startsWith('BP-CNT-')) {
      throw new ValidationError(`Invalid or missing Content ID on video "${videoId}".`);
    }

    if (expectedContentId && canonicalContentId !== expectedContentId) {
      throw new ValidationError(
        `Cross-content violation: Expected Content ID "${expectedContentId}" does not match Video Content ID "${canonicalContentId}".`
      );
    }

    // State machine check: Video must be in EDITING (or EDITED for new revision)
    const currentState = this.getWorkflowState(video);
    if (currentState !== 'EDITING' && currentState !== 'EDITED') {
      throw new ValidationError(
        `Illegal transition to EDITED: Video "${videoId}" is currently in state "${currentState}". Video must be in "EDITING" stage to upload edited video.`
      );
    }

    // Upload to EDITED folder in Google Drive via Phase14DriveService
    const mediaAsset = await phase14DriveService.uploadProductionAsset({
      contentId: canonicalContentId,
      mediaStage: 'EDITED',
      fileName,
      mimeType,
      bodyStreamOrBuffer: editedBinaryBuffer,
    });

    const now = new Date().toISOString();
    const updatedVideo = await videosRepository.updateRecord(videoId, {
      status: shouldAdvance ? VideoProductionStatus.EDITED : video.status,
      driveFileId: mediaAsset.driveFileId,
      driveFolderId: mediaAsset.folderId,
      fileName: mediaAsset.fileName,
      mimeType: mediaAsset.mimeType,
      fileSize: mediaAsset.fileSize,
      version: mediaAsset.version,
      updatedAt: now,
    });

    if (!updatedVideo) {
      throw new ValidationError(`Failed to update video "${videoId}" record.`);
    }

    await auditService.log(actor.id, actor.name, 'UPLOAD_EDITED_VIDEO', 'VIDEO', videoId, {
      contentId: canonicalContentId,
      mediaAssetId: mediaAsset.id,
      driveFileId: mediaAsset.driveFileId,
      version: mediaAsset.version,
    });

    if (shouldAdvance && video.status !== VideoProductionStatus.EDITED) {
      await workflowService.recordTransition(
        'VIDEO',
        videoId,
        video.status,
        VideoProductionStatus.EDITED,
        actor.id,
        `Edited video binary uploaded (V${mediaAsset.version})`
      );
    }

    return {
      video: updatedVideo,
      currentWorkflowState: shouldAdvance ? 'EDITED' : this.getWorkflowState(updatedVideo),
      latestMediaAsset: mediaAsset,
      scriptId: '',
      questionId: updatedVideo.questionId,
      contentId: canonicalContentId,
    };
  }

  /**
   * Step 4: Approve FINAL Video
   * 
   * Validates:
   * - Video must exist and be in EDITED (or FINAL_REVIEW) state.
   * - Actor must have approval authority (ADMIN, CONTENT_MANAGER, REVIEWER).
   * - Final binary payload is stored in Drive under Final/ folder (or promoted from edited).
   * - Strictly requires video/mp4 MIME type for FINAL stage (enforced by Phase14DriveService).
   * - Status transitions to READY_TO_UPLOAD (FINAL approved state).
   * - Does NOT automatically publish to social platforms.
   */
  public async approveFinalVideo(
    input: ApproveFinalVideoInput,
    actor: WorkflowActor
  ): Promise<Phase17VideoWorkflowStateResult> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER],
      'approve final video'
    );

    const { videoId, expectedContentId, finalBinaryBuffer, fileName, mimeType } = input;

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ValidationError(`Video with ID "${videoId}" does not exist.`);
    }

    const canonicalContentId = video.contentId;
    if (!canonicalContentId || !canonicalContentId.startsWith('BP-CNT-')) {
      throw new ValidationError(`Invalid or missing Content ID on video "${videoId}".`);
    }

    if (expectedContentId && canonicalContentId !== expectedContentId) {
      throw new ValidationError(
        `Cross-content violation: Expected Content ID "${expectedContentId}" does not match Video Content ID "${canonicalContentId}".`
      );
    }

    // State machine check: Video must be in EDITED state before moving to FINAL
    const currentState = this.getWorkflowState(video);
    if (currentState !== 'EDITED' && currentState !== 'FINAL') {
      throw new ValidationError(
        `Illegal transition to FINAL: Video "${videoId}" is currently in state "${currentState}". Video must be in "EDITED" state to approve final video.`
      );
    }

    let finalMediaAsset: MediaAsset;

    if (finalBinaryBuffer) {
      // Upload dedicated final render binary to FINAL folder
      finalMediaAsset = await phase14DriveService.uploadProductionAsset({
        contentId: canonicalContentId,
        mediaStage: 'FINAL',
        fileName: fileName || `final_short_${Date.now()}.mp4`,
        mimeType: mimeType || 'video/mp4',
        bodyStreamOrBuffer: finalBinaryBuffer,
      });
    } else {
      // Promote latest EDITED asset to FINAL if no distinct binary supplied
      const latestEdited = await phase14DriveService.getLatestAsset(canonicalContentId, 'EDITED');
      if (!latestEdited) {
        throw new ValidationError(
          `Cannot approve final video: No edited media asset found for Content ID "${canonicalContentId}".`
        );
      }
      // Re-upload or duplicate buffer to Final folder in Drive
      const downloaded = await phase14DriveService.getAssetMetadata(latestEdited.id);
      if (!downloaded) {
        throw new ValidationError(`Could not load edited asset metadata for "${latestEdited.id}".`);
      }
      const fileStreamOrBuffer = await (await import('./google-drive.service')).googleDriveService.downloadFile(downloaded.driveFileId);
      
      const chunks: Buffer[] = [];
      for await (const chunk of fileStreamOrBuffer.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      finalMediaAsset = await phase14DriveService.uploadProductionAsset({
        contentId: canonicalContentId,
        mediaStage: 'FINAL',
        fileName: fileName || downloaded.fileName || `final_render.mp4`,
        mimeType: 'video/mp4',
        bodyStreamOrBuffer: buffer,
      });
    }

    const now = new Date().toISOString();
    const updatedVideo = await videosRepository.updateRecord(videoId, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      driveFileId: finalMediaAsset.driveFileId,
      driveFolderId: finalMediaAsset.folderId,
      fileName: finalMediaAsset.fileName,
      mimeType: finalMediaAsset.mimeType,
      fileSize: finalMediaAsset.fileSize,
      version: finalMediaAsset.version,
      finalRenderPath: `drive:${finalMediaAsset.driveFileId}`,
      updatedAt: now,
    });

    if (!updatedVideo) {
      throw new ValidationError(`Failed to update video "${videoId}" to final status.`);
    }

    // Update question's videoStatus
    await questionsRepository.updateRecord(video.questionId, {
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      updatedAt: now,
    });

    await auditService.log(actor.id, actor.name, 'APPROVE_FINAL_VIDEO', 'VIDEO', videoId, {
      contentId: canonicalContentId,
      mediaAssetId: finalMediaAsset.id,
      driveFileId: finalMediaAsset.driveFileId,
      version: finalMediaAsset.version,
      autoPublish: false,
    });

    await workflowService.recordTransition(
      'VIDEO',
      videoId,
      video.status,
      VideoProductionStatus.READY_TO_UPLOAD,
      actor.id,
      `Final video approved and ready for publication (V${finalMediaAsset.version})`
    );

    return {
      video: updatedVideo,
      currentWorkflowState: 'FINAL',
      latestMediaAsset: finalMediaAsset,
      scriptId: '',
      questionId: updatedVideo.questionId,
      contentId: canonicalContentId,
    };
  }

  /**
   * Retrieves complete production history & assets across all stages for a video.
   */
  public async getVideoProductionHistory(videoId: string): Promise<{
    video: Video;
    currentState: VideoProductionWorkflowState;
    rawAssets: MediaAsset[];
    editedAssets: MediaAsset[];
    finalAssets: MediaAsset[];
  }> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ValidationError(`Video with ID "${videoId}" does not exist.`);
    }

    const contentId = video.contentId || '';
    const [rawAssets, editedAssets, finalAssets] = await Promise.all([
      mediaAssetsRepository.findByContentIdAndStage(contentId, 'RAW'),
      mediaAssetsRepository.findByContentIdAndStage(contentId, 'EDITED'),
      mediaAssetsRepository.findByContentIdAndStage(contentId, 'FINAL'),
    ]);

    // Sort versions descending
    rawAssets.sort((a, b) => b.version - a.version);
    editedAssets.sort((a, b) => b.version - a.version);
    finalAssets.sort((a, b) => b.version - a.version);

    return {
      video,
      currentState: this.getWorkflowState(video),
      rawAssets,
      editedAssets,
      finalAssets,
    };
  }
}

export const phase17VideoProductionService = Phase17VideoProductionService.getInstance();
