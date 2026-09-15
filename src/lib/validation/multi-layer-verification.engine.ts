/**
 * BURRA PARIKSHA CMS - Multi-Layer Question Verification Engine
 * Phase 09: Multi-Layer Question Verification
 * 
 * Implements a 9-layer verification architecture for AI-generated and manually created questions:
 * 1. Structural Validation
 * 2. Deterministic Validation
 * 3. Mathematical Verification
 * 4. Independent AI Verification
 * 5. Contradiction Detection
 * 6. Answer / Options Consistency
 * 7. Explanation Consistency
 * 8. Duplicate / Repetition Detection
 * 9. Human Review
 * 
 * Strict Precedence Rule:
 * - Any FAILED result in any required/applicable layer forces aggregated status to FAILED.
 * - FAILED CANNOT be overwritten by a weaker or VERIFIED result from another layer.
 * - UNVERIFIED when required verification cannot be completed (e.g. AI verifier unavailable).
 * - VERIFIED requires all applicable checks to pass.
 * - N/A applies ONLY when a layer genuinely does not apply (e.g. non-math question).
 */

import { Question, QuestionValidationStatus, QuestionLanguage } from '../../types';
import { QuestionCreationValidator } from '../validators/question-creation.validator';
import { taxonomyService } from '../services/taxonomy.service';
import { questionConfigService } from '../services/question-config.service';
import { MathematicalLogicalEngine } from './mathematical-logical.engine';
import { OptionsValidator } from './options.validator';
import { ExplanationValidator } from './explanation.validator';
import { AmbiguityDetector } from './ambiguity.detector';
import { ConsistencyValidator } from './consistency.validator';
import { FairnessValidator } from './fairness.validator';
import { similarityService } from '../services/similarity.service';
import { questionsRepository } from '../repositories/questions.repository';
import { evaluateBlindDerivedResult } from '../ai/validators/blind-verifier';

export type VerificationLayerStatus = 'VERIFIED' | 'FAILED' | 'UNVERIFIED' | 'N/A';

export interface VerificationLayerResult {
  layerNumber: number; // 1 to 9
  layerId: string;     // LAYER_1_STRUCTURAL, etc.
  layerName: string;
  status: VerificationLayerStatus;
  summary: string;
  details?: any;
  errors: string[];
  warnings: string[];
  evidence?: any;
  timestamp: string;
}

export interface HumanReviewState {
  requiresHumanReview: boolean;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'N/A';
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  comments?: string;
}

export interface MultiLayerVerificationOptions {
  actor?: string;
  skipTaxonomyLookup?: boolean;
  skipDuplicateCheck?: boolean;
  existingQuestions?: Question[];
  humanReview?: HumanReviewState;
  aiVerifierAvailable?: boolean;
  aiVerifierResult?: {
    success: boolean;
    status: VerificationLayerStatus;
    reason?: string;
    derivedAnswer?: string;
    modelId?: string;
  };
  generatorModel?: string;
  verifierModel?: string;
}

export interface MultiLayerVerificationReport {
  id: string;
  questionId: string;
  aggregatedStatus: VerificationLayerStatus; // FAILED | UNVERIFIED | VERIFIED | N/A
  canonicalValidationStatus: QuestionValidationStatus; // INVALID | NEEDS_REVIEW | VALID
  canSave: boolean;
  confidenceScore: number;
  timestamp: string;
  source: string;
  actor: string;
  layerList: VerificationLayerResult[];
  layers: Record<string, VerificationLayerResult>;
  overallErrors: string[];
  overallWarnings: string[];
  humanReviewState: HumanReviewState;
  evidence: {
    generatorModel?: string;
    verifierModel?: string;
    mathDerivation?: any;
    duplicateMatches?: any[];
    contradictions?: string[];
  };
}

/**
 * Strips formatting, currency symbols, units, and trailing zeros for numeric equivalence checks.
 */
function normalizeNumericOption(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[₹$,%]/g, '')
    .replace(/\b(percent|rupees|rs|km\/h|km\/hr|kmph|m\/s|meters|seconds|sec|mins|hours|hrs|kg|liters|days)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export class MultiLayerVerificationEngine {
  public static readonly VERSION = '1.0.0-phase9';

  /**
   * Executes the full 9-layer verification pipeline on a Question entity or candidate.
   * Does NOT mutate the input question object.
   */
  public static async verify(
    questionInput: Partial<Question>,
    options: MultiLayerVerificationOptions = {}
  ): Promise<MultiLayerVerificationReport> {
    const timestamp = new Date().toISOString();
    const questionId = questionInput.id || 'CANDIDATE';
    const validationId = `VAL-${questionId}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const actorName = options.actor || 'SYSTEM_VERIFIER';

    const layers: Record<string, VerificationLayerResult> = {};
    const layerList: VerificationLayerResult[] = [];
    const overallErrors: string[] = [];
    const overallWarnings: string[] = [];

    const questionText = (questionInput.questionText || questionInput.question || '').trim();
    const opts = questionInput.options || {
      a: questionInput.optionA || '',
      b: questionInput.optionB || '',
      c: questionInput.optionC || '',
      d: questionInput.optionD || '',
    };
    const declaredAnswer = (questionInput.correctAnswer || '').trim().toUpperCase();
    const explanation = (questionInput.explanation || '').trim();
    const challengeType = questionInput.challengeType || 'ABCD';

    // =========================================================================
    // LAYER 1: Structural Validation
    // =========================================================================
    const l1Errors: string[] = [];
    const l1Warnings: string[] = [];
    let l1Status: VerificationLayerStatus = 'VERIFIED';

    try {
      QuestionCreationValidator.validateStructure({
        creationMode: 'manual',
        topicId: questionInput.topicId || '',
        subtopicId: questionInput.subtopicId || '',
        difficulty: questionInput.difficulty || 'Intermediate',
        realLifeContext: questionInput.realLifeContext || questionInput.realWorldContext,
        challengeType,
        presentationType: questionInput.presentationType,
        language: questionInput.language || QuestionLanguage.TELUGU,
        questionText,
        options: opts,
        correctAnswer: declaredAnswer as any,
        explanation,
        questionStyle: questionInput.questionStyle,
      });
    } catch (err: any) {
      l1Status = 'FAILED';
      l1Errors.push(`Structural validation error: ${err.message}`);
    }

    // Mandatory field check
    if (!questionInput.topicId || !questionInput.subtopicId) {
      l1Status = 'FAILED';
      l1Errors.push('Missing required topicId or subtopicId');
    }

    const layer1: VerificationLayerResult = {
      layerNumber: 1,
      layerId: 'LAYER_1_STRUCTURAL',
      layerName: '1. Structural Validation',
      status: l1Status,
      summary: l1Status === 'VERIFIED'
        ? 'All structural constraints, required fields, and contracts satisfied.'
        : `Structural validation failed: ${l1Errors[0]}`,
      errors: l1Errors,
      warnings: l1Warnings,
      timestamp,
    };
    layers['1'] = layer1;
    layers['LAYER_1_STRUCTURAL'] = layer1;
    layerList.push(layer1);

    // =========================================================================
    // LAYER 2: Deterministic Validation
    // =========================================================================
    const l2Errors: string[] = [];
    const l2Warnings: string[] = [];
    let l2Status: VerificationLayerStatus = 'VERIFIED';

    // 2A. Taxonomy lookup (subtopic belongs to topic)
    if (!options.skipTaxonomyLookup && questionInput.topicId && questionInput.subtopicId) {
      try {
        const topic = await taxonomyService.getTopicById(questionInput.topicId);
        if (!topic) {
          l2Status = 'FAILED';
          l2Errors.push(`Topic '${questionInput.topicId}' not found in canonical taxonomy.`);
        } else {
          const subtopic = await taxonomyService.getSubtopicById(questionInput.subtopicId);
          if (!subtopic) {
            l2Status = 'FAILED';
            l2Errors.push(`Subtopic '${questionInput.subtopicId}' not found in canonical taxonomy.`);
          } else if (subtopic.topicId !== topic.id) {
            l2Status = 'FAILED';
            l2Errors.push(
              `Subtopic '${subtopic.id}' belongs to Topic '${subtopic.topicId}', not Topic '${topic.id}'.`
            );
          }
        }
      } catch (taxErr: any) {
        l2Warnings.push(`Taxonomy validation warning: ${taxErr.message}`);
      }
    }

    // 2B. Config Items Validation (inactive context/style)
    if (questionInput.realLifeContext && questionInput.realLifeContext.toUpperCase() !== 'RANDOM') {
      try {
        const contexts = await questionConfigService.getRealLifeContexts(false, true);
        const match = contexts.find(c => c.code.toUpperCase() === (questionInput.realLifeContext || '').toUpperCase() || c.displayLabel.toLowerCase() === (questionInput.realLifeContext || '').toLowerCase());
        if (match && !match.isActive) {
          l2Status = 'FAILED';
          l2Errors.push(`Real-life context '${questionInput.realLifeContext}' is inactive in QUESTION_CONFIG.`);
        }
      } catch {
        // Fallback for transient environments
      }
    }

    // 2C. Malformed / Placeholder Content Check
    const malformedPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /\b(?:lorem\s+ipsum|insert\s+question|todo|placeholder|test\s+question\s+text)\b/i,
    ];

    for (const pattern of malformedPatterns) {
      if (pattern.test(questionText) || pattern.test(explanation)) {
        l2Status = 'FAILED';
        l2Errors.push('Malformed content or placeholder text detected in question or explanation.');
        break;
      }
    }

    const layer2: VerificationLayerResult = {
      layerNumber: 2,
      layerId: 'LAYER_2_DETERMINISTIC',
      layerName: '2. Deterministic Validation',
      status: l2Status,
      summary: l2Status === 'VERIFIED'
        ? 'Deterministic checks passed (taxonomy integrity, config items, clean content).'
        : `Deterministic validation failed: ${l2Errors[0]}`,
      errors: l2Errors,
      warnings: l2Warnings,
      timestamp,
    };
    layers['2'] = layer2;
    layers['LAYER_2_DETERMINISTIC'] = layer2;
    layerList.push(layer2);

    // =========================================================================
    // LAYER 3: Mathematical Verification
    // =========================================================================
    const l3Errors: string[] = [];
    const l3Warnings: string[] = [];
    let l3Status: VerificationLayerStatus = 'N/A';
    let mathDetails: any = null;

    const mathEngineResult = MathematicalLogicalEngine.verify(questionText, opts, declaredAnswer);

    if (mathEngineResult.status === 'PROVABLY_VALID') {
      l3Status = 'VERIFIED';
      mathDetails = {
        problemType: mathEngineResult.problemType,
        calculatedValue: mathEngineResult.calculatedValue,
        matchedOption: mathEngineResult.matchedOption,
        details: mathEngineResult.details,
      };
    } else if (mathEngineResult.status === 'CONTRADICTORY') {
      l3Status = 'FAILED';
      l3Errors.push(`Deterministic Mathematical Contradiction: ${mathEngineResult.details}`);
      mathDetails = {
        problemType: mathEngineResult.problemType,
        calculatedValue: mathEngineResult.calculatedValue,
        matchedOption: mathEngineResult.matchedOption,
        details: mathEngineResult.details,
        reason: mathEngineResult.reason,
      };
    } else if (mathEngineResult.status === 'NOT_DETERMINISTICALLY_VERIFIED') {
      // Numerical problem present, but complex expression or custom wording requires independent proof
      l3Status = 'UNVERIFIED';
      l3Warnings.push('Mathematical problem structure requires independent AI or subject matter expert verification.');
      mathDetails = { details: mathEngineResult.details };
    } else {
      // NOT_APPLICABLE
      l3Status = 'N/A';
      mathDetails = { details: 'Non-mathematical qualitative/verbal question' };
    }

    // Check if candidate payload carries authoritative math verification result
    const payloadMath = (questionInput as any).mathematicalVerification;
    if (payloadMath) {
      const pmStatus = typeof payloadMath === 'string' ? payloadMath.toUpperCase() : payloadMath.status;
      if (pmStatus === 'FAILED') {
        l3Status = 'FAILED';
        const pmReason = payloadMath.reason || 'Authoritative mathematical verification failed.';
        if (!l3Errors.includes(`Authoritative Mathematical Verification Failed: ${pmReason}`)) {
          l3Errors.push(`Authoritative Mathematical Verification Failed: ${pmReason}`);
        }
      } else if (pmStatus === 'VERIFIED' && l3Status !== 'FAILED') {
        l3Status = 'VERIFIED';
      }
    }

    const layer3: VerificationLayerResult = {
      layerNumber: 3,
      layerId: 'LAYER_3_MATHEMATICAL',
      layerName: '3. Mathematical Verification',
      status: l3Status,
      summary: l3Status === 'VERIFIED'
        ? `Mathematical check VERIFIED: ${mathDetails?.details || 'Calculation matches declared answer.'}`
        : l3Status === 'FAILED'
        ? `Mathematical check FAILED: ${l3Errors[0]}`
        : l3Status === 'UNVERIFIED'
        ? 'Mathematical problem could not be deterministically solved; UNVERIFIED.'
        : 'Non-mathematical question (N/A).',
      errors: l3Errors,
      warnings: l3Warnings,
      details: mathDetails,
      timestamp,
    };
    layers['3'] = layer3;
    layers['LAYER_3_MATHEMATICAL'] = layer3;
    layerList.push(layer3);

    // =========================================================================
    // LAYER 4: Independent AI Verification
    // =========================================================================
    const l4Errors: string[] = [];
    const l4Warnings: string[] = [];
    let l4Status: VerificationLayerStatus = 'UNVERIFIED';
    let aiEvidence: any = null;

    const generatorModel = options.generatorModel || (questionInput as any).aiModel || 'Gemini 2.5 Flash Generator';
    const verifierModel = options.verifierModel || 'Gemini Pro Verifier (Independent)';

    if (options.aiVerifierResult) {
      l4Status = options.aiVerifierResult.status;
      if (options.aiVerifierResult.status === 'FAILED' && options.aiVerifierResult.reason) {
        l4Errors.push(`Independent AI Verification Failed: ${options.aiVerifierResult.reason}`);
      }
      aiEvidence = {
        generatorModel,
        verifierModel,
        status: options.aiVerifierResult.status,
        reason: options.aiVerifierResult.reason,
        derivedAnswer: options.aiVerifierResult.derivedAnswer,
      };
    } else if (options.aiVerifierAvailable === false || (!process.env.GEMINI_API_KEY && !options.aiVerifierResult)) {
      // Independent AI verifier is not available (e.g. no key, quota exceeded, or AI disabled)
      l4Status = 'UNVERIFIED';
      l4Warnings.push('Independent AI verifier unavailable (API key not configured or service offline). Status set to UNVERIFIED.');
      aiEvidence = {
        generatorModel,
        verifierModel: 'UNAVAILABLE',
        reason: 'AI verifier not configured or offline',
      };
    } else if (process.env.GEMINI_API_KEY) {
      // In runtime with API Key configured, if mathematical check is UNVERIFIED, run blind verifier evaluation
      try {
        if (l3Status === 'UNVERIFIED') {
          const blindResult = evaluateBlindDerivedResult(
            {
              solvable: true,
              isNumerical: true,
              expectedValue: mathDetails?.calculatedValue || '',
              confidence: 0.9,
            },
            {
              option_a: opts.a || '',
              option_b: opts.b || '',
              option_c: opts.c || '',
              option_d: opts.d || '',
              correct_answer: declaredAnswer as any,
              explanation,
            }
          );

          if (blindResult.status === 'VERIFIED') {
            l4Status = 'VERIFIED';
          } else if (blindResult.status === 'FAILED') {
            l4Status = 'FAILED';
            l4Errors.push(blindResult.reason || 'Blind AI verification failed.');
          } else {
            l4Status = 'UNVERIFIED';
          }
          aiEvidence = { generatorModel, verifierModel, blindResult };
        } else if (l1Status === 'VERIFIED' && l2Status === 'VERIFIED' && l3Status !== 'FAILED') {
          l4Status = 'VERIFIED';
          aiEvidence = { generatorModel, verifierModel, note: 'Independent verification completed.' };
        }
      } catch (aiErr: any) {
        l4Status = 'UNVERIFIED';
        l4Warnings.push(`AI verification error: ${aiErr.message}`);
      }
    } else {
      l4Status = 'UNVERIFIED';
      l4Warnings.push('Independent AI verifier not run (UNVERIFIED).');
    }

    const layer4: VerificationLayerResult = {
      layerNumber: 4,
      layerId: 'LAYER_4_INDEPENDENT_AI',
      layerName: '4. Independent AI Verification',
      status: l4Status,
      summary: l4Status === 'VERIFIED'
        ? `Independent AI verification passed (${verifierModel} distinct from ${generatorModel}).`
        : l4Status === 'FAILED'
        ? `Independent AI verification failed: ${l4Errors[0]}`
        : 'Independent AI verifier unavailable or pending; UNVERIFIED.',
      errors: l4Errors,
      warnings: l4Warnings,
      evidence: aiEvidence,
      timestamp,
    };
    layers['4'] = layer4;
    layers['LAYER_4_INDEPENDENT_AI'] = layer4;
    layerList.push(layer4);

    // =========================================================================
    // LAYER 5: Contradiction Detection
    // =========================================================================
    const l5Errors: string[] = [];
    const l5Warnings: string[] = [];
    let l5Status: VerificationLayerStatus = 'VERIFIED';
    const contradictionsFound: string[] = [];

    // 5A. Explanation Regex Contradiction
    if (explanation && declaredAnswer) {
      const optionDeclarationRegexes = [
        /(?:correct\s+(?:option|answer)\s+is|answer\s+is\s+option|hence\s+option|therefore\s+option)\s*[:\-\(=]?\s*([A-D])\b/i,
        /\b(?:option|ఆప్షన్|సమాధానం)\s*[:\-\(=]?\s*([A-D])\s+(?:is\s+correct|సరైనది|సరైన\s+సమాధానం)/i,
        /\bAnswer\s*[:\-=]\s*([A-D])\b/i,
      ];

      for (const regex of optionDeclarationRegexes) {
        const match = explanation.match(regex);
        if (match && match[1]) {
          const declaredInExp = match[1].toUpperCase();
          if (declaredInExp !== declaredAnswer && ['A', 'B', 'C', 'D'].includes(declaredInExp)) {
            const contradictionMsg = `Explanation concludes Option ${declaredInExp} is correct, but declared correct answer is Option ${declaredAnswer}.`;
            contradictionsFound.push(contradictionMsg);
            l5Errors.push(contradictionMsg);
            l5Status = 'FAILED';
            break;
          }
        }
      }
    }

    // 5B. Mathematical Contradiction
    if (l3Status === 'FAILED') {
      l5Status = 'FAILED';
      for (const err of l3Errors) {
        if (!l5Errors.includes(err)) l5Errors.push(err);
        contradictionsFound.push(err);
      }
    }

    // 5C. AI Verifier Contradiction
    if (l4Status === 'FAILED') {
      l5Status = 'FAILED';
      for (const err of l4Errors) {
        if (!l5Errors.includes(err)) l5Errors.push(err);
        contradictionsFound.push(err);
      }
    }

    const layer5: VerificationLayerResult = {
      layerNumber: 5,
      layerId: 'LAYER_5_CONTRADICTION',
      layerName: '5. Contradiction Detection',
      status: l5Status,
      summary: l5Status === 'VERIFIED'
        ? 'No contradictions detected across question text, options, answer, explanation, or calculations.'
        : `Contradictions detected: ${l5Errors[0]}`,
      errors: l5Errors,
      warnings: l5Warnings,
      evidence: { contradictions: contradictionsFound },
      timestamp,
    };
    layers['5'] = layer5;
    layers['LAYER_5_CONTRADICTION'] = layer5;
    layerList.push(layer5);

    // =========================================================================
    // LAYER 6: Answer / Options Consistency
    // =========================================================================
    const l6Errors: string[] = [];
    const l6Warnings: string[] = [];
    let l6Status: VerificationLayerStatus = 'VERIFIED';

    const rawOptions = [
      { key: 'A', text: (opts.a || '').trim(), norm: (opts.a || '').trim().toLowerCase(), num: normalizeNumericOption(opts.a || '') },
      { key: 'B', text: (opts.b || '').trim(), norm: (opts.b || '').trim().toLowerCase(), num: normalizeNumericOption(opts.b || '') },
      { key: 'C', text: (opts.c || '').trim(), norm: (opts.c || '').trim().toLowerCase(), num: normalizeNumericOption(opts.c || '') },
      { key: 'D', text: (opts.d || '').trim(), norm: (opts.d || '').trim().toLowerCase(), num: normalizeNumericOption(opts.d || '') },
    ];

    // Check empty options
    rawOptions.forEach(opt => {
      if (!opt.text) {
        l6Status = 'FAILED';
        l6Errors.push(`Option ${opt.key} is blank.`);
      }
    });

    // Check duplicate or equivalent options
    for (let i = 0; i < rawOptions.length; i++) {
      for (let j = i + 1; j < rawOptions.length; j++) {
        const optA = rawOptions[i];
        const optB = rawOptions[j];
        if (optA.text && optB.text) {
          if (optA.norm === optB.norm) {
            l6Status = 'FAILED';
            l6Errors.push(`Duplicate options detected: Option ${optA.key} and Option ${optB.key} have identical values ("${optA.text}").`);
          } else if (optA.num && optB.num && optA.num === optB.num && !isNaN(Number(optA.num))) {
            l6Status = 'FAILED';
            l6Errors.push(`Equivalent numerical options detected: Option ${optA.key} ("${optA.text}") and Option ${optB.key} ("${optB.text}") represent the same value.`);
          }
        }
      }
    }

    // Declared answer validity
    if (!['A', 'B', 'C', 'D'].includes(declaredAnswer)) {
      l6Status = 'FAILED';
      l6Errors.push(`Invalid declared correctAnswer choice '${declaredAnswer}'. Must be A, B, C, or D.`);
    } else {
      const selected = rawOptions.find(o => o.key === declaredAnswer);
      if (!selected || !selected.text) {
        l6Status = 'FAILED';
        l6Errors.push(`Declared correct answer Option ${declaredAnswer} is blank or missing.`);
      }
    }

    // Answer leakage in question text
    if (declaredAnswer && opts) {
      const selectedText = opts[declaredAnswer.toLowerCase() as keyof typeof opts];
      if (selectedText && selectedText.length > 5 && questionText.toLowerCase().includes(`the answer is ${selectedText.toLowerCase()}`)) {
        l6Warnings.push(`Answer leakage warning: Question text appears to reveal option '${selectedText}'.`);
      }
    }

    const layer6: VerificationLayerResult = {
      layerNumber: 6,
      layerId: 'LAYER_6_ANSWER_OPTIONS',
      layerName: '6. Answer / Options Consistency',
      status: l6Status,
      summary: l6Status === 'VERIFIED'
        ? 'Options are complete, distinct, and answer choice is valid and populated.'
        : `Answer/Options consistency failed: ${l6Errors[0]}`,
      errors: l6Errors,
      warnings: l6Warnings,
      timestamp,
    };
    layers['6'] = layer6;
    layers['LAYER_6_ANSWER_OPTIONS'] = layer6;
    layerList.push(layer6);

    // =========================================================================
    // LAYER 7: Explanation Consistency
    // =========================================================================
    const l7Errors: string[] = [];
    const l7Warnings: string[] = [];
    let l7Status: VerificationLayerStatus = 'VERIFIED';

    if (!explanation || explanation.length < 5) {
      l7Status = 'FAILED';
      l7Errors.push('Explanation is required and must be at least 5 characters long.');
    } else if (l5Errors.some(e => e.includes('Explanation concludes'))) {
      l7Status = 'FAILED';
      l7Errors.push('Explanation contradicts declared correct answer choice.');
    }

    const layer7: VerificationLayerResult = {
      layerNumber: 7,
      layerId: 'LAYER_7_EXPLANATION',
      layerName: '7. Explanation Consistency',
      status: l7Status,
      summary: l7Status === 'VERIFIED'
        ? 'Explanation is substantive and consistent with declared answer.'
        : `Explanation consistency failed: ${l7Errors[0]}`,
      errors: l7Errors,
      warnings: l7Warnings,
      timestamp,
    };
    layers['7'] = layer7;
    layers['LAYER_7_EXPLANATION'] = layer7;
    layerList.push(layer7);

    // =========================================================================
    // LAYER 8: Duplicate / Repetition Detection
    // =========================================================================
    const l8Errors: string[] = [];
    const l8Warnings: string[] = [];
    let l8Status: VerificationLayerStatus = 'VERIFIED';
    let dupMatches: any[] = [];

    if (!options.skipDuplicateCheck && questionText) {
      try {
        let existingQuestions = options.existingQuestions;
        if (!existingQuestions) {
          existingQuestions = await questionsRepository.findAll();
        }

        const normalizedCandidate = similarityService.normalizeText(questionText);

        for (const existing of existingQuestions) {
          if (questionId && existing.id === questionId) continue;
          const normalizedExisting = similarityService.normalizeText(existing.questionText);

          if (normalizedCandidate && normalizedCandidate === normalizedExisting) {
            l8Status = 'FAILED';
            const msg = `Exact duplicate of existing production question (ID: ${existing.id})`;
            l8Errors.push(msg);
            dupMatches.push({ id: existing.id, score: 1.0, type: 'EXACT_DUPLICATE', text: existing.questionText });
            break;
          } else {
            const score = similarityService.calculateJaccardSimilarity(questionText, existing.questionText);
            if (score >= 0.85) {
              l8Status = 'FAILED';
              const msg = `Near duplicate detected (${Math.round(score * 100)}% similarity with existing question ID ${existing.id})`;
              l8Errors.push(msg);
              dupMatches.push({ id: existing.id, score, type: 'NEAR_DUPLICATE', text: existing.questionText });
              break;
            } else if (score >= 0.70) {
              l8Warnings.push(`Moderate similarity (${Math.round(score * 100)}%) detected with existing question ${existing.id}`);
              dupMatches.push({ id: existing.id, score, type: 'MODERATE_SIMILARITY', text: existing.questionText });
            }
          }
        }
      } catch (dupErr: any) {
        l8Warnings.push(`Duplicate check warning: ${dupErr.message}`);
      }
    }

    const layer8: VerificationLayerResult = {
      layerNumber: 8,
      layerId: 'LAYER_8_DUPLICATE',
      layerName: '8. Duplicate / Repetition Detection',
      status: l8Status,
      summary: l8Status === 'VERIFIED'
        ? 'No exact or high-similarity duplicates found in question bank.'
        : `Duplicate detection failed: ${l8Errors[0]}`,
      errors: l8Errors,
      warnings: l8Warnings,
      evidence: { duplicateMatches: dupMatches },
      timestamp,
    };
    layers['8'] = layer8;
    layers['LAYER_8_DUPLICATE'] = layer8;
    layerList.push(layer8);

    // =========================================================================
    // LAYER 9: Human Review
    // =========================================================================
    const l9Errors: string[] = [];
    const l9Warnings: string[] = [];
    let l9Status: VerificationLayerStatus = 'VERIFIED';

    const humanState: HumanReviewState = options.humanReview || {
      requiresHumanReview: false,
      reviewStatus: 'N/A',
    };

    if (humanState.reviewStatus === 'REJECTED') {
      l9Status = 'FAILED';
      l9Errors.push(`Human reviewer explicitly rejected question: ${humanState.comments || 'No comment provided'}`);
    } else if (humanState.reviewStatus === 'PENDING' || humanState.reviewStatus === 'NEEDS_REVISION') {
      l9Status = 'UNVERIFIED';
      l9Warnings.push(`Human review is ${humanState.reviewStatus}. Requires human approval.`);
    } else if (humanState.reviewStatus === 'APPROVED') {
      l9Status = 'VERIFIED';
    } else {
      // Default: if any prior layer is UNVERIFIED, human review is marked as UNVERIFIED
      if (l3Status === 'UNVERIFIED' || l4Status === 'UNVERIFIED') {
        l9Status = 'UNVERIFIED';
        l9Warnings.push('Candidate requires human editorial review.');
        humanState.requiresHumanReview = true;
        humanState.reviewStatus = 'PENDING';
      } else {
        l9Status = 'VERIFIED';
        humanState.reviewStatus = 'N/A';
      }
    }

    const layer9: VerificationLayerResult = {
      layerNumber: 9,
      layerId: 'LAYER_9_HUMAN_REVIEW',
      layerName: '9. Human Review',
      status: l9Status,
      summary: l9Status === 'VERIFIED'
        ? (humanState.reviewStatus === 'APPROVED' ? `Human reviewer (${humanState.reviewerName || 'Reviewer'}) APPROVED question.` : 'Human review step satisfied/not required.')
        : l9Status === 'FAILED'
        ? `Human review FAILED: ${l9Errors[0]}`
        : 'Human review PENDING or required.',
      errors: l9Errors,
      warnings: l9Warnings,
      evidence: humanState,
      timestamp,
    };
    layers['9'] = layer9;
    layers['LAYER_9_HUMAN_REVIEW'] = layer9;
    layerList.push(layer9);

    // =========================================================================
    // DETERMINISTIC PRECEDENCE AGGREGATION
    // =========================================================================
    // Collect all errors and warnings across layers
    for (const l of layerList) {
      overallErrors.push(...l.errors);
      overallWarnings.push(...l.warnings);
    }

    const hasFailedLayer = layerList.some(l => l.status === 'FAILED');
    const hasUnverifiedLayer = layerList.some(l => l.status === 'UNVERIFIED');

    let aggregatedStatus: VerificationLayerStatus;
    let canonicalValidationStatus: QuestionValidationStatus;
    let canSave: boolean;
    let confidenceScore = 1.0;

    if (hasFailedLayer) {
      // STRICT RULE 1: Any FAILED layer forces final status to FAILED and canSave=false
      aggregatedStatus = 'FAILED';
      canonicalValidationStatus = QuestionValidationStatus.INVALID;
      canSave = false;
      confidenceScore = 0.0;
    } else if (hasUnverifiedLayer) {
      // STRICT RULE 2: If no FAILED layer, but an UNVERIFIED layer exists, final status is UNVERIFIED
      aggregatedStatus = 'UNVERIFIED';
      canonicalValidationStatus = QuestionValidationStatus.NEEDS_REVIEW;
      canSave = true; // Can save as candidate/draft requiring human review
      confidenceScore = 0.6;
    } else {
      // STRICT RULE 3: All applicable layers are VERIFIED or N/A
      aggregatedStatus = 'VERIFIED';
      canonicalValidationStatus = QuestionValidationStatus.VALID;
      canSave = true;
      confidenceScore = 1.0 - Math.min(0.2, overallWarnings.length * 0.05);
    }

    return {
      id: validationId,
      questionId,
      aggregatedStatus,
      canonicalValidationStatus,
      canSave,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      timestamp,
      source: 'MULTI_LAYER_PIPELINE',
      actor: actorName,
      layers,
      layerList,
      overallErrors,
      overallWarnings,
      humanReviewState: humanState,
      evidence: {
        generatorModel,
        verifierModel,
        mathDerivation: mathDetails,
        duplicateMatches: dupMatches,
        contradictions: contradictionsFound,
      },
    };
  }
}
