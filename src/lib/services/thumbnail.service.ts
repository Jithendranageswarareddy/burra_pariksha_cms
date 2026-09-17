/**
 * BURRA PARIKSHA CMS - Thumbnail & Thumbnail Version Management Service
 * Phase 6: Script, Thumbnail & Manual Publishing Management
 * 
 * Provides lifecycle and asset review management for video thumbnail graphics:
 * - Draft proposal generation
 * - Thumbnail metadata and preview/drive URL saves
 * - Immutable historical version tracking in THUMBNAIL_VERSIONS
 * - Status workflow (PENDING -> DESIGNED -> APPROVED / REJECTED)
 * - Automatic synchronization with PUBLISHING worksheet (thumbnail_ready flag)
 * - WORKFLOW and AUDIT_LOG integration
 */

import { thumbnailsRepository, thumbnailVersionsRepository } from '../repositories/thumbnails.repository';
import { videosRepository } from '../repositories/videos.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { publishingRepository } from '../repositories/publishing.repository';
import { idService } from './id.service';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { googleDriveService } from './google-drive.service';
import { Thumbnail, ThumbnailVersion, UserRole } from '../../types';
import { ValidationError } from '../google-sheets/errors';

export interface ThumbnailPayload {
  hookHeadline: string;
  driveAssetUrl?: string;
  previewUrl?: string;
  status?: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED';
}

export interface SaveThumbnailOptions extends ThumbnailPayload {
  createNewVersion?: boolean;
  designerNotes?: string;
}

export class ThumbnailService {
  private static instance: ThumbnailService | null = null;

  private constructor() {}

  public static getInstance(): ThumbnailService {
    if (!ThumbnailService.instance) {
      ThumbnailService.instance = new ThumbnailService();
    }
    return ThumbnailService.instance;
  }

  private verifyThumbnailRole(actor: { role?: string | UserRole }): void {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [
        UserRole.ADMIN,
        UserRole.CONTENT_MANAGER,
        UserRole.VIDEO_EDITOR,
        UserRole.THUMBNAIL_DESIGNER,
        UserRole.DESIGNER,
      ];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to modify thumbnails.`);
      }
    }
  }

  /**
   * Retrieves current thumbnail record for a video or provides default suggestion.
   */
  public async getThumbnailByVideoId(videoId: string): Promise<{ thumbnail: Thumbnail | null; draftProposal?: ThumbnailPayload }> {
    const existing = await thumbnailsRepository.findByVideoId(videoId);
    if (existing) {
      return { thumbnail: existing };
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      return { thumbnail: null };
    }

    const question = await questionsRepository.findById(video.questionId);
    const draftProposal: ThumbnailPayload = {
      hookHeadline: question?.realWorldContext || video.title || 'CRACK IN 15 SECONDS!',
      status: 'PENDING',
    };

    return { thumbnail: null, draftProposal };
  }

  /**
   * Retrieves all historical versions for a thumbnail.
   */
  public async getThumbnailVersions(thumbnailId: string): Promise<ThumbnailVersion[]> {
    return thumbnailVersionsRepository.findByThumbnailId(thumbnailId);
  }

  /**
   * Saves or updates a thumbnail record.
   */
  public async saveThumbnail(
    videoId: string,
    payload: SaveThumbnailOptions,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<{ thumbnail: Thumbnail; version?: ThumbnailVersion }> {
    this.verifyThumbnailRole(actor);

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video "${videoId}" not found.`);
    }

    const videoContentId = video.contentId || video.contentMasterId;
    if ((payload as any).contentId && videoContentId && (payload as any).contentId !== videoContentId) {
      throw new ValidationError(
        `Cross-content entity attachment rejected: provided Content ID "${(payload as any).contentId}" does not match parent video Content ID "${videoContentId}".`
      );
    }

    const existing = await thumbnailsRepository.findByVideoId(videoId);
    const now = new Date().toISOString();

    if (!existing) {
      // 1. Create Initial Thumbnail Record (Version 1)
      const thumbnailId = await idService.allocateThumbnailId();
      const newThumbnail: Thumbnail = {
        id: thumbnailId,
        contentId: video.contentId || video.contentMasterId,
        contentMasterId: video.contentMasterId,
        videoId,
        hookHeadline: payload.hookHeadline || video.title,
        driveAssetUrl: payload.driveAssetUrl || '',
        previewUrl: payload.previewUrl || '',
        status: payload.status || 'PENDING',
        currentVersion: 1,
        createdAt: now,
        updatedAt: now,
      };

      const savedThumbnail = await thumbnailsRepository.appendRecord(newThumbnail);

      // Create Version 1 in THUMBNAIL_VERSIONS
      const versionId = `${thumbnailId}-V1`;
      const initialVersion: ThumbnailVersion = {
        id: versionId,
        thumbnailId,
        versionNumber: 1,
        driveAssetUrl: payload.driveAssetUrl || payload.previewUrl || 'Asset created',
        designerNotes: payload.designerNotes || 'Initial thumbnail record created',
        createdAt: now,
      };
      await thumbnailVersionsRepository.appendRecord(initialVersion);

      // Sync publishing record thumbnail_ready flag if status is APPROVED
      if (payload.status === 'APPROVED') {
        const pub = await publishingRepository.findByVideoId(videoId);
        if (pub) {
          await publishingRepository.updateRecord(pub.id, { thumbnailReady: true });
        }
      }

      await auditService.log(
        actor.id,
        actor.name,
        'CREATE_THUMBNAIL',
        'THUMBNAIL',
        thumbnailId,
        { videoId, status: payload.status || 'PENDING' }
      );

      return { thumbnail: savedThumbnail, version: initialVersion };
    }

    // 2. Existing Thumbnail Update
    if (payload.createNewVersion) {
      const nextVersionNumber = (existing.currentVersion || 1) + 1;
      const updatedThumbnail = await thumbnailsRepository.updateRecord(existing.id, {
        hookHeadline: payload.hookHeadline || existing.hookHeadline,
        driveAssetUrl: payload.driveAssetUrl !== undefined ? payload.driveAssetUrl : existing.driveAssetUrl,
        previewUrl: payload.previewUrl !== undefined ? payload.previewUrl : existing.previewUrl,
        status: payload.status || existing.status,
        currentVersion: nextVersionNumber,
        updatedAt: now,
      });

      if (!updatedThumbnail) {
        throw new Error(`Failed to update thumbnail "${existing.id}".`);
      }

      const versionId = `${existing.id}-V${nextVersionNumber}`;
      const newVersion: ThumbnailVersion = {
        id: versionId,
        thumbnailId: existing.id,
        versionNumber: nextVersionNumber,
        driveAssetUrl: payload.driveAssetUrl || payload.previewUrl || existing.driveAssetUrl || '',
        designerNotes: payload.designerNotes || `Version ${nextVersionNumber} revision`,
        createdAt: now,
      };
      await thumbnailVersionsRepository.appendRecord(newVersion);

      // Sync publishing
      if (payload.status === 'APPROVED' || existing.status === 'APPROVED') {
        const pub = await publishingRepository.findByVideoId(videoId);
        if (pub) {
          await publishingRepository.updateRecord(pub.id, { thumbnailReady: payload.status === 'APPROVED' });
        }
      }

      await auditService.log(
        actor.id,
        actor.name,
        'SAVE_NEW_THUMBNAIL_VERSION',
        'THUMBNAIL',
        existing.id,
        { videoId, versionNumber: nextVersionNumber, status: payload.status }
      );

      return { thumbnail: updatedThumbnail, version: newVersion };
    } else {
      const updatedThumbnail = await thumbnailsRepository.updateRecord(existing.id, {
        hookHeadline: payload.hookHeadline || existing.hookHeadline,
        driveAssetUrl: payload.driveAssetUrl !== undefined ? payload.driveAssetUrl : existing.driveAssetUrl,
        previewUrl: payload.previewUrl !== undefined ? payload.previewUrl : existing.previewUrl,
        status: payload.status || existing.status,
        updatedAt: now,
      });

      if (!updatedThumbnail) {
        throw new Error(`Failed to update thumbnail "${existing.id}".`);
      }

      if (payload.status === 'APPROVED') {
        const pub = await publishingRepository.findByVideoId(videoId);
        if (pub) {
          await publishingRepository.updateRecord(pub.id, { thumbnailReady: true });
        }
      }

      await auditService.log(
        actor.id,
        actor.name,
        'UPDATE_THUMBNAIL',
        'THUMBNAIL',
        existing.id,
        { videoId, status: payload.status }
      );

      return { thumbnail: updatedThumbnail };
    }
  }

  /**
   * Downloads a thumbnail binary file stream from Google Drive.
   */
  public async downloadThumbnail(thumbnailId: string) {
    const thumb = await thumbnailsRepository.findById(thumbnailId);
    if (!thumb) {
      throw new Error(`Thumbnail "${thumbnailId}" not found.`);
    }
    if (!thumb.driveFileId) {
      throw new Error(`Thumbnail "${thumbnailId}" does not have an attached Google Drive asset.`);
    }
    return googleDriveService.downloadFile(thumb.driveFileId);
  }

  /**
   * Updates thumbnail review status (PENDING / DESIGNED / APPROVED / REJECTED).
   */
  public async updateStatus(
    thumbnailId: string,
    newStatus: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED',
    actorOrRemarks?: { id: string; name: string; role?: string | UserRole } | string,
    remarks?: string
  ): Promise<Thumbnail> {
    let actor: { id: string; name: string; role?: string | UserRole };
    let finalRemarks: string | undefined = remarks;

    if (typeof actorOrRemarks === 'string') {
      actor = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN };
      finalRemarks = actorOrRemarks;
    } else if (actorOrRemarks) {
      actor = actorOrRemarks;
    } else {
      actor = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN };
    }

    this.verifyThumbnailRole(actor);

    const existing = await thumbnailsRepository.findById(thumbnailId);
    if (!existing) {
      throw new Error(`Thumbnail "${thumbnailId}" not found.`);
    }

    if (newStatus === 'APPROVED') {
      if (!existing.driveFileId || !existing.driveFileId.trim()) {
        throw new Error(
          `Cannot approve thumbnail "${thumbnailId}": No real Google Drive thumbnail asset exists (driveFileId is missing). An actual thumbnail image must be uploaded before approval.`
        );
      }
    }

    const previousStatus = existing.status;
    const now = new Date().toISOString();

    const updated = await thumbnailsRepository.updateRecord(thumbnailId, {
      status: newStatus,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to update status for thumbnail "${thumbnailId}".`);
    }

    // Sync PUBLISHING record
    const pub = await publishingRepository.findByVideoId(existing.videoId);
    if (pub) {
      await publishingRepository.updateRecord(pub.id, {
        thumbnailReady: newStatus === 'APPROVED',
      });
    }

    // Record workflow state transition
    await workflowService.recordTransition(
      'VIDEO', // Linked to the video entity's asset track
      existing.videoId,
      `THUMBNAIL_${previousStatus}`,
      `THUMBNAIL_${newStatus}`,
      actor.name,
      remarks || `Thumbnail marked as ${newStatus}`
    );

    await auditService.log(
      actor.id,
      actor.name,
      'UPDATE_THUMBNAIL_STATUS',
      'THUMBNAIL',
      thumbnailId,
      { fromStatus: previousStatus, toStatus: newStatus, remarks }
    );

    return updated;
  }

  /**
   * Uploads a binary thumbnail file to Google Drive and links it to the Thumbnail record.
   */
  public async uploadThumbnailFile(
    videoId: string,
    fileStreamOrBuffer: any,
    fileName: string,
    mimeType: string,
    designerNotes?: string,
    actor?: { id: string; name: string; role?: string | UserRole }
  ): Promise<{ thumbnail: Thumbnail; version: ThumbnailVersion }> {
    const size = Buffer.isBuffer(fileStreamOrBuffer) ? fileStreamOrBuffer.length : undefined;
    return this.uploadThumbnailAsset({
      videoId,
      fileName,
      mimeType,
      fileStreamOrBuffer,
      size,
      designerNotes,
      actor,
    });
  }

  /**
   * Uploads a binary thumbnail asset to Google Drive and links it to the Thumbnail record.
   */
  public async uploadThumbnailAsset(params: {
    videoId: string;
    fileName: string;
    mimeType: string;
    fileStreamOrBuffer: any;
    size?: number;
    designerNotes?: string;
    actor?: { id: string; name: string; role?: string | UserRole };
  }): Promise<{ thumbnail: Thumbnail; version: ThumbnailVersion }> {
    const actor = params.actor || { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN };
    this.verifyThumbnailRole(actor);

    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimeTypes.includes(params.mimeType.toLowerCase())) {
      throw new ValidationError(
        `Invalid file type "${params.mimeType}". Thumbnails must be image/png, image/jpeg, or image/webp.`
      );
    }

    if (params.size !== undefined && params.size === 0) {
      throw new ValidationError('Uploaded thumbnail file is empty (0 bytes).');
    }
    if (Buffer.isBuffer(params.fileStreamOrBuffer) && params.fileStreamOrBuffer.length === 0) {
      throw new ValidationError('Uploaded thumbnail file is empty (0 bytes).');
    }

    const video = await videosRepository.findById(params.videoId);
    if (!video) {
      throw new Error(`Video "${params.videoId}" not found.`);
    }

    const targetContentId = video.contentId || video.contentMasterId;
    if (!targetContentId) {
      throw new Error(`Video "${params.videoId}" does not have an associated Content ID.`);
    }

    // 1. Ensure deterministic Google Drive folder hierarchy
    const hierarchy = await googleDriveService.ensureContentHierarchy(targetContentId);

    // 2. Perform binary upload to Drive
    const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const driveFile = await googleDriveService.uploadFile({
      fileName: sanitizedFileName,
      mimeType: params.mimeType,
      bodyStreamOrBuffer: params.fileStreamOrBuffer,
      folderId: hierarchy.thumbnailsFolderId,
      description: `Uploaded thumbnail asset for Content ID: ${targetContentId}`,
    });

    try {
      const now = new Date().toISOString();
      const existing = await thumbnailsRepository.findByVideoId(params.videoId);

      let savedThumbnail: Thumbnail;
      let newVersion: ThumbnailVersion;

      if (!existing) {
        // Create initial thumbnail record
        const thumbnailId = await idService.allocateThumbnailId();
        const newThumbnail: Thumbnail = {
          id: thumbnailId,
          contentId: targetContentId,
          contentMasterId: video.contentMasterId,
          videoId: params.videoId,
          hookHeadline: video.title || 'Initial Hook Headline',
          driveAssetUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.thumbnailsFolderId}`,
          previewUrl: driveFile.webViewLink || '',
          status: 'DESIGNED',
          currentVersion: 1,
          createdAt: now,
          updatedAt: now,
          // Drive metadata
          driveFileId: driveFile.fileId,
          driveFolderId: hierarchy.thumbnailsFolderId,
          driveFolderUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.thumbnailsFolderId}`,
          fileName: sanitizedFileName,
          mimeType: params.mimeType,
          fileSize: driveFile.size || params.size || 0,
        };

        savedThumbnail = await thumbnailsRepository.appendRecord(newThumbnail);

        const initialVersion: ThumbnailVersion = {
          id: `${thumbnailId}-V1`,
          thumbnailId,
          versionNumber: 1,
          driveAssetUrl: driveFile.webViewLink || '',
          designerNotes: params.designerNotes || 'Initial thumbnail mockup uploaded',
          createdAt: now,
          // Keep version tracking robust
          driveFileId: driveFile.fileId,
        } as any;

        await thumbnailVersionsRepository.appendRecord(initialVersion);
        newVersion = initialVersion;

        await auditService.log(actor.id, actor.name, 'CREATE_THUMBNAIL_ASSET', 'THUMBNAIL', thumbnailId, {
          videoId: params.videoId,
          driveFileId: driveFile.fileId,
        });
      } else {
        // Update existing thumbnail and increment version
        const nextVersionNumber = (existing.currentVersion || 1) + 1;
        const updated = await thumbnailsRepository.updateRecord(existing.id, {
          driveAssetUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.thumbnailsFolderId}`,
          previewUrl: driveFile.webViewLink || '',
          status: 'DESIGNED',
          currentVersion: nextVersionNumber,
          updatedAt: now,
          // Drive metadata
          driveFileId: driveFile.fileId,
          driveFolderId: hierarchy.thumbnailsFolderId,
          driveFolderUrl: driveFile.webViewLink || `https://drive.google.com/drive/folders/${hierarchy.thumbnailsFolderId}`,
          fileName: sanitizedFileName,
          mimeType: params.mimeType,
          fileSize: driveFile.size || params.size || 0,
        });

        if (!updated) {
          throw new Error(`Failed to update thumbnail "${existing.id}" metadata.`);
        }
        savedThumbnail = updated;

        const versionId = `${existing.id}-V${nextVersionNumber}`;
        const versionRecord: ThumbnailVersion = {
          id: versionId,
          thumbnailId: existing.id,
          versionNumber: nextVersionNumber,
          driveAssetUrl: driveFile.webViewLink || '',
          designerNotes: params.designerNotes || `Version ${nextVersionNumber} Revision mockup uploaded`,
          createdAt: now,
          driveFileId: driveFile.fileId,
        } as any;

        await thumbnailVersionsRepository.appendRecord(versionRecord);
        newVersion = versionRecord;

        await auditService.log(actor.id, actor.name, 'SAVE_NEW_THUMBNAIL_ASSET_VERSION', 'THUMBNAIL', existing.id, {
          videoId: params.videoId,
          versionNumber: nextVersionNumber,
          driveFileId: driveFile.fileId,
        });
      }

      return { thumbnail: savedThumbnail, version: newVersion };
    } catch (err: any) {
      // Compensation: Rollback Drive file if Sheets metadata persistence fails
      try {
        await googleDriveService.deleteFile(driveFile.fileId);
      } catch (deleteErr) {
        console.error(`[ThumbnailService] Failed to cleanup orphaned Drive file "${driveFile.fileId}":`, deleteErr);
      }
      throw new Error(`Failed to persist thumbnail metadata after Drive upload: ${err?.message || 'Unknown error'}`);
    }
  }
}

export const thumbnailService = ThumbnailService.getInstance();
