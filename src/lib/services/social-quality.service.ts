/**
 * BURRA PARIKSHA CMS - Social Content Quality & Engagement Intelligence Service
 * Phase 8G: Quality & Engagement Intelligence Engine
 */

import {
  MultiPlatformAdaptationPayload,
  Question,
  QuestionValidationStatus,
  SocialEnhancementPayload,
  SocialInvarianceReport,
  SocialPlatform,
  SocialQualityAssessmentMethod,
  SocialQualityAssessmentPayload,
  SocialQualityDimension,
  SocialQualityFinding,
  SocialQualityFindingSeverity,
  SocialQualityStatus,
  PLATFORM_ADAPTATION_CONFIG,
} from '../../types';
import {
  SocialInvarianceValidator,
  SourceQuestionContext,
  EnhancedSocialScriptContext,
} from '../validators/social-invariance.validator';
import { phase24AIOrchestrator } from '../ai/phase24-orchestrator.service';
import { AIProviderOptions } from '../ai/types';
import { detectAnswerLeakage } from './platform-adaptation.service';

export const QUALITY_DIMENSION_WEIGHTS: Record<SocialQualityDimension, number> = {
  [SocialQualityDimension.ANSWER_INTEGRITY]: 0.15,
  [SocialQualityDimension.CLARITY]: 0.10,
  [SocialQualityDimension.CURIOSITY]: 0.10,
  [SocialQualityDimension.COMMENTABILITY]: 0.10,
  [SocialQualityDimension.RETENTION_POTENTIAL]: 0.10,
  [SocialQualityDimension.LANGUAGE_QUALITY]: 0.10,
  [SocialQualityDimension.SOCIAL_PRESENTATION]: 0.10,
  [SocialQualityDimension.CHALLENGE_QUALITY]: 0.05,
  [SocialQualityDimension.REAL_LIFE_RELEVANCE]: 0.05,
  [SocialQualityDimension.AUDIENCE_SUITABILITY]: 0.05,
  [SocialQualityDimension.REPETITION_RISK]: 0.05,
  [SocialQualityDimension.AUDIENCE_APPEAL]: 0.05,
};

export class SocialQualityService {
  private static instance: SocialQualityService;

  public static getInstance(): SocialQualityService {
    if (!SocialQualityService.instance) {
      SocialQualityService.instance = new SocialQualityService();
    }
    return SocialQualityService.instance;
  }

  /**
   * Assesses content quality and engagement intelligence across 10 dimensions.
   * Performs deterministic pre-checks FIRST. If blocking errors are detected,
   * returns immediately with 0 AI calls.
   */
  public async assessContentQuality(
    sourceQuestion: Question,
    enhancementPackage: SocialEnhancementPayload,
    platformAdaptations?: MultiPlatformAdaptationPayload,
    options?: {
      forceAIFallback?: boolean;
      skipAI?: boolean;
      aiProviderOptions?: AIProviderOptions;
    }
  ): Promise<SocialQualityAssessmentPayload> {
    const generatedAt = new Date().toISOString();
    const payloadId = `SQUAL-${sourceQuestion.id || 'CM'}-${Date.now()}`;

    // Step 1: Perform Deterministic Pre-Checks
    const deterministicFindings: SocialQualityFinding[] = [];

    // Check 1.1: Source Question Validation Status
    if (sourceQuestion.validationStatus !== QuestionValidationStatus.VALID) {
      deterministicFindings.push({
        id: `FIND-${Date.now()}-1`,
        dimension: SocialQualityDimension.ANSWER_INTEGRITY,
        severity: SocialQualityFindingSeverity.BLOCKING,
        code: 'INVALID_SOURCE_QUESTION',
        message: `Source question validation status is '${sourceQuestion.validationStatus}'. Must be VALID before quality assessment.`,
        context: sourceQuestion.id,
        suggestedFix: 'Re-validate source question through Question Validation Engine.',
      });
    }

    // Check 1.2: Options Uniqueness & Count
    const optionsArray: Array<{ identifier: string; text: string }> = Array.isArray(sourceQuestion.options)
      ? sourceQuestion.options
      : typeof sourceQuestion.options === 'object' && sourceQuestion.options !== null
      ? Object.entries(sourceQuestion.options).map(([k, v]) => ({ identifier: k.toUpperCase(), text: String(v) }))
      : [];

    if (optionsArray.length !== 4) {
      deterministicFindings.push({
        id: `FIND-${Date.now()}-2`,
        dimension: SocialQualityDimension.CHALLENGE_QUALITY,
        severity: SocialQualityFindingSeverity.BLOCKING,
        code: 'INVALID_OPTION_COUNT',
        message: `Question must contain exactly 4 options. Found ${optionsArray.length}.`,
        context: sourceQuestion.id,
        suggestedFix: 'Provide exactly 4 distinct options (A, B, C, D).',
      });
    } else {
      const texts = optionsArray.map((o) => o.text.trim().toLowerCase());
      const uniqueTexts = new Set(texts);
      if (uniqueTexts.size < 4) {
        deterministicFindings.push({
          id: `FIND-${Date.now()}-2B`,
          dimension: SocialQualityDimension.CHALLENGE_QUALITY,
          severity: SocialQualityFindingSeverity.BLOCKING,
          code: 'DUPLICATE_OPTIONS',
          message: 'Question options contain duplicate or identical choices.',
          context: sourceQuestion.id,
          suggestedFix: 'Ensure all 4 option texts are unique.',
        });
      }
    }

    // Check 1.3: Deterministic Invariance Check
    const optionsObj = Array.isArray(sourceQuestion.options)
      ? {
          a: sourceQuestion.options.find((o) => o.identifier.toUpperCase() === 'A')?.text || sourceQuestion.options[0]?.text || '',
          b: sourceQuestion.options.find((o) => o.identifier.toUpperCase() === 'B')?.text || sourceQuestion.options[1]?.text || '',
          c: sourceQuestion.options.find((o) => o.identifier.toUpperCase() === 'C')?.text || sourceQuestion.options[2]?.text || '',
          d: sourceQuestion.options.find((o) => o.identifier.toUpperCase() === 'D')?.text || sourceQuestion.options[3]?.text || '',
        }
      : (sourceQuestion.options as any) || { a: '', b: '', c: '', d: '' };

    const sourceContext: SourceQuestionContext = {
      id: sourceQuestion.id,
      questionText: sourceQuestion.questionText,
      options: optionsObj,
      correctAnswer: sourceQuestion.correctAnswer || '',
      explanation: sourceQuestion.explanation,
      validationStatus: (sourceQuestion.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
    };

    const enhancedContext: EnhancedSocialScriptContext = {
      hookText: enhancementPackage.hooks?.map((h) => `${h.text} ${h.spokenTeluguText}`).join(' ') || '',
      spokenNarrationText: enhancementPackage.teleprompterScript?.segments?.map((s) => `${s.spokenText} ${s.teleprompterText}`).join(' ') || '',
      fullScriptText: `${enhancementPackage.metadata?.shortTitle || ''} ${enhancementPackage.metadata?.socialCaption || ''} ${enhancementPackage.metadata?.extendedDescription || ''}`,
    };

    const invarianceReport: SocialInvarianceReport = SocialInvarianceValidator.validateInvariance(
      sourceContext,
      enhancedContext
    );

    if (!invarianceReport.isValid || invarianceReport.mutatedAnchorsCount > 0) {
      deterministicFindings.push({
        id: `FIND-${Date.now()}-3`,
        dimension: SocialQualityDimension.ANSWER_INTEGRITY,
        severity: SocialQualityFindingSeverity.BLOCKING,
        code: 'INVARIANCE_VIOLATION',
        message: `Social enhancement mutated ${invarianceReport.mutatedAnchorsCount} factual anchors. Violations: ${invarianceReport.violations.map((v) => v.message).join('; ')}`,
        context: sourceQuestion.id,
        suggestedFix: 'Ensure numeric values, units, currencies, and option choices are preserved verbatim.',
      });
    }

    // Check 1.4: Deterministic Answer Leakage Check
    let leakageDetected = false;
    let leakageDetails = '';
    const correctAnswer = sourceQuestion.correctAnswer || '';

    // Check hooks
    if (enhancementPackage.hooks) {
      for (const hook of enhancementPackage.hooks) {
        if (detectAnswerLeakage([hook.text, hook.spokenTeluguText], correctAnswer)) {
          leakageDetected = true;
          leakageDetails += `Hook '${hook.text}' contains answer leakage. `;
        }
      }
    }

    // Check script
    if (enhancementPackage.teleprompterScript?.segments) {
      for (const seg of enhancementPackage.teleprompterScript.segments) {
        // Ignore solution section as solution is supposed to reveal the answer
        if (seg.section !== ('SOLUTION' as any) && detectAnswerLeakage([seg.spokenText, seg.teleprompterText], correctAnswer)) {
          leakageDetected = true;
          leakageDetails += `Segment '${seg.section}' contains answer leakage before solution reveal. `;
        }
      }
    }

    // Check metadata
    if (enhancementPackage.metadata) {
      const meta = enhancementPackage.metadata;
      if (
        detectAnswerLeakage(
          [meta.shortTitle, meta.socialCaption, meta.cta.primaryText, meta.cta.pinnedCommentPrompt],
          correctAnswer
        )
      ) {
        leakageDetected = true;
        leakageDetails += `Canonical metadata contains answer leakage. `;
      }
    }

    // Check platform adaptations if provided
    if (platformAdaptations?.variants) {
      for (const p of Object.keys(platformAdaptations.variants) as SocialPlatform[]) {
        const v = platformAdaptations.variants[p];
        if (v && detectAnswerLeakage([v.title || '', v.caption, v.description || ''], correctAnswer)) {
          leakageDetected = true;
          leakageDetails += `Platform adaptation ${p} contains answer leakage. `;
        }
      }
    }

    if (leakageDetected) {
      deterministicFindings.push({
        id: `FIND-${Date.now()}-4`,
        dimension: SocialQualityDimension.ANSWER_INTEGRITY,
        severity: SocialQualityFindingSeverity.BLOCKING,
        code: 'ANSWER_LEAKAGE',
        message: `Answer disclosure detected in content: ${leakageDetails.trim()}`,
        context: sourceQuestion.id,
        suggestedFix: 'Remove explicit option choices or correct answer mentions from pre-reveal content.',
      });
    }

    // Check 1.5: Mandatory Brand Hashtag #BurraPariksha
    let missingBrandHashtag = false;
    if (enhancementPackage.metadata) {
      if (!enhancementPackage.metadata.hashtags || !enhancementPackage.metadata.hashtags.includes('#BurraPariksha')) {
        missingBrandHashtag = true;
      }
    }
    if (platformAdaptations?.variants) {
      for (const p of Object.keys(platformAdaptations.variants) as SocialPlatform[]) {
        const v = platformAdaptations.variants[p];
        if (v && (!v.hashtags || !v.hashtags.includes('#BurraPariksha'))) {
          missingBrandHashtag = true;
        }
      }
    }

    if (missingBrandHashtag) {
      deterministicFindings.push({
        id: `FIND-${Date.now()}-5`,
        dimension: SocialQualityDimension.SOCIAL_PRESENTATION,
        severity: SocialQualityFindingSeverity.BLOCKING,
        code: 'MISSING_BRAND_HASHTAG',
        message: 'Mandatory brand hashtag #BurraPariksha is missing from hashtags list.',
        context: sourceQuestion.id,
        suggestedFix: 'Ensure #BurraPariksha is included as the primary hashtag.',
      });
    }

    // Check 1.6: Hard Platform Constraints
    if (platformAdaptations?.variants) {
      for (const p of Object.keys(platformAdaptations.variants) as SocialPlatform[]) {
        const v = platformAdaptations.variants[p];
        const config = PLATFORM_ADAPTATION_CONFIG[p];
        if (v && config) {
          if (config.maxTitleLength && v.title && v.title.length > config.maxTitleLength) {
            deterministicFindings.push({
              id: `FIND-${Date.now()}-6-${p}`,
              dimension: SocialQualityDimension.SOCIAL_PRESENTATION,
              severity: SocialQualityFindingSeverity.BLOCKING,
              code: 'PLATFORM_TITLE_LIMIT_EXCEEDED',
              message: `${config.displayName} title length (${v.title.length}) exceeds maximum limit (${config.maxTitleLength}).`,
              context: p,
              suggestedFix: `Shorten title to $\\le ${config.maxTitleLength}$ characters.`,
            });
          }
          if (v.caption.length > config.maxCaptionLength) {
            deterministicFindings.push({
              id: `FIND-${Date.now()}-7-${p}`,
              dimension: SocialQualityDimension.SOCIAL_PRESENTATION,
              severity: SocialQualityFindingSeverity.BLOCKING,
              code: 'PLATFORM_CAPTION_LIMIT_EXCEEDED',
              message: `${config.displayName} caption length (${v.caption.length}) exceeds maximum limit (${config.maxCaptionLength}).`,
              context: p,
              suggestedFix: `Shorten caption to $\\le ${config.maxCaptionLength}$ characters.`,
            });
          }
          if (v.hashtags.length > config.maxHashtagsCount) {
            deterministicFindings.push({
              id: `FIND-${Date.now()}-8-${p}`,
              dimension: SocialQualityDimension.SOCIAL_PRESENTATION,
              severity: SocialQualityFindingSeverity.BLOCKING,
              code: 'PLATFORM_HASHTAG_LIMIT_EXCEEDED',
              message: `${config.displayName} hashtag count (${v.hashtags.length}) exceeds maximum limit (${config.maxHashtagsCount}).`,
              context: p,
              suggestedFix: `Reduce hashtags to $\\le ${config.maxHashtagsCount}$.`,
            });
          }
        }
      }
    }

    // Filter blocking vs advisory deterministic findings
    const blockingDeterministic = deterministicFindings.filter(
      (f) => f.severity === SocialQualityFindingSeverity.BLOCKING
    );

    // CRITICAL GATING RULE:
    // If ANY deterministic BLOCKING failure exists, STOP IMMEDIATELY with 0 AI calls.
    if (blockingDeterministic.length > 0) {
      const dimensionScores: Record<SocialQualityDimension, number> = {
        [SocialQualityDimension.ANSWER_INTEGRITY]: 0,
        [SocialQualityDimension.CLARITY]: 50,
        [SocialQualityDimension.CURIOSITY]: 50,
        [SocialQualityDimension.CHALLENGE_QUALITY]: 50,
        [SocialQualityDimension.COMMENTABILITY]: 50,
        [SocialQualityDimension.RETENTION_POTENTIAL]: 50,
        [SocialQualityDimension.REAL_LIFE_RELEVANCE]: 50,
        [SocialQualityDimension.SOCIAL_PRESENTATION]: 50,
        [SocialQualityDimension.LANGUAGE_QUALITY]: 50,
        [SocialQualityDimension.AUDIENCE_SUITABILITY]: 50,
        [SocialQualityDimension.REPETITION_RISK]: 50,
        [SocialQualityDimension.AUDIENCE_APPEAL]: 50,
      };

      return {
        id: payloadId,
        questionId: sourceQuestion.id,
        overallScore: 0,
        status: SocialQualityStatus.REJECTED,
        dimensionScores,
        blockingFindings: blockingDeterministic,
        advisoryFindings: deterministicFindings.filter((f) => f.severity === SocialQualityFindingSeverity.ADVISORY),
        recommendations: blockingDeterministic.map((f) => f.suggestedFix || f.message),
        confidence: 1.0,
        assessmentMethod: 'DETERMINISTIC_ONLY',
        aiCallsCount: 0,
        invarianceReport,
        generatedAt,
      };
    }

    // Step 2: Skip AI or Force Fallback if requested
    if (options?.skipAI) {
      const fallbackAI = phase24AIOrchestrator.createFallbackSocialQualityAssessment(sourceQuestion, enhancementPackage);
      return this.buildFinalPayload(
        payloadId,
        sourceQuestion.id,
        fallbackAI,
        deterministicFindings,
        1.0,
        'DETERMINISTIC_FALLBACK',
        0,
        invarianceReport,
        generatedAt
      );
    }

    // Step 3: AI Semantic Assessment (1 Logical Call)
    let aiCallsCount = 0;
    let method: SocialQualityAssessmentMethod = 'AI_HYBRID';
    let aiOutput: any = null;

    try {
      const result = await phase24AIOrchestrator.generateSocialQualityAssessment(
        sourceQuestion,
        enhancementPackage,
        platformAdaptations,
        options?.aiProviderOptions
      );
      aiOutput = result.rawOutput;
      aiCallsCount = result.aiCallsCount;
      if (result.info.fallbackUsed) {
        method = 'DETERMINISTIC_FALLBACK';
      }
    } catch (err) {
      console.warn('[SocialQualityService] AI assessment error, using fallback:', err);
      aiOutput = phase24AIOrchestrator.createFallbackSocialQualityAssessment(sourceQuestion, enhancementPackage);
      method = 'DETERMINISTIC_FALLBACK';
      aiCallsCount = 1;
    }

    return this.buildFinalPayload(
      payloadId,
      sourceQuestion.id,
      aiOutput,
      deterministicFindings,
      aiOutput.confidence || 0.9,
      method,
      aiCallsCount,
      invarianceReport,
      generatedAt
    );
  }

  /**
   * Helper to combine deterministic and AI findings into final quality payload.
   */
  private buildFinalPayload(
    id: string,
    questionId: string,
    aiOutput: any,
    deterministicFindings: SocialQualityFinding[],
    confidence: number,
    assessmentMethod: SocialQualityAssessmentMethod,
    aiCallsCount: number,
    invarianceReport: SocialInvarianceReport,
    generatedAt: string
  ): SocialQualityAssessmentPayload {
    // Answer Integrity is 100 since deterministic pre-checks passed cleanly
    const dimensionScores: Record<SocialQualityDimension, number> = {
      [SocialQualityDimension.ANSWER_INTEGRITY]: 100,
      [SocialQualityDimension.CLARITY]: Math.round(aiOutput.scores.clarity),
      [SocialQualityDimension.CURIOSITY]: Math.round(aiOutput.scores.curiosity),
      [SocialQualityDimension.CHALLENGE_QUALITY]: Math.round(aiOutput.scores.challengeQuality),
      [SocialQualityDimension.COMMENTABILITY]: Math.round(aiOutput.scores.commentability),
      [SocialQualityDimension.RETENTION_POTENTIAL]: Math.round(aiOutput.scores.retentionPotential),
      [SocialQualityDimension.REAL_LIFE_RELEVANCE]: Math.round(aiOutput.scores.realLifeRelevance),
      [SocialQualityDimension.SOCIAL_PRESENTATION]: Math.round(aiOutput.scores.socialPresentation),
      [SocialQualityDimension.LANGUAGE_QUALITY]: Math.round(aiOutput.scores.languageQuality),
      [SocialQualityDimension.AUDIENCE_SUITABILITY]: Math.round(aiOutput.scores.audienceSuitability),
      [SocialQualityDimension.REPETITION_RISK]: Math.round(aiOutput.scores.repetitionRisk),
      [SocialQualityDimension.AUDIENCE_APPEAL]: Math.round(aiOutput.scores.audienceAppeal),
    };

    // Calculate composite weighted score
    let overallScore = 0;
    for (const d of Object.keys(QUALITY_DIMENSION_WEIGHTS) as SocialQualityDimension[]) {
      overallScore += (dimensionScores[d] || 0) * QUALITY_DIMENSION_WEIGHTS[d];
    }
    overallScore = Math.round(overallScore);

    // Map AI findings
    const aiFindings: SocialQualityFinding[] = (aiOutput.findings || []).map((f: any, idx: number) => ({
      id: `FIND-AI-${Date.now()}-${idx + 1}`,
      dimension: (f.dimension as SocialQualityDimension) || SocialQualityDimension.CURIOSITY,
      severity: f.severity === 'BLOCKING' ? SocialQualityFindingSeverity.BLOCKING : SocialQualityFindingSeverity.ADVISORY,
      code: f.code || 'AI_FINDING',
      message: f.message || '',
      context: f.context,
      suggestedFix: f.suggestedFix,
    }));

    const allFindings = [...deterministicFindings, ...aiFindings];
    const blockingFindings = allFindings.filter((f) => f.severity === SocialQualityFindingSeverity.BLOCKING);
    const advisoryFindings = allFindings.filter((f) => f.severity === SocialQualityFindingSeverity.ADVISORY);

    // Determine Status
    let status: SocialQualityStatus;
    if (blockingFindings.length > 0 || overallScore < 60) {
      status = SocialQualityStatus.REJECTED;
    } else if (overallScore >= 90) {
      status = SocialQualityStatus.EXCELLENT;
    } else if (overallScore >= 75) {
      status = SocialQualityStatus.GOOD;
    } else {
      status = SocialQualityStatus.NEEDS_IMPROVEMENT;
    }

    const recommendations = aiOutput.recommendations || [];

    return {
      id,
      questionId,
      overallScore,
      status,
      dimensionScores,
      blockingFindings,
      advisoryFindings,
      recommendations,
      confidence,
      assessmentMethod,
      aiCallsCount,
      invarianceReport,
      generatedAt,
    };
  }
}

export const socialQualityService = SocialQualityService.getInstance();
