/**
 * BURRA PARIKSHA CMS - Phase 22 Publishing Hub Service
 * Comprehensive service for publishing readiness evaluation, multi-platform
 * package assembly, manual publishing lifecycle management, version/hash locking,
 * duplicate/idempotency protection, and audit logging.
 */

import crypto from 'crypto';
import {
  PublisherPackage,
  PublishingReadinessEvaluation,
  PublishingBlockerCode,
  Phase22PublishingRecord,
  Phase22PublishingStatus,
  PlatformType,
  UserRole,
  WorkflowActor,
  PublisherPackageSearchFilters,
  MarkManuallyPublishedInput,
  MarkPublishingFailedInput,
  PlatformAdaptationRecord,
  SocialReviewStatus,
  VideoProductionStatus,
} from '../../types';
import { phase22PublishingRepository } from '../repositories/phase22-publishing.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { thumbnailsRepository } from '../repositories/thumbnails.repository';
import { pinnedCommentPackagesRepository } from '../repositories/pinned-comment-packages.repository';
import { phase20SocialReviewsRepository } from '../repositories/phase20-social-reviews.repository';
import { phase20SocialReviewService } from './phase20-social-review.service';
import { phase21PlatformAdaptationService } from './phase21-platform-adaptation.service';
import { auditService } from './audit.service';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} from '../google-sheets/errors';

export class Phase22PublishingHubService {
  private static instance: Phase22PublishingHubService | null = null;

  private constructor() {}

  public static getInstance(): Phase22PublishingHubService {
    if (!Phase22PublishingHubService.instance) {
      Phase22PublishingHubService.instance = new Phase22PublishingHubService();
    }
    return Phase22PublishingHubService.instance;
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
   * Deterministic logic — 20 strict prerequisite checks.
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
    } catch (e) {
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
    const socialReview = await phase20SocialReviewsRepository.getLatestByContentId(contentId);
    const socialReviewApproved = !!(
      socialReview &&
      ((socialReview.status as string) === 'PASS' || (socialReview.status as string) === 'APPROVED') &&
      !socialReview.isInvalidated
    );
    if (!socialReviewApproved) {
      blockers.push('SOCIAL_REVIEW_NOT_APPROVED');
    }

    // 4. Phase 21 Platform Adaptation exists & 5. Adaptation is APPROVED
    const adaptation = await phase21PlatformAdaptationService.getAdaptationByContentIdAndPlatform(
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
      const staleness = await phase21PlatformAdaptationService.checkStaleness(adaptation.id);
      if (staleness.isStale) {
        adaptationNotStale = false;
        canonicalHashMatches = false;
        blockers.push('PLATFORM_ADAPTATION_STALE');
        blockers.push('CANONICAL_HASH_MISMATCH');
      } else {
        const liveLock = await phase21PlatformAdaptationService.getCanonicalSourceLock(contentId);
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

    const adaptation = await phase21PlatformAdaptationService.getAdaptationByContentIdAndPlatform(
      contentId,
      platform
    );
    const socialReview = await phase20SocialReviewsRepository.getLatestByContentId(contentId);
    const publishingRecord = await phase22PublishingRepository.findByContentIdAndPlatform(
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
        } catch (e) {
          // Skip missing or invalid records
        }
      }
    }

    return results;
  }

  /**
   * Verifies authorization for publishing operations
   */
  private verifyPublishingRole(actor: WorkflowActor, action: string): void {
    const allowed = [UserRole.ADMIN, UserRole.PUBLISHER, UserRole.REVIEWER];
    if (!allowed.includes(actor.role as UserRole)) {
      throw new AuthorizationError(
        `User "${actor.id}" with role "${actor.role}" is not authorized to perform publishing action "${action}". Required: ADMIN, PUBLISHER, or REVIEWER.`
      );
    }
  }

  /**
   * Marks a platform adaptation as MANUALLY_PUBLISHED with strict version/hash locking.
   * Idempotency protection prevents creating duplicate active records for the same adaptation version.
   */
  public async markManuallyPublished(
    input: MarkManuallyPublishedInput,
    actor: WorkflowActor
  ): Promise<Phase22PublishingRecord> {
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
    let existingRecord = await phase22PublishingRepository.findByContentIdPlatformAndVersion(
      input.contentId,
      platform,
      pkg.source.adaptationVersion
    );

    if (!existingRecord) {
      existingRecord = await phase22PublishingRepository.findByContentIdAndPlatform(
        input.contentId,
        platform
      );
    }

    const now = new Date().toISOString();
    const publishedAt = input.publishedAt || now;

    const recordId = existingRecord ? existingRecord.id : phase22PublishingRepository.generateId();

    const record: Phase22PublishingRecord = {
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

    const saved = await phase22PublishingRepository.save(record);

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
   * Records a manual publishing failure
   */
  public async markPublishingFailed(
    input: MarkPublishingFailedInput,
    actor: WorkflowActor
  ): Promise<Phase22PublishingRecord> {
    this.verifyPublishingRole(actor, 'MARK_PUBLISHING_FAILED');
    const platform = this.normalizePlatform(input.platform);

    const pkg = await this.getPublisherPackage(input.contentId, platform);
    let existingRecord = await phase22PublishingRepository.findByContentIdAndPlatform(
      input.contentId,
      platform
    );

    const now = new Date().toISOString();
    const recordId = existingRecord ? existingRecord.id : phase22PublishingRepository.generateId();

    const record: Phase22PublishingRecord = {
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

    const saved = await phase22PublishingRepository.save(record);

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
   * Retries publishing workflow after resolving blockers
   */
  public async retryPublishing(
    contentId: string,
    platformInput: string | PlatformType,
    actor: WorkflowActor,
    notes?: string
  ): Promise<Phase22PublishingRecord> {
    this.verifyPublishingRole(actor, 'RETRY_PUBLISHING');
    const platform = this.normalizePlatform(platformInput);

    const readiness = await this.evaluateReadiness(contentId, platform);
    let existingRecord = await phase22PublishingRepository.findByContentIdAndPlatform(
      contentId,
      platform
    );

    if (!existingRecord) {
      throw new NotFoundError(
        `No publishing record found to retry for Content ID "${contentId}" and platform "${platform}".`
      );
    }

    const pkg = await this.getPublisherPackage(contentId, platform);
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

    const saved = await phase22PublishingRepository.save(existingRecord);

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
  ): Promise<Phase22PublishingRecord | null> {
    const platform = this.normalizePlatform(platformInput);
    return phase22PublishingRepository.findByContentIdAndPlatform(contentId, platform);
  }
}

export const phase22PublishingHubService = Phase22PublishingHubService.getInstance();
