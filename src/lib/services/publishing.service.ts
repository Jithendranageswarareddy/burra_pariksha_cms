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
import { assignmentsRepository } from '../repositories/assignments.repository';
import { usersRepository } from '../repositories/users.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { videoService } from './video.service';
import { idService } from './id.service';
import {
  Publishing,
  SocialPublishStatus,
  VideoProductionStatus,
  UserRole,
  Video,
  QuestionValidationStatus,
  SocialReviewStatus,
  QuestionStatus,
  RenderValidationStatus,
  CanonicalProductionReadiness,
  PlatformPackageProjection,
  PlatformType,
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  AssignmentRole,
  PriorityLevel,
} from '../../types';
import { SocialReviewService } from './social-review.service';
import { ProductionAssetValidationService } from './production-asset-validation.service';
import { ObjectAuthorizationService } from './object-auth.service';
import { sanitizeSpreadsheetCellValue } from '../google-sheets/helpers';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../google-sheets/errors';

export interface CreatePublishingAssignmentInput {
  assigneeId: string;
  platform?: string; // Optional: 'youtube' | 'instagram' | 'facebook' (exact lowercase)
  priority?: PriorityLevel;
  dueDate?: string;
  dueAt?: string;
  notes?: string;
}

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
  renderValidationStatus?: RenderValidationStatus;
  canonicalProductionReadiness?: CanonicalProductionReadiness;
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
    ];

    const isMatch = authorizedRoles.includes(role);

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
      contentId: video.contentId || video.contentMasterId,
      contentMasterId: video.contentMasterId,
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

    // 7. Gate D: Question Validation & Social Review Approval check
    if (video.questionId) {
      const question = await questionsRepository.findById(video.questionId);
      if (!question) {
        blockers.push(`Linked source question "${video.questionId}" not found.`);
      } else {
        // - QuestionValidationStatus === VALID
        if (question.validationStatus !== QuestionValidationStatus.VALID) {
          blockers.push(`Source question validation status is "${question.validationStatus || 'NOT_VALIDATED'}" (must be VALID).`);
        }
        // - QuestionStatus === APPROVED
        if (question.status !== QuestionStatus.APPROVED) {
          blockers.push(`Source question status is "${question.status || 'DRAFT'}" (must be APPROVED).`);
        }
        try {
          const bundle = await SocialReviewService.getReviewPackageBundle(question.id, question);
          
          // - Social Review === APPROVED
          if (bundle.currentReviewStatus !== SocialReviewStatus.APPROVED) {
            blockers.push(`Social review status is "${bundle.currentReviewStatus}" (must be APPROVED before publishing).`);
          }
          // - Social Review reviewedVersionHash === current fingerprint
          else if (bundle.latestReviewRecord?.reviewedVersionHash !== bundle.currentVersionHash) {
            blockers.push(`Approved social review is STALE: Reviewed version hash does not match current content fingerprint.`);
          }

          // - Social invariance is valid
          const factualBlocker = bundle.blockers.find(b => b.includes('invariance') || b.includes('factual') || b.includes('Invariance'));
          const leakageBlocker = bundle.blockers.find(b => b.includes('leakage') || b.includes('Answer leakage'));
          if (factualBlocker) {
            blockers.push('Factual invariance check failed between source question and social presentation.');
          }
          if (leakageBlocker) {
            blockers.push('Answer leakage detected in social hook or presentation.');
          }

          // - required platform package exists / Target multi-platform adaptations (YouTube, Instagram, Facebook) are incomplete or invalid
          if (!bundle.multiPlatformAdaptations || !bundle.multiPlatformAdaptations.isAllValid || bundle.blockers.some(b => b.includes('adaptations'))) {
            blockers.push('Target multi-platform adaptations (YouTube, Instagram, Facebook) are incomplete or invalid.');
          }

          // - no blocking quality/review condition exists
          if (bundle.qualityAssessment) {
            if (bundle.qualityAssessment.blockingFindings.length > 0 || bundle.blockers.some(b => b.includes('blocking quality findings'))) {
              blockers.push(`Content package has ${bundle.qualityAssessment.blockingFindings.length} blocking quality findings.`);
            }
            if (bundle.qualityAssessment.status === 'REJECTED' || bundle.blockers.some(b => b.includes('REJECTED due to integrity issues'))) {
              blockers.push('AI Quality Assessment status is REJECTED due to integrity issues.');
            }
          }
        } catch {
          blockers.push(`Social review package not generated or unavailable for question "${question.id}".`);
        }
      }
    } else {
      blockers.push(`Video "${videoId}" has no linked questionId.`);
    }

    const pub = await publishingRepository.findByVideoId(videoId);
    const completedCount = pub?.completedPlatformsCount ?? 0;
    const isReady = blockers.length === 0;

    const validation = ProductionAssetValidationService.validateMetadata(video);
    const renderValidationStatus = validation.status;
    const canonicalProductionReadiness = ProductionAssetValidationService.determineReadiness(video, { isReady });

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
      renderValidationStatus,
      canonicalProductionReadiness,
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
    actor?: { id: string; name?: string; role?: UserRole | string },
    options?: { bypassStateValidation?: boolean }
  ): Promise<Publishing> {
    this.assertPublishAuthorization(actor);
    const validActor = actor!;

    // Client state injection check: Prevent directly forcing SCHEDULED, PUBLISHED, or FAILED from generic routes
    if (!options?.bypassStateValidation) {
      const blockedStatuses = [
        SocialPublishStatus.SCHEDULED,
        SocialPublishStatus.PUBLISHED,
        SocialPublishStatus.FAILED,
      ];
      if (
        (updates.youtube?.status && blockedStatuses.includes(updates.youtube.status)) ||
        (updates.instagram?.status && blockedStatuses.includes(updates.instagram.status)) ||
        (updates.facebook?.status && blockedStatuses.includes(updates.facebook.status))
      ) {
        throw new ValidationError(
          `Directly setting platform publishing status to SCHEDULED, PUBLISHED, or FAILED is prohibited. Use authorized workflow transitions instead.`
        );
      }
    }

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
      scheduledAt: currentPlatformData?.scheduledAt,
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

    const updatedPub = await this.updatePublishingRecord(pub.id, updates, validActor, { bypassStateValidation: true });

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

    return updatedPub;
  }

  /**
   * Schedules publishing for a specific platform with future ISO-8601 UTC timestamp validation,
   * Gate D readiness checks, state safeguards, and workflow/audit logging.
   */
  public async schedulePublishing(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    scheduledAt: string,
    actor?: { id: string; name?: string; role?: UserRole | string }
  ): Promise<Publishing> {
    // 1. Authorization Enforcement
    this.assertPublishAuthorization(actor);
    const validActor = { id: actor!.id, name: actor!.name || actor!.id, role: actor!.role };

    // 2. Platform Validation
    const validPlatforms = ['youtube', 'instagram', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      throw new ValidationError(`Invalid publishing platform "${platform}". Must be one of: youtube, instagram, facebook.`);
    }

    // 3. ISO-8601 Timestamp Validation & UTC Normalization
    if (!scheduledAt || typeof scheduledAt !== 'string' || isNaN(Date.parse(scheduledAt))) {
      throw new ValidationError(`Invalid ISO-8601 timestamp provided for scheduling: "${scheduledAt}".`);
    }
    const dateObj = new Date(scheduledAt);
    const normalizedUtc = dateObj.toISOString();

    if (dateObj.getTime() <= Date.now()) {
      throw new ValidationError(`Scheduled publishing time must be in the future. Provided: "${scheduledAt}" (UTC: ${normalizedUtc}).`);
    }

    // 4. Load or initialize publishing record
    let pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new ReferenceIntegrityError(`Publishing record for video "${videoId}" not found.`);
    }

    // 5. Gate D Readiness Check
    const readiness = await this.validatePublishReadiness(videoId, {
      skipAudit: true,
      actor: validActor,
    });

    if (!readiness.isReady) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'SCHEDULE_BLOCKED_VALIDATION',
        'VIDEO',
        videoId,
        {
          platform,
          scheduledAt: normalizedUtc,
          blockers: readiness.blockers,
        }
      );

      throw new ValidationError(
        `Publishing scheduling blocked for video "${videoId}": Missing mandatory requirements.\n${readiness.blockers.join('\n')}`,
        { blockers: readiness.blockers }
      );
    }

    // 6. Platform State Rules Check
    const currentPlatformData = pub[platform] || { status: SocialPublishStatus.NOT_STARTED };
    if (currentPlatformData.status === SocialPublishStatus.PUBLISHED) {
      throw new ValidationError(
        `Platform ${platform.toUpperCase()} is already PUBLISHED with a live URL and cannot be scheduled.`
      );
    }

    // 7. Idempotency Safeguard
    const currentScheduledAt = currentPlatformData.scheduledAt || (pub as any)[`${platform}ScheduledAt`];
    if (
      currentPlatformData.status === SocialPublishStatus.SCHEDULED &&
      currentScheduledAt === normalizedUtc
    ) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'IDEMPOTENT_SCHEDULE_DETECTED',
        'PUBLISHING',
        pub.id,
        {
          platform,
          scheduledAt: normalizedUtc,
          message: `Platform ${platform.toUpperCase()} is already scheduled for ${normalizedUtc}. Returning current record without duplicate workflow events.`,
        }
      );
      return pub;
    }

    // 8. Persist Schedule Data
    const updatedPlatformData = {
      ...currentPlatformData,
      status: SocialPublishStatus.SCHEDULED,
      scheduledAt: normalizedUtc,
    };

    const scheduledAtKey = `${platform}ScheduledAt` as keyof Publishing;
    const updates: Partial<Publishing> = {
      [platform]: updatedPlatformData,
      [scheduledAtKey]: normalizedUtc,
    };

    const updatedPub = await this.updatePublishingRecord(pub.id, updates, validActor, { bypassStateValidation: true });

    // 9. Record in WORKFLOW worksheet
    await workflowService.recordTransition(
      'PUBLISHING',
      pub.id,
      currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
      SocialPublishStatus.SCHEDULED,
      validActor.name,
      `Scheduled publishing on ${platform.toUpperCase()} for ${normalizedUtc}`
    );

    // 10. Record in AUDIT_LOG worksheet
    await auditService.log(
      validActor.id,
      validActor.name,
      'SCHEDULE_PUBLISHING',
      'PUBLISHING',
      pub.id,
      {
        videoId,
        platform,
        scheduledAt: normalizedUtc,
        previousStatus: currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
      }
    );

    return updatedPub;
  }

  /**
   * Records that a specific social platform publishing attempt has failed with detailed error tracking and audit trail.
   */
  public async markPlatformFailed(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    errorMsg: string,
    actor?: { id: string; name?: string; role?: UserRole | string }
  ): Promise<Publishing> {
    // 1. Role Authorization Enforcement
    this.assertPublishAuthorization(actor);
    const validActor = { id: actor!.id, name: actor!.name || actor!.id, role: actor!.role };

    // 2. Platform Validation
    const validPlatforms = ['youtube', 'instagram', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      throw new ValidationError(`Invalid publishing platform "${platform}". Must be one of: youtube, instagram, facebook.`);
    }

    // 3. Load Publishing Record
    let pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new ReferenceIntegrityError(`Publishing record for video "${videoId}" not found.`);
    }

    // 4. Object Authorization Check
    const video = await videosRepository.findById(videoId);
    const objectAuth = ObjectAuthorizationService.getInstance();
    const canModify = await objectAuth.canModifyPublishing(validActor, video || pub);
    if (!canModify) {
      throw new AuthorizationError(`Actor "${validActor.id}" (${validActor.role}) is not authorized to modify publishing for video "${videoId}".`);
    }

    // 5. Check Current Platform State
    const currentPlatformData = pub[platform] || { status: SocialPublishStatus.NOT_STARTED };
    if (currentPlatformData.status === SocialPublishStatus.PUBLISHED) {
      throw new ValidationError(`Platform ${platform.toUpperCase()} is already PUBLISHED with a live URL and cannot be marked as FAILED.`);
    }

    // 6. Validate & Sanitize Failure Reason
    if (!errorMsg || typeof errorMsg !== 'string' || !errorMsg.trim()) {
      throw new ValidationError('A non-empty failure reason is required to mark a platform as FAILED.');
    }
    const sanitizedReason = sanitizeSpreadsheetCellValue(errorMsg.trim());
    if (sanitizedReason.length > 1000) {
      throw new ValidationError('Failure reason exceeds maximum allowable length of 1000 characters.');
    }

    // 7. Idempotency Safeguard
    if (
      currentPlatformData.status === SocialPublishStatus.FAILED &&
      currentPlatformData.lastFailureReason === sanitizedReason
    ) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'IDEMPOTENT_FAILURE_DETECTED',
        'PUBLISHING',
        pub.id,
        {
          platform,
          failureReason: sanitizedReason,
          message: `Platform ${platform.toUpperCase()} is already marked as FAILED with reason "${sanitizedReason}". Returning current record without duplicate mutation.`,
        }
      );
      return pub;
    }

    // 8. Prepare Updated Platform Data
    const nowISO = new Date().toISOString();
    const currentRetryCount = typeof currentPlatformData.retryCount === 'number' ? currentPlatformData.retryCount : 0;

    const updatedPlatformData = {
      ...currentPlatformData,
      status: SocialPublishStatus.FAILED,
      lastFailureReason: sanitizedReason,
      failedAt: nowISO,
      retryCount: currentRetryCount,
    };

    const failureReasonKey = `${platform}LastFailureReason` as keyof Publishing;
    const failedAtKey = `${platform}FailedAt` as keyof Publishing;
    const retryCountKey = `${platform}RetryCount` as keyof Publishing;

    const updates: Partial<Publishing> = {
      [platform]: updatedPlatformData,
      [failureReasonKey]: sanitizedReason,
      [failedAtKey]: nowISO,
      [retryCountKey]: currentRetryCount,
    };

    const updatedPub = await this.updatePublishingRecord(pub.id, updates, validActor, { bypassStateValidation: true });

    // 9. Record in WORKFLOW worksheet
    await workflowService.recordTransition(
      'PUBLISHING',
      pub.id,
      currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
      SocialPublishStatus.FAILED,
      validActor.name,
      `Publishing failed on ${platform.toUpperCase()}: ${sanitizedReason}`
    );

    // 10. Record in AUDIT_LOG worksheet
    await auditService.log(
      validActor.id,
      validActor.name,
      'MARK_PLATFORM_FAILED',
      'PUBLISHING',
      pub.id,
      {
        videoId,
        platform,
        failureReason: sanitizedReason,
        failedAt: nowISO,
        retryCount: currentRetryCount,
        previousStatus: currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
      }
    );

    return updatedPub;
  }

  /**
   * Retries publishing for a FAILED platform (or reschedules a platform) respecting Gate D readiness checks,
   * object authorization, state transition rules, and audit trails.
   */
  public async retryPublishing(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    options?: { scheduledAt?: string; remarks?: string },
    actor?: { id: string; name?: string; role?: UserRole | string }
  ): Promise<Publishing> {
    // 1. Role Authorization Enforcement
    this.assertPublishAuthorization(actor);
    const validActor = { id: actor!.id, name: actor!.name || actor!.id, role: actor!.role };

    // 2. Platform Validation
    const validPlatforms = ['youtube', 'instagram', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      throw new ValidationError(`Invalid publishing platform "${platform}". Must be one of: youtube, instagram, facebook.`);
    }

    // 3. Load Publishing Record
    let pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new ReferenceIntegrityError(`Publishing record for video "${videoId}" not found.`);
    }

    // 4. Object Authorization Check
    const video = await videosRepository.findById(videoId);
    const objectAuth = ObjectAuthorizationService.getInstance();
    const canModify = await objectAuth.canModifyPublishing(validActor, video || pub);
    if (!canModify) {
      throw new AuthorizationError(`Actor "${validActor.id}" (${validActor.role}) is not authorized to modify publishing for video "${videoId}".`);
    }

    // 5. Check Platform State Rules
    const currentPlatformData = pub[platform] || { status: SocialPublishStatus.NOT_STARTED };
    if (currentPlatformData.status === SocialPublishStatus.PUBLISHED) {
      throw new ValidationError(`Platform ${platform.toUpperCase()} is already PUBLISHED with a live URL and cannot be retried or rescheduled.`);
    }

    // 6. Gate D Readiness Check (Retry MUST NOT bypass Gate D)
    const readiness = await this.validatePublishReadiness(videoId, {
      skipAudit: true,
      actor: validActor,
    });

    if (!readiness.isReady) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'RETRY_BLOCKED_VALIDATION',
        'VIDEO',
        videoId,
        {
          platform,
          blockers: readiness.blockers,
        }
      );

      throw new ValidationError(
        `Publishing retry blocked for video "${videoId}": Missing mandatory requirements.\n${readiness.blockers.join('\n')}`,
        { blockers: readiness.blockers }
      );
    }

    // 7. Determine Target Status and Validate Scheduling Timestamp if provided
    let targetStatus: SocialPublishStatus = SocialPublishStatus.DRAFT;
    let normalizedUtc: string | undefined = undefined;

    if (options?.scheduledAt) {
      if (typeof options.scheduledAt !== 'string' || isNaN(Date.parse(options.scheduledAt))) {
        throw new ValidationError(`Invalid ISO-8601 timestamp provided for scheduling retry: "${options.scheduledAt}".`);
      }
      const dateObj = new Date(options.scheduledAt);
      normalizedUtc = dateObj.toISOString();

      if (dateObj.getTime() <= Date.now()) {
        throw new ValidationError(`Scheduled publishing time must be in the future. Provided: "${options.scheduledAt}" (UTC: ${normalizedUtc}).`);
      }
      targetStatus = SocialPublishStatus.SCHEDULED;
    }

    // 8. Idempotency Safeguard
    const currentScheduledAt = currentPlatformData.scheduledAt || (pub as any)[`${platform}ScheduledAt`];
    if (
      currentPlatformData.status === targetStatus &&
      (targetStatus !== SocialPublishStatus.SCHEDULED || currentScheduledAt === normalizedUtc)
    ) {
      await auditService.log(
        validActor.id,
        validActor.name,
        'IDEMPOTENT_RETRY_DETECTED',
        'PUBLISHING',
        pub.id,
        {
          platform,
          targetStatus,
          scheduledAt: normalizedUtc,
          message: `Platform ${platform.toUpperCase()} is already in state ${targetStatus}${normalizedUtc ? ` scheduled for ${normalizedUtc}` : ''}. Returning current record without duplicate retry mutation.`,
        }
      );
      return pub;
    }

    // 9. Increment Retry Count (ONLY on genuine retry/re-attempt, no maximum limit!)
    const currentRetryCount = typeof currentPlatformData.retryCount === 'number' ? currentPlatformData.retryCount : 0;
    const newRetryCount = currentRetryCount + 1;

    // 10. Prepare Updated Platform Object
    const updatedPlatformData = {
      ...currentPlatformData,
      status: targetStatus,
      scheduledAt: targetStatus === SocialPublishStatus.SCHEDULED ? normalizedUtc : undefined,
      retryCount: newRetryCount,
      lastFailureReason: currentPlatformData.lastFailureReason,
      failedAt: currentPlatformData.failedAt,
    };

    const scheduledAtKey = `${platform}ScheduledAt` as keyof Publishing;
    const retryCountKey = `${platform}RetryCount` as keyof Publishing;

    const updates: Partial<Publishing> = {
      [platform]: updatedPlatformData,
      [retryCountKey]: newRetryCount,
    };

    if (targetStatus === SocialPublishStatus.SCHEDULED) {
      (updates as any)[scheduledAtKey] = normalizedUtc;
    }

    const updatedPub = await this.updatePublishingRecord(pub.id, updates, validActor, { bypassStateValidation: true });

    // 11. Record in WORKFLOW worksheet
    await workflowService.recordTransition(
      'PUBLISHING',
      pub.id,
      currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
      targetStatus,
      validActor.name,
      `Retry publishing on ${platform.toUpperCase()}: transitioned from ${currentPlatformData.status || 'NOT_STARTED'} to ${targetStatus} (retry #${newRetryCount})${options?.remarks ? ` — ${options.remarks}` : ''}`
    );

    // 12. Record in AUDIT_LOG worksheet
    await auditService.log(
      validActor.id,
      validActor.name,
      'RETRY_PUBLISHING',
      'PUBLISHING',
      pub.id,
      {
        videoId,
        platform,
        previousStatus: currentPlatformData.status || SocialPublishStatus.NOT_STARTED,
        newStatus: targetStatus,
        retryCount: newRetryCount,
        scheduledAt: targetStatus === SocialPublishStatus.SCHEDULED ? normalizedUtc : undefined,
        remarks: options?.remarks,
      }
    );

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

    // Validate that ALL configured target platforms are published (Invariant: completedPlatformsCount === totalPlatformsCount)
    const totalConfigured = pub.totalPlatformsCount || 3;
    const isAllPublished =
      pub.youtube?.status === SocialPublishStatus.PUBLISHED &&
      pub.instagram?.status === SocialPublishStatus.PUBLISHED &&
      pub.facebook?.status === SocialPublishStatus.PUBLISHED;

    if (pub.completedPlatformsCount < totalConfigured || !isAllPublished) {
      throw new ValidationError(
        `Cannot finalize publishing for video "${videoId}": All configured target platforms must be PUBLISHED (${pub.completedPlatformsCount}/${totalConfigured} published).`
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

  /**
   * Phase 13.3: Platform Package Copier
   * Retrieves a deterministic, read-only platform package projection derived
   * from the authoritative approved Social Review data for external manual distribution.
   */
  public async getPlatformPackage(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    actor?: { id: string; name?: string; role?: UserRole | string }
  ): Promise<PlatformPackageProjection> {
    // 1. Authorization Enforcement
    this.assertPublishAuthorization(actor);

    // 2. Platform Validation (Strict exact lowercase matching: youtube, instagram, facebook)
    const normalizedPlatform = String(platform || '').trim();
    if (!['youtube', 'instagram', 'facebook'].includes(normalizedPlatform)) {
      throw new ValidationError(
        `Invalid publishing platform "${platform}". Must be exact lowercase: youtube, instagram, or facebook.`
      );
    }

    // 3. Video Existence Check
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`);
    }

    // 4. Gate D Prerequisite Enforcement
    const readiness = await this.validatePublishReadiness(videoId, actor ? { actor: { id: actor.id, name: actor.name || 'Publishing Manager', role: actor.role as any } } : undefined);
    if (!readiness.isReady) {
      throw new ValidationError(
        `Cannot retrieve publishing package for video "${videoId}": Gate D publishing readiness criteria failed. Blockers: ${readiness.blockers.join('; ')}`
      );
    }

    // 5. Retrieve Authoritative Social Review Package
    const bundle = await SocialReviewService.getReviewPackageBundle(video.questionId);

    // 6. Double Check Gate D Social Review Approval & Version Freshness
    if (bundle.currentReviewStatus !== SocialReviewStatus.APPROVED) {
      throw new ValidationError(
        `Cannot retrieve package: Social review status for question "${video.questionId}" is "${bundle.currentReviewStatus}" (must be APPROVED).`
      );
    }

    if (bundle.latestReviewRecord?.reviewedVersionHash !== bundle.currentVersionHash) {
      throw new ValidationError(
        `Cannot retrieve package: Approved social review for question "${video.questionId}" is STALE (content fingerprint changed since approval).`
      );
    }

    // 7. Check Pinned Comment Record
    const pinnedCommentRecord = await pinnedCommentsRepository.findByVideoId(videoId);

    // 8. Extract Variant & Canonical Metadata
    const variant = bundle.multiPlatformAdaptations?.variants?.[normalizedPlatform as 'youtube' | 'instagram' | 'facebook'];
    const canonicalMeta = bundle.canonicalMetadata;

    const caption = variant?.caption || canonicalMeta?.socialCaption || canonicalMeta?.extendedDescription || '';
    const hashtags = (variant?.hashtags && variant.hashtags.length > 0)
      ? variant.hashtags
      : (canonicalMeta?.hashtags || []);
    const cta = canonicalMeta?.cta?.primaryText || canonicalMeta?.cta?.pinnedCommentPrompt || '';
    const pinnedComment = variant?.pinnedComment || pinnedCommentRecord?.commentText || canonicalMeta?.cta?.pinnedCommentPrompt || '';
    const finalRenderAssetPath = video.finalRenderPath || video.driveFolderUrl || null;

    const basePackage = {
      platform: normalizedPlatform as PlatformType,
      videoId: video.id,
      videoTitle: video.title,
      questionId: video.questionId,
      contentMasterId: video.contentMasterId || bundle.question.contentMasterId,
      caption,
      hashtags,
      cta,
      pinnedComment,
      finalRenderAssetPath,
      isApprovedPackage: true,
      versionHash: bundle.currentVersionHash,
      reviewedAt: bundle.latestReviewRecord?.reviewedAt,
      reviewedBy: bundle.latestReviewRecord?.reviewerName || bundle.latestReviewRecord?.reviewerId,
    };

    if (normalizedPlatform === 'youtube') {
      return {
        ...basePackage,
        title: variant?.title || canonicalMeta?.shortTitle || video.title,
        tags: canonicalMeta?.keywords && canonicalMeta.keywords.length > 0 ? canonicalMeta.keywords : hashtags,
      };
    }

    return basePackage;
  }

  /**
   * Phase 13.4: Publishing Assignments
   * Creates an authorized publishing assignment for a Gate D ready video.
   * Reuses existing assignments repository and maintains complete separation from
   * VideoProductionStatus and SocialPublishStatus.
   */
  public async createPublishingAssignment(
    videoId: string,
    input: CreatePublishingAssignmentInput,
    actor: { id: string; name?: string; role?: string }
  ): Promise<Assignment> {
    // 1. Actor Authorization
    const actorRole = String(actor?.role || '').toUpperCase();
    const authorizedRoles = [
      UserRole.ADMIN.toUpperCase(),
      UserRole.CONTENT_MANAGER.toUpperCase(),
      UserRole.PUBLISHING_MANAGER.toUpperCase(),
    ];
    if (!actor || !actor.id || !authorizedRoles.includes(actorRole)) {
      throw new AuthorizationError(
        `User "${actor?.name || actor?.id || 'Unknown'}" with role "${actor?.role || 'UNSPECIFIED'}" is not authorized to create publishing assignments. Required role: ADMIN, CONTENT_MANAGER, or PUBLISHING_MANAGER.`
      );
    }

    // 2. Video Existence
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`);
    }

    // 3. Exact Lowercase Platform Validation (if platform-scoped)
    if (input.platform !== undefined && input.platform !== null && input.platform !== '') {
      const allowedPlatforms = ['youtube', 'instagram', 'facebook'];
      if (!allowedPlatforms.includes(input.platform)) {
        throw new ValidationError(
          `Invalid publishing platform "${input.platform}". Platform must be one of exact lowercase: youtube, instagram, facebook.`
        );
      }
    }
    const validatedPlatform = (input.platform && ['youtube', 'instagram', 'facebook'].includes(input.platform))
      ? (input.platform as 'youtube' | 'instagram' | 'facebook')
      : undefined;

    // 4. Gate D Publish Readiness Enforcement
    const readiness = await this.validatePublishReadiness(videoId, {
      actor: { id: actor.id, name: actor.name || actor.id, role: actor.role },
      skipAudit: false,
    });
    if (!readiness.isReady) {
      const err = new ValidationError(
        `Cannot create publishing assignment: Video "${videoId}" failed Gate D publish readiness. Blockers: ${readiness.blockers.join('; ')}`
      );
      (err as any).blockers = readiness.blockers;
      (err as any).details = { blockers: readiness.blockers };
      throw err;
    }

    // 5. Assignee Worker Validation
    const assigneeId = input.assigneeId;
    if (!assigneeId || typeof assigneeId !== 'string' || !assigneeId.trim()) {
      throw new ValidationError('Assignee ID (assigneeId) is required to create a publishing assignment.');
    }
    const assignee = await usersRepository.findById(assigneeId.trim());
    if (!assignee) {
      throw new ValidationError(`Assignee user "${assigneeId}" was not found in users directory.`);
    }
    if (assignee.isActive === false) {
      throw new ValidationError(`Cannot assign publishing work to inactive user "${assignee.name}" (${assignee.id}).`);
    }

    const assigneeRole = String(assignee.role || '').toUpperCase();
    const allowedWorkerRoles = [
      UserRole.ADMIN.toUpperCase(),
      UserRole.CONTENT_MANAGER.toUpperCase(),
      UserRole.PUBLISHING_MANAGER.toUpperCase(),
    ];
    if (!allowedWorkerRoles.includes(assigneeRole)) {
      throw new ValidationError(
        `Assignee user "${assignee.name}" (${assignee.id}) has role "${assignee.role}". Only users with role ADMIN, CONTENT_MANAGER, or PUBLISHING_MANAGER can be assigned publishing tasks.`
      );
    }

    // 6. Ensure Canonical Publishing Record Exists and Resolve publishing.id
    const pub = await this.getPublishingByVideoId(videoId);
    if (!pub) {
      throw new Error(`Publishing record for video "${videoId}" could not be loaded or initialized.`);
    }

    // 7. Duplicate Active Assignment Check by ('PUBLISHING', pub.id)
    const activeAssignments = await assignmentsRepository.findActiveByEntity('PUBLISHING', pub.id);
    const duplicate = activeAssignments.find((a) => {
      if (validatedPlatform) {
        return a.platform === validatedPlatform || (a.notes && a.notes.includes(`[Platform: ${validatedPlatform}]`));
      } else {
        return !a.platform && !(a.notes && a.notes.startsWith('[Platform:'));
      }
    });
    if (duplicate) {
      throw new ValidationError(
        `An active publishing assignment already exists for video "${videoId}"${validatedPlatform ? ` on platform "${validatedPlatform}"` : ''} (Assignment ID: ${duplicate.id}, Assignee: ${duplicate.assigneeName}).`
      );
    }

    // 8. Allocate Sequence ID & Construct Record
    const id = await idService.allocateAssignmentId();
    const now = new Date().toISOString();
    const dueDate = input.dueDate || input.dueAt || undefined;
    const cleanNotes = (input.notes || '').trim();
    const formattedNotes = validatedPlatform
      ? `[Platform: ${validatedPlatform}] ${cleanNotes}`.trim()
      : cleanNotes;

    const assignment: Assignment = {
      id,
      entityType: AssignmentEntityType.PUBLISHING,
      entityId: pub.id,
      videoId,
      taskType: AssignmentTaskType.PUBLISHING,
      assignmentRole: AssignmentRole.PUBLISHING_MANAGER,
      platform: validatedPlatform,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      status: AssignmentStatus.ASSIGNED,
      priority: input.priority || video.priority || PriorityLevel.NORMAL,
      assignedAt: now,
      dueDate,
      dueAt: dueDate,
      notes: formattedNotes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const created = await assignmentsRepository.appendRecord(assignment);

    // 9. Audit Log & Workflow Record
    await auditLogRepository.logAction(
      actor.id,
      actor.name || actor.id,
      'PUBLISHING_ASSIGNMENT_CREATED',
      'ASSIGNMENT',
      id,
      {
        videoId,
        publishingId: pub.id,
        entityType: 'PUBLISHING',
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        platform: validatedPlatform || null,
        priority: assignment.priority,
        dueDate,
      }
    );

    await workflowService.recordTransition(
      'PUBLISHING' as any,
      pub.id,
      'UNASSIGNED',
      'ASSIGNED',
      actor.id,
      actor.name || actor.id,
      `Created publishing assignment ${id} for publishing "${pub.id}" (video: "${videoId}")${validatedPlatform ? ` on platform "${validatedPlatform}"` : ''} assigned to ${assignee.name} (${assignee.role})`
    );

    return created;
  }

  /**
   * Retrieves publishing assignments for a specific video.
   */
  public async getPublishingAssignments(videoId: string): Promise<Assignment[]> {
    if (!videoId) return [];
    return await assignmentsRepository.findByEntity('PUBLISHING', videoId);
  }
}

export const publishingService = PublishingService.getInstance();

