/**
 * BURRA PARIKSHA CMS - Multi-Platform Adaptation Service
 * Phase 8F: Multi-Platform Adaptation Engine
 * 
 * Adapts canonical SocialMetadataPayload into platform-optimized packages
 * for YouTube Shorts, Instagram Reels, and Facebook Reels.
 * 
 * Enforces:
 * - Deterministic-first transformation (0 AI calls for standard payloads)
 * - Strict platform limits & character bounds (using grapheme-aware counting)
 * - Mandatory brand anchor #BurraPariksha
 * - Fact preservation & Invariance guardrails (via SocialInvarianceValidator)
 * - Answer leakage detection
 * - Zero database / sheet persistence (in-memory draft generation)
 */

import crypto from 'crypto';
import {
  Question,
  QuestionValidationStatus,
  QuestionLanguage,
  SocialMetadataPayload,
  AdaptedPlatformPackage,
  MultiPlatformAdaptationPayload,
  SocialPlatform,
  PLATFORM_ADAPTATION_CONFIG,
  SocialEnhancementStatus,
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
import {
  SocialInvarianceValidator,
  SourceQuestionContext,
} from '../validators/social-invariance.validator';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { AIProviderOptions } from '../ai/types';
import { platformAdaptationsRepository } from '../repositories/platform-adaptations.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
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

/**
 * Unicode Grapheme-Aware Character Counter.
 * Handles Telugu compound characters, emojis, ZWJ sequences, and combining marks.
 */
export function getGraphemeCount(text: string): number {
  if (!text) return 0;
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return [...segmenter.segment(text)].length;
    } catch (e) {
      // Fallback if Segmenter errors out
    }
  }
  return Array.from(text).length;
}

/**
 * Safe Word-Boundary & Grapheme Truncation Helper.
 * Never cuts mid-grapheme cluster or mid-word.
 */
export function safeTruncate(text: string, maxLength: number): string {
  if (!text) return '';
  const count = getGraphemeCount(text);
  if (count <= maxLength) return text;

  // Split into graphemes
  let graphemes: string[] = [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    graphemes = [...segmenter.segment(text)].map((s: any) => s.segment);
  } else {
    graphemes = Array.from(text);
  }

  const targetLength = Math.max(1, maxLength - 3);
  const truncatedGraphemes = graphemes.slice(0, targetLength);
  let truncatedStr = truncatedGraphemes.join('');

  // Trim to last space to avoid cutting mid-word if possible
  const lastSpace = truncatedStr.lastIndexOf(' ');
  if (lastSpace > Math.floor(targetLength * 0.6)) {
    truncatedStr = truncatedStr.substring(0, lastSpace);
  }

  return truncatedStr.trim() + '...';
}

/**
 * Detects answer disclosures in platform text surfaces.
 */
export function detectAnswerLeakage(textSurfaces: string[], correctAnswer: string): boolean {
  if (!correctAnswer) return false;
  const key = (correctAnswer || '').toString().trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(key)) return false;

  const leakageRegexes = [
    new RegExp(`(?:correct\\s+(?:answer|option)|answer\\s+is|సమాధానం|జవాబు|ఆప్షన్)\\s*(?:is|:|=)?\\s*(?:option\\s*)?(${key})\\b`, 'i'),
    new RegExp(`(?:correct\\s+option|correct\\s+answer)\\s*(?:is|:|=)?\\s*(?:option\\s*)?([A-D])\\b`, 'i'),
    new RegExp(`\\boption\\s+(${key})\\b`, 'i'),
  ];

  for (const text of textSurfaces) {
    if (!text) continue;
    for (const regex of leakageRegexes) {
      if (regex.test(text)) return true;
    }
  }
  return false;
}

/**
 * Processes and normalizes hashtags for platform limits.
 * Guarantees #BurraPariksha is present, unique, and formatted correctly.
 */
export function adaptHashtags(canonicalHashtags: string[], maxCount: number): string[] {
  const brandTag = '#BurraPariksha';
  const cleanTags: string[] = [];
  const seen = new Set<string>();

  // Ensure brand tag is first
  cleanTags.push(brandTag);
  seen.add(brandTag.toLowerCase());

  for (const rawTag of canonicalHashtags || []) {
    if (!rawTag) continue;
    let formatted = rawTag.trim();
    if (!formatted.startsWith('#')) formatted = `#${formatted}`;
    // Replace whitespace inside hashtag
    formatted = formatted.replace(/\s+/g, '');

    const lower = formatted.toLowerCase();
    if (!seen.has(lower) && /^#[^\s#]+$/.test(formatted)) {
      seen.add(lower);
      cleanTags.push(formatted);
    }
    if (cleanTags.length >= maxCount) break;
  }

  return cleanTags;
}

export class PlatformAdaptationService {
  /**
   * Adapts canonical SocialMetadataPayload into platform packages for YouTube Shorts,
   * Instagram Reels, and Facebook Reels.
   */
  public static adaptMultiPlatformMetadata(
    sourceQuestion: Question,
    canonicalMetadata: SocialMetadataPayload
  ): {
    payload?: MultiPlatformAdaptationPayload;
    isEligible: boolean;
    reason: string;
  } {
    // 1. Source Question Validation Gate
    if (!sourceQuestion || !sourceQuestion.id) {
      return { isEligible: false, reason: 'Source question record is missing.' };
    }

    if (sourceQuestion.validationStatus === QuestionValidationStatus.INVALID) {
      return {
        isEligible: false,
        reason: 'Cannot adapt metadata for an INVALID source question. Please fix source question first.',
      };
    }

    if (!canonicalMetadata || !canonicalMetadata.shortTitle) {
      return { isEligible: false, reason: 'Canonical SocialMetadataPayload is missing or incomplete.' };
    }

    // Check mandatory brand tag presence in canonical metadata
    const canonicalHashtags = (canonicalMetadata.hashtags || []).filter(Boolean);
    const hasBrandTag = canonicalHashtags.some(
      (t) => (t || '').toString().toLowerCase().trim() === '#burrapariksha'
    );

    if (!hasBrandTag) {
      return {
        isEligible: false,
        reason: 'Canonical metadata is missing mandatory #BurraPariksha brand tag.',
      };
    }

    const language = canonicalMetadata.language || sourceQuestion.language || QuestionLanguage.TELUGU;
    const now = new Date().toISOString();
    const sourceContext: SourceQuestionContext = {
      id: sourceQuestion.id,
      questionText: sourceQuestion.questionText || '',
      options: sourceQuestion.options || { a: '', b: '', c: '', d: '' },
      correctAnswer: sourceQuestion.correctAnswer || '',
      explanation: sourceQuestion.explanation,
      validationStatus: (sourceQuestion.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    // 2. DETERMINISTIC ADAPTATION PATH (0 AI Calls)
    const variants: Record<SocialPlatform, AdaptedPlatformPackage> = {} as any;
    let isAllValid = true;

    const shortTitle = (canonicalMetadata.shortTitle || '').trim();
    const socialCaption = (canonicalMetadata.socialCaption || shortTitle || '').trim();
    const extendedDescription = (canonicalMetadata.extendedDescription || socialCaption || '').trim();
    const ctaPrimaryText = (canonicalMetadata.cta?.primaryText || 'Comment your answer before watching the solution!').trim();
    const ctaCommentPrompt = (canonicalMetadata.cta?.pinnedCommentPrompt || 'What is your answer? A, B, C or D?').trim();
    const keywords = canonicalMetadata.keywords || ['BurraPariksha', 'Telugu', 'Exam'];

    // --- A. YOUTUBE SHORTS ADAPTATION ---
    const ytConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.YOUTUBE_SHORTS];
    const ytHashtags = adaptHashtags(canonicalHashtags, ytConfig.maxHashtagsCount);
    let ytTitle = shortTitle;
    if (getGraphemeCount(ytTitle) > ytConfig.maxTitleLength!) {
      ytTitle = safeTruncate(ytTitle, ytConfig.maxTitleLength!);
    }

    let ytDescription = `${extendedDescription}\n\n👉 ${ctaPrimaryText}\n\n${ytHashtags.join(' ')}`.trim();
    if (getGraphemeCount(ytDescription) > ytConfig.maxDescriptionLength!) {
      ytDescription = safeTruncate(ytDescription, ytConfig.maxDescriptionLength!);
    }

    const ytLeakage = detectAnswerLeakage(
      [ytTitle, ytDescription, ctaCommentPrompt],
      sourceQuestion.correctAnswer || ''
    );

    const ytInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle: ytTitle,
      socialCaption,
      extendedDescription: ytDescription,
      ctaPrimaryText,
      ctaCommentPrompt,
    });

    const ytPassed = ytInvariance.isValid && !ytLeakage;
    if (!ytPassed) {
      console.log('ADAPTATION FAILURE DETAILS:', JSON.stringify({ ytInvariance, ytLeakage }, null, 2));
      isAllValid = false;
    }

    let ytStatus = SocialEnhancementStatus.VALIDATED;
    if (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !ytPassed) {
      ytStatus = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    variants[SocialPlatform.YOUTUBE_SHORTS] = {
      platform: SocialPlatform.YOUTUBE_SHORTS,
      title: ytTitle,
      caption: socialCaption,
      description: ytDescription,
      hashtags: ytHashtags,
      keywords,
      cta: {
        primaryText: ctaPrimaryText,
        pinnedCommentPrompt: ctaCommentPrompt,
      },
      characterCounts: {
        titleLength: getGraphemeCount(ytTitle),
        captionLength: getGraphemeCount(socialCaption),
        descriptionLength: getGraphemeCount(ytDescription),
      },
      invarianceReport: ytInvariance,
      invarianceCheckPassed: ytInvariance.isValid,
      answerLeakageDetected: ytLeakage,
      validationStatus: ytStatus,
      generatedAt: now,
    };

    // --- B. INSTAGRAM REELS ADAPTATION ---
    const igConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.INSTAGRAM_REELS];
    const igHashtags = adaptHashtags(canonicalHashtags, igConfig.maxHashtagsCount);
    let igCaption = `${shortTitle}\n\n${socialCaption}\n\n👇 ${ctaPrimaryText}\n💬 ${ctaCommentPrompt}\n\n${igHashtags.join(' ')}`.trim();

    if (getGraphemeCount(igCaption) > igConfig.maxCaptionLength) {
      igCaption = safeTruncate(igCaption, igConfig.maxCaptionLength);
    }

    const igLeakage = detectAnswerLeakage(
      [igCaption, ctaCommentPrompt],
      sourceQuestion.correctAnswer || ''
    );

    const igInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle,
      socialCaption: igCaption,
      extendedDescription,
      ctaPrimaryText,
      ctaCommentPrompt,
    });

    const igPassed = igInvariance.isValid && !igLeakage;
    if (!igPassed) isAllValid = false;

    let igStatus = SocialEnhancementStatus.VALIDATED;
    if (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !igPassed) {
      igStatus = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    variants[SocialPlatform.INSTAGRAM_REELS] = {
      platform: SocialPlatform.INSTAGRAM_REELS,
      title: undefined, // No standalone title for Instagram Reels
      caption: igCaption,
      description: undefined,
      hashtags: igHashtags,
      keywords,
      cta: {
        primaryText: ctaPrimaryText,
        pinnedCommentPrompt: ctaCommentPrompt,
      },
      characterCounts: {
        captionLength: getGraphemeCount(igCaption),
      },
      invarianceReport: igInvariance,
      invarianceCheckPassed: igInvariance.isValid,
      answerLeakageDetected: igLeakage,
      validationStatus: igStatus,
      generatedAt: now,
    };

    // --- C. FACEBOOK REELS ADAPTATION ---
    const fbConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.FACEBOOK_REELS];
    const fbHashtags = adaptHashtags(canonicalHashtags, fbConfig.maxHashtagsCount);
    let fbCaption = `${shortTitle}\n\n${socialCaption}\n\n👇 ${ctaPrimaryText}\n\n${fbHashtags.join(' ')}`.trim();

    if (getGraphemeCount(fbCaption) > fbConfig.maxCaptionLength) {
      fbCaption = safeTruncate(fbCaption, fbConfig.maxCaptionLength);
    }

    const fbLeakage = detectAnswerLeakage(
      [fbCaption],
      sourceQuestion.correctAnswer || ''
    );

    const fbInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle,
      socialCaption: fbCaption,
      extendedDescription,
      ctaPrimaryText,
      ctaCommentPrompt,
    });

    const fbPassed = fbInvariance.isValid && !fbLeakage;
    if (!fbPassed) isAllValid = false;

    let fbStatus = SocialEnhancementStatus.VALIDATED;
    if (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !fbPassed) {
      fbStatus = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    variants[SocialPlatform.FACEBOOK_REELS] = {
      platform: SocialPlatform.FACEBOOK_REELS,
      title: undefined, // No standalone title for Facebook Reels
      caption: fbCaption,
      description: undefined,
      hashtags: fbHashtags,
      keywords,
      cta: {
        primaryText: ctaPrimaryText,
      },
      characterCounts: {
        captionLength: getGraphemeCount(fbCaption),
      },
      invarianceReport: fbInvariance,
      invarianceCheckPassed: fbInvariance.isValid,
      answerLeakageDetected: fbLeakage,
      validationStatus: fbStatus,
      generatedAt: now,
    };

    // Assemble final MultiPlatformAdaptationPayload
    let overallStatus = SocialEnhancementStatus.VALIDATED;
    if (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !isAllValid) {
      overallStatus = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    const payload: MultiPlatformAdaptationPayload = {
      id: `PADAPT-${sourceQuestion.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: sourceQuestion.id,
      canonicalMetadataId: canonicalMetadata.id,
      language: language as QuestionLanguage,
      variants,
      isAllValid,
      aiCallsCount: 0, // Deterministic path requires 0 AI calls
      status: overallStatus,
      generatedAt: now,
    };

    return {
      payload,
      isEligible: true,
      reason: sourceQuestion.validationStatus === QuestionValidationStatus.VALID
        ? 'Successfully adapted metadata across YouTube Shorts, Instagram Reels, and Facebook Reels.'
        : 'Metadata adapted successfully, but source question status is NEEDS_REVIEW.',
    };
  }

  /**
   * Async variant that supports triggering AI fallback when requested or forced.
   * Executes AI generation via GeminiService in a SINGLE logical AI request.
   */
  public static async adaptMultiPlatformMetadataAsync(
    sourceQuestion: Question,
    canonicalMetadata: SocialMetadataPayload,
    options?: { forceAIFallback?: boolean; options?: AIProviderOptions }
  ): Promise<{
    payload?: MultiPlatformAdaptationPayload;
    isEligible: boolean;
    reason: string;
  }> {
    if (!options?.forceAIFallback) {
      return this.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    }

    if (!sourceQuestion || !sourceQuestion.id) {
      return { isEligible: false, reason: 'Source question record is missing.' };
    }

    if (sourceQuestion.validationStatus === QuestionValidationStatus.INVALID) {
      return {
        isEligible: false,
        reason: 'Cannot adapt metadata for an INVALID source question. Please fix source question first.',
      };
    }

    if (!canonicalMetadata || !canonicalMetadata.shortTitle) {
      return { isEligible: false, reason: 'Canonical SocialMetadataPayload is missing or incomplete.' };
    }

    const language = canonicalMetadata.language || sourceQuestion.language || QuestionLanguage.TELUGU;
    const now = new Date().toISOString();
    const sourceContext: SourceQuestionContext = {
      id: sourceQuestion.id,
      questionText: sourceQuestion.questionText || '',
      options: sourceQuestion.options || { a: '', b: '', c: '', d: '' },
      correctAnswer: sourceQuestion.correctAnswer || '',
      explanation: sourceQuestion.explanation,
      validationStatus: (sourceQuestion.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    const aiResult = await aiOrchestrator.generatePlatformAdaptation(
      sourceQuestion,
      canonicalMetadata,
      language as QuestionLanguage,
      options?.options
    );

    const raw = aiResult.rawVariants;
    const variants: Record<SocialPlatform, AdaptedPlatformPackage> = {} as any;
    let isAllValid = true;

    // YT
    const ytRaw = raw.youtubeShorts || {};
    const ytHashtags = adaptHashtags(ytRaw.hashtags || canonicalMetadata.hashtags, 5);
    const ytTitle = ytRaw.title || canonicalMetadata.shortTitle;
    const ytDesc = ytRaw.description || canonicalMetadata.extendedDescription;
    const ytLeakage = detectAnswerLeakage([ytTitle, ytDesc, ytRaw.pinnedCommentPrompt], sourceQuestion.correctAnswer || '');
    const ytInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle: ytTitle,
      socialCaption: canonicalMetadata.socialCaption,
      extendedDescription: ytDesc,
      ctaPrimaryText: ytRaw.primaryCta || canonicalMetadata.cta.primaryText,
      ctaCommentPrompt: ytRaw.pinnedCommentPrompt || canonicalMetadata.cta.pinnedCommentPrompt,
    });
    const ytPassed = ytInvariance.isValid && !ytLeakage;
    if (!ytPassed) isAllValid = false;

    variants[SocialPlatform.YOUTUBE_SHORTS] = {
      platform: SocialPlatform.YOUTUBE_SHORTS,
      title: ytTitle,
      caption: canonicalMetadata.socialCaption,
      description: ytDesc,
      hashtags: ytHashtags,
      keywords: ytRaw.keywords || canonicalMetadata.keywords,
      cta: {
        primaryText: ytRaw.primaryCta || canonicalMetadata.cta.primaryText,
        pinnedCommentPrompt: ytRaw.pinnedCommentPrompt || canonicalMetadata.cta.pinnedCommentPrompt,
      },
      characterCounts: {
        titleLength: getGraphemeCount(ytTitle),
        captionLength: getGraphemeCount(canonicalMetadata.socialCaption),
        descriptionLength: getGraphemeCount(ytDesc),
      },
      invarianceReport: ytInvariance,
      invarianceCheckPassed: ytInvariance.isValid,
      answerLeakageDetected: ytLeakage,
      validationStatus: (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !ytPassed)
        ? SocialEnhancementStatus.NEEDS_REVIEW
        : SocialEnhancementStatus.VALIDATED,
      generatedAt: now,
    };

    // IG
    const igRaw = raw.instagramReels || {};
    const igHashtags = adaptHashtags(igRaw.hashtags || canonicalMetadata.hashtags, 8);
    const igCap = igRaw.caption || canonicalMetadata.socialCaption;
    const igLeakage = detectAnswerLeakage([igCap, igRaw.commentPrompt], sourceQuestion.correctAnswer || '');
    const igInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle: canonicalMetadata.shortTitle,
      socialCaption: igCap,
      extendedDescription: canonicalMetadata.extendedDescription,
      ctaPrimaryText: igRaw.primaryCta || canonicalMetadata.cta.primaryText,
      ctaCommentPrompt: igRaw.commentPrompt || canonicalMetadata.cta.pinnedCommentPrompt,
    });
    const igPassed = igInvariance.isValid && !igLeakage;
    if (!igPassed) isAllValid = false;

    variants[SocialPlatform.INSTAGRAM_REELS] = {
      platform: SocialPlatform.INSTAGRAM_REELS,
      title: undefined,
      caption: igCap,
      description: undefined,
      hashtags: igHashtags,
      keywords: igRaw.keywords || canonicalMetadata.keywords,
      cta: {
        primaryText: igRaw.primaryCta || canonicalMetadata.cta.primaryText,
        pinnedCommentPrompt: igRaw.commentPrompt || canonicalMetadata.cta.pinnedCommentPrompt,
      },
      characterCounts: {
        captionLength: getGraphemeCount(igCap),
      },
      invarianceReport: igInvariance,
      invarianceCheckPassed: igInvariance.isValid,
      answerLeakageDetected: igLeakage,
      validationStatus: (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !igPassed)
        ? SocialEnhancementStatus.NEEDS_REVIEW
        : SocialEnhancementStatus.VALIDATED,
      generatedAt: now,
    };

    // FB
    const fbRaw = raw.facebookReels || {};
    const fbHashtags = adaptHashtags(fbRaw.hashtags || canonicalMetadata.hashtags, 5);
    const fbCap = fbRaw.caption || canonicalMetadata.socialCaption;
    const fbLeakage = detectAnswerLeakage([fbCap], sourceQuestion.correctAnswer || '');
    const fbInvariance = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle: canonicalMetadata.shortTitle,
      socialCaption: fbCap,
      extendedDescription: canonicalMetadata.extendedDescription,
      ctaPrimaryText: fbRaw.primaryCta || canonicalMetadata.cta.primaryText,
      ctaCommentPrompt: '',
    });
    const fbPassed = fbInvariance.isValid && !fbLeakage;
    if (!fbPassed) isAllValid = false;

    variants[SocialPlatform.FACEBOOK_REELS] = {
      platform: SocialPlatform.FACEBOOK_REELS,
      title: undefined,
      caption: fbCap,
      description: undefined,
      hashtags: fbHashtags,
      keywords: fbRaw.keywords || canonicalMetadata.keywords,
      cta: {
        primaryText: fbRaw.primaryCta || canonicalMetadata.cta.primaryText,
      },
      characterCounts: {
        captionLength: getGraphemeCount(fbCap),
      },
      invarianceReport: fbInvariance,
      invarianceCheckPassed: fbInvariance.isValid,
      answerLeakageDetected: fbLeakage,
      validationStatus: (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !fbPassed)
        ? SocialEnhancementStatus.NEEDS_REVIEW
        : SocialEnhancementStatus.VALIDATED,
      generatedAt: now,
    };

    let overallStatus = SocialEnhancementStatus.VALIDATED;
    if (sourceQuestion.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !isAllValid) {
      overallStatus = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    const payload: MultiPlatformAdaptationPayload = {
      id: `PADAPT-${sourceQuestion.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: sourceQuestion.id,
      canonicalMetadataId: canonicalMetadata.id,
      language: language as QuestionLanguage,
      variants,
      isAllValid,
      aiCallsCount: aiResult.aiCallsCount,
      status: overallStatus,
      generatedAt: now,
    };

    return {
      payload,
      isEligible: true,
      reason: 'Multi-platform metadata adapted via AI fallback.',
    };
  }

  private static instance: PlatformAdaptationService | null = null;

  public static getInstance(): PlatformAdaptationService {
    if (!PlatformAdaptationService.instance) {
      PlatformAdaptationService.instance = new PlatformAdaptationService();
    }
    return PlatformAdaptationService.instance;
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

    const { socialQualityGateService } = await import('./social-quality-gate.service');
    const pkg = await socialQualityGateService.assemblePackage(contentId);

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
    if (options?.forceFallback || !aiOrchestrator.isConfigured()) {
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

      const aiResponseResult = await aiOrchestrator.executeTask({
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
   * Retrieves an adaptation by ID.
   */
  public async getAdaptationById(adaptationId: string): Promise<PlatformAdaptationRecord | null> {
    return platformAdaptationsRepository.findById(adaptationId);
  }

  /**
   * Retrieves all adaptations for a content ID.
   */
  public async getAdaptationsByContentId(contentId: string): Promise<PlatformAdaptationRecord[]> {
    return platformAdaptationsRepository.findByContentId(contentId);
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

export const platformAdaptationService = PlatformAdaptationService.getInstance();
export const phase21PlatformAdaptationService = platformAdaptationService;
export type Phase21PlatformAdaptationService = PlatformAdaptationService;

