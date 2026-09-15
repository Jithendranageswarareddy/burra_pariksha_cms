/**
 * BURRA PARIKSHA CMS - Phase 21 Multi-Platform Content Adaptation Service
 * 
 * Goals:
 * ONE canonical Content ID
 * → YouTube adaptation
 * → Instagram adaptation
 * → Facebook adaptation
 * 
 * The canonical content remains completely unchanged and immutable.
 * 
 * Capabilities:
 * - Content ID Correlation & Verification (Must exist in canonical database)
 * - Source version & SHA-256 hash capture from Phase 20 package assembly
 * - Controlled platform enum: YOUTUBE, INSTAGRAM, FACEBOOK (Rejects unsupported)
 * - Strict Separation: Adapting or editing NEVER mutates Question, Script, Video, Thumbnail, Pinned Comment, or Content Master.
 * - Versioning: Every edit creates a new immutable version. Historical versions are preserved.
 * - Approval state machine: DRAFT -> IN_REVIEW -> APPROVED -> READY_TO_PUBLISH (with CHANGES_REQUIRED & REJECTED)
 * - Editing an APPROVED adaptation invalidates approval and creates a new version.
 * - Human approval mandatory; AI is purely advisory.
 * - AI failure fallback: deterministic template generation, with explicit provenance tracking.
 * - Stale canonical source detection: comparing locked package hash with live package hash.
 * - Comprehensive Audit Logging via existing auditService.
 * - Search and filtering capabilities.
 */

import crypto from 'crypto';
import {
  PlatformType,
  PlatformAdaptationStatus,
  AdaptationGenerationSource,
  PlatformAdaptationRecord,
  PlatformAdaptationVersion,
  PlatformAdaptationSearchFilters,
  CreatePlatformAdaptationInput,
  UpdatePlatformAdaptationInput,
  AiAdaptationRecommendation,
  WorkflowActor,
  UserRole,
  PlatformSpecificWording,
  PlatformThumbnailConsideration,
} from '../../types';
import { platformAdaptationsRepository } from '../repositories/platform-adaptations.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { phase20SocialReviewService } from './phase20-social-review.service';
import { phase24AIOrchestrator } from '../ai/phase24-orchestrator.service';
import { auditService } from './audit.service';
import { idService } from './id.service';
import {
  PlatformAdaptationValidator,
} from '../validators/platform-adaptation.validator';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} from '../google-sheets/errors';

export class Phase21PlatformAdaptationService {
  private static instance: Phase21PlatformAdaptationService | null = null;

  private constructor() {}

  public static getInstance(): Phase21PlatformAdaptationService {
    if (!Phase21PlatformAdaptationService.instance) {
      Phase21PlatformAdaptationService.instance = new Phase21PlatformAdaptationService();
    }
    return Phase21PlatformAdaptationService.instance;
  }

  /**
   * Helper to verify RBAC authorization.
   */
  private verifyRole(actor: WorkflowActor, allowedRoles: UserRole[], actionDesc: string): void {
    if (!actor || !actor.role) {
      throw new AuthorizationError(`Unauthorized: Actor missing for action: ${actionDesc}`);
    }
    if (!allowedRoles.includes(actor.role as UserRole)) {
      throw new AuthorizationError(
        `Role "${actor.role}" is not authorized to ${actionDesc}. Required: [${allowedRoles.join(', ')}]`
      );
    }
  }

  /**
   * Helper to fetch canonical source package version lock and verify canonical entity existence.
   */
  public async getCanonicalSourceLock(contentId: string) {
    PlatformAdaptationValidator.validateContentId(contentId);

    // Verify Content Master exists
    const contentMaster = await contentMastersRepository.findById(contentId);
    if (!contentMaster) {
      throw new NotFoundError(`Canonical Content Master with ID "${contentId}" does not exist.`);
    }

    // Assemble package to extract deterministic version lock
    const pkg = await phase20SocialReviewService.assemblePackage(contentId);

    return {
      contentId,
      questionId: pkg.versionLock.questionId,
      questionVersion: pkg.versionLock.questionVersion,
      scriptId: pkg.versionLock.scriptId,
      scriptVersion: pkg.versionLock.scriptVersion,
      videoId: pkg.versionLock.videoId,
      videoVersion: pkg.versionLock.videoVersion,
      thumbnailId: pkg.versionLock.thumbnailId,
      thumbnailVersion: pkg.versionLock.thumbnailVersion,
      pinnedCommentPackageId: pkg.versionLock.pinnedCommentPackageId,
      pinnedCommentVersion: pkg.versionLock.pinnedCommentVersion,
      packageOverallHash: pkg.versionLock.hashes.packageOverallHash,
      pkg,
    };
  }

  /**
   * Generates advisory AI recommendations for an adaptation.
   * If AI is unavailable or fails, returns deterministic fallback.
   */
  public async generateAiAdaptationRecommendation(
    contentId: string,
    rawPlatform: string,
    actor: WorkflowActor,
    options?: { forceFallback?: boolean }
  ): Promise<AiAdaptationRecommendation> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CREATOR, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'generate AI platform adaptation recommendations'
    );

    const platform = PlatformAdaptationValidator.validatePlatform(rawPlatform);
    const sourceLock = await this.getCanonicalSourceLock(contentId);
    const question = sourceLock.pkg.question;
    const script = sourceLock.pkg.script;
    const metadata = sourceLock.pkg.metadata || {};

    const baseTitle = metadata.shortTitle || question?.questionText || `Aptitude Challenge - ${contentId}`;
    const baseQuestionText = question?.questionText || '';

    // If forceFallback or Phase24 Orchestrator unconfigured, build deterministic fallback
    if (options?.forceFallback || !phase24AIOrchestrator.isConfigured()) {
      return this.buildDeterministicAdaptationRecommendation(platform, baseTitle, baseQuestionText, metadata);
    }

    try {
      const prompt = `You are a social media adaptation expert for Telugu & English educational micro-learning content (Burra Pariksha).
Given the following canonical quiz question and script, generate platform-tailored adaptation recommendations for ${platform}.

CANONICAL DATA:
- Content ID: ${contentId}
- Question: ${baseQuestionText}
- Topic: ${(metadata as any).topicName || 'Aptitude'}
- Short Title: ${baseTitle}
- Script Hook: ${script?.hookText || ''}
- Script Solution: ${script?.stepByStepSolution || ''}

Respond in pure JSON matching this exact structure:
{
  "titleVariations": ["string", "string"],
  "captionVariations": ["string", "string"],
  "description": "string",
  "hashtags": ["#BurraPariksha", "#TeluguEducation", "#AptitudeTricks"],
  "callToActionVariations": ["string", "string"],
  "platformSpecificWording": {
    "shortsOrReelsNote": "string",
    "toneStyle": "string",
    "audienceHookStyle": "string",
    "platformSpecificKeywords": ["keyword1", "keyword2"],
    "additionalPlatformNotes": "string"
  },
  "thumbnailConsiderations": {
    "aspectRatioRecommendation": "9:16",
    "safeZoneNotes": "string",
    "cropNotes": "string",
    "reelCoverNotes": "string",
    "hookTextRecommendation": "string"
  },
  "rationale": "string"
}`;

      const aiResponseResult = await phase24AIOrchestrator.executeTask({
        task: 'GENERATION',
        prompt,
        systemInstruction: 'You are a social media adaptation expert for Telugu & English educational content. Output pure JSON only.',
      });
      const rawText = aiResponseResult.status === 'SUCCESS' ? aiResponseResult.text : null;
      if (!rawText) {
        return this.buildDeterministicAdaptationRecommendation(platform, baseTitle, baseQuestionText, metadata);
      }
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(cleaned);
      if (!aiResponse || !aiResponse.titleVariations || !aiResponse.captionVariations) {
        throw new Error('Invalid AI recommendation format');
      }

      return {
        platform,
        titleVariations: aiResponse.titleVariations || [baseTitle],
        captionVariations: aiResponse.captionVariations || [baseQuestionText],
        description: aiResponse.description || '',
        hashtags: Array.isArray(aiResponse.hashtags) ? aiResponse.hashtags : ['#BurraPariksha', '#Telugu', '#Aptitude'],
        callToActionVariations: aiResponse.callToActionVariations || ['Comment your answer below!'],
        platformSpecificWording: aiResponse.platformSpecificWording || {
          shortsOrReelsNote: `${platform} micro-video format`,
          toneStyle: 'Engaging & educational',
        },
        thumbnailConsiderations: aiResponse.thumbnailConsiderations || {
          aspectRatioRecommendation: platform === PlatformType.YOUTUBE ? '9:16 (Shorts)' : '9:16',
          safeZoneNotes: 'Keep text centered',
        },
        confidence: 0.92,
        rationale: aiResponse.rationale || `Optimized for ${platform} engagement patterns`,
        generationSource: 'AI_GENERATED',
        modelUsed: 'gemini-2.5-flash',
      };
    } catch (err) {
      // Graceful fallback to deterministic recommendation
      return this.buildDeterministicAdaptationRecommendation(platform, baseTitle, baseQuestionText, metadata);
    }
  }

  /**
   * Deterministic recommendation builder (0 AI dependency).
   */
  private buildDeterministicAdaptationRecommendation(
    platform: PlatformType,
    baseTitle: string,
    questionText: string,
    metadata: Record<string, any>
  ): AiAdaptationRecommendation {
    let titleVariations: string[] = [];
    let captionVariations: string[] = [];
    let description = '';
    let hashtags: string[] = ['#BurraPariksha', '#Telugu', '#AptitudeChallenge'];
    let ctaVariations: string[] = [];
    let wording: PlatformSpecificWording = {};
    let thumbnailNotes: PlatformThumbnailConsideration = {};

    if (platform === PlatformType.YOUTUBE) {
      titleVariations = [
        `${baseTitle} | Quick Math Challenge #Shorts`,
        `Can you solve this in 30s? ${baseTitle} #BurraPariksha`,
      ];
      captionVariations = [
        `Solve this quiz question! Watch the complete step-by-step logic in this short. #BurraPariksha`,
      ];
      description = `🔥 Burra Pariksha Daily Challenge: ${baseTitle}\n\nQuestion: ${questionText}\n\n💡 Subscribe for daily Telugu educational brain teasers and competitive exam aptitude tricks!\n\n#BurraPariksha #Shorts #MathsTricks`;
      hashtags = ['#BurraPariksha', '#Shorts', '#TeluguMaths', '#AptitudeTricks'];
      ctaVariations = [
        'Subscribe for daily brain challenges!',
        'Drop your answer in the comments before the timer ends!',
      ];
      wording = {
        shortsOrReelsNote: 'Optimized for YouTube Shorts vertical 9:16 feed',
        toneStyle: 'High energy, fast-paced puzzle challenge',
        audienceHookStyle: 'Timer challenge',
      };
      thumbnailNotes = {
        aspectRatioRecommendation: '9:16',
        safeZoneNotes: 'Avoid lower 20% overlay area on YouTube mobile app',
        hookTextRecommendation: baseTitle.slice(0, 30),
      };
    } else if (platform === PlatformType.INSTAGRAM) {
      titleVariations = [
        `${baseTitle} ⚡ Brain Teaser`,
        `Swipe up or comment your answer! 🧠`,
      ];
      captionVariations = [
        `🧠 Can you crack this Telugu aptitude challenge?\n\n"${questionText}"\n\n👇 Comment A, B, C, or D!\nShare with your friend who loves puzzles!\n\n#BurraPariksha #InstagramReels #TeluguQuiz`,
      ];
      description = '';
      hashtags = ['#BurraPariksha', '#ReelsInstagram', '#TeluguReels', '#DailyQuiz', '#StudyGramTelugu'];
      ctaVariations = [
        'Tag a friend who can solve this!',
        'Drop your answer in the comments & save for later revision!',
      ];
      wording = {
        shortsOrReelsNote: 'Optimized for Instagram Reels feed & Explore page',
        toneStyle: 'Conversational, social, visual',
        audienceHookStyle: 'Challenge your friends',
      };
      thumbnailNotes = {
        aspectRatioRecommendation: '9:16 (Reel cover), 1:1 grid crop friendly',
        safeZoneNotes: 'Keep text inside central 1:1 square for profile grid preview',
        reelCoverNotes: 'Ensure hook is visible when displayed on 1:1 Instagram profile grid',
      };
    } else if (platform === PlatformType.FACEBOOK) {
      titleVariations = [
        `${baseTitle} - Test Your Knowledge`,
        `Burra Pariksha Daily Quiz: ${baseTitle}`,
      ];
      captionVariations = [
        `📘 Daily Brain Challenge for competitive exam aspirants:\n\n${questionText}\n\nWatch the full video to understand the solution trick! Like and share with fellow aspirants.`,
      ];
      description = `Burra Pariksha educational video series in Telugu. Topic: ${metadata.topicName || 'General Aptitude'}.`;
      hashtags = ['#BurraPariksha', '#FacebookReels', '#TeluguEducation', '#CompetitiveExams'];
      ctaVariations = [
        'Follow our page for daily aptitude practice!',
        'Share this video with your study group!',
      ];
      wording = {
        shortsOrReelsNote: 'Optimized for Facebook Watch / Reels community feeds',
        toneStyle: 'Educational, supportive community tone',
        audienceHookStyle: 'Aspirant knowledge check',
      };
      thumbnailNotes = {
        aspectRatioRecommendation: '9:16 or 1:1',
        safeZoneNotes: 'Ensure text contrast on lighter Facebook UI backgrounds',
      };
    }

    return {
      platform,
      titleVariations,
      captionVariations,
      description,
      hashtags,
      callToActionVariations: ctaVariations,
      platformSpecificWording: wording,
      thumbnailConsiderations: thumbnailNotes,
      confidence: 1.0,
      rationale: 'Deterministic high-fidelity adaptation template',
      generationSource: 'DETERMINISTIC_FALLBACK',
    };
  }

  /**
   * Creates a new Platform Adaptation linked to the canonical Content ID.
   * Guarantees canonical content remains strictly untouched.
   */
  public async createAdaptation(
    input: CreatePlatformAdaptationInput,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CREATOR, UserRole.TOPIC_LEAD],
      'create platform adaptation'
    );

    const platform = PlatformAdaptationValidator.validatePlatform(input.platform as string);
    PlatformAdaptationValidator.validateContentId(input.contentId);

    // Reject cross-content or self-referencing adaptations
    if (input.contentId.startsWith('BP-ADP-')) {
      throw new ValidationError('Adaptation references another adaptation ID. Must reference a canonical Content ID (BP-CNT-######).');
    }

    // Check if adaptation for this platform already exists for this Content ID
    const existing = await platformAdaptationsRepository.findByContentIdAndPlatform(input.contentId, platform);
    if (existing) {
      throw new ValidationError(
        `An adaptation for platform "${platform}" already exists on Content ID "${input.contentId}" (ID: ${existing.id}). Edit the existing adaptation to create a new version.`
      );
    }

    // Capture exact source lock from canonical package
    const sourceLock = await this.getCanonicalSourceLock(input.contentId);

    // Validate payload against platform rules
    const validation = PlatformAdaptationValidator.validateAdaptationPayload({
      platform,
      title: input.title,
      description: input.description,
      caption: input.caption,
      hashtags: input.hashtags,
      callToAction: input.callToAction,
      platformSpecificWording: input.platformSpecificWording,
      thumbnailConsiderations: input.thumbnailConsiderations,
      correctAnswer: sourceLock.pkg.question?.correctAnswer,
    });

    if (!validation.isValid) {
      throw new ValidationError(`Platform validation failed: ${validation.issues.join('; ')}`);
    }

    const adaptationId = await idService.allocatePlatformAdaptationId();
    const now = new Date().toISOString();

    const adaptationRecord: PlatformAdaptationRecord = {
      id: adaptationId,
      contentId: input.contentId,
      platform,
      title: (input.title || '').trim(),
      description: (input.description || '').trim(),
      caption: (input.caption || '').trim(),
      hashtags: input.hashtags || [],
      callToAction: (input.callToAction || '').trim(),
      platformSpecificWording: input.platformSpecificWording || {},
      thumbnailConsiderations: input.thumbnailConsiderations || {},
      status: PlatformAdaptationStatus.DRAFT,
      currentVersion: 1,
      canonicalSourceVersionLock: {
        contentId: sourceLock.contentId,
        questionId: sourceLock.questionId,
        questionVersion: sourceLock.questionVersion,
        scriptId: sourceLock.scriptId,
        scriptVersion: sourceLock.scriptVersion,
        videoId: sourceLock.videoId,
        videoVersion: sourceLock.videoVersion,
        thumbnailId: sourceLock.thumbnailId,
        thumbnailVersion: sourceLock.thumbnailVersion,
        pinnedCommentPackageId: sourceLock.pinnedCommentPackageId,
        pinnedCommentVersion: sourceLock.pinnedCommentVersion,
        packageOverallHash: sourceLock.packageOverallHash,
      },
      generationSource: input.generationSource || 'MANUAL',
      aiProvenance: input.generationSource && input.generationSource.startsWith('AI') ? {
        isAiGenerated: true,
        generatedAt: now,
      } : undefined,
      createdBy: actor.id,
      createdByName: actor.name,
      createdByRole: actor.role,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await platformAdaptationsRepository.create(adaptationRecord);

    // Log audit trail
    await platformAdaptationsRepository.logAudit({
      adaptationId: saved.id,
      contentId: saved.contentId,
      platform: saved.platform,
      action: 'CREATE',
      actorId: actor.id,
      actorName: actor.name || 'User',
      actorRole: actor.role,
      toVersion: 1,
      toStatus: saved.status,
      timestamp: now,
    });

    await auditService.log(
      actor.id,
      actor.name || 'User',
      'CREATE_PLATFORM_ADAPTATION',
      'PLATFORM_ADAPTATION',
      saved.id,
      { details: `Created adaptation for platform ${platform} on canonical content ${input.contentId}` }
    );

    return saved;
  }

  /**
   * Updates an existing Platform Adaptation.
   * Modifying an adaptation creates a NEW version and invalidates prior approvals.
   * Canonical content remains completely immutable.
   */
  public async updateAdaptation(
    adaptationId: string,
    updates: UpdatePlatformAdaptationInput,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CREATOR, UserRole.TOPIC_LEAD],
      'update platform adaptation'
    );

    const existing = await platformAdaptationsRepository.findById(adaptationId);
    if (!existing) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    // Capture latest live source lock to check staleness
    const liveLock = await this.getCanonicalSourceLock(existing.contentId);
    const isStale = liveLock.packageOverallHash !== existing.canonicalSourceVersionLock.packageOverallHash;

    const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const newDescription = updates.description !== undefined ? updates.description.trim() : existing.description;
    const newCaption = updates.caption !== undefined ? updates.caption.trim() : existing.caption;
    const newHashtags = updates.hashtags !== undefined ? updates.hashtags : existing.hashtags;
    const newCta = updates.callToAction !== undefined ? updates.callToAction.trim() : existing.callToAction;
    const newWording = updates.platformSpecificWording !== undefined ? updates.platformSpecificWording : existing.platformSpecificWording;
    const newThumbnailNotes = updates.thumbnailConsiderations !== undefined ? updates.thumbnailConsiderations : existing.thumbnailConsiderations;

    const validation = PlatformAdaptationValidator.validateAdaptationPayload({
      platform: existing.platform,
      title: newTitle,
      description: newDescription,
      caption: newCaption,
      hashtags: newHashtags,
      callToAction: newCta,
      platformSpecificWording: newWording,
      thumbnailConsiderations: newThumbnailNotes,
      correctAnswer: liveLock.pkg.question?.correctAnswer,
    });

    if (!validation.isValid) {
      throw new ValidationError(`Platform adaptation validation failed: ${validation.issues.join('; ')}`);
    }

    const wasApproved = existing.status === PlatformAdaptationStatus.APPROVED;
    const nextStatus = wasApproved ? PlatformAdaptationStatus.DRAFT : (updates.status || existing.status);

    const updated = await platformAdaptationsRepository.update(
      adaptationId,
      {
        title: newTitle,
        description: newDescription,
        caption: newCaption,
        hashtags: newHashtags,
        callToAction: newCta,
        platformSpecificWording: newWording,
        thumbnailConsiderations: newThumbnailNotes,
        status: nextStatus,
        approvalRecord: wasApproved ? undefined : existing.approvalRecord,
        isStaleSource: isStale,
        staleReason: isStale ? 'Canonical content package was modified since adaptation creation.' : undefined,
      },
      { createNewVersion: true }
    );

    const now = new Date().toISOString();

    if (wasApproved) {
      await platformAdaptationsRepository.logAudit({
        adaptationId: updated.id,
        contentId: updated.contentId,
        platform: updated.platform,
        action: 'INVALIDATE_APPROVAL',
        actorId: actor.id,
        actorName: actor.name || 'User',
        actorRole: actor.role,
        fromStatus: PlatformAdaptationStatus.APPROVED,
        toStatus: PlatformAdaptationStatus.DRAFT,
        fromVersion: existing.currentVersion,
        toVersion: updated.currentVersion,
        reason: 'Editing an approved adaptation creates a new version and invalidates prior approval.',
        timestamp: now,
      });
    }

    await platformAdaptationsRepository.logAudit({
      adaptationId: updated.id,
      contentId: updated.contentId,
      platform: updated.platform,
      action: 'UPDATE',
      actorId: actor.id,
      actorName: actor.name || 'User',
      actorRole: actor.role,
      fromVersion: existing.currentVersion,
      toVersion: updated.currentVersion,
      fromStatus: existing.status,
      toStatus: updated.status,
      timestamp: now,
    });

    await auditService.log(
      actor.id,
      actor.name || 'User',
      'UPDATE_PLATFORM_ADAPTATION',
      'PLATFORM_ADAPTATION',
      updated.id,
      { details: `Updated ${existing.platform} adaptation on ${existing.contentId} to version ${updated.currentVersion}` }
    );

    return updated;
  }

  /**
   * Submits an adaptation for human review (DRAFT -> IN_REVIEW).
   */
  public async submitForReview(adaptationId: string, actor: WorkflowActor): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CREATOR, UserRole.TOPIC_LEAD],
      'submit adaptation for review'
    );

    const existing = await platformAdaptationsRepository.findById(adaptationId);
    if (!existing) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    if (existing.status !== PlatformAdaptationStatus.DRAFT && existing.status !== PlatformAdaptationStatus.CHANGES_REQUIRED) {
      throw new ValidationError(`Cannot submit adaptation with status "${existing.status}" for review.`);
    }

    const updated = await platformAdaptationsRepository.update(
      adaptationId,
      { status: PlatformAdaptationStatus.IN_REVIEW },
      { createNewVersion: false }
    );

    const now = new Date().toISOString();
    await platformAdaptationsRepository.logAudit({
      adaptationId: updated.id,
      contentId: updated.contentId,
      platform: updated.platform,
      action: 'SUBMIT_REVIEW',
      actorId: actor.id,
      actorName: actor.name || 'User',
      actorRole: actor.role,
      fromStatus: existing.status,
      toStatus: PlatformAdaptationStatus.IN_REVIEW,
      timestamp: now,
    });

    return updated;
  }

  /**
   * Human approval of an adaptation.
   * AI must never automatically approve.
   */
  public async approveAdaptation(
    adaptationId: string,
    actor: WorkflowActor,
    options?: { reason?: string }
  ): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'approve platform adaptation'
    );

    const existing = await platformAdaptationsRepository.findById(adaptationId);
    if (!existing) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    // Verify source staleness before approval
    const liveLock = await this.getCanonicalSourceLock(existing.contentId);
    const isStale = liveLock.packageOverallHash !== existing.canonicalSourceVersionLock.packageOverallHash;
    if (isStale) {
      throw new ValidationError(
        `Cannot approve stale adaptation. The canonical content has changed since this adaptation was created.`
      );
    }

    const now = new Date().toISOString();
    const approvalRecord = {
      approvedBy: actor.id,
      approvedByName: actor.name || 'Reviewer',
      approvedByRole: actor.role,
      approvedAt: now,
      reason: options?.reason,
    };

    const updated = await platformAdaptationsRepository.update(
      adaptationId,
      {
        status: PlatformAdaptationStatus.APPROVED,
        approvalRecord,
      },
      { createNewVersion: false }
    );

    await platformAdaptationsRepository.logAudit({
      adaptationId: updated.id,
      contentId: updated.contentId,
      platform: updated.platform,
      action: 'APPROVE',
      actorId: actor.id,
      actorName: actor.name || 'Reviewer',
      actorRole: actor.role,
      fromStatus: existing.status,
      toStatus: PlatformAdaptationStatus.APPROVED,
      reason: options?.reason,
      timestamp: now,
    });

    await auditService.log(
      actor.id,
      actor.name || 'Reviewer',
      'APPROVE_PLATFORM_ADAPTATION',
      'PLATFORM_ADAPTATION',
      updated.id,
      { details: `Approved ${existing.platform} adaptation for ${existing.contentId}` }
    );

    return updated;
  }

  /**
   * Human rejection of an adaptation.
   */
  public async rejectAdaptation(
    adaptationId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'reject platform adaptation'
    );

    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('A rejection reason of at least 5 characters is required.');
    }

    const existing = await platformAdaptationsRepository.findById(adaptationId);
    if (!existing) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    const now = new Date().toISOString();
    const rejectionRecord = {
      rejectedBy: actor.id,
      rejectedByName: actor.name || 'Reviewer',
      rejectedByRole: actor.role,
      rejectedAt: now,
      reason: reason.trim(),
    };

    const updated = await platformAdaptationsRepository.update(
      adaptationId,
      {
        status: PlatformAdaptationStatus.REJECTED,
        rejectionRecord,
      },
      { createNewVersion: false }
    );

    await platformAdaptationsRepository.logAudit({
      adaptationId: updated.id,
      contentId: updated.contentId,
      platform: updated.platform,
      action: 'REJECT',
      actorId: actor.id,
      actorName: actor.name || 'Reviewer',
      actorRole: actor.role,
      fromStatus: existing.status,
      toStatus: PlatformAdaptationStatus.REJECTED,
      reason: reason.trim(),
      timestamp: now,
    });

    return updated;
  }

  /**
   * Request changes on an adaptation.
   */
  public async requestChanges(
    adaptationId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'request changes on platform adaptation'
    );

    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('A reason for requested changes of at least 5 characters is required.');
    }

    const existing = await platformAdaptationsRepository.findById(adaptationId);
    if (!existing) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    const now = new Date().toISOString();
    const changesRequiredRecord = {
      requestedBy: actor.id,
      requestedByName: actor.name || 'Reviewer',
      requestedByRole: actor.role,
      requestedAt: now,
      reason: reason.trim(),
    };

    const updated = await platformAdaptationsRepository.update(
      adaptationId,
      {
        status: PlatformAdaptationStatus.CHANGES_REQUIRED,
        changesRequiredRecord,
      },
      { createNewVersion: false }
    );

    await platformAdaptationsRepository.logAudit({
      adaptationId: updated.id,
      contentId: updated.contentId,
      platform: updated.platform,
      action: 'REQUEST_CHANGES',
      actorId: actor.id,
      actorName: actor.name || 'Reviewer',
      actorRole: actor.role,
      fromStatus: existing.status,
      toStatus: PlatformAdaptationStatus.CHANGES_REQUIRED,
      reason: reason.trim(),
      timestamp: now,
    });

    return updated;
  }

  /**
   * Detects whether an adaptation is stale compared to live canonical content.
   */
  public async checkStaleness(adaptationId: string): Promise<{
    isStale: boolean;
    adaptation: PlatformAdaptationRecord;
    lockedHash: string;
    liveHash: string;
    staleReason?: string;
  }> {
    const adaptation = await platformAdaptationsRepository.findById(adaptationId);
    if (!adaptation) {
      throw new NotFoundError(`Platform adaptation with ID "${adaptationId}" does not exist.`);
    }

    const liveLock = await this.getCanonicalSourceLock(adaptation.contentId);
    const lockedHash = adaptation.canonicalSourceVersionLock.packageOverallHash;
    const liveHash = liveLock.packageOverallHash;
    const isStale = lockedHash !== liveHash;

    const staleReason = isStale
      ? `Canonical package overall hash mutated from "${lockedHash.substring(0, 10)}..." to "${liveHash.substring(0, 10)}...".`
      : undefined;

    if (adaptation.isStaleSource !== isStale) {
      await platformAdaptationsRepository.update(
        adaptationId,
        {
          isStaleSource: isStale,
          staleReason,
        },
        { createNewVersion: false }
      );
    }

    return {
      isStale,
      adaptation,
      lockedHash,
      liveHash,
      staleReason,
    };
  }

  /**
   * Search and filter platform adaptations.
   */
  public async searchAdaptations(filters: PlatformAdaptationSearchFilters): Promise<PlatformAdaptationRecord[]> {
    return platformAdaptationsRepository.search(filters);
  }

  /**
   * Retrieves full version history for an adaptation.
   */
  public async getAdaptationVersions(adaptationId: string): Promise<PlatformAdaptationVersion[]> {
    return platformAdaptationsRepository.getVersions(adaptationId);
  }

  /**
   * Retrieves a specific version of an adaptation.
   */
  public async getAdaptationVersion(adaptationId: string, versionNumber: number): Promise<PlatformAdaptationVersion | null> {
    return platformAdaptationsRepository.getVersion(adaptationId, versionNumber);
  }

  /**
   * Retrieves an adaptation by content ID and platform.
   */
  public async getAdaptationByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType
  ): Promise<PlatformAdaptationRecord | null> {
    return platformAdaptationsRepository.findByContentIdAndPlatform(contentId, platform);
  }

  /**
   * Retrieves all 3 platform adaptations for a canonical Content ID.
   */
  public async getMultiPlatformPackage(contentId: string): Promise<{
    contentId: string;
    youtube?: PlatformAdaptationRecord | null;
    instagram?: PlatformAdaptationRecord | null;
    facebook?: PlatformAdaptationRecord | null;
    isComplete: boolean;
  }> {
    PlatformAdaptationValidator.validateContentId(contentId);

    const [youtube, instagram, facebook] = await Promise.all([
      platformAdaptationsRepository.findByContentIdAndPlatform(contentId, PlatformType.YOUTUBE),
      platformAdaptationsRepository.findByContentIdAndPlatform(contentId, PlatformType.INSTAGRAM),
      platformAdaptationsRepository.findByContentIdAndPlatform(contentId, PlatformType.FACEBOOK),
    ]);

    return {
      contentId,
      youtube,
      instagram,
      facebook,
      isComplete: Boolean(youtube && instagram && facebook),
    };
  }
}

export const phase21PlatformAdaptationService = Phase21PlatformAdaptationService.getInstance();
