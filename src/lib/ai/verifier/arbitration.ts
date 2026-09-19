/**
 * BURRA PARIKSHA CMS - Multi-Provider Arbitration Engine
 * Verifies consensus and resolves discrepancies across multiple AI provider outputs.
 */

import { QuestionCandidate } from '../types';

export interface ArbitrationInput {
  candidate: QuestionCandidate | Record<string, any>;
  verifications?: Array<{
    providerId: string;
    verifiedAnswer?: string;
    isCorrect?: boolean;
    confidence?: number;
    notes?: string;
  }>;
}

export interface ArbitrationResult {
  declaredAnswer: string;
  consensusAnswer?: string;
  isConsensus: boolean;
  confidenceScore: number;
  providerAgreements: Record<string, boolean>;
  decisionNotes: string;
}

export class ArbitrationEngine {
  /**
   * Arbitrates answers and verifies consistency across multiple AI verifiers.
   */
  public static arbitrate(input: ArbitrationInput): ArbitrationResult {
    const declaredAnswer = ((input.candidate as any).correct_answer || (input.candidate as any).correctAnswer || '').trim().toUpperCase();

    const verifications = input.verifications || [];
    const providerAgreements: Record<string, boolean> = {};
    let matchingCount = 0;

    for (const v of verifications) {
      const vAns = (v.verifiedAnswer || '').trim().toUpperCase();
      const isMatch = vAns === declaredAnswer || (v.isCorrect === true && !vAns);
      providerAgreements[v.providerId] = isMatch;
      if (isMatch) {
        matchingCount++;
      }
    }

    const total = verifications.length;
    const confidenceScore = total > 0 ? matchingCount / total : 1.0;
    const isConsensus = total === 0 || confidenceScore >= 0.5;

    return {
      declaredAnswer,
      consensusAnswer: declaredAnswer,
      isConsensus,
      confidenceScore,
      providerAgreements,
      decisionNotes: isConsensus
        ? `Consensus established with ${matchingCount}/${total} verifiers supporting declared answer ${declaredAnswer}.`
        : `Discrepancy detected: only ${matchingCount}/${total} verifiers supported declared answer ${declaredAnswer}.`,
    };
  }
}

export const arbitrationEngine = ArbitrationEngine;
