/**
 * BURRA PARIKSHA CMS - Multi-Model Consensus & Conflict Engine
 * Phase 5: Question Validation Engine (Multi-Model Interface & Consensus)
 * 
 * Rules:
 * 1. Provider-neutral evidence aggregation
 * 2. If providers conflict (e.g. Model A = VALID, Model B = INVALID) -> triggers NEEDS_REVIEW with conflict explanation
 * 3. CRITICAL OVERRIDE: Deterministic contradictions ALWAYS override any model consensus. An LLM can NEVER override deterministic truth.
 */

import {
  Question,
  QuestionValidatorProvider,
  ValidationEvidence,
  ValidationCheckItem,
  QuestionValidationStatus,
} from '../../types';

export interface ConsensusEvaluationResult {
  hasConflict: boolean;
  evidence: ValidationEvidence[];
  checks: ValidationCheckItem[];
  suggestedStatus?: QuestionValidationStatus;
  conflictDetails?: string;
}

export class ConsensusEngine {
  public static async evaluateProviders(
    question: Question,
    providers: QuestionValidatorProvider[] = [],
    deterministicContradiction: boolean = false
  ): Promise<ConsensusEvaluationResult> {
    const checks: ValidationCheckItem[] = [];
    const evidence: ValidationEvidence[] = [];

    if (!providers || providers.length === 0) {
      return {
        hasConflict: false,
        evidence: [],
        checks: [],
      };
    }

    // Collect evidence from all configured providers
    for (const provider of providers) {
      try {
        const item = await provider.validate(question);
        evidence.push(item);
      } catch (err: any) {
        evidence.push({
          providerId: provider.providerId,
          modelId: provider.modelId,
          verdict: 'NEEDS_REVIEW',
          confidence: 0,
          reasoningSummary: `Provider execution error: ${err?.message || 'Unknown error'}`,
          detectedIssues: ['PROVIDER_EXCEPTION'],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check for conflicts
    const verdicts = evidence.map((e) => e.verdict);
    const hasValid = verdicts.includes('VALID');
    const hasInvalid = verdicts.includes('INVALID');
    const hasConflict = hasValid && hasInvalid;

    let conflictDetails: string | undefined;
    let suggestedStatus: QuestionValidationStatus | undefined;

    if (deterministicContradiction) {
      // Deterministic contradiction trumps all model consensus
      checks.push({
        id: 'CHK_MODEL_CONSENSUS',
        name: 'Multi-Model Consensus & Deterministic Truth Overrule',
        category: 'MODEL_CONSENSUS',
        status: 'FAIL',
        message: 'Deterministic mathematical/logical contradiction overrules model verdicts.',
        details: 'Deterministic contradiction detected. Regardless of model verdicts, deterministic falsification is authoritative.',
      });
      suggestedStatus = QuestionValidationStatus.INVALID;
    } else if (hasConflict) {
      conflictDetails = `Model Consensus Conflict: Providers disagreed on question validity [${evidence.map((e) => `${e.providerId}/${e.modelId}: ${e.verdict}`).join(', ')}].`;
      checks.push({
        id: 'CHK_MODEL_CONSENSUS',
        name: 'Multi-Model Consensus & Conflict Gate',
        category: 'MODEL_CONSENSUS',
        status: 'WARN',
        message: conflictDetails,
        details: 'Divergent model evaluations require human-in-the-loop editorial review.',
      });
      suggestedStatus = QuestionValidationStatus.NEEDS_REVIEW;
    } else if (verdicts.every((v) => v === 'VALID')) {
      checks.push({
        id: 'CHK_MODEL_CONSENSUS',
        name: 'Multi-Model Consensus & Conflict Gate',
        category: 'MODEL_CONSENSUS',
        status: 'PASS',
        message: `Unanimous agreement across ${evidence.length} validation provider(s).`,
      });
      suggestedStatus = QuestionValidationStatus.VALID;
    } else if (verdicts.every((v) => v === 'INVALID')) {
      checks.push({
        id: 'CHK_MODEL_CONSENSUS',
        name: 'Multi-Model Consensus & Conflict Gate',
        category: 'MODEL_CONSENSUS',
        status: 'FAIL',
        message: `Unanimous rejection across ${evidence.length} validation provider(s).`,
      });
      suggestedStatus = QuestionValidationStatus.INVALID;
    } else {
      suggestedStatus = QuestionValidationStatus.NEEDS_REVIEW;
    }

    return {
      hasConflict,
      evidence,
      checks,
      suggestedStatus,
      conflictDetails,
    };
  }
}
