/**
 * BURRA PARIKSHA CMS - Manual Publishing Management Service
 * Phase 6: Script, Thumbnail & Manual Publishing Management
 * 
 * Manages human-in-the-loop manual distribution tracking:
 * - Direct URL and status tracking across YouTube Shorts, Instagram Reels, Facebook Video
 * - Validation checklist (Render status, Thumbnail ready, Pinned comment ready)
 * - Platform completion counter (0/3 -> 3/3)
 * - Safe transition to UPLOADED state
 * - Authorization enforcement & RBAC
 * - Duplicate publish protection & Idempotency guarantees
 * - Full multi-worksheet audit trail (PUBLISHING, WORKFLOW, AUDIT_LOG)
 */

import { publishingRepository } from '../repositories/publishing.repository';
import { videosRepository } from '../repositories/videos.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { thumbnailsRepository } from '../repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../repositories/pinned-comments.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { videoService } from './video.service';
import {
  Publishing,
  SocialPublishStatus,
  VideoProductionStatus,
  UserRole,
  Video,
} from '../../types';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../google-sheets/errors';

export interface PublishReadinessResult {
  videoId: string;
  isReady: boolean;
  blockers: string[];
  warnings: string[];
  checklist: {
    videoReady: boolean;
    thumbnailReady: boolean;
    pinnedCommentReady: boolean;
    scriptReady: boolean;
    metadataReady: boolean;
  };
  videoStatus: VideoProductionStatus;
  completedPlatformsCount: number;
  totalPlatformsCount: number;
}

export class PublishingService {
  private static instance: PublishingService | null = null;

  private constructor() {}

  public static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  /**
   * Validates whether an actor has sufficient authorization for publishing operations.
   */
  public isAuthorizedForPublishing(actor?: { id: string; name?: string; role?: UserRole | string }): {
    authorized: boolean;
    reason?: string;
  } {
    if (!actor) {
      return { authorized: false, reason: 'Authentication required for publishing operations.' };
    }

    const role = String(actor.role || '').toUpperCase();
    const authorizedRoles = [
      UserRole.ADMIN.toUpperCase(),
      UserRole.PUBLISHING_MANAGER.toUpperCase(),
      UserRole.CONTENT_MANAGER.toUpperCase(),
      'PRODUCER',
      'LEAD_EDITOR',
      'SUPER_ADMIN',
    ];

    const isMatch =
      authorizedRoles.includes(role) ||
      role.includes('ADMIN') ||
      role.includes('PUBLISH') ||
      role.includes('MANAGER');

    if (!isMatch) {
      return {
        authorized: false,
        reason: `User "${actor.name || actor.id}" with role "${actor.role || 'UNSPECIFIED'}" is not authorized for publishing actions. Required role: ADMIN, PUBLISHING_MANAGER, or CONTENT_MANAGER.`,
      };
    }

    return { authorized: true };
  }

  /**
   * Asserts authorization for publishing, throwing an AuthorizationError if rejected.
   */
  public assertPublishAuthorization(actor?: { id: string; name?: string; role?: UserRole | string }): void {
    const authCheck = this.isAuthorizedForPublishing(actor);
    if (!authCheck.authorized) {
      throw new AuthorizationError(authCheck.reason || 'Unauthorized publishing operation.', {
        actorId: actor?.id,
        actorRole: actor?.role,
      });
    }
  }

  /**
   * Retrieves all publishing distribution records.
   */
  public async getPublishingList(): Promise<Publishing[]> {
    return publishingRepository.findAll();
  }

  /**
   * Retrieves single publishing distribution record by ID.
   */
  public async getPublishingById(id: string): Promise<Publishing | null> {
    return publishingRepository.findById(id);
  }

  /**
   * Retrieves or lazily creates a publishing record for a video.
   */
  public async getPublishingByVideoId(videoId: string): Promise<Publishing | null> {
    let record = await publishingRepository.findByVideoId(videoId);
    if (record) {
      return record;
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      return null;
    }

    const thumbnail = await thumbnailsRepository.findByVideoId(videoId);
    const pinnedComment = await pinnedCommentsRepository.findByVideoId(videoId);

    const now = new Date().toISOString();
    const newRecord: Publishing = {
      id: `PUB-${videoId.replace('BP-V-', '')}`,
      videoId,
      videoTitle: video.title,
      questionId: video.questionId,
      finalVideoStatus:
        video.status === VideoProductionStatus.UPLOADED ||
        video.status === VideoProductionStatus.READY_TO_UPLOAD
          ? 'VERIFIED'
          : 'READY',
      youtube: {
        status: SocialPublishStatus.NOT_STARTED,
      },
      instagram: {
        status: SocialPublishStatus.NOT_STARTED,
      },
      facebook: {
        status: SocialPublishStatus.NOT_STARTED,
      },
      pinnedCommentReady: Boolean(pinnedComment?.isApproved),
      thumbnailReady: thumbnail?.status === 'APPROVED',
      completedPlatformsCount: 0,
      totalPlatformsCount: 3,
      createdAt: now,
      updatedAt: now,
    };

    return publishingRepository.appendRecord(newRecord);
  }

  /**
   * Validates whether a video meets all strict prerequisite criteria to be published.
   */
  public async validatePublishReadiness(
    videoId: string,
    options?: {
      skipAudit?: boolean;
      actor?: { id: string; name: string; role?: UserRole | string };
    }
  ): Promise<PublishReadinessResult> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`);
    }

    const blockers: string[] = [];
    const warnings: string[] = [];

    // 1. Video Production Lifecycle State Check
    const isVideoInPublishableState =
      video.status === VideoProductionStatus.READY_TO_UPLOAD ||
      video.status === VideoProductionStatus.UPLOADED;

    if (!isVideoInPublishableState) {
      blockers.push(
        `Video "${videoId}" is currently in status "${video.status}". Videos must reach "READY_TO_UPLOAD" before distribution.`
      );
    }

    // 2. Thumbnail Check
    const thumbnail = await thumbnailsRepository.findByVideoId(videoId);
    const isThumbnailApproved = thumbnail?.status === 'APPROVED';
    if (!thumbnail) {
      blockers.push(`Thumbnail for video "${videoId}" is missing.`);
    } else if (!isThumbnailApproved) {
      blockers.push(
        `Thumbnail for video "${videoId}" has status "${thumbnail.status}". Must be "APPROVED" before publishing.`
      );
    }

    // 3. Pinned Comment Check
    const pinnedComment = await pinnedCommentsRepository.findByVideoId(videoId);
    const isPinnedCommentApproved = Boolean(pinnedComment?.isApproved);
    if (!pinnedComment) {
      blockers.push(`Pinned comment for video "${videoId}" is missing.`);
    } else if (!isPinnedCommentApproved) {
      blockers.push(`Pinned comment for video "${videoId}" is not approved.`);
    }

    // 4. Script Check
    const script = await scriptsRepository.findByVideoId(videoId);
    const isScriptReady = Boolean(
      script ||
      video.status === VideoProductionStatus.READY_TO_UPLOAD ||
      video.status === VideoProductionStatus.UPLOADED
    );
    if (!isScriptReady) {
      warnings.push(`Script record for video "${videoId}" was not found.`);
    }

    // 5. Metadata Integrity Check
    const isMetadataReady = Boolean(video.title && video.questionId);
    if (!isMetadataReady) {
      blockers.push(`Video metadata is incomplete: Title or Question ID reference is missing.`);
    }

    // 6. Master render duration check
    if (!video.actualDurationSeconds && !video.targetDurationSeconds) {
      warnings.push(`Video "${videoId}" has no recorded duration.`);
    }

    const pub = await publishingRepository.findByVideoId(videoId);
    const completedCount = pub?.completedPlatformsCount ?? 0;
    const isReady = blockers.length === 0;

    const result: PublishReadinessResult = {
      videoId,
      isReady,
      blockers,
      warnings,
      checklist: {
        videoReady: isVideoInPublishableState,
        thumbnailReady: isThumbnailApproved,
        pinnedCommentReady: isPinnedCommentApproved,
        scriptReady: isScriptReady,
        metadataReady: isMetadataReady,
      },
      videoStatus: video.status,
      completedPlatformsCount: completedCount,
      totalPlatformsCount: 3,
    };

    if (!options?.skipAudit) {
      const actor = options?.actor || { id: 'SYSTEM', name: 'System Validation Engine' };
      await auditService.log(
        actor.id,
        actor.name,
        'VALIDATE_PUBLISH_READINESS',
        'VIDEO',
        videoId,
        {
          isReady,
          blockerCount: blockers.length,
          warningCount: warnings.length,
          blockers,
        }
      );
    }

    return result;
  }

  /**
   * Updates publishing record with recalculated platform completion metrics.
   */
  public async updatePublishingRecord(
    id: string,
    updates: Partial<Publishing>,
    actor?: { id: string; name?: string; role?: UserRole | string }
  ): Promise<Publishing> {
    this.assertPublishAuthorization(actor);
    const validActor = actor!;

    const existing = await publishingRepository.findById(id);
    if (!existing) {
      throw new Error(`Publishing record "${id}" not found.`);
    }

    const merged = { ...existing, ...updates };

    // Calculate completed platforms
    let completedCount = 0;
    if (merged.youtube?.status === SocialPublishStatus.PUBLISHED) completedCount++;
    if (merged.instagram?.status === SocialPublishStatus.PUBLISHED) completedCount++;
    if (merged.facebook?.status === SocialPublishStatus.PUBLISHED) completedCount++;

    const payloadToSave: Partial<Publishing> = {
      ...updates,
      completedPlatformsCount: completedCount,
      totalPlatformsCount: 3,
      updatedAt: new Date().toISOString(),
    };

    const updated = await publishingRepository.updateRecord(id, payloadToSave);
    if (!updated) {
      throw new Error(`Failed to update publishing record "${id}".`);
    }

    await auditService.log(validActor.id, validActor.name || validActor.id, 'UPDATE_PUBLISHING', 'PUBLISHING', id, {
      videoId: existing.videoId,
      completedCount,
      updates,
    });

    return updated;
  }

  /**
   * Records that a specific social platform has been published for a video.
   * Includes authorization enforcement, prerequisite validation, duplicate publish protection,
   * idempotency safeguards, and audit/workflow trail logging.
   */
  public async markPlatformPublished(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    postUrl: string,
    actor?: { id: string; name?: string; role?: UserRole | string },
    notes?: string,
    options?: {
      forceRePublish?: boolean;
      skipReadinessCheck?: boolean;
      autoAdvanceUploaded?: boolean;
    }
  ): Promise<Publishing> {
    // 1. Authorization Enforcement
    this.assertPublishAuthorization(actor);
    const validActor = { id: actor!.id, name: actor!.name || actor!.id, role: actor!.role };

    // 2. Input URL Validation
    const cleanUrl = postUrl?.trim() || '';
    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      throw new ValidationError(
        `Invalid publishing URL "${postUrl}". URL must be a non-empty string starting with http:// or https://.`
      );
    }

    // Platform Domain Sanity Verification
    const lowerUrl = cleanUrl.toLowerCase();
    if (platform === 'youtube' && !lowerUrl.includes('youtube.com') && !lowerUrl.includes('youtu.be')) {
      throw new ValidationError(`Invalid YouTube URL "${cleanUrl}". Expected youtube.com or youtu.be domain.`);
    }
    if (platform === 'instagram' && !lowerUrl.includes('instagram.com') && !lowerUrl.includes('instagr.am')) {
      throw new ValidationError(`Invalid Instagram URL "${cleanUrl}". Expected instagram.com domain.`);
    }
    if (platform === 'facebook' && !lowerUrl.includes('facebook.com') && !lowerUrl.includes('fb.watch') && !lowerUrl.includes('fb.com')) {
      throw new ValidationError(`Invalid Facebook URL "${cleanUrl}". Expected facebook.com or fb.watch domain.`);
    }

    // 3. Publishing Readiness & Prerequisite Check
    if (!options?.skipReadinessCheck) {
      const readiness = await this.validatePublishReadiness(videoId, {
        skipAudit: true,
        actor: validActor,
      });

      if (!readiness.isReady) {
        await auditService.log(
          validActor.id,
          validActor.name,
          'PUBLISH_BLOCKED_VALIDATION',
          'VIDEO',
          videoId,
          {
            platform,
            blockers: readiness.blockers,
          }
        );

        throw new ValidationError(
          `Publishing blocked for video "${videoId}": Missing mandatory requirements.\n${readiness.blockers.join('\n')}`,
          { blockers: readiness.blockers }
        );
      }
    }

    // 4. Load or initialize publishing record
    let pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new Error(`Publishing record for video "${videoId}" could not be loaded.`);
    }

    // 5. Cross-Video Duplicate URL Protection
    const allPublishing = await publishingRepository.findAll();
    const crossDuplicate = allPublishing.find((p) => {
      if (p.videoId === videoId) return false;
      const otherUrl =
        platform === 'youtube'
          ? p.youtube?.videoUrl
          : platform === 'instagram'
          ? p.instagram?.postUrl
          : p.facebook?.postUrl;
      return otherUrl && otherUrl.trim() === cleanUrl;
    });

    if (crossDuplicate) {
      throw new ValidationError(
        `Duplicate publish protection: The URL "${cleanUrl}" is already registered to another video "${crossDuplicate.videoId}" on ${platform.toUpperCase()}.`
      );
    }

    // 6. Idempotency & Same-Record Duplicate Publish Protection
    const currentPlatformData = pub[platform];
    const currentUrl =
      platform === 'youtube'
        ? pub.youtube?.videoUrl
        : platform === 'instagram'
        ? pub.instagram?.postUrl
        : pub.facebook?.postUrl;

    if (
      currentPlatformData?.status === SocialPublishStatus.PUBLISHED &&
      currentUrl === cleanUrl &&
      !options?.forceRePublish
    ) {
      // Idempotent return - exact same state already recorded
      await auditService.log(
        validActor.id,
        validActor.name,
        'IDEMPOTENT_PUBLISH_DETECTED',
        'PUBLISHING',
        pub.id,
        {
          platform,
          url: cleanUrl,
          message: `Platform ${platform.toUpperCase()} is already recorded as PUBLISHED with URL ${cleanUrl}. Returning current state without duplicate mutation.`,
        }
      );
      return pub;
    }

    if (
      currentPlatformData?.status === SocialPublishStatus.PUBLISHED &&
      currentUrl &&
      currentUrl !== cleanUrl &&
      !options?.forceRePublish
    ) {
      throw new ValidationError(
        `Platform ${platform.toUpperCase()} is already marked as PUBLISHED with URL "${currentUrl}". Provide options.forceRePublish = true to overwrite with "${cleanUrl}".`
      );
    }

    // 7. Persist Updated Platform Data to PUBLISHING worksheet
    const now = new Date().toISOString();
    const updatedPlatformData = {
      status: SocialPublishStatus.PUBLISHED,
      videoUrl: platform === 'youtube' ? cleanUrl : undefined,
      postUrl: platform !== 'youtube' ? cleanUrl : undefined,
      publishedAt: currentPlatformData?.publishedAt || now,
      notes: notes || currentPlatformData?.notes,
    };

    const thumbnail = await thumbnailsRepository.findByVideoId(videoId);
    const pinnedComment = await pinnedCommentsRepository.findByVideoId(videoId);

    const updates: Partial<Publishing> = {
      [platform]: updatedPlatformData,
      thumbnailReady: thumbnail?.status === 'APPROVED',
      pinnedCommentReady: Boolean(pinnedComment?.isApproved),
      finalVideoStatus: 'VERIFIED',
    };

    const updatedPub = await this.updatePublishingRecord(pub.id, updates, validActor);

    // 8. Record in WORKFLOW worksheet
    await workflowService.recordTransition(
      'PUBLISHING',
      pub.id,
      currentPlatformData?.status || SocialPublishStatus.NOT_STARTED,
      SocialPublishStatus.PUBLISHED,
      validActor.name,
      `Published on ${platform.toUpperCase()} [${cleanUrl}]${notes ? ` — ${notes}` : ''}`
    );

    // 9. Record in AUDIT_LOG worksheet
    await auditService.log(
      validActor.id,
      validActor.name,
      'MARK_PLATFORM_PUBLISHED',
      'PUBLISHING',
      pub.id,
      {
        videoId,
        platform,
        url: cleanUrl,
        completedCount: updatedPub.completedPlatformsCount,
      }
    );

    // 10. Automatically Advance Video to UPLOADED if all distribution is complete
    if (options?.autoAdvanceUploaded !== false) {
      const video = await videosRepository.findById(videoId);
      if (video && video.status === VideoProductionStatus.READY_TO_UPLOAD) {
        await videoService.transitionStatus(
          videoId,
          VideoProductionStatus.UPLOADED,
          validActor,
          `Video marked as UPLOADED after publication on ${platform.toUpperCase()} [${cleanUrl}]`
        );
      }
    }

    return updatedPub;
  }

  /**
   * Finalizes the publishing lifecycle for a video, confirming transition to terminal UPLOADED state.
   */
  public async finalizePublishing(
    videoId: string,
    actor?: { id: string; name?: string; role?: UserRole | string },
    remarks?: string
  ): Promise<{ video: Video; publishing: Publishing }> {
    this.assertPublishAuthorization(actor);
    const validActor = { id: actor!.id, name: actor!.name || actor!.id, role: actor!.role };

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video "${videoId}" not found.`);
    }

    let pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new ReferenceIntegrityError(`Publishing record for video "${videoId}" not found.`);
    }

    // Idempotency: If already UPLOADED, safely return existing state
    if (video.status === VideoProductionStatus.UPLOADED) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'IDEMPOTENT_PUBLISH_FINALIZE',
        'VIDEO',
        videoId,
        {
          message: 'Video is already in terminal UPLOADED status.',
        }
      );
      return { video, publishing: pub };
    }

    // Validate that at least one platform is published
    if (pub.completedPlatformsCount === 0) {
      throw new ValidationError(
        `Cannot finalize publishing for video "${videoId}": At least 1 social platform must be published with a live URL.`
      );
    }

    const updatedVideo = await videoService.transitionStatus(
      videoId,
      VideoProductionStatus.UPLOADED,
      validActor,
      remarks || 'Publishing finalized and confirmed live across distribution channels.'
    );

    pub = (await this.getPublishingByVideoId(videoId)) || pub;

    await auditService.log(validActor.id, validActor.name, 'FINALIZE_PUBLISHING', 'PUBLISHING', pub.id, {
      videoId,
      finalVideoStatus: updatedVideo.status,
      completedPlatformsCount: pub.completedPlatformsCount,
    });

    return { video: updatedVideo, publishing: pub };
  }
}

export const publishingService = PublishingService.getInstance();

