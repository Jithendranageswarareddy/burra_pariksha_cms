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

import crypto from 'crypto';
import { publishingRepository } from '../repositories/publishing.repository';
import { socialReviewsRepository } from '../repositories/social-reviews.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { videosRepository } from '../repositories/videos.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { thumbnailsRepository } from '../repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../repositories/pinned-comments.repository';
import { pinnedCommentPackagesRepository } from '../repositories/pinned-comment-packages.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { assignmentsRepository } from '../repositories/assignments.repository';
import { usersRepository } from '../repositories/users.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { videoService } from './video.service';
import { idService } from './id.service';
import { platformAdaptationService } from './platform-adaptation.service';
import { analyticsService } from './analytics.service';
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
  PublisherPackage,
  PublishingReadinessEvaluation,
  PublishingBlockerCode,
  PublishingPlatformRecord,
  PublishingPlatformStatus,
  PublisherPackageSearchFilters,
  MarkManuallyPublishedInput,
  MarkPublishingFailedInput,
  WorkflowActor,
} from '../../types';
import { SocialReviewService } from './social-review.service';
import { ProductionAssetValidationService } from './production-asset-validation.service';
import { ObjectAuthorizationService } from './object-auth.service';
import { sanitizeSpreadsheetCellValue } from '../google-sheets/helpers';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
  NotFoundError,
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
    } else if (!video.driveFileId || !video.driveFileId.trim()) {
      blockers.push(`Video "${videoId}" lacks a valid Google Drive file association (driveFileId is missing or empty).`);
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
    } else if (thumbnail.contentId && video.contentId && thumbnail.contentId !== video.contentId) {
      blockers.push(`Cross-content protection: Thumbnail Content ID "${thumbnail.contentId}" does not match Video Content ID "${video.contentId}".`);
    }

    // 3. Pinned Comment Check
    const pinnedComment = await pinnedCommentsRepository.findByVideoId(videoId);
    const isPinnedCommentApproved = Boolean(pinnedComment?.isApproved);
    if (!pinnedComment) {
      blockers.push(`Pinned comment for video "${videoId}" is missing.`);
    } else if (!isPinnedCommentApproved) {
      blockers.push(`Pinned comment for video "${videoId}" is not approved.`);
    } else if (pinnedComment.contentId && video.contentId && pinnedComment.contentId !== video.contentId) {
      blockers.push(`Cross-content protection: Pinned Comment Content ID "${pinnedComment.contentId}" does not match Video Content ID "${video.contentId}".`);
    }

    // 4. Script Check
    const script = await scriptsRepository.findByVideoId(videoId);
    let isScriptReady = false;
    if (!script) {
      blockers.push(`Script record for video "${videoId}" is missing.`);
    } else {
      const isScriptContentReady = Boolean(
        script.hookText?.trim() &&
        script.problemStatement?.trim() &&
        script.stepByStepSolution?.trim()
      );
      if (!isScriptContentReady) {
        blockers.push(`Script for video "${videoId}" is incomplete or unready.`);
      } else if (script.contentId && video.contentId && script.contentId !== video.contentId) {
        blockers.push(`Cross-content protection: Script Content ID "${script.contentId}" does not match Video Content ID "${video.contentId}".`);
      } else {
        isScriptReady = true;
      }
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
          } else if (bundle.latestReviewRecord?.reviewedVersionHash !== bundle.currentVersionHash) {
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

    // 10. Automatically initialize baseline analytics tracking record idempotently
    try {
      const existingSnaps = await analyticsService.queryAnalytics({
        videoId: videoId,
        platform: platform,
      });
      if (existingSnaps.length === 0) {
        const video = await videosRepository.findById(videoId);
        const question = video?.questionId ? await questionsRepository.findById(video.questionId) : null;
        await analyticsService.recordAnalyticsSnapshot({
          contentId: pub.contentId || pub.contentMasterId || (video?.contentId || ''),
          videoId: videoId,
          publishingId: pub.id,
          platform: platform,
          platformPostId: cleanUrl,
          postingTimestamp: now,
          views: 0,
          watchTime: 0,
          retentionRate: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          subscribersGained: 0,
          ctr: 0,
          topicId: question?.topicId || '',
          subtopicId: question?.subtopicId || '',
          difficulty: question?.difficulty || '',
          language: question?.language || '',
        }, validActor.id, validActor.name);
      }
    } catch (anlErr) {
      console.error('Failed to automatically initialize baseline analytics tracking:', anlErr);
    }

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

  /**
   * Helper to compute SHA-256 hash string
   */
  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Normalizes platform string input to standard PlatformType enum
   */
  public normalizePlatform(platformInput: string | PlatformType): PlatformType {
    const norm = String(platformInput).toUpperCase().trim();
    if (norm === 'YOUTUBE') return PlatformType.YOUTUBE;
    if (norm === 'INSTAGRAM') return PlatformType.INSTAGRAM;
    if (norm === 'FACEBOOK') return PlatformType.FACEBOOK;
    throw new ValidationError(
      `Unsupported platform: "${platformInput}". Allowed platforms: YOUTUBE, INSTAGRAM, FACEBOOK`
    );
  }

  /**
   * Evaluates publishing readiness for a specific Content ID and Platform.
   */
  public async evaluateReadiness(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<PublishingReadinessEvaluation> {
    const blockers: PublishingBlockerCode[] = [];
    const evaluatedAt = new Date().toISOString();

    // 1. Valid Content ID Format
    if (!contentId || !/^BP-CNT-\d{6}$/.test(contentId)) {
      blockers.push('INVALID_CONTENT_ID_FORMAT');
      return {
        contentId,
        platform: PlatformType.YOUTUBE,
        isReadyToPublish: false,
        blockers,
        evaluatedAt,
        checks: {
          canonicalContentExists: false,
          socialReviewApproved: false,
          platformAdaptationApproved: false,
          adaptationNotStale: false,
          canonicalHashMatches: false,
          finalVideoValidAndAccessible: false,
          thumbnailValidAndAccessible: false,
          requiredTitlePresent: false,
          requiredDescriptionPresent: false,
          requiredHashtagsPresent: false,
          requiredCtaPresent: false,
          pinnedCommentApprovedIfSupported: false,
          captionsAvailable: false,
          noUnresolvedProductionBlockers: false,
        },
      };
    }

    let platform: PlatformType;
    try {
      platform = this.normalizePlatform(platformInput);
    } catch {
      blockers.push('PLATFORM_ADAPTATION_MISSING');
      return {
        contentId,
        platform: PlatformType.YOUTUBE,
        isReadyToPublish: false,
        blockers,
        evaluatedAt,
        checks: {
          canonicalContentExists: false,
          socialReviewApproved: false,
          platformAdaptationApproved: false,
          adaptationNotStale: false,
          canonicalHashMatches: false,
          finalVideoValidAndAccessible: false,
          thumbnailValidAndAccessible: false,
          requiredTitlePresent: false,
          requiredDescriptionPresent: false,
          requiredHashtagsPresent: false,
          requiredCtaPresent: false,
          pinnedCommentApprovedIfSupported: false,
          captionsAvailable: false,
          noUnresolvedProductionBlockers: false,
        },
      };
    }

    // 2. Canonical Content Master exists
    const master = await contentMastersRepository.findById(contentId);
    const canonicalContentExists = !!master;
    if (!canonicalContentExists) {
      blockers.push('CANONICAL_CONTENT_NOT_FOUND');
    }

    // 3. Phase 20 Social Review PASS / APPROVED
    const socialReview = await socialReviewsRepository.getLatestSocialReviewByContentId(contentId);
    const socialReviewApproved = !!(
      socialReview &&
      ((socialReview.status as string) === 'PASS' || (socialReview.status as string) === 'APPROVED') &&
      !socialReview.isInvalidated
    );
    if (!socialReviewApproved) {
      blockers.push('SOCIAL_REVIEW_NOT_APPROVED');
    }

    // 4. Platform Adaptation exists & 5. Adaptation is APPROVED
    const adaptation = await platformAdaptationService.getAdaptationByContentIdAndPlatform(
      contentId,
      platform
    );
    const adaptationExists = !!adaptation;
    const platformAdaptationApproved = !!(adaptation && adaptation.status === 'APPROVED');
    if (!adaptationExists) {
      blockers.push('PLATFORM_ADAPTATION_MISSING');
    } else if (!platformAdaptationApproved) {
      blockers.push('PLATFORM_ADAPTATION_NOT_APPROVED');
    }

    // 6. Adaptation is not stale & 7. Source hash matches current canonical package
    let adaptationNotStale = true;
    let canonicalHashMatches = true;

    if (adaptation) {
      const staleness = await platformAdaptationService.checkStaleness(adaptation.id);
      if (staleness.isStale) {
        adaptationNotStale = false;
        canonicalHashMatches = false;
        blockers.push('PLATFORM_ADAPTATION_STALE');
        blockers.push('CANONICAL_HASH_MISMATCH');
      } else {
        const liveLock = await platformAdaptationService.getCanonicalSourceLock(contentId);
        if (
          liveLock.packageOverallHash !== adaptation.canonicalSourceVersionLock.packageOverallHash
        ) {
          canonicalHashMatches = false;
          blockers.push('CANONICAL_HASH_MISMATCH');
        }
      }
    } else {
      adaptationNotStale = false;
      canonicalHashMatches = false;
    }

    // 8. Final Video exists and valid & 9. Accessible
    let finalVideoValidAndAccessible = false;
    const allVideos = await videosRepository.findAll();
    let videoRecord = allVideos.find((v) => (v as any).contentId === contentId || ((master as any)?.questionId && v.questionId === (master as any).questionId)) || null;

    if (!videoRecord) {
      blockers.push('FINAL_VIDEO_MISSING');
    } else {
      const validStatuses = ['READY_TO_UPLOAD', 'READY', 'RENDERED', 'VERIFIED', 'PROCESSED'];
      const statusValid = validStatuses.includes(((videoRecord as any).productionStatus || videoRecord.status) as string);
      const isAccessible = !!(
        videoRecord.finalRenderPath ||
        videoRecord.driveFileId ||
        (videoRecord as any).renderUrl
      );

      if (!statusValid) {
        blockers.push('UNRESOLVED_PRODUCTION_BLOCKER');
      }
      if (!isAccessible) {
        blockers.push('FINAL_VIDEO_NOT_ACCESSIBLE');
      }
      if (statusValid && isAccessible) {
        finalVideoValidAndAccessible = true;
      }
    }

    // 10. Approved Thumbnail exists & 11. Accessible
    let thumbnailValidAndAccessible = false;
    const allThumbnails = await thumbnailsRepository.findAll();
    let thumbRecord = allThumbnails.find((t) => (t as any).contentId === contentId || ((master as any)?.questionId && (t as any).questionId === (master as any).questionId)) || null;

    if (!thumbRecord) {
      blockers.push('THUMBNAIL_MISSING');
    } else {
      const isApproved = thumbRecord.status === 'APPROVED' || !!(thumbRecord as any).selectedCandidateId;
      const isAccessible = !!(
        thumbRecord.driveFileId ||
        (thumbRecord as any).selectedCandidateId ||
        (thumbRecord as any).driveViewLink
      );

      if (!isApproved) {
        blockers.push('THUMBNAIL_NOT_APPROVED');
      }
      if (!isAccessible) {
        blockers.push('THUMBNAIL_NOT_ACCESSIBLE');
      }
      if (isApproved && isAccessible) {
        thumbnailValidAndAccessible = true;
      }
    }

    // 12. Required Title, 13. Required Description/Caption, 14. Hashtags, 15. CTA
    let requiredTitlePresent = false;
    let requiredDescriptionPresent = false;
    let requiredHashtagsPresent = false;
    let requiredCtaPresent = false;

    if (adaptation) {
      if (platform === PlatformType.YOUTUBE) {
        requiredTitlePresent = !!(adaptation.title && adaptation.title.trim().length > 0);
        requiredDescriptionPresent = !!(
          adaptation.description && adaptation.description.trim().length > 0
        );
      } else if (platform === PlatformType.INSTAGRAM) {
        requiredTitlePresent = true; // IG uses caption as primary text
        requiredDescriptionPresent = !!(adaptation.caption && adaptation.caption.trim().length > 0);
      } else if (platform === PlatformType.FACEBOOK) {
        requiredTitlePresent = !!(
          (adaptation.title && adaptation.title.trim().length > 0) ||
          (adaptation.caption && adaptation.caption.trim().length > 0)
        );
        requiredDescriptionPresent = !!(
          (adaptation.description && adaptation.description.trim().length > 0) ||
          (adaptation.caption && adaptation.caption.trim().length > 0)
        );
      }

      requiredHashtagsPresent = !!(adaptation.hashtags && adaptation.hashtags.length > 0);
      requiredCtaPresent = !!(adaptation.callToAction && adaptation.callToAction.trim().length > 0);

      if (!requiredTitlePresent) blockers.push('REQUIRED_TITLE_MISSING');
      if (!requiredDescriptionPresent) blockers.push('REQUIRED_DESCRIPTION_MISSING');
      if (!requiredHashtagsPresent) blockers.push('REQUIRED_HASHTAGS_MISSING');
      if (!requiredCtaPresent) blockers.push('REQUIRED_CTA_MISSING');
    }

    // 16. Pinned Comment exists & approved where platform supports (YouTube)
    let pinnedCommentApprovedIfSupported = true;
    if (platform === PlatformType.YOUTUBE) {
      const pinnedPkg = await pinnedCommentPackagesRepository.findByContentId(contentId);
      if (pinnedPkg) {
        if (pinnedPkg.status !== 'APPROVED') {
          pinnedCommentApprovedIfSupported = false;
          blockers.push('PINNED_COMMENT_NOT_APPROVED');
        }
      }
    }

    // 17. Captions available
    let captionsAvailable = false;
    const script = (master as any)?.questionId ? await scriptsRepository.findByQuestionId((master as any).questionId) : null;
    if (script && ((script as any).scriptSolutionText || (script as any).scriptText || (script as any).solutionText || (script as any).solution)) {
      captionsAvailable = true;
    } else if (adaptation && (adaptation.caption || adaptation.description)) {
      captionsAvailable = true;
    } else {
      blockers.push('CAPTIONS_MISSING');
    }

    // 20. No unresolved production blocker
    const noUnresolvedProductionBlockers = !blockers.includes('UNRESOLVED_PRODUCTION_BLOCKER');

    // Deduplicate blockers list
    const uniqueBlockers = Array.from(new Set(blockers));
    const isReadyToPublish = uniqueBlockers.length === 0;

    return {
      contentId,
      platform,
      isReadyToPublish,
      blockers: uniqueBlockers,
      evaluatedAt,
      checks: {
        canonicalContentExists,
        socialReviewApproved,
        platformAdaptationApproved,
        adaptationNotStale,
        canonicalHashMatches,
        finalVideoValidAndAccessible,
        thumbnailValidAndAccessible,
        requiredTitlePresent,
        requiredDescriptionPresent,
        requiredHashtagsPresent,
        requiredCtaPresent,
        pinnedCommentApprovedIfSupported,
        captionsAvailable,
        noUnresolvedProductionBlockers,
      },
    };
  }

  /**
   * Retrieves full aggregated Publisher Package for manual publishing
   */
  public async getPublisherPackage(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<PublisherPackage> {
    const platform = this.normalizePlatform(platformInput);
    const readiness = await this.evaluateReadiness(contentId, platform);

    const master = await contentMastersRepository.findById(contentId);
    if (!master) {
      throw new NotFoundError(`Canonical Content Master with ID "${contentId}" does not exist.`);
    }

    const question = await questionsRepository.findById((master as any).questionId || master.id);
    const allScripts = await scriptsRepository.findAll();
    const script = allScripts.find((s) => s.questionId === (master as any).questionId || (s as any).contentId === contentId) || null;

    const allVideos = await videosRepository.findAll();
    let video = allVideos.find((v) => (v as any).contentId === contentId || v.questionId === (master as any).questionId) || null;

    const allThumbnails = await thumbnailsRepository.findAll();
    let thumbnail = allThumbnails.find((t) => (t as any).contentId === contentId || (t as any).questionId === (master as any).questionId) || null;

    const allPinned = await pinnedCommentPackagesRepository.findAll();
    const pinnedPkg = allPinned.find((p) => (p as any).contentId === contentId || (p as any).questionId === (master as any).questionId) || null;

    const adaptation = await platformAdaptationService.getAdaptationByContentIdAndPlatform(
      contentId,
      platform
    );
    const socialReview = await socialReviewsRepository.getLatestSocialReviewByContentId(contentId);
    const publishingRecord = await publishingRepository.findPublishingPlatformByContentIdAndPlatform(
      contentId,
      platform
    );

    const adaptationId = adaptation?.id || 'ADP-UNASSIGNED';
    const adaptationVersion = adaptation?.currentVersion || 1;
    const canonicalSourceHash =
      adaptation?.canonicalSourceVersionLock?.packageOverallHash ||
      this.hashString(`${contentId}_canonical_v1`);

    const adaptationHash = this.hashString(
      JSON.stringify({
        title: adaptation?.title || '',
        description: adaptation?.description || '',
        caption: adaptation?.caption || '',
        hashtags: adaptation?.hashtags || [],
        version: adaptationVersion,
      })
    );

    const finalVideoAsset = video
      ? {
          videoId: video.id,
          productionStatus: ((video as any).productionStatus || video.status) as VideoProductionStatus,
          finalRenderPath: video.finalRenderPath || (video as any).renderUrl || null,
          driveFileId: video.driveFileId,
          width: (video as any).width || 1080,
          height: (video as any).height || 1920,
          durationSeconds: (video as any).durationSeconds || 45,
          isAccessible: !!(video.finalRenderPath || video.driveFileId || (video as any).renderUrl),
        }
      : null;

    const thumbnailAsset = thumbnail
      ? {
          thumbnailId: thumbnail.id,
          version: (thumbnail as any).version || 1,
          driveFileId: thumbnail.driveFileId,
          candidateId: (thumbnail as any).selectedCandidateId,
          aspectRatio: (thumbnail as any).aspectRatio || '9:16',
          isAccessible: !!(thumbnail.driveFileId || (thumbnail as any).selectedCandidateId),
        }
      : null;

    return {
      contentId,
      platform,
      readiness: {
        isReadyToPublish: readiness.isReadyToPublish,
        blockers: readiness.blockers,
        evaluatedAt: readiness.evaluatedAt,
      },
      assets: {
        finalVideo: finalVideoAsset,
        thumbnail: thumbnailAsset,
      },
      text: {
        title: adaptation?.title || question?.questionText || '',
        description: adaptation?.description || (script as any)?.scriptSolutionText || (script as any)?.solutionText || '',
        caption: adaptation?.caption || adaptation?.description || '',
        hashtags: adaptation?.hashtags || [],
        callToAction: adaptation?.callToAction || 'Subscribe to Burra Pariksha!',
        pinnedComment: (pinnedPkg as any)?.approvedText || (pinnedPkg as any)?.pinnedCommentText || null,
        captions: (script as any)?.scriptSolutionText || (script as any)?.solution || (script as any)?.solutionText || null,
      },
      source: {
        adaptationId,
        adaptationVersion,
        canonicalSourceHash,
        adaptationHash,
        questionId: (master as any).questionId || master.id,
        scriptId: script?.id || (master as any).scriptId || 'SCR-UNASSIGNED',
        scriptVersion: (script as any)?.version || 1,
        videoId: video?.id || (master as any).videoId || 'VID-UNASSIGNED',
        videoVersion: (video as any)?.version || 1,
        thumbnailId: thumbnail?.id || (master as any).thumbnailId || 'THM-UNASSIGNED',
        thumbnailVersion: (thumbnail as any)?.version || 1,
        pinnedCommentPackageId: pinnedPkg?.id,
        pinnedCommentVersion: (pinnedPkg as any)?.version || 1,
      },
      status: {
        adaptationStatus: (adaptation?.status || 'DRAFT') as any,
        socialReviewStatus: (socialReview?.status || 'REJECTED') as any,
        publishingReadiness: readiness.isReadyToPublish ? 'READY_TO_PUBLISH' : 'NOT_READY',
        publishingStatus:
          publishingRecord?.status || (readiness.isReadyToPublish ? 'READY_TO_PUBLISH' : 'NOT_READY'),
      },
    };
  }

  /**
   * Retrieves complete publisher package for all 3 supported platforms
   */
  public async getAllPublisherPackagesForContent(
    contentId: string
  ): Promise<Record<PlatformType, PublisherPackage>> {
    const yt = await this.getPublisherPackage(contentId, PlatformType.YOUTUBE);
    const ig = await this.getPublisherPackage(contentId, PlatformType.INSTAGRAM);
    const fb = await this.getPublisherPackage(contentId, PlatformType.FACEBOOK);

    return {
      [PlatformType.YOUTUBE]: yt,
      [PlatformType.INSTAGRAM]: ig,
      [PlatformType.FACEBOOK]: fb,
      youtube: yt,
      instagram: ig,
      facebook: fb,
    } as any;
  }

  /**
   * Searches/filters publisher packages across all content masters
   */
  public async searchPublisherPackages(
    filters: PublisherPackageSearchFilters
  ): Promise<PublisherPackage[]> {
    let masters = await contentMastersRepository.findAll();
    if (filters.contentId) {
      masters = masters.filter((m) => m.id === filters.contentId);
    }

    const targetPlatforms: PlatformType[] = filters.platform
      ? [this.normalizePlatform(filters.platform)]
      : [PlatformType.YOUTUBE, PlatformType.INSTAGRAM, PlatformType.FACEBOOK];

    const results: PublisherPackage[] = [];

    for (const master of masters) {
      for (const plat of targetPlatforms) {
        try {
          const pkg = await this.getPublisherPackage(master.id, plat);

          if (
            filters.readiness !== undefined &&
            typeof filters.readiness === 'boolean' &&
            pkg.readiness.isReadyToPublish !== filters.readiness
          ) {
            continue;
          }

          if (
            filters.publishingStatus &&
            pkg.status.publishingStatus !== filters.publishingStatus
          ) {
            continue;
          }

          if (
            filters.adaptationStatus &&
            pkg.status.adaptationStatus !== filters.adaptationStatus
          ) {
            continue;
          }

          results.push(pkg);
        } catch {
          // Skip missing or invalid records
        }
      }
    }

    return results;
  }

  /**
   * Verifies authorization for publishing operations (content/hub-level)
   */
  private verifyPublishingRole(actor: WorkflowActor, action: string): void {
    const allowed = [UserRole.ADMIN, UserRole.PUBLISHER, UserRole.REVIEWER, UserRole.PUBLISHING_MANAGER, UserRole.CONTENT_MANAGER];
    if (!allowed.includes(actor.role as UserRole)) {
      throw new AuthorizationError(
        `User "${actor.id}" with role "${actor.role}" is not authorized to perform publishing action "${action}". Required: ADMIN, PUBLISHER, or REVIEWER.`
      );
    }
  }

  /**
   * Marks a platform adaptation as MANUALLY_PUBLISHED with strict version/hash locking.
   */
  public async markManuallyPublished(
    input: MarkManuallyPublishedInput,
    actor: WorkflowActor
  ): Promise<PublishingPlatformRecord> {
    this.verifyPublishingRole(actor, 'MARK_MANUALLY_PUBLISHED');

    const platform = this.normalizePlatform(input.platform);
    const readiness = await this.evaluateReadiness(input.contentId, platform);

    if (!readiness.isReadyToPublish) {
      throw new ValidationError(
        `Cannot mark as published: publishing prerequisites not satisfied. Unresolved blockers: ${readiness.blockers.join(', ')}`
      );
    }

    const pkg = await this.getPublisherPackage(input.contentId, platform);

    // Idempotency check: check if record exists for contentId + platform + adaptationVersion
    let existingRecord = await publishingRepository.findPublishingPlatformByContentIdPlatformAndVersion(
      input.contentId,
      platform,
      pkg.source.adaptationVersion
    );

    if (!existingRecord) {
      existingRecord = await publishingRepository.findPublishingPlatformByContentIdAndPlatform(
        input.contentId,
        platform
      );
    }

    const now = new Date().toISOString();
    const publishedAt = input.publishedAt || now;
    const recordId = existingRecord ? existingRecord.id : publishingRepository.generateId();

    const record: PublishingPlatformRecord = {
      id: recordId,
      contentId: input.contentId,
      platform,
      platformAdaptationId: pkg.source.adaptationId,
      adaptationVersion: pkg.source.adaptationVersion,
      canonicalSourceHash: pkg.source.canonicalSourceHash,
      adaptationHash: pkg.source.adaptationHash,
      videoId: pkg.source.videoId,
      videoVersion: pkg.source.videoVersion,
      thumbnailId: pkg.source.thumbnailId,
      thumbnailVersion: pkg.source.thumbnailVersion,
      pinnedCommentPackageId: pkg.source.pinnedCommentPackageId,
      pinnedCommentVersion: pkg.source.pinnedCommentVersion,
      status: 'MANUALLY_PUBLISHED',
      publishedAt,
      publishedBy: actor.id,
      publishedByName: actor.name,
      publishedByRole: actor.role,
      externalUrl: input.externalUrl,
      platformPostId: input.platformPostId,
      publicationNotes: input.publicationNotes,
      retryCount: existingRecord ? existingRecord.retryCount : 0,
      createdAt: existingRecord ? existingRecord.createdAt : now,
      updatedAt: now,
    };

    const saved = await publishingRepository.savePublishingPlatformRecord(record);

    await auditService.log(
      actor.id,
      actor.name || 'User',
      'MANUAL_PUBLICATION_RECORDED',
      'PUBLISHING',
      saved.id,
      {
        contentId: input.contentId,
        platform,
        adaptationId: pkg.source.adaptationId,
        adaptationVersion: pkg.source.adaptationVersion,
        canonicalSourceHash: pkg.source.canonicalSourceHash,
        externalUrl: input.externalUrl,
        platformPostId: input.platformPostId,
      }
    );

    return saved;
  }

  /**
   * Records a manual publishing failure (content-level)
   */
  public async markContentPublishingFailed(
    input: MarkPublishingFailedInput,
    actor: WorkflowActor
  ): Promise<PublishingPlatformRecord> {
    this.verifyPublishingRole(actor, 'MARK_PUBLISHING_FAILED');
    const platform = this.normalizePlatform(input.platform);

    const pkg = await this.getPublisherPackage(input.contentId, platform);
    let existingRecord = await publishingRepository.findPublishingPlatformByContentIdAndPlatform(
      input.contentId,
      platform
    );

    const now = new Date().toISOString();
    const recordId = existingRecord ? existingRecord.id : publishingRepository.generateId();

    const record: PublishingPlatformRecord = {
      id: recordId,
      contentId: input.contentId,
      platform,
      platformAdaptationId: pkg.source.adaptationId,
      adaptationVersion: pkg.source.adaptationVersion,
      canonicalSourceHash: pkg.source.canonicalSourceHash,
      adaptationHash: pkg.source.adaptationHash,
      videoId: pkg.source.videoId,
      videoVersion: pkg.source.videoVersion,
      thumbnailId: pkg.source.thumbnailId,
      thumbnailVersion: pkg.source.thumbnailVersion,
      pinnedCommentPackageId: pkg.source.pinnedCommentPackageId,
      pinnedCommentVersion: pkg.source.pinnedCommentVersion,
      status: 'FAILED',
      failureReason: input.failureReason,
      failedAt: now,
      failedBy: actor.id,
      publicationNotes: input.notes,
      retryCount: existingRecord ? existingRecord.retryCount : 0,
      createdAt: existingRecord ? existingRecord.createdAt : now,
      updatedAt: now,
    };

    const saved = await publishingRepository.savePublishingPlatformRecord(record);

    await auditService.log(
      actor.id,
      actor.name || 'User',
      'PUBLISHING_FAILED_RECORDED',
      'PUBLISHING',
      saved.id,
      {
        contentId: input.contentId,
        platform,
        failureReason: input.failureReason,
        adaptationVersion: pkg.source.adaptationVersion,
      }
    );

    return saved;
  }

  /**
   * Retries publishing workflow after resolving blockers (content-level)
   */
  public async retryContentPublishing(
    contentId: string,
    platformInput: string | PlatformType,
    actor: WorkflowActor,
    notes?: string
  ): Promise<PublishingPlatformRecord> {
    this.verifyPublishingRole(actor, 'RETRY_PUBLISHING');
    const platform = this.normalizePlatform(platformInput);

    const readiness = await this.evaluateReadiness(contentId, platform);
    let existingRecord = await publishingRepository.findPublishingPlatformByContentIdAndPlatform(
      contentId,
      platform
    );

    if (!existingRecord) {
      throw new NotFoundError(
        `No publishing record found to retry for Content ID "${contentId}" and platform "${platform}".`
      );
    }

    const now = new Date().toISOString();

    existingRecord.retryCount += 1;
    existingRecord.lastRetriedAt = now;
    existingRecord.updatedAt = now;

    if (readiness.isReadyToPublish) {
      existingRecord.status = 'READY_TO_PUBLISH';
      existingRecord.failureReason = undefined;
    } else {
      existingRecord.status = 'FAILED';
      existingRecord.failureReason = `Retry attempt failed due to remaining blockers: ${readiness.blockers.join(', ')}`;
    }

    if (notes) {
      existingRecord.publicationNotes = existingRecord.publicationNotes
        ? `${existingRecord.publicationNotes} | Retry note: ${notes}`
        : `Retry note: ${notes}`;
    }

    const saved = await publishingRepository.savePublishingPlatformRecord(existingRecord);

    await auditService.log(
      actor.id,
      actor.name || 'User',
      'PUBLISHING_RETRY_INITIATED',
      'PUBLISHING',
      saved.id,
      {
        contentId,
        platform,
        newStatus: saved.status,
        retryCount: saved.retryCount,
        isReadyToPublish: readiness.isReadyToPublish,
        blockers: readiness.blockers,
      }
    );

    return saved;
  }

  /**
   * Retrieves publishing record by content ID and platform
   */
  public async getPublishingRecord(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<PublishingPlatformRecord | null> {
    const platform = this.normalizePlatform(platformInput);
    return publishingRepository.findPublishingPlatformByContentIdAndPlatform(contentId, platform);
  }
}

export const publishingService = PublishingService.getInstance();


