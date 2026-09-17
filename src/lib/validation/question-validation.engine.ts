/**
 * BURRA PARIKSHA CMS - Question Validation Engine
 * Phase 5: Question Validation Engine (Stages 1 - 10)
 * 
 * Production-ready validation pipeline for determining whether a Question
 * (created manually or via AI) is structurally, mathematically/logically,
 * and semantically valid.
 */

import {
  Question,
  ValidationResult,
  ValidationCheckItem,
  QuestionValidationStatus,
  QuestionValidatorProvider,
  ValidationSource,
} from '../../types';
import { QuestionCreationValidator } from '../validators/question-creation.validator';
import { taxonomyService } from '../services/taxonomy.service';
import { OptionsValidator } from './options.validator';
import { MathematicalLogicalEngine } from './mathematical-logical.engine';
import { ExplanationValidator } from './explanation.validator';
import { AmbiguityDetector } from './ambiguity.detector';
import { ConsistencyValidator } from './consistency.validator';
import { FairnessValidator } from './fairness.validator';
import { ConsensusEngine } from './consensus.engine';
import { SemanticReasoningProvider } from '../ai/validators/semantic-reasoning.provider';
import { MultiLayerVerificationEngine } from './multi-layer-verification.engine';

export interface ValidationPipelineOptions {
  providers?: QuestionValidatorProvider[];
  source?: ValidationSource;
  actor?: string;
  skipTaxonomyLookup?: boolean;
  skipDuplicateCheck?: boolean;
}

export class QuestionValidationEngine {
  public static readonly VALIDATOR_VERSION = '1.0.0';
  public static readonly VALIDATION_RULE_VERSION = '2026.09.v1';

  /**
   * Executes the full 10-stage validation pipeline on a Question entity or candidate.
   */
  public static async validate(
    question: Question,
    options: ValidationPipelineOptions = {}
  ): Promise<ValidationResult> {
    // Resolve canonical questionText across aliases before validation
    const normalizedQuestionText = (
      question.questionText ||
      (question as any).question ||
      (question as any).content ||
      ''
    ).trim();

    try {
      question.questionText = normalizedQuestionText;
    } catch (e) {
      // Ignore if the object is frozen/read-only
    }

    const checks: ValidationCheckItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const validationId = `VAL-${question.id || 'CANDIDATE'}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const questionId = question.id || 'TEMP-QUESTION';
    const challengeType = question.challengeType || 'ABCD';
    const opts = question.options || { a: '', b: '', c: '', d: '' };
    const declaredAnswer = (question.correctAnswer || '').trim().toUpperCase();

    // =========================================================================
    // STAGE 1: Structural Validation (reusing QuestionCreationValidator)
    // =========================================================================
    let hasStructuralError = false;
    try {
      QuestionCreationValidator.validateStructure({
        creationMode: 'manual',
        topicId: question.topicId,
        subtopicId: question.subtopicId,
        difficulty: question.difficulty,
        realLifeContext: question.realLifeContext || question.realWorldContext,
        challengeType,
        presentationType: question.presentationType,
        language: question.language || 'TELUGU',
        questionText: normalizedQuestionText,
        options: opts,
        correctAnswer: declaredAnswer as any,
        explanation: question.explanation,
      });

      checks.push({
        id: 'CHK_STAGE_1_STRUCTURAL',
        name: 'Structural Baseline Validation',
        category: 'STRUCTURAL',
        status: 'PASS',
        message: 'All mandatory question fields, lengths, and option structures satisfy structural schemas.',
      });
    } catch (err: any) {
      hasStructuralError = true;
      errors.push(`Structural Validation Error: ${err.message}`);
      checks.push({
        id: 'CHK_STAGE_1_STRUCTURAL',
        name: 'Structural Baseline Validation',
        category: 'STRUCTURAL',
        status: 'FAIL',
        message: err.message || 'Question failed structural schema validation.',
      });
    }

    // =========================================================================
    // STAGE 2: Taxonomy Validation (reusing Phase 3 taxonomyService)
    // =========================================================================
    let hasTaxonomyError = false;
    if (!options.skipTaxonomyLookup && question.topicId && question.subtopicId) {
      try {
        const topic = await taxonomyService.getTopicById(question.topicId);
        if (!topic) {
          hasTaxonomyError = true;
          errors.push(`Taxonomy Error: Topic '${question.topicId}' not found in canonical taxonomy.`);
          checks.push({
            id: 'CHK_STAGE_2_TAXONOMY',
            name: 'Taxonomy Integrity Verification',
            category: 'TAXONOMY',
            status: 'FAIL',
            message: `Topic ID '${question.topicId}' does not exist.`,
          });
        } else {
          const subtopic = await taxonomyService.getSubtopicById(question.subtopicId);
          if (!subtopic) {
            hasTaxonomyError = true;
            errors.push(`Taxonomy Error: Subtopic '${question.subtopicId}' not found in canonical taxonomy.`);
            checks.push({
              id: 'CHK_STAGE_2_TAXONOMY',
              name: 'Taxonomy Integrity Verification',
              category: 'TAXONOMY',
              status: 'FAIL',
              message: `Subtopic ID '${question.subtopicId}' does not exist.`,
            });
          } else if (subtopic.topicId !== topic.id) {
            hasTaxonomyError = true;
            errors.push(
              `Taxonomy Integrity Mismatch: Subtopic '${subtopic.id}' (${subtopic.name}) belongs to Topic '${subtopic.topicId}', not Topic '${topic.id}' (${topic.name}).`
            );
            checks.push({
              id: 'CHK_STAGE_2_TAXONOMY',
              name: 'Taxonomy Integrity Verification',
              category: 'TAXONOMY',
              status: 'FAIL',
              message: `Subtopic '${subtopic.id}' does not belong to specified Topic '${topic.id}'.`,
            });
          } else {
            checks.push({
              id: 'CHK_STAGE_2_TAXONOMY',
              name: 'Taxonomy Integrity Verification',
              category: 'TAXONOMY',
              status: 'PASS',
              message: `Verified parent topic '${topic.name}' and subtopic '${subtopic.name}'.`,
            });
          }
        }
      } catch (taxErr: any) {
        // In transient environments without full sheet taxonomy, fallback gracefully
        warnings.push(`Taxonomy check note: ${taxErr.message}`);
        checks.push({
          id: 'CHK_STAGE_2_TAXONOMY',
          name: 'Taxonomy Integrity Verification',
          category: 'TAXONOMY',
          status: 'WARN',
          message: `Taxonomy lookup yielded notice: ${taxErr.message}`,
        });
      }
    } else {
      checks.push({
        id: 'CHK_STAGE_2_TAXONOMY',
        name: 'Taxonomy Integrity Verification',
        category: 'TAXONOMY',
        status: 'PASS',
        message: 'Taxonomy identifiers present.',
      });
    }

    // =========================================================================
    // STAGE 3: Option & Answer Validation
    // =========================================================================
    const optionsVal = OptionsValidator.validate(challengeType, opts, declaredAnswer);
    checks.push(...optionsVal.checks);
    errors.push(...optionsVal.errors);
    warnings.push(...optionsVal.warnings);

    // =========================================================================
    // STAGE 4: Mathematical & Logical Validation
    // =========================================================================
    const mathLogical = MathematicalLogicalEngine.verify(question.questionText, opts, declaredAnswer);
    const authoritativeMath = (question as any).mathematicalVerification;

    let answerVerified = false;
    let mathematicalContradiction = false;

    if (mathLogical.status === 'PROVABLY_VALID') {
      answerVerified = true;
      checks.push({
        id: 'CHK_STAGE_4_MATH_LOGIC',
        name: 'Deterministic Mathematical & Logical Truth Verification',
        category: 'MATHEMATICAL',
        status: 'PASS',
        message: `Provably Valid: Independent calculation verified ${mathLogical.calculatedValue} (${mathLogical.problemType}) matching declared answer ${declaredAnswer}.`,
        details: mathLogical.details,
      });
    } else if (mathLogical.status === 'CONTRADICTORY') {
      mathematicalContradiction = true;
      errors.push(`Deterministic Mathematical Contradiction: ${mathLogical.details}`);
      checks.push({
        id: 'CHK_STAGE_4_MATH_LOGIC',
        name: 'Deterministic Mathematical & Logical Truth Verification',
        category: 'MATHEMATICAL',
        status: 'FAIL',
        message: mathLogical.details,
        details: mathLogical.reason,
      });
    } else if (authoritativeMath?.status === 'FAILED') {
      mathematicalContradiction = true;
      const failReason = authoritativeMath.reason || 'Authoritative mathematical verification failed.';
      errors.push(`Authoritative Mathematical Verification Failed: ${failReason}`);
      checks.push({
        id: 'CHK_STAGE_4_MATH_LOGIC',
        name: 'Authoritative Mathematical & Logical Truth Verification',
        category: 'MATHEMATICAL',
        status: 'FAIL',
        message: failReason,
        details: authoritativeMath.solutionDerivation || authoritativeMath.details,
      });
    } else if (mathLogical.status === 'NOT_DETERMINISTICALLY_VERIFIED') {
      if (authoritativeMath?.status === 'VERIFIED') {
        answerVerified = true;
        checks.push({
          id: 'CHK_STAGE_4_MATH_LOGIC',
          name: 'Authoritative Mathematical & Logical Truth Verification',
          category: 'MATHEMATICAL',
          status: 'PASS',
          message: `Provably Valid (Verified via Blind Verifier): matching declared answer ${declaredAnswer}.`,
          details: authoritativeMath.solutionDerivation || authoritativeMath.details,
        });
      } else {
        warnings.push('Problem structure contains numerical or specialized logic requiring human subject-matter review.');
        recommendations.push('Assign to subject matter expert for manual proof step verification.');
        checks.push({
          id: 'CHK_STAGE_4_MATH_LOGIC',
          name: 'Deterministic Mathematical & Logical Truth Verification',
          category: 'MATHEMATICAL',
          status: 'NEEDS_REVIEW',
          message: 'Problem could not be solved by deterministic engines; human review recommended.',
          details: mathLogical.details,
        });
      }
    } else {
      // NOT_APPLICABLE
      checks.push({
        id: 'CHK_STAGE_4_MATH_LOGIC',
        name: 'Deterministic Mathematical & Logical Truth Verification',
        category: 'MATHEMATICAL',
        status: 'NOT_APPLICABLE',
        message: 'Non-numerical question (verbal reasoning or qualitative concept).',
      });
    }

    // =========================================================================
    // STAGE 5: Explanation Validation
    // =========================================================================
    const explanationVal = ExplanationValidator.validate(
      question.explanation,
      declaredAnswer,
      mathLogical.calculatedValue
    );
    checks.push(explanationVal.check);
    errors.push(...explanationVal.errors);
    warnings.push(...explanationVal.warnings);

    // =========================================================================
    // STAGE 6: Ambiguity Detection
    // =========================================================================
    const ambiguityVal = AmbiguityDetector.detect(question.questionText, opts, declaredAnswer);
    checks.push(ambiguityVal.check);
    if (ambiguityVal.result.isAmbiguous) {
      warnings.push(...ambiguityVal.reasons);
      recommendations.push('Clarify problem constraints or variable units to remove ambiguity.');
    }

    // =========================================================================
    // STAGE 7: Consistency Validation (Context & Language)
    // =========================================================================
    const consistencyVal = ConsistencyValidator.validate(
      question.questionText,
      opts,
      question.explanation,
      question.realLifeContext || question.realWorldContext,
      question.language
    );
    checks.push(...consistencyVal.checks);
    errors.push(...consistencyVal.errors);
    warnings.push(...consistencyVal.warnings);

    // =========================================================================
    // STAGE 8: Fairness, Sanity & Answer Leakage
    // =========================================================================
    const fairnessVal = FairnessValidator.validate(question.questionText, opts, declaredAnswer);
    checks.push(...fairnessVal.checks);
    errors.push(...fairnessVal.errors);
    warnings.push(...fairnessVal.warnings);

    // =========================================================================
    // Conditionally filter SemanticReasoningProvider if not needed
    // "semantic AI should run only when semantic reasoning is actually needed"
    // =========================================================================
    const isDeterministic = mathLogical.status === 'PROVABLY_VALID' || mathLogical.status === 'CONTRADICTORY';
    const needsSemanticAI = !isDeterministic && (
      mathLogical.status === 'NOT_APPLICABLE' ||
      mathLogical.status === 'NOT_DETERMINISTICALLY_VERIFIED' ||
      ambiguityVal.result.isAmbiguous ||
      explanationVal.check.status === 'FAIL'
    );

    let activeProviders = options.providers || [];
    if (!needsSemanticAI) {
      activeProviders = activeProviders.filter(p => p.providerId !== 'semantic-reasoning-verifier');
    }

    // =========================================================================
    // STAGE 9: Multi-Model Consensus (if providers configured)
    // =========================================================================
    const consensusResult = await ConsensusEngine.evaluateProviders(
      question,
      activeProviders,
      mathematicalContradiction
    );
    checks.push(...consensusResult.checks);
    if (consensusResult.hasConflict) {
      warnings.push(consensusResult.conflictDetails || 'Model consensus conflict detected.');
      recommendations.push('Resolve conflicting model assessments via human reviewer.');
    }

    // =========================================================================
    // STAGE 10: Confidence Aggregation & Final Validation Decision
    // =========================================================================
    let confidenceScore = 1.0;

    // Fatal contradiction or structural error drops confidence to 0
    let hasFatalFailure =
      hasStructuralError ||
      hasTaxonomyError ||
      !optionsVal.isValid ||
      mathematicalContradiction ||
      explanationVal.result.contradictsAnswer ||
      fairnessVal.errors.length > 0 ||
      errors.length > 0;

    if (hasFatalFailure) {
      confidenceScore = 0.0;
    } else {
      // Deduct for warnings
      confidenceScore -= warnings.length * 0.1;

      // Cap confidence if ambiguity detected
      if (ambiguityVal.result.isAmbiguous) {
        confidenceScore = Math.min(confidenceScore, 0.5);
      }

      // Cap confidence if model conflict
      if (consensusResult.hasConflict) {
        confidenceScore = Math.min(confidenceScore, 0.6);
      }
    }

    // Determine Final Status
    // Run Multi-Layer Verification Engine for full 9-layer report & strict precedence rules
    const multiLayerReport = await MultiLayerVerificationEngine.verify(question, {
      actor: options.actor,
      skipTaxonomyLookup: options.skipTaxonomyLookup,
      skipDuplicateCheck: options.skipDuplicateCheck,
    });

    const realAuthoritativeMath = multiLayerReport.layers['LAYER_4_INDEPENDENT_AI'];

    // Update the mathematical check if the independent AI verification ran
    const mathLogicCheck = checks.find(c => c.id === 'CHK_STAGE_4_MATH_LOGIC');
    if (mathLogicCheck && mathLogicCheck.status === 'NEEDS_REVIEW' && realAuthoritativeMath) {
      if (realAuthoritativeMath.status === 'VERIFIED') {
        mathLogicCheck.status = 'PASS';
        mathLogicCheck.name = 'Authoritative Mathematical & Logical Truth Verification';
        mathLogicCheck.message = 'Provably Valid (Verified via Blind Verifier)';
        answerVerified = true;
      } else if (realAuthoritativeMath.status === 'FAILED') {
        mathLogicCheck.status = 'FAIL';
        mathLogicCheck.name = 'Authoritative Mathematical & Logical Truth Verification';
        mathLogicCheck.message = 'Independent Mathematical Verification Failed';
        mathLogicCheck.details = realAuthoritativeMath.errors?.join('; ') || 'Blind AI derivation failed.';
        mathematicalContradiction = true; // Crucial for aggregation
        hasFatalFailure = true;
      }
    }

    if (!hasFatalFailure) {
      // Cap confidence if unmodeled math AND AI failed to verify it
      if (mathLogical.status === 'NOT_DETERMINISTICALLY_VERIFIED' && realAuthoritativeMath?.status !== 'VERIFIED') {
        confidenceScore = Math.min(confidenceScore, 0.7);
      }
      confidenceScore = Math.max(0.1, Math.round(confidenceScore * 100) / 100);
    }

    let finalStatus: QuestionValidationStatus;

    if (hasFatalFailure || multiLayerReport.aggregatedStatus === 'FAILED') {
      finalStatus = QuestionValidationStatus.INVALID;
    } else if (
      multiLayerReport.aggregatedStatus === 'UNVERIFIED' ||
      ambiguityVal.result.isAmbiguous ||
      (mathLogical.status === 'NOT_DETERMINISTICALLY_VERIFIED' && realAuthoritativeMath?.status !== 'VERIFIED') ||
      consensusResult.hasConflict ||
      consensusResult.suggestedStatus === QuestionValidationStatus.INVALID ||
      consensusResult.suggestedStatus === QuestionValidationStatus.NEEDS_REVIEW ||
      confidenceScore < 0.8
    ) {
      finalStatus = QuestionValidationStatus.NEEDS_REVIEW;
    } else {
      finalStatus = QuestionValidationStatus.VALID;
    }

    // Combine any multi-layer errors
    for (const err of multiLayerReport.overallErrors) {
      if (!errors.includes(err)) errors.push(err);
    }
    for (const warn of multiLayerReport.overallWarnings) {
      if (!warnings.includes(warn)) warnings.push(warn);
    }

    // Summary narrative
    let summary: string;
    if (finalStatus === QuestionValidationStatus.VALID) {
      summary = `Question successfully validated as VALID (Confidence: ${(confidenceScore * 100).toFixed(0)}%). All verification stages passed.`;
    } else if (finalStatus === QuestionValidationStatus.INVALID) {
      summary = `Question rejected as INVALID due to ${errors.length} error(s): ${errors[0] || 'Verification failed.'}`;
    } else {
      summary = `Question flagged as NEEDS_REVIEW (Confidence: ${(confidenceScore * 100).toFixed(0)}%). Requires human editorial review.`;
    }

    const answerVerification = {
      isConsistent: !mathematicalContradiction && !explanationVal.result.contradictsAnswer,
      declaredAnswer,
      verifiedAnswer: mathLogical.matchedOption || (answerVerified ? declaredAnswer : undefined),
      matchedOption: mathLogical.matchedOption,
      details: mathematicalContradiction
        ? `Contradiction detected: Expected ${mathLogical.calculatedValue} (Option ${mathLogical.matchedOption}), but declared Option ${declaredAnswer}.`
        : answerVerified
        ? `Option ${declaredAnswer} mathematically proven correct.`
        : 'Declared answer passed basic structural checks.',
      contradictionDetected: mathematicalContradiction,
    };

    const source: ValidationSource =
      options.source ||
      (options.providers && options.providers.length > 1
        ? 'MULTI_MODEL_CONSENSUS'
        : options.providers && options.providers.length === 1
        ? 'AI_ASSISTED'
        : 'DETERMINISTIC');

    return {
      id: validationId,
      questionId,
      status: finalStatus,
      confidenceScore: finalStatus === QuestionValidationStatus.INVALID ? 0 : confidenceScore,
      validatorVersion: QuestionValidationEngine.VALIDATOR_VERSION,
      validationRuleVersion: QuestionValidationEngine.VALIDATION_RULE_VERSION,
      timestamp: new Date().toISOString(),
      source,
      summary,
      checks,
      errors,
      warnings,
      recommendations,
      answerVerification,
      explanationVerification: explanationVal.result,
      ambiguityResult: ambiguityVal.result,
      mathematicalLogicalResult: mathLogical,
      modelEvidence: consensusResult.evidence,
      layers: multiLayerReport.layers,
      layerList: multiLayerReport.layerList,
      aggregatedLayerStatus: multiLayerReport.aggregatedStatus,
      humanReviewState: multiLayerReport.humanReviewState,
      isStale: false,
      validatedBy: options.actor || 'SYSTEM_VALIDATOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

  }
}
