/**
 * BURRA PARIKSHA CMS - Social Review Service
 * Phase 8H: Social Content Review & Human Approval Workflow
 * 
 * Provides domain-level utilities for assembling complete social review packages,
 * computing deterministic exact-content SHA-256 version fingerprints,
 * enforcing multi-stage approval gates (RBAC, 8G quality, Phase 5 validation, self-approval policy),
 * and persisting immutable review decisions to Google Sheets and audit logs.
 */

import crypto from 'crypto';
import {
  Question,
  QuestionValidationStatus,
  QuestionLanguage,
  SocialReviewStatus,
  SocialReviewRecord,
  SocialReviewPackageBundle,
  SubmitSocialReviewInput,
  UserRole,
  HookVariant,
  SpokenTeleprompterScriptPayload,
  SocialMetadataPayload,
  MultiPlatformAdaptationPayload,
  SocialQualityAssessmentPayload,
  SocialQualityStatus,
  SocialPlatform,
  TeleprompterSegmentSection,
} from '../../types';
import { questionsRepository } from '../repositories/questions.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { socialReviewsRepository } from '../repositories/social-reviews.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { workflowRepository } from '../repositories/workflow.repository';
import { videosRepository } from '../repositories/videos.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { SocialEnhancementService } from './social-enhancement.service';
import { PlatformAdaptationService } from './platform-adaptation.service';

export class SocialReviewService {
  private static draftCache: Map<string, any> = new Map();

  public static clearDraftCache(questionId?: string): void {
    if (questionId) {
      this.draftCache.delete(questionId);
    } else {
      this.draftCache.clear();
    }
  }

  /**
   * Computes a deterministic SHA-256 fingerprint for the approval-relevant content in a social package.
   * Property ordering is canonicalized so equivalent content always yields the exact same hash.
   * Volatile timestamps (e.g. generatedAt, createdAt, updatedAt, reviewedAt) are explicitly excluded.
   */
  public static computeVersionHash(bundleParams: {
    question: {
      questionText: string;
      options: any;
      correctAnswer: string;
      explanation?: string;
      language?: string;
    };
    hook?: {
      id?: string;
      style?: string;
      text?: string;
      spokenTeluguText?: string;
      onScreenOverlayText?: string;
    } | null;
    teleprompterScript?: {
      segments?: Array<{
        section?: string;
        spokenText?: string;
        teleprompterText?: string;
        estimatedPauseSeconds?: number;
      }>;
    } | null;
    canonicalMetadata?: {
      shortTitle?: string;
      socialCaption?: string;
      extendedDescription?: string;
      hashtags?: string[];
      keywords?: string[];
      cta?: {
        primaryText?: string;
        pinnedCommentPrompt?: string;
      };
    } | null;
    multiPlatformAdaptations?: {
      variants?: Record<string, {
        title?: string;
        caption?: string;
        hashtags?: string[];
        overlayText?: string;
        pinnedComment?: string;
      }>;
    } | null;
    qualityAssessment?: {
      overallScore?: number;
      status?: string;
      blockingFindingsCount?: number;
    } | null;
  }): string {
    // 1. Canonicalize Question Options
    let canonicalOptions: Array<{ identifier: string; text: string }> = [];
    if (Array.isArray(bundleParams.question.options)) {
      canonicalOptions = bundleParams.question.options
        .map((o) => ({
          identifier: String(o.identifier || o.key || '').toUpperCase().trim(),
          text: String(o.text || o.value || '').trim(),
        }))
        .sort((a, b) => a.identifier.localeCompare(b.identifier));
    } else if (typeof bundleParams.question.options === 'object' && bundleParams.question.options !== null) {
      canonicalOptions = Object.entries(bundleParams.question.options)
        .map(([k, v]) => ({
          identifier: k.toUpperCase().trim(),
          text: String(v || '').trim(),
        }))
        .sort((a, b) => a.identifier.localeCompare(b.identifier));
    }

    // 2. Canonicalize Hook
    const canonicalHook = bundleParams.hook ? {
      id: bundleParams.hook.id || '',
      style: bundleParams.hook.style || '',
      text: (bundleParams.hook.text || '').trim(),
      spokenTeluguText: (bundleParams.hook.spokenTeluguText || '').trim(),
      onScreenOverlayText: (bundleParams.hook.onScreenOverlayText || '').trim(),
    } : null;

    // 3. Canonicalize Teleprompter Script
    const canonicalTeleprompter = bundleParams.teleprompterScript?.segments
      ? bundleParams.teleprompterScript.segments.map((s) => ({
          section: (s.section || '').trim(),
          spokenText: (s.spokenText || '').trim(),
          teleprompterText: (s.teleprompterText || '').trim(),
          estimatedPauseSeconds: Number(s.estimatedPauseSeconds || 0),
        }))
      : [];

    // 4. Canonicalize Metadata
    const canonicalMetadata = bundleParams.canonicalMetadata ? {
      shortTitle: (bundleParams.canonicalMetadata.shortTitle || '').trim(),
      socialCaption: (bundleParams.canonicalMetadata.socialCaption || '').trim(),
      extendedDescription: (bundleParams.canonicalMetadata.extendedDescription || '').trim(),
      hashtags: [...(bundleParams.canonicalMetadata.hashtags || [])].sort(),
      keywords: [...(bundleParams.canonicalMetadata.keywords || [])].sort(),
      cta: bundleParams.canonicalMetadata.cta ? {
        primaryText: (bundleParams.canonicalMetadata.cta.primaryText || '').trim(),
        pinnedCommentPrompt: (bundleParams.canonicalMetadata.cta.pinnedCommentPrompt || '').trim(),
      } : null,
    } : null;

    // 5. Canonicalize Multi-Platform Adaptations
    const canonicalAdaptations: Record<string, any> = {};
    if (bundleParams.multiPlatformAdaptations?.variants) {
      const platforms = Object.keys(bundleParams.multiPlatformAdaptations.variants).sort();
      for (const p of platforms) {
        const v = bundleParams.multiPlatformAdaptations.variants[p];
        if (v) {
          canonicalAdaptations[p] = {
            title: (v.title || '').trim(),
            caption: (v.caption || '').trim(),
            hashtags: [...(v.hashtags || [])].sort(),
            overlayText: (v.overlayText || '').trim(),
            pinnedComment: (v.pinnedComment || '').trim(),
          };
        }
      }
    }

    // 6. Canonicalize Quality Assessment
    const canonicalQuality = bundleParams.qualityAssessment ? {
      overallScore: Number(bundleParams.qualityAssessment.overallScore ?? 0),
      status: String(bundleParams.qualityAssessment.status || ''),
      blockingFindingsCount: Number(bundleParams.qualityAssessment.blockingFindingsCount ?? 0),
    } : null;

    // 7. Assemble Canonical Representation
    const canonicalPayload = {
      question: {
        questionText: (bundleParams.question.questionText || '').trim(),
        options: canonicalOptions,
        correctAnswer: (bundleParams.question.correctAnswer || '').trim().toUpperCase(),
        explanation: (bundleParams.question.explanation || '').trim(),
        language: (bundleParams.question.language || 'ENGLISH').trim().toUpperCase(),
      },
      hook: canonicalHook,
      teleprompter: canonicalTeleprompter,
      metadata: canonicalMetadata,
      adaptations: canonicalAdaptations,
      quality: canonicalQuality,
    };

    const jsonString = JSON.stringify(canonicalPayload);
    return crypto.createHash('sha256').update(jsonString, 'utf8').digest('hex');
  }

  /**
   * Assembles a complete Social Review Package Bundle for a question ID.
   */
  public static async getReviewPackageBundle(
    questionId: string,
    overrideQuestion?: Question
  ): Promise<SocialReviewPackageBundle> {
    let question: Question | null = overrideQuestion || null;

    if (!question) {
      question = await questionsRepository.findById(questionId);
    }

    if (!question) {
      throw new Error(`Question with ID ${questionId} not found.`);
    }

    let contentMaster: any = null;
    if (question.contentMasterId) {
      contentMaster = await contentMastersRepository.findById(question.contentMasterId);
    }

    // Build draft social artifacts using SocialEnhancementService (with caching for stability)
    let draftResult = this.draftCache.get(question.id);
    if (!draftResult) {
      draftResult = await SocialEnhancementService.generateSocialEnhancementDraft({
        question,
        contentMasterId: question.contentMasterId,
      });
      this.draftCache.set(question.id, draftResult);
    }

    const payload = draftResult.payload;
    const hook = payload.hooks && payload.hooks.length > 0 ? payload.hooks[0] : null;
    let teleprompterScript = payload.teleprompterScript;

    // Check for saved script associated with video
    const linkedVideos = await videosRepository.findByQuestionId(question.id);
    if (linkedVideos.length > 0) {
      const savedScript = await scriptsRepository.findByVideoId(linkedVideos[0].id);
      if (savedScript) {
        teleprompterScript = {
          pacingWpm: teleprompterScript?.pacingWpm || 140,
          totalEstimatedDurationSeconds: teleprompterScript?.totalEstimatedDurationSeconds || 45,
          segments: [
            { id: 'SEG-1', section: TeleprompterSegmentSection.HOOK, spokenText: savedScript.hookText || '', teleprompterText: savedScript.hookText || '', estimatedDurationSeconds: 5 },
            { id: 'SEG-2', section: TeleprompterSegmentSection.QUESTION, spokenText: savedScript.problemStatement || '', teleprompterText: savedScript.problemStatement || '', estimatedDurationSeconds: 10 },
            { id: 'SEG-3', section: TeleprompterSegmentSection.SOLUTION, spokenText: savedScript.stepByStepSolution || '', teleprompterText: savedScript.stepByStepSolution || '', estimatedDurationSeconds: 15 },
            { id: 'SEG-4', section: TeleprompterSegmentSection.SPEED_TRICK, spokenText: savedScript.speedTrickOrTakeaway || '', teleprompterText: savedScript.speedTrickOrTakeaway || '', estimatedDurationSeconds: 10 },
            { id: 'SEG-5', section: TeleprompterSegmentSection.CTA, spokenText: savedScript.callToAction || '', teleprompterText: savedScript.callToAction || '', estimatedDurationSeconds: 5 },
          ],
        } as any;
        if (hook) {
          hook.text = savedScript.hookText || hook.text;
        }
      }
    }

    let canonicalMetadata: SocialMetadataPayload | null = payload.metadata || null;
    if (!canonicalMetadata && payload.caption) {
      canonicalMetadata = {
        id: `META-${question.id}`,
        questionId: question.id,
        shortTitle: payload.caption.title || `Burra Speed Trick | ${question.topicName || 'Aptitude'}`,
        socialCaption: payload.caption.description || question.questionText,
        extendedDescription: payload.caption.description || question.questionText,
        hashtags: payload.caption.hashtags || ['#BurraPariksha', '#APPSC', '#TSPSC', '#MathShortcuts', '#TeluguMath'],
        keywords: ['BurraPariksha', 'Telugu', 'Exam', 'APPSC', 'TSPSC'],
        pinnedCommentText: payload.caption.pinnedCommentText || `Correct Answer & Full Solution:\n${question.explanation}`,
        cta: {
          primaryText: payload.cta?.callToActionText || 'Comment your answer before watching the solution!',
          pinnedCommentPrompt: payload.cta?.commentChallengePrompt || 'What is your answer? A, B, C or D?',
          sharePrompt: payload.cta?.sharePrompt || 'Share this challenge!',
        },
        language: question.language || QuestionLanguage.TELUGU,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
    }

    let multiPlatformAdaptations: MultiPlatformAdaptationPayload | null = (payload as any).multiPlatformAdaptations || null;
    if (!multiPlatformAdaptations && canonicalMetadata) {
      const adaptResult = PlatformAdaptationService.adaptMultiPlatformMetadata(question, canonicalMetadata);
      if (adaptResult.isEligible && adaptResult.payload) {
        multiPlatformAdaptations = adaptResult.payload;
      }
    }

    const qualityAssessment: SocialQualityAssessmentPayload | null = (payload as any).qualityAssessment || null;
    const invarianceReport = payload.invarianceReport;

    // Compute current exact-content version fingerprint
    const currentVersionHash = this.computeVersionHash({
      question: {
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        language: question.language,
      },
      hook,
      teleprompterScript,
      canonicalMetadata,
      multiPlatformAdaptations,
      qualityAssessment,
    });

    // Fetch review history from repository
    const reviewHistory = await socialReviewsRepository.findByQuestion(questionId);
    const latestReviewRecord = reviewHistory.length > 0 ? reviewHistory[0] : undefined;

    // Determine currentSocialReviewStatus
    let currentReviewStatus = SocialReviewStatus.PENDING_REVIEW;

    if (latestReviewRecord) {
      console.log('VALIDATION HASH CHECK:', { currentVersionHash, reviewedHash: latestReviewRecord?.reviewedVersionHash, match: latestReviewRecord?.reviewedVersionHash === currentVersionHash });
      if (latestReviewRecord.decision === SocialReviewStatus.APPROVED) {
        if (latestReviewRecord.reviewedVersionHash === currentVersionHash) {
          currentReviewStatus = SocialReviewStatus.APPROVED;
        } else {
          currentReviewStatus = SocialReviewStatus.PENDING_REVIEW;
        }
      } else if (latestReviewRecord.decision === SocialReviewStatus.CHANGES_REQUESTED) {
        if (latestReviewRecord.reviewedVersionHash === currentVersionHash) {
          currentReviewStatus = SocialReviewStatus.CHANGES_REQUESTED;
        } else {
          // Content was updated after changes were requested -> back to PENDING_REVIEW!
          currentReviewStatus = SocialReviewStatus.PENDING_REVIEW;
        }
      } else if (latestReviewRecord.decision === SocialReviewStatus.REJECTED) {
        currentReviewStatus = SocialReviewStatus.REJECTED;
      }
    }

    // Evaluate readiness & blockers
    const blockers: string[] = [];

    const isQuestionValid = String(question.validationStatus) === 'VALID' || question.validationStatus === QuestionValidationStatus.VALID;
    if (!isQuestionValid) {
      blockers.push(`Source question validation status is ${question.validationStatus || 'NOT_VALIDATED'} (must be VALID).`);
    }

    if (invarianceReport && !invarianceReport.isValid) {
      blockers.push('Factual invariance check failed between source question and social presentation.');
    }

    const hasInvarianceLeakage = invarianceReport?.violations?.some(
      (v) => v.anchorType === 'CORRECT_ANSWER' || v.message.toLowerCase().includes('leakage')
    );
    if (hasInvarianceLeakage) {
      blockers.push('Answer leakage detected in social hook or presentation.');
    }

    if (!multiPlatformAdaptations || !multiPlatformAdaptations.isAllValid) {
      blockers.push('Target multi-platform adaptations (YouTube, Instagram, Facebook) are incomplete or invalid.');
    }

    if (qualityAssessment) {
      if (qualityAssessment.blockingFindings.length > 0) {
        blockers.push(`Content package has ${qualityAssessment.blockingFindings.length} blocking quality findings.`);
      }
      if (qualityAssessment.status === SocialQualityStatus.REJECTED) {
        blockers.push('AI Quality Assessment status is REJECTED due to integrity issues.');
      }
    }

    if (currentReviewStatus !== SocialReviewStatus.APPROVED) {
      blockers.push(`Human social review approval is required (current status: ${currentReviewStatus}).`);
    }

    const isPublishingReady = blockers.length === 0;

    return {
      question,
      contentMaster,
      validationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
      hook,
      teleprompterScript,
      canonicalMetadata,
      multiPlatformAdaptations,
      qualityAssessment,
      currentReviewStatus,
      currentVersionHash,
      isPublishingReady,
      blockers,
      reviewHistory,
      latestReviewRecord,
    };
  }

  /**
   * Submits a human review decision (APPROVE, REQUEST_CHANGES, REJECT) for a social content package.
   */
  public static async submitReviewDecision(
    questionId: string,
    input: SubmitSocialReviewInput & { decision: SocialReviewStatus },
    actor: { id: string; name: string; role: UserRole | string },
    overrideQuestion?: Question
  ): Promise<{ record: SocialReviewRecord; bundle: SocialReviewPackageBundle }> {
    // 0. Input validation
    if (!input || !input.decision || !Object.values(SocialReviewStatus).includes(input.decision)) {
      const err = new Error('Invalid review decision value. Must be APPROVED, CHANGES_REQUESTED, or REJECTED.');
      (err as any).statusCode = 400;
      throw err;
    }

    if (!input.versionHash || typeof input.versionHash !== 'string' || !input.versionHash.trim()) {
      const err = new Error('versionHash is required to submit a review decision.');
      (err as any).statusCode = 400;
      throw err;
    }

    // 1. Session check
    if (!actor || !actor.id) {
      const err = new Error('Authentication required to submit review decision.');
      (err as any).statusCode = 401;
      throw err;
    }

    // 2. Role check
    const normalizedRole = String(actor.role || '').toUpperCase();
    const ALLOWED_ROLES = ['ADMIN', 'CONTENT_MANAGER', 'REVIEWER'];
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      const err = new Error(`Role ${actor.role} is not authorized to submit social review decisions.`);
      (err as any).statusCode = 403;
      throw err;
    }

    // 3. Fetch current live package bundle
    const liveBundle = await this.getReviewPackageBundle(questionId, overrideQuestion);

    // 4. Optimistic concurrency / Version Hash check
    if (input.versionHash !== liveBundle.currentVersionHash) {
      const err = new Error('Stale review request: Content package has been modified since review package was loaded. Please refresh before submitting.');
      (err as any).statusCode = 409;
      throw err;
    }

    let isAdminOverride = false;

    // 5. Gate checks for APPROVAL
    if (input.decision === SocialReviewStatus.APPROVED) {
      // Gate: Question Validation Status
      const isLiveQuestionValid = String(liveBundle.question.validationStatus) === 'VALID' || liveBundle.question.validationStatus === QuestionValidationStatus.VALID;
      if (!isLiveQuestionValid) {
        const err = new Error('Cannot approve package: Source question validation status is not VALID.');
        (err as any).statusCode = 422;
        throw err;
      }

      // Gate: Invariance & Answer Leakage
      const invariance = SocialEnhancementService.validateInvariance(
        {
          id: liveBundle.question.id,
          questionText: liveBundle.question.questionText,
          options: liveBundle.question.options || { a: '', b: '', c: '', d: '' },
          correctAnswer: liveBundle.question.correctAnswer || '',
          explanation: liveBundle.question.explanation || '',
          validationStatus: (liveBundle.question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
        },
        {
          problemStatement: liveBundle.question.questionText,
          stepByStepSolution: liveBundle.question.explanation,
          hookText: liveBundle.hook?.text || '',
          spokenNarrationText: liveBundle.teleprompterScript?.segments?.map((s) => s.spokenText).join(' ') || '',
        }
      );

      if (!invariance.isValid) {
        const err = new Error('Cannot approve package: Factual invariance check failed.');
        (err as any).statusCode = 422;
        throw err;
      }

      const answerLeakage = invariance.violations.some(
        (v) => v.anchorType === 'CORRECT_ANSWER' || v.message.toLowerCase().includes('leakage')
      );
      if (answerLeakage) {
        const err = new Error('Cannot approve package: Answer leakage detected in social presentation.');
        (err as any).statusCode = 422;
        throw err;
      }

      // Gate: Platform adaptations valid
      if (!liveBundle.multiPlatformAdaptations || !liveBundle.multiPlatformAdaptations.isAllValid) {
        const err = new Error('Cannot approve package: Target platform adaptations (YouTube, Instagram, Facebook) are incomplete or invalid.');
        (err as any).statusCode = 422;
        throw err;
      }

      // Gate: 8G Quality Assessment blocking findings
      if (liveBundle.qualityAssessment) {
        if (liveBundle.qualityAssessment.blockingFindings.length > 0) {
          const err = new Error(`Cannot approve package: ${liveBundle.qualityAssessment.blockingFindings.length} blocking quality findings exist.`);
          (err as any).statusCode = 422;
          throw err;
        }
        if (liveBundle.qualityAssessment.status === SocialQualityStatus.REJECTED) {
          const err = new Error('Cannot approve package: Quality Assessment status is REJECTED.');
          (err as any).statusCode = 422;
          throw err;
        }
      }

      // Gate: Self-approval policy
      const authorId = (liveBundle.question as any).createdBy || (liveBundle.question as any).authorId || (liveBundle.question as any).userId;
      if (authorId && String(authorId) === String(actor.id)) {
        if (normalizedRole !== 'ADMIN') {
          const err = new Error('Self-approval is forbidden. Final review must be performed by an independent reviewer or Content Manager.');
          (err as any).statusCode = 403;
          throw err;
        } else {
          isAdminOverride = true;
        }
      }
    }

    // 6. Gate checks for CHANGES_REQUESTED and REJECTED
    if (input.decision === SocialReviewStatus.CHANGES_REQUESTED || input.decision === SocialReviewStatus.REJECTED) {
      const reasonText = (input.reason || '').trim();
      if (!reasonText || reasonText.length < 10) {
        const err = new Error('A detailed reason containing at least 10 meaningful characters is required for change requests and rejections.');
        (err as any).statusCode = 400;
        throw err;
      }
    }

    // 7. Construct SocialReviewRecord
    const reviewedAt = new Date().toISOString();
    const recordId = `BP-REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const reviewRecord: SocialReviewRecord = {
      id: recordId,
      questionId,
      contentId: liveBundle.question.contentId || liveBundle.question.contentMasterId,
      contentMasterId: liveBundle.question.contentMasterId,
      reviewedVersionHash: liveBundle.currentVersionHash,
      reviewerId: actor.id,
      reviewerName: actor.name,
      reviewerRole: actor.role,
      decision: input.decision,
      previousStatus: liveBundle.currentReviewStatus,
      reason: input.reason?.trim(),
      feedbackCategories: input.feedbackCategories || [],
      overallQualityScoreAtReview: liveBundle.qualityAssessment?.overallScore || 0,
      qualityStatusAtReview: liveBundle.qualityAssessment?.status || SocialQualityStatus.NEEDS_IMPROVEMENT,
      isAdminOverride,
      reviewedAt,
    };

    // 8. Persist to Repository
    await socialReviewsRepository.create(reviewRecord);

    // 9. Log Audit Action
    let auditAction = 'SOCIAL_REVIEW_SUBMIT';
    if (input.decision === SocialReviewStatus.APPROVED) {
      auditAction = isAdminOverride ? 'ADMIN_SELF_APPROVAL_OVERRIDE' : 'SOCIAL_REVIEW_APPROVE';
    } else if (input.decision === SocialReviewStatus.CHANGES_REQUESTED) {
      auditAction = 'SOCIAL_REVIEW_REQUEST_CHANGES';
    } else if (input.decision === SocialReviewStatus.REJECTED) {
      auditAction = 'SOCIAL_REVIEW_REJECT';
    }

    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      auditAction,
      'SOCIAL_REVIEW',
      questionId,
      {
        reviewId: recordId,
        decision: input.decision,
        versionHash: liveBundle.currentVersionHash,
        reason: input.reason,
        isAdminOverride,
        overallScore: liveBundle.qualityAssessment?.overallScore,
      }
    );

    // 10. Record Workflow Transition
    await workflowRepository.create({
      id: `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entityType: 'QUESTION',
      entityId: questionId,
      fromStatus: liveBundle.currentReviewStatus,
      toStatus: input.decision,
      triggeredBy: actor.id,
      remarks: input.reason || `Social review decision: ${input.decision}`,
      timestamp: reviewedAt,
    });

    // 11. Return updated bundle
    const updatedBundle = await this.getReviewPackageBundle(questionId, overrideQuestion);
    return { record: reviewRecord, bundle: updatedBundle };
  }

  /**
   * Retrieves full review history for a question ID.
   */
  public static async getReviewHistory(questionId: string): Promise<SocialReviewRecord[]> {
    return socialReviewsRepository.findByQuestion(questionId);
  }

  private static instance: SocialReviewService | null = null;

  public static getInstance(): SocialReviewService {
    if (!SocialReviewService.instance) {
      SocialReviewService.instance = new SocialReviewService();
    }
    return SocialReviewService.instance;
  }

  public async getReviewPackageBundle(questionId: string, overrideQuestion?: Question): Promise<SocialReviewPackageBundle> {
    return SocialReviewService.getReviewPackageBundle(questionId, overrideQuestion);
  }

  public async submitReviewDecision(
    questionId: string,
    input: SubmitSocialReviewInput & { decision: SocialReviewStatus },
    actor: { id: string; name: string; role: UserRole | string },
    overrideQuestion?: Question
  ): Promise<{ record: SocialReviewRecord; bundle: SocialReviewPackageBundle }> {
    return SocialReviewService.submitReviewDecision(questionId, input, actor, overrideQuestion);
  }

  public async getReviewHistory(questionId: string): Promise<SocialReviewRecord[]> {
    return SocialReviewService.getReviewHistory(questionId);
  }

  public async getAllReviews(): Promise<SocialReviewRecord[]> {
    return socialReviewsRepository.findAll();
  }

  public async getReviewById(id: string): Promise<SocialReviewRecord | null> {
    return socialReviewsRepository.findById(id);
  }

  public async getReviewsByQuestion(questionId: string): Promise<SocialReviewRecord[]> {
    return socialReviewsRepository.findByQuestion(questionId);
  }

  public clearDraftCache(questionId?: string): void {
    SocialReviewService.clearDraftCache(questionId);
  }

  public computeVersionHash(bundleParams: Parameters<typeof SocialReviewService.computeVersionHash>[0]): string {
    return SocialReviewService.computeVersionHash(bundleParams);
  }
}

export const socialReviewService = SocialReviewService.getInstance();

