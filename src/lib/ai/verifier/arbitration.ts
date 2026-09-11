/**
 * BURRA PARIKSHA CMS - Blind Verifier Server-Side Arbitration Engine
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Enforces the frozen server-side arbitration rules comparing Generator candidate,
 * Blind Verifier output, and Deterministic solver truth.
 * 
 * STRICT ARBITRATION HIERARCHY:
 * 1. Structural invalidity -> INVALID
 * 2. Deterministic mathematical contradiction -> INVALID (Authoritative Veto)
 * 3. Verifier failure / timeout / malformed -> NEEDS_REVIEW (Never VALID)
 * 4. Verifier UNSOLVABLE -> NEEDS_REVIEW
 * 5. Verifier MULTIPLE -> NEEDS_REVIEW
 * 6. Generator answer != Verifier answer -> NEEDS_REVIEW
 * 7. Generator answer == Verifier answer -> VALID (Deterministic checks pass; confidence is advisory)
 */

import { QuestionCandidate } from '../types';
import {
  BlindVerifierOutputDTO,
  BlindVerificationArbitrationResult,
  ArbitrationVerdict,
} from './types';
import { CandidateValidationReport } from '../validators/candidate.validator';
import { MathematicalLogicalResult } from '../../../types';

export interface ArbitrationInput {
  candidate: QuestionCandidate;
  candidateValidation?: CandidateValidationReport;
  deterministicResult?: MathematicalLogicalResult;
  verifierOutput?: BlindVerifierOutputDTO | null;
  verifierError?: string | null;
  deterministicContradiction?: boolean;
}

export class VerifierArbitrationEngine {
  /**
   * Arbitrates between candidate, verifier evidence, and deterministic checks.
   * Pure function: Does NOT mutate database or Question entities.
   */
  public static arbitrate(input: ArbitrationInput): BlindVerificationArbitrationResult {
    const timestamp = new Date().toISOString();
    const declaredAnswer = (input.candidate.correct_answer || '').trim().toUpperCase();

    // 1. Structural Invalidity Check
    if (input.candidateValidation && !input.candidateValidation.isValid) {
      return {
        verdict: 'INVALID',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer: 'N/A',
        deterministicContradiction: false,
        deterministicResult: input.deterministicResult,
        confidenceScore: 0,
        reasoning: 'Candidate failed deterministic structural or option schema validation.',
        details: input.candidateValidation.errors.join('; '),
        timestamp,
      };
    }

    // 2. Deterministic Contradiction Check (Authoritative Veto)
    const isContradiction = Boolean(
      input.deterministicContradiction ||
      input.deterministicResult?.status === 'CONTRADICTORY' ||
      input.candidateValidation?.mathematicalVerification?.status === 'FAILED'
    );

    if (isContradiction) {
      const contradictionReason =
        input.deterministicResult?.details ||
        input.deterministicResult?.reason ||
        input.candidateValidation?.mathematicalVerification?.reason ||
        'Mathematical derivation contradiction';

      return {
        verdict: 'INVALID',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer: input.verifierOutput?.solvedOption || 'N/A',
        deterministicContradiction: true,
        deterministicResult: input.deterministicResult,
        confidenceScore: 0,
        reasoning: 'Deterministic solver proved a mathematical contradiction. Independent calculation overrides model output.',
        details: contradictionReason,
        verifierEvidence: input.verifierOutput || undefined,
        timestamp,
      };
    }

    // 3. Verifier Provider Failure / Timeout / Unavailable Check
    if (input.verifierError || !input.verifierOutput) {
      return {
        verdict: 'NEEDS_REVIEW',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer: 'ERROR',
        deterministicContradiction: false,
        deterministicResult: input.deterministicResult,
        confidenceScore: 0,
        reasoning: 'Blind verifier was unavailable, timed out, or encountered a provider exception. Flagged for human review.',
        failureReason: input.verifierError || 'Verifier output missing',
        timestamp,
      };
    }

    const verifier = input.verifierOutput;
    const verifierAnswer = (verifier.solvedOption || '').trim().toUpperCase();

    // 4. Verifier Flagged UNSOLVABLE Check
    if (verifierAnswer === 'UNSOLVABLE' || !verifier.isSolvable) {
      return {
        verdict: 'NEEDS_REVIEW',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer: 'UNSOLVABLE',
        deterministicContradiction: false,
        deterministicResult: input.deterministicResult,
        confidenceScore: verifier.confidence,
        reasoning: 'Blind verifier determined the question statement lacks essential constraints or data to be solved definitively.',
        details: verifier.notes || verifier.independentProof,
        verifierEvidence: verifier,
        timestamp,
      };
    }

    // 5. Verifier Flagged MULTIPLE Valid Options Check
    if (verifierAnswer === 'MULTIPLE' || verifier.hasMultipleValidOptions) {
      return {
        verdict: 'NEEDS_REVIEW',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer: 'MULTIPLE',
        deterministicContradiction: false,
        deterministicResult: input.deterministicResult,
        confidenceScore: verifier.confidence,
        reasoning: 'Blind verifier detected that more than one option is mathematically or logically defensible.',
        details: verifier.validOptions?.join(', ') || verifier.notes,
        verifierEvidence: verifier,
        timestamp,
      };
    }

    // 6. Generator vs Verifier Agreement Check
    const hasAgreement = declaredAnswer === verifierAnswer;

    if (!hasAgreement) {
      return {
        verdict: 'NEEDS_REVIEW',
        agreement: false,
        generatorAnswer: declaredAnswer,
        verifierAnswer,
        deterministicContradiction: false,
        deterministicResult: input.deterministicResult,
        confidenceScore: verifier.confidence,
        reasoning: `Model consensus conflict: Generator declared Option ${declaredAnswer}, but Blind Verifier derived Option ${verifierAnswer}.`,
        details: `Verifier derivation: ${verifier.independentProof.slice(0, 300)}`,
        verifierEvidence: verifier,
        timestamp,
      };
    }

    // 7. Unanimous Verified Pass (Option B Frozen Policy)
    // Agreement holds, deterministic checks passed (PROVABLY_VALID, NOT_DETERMINISTICALLY_VERIFIED, or NOT_APPLICABLE), verifier evidence valid.
    // Confidence is preserved as an advisory safety signal on the result.
    const deterministicNote = input.deterministicResult
      ? ` [Deterministic: ${input.deterministicResult.status}]`
      : '';

    return {
      verdict: 'VALID',
      agreement: true,
      generatorAnswer: declaredAnswer,
      verifierAnswer,
      deterministicContradiction: false,
      deterministicResult: input.deterministicResult,
      confidenceScore: verifier.confidence,
      reasoning: `Unanimous agreement: Blind Verifier independently derived Option ${declaredAnswer} (confidence: ${verifier.confidence})${deterministicNote}.`,
      details: verifier.derivedValue ? `Derived: ${verifier.derivedValue}` : undefined,
      verifierEvidence: verifier,
      timestamp,
    };
  }
}
