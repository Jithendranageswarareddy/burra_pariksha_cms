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
import { Thumbnail, ThumbnailVersion, UserRole } from '../../types';

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
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.DESIGNER];
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

    const existing = await thumbnailsRepository.findByVideoId(videoId);
    const now = new Date().toISOString();

    if (!existing) {
      // 1. Create Initial Thumbnail Record (Version 1)
      const thumbnailId = await idService.allocateThumbnailId();
      const newThumbnail: Thumbnail = {
        id: thumbnailId,
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
   * Updates thumbnail review status (PENDING / DESIGNED / APPROVED / REJECTED).
   */
  public async updateStatus(
    thumbnailId: string,
    newStatus: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED',
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<Thumbnail> {
    this.verifyThumbnailRole(actor);

    const existing = await thumbnailsRepository.findById(thumbnailId);
    if (!existing) {
      throw new Error(`Thumbnail "${thumbnailId}" not found.`);
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
}

export const thumbnailService = ThumbnailService.getInstance();
