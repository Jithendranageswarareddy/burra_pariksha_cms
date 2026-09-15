/**
 * BURRA PARIKSHA CMS - Social Enhancement Foundation Service
 * Phase 8B: Social Content Domain & Invariance Foundation
 * 
 * Provides domain-level utilities for checking source question eligibility,
 * constructing typed social enhancement contracts, invoking deterministic invariance validation,
 * and preparing versionable JSON snapshots for ScriptVersion compatibility.
 */

import {
  Question,
  QuestionValidationStatus,
  QuestionLanguage,
  SocialEnhancementPayload,
  SocialEnhancementStatus,
  HookStyle,
  SocialPlatform,
  SocialInvarianceReport,
  SpokenTeleprompterScriptPayload,
  SocialMetadataPayload,
  MultiPlatformAdaptationPayload,
  SocialQualityAssessmentPayload,
  TeleprompterSegment,
  TeleprompterSegmentSection,
} from '../../types';
import {
  SocialInvarianceValidator,
  SourceQuestionContext,
  EnhancedSocialScriptContext,
} from '../validators/social-invariance.validator';
import { phase24AIOrchestrator } from '../ai/phase24-orchestrator.service';
import { PlatformAdaptationService } from './platform-adaptation.service';
import { socialQualityService } from './social-quality.service';

export class SocialEnhancementService {
  /**
   * Evaluates whether a question is eligible for social media enhancement.
   */
  public static checkEligibility(question: Partial<Question>): {
    isEligible: boolean;
    reason: string;
  } {
    if (!question || !question.id) {
      return {
        isEligible: false,
        reason: 'Question record is missing or invalid.',
      };
    }

    const validationStatus = question.validationStatus || QuestionValidationStatus.NOT_VALIDATED;

    if (validationStatus === QuestionValidationStatus.INVALID) {
      return {
        isEligible: false,
        reason: 'Question has INVALID validation status. Please fix and re-validate the source question.',
      };
    }

    if (!question.questionText || question.questionText.trim().length < 10) {
      return {
        isEligible: false,
        reason: 'Question problem statement is too short or incomplete.',
      };
    }

    return {
      isEligible: true,
      reason: validationStatus === QuestionValidationStatus.VALID
        ? 'Question is fully validated and eligible for social media enhancement.'
        : 'Question is eligible for draft social enhancement, but requires source validation review before publishing.',
    };
  }

  /**
   * Invokes the 100% deterministic invariance guardrail validator.
   */
  public static validateInvariance(
    sourceQuestion: SourceQuestionContext,
    enhancedScript: EnhancedSocialScriptContext
  ): SocialInvarianceReport {
    return SocialInvarianceValidator.validateInvariance(sourceQuestion, enhancedScript);
  }

  /**
   * Constructs an initial typed draft payload for a source question.
   */
  public static createDraftPayload(
    question: Question,
    videoId?: string,
    contentMasterId?: string
  ): SocialEnhancementPayload {
    const now = new Date().toISOString();
    const eligibility = this.checkEligibility(question);

    const initialInvarianceReport = this.validateInvariance(
      {
        id: question.id,
        questionText: question.questionText,
        options: question.options || { a: '', b: '', c: '', d: '' },
        correctAnswer: question.correctAnswer || '',
        explanation: question.explanation,
        validationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
      },
      {
        problemStatement: question.questionText,
        stepByStepSolution: question.explanation,
      }
    );

    return {
      id: `SOC-${question.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: question.id,
      videoId: videoId || (question as any).videoId,
      contentMasterId: contentMasterId || question.contentMasterId,
      language: (question.language as QuestionLanguage) || QuestionLanguage.TELUGU,
      status: eligibility.isEligible ? SocialEnhancementStatus.DRAFT : SocialEnhancementStatus.REJECTED,
      selectedHookStyle: HookStyle.CURIOSITY,
      hooks: [
        {
          id: 'HOOK-1',
          style: HookStyle.CURIOSITY,
          text: '90% of students get this speed math question wrong!',
          spokenTeluguText: 'ఈ లెక్క చూసి 90% మంది తప్పు చేస్తారు!',
          onScreenOverlayText: '90% Fail This Speed Math!',
          estimatedDurationSeconds: 5,
        },
      ],
      presentationStrategy: {
        visualOpening: 'Bold high-contrast title card with countdown timer overlay',
        onScreenTitleOverlay: 'Burra Pariksha Speed Trick',
        questionRevealTimingMs: 1500,
        optionRevealTimingMs: 8000,
        answerRevealTimingMs: 20000,
        explanationTimingMs: 25000,
        visualEmphasisNotes: 'Highlight stream vs boat speed key formula in yellow',
        pacingWpm: 140,
      },
      cta: {
        callToActionText: 'Comment your answer before watching the solution!',
        spokenTeluguCta: 'మీ సమాధానం కామెంట్స్ లో చెప్పండి!',
        commentChallengePrompt: 'What is your answer? A, B, C or D?',
        sharePrompt: 'Share this speed challenge with your study group!',
      },
      caption: {
        title: 'Burra Speed Trick | APPSC & TSPSC Quant Challenge',
        description: `${question.questionText}\n\nCan you solve this challenge? Like & Share for daily exam challenges.`,
        hashtags: ['#BurraPariksha', '#APPSC', '#TSPSC', '#MathShortcuts', '#TeluguMath'],
        pinnedCommentText: `Correct Answer & Full Solution:\n${question.explanation || 'See video for step-by-step breakdown!'}`,
      },
      platformVariants: [
        {
          platform: SocialPlatform.YOUTUBE_SHORTS,
          maxDurationSeconds: 60,
          formattedCaption: 'Burra Speed Trick! #Shorts #APPSC #TSPSC #TeluguMath',
          aspectRatio: '9:16',
          recommendedHashtags: ['#Shorts', '#APPSC', '#TSPSC', '#TeluguMath'],
        },
        {
          platform: SocialPlatform.INSTAGRAM_REELS,
          maxDurationSeconds: 30,
          formattedCaption: 'Can you solve this challenge? 👇 Comment below! #Reels #Telugu',
          aspectRatio: '9:16',
          recommendedHashtags: ['#Reels', '#TeluguReels', '#ExamPreparation'],
        },
        {
          platform: SocialPlatform.FACEBOOK_REELS,
          maxDurationSeconds: 60,
          formattedCaption: 'మిత్రులారా, ఈ ప్రశ్నకు మీ సమాధానం కామెంట్ చేయండి! #BurraPariksha',
          aspectRatio: '9:16',
          recommendedHashtags: ['#BurraPariksha', '#TeluguCompetitiveExams'],
        },
      ],
      invarianceReport: initialInvarianceReport,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Prepares a versionable snapshot payload compatible with ScriptVersion contentJson.
   */
  public static prepareVersionablePayload(payload: SocialEnhancementPayload): Record<string, any> {
    return {
      versionType: 'SOCIAL_ENHANCED_SCRIPT',
      socialEnhancementId: payload.id,
      questionId: payload.questionId,
      selectedHookStyle: payload.selectedHookStyle,
      hooks: payload.hooks,
      presentationStrategy: payload.presentationStrategy,
      cta: payload.cta,
      caption: payload.caption,
      platformVariants: payload.platformVariants,
      invarianceReport: payload.invarianceReport,
      snapshotTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Phase 8C: Generates in-memory draft multi-hook variants and presentation strategy.
   * NON-PERSISTENT: Does NOT save to database, sheets, or write audit events.
   */
  public static async generateSocialEnhancementDraft(input: {
    question: Question;
    requestedStyles?: HookStyle[];
    language?: QuestionLanguage;
    videoId?: string;
    contentMasterId?: string;
  }): Promise<{
    payload: SocialEnhancementPayload;
    isEligible: boolean;
    reason: string;
    aiCallsCount: number;
  }> {
    const { question, requestedStyles, language, videoId, contentMasterId } = input;

    // 1. Source Question Safety & Eligibility Check
    const eligibility = this.checkEligibility(question);
    if (!eligibility.isEligible) {
      throw new Error(`Source question is ineligible for social enhancement: ${eligibility.reason}`);
    }

    const targetLanguage = language || question.language || QuestionLanguage.TELUGU;
    const stylesToGenerate = (requestedStyles && requestedStyles.length > 0)
      ? requestedStyles.slice(0, 5)
      : [
          HookStyle.CURIOSITY,
          HookStyle.BRAIN_CHALLENGE,
          HookStyle.SPEED_CHALLENGE,
          HookStyle.REAL_WORLD,
          HookStyle.EXAM_CHALLENGE,
        ];

    // 2. Invoke Bounded Single AI Call
    const aiResult = await phase24AIOrchestrator.generateSocialHooksAndStrategy(
      question,
      stylesToGenerate,
      targetLanguage as QuestionLanguage
    );

    // 3. Post-Generation Deterministic Invariance Check across all generated hooks
    let hasViolation = false;
    let hasReviewFlag = question.validationStatus === QuestionValidationStatus.NEEDS_REVIEW;

    const sourceContext: SourceQuestionContext = {
      id: question.id,
      questionText: question.questionText,
      options: question.options || { a: '', b: '', c: '', d: '' },
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation,
      validationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    // Run deterministic invariance checks for each hook text
    const validatedHooks = aiResult.hooks.map((hook) => {
      const invReport = SocialInvarianceValidator.validateInvariance(sourceContext, {
        hookText: `${hook.text} ${hook.spokenTeluguText}`,
        problemStatement: question.questionText,
        stepByStepSolution: question.explanation,
      });

      // Answer Leakage Detection: check if hook reveals the correct option explicitly
      const correctKey = (question.correctAnswer || '').trim().toUpperCase();
      const correctOptionText = ((question.options as any)?.[correctKey.toLowerCase()] || '').trim();
      let answerLeakageDetected = false;

      if (correctOptionText && correctOptionText.length > 2) {
        if (hook.text.toLowerCase().includes(`option ${correctKey.toLowerCase()}`) ||
            hook.text.toLowerCase().includes(`సమాధానం ${correctKey.toLowerCase()}`) ||
            hook.spokenTeluguText.toLowerCase().includes(`option ${correctKey.toLowerCase()}`)) {
          answerLeakageDetected = true;
        }
      }

      const hookCheckPassed = invReport.isValid && !answerLeakageDetected;
      if (!hookCheckPassed) {
        hasViolation = true;
      }

      return {
        ...hook,
        invarianceCheckPassed: hookCheckPassed,
        answerLeakageDetected,
      };
    });

    // Determine final status based on source question status and invariance results
    let status = SocialEnhancementStatus.DRAFT;
    if (question.validationStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      status = SocialEnhancementStatus.NEEDS_REVIEW;
    } else if (hasViolation) {
      status = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    const overallInvarianceReport = SocialInvarianceValidator.validateInvariance(sourceContext, {
      problemStatement: question.questionText,
      stepByStepSolution: question.explanation,
    });

    const now = new Date().toISOString();

    const payload: SocialEnhancementPayload = {
      id: `SOC-${question.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: question.id,
      videoId: videoId || (question as any).videoId,
      contentMasterId: contentMasterId || question.contentMasterId,
      language: targetLanguage as QuestionLanguage,
      status,
      selectedHookStyle: stylesToGenerate[0] || HookStyle.CURIOSITY,
      hooks: validatedHooks,
      presentationStrategy: aiResult.presentationStrategy,
      cta: {
        callToActionText: 'Comment your answer before watching the solution!',
        spokenTeluguCta: 'మీ సమాధానం కామెంట్స్ లో చెప్పండి!',
        commentChallengePrompt: 'What is your answer? A, B, C or D?',
        sharePrompt: 'Share this speed challenge with your study group!',
      },
      caption: {
        title: `Burra Speed Trick | ${question.topicName || 'Aptitude'} Challenge`,
        description: `${question.questionText}\n\nCan you solve this challenge? Like & Share for daily exam challenges.`,
        hashtags: ['#BurraPariksha', '#APPSC', '#TSPSC', '#MathShortcuts', '#TeluguMath'],
        pinnedCommentText: `Correct Answer & Full Solution:\n${question.explanation || 'See video for step-by-step breakdown!'}`,
      },
      platformVariants: [
        {
          platform: SocialPlatform.YOUTUBE_SHORTS,
          maxDurationSeconds: 60,
          formattedCaption: 'Burra Speed Trick! #Shorts #APPSC #TSPSC #TeluguMath',
          aspectRatio: '9:16',
          recommendedHashtags: ['#Shorts', '#APPSC', '#TSPSC', '#TeluguMath'],
        },
        {
          platform: SocialPlatform.INSTAGRAM_REELS,
          maxDurationSeconds: 30,
          formattedCaption: 'Can you solve this challenge? 👇 Comment below! #Reels #Telugu',
          aspectRatio: '9:16',
          recommendedHashtags: ['#Reels', '#TeluguReels', '#ExamPreparation'],
        },
        {
          platform: SocialPlatform.FACEBOOK_REELS,
          maxDurationSeconds: 60,
          formattedCaption: 'మిత్రులారా, ఈ ప్రశ్నకు మీ సమాధానం కామెంట్ చేయండి! #BurraPariksha',
          aspectRatio: '9:16',
          recommendedHashtags: ['#BurraPariksha', '#TeluguCompetitiveExams'],
        },
      ],
      invarianceReport: overallInvarianceReport,
      createdAt: now,
      updatedAt: now,
    };

    return {
      payload,
      isEligible: true,
      reason: eligibility.reason,
      aiCallsCount: aiResult.metadata.aiCallsCount,
    };
  }

  /**
   * Phase 8D: Generates an in-memory draft spoken teleprompter script payload.
   * NON-PERSISTENT: Does NOT save to database, sheets, or write audit events.
   */
  public static async generateSpokenTeleprompterDraft(input: {
    question: Question;
    selectedHookText: string;
    selectedHookStyle?: HookStyle;
    language?: QuestionLanguage;
    pacingWpm?: number;
  }): Promise<{
    payload: SpokenTeleprompterScriptPayload;
    isEligible: boolean;
    reason: string;
    aiCallsCount: number;
  }> {
    const { question, selectedHookText, selectedHookStyle, language, pacingWpm } = input;

    // 1. Source Question Safety & Eligibility Check
    const eligibility = this.checkEligibility(question);
    if (!eligibility.isEligible) {
      throw new Error(`Source question is ineligible for teleprompter enhancement: ${eligibility.reason}`);
    }

    const targetLanguage = language || question.language || QuestionLanguage.TELUGU;
    const targetHookStyle = selectedHookStyle || HookStyle.CURIOSITY;
    const targetWpm = pacingWpm || 140;

    // 2. Invoke Bounded Single AI Call
    const aiResult = await phase24AIOrchestrator.generateSpokenTeleprompterScript(
      question,
      selectedHookText,
      targetHookStyle,
      targetLanguage as QuestionLanguage,
      targetWpm
    );

    // 3. Post-Generation Answer Leakage Check on Pre-Solution Segments
    const preSolutionSections = ['HOOK', 'HOOK_TRANSITION', 'QUESTION', 'OPTIONS', 'PAUSE_CHALLENGE'];
    const preSolutionSegments = aiResult.segments.filter((s) => preSolutionSections.includes(s.section));
    const preSolutionText = preSolutionSegments.map((s) => `${s.spokenText} ${s.teleprompterText}`).join(' ');

    const correctKey = (question.correctAnswer || '').trim().toUpperCase();
    let answerLeakageDetected = false;

    if (correctKey) {
      const lowerPreText = preSolutionText.toLowerCase();
      const leakagePatterns = [
        `option ${correctKey.toLowerCase()}`,
        `ఆప్షన్ ${correctKey.toLowerCase()}`,
        `సరైన సమాధానం ${correctKey.toLowerCase()}`,
        `correct option is ${correctKey.toLowerCase()}`,
        `answer is ${correctKey.toLowerCase()}`,
        `ఆన్సర్ ${correctKey.toLowerCase()}`,
      ];

      for (const pattern of leakagePatterns) {
        if (lowerPreText.includes(pattern)) {
          answerLeakageDetected = true;
          break;
        }
      }
    }

    // 4. Post-Generation Deterministic Invariance Check
    const sourceContext: SourceQuestionContext = {
      id: question.id,
      questionText: question.questionText,
      options: question.options || { a: '', b: '', c: '', d: '' },
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation,
      validationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    const fullSpokenText = aiResult.segments.map((s) => `${s.spokenText}\n${s.teleprompterText}`).join('\n\n');
    const invarianceReport = this.validateInvariance(sourceContext, {
      hookText: selectedHookText,
      problemStatement: question.questionText,
      stepByStepSolution: question.explanation,
      spokenNarrationText: fullSpokenText,
    });

    const invarianceCheckPassed = invarianceReport.isValid && !answerLeakageDetected;

    // 5. Determine Final Status
    let status = SocialEnhancementStatus.DRAFT;
    if (question.validationStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      status = SocialEnhancementStatus.NEEDS_REVIEW;
    } else if (!invarianceCheckPassed) {
      status = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    const normalizedSegments: TeleprompterSegment[] = aiResult.segments.map((seg, idx) => {
      const isPauseChallenge = seg.section === TeleprompterSegmentSection.PAUSE_CHALLENGE;
      const pauseSec = typeof seg.pauseDurationSeconds === 'number' && seg.pauseDurationSeconds > 0
        ? seg.pauseDurationSeconds
        : typeof seg.pauseAfterMs === 'number' && seg.pauseAfterMs > 0
          ? seg.pauseAfterMs / 1000
          : isPauseChallenge
            ? 1.5
            : 0;

      const pauseMs = typeof seg.pauseAfterMs === 'number' && seg.pauseAfterMs > 0
        ? seg.pauseAfterMs
        : pauseSec * 1000;

      return {
        ...seg,
        pauseDurationSeconds: pauseSec,
        pauseAfterMs: pauseMs,
        emphasisWords: Array.isArray(seg.emphasisWords) ? seg.emphasisWords : [],
        visualCardPrompt: seg.visualCardPrompt || seg.onScreenOverlay || `Card ${idx + 1}`,
        onScreenText: seg.onScreenText || seg.onScreenOverlay || seg.teleprompterText || '',
        onScreenOverlay: seg.onScreenOverlay || seg.onScreenText || '',
      };
    });

    const payload: SpokenTeleprompterScriptPayload = {
      id: `TEL-${question.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: question.id,
      selectedHookStyle: targetHookStyle,
      selectedHookText,
      language: targetLanguage as QuestionLanguage,
      totalEstimatedDurationSeconds: aiResult.totalEstimatedDurationSeconds,
      pacingWpm: aiResult.pacingWpm,
      segments: normalizedSegments,
      invarianceReport,
      invarianceCheckPassed,
      answerLeakageDetected,
      status,
      generatedAt: new Date().toISOString(),
    };

    return {
      payload,
      isEligible: true,
      reason: eligibility.reason,
      aiCallsCount: aiResult.metadata.aiCallsCount,
    };
  }

  /**
   * Phase 8E: Generates a canonical SocialMetadataPayload draft for a question.
   */
  public static async generateSocialMetadataDraft(
    question: Partial<Question>,
    selectedHookText?: string,
    teleprompterScript?: SpokenTeleprompterScriptPayload,
    language?: QuestionLanguage
  ): Promise<{
    payload?: SocialMetadataPayload;
    isEligible: boolean;
    reason: string;
    aiCallsCount: number;
  }> {
    // 1. Eligibility Gate
    const eligibility = this.checkEligibility(question);
    if (!eligibility.isEligible) {
      return {
        isEligible: false,
        reason: eligibility.reason,
        aiCallsCount: 0,
      };
    }

    const targetLanguage = language || question.language || QuestionLanguage.TELUGU;

    // 2. Invoke AI (or Fallback) via Phase24 AI Orchestrator in ONE call
    const aiResult = await phase24AIOrchestrator.generateSocialMetadata(
      question,
      selectedHookText,
      teleprompterScript,
      targetLanguage as QuestionLanguage
    );

    // 3. Answer Leakage Check
    const correctKey = (question.correctAnswer || '').trim().toUpperCase();
    const correctOptionText = question.options ? (question.options as any)[correctKey.toLowerCase()] : '';
    let answerLeakageDetected = false;

    const checkTextSurfaces = [
      aiResult.metadata.shortTitle,
      aiResult.metadata.socialCaption,
      aiResult.metadata.extendedDescription,
      aiResult.metadata.cta.primaryText,
      aiResult.metadata.cta.pinnedCommentPrompt,
    ];

    if (correctKey) {
      const leakageRegexes = [
        new RegExp(`(?:correct\\s+(?:answer|option)|answer\\s+is|సమాధానం|ఆప్షన్)\\s*[:=]?\\s*(${correctKey})\\b`, 'i'),
        new RegExp(`(?:correct\\s+option|correct\\s+answer)\\s*[:=]?\\s*([A-D])\\b`, 'i'),
      ];

      for (const textSurface of checkTextSurfaces) {
        for (const regex of leakageRegexes) {
          if (regex.test(textSurface)) {
            answerLeakageDetected = true;
            break;
          }
        }
        if (answerLeakageDetected) break;
      }
    }

    // 4. Clickbait & False Claim Check
    const combinedMetaText = checkTextSurfaces.join(' ');
    const clickbaitPatterns = [
      /\b100%\s*of\s*people\s*fail\b/i,
      /\b1\s*in\s*10,?000\b/i,
      /\bimpossible\s*for\s*anyone\b/i,
      /\bonly\s*geniuses\s*can\s*solve\b/i,
      /\basked\s*in\s*ias\s*2024\b/i,
      /\btspsc\s*group\s*1\s*official\b/i,
    ];

    let clickbaitDetected = false;
    for (const pattern of clickbaitPatterns) {
      if (pattern.test(combinedMetaText)) {
        const sourceText = question.questionText || '';
        if (!pattern.test(sourceText)) {
          clickbaitDetected = true;
          break;
        }
      }
    }

    // 5. Fact Preservation Invariance Check
    const sourceContext: SourceQuestionContext = {
      id: question.id!,
      questionText: question.questionText || '',
      options: question.options || { a: '', b: '', c: '', d: '' },
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation,
      validationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    const invarianceReport = SocialInvarianceValidator.validateMetadataInvariance(sourceContext, {
      shortTitle: aiResult.metadata.shortTitle,
      socialCaption: aiResult.metadata.socialCaption,
      extendedDescription: aiResult.metadata.extendedDescription,
      ctaPrimaryText: aiResult.metadata.cta.primaryText,
      ctaCommentPrompt: aiResult.metadata.cta.pinnedCommentPrompt,
    });

    if (clickbaitDetected) {
      invarianceReport.violations.push({
        anchorType: 'CLICKBAIT_PROTECTION',
        severity: 'CRITICAL',
        message: 'Clickbait or fabricated claim detected in social metadata.',
        originalFragment: 'Authentic challenge framing',
        mutatedFragment: combinedMetaText.substring(0, 80),
      });
      invarianceReport.isValid = false;
      invarianceReport.status = 'INVALID';
    }

    const invarianceCheckPassed = invarianceReport.isValid && !answerLeakageDetected && !clickbaitDetected;

    // 6. Final Status Calculation
    let status = SocialEnhancementStatus.DRAFT;
    if (question.validationStatus === QuestionValidationStatus.NEEDS_REVIEW || !invarianceCheckPassed) {
      status = SocialEnhancementStatus.NEEDS_REVIEW;
    }

    const payload: SocialMetadataPayload = {
      id: `SMETA-${question.id}-${Date.now().toString(36).toUpperCase()}`,
      questionId: question.id!,
      language: targetLanguage as QuestionLanguage,
      shortTitle: aiResult.metadata.shortTitle,
      socialCaption: aiResult.metadata.socialCaption,
      extendedDescription: aiResult.metadata.extendedDescription,
      hashtags: aiResult.metadata.hashtags,
      keywords: aiResult.metadata.keywords,
      topicLabel: aiResult.metadata.topicLabel,
      subtopicLabel: aiResult.metadata.subtopicLabel,
      difficultyLabel: aiResult.metadata.difficultyLabel,
      challengeTypeLabel: aiResult.metadata.challengeTypeLabel,
      cta: aiResult.metadata.cta,
      invarianceReport,
      invarianceCheckPassed,
      answerLeakageDetected,
      status,
      generatedAt: new Date().toISOString(),
    };

    return {
      payload,
      isEligible: true,
      reason: eligibility.reason,
      aiCallsCount: aiResult.aiCallsCount,
    };
  }

  /**
   * Phase 8F: Multi-Platform Adaptation Engine Wrapper.
   */
  public static adaptMultiPlatformMetadata(
    question: Question,
    canonicalMetadata: SocialMetadataPayload
  ): {
    payload?: MultiPlatformAdaptationPayload;
    isEligible: boolean;
    reason: string;
  } {
    return PlatformAdaptationService.adaptMultiPlatformMetadata(question, canonicalMetadata);
  }

  public static async adaptMultiPlatformMetadataAsync(
    question: Question,
    canonicalMetadata: SocialMetadataPayload,
    options?: { forceAIFallback?: boolean; options?: any }
  ): Promise<{
    payload?: MultiPlatformAdaptationPayload;
    isEligible: boolean;
    reason: string;
  }> {
    return PlatformAdaptationService.adaptMultiPlatformMetadataAsync(question, canonicalMetadata, options);
  }

  /**
   * Phase 8G: Social Content Quality & Engagement Intelligence Engine Wrapper.
   */
  public static async assessQuality(
    question: Question,
    enhancementPackage: SocialEnhancementPayload,
    platformAdaptations?: MultiPlatformAdaptationPayload,
    options?: { forceAIFallback?: boolean; skipAI?: boolean; aiProviderOptions?: any }
  ): Promise<SocialQualityAssessmentPayload> {
    return socialQualityService.assessContentQuality(question, enhancementPackage, platformAdaptations, options);
  }
}
