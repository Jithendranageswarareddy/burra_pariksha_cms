/**
 * BURRA PARIKSHA CMS - Blind Verifier Types & Provider Contracts
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Defines strictly isolated, leak-proof data transfer objects and provider interfaces
 * for independent blind solving of aptitude questions.
 */

import { QuestionLanguage, MathematicalLogicalResult } from '../../../types';
import { AIErrorClassification } from '../error';

export interface VerifierProviderOptions {
  modelId?: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  requestId?: string;
}

/**
 * BlindVerifierInputDTO
 * 
 * STRICT LEAK-PROOF CONTRACT:
 * Contains ONLY the problem statement and the 4 options.
 * 
 * MUST NEVER CONTAIN:
 * - correctAnswer
 * - explanation
 * - speedTrick / Burra Trick
 * - validationStatus
 * - generatorConfidence
 * - generatorMetadata
 * - previousVerifierResult
 */
export interface BlindVerifierInputDTO {
  readonly questionText: string;
  readonly options: {
    readonly a: string;
    readonly b: string;
    readonly c: string;
    readonly d: string;
  };
  readonly language: QuestionLanguage;
  readonly categoryName?: string;
  readonly topicName?: string;
  readonly subtopicName?: string;
}

/**
 * BlindVerifierOutputDTO
 * 
 * Raw evidence produced by the independent verifier.
 * The verifier acts as an examinee and DERIVES the solution.
 * It NEVER determines the final CMS approval status.
 */
export interface BlindVerifierOutputDTO {
  readonly solvedOption: 'A' | 'B' | 'C' | 'D' | 'UNSOLVABLE' | 'MULTIPLE';
  readonly derivedValue?: string;
  readonly independentProof: string;
  readonly confidence: number; // 0.0 to 1.0
  readonly isSolvable: boolean;
  readonly hasMultipleValidOptions: boolean;
  readonly validOptions?: ('A' | 'B' | 'C' | 'D')[];
  readonly notes?: string;
}

/**
 * Dedicated Provider-Neutral Blind Verifier Interface.
 * Completely decoupled from AIProvider and QuestionValidatorProvider.
 */
export interface BlindVerifierProvider {
  readonly providerId: string;
  readonly modelId: string;
  isConfigured(): boolean;
  verifyCandidateBlind(
    input: BlindVerifierInputDTO,
    options?: VerifierProviderOptions
  ): Promise<BlindVerifierOutputDTO>;
}

export type ArbitrationVerdict = 'VALID' | 'NEEDS_REVIEW' | 'INVALID';

/**
 * Server-side arbitration result comparing generator candidate,
 * blind verifier evidence, and deterministic solvers.
 */
export interface BlindVerificationArbitrationResult {
  readonly verdict: ArbitrationVerdict;
  readonly agreement: boolean;
  readonly generatorAnswer: string;
  readonly verifierAnswer: string;
  readonly deterministicContradiction: boolean;
  readonly deterministicResult?: MathematicalLogicalResult;
  readonly confidenceScore: number;
  readonly reasoning: string;
  readonly failureReason?: string;
  readonly details?: string;
  readonly verifierEvidence?: BlindVerifierOutputDTO;
  readonly timestamp: string;
}
