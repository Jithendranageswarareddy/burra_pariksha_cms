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
} from '../../types';
import {
  SocialInvarianceValidator,
  SourceQuestionContext,
} from '../validators/social-invariance.validator';
import { GeminiService } from '../ai/gemini.service';
import { AIProviderOptions } from '../ai/types';

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
      language,
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

    const aiResult = await GeminiService.getInstance().generatePlatformAdaptation(
      sourceQuestion,
      canonicalMetadata,
      language,
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
      language,
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
}
